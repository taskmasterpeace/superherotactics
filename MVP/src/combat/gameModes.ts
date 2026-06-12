/**
 * Emergent Game Modes for SuperHero Tactics
 *
 * These modes combine existing systems (escalation, factions, AI, pods)
 * to create unique gameplay experiences beyond standard elimination.
 */

// ============================================================================
// GAME MODE TYPES
// ============================================================================

export type GameModeId =
  | 'elimination'           // Standard - kill all enemies
  | 'escalation_gauntlet'   // Survive increasing waves, extract when ready
  | 'last_stand'            // Endless survival, score-based
  | 'faction_war'           // Multiple hostile factions fight each other
  | 'extraction_race'       // Reach extraction before heat overwhelms
  | 'stealth_heist'         // Complete objective without triggering escalation
  | 'hostage_rescue'        // Rescue VIP while managing collateral
  | 'territory_control'     // Capture and hold zones
  | 'outbreak';             // Zombie outbreak - survive the horde

export interface GameModeConfig {
  id: GameModeId;
  name: string;
  description: string;

  // Victory conditions
  victoryConditions: {
    elimination?: boolean;           // All enemies dead
    extraction?: boolean;            // All friendlies extracted
    objective?: string;              // Specific objective ID
    surviveRounds?: number;          // Survive N rounds
    holdZones?: number;              // Control N zones for M turns
    score?: number;                  // Reach score threshold
    timeLimit?: number;              // Complete within N rounds
  };

  // Defeat conditions
  defeatConditions: {
    teamWiped?: boolean;             // All friendlies dead
    vipDied?: boolean;               // VIP eliminated
    heatMaxed?: boolean;             // Heat reached 100
    objectiveFailed?: boolean;       // Objective destroyed/lost
    timeExpired?: boolean;           // Time limit exceeded
  };

  // Mode-specific settings
  settings: {
    enableEscalation?: boolean;      // Heat/reinforcement system
    enableFactionWar?: boolean;      // Factions fight each other
    startingHeat?: number;           // Initial heat level
    heatDecayEnabled?: boolean;      // Heat decreases over time
    reinforcementMultiplier?: number; // Wave size modifier
    extractionAvailable?: boolean;   // Can extract at any time
    scorePerKill?: number;           // Points per enemy killed
    scorePerRound?: number;          // Points per round survived
    objectiveId?: string;            // Objective to complete
    vipId?: string;                  // VIP unit to protect

    // Zombie outbreak settings
    enableZombies?: boolean;         // Enable zombie system
    initialZombieCount?: number;     // Starting zombie count
    zombieSpawnRate?: number;        // New zombies per round
    reanimationEnabled?: boolean;    // Dead units can reanimate
    infectionEnabled?: boolean;      // Bites can infect
    allFactionsHostile?: boolean;    // Zombies hostile to everyone
  };
}

// ============================================================================
// MODE DEFINITIONS
// ============================================================================

