/**
 * Equipment Shop System
 *
 * Handles shop types, pricing, availability rules, and inventory generation
 * based on location (city/country) stats.
 */

import { Weapon, Armor, Gadget, CostLevel, Availability, COST_VALUES } from './equipmentTypes';
import { ALL_WEAPONS } from './weapons';
import { ALL_ARMOR } from './armor';
import { Country } from './allCountries';
import { getCountryByCity } from './countries';
import { City, getCityByName } from './cities';
import { calculateBlackMarket, BlackMarketSystem } from './combinedEffects';
import { getTimeEngine, areShopsOpen as checkShopHours, TimeOfDay } from './timeEngine';

// ==================== SHOP TYPES ====================

export type ShopType =
  | 'general'      // Common items, licensed goods
  | 'military'     // Military surplus, specialized gear
  | 'blackmarket'  // Restricted, military-only, alien tech
  | 'tech'         // High-tech, specialized electronics
  | 'police'       // Law enforcement equipment
  | 'medical';     // Medical supplies (future)

export interface Shop {
  id: string;
  name: string;
  type: ShopType;
  cityName: string;
  countryCode: string;

  // What this shop can sell
  allowedAvailability: Availability[];

  // Pricing modifiers
  markupMultiplier: number;   // 1.0 = base price, 1.5 = 50% markup
  sellbackRate: number;       // 0.5 = sell for 50% of buy price

  // Quality tier (affects what items appear)
  qualityTier: 1 | 2 | 3 | 4;

  // CS-004: Extended data for combined effects
  blackMarketData?: BlackMarketSystem;
}

// ==================== CITY TYPE REQUIREMENTS (CS-001) ====================

/**
 * City types that ENABLE certain shop types.
 * A shop requires at least one matching city type to appear.
 * 'general' has no requirements (available everywhere).
 *
 * City types: Industrial, Political, Military, Educational, Temple, Mining, Company, Resort, Seaport
 */
export const SHOP_CITY_TYPE_REQUIREMENTS: Record<ShopType, string[]> = {
  general: [], // Available everywhere
  military: ['Military', 'Industrial', 'Seaport'], // Military bases, factories, ports
  blackmarket: ['Seaport', 'Mining', 'Industrial'], // Trade hubs, remote areas, factories
  tech: ['Industrial', 'Educational', 'Company'], // Manufacturing, universities, corporate
  police: ['Political', 'Military', 'Company'], // Government, bases, corporate security
  medical: ['Educational', 'Political', 'Company'], // Universities, government, corporate
};

/**
 * City type bonuses for shops.
 * If city has this type, shop gets quality/price bonus.
 */
export const SHOP_CITY_TYPE_BONUS: Record<string, { shop: ShopType; qualityBonus: number; markupReduction: number }[]> = {
  Military: [
    { shop: 'military', qualityBonus: 1, markupReduction: 0.1 },
  ],
  Industrial: [
    { shop: 'tech', qualityBonus: 1, markupReduction: 0.05 },
    { shop: 'general', qualityBonus: 0, markupReduction: 0.1 },
  ],
  Seaport: [
    { shop: 'blackmarket', qualityBonus: 1, markupReduction: 0.15 },
    { shop: 'general', qualityBonus: 1, markupReduction: 0.1 },
  ],
  Political: [
    { shop: 'police', qualityBonus: 1, markupReduction: 0.05 },
  ],
  Educational: [
    { shop: 'tech', qualityBonus: 1, markupReduction: 0.1 },
    { shop: 'medical', qualityBonus: 1, markupReduction: 0.05 },
  ],
  Company: [
    { shop: 'tech', qualityBonus: 1, markupReduction: 0.05 },
  ],
  Mining: [
    { shop: 'blackmarket', qualityBonus: 0, markupReduction: 0.2 }, // Remote = cheaper illegal
  ],
  Temple: [], // No shop bonuses
  Resort: [
    { shop: 'general', qualityBonus: 1, markupReduction: -0.2 }, // Tourist markup!
  ],
};

// ==================== SHOP AVAILABILITY BY TYPE ====================

/**
 * Maps shop types to what availability classes they stock
 */
export const SHOP_AVAILABILITY: Record<ShopType, Availability[]> = {
  general: ['Abundant', 'Common', 'Licensed', 'Commercial'],
  military: ['Common', 'Military', 'Specialized'],
  blackmarket: ['Common', 'Restricted', 'Military', 'Military_Only', 'Alien_Tech', 'Hacker'],
  tech: ['Common', 'High_Tech', 'Specialized', 'Hacker', 'Security'],
  police: ['Common', 'Law_Enforcement', 'Licensed', 'Security'],
  medical: ['Common', 'Medical'],
};

