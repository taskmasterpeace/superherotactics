/**
 * Portable Combat Engine - Core Functions
 *
 * Pure functions for combat calculations.
 * NO Phaser dependencies - used by both simulator and CombatScene.
 *
 * Performance target: 1000 battles in < 1 second
 */

import {
  SimUnit,
  SimWeapon,
  AttackResult,
  HitResult,
  StatusEffectId,
  StatusEffectInstance,
  StanceType,
  CoverType,
  OriginType,
  DisarmResult,
  FlankingResult,
  VisionCone,
  SimGrenade,
  GrenadeExplosionResult,
  TurnState,
  ActionType,
  FireMode,
  FireModeConfig,
  CombatPhase,
  EnemyPod,
  PodActivationResult,
  CombatBond,
  BondBonuses,
  BondLevel,
  MBTICompatibility,
  STANCES,
  COVER_BONUSES,
  FIST_WEAPON,
  FLANKING_BONUSES,
  DEFAULT_VISION,
  GRENADES as SIM_GRENADES,
  FIRE_MODES,
  PHASE_CONFIGS,
  POD_CONFIG,
  BOND_THRESHOLDS,
  BOND_LEVEL_BONUSES,
  MBTI_COMPATIBILITY_MULTIPLIER,
  MBTI_COMPATIBILITY_RULES,
  resetShieldRegenDelay,
  getNightAccuracyMod,
  getEffectiveVisionRange,
  NIGHT_COMBAT,
} from './types';

import {
  getDamageType,
  calculateOriginDamage,
  calculateArmoredDamage,
  DamageSubType,
} from '../data/damageSystem';

import {
  getStatusEffectsForDamage,
  applyStatusEffects,
  getAccuracyPenalty,
} from './statusEffects';

import {
  getPanicModifiers,
  checkMorale,
  MoraleCheckResult,
  MoraleTrigger,
  PanicLevel,
} from './advancedMechanics';

import { calculateKnockback } from '../data/knockbackSystem';

// ============ DISTANCE CALCULATION ============

/**
 * Calculate distance between two units.
 * Uses Manhattan distance for grid-based combat.
 */
export function calculateDistance(attacker: SimUnit, target: SimUnit): number | undefined {
  if (!attacker.position || !target.position) {
    return undefined; // No positions, use optimal range
  }
  const dx = Math.abs(attacker.position.x - target.position.x);
  const dy = Math.abs(attacker.position.y - target.position.y);
  // Use Euclidean for more natural range calculation
  return Math.sqrt(dx * dx + dy * dy);
}

// ============ VISION & FLANKING ============

/**
 * Normalize angle to 0-360 range.
 */
function normalizeAngle(angle: number): number {
  let normalized = angle % 360;
  if (normalized < 0) normalized += 360;
  return normalized;
}

/**
 * Calculate the angle from one position to another.
 * Returns angle in degrees (0=right, 90=up, 180=left, 270=down).
 */
export function getAngleToTarget(
  fromX: number, fromY: number,
  toX: number, toY: number
): number {
  const dx = toX - fromX;
  const dy = toY - fromY;
  // atan2 returns radians, convert to degrees
  // Math.atan2 uses standard math coords (up = positive Y)
  // We negate dy because screen coords have Y increasing downward
  const radians = Math.atan2(-dy, dx);
  const degrees = radians * (180 / Math.PI);
  return normalizeAngle(degrees);
}

/**
 * Get unit's vision cone, defaulting to human vision if not set.
 */
export function getVisionCone(unit: SimUnit): VisionCone {
  if (unit.vision) return unit.vision;
  return {
    facing: 0, // Default facing right
    ...DEFAULT_VISION.human,
  };
}

/**
 * Check if a position is within the unit's vision cone.
 * Returns true if the target position is visible.
 */
export function isInVisionCone(
  unit: SimUnit,
  targetX: number,
  targetY: number,
  isNight: boolean = false,
  isInFlareRadius: boolean = false
): boolean {
  if (!unit.position) return true; // No position = always visible

  const vision = getVisionCone(unit);

  // 360° vision sees everything
  if (vision.angle >= 360) return true;

  // Calculate distance
  const dx = targetX - unit.position.x;
  const dy = targetY - unit.position.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Get effective vision range (reduced at night)
  const effectiveRange = getEffectiveVisionRange(
    vision.range,
    isNight,
    unit.hasNightVision,
    isInFlareRadius
  );

  // Beyond vision range
  if (distance > effectiveRange) return false;

  // Calculate angle to target
  const angleToTarget = getAngleToTarget(
    unit.position.x, unit.position.y,
    targetX, targetY
  );

  // Calculate angle difference from facing
  let angleDiff = Math.abs(normalizeAngle(angleToTarget - vision.facing));
  if (angleDiff > 180) angleDiff = 360 - angleDiff;

  // Check if within half the vision angle on each side
  return angleDiff <= vision.angle / 2;
}

/**
 * Determine flanking result based on attack angle relative to target's facing.
 *
 * Attack angles (relative to target's facing):
 * - Front:    within ±45° of facing direction
 * - Side:     45-135° from facing (either side)
 * - Rear:     135-180° from facing (behind)
 * - Blindspot: Rear AND outside vision cone
 *
 * @returns FlankingResult with corresponding accuracy bonus
 */
export function getFlankingResult(
  attacker: SimUnit,
  target: SimUnit
): FlankingResult {
  // No positions = no flanking (use front)
  if (!attacker.position || !target.position) {
    return 'front';
  }

  const vision = getVisionCone(target);

  // Calculate angle FROM target TO attacker
  const attackAngle = getAngleToTarget(
    target.position.x, target.position.y,
    attacker.position.x, attacker.position.y
  );

  // Calculate angle difference from target's facing
  let angleDiff = Math.abs(normalizeAngle(attackAngle - vision.facing));
  if (angleDiff > 180) angleDiff = 360 - angleDiff;

  // Classify attack angle
  // Front: 0-45°, Side: 45-120°, Rear: 120-180°
  // Rear zone larger than side - easier to flank
  if (angleDiff <= 45) {
    return 'front';
  } else if (angleDiff <= 120) {
    return 'side';
  } else {
    // Rear attack - check if also in blindspot
    const inVision = isInVisionCone(target, attacker.position.x, attacker.position.y);
    if (!inVision) {
      return 'blindspot';
    }
    return 'rear';
  }
}

/**
 * Get accuracy bonus for flanking.
 * High INS targets are harder to flank (better awareness).
 */
export function getFlankingBonus(attacker: SimUnit, target: SimUnit): number {
  const flanking = getFlankingResult(attacker, target);
  const baseBonus = FLANKING_BONUSES[flanking];

  // INS FLANKING DEFENSE
  // High INS = better spatial awareness, reduces flanking effectiveness.
  // Reduces flanking bonus by 1 per 3 INS above 15.
  // INS 15 = full flanking, INS 21 = -2, INS 27 = -4, INS 33 = -6
  // Cannot reduce below 0 (no bonus for target having high INS)
  const targetIns = target.stats.INS || 15;
  const insDefense = Math.floor((targetIns - 15) / 3);
  const adjustedBonus = Math.max(0, baseBonus - insDefense);

  return adjustedBonus;
}

