---
name: sht-phaser-patterns
description: Guide Phaser 3 scene development, combat UI patterns, visual effects, and React-Phaser integration for SuperHero Tactics.
---

# SHT Phaser Development Guide

You provide guidance on Phaser 3 scene development, combat visualization, and React integration patterns used in SHT.

## Key Data Files

- `MVP/src/game/scenes/CombatScene.ts` - Main combat scene (2000+ lines)
- `MVP/src/game/config.ts` - Phaser configuration, isometric math
- `MVP/src/game/EventBridge.ts` - React-Phaser communication
- `MVP/src/components/PhaserGame.tsx` - React wrapper
- `MVP/src/game/systems/ParticleEffects.ts` - Particle system
- `MVP/src/game/systems/SoundManager.ts` - Audio system

## Isometric Configuration

From config.ts:
```typescript
// Tile dimensions
export const TILE_SIZE = 64;
export const TILE_WIDTH = 128;
export const TILE_HEIGHT = 64;

// Map size
export const MAP_WIDTH = 15;
export const MAP_HEIGHT = 15;

// Coordinate conversion
export function gridToScreen(x: number, y: number): { x: number; y: number } {
  return {
    x: (x - y) * (TILE_WIDTH / 2) + offset.x,
    y: (x + y) * (TILE_HEIGHT / 2) + offset.y
  };
}

export function screenToGrid(screenX: number, screenY: number): { x: number; y: number } {
  const adjustedX = screenX - offset.x;
  const adjustedY = screenY - offset.y;
  return {
    x: Math.floor((adjustedX / (TILE_WIDTH / 2) + adjustedY / (TILE_HEIGHT / 2)) / 2),
    y: Math.floor((adjustedY / (TILE_HEIGHT / 2) - adjustedX / (TILE_WIDTH / 2)) / 2)
  };
}

// Depth sorting for isometric
export function getIsoDepth(x: number, y: number): number {
  return (x + y) * 10;
}
```

## Color Palette

```typescript
export const COLORS = {
  primary: 0x3b82f6,    // Blue
  secondary: 0x10b981,  // Green
  accent: 0xf59e0b,     // Orange
  danger: 0xef4444,     // Red
  dark: 0x1f2937,       // Dark gray
  light: 0xf3f4f6,      // Light gray
  background: 0x111827  // Very dark
};
```

## Terrain Types

```typescript
export const TERRAIN_TYPES = {
  FLOOR: { color: 0x374151, moveCost: 1, cover: 0, name: 'Floor' },
  WALL: { color: 0x1f2937, moveCost: Infinity, cover: 1, name: 'Wall' },
  COVER_LOW: { color: 0x4b5563, moveCost: 1.5, cover: 0.5, name: 'Low Cover' },
  COVER_HIGH: { color: 0x6b7280, moveCost: 2, cover: 0.75, name: 'High Cover' },
  WATER: { color: 0x3b82f6, moveCost: 3, cover: 0, name: 'Water' },
  HAZARD: { color: 0xef4444, moveCost: 1, cover: 0, name: 'Hazard' },
  ELEVATED: { color: 0x9ca3af, moveCost: 1, cover: 0, name: 'Elevated' },
  DOOR: { color: 0xf59e0b, moveCost: 1, cover: 0, name: 'Door' }
};
```

## EventBridge Pattern

Communication layer between React and Phaser:

```typescript
// React → Phaser
EventBridge.emit('select-unit', { unitId: 'hero-1' });
EventBridge.emit('move-unit', { unitId: 'hero-1', target: { x: 5, y: 3 } });
EventBridge.emit('attack', { attackerId: 'hero-1', targetId: 'enemy-2' });

// Phaser → React (in scene)
EventBridge.emit('unit-selected', { unit: unitData });
EventBridge.emit('combat-log', { message: 'Hero hits Enemy for 25 damage!' });
EventBridge.emit('turn-changed', { turn: 5, activeTeam: 'blue' });

// Subscribe in React component
useEffect(() => {
  const unsubscribe = EventBridge.on('unit-selected', (data) => {
    setSelectedUnit(data.unit);
  });
  return unsubscribe;
}, []);
```

## Combat Unit Interface

```typescript
interface CombatCharacter {
  id: string;
  name: string;
  team: 'blue' | 'red';
  stats: {
    MEL: number; AGL: number; STR: number;
    STA: number; INT: number; INS: number; CON: number;
  };
  health: { current: number; maximum: number };
  powers: string[];
  equipment: string[];
  shield?: number;
  maxShield?: number;
  dr?: number;
}
```

## Visual Effect Types

From CombatScene.ts WEAPONS:

### Projectile Effect
```typescript
{
  visual: { type: 'projectile', color: 0xffff00 }
}
// Yellow bullet path, travels from attacker to target
// Speed-based travel time
```

### Beam Effect
```typescript
{
  visual: { type: 'beam', color: 0x00ffff }
}
// Instant laser line from attacker to target
// No travel time (speed of light)
// Fades over 0.3 seconds
```

