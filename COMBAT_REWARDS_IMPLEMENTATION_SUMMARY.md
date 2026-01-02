# Combat Results → Strategic Layer Integration

## Summary

Successfully designed and implemented a comprehensive system to connect tactical combat outcomes in `CombatScene.ts` to the strategic layer (`enhancedGameStore.ts`), enabling full gameplay loop integration.

## What Was Implemented

### 1. Enhanced Combat Result Data Structure
**File**: `C:\git\sht\MVP\src\game\EventBridge.ts`

Added `EnhancedCombatResult` interface containing:
- Victory/defeat status
- Detailed casualties (character ID, name, killed by)
- Injuries with severity, body part, healing time
- Survivor statistics (HP, damage dealt/taken, kills)
- Experience points breakdown
- Loot gained
- Fame and public opinion changes
- Mission context (sector, city, country)
- Combat statistics (accuracy, collateral damage, civilian casualties)

### 2. Combat Results Handler
**File**: `C:\git\sht\MVP\src\stores\combatResultsHandler.ts`

Core processing functions:

#### `calculateCombatXP()`
Awards experience points based on:
- **Survival**: 10 XP base
- **Kills**: 20 XP per kill
- **Damage Dealt**: 1 XP per 10 damage
- **Victory Bonus**: +50% XP
- **Long Combat Penalty**: -20% XP if > 10 rounds

#### `generateCombatLoot()`
Random loot generation:
- **Weapons**: 30% + 5% per enemy
- **Armor**: 20% + 3% per enemy
- **Gadgets**: 15% chance
- **Consumables**: 1 medkit per 2 enemies

Drops actual equipment from game data (weapons.ts, armor.ts)

#### `calculateFameChange()`
Fame system:
- **Victory**: +15 to +25 base fame
- **Clean Victory** (no civilians): +10 bonus
- **Civilian Casualties**: -10 fame each
- **Collateral Damage**: -1 fame per $10k damage
- **High Fame Diminishing Returns**: 50% reduction above 500 fame
- **Defeat**: -20 to -35 fame

#### `handleCombatComplete()` - Master Function
Orchestrates all strategic updates:
1. Calculates XP, loot, and fame
2. Updates character states (dead/injured/ready)
3. Adds injuries to character records
4. Distributes XP to survivors
5. Advances game time (~5 min per combat round)
6. Generates news article (if mission context available)
7. Shows toast notifications for all outcomes

### 3. Combat Results Builder
**File**: `C:\git\sht\MVP\src\game\scenes\CombatResultsBuilder.ts`

Utility to construct `EnhancedCombatResult` from CombatScene state:

#### `buildEnhancedCombatResult()`
- Iterates through all units to classify casualties vs survivors
- Extracts injuries from unit injury system
- Aggregates combat statistics
- Estimates collateral damage based on shots fired
- Randomly generates civilian casualties (10% chance, 0-2 casualties)
- Calculates accuracy rate
- Estimates combat duration

#### `logCombatResultSummary()`
Prints comprehensive formatted summary to console:
```
============================================================
COMBAT RESULTS SUMMARY
============================================================
Outcome: VICTORY (blue team wins)
Duration: 5 rounds (32 minutes)
Accuracy: 65.2%

Casualties: 2
  - Red Guard 1 (dead) killed by Alpha Squad Leader
  - Red Guard 2 (dead) killed by Charlie Sniper

Survivors: 4
  - Alpha Squad Leader: 45/70 HP, 1 kills, 85 dmg
  ...

Injuries: 1
  - Alpha Squad Leader: MODERATE torso - Gunshot wound

Fame Change: +12
Collateral Damage: $8,450
Civilian Casualties: 0
============================================================
```

## Integration Points

### CombatScene.ts Changes Required

1. **Add imports**:
```typescript
import { EnhancedCombatResult } from '../EventBridge';
import { buildEnhancedCombatResult, logCombatResultSummary } from './CombatResultsBuilder';
```

2. **Add mission context property**:
```typescript
private missionContext?: { sector: string; city: string; country: string };
```

3. **Capture mission context in create()**:
```typescript
const gameStore = (window as any).__GAME_STORE__;
if (gameStore && gameStore.pendingMission) {
  this.missionContext = {
    sector: gameStore.currentSector || 'unknown',
    city: gameStore.pendingMission.city || 'unknown',
    country: gameStore.selectedCountry || 'unknown'
  };
}
```

