# Ralph Wiggum Loop: Combat Polish & Strategic Layer

## Overview
Autonomous loop to implement fire modes, wire weapons, add free movement, and build strategic systems.

**Status**: Planning phase
**Target**: Full JA2/XCOM tactical depth

---

## RALPH WIGGUM LOOP PROMPT

```
You are completing the SHT combat and strategic systems.
Run this as an autonomous loop until all phases are complete.

## ITERATION PATTERN
Each iteration:
1. Check current phase status (run build, verify no errors)
2. Pick the HIGHEST PRIORITY incomplete task
3. Implement that ONE task fully
4. Test with build + manual verification
5. Mark complete in this checklist
6. If task affects balance, run balance tests

## PHASE 1: FIRE MODES [HIGH PRIORITY]
Goal: Add single/burst/auto fire modes to enable suppression

### 1A: Add FireMode to weapon types
File: `MVP/src/combat/types.ts`

□ Add FireMode type:
  ```typescript
  export type FireMode = 'single' | 'burst' | 'auto';

  export interface FireModeConfig {
    mode: FireMode;
    shotsPerAttack: number;      // 1 for single, 3 for burst, 5+ for auto
    accuracyPenalty: number;     // 0 for single, -15 for burst, -25 for auto
    apCost: number;              // AP multiplier
    suppressionChance: number;   // 0 for single, 30 for burst, 60 for auto
  }

  export const FIRE_MODES: Record<FireMode, FireModeConfig> = {
    single: { mode: 'single', shotsPerAttack: 1, accuracyPenalty: 0, apCost: 1, suppressionChance: 0 },
    burst: { mode: 'burst', shotsPerAttack: 3, accuracyPenalty: -15, apCost: 1.5, suppressionChance: 30 },
    auto: { mode: 'auto', shotsPerAttack: 5, accuracyPenalty: -25, apCost: 2, suppressionChance: 60 },
  };
  ```

□ Add to SimWeapon interface:
  ```typescript
  availableFireModes: FireMode[];  // e.g., ['single', 'burst'] for SMG
  currentFireMode?: FireMode;      // Currently selected mode
  ```

### 1B: Update weapon definitions
File: `MVP/src/combat/types.ts` (WEAPONS constant)

□ Add availableFireModes to each weapon:
  - pistol: ['single']
  - smg: ['single', 'burst', 'auto']
  - rifle: ['single', 'burst']
  - shotgun: ['single']
  - lmg: ['burst', 'auto']
  - sniper: ['single']

### 1C: Wire fire modes into attack resolution
File: `MVP/src/combat/core.ts`

□ Modify resolveAttack() to handle fire modes:
  ```typescript
  export function resolveAttack(
    attacker: SimUnit,
    target: SimUnit,
    distance?: number,
    roll?: number,
    fireMode?: FireMode  // NEW PARAMETER
  ): AttackResult {
    const mode = fireMode || 'single';
    const modeConfig = FIRE_MODES[mode];

    // Apply accuracy penalty
    const accuracy = calculateAccuracy(attacker, target, distance) + modeConfig.accuracyPenalty;

    // Multiple shots for burst/auto
    let totalDamage = 0;
    let hits = 0;
    for (let i = 0; i < modeConfig.shotsPerAttack; i++) {
      const shotRoll = Math.random() * 100;
      if (shotRoll < accuracy) {
        hits++;
        totalDamage += getBaseDamage(weapon, attacker);
      }
    }
    // ... rest of damage calculation
  }
  ```

□ Add suppression check after burst/auto:
  ```typescript
  // After damage resolution
  if (modeConfig.suppressionChance > 0 && hits > 0) {
    const suppressionResult = attemptSuppression(attacker, target, hits);
    result.suppression = suppressionResult;
  }
  ```

### 1D: Add fire mode UI to CombatScene
File: `MVP/src/game/scenes/CombatScene.ts`

□ Add fire mode toggle (F key or UI button)
□ Show current fire mode in unit info panel
□ Update AP cost display based on fire mode
□ Visual indicator for suppressed units (-20 accuracy overlay)

### 1E: Balance testing
□ Run 100 battles with burst vs single - burst should win ~55% close range
□ Run 100 battles with auto suppression - suppressed units should lose ~65%
□ Verify AP costs feel right (burst = 1.5x, auto = 2x)

---

## PHASE 2: WEAPON DATABASE INTEGRATION [HIGH PRIORITY]
Goal: Wire 70+ weapons from weapons.ts into combat

### 2A: Create weapon adapter
File: `MVP/src/combat/weaponAdapter.ts` (NEW)

□ Create function to convert weapons.ts format to SimWeapon:
  ```typescript
  import { WEAPONS } from '../data/weapons';
  import { SimWeapon, FireMode } from './types';

  export function getSimWeapon(weaponId: string): SimWeapon {
    const weapon = WEAPONS.find(w => w.id === weaponId);
    if (!weapon) return DEFAULT_RIFLE;

    return {
      name: weapon.name,
      damage: weapon.damageMax,  // or average
      damageType: mapDamageType(weapon.damageType),
      range: { min: weapon.rangeMin, optimal: weapon.rangeOptimal, max: weapon.rangeMax },
      accuracy: weapon.accuracy,
      apCost: weapon.apCost || 2,
      knockbackForce: weapon.knockbackForce || 0,
      availableFireModes: inferFireModes(weapon),
    };
  }

  function inferFireModes(weapon): FireMode[] {
    if (weapon.specialEffects?.includes('Full-auto capable')) return ['single', 'burst', 'auto'];
    if (weapon.specialEffects?.includes('Burst fire capable')) return ['single', 'burst'];
    return ['single'];
  }
  ```

### 2B: Update CombatScene to use adapter
File: `MVP/src/game/scenes/CombatScene.ts`

□ Replace internal WEAPONS constant with adapter calls
□ Load weapon from character.equipment when spawning units
□ Fallback to default weapon if not found

### 2C: Test weapon variety
□ Spawn units with different weapons (pistol, SMG, rifle, shotgun, sniper)
□ Verify damage ranges match weapons.ts definitions
□ Verify range brackets work correctly

---

## PHASE 3: FREE MOVEMENT [LARGE]
Goal: Move freely before enemy contact (JA2 signature feature)

### 3A: Add combat phase state
File: `MVP/src/game/scenes/CombatScene.ts`

□ Add combat phase enum:
  ```typescript
  type CombatPhase = 'exploration' | 'combat';
  ```

□ Add phase tracking:
  ```typescript
  private combatPhase: CombatPhase = 'exploration';
  private enemySpotted: boolean = false;
  ```

### 3B: Modify movement during exploration
□ During 'exploration' phase:
  - Movement costs 0 AP (or reduced cost)
  - No turn order - all friendlies can move
  - Running allowed (double movement speed)

□ Transition to 'combat' when:
  - Any enemy enters line of sight
  - Any enemy spots a friendly
  - Player initiates attack

### 3C: First contact handling
□ When enemy spotted:
  ```typescript
  private triggerCombatPhase(spottedEnemy: Unit, spotter: Unit) {
    this.combatPhase = 'combat';
    this.emitToUI('combat-log', {
      message: `${spotter.name} spotted ${spottedEnemy.name}!`,
      type: 'alert'
    });
    // Play alert sound
    this.soundManager.playSound('alert');
    // Pause for dramatic effect
    // Roll initiative / set turn order
    this.initializeTurnOrder();
  }
  ```

### 3D: UI indicators
□ Show "EXPLORATION" or "COMBAT" phase indicator
□ Different movement overlay color during exploration (green vs yellow)
□ Alert popup when combat starts

### 3E: Test exploration phase
□ Verify free movement works before contact
□ Verify combat triggers correctly on sight
□ Verify turn order initializes properly

---

## PHASE 4: STRATEGIC SYSTEMS [MEDIUM PRIORITY]

### 4A: Multiple Squads
File: `MVP/src/stores/enhancedGameStore.ts`

□ Change from single `characters` array to `squads`:
  ```typescript
  interface Squad {
    id: string;
    name: string;
    members: string[];  // Character IDs
    sector: string;
    status: 'idle' | 'traveling' | 'on_mission' | 'in_combat';
    vehicle?: string;
  }

  squads: Squad[];
  activeSquadId: string;
  ```

□ Update all character operations to be squad-aware
□ Allow squad splitting/merging

### 4B: Militia System
File: `MVP/src/data/militiaSystem.ts` (NEW)

□ Create militia training system:
  ```typescript
  interface SectorMilitia {
    sectorId: string;
    strength: number;      // 0-100
    training: number;      // 0-100 (affects combat effectiveness)
    equipment: number;     // 0-100 (affects DR, damage)
    loyalty: number;       // 0-100 (affects desertion)
    lastBattle?: number;   // Game day
  }
  ```

□ Wire militia to sector defense
□ Add militia training action for characters

### 4C: Territory Control
□ Track which faction controls each sector
□ Contested sectors trigger battles
□ Income/resources from controlled sectors

### 4D: Base Building Mechanics
File: `MVP/src/stores/enhancedGameStore.ts`

□ Wire facility effects to gameplay:
  - Training Room: +X% training speed (DONE)
  - Medical Bay: +X% healing speed
  - Workshop: Repair/craft equipment
  - Armory: Store extra weapons
  - Prison: Interrogate captives

---

## PHASE 5: BALANCE & PLAYTEST

### 5A: Combat Balance Tests
□ Run 1000 simulated battles with varied loadouts
□ Check win rates by weapon type:
  - Rifles should dominate at medium range (60% win)
  - SMGs should dominate close range (65% win)
  - Snipers should dominate long range (70% win)
  - Shotguns should be devastating close (75% win) but useless far (20% win)

### 5B: Fire Mode Balance
□ Single fire: Most accurate, lowest DPS
□ Burst fire: Medium accuracy, higher DPS, some suppression
□ Auto fire: Lowest accuracy, highest DPS, strong suppression
□ Each mode should have clear use case

### 5C: Economy Balance
□ Verify mission rewards feel appropriate
□ Check equipment costs vs power level
□ Ensure player can't cheese economy

### 5D: Time Balance
□ Verify game pacing (missions per day, recovery times)
□ Check that urgent events feel urgent
□ Ensure downtime activities are worthwhile

---

## COMPLETION CRITERIA
- [ ] All PHASE 1 tasks complete (fire modes)
- [ ] All PHASE 2 tasks complete (weapon database)
- [ ] All PHASE 3 tasks complete (free movement)
- [ ] All PHASE 4 tasks complete (strategic systems)
- [ ] All PHASE 5 balance tests pass
- [ ] Build passes with no TypeScript errors
- [ ] Manual playtest confirms fun factor

## CURRENT ITERATION: ___
## LAST COMPLETED: ___
```

