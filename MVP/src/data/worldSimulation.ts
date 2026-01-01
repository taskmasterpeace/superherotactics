/**
 * World Simulation Engine (WORLD-EVENTS)
 *
 * Hooks into TimeEngine to simulate a living world where:
 * - Gangs gain/lose territory
 * - Political events change country stats
 * - Economic events affect prices
 * - Crime waves change city crime indices
 * - Superhuman incidents generate news and missions
 *
 * PHILOSOPHY: The world lives without the player. Time passes,
 * things change, and the player walks into an evolving situation.
 */

import { getTimeEngine, TimeEvent, WhileYouWereGoneEvent } from './timeEngine';
import { GameTime } from './timeSystem';
import { City, cities as ALL_CITIES, getCityByName } from './cities';
import { Country, getCountryByCode } from './countries';

// ============================================================================
// WORLD EVENT TYPES
// ============================================================================

export type WorldEventCategory =
  | 'gang_territory'     // Faction gains/loses control
  | 'political'          // Coups, elections, policy changes
  | 'economic'           // Market crashes, booms, sanctions
  | 'crime_wave'         // Temporary crime spikes
  | 'superhuman'         // LSW incidents, villain attacks
  | 'natural_disaster'   // Earthquakes, floods, etc.
  | 'military'           // Conflicts, coups, interventions
  | 'social';            // Protests, riots, celebrations

export interface WorldEvent {
  id: string;
  timestamp: GameTime;
  category: WorldEventCategory;

  // Display
  headline: string;
  description: string;
  importance: 'minor' | 'normal' | 'major' | 'critical';

  // Location
  affectedCountries: string[];  // Country codes
  affectedCities: string[];     // City names

  // Effects
  effects: WorldEventEffect[];

  // Duration (in hours, 0 = permanent)
  duration: number;
  expiresAt?: number;  // totalHours when effect ends

  // For faction events
  factionId?: string;
  targetFactionId?: string;
}

export interface WorldEventEffect {
  type: 'country_stat' | 'city_stat' | 'price_modifier' | 'faction_relation' | 'spawn_modifier';
  target: string;           // Stat name or faction ID
  value: number;            // Change amount
  isMultiplier?: boolean;   // true = multiply, false = add
}

// ============================================================================
// WORLD SIMULATION STATE
// ============================================================================

export interface WorldState {
  // Active events with duration
  activeEvents: WorldEvent[];

  // Event history (last 100 events)
  eventHistory: WorldEvent[];

  // Temporary stat modifiers (from events)
  countryModifiers: Map<string, Map<string, number>>;  // countryCode -> stat -> modifier
  cityModifiers: Map<string, Map<string, number>>;    // cityName -> stat -> modifier
  priceModifiers: Map<string, number>;                // itemCategory -> multiplier

  // Faction territories (cityName -> factionId)
  gangTerritories: Map<string, string>;

  // Last simulation tick
  lastSimulatedHour: number;
}

// ============================================================================
// WORLD SIMULATION CLASS
// ============================================================================

export class WorldSimulation {
  private state: WorldState;
  private unsubscribe: (() => void) | null = null;

  // Event generation rates (per 24 hours base)
  private readonly EVENT_RATES = {
    gang_territory: 0.3,      // Territory changes
    political: 0.1,           // Political events (rare)
    economic: 0.2,            // Economic shifts
    crime_wave: 0.4,          // Crime spikes
    superhuman: 0.15,         // LSW incidents
    natural_disaster: 0.02,   // Disasters (very rare)
    military: 0.05,           // Military actions (rare)
    social: 0.25,             // Social events
  };

  constructor() {
    this.state = {
      activeEvents: [],
      eventHistory: [],
      countryModifiers: new Map(),
      cityModifiers: new Map(),
      priceModifiers: new Map(),
      gangTerritories: new Map(),
      lastSimulatedHour: 0,
    };
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  /**
   * Start world simulation - hooks into TimeEngine
   */
  start(): void {
    if (this.unsubscribe) return; // Already running

    const engine = getTimeEngine();

    // Run simulation on each hour change
    this.unsubscribe = engine.on('hour_change', (event) => {
      this.simulateHour(event);
    });

    // Also hook into time jumps for bulk simulation
    engine.on('time_jump', (event) => {
      this.handleTimeJump(event);
    });

    this.state.lastSimulatedHour = engine.getTime().totalHours;
    console.log('[WorldSimulation] Started');
  }

  /**
   * Stop world simulation
   */
  stop(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
      console.log('[WorldSimulation] Stopped');
    }
  }

