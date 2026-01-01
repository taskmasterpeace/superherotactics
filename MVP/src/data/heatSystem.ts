/**
 * Heat System (FM-003, FM-004)
 *
 * Tracks government and faction "heat" - how much attention the player
 * is getting from various authorities.
 *
 * Heat mechanics:
 * - Combat generates heat based on witnesses, casualties, location
 * - Heat decays over time (faster in low-surveillance countries)
 * - High heat triggers bounty hunters, investigations, travel restrictions
 * - Different factions have separate heat tracking
 */

import { FactionType, BOUNTY_THRESHOLDS, BountyLevel } from './factionSystem';
import { Country, getCountryByCode } from './countries';
import { City, getCityByName } from './cities';
import { getTimeEngine } from './timeEngine';
import { getCrimeTimeModifier } from './timeEngine';

// ============================================================================
// HEAT LEVELS
// ============================================================================

export type HeatLevel = 'cold' | 'warm' | 'hot' | 'blazing' | 'inferno';

export const HEAT_THRESHOLDS: Array<{ min: number; max: number; level: HeatLevel; color: string }> = [
  { min: 0, max: 19, level: 'cold', color: '#22c55e' },       // Green - no attention
  { min: 20, max: 39, level: 'warm', color: '#eab308' },      // Yellow - being watched
  { min: 40, max: 59, level: 'hot', color: '#f97316' },       // Orange - active interest
  { min: 60, max: 79, level: 'blazing', color: '#ef4444' },   // Red - manhunt
  { min: 80, max: 100, level: 'inferno', color: '#a855f7' },  // Purple - kill on sight
];

export function getHeatLevel(heat: number): HeatLevel {
  const bracket = HEAT_THRESHOLDS.find(t => heat >= t.min && heat <= t.max);
  return bracket?.level ?? 'cold';
}

export function getHeatColor(heat: number): string {
  const bracket = HEAT_THRESHOLDS.find(t => heat >= t.min && heat <= t.max);
  return bracket?.color ?? '#22c55e';
}

// ============================================================================
// HEAT DATA STRUCTURES
// ============================================================================

export interface FactionHeat {
  factionType: FactionType;
  heat: number;              // 0-100
  lastIncreased: number;     // Game totalHours
  lastDecreased: number;     // Game totalHours
  decayBlocked: boolean;     // True if recent activity blocks decay
}

export interface CountryHeat {
  countryCode: string;
  factions: Record<FactionType, FactionHeat>;
  overallHeat: number;       // Average of faction heats
  heatLevel: HeatLevel;
}

export interface HeatState {
  countries: Map<string, CountryHeat>;
  globalHeat: number;        // International attention (Interpol, etc.)
  lastUpdated: number;
}

// ============================================================================
// HEAT GENERATION
// ============================================================================

export interface CombatHeatContext {
  countryCode: string;
  cityName?: string;

  // What happened
  enemiesKilled: number;
  civiliansKilled: number;
  civiliansHurt: number;
  propertyDamage: 'none' | 'minor' | 'major' | 'catastrophic';

  // Who saw it
  witnessCount: number;
  caughtOnCamera: boolean;
  identifiedByName: boolean;

  // Combat characteristics
  usedPowers: boolean;
  usedExplosives: boolean;
  usedIllegalWeapons: boolean;

  // Enemy faction (affects who gets angry)
  enemyFactionType?: FactionType;
}

/**
 * Calculate heat generated from a combat encounter
 */
