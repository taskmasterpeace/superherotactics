/**
 * Faction Hunt Missions (FM-006)
 *
 * When player reputation drops too low with a faction,
 * they send squads to hunt the player down.
 */

import {
  FactionType,
  FactionStanding,
  Bounty,
  BOUNTY_THRESHOLDS,
  BountyLevel,
  FACTION_NAMES,
  FACTION_ICONS,
} from './factionSystem';
import { getTimeEngine } from './timeEngine';
import { Country } from './countries';

// =============================================================================
// HUNT MISSION TYPES
// =============================================================================

export type HuntMissionType =
  | 'arrest_squad'     // Police/Government want you alive
  | 'kill_squad'       // Military/Underworld want you dead
  | 'bounty_hunters'   // Mercenaries after the bounty
  | 'hit_team'         // Professional assassins
  | 'ambush';          // Set up trap at known location

export interface HuntSquadMember {
  id: string;
  name: string;
  role: 'leader' | 'soldier' | 'specialist';
  threatLevel: number;     // 1-9
  weaponClass: string;
  skills: string[];
}

export interface HuntMission {
  id: string;
  factionType: FactionType;
  countryCode: string;
  countryName: string;

  // Mission details
  missionType: HuntMissionType;
  objective: 'capture' | 'eliminate';

  // Squad composition
  squad: HuntSquadMember[];
  squadSize: number;
  averageThreatLevel: number;

  // Timing
  issuedAt: number;           // Game timestamp
  activatesAt: number;        // When they start hunting
  expiresAt: number;          // When they give up

  // Status
  status: 'pending' | 'active' | 'encountered' | 'escaped' | 'defeated' | 'captured';
  encounterCount: number;     // How many times player has encountered this squad

  // Rewards for defeating
  rewardMoney: number;
  rewardIntel: string[];      // Information gained from defeated hunters

  // Context
  bountyId?: string;          // If triggered by bounty
}

// =============================================================================
// HUNT SQUAD GENERATION
// =============================================================================

const FACTION_SQUAD_CONFIGS: Record<FactionType, {
  missionTypes: HuntMissionType[];
  objective: 'capture' | 'eliminate';
  squadRoles: Array<{ role: HuntSquadMember['role']; chance: number }>;
  weaponClasses: string[];
  specialistSkills: string[];
}> = {
  police: {
    missionTypes: ['arrest_squad', 'ambush'],
    objective: 'capture',
    squadRoles: [
      { role: 'leader', chance: 0.15 },
      { role: 'specialist', chance: 0.25 },
      { role: 'soldier', chance: 0.60 },
    ],
    weaponClasses: ['pistol', 'smg', 'shotgun'],
    specialistSkills: ['negotiation', 'tactical_shield', 'taser'],
  },
  military: {
    missionTypes: ['kill_squad', 'ambush'],
    objective: 'eliminate',
    squadRoles: [
      { role: 'leader', chance: 0.1 },
      { role: 'specialist', chance: 0.2 },
      { role: 'soldier', chance: 0.7 },
    ],
    weaponClasses: ['assault_rifle', 'lmg', 'sniper_rifle', 'grenade'],
    specialistSkills: ['marksman', 'heavy_weapons', 'demo'],
  },
  government: {
    missionTypes: ['arrest_squad', 'hit_team'],
    objective: 'capture',
    squadRoles: [
      { role: 'leader', chance: 0.2 },
      { role: 'specialist', chance: 0.4 },
      { role: 'soldier', chance: 0.4 },
    ],
    weaponClasses: ['pistol', 'smg', 'silenced'],
    specialistSkills: ['interrogation', 'surveillance', 'hacking'],
  },
  corporations: {
    missionTypes: ['bounty_hunters', 'hit_team'],
    objective: 'eliminate',
    squadRoles: [
      { role: 'leader', chance: 0.15 },
      { role: 'specialist', chance: 0.35 },
      { role: 'soldier', chance: 0.5 },
    ],
    weaponClasses: ['smg', 'assault_rifle', 'sniper_rifle'],
    specialistSkills: ['tech', 'melee', 'tracking'],
  },
  underworld: {
    missionTypes: ['kill_squad', 'bounty_hunters', 'ambush'],
    objective: 'eliminate',
    squadRoles: [
      { role: 'leader', chance: 0.1 },
      { role: 'specialist', chance: 0.15 },
      { role: 'soldier', chance: 0.75 },
    ],
    weaponClasses: ['pistol', 'smg', 'shotgun', 'melee'],
    specialistSkills: ['intimidation', 'torture', 'escape_artist'],
  },
  media: {
    missionTypes: [], // Media doesn't send squads
    objective: 'capture',
    squadRoles: [],
    weaponClasses: [],
    specialistSkills: [],
  },
};

