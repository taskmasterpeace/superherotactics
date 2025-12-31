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
}

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
 * Get buy price for an item at a shop
 */
export function getBuyPrice(item: { costValue: number }, shop: Shop): number {
  return Math.round(item.costValue * shop.markupMultiplier);
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
 * Get all shops available in a city based on country stats
 */
export function getShopsForCity(cityName: string): Shop[] {
  const country = getCountryByCity(cityName);
  if (!country) {
    // Return just a basic general store if country not found
    return [createShop('general', cityName, 'XX', 1, 1.0)];
  }

  return getShopsForCityWithCountry(cityName, country);
}

/**
 * Get shops with known country data
 */
export function getShopsForCityWithCountry(cityName: string, country: Country): Shop[] {
  const shops: Shop[] = [];

  // General shop always available
  // Higher GDP = more expensive, better quality
  const generalQuality = getQualityTier(country.gdpPerCapita);
  const generalMarkup = 0.8 + (country.gdpPerCapita / 200); // 0.8x to 1.3x
  shops.push(createShop('general', cityName, country.code, generalQuality, generalMarkup));

  // Black market: requires high corruption + low law enforcement
  const blackMarketScore = country.governmentCorruption + (100 - country.lawEnforcement);
  if (blackMarketScore > 100) { // Threshold for black market
    // Higher corruption = cheaper, lower quality sometimes
    const bmQuality = Math.max(1, getQualityTier(country.militaryBudget)) as 1 | 2 | 3 | 4;
    const bmMarkup = Math.max(0.6, 1.5 - (country.governmentCorruption / 150)); // 0.6x to 1.5x
    shops.push(createShop('blackmarket', cityName, country.code, bmQuality, bmMarkup));
  }

  // Military surplus: requires military budget/services
  if (country.militaryBudget >= 40 || country.militaryServices >= 50) {
    const milQuality = getQualityTier(country.militaryBudget);
    const milMarkup = 0.9 + (country.militaryBudget / 250); // 0.9x to 1.3x
    shops.push(createShop('military', cityName, country.code, milQuality, milMarkup));
  }

  // Tech shop: requires science + GDP
  if (country.science >= 40 && country.gdpPerCapita >= 40) {
    const techQuality = getQualityTier((country.science + country.gdpPerCapita) / 2);
    const techMarkup = 1.0 + (country.science / 200); // 1.0x to 1.5x
    shops.push(createShop('tech', cityName, country.code, techQuality, techMarkup));
  }

  // Police supply: requires law enforcement budget
  if (country.lawEnforcement >= 50) {
    const policeQuality = getQualityTier(country.lawEnforcement);
    shops.push(createShop('police', cityName, country.code, policeQuality, 1.1));
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