4. **Update declareCombatEnd() to emit enhanced results**:
```typescript
const enhancedResult = buildEnhancedCombatResult(
  winner,
  this.roundNumber,
  this.units,
  this.combatStats,
  this.missionContext
);
logCombatResultSummary(enhancedResult);
EventBridge.emit('combat-complete', enhancedResult);
```

### App.tsx Integration

Wire up event listener:
```typescript
useEffect(() => {
  const unsubscribe = EventBridge.on('combat-complete', handleCombatComplete);
  return unsubscribe;
}, []);
```

### Game Store Exposure

Add to `enhancedGameStore.ts`:
```typescript
if (typeof window !== 'undefined') {
  (window as any).__GAME_STORE__ = useGameStore.getState();
  useGameStore.subscribe(() => {
    (window as any).__GAME_STORE__ = useGameStore.getState();
  });
}
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     TACTICAL COMBAT LAYER                   │
│                     (CombatScene.ts)                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Combat Ends
                         │
                         v
         ┌───────────────────────────────┐
         │  declareCombatEnd(winner)     │
         │  - Calls buildEnhancedResult  │
         │  - Logs summary               │
         │  - Emits 'combat-complete'    │
         └───────────────┬───────────────┘
                         │
                         │ EnhancedCombatResult
                         │
                         v
         ┌───────────────────────────────┐
         │      EventBridge              │
         │   'combat-complete' event     │
         └───────────────┬───────────────┘
                         │
                         │
                         v
┌─────────────────────────────────────────────────────────────┐
│                  STRATEGIC LAYER                            │
│              (combatResultsHandler.ts)                      │
│                                                             │
│  handleCombatComplete():                                   │
│    1. calculateCombatXP()                                   │
│    2. generateCombatLoot()                                  │
│    3. calculateFameChange()                                 │
│    4. Update characters (HP, status, XP, injuries)          │
│    5. Advance game time                                     │
│    6. Generate news article                                 │
│    7. Show toast notifications                              │
│    8. Update budget (victory bonus)                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ State Updates
                         │
                         v
         ┌───────────────────────────────┐
         │   enhancedGameStore           │
         │   - characters[]              │
         │   - playerFame                │
         │   - gameTime                  │
         │   - newsArticles[]            │
         │   - budget                    │
         └───────────────┬───────────────┘
                         │
                         │ State Change
                         │
                         v
┌─────────────────────────────────────────────────────────────┐
│                     REACT UI LAYER                          │
│         - Character screens update                          │
│         - News browser shows new article                    │
│         - Time advances                                     │
│         - Toast notifications appear                        │
└─────────────────────────────────────────────────────────────┘
```

## Example Output

### Toast Notifications Sequence
```
1. 🎉 VICTORY! 5 rounds
2. +12 Fame
3. Alpha Squad Leader: +45 XP (survival, 1 kill, damage dealt, victory)
4. Bravo Heavy Gunner: +35 XP (survival, damage dealt, victory)
5. Charlie Sniper: +55 XP (survival, 1 kill, damage dealt, victory)
6. Delta Demolitions: +30 XP (survival, damage dealt, victory)
7. Loot: 1x Energy Pistol, 2x Frag Grenade, 1x Medkit
8. 📰 News: Vigilante Heroes Thwart Criminal Gang in Downtown Clash
```

### Character State Updates
```typescript
// BEFORE COMBAT
{
  id: 'soldier-001',
  name: 'Alpha Squad Leader',
  health: { current: 70, maximum: 70 },
  status: 'ready',
  experience: 0,
  injuries: []
}

// AFTER COMBAT
{
  id: 'soldier-001',
  name: 'Alpha Squad Leader',
  health: { current: 45, maximum: 70 },  // Took damage
  status: 'injured',                     // Dropped below 50% HP
  experience: 45,                        // +45 XP
  injuries: [
    {
      bodyPart: 'torso',
      severity: 'MODERATE',
      description: 'Gunshot wound to torso',
      healingTime: 3,                   // 3 days to recover
      permanent: false
    }
  ]
}
```

### News Article Generated
```typescript
{
  id: 'news-1734456789',
  headline: 'Vigilante Heroes Thwart Criminal Gang in Downtown Clash',
  source: 'Local News Network',
  category: 'crime',
  bias: 'pro-player',
  timestamp: 2580,  // Game time in minutes
  fameImpact: +12,
  publicOpinionShift: { 'United States': +10 }
}
```

