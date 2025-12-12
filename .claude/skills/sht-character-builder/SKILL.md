---
name: sht-character-builder
description: Create and optimize characters with stats, powers, skills, equipment, and threat level calculations for SuperHero Tactics.
---

# SHT Character Builder

You help create balanced characters following the SHT stat system, threat level classification, and power/skill frameworks.

## Key Data Files

- `MVP/src/stores/gameStore.ts` - Character interface
- `MVP/src/data/recruitableCharacters.ts` - Example characters
- `MVP/src/data/strengthSystem.ts` - STR-derived attributes
- `MVP/src/components/CharacterScreen.tsx` - Full character UI

## Character Interface

```typescript
interface Character {
  id: string;
  name: string;
  realName?: string;
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
  equipment: string[];
  skills: string[];
  health: {
    current: number;
    maximum: number;
  };
  status: 'ready' | 'busy' | 'injured' | 'traveling' | 'hospitalized';
  location: {
    country: string;
    city: string;
  };
  career: {
    category: string;
    rank: number;
  };
  experience: number;
  relationships: Record<string, number>;
}
```

## Stat Ranks

| Range    | Rank       | Description |
|----------|------------|-------------|
| 1-5      | Feeble     | Below average human |
| 6-10     | Poor       | Average human |
| 11-15    | Good       | Trained human |
| 16-25    | Excellent  | Peak human |
| 26-35    | Remarkable | Low superhuman |
| 36-50    | Incredible | Mid superhuman |
| 51-75    | Amazing    | High superhuman |
| 76-100   | Monstrous  | Extreme superhuman |
| 101-150  | Unearthly  | Near cosmic |
| 151+     | Beyond     | Cosmic level |

## Threat Levels

| Level    | Description           | Stat Range   | Example Characters |
|----------|-----------------------|--------------|--------------------|
| THREAT_A | Alpha (Skilled human) | 10-25 avg    | Black Widow, Punisher |
| THREAT_1 | Street level          | 15-30 avg    | Daredevil, Luke Cage |
| THREAT_2 | City level            | 25-45 avg    | Spider-Man, Iron Fist |
| THREAT_3 | Regional level        | 40-60 avg    | Iron Man, Captain America |
| THREAT_4 | National level        | 55-80 avg    | Thor, Hulk |
| THREAT_5 | Global/Cosmic level   | 75-100+ avg  | Superman, Silver Surfer |

## Origin Categories (from CLAUDE.md)

1. **Skilled Humans** - No powers, peak training
2. **Altered Humans** - Mutation, serum, accident
3. **Tech Enhancement** - Armor, cybernetics, gadgets
4. **Mystic** - Magic, divine, cosmic energy
5. **Alien** - Extraterrestrial physiology
6. **Robot/AI** - Artificial construction
7. **Undead** - Supernatural resurrection
8. **Hybrid** - Multiple origins combined
9. **Unknown** - Mysterious/classified source

## Threat Assessment Formulas (from CLAUDE.md)

### PCF (Power Combat Factor)
```
PCF = (MEL + AGL + STR) / 3 + PowerBonus
```

### STAM (Strategic Threat Assessment Metric)
```
STAM = PCF * (1 + PowerCount * 0.2) * OriginMultiplier
```

### SPAM (Superhuman Power Assessment Model)
```
SPAM = sum(PowerDangerRatings) * (MaxStat / 50)
```

## Stat Point Budget by Threat Level

| Threat Level | Total Points | Average Stat |
|--------------|--------------|--------------|
| THREAT_A     | 84-112       | 12-16        |
| THREAT_1     | 119-154      | 17-22        |
| THREAT_2     | 161-210      | 23-30        |
| THREAT_3     | 217-280      | 31-40        |
| THREAT_4     | 287-350      | 41-50        |
| THREAT_5     | 357-490      | 51-70        |

## Career Categories

1. **Military** - Soldiers, special forces, veterans
2. **Law Enforcement** - Police, agents, investigators
3. **Criminal** - Thieves, assassins, enforcers
4. **Technical** - Scientists, engineers, hackers
5. **Academic** - Professors, researchers, students
6. **Medical** - Doctors, nurses, EMTs
7. **Civilian** - Various backgrounds

## Career Rank Progression

| Rank | Title Example    | XP Required |
|------|------------------|-------------|
| 1    | Recruit          | 0           |
| 2    | Operative        | 1,000       |
| 3    | Agent            | 5,000       |
| 4    | Senior Agent     | 15,000      |
| 5    | Commander        | 50,000      |

## Character Creation Process

### Step 1: Concept
- Name and background
- Origin category
- Career path
- Target threat level

### Step 2: Stats
Distribute points based on threat level budget:
```
Example THREAT_2 (200 points):
MEL: 35  (Remarkable)
AGL: 40  (Incredible)
STR: 25  (Excellent)
STA: 30  (Remarkable)
INT: 25  (Excellent)
INS: 25  (Excellent)
CON: 20  (Good)
```

### Step 3: Powers
Select 0-5 powers appropriate to origin:
- **Altered Human**: Super Strength, Healing Factor, Enhanced Senses
- **Tech Enhanced**: Armor, Flight, Energy Weapons
- **Mystic**: Magic, Teleportation, Dimensional Access
- **Alien**: Unique physiology powers

### Step 4: Skills
Select career-appropriate skills:
- **Military**: Shooting, Heavy Weapons, Tactics, Survival
- **Technical**: Computer, Electronics, Engineering
- **Criminal**: Stealth, Lockpicking, Streetwise

### Step 5: Equipment
Apply loadout within budget constraints.

### Step 6: Calculate Health
```
MaxHealth = STA * 2 + CON + 50
```

## Example Characters

### THREAT_A Example: Shadow Agent
```yaml
name: "Shadow Agent"
origin: "Skilled Human"
threatLevel: "THREAT_A"
stats:
  MEL: 20
  AGL: 22
  STR: 15
  STA: 18
  INT: 20
  INS: 18
  CON: 15
powers: []
skills: ["Stealth", "Shooting", "Lockpicking", "Investigation"]
career: { category: "Law Enforcement", rank: 3 }
```

### THREAT_3 Example: Tech Knight
```yaml
name: "Tech Knight"
origin: "Tech Enhancement"
threatLevel: "THREAT_3"
stats:
  MEL: 45
  AGL: 35
  STR: 50  # Power armor enhanced
  STA: 40
  INT: 55
  INS: 30
  CON: 35
powers: ["Powered Armor", "Flight", "Energy Weapons", "Sensors"]
skills: ["Engineering", "Computer", "Heavy Weapons"]
career: { category: "Technical", rank: 4 }
```

## Example Queries

- "Create a THREAT_2 Tech Enhanced character focused on hacking"
- "Calculate threat level for stats 60/70/45/50/80/65/55"
- "Design an Altered Human speedster with AGL 90+"
- "Build balanced team of 4: Tank, DPS, Support, Specialist"
- "Convert Captain America to SHT stat system"