/**
 * Shop display names and descriptions
 */
export const SHOP_INFO: Record<ShopType, { name: string; emoji: string; description: string }> = {
  general: {
    name: 'General Store',
    emoji: '🏪',
    description: 'Common equipment and licensed goods'
  },
  military: {
    name: 'Military Surplus',
    emoji: '🎖️',
    description: 'Military-grade weapons and tactical gear'
  },
  blackmarket: {
    name: 'Black Market',
    emoji: '🕶️',
    description: 'Restricted and illegal equipment'
  },
  tech: {
    name: 'Tech Shop',
    emoji: '💻',
    description: 'High-tech gadgets and electronics'
  },
  police: {
    name: 'Law Enforcement Supply',
    emoji: '🚔',
    description: 'Police and security equipment'
  },
  medical: {
    name: 'Medical Supply',
    emoji: '⚕️',
    description: 'Medical equipment and supplies'
  },
};

// ==================== PRICING SYSTEM ====================

/**
 * CS-003: Unified price modifiers from country AND city stats
 * Calculates comprehensive price adjustments based on location conditions
 */
export interface PriceModifiers {
  basePriceMultiplier: number;  // From GDP
  taxRate: number;              // From governmentCorruption (inverse)
  supplyChain: number;          // From infrastructure
  riskPremium: number;          // From instability
  blackMarketDiscount: number;  // From corruption + crime + city crimeIndex
  cityBonus: number;            // Additional modifier from city stats
  total: number;                // Combined multiplier
}

/**
 * Calculate price modifiers from country stats AND city crime/safety
 * High crime cities = better black market deals
 */
export function calculatePriceModifiers(country: Country, shopType: ShopType, city?: City): PriceModifiers {
  // Base price from GDP (higher GDP = higher prices)
  const basePriceMultiplier = 0.7 + (country.gdpPerCapita / 250); // 0.7x to 1.1x

  // Tax rate (high corruption = less taxes/fees)
  const taxRate = Math.max(0, (100 - country.governmentCorruption) / 400); // 0 to 0.25

  // Supply chain efficiency (poor infrastructure = higher costs)
  const infrastructureScore = country.infrastructure || 50;
  const supplyChain = 1 + ((100 - infrastructureScore) / 200); // 1.0 to 1.5

  // Risk premium for instability
  const politicalInstability = country.politicalInstability || 0;
  const crime = country.organizedCrime || 0;
  const riskPremium = (politicalInstability + crime) / 400; // 0 to 0.5

  // Black market discount (corruption + crime + CITY crimeIndex reduce prices)
  let blackMarketDiscount = 0;
  let cityBonus = 0;
  if (shopType === 'blackmarket') {
    // Country-level discount (0 to 0.5)
    blackMarketDiscount = (country.governmentCorruption + crime) / 400;

    // CITY-LEVEL BONUS: High crime cities get additional discount (0 to 0.25)
    if (city && city.crimeIndex !== undefined) {
      cityBonus = city.crimeIndex / 400; // Crime 100 = 25% extra discount
      blackMarketDiscount += cityBonus;
    }
  }

  // Calculate total multiplier
  const total = basePriceMultiplier * (1 + taxRate) * supplyChain * (1 + riskPremium) * (1 - blackMarketDiscount);

  return {
    basePriceMultiplier,
    taxRate,
    supplyChain,
    riskPremium,
    blackMarketDiscount,
    cityBonus,
    total: Math.round(total * 100) / 100, // Round to 2 decimal places
  };
}

/**
 * Get buy price for an item at a shop (CS-003: Now uses unified modifiers with city crime)
 */
export function getBuyPrice(item: { costValue: number }, shop: Shop, country?: Country, city?: City): number {
  let finalMultiplier = shop.markupMultiplier;

  if (country) {
    const modifiers = calculatePriceModifiers(country, shop.type, city);
    // Combine shop markup with country+city modifiers (dampened effect)
    finalMultiplier = shop.markupMultiplier * (0.5 + modifiers.total * 0.5);
  }

  return Math.round(item.costValue * finalMultiplier);
}

/**
 * Get sell price for an item at a shop
 */
export function getSellPrice(item: { costValue: number }, shop: Shop): number {
  return Math.round(item.costValue * shop.sellbackRate);
}

/**
 * Check if player can afford item
 */
export function canAfford(budget: number, item: { costValue: number }, shop: Shop): boolean {
  return budget >= getBuyPrice(item, shop);
}

// ==================== SHOP GENERATION ====================

/**
 * Create a shop instance for a city
 */
