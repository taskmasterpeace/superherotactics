/**
 * Advanced Combat Mechanics
 *
 * Burst Fire, Aimed Shots, and Overwatch systems.
 * NO Phaser dependencies - pure TypeScript.
 */

import { SimUnit, SimWeapon, AttackResult, HitResult } from './types';
import { resolveAttack, calculateAccuracy, getHitResult, getBaseDamage, applyHitMultiplier, calculateFinalDamage } from './core';

// ============ ATTACK MODES ============

export type AttackMode = 'single' | 'burst' | 'aimed' | 'snapshot';

export interface AttackModeConfig {
  apMultiplier: number;      // Multiplier for AP cost
  accuracyMod: number;       // Flat accuracy modifier
  damageMultiplier: number;  // Damage multiplier
  shots: number;             // Number of shots fired
  description: string;
}

export const ATTACK_MODES: Record<AttackMode, AttackModeConfig> = {
  single: {
    apMultiplier: 1.0,
    accuracyMod: 0,
    damageMultiplier: 1.0,
    shots: 1,
    description: 'Standard single shot',
  },
  burst: {
    apMultiplier: 1.5,       // Costs 50% more AP
    accuracyMod: -15,        // Less accurate per shot
    damageMultiplier: 0.8,   // Less damage per shot
    shots: 3,                // Fire 3 shots
    description: 'Fire 3 shots with reduced accuracy',
  },
  aimed: {
    apMultiplier: 2.0,       // Costs double AP
    accuracyMod: 20,         // Much more accurate
    damageMultiplier: 1.25,  // Slightly more damage (vital hits)
    shots: 1,
    description: 'Careful aimed shot with bonus accuracy',
  },
  snapshot: {
    apMultiplier: 0.5,       // Costs half AP
    accuracyMod: -25,        // Much less accurate
    damageMultiplier: 1.0,
    shots: 1,
    description: 'Quick shot with poor accuracy',
  },
};

// ============ BURST FIRE ============

export interface BurstFireResult {
  shots: AttackResult[];
  totalDamage: number;
  hitsLanded: number;
  apCost: number;
}

/**
 * Resolve a burst fire attack (multiple shots).
 */
export function resolveBurstFire(
  attacker: SimUnit,
  target: SimUnit,
  distance?: number,
  burstSize: number = 3
): BurstFireResult {
  const mode = ATTACK_MODES.burst;
  const shots: AttackResult[] = [];
  let totalDamage = 0;
  let hitsLanded = 0;

  // Each subsequent shot has cumulative recoil penalty
  for (let i = 0; i < burstSize; i++) {
    const recoilPenalty = i * 8;  // Each shot -8% accuracy

    // Create modified attack with burst penalties
    const result = resolveAttackWithMode(attacker, target, distance, {
      accuracyMod: mode.accuracyMod - recoilPenalty,
      damageMultiplier: mode.damageMultiplier,
    });

    shots.push(result);
    totalDamage += result.finalDamage;
    if (result.hitResult !== 'miss') {
      hitsLanded++;
    }

    // Stop if target is dead
    if (result.killed) break;
  }

  return {
    shots,
    totalDamage,
    hitsLanded,
    apCost: Math.ceil(attacker.weapon.apCost * mode.apMultiplier),
  };
}

// ============ AIMED SHOTS ============

export type BodyPart = 'head' | 'torso' | 'arms' | 'legs';

export interface BodyPartTarget {
  accuracyPenalty: number;   // Additional accuracy penalty
  damageMultiplier: number;  // Damage multiplier
  effect: string;            // Special effect description
}

export const BODY_PARTS: Record<BodyPart, BodyPartTarget> = {
  head: {
    accuracyPenalty: -30,    // Hard to hit
    damageMultiplier: 2.0,   // Critical damage
    effect: 'Instant kill on crit, chance to stun',
  },
  torso: {
    accuracyPenalty: 0,      // Center mass
    damageMultiplier: 1.0,   // Standard damage
    effect: 'Normal damage',
  },
  arms: {
    accuracyPenalty: -15,    // Smaller target
    damageMultiplier: 0.8,   // Less vital
    effect: 'Accuracy penalty on hit, chance to disarm',
  },
  legs: {
    accuracyPenalty: -15,    // Smaller target
    damageMultiplier: 0.8,   // Less vital
    effect: 'Movement penalty on hit, chance to prone',
  },
};

