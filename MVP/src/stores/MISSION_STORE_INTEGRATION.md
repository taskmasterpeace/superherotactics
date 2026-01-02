# Mission Store Integration Guide

This document describes how to integrate the mission generation system into the enhancedGameStore.

## Files Created

1. `C:\git\sht\MVP\src\data\missionGeneration.ts` - Mission generation engine
2. `C:\git\sht\MVP\src\stores\missionStore.ts` - Mission store actions and state

## Integration Steps

### Step 1: Add Imports to enhancedGameStore.ts

Add these imports at the top of `enhancedGameStore.ts`:

```typescript
import { GeneratedMission } from '../data/missionSystem'
import {
  initialMissionState,
  createMissionActions,
  shouldRefreshMissions,
} from './missionStore'
```

### Step 2: Add State to Interface

In the `EnhancedGameStore` interface, add after line 113 (after `publicOpinion`):

```typescript
  // Mission System
  availableMissions: Map<string, GeneratedMission[]>  // sector -> missions[]
  activeMissions: GeneratedMission[]  // Missions currently in progress
  completedMissions: GeneratedMission[]  // Mission history
  lastMissionGeneration: number  // Game time when missions were last generated
  missionRefreshInterval: number  // How often missions refresh (in game hours)
```

### Step 3: Add Action Methods to Interface

Add after line 194 (after `getFormattedTime`):

```typescript
  // Mission System Actions
  generateMissionsForSector: (sectorCode: string) => void
  generateMissionsForAllSectors: () => void
  getMissionsForSector: (sectorCode: string) => GeneratedMission[]
  acceptMission: (missionId: string) => void
  completeMissionById: (missionId: string, success: boolean) => void
  abandonMission: (missionId: string) => void
  expireMissions: () => void
  refreshMissions: () => void
```

### Step 4: Add Initial State

Add to the initial state object (around line 230):

```typescript
  // Mission System Initial State
  availableMissions: new Map(),
  activeMissions: [],
  completedMissions: [],
  lastMissionGeneration: 0,
  missionRefreshInterval: 24,
```

### Step 5: Add Mission Actions

Add before the closing `}))` at the end of the store (around line 1714):

```typescript
  // =====================================================================
  // MISSION SYSTEM
  // =====================================================================

  ...createMissionActions(set, get),
```

### Step 6: Hook into Time System

In the `tickTime` function (around line 1280), add mission refresh logic:

```typescript
  tickTime: () => {
    const state = get()

    // ... existing time tick code ...

    // Check if missions need refreshing
    if (shouldRefreshMissions(state)) {
      get().refreshMissions()
    }

    // Expire old missions every hour
    if (newMinutes % 60 === 0) {
      get().expireMissions()
    }
  },
```

## Usage Examples

### Generate Missions for Current Sector

```typescript
const { generateMissionsForSector, currentSector } = useGameStore()

// Generate missions when arriving at a sector
generateMissionsForSector(currentSector)
```

### Get Available Missions

```typescript
const { getMissionsForSector, currentSector } = useGameStore()

const missions = getMissionsForSector(currentSector)
```

### Accept a Mission

```typescript
const { acceptMission } = useGameStore()

acceptMission('mission_1234567_abc123')
```

### Complete a Mission

```typescript
const { completeMissionById } = useGameStore()

completeMissionById('mission_1234567_abc123', true) // success
```

## Mission Generation Logic

Missions are generated based on:

### City Type Weights
- **Military cities**: Extract, Escort, Capture missions
- **Political cities**: Assassination, Protection, Investigation
- **Industrial cities**: Skirmish, Protection, Rescue
- **Educational cities**: Data extraction, Investigation
- **Company cities**: Corporate espionage, Data theft
- **Seaport cities**: Smuggling, Convoy escort

### Crime Index Weights
- **Very High (80+)**: Gang warfare, organized crime, hostage rescue
- **High (60-79)**: Frequent crime missions, gang fights
- **Moderate (40-59)**: Mixed missions, investigations
- **Low (0-39)**: Patrol, investigation, protection

### Country Stats Weights
- **High terrorism**: Terrorist missions, base capture, rescue
- **High corruption + weak law**: Underworld missions, assassinations
- **Strong military**: Military contracts, escorts
- **High intelligence**: Covert ops, extractions

### Difficulty Modifiers

Difficulty is adjusted based on:
- Crime index (higher = harder)
- Safety index (lower = harder)
- Military equipment tier (better gear = harder)
- Enemy quality (elite enemies = harder)
- Population size (mega cities = harder)

### Reward Modifiers

Rewards are scaled by:
- Country GDP (richer = higher pay)
- Danger level (more dangerous = higher pay)
- Corruption (more corrupt = higher pay)
- Terrorism presence (more terrorism = higher pay)

## Testing

### Test Mission Generation

```typescript
// In browser console or test file
const store = useGameStore.getState()

// Generate for current sector
store.generateMissionsForSector('K5')

// Check generated missions
console.log(store.getMissionsForSector('K5'))

// Generate for all sectors
store.generateMissionsForAllSectors()

// Check statistics
const stats = getMissionStatistics(store)
console.log(stats)
```

### Test Mission Flow

```typescript
// 1. Generate missions
store.generateMissionsForSector('K5')

// 2. Get missions
const missions = store.getMissionsForSector('K5')

// 3. Accept first mission
if (missions.length > 0) {
  store.acceptMission(missions[0].id)
}

// 4. Check active missions
console.log(store.activeMissions)

// 5. Complete mission
store.completeMissionById(missions[0].id, true)

// 6. Check completed missions
console.log(store.completedMissions)
```

## UI Integration Points

### World Map Grid
When clicking a sector, show available missions:

```typescript
const missions = getMissionsForSector(sectorCode)
// Display in sector panel
```

### Mission Board Component
Create a mission board showing:
- Available missions in current sector
- Active missions
- Mission recommendations
- Completed mission history

### Mission Details Panel
Show for each mission:
- Mission type and name
- Briefing
- Requirements (squad size, threat level)
- Rewards (cash, fame)
- Difficulty and danger level
- Time limit (if any)
- Warnings and advantages (from recommendations)

## Future Enhancements

1. **Mission Expiration**: Set `expiresAt` timestamp on missions
2. **Mission Chains**: Link missions together (complete A to unlock B)
3. **Faction Missions**: Filter by faction source (police, military, underworld)
4. **Daily Missions**: Special missions that refresh daily
5. **Reputation Effects**: Mission completion affects faction standings
6. **Dynamic Difficulty**: Adjust based on player success rate
7. **Mission Modifiers**: Add weather, time of day effects
8. **Special Events**: Random high-reward missions
