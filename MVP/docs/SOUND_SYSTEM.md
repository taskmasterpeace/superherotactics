# Sound System Documentation

## Overview
The SuperHero Tactics game uses a flexible sound system that allows easy configuration of sounds without code changes. Sounds are mapped through a configuration file and loaded from a catalog of sound assets.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CombatScene.ts                           │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  playSound('weapon.pistol', position)                       ││
│  │       ↓                                                      ││
│  │  Looks up 'weapon.pistol' in soundConfig.json               ││
│  │       ↓                                                      ││
│  │  Gets 'combat.gunshot_pistol' (catalog key)                 ││
│  │       ↓                                                      ││
│  │  SoundManager plays from catalog.json                       ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Key Files

### 1. `public/soundConfig.json`
Maps game actions to sound catalog keys. **Edit this file to change sounds without touching code!**

```json
{
    "weapon.pistol": "combat.gunshot_pistol",   // When a pistol fires
    "weapon.rifle": "combat.gunshot_rifle",     // When a rifle fires
    "impact.crit": "injuries.critical_hit",     // Critical hit impact
    "grenade.frag": "destruction.explosion_medium"  // Frag explosion
}
```

### 2. `public/assets/sounds/catalog.json`
Contains all available sounds with their files and metadata. Generated from the actual sound files in the sounds directory.

### 3. `src/game/systems/SoundManager.ts`
The main sound engine that:
- Loads the catalog
- Plays sounds with random variations
- Supports positional audio
- Manages volume by category

### 4. `src/game/scenes/CombatScene.ts`
Uses `this.playSound(configKey, position)` to play sounds during combat.

## How to Add/Change Sounds

### Changing an Existing Sound
1. Open `public/soundConfig.json`
2. Find the action key (e.g., `weapon.pistol`)
3. Change the value to a different catalog key

### Adding a New Sound Effect
1. Add your `.wav` or `.mp3` file to the appropriate folder in `public/assets/sounds/`
2. Regenerate `catalog.json` or add an entry manually
3. Add a mapping in `soundConfig.json`

### Sound Action Keys Used in Combat

| Action Key | When It Plays | Default Sound |
|------------|---------------|---------------|
| `weapon.pistol` | Pistol attack | `combat.gunshot_pistol` |
| `weapon.rifle` | Rifle/SMG attack | `combat.gunshot_rifle` |
| `weapon.shotgun` | Shotgun attack | `combat.gunshot_shotgun` |
| `weapon.beam` | Laser/Plasma attack | `combat.laser_fire` |
| `weapon.melee` | Sword/Axe/Fist attack | `melee.sword_slash` |
| `weapon.psychic` | Psychic attack | `combat.energy_blast` |
| `impact.crit` | Critical hit lands | `injuries.critical_hit` |
| `impact.flesh` | Normal hit lands | `impacts.bullet_hit_flesh` |
| `impact.melee` | Melee hit lands | `combat.impact_punch` |
| `impact.miss` | Attack misses | `melee.sword_slash` |
| `grenade.throw` | Grenade thrown | `grenades.grenade_throw` |
| `grenade.pin` | Grenade pin pulled | `grenades.grenade_pin` |
| `grenade.frag` | Frag explosion | `destruction.explosion_medium` |
| `grenade.emp` | EMP explosion | `grenades.emp_grenade` |
| `grenade.flash` | Flashbang explosion | `grenades.flash_grenade` |
| `grenade.cryo` | Cryo explosion | `grenades.cryo_grenade` |
| `grenade.incendiary` | Incendiary explosion | `grenades.incendiary_grenade` |
| `status.burning` | Unit catches fire | `elemental.fire_ignite` |
| `status.frozen` | Unit freezes | `elemental.ice_freeze` |
| `status.stunned` | Unit stunned | `injuries.stun_impact` |
| `movement.footstep` | Unit moves | `env_footsteps.step_concrete` |

## Sound Categories (Volume Control)

Each sound belongs to a category with default volume:

| Category | Default Volume | Examples |
|----------|----------------|----------|
| `combat` | 0.7 | Gunshots, explosions |
| `ui` | 0.5 | Button clicks, notifications |
| `character` | 0.6 | Voice lines, reactions |
| `powers` | 0.8 | Superpowers, abilities |
| `environment` | 0.4 | Ambient sounds |
| `martial_arts` | 0.6 | Combat sounds |
| `movement` | 0.3 | Footsteps |
| `ambient` | 0.2 | Background loops |

## Sound Directory Structure

```
public/assets/sounds/
├── catalog.json           # Main sound catalog
├── ambient/               # Background ambience
├── combat/                # Combat sounds (gunshots, impacts)
├── destruction/           # Explosions, breaking
├── elemental/             # Fire, ice, electric effects
├── env_footsteps/         # Footstep sounds
├── firearms/              # Gun sounds
├── grenades/              # Grenade sounds
├── impacts/               # Hit sounds
├── injuries/              # Damage sounds
├── ma_grappling/          # Grapple sounds
├── ma_striking/           # Martial arts strikes
├── melee/                 # Melee weapon sounds
├── powers/                # Superpower sounds
├── status_effects/        # Status effect sounds
└── ui/                    # UI sounds
```

## Code Example: Playing a Sound

In `CombatScene.ts`:

```typescript
// Play weapon sound at attacker's position
this.playSound('weapon.pistol', attacker.position);

// Play impact sound at target's position
this.playSound('impact.crit', target.position);

// Play grenade explosion
this.playSound('grenade.frag', { x: 5, y: 7 });
```

The `playSound` method:
1. Looks up the config key in `soundConfig.json`
2. Gets the catalog key (e.g., `combat.gunshot_pistol`)
3. Passes to `SoundManager.playSound()` with positional audio

## Troubleshooting

### No Sound Playing
1. Check browser console for errors
2. Verify `soundConfig.json` has the action key
3. Verify `catalog.json` has the sound key
4. Check if sound file exists in the folder

### Wrong Sound Playing
1. Check `soundConfig.json` mapping
2. Verify the catalog key points to correct files

### Sound Too Loud/Quiet
Adjust category volumes in `SoundManager.ts` or per-sound in `playSound()` options.
