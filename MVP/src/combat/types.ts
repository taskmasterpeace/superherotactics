/**
 * Portable Combat Engine - Type Definitions
 *
 * These types are used by both the headless simulator and CombatScene.
 * NO Phaser dependencies - pure TypeScript interfaces.
 */

// ============ STANCE TYPES ============
export type StanceType = 'normal' | 'aggressive' | 'defensive' | 'overwatch' | 'sneaking';

export interface StanceModifiers {
  accuracyMod: number;
  evasionMod: number;
  apCostMod: number;
}

// BALANCE NOTE: Defensive reduced from +25 to +20 evasion after 78% win rate vs normal.
// Target: each stance should be situationally useful, not always defensive.
export const STANCES: Record<StanceType, StanceModifiers> = {
  normal: { accuracyMod: 0, evasionMod: 0, apCostMod: 0 },
  aggressive: { accuracyMod: 15, evasionMod: -15, apCostMod: 0 },
  defensive: { accuracyMod: -15, evasionMod: 20, apCostMod: 0 },  // Was 25
  overwatch: { accuracyMod: 10, evasionMod: -10, apCostMod: 0 },
  sneaking: { accuracyMod: -10, evasionMod: 20, apCostMod: 1 },
};

// ============ COVER TYPES ============
export type CoverType = 'none' | 'half' | 'full';

export interface CoverBonus {
  evasionBonus: number;
  drBonus: number;
  accuracyPenalty: number;  // Penalty when shooting FROM cover (peeking)
}

// BALANCE NOTE: Iterative tuning for JA2 targets (60-65% half, 70-75% full).
// v1: 25/50 evasion → 98% win rate (broken)
// v2: 15/35 evasion + peek penalty -5/-10 → 82% half, 100% full
// v3: 10/25 evasion + peek penalty -10/-15 → 61% half, 94% full
// v4: 10/15 evasion + peek penalty -10/-15 → 56% half, 81% full
// v5: 12/18 evasion + peek penalty -8/-12 → 72% half, 92% full (too strong)
// v6: 8/15 evasion + DR 2/4 + peek -10/-18 → 79% half, 96% full (DR too strong)
// v7: 8/15 evasion + DR 0/1 + peek -8/-12 → 51% half, 68% full (half too weak)
// v9: Full cover DR was too strong, removed it
// Half cover 66% (target 60-65%) - close enough
// Full cover 84.5% (target 70-75%) - DR making it too strong
export const COVER_BONUSES: Record<CoverType, CoverBonus> = {
  none: { evasionBonus: 0, drBonus: 0, accuracyPenalty: 0 },
  half: { evasionBonus: 12, drBonus: 0, accuracyPenalty: -6 },  // Net: +6 eva advantage → ~66%
  full: { evasionBonus: 16, drBonus: 0, accuracyPenalty: -8 },  // Net: +8 eva advantage, no DR
};

// ============ ORIGIN TYPES ============
export type OriginType = 'biological' | 'robotic' | 'energy' | 'undead' | 'construct';

// ============ HIT RESULTS ============
export type HitResult = 'miss' | 'graze' | 'hit' | 'crit';

// ============ STATUS EFFECTS ============
export type StatusEffectId =
  | 'burning' | 'bleeding' | 'frozen' | 'stunned' | 'poisoned'
  | 'prone' | 'exposed' | 'suppressed' | 'inspired' | 'shielded';

export type EffectScaling = 'constant' | 'increasing' | 'decreasing';

export interface StatusEffectInstance {
  id: StatusEffectId;
  duration: number;
  stacks?: number;
  // Damage over time
  damagePerTick?: number;
  scaling?: EffectScaling;
  damageChange?: number;  // +/- per turn for increasing/decreasing
  // Penalties
  apPenalty?: number;
  accuracyPenalty?: number;
  movementPenalty?: boolean;
  // Special behaviors
  skipTurn?: boolean;      // Stun skip turn
  savingThrow?: boolean;   // Can resist with STA check
  canShatter?: boolean;    // Frozen can shatter
  shatterDamage?: number;
  spreadChance?: number;   // Burning spread %
  damagesArmor?: boolean;
  // Tracking
  source?: string;         // Damage type that caused it
  maxStacks?: number;
}

