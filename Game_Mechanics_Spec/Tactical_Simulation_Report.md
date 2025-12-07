# SHT Tactical AI Simulation Report

## Executive Summary

This report documents the development and testing of the Tactical AI Simulation Engine for SuperHero Tactics, integrating the Wrestling/Martial Arts, Combat Modes/Stances, Sound Detection, and Door/Environment systems created in the previous phase.

---

## Simulation Engine Overview

### Map Design: 9-House Neighborhood
- **Grid Size**: 50x40 squares (900 sq total playable area)
- **Street**: Horizontal divider (y: 18-22)
- **Houses**:
  - Top Row (4 houses): H1 (10x12, basement), H2 (8x10), H3 (12x14, basement), H4 (9x11)
  - Bottom Row (5 houses): H5 (9x12), H6 (11x11, basement), H7 (8x10), H8 (12x14, basement), H9 (6x7)
- **Features**: Multiple doors per house, interior walls creating rooms, furniture for cover, basement stairs

### Systems Integrated

| System | Implementation | Key Mechanics |
|--------|---------------|---------------|
| Sound Detection | Full | Decibel-based hearing, material dampening through walls |
| Door Interaction | Full | Open (40dB), Quiet Open (20dB), Breach (85dB) |
| Combat Modes | Partial | Alert Mode (-2 AP/turn), Defensive/Aggressive stances |
| Power Detection | Full | Configurable range, detectable powers attract attackers |
| Pathfinding | A* | Smart navigation around walls, through doors |

---

## AI Behavior Analysis

### Attacker AI Priority Stack
1. **Combat**: Engage visible enemies (health-aware: take cover if HP < 30%)
2. **Investigate Sounds**: Move toward recent sounds (within 2 turns)
3. **Power Detection**: Track detectable power signatures
4. **Systematic Search**: Coordinate house searches with teammates

### Defender AI Priority Stack
1. **Combat**: Engage enemies (stance choice based on caution setting)
2. **VIP Protection**: Stay within protection radius
3. **Ambush Setup**: Position with LOS to entry points + cover

### Special Behaviors

| Unit Type | Behavior |
|-----------|----------|
| Guardian | Stays within 3 squares of VIP, defensive stance + alert mode |
| Watcher | Enhanced hearing range, shares intel with teammates |
| Decoy | Creates distraction noise (50dB every 3 turns), has detectable power |

---

## Scenario Analysis

### Scenario 1: SWAT Raid

**Setup**:
- 2 Criminals in H3 (must reach guns in back room)
- 4 SWAT operators on street
- Guns located at back of house

**Expected Outcomes**:
- **If criminals reach guns first**: Combat becomes even; ~50% survival rate
- **If SWAT breaches fast**: Criminals caught without weapons; ~80% SWAT win
- **Sound dynamics**: Door breach (85dB) alerts entire neighborhood; running (50dB) heard through walls

**Tactical Findings**:
- Criminals benefit from quiet movement (15dB) while SWAT approaches
- SWAT benefits from speed over stealth (breach window is short)
- Interior walls create room-clearing challenges

### Scenario 2: Superhero Battle

**Setup**:
- Titan (STR 80, super strength) in H1
- Blaze (CON 60, fire powers) in H8
- Crusher (STR 70) attacking from north
- Shadow (AGL 60, stealth) attacking from south

**Expected Outcomes**:
- **Power detection**: Titan and Blaze are detectable; Crusher and Shadow home in
- **Shadow vs Blaze**: Shadow's non-detectable stealth gives advantage
- **Titan vs Crusher**: STR matchup favors Titan (80 vs 70)

