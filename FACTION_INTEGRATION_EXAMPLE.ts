/**
 * Faction System Integration Examples
 *
 * Code examples showing how to integrate the faction system with existing
 * SuperHero Tactics systems (missions, combat, world map, etc.)
 *
 * These are EXAMPLES - not production code. Use as reference for implementation.
 */

import {
  FactionStanding,
  FactionType,
  Bounty,
  CountryReputation,
  modifyStanding,
  checkBountyStatus,
  getCountryReputation,
  getRelatedFactionEffects,
  initializeFactionStandings,
} from './MVP/src/data/factionSystem';

import { ALL_COUNTRIES } from './MVP/src/data/countries';
import { MissionTemplate, GeneratedMission } from './MVP/src/data/missionSystem';

// =============================================================================
// EXAMPLE 1: Initialize Faction System on Game Start
// =============================================================================

function exampleInitializeFactions(homeCountryCode: string = 'US') {
  console.log('Initializing faction system...');

  // Create all 1008 faction standings (168 countries × 6 factions)
  const standings = initializeFactionStandings(ALL_COUNTRIES, homeCountryCode);

  console.log(`Created ${standings.length} faction standings`);
  console.log('Sample standing:', standings.find(s => s.factionId === 'police_us'));

  return standings;
}

// =============================================================================
// EXAMPLE 2: Modify Standing After Mission Completion
// =============================================================================

interface MissionResult {
  success: boolean;
  missionTemplate: MissionTemplate;
  countryCode: string;
  timestamp: number;
  characterId: string;
}

function exampleModifyStandingAfterMission(
  standings: FactionStanding[],
  result: MissionResult
): FactionStanding[] {
  const updatedStandings = [...standings];

  // Example: Police gang takedown mission
  if (result.success && result.missionTemplate.id === 'skirmish_gang') {
    // Find relevant factions in that country
    const policeFaction = standings.find(
      s => s.factionType === 'police' && s.countryCode === result.countryCode
    );
    const underworldFaction = standings.find(
      s => s.factionType === 'underworld' && s.countryCode === result.countryCode
    );
    const governmentFaction = standings.find(
      s => s.factionType === 'government' && s.countryCode === result.countryCode
    );

    if (policeFaction) {
      // Police like you for taking down gangs
      const updated = modifyStanding(
        policeFaction,
        15,
        `Completed mission: ${result.missionTemplate.name}`,
        result.timestamp,
        result.missionTemplate.id
      );
      const index = updatedStandings.findIndex(s => s.factionId === policeFaction.factionId);
      updatedStandings[index] = updated;

      // Check related faction effects (government is allied with police)
      const relatedEffects = getRelatedFactionEffects('police', 15);
      for (const effect of relatedEffects) {
        const faction = updatedStandings.find(
          s => s.factionType === effect.factionType && s.countryCode === result.countryCode
        );
        if (faction) {
          const updated = modifyStanding(
            faction,
            effect.change,
            `Allied faction (police) gained standing`,
            result.timestamp
          );
          const idx = updatedStandings.findIndex(s => s.factionId === faction.factionId);
          updatedStandings[idx] = updated;
        }
      }
    }

    if (underworldFaction) {
      // Underworld hates you for attacking them
      const updated = modifyStanding(
        underworldFaction,
        -20,
        `Attacked underworld in mission: ${result.missionTemplate.name}`,
        result.timestamp,
        result.missionTemplate.id
      );
      const index = updatedStandings.findIndex(s => s.factionId === underworldFaction.factionId);
      updatedStandings[index] = updated;

      // Check if bounty should be issued
      const bounty = checkBountyStatus(updated, result.timestamp);
      if (bounty) {
        updated.activeBounty = bounty;
        console.log(`⚠️ BOUNTY ISSUED: ${bounty.level} bounty from ${underworldFaction.factionType}`);
      }
    }
  }

  return updatedStandings;
}

// =============================================================================
// EXAMPLE 3: Filter Missions by Standing
// =============================================================================

function exampleFilterMissionsByStanding(
  allMissions: MissionTemplate[],
  standings: FactionStanding[],
  currentCountryCode: string
): MissionTemplate[] {
  return allMissions.filter((mission) => {
    // Find faction standing for this mission source
    const factionStanding = standings.find(
      s => s.factionType === mission.source && s.countryCode === currentCountryCode
    );

    if (!factionStanding) return false;

    // Example minimum standings per mission difficulty
    const minStandingRequired: Record<number, number> = {
      1: 0,   // Easy missions available to anyone
      2: 0,
      3: 25,  // Medium missions need neutral+
      4: 50,  // Hard missions need respected
      5: 75,  // Extreme missions need hero
    };

    const required = minStandingRequired[mission.baseDifficulty] ?? 0;
    return factionStanding.standing >= required;
  });
}