  // ============================================================================
  // SIMULATION LOOP
  // ============================================================================

  /**
   * Simulate one hour of world activity
   */
  private simulateHour(event: TimeEvent): void {
    const currentHour = event.newTime.totalHours;

    // Process expired events
    this.processExpiredEvents(currentHour);

    // Roll for new events (each hour has small chance)
    this.rollForEvents(event.newTime, 1);

    this.state.lastSimulatedHour = currentHour;
  }

  /**
   * Handle time jump - simulate multiple hours at once
   */
  private handleTimeJump(event: TimeEvent): void {
    const hoursElapsed = event.hoursElapsed;

    // Process expired events up to new time
    this.processExpiredEvents(event.newTime.totalHours);

    // Generate events for the time period (scaled)
    // More hours = more events, but not linear (diminishing returns)
    const eventMultiplier = Math.log2(hoursElapsed + 1);
    this.rollForEvents(event.newTime, eventMultiplier);

    this.state.lastSimulatedHour = event.newTime.totalHours;
  }

  /**
   * Remove expired events and their effects
   */
  private processExpiredEvents(currentHour: number): void {
    const expired: WorldEvent[] = [];

    this.state.activeEvents = this.state.activeEvents.filter(event => {
      if (event.expiresAt && currentHour >= event.expiresAt) {
        expired.push(event);
        return false;
      }
      return true;
    });

    // Remove effects from expired events
    for (const event of expired) {
      this.removeEventEffects(event);
    }
  }

  /**
   * Roll for random events based on rates
   */
  private rollForEvents(time: GameTime, multiplier: number): void {
    // Get time of day modifier (more crime at night, more political in day)
    const isNight = time.timeOfDay === 'night' || time.timeOfDay === 'evening';

    for (const [category, baseRate] of Object.entries(this.EVENT_RATES)) {
      // Adjust rate based on time and multiplier
      let rate = baseRate * multiplier / 24; // Per-hour rate

      // Time-of-day adjustments
      if (category === 'crime_wave' && isNight) rate *= 1.5;
      if (category === 'gang_territory' && isNight) rate *= 2;
      if (category === 'political' && !isNight) rate *= 1.5;
      if (category === 'economic' && !isNight) rate *= 1.3;

      if (Math.random() < rate) {
        const event = this.generateEvent(category as WorldEventCategory, time);
        if (event) {
          this.addEvent(event);
        }
      }
    }
  }

  // ============================================================================
  // EVENT GENERATION
  // ============================================================================

  /**
   * Generate a random event of a given category
   */
  private generateEvent(category: WorldEventCategory, time: GameTime): WorldEvent | null {
    switch (category) {
      case 'gang_territory':
        return this.generateGangEvent(time);
      case 'political':
        return this.generatePoliticalEvent(time);
      case 'economic':
        return this.generateEconomicEvent(time);
      case 'crime_wave':
        return this.generateCrimeWaveEvent(time);
      case 'superhuman':
        return this.generateSuperhumanEvent(time);
      case 'natural_disaster':
        return this.generateDisasterEvent(time);
      case 'military':
        return this.generateMilitaryEvent(time);
      case 'social':
        return this.generateSocialEvent(time);
      default:
        return null;
    }
  }

