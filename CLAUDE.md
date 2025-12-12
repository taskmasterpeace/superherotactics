# CLAUDE.md

> **Master Documents**:
> - [GAME_PLAN.md](GAME_PLAN.md) - Strategic development roadmap and checklists
> - [V0_INTEGRATION_SPEC.md](V0_INTEGRATION_SPEC.md) - For V0 developers building strategic layer
> - [NEWS_SYSTEM_SUMMARY.md](NEWS_SYSTEM_SUMMARY.md) - **NEW**: News system design (passive/aggressive info delivery)

---

## Project Overview

SuperHero Tactics (SHT) - A geopolitical turn-based tactical superhero strategy game.

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

Every game system should combine 2-4 country/city stats to create emergent mechanics. This makes each location feel unique and creates natural gameplay variety.

### Location Cascade System
```
COUNTRY stats → set the rules, quality levels, prices, factions
    ↓
CITY stats → tactical options, services, encounters, missions
    ↓
COMBINED effects → emergent systems (cloning, black market, etc.)
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

### Design Rules

1. **Every stat must have gameplay meaning** - No decorative data
2. **2-4 stats combine** - Creates natural variety (168 countries = 168 unique experiences)
3. **Formulas should be intuitive** - Player can reason about them
4. **Systems generate content** - Ads, news, missions, encounters based on combined effects
5. **High/low extremes create special cases** - Science 90+ enables superhuman cloning

### Example: Cloning in USA vs Somalia

| Factor | USA | Somalia |
|--------|-----|---------|
| Healthcare | 90 | 15 |
| Science | 85 | 10 |
| GDP | 95 | 5 |
| **Clone Quality** | 87.5% | 12.5% |
| **Base Cost** | $95,000 | $2,500 |
| **Wait Time** | 15 days | 52 days |
| **Memory Transfer** | YES | NO |
| **Can Clone Supers** | YES | NO |
| **Defect Chance** | 3% | 45% |

Same mechanic, completely different experience.

### Adding New Combined Systems

When creating new systems, follow this pattern:
```typescript
export function calculateNewSystem(country: Country): NewSystem {
  // 1. Get raw stats
  const stat1 = country.statA;
  const stat2 = country.statB;

  // 2. Combine with intuitive formula
  const quality = (stat1 + stat2) / 2;
  const cost = basePrice * (gdpFactor) * (1.5 - quality/200);

  // 3. Create thresholds for special abilities
  const specialAbility = stat1 >= 80 && stat2 >= 70;

  return { quality, cost, specialAbility };
}
```

---

## BASE BUILDING SYSTEM (PLANNED)

Inspired by XCOM base management:

**Concept**:
- Grid-based underground/building base layout
- Rooms: Barracks, Armory, Med Bay, Research Lab, Training Room, Prison, etc.
- Construction takes time and money
- Can be raided by enemies
- Hallways connecting rooms (for tactical raids)

**Research Needed**:
- Phaser tilemap generation for base layout
- Procedural room placement
- Integration with world map (base location = sector)

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
│   │   │   ├── equipmentTypes.ts # Weapon range brackets, armor types
│   │   │   └── ...
│   │   ├── game/
│   │   │   ├── scenes/CombatScene.ts  # Tactical combat
│   │   │   ├── systems/SoundManager.ts
│   │   │   └── EventBridge.ts
│   │   └── stores/
│   │       └── enhancedGameStore.ts   # Game state
├── docs/                         # Documentation
└── .claude/skills/               # 12 Claude Code skills
```

---

## Combat Balance Targets

| Weapon | Shots to Kill (Unarmored) |
|--------|---------------------------|
| Pistol | 1.5 shots |
| Rifle | 1 shot |
| Shotgun (close) | 1 shot |
| SMG | 2-3 shots |
| Sniper | 1 shot |

**Range Bracket System**:
- Each weapon has: pointBlank, short, optimal, long, extreme, max ranges
- Hit modifiers apply per bracket (-30% to +25%)
- Snipers get PENALTY at point blank (-15%)
- Shotguns get BONUS at point blank (+25%)

---

## Event Bridge (React <-> Phaser)

```typescript
// Deploy squad to combat
EventBridge.emit('deploy-to-combat', { squad, mission });

// Combat complete
EventBridge.on('combat-complete', (result) => { ... });
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

## Claude Skills (12 available)

Use `Skill` tool to invoke:
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

## Current Session Progress

**COMPLETED**:
- [x] Weapon range bracket system (per-weapon optimal ranges)
- [x] RPG weapon with knockback and blast radius
- [x] World map squad deployment
- [x] Travel time calculation
- [x] Enter Combat button from world map
- [x] Squad status tracking (idle/traveling/on_mission/in_combat)
- [x] Hit preview shows range bracket name
- [x] Location Effects System (country→city cascading)
- [x] Combined Effects Philosophy (6+ systems)
- [x] 8 System Proposals (see SYSTEM_PROPOSALS.md)

**IN PROGRESS**:
- [ ] Economy Loop implementation
- [ ] News System implementation
- [ ] Faction Relations implementation
- [ ] Free movement mode before enemy contact
- [ ] Wire DR/armor stopping power in combat

---

*Updated: December 2024*
