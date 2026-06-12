/**
 * Mission Faction Effects - Maps mission types to faction standing changes
 *
 * When a mission completes (success or failure), this defines
 * how each faction type is affected.
 */

import { FactionType } from './factionSystem';

// =============================================================================
// TYPES
// =============================================================================

export interface FactionEffect {
  faction: FactionType;
  successMod: number;   // Standing change on mission success
  failureMod: number;   // Standing change on mission failure
  reason: string;       // Reason text for standing history
}

export interface MissionFactionMapping {
  missionType: string;
  effects: FactionEffect[];
}

// =============================================================================
// MISSION TO FACTION MAPPINGS
// =============================================================================

/**
 * How different mission types affect faction standings
 *
 * Positive = faction approves
 * Negative = faction disapproves
 *
 * Success modifiers are typically stronger than failure
 */
export const MISSION_FACTION_EFFECTS: Record<string, FactionEffect[]> = {
  // Combat missions against criminals
  'combat': [
    { faction: 'police', successMod: +8, failureMod: -3, reason: 'Combat operation' },
    { faction: 'media', successMod: +5, failureMod: -8, reason: 'Combat coverage' },
    { faction: 'underworld', successMod: -5, failureMod: +2, reason: 'Criminal disruption' },
  ],

  // Gang bust operations
  'gang_bust': [
    { faction: 'police', successMod: +15, failureMod: -5, reason: 'Gang enforcement' },
    { faction: 'media', successMod: +10, failureMod: -10, reason: 'Anti-gang operation' },
    { faction: 'underworld', successMod: -20, failureMod: +10, reason: 'Organization attacked' },
    { faction: 'government', successMod: +5, failureMod: -3, reason: 'Law and order' },
  ],

  // Hostage rescue
  'rescue_hostage': [
    { faction: 'police', successMod: +12, failureMod: -8, reason: 'Hostage situation' },
    { faction: 'media', successMod: +20, failureMod: -15, reason: 'Rescue operation' },
    { faction: 'government', successMod: +10, failureMod: -5, reason: 'Civilian protection' },
  ],

  // Infiltration/stealth missions
  'infiltrate': [
    { faction: 'underworld', successMod: -10, failureMod: +5, reason: 'Infiltration detected' },
    { faction: 'corporations', successMod: -8, failureMod: +3, reason: 'Corporate security breach' },
    { faction: 'police', successMod: +5, failureMod: -5, reason: 'Covert operation' },
  ],

  // Defense missions
  'defense': [
    { faction: 'police', successMod: +10, failureMod: -5, reason: 'Territory defense' },
    { faction: 'military', successMod: +8, failureMod: -3, reason: 'Defense operation' },
    { faction: 'government', successMod: +5, failureMod: -5, reason: 'Security maintained' },
  ],

  // Patrol encounters
  'patrol': [
    { faction: 'police', successMod: +5, failureMod: -2, reason: 'Patrol activity' },
    { faction: 'media', successMod: +3, failureMod: -5, reason: 'Street presence' },
  ],

  // Investigation-related combat
  'investigation': [
    { faction: 'police', successMod: +8, failureMod: -3, reason: 'Investigation support' },
    { faction: 'media', successMod: +5, failureMod: -8, reason: 'Investigation coverage' },
  ],

  // Counter-terrorism
  'counter_terror': [
    { faction: 'military', successMod: +20, failureMod: -10, reason: 'Counter-terrorism' },
    { faction: 'government', successMod: +15, failureMod: -10, reason: 'National security' },
    { faction: 'police', successMod: +10, failureMod: -5, reason: 'Terror prevention' },
    { faction: 'media', successMod: +15, failureMod: -20, reason: 'Terror response' },
  ],

  // Corporate security/extraction
  'corporate': [
    { faction: 'corporations', successMod: +15, failureMod: -10, reason: 'Corporate operation' },
    { faction: 'police', successMod: -5, failureMod: +3, reason: 'Private operation' },
    { faction: 'underworld', successMod: -5, failureMod: +5, reason: 'Corporate interference' },
  ],

  // Black ops / covert government work
  'black_ops': [
    { faction: 'government', successMod: +10, failureMod: -15, reason: 'Classified operation' },
    { faction: 'military', successMod: +5, failureMod: -5, reason: 'Special operation' },
    { faction: 'media', successMod: 0, failureMod: -10, reason: 'Covert activity exposed' },
  ],

  // Underworld jobs (gray area)
  'underworld_job': [
    { faction: 'underworld', successMod: +15, failureMod: -10, reason: 'Job completed' },
    { faction: 'police', successMod: -10, failureMod: +5, reason: 'Criminal association' },
    { faction: 'government', successMod: -5, failureMod: +3, reason: 'Illegal activity' },
  ],

  // Vigilante justice (unauthorized)
  'vigilante': [
    { faction: 'police', successMod: -3, failureMod: -8, reason: 'Unauthorized action' },
    { faction: 'media', successMod: +10, failureMod: -5, reason: 'Vigilante activity' },
    { faction: 'government', successMod: -5, failureMod: -5, reason: 'Outside the law' },
  ],

  // Default for unknown mission types
  'default': [
    { faction: 'police', successMod: +3, failureMod: -2, reason: 'Field operation' },
    { faction: 'media', successMod: +2, failureMod: -3, reason: 'News coverage' },
  ],
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get faction effects for a mission type
 * Falls back to 'default' if mission type not found
 */
export function getMissionFactionEffects(missionType: string): FactionEffect[] {
  // Normalize mission type (lowercase, handle variations)
  const normalizedType = missionType.toLowerCase().replace(/[_\-\s]/g, '_');

  // Direct match
  if (MISSION_FACTION_EFFECTS[normalizedType]) {
    return MISSION_FACTION_EFFECTS[normalizedType];
  }

  // Partial match (e.g., 'combat_mission' matches 'combat')
  for (const key of Object.keys(MISSION_FACTION_EFFECTS)) {
    if (normalizedType.includes(key) || key.includes(normalizedType)) {
      return MISSION_FACTION_EFFECTS[key];
    }
  }

  // Default fallback
  return MISSION_FACTION_EFFECTS['default'];
}

/**
 * Calculate total faction changes for a mission outcome
 */
export function calculateMissionFactionChanges(
  missionType: string,
  success: boolean,
  multiplier: number = 1.0
): Array<{ faction: FactionType; change: number; reason: string }> {
  const effects = getMissionFactionEffects(missionType);

  return effects.map(effect => ({
    faction: effect.faction,
    change: Math.round((success ? effect.successMod : effect.failureMod) * multiplier),
    reason: `${effect.reason} - ${success ? 'Success' : 'Failure'}`,
  }));
}
