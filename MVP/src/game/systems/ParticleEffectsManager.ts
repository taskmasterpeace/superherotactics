/**
 * Advanced Particle Effects Manager
 * Handles fire, explosions, status effects with full visual impact
 */

import Phaser from 'phaser';
import { ParticleConfig } from './ParticleEffects';

export interface StatusEffectParticle {
  emitter: Phaser.GameObjects.Particles.ParticleEmitter;
  effectType: string;
  duration: number;
  startTime: number;
}

export interface FireTile {
  x: number;
  y: number;
  intensity: number; // 1-10, higher = more damage
  duration: number; // turns remaining
  graphics: Phaser.GameObjects.Graphics;
  emitter: Phaser.GameObjects.Particles.ParticleEmitter;
}

export class ParticleEffectsManager {
  private scene: Phaser.Scene;
  private particlesLayer: Phaser.GameObjects.Container;
  private statusEffectParticles: Map<string, StatusEffectParticle[]> = new Map();
  private fireTiles: Map<string, FireTile> = new Map();

  // Particle textures created programmatically
  private particleTextures: Map<string, string> = new Map();

  constructor(scene: Phaser.Scene, particlesLayer: Phaser.GameObjects.Container) {
    this.scene = scene;
    this.particlesLayer = particlesLayer;
    this.createParticleTextures();
  }

  /**
   * Create simple particle textures programmatically
   */
  private createParticleTextures(): void {
    const graphics = this.scene.add.graphics();

    // Fire particle (orange to red gradient circle)
    graphics.clear();
    graphics.fillStyle(0xff6600, 1);
    graphics.fillCircle(8, 8, 8);
    graphics.generateTexture('particle_fire', 16, 16);
    this.particleTextures.set('fire', 'particle_fire');

    // Ice particle (blue crystal)
    graphics.clear();
    graphics.fillStyle(0x88ddff, 1);
    graphics.fillRect(4, 0, 8, 16);
    graphics.fillRect(0, 6, 16, 4);
    graphics.generateTexture('particle_ice', 16, 16);
    this.particleTextures.set('ice', 'particle_ice');

    // Blood drop
    graphics.clear();
    graphics.fillStyle(0xcc0000, 1);
    graphics.fillCircle(8, 10, 6);
    graphics.fillCircle(8, 6, 4);
    graphics.generateTexture('particle_blood', 16, 16);
    this.particleTextures.set('blood', 'particle_blood');

    // Lightning bolt
    graphics.clear();
    graphics.lineStyle(3, 0x00ccff, 1);
    graphics.beginPath();
    graphics.moveTo(8, 0);
    graphics.lineTo(10, 8);
    graphics.lineTo(6, 8);
    graphics.lineTo(8, 16);
    graphics.strokePath();
    graphics.generateTexture('particle_lightning', 16, 16);
    this.particleTextures.set('lightning', 'particle_lightning');

    // Spark (small bright dot)
    graphics.clear();
    graphics.fillStyle(0xffff00, 1);
    graphics.fillCircle(4, 4, 4);
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(4, 4, 2);
    graphics.generateTexture('particle_spark', 8, 8);
    this.particleTextures.set('spark', 'particle_spark');

    // Smoke/dust
    graphics.clear();
    graphics.fillStyle(0x888888, 0.5);
    graphics.fillCircle(12, 12, 12);
    graphics.generateTexture('particle_smoke', 24, 24);
    this.particleTextures.set('smoke', 'particle_smoke');

    // Explosion debris
    graphics.clear();
    graphics.fillStyle(0xffaa00, 1);
    graphics.fillRect(0, 0, 6, 6);
    graphics.generateTexture('particle_debris', 6, 6);
    this.particleTextures.set('debris', 'particle_debris');

    // Energy pulse
    graphics.clear();
    graphics.fillStyle(0x00ffff, 1);
    graphics.fillCircle(8, 8, 8);
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(8, 8, 4);
    graphics.generateTexture('particle_energy', 16, 16);
    this.particleTextures.set('energy', 'particle_energy');

    // Generic particle
    graphics.clear();
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(4, 4, 4);
    graphics.generateTexture('particle_generic', 8, 8);
    this.particleTextures.set('generic', 'particle_generic');

    graphics.destroy();
  }