/**
 * Check if target can perform a reaction shot against attacker.
 * No reaction if attacker is in blindspot.
 */
export function canReact(target: SimUnit, attacker: SimUnit): boolean {
  const flanking = getFlankingResult(attacker, target);
  return flanking !== 'blindspot';
}

/**
 * Update a unit's facing to look at a target position.
 */
export function faceToward(unit: SimUnit, targetX: number, targetY: number): void {
  if (!unit.position) return;

  const angle = getAngleToTarget(
    unit.position.x, unit.position.y,
    targetX, targetY
  );

  if (!unit.vision) {
    unit.vision = { ...DEFAULT_VISION.human, facing: angle };
  } else {
    unit.vision.facing = angle;
  }
}

// ============ HIT CALCULATION ============

/**
 * Calculate hit result from a roll and accuracy.
 * Extracted from CombatScene - pure function, no dependencies.
 *
 * @param roll - Random roll 0-100
 * @param accuracy - Final accuracy after all modifiers
 * @returns Hit result: miss, graze, hit, or crit
 */
export function getHitResult(roll: number, accuracy: number): HitResult {
  // Normalize accuracy to 0-100 range
  const normalizedAccuracy = Math.max(5, Math.min(95, accuracy));

  // Calculate thresholds relative to normalized accuracy
  // Base: 70 accuracy means 70% hit chance
  // Higher accuracy shifts thresholds down (easier to hit)
  const missThreshold = 100 - normalizedAccuracy;       // e.g., 30 at 70 acc
  const grazeThreshold = missThreshold + 15;            // e.g., 45 at 70 acc
  const critThreshold = 95;                             // Always need high roll for crit

  if (roll <= missThreshold) return 'miss';
  if (roll <= grazeThreshold) return 'graze';
  if (roll >= critThreshold) return 'crit';
  return 'hit';
}

/**
 * Calculate accuracy with all modifiers applied.
 *
 * @param attacker - Attacking unit
 * @param target - Target unit
 * @param distance - Distance to target (optional, uses optimal if not provided)
 * @returns Final accuracy value
 */
export function calculateAccuracy(
  attacker: SimUnit,
  target: SimUnit,
  distance?: number,
  isNight: boolean = false,
  isInFlareRadius: boolean = false
): number {
  const weapon = attacker.weapon;
  let accuracy = weapon.accuracy || 70;

  // Range bracket modifiers (if distance provided and weapon has brackets)
  if (distance !== undefined && weapon.rangeBrackets) {
    const brackets = weapon.rangeBrackets;
    if (distance > brackets.max) {
      return 0; // Out of range
    }

    if (distance <= brackets.pointBlank) {
      accuracy += brackets.pointBlankMod;
    } else if (distance <= brackets.short) {
      accuracy += brackets.shortMod;
    } else if (distance <= brackets.optimal) {
      accuracy += brackets.optimalMod;
    } else if (distance <= brackets.long) {
      accuracy += brackets.longMod;
    } else {
      accuracy += brackets.extremeMod;
    }
  }

  // Stance modifiers
  const attackerStance = STANCES[attacker.stance] || STANCES.normal;
  const targetStance = STANCES[target.stance] || STANCES.normal;
  accuracy += attackerStance.accuracyMod;
  accuracy -= targetStance.evasionMod;

  // Cover modifiers
  // Target's cover reduces attacker accuracy (evasion)
  const targetCover = COVER_BONUSES[target.cover] || COVER_BONUSES.none;
  accuracy -= targetCover.evasionBonus;

  // Attacker's cover also reduces accuracy (peeking penalty)
  const attackerCover = COVER_BONUSES[attacker.cover] || COVER_BONUSES.none;
  accuracy += attackerCover.accuracyPenalty; // Negative value = penalty

  // MELEE DEFENSE BONUS
  // Trained fighters (high MEL) are harder to hit in close quarters.
  // A boxer can slip punches, a martial artist can evade knife slashes.
  // Bonus: +1 evasion per 2 MEL above 15 (baseline human)
  // MEL 15 = +0, MEL 20 = +2.5, MEL 25 = +5, MEL 30 = +7.5
  const isMeleeAttack = weapon.range <= 2;
  if (isMeleeAttack) {
    const meleeDefenseBonus = Math.floor((target.stats.MEL - 15) / 2);
    accuracy -= Math.max(0, meleeDefenseBonus);

    // INSIDE GUARD BONUS
    // Unarmed/fist fighters get bonus evasion vs armed melee opponents.
    // When you don't have a weapon, you can get INSIDE their weapon's reach.
    // A boxer slipping inside a knife fighter's guard is dangerous.
    // Bonus: +12 evasion if target is unarmed AND attacker has weapon
    const targetIsUnarmed = target.weapon.range <= 1 &&
      (target.weapon.name === 'Fist' ||
       target.weapon.name === 'Fists' ||
       target.weapon.damageType === 'SMASHING_MELEE' ||
       target.weapon.damageType === 'IMPACT_BLUNT');
    const attackerHasWeapon = attacker.weapon.name !== 'Fist' &&
      attacker.weapon.name !== 'Fists' &&
      attacker.weapon.damageType !== 'SMASHING_MELEE';

    if (targetIsUnarmed && attackerHasWeapon) {
      // Trained fighters (MEL 20+) get full bonus, untrained get less
      // This is substantial - a trained martial artist inside a knife's reach
      // is very hard to hit. They can slip, parry, deflect.
      const insideGuardBonus = target.stats.MEL >= 25 ? 20 :
                               target.stats.MEL >= 20 ? 15 : 8;
      accuracy -= insideGuardBonus;
    }
  }

  // AGL bonus (every 5 AGL above 50 = +1%)
  accuracy += Math.floor((attacker.stats.AGL - 50) / 5);

  // RNG STAT BONUS (Ranged skill)
  // High RNG = better ranged accuracy. JA2 style: 95 Marksmanship = GOD.
  // Bonus: +1% accuracy per 2 RNG above 15 (baseline human)
  // RNG 15 = +0, RNG 20 = +2.5, RNG 25 = +5, RNG 30 = +7.5
  // Only applies to ranged attacks (weapon range > 2)
  const isRangedAttack = weapon.range > 2;
  if (isRangedAttack && attacker.stats.RNG) {
    const rangedBonus = Math.floor((attacker.stats.RNG - 15) / 2);
    accuracy += Math.max(0, rangedBonus);
  }

  // TARGET AGL EVASION (Agility defense)
  // High AGL = harder to hit. Nimble characters dodge bullets.
  // Penalty to attacker: -1% per 2 AGL above 15 (baseline human)
  // AGL 15 = +0 evasion, AGL 20 = +2.5, AGL 25 = +5, AGL 30 = +7.5
  if (target.stats.AGL) {
    const aglEvasion = Math.floor((target.stats.AGL - 15) / 2);
    accuracy -= Math.max(0, aglEvasion);
  }

  // Injury/status penalty (legacy field)
  if (attacker.accuracyPenalty) {
    accuracy += attacker.accuracyPenalty;
  }

  // Status effect accuracy penalties (from stun, etc.)
  const statusAccPenalty = getAccuracyPenalty(attacker);
  accuracy += statusAccPenalty;

  // FLANKING BONUS
  // Attacking from the side, rear, or blindspot gives accuracy bonus.
  // Side: +10, Rear: +25, Blindspot: +40 (behind and outside vision cone)
  // Only applies if both units have positions set.
  const flankingBonus = getFlankingBonus(attacker, target);
  accuracy += flankingBonus;

  // NIGHT COMBAT PENALTY
  // -20% accuracy at night, reduced to -5% with night vision
  // Flares negate the penalty completely in their radius
  const nightPenalty = getNightAccuracyMod(isNight, attacker.hasNightVision, isInFlareRadius);
  accuracy += nightPenalty;

  // PANIC/MORALE PENALTY
  // Shaken: -10%, Panicked: -25%, Broken: -40%
  const panicMods = getPanicModifiers(attacker.panicLevel || 'steady');
  accuracy += panicMods.accuracyMod;

  // Clamp to valid range
  return Math.max(5, Math.min(95, accuracy));
}

