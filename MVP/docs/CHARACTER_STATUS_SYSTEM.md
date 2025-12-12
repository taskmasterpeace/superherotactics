# Character Status System - Parsed from Design Doc

## IMMEDIATE TODO (You mentioned these first):
1. **Birth City** - Every character needs a `birthCity` from our 1050 cities
2. **City Familiarity** - Track familiarity per character per city

---

## Character Statuses (14 total)

| Status | Icon | Trigger | Description |
|--------|------|---------|-------------|
| **Ready** | - | Default | Idle, awaiting commands |
| **Hospital** | Medical Symbol | 0 HP in combat (Origin 1-4) | Can't move without warning, recovery time |
| **Investigation** | Magnifying Glass | Player assigns | Detective work, earns Fame, risks solo combat |
| **CovertOps** | Fist | Player assigns | Investigations outside home country |
| **Personal Life** | - | Auto | Day job, family time |
| **Training** | Weights | Player assigns | Improve stats, maintain martial arts |
| **Patrol** | Superhero Mask | Player assigns | Farm Fame, increase City Familiarity, find hiding units |
| **Off the Grid** | Question Mark | Player assigns | Character hides, hard to find |
| **Engineering** | Wrench | Player assigns | Build/repair tech suits, robots, androids |
| **Research** | Microscope | Player assigns | Unlock tech, analyze evidence |
| **Travel** | Steering Wheel | Auto when moving | In transit |
| **Recruit** | Fist | Player assigns | Use Fame to find vigilantes |
| **Unconscious** | - | Combat result | Temporary incapacitation |
| **Dead** | Skull | Permadeath | Gone forever |

---

## Origin Types (Affects what happens at 0 HP)

| # | Origin | At 0 HP |
|---|--------|---------|
| 1 | Skilled Human | Hospital |
| 2 | Altered Human | Hospital |
| 3 | Tech Enhancement | Hospital |
| 4 | Mutated Human | Hospital |
| 5 | Spiritual Enhancement | ??? |
| 6 | Robotic | Needs repair (Engineering) |
| 7 | Symbiotic | ??? |
| 8 | Alien | ??? |
| 9 | Unknown | Reserved |

---

## Secondary Stats

```typescript
interface CharacterStats {
  // Primary (1-100)
  MEL: number;  // Melee
  AGL: number;  // Agility
  STR: number;  // Strength
  STA: number;  // Stamina
  INT: number;  // Intelligence
  INS: number;  // Instinct
  CON: number;  // Constitution

  // Derived
  health: number;      // MEL + AGL + STA + STR
  maxHealth: number;

  // Secondary (0-5000)
  wealth: number;
  fame: number;

  // Origin
  origin: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
}
```

---

## City Familiarity System

```typescript
interface CityFamiliarity {
  cityId: string;
  cityName: string;
  familiarity: number;  // 0-100
  lastVisited: number;  // timestamp
}

interface Character {
  // ... existing fields
  birthCity: string;           // Must be from game's city list
  cityFamiliarities: CityFamiliarity[];
}
```

**How familiarity increases:**
- Being in a city: +1/day
- Patrolling: +3/day (faster)
- Birth city starts at 100

**What familiarity affects:**
- Investigation speed in that city
- Patrol effectiveness
- Finding hiding units
- Random encounters?

---

## Investigation System (The 4 W's)

```typescript
interface Investigation {
  id: string;

  // The 4 W's (each needs 100 points to complete)
  why: { score: number; maxScore: number; revealed: boolean };   // Motive
  who: { score: number; maxScore: number; revealed: boolean };   // Suspect
  where: { score: number; maxScore: number; revealed: boolean }; // Location
  what: { score: number; maxScore: number; revealed: boolean };  // Crime type

  // Metadata
  difficulty: number;     // 1-10
  dangerRatio: number;    // Combat risk
  city: string;
  sector: string;

  // Progress
  status: 'available' | 'in_progress' | 'cold_case' | 'solved' | 'failed';
  assignedCharacters: string[];
  startedAt: number;
  lastWorkedAt: number;   // Cold case mechanic - longer idle = harder

  // Rewards
  fameReward: number;

  // Results
  finalFight?: boolean;   // Does solving trigger combat?
}
```

**Investigation Roll Results:**
- **Intelligence** speeds attempts:
  - Fail = 48hrs
  - Minor = 24hrs
  - Success = 12hrs
  - Major = 6hrs

- **Instinct** improves points gained:
  - Fail = 0
  - Minor = +1
  - Success = +3
  - Major = +5

---

## Engineering System

```typescript
type TechSuitType = 'battle' | 'speed' | 'stealth' | 'scuba' | 'flight' | 'specialty';

interface TechSuit {
  id: string;
  type: TechSuitType;
  name: string;
  bonuses: Partial<CharacterStats>;
  prototype: boolean;  // Must build prototype first
}

interface Robot {
  id: string;
  type: 'single_purpose' | 'android';
  purpose?: string;
  durability: number;  // Single purpose breaks faster
}
```

**Engineering requires:**
- Character with Engineering skill
- Build prototype first (+Cheap +More Time)
- Then can manufacture (+Expensive +Faster)

---

## Patrol System

**What Patrol Does:**
- Farms Fame passively
- Increases City Familiarity faster
- Can discover Investigation leads (W points)
- Can find "Off the Grid" units
- High Fame mercs WANT to patrol with famous units

**Patrol Assignment:**
- Select Sector
- Select City within sector
- Unit roams and generates events

---

## Training System

**What Training Does:**
- Temporarily boost Physical stats (rank 1-7)
- Required to MAINTAIN martial arts rank (erodes without training)
- Some units volunteer, others must be assigned

**Restrictions:**
- Robots CANNOT train
- Need Training facility in base?

---

## Off the Grid System

**What it does:**
- Character goes into hiding
- Cannot be found by normal means
- Only discoverable by:
  - Patrol (searching)
  - Investigation

**Detection colors:**
- Red = Hear rumors unit is in sector
- Blue = Rumor that unit is in city
- Yellow = Engage menu appears

**Penalty:** Person searching suffers -10 to check

---

## QUESTIONS FOR YOU:

1. **City Familiarity decay** - Does it go down over time if you don't visit?

2. **Investigation email system** - How do investigations get generated? Random? Story-driven? Both?

3. **Origin 5-9** - What happens when Spiritual/Robotic/Symbiotic/Alien hits 0 HP?

4. **Fame thresholds** - What can you DO with Fame besides recruit? Unlock things?

5. **Day Job** - Does this generate money? Is it automatic?

6. **Base facilities** - Do you need a Training Room to train? Lab to research?

---

## IMPLEMENTATION ORDER:

### Phase 1: Character Foundation
- [ ] Add `birthCity` to character interface
- [ ] Add `cityFamiliarities` array
- [ ] Add `origin` field (1-9)
- [ ] Add `fame` and `wealth` fields
- [ ] Update character creation to pick birth city

### Phase 2: Status System
- [ ] Expand status enum to all 14 statuses
- [ ] Add status icons to UI
- [ ] Add status change handlers
- [ ] Add status effects (can't move when Hospital, etc.)

### Phase 3: Patrol System
- [ ] Create patrol assignment UI
- [ ] Fame generation over time
- [ ] City Familiarity increase
- [ ] Random patrol events

### Phase 4: Investigation System
- [ ] Investigation data structure
- [ ] Email/notification when investigation available
- [ ] Investigation UI (4 W's progress)
- [ ] Investigation resolution -> possible combat

### Phase 5: Engineering/Research
- [ ] Tech suit crafting
- [ ] Prototype -> Manufacturing flow
- [ ] Research projects
