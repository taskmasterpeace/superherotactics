/**
 * Fire Spread System
 * Handles fire propagation based on material flammability
 */

import { ParticleEffectsManager } from './ParticleEffectsManager';

export interface MaterialData {
  flammability: number; // 0-1, higher = more flammable
  name: string;
}

export interface TileData {
  x: number;
  y: number;
  material: string;
  materialData: MaterialData;
}

// Material flammability values from DATABASE_REFERENCE.md
const MATERIAL_FLAMMABILITY: Record<string, number> = {
  wood: 0.9,
  organic: 0.7,
  plastic: 0.6,
  kevlar: 0.2,
  steel: 0.0,
  iron: 0.0,
  titanium: 0.0,
  copper: 0.0,
  glass: 0.0,
  energy: 0.0,
  indestructium: 0.0,
  absorbium: 0.0,
};

export class FireSpreadSystem {
  private particleManager: ParticleEffectsManager;
  private getTileDataCallback: (x: number, y: number) => TileData | null;
  private gridToScreenCallback: (x: number, y: number) => { x: number; y: number };

  // Fire spread chance base values
  private readonly BASE_SPREAD_CHANCE = 0.3; // 30% base chance per turn
  private readonly INTENSITY_MULTIPLIER = 0.05; // +5% per intensity level

  constructor(
    particleManager: ParticleEffectsManager,
    getTileData: (x: number, y: number) => TileData | null,
    gridToScreen: (x: number, y: number) => { x: number; y: number }
  ) {
    this.particleManager = particleManager;
    this.getTileDataCallback = getTileData;
    this.gridToScreenCallback = gridToScreen;
  }

  /**
   * Process fire spread for all active fires
   * Call this at the end of each turn
   */
  processFireSpread(): { newFires: Array<{x: number, y: number}>, damage: Map<string, number> } {
    const activeFires = this.particleManager.getFireTiles();
    const newFires: Array<{x: number, y: number}> = [];
    const damage = new Map<string, number>();

    activeFires.forEach(fire => {
      // Try to spread to adjacent tiles
      const spreadTargets = this.getAdjacentTiles(fire.x, fire.y);

      spreadTargets.forEach(target => {
        // Check if already on fire
        if (this.particleManager.isOnFire(target.x, target.y)) {
          return;
        }

        // Get tile material
        const tileData = this.getTileDataCallback(target.x, target.y);
        if (!tileData) {
          return;
        }

        // Calculate spread chance
        const spreadChance = this.calculateSpreadChance(fire.intensity, tileData.materialData.flammability);

        // Roll for spread
        if (Math.random() < spreadChance) {
          const screenPos = this.gridToScreenCallback(target.x, target.y);

          // New fire has slightly reduced intensity
          const newIntensity = Math.max(1, fire.intensity - 1);

          this.particleManager.createFire(target.x, target.y, screenPos.x, screenPos.y, newIntensity);
          newFires.push({ x: target.x, y: target.y });
        }
      });

      // Reduce fire duration
      fire.duration--;

      // Extinguish if duration expired
      if (fire.duration <= 0) {
        this.particleManager.extinguishFire(fire.x, fire.y);
      }
    });

    // Calculate damage for units standing in fire
    activeFires.forEach(fire => {
      const key = `${fire.x},${fire.y}`;
      damage.set(key, fire.intensity);
    });

    return { newFires, damage };
  }

  /**
   * Calculate spread chance based on fire intensity and material flammability
   */
  private calculateSpreadChance(intensity: number, flammability: number): number {
    if (flammability === 0) {
      return 0; // Non-flammable materials never catch fire
    }

    const intensityBonus = intensity * this.INTENSITY_MULTIPLIER;
    const spreadChance = this.BASE_SPREAD_CHANCE + intensityBonus;

    return spreadChance * flammability;
  }

  /**
   * Get adjacent tiles (4-directional)
   */
  private getAdjacentTiles(x: number, y: number): Array<{x: number, y: number}> {
    return [
      { x: x + 1, y: y },     // East
      { x: x - 1, y: y },     // West
      { x: x, y: y + 1 },     // South
      { x: x, y: y - 1 },     // North
    ];
  }

  /**
   * Get material flammability value
   */
  static getMaterialFlammability(material: string): number {
    return MATERIAL_FLAMMABILITY[material.toLowerCase()] || 0;
  }

  /**
   * Attempt to extinguish fire with water/ice power
   */
  extinguishFireWithPower(x: number, y: number, radius: number = 0): number {
    let extinguished = 0;

    if (radius === 0) {
      // Single tile
      if (this.particleManager.isOnFire(x, y)) {
        this.particleManager.extinguishFire(x, y);
        extinguished = 1;
      }
    } else {
      // Area effect
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance <= radius) {
            const tx = x + dx;
            const ty = y + dy;

            if (this.particleManager.isOnFire(tx, ty)) {
              this.particleManager.extinguishFire(tx, ty);
              extinguished++;
            }
          }
        }
      }
    }

    return extinguished;
  }

  /**
   * Create fire from an attack (fireball, flamethrower, etc.)
   */
  createFireFromAttack(x: number, y: number, intensity: number, radius: number = 0): void {
    const screenPos = this.gridToScreenCallback(x, y);

    if (radius === 0) {
      // Single tile fire
      this.particleManager.createFire(x, y, screenPos.x, screenPos.y, intensity);
    } else {
      // Area fire
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance <= radius) {
            const tx = x + dx;
            const ty = y + dy;
            const pos = this.gridToScreenCallback(tx, ty);

            // Fire intensity decreases with distance
            const distanceIntensity = Math.max(1, Math.floor(intensity * (1 - distance / (radius + 1))));

            this.particleManager.createFire(tx, ty, pos.x, pos.y, distanceIntensity);
          }
        }
      }
    }
  }

  /**
   * Check if a unit is standing in fire and return damage
   */
  checkFireDamage(x: number, y: number): number {
    return this.particleManager.getFireDamage(x, y);
  }
}