function createShop(
  type: ShopType,
  cityName: string,
  countryCode: string,
  qualityTier: 1 | 2 | 3 | 4,
  markupMultiplier: number = 1.0
): Shop {
  const info = SHOP_INFO[type];
  return {
    id: `shop_${type}_${cityName.replace(/\s+/g, '_').toLowerCase()}`,
    name: `${info.name} - ${cityName}`,
    type,
    cityName,
    countryCode,
    allowedAvailability: SHOP_AVAILABILITY[type],
    markupMultiplier,
    sellbackRate: 0.5, // Sell for 50% of base value
    qualityTier,
  };
}

/**
 * Get city types as array for checking requirements
 */
function getCityTypes(city: City): string[] {
  return [city.cityType1, city.cityType2, city.cityType3, city.cityType4].filter(Boolean);
}

/**
 * Check if city has any of the required types for a shop
 */
function cityMeetsShopRequirements(city: City, shopType: ShopType): boolean {
  const requirements = SHOP_CITY_TYPE_REQUIREMENTS[shopType];
  if (requirements.length === 0) return true; // No requirements = always available

  const cityTypes = getCityTypes(city);
  return requirements.some((req) => cityTypes.includes(req));
}

/**
 * Get city type bonuses for a shop
 */
function getCityTypeBonus(city: City, shopType: ShopType): { qualityBonus: number; markupReduction: number } {
  const cityTypes = getCityTypes(city);
  let qualityBonus = 0;
  let markupReduction = 0;

  for (const type of cityTypes) {
    const bonuses = SHOP_CITY_TYPE_BONUS[type] || [];
    for (const bonus of bonuses) {
      if (bonus.shop === shopType) {
        qualityBonus = Math.max(qualityBonus, bonus.qualityBonus);
        markupReduction = Math.max(markupReduction, bonus.markupReduction);
      }
    }
  }

  return { qualityBonus, markupReduction };
}

/**
 * Get all shops available in a city based on country stats and city type
 */
export function getShopsForCity(cityName: string): Shop[] {
  const country = getCountryByCity(cityName);
  const city = getCityByName(cityName);

  if (!country) {
    // Return just a basic general store if country not found
    return [createShop('general', cityName, 'XX', 1, 1.0)];
  }

  return getShopsForCityWithCountry(cityName, country, city);
}

/**
 * Get shops with known country data (CS-002: Now checks city types)
 */
export function getShopsForCityWithCountry(cityName: string, country: Country, city?: City): Shop[] {
  const shops: Shop[] = [];

  // Helper to apply city bonuses
  const applyBonuses = (
    shopType: ShopType,
    baseQuality: 1 | 2 | 3 | 4,
    baseMarkup: number
  ): { quality: 1 | 2 | 3 | 4; markup: number } => {
    if (!city) return { quality: baseQuality, markup: baseMarkup };
    const bonus = getCityTypeBonus(city, shopType);
    const quality = Math.min(4, baseQuality + bonus.qualityBonus) as 1 | 2 | 3 | 4;
    const markup = Math.max(0.5, baseMarkup - bonus.markupReduction);
    return { quality, markup };
  };

  // General shop always available
  // Higher GDP = more expensive, better quality
  const generalQuality = getQualityTier(country.gdpPerCapita);
  const generalMarkup = 0.8 + (country.gdpPerCapita / 200); // 0.8x to 1.3x
  const generalBonuses = applyBonuses('general', generalQuality, generalMarkup);
  shops.push(createShop('general', cityName, country.code, generalBonuses.quality, generalBonuses.markup));

  // CS-004: Black market now uses calculateBlackMarket() combined effect + city crime
  const blackMarketData = calculateBlackMarket(country);
  const bmCityAllowed = !city || cityMeetsShopRequirements(city, 'blackmarket');
  if (blackMarketData.available && bmCityAllowed) {
    // Quality from weapon quality range in combined effect
    let bmQuality = blackMarketData.weaponQualityRange[1] as 1 | 2 | 3 | 4;

    // CITY CRIME BONUS: High crime cities get +1 quality tier
    // Crime 60+ = +1 tier (better weapons in dangerous cities)
    if (city && city.crimeIndex !== undefined && city.crimeIndex >= 60) {
      bmQuality = Math.min(4, bmQuality + 1) as 1 | 2 | 3 | 4;
    }

    // Markup from combined effect price modifier
    // CITY CRIME DISCOUNT: Reduce markup in high-crime cities (already in calculatePriceModifiers)
    let bmMarkup = blackMarketData.weaponPriceModifier;
    if (city && city.crimeIndex !== undefined) {
      // Additional 10% discount for crime 50+, up to 20% for crime 80+
      const cityDiscount = Math.min(0.2, Math.max(0, (city.crimeIndex - 40) / 200));
      bmMarkup = Math.max(0.4, bmMarkup - cityDiscount);
    }

    const bmBonuses = applyBonuses('blackmarket', bmQuality, bmMarkup);
    const shop = createShop('blackmarket', cityName, country.code, bmBonuses.quality, bmBonuses.markup);
    // Attach black market data for additional services
    shop.blackMarketData = blackMarketData;
    shops.push(shop);
  }

  // Military surplus: requires military budget/services + city type
  const milCityAllowed = !city || cityMeetsShopRequirements(city, 'military');
  if ((country.militaryBudget >= 40 || country.militaryServices >= 50) && milCityAllowed) {
    const milQuality = getQualityTier(country.militaryBudget);
    const milMarkup = 0.9 + (country.militaryBudget / 250);
    const milBonuses = applyBonuses('military', milQuality, milMarkup);
    shops.push(createShop('military', cityName, country.code, milBonuses.quality, milBonuses.markup));
  }

  // Tech shop: requires science + GDP + city type
  const techCityAllowed = !city || cityMeetsShopRequirements(city, 'tech');
  if (country.science >= 40 && country.gdpPerCapita >= 40 && techCityAllowed) {
    const techQuality = getQualityTier((country.science + country.gdpPerCapita) / 2);
    const techMarkup = 1.0 + (country.science / 200);
    const techBonuses = applyBonuses('tech', techQuality, techMarkup);
    shops.push(createShop('tech', cityName, country.code, techBonuses.quality, techBonuses.markup));
  }

  // Police supply: requires law enforcement + city type
  const policeCityAllowed = !city || cityMeetsShopRequirements(city, 'police');
  if (country.lawEnforcement >= 50 && policeCityAllowed) {
    const policeQuality = getQualityTier(country.lawEnforcement);
    const policeBonuses = applyBonuses('police', policeQuality, 1.1);
    shops.push(createShop('police', cityName, country.code, policeBonuses.quality, policeBonuses.markup));
  }

  // Medical supply: requires healthcare + city type
  const medCityAllowed = !city || cityMeetsShopRequirements(city, 'medical');
  if (country.healthcareAccess >= 50 && medCityAllowed) {
    const medQuality = getQualityTier(country.healthcareAccess);
    const medBonuses = applyBonuses('medical', medQuality, 1.0);
    shops.push(createShop('medical', cityName, country.code, medBonuses.quality, medBonuses.markup));
  }

  return shops;
}

