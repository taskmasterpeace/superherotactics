/**
 * Shield system helper functions for combat
 */

export interface DamageResult {
  hpDamage: number;
  shieldDamage: number;
  shieldBroken: boolean;
}

export interface Unit {
  hp: number;
  shield: number;
  maxShield: number;
  shieldRegen: number;
}

/**
 * Apply damage to a unit, absorbing with shields first
 * Returns the actual damage dealt to HP and shield damage
 */
export function applyDamageWithShields(unit: Unit, rawDamage: number): DamageResult {
  if (rawDamage <= 0) {
    return { hpDamage: 0, shieldDamage: 0, shieldBroken: false };
  }

  let remainingDamage = rawDamage;
  let shieldDamage = 0;
  let shieldBroken = false;

  // Shields absorb damage first
  if (unit.shield > 0) {
    shieldDamage = Math.min(unit.shield, remainingDamage);
    unit.shield -= shieldDamage;
    remainingDamage -= shieldDamage;

    // Shield broken
    if (unit.shield <= 0) {
      unit.shield = 0;
      shieldBroken = true;
    }
  }

  // Remaining damage goes to HP
  const hpDamage = remainingDamage;
  if (hpDamage > 0) {
    unit.hp = Math.max(0, unit.hp - hpDamage);
  }

  return { hpDamage, shieldDamage, shieldBroken };
}

/**
 * Regenerate shields for a unit
 */
export function regenerateShield(unit: Unit): number {
  if (unit.shieldRegen > 0 && unit.shield < unit.maxShield) {
    const oldShield = unit.shield;
    unit.shield = Math.min(unit.maxShield, unit.shield + unit.shieldRegen);
    const regenAmount = unit.shield - oldShield;
    return regenAmount;
  }
  return 0;
}
