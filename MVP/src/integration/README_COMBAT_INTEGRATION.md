# Combat Results to Strategic Layer Integration

This integration connects combat completion in `CombatScene.ts` to the strategic layer (game store), enabling:

- Character injuries and casualties tracking
- XP and loot rewards
- Fame and reputation changes
- Game time advancement
- News generation from combat outcomes

## Files Created

### 1. C:\git\sht\MVP\src\game\EventBridge.ts
**Status**: ✅ UPDATED

Added `EnhancedCombatResult` interface with comprehensive combat outcome data:
- Victory status, casualties, injuries, survivors
- Experience and loot gains
- Fame and reputation changes
- Combat statistics (damage, accuracy, etc.)

### 2. C:\git\sht\MVP\src\stores\combatResultsHandler.ts
**Status**: ✅ CREATED

Main handler that processes combat results:
- `calculateCombatXP()` - Awards XP based on survival, kills, damage, victory
- `generateCombatLoot()` - Random loot drops based on enemy count
- `calculateFameChange()` - Fame shifts based on outcome, casualties, collateral damage
- `handleCombatComplete()` - Master function that updates all strategic layer state

### 3. C:\git\sht\MVP\src\game\scenes\CombatResultsBuilder.ts
**Status**: ✅ CREATED

Builds `EnhancedCombatResult` from CombatScene internal state:
- Collects casualties, survivors, injuries
- Aggregates combat statistics
- Estimates collateral damage and civilian casualties
- Logs comprehensive summary

## Integration Steps

### Step 1: Update CombatScene.ts

**File**: `C:\git\sht\MVP\src\game\scenes\CombatScene.ts`

#### 1a. Add imports (line ~14)

```typescript
import { EventBridge, Position, UnitData, ActionPayload, CombatCharacter, EnhancedCombatResult } from '../EventBridge';
// ... existing imports ...
import { buildEnhancedCombatResult, logCombatResultSummary } from './CombatResultsBuilder';
```

#### 1b. Add mission context property (line ~700, with other class properties)

```typescript
private combatEnded: boolean = false;
private missionContext?: { sector: string; city: string; country: string };
```

#### 1c. Update create() method to capture mission context (line ~1600, after combat initialization)

```typescript
create() {
  // ... existing setup code ...

  // Capture mission context for strategic integration
  const gameStore = (window as any).__GAME_STORE__;
  if (gameStore && gameStore.pendingMission) {
    this.missionContext = {
      sector: gameStore.currentSector || 'unknown',
      city: gameStore.pendingMission.city || 'unknown',
      country: gameStore.selectedCountry || 'unknown'
    };
  }

  // ... rest of create method ...
}
```

#### 1d. Replace declareCombatEnd() method (line ~4711)

Replace the existing `declareCombatEnd()` method with this enhanced version:

```typescript
private declareCombatEnd(winner: 'blue' | 'red'): void {
  if (this.combatEnded) return;
  this.combatEnded = true;

  const winnerName = winner === 'blue' ? 'BLUE TEAM' : 'RED TEAM';
  const emoji = winner === 'blue' ? '🔵' : '🔴';

  // Build enhanced combat result
  const enhancedResult: EnhancedCombatResult = buildEnhancedCombatResult(
    winner,
    this.roundNumber,
    this.units,
    this.combatStats,
    this.missionContext
  );

  // Log comprehensive summary to console
  logCombatResultSummary(enhancedResult);

  // Emit log entry
  EventBridge.emit('log-entry', {
    id: `victory_${Date.now()}`,
    timestamp: Date.now(),
    type: 'system',
    actor: 'System',
    message: `🏆 VICTORY! ${emoji} ${winnerName} WINS! 🏆`,
  });

  // Emit legacy combat-ended event (backwards compatibility)
  EventBridge.emit('combat-ended', {
    winner,
    round: this.roundNumber,
  });

  // Emit new enhanced combat-complete event
  EventBridge.emit('combat-complete', enhancedResult);

  // Show victory text on screen
  const centerX = this.cameras.main.width / 2;
  const centerY = this.cameras.main.height / 2;

  const victoryText = this.add.text(centerX, centerY, `${emoji} ${winnerName} WINS!`, {
    fontSize: '48px',
    color: winner === 'blue' ? '#4a90d9' : '#d94a4a',
    fontStyle: 'bold',
    stroke: '#000000',
    strokeThickness: 6,
  });
  victoryText.setOrigin(0.5);
  victoryText.setDepth(2000);

  this.tweens.add({
    targets: victoryText,
    scale: 1.2,
    duration: 500,
    yoyo: true,
    repeat: 2,
  });

  console.log(`[COMBAT] Combat ended! Winner: ${winner}`);
}
```

### Step 2: Wire up Event Handler

**File**: `C:\git\sht\MVP\src\App.tsx` (or main game component)

Add event listener for `combat-complete` event:

```typescript
import { EventBridge } from './game/EventBridge';
import { handleCombatComplete } from './stores/combatResultsHandler';

function App() {
  // ... existing code ...

  useEffect(() => {
    // Subscribe to combat completion events
    const unsubscribe = EventBridge.on('combat-complete', handleCombatComplete);

    return () => {
      unsubscribe();
    };
  }, []);

  // ... rest of component ...
}
```

### Step 3: Expose Game Store to Window (for mission context)

