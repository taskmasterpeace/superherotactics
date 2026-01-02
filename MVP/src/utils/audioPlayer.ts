/**
 * AudioPlayer - Standalone audio utility for React components
 *
 * Uses HTML5 Audio for direct playback without requiring Phaser.
 * Follows the same sound config/catalog pattern as CombatScene.
 */

interface SoundEntry {
  category: string;
  key: string;
  files: string[];
  variants: number;
  duration_ms: number;
  prompt?: string;
  primary: string;
}

interface SoundCatalog {
  [key: string]: SoundEntry | { generated: string; total_sounds: number; total_files: number };
}

type SoundConfig = Record<string, string>;

class AudioPlayerClass {
  private soundConfig: SoundConfig = {};
  private soundCatalog: SoundCatalog = {};
  private initialized: boolean = false;
  private initPromise: Promise<void> | null = null;
  private enabled: boolean = true;
  private volume: number = 0.5;

  /**
   * Initialize the audio player by loading config and catalog
   * Safe to call multiple times - will only load once
   */
  async init(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.loadConfigs();
    await this.initPromise;
    this.initialized = true;
  }

  private async loadConfigs(): Promise<void> {
    try {
      // Load sound config mapping (action -> catalog key)
      const configResponse = await fetch('/soundConfig.json');
      if (configResponse.ok) {
        this.soundConfig = await configResponse.json();
        console.log('[AudioPlayer] Loaded sound config:', Object.keys(this.soundConfig).length, 'mappings');
      } else {
        console.warn('[AudioPlayer] soundConfig.json not found');
      }
    } catch (error) {
      console.warn('[AudioPlayer] Failed to load sound config:', error);
    }

    try {
      // Load sound catalog (catalog key -> file paths)
      const catalogResponse = await fetch('/assets/sounds/catalog.json');
      if (catalogResponse.ok) {
        this.soundCatalog = await catalogResponse.json();
        console.log('[AudioPlayer] Loaded sound catalog:', Object.keys(this.soundCatalog).length - 1, 'sounds');
      } else {
        console.warn('[AudioPlayer] catalog.json not found');
      }
    } catch (error) {
      console.warn('[AudioPlayer] Failed to load sound catalog:', error);
    }
  }

  /**
   * Play a sound by config key (e.g., 'weapon.pistol', 'combat.explosion_medium')
   * or by direct catalog key (e.g., 'combat.gunshot_pistol')
   */
  async play(soundKey: string, options: { volume?: number } = {}): Promise<void> {
    if (!this.enabled) return;

    // Ensure initialized
    await this.init();

    // First, try to look up in sound config (action -> catalog)
    let catalogKey = this.soundConfig[soundKey];

    // If not found in config, assume it's a direct catalog key
    if (!catalogKey) {
      catalogKey = soundKey;
    }

    const entry = this.soundCatalog[catalogKey] as SoundEntry;
    if (!entry || !entry.files || entry.files.length === 0) {
      console.warn(`[AudioPlayer] Sound not found: ${soundKey} (catalog: ${catalogKey})`);
      return;
    }

    // Pick random variant for natural variation
    const variantIndex = Math.floor(Math.random() * entry.files.length);
    const soundPath = `/assets/${entry.files[variantIndex]}`;

    // Use HTML5 Audio for direct playback
    try {
      const audio = new Audio(soundPath);
      audio.volume = options.volume ?? this.volume;
      await audio.play();
      console.log(`[AudioPlayer] Playing: ${soundKey} -> ${catalogKey}`);
    } catch (error) {
      // Autoplay might be blocked by browser - that's ok
      if (error instanceof Error && error.name === 'NotAllowedError') {
        console.warn(`[AudioPlayer] Autoplay blocked - user interaction required`);
      } else {
        console.error(`[AudioPlayer] Failed to play: ${soundPath}`, error);
      }
    }
  }

  /**
   * Check if sound system is ready
   */
  isReady(): boolean {
    return this.initialized;
  }

  /**
   * Check if a sound exists in the catalog
   */
  hasSound(soundKey: string): boolean {
    const catalogKey = this.soundConfig[soundKey] || soundKey;
    return catalogKey in this.soundCatalog && catalogKey !== '_metadata';
  }

  /**
   * Enable/disable audio
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Set global volume (0-1)
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Get available sounds by category
   */
  getSoundsByCategory(category: string): string[] {
    return Object.entries(this.soundCatalog)
      .filter(([key, entry]) => key !== '_metadata' && (entry as SoundEntry).category === category)
      .map(([key]) => key);
  }
}

// Singleton instance
export const AudioPlayer = new AudioPlayerClass();

// Also export the class for testing
export { AudioPlayerClass };
