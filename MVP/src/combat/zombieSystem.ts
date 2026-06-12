/**
 * Zombie System
 *
 * Three zombie archetypes based on original unit stats:
 * - SHAMBLER: Slow, tough, relentless
 * - SPRINTER: Fast as the human was, aggressive, fragile
 * - INTELLIGENT: Fast, smart, coordinates horde, hostile to ALL living
 *
 * Infection spreads through bites. Death while infected = reanimation.
 */

import { SimUnit, StatusEffectInstance } from './types';

// ============================================================================
// ZOMBIE TYPES
// ============================================================================

export type ZombieType = 'shambler' | 'sprinter' | 'intelligent';

export interface ZombieTypeConfig {
  type: ZombieType;
  name: string;
  description: string;

  // Movement (AP determines speed)
  apMultiplier: number;      // Multiplier on original unit's AP
  minAp: number;             // Minimum AP
  maxAp: number;             // Maximum AP cap

  // Health
  hpMultiplier: number;      // % of original HP to keep

  // Stat modifiers (applied to original stats)
  statMods: {
    MEL: number;   // Melee bonus/penalty
    STR: number;   // Strength bonus (for grabs)
    CON: number;   // Constitution (toughness)
    AGL: number;   // Agility (dodge)
    INT: number;   // Intelligence (AI behavior)
    INS: number;   // Insight (awareness)
    WIL: number;   // Willpower (immune to fear anyway)
  };

  // Combat behavior
  meleeOnly: boolean;        // Can only melee
  aggressiveAI: boolean;     // Always charges
  canUseTactics: boolean;    // Flanking, cover, etc.
  coordinatesHorde: boolean; // Leads other zombies

  // Special abilities
  canSprint: boolean;        // Uses all AP for movement when far
  canGrab: boolean;          // Grapple attacks
  infectOnHit: boolean;      // Spreads infection
  infectChance: number;      // % chance to infect on hit

  // Faction behavior
  attacksAllLiving: boolean; // Hostile to ALL non-zombie factions
}

// ============================================================================
// ZOMBIE TYPE DEFINITIONS
// ============================================================================

export const ZOMBIE_TYPES: Record<ZombieType, ZombieTypeConfig> = {

  /**
   * SHAMBLER - Classic slow zombie
   * - Slow but relentless
   * - Very tough (high HP/CON)
   * - Dumb (no tactics)
   * - Grabs and bites
   */
  shambler: {
    type: 'shambler',
    name: 'Shambler',
    description: 'Slow, shambling undead. Tough but predictable.',

    apMultiplier: 0.4,    // Only 40% of original AP
    minAp: 2,
    maxAp: 3,

    hpMultiplier: 0.8,    // 80% HP (they're dead, took damage)

    statMods: {
      MEL: +10,           // Stronger melee (undead strength)
      STR: +15,           // Very strong grabs
      CON: +25,           // VERY tough
      AGL: -20,           // Slow and clumsy
      INT: -45,           // Braindead
      INS: -30,           // Poor awareness
      WIL: 0,             // Immune to morale anyway
    },

    meleeOnly: true,
    aggressiveAI: true,
    canUseTactics: false,
    coordinatesHorde: false,

    canSprint: false,     // Too slow to sprint
    canGrab: true,        // Grabs victims
    infectOnHit: true,
    infectChance: 70,     // High infection chance

    attacksAllLiving: true,
  },

  /**
   * SPRINTER - Fast zombie (28 Days Later style)
   * - As fast as the human was in life
   * - Fragile (low HP)
   * - Aggressive (always charges)
   * - Uses "dash" - spends all AP on movement to close distance
   */
  sprinter: {
    type: 'sprinter',
    name: 'Sprinter',
    description: 'Fast, aggressive undead. Charges at full speed.',

    apMultiplier: 1.0,    // FULL speed - as fast as they were alive
    minAp: 5,
    maxAp: 8,

    hpMultiplier: 0.5,    // Only 50% HP (fragile)

    statMods: {
      MEL: +5,            // Slightly stronger
      STR: +5,
      CON: -10,           // Fragile
      AGL: +10,           // Fast and agile
      INT: -40,           // Still dumb
      INS: -20,           // Some awareness (hunting instinct)
      WIL: 0,
    },

    meleeOnly: true,
    aggressiveAI: true,
    canUseTactics: false,
    coordinatesHorde: false,

    canSprint: true,      // Uses ALL AP for movement when far
    canGrab: false,       // Just bites, doesn't grab
    infectOnHit: true,
    infectChance: 50,     // Lower infection (quick bites)

    attacksAllLiving: true,
  },

  /**
   * INTELLIGENT - Smart zombie (evolved/mutated)
   * - Fast like sprinter
   * - Smart (uses tactics, cover, flanking)
   * - Coordinates other zombies
   * - Hostile to ALL living (not just player)
   * - Rare and dangerous
   */
  intelligent: {
    type: 'intelligent',
    name: 'Revenant',
    description: 'Intelligent undead. Leads the horde with cunning tactics.',

    apMultiplier: 1.0,    // Full speed
    minAp: 6,
    maxAp: 8,

    hpMultiplier: 0.7,    // 70% HP

    statMods: {
      MEL: +15,           // Skilled fighter
      STR: +10,
      CON: +5,            // Slightly tough
      AGL: +5,
      INT: 0,             // KEEPS intelligence (the scary part)
      INS: +10,           // Heightened senses
      WIL: 0,
    },

    meleeOnly: false,     // CAN use weapons if they had one
    aggressiveAI: false,  // Uses smart AI
    canUseTactics: true,  // Flanks, uses cover
    coordinatesHorde: true, // Leads other zombies

    canSprint: true,
    canGrab: true,        // Tactical grabs
    infectOnHit: true,
    infectChance: 80,     // Very infectious

    attacksAllLiving: true, // Hostile to police, military, everyone
  },
};

