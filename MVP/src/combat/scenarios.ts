/**
 * Combat Scenario Templates
 *
 * Predefined battle setups for common encounters.
 * NO Phaser dependencies - pure TypeScript.
 */

import { SimUnit, BattleConfig, DEFAULT_BATTLE_CONFIG } from './types';
import { createUnit, UNIT_PRESETS, resetUnitIds } from './humanPresets';
import { runBattle, runQuickBattle } from './battleRunner';

// ============ SCENARIO TYPES ============

export type ScenarioDifficulty = 'easy' | 'normal' | 'hard' | 'nightmare';
export type ScenarioType = 'street' | 'military' | 'corporate' | 'superhuman' | 'boss';

export interface CombatScenario {
  id: string;
  name: string;
  description: string;
  type: ScenarioType;
  difficulty: ScenarioDifficulty;
  playerUnits: number;         // Suggested player squad size
  createEnemies: () => SimUnit[];
  config?: Partial<BattleConfig>;
}

// ============ STREET SCENARIOS ============

export const STREET_SCENARIOS: CombatScenario[] = [
  {
    id: 'muggers',
    name: 'Street Muggers',
    description: 'A group of thugs looking for trouble',
    type: 'street',
    difficulty: 'easy',
    playerUnits: 2,
    createEnemies: () => {
      resetUnitIds();
      return [
        createUnit(UNIT_PRESETS.thug, 'red', 'Mugger 1'),
        createUnit(UNIT_PRESETS.thug, 'red', 'Mugger 2'),
        createUnit(UNIT_PRESETS.thug, 'red', 'Mugger 3'),
      ];
    },
  },
  // BF-005: Added gang leader + enforcers for proper challenge
  {
    id: 'gang_patrol',
    name: 'Gang Patrol',
    description: 'Armed gang members patrolling their turf',
    type: 'street',
    difficulty: 'normal',
    playerUnits: 3,
    createEnemies: () => {
      resetUnitIds();
      return [
        createUnit(UNIT_PRESETS.gangLeader, 'red', 'Shot Caller'),    // Leader with SMG
        createUnit(UNIT_PRESETS.gangEnforcer, 'red', 'Enforcer 1'),
        createUnit(UNIT_PRESETS.gangEnforcer, 'red', 'Enforcer 2'),
        createUnit(UNIT_PRESETS.gangEnforcer, 'red', 'Enforcer 3'),
        createUnit(UNIT_PRESETS.thugPistol, 'red', 'Gunman 1'),
      ];
    },
  },
  // BF-005: Added more enforcers for hard difficulty (8 vs 4)
  {
    id: 'gang_hideout',
    name: 'Gang Hideout Raid',
    description: 'Take down a gang boss and their crew',
    type: 'street',
    difficulty: 'hard',
    playerUnits: 4,
    createEnemies: () => {
      resetUnitIds();
      return [
        createUnit(UNIT_PRESETS.gangLeader, 'red', 'Boss'),
        createUnit(UNIT_PRESETS.gangEnforcer, 'red', 'Enforcer 1'),
        createUnit(UNIT_PRESETS.gangEnforcer, 'red', 'Enforcer 2'),
        createUnit(UNIT_PRESETS.gangEnforcer, 'red', 'Enforcer 3'),
        createUnit(UNIT_PRESETS.gangEnforcer, 'red', 'Enforcer 4'),
        createUnit(UNIT_PRESETS.thugPistol, 'red', 'Gunman 1'),
        createUnit(UNIT_PRESETS.thugPistol, 'red', 'Gunman 2'),
        createUnit(UNIT_PRESETS.thugPistol, 'red', 'Gunman 3'),
      ];
    },
  },
];

// ============ MILITARY SCENARIOS ============