/**
 * Calculate quality tier from a 0-100 stat
 */
function getQualityTier(stat: number): 1 | 2 | 3 | 4 {
  if (stat >= 75) return 4;
  if (stat >= 50) return 3;
  if (stat >= 25) return 2;
  return 1;
}

// ==================== INVENTORY GENERATION ====================

/**
 * Get available weapons for a shop
 */
export function getShopWeapons(shop: Shop): Weapon[] {
  return ALL_WEAPONS.filter(weapon => {
    // Must be an allowed availability
    if (!shop.allowedAvailability.includes(weapon.availability)) {
      return false;
    }

    // Filter by quality tier for expensive items
    const costIndex = ['Free', 'Low', 'Medium', 'High', 'Very_High', 'Ultra_High'].indexOf(weapon.costLevel);
    if (costIndex > shop.qualityTier + 2) {
      return false; // Can't stock items too expensive for this tier
    }

    return true;
  });
}

/**
 * Get available armor for a shop
 */
export function getShopArmor(shop: Shop): Armor[] {
  return ALL_ARMOR.filter(armor => {
    // Must be an allowed availability
    if (!shop.allowedAvailability.includes(armor.availability)) {
      return false;
    }

    // Filter by quality tier for expensive items
    const costIndex = ['Free', 'Low', 'Medium', 'High', 'Very_High', 'Ultra_High'].indexOf(armor.costLevel);
    if (costIndex > shop.qualityTier + 2) {
      return false;
    }

    return true;
  });
}

/**
 * Get all items for a shop (weapons + armor)
 */
export function getShopInventory(shop: Shop): { weapons: Weapon[]; armor: Armor[] } {
  return {
    weapons: getShopWeapons(shop),
    armor: getShopArmor(shop),
  };
}

// ==================== ITEM TYPE HELPERS ====================

export type ItemType = 'weapon' | 'armor' | 'gadget' | 'consumable';

export interface ShopItem {
  id: string;
  name: string;
  type: ItemType;
  costValue: number;
  costLevel: CostLevel;
  availability: Availability;
  emoji: string;
  data: Weapon | Armor | Gadget;
}

/**
 * Convert weapon to ShopItem
 */
