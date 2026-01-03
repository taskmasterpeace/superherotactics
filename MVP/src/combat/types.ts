/**
 * Portable Combat Engine - Type Definitions
 *
 * These types are used by both the headless simulator and CombatScene.
 * NO Phaser dependencies - pure TypeScript interfaces.
 */

// ============ FIRE MODE TYPES ============
export type FireMode = 'single' | 'burst' | 'auto';

export interface FireModeConfig {
  mode: FireMode;
  shotsPerAttack: number;      // 1 for single, 3 for burst, 5 for auto
  damagePerShot: number;       // Damage multiplier per shot (1.0 = full, 0.5 = half)
  accuracyPenalty: number;     // 0 for single, -15 for burst, -25 for auto
  apMultiplier: number;        // 1x for single, 1.5x for burst, 2x for auto
  suppressionChance: number;   // 0 for single, 30 for burst, 60 for auto
}

// Fire mode configurations - balance targets from JA2/XCOM:
// - Single: Precise, efficient AP, no suppression (baseline)
// - Burst: Moderate DPS boost, accuracy penalty, some suppression
// - Auto: High DPS, significant penalty, heavy suppression
//
// Balance math (effective DPS multiplier):
// - Single: 1 shot * 1.0 dmg * 70% acc = 0.70 effective
// - Burst:  3 shots * 0.5 dmg * 55% acc = 0.83 effective (1.2x single)
// - Auto:   5 shots * 0.4 dmg * 45% acc = 0.90 effective (1.3x single)
//
// At close range (higher hit %), burst/auto shine.
// At long range, accuracy penalties hurt burst/auto more.
export const FIRE_MODES: Record<FireMode, FireModeConfig> = {
  single: { mode: 'single', shotsPerAttack: 1, damagePerShot: 1.0, accuracyPenalty: 0, apMultiplier: 1, suppressionChance: 0 },
  burst: { mode: 'burst', shotsPerAttack: 3, damagePerShot: 0.5, accuracyPenalty: -15, apMultiplier: 1.5, suppressionChance: 30 },
  auto: { mode: 'auto', shotsPerAttack: 5, damagePerShot: 0.4, accuracyPenalty: -25, apMultiplier: 2, suppressionChance: 60 },
};

// ============ STANCE TYPES ============
export type StanceType = 'normal' | 'aggressive' | 'defensive' | 'overwatch' | 'sneaking';

export interface StanceModifiers {
  accuracyMod: number;
  evasionMod: number;
  apCostMod: number;
}

