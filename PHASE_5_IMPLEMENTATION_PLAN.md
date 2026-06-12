# SuperHero Tactics - Phase 5 Implementation Plan

## Strategic Planning Analysis

**Objective**: Wire existing data systems to gameplay mechanics, add squad management UI, integrate base bonuses, and implement territory control.

**Analysis Date**: 2025-12-02
**Analysis By**: Strategic Planning Agent

---

## Executive Summary

Phase 5 focuses on **WIRING** existing well-designed systems together. The codebase already has:
- Comprehensive `factionSystem.ts` (621 lines) with standings, bounties, and relationships
- Full `squadSystem.ts` (502 lines) with MBTI personalities and morale
- Complete `baseSystem.ts` (1174 lines) with facility bonuses
- Working `territorySystem.ts` (697 lines) with militia and defense missions
- Active `combatResultsHandler.ts` (857 lines) with EventBus integration
- Functional `missionStore.ts` (322 lines) for mission management

**Critical Gap**: These systems exist in isolation. Combat completion does not affect faction standings, bases don't apply bonuses, and territory control doesn't impact gameplay.

---

## Item 1: Wire Faction Standings to Mission Rewards/Consequences

### Current State Analysis

**Files Analyzed**:
- `C:\git\sht\MVP\src\stores\combatResultsHandler.ts` - Handles combat end, emits events
- `C:\git\sht\MVP\src\stores\missionStore.ts` - Mission lifecycle management
- `C:\git\sht\MVP\src\data\factionSystem.ts` - Faction standings system

**What Exists**:
1. `factionSystem.ts` has complete `modifyStanding()` function (line 442-470)
2. `getRelatedFactionEffects()` for faction relationship propagation (line 385-413)
3. `checkBountyStatus()` for automatic bounty creation (line 475-507)
4. `combatResultsHandler.ts` emits `mission:completed` events (line 549-560)
5. Mission completion events include victory status and location info

**What's Missing**:
1. NO listener for `mission:completed` that updates faction standings
2. NO mission type -> faction mapping (e.g., fighting criminals = +police, -underworld)
3. NO wiring between mission outcome and faction standing modification
4. NO bounty consequences appearing in gameplay

### Implementation Plan

#### Step 1: Create Mission-to-Faction Mapping
**File**: `C:\git\sht\MVP\src\data\missionFactionEffects.ts` (NEW)

```typescript
// Define how each mission type affects faction standings
export const MISSION_FACTION_EFFECTS: Record<string, FactionEffect[]> = {
  'combat': [
    { faction: 'police', successMod: +10, failureMod: -5 },
    { faction: 'media', successMod: +5, failureMod: -10 },
  ],
  'rescue_hostage': [
    { faction: 'police', successMod: +15, failureMod: -10 },
    { faction: 'media', successMod: +20, failureMod: -15 },
    { faction: 'government', successMod: +10, failureMod: -5 },
  ],
  'infiltrate': [
    { faction: 'underworld', successMod: -15, failureMod: +5 },
    { faction: 'corporations', successMod: -10, failureMod: +0 },
  ],
  // ... more mission types
}
```

#### Step 2: Add Faction Standing Handler to EventBus
**File**: `C:\git\sht\MVP\src\data\factionEventHandler.ts` (NEW)

```typescript
export function initFactionEventHandler(): void {
  // Subscribe to mission:completed events
  EventBus.on('mission:completed', (event) => {
    const { missionType, success, location } = event.data
    const store = useGameStore.getState()

    // Get faction effects for this mission type
    const effects = MISSION_FACTION_EFFECTS[missionType]
    if (!effects) return

    // Apply effects to country-specific factions
    effects.forEach(effect => {
      const factionStanding = store.factionStandings.find(
        s => s.factionType === effect.faction && s.countryCode === location.countryCode
      )
      if (factionStanding) {
        const change = success ? effect.successMod : effect.failureMod
        const updated = modifyStanding(factionStanding, change,
          `Mission ${success ? 'completed' : 'failed'}: ${missionType}`,
          Date.now())
        store.updateFactionStanding(updated)

        // Apply relationship effects
        const relatedEffects = getRelatedFactionEffects(effect.faction, change)
        relatedEffects.forEach(re => {
          // Apply cascading effects to related factions
        })
      }
    })
  })
}
```

#### Step 3: Add Faction Standings to Game Store
**File**: `C:\git\sht\MVP\src\stores\enhancedGameStore.ts`

