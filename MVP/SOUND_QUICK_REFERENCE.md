# Sound System Quick Reference

## Quick Start

```typescript
// In CombatScene, sound is ready to use:
this.soundManager.playSound('combat.gunshot_pistol');

// With positional audio:
const listenerPos = {
  x: this.cameras.main.scrollX + this.cameras.main.width / 2,
  y: this.cameras.main.scrollY + this.cameras.main.height / 2,
};
const soundPos = gridToScreen(unitX, unitY, this.offsetX, this.offsetY);

this.soundManager.playSound('combat.gunshot_rifle', {
  position: soundPos,
  listener: listenerPos,
  volume: 0.8,
});
```

## Sound Key Cheat Sheet

### Combat - Gunfire
| Sound Key | Description | Variants |
|-----------|-------------|----------|
| `combat.gunshot_pistol` | 9mm handgun | 2 |
| `combat.gunshot_rifle` | Assault rifle | 2 |
| `combat.gunshot_shotgun` | Pump shotgun | 2 |
| `combat.gunshot_auto` | Automatic burst | 2 |

### Combat - Explosions
| Sound Key | Description | Variants |
|-----------|-------------|----------|
| `combat.explosion_small` | Grenade blast | 2 |
| `combat.explosion_medium` | Medium destruction | 2 |
| `combat.explosion_large` | Building destruction | 2 |

### Combat - Impacts
| Sound Key | Description | Variants |
|-----------|-------------|----------|
| `combat.impact_punch` | Fist impact | 2 |
| `combat.impact_kick` | Heavy kick | 2 |
| `combat.impact_heavy` | Massive impact | 2 |

### Powers - Energy
| Sound Key | Description | Variants |
|-----------|-------------|----------|
| `powers.energy_beam` | Energy beam attack | 2 |
| `powers.psychic_blast` | Psionic attack | 2 |
| `powers.fire_blast` | Fire/heat attack | 2 |
| `powers.ice_blast` | Frost attack | 2 |
| `powers.lightning_bolt` | Electric attack | 2 |

### Powers - Spatial
| Sound Key | Description | Variants |
|-----------|-------------|----------|
| `powers.teleport_away` | Teleport departure | 2 |
| `powers.teleport_arrive` | Teleport arrival | 2 |
| `powers.portal_open` | Portal creation | 2 |
| `powers.phase_shift` | Intangibility | 2 |

### Powers - Defense
| Sound Key | Description | Variants |
|-----------|-------------|----------|
| `powers.shield_activate` | Force field up | 2 |
| `powers.shield_hit` | Shield impact | 2 |
| `powers.heal` | Healing power | 2 |

### Powers - Utility
| Sound Key | Description | Variants |
|-----------|-------------|----------|
| `powers.flight_start` | Take off | 2 |
| `powers.flight_hover` | Hovering | 2 |
| `powers.super_speed` | Speed burst | 2 |
| `powers.invisibility` | Stealth activate | 2 |

### Martial Arts
| Sound Key | Description | Variants |
|-----------|-------------|----------|
| `martial_arts.ma_striking` | Punches/kicks | 3 |
| `martial_arts.ma_grappling` | Grabs/holds | 3 |
| `martial_arts.ma_submission` | Chokes/locks | 3 |
| `martial_arts.ma_throw` | Throws/slams | 3 |

### Character - Vocals
| Sound Key | Description | Variants |
|-----------|-------------|----------|
| `character.grunt_pain` | Male pain | 2 |
| `character.grunt_pain_female` | Female pain | 2 |
| `character.death_male` | Male death | 2 |
| `character.death_female` | Female death | 2 |
| `character.exertion_male` | Male effort | 2 |
| `character.exertion_female` | Female effort | 2 |

### Movement
| Sound Key | Description | Variants |
|-----------|-------------|----------|
| `movement.footstep_normal` | Walking | 3 |
| `movement.footstep_run` | Running | 3 |
| `movement.jump` | Jump/leap | 2 |
| `movement.land` | Landing | 2 |
| `movement.dash` | Dash/burst | 2 |

### Environment
| Sound Key | Description | Variants |
|-----------|-------------|----------|
| `environment.glass_break` | Breaking glass | 2 |
| `environment.wood_break` | Breaking wood | 2 |
| `environment.metal_hit` | Metal impact | 2 |
| `environment.concrete_break` | Concrete breaking | 2 |

### UI
| Sound Key | Description | Variants |
|-----------|-------------|----------|
| `ui.button_click` | Button press | 3 |
| `ui.notification_alert` | Alert/ping | 3 |
| `ui.error` | Error sound | 2 |
| `ui.success` | Success chime | 2 |

## Common Patterns

