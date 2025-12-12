# Sound System Implementation - SuperHero Tactics

## Overview

A comprehensive audio system has been implemented for the SuperHero Tactics game, providing immersive combat sounds, power effects, character vocals, and environmental audio.

## Files Created/Modified

### Created Files

1. **`src/game/systems/SoundManager.ts`** - Core sound system
   - Loads sounds from catalog.json (381 sounds)
   - Supports random variations
   - Positional audio for tactical grid
   - Volume control per category
   - Sound radius calculation

2. **`src/game/scenes/CombatScene_SoundIntegration.patch.ts`** - Integration guide
   - Contains additional integration patterns
   - Reference for future sound additions

### Modified Files

1. **`src/game/scenes/CombatScene.ts`**
   - Imported SoundManager
   - Added soundManager property
   - Initialized sound system in create()
   - Integrated sounds into:
     - Weapon firing (gunshots, energy beams)
     - Impact sounds (hits, crits)
     - Character pain grunts
     - Death sounds
     - Power activation sounds

## Sound Categories

The system uses 381 sounds across 8 categories:

### Combat Sounds
- **Gunfire**: pistol, rifle, shotgun, automatic
- **Explosions**: small, medium, large
- **Impacts**: punch, kick, heavy impacts

### Power Sounds
- **Teleportation**: away/arrive
- **Energy**: beams, blasts
- **Elemental**: fire, ice, electric
- **Shields**: activate, deactivate
- **Flight**: start, hover, land

### Martial Arts Sounds
- **Striking**: punches, kicks
- **Grappling**: grabs, holds
- **Submissions**: chokes, locks
- **Throws**: takedowns, slams

### Character Sounds
- **Pain**: male/female grunts
- **Death**: male/female death sounds
- **Exertion**: effort sounds

### Movement Sounds
- **Footsteps**: normal, running
- **Jumping**: jump, land
- **Special**: dash, slide

### Environment Sounds
- **Ambient**: various environments
- **Destruction**: breaking, crumbling

### UI Sounds
- **Clicks**: button presses
- **Notifications**: alerts, pings
- **Feedback**: success, error

## Features

### 1. Random Variations
Each sound can have multiple variants (2-3 files) that are randomly selected for variety:
```typescript
// Automatically picks from gunshot_pistol_01.wav or gunshot_pistol_02.wav
soundManager.playSound('combat.gunshot_pistol');
```

### 2. Positional Audio
Sounds are positioned in 3D space and pan/volume adjust based on camera position:
```typescript
soundManager.playSound('combat.gunshot_rifle', {
  position: { x: 100, y: 150 },
  listener: { x: 200, y: 200 },
  maxDistance: 500,
});
```

### 3. Sound Radius Visualization
When weapons fire, a visual ring expands showing the sound's audible range:
- **Red rings**: Loud sounds (gunfire, 140+ dB)
- **Orange rings**: Medium sounds (explosions, 100+ dB)
- **Yellow rings**: Quiet sounds (melee, 60+ dB)

### 4. Volume Control
Individual control per category:
```typescript
soundManager.setCategoryVolume('combat', 0.7);
soundManager.setCategoryVolume('ui', 0.5);
soundManager.setMasterVolume(0.8);
```

### 5. Sound Calculation
Realistic sound propagation based on decibel levels:
```typescript
const radius = soundManager.calculateSoundRadius({
  decibels: 160,  // Rifle shot
  baseRange: 25   // 25 tiles base range
});
```

## Integration Points

### Weapon Fire
Located in `tryAttackUnit()` around line 4829:
```typescript
const weaponSoundKey = WEAPON_SOUNDS[attacker.weapon];
this.soundManager.playSound(weaponSoundKey, {
  position: attackerScreenPos,
  listener: listenerPos,
  maxDistance: weapon.sound.baseRange * TILE_SIZE,
});
```

### Impact & Pain
Located after damage calculation around line 4730:
```typescript
// Impact sound
this.soundManager.playSound('combat.impact_punch', {...});

// Pain grunt (if survived)
if (target.hp > 0) {
  this.soundManager.playSound('character.grunt_pain', {...});
}
```

### Death
Located in `unitDied()` around line 5434:
```typescript
const deathSound = Math.random() > 0.5
  ? 'character.death_male'
  : 'character.death_female';
this.soundManager.playSound(deathSound, {...});
```

### Powers
Located in `firePowerVisualEffect()` around line 4495:
```typescript
let powerSound = 'powers.energy_beam';
if (power.type === 'psionic') {
  powerSound = 'powers.psychic_blast';
} else if (power.type === 'elemental') {
  powerSound = 'powers.fire_blast';
}
this.soundManager.playSound(powerSound, {...});
```

## Sound Catalog Structure

The catalog is located at `public/assets/sounds/catalog.json`:

```json
{
  "combat.gunshot_pistol": {
    "category": "combat",
    "key": "gunshot_pistol",
    "files": [
      "sounds/combat/gunshot_pistol_01.wav",
      "sounds/combat/gunshot_pistol_02.wav"
    ],
    "variants": 2,
    "duration_ms": 390,
    "primary": "sounds/combat/gunshot_pistol_01.wav"
  }
}
```

