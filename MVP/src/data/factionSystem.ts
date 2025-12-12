/**
 * Faction Relations System
 *
 * Tracks player reputation with 6 faction types across 168 countries.
 * Each faction offers missions, equipment, and reacts to player actions.
 *
 * See: FACTION_RELATIONS_PROPOSAL.md for full design details
 */

// =============================================================================
// FACTION TYPES
// =============================================================================

export type FactionType =
  | 'police'          // Law enforcement
  | 'military'        // National defense
  | 'government'      // Political leadership, intelligence
  | 'media'           // News organizations
  | 'corporations'    // Private companies, PMCs
  | 'underworld';     // Criminal syndicates

export const FACTION_NAMES: Record<FactionType, string> = {
  police: 'Police',
  military: 'Military',
  government: 'Government',
  media: 'Media',
  corporations: 'Corporations',
  underworld: 'Underworld',
};

export const FACTION_ICONS: Record<FactionType, string> = {
  police: '👮',
  military: '⚔️',
  government: '🏛️',
  media: '📰',
  corporations: '🏢',
  underworld: '🎭',
};

// =============================================================================
// STANDING SCALE
// =============================================================================

export type StandingLabel =
  | 'Hero'           // 75-100
  | 'Respected'      // 50-74
  | 'Neutral+'       // 25-49
  | 'Unknown'        // 0-24
  | 'Suspicious'     // -1 to -24
  | 'Vigilante'      // -25 to -49
  | 'Criminal'       // -50 to -74
  | 'Terrorist';     // -75 to -100

export const STANDING_THRESHOLDS: Array<{ min: number; max: number; label: StandingLabel; color: string }> = [
  { min: 75, max: 100, label: 'Hero', color: '#22c55e' },         // Green
  { min: 50, max: 74, label: 'Respected', color: '#3b82f6' },     // Blue
  { min: 25, max: 49, label: 'Neutral+', color: '#ffffff' },      // White
  { min: 0, max: 24, label: 'Unknown', color: '#9ca3af' },        // Gray
  { min: -24, max: -1, label: 'Suspicious', color: '#eab308' },   // Yellow
  { min: -49, max: -25, label: 'Vigilante', color: '#f97316' },   // Orange
  { min: -74, max: -50, label: 'Criminal', color: '#ef4444' },    // Red
  { min: -100, max: -75, label: 'Terrorist', color: '#a855f7' },  // Purple
];

export function getStandingLabel(standing: number): StandingLabel {
  const bracket = STANDING_THRESHOLDS.find(
    (t) => standing >= t.min && standing <= t.max
  );
  return bracket?.label ?? 'Unknown';
}

export function getStandingColor(standing: number): string {
  const bracket = STANDING_THRESHOLDS.find(
    (t) => standing >= t.min && standing <= t.max
  );
  return bracket?.color ?? '#9ca3af';
}

// =============================================================================
// FACTION STANDING DATA
// =============================================================================

export interface StandingEvent {
  timestamp: number;           // Game timestamp
  change: number;              // + or - value
  newStanding: number;
  reason: string;
  missionId?: string;
}

export interface FactionStanding {
  factionId: string;           // "police_usa", "military_russia", etc.
  factionType: FactionType;
  countryCode: string;         // 2-letter ISO code
  countryName: string;

  standing: number;            // -100 to +100
  standingLabel: StandingLabel;

  // History
  lastChanged: number;         // Game timestamp
  lastChangeReason: string;
  history: StandingEvent[];    // Last 20 events

  // Status
  activeBounty: Bounty | null;
  isMember: boolean;           // Officially joined faction
  memberRank?: number;         // 1-10 if member

  // Unlocks (cached for performance)
  unlockedMissions: string[];      // Mission template IDs
  unlockedEquipment: string[];     // Equipment IDs
  unlockedSafeHouses: string[];    // City IDs
}

// =============================================================================
// BOUNTY SYSTEM
// =============================================================================

export type BountyLevel = 'minor' | 'major' | 'extreme';

export interface Bounty {
  id: string;
  factionId: string;
  factionType: FactionType;
  countryCode: string;

  amount: number;              // Cash reward for killing player
  level: BountyLevel;

  issuedAt: number;            // Game timestamp
  lastAttempt?: number;        // Last bounty hunter encounter
  attemptsCount: number;

  hunterThreatLevel: number;   // 1-9
  hunterCount: { min: number; max: number };

  status: 'active' | 'inactive' | 'paid_off' | 'expired';
}