// ============ STATUS EFFECT RESULT ============
export interface StatusProcessingResult {
  unitId: string;
  damageDealt: number;
  effectsExpired: StatusEffectId[];
  turnSkipped: boolean;
  newEffects?: StatusEffectInstance[];  // From spread, etc.
}

// ============ WEAPON TYPES ============
export interface SimWeapon {
  name: string;
  damage: number;
  accuracy: number;
  damageType: string;  // Maps to damageSystem.ts types
  range: number;
  apCost: number;
  knockbackForce?: number;
  rangeBrackets?: {
    pointBlank: number;
    pointBlankMod: number;
    short: number;
    shortMod: number;
    optimal: number;
    optimalMod: number;
    long: number;
    longMod: number;
    max: number;
    extremeMod: number;
  };
  // Special properties for martial arts
  special?: {
    disarmBonus?: number;      // % bonus to disarm chance (nunchucks +25)
    knockdownChance?: number;  // % chance to knock down (staff +30)
    blockBonus?: number;       // Evasion bonus when defensive (tonfa +15)
    bladeTrapping?: boolean;   // Can catch blades (sai)
  };
}

// ============ DISARM TYPES ============
export interface DisarmResult {
  success: boolean;
  roll: number;
  chance: number;
  attackerSTR: number;
  defenderSTR: number;
  weaponBonus: number;
  droppedWeapon?: SimWeapon;
}

// ============ VISION & FACING ============
export interface VisionCone {
  facing: number;      // Direction facing in degrees (0=right, 90=up, 180=left, 270=down)
  angle: number;       // Field of view in degrees (120=human, 180=enhanced, 360=superhuman)
  range: number;       // How far they can see (tiles)
}

// Flanking result based on attack angle relative to target's facing
export type FlankingResult = 'front' | 'side' | 'rear' | 'blindspot';

// Flanking bonuses to accuracy
export const FLANKING_BONUSES: Record<FlankingResult, number> = {
  front: 0,       // Normal attack
  side: 10,       // Side attack: +10% accuracy
  rear: 25,       // Rear attack: +25% accuracy (flanking)
  blindspot: 40,  // Outside vision cone: +40% accuracy + no reaction
};

// Default vision for different unit types
export const DEFAULT_VISION = {
  human: { angle: 120, range: 15 },      // 120° FoV, 15 tiles
  enhanced: { angle: 180, range: 20 },   // Half-circle, 20 tiles
  superhuman: { angle: 360, range: 30 }, // Full circle (eyes everywhere)
  robot: { angle: 270, range: 25 },      // Nearly full, sensors
};

// ============ UNIT TYPES ============
export interface SimUnit {
  id: string;
  name: string;
  team: 'blue' | 'red';

  // Health
  hp: number;
  maxHp: number;
  shieldHp: number;
  maxShieldHp: number;

  // Defense
  dr: number;            // Damage reduction from armor
  stoppingPower: number; // Blocks damage entirely if damage <= SP
  origin: OriginType;

  // Stats (human baseline ~15, soldier ~20, elite ~25)
  stats: {
    MEL: number;  // Melee/strength for damage
    AGL: number;  // Agility for initiative and hit chance
    STR: number;  // Strength for knockback resistance
    STA: number;  // Stamina for HP
  };

  // Vision & Facing
  vision?: VisionCone;  // If undefined, uses human defaults

  // Combat modifiers
  stance: StanceType;
  cover: CoverType;
  statusEffects: StatusEffectInstance[];
  accuracyPenalty: number;  // From injuries, status effects

  // Equipment
  weapon: SimWeapon;
  originalWeapon?: SimWeapon;  // Stored when disarmed
  disarmed: boolean;

  // Position (optional, for grid-based combat)
  position?: { x: number; y: number };

  // Tracking
  alive: boolean;
  acted: boolean;
}