export interface AimedShotResult extends AttackResult {
  bodyPart: BodyPart;
  specialEffect?: string;
  apCost: number;
}

/**
 * Resolve an aimed shot at a specific body part.
 */
export function resolveAimedShot(
  attacker: SimUnit,
  target: SimUnit,
  bodyPart: BodyPart,
  distance?: number
): AimedShotResult {
  const mode = ATTACK_MODES.aimed;
  const partConfig = BODY_PARTS[bodyPart];

  const result = resolveAttackWithMode(attacker, target, distance, {
    accuracyMod: mode.accuracyMod + partConfig.accuracyPenalty,
    damageMultiplier: mode.damageMultiplier * partConfig.damageMultiplier,
  });

  // Determine special effects based on hit
  let specialEffect: string | undefined;
  if (result.hitResult === 'crit' || result.hitResult === 'hit') {
    if (bodyPart === 'head' && result.hitResult === 'crit') {
      specialEffect = 'Critical headshot!';
    } else if (bodyPart === 'arms') {
      specialEffect = 'Arm hit - accuracy reduced';
    } else if (bodyPart === 'legs') {
      specialEffect = 'Leg hit - movement impaired';
    }
  }

  return {
    ...result,
    bodyPart,
    specialEffect,
    apCost: Math.ceil(attacker.weapon.apCost * mode.apMultiplier),
  };
}

// ============ OVERWATCH ============

export interface OverwatchState {
  unitId: string;
  apReserved: number;
  triggerZone?: { x: number; y: number; radius: number };
  shotsRemaining: number;
  accuracyMod: number;
}

/**
 * Set a unit on overwatch (reserves AP for reaction fire).
 * INS (Insight) affects reaction accuracy: high INS = less penalty.
 */
export function setOverwatch(
  unit: SimUnit,
  apToReserve: number = 4,
  triggerZone?: { x: number; y: number; radius: number }
): OverwatchState {
  // Max 2 shots in overwatch, each costs 2 AP
  const shotsRemaining = Math.floor(apToReserve / 2);

  // INS OVERWATCH ACCURACY BONUS
  // High INS = better reaction shots. JA2 style: high awareness = faster reaction.
  // Base penalty: -10. Reduced by +1 per 2 INS above 15 (baseline).
  // INS 15 = -10, INS 20 = -7.5, INS 25 = -5, INS 30 = -2.5
  const insightBonus = Math.floor(((unit.stats.INS || 15) - 15) / 2);
  const accuracyMod = -10 + insightBonus;

  return {
    unitId: unit.id,
    apReserved: apToReserve,
    triggerZone,
    shotsRemaining: Math.min(shotsRemaining, 2),
    accuracyMod: Math.min(0, accuracyMod),  // Never positive (overwatch is still reactive)
  };
}

/**
 * Check if a movement triggers overwatch.
 * INS (Insight) affects reaction chance: low INS may "miss" the movement.
 */
export function checkOverwatchTrigger(
  overwatch: OverwatchState,
  overwatcher: SimUnit,
  movingUnit: SimUnit,
  moveFrom: { x: number; y: number },
  moveTo: { x: number; y: number }
): boolean {
  if (overwatch.shotsRemaining <= 0) return false;
  if (overwatcher.team === movingUnit.team) return false;
  if (!overwatcher.alive) return false;

  // INS REACTION CHANCE
  // High INS = more likely to notice and react to movement.
  // Base 70% chance + 2% per INS above 15.
  // INS 15 = 70%, INS 20 = 80%, INS 25 = 90%, INS 30 = 100%
  const insightBonus = Math.max(0, ((overwatcher.stats.INS || 15) - 15) * 2);
  const reactionChance = Math.min(100, 70 + insightBonus);
  const roll = Math.random() * 100;

  if (roll >= reactionChance) {
    // Overwatcher failed to react in time
    return false;
  }

  // Check if movement crosses the trigger zone
  if (overwatch.triggerZone) {
    const { x, y, radius } = overwatch.triggerZone;
    const distTo = Math.sqrt((moveTo.x - x) ** 2 + (moveTo.y - y) ** 2);
    return distTo <= radius;
  }

  // Default: any visible enemy movement triggers
  return true;
}

/**
 * Resolve an overwatch reaction shot.
 */
export function resolveOverwatchShot(
  overwatcher: SimUnit,
  target: SimUnit,
  overwatch: OverwatchState,
  distance?: number
): AttackResult | null {
  if (overwatch.shotsRemaining <= 0) return null;

  // Reaction shots have accuracy penalty
  const result = resolveAttackWithMode(overwatcher, target, distance, {
    accuracyMod: overwatch.accuracyMod,
    damageMultiplier: 1.0,
  });

  return result;
}

