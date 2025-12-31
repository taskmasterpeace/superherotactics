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
| News/Web Browser | **DESIGNED** | **See NEWS_SYSTEM_SUMMARY.md** |
| Investigations | STUB | UI exists, no gameplay |
| Hospital | NOT DONE | Injury recovery tracking |
| Education/Training | NOT DONE | Skill learning |
| Email System | NOT DONE | Mission briefings |
| Character Management | PARTIAL | CharacterScreen exists |
| Base Overview | NOT DONE | See Base Building below |

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
| Time Progression | NOT DONE | Need day/night, calendar |
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

**NOT WIRED YET**:
- DR (armor stopping power) - defined in armor.ts
- Shield absorption - defined but not applied
- 70+ weapons in weapons.ts (CombatScene has 13 internal)
- 20+ damage types -> status effects
- Advanced knockback physics (knockbackSystem.ts)
- Character stats MEL/INT/INS/CON in combat
- Free movement before enemy spotted

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

### Phase 1: News System (MVP)
- [ ] Add news store to enhancedGameStore.ts
- [ ] Create NewsBrowser component
- [ ] Hook mission completion -> news generation
- [ ] Implement fame/public opinion tracking

### Phase 2: Time & Economy
- [ ] Time progression system (day/night, calendar)
- [ ] Economy loop (income, expenses, budget)
- [ ] Combat results -> strategic layer

### Phase 3: Combat Polish
- [ ] Wire DR/armor stopping power
- [ ] Free movement before enemy contact
- [ ] Import full weapon database (70+ weapons)

### Phase 4: Strategic Depth
- [ ] Faction relations system
- [ ] Multiple squads
- [ ] Base building

---

*Updated: December 2024 - Claude Flow v2.7 integrated*