export const GAME_MODES: Record<GameModeId, GameModeConfig> = {

  // Standard elimination mode
  elimination: {
    id: 'elimination',
    name: 'Elimination',
    description: 'Eliminate all enemy forces to win.',
    victoryConditions: { elimination: true },
    defeatConditions: { teamWiped: true },
    settings: {
      enableEscalation: false,
      extractionAvailable: false,
    },
  },

  // Escalation Gauntlet - survive waves, extract when ready
  escalation_gauntlet: {
    id: 'escalation_gauntlet',
    name: 'Escalation Gauntlet',
    description: 'Fight through escalating reinforcements. Extract when you\'ve had enough - or stay for more glory.',
    victoryConditions: { extraction: true },
    defeatConditions: { teamWiped: true },
    settings: {
      enableEscalation: true,
      startingHeat: 30,              // Start with some heat
      heatDecayEnabled: false,       // Heat only goes up
      reinforcementMultiplier: 1.5,  // Bigger waves
      extractionAvailable: true,     // Can leave anytime
      scorePerKill: 100,             // Points per kill
      scorePerRound: 50,             // Bonus per round survived
    },
  },

  // Last Stand - endless survival
  last_stand: {
    id: 'last_stand',
    name: 'Last Stand',
    description: 'No extraction. No mercy. Survive as long as you can.',
    victoryConditions: { score: 5000 }, // "Victory" at 5000 points
    defeatConditions: { teamWiped: true },
    settings: {
      enableEscalation: true,
      startingHeat: 50,              // Start hot
      heatDecayEnabled: false,
      reinforcementMultiplier: 2.0,  // Massive waves
      extractionAvailable: false,    // No escape
      scorePerKill: 100,
      scorePerRound: 200,            // Big survival bonus
    },
  },

  // Faction War - three-way fight
  faction_war: {
    id: 'faction_war',
    name: 'Faction War',
    description: 'Police, criminals, and you. Let them fight each other - or take them all on.',
    victoryConditions: { elimination: true },
    defeatConditions: { teamWiped: true },
    settings: {
      enableEscalation: true,
      enableFactionWar: true,        // Factions fight each other!
      startingHeat: 40,
      heatDecayEnabled: true,        // Heat decays when not fighting
      reinforcementMultiplier: 1.0,
      extractionAvailable: true,
    },
  },

  // Extraction Race - escape before overwhelmed
  extraction_race: {
    id: 'extraction_race',
    name: 'Extraction Race',
    description: 'Heat is rising fast. Reach extraction before the entire police force arrives.',
    victoryConditions: { extraction: true, timeLimit: 15 },
    defeatConditions: { teamWiped: true, heatMaxed: true },
    settings: {
      enableEscalation: true,
      startingHeat: 60,              // Start very hot
      heatDecayEnabled: false,
      reinforcementMultiplier: 1.5,
      extractionAvailable: true,
    },
  },

  // Stealth Heist - avoid detection
  stealth_heist: {
    id: 'stealth_heist',
    name: 'Stealth Heist',
    description: 'Complete the objective without alerting authorities. Gunfire = immediate reinforcements.',
    victoryConditions: { objective: 'hack_terminal', extraction: true },
    defeatConditions: { teamWiped: true, heatMaxed: true },
    settings: {
      enableEscalation: true,
      startingHeat: 0,               // Start cold
      heatDecayEnabled: true,        // Can cool down
      reinforcementMultiplier: 2.0,  // Massive response if detected
      extractionAvailable: false,    // Must complete objective first
      objectiveId: 'hack_terminal',
    },
  },

  // Hostage Rescue - protect VIP
  hostage_rescue: {
    id: 'hostage_rescue',
    name: 'Hostage Rescue',
    description: 'Rescue the VIP and extract them safely. Collateral damage triggers hostage execution.',
    victoryConditions: { objective: 'rescue_vip', extraction: true },
    defeatConditions: { teamWiped: true, vipDied: true },
    settings: {
      enableEscalation: true,
      startingHeat: 20,
      heatDecayEnabled: false,
      extractionAvailable: false,    // Must rescue VIP first
      vipId: 'hostage_vip',
    },
  },

  // Territory Control - hold zones
  territory_control: {
    id: 'territory_control',
    name: 'Territory Control',
    description: 'Capture and hold control zones. Enemies will try to take them back.',
    victoryConditions: { holdZones: 3 }, // Hold 3 zones for 5 turns
    defeatConditions: { teamWiped: true, timeExpired: true },
    settings: {
      enableEscalation: false,
      extractionAvailable: false,
    },
  },

  // Outbreak - Zombie survival
  outbreak: {
    id: 'outbreak',
    name: 'Outbreak',
    description: 'The dead are rising. Zombies reanimate fallen units. Sprinters, shamblers, and intelligent ones - all hostile to the living.',
    victoryConditions: { elimination: true, extraction: true },
    defeatConditions: { teamWiped: true },
    settings: {
      enableEscalation: true,          // Police/military may still respond
      enableFactionWar: true,          // Everyone fights zombies
      startingHeat: 20,
      heatDecayEnabled: false,
      reinforcementMultiplier: 0.5,    // Reduced living reinforcements
      extractionAvailable: true,       // Can flee if overwhelmed
      scorePerKill: 50,                // Base zombie kills
      scorePerRound: 100,              // Survival bonus

      // Zombie settings
      enableZombies: true,
      initialZombieCount: 6,           // Start with 6 zombies
      zombieSpawnRate: 2,              // 2 new zombies per round
      reanimationEnabled: true,        // The dead RISE
      infectionEnabled: true,          // Bites spread infection
      allFactionsHostile: true,        // Zombies attack everyone
    },
  },
};

// ============================================================================
// SCORING SYSTEM
// ============================================================================

