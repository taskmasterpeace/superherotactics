# SuperHero Tactics - Strategic Game Plan

> **Created**: December 2024
> **Purpose**: Master checklist for game development priorities

---

## THE VISION

**Core Loop**: Country Selection -> City Selection -> Base Setup -> Recruit Team -> Equip -> World Map -> Tactical Combat

**Three Layers**:
1. **Laptop Layer**: Web/News, Investigations, Hospitals, Education, Character Management
2. **World Map Layer**: Grid-based map, time-based travel, sectors, squad deployment, base management
3. **Tactical Layer**: Turn-based combat, grappling, powers, damage types, injuries

**Key Innovations**:
- Time-based everything (like Jagged Alliance 2)
- Deep injury/recovery system
- Character permadeath with comeback potential (cloning, time travel)
- AI-generated content (funerals, news, combat reports)
- Multiplayer invasion (other players can possess enemies)
- Mobile companion app for enemy control
- **Free movement until enemy spotted** (then AP kicks in)

---

## CURRENT STATE (December 2024)

### TACTICAL LAYER - WORKING

| Feature | Status | Notes |
|---------|--------|-------|
| Turn-based Combat | DONE | CombatScene.ts |
| AP/Time Units | DONE | 4-8 AP per unit |
| Movement/Pathfinding | DONE | A* pathfinding |
| Line of Sight | DONE | Raycasting |
| Fog of War | DONE | Per-unit visibility |
| Hit/Miss/Graze/Crit | DONE | Dice rolls |
| Weapon Range Brackets | DONE | Per-weapon optimal ranges |
| Knockback | DONE | Simple physics |
| Grenades | DONE | Arc throwing, explosions |
| Powers (Beams, Teleport) | DONE | Several implemented |
| Sound Effects | DONE | 381 sounds |
| AI Combat | DONE | AI vs AI mode |
| RPG/Rockets | DONE | Knockback 5, blast radius 2 |
| Grappling | PARTIAL | Basic grabs |

**NOT WIRED**:
- [ ] DR (armor stopping power)
- [ ] Shield absorption
- [ ] Import 70+ weapons from weapons.ts
- [ ] Damage types -> status effects
- [ ] Advanced knockback physics
- [ ] Character stats in combat (MEL/INT/INS/CON)
- [ ] Free movement before combat

### WORLD MAP LAYER - BASIC FUNCTIONAL

| Feature | Status | Notes |
|---------|--------|-------|
| Sector Grid (20x10) | DONE | WorldMapGrid.tsx |
| Squad Position | DONE | Emoji marker on sector |
| Deploy to Sector | DONE | Click -> Deploy button |
| Travel Time | DONE | 6 hours per sector |
| Enter Combat | DONE | Button when on_mission |
| 1050 Cities Display | DONE | In sector panels |
| Command Center HUD | DONE | Budget, day, squad status |
| Time Progression | NOT DONE | Need calendar system |
| Vehicles | NOT DONE | 24 defined, not used |
| Militia/Territory | NOT DONE | Faction control |
| Multiple Squads | NOT DONE | Single squad only |

### LAPTOP LAYER - STUBS ONLY

| Feature | Status |
|---------|--------|
| News/Web Browser | NOT DONE |
| Investigations | STUB |
| Hospital | NOT DONE |
| Education/Training | NOT DONE |
| Email System | NOT DONE |
| Character Management | PARTIAL |
| Base Overview | NOT DONE |

---

## BASE BUILDING SYSTEM (NEW PRIORITY)

Inspired by XCOM base management.

### Concept
- Grid-based underground/building layout
- Player designs base by placing rooms
- Hallways connect rooms (enables tactical raids)
- Construction takes time and money
- Enemies can raid your base

### Room Types
| Room | Function | Size |
|------|----------|------|
| Barracks | Character capacity | 2x2 |
| Armory | Equipment storage | 2x2 |
| Med Bay | Injury recovery | 2x2 |
| Research Lab | Tech development | 3x2 |
| Training Room | Skill learning | 2x2 |
| Prison | Captured enemies | 2x1 |
| Power Generator | Base power | 1x2 |
| Radar | Detection range | 2x2 |
| Hangar | Vehicle storage | 4x3 |

### Technical Approach
- Phaser tilemap for base layout
- Procedural or player-designed placement
- Same CombatScene for base defense missions
- Base location = sector on world map