const SQUAD_NAMES_BY_FACTION: Record<FactionType, string[]> = {
  police: ['SWAT Alpha', 'Tactical Response Unit', 'Metro Squad', 'Fugitive Task Force'],
  military: ['Delta Team', 'Strike Force', 'Blackout Unit', 'Ghost Company'],
  government: ['Agency Team', 'Shadow Unit', 'Black Ops', 'Cleanup Crew'],
  corporations: ['Executive Protection', 'Asset Recovery', 'Neutralization Team', 'Hunter Cell'],
  underworld: ['The Cleaners', 'Dead End Gang', 'Night Wolves', 'Blood Money Crew'],
  media: [],
};

/**
 * Generate a hunt squad
 */
function generateHuntSquad(
  factionType: FactionType,
  bounty: Bounty
): HuntSquadMember[] {
  const config = FACTION_SQUAD_CONFIGS[factionType];
  const squad: HuntSquadMember[] = [];

  const { min, max } = bounty.hunterCount;
  const squadSize = Math.floor(Math.random() * (max - min + 1)) + min;

  for (let i = 0; i < squadSize; i++) {
    // Determine role
    const roleRoll = Math.random();
    let cumulativeChance = 0;
    let role: HuntSquadMember['role'] = 'soldier';

    for (const roleConfig of config.squadRoles) {
      cumulativeChance += roleConfig.chance;
      if (roleRoll <= cumulativeChance) {
        role = roleConfig.role;
        break;
      }
    }

    // Generate member
    const weaponClass = config.weaponClasses[
      Math.floor(Math.random() * config.weaponClasses.length)
    ] || 'pistol';

    const skills: string[] = [];
    if (role === 'specialist' && config.specialistSkills.length > 0) {
      skills.push(config.specialistSkills[
        Math.floor(Math.random() * config.specialistSkills.length)
      ]);
    }

    // Threat level based on bounty level and role
    let threatLevel = bounty.hunterThreatLevel;
    if (role === 'leader') threatLevel += 2;
    else if (role === 'specialist') threatLevel += 1;
    threatLevel = Math.min(9, Math.max(1, threatLevel + Math.floor(Math.random() * 2) - 1));

    squad.push({
      id: `hunter_${factionType}_${i}_${Date.now()}`,
      name: generateHunterName(factionType, role),
      role,
      threatLevel,
      weaponClass,
      skills,
    });
  }

  return squad;
}

/**
 * Generate a hunter name
 */
function generateHunterName(faction: FactionType, role: HuntSquadMember['role']): string {
  const firstNames = ['Alex', 'Sam', 'Jordan', 'Casey', 'Morgan', 'Riley', 'Quinn', 'Blake'];
  const lastNames = ['Stone', 'Wolf', 'Hawk', 'Frost', 'Black', 'Steel', 'Cross', 'Vance'];

  const prefix = role === 'leader' ? 'Cpt. ' : role === 'specialist' ? 'Sgt. ' : '';
  const first = firstNames[Math.floor(Math.random() * firstNames.length)];
  const last = lastNames[Math.floor(Math.random() * lastNames.length)];

  return `${prefix}${first} ${last}`;
}

// =============================================================================
// HUNT MISSION GENERATION
// =============================================================================

/**
 * Generate a hunt mission from a bounty
 */
