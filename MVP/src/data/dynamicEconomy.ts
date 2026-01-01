/**
 * Dynamic Economy System (EL-001, EL-002, EL-005)
 *
 * Creates a living economy where:
 * - Prices fluctuate over time based on events
 * - Supply/demand affects local prices
 * - Currency exchange rates vary between countries
 * - Player buying/selling affects local markets
 */

import { Country, getCountries, getCountryByCode } from './countries';
import { getTimeEngine } from './timeEngine';
import { WorldEvent, getWorldSimulation } from './worldSimulation';

// ============================================================================
// TYPES
// ============================================================================

export type GoodsCategory =
  | 'weapons'
  | 'armor'
  | 'medical'
  | 'electronics'
  | 'vehicles'
  | 'ammunition'
  | 'explosives'
  | 'contraband';

export type MarketCondition =
  | 'boom'       // +25% prices, +50% availability
  | 'normal'     // Base prices
  | 'recession'  // -15% prices, -25% availability
  | 'crisis'     // -25% prices, -50% availability (fire sale)
  | 'shortage'   // +50% prices, -75% availability
  | 'flooded';   // -40% prices, +100% availability

export interface PriceModifier {
  category: GoodsCategory;
  multiplier: number;      // 1.0 = normal
  reason: string;          // Why this modifier exists
  expiresAt?: number;      // Game timestamp when modifier expires
  isTemporary: boolean;
}

export interface MarketState {
  countryCode: string;
  condition: MarketCondition;
  categoryModifiers: Map<GoodsCategory, PriceModifier[]>;
  supplyLevels: Map<GoodsCategory, number>;  // 0-100, 50 = normal
  demandLevels: Map<GoodsCategory, number>;  // 0-100, 50 = normal
  lastUpdated: number;
}

export interface CurrencyInfo {
  code: string;            // ISO currency code
  name: string;
  exchangeRate: number;    // vs USD (1.0 = parity)
  volatility: number;      // 0-1, how much it fluctuates
  inflation: number;       // Annual inflation rate
}

export interface TradeTransaction {
  timestamp: number;
  countryCode: string;
  category: GoodsCategory;
  type: 'buy' | 'sell';
  quantity: number;
  totalValue: number;
}

// ============================================================================
// CURRENCY DATA
// ============================================================================

const BASE_CURRENCIES: Record<string, CurrencyInfo> = {
  USD: { code: 'USD', name: 'US Dollar', exchangeRate: 1.0, volatility: 0.1, inflation: 0.03 },
  EUR: { code: 'EUR', name: 'Euro', exchangeRate: 0.92, volatility: 0.1, inflation: 0.025 },
  GBP: { code: 'GBP', name: 'British Pound', exchangeRate: 0.79, volatility: 0.12, inflation: 0.04 },
  JPY: { code: 'JPY', name: 'Japanese Yen', exchangeRate: 148.0, volatility: 0.15, inflation: 0.02 },
  CNY: { code: 'CNY', name: 'Chinese Yuan', exchangeRate: 7.2, volatility: 0.08, inflation: 0.02 },
  RUB: { code: 'RUB', name: 'Russian Ruble', exchangeRate: 92.0, volatility: 0.35, inflation: 0.08 },
  BRL: { code: 'BRL', name: 'Brazilian Real', exchangeRate: 4.9, volatility: 0.25, inflation: 0.05 },
  INR: { code: 'INR', name: 'Indian Rupee', exchangeRate: 83.0, volatility: 0.12, inflation: 0.05 },
  NGN: { code: 'NGN', name: 'Nigerian Naira', exchangeRate: 780.0, volatility: 0.4, inflation: 0.22 },
  ZAR: { code: 'ZAR', name: 'South African Rand', exchangeRate: 18.5, volatility: 0.25, inflation: 0.06 },
  MXN: { code: 'MXN', name: 'Mexican Peso', exchangeRate: 17.0, volatility: 0.18, inflation: 0.05 },
  CHF: { code: 'CHF', name: 'Swiss Franc', exchangeRate: 0.88, volatility: 0.08, inflation: 0.01 },
  AED: { code: 'AED', name: 'UAE Dirham', exchangeRate: 3.67, volatility: 0.05, inflation: 0.02 },
  KRW: { code: 'KRW', name: 'South Korean Won', exchangeRate: 1300.0, volatility: 0.15, inflation: 0.035 },
  AUD: { code: 'AUD', name: 'Australian Dollar', exchangeRate: 1.52, volatility: 0.15, inflation: 0.04 },
};

