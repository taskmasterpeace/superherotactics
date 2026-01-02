# Investigation System - SuperHero Tactics

## Overview

The Investigation System provides branching gameplay where players discover leads, assign investigators, choose approaches, and manage clues to complete investigations with meaningful consequences.

## Core Flow

```
DISCOVER LEAD → ASSIGN INVESTIGATOR → CHOOSE APPROACH → SKILL CHECK →
→ GATHER CLUES → ADVANCE PHASES → RESOLUTION → REWARDS/CONSEQUENCES
```

## Investigation Types

1. **Crime** - Street crime, gangs, robberies
2. **Conspiracy** - Cover-ups, corruption, secret experiments
3. **Terrorism** - Bomb threats, extremist cells, attacks
4. **Underworld** - Gang wars, crime bosses, protection rackets
5. **Corporate** - Industrial espionage, cover-ups
6. **Espionage** - Foreign agents, intelligence operations

## Investigation Phases

Each investigation progresses through four phases:

1. **Gathering** - Initial information gathering
2. **Following Leads** - Pursuing specific leads
3. **Confrontation** - Direct engagement with suspects
4. **Resolution** - Final phase before conclusion

Progress through phases by reaching 100% progress in current phase.

## Approach Types

Players choose how to investigate, each with different risks/rewards:

### 1. Stealth Approach
- **Skills:** AGL, INT, Stealth, Surveillance
- **Progress Gain:** +15% on success
- **Clue Quality:** Strong
- **Risk:** High (big suspicion increase if caught)
- **Best For:** Covert surveillance, avoiding detection

### 2. Direct Approach
- **Skills:** CON, INT, Investigation, Authority
- **Progress Gain:** +20% on success
- **Clue Quality:** Moderate
- **Risk:** Medium (moderate suspicion, high exposure)
- **Best For:** Legal authority, public investigation

### 3. Social Approach
- **Skills:** CON, INT, Charm, Contacts
- **Progress Gain:** +12% on success
- **Clue Quality:** Moderate
- **Risk:** Low (low suspicion, moderate exposure)
- **Best For:** Networking, informants, persuasion

### 4. Technical Approach
- **Skills:** INT, INS, Hacking, Forensics
- **Progress Gain:** +18% on success
- **Clue Quality:** Strong
- **Risk:** Medium (moderate suspicion, low exposure)
- **Best For:** Digital investigation, data analysis

### 5. Intimidation Approach
- **Skills:** STR, MEL, Intimidate, Combat
- **Progress Gain:** +25% on success (fast!)
- **Clue Quality:** Weak (scared people lie)
- **Risk:** Extreme (very high suspicion AND exposure)
- **Best For:** Aggressive interrogation, threats

## Skill Check System

### Formula
```
Success = (d100 + Character Skill Value) >= Difficulty
```

### Difficulty Scaling by Phase
- **Gathering:** Difficulty × 8
- **Following Leads:** Difficulty × 10
- **Confrontation:** Difficulty × 12
- **Resolution:** Difficulty × 15

### Example
```
Drug Distribution Ring (Difficulty 4)
Stealth approach in Gathering phase:

Difficulty Target = 4 × 8 = 32
Character AGL = 55
Roll = d100 (47)
Total = 47 + 55 = 102
Result = SUCCESS (102 >= 32)
```

## Suspicion & Exposure

### Suspicion Level (0-100%)
- Represents how alerted the suspects are
- Increases on failed checks (varies by approach)
- **>=80% = Investigation Failed** (suspects flee)
- Different approaches have different suspicion penalties

### Public Exposure (0-100%)
- How public the investigation is
- Affects news generation
- High exposure = public fame
- Low exposure = discrete operations
- **>=50% = News article generated** when complete

## Clue System

### Clue Quality
- **Weak** - Vague information, unreliable
- **Moderate** - Useful lead, needs verification
- **Strong** - Concrete evidence, high value

### Clue Collection
- Each successful approach generates a clue
- Clue quality depends on approach used
- Clues tagged by phase (gathering, following_leads, etc.)
- Displayed in investigation board UI