// BALANCE NOTE: BF-003 - Defensive reduced from +20 to +12 evasion.
// Simulation showed +18% win rate, target is +5-15%.
// Target: each stance should be situationally useful, not always defensive.
export const STANCES: Record<StanceType, StanceModifiers> = {
  normal: { accuracyMod: 0, evasionMod: 0, apCostMod: 0 },
  aggressive: { accuracyMod: 15, evasionMod: -15, apCostMod: 0 },
  defensive: { accuracyMod: -10, evasionMod: 12, apCostMod: 0 },  // Reduced from 20 to 12
  overwatch: { accuracyMod: 10, evasionMod: -10, apCostMod: 0 },
  sneaking: { accuracyMod: -10, evasionMod: 15, apCostMod: 1 },   // Reduced from 20 to 15
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

// ============ COMBAT PHASE TYPES (XCOM2-style concealment) ============
export type CombatPhase = 'exploration' | 'combat';

export interface PhaseConfig {
  phase: CombatPhase;
  movementCostMultiplier: number; // 0 for exploration (free movement), 1 for combat
  turnOrder: boolean;              // false for exploration, true for combat
  enemiesVisible: boolean;         // false until contact/trigger
}

// XCOM2 Concealment System:
// - Exploration: Squad moves freely, no AP cost, no turn order, enemies don't see you
// - Combat: Triggered when enemy spotted, normal AP costs, turn-based
export const PHASE_CONFIGS: Record<CombatPhase, PhaseConfig> = {
  exploration: {
    phase: 'exploration',
    movementCostMultiplier: 0,  // Free movement
    turnOrder: false,            // No turn order during exploration
    enemiesVisible: false,       // Enemies hidden until contact
  },
  combat: {
    phase: 'combat',
    movementCostMultiplier: 1,  // Normal AP cost
    turnOrder: true,             // Turn-based combat
    enemiesVisible: true,        // All enemies revealed
  },
};

// ============ POD ACTIVATION SYSTEM (XCOM2-style encounters) ============
export type PodState = 'inactive' | 'alerted' | 'activated';

export interface EnemyPod {
  id: string;
  unitIds: string[];               // IDs of units in this pod
  state: PodState;
  patrolPath?: { x: number; y: number }[];  // Optional patrol route
  patrolIndex?: number;            // Current position on patrol
  alertedBy?: string;              // ID of unit that alerted this pod
  activationTurn?: number;         // Turn number when activated
}

export interface PodActivationResult {
  podId: string;
  previousState: PodState;
  newState: PodState;
  unitsRevealed: string[];         // Unit IDs now visible
  scatterPositions?: { unitId: string; position: { x: number; y: number } }[];
}

// Pod behavior configuration
export const POD_CONFIG = {
  // Inactive pods patrol slowly, not looking for player
  inactiveVisionRange: 8,          // Limited awareness
  inactiveMovementPerTurn: 2,      // Slow patrol

  // Alerted pods are suspicious but haven't spotted player
  alertedVisionRange: 12,          // Heightened awareness
  alertedMovementPerTurn: 4,       // Moving to investigate

  // Activated pods are in combat
  activatedVisionRange: 15,        // Full awareness
  scatterDistance: 3,              // Max distance to scatter to cover

  // Activation rules
  alertOtherPodsRadius: 10,        // Gunfire alerts pods within this range
  freeActionsOnActivation: 1,      // Free actions when pod activates
};

// ============ COMBAT BOND SYSTEM (XCOM2-style soldier bonds) ============
export type BondLevel = 0 | 1 | 2 | 3;
export type MBTICompatibility = 'excellent' | 'good' | 'neutral' | 'poor';

export interface CombatBond {
  unitId1: string;
  unitId2: string;
  bondLevel: BondLevel;
  missionsTogether: number;     // Missions fought side by side
  compatibility: MBTICompatibility;
  xpToNextLevel: number;        // XP needed for next bond level
}

export interface BondBonuses {
  accuracyBonus: number;        // When adjacent to bonded ally
  evasionBonus: number;         // When near bonded ally
  willBonus: number;            // Morale boost from bond
  actionBonus: boolean;         // Level 3: Free action to aid bonded ally
}

// Bond progression thresholds
export const BOND_THRESHOLDS = {
  level1: 3,   // 3 missions together
  level2: 8,   // 8 missions together
  level3: 15,  // 15 missions together
};

// Bond level bonuses
export const BOND_LEVEL_BONUSES: Record<BondLevel, BondBonuses> = {
  0: { accuracyBonus: 0, evasionBonus: 0, willBonus: 0, actionBonus: false },
  1: { accuracyBonus: 5, evasionBonus: 0, willBonus: 2, actionBonus: false },
  2: { accuracyBonus: 10, evasionBonus: 5, willBonus: 5, actionBonus: false },
  3: { accuracyBonus: 15, evasionBonus: 10, willBonus: 10, actionBonus: true },
};

// MBTI compatibility affects bond formation speed
export const MBTI_COMPATIBILITY_MULTIPLIER: Record<MBTICompatibility, number> = {
  excellent: 1.5,  // Bonds form 50% faster
  good: 1.2,       // Bonds form 20% faster
  neutral: 1.0,    // Normal rate
  poor: 0.5,       // Bonds form 50% slower
};

// MBTI compatibility matrix (function dimensions)
// Same cognitive function stack = excellent
// Similar temperament = good
// Different but complementary = neutral
// Conflicting = poor
export const MBTI_COMPATIBILITY_RULES: Record<string, MBTICompatibility> = {
  // SAME TYPE = excellent (understand each other perfectly)
  'same': 'excellent',

  // COGNITIVE MATCHES (share dominant function, opposite direction)
  // Example: INTJ (Ni-Te) + INFJ (Ni-Fe) - both Ni dominant
  'INTJ_INFJ': 'excellent', 'INTJ_ENTJ': 'excellent', 'INTJ_ENFJ': 'good',
  'INTP_INFP': 'excellent', 'INTP_ENTP': 'excellent', 'INTP_ENFP': 'good',
  'ENFJ_ENTJ': 'excellent', 'ENFJ_INFJ': 'excellent', 'ENFJ_INTJ': 'good',
  'ENFP_ENTP': 'excellent', 'ENFP_INFP': 'excellent', 'ENFP_INTP': 'good',

  // GUARDIAN BONDS (SJ types work well together)
  'ISTJ_ISFJ': 'excellent', 'ISTJ_ESTJ': 'excellent', 'ISTJ_ESFJ': 'good',
  'ISFJ_ESFJ': 'excellent', 'ISFJ_ESTJ': 'good',
  'ESTJ_ESFJ': 'excellent',

  // EXPLORER BONDS (SP types understand action)
  'ISTP_ESTP': 'excellent', 'ISTP_ISFP': 'good', 'ISTP_ESFP': 'good',
  'ESTP_ESFP': 'excellent', 'ESTP_ISTP': 'excellent',
  'ISFP_ESFP': 'excellent', 'ISFP_ISTP': 'good',

  // OPPOSITES (can clash)
  'INTJ_ESFP': 'poor', 'INTP_ESFJ': 'poor', 'ENTJ_ISFP': 'poor', 'ENTP_ISFJ': 'poor',
  'INFJ_ESTP': 'poor', 'INFP_ESTJ': 'poor', 'ENFJ_ISTP': 'poor', 'ENFP_ISTJ': 'poor',
};

// ============ ORIGIN TYPES ============
export type OriginType = 'biological' | 'robotic' | 'energy' | 'undead' | 'construct';

// ============ HIT RESULTS ============
export type HitResult = 'miss' | 'graze' | 'hit' | 'crit';

// ============ GRAPPLE STATE ============
// Matches GrappleState enum in EventBridge.ts
export type GrappleStateType =
  | 'none'        // Not in any grapple
  | 'standing'    // Both standing, in clinch
  | 'ground'      // Both on ground
  | 'pinned'      // Target is pinned
  | 'restrained'  // Target fully restrained
  | 'carried'     // Target being carried
  | 'submission'; // In a submission hold

// ============ STATUS EFFECTS ============
export type StatusEffectId =
  | 'burning' | 'bleeding' | 'frozen' | 'stunned' | 'poisoned'
  | 'prone' | 'exposed' | 'suppressed' | 'inspired' | 'shielded'
  // Martial arts effects
  | 'arm_injured' | 'choked' | 'disoriented' | 'drained'
  | 'internal_bleeding' | 'crippled' | 'blinded' | 'slowed'
  | 'silenced' | 'immobilized' | 'staggered' | 'disarmed'
  // Grappling effects
  | 'grappled';

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
  evasionPenalty?: number;    // Reduces evasion (positive = easier to hit)
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
  // Light attack property - if true, attack uses 1 action but doesn't end turn
  // Allows combos like: jab + cross, knife stab + move away
  isLightAttack?: boolean;
  // Fire mode support - for weapons capable of burst/auto fire
  availableFireModes?: FireMode[];  // e.g., ['single', 'burst'] for SMG
  currentFireMode?: FireMode;       // Currently selected mode
}

