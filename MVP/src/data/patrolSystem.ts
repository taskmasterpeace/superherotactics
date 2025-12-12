/**
 * Patrol System
 *
 * Handles patrol activities:
 * - Fame gain (public recognition)
 * - City familiarity increase (better navigation, contacts)
 * - Investigation discovery (random encounters, intel)
 * - Random events
 */

import { GameCharacter, CityFamiliarity } from '../types';

// =============================================================================
// PATROL INTERFACES
// =============================================================================

export interface PatrolResult {
  characterId: string;
  characterName: string;
  cityId: string;
  cityName: string;
  durationHours: number;

  // Gains
  fameGained: number;
  familiarityGained: number;
  newFamiliarityLevel: number;

  // Discoveries
  investigationDiscovered?: DiscoveredInvestigation;
  randomEncounter?: PatrolEncounter;
  intelGathered?: string[];

  // Summary
  eventLog: string[];
  newsworthy: boolean;  // If something big happened
  newsHeadline?: string;
}

export interface DiscoveredInvestigation {
  id: string;
  title: string;
  type: 'crime' | 'conspiracy' | 'terrorism' | 'underworld';
  difficulty: number;  // 1-5
  danger: number;      // 1-10
  briefDescription: string;
  discoveredAt: string;  // City
  expiresIn?: number;    // Game hours before opportunity disappears
}

export interface PatrolEncounter {
  type: 'crime_in_progress' | 'informant' | 'ambush' | 'citizen_help' | 'media_attention' | 'hero_sighting';
  title: string;
  description: string;
  outcome: 'positive' | 'negative' | 'neutral';
  fameModifier: number;
  combatTriggered?: boolean;
}

// =============================================================================
// PATROL CONFIGURATION
// =============================================================================

export const PATROL_CONFIG = {
  // Fame gain per hour of patrol
  baseFamePerHour: 5,

  // Familiarity gain per hour
  baseFamiliarityPerHour: 2,

  // Maximum familiarity from patrol (can't exceed this)
  maxFamiliarityFromPatrol: 75,

  // Chance to discover investigation per hour
  investigationDiscoveryChance: 0.05,  // 5% per hour

  // Chance for random encounter per hour
  encounterChance: 0.10,  // 10% per hour

  // Fame modifiers by character threat level
  threatLevelFameMultiplier: {
    THREAT_1: 0.5,
    THREAT_2: 1.0,
    THREAT_3: 1.5,
    THREAT_4: 2.0,
    THREAT_5: 3.0,
    THREAT_6: 5.0,
    THREAT_7: 8.0,
    THREAT_8: 12.0,
    THREAT_9: 20.0,
  } as Record<string, number>,

  // Familiarity bonuses for existing knowledge
  familiarityBonusThresholds: {
    25: 0.1,   // 10% faster learning above 25%
    50: 0.2,   // 20% faster above 50%
    75: 0.3,   // 30% faster above 75%
  } as Record<number, number>,
};

// =============================================================================
// INVESTIGATION TEMPLATES
// =============================================================================

const INVESTIGATION_TEMPLATES: Omit<DiscoveredInvestigation, 'id' | 'discoveredAt'>[] = [
  // Crime
  { title: 'Drug Distribution Ring', type: 'crime', difficulty: 2, danger: 5, briefDescription: 'Local dealers running operations in the industrial district.' },
  { title: 'Robbery Crew', type: 'crime', difficulty: 2, danger: 4, briefDescription: 'A crew hitting banks and armored cars.' },
  { title: 'Human Trafficking Operation', type: 'crime', difficulty: 4, danger: 7, briefDescription: 'Suspected trafficking through the port.' },
  { title: 'Arms Dealing Network', type: 'crime', difficulty: 3, danger: 6, briefDescription: 'Illegal weapons flooding the streets.' },
  { title: 'Organized Crime Meeting', type: 'crime', difficulty: 3, danger: 5, briefDescription: 'Major players meeting to divide territory.' },

  // Conspiracy
  { title: 'Corporate Cover-up', type: 'conspiracy', difficulty: 4, danger: 4, briefDescription: 'Something is being hidden at the tech company.' },
  { title: 'Political Corruption', type: 'conspiracy', difficulty: 5, danger: 6, briefDescription: 'City officials taking bribes from unknown parties.' },
  { title: 'Missing Persons Pattern', type: 'conspiracy', difficulty: 3, danger: 5, briefDescription: 'Too many disappearances to be coincidence.' },
  { title: 'Secret Laboratory', type: 'conspiracy', difficulty: 4, danger: 7, briefDescription: 'Unauthorized experiments being conducted somewhere.' },

  // Terrorism
  { title: 'Bomb Threat Intel', type: 'terrorism', difficulty: 4, danger: 9, briefDescription: 'Chatter about an upcoming attack.' },
  { title: 'Recruitment Cell', type: 'terrorism', difficulty: 3, danger: 6, briefDescription: 'Extremists recruiting in the community.' },
  { title: 'Infrastructure Target', type: 'terrorism', difficulty: 5, danger: 10, briefDescription: 'Plans to attack critical infrastructure.' },

  // Underworld
  { title: 'Gang War Brewing', type: 'underworld', difficulty: 2, danger: 6, briefDescription: 'Tensions rising between rival gangs.' },
  { title: 'New Crime Boss', type: 'underworld', difficulty: 3, danger: 5, briefDescription: 'Someone new is consolidating power.' },
  { title: 'Underground Fight Ring', type: 'underworld', difficulty: 2, danger: 4, briefDescription: 'Illegal fights with big money changing hands.' },
  { title: 'Protection Racket', type: 'underworld', difficulty: 2, danger: 4, briefDescription: 'Businesses being extorted in the area.' },
];

