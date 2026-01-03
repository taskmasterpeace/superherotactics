/**
 * Technique Execution System
 *
 * Handles martial arts technique selection and execution.
 * Integrates with grapple system and status effects.
 */

import { SimUnit, GrappleStateType, StatusEffectInstance } from './types';
import { getGrappleState, transitionGrapple, isGrappling } from './grapple';
import {
  isProne,
  createProneEffect,
  createStunnedEffect,
  createArmInjuredEffect,
  createChokedEffect,
  createDisorientedEffect,
  createDrainedEffect,
  createInternalBleedingEffect,
  createCrippledEffect,
  createBlindedEffect,
  createSlowedEffect,
  createSilencedEffect,
  createImmobilizedEffect,
  createStaggeredEffect,
  createDisarmedEffect,
} from './statusEffects';
import martialArtsData from '../data/martial-arts.json';

// ============ STYLE COMBAT MODIFIERS ============

/**
 * Style-specific combat modifiers.
 * Affects accuracy at different ranges and in grapple.
 */
export interface StyleCombatModifiers {
  range1Bonus: number;      // Accuracy bonus at range 1 (adjacent)
  range2Bonus: number;      // Accuracy bonus at range 2 (close)
  grappleBonusAcc: number;  // Accuracy bonus while in grapple
  grappleBonusDmg: number;  // Damage bonus while in grapple
  defensiveBonus: number;   // Reduces incoming accuracy (counter style)
  ignoresDR: boolean;       // Internal arts bypass armor
  counterChance: number;    // Chance to counter-attack on dodge
}

export const STYLE_COMBAT_MODIFIERS: Record<string, StyleCombatModifiers> = {
  grappling: {
    range1Bonus: 15,         // +15% accuracy at range 1
    range2Bonus: 0,          // No bonus at range 2
    grappleBonusAcc: 10,     // +10% in grapple (stacks with base +15)
    grappleBonusDmg: 3,      // +3 damage in grapple
    defensiveBonus: 0,
    ignoresDR: false,
    counterChance: 0,
  },
  submission: {
    range1Bonus: 5,          // Small bonus at range 1
    range2Bonus: 0,
    grappleBonusAcc: 20,     // +20% accuracy in grapple (finisher style)
    grappleBonusDmg: 5,      // +5 damage in grapple
    defensiveBonus: 0,
    ignoresDR: false,
    counterChance: 0,
  },
  striking: {
    range1Bonus: 10,         // +10% at range 1
    range2Bonus: 10,         // +10% at range 2 (kicks)
    grappleBonusAcc: -10,    // Strikers worse in grapple
    grappleBonusDmg: 0,
    defensiveBonus: 0,
    ignoresDR: false,
    counterChance: 0,
  },
  counter: {
    range1Bonus: 5,          // Small offensive bonus
    range2Bonus: 5,
    grappleBonusAcc: 0,
    grappleBonusDmg: 0,
    defensiveBonus: 10,      // +10% incoming accuracy reduction
    ignoresDR: false,
    counterChance: 30,       // 30% chance to counter on dodge
  },
  internal: {
    range1Bonus: 5,          // Small accuracy bonus
    range2Bonus: 0,
    grappleBonusAcc: -5,     // Internal arts not great in grapple
    grappleBonusDmg: 0,
    defensiveBonus: 5,
    ignoresDR: true,         // Chi attacks bypass armor
    counterChance: 0,
  },
};

// ============ TYPES ============

export interface Technique {
  id: string;
  name: string;
  styleId: string;
  beltRequired: number;
  apCost: number;
  damage?: number;
  effect: string;
  statusApplied?: string[];
  requiresGrapple?: boolean;
  requiresStanding?: boolean;
  requiresProne?: boolean;
  requiresRestrained?: boolean;
  setsGrappleState?: string;
}

export interface TechniqueResult {
  success: boolean;
  hit: boolean;
  damage: number;
  techniqueName: string;
  statusApplied: string[];
  newGrappleState?: GrappleStateType;
  message: string;
}

