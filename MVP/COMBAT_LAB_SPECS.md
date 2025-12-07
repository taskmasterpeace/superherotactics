# Combat Lab Specifications & Development Guide

## SPRITE DIMENSIONS FOR ASSET CREATION

### Recommended Sprite Size
- **Base Size**: 64x64 pixels (1:1 square)
- **Why**: Fits centered inside isometric tiles (128x64 diamonds)
- **Format**: PNG with transparency (remove green screen background)

### Direction Requirements
- **Minimum**: 1 direction (facing SE/front-right)
- **Can be flipped**: Yes - horizontal flip for opposite direction
- **Recommended**: 2 directions (SE and SW) - flip for NE/NW

### Asset Pipeline
```
AI Image Generation (64x64 or 128x128 square)
    ↓
Green screen background (#00FF00)
    ↓
Remove background → Transparent PNG
    ↓
Drop in: public/assets/characters/[name].png
    ↓
Game loads and displays on grid
```

### Prompt Template for AI Generation
```
"Game character token, 64x64 pixels, square format,
[character description], facing front-right,
standing pose, tactical combat game style,
solid green (#00FF00) background, game asset"
```

---

## CURRENT ISSUES IDENTIFIED

### 1. Map Display (FIXED)
- **Issue**: Map only took half the screen
- **Fix**: Updated PhaserGame.tsx to use 100% dimensions and handle resize

### 2. Dev Hotkey (FIXED)
- **Issue**: Ctrl+Shift+D conflicted with browser bookmark
- **Fix**: Changed to F2

### 3. Unit Positioning
- **Status**: Units appear at tile centers mathematically
- **Perception**: May look like intersections due to diamond shape
- **No code change needed** - works correctly

### 4. Random Powers/Gadgets
- **Status**: Working as designed (placeholder system)
- **Powers are text strings** - they don't affect combat mechanically
- **Weapons are mapped from keywords** - "beam", "psychic", "rifle" etc.
- **Improvement needed**: Load from CSV files instead of hardcoded

### 5. Overwatch
- **Status**: NOT IMPLEMENTED
- **Current**: Hotkey O sets mode, but nothing happens
- **Implementation needed**: Full reaction fire system

---

## QUALITY OF LIFE IMPROVEMENTS (Quick Wins)

### Combat Log Enhancements
1. **Team Color Indicators**
   - Blue bar for blue team entries
   - Red bar for red team entries
   - Current: All entries look the same

2. **Log Entry Type Icons**
   - Attack: Crosshair icon
   - Move: Footsteps icon
   - Damage: Impact icon
   - Death: Skull icon

3. **Filter Toggles**
   - [Attack] [Move] [Damage] [System] buttons to show/hide types

### Movement Preview
- When hovering tile in Move mode:
  - Show footstep trail from unit to hover position
  - Show AP cost at destination

### Attack Preview
- When hovering enemy in Attack mode:
  - Show hit chance percentage
  - Show damage range
  - Show current weapon

### Enemy Visibility Counter
- Show number of visible enemies per unit: "3 enemies in sight"
- Click to cycle camera through visible enemies

---

## LOW-CODE SYSTEMS (Using Existing CSV Data)

### 1. Weapons from CSV (Medium effort)
**File**: `Game_Mechanics_Spec/Weapons_Complete.csv`

Implementation:
- Load CSV on game start
- Map weapon names to combat stats (damage, range, accuracy)
- Assign to characters based on equipment field

### 2. Gadgets from CSV (Medium effort)
**File**: `Game_Mechanics_Spec/Tech_Gadgets_Complete.csv`

Implementation:
- Load CSV on game start
- Parse Operation_Type for UI controls (toggle, slider, deploy)
- Show in GadgetPanel with appropriate controls

### 3. Status Effects (Low effort)
**File**: `Combat Compendium REAL - EFFECT_STATUS.csv`

Already have effects like: Bleeding, Stunned, Burning
Just need to apply them during combat

### 4. Critical Hit Table (Low effort)
**File**: `Combat Compendium REAL - CRIT TABLE.csv`

Implementation:
- On critical hit, roll on crit table
- Apply special effect based on result