// ============================================================================
// ZOMBIE TYPE DETERMINATION
// ============================================================================

/**
 * Determine zombie type based on original unit's stats.
 *
 * Formula:
 * - High AGL (>=60) + High INT (>=50) = 15% INTELLIGENT
 * - High AGL (>=50) = 60% SPRINTER
 * - Low AGL (<50) = SHAMBLER
 * - Random variance adds unpredictability
 */
export function determineZombieType(originalUnit: SimUnit): ZombieType {
  const agl = originalUnit.stats.AGL;
  const int = originalUnit.stats.INT;

  // Roll for randomness (0-100)
  const roll = Math.random() * 100;

  // Intelligent check: High AGL + High INT + lucky roll
  if (agl >= 60 && int >= 50) {
    // 15% base chance, +1% per INT above 50
    const intelligentChance = 15 + (int - 50);
    if (roll < intelligentChance) {
      return 'intelligent';
    }
  }

  // Sprinter check: High AGL
  if (agl >= 50) {
    // 60% sprinter, 40% shambler for high AGL
    // But also affected by CON - high CON = more likely shambler (tough but slow)
    const con = originalUnit.stats.CON;
    const sprinterChance = 60 - (con - 50) * 0.5; // High CON reduces sprinter chance
    if (roll < Math.max(30, sprinterChance)) {
      return 'sprinter';
    }
  }

  // Default: Shambler
  // Also includes low AGL units and failed sprinter rolls
  return 'shambler';
}

/**
 * Force a specific zombie type (for testing or special spawns)
 */
export function getZombieTypeConfig(type: ZombieType): ZombieTypeConfig {
  return ZOMBIE_TYPES[type];
}

// ============================================================================
// ZOMBIE CREATION
// ============================================================================

/**
 * Reanimate a dead unit as a zombie.
 * Uses original stats to determine type and applies zombie modifiers.
 */