// =============================================================================
// EXAMPLE 4: Calculate Equipment Price with Standing Modifier
// =============================================================================

import { getPriceModifier, getEquipmentTier } from './MVP/src/data/factionSystem';

interface Equipment {
  id: string;
  name: string;
  basePrice: number;
  tier: 'basic' | 'advanced' | 'military' | 'classified';
  vendorFaction: FactionType;
}

function exampleCalculateEquipmentPrice(
  equipment: Equipment,
  standings: FactionStanding[],
  countryCode: string
): { price: number; available: boolean; reason?: string } {
  const factionStanding = standings.find(
    s => s.factionType === equipment.vendorFaction && s.countryCode === countryCode
  );

  if (!factionStanding) {
    return { price: 0, available: false, reason: 'Faction not found' };
  }

  // Check tier access
  const unlockedTier = getEquipmentTier(factionStanding.standing);
  const tierOrder = ['basic', 'advanced', 'military', 'classified'];

  if (tierOrder.indexOf(equipment.tier) > tierOrder.indexOf(unlockedTier)) {
    return {
      price: 0,
      available: false,
      reason: `Requires ${equipment.tier} tier access (need standing ${
        equipment.tier === 'classified' ? '75+' :
        equipment.tier === 'military' ? '50+' :
        equipment.tier === 'advanced' ? '25+' : '0+'
      })`
    };
  }

  // Calculate price with modifier
  const priceMultiplier = getPriceModifier(factionStanding.standing);
  const finalPrice = Math.round(equipment.basePrice * priceMultiplier);

  return { price: finalPrice, available: true };
}

// =============================================================================
// EXAMPLE 5: Check Travel Restrictions
// =============================================================================

import { getTravelTimeModifier, canEnterLegally } from './MVP/src/data/factionSystem';

function exampleCheckTravelToCountry(
  standings: FactionStanding[],
  destinationCountryCode: string,
  destinationCountryName: string
): {
  canEnter: boolean;
  travelTimeMultiplier: number;
  needsSmuggling: boolean;
  smugglingCost?: number;
} {
  const countryRep = getCountryReputation(
    destinationCountryCode,
    destinationCountryName,
    standings
  );

  const canEnter = countryRep.canEnterLegally;
  const travelMod = countryRep.borderControlModifier;

  if (!canEnter) {
    // Must smuggle in (requires underworld standing 25+)
    const underworldStanding = standings.find(
      s => s.factionType === 'underworld' && s.countryCode === destinationCountryCode
    );

    const canSmuggle = (underworldStanding?.standing ?? 0) >= 25;

    return {
      canEnter: false,
      travelTimeMultiplier: Infinity,
      needsSmuggling: true,
      smugglingCost: canSmuggle ? 25000 : undefined, // $25k if underworld allows it
    };
  }

  return {
    canEnter: true,
    travelTimeMultiplier: travelMod,
    needsSmuggling: false,
  };
}

// =============================================================================
// EXAMPLE 6: Daily Bounty Hunter Check
// =============================================================================

function exampleDailyBountyCheck(
  standings: FactionStanding[],
  currentCountryCode: string,
  currentDay: number
): Bounty[] {
  const triggeredBounties: Bounty[] = [];

  // Get all active bounties in current country
  const activeBounties = standings
    .filter(s => s.countryCode === currentCountryCode && s.activeBounty?.status === 'active')
    .map(s => s.activeBounty!)
    .filter(Boolean);

  for (const bounty of activeBounties) {
    // Check encounter chance
    const encounterChance = bounty.level === 'extreme' ? 0.50 :
                           bounty.level === 'major' ? 0.25 :
                           0.10;

    if (Math.random() < encounterChance) {
      console.log(`⚠️ BOUNTY HUNTER ENCOUNTER: ${bounty.level} (${bounty.amount})`);
      triggeredBounties.push(bounty);
    }
  }

  // Extreme bounties can trigger even outside the country (10% chance)
  const extremeBountiesElsewhere = standings
    .filter(s => s.countryCode !== currentCountryCode && s.activeBounty?.level === 'extreme')
    .map(s => s.activeBounty!)
    .filter(Boolean);

  for (const bounty of extremeBountiesElsewhere) {
    if (Math.random() < 0.10) {
      console.log(`⚠️ EXTREME BOUNTY HUNTERS TRACKED YOU DOWN: ${bounty.amount}`);
      triggeredBounties.push(bounty);
    }
  }

  return triggeredBounties;
}

