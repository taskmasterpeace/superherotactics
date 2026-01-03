/**
 * Status Effects Module
 *
 * Maps damage types from damageSystem.ts to combat status effects.
 * Processes effects each turn with proper stacking, DoT, and special behaviors.
 *
 * SOURCE OF TRUTH: All effect values come from data/damageSystem.ts
 */

import {
  SimUnit,
  StatusEffectId,
  StatusEffectInstance,
  StatusProcessingResult,
  HitResult,
} from './types';

import {
  getDamageType,
  DamageSubType,
  BleedingEffect,
  BurningEffect,
  FreezeEffect,
  PoisonEffect,
  StunEffect,
} from '../data/damageSystem';

// ============ EFFECT CREATION FROM DAMAGE TYPES ============

/**
 * Create status effects based on damage type and hit result.
 * Uses the authoritative definitions from damageSystem.ts.
 *
 * @param damageType - The damage subtype (e.g., 'EDGED_SLASHING', 'ENERGY_THERMAL')
 * @param hitResult - The hit result (miss, graze, hit, crit)
 * @param targetOrigin - Target's origin type for immunity checks
 * @returns Array of status effects to apply
 */
export function getStatusEffectsForDamage(
  damageType: string,
  hitResult: HitResult,
  targetOrigin?: string
): StatusEffectInstance[] {
  // No effects on miss
  if (hitResult === 'miss') {
    return [];
  }

  const damageTypeDef = getDamageType(damageType as DamageSubType);
  if (!damageTypeDef) {
    return [];
  }

  const effects: StatusEffectInstance[] = [];

  // BLEEDING - from EDGED_SLASHING, EDGED_PIERCING, GUNFIRE_AP, EXPLOSION_SHRAPNEL
  if (damageTypeDef.bleeding?.enabled) {
    const bleed = damageTypeDef.bleeding;
    effects.push(createBleedingEffect(bleed, hitResult, damageType));
  }

  // BURNING - from ENERGY_THERMAL, ELECTROMAGNETIC_LASER
  if (damageTypeDef.burning?.enabled) {
    const burn = damageTypeDef.burning;
    effects.push(createBurningEffect(burn, hitResult, damageType));
  }

  // FREEZE - from ENERGY_ICE
  if (damageTypeDef.freeze?.enabled) {
    const freeze = damageTypeDef.freeze;
    effects.push(createFreezeEffect(freeze, hitResult, damageType));
  }

  // POISON - from TOXIN_POISON, TOXIN_ACID, ASPHYXIATION
  if (damageTypeDef.poison?.enabled) {
    const poison = damageTypeDef.poison;
    // Check origin immunity (poison doesn't affect robotic unless acid)
    if (targetOrigin === 'robotic' && !poison.affectsRobotic) {
      // Immune - no poison effect
    } else if (targetOrigin === 'undead' || targetOrigin === 'construct') {
      // Undead and constructs immune to biological poisons
      if (!poison.affectsRobotic) {
        // Immune
      } else {
        effects.push(createPoisonEffect(poison, hitResult, damageType));
      }
    } else {
      effects.push(createPoisonEffect(poison, hitResult, damageType));
    }
  }

  // STUN - from ELECTROMAGNETIC_BOLT, EXPLOSION_CONCUSSION, MENTAL_BLAST
  if (damageTypeDef.stun?.enabled) {
    const stun = damageTypeDef.stun;
    // Mental doesn't affect robotic
    if (damageType === 'MENTAL_BLAST' && targetOrigin === 'robotic') {
      // Immune
    } else {
      effects.push(createStunEffect(stun, hitResult, damageType));
    }
  }

  return effects;
}

/**
 * Create bleeding effect from damage system definition.
 * EDGED_SLASHING: 4 dmg constant, 4 turns, 5 max stacks, +1 AP, movement penalty
 * EDGED_PIERCING: 3 dmg constant, 3 turns, 3 max stacks
 * GUNFIRE_AP: 3 dmg decreasing, 2 turns, 2 max stacks
 * EXPLOSION_SHRAPNEL: 5 dmg constant, 3 turns, 3 max stacks, movement penalty
 */
function createBleedingEffect(
  bleed: BleedingEffect,
  hitResult: HitResult,
  source: string
): StatusEffectInstance {
  // Crits increase duration by 1
  const durationBonus = hitResult === 'crit' ? 1 : 0;

  return {
    id: 'bleeding',
    duration: bleed.duration + durationBonus,
    stacks: 1,
    maxStacks: bleed.maxStacks,
    damagePerTick: bleed.initialDamage,
    scaling: bleed.scaling,
    damageChange: bleed.scaling === 'decreasing' ? -1 : 0,
    movementPenalty: bleed.movementPenalty || false,
    apPenalty: bleed.actionCostIncrease ? -bleed.actionCostIncrease : undefined,
    source,
  };
}