export function reanimateAsZombie(
  deadUnit: SimUnit,
  forcedType?: ZombieType
): SimUnit {
  // Determine zombie type
  const zombieType = forcedType || determineZombieType(deadUnit);
  const config = ZOMBIE_TYPES[zombieType];

  // Calculate new AP based on original
  const originalAp = 6; // Default if not set
  const baseAp = Math.round(originalAp * config.apMultiplier);
  const finalAp = Math.min(config.maxAp, Math.max(config.minAp, baseAp));

  // Calculate new HP
  const newMaxHp = Math.round(deadUnit.maxHp * config.hpMultiplier);

  // Apply stat modifiers
  const newStats = {
    MEL: clampStat(deadUnit.stats.MEL + config.statMods.MEL),
    RNG: deadUnit.stats.RNG, // Zombies don't shoot (mostly)
    AGL: clampStat(deadUnit.stats.AGL + config.statMods.AGL),
    CON: clampStat(deadUnit.stats.CON + config.statMods.CON),
    INS: clampStat(deadUnit.stats.INS + config.statMods.INS),
    WIL: clampStat(deadUnit.stats.WIL + config.statMods.WIL),
    INT: clampStat(deadUnit.stats.INT + config.statMods.INT),
  };

  // Create zombie weapon
  const zombieWeapon = config.meleeOnly
    ? createZombieBite(config)
    : deadUnit.weapon; // Intelligent can keep weapon

  // Create zombie unit
  const zombie: SimUnit = {
    ...deadUnit,
    id: `zombie_${deadUnit.id}_${Date.now()}`,
    name: `${config.name} ${deadUnit.name}`,
    team: 'red', // Zombies are always hostile

    // Health
    hp: newMaxHp,
    maxHp: newMaxHp,
    shieldHp: 0,
    maxShieldHp: 0,

    // Reset combat state
    alive: true,
    acted: false,
    accuracyPenalty: 0,

    // New stats
    stats: newStats,

    // Zombie weapon
    weapon: zombieWeapon,
    disarmed: false,

    // Clear previous effects, add zombified
    statusEffects: [createZombifiedEffect(zombieType)],

    // No armor (rotted away)
    armor: undefined,
    dr: zombieType === 'shambler' ? 3 : 0, // Shamblers have natural DR

    // Martial arts cleared (muscle memory gone... mostly)
    beltLevel: zombieType === 'intelligent' ? deadUnit.beltLevel : undefined,
    martialArtsStyle: zombieType === 'intelligent' ? deadUnit.martialArtsStyle : undefined,

    // Clear grapple state
    grappleState: undefined,
    grapplePartner: undefined,

    // Zombies don't panic
    panicLevel: undefined,
  };

  console.log(`[ZOMBIE] Reanimated ${deadUnit.name} as ${config.name}:`, {
    type: zombieType,
    ap: finalAp,
    hp: newMaxHp,
    MEL: newStats.MEL,
    AGL: newStats.AGL,
  });

  return zombie;
}

/**
 * Clamp stat to valid range (5-99)
 */
function clampStat(value: number): number {
  return Math.max(5, Math.min(99, value));
}

/**
 * Create zombie bite weapon
 */
function createZombieBite(config: ZombieTypeConfig): SimUnit['weapon'] {
  return {
    name: config.type === 'intelligent' ? 'Ravening Bite' : 'Zombie Bite',
    damage: config.type === 'shambler' ? 12 : 15,
    range: 1,
    damageType: 'NECROTIC_BITE',
    apCost: 2,
  };
}

// ============================================================================
// ZOMBIE STATUS EFFECTS
// ============================================================================

/**
 * INFECTED status effect
 * - Progressive DoT
 * - Spreads on melee
 * - Death = reanimation
 */
export function createInfectedEffect(
  severity: 'mild' | 'severe' = 'mild'
): StatusEffectInstance {
  const baseDamage = severity === 'severe' ? 6 : 3;
  const duration = severity === 'severe' ? 4 : 6;

  return {
    id: 'infected',
    duration,
    stacks: 1,
    maxStacks: 1, // Infection doesn't stack, but can become severe
    damagePerTick: baseDamage,
    scaling: 'increasing' as const,
    damageChange: 2, // Gets worse each turn
    source: 'viral',
    // Custom metadata for zombie system
    metadata: {
      triggersReanimation: true,
      severity,
      canBeCured: severity === 'mild', // Severe is too far gone
      spreadChance: 25, // % chance to spread on melee by infected
    },
  };
}

/**
 * ZOMBIFIED status effect (permanent)
 * Marks a unit as a zombie with type-specific flags.
 */
export function createZombifiedEffect(zombieType: ZombieType): StatusEffectInstance {
  const config = ZOMBIE_TYPES[zombieType];

  return {
    id: 'zombified',
    duration: -1, // Permanent
    stacks: 1,
    source: 'reanimation',
    // Custom metadata
    metadata: {
      zombieType,
      meleeOnly: config.meleeOnly,
      canUseTactics: config.canUseTactics,
      coordinatesHorde: config.coordinatesHorde,
      canSprint: config.canSprint,
      attacksAllLiving: config.attacksAllLiving,
      immunities: ['poisoned', 'fear', 'panicked', 'bleeding'], // Undead immunities
    },
  };
}

// ============================================================================
// HEADSHOT MECHANICS - Zombies need headshots!
// ============================================================================

/**
 * Zombie damage reduction for non-headshots.
 *
 * Classic zombie rule: You gotta hit 'em in the head!
 * - Body shots deal REDUCED damage (zombies don't feel pain)
 * - Headshots (crits) deal BONUS damage
 * - Shamblers are even more resistant to body shots
 */
export interface ZombieDamageResult {
  finalDamage: number;
  wasHeadshot: boolean;
  bodyDamageReduction: number;
  headshotMultiplier: number;
}

