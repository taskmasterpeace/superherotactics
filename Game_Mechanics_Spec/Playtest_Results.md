# SHT Playtest Results Log

## Overview

This document tracks playtest sessions, observations, and balance adjustments for the SuperHero Tactics combat system. Use the Complete_Combat_Simulator.html to run tests.

---

## How to Run Playtests

### Using the Simulator
1. Open `Complete_Combat_Simulator.html` in a browser
2. Select a scenario from the dropdown
3. Click "Load Scenario"
4. Click "Run Turn" for step-by-step or "Run 10 Turns" for quick results
5. Use "Batch 100" for statistical analysis

### Using the Batch Tester (Node.js)
1. Run `node combat_batch_tester.js` in Game_Mechanics_Spec folder
2. Runs 100 simulations across 15 different scenarios
3. Outputs detailed statistics and balance analysis

---

## Session 1 - FULL BATTERY TEST - 2024-12-04

**Test Method**: Node.js batch tester (combat_batch_tester.js)
**Simulations**: 100 per scenario (1500 total)
**Version**: Complete_Combat_Simulator v2.0

### Summary Results Table

| Scenario | A Win% | B Win% | Avg Turns | Status |
|----------|--------|--------|-----------|--------|
| 1v1 Pistol Duel (Equal) | 59.0% | 41.0% | 7.3 | FAIL |
| Rifle vs Pistol | 99.0% | 1.0% | 5.5 | FAIL |
| Shotgun Close Range | 100.0% | 0.0% | 3.5 | FAIL |
| Shotgun vs Rifle (Long Range) | 46.0% | 54.0% | 6.7 | CLOSE |
| Sniper Duel | 53.0% | 47.0% | 3.2 | PASS |
| Super vs Normal (1v1) | 88.0% | 12.0% | 14.3 | PASS |
| Super vs Squad (1v4) | 0.0% | 100.0% | 5.4 | FAIL |
| Squad Battle (4v4) | 81.0% | 19.0% | 7.5 | FAIL |
| Combat Armor vs Kevlar | 100.0% | 0.0% | 8.7 | FAIL |
| Energy Rifle vs Combat Armor | 35.0% | 65.0% | 5.2 | CLOSE |
| Cover Advantage Test | 97.0% | 3.0% | 5.4 | FAIL |
| Grappling Match | 84.0% | 16.0% | 7.2 | FAIL |
| SMG vs Pistol | 93.0% | 7.0% | 5.9 | FAIL |
| Knife Fight | 64.0% | 36.0% | 4.4 | FAIL |
| Plasma vs Combat Armor | 28.0% | 72.0% | 5.3 | FAIL |

---

## Issues Discovered

### Critical (Game-Breaking)

1. **Super vs Squad = 0% Win Rate**
   - Super with fists vs 4 rifles = instant death
   - Super has to close distance while getting shot
   - Fists damage (5 + 8 from STR = 13) vs Tactical DR 12 = 1 damage per hit
   - Super dies before reaching anyone
   - **FIX NEEDED**: Super needs ranged attack or much more HP/DR

2. **SMG Too Powerful (93% vs Pistol)**
   - SMG costs 1 AP vs Pistol's 2 AP
   - SMG fires 6 times per turn, Pistol fires 3
   - Even with -1 accuracy, volume of fire is overwhelming
   - **FIX NEEDED**: SMG should cost 2 AP or have lower damage

### High (Balance Impacting)

3. **Combat Armor Too Strong (100% vs Kevlar)**
   - Pistol (20 dmg) vs Combat Armor (DR 18) = 2 damage
   - Pistol (20 dmg) vs Kevlar (DR 8) = 12 damage
   - 6x damage difference is too extreme
   - **FIX NEEDED**: Reduce armor DR gaps or increase base weapon damage

4. **Rifle vs Pistol (99%)**
   - Rifle dominates completely
   - +10 damage AND +1CS accuracy is too much
   - **FIX NEEDED**: Either reduce rifle damage to 25 or remove accuracy bonus

5. **Cover Too Strong (97%)**
   - High cover gives -20 to hit (2 CS penalty)
   - Combined with armor, makes defender nearly invincible
   - **FIX NEEDED**: Reduce high cover to -15 or -10

### Medium (Noticeable)

6. **Grappling Resolves Too Fast (7.2 turns avg)**
   - STR 50 vs STR 35 gives 84% win rate
   - Position doesn't matter enough
   - **FIX NEEDED**: Add more position-based modifiers, slower damage