### 5. Damage Types (Low effort)
**File**: `Combat Compendium REAL - DAMAGE TYPE TABLE.csv`

Implementation:
- Each weapon has damage type
- Armor provides DR against specific types

---

## STANCES IMPLEMENTATION PLAN

### Available Stances (from Combat_Modes_Stances.csv)
1. **Aggressive** - +15% damage, -10% defense
2. **Defensive** - -10% damage, +15% defense
3. **Balanced** - No modifiers
4. **Mobile** - +2 movement, -5% accuracy
5. **Overwatch** - Can't move, reaction shot ready

### Implementation Steps
1. Add `stance` field to Unit interface
2. Add stance selector in BottomBar UI (dropdown or cycle button)
3. Apply modifiers during attack/damage calculation
4. Visual indicator on unit (border color or icon)

---

## WALLS, BUILDINGS & DESTRUCTIBLE ENVIRONMENT

### Current System
- Terrain types: WALL, LOW_WALL, DOOR_CLOSED, DOOR_OPEN
- Walls block movement and LOS
- Low walls provide half cover

### Adding 3D Walls (Cubes)
Approach 1: **Height Map**
- Add `height` property to tiles (0=floor, 1=wall, 2=tall wall)
- Draw wall sprites on top of floor tiles
- Block LOS based on height difference

Approach 2: **Wall Sprites**
- Load wall tile images (same 128x64 base + height)
- Draw after floor, before units
- Use depth sorting

### Destructible Objects
1. Add `destructible` and `hp` properties to terrain
2. When attacked, reduce HP
3. At 0 HP, change terrain type (WALL → FLOOR)
4. Emit debris particle effect

### Materials & Penetration
From existing CSV files:
- Wood: 20 HP, can be punched through (STR 50+)
- Concrete: 50 HP, needs explosives or STR 70+
- Metal: 80 HP, needs special weapons or STR 90+
- Reinforced: 150 HP, heavy weapons only

---

## MAP EDITOR TOOLS

### Recommended: Tiled Map Editor
- **URL**: https://www.mapeditor.org/
- **Free, open source**
- **Supports isometric maps**
- **Exports to JSON**

### Integration Steps
1. Create tileset from our terrain sprites
2. Design maps in Tiled
3. Export as JSON
4. Load JSON in CombatScene.create()
5. Parse layer data to create tiles array

### Alternative: In-Game Editor
Build simple editor with:
- Click tile → cycle terrain type
- Shift+Click → set as wall
- Ctrl+S → export as JSON
- Load button → import JSON

---

## NAVMESH / PATHFINDING

### Current: Simple Manhattan Distance
- Calculates move cost as |deltaX| + |deltaY|
- Doesn't account for obstacles

### Needed: A* Pathfinding
Already available in Phaser via plugins:
- **easystar.js** - Simple A* library
- **navmesh** - More complex navigation

### Implementation
```typescript
// Using easystar
const easystar = new EasyStar.js();
easystar.setGrid(walkableGrid);
easystar.setAcceptableTiles([1]); // 1 = walkable
easystar.findPath(startX, startY, endX, endY, (path) => {
  // path is array of {x, y} waypoints
});
easystar.calculate();
```

---

## CHARACTER TO COMBAT LAB INTEGRATION

### Current Flow
1. Characters stored in gameStore
2. CombatLab reads gameStore.characters
3. Converts to CombatCharacter format
4. Sends via EventBridge to Phaser

### Issues
- Only first 4 characters used
- Equipment/powers don't map to weapons properly

### Fixes Needed
1. Allow selecting which characters to deploy
2. Proper weapon assignment from equipment
3. Show character equipment in pre-battle screen

---

## NEXT STEPS (Priority Order)

### Immediate (Today)
1. Add team color to combat log entries
2. Test isometric view with new sizing

### Short Term (This Week)
3. Load weapons from Weapons_Complete.csv
4. Add movement path preview
5. Add attack hit chance preview

### Medium Term
6. Implement Overwatch
7. Add stance selector
8. Destructible walls
9. A* pathfinding

### Long Term
10. Map editor integration with Tiled
11. Full gadget operation system
12. Power abilities as active skills