/**
 * Calculate damage against a zombie, applying headshot mechanics.
 *
 * @param baseDamage - Original damage
 * @param isCrit - Was this a critical hit (headshot)?
 * @param zombieType - Type of zombie
 * @param damageType - Type of damage (fire ignores headshot rules)
 */
export function calculateZombieDamage(
  baseDamage: number,
  isCrit: boolean,
  zombieType: ZombieType,
  damageType?: string
): ZombieDamageResult {
  // Fire, acid, and disintegration ignore headshot rules
  const bypassTypes = ['ENERGY_THERMAL', 'TOXIN_ACID', 'DISINTEGRATION', 'EXPLOSION_CONCUSSION'];
  if (damageType && bypassTypes.includes(damageType)) {
    return {
      finalDamage: baseDamage,
      wasHeadshot: false,
      bodyDamageReduction: 0,
      headshotMultiplier: 1.0,
    };
  }

  // Headshot = critical hit
  if (isCrit) {
    // Headshots deal 2x damage to zombies (brain destruction)
    const headshotMultiplier = 2.0;
    return {
      finalDamage: Math.round(baseDamage * headshotMultiplier),
      wasHeadshot: true,
      bodyDamageReduction: 0,
      headshotMultiplier,
    };
  }

  // Body shot damage reduction by zombie type
  const bodyReductions: Record<ZombieType, number> = {
    shambler: 0.65,    // 65% reduction - shamblers tank body shots
    sprinter: 0.40,    // 40% reduction - sprinters are more fragile
    intelligent: 0.50, // 50% reduction - middle ground
  };

  const reduction = bodyReductions[zombieType];
  const reducedDamage = Math.round(baseDamage * (1 - reduction));

  return {
    finalDamage: Math.max(1, reducedDamage), // Always deal at least 1 damage
    wasHeadshot: false,
    bodyDamageReduction: reduction,
    headshotMultiplier: 1.0,
  };
}

/**
 * Check if a unit is a zombie (has zombified status)
 */
export function isZombie(unit: SimUnit): boolean {
  return unit.statusEffects.some(e => e.id === 'zombified');
}

/**
 * Get zombie type from unit
 */
export function getZombieType(unit: SimUnit): ZombieType | null {
  const zombified = unit.statusEffects.find(e => e.id === 'zombified');
  if (!zombified?.metadata?.zombieType) return null;
  return zombified.metadata.zombieType as ZombieType;
}

// ============================================================================
// ZOMBIE AI BEHAVIOR
// ============================================================================

/**
 * Check if a zombie should sprint (use all AP for movement)
 */
export function shouldZombieSprint(
  zombie: SimUnit,
  distanceToTarget: number
): boolean {
  const zombified = zombie.statusEffects.find(e => e.id === 'zombified');
  if (!zombified?.metadata?.canSprint) return false;

  // Sprint if target is far (> 3 tiles away)
  return distanceToTarget > 3;
}

/**
 * Check if zombie is intelligent (uses tactics)
 */
export function isIntelligentZombie(unit: SimUnit): boolean {
  const zombified = unit.statusEffects.find(e => e.id === 'zombified');
  return zombified?.metadata?.zombieType === 'intelligent';
}

/**
 * Check if zombie coordinates horde
 */
export function isHordeLeader(unit: SimUnit): boolean {
  const zombified = unit.statusEffects.find(e => e.id === 'zombified');
  return zombified?.metadata?.coordinatesHorde === true;
}

/**
 * Get zombie faction hostility
 * Returns true if zombie should attack this target
 */
export function zombieShouldAttack(
  zombie: SimUnit,
  target: SimUnit
): boolean {
  // Never attack other zombies
  const targetZombified = target.statusEffects.find(e => e.id === 'zombified');
  if (targetZombified) return false;

  // Attack all living
  return target.alive;
}

// ============================================================================
// INFECTION MECHANICS
// ============================================================================

/**
 * Roll for infection on zombie hit
 */
export function rollForInfection(
  attacker: SimUnit,
  defender: SimUnit,
  isCrit: boolean
): StatusEffectInstance | null {
  // Get attacker's infection chance
  const zombified = attacker.statusEffects.find(e => e.id === 'zombified');
  const zombieType = zombified?.metadata?.zombieType as ZombieType | undefined;

  if (!zombieType) return null;

  const config = ZOMBIE_TYPES[zombieType];
  if (!config.infectOnHit) return null;

  // Check if defender is already infected or zombified
  if (defender.statusEffects.some(e => e.id === 'infected' || e.id === 'zombified')) {
    return null;
  }

  // Roll for infection
  const roll = Math.random() * 100;
  const chance = isCrit ? config.infectChance + 20 : config.infectChance;

  if (roll < chance) {
    const severity = isCrit ? 'severe' : 'mild';
    console.log(`[ZOMBIE] ${defender.name} INFECTED (${severity}) by ${attacker.name}`);
    return createInfectedEffect(severity);
  }

  return null;
}