/**
 * Get range bracket name for display.
 */
export function getRangeBracket(weapon: SimWeapon, distance: number): string {
  if (!weapon.rangeBrackets) return 'UNKNOWN';
  const brackets = weapon.rangeBrackets;

  if (distance > brackets.max) return 'OUT OF RANGE';
  if (distance <= brackets.pointBlank) return 'POINT BLANK';
  if (distance <= brackets.short) return 'SHORT';
  if (distance <= brackets.optimal) return 'OPTIMAL';
  if (distance <= brackets.long) return 'LONG';
  return 'EXTREME';
}

// ============ DAMAGE CALCULATION ============

/**
 * Calculate base damage before modifiers.
 * - Melee weapons use MEL stat for bonus damage
 * - Ranged weapons use base weapon damage only
 * - STR still affects knockback and grappling (handled elsewhere)
 */
export function getBaseDamage(weapon: SimWeapon, attacker: SimUnit): number {
  let damage = weapon.damage;

  // MEL DAMAGE BONUS (Melee skill)
  // High MEL = more melee damage. JA2 style: 95 Strength = crushing blows.
  // Bonus: +1 damage per 3 MEL above 15 (baseline human)
  // MEL 15 = +0, MEL 20 = +1.6, MEL 25 = +3.3, MEL 30 = +5
  const isMeleeWeapon = weapon.range <= 2;
  if (isMeleeWeapon && attacker.stats.MEL) {
    const meleeBonus = Math.floor((attacker.stats.MEL - 15) / 3);
    damage += Math.max(0, meleeBonus);
  }

  return damage;
}

/**
 * Apply hit result multiplier to damage.
 */
export function applyHitMultiplier(damage: number, hitResult: HitResult): number {
  switch (hitResult) {
    case 'crit': return Math.floor(damage * 1.5);
    case 'hit': return damage;
    case 'graze': return Math.floor(damage * 0.5);
    case 'miss': return 0;
  }
}

/**
 * Calculate origin damage modifier.
 */
export function getOriginMultiplier(damageType: string, targetOrigin: OriginType): number {
  const damageTypeDef = getDamageType(damageType as DamageSubType);
  if (!damageTypeDef?.originModifiers) return 1.0;
  return damageTypeDef.originModifiers[targetOrigin] ?? 1.0;
}

/**
 * Calculate armor effectiveness based on damage type.
 */
export function getArmorEffectiveness(damageType: string): {
  effectiveness: number;
  ignoresArmor: boolean;
  bypassesShields: boolean;
} {
  const damageTypeDef = getDamageType(damageType as DamageSubType);
  if (!damageTypeDef?.armorInteraction) {
    return { effectiveness: 1.0, ignoresArmor: false, bypassesShields: false };
  }

  return {
    effectiveness: damageTypeDef.armorInteraction.armorEffectiveness ?? 1.0,
    ignoresArmor: damageTypeDef.armorInteraction.ignoresArmor ?? false,
    bypassesShields: damageTypeDef.armorInteraction.bypassesShields ?? false,
  };
}

/**
 * Apply full damage pipeline: origin -> shield -> armor -> DR -> cover.
 */
export function calculateFinalDamage(
  rawDamage: number,
  damageType: string,
  target: SimUnit
): {
  finalDamage: number;
  originMultiplier: number;
  shieldAbsorbed: number;
  armorBlocked: number;
  drReduced: number;
  coverDRBonus: number;
} {
  let damage = rawDamage;

  // Step 1: Origin multiplier
  const originMult = getOriginMultiplier(damageType, target.origin);
  damage = Math.floor(damage * originMult);

  // If immune (0 multiplier), stop here
  if (damage <= 0) {
    return {
      finalDamage: 0,
      originMultiplier: originMult,
      shieldAbsorbed: 0,
      armorBlocked: 0,
      drReduced: 0,
      coverDRBonus: 0,
    };
  }

  const armorInfo = getArmorEffectiveness(damageType);
  let shieldAbsorbed = 0;
  let armorBlocked = 0;
  let drReduced = 0;

  // Step 2: Shield absorption
  if (!armorInfo.bypassesShields && target.shieldHp > 0) {
    shieldAbsorbed = Math.min(target.shieldHp, damage);
    damage -= shieldAbsorbed;
  }

  // Step 3: Armor (if not armor-piercing)
  if (!armorInfo.ignoresArmor && damage > 0) {
    const effectiveness = armorInfo.effectiveness;

    // Stopping power check
    if (target.stoppingPower > 0) {
      const effectiveSP = Math.floor(target.stoppingPower * effectiveness);
      if (damage <= effectiveSP) {
        armorBlocked = damage;
        damage = 0;
      } else {
        armorBlocked = effectiveSP;
        damage -= effectiveSP;
      }
    }

    // DR reduction (including cover bonus)
    if (damage > 0) {
      const coverBonus = COVER_BONUSES[target.cover]?.drBonus || 0;
      const totalDR = target.dr + coverBonus;
      const effectiveDR = Math.floor(totalDR * effectiveness);
      drReduced = Math.min(effectiveDR, damage - 1);
      damage = Math.max(1, damage - effectiveDR);
    }
  }

  return {
    finalDamage: damage,
    originMultiplier: originMult,
    shieldAbsorbed,
    armorBlocked,
    drReduced,
    coverDRBonus: COVER_BONUSES[target.cover]?.drBonus || 0,
  };
}

// ============ FULL ATTACK RESOLUTION ============

