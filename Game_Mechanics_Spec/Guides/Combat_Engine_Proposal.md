# Combat Engine & Systems Proposal

## Executive Summary

This document addresses:
1. **Game Engine Recommendation** - Stay with Phaser (not Godot)
2. **Inventory/Equipment UI** - Full equip/unequip system proposal
3. **Consumables in Combat** - How to use items during battle
4. **Movement vs Range Balance** - Analysis with recommendations
5. **Throwing System** - Arc visualization and mechanics
6. **Functional Gadgets** - Making sensors/drones/comms work

---

## 1. Game Engine Recommendation

### Verdict: Stay with Phaser 3 (upgrade to Phaser 4 when ready)

### Why NOT Godot for Web:

| Issue | Impact |
|-------|--------|
| **40MB+ base export** | Slow load times, mobile unfriendly |
| **SharedArrayBuffer required** | Doesn't work on Safari, Firefox Android, itch.io |
| **Cross-origin isolation** | Complex server configuration required |
| **1-2 min load on macOS** | Known ANGLE/Chromium bug |
| **Compatibility renderer only** | No advanced features on web |

Sources: [Godot GitHub Issues](https://github.com/godotengine/godot/issues/70691), [Godot Forum](https://forum.godotengine.org/t/can-i-do-html-5-web-games-with-godot-4-2-or-4-3/40068), [Godot Docs](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html)

### Why Phaser 3 is BETTER for SHT:

| Advantage | Why It Matters |
|-----------|----------------|
| **Web-native** | Zero configuration, instant play |
| **<1MB engine** | Fast load, mobile-friendly |
| **Built-in physics** | Arcade, Matter.js, Impact |
| **I can develop it** | Pure JavaScript/TypeScript |
| **Existing prototype** | Already have attack, move, knockback, LOS |
| **Sprite/particle support** | Beams, projectiles, effects |
| **Large community** | Tons of examples, active support |
| **Phaser 4 coming (2025)** | WebGPU, smaller bundle, TypeScript |

Sources: [Phaser vs PixiJS](https://dev.to/ritza/phaser-vs-pixijs-for-making-2d-games-2j8c), [Best JS Engines 2025](https://blog.logrocket.com/top-6-javascript-and-html5-game-engines/)

### Recommendation

```
Current: Phaser 3.70.0 (stable)
Future:  Phaser 4.x when released (late 2025)
Backup:  PixiJS + custom framework if needed
```

### What Phaser CAN Do (examples we need):

- **Projectile arcs**: `Phaser.Math.Interpolation.Bezier` for grenade arcs
- **Laser beams**: Line graphics with glow filters
- **Muzzle flash**: Particle emitters
- **Bullet trails**: Trail particles following projectiles
- **Sprite animations**: Full frame-by-frame animation support
- **Isometric support**: Plugin available for iso grids

---

## 2. Inventory & Equipment UI

### Overview

Characters need to equip/unequip items **before** and **during** combat.

### UI Layout Proposal

```
+------------------------------------------------------------------+
|                         INVENTORY SCREEN                          |
+------------------------------------------------------------------+
|                                                                    |
|  +------------------+          +-----------------------------+     |
|  |    CHARACTER     |          |      EQUIPPED ITEMS         |     |
|  |                  |          +-----------------------------+     |
|  |    [Silhouette]  |          | Primary:   [Assault Rifle ] |     |
|  |                  |          | Secondary: [Heavy Pistol  ] |     |
|  |    HP: 100/100   |          | Melee:     [Combat Knife  ] |     |
|  |    AP: 6         |          | Armor:     [Tactical Vest ] |     |
|  |                  |          | Helmet:    [Ballistic     ] |     |
|  |  Weight: 45/80   |          +-----------------------------+     |
|  +------------------+          | BELT (6 slots)              |     |
|                                | [Mag] [Mag] [Frag] [Flash]  |     |
|                                | [Med] [Emp]                  |     |
|                                +-----------------------------+     |
|                                | BACKPACK (10 slots)         |     |
|                                | [Ammo Box] [First Aid]      |     |
|                                | [Rope] [Lockpick] [...]     |     |
|                                +-----------------------------+     |
|                                                                    |
+------------------------------------------------------------------+
|                        AVAILABLE ITEMS                            |
+------------------------------------------------------------------+
| [Filter: All v]  [Sort: Name v]                                   |
|                                                                    |
| +----------+ +----------+ +----------+ +----------+ +----------+  |
| | Pistol   | | SMG      | | Medkit   | | Flashbang| | Scope    |  |
| | 2.5 lbs  | | 6 lbs    | | 1 lb     | | 0.5 lb   | | 0.5 lb   |  |
| | [Equip]  | | [Equip]  | | [Add]    | | [Add]    | | [Attach] |  |
| +----------+ +----------+ +----------+ +----------+ +----------+  |
+------------------------------------------------------------------+
```

### Equipment Slots Detail

| Slot | Accepts | Quick Access |
|------|---------|--------------|
| Primary Weapon | Rifles, shotguns, heavy | Number 1 |
| Secondary Weapon | Pistols, SMGs, melee | Number 2 |
| Melee Weapon | Knives, batons, swords | Number 3 |
| Body Armor | Any armor type | N/A |
| Helmet | Head protection | N/A |
| Belt Slot 1-6 | Small items (<1 lb) | Number 4-9 |
| Backpack | Any items | Opens menu |

### Quick-Equip During Combat

During combat, a radial menu appears when pressing TAB or clicking item button:

```
              [Primary]
                  |
    [Med Kit] ---+--- [Grenade]
                  |
              [Reload]
```

### Equip/Unequip Rules

| Action | AP Cost | Time |
|--------|---------|------|
| Draw primary weapon | 1 AP | Instant |
| Draw secondary weapon | 0.5 AP | Instant |
| Switch weapons | 0.5 AP | Instant |
| Use belt item | 1 AP | Instant |
| Access backpack | 2 AP | Opens menu |
| Drop item | 0 AP | Free action |
| Pick up item | 1 AP | Adjacent tile |

---

## 3. Consumables in Combat

### Quick-Use System

Consumables on belt can be used with hotkeys:

| Hotkey | Slot | Example Use |
|--------|------|-------------|
| 4 | Belt 1 | Reload magazine |
| 5 | Belt 2 | Throw grenade |
| 6 | Belt 3 | Use medkit |
| 7 | Belt 4 | Deploy flashbang |
| 8 | Belt 5 | Inject stimulant |
| 9 | Belt 6 | Use EMP device |

### Consumable Types & Effects

| Consumable | AP Cost | Effect | Charges |
|------------|---------|--------|---------|
| **Magazine** | 2 AP | Reload weapon | 1 |
| **Frag Grenade** | 2 AP | 50 damage, 3x3 area | 1 |
| **Flashbang** | 2 AP | Blind 1d4 turns, 5x5 | 1 |
| **Smoke Grenade** | 2 AP | Block LOS 30 sec | 1 |
| **First Aid Kit** | 3 AP | Heal 25 HP | 10 uses |
| **Stimulant** | 1 AP | +2CS all stats 10 turns | 1 |
| **Painkiller** | 1 AP | Ignore wounds 1 hr | 1 |
| **Antidote** | 1 AP | Cure poison | 1 |

### Combat UI for Consumables

```
+------------------------------------------+
|  SELECTED: Batman          HP: 85/100    |
+------------------------------------------+
|  Primary: [Batarangs  ] [R]eload         |
|  Secondary: [Staff    ]                   |
+------------------------------------------+
|  BELT:                                    |
|  [4: Mag] [5: Smoke] [6: Flash] [7: Med]  |
|  [8: Emp] [9: Grapple]                    |
+------------------------------------------+
|  [A]ttack  [M]ove  [T]hrow  [U]se  [E]nd |
+------------------------------------------+
```

---

## 4. Movement vs Range Balance Analysis

### Current Issue

If movement is too fast relative to weapon range, ranged combat becomes meaningless.

### Analysis

**Map Size**: Assume 25x25 grid (625 tiles)

| Stat | Value | Squares/Turn |
|------|-------|--------------|
| Base movement | 6 AP | 6 squares |
| Sprint (double AP) | 12 AP | 12 squares |
| Running (-2CS) | 6 AP | 9 squares |
| Encumbered | 6 AP | 4 squares |

### Weapon Range Analysis

| Weapon | Range (Squares) | Turns to Close (Walk) | Turns to Close (Sprint) |
|--------|-----------------|----------------------|------------------------|
| Melee | 1-2 | Already there | Already there |
| Pistol | 20-25 | 4 turns | 2 turns |
| SMG | 20 | 4 turns | 2 turns |
| Shotgun | 5 | 1 turn | 1 turn |
| Assault Rifle | 60 | 10 turns | 5 turns |
| Sniper Rifle | 100 | 17 turns | 9 turns |
| Anti-Materiel | 150 | 25 turns | 13 turns |

### The Problem

- **Shotgun**: Only 5 squares = easily closed in 1 turn
- **Pistol**: 20 squares = closed in 2-4 turns (still useful)
- **Sniper**: 100 squares = impossible to close on standard map

### Recommendation: Variable Map Sizes

| Map Type | Size | Best For |
|----------|------|----------|
| **Urban Indoor** | 15x15 | CQB, shotguns, melee |
| **Urban Outdoor** | 25x25 | Mixed combat, pistols/rifles |
| **Open Field** | 40x40 | Rifles, vehicles |
| **Sniper Arena** | 60x60 | Long range, support weapons |

### Movement Modifiers

| Condition | Movement Modifier |
|-----------|-------------------|
| Normal | 1 square per AP |
| Sprinting | 1.5 squares per AP (-2CS attacks) |
| Crouched | 0.5 squares per AP (+2CS cover) |
| Prone | 0.25 squares per AP (+3CS cover) |
| Heavy Load | 0.75 squares per AP |
| Difficult Terrain | 2 AP per square |
| Climbing | 3 AP per square |

### Engagement Range Formula

```
Effective Engagement = Weapon Range / Movement Speed

Pistol:   20 / 6 = 3.3 turns of fire before melee
Rifle:    60 / 6 = 10 turns of fire before melee
Sniper:  100 / 6 = 16.7 turns of fire before melee
```

**This means:**
- **Pistols are viable** for 3+ shots before melee
- **Rifles dominate** with 10 turns of opportunity
- **Snipers need large maps** or they're wasted

---

## 5. Throwing System

### Throwing Mechanics

| Stat | Formula |
|------|---------|
| **Max Range** | (STR / 10) + (Item Range Bonus) squares |
| **Accuracy** | Item Accuracy + AGL modifier |
| **Arc Height** | Distance / 3 (for visualization) |
| **Travel Time** | 0.5 sec base + 0.1 sec per square |

### Example Throw Ranges

| STR | Grenade (base 10) | Knife (base 5) | Rock (base 0) |
|-----|-------------------|----------------|---------------|
| 10 | 11 squares | 6 squares | 1 square |
| 20 | 12 squares | 7 squares | 2 squares |
| 30 | 13 squares | 8 squares | 3 squares |
| 50 | 15 squares | 10 squares | 5 squares |
| 80 | 18 squares | 13 squares | 8 squares |

### Visual Arc System (Phaser Implementation)

```javascript
// Grenade arc preview
function showThrowArc(startX, startY, targetX, targetY, maxRange) {
    const distance = Phaser.Math.Distance.Between(startX, startY, targetX, targetY);
    const inRange = distance <= maxRange * TILE_SIZE;

    // Create bezier curve points
    const midX = (startX + targetX) / 2;
    const midY = (startY + targetY) / 2 - (distance / 3); // Arc height

    // Draw arc
    const graphics = scene.add.graphics();
    graphics.lineStyle(2, inRange ? 0x00ff00 : 0xff0000, 0.8);

    // Bezier curve
    const curve = new Phaser.Curves.QuadraticBezier(
        new Phaser.Math.Vector2(startX, startY),
        new Phaser.Math.Vector2(midX, midY),
        new Phaser.Math.Vector2(targetX, targetY)
    );

    curve.draw(graphics);

    // Draw landing zone
    if (isGrenade) {
        graphics.lineStyle(1, 0xff6600, 0.5);
        graphics.strokeCircle(targetX, targetY, BLAST_RADIUS * TILE_SIZE);
    }

    return graphics;
}
```

### Throw UI

```
When throwing:

1. Select throwable item (grenade, knife, etc.)
2. Hover over target location
3. Shows:
   - Arc trajectory (green if in range, red if not)
   - Blast radius (for explosives)
   - Hit chance percentage
   - Cover indicators

4. Click to confirm throw
5. Animate along arc
6. Resolve effect on landing
```

### Throw Types

| Type | Arc | Effect on Land |
|------|-----|----------------|
| Grenade | High | Explodes, area damage |
| Flashbang | High | Flash effect, area blind |
| Knife | Flat | Direct damage to target |
| Rock | Medium | Minor damage, distraction |
| Molotov | High | Fire area, DOT |

---

## 6. Functional Gadgets System

### Making Gadgets Actually Work

Every gadget from Tech_Gadgets_Complete.csv needs implementation.

### Sensors

| Sensor | How It Works in Combat |
|--------|----------------------|
| **Motion Sensor** | Place on tile; alerts when enemy enters 50ft radius |
| **Thermal Scanner** | Toggle; shows heat signatures through thin walls |
| **Metal Detector** | Active; highlights metal objects (weapons, armor) |
| **Life Sign Detector** | Active; shows heartbeats through walls |

**Implementation:**

```javascript
// Motion Sensor - deployed as game object
class MotionSensor {
    radius: 10 tiles
    owner: player who deployed

    onEnemyMove(enemy) {
        if (distance(this, enemy) <= radius) {
            // Alert owner
            owner.notifications.push("Motion detected at " + this.position);
            // Visual ping
            scene.addRing(this.x, this.y, radius, 0xff0000);
        }
    }
}

// Thermal Scanner - toggle on character
function toggleThermalVision(character) {
    character.thermalActive = !character.thermalActive;

    if (character.thermalActive) {
        // Reveal enemies through thin walls
        enemies.forEach(e => {
            if (wallThickness(character, e) <= 1) {
                e.setVisible(true);
                e.setTint(0xff6600); // Orange heat signature
            }
        });
    }
}
```

### Drones

| Drone | Combat Use |
|-------|------------|
| **Recon Drone** | Fly to location, reveal fog of war, spotting |
| **Combat Drone** | AI-controlled ally, can attack |
| **Medical Drone** | Deliver medkits to allies |

**Implementation:**

```javascript
class ReconDrone {
    hp: 10
    speed: 6 squares/turn
    range: 100 squares from operator
    revealRadius: 8 squares

    // Controlled like a unit but limited
    actions: ['move', 'scan', 'return']

    scan() {
        // Reveal area around drone
        revealFogOfWar(this.x, this.y, this.revealRadius);
        // Mark enemies
        enemies.forEach(e => {
            if (distance(this, e) <= revealRadius) {
                e.spotted = true;
                e.spottedTurns = 3;
            }
        });
    }
}
```

### Communications

| Comm Device | Combat Use |
|-------------|------------|
| **Tactical Radio** | Share vision with team in range |
| **Subvocal Mic** | Silent communication (no sound detection) |
| **Signal Jammer** | Block enemy comms in area |

**Implementation:**

```javascript
// Signal Jammer - deployed device
class SignalJammer {
    radius: 20 tiles
    active: true

    effect() {
        // Enemies in radius:
        // - Cannot use comms
        // - Drones disconnected
        // - No calling reinforcements
        enemies.forEach(e => {
            if (distance(this, e) <= radius) {
                e.commsBlocked = true;
                e.dronesDisabled = true;
            }
        });
    }
}
```

### Hacking Tools

| Tool | Combat Use |
|------|------------|
| **Laptop** | Hack door controls, cameras, turrets |
| **Signal Jammer** | Block enemy comms, disable drones |
| **EMP Grenade** | Disable all electronics in area |

**Implementation:**

```javascript
function hackDoor(hacker, door) {
    // Requires hacking skill
    const roll = d100();
    const target = hacker.skills.computer;

    if (roll <= target) {
        door.locked = false;
        door.open();
        log("Door hacked successfully");
    } else {
        log("Hack failed - security alerted");
        triggerAlarm(door.location);
    }
}

function empGrenade(location, radius) {
    getObjectsInRadius(location, radius).forEach(obj => {
        if (obj.electronic) {
            obj.disabled = true;
            obj.disabledTurns = 3;
        }
        if (obj.isPowerArmor) {
            obj.powerArmorOffline = true;
            obj.stats.DR -= 20; // Armor goes offline
        }
    });
}
```

### Gadget Quick Reference

| Gadget | AP to Use | Duration | Effect |
|--------|-----------|----------|--------|
| Deploy Motion Sensor | 2 AP | Until destroyed | Alerts on movement |
| Toggle Thermal | 1 AP | Until toggled off | See through thin walls |
| Launch Recon Drone | 3 AP | Until destroyed/recalled | Scout ahead |
| Deploy Signal Jammer | 2 AP | 10 turns | Block comms in area |
| Hack Door | 3 AP | Instant | Unlock/lock door |
| Use Grappling Hook | 2 AP | Instant | Move to elevated position |
| Plant C4 | 3 AP | Until detonated | Remote explosive |
| Throw EMP | 2 AP | 3 turns | Disable electronics |

---

## 7. Implementation Priority

### Phase 1: Core Combat (Current)
- [x] Movement
- [x] Attack
- [x] LOS
- [x] Status effects
- [ ] **Throwing system**
- [ ] **Consumables (grenades, medkits)**

### Phase 2: Equipment System
- [ ] Inventory UI
- [ ] Equip/unequip
- [ ] Weight system
- [ ] Weapon switching

### Phase 3: Gadgets
- [ ] Deployables (sensors, jammers)
- [ ] Drones (recon first)
- [ ] Hacking minigame
- [ ] Comms effects

### Phase 4: Polish
- [ ] Visual arcs for throws
- [ ] Particle effects for projectiles
- [ ] Sound system
- [ ] Map size variants

---

## 8. Combat Simulation Recommendations

To test balance, we should run these scenarios:

### Test Scenarios

| Scenario | What We're Testing |
|----------|-------------------|
| **Pistol Duel** | Base weapon balance at 20 tiles |
| **Sniper vs Rush** | Can melee close on sniper? |
| **Grenade Bunker** | Throwing vs cover effectiveness |
| **Drone Scout** | Drone utility in fog of war |
| **EMP vs Power Armor** | Gadget counterplay |
| **Medical Supplies** | Consumable economy |

### Metrics to Track

- Time to kill (turns)
- Damage per turn (DPT)
- Movement efficiency (squares per AP)
- Gadget impact on outcomes
- Consumable usage rates

---

## Summary

| Question | Answer |
|----------|--------|
| **Game Engine** | Stay with Phaser 3, upgrade to 4 when ready |
| **Inventory** | Slot-based system with belt quick-access |
| **Consumables** | Hotkey-based with AP costs |
| **Movement Balance** | Use variable map sizes |
| **Throwing** | Bezier arc visualization |
| **Gadgets** | Deploy/toggle/use mechanics |

---

*Last Updated: 2024-12-05*
*Version: 1.0*
