/**
 * Price Fluctuation System (EL-003, EL-004, EL-006)
 *
 * Handles event-driven price changes:
 * - Political events (coups = weapons cheap, sanctions = embargo)
 * - Scarcity events (disasters = medical expensive)
 * - Black market floods (military coup = weapons flood)
 * - War/conflict effects
 */

import { getDynamicEconomyManager, GoodsCategory, MarketCondition } from './dynamicEconomy';
import { WorldEvent, WorldEventCategory } from './worldSimulation';
import { getTimeEngine } from './timeEngine';
import { Country, getCountryByCode } from './countries';

// ============================================================================
// TYPES
// ============================================================================

export type PriceEventType =
  | 'coup'               // Military takeover
  | 'civil_war'          // Internal conflict
  | 'sanctions'          // International embargo
  | 'natural_disaster'   // Earthquake, flood, etc.
  | 'pandemic'           // Disease outbreak
  | 'arms_deal'          // Large military purchase
  | 'factory_opened'     // New manufacturing
  | 'factory_closed'     // Factory shutdown
  | 'trade_agreement'    // New trade deal
  | 'currency_crisis'    // Currency collapse
  | 'boom'               // Economic growth
  | 'recession'          // Economic downturn
  | 'black_market_raid'  // Authorities crack down
  | 'smuggling_route'    // New smuggling discovered
  | 'war_nearby'         // Conflict in neighbor
  | 'peacetime';         // Conflict ends

export interface PriceEvent {
  id: string;
  type: PriceEventType;
  countryCode: string;
  timestamp: number;
  durationDays: number;
  effects: PriceEffect[];
  headline: string;
  description: string;
}

export interface PriceEffect {
  category: GoodsCategory;
  multiplier: number;
  supplyChange: number;   // -50 to +50
  demandChange: number;   // -50 to +50
}

// ============================================================================
// EVENT EFFECTS
// ============================================================================

