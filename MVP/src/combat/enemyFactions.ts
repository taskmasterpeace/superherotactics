/**
 * Enemy Factions System
 *
 * Defines how different factions equip, behave, and fight.
 * Used by enemyGeneration.ts to create location-appropriate enemies.
 *
 * PHILOSOPHY: City type + Country stats = Faction selection
 * A Military city spawns military. A corrupt Industrial city spawns gangs.
 */

import { CostLevel } from '../data/equipmentTypes';

// ============================================================================
// FACTION TYPES
// ============================================================================

export type FactionId =
  | 'military'      // Professional soldiers
  | 'police'        // Law enforcement
  | 'gang'          // Street criminals
  | 'corporate'     // Private security
  | 'militia'       // Irregular fighters
  | 'cartel'        // Organized crime
  | 'terrorist'     // Non-state actors
  | 'mercenary';    // Professional contractors

export type TacticsLevel =
  | 'untrained'     // Random movement, poor aim
  | 'street'        // Basic cover use, aggressive
  | 'trained'       // Proper tactics, coordinated
  | 'professional'  // Flanking, overwatch, suppression
  | 'elite';        // Special forces tactics

// ============================================================================
// FACTION PROFILE
// ============================================================================

export interface FactionProfile {
  id: FactionId;
  name: string;
  description: string;

  // Weapon loadouts by role
  weaponPools: {
    leader: string[];      // Squad leader weapons
    heavy: string[];       // Heavy weapons specialist
    standard: string[];    // Regular troops
    specialist?: string[]; // Special role (sniper, medic, etc.)
  };

  // Equipment tier range (1-6 maps to cost levels)
  equipmentTierRange: [number, number];

  // Armor tier range
  armorTierRange: [number, number];

  // Tactical behavior
  tacticsLevel: TacticsLevel;

  // Combat behavior flags
  behavior: {
    usesGrenades: boolean;
    usesFlanking: boolean;
    usesOverwatch: boolean;
    retreatsWhenOutnumbered: boolean;
    executesWounded: boolean;  // War crime flag
    takesHostages: boolean;
  };

  // Name pools for procedural generation
  names: {
    leader: string[];
    standard: string[];
  };

  // Visual identifiers
  appearance: {
    uniformColor: string;
    hasHelmet: boolean;
    hasVest: boolean;
  };
}

// ============================================================================
// FACTION DEFINITIONS
// ============================================================================

