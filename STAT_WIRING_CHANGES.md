# Character Stat Wiring - Implementation Plan

## Summary
Wire character stats (MEL, INT, INS, CON, AGL, STR, STA) to combat calculations in CombatScene.ts

## Changes Completed ✅

### 1. Unit Interface - DONE
**Location**: Line 615-642
- Added all 7 stats to Unit interface:
  - `mel: number` - Melee combat skill
  - `agl: number` - Agility (ranged accuracy, dodge)
  - `str: number` - Strength (melee damage, knockback)
  - `sta: number` - Stamina (HP calculation)
  - `int: number` - Intelligence (hacking, tech)
  - `ins: number` - Insight (initiative, awareness)
  - `con: number` - Constitution (status resistance)

### 2. spawnUnit Defaults - DONE
**Location**: Line 1763-1769
- Added defaults (50) for all stats in `spawnUnit()` function

### 3. Spawn from Game Store (Blue Team) - DONE
**Location**: Line 1673-1679
- Pass all character stats when spawning blue team units
- Includes: MEL, AGL, STR, STA, INT, INS, CON

### 4. Spawn from Game Store (Red Team) - DONE
**Location**: Line 1740-1746
- Pass all character stats when spawning red team units
- Includes: MEL, AGL, STR, STA, INT, INS, CON

## Changes Still Needed ❌

### 5. calculateHitChance - IN PROGRESS
**Location**: Line 3313-3363
**Current**: Uses only AGL for all weapons
**Needed**:
```typescript
// Replace lines 3359-3360
// OLD:
// AGL bonus for attacker (every 10 AGL above 50 = +2%)
hitChance += Math.floor((attacker.agl - 50) / 5);

// NEW:
// Stat-based accuracy modifier
// Melee weapons use MEL, ranged weapons use AGL
const isMelee = attacker.weapon === 'fist' || attacker.weapon === 'super_punch';
const accuracyStat = isMelee ? attacker.mel : attacker.agl;

// Formula: (stat - 50) / 5 gives +/-10% at extremes (stat 0 or 100)
// Examples: stat 50 = 0%, stat 75 = +5%, stat 25 = -5%
hitChance += Math.floor((accuracyStat - 50) / 5);
```

### 6. Damage Calculation - TODO
**Location**: Search for "baseDamage" around line 3820-3830
**Current**: `let baseDamage = weapon.damage + Math.floor(attacker.str / 10);`
**Needed**:
```typescript
// Melee weapons scale better with STR
const isMelee = attacker.weapon === 'fist' || attacker.weapon === 'super_punch';
let baseDamage = weapon.damage;

if (isMelee) {
  // Melee: STR bonus is (STR - 50) / 100 * baseDamage
  // Examples: STR 50 = 0%, STR 75 = +25%, STR 100 = +50%
  baseDamage = Math.floor(baseDamage * (1 + (attacker.str - 50) / 100));
} else {
  // Ranged: Small STR bonus for recoil control
  baseDamage += Math.floor((attacker.str - 50) / 20);
}
```

### 7. Initiative/Turn Order - TODO
**Location**: Search for "startNewRound" or where units are ordered
**Needed**: Add INS-based initiative
```typescript
// When determining turn order, sort by initiative
const initiative = (unit: Unit) => {
  const baseInit = 50;
  const insBonus = unit.ins / 10; // INS 50 = +5, INS 100 = +10
  const randomFactor = Math.random() * 10; // 0-10 variance
  return baseInit + insBonus + randomFactor;
};

// Sort units by initiative
const turnOrder = Array.from(this.units.values())
  .filter(u => u.hp > 0)
  .sort((a, b) => initiative(b) - initiative(a));
```

### 8. Status Effect Resistance - TODO
**Location**: Search for "applyStatusEffect" function
**Current**: No resistance system
**Needed**:
```typescript
private applyStatusEffect(unit: Unit, effect: StatusEffectType): void {
  // CON-based resistance check
  const resistChance = Math.floor((unit.con - 50) / 5);
  // CON 50 = 0% resist, CON 75 = +5%, CON 100 = +10%

  if (Math.random() * 100 < resistChance) {
    this.emitToUI('combat-log', {
      message: `💪 ${unit.name} resists ${effect}!`,
      type: 'status'
    });
    return; // Resisted!
  }

  // Existing status effect application code...
}
```

### 9. Awareness/Spotting - FUTURE
**Uses**: INS stat
**Location**: Fog of war / enemy detection system
**Idea**: Higher INS = larger vision range, better chance to spot hidden enemies

### 10. Hacking/Tech Powers - FUTURE
**Uses**: INT stat
**Location**: Any hacking or tech-based powers
**Idea**: Higher INT = better hacking success, faster tech power cooldowns

## Testing Required

After all changes:
1. Start combat with characters that have varied stats
2. Verify melee units use MEL for accuracy
3. Verify ranged units use AGL for accuracy
4. Verify STR affects melee damage more than ranged
5. Verify high INS units go first in turn order
6. Verify high CON units resist status effects
7. Check combat log shows correct stat usage

## Formula Reference

### Accuracy
- MEL (melee): (MEL - 50) / 5 = modifier (-10% to +10%)
- AGL (ranged): (AGL - 50) / 5 = modifier (-10% to +10%)

### Damage
- STR (melee): baseDamage * (1 + (STR - 50) / 100) (+50% at STR 100)
- STR (ranged): baseDamage + (STR - 50) / 20 (minor bonus)

### Initiative
- INS: baseInit + INS / 10 (+10 at INS 100)

### Resistance
- CON: (CON - 50) / 5 = resist chance (10% at CON 100)