/**
 * Map country code to currency code (simplified)
 */
export function getCountryCurrency(countryCode: string): string {
  const currencyMap: Record<string, string> = {
    US: 'USD', CA: 'USD', // North America uses USD for simplicity
    GB: 'GBP', IE: 'EUR', FR: 'EUR', DE: 'EUR', IT: 'EUR', ES: 'EUR', PT: 'EUR',
    NL: 'EUR', BE: 'EUR', AT: 'EUR', GR: 'EUR', FI: 'EUR',
    JP: 'JPY', CN: 'CNY', RU: 'RUB', BR: 'BRL', IN: 'INR',
    NG: 'NGN', ZA: 'ZAR', MX: 'MXN', CH: 'CHF', AE: 'AED',
    KR: 'KRW', AU: 'AUD', NZ: 'AUD',
  };
  return currencyMap[countryCode] || 'USD'; // Default to USD
}

// ============================================================================
// MARKET CONDITION EFFECTS
// ============================================================================

const MARKET_CONDITION_EFFECTS: Record<MarketCondition, {
  priceMultiplier: number;
  availabilityMultiplier: number;
  description: string;
}> = {
  boom: { priceMultiplier: 1.25, availabilityMultiplier: 1.5, description: 'Economic boom - high demand' },
  normal: { priceMultiplier: 1.0, availabilityMultiplier: 1.0, description: 'Stable market' },
  recession: { priceMultiplier: 0.85, availabilityMultiplier: 0.75, description: 'Economic recession' },
  crisis: { priceMultiplier: 0.75, availabilityMultiplier: 0.5, description: 'Economic crisis - fire sales' },
  shortage: { priceMultiplier: 1.5, availabilityMultiplier: 0.25, description: 'Supply shortage' },
  flooded: { priceMultiplier: 0.6, availabilityMultiplier: 2.0, description: 'Market flooded with goods' },
};

// ============================================================================
// SUPPLY/DEMAND CALCULATION
// ============================================================================

/**
 * Calculate price modifier from supply/demand
 * Supply 100 + Demand 0 = -50% price
 * Supply 0 + Demand 100 = +100% price
 */
export function calculateSupplyDemandModifier(supply: number, demand: number): number {
  // Normalize to -1 to +1 range
  const supplyEffect = (50 - supply) / 100;  // High supply = negative
  const demandEffect = (demand - 50) / 100;  // High demand = positive

  // Combined effect
  const combined = supplyEffect + demandEffect;

  // Convert to multiplier (0.5 to 2.0 range)
  return Math.max(0.5, Math.min(2.0, 1.0 + combined));
}

/**
 * Calculate how player transactions affect local supply/demand
 */
export function calculateTransactionImpact(
  transaction: TradeTransaction,
  currentSupply: number,
  currentDemand: number
): { newSupply: number; newDemand: number } {
  // Impact scales with transaction value
  const impact = Math.min(10, transaction.totalValue / 1000);

  let newSupply = currentSupply;
  let newDemand = currentDemand;

  if (transaction.type === 'buy') {
    // Buying reduces supply, increases perceived demand
    newSupply = Math.max(0, currentSupply - impact * transaction.quantity * 0.5);
    newDemand = Math.min(100, currentDemand + impact * 0.25);
  } else {
    // Selling increases supply, reduces perceived demand
    newSupply = Math.min(100, currentSupply + impact * transaction.quantity * 0.5);
    newDemand = Math.max(0, currentDemand - impact * 0.25);
  }

  return { newSupply, newDemand };
}