// ============ TECHNIQUE SELECTION ============

/**
 * Get all techniques available to a unit based on style and belt level.
 */
export function getAvailableTechniques(
  styleId: string,
  beltLevel: number
): Technique[] {
  const style = martialArtsData.styles.find(s => s.id === styleId);
  if (!style) return [];

  return style.techniques.filter(tech => tech.beltRequired <= beltLevel) as Technique[];
}

/**
 * Get techniques that can be used in the current situation.
 */
export function getUsableTechniques(
  unit: SimUnit,
  target: SimUnit
): Technique[] {
  if (!unit.martialArtsStyle || !unit.beltLevel) {
    return [];
  }

  const available = getAvailableTechniques(unit.martialArtsStyle, unit.beltLevel);
  const grappleState = getGrappleState(unit);
  const unitIsProne = isProne(unit);
  const targetIsRestrained = grappleState === 'restrained';

  return available.filter(tech => {
    // Check grapple requirement
    if (tech.requiresGrapple && grappleState === 'none') {
      return false;
    }

    // Check standing requirement
    if (tech.requiresStanding && unitIsProne) {
      return false;
    }

    // Check prone requirement
    if (tech.requiresProne && !unitIsProne) {
      return false;
    }

    // Check restrained requirement
    if (tech.requiresRestrained && !targetIsRestrained) {
      return false;
    }

    return true;
  });
}

/**
 * Select the best technique for the current situation.
 * Smart AI: Uses setup moves (grapple initiators) when needed for combos.
 */
export function selectBestTechnique(
  unit: SimUnit,
  target: SimUnit
): Technique | null {
  const usable = getUsableTechniques(unit, target);
  if (usable.length === 0) return null;

  const grappleState = getGrappleState(unit);
  const notInGrapple = grappleState === 'none';

  // Get all available techniques (not just usable) to check for potential combos
  const allAvailable = unit.martialArtsStyle && unit.beltLevel
    ? getAvailableTechniques(unit.martialArtsStyle, unit.beltLevel)
    : [];

  // Check if we have high-damage techniques that require grapple
  const grappleDamageTechs = allAvailable.filter(t =>
    t.requiresGrapple && (t.damage || 0) >= 10
  );

  // If not in grapple, but have powerful grapple techniques, use a setup move
  if (notInGrapple && grappleDamageTechs.length > 0) {
    // Find a grapple initiator (sets grapple state, doesn't require grapple)
    const initiators = usable.filter(t =>
      t.setsGrappleState && !t.requiresGrapple
    );

    if (initiators.length > 0) {
      // Use the initiator to set up the combo
      return initiators[0];
    }
  }

  // Sort by damage (highest first), then by belt requirement (highest first)
  const sorted = usable.sort((a, b) => {
    const damageA = a.damage || 0;
    const damageB = b.damage || 0;
    if (damageB !== damageA) return damageB - damageA;
    return b.beltRequired - a.beltRequired;
  });

  return sorted[0];
}

// ============ TECHNIQUE EXECUTION ============

/**
 * Calculate hit chance for a technique.
 * Now includes style-specific distance bonuses.
 *
 * @param attacker - The attacking unit
 * @param target - The target unit
 * @param distance - Optional distance in tiles (default 1)
 */