export const FACTION_PROFILES: Record<FactionId, FactionProfile> = {
  military: {
    id: 'military',
    name: 'Military',
    description: 'Professional soldiers with military training and equipment',

    weaponPools: {
      leader: ['Assault_Rifle', 'Battle_Rifle', 'Pistol_Heavy'],
      heavy: ['Machine_Gun', 'Grenade_Launcher', 'Rocket_Launcher'],
      standard: ['Assault_Rifle', 'SMG', 'Shotgun_Pump'],
      specialist: ['Sniper_Rifle', 'Anti_Materiel_Rifle'],
    },

    equipmentTierRange: [4, 6], // High to Very_High
    armorTierRange: [3, 5],
    tacticsLevel: 'professional',

    behavior: {
      usesGrenades: true,
      usesFlanking: true,
      usesOverwatch: true,
      retreatsWhenOutnumbered: false,
      executesWounded: false,
      takesHostages: false,
    },

    names: {
      leader: ['Sergeant', 'Lieutenant', 'Captain', 'Major'],
      standard: ['Private', 'Corporal', 'Specialist', 'Soldier'],
    },

    appearance: {
      uniformColor: 'olive',
      hasHelmet: true,
      hasVest: true,
    },
  },

  police: {
    id: 'police',
    name: 'Police',
    description: 'Law enforcement officers with standard issue equipment',

    weaponPools: {
      leader: ['Pistol_Heavy', 'Shotgun_Pump', 'SMG'],
      heavy: ['Shotgun_Auto', 'SMG'],
      standard: ['Pistol_Standard', 'Taser', 'Shotgun_Pump'],
      specialist: ['Sniper_Rifle'],
    },

    equipmentTierRange: [2, 4], // Low to High
    armorTierRange: [2, 3],
    tacticsLevel: 'trained',

    behavior: {
      usesGrenades: false, // Use flashbangs, not frags
      usesFlanking: true,
      usesOverwatch: true,
      retreatsWhenOutnumbered: true,
      executesWounded: false,
      takesHostages: false,
    },

    names: {
      leader: ['Sergeant', 'Detective', 'Captain', 'Lieutenant'],
      standard: ['Officer', 'Patrol', 'Deputy', 'Constable'],
    },

    appearance: {
      uniformColor: 'blue',
      hasHelmet: false,
      hasVest: true,
    },
  },

  gang: {
    id: 'gang',
    name: 'Gang',
    description: 'Street criminals with improvised and black market weapons',

    weaponPools: {
      leader: ['Pistol_Heavy', 'SMG', 'Shotgun_Pump'],
      heavy: ['SMG', 'Shotgun_Auto'],
      standard: ['Pistol_Standard', 'Pistol_Light', 'Knife', 'Baseball_Bat'],
    },

    equipmentTierRange: [1, 3], // Free to Medium
    armorTierRange: [0, 2],
    tacticsLevel: 'street',

    behavior: {
      usesGrenades: false,
      usesFlanking: false,
      usesOverwatch: false,
      retreatsWhenOutnumbered: true,
      executesWounded: true,
      takesHostages: true,
    },

    names: {
      leader: ['Boss', 'OG', 'Captain', 'Chief'],
      standard: ['Thug', 'Soldier', 'Enforcer', 'Runner'],
    },

    appearance: {
      uniformColor: 'mixed',
      hasHelmet: false,
      hasVest: false,
    },
  },

  corporate: {
    id: 'corporate',
    name: 'Corporate Security',
    description: 'Private security with professional training and equipment',

    weaponPools: {
      leader: ['Pistol_Heavy', 'SMG'],
      heavy: ['SMG', 'Shotgun_Pump'],
      standard: ['Pistol_Standard', 'Taser', 'SMG'],
      specialist: ['Sniper_Rifle'],
    },

    equipmentTierRange: [3, 5], // Medium to Very_High
    armorTierRange: [2, 4],
    tacticsLevel: 'professional',

    behavior: {
      usesGrenades: false,
      usesFlanking: true,
      usesOverwatch: true,
      retreatsWhenOutnumbered: true,
      executesWounded: false,
      takesHostages: false,
    },

    names: {
      leader: ['Chief', 'Director', 'Commander'],
      standard: ['Guard', 'Security', 'Agent', 'Operative'],
    },

    appearance: {
      uniformColor: 'black',
      hasHelmet: false,
      hasVest: true,
    },
  },

  militia: {
    id: 'militia',
    name: 'Militia',
    description: 'Irregular fighters with varied equipment',

    weaponPools: {
      leader: ['Assault_Rifle', 'Battle_Rifle'],
      heavy: ['Machine_Gun', 'Rocket_Launcher'],
      standard: ['Assault_Rifle', 'Pistol_Heavy', 'Shotgun_Pump', 'Machete'],
    },

    equipmentTierRange: [2, 4], // Low to High (scavenged military gear)
    armorTierRange: [1, 3],
    tacticsLevel: 'trained',

    behavior: {
      usesGrenades: true,
      usesFlanking: true,
      usesOverwatch: false,
      retreatsWhenOutnumbered: true,
      executesWounded: true,
      takesHostages: true,
    },

    names: {
      leader: ['Commander', 'Warlord', 'General', 'Captain'],
      standard: ['Fighter', 'Soldier', 'Rebel', 'Warrior'],
    },

    appearance: {
      uniformColor: 'camo',
      hasHelmet: false,
      hasVest: false,
    },
  },

  cartel: {
    id: 'cartel',
    name: 'Cartel',
    description: 'Organized crime with military-grade weapons and training',

    weaponPools: {
      leader: ['Assault_Rifle', 'Pistol_Heavy', 'SMG'],
      heavy: ['Machine_Gun', 'Grenade_Launcher'],
      standard: ['Assault_Rifle', 'SMG', 'Pistol_Heavy'],
      specialist: ['Sniper_Rifle'],
    },

    equipmentTierRange: [3, 5], // Medium to Very_High
    armorTierRange: [2, 4],
    tacticsLevel: 'trained',

    behavior: {
      usesGrenades: true,
      usesFlanking: true,
      usesOverwatch: false,
      retreatsWhenOutnumbered: false,
      executesWounded: true,
      takesHostages: true,
    },

    names: {
      leader: ['Jefe', 'Don', 'Patron', 'Boss'],
      standard: ['Sicario', 'Soldado', 'Enforcer', 'Gunman'],
    },

    appearance: {
      uniformColor: 'tactical',
      hasHelmet: false,
      hasVest: true,
    },
  },

  terrorist: {
    id: 'terrorist',
    name: 'Terrorist',
    description: 'Non-state actors with ideological motivation',

    weaponPools: {
      leader: ['Assault_Rifle', 'Battle_Rifle'],
      heavy: ['Rocket_Launcher', 'Machine_Gun'],
      standard: ['Assault_Rifle', 'SMG', 'Pistol_Heavy'],
    },

    equipmentTierRange: [2, 5], // Mixed quality
    armorTierRange: [1, 3],
    tacticsLevel: 'trained',

    behavior: {
      usesGrenades: true,
      usesFlanking: false,
      usesOverwatch: false,
      retreatsWhenOutnumbered: false, // Fanatics don't retreat
      executesWounded: true,
      takesHostages: true,
    },

    names: {
      leader: ['Commander', 'Leader', 'Cell Chief'],
      standard: ['Fighter', 'Operative', 'Soldier', 'Zealot'],
    },

    appearance: {
      uniformColor: 'mixed',
      hasHelmet: false,
      hasVest: false,
    },
  },

  mercenary: {
    id: 'mercenary',
    name: 'Mercenary',
    description: 'Professional contractors with top-tier equipment',

    weaponPools: {
      leader: ['Assault_Rifle', 'Battle_Rifle', 'Pistol_Heavy'],
      heavy: ['Machine_Gun', 'Grenade_Launcher', 'Rocket_Launcher'],
      standard: ['Assault_Rifle', 'SMG', 'Shotgun_Pump'],
      specialist: ['Sniper_Rifle', 'Anti_Materiel_Rifle'],
    },

    equipmentTierRange: [4, 6], // High to Ultra_High
    armorTierRange: [3, 5],
    tacticsLevel: 'elite',

    behavior: {
      usesGrenades: true,
      usesFlanking: true,
      usesOverwatch: true,
      retreatsWhenOutnumbered: true, // Not dying for the paycheck
      executesWounded: false,
      takesHostages: false,
    },

    names: {
      leader: ['Commander', 'Team Lead', 'Contractor'],
      standard: ['Operator', 'Contractor', 'PMC', 'Merc'],
    },

    appearance: {
      uniformColor: 'tactical_black',
      hasHelmet: true,
      hasVest: true,
    },
  },
};