/**
 * Resolve a single attack from attacker to target.
 * Pure function - does not modify units.
 *
 * @param attacker - Attacking unit
 * @param target - Target unit
 * @param distance - Distance (optional, uses optimal if not provided)
 * @param roll - Random roll 0-100 (optional, generates if not provided)
 * @param fireMode - Fire mode override (optional, uses weapon's currentFireMode or 'single')
 * @returns Full attack result with all details
 */
export function resolveAttack(
  attacker: SimUnit,
  target: SimUnit,
  distance?: number,
  roll?: number,
  fireMode?: FireMode
): AttackResult {
  const weapon = attacker.weapon;

  // Determine fire mode: explicit param > weapon setting > single
  const mode = fireMode || weapon.currentFireMode || 'single';
  const modeConfig = FIRE_MODES[mode];

  // Calculate base accuracy with fire mode penalty
  const baseAccuracy = calculateAccuracy(attacker, target, distance);
  const accuracy = Math.max(5, Math.min(95, baseAccuracy + modeConfig.accuracyPenalty));

  // Fire multiple shots based on fire mode
  let totalDamage = 0;
  let hits = 0;
  let crits = 0;
  let grazes = 0;
  let bestHitResult: HitResult = 'miss';
  const baseDamage = getBaseDamage(weapon, attacker);

  // Calculate per-shot damage with fire mode multiplier
  const shotDamage = baseDamage * modeConfig.damagePerShot;

  for (let shot = 0; shot < modeConfig.shotsPerAttack; shot++) {
    const shotRoll = roll !== undefined && shot === 0 ? roll : Math.random() * 100;
    const hitResult = getHitResult(shotRoll, accuracy);

    if (hitResult === 'crit') {
      crits++;
      hits++;
      totalDamage += applyHitMultiplier(shotDamage, 'crit');
      bestHitResult = 'crit';
    } else if (hitResult === 'hit') {
      hits++;
      totalDamage += applyHitMultiplier(shotDamage, 'hit');
      if (bestHitResult !== 'crit') bestHitResult = 'hit';
    } else if (hitResult === 'graze') {
      grazes++;
      totalDamage += applyHitMultiplier(shotDamage, 'graze');
      if (bestHitResult === 'miss') bestHitResult = 'graze';
    }
    // Miss adds no damage
  }

  // Apply damage pipeline to total damage
  const damageResult = calculateFinalDamage(
    totalDamage,
    weapon.damageType,
    target
  );

  // Calculate new HP values
  const targetHpBefore = target.hp;
  const targetShieldBefore = target.shieldHp;
  const targetHpAfter = Math.max(0, target.hp - damageResult.finalDamage);
  const targetShieldAfter = Math.max(0, target.shieldHp - damageResult.shieldAbsorbed);

  // Stance modifiers for logging
  const attackerStance = STANCES[attacker.stance] || STANCES.normal;
  const targetStance = STANCES[target.stance] || STANCES.normal;

  // Generate status effects based on damage type and hit result
  const statusEffects = getStatusEffectsForDamage(
    weapon.damageType,
    bestHitResult,
    target.origin
  );

  // Add suppression effect if burst/auto fire hit
  if (hits > 0 && modeConfig.suppressionChance > 0) {
    const suppressionRoll = Math.random() * 100;
    // Suppression chance scales with hits: more hits = higher chance
    const effectiveChance = modeConfig.suppressionChance * (1 + (hits - 1) * 0.1);
    if (suppressionRoll < effectiveChance) {
      statusEffects.push({
        id: 'suppressed',
        duration: 2,
        accuracyPenalty: -20,
        source: `${mode}_fire`,
      });
    }
  }

  const effectIds = statusEffects.map(e => e.id);

  return {
    attacker: attacker.id,
    target: target.id,
    weapon: weapon.name,

    roll: roll ?? 0,
    accuracy,
    hitResult: bestHitResult,

    rawDamage: baseDamage * modeConfig.shotsPerAttack,
    critMultiplier: crits > 0 ? 1.5 : 1.0,
    originMultiplier: damageResult.originMultiplier,
    shieldAbsorbed: damageResult.shieldAbsorbed,
    armorBlocked: damageResult.armorBlocked,
    drReduced: damageResult.drReduced,
    coverDRBonus: damageResult.coverDRBonus,
    finalDamage: damageResult.finalDamage,

    targetHpBefore,
    targetHpAfter,
    targetShieldBefore,
    targetShieldAfter,
    killed: targetHpAfter <= 0,

    effectsApplied: effectIds,
    // Calculate knockback: weapon force vs target STR (weight)
    // Only applies on successful hit with weapons that have knockback
    knockbackTiles: hits > 0 && weapon.knockbackForce
      ? calculateKnockback(weapon.knockbackForce, target.stats.STR).spaces
      : 0,

    stanceAccuracyMod: attackerStance.accuracyMod,
    stanceEvasionMod: targetStance.evasionMod,
    rangeBracket: distance !== undefined ? getRangeBracket(weapon, distance) : 'OPTIMAL',
    distance,

    // Flanking
    flanking: getFlankingResult(attacker, target),
    flankingBonus: getFlankingBonus(attacker, target),

    // Store full effect instances for application
    _statusEffects: statusEffects,
  };
}

/**
 * Apply attack result to unit (mutates unit state).
 * Separate from resolveAttack to allow preview before applying.
 * Now also applies status effects from the attack.
 */
export function applyAttackResult(target: SimUnit, result: AttackResult): void {
  target.hp = result.targetHpAfter;
  target.shieldHp = result.targetShieldAfter;
  target.alive = target.hp > 0;

  // Reset shield regen delay when taking damage
  if (result.damage > 0) {
    resetShieldRegenDelay(target);
  }

  // Apply status effects if present
  if (result._statusEffects && result._statusEffects.length > 0) {
    applyStatusEffects(target, result._statusEffects);
  }
}

// ============ GRENADE RESOLUTION ============

/**
 * Resolve a grenade explosion at a position.
 * Returns damage and effects for all units in blast radius.
 */
export function resolveGrenade(
  grenade: SimGrenade,
  centerPos: { x: number; y: number },
  units: SimUnit[]
): GrenadeExplosionResult {
  const victims: GrenadeExplosionResult['victims'] = [];
  let tilesAffected = 0;

  // Count affected tiles (circle)
  for (let dx = -grenade.blastRadius; dx <= grenade.blastRadius; dx++) {
    for (let dy = -grenade.blastRadius; dy <= grenade.blastRadius; dy++) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= grenade.blastRadius) tilesAffected++;
    }
  }

  // Check each unit
  for (const unit of units) {
    if (!unit.position || !unit.alive) continue;

    const dx = unit.position.x - centerPos.x;
    const dy = unit.position.y - centerPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Skip if outside blast radius
    if (distance > grenade.blastRadius) continue;

    // Calculate damage based on distance and falloff type
    let damageMult = 1.0;
    if (grenade.damageFalloff === 'linear') {
      damageMult = 1 - (distance / grenade.blastRadius);
    } else {
      damageMult = Math.pow(1 - (distance / grenade.blastRadius), 2);
    }

    const damage = Math.floor(grenade.damageAtCenter * damageMult);

    // Calculate knockback
    const knockbackTiles = Math.floor(
      (grenade.knockbackForce * damageMult) / (30 + unit.stats.STR)
    );

    victims.push({
      unitId: unit.id,
      distance,
      damage,
      knockbackTiles,
      effectsApplied: [...grenade.statusEffects],
    });
  }

  return {
    grenadeId: grenade.id,
    centerPosition: centerPos,
    victims,
    tilesAffected,
  };
}

