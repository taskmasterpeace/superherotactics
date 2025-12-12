# SuperHero Tactics - Testing Guide & Development Roadmap

**Created**: December 2024
**Purpose**: Everything you need for a week of testing and planning

---

## PART 1: WHAT TO TEST NOW

### Quick Start
```bash
cd MVP
npm run dev
# Opens on http://localhost:3001 (or next available port)
```

### Test Checklist

#### 1. World Map Movement (F2 → World Map)
- [ ] Click a sector to select it
- [ ] Select a character from the roster panel
- [ ] Click "Deploy" to start travel
- [ ] Watch smooth vehicle movement (CSS transitions)
- [ ] Observe progress bar filling smoothly
- [ ] Check ETA countdown
- [ ] Try different time speeds (1X → 10X → 60X → 360X)
- [ ] Pause/unpause time
- [ ] Watch day/night cycle (evening = orange tint, night = dark blue)

#### 2. World Almanac (Laptop icon on World Map OR F2 → World Almanac)
- [ ] Browse categories in sidebar
- [ ] Click articles to read
- [ ] Test wiki links (blue text links to other articles)
- [ ] Use search to find articles
- [ ] Check "Dev Status" toggle (shows implementation status)
- [ ] Navigate with Back button

#### 3. Character Generation (F2 → Characters)
- [ ] Click "Reroll" button to generate random character
- [ ] Check generated stats (MEL, AGL, STR, etc.)
- [ ] Look at powers, equipment, origin
- [ ] Generate multiple characters
- [ ] Check character sheet tabs

#### 4. Time System
- [ ] On World Map, observe time display (Day X, HH:MM)
- [ ] Click pause button (yellow) to pause
- [ ] Click speed button to cycle through speeds
- [ ] Watch day counter increment
- [ ] Observe time-of-day changes (morning/noon/evening/night)

#### 5. Combat Lab (F2 → Combat Lab)
- [ ] Combat loads with Phaser
- [ ] Move units with click
- [ ] Attack enemies
- [ ] Test AI vs AI mode button
- [ ] Check hit/miss/graze/crit results
- [ ] Test grenades (arc throwing)
- [ ] Test powers (beams, teleport)