const EVENT_EFFECTS: Record<PriceEventType, {
  marketCondition?: MarketCondition;
  effects: PriceEffect[];
  durationDays: number;
  headlines: string[];
}> = {
  coup: {
    marketCondition: 'flooded',
    effects: [
      { category: 'weapons', multiplier: 0.5, supplyChange: 40, demandChange: -10 },
      { category: 'ammunition', multiplier: 0.4, supplyChange: 50, demandChange: -10 },
      { category: 'explosives', multiplier: 0.6, supplyChange: 30, demandChange: 0 },
      { category: 'armor', multiplier: 0.7, supplyChange: 25, demandChange: -5 },
      { category: 'contraband', multiplier: 0.6, supplyChange: 30, demandChange: 10 },
    ],
    durationDays: 30,
    headlines: [
      'Military Coup Floods Markets with Equipment',
      'Armory Doors Open After Government Falls',
      'Fire Sale: Military Surplus Floods Streets',
    ],
  },

  civil_war: {
    marketCondition: 'shortage',
    effects: [
      { category: 'weapons', multiplier: 1.8, supplyChange: -40, demandChange: 50 },
      { category: 'ammunition', multiplier: 2.0, supplyChange: -50, demandChange: 60 },
      { category: 'medical', multiplier: 2.5, supplyChange: -60, demandChange: 70 },
      { category: 'armor', multiplier: 1.5, supplyChange: -30, demandChange: 40 },
    ],
    durationDays: 90,
    headlines: [
      'Civil War Drives Desperate Demand for Supplies',
      'Combat Zones Create Critical Shortages',
      'War Prices: Essentials Skyrocket',
    ],
  },

  sanctions: {
    marketCondition: 'shortage',
    effects: [
      { category: 'electronics', multiplier: 2.0, supplyChange: -60, demandChange: 30 },
      { category: 'vehicles', multiplier: 1.8, supplyChange: -50, demandChange: 20 },
      { category: 'weapons', multiplier: 1.5, supplyChange: -40, demandChange: 10 },
      { category: 'medical', multiplier: 1.3, supplyChange: -30, demandChange: 20 },
    ],
    durationDays: 180,
    headlines: [
      'International Sanctions Bite: Imports Dry Up',
      'Embargo Creates Critical Shortages',
      'Sanctions Strangle Supply Chains',
    ],
  },

  natural_disaster: {
    marketCondition: 'crisis',
    effects: [
      { category: 'medical', multiplier: 2.5, supplyChange: -50, demandChange: 80 },
      { category: 'vehicles', multiplier: 1.5, supplyChange: -30, demandChange: 40 },
      { category: 'electronics', multiplier: 1.3, supplyChange: -20, demandChange: 30 },
    ],
    durationDays: 14,
    headlines: [
      'Disaster Strikes: Medical Supplies Desperately Needed',
      'Emergency Response Drains Resources',
      'Aftermath: Prices Surge as Aid Pours In',
    ],
  },

  pandemic: {
    marketCondition: 'shortage',
    effects: [
      { category: 'medical', multiplier: 3.0, supplyChange: -70, demandChange: 90 },
      { category: 'electronics', multiplier: 1.2, supplyChange: -10, demandChange: 20 },
    ],
    durationDays: 60,
    headlines: [
      'Health Crisis: Medical Prices Through the Roof',
      'Pandemic Panic: Supplies Running Low',
      'Outbreak Overwhelms Healthcare System',
    ],
  },

  arms_deal: {
    effects: [
      { category: 'weapons', multiplier: 0.7, supplyChange: 30, demandChange: -20 },
      { category: 'ammunition', multiplier: 0.8, supplyChange: 25, demandChange: -15 },
      { category: 'armor', multiplier: 0.85, supplyChange: 20, demandChange: -10 },
    ],
    durationDays: 21,
    headlines: [
      'Major Arms Deal: Surplus Enters Market',
      'Defense Contractor Offloads Inventory',
      'Military Hardware Floods Local Dealers',
    ],
  },

  factory_opened: {
    marketCondition: 'boom',
    effects: [
      { category: 'electronics', multiplier: 0.8, supplyChange: 30, demandChange: 0 },
      { category: 'vehicles', multiplier: 0.85, supplyChange: 25, demandChange: 0 },
    ],
    durationDays: 365,
    headlines: [
      'New Factory Opens: Prices Expected to Drop',
      'Manufacturing Boom Increases Supply',
      'Industrial Expansion Brings Competition',
    ],
  },

  factory_closed: {
    marketCondition: 'recession',
    effects: [
      { category: 'electronics', multiplier: 1.3, supplyChange: -25, demandChange: 10 },
      { category: 'vehicles', multiplier: 1.2, supplyChange: -20, demandChange: 5 },
    ],
    durationDays: 90,
    headlines: [
      'Factory Closure Hits Local Economy',
      'Job Losses as Manufacturing Shuts Down',
      'Supply Chain Disruption Expected',
    ],
  },

  trade_agreement: {
    marketCondition: 'boom',
    effects: [
      { category: 'electronics', multiplier: 0.85, supplyChange: 20, demandChange: 10 },
      { category: 'vehicles', multiplier: 0.9, supplyChange: 15, demandChange: 5 },
      { category: 'medical', multiplier: 0.9, supplyChange: 15, demandChange: 5 },
    ],
    durationDays: 365,
    headlines: [
      'Trade Deal Opens Markets',
      'New Agreement Promises Lower Prices',
      'Economic Integration Brings Benefits',
    ],
  },

  currency_crisis: {
    marketCondition: 'crisis',
    effects: [
      { category: 'weapons', multiplier: 0.5, supplyChange: 10, demandChange: -30 },
      { category: 'electronics', multiplier: 0.6, supplyChange: 10, demandChange: -25 },
      { category: 'vehicles', multiplier: 0.5, supplyChange: 10, demandChange: -35 },
      { category: 'medical', multiplier: 0.7, supplyChange: 5, demandChange: -15 },
    ],
    durationDays: 60,
    headlines: [
      'Currency Collapse: Fire Sales Everywhere',
      'Economic Meltdown: Prices Crash',
      'Devaluation Creates Bargain Prices',
    ],
  },

  boom: {
    marketCondition: 'boom',
    effects: [
      { category: 'electronics', multiplier: 1.15, supplyChange: 10, demandChange: 25 },
      { category: 'vehicles', multiplier: 1.2, supplyChange: 5, demandChange: 30 },
    ],
    durationDays: 180,
    headlines: [
      'Economic Boom: Demand Surges',
      'Growth Drives Consumer Spending',
      'Prosperity Pushes Prices Higher',
    ],
  },

  recession: {
    marketCondition: 'recession',
    effects: [
      { category: 'electronics', multiplier: 0.8, supplyChange: 15, demandChange: -30 },
      { category: 'vehicles', multiplier: 0.7, supplyChange: 20, demandChange: -40 },
      { category: 'weapons', multiplier: 0.9, supplyChange: 10, demandChange: -15 },
    ],
    durationDays: 180,
    headlines: [
      'Recession Hits: Prices Fall',
      'Economic Downturn Reduces Demand',
      'Hard Times Mean Cheaper Goods',
    ],
  },

  black_market_raid: {
    effects: [
      { category: 'contraband', multiplier: 2.0, supplyChange: -60, demandChange: 20 },
      { category: 'weapons', multiplier: 1.3, supplyChange: -20, demandChange: 10 },
      { category: 'explosives', multiplier: 1.5, supplyChange: -30, demandChange: 15 },
    ],
    durationDays: 14,
    headlines: [
      'Police Raid Disrupts Underground Market',
      'Black Market Crackdown: Prices Spike',
      'Authorities Target Illegal Trade',
    ],
  },

  smuggling_route: {
    effects: [
      { category: 'contraband', multiplier: 0.6, supplyChange: 40, demandChange: -10 },
      { category: 'weapons', multiplier: 0.8, supplyChange: 20, demandChange: -5 },
      { category: 'explosives', multiplier: 0.7, supplyChange: 25, demandChange: -5 },
    ],
    durationDays: 90,
    headlines: [
      'New Smuggling Route Opens',
      'Underground Trade Flourishes',
      'Black Market Prices Drop',
    ],
  },

  war_nearby: {
    effects: [
      { category: 'weapons', multiplier: 1.4, supplyChange: -20, demandChange: 40 },
      { category: 'ammunition', multiplier: 1.5, supplyChange: -25, demandChange: 45 },
      { category: 'armor', multiplier: 1.3, supplyChange: -15, demandChange: 30 },
      { category: 'medical', multiplier: 1.2, supplyChange: -10, demandChange: 25 },
    ],
    durationDays: 60,
    headlines: [
      'Neighboring Conflict Drives Demand',
      'War Next Door: Prices Rise',
      'Regional Instability Affects Markets',
    ],
  },

  peacetime: {
    marketCondition: 'normal',
    effects: [
      { category: 'weapons', multiplier: 0.9, supplyChange: 15, demandChange: -20 },
      { category: 'ammunition', multiplier: 0.85, supplyChange: 20, demandChange: -25 },
      { category: 'medical', multiplier: 0.9, supplyChange: 10, demandChange: -15 },
    ],
    durationDays: 365,
    headlines: [
      'Peace Returns: Markets Stabilize',
      'Conflict Ends: Prices Normalize',
      'Stability Brings Relief',
    ],
  },
};

