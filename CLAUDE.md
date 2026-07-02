# CLAUDE.md - SuperHero Tactics + Claude Flow

> **Master Documents**:
> - [GAME_PLAN.md](GAME_PLAN.md) - Strategic development roadmap and checklists
> - [V0_INTEGRATION_SPEC.md](V0_INTEGRATION_SPEC.md) - For V0 developers building strategic layer
> - [NEWS_SYSTEM_SUMMARY.md](NEWS_SYSTEM_SUMMARY.md) - News system design (passive/aggressive info delivery)

---

## Claude Flow Integration

This project uses **Claude Flow v2.7** for multi-agent orchestration. Use Claude Code's Task tool to spawn parallel agents for implementation work.

### Quick Commands
```bash
claude-flow swarm "implement feature" --claude    # Start agent swarm
claude-flow hive-mind spawn "task" --claude       # Spawn coordinated agents
claude-flow sparc tdd "feature"                   # TDD workflow
```

### Agent Execution Pattern
```javascript
// Use Claude Code's Task tool for parallel agent execution
Task("Research agent", "Analyze requirements...", "researcher")
Task("Coder agent", "Implement features...", "coder")
Task("Tester agent", "Create tests...", "tester")
```

---

## Project Overview

**SuperHero Tactics (SHT)** - A geopolitical turn-based tactical superhero strategy game.

**Core Loop**: Country Selection -> City Selection -> Base Setup -> Recruit Team -> Equip -> World Map -> Tactical Combat

---

## Three Game Layers

### 1. LAPTOP LAYER (Strategic UI)
The meta-game interface - like a phone/laptop the player uses.

| Feature | Status | Notes |
|---------|--------|-------|
| News/Web Browser | **WORKING** | `NewsBrowser.tsx` - full article system |
| Investigations | WORKING | `InvestigationCenter.tsx` - education bonuses wired |
| Hospital | **WORKING** | `HospitalScreen.tsx` - origin healing, transfers |
| Time Display | **WORKING** | `TimeDisplay.tsx` - day/night, speed controls |
| Education/Training | **WORKING** | `TrainingCenter.tsx` - base education bonus speeds training |
| Email System | **WORKING** | `emailSystem.ts` - briefings, faction reactions, bankruptcy warnings |
| Character Management | PARTIAL | CharacterScreen exists |
| Base Overview | **WORKING** | `BaseManager.tsx` - facilities, bonuses, safe houses panel |
| Chronos (time-travel save) | **WORKING** | `ChronosDevice.tsx` - anchors, sanity economy, rewind (hotkey T) |
| Standings & Relations | **WORKING** | `ReputationScreen.tsx` - factions, bounties, government relations (hotkey R) |

### 2. WORLD MAP LAYER (Strategic)
Grid-based global operations.

| Feature | Status | Location |
|---------|--------|----------|
| Sector Grid (20x10) | WORKING | `WorldMapGrid.tsx` |
| Squad Position Display | WORKING | Shows emoji on current sector |
| Deploy to Sector | WORKING | Click sector -> Deploy button |
| Travel Time Calc | WORKING | 6 hours per sector distance |
| Enter Combat | WORKING | Button appears when on_mission |
| 1050 Cities | WORKING | Displays in sector panels |
| 168 Countries | DATA ONLY | Not affecting gameplay yet |
| Time Progression | **WORKING** | `TimeDisplay.tsx`, `timeEventGenerator.ts` |
| Vehicles | DATA ONLY | 24 vehicles defined, not used |
| Militia/Territory | NOT DONE | Faction control |

**Files**:
- `WorldMap/WorldMapGrid.tsx` - Main world map component
- `stores/enhancedGameStore.ts` - Squad state (currentSector, squadStatus, etc.)
- `data/cities.ts` - 1050 cities with sector codes
- `data/countries.ts` - 168 countries with LSW policies
- `data/travelSystem.ts` - Travel time calculations
- `data/sectors.ts` - Sector definitions

### 3. TACTICAL LAYER (Combat)
Phaser-based turn-based tactical combat.

