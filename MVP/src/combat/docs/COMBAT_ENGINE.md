# Combat Engine Documentation

## Overview

The SHT Combat Engine is a portable, headless combat simulation system designed for:
- **Balance testing** at 10,000+ battles per second
- **Integration** with Phaser's CombatScene
- **Pure TypeScript** - no Phaser dependencies in core logic

## Architecture

```
combat/
├── types.ts          # All interfaces and constants
├── core.ts           # Pure combat calculation functions
├── statusEffects.ts  # Status effect processing
├── battleRunner.ts   # Battle loop orchestration
├── batchTester.ts    # Batch testing utilities
├── humanPresets.ts   # Unit presets and test scenarios
└── index.ts          # Public exports
```

## Core Systems

### 1. Hit Calculation

```typescript
import { calculateAccuracy, getHitResult } from './combat';

const accuracy = calculateAccuracy(attacker, target, distance);
const hitResult = getHitResult(roll, accuracy); // 'miss' | 'graze' | 'hit' | 'crit'
```

**Accuracy Modifiers:**
| Source | Modifier |
|--------|----------|
| Weapon base | 60-90% |
| Stance (aggressive) | +15% |
| Stance (defensive) | -15% |
| Target evasion (defensive) | -20% |
| Cover (half) | -12% |
| Cover (full) | -16% |
| Flanking (side) | +10% |
| Flanking (rear) | +25% |
| Flanking (blindspot) | +40% |
| Range brackets | -30% to +15% |

### 2. Damage Pipeline

```
Base Damage (weapon + STR/10)
    ↓
Hit Multiplier (miss=0, graze=0.5, hit=1.0, crit=1.5)
    ↓
Origin Modifier (biological, robotic, energy, undead)
    ↓
Shield Absorption
    ↓
Armor/DR Reduction
    ↓
Final Damage
```

### 3. Stances

| Stance | Accuracy | Evasion | Notes |
|--------|----------|---------|-------|
| Normal | +0 | +0 | Default |
| Aggressive | +15 | -15 | Offense focus |
| Defensive | -15 | +20 | Defense focus |
| Overwatch | +10 | -10 | Reaction shots |
| Sneaking | -10 | +20 | +1 AP cost |

### 4. Cover System

| Cover | Evasion | Peek Penalty | Net Advantage |
|-------|---------|--------------|---------------|
| None | +0 | 0 | 0 |
| Half | +12 | -6 | +6 |
| Full | +16 | -8 | +8 |

**Balance Results:** Half cover ~68% win rate, Full cover ~73% win rate.

### 5. Vision & Flanking

Units have vision cones defined by:
- **Facing**: Direction in degrees (0=right, 90=up, 180=left, 270=down)
- **Angle**: Field of view (human=120°, enhanced=180°, superhuman=360°)
- **Range**: How far they can see

```typescript
import { getFlankingResult, canReact } from './combat';

const flanking = getFlankingResult(attacker, target);
// Returns: 'front' | 'side' | 'rear' | 'blindspot'

const canReactShot = canReact(target, attacker);
// Returns false if attacker is in blindspot
```

**Flanking Bonuses:**
| Position | Accuracy Bonus | Reaction Allowed |
|----------|----------------|------------------|
| Front (0-45°) | +0% | Yes |
| Side (45-120°) | +10% | Yes |
| Rear (120-180°) | +25% | Yes |
| Blindspot | +40% | No |

### 6. Status Effects

Effects are applied from damage types and grenades:

| Effect | Duration | Damage/Turn | Special |
|--------|----------|-------------|---------|
| Bleeding | 3-4 turns | 3-4 | Constant |
| Burning | 2-3 turns | 5+ | Increases, spreads |
| Frozen | 2 turns | 0 | -2 AP |
| Stunned | 1-2 turns | 0 | Skip turn |
| Poisoned | 5 turns | 10 | Decreases |

```typescript
import { processStatusEffects, canUnitAct } from './combat';

// At start of turn
const result = processStatusEffects(unit);
if (!canUnitAct(unit)) {
  // Skip this unit's turn (stunned)
}
```

### 7. Melee Combat

**Unarmed Attacks:**
| Attack | Damage | Accuracy | AP | Special |
|--------|--------|----------|----|---------|
| Jab | 5 | 95 | 1 | Fast |
| Cross | 10 | 85 | 1 | Knockback 1 |
| Hook | 12 | 80 | 2 | Knockback 2 |
| Uppercut | 15 | 75 | 2 | Knockback 3 |
| Kick | 10 | 80 | 2 | Knockback 2 |
| Roundhouse | 18 | 70 | 3 | Knockback 4 |

**Martial Arts Weapons:**
| Weapon | Damage | Special |
|--------|--------|---------|
| Nunchucks | 12 | +25% disarm |
| Bo Staff | 15 | +30% knockdown, reach 2 |
| Tonfa | 10 | +15% block |
| Sai | 14 | +15% disarm, blade trap |
| Brass Knuckles | 14 | +2 damage |
| Katana | 25 | Bleeding |

**Disarm Mechanics:**
```typescript
const chance = calculateDisarmChance(attacker, target);
// Base 30% + weapon bonus + (attackerSTR - targetSTR) * 2

if (attemptDisarm(attacker, target)) {
  applyDisarm(target); // Switches to fist weapon
}
```

### 8. Grenades

```typescript
import { resolveGrenade, applyGrenadeResult, GRENADES } from './combat';

const result = resolveGrenade(GRENADES.FRAG, { x: 10, y: 10 }, allUnits);
applyGrenadeResult(allUnits, result);
```

| Grenade | Damage | Radius | Falloff | Effects |
|---------|--------|--------|---------|---------|
| FRAG | 50 | 3 | Linear | Bleeding |
| CONCUSSION | 35 | 4 | Quadratic | Stunned |
| FLASHBANG | 5 | 5 | Quadratic | Stunned |
| INCENDIARY | 30 | 2 | Linear | Burning |
| SMOKE | 0 | 4 | Linear | Cover |

## Running Tests

```bash
cd MVP

# Balance tests
npx tsx src/combat/test.ts

# Melee tests
npx tsx src/combat/meleeTest.ts

# Status effect tests
npx tsx src/combat/statusEffectTest.ts

# Flanking tests
npx tsx src/combat/flankingTest.ts

# Grenade tests
npx tsx src/combat/grenadeTest.ts
```

## Creating Custom Tests

```typescript
import {
  createUnit,
  UNIT_PRESETS,
  runBatch,
  formatBatchResult
} from './combat';

// Create teams
const blue = [
  createUnit(UNIT_PRESETS.soldierRifle, 'blue'),
  createUnit(UNIT_PRESETS.soldierRifle, 'blue'),
];

const red = [
  createUnit(UNIT_PRESETS.soldierRifle, 'red'),
  createUnit(UNIT_PRESETS.soldierRifle, 'red'),
];

// Run 1000 battles
const result = runBatch(blue, red, 1000);
console.log(formatBatchResult(result));
```

## Integration with CombatScene

The combat engine exports pure functions that CombatScene can use:

```typescript
// In CombatScene
import {
  calculateAccuracy,
  resolveAttack,
  applyAttackResult,
  getFlankingResult
} from '../combat';

// Preview attack
const accuracy = calculateAccuracy(attacker, target, distance);

// Resolve attack
const result = resolveAttack(attacker, target, distance);

// Apply to target
applyAttackResult(target, result);
```

## Performance

The engine is optimized for batch testing:
- **10,000+ battles/second** on modern hardware
- No memory leaks in extended runs
- Deterministic with seed option
