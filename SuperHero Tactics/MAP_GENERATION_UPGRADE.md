# Combat Map Generation Upgrade

This document provides the complete upgrade to create larger, more tactically interesting combat maps for SuperHero Tactics.

## Overview

The current combat system uses a simple 15x15 map with basic room structure. This upgrade:
- Expands the map to 30x30 for more tactical space
- Adds 3 different map templates that randomly select each game
- Includes varied terrain (grass, concrete, water)
- Provides cover positions, choke points, and multiple entry points
- Updates spawn positions to maximize tactical engagement

## File to Modify

**File:** `C:\git\sht\MVP\src\game\scenes\CombatScene.ts`

---

## Step 1: Update Map Dimensions

**Location:** Lines 615-616

**OLD CODE:**
```typescript
private mapWidth: number = 15;
private mapHeight: number = 15;
```

**NEW CODE:**
```typescript
private mapWidth: number = 30;
private mapHeight: number = 30;
```

---

## Step 2: Replace generateTestMap() Method

**Location:** Around line 1024

**OLD CODE:**
```typescript
private generateTestMap(): void {
  // Initialize empty map
  for (let y = 0; y < this.mapHeight; y++) {
    this.tiles[y] = [];
    for (let x = 0; x < this.mapWidth; x++) {
      this.tiles[y][x] = {
        x,
        y,
        terrain: 'FLOOR',
      };
    }
  }

  // Add some walls (simple room structure)
  // Room 1
  for (let x = 5; x <= 9; x++) {
    this.setTerrain(x, 4, 'WALL');
    this.setTerrain(x, 8, 'WALL');
  }
  for (let y = 4; y <= 8; y++) {
    this.setTerrain(5, y, 'WALL');
    this.setTerrain(9, y, 'WALL');
  }
  this.setTerrain(7, 4, 'DOOR_OPEN');
  this.setTerrain(7, 8, 'DOOR_OPEN');

  // Add cover positions
  this.setTerrain(2, 7, 'LOW_WALL');
  this.setTerrain(3, 7, 'LOW_WALL');
  this.setTerrain(11, 6, 'LOW_WALL');
  this.setTerrain(12, 6, 'LOW_WALL');
  this.setTerrain(7, 11, 'LOW_WALL');
  this.setTerrain(7, 12, 'LOW_WALL');

  // Render tiles
  this.renderMap();
}
```

**NEW CODE:**
```typescript
private generateTestMap(): void {
  // Randomly select a map template
  const mapTemplates = [
    this.generateUrbanWarehouseMap.bind(this),
    this.generateMilitaryCompoundMap.bind(this),
    this.generateCityStreetsMap.bind(this),
  ];

  const selectedTemplate = mapTemplates[Math.floor(Math.random() * mapTemplates.length)];
  selectedTemplate();

  // Render tiles
  this.renderMap();
}
```

---

## Step 3: Add Map Template Methods

**Location:** Add these three methods immediately after `generateTestMap()`

### Map Template 1: Urban Warehouse

```typescript
/**
 * Urban Warehouse Map - Large central warehouse with exterior grounds
 * Features:
 * - Main warehouse building with pillars for cover
 * - Office room in corner
 * - Multiple entry points (doors)
 * - Loading area with concrete
 * - Grass exterior with scattered cover
 * - Water hazard (drainage)
 */
private generateUrbanWarehouseMap(): void {
  // Initialize with grass exterior
  for (let y = 0; y < this.mapHeight; y++) {
    this.tiles[y] = [];
    for (let x = 0; x < this.mapWidth; x++) {
      this.tiles[y][x] = {
        x,
        y,
        terrain: 'GRASS',
      };
    }
  }

  // Main warehouse building (large central structure)
  for (let x = 8; x <= 22; x++) {
    for (let y = 10; y <= 20; y++) {
      this.setTerrain(x, y, 'CONCRETE');
    }
  }

  // Warehouse walls
  for (let x = 8; x <= 22; x++) {
    this.setTerrain(x, 10, 'WALL');
    this.setTerrain(x, 20, 'WALL');
  }
  for (let y = 10; y <= 20; y++) {
    this.setTerrain(8, y, 'WALL');
    this.setTerrain(22, y, 'WALL');
  }

  // Warehouse doors (multiple entry points)
  this.setTerrain(15, 10, 'DOOR_CLOSED');
  this.setTerrain(22, 15, 'DOOR_OPEN');
  this.setTerrain(10, 20, 'DOOR_CLOSED');

  // Interior pillars (cover)
  this.setTerrain(12, 13, 'WALL');
  this.setTerrain(12, 17, 'WALL');
  this.setTerrain(18, 13, 'WALL');
  this.setTerrain(18, 17, 'WALL');

  // Small office room in corner
  for (let x = 9; x <= 12; x++) {
    for (let y = 11; y <= 14; y++) {
      this.setTerrain(x, y, 'FLOOR');
    }
  }
  for (let x = 9; x <= 12; x++) {
    this.setTerrain(x, 11, 'LOW_WALL');
    this.setTerrain(x, 14, 'LOW_WALL');
  }
  for (let y = 11; y <= 14; y++) {
    this.setTerrain(9, y, 'LOW_WALL');
    this.setTerrain(12, y, 'LOW_WALL');
  }
  this.setTerrain(12, 12, 'DOOR_OPEN');

  // External cover positions
  for (let x = 3; x <= 5; x++) {
    this.setTerrain(x, 15, 'LOW_WALL');
  }
  for (let x = 25; x <= 27; x++) {
    this.setTerrain(x, 15, 'LOW_WALL');
  }

  // Concrete loading area
  for (let x = 23; x <= 27; x++) {
    for (let y = 13; y <= 17; y++) {
      this.setTerrain(x, y, 'CONCRETE');
    }
  }

  // Scattered cover in open areas
  this.setTerrain(5, 8, 'LOW_WALL');
  this.setTerrain(6, 8, 'LOW_WALL');
  this.setTerrain(24, 22, 'LOW_WALL');
  this.setTerrain(25, 22, 'LOW_WALL');

  // Water hazard (drainage)
  for (let y = 5; y <= 7; y++) {
    this.setTerrain(15, y, 'WATER');
  }
}
```