// ============ ARMOR TYPES (Simplified from armor.ts) ============
export interface SimArmor {
  id: string;
  name: string;
  category: 'Light' | 'Medium' | 'Heavy' | 'Power' | 'Shield' | 'Natural';

  // Damage Reduction by type
  drPhysical: number;     // Reduces physical damage (bullets, blades)
  drEnergy: number;       // Reduces energy damage (lasers, plasma)
  drMental: number;       // Reduces mental damage (psychic)

  // Ballistic Protection
  stoppingPower: number;  // Blocks damage entirely if damage <= SP
  caliberRating: 'none' | 'pistol' | 'smg' | 'rifle' | 'ap' | 'heavy';

  // Coverage & Condition
  coverage: 'Torso' | 'Full Body' | 'Arms' | 'Legs' | 'Head' | 'Hands' | 'Accessory';
  condition: number;      // Current condition
  conditionMax: number;   // Max durability

  // Penalties
  movementPenalty: number;  // Tiles per turn reduction
  stealthPenalty: number;   // Noise level increase

  // Shield-specific
  shieldHp?: number;         // For energy shields
  shieldRegenRate?: number;  // HP restored per turn
  shieldRegenDelay?: number; // Turns after damage before regen starts
}

/**
 * Calculate effective DR and stopping power from equipped armor.
 * Used to populate SimUnit.dr and SimUnit.stoppingPower.
 */
export function calculateArmorProtection(armor: SimArmor | undefined): {
  dr: number;
  stoppingPower: number;
  shieldHp: number;
} {
  if (!armor) {
    return { dr: 0, stoppingPower: 0, shieldHp: 0 };
  }

  return {
    dr: armor.drPhysical,  // Use physical DR as base
    stoppingPower: armor.stoppingPower,
    shieldHp: armor.shieldHp || 0,
  };
}