// =============================================================================
// EXAMPLE 7: Generate Bounty Hunter Enemy Squad
// =============================================================================

interface CombatEnemy {
  id: string;
  name: string;
  threatLevel: number;
  weapon: string;
  armor: string;
  morale: number;
}

function exampleGenerateBountyHunters(bounty: Bounty): CombatEnemy[] {
  const hunters: CombatEnemy[] = [];
  const count = Math.floor(
    Math.random() * (bounty.hunterCount.max - bounty.hunterCount.min + 1)
  ) + bounty.hunterCount.min;

  for (let i = 0; i < count; i++) {
    let weapon = 'Pistol';
    let armor = 'None';
    let morale = 50;

    if (bounty.level === 'extreme') {
      weapon = ['Sniper Rifle', 'RPG', 'Machine Gun'][Math.floor(Math.random() * 3)];
      armor = 'Heavy Armor (DR 25)';
      morale = 90;
    } else if (bounty.level === 'major') {
      weapon = ['Assault Rifle', 'Shotgun', 'Grenade'][Math.floor(Math.random() * 3)];
      armor = 'Tactical Armor (DR 15)';
      morale = 70;
    } else {
      weapon = ['Pistol', 'Shotgun'][Math.floor(Math.random() * 2)];
      armor = 'None';
      morale = 50;
    }

    hunters.push({
      id: `bounty_hunter_${bounty.id}_${i}`,
      name: `${bounty.level.toUpperCase()} Bounty Hunter #${i + 1}`,
      threatLevel: bounty.hunterThreatLevel,
      weapon,
      armor,
      morale,
    });
  }

  return hunters;
}

// =============================================================================
// EXAMPLE 8: Reputation Decay (Called Monthly)
// =============================================================================

import { getStandingDecay } from './MVP/src/data/factionSystem';

function exampleMonthlyReputationDecay(
  standings: FactionStanding[],
  timestamp: number
): FactionStanding[] {
  return standings.map((standing) => {
    const decay = getStandingDecay(standing.standing, 30); // 30 days

    if (decay !== 0) {
      return modifyStanding(
        standing,
        decay,
        'Monthly reputation decay',
        timestamp
      );
    }

    return standing;
  });
}

// =============================================================================
// EXAMPLE 9: UI Display - Faction Screen
// =============================================================================

function exampleRenderFactionScreen(
  standings: FactionStanding[],
  selectedCountryCode: string
): void {
  const countryStandings = standings.filter(s => s.countryCode === selectedCountryCode);

  console.log('\n=== FACTION STANDING REPORT ===\n');

  for (const standing of countryStandings) {
    const icon = standing.factionType === 'police' ? '👮' :
                 standing.factionType === 'military' ? '⚔️' :
                 standing.factionType === 'government' ? '🏛️' :
                 standing.factionType === 'media' ? '📰' :
                 standing.factionType === 'corporations' ? '🏢' : '🎭';

    console.log(`${icon} ${standing.factionType.toUpperCase().padEnd(15)} ${standing.standing.toString().padStart(4)} (${standing.standingLabel})`);

    if (standing.activeBounty) {
      console.log(`   ⚠️ ACTIVE BOUNTY: $${standing.activeBounty.amount.toLocaleString()} (${standing.activeBounty.level})`);
    }
  }

  console.log('\n===============================\n');
}

// =============================================================================
// EXAMPLE 10: Integration with Game Store
// =============================================================================

