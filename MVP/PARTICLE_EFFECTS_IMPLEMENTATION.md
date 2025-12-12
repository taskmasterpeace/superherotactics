# Particle Effects System Implementation

## Overview
Comprehensive particle effects system for SuperHero Tactics game, including fire spread mechanics, explosions, status effect particles, and environmental interactions.

## Files Created

### 1. ParticleEffectsManager.ts
**Location:** `C:\git\sht\MVP\src\game\systems\ParticleEffectsManager.ts`

**Purpose:** Core particle effects management system

**Features:**
- Programmatically generated particle textures (fire, ice, blood, lightning, sparks, smoke, debris, energy)
- Status effect particles (burning, bleeding, frozen, stunned, poisoned, electric, shielded, inspired)
- Fire tile management with animated flames
- Explosion effects with debris and smoke
- Electric arc effects for lightning powers
- Particle position updates when units move
- Automatic cleanup of expired particles

**Key Methods:**
- `createFire(x, y, screenX, screenY, intensity)` - Create fire on a tile
- `extinguishFire(x, y)` - Put out fire on a tile
- `createExplosion(x, y, radius)` - Create explosion effect
- `createStatusEffect(unitId, effectType, x, y, duration)` - Add status effect particles to a unit
- `removeStatusEffect(unitId, effectType)` - Remove specific status effect
- `createElectricArc(x1, y1, x2, y2, color)` - Create lightning bolt between two points
- `createSmoke(x, y, tint)` - Create smoke effect
- `update()` - Update all particle systems (call in scene update loop)

### 2. FireSpreadSystem.ts
**Location:** `C:\git\sht\MVP\src\game\systems\FireSpreadSystem.ts`

**Purpose:** Fire propagation and damage system

**Features:**
- Material flammability values (wood: 0.9, organic: 0.7, plastic: 0.6, metals: 0.0)
- Fire spreads to adjacent flammable tiles each turn
- Fire intensity affects spread chance and damage
- Fire duration decreases over time
- Water/ice powers can extinguish fires

**Key Methods:**
- `processFireSpread()` - Process fire spread at end of turn, returns damage map
- `createFireFromAttack(x, y, intensity, radius)` - Create area fire effect
- `extinguishFireWithPower(x, y, radius)` - Extinguish fire with powers
- `checkFireDamage(x, y)` - Get fire damage for a tile
- `getMaterialFlammability(material)` - Get flammability value for material

**Fire Mechanics:**
- Base spread chance: 30% per turn
- Intensity multiplier: +5% per intensity level
- Spread chance = (base + intensity bonus) × material flammability
- Fire damage = intensity value per turn
- Units standing in fire take damage and gain burning status

### 3. CombatParticleIntegration.ts
**Location:** `C:\git\sht\MVP\src\game\systems\CombatParticleIntegration.ts`

**Purpose:** Integration wrapper for CombatScene

**Features:**
- Connects ParticleEffectsManager and FireSpreadSystem to CombatScene
- Handles grid-to-screen coordinate conversion
- Provides terrain-to-material mapping
- Simplified API for combat events

**Key Methods:**
- `onStatusEffectApplied(unitId, effectType, x, y)` - Called when status effect applied
- `onStatusEffectRemoved(unitId, effectType)` - Called when status effect removed
- `onUnitMoved(unitId, x, y)` - Called when unit moves
- `onUnitDied(unitId)` - Called when unit dies
- `createFire(x, y, intensity)` - Create fire at grid position
- `createAreaFire(x, y, intensity, radius)` - Create fire in area
- `extinguishFire(x, y, radius)` - Extinguish fire
- `isOnFire(x, y)` - Check if tile is burning
- `getFireDamage(x, y)` - Get damage from fire
- `createExplosion(x, y, radius)` - Create explosion
- `createElectricArc(x1, y1, x2, y2, color)` - Create lightning
- `createSmoke(x, y, tint)` - Create smoke
- `processFireSpread()` - Process fire spread and return damage
- `update()` - Update all systems

**Material Mapping:**
- grass → organic (0.7 flammability)
- forest → wood (0.9 flammability)
- water/rock/concrete/metal → 0.0 flammability
- asphalt → 0.1 flammability

### 4. CombatScene.ts Modifications
**Location:** `C:\git\sht\MVP\src\game\scenes\CombatScene.ts`

**Changes Made:**

