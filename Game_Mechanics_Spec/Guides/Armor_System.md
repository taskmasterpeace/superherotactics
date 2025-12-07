# Armor System

## Overview

Armor provides **Damage Reduction (DR)** against incoming attacks. You can use **pre-made armor** or **build custom armor** through research and crafting.

---

## Armor Stats

| Stat | What It Does |
|------|--------------|
| **DR_Physical** | Reduces physical damage (bullets, blades, blunt) |
| **DR_Energy** | Reduces energy damage (fire, electric, plasma) |
| **DR_Mental** | Reduces psychic damage (rare, usually 0) |
| **Coverage** | What body parts are protected |
| **Condition** | Durability - degrades with damage |
| **Weight** | Affects mobility and carry capacity |
| **STR_Required** | Minimum STR to wear |
| **Movement_Penalty** | Squares lost per turn |
| **Stealth_Penalty** | Column shift penalty to stealth |

---

## Armor Categories

### Light Armor
- **Concealable** - wear under clothes
- **Low DR** (3-10)
- **No penalties**
- Examples: Kevlar Vest, Leather Jacket, Stab Vest

### Medium Armor
- **Tactical** - obvious but mobile
- **Medium DR** (10-20)
- **Small penalties** (-1 movement, -1CS stealth)
- Examples: Tactical Vest, Riot Gear, Combat Armor

### Heavy Armor
- **Maximum protection** - bulky and slow
- **High DR** (20-40)
- **Significant penalties** (-2 to -4 movement, -3CS stealth)
- Examples: Military Plate, Bomb Suit, Juggernaut Armor

### Power Armor
- **Tech-enhanced** - abilities built in
- **High DR** (15-50)
- **May have bonuses** (+STR, Flight, etc.)
- **Requires power** - battery limited
- Examples: Power Armor Mk1, Stealth Suit, Flight Suit

### Shields
- **Directional protection** - front only
- **Requires Block action** to use
- **Can be combined** with worn armor
- Examples: Riot Shield, Ballistic Shield, Energy Shield

### Natural Armor (Powers)
- **Innate super protection**
- **No weight or penalties**
- **Infinite condition** - never breaks
- Examples: Super Durability, Stone Skin, Force Aura

---

## How DR Works

```
Incoming Damage - DR = Final Damage

Example:
- Enemy shoots for 30 damage
- You have DR_Physical 12
- Final damage: 30 - 12 = 18
```

### Damage Type Matching
- Physical attacks → DR_Physical
- Energy attacks → DR_Energy
- Mental attacks → DR_Mental

### Armor Piercing
Some weapons/powers **ignore** or **reduce** armor effectiveness:
- Armor Piercing ammo: 50% of DR applies
- Super Strength (high): May ignore DR entirely
- Mental attacks: Usually bypass physical DR

---

## Armor Condition

Armor degrades when you take hits.

| Condition | % | Effect |
|-----------|---|--------|
| Perfect | 100% | Full protection |
| Good | 75-99% | Full protection |
| Worn | 50-74% | -2 DR all types |
| Damaged | 25-49% | -5 DR, -1CS movement |
| Critical | 1-24% | -10 DR, -2CS all actions |
| Broken | 0% | No protection |

### Condition Loss
- Each hit that deals damage: -1 to -5 condition
- Bigger hits = more condition loss
- Critical hits: Double condition loss

### Repair
| Type | Time | Location | Cost |
|------|------|----------|------|
| Basic Maintenance | 30 min | Anywhere | Free |
| Field Repair | 1 hour | Anywhere | Repair Kit |
| Workshop Repair | 4 hours | Workshop | Spare Parts |
| Full Rebuild | 8 hours | Workshop | 50% materials |

---

## Custom Armor Building

Build your own armor by combining:
1. **Base Frame** - Starting template
2. **Material** - What it's made of
3. **Components** - Add-on modules

### Step 1: Choose a Frame

| Frame | Category | Base DR | Coverage | Slots | Research |
|-------|----------|---------|----------|-------|----------|
| Vest_Frame | Light | 5/0 | Torso | 2 | None |
| Tactical_Frame | Medium | 8/2 | Torso | 4 | Armor_1 |
| Combat_Frame | Medium | 10/3 | Full | 6 | Armor_2 |
| Heavy_Frame | Heavy | 15/5 | Full | 8 | Armor_3 |
| Exo_Frame | Power | 10/10 | Full | 10 | Robotics_2 |
| Stealth_Frame | Power | 5/5 | Full | 6 | Stealth_2 |
| Flight_Frame | Power | 8/12 | Full | 8 | Propulsion_2 |

### Step 2: Choose a Material

| Material | Phys Mult | Energy Mult | Weight Mult | Research |
|----------|-----------|-------------|-------------|----------|
| Standard | 1.0x | 1.0x | 1.0x | None |
| Hardened_Steel | 1.3x | 0.9x | 1.4x | Metallurgy_1 |
| Titanium | 1.2x | 1.1x | 0.7x | Metallurgy_2 |
| Carbon_Fiber | 1.1x | 1.0x | 0.5x | Materials_2 |
| Graphene_Layer | 1.5x | 1.3x | 0.3x | Materials_3 |
| Vibranium | 2.0x | 1.5x | 0.6x | Alien_Tech |

### Step 3: Add Components

Use available **slots** to add modules:

| Component | Slot | Bonus | Research |
|-----------|------|-------|----------|
| Ceramic_Plate | Torso | +8 DR_Phys | None |
| Titanium_Plate | Torso | +12 DR_Phys | Metallurgy_1 |
| Helmet_Ballistic | Head | +10 DR_Phys | None |
| Visor_HUD | Face | +1CS targeting | Electronics_2 |
| Night_Vision | Head | See in dark | Electronics_1 |
| Thermal_Module | Head | See heat | Electronics_2 |
| Exo_Assist_Legs | Legs | +2 movement | Robotics_2 |
| Exo_Assist_Arms | Arms | +15 STR | Robotics_2 |
| Jump_Jets | Back | Jump 10 squares | Propulsion_2 |
| Flight_Pack | Back | Full flight | Propulsion_3 |
| Stealth_Coating | Surface | +2CS stealth | Stealth_2 |

### Build Example

**"Shadow Infiltrator Suit"**

```
Frame: Stealth_Frame
- Base: 5 DR_Phys / 5 DR_Energy
- Weight: 15 lbs
- Slots: 6

Material: Carbon_Fiber
- Phys: 5 × 1.1 = 5.5 → 6
- Energy: 5 × 1.0 = 5
- Weight: 15 × 0.5 = 7.5 lbs

Components (4 of 6 slots):
- Stealth_Coating (+2CS stealth)
- Visor_HUD (+1CS targeting)
- Air_Filter (gas immunity)
- Comms_Module (encrypted radio)

FINAL:
- DR: 6 Physical / 5 Energy
- Weight: 11.5 lbs
- Special: +2CS stealth, +1CS targeting, gas immune, comms
```

---

## Research Tree

To build advanced armor, you must **research** technologies:

### Armor Design
```
None → Armor_1 (5 days)
         ↓
      Armor_2 (10 days)
         ↓
      Armor_3 (15 days)
```

### Materials
```
None → Metallurgy_1 (7 days) → Metallurgy_2 (14 days)

None → Materials_1 (10 days) → Materials_2 (14 days) → Materials_3 (21 days)
```

### Tech
```
None → Electronics_1 (7 days) → Electronics_2 (14 days)
              ↓
         Robotics_1 (10 days) → Robotics_2 (21 days)
              ↓
         Propulsion_1 (10 days) → Propulsion_2 (21 days) → Propulsion_3 (30 days)
              ↓
         Stealth_1 (14 days) → Stealth_2 (28 days)
```

### Research Requirements
- **Time**: Days of research
- **Materials**: Samples/components needed
- **Location**: Research lab or workshop
- **Skill**: Engineering skill helps

---

## Shields

Shields work differently from worn armor:

### Using a Shield
1. **Equip** shield in off-hand
2. **Declare Block action** (costs AP)
3. Shield DR applies **from front only**
4. Can combine with worn armor DR

### Shield Types
| Shield | DR_Phys | DR_Energy | Weight | Notes |
|--------|---------|-----------|--------|-------|
| Riot Shield | 20 | 5 | 8 lbs | Standard |
| Ballistic Shield | 30 | 10 | 15 lbs | Stops rifles |
| Energy Shield | 15 | 40 | 5 lbs | Tech; 2hr battery |
| Tower Shield | 25 | 5 | 25 lbs | Full body cover |

---

## Power Armor Special Rules

### Battery Life
- Power armor has **limited battery**
- Mk1: 4 hours
- Mk2: 8 hours
- When battery dies: No bonuses, -2 movement (heavy dead weight)

### STR Bonus
- Power armor provides **STR bonus**
- Applies to melee damage and lifting
- Does NOT stack with natural Super Strength

### Built-In Systems
Power armor may include:
- HUD targeting
- Flight capability
- Enhanced strength
- Environmental sealing
- Weapon mounts

---

## Natural Armor (Powers)

Characters with **Super Durability** or similar powers get built-in armor:

| Power | DR_Phys | DR_Energy | Special |
|-------|---------|-----------|---------|
| Super Durability (Low) | 15 | 10 | - |
| Super Durability (High) | 30 | 20 | - |
| Stone Skin | 25 | 5 | +5 vs blunt |
| Metal Skin | 35 | 15 | Magnetic vulnerability |
| Force Aura | 20 | 30 | Can project |
| Adaptive Armor | 20 | 20 | +10 vs last damage type |

### Natural + Worn Armor
- **Does NOT stack** by default
- Use **higher** value
- Some combinations allowed (GM discretion)

---

## Quick Reference

### Armor by Situation
| Situation | Recommended |
|-----------|-------------|
| Undercover work | Light (Kevlar Vest) |
| Standard combat | Medium (Tactical Vest) |
| Heavy assault | Heavy (Military Plate) |
| Infiltration | Power (Stealth Suit) |
| Aerial combat | Power (Flight Suit) |
| Entry team | Medium + Shield |

### DR Benchmarks
| DR | Stops |
|----|-------|
| 5 | Knife, Pistol graze |
| 10 | Pistol solid hit |
| 15 | SMG, Light rifle |
| 20 | Assault rifle |
| 30 | Heavy rifle, Most weapons |
| 40+ | Only heavy/exotic weapons penetrate |

---

## Related Files

| File | Contents |
|------|----------|
| Armor_Complete.csv | Full armor database |
| Weapons_Complete.csv | Weapon damage reference |
| Tech_Gadgets_Complete.csv | Tech equipment |
| Research system | (To be created) |

---

*Last Updated: 2024-12-05*
*Version: 1.0*