export const MILITARY_SCENARIOS: CombatScenario[] = [
  {
    id: 'patrol_contact',
    name: 'Patrol Contact',
    description: 'Encounter with military patrol',
    type: 'military',
    difficulty: 'normal',
    playerUnits: 3,
    createEnemies: () => {
      resetUnitIds();
      return [
        createUnit(UNIT_PRESETS.soldierRifle, 'red', 'Soldier 1'),
        createUnit(UNIT_PRESETS.soldierRifle, 'red', 'Soldier 2'),
        createUnit(UNIT_PRESETS.soldierPistol, 'red', 'Officer'),
      ];
    },
  },
  // BF-006: Reduced to 4 enemies for balanced challenge
  {
    id: 'checkpoint',
    name: 'Checkpoint Assault',
    description: 'Fortified military checkpoint',
    type: 'military',
    difficulty: 'hard',
    playerUnits: 4,
    createEnemies: () => {
      resetUnitIds();
      return [
        createUnit(UNIT_PRESETS.heavyGunner, 'red', 'MG Gunner'),
        createUnit(UNIT_PRESETS.soldierShotgun, 'red', 'Breacher'),
        createUnit(UNIT_PRESETS.soldierRifle, 'red', 'Rifleman'),
        createUnit(UNIT_PRESETS.soldierPistol, 'red', 'Officer'),
      ];
    },
  },
  {
    id: 'base_defense',
    name: 'Base Defense',
    description: 'Elite military defending their base',
    type: 'military',
    difficulty: 'nightmare',
    playerUnits: 6,
    createEnemies: () => {
      resetUnitIds();
      return [
        createUnit(UNIT_PRESETS.operativeSniper, 'red', 'Sniper'),
        createUnit(UNIT_PRESETS.operativeSMG, 'red', 'Commando 1'),
        createUnit(UNIT_PRESETS.operativeSMG, 'red', 'Commando 2'),
        createUnit(UNIT_PRESETS.heavyGunner, 'red', 'Heavy 1'),
        createUnit(UNIT_PRESETS.heavyGunner, 'red', 'Heavy 2'),
        createUnit(UNIT_PRESETS.rocketTrooper, 'red', 'Rocket'),
        createUnit(UNIT_PRESETS.soldierRifle, 'red', 'Guard 1'),
        createUnit(UNIT_PRESETS.soldierRifle, 'red', 'Guard 2'),
      ];
    },
  },
];

// ============ CORPORATE SCENARIOS ============

export const CORPORATE_SCENARIOS: CombatScenario[] = [
  {
    id: 'security_patrol',
    name: 'Security Patrol',
    description: 'Corporate security with tazers',
    type: 'corporate',
    difficulty: 'easy',
    playerUnits: 2,
    createEnemies: () => {
      resetUnitIds();
      return [
        createUnit(UNIT_PRESETS.securityBot, 'red', 'Security Bot 1'),
        createUnit(UNIT_PRESETS.securityBot, 'red', 'Security Bot 2'),
      ];
    },
  },
  {
    id: 'drone_swarm',
    name: 'Drone Swarm',
    description: 'Combat drones defending a facility',
    type: 'corporate',
    difficulty: 'normal',
    playerUnits: 3,
    createEnemies: () => {
      resetUnitIds();
      return [
        createUnit(UNIT_PRESETS.combatDrone, 'red', 'Drone 1'),
        createUnit(UNIT_PRESETS.combatDrone, 'red', 'Drone 2'),
        createUnit(UNIT_PRESETS.combatDrone, 'red', 'Drone 3'),
        createUnit(UNIT_PRESETS.combatDrone, 'red', 'Drone 4'),
      ];
    },
  },
  {
    id: 'robot_facility',
    name: 'Robot Facility',
    description: 'War bots guarding high-value target',
    type: 'corporate',
    difficulty: 'hard',
    playerUnits: 4,
    createEnemies: () => {
      resetUnitIds();
      return [
        createUnit(UNIT_PRESETS.warBot, 'red', 'War Bot'),
        createUnit(UNIT_PRESETS.combatDrone, 'red', 'Drone 1'),
        createUnit(UNIT_PRESETS.combatDrone, 'red', 'Drone 2'),
        createUnit(UNIT_PRESETS.securityBot, 'red', 'Security 1'),
        createUnit(UNIT_PRESETS.securityBot, 'red', 'Security 2'),
      ];
    },
  },
  {
    id: 'terminator_hunt',
    name: 'Terminator Hunt',
    description: 'Take down advanced combat robots',
    type: 'corporate',
    difficulty: 'nightmare',
    playerUnits: 6,
    createEnemies: () => {
      resetUnitIds();
      return [
        createUnit(UNIT_PRESETS.terminatorBot, 'red', 'Terminator'),
        createUnit(UNIT_PRESETS.warBot, 'red', 'War Bot 1'),
        createUnit(UNIT_PRESETS.warBot, 'red', 'War Bot 2'),
        createUnit(UNIT_PRESETS.combatDrone, 'red', 'Support Drone 1'),
        createUnit(UNIT_PRESETS.combatDrone, 'red', 'Support Drone 2'),
      ];
    },
  },
];

