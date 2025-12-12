---
name: sht-sound-catalog
description: Manage the 381 sound effects catalog. Add sounds to weapons, map actions to audio, configure positional audio for SuperHero Tactics.
---

# SHT Sound Catalog Manager

You manage the comprehensive sound effect catalog with 381 sounds across 8 categories.

## Key Data Files

- `MVP/src/game/systems/SoundManager.ts` - SoundManager class
- `MVP/public/assets/sounds/catalog.json` - Sound catalog
- `MVP/src/data/weaponsWithSounds.ts` - Weapon-sound mappings
- `MVP/public/soundConfig.json` - Configuration

## Sound Categories

| Category | Description | Count |
|----------|-------------|-------|
| combat | Weapon fire, impacts, explosions | ~80 |
| ui | Interface feedback, buttons, notifications | ~30 |
| character | Voice, footsteps, breathing | ~50 |
| powers | Superhuman abilities | ~60 |
| environment | Ambient, weather, machinery | ~40 |
| martial_arts | Hand-to-hand combat | ~50 |
| movement | Character movement, vehicles | ~40 |
| ambient | Background loops, tension music | ~30 |

## Sound Entry Format

```typescript
interface SoundEntry {
  category: string;
  key: string;           // Unique identifier
  files: string[];       // Audio file paths
  variants: number;      // Number of variations
  duration_ms: number;   // Length in milliseconds
  primary: boolean;      // Main variation
}
```

## SoundManager Interface

```typescript
interface SoundOptions {
  volume?: number;       // 0-1
  loop?: boolean;
  rate?: number;         // Playback speed
  detune?: number;       // Pitch shift
  pan?: number;          // -1 (left) to 1 (right)
  position?: { x: number; y: number };  // For positional audio
  maxDistance?: number;  // Falloff distance
}

class SoundManager {
  loadCatalog(): Promise<void>;
  playSound(key: string, options?: SoundOptions): void;
  stopSound(key: string): void;
  setVolume(category: string, volume: number): void;
  preloadSounds(category: string): void;
}
```

## Weapon Sound Properties

From CombatScene.ts:
```typescript
const WEAPONS = {
  pistol: {
    sound: { decibels: 140, baseRange: 20 }
  },
  rifle: {
    sound: { decibels: 160, baseRange: 25 }
  },
  shotgun: {
    sound: { decibels: 165, baseRange: 25 }
  },
  beam: {
    sound: { decibels: 70, baseRange: 15 }
  },
  fist: {
    sound: { decibels: 40, baseRange: 5 }
  },
  psychic: {
    sound: { decibels: 30, baseRange: 5 }
  }
};
```

## Sound Categories Detail

### Combat Sounds
```
gunshot_pistol[1-3]      - Pistol fire variations
gunshot_rifle[1-3]       - Rifle fire
gunshot_shotgun[1-3]     - Shotgun blast
gunshot_auto[1-3]        - Automatic weapons
gunshot_sniper           - Sniper rifle
explosion_small[1-3]     - Small explosions
explosion_medium[1-3]    - Medium explosions
explosion_large          - Large explosion
impact_bullet_flesh[1-3] - Bullet hit body
impact_bullet_metal[1-3] - Bullet hit metal
impact_bullet_wall[1-3]  - Bullet hit wall
reload_pistol            - Pistol reload
reload_rifle             - Rifle reload
reload_shotgun           - Shotgun reload
shell_casing[1-3]        - Shell drop sounds
```

### Martial Arts Sounds
```
punch_impact[1-4]        - Punch hits
kick_impact[1-3]         - Kick hits
punch_whoosh[1-3]        - Punch swing
kick_whoosh[1-2]         - Kick swing
block_impact[1-3]        - Block success
throw_impact[1-2]        - Throw landing
submission_lock          - Joint lock applied
grapple_struggle[1-3]    - Grappling sounds
body_slam                - Slam to ground
takedown_impact          - Takedown landing
```