// =============================================================================
// PATROL ENCOUNTERS
// =============================================================================

const PATROL_ENCOUNTERS: PatrolEncounter[] = [
  // Positive
  { type: 'crime_in_progress', title: 'Stopped a Mugging', description: 'Intervened in a street crime.', outcome: 'positive', fameModifier: 10 },
  { type: 'citizen_help', title: 'Helped Lost Tourist', description: 'Assisted a visitor find their way.', outcome: 'positive', fameModifier: 2 },
  { type: 'informant', title: 'Gained an Informant', description: 'A local offered to share information.', outcome: 'positive', fameModifier: 5 },
  { type: 'media_attention', title: 'Positive Media Coverage', description: 'Local news covered your patrol.', outcome: 'positive', fameModifier: 25 },
  { type: 'crime_in_progress', title: 'Prevented Robbery', description: 'Stopped a store robbery in progress.', outcome: 'positive', fameModifier: 15 },
  { type: 'hero_sighting', title: 'Inspired a Child', description: 'A young fan asked for an autograph.', outcome: 'positive', fameModifier: 5 },

  // Negative
  { type: 'ambush', title: 'Ambush!', description: 'Criminals set a trap.', outcome: 'negative', fameModifier: -5, combatTriggered: true },
  { type: 'media_attention', title: 'Negative Press', description: 'Someone filmed an awkward moment.', outcome: 'negative', fameModifier: -10 },
  { type: 'ambush', title: 'Gang Confrontation', description: 'Gang members got hostile.', outcome: 'negative', fameModifier: 0, combatTriggered: true },

  // Neutral
  { type: 'citizen_help', title: 'Directions Asked', description: 'Tourists kept asking for directions.', outcome: 'neutral', fameModifier: 1 },
  { type: 'hero_sighting', title: 'Another Hero Spotted', description: 'Saw another vigilante in the area.', outcome: 'neutral', fameModifier: 0 },
];

// =============================================================================
// PATROL FUNCTIONS
// =============================================================================

/**
 * Simulate a patrol activity
 */