export interface GameModeScore {
  kills: number;
  roundsSurvived: number;
  objectivesCompleted: number;
  extractionBonus: number;
  damageDealt: number;
  damageTaken: number;
  factionKills: { police: number; swat: number; military: number };
  total: number;
}

export function calculateScore(
  config: GameModeConfig,
  stats: {
    kills: number;
    rounds: number;
    objectives: number;
    extracted: boolean;
    damageDealt: number;
    damageTaken: number;
    factionKills: { police: number; swat: number; military: number };
  }
): GameModeScore {
  const { settings } = config;

  const killScore = stats.kills * (settings.scorePerKill || 100);
  const roundScore = stats.rounds * (settings.scorePerRound || 50);
  const objectiveScore = stats.objectives * 500;
  const extractionBonus = stats.extracted ? 1000 : 0;

  // Faction kills are worth more (controversial but high stakes)
  const factionScore =
    stats.factionKills.police * 150 +
    stats.factionKills.swat * 250 +
    stats.factionKills.military * 400;

  // Damage efficiency bonus
  const efficiencyBonus = stats.damageTaken === 0
    ? Math.floor(stats.damageDealt * 0.1)
    : Math.floor((stats.damageDealt / stats.damageTaken) * 100);

  const total = killScore + roundScore + objectiveScore + extractionBonus + factionScore + efficiencyBonus;

  return {
    kills: killScore,
    roundsSurvived: roundScore,
    objectivesCompleted: objectiveScore,
    extractionBonus,
    damageDealt: efficiencyBonus,
    damageTaken: 0, // Just for display
    factionKills: stats.factionKills,
    total,
  };
}

// ============================================================================
// MODE-SPECIFIC BEHAVIORS
// ============================================================================

/**
 * Faction War: Determine if faction units should attack each other
 */
export function shouldFactionsFight(
  attackerFaction: string | undefined,
  defenderFaction: string | undefined,
  playerTeam: 'blue' | 'red'
): boolean {
  // Player faction always hostile to everyone
  if (!attackerFaction || !defenderFaction) return true;

  // Police and criminals always fight
  if (
    (attackerFaction === 'police' && defenderFaction === 'gang') ||
    (attackerFaction === 'gang' && defenderFaction === 'police')
  ) {
    return true;
  }

  // SWAT attacks gangs
  if (
    (attackerFaction === 'swat' && defenderFaction === 'gang') ||
    (attackerFaction === 'gang' && defenderFaction === 'swat')
  ) {
    return true;
  }

  // Same faction = allies
  if (attackerFaction === defenderFaction) return false;

  // Police and SWAT are allies
  if (
    (attackerFaction === 'police' && defenderFaction === 'swat') ||
    (attackerFaction === 'swat' && defenderFaction === 'police')
  ) {
    return false;
  }

  // Default: hostile
  return true;
}

/**
 * Stealth Heist: Calculate detection chance
 */
export function calculateDetectionChance(
  action: 'gunfire' | 'explosion' | 'melee' | 'movement',
  unitINS: number,
  isSuppressed: boolean
): number {
  const baseChance = {
    gunfire: 100,      // Guaranteed detection
    explosion: 100,    // Guaranteed detection
    melee: 20,         // Low chance
    movement: 5,       // Very low chance
  }[action];

  // High INS reduces detection (cleaner operator)
  const insModifier = Math.max(0, 1 - (unitINS - 50) / 100);

  // Suppressed weapons
  const suppressedModifier = isSuppressed ? 0.3 : 1.0;

  return Math.min(100, baseChance * insModifier * suppressedModifier);
}

/**
 * Territory Control: Check if zone is controlled
 */
export interface ControlZone {
  id: string;
  center: { x: number; y: number };
  radius: number;
  controlledBy: 'blue' | 'red' | 'contested' | 'neutral';
  controlProgress: number; // 0-100
  turnsHeld: number;
}