// ============ SUPPRESSION ============

export interface SuppressionResult {
  targetId: string;
  suppressed: boolean;
  duration: number;        // Rounds of suppression
  accuracyPenalty: number; // Penalty while suppressed
  movementPenalty: number; // Tiles lost per move action
}

/**
 * Attempt to suppress a target with sustained fire.
 * WIL (Willpower) affects resistance: high WIL = harder to suppress.
 */
export function attemptSuppression(
  attacker: SimUnit,
  target: SimUnit,
  shotsUsed: number = 5
): SuppressionResult {
  // Base suppression chance from volume of fire
  const baseChance = Math.min(80, shotsUsed * 15);

  // WIL SUPPRESSION RESISTANCE
  // High WIL = harder to suppress. JA2 style: veterans don't flinch.
  // Reduces suppression chance by 2% per WIL above 15.
  // WIL 15 = base chance, WIL 20 = -10%, WIL 25 = -20%, WIL 30 = -30%
  const targetWil = target.stats.WIL || 15;
  const wilResistance = Math.max(0, (targetWil - 15) * 2);
  const suppressionChance = Math.max(10, baseChance - wilResistance);

  const roll = Math.random() * 100;
  const suppressed = roll < suppressionChance;

  return {
    targetId: target.id,
    suppressed,
    duration: suppressed ? 2 : 0,  // 2 rounds if successful
    accuracyPenalty: suppressed ? -20 : 0,
    movementPenalty: suppressed ? 2 : 0,  // Lose 2 tiles movement
  };
}

// ============ MORALE / PANIC SYSTEM ============

export type PanicLevel = 'steady' | 'shaken' | 'panicked' | 'broken';

export interface MoraleCheckResult {
  unitId: string;
  previousLevel: PanicLevel;
  newLevel: PanicLevel;
  roll: number;
  target: number;
  passed: boolean;
  effect?: 'flee' | 'hunker' | 'freeze' | 'wild_fire';
}

export type MoraleTrigger =
  | 'ally_killed'      // Saw ally die
  | 'critical_hit'     // Took a critical hit
  | 'health_low'       // HP below 25%
  | 'outnumbered'      // 3+ enemies vs alone
  | 'suppressed';      // Under heavy fire

// Difficulty modifiers for each trigger type
const MORALE_DIFFICULTY: Record<MoraleTrigger, number> = {
  ally_killed: 25,     // +25 to difficulty
  critical_hit: 20,    // +20 to difficulty
  health_low: 15,      // +15 to difficulty
  outnumbered: 20,     // +20 to difficulty
  suppressed: 10,      // +10 to difficulty
};

/**
 * Perform a morale check when a stressful event occurs.
 * WIL (Willpower) is the primary stat for passing morale checks.
 *
 * Check: Roll d100, must beat (50 + difficulty - WIL)
 * - WIL 15 (baseline): Target = 50 + diff - 15 = 35 + diff
 * - WIL 25 (elite): Target = 50 + diff - 25 = 25 + diff
 * - WIL 35 (peak): Target = 50 + diff - 35 = 15 + diff
 */
export function checkMorale(
  unit: SimUnit,
  trigger: MoraleTrigger,
  currentLevel: PanicLevel = 'steady'
): MoraleCheckResult {
  const difficulty = MORALE_DIFFICULTY[trigger];
  const wil = unit.stats.WIL || 15;

  // Target number to beat: base 50 + difficulty - WIL
  const target = Math.max(5, 50 + difficulty - wil);
  const roll = Math.random() * 100;
  const passed = roll >= target;

  // Calculate new panic level
  let newLevel = currentLevel;
  let effect: MoraleCheckResult['effect'];

  if (!passed) {
    // Failed morale check - escalate panic
    switch (currentLevel) {
      case 'steady':
        newLevel = 'shaken';
        break;
      case 'shaken':
        newLevel = 'panicked';
        effect = 'hunker';  // Duck and cover
        break;
      case 'panicked':
        newLevel = 'broken';
        effect = Math.random() < 0.5 ? 'flee' : 'wild_fire';  // Run or shoot wildly
        break;
      case 'broken':
        // Already broken - effect happens
        effect = Math.random() < 0.7 ? 'flee' : 'freeze';
        break;
    }
  }

  return {
    unitId: unit.id,
    previousLevel: currentLevel,
    newLevel,
    roll: Math.floor(roll),
    target,
    passed,
    effect,
  };
}