### Map Template 2: Military Compound

```typescript
/**
 * Military Compound Map - Fortified compound with buildings and defensive positions
 * Features:
 * - Outer perimeter wall with gates
 * - Main building (northeast)
 * - Barracks (southwest)
 * - Central courtyard with grass
 * - Defensive positions (sandbags/low walls)
 * - Guard towers at corners
 * - Corridor system connecting areas
 */
private generateMilitaryCompoundMap(): void {
  // Initialize with concrete base
  for (let y = 0; y < this.mapHeight; y++) {
    this.tiles[y] = [];
    for (let x = 0; x < this.mapWidth; x++) {
      this.tiles[y][x] = {
        x,
        y,
        terrain: 'CONCRETE',
      };
    }
  }

  // Outer perimeter wall
  for (let x = 3; x <= 26; x++) {
    this.setTerrain(x, 3, 'WALL');
    this.setTerrain(x, 26, 'WALL');
  }
  for (let y = 3; y <= 26; y++) {
    this.setTerrain(3, y, 'WALL');
    this.setTerrain(26, y, 'WALL');
  }

  // Gate entrances
  this.setTerrain(15, 3, 'DOOR_OPEN');
  this.setTerrain(15, 26, 'DOOR_OPEN');
  this.setTerrain(3, 15, 'DOOR_OPEN');

  // Main building (northeast)
  for (let x = 17; x <= 24; x++) {
    for (let y = 5; y <= 12; y++) {
      this.setTerrain(x, y, 'FLOOR');
    }
  }
  for (let x = 17; x <= 24; x++) {
    this.setTerrain(x, 5, 'WALL');
    this.setTerrain(x, 12, 'WALL');
  }
  for (let y = 5; y <= 12; y++) {
    this.setTerrain(17, y, 'WALL');
    this.setTerrain(24, y, 'WALL');
  }
  this.setTerrain(17, 8, 'DOOR_CLOSED');

  // Barracks (southwest)
  for (let x = 5; x <= 12; x++) {
    for (let y = 17; y <= 24; y++) {
      this.setTerrain(x, y, 'FLOOR');
    }
  }
  for (let x = 5; x <= 12; x++) {
    this.setTerrain(x, 17, 'WALL');
    this.setTerrain(x, 24, 'WALL');
  }
  for (let y = 17; y <= 24; y++) {
    this.setTerrain(5, y, 'WALL');
    this.setTerrain(12, y, 'WALL');
  }
  this.setTerrain(8, 17, 'DOOR_CLOSED');
  this.setTerrain(12, 20, 'DOOR_CLOSED');

  // Central courtyard with grass
  for (let x = 13; x <= 16; x++) {
    for (let y = 13; y <= 16; y++) {
      this.setTerrain(x, y, 'GRASS');
    }
  }

  // Defensive positions (sandbags)
  this.setTerrain(7, 7, 'LOW_WALL');
  this.setTerrain(8, 7, 'LOW_WALL');
  this.setTerrain(22, 22, 'LOW_WALL');
  this.setTerrain(22, 23, 'LOW_WALL');

  // Central cover
  this.setTerrain(14, 9, 'LOW_WALL');
  this.setTerrain(15, 9, 'LOW_WALL');
  this.setTerrain(14, 20, 'LOW_WALL');
  this.setTerrain(15, 20, 'LOW_WALL');

  // Guard towers (elevated positions)
  this.setTerrain(5, 5, 'WALL');
  this.setTerrain(24, 5, 'WALL');
  this.setTerrain(5, 24, 'WALL');
  this.setTerrain(24, 24, 'WALL');

  // Corridor system
  for (let x = 13; x <= 16; x++) {
    this.setTerrain(x, 8, 'CONCRETE');
    this.setTerrain(x, 21, 'CONCRETE');
  }
  for (let y = 13; y <= 16; y++) {
    this.setTerrain(8, y, 'CONCRETE');
    this.setTerrain(21, y, 'CONCRETE');
  }
}
```

