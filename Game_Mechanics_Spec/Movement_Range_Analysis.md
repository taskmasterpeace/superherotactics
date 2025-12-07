# Movement vs Range Balance Analysis

## Core Problem

**Question**: How many shots can a ranged attacker get before a melee rusher closes the gap?

---

## Base Assumptions

| Parameter | Value |
|-----------|-------|
| Movement per AP | 1 square |
| Base AP per turn | 6 |
| Attack AP cost | 2-3 AP |
| Move-then-attack | Yes (remaining AP) |

---

## Scenario Analysis

### Scenario 1: Pistol Duel (20 squares apart)

```
Turn 0: [Attacker]....................20 squares....................[Rusher]

Rusher strategy: Sprint (6 movement) each turn
Attacker strategy: Stand and shoot (3 shots per turn at 2 AP each)

Turn 1: Attacker shoots 3x at 20 range (-2CS long range)
        Rusher moves 6 squares → 14 squares apart

Turn 2: Attacker shoots 3x at 14 range (-1CS medium range)
        Rusher moves 6 squares → 8 squares apart

Turn 3: Attacker shoots 3x at 8 range (+0CS)
        Rusher moves 6 squares → 2 squares apart

Turn 4: Attacker shoots 2x, moves back 2
        Rusher reaches melee range, attacks

RESULT: Attacker gets 11 shots before melee
At 20 damage per hit, even 50% accuracy = 5 hits = 100 damage
PISTOL IS VIABLE for defense
```

### Scenario 2: Shotgun Range (5 squares apart)

```
Turn 0: [Attacker].....5 squares.....[Rusher]

Turn 1: Attacker shoots 2x (35 damage each)
        Rusher moves 5 squares → MELEE

RESULT: Attacker gets 2 shots (70 damage if both hit)
Not enough to kill 100 HP target
SHOTGUN NEEDS CLOSE STARTING POSITION
```

### Scenario 3: Sniper on 25x25 Map (corner to corner = 35 squares diagonal)

```
Turn 0: [Sniper at 0,0].............35 squares.............[Rusher at 24,24]

Sniper range: 100 squares (whole map covered easily)

Turn 1-6: Sniper shoots 2x per turn (45 damage each, AP ammo)
          Rusher closes 6 squares per turn

Turn 6: Rusher reaches sniper (36 squares moved)

RESULT: Sniper gets 12 shots at full effectiveness
At 45 damage with 75% accuracy (scope bonus), ~9 hits = 405 damage
SNIPER DOMINATES small maps - maybe TOO strong
```

### Scenario 4: Assault Rifle vs Melee (30 squares - mid-range engagement)

```
Turn 0: [Rifleman]...........30 squares...........[Melee Fighter]

Turn 1: Rifle shoots 3x at long range (30 damage each)
        Melee moves 6 → 24 apart

Turn 2: Rifle shoots 3x at medium range
        Melee moves 6 → 18 apart

Turn 3: Rifle shoots 3x at medium range
        Melee moves 6 → 12 apart

Turn 4: Rifle shoots 3x at close range
        Melee moves 6 → 6 apart

Turn 5: Rifle shoots 2x, moves back 2
        Melee moves 6 → MELEE

RESULT: Rifleman gets 14 shots before melee
At 30 damage, 60% accuracy = ~8 hits = 240 damage
RIFLE WINS vs single melee attacker
```

---

## Balance Findings

### Weapon Effectiveness by Starting Distance

| Weapon | 5 sq | 10 sq | 20 sq | 30 sq | 50 sq |
|--------|------|-------|-------|-------|-------|
| Melee | Best | Good | Poor | Bad | Useless |
| Shotgun | Best | OK | Bad | Bad | Bad |
| Pistol | OK | Good | Good | Fair | Poor |
| SMG | Good | Good | Good | Fair | Poor |
| Rifle | Fair | Good | Best | Best | Best |
| Sniper | Poor | Fair | Good | Best | Best |

### The Problem Cases

1. **Shotgun (5 range)**: Needs to start within 5 squares or it's useless
2. **Sniper (100 range)**: Overkill on small maps, dominates everything
3. **Melee**: Needs cover or abilities to close gap

