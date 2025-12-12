/**
 * Enhanced Map Generation for SuperHero Tactics Combat
 *
 * This file contains improved map generation code to replace the simple
 * generateTestMap() method in CombatScene.ts
 *
 * CHANGES NEEDED IN CombatScene.ts:
 * 1. Change mapWidth and mapHeight from 15 to 30
 * 2. Replace the entire generateTestMap() method with the code below
 * 3. Add the three new map generation methods after generateTestMap()
 */

// STEP 1: Update the map dimensions (around line 615-616)
// Change from:
//   private mapWidth: number = 15;
//   private mapHeight: number = 15;
// To:
//   private mapWidth: number = 30;
//   private mapHeight: number = 30;

// STEP 2: Replace generateTestMap() method (around line 1024)
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

// STEP 3: Add these three new methods after generateTestMap()

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

/**
 * SPAWN POSITIONS UPDATE
 *
 * You may also want to update the spawn positions in spawnTestUnits() to make better
 * use of the larger map. The current spawn positions are quite close together (2,5) and (12,5).
 *
 * Suggested spawn positions for 30x30 map:
 *
 * Blue team (left side):
 * - Position 1: { x: 2, y: 10 }
 * - Position 2: { x: 2, y: 15 }
 * - Position 3: { x: 2, y: 20 }
 *
 * Red team (right side):
 * - Position 1: { x: 27, y: 10 }
 * - Position 2: { x: 27, y: 15 }
 * - Position 3: { x: 27, y: 20 }
 *
 * This gives teams more separation and forces tactical movement.
 */
