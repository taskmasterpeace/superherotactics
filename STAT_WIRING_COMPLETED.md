# Character Stats Wiring - COMPLETED

## Summary
Successfully wired character stats (MEL, AGL, STR, STA, INT, INS, CON) into combat calculations in `CombatScene.ts`.

## Completed Changes ✅

### 1. Unit Interface (Lines 615-642)
Added all 7 character stats to the Unit interface:
- `mel: number` - Melee combat skill (affects melee accuracy)
- `agl: number` - Agility (affects ranged accuracy and dodge)
- `str: number` - Strength (affects damage and knockback)
- `sta: number` - Stamina (affects max HP)
- `int: number` - Intelligence (for future hacking/tech features)
- `ins: number` - Insight (for future initiative/awareness features)
- `con: number` - Constitution (for future status resistance)

### 2. Spawn Unit Defaults (Lines 1763-1769)
Set default values of 50 for all stats in `spawnUnit()` function to prevent undefined errors.

### 3. Spawn from Game Store - Blue Team (Lines 1673-1679)
Modified to pass all 7 character stats when spawning blue team units from the game store:
```typescript
mel: char.stats.MEL,
agl: char.stats.AGL,
str: char.stats.STR,
sta: char.stats.STA,
int: char.stats.INT,
ins: char.stats.INS,
con: char.stats.CON,
```

### 4. Spawn from Game Store - Red Team (Lines 1740-1746)
Modified to pass all 7 character stats when spawning red team units from the game store (same as blue team).

### 5. Accuracy Calculation (Lines 3244-3251)
**MAJOR CHANGE**: Modified `calculateHitChance()` to use appropriate stats:
- **Melee weapons** (fist, super_punch): Use **MEL** stat
- **Ranged weapons**: Use **AGL** stat

```typescript
// Stat-based accuracy modifier
// Melee weapons use MEL, ranged weapons use AGL
const isMelee = attacker.weapon === 'fist' || attacker.weapon === 'super_punch';
const accuracyStat = isMelee ? attacker.mel : attacker.agl;

// Formula: (stat - 50) / 5 gives +/-10% at extremes (stat 0 or 100)
// Examples: stat 50 = 0%, stat 75 = +5%, stat 25 = -5%
hitChance += Math.floor((accuracyStat - 50) / 5);
```

**Impact**:
- A character with MEL 75 gets +5% accuracy with melee weapons
- A character with AGL 75 gets +5% accuracy with ranged weapons
- Stats below 50 penalize accuracy appropriately

### 6. Damage Calculation (Lines 4297-4308)
**MAJOR CHANGE**: Modified damage calculation to scale better with STR:
- **Melee weapons**: STR provides percentage-based damage boost
- **Ranged weapons**: STR provides small flat damage bonus

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

**Impact**:
- A melee character with STR 100 does 50% more damage than one with STR 50
- A melee character with STR 75 does 25% more damage than one with STR 50
- Ranged weapons get minor STR scaling for recoil control
- Makes STR meaningful for melee builds

## Game Impact

### Character Differentiation
Characters now play differently based on their stats:

1. **Melee Specialist** (MEL 75, STR 75)
   - +5% melee accuracy
   - +25% melee damage
   - Excels at close combat

2. **Sharpshooter** (AGL 80, STR 40)
   - +6% ranged accuracy
   - -2 ranged damage (minor STR penalty)
   - Excellent with guns but weak in melee

3. **Bruiser** (STR 90, MEL 60, AGL 45)
   - +2% melee accuracy
   - +40% melee damage
   - Devastating when hits land

4. **Balanced Fighter** (All stats 50-60)
   - No major bonuses or penalties
   - Versatile but not exceptional

### Testing the Changes

To test in game:
1. Open Combat Lab view (F2 dev panel)
2. Create characters with different stat distributions
3. Observe combat log for accuracy and damage differences
4. High MEL characters should hit more with melee
5. High AGL characters should hit more with ranged
6. High STR characters should do more damage, especially melee

### Files Modified
- `C:\git\sht\MVP\src\game\scenes\CombatScene.ts` - All changes

### Backup
- Backup created at: `C:\git\sht\MVP\src\game\scenes\CombatScene.ts.backup`

## Future Enhancements (Not Yet Implemented)

The following stats are defined but not yet used in calculations:

1. **INS (Insight)** - For initiative/turn order
2. **INT (Intelligence)** - For hacking/tech powers
3. **CON (Constitution)** - For status effect resistance
4. **STA (Stamina)** - Already used for HP (50 + STA)
5. **AGL (Agility)** - Also could affect dodge/evasion (currently only affects accuracy)

See `STAT_WIRING_CHANGES.md` for implementation suggestions.

## Testing Checklist

- [x] File compiles without TypeScript errors
- [ ] Melee characters use MEL for accuracy
- [ ] Ranged characters use AGL for accuracy
- [ ] High STR characters do more melee damage
- [ ] Combat log shows correct damage numbers
- [ ] Characters spawn with correct stats from game store
- [ ] Test units have stat variety

---

**Date**: 2025-12-17
**Modified By**: Claude (Code Implementation Agent)
**Status**: ✅ COMPLETE (Core stat wiring)