  /**
   * Gang territory event - factions gain/lose control
   */
  private generateGangEvent(time: GameTime): WorldEvent {
    const templates = [
      { headline: 'Gang war erupts in %city%', importance: 'major' as const, duration: 48 },
      { headline: 'New gang moves into %city%', importance: 'normal' as const, duration: 0 },
      { headline: 'Police crackdown clears gang from %city% district', importance: 'normal' as const, duration: 72 },
      { headline: 'Rival factions clash in %city%', importance: 'minor' as const, duration: 24 },
      { headline: 'Gang boss assassinated in %city%', importance: 'major' as const, duration: 0 },
    ];

    const template = templates[Math.floor(Math.random() * templates.length)];
    const city = this.getRandomCity();

    return {
      id: this.generateEventId(),
      timestamp: { ...time },
      category: 'gang_territory',
      headline: template.headline.replace('%city%', city.name),
      description: `Criminal activity surges as gangs contest territory in ${city.name}.`,
      importance: template.importance,
      affectedCountries: [city.countryCode],
      affectedCities: [city.name],
      effects: [
        { type: 'city_stat', target: 'crimeIndex', value: 10 + Math.floor(Math.random() * 15) },
      ],
      duration: template.duration,
      expiresAt: template.duration > 0 ? time.totalHours + template.duration : undefined,
    };
  }

  /**
   * Political event - coups, elections, policy changes
   */
  private generatePoliticalEvent(time: GameTime): WorldEvent {
    const templates = [
      { headline: 'Political unrest grows in %country%', importance: 'normal' as const, effect: 'politicalInstability', value: 5, duration: 168 },
      { headline: 'Election results contested in %country%', importance: 'major' as const, effect: 'politicalInstability', value: 15, duration: 336 },
      { headline: 'Military coup attempted in %country%', importance: 'critical' as const, effect: 'politicalInstability', value: 40, duration: 0 },
      { headline: 'New government sworn in at %country%', importance: 'normal' as const, effect: 'politicalInstability', value: -10, duration: 0 },
      { headline: 'Parliament dissolved in %country%', importance: 'major' as const, effect: 'politicalInstability', value: 20, duration: 168 },
      { headline: 'Constitutional crisis in %country%', importance: 'major' as const, effect: 'governmentCorruption', value: 10, duration: 336 },
    ];

    const template = templates[Math.floor(Math.random() * templates.length)];
    const country = this.getRandomCountry();

    return {
      id: this.generateEventId(),
      timestamp: { ...time },
      category: 'political',
      headline: template.headline.replace('%country%', country.name),
      description: `Political situation develops in ${country.name}.`,
      importance: template.importance,
      affectedCountries: [country.code],
      affectedCities: [],
      effects: [
        { type: 'country_stat', target: template.effect, value: template.value },
      ],
      duration: template.duration,
      expiresAt: template.duration > 0 ? time.totalHours + template.duration : undefined,
    };
  }

  /**
   * Economic event - market changes, crashes, booms
   */
  private generateEconomicEvent(time: GameTime): WorldEvent {
    const templates = [
      { headline: 'Stock market tumbles in %country%', importance: 'major' as const, priceEffect: 1.3, duration: 168 },
      { headline: 'Economic boom reported in %country%', importance: 'normal' as const, priceEffect: 0.85, duration: 336 },
      { headline: 'Currency devaluation hits %country%', importance: 'major' as const, priceEffect: 1.5, duration: 504 },
      { headline: 'Trade sanctions imposed on %country%', importance: 'critical' as const, priceEffect: 1.8, duration: 672 },
      { headline: 'New trade deal benefits %country%', importance: 'normal' as const, priceEffect: 0.9, duration: 504 },
      { headline: 'Inflation concerns grow in %country%', importance: 'minor' as const, priceEffect: 1.15, duration: 168 },
    ];

    const template = templates[Math.floor(Math.random() * templates.length)];
    const country = this.getRandomCountry();

    return {
      id: this.generateEventId(),
      timestamp: { ...time },
      category: 'economic',
      headline: template.headline.replace('%country%', country.name),
      description: `Economic conditions shift in ${country.name}, affecting local markets.`,
      importance: template.importance,
      affectedCountries: [country.code],
      affectedCities: [],
      effects: [
        { type: 'price_modifier', target: country.code, value: template.priceEffect, isMultiplier: true },
      ],
      duration: template.duration,
      expiresAt: template.duration > 0 ? time.totalHours + template.duration : undefined,
    };
  }

