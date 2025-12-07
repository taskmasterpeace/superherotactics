# SHT Game Mechanics Guides

## Overview

This folder contains detailed, easy-to-understand guides for each game system in SuperHero Tactics. Each guide explains the mechanics, provides examples, and includes quick reference tables.

---

## Available Guides

### Combat Systems

| Guide | Description | Related CSVs |
|-------|-------------|--------------|
| [Penetration_and_Continuation_System.md](Penetration_and_Continuation_System.md) | How attacks pass through walls, cover, and multiple targets | Penetration_Continuation_System.csv |
| [Injury_System.md](Injury_System.md) | Critical injuries, permanent disabilities, and recovery | Injury_System.csv |
| [Combat_Quick_Reference.md](Combat_Quick_Reference.md) | Fast lookup for combat resolution | Combat_System_Master_Reference.csv |

### Character Systems

| Guide | Description | Related CSVs |
|-------|-------------|--------------|
| [Character_Schema_Complete.md](Character_Schema_Complete.md) | **MASTER** - All 94 character fields defined | Character_Template.csv, Origin_Types.csv |
| [Character_Creator_Spec.md](Character_Creator_Spec.md) | UI specification for character creation | N/A |
| [Wrestling_and_Grappling.md](Wrestling_and_Grappling.md) | Complete grappling, holds, and martial arts | Wrestling_Martial_Arts_Complete.csv |
| [Combat_Stances_and_Modes.md](Combat_Stances_and_Modes.md) | Toggle modes and persistent stances | Combat_Modes_Stances.csv |

### World Map Systems

| Guide | Description | Related CSVs |
|-------|-------------|--------------|
| [Investigation_System.md](Investigation_System.md) | Complete investigation mechanics, leads, resolution | Investigation_Templates.csv, City_Type_Effects.csv |
| [World_Map_System.md](World_Map_System.md) | **NEW** - Hex grid strategic layer, squad movement, travel | World_Sectors.csv |

### Progression Systems

| Guide | Description | Related CSVs |
|-------|-------------|--------------|
| [Education_Career_System.md](Education_Career_System.md) | Education levels, careers, research access, skill bonuses | Education_Career_Complete.csv |
| [Research_System.md](Research_System.md) | Facilities, research projects, team composition, timelines | Research_Projects.csv |

### Powers & Equipment

| Guide | Description | Related CSVs |
|-------|-------------|--------------|
| [Armor_System.md](Armor_System.md) | Armor types, custom building, materials, research | Armor_Complete.csv |
| [Tech_Equipment_System.md](Tech_Equipment_System.md) | **MASTER** - Gadgets, vehicles, drones, loadouts, resources | Tech_Gadgets_Complete.csv, Vehicles_Complete.csv, Weapons_Complete.csv |
| [Gadget_Operation_System.md](Gadget_Operation_System.md) | **NEW** - How gadgets work: toggles, sliders, dropdowns, deploys | Tech_Gadgets_Complete.csv |
| [Power_Recommendations.md](Power_Recommendations.md) | Power catalog with 28 must-add powers | Power_Attack_Stats.csv |
| [Resource_Display_Proposal.md](Resource_Display_Proposal.md) | Ammo, charges, and resource UI | Weapons_Complete.csv |

### Environmental Systems

| Guide | Description | Related CSVs |
|-------|-------------|--------------|
| [Sound_Detection.md](Sound_Detection.md) | How sound works, hearing, stealth | Sound_Detection_System.csv |
| [Doors_and_Environment.md](Doors_and_Environment.md) | Doors, windows, furniture, cover | Door_Interaction_System.csv |

### Core Mechanics

| Guide | Description | Related CSVs |
|-------|-------------|--------------|
| [Universal_Table.md](Universal_Table.md) | The d100 resolution system | Advanced_Universal_Table.csv |
| [Lifting_and_Throwing.md](Lifting_and_Throwing.md) | STR-based lifting, throwing objects | Lifting_Throwing_Projectile_System.csv |
| [Balance_Analysis.md](Balance_Analysis.md) | Weapon vs armor vs HP analysis | Weapons_Complete.csv, Armor_Equipment.csv |

### Development Resources

| Guide | Description | Related Files |
|-------|-------------|---------------|
| [Combat_Engine_Proposal.md](Combat_Engine_Proposal.md) | Engine choice, inventory UI, throwing, gadgets | N/A |
| [Combat_UI_Spec.md](Combat_UI_Spec.md) | **NEW** - Front-end spec: all buttons, panels, hotkeys, components | Gadget_Operation_System.md |
| [UI_Requirements_Document.md](UI_Requirements_Document.md) | UI mockup specifications | Complete_Combat_Simulator.html |

---

## How to Use These Guides

1. **Learning a System**: Read the full guide for comprehensive understanding
2. **Quick Reference**: Jump to the tables at the end of each guide
3. **Implementation**: Use the related CSV for exact values
4. **Examples**: Each guide includes worked examples

---

## Guide Status

| Guide | Status | Last Updated |
|-------|--------|--------------|
| **Character_Schema_Complete** | **Complete** | 2024-12-05 |
| Character_Creator_Spec | Complete | 2024-12-05 |
| Power_Recommendations | Complete | 2024-12-05 |
| Resource_Display_Proposal | Complete | 2024-12-05 |
| Penetration_and_Continuation_System | Complete | 2024-12-04 |
| Injury_System | Complete | 2024-12-04 |
| Balance_Analysis | Complete | 2024-12-04 |
| UI_Requirements_Document | Complete | 2024-12-04 |
| **Investigation_System** | **Complete** | 2024-12-05 |
| **Armor_System** | **Complete** | 2024-12-05 |
| **Education_Career_System** | **Complete** | 2024-12-05 |
| **Research_System** | **Complete** | 2024-12-05 |
| **Tech_Equipment_System** | **Complete** | 2024-12-05 |
| **Combat_Engine_Proposal** | **Complete** | 2024-12-05 |
| **Gadget_Operation_System** | **Complete** | 2024-12-05 |
| **Combat_UI_Spec** | **Complete** | 2024-12-05 |
| **World_Map_System** | **Complete** | 2024-12-05 |
| Combat_Quick_Reference | Planned | - |
| Wrestling_and_Grappling | Planned | - |
| Combat_Stances_and_Modes | Planned | - |
| Sound_Detection | Planned | - |
| Doors_and_Environment | Planned | - |
| Universal_Table | Planned | - |
| Lifting_and_Throwing | Planned | - |

---

## Related Files

The Guides folder works alongside the CSV specification files in the parent directory:

```
Game_Mechanics_Spec/
├── Guides/                          <- Easy-to-read documentation
│   ├── INDEX.md                     <- This file
│   ├── Penetration_and_Continuation_System.md
│   └── [other guides]
├── Penetration_Continuation_System.csv   <- Data tables
├── Combat_System_Master_Reference.csv
├── Wrestling_Martial_Arts_Complete.csv
├── Combat_Modes_Stances.csv
├── Sound_Detection_System.csv
├── Door_Interaction_System.csv
├── Advanced_Universal_Table.csv
├── Lifting_Throwing_Projectile_System.csv
└── [simulators and other files]
```

---

## Contributing

When adding new guides:
1. Create both a .md guide (in Guides/) and .csv spec (in parent)
2. Use consistent formatting with examples
3. Include quick reference tables
4. Update this INDEX.md