// ============ SUPERHUMAN SCENARIOS ============

export const SUPERHUMAN_SCENARIOS: CombatScenario[] = [
  {
    id: 'mutant_encounter',
    name: 'Mutant Encounter',
    description: 'Enhanced humans with dangerous powers',
    type: 'superhuman',
    difficulty: 'hard',
    playerUnits: 4,
    createEnemies: () => {
      resetUnitIds();
      return [
        createUnit(UNIT_PRESETS.mutantBruiser, 'red', 'Bruiser'),
        createUnit(UNIT_PRESETS.superSpeedster, 'red', 'Speedster'),
      ];
    },
  },
  {
    id: 'cyborg_squad',
    name: 'Cyborg Squad',
    description: 'Human-machine hybrids',
    type: 'superhuman',
    difficulty: 'hard',
    playerUnits: 4,
    createEnemies: () => {
      resetUnitIds();
      return [
        createUnit(UNIT_PRESETS.cyborgSoldier, 'red', 'Cyborg 1'),
        createUnit(UNIT_PRESETS.cyborgSoldier, 'red', 'Cyborg 2'),
        createUnit(UNIT_PRESETS.combatDrone, 'red', 'Support Drone'),
      ];
    },
  },
  {
    id: 'psychic_threat',
    name: 'Psychic Threat',
    description: 'Mind-enhanced agents',
    type: 'superhuman',
    difficulty: 'nightmare',
    playerUnits: 5,
    createEnemies: () => {
      resetUnitIds();
      return [
        createUnit(UNIT_PRESETS.psychicAgent, 'red', 'Psychic Leader'),
        createUnit(UNIT_PRESETS.psychicAgent, 'red', 'Psychic 2'),
        createUnit(UNIT_PRESETS.cyborgSoldier, 'red', 'Cyborg Guard 1'),
        createUnit(UNIT_PRESETS.cyborgSoldier, 'red', 'Cyborg Guard 2'),
      ];
    },
  },
];

// ============ BOSS SCENARIOS ============

export const BOSS_SCENARIOS: CombatScenario[] = [
  {
    id: 'shadow_assassin',
    name: 'Shadow Assassin',
    description: 'A deadly assassin must be stopped',
    type: 'boss',
    difficulty: 'hard',
    playerUnits: 4,
    createEnemies: () => {
      resetUnitIds();
      return [
        createUnit(UNIT_PRESETS.bossAssassin, 'red', 'Shadow Assassin'),
        createUnit(UNIT_PRESETS.thug, 'red', 'Decoy 1'),
        createUnit(UNIT_PRESETS.thug, 'red', 'Decoy 2'),
      ];
    },
  },
  {
    id: 'juggernaut',
    name: 'The Juggernaut',
    description: 'An unstoppable brute with a minigun',
    type: 'boss',
    difficulty: 'nightmare',
    playerUnits: 6,
    createEnemies: () => {
      resetUnitIds();
      return [
        createUnit(UNIT_PRESETS.bossJuggernaut, 'red', 'Juggernaut'),
        createUnit(UNIT_PRESETS.gangEnforcer, 'red', 'Thug 1'),
        createUnit(UNIT_PRESETS.gangEnforcer, 'red', 'Thug 2'),
      ];
    },
  },
  {
    id: 'mech_pilot',
    name: 'Mech Pilot',
    description: 'Power armor with devastating weapons',
    type: 'boss',
    difficulty: 'nightmare',
    playerUnits: 6,
    createEnemies: () => {
      resetUnitIds();
      return [
        createUnit(UNIT_PRESETS.bossMechsuit, 'red', 'Mech Pilot'),
        createUnit(UNIT_PRESETS.soldierRifle, 'red', 'Support 1'),
        createUnit(UNIT_PRESETS.soldierRifle, 'red', 'Support 2'),
        createUnit(UNIT_PRESETS.rocketTrooper, 'red', 'Backup'),
      ];
    },
  },
  {
    id: 'warlord',
    name: 'The Warlord',
    description: 'Elite commander with a railgun',
    type: 'boss',
    difficulty: 'nightmare',
    playerUnits: 6,
    createEnemies: () => {
      resetUnitIds();
      return [
        createUnit(UNIT_PRESETS.bossWarlord, 'red', 'Warlord'),
        createUnit(UNIT_PRESETS.operativeSniper, 'red', 'Sniper'),
        createUnit(UNIT_PRESETS.operativeSMG, 'red', 'Elite 1'),
        createUnit(UNIT_PRESETS.operativeSMG, 'red', 'Elite 2'),
        createUnit(UNIT_PRESETS.heavyGunner, 'red', 'Heavy'),
      ];
    },
  },
];

