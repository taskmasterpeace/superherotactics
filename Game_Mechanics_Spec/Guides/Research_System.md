# Research System

## Overview

Research allows your team to **unlock new equipment, upgrades, and capabilities**. Research requires:
- **Researcher** with appropriate education and career
- **Facility** with required equipment
- **Time** to complete the project
- **Resources** (materials, samples, funding)

---

## Research Requirements

### Education Level Required

Your education determines what you **can** research:

| Education Level | Research Capability | Speed Modifier |
|-----------------|---------------------|----------------|
| No Formal / High School | Cannot research (can assist only) | N/A |
| Trade School | Basic only | 0.5x (half speed) |
| Associates | Basic only | 0.75x |
| Bachelors | Basic + Intermediate | 1.0x (standard) |
| Masters | Basic + Intermediate + Advanced | 1.25x |
| Doctorate | All levels | 1.5x |
| Post-Doc | All levels + Experimental | 2.0x |

### Career Category Required

Your career determines **what types** you can research:

| Research Type | Required Career | Minimum Rank |
|---------------|-----------------|--------------|
| Medical | MED (Medical/Life Sciences) | 2 |
| Biological | MED | 3 |
| Mutagenics | MED | 5 |
| Electronics | TECH (Engineering/Technology) | 2 |
| Weapons | TECH | 3 |
| Armor | TECH | 2 |
| Robotics | TECH | 4 |
| AI Systems | TECH | 4 |
| Propulsion | TECH | 4 |
| Cyber/Hacking | TECH | 3 |
| Psi-Tech | PSY (Psychology/Social) | 4 |
| Historical | EDU (Liberal Arts/Education) | 2 |
| Economic | BIZ (Business/Finance) | 3 |

**Note:** TECH career unlocks the most research types. For exotic research, you need specialists.

---

## Facilities

Research requires appropriate **facilities**. Each facility type enables specific research:

### Facility Types

| Facility | Cost to Build | Monthly Maintenance | Research Types Enabled |
|----------|---------------|---------------------|------------------------|
| **Workshop** | $50,000 | $2,000 | Basic armor, weapon mods, field gear |
| **Electronics Lab** | $100,000 | $5,000 | Electronics, sensors, communications |
| **Medical Lab** | $150,000 | $8,000 | Medical tech, basic biological |
| **Cyber Lab** | $200,000 | $10,000 | Hacking tools, software, AI basics |
| **Weapons Lab** | $250,000 | $12,000 | Weapons, ammunition, explosives |
| **Armor Workshop** | $200,000 | $10,000 | All armor types, materials research |
| **Robotics Lab** | $500,000 | $25,000 | Robotics, drones, exoskeletons |
| **Aerospace Lab** | $750,000 | $30,000 | Propulsion, flight systems, vehicles |
| **Genetics Lab** | $500,000 | $25,000 | Biological, genetic modification |
| **Mutagenics Lab** | $1,000,000 | $50,000 | Mutagenics, LSW research |
| **Psi Lab** | $500,000 | $25,000 | Psi-tech, psychic research |
| **Alien Tech Lab** | $2,000,000 | $100,000 | Alien technology, exotic materials |

### Facility Upgrades

Each facility can be upgraded to improve research:

| Upgrade | Cost | Effect |
|---------|------|--------|
| Basic Equipment | Included | Standard research |
| Advanced Equipment | +50% | +0.25x research speed |
| Cutting-Edge Equipment | +100% | +0.5x research speed |
| Experimental Equipment | +200% | +0.75x research speed, enables experimental projects |

### Facility Requirements

Facilities also need:
- **Power**: Adequate electrical supply
- **Security**: Prevents theft/sabotage
- **Staff**: Technicians for maintenance (included in monthly cost)
- **Location**: Must be in a city with appropriate infrastructure

---

## Research Process

### Step 1: Choose Project

Select a research project from the available list. Requirements:
- Lead researcher meets education + career requirements
- Facility has required equipment
- You have required resources/samples

### Step 2: Assign Team

Research teams provide bonuses:

| Team Role | Requirement | Bonus |
|-----------|-------------|-------|
| Lead Researcher | Required | Base research speed |
| Assistant Researcher | Bachelors+ | +25% speed per assistant |
| Technician | Trade School+ | +10% speed, handles lab work |
| Specialist | Career match | +15% speed in their specialty |

**Maximum Team Size:** Facility dependent (usually 2-6)

### Step 3: Research Time

Base research time is modified by:

```
Final Time = Base Time / (Education Modifier × Team Modifier × Facility Modifier)

Example: Researching Power Armor Mk2 (Base: 30 days)

Lead: Doctorate Robotics Engineer (1.5x)
Team: +1 Assistant (+0.25x)
Facility: Advanced Equipment (+0.25x)

Total Modifier: 1.5 × 1.25 × 1.25 = 2.34x

Final Time: 30 / 2.34 = 12.8 days (round up to 13 days)
```

### Step 4: Resource Cost

Research consumes resources:

| Resource Type | Examples | Where to Get |
|---------------|----------|--------------|
| Basic Materials | Steel, plastic, copper | Purchase |
| Advanced Materials | Titanium, carbon fiber | Purchase (higher cost) |
| Exotic Materials | Graphene, vibranium | Missions, black market |
| Samples | Enemy tech, alien artifacts | Missions, investigations |
| Components | Computer chips, motors | Purchase or salvage |
| Funding | Monthly budget | Faction support, missions |

### Step 5: Research Roll (Optional)

For critical research, GM may require a research check:

```
Research Check = d100 vs INT column

Success: Research completes normally
Green: Research completes 25% faster
Yellow: Research completes on time
Red: Minor complication (delay, extra cost)
Failure: Major complication (significant delay, restart needed)
```

---

## Research Trees

Research projects unlock in **trees** - you must complete prerequisites first.

### Armor Tree

```
[Basic Armor Knowledge] (5 days)
         |
    +----+----+
    |         |
[Armor_1]  [Metallurgy_1]
(10 days)    (7 days)
    |         |
[Armor_2]  [Metallurgy_2]
(15 days)   (14 days)
    |         |
[Armor_3]  [Materials_1]
(20 days)   (10 days)
              |
          [Materials_2] → [Materials_3]
           (14 days)      (21 days)
```

### Electronics Tree

```
[Basic Electronics] (5 days)
         |
    +----+----+
    |         |
[Electronics_1] [Cyber_1]
  (7 days)     (10 days)
    |            |
[Electronics_2] [Cyber_2]
  (14 days)    (14 days)
    |            |
[Robotics_1]  [AI_1]
  (10 days)   (21 days)
    |            |
[Robotics_2]  [AI_2]
  (21 days)   (30 days)
```

### Propulsion Tree

```
[Basic Propulsion] (7 days)
         |
[Propulsion_1] (10 days)
         |
    +----+----+
    |         |
[Propulsion_2] [Stealth_1]
  (21 days)    (14 days)
    |            |
[Propulsion_3] [Stealth_2]
  (30 days)    (28 days)
```

### Medical Tree

```
[Basic Medical] (5 days)
         |
[Medical_1] (7 days)
         |
    +----+----+
    |         |
[Medical_2] [Bio_1]
 (14 days)  (14 days)
    |          |
[Neuro_1]   [Bio_2]
(21 days)   (21 days)
    |          |
[Neuro_2]   [Mutagenics_1]
(30 days)    (45 days)
```

### Weapons Tree

```
[Basic Weapons] (5 days)
         |
[Weapons_1] (7 days)
         |
    +----+----+
    |         |
[Weapons_2] [Ammo_1]
 (14 days)  (10 days)
    |          |
[Weapons_3] [Ammo_2]
 (21 days)  (14 days)
    |
[Energy_Weapons]
   (30 days)
```

---

## Research Projects

### Basic Projects (Trade School+)

| Project | Time | Facility | Output |
|---------|------|----------|--------|
| Weapon Maintenance | 2 days | Workshop | +1CS weapon reliability |
| Basic Armor Repair | 3 days | Workshop | Repair any armor to 75% |
| Ammo Crafting | 1 day | Workshop | Craft standard ammunition |
| Field Medicine | 3 days | Medical Lab | +1CS field medical checks |
| Basic Electronics | 5 days | Electronics Lab | Unlock Electronics_1 |