---

## QUICK REFERENCE

### Files to Modify
| File | Changes |
|------|---------|
| `combat/types.ts` | FireMode type, FIRE_MODES config |
| `combat/core.ts` | resolveAttack with fire modes, suppression |
| `combat/weaponAdapter.ts` | NEW - convert weapons.ts to SimWeapon |
| `game/scenes/CombatScene.ts` | Fire mode UI, free movement, combat phases |
| `stores/enhancedGameStore.ts` | Multiple squads, facility effects |
| `data/militiaSystem.ts` | NEW - militia training and control |

### Balance Targets
| Metric | Target |
|--------|--------|
| Burst accuracy penalty | -15% |
| Auto accuracy penalty | -25% |
| Suppression duration | 2 turns |
| Suppression accuracy penalty | -20% |
| Exploration movement cost | 0 AP |
| Combat movement cost | 1 AP per tile |

### Test Commands
```bash
# Build check
cd MVP && npm run build

# Run combat simulator (if exists)
npm run test:combat

# Start dev server for manual testing
npm run dev
```

---

## RUN COMMAND

```bash
# Start the Ralph Wiggum loop
claude "Execute the Ralph Wiggum loop from .claude/ralph-wiggum/combat-polish-loop.md. Start with Phase 1A (fire modes). After each task, verify build passes and mark complete."
```

Or copy the RALPH WIGGUM LOOP PROMPT section and paste directly.
