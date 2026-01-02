/**
 * Training System - Combat Training, Danger Room, Martial Arts Sparring
 *
 * Uses batchTester.ts for fast combat simulations.
 * Training provides XP based on performance without permanent death.
 *
 * "Practice makes perfect, but practice against tough opponents makes you elite."
 */

import { SimUnit, BattleConfig } from '../combat/types';
import { runBatch } from '../combat/batchTester';
import {
  createUnit,
  createCustomUnit,
  createTeam,
  UNIT_PRESETS,
  WEAPONS,
} from '../combat/humanPresets';
import { GameCharacter } from './characterSheet';

// ============ TRAINING TYPES ============

export type TrainingDifficulty = 'easy' | 'medium' | 'hard' | 'extreme';
export type TrainingType = 'solo' | 'team' | 'sparring' | 'danger_room';

export interface TrainingSession {
  type: TrainingType;
  difficulty: TrainingDifficulty;
  trainees: GameCharacter[];
  battles: number;  // Number of simulated battles (10-100)
  focus?: 'weapons' | 'tactics' | 'survival' | 'martial_arts';
}

export interface TrainingResult {
  xpGained: number;
  skillProgress: Record<string, number>;  // Skill name -> progress points
  winRate: number;
  avgRoundsToWin: number;
  injuryChance: number;  // Only on hard/extreme
  injured: boolean;
  injuryDescription?: string;
  performanceRating: 'poor' | 'average' | 'good' | 'excellent';
}

// ============ DIFFICULTY CONFIG ============

export const DIFFICULTY_CONFIG: Record<TrainingDifficulty, {
  opponentPreset: keyof typeof UNIT_PRESETS;
  xpMultiplier: number;
  injuryBaseChance: number;
  description: string;
}> = {
  easy: {
    opponentPreset: 'civilianPistol',
    xpMultiplier: 1.0,
    injuryBaseChance: 0,
    description: 'Training dummies and basic drills',
  },
  medium: {
    opponentPreset: 'soldierRifle',
    xpMultiplier: 2.0,
    injuryBaseChance: 0,
    description: 'Standard combat training with instructors',
  },
  hard: {
    opponentPreset: 'operativeSniper',
    xpMultiplier: 3.0,
    injuryBaseChance: 0.05,  // 5% base injury chance
    description: 'Intense live-fire exercises with elite opponents',
  },
  extreme: {
    opponentPreset: 'eliteMerc',
    xpMultiplier: 5.0,
    injuryBaseChance: 0.15,  // 15% base injury chance
    description: 'No holds barred - real weapons, minimal safety',
  },
};

// ============ DANGER ROOM SCENARIOS ============

export interface DangerRoomScenario {
  id: string;
  name: string;
  description: string;
  teamSize: { min: number; max: number };
  opponents: { preset: keyof typeof UNIT_PRESETS; count: number }[];
  rewards: {
    baseXP: number;
    skills: string[];
  };
  difficulty: TrainingDifficulty;
}