// ============================================================================
// CITY TYPE → FACTION MAPPING
// ============================================================================

/**
 * Determines primary faction based on city type and country stats.
 *
 * @param cityType - The city's primary type (Military, Political, etc.)
 * @param corruption - Country corruption level (0-100)
 * @param lawEnforcement - Country law enforcement level (0-100)
 * @param terrorismActivity - Country terrorism activity (number from string)
 */
export function determineFaction(
  cityType: string,
  corruption: number,
  lawEnforcement: number,
  terrorismActivity: number
): FactionId {
  // High terrorism activity anywhere can spawn terrorists
  if (terrorismActivity > 60 && Math.random() < 0.3) {
    return 'terrorist';
  }

  switch (cityType) {
    case 'Military':
      return 'military';

    case 'Political':
      // High corruption = cartel influence, otherwise police
      if (corruption > 70) return 'cartel';
      return 'police';

    case 'Industrial':
      // Corrupt industrial = gangs/cartels, otherwise corporate
      if (corruption > 60) {
        return corruption > 80 ? 'cartel' : 'gang';
      }
      return 'corporate';

    case 'Temple':
      // Low law enforcement = militia, otherwise police
      if (lawEnforcement < 40) return 'militia';
      return 'police';

    case 'Seaport':
      // Ports attract organized crime
      if (corruption > 50) return 'cartel';
      if (corruption > 30) return 'gang';
      return 'corporate';

    case 'Company':
      return 'corporate';

    case 'Educational':
      // Usually police, but corrupt = gang presence
      if (corruption > 60) return 'gang';
      return 'police';

    case 'Mining':
      // Mining towns: company security or local militia
      if (corruption > 60) return 'militia';
      return 'corporate';

    case 'Resort':
      // Resorts: private security or cartel
      if (corruption > 50) return 'cartel';
      return 'corporate';

    default:
      // Default based on corruption level
      if (corruption > 70) return 'cartel';
      if (corruption > 50) return 'gang';
      if (lawEnforcement > 60) return 'police';
      return 'gang';
  }
}

// ============================================================================
// COST LEVEL CONVERSION
// ============================================================================

export const TIER_TO_COST_LEVEL: Record<number, CostLevel> = {
  1: 'Free',
  2: 'Low',
  3: 'Medium',
  4: 'High',
  5: 'Very_High',
  6: 'Ultra_High',
};

export function tierToCostLevel(tier: number): CostLevel {
  const clampedTier = Math.max(1, Math.min(6, tier));
  return TIER_TO_COST_LEVEL[clampedTier];
}