// Common armor presets for quick unit creation
export const ARMOR_PRESETS: Record<string, SimArmor> = {
  none: {
    id: 'NONE', name: 'Unarmored', category: 'Light',
    drPhysical: 0, drEnergy: 0, drMental: 0,
    stoppingPower: 0, caliberRating: 'none',
    coverage: 'Torso', condition: 100, conditionMax: 100,
    movementPenalty: 0, stealthPenalty: 0,
  },
  leatherJacket: {
    id: 'ARM_LGT_001', name: 'Leather Jacket', category: 'Light',
    drPhysical: 3, drEnergy: 0, drMental: 0,
    stoppingPower: 0, caliberRating: 'none',
    coverage: 'Torso', condition: 20, conditionMax: 20,
    movementPenalty: 0, stealthPenalty: 0,
  },
  kevlarVest: {
    id: 'ARM_LGT_002', name: 'Kevlar Vest', category: 'Light',
    drPhysical: 8, drEnergy: 0, drMental: 0,
    stoppingPower: 28, caliberRating: 'pistol',
    coverage: 'Torso', condition: 40, conditionMax: 40,
    movementPenalty: 0, stealthPenalty: 0,
  },
  tacticalVest: {
    id: 'ARM_MED_001', name: 'Tactical Vest', category: 'Medium',
    drPhysical: 12, drEnergy: 2, drMental: 0,
    stoppingPower: 35, caliberRating: 'smg',
    coverage: 'Torso', condition: 60, conditionMax: 60,
    movementPenalty: 1, stealthPenalty: 1,
  },
  militaryPlate: {
    id: 'ARM_HVY_001', name: 'Military Plate Carrier', category: 'Heavy',
    drPhysical: 18, drEnergy: 5, drMental: 0,
    stoppingPower: 48, caliberRating: 'rifle',
    coverage: 'Torso', condition: 80, conditionMax: 80,
    movementPenalty: 2, stealthPenalty: 2,
  },
  powerArmorMk1: {
    id: 'ARM_PWR_001', name: 'Power Armor Mk1', category: 'Power',
    drPhysical: 25, drEnergy: 15, drMental: 5,
    stoppingPower: 55, caliberRating: 'ap',
    coverage: 'Full Body', condition: 150, conditionMax: 150,
    movementPenalty: 0, stealthPenalty: 3,  // Power-assisted, no move penalty
  },
  forceShield: {
    id: 'ARM_SHD_005', name: 'Force Shield Generator', category: 'Shield',
    drPhysical: 0, drEnergy: 0, drMental: 0,
    stoppingPower: 0, caliberRating: 'none',
    coverage: 'Accessory', condition: 100, conditionMax: 100,
    movementPenalty: 0, stealthPenalty: 0,
    shieldHp: 50, shieldRegenRate: 5, shieldRegenDelay: 2,
  },
};

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

// ============ NIGHT COMBAT MODIFIERS ============

/**
 * Night combat reduces vision range unless unit has night vision.
 * Flares restore vision in a radius temporarily.
 */
export const NIGHT_COMBAT = {
  // Vision reduction at night (multiplier)
  visionMultiplier: 0.4,        // 40% of normal range (15 -> 6 tiles)
  nightVisionMultiplier: 0.8,   // Night vision: 80% of normal (15 -> 12 tiles)

  // Flare illumination
  flareRadius: 8,               // Tiles illuminated
  flareDuration: 3,             // Combat turns

  // Accuracy penalties at night
  accuracyPenalty: -20,         // -20% accuracy without night vision
  nightVisionPenalty: -5,       // -5% even with night vision (not perfect)

  // Detection
  muzzleFlashDetectionRange: 15, // Gunfire reveals position
  noiseAlertRange: 10,           // Sound detection range
};

/**
 * Get effective vision range considering night conditions.
 */
export function getEffectiveVisionRange(
  baseRange: number,
  isNight: boolean,
  hasNightVision: boolean = false,
  isInFlareRadius: boolean = false
): number {
  if (!isNight || isInFlareRadius) {
    return baseRange;
  }

  const multiplier = hasNightVision
    ? NIGHT_COMBAT.nightVisionMultiplier
    : NIGHT_COMBAT.visionMultiplier;

  return Math.round(baseRange * multiplier);
}

/**
 * Get accuracy modifier for night conditions.
 */