/**
 * Apply grenade explosion result to units.
 */
export function applyGrenadeResult(
  units: SimUnit[],
  result: GrenadeExplosionResult
): void {
  for (const victim of result.victims) {
    const unit = units.find(u => u.id === victim.unitId);
    if (!unit) continue;

    // Apply damage
    unit.hp = Math.max(0, unit.hp - victim.damage);
    unit.alive = unit.hp > 0;

    // Apply status effects with intensity based on distance
    const grenade = SIM_GRENADES[result.grenadeId];
    if (grenade && grenade.statusEffects.length > 0) {
      const intensity = 1 - (victim.distance / grenade.blastRadius);

      for (const effectId of grenade.statusEffects) {
        const effect = createGrenadeEffect(effectId, intensity);
        if (effect) {
          applyStatusEffects(unit, [effect]);
        }
      }
    }
  }
}

/**
 * Create status effect with intensity scaling for grenades.
 */
function createGrenadeEffect(
  effectId: StatusEffectId,
  intensity: number
): StatusEffectInstance | null {
  switch (effectId) {
    case 'bleeding':
      return {
        id: 'bleeding',
        duration: Math.max(1, Math.round(3 * intensity)),
        damagePerTick: Math.max(2, Math.round(4 * intensity)),
        scaling: 'constant',
        source: 'grenade',
      };
    case 'burning':
      return {
        id: 'burning',
        duration: Math.max(1, Math.round(3 * intensity)),
        damagePerTick: Math.max(3, Math.round(6 * intensity)),
        scaling: 'increasing',
        damageChange: 2,
        spreadChance: 0.1,
        source: 'grenade',
      };
    case 'stunned':
      return {
        id: 'stunned',
        duration: Math.max(1, Math.round(2 * intensity)),
        skipTurn: true,
        source: 'grenade',
      };
    default:
      return null;
  }
}

// ============ TURN ORDER ============

/**
 * Calculate initiative for a unit.
 * Higher = goes first.
 */
export function calculateInitiative(unit: SimUnit, roll?: number): number {
  const base = unit.stats.AGL + unit.stats.MEL;
  const randomComponent = roll ?? Math.random() * 100;
  return base + randomComponent;
}

/**
 * Sort units by initiative for turn order.
 */
export function getTurnOrder(units: SimUnit[]): SimUnit[] {
  return [...units]
    .filter(u => u.alive)
    .map(u => ({ unit: u, initiative: calculateInitiative(u) }))
    .sort((a, b) => b.initiative - a.initiative)
    .map(item => item.unit);
}

/**
 * Get the best target for a unit (simple AI).
 * Prioritizes: low HP > closest > highest threat
 */
export function selectTarget(attacker: SimUnit, enemies: SimUnit[]): SimUnit | null {
  const aliveEnemies = enemies.filter(e => e.alive);
  if (aliveEnemies.length === 0) return null;

  // Sort by HP (lowest first) then by AGL (highest threat first)
  return aliveEnemies.sort((a, b) => {
    // Prioritize low HP targets
    const hpRatio = (a.hp / a.maxHp) - (b.hp / b.maxHp);
    if (Math.abs(hpRatio) > 0.1) return hpRatio;

    // Then prioritize high damage threats
    return b.weapon.damage - a.weapon.damage;
  })[0];
}

// ============ DISARM MECHANICS ============

/**
 * Calculate disarm chance based on attacker's weapon and both units' STR.
 *
 * Base chance: 30%
 * Weapon bonus: nunchucks +25%, sai +15%
 * STR contest: +2% per STR difference (attacker - defender)
 * Blade trapping (sai): +20% vs edged weapons
 */
export function calculateDisarmChance(
  attacker: SimUnit,
  target: SimUnit
): number {
  // Can't disarm someone who's already disarmed or using fists
  if (target.disarmed || target.weapon.name === 'Fist') {
    return 0;
  }

  let chance = 30; // Base disarm chance

  // Weapon bonus
  const weaponBonus = attacker.weapon.special?.disarmBonus || 0;
  chance += weaponBonus;

  // STR contest: +2% per STR difference
  const strDiff = attacker.stats.STR - target.stats.STR;
  chance += strDiff * 2;

  // Blade trapping bonus (sai vs edged weapons)
  if (attacker.weapon.special?.bladeTrapping) {
    const isEdged = target.weapon.damageType.startsWith('EDGED');
    if (isEdged) {
      chance += 20;
    }
  }

  // Clamp to reasonable range
  return Math.max(5, Math.min(95, chance));
}

/**
 * Attempt to disarm target.
 * Returns detailed result for logging.
 */
export function attemptDisarm(
  attacker: SimUnit,
  target: SimUnit,
  roll?: number
): DisarmResult {
  const chance = calculateDisarmChance(attacker, target);
  const actualRoll = roll ?? Math.random() * 100;

  const result: DisarmResult = {
    success: actualRoll <= chance,
    roll: actualRoll,
    chance,
    attackerSTR: attacker.stats.STR,
    defenderSTR: target.stats.STR,
    weaponBonus: attacker.weapon.special?.disarmBonus || 0,
  };

  return result;
}

/**
 * Apply disarm effect to target (mutates target).
 * Stores original weapon and switches to fists.
 */
export function applyDisarm(target: SimUnit): void {
  if (target.disarmed) return;

  target.originalWeapon = { ...target.weapon };
  target.weapon = { ...FIST_WEAPON };
  target.disarmed = true;
}

/**
 * Restore target's weapon after being disarmed (mutates target).
 * Used when picking up dropped weapon or recovering.
 */
export function restoreWeapon(target: SimUnit): void {
  if (!target.disarmed || !target.originalWeapon) return;

  target.weapon = { ...target.originalWeapon };
  target.originalWeapon = undefined;
  target.disarmed = false;
}

// ============ COUNTER-ATTACK MECHANICS ============

/**
 * Quick counter-strike weapon for trained martial artists.
 * Used when they successfully dodge a melee attack.
 * This is a powerful strike - the opponent is off-balance and exposed.
 */
const COUNTER_STRIKE: SimWeapon = {
  name: 'Counter Strike',
  damage: 14,      // Solid counter (like a cross punch)
  accuracy: 92,    // High accuracy (they're in close, opponent overextended)
  damageType: 'SMASHING_MELEE',
  range: 1,
  apCost: 0,       // Free action
};

/**
 * Check if a unit can counter-attack after dodging a melee attack.
 * Requires:
 * - Target has MEL 18+ (trained in close combat)
 * - Target is unarmed OR using a martial arts weapon
 * - The incoming attack was melee (range <= 2)
 * - The incoming attack missed
 */