**Modifications Needed** (lines to add after line ~200):
```typescript
// In store state interface:
factionStandings: FactionStanding[];

// In store actions:
updateFactionStanding: (standing: FactionStanding) => void;
initializeFactions: (homeCountryCode: string) => void;
```

#### Step 4: Initialize Handler in App.tsx
**File**: `C:\git\sht\MVP\src\App.tsx`

Add initialization call alongside existing handlers.

### Priority: HIGH
### Dependencies: None (foundational for other features)
### Estimated Effort: 4-6 hours

---

## Item 2: Add Squad Management UI in World Map

### Current State Analysis

**Files Analyzed**:
- `C:\git\sht\MVP\src\components\WorldMap\WorldMapGrid.tsx` (1600+ lines)
- `C:\git\sht\MVP\src\data\squadSystem.ts` - Squad data structures
- `C:\git\sht\MVP\src\stores\enhancedGameStore.ts` - Already imports Squad types

**What Exists**:
1. `squadSystem.ts` has complete Squad interface with members, vehicles, morale
2. `createSquad()`, `addMemberToSquad()`, `removeMemberFromSquad()` functions
3. `calculateSquadMorale()` based on MBTI personality compatibility
4. `assignVehicleToSquad()` for vehicle assignment
5. WorldMapGrid has `MessagesPanel` component with character/vehicle tabs
6. Store has `TravelingUnit` type that can be 'squad'

**What's Missing**:
1. NO squad state in enhancedGameStore (only references to types)
2. NO UI for creating/naming squads
3. NO UI for assigning characters to squads
4. NO squad selection dropdown in world map
5. NO squad deployment flow (currently only individual characters)

### Implementation Plan

#### Step 1: Add Squad State to Store
**File**: `C:\git\sht\MVP\src\stores\enhancedGameStore.ts`

**Add to State Interface** (around line 270-300):
```typescript
// Squad management
squads: Squad[];
activeSquadId: string | null;
maxSquads: number;
```

**Add Actions**:
```typescript
// Squad management actions
createNewSquad: (name: string, memberIds: string[]) => Squad | null;
disbandSquad: (squadId: string) => void;
renameSquad: (squadId: string, newName: string) => void;
addCharacterToSquad: (squadId: string, characterId: string) => void;
removeCharacterFromSquad: (squadId: string, characterId: string) => void;
setActiveSquad: (squadId: string | null) => void;
deploySquad: (squadId: string, targetSector: string) => void;
```

#### Step 2: Create SquadManagementPanel Component
**File**: `C:\git\sht\MVP\src\components\WorldMap\SquadManagementPanel.tsx` (NEW)

```typescript
// UI Features:
// - List of existing squads with member count and morale
// - "Create Squad" button -> modal with name input + character multi-select
// - Click squad to view/edit members
// - Drag-and-drop character assignment (optional)
// - Squad morale indicator (calculated from personality compatibility)
// - Vehicle assignment dropdown
// - "Deploy" button (active when squad selected and destination chosen)
```

#### Step 3: Add Squad Tab to MessagesPanel
**File**: `C:\git\sht\MVP\src\components\WorldMap\WorldMapGrid.tsx`

**Modify TabType** (line 102):
```typescript
type TabType = 'character' | 'map' | 'vehicles' | 'squads';
```

**Add to RetroTabs** (around line 400-500 in MessagesPanel):
- Add 'squads' tab alongside existing tabs
- Render SquadManagementPanel when active

#### Step 4: Modify Travel Flow for Squads
**File**: `C:\git\sht\MVP\src\components\WorldMap\WorldMapGrid.tsx`

**Current Flow**:
- Select characters -> Select vehicle -> Select destination -> Travel

**New Flow**:
- Select squad (or create ad-hoc group) -> Squad auto-selects vehicle if assigned
- Deploy squad to destination
- Squad travels as unit

### Priority: MEDIUM-HIGH
### Dependencies: Item 1 (faction standings show on squad UI)
### Estimated Effort: 8-12 hours

---

## Item 3: Wire Base Bonuses to Game Systems

### Current State Analysis

**Files Analyzed**:
- `C:\git\sht\MVP\src\data\baseSystem.ts` - Complete facility bonus system
- `C:\git\sht\MVP\src\data\investigationSystem.ts` - Investigation with skill checks
- `C:\git\sht\MVP\src\components\HospitalScreen.tsx` - Hospital UI

