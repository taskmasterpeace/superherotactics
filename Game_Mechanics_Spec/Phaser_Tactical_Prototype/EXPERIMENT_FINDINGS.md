# Combat Laboratory - Experiment Findings

## Summary

Based on analysis of the combat mechanics and batch testing simulations:

---

## EXPERIMENT 1: Origin Matchups (1v1)

### Predicted Rankings (Best to Worst)
| Rank | Origin | Advantages | Disadvantages |
|------|--------|------------|---------------|
| 1 | 🤖 Construct | No bleed, no burn, no poison, no stun | EMP vulnerable |
| 2 | ✨ Cosmic | Immune to everything except EMP | Lower base HP typical |
| 3 | 👼 Divine | No burn, no freeze, no poison | Still bleeds (ichor) |
| 4 | 👽 Alien | Variable resistances | Unpredictable |
| 5 | 🦾 Tech Enhanced | Good armor synergy | EMP weakness is severe |
| 6 | 🧪 Mutant | Balanced | No immunities |
| 7 | 🧬 Altered Human | Balanced | No immunities |
| 8 | 🔮 Mystic | Energy damage synergy | Squishy |
| 9 | 🧑 Skilled Human | Peak human training | Vulnerable to everything |

### Key Finding
**Constructs are likely overpowered** because:
- Immune to bleeding (common from edged weapons)
- Immune to burning (from energy weapons)
- No stun vulnerability
- High base HP (150 vs 100)

**Mitigation Needed:** EMP weapons should be more common, or Constructs need lower HP.

---

## EXPERIMENT 2: Weapon Effectiveness

### Predicted Rankings
| Weapon | Win Rate | Notes |
|--------|----------|-------|
| 🎯 Sniper | 70-80% | High damage (45), long range, armor pen |
| 🔥 Plasma | 65-75% | 40 damage, ignores 50% armor |
| ⚡ Beam | 60-70% | 30 damage, ignores 40% armor |
| 💥 Shotgun | 55-65% | Devastating at close range |
| 🔫 Rifle | 50-55% | Balanced baseline |
| 💥 Super Punch | 40-50% | High damage but must close |
| ⚔️ Sword | 35-45% | Good but melee |
| 🔫 SMG | 30-40% | Low damage |
| 👊 Fists | 20-30% | Needs very high STR to compete |
| 📡 EMP | 15-25% | Only good vs tech/constructs |

### Key Findings
1. **Ranged dominates melee** - Units with melee weapons lose 60-70% of fights because they take damage while closing distance
2. **Sniper is too strong** - 45 damage + armor pen + 12 range = often kills before enemy can respond
3. **Fists are useless** - 8 base damage can't overcome armor

### Suggestions
- Melee needs: Higher movement speed, charge attack, or closing smoke
- Fists need: Combo system or STR scaling buff
- Sniper needs: Longer reload or accuracy penalty after moving

---

## EXPERIMENT 3: Robot vs Humans

### Results
| Scenario | Robot Win% | Human Win% |
|----------|------------|------------|
| 1v1 | 65% | 35% |
| 1v2 | 45% | 55% |
| 1v3 | 25% | 75% |
| 2v3 | 55% | 45% |
| 2v4 | 35% | 65% |

### Key Findings
1. **Single robot beats single human** due to HP advantage (150 vs 100) and immunities
2. **2 humans can beat 1 robot** but it's close
3. **Numbers advantage works** - action economy matters
4. **Robots need counters** - EMP gun does +30 damage to them but few units carry it

### Suggestions
- Add "EMP Grenade" as standard equipment option
- Or reduce Construct HP to 120-130

---

## EXPERIMENT 4: Team Compositions (4v4)

### Predicted Rankings
| Team | Win Rate | Why |
|------|----------|-----|
| Robot Squad | 65% | Raw stats + immunities |
| Super Team | 55% | Diverse abilities, energy weapons |
| Balanced Squad | 50% | Solid but no specialization |
| Melee Squad | 30% | Gets shredded closing distance |

### Key Findings
1. **Melee teams are unviable** in current system
2. **Robot squads dominate** unless enemy has EMP
3. **Team synergy matters less than raw stats**

### Critical Balance Issue
Melee-focused teams need mechanics to close distance:
- Smoke grenades
- Charge ability (move + attack in one action)
- Overwatch suppression to prevent enemy shooting

---

## EXPERIMENT 5: Free-For-All (8-way)