#### Imports Added:
```typescript
import { CombatParticleIntegration, getMaterialDataForTerrain } from '../systems/CombatParticleIntegration';
import { TileData } from '../systems/FireSpreadSystem';
```

#### Private Field Added:
```typescript
private particleEffects?: CombatParticleIntegration;
```

#### Initialization in create():
```typescript
// Initialize particle effects system
this.particleEffects = new CombatParticleIntegration({
  scene: this,
  effectsLayer: this.effectsLayer,
  gridToScreen: (x: number, y: number) => gridToScreen(x, y, this.offsetX, this.offsetY),
  getTileData: (x: number, y: number) => this.getTileDataForFire(x, y),
});
```

#### New update() Method:
```typescript
update(): void {
  // Update particle effects system
  if (this.particleEffects) {
    this.particleEffects.update();
  }
}
```

#### Helper Methods Added:
- `getTileDataForFire(x, y)` - Provides tile material data for fire system
- `processFireDamage()` - Applies fire damage to all units standing in fire

#### Status Effect Integration:
Modified `applyStatusEffect()` to trigger particle effects:
```typescript
if (this.particleEffects) {
  this.particleEffects.onStatusEffectApplied(unit.id, effectType, unit.position.x, unit.position.y);
}
```

#### Fire Processing:
Modified `processTeamStatusEffects()` to process fire spread and damage:
```typescript
if (this.particleEffects) {
  this.particleEffects.processFireSpread();
  this.processFireDamage();
}
```

#### Power Effects:
Modified `applyOffensivePower()` to add particle effects for powers:
- **Fireball:** Creates explosion + area fire
- **Ice Bolt:** Extinguishes fire in radius
- **Lightning Chain:** Creates electric arc between attacker and target

#### Unit Movement:
Modified `moveUnitAnimated()` to update particle positions when units move:
```typescript
if (this.particleEffects) {
  this.particleEffects.onUnitMoved(unit.id, targetX, targetY);
}
```

#### Unit Death:
Modified `unitDied()` to cleanup particles:
```typescript
if (this.particleEffects) {
  this.particleEffects.onUnitDied(unit.id);
}
```

### 5. Integration Patch Documentation
**Location:** `C:\git\sht\MVP\src\game\scenes\CombatScene_ParticleIntegration.patch.ts`

Complete step-by-step integration guide with code examples for manual application.

## Status Effects with Particles

### Implemented Effects:
1. **Burning** 🔥
   - Fire particles rising from character
   - Orange/red/yellow flames
   - Applied when standing in fire or hit by fire attacks

2. **Bleeding** 🩸
   - Blood drip particles
   - Falls downward with gravity
   - Stackable effect

3. **Frozen** 🧊
   - Ice crystal particles
   - Blue/white rotating crystals
   - Slows movement

4. **Stunned** 💫
   - Stars circling above head
   - Yellow/white sparkles
   - Character cannot act

5. **Poisoned** ☠️
   - Green smoke/gas particles
   - Rises slowly
   - Damage over time

6. **Electric/EMP** ⚡
   - Lightning particle effects
   - Blue/purple electric arcs
   - Crackling energy

7. **Shielded** 🛡️
   - Blue energy particles orbiting
   - Protective shimmer
   - Adds damage reduction

8. **Inspired** ✨
   - Golden sparkles rising
   - Shimmering particles
   - Accuracy boost

## Fire Spread Mechanics

### How Fire Spreads:
1. At the end of each turn, `processFireSpread()` is called
2. For each active fire tile:
   - Check all 4 adjacent tiles (N, S, E, W)
   - Calculate spread chance based on:
     - Fire intensity (higher = more spread)
     - Material flammability (wood > organic > plastic > metal)
   - Roll for spread to each adjacent tile
   - New fires have slightly reduced intensity
3. Fire duration decreases each turn
4. Fires extinguish when duration reaches 0

### Fire Damage:
- Units standing on fire tiles take damage equal to fire intensity
- Damage applied at start of each turn
- Automatically applies "burning" status effect
- Fire damage shown with orange floating text
- Can kill units if health reaches 0

### Fire Extinguishing:
- Ice/cold powers automatically extinguish fire in radius
- Water attacks could be added similarly
- Manual extinguish when tile is targeted by cold power

## Power-Specific Effects

### Fireball
- Creates explosion effect at impact point
- Spawns area fire based on radius
- Applies burning status to all targets in radius
- Fire spreads naturally from impact zone