/**
 * Create burning effect from damage system definition.
 * ENERGY_THERMAL: 5 initial +2/turn, 3 turns, 30% spread, damages armor
 * ELECTROMAGNETIC_LASER: 3 initial +1/turn, 2 turns, 0% spread, damages armor
 */
function createBurningEffect(
  burn: BurningEffect,
  hitResult: HitResult,
  source: string
): StatusEffectInstance {
  // Crits increase initial damage by 50%
  const damageBonus = hitResult === 'crit' ? Math.floor(burn.initialDamage * 0.5) : 0;

  return {
    id: 'burning',
    duration: burn.duration,
    stacks: 1,
    maxStacks: 1, // Burning doesn't stack, refreshes instead
    damagePerTick: burn.initialDamage + damageBonus,
    scaling: 'increasing',
    damageChange: burn.damageIncrease,
    spreadChance: burn.spreadChance * 100, // Convert to percentage
    damagesArmor: burn.armorDamage,
    source,
  };
}

/**
 * Create freeze effect from damage system definition.
 * ENERGY_ICE: 2 turns, -2 AP, can shatter for 20 dmg
 */
function createFreezeEffect(
  freeze: FreezeEffect,
  hitResult: HitResult,
  source: string
): StatusEffectInstance {
  // Crits increase duration by 1
  const durationBonus = hitResult === 'crit' ? 1 : 0;

  return {
    id: 'frozen',
    duration: freeze.duration + durationBonus,
    stacks: 1,
    maxStacks: 1, // Can't stack frozen
    apPenalty: -freeze.apPenalty,
    canShatter: freeze.canShatter,
    shatterDamage: freeze.shatterDamage,
    source,
  };
}

/**
 * Create poison effect from damage system definition.
 * TOXIN_POISON: 10 initial -2/turn, 5 turns, biological only
 * TOXIN_ACID: 8 initial -1/turn, 4 turns, affects armor, affects both bio/robotic
 * ASPHYXIATION: 5 constant, 10 turns, biological only
 */
function createPoisonEffect(
  poison: PoisonEffect,
  hitResult: HitResult,
  source: string
): StatusEffectInstance {
  // Crits increase initial damage by 50%
  const damageBonus = hitResult === 'crit' ? Math.floor(poison.initialDamage * 0.5) : 0;

  // Determine scaling type
  const scaling = poison.damageReduction === 0 ? 'constant' : 'decreasing';

  return {
    id: 'poisoned',
    duration: poison.duration,
    stacks: 1,
    maxStacks: 1, // Poison refreshes, doesn't stack
    damagePerTick: poison.initialDamage + damageBonus,
    scaling,
    damageChange: poison.damageReduction > 0 ? -poison.damageReduction : 0,
    damagesArmor: poison.affectsArmor,
    source,
  };
}

/**
 * Create stun effect from damage system definition.
 * ELECTROMAGNETIC_BOLT: 1 turn, skip turn, has save
 * EXPLOSION_CONCUSSION: 1 turn, no skip, -30% accuracy, has save
 * MENTAL_BLAST: 2 turns, no skip, -40% accuracy, has save
 */
function createStunEffect(
  stun: StunEffect,
  hitResult: HitResult,
  source: string
): StatusEffectInstance {
  // Crits bypass saving throw
  const canSave = hitResult === 'crit' ? false : stun.savingThrow;

  return {
    id: 'stunned',
    duration: stun.duration,
    stacks: 1,
    maxStacks: 1, // Can't stack stuns
    skipTurn: stun.skipTurn,
    accuracyPenalty: stun.accuracyPenalty ? -stun.accuracyPenalty : undefined,
    savingThrow: canSave,
    source,
  };
}

// ============ EFFECT APPLICATION ============

/**
 * Apply a status effect to a unit, handling stacking rules.
 *
 * Stacking rules:
 * - Bleeding: Stacks up to maxStacks, each stack is separate duration
 * - Burning: Doesn't stack, refreshes duration and takes higher damage
 * - Frozen: Doesn't stack, refreshes duration
 * - Poisoned: Doesn't stack, refreshes with higher damage/duration
 * - Stunned: Doesn't stack, takes longer duration
 */
