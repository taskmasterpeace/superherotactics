# Grenade System Documentation

## Overview
The grenade system allows units to throw various types of grenades during tactical combat. Grenades are equipment items that appear in the QuickInventory UI and can be thrown at target tiles.

## Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                         GRENADE FLOW                               │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  1. QuickInventory     2. CombatScene      3. Throw & Explode     │
│  ┌──────────────┐      ┌──────────────┐    ┌──────────────────┐   │
│  │ Shows grenade ├─────►│ Receives     ├────►│ Animate grenade │   │
│  │ icons from    │emit  │ 'start-      │click│ projectile      │   │
│  │ equipment[]   │event │ grenade-     │tile │ ↓               │   │
│  └──────────────┘      │ throw'       │     │ explodeGrenade() │   │
│                        └──────────────┘     │ ↓               │   │
│                                              │ Deal damage     │   │
│                                              │ Apply effects   │   │
│                                              └──────────────────┘   │
└────────────────────────────────────────────────────────────────────┘
```

## Key Files

### 1. `src/components/QuickInventory.tsx`
Displays grenade icons at bottom of combat screen.

```typescript
// Grenade data with images
const GRENADE_DATA = {
    'Frag': {
        image: '/assets/items/grenades/grenade_frag.png',
        fallbackEmoji: '💣',
        borderColor: 'border-red-500'
    },
    'Plasma': { ... },
    'Smoke': { ... },
    // etc
};
```

### 2. `src/data/explosionSystem.ts`
Defines grenade types and explosion calculations.

```typescript
export const GRENADES = {
    FRAG: { 
        name: 'Frag Grenade',
        damageAtCenter: 40,
        blastRadius: 3,
        // ...
    },
    // ...
};
```

### 3. `src/game/scenes/CombatScene.ts`
Handles grenade throw logic:
- `throwGrenade()` - Animates the throw
- `explodeGrenade()` - Handles explosion damage/effects
- `showGrenadeRange()` - Shows targeting overlay

### 4. `public/assets/items/grenades/`
Contains grenade icon images:
- `grenade_frag.png`
- `grenade_plasma.png`
- `grenade_smoke.png`
- `grenade_flashbang.png`
- `grenade_emp.png`
- `grenade_cryo.png`
- `grenade_incendiary.png`
- `grenade_nervegas.png`

## Grenade Types

| Type | Damage | Radius | Effect |
|------|--------|--------|--------|
| Frag | 40 | 3 tiles | High physical damage |
| Plasma | 50 | 2 tiles | Energy damage |
| Concussion | 25 | 4 tiles | Knockback + stun |
| Flashbang | 5 | 4 tiles | Blinds enemies |
| Smoke | 0 | 3 tiles | Creates smoke cover |
| EMP | 30 | 3 tiles | Disables electronics |
| Cryo | 20 | 3 tiles | Freezes/slows enemies |
| Incendiary | 15 | 3 tiles | Sets targets on fire |
| Nervegas | 10 | 4 tiles | Poison damage over time |

## How Grenades Work

### 1. Equipping
Characters have grenades in their `equipment[]` array (defined in `enhancedGameStore.ts`):

```typescript
equipment: ['Energy Pistol', 'Plasma Grenade', 'Frag Grenade', 'Tactical Armor']
```

### 2. Display in UI
`QuickInventory` filters equipment for grenade keywords and shows icons.

### 3. Selecting a Grenade
Clicking a grenade icon emits `'start-grenade-throw'` event:
```typescript
EventBridge.emit('start-grenade-throw', { id: 'frag', name: 'Frag Grenade' });
```

### 4. Targeting
CombatScene receives the event and:
1. Stores grenade in `this.pendingGrenade`
2. Sets `actionMode` to `'throw'`
3. Calls `showGrenadeRange()` to display orange overlay

### 5. Throwing
When player clicks a tile in throw mode:
1. `throwGrenade(unit, x, y)` is called
2. Uses `calculateThrow()` from explosionSystem
3. Deducts 2 AP from unit
4. Animates grenade sprite flying with arc
5. On landing, calls `explodeGrenade()`

### 6. Explosion
`explodeGrenade()`:
1. Creates visual explosion circle
2. Plays explosion sound
3. Damages all units within blast radius
4. Damage falls off with distance from center
5. Kills units at 0 HP

## Adding a New Grenade Type

### Step 1: Add to explosionSystem.ts
```typescript
export const GRENADES = {
    // ... existing grenades
    TOXIC: {
        name: 'Toxic Grenade',
        damageAtCenter: 15,
        blastRadius: 4,
        statusEffect: 'poisoned',
        // ...
    }
};
```

### Step 2: Add Image
Add `grenade_toxic.png` to `public/assets/items/grenades/`

### Step 3: Update QuickInventory
Add to `GRENADE_DATA`:
```typescript
'Toxic': {
    image: '/assets/items/grenades/grenade_toxic.png',
    fallbackEmoji: '☠️',
    borderColor: 'border-green-500'
},
```

### Step 4: Update PreloadScene
Add to grenade list in `loadGrenadeSprites()`:
```typescript
const grenades = [..., 'toxic'];
```

### Step 5: Add Sound (optional)
Add to `public/soundConfig.json`:
```json
"grenade.toxic": "grenades.toxic_grenade"
```

### Step 6: Give to Character
Add to character equipment:
```typescript
equipment: [..., 'Toxic Grenade']
```

## AP Cost
All grenades cost **2 AP** to throw (hardcoded in `throwGrenade()`).

## Range
Maximum throw range is **7 tiles** (hardcoded in `showGrenadeRange()` and `onTileClick()`).

## Troubleshooting

### Grenade Not Showing in UI
1. Check character has grenade in `equipment[]` array
2. Check grenade name matches a key in `GRENADE_DATA`
3. Must contain word like "Frag", "Plasma", etc.

### Wrong Image Showing
1. Check image file exists in `public/assets/items/grenades/`
2. Check filename matches in `GRENADE_DATA`
3. Hard refresh browser (Ctrl+Shift+R)

### Grenade Not Exploding
1. Check console for errors
2. Verify `GRENADES` has the grenade type
3. Check `explosionSystem.ts` import

### No Sound
1. Check `soundConfig.json` has mapping
2. Check sound file exists in `public/assets/sounds/grenades/`