export function calculateTechniqueHitChance(
  attacker: SimUnit,
  target: SimUnit,
  distance: number = 1
): number {
  const attackerMEL = attacker.stats.MEL;
  const targetAGL = target.stats.AGL;
  const beltBonus = attacker.beltLevel || 0;
  const styleId = attacker.martialArtsStyle || 'striking';

  // Base hit: MEL + beltBonus - targetAGL/3 + 50
  let hitChance = attackerMEL + beltBonus - Math.floor(targetAGL / 3) + 50;

  // Get style modifiers
  const styleMods = STYLE_COMBAT_MODIFIERS[styleId] || STYLE_COMBAT_MODIFIERS.striking;

  // Distance-based style bonus
  if (distance <= 1) {
    hitChance += styleMods.range1Bonus;
  } else if (distance <= 2) {
    hitChance += styleMods.range2Bonus;
  }
  // Range 3+ = no bonus (too far for optimal melee)

  // Grapple bonus (easier to hit in grapple)
  if (isGrappling(attacker)) {
    hitChance += 15; // Base grapple bonus
    hitChance += styleMods.grappleBonusAcc; // Style-specific bonus/penalty
  }

  // Prone bonus (easier to hit prone target)
  if (isProne(target)) {
    hitChance += 20;
  }

  // Counter style defensive bonus (applied to INCOMING attacks on target)
  if (target.martialArtsStyle) {
    const targetStyleMods = STYLE_COMBAT_MODIFIERS[target.martialArtsStyle];
    if (targetStyleMods && targetStyleMods.defensiveBonus > 0) {
      // Scale with target's belt level
      const targetBelt = target.beltLevel || 1;
      const defBonus = Math.floor(targetStyleMods.defensiveBonus * (1 + targetBelt / 10));
      hitChance -= defBonus;
    }
  }

  // Clamp to valid range
  return Math.max(10, Math.min(95, hitChance));
}

/**
 * Get the defensive bonus from a unit's martial arts style.
 * Used by external systems (core.ts) for incoming attack calculations.
 */
export function getStyleDefensiveBonus(unit: SimUnit): number {
  if (!unit.martialArtsStyle || !unit.beltLevel) {
    return 0;
  }

  const styleMods = STYLE_COMBAT_MODIFIERS[unit.martialArtsStyle];
  if (!styleMods || styleMods.defensiveBonus === 0) {
    return 0;
  }

  // Scale with belt level: base * (1 + beltLevel/10)
  return Math.floor(styleMods.defensiveBonus * (1 + unit.beltLevel / 10));
}

/**
 * Calculate technique damage with bonuses.
 * Belt is primary damage scaler (technique mastery = power).
 * MEL adds small bonus for trained fighters.
 */
export function calculateTechniqueDamage(
  technique: Technique,
  attacker: SimUnit
): number {
  if (!technique.damage) return 0;

  let damage = technique.damage;
  const styleId = attacker.martialArtsStyle || 'striking';

  // STR bonus for slam techniques (raw power move)
  if (technique.id === 'tech_slam') {
    return Math.floor(attacker.stats.MEL * 0.5);
  }

  // Belt damage bonus (technique mastery = power)
  const beltLevel = attacker.beltLevel || 1;
  damage += Math.floor(beltLevel / 2); // Belt 10 = +5 damage

  // MEL bonus (only for trained fighters)
  if (attacker.beltLevel && attacker.beltLevel > 0) {
    damage += Math.floor((attacker.stats.MEL - 15) / 5);
  }

  // Style-specific grapple damage bonus
  if (isGrappling(attacker)) {
    const styleMods = STYLE_COMBAT_MODIFIERS[styleId];
    if (styleMods) {
      damage += styleMods.grappleBonusDmg;
    }
  }

  return Math.max(1, damage);
}

/**
 * Check if a technique should bypass DR (internal arts).
 */
export function techniqueIgnoresDR(technique: Technique, attacker: SimUnit): boolean {
  // Explicit flag on technique
  if ((technique as any).ignoresDR) {
    return true;
  }

  // Internal arts belt 5+ bypass DR
  if (attacker.martialArtsStyle === 'internal' && (attacker.beltLevel || 0) >= 5) {
    // Only high-damage internal techniques bypass DR
    if ((technique.damage || 0) >= 10) {
      return true;
    }
  }

  return false;
}

/**
 * Execute a technique against a target.
 */