  /**
   * Crime wave event - temporary crime spike in city
   */
  private generateCrimeWaveEvent(time: GameTime): WorldEvent {
    const templates = [
      { headline: 'Crime wave hits %city%', crimeChange: 20, duration: 72 },
      { headline: 'Serial burglar active in %city%', crimeChange: 10, duration: 48 },
      { headline: 'Armed robberies surge in %city%', crimeChange: 25, duration: 96 },
      { headline: 'Police resources stretched in %city%', crimeChange: 15, duration: 120 },
      { headline: 'Vigilante activity reported in %city%', crimeChange: -10, duration: 48 },
    ];

    const template = templates[Math.floor(Math.random() * templates.length)];
    const city = this.getRandomCity();

    return {
      id: this.generateEventId(),
      timestamp: { ...time },
      category: 'crime_wave',
      headline: template.headline.replace('%city%', city.name),
      description: `Criminal activity levels change in ${city.name}.`,
      importance: Math.abs(template.crimeChange) >= 20 ? 'major' : 'normal',
      affectedCountries: [city.countryCode],
      affectedCities: [city.name],
      effects: [
        { type: 'city_stat', target: 'crimeIndex', value: template.crimeChange },
      ],
      duration: template.duration,
      expiresAt: time.totalHours + template.duration,
    };
  }

  /**
   * Superhuman event - LSW incidents, villain attacks
   */
  private generateSuperhumanEvent(time: GameTime): WorldEvent {
    const templates = [
      { headline: 'Superhuman battle damages %city% downtown', importance: 'major' as const, duration: 0 },
      { headline: 'LSW sighting reported in %city%', importance: 'minor' as const, duration: 0 },
      { headline: 'Villain attack thwarted in %city%', importance: 'normal' as const, duration: 0 },
      { headline: 'Government deploys powered response team to %city%', importance: 'major' as const, duration: 72 },
      { headline: 'Unknown superhuman causes panic in %city%', importance: 'normal' as const, duration: 24 },
      { headline: 'Hero saves civilians in %city% disaster', importance: 'normal' as const, duration: 0 },
      { headline: 'Supervillain escapes from %city% prison', importance: 'critical' as const, duration: 168 },
    ];

    const template = templates[Math.floor(Math.random() * templates.length)];
    const city = this.getRandomCity();

    return {
      id: this.generateEventId(),
      timestamp: { ...time },
      category: 'superhuman',
      headline: template.headline.replace('%city%', city.name),
      description: `Superhuman activity detected in ${city.name}.`,
      importance: template.importance,
      affectedCountries: [city.countryCode],
      affectedCities: [city.name],
      effects: [],
      duration: template.duration,
      expiresAt: template.duration > 0 ? time.totalHours + template.duration : undefined,
    };
  }

  /**
   * Natural disaster event
   */
  private generateDisasterEvent(time: GameTime): WorldEvent {
    const templates = [
      { headline: 'Earthquake strikes %city% region', importance: 'critical' as const, duration: 336 },
      { headline: 'Flooding devastates %city%', importance: 'major' as const, duration: 168 },
      { headline: 'Hurricane approaches %city%', importance: 'critical' as const, duration: 72 },
      { headline: 'Wildfire threatens %city% suburbs', importance: 'major' as const, duration: 120 },
    ];

    const template = templates[Math.floor(Math.random() * templates.length)];
    const city = this.getRandomCity();

    return {
      id: this.generateEventId(),
      timestamp: { ...time },
      category: 'natural_disaster',
      headline: template.headline.replace('%city%', city.name),
      description: `Natural disaster affects ${city.name} and surrounding area.`,
      importance: template.importance,
      affectedCountries: [city.countryCode],
      affectedCities: [city.name],
      effects: [
        { type: 'price_modifier', target: 'medical', value: 2.0, isMultiplier: true },
        { type: 'city_stat', target: 'safetyIndex', value: -30 },
      ],
      duration: template.duration,
      expiresAt: time.totalHours + template.duration,
    };
  }

  /**
   * Military event - conflicts, interventions
   */
  private generateMilitaryEvent(time: GameTime): WorldEvent {
    const templates = [
      { headline: 'Military exercises begin in %country%', importance: 'minor' as const, duration: 168 },
      { headline: 'Border tensions rise with %country%', importance: 'major' as const, duration: 336 },
      { headline: 'UN peacekeepers deployed to %country%', importance: 'major' as const, duration: 672 },
      { headline: 'Arms embargo placed on %country%', importance: 'critical' as const, duration: 1344 },
    ];

    const template = templates[Math.floor(Math.random() * templates.length)];
    const country = this.getRandomCountry();

    return {
      id: this.generateEventId(),
      timestamp: { ...time },
      category: 'military',
      headline: template.headline.replace('%country%', country.name),
      description: `Military situation develops in ${country.name}.`,
      importance: template.importance,
      affectedCountries: [country.code],
      affectedCities: [],
      effects: [
        { type: 'country_stat', target: 'militaryBudget', value: 10 },
      ],
      duration: template.duration,
      expiresAt: time.totalHours + template.duration,
    };
  }