export function applyStatusEffect(
  unit: SimUnit,
  effect: StatusEffectInstance
): void {
  const existingIndex = unit.statusEffects.findIndex(e => e.id === effect.id);

  if (existingIndex === -1) {
    // No existing effect, add new
    unit.statusEffects.push({ ...effect });
    return;
  }

  const existing = unit.statusEffects[existingIndex];

  // Handle by effect type
  switch (effect.id) {
    case 'bleeding':
      // Bleeding stacks - add to stack count up to max
      if (existing.stacks && existing.maxStacks) {
        if (existing.stacks < existing.maxStacks) {
          existing.stacks++;
          // Take longer duration if new effect has more
          existing.duration = Math.max(existing.duration, effect.duration);
        }
        // At max stacks, just refresh duration
        else {
          existing.duration = Math.max(existing.duration, effect.duration);
        }
      }
      break;

    case 'burning':
      // Burning doesn't stack - refresh and take higher damage
      existing.duration = Math.max(existing.duration, effect.duration);
      if (effect.damagePerTick && existing.damagePerTick) {
        existing.damagePerTick = Math.max(existing.damagePerTick, effect.damagePerTick);
      }
      break;

    case 'frozen':
      // Frozen doesn't stack - refresh duration
      existing.duration = Math.max(existing.duration, effect.duration);
      break;

    case 'poisoned':
      // Poison doesn't stack - take worse of both
      existing.duration = Math.max(existing.duration, effect.duration);
      if (effect.damagePerTick && existing.damagePerTick) {
        existing.damagePerTick = Math.max(existing.damagePerTick, effect.damagePerTick);
      }
      break;

    case 'stunned':
      // Stun doesn't stack - take longer duration
      existing.duration = Math.max(existing.duration, effect.duration);
      // Keep skipTurn if either has it
      if (effect.skipTurn) existing.skipTurn = true;
      break;

    default:
      // For other effects, refresh duration
      existing.duration = Math.max(existing.duration, effect.duration);
  }
}

/**
 * Apply multiple status effects to a unit.
 */
export function applyStatusEffects(
  unit: SimUnit,
  effects: StatusEffectInstance[]
): void {
  for (const effect of effects) {
    applyStatusEffect(unit, effect);
  }
}

// ============ EFFECT PROCESSING ============

/**
 * Process all status effects on a unit at the start of their turn.
 * Applies DoT damage, handles special behaviors, decrements duration.
 *
 * @param unit - The unit to process
 * @param staRoll - Optional STA roll for saving throws (0-100)
 * @returns Processing result with damage dealt, effects expired, etc.
 */
export function processStatusEffects(
  unit: SimUnit,
  staRoll?: number
): StatusProcessingResult {
  const result: StatusProcessingResult = {
    unitId: unit.id,
    damageDealt: 0,
    effectsExpired: [],
    turnSkipped: false,
    newEffects: [],
  };

  // Process each effect
  for (let i = unit.statusEffects.length - 1; i >= 0; i--) {
    const effect = unit.statusEffects[i];

    // Check for stun saving throw
    if (effect.id === 'stunned' && effect.savingThrow) {
      const roll = staRoll ?? Math.random() * 100;
      const saveTarget = 50 + (unit.stats.CON - 50); // Base 50%, +1% per CON above 50
      if (roll <= saveTarget) {
        // Saved! Remove stun
        result.effectsExpired.push(effect.id);
        unit.statusEffects.splice(i, 1);
        continue;
      }
    }

    // Check for turn skip (stun)
    if (effect.skipTurn) {
      result.turnSkipped = true;
    }

    // Apply damage over time
    if (effect.damagePerTick && effect.damagePerTick > 0) {
      const stacks = effect.stacks || 1;
      const tickDamage = effect.damagePerTick * stacks;

      result.damageDealt += tickDamage;
      unit.hp = Math.max(0, unit.hp - tickDamage);

      // Update damage for scaling effects
      if (effect.scaling === 'increasing' && effect.damageChange) {
        effect.damagePerTick += effect.damageChange;
      } else if (effect.scaling === 'decreasing' && effect.damageChange) {
        effect.damagePerTick = Math.max(1, effect.damagePerTick + effect.damageChange);
      }
    }

    // Handle burning spread chance
    if (effect.id === 'burning' && effect.spreadChance) {
      const spreadRoll = Math.random() * 100;
      if (spreadRoll <= effect.spreadChance) {
        // Mark that burning could spread (handled by battleRunner with adjacency)
        result.newEffects?.push({
          id: 'burning',
          duration: effect.duration,
          damagePerTick: effect.damagePerTick,
          scaling: effect.scaling,
          damageChange: effect.damageChange,
          spreadChance: effect.spreadChance,
          source: 'spread',
        });
      }
    }

    // Decrement duration
    effect.duration--;

    // Remove expired effects
    if (effect.duration <= 0) {
      result.effectsExpired.push(effect.id);
      unit.statusEffects.splice(i, 1);
    }
  }

  // Check if unit died from DoT
  if (unit.hp <= 0) {
    unit.alive = false;
  }

  return result;
}

