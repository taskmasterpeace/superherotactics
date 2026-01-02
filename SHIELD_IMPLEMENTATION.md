# Shield Absorption System Implementation

## Overview
Complete implementation guide for wiring shield absorption to CombatScene.ts. The combat file has an aggressive auto-formatter that reverts changes, so this provides the complete implementation in one document.

---

## Part 1: Unit Interface (Line ~607)

**Add these fields to the Unit interface:**

```typescript
interface Unit {
  id: string;
  name: string;
  codename: string;
  team: 'blue' | 'red' | 'green';
  hp: number;
  maxHp: number;
  shield: number; // ADD THIS - Current shield HP
  maxShield: number; // ADD THIS - Maximum shield HP
  shieldRegen: number; // ADD THIS - Shield regeneration per turn
  ap: number;
  maxAp: number;
  // ... rest of fields

  // In Phaser objects section:
  sprite?: Phaser.GameObjects.Sprite;
  healthBar?: Phaser.GameObjects.Graphics;
  healthBarBg?: Phaser.GameObjects.Rectangle;
  shieldBar?: Phaser.GameObjects.Graphics; // ADD THIS - Shield bar overlay
  nameText?: Phaser.GameObjects.Text;
  // ... rest of Phaser fields
}
```

---

## Part 2: spawnUnit Function (Line ~1725)

**Add shield initialization:**

```typescript
private spawnUnit(unitData: Partial<Unit> & { id: string; name: string; team: 'blue' | 'red' | 'green'; position: Position }): void {
  const unit: Unit = {
    id: unitData.id,
    name: unitData.name,
    codename: unitData.codename || unitData.name,
    team: unitData.team,
    hp: unitData.hp ?? 100,
    maxHp: unitData.maxHp ?? 100,
    shield: unitData.shield ?? (unitData.maxShield ?? 0), // ADD THIS
    maxShield: unitData.maxShield ?? 0, // ADD THIS
    shieldRegen: unitData.shieldRegen ?? 0, // ADD THIS
    ap: unitData.ap ?? 6,
    maxAp: unitData.maxAp ?? 6,
    // ... rest of initialization
  };
  // ... rest of function
}
```

---

## Part 3: Damage Application - Main Attack (Line ~3958)

**Replace the damage application section in tryAttackUnit:**

**FIND:**
```typescript
if (didHit) {
  target.hp = Math.max(0, target.hp - damage);
  this.updateHealthBar(target);

  // Floating damage text with verb-appropriate styling
  let textContent = '';
  let fontSize = '16px';
  let textColor = '#ffff00';

  if (isCrit) {
    textContent = `${verbs.crit}! -${damage}`;
    fontSize = '22px';
    textColor = '#ff0000';
  } else if (isGraze) {
    textContent = `${verbs.graze} -${damage}`;
    fontSize = '14px';
    textColor = '#ffaa00';
  } else {
    textContent = `${verbs.hit} -${damage}`;
    fontSize = '16px';
    textColor = '#ffff00';
  }
```

**REPLACE WITH:**
```typescript
if (didHit) {
  // Apply damage with shield absorption
  let shieldDamage = 0;
  let hpDamage = damage;
  let shieldBroken = false;

  if (target.shield > 0) {
    shieldDamage = Math.min(target.shield, damage);
    target.shield -= shieldDamage;
    hpDamage = damage - shieldDamage;

    if (target.shield <= 0) {
      target.shield = 0;
      shieldBroken = true;
    }
  }

  if (hpDamage > 0) {
    target.hp = Math.max(0, target.hp - hpDamage);
  }

  this.updateHealthBar(target);

  // Floating damage text with verb-appropriate styling
  let textContent = '';
  let fontSize = '16px';
  let textColor = '#ffff00';

  if (isCrit) {
    textContent = `${verbs.crit}! -${damage}`;
    if (shieldDamage > 0) {
      textContent += ` (🛡️${shieldDamage}${shieldBroken ? ' BROKEN!' : ''})`;
    }
    fontSize = '22px';
    textColor = '#ff0000';
  } else if (isGraze) {
    textContent = `${verbs.graze} -${damage}`;
    if (shieldDamage > 0) {
      textContent += ` (🛡️${shieldDamage})`;
    }
    fontSize = '14px';
    textColor = '#ffaa00';
  } else {
    textContent = `${verbs.hit} -${damage}`;
    if (shieldDamage > 0) {
      textContent += ` (🛡️${shieldDamage}${shieldBroken ? ' BROKEN!' : ''})`;
    }
    fontSize = '16px';
    textColor = '#ffff00';
  }
```

---

## Part 4: Damage Application - Grenades (Line ~2800)

**FIND:**
```typescript
const damage = Math.floor(grenadeType.damageAtCenter * (1 - distance / (grenadeType.blastRadius + 1)));
if (damage > 0) {
  unit.hp -= damage;
  this.updateHealthBar(unit);
  if (unit.hp <= 0) {
    this.killUnit(unit, `${grenadeType.name} explosion`);
  }
  EventBridge.emit('log-entry', {
    id: `explosion_${Date.now()}_${unit.id}`,
    timestamp: Date.now(),
    type: 'damage',
    actor: thrower.name,
    target: unit.name,
    message: `💥 ${unit.name} takes ${damage} damage!`,
  });
}
```