export function canCounterAttack(
  target: SimUnit,
  attacker: SimUnit,
  attackResult: AttackResult
): boolean {
  // Must have dodged (miss only, not graze)
  if (attackResult.hitResult !== 'miss') return false;

  // Attacker must have used melee weapon
  if (attacker.weapon.range > 2) return false;

  // Target must be alive
  if (!target.alive) return false;

  // Target must be trained in melee (MEL 18+)
  if (target.stats.MEL < 18) return false;

  // Target must be unarmed OR using a martial arts weapon
  const weapon = target.weapon;
  const isMartialArts = weapon.range <= 2 && (
    // Unarmed strikes
    weapon.name === 'Fist' ||
    weapon.name === 'Fists' ||
    weapon.name === 'Jab' ||
    weapon.name === 'Cross' ||
    weapon.name === 'Hook' ||
    weapon.name === 'Uppercut' ||
    weapon.name === 'Kick' ||
    weapon.name === 'Roundhouse' ||
    weapon.damageType === 'SMASHING_MELEE' ||
    weapon.damageType === 'IMPACT_BLUNT' ||
    // Martial arts weapons
    weapon.name === 'Nunchucks' ||
    weapon.name === 'Tonfa' ||
    weapon.name === 'Bo Staff' ||
    weapon.name === 'Sai' ||
    weapon.name === 'Knife' ||
    weapon.name === 'Combat Knife' ||
    weapon.name === 'Escrima Sticks' ||
    // Weapons with martial arts properties can counter
    weapon.special?.disarmBonus !== undefined ||
    weapon.special?.blockBonus !== undefined ||
    weapon.special?.bladeTrapping !== undefined
  );

  return isMartialArts;
}

/**
 * Resolve a counter-attack from a martial artist who dodged a melee attack.
 * The counter is a quick strike - high accuracy, solid damage.
 *
 * Counter-attack chance scales with MEL:
 * - MEL 18-19: 50% chance
 * - MEL 20-24: 70% chance
 * - MEL 25-29: 85% chance
 * - MEL 30+: 95% chance
 */
export function resolveCounterAttack(
  counter: SimUnit,
  attacker: SimUnit,
  roll?: number
): AttackResult | null {
  // Calculate counter chance based on MEL
  const mel = counter.stats.MEL;
  let counterChance: number;
  if (mel >= 30) counterChance = 95;
  else if (mel >= 25) counterChance = 85;
  else if (mel >= 20) counterChance = 70;
  else counterChance = 50;

  // Roll to see if counter triggers
  const triggerRoll = roll ?? Math.random() * 100;
  if (triggerRoll > counterChance) {
    return null; // Counter didn't trigger
  }

  // Counter triggers - resolve as a quick strike
  // Use COUNTER_STRIKE weapon temporarily
  const originalWeapon = counter.weapon;
  counter.weapon = COUNTER_STRIKE;

  const counterResult = resolveAttack(counter, attacker, 1);

  // Restore original weapon
  counter.weapon = originalWeapon;

  // Mark as counter-attack in the result
  counterResult.weapon = 'Counter Strike';

  return counterResult;
}

// ============ XCOM-STYLE MOVEMENT SYSTEM ============
// Movement based on AGL stat with 2-action turn structure

/**
 * Get max speed based on AGL (dash distance).
 * This is the unit's top speed when sprinting.
 *
 * Formula: 4 + floor((AGL - 10) / 5)
 *
 * Examples:
 *   AGL 10 (elderly): 4 tiles
 *   AGL 15 (soccer dad): 5 tiles
 *   AGL 20 (trained): 6 tiles
 *   AGL 25 (elite): 7 tiles
 *   AGL 30 (pro athlete): 8 tiles
 *   AGL 35 (olympic): 9 tiles
 */
export function getMaxSpeed(unit: SimUnit): number {
  const agl = unit.stats.AGL;
  return 4 + Math.floor((agl - 10) / 5);
}

/**
 * Get movement range for a single move action.
 * This is half max speed (careful tactical movement).
 *
 * Move = cautious movement with awareness of surroundings.
 * After moving, you can still attack.
 */
export function getMovementRange(unit: SimUnit): number {
  return Math.floor(getMaxSpeed(unit) / 2);
}

/**
 * Get dash range (uses both actions).
 * This is your actual top speed - full sprint.
 *
 * Dash = sprinting, no attack possible.
 * Triggers more overwatch shots from enemies.
 */
export function getDashRange(unit: SimUnit): number {
  return getMaxSpeed(unit);
}

// ============ CONCEALMENT / EXPLORATION PHASE ============

/**
 * Calculate movement AP cost based on combat phase.
 * In exploration: 0 AP (free movement)
 * In combat: distance * 1 AP per tile
 */
export function getMovementCostByPhase(distance: number, phase: CombatPhase): number {
  const config = PHASE_CONFIGS[phase];
  return Math.ceil(distance * config.movementCostMultiplier);
}

/**
 * Check if two units can see each other based on distance.
 * Simple Euclidean distance check - LoS blocking handled separately.
 */
export function canSeeEnemyByRange(
  unit: SimUnit,
  enemy: SimUnit,
  visionRange: number = 15
): boolean {
  if (!unit.position || !enemy.position) return false;
  const dx = unit.position.x - enemy.position.x;
  const dy = unit.position.y - enemy.position.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance <= visionRange;
}

/**
 * Check if moving to a position would trigger combat.
 * Returns the new phase and whether combat was triggered.
 */
export function checkCombatTrigger(
  unit: SimUnit,
  newPosition: { x: number; y: number },
  enemies: SimUnit[],
  currentPhase: CombatPhase,
  visionRange: number = 15
): { newPhase: CombatPhase; apCost: number; triggered: boolean } {
  // Calculate movement distance
  const dx = newPosition.x - (unit.position?.x || 0);
  const dy = newPosition.y - (unit.position?.y || 0);
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Calculate AP cost based on current phase
  const apCost = getMovementCostByPhase(distance, currentPhase);

  // Check if any enemy would be visible from new position
  let triggered = false;
  if (currentPhase === 'exploration') {
    const movedUnit = { ...unit, position: newPosition };
    for (const enemy of enemies) {
      if (canSeeEnemyByRange(movedUnit, enemy, visionRange)) {
        triggered = true;
        break;
      }
    }
  }

  // Determine new phase
  const newPhase = triggered ? 'combat' : currentPhase;

  return { newPhase, apCost, triggered };
}

// ============ POD ACTIVATION SYSTEM ============

/**
 * Create a new enemy pod from a group of units.
 */