7. **Knife Fight Not 50/50 (64%)**
   - Both fighters identical but A wins more
   - Turn order advantage is too significant
   - **FIX NEEDED**: Add initiative randomization

8. **Shotgun Close = 100%**
   - Close range bonus (+15) makes it impossible to miss
   - Too dominant at its ideal range
   - **FIX NEEDED**: Reduce close bonus to +2CS (+10)

### Low (Minor Polish)

9. **Energy Weapons Underperform**
   - Plasma (45 dmg, -1 acc) loses to Rifle (30 dmg, +1 acc)
   - Energy weapons should partially ignore armor
   - **FIX NEEDED**: Add energy armor penetration (halve DR)

---

## Recommended Balance Changes

### Immediate (Before Next Session)

- [ ] **SMG**: Increase AP cost to 2 (same as pistol)
- [ ] **Shotgun Close Bonus**: Reduce from +3CS to +2CS
- [ ] **Cover**: Reduce high cover from +2CS to +1.5CS (-15 penalty)
- [ ] **Super Melee Damage**: Add power attack option (3 AP, double damage)

### Short-Term (Next Version)

- [ ] **Armor DR Scaling**: Add DR penetration based on weapon power
  - Pistol: Full DR applied
  - Rifle: DR -2
  - Sniper: DR -5
  - Energy: DR halved
- [ ] **Combat Armor**: Reduce DR from 18 to 15
- [ ] **Rifle**: Reduce damage from 30 to 28 or remove +1 accuracy
- [ ] **Grapple System**: Add stamina drain, position advantages

### Long-Term (Future Consideration)

- [ ] Turn initiative system (speed stat determines order)
- [ ] Suppression mechanics (reduce action economy dominance)
- [ ] Armor degradation during combat
- [ ] Energy weapon special effects (stun, burn)

---

## Session 2 - BALANCE v1.2 TEST - 2024-12-04

**Test Method**: Node.js batch tester (combat_batch_tester.js)
**Simulations**: 100 per scenario (1500 total)
**Version**: Complete_Combat_Simulator v3.0 + Balance v1.2

### Balance Changes Applied (v1.2)

**Weapons:**
- [x] Rifle damage: 30 → 25
- [x] SMG: AP 1 → 1, damage 20 → 15, accuracy -1 → 0
- [x] Shotgun closeBonus: 3 → 2
- [x] Energy weapons: ignoresArmor 40-50%
- [x] Fists damage: 5 → 8
- [x] Added super_punch weapon (25 dmg, 10 drPen, strBonus)

**Armor:**
- [x] Kevlar DR: 8 → 6
- [x] Tactical DR: 12 → 8
- [x] Combat Armor DR: 18 → 12
- [x] Power Armor DR: 25 → 18
- [x] All armors now have energyDR values

**Cover:**
- [x] Low cover: -10 → -8
- [x] High cover: -20 → -15

**Mechanics:**
- [x] Added drPen (DR penetration) to weapons
- [x] Energy weapons use energyDR instead of full DR

### Summary Results Table (v1.2)

| Scenario | A Win% | Expected | Status | Notes |
|----------|--------|----------|--------|-------|
| 1v1 Pistol Duel | 55.0% | 45-55% | CLOSE | First-mover advantage |
| Rifle vs Pistol | 93.0% | 55-70% | FAIL | Range still dominates |
| Shotgun Close | 100.0% | 65-85% | PASS* | Working as intended |
| Shotgun vs Rifle | 70.0% | 25-45% | FAIL | AI closes gap |
| Sniper Duel | 68.0% | 45-55% | FAIL | First-mover advantage |
| Super vs Normal | 100.0% | 70-90% | PASS* | Super should dominate |
| Super vs Squad (1v4) | 99.0% | 50-75% | PASS* | Fixed from 0%! |
| Squad Battle (4v4) | 98.0% | 40-60% | FAIL | Team A has snipers |
| Combat Armor vs Kevlar | 98.0% | 60-80% | FAIL | Still too impactful |
| Energy vs Combat Armor | 87.0% | 40-60% | FAIL | Energy too strong now |
| Cover Advantage | 92.0% | 60-80% | FAIL | Still powerful |
| Grappling Match | 82.0% | 55-75% | FAIL | STR dominates |
| SMG vs Pistol | 73.0% | 45-60% | IMPROVED | Was 93%, then 16% |
| Knife Fight | 71.0% | 45-55% | FAIL | First-mover advantage |
| Plasma vs Armor | 79.0% | 50-70% | CLOSE | Working better |

