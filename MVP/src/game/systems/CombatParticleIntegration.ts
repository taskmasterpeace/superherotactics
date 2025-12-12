/**
 * Integration module for particle effects in CombatScene
 * This file provides helper methods to integrate ParticleEffectsManager and FireSpreadSystem
 */

import { ParticleEffectsManager } from './ParticleEffectsManager';
import { FireSpreadSystem, MaterialData, TileData } from './FireSpreadSystem';

export interface IntegrationConfig {
  scene: Phaser.Scene;
  effectsLayer: Phaser.GameObjects.Container;
  gridToScreen: (x: number, y: number) => { x: number; y: number };
  getTileData: (x: number, y: number) => TileData | null;
}

/**
 * CombatParticleIntegration
 * Manages all particle effects and fire spread mechanics for combat
 */
export class CombatParticleIntegration {
  private particleManager: ParticleEffectsManager;
  private fireSystem: FireSpreadSystem;
  private scene: Phaser.Scene;

  constructor(config: IntegrationConfig) {
    this.scene = config.scene;
    this.particleManager = new ParticleEffectsManager(config.scene, config.effectsLayer);
    this.fireSystem = new FireSpreadSystem(
      this.particleManager,
      config.getTileData,
      config.gridToScreen
    );
  }

  /**
   * Apply visual particle effects when a status effect is applied to a unit
   */
  onStatusEffectApplied(unitId: string, effectType: string, x: number, y: number): void {
    // Convert grid to screen coordinates first
    const screenPos = this.getScreenPos(x, y);
    this.particleManager.createStatusEffect(unitId, effectType, screenPos.x, screenPos.y);
  }

  /**
   * Remove particle effects when a status effect is removed
   */
  onStatusEffectRemoved(unitId: string, effectType: string): void {
    this.particleManager.removeStatusEffect(unitId, effectType);
  }

  /**
   * Update particle position when unit moves
   */
  onUnitMoved(unitId: string, x: number, y: number): void {
    const screenPos = this.getScreenPos(x, y);
    this.particleManager.updateStatusEffectPosition(unitId, screenPos.x, screenPos.y);
  }

  /**
   * Remove all particle effects when a unit dies
   */
  onUnitDied(unitId: string): void {
    this.particleManager.removeAllStatusEffects(unitId);
  }

  /**
   * Create fire on a tile (from fire attacks)
   */
  createFire(x: number, y: number, intensity: number = 5): void {
    const screenPos = this.getScreenPos(x, y);
    this.particleManager.createFire(x, y, screenPos.x, screenPos.y, intensity);
  }

  /**
   * Create area fire effect (from explosions, flamethrowers)
   */
  createAreaFire(x: number, y: number, intensity: number, radius: number): void {
    this.fireSystem.createFireFromAttack(x, y, intensity, radius);
  }

  /**
   * Extinguish fire (from water/ice powers)
   */
  extinguishFire(x: number, y: number, radius: number = 0): number {
    return this.fireSystem.extinguishFireWithPower(x, y, radius);
  }

  /**
   * Check if tile is on fire
   */
  isOnFire(x: number, y: number): boolean {
    return this.particleManager.isOnFire(x, y);
  }

  /**
   * Get fire damage for a tile
   */
  getFireDamage(x: number, y: number): number {
    return this.fireSystem.checkFireDamage(x, y);
  }

  /**
   * Create explosion effect
   */
  createExplosion(x: number, y: number, radius: number = 50): void {
    const screenPos = this.getScreenPos(x, y);
    this.particleManager.createExplosion(screenPos.x, screenPos.y, radius);
  }

  /**
   * Create electric arc effect (for lightning powers)
   */
  createElectricArc(x1: number, y1: number, x2: number, y2: number, color: number = 0x00ccff): void {
    const pos1 = this.getScreenPos(x1, y1);
    const pos2 = this.getScreenPos(x2, y2);
    this.particleManager.createElectricArc(pos1.x, pos1.y, pos2.x, pos2.y, color);
  }

  /**
   * Create smoke effect
   */
  createSmoke(x: number, y: number, tint: number = 0x888888): void {
    const screenPos = this.getScreenPos(x, y);
    this.particleManager.createSmoke(screenPos.x, screenPos.y, tint);
  }

  /**
   * Process fire spread at end of turn
   * Returns map of unit positions to fire damage
   */
  processFireSpread(): Map<string, number> {
    const result = this.fireSystem.processFireSpread();

    // Log new fires
    if (result.newFires.length > 0) {
      console.log(`[Fire] Fire spread to ${result.newFires.length} new tiles:`, result.newFires);
    }

    return result.damage;
  }

  /**
   * Update particle systems (call in scene update)
   */
  update(): void {
    this.particleManager.update();
  }

  /**
   * Cleanup all particles
   */
  destroy(): void {
    this.particleManager.destroy();
  }

  /**
   * Helper to get screen position
   * This is a placeholder - should be replaced with actual conversion
   */
  private getScreenPos(x: number, y: number): { x: number; y: number } {
    // This will be overridden by the actual gridToScreen function
    return { x: x * 64, y: y * 64 };
  }
}

/**
 * Helper function to create material data from terrain type
 */
export function getMaterialDataForTerrain(terrain: string): MaterialData {
  // Map terrain types to materials
  const terrainMaterialMap: Record<string, { material: string; flammability: number }> = {
    grass: { material: 'organic', flammability: 0.7 },
    forest: { material: 'wood', flammability: 0.9 },
    water: { material: 'water', flammability: 0.0 },
    rock: { material: 'stone', flammability: 0.0 },
    sand: { material: 'sand', flammability: 0.0 },
    concrete: { material: 'concrete', flammability: 0.0 },
    asphalt: { material: 'asphalt', flammability: 0.1 },
    dirt: { material: 'dirt', flammability: 0.0 },
    mud: { material: 'mud', flammability: 0.0 },
    ice: { material: 'ice', flammability: 0.0 },
    lava: { material: 'lava', flammability: 0.0 },
    void: { material: 'void', flammability: 0.0 },
  };

  const data = terrainMaterialMap[terrain.toLowerCase()] || { material: 'generic', flammability: 0.3 };

  return {
    name: data.material,
    flammability: data.flammability,
  };
}
