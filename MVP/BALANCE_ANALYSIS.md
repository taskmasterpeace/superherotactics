# Combat Balance Analysis Report

## Context
- **Permadeath**: Death should feel punishing
- **Mixed Realism**: Normals die fast, supers tanky
- **Current State**: No powered characters yet

---

## 1. HP Pools (From characterSheet.ts)

| Character Type | Stats | HP Formula | Total HP |
|---------------|-------|------------|----------|
| Average Human | ~15 each | MEL+AGL+STA+STR | **60 HP** |
| Trained Soldier | ~20 each | MEL+AGL+STA+STR | **80 HP** |
| Exceptional | ~25 each | MEL+AGL+STA+STR | **100 HP** |
| Elite/Peak Human | ~35 each | MEL+AGL+STA+STR | **140 HP** |

---

## 2. Weapon Damage Reference

### Melee Weapons
| Weapon | Damage | Type |
|--------|--------|------|
| Brass Knuckles | 5 | SMASHING_MELEE |
| Club/Lead Pipe | 5-8 | BLUNT_WEAPON |
| Knife | 10 | EDGED_SLASHING |
| Katana | 15 | EDGED_SLASHING |
| War Hammer | 20 | BLUNT_WEAPON |

### Firearms
| Weapon | Damage | Type |
|--------|--------|------|
| Light Pistol | 15 | GUNFIRE_BULLET |
| Standard Pistol | 20 | GUNFIRE_BULLET |
| Heavy Pistol | 25 | GUNFIRE_BULLET |
| SMG | 20 | GUNFIRE_BULLET |
| Pump Shotgun | 35 | GUNFIRE_BUCKSHOT |
| Assault Rifle | 30 | GUNFIRE_BULLET |
| Battle Rifle | 35 | GUNFIRE_BULLET |
| Sniper Rifle | 45 | GUNFIRE_BULLET |
| Anti-Materiel | 60 | GUNFIRE_AP |

### Energy Weapons
| Weapon | Damage | Type |
|--------|--------|------|
| Laser Rifle | 40 | ELECTROMAGNETIC_LASER |
| Plasma Rifle | 45 | ENERGY_PLASMA |
| Electric Rifle | 35 | ELECTROMAGNETIC_BOLT |
| Ice Rifle | 35 | ENERGY_ICE |

### Heavy/Explosive
| Weapon | Damage | Type |
|--------|--------|------|
| Rocket Launcher | 50 | EXPLOSION_SHRAPNEL |
| Combat Grenade | 35 | EXPLOSION_SHRAPNEL |

---

## 3. TTK Analysis (No Armor)

### vs Average Human (60 HP)
| Weapon | Damage | Hits to Kill | Assessment |
|--------|--------|--------------|------------|
| Knife | 10 | 6 hits | Slow, realistic |
| Light Pistol | 15 | 4 hits | Reasonable |
| Standard Pistol | 20 | 3 hits | Good |
| Assault Rifle | 30 | 2 hits | Lethal, good |
| Shotgun | 35 | 2 hits | Very lethal |
| Sniper | 45 | 2 hits | Very lethal |
| Rocket | 50 | 2 hits* | Overkill |

**Assessment**: Normals die fast (2-4 hits from serious weapons). **GOOD for permadeath.**

### vs Elite (140 HP)
| Weapon | Damage | Hits to Kill | Assessment |
|--------|--------|--------------|------------|
| Knife | 10 | 14 hits | Too slow |
| Light Pistol | 15 | 10 hits | Long fight |
| Standard Pistol | 20 | 7 hits | Manageable |
| Assault Rifle | 30 | 5 hits | Good firefight |
| Shotgun | 35 | 4 hits | Serious |
| Sniper | 45 | 4 hits | Dangerous |
| Rocket | 50 | 3 hits | Very dangerous |

**Assessment**: Elites can take punishment but aren't invincible. **GOOD balance.**

---

## 4. Armor Effect Analysis

### Armor Effectiveness Multipliers
| Damage Type | Armor Multiplier | Meaning |
|------------|------------------|---------|
| Buckshot | 2.0x | Armor VERY effective |
| Bullet | 1.5x | Armor effective |
| Smashing | 1.2x | Armor helpful |
| Slashing | 1.0x | Normal |
| Piercing | 0.8x | Armor less effective |
| Explosion | 0.7x | Armor weak |
| Thermal | 0.6x | Armor weak |
| AP Rounds | 0.5x | Armor half effective |
| Laser | 0.5x | Armor half effective |
| Electricity | 0.3x | Armor almost useless |
| Poison | 0x | **IGNORES armor** |
| Mental | 0x | **IGNORES armor** |