### Research Tasks
- [ ] Phaser procedural dungeon/room generation
- [ ] Room placement UI (drag and drop)
- [ ] Construction queue system
- [ ] Base defense mission trigger

---

## FREE MOVEMENT SYSTEM (PLANNED)

**Current**: AP consumed from turn 1
**Wanted**: Free movement until combat starts

### How It Works
1. Units move freely (no AP cost) while no enemies visible
2. When enemy spotted -> "CONTACT!" alert
3. Initiative rolls determine turn order
4. AP system kicks in for combat
5. After combat ends, free movement resumes

### Implementation
- Add `combatActive: boolean` to game state
- Free movement = unlimited AP
- Enemy spotted triggers combat mode
- Combat ends when all enemies dead/fled

---

## PRIORITY ROADMAP

### PHASE 1: Combat Polish (Current)
- [x] Weapon range brackets
- [x] RPG with knockback
- [ ] Wire DR/armor stopping power
- [ ] Free movement before contact
- [ ] Import full weapon database

### PHASE 2: Strategic Loop
- [x] World map with sectors
- [x] Squad deployment
- [x] Enter combat from map
- [ ] Combat results back to map
- [ ] Time progression
- [ ] Multiple squads

### PHASE 3: Base Building
- [ ] Research Phaser tilemap generation
- [ ] Base grid layout system
- [ ] Room placement UI
- [ ] Construction queue
- [ ] Base defense missions

### PHASE 4: Laptop Layer
- [ ] Main laptop UI frame
- [ ] News system
- [ ] Investigation gameplay
- [ ] Hospital management
- [ ] Training system

### PHASE 5: Persistence
- [ ] Save/load game state
- [ ] Time travel mechanics
- [ ] Multiple timelines

---

## DATA CONTRACTS

### Combat Receives from Strategic:
```typescript
interface MissionSetup {
  squadMembers: Character[];
  equipment: Equipment[];
  location: { sector: string, city?: string };
  objectives: Objective[];
  enemyForces: EnemyGroup[];
  timeOfDay: 'day' | 'night';
  weather: WeatherType;
  mapType: 'urban' | 'wilderness' | 'base_defense';
}
```

### Strategic Receives from Combat:
```typescript
interface CombatResult {
  victory: boolean;
  casualties: { characterId: string, status: 'dead' | 'injured' | 'ok' }[];
  injuries: { characterId: string, injuries: Injury[] }[];
  ammoUsed: { itemId: string, count: number }[];
  equipmentDamaged: { itemId: string, damage: number }[];
  lootGained: Item[];
  timeElapsed: number;
  experienceGained: { characterId: string, xp: number }[];
  capturedEnemies?: Character[];
}
```

---

## KEY FILES

| Purpose | File |
|---------|------|
| Game state | `stores/enhancedGameStore.ts` |
| Combat logic | `game/scenes/CombatScene.ts` |
| World map | `components/WorldMap/WorldMapGrid.tsx` |
| React-Phaser bridge | `game/EventBridge.ts` |
| Weapons (70+) | `data/weapons.ts` |
| Armor (50+) | `data/armor.ts` |
| Cities (1050) | `data/cities.ts` |
| Countries (168) | `data/countries.ts` |
| Range brackets | `data/equipmentTypes.ts` |
| Damage types | `data/damageSystem.ts` |
| Knockback | `data/knockbackSystem.ts` |
| Travel system | `data/travelSystem.ts` |
| **News templates** | `data/newsTemplates.ts` |

### News System Documentation

| Purpose | File |
|---------|------|
| Full specification | `docs/NEWS_SYSTEM_PROPOSAL.md` |
| Implementation guide | `docs/NEWS_SYSTEM_QUICK_START.md` |
| Architecture diagrams | `docs/NEWS_SYSTEM_DIAGRAM.md` |
| Summary overview | `NEWS_SYSTEM_SUMMARY.md` |

---

## JAGGED ALLIANCE 2 INSPIRATION

Things to emulate:
- Sector-based world map with travel time
- Free movement until combat
- Individual character personalities
- Merc hiring/contracts
- Training militia
- Mining for income
- Equipment degradation
- Day/night cycle affecting visibility
- Weather affecting combat
- Hospital/doctor healing

---

*This document should be updated as development progresses.*