## Usage Examples

### Basic Playback
```typescript
// Simple sound
soundManager.playSound('combat.gunshot_pistol');

// With options
soundManager.playSound('powers.teleport_away', {
  volume: 0.8,
  rate: 1.2,  // Pitch
  delay: 100,
});
```

### Positional Audio
```typescript
const listenerPos = {
  x: this.cameras.main.scrollX + this.cameras.main.width / 2,
  y: this.cameras.main.scrollY + this.cameras.main.height / 2,
};

soundManager.playSound('combat.explosion_large', {
  position: explosionScreenPos,
  listener: listenerPos,
  maxDistance: 1000,
  rolloffFactor: 1.2,
});
```

### With Radius Visualization
```typescript
const { sound, radius } = soundManager.playSoundWithRadius(
  'combat.gunshot_rifle',
  { x: tileX, y: tileY },
  { decibels: 160, baseRange: 25 }
);

// Radius can be used for AI hearing detection
if (distanceToEnemy < radius) {
  enemy.alertedTo(shooterPosition);
}
```

## Performance Considerations

1. **Preloading**: Sounds are preloaded by category in `create()`:
```typescript
soundManager.preloadSounds(this, ['combat', 'powers', 'martial_arts', 'character']);
```

2. **Auto-cleanup**: Sounds automatically destroy after completion
3. **Pooling**: The browser handles audio pooling internally
4. **Limit**: Maximum ~20-30 simultaneous sounds recommended

## Future Enhancements

### Not Yet Implemented
1. **Martial Arts Sounds** - Patch file provided with integration code
2. **Movement Sounds** - Footsteps during unit movement
3. **Explosion Sounds** - For area-of-effect powers
4. **Environmental Sounds** - Ambient background audio
5. **UI Sounds** - Button clicks, notifications

### Integration File
See `src/game/scenes/CombatScene_SoundIntegration.patch.ts` for:
- Martial arts technique sounds
- Explosion/AOE sounds
- Movement/footstep sounds
- Complete sound key reference

## Testing

To test the sound system:

1. Start a combat encounter
2. Fire weapons - listen for gunshots with positional audio
3. Watch for sound radius rings expanding from gunfire
4. Listen for impact sounds when hits land
5. Hear pain grunts from damaged units
6. Death sounds when units are killed
7. Power sounds when abilities activate

## Volume Defaults

Default category volumes (can be adjusted):
- **Combat**: 70%
- **UI**: 50%
- **Character**: 60%
- **Powers**: 80%
- **Environment**: 40%
- **Martial Arts**: 60%
- **Movement**: 30%
- **Ambient**: 20%

## API Reference

### SoundManager Methods

```typescript
class SoundManager {
  // Load catalog from JSON
  async loadCatalog(catalogPath?: string): Promise<void>

  // Preload sounds by category
  preloadSounds(scene: Phaser.Scene, categories?: string[], specificKeys?: string[]): void

  // Play a sound
  playSound(soundKey: string, options?: SoundOptions): Phaser.Sound.BaseSound | null

  // Play with auto-calculated radius
  playSoundWithRadius(soundKey: string, position: {x,y}, radiusConfig: SoundRadiusConfig): {sound, radius}

  // Calculate sound radius
  calculateSoundRadius(config: SoundRadiusConfig): number

  // Volume controls
  setMasterVolume(volume: number): void
  setCategoryVolume(category: string, volume: number): void
  getCategoryVolume(category: string): number

  // Utility
  setEnabled(enabled: boolean): void
  stopAllSounds(): void
  getSoundsByCategory(category: string): string[]
  hasSound(soundKey: string): boolean
  getSoundInfo(soundKey: string): SoundEntry | null
}
```

### SoundOptions Interface

```typescript
interface SoundOptions {
  volume?: number;        // 0-1
  loop?: boolean;
  rate?: number;          // Playback speed/pitch
  detune?: number;        // Cents
  seek?: number;          // Start position
  delay?: number;         // Delay before play
  pan?: number;           // -1 to 1
  position?: {x, y};      // World position
  listener?: {x, y};      // Camera position
  maxDistance?: number;   // Audio falloff
  rolloffFactor?: number; // Falloff curve
}
```

## Troubleshooting

### Sounds Not Playing
1. Check browser console for errors
2. Verify catalog.json loaded: `await soundManager.loadCatalog()`
3. Ensure sounds preloaded: `soundManager.preloadSounds(...)`
4. Check sound exists: `soundManager.hasSound('combat.gunshot_pistol')`

### Positional Audio Not Working
1. Verify both `position` and `listener` are provided
2. Check that Web Audio API is enabled (required for panning)
3. Ensure maxDistance is reasonable (try 500-1000)

### Performance Issues
1. Reduce concurrent sounds
2. Lower category volumes
3. Disable sound for distant off-screen events
4. Use `stopAllSounds()` between scenes

## Credits

Sound system designed for SuperHero Tactics tactical combat.
381 sounds generated and cataloged from various sources.
Phaser 3 Web Audio API integration.