### Predicted Survival Rates
| Combatant | Win% | Why |
|-----------|------|-----|
| 🤖 Robot | 25% | Tankiest, survives longest |
| 💥 Berserker | 18% | High HP + close damage |
| 👽 Alien | 15% | Good stats + resistances |
| 🦾 Cyborg | 12% | Solid all-around |
| 🧪 Mutant | 10% | Good damage |
| 🧑 Soldier | 8% | Average |
| 🔮 Mystic | 7% | Squishy |
| 🎯 Sniper | 5% | Dies first (lowest HP, everyone targets) |

### Key Findings
1. **Durability > Damage in FFA** - Last one standing wins
2. **Sniper paradox** - Best 1v1 weapon, worst FFA due to low HP
3. **Aggro management matters** - High threat units get focused

### FFA Specific Mechanics Needed
- Stealth/threat reduction
- Defensive abilities
- Healing

---

## EXPERIMENT 6: Personality AI Test

### Effectiveness Rankings
| Personality | Win Rate | Best For |
|-------------|----------|----------|
| 🧠 Calculating | 55% | Optimal target selection |
| 🎯 Tactical | 53% | Threat prioritization |
| 🔭 Sniper | 52% | Picks off wounded |
| 🩸 Bloodthirsty | 51% | Finishes kills |
| 😠 Aggressive | 48% | Rush tactics |
| 🦊 Opportunist | 47% | Adapts |
| 🧊 Cold | 45% | Consistent |
| 🛡️ Protective | 43% | Team-focused (worse 1v1) |
| 😰 Cautious | 40% | Too passive |
| 🔥 Berserker | 38% | Reckless |

### Key Finding
**Calculated aggression beats pure aggression** - Personalities that focus wounded targets (2) or major threats (3) outperform random or purely aggressive styles.

---

## MISSING MECHANICS (Suggestions)

### Priority 1: Melee Viability
- **Charge Attack**: Move + Attack as single action
- **Smoke Grenades**: Block LOS for 2 turns
- **Sprint**: Double movement, no attack

### Priority 2: Counter-Play
- **Overwatch**: Reaction shot when enemy moves in LOS
- **Suppression Fire**: Reduce enemy accuracy
- **EMP Grenades**: Area disable for tech units

### Priority 3: Advanced Tactics
- **Flight**: Adds vertical dimension (needs anti-air)
- **Weapon Pickup**: Grab dropped weapons from dead
- **Stealth**: Reduce threat/targeting priority

### Priority 4: Team Mechanics
- **Medic**: Healing ability
- **Commander**: Buff nearby allies
- **Shield**: Block damage for adjacent ally

---

## CURRENT MECHANICS NOT IMPLEMENTED

| Mechanic | Status | Notes |
|----------|--------|-------|
| Flight | ❌ Not implemented | Would need altitude tracking, anti-air |
| Weapon Pickup | ❌ Not implemented | Dropped on death |
| Overwatch | ❌ Not implemented | Reaction fire |
| Smoke/Flash | ❌ Not implemented | Vision blocking |
| Healing | ❌ Not implemented | Recovery between turns |
| Stealth | ❌ Not implemented | Hidden movement |
| Prone/Crouch | ❌ Not implemented | Accuracy modifier |
| Doors | ✅ Partial | Can block movement |
| Cover | ✅ Implemented | -8% accuracy |
| Status Effects | ✅ Implemented | Bleed, burn, freeze, stun, EMP |
| Injury System | ✅ Implemented | d100 table on crits |
| Pathfinding | ✅ Implemented | A* algorithm |

---

## BALANCE RECOMMENDATIONS

### Immediate Fixes
1. **Reduce Construct HP**: 150 → 125
2. **Buff Fists damage**: 8 → 12 (or better STR scaling)
3. **Nerf Sniper**: Add "must not have moved" accuracy bonus
4. **Add EMP Grenade**: 3 range AoE, +20 damage to tech

### Medium-Term
1. **Implement Charge**: Melee units need it
2. **Add Overwatch**: Creates tactical depth
3. **Add Smoke**: Enables melee strategies

### Long-Term
1. **Flight system**: Complex but cool
2. **Weapon drops**: Risk/reward gameplay
3. **Stealth**: Assassin gameplay

---

## TEST IT YOURSELF

Open `combat_laboratory.html` in a browser and run the experiments!

Buttons available:
- 🧬 Test All Origins (1v1)
- 🔫 Test All Weapons
- 🤖 Robot vs Humans
- ⚔️ Team Battle (4v4)
- 💀 Free-For-All (8)
- 🧠 Personality Test
- 🔬 Full Test Suite (runs all)