export const DANGER_ROOM_SCENARIOS: DangerRoomScenario[] = [
  {
    id: 'basic_assault',
    name: 'Basic Assault',
    description: 'Clear a building with multiple hostiles',
    teamSize: { min: 3, max: 4 },
    opponents: [
      { preset: 'civilianPistol', count: 4 },
    ],
    rewards: { baseXP: 50, skills: ['Tactics', 'Small Arms'] },
    difficulty: 'easy',
  },
  {
    id: 'hostage_rescue',
    name: 'Hostage Rescue',
    description: 'Extract a VIP while neutralizing threats',
    teamSize: { min: 4, max: 6 },
    opponents: [
      { preset: 'soldierRifle', count: 4 },
      { preset: 'knifeExpert', count: 2 },
    ],
    rewards: { baseXP: 100, skills: ['Tactics', 'Leadership'] },
    difficulty: 'medium',
  },
  {
    id: 'defense_drill',
    name: 'Defense Drill',
    description: 'Hold a position against waves of attackers',
    teamSize: { min: 4, max: 6 },
    opponents: [
      { preset: 'soldierRifle', count: 6 },
      { preset: 'soldierShotgun', count: 2 },
    ],
    rewards: { baseXP: 120, skills: ['Tactics', 'Endurance'] },
    difficulty: 'medium',
  },
  {
    id: 'night_ops',
    name: 'Night Operations',
    description: 'Low visibility infiltration and extraction',
    teamSize: { min: 2, max: 4 },
    opponents: [
      { preset: 'operativeSniper', count: 2 },
      { preset: 'soldierRifle', count: 3 },
    ],
    rewards: { baseXP: 150, skills: ['Stealth', 'Awareness'] },
    difficulty: 'hard',
  },
  {
    id: 'elite_showdown',
    name: 'Elite Showdown',
    description: 'Face off against the best of the best',
    teamSize: { min: 4, max: 6 },
    opponents: [
      { preset: 'eliteMerc', count: 4 },
      { preset: 'operativeSniper', count: 2 },
    ],
    rewards: { baseXP: 250, skills: ['Tactics', 'Combat Sense'] },
    difficulty: 'extreme',
  },
  {
    id: 'melee_gauntlet',
    name: 'Melee Gauntlet',
    description: 'Hand-to-hand combat against multiple opponents',
    teamSize: { min: 1, max: 2 },
    opponents: [
      { preset: 'boxer', count: 2 },
      { preset: 'kickboxer', count: 2 },
      { preset: 'knifeExpert', count: 1 },
    ],
    rewards: { baseXP: 100, skills: ['Martial Arts', 'Melee Combat'] },
    difficulty: 'medium',
  },
  {
    id: 'samurai_challenge',
    name: 'Samurai Challenge',
    description: 'Face master swordsmen in close quarters',
    teamSize: { min: 2, max: 3 },
    opponents: [
      { preset: 'samurai', count: 3 },
    ],
    rewards: { baseXP: 180, skills: ['Melee Combat', 'Focus'] },
    difficulty: 'hard',
  },
  {
    id: 'sniper_duel',
    name: 'Sniper Duel',
    description: 'Long-range precision engagement',
    teamSize: { min: 1, max: 2 },
    opponents: [
      { preset: 'operativeSniper', count: 2 },
    ],
    rewards: { baseXP: 150, skills: ['Marksmanship', 'Patience'] },
    difficulty: 'hard',
  },
  {
    id: 'street_brawl',
    name: 'Street Brawl',
    description: 'Multiple unarmed opponents in close quarters',
    teamSize: { min: 1, max: 3 },
    opponents: [
      { preset: 'brawler', count: 5 },
    ],
    rewards: { baseXP: 80, skills: ['Martial Arts', 'Toughness'] },
    difficulty: 'medium',
  },
  {
    id: 'ultimate_warrior',
    name: 'Ultimate Warrior',
    description: 'Solo against overwhelming odds - prove your worth',
    teamSize: { min: 1, max: 1 },
    opponents: [
      { preset: 'soldierRifle', count: 3 },
      { preset: 'knifeExpert', count: 2 },
      { preset: 'brawler', count: 2 },
    ],
    rewards: { baseXP: 300, skills: ['Combat Mastery', 'Survival'] },
    difficulty: 'extreme',
  },
];

// ============ MARTIAL ARTS SPARRING ============

export type MartialArtsStyle = 'grappling' | 'submission' | 'internal' | 'counter' | 'striking';

export interface SparringSession {
  trainee: GameCharacter;
  partner: GameCharacter | 'instructor';
  style: MartialArtsStyle;
  rounds: 3 | 5 | 7;
  rules: 'light_contact' | 'full_contact' | 'grappling_only';
}

export interface SparringResult {
  roundsWon: number;
  totalRounds: number;
  beltProgress: number;  // Progress toward next belt (0-100)
  techniquesUsed: string[];
  injuries: string[];
  xpGained: number;
}