// ============================================================================
// DYNAMIC ECONOMY MANAGER
// ============================================================================

let economyManagerInstance: DynamicEconomyManager | null = null;

export class DynamicEconomyManager {
  private markets: Map<string, MarketState> = new Map();
  private currencies: Map<string, CurrencyInfo> = new Map();
  private transactions: TradeTransaction[] = [];
  private started: boolean = false;

  constructor() {
    // Initialize base currencies
    for (const [code, info] of Object.entries(BASE_CURRENCIES)) {
      this.currencies.set(code, { ...info });
    }
  }

  start(): void {
    if (this.started) return;
    this.started = true;

    const timeEngine = getTimeEngine();

    // Update markets daily
    timeEngine.on('day_change', () => {
      this.updateAllMarkets();
      this.decaySupplyDemand();
      this.fluctuateCurrencies();
      this.cleanupExpiredModifiers();
    });

    // Listen for world events
    const worldSim = getWorldSimulation();
    // World events are processed elsewhere, but we can check for them
  }

  /**
   * Initialize market for a country
   */
  initializeMarket(countryCode: string): MarketState {
    const country = getCountryByCode(countryCode);
    if (!country) {
      throw new Error(`Unknown country: ${countryCode}`);
    }

    const timeEngine = getTimeEngine();
    const timestamp = timeEngine.getTime().totalHours;

    // Determine initial market condition based on country stats
    let condition: MarketCondition = 'normal';
    const gdp = country.gdpPerCapita || 50;
    const corruption = country.corruption || 50;
    const stability = country.politicalStability || 50;

    if (gdp > 70 && stability > 60) {
      condition = 'boom';
    } else if (stability < 30) {
      condition = 'crisis';
    } else if (gdp < 30) {
      condition = 'recession';
    }

    const market: MarketState = {
      countryCode,
      condition,
      categoryModifiers: new Map(),
      supplyLevels: new Map(),
      demandLevels: new Map(),
      lastUpdated: timestamp,
    };

    // Initialize supply/demand for each category
    const categories: GoodsCategory[] = ['weapons', 'armor', 'medical', 'electronics', 'vehicles', 'ammunition', 'explosives', 'contraband'];

    for (const cat of categories) {
      // Base supply on country stats
      let supply = 50;
      let demand = 50;

      if (cat === 'weapons' || cat === 'ammunition' || cat === 'explosives') {
        supply = Math.min(80, 30 + (country.militaryStrength || 50) / 2);
        demand = 50 + (100 - stability) / 4; // Unstable = more demand
      } else if (cat === 'medical') {
        supply = Math.min(80, 20 + (country.healthcare || 50));
        demand = 50 + (100 - (country.healthcare || 50)) / 4;
      } else if (cat === 'electronics') {
        supply = Math.min(80, 20 + (country.scienceTechnology || 50));
        demand = 50;
      } else if (cat === 'contraband') {
        supply = Math.min(80, 20 + (country.corruption || 50));
        demand = 40 + (100 - (country.lawEnforcement || 50)) / 4;
      }

      market.supplyLevels.set(cat, supply);
      market.demandLevels.set(cat, demand);
    }

    this.markets.set(countryCode, market);
    return market;
  }

  /**
   * Get market state for a country (initializes if needed)
   */
  getMarket(countryCode: string): MarketState {
    let market = this.markets.get(countryCode);
    if (!market) {
      market = this.initializeMarket(countryCode);
    }
    return market;
  }