### Map Template 3: City Streets

```typescript
/**
 * City Streets Map - Urban environment with intersecting streets and buildings
 * Features:
 * - Main street (horizontal) and cross street (vertical)
 * - Four buildings, one in each quadrant
 * - Interior rooms with dividers
 * - Street cover (parked cars, barriers)
 * - Alleyway cover positions
 * - Water feature (fountain in intersection)
 * - Multiple entry points and tactical choke points
 */
private generateCityStreetsMap(): void {
  // Initialize with grass (vacant lots)
  for (let y = 0; y < this.mapHeight; y++) {
    this.tiles[y] = [];
    for (let x = 0; x < this.mapWidth; x++) {
      this.tiles[y][x] = {
        x,
        y,
        terrain: 'GRASS',
      };
    }
  }

  // Main street (horizontal)
  for (let x = 0; x < this.mapWidth; x++) {
    for (let y = 13; y <= 16; y++) {
      this.setTerrain(x, y, 'CONCRETE');
    }
  }

  // Cross street (vertical)
  for (let y = 0; y < this.mapHeight; y++) {
    for (let x = 13; x <= 16; x++) {
      this.setTerrain(x, y, 'CONCRETE');
    }
  }

  // Building 1 (northwest corner)
  for (let x = 3; x <= 11; x++) {
    for (let y = 3; y <= 11; y++) {
      this.setTerrain(x, y, 'FLOOR');
    }
  }
  for (let x = 3; x <= 11; x++) {
    this.setTerrain(x, 3, 'WALL');
    this.setTerrain(x, 11, 'WALL');
  }
  for (let y = 3; y <= 11; y++) {
    this.setTerrain(3, y, 'WALL');
    this.setTerrain(11, y, 'WALL');
  }
  this.setTerrain(7, 11, 'DOOR_OPEN');

  // Interior rooms
  for (let x = 4; x <= 6; x++) {
    this.setTerrain(x, 7, 'LOW_WALL');
  }
  this.setTerrain(5, 7, 'DOOR_OPEN');

  // Building 2 (northeast corner)
  for (let x = 18; x <= 26; x++) {
    for (let y = 3; y <= 11; y++) {
      this.setTerrain(x, y, 'FLOOR');
    }
  }
  for (let x = 18; x <= 26; x++) {
    this.setTerrain(x, 3, 'WALL');
    this.setTerrain(x, 11, 'WALL');
  }
  for (let y = 3; y <= 11; y++) {
    this.setTerrain(18, y, 'WALL');
    this.setTerrain(26, y, 'WALL');
  }
  this.setTerrain(22, 11, 'DOOR_CLOSED');

  // Building 3 (southwest corner)
  for (let x = 3; x <= 11; x++) {
    for (let y = 18; y <= 26; y++) {
      this.setTerrain(x, y, 'FLOOR');
    }
  }
  for (let x = 3; x <= 11; x++) {
    this.setTerrain(x, 18, 'WALL');
    this.setTerrain(x, 26, 'WALL');
  }
  for (let y = 18; y <= 26; y++) {
    this.setTerrain(3, y, 'WALL');
    this.setTerrain(11, y, 'WALL');
  }
  this.setTerrain(7, 18, 'DOOR_CLOSED');

  // Building 4 (southeast corner) - multi-room
  for (let x = 18; x <= 26; x++) {
    for (let y = 18; y <= 26; y++) {
      this.setTerrain(x, y, 'FLOOR');
    }
  }
  for (let x = 18; x <= 26; x++) {
    this.setTerrain(x, 18, 'WALL');
    this.setTerrain(x, 26, 'WALL');
  }
  for (let y = 18; y <= 26; y++) {
    this.setTerrain(18, y, 'WALL');
    this.setTerrain(26, y, 'WALL');
  }
  this.setTerrain(22, 18, 'DOOR_OPEN');

  // Interior dividers
  for (let y = 19; y <= 25; y++) {
    this.setTerrain(22, y, 'LOW_WALL');
  }
  this.setTerrain(22, 22, 'DOOR_OPEN');

  // Street cover (parked cars, barriers)
  this.setTerrain(2, 14, 'LOW_WALL');
  this.setTerrain(2, 15, 'LOW_WALL');
  this.setTerrain(27, 14, 'LOW_WALL');
  this.setTerrain(27, 15, 'LOW_WALL');
  this.setTerrain(14, 2, 'LOW_WALL');
  this.setTerrain(15, 2, 'LOW_WALL');
  this.setTerrain(14, 27, 'LOW_WALL');
  this.setTerrain(15, 27, 'LOW_WALL');

  // Alleyway cover
  this.setTerrain(12, 7, 'LOW_WALL');
  this.setTerrain(17, 7, 'LOW_WALL');
  this.setTerrain(12, 22, 'LOW_WALL');
  this.setTerrain(17, 22, 'LOW_WALL');

  // Water feature (fountain in intersection)
  this.setTerrain(14, 14, 'WATER');
  this.setTerrain(15, 14, 'WATER');
  this.setTerrain(14, 15, 'WATER');
  this.setTerrain(15, 15, 'WATER');
}
```

