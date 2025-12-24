# Combat Balance Targets

## Design Philosophy (Jagged Alliance 2 Style)

1. **Every weapon has a ROLE** - pistols for backup/stealth, rifles for range, shotguns for CQB
2. **Cover is important but NOT invincible** - should help, not guarantee survival
3. **Position/range matters more than raw stats** - tactical positioning wins fights
4. **Action economy** - AP cost vs damage tradeoff matters
5. **Stats + gear + tactics = victory** - all three matter

## Balance Targets

### Mirror Matches
| Scenario | Target | Actual | Status |
|----------|--------|--------|--------|
| 3v3 Soldiers (rifles) | 50% ± 5% | 51.4% | ✅ PASS |
| Boxer vs Boxer | 50% ± 5% | 48.5% | ✅ PASS |

### Cover Effectiveness
| Scenario | Target | Actual | Status |
|----------|--------|--------|--------|
| Half Cover vs Open | 60-70% | 68.6% | ✅ PASS |
| Full Cover vs Open | 70-80% | 72.8% | ✅ PASS |

### Stance Effectiveness
| Scenario | Target | Actual | Status |
|----------|--------|--------|--------|
| Defensive vs Normal | +10-20% | +18.9% | ✅ PASS |
| Aggressive vs Normal | -5-10% | Varies | ✅ OK |

### Weapon Roles
| Scenario | Target | Actual | Status |
|----------|--------|--------|--------|
| Shotgun vs Rifle (2 tiles) | 90%+ shotgun | 97.8% | ✅ PASS |
| Rifle vs Pistol (10 tiles) | 70%+ rifle | ~85% | ✅ PASS |
| Pistol vs Rifle (3 tiles) | 55-60% pistol | ~55% | ✅ PASS |

### Flanking
| Scenario | Target | Actual | Status |
|----------|--------|--------|--------|
| Side attack | +5-15% acc | +10% | ✅ PASS |
| Rear attack | +20-30% acc | +25% | ✅ PASS |
| Blindspot attack | +35-50% acc | +40% | ✅ PASS |
| Flanking win rate | +40-60% | +49.6% | ✅ PASS |

### Melee Balance
| Scenario | Target | Notes |
|----------|--------|-------|
| Unarmed vs Unarmed | 50% ± 5% | Mirror match balanced |
| Nunchucks disarm | 50-60% | Working at 55% |
| Boxer vs Knife | 30-40% | Counter-attacks help (38%) |

## Tuning Guide

### If Cover is Too Strong
1. Reduce `evasionBonus` in `COVER_BONUSES`
2. Increase `accuracyPenalty` (peek penalty)
3. Remove `drBonus` entirely

### If Cover is Too Weak
1. Increase `evasionBonus`
2. Reduce `accuracyPenalty`
3. Add small `drBonus` (1-2)

### If Melee is Too Weak
1. Increase `insideGuardBonus` in core.ts
2. Add more counter-attack damage
3. Increase MEL scaling

### If Flanking is Too Strong
1. Reduce `FLANKING_BONUSES` values
2. Narrow the rear angle (120° → 135°)
3. Make blindspot require stealth

### If Grenades are Unbalanced
1. Adjust `damageAtCenter`
2. Change `blastRadius`
3. Modify `damageFalloff` type

## Constants Reference

### types.ts
```typescript
COVER_BONUSES = {
  none: { evasionBonus: 0, drBonus: 0, accuracyPenalty: 0 },
  half: { evasionBonus: 12, drBonus: 0, accuracyPenalty: -6 },
  full: { evasionBonus: 16, drBonus: 0, accuracyPenalty: -8 },
};

STANCES = {
  normal: { accuracyMod: 0, evasionMod: 0, apCostMod: 0 },
  aggressive: { accuracyMod: 15, evasionMod: -15, apCostMod: 0 },
  defensive: { accuracyMod: -15, evasionMod: 20, apCostMod: 0 },
};

FLANKING_BONUSES = {
  front: 0,
  side: 10,
  rear: 25,
  blindspot: 40,
};
```

### core.ts
```typescript
// Inside guard bonus (unarmed vs armed melee)
insideGuardBonus = MEL >= 25 ? 20 : MEL >= 20 ? 15 : 8;

// Counter-attack requirements
canCounterAttack = MEL >= 18 && hitResult === 'miss' && isMelee;
```

## Version History

### v1.0 (Current)
- Cover: Half 68.6%, Full 72.8%
- Flanking: Side +10%, Rear +25%, Blindspot +40%
- Melee: Counter-attacks, inside guard bonus
- Status effects: Bleeding, burning, frozen, stunned, poisoned
- Grenades: 5 types with area damage