### Example: Soldier with 15 DR
| Weapon | Base | Effective DR | Final | Hits to Kill (60 HP) |
|--------|------|--------------|-------|---------------------|
| Shotgun (35) | 35 | 30 (DR×2.0) | 5 | 12 hits |
| Assault Rifle (30) | 30 | 22 (DR×1.5) | 8 | 8 hits |
| Sniper (45) | 45 | 22 (DR×1.5) | 23 | 3 hits |
| Laser (40) | 40 | 7 (DR×0.5) | 33 | 2 hits |
| Electric (35) | 35 | 4 (DR×0.3) | 31 | 2 hits |

**Finding**: Armor is VERY effective vs shotguns but nearly useless vs energy weapons.

---

## 5. Origin Modifier Analysis

### Key Multipliers
| Damage Type | vs Biological | vs Robot | vs Energy | vs Undead |
|------------|---------------|----------|-----------|-----------|
| Bullet | 1.0x | **0.5x** | 0.2x | 0.8x |
| Buckshot | 1.0x | **0.7x** | 0.3x | 0.9x |
| Electricity | 1.0x | **2.0x** | 0.5x | 0.6x |
| Laser | 1.0x | **1.3x** | 0.8x | 0.9x |
| Poison | **1.5x** | **0x** | 0.3x | **0x** |
| Mental | **1.2x** | **0x** | 1.0x | 0.5x |
| Slashing | **1.3x** | **0.3x** | 0.1x | 0.7x |
| Thermal | **1.2x** | 0.7x | 0.5x | 0.8x |
| Disintegration | 1.5x | 1.5x | 1.2x | 1.5x |
| Asphyxiation | **2.0x** | **0x** | 0.5x | **0x** |

### Key Tactical Insights:

**vs Robots/Drones:**
- Use: Electricity (2.0x), Laser (1.3x), AP rounds (1.2x)
- Avoid: Bullets (0.5x), Slashing (0.3x), Poison/Mental (0x)

**vs Biological Humans:**
- Use: Asphyxiation (2.0x), Poison (1.5x), Slashing (1.3x)
- Neutral: Bullets, Explosions (1.0x)

**vs Undead:**
- Use: Smashing (1.0x), Thermal (0.8x)
- Avoid: Poison (0x), Asphyxiation (0x)

---

## 6. Special Mechanics

### Cannot Be Dodged
These attacks auto-hit (accuracy still applies, but no dodge roll):
- **Lasers** - Speed of light
- **Explosions** - Area effect
- **Mental Blasts** - Psychic attack
- **Asphyxiation** - Environmental

### Can Impale (Immobilize on Crit)
- Shrapnel
- AP Rounds
- Edged Piercing

### Can Break Bones (Scaling Penalties)
- Smashing (melee & projectile)
- Blunt Weapons
- Buckshot, Bullets
- Explosions

---

## 7. Balance Concerns

### ISSUE: Shotgun vs Armor Too Weak
With 2.0x armor effectiveness, a shotgun (35 dmg) vs 15 DR:
- Effective DR: 30
- Final damage: 5
- This feels too weak for a close-range shotgun

**Recommendation**: Consider reducing buckshot armor effectiveness to 1.5x or adding penetration at close range.

### ISSUE: Energy Weapons Too Strong vs Armor
Laser (40 dmg) vs 15 DR:
- Effective DR: 7.5
- Final damage: 32.5
- This makes energy weapons dominant once available

**Recommendation**: This may be intentional for progression. Monitor playtest.

### GOOD: Poison/Mental vs Robot Immunity
Robots being immune to poison and mental attacks creates tactical variety. Players must adapt loadouts based on enemy types.

### GOOD: Knockback Physics
The force vs weight system means:
- Grenade (160 force) vs Human (STR 15, ~210 lbs): 5 tiles knockback
- Grenade (160 force) vs Tank (STR 36, ~600 lbs): 0 tiles (tanks it)
- Rocket (300 force) vs Tank: 7 tiles knockback

This creates emergent tactical play around super-strong characters.

---

## 8. Recommendations

### For "Mixed Realism" Balance:

1. **Keep current damage values** - TTK is appropriate for permadeath
2. **Review shotgun armor interaction** - 2.0x may be too punishing
3. **Test energy weapon progression** - Should be powerful but rare/expensive
4. **Implement origin types** - Critical for tactical depth
5. **Add armor condition degradation** - Energy/acid should damage armor over time

### Priority Tests Needed:
- [ ] AI vs AI combat with mixed weapon types
- [ ] Robot enemy encounters (electricity should dominate)
- [ ] Armored vs unarmored unit survival rates
- [ ] Knockback chain scenarios with grenades

---

*Generated: Balance Analysis for SuperHero Tactics*