/**
 * Check if a unit can act (not skipping turn due to stun).
 */
export function canUnitAct(unit: SimUnit): boolean {
  return !unit.statusEffects.some(e => e.skipTurn && e.duration > 0);
}

/**
 * Get total AP penalty from status effects.
 */
export function getAPPenalty(unit: SimUnit): number {
  let penalty = 0;
  for (const effect of unit.statusEffects) {
    if (effect.apPenalty) {
      penalty += effect.apPenalty;
    }
  }
  return penalty;
}

/**
 * Get total accuracy penalty from status effects.
 */
export function getAccuracyPenalty(unit: SimUnit): number {
  let penalty = 0;
  for (const effect of unit.statusEffects) {
    if (effect.accuracyPenalty) {
      penalty += effect.accuracyPenalty;
    }
  }
  return penalty;
}

/**
 * Get total evasion penalty from status effects.
 * Positive value = easier to hit (reduced evasion)
 */
export function getEvasionPenalty(unit: SimUnit): number {
  let penalty = 0;
  for (const effect of unit.statusEffects) {
    if (effect.evasionPenalty) {
      penalty += effect.evasionPenalty;
    }
  }
  return penalty;
}

/**
 * Check if unit is prone (on the ground).
 */
export function isProne(unit: SimUnit): boolean {
  return unit.statusEffects.some(e => e.id === 'prone');
}

/**
 * Check if unit is stunned.
 */
export function isStunned(unit: SimUnit): boolean {
  return unit.statusEffects.some(e => e.id === 'stunned');
}

/**
 * Create a prone status effect.
 * Prone: -20 evasion (easier to hit), -10 accuracy
 * Duration 1 = until unit uses action to stand
 */
export function createProneEffect(): StatusEffectInstance {
  return {
    id: 'prone',
    duration: 1,  // Lasts until unit stands (spends 1 AP)
    evasionPenalty: 20,    // Easier to hit while on ground
    accuracyPenalty: -10,  // Harder to aim from ground
  };
}

/**
 * Create a stunned status effect.
 * Stunned: Skip turn, can save with CON check
 */
export function createStunnedEffect(duration: number = 1): StatusEffectInstance {
  return {
    id: 'stunned',
    duration,
    skipTurn: true,
    savingThrow: true,  // Can resist with CON check each turn
  };
}

// ============ MARTIAL ARTS EFFECT CREATORS ============

/**
 * Arm Injured: -20% accuracy, -2 MEL (from Armbar)
 */
export function createArmInjuredEffect(duration: number = 3): StatusEffectInstance {
  return {
    id: 'arm_injured',
    duration,
    accuracyPenalty: -20,
    source: 'martial_arts',
  };
}

/**
 * Choked: -2 AP, escalating damage, unconscious after N turns
 * Blood choke (rear naked, guillotine) = 2 turns to KO
 * Air choke = 3 turns to KO
 */
export function createChokedEffect(isBloodChoke: boolean = false): StatusEffectInstance {
  return {
    id: 'choked',
    duration: isBloodChoke ? 2 : 3,
    apPenalty: -2,
    damagePerTick: 5,
    scaling: 'increasing',
    damageChange: 3,
    source: 'martial_arts',
  };
}

/**
 * Disoriented: -15% accuracy (from Nerve Strike)
 */
export function createDisorientedEffect(duration: number = 2): StatusEffectInstance {
  return {
    id: 'disoriented',
    duration,
    accuracyPenalty: -15,
    source: 'martial_arts',
  };
}

/**
 * Drained: -1 AP next turn (from Chi Disruption)
 */
export function createDrainedEffect(duration: number = 2): StatusEffectInstance {
  return {
    id: 'drained',
    duration,
    apPenalty: -1,
    source: 'martial_arts',
  };
}

/**
 * Internal Bleeding: DoT that ignores armor (from Dim Mak)
 */
export function createInternalBleedingEffect(): StatusEffectInstance {
  return {
    id: 'internal_bleeding',
    duration: 5,
    damagePerTick: 8,
    scaling: 'constant',
    source: 'martial_arts',
  };
}

/**
 * Crippled: Movement reduced to 1, -30% evasion (from Twister)
 */
