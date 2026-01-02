# Shield System - Manual Completion Steps

## Current Status
✅ Unit interface updated with shield fields
✅ spawnUnit initializes shield values
✅ Damage absorption implemented (4 locations):
  - Attack damage (tryAttackUnit)
  - Grenade/explosion damage
  - Status effect DOT damage
  - Grapple damage

⚠️ **2 manual steps required due to file auto-formatting**

---

## STEP 1: Add Shield Regeneration

**File**: `MVP/src/game/scenes/CombatScene.ts`
**Location**: Around line 5441
**Find this code**:
```typescript
// Reduce power cooldowns for current team
this.reducePowerCooldowns(this.currentTeam);

// Select first unit of current team that can act
```

**Insert this code between them**:
```typescript
// Regenerate shields for current team
const teamUnits = Array.from(this.units.values()).filter(u => u.team === this.currentTeam && u.hp > 0);
for (const unit of teamUnits) {
  if (unit.shieldRegen > 0 && unit.shield < unit.maxShield) {
    const oldShield = unit.shield;
    unit.shield = Math.min(unit.maxShield, unit.shield + unit.shieldRegen);
    const regenAmount = unit.shield - oldShield;
    if (regenAmount > 0) {
      this.updateHealthBar(unit);
      this.emitToUI('combat-log', {
        message: `🛡️ ${unit.name}'s shield regenerates +${regenAmount} (${unit.shield}/${unit.maxShield})`,
        type: 'status'
      });
    }
  }
}
```

---

## STEP 2: Update Health Bar to Show Shields

**File**: `MVP/src/game/scenes/CombatScene.ts`
**Location**: Around line 1986
**Find this function**:
```typescript
private updateHealthBar(unit: Unit): void {
  if (!unit.healthBar || !unit.sprite) return;

  unit.healthBar.clear();
  const barWidth = TILE_WIDTH / 2;
  const pixelX = unit.sprite.x - barWidth / 2;
  const spriteHeight = unit.sprite.displayHeight;
  const pixelY = unit.sprite.y - spriteHeight - 10;

  const healthPercent = unit.hp / unit.maxHp;
  let healthColor = COLORS.HEALTH_FULL;
  if (healthPercent < 0.25) healthColor = COLORS.HEALTH_LOW;
  else if (healthPercent < 0.5) healthColor = COLORS.HEALTH_HALF;

  unit.healthBar.fillStyle(healthColor, 1);
  unit.healthBar.fillRect(pixelX, pixelY, barWidth * healthPercent, 6);
}
```

**Replace with**:
```typescript
private updateHealthBar(unit: Unit): void {
  if (!unit.healthBar || !unit.sprite) return;

  unit.healthBar.clear();
  const barWidth = TILE_WIDTH / 2;
  const barHeight = 6;
  const pixelX = unit.sprite.x - barWidth / 2;
  const spriteHeight = unit.sprite.displayHeight;
  const pixelY = unit.sprite.y - spriteHeight - 10;

  // Draw HP bar
  const healthPercent = unit.hp / unit.maxHp;
  let healthColor = COLORS.HEALTH_FULL;
  if (healthPercent < 0.25) healthColor = COLORS.HEALTH_LOW;
  else if (healthPercent < 0.5) healthColor = COLORS.HEALTH_HALF;

  unit.healthBar.fillStyle(healthColor, 1);
  unit.healthBar.fillRect(pixelX, pixelY, barWidth * healthPercent, barHeight);

  // Draw shield bar overlay (above HP bar)
  if (unit.maxShield > 0 && unit.shield > 0) {
    const shieldPercent = unit.shield / unit.maxShield;
    const shieldWidth = barWidth * shieldPercent;
    unit.healthBar.fillStyle(0x00aaff, 0.8); // Cyan for shields
    unit.healthBar.fillRect(pixelX, pixelY - 3, shieldWidth, 2); // Thin bar above HP
  }
}
```

---

## Testing

Add a shielded test unit to verify the system works:

```typescript
// In MVP/src/game/scenes/CombatScene.ts, in spawnTestUnits()
this.spawnUnit({
  id: 'shield_test',
  name: 'Shield Tester',
  codename: 'Protected',
  team: 'blue',
  hp: 100,
  maxHp: 100,
  shield: 50,        // 50 shield HP
  maxShield: 50,
  shieldRegen: 10,   // Regenerates 10/turn
  ap: 6,
  maxAp: 6,
  position: { x: 2, y: 6 },
  facing: 90,
  statusEffects: [],
  weapon: 'rifle',
  personality: 'tactical',
  str: 60,
  agl: 70,
  acted: false,
  visible: true,
  spriteId: 'soldier_15',
});
```

**Expected behavior**:
1. Unit starts with cyan bar above red/green health bar
2. When taking damage:
   - Shield absorbs first
   - Floating text shows: `"HITS -30 (🛡️15)"`
3. Each turn, shield regenerates +10
4. Combat log shows: `"🛡️ Shield Tester's shield regenerates +10 (35/50)"`

---

## Integration with shieldItems.ts

Once manual steps are complete, connect to equipment system:

```typescript
import { SHIELD_ITEMS, calculateTotalProtection } from '../../data/shieldItems';

// When character equips items
const equippedItems = [
  SHIELD_ITEMS.find(s => s.id === 'SHD_001'), // Personal Force Field: 25 shield, 5 regen
  SHIELD_ITEMS.find(s => s.id === 'ARM_001'), // Tactical Vest: 10 DR physical
];

const protection = calculateTotalProtection(equippedItems.filter(Boolean));
// Result: { totalShield: 25, totalShieldRegen: 5, totalDrPhysical: 10, totalDrEnergy: 2 }

// Apply to combat unit
unit.shield = protection.totalShield;
unit.maxShield = protection.totalShield;
unit.shieldRegen = protection.totalShieldRegen;
unit.dr = protection.totalDrPhysical; // Physical DR (not yet implemented in damage calc)
```

---

## Verification Checklist

After manual steps:

- [ ] Shield regen code added after `reducePowerCooldowns()`
- [ ] Health bar function updated to draw shield overlay
- [ ] Test unit spawned with shield values
- [ ] Unit takes damage - shield absorbs first
- [ ] Overflow damage goes to HP
- [ ] Shield bar shows above health bar (cyan)
- [ ] Shield regenerates each turn
- [ ] Combat log shows regen message
- [ ] Shield broken message appears when shield drops to 0

---

## Files Reference

**Modified**:
- `MVP/src/game/scenes/CombatScene.ts` - Core combat with shield logic

**Data Sources** (no changes needed):
- `MVP/src/data/shieldItems.ts` - 15+ shields with stats
- `MVP/src/data/armor.ts` - Armor DR values (DR not yet applied in damage calc)

**Helper File** (created for reference):
- `MVP/src/game/shieldHelpers.ts` - Standalone shield functions

---

## Why Manual Steps Required

An aggressive auto-formatter or file watcher kept reverting changes to `CombatScene.ts`. The damage absorption logic was successfully added (4 locations), but the shield regeneration insertion and health bar update kept being reverted during automated edits.

**Solution**: Complete these 2 edits manually in your code editor with file watchers temporarily disabled.
