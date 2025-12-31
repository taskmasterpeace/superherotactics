/**
 * CombatScene Combat Completion Patch
 *
 * Add this code to CombatScene.ts to emit enhanced combat results:
 *
 * 1. Add import at top of file:
 *    import { buildEnhancedCombatResult, logCombatResultSummary } from './CombatResultsBuilder'
 *    import { EnhancedCombatResult } from '../EventBridge'
 *
 * 2. Add private property to store mission context:
 *    private missionContext?: { sector: string; city: string; country: string };
 *
 * 3. Replace the declareCombatEnd method with this enhanced version:
 */

/*
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

  // Log summary to console
  logCombatResultSummary(enhancedResult);

  // Emit log entry
  EventBridge.emit('log-entry', {
    id: `victory_${Date.now()}`,
    timestamp: Date.now(),
    type: 'system',
    actor: 'System',
    message: `🏆 VICTORY! ${emoji} ${winnerName} WINS! 🏆`,
  });

  // Emit legacy combat-ended event (for backwards compatibility)
  EventBridge.emit('combat-ended', {
    winner,
    round: this.roundNumber,
  });

  // Emit new enhanced combat result event
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
*/

/**
 * 4. Update the create() method to set mission context:
 *
 * Add after line that sets up combat scene:
 */

/*
// Get mission context from game store if available
const gameStore = (window as any).__GAME_STORE__;
if (gameStore && gameStore.pendingMission) {
  this.missionContext = {
    sector: gameStore.currentSector || 'unknown',
    city: gameStore.pendingMission.city || 'unknown',
    country: gameStore.selectedCountry || 'unknown'
  };
}
*/

export const COMBAT_SCENE_PATCH_INSTRUCTIONS = `
COMBAT SCENE INTEGRATION INSTRUCTIONS
======================================

To integrate combat results with strategic layer:

1. Open C:\\git\\sht\\MVP\\src\\game\\scenes\\CombatScene.ts

2. Add imports at the top (around line 14):
   import { buildEnhancedCombatResult, logCombatResultSummary } from './CombatResultsBuilder'
   import { EnhancedCombatResult } from '../EventBridge'

3. Add property to store mission context (around line 700):
   private missionContext?: { sector: string; city: string; country: string };

4. In create() method, add mission context initialization (after line 1600):
   // Get mission context from pending mission
   const gameStore = (window as any).__GAME_STORE__;
   if (gameStore && gameStore.pendingMission) {
     this.missionContext = {
       sector: gameStore.currentSector || 'unknown',
       city: gameStore.pendingMission.city || 'unknown',
       country: gameStore.selectedCountry || 'unknown'
     };
   }

5. Replace declareCombatEnd method (around line 4711) with enhanced version that:
   - Calls buildEnhancedCombatResult() to construct result object
   - Emits 'combat-complete' event with EnhancedCombatResult
   - Logs summary to console

6. Wire up event listener in a component that mounts early (e.g., App.tsx):
   import { handleCombatComplete } from './stores/combatResultsHandler'

   useEffect(() => {
     const unsubscribe = EventBridge.on('combat-complete', handleCombatComplete)
     return unsubscribe
   }, [])
`;

// Export for documentation
export default COMBAT_SCENE_PATCH_INSTRUCTIONS;
