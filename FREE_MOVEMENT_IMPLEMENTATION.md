# Free Movement Mode Implementation

## Overview
Implemented free movement mode before enemy contact in CombatScene.ts. Units can now move freely (no AP cost) until an enemy is spotted, at which point combat is initiated with a "CONTACT!" alert and initiative rolls.

## Changes Made

### 1. Added Combat State Variable
**Location**: Line 749
**Change**: Added `private combatActive: boolean = false;`

This flag controls whether the game is in free movement mode (false) or turn-based combat mode (true).

### 2. Modified Movement AP Cost
**Location**: Lines 3820-3826
**Change**: Movement only consumes AP when combat is active

```typescript
// Free movement until combat starts
if (this.combatActive) {
  unit.ap -= distance;
}
// else: movement costs 0 AP during free movement phase
```

### 3. Added Enemy Detection After Movement
**Location**: Lines 3868-3871
**Change**: Check for enemy contact after each movement completes

```typescript
// Check for enemy contact during free movement phase
if (!this.combatActive) {
  this.checkEnemyContact(unit);
}
```

### 4. Created Enemy Contact Detection System
**Location**: Lines 3514-3724
**New Methods**:

#### `checkEnemyContact(unit: Unit)`
- Called after each movement when not in combat
- Checks if moving unit can see any enemies (bi-directional LOS check)
- Triggers combat initiation if enemy is spotted

#### `initiateCombat(spotter: Unit, spotted: Unit)`
- Sets `combatActive = true`
- Shows CONTACT! alert
- Rolls initiative for all units
- Determines which team goes first
- Restores AP for all units
- Updates fog of war
- Emits combat-initiated event

#### `showContactAlert(spotter: Unit, spotted: Unit)`
- Displays large "⚠️ CONTACT! ⚠️" text with animation
- Draws red line between spotter and spotted units
- Auto-destroys after 2 seconds

#### `rollInitiative()`
- Rolls 1d20 + INS (Insight) stat for each living unit
- Logs initiative rolls to combat log
- Sorts units by initiative (highest first)

#### `determineFirstTeam()`
- Compares best initiative roll from each team
- Team with highest initiative goes first
- Emits turn-changed event

### 5. Reset Combat State on Victory
**Location**: Line 5377
**Change**: Added `this.combatActive = false;` in `declareCombatEnd()`

When combat ends (all enemies defeated), the system returns to free movement mode. This allows for sequential encounters if new enemies appear.

## Gameplay Flow

### Before Combat (Free Movement)
1. Combat starts with `combatActive = false`
2. Units can move unlimited distance (no AP cost)
3. No turn-based restrictions
4. Movement is checked after completion

### Enemy Contact Triggers
- When a moving unit gains line of sight to an enemy, OR
- When an enemy already has line of sight to the moving unit

### Combat Initiation Sequence
1. "⚠️ CONTACT! ⚠️" alert appears on screen
2. Red line drawn between spotter and spotted
3. Initiative rolled for all units (1d20 + INS)
4. Team with highest initiative goes first
5. All units receive full AP
6. Turn-based combat begins

### After Combat
- When all enemies are defeated
- `combatActive` resets to `false`
- Free movement resumes if mission continues

## Technical Details

### Initiative System
- Formula: `1d20 + INS stat`
- Default INS: 50
- Higher INS = better chance to go first
- Rolls logged to combat log

### Line of Sight Detection
- Uses existing `hasLineOfSight()` method
- Bi-directional check (both units can spot each other)
- Blocked by WALL and DOOR_CLOSED terrain
- Raycasting algorithm (Bresenham's line)

### Event Emissions
- `combat-initiated` - When contact occurs
- `log-entry` - Initiative rolls and contact message
- `turn-changed` - When first team is determined

## Testing Checklist

- [ ] Units move freely at start of combat (no AP consumption)
- [ ] "CONTACT!" alert appears when enemy spotted
- [ ] Initiative rolls appear in combat log
- [ ] Correct team goes first based on initiative
- [ ] AP system activates after contact
- [ ] Free movement resumes after all enemies defeated
- [ ] Bi-directional detection works (either side can spot)
- [ ] Alert animation plays correctly
- [ ] Red line appears between spotter/spotted

## Files Modified

- `C:\git\sht\MVP\src\game\scenes\CombatScene.ts` (235 lines added)
  - 1 new state variable
  - 1 modified movement cost calculation
  - 1 new detection trigger
  - 5 new methods for combat initiation

## Compatibility Notes

- Works with existing fog of war system
- Compatible with AI vs AI mode
- Integrates with current turn management
- Uses existing EventBridge for React communication
- Maintains existing combat mechanics after initiation

## Future Enhancements

Potential improvements (not yet implemented):

1. **Stealth System**: Add awareness/detection ranges based on unit stats
2. **Surprise Round**: Unit that spots first gets bonus turn
3. **Overwatch Interruption**: Allow units to react during free movement
4. **Detection Sound**: Add audio cue when contact occurs
5. **Partial Information**: Hide exact enemy positions until spotted
6. **Movement Noise**: Faster movement = easier to detect

---

*Implementation completed: December 17, 2025*