  /**
   * Calculate final price for an item
   */
  calculatePrice(
    basePrice: number,
    category: GoodsCategory,
    countryCode: string
  ): { finalPrice: number; breakdown: { factor: string; multiplier: number }[] } {
    const market = this.getMarket(countryCode);
    const breakdown: { factor: string; multiplier: number }[] = [];

    let multiplier = 1.0;

    // Market condition effect
    const conditionEffect = MARKET_CONDITION_EFFECTS[market.condition];
    multiplier *= conditionEffect.priceMultiplier;
    breakdown.push({ factor: `Market: ${market.condition}`, multiplier: conditionEffect.priceMultiplier });

    // Supply/demand effect
    const supply = market.supplyLevels.get(category) || 50;
    const demand = market.demandLevels.get(category) || 50;
    const sdMultiplier = calculateSupplyDemandModifier(supply, demand);
    multiplier *= sdMultiplier;
    breakdown.push({ factor: `Supply/Demand`, multiplier: sdMultiplier });

    // Category-specific modifiers
    const categoryMods = market.categoryModifiers.get(category) || [];
    for (const mod of categoryMods) {
      multiplier *= mod.multiplier;
      breakdown.push({ factor: mod.reason, multiplier: mod.multiplier });
    }

    // Currency effect (items priced in USD, converted to local)
    const currencyCode = getCountryCurrency(countryCode);
    const currency = this.currencies.get(currencyCode);
    if (currency && currencyCode !== 'USD') {
      // Weak currency = things cost more in local terms
      // But we display in USD, so high inflation = effective discount
      const inflationDiscount = 1 - (currency.inflation * 0.5);
      multiplier *= inflationDiscount;
      breakdown.push({ factor: `Currency (${currencyCode})`, multiplier: inflationDiscount });
    }

    const finalPrice = Math.round(basePrice * multiplier);
    return { finalPrice, breakdown };
  }

  /**
   * Record a transaction and update local market
   */
  recordTransaction(
    countryCode: string,
    category: GoodsCategory,
    type: 'buy' | 'sell',
    quantity: number,
    totalValue: number
  ): void {
    const timeEngine = getTimeEngine();
    const transaction: TradeTransaction = {
      timestamp: timeEngine.getTime().totalHours,
      countryCode,
      category,
      type,
      quantity,
      totalValue,
    };

    this.transactions.push(transaction);

    // Keep last 100 transactions
    if (this.transactions.length > 100) {
      this.transactions = this.transactions.slice(-100);
    }

    // Update local supply/demand
    const market = this.getMarket(countryCode);
    const currentSupply = market.supplyLevels.get(category) || 50;
    const currentDemand = market.demandLevels.get(category) || 50;

    const { newSupply, newDemand } = calculateTransactionImpact(
      transaction, currentSupply, currentDemand
    );

    market.supplyLevels.set(category, newSupply);
    market.demandLevels.set(category, newDemand);
    market.lastUpdated = transaction.timestamp;
  }

  /**
   * Add a price modifier (from events)
   */
  addPriceModifier(
    countryCode: string,
    category: GoodsCategory,
    multiplier: number,
    reason: string,
    durationDays?: number
  ): void {
    const market = this.getMarket(countryCode);
    const timeEngine = getTimeEngine();
    const currentTime = timeEngine.getTime().totalHours;

    const modifier: PriceModifier = {
      category,
      multiplier,
      reason,
      isTemporary: durationDays !== undefined,
      expiresAt: durationDays ? currentTime + durationDays * 24 : undefined,
    };

    const existing = market.categoryModifiers.get(category) || [];
    existing.push(modifier);
    market.categoryModifiers.set(category, existing);
  }

  /**
   * Set market condition (from major events)
   */
  setMarketCondition(countryCode: string, condition: MarketCondition): void {
    const market = this.getMarket(countryCode);
    market.condition = condition;
  }

  /**
   * Get currency exchange rate
   */
  getExchangeRate(fromCurrency: string, toCurrency: string): number {
    const from = this.currencies.get(fromCurrency);
    const to = this.currencies.get(toCurrency);

    if (!from || !to) return 1.0;

    // Convert through USD
    const fromUSD = from.exchangeRate;
    const toUSD = to.exchangeRate;

    return toUSD / fromUSD;
  }

  /**
   * Get currency info
   */
  getCurrency(currencyCode: string): CurrencyInfo | undefined {
    return this.currencies.get(currencyCode);
  }

