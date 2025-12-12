/**
 * SoundManager - Comprehensive audio system for SuperHero Tactics
 *
 * Features:
 * - Loads sounds from catalog.json (381 sounds)
 * - Random variation support (picks from multiple files)
 * - Positional audio for tactical grid
 * - Volume control per category
 * - Sound radius visualization support
 * - Preloading and caching
 */

import Phaser from 'phaser';

export interface SoundEntry {
  category: string;
  key: string;
  files: string[];
  variants: number;
  duration_ms: number;
  prompt?: string;
  primary: string;
}

export interface SoundCatalog {
  [key: string]: SoundEntry | { generated: string; total_sounds: number; total_files: number };
}

export interface SoundOptions {
  volume?: number;        // 0-1, overrides category volume
  loop?: boolean;         // Loop the sound
  rate?: number;          // Playback rate (pitch)
  detune?: number;        // Detune in cents
  seek?: number;          // Start position in seconds
  delay?: number;         // Delay before playing
  pan?: number;           // Stereo pan -1 to 1
  position?: { x: number; y: number };  // World position for positional audio
  listener?: { x: number; y: number };  // Listener position (camera)
  maxDistance?: number;   // Max audible distance
  rolloffFactor?: number; // How quickly sound fades with distance (default 1)
}

export interface SoundRadiusConfig {
  decibels: number;       // Sound intensity in decibels
  baseRange: number;      // Base hearing range in tiles
}

export type SoundCategory =
  | 'combat'
  | 'ui'
  | 'character'
  | 'powers'
  | 'environment'
  | 'martial_arts'
  | 'movement'
  | 'ambient';

const DEFAULT_CATEGORY_VOLUMES: Record<SoundCategory, number> = {
  combat: 0.7,
  ui: 0.5,
  character: 0.6,
  powers: 0.8,
  environment: 0.4,
  martial_arts: 0.6,
  movement: 0.3,
  ambient: 0.2,
};

export class SoundManager {
  private scene: Phaser.Scene;
  private catalog: SoundCatalog = {};
  private categoryVolumes: Record<string, number> = { ...DEFAULT_CATEGORY_VOLUMES };
  private masterVolume: number = 1.0;
  private activeSounds: Phaser.Sound.BaseSound[] = [];
  private preloadedKeys: Set<string> = new Set();
  private enabled: boolean = true;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Load the sound catalog from JSON
   */
  async loadCatalog(catalogPath: string = 'assets/sounds/catalog.json'): Promise<void> {
    try {
      const response = await fetch(catalogPath);
      this.catalog = await response.json();
      console.log('[SoundManager] Loaded catalog:', Object.keys(this.catalog).length - 1, 'sounds');
    } catch (error) {
      console.error('[SoundManager] Failed to load catalog:', error);
    }
  }

  /**
   * Preload sounds by category or specific keys
   */
  preloadSounds(scene: Phaser.Scene, categories?: string[], specificKeys?: string[]): void {
    const entries = Object.entries(this.catalog);

    for (const [fullKey, entry] of entries) {
      // Skip metadata
      if (fullKey === '_metadata') continue;

      const soundEntry = entry as SoundEntry;

      // Filter by category or specific keys
      if (categories && !categories.includes(soundEntry.category)) continue;
      if (specificKeys && !specificKeys.includes(fullKey)) continue;

      // Preload all variants
      soundEntry.files.forEach((filePath, index) => {
        const uniqueKey = `${fullKey}_v${index}`;
        if (!this.preloadedKeys.has(uniqueKey)) {
          // Prepend assets/ since catalog paths are relative (e.g. "sounds/...")
          scene.load.audio(uniqueKey, `assets/${filePath}`);
          this.preloadedKeys.add(uniqueKey);
        }
      });
    }
  }