export function executeTechnique(
  attacker: SimUnit,
  target: SimUnit,
  technique: Technique
): TechniqueResult {
  // Calculate hit chance
  const hitChance = calculateTechniqueHitChance(attacker, target);
  const roll = Math.random() * 100;
  const hit = roll < hitChance;

  if (!hit) {
    return {
      success: true,
      hit: false,
      damage: 0,
      techniqueName: technique.name,
      statusApplied: [],
      message: `${attacker.name} attempts ${technique.name} but misses!`,
    };
  }

  // Calculate damage
  const damage = calculateTechniqueDamage(technique, attacker);

  // Apply damage
  target.hp = Math.max(0, target.hp - damage);
  if (target.hp <= 0) {
    target.alive = false;
  }

  // Apply status effects
  const statusApplied: string[] = [];
  const effectsToApply: StatusEffectInstance[] = [];

  if (technique.statusApplied) {
    for (const status of technique.statusApplied) {
      switch (status) {
        case 'prone':
          effectsToApply.push(createProneEffect());
          break;
        case 'stunned':
          effectsToApply.push(createStunnedEffect(1));
          break;
        case 'arm_injured':
          effectsToApply.push(createArmInjuredEffect(3));
          break;
        case 'choked': {
          const isBloodChoke = ['tech_rear_naked', 'tech_guillotine'].includes(technique.id);
          effectsToApply.push(createChokedEffect(isBloodChoke));
          break;
        }
        case 'disoriented':
          effectsToApply.push(createDisorientedEffect(2));
          break;
        case 'drained':
          effectsToApply.push(createDrainedEffect(2));
          break;
        case 'internal_bleeding':
          effectsToApply.push(createInternalBleedingEffect());
          break;
        case 'crippled':
          effectsToApply.push(createCrippledEffect());
          break;
        case 'blinded':
          effectsToApply.push(createBlindedEffect(1));
          break;
        case 'slowed':
          effectsToApply.push(createSlowedEffect(2));
          break;
        case 'silenced':
          effectsToApply.push(createSilencedEffect(1));
          break;
        case 'immobilized':
          effectsToApply.push(createImmobilizedEffect(2));
          break;
        case 'staggered':
          effectsToApply.push(createStaggeredEffect(1));
          break;
        case 'disarmed':
          effectsToApply.push(createDisarmedEffect());
          break;
        case 'bleeding':
          // Basic bleeding from martial arts (elbow strike)
          effectsToApply.push({
            id: 'bleeding',
            duration: 3,
            damagePerTick: 4,
            scaling: 'constant',
            source: 'martial_arts',
          } as StatusEffectInstance);
          break;
        default:
          // Unknown effect - still track it
          break;
      }
      statusApplied.push(status);
    }
  }

  // Apply status effects to target
  for (const effect of effectsToApply) {
    target.statusEffects.push(effect);
  }

  // Handle grapple state transition
  let newGrappleState: GrappleStateType | undefined;
  if (technique.setsGrappleState) {
    const targetState = technique.setsGrappleState as GrappleStateType;
    const result = transitionGrapple(attacker, target, targetState);
    if (result.success) {
      newGrappleState = targetState;
    }
  }

  // Build result message
  let message = `${attacker.name} executes ${technique.name}`;
  if (damage > 0) {
    message += ` for ${damage} damage`;
  }
  if (statusApplied.length > 0) {
    message += ` (${statusApplied.join(', ')})`;
  }
  if (newGrappleState) {
    message += ` [→ ${newGrappleState}]`;
  }
  message += '!';

  return {
    success: true,
    hit: true,
    damage,
    techniqueName: technique.name,
    statusApplied,
    newGrappleState,
    message,
  };
}

/**
 * Try to execute a martial arts attack.
 * Falls back to basic attack if no techniques available.
 */
export function tryMartialArtsAttack(
  attacker: SimUnit,
  target: SimUnit
): TechniqueResult | null {
  // Check if unit has martial arts training
  if (!attacker.martialArtsStyle || !attacker.beltLevel) {
    return null;
  }

  // Select best technique
  const technique = selectBestTechnique(attacker, target);
  if (!technique) {
    return null;
  }

  // Execute technique
  return executeTechnique(attacker, target, technique);
}

// ============ EXPORTS ============

export default {
  getAvailableTechniques,
  getUsableTechniques,
  selectBestTechnique,
  calculateTechniqueHitChance,
  calculateTechniqueDamage,
  executeTechnique,
  tryMartialArtsAttack,
};