  /**
   * Create a fire effect on a tile
   */
  createFire(x: number, y: number, screenX: number, screenY: number, intensity: number = 5): void {
    const key = `${x},${y}`;

    // Don't create duplicate fires
    if (this.fireTiles.has(key)) {
      return;
    }

    // Fire graphics (animated flickering flames)
    const fireGraphics = this.scene.add.graphics();
    fireGraphics.setDepth(95);
    this.particlesLayer.add(fireGraphics);

    // Fire particle emitter
    const emitter = this.scene.add.particles(screenX, screenY, 'particle_fire', {
      speed: { min: 20, max: 60 },
      angle: { min: -110, max: -70 }, // Flames rise upward
      scale: { start: 0.8, end: 0.1 },
      alpha: { start: 1, end: 0 },
      lifespan: 600,
      frequency: 50,
      blendMode: 'ADD',
      tint: [0xff6600, 0xff3300, 0xff9900, 0xffcc00], // Orange/red/yellow
      gravityY: -50 // Flames rise
    });
    emitter.setDepth(96);
    this.particlesLayer.add(emitter);

    const fireTile: FireTile = {
      x,
      y,
      intensity,
      duration: 3 + Math.floor(intensity / 3), // Stronger fires last longer
      graphics: fireGraphics,
      emitter
    };

    this.fireTiles.set(key, fireTile);

    // Animate the fire graphics
    this.animateFire(fireTile, screenX, screenY);
  }

  /**
   * Animate flickering fire graphics
   */
  private animateFire(fire: FireTile, screenX: number, screenY: number): void {
    const animate = () => {
      if (!this.fireTiles.has(`${fire.x},${fire.y}`)) {
        return; // Fire was extinguished
      }

      fire.graphics.clear();

      // Draw flickering flames
      const flameHeight = 30 + Math.random() * 20;
      const flameWidth = 20 + Math.random() * 10;

      fire.graphics.fillStyle(0xff6600, 0.6);
      fire.graphics.fillEllipse(screenX, screenY - flameHeight / 2, flameWidth, flameHeight);

      fire.graphics.fillStyle(0xff9900, 0.5);
      fire.graphics.fillEllipse(screenX, screenY - flameHeight / 3, flameWidth * 0.7, flameHeight * 0.6);

      fire.graphics.fillStyle(0xffcc00, 0.4);
      fire.graphics.fillEllipse(screenX, screenY - flameHeight / 4, flameWidth * 0.4, flameHeight * 0.3);

      // Continue animation
      this.scene.time.delayedCall(100, animate);
    };

    animate();
  }

  /**
   * Extinguish fire on a tile
   */
  extinguishFire(x: number, y: number): void {
    const key = `${x},${y}`;
    const fire = this.fireTiles.get(key);

    if (fire) {
      // Smoke effect when extinguished
      const screenPos = this.getScreenPosition(x, y);
      this.createSmoke(screenPos.x, screenPos.y, 0x666666);

      fire.graphics.destroy();
      fire.emitter.destroy();
      this.fireTiles.delete(key);
    }
  }

  /**
   * Get all active fire tiles
   */
  getFireTiles(): FireTile[] {
    return Array.from(this.fireTiles.values());
  }

  /**
   * Check if a tile is on fire
   */
  isOnFire(x: number, y: number): boolean {
    return this.fireTiles.has(`${x},${y}`);
  }

  /**
   * Get fire damage for a tile
   */
  getFireDamage(x: number, y: number): number {
    const fire = this.fireTiles.get(`${x},${y}`);
    return fire ? fire.intensity : 0;
  }