export const SPARRING_CONFIG = {
  // Belt progress per victory
  progressPerWin: {
    vsLowerBelt: 5,
    vsSameBelt: 10,
    vsHigherBelt: 20,
    vsInstructor: 25,
  },
  // XP per round
  xpPerRound: {
    light_contact: 5,
    full_contact: 10,
    grappling_only: 8,
  },
  // Injury chance by contact type
  injuryChance: {
    light_contact: 0.01,
    full_contact: 0.08,
    grappling_only: 0.03,
  },
};

// ============ HELPER FUNCTIONS ============

/**
 * Convert a GameCharacter to a SimUnit for combat simulation.
 */
export function gameCharacterToSimUnit(
  char: GameCharacter,
  team: 'blue' | 'red'
): SimUnit {
  // Map character equipment to weapon
  const weapon = char.equipment?.[0]
    ? WEAPONS[char.equipment[0] as keyof typeof WEAPONS] || WEAPONS.fist
    : WEAPONS.fist;

  return createCustomUnit(
    team,
    char.name,
    {
      MEL: char.stats.MEL,
      RNG: char.stats.RNG,
      AGL: char.stats.AGL,
      CON: char.stats.CON,
      INS: char.stats.INS,
      WIL: char.stats.WIL,
      INT: char.stats.INT,
    },
    weapon,
    {
      dr: 5,  // Basic training gear
      stoppingPower: 2,
    }
  );
}

/**
 * Create opponent team based on difficulty.
 */
function createOpponents(
  difficulty: TrainingDifficulty,
  count: number
): SimUnit[] {
  const config = DIFFICULTY_CONFIG[difficulty];
  const preset = UNIT_PRESETS[config.opponentPreset];
  return createTeam(preset, 'red', count, 'Training Opponent');
}

/**
 * Calculate performance rating from win rate.
 */
function getPerformanceRating(winRate: number): TrainingResult['performanceRating'] {
  if (winRate >= 0.8) return 'excellent';
  if (winRate >= 0.6) return 'good';
  if (winRate >= 0.4) return 'average';
  return 'poor';
}

/**
 * Calculate injury from training (only on hard/extreme).
 */
function rollForInjury(
  difficulty: TrainingDifficulty,
  winRate: number
): { injured: boolean; description?: string } {
  const config = DIFFICULTY_CONFIG[difficulty];
  if (config.injuryBaseChance === 0) {
    return { injured: false };
  }

  // Lower win rate = higher injury chance
  const lossModifier = (1 - winRate) * 0.1;
  const finalChance = config.injuryBaseChance + lossModifier;

  if (Math.random() < finalChance) {
    const injuries = [
      'Bruised ribs - minor discomfort',
      'Sprained wrist - -5% accuracy for 24 hours',
      'Black eye - cosmetic only',
      'Pulled muscle - reduced movement for 12 hours',
      'Minor concussion - rest recommended',
      'Twisted ankle - -2 movement for 48 hours',
    ];
    return {
      injured: true,
      description: injuries[Math.floor(Math.random() * injuries.length)],
    };
  }

  return { injured: false };
}

// ============ MAIN TRAINING FUNCTIONS ============

/**
 * Run a fast combat training session using batchTester.
 * Returns XP and skill progress based on performance.
 */