### Cone Effect
```typescript
{
  visual: { type: 'cone', color: 0xff8800, spread: 30 }
}
// Shotgun/wide beam spread
// Angle-based area from attacker
// Hits multiple targets in cone
```

### Melee Effect
```typescript
{
  visual: { type: 'melee', color: 0xffffff }
}
// Close-range impact flash
// Range 1 only
// Quick animation
```

## Creating Visual Effects

### Beam Attack
```typescript
createBeamEffect(from: Position, to: Position, color: number): void {
  const graphics = this.add.graphics();
  graphics.lineStyle(4, color, 1);

  const fromScreen = gridToScreen(from.x, from.y);
  const toScreen = gridToScreen(to.x, to.y);

  graphics.moveTo(fromScreen.x, fromScreen.y);
  graphics.lineTo(toScreen.x, toScreen.y);

  // Fade out
  this.tweens.add({
    targets: graphics,
    alpha: 0,
    duration: 300,
    onComplete: () => graphics.destroy()
  });
}
```

### Projectile Attack
```typescript
createProjectile(from: Position, to: Position, color: number): void {
  const fromScreen = gridToScreen(from.x, from.y);
  const toScreen = gridToScreen(to.x, to.y);

  const projectile = this.add.circle(fromScreen.x, fromScreen.y, 5, color);

  this.tweens.add({
    targets: projectile,
    x: toScreen.x,
    y: toScreen.y,
    duration: 200,
    onComplete: () => projectile.destroy()
  });
}
```

### Explosion Effect
```typescript
createExplosion(position: Position, radius: number): void {
  const screen = gridToScreen(position.x, position.y);

  // Expanding circle
  const circle = this.add.circle(screen.x, screen.y, 10, 0xff4400, 0.8);

  this.tweens.add({
    targets: circle,
    radius: radius * TILE_SIZE,
    alpha: 0,
    duration: 500,
    ease: 'Cubic.Out',
    onComplete: () => circle.destroy()
  });

  // Camera shake
  this.cameras.main.shake(200, 0.02);
}
```

## Unit Health Bar

```typescript
createHealthBar(unit: CombatCharacter): Phaser.GameObjects.Container {
  const container = this.add.container(0, 0);

  // Background
  const bg = this.add.rectangle(0, 0, 50, 6, 0x333333);

  // Health fill
  const fill = this.add.rectangle(-25, 0, 50, 6, 0x00ff00);
  fill.setOrigin(0, 0.5);

  container.add([bg, fill]);

  return container;
}

updateHealthBar(container: Container, current: number, max: number): void {
  const fill = container.getAt(1) as Rectangle;
  const percent = current / max;

  fill.width = 50 * percent;

  // Color based on health
  if (percent > 0.6) fill.setFillStyle(0x00ff00);
  else if (percent > 0.3) fill.setFillStyle(0xffff00);
  else fill.setFillStyle(0xff0000);
}
```

## AI Personality System

From CombatScene.ts:
```typescript
type AIPersonality = 'aggressive' | 'cautious' | 'tactical' | 'berserker' | 'sniper';
```

| Personality | Behavior |
|-------------|----------|
| aggressive | Moves toward enemies, prioritizes damage |
| cautious | Uses cover, retreats when hurt |
| tactical | Flanks, coordinates with allies |
| berserker | Charges closest enemy, ignores safety |
| sniper | Stays at range, takes safe shots |

## Status Effects Visual

```typescript
const STATUS_EFFECTS = {
  bleeding: { color: 0xff0000, emoji: '🩸' },
  burning: { color: 0xff4400, emoji: '🔥' },
  frozen: { color: 0x00ffff, emoji: '❄️' },
  stunned: { color: 0xffff00, emoji: '⚡' },
  poisoned: { color: 0x00ff00, emoji: '☠️' }
};
```

## Combat Statistics Interface

```typescript
interface CombatStats {
  totalDamageDealt: { blue: number; red: number };
  totalKills: { blue: number; red: number };
  shotsFired: { blue: number; red: number };
  hits: { blue: number; red: number };
  misses: { blue: number; red: number };
  grazes: { blue: number; red: number };
  criticalHits: { blue: number; red: number };
  killLog: KillEntry[];
  turnCount: number;
}

interface CombatAwards {
  mvp: string | null;        // Most damage dealt
  reaper: string | null;     // Most kills
  firstBlood: string | null; // First kill
  finalBlow: string | null;  // Last kill
  tank: string | null;       // Most damage taken (survived)
  killstreak: string | null; // Longest killstreak
}
```

## Example Queries

- "Add new energy shield visual effect that pulses when hit"
- "Implement overwatch interrupt when enemy enters cone"
- "Create explosion animation with camera shake"
- "Add status effect icons floating above units"
- "Design cover indicator for isometric tiles"
- "Implement line-of-sight visualization"