| Feature | Status | Location |
|---------|--------|----------|
| Turn-based Combat | WORKING | `CombatScene.ts` |
| AP/Time Units | WORKING | 4-8 AP per unit |
| Movement/Pathfinding | WORKING | A* pathfinding |
| Line of Sight | WORKING | Raycasting |
| Fog of War | WORKING | Per-unit visibility |
| Hit/Miss/Graze/Crit | WORKING | Dice rolls with modifiers |
| Weapon Range Brackets | WORKING | Per-weapon optimal ranges |
| Knockback | WORKING | Simple physics |
| Grenades | WORKING | Arc throwing, explosions |
| Powers (Beams, Teleport) | WORKING | Several implemented |
| Sound Effects | WORKING | 381 sounds via SoundManager |
| AI Combat | WORKING | AI vs AI mode |
| Grappling | PARTIAL | Basic grabs |
| RPG/Rockets | WORKING | Knockback 5, blast radius 2 |
| DR/Armor Stopping Power | WORKING | `armorIntegration.ts`, applied in damage calc |
| Shield Absorption | WORKING | Shields absorb before HP |
| Weapon Database (70+) | WORKING | `weaponIntegration.ts` bridges to weapons.ts |
| Free Movement | WORKING | Exploration phase before enemy contact |
| Character Stats in Combat | WORKING | MEL/INT/INS/CON imported to units |

**PARTIAL/NOT WIRED**:
- 20+ damage types -> status effects (types defined, effects partial)
- Advanced knockback physics (knockbackSystem.ts has calculations, basic version in use)
- Grappling system (basic grabs only)

**Files**:
- `game/scenes/CombatScene.ts` - Main combat logic (~5000 lines)
- `game/systems/SoundManager.ts` - 381 sounds
- `game/EventBridge.ts` - React <-> Phaser communication
- `data/weapons.ts` - 70+ weapons
- `data/armor.ts` - 50+ armor with stopping power
- `data/damageSystem.ts` - Damage types
- `data/knockbackSystem.ts` - Physics calculations

---

## COMBINED EFFECTS PHILOSOPHY (Core Design Principle)

**Single stats are WEAK. Combined stats create RICH gameplay.**

Every game system should combine 2-4 country/city stats to create emergent mechanics.

### Location Cascade System
```
COUNTRY stats -> set the rules, quality levels, prices, factions
    |
CITY stats -> tactical options, services, encounters, missions
    |
COMBINED effects -> emergent systems (cloning, black market, etc.)
```

**Files**:
- `data/locationEffects.ts` - Maps EVERY country stat to gameplay effect
- `data/combinedEffects.ts` - Combined stat systems
- `data/locationExamples.ts` - Demo functions

### Current Combined Systems (12 Total)

| System | Formula | Gameplay Effect |
|--------|---------|-----------------|
| **Cloning** | Healthcare + Science + GDP | Clone quality, wait time, memory transfer |
| **Black Market** | Corruption + Military - Law | Illegal equipment access, prices |
| **Surveillance** | Intel + Cyber + (100-MediaFreedom) | Detection speed, hacking difficulty |
| **Medical** | Healthcare + GDP + Lifestyle | Hospital quality, recovery time |
| **Research** | Science + Education + GDP + Cyber | Tech unlock speed, facility bonuses |
| **Organized Crime** | Corruption + (100-LawEnforcement) | Gang missions, underworld contacts |
| **Mercenaries** | Military + GDP + Corruption | Merc availability, quality, pricing |
| **Safe Houses** | Corruption + (100-Law) + (100-Intel) | Hideout security, tunnel access |
| **Border Control** | Military + Intel + Law | Visa difficulty, smuggling, escape routes |
| **Media** | MediaFreedom + Corruption + Cyber | Story planting, censorship, troll farms |
| **Politics** | GDP + Corruption + MediaFreedom | Lobbying, bribes, coup possibility |
| **Superhuman Affairs** | LSW + Intel + Military + Science | Registration, government stance, public opinion |

---

## Repository Structure

```
sht/
├── MVP/                          # Main application
│   ├── src/
│   │   ├── components/           # React UI components
│   │   │   ├── WorldMap/         # World map components
│   │   │   ├── CharacterScreen   # Character management
│   │   │   ├── CombatLab         # Phaser combat wrapper
│   │   │   └── ...
│   │   ├── data/                 # TypeScript data (SOURCE OF TRUTH)
│   │   │   ├── weapons.ts        # 70+ weapons with range brackets
│   │   │   ├── armor.ts          # 50+ armor with stopping power
│   │   │   ├── cities.ts         # 1050 cities
│   │   │   ├── countries.ts      # 168 countries
│   │   │   ├── newsTemplates.ts  # News generation templates
│   │   │   ├── equipmentTypes.ts # Weapon range brackets, armor types
│   │   │   └── ...
│   │   ├── game/
│   │   │   ├── scenes/CombatScene.ts  # Tactical combat
│   │   │   ├── systems/SoundManager.ts
│   │   │   └── EventBridge.ts
│   │   └── stores/
│   │       └── enhancedGameStore.ts   # Game state
├── docs/                         # Documentation
│   ├── NEWS_SYSTEM_PROPOSAL.md   # Full news system spec
│   └── NEWS_SYSTEM_QUICK_START.md
├── .claude/                      # Claude Flow configuration
│   ├── agents/                   # 64 specialized agents
│   ├── commands/                 # 94 command docs
│   └── skills/                   # 38 skills including SHT-specific
└── .swarm/                       # Claude Flow memory system
```