  /**
   * Social event - protests, riots, celebrations
   */
  private generateSocialEvent(time: GameTime): WorldEvent {
    const templates = [
      { headline: 'Protests erupt in %city%', importance: 'normal' as const, duration: 48 },
      { headline: 'Celebration fills streets of %city%', importance: 'minor' as const, duration: 24 },
      { headline: 'Strike paralyzes %city% transport', importance: 'major' as const, duration: 72 },
      { headline: 'Festival brings tourists to %city%', importance: 'minor' as const, duration: 168 },
      { headline: 'Riots break out in %city%', importance: 'major' as const, duration: 48 },
    ];

    const template = templates[Math.floor(Math.random() * templates.length)];
    const city = this.getRandomCity();

    return {
      id: this.generateEventId(),
      timestamp: { ...time },
      category: 'social',
      headline: template.headline.replace('%city%', city.name),
      description: `Social unrest or celebration in ${city.name}.`,
      importance: template.importance,
      affectedCountries: [city.countryCode],
      affectedCities: [city.name],
      effects: [],
      duration: template.duration,
      expiresAt: time.totalHours + template.duration,
    };
  }

  // ============================================================================
  // EVENT MANAGEMENT
  // ============================================================================

  /**
   * Add event and apply its effects
   */
  private addEvent(event: WorldEvent): void {
    this.state.activeEvents.push(event);
    this.state.eventHistory.unshift(event);

    // Keep history limited
    if (this.state.eventHistory.length > 100) {
      this.state.eventHistory.pop();
    }

    // Apply effects
    for (const effect of event.effects) {
      this.applyEffect(event, effect);
    }

    console.log(`[WorldSimulation] Event: ${event.headline}`);
  }

  /**
   * Apply an event effect
   */
  private applyEffect(event: WorldEvent, effect: WorldEventEffect): void {
    switch (effect.type) {
      case 'country_stat':
        for (const countryCode of event.affectedCountries) {
          if (!this.state.countryModifiers.has(countryCode)) {
            this.state.countryModifiers.set(countryCode, new Map());
          }
          const mods = this.state.countryModifiers.get(countryCode)!;
          mods.set(effect.target, (mods.get(effect.target) || 0) + effect.value);
        }
        break;

      case 'city_stat':
        for (const cityName of event.affectedCities) {
          if (!this.state.cityModifiers.has(cityName)) {
            this.state.cityModifiers.set(cityName, new Map());
          }
          const mods = this.state.cityModifiers.get(cityName)!;
          mods.set(effect.target, (mods.get(effect.target) || 0) + effect.value);
        }
        break;

      case 'price_modifier':
        const current = this.state.priceModifiers.get(effect.target) || 1;
        if (effect.isMultiplier) {
          this.state.priceModifiers.set(effect.target, current * effect.value);
        } else {
          this.state.priceModifiers.set(effect.target, current + effect.value);
        }
        break;
    }
  }

  /**
   * Remove event effects when it expires
   */
  private removeEventEffects(event: WorldEvent): void {
    for (const effect of event.effects) {
      switch (effect.type) {
        case 'country_stat':
          for (const countryCode of event.affectedCountries) {
            const mods = this.state.countryModifiers.get(countryCode);
            if (mods) {
              mods.set(effect.target, (mods.get(effect.target) || 0) - effect.value);
            }
          }
          break;

        case 'city_stat':
          for (const cityName of event.affectedCities) {
            const mods = this.state.cityModifiers.get(cityName);
            if (mods) {
              mods.set(effect.target, (mods.get(effect.target) || 0) - effect.value);
            }
          }
          break;

        case 'price_modifier':
          const current = this.state.priceModifiers.get(effect.target) || 1;
          if (effect.isMultiplier) {
            this.state.priceModifiers.set(effect.target, current / effect.value);
          } else {
            this.state.priceModifiers.set(effect.target, current - effect.value);
          }
          break;
      }
    }
  }

