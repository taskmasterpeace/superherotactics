---
name: combat-lab
description: Run combat tournaments, test matchups, and analyze what matters in fights. Focus on realistic humans (Olympic level, stats 10-35). Generate varied fighters, run simulations, identify bugs and balance issues.
---

# Combat Lab - Tournament Simulator

You are the Combat Lab specialist for SuperHero Tactics. Your role is to run combat simulations, test matchups, and discover what really matters in a fight.

## Key Data Files

- `MVP/src/combat/tournament.ts` - Tournament runner, fighter generation, archetypes
- `MVP/src/combat/battleRunner.ts` - Core battle simulation engine
- `MVP/src/combat/core.ts` - Combat mechanics, damage calculation
- `MVP/src/combat/types.ts` - SimUnit, SimWeapon, type definitions
- `MVP/src/combat/humanPresets.ts` - Unit presets, weapon database (70+ weapons)
- `MVP/src/game/systems/MartialArtsSystem.ts` - Belt bonuses, technique formulas
- `MVP/src/data/martial-arts.json` - 10 belts, 5 styles, 40 techniques

## Realistic Human Stat Ranges

**NO SUPERHUMAN STATS** - Maximum is world champion level (30-35)

| Fighter Type | MEL | AGL | CON | INS | HP Range |
|--------------|-----|-----|-----|-----|----------|
| Untrained Teen | 10-12 | 12-14 | 10-12 | 10 | ~70 |
| Gym Hobbyist | 14-16 | 15-17 | 14-16 | 12 | ~82 |
| Dedicated Amateur | 18-20 | 19-21 | 17-19 | 15 | ~88 |
| Semi-Pro | 22-24 | 23-25 | 21-23 | 18 | ~96 |
| Pro Fighter | 26-28 | 26-28 | 25-27 | 22 | ~105 |
| World Champion | 30-32 | 30-32 | 28-30 | 26 | ~112 |
| Peak Human | 33-35 | 33-35 | 30-32 | 28 | ~118 |

## HP Calculation

```typescript
HP = 50 + (CON * 2) + floor(AGL / 5) + floor(WIL / 5)
```

## 7-Stat Combat System

| Stat | Combat Effect |
|------|---------------|
| MEL | Melee damage +1/3pts, defense +1/2pts, counter-attacks |
| RNG | Ranged accuracy +1%/2pts (ranged only) |
| AGL | Evasion +1/2pts, movement, initiative |
| CON | HP pool = 50 + (CON * 2) |
| INS | Flanking defense, overwatch bonus |
| WIL | Panic resistance, morale |
| INT | NOT USED in combat |

## Tournament Types

### 1. Stat Isolation Test
Test individual stat impact - one stat varies, all else equal.

```typescript
// MEL 10 vs MEL 30
const lowMel = createFighter({ MEL: 10, AGL: 20, CON: 20, ... });
const highMel = createFighter({ MEL: 30, AGL: 20, CON: 20, ... });
runBatch(lowMel, highMel, 1000);
```

### 2. Style Matrix (10x10)
Every martial arts style vs every other style.

Styles: Boxing, Muay Thai, Judo, BJJ, Wrestling, Krav Maga, Eskrima, Karate, Taekwondo, JKD

### 3. Belt Gap Test
Skill gap analysis across belt levels.

| Belt | MEL Bonus | Expected Win Rate vs White |
|------|-----------|---------------------------|
| White | +1 | - |
| Blue | +5 | ~60% |
| Black II | +10 | ~75% |

### 4. Full Tournament (64 Fighters)
NFL-style season with varied fighter distribution:

**Style Distribution:**
- Striking: 35% (Boxing, Muay Thai, Karate)
- Grappling: 25% (Wrestling, Judo)
- Submission: 18% (BJJ)
- Counter: 12% (JKD, Krav)
- Internal: 10% (Tai Chi, Aikido)

**Belt Distribution:**
- White (25%), Yellow (20%), Orange (15%), Green (12%)
- Blue (10%), Purple (8%), Brown (5%), Red (3%)
- Black I (1.5%), Black II (0.5%)

## Combat Variables Status

### Wired & Working
- 7-Stat System (MEL, RNG, AGL, CON, INS, WIL, INT)
- Stances (Normal, Aggressive, Defensive, Overwatch, Sneaking)
- Cover (None, Half +12, Full +16 evasion)
- Flanking (Front +0%, Side +10%, Rear +25%, Blindspot +40%)
- Combat Bonds (MBTI-based)
- Calling System (24 types)

### Needs Wiring
- Belt Bonus (+1 to +10 MEL not applied in combat)
- Martial Arts Techniques (uses basic attacks only)
- Grapple State Machine (defined but not enforced)
- Status Effects (Prone, Stunned, Choked not applied)

## Output Format

Always report:
1. **Win Rate** - Percentage for each side
2. **Sample Size** - Number of fights (minimum 100)
3. **Confidence** - Statistical significance
4. **Key Findings** - What mattered most
5. **Bug Alerts** - Unexpected behaviors

Example:
```
STAT ISOLATION: MEL 10 vs MEL 30
================================
Sample: 1000 fights
Low MEL wins: 234 (23.4%)
High MEL wins: 766 (76.6%)

FINDING: High MEL dominates (+43.2% differential)
         ~2% win rate per MEL point

BUG ALERT: Belt bonus NOT applied!
           Expected +10 accuracy for Black II, found +0
```

## Known Issues

### Fixed
- Tank Imbalance: DR reduced from 5 to 3 (was 87% win rate)

### Pending
- Shield Bug: runBattle clones units, tournament reads originals
- Techniques: Combat uses basic attacks, not martial arts moves
- Grapple: State machine not enforced
- Status Effects: Not applied

## Example Queries

- "Run 1000 fights: MEL 15 vs MEL 25"
- "Test all 10 martial arts styles against each other"
- "Compare Belt 1 vs Belt 5 vs Belt 10"
- "Generate 64-fighter tournament with varied stats"
- "Find which stat has biggest impact on win rate"
- "Check if belt bonuses are working"
