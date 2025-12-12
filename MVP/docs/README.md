# SuperHero Tactics - Technical Documentation

## Quick Reference for AI Assistants

This document provides an overview of the codebase architecture so any AI can quickly understand how things work.

---

## Project Structure

```
MVP/
├── public/
│   ├── assets/
│   │   ├── character_token/     # 32 soldier sprites (sprite_01.png - sprite_32.png)
│   │   ├── items/
│   │   │   └── grenades/        # Grenade icons (grenade_frag.png, etc)
│   │   └── sounds/              # All audio files + catalog.json
│   └── soundConfig.json         # Maps game actions to sounds
├── src/
│   ├── components/              # React UI components
│   ├── data/                    # Game data definitions
│   ├── game/
│   │   ├── scenes/              # Phaser game scenes
│   │   └── systems/             # Game systems (SoundManager, VisionSystem, etc)
│   └── stores/                  # Zustand state stores
└── docs/                        # This documentation
```

---

## Core Systems

### 1. Combat Scene (`src/game/scenes/CombatScene.ts`)
The main Phaser scene handling tactical combat.

**Key Properties:**
- `units: Map<string, Unit>` - All units on the battlefield
- `actionMode: 'idle' | 'move' | 'attack' | 'throw'` - Current action state
- `pendingGrenade` - Currently selected grenade for throwing
- `soundManager` - Audio system instance

**Key Methods:**
- `tryAttackUnit()` - Handles attacks between units
- `tryMoveUnit()` - Handles movement
- `throwGrenade()` - Handles grenade throwing
- `explodeGrenade()` - Handles grenade explosion effects
- `playSound()` - Plays sound via soundConfig mapping

### 2. Event Bridge (`src/game/EventBridge.ts`)
Pub/sub system for React ↔ Phaser communication.

```typescript
// Emit from React
EventBridge.emit('start-grenade-throw', { id: 'frag', name: 'Frag Grenade' });

// Listen in Phaser
EventBridge.on('start-grenade-throw', (data) => { ... });
```

### 3. Game Store (`src/stores/enhancedGameStore.ts`)
Zustand store for game state.

```typescript
// Get characters
const { characters } = useGameStore();

// Update character
updateCharacter(charId, { equipment: [...] });
```

---

## Key Data Files

### Characters (`enhancedGameStore.ts`)
```typescript
characters: [
    {
        id: 'soldier-001',
        name: 'Alpha Squad Leader',
        equipment: ['Energy Pistol', 'Plasma Grenade', 'Frag Grenade'],
        stats: { MEL: 60, AGL: 55, STR: 58, ... },
        health: { current: 70, maximum: 70 },
        // ...
    }
]
```

### Weapons (`src/data/weapons.ts`)
```typescript
export const WEAPONS = {
    pistol: { name: 'Pistol', damage: 15, range: 6, accuracy: 75, ap: 2 },
    rifle: { name: 'Assault Rifle', damage: 20, range: 10, accuracy: 70, ap: 3 },
    // ...
};
```

### Grenades (`src/data/explosionSystem.ts`)
```typescript
export const GRENADES = {
    FRAG: { name: 'Frag Grenade', damageAtCenter: 40, blastRadius: 3 },
    PLASMA: { ... },
    // ...
};
```

---

## Common Tasks

### Adding a New Weapon
1. Add to `src/data/weapons.ts`
2. Add sound mapping to `public/soundConfig.json`
3. Update weapon detection in `CombatScene.ts` attack logic

### Adding a New Grenade
See `docs/GRENADE_SYSTEM.md`

### Changing Sounds
Edit `public/soundConfig.json` - no code changes needed!
See `docs/SOUND_SYSTEM.md`

### Adding a Character
Add to `characters` array in `enhancedGameStore.ts`

---

## UI Components

### QuickInventory (`src/components/QuickInventory.tsx`)
Shows grenade/gadget icons at bottom. Reads from character equipment.

### SidePanel (`src/components/CombatLab.tsx`)
Shows selected unit stats + equipment on right side.

### UnitCardsBar (`src/components/CombatLab.tsx`)
Shows all units as cards at bottom of screen.

### BottomBar (`src/components/CombatLab.tsx`)
Main action bar with attack, move, reload buttons.

---

## Combat Flow

```
1. Select Unit (click or UnitCard)
      ↓
2. Choose Action (Attack/Move/Grenade)
      ↓
3. Select Target (click tile/enemy)
      ↓
4. Execute Action
   ├── Attack: tryAttackUnit() → fire visual → calculate hit → deal damage
   ├── Move: tryMoveUnit() → pathfind → animate movement
   └── Throw: throwGrenade() → animate arc → explodeGrenade()
      ↓
5. Update State
   ├── Deduct AP
   ├── Update health bars
   ├── Check for kills
   └── Emit log entries
      ↓
6. Check Turn End
   └── If AP = 0, auto-end or prompt
```

---

## Isometric Grid System

The game uses isometric projection:

```typescript
// Grid to Screen
function gridToScreen(gridX, gridY, offsetX, offsetY) {
    return {
        x: offsetX + (gridX - gridY) * (TILE_WIDTH / 2),
        y: offsetY + (gridX + gridY) * (TILE_HEIGHT / 2)
    };
}

// Screen to Grid
function screenToGrid(screenX, screenY, offsetX, offsetY) {
    const relX = screenX - offsetX;
    const relY = screenY - offsetY;
    return {
        x: Math.floor((relX / (TILE_WIDTH / 2) + relY / (TILE_HEIGHT / 2)) / 2),
        y: Math.floor((relY / (TILE_HEIGHT / 2) - relX / (TILE_WIDTH / 2)) / 2)
    };
}
```

Constants in `src/game/config.ts`:
- `TILE_WIDTH = 64`
- `TILE_HEIGHT = 32`
- `MAP_WIDTH = 20`
- `MAP_HEIGHT = 20`

---

## Documentation Index

| Document | Description |
|----------|-------------|
| `docs/SOUND_SYSTEM.md` | Audio system, sound mappings |
| `docs/GRENADE_SYSTEM.md` | Grenade types, throwing, explosions |
| `docs/COMBAT_REFERENCE.md` | Combat mechanics (if exists) |

---

## Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Type check
npm run typecheck
```

---

## Known Issues / TODOs

1. **`emitToUI` lint errors** - These are legacy calls that should use `EventBridge.emit()` instead
2. **`isTileWalkable` missing** - Needs proper implementation in pathfinding
3. **`knockback` property** - Not all weapons have this, needs optional check

---

## Contact Points in Code

| Feature | Primary File |
|---------|--------------|
| Combat Logic | `src/game/scenes/CombatScene.ts` |
| React UI | `src/components/CombatLab.tsx` |
| Game State | `src/stores/enhancedGameStore.ts` |
| Weapons | `src/data/weapons.ts` |
| Grenades | `src/data/explosionSystem.ts` |
| Sounds | `public/soundConfig.json` |
| Character Sprites | `public/assets/character_token/` |
