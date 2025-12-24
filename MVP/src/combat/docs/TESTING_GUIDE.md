# Combat Testing Guide

## Quick Start

```bash
cd MVP

# Run all balance tests
npx tsx src/combat/test.ts

# Expected output:
# ============================================================
#        COMBAT BALANCE TEST
# ============================================================
# 3v3 Soldiers: Blue 51.4% | Red 48.6%  ✅ PASS
# Half Cover:   68.6%                   ✅ PASS
# Full Cover:   72.8%                   ✅ PASS
```

## Test Files

| File | Purpose | Run Command |
|------|---------|-------------|
| `test.ts` | Core balance (cover, stance, weapons) | `npx tsx src/combat/test.ts` |
| `meleeTest.ts` | Unarmed, martial arts | `npx tsx src/combat/meleeTest.ts` |
| `disarmTest.ts` | Disarm mechanics | `npx tsx src/combat/disarmTest.ts` |
| `statusEffectTest.ts` | Bleeding, burning, etc. | `npx tsx src/combat/statusEffectTest.ts` |
| `flankingTest.ts` | Vision cones, flanking | `npx tsx src/combat/flankingTest.ts` |
| `grenadeTest.ts` | Area damage, explosions | `npx tsx src/combat/grenadeTest.ts` |
| `martialArtsTest.ts` | Weapon specials | `npx tsx src/combat/martialArtsTest.ts` |

## Creating Custom Tests

### Basic Battle Test

```typescript
import { createUnit, UNIT_PRESETS, runBatch } from './combat';

// Create teams
const blue = [createUnit(UNIT_PRESETS.soldierRifle, 'blue')];
const red = [createUnit(UNIT_PRESETS.soldierRifle, 'red')];

// Run 1000 battles
const result = runBatch(blue, red, 1000);

console.log(`Blue: ${result.blueWinRate.toFixed(1)}%`);
console.log(`Red: ${result.redWinRate.toFixed(1)}%`);
```

### Testing with Positions

```typescript
import { createUnit, UNIT_PRESETS, runBatch } from './combat';

const blue = [{
  ...createUnit(UNIT_PRESETS.soldierRifle, 'blue'),
  position: { x: 0, y: 5 },
}];

const red = [{
  ...createUnit(UNIT_PRESETS.soldierRifle, 'red'),
  position: { x: 10, y: 5 },
  vision: { facing: 180, angle: 120, range: 15 }, // Facing left
}];

const result = runBatch(blue, red, 1000);
```

### Testing Cover

```typescript
import { createUnit, UNIT_PRESETS, runBatch } from './combat';

// Blue has cover, red doesn't
const blue = [{
  ...createUnit(UNIT_PRESETS.soldierRifle, 'blue'),
  cover: 'half',
}];

const red = [createUnit(UNIT_PRESETS.soldierRifle, 'red')];

const result = runBatch(blue, red, 1000);
console.log(`Cover advantage: ${result.blueWinRate.toFixed(1)}%`);
```

### Testing Status Effects

```typescript
import { createUnit, UNIT_PRESETS, processStatusEffects } from './combat';

const unit = createUnit(UNIT_PRESETS.soldierRifle, 'blue');

// Add bleeding effect
unit.statusEffects.push({
  id: 'bleeding',
  duration: 3,
  damagePerTick: 4,
  scaling: 'constant',
});

// Process effects (simulates turn start)
const result = processStatusEffects(unit);
console.log(`Damage dealt: ${result.damageDealt}`);
console.log(`HP remaining: ${unit.hp}`);
```

### Testing Grenades

```typescript
import { createUnit, UNIT_PRESETS, GRENADES, resolveGrenade } from './combat';

// Create clustered enemies
const enemies = [
  { ...createUnit(UNIT_PRESETS.soldierRifle, 'red'), position: { x: 10, y: 10 } },
  { ...createUnit(UNIT_PRESETS.soldierRifle, 'red'), position: { x: 11, y: 10 } },
  { ...createUnit(UNIT_PRESETS.soldierRifle, 'red'), position: { x: 10, y: 11 } },
];

// Throw frag grenade at center
const result = resolveGrenade(GRENADES.FRAG, { x: 10, y: 10 }, enemies);

console.log(`Victims: ${result.victims.length}`);
for (const v of result.victims) {
  console.log(`  ${v.unitId}: ${v.damage} damage`);
}
```

## Interpreting Results

### Win Rate Interpretation

| Win Rate | Interpretation |
|----------|----------------|
| 45-55% | Balanced |
| 55-65% | Slight advantage |
| 65-75% | Moderate advantage |
| 75-85% | Strong advantage |
| 85%+ | Dominant (may need balancing) |

### Expected Variations

Due to RNG, expect ±2-3% variation between runs. For reliable results:
- Run at least 1000 battles
- Run multiple times and average
- Use seeded RNG for reproducibility

### Red Flags

1. **100% or 0% win rate** - Something is broken
2. **Mirror match not ~50%** - Base stats unbalanced
3. **Cover > 80% advantage** - Cover too strong
4. **Flanking > 60% advantage** - Flanking too strong

## Unit Presets

### Available Presets

```typescript
UNIT_PRESETS = {
  // Basic humans
  civilianPistol,
  civilianUnarmed,

  // Soldiers
  soldierRifle,
  soldierShotgun,
  soldierSniper,
  eliteSoldier,

  // Melee
  brawler,
  boxer,
  kickboxer,
  nunchuckFighter,
  staffFighter,
  knifeExpert,
  samurai,
};
```

### Creating Custom Presets

```typescript
const customPreset: UnitPreset = {
  name: 'Custom Fighter',
  description: 'My custom unit',
  stats: { MEL: 25, AGL: 20, STR: 20, STA: 20 },
  hp: 85,
  dr: 5,
  stoppingPower: 0,
  weapon: WEAPONS.assaultRifle,
};

const unit = createUnit(customPreset, 'blue');
```

## Performance Testing

```typescript
import { runBatch, createSoldierTest } from './combat';

const start = performance.now();
const { blue, red } = createSoldierTest();
const result = runBatch(blue, red, 10000);
const duration = performance.now() - start;

console.log(`10,000 battles in ${duration.toFixed(0)}ms`);
console.log(`${(10000 / duration * 1000).toFixed(0)} battles/second`);
```

Expected: 10,000+ battles/second on modern hardware.

## Troubleshooting

### "Cannot find module"
```bash
# Make sure you're in MVP directory
cd MVP
npx tsx src/combat/test.ts
```

### "NaN in results"
- Check that units have valid weapons
- Ensure stats are numbers, not undefined
- Verify position objects have x and y

### "Unexpected win rates"
- Check cover and stance settings
- Verify positions for flanking tests
- Ensure teams are correctly assigned ('blue' vs 'red')
