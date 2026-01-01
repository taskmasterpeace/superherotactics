/**
 * Combat-to-Faction Wiring (FM-002)
 *
 * Connects combat results to faction standing changes.
 * When you fight someone, their faction remembers.
 */

import {
  FactionType,
  FactionStanding,
  modifyStanding,
  getRelatedFactionEffects,
  checkBountyStatus,
} from './factionSystem';
import { getHeatManager, CombatHeatContext } from './heatSystem';

// =============================================================================
// COMBAT RESULT TYPES
// =============================================================================

export interface CombatParticipant {
  id: string;
  name: string;
  faction?: FactionType;
  isPlayer: boolean;
  wasCivilian: boolean;
  status: 'alive' | 'wounded' | 'incapacitated' | 'dead';
}

export interface CombatResultForFactions {
  timestamp: number;
  countryCode: string;
  cityName: string;

  // Participants
  playerUnits: CombatParticipant[];
  enemyUnits: CombatParticipant[];

  // Outcomes
  playerCasualties: number;
  enemyKills: number;
  enemyWounds: number;
  civilianCasualties: number;

  // Context
  wasWitnessed: boolean;
  witnessCount: number;
  propertyDamage: number; // 0-100 scale
  wasProvoked: boolean;   // Did enemies attack first?
  missionType?: string;
}

// =============================================================================
// STANDING CHANGE CALCULATIONS
// =============================================================================

/**
 * Base standing changes by action type
 */
const STANDING_CHANGES = {
  // Killing enemies of a faction
  killEnemyOfFaction: {
    police: 3,      // Police appreciate you killing criminals
    military: 2,
    government: 2,
    media: 1,
    corporations: 2,
    underworld: 5,  // Underworld loves you eliminating competition
  },

  // Killing members of a faction
  killFactionMember: {
    police: -15,
    military: -20,
    government: -25,
    media: -10,
    corporations: -12,
    underworld: -8,
  },

  // Wounding members of a faction
  woundFactionMember: {
    police: -8,
    military: -10,
    government: -15,
    media: -5,
    corporations: -6,
    underworld: -4,
  },

  // Civilian casualties
  civilianKill: {
    police: -20,
    military: -15,
    government: -20,
    media: -25,
    corporations: -10,
    underworld: -5, // Underworld cares less
  },

  // Property damage
  propertyDamagePerPoint: {
    police: -0.1,
    military: -0.05,
    government: -0.15,
    media: -0.1,
    corporations: -0.2, // Corporations hate property damage
    underworld: 0,
  },

  // Being provoked (enemy attacked first) - reduces penalties
  provokedModifier: 0.5,

  // Witnessed modifier - increases changes
  witnessedModifier: 1.5,
};

// =============================================================================
// FACTION MAPPING
// =============================================================================

/**
 * Map enemy types to their faction
 */
export function getEnemyFaction(enemyType: string): FactionType | null {
  const factionMap: Record<string, FactionType> = {
    // Police types
    cop: 'police',
    police: 'police',
    swat: 'police',
    detective: 'police',

    // Military types
    soldier: 'military',
    military: 'military',
    guard: 'military',
    trooper: 'military',

    // Government types
    agent: 'government',
    government: 'government',
    fed: 'government',

    // Corporate types
    corporate: 'corporations',
    security: 'corporations',
    pmc: 'corporations',
    mercenary: 'corporations',

    // Underworld types
    gang: 'underworld',
    thug: 'underworld',
    criminal: 'underworld',
    mobster: 'underworld',
    cartel: 'underworld',
  };

  const lowerType = enemyType.toLowerCase();
  for (const [key, faction] of Object.entries(factionMap)) {
    if (lowerType.includes(key)) {
      return faction;
    }
  }
  return null;
}

// =============================================================================
// CORE CALCULATION
// =============================================================================

export interface FactionStandingChange {
  factionType: FactionType;
  change: number;
  reason: string;
}

/**
 * Calculate all faction standing changes from combat result
 */