export function generateHuntMission(
  standing: FactionStanding,
  bounty: Bounty,
  timestamp: number
): HuntMission | null {
  const config = FACTION_SQUAD_CONFIGS[standing.factionType];

  // Media doesn't send squads
  if (config.missionTypes.length === 0) {
    return null;
  }

  const missionType = config.missionTypes[
    Math.floor(Math.random() * config.missionTypes.length)
  ];

  const squad = generateHuntSquad(standing.factionType, bounty);
  const squadNames = SQUAD_NAMES_BY_FACTION[standing.factionType];
  const squadName = squadNames[Math.floor(Math.random() * squadNames.length)] || 'Hunt Squad';

  // Calculate timing based on bounty level
  const activationDelay: Record<BountyLevel, number> = {
    minor: 48,   // 2 days
    major: 24,   // 1 day
    extreme: 12, // 12 hours
  };

  const duration: Record<BountyLevel, number> = {
    minor: 168,  // 1 week
    major: 336,  // 2 weeks
    extreme: 672, // 4 weeks
  };

  return {
    id: `hunt_${standing.factionId}_${timestamp}`,
    factionType: standing.factionType,
    countryCode: standing.countryCode,
    countryName: standing.countryName,

    missionType,
    objective: config.objective,

    squad,
    squadSize: squad.length,
    averageThreatLevel: Math.round(
      squad.reduce((sum, m) => sum + m.threatLevel, 0) / squad.length
    ),

    issuedAt: timestamp,
    activatesAt: timestamp + activationDelay[bounty.level],
    expiresAt: timestamp + duration[bounty.level],

    status: 'pending',
    encounterCount: 0,

    rewardMoney: Math.round(bounty.amount * 0.1), // 10% of bounty as loot
    rewardIntel: generateIntelRewards(standing.factionType, bounty.level),

    bountyId: bounty.id,
  };
}

/**
 * Generate intel rewards from defeating hunters
 */
function generateIntelRewards(faction: FactionType, level: BountyLevel): string[] {
  const intelByFaction: Record<FactionType, string[]> = {
    police: ['patrol_routes', 'response_times', 'officer_roster'],
    military: ['base_locations', 'weapon_cache', 'deployment_schedule'],
    government: ['safe_houses', 'agent_identities', 'black_budget'],
    corporations: ['security_codes', 'executive_schedule', 'offshore_accounts'],
    underworld: ['drug_routes', 'gang_hierarchy', 'weapon_supplier'],
    media: [],
  };

  const availableIntel = intelByFaction[faction];
  const count = level === 'extreme' ? 3 : level === 'major' ? 2 : 1;

  return availableIntel.slice(0, count);
}

// =============================================================================
// ENCOUNTER CHECKS
// =============================================================================

/**
 * Check if a hunt squad encounters the player
 */
export function checkHuntEncounter(
  mission: HuntMission,
  playerLocation: { countryCode: string; cityName: string },
  timestamp: number
): {
  encountered: boolean;
  ambushed: boolean;
  escapePossible: boolean;
} {
  // Not active yet or expired
  if (timestamp < mission.activatesAt || timestamp > mission.expiresAt) {
    return { encountered: false, ambushed: false, escapePossible: true };
  }

  // Different country = no encounter
  if (mission.countryCode !== playerLocation.countryCode) {
    return { encountered: false, ambushed: false, escapePossible: true };
  }

  // Base encounter chance from bounty thresholds
  const bountyLevel = mission.averageThreatLevel >= 7 ? 'extreme'
    : mission.averageThreatLevel >= 4 ? 'major' : 'minor';
  const baseChance = BOUNTY_THRESHOLDS[bountyLevel].encounterChancePerDay / 24; // Per hour

  // Increase chance if they've encountered before
  const pursuitBonus = mission.encounterCount * 0.05;

  // Ambush mission type has higher encounter rate
  const ambushBonus = mission.missionType === 'ambush' ? 0.15 : 0;

  const encounterChance = Math.min(0.5, baseChance + pursuitBonus + ambushBonus);
  const encountered = Math.random() < encounterChance;

  if (!encountered) {
    return { encountered: false, ambushed: false, escapePossible: true };
  }

  // Check if ambushed (surprise attack)
  const ambushed = mission.missionType === 'ambush' && Math.random() < 0.6;

  // Escape possibility based on faction
  const escapeChances: Record<FactionType, number> = {
    police: 0.3,
    military: 0.2,
    government: 0.25,
    corporations: 0.35,
    underworld: 0.4,
    media: 1.0,
  };
  const escapePossible = Math.random() < escapeChances[mission.factionType];

  return { encountered, ambushed, escapePossible };
}