**What Exists**:
1. `baseSystem.ts` has explicit bonus functions:
   - `getEducationBonus(base, field)` returns % bonus (line 785-801)
   - `getHealingBonus(base)` returns % bonus (line 806-819)
   - `getInvestigationBonus(base)` returns % bonus (line 824-837)
   - `getCraftingBonus(base)` returns % bonus (line 842-855)
2. `FACILITIES` defines bonuses per facility type and level:
   - `medical_bay`: healingBonus [25, 50, 100]
   - `intel_center`: investigationBonus [20, 40, 60]
   - `library`: educationBonus [15, 30, 45], investigationBonus [10, 20, 30]
   - `training_room`: educationBonus [20, 40, 60]
3. `investigationSystem.ts` has `advanceInvestigation()` that calculates progress
4. HospitalScreen exists but healing is time-based, not bonus-modified

**What's Missing**:
1. NO base state in enhancedGameStore
2. NO calls to `getHealingBonus()` when calculating recovery time
3. NO calls to `getInvestigationBonus()` when advancing investigations
4. NO calls to `getEducationBonus()` when training characters
5. NO facility construction UI (bases exist as data only)

### Implementation Plan

#### Step 1: Add Base State to Store
**File**: `C:\git\sht\MVP\src\stores\enhancedGameStore.ts`

**Add to State Interface**:
```typescript
// Base management
baseState: BaseState;  // From baseSystem.ts
```

**Add Actions**:
```typescript
// Base management actions
initializeBase: (type: BaseType, name: string, location: string, country: string) => void;
buildFacility: (baseId: string, facilityType: FacilityType, x: number, y: number) => void;
getActiveBaseBonus: (bonusType: 'healing' | 'investigation' | 'education' | 'crafting') => number;
```

#### Step 2: Wire Healing Bonus
**File**: `C:\git\sht\MVP\src\stores\enhancedGameStore.ts`

**Modify Healing Calculation** (find healing/recovery code):
```typescript
// Current (estimated):
const baseHealingPerDay = 5 // HP per day

// Modified:
const healingBonus = getActiveBase(store.baseState)
  ? getHealingBonus(getActiveBase(store.baseState)!)
  : 0
const modifiedHealing = baseHealingPerDay * (1 + healingBonus / 100)
```

**Also modify** `C:\git\sht\MVP\src\components\HospitalScreen.tsx`:
- Display base healing bonus in UI
- Show reduced recovery times when bonus active

#### Step 3: Wire Investigation Bonus
**File**: `C:\git\sht\MVP\src\data\investigationSystem.ts`

**Modify `advanceInvestigation()`** (around line 725-791):
```typescript
// Add base bonus to progress calculation
export function advanceInvestigation(
  investigation: Investigation,
  character: GameCharacter,
  approach: ApproachType,
  baseBonus: number = 0  // NEW PARAMETER
): ActionResult {
  // ... existing code ...

  // Modified progress gain:
  const progressGained = approachConfig.successBonuses.progressGain
    + Math.floor(Math.random() * 10)
    + Math.floor(baseBonus / 5)  // Base bonus adds extra progress
```

**Or wire at store level** in enhancedGameStore when calling `advanceInvestigation()`:
```typescript
const baseBonus = getActiveBase(store.baseState)
  ? getInvestigationBonus(getActiveBase(store.baseState)!)
  : 0
const result = advanceInvestigation(investigation, character, approach, baseBonus)
```

#### Step 4: Wire Education Bonus
**File**: `C:\git\sht\MVP\src\stores\enhancedGameStore.ts`

Find training/education progression code and modify:
```typescript
// When calculating training progress
const fieldBonus = getActiveBase(store.baseState)
  ? getEducationBonus(getActiveBase(store.baseState)!, trainingField)
  : 0
const modifiedProgress = baseProgress * (1 + fieldBonus / 100)
```

#### Step 5: Add Base Overview UI
**File**: `C:\git\sht\MVP\src\components\BaseOverview.tsx` (NEW)

Basic UI showing:
- Current base type and location
- Grid of facilities with levels
- List of active bonuses and their values
- "Build Facility" button (opens facility selector)

### Priority: MEDIUM
### Dependencies: None directly, but complements Items 1 and 4
### Estimated Effort: 6-8 hours

---

## Item 4: Territory Control System

### Current State Analysis

**Files Analyzed**:
- `C:\git\sht\MVP\src\data\territorySystem.ts` - Complete territory control system
- `C:\git\sht\MVP\src\data\sectors.ts` - Sector definitions