  /**
   * Play a sound by its catalog key (e.g., "combat.gunshot_pistol")
   */
  playSound(soundKey: string, options: SoundOptions = {}): Phaser.Sound.BaseSound | null {
    if (!this.enabled) return null;

    const entry = this.catalog[soundKey] as SoundEntry;
    if (!entry || !entry.files || entry.files.length === 0) {
      console.warn(`[SoundManager] Sound not found: ${soundKey}`);
      return null;
    }

    // Pick random variant
    const variantIndex = Math.floor(Math.random() * entry.files.length);
    const audioKey = `${soundKey}_v${variantIndex}`;

    // Check if sound is loaded
    if (!this.scene.cache.audio.exists(audioKey)) {
      console.warn(`[SoundManager] Sound not preloaded: ${audioKey}`);
      return null;
    }

    // Calculate volume
    const categoryVolume = this.categoryVolumes[entry.category] ?? 1.0;
    const finalVolume = (options.volume ?? 1.0) * categoryVolume * this.masterVolume;

    // Apply positional audio if position provided
    let positionalVolume = finalVolume;
    let positionalPan = options.pan ?? 0;

    if (options.position && options.listener) {
      const result = this.calculatePositionalAudio(
        options.position,
        options.listener,
        options.maxDistance ?? 20,
        options.rolloffFactor ?? 1
      );
      positionalVolume = finalVolume * result.volume;
      positionalPan = result.pan;
    }

    // Create sound config
    const soundConfig: Phaser.Types.Sound.SoundConfig = {
      volume: positionalVolume,
      loop: options.loop ?? false,
      rate: options.rate ?? 1.0,
      detune: options.detune ?? 0,
      seek: options.seek ?? 0,
      delay: options.delay ?? 0,
    };

    // Play sound
    const sound = this.scene.sound.add(audioKey, soundConfig);

    // Apply pan if needed (only works with Web Audio)
    if (this.scene.sound.context && 'setPan' in sound) {
      (sound as any).setPan(positionalPan);
    }

    sound.play();

    // Track active sounds
    this.activeSounds.push(sound);
    sound.once('complete', () => {
      this.activeSounds = this.activeSounds.filter(s => s !== sound);
      sound.destroy();
    });

    return sound;
  }

  /**
   * Calculate volume and pan based on distance and position
   */
  private calculatePositionalAudio(
    soundPos: { x: number; y: number },
    listenerPos: { x: number; y: number },
    maxDistance: number,
    rolloffFactor: number
  ): { volume: number; pan: number } {
    const dx = soundPos.x - listenerPos.x;
    const dy = soundPos.y - listenerPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Calculate volume falloff
    let volume = 1.0;
    if (distance > 0) {
      // Linear rolloff with configurable factor
      volume = Math.max(0, 1 - (distance / maxDistance) * rolloffFactor);
    }

    // Calculate stereo pan (-1 left, 0 center, 1 right)
    let pan = 0;
    if (distance > 0 && maxDistance > 0) {
      // Pan based on horizontal offset, scaled by distance
      const normalizedX = dx / maxDistance;
      pan = Math.max(-1, Math.min(1, normalizedX));
    }

    return { volume, pan };
  }

  /**
   * Calculate sound radius for visualization
   * Based on decibel level and terrain
   */
  calculateSoundRadius(config: SoundRadiusConfig): number {
    // Simple model: higher decibels = larger radius
    // baseRange is in tiles, decibels modify it
    const decibelMultiplier = config.decibels / 100;
    return config.baseRange * decibelMultiplier;
  }

  /**
   * Play sound with automatic radius calculation
   */
  playSoundWithRadius(
    soundKey: string,
    position: { x: number; y: number },
    radiusConfig: SoundRadiusConfig,
    options: SoundOptions = {}
  ): { sound: Phaser.Sound.BaseSound | null; radius: number } {
    const radius = this.calculateSoundRadius(radiusConfig);
    const sound = this.playSound(soundKey, {
      ...options,
      position,
      maxDistance: radius,
    });

    return { sound, radius };
  }

  /**
   * Set master volume (0-1)
   */
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Set category volume (0-1)
   */
  setCategoryVolume(category: string, volume: number): void {
    this.categoryVolumes[category] = Math.max(0, Math.min(1, volume));
  }

  /**
   * Get category volume
   */
  getCategoryVolume(category: string): number {
    return this.categoryVolumes[category] ?? 1.0;
  }

  /**
   * Enable/disable all sounds
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.stopAllSounds();
    }
  }

  /**
   * Stop all currently playing sounds
   */
  stopAllSounds(): void {
    this.activeSounds.forEach(sound => {
      if (sound.isPlaying) {
        sound.stop();
      }
    });
    this.activeSounds = [];
  }

  /**
   * Get all sound keys by category
   */
  getSoundsByCategory(category: string): string[] {
    return Object.entries(this.catalog)
      .filter(([key, entry]) => key !== '_metadata' && (entry as SoundEntry).category === category)
      .map(([key]) => key);
  }

  /**
   * Check if a sound exists in the catalog
   */
  hasSound(soundKey: string): boolean {
    return soundKey in this.catalog && soundKey !== '_metadata';
  }

  /**
   * Get sound entry info
   */
  getSoundInfo(soundKey: string): SoundEntry | null {
    const entry = this.catalog[soundKey];
    return entry && soundKey !== '_metadata' ? entry as SoundEntry : null;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopAllSounds();
    this.catalog = {};
    this.preloadedKeys.clear();
  }
}