  /**
   * Update all markets (daily)
   */
  private updateAllMarkets(): void {
    const timeEngine = getTimeEngine();
    const timestamp = timeEngine.getTime().totalHours;

    for (const market of this.markets.values()) {
      // Small random fluctuations
      for (const [cat, supply] of market.supplyLevels) {
        const fluctuation = (Math.random() - 0.5) * 5;
        market.supplyLevels.set(cat, Math.max(0, Math.min(100, supply + fluctuation)));
      }

      for (const [cat, demand] of market.demandLevels) {
        const fluctuation = (Math.random() - 0.5) * 5;
        market.demandLevels.set(cat, Math.max(0, Math.min(100, demand + fluctuation)));
      }

      // Small chance to change market condition
      if (Math.random() < 0.05) {
        const conditions: MarketCondition[] = ['normal', 'boom', 'recession'];
        market.condition = conditions[Math.floor(Math.random() * conditions.length)];
      }

      market.lastUpdated = timestamp;
    }
  }

  /**
   * Decay supply/demand toward normal (50)
   */
  private decaySupplyDemand(): void {
    const decayRate = 0.1; // 10% toward normal per day

    for (const market of this.markets.values()) {
      for (const [cat, supply] of market.supplyLevels) {
        const newSupply = supply + (50 - supply) * decayRate;
        market.supplyLevels.set(cat, newSupply);
      }

      for (const [cat, demand] of market.demandLevels) {
        const newDemand = demand + (50 - demand) * decayRate;
        market.demandLevels.set(cat, newDemand);
      }
    }
  }

  /**
   * Fluctuate currency exchange rates
   */
  private fluctuateCurrencies(): void {
    for (const [code, currency] of this.currencies) {
      if (code === 'USD') continue; // USD is anchor

      // Random walk based on volatility
      const change = (Math.random() - 0.5) * currency.volatility * currency.exchangeRate * 0.1;
      currency.exchangeRate = Math.max(0.01, currency.exchangeRate + change);

      // Apply inflation (annual rate / 365)
      currency.exchangeRate *= 1 + (currency.inflation / 365);
    }
  }

  /**
   * Remove expired temporary modifiers
   */
  private cleanupExpiredModifiers(): void {
    const timeEngine = getTimeEngine();
    const currentTime = timeEngine.getTime().totalHours;

    for (const market of this.markets.values()) {
      for (const [cat, modifiers] of market.categoryModifiers) {
        const active = modifiers.filter(m =>
          !m.isTemporary || (m.expiresAt && m.expiresAt > currentTime)
        );
        market.categoryModifiers.set(cat, active);
      }
    }
  }

  /**
   * Get market summary for display
   */
  getMarketSummary(countryCode: string): {
    condition: MarketCondition;
    conditionDescription: string;
    categories: Array<{
      category: GoodsCategory;
      supply: number;
      demand: number;
      priceMultiplier: number;
      trend: 'up' | 'down' | 'stable';
    }>;
    currency: CurrencyInfo;
  } {
    const market = this.getMarket(countryCode);
    const currencyCode = getCountryCurrency(countryCode);
    const currency = this.currencies.get(currencyCode) || BASE_CURRENCIES.USD;

    const categories: GoodsCategory[] = ['weapons', 'armor', 'medical', 'electronics', 'vehicles', 'ammunition', 'explosives', 'contraband'];

    const categoryData = categories.map(cat => {
      const supply = market.supplyLevels.get(cat) || 50;
      const demand = market.demandLevels.get(cat) || 50;
      const priceMultiplier = calculateSupplyDemandModifier(supply, demand);

      // Determine trend
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (demand - supply > 15) trend = 'up';
      else if (supply - demand > 15) trend = 'down';

      return { category: cat, supply, demand, priceMultiplier, trend };
    });

    return {
      condition: market.condition,
      conditionDescription: MARKET_CONDITION_EFFECTS[market.condition].description,
      categories: categoryData,
      currency,
    };
  }
}

export function getDynamicEconomyManager(): DynamicEconomyManager {
  if (!economyManagerInstance) {
    economyManagerInstance = new DynamicEconomyManager();
  }
  return economyManagerInstance;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  getDynamicEconomyManager,
  calculateSupplyDemandModifier,
  getCountryCurrency,
};