export function simulatePatrol(
  character: GameCharacter,
  cityId: string,
  cityName: string,
  durationHours: number = 8
): PatrolResult {
  const eventLog: string[] = [];
  let totalFameGained = 0;
  let totalFamiliarityGained = 0;

  // Get current familiarity
  const currentFamiliarity = character.cityFamiliarities?.find(f => f.cityId === cityId);
  let familiarityLevel = currentFamiliarity?.familiarity || 0;

  // Get threat level multiplier
  const threatMultiplier = PATROL_CONFIG.threatLevelFameMultiplier[character.threatLevel] || 1.0;

  // Simulate each hour
  let investigationDiscovered: DiscoveredInvestigation | undefined;
  let randomEncounter: PatrolEncounter | undefined;
  const intelGathered: string[] = [];

  for (let hour = 0; hour < durationHours; hour++) {
    // Base gains per hour
    const hourlyFame = Math.round(PATROL_CONFIG.baseFamePerHour * threatMultiplier);
    const hourlyFamiliarity = PATROL_CONFIG.baseFamiliarityPerHour;

    totalFameGained += hourlyFame;

    // Only gain familiarity if below max
    if (familiarityLevel < PATROL_CONFIG.maxFamiliarityFromPatrol) {
      const newFamiliarity = Math.min(
        PATROL_CONFIG.maxFamiliarityFromPatrol,
        familiarityLevel + hourlyFamiliarity
      );
      totalFamiliarityGained += (newFamiliarity - familiarityLevel);
      familiarityLevel = newFamiliarity;
    }

    // Check for investigation discovery
    if (!investigationDiscovered && Math.random() < PATROL_CONFIG.investigationDiscoveryChance) {
      const template = INVESTIGATION_TEMPLATES[Math.floor(Math.random() * INVESTIGATION_TEMPLATES.length)];
      investigationDiscovered = {
        ...template,
        id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        discoveredAt: cityName,
        expiresIn: 48 + Math.floor(Math.random() * 72),  // 48-120 hours
      };
      eventLog.push(`Discovered: ${investigationDiscovered.title}`);
      intelGathered.push(`Learned about ${investigationDiscovered.type} activity in the area`);
    }

    // Check for random encounter
    if (!randomEncounter && Math.random() < PATROL_CONFIG.encounterChance) {
      randomEncounter = PATROL_ENCOUNTERS[Math.floor(Math.random() * PATROL_ENCOUNTERS.length)];
      totalFameGained += randomEncounter.fameModifier;
      eventLog.push(`Encounter: ${randomEncounter.title}`);

      if (randomEncounter.outcome === 'positive') {
        intelGathered.push('Made a positive impression on locals');
      }
    }

    // Random intel gathering (based on familiarity)
    if (Math.random() < (familiarityLevel / 200)) {  // Higher familiarity = more intel
      const intelBits = [
        'Overheard rumors about gang activity',
        'Noticed suspicious vehicle patterns',
        'Identified a potential safehouse',
        'Learned about a local informant',
        'Spotted known criminal associates',
      ];
      const intel = intelBits[Math.floor(Math.random() * intelBits.length)];
      if (!intelGathered.includes(intel)) {
        intelGathered.push(intel);
      }
    }
  }

  // Determine if newsworthy
  const newsworthy = totalFameGained >= 50 ||
    (randomEncounter?.outcome === 'positive' && randomEncounter.fameModifier >= 15) ||
    investigationDiscovered?.danger >= 7;

  let newsHeadline: string | undefined;
  if (newsworthy) {
    if (investigationDiscovered?.danger >= 7) {
      newsHeadline = `${character.name} Uncovers Major ${investigationDiscovered.type.toUpperCase()} Operation`;
    } else if (randomEncounter?.fameModifier >= 15) {
      newsHeadline = `${character.name} Saves the Day in ${cityName}`;
    } else {
      newsHeadline = `${character.name} Continues Patrol in ${cityName}`;
    }
  }

  eventLog.push(`Patrol complete: +${totalFameGained} fame, +${totalFamiliarityGained.toFixed(1)}% familiarity`);

  return {
    characterId: character.id,
    characterName: character.name,
    cityId,
    cityName,
    durationHours,
    fameGained: totalFameGained,
    familiarityGained: totalFamiliarityGained,
    newFamiliarityLevel: familiarityLevel,
    investigationDiscovered,
    randomEncounter,
    intelGathered,
    eventLog,
    newsworthy,
    newsHeadline,
  };
}

/**
 * Apply patrol results to a character
 */
export function applyPatrolResults(
  character: GameCharacter,
  result: PatrolResult
): GameCharacter {
  // Update fame
  const newFame = (character.fame || 0) + result.fameGained;

  // Update city familiarity
  const existingFamiliarity = character.cityFamiliarities || [];
  const cityIndex = existingFamiliarity.findIndex(f => f.cityId === result.cityId);

  let newFamiliarities: CityFamiliarity[];
  if (cityIndex >= 0) {
    newFamiliarities = existingFamiliarity.map((f, i) =>
      i === cityIndex
        ? { ...f, familiarity: result.newFamiliarityLevel, lastVisited: Date.now() }
        : f
    );
  } else {
    newFamiliarities = [
      ...existingFamiliarity,
      {
        cityId: result.cityId,
        cityName: result.cityName,
        familiarity: result.newFamiliarityLevel,
        lastVisited: Date.now(),
      },
    ];
  }

  return {
    ...character,
    fame: newFame,
    cityFamiliarities: newFamiliarities,
  };
}

/**
 * Get patrol effectiveness description
 */
export function getPatrolEffectivenessDescription(familiarity: number): string {
  if (familiarity >= 80) return 'Highly effective - knows every corner';
  if (familiarity >= 60) return 'Effective - good local knowledge';
  if (familiarity >= 40) return 'Moderate - learning the area';
  if (familiarity >= 20) return 'Limited - still getting oriented';
  return 'Minimal - unfamiliar territory';
}

export default {
  PATROL_CONFIG,
  simulatePatrol,
  applyPatrolResults,
  getPatrolEffectivenessDescription,
};
