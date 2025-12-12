/**
 * INTEGRATION PATCH FOR CombatScene.ts
 *
 * This file contains the code changes needed to integrate particle effects
 * into CombatScene.ts. Apply these changes to enable fire spread, explosions,
 * and status effect particles.
 *
 * INSTRUCTIONS:
 * 1. Add the imports at the top of CombatScene.ts
 * 2. Add the private field to the CombatScene class
 * 3. Add initialization in the create() method
 * 4. Add the helper methods to the class
 * 5. Add update() call in scene update
 * 6. Modify applyStatusEffect() to trigger particles
 * 7. Modify processTeamStatusEffects() to process fire damage
 * 8. Add explosion particles to relevant attacks
 */

// ============================================================================
// STEP 1: ADD IMPORTS (Add to top of CombatScene.ts after existing imports)
// ============================================================================

import { CombatParticleIntegration, getMaterialDataForTerrain } from '../systems/CombatParticleIntegration';
import { TileData } from '../systems/FireSpreadSystem';

// ============================================================================
// STEP 2: ADD PRIVATE FIELD (Add to CombatScene class properties section)
// ============================================================================

// Around line 660, add this field with other private fields:
private particleEffects?: CombatParticleIntegration;

// ============================================================================
// STEP 3: INITIALIZE IN create() METHOD
// ============================================================================

// In the create() method, after setupLayers() (around line 741), add:

// Initialize particle effects system
this.particleEffects = new CombatParticleIntegration({
  scene: this,
  effectsLayer: this.effectsLayer,
  gridToScreen: (x: number, y: number) => gridToScreen(x, y, this.offsetX, this.offsetY),
  getTileData: (x: number, y: number) => this.getTileDataForFire(x, y),
});

// ============================================================================
// STEP 4: ADD HELPER METHODS (Add these methods to CombatScene class)
// ============================================================================

/**
 * Get tile data for fire spread system
 */
private getTileDataForFire(x: number, y: number): TileData | null {
  if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) {
    return null;
  }

  const tile = this.tiles[y]?.[x];
  if (!tile) {
    return null;
  }

  return {
    x,
    y,
    material: tile.terrain,
    materialData: getMaterialDataForTerrain(tile.terrain),
  };
}

/**
 * Process fire damage for all units
 */
private processFireDamage(): void {
  if (!this.particleEffects) return;

  this.units.forEach(unit => {
    if (unit.hp <= 0) return;

    const fireDamage = this.particleEffects!.getFireDamage(unit.position.x, unit.position.y);

    if (fireDamage > 0) {
      // Apply fire damage
      unit.hp -= fireDamage;

      // Show damage
      const screenPos = gridToScreen(unit.position.x, unit.position.y, this.offsetX, this.offsetY);
      this.showFloatingDamage(screenPos.x, screenPos.y, fireDamage, 0xff6600);

      // Log damage
      this.emitToUI('combat-log', {
        message: `🔥 ${unit.name} takes ${fireDamage} fire damage!`,
        type: 'fire',
      });

      // Apply burning status if not already burning
      const hasBurning = unit.statusEffects.some(e => e.type === 'burning');
      if (!hasBurning) {
        this.applyStatusEffect(unit, 'burning');
      }

      this.updateHealthBar(unit);

      // Check for death
      if (unit.hp <= 0) {
        this.killUnit(unit, 'Fire');
      }
    }
  });
}

// ============================================================================
// STEP 5: ADD update() METHOD CALL
// ============================================================================

// If CombatScene doesn't have an update() method, add this:

update(): void {
  if (this.particleEffects) {
    this.particleEffects.update();
  }
}

// If CombatScene already has an update() method, add the particle update call inside it.

// ============================================================================
// STEP 6: MODIFY applyStatusEffect() TO TRIGGER PARTICLES
// ============================================================================

// In applyStatusEffect() method (around line 1753), add this code after line 1779:

// Trigger particle effects
if (this.particleEffects) {
  const screenPos = gridToScreen(unit.position.x, unit.position.y, this.offsetX, this.offsetY);
  this.particleEffects.onStatusEffectApplied(unit.id, effectType, unit.position.x, unit.position.y);
}

// ============================================================================
// STEP 7: MODIFY processTeamStatusEffects() TO PROCESS FIRE
// ============================================================================

// In processTeamStatusEffects() method (around line 1824), add at the END of the method:

// Process fire spread and damage
if (this.particleEffects) {
  const fireDamageMap = this.particleEffects.processFireSpread();

  // Apply fire damage to units
  this.processFireDamage();
}

// ============================================================================
// STEP 8: ADD PARTICLE EFFECTS TO SPECIFIC POWERS/ATTACKS
// ============================================================================