export const BOUNTY_THRESHOLDS: Record<BountyLevel, {
  standingRange: [number, number];
  amount: number;
  hunterCount: { min: number; max: number };
  threatLevel: number;
  encounterChancePerDay: number;
}> = {
  minor: {
    standingRange: [-49, -25],
    amount: 10000,
    hunterCount: { min: 1, max: 3 },
    threatLevel: 2,
    encounterChancePerDay: 0.10,
  },
  major: {
    standingRange: [-74, -50],
    amount: 50000,
    hunterCount: { min: 4, max: 8 },
    threatLevel: 4,
    encounterChancePerDay: 0.25,
  },
  extreme: {
    standingRange: [-100, -75],
    amount: 250000,
    hunterCount: { min: 8, max: 15 },
    threatLevel: 7,
    encounterChancePerDay: 0.50,
  },
};

// =============================================================================
// COUNTRY REPUTATION SUMMARY
// =============================================================================

export interface CountryReputation {
  countryCode: string;
  countryName: string;

  // Aggregate
  overallReputation: number;   // Average of all 6 factions
  overallLabel: StandingLabel;

  // Per-faction standings
  factions: {
    police: number;
    military: number;
    government: number;
    media: number;
    corporations: number;
    underworld: number;
  };

  // Effects
  borderControlModifier: number; // % travel time change
  priceModifier: number;         // % price change
  canEnterLegally: boolean;

  // Active issues
  activeBounties: Bounty[];
  totalBountyAmount: number;
}

// =============================================================================
// FACTION STARTING STANDINGS
// =============================================================================

import { Country } from './countries';

/**
 * Calculate initial standing for a faction based on country attributes
 */
export function getInitialStanding(
  factionType: FactionType,
  country: Country,
  isHomeCountry: boolean = false
): number {
  switch (factionType) {
    case 'police':
      // Based on LSW regulations
      if (country.lswRegulations === 'Legal') return 25;
      if (country.lswRegulations === 'Regulated') return 0;
      if (country.lswRegulations === 'Banned') return -15;
      return 0;

    case 'military':
      // Based on government perception
      if (isHomeCountry) return 30;
      if (country.governmentPerception === 'Full Democracy') return 10;
      if (country.governmentPerception === 'Flawed Democracy') return 0;
      if (country.governmentPerception === 'Hybrid Regime') return -10;
      if (country.governmentPerception === 'Authoritarian Regime') return -25;
      return 0;

    case 'government':
      // Home country starts high, others vary
      if (isHomeCountry) return 50;
      // TODO: Culture group matching for +15 to allied countries
      return 0;

    case 'media':
      // Based on media freedom
      if (country.mediaFreedom >= 70) return 10;
      if (country.mediaFreedom >= 40) return 0;
      return -10;

    case 'corporations':
      // Based on GDP per capita
      if (country.gdpPerCapita >= 60) return 15;
      if (country.gdpPerCapita >= 40) return 5;
      return -5;

    case 'underworld':
      // Based on crime index (calculated from cities in that country)
      // TODO: Get average crime index from cities
      // For now, default to 0
      return 0;

    default:
      return 0;
  }
}

// =============================================================================
// STANDING EFFECTS
// =============================================================================

/**
 * Get price modifier based on standing
 * Returns multiplier (1.0 = normal, 0.75 = 25% discount, 1.50 = 50% markup)
 */
export function getPriceModifier(standing: number): number {
  if (standing >= 75) return 0.75;   // -25% (Hero)
  if (standing >= 50) return 0.90;   // -10% (Respected)
  if (standing >= 25) return 1.0;    // Normal (Neutral+)
  if (standing >= 0) return 1.15;    // +15% (Unknown)
  if (standing >= -49) return 1.30;  // +30% (Suspicious/Vigilante)
  return 1.75;                       // +75% (Criminal/Terrorist)
}

/**
 * Get sell price modifier based on standing
 */
export function getSellPriceModifier(standing: number): number {
  if (standing >= 75) return 1.20;   // +20% (Hero)
  if (standing >= 50) return 1.10;   // +10% (Respected)
  if (standing >= 25) return 1.0;    // Normal (Neutral+)
  if (standing >= 0) return 0.90;    // -10% (Unknown)
  if (standing >= -49) return 0.70;  // -30% (Suspicious/Vigilante)
  return 0.50;                       // -50% (Criminal/Terrorist)
}

/**
 * Get travel time modifier based on country reputation
 * Returns multiplier (1.0 = normal, 0.5 = 50% faster, 2.0 = 2x slower)
 */