export function getNightAccuracyMod(
  isNight: boolean,
  hasNightVision: boolean = false,
  isInFlareRadius: boolean = false
): number {
  if (!isNight || isInFlareRadius) {
    return 0;
  }

  return hasNightVision
    ? NIGHT_COMBAT.nightVisionPenalty
    : NIGHT_COMBAT.accuracyPenalty;
}

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
  // 7-stat system matching character sheet
  stats: {
    MEL: number;  // Melee - close combat damage & defense
    RNG: number;  // Ranged - shooting accuracy bonus
    AGL: number;  // Agility - dodge, initiative, movement
    CON: number;  // Constitution - HP pool, stamina
    INS: number;  // Insight - interrupts, overwatch, awareness
    WIL: number;  // Willpower - morale, panic resistance
    INT: number;  // Intelligence - tactical options, hacking
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
  armor?: SimArmor;           // Equipped armor (optional)

  // Martial Arts
  beltLevel?: number;         // 1-10 belt level for accuracy bonus (+1 to +10)
  martialArtsStyle?: string;  // Style name for technique selection
  grappleState?: GrappleStateType;  // Current grapple state (none by default)
  grapplePartner?: string;    // ID of unit in grapple with (if any)

  // Position (optional, for grid-based combat)
  position?: { x: number; y: number };

  // Tracking
  alive: boolean;
  acted: boolean;

  // XCOM-style action system (optional, for new 2-action system)
  turnState?: TurnState;

  // Shield regeneration tracking
  shieldRegenDelayRemaining?: number;  // Turns until shield can regen

  // Night combat
  hasNightVision?: boolean;  // Unit has night vision equipment

  // Morale/Panic system
  panicLevel?: 'steady' | 'shaken' | 'panicked' | 'broken';
}

// ============ SHIELD REGENERATION ============

/**
 * Process shield regeneration for a unit at the start of their turn.
 * Shields regen after a delay (turns since last damage).
 *
 * @param unit - Unit to process
 * @returns Amount of shield HP regenerated
 */
export function processShieldRegen(unit: SimUnit): number {
  // No armor with shields = no regen
  if (!unit.armor?.shieldHp || unit.maxShieldHp <= 0) {
    return 0;
  }

  // Already at max shields
  if (unit.shieldHp >= unit.maxShieldHp) {
    return 0;
  }

  // Check delay
  const delayRemaining = unit.shieldRegenDelayRemaining ?? 0;
  if (delayRemaining > 0) {
    unit.shieldRegenDelayRemaining = delayRemaining - 1;
    return 0;
  }

  // Regenerate shields
  const regenRate = unit.armor.shieldRegenRate ?? 5;
  const oldShield = unit.shieldHp;
  unit.shieldHp = Math.min(unit.maxShieldHp, unit.shieldHp + regenRate);

  return unit.shieldHp - oldShield;
}

/**
 * Call this when unit takes damage to reset shield regen delay.
 */
export function resetShieldRegenDelay(unit: SimUnit): void {
  if (unit.armor?.shieldRegenDelay) {
    unit.shieldRegenDelayRemaining = unit.armor.shieldRegenDelay;
  }
}

// ============ GRENADE TYPES ============
export interface SimGrenade {
  id: string;
  name: string;
  damageAtCenter: number;
  blastRadius: number;
  damageFalloff: 'linear' | 'quadratic';
  statusEffects: StatusEffectId[];
  knockbackForce: number;
  maxRange: number;
  // Night combat - flares illuminate area
  illuminates?: boolean;        // True if provides light (flares)
  illuminationRadius?: number;  // Radius of illumination (uses NIGHT_COMBAT.flareRadius if not set)
  illuminationDuration?: number; // Turns of illumination (uses NIGHT_COMBAT.flareDuration if not set)
}

