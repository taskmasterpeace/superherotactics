# Character Sheet System

## Overview

The Character Sheet System is the master definition for all characters in SuperHero Tactics. It integrates:
- Primary stats (7)
- Derived stats (health, initiative, etc.)
- Character types and origins
- Threat levels
- Powers, skills, talents
- Education and career
- Health status and injuries
- **Birthday & Aging system** (birthday triggers age increment)
- **Morale system** (affects combat, desertion risk)
- **Employment & Payment** (contracts, weekly pay)
- **Fatigue system** (stat penalties when tired)
- **Secret stash** (2 hidden inventory slots)
- Relationships and reputation
- Handedness (left/right)

---

## Character Types

| Type | Description | Example |
|------|-------------|---------|
| `normal` | Regular human (Alpha threat max) | Batman, Punisher |
| `lsw` | Lethal Super Weapon (powered) | Captain America, Spider-Man |
| `mutant` | Born with powers | X-Men |
| `synthetic` | Android/Robot/Cyborg | Vision, Ultron |
| `alien` | Non-human extraterrestrial | Superman, Thanos |
| `cosmic` | Cosmic entity (NPCs only) | Galactus, Eternity |

---

## Origin Types (9)

| Origin | Character Type | Weight | Description |
|--------|---------------|--------|-------------|
| `skilled_human` | normal | 30% | Peak human, no powers |
| `altered_human` | lsw | 25% | Genetically/chemically enhanced |
| `tech_enhancement` | lsw | 15% | Technology-based powers |
| `spiritual` | lsw | 10% | Mystical/spiritual powers |
| `aliens` | alien | 8% | Non-human alien |
| `symbiotic` | lsw | 5% | Bonded with alien symbiote |
| `mutated_human` | mutant | 4% | Random mutation at birth |
| `synthetics` | synthetic | 2% | Android/Robot/AI |
| `scientific_weapon` | lsw | 1% | Wielder of advanced tech weapon |

---

## Threat Levels

| Level | Stat Bonus | Max Powers | Point Budget | Weekly Pay |
|-------|------------|------------|--------------|------------|
| Alpha | +0 | 0 | 200 | $1,500 |
| Level 1 | +5 | 1 | 250 | $2,500 |
| Level 2 | +10 | 3 | 350 | $5,000 |
| Level 3 | +15 | 2 | 450 | $10,000 |
| Level 4 | +25 | 4 | 600 | $25,000 |
| Level 5 | +40 | 5 | 800 | $75,000 |
| Cosmic | +100 | 10 | 2000 | N/A |

---

## Primary Stats (7)

| Stat | Full Name | Description |
|------|-----------|-------------|
| MEL | Melee | Hand-to-hand combat |
| AGL | Agility | Speed, dexterity, ranged accuracy |
| STR | Strength | Raw power, damage, lifting |
| STA | Stamina | Endurance, health base |
| INT | Intelligence | Reasoning, tech, learning |
| INS | Instinct | Intuition, awareness, perception |
| CON | Concentration | Willpower, mental resistance |

---

## Birthday System

Every character has a birthday with month, day, and zodiac sign.

```typescript
interface Birthday {
  month: number;      // 1-12
  day: number;        // 1-31
  zodiacSign: string; // Aries, Taurus, etc.
}
```

**Birthday Events**:
- Characters get +5 morale boost on their birthday
- **Age increments when birthday passes** (call `checkBirthdayAndAge()` during calendar updates)

**Zodiac Signs**: Capricorn, Aquarius, Pisces, Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius

---

## Morale System

Morale affects combat performance and can lead to disobedience or desertion.

### Morale Levels

| Level | Range | Accuracy | Damage | Disobey % | Desert % |
|-------|-------|----------|--------|-----------|----------|
| Ecstatic | 90-100 | +15% | +10% | 0% | 0% |
| High | 70-89 | +10% | +5% | 0% | 0% |
| Good | 50-69 | 0% | 0% | 0% | 0% |
| Low | 30-49 | -10% | -5% | 5% | 0% |
| Very Low | 10-29 | -20% | -10% | 15% | 2%/day |
| Broken | 0-9 | -30% | -15% | 40% | 10%/day |

### Morale Events

**Positive Events**:
- Mission success: +10
- Personal kill: +5
- Level up: +15
- Bonus pay: +10
- Ally saved: +5
- Enemy leader killed: +8
- Birthday: +5
- Romance positive: +8

**Negative Events**:
- Mission failure: -15
- Ally death: -20
- Ally injured: -8
- Pay missed: -25
- Retreat ordered: -10
- Leader killed: -15
- Romance ended: -12
- Friendly fire: -10

---

## Employment System

Characters have contracts and expect payment.

### Contract Types

| Type | Discount | Termination |
|------|----------|-------------|
| Daily | 0% | Any time |
| Weekly | 5% | After week |
| Monthly | 15% | After month |
| Permanent | 25% | Buyout fee |

### Employment Interface

```typescript
interface Employment {
  isEmployed: boolean;
  employer?: string;
  contractType: ContractType;
  weeklyPay: number;
  contractStart: number;
  contractEnd?: number;
  payOwed: number;
  lastPayment: number;
  bonusEarned: number;
  minimumPay: number;
  preferredContractType: ContractType;
}
```