export function weaponToShopItem(weapon: Weapon): ShopItem {
  return {
    id: weapon.id,
    name: weapon.name,
    type: 'weapon',
    costValue: weapon.costValue,
    costLevel: weapon.costLevel,
    availability: weapon.availability,
    emoji: weapon.emoji,
    data: weapon,
  };
}

/**
 * Convert armor to ShopItem
 */
export function armorToShopItem(armor: Armor): ShopItem {
  return {
    id: armor.id,
    name: armor.name,
    type: 'armor',
    costValue: armor.costValue,
    costLevel: armor.costLevel,
    availability: armor.availability,
    emoji: armor.emoji,
    data: armor,
  };
}

/**
 * Get all shop items as unified list
 */
export function getAllShopItems(shop: Shop): ShopItem[] {
  const { weapons, armor } = getShopInventory(shop);
  return [
    ...weapons.map(weaponToShopItem),
    ...armor.map(armorToShopItem),
  ];
}

// ==================== AVAILABILITY DISPLAY ====================

/**
 * Get display info for availability type
 */
export const AVAILABILITY_INFO: Record<Availability, { label: string; color: string }> = {
  'Abundant': { label: 'Abundant', color: 'green' },
  'Common': { label: 'Common', color: 'green' },
  'Licensed': { label: 'Licensed', color: 'blue' },
  'Commercial': { label: 'Commercial', color: 'blue' },
  'Restricted': { label: 'Restricted', color: 'yellow' },
  'Specialized': { label: 'Specialized', color: 'yellow' },
  'Military': { label: 'Military', color: 'orange' },
  'Military_Only': { label: 'Military Only', color: 'red' },
  'Law_Enforcement': { label: 'Law Enforcement', color: 'blue' },
  'Medical': { label: 'Medical', color: 'cyan' },
  'High_Tech': { label: 'High-Tech', color: 'purple' },
  'Alien_Tech': { label: 'Alien Tech', color: 'magenta' },
  'Hacker': { label: 'Hacker', color: 'lime' },
  'Security': { label: 'Security', color: 'slate' },
  'VIP': { label: 'VIP', color: 'gold' },
  'Religious': { label: 'Religious', color: 'amber' },
};

/**
 * Format price for display
 */
export function formatPrice(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  }
  return `$${amount}`;
}

// ==================== SHOP HOURS (TA-004) ====================

/**
 * Shop operating hours configuration
 * Different shop types have different hours
 */
export const SHOP_HOURS: Record<ShopType, { open: number; close: number; weekend: boolean }> = {
  general: { open: 8, close: 20, weekend: true },      // 8am-8pm, open weekends
  military: { open: 9, close: 17, weekend: false },     // 9am-5pm, closed weekends
  blackmarket: { open: 18, close: 4, weekend: true },   // 6pm-4am (night hours), open weekends
  tech: { open: 10, close: 19, weekend: true },         // 10am-7pm, open weekends
  police: { open: 8, close: 18, weekend: false },       // 8am-6pm, closed weekends
  medical: { open: 0, close: 24, weekend: true },       // 24/7 emergency services
};

/**
 * Check if a shop is currently open based on game time
 * Uses TimeEngine for current time
 */
export function isShopOpen(shop: Shop): boolean {
  const timeEngine = getTimeEngine();
  const timeOfDay = timeEngine.getTimeOfDay();
  const hour = timeEngine.getHour();
  const isWeekend = timeEngine.isWeekend();

  return isShopOpenAt(shop.type, hour, isWeekend);
}

/**
 * Check if a shop type is open at a specific hour
 */
export function isShopOpenAt(shopType: ShopType, hour: number, isWeekend: boolean): boolean {
  const hours = SHOP_HOURS[shopType];

  // Check weekend closure
  if (isWeekend && !hours.weekend) {
    return false;
  }

  // Special handling for night-time shops (close > open wraps around midnight)
  if (hours.close < hours.open) {
    // Shop open from evening to early morning (e.g., 18-4)
    return hour >= hours.open || hour < hours.close;
  }

  // Normal hours
  return hour >= hours.open && hour < hours.close;
}

/**
 * Get shop status with opening info
 */
export interface ShopStatus {
  isOpen: boolean;
  shopType: ShopType;
  currentHour: number;
  opensAt: number;
  closesAt: number;
  nextOpenIn: number; // Hours until open (0 if open now)
  closingIn: number;  // Hours until close (0 if closed)
  reason?: string;    // Why closed (e.g., "Closed on weekends")
}

/**
 * Get detailed shop status
 */