**REPLACE WITH:**
```typescript
const damage = Math.floor(grenadeType.damageAtCenter * (1 - distance / (grenadeType.blastRadius + 1)));
if (damage > 0) {
  // Apply damage with shield absorption
  let shieldDamage = 0;
  let hpDamage = damage;
  let shieldBroken = false;

  if (unit.shield > 0) {
    shieldDamage = Math.min(unit.shield, damage);
    unit.shield -= shieldDamage;
    hpDamage = damage - shieldDamage;

    if (unit.shield <= 0) {
      unit.shield = 0;
      shieldBroken = true;
    }
  }

  if (hpDamage > 0) {
    unit.hp -= hpDamage;
  }

  this.updateHealthBar(unit);
  if (unit.hp <= 0) {
    this.killUnit(unit, `${grenadeType.name} explosion`);
  }

  let damageMessage = `💥 ${unit.name} takes ${damage} damage!`;
  if (shieldDamage > 0) {
    damageMessage += ` (🛡️${shieldDamage} absorbed${shieldBroken ? ', shield BROKEN' : ''})`;
  }

  EventBridge.emit('log-entry', {
    id: `explosion_${Date.now()}_${unit.id}`,
    timestamp: Date.now(),
    type: 'damage',
    actor: thrower.name,
    target: unit.name,
    message: damageMessage,
  });
}
```

---

## Part 5: Damage Application - Status Effects/DOT (Line ~2220)

**FIND:**
```typescript
// Apply DOT damage
if (result.damage > 0) {
  unit.hp -= result.damage;
  this.updateHealthBar(unit);

  // Show floating damage
  const screenPos = gridToScreen(unit.position.x, unit.position.y, this.offsetX, this.offsetY);
  this.showFloatingDamage(screenPos.x, screenPos.y, result.damage, 0xff0000);

  // Check for death from DOT
  if (unit.hp <= 0) {
    this.killUnit(unit, 'Status Effect');
  }
}
```

**REPLACE WITH:**
```typescript
// Apply DOT damage
if (result.damage > 0) {
  // Apply damage with shield absorption
  if (unit.shield > 0) {
    const shieldDamage = Math.min(unit.shield, result.damage);
    unit.shield -= shieldDamage;
    const hpDamage = result.damage - shieldDamage;

    if (unit.shield <= 0) {
      unit.shield = 0;
    }

    if (hpDamage > 0) {
      unit.hp -= hpDamage;
    }
  } else {
    unit.hp -= result.damage;
  }

  this.updateHealthBar(unit);

  // Show floating damage
  const screenPos = gridToScreen(unit.position.x, unit.position.y, this.offsetX, this.offsetY);
  this.showFloatingDamage(screenPos.x, screenPos.y, result.damage, 0xff0000);

  // Check for death from DOT
  if (unit.hp <= 0) {
    this.killUnit(unit, 'Status Effect');
  }
}
```

---

## Part 6: Damage Application - Grapple (Line ~3167)

**FIND:**
```typescript
// Deal some grapple damage
const damage = Math.floor(attacker.str / 10) + 5;
target.hp -= damage;
this.updateHealthBar(target);
this.emitToUI('combat-log', {
  message: `💪 ${attacker.name} deals ${damage} grapple damage!`,
  type: 'damage'
});

if (target.hp <= 0) {
  this.incapacitateUnit(target);
}
```

**REPLACE WITH:**
```typescript
// Deal some grapple damage
const damage = Math.floor(attacker.str / 10) + 5;

// Apply damage with shield absorption
let shieldDamage = 0;
let hpDamage = damage;

if (target.shield > 0) {
  shieldDamage = Math.min(target.shield, damage);
  target.shield -= shieldDamage;
  hpDamage = damage - shieldDamage;

  if (target.shield <= 0) {
    target.shield = 0;
  }
}

if (hpDamage > 0) {
  target.hp -= hpDamage;
}

this.updateHealthBar(target);

let grappleMessage = `💪 ${attacker.name} deals ${damage} grapple damage!`;
if (shieldDamage > 0) {
  grappleMessage += ` (🛡️${shieldDamage} absorbed)`;
}

this.emitToUI('combat-log', {
  message: grappleMessage,
  type: 'damage'
});

if (target.hp <= 0) {
  this.incapacitateUnit(target);
}
```

---

## Part 7: Shield Regeneration (Line ~5441)

**FIND:**
```typescript
// Reduce power cooldowns for current team
this.reducePowerCooldowns(this.currentTeam);

// Select first unit of current team that can act
```

**INSERT BETWEEN THEM:**
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

## Part 8: Update Health Bar Visual (Line ~1986)

**FIND:**
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

**REPLACE WITH:**
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

Add a test unit with shields:

```typescript
this.spawnUnit({
  id: 'shielded_unit',
  name: 'Shield Test',
  codename: 'Protected',
  team: 'blue',
  hp: 100,
  maxHp: 100,
  shield: 50,        // 50 shield HP
  maxShield: 50,
  shieldRegen: 10,   // +10 per turn
  ap: 6,
  maxAp: 6,
  position: { x: 3, y: 5 },
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

**Expected Results:**
1. Unit shows cyan shield bar above health bar
2. Takes damage - shield absorbs first
3. Overflow damage goes to HP
4. Combat log: `"HITS -30 (🛡️15)"` showing shield absorbed 15
5. Each turn: `"🛡️ Shield Test's shield regenerates +10 (35/50)"`
6. When shield breaks: `"CRITS -60 (🛡️25 BROKEN!)"`

---

## Summary

**8 code sections to modify in CombatScene.ts:**

1. ✅ Unit interface - add 3 shield fields
2. ✅ spawnUnit - initialize shield values
3. ✅ tryAttackUnit - shield absorption in main attack
4. ✅ Grenade damage - shield absorption
5. ✅ DOT damage - shield absorption
6. ✅ Grapple damage - shield absorption
7. ✅ Turn start - shield regeneration
8. ✅ updateHealthBar - visual shield bar

**Formula**: `Damage → Shield (if any) → HP → Death`

**Files**:
- `MVP/src/game/scenes/CombatScene.ts` - All modifications here
- `MVP/src/data/shieldItems.ts` - Shield data (already exists, no changes)
