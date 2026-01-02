# City Activities Roadmap
> **What Can Characters DO in Cities?**
> The Heart of SuperHero Tactics

## Executive Summary

After multi-agent research, we discovered the codebase has **extensive city activity systems already built** - most just need UI wiring!

### System Status Overview

| System | Backend | UI | Status |
|--------|---------|-----|--------|
| City Actions (9 types) | COMPLETE | PARTIAL | 80% done |
| Education/Degrees | COMPLETE | EXISTS | 90% done |
| Patrol System | COMPLETE | NEEDS WIRING | 80% done |
| Territory Control | COMPLETE | NOT WIRED | 70% done |
| Equipment Shop | COMPLETE | COMPLETE | 100% done |
| Hospital/Healing | COMPLETE | EXISTS | 90% done |
| Investigation | COMPLETE | EXISTS | 85% done |
| Combat Training | PARTIAL | NOT DONE | 40% done |
| Martial Arts Sparring | NOT DONE | NOT DONE | 0% |
| Danger Room | NOT DONE | NOT DONE | 0% |

---

## 1. CITY ACTIONS (Already Designed!)

**File**: `cityActions.ts` (~500 lines)

### 9 Action Categories

| Category | Example Actions | City Types |
|----------|-----------------|------------|
| **Governance** | Lobby Government, PR Campaign | Political |
| **Training** | Intensive Training, Skill Courses | Educational |
| **Recruitment** | Hire Soldiers, Find Specialists | Military, Industrial |
| **Equipment** | Buy Gear, Commission Custom | Industrial, Military |
| **Logistics** | Smuggling, Fast Travel | Seaport, Industrial |
| **Stealth** | Create Cover Identity, Safe House | Any (Criminal contacts) |
| **Healing** | Hospital Care, Rehab | Any (varies by GDP) |
| **Intel** | Access Records, Surveillance | Political, Military |
| **Criminal** | Black Market, Fencing | Any (high corruption) |

### Action Properties
- **Duration**: Hours to complete
- **Cost**: Modified by country GDP, corruption
- **Skill Checks**: Required stats/skills
- **Outcomes**: Success, failure, critical success
- **Risks**: Chance of negative consequences

### What's Needed
- [ ] Wire actions to enhancedGameStore
- [ ] Create ActionExecutionUI component
- [ ] Add time passage for action duration
- [ ] Handle outcome rolls and consequences

---

## 2. PATROL SYSTEM (80% Complete!)

**Files**: `patrolSystem.ts`, `patrolEncounters.ts`, `territorySystem.ts`

### What Already Works (Backend)
- Fame gain per hour (5 base * threat level multiplier)
- City familiarity gain (up to 75%)
- 5% chance/hour to discover investigation
- 10% chance/hour for random encounter
- 12 enemy templates (drunk, thug, gang, robber)
- 5 encounter scenarios (bar fight, street crime, etc.)
- Territory control mechanics (JA2-style!)
- Militia recruitment and training

### Encounter Types
```
street_crime → gang_activity → robbery
bar_fight → vigilante → super_villain
police_standoff → domestic → drug_deal
```

### What's Needed
- [ ] "Start Patrol" button on WorldMap
- [ ] Patrol duration selector (2/4/8/12 hours)
- [ ] Encounter popup with engage/avoid choice
- [ ] Bridge to CombatScene for tactical resolution
- [ ] Quick-resolve option for minor encounters

---

## 3. EDUCATION SYSTEM (90% Complete!)

**File**: `educationSystem.ts` (~1000 lines)

### Three Educational Tracks

| Track | Degrees | Time Per Level |
|-------|---------|----------------|
| **Academic** | Associate → Bachelor → Master → Doctorate → Post-Doc | 2-6 weeks |
| **Vocational** | Certificate → Diploma → Trade License → Master Craftsman | 1-4 weeks |
| **Military** | Basic → Advanced → Specialist → Elite → Command | 2-6 weeks |

### 28+ Fields of Study
- Combat Sciences (Tactics, Weapons, Martial Arts)
- Technical/Engineering
- Life Sciences
- Social/Intel
- Super-Science (restricted)
- Occult/Mystical (restricted - Spiritual origin)
- Underground/Criminal (restricted - Criminal contacts)

### What Already Works
- TrainingCenter.tsx UI
- Enrollment tracking in game store
- Progress calculation
- Stat bonuses on completion
- Skill unlocks

### What's Needed
- [ ] Wire completion to character sheets
- [ ] Add exam failure mechanics
- [ ] Practical training sessions

---

## 4. COMBAT TRAINING (NEW SYSTEM NEEDED)

### 4.1 Fast Combat Training
Use `batchTester.ts` (runs 1000+ battles/sec) for training simulations!

```typescript
interface TrainingSession {
  trainees: GameCharacter[]
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme'
  type: 'weapons' | 'tactics' | 'survival'
  battles: number  // 10-100 simulated battles
}

// Returns XP based on performance
function runTrainingSession(config): TrainingResult {
  // Run batch battles with batchTester
  // Calculate XP from win rate, survival, damage ratio
  // Small injury chance on hard/extreme
}
```

**XP Formula**:
```
baseXP = 10 * difficultyMultiplier (1/2/3/5)
performanceXP = (winRate * 0.3) + (damageRatio * 0.3) + (survivalRate * 0.4)
totalXP = baseXP * performanceXP
```

### 4.2 Danger Room (Team Exercises)

Predefined scenarios using grid-based combat:

| Scenario | Description | Team Size | Rewards |
|----------|-------------|-----------|---------|
| Basic Assault | Clear building | 4 | Bond XP, Combat XP |
| Hostage Rescue | Protect VIP | 4-6 | Tactics skill |
| Defense Drill | Hold position | 4-6 | Positioning skill |
| Night Ops | Low visibility | 2-4 | Stealth XP |

**Key Features**:
- No permanent death (training mode)
- Counts toward combat bonds
- Controlled difficulty scaling
- Can use as tutorial

### 4.3 Martial Arts Sparring

1v1 training matches for belt progression:

```typescript
interface SparringSession {
  trainee: GameCharacter
  partner: GameCharacter | 'instructor'
  style: MartialArtsStyleId
  rounds: 3 | 5 | 7
  rules: 'light_contact' | 'full_contact' | 'grappling_only'
}
```

**Belt Progression**:
- Sparring with higher-belt = more progress
- Victory bonus + technique variety bonus
- Higher belts require more total progress

**Skill Decay**:
- 14 days grace period after practice
- 0.5% belt progress lost per day after
- "Rusty" status if neglected (lose access to high-belt techniques)

---

## 5. WHAT CHARACTERS CAN DO (Complete List)

### At Base
- [ ] **Train Combat** - Fast simulations for XP
- [ ] **Danger Room** - Team tactical exercises
- [ ] **Spar** - 1v1 martial arts training
- [x] **Manage Equipment** - Inventory, loadouts
- [x] **Heal** - Rest and recovery
- [ ] **Study** - Independent skill learning

### In Educational Cities
- [x] **Enroll in Programs** - Degrees, certificates
- [x] **Attend Classes** - Progress tracking
- [ ] **Take Exams** - Pass/fail with consequences
- [ ] **Find Tutors** - Specialized training

### In Military Cities
- [x] **Hire Soldiers** - Recruitment
- [ ] **Military Training** - Combat drills
- [ ] **Access Range** - Weapon proficiency
- [ ] **Intel Briefings** - Mission info

### In Political Cities
- [ ] **Lobby Government** - Policy influence
- [ ] **PR Campaign** - Fame boost
- [ ] **Access Records** - Investigation intel
- [ ] **Make Contacts** - Political connections

### In Any City
- [x] **Shop** - Equipment purchase
- [x] **Hospital** - Injury treatment
- [x] **Patrol** - Fame + encounters
- [x] **Investigate** - Active cases
- [ ] **Rest** - Full recovery
- [ ] **Black Market** - Illegal goods (high corruption)

### On World Map
- [x] **Travel** - Move between sectors
- [x] **Deploy** - Enter mission sector
- [x] **Enter Combat** - Tactical battles
- [ ] **Manage Territory** - Militia, control

---

## 6. TRAINING COMBAT INTEGRATION

### Using Existing Infrastructure

**batchTester.ts** can power all training modes:

```
Character Selection
       ↓
Training Mode Selection
(Fast Combat / Danger Room / Sparring)
       ↓
Configuration
(Difficulty, Duration, Rules)
       ↓
batchTester.runBatch() / battleRunner.runBattle()
       ↓
Performance Analysis
       ↓
XP/Progress Awards
       ↓
Optional Injury Roll (hard/extreme only)
```

### Files to Create/Modify

| File | Action |
|------|--------|
| `trainingSystem.ts` | NEW - Training session logic |
| `batchTester.ts` | ADD - Training-specific functions |
| `MartialArtsSystem.ts` | ADD - Belt progression logic |
| `enhancedGameStore.ts` | ADD - Training state tracking |
| `TrainingCenter.tsx` | MODIFY - Add combat training UI |
| `DangerRoom.tsx` | NEW - Scenario selection UI |

---

## 7. IMPLEMENTATION PRIORITIES

### Phase 1: Quick Wins (2-4 hours each)
1. **Wire Patrol UI** - Add button to WorldMap, encounter popup
2. **Wire Combat Training** - Use batchTester for XP sessions
3. **Wire Territory View** - Show control percentages on map

### Phase 2: Core Training (4-8 hours each)
1. **Sparring System** - 1v1 martial arts training
2. **Belt Progression** - Track progress, handle decay
3. **Danger Room Scenarios** - 5-10 predefined exercises

### Phase 3: Full City Actions (8-16 hours)
1. **Action Execution UI** - Universal action interface
2. **Time Passage** - Actions take game hours
3. **Outcome System** - Success/failure/consequences

---

## 8. THE VISION

When a player goes to a city, they should see:

```
┌─────────────────────────────────────────────┐
│  TOKYO (Educational, Industrial, Political)  │
├─────────────────────────────────────────────┤
│                                             │
│  TRAINING                                   │
│  ├─ [Tokyo University] Enroll in program    │
│  ├─ [Kodokan Dojo] Martial arts training    │
│  └─ [Base Gym] Combat simulation            │
│                                             │
│  PATROL                                     │
│  ├─ [Street Patrol] 4hr - Medium danger     │
│  └─ [Night Patrol] 8hr - High danger        │
│                                             │
│  SERVICES                                   │
│  ├─ [Hospital] Treat injuries               │
│  ├─ [Equipment Shop] Buy/sell gear          │
│  └─ [Black Market] Illegal goods            │
│                                             │
│  INTEL                                      │
│  ├─ [Government Records] Access files       │
│  └─ [Contacts] Meet informants              │
│                                             │
│  GOVERNANCE                                 │
│  ├─ [Lobby] Influence policy                │
│  └─ [PR Campaign] Boost fame                │
│                                             │
└─────────────────────────────────────────────┘
```

---

*The game's heart is what characters CAN DO.*
*Most of it is already built - we just need to wire it together.*