### Intermediate Projects (Bachelors+)

| Project | Time | Facility | Output | Prerequisite |
|---------|------|----------|--------|--------------|
| Ceramic Plates | 7 days | Armor Workshop | +8 DR_Phys armor component | Armor_1 |
| Titanium Plates | 10 days | Armor Workshop | +12 DR_Phys component | Metallurgy_1 |
| Night Vision Mod | 7 days | Electronics Lab | NV weapon attachment | Electronics_1 |
| Thermal Scope | 10 days | Electronics Lab | Thermal weapon attachment | Electronics_2 |
| Silencer | 5 days | Weapons Lab | -30dB sound modifier | Weapons_1 |
| AP Rounds | 7 days | Weapons Lab | Armor piercing ammunition | Ammo_1 |
| Recon Drone | 10 days | Robotics Lab | DRN_001 equivalent | Robotics_1 |

### Advanced Projects (Masters+)

| Project | Time | Facility | Output | Prerequisite |
|---------|------|----------|--------|--------------|
| Exo-Assist Arms | 21 days | Robotics Lab | +15 STR component | Robotics_2 |
| Exo-Assist Legs | 21 days | Robotics Lab | +2 movement component | Robotics_2 |
| Jump Jets | 21 days | Aerospace Lab | Jump 10 squares component | Propulsion_2 |
| Stealth Coating | 28 days | Armor Workshop | +2CS stealth coating | Stealth_2 |
| Combat Drone | 30 days | Robotics Lab | DRN_003 equivalent | Robotics_2, AI_1 |
| Graphene Armor | 30 days | Armor Workshop | 1.5x DR multiplier | Materials_3 |
| Energy Weapon | 45 days | Weapons Lab | Basic energy rifle | Energy_Weapons |

### Expert Projects (Doctorate+)

| Project | Time | Facility | Output | Prerequisite |
|---------|------|----------|--------|--------------|
| Power Armor Mk1 | 30 days | Robotics Lab | Full power armor suit | Robotics_2, Armor_2 |
| Power Armor Mk2 | 45 days | Robotics Lab | Enhanced power armor | Power Armor Mk1 |
| Flight Pack | 45 days | Aerospace Lab | Full flight capability | Propulsion_3 |
| AI Assistant | 60 days | Cyber Lab | +1CS all research | AI_2 |
| Neural Interface | 60 days | Robotics + Medical | Direct neural control | Neuro_2, Robotics_2 |
| Stealth Suit | 45 days | Armor Workshop | Full stealth armor | Stealth_2, Armor_2 |

### Experimental Projects (Post-Doc)

| Project | Time | Facility | Output | Prerequisite |
|---------|------|----------|--------|--------------|
| Quantum Decryptor | 90 days | Alien Tech Lab | Unbreakable decryption | AI_2 + Alien sample |
| Power Armor Mk3 | 90 days | Robotics Lab | Super-tier armor | Power Armor Mk2 |
| LSW Serum | 120 days | Mutagenics Lab | Grants random power | Mutagenics_1 + DNA samples |
| Alien Adaptation | 90 days | Alien Tech Lab | Reverse-engineer alien tech | Alien artifact |
| Vibranium Armor | 120 days | Alien Tech Lab | 2.0x DR multiplier | Alien sample + Materials_3 |

---

## Research Team Composition Examples

### Building Power Armor Mk2

```
Required:
- Lead: Doctorate, TECH Rank 4 (Robotics Engineer)
- Facility: Robotics Lab + Aerospace Lab access
- Prerequisite: Power Armor Mk1 completed

Optimal Team:
- Lead: Robotics Engineer (Doctorate) - 1.5x
- Assistant 1: Aerospace Engineer (Masters) - +0.25x
- Assistant 2: Weapon Designer (Bachelors) - +0.25x (weapon integration)
- Technician: Electronics Tech - +0.10x

Total Modifier: 1.5 × 1.6 = 2.4x
Base Time: 45 days
Final Time: 45 / 2.4 = 19 days
```