// ============================================================================
// PRICE EVENT MANAGER
// ============================================================================

let priceEventManagerInstance: PriceEventManager | null = null;

export class PriceEventManager {
  private activeEvents: PriceEvent[] = [];
  private eventHistory: PriceEvent[] = [];
  private started: boolean = false;

  start(): void {
    if (this.started) return;
    this.started = true;

    const timeEngine = getTimeEngine();

    // Check for expired events daily
    timeEngine.on('day_change', () => {
      this.cleanupExpiredEvents();
    });
  }

  /**
   * Trigger a price event
   */
  triggerEvent(
    type: PriceEventType,
    countryCode: string,
    customDuration?: number
  ): PriceEvent {
    const timeEngine = getTimeEngine();
    const timestamp = timeEngine.getTime().totalHours;
    const eventConfig = EVENT_EFFECTS[type];

    const headlines = eventConfig.headlines;
    const headline = headlines[Math.floor(Math.random() * headlines.length)];

    const event: PriceEvent = {
      id: `price_event_${countryCode}_${type}_${timestamp}`,
      type,
      countryCode,
      timestamp,
      durationDays: customDuration ?? eventConfig.durationDays,
      effects: eventConfig.effects,
      headline: headline.replace('{country}', countryCode),
      description: `${type} event in ${countryCode}`,
    };

    // Apply effects to economy
    const economyManager = getDynamicEconomyManager();

    // Set market condition if specified
    if (eventConfig.marketCondition) {
      economyManager.setMarketCondition(countryCode, eventConfig.marketCondition);
    }

    // Apply price modifiers
    for (const effect of event.effects) {
      economyManager.addPriceModifier(
        countryCode,
        effect.category,
        effect.multiplier,
        `${type}: ${headline}`,
        event.durationDays
      );

      // Adjust supply/demand
      const market = economyManager.getMarket(countryCode);
      const currentSupply = market.supplyLevels.get(effect.category) || 50;
      const currentDemand = market.demandLevels.get(effect.category) || 50;

      market.supplyLevels.set(
        effect.category,
        Math.max(0, Math.min(100, currentSupply + effect.supplyChange))
      );
      market.demandLevels.set(
        effect.category,
        Math.max(0, Math.min(100, currentDemand + effect.demandChange))
      );
    }

    this.activeEvents.push(event);
    this.eventHistory.push(event);

    // Keep last 50 events
    if (this.eventHistory.length > 50) {
      this.eventHistory = this.eventHistory.slice(-50);
    }

    return event;
  }