export function calculateCombatFactionChanges(
  result: CombatResultForFactions
): FactionStandingChange[] {
  const changes: FactionStandingChange[] = [];
  const factionChanges: Record<FactionType, { total: number; reasons: string[] }> = {
    police: { total: 0, reasons: [] },
    military: { total: 0, reasons: [] },
    government: { total: 0, reasons: [] },
    media: { total: 0, reasons: [] },
    corporations: { total: 0, reasons: [] },
    underworld: { total: 0, reasons: [] },
  };

  // 1. Process enemy kills/wounds
  for (const enemy of result.enemyUnits) {
    if (!enemy.faction) continue;

    if (enemy.status === 'dead') {
      // Killed a faction member
      const basePenalty = STANDING_CHANGES.killFactionMember[enemy.faction];
      factionChanges[enemy.faction].total += basePenalty;
      factionChanges[enemy.faction].reasons.push(`Killed ${enemy.faction} member`);

      // But this helps their enemies
      const enemyFactions = getOpposingFactions(enemy.faction);
      for (const opposing of enemyFactions) {
        const bonus = STANDING_CHANGES.killEnemyOfFaction[opposing];
        factionChanges[opposing].total += bonus;
        factionChanges[opposing].reasons.push(`Eliminated ${enemy.faction} enemy`);
      }
    } else if (enemy.status === 'wounded' || enemy.status === 'incapacitated') {
      // Wounded a faction member
      const basePenalty = STANDING_CHANGES.woundFactionMember[enemy.faction];
      factionChanges[enemy.faction].total += basePenalty;
      factionChanges[enemy.faction].reasons.push(`Wounded ${enemy.faction} member`);
    }
  }

  // 2. Civilian casualties
  if (result.civilianCasualties > 0) {
    for (const faction of Object.keys(factionChanges) as FactionType[]) {
      const penalty = STANDING_CHANGES.civilianKill[faction] * result.civilianCasualties;
      factionChanges[faction].total += penalty;
      factionChanges[faction].reasons.push(`${result.civilianCasualties} civilian casualties`);
    }
  }

  // 3. Property damage
  if (result.propertyDamage > 0) {
    for (const faction of Object.keys(factionChanges) as FactionType[]) {
      const penalty = Math.round(
        STANDING_CHANGES.propertyDamagePerPoint[faction] * result.propertyDamage
      );
      if (penalty !== 0) {
        factionChanges[faction].total += penalty;
        factionChanges[faction].reasons.push(`Property damage (${result.propertyDamage}%)`);
      }
    }
  }

  // 4. Apply modifiers
  for (const faction of Object.keys(factionChanges) as FactionType[]) {
    let finalChange = factionChanges[faction].total;

    // Provoked modifier (reduces penalties)
    if (result.wasProvoked && finalChange < 0) {
      finalChange = Math.round(finalChange * STANDING_CHANGES.provokedModifier);
      factionChanges[faction].reasons.push('(self-defense)');
    }

    // Witnessed modifier (increases magnitude)
    if (result.wasWitnessed) {
      finalChange = Math.round(finalChange * STANDING_CHANGES.witnessedModifier);
      factionChanges[faction].reasons.push(`(${result.witnessCount} witnesses)`);
    }

    // Only add non-zero changes
    if (finalChange !== 0) {
      changes.push({
        factionType: faction,
        change: finalChange,
        reason: factionChanges[faction].reasons.join(', '),
      });
    }
  }

  return changes;
}

/**
 * Get factions that oppose a given faction
 */
function getOpposingFactions(faction: FactionType): FactionType[] {
  const oppositions: Record<FactionType, FactionType[]> = {
    police: ['underworld'],
    military: ['underworld'],
    government: ['underworld'],
    media: [],
    corporations: ['underworld'],
    underworld: ['police', 'military', 'government'],
  };
  return oppositions[faction] || [];
}

// =============================================================================
// APPLICATION TO GAME STATE
// =============================================================================

/**
 * Apply combat results to faction standings
 */
export function applyCombatToFactions(
  standings: FactionStanding[],
  result: CombatResultForFactions
): {
  updatedStandings: FactionStanding[];
  changes: FactionStandingChange[];
  newBounties: FactionStanding[];
} {
  const changes = calculateCombatFactionChanges(result);
  const updatedStandings = [...standings];
  const newBounties: FactionStanding[] = [];

  for (const change of changes) {
    // Find standing for this faction in this country
    const standingIndex = updatedStandings.findIndex(
      (s) => s.factionType === change.factionType && s.countryCode === result.countryCode
    );

    if (standingIndex !== -1) {
      const standing = updatedStandings[standingIndex];

      // Apply direct change
      const updated = modifyStanding(
        standing,
        change.change,
        change.reason,
        result.timestamp
      );

      // Check for bounty
      const bounty = checkBountyStatus(updated, result.timestamp);
      if (bounty && (!standing.activeBounty || standing.activeBounty.level !== bounty.level)) {
        updated.activeBounty = bounty;
        newBounties.push(updated);
      }

      updatedStandings[standingIndex] = updated;

      // Apply cascading effects to related factions
      const relatedEffects = getRelatedFactionEffects(change.factionType, change.change);
      for (const effect of relatedEffects) {
        const relatedIndex = updatedStandings.findIndex(
          (s) => s.factionType === effect.factionType && s.countryCode === result.countryCode
        );
        if (relatedIndex !== -1) {
          updatedStandings[relatedIndex] = modifyStanding(
            updatedStandings[relatedIndex],
            effect.change,
            `Related to ${change.factionType} action`,
            result.timestamp
          );
        }
      }
    }
  }

  // Also apply heat
  const heatManager = getHeatManager();
  const heatContext: CombatHeatContext = {
    countryCode: result.countryCode,
    cityName: result.cityName,
    enemiesKilled: result.enemyKills,
    enemiesWounded: result.enemyWounds,
    civiliansHurt: result.civilianCasualties,
    propertyDamage: result.propertyDamage,
    wasWitnessed: result.wasWitnessed,
    witnessCount: result.witnessCount,
    usedPowers: false, // Would need to pass this in
    timestamp: result.timestamp,
  };
  heatManager.addCombatHeat(heatContext);

  return {
    updatedStandings,
    changes,
    newBounties,
  };
}

// =============================================================================
// COMBAT LOG MESSAGES
// =============================================================================

/**
 * Generate human-readable messages for faction changes
 */
export function getFactionChangeMessages(changes: FactionStandingChange[]): string[] {
  const messages: string[] = [];

  for (const change of changes) {
    const direction = change.change > 0 ? 'increased' : 'decreased';
    const magnitude = Math.abs(change.change);

    let severity = '';
    if (magnitude >= 20) severity = 'dramatically ';
    else if (magnitude >= 10) severity = 'significantly ';
    else if (magnitude >= 5) severity = '';
    else severity = 'slightly ';

    messages.push(
      `${change.factionType.charAt(0).toUpperCase() + change.factionType.slice(1)} standing ${severity}${direction} (${change.change > 0 ? '+' : ''}${change.change})`
    );
  }

  return messages;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  getEnemyFaction,
  calculateCombatFactionChanges,
  applyCombatToFactions,
  getFactionChangeMessages,
};