export function runTrainingSession(session: TrainingSession): TrainingResult {
  const { type, difficulty, trainees, battles, focus } = session;
  const config = DIFFICULTY_CONFIG[difficulty];

  // Convert trainees to SimUnits
  const blueTeam = trainees.map(char => gameCharacterToSimUnit(char, 'blue'));

  // Create appropriate opponents
  const opponentCount = type === 'solo' ? 1 : Math.max(1, blueTeam.length);
  const redTeam = createOpponents(difficulty, opponentCount);

  // Run batch simulation
  const batchResult = runBatch(blueTeam, redTeam, battles, {
    maxRounds: 20,
    apPerRound: 6,
  });

  // Calculate XP
  const winRate = batchResult.blueWinRate / 100;
  const damageRatio = batchResult.blueDamageRatio;
  const survivalBonus = 1 - (batchResult.blueDeathRate / 100) * 0.5;

  const baseXP = 10 * config.xpMultiplier;
  const performanceMultiplier = (winRate * 0.3) + (damageRatio * 0.3) + (survivalBonus * 0.4);
  const xpGained = Math.round(baseXP * performanceMultiplier * (battles / 10));

  // Calculate skill progress based on focus
  const skillProgress: Record<string, number> = {};
  const focusSkill = focus || 'tactics';
  const skillMap: Record<string, string[]> = {
    weapons: ['Small Arms', 'Marksmanship'],
    tactics: ['Tactics', 'Combat Sense'],
    survival: ['Endurance', 'Toughness'],
    martial_arts: ['Martial Arts', 'Melee Combat'],
  };
  const skills = skillMap[focusSkill];
  skills.forEach(skill => {
    skillProgress[skill] = Math.round(xpGained * 0.1);
  });

  // Check for injuries (hard/extreme only)
  const injury = rollForInjury(difficulty, winRate);

  return {
    xpGained,
    skillProgress,
    winRate,
    avgRoundsToWin: batchResult.avgRounds,
    injuryChance: config.injuryBaseChance,
    injured: injury.injured,
    injuryDescription: injury.description,
    performanceRating: getPerformanceRating(winRate),
  };
}

/**
 * Run a Danger Room scenario.
 */
export function runDangerRoomScenario(
  scenarioId: string,
  team: GameCharacter[]
): TrainingResult & { scenarioName: string } {
  const scenario = DANGER_ROOM_SCENARIOS.find(s => s.id === scenarioId);
  if (!scenario) {
    throw new Error(`Unknown Danger Room scenario: ${scenarioId}`);
  }

  // Validate team size
  if (team.length < scenario.teamSize.min || team.length > scenario.teamSize.max) {
    throw new Error(
      `Team size ${team.length} invalid for ${scenario.name}. ` +
      `Required: ${scenario.teamSize.min}-${scenario.teamSize.max}`
    );
  }

  // Convert team to SimUnits
  const blueTeam = team.map(char => gameCharacterToSimUnit(char, 'blue'));

  // Create opponents from scenario
  const redTeam: SimUnit[] = [];
  for (const opponentGroup of scenario.opponents) {
    const preset = UNIT_PRESETS[opponentGroup.preset];
    redTeam.push(...createTeam(preset, 'red', opponentGroup.count));
  }

  // Run simulation (fewer battles for Danger Room - more like a single exercise)
  const batchResult = runBatch(blueTeam, redTeam, 20, {
    maxRounds: 30,
    apPerRound: 6,
  });

  const winRate = batchResult.blueWinRate / 100;
  const config = DIFFICULTY_CONFIG[scenario.difficulty];

  // XP based on scenario rewards + performance
  const performanceBonus = winRate >= 0.5 ? 1.5 : 1.0;
  const xpGained = Math.round(scenario.rewards.baseXP * performanceBonus);

  // Skill progress from scenario rewards
  const skillProgress: Record<string, number> = {};
  scenario.rewards.skills.forEach(skill => {
    skillProgress[skill] = Math.round(xpGained * 0.15);
  });

  const injury = rollForInjury(scenario.difficulty, winRate);

  return {
    scenarioName: scenario.name,
    xpGained,
    skillProgress,
    winRate,
    avgRoundsToWin: batchResult.avgRounds,
    injuryChance: config.injuryBaseChance,
    injured: injury.injured,
    injuryDescription: injury.description,
    performanceRating: getPerformanceRating(winRate),
  };
}

/**
 * Run a martial arts sparring session.
 */
