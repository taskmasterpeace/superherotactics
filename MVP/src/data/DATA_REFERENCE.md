# SHT Data System Reference

> **IMPORTANT**: This document is the source of truth for data organization.
> The TypeScript files in this folder are the ACTIVE data - NOT the archived CSVs.

## Quick Reference

| Domain | Primary File | What's In It |
|--------|--------------|--------------|
| **Equipment Hub** | `index.ts` | Central exports for all equipment |
| **Weapons** | `weapons.ts` | 50+ weapons (melee, ranged, energy, thrown, special) |
| **Armor** | `armor.ts` | 40+ armor pieces, materials, components |
| **Gadgets** | `gadgets.ts` | Gadgets, vehicles (24), drones (8), weapon mods |
| **Shields** | `shieldItems.ts` | Combat-ready shield equipment |
| **Grenades** | `grenadeItems.ts`, `explosionSystem.ts` | Grenade items + explosion physics |
| **Combat** | `damageSystem.ts` | Damage types, calculations |
| **Combat** | `knockbackSystem.ts` | Knockback physics (imports strengthSystem) |
| **Combat** | `explosionSystem.ts` | Explosion mechanics (imports knockbackSystem) |
| **Combat** | `strengthSystem.ts` | STR-based weight/lifting mechanics |
| **Martial Arts** | `martial-arts.json` | 5 styles, 40+ techniques, belt progression |
| **Characters** | `recruitableCharacters.ts` | 30+ Marvel/DC-inspired heroes |
| **World** | `worldData.ts` | Countries, cities, flags, helper functions |
| **World** | `countries.ts` | 168 countries (full data) |
| **World** | `countries_part1/2/3.ts` | Country data split for manageability |
| **World** | `cities.ts` | 1050 cities (complete database) |
| **Inventory** | `inventoryTypes.ts` | Grid-based inventory system types |
| **Inventory** | `itemDatabase.ts` | ALL_ITEMS, categorized item access |
| **Types** | `equipmentTypes.ts` | TypeScript interfaces for all equipment |

## Import Hierarchy

```
index.ts (MAIN HUB)
├── equipmentTypes.ts (types)
├── weapons.ts
├── armor.ts
├── gadgets.ts (includes DRONES, VEHICLES)
└── shieldItems.ts

explosionSystem.ts
└── knockbackSystem.ts
    └── strengthSystem.ts

inventoryTypes.ts
├── itemDatabase.ts
└── gameDataSystem.ts

worldData.ts
├── countries.ts
│   └── countries_part1/2/3.ts
└── cities.ts
```

## Domain Details

### Equipment System (via index.ts)
- **Use `index.ts` for all equipment access** - it re-exports everything
- Weapons: `getWeaponById()`, `getWeaponsByCategory()`, `calculateDPS()`
- Armor: `getArmorById()`, `calculateEffectiveProtection()`
- Gadgets: `getGadgetById()`, `getDroneById()`, `getVehicleById()`
- Unified: `getAllEquipmentEntries()`, `searchEquipment()`

### Combat System
- **damageSystem.ts**: Damage types (PHYSICAL, ENERGY, FIRE, etc.), damage calculations
- **knockbackSystem.ts**: Physics-based knockback, direction calculations
- **explosionSystem.ts**: Grenade types (FRAG, CONCUSSION, FLASHBANG, etc.), blast radius, fragment spread
- **strengthSystem.ts**: Weight calculations, lifting capacity

### World Data
- **worldData.ts**: Main interface - `COUNTRIES`, `CITIES`, `FLAGS`
- Helper functions: `getCountryByName()`, `getCitiesByCountry()`, `getEducationLevel()`
- **cities.ts**: Full 1050 cities with culture codes, types, crime indices
- **countries.ts**: 168 countries with complete attributes

### Character System
- **recruitableCharacters.ts**: Pre-built characters with stats, powers, backgrounds
- Imports worldData for nationality/origin

### Inventory System
- **inventoryTypes.ts**: Grid-based inventory (Resident Evil style)
- **itemDatabase.ts**: Categorized items (GRENADES, PISTOLS, GADGETS, ALL_ITEMS)

## What's NOT Here (Archived)

CSV source files have been moved to `/docs/csv-source-data/`. They are reference only - the TypeScript files are the active data.

## Adding New Data

1. **New weapon**: Add to appropriate category in `weapons.ts`
2. **New armor**: Add to appropriate category in `armor.ts`
3. **New gadget/drone/vehicle**: Add to `gadgets.ts`
4. **New country/city**: Add to `countries.ts` or `cities.ts`
5. **New character**: Add to `recruitableCharacters.ts`

All equipment added to the main files will automatically appear in:
- Encyclopedia (via `getAllEquipmentEntries()`)
- Balance Analyzer (via `getEquipmentStats()`)
- Loadout Editor (via item database)