// Grenade definitions for the headless simulator
export const GRENADES: Record<string, SimGrenade> = {
  FRAG: {
    id: 'FRAG',
    name: 'Frag Grenade',
    damageAtCenter: 50,
    blastRadius: 3,
    damageFalloff: 'linear',
    statusEffects: ['bleeding'],
    knockbackForce: 160,
    maxRange: 12,
  },
  CONCUSSION: {
    id: 'CONCUSSION',
    name: 'Concussion Grenade',
    damageAtCenter: 35,
    blastRadius: 4,
    damageFalloff: 'quadratic',
    statusEffects: ['stunned'],
    knockbackForce: 200,
    maxRange: 12,
  },
  FLASHBANG: {
    id: 'FLASHBANG',
    name: 'Flashbang',
    damageAtCenter: 5,
    blastRadius: 5,
    damageFalloff: 'quadratic',
    statusEffects: ['stunned'],
    knockbackForce: 80,
    maxRange: 15,
  },
  INCENDIARY: {
    id: 'INCENDIARY',
    name: 'Incendiary Grenade',
    damageAtCenter: 30,
    blastRadius: 2,
    damageFalloff: 'linear',
    statusEffects: ['burning'],
    knockbackForce: 160,
    maxRange: 12,
  },
  SMOKE: {
    id: 'SMOKE',
    name: 'Smoke Grenade',
    damageAtCenter: 0,
    blastRadius: 4,
    damageFalloff: 'linear',
    statusEffects: [],
    knockbackForce: 0,
    maxRange: 15,
  },
  FLARE: {
    id: 'FLARE',
    name: 'Flare',
    damageAtCenter: 5,            // Minor burn damage
    blastRadius: 1,               // Small impact area
    damageFalloff: 'linear',
    statusEffects: [],
    knockbackForce: 0,
    maxRange: 20,                 // Can be thrown far
    illuminates: true,            // Provides light!
    illuminationRadius: NIGHT_COMBAT.flareRadius,     // 8 tiles
    illuminationDuration: NIGHT_COMBAT.flareDuration, // 3 turns
  },
};

// Grenade explosion result
export interface GrenadeExplosionResult {
  grenadeId: string;
  centerPosition: { x: number; y: number };
  victims: Array<{
    unitId: string;
    distance: number;
    damage: number;
    knockbackTiles: number;
    effectsApplied: StatusEffectId[];
  }>;
  tilesAffected: number;
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

  // Combat tracking
  round?: number;  // Combat round this attack occurred in
  turn?: number;   // Turn number within the battle
}

// ============ BATTLE CONFIGURATION ============
export interface BattleConfig {
  maxRounds: number;
  maxTurnsPerRound: number;
  allowDraw: boolean;      // If true, draw after maxRounds
  includeRange: boolean;   // If false, use optimal range for all attacks
  includeMovement: boolean;// If false, skip movement phase
  apPerRound: number;      // AP budget per unit per round (default 4)
  seed?: number;           // For deterministic battles
}

export const DEFAULT_BATTLE_CONFIG: BattleConfig = {
  maxRounds: 50,
  maxTurnsPerRound: 100,
  allowDraw: true,
  includeRange: false,  // Instant Combat skips range
  includeMovement: false,
  apPerRound: 8,        // Each unit gets 8 AP per round (scaled up for granularity)
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

// ============ ACTION SYSTEM (XCOM-STYLE) ============
// Replaces AP-based system with 2-action turn structure

export type ActionType = 'move' | 'attack' | 'reload' | 'overwatch' | 'use_item' | 'dash';

export interface TurnState {
  actionsRemaining: 2 | 1 | 0;
  hasMoved: boolean;
  hasAttacked: boolean;  // Attacking ends turn immediately
  isDashing: boolean;    // Using both actions for movement
  isOnOverwatch: boolean;
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

// 7-stat baseline profiles
// MEL = Melee combat, RNG = Ranged accuracy, AGL = Agility/dodge
// CON = Constitution (HP), INS = Insight (interrupts), WIL = Willpower, INT = Intelligence
export const HUMAN_BASELINE_STATS = {
  average: { MEL: 15, RNG: 15, AGL: 15, CON: 15, INS: 15, WIL: 15, INT: 15 },
  trained: { MEL: 20, RNG: 20, AGL: 20, CON: 20, INS: 20, WIL: 20, INT: 20 },
  elite: { MEL: 25, RNG: 25, AGL: 25, CON: 25, INS: 25, WIL: 25, INT: 25 },
  peak: { MEL: 35, RNG: 35, AGL: 35, CON: 35, INS: 35, WIL: 35, INT: 35 },
};

// HP calculation: CON is primary, AGL and WIL provide minor bonus
export function calculateHP(stats: SimUnit['stats']): number {
  // CON is the main HP stat (like JA2's Health)
  // Base 50 HP + 2 per CON point + minor bonuses from AGL/WIL
  const conBonus = (stats.CON || 15) * 2;
  const aglBonus = Math.floor((stats.AGL || 15) / 5);
  const wilBonus = Math.floor((stats.WIL || 15) / 5);
  return 50 + conBonus + aglBonus + wilBonus;
}
