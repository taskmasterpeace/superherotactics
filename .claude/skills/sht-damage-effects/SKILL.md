---
name: sht-damage-effects
description: Analyze and design damage types, status effects, knockback physics, and explosion mechanics for SuperHero Tactics combat system.
---

# SHT Damage & Effects Specialist

You specialize in the damage type system, status effects, knockback physics, and explosion mechanics in SuperHero Tactics.

## Key Data Files

- `MVP/src/data/damageSystem.ts` - All 59 damage subtypes with effects (850 lines)
- `MVP/src/data/knockbackSystem.ts` - Force vs weight physics (283 lines)
- `MVP/src/data/explosionSystem.ts` - Grenade/explosion mechanics (381 lines)
- `MVP/src/data/strengthSystem.ts` - STR to weight mapping (156 lines)

## Damage Categories

```typescript
type DamageCategory =
  | 'PHYSICAL'        // Smashing, blunt impact
  | 'BLEED_PHYSICAL'  // Piercing, slashing (causes bleeding)
  | 'ENERGY'          // Thermal, plasma, electrical
  | 'BIOLOGICAL'      // Toxins, acid, disease
  | 'MENTAL'          // Psychic damage
  | 'OTHER';          // Disintegration, spiritual
```

## Damage Subtypes (59 total)

**PHYSICAL**: SMASHING_MELEE, SMASHING_PROJECTILE, BLUNT_WEAPON, IMPACT, GUNFIRE_BUCKSHOT, GUNFIRE_BULLET, EXPLOSION_CONCUSSION, SOUND_ULTRASONIC, SOUND_SONIC

**BLEED_PHYSICAL**: EXPLOSION_SHRAPNEL, PIERCING_PROJECTILE, GUNFIRE_AP, EDGED_PIERCING, EDGED_SLASHING

**ENERGY**: ENERGY_THERMAL, ENERGY_PLASMA, ENERGY_ICE, ELECTROMAGNETIC, ELECTROMAGNETIC_BOLT, ELECTROMAGNETIC_RADIATION, ELECTROMAGNETIC_LASER

**BIOLOGICAL**: TOXIN_POISON, TOXIN_VENOM, TOXIN_ACID, BIOTOXIN_VIRUS, BIOTOXIN_DISEASE

**MENTAL**: MENTAL_CONTROL, MENTAL_BLAST

**OTHER**: DISINTEGRATION, SPIRITUAL, ASPHYXIATION, EBULLISM, SIPHON, DECOMPOSITION, SICK_NAUSEATED

## Status Effect Interfaces

```typescript
interface KnockbackEffect {
  enabled: boolean;
  baseDistance: number;     // Tiles
  strengthScaling: boolean; // Scales with attacker STR
}

interface BleedingEffect {
  enabled: boolean;
  initialDamage: number;
  scaling: 'constant' | 'increasing' | 'decreasing';
  duration: number;         // Turns
  maxStacks: number;
  movementPenalty?: boolean;
}

interface BurningEffect {
  enabled: boolean;
  initialDamage: number;
  damageIncrease: number;   // Per turn
  duration: number;
  spreadChance: number;     // % to adjacent tiles
  armorDamage: boolean;
}

interface FreezeEffect {
  enabled: boolean;
  duration: number;
  apPenalty: number;        // AP reduction
  canShatter: boolean;
  shatterDamage?: number;
}

interface PoisonEffect {
  enabled: boolean;
  initialDamage: number;
  damageReduction: number;  // Decreases per turn
  duration: number;
  affectsBiological: boolean;
  affectsRobotic: boolean;
}

interface StunEffect {
  enabled: boolean;
  duration: number;
  skipTurn: boolean;
  accuracyPenalty?: number;
  savingThrow?: boolean;    // STA check to resist
}
```

## Armor Interaction

```typescript
interface ArmorInteraction {
  armorEffectiveness: number;  // 1.0 = normal, 2.0 = double protection, 0.5 = half
  ignoresArmor: boolean;
  damagesArmor: boolean;
  bypassesShields: boolean;
}
```