export function getTravelTimeModifier(overallReputation: number): number {
  if (overallReputation >= 75) return 0.50;   // -50% (Hero)
  if (overallReputation >= 50) return 0.75;   // -25% (Respected)
  if (overallReputation >= 25) return 1.0;    // Normal (Neutral+)
  if (overallReputation >= 0) return 1.0;     // Normal (Unknown)
  if (overallReputation >= -24) return 1.25;  // +25% (Suspicious)
  if (overallReputation >= -49) return 1.50;  // +50% (Vigilante)
  if (overallReputation >= -74) return 2.0;   // +100% (Criminal)
  return Infinity;                            // Cannot enter (Terrorist)
}

/**
 * Can player enter country legally?
 */
export function canEnterLegally(overallReputation: number): boolean {
  return overallReputation > -75;
}

/**
 * Get equipment tier unlocked by standing
 */
export type EquipmentTier = 'basic' | 'advanced' | 'military' | 'classified';

export function getEquipmentTier(standing: number): EquipmentTier {
  if (standing >= 75) return 'classified';
  if (standing >= 50) return 'military';
  if (standing >= 25) return 'advanced';
  return 'basic';
}

/**
 * Get safe house availability
 */
export function hasSafeHouseAccess(factionType: FactionType, standing: number): boolean {
  const thresholds: Record<FactionType, number> = {
    police: 50,
    military: 60,
    government: 70,
    corporations: 40,
    underworld: 30,
    media: 50,
  };
  return standing >= thresholds[factionType];
}

// =============================================================================
// FACTION CONFLICTS & ALLIANCES
// =============================================================================

export interface FactionRelationship {
  factionA: FactionType;
  factionB: FactionType;
  relationshipType: 'enemy' | 'ally';
  strength: 'low' | 'medium' | 'high' | 'extreme';
  modifier: number;  // Standing change multiplier
}

export const FACTION_RELATIONSHIPS: FactionRelationship[] = [
  // Enemies
  { factionA: 'police', factionB: 'underworld', relationshipType: 'enemy', strength: 'high', modifier: 0.67 },
  { factionA: 'government', factionB: 'underworld', relationshipType: 'enemy', strength: 'medium', modifier: 0.5 },
  { factionA: 'military', factionB: 'underworld', relationshipType: 'enemy', strength: 'low', modifier: 0.33 },

  // Allies
  { factionA: 'police', factionB: 'government', relationshipType: 'ally', strength: 'high', modifier: 0.5 },
  { factionA: 'military', factionB: 'government', relationshipType: 'ally', strength: 'high', modifier: 0.53 },
  { factionA: 'corporations', factionB: 'government', relationshipType: 'ally', strength: 'medium', modifier: 0.3 },
  { factionA: 'media', factionB: 'police', relationshipType: 'ally', strength: 'low', modifier: 0.2 },
];

/**
 * Apply faction relationship effects when standing changes
 * Returns array of { factionType, change } for related factions
 */
export function getRelatedFactionEffects(
  factionType: FactionType,
  standingChange: number
): Array<{ factionType: FactionType; change: number }> {
  const effects: Array<{ factionType: FactionType; change: number }> = [];

  for (const rel of FACTION_RELATIONSHIPS) {
    let relatedFaction: FactionType | null = null;
    let isRelevant = false;

    if (rel.factionA === factionType) {
      relatedFaction = rel.factionB;
      isRelevant = true;
    } else if (rel.factionB === factionType) {
      relatedFaction = rel.factionA;
      isRelevant = true;
    }

    if (isRelevant && relatedFaction) {
      let change = standingChange * rel.modifier;
      if (rel.relationshipType === 'enemy') {
        change = -Math.abs(change); // Enemies lose standing
      }
      effects.push({ factionType: relatedFaction, change: Math.round(change) });
    }
  }

  return effects;
}

// =============================================================================
// REPUTATION DECAY
// =============================================================================

/**
 * Calculate standing decay per day
 * Decays toward 0 over time if no interaction
 */