export function updateZoneControl(
  zone: ControlZone,
  blueUnitsInZone: number,
  redUnitsInZone: number
): ControlZone {
  if (blueUnitsInZone > 0 && redUnitsInZone === 0) {
    // Blue capturing
    const newProgress = Math.min(100, zone.controlProgress + 20 * blueUnitsInZone);
    return {
      ...zone,
      controlProgress: newProgress,
      controlledBy: newProgress >= 100 ? 'blue' : 'contested',
      turnsHeld: newProgress >= 100 && zone.controlledBy === 'blue'
        ? zone.turnsHeld + 1
        : 0,
    };
  } else if (redUnitsInZone > 0 && blueUnitsInZone === 0) {
    // Red capturing
    const newProgress = Math.max(0, zone.controlProgress - 20 * redUnitsInZone);
    return {
      ...zone,
      controlProgress: newProgress,
      controlledBy: newProgress <= 0 ? 'red' : 'contested',
      turnsHeld: newProgress <= 0 && zone.controlledBy === 'red'
        ? zone.turnsHeld + 1
        : 0,
    };
  } else if (blueUnitsInZone > 0 && redUnitsInZone > 0) {
    // Contested
    return { ...zone, controlledBy: 'contested', turnsHeld: 0 };
  }

  // No units = stays as is
  return zone;
}

// ============================================================================
// ESCALATION GAUNTLET WAVE GENERATOR
// ============================================================================

export interface GauntletWave {
  waveNumber: number;
  faction: 'police' | 'swat' | 'military';
  unitCount: number;
  hasElite: boolean;
  bonusScore: number;
}

/**
 * Generate escalating wave composition for Gauntlet mode
 */
export function generateGauntletWave(waveNumber: number): GauntletWave {
  // Waves get progressively harder
  let faction: 'police' | 'swat' | 'military';
  let unitCount: number;
  let hasElite = false;

  if (waveNumber <= 3) {
    faction = 'police';
    unitCount = 2 + waveNumber;
    hasElite = false;
  } else if (waveNumber <= 6) {
    faction = 'swat';
    unitCount = 3 + waveNumber;
    hasElite = waveNumber >= 5;
  } else {
    faction = 'military';
    unitCount = 4 + waveNumber;
    hasElite = true;
  }

  // Bonus score for surviving each wave
  const bonusScore = waveNumber * 100 + (hasElite ? 200 : 0);

  return {
    waveNumber,
    faction,
    unitCount,
    hasElite,
    bonusScore,
  };
}

// ============================================================================
// ZOMBIE OUTBREAK WAVE GENERATOR
// ============================================================================

export type ZombieType = 'shambler' | 'sprinter' | 'intelligent';

export interface ZombieWave {
  waveNumber: number;
  zombieCounts: {
    shambler: number;
    sprinter: number;
    intelligent: number;
  };
  totalCount: number;
  hasAlpha: boolean;  // Intelligent zombie leading the horde
  bonusScore: number;
}

/**
 * Generate zombie wave composition for Outbreak mode
 * Earlier waves: mostly shamblers
 * Mid waves: sprinters join
 * Late waves: intelligent zombies coordinate attacks
 */
export function generateZombieWave(waveNumber: number): ZombieWave {
  let shambler = 0;
  let sprinter = 0;
  let intelligent = 0;
  let hasAlpha = false;

  if (waveNumber <= 2) {
    // Early: All shamblers
    shambler = 4 + waveNumber * 2;
  } else if (waveNumber <= 4) {
    // Mid-early: Shamblers with sprinters
    shambler = 3 + waveNumber;
    sprinter = waveNumber - 1;
  } else if (waveNumber <= 6) {
    // Mid: Mixed horde
    shambler = 4 + waveNumber;
    sprinter = 2 + waveNumber - 3;
    intelligent = 1;
    hasAlpha = waveNumber >= 6;
  } else {
    // Late: Coordinated horde with alpha
    shambler = 5 + waveNumber;
    sprinter = 3 + waveNumber - 4;
    intelligent = 1 + Math.floor((waveNumber - 6) / 2);
    hasAlpha = true;
  }

  const totalCount = shambler + sprinter + intelligent;
  const bonusScore = totalCount * 25 + (hasAlpha ? 500 : 0) + (intelligent * 100);

  return {
    waveNumber,
    zombieCounts: { shambler, sprinter, intelligent },
    totalCount,
    hasAlpha,
    bonusScore,
  };
}

/**
 * Check if unit should reanimate as zombie
 * Based on Outbreak mode rules
 */