export function getShopStatus(shop: Shop): ShopStatus {
  const timeEngine = getTimeEngine();
  const hour = timeEngine.getHour();
  const isWeekend = timeEngine.isWeekend();
  const hours = SHOP_HOURS[shop.type];

  const isOpen = isShopOpenAt(shop.type, hour, isWeekend);

  let nextOpenIn = 0;
  let closingIn = 0;
  let reason: string | undefined;

  if (!isOpen) {
    // Calculate when shop opens
    if (isWeekend && !hours.weekend) {
      // Closed for weekend - calculate hours until Monday 00:00
      const hoursLeftToday = 24 - hour;
      const sundayHours = isWeekend ? 24 : 0; // Simple approximation
      nextOpenIn = hoursLeftToday + sundayHours + hours.open;
      reason = 'Closed on weekends';
    } else if (hour < hours.open) {
      nextOpenIn = hours.open - hour;
      reason = `Opens at ${formatHourTime(hours.open)}`;
    } else {
      // Past closing time, opens tomorrow
      nextOpenIn = (24 - hour) + hours.open;
      reason = `Opens at ${formatHourTime(hours.open)} tomorrow`;
    }
  } else {
    // Calculate when shop closes
    if (hours.close > hours.open) {
      closingIn = hours.close - hour;
    } else {
      // Night shop (wraps around midnight)
      if (hour >= hours.open) {
        closingIn = (24 - hour) + hours.close;
      } else {
        closingIn = hours.close - hour;
      }
    }
  }

  return {
    isOpen,
    shopType: shop.type,
    currentHour: hour,
    opensAt: hours.open,
    closesAt: hours.close,
    nextOpenIn,
    closingIn,
    reason,
  };
}

/**
 * Format hour as 12-hour time string
 */
function formatHourTime(hour: number): string {
  if (hour === 0 || hour === 24) return '12:00 AM';
  if (hour === 12) return '12:00 PM';
  if (hour < 12) return `${hour}:00 AM`;
  return `${hour - 12}:00 PM`;
}

/**
 * Get all shops filtered by open/closed status
 */
export function getOpenShops(shops: Shop[]): Shop[] {
  return shops.filter(shop => isShopOpen(shop));
}

/**
 * Get shop hours as display string
 */
export function getShopHoursDisplay(shopType: ShopType): string {
  const hours = SHOP_HOURS[shopType];
  const openStr = formatHourTime(hours.open);
  const closeStr = formatHourTime(hours.close === 24 ? 0 : hours.close);

  if (hours.open === 0 && hours.close === 24) {
    return '24 Hours';
  }

  if (hours.close < hours.open) {
    return `${openStr} - ${closeStr} (Night)`;
  }

  const weekendNote = hours.weekend ? '' : ' (Weekdays only)';
  return `${openStr} - ${closeStr}${weekendNote}`;
}

// ==================== DEBUG / TESTING ====================

/**
 * Get shop summary for debugging
 */
export function getShopSummary(shop: Shop): string {
  const { weapons, armor } = getShopInventory(shop);
  return `${shop.name} (${shop.type}): ${weapons.length} weapons, ${armor.length} armor pieces. Markup: ${shop.markupMultiplier}x`;
}

/**
 * Test shop generation for a city
 */
export function testShopGeneration(cityName: string): void {
  console.log(`\n=== Shops in ${cityName} ===`);
  const shops = getShopsForCity(cityName);

  shops.forEach(shop => {
    console.log(getShopSummary(shop));
    const { weapons, armor } = getShopInventory(shop);

    // Sample items
    if (weapons.length > 0) {
      const sample = weapons.slice(0, 3);
      console.log(`  Weapons: ${sample.map(w => `${w.name} (${formatPrice(getBuyPrice(w, shop))})`).join(', ')}`);
    }
    if (armor.length > 0) {
      const sample = armor.slice(0, 3);
      console.log(`  Armor: ${sample.map(a => `${a.name} (${formatPrice(getBuyPrice(a, shop))})`).join(', ')}`);
    }
  });
}

// ==================== CS-005: SPECIAL SERVICES PANEL ====================

import {
  calculateMedicalSystem,
  calculateMercenarySystem,
  calculateSafeHouseSystem,
  calculateOrganizedCrime,
  calculateResearchSystem,
  calculateAllCombinedEffects,
  MedicalSystem,
  MercenarySystem,
  SafeHouseSystem,
  OrganizedCrimeSystem,
  ResearchSystem,
  CombinedEffects,
} from './combinedEffects';

/**
 * A purchasable special service in a location
 */
export interface SpecialService {
  id: string;
  name: string;
  emoji: string;
  category: 'medical' | 'mercenary' | 'criminal' | 'tech' | 'logistics' | 'intelligence';
  description: string;
  cost: number;
  available: boolean;
  requirements?: string;
  riskLevel?: 'low' | 'medium' | 'high';
}

/**
 * All special services available in a city
 */
