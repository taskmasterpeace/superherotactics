# Penetration & Continuation System

## Overview

This system handles what happens when attacks, projectiles, and thrown objects encounter obstacles and whether they continue through to hit additional targets.

**Core Concept**: When damage exceeds an obstacle's HP, the attack punches through and continues with reduced damage.

---

## Part 1: Understanding Penetration

### What Is Penetration?

Penetration occurs when an attack has enough force to pass through an obstacle (wall, cover, person) and continue to potentially hit something behind it.

**Real-World Examples:**
- A high-caliber rifle round punching through drywall
- A superhero's energy beam blasting through a wooden door
- A thrown car smashing through a brick wall and continuing down the street

### The Basic Rule

```
If EFFECTIVE DAMAGE > OBSTACLE HP:
    Attack PENETRATES
    Continuing Damage = Base Damage - (Obstacle HP ÷ 2)

If EFFECTIVE DAMAGE ≤ OBSTACLE HP:
    Attack STOPS
    Obstacle provides full cover
```

### Why "Obstacle HP ÷ 2"?

When calculating continuing damage, we use half the obstacle's HP because:
- The obstacle absorbs some energy stopping the projectile
- But a powerful attack loses less momentum than a weak one
- This creates meaningful differences between weapons

---

## Part 2: Material HP Values

Every material in the game has an HP value representing its durability:

### Construction Materials

| Material | HP | Common Examples |
|----------|-----|-----------------|
| Glass | 10 | Windows, display cases |
| Drywall | 25 | Interior walls, cubicle partitions |
| Plywood | 30 | Cheap construction, temporary barriers |
| Wood (Solid) | 40 | Exterior walls, doors, furniture |
| Brick | 80 | Exterior walls, older buildings |
| Concrete (Standard) | 120 | Modern buildings, floors |
| Concrete (Reinforced) | 180 | Bunkers, foundations |
| Steel (Thin) | 100 | Car bodies, filing cabinets |
| Steel (Structural) | 150 | I-beams, vault walls |
| Steel (Armored) | 200 | Bank vaults, military vehicles |
| Blast-Rated | 300+ | Bunker doors, bomb shelters |

### Cover Objects (from Door_Interaction_System.csv)

| Cover Type | HP | Cover Bonus |
|------------|-----|-------------|
| Wooden Desk | 30 | Light (+1CS) |
| Metal Desk | 50 | Medium (+2CS) |
| Filing Cabinet | 40 | Light (+1CS) |
| Couch | 20 | Light (+1CS) |
| Bookshelf | 35 | Medium (+2CS) |
| Refrigerator | 70 | Medium (+2CS) |
| Dumpster | 80 | Heavy (+3CS) |
| Car Door | 40 | Light (+1CS) |
| Car Hood | 60 | Medium (+2CS) |

### Doors (from Door_Interaction_System.csv)

| Door Type | HP |
|-----------|-----|
| Glass Door | 10 |
| Wooden Interior | 20 |
| Wooden Exterior | 35 |
| Reinforced Wood | 50 |
| Metal Standard | 80 |
| Metal Security | 120 |
| Steel Vault | 200 |
| Blast Door | 350 |

---

## Part 3: Weapon Penetration Multipliers

Not all attacks penetrate equally. Some weapons are designed to punch through materials, while others are designed to stop inside targets.

### Penetration Multiplier

This multiplier applies to the PENETRATION CHECK ONLY (not final damage):

```
Effective Damage (for penetration) = Base Damage × Penetration Multiplier
```

| Ammunition/Attack Type | Penetration Multiplier | Description |
|------------------------|------------------------|-------------|
| Hollow Point | 0.5x | Expands on impact, stops in soft targets |
| Standard/FMJ | 1.0x | Full metal jacket, normal penetration |
| Armor Piercing (AP) | 2.0x | Hardened core, designed to penetrate |
| Tungsten/Depleted Uranium | 2.5x | Military anti-armor rounds |
| Energy Beam | 1.5x | Heat/force cuts through materials |
| Explosive | 0.75x | Force disperses, less penetration |
| Shotgun (Buckshot) | 0.5x | Spreads, poor penetration |
| Shotgun (Slug) | 1.5x | Solid projectile, good penetration |

### Weapon Examples with Penetration

| Weapon | Base Damage | Default Ammo | Effective Penetration |
|--------|-------------|--------------|----------------------|
| Pistol (9mm) | 20 | Standard (1.0x) | 20 |
| Pistol (9mm AP) | 20 | AP (2.0x) | 40 |
| Assault Rifle | 30 | Standard (1.0x) | 30 |
| Assault Rifle (AP) | 30 | AP (2.0x) | 60 |
| Sniper Rifle | 45 | Standard (1.0x) | 45 |
| Sniper Rifle (AP) | 45 | AP (2.0x) | 90 |
| Heavy MG | 40 | AP (2.0x) | 80 |
| Anti-Materiel Rifle | 60 | Tungsten (2.5x) | 150 |