**File**: `C:\git\sht\MVP\src\stores\enhancedGameStore.ts`

Add at the bottom of the file:

```typescript
// Expose store to window for Phaser scene access
if (typeof window !== 'undefined') {
  (window as any).__GAME_STORE__ = useGameStore.getState();
  useGameStore.subscribe(() => {
    (window as any).__GAME_STORE__ = useGameStore.getState();
  });
}
```

## Testing the Integration

### Manual Test

1. Start a combat mission from the world map
2. Complete the combat (win or lose)
3. Check console for combat results summary
4. Verify strategic layer updates:
   - Characters have updated HP
   - Dead/injured characters marked
   - XP awarded to survivors
   - Fame changed
   - Game time advanced
   - News article generated (if mission context available)

### Console Output Example

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
  - Bravo Heavy Gunner: 60/80 HP, 0 kills, 42 dmg
  - Charlie Sniper: 55/60 HP, 1 kills, 120 dmg
  - Delta Demolitions: 65/65 HP, 0 kills, 25 dmg

Injuries: 1
  - Alpha Squad Leader: MODERATE torso - Gunshot wound to torso

Fame Change: +12
Collateral Damage: $8,450
Civilian Casualties: 0
============================================================
```

### Toast Notifications

After combat, you should see sequential toasts:
1. "🎉 VICTORY! 5 rounds"
2. "+12 Fame"
3. "Alpha Squad Leader: +45 XP (survival, 1 kill, damage dealt, victory)"
4. "Charlie Sniper: +55 XP (survival, 1 kill, damage dealt, victory)"
5. "Loot: 1x Energy Pistol, 2x Frag Grenade, 1x Medkit"
6. "📰 News: Vigilante Heroes Thwart Criminal Gang in Downtown Clash"

## Data Flow Diagram

```
CombatScene.ts (Phaser)
    |
    | declareCombatEnd()
    |
    v
buildEnhancedCombatResult()
    |
    | - Collects casualties, survivors, injuries
    | - Aggregates combat stats
    | - Estimates collateral damage
    |
    v
EventBridge.emit('combat-complete', enhancedResult)
    |
    |
    v
handleCombatComplete() [combatResultsHandler.ts]
    |
    | - Calculates XP
    | - Generates loot
    | - Calculates fame change
    | - Updates characters
    | - Advances time
    | - Generates news
    |
    v
enhancedGameStore (Zustand)
    |
    | - characters updated
    | - playerFame changed
    | - gameTime advanced
    | - newsArticles added
    | - budget updated
    |
    v
React UI Components Re-render
```

## Future Enhancements

### Inventory System
Currently loot is generated but not stored. Need to add:
- Inventory state in game store
- Equipment management UI
- Character loadout system

### Hospital System
Characters marked as 'hospitalized' need:
- Recovery tracking over game days
- Medical costs from budget
- Hospital quality based on location (combined effects system)

### Permanent Injuries
PERMANENT injuries should:
- Reduce max stats (MEL, AGL, etc.)
- Show in character sheet
- Affect character portrait/appearance

### Death System
Character deaths should:
- Remove from active roster (but keep in history)
- Trigger memorial/funeral events
- Impact team morale
- Generate special news coverage

### Mission-Specific Rewards
Context-aware rewards based on:
- Mission type (hostage rescue, gang bust, etc.)
- Enemy faction (unlocks faction-specific items)
- Mission difficulty
- Bonus objectives completed

## Troubleshooting

### "Cannot find module './CombatResultsBuilder'"
Make sure file exists at: `C:\git\sht\MVP\src\game\scenes\CombatResultsBuilder.ts`

### "handleCombatComplete is not a function"
Check import in App.tsx: `import { handleCombatComplete } from './stores/combatResultsHandler'`

### Combat results not processing
1. Check EventBridge listener is set up in App.tsx
2. Verify CombatScene is emitting 'combat-complete' event
3. Check console for error messages
4. Verify __GAME_STORE__ is exposed to window

### XP not showing
Check toast notifications are enabled and not being filtered. XP toasts have 3 second duration.

### Fame not changing
Verify `playerFame` in game store is being updated. Check console for fame calculation logs.

## File Locations Summary

```
C:\git\sht\MVP\src\
├── game/
│   ├── EventBridge.ts                          [UPDATED]
│   └── scenes/
│       ├── CombatScene.ts                      [NEEDS UPDATE]
│       ├── CombatResultsBuilder.ts             [CREATED]
│       └── CombatScenePatch.ts                 [REFERENCE]
├── stores/
│   ├── enhancedGameStore.ts                    [NEEDS UPDATE]
│   └── combatResultsHandler.ts                 [CREATED]
└── integration/
    └── README_COMBAT_INTEGRATION.md            [THIS FILE]
```

## Implementation Checklist

- [x] Create EnhancedCombatResult interface
- [x] Create combatResultsHandler.ts
- [x] Create CombatResultsBuilder.ts
- [ ] Update CombatScene.ts imports
- [ ] Add missionContext property to CombatScene
- [ ] Update declareCombatEnd() method
- [ ] Wire up event listener in App.tsx
- [ ] Expose game store to window
- [ ] Test combat completion flow
- [ ] Verify strategic layer updates
- [ ] Verify news generation
- [ ] Verify toast notifications

---

**Status**: Implementation complete, integration pending manual code changes in CombatScene.ts
**Last Updated**: 2025-12-17