**Tactical Findings**:
- Detectable powers create strategic trade-off: powerful but locatable
- Non-detectable powers (Shadow's stealth) allow flanking
- Superhero HP pools (150-200) extend combat duration

### Scenario 3: Scientist Defense (NEW GAME MODE)

**Setup**:
- Dr. Vale (VIP) hidden in random house
- Guardian (detectable shield power) near VIP
- Watcher (non-detectable enhanced senses) in separate house
- Decoy (detectable illusion power) in third house
- 4 Hunters spawn at map corners

**Expected Outcomes Analysis**:

| Attacker Approach | Win Probability | Average Turns |
|-------------------|-----------------|---------------|
| Search all houses linearly | 40% | 35-50 |
| Follow power detection first | 55% | 20-30 |
| Split: 2 detect, 2 search | 65% | 25-35 |

**Key Dynamics**:
1. **Decoy Effectiveness**: Hunters detect Decoy's power and investigate
   - Delays search by 3-5 turns as 1-2 hunters verify decoy location
   - Decoy generates distraction noise to further mislead

2. **Guardian Trade-off**: Must stay near VIP but detectable
   - If attackers detect Guardian, they know VIP is nearby
   - Guardian's defensive stance (+2CS defense) protects during combat

3. **Watcher Intelligence**: Shares sound intel with team
   - INS 70 = 14 square hearing range at 30dB
   - Can hear door breaches (85dB) from 40+ squares away
   - Alerts team to attacker positions

**Optimal Defender Strategy**:
- Guardian uses defensive stance + alert mode
- Decoy positions in opposite corner from VIP
- Watcher monitors central location for approaching sounds

**Optimal Attacker Strategy**:
- Split into 2 teams of 2
- One team follows power detection (will find Guardian OR Decoy)
- One team searches houses systematically
- Share intel when target found

---

## Sound System Validation

### Hearing Range Calculations (INS 30 baseline)

| Sound Event | Base dB | Open Range | Through Wood Wall | Through Brick |
|-------------|---------|------------|-------------------|---------------|
| Walking | 30 | 6 sq | 2 sq | 0 sq |
| Running | 50 | 10 sq | 6 sq | 2 sq |
| Door Open | 40 | 8 sq | 5 sq | 1 sq |
| Door Breach | 85 | 17 sq | 13 sq | 9 sq |
| Gunshot | 140 | 28 sq | 24 sq | 20 sq |

**Formula**: Hearing Range = (INS/5) × (Effective_dB / 30)

**Validation Notes**:
- Whispers through doors correctly blocked (-25dB makes 20dB → -5dB = unhearable)
- Gunshots correctly heard across entire map even through walls
- Quiet movement (15dB) effective for stealth approach

---

## Combat Results Analysis

### Universal Table Hit Rates (Typical 30 stat)

| Roll Range | Result | Damage Multiplier |
|------------|--------|-------------------|
| 1-50 | Failed | 0x |
| 51-80 | Minor | 0.5x |
| 81-97 | Success | 1.0x |
| 98-100 | Major | 1.5x |

**Combat Duration Estimates**:
- Pistol vs 100 HP: ~5-7 successful hits (25-35 turns at 50% hit rate)
- Rifle vs 100 HP: ~3-4 successful hits (15-20 turns)
- Super power vs 100 HP: ~2-3 successful hits (10-15 turns)

### Stance Impact on Combat

| Attacker Stance | Defender Stance | Net Combat Modifier |
|-----------------|-----------------|---------------------|
| Neutral | Neutral | +0CS / +0CS |
| Aggressive | Defensive | +2CS attack / +2CS defense |
| Aggressive | Aggressive | +2CS attack / -2CS defense (glass cannon) |
| Defensive | Aggressive | -2CS attack / -2CS defense (defender disadvantage) |

---

## AI Iteration Log

### Version 1 Issues
- Pathfinding got stuck on walls (simple dx/dy movement)
- No coordination between teammates (searched same houses)
- Ignored sound intelligence

### Version 2 Improvements
- **A* Pathfinding**: Smart navigation around obstacles
- **Tactical Coordination**: Teammates avoid same search targets
- **Sound Investigation**: Prioritizes recent/loud sounds
- **Power Detection Sharing**: Shares intel with nearby teammates
- **Cover System**: Seeks cover when HP low
- **Breach Tactics**: Coordinated door entry

### Remaining Improvements (Future)
- Squad formations for breach and clear
- Overwatch coverage during movement
- Grappling system integration for close combat
- Suppressive fire zones
- Multi-floor navigation (basements)

---

## Balance Recommendations

### Scientist Defense Mode

**If attackers winning too often (>60%)**:
- Reduce power detection range (15 → 10 squares)
- Add more decoys with detectable powers
- Increase map size / house count

**If defenders winning too often (>60%)**:
- Increase power detection range (15 → 20 squares)
- Add more attackers (4 → 6)
- Reduce VIP house randomization

### General Combat Balance

**Observed Issues**:
1. Ranged combat too dominant (25-50 sq range vs 1 sq melee)
2. Alert mode very powerful for cost (2 AP for +2CS perception + dodge)
3. Defensive stance optimal in most situations

**Recommendations**:
1. Add indoor range penalties (furniture blocks LOS)
2. Alert mode could require stationary (no movement same turn)
3. Add scenario-specific stance bonuses (Aggressive for attackers, Defensive for defenders)

---

## Technical Notes

### Performance
- A* pathfinding limit: 500 nodes (prevents infinite loops)
- Map rendering: DOM-based grid (suitable for 50x40)
- Simulation speed: ~10ms per turn (browser-dependent)

### Code Structure
```
Tactical_AI_Simulation.html
├── Map Generation (createNeighborhood, createHouse)
├── Unit System (createUnit, stats, weapons)
├── Sound System (generateSound, countWallsBetween, hearing calc)
├── AI Logic (runAttackerAI, runDefenderAI)
├── Tactical Helpers (findCover, moveQuietly, breachHouse, setupAmbush)
├── Pathfinding (getAStarPath)
├── Combat (attackTarget, getWeapon)
├── Scenarios (SWAT, Superhero, Scientist Defense)
├── Simulation Loop (runTurn, checkWinConditions)
└── Batch Statistics (runBatchSimulation, collectStats)
```

---

## Conclusion

The Tactical AI Simulation Engine successfully demonstrates the integration of:

1. **Sound Detection System**: Units realistically hear and investigate sounds based on decibel levels and material dampening
2. **Door Interaction System**: Doors create tactical chokepoints; breach vs quiet entry is meaningful choice
3. **Combat Modes/Stances**: Defensive/Aggressive stances affect combat outcomes
4. **Power Detection**: Creates interesting attacker/defender dynamic in Scientist Defense mode

The **Scientist Defense** game mode shows particular promise as a core gameplay loop:
- **Asymmetric Information**: Defenders know VIP location; Attackers must search
- **Meaningful Choices**: Decoy placement, Guardian positioning, search prioritization
- **Power Trade-offs**: Detectable powers are double-edged sword

### Next Steps
1. Integrate wrestling/grappling system for melee encounters
2. Add basement/multi-floor support
3. Implement overwatch interrupts
4. Add civilian NPCs for moral dilemmas
5. Expand to multiplayer-ready architecture

---

*Report generated from Tactical_AI_Simulation.html v2.0*
*Systems Reference: Wrestling_Martial_Arts_Complete.csv, Combat_Modes_Stances.csv, Sound_Detection_System.csv, Door_Interaction_System.csv*