  /**
   * Create explosion effect
   */
  createExplosion(x: number, y: number, radius: number = 50): void {
    // Flash
    const flash = this.scene.add.circle(x, y, radius * 1.5, 0xffffff);
    flash.setAlpha(1);
    flash.setDepth(150);
    this.particlesLayer.add(flash);

    // Fireball
    const fireball = this.scene.add.circle(x, y, radius, 0xff6600);
    fireball.setAlpha(0.9);
    fireball.setDepth(149);
    this.particlesLayer.add(fireball);

    // Shockwave ring
    const ring = this.scene.add.circle(x, y, 10, 0xff8800, 0);
    ring.setStrokeStyle(4, 0xff8800);
    ring.setDepth(148);
    this.particlesLayer.add(ring);

    // Debris particles
    const debrisEmitter = this.scene.add.particles(x, y, 'particle_debris', {
      speed: { min: 100, max: 300 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0.2 },
      alpha: { start: 1, end: 0 },
      lifespan: 600,
      quantity: 30,
      gravityY: 200,
      tint: [0xff8800, 0xff6600, 0x888888]
    });
    debrisEmitter.setDepth(151);
    this.particlesLayer.add(debrisEmitter);
    debrisEmitter.explode();

    // Smoke
    const smokeEmitter = this.scene.add.particles(x, y, 'particle_smoke', {
      speed: { min: 20, max: 60 },
      angle: { min: -110, max: -70 },
      scale: { start: 0.5, end: 2 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 1500,
      quantity: 15,
      gravityY: -30
    });
    smokeEmitter.setDepth(147);
    this.particlesLayer.add(smokeEmitter);
    smokeEmitter.explode();

    // Flash animation
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 2,
      duration: 100,
      onComplete: () => flash.destroy()
    });

    // Fireball animation
    this.scene.tweens.add({
      targets: fireball,
      alpha: 0,
      scale: 2.5,
      duration: 400,
      onComplete: () => fireball.destroy()
    });

    // Shockwave animation
    this.scene.tweens.add({
      targets: ring,
      radius: radius * 3,
      alpha: 0,
      duration: 500,
      onComplete: () => ring.destroy()
    });