// =============================================================================
// MISSION OUTCOME PROCESSING
// =============================================================================

export type HuntOutcome = 'player_escaped' | 'player_captured' | 'hunters_defeated' | 'hunters_escaped';

export interface HuntMissionResult {
  mission: HuntMission;
  outcome: HuntOutcome;
  huntersKilled: number;
  huntersCaptured: number;
  playerCasualties: number;
  lootGained: number;
  intelGained: string[];
  standingChange: number;
}

/**
 * Process hunt mission outcome
 */
export function processHuntOutcome(
  mission: HuntMission,
  outcome: HuntOutcome,
  details: {
    huntersKilled: number;
    huntersCaptured: number;
    playerCasualties: number;
  }
): HuntMissionResult {
  const result: HuntMissionResult = {
    mission,
    outcome,
    huntersKilled: details.huntersKilled,
    huntersCaptured: details.huntersCaptured,
    playerCasualties: details.playerCasualties,
    lootGained: 0,
    intelGained: [],
    standingChange: 0,
  };

  switch (outcome) {
    case 'hunters_defeated':
      result.lootGained = mission.rewardMoney;
      result.intelGained = mission.rewardIntel;
      result.standingChange = -10; // Defeating hunters further angers faction
      mission.status = 'defeated';
      break;

    case 'player_escaped':
      result.standingChange = -2; // Minor annoyance
      mission.status = 'escaped';
      mission.encounterCount++;
      break;

    case 'hunters_escaped':
      mission.status = 'active';
      mission.encounterCount++;
      break;

    case 'player_captured':
      mission.status = 'captured';
      // Capture triggers special game state
      break;
  }

  return result;
}

// =============================================================================
// HUNT MISSION MANAGER
// =============================================================================

let huntManagerInstance: HuntMissionManager | null = null;

export class HuntMissionManager {
  private activeMissions: Map<string, HuntMission> = new Map();
  private started: boolean = false;

  start(): void {
    if (this.started) return;
    this.started = true;

    // Check for encounters every hour
    const timeEngine = getTimeEngine();
    timeEngine.on('hour_change', () => {
      // Encounter checks would be called from game loop
    });
  }

  addMission(mission: HuntMission): void {
    this.activeMissions.set(mission.id, mission);
  }

  getMission(id: string): HuntMission | undefined {
    return this.activeMissions.get(id);
  }

  getActiveMissions(countryCode?: string): HuntMission[] {
    const missions = Array.from(this.activeMissions.values());
    if (countryCode) {
      return missions.filter(m => m.countryCode === countryCode && m.status === 'active');
    }
    return missions.filter(m => m.status === 'active' || m.status === 'pending');
  }

  removeMission(id: string): void {
    this.activeMissions.delete(id);
  }

  /**
   * Update mission statuses based on time
   */
  updateMissions(timestamp: number): void {
    for (const mission of this.activeMissions.values()) {
      // Activate pending missions
      if (mission.status === 'pending' && timestamp >= mission.activatesAt) {
        mission.status = 'active';
      }

      // Expire old missions
      if (mission.status === 'active' && timestamp >= mission.expiresAt) {
        mission.status = 'escaped';
      }
    }
  }

  /**
   * Get warnings about active hunt missions
   */
  getHuntWarnings(countryCode: string): string[] {
    const warnings: string[] = [];
    const missions = this.getActiveMissions(countryCode);

    for (const mission of missions) {
      const factionName = FACTION_NAMES[mission.factionType];
      const icon = FACTION_ICONS[mission.factionType];

      if (mission.status === 'active') {
        warnings.push(
          `${icon} ${factionName} ${mission.squadSize}-person ${mission.missionType.replace('_', ' ')} is hunting you!`
        );
      } else if (mission.status === 'pending') {
        warnings.push(
          `${icon} ${factionName} is organizing a hunt squad...`
        );
      }
    }

    return warnings;
  }
}

export function getHuntMissionManager(): HuntMissionManager {
  if (!huntManagerInstance) {
    huntManagerInstance = new HuntMissionManager();
  }
  return huntManagerInstance;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  generateHuntMission,
  checkHuntEncounter,
  processHuntOutcome,
  getHuntMissionManager,
};