export function calculateCombatHeat(context: CombatHeatContext): Record<FactionType, number> {
  const heats: Record<FactionType, number> = {
    police: 0,
    military: 0,
    government: 0,
    media: 0,
    corporations: 0,
    underworld: 0,
  };

  // Base heat from kills
  const enemyKillHeat = context.enemiesKilled * 2;
  const civilianKillHeat = context.civiliansKilled * 15;
  const civilianHurtHeat = context.civiliansHurt * 5;

  // Property damage heat
  const damageHeat = {
    none: 0,
    minor: 3,
    major: 10,
    catastrophic: 25,
  }[context.propertyDamage];

  // Witness multiplier
  let witnessMultiplier = 1;
  if (context.witnessCount > 10) witnessMultiplier = 1.5;
  if (context.witnessCount > 50) witnessMultiplier = 2;
  if (context.caughtOnCamera) witnessMultiplier *= 1.5;
  if (context.identifiedByName) witnessMultiplier *= 2;

  // Special action modifiers
  let specialModifier = 1;
  if (context.usedPowers) specialModifier *= 1.3;
  if (context.usedExplosives) specialModifier *= 1.5;
  if (context.usedIllegalWeapons) specialModifier *= 1.2;

  // Base heat (before faction-specific adjustments)
  const baseHeat = (enemyKillHeat + civilianKillHeat + civilianHurtHeat + damageHeat)
    * witnessMultiplier * specialModifier;

  // Police: Care about all violence, especially civilian casualties
  heats.police = baseHeat * (context.civiliansKilled > 0 ? 1.5 : 1.0);

  // Military: Only care if significant or used military weapons
  if (context.enemyFactionType === 'military' || context.usedExplosives || baseHeat > 20) {
    heats.military = baseHeat * 0.8;
  }

  // Government: Care about public perception and stability
  heats.government = baseHeat * 0.6;
  if (context.identifiedByName) heats.government *= 1.5;

  // Media: Love a story, especially superhuman activity
  heats.media = context.witnessCount > 0 || context.caughtOnCamera
    ? baseHeat * 0.5
    : 0;
  if (context.usedPowers) heats.media *= 2;

  // Corporations: Care if their stuff was damaged
  if (context.propertyDamage !== 'none') {
    heats.corporations = damageHeat * 2;
  }

  // Underworld: Respect violence, hate snitches
  // Fighting underworld = they get mad
  // Fighting others = they don't care
  if (context.enemyFactionType === 'underworld') {
    heats.underworld = enemyKillHeat * 3;
  } else if (context.civiliansKilled === 0) {
    // Clean work earns underworld respect (negative heat = positive standing)
    heats.underworld = -enemyKillHeat * 0.5;
  }

  // Time of day modifier (crime at night is less noticed)
  const timeEngine = getTimeEngine();
  const timeOfDay = timeEngine.getTimeOfDay();
  const crimeModifier = getCrimeTimeModifier(timeOfDay);
  if (timeOfDay === 'night') {
    // Night crimes are less noticed (except by underworld)
    Object.keys(heats).forEach(key => {
      if (key !== 'underworld') {
        heats[key as FactionType] *= 0.7;
      }
    });
  }

  // Round all values
  Object.keys(heats).forEach(key => {
    heats[key as FactionType] = Math.round(heats[key as FactionType]);
  });

  return heats;
}

// ============================================================================
// HEAT DECAY
// ============================================================================

/**
 * Calculate heat decay rate based on country surveillance level
 * Higher surveillance = slower decay
 */
export function getHeatDecayRate(country: Country): number {
  // Base decay: 1 point per hour
  let baseDecay = 1;

  // Surveillance modifier (from intel/cyber/law enforcement)
  const surveillanceScore = (
    (country.intelAgencies || 50) +
    (country.cyberCapability || 50) +
    (country.lawEnforcement || 50)
  ) / 3;

  // High surveillance = slower decay
  if (surveillanceScore >= 80) return baseDecay * 0.3;  // Very slow
  if (surveillanceScore >= 60) return baseDecay * 0.5;  // Slow
  if (surveillanceScore >= 40) return baseDecay * 0.75; // Normal
  if (surveillanceScore >= 20) return baseDecay * 1.0;  // Fast
  return baseDecay * 1.5;                                // Very fast (chaotic countries)
}

/**
 * Get hours until heat reaches zero at current decay rate
 */
export function getHeatCooldownHours(heat: number, decayRate: number): number {
  if (decayRate <= 0) return Infinity;
  return Math.ceil(heat / decayRate);
}

// ============================================================================
// HEAT EFFECTS
// ============================================================================