export function shouldReanimate(
  wasInfected: boolean,
  wasBitten: boolean,
  isOrganic: boolean,
  roundsSinceDeath: number
): boolean {
  // Only organic units can reanimate
  if (!isOrganic) return false;

  // Infected units always reanimate (after 1 round)
  if (wasInfected && roundsSinceDeath >= 1) return true;

  // Bitten but not infected: 50% chance after 2 rounds
  if (wasBitten && !wasInfected && roundsSinceDeath >= 2) {
    return Math.random() < 0.5;
  }

  // Non-infected corpses: 10% chance after 3 rounds (ambient infection)
  if (roundsSinceDeath >= 3) {
    return Math.random() < 0.1;
  }

  return false;
}

// ============================================================================
// LAST STAND HIGH SCORE TRACKING
// ============================================================================

export interface HighScoreEntry {
  playerName: string;
  score: number;
  roundsSurvived: number;
  kills: number;
  factionKills: { police: number; swat: number; military: number };
  date: string;
  squadComposition: string[]; // Character names
}

export interface HighScoreTable {
  mode: GameModeId;
  entries: HighScoreEntry[];
}

export function isHighScore(
  table: HighScoreTable,
  score: number,
  maxEntries: number = 10
): boolean {
  if (table.entries.length < maxEntries) return true;
  return score > table.entries[table.entries.length - 1].score;
}

export function addHighScore(
  table: HighScoreTable,
  entry: HighScoreEntry,
  maxEntries: number = 10
): HighScoreTable {
  const newEntries = [...table.entries, entry]
    .sort((a, b) => b.score - a.score)
    .slice(0, maxEntries);

  return { ...table, entries: newEntries };
}

// ============================================================================
// MODE INITIALIZATION
// ============================================================================

export interface GameModeState {
  mode: GameModeConfig;
  score: GameModeScore;
  currentWave?: GauntletWave;
  currentZombieWave?: ZombieWave;
  zones?: ControlZone[];
  objectiveComplete: boolean;
  vipAlive: boolean;
  extractionUnlocked: boolean;
  roundNumber: number;

  // Zombie outbreak state
  zombieState?: {
    activeZombies: number;
    totalReanimations: number;
    infectedUnits: string[];  // Unit IDs that are infected
    corpses: Array<{
      unitId: string;
      position: { x: number; y: number };
      wasInfected: boolean;
      wasBitten: boolean;
      roundOfDeath: number;
      isOrganic: boolean;
    }>;
  };
}

export function initializeGameMode(
  modeId: GameModeId,
  mapWidth: number,
  mapHeight: number
): GameModeState {
  const mode = GAME_MODES[modeId];

  // Initialize control zones for territory mode
  let zones: ControlZone[] | undefined;
  if (modeId === 'territory_control') {
    zones = [
      { id: 'zone_a', center: { x: Math.floor(mapWidth * 0.25), y: Math.floor(mapHeight * 0.5) }, radius: 2, controlledBy: 'neutral', controlProgress: 50, turnsHeld: 0 },
      { id: 'zone_b', center: { x: Math.floor(mapWidth * 0.5), y: Math.floor(mapHeight * 0.25) }, radius: 2, controlledBy: 'neutral', controlProgress: 50, turnsHeld: 0 },
      { id: 'zone_c', center: { x: Math.floor(mapWidth * 0.75), y: Math.floor(mapHeight * 0.5) }, radius: 2, controlledBy: 'neutral', controlProgress: 50, turnsHeld: 0 },
    ];
  }

  // Initialize zombie state for outbreak mode
  let zombieState: GameModeState['zombieState'] | undefined;
  let currentZombieWave: ZombieWave | undefined;

  if (modeId === 'outbreak') {
    zombieState = {
      activeZombies: mode.settings.initialZombieCount || 6,
      totalReanimations: 0,
      infectedUnits: [],
      corpses: [],
    };
    currentZombieWave = generateZombieWave(1);
  }

  return {
    mode,
    score: {
      kills: 0,
      roundsSurvived: 0,
      objectivesCompleted: 0,
      extractionBonus: 0,
      damageDealt: 0,
      damageTaken: 0,
      factionKills: { police: 0, swat: 0, military: 0 },
      total: 0,
    },
    currentWave: modeId === 'escalation_gauntlet' || modeId === 'last_stand'
      ? generateGauntletWave(1)
      : undefined,
    currentZombieWave,
    zones,
    zombieState,
    objectiveComplete: false,
    vipAlive: true,
    extractionUnlocked: mode.settings.extractionAvailable ?? false,
    roundNumber: 1,
  };
}