## Investigation Templates

### Example: Drug Distribution Ring
```typescript
{
  title: 'Drug Distribution Ring',
  type: 'crime',
  difficulty: 4,
  dangerLevel: 5,
  phases: {
    gathering: 'Identify street-level dealers',
    following_leads: 'Surveil drop points',
    confrontation: 'Raid warehouse or infiltrate',
    resolution: 'Arrest leaders or flip informants'
  },
  successReward: {
    cash: 15000,
    fame: 50,
    intel: ['drug_network_contacts', 'corrupt_officials'],
    missionUnlocked: 'skirmish_gang'
  }
}
```

### 12 Investigation Templates Included

1. Drug Distribution Ring (Crime, Diff 4)
2. Serial Robbery Crew (Crime, Diff 5)
3. Human Trafficking (Crime, Diff 7)
4. Corporate Cover-up (Conspiracy, Diff 6)
5. Political Corruption (Conspiracy, Diff 8)
6. Missing Persons Pattern (Conspiracy, Diff 7)
7. Bomb Threat (Terrorism, Diff 8)
8. Extremist Recruitment (Terrorism, Diff 5)
9. Gang War Brewing (Underworld, Diff 4)
10. New Crime Boss (Underworld, Diff 6)
11. Industrial Espionage (Espionage, Diff 7)
12. Foreign Intelligence Op (Espionage, Diff 9)

## Rewards System

### Success Rewards
- **Cash** - $8,000 to $60,000 depending on difficulty
- **Fame** - 40 to 250 fame points
- **Intel** - Unlocked knowledge (gang contacts, techniques, etc.)
- **Missions** - May unlock new mission types

### Example Rewards
- Drug Ring: $15k, +50 fame, gang contacts
- Bomb Threat: $50k, +250 fame, terrorist network intel
- Foreign Intel: $60k, +150 fame, spy tradecraft

## Failure Consequences

### Investigation Fails if:
- Suspicion reaches 80% (suspects alerted, flee)
- Time expires (48-120 hours typical)
- Player abandons investigation

### Consequences
- No rewards
- Suspects become harder to find
- Area becomes more dangerous
- Lost opportunity for mission unlocks

## Integration with Other Systems

### Patrol System
- Patrols can discover investigation leads
- 5% chance per hour of patrol
- City familiarity affects discovery rate

### News System
- High exposure investigations (>=50%) generate news
- Success = positive news, fame increase
- Failure = negative news, public opinion hit

### Mission System
- Completed investigations unlock missions
- Intel gained improves mission success rates
- Character skills improved through investigation

### Time System
- Investigations have time limits (48-120 hours)
- Background expiration checks
- Notifications when nearing expiration

## Character Assignment

### Requirements
- Character must be 'ready' status
- Can assign multiple characters (currently 1 at a time)
- Assigned characters set to 'investigating' status

### Character Skills Used
- **INT** - Analysis, deduction, planning
- **INS** - Perception, intuition, spotting clues
- **CON** - Persuasion, interrogation, contacts
- **AGL** - Stealth, surveillance, evasion
- **STR/MEL** - Intimidation, force

## Store Functions

### Discovery
```typescript
discoverInvestigation(template, city, country, sector)
```
Creates new lead from template, adds to investigationLeads

### Start Investigation
```typescript
startInvestigation(investigationId, characterId)
```
Assigns character, moves from leads to active

### Advance Progress
```typescript
advanceInvestigationProgress(investigationId, characterId, approach)
```
Performs skill check, updates progress, generates clues

### Complete
```typescript
completeInvestigation(investigationId)
```
Grants rewards, frees character, generates news

### Fail
```typescript
failInvestigation(investigationId)
```
No rewards, notifies player, frees character

## UI Components

### Investigation Center (`InvestigationCenter.tsx`)

**Left Panel - Investigation List**
- Tabs: Leads vs Active
- Card display with type, danger, location
- Progress bars for active investigations
- Suspicion/Exposure meters

