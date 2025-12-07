# World Map Strategic Layer

## Overview

The World Map is a **HEX grid-based strategic layer** inspired by Jagged Alliance 2. Players move squads between sectors, manage travel time, and engage in tactical combat when encountering enemies.

---

## Grid System

### Hex Grid Layout

```
    ⬡ ⬡ ⬡ ⬡ ⬡
   ⬡ ⬡ ⬡ ⬡ ⬡ ⬡
    ⬡ ⬡ ⬡ ⬡ ⬡
   ⬡ ⬡ ⬡ ⬡ ⬡ ⬡
    ⬡ ⬡ ⬡ ⬡ ⬡
```

- **Offset coordinates**: Odd rows offset right
- **Flat-top hexes**: 6 neighbors per hex
- **Sector IDs**: A1, A2, B1, B2... format

### Coordinate System

```typescript
// Axial coordinates (q, r)
// Convert to/from pixel for rendering

interface HexCoord {
  q: number;  // Column
  r: number;  // Row
}

// Pixel position
const hexToPixel = (hex: HexCoord, size: number) => ({
  x: size * (3/2 * hex.q),
  y: size * (Math.sqrt(3)/2 * hex.q + Math.sqrt(3) * hex.r)
});
```

---

## Sector Data Structure

```typescript
interface Sector {
  id: string;                    // "A1", "B3", etc.
  name: string;                  // "Gotham Downtown"
  coordinates: HexCoord;

  // Terrain & Travel
  terrain: TerrainType;          // urban, forest, mountain, water, desert
  travelTimeHours: number;       // Base travel time to cross
  vehicleAccessible: boolean;
  helicopterOnly: boolean;

  // Control & Presence
  controlledBy: string | null;   // Faction ID or null
  enemyPresence: EnemyPresence;
  civilianPopulation: number;

  // Resources
  resources: ResourceType[];
  facilities: Facility[];

  // State
  explored: boolean;
  lastVisited: Date | null;
  missionAvailable: Mission | null;
}

type TerrainType = 'urban' | 'suburban' | 'forest' | 'mountain' | 'water' | 'desert' | 'arctic';

interface EnemyPresence {
  level: 'none' | 'light' | 'moderate' | 'heavy' | 'fortress';
  estimatedStrength: number;
  lastScouted: Date | null;
}

interface Facility {
  type: 'hospital' | 'safehouse' | 'workshop' | 'intel' | 'armory' | 'airport';
  operational: boolean;
  level: number;
}
```

---

## Travel System

### Travel Time by Terrain

| Terrain | On Foot | Vehicle | Helicopter |
|---------|---------|---------|------------|
| Urban | 2 hrs | 0.5 hrs | 0.25 hrs |
| Suburban | 3 hrs | 1 hr | 0.25 hrs |
| Forest | 4 hrs | 2 hrs | 0.5 hrs |
| Mountain | 6 hrs | N/A | 1 hr |
| Desert | 4 hrs | 1.5 hrs | 0.5 hrs |
| Water | N/A | Boat 2 hrs | 0.5 hrs |

### Time Flow

```
Real Time → Game Time conversion:
1 real second = 1 game minute (when traveling)
1 real minute = 1 game hour (when idle)

Travel is real-time commitment:
- Cross-city: 15-60 real seconds
- Cross-country: 2-10 real minutes
- International: 30-60 real minutes
```

### Travel States

| State | Description |
|-------|-------------|
| **Idle** | Squad in sector, no movement |
| **Traveling** | En route between sectors |
| **Intercepted** | Ambushed during travel |
| **Combat** | Engaged in tactical battle |
| **Waiting** | At sector, timer running (rest, heal) |

---

## Squad Management

### Squad Data

```typescript
interface Squad {
  id: string;
  name: string;
  members: string[];              // Character IDs
  currentSector: string;
  destinationSector: string | null;
  travelProgress: number;         // 0-100%
  travelRoute: string[];          // Sector IDs
  vehicle: Vehicle | null;
  status: SquadStatus;
}

type SquadStatus = 'idle' | 'traveling' | 'combat' | 'resting' | 'training';

interface Vehicle {
  type: 'car' | 'truck' | 'helicopter' | 'boat';
  fuel: number;
  capacity: number;
  condition: number;
}
```

### Movement Rules

1. **Pathfinding**: A* through hex grid
2. **Terrain Costs**: Different terrains have different costs
3. **Enemy Sectors**: Can attempt to sneak through or engage
4. **Interception**: Enemies may intercept traveling squads

---

## UI Layout

### Full Screen Map View

```
┌──────────────────────────────────────────────────────────────────┐
│ WORLD MAP                    [Zoom: 100%] [Filter ▼] [?] [X]     │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│                    ⬡ ⬡ ⬡ ⬡ ⬡                                    │
│                   ⬡ ⬡ ⬡ ⬡ ⬡ ⬡                                   │
│                    ⬡ ⬡[S1]⬡ ⬡      ← Squad marker               │
│                   ⬡ ⬡ ⬡ ⬡ ⬡ ⬡                                   │
│                    ⬡ ⬡ ⬡ ⬡ ⬡                                    │
│                   ⬡ ⬡ ⬡[!]⬡ ⬡      ← Enemy territory            │
│                    ⬡ ⬡ ⬡ ⬡ ⬡                                    │
│                                                                   │
├──────────────────────────────────────────────────────────────────┤
│ Selected: Gotham Downtown (B3)                                    │
│ Terrain: Urban  │  Control: Friendly  │  Enemies: None           │
│ Facilities: [Hospital] [Safehouse] [Workshop]                     │
│ [TRAVEL HERE]  [VIEW DETAILS]  [START MISSION]                   │
└──────────────────────────────────────────────────────────────────┘
```