---

## Step 4: Update Spawn Positions (Optional but Recommended)

**Location:** In `spawnTestUnits()` method, around lines 1214-1450

The current spawn positions are too close together for the larger map. Consider updating them to create more separation:

### Current Spawn Positions:
- Blue team: x=1-3, y=5-9 (clustered on left)
- Red team: x=11-13, y=5-9 (clustered on right)

### Recommended New Positions:

**Blue Team (West Side):**
```typescript
// Alpha
position: { x: 2, y: 10 }

// Sniper
position: { x: 2, y: 20 }

// Tech
position: { x: 1, y: 15 }

// Teleporter
position: { x: 3, y: 12 }

// Gatekeeper
position: { x: 1, y: 18 }

// Medic
position: { x: 1, y: 22 }
```

**Red Team (East Side):**
```typescript
// Hostile1
position: { x: 27, y: 10 }

// Heavy
position: { x: 28, y: 15 }

// Rocket
position: { x: 27, y: 20 }

// Pyro
position: { x: 26, y: 12 }

// Controller
position: { x: 26, y: 18 }
```

This spreads teams vertically and creates ~25 tiles of separation horizontally, forcing tactical movement and positioning.

---

## Tactical Features Summary

### Urban Warehouse Map
- **Choke Points:** 3 doors (2 closed, 1 open)
- **Cover:** 4 interior pillars, external low walls, office room
- **High Ground:** None (could add later with elevation system)
- **Hazards:** Water drainage (3 tiles)
- **Terrain Mix:** Grass exterior, concrete interior

### Military Compound Map
- **Choke Points:** 3 gates, multiple building doors
- **Cover:** Guard towers, sandbag positions, building interiors
- **High Ground:** 4 corner guard towers
- **Hazards:** Perimeter walls create kill zones
- **Terrain Mix:** Concrete base, grass courtyard, interior floors

### City Streets Map
- **Choke Points:** Building entrances, street intersections
- **Cover:** Street barriers, parked cars, alleyway positions
- **High Ground:** None (buildings are tactical positions)
- **Hazards:** Fountain water feature (4 tiles)
- **Terrain Mix:** Grass lots, concrete streets, building interiors

---

## Testing

After implementing these changes:

1. **Launch the game** and enter combat mode
2. **Reload multiple times** to verify all three maps appear randomly
3. **Test pathfinding** - units should navigate around obstacles correctly
4. **Verify line of sight** - walls should block vision, doors should allow vision when open
5. **Test cover mechanics** - LOW_WALL tiles should provide partial cover
6. **Check spawn positions** - teams should be appropriately separated

---

## Future Enhancements

Potential additions for even more tactical depth:

1. **Destructible terrain** - Doors that can be blown open, walls that can be breached
2. **Elevation system** - True high ground with line-of-sight advantages
3. **Flammable objects** - Crates/barrels that can be shot to create explosions
4. **Dynamic cover** - Objects that degrade with damage
5. **Environmental hazards** - Electric fences, toxic zones, collapsing structures
6. **Weather effects** - Rain reducing vision, wind affecting projectiles
7. **More map templates** - Industrial facility, rooftop chase, subway station, etc.

---

## Implementation Notes

- All terrain types used are already defined in `config.ts`
- The `setTerrain()` method handles terrain assignment safely
- Map generation happens in `generateTestMap()` which is called during scene creation
- The random selection ensures variety without needing player input
- Camera automatically centers on the map regardless of size

---

**Created:** December 2025
**For:** SuperHero Tactics MVP Combat System
**File:** C:\git\sht\MVP\src\game\scenes\CombatScene.ts