## Origin Modifiers

Damage multipliers vs different creature types:
```typescript
interface OriginModifiers {
  biological: number;   // vs humans, animals
  robotic: number;      // vs robots, AI
  energy: number;       // vs energy beings
  undead: number;       // vs undead
  construct: number;    // vs golems, vehicles
}
```

## Knockback System

**Core Formula**: `Impact = Force - (DefenderWeight × 0.3)`

**Knockback Table**:
| Impact    | Spaces |
|-----------|--------|
| 0-9       | 0      |
| 10-19     | 1      |
| 20-39     | 2      |
| 40-59     | 3      |
| 60-79     | 4      |
| 80-99     | 5      |
| 100-119   | 6      |
| 120-139   | 7      |
| 140-159   | 8      |
| 160-179   | 9      |
| 180-199   | 10     |
| 200-229   | 12     |
| 230-259   | 14     |
| 260-299   | 16     |
| 300-349   | 18     |
| 350-399   | 20     |
| 400-499   | 25     |
| 500+      | 30     |

**Explosion Forces**:
- Frag Grenade: 160
- Concussion Grenade: 200
- Flashbang: 80
- Rocket: 300
- C4: 250
- Car Bomb: 400
- Missile: 500
- Artillery: 600

**Melee Forces**:
- Punch: Force = attacker STR
- Kick: Force = STR + 10
- Club: Force = STR × 1.2 + 20
- Super Punch: Force = STR × 2 + 50

## Strength to Weight Table

| STR   | Weight (lbs) | Category    |
|-------|--------------|-------------|
| 6     | 128          | Normal      |
| 10    | 170          | Normal      |
| 15    | 210          | Normal      |
| 20    | 260          | Peak        |
| 25    | 320          | Enhanced    |
| 30    | 420          | Superhuman  |
| 36    | 600          | Superhuman  |
| 40    | 900          | Cosmic      |
| 50    | 1500         | Cosmic      |
| 100   | 10000        | Cosmic      |

## Knockback Examples

```
Grenade (160) vs Human STR 15 (210 lbs):
  Impact = 160 - (210 × 0.3) = 160 - 63 = 97
  Result: 5 spaces knocked back ✓

Grenade (160) vs Hulk STR 36 (600 lbs):
  Impact = 160 - (600 × 0.3) = 160 - 180 = -20
  Result: 0 spaces (tanks it) ✓

Rocket (300) vs Hulk STR 36 (600 lbs):
  Impact = 300 - (600 × 0.3) = 300 - 180 = 120
  Result: 7 spaces knocked back ✓
```

## Explosion System

```typescript
interface GrenadeType {
  id: string;
  name: string;
  blastRadius: number;      // Tiles from center
  baseDamage: number;
  damageType: DamageSubType;
  force: number;            // For knockback
  falloffType: 'linear' | 'quadratic';
  statusEffects?: string[];
}
```

**Damage Falloff**:
- Linear: `damage = baseDamage * (1 - distance/radius)`
- Quadratic: `damage = baseDamage * (1 - (distance/radius)²)`

## Analysis Tasks

1. **Knockback Balance**: Verify grenade vs human = 5-7 spaces, grenade vs Hulk = 0-1
2. **Effect Duration**: Check status effect durations are tactically meaningful (2-5 turns)
3. **Armor Bypass**: Analyze which damage types bypass which armor categories
4. **Chain Reactions**: Model explosion chains and cumulative effects
5. **Origin Effectiveness**: Verify energy weapons counter robotic, poison counters biological

## Example Queries

- "Calculate knockback for Concussion Grenade (200 force) vs character with STR 25"
- "List all damage types that can cause burning and their spread chances"
- "Find damage types where armorEffectiveness < 0.5 (armor bypass)"
- "Model explosion damage at each tile distance from center for FRAG grenade"
- "Design a new frost grenade with freeze effect"