// Default fist weapon for disarmed units
export const FIST_WEAPON: SimWeapon = {
  name: 'Fist',
  damage: 8,
  accuracy: 85,
  damageType: 'IMPACT_BLUNT',
  range: 1,
  apCost: 1,
};

// ============ ATTACK RESULTS ============
export interface AttackResult {
  attacker: string;      // Unit ID
  target: string;        // Unit ID
  weapon: string;        // Weapon name

  // Hit calculation
  roll: number;          // 0-100 roll
  accuracy: number;      // Final calculated accuracy
  hitResult: HitResult;

  // Damage breakdown
  rawDamage: number;     // Base weapon damage
  critMultiplier: number;
  originMultiplier: number;
  shieldAbsorbed: number;
  armorBlocked: number;
  drReduced: number;
  coverDRBonus: number;
  finalDamage: number;

  // Target state after
  targetHpBefore: number;
  targetHpAfter: number;
  targetShieldBefore: number;
  targetShieldAfter: number;
  killed: boolean;

  // Effects applied
  effectsApplied: StatusEffectId[];
  knockbackTiles: number;

  // Modifiers used
  stanceAccuracyMod: number;
  stanceEvasionMod: number;
  rangeBracket?: string;
  distance?: number;

  // Flanking
  flanking?: FlankingResult;
  flankingBonus?: number;

  // Internal: full status effect instances for application
  _statusEffects?: StatusEffectInstance[];
}

// ============ BATTLE CONFIGURATION ============
export interface BattleConfig {
  maxRounds: number;
  maxTurnsPerRound: number;
  allowDraw: boolean;      // If true, draw after maxRounds
  includeRange: boolean;   // If false, use optimal range for all attacks
  includeMovement: boolean;// If false, skip movement phase
  seed?: number;           // For deterministic battles
}

export const DEFAULT_BATTLE_CONFIG: BattleConfig = {
  maxRounds: 50,
  maxTurnsPerRound: 100,
  allowDraw: true,
  includeRange: false,  // Instant Combat skips range
  includeMovement: false,
  seed: undefined,
};

// ============ BATTLE RESULTS ============
export interface BattleResult {
  winner: 'blue' | 'red' | 'draw';
  rounds: number;
  totalTurns: number;

  // Casualties
  blueUnitsStart: number;
  blueSurvivors: number;
  blueDeaths: string[];
  redUnitsStart: number;
  redSurvivors: number;
  redDeaths: string[];

  // Damage stats
  blueDamageDealt: number;
  redDamageDealt: number;

  // Combat log
  log: AttackResult[];

  // Duration for benchmarking
  durationMs: number;
}

// ============ BATCH TESTING ============
export interface BatchResult {
  totalFights: number;
  blueWins: number;
  redWins: number;
  draws: number;

  // Win rates
  blueWinRate: number;
  redWinRate: number;
  drawRate: number;

  // Averages
  avgRounds: number;
  avgBlueDeaths: number;
  avgRedDeaths: number;
  avgBlueDamage: number;
  avgRedDamage: number;

  // Weapon effectiveness
  weaponStats: Record<string, {
    shots: number;
    hits: number;
    crits: number;
    totalDamage: number;
    kills: number;
    hitRate: number;
    avgDamage: number;
  }>;

  // Performance
  totalDurationMs: number;
  fightsPerSecond: number;
}

// ============ HUMAN PRESETS ============
export interface UnitPreset {
  name: string;
  description: string;
  stats: SimUnit['stats'];
  hp: number;
  dr: number;
  stoppingPower: number;
  weapon: SimWeapon;
}

// Standard human baseline stats
export const HUMAN_BASELINE_STATS = {
  average: { MEL: 15, AGL: 15, STR: 15, STA: 15 },
  trained: { MEL: 20, AGL: 20, STR: 20, STA: 20 },
  elite: { MEL: 25, AGL: 25, STR: 25, STA: 25 },
  peak: { MEL: 35, AGL: 35, STR: 35, STA: 35 },
};

// HP calculation: MEL + AGL + STA + STR
export function calculateHP(stats: SimUnit['stats']): number {
  return stats.MEL + stats.AGL + stats.STA + stats.STR;
}