**Warning**: Missing payments causes -25 morale per occurrence!

---

## Fatigue System

Characters get tired from extended activity.

| Fatigue | Level | Stat Penalty |
|---------|-------|--------------|
| 0-20 | Rested | 0 |
| 21-50 | Normal | 0 |
| 51-80 | Tired | -1CS |
| 81-100 | Exhausted | -2CS |

---

## Secret Stash

Characters have 2 hidden inventory slots not visible during normal inspection.

```typescript
interface SecretStash {
  slot1?: string;           // Item ID
  slot2?: string;           // Item ID
  isDiscovered: boolean;    // Has player found this?
  discoveryDifficulty: number; // 1-10
}
```

**Discovery**: Player must actively search character to find stash. Difficulty 3-7 typically.

---

## Handedness

Simple left/right for combat mechanics.

```typescript
type Handedness = 'left' | 'right';
```

**Distribution**: 90% right, 10% left

---

## Aging System

### Age Categories

| Category | Age Range | Stat Modifiers |
|----------|-----------|----------------|
| Child | 0-12 | STR -10, STA -5, INT -3 |
| Teenager | 13-17 | STR -3, INT -1 |
| Young Adult | 18-25 | STR +2, AGL +2 (peak) |
| Adult | 26-40 | None (baseline) |
| Middle Aged | 41-55 | STR -2, AGL -2, INT +2, INS +2 |
| Senior | 56-70 | STR -5, AGL -5, STA -3, INT +3, INS +3 |
| Elderly | 71+ | STR -10, AGL -10, STA -8, INT +2, INS +5 |

### Life Expectancy by Type

| Character Type | Life Expectancy |
|----------------|-----------------|
| Human | 80 years |
| Alien | 150 years |
| Synthetic | 500 years |
| Cosmic | 10,000 years |

---

## Character Status

Characters can be in various states:

- `ready` - Available for missions
- `busy` - Occupied with task
- `injured` - Recovering from injury
- `traveling` - Moving between locations
- `hospitalized` - In medical care
- `on_mission` - Currently deployed
- `training` - Learning skills
- `resting` - Recovering fatigue

---

## Personality (INTERNAL - NOT SHOWN TO PLAYER)

Personality affects AI behavior decisions but is NOT displayed on the character sheet:

```typescript
personality: {
  type: string;       // MBTI type
  volatility: number; // 1-10 (emotional stability)
  motivation: number; // 1-10 (moral compass)
  harmPotential: number; // 1-10 (aggression)
}
```

---

## Complete Character Sheet Interface

```typescript
interface CharacterSheet {
  // Identity
  id: string;
  realName: string;
  codeName?: string;
  hasSecretIdentity: boolean;

  // Classification
  characterType: CharacterType;
  originType: OriginType;
  threatLevel: ThreatLevel;

  // Demographics
  nationality: string;
  cultureCode: number;
  gender: 'male' | 'female' | 'other';
  currentLocation: string;

  // Aging (includes birthday)
  aging: AgingInfo;

  // Stats
  baseStats: PrimaryStats;
  currentStats: PrimaryStats;
  derivedStats: DerivedStats;

  // Powers & Skills
  powers: CharacterPower[];
  skills: CharacterSkill[];
  talents: CharacterTalent[];

  // Education & Career
  educationLevel: EducationLevel;
  educationSpecialization?: string;
  currentCareer?: string;
  careerRank: number;
  careerHistory: string[];

  // Equipment
  equippedWeapon?: string;
  equippedArmor?: string;
  inventory: string[];
  secretStash: SecretStash;  // Hidden inventory (2 slots)
  wealth: number;

  // Health
  healthStatus: CharacterHealthStatus;

  // Morale & Fatigue
  morale: MoraleState;
  fatigue: FatigueState;

  // Employment
  employment: Employment;

  // Social
  contacts: Contact[];
  factionStandings: FactionStanding[];
  reputation: Reputation;

  // Personality (INTERNAL - not shown)
  personality: { ... };

  // Handedness
  handedness: Handedness;

  // Background
  originStory?: string;
  personalHistory?: string;
  motivations: string[];
  weaknesses: string[];

  // Meta
  createdAt: number;
  lastUpdated: number;
  isPlayerCharacter: boolean;
  isRecruitable: boolean;
  status: CharacterStatus;
}
```

---

## Code Reference

Main file: `MVP/src/data/characterSheet.ts`

Key functions:
- `generateRandomCharacter(id, options)` - Generate a single random character
- `generateRandomCharacters(count, options)` - Generate multiple characters
- `generateBalancedTeam(size, avgThreatLevel)` - Generate a balanced team
- `createMoraleState(baseline)` - Create morale tracking
- `createFatigueState()` - Create fatigue tracking
- `generateRandomBirthday()` - Generate birthday with zodiac
- `isBirthday(birthday, month, day)` - Check if today is birthday
- `checkBirthdayAndAge(character, month, day)` - **Increment age when birthday passes**
- `calculateWeeklyPay(threatLevel)` - Get base salary
- `getMoraleLevel(value)` - Get morale level from value
- `generateHandedness()` - Generate left/right (90/10 split)

Related files:
- `characterStatusSystem.ts` - Health, injuries, prosthetics
- `educationSystem.ts` - Education levels, training
- `nameDatabase.ts` - Culturally appropriate names