**What Exists**:
1. `territorySystem.ts` has:
   - `TerritoryControl` interface with control %, militia strength, bonuses
   - `MilitiaUnit` interface with strength, size, loyalty, equipment
   - `initializeSectorControl()` - Set up sector control
   - `applyCombatOutcome()` - Update control after combat
   - `createMilitia()` - Create militia for defense
   - `trainMilitia()` - Improve militia strength/loyalty
   - `generateDefenseMissions()` - Create defense/liberation missions
   - `completeDefenseMission()` - Apply mission outcomes
   - `getPlayerTerritorySummary()` - Aggregate player territories
   - `calculateSectorBonuses()` - Income/fame from controlled sectors
2. System already subscribes to EventBus for `combat:ended` events (line 331-358)
3. System handles `time:day-passed` for territory decay (line 363-394)

**What's Missing**:
1. NO initialization call (`initTerritorySystem()` not called in App.tsx)
2. NO territory display on world map
3. NO militia training UI
4. NO territory income/bonus application to economy
5. NO defense mission integration with mission store
6. Defense missions generated but not displayed anywhere

### Implementation Plan

#### Step 1: Initialize Territory System
**File**: `C:\git\sht\MVP\src\App.tsx`

**Add to App initialization**:
```typescript
import { initTerritorySystem, cleanupTerritorySystem } from './data/territorySystem'

// In useEffect or component mount:
initTerritorySystem()

// In cleanup:
cleanupTerritorySystem()
```

#### Step 2: Display Territory on World Map
**File**: `C:\git\sht\MVP\src\components\WorldMap\WorldMapGrid.tsx`

**Already partially implemented** (lines 8-14):
```typescript
import {
  getSectorControl,
  getControlLevel,
  getControlColor,
  TerritoryControl,
  FactionId,
} from '../../data/territorySystem';
```

**Need to wire to grid rendering**:
```typescript
// In grid cell rendering (around line 1598):
const control = getSectorControl(cellId)
const controlColor = control ? getControlColor(getControlLevel(control.controlPercent)) : null

// Apply border/background color based on control
```

#### Step 3: Add Militia Training UI
**File**: `C:\git\sht\MVP\src\components\WorldMap\TerritoryPanel.tsx` (NEW)

```typescript
// UI Features:
// - List of controlled sectors with control %
// - Militia units in each sector (strength, size, equipment)
// - "Train Militia" button (costs money, takes time)
// - "Recruit Militia" button (hire new units)
// - Defense mission alerts (urgent territories)
```

#### Step 4: Wire Territory Bonuses to Economy
**File**: `C:\git\sht\MVP\src\stores\enhancedGameStore.ts`

**Add to weekly/daily processing**:
```typescript
// In time progression or weekly tick:
const territoryIncome = getPlayerTerritorySummary().totalIncome
store.budget += territoryIncome

const territoryFame = getPlayerTerritorySummary().totalFame
store.playerFame += territoryFame
```

#### Step 5: Wire Defense Missions to Mission Store
**File**: `C:\git\sht\MVP\src\stores\missionStore.ts`

**Add action**:
```typescript
getDefenseMissions: (): TerritoryDefenseMission[] => {
  return getActiveDefenseMissions()
}

// Modify mission display to include defense missions
```

**Or create bridge**:
```typescript
// Periodically sync defense missions to available missions
const defMissions = getActiveDefenseMissions()
defMissions.forEach(dm => {
  // Convert TerritoryDefenseMission to GeneratedMission format
  // Add to availableMissions for current sector
})
```

#### Step 6: Handle Territory Combat Results
**Already wired** via EventBus in `territorySystem.ts` line 331-358:
```typescript
function handleCombatEnded(event: CombatEndedEvent): void {
  // Calls applyCombatOutcome() automatically
}
```

Just need to ensure `initTerritorySystem()` is called.

### Priority: MEDIUM
### Dependencies: Item 1 (faction standings affect territory relations)
### Estimated Effort: 8-10 hours

---

## Implementation Priority Order

```
PRIORITY 1 (Foundation) - Start Immediately
+--------------------------------------------------+
|  Item 1: Wire Faction Standings                   |
|  - Creates EventBus pattern for other wiring      |
|  - No dependencies                                |
|  - Estimated: 4-6 hours                          |
+--------------------------------------------------+
                    |
                    v
PRIORITY 2 (Parallel Track A) - After Item 1
+--------------------------------------------------+
|  Item 4: Territory Control                        |
|  - Just needs initTerritorySystem() call          |
|  - Already EventBus-wired                         |
|  - Adds gameplay depth quickly                    |
|  - Estimated: 8-10 hours                         |
+--------------------------------------------------+

PRIORITY 2 (Parallel Track B) - After Item 1
+--------------------------------------------------+
|  Item 3: Wire Base Bonuses                        |
|  - Independent of territory                       |
|  - Enhances existing systems                      |
|  - Estimated: 6-8 hours                          |
+--------------------------------------------------+
                    |
                    v
PRIORITY 3 (UI Polish) - After Items 3 & 4
+--------------------------------------------------+
|  Item 2: Squad Management UI                      |
|  - Biggest UI work                                |
|  - Benefits from other systems being wired        |
|  - Estimated: 8-12 hours                         |
+--------------------------------------------------+
```