export interface HeatEffects {
  // Encounter chances (per day)
  policeCheckChance: number;      // Random police stop
  bountyHunterChance: number;     // Bounty hunter encounter
  investigationChance: number;    // Investigation started

  // Travel effects
  travelTimeMultiplier: number;
  visaRequired: boolean;
  borderSearchChance: number;

  // Shop effects
  priceMultiplier: number;
  blackMarketOnly: boolean;

  // Safe house effects
  safeHouseCompromiseChance: number;
}

/**
 * Get gameplay effects based on heat level
 */
export function getHeatEffects(heat: number): HeatEffects {
  const level = getHeatLevel(heat);

  switch (level) {
    case 'cold':
      return {
        policeCheckChance: 0.01,
        bountyHunterChance: 0,
        investigationChance: 0,
        travelTimeMultiplier: 1.0,
        visaRequired: false,
        borderSearchChance: 0.05,
        priceMultiplier: 1.0,
        blackMarketOnly: false,
        safeHouseCompromiseChance: 0.01,
      };

    case 'warm':
      return {
        policeCheckChance: 0.05,
        bountyHunterChance: 0,
        investigationChance: 0.02,
        travelTimeMultiplier: 1.1,
        visaRequired: false,
        borderSearchChance: 0.15,
        priceMultiplier: 1.1,
        blackMarketOnly: false,
        safeHouseCompromiseChance: 0.03,
      };

    case 'hot':
      return {
        policeCheckChance: 0.15,
        bountyHunterChance: 0.05,
        investigationChance: 0.10,
        travelTimeMultiplier: 1.3,
        visaRequired: true,
        borderSearchChance: 0.40,
        priceMultiplier: 1.25,
        blackMarketOnly: false,
        safeHouseCompromiseChance: 0.10,
      };

    case 'blazing':
      return {
        policeCheckChance: 0.30,
        bountyHunterChance: 0.20,
        investigationChance: 0.25,
        travelTimeMultiplier: 2.0,
        visaRequired: true,
        borderSearchChance: 0.75,
        priceMultiplier: 1.5,
        blackMarketOnly: true,
        safeHouseCompromiseChance: 0.25,
      };

    case 'inferno':
    default:
      return {
        policeCheckChance: 0.50,
        bountyHunterChance: 0.40,
        investigationChance: 0.50,
        travelTimeMultiplier: 3.0,
        visaRequired: true,
        borderSearchChance: 0.95,
        priceMultiplier: 2.0,
        blackMarketOnly: true,
        safeHouseCompromiseChance: 0.50,
      };
  }
}

// ============================================================================
// HEAT MANAGER CLASS
// ============================================================================

export class HeatManager {
  private state: HeatState;
  private unsubscribe: (() => void) | null = null;

  constructor() {
    this.state = {
      countries: new Map(),
      globalHeat: 0,
      lastUpdated: 0,
    };
  }

  /**
   * Start heat decay system - hooks into TimeEngine
   */
  start(): void {
    if (this.unsubscribe) return;

    const engine = getTimeEngine();
    this.unsubscribe = engine.on('hour_change', () => {
      this.processHeatDecay();
    });

    this.state.lastUpdated = engine.getTime().totalHours;
  }