### Researching Mutagenics Serum

```
Required:
- Lead: Doctorate (Post-Doc preferred), MED Rank 5 (Mutagenics Researcher)
- Facility: Mutagenics Lab
- Resources: 3 LSW DNA samples, $500,000 funding

Optimal Team:
- Lead: Mutagenics Researcher (Post-Doc) - 2.0x
- Assistant 1: Geneticist (Doctorate) - +0.25x
- Assistant 2: Biochemist (Masters) - +0.25x
- Safety Officer: Required for mutagenics - no speed bonus

Total Modifier: 2.0 × 1.5 = 3.0x
Base Time: 120 days
Final Time: 120 / 3.0 = 40 days
```

---

## Research Failure and Complications

### Complication Table

When research fails or has complications, roll:

| d100 | Complication |
|------|--------------|
| 01-20 | **Minor Delay**: +25% time |
| 21-40 | **Resource Waste**: Extra materials needed |
| 41-55 | **Equipment Damage**: Facility needs repair (1-3 days) |
| 56-70 | **Partial Success**: Lower quality result (-1 tier) |
| 71-80 | **Breakthrough!**: Research completes early (-25% time) |
| 81-90 | **Injury**: Researcher injured (minor, 1d6 days recovery) |
| 91-95 | **Catastrophic Failure**: Research must restart |
| 96-99 | **Explosion/Accident**: Major facility damage, injuries possible |
| 00 | **Unexpected Discovery**: Bonus research unlocked! |

### Safety Protocols

Higher-risk research (Mutagenics, Explosives, Alien Tech) requires:
- Safety equipment (+10% cost)
- Emergency protocols
- Backup systems

Without safety protocols, complication range expands (01-40 becomes 01-60).

---

## Quick Reference

### Research Time Formula

```
Final Days = Base Days / (Education Mod × Team Mod × Facility Mod)
```

### Modifier Summary

| Factor | Modifier |
|--------|----------|
| Trade School | 0.5x |
| Bachelors | 1.0x |
| Masters | 1.25x |
| Doctorate | 1.5x |
| Post-Doc | 2.0x |
| Per Assistant | +0.25x |
| Per Technician | +0.10x |
| Per Specialist | +0.15x |
| Advanced Facility | +0.25x |
| Cutting-Edge Facility | +0.5x |

### Facility Quick Reference

| Research Type | Facility Required |
|---------------|-------------------|
| Armor/Materials | Armor Workshop |
| Weapons/Ammo | Weapons Lab |
| Electronics/Sensors | Electronics Lab |
| Robotics/Drones | Robotics Lab |
| Flight/Vehicles | Aerospace Lab |
| Hacking/AI | Cyber Lab |
| Medical | Medical Lab |
| Biological/Genetics | Genetics Lab |
| Mutagenics/LSW | Mutagenics Lab |
| Psi-Tech | Psi Lab |
| Alien Tech | Alien Tech Lab |

---

## Integration with Other Systems

### Education → Research
- Education level determines **capability** (what tiers you can research)
- Education level determines **speed** (modifier to research time)

### Career → Research
- Career category determines **types** (what you can research)
- Career rank determines **access** (minimum rank for certain projects)

### Facilities → Research
- Facility type enables **specific research**
- Facility quality improves **speed**

### Research → Equipment
- Completed research unlocks **new items** in Armor_Complete.csv, Weapons_Complete.csv, Tech_Gadgets_Complete.csv

### Research → Powers
- Mutagenics research can **grant powers** (dangerous, random)
- Psi-Tech research enhances **psychic abilities**

---

## Related Files

| File | Contents |
|------|----------|
| Research_Projects.csv | Full project database |
| Education_Career_Complete.csv | Career requirements |
| Armor_Complete.csv | Armor outputs |
| Weapons_Complete.csv | Weapon outputs |
| Tech_Gadgets_Complete.csv | Tech outputs |

---

*Last Updated: 2024-12-05*
*Version: 1.0*