---

## Dependency Graph

```
                    App.tsx
                       |
        +--------------+--------------+
        |              |              |
        v              v              v
  initFactionEventHandler  initTerritorySystem  BaseState Init
        |              |              |
        v              v              v
   EventBus --------> EventBus <----- getHealingBonus
   mission:completed  combat:ended    getInvestigationBonus
        |              |              |
        v              v              v
   modifyStanding  applyCombatOutcome  Hospital/Investigation
        |              |                   Bonuses
        v              v
   FactionStanding  TerritoryControl
   Updates          Updates
        |              |
        +------+-------+
               |
               v
        World Map Display
        (Shows faction colors,
         territory control,
         squad management)
```

---

## Risk Assessment

### High Risk Areas
1. **Store State Bloat**: Adding squads, bases, factions to store increases complexity
   - Mitigation: Consider separate Zustand slices

2. **EventBus Race Conditions**: Multiple handlers for same event
   - Mitigation: Use priority system (already exists in EventBus)

3. **WorldMapGrid Size**: File is already 1600+ lines
   - Mitigation: Extract Squad/Territory panels to separate components

### Low Risk Areas
1. **Territory System**: Already complete, just needs initialization
2. **Base Bonuses**: Well-defined functions, just need calling
3. **Faction System**: Complete implementation, just needs wiring

---

## Success Criteria

### Item 1: Faction Standings
- [ ] Completing a mission against criminals increases police standing
- [ ] Failing a mission decreases media standing
- [ ] Standing changes appear in notifications
- [ ] Bounties trigger at -25 standing threshold

### Item 2: Squad Management
- [ ] Can create named squad with selected characters
- [ ] Squad morale calculates from personality compatibility
- [ ] Can deploy squad to sector
- [ ] Squad travels as unit on world map

### Item 3: Base Bonuses
- [ ] Medical bay reduces healing time by bonus %
- [ ] Intel center speeds up investigations
- [ ] Training room accelerates education
- [ ] Bonuses display in relevant UIs

### Item 4: Territory Control
- [ ] Territory control displays on world map grid
- [ ] Combat victory increases control %
- [ ] Militia units can be trained
- [ ] Controlled sectors generate income

---

## Files Modified Summary

### New Files
- `C:\git\sht\MVP\src\data\missionFactionEffects.ts`
- `C:\git\sht\MVP\src\data\factionEventHandler.ts`
- `C:\git\sht\MVP\src\components\WorldMap\SquadManagementPanel.tsx`
- `C:\git\sht\MVP\src\components\WorldMap\TerritoryPanel.tsx`
- `C:\git\sht\MVP\src\components\BaseOverview.tsx`

### Modified Files
- `C:\git\sht\MVP\src\stores\enhancedGameStore.ts` - Add squad, base, faction state
- `C:\git\sht\MVP\src\components\WorldMap\WorldMapGrid.tsx` - Add squad tab, territory display
- `C:\git\sht\MVP\src\data\investigationSystem.ts` - Add base bonus parameter
- `C:\git\sht\MVP\src\components\HospitalScreen.tsx` - Display healing bonus
- `C:\git\sht\MVP\src\App.tsx` - Initialize all handlers

### Untouched (Already Complete)
- `C:\git\sht\MVP\src\data\factionSystem.ts` - Already complete
- `C:\git\sht\MVP\src\data\squadSystem.ts` - Already complete
- `C:\git\sht\MVP\src\data\baseSystem.ts` - Already complete
- `C:\git\sht\MVP\src\data\territorySystem.ts` - Already complete
- `C:\git\sht\MVP\src\stores\combatResultsHandler.ts` - Already emits events
- `C:\git\sht\MVP\src\stores\missionStore.ts` - Already functional

---

*Plan Created: 2026-01-02*
*Total Estimated Effort: 26-36 hours*
*Recommended Sprint: 2-3 days focused work*
