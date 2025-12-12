---
name: sht-loadout-optimizer
description: Build optimal character loadouts matching weapons, armor, and gadgets to character stats, skills, mission profiles, and budget constraints.
---

# SHT Loadout Optimizer

You help players build optimal equipment loadouts for their characters based on stats, skills, mission type, and budget constraints.

## Key Data Files

- `MVP/src/data/weapons.ts` - All weapons with requirements
- `MVP/src/data/armor.ts` - All armor with DR and penalties
- `MVP/src/stores/gameStore.ts` - Character interface and stats
- `MVP/src/data/equipmentTypes.ts` - COST_VALUES, SkillRequirement

## Character Stats

```typescript
interface Character {
  stats: {
    MEL: number;  // Melee combat
    AGL: number;  // Agility/dodge
    STR: number;  // Strength
    STA: number;  // Stamina
    INT: number;  // Intelligence
    INS: number;  // Insight/perception
    CON: number;  // Constitution
  };
  threatLevel: 'THREAT_A' | 'THREAT_1' | 'THREAT_2' | 'THREAT_3' | 'THREAT_4' | 'THREAT_5';
  origin: string;
  powers: string[];
  skills: string[];
}
```

## Equipment Requirements

**Skill Requirements** (from equipmentTypes.ts):
- `None` - Anyone can use
- `Shooting` - Pistols, SMGs
- `Sniper` - Sniper rifles
- `Heavy_Weapons` - Rocket launchers, miniguns
- `Bowmaster` - Bows
- `Katana`, `Staff`, `Swords`, `Spear` - Skilled melee
- `Martial_Arts` - Unarmed combat bonuses
- `Energy_Weapons` - Laser, plasma weapons
- `Flamethrower`, `Rocketman` - Special weapons

**STR Requirements**: Heavy weapons and armor have minimum STR

## Cost Levels

```typescript
COST_VALUES = {
  'Free': 0,
  'Low': 100,
  'Medium': 500,
  'High': 2000,
  'Very_High': 10000,
  'Ultra_High': 50000
}
```

## Character Archetypes

### 1. Tank (High STR/STA)
- **Armor**: Heavy or Power armor (high DR)
- **Weapons**: Shotgun, melee weapons
- **Gadgets**: Medical kit, stim packs
- **Role**: Front-line damage absorption

### 2. Sniper (High AGL/INS)
- **Armor**: Light armor (mobility)
- **Weapons**: Sniper rifle, pistol backup
- **Gadgets**: Scope, sensors, comms
- **Role**: Long-range precision

### 3. Tech Specialist (High INT)
- **Armor**: Light/medium with tech integration
- **Weapons**: Energy weapons, drones
- **Gadgets**: Hacking tools, EMP, sensors
- **Role**: Electronic warfare, support

### 4. Melee Fighter (High MEL/STR)
- **Armor**: Medium (mobility + protection)
- **Weapons**: Katana, battle staff, martial arts
- **Gadgets**: Stim packs, smoke grenades
- **Role**: Close-quarters combat

### 5. Support (High CON/INT)
- **Armor**: Light to medium
- **Weapons**: SMG, pistol (defensive)
- **Gadgets**: Medical kit, comms, sensors
- **Role**: Healing, buffs, information

### 6. Stealth Operative (High AGL/INS)
- **Armor**: Light only (stealthPenalty >= 0)
- **Weapons**: Silenced pistol, knife
- **Gadgets**: Lockpicks, sensors, smoke
- **Role**: Infiltration, assassination

## Optimization Criteria

1. **Skill Match**: `weapon.skillRequired` must be in `character.skills[]` OR be `'None'`
2. **STR Requirement**: `character.stats.STR >= item.strRequired`
3. **Budget Fit**: `sum(equipment.costValue) <= missionBudget`
4. **Weight Limit**: Based on STR (from strengthSystem.ts)
5. **Role Synergy**: All equipment supports the intended playstyle

## Loadout Template

```
CHARACTER: [Name]
ROLE: [Archetype]
BUDGET: $[amount]

PRIMARY WEAPON: [weapon] - $[cost]
  - Meets skill req: [skill] ✓
  - Meets STR req: [STR] ✓

SECONDARY: [weapon] - $[cost]

ARMOR: [armor] - $[cost]
  - DR Physical: [X]
  - DR Energy: [X]
  - Movement: [penalty]
  - Stealth: [penalty]

GADGETS:
  - [gadget1] - $[cost]
  - [gadget2] - $[cost]

TOTAL: $[sum] / $[budget]
REMAINING: $[difference]
```

## Budget Tiers

- **Street Level** ($1,000): Basic pistol, leather jacket
- **Professional** ($5,000): Quality firearm, kevlar, basic gadgets
- **Elite** ($15,000): Assault rifle, tactical armor, sensors
- **Superhero** ($50,000): Energy weapons, power armor, full loadout

## Example Queries

- "Build a sniper loadout for character with AGL 75, INT 60, budget $5000"
- "Recommend armor for a STR 45 tank who needs DR > 15"
- "Find weapons that don't require skills for a new recruit"
- "Optimize a stealth operative loadout with stealthPenalty = 0"
- "Create budget loadouts at $2000, $5000, $10000 for a shooter"

## Loadout Scoring

Score a loadout on:
- **Damage Output**: Weapon DPS relative to cost
- **Survivability**: Armor DR relative to weight
- **Mobility**: Movement penalty impact
- **Versatility**: Range coverage, backup options
- **Role Fit**: How well it matches archetype

## Synergy Bonuses

- **Sniper + Sensor gadget**: +1 accuracy at long range
- **Stealth armor + Silenced weapon**: Maintains stealth after attack
- **Power armor + Heavy weapon**: Negates STR requirement
- **Medical kit + High CON**: Better healing efficiency