/**
 * Get combat modifiers for panic level.
 */
export function getPanicModifiers(level: PanicLevel): {
  accuracyMod: number;
  evasionMod: number;
  apMod: number;  // AP cost multiplier
  canAct: boolean;
} {
  switch (level) {
    case 'steady':
      return { accuracyMod: 0, evasionMod: 0, apMod: 1.0, canAct: true };
    case 'shaken':
      return { accuracyMod: -10, evasionMod: -5, apMod: 1.0, canAct: true };
    case 'panicked':
      return { accuracyMod: -25, evasionMod: -15, apMod: 1.5, canAct: true };
    case 'broken':
      return { accuracyMod: -40, evasionMod: -25, apMod: 2.0, canAct: false };  // Cannot choose actions
  }
}

/**
 * Attempt to rally a panicked ally.
 * Uses the rallyer's WIL stat to calm the target.
 */
export function attemptRally(
  rallyer: SimUnit,
  target: SimUnit,
  targetLevel: PanicLevel
): { success: boolean; newLevel: PanicLevel } {
  // Cannot rally steady units or self
  if (targetLevel === 'steady' || rallyer.id === target.id) {
    return { success: false, newLevel: targetLevel };
  }

  // Rally chance based on rallyer's WIL
  // Base 40% + 2% per WIL above 15
  const rallyerWil = rallyer.stats.WIL || 15;
  const rallyChance = 40 + (rallyerWil - 15) * 2;
  const roll = Math.random() * 100;

  if (roll < rallyChance) {
    // Success - reduce panic by one level
    const levelOrder: PanicLevel[] = ['steady', 'shaken', 'panicked', 'broken'];
    const currentIdx = levelOrder.indexOf(targetLevel);
    const newLevel = levelOrder[Math.max(0, currentIdx - 1)];
    return { success: true, newLevel };
  }

  return { success: false, newLevel: targetLevel };
}

// ============ HELPER FUNCTIONS ============

interface AttackModifiers {
  accuracyMod: number;
  damageMultiplier: number;
}

/**
 * Resolve an attack with custom modifiers.
 */
function resolveAttackWithMode(
  attacker: SimUnit,
  target: SimUnit,
  distance: number | undefined,
  modifiers: AttackModifiers
): AttackResult {
  const weapon = attacker.weapon;
  const roll = Math.random() * 100;

  // Calculate base accuracy then apply modifier
  const baseAccuracy = calculateAccuracy(attacker, target, distance);
  const modifiedAccuracy = Math.max(5, Math.min(95, baseAccuracy + modifiers.accuracyMod));

  // Get hit result with modified accuracy
  const hitResult = getHitResult(roll, modifiedAccuracy);

  // Calculate damage with multiplier
  const baseDamage = getBaseDamage(weapon, attacker);
  const modifiedDamage = Math.round(baseDamage * modifiers.damageMultiplier);
  const damageAfterHit = applyHitMultiplier(modifiedDamage, hitResult);

  // Apply damage pipeline
  const damageResult = calculateFinalDamage(
    damageAfterHit,
    weapon.damageType,
    target
  );

  // Calculate HP values
  const targetHpBefore = target.hp;
  const targetShieldBefore = target.shieldHp;
  const targetHpAfter = Math.max(0, target.hp - damageResult.finalDamage);

  return {
    attacker: attacker.id,
    target: target.id,
    weapon: weapon.name,
    roll,
    accuracy: modifiedAccuracy,
    hitResult,
    rawDamage: modifiedDamage,
    critMultiplier: hitResult === 'crit' ? 1.5 : 1,
    originMultiplier: 1,
    shieldAbsorbed: damageResult.shieldAbsorbed,
    armorBlocked: damageResult.armorBlocked,
    drReduced: damageResult.drReduced,
    coverDRBonus: 0,
    finalDamage: damageResult.finalDamage,
    targetHpBefore,
    targetHpAfter,
    targetShieldBefore,
    targetShieldAfter: Math.max(0, targetShieldBefore - damageResult.shieldAbsorbed),
    killed: targetHpAfter <= 0,
    effectsApplied: [],
    knockbackTiles: 0,
    stanceAccuracyMod: 0,
    stanceEvasionMod: 0,
  };
}

// All exports are inline with their declarations above