// Add to enhancedGameStore.ts:
/*
interface EnhancedGameStore {
  // ... existing fields ...

  // NEW: Faction system
  factionStandings: FactionStanding[];
  activeBounties: Bounty[];

  // Actions
  initializeFactions: (homeCountryCode: string) => void;
  modifyFactionStanding: (factionId: string, change: number, reason: string) => void;
  getFactionStanding: (factionType: FactionType, countryCode: string) => FactionStanding | undefined;
  getCountryReputation: (countryCode: string) => CountryReputation;
  checkDailyBounties: () => void;
  processMonthlyDecay: () => void;
}

export const useGameStore = create<EnhancedGameStore>((set, get) => ({
  // ... existing state ...

  factionStandings: [],
  activeBounties: [],

  initializeFactions: (homeCountryCode: string) => {
    const standings = initializeFactionStandings(ALL_COUNTRIES, homeCountryCode);
    set({ factionStandings: standings });
  },

  modifyFactionStanding: (factionId: string, change: number, reason: string) => {
    const { factionStandings, day } = get();
    const index = factionStandings.findIndex(s => s.factionId === factionId);

    if (index === -1) return;

    const updated = modifyStanding(
      factionStandings[index],
      change,
      reason,
      day * 1440 // Convert day to minutes
    );

    // Check bounty
    const bounty = checkBountyStatus(updated, day * 1440);
    if (bounty) {
      updated.activeBounty = bounty;
    }

    // Apply related faction effects
    const relatedEffects = getRelatedFactionEffects(updated.factionType, change);
    const newStandings = [...factionStandings];
    newStandings[index] = updated;

    for (const effect of relatedEffects) {
      const relatedIndex = newStandings.findIndex(
        s => s.factionType === effect.factionType && s.countryCode === updated.countryCode
      );
      if (relatedIndex !== -1) {
        newStandings[relatedIndex] = modifyStanding(
          newStandings[relatedIndex],
          effect.change,
          `Related to ${updated.factionType} change`,
          day * 1440
        );
      }
    }

    set({ factionStandings: newStandings });
  },

  getFactionStanding: (factionType: FactionType, countryCode: string) => {
    return get().factionStandings.find(
      s => s.factionType === factionType && s.countryCode === countryCode
    );
  },

  getCountryReputation: (countryCode: string) => {
    const { factionStandings } = get();
    const country = ALL_COUNTRIES.find(c => c.code === countryCode);
    if (!country) throw new Error(`Country ${countryCode} not found`);

    return getCountryReputation(countryCode, country.name, factionStandings);
  },

  checkDailyBounties: () => {
    const { factionStandings, currentSector, day } = get();
    // Get current country from sector (would need sector -> country mapping)
    const currentCountryCode = 'US'; // Example

    const triggeredBounties = exampleDailyBountyCheck(factionStandings, currentCountryCode, day);

    if (triggeredBounties.length > 0) {
      // Trigger bounty hunter encounter
      // Could emit event to CombatScene or create mission
      console.log(`${triggeredBounties.length} bounty hunter squad(s) incoming!`);
    }
  },

  processMonthlyDecay: () => {
    const { factionStandings, day } = get();
    const updated = exampleMonthlyReputationDecay(factionStandings, day * 1440);
    set({ factionStandings: updated });
  },
}));
*/

// =============================================================================
// EXAMPLE 11: Mission Generation with Faction Requirements
// =============================================================================

import { generateMission } from './MVP/src/data/missionSystem';

function exampleGenerateFactionMission(
  template: MissionTemplate,
  sector: string,
  city: string,
  factionStanding: FactionStanding
): GeneratedMission | null {
  // Check minimum standing
  const minStandingRequired = template.baseDifficulty >= 5 ? 75 :
                              template.baseDifficulty >= 4 ? 50 :
                              template.baseDifficulty >= 3 ? 25 : 0;

  if (factionStanding.standing < minStandingRequired) {
    return null; // Not available
  }

  // Generate mission with standing-based difficulty modifier
  const difficultyMod = factionStanding.standing >= 75 ? 1 :  // Hero gets harder missions
                       factionStanding.standing <= -50 ? -1 : // Criminal gets easier (cleanup) missions
                       0;

  return generateMission(template, sector, city, difficultyMod);
}

// =============================================================================
// EXAMPLE 12: Safe House Access Check
// =============================================================================

import { hasSafeHouseAccess } from './MVP/src/data/factionSystem';

function exampleCheckSafeHouseAccess(
  standings: FactionStanding[],
  cityId: string,
  countryCode: string
): Array<{ factionType: FactionType; available: boolean }> {
  return standings
    .filter(s => s.countryCode === countryCode)
    .map(s => ({
      factionType: s.factionType,
      available: hasSafeHouseAccess(s.factionType, s.standing),
    }));
}

// =============================================================================
// EXPORTS FOR TESTING
// =============================================================================

export {
  exampleInitializeFactions,
  exampleModifyStandingAfterMission,
  exampleFilterMissionsByStanding,
  exampleCalculateEquipmentPrice,
  exampleCheckTravelToCountry,
  exampleDailyBountyCheck,
  exampleGenerateBountyHunters,
  exampleMonthlyReputationDecay,
  exampleRenderFactionScreen,
  exampleGenerateFactionMission,
  exampleCheckSafeHouseAccess,
};