// ============ ALL SCENARIOS ============

export const ALL_SCENARIOS: CombatScenario[] = [
  ...STREET_SCENARIOS,
  ...MILITARY_SCENARIOS,
  ...CORPORATE_SCENARIOS,
  ...SUPERHUMAN_SCENARIOS,
  ...BOSS_SCENARIOS,
];

// ============ SCENARIO UTILITIES ============

/**
 * Get scenarios by difficulty.
 */
export function getScenariosByDifficulty(difficulty: ScenarioDifficulty): CombatScenario[] {
  return ALL_SCENARIOS.filter(s => s.difficulty === difficulty);
}

/**
 * Get scenarios by type.
 */
export function getScenariosByType(type: ScenarioType): CombatScenario[] {
  return ALL_SCENARIOS.filter(s => s.type === type);
}

/**
 * Get a random scenario.
 */
export function getRandomScenario(
  difficulty?: ScenarioDifficulty,
  type?: ScenarioType
): CombatScenario {
  let pool = ALL_SCENARIOS;
  if (difficulty) pool = pool.filter(s => s.difficulty === difficulty);
  if (type) pool = pool.filter(s => s.type === type);
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Run a scenario with a player team.
 */
export function runScenario(
  scenario: CombatScenario,
  playerTeam: SimUnit[],
  quickMode: boolean = false
) {
  const enemies = scenario.createEnemies();
  const config = { ...DEFAULT_BATTLE_CONFIG, ...scenario.config };

  if (quickMode) {
    return runQuickBattle(playerTeam, enemies, config.maxRounds, config.apPerRound);
  }

  return runBattle(playerTeam, enemies, config);
}

/**
 * Test a scenario difficulty (run many battles).
 */
export function testScenarioDifficulty(
  scenario: CombatScenario,
  playerPreset: string,
  trials: number = 100
): { winRate: number; avgRounds: number } {
  let wins = 0;
  let totalRounds = 0;

  const preset = UNIT_PRESETS[playerPreset];
  if (!preset) {
    console.error(`Unknown preset: ${playerPreset}`);
    return { winRate: 0, avgRounds: 0 };
  }

  for (let i = 0; i < trials; i++) {
    // Create enemies (includes resetUnitIds)
    const enemies = scenario.createEnemies();

    // Create player team
    resetUnitIds();
    const players: SimUnit[] = [];
    for (let j = 0; j < scenario.playerUnits; j++) {
      players.push(createUnit(preset, 'blue', `Player ${j + 1}`));
    }

    const result = runQuickBattle(players, enemies);
    if (result.winner === 'blue') wins++;
    totalRounds += result.rounds;
  }

  return {
    winRate: (wins / trials) * 100,
    avgRounds: totalRounds / trials,
  };
}

// All exports are inline with their declarations above