// Find the fireball power execution (around line 4000+) and add explosion:

// In the fireball/explosive power execution, add:
if (this.particleEffects) {
  this.particleEffects.createExplosion(target.position.x, target.position.y, 60);

  // Create fire on impact
  if (power.id === 'fireball') {
    this.particleEffects.createAreaFire(target.position.x, target.position.y, 5, power.radius || 1);
  }
}

// For lightning/electric powers, add arc effect:
if (this.particleEffects && (power.id === 'lightningChain' || power.type === 'electric')) {
  const attackerPos = gridToScreen(attacker.position.x, attacker.position.y, this.offsetX, this.offsetY);
  const targetPos = gridToScreen(target.position.x, target.position.y, this.offsetX, this.offsetY);
  this.particleEffects.createElectricArc(
    attacker.position.x,
    attacker.position.y,
    target.position.x,
    target.position.y
  );
}

// ============================================================================
// STEP 9: UPDATE UNIT MOVEMENT TO UPDATE PARTICLE POSITIONS
// ============================================================================

// In the unit movement code (wherever unit.position is updated), add:

if (this.particleEffects) {
  this.particleEffects.onUnitMoved(unit.id, unit.position.x, unit.position.y);
}

// ============================================================================
// STEP 10: CLEANUP ON UNIT DEATH
// ============================================================================

// In killUnit() method, add:

if (this.particleEffects) {
  this.particleEffects.onUnitDied(unit.id);
}

// ============================================================================
// STEP 11: ADD ICE/WATER POWERS TO EXTINGUISH FIRE
// ============================================================================

// For ice bolt or water powers, add fire extinguishing:

if (this.particleEffects && (power.id === 'iceBolt' || power.type === 'cold')) {
  const extinguished = this.particleEffects.extinguishFire(target.position.x, target.position.y, 1);

  if (extinguished > 0) {
    this.emitToUI('combat-log', {
      message: `❄️ Ice extinguished ${extinguished} fire(s)!`,
      type: 'power',
    });
  }
}

// ============================================================================
// EXAMPLE: COMPLETE MODIFIED applyStatusEffect() METHOD
// ============================================================================

/**
 * This is what the modified applyStatusEffect should look like:
 */
/*
private applyStatusEffect(unit: Unit, effectType: StatusEffectType): void {
  const effectDef = STATUS_EFFECTS[effectType];
  if (!effectDef) return;

  // Check if already has this effect
  const existingIdx = unit.statusEffects.findIndex(e => e.type === effectType);

  if (existingIdx >= 0) {
    if (effectDef.stackable) {
      // Stack the effect
      unit.statusEffects[existingIdx].stacks = (unit.statusEffects[existingIdx].stacks || 1) + 1;
      unit.statusEffects[existingIdx].duration = effectDef.duration;
    } else {
      // Refresh duration
      unit.statusEffects[existingIdx].duration = effectDef.duration;
    }
  } else {
    // Add new effect
    unit.statusEffects.push({
      type: effectType,
      duration: effectDef.duration,
      stacks: 1,
    });
  }

  this.updateStatusIcons(unit);
  this.emitToUI('status-applied', { unitId: unit.id, effect: effectType, emoji: effectDef.emoji });

  // NEW: Trigger particle effects
  if (this.particleEffects) {
    this.particleEffects.onStatusEffectApplied(unit.id, effectType, unit.position.x, unit.position.y);
  }
}
*/

// ============================================================================
// EXAMPLE: COMPLETE MODIFIED processTeamStatusEffects() METHOD
// ============================================================================

/**
 * This is what the modified processTeamStatusEffects should look like:
 */
/*
private processTeamStatusEffects(team: 'blue' | 'red'): void {
  const teamUnits = Array.from(this.units.values()).filter(u => u.team === team && u.hp > 0);

  for (const unit of teamUnits) {
    const result = this.processStatusEffects(unit);

    // Log messages
    for (const msg of result.messages) {
      this.emitToUI('combat-log', { message: msg, type: 'status' });
    }

    // Apply DOT damage
    if (result.damage > 0) {
      unit.hp -= result.damage;
      this.updateHealthBar(unit);

      // Show floating damage
      const screenPos = gridToScreen(unit.position.x, unit.position.y, this.offsetX, this.offsetY);
      this.showFloatingDamage(screenPos.x, screenPos.y, result.damage, 0xff0000);

      // Check for death from DOT
      if (unit.hp <= 0) {
        this.killUnit(unit, 'Status Effect');
      }
    }
  }

  // NEW: Process fire spread and damage
  if (this.particleEffects) {
    this.particleEffects.processFireSpread();
    this.processFireDamage();
  }
}
*/

// ============================================================================
// END OF INTEGRATION PATCH
// ============================================================================

export {};