### Attack Sequence
```typescript
// 1. Weapon fire
this.soundManager.playSound(WEAPON_SOUNDS[weapon], {...});

// 2. Impact (if hit)
this.soundManager.playSound('combat.impact_punch', {...});

// 3. Pain grunt (if survived)
if (target.hp > 0) {
  this.soundManager.playSound('character.grunt_pain', {...});
}

// 4. Death sound (if killed)
if (target.hp <= 0) {
  this.soundManager.playSound('character.death_male', {...});
}
```

### Power Activation
```typescript
// Power sound based on type
const powerSounds = {
  psionic: 'powers.psychic_blast',
  elemental: 'powers.fire_blast',
  spatial: 'powers.teleport_away',
  physical: 'powers.super_speed',
};

this.soundManager.playSound(powerSounds[power.type], {
  volume: 0.7,
  position: userPos,
  listener: cameraPos,
});
```

### Martial Arts
```typescript
const maSounds = {
  striking: 'martial_arts.ma_striking',
  grappling: 'martial_arts.ma_grappling',
  submission: 'martial_arts.ma_submission',
  throw: 'martial_arts.ma_throw',
};

this.soundManager.playSound(maSounds[techniqueType], {...});
```

### Movement
```typescript
// On unit move
this.soundManager.playSound('movement.footstep_normal', {
  volume: 0.3,
  position: unitPos,
  listener: cameraPos,
});

// On dash/sprint
this.soundManager.playSound('movement.dash', {
  volume: 0.5,
  rate: 1.2, // Faster playback
});
```

## Weapon Sound Mapping

```typescript
const WEAPON_SOUNDS: Record<WeaponType, string> = {
  pistol: 'combat.gunshot_pistol',
  rifle: 'combat.gunshot_rifle',
  shotgun: 'combat.gunshot_shotgun',
  beam: 'powers.energy_beam',
  beam_wide: 'powers.energy_beam',
  fist: 'combat.impact_punch',
  psychic: 'powers.psychic_blast',
  plasma_rifle: 'combat.gunshot_rifle',
  super_punch: 'combat.impact_kick',
};
```

## Volume Recommendations

```typescript
// Loud combat
soundManager.playSound('combat.explosion_large', { volume: 1.0 });

// Normal gunfire
soundManager.playSound('combat.gunshot_rifle', { volume: 0.8 });

// Melee/impacts
soundManager.playSound('combat.impact_punch', { volume: 0.7 });

// Character vocals
soundManager.playSound('character.grunt_pain', { volume: 0.6 });

// Powers
soundManager.playSound('powers.energy_beam', { volume: 0.7 });

// Movement
soundManager.playSound('movement.footstep_normal', { volume: 0.3 });

// UI
soundManager.playSound('ui.button_click', { volume: 0.5 });
```

## Distance/Radius Guide

```typescript
// Sound radius by decibel level
const SOUND_RANGES = {
  gunfire: { decibels: 140-165, baseRange: 20-25 tiles },
  explosion: { decibels: 120-180, baseRange: 15-30 tiles },
  powers: { decibels: 70-100, baseRange: 10-18 tiles },
  melee: { decibels: 40-80, baseRange: 5-10 tiles },
  movement: { decibels: 30-50, baseRange: 3-8 tiles },
};
```

## Integration Checklist

- [x] SoundManager created
- [x] Catalog loaded in create()
- [x] Combat sounds preloaded
- [x] Weapon fire sounds integrated
- [x] Impact sounds integrated
- [x] Pain/death vocals integrated
- [x] Power sounds integrated
- [x] Sound radius visualization working
- [ ] Martial arts sounds (see patch file)
- [ ] Movement sounds (optional)
- [ ] Explosion sounds (optional)
- [ ] UI sounds (optional)

## Debugging

```typescript
// Check if sound exists
if (soundManager.hasSound('combat.gunshot_pistol')) {
  console.log('Sound is available');
}

// Get sound info
const info = soundManager.getSoundInfo('combat.gunshot_pistol');
console.log(info); // { category, files, variants, duration_ms }

// List all combat sounds
const combatSounds = soundManager.getSoundsByCategory('combat');
console.log(combatSounds);

// Test a sound
soundManager.playSound('combat.gunshot_pistol', { volume: 1.0 });
```

## Advanced Options

```typescript
// Pitch shift
soundManager.playSound('character.grunt_pain', {
  rate: 0.9,  // Lower pitch
});

// Stereo pan
soundManager.playSound('combat.gunshot_rifle', {
  pan: -0.5,  // More to the left
});

// Delayed playback
soundManager.playSound('combat.explosion_small', {
  delay: 500,  // Wait 500ms
});

// Looping (for ambient)
soundManager.playSound('environment.rain', {
  loop: true,
  volume: 0.2,
});
```