### Power Sounds
```
energy_beam_fire         - Energy beam discharge
energy_beam_loop         - Continuous beam
energy_charge[1-3]       - Power charging up
teleport_out             - Disappear
teleport_in              - Appear
shield_activate          - Force field on
shield_hit[1-3]          - Shield takes damage
shield_break             - Shield destroyed
flight_start             - Begin flying
flight_loop              - Flight movement
flight_land              - Landing from flight
psychic_blast            - Mental attack
super_strength_impact    - Enhanced punch
healing_effect           - Regeneration
ice_freeze               - Freeze attack
fire_burst               - Fire attack
electric_zap[1-3]        - Electricity
```

### Character Sounds
```
pain_male[1-5]           - Male pain grunts
pain_female[1-5]         - Female pain grunts
death_male[1-3]          - Male death
death_female[1-3]        - Female death
exertion_male[1-3]       - Male effort
exertion_female[1-3]     - Female effort
footstep_concrete[1-4]   - Concrete footsteps
footstep_metal[1-4]      - Metal footsteps
footstep_grass[1-4]      - Grass footsteps
footstep_water[1-4]      - Water footsteps
breathing_heavy          - Heavy breathing
breathing_normal         - Normal breathing
```

### UI Sounds
```
button_click             - Button press
button_hover             - Button hover
menu_open                - Menu opened
menu_close               - Menu closed
notification_alert       - Alert sound
notification_success     - Success sound
notification_error       - Error sound
turn_start               - Turn beginning
turn_end                 - Turn ending
unit_select              - Unit selected
unit_move                - Movement confirmed
action_confirm           - Action confirmed
```

### Environment Sounds
```
wind_light               - Light wind
wind_strong              - Strong wind
rain_light               - Light rain
rain_heavy               - Heavy rain
thunder[1-3]             - Thunder
fire_crackling           - Fire ambience
machinery_hum            - Factory sound
city_traffic             - City ambience
nature_forest            - Forest ambience
water_flowing            - Water sound
explosion_distant[1-3]   - Distant explosions
gunfire_distant          - Distant gunfire
```

## Positional Audio System

Sound volume decreases with distance:
```typescript
function calculateVolume(
  sourcePos: Position,
  listenerPos: Position,
  baseRange: number
): number {
  const distance = Math.sqrt(
    Math.pow(sourcePos.x - listenerPos.x, 2) +
    Math.pow(sourcePos.y - listenerPos.y, 2)
  );

  if (distance >= baseRange) return 0;
  return 1 - (distance / baseRange);
}
```

## Detection System

Sounds alert enemies based on decibels:
```typescript
function calculateAlertRadius(decibels: number): number {
  // Every 10 dB doubles perceived loudness
  // Base: 60 dB = 5 tile radius
  const baseTiles = 5;
  const baseDB = 60;
  return baseTiles * Math.pow(2, (decibels - baseDB) / 10);
}
```

| Weapon | Decibels | Alert Radius |
|--------|----------|--------------|
| Whisper | 30 | 2 tiles |
| Fist | 40 | 3 tiles |
| Psychic | 30 | 2 tiles |
| Beam | 70 | 6 tiles |
| Pistol | 140 | 25+ tiles |
| Rifle | 160 | 40+ tiles |
| Shotgun | 165 | 45+ tiles |

## Adding New Sound

1. Add audio file to `public/assets/sounds/[category]/`
2. Update `catalog.json`:
```json
{
  "category": "powers",
  "key": "new_power_effect",
  "files": ["powers/new_power_effect.mp3"],
  "variants": 1,
  "duration_ms": 500,
  "primary": true
}
```
3. Add weapon mapping if applicable
4. Test with SoundManager.playSound()

## Example Queries

- "Add sound effect for new laser rifle weapon"
- "Configure positional audio for explosion at tile (5,8)"
- "Create sound profile for stealth movement vs normal movement"
- "Map all martial arts techniques to appropriate sounds"
- "Design alert radius system based on weapon decibels"
- "Add variations to punch impact for variety"

## Sound Configuration Template

```yaml
weapon: "new_laser_rifle"
sounds:
  fire:
    key: "laser_rifle_fire"
    decibels: 90
    baseRange: 15
  reload:
    key: "energy_reload"
    decibels: 40
  impact:
    key: "laser_impact"
    decibels: 60
```