/**
 * Check if infection can be cured
 */
export function canCureInfection(unit: SimUnit): boolean {
  const infected = unit.statusEffects.find(e => e.id === 'infected');
  if (!infected) return false;
  return infected.metadata?.canBeCured === true;
}

/**
 * Cure infection (requires medical item)
 */
export function cureInfection(unit: SimUnit): boolean {
  const index = unit.statusEffects.findIndex(e => e.id === 'infected');
  if (index === -1) return false;

  const infected = unit.statusEffects[index];
  if (!infected.metadata?.canBeCured) {
    console.log(`[ZOMBIE] ${unit.name}'s infection is too severe to cure!`);
    return false;
  }

  unit.statusEffects.splice(index, 1);
  console.log(`[ZOMBIE] ${unit.name}'s infection CURED!`);
  return true;
}

// ============================================================================
// SPAWN HELPERS
// ============================================================================

/**
 * Create a fresh zombie (not from reanimation)
 * For spawning zombie waves in Outbreak mode
 */
export function createZombieUnit(
  id: string,
  name: string,
  type: ZombieType,
  position: { x: number; y: number }
): SimUnit {
  const config = ZOMBIE_TYPES[type];

  // Base stats for spawned zombies
  const baseStats = {
    MEL: 50 + config.statMods.MEL,
    RNG: 30,
    AGL: 50 + config.statMods.AGL,
    CON: 50 + config.statMods.CON,
    INS: 50 + config.statMods.INS,
    WIL: 50 + config.statMods.WIL,
    INT: 50 + config.statMods.INT,
  };

  // Clamp all stats
  Object.keys(baseStats).forEach(key => {
    baseStats[key as keyof typeof baseStats] = clampStat(baseStats[key as keyof typeof baseStats]);
  });

  const hp = type === 'shambler' ? 80 : type === 'sprinter' ? 40 : 60;
  const ap = type === 'shambler' ? 2 : type === 'sprinter' ? 6 : 7;

  return {
    id,
    name: `${config.name} ${name}`,
    team: 'red',

    hp,
    maxHp: hp,
    shieldHp: 0,
    maxShieldHp: 0,

    dr: type === 'shambler' ? 3 : 0,
    stoppingPower: 0,
    origin: 'undead',

    stats: baseStats,
    stance: 'standing',
    cover: 'none',
    statusEffects: [createZombifiedEffect(type)],
    accuracyPenalty: 0,

    weapon: createZombieBite(config),
    disarmed: false,

    position,
    alive: true,
    acted: false,
  };
}

/**
 * Generate a random zombie name
 */
const ZOMBIE_NAMES = [
  'Walker', 'Crawler', 'Lurker', 'Stalker', 'Hunter',
  'Gnasher', 'Biter', 'Clawer', 'Howler', 'Rotting',
  'Bloated', 'Withered', 'Festering', 'Shambling', 'Rabid',
];

export function randomZombieName(): string {
  return ZOMBIE_NAMES[Math.floor(Math.random() * ZOMBIE_NAMES.length)];
}

/**
 * Spawn a random zombie at position
 */
export function spawnRandomZombie(
  position: { x: number; y: number },
  waveNumber: number = 1
): SimUnit {
  // Type distribution changes with wave
  // Early: mostly shamblers
  // Later: more sprinters and intelligents
  const roll = Math.random() * 100;
  let type: ZombieType;

  if (waveNumber <= 2) {
    // Waves 1-2: 80% shambler, 20% sprinter
    type = roll < 80 ? 'shambler' : 'sprinter';
  } else if (waveNumber <= 5) {
    // Waves 3-5: 50% shambler, 40% sprinter, 10% intelligent
    type = roll < 50 ? 'shambler' : roll < 90 ? 'sprinter' : 'intelligent';
  } else {
    // Wave 6+: 30% shambler, 50% sprinter, 20% intelligent
    type = roll < 30 ? 'shambler' : roll < 80 ? 'sprinter' : 'intelligent';
  }

  const id = `zombie_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const name = randomZombieName();

  return createZombieUnit(id, name, type, position);
}