export function runSparringSession(session: SparringSession): SparringResult {
  const { trainee, partner, style, rounds, rules } = session;

  // Create blue (trainee) unit
  const blueUnit = gameCharacterToSimUnit(trainee, 'blue');

  // Create red (partner) unit
  let redUnit: SimUnit;
  if (partner === 'instructor') {
    // Instructor is always elite-level
    redUnit = createUnit(UNIT_PRESETS.samurai, 'red', 'Instructor');
  } else {
    redUnit = gameCharacterToSimUnit(partner, 'red');
  }

  // Sparring uses melee weapons based on style
  const styleWeapons: Record<MartialArtsStyle, keyof typeof WEAPONS> = {
    grappling: 'fist',
    submission: 'fist',
    internal: 'fist',
    counter: 'fist',
    striking: 'fist',
  };
  blueUnit.weapon = WEAPONS[styleWeapons[style]];
  redUnit.weapon = WEAPONS[styleWeapons[style]];

  // Run batch to simulate multiple rounds
  const batchResult = runBatch([blueUnit], [redUnit], rounds, {
    maxRounds: 10,  // Short rounds for sparring
    apPerRound: 6,
  });

  const roundsWon = Math.round((batchResult.blueWinRate / 100) * rounds);

  // Calculate belt progress
  let progressPerWin = SPARRING_CONFIG.progressPerWin.vsSameBelt;
  if (partner === 'instructor') {
    progressPerWin = SPARRING_CONFIG.progressPerWin.vsInstructor;
  }
  const beltProgress = roundsWon * progressPerWin;

  // XP calculation
  const xpPerRound = SPARRING_CONFIG.xpPerRound[rules];
  const xpGained = rounds * xpPerRound + (roundsWon * 5);

  // Injury check
  const injuries: string[] = [];
  if (Math.random() < SPARRING_CONFIG.injuryChance[rules]) {
    const sparringInjuries = [
      'Minor bruise',
      'Sore muscles',
      'Twisted finger',
      'Light headache',
    ];
    injuries.push(sparringInjuries[Math.floor(Math.random() * sparringInjuries.length)]);
  }

  // Techniques used (placeholder - would come from martial arts system)
  const techniquesUsed = ['Basic Punch', 'Block', 'Counter'];

  return {
    roundsWon,
    totalRounds: rounds,
    beltProgress,
    techniquesUsed,
    injuries,
    xpGained,
  };
}

// ============ UTILITY FUNCTIONS ============

/**
 * Get available Danger Room scenarios for a given team size.
 */
export function getAvailableScenarios(teamSize: number): DangerRoomScenario[] {
  return DANGER_ROOM_SCENARIOS.filter(
    s => teamSize >= s.teamSize.min && teamSize <= s.teamSize.max
  );
}

/**
 * Get estimated training time (in game hours).
 */
export function getTrainingDuration(
  type: TrainingType,
  battles: number
): number {
  const baseHours: Record<TrainingType, number> = {
    solo: 1,
    team: 2,
    sparring: 1,
    danger_room: 3,
  };
  return baseHours[type] + Math.floor(battles / 20);
}

/**
 * Get training cost (in game currency).
 */
export function getTrainingCost(
  type: TrainingType,
  difficulty: TrainingDifficulty
): number {
  const baseCost: Record<TrainingType, number> = {
    solo: 50,
    team: 100,
    sparring: 75,
    danger_room: 200,
  };
  const difficultyMultiplier: Record<TrainingDifficulty, number> = {
    easy: 0.5,
    medium: 1.0,
    hard: 1.5,
    extreme: 2.0,
  };
  return Math.round(baseCost[type] * difficultyMultiplier[difficulty]);
}

/**
 * Check if a character can train (not injured, has stamina, etc.).
 */
export function canTrain(character: GameCharacter): {
  canTrain: boolean;
  reason?: string;
} {
  // Check if character is injured (would need injury tracking in GameCharacter)
  if (character.hp < character.maxHp * 0.5) {
    return { canTrain: false, reason: 'Too injured to train (HP below 50%)' };
  }

  // Could add more checks: stamina, time since last training, etc.
  return { canTrain: true };
}