    // Cleanup particle emitters
    this.scene.time.delayedCall(2000, () => {
      debrisEmitter.destroy();
      smokeEmitter.destroy();
    });
  }

  /**
   * Create status effect particles on a character
   */
  createStatusEffect(unitId: string, effectType: string, x: number, y: number, duration: number = -1): void {
    const effects = this.statusEffectParticles.get(unitId) || [];

    let emitter: Phaser.GameObjects.Particles.ParticleEmitter;

    switch (effectType) {
      case 'burning':
        emitter = this.scene.add.particles(x, y, 'particle_fire', {
          speed: { min: 10, max: 30 },
          angle: { min: -110, max: -70 },
          scale: { start: 0.5, end: 0.1 },
          alpha: { start: 0.9, end: 0 },
          lifespan: 500,
          frequency: 80,
          blendMode: 'ADD',
          tint: [0xff6600, 0xff3300, 0xffcc00],
          gravityY: -40
        });
        break;

      case 'bleeding':
        emitter = this.scene.add.particles(x, y + 10, 'particle_blood', {
          speed: { min: 5, max: 20 },
          angle: { min: 70, max: 110 },
          scale: { start: 0.4, end: 0.2 },
          alpha: { start: 1, end: 0.3 },
          lifespan: 800,
          frequency: 300,
          gravityY: 200,
          bounce: 0.3
        });
        break;

      case 'frozen':
        emitter = this.scene.add.particles(x, y, 'particle_ice', {
          speed: { min: 5, max: 15 },
          angle: { min: 0, max: 360 },
          scale: { start: 0.6, end: 0.2 },
          alpha: { start: 0.9, end: 0 },
          lifespan: 1000,
          frequency: 200,
          gravityY: 50,
          rotate: { min: 0, max: 360 }
        });
        break;

      case 'stunned':
        emitter = this.scene.add.particles(x, y - 30, 'particle_spark', {
          speed: { min: 10, max: 30 },
          angle: { min: 0, max: 360 },
          scale: { start: 0.8, end: 0.2 },
          alpha: { start: 1, end: 0 },
          lifespan: 600,
          frequency: 100,
          tint: [0xffff00, 0xffffff]
        });
        break;

      case 'poisoned':
        emitter = this.scene.add.particles(x, y, 'particle_smoke', {
          speed: { min: 5, max: 15 },
          angle: { min: -110, max: -70 },
          scale: { start: 0.3, end: 0.8 },
          alpha: { start: 0.7, end: 0 },
          lifespan: 1200,
          frequency: 150,
          tint: 0x00ff00,
          gravityY: -20
        });
        break;

      case 'emp':
      case 'electric':
        emitter = this.scene.add.particles(x, y, 'particle_lightning', {
          speed: { min: 20, max: 50 },
          angle: { min: 0, max: 360 },
          scale: { start: 0.5, end: 0.1 },
          alpha: { start: 1, end: 0 },
          lifespan: 300,
          frequency: 100,
          tint: [0x00ccff, 0x8844ff, 0xffffff],
          blendMode: 'ADD'
        });
        break;

      case 'shielded':
        emitter = this.scene.add.particles(x, y, 'particle_energy', {
          speed: { min: 5, max: 10 },
          angle: { min: 0, max: 360 },
          scale: { start: 0.4, end: 0.6 },
          alpha: { start: 0.6, end: 0 },
          lifespan: 1000,
          frequency: 200,
          tint: 0x4488ff,
          blendMode: 'ADD'
        });
        break;

      case 'inspired':
        emitter = this.scene.add.particles(x, y - 20, 'particle_spark', {
          speed: { min: 5, max: 15 },
          angle: { min: -110, max: -70 },
          scale: { start: 0.5, end: 0.1 },
          alpha: { start: 0.8, end: 0 },
          lifespan: 800,
          frequency: 150,
          tint: [0xffdd00, 0xffffff],
          blendMode: 'ADD',
          gravityY: -30
        });
        break;

      default:
        // Generic effect
        emitter = this.scene.add.particles(x, y, 'particle_generic', {
          speed: { min: 10, max: 20 },
          angle: { min: 0, max: 360 },
          scale: { start: 0.5, end: 0.1 },
          alpha: { start: 0.8, end: 0 },
          lifespan: 500,
          frequency: 200
        });
    }

    emitter.setDepth(140);
    this.particlesLayer.add(emitter);

    const particle: StatusEffectParticle = {
      emitter,
      effectType,
      duration,
      startTime: this.scene.time.now
    };

    effects.push(particle);
    this.statusEffectParticles.set(unitId, effects);
  }

  /**
   * Update status effect particle position
   */
  updateStatusEffectPosition(unitId: string, x: number, y: number): void {
    const effects = this.statusEffectParticles.get(unitId);
    if (effects) {
      effects.forEach(particle => {
        // Adjust y position based on effect type
        let yOffset = 0;
        if (particle.effectType === 'stunned' || particle.effectType === 'inspired') {
          yOffset = -30;
        } else if (particle.effectType === 'bleeding') {
          yOffset = 10;
        }

        particle.emitter.setPosition(x, y + yOffset);
      });
    }
  }

  /**
   * Remove specific status effect from a unit
   */
  removeStatusEffect(unitId: string, effectType: string): void {
    const effects = this.statusEffectParticles.get(unitId);
    if (effects) {
      const filtered = effects.filter(particle => {
        if (particle.effectType === effectType) {
          particle.emitter.destroy();
          return false;
        }
        return true;
      });

      if (filtered.length > 0) {
        this.statusEffectParticles.set(unitId, filtered);
      } else {
        this.statusEffectParticles.delete(unitId);
      }
    }
  }

  /**
   * Remove all status effects from a unit
   */
  removeAllStatusEffects(unitId: string): void {
    const effects = this.statusEffectParticles.get(unitId);
    if (effects) {
      effects.forEach(particle => particle.emitter.destroy());
      this.statusEffectParticles.delete(unitId);
    }
  }

  /**
   * Create smoke effect
   */
  createSmoke(x: number, y: number, tint: number = 0x888888): void {
    const emitter = this.scene.add.particles(x, y, 'particle_smoke', {
      speed: { min: 20, max: 50 },
      angle: { min: -110, max: -70 },
      scale: { start: 0.5, end: 1.5 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 2000,
      quantity: 20,
      gravityY: -20,
      tint
    });
    emitter.setDepth(145);
    this.particlesLayer.add(emitter);
    emitter.explode();

    this.scene.time.delayedCall(2500, () => emitter.destroy());
  }

  /**
   * Create electric arc between two points
   */
  createElectricArc(x1: number, y1: number, x2: number, y2: number, color: number = 0x00ccff): void {
    const graphics = this.scene.add.graphics();
    graphics.setDepth(145);
    this.particlesLayer.add(graphics);

    // Draw jagged lightning bolt
    const drawLightning = () => {
      graphics.clear();
      graphics.lineStyle(3, color, 1);
      graphics.beginPath();

      let currentX = x1;
      let currentY = y1;
      const steps = 8;

      for (let i = 0; i < steps; i++) {
        const t = (i + 1) / steps;
        const targetX = x1 + (x2 - x1) * t;
        const targetY = y1 + (y2 - y1) * t;

        // Add random jitter
        const jitterX = (Math.random() - 0.5) * 20;
        const jitterY = (Math.random() - 0.5) * 20;

        graphics.lineTo(targetX + jitterX, targetY + jitterY);
        currentX = targetX + jitterX;
        currentY = targetY + jitterY;
      }

      graphics.lineTo(x2, y2);
      graphics.strokePath();
    };

    // Animate flickering
    let flickers = 0;
    const flicker = () => {
      drawLightning();
      flickers++;

      if (flickers < 5) {
        this.scene.time.delayedCall(50, flicker);
      } else {
        graphics.destroy();
      }
    };

    flicker();

    // Spark particles along the arc
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    const emitter = this.scene.add.particles(midX, midY, 'particle_spark', {
      speed: { min: 20, max: 50 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.6, end: 0.1 },
      alpha: { start: 1, end: 0 },
      lifespan: 400,
      quantity: 15,
      tint: color,
      blendMode: 'ADD'
    });
    emitter.setDepth(146);
    this.particlesLayer.add(emitter);
    emitter.explode();

    this.scene.time.delayedCall(500, () => emitter.destroy());
  }

  /**
   * Update - called each frame
   */
  update(): void {
    // Clean up expired status effects
    const now = this.scene.time.now;

    this.statusEffectParticles.forEach((effects, unitId) => {
      const filtered = effects.filter(particle => {
        if (particle.duration > 0) {
          const elapsed = now - particle.startTime;
          if (elapsed > particle.duration) {
            particle.emitter.destroy();
            return false;
          }
        }
        return true;
      });

      if (filtered.length > 0) {
        this.statusEffectParticles.set(unitId, filtered);
      } else {
        this.statusEffectParticles.delete(unitId);
      }
    });
  }

  /**
   * Cleanup all particles
   */
  destroy(): void {
    // Destroy all status effect particles
    this.statusEffectParticles.forEach(effects => {
      effects.forEach(particle => particle.emitter.destroy());
    });
    this.statusEffectParticles.clear();

    // Destroy all fire tiles
    this.fireTiles.forEach(fire => {
      fire.graphics.destroy();
      fire.emitter.destroy();
    });
    this.fireTiles.clear();
  }

  /**
   * Helper to convert grid to screen position
   * This should be replaced with actual conversion from your game
   */
  private getScreenPosition(x: number, y: number): { x: number; y: number } {
    // Placeholder - should use actual grid-to-screen conversion
    return { x: x * 64, y: y * 64 };
  }
}