**Right Panel - Investigation Details**
- Full investigation info
- Phase progression
- Clue collection display
- Character assignment (for leads)
- Approach selection (for active)
- Decision log

### Investigation Board Aesthetic
- Detective board style
- String connections between clues (future)
- Polaroid photos (future)
- Post-it notes (future)
- Evidence markers

## Decision Log

Each investigation action is logged:
```typescript
{
  timestamp: number,
  phase: InvestigationPhase,
  chosenApproach: ApproachType,
  characterId: string,
  skillRoll: {
    skill: string,
    characterValue: number,
    difficulty: number,
    roll: number,
    success: boolean
  },
  outcome: string,
  consequenceType: 'progress' | 'setback' | 'neutral' | 'critical'
}
```

## Example Investigation Flow

```
1. DISCOVERY
   Patrol in Washington DC discovers:
   "Drug Distribution Ring" lead
   → Added to investigation leads

2. ASSIGN
   Player assigns "Alpha Squad Leader" (INT 50)
   → Investigation becomes active
   → Character status = 'investigating'

3. GATHERING PHASE
   Player chooses "Stealth Approach"
   Skill Check: d100(65) + AGL(55) = 120 vs 32
   → SUCCESS! +15% progress
   → Strong clue gathered: "Warehouse location"
   → Suspicion +0, Exposure +5

4. FOLLOWING LEADS
   Player chooses "Technical Approach"
   Skill Check: d100(42) + INT(50) = 92 vs 40
   → SUCCESS! +18% progress
   → Strong clue: "Supplier delivery schedule"
   → Progress reaches 100%, advance to Confrontation

5. CONFRONTATION PHASE
   Player chooses "Direct Approach"
   Skill Check: d100(38) + CON(60) = 98 vs 48
   → SUCCESS! +20% progress
   → Moderate clue: "Gang protection arrangement"
   → Advance to Resolution

6. RESOLUTION PHASE
   Player chooses "Social Approach"
   Skill Check: d100(55) + CON(60) = 115 vs 60
   → SUCCESS! +12% progress
   → Progress reaches 100% in Resolution
   → INVESTIGATION COMPLETE!

7. REWARDS
   Earned $15,000
   +50 fame
   Intel unlocked: drug_network_contacts, corrupt_officials
   Mission unlocked: "Gang Takedown" skirmish
   News article generated (Exposure was 52%)
```

## Future Enhancements

### Multi-Character Teams
- Assign 2-4 investigators
- Combine skills for better chances
- Specialist roles (tech expert, muscle, face)

### Branching Choices
- Different resolution options
- Moral choices (arrest vs flip informants)
- Consequences affect future investigations

### Physical Evidence Board
- Visual connection of clues
- Drag-and-drop investigation board
- Photo evidence, documents
- Timeline reconstruction

### Investigation Networks
- One investigation leads to another
- Building long-term cases
- Recurring suspects and informants

### Investigation Specialization
- Characters gain investigation XP
- Unlock special investigation abilities
- Become renowned detectives
- Informant networks

## File Locations

### Core System
- `C:\git\sht\MVP\src\data\investigationSystem.ts` - All types, templates, logic
- `C:\git\sht\MVP\src\stores\enhancedGameStore.ts` - State management (lines 1716-1943)

### UI Component
- `C:\git\sht\MVP\src\components\InvestigationCenter.tsx` - Full investigation board UI

### Integration Files
- `C:\git\sht\MVP\src\data\patrolSystem.ts` - Patrol discovery integration
- `C:\git\sht\MVP\src\data\newsTemplates.ts` - News generation integration

## Key Design Principles

1. **Meaningful Choices** - Each approach has real trade-offs
2. **Skill-Based** - Character stats matter
3. **Risk/Reward** - Higher risk = higher rewards
4. **Branching Paths** - Multiple ways to solve
5. **Consequences** - Failures have real impact
6. **Progression** - Phases provide structure
7. **Emergent Stories** - Decision logs create narratives

---

**Status:** Fully implemented and ready for testing
**Next Steps:** Wire up to patrol system for discovery, add to main navigation