export function getStandingDecay(standing: number, daysPassed: number = 1): number {
  const DECAY_RATE_PER_30_DAYS = 1;

  if (standing > 50) {
    return -Math.floor((daysPassed / 30) * DECAY_RATE_PER_30_DAYS);
  }
  if (standing < -50) {
    return Math.floor((daysPassed / 30) * DECAY_RATE_PER_30_DAYS);
  }
  return 0; // No decay in -50 to +50 range
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Modify faction standing and return updated standing object
 */
export function modifyStanding(
  standing: FactionStanding,
  change: number,
  reason: string,
  timestamp: number,
  missionId?: string
): FactionStanding {
  const newStanding = Math.max(-100, Math.min(100, standing.standing + change));

  const event: StandingEvent = {
    timestamp,
    change,
    newStanding,
    reason,
    missionId,
  };

  // Keep last 20 events
  const newHistory = [event, ...standing.history].slice(0, 20);

  return {
    ...standing,
    standing: newStanding,
    standingLabel: getStandingLabel(newStanding),
    lastChanged: timestamp,
    lastChangeReason: reason,
    history: newHistory,
  };
}

/**
 * Check if bounty should be issued/updated
 */
export function checkBountyStatus(standing: FactionStanding, timestamp: number): Bounty | null {
  // No bounty if standing above -25
  if (standing.standing >= -25) {
    return null;
  }

  // Determine bounty level
  let level: BountyLevel = 'minor';
  if (standing.standing <= -75) level = 'extreme';
  else if (standing.standing <= -50) level = 'major';

  const bountyData = BOUNTY_THRESHOLDS[level];

  // If bounty exists and level matches, return existing
  if (standing.activeBounty && standing.activeBounty.level === level) {
    return standing.activeBounty;
  }

  // Create new bounty
  return {
    id: `bounty_${standing.factionId}_${timestamp}`,
    factionId: standing.factionId,
    factionType: standing.factionType,
    countryCode: standing.countryCode,
    amount: bountyData.amount,
    level,
    issuedAt: timestamp,
    attemptsCount: 0,
    hunterThreatLevel: bountyData.threatLevel,
    hunterCount: bountyData.hunterCount,
    status: 'active',
  };
}

/**
 * Calculate country-wide reputation summary
 */
export function getCountryReputation(
  countryCode: string,
  countryName: string,
  standings: FactionStanding[]
): CountryReputation {
  const countryStandings = standings.filter(s => s.countryCode === countryCode);

  const factionValues = {
    police: countryStandings.find(s => s.factionType === 'police')?.standing ?? 0,
    military: countryStandings.find(s => s.factionType === 'military')?.standing ?? 0,
    government: countryStandings.find(s => s.factionType === 'government')?.standing ?? 0,
    media: countryStandings.find(s => s.factionType === 'media')?.standing ?? 0,
    corporations: countryStandings.find(s => s.factionType === 'corporations')?.standing ?? 0,
    underworld: countryStandings.find(s => s.factionType === 'underworld')?.standing ?? 0,
  };

  const overallReputation = Math.round(
    (factionValues.police +
      factionValues.military +
      factionValues.government +
      factionValues.media +
      factionValues.corporations +
      factionValues.underworld) / 6
  );

  const activeBounties = countryStandings
    .map(s => s.activeBounty)
    .filter((b): b is Bounty => b !== null && b.status === 'active');

  return {
    countryCode,
    countryName,
    overallReputation,
    overallLabel: getStandingLabel(overallReputation),
    factions: factionValues,
    borderControlModifier: getTravelTimeModifier(overallReputation),
    priceModifier: getPriceModifier(overallReputation),
    canEnterLegally: canEnterLegally(overallReputation),
    activeBounties,
    totalBountyAmount: activeBounties.reduce((sum, b) => sum + b.amount, 0),
  };
}

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initialize faction standings for all countries
 */
export function initializeFactionStandings(
  countries: Country[],
  homeCountryCode: string
): FactionStanding[] {
  const standings: FactionStanding[] = [];

  for (const country of countries) {
    const isHome = country.code === homeCountryCode;

    for (const factionType of ['police', 'military', 'government', 'media', 'corporations', 'underworld'] as FactionType[]) {
      const initialStanding = getInitialStanding(factionType, country, isHome);

      standings.push({
        factionId: `${factionType}_${country.code.toLowerCase()}`,
        factionType,
        countryCode: country.code,
        countryName: country.name,
        standing: initialStanding,
        standingLabel: getStandingLabel(initialStanding),
        lastChanged: 0,
        lastChangeReason: 'Initial standing',
        history: [],
        activeBounty: null,
        isMember: false,
        unlockedMissions: [],
        unlockedEquipment: [],
        unlockedSafeHouses: [],
      });
    }
  }

  return standings;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  getStandingLabel,
  getStandingColor,
  getInitialStanding,
  getPriceModifier,
  getSellPriceModifier,
  getTravelTimeModifier,
  canEnterLegally,
  getEquipmentTier,
  hasSafeHouseAccess,
  getRelatedFactionEffects,
  getStandingDecay,
  modifyStanding,
  checkBountyStatus,
  getCountryReputation,
  initializeFactionStandings,
};
