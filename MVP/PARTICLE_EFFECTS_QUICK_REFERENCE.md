# Particle Effects Quick Reference

## Quick Start

### Files Created
```
src/game/systems/
├── ParticleEffectsManager.ts        # Core particle system
├── FireSpreadSystem.ts              # Fire mechanics
└── CombatParticleIntegration.ts     # Integration wrapper

src/game/scenes/
└── CombatScene.ts                   # Modified with particle support
```

## Common Operations

### Create Fire
```typescript
// Single tile
this.particleEffects?.createFire(x, y, intensity);

// Area fire (explosion, flamethrower)
this.particleEffects?.createAreaFire(x, y, intensity, radius);
```

### Create Explosion
```typescript
this.particleEffects?.createExplosion(x, y, radius);
```

### Lightning/Electric Arc
```typescript
this.particleEffects?.createElectricArc(x1, y1, x2, y2, color);
```

### Extinguish Fire
```typescript
// Returns number of fires extinguished
const count = this.particleEffects?.extinguishFire(x, y, radius);
```

### Check Fire Status
```typescript
// Is tile burning?
if (this.particleEffects?.isOnFire(x, y)) { }

// Get fire damage
const damage = this.particleEffects?.getFireDamage(x, y);
```

## Status Effect Particles

### Automatic
Status effect particles are **automatically created** when you use:
```typescript
this.applyStatusEffect(unit, 'burning');
```

### Supported Effects
- `burning` - Fire particles rising
- `bleeding` - Blood drips
- `frozen` - Ice crystals
- `stunned` - Stars circling
- `poisoned` - Green gas
- `emp` / `electric` - Lightning
- `shielded` - Blue energy
- `inspired` - Golden sparkles

### Manual Control
```typescript
// Manually add effect
this.particleEffects?.onStatusEffectApplied(unitId, effectType, x, y);

// Remove specific effect
this.particleEffects?.onStatusEffectRemoved(unitId, effectType);

// Remove all effects
this.particleEffects?.onUnitDied(unitId);
```

## Fire Spread System

### Automatic Processing
Fire spreads automatically at end of turn via `processTeamStatusEffects()`.

### Material Flammability
```typescript
// Most to least flammable
wood: 0.9        // Burns easily
organic: 0.7     // Grass, plants
plastic: 0.6     // Burns with toxic smoke
kevlar: 0.2      // Fire resistant
metals: 0.0      // Fireproof
```

### Fire Spread Formula
```
spreadChance = (baseChance + intensityBonus) × materialFlammability
baseChance = 0.3 (30%)
intensityBonus = intensity × 0.05 (5% per level)
```

### Example
Fire with intensity 5 on wood:
```
spreadChance = (0.3 + 5×0.05) × 0.9 = 0.495 = 49.5%
```

## Adding Effects to Powers

### In applyOffensivePower()
```typescript
if (this.particleEffects) {
  switch(power.id) {
    case 'fireball':
      this.particleEffects.createExplosion(target.position.x, target.position.y, 60);
      this.particleEffects.createAreaFire(target.position.x, target.position.y, 5, power.radius || 1);
      break;

    case 'iceBolt':
      const extinguished = this.particleEffects.extinguishFire(target.position.x, target.position.y, 1);
      break;

    case 'lightningChain':
      this.particleEffects.createElectricArc(
        user.position.x, user.position.y,
        target.position.x, target.position.y
      );
      break;
  }
}
```

## Event Handlers

### Already Integrated
These are automatically handled in CombatScene:
- ✅ Status effect applied → particles created
- ✅ Unit moved → particles follow
- ✅ Unit died → particles cleaned up
- ✅ Turn end → fire spreads

### Custom Integration
For new features, call these methods:
```typescript
// When unit moves
this.particleEffects?.onUnitMoved(unitId, newX, newY);

// When status applied
this.particleEffects?.onStatusEffectApplied(unitId, effectType, x, y);

// When status removed
this.particleEffects?.onStatusEffectRemoved(unitId, effectType);

// When unit dies
this.particleEffects?.onUnitDied(unitId);
```

## Particle Textures

### Available Textures
Generated automatically on initialization:
- `particle_fire` - Orange flame
- `particle_ice` - Blue crystal
- `particle_blood` - Red drop
- `particle_lightning` - White bolt
- `particle_spark` - Yellow spark
- `particle_smoke` - Gray cloud
- `particle_debris` - Orange chunk
- `particle_energy` - Cyan glow
- `particle_generic` - White dot

### Custom Textures
Add in `ParticleEffectsManager.createParticleTextures()`:
```typescript
graphics.clear();
graphics.fillStyle(0xcolor, alpha);
graphics.fillCircle(x, y, radius);
graphics.generateTexture('texture_name', width, height);
this.particleTextures.set('name', 'texture_name');
```

## Performance

### Optimized By Default
- Particles auto-cleanup after lifespan
- Inactive emitters destroyed
- Hardware-accelerated rendering
- Efficient update loop

### If Performance Issues
Reduce particle counts in `ParticleEffectsManager`:
```typescript
// Fire emitter
frequency: 50,  // Increase to 100 (fewer particles)
quantity: 20,   // Reduce to 10

// Explosion
quantity: 30,   // Reduce to 15
```

## Debugging

### Check Fire State
```typescript
const fires = this.particleEffects?.getFireTiles();
console.log('Active fires:', fires);
```

### Test Commands
```typescript
// Create test fire
this.particleEffects?.createFire(10, 10, 5);

// Create test explosion
this.particleEffects?.createExplosion(15, 15, 80);

// Create test arc
this.particleEffects?.createElectricArc(5, 5, 10, 10);
```

### Console Logging
Fire spread logs to console:
```
[Fire] Fire spread to 3 new tiles: [{x:10,y:11},{x:11,y:10},{x:10,y:9}]
```

## Common Issues

### Particles Not Showing
1. Check `particleEffects` is initialized in `create()`
2. Verify `effectsLayer` exists
3. Check depth values (should be 140-150)
4. Ensure `update()` is called

### Fire Not Spreading
1. Check material flammability > 0
2. Verify `processTeamStatusEffects()` calls `processFireSpread()`
3. Check fire has duration > 0
4. Ensure adjacent tiles are valid

### Particles Don't Follow Unit
1. Verify `onUnitMoved()` is called in movement code
2. Check grid-to-screen conversion is correct
3. Ensure unit ID matches

## Adding New Effects

### New Status Effect
1. Add to `STATUS_EFFECTS` in CombatScene.ts
2. Add case to `createStatusEffect()` in ParticleEffectsManager.ts
3. Configure emitter properties
4. Test with `applyStatusEffect()`

### New Power Effect
1. Add case in `applyOffensivePower()`
2. Call appropriate particle method
3. Test in combat

### New Material
1. Add to `MATERIAL_FLAMMABILITY` in FireSpreadSystem.ts
2. Add to terrain mapping in `getMaterialDataForTerrain()`
3. Test fire spread on new material

## Support

For issues or questions, reference:
- `PARTICLE_EFFECTS_IMPLEMENTATION.md` - Full documentation
- `CombatScene_ParticleIntegration.patch.ts` - Integration guide
- Source files for implementation details