## Testing Procedure

### 1. Quick Test
```typescript
// In browser console after combat:
window.__GAME_STORE__.characters.forEach(c => {
  console.log(`${c.name}: ${c.status}, ${c.health.current}/${c.health.maximum} HP, ${c.experience || 0} XP`);
});
console.log('Fame:', window.__GAME_STORE__.playerFame);
console.log('News articles:', window.__GAME_STORE__.newsArticles.length);
```

### 2. Full Integration Test
1. Start combat from world map
2. Win/lose combat
3. Check console for combat summary
4. Verify toast notifications appear
5. Check character screen - HP updated, XP added, injuries listed
6. Check news browser - new article appears
7. Verify game time advanced
8. Check fame meter changed

## Future Enhancements

### Inventory System
Currently loot is generated but not stored in inventory:
```typescript
// Need to add to game store:
inventory: Array<{
  itemId: string;
  itemName: string;
  itemType: 'weapon' | 'armor' | 'gadget' | 'consumable';
  quantity: number;
  acquiredDate: number;
}>
```

### Hospital/Recovery System
Characters marked 'hospitalized' need recovery tracking:
- Daily recovery checks
- Medical costs deducted from budget
- Hospital quality affects recovery speed (use combined effects system)
- Transfer to better hospitals in other countries

### Permanent Injury System
PERMANENT injuries should:
- Reduce max stats (MEL -5, AGL -10, etc.)
- Show visual indicators in character portraits
- Affect dialogue/reactions from other characters
- Can be partially treated with advanced medical systems

### Death System
Proper death handling:
- Move to "fallen heroes" memorial
- Trigger special news coverage
- Impact team morale
- Equipment recovered goes to inventory

### Context-Aware Rewards
Mission-specific rewards:
- Hostage rescue → reputation bonus
- Gang bust → gang weapons loot
- Corporate raid → tech gadgets
- Government facility → classified intel

## Files Created

```
C:\git\sht\MVP\src\
├── game/
│   ├── EventBridge.ts                              [UPDATED]
│   └── scenes/
│       ├── CombatResultsBuilder.ts                 [NEW]
│       └── CombatScenePatch.ts                     [NEW - Reference]
├── stores/
│   └── combatResultsHandler.ts                     [NEW]
├── integration/
│   └── README_COMBAT_INTEGRATION.md                [NEW - Documentation]
└── COMBAT_REWARDS_IMPLEMENTATION_SUMMARY.md        [NEW - This file]
```

## Status

✅ **Design Complete**: All interfaces and data structures defined
✅ **Handler Complete**: Full combat results processing implementation
✅ **Builder Complete**: CombatScene result extraction ready
✅ **Documentation Complete**: Integration guide and examples provided

⏳ **Pending**: Manual code changes in CombatScene.ts and App.tsx (see README_COMBAT_INTEGRATION.md)

## Key Design Decisions

### 1. XP Formula Balance
- Base 10 XP encourages participation
- Kill bonus incentivizes aggressive play (20 XP)
- Damage XP rewards tactical play even without kills
- Victory bonus rewards team coordination (+50%)
- Long combat penalty discourages grinding (-20% after 10 rounds)

### 2. Loot Generation
- Probabilistic to maintain scarcity
- Scales with enemy count (more enemies = better loot)
- Always provides some medkits for healing
- Uses actual game data (weapons.ts, armor.ts) for consistency

### 3. Fame System
- Victory gives substantial fame boost (+15-25)
- Clean victory (no civilians) rewarded (+10)
- Civilian casualties heavily penalized (-10 each)
- Diminishing returns prevent fame inflation
- Defeat has meaningful consequences (-20-35)

### 4. Time System
- ~5 minutes per combat round is realistic
- Variable duration prevents predictability
- Time advancement triggers other systems (recovery, events)

### 5. Separation of Concerns
- **CombatScene**: Pure combat logic, minimal dependencies
- **ResultsBuilder**: Extraction layer, converts Phaser state to data
- **ResultsHandler**: Business logic, no Phaser dependencies
- **EventBridge**: Clean communication channel

This architecture keeps combat tactical layer decoupled from strategic layer while enabling rich integration.

---

**Implementation Date**: 2025-12-17
**Status**: Ready for integration
**Next Steps**: Apply code changes per README_COMBAT_INTEGRATION.md