  /**
   * Stop heat decay system
   */
  stop(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  /**
   * Process hourly heat decay
   */
  private processHeatDecay(): void {
    const engine = getTimeEngine();
    const currentHour = engine.getTime().totalHours;

    for (const [countryCode, countryHeat] of this.state.countries) {
      const country = getCountryByCode(countryCode);
      if (!country) continue;

      const decayRate = getHeatDecayRate(country);

      for (const [factionType, factionHeat] of Object.entries(countryHeat.factions) as [FactionType, FactionHeat][]) {
        // Skip if decay blocked (recent activity)
        if (factionHeat.decayBlocked && currentHour - factionHeat.lastIncreased < 6) {
          continue;
        }

        // Decay heat
        if (factionHeat.heat > 0) {
          factionHeat.heat = Math.max(0, factionHeat.heat - decayRate);
          factionHeat.lastDecreased = currentHour;
          factionHeat.decayBlocked = false;
        }
      }

      // Recalculate overall heat
      this.recalculateOverallHeat(countryCode);
    }

    // Decay global heat
    if (this.state.globalHeat > 0) {
      this.state.globalHeat = Math.max(0, this.state.globalHeat - 0.5);
    }

    this.state.lastUpdated = currentHour;
  }

  /**
   * Add heat from combat
   */
  addCombatHeat(context: CombatHeatContext): void {
    const heats = calculateCombatHeat(context);
    const engine = getTimeEngine();
    const currentHour = engine.getTime().totalHours;

    this.ensureCountryExists(context.countryCode);
    const countryHeat = this.state.countries.get(context.countryCode)!;

    for (const [factionType, heatAmount] of Object.entries(heats) as [FactionType, number][]) {
      if (heatAmount === 0) continue;

      const factionHeat = countryHeat.factions[factionType];
      factionHeat.heat = Math.min(100, Math.max(0, factionHeat.heat + heatAmount));
      factionHeat.lastIncreased = currentHour;
      factionHeat.decayBlocked = true;
    }

    this.recalculateOverallHeat(context.countryCode);

    // Add to global heat if significant
    const totalHeat = Object.values(heats).reduce((a, b) => a + b, 0);
    if (totalHeat > 20) {
      this.state.globalHeat = Math.min(100, this.state.globalHeat + totalHeat * 0.1);
    }
  }

  /**
   * Ensure country heat tracking exists
   */
  private ensureCountryExists(countryCode: string): void {
    if (!this.state.countries.has(countryCode)) {
      const factions: Record<FactionType, FactionHeat> = {} as any;
      const types: FactionType[] = ['police', 'military', 'government', 'media', 'corporations', 'underworld'];

      for (const type of types) {
        factions[type] = {
          factionType: type,
          heat: 0,
          lastIncreased: 0,
          lastDecreased: 0,
          decayBlocked: false,
        };
      }

      this.state.countries.set(countryCode, {
        countryCode,
        factions,
        overallHeat: 0,
        heatLevel: 'cold',
      });
    }
  }

  /**
   * Recalculate overall heat for a country
   */
  private recalculateOverallHeat(countryCode: string): void {
    const countryHeat = this.state.countries.get(countryCode);
    if (!countryHeat) return;

    const heats = Object.values(countryHeat.factions).map(f => f.heat);
    countryHeat.overallHeat = heats.reduce((a, b) => a + b, 0) / heats.length;
    countryHeat.heatLevel = getHeatLevel(countryHeat.overallHeat);
  }

  // ============================================================================
  // GETTERS
  // ============================================================================

  getCountryHeat(countryCode: string): CountryHeat | undefined {
    return this.state.countries.get(countryCode);
  }

  getFactionHeat(countryCode: string, factionType: FactionType): number {
    const countryHeat = this.state.countries.get(countryCode);
    return countryHeat?.factions[factionType]?.heat ?? 0;
  }

  getGlobalHeat(): number {
    return this.state.globalHeat;
  }

  getHotCountries(): CountryHeat[] {
    return Array.from(this.state.countries.values())
      .filter(c => c.overallHeat >= 40)
      .sort((a, b) => b.overallHeat - a.overallHeat);
  }

  // ============================================================================
  // SERIALIZATION
  // ============================================================================

  serialize(): object {
    return {
      countries: Object.fromEntries(this.state.countries),
      globalHeat: this.state.globalHeat,
      lastUpdated: this.state.lastUpdated,
    };
  }

  deserialize(data: any): void {
    this.state = {
      countries: new Map(Object.entries(data.countries || {})),
      globalHeat: data.globalHeat || 0,
      lastUpdated: data.lastUpdated || 0,
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let heatManagerInstance: HeatManager | null = null;

export function getHeatManager(): HeatManager {
  if (!heatManagerInstance) {
    heatManagerInstance = new HeatManager();
  }
  return heatManagerInstance;
}

export function initializeHeatManager(): HeatManager {
  heatManagerInstance = new HeatManager();
  heatManagerInstance.start();
  return heatManagerInstance;
}