export function createCrippledEffect(): StatusEffectInstance {
  return {
    id: 'crippled',
    duration: -1, // Until healed
    movementPenalty: true,
    evasionPenalty: 30,
    source: 'martial_arts',
  };
}

/**
 * Blinded: -50% accuracy for 1 turn (from Eye Jab)
 */
export function createBlindedEffect(duration: number = 1): StatusEffectInstance {
  return {
    id: 'blinded',
    duration,
    accuracyPenalty: -50,
    source: 'martial_arts',
  };
}

/**
 * Slowed: -2 movement (from Low Kick)
 */
export function createSlowedEffect(duration: number = 2): StatusEffectInstance {
  return {
    id: 'slowed',
    duration,
    movementPenalty: true,
    source: 'martial_arts',
  };
}

/**
 * Silenced: Cannot use powers for 1 turn (from Throat Strike)
 */
export function createSilencedEffect(duration: number = 1): StatusEffectInstance {
  return {
    id: 'silenced',
    duration,
    source: 'martial_arts',
  };
}

/**
 * Immobilized: Cannot move for N turns (from Heel Hook, Joint Lock)
 */
export function createImmobilizedEffect(duration: number = 2): StatusEffectInstance {
  return {
    id: 'immobilized',
    duration,
    movementPenalty: true,
    source: 'martial_arts',
  };
}

/**
 * Staggered: -1 AP, -10% accuracy (from Uppercut)
 */
export function createStaggeredEffect(duration: number = 1): StatusEffectInstance {
  return {
    id: 'staggered',
    duration,
    apPenalty: -1,
    accuracyPenalty: -10,
    source: 'martial_arts',
  };
}

/**
 * Disarmed: Drop weapon, use fists
 */
export function createDisarmedEffect(): StatusEffectInstance {
  return {
    id: 'disarmed',
    duration: -1, // Until weapon recovered
    source: 'martial_arts',
  };
}

/**
 * Grappled: In grapple, movement restricted
 */
export function createGrappledEffect(): StatusEffectInstance {
  return {
    id: 'grappled',
    duration: -1, // Until grapple ends
    movementPenalty: true,
    source: 'martial_arts',
  };
}

/**
 * Check if unit has movement penalty (from bleeding).
 */
export function hasMovementPenalty(unit: SimUnit): boolean {
  return unit.statusEffects.some(e => e.movementPenalty);
}

/**
 * Check if unit is frozen and can be shattered.
 */
export function canShatter(unit: SimUnit): { canShatter: boolean; damage: number } {
  const frozen = unit.statusEffects.find(e => e.id === 'frozen' && e.canShatter);
  if (frozen) {
    return { canShatter: true, damage: frozen.shatterDamage || 20 };
  }
  return { canShatter: false, damage: 0 };
}

/**
 * Apply shatter damage to a frozen unit.
 */
export function applyShatter(unit: SimUnit): number {
  const shatterInfo = canShatter(unit);
  if (!shatterInfo.canShatter) return 0;

  // Remove frozen effect
  const frozenIndex = unit.statusEffects.findIndex(e => e.id === 'frozen');
  if (frozenIndex !== -1) {
    unit.statusEffects.splice(frozenIndex, 1);
  }

  // Apply shatter damage
  unit.hp = Math.max(0, unit.hp - shatterInfo.damage);
  if (unit.hp <= 0) {
    unit.alive = false;
  }

  return shatterInfo.damage;
}

/**
 * Remove all expired effects (duration <= 0).
 */
export function cleanExpiredEffects(unit: SimUnit): StatusEffectId[] {
  const expired: StatusEffectId[] = [];

  for (let i = unit.statusEffects.length - 1; i >= 0; i--) {
    if (unit.statusEffects[i].duration <= 0) {
      expired.push(unit.statusEffects[i].id);
      unit.statusEffects.splice(i, 1);
    }
  }

  return expired;
}

/**
 * Get a human-readable description of all effects on a unit.
 */
export function describeEffects(unit: SimUnit): string[] {
  return unit.statusEffects.map(e => {
    const stacks = e.stacks && e.stacks > 1 ? ` x${e.stacks}` : '';
    const damage = e.damagePerTick ? ` (${e.damagePerTick} dmg/turn)` : '';
    const ap = e.apPenalty ? ` (${e.apPenalty} AP)` : '';
    const acc = e.accuracyPenalty ? ` (${e.accuracyPenalty}% acc)` : '';
    const skip = e.skipTurn ? ' [SKIP TURN]' : '';
    return `${e.id}${stacks} [${e.duration} turns]${damage}${ap}${acc}${skip}`;
  });
}