### Ice Bolt
- Creates ice particle trail
- Extinguishes any fire at target location
- Can extinguish fires in 1-tile radius
- Applies frozen status

### Lightning Chain
- Creates electric arc from caster to target
- Jagged, animated lightning bolt
- Can chain to additional targets (future enhancement)
- Blue/white electric particles

### Other Powers
- Easy to add particle effects to any power
- Simply check `power.id` or `power.type` in `applyOffensivePower()`
- Use appropriate particle method from `particleEffects`

## Usage Examples

### Create Fire on a Tile
```typescript
if (this.particleEffects) {
  this.particleEffects.createFire(gridX, gridY, intensity);
}
```

### Create Explosion
```typescript
if (this.particleEffects) {
  this.particleEffects.createExplosion(gridX, gridY, radius);
}
```

### Check if Tile is Burning
```typescript
if (this.particleEffects && this.particleEffects.isOnFire(x, y)) {
  // Tile is on fire
}
```

### Extinguish Fire
```typescript
if (this.particleEffects) {
  const extinguished = this.particleEffects.extinguishFire(x, y, radius);
  console.log(`Extinguished ${extinguished} fires`);
}
```

### Add Status Effect with Particles
```typescript
// Particles are automatically added when you call applyStatusEffect
this.applyStatusEffect(unit, 'burning');
```

## Performance Considerations

### Particle Limits:
- Each particle emitter is optimized for performance
- Particles have limited lifespan (200-2000ms typically)
- Old particles automatically cleaned up
- Fire tiles limited by map size

### Optimization Tips:
- Particles use Phaser's built-in particle system (hardware accelerated)
- Textures generated once at startup
- Inactive emitters automatically destroyed
- Update loop only processes active effects

## Future Enhancements

### Possible Additions:
1. **Water/Liquid System**
   - Water puddles that extinguish fire
   - Water spreads and flows downhill
   - Electrical attacks more dangerous in water

2. **Smoke/Visibility**
   - Fire creates smoke clouds
   - Smoke reduces line of sight
   - Wind affects smoke direction

3. **Material Destruction**
   - Wood burns away completely
   - Structures can collapse
   - Terrain changes after fire

4. **Weather Effects**
   - Rain extinguishes fire
   - Wind spreads fire faster
   - Lightning strikes during storms

5. **Additional Status Effects**
   - Acid pools that damage over time
   - Oil slicks that can ignite
   - Radiation zones

## Testing

### How to Test:
1. Start combat scene with units that have fireball/iceBolt powers
2. Use fireball on wood/grass terrain - fire should appear and spread
3. Watch fire spread to adjacent flammable tiles each turn
4. Use ice bolt on fire - should extinguish
5. Apply status effects - particles should appear on characters
6. Move units - particles should follow
7. Kill units - particles should cleanup

### Debug Commands:
Add these methods for testing:
```typescript
// Manually create fire for testing
this.particleEffects?.createFire(10, 10, 5);

// Check fire state
console.log('Fire tiles:', this.particleEffects?.getFireTiles());

// Create explosion
this.particleEffects?.createExplosion(15, 15, 80);
```

## Material Flammability Reference

From `DATABASE_REFERENCE.md`:
| Material | Flammability |
|----------|--------------|
| Wood | 0.9 (very flammable) |
| Organic | 0.7 (flammable) |
| Plastic | 0.6 (flammable) |
| Kevlar | 0.2 (slightly flammable) |
| Steel/Iron/Titanium | 0.0 (fireproof) |
| Glass | 0.0 (fireproof) |
| Energy | 0.0 (fireproof) |

## Particle Texture Reference

Programmatically generated in `ParticleEffectsManager`:
- `particle_fire` - Orange circle for fire/explosions
- `particle_ice` - Blue cross/crystal shape
- `particle_blood` - Red droplet shape
- `particle_lightning` - White zigzag bolt
- `particle_spark` - Small yellow/white dot
- `particle_smoke` - Gray semi-transparent circle
- `particle_debris` - Small orange/gray squares
- `particle_energy` - Cyan glow circle
- `particle_generic` - White circle (fallback)

## Integration Complete

All systems are now integrated into CombatScene.ts. The particle effects will automatically:
- Show when status effects are applied
- Follow units as they move
- Cleanup when units die
- Process fire spread each turn
- Display appropriate visual effects for powers
- Handle material-based fire propagation

The system is modular and easy to extend with additional particle types and effects.