---

## Dev Commands

```bash
cd MVP
npm run dev      # Start dev server (usually port 3001)
npm run build    # Production build
```

**Keyboard Shortcuts**:
- F2: Dev mode panel (quick jump to any view)
- F4: Asset manager

---

## Claude Skills (12 SHT-specific + 26 Claude Flow)

### SHT Game Skills
- `sht-world-data` - Query 1050 cities, 168 countries
- `sht-strategic-layer` - Sector control, militia, travel
- `sht-combat-balance` - Weapon/armor balance analysis
- `sht-damage-effects` - Damage types, status effects
- `sht-character-builder` - Character creation, stats
- `sht-loadout-optimizer` - Equipment optimization
- `sht-martial-arts` - Hand-to-hand combat
- `sht-powers-abilities` - Superpowers design
- `sht-sound-catalog` - 381 sounds management
- `sht-phaser-patterns` - Phaser scene development
- `sht-investigation` - Investigation system
- `sht-merc-management` - Mercenary hiring/morale

---

## Implementation Priority

### Phase 1: News System (MVP) ✅ COMPLETE
- [x] Add news store to enhancedGameStore.ts
- [x] Create NewsBrowser component
- [x] Hook mission completion -> news generation
- [x] Implement fame/public opinion tracking

### Phase 2: Time & Economy ✅ COMPLETE
- [x] Time progression system (day/night, calendar) - `TimeDisplay.tsx`
- [x] Combat results -> strategic layer - `combatResultsHandler.ts` wired
- [x] Economy loop - weekly payday (`timeEventGenerator.ts`), daily merc wages (`mercenaryPool.ts`)

### Phase 3: Combat Polish ✅ COMPLETE
- [x] Wire DR/armor stopping power
- [x] Free movement before enemy contact
- [x] Import full weapon database (70+ weapons)
- [x] Shield absorption system
- [x] Character stats (MEL/INT/INS/CON) in combat

### Phase 4: Strategic Depth ✅ COMPLETE
- [x] Faction relations system - `factionSystem.ts`, `ReputationDisplay.tsx`, standings tracked per country
- [x] Multiple squads - `squadSystem.ts`, `createSquad()`, `deploySquadToSector()`, vehicle assignment
- [x] Base building - `baseSystem.ts`, `BaseManager.tsx`, 6 base types, 13 facility types, grid placement

### Phase 5: Polish & Integration ✅ COMPLETE
- [x] Wire faction standings to mission rewards/consequences - `missionStore.ts` emits `mission:completed`, `factionEventHandler.ts` applies standings + cascades + bounty at -25 + faction news
- [x] Add squad management UI in world map - create/rename/disband/assign, MBTI morale, vehicle assignment with pilot warnings, deploy (WorldMapGrid squads tab)
- [x] Wire base bonuses to game systems - healing (recovery multiplier), investigation (progress), education (training speed), crafting (maintenance discount); shown in Hospital/Training/Investigation screens
- [x] Territory control system - `initTerritorySystem()` in App, map overlay, combat shifts control, income+fame applied on payday

### Phase 6: Chronos & Living Economy ✅ COMPLETE (July 2026)
- [x] Chronos time-travel save - `chronoSystem.ts` + `ChronosDevice.tsx`: diegetic-only save/load, sanity economy (20/rewind, madness floor 20), destination horizon, 20-anchor localStorage ring buffer, anomaly news on jump. Nav: HUD button or `T`
- [x] Economy loop closed - weekly payday (deduped), country funding ($1k-$15k scaled by GDP/corruption), territory income, mission rewards credited to both ledgers, base/facility purchases cost money, bankruptcy check + warning email
- [x] Combined effects surfaced - all 12 systems reachable: Safe Houses (BaseManager), Border Control (CityActionsPanel/world map), Media Ops (NewsBrowser), Government Relations (Standings screen, `R`), Clone Services (Hospital), plus the 3 already live
- [x] Stats wired - morale accuracy/damage mods in combat core, INT modifies investigation progress; full audit in `docs/STAT_AUDIT.md`
- [x] Balance battery - `npm run test:battery` (mechanics/integration/belt/grenade, headless via tsx); results in `MVP/BALANCE_NOTES.md`

---

*Updated: July 2026 - Phases 1-6 complete. GAME_COMPLETION_CRITERIA.md APPROVED; game is feature-complete for testing.*