export function createPod(
  units: SimUnit[],
  patrolPath?: { x: number; y: number }[]
): EnemyPod {
  return {
    id: `pod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    unitIds: units.map(u => u.id),
    state: 'inactive',
    patrolPath,
    patrolIndex: 0,
  };
}

/**
 * Get the vision range for a pod based on its state.
 */
export function getPodVisionRange(pod: EnemyPod): number {
  switch (pod.state) {
    case 'inactive': return POD_CONFIG.inactiveVisionRange;
    case 'alerted': return POD_CONFIG.alertedVisionRange;
    case 'activated': return POD_CONFIG.activatedVisionRange;
  }
}

/**
 * Check if a pod can see a target unit.
 * Uses the pod's center of mass for distance calculation.
 */
export function canPodSeeUnit(
  pod: EnemyPod,
  podUnits: SimUnit[],
  target: SimUnit
): boolean {
  const visionRange = getPodVisionRange(pod);

  // Any unit in the pod seeing the target activates the pod
  for (const unit of podUnits) {
    if (canSeeEnemyByRange(unit, target, visionRange)) {
      return true;
    }
  }
  return false;
}

/**
 * Activate a pod when spotted or when combat begins.
 * Returns activation result with scatter positions.
 */
export function activatePod(
  pod: EnemyPod,
  podUnits: SimUnit[],
  triggeredBy?: string,
  currentTurn: number = 0
): PodActivationResult {
  const previousState = pod.state;
  pod.state = 'activated';
  pod.alertedBy = triggeredBy;
  pod.activationTurn = currentTurn;

  // Calculate scatter positions (move to nearby cover)
  const scatterPositions: { unitId: string; position: { x: number; y: number } }[] = [];
  for (const unit of podUnits) {
    if (unit.position) {
      // Scatter in random direction up to scatterDistance
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * POD_CONFIG.scatterDistance;
      scatterPositions.push({
        unitId: unit.id,
        position: {
          x: unit.position.x + Math.cos(angle) * distance,
          y: unit.position.y + Math.sin(angle) * distance,
        },
      });
    }
  }

  return {
    podId: pod.id,
    previousState,
    newState: 'activated',
    unitsRevealed: pod.unitIds,
    scatterPositions,
  };
}

/**
 * Alert a pod (suspicious but not yet in combat).
 * Alerted pods move toward last known player position.
 */
export function alertPod(
  pod: EnemyPod,
  alertSource: { x: number; y: number },
  alertedBy?: string
): void {
  if (pod.state === 'inactive') {
    pod.state = 'alerted';
    pod.alertedBy = alertedBy;
  }
}

/**
 * Check if gunfire at a position would alert nearby pods.
 * Returns list of pods that heard the gunfire.
 */
export function checkGunfireAlert(
  firingPosition: { x: number; y: number },
  pods: EnemyPod[],
  podUnitsMap: Map<string, SimUnit[]>
): EnemyPod[] {
  const alertedPods: EnemyPod[] = [];

  for (const pod of pods) {
    if (pod.state === 'activated') continue; // Already in combat

    const podUnits = podUnitsMap.get(pod.id) || [];
    for (const unit of podUnits) {
      if (!unit.position) continue;

      const dx = unit.position.x - firingPosition.x;
      const dy = unit.position.y - firingPosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= POD_CONFIG.alertOtherPodsRadius) {
        alertPod(pod, firingPosition);
        alertedPods.push(pod);
        break;
      }
    }
  }

  return alertedPods;
}

/**
 * Process pod patrol movement (for inactive/alerted pods).
 */
export function processPatrolMovement(
  pod: EnemyPod,
  podUnits: SimUnit[]
): void {
  if (pod.state === 'activated') return;
  if (!pod.patrolPath || pod.patrolPath.length === 0) return;

  const moveSpeed = pod.state === 'inactive'
    ? POD_CONFIG.inactiveMovementPerTurn
    : POD_CONFIG.alertedMovementPerTurn;

  // Move toward next patrol point
  const targetPoint = pod.patrolPath[pod.patrolIndex || 0];

  for (const unit of podUnits) {
    if (!unit.position) continue;

    const dx = targetPoint.x - unit.position.x;
    const dy = targetPoint.y - unit.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= moveSpeed) {
      // Reached patrol point, move to next
      unit.position = { ...targetPoint };
      pod.patrolIndex = ((pod.patrolIndex || 0) + 1) % pod.patrolPath.length;
    } else {
      // Move toward patrol point
      const ratio = moveSpeed / distance;
      unit.position.x += dx * ratio;
      unit.position.y += dy * ratio;
    }
  }
}

// ============ COMBAT BOND SYSTEM ============

/**
 * Get MBTI compatibility between two personality types.
 * Used to determine how fast bonds form and combat synergy.
 */
export function getMBTICompatibility(mbti1: string, mbti2: string): MBTICompatibility {
  // Same type = excellent
  if (mbti1 === mbti2) return 'excellent';

  // Check direct key
  const key1 = `${mbti1}_${mbti2}`;
  const key2 = `${mbti2}_${mbti1}`;

  if (MBTI_COMPATIBILITY_RULES[key1]) return MBTI_COMPATIBILITY_RULES[key1];
  if (MBTI_COMPATIBILITY_RULES[key2]) return MBTI_COMPATIBILITY_RULES[key2];

  // Default to neutral
  return 'neutral';
}

/**
 * Create a new combat bond between two units.
 */
export function createBond(unit1: SimUnit, unit2: SimUnit, mbti1?: string, mbti2?: string): CombatBond {
  const compatibility = getMBTICompatibility(mbti1 || 'ISTJ', mbti2 || 'ISTJ');

  return {
    unitId1: unit1.id,
    unitId2: unit2.id,
    bondLevel: 0,
    missionsTogether: 0,
    compatibility,
    xpToNextLevel: BOND_THRESHOLDS.level1,
  };
}

/**
 * Calculate bond level based on missions together and compatibility.
 */
export function calculateBondLevel(bond: CombatBond): BondLevel {
  const missions = bond.missionsTogether;
  const multiplier = MBTI_COMPATIBILITY_MULTIPLIER[bond.compatibility];
  const effectiveMissions = Math.floor(missions * multiplier);

  if (effectiveMissions >= BOND_THRESHOLDS.level3) return 3;
  if (effectiveMissions >= BOND_THRESHOLDS.level2) return 2;
  if (effectiveMissions >= BOND_THRESHOLDS.level1) return 1;
  return 0;
}

/**
 * Update bond after a mission together.
 * Returns the updated bond and whether level increased.
 */
export function progressBond(bond: CombatBond): { bond: CombatBond; leveledUp: boolean } {
  const oldLevel = bond.bondLevel;

  bond.missionsTogether++;
  bond.bondLevel = calculateBondLevel(bond);

  // Update XP to next level
  const multiplier = MBTI_COMPATIBILITY_MULTIPLIER[bond.compatibility];
  const effectiveMissions = bond.missionsTogether * multiplier;

  if (bond.bondLevel < 3) {
    const thresholds = [0, BOND_THRESHOLDS.level1, BOND_THRESHOLDS.level2, BOND_THRESHOLDS.level3];
    const nextThreshold = thresholds[bond.bondLevel + 1];
    bond.xpToNextLevel = Math.ceil((nextThreshold - effectiveMissions) / multiplier);
  } else {
    bond.xpToNextLevel = 0;
  }

  return {
    bond,
    leveledUp: bond.bondLevel > oldLevel,
  };
}

/**
 * Get combat bonuses for a unit based on adjacent bonded allies.
 */
export function getBondCombatBonuses(
  unit: SimUnit,
  allies: SimUnit[],
  bonds: CombatBond[],
  adjacencyRange: number = 3
): BondBonuses {
  const result: BondBonuses = {
    accuracyBonus: 0,
    evasionBonus: 0,
    willBonus: 0,
    actionBonus: false,
  };

  if (!unit.position) return result;

  // Find highest bond bonus from adjacent allies
  for (const ally of allies) {
    if (!ally.position || ally.id === unit.id) continue;

    // Check distance
    const dx = unit.position.x - ally.position.x;
    const dy = unit.position.y - ally.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > adjacencyRange) continue;

    // Find bond between this unit and ally
    const bond = bonds.find(b =>
      (b.unitId1 === unit.id && b.unitId2 === ally.id) ||
      (b.unitId1 === ally.id && b.unitId2 === unit.id)
    );

    if (!bond || bond.bondLevel === 0) continue;

    // Apply highest bonus (don't stack from multiple allies)
    const bonuses = BOND_LEVEL_BONUSES[bond.bondLevel];
    result.accuracyBonus = Math.max(result.accuracyBonus, bonuses.accuracyBonus);
    result.evasionBonus = Math.max(result.evasionBonus, bonuses.evasionBonus);
    result.willBonus = Math.max(result.willBonus, bonuses.willBonus);
    result.actionBonus = result.actionBonus || bonuses.actionBonus;
  }

  return result;
}

/**
 * Check if bonded ally was killed - triggers revenge mode.
 * Returns bonus accuracy if avenging a fallen bonded ally.
 */
export function checkRevengeMode(
  unit: SimUnit,
  killedUnitId: string,
  bonds: CombatBond[],
  currentTurn: number
): { isAvenging: boolean; accuracyBonus: number; turnsRemaining: number } {
  // Find bond with killed unit
  const bond = bonds.find(b =>
    (b.unitId1 === unit.id && b.unitId2 === killedUnitId) ||
    (b.unitId1 === killedUnitId && b.unitId2 === unit.id)
  );

  if (!bond || bond.bondLevel < 2) {
    return { isAvenging: false, accuracyBonus: 0, turnsRemaining: 0 };
  }

  // Level 2+ bond triggers revenge mode
  // +15 accuracy for 2 turns, +20 accuracy at level 3 for 3 turns
  const accuracyBonus = bond.bondLevel === 3 ? 20 : 15;
  const turnsRemaining = bond.bondLevel === 3 ? 3 : 2;

  return {
    isAvenging: true,
    accuracyBonus,
    turnsRemaining,
  };
}

// ============ ACTION MANAGEMENT ============

/**
 * Reset turn state at start of unit's turn.
 * Each unit gets 2 actions per turn.
 */
export function resetTurnState(unit: SimUnit): void {
  unit.turnState = {
    actionsRemaining: 2,
    hasMoved: false,
    hasAttacked: false,
    isDashing: false,
    isOnOverwatch: false,
  };
}

/**
 * Check if unit can perform a specific action.
 * Returns false if turn is over or action is invalid.
 */
export function canPerformAction(unit: SimUnit, action: ActionType): boolean {
  const state = unit.turnState;
  if (!state || state.actionsRemaining === 0) return false;

  // If on overwatch, turn is over
  if (state.isOnOverwatch) return false;

  // LIGHT ATTACK EXCEPTION:
  // After a light attack (jab, knife), if actions remain, can still act
  // This enables martial arts combos: jab + cross, jab + jab, knife + move
  if (state.hasAttacked && state.actionsRemaining > 0) {
    // After light attack, can do certain follow-up actions:
    switch (action) {
      case 'move':
        // Can retreat/reposition after quick strike
        return true;
      case 'reload':
      case 'use_item':
        return true;
      case 'attack':
        // Can do any attack after light attack (including another light)
        // Light + Light = holding back (jab-jab = 6 dmg vs jab-cross = 17 dmg)
        // Light + Heavy = combo finisher
        return true;
      default:
        return false;
    }
  }

  // Heavy attack ends turn - can't do anything after
  if (state.hasAttacked) return false;

  // Specific action checks
  switch (action) {
    case 'move':
      // Can always move if have actions (first move or second move = dash)
      return true;

    case 'dash':
      // Dash requires 2 actions (haven't done anything yet)
      return state.actionsRemaining === 2 && !state.hasMoved;

    case 'attack':
      // Can attack if have at least 1 action
      return true;

    case 'overwatch':
      // Overwatch requires 2 actions (full turn commitment)
      return state.actionsRemaining === 2 && !state.hasMoved;

    case 'reload':
      // Can reload if have actions
      return true;

    case 'use_item':
      // Can use item if have actions
      return true;

    default:
      return false;
  }
}

/**
 * Spend an action and update turn state.
 * Call this after performing an action.
 */
export function spendAction(unit: SimUnit, action: ActionType): void {
  if (!unit.turnState) {
    resetTurnState(unit);
  }

  const state = unit.turnState!;

  switch (action) {
    case 'move':
      state.actionsRemaining = (state.actionsRemaining - 1) as 0 | 1 | 2;
      if (!state.hasMoved) {
        state.hasMoved = true;
      } else {
        // Second move = dash
        state.isDashing = true;
      }
      break;

    case 'dash':
      // Dash uses both actions
      state.actionsRemaining = 0;
      state.hasMoved = true;
      state.isDashing = true;
      break;

    case 'attack':
      // Check if weapon is a light attack (jab, knife, etc.)
      const isLight = unit.weapon.isLightAttack === true;
      if (isLight) {
        // Light attack uses 1 action but doesn't end turn
        // Allows combos like: jab + cross, knife stab + move away
        state.actionsRemaining = (state.actionsRemaining - 1) as 0 | 1 | 2;
        state.hasAttacked = true;
        // Note: hasAttacked is true, but actionsRemaining may still be 1
        // This allows: jab (1 action) + move (1 action)
        // Or: jab (1 action) + heavy punch (1 action, ends turn)
      } else {
        // Heavy attack ends turn immediately
        state.actionsRemaining = 0;
        state.hasAttacked = true;
      }
      break;

    case 'overwatch':
      // Overwatch uses both actions and ends turn
      state.actionsRemaining = 0;
      state.isOnOverwatch = true;
      break;

    case 'reload':
      state.actionsRemaining = (state.actionsRemaining - 1) as 0 | 1 | 2;
      break;

    case 'use_item':
      state.actionsRemaining = (state.actionsRemaining - 1) as 0 | 1 | 2;
      break;
  }
}

/**
 * Check if unit's turn is complete.
 */
export function isTurnComplete(unit: SimUnit): boolean {
  const state = unit.turnState;
  if (!state) return true;
  return state.actionsRemaining === 0;
}