---

## Part 4: Step-by-Step Penetration Resolution

### Step 1: Determine Attack Damage

Roll attack normally using Universal Table. Determine base damage from weapon/power.

**Example**: Assault rifle hits. Base damage = 30.

### Step 2: Check for Obstacles

Is there something between the attacker and target, or is the target behind cover?

**Example**: Target is behind a wooden desk (40 HP).

### Step 3: Calculate Effective Penetration

```
Effective Penetration = Base Damage × Penetration Multiplier
```

**Example**: Using standard ammo (1.0x) → 30 × 1.0 = 30 effective penetration.

### Step 4: Compare to Obstacle HP

```
If Effective Penetration > Obstacle HP → PENETRATES
If Effective Penetration ≤ Obstacle HP → STOPS
```

**Example**: 30 ≤ 40 → Attack STOPS at wooden desk. Target is safe.

### Step 5: (If Penetrates) Calculate Continuing Damage

```
Continuing Damage = Base Damage - (Obstacle HP ÷ 2)
Minimum Continuing Damage = 1 (if penetration occurred)
```

**Alternative Example**: Using AP ammo (2.0x) → 30 × 2.0 = 60 effective.
- 60 > 40 → PENETRATES
- Continuing Damage = 30 - (40 ÷ 2) = 30 - 20 = **10 damage to target**

### Step 6: Check for Additional Obstacles

If the attack penetrates and there's another obstacle/target in the line of fire, repeat from Step 4 using the continuing damage.

---

## Part 5: Worked Examples

### Example 1: Department Store Shooting

**Situation**: Gunman with assault rifle (30 damage, AP rounds) fires at cop hiding behind display shelf.

**Obstacles**:
1. Glass display case (10 HP)
2. Wooden shelf (30 HP)
3. Cop behind shelf

**Resolution**:
- Effective Penetration: 30 × 2.0 = 60
- vs Glass (10 HP): 60 > 10 → Penetrates
  - Continuing: 30 - 5 = 25 damage
- vs Wood Shelf (30 HP): Need new check with continuing damage
  - 25 × 2.0 = 50 vs 30 HP → Penetrates
  - Continuing: 25 - 15 = 10 damage
- **Cop takes 10 damage** despite being behind two layers of cover

### Example 2: Superhero Energy Blast

**Situation**: Hero with Remarkable (40) energy blast fires at villain hiding behind brick wall.

**Attack**: Energy Blast does 40 damage (1.5x penetration for energy)

**Resolution**:
- Effective Penetration: 40 × 1.5 = 60
- vs Brick Wall (80 HP): 60 ≤ 80 → **STOPS**
- Villain is safe behind brick

**But if the hero had Amazing (60) energy blast:**
- Effective Penetration: 60 × 1.5 = 90
- vs Brick Wall (80 HP): 90 > 80 → Penetrates
- Continuing: 60 - 40 = **20 damage to villain**

### Example 3: Pistol vs Different Cover

**Situation**: Standard pistol (20 damage, standard ammo) fires at targets behind various cover.

| Cover | HP | Effective (20×1.0) | Result |
|-------|-----|-------------------|--------|
| Glass Window | 10 | 20 > 10 | Penetrates (15 dmg continues) |
| Drywall | 25 | 20 ≤ 25 | STOPS |
| Wooden Desk | 30 | 20 ≤ 30 | STOPS |
| Car Door | 40 | 20 ≤ 40 | STOPS |

**Same pistol with AP rounds (2.0x):**

| Cover | HP | Effective (20×2.0=40) | Result |
|-------|-----|----------------------|--------|
| Glass Window | 10 | 40 > 10 | Penetrates (15 dmg) |
| Drywall | 25 | 40 > 25 | Penetrates (7.5 dmg) |
| Wooden Desk | 30 | 40 > 30 | Penetrates (5 dmg) |
| Car Door | 40 | 40 = 40 | Barely STOPS |

---

## Part 6: Thrown Object Continuation

Thrown objects work differently because their mass and the thrower's strength create significant momentum.

### The Thrown Object Rule

```
Thrown Object Effective Penetration = Throw Damage + (STR ÷ 5)
```

The STR bonus represents the additional momentum a super-strong character imparts.

### Thrown Object Damage Reminder

From Lifting_Throwing_Projectile_System.csv:

| Object Type | Base Damage |
|-------------|-------------|
| Light (1-10kg) | 5 + STR/10 |
| Medium (11-50kg) | 15 + STR/10 |
| Heavy (51-200kg) | 30 + STR/10 |
| Very Heavy (201-1000kg) | 50 + STR/5 |
| Massive (1001kg+) | 100 + STR/2 |

### Thrown Object Examples

**Example 1: Normal Human Throws Chair**

- STR 30 human throws chair (light, 5 + 3 = 8 damage)
- Effective Penetration: 8 + (30÷5) = 8 + 6 = 14
- vs Person (100 HP): 14 ≤ 100 → Chair stops on impact
- Target takes 8 damage, chair falls

**Example 2: Super (STR 60) Throws Motorcycle**

- STR 60 super throws motorcycle (heavy, 30 + 6 = 36 damage)
- Effective Penetration: 36 + (60÷5) = 36 + 12 = 48
- vs Person (100 HP): 48 ≤ 100 → Motorcycle stops
- Target takes 36 damage, motorcycle stops on them

**Example 3: Powerhouse (STR 80) Throws Car**

- STR 80 hero throws car (very heavy, 50 + 16 = 66 damage)
- Effective Penetration: 66 + (80÷5) = 66 + 16 = 82

**Path of destruction:**
1. vs Person 1 (100 HP): 82 ≤ 100 → Stops? No wait...

Actually, for THROWN OBJECTS, we use a different rule for targets vs obstacles:

### Thrown Object Multi-Target Rule

For people/creatures hit by thrown objects:
```
Object continues if: Throw Damage > Target's Current HP
Continuing Damage = Throw Damage - (Target HP ÷ 4)
```

For obstacles (walls, cover):
```
Object continues if: Effective Penetration > Obstacle HP
Continuing Damage = Throw Damage - (Obstacle HP ÷ 2)
```

**Revised Example 3: STR 80 Hero Throws Car Down Street**

Car stats: 66 damage, 82 effective penetration

1. **Hits Thug 1** (60 HP):
   - 66 > 60 → Car continues!
   - Thug 1 takes 66 damage (DOWN)
   - Continuing: 66 - (60÷4) = 66 - 15 = 51 damage

2. **Hits Thug 2** (60 HP):
   - 51 ≤ 60 → Car STOPS
   - Thug 2 takes 51 damage
   - Car is now embedded/stopped

**Example 4: STR 100 Titan Throws Car**

Car stats: 50 + 20 = 70 damage, 70 + 20 = 90 effective penetration

1. **Through brick wall** (80 HP):
   - 90 > 80 → Penetrates!
   - Continuing: 70 - 40 = 30 damage

2. **Hits person inside** (100 HP):
   - 30 ≤ 100 → Stops
   - Person takes 30 damage
   - Car stops inside building

---

## Part 7: Impact Damage (Sudden Stops)

When a character is knocked back into a wall, or a thrown object hits something it can't penetrate, impact damage occurs.

### Knockback Impact

When a character being knocked back hits a wall:

```
Impact Damage = Remaining Knockback Squares × 5
```

**Example**: Hero punches villain with STR 60 (knockback 8 squares). Villain flies 3 squares and hits brick wall.
- Remaining knockback: 8 - 3 = 5 squares
- Impact damage: 5 × 5 = 25 additional damage
- Villain takes punch damage + 25 impact damage

### Knockback Through Walls

If impact damage exceeds wall HP, character punches through:

```
If Impact Damage > Wall HP:
    Character continues through
    Remaining Knockback reduced by 2
    Impact Damage to character = Wall HP ÷ 2
```

**Example**: STR 80 knockback (10 squares), villain hits drywall (25 HP) after 2 squares.
- Remaining knockback: 8 squares
- Impact damage: 8 × 5 = 40
- 40 > 25 → Punches through drywall!
- Villain takes 12 damage from wall (25÷2)
- Continues with 8 - 2 = 6 squares remaining knockback
- If another wall in path, repeat...

### Thrown Object Impact

When a thrown object stops:

```
Object takes damage = Obstacle HP
If Object HP ≤ 0: Object destroyed/shattered
```

| Thrown Object | Approximate HP |
|---------------|----------------|
| Chair | 15 |
| Table | 30 |
| Motorcycle | 60 |
| Car | 100 |
| Truck | 150 |
| Bus | 200 |

**Example**: Car (100 HP) thrown into reinforced concrete (180 HP)
- Car cannot penetrate
- Car takes 180 damage
- 180 > 100 → Car is destroyed/crumpled on impact

---

## Part 8: Line Attacks and Beams

Some attacks affect everything in a line (laser beams, rail guns, certain super powers).

### Line Attack Penetration

Line attacks check penetration for each target/obstacle in sequence:

```
For each target in line (nearest to farthest):
    1. Check penetration vs current target
    2. If penetrates, calculate continuing damage
    3. Use continuing damage for next target
    4. Repeat until attack stops or exits area
```

**Example: Rail Gun (80 damage, 2.5x penetration)**

Firing down a hallway:
1. **Drywall 1** (25 HP): 200 > 25 → Through (67 damage continues)
2. **Person 1** (100 HP): 67 damage to them, 67-25=42 continues
3. **Drywall 2** (25 HP): 105 > 25 → Through (29 damage continues)
4. **Person 2** (100 HP): 29 damage to them, stops (29 ≤ 100)

---

## Part 9: Powers and Penetration

Super powers have varying penetration based on their nature:

| Power Type | Penetration Multiplier | Notes |
|------------|------------------------|-------|
| Super Strength (melee) | N/A | Uses knockback, not penetration |
| Energy Blast | 1.5x | Heat/force cuts through |
| Fire Generation | 1.25x | Burns through, slower |
| Ice Generation | 0.75x | Tends to shatter/spread |
| Electricity | 1.0x (conductive) / 0.5x (insulated) | Material dependent |
| Psychic Blast | 2.0x | Ignores physical barriers |
| Sonic Attack | 0.5x | Disperses through materials |
| Laser | 2.0x | Concentrated energy |
| Concussive Blast | 1.0x | Raw force |
| Telekinesis (thrown) | Uses thrown object rules | Based on object |

### Special Case: Psychic Attacks

Psychic/mental attacks have high penetration (2.0x) because they ignore physical barriers but are stopped by:
- Mental shields
- Psychic dampening fields
- Sufficient distance (range limits)

Physical cover provides NO protection against psychic attacks.

---

## Part 10: Quick Reference Tables

### Penetration Quick Check

| Weapon + Ammo | Effective Pen | vs Drywall (25) | vs Wood (40) | vs Brick (80) |
|---------------|---------------|-----------------|--------------|---------------|
| Pistol (std) | 20 | STOPS | STOPS | STOPS |
| Pistol (AP) | 40 | Through | Barely through | STOPS |
| Rifle (std) | 30 | Through | STOPS | STOPS |
| Rifle (AP) | 60 | Through | Through | STOPS |
| Sniper (AP) | 90 | Through | Through | Through |
| Heavy MG (AP) | 80 | Through | Through | Barely through |

### Thrown Object by STR

| STR | Car Damage | Effective Pen | Can Penetrate |
|-----|------------|---------------|---------------|
| 40 | 50+8=58 | 66 | Wood, Drywall |
| 60 | 50+12=62 | 74 | Wood, Drywall |
| 80 | 50+16=66 | 82 | Wood, Brick (barely) |
| 100 | 50+20=70 | 90 | Brick |
| 150 | 50+30=80 | 110 | Concrete |

### Impact Damage Reference

| Knockback Remaining | Impact Damage |
|--------------------|---------------|
| 1 square | 5 |
| 2 squares | 10 |
| 3 squares | 15 |
| 4 squares | 20 |
| 5 squares | 25 |
| 6 squares | 30 |
| 8 squares | 40 |
| 10 squares | 50 |

---

## Part 11: GM/Designer Notes

### Balance Considerations

1. **Cover should matter**: Most firefights should have meaningful cover. Standard weapons shouldn't penetrate standard cover (brick, car doors).

2. **AP ammo is tactical choice**: AP rounds penetrate better but may over-penetrate soft targets (reduced stopping power in practice - consider 0.75x damage to unarmored).

3. **Supers change the equation**: STR 80+ characters throwing objects should feel powerful. Cars going through walls is the fantasy we're supporting.

4. **Multiple penetrations rare**: The damage reduction per obstacle means attacks naturally peter out after 2-3 penetrations.

### When NOT to Use Penetration

- **Area attacks**: Explosions don't penetrate, they blast around cover
- **Melee attacks**: Use knockback rules instead
- **Non-damaging effects**: Stun, mind control, etc. have their own rules

### Narrative Flexibility

GMs can adjust obstacle HP on the fly for dramatic effect:
- Dramatic scene? That wall is definitely penetrable
- Need tension? The cover holds... barely
- Superhero moment? The car plows through everything

---

## Summary

**The Core Loop:**
1. Calculate effective penetration (damage × multiplier)
2. Compare to obstacle HP
3. If greater: penetrates, calculate continuing damage
4. Repeat for each obstacle in path
5. Apply final damage to target

**Key Numbers to Remember:**
- Standard ammo = 1.0x penetration
- AP ammo = 2.0x penetration
- Energy = 1.5x penetration
- Thrown objects add STR÷5 to penetration
- Continuing damage = Base - (Obstacle HP ÷ 2)
- Impact damage = Remaining knockback × 5