  /**
   * Convert world event to price event
   */
  processWorldEvent(worldEvent: WorldEvent): PriceEvent | null {
    // Map world event categories to price events
    const mapping: Partial<Record<WorldEventCategory, PriceEventType>> = {
      political: this.mapPoliticalEvent(worldEvent),
      economic: this.mapEconomicEvent(worldEvent),
      military: this.mapMilitaryEvent(worldEvent),
      natural_disaster: 'natural_disaster',
    };

    const priceEventType = mapping[worldEvent.category];
    if (!priceEventType) return null;

    // Trigger for each affected country
    const events: PriceEvent[] = [];
    for (const countryCode of worldEvent.affectedCountries) {
      events.push(this.triggerEvent(priceEventType, countryCode));
    }

    return events[0] || null;
  }

  /**
   * Map political world events to price events
   */
  private mapPoliticalEvent(event: WorldEvent): PriceEventType | undefined {
    if (event.headline.toLowerCase().includes('coup')) return 'coup';
    if (event.headline.toLowerCase().includes('sanction')) return 'sanctions';
    if (event.headline.toLowerCase().includes('peace')) return 'peacetime';
    if (event.headline.toLowerCase().includes('war')) return 'civil_war';
    return undefined;
  }

  /**
   * Map economic world events to price events
   */
  private mapEconomicEvent(event: WorldEvent): PriceEventType | undefined {
    if (event.headline.toLowerCase().includes('boom')) return 'boom';
    if (event.headline.toLowerCase().includes('recession')) return 'recession';
    if (event.headline.toLowerCase().includes('crisis')) return 'currency_crisis';
    if (event.headline.toLowerCase().includes('factory')) {
      return event.headline.toLowerCase().includes('close') ? 'factory_closed' : 'factory_opened';
    }
    return undefined;
  }

  /**
   * Map military world events to price events
   */
  private mapMilitaryEvent(event: WorldEvent): PriceEventType | undefined {
    if (event.headline.toLowerCase().includes('arms deal')) return 'arms_deal';
    if (event.headline.toLowerCase().includes('conflict')) return 'war_nearby';
    return undefined;
  }

  /**
   * Get active events for a country
   */
  getActiveEvents(countryCode: string): PriceEvent[] {
    return this.activeEvents.filter(e => e.countryCode === countryCode);
  }

  /**
   * Get all active events
   */
  getAllActiveEvents(): PriceEvent[] {
    return [...this.activeEvents];
  }

  /**
   * Get event history
   */
  getEventHistory(limit: number = 20): PriceEvent[] {
    return this.eventHistory.slice(-limit).reverse();
  }

  /**
   * Cleanup expired events
   */
  private cleanupExpiredEvents(): void {
    const timeEngine = getTimeEngine();
    const currentTime = timeEngine.getTime().totalHours;

    this.activeEvents = this.activeEvents.filter(event => {
      const expiresAt = event.timestamp + event.durationDays * 24;
      return expiresAt > currentTime;
    });
  }
}

export function getPriceEventManager(): PriceEventManager {
  if (!priceEventManagerInstance) {
    priceEventManagerInstance = new PriceEventManager();
  }
  return priceEventManagerInstance;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  getPriceEventManager,
  EVENT_EFFECTS,
};