### Known Limitations (Don't Test Yet)
- DR/armor stopping power (not wired in combat)
- Economy (money doesn't change)
- Missions (not generating)
- City/country effects on gameplay (data exists but not displayed)
- Recruiting flow (stub)

---

## PART 2: EXISTING DOCUMENTATION

### Core Design Documents

| Document | Location | What It Covers |
|----------|----------|----------------|
| **CLAUDE.md** | `/CLAUDE.md` | Project overview, file structure, combined effects philosophy |
| **GAME_PLAN.md** | `/GAME_PLAN.md` | Strategic roadmap, feature checklist |
| **V0_INTEGRATION_SPEC.md** | `/V0_INTEGRATION_SPEC.md` | For V0 developers building strategic layer |

### System Proposals (in `/docs/` or root)

| Document | System | Status |
|----------|--------|--------|
| **NEWS_SYSTEM_SUMMARY.md** | Passive/aggressive news delivery | DESIGNED |
| **NEWS_SYSTEM_DETAILED_PROPOSAL.md** | Full news implementation | DESIGNED |
| **FACTION_RELATIONS_SYSTEM.md** | 6 factions, standing mechanics | DESIGNED |
| **FACTION_QUICK_REFERENCE.md** | Quick faction lookup | DESIGNED |
| **INVESTIGATION_SYSTEM_EXPANSION.md** | Email-based investigation | DESIGNED |
| **ECONOMY_LOOP_DETAILED.md** | Income/expenses, time events | DESIGNED |
| **MOVEMENT_POWERS_DETAILED.md** | Flight, teleport, super speed | DESIGNED |

### Data Reference

| File | Contents | Count |
|------|----------|-------|
| `data/weapons.ts` | All weapons with range brackets | 70+ |
| `data/armor.ts` | Armor with DR values | 50+ |
| `data/countries.ts` | Countries with 15+ stats each | 168 |
| `data/cities.ts` | Cities with sector codes | 1050 |
| `data/combinedEffects.ts` | 12 combined systems | 12 |
| `data/damageSystem.ts` | Damage types & effects | 20+ |
| `data/characterGeneration.ts` | Character creation | - |

---

## PART 3: COMBINED EFFECTS DEEP DIVE

This is the core design philosophy. **Every location plays differently** because stats combine.

### The 12 Systems (All in `combinedEffects.ts`)

```
1. CLONING
   Formula: (Healthcare + Science + GDP) / 3
   Creates: Clone quality %, memory transfer, super cloning, defect chance

2. BLACK MARKET
   Formula: (Corruption × 0.4) + (Military × 0.3) + ((100-Law) × 0.3)
   Creates: Access difficulty, weapon prices, hitmen availability

3. SURVEILLANCE
   Formula: (Intel × 0.4) + (Cyber × 0.3) + ((100-MediaFreedom) × 0.3)
   Creates: Detection speed, hacking difficulty, drone coverage

4. MEDICAL
   Formula: (Healthcare × 0.5) + (GDP × 0.3) + (Science × 0.2)
   Creates: Hospital tier, recovery speed, cost multiplier

5. RESEARCH
   Formula: (Science × 0.4) + (Education × 0.3) + (GDP × 0.2) + (Cyber × 0.1)
   Creates: Tech tier, research speed, facility bonuses

6. ORGANIZED CRIME
   Formula: (Corruption × 0.5) + ((100-Law) × 0.5)
   Creates: Gang presence, protection costs, hitmen quality

7. MERCENARIES
   Formula: (Military × 0.4) + (Corruption × 0.3) + ((100-Law) × 0.3)
   Creates: Pool size, quality tiers, pricing, loyalty

8. SAFE HOUSES
   Formula: (Corruption × 0.4) + ((100-Law) × 0.3) + ((100-Intel) × 0.3)
   Creates: Availability, security ratings, tunnel access

9. BORDER CONTROL
   Formula: (Military × 0.3) + (Intel × 0.3) + (Law × 0.4)
   Creates: Visa cost, smuggling risk, bribe costs

10. MEDIA
    Formula: MediaFreedom affects everything
    Creates: Story planting cost, censorship speed, troll farms

11. POLITICS
    Formula: (GDP + Corruption + MediaFreedom) / various
    Creates: Stability, coup risk, bribe costs, lawsuit speed

12. LSW AFFAIRS
    Formula: LSW policy + Intel + Military + Science
    Creates: Registration enforcement, public opinion, vigilante response
```

### Example: USA vs Nigeria

| System | USA | Nigeria |
|--------|-----|---------|
| Cloning Quality | 87% | 25% |
| Black Market | Hard | Easy |
| Hospital Tier | 4 | 2 |
| Merc Pool | Limited | Abundant |
| Border | Fortress | Weak |
| Politics Stability | 85 | 35 |
| LSW Status | Licensed | Gray Area |

**Same game, completely different experience.**

---

## PART 4: 20 QUESTIONS FOR YOU

Answer these while testing. Your answers will drive the next development phase.

### Core Loop
1. When you click a sector on the world map, what info should appear? Just cities? Combined effects? Both?
2. Should characters auto-travel or require confirmation every time?
3. How much should time compression affect travel? (Currently 6 hours/sector base)

### Characters
4. When a character arrives at a location, what menu should pop up? (Actions: Patrol, Rest, Shop, Mission, etc.)
5. Should characters have "home" sectors they're familiar with (affects efficiency)?
6. How detailed should the character sheet be? RPG-detailed or streamlined?

### Combat Flow
7. Before combat starts, should there be a "free movement" phase where you position before enemies see you?
8. How should line-of-sight work in buildings? Ray-tracing or tile-based?
9. Should unconscious enemies be capturable? (Bounties system)

### Economy
10. How quickly should money flow? Enough to worry about weekly? Daily?
11. Should equipment break/degrade, creating ongoing costs?
12. How important is the black market vs legal purchases?

### Factions
13. Should factions be per-country or global? (Police in USA vs Police in Nigeria)
14. Can you work for opposing factions simultaneously?
15. How visible should faction standing be? Hidden? Numeric? Descriptive?

### World
16. Should news be "push" (notifications) or "pull" (check laptop)?
17. How much should country stats affect combat? (Training quality of enemies, equipment tier)
18. Should elections/coups change country stats during gameplay?

### Technical
19. What screen resolution are you primarily testing on?
20. Any performance issues you've noticed?

---

## PART 5: TILED MAP EDITOR GUIDE

### What is Tiled?
Tiled (mapeditor.org) is a free 2D map editor. It exports JSON that Phaser can directly load.

### Our Grid System
```
Current CombatScene uses:
- Grid size: Configurable (currently ~50x50 per tile)
- View: Top-down with isometric-ish visuals
- Layers: Ground, Objects, Characters, Effects
```

### Setting Up Tiled for SHT

#### Step 1: Create New Map
- **Orientation**: Orthogonal (we're not true isometric)
- **Tile Size**: 64x64 pixels recommended
- **Map Size**: 20x20 tiles for standard combat, 40x40 for large

#### Step 2: Create Tilesets
You need these tilesets:
1. **Ground** - Floor tiles (concrete, grass, wood, etc.)
2. **Walls** - Blocking terrain
3. **Cover** - Half-height objects (crates, cars, low walls)
4. **Props** - Non-blocking decoration
5. **Spawns** - Invisible markers for unit placement

#### Step 3: Layer Structure
Create these layers (order matters):
```
[Top to bottom in Tiled]
- spawns (Object layer) - Where units appear
- effects (Tile layer) - Blood, scorch marks
- props (Tile layer) - Furniture, debris
- cover (Tile layer) - Things to hide behind
- walls (Tile layer) - Blocking terrain
- ground (Tile layer) - Base floor
```

#### Step 4: Custom Properties
On tiles, add these properties:
- `blocking: boolean` - Can't walk through
- `cover: number` - Cover value (0-100)
- `destructible: boolean` - Can be destroyed
- `height: number` - For line-of-sight

#### Step 5: Export Settings
- Format: JSON
- Embed tilesets: Yes (simpler)
- Output: `MVP/public/assets/maps/`

### Loading in Phaser
```typescript
// In PreloadScene
this.load.tilemapTiledJSON('map-warehouse', 'assets/maps/warehouse.json');
this.load.image('tileset-urban', 'assets/tilesets/urban.png');

// In CombatScene
const map = this.make.tilemap({ key: 'map-warehouse' });
const tileset = map.addTilesetImage('urban', 'tileset-urban');
const groundLayer = map.createLayer('ground', tileset);
const wallLayer = map.createLayer('walls', tileset);
wallLayer.setCollisionByProperty({ blocking: true });
```

### Asset Requirements

For each tileset image:
- **Format**: PNG with transparency
- **Tile Size**: Consistent (64x64 recommended)
- **Grid**: Tiles arranged in grid, no gaps
- **Naming**: `tileset-[theme].png` (urban, forest, base, etc.)

### Character Visibility Through Walls

You mentioned the "circle around character" effect from JA2. This is called **fog-of-war with silhouette**.

Implementation approach:
```typescript
// Option 1: Shader-based (complex but pretty)
// Character renders through walls with outline effect

// Option 2: Simple alpha (what we should start with)
// If character is behind wall:
//   - Wall tile becomes semi-transparent
//   - OR character renders with 50% alpha above wall

// Option 3: Cutout circle (JA2 style)
// Render a circular mask around character
// Everything in mask shows character, outside shows wall
```

I recommend starting with **Option 2** (wall transparency) as it's simplest.

---

## PART 6: CUSTOM MAP EDITOR PRD

### Overview
A web-based map editor for creating SHT tactical maps without needing Tiled.

### User Stories

1. **As a designer**, I want to select a grid size (10x10 to 50x50) so I can create maps of different scales.
2. **As a designer**, I want to paint tiles from a palette so I can quickly build terrain.
3. **As a designer**, I want to place spawn points for player and enemy teams.
4. **As a designer**, I want to set cover values on tiles.
5. **As a designer**, I want to export maps in a format Phaser can load.
6. **As a designer**, I want to import my own tile images.

### Core Features

#### MVP (Phase 1)
- [ ] Grid canvas (configurable size)
- [ ] Tile palette (load PNG tileset)
- [ ] Paint tool (click/drag to place tiles)
- [ ] Erase tool
- [ ] Layer switcher (ground, walls, cover, props)
- [ ] Export to JSON
- [ ] Save/load from localStorage

#### Phase 2
- [ ] Import custom tileset images
- [ ] Remove background tool (make transparent)
- [ ] Spawn point placement
- [ ] Tile properties editor (blocking, cover value)
- [ ] Preview mode (walk around the map)

#### Phase 3
- [ ] AI to generate basic layouts
- [ ] Templates (warehouse, office, street, etc.)
- [ ] Multi-floor support
- [ ] Export directly to game

### Technical Spec

#### Data Structure
```typescript
interface TacticalMap {
  id: string;
  name: string;
  gridWidth: number;
  gridHeight: number;
  tileSize: number; // pixels
  layers: {
    ground: TileData[][];
    walls: TileData[][];
    cover: TileData[][];
    props: TileData[][];
  };
  spawns: SpawnPoint[];
  tileset: {
    imageUrl: string;
    tileWidth: number;
    tileHeight: number;
    columns: number;
  };
}

interface TileData {
  tileIndex: number; // Index in tileset
  blocking: boolean;
  cover: number; // 0-100
  destructible: boolean;
}

interface SpawnPoint {
  x: number;
  y: number;
  team: 'player' | 'enemy' | 'neutral';
  label?: string;
}
```

#### UI Layout
```
+------------------+------------------------+
|  TILESET         |                        |
|  [tile palette]  |                        |
|                  |      MAP CANVAS        |
+------------------+                        |
|  TOOLS           |                        |
|  [paint][erase]  |                        |
|  [select][fill]  |                        |
+------------------+------------------------+
|  LAYERS          |  PROPERTIES            |
|  [x] Ground      |  Blocking: [x]         |
|  [ ] Walls       |  Cover: [50]           |
|  [ ] Cover       |  Destructible: [ ]     |
+------------------+------------------------+
|  [Export JSON]  [Save]  [Load]  [Clear]   |
+-------------------------------------------+
```

#### Integration with Phaser

The exported JSON should match Tiled format:
```json
{
  "width": 20,
  "height": 20,
  "tilewidth": 64,
  "tileheight": 64,
  "layers": [
    {
      "name": "ground",
      "type": "tilelayer",
      "data": [1,1,1,2,2,2,...]
    }
  ],
  "tilesets": [
    {
      "name": "urban",
      "image": "tileset-urban.png",
      "tilewidth": 64,
      "tileheight": 64
    }
  ]
}
```

This way, whether you use Tiled or the custom editor, Phaser loads it the same way.

---

## PART 7: RECOMMENDED NEXT STEPS

### Priority Order (After Testing Week)

#### Tier 1: Core Loop Completion
1. **Wire DR/Armor in Combat** - Combat feels incomplete without it
2. **Character Arrival Actions** - What happens when they reach a sector
3. **Basic Economy** - Weekly salary drain, mission rewards

#### Tier 2: Content Systems
4. **Mission Generation** - Based on sector/country
5. **News System** - Passive information delivery
6. **Faction Standing Display** - Show relationship somewhere

#### Tier 3: Polish
7. **Map Editor** - For creating tactical maps
8. **Sound Integration** - We have 381 sounds, many not used
9. **Equipment UI** - Loadout management

### File Structure for New Features

When adding new systems:
```
MVP/src/
  data/
    [systemName]System.ts     <- Data & calculations
  components/
    [SystemName]Panel.tsx     <- UI component
  stores/
    enhancedGameStore.ts      <- Add state here (don't make new stores)
```

---

## PART 8: QUICK REFERENCE

### Keyboard Shortcuts
- **F2** - Dev mode panel (jump to any view)
- **F4** - Asset manager

### Key Files to Know
| Purpose | File |
|---------|------|
| Main routing | `App.tsx` |
| Game state | `stores/enhancedGameStore.ts` |
| World map | `components/WorldMap/WorldMapGrid.tsx` |
| Combat | `game/scenes/CombatScene.ts` |
| Combined effects | `data/combinedEffects.ts` |
| Weapons | `data/weapons.ts` |
| Countries | `data/countries.ts` |

### Store Actions Cheat Sheet
```typescript
// Character management
addCharacter(char)
updateCharacter(id, updates)
setCharacterStatus(id, status, details)

// Travel
startTravel(characterIds, destinationSector, vehicleId?)
updateTravelProgress()
cancelTravel(unitId)

// Time
togglePause()
cycleTimeSpeed()
tickTime()
getFormattedTime()

// View
setCurrentView(viewName)
setGamePhase(phase)
```

---

## PART 9: NOTES FOR AI MAP EDITOR

If you're having another AI build the map editor, give them this:

### Context
- Game uses Phaser 3 for tactical combat
- Maps are grid-based, top-down
- Need layers: ground, walls, cover, props, spawns
- Output must be Tiled-compatible JSON
- React frontend preferred (matches rest of project)

### Technical Requirements
- Canvas-based rendering (not DOM tiles)
- Support tilesets up to 1024x1024 pixels
- Export JSON matching Tiled format
- localStorage save/load
- Undo/redo stack

### Assets Handling
- User uploads PNG tileset
- Auto-detect tile size or let user specify
- Background removal tool optional but nice
- Each tile can have custom properties

### Integration Point
```typescript
// How CombatScene loads maps
const map = this.make.tilemap({ key: 'map-name' });
const tileset = map.addTilesetImage('tileset-name', 'tileset-image-key');
const layer = map.createLayer('layer-name', tileset);
layer.setCollisionByProperty({ blocking: true });
```

---

**Good luck with testing! Document everything that feels wrong or could be better. That feedback is gold.**