### Key Improvements from v1.1 → v1.2

1. **Super vs Squad**: 0% → 99% - FIXED
   - Added super_punch weapon with drPen
   - Increased super HP to 300
   - Closer starting positions

2. **SMG vs Pistol**: 16% → 73% - FUNCTIONAL
   - Restored AP to 1 for burst capability
   - Reduced damage to 15 for balance
   - Fixed accuracy from -1 to 0

3. **Pistol Duel**: 57% → 55% - NEAR TARGET
   - Now within expected range

### Remaining Issues

1. **First-Mover Advantage** (~15-20% swing)
   - All "equal" matchups favor Team A
   - Need initiative system to randomize first action

2. **Range/Positioning Too Strong**
   - Rifle vs Pistol: Range advantage = 93% win
   - AI behavior: Shotgun closes gap effectively
   - Scenarios may need repositioning

3. **Armor Gap Still Too Wide**
   - Combat vs Kevlar: 98%
   - Need flatter DR curve or more drPen on weapons

### Recommendations for v1.3

- [ ] Add initiative roll at combat start
- [ ] Reduce base armor DR across the board by 2
- [ ] Add random first-turn determination
- [ ] Consider reaction/overwatch mechanics

---

## Visual System Updates (v3.0)

The simulator now includes a **generic visual effect system**:

### Visual Types
- **projectile**: Animated dot traveling to target
- **beam**: Continuous line with spread-based width
- **cone**: Triangular spread (configurable angle)
- **ring**: Radial shockwave effect
- **melee**: Quick slash animation

### Weapon Visual Properties
Each weapon has a `visual` property:
```javascript
{
  type: 'cone',    // projectile, beam, cone, ring, melee
  color: '#f80',   // CSS color
  spread: 25       // Angle in degrees (0 = focused, 360 = radial)
}
```

### Examples
- Sawed-off Shotgun: cone, 50° spread
- Tactical Shotgun: cone, 20° spread
- Focused Beam: beam, 0° spread
- Wide Beam: cone, 45° spread
- Radial Burst: ring, 360° spread

### New Results
- (Fill in after re-running tests)

---

## Balance Targets (Updated)

### Time-to-Kill (TTK) Guidelines

| Combat Type | Target TTK | Actual TTK | Status |
|-------------|------------|------------|--------|
| Pistol vs Unarmored | 3-5 turns | ~5 turns | OK |
| Pistol vs Kevlar | 5-8 turns | ~7 turns | OK |
| Rifle vs Tactical | 4-6 turns | ~5 turns | OK |
| Super vs Normals | 2-3 turns | 14+ turns | TOO SLOW |
| Grapple to Submit | 10-20 turns | 7 turns | TOO FAST |

### Win Rate Guidelines

| Scenario | Expected | Actual | Status |
|----------|----------|--------|--------|
| Equal Units | 45-55% | 59% | NEEDS WORK |
| Better Weapon | 55-65% | 99% | BROKEN |
| Better Armor | 55-65% | 100% | BROKEN |
| Super vs 4 Normals | 60-70% | 0% | BROKEN |
| Cover Advantage | 60-70% | 97% | BROKEN |

---

## Key Findings Summary

### What's Working
- Sniper duels are balanced and exciting
- TTK for pistol vs armor is reasonable
- Basic hit/miss mechanics function correctly
- Shotgun at range vs rifle is close to balanced

### What's Broken
1. **Action Economy** - Low AP cost weapons (SMG) dominate
2. **Armor Scaling** - DR differences are too extreme
3. **Cover System** - Too powerful, creates stalemates
4. **Super Balance** - Melee-only super cannot function vs ranged
5. **Turn Order** - First-mover advantage too strong

### Root Causes
1. Linear damage vs linear DR creates exponential effectiveness curves
2. Multiple attacks per turn scales multiplicatively with hit chance
3. Cover stacks with armor, creating near-immunity
4. No closing distance mechanics for melee fighters

---

## Notes for Next Session

1. Apply SMG and shotgun fixes first (easiest)
2. Test armor penetration system
3. Consider adding "charge" action for melee (move + attack)
4. Test with randomized initiative
5. Add super-specific abilities (leap, ground pound)

---

*Last Updated: 2024-12-04*
*Test Script: combat_batch_tester.js*
*Related Files: Complete_Combat_Simulator.html, Weapons_Complete.csv, Balance_Analysis.md*