---

## Recommended Fixes

### Fix 1: Overwatch/Interrupt System

Allow ranged characters to **hold fire** and shoot when enemy moves:

```
OVERWATCH: Spend 3 AP to ready
- If enemy moves in LOS, get free attack at -1CS
- Prevents "free" sprinting at shooters
```

### Fix 2: Suppression

Ranged fire pins enemies:

```
SUPPRESSION: When shot at:
- Enemy must pass CON check to move toward shooter
- Failed check = can only move to cover or away
- Prevents "ignore fire and charge"
```

### Fix 3: Movement Penalties When Shot

```
STAGGER: When hit by gunfire:
- Lose 2 AP next turn (unless high STA)
- Makes closing gap harder under fire
```

### Fix 4: Engagement Ranges

Set standard **map sizes** based on weapon loadouts:

| Combat Type | Map Size | Dominant Weapons |
|-------------|----------|------------------|
| CQB/Indoor | 15x15 | Shotgun, SMG, Melee |
| Urban | 25x25 | Pistol, Rifle, SMG |
| Open | 40x40 | Rifle, Sniper |
| Long Range | 60x60 | Sniper, Anti-Materiel |

---

## Grenade Throwing Analysis

### Range by STR

| STR | Base Range | With Grenade (+10) |
|-----|------------|-------------------|
| 10 | 1 sq | 11 sq |
| 20 | 2 sq | 12 sq |
| 30 | 3 sq | 13 sq |
| 50 | 5 sq | 15 sq |
| 80 | 8 sq | 18 sq |

### Grenade vs Movement

```
Grenade range: 11-18 squares (STR dependent)
Movement: 6 squares per turn
Blast radius: 3x3 (1.5 sq from center)

FINDING: Grenades CAN hit targets trying to close
- Need to lead the target
- Best thrown when enemy is 2 turns away
- High STR makes grenades more viable
```

### Throwing Arc Considerations

```
High Arc: Grenades, Molotovs
- Can throw over low cover
- Longer travel time (enemy might move)
- More affected by wind (outdoor)

Flat Arc: Knives, Stars
- Direct line to target
- Faster travel
- Blocked by cover
```

---

## Super Strength Throwing

Characters with STR 50+ can throw **objects** as weapons:

| Object | Weight | Range (STR 80) | Damage |
|--------|--------|----------------|--------|
| Chair | 10 lbs | 15 squares | 15 |
| Table | 50 lbs | 10 squares | 25 |
| Motorcycle | 500 lbs | 6 squares | 50 |
| Car | 3000 lbs | 3 squares | 80 |

### Formula

```
Throw Range = (STR - Weight/50) × 2 squares
Throw Damage = Weight/10 + STR/10

Example: STR 80 throwing a car (3000 lbs)
Range = (80 - 60) × 2 = 40... capped at 3 squares (too heavy)
Damage = 300 + 8 = 80 damage

Example: STR 80 throwing a person (200 lbs)
Range = (80 - 4) × 2 = 152... capped at 15 squares
Damage = 20 + 8 = 28 damage to thrown person
              + 28 damage to target hit
```

---

## Simulation Summary

### What Works

| Mechanic | Assessment |
|----------|------------|
| Pistol at 20 range | Balanced - 3-4 turns of shooting |
| Rifle at 30-60 range | Strong - dominates open ground |
| Grenades | Useful - can hit moving targets |
| Super throw | Fun - rewards high STR |

### What Needs Work

| Issue | Solution |
|-------|----------|
| Shotgun useless beyond 5 | Start shotgun users closer OR add dash ability |
| Sniper too strong on small maps | Use larger maps OR limit sniper ammo |
| Melee can't close | Add overwatch, suppression, or mobility powers |
| No cover play | Implement cover movement bonus |

---

## Implementation Recommendations

1. **Add Overwatch**: Critical for tactical depth
2. **Add Suppression**: Prevents mindless rushing
3. **Variable Map Sizes**: Match weapons to scenarios
4. **Grenade Arcs**: Visual feedback essential
5. **Cover Sprint**: +3 movement when moving cover-to-cover

---

*Last Updated: 2024-12-05*