### Sector Colors

| State | Color | Description |
|-------|-------|-------------|
| Unexplored | Dark gray | Never visited |
| Friendly | Blue | Under player control |
| Neutral | Light gray | No faction control |
| Enemy Light | Light red | Few enemies |
| Enemy Heavy | Dark red | Heavy enemy presence |
| Contested | Orange | Active conflict |
| Mission | Yellow pulse | Mission available |

### Squad Icons

```
[S1] - Squad 1 (with number)
 │
 ├─── Blue circle: Your squad
 ├─── Red circle: Enemy patrol
 └─── Yellow circle: Neutral/civilian
```

---

## Interactions

### Hex Click Actions

| Click Type | Action |
|------------|--------|
| Single click | Select sector, show info |
| Double click | Travel to sector (if squad selected) |
| Right click | Context menu (scout, assault, sneak) |
| Drag from squad | Draw travel route |

### Travel Dialog

When initiating travel:

```
┌─────────────────────────────────────────┐
│ TRAVEL TO: Gotham Downtown              │
├─────────────────────────────────────────┤
│ Distance: 3 sectors                     │
│ Terrain: Urban → Suburban → Urban       │
│                                         │
│ Travel Time:                            │
│ • On foot:    6 hours (2 min real)      │
│ • By car:     1.5 hours (30 sec real)   │
│ • Helicopter: N/A (no helipad)          │
│                                         │
│ Route: A1 → A2 → B2 → B3                │
│                                         │
│ Threats: Light enemy patrol at A2       │
│ Risk: 25% interception chance           │
│                                         │
│ [CONFIRM TRAVEL]  [PLAN ROUTE]  [CANCEL]│
└─────────────────────────────────────────┘
```

### Interception Event

```
┌─────────────────────────────────────────┐
│ ⚠️ AMBUSH!                               │
├─────────────────────────────────────────┤
│ Your squad has been intercepted at A2!  │
│                                         │
│ Enemy Force:                            │
│ • 4 Armed Guards                        │
│ • 1 Lieutenant                          │
│                                         │
│ Options:                                │
│ [ENGAGE]    - Start tactical combat     │
│ [RETREAT]   - Return to previous sector │
│ [NEGOTIATE] - Attempt to bribe/bluff    │
└─────────────────────────────────────────┘
```

---

## Hotkeys

| Key | Action |
|-----|--------|
| WASD | Pan map |
| Mouse wheel | Zoom in/out |
| Space | Center on selected squad |
| 1-9 | Select squad 1-9 |
| M | Toggle map overlay |
| T | Start travel mode |
| Escape | Cancel / Close |

---

## Map Layers

### Layer Stack (bottom to top)

1. **Base terrain** - Hex fill colors
2. **Borders** - Country/region boundaries
3. **Routes** - Roads, rivers, paths
4. **Facilities** - Building icons
5. **Enemy zones** - Red overlays
6. **Travel path** - Animated line
7. **Squad markers** - Unit icons
8. **UI overlays** - Selection, hover effects

### Filter Options

- Show/hide enemy territories
- Show/hide unexplored
- Show/hide facility icons
- Show/hide travel routes
- Highlight missions only

---

## Data Files

### Sector Definition CSV

```csv
Sector_ID,Name,Q,R,Terrain,Travel_Base,Vehicle_OK,Heli_Only,Region
A1,Gotham Harbor,0,0,urban,2,true,false,Gotham
A2,Gotham Industrial,1,0,urban,2,true,false,Gotham
A3,Gotham Downtown,2,0,urban,2,true,false,Gotham
B1,Gotham Outskirts,0,1,suburban,3,true,false,Gotham
B2,Arkham Forest,1,1,forest,4,false,false,Gotham
...
```

### Initial State JSON

```json
{
  "sectors": {
    "A1": {
      "controlledBy": "player",
      "explored": true,
      "enemyPresence": { "level": "none" },
      "facilities": ["safehouse"]
    },
    "A2": {
      "controlledBy": null,
      "explored": false,
      "enemyPresence": { "level": "light", "estimatedStrength": 5 }
    }
  },
  "squads": [
    {
      "id": "squad_1",
      "name": "Alpha Team",
      "currentSector": "A1",
      "members": ["batman", "robin", "batgirl"]
    }
  ]
}
```

---

## Related Files

| File | Purpose |
|------|---------|
| `MVP/src/components/WorldMap.tsx` | React component |
| `Game_Mechanics_Spec/World_Sectors.csv` | Sector database |
| `Game_Mechanics_Spec/Travel_Routes.csv` | Pre-defined routes |
| `Combat_UI_Spec.md` | UI styling reference |

---

*Last Updated: 2024-12-05*
*Version: 1.0*