export interface SpecialServicesPanel {
  cityName: string;
  countryCode: string;
  services: SpecialService[];
  combinedEffects: CombinedEffects;
}

/**
 * CS-005: Get all special services available in a city
 * Aggregates services from combined effects into a purchasable format
 */
export function getSpecialServices(cityName: string): SpecialServicesPanel {
  const country = getCountryByCity(cityName);
  const city = getCityByName(cityName);

  if (!country) {
    return {
      cityName,
      countryCode: 'XX',
      services: [],
      combinedEffects: {} as CombinedEffects,
    };
  }

  const effects = calculateAllCombinedEffects(country);
  const services: SpecialService[] = [];

  // Medical services
  if (effects.medical) {
    const med = effects.medical;
    if (med.available) {
      services.push({
        id: 'hospital_treatment',
        name: 'Hospital Treatment',
        emoji: '🏥',
        category: 'medical',
        description: `Quality: ${med.qualityRating}. Recovery modifier: ${(med.recoveryTimeModifier * 100).toFixed(0)}%`,
        cost: Math.round(500 * med.costMultiplier),
        available: true,
      });

      if (med.surgeryAvailable) {
        services.push({
          id: 'surgery',
          name: 'Emergency Surgery',
          emoji: '🔪',
          category: 'medical',
          description: `Success rate: ${(med.surgerySuccessRate * 100).toFixed(0)}%`,
          cost: Math.round(5000 * med.costMultiplier),
          available: true,
          riskLevel: med.surgerySuccessRate < 0.7 ? 'high' : med.surgerySuccessRate < 0.9 ? 'medium' : 'low',
        });
      }

      if (med.cybernetics) {
        services.push({
          id: 'cybernetics',
          name: 'Cybernetic Enhancement',
          emoji: '🦾',
          category: 'medical',
          description: 'Install cybernetic upgrades',
          cost: Math.round(25000 * med.costMultiplier),
          available: true,
        });
      }
    }
  }

  // Mercenary services
  if (effects.mercenary) {
    const merc = effects.mercenary;
    if (merc.available) {
      services.push({
        id: 'hire_merc',
        name: 'Hire Mercenary',
        emoji: '🎖️',
        category: 'mercenary',
        description: `${merc.poolSize} mercs available. Skill range: ${merc.skillRange[0]}-${merc.skillRange[1]}`,
        cost: merc.baseCost,
        available: true,
      });

      if (merc.specialOperatorsAvailable) {
        services.push({
          id: 'hire_specialist',
          name: 'Hire Special Operator',
          emoji: '🥷',
          category: 'mercenary',
          description: 'Elite operators with specialized skills',
          cost: Math.round(merc.baseCost * 3),
          available: true,
        });
      }
    }
  }

  // Safe house services (CS-005: Now uses city safetyIndex)
  if (effects.safeHouses) {
    const safe = effects.safeHouses;
    if (safe.safeHousesAvailable) {
      // Calculate security rating (1-10) from safehouseSecurity (0-100)
      const securityRating = Math.round(safe.safehouseSecurity / 10);

      // CITY SAFETY AFFECTS COMPROMISE RISK
      // High safety = lower risk, low safety = higher risk
      // Base risk from surveillance/intel (inverse of security)
      let compromiseRisk = Math.max(0, 100 - safe.safehouseSecurity);
      if (city && city.safetyIndex !== undefined) {
        // High safety (60+) = reduce risk by up to 20%
        // Low safety (40-) = increase risk by up to 30%
        if (city.safetyIndex >= 60) {
          compromiseRisk = Math.max(0, compromiseRisk - (city.safetyIndex - 60) * 0.5);
        } else if (city.safetyIndex <= 40) {
          compromiseRisk = Math.min(80, compromiseRisk + (40 - city.safetyIndex) * 0.75);
        }
      }

      const hasWeaponStorage = safe.falseWallsAvailable;

      services.push({
        id: 'rent_safehouse',
        name: 'Rent Safe House',
        emoji: '🏚️',
        category: 'logistics',
        description: `Security: ${securityRating}/10. ${hasWeaponStorage ? 'Hidden storage.' : ''} ${city?.safetyIndex !== undefined ? `City safety: ${Math.round(city.safetyIndex)}%` : ''}`,
        cost: safe.safehouseCost, // Weekly cost
        available: true,
        riskLevel: compromiseRisk > 30 ? 'high' : compromiseRisk > 15 ? 'medium' : 'low',
      });

      if (safe.tunnelNetworkAccess) {
        services.push({
          id: 'tunnel_access',
          name: 'Tunnel Network Access',
          emoji: '🚇',
          category: 'logistics',
          description: 'Underground escape routes',
          cost: Math.round(safe.safehouseCost * 4),
          available: true,
        });
      }
    }
  }

  // Black market services (CS-005: City crime unlocks more services)
  if (effects.blackMarket) {
    const bm = effects.blackMarket;

    // Get city crime level for service unlocks
    const cityCrime = city?.crimeIndex ?? 50;

    if (bm.available) {
      // Hitmen: Available from combined effects OR high city crime (60+)
      const hitmenUnlocked = bm.hitmenAvailable || cityCrime >= 60;
      if (hitmenUnlocked) {
        // Cost reduced in high-crime cities (easier to find assassins)
        const hitmanCostMod = cityCrime >= 70 ? 0.7 : cityCrime >= 50 ? 0.85 : 1.0;
        services.push({
          id: 'hire_hitman',
          name: 'Contract Killer',
          emoji: '☠️',
          category: 'criminal',
          description: `Eliminate a target. ${cityCrime >= 60 ? 'Local connections.' : ''}`,
          cost: Math.round((bm.hitmanCost || 10000) * hitmanCostMod),
          available: true,
          riskLevel: 'high',
        });
      }

      // Forged docs: Available from combined effects OR moderate city crime (50+)
      const forgedDocsUnlocked = bm.forgedDocumentsAvailable || cityCrime >= 50;
      if (forgedDocsUnlocked) {
        services.push({
          id: 'forged_docs',
          name: 'Forged Documents',
          emoji: '📄',
          category: 'criminal',
          description: 'Fake ID, passports, visas',
          cost: cityCrime >= 60 ? 1500 : 2000, // Cheaper in high-crime cities
          available: true,
          riskLevel: 'medium',
        });
      }

      // Smuggling: Available from combined effects OR city crime 55+
      const smugglingUnlocked = bm.smugglingRoutes || cityCrime >= 55;
      if (smugglingUnlocked) {
        services.push({
          id: 'smuggling',
          name: 'Smuggling Service',
          emoji: '📦',
          category: 'criminal',
          description: 'Move equipment across borders',
          cost: cityCrime >= 65 ? 3500 : 5000,
          available: true,
          riskLevel: 'medium',
        });
      }

      // NEW: Fence stolen goods - only in high-crime cities (65+)
      if (cityCrime >= 65) {
        services.push({
          id: 'fence_goods',
          name: 'Fence Stolen Goods',
          emoji: '💎',
          category: 'criminal',
          description: 'Sell hot merchandise at 40% value',
          cost: 0, // Free service, they take a cut
          available: true,
          riskLevel: 'medium',
        });
      }

      // NEW: Underground clinic - only in high-crime cities (70+)
      if (cityCrime >= 70) {
        services.push({
          id: 'underground_clinic',
          name: 'Underground Clinic',
          emoji: '🩺',
          category: 'criminal',
          description: 'No-questions-asked medical care',
          cost: 800,
          available: true,
          riskLevel: 'medium',
          requirements: 'High crime area',
        });
      }

      // NEW: Weapons cache - only in very high crime cities (75+)
      if (cityCrime >= 75) {
        services.push({
          id: 'weapons_cache',
          name: 'Hidden Weapons Cache',
          emoji: '🔫',
          category: 'criminal',
          description: 'Rent access to a stash of illegal weapons',
          cost: 3000,
          available: true,
          riskLevel: 'high',
          requirements: 'Very high crime area',
        });
      }
    }
  }

  // Research services
  if (effects.research) {
    const res = effects.research;
    if (res.researchSpeedMultiplier > 0.5) {
      services.push({
        id: 'tech_research',
        name: 'Technology R&D',
        emoji: '🔬',
        category: 'tech',
        description: `Research speed: ${(res.researchSpeedMultiplier * 100).toFixed(0)}%`,
        cost: Math.round(10000 / res.researchSpeedMultiplier),
        available: true,
      });
    }

    if (res.reverseEngineeringAvailable) {
      services.push({
        id: 'reverse_engineer',
        name: 'Reverse Engineering',
        emoji: '⚙️',
        category: 'tech',
        description: 'Analyze captured tech',
        cost: 15000,
        available: true,
      });
    }
  }

  return {
    cityName,
    countryCode: country.code,
    services,
    combinedEffects: effects,
  };
}

/**
 * Get special services by category
 */
export function getServicesByCategory(
  services: SpecialService[],
  category: SpecialService['category']
): SpecialService[] {
  return services.filter((s) => s.category === category);
}

/**
 * Format service info for display
 */
export function formatServiceInfo(service: SpecialService): string {
  const risk = service.riskLevel ? ` [${service.riskLevel.toUpperCase()} RISK]` : '';
  return `${service.emoji} ${service.name} - ${formatPrice(service.cost)}${risk}`;
}