  // ============================================================================
  // GETTERS FOR GAME SYSTEMS
  // ============================================================================

  /**
   * Get modified country stat value
   */
  getCountryStatModifier(countryCode: string, stat: string): number {
    const mods = this.state.countryModifiers.get(countryCode);
    return mods?.get(stat) || 0;
  }

  /**
   * Get modified city stat value
   */
  getCityStatModifier(cityName: string, stat: string): number {
    const mods = this.state.cityModifiers.get(cityName);
    return mods?.get(stat) || 0;
  }

  /**
   * Get effective city crime index (base + modifiers)
   */
  getEffectiveCrimeIndex(city: City): number {
    const base = city.crimeIndex ?? 50;
    const modifier = this.getCityStatModifier(city.name, 'crimeIndex');
    return Math.max(0, Math.min(100, base + modifier));
  }

  /**
   * Get price modifier for a country or category
   */
  getPriceModifier(target: string): number {
    return this.state.priceModifiers.get(target) || 1;
  }

  /**
   * Get active events for a location
   */
  getEventsForCity(cityName: string): WorldEvent[] {
    return this.state.activeEvents.filter(e => e.affectedCities.includes(cityName));
  }

  /**
   * Get active events for a country
   */
  getEventsForCountry(countryCode: string): WorldEvent[] {
    return this.state.activeEvents.filter(e => e.affectedCountries.includes(countryCode));
  }

  /**
   * Get recent events (for news display)
   */
  getRecentEvents(count: number = 10): WorldEvent[] {
    return this.state.eventHistory.slice(0, count);
  }

  /**
   * Get all active events
   */
  getActiveEvents(): WorldEvent[] {
    return [...this.state.activeEvents];
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private generateEventId(): string {
    return `we_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getRandomCity(): City {
    return ALL_CITIES[Math.floor(Math.random() * ALL_CITIES.length)];
  }

  private getRandomCountry(): Country {
    // Get a country from one of our cities for consistency
    const city = this.getRandomCity();
    return getCountryByCode(city.countryCode) || {
      code: city.countryCode,
      name: city.countryCode,
    } as Country;
  }

  // ============================================================================
  // SERIALIZATION
  // ============================================================================

  serialize(): object {
    return {
      activeEvents: this.state.activeEvents,
      eventHistory: this.state.eventHistory,
      countryModifiers: Object.fromEntries(
        Array.from(this.state.countryModifiers.entries()).map(([k, v]) => [k, Object.fromEntries(v)])
      ),
      cityModifiers: Object.fromEntries(
        Array.from(this.state.cityModifiers.entries()).map(([k, v]) => [k, Object.fromEntries(v)])
      ),
      priceModifiers: Object.fromEntries(this.state.priceModifiers),
      gangTerritories: Object.fromEntries(this.state.gangTerritories),
      lastSimulatedHour: this.state.lastSimulatedHour,
    };
  }

  deserialize(data: any): void {
    this.state = {
      activeEvents: data.activeEvents || [],
      eventHistory: data.eventHistory || [],
      countryModifiers: new Map(
        Object.entries(data.countryModifiers || {}).map(([k, v]) => [k, new Map(Object.entries(v as object))])
      ),
      cityModifiers: new Map(
        Object.entries(data.cityModifiers || {}).map(([k, v]) => [k, new Map(Object.entries(v as object))])
      ),
      priceModifiers: new Map(Object.entries(data.priceModifiers || {})),
      gangTerritories: new Map(Object.entries(data.gangTerritories || {})),
      lastSimulatedHour: data.lastSimulatedHour || 0,
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let worldSimInstance: WorldSimulation | null = null;

export function getWorldSimulation(): WorldSimulation {
  if (!worldSimInstance) {
    worldSimInstance = new WorldSimulation();
  }
  return worldSimInstance;
}

export function initializeWorldSimulation(): WorldSimulation {
  worldSimInstance = new WorldSimulation();
  worldSimInstance.start();
  return worldSimInstance;
}
