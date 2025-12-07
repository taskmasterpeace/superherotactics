# Resource Display & Combat Enhancements Proposal

---

## 1. RESOURCE/AMMO DISPLAY UI

### Option A: Segmented Bars (Recommended)
Visual bars that deplete segment by segment, like a fighting game super meter.

```
┌─────────────────────────────────────┐
│  GHOST - Sniper                     │
│  HP: ████████░░ 80/100              │
│  AP: ●●●●○○ 4/6                     │
│                                     │
│  🔫 AMMO: █████░░░░░ 5/10           │
│  ⚡ POWER: ███████░░░ 70/100        │
│  💫 CHARGES: ●●●○○ 3/5              │
└─────────────────────────────────────┘
```

**Why it's cool:**
- Instantly readable at a glance
- Segments show exact count (each █ = 1 bullet or 10 energy)
- Color-coded: Green > Yellow > Red as it depletes
- Animated drain when firing

---

### Option B: Radial Meters (Stylish)
Circular meters around the unit portrait or on the game tile.

```
        ╭──────╮
       ╱   85   ╲     ← HP in center
      │  ┌────┐  │
      │  │ 👤 │  │    ← Portrait
      │  └────┘  │
       ╲   ▓▓░░ ╱     ← Ammo arc (bottom)
        ╰──────╯
          ⚡●●●○      ← Power charges below
```

**On the tile itself:**
```
    ┌─────┐
    │ 👤  │ ← Unit sprite
    │▓▓▓░░│ ← Mini ammo bar under feet
    └─────┘
```

---

### Option C: Icon Stack (Compact)
Stack icons that disappear as resources deplete.

```
🔫🔫🔫🔫🔫  → 5 shots left
🔫🔫🔫░░░  → 3 shots left
🔫░░░░░░  → 1 shot left (FLASHING RED)

⚡⚡⚡⚡⚡⚡⚡  → 70% energy
💫💫💫●●  → 3/5 charges used
```

---

### Recommended Implementation

**Unit Card (Bottom Bar):**
```
┌──────────────────────────────────────────────────┐
│ [PORTRAIT]  IRONCLAD                      HEROES │
│             Tech Enhanced | Protective           │
│                                                  │
│  ❤️ ████████████████░░░░ 140/150                 │
│  ⚡ ●●●●●● 6/6 AP                                │
│                                                  │
│  🔫 SUPER PUNCH                                  │
│     ████████░░ 8/10 charges    [RELOAD: 2 AP]   │
│                                                  │
│  💪 POWERS                                       │
│     Force Field: ●●●○ (3 uses left)             │
│     Ground Slam: ▓▓▓▓▓▓░░░░ (Cooldown: 2 turns) │
└──────────────────────────────────────────────────┘
```

**On-Grid Indicator (Floating above unit):**
```
         5 🔫        ← Ammo count (changes color)
        ┌───┐
        │ 👤│
        └───┘
    ████████░░       ← HP bar
```

**Color Coding:**
- 100-70%: Green/Cyan
- 69-30%: Yellow/Orange
- 29-10%: Red (pulsing)
- 0%: Grey with "EMPTY" or "RELOAD" text

---

### Animation Ideas

**Firing Animation:**
```
Frame 1: 🔫🔫🔫🔫🔫 (5 ammo)
Frame 2: 🔫🔫🔫🔫💥 (flash on last icon)
Frame 3: 🔫🔫🔫🔫░ (4 ammo, depleted icon fades)
```

**Low Ammo Warning:**
```
When ammo <= 2:
  - Bar pulses red
  - "LOW AMMO" text flashes
  - Audio cue: click-click sound
```

**Reload Animation:**
```
Frame 1: ░░░░░░░░░░ RELOADING...
Frame 2: █░░░░░░░░░
Frame 3: ██░░░░░░░░
...
Frame 10: ██████████ READY!
```

---

## 2. WEAPONS & GADGETS TO ADD

### GRENADES (High Priority)

| Grenade | Damage | Range | AoE | Special Effect |
|---------|--------|-------|-----|----------------|
| **Frag Grenade** | 30 | Throw 6 | 3x3 | Standard explosive |
| **Flashbang** | 0 | Throw 5 | 5x5 | -3CS accuracy, 2 turns |
| **Smoke Grenade** | 0 | Throw 6 | 5x5 | Blocks LOS, 3 turns |
| **EMP Grenade** | 20 | Throw 5 | 3x3 | +30 vs Tech/Construct, disables powers |
| **Incendiary** | 15 | Throw 5 | 3x3 | Creates fire zone, 5 dmg/turn |
| **Cryo Grenade** | 15 | Throw 5 | 3x3 | Freeze chance, slows movement |
| **Stun Grenade** | 10 | Throw 4 | 3x3 | Stun for 1 turn |
| **Gas Grenade** | 0 | Throw 5 | 5x5 | Poison 3 dmg/turn, 4 turns |

**How Grenades Work:**
```
1. Select grenade (costs 1 AP to ready)
2. Click target tile (shows 3x3 or 5x5 preview)
3. Throw (costs 2 AP)
4. Grenade lands, affects all units in AoE
5. Friendly fire IS possible!
```

---

### TRAPS (Medium Priority)

| Trap | Damage | Trigger | Duration | Notes |
|------|--------|---------|----------|-------|
| **Proximity Mine** | 40 | Unit walks on tile | Permanent | Hidden after placed |
| **Trip Wire** | 10 | Unit crosses line | Permanent | Knocks prone, 2-tile line |
| **Bear Trap** | 20 | Unit walks on tile | Permanent | Immobilizes 2 turns |
| **Electric Trap** | 25 | Unit walks on tile | 5 turns | Stuns 1 turn |
| **Net Trap** | 0 | Unit walks on tile | Permanent | Immobilize, STR check to escape |
| **Alarm Trap** | 0 | Unit walks on tile | Permanent | Alerts all enemies (sound: 100 dB) |

**Trap Mechanics:**
```
1. Select trap item (2 AP to place)
2. Place on tile within 2 squares
3. Trap becomes HIDDEN (enemies can't see unless detection)
4. Trigger when enemy steps on tile
5. Your team remembers trap locations
```

---

### TACTICAL GADGETS (Medium Priority)

| Gadget | AP Cost | Effect | Charges |
|--------|---------|--------|---------|
| **Grappling Hook** | 2 | Move to any tile within 8 range (needs anchor point) | 3 |
| **Medkit** | 3 | Heal 40 HP to self or adjacent ally | 2 |
| **Stim Pack** | 2 | +2 AP for this turn only | 1 |
| **Binoculars** | 1 | Reveal all enemies in 15-tile cone | Unlimited |
| **Decoy Device** | 2 | Create fake unit that draws fire | 2 |
| **Shield Generator** | 3 | 3x3 force field, blocks 30 damage | 1 |
| **Jammer** | 2 | Disable enemy tech in 5x5 area, 2 turns | 1 |
| **Portable Cover** | 2 | Place deployable cover (half cover) on tile | 2 |

---

### HEAVY WEAPONS (Low Priority - Special Units Only)

| Weapon | Damage | Range | RoF | Special |
|--------|--------|-------|-----|---------|
| **Rocket Launcher** | 60 | 10 | 1 | 3x3 AoE, destroys cover |
| **Minigun** | 15x5 | 8 | 5 | Suppressive fire, can't move same turn |
| **Flamethrower** | 25 | 4 | Cone | 3-tile cone, leaves fire |
| **Grenade Launcher** | 35 | 8 | 1 | 3x3 AoE, arcing fire |
| **Sniper Cannon** | 70 | 15 | 1 | Armor piercing, 4 AP to fire |

---

### MELEE WEAPONS EXPANSION

| Weapon | Damage | Range | Special |
|--------|--------|-------|---------|
| **Combat Knife** | 15 | 1 | +2CS vs grappled targets |
| **Stun Baton** | 12 | 1 | Stun chance 40% |
| **Chain Whip** | 18 | 2 | Can pull target 1 tile closer |
| **Power Fist** | 35 | 1 | Knockback 3 tiles |
| **Energy Blade** | 30 | 1 | Ignores 50% armor |
| **Telescoping Staff** | 20 | 2 | +1CS defense |

---

## 3. PROJECTILE CONTINUATION ON MISS

### The Concept
When you MISS a ranged attack, the projectile doesn't just disappear - it continues in a straight line until it:
1. Hits another unit (friend or foe!)
2. Hits a wall/obstacle
3. Leaves the map

### Visual Implementation

```
Shooter at (5,5) aims at Target at (10,5) - MISS!

Frame 1:  🔫→ →  →  👤  →  →  →  →  →
          (5)    (10)              (map edge)
               MISS!

Frame 2:  🔫      👤  💨 → → → →
                  The bullet continues past!

Frame 3a: 🔫      👤      💥🧱
          Bullet hits wall at (15,5)

Frame 3b: 🔫      👤  👥  💥
          Bullet hits ANOTHER UNIT at (12,5)!
          "STRAY BULLET hits Ally for 20 damage!"
```

### Code Logic

```javascript
function fireProjectile(shooter, target, weapon) {
    const hitRoll = rollToHit(shooter, target);

    if (hitRoll.success) {
        // Normal hit - damage target
        dealDamage(target, weapon.damage);
    } else {
        // MISS - projectile continues!
        projectileContinuation(shooter, target, weapon);
    }
}

function projectileContinuation(shooter, target, weapon) {
    // Calculate direction vector
    const dx = Math.sign(target.x - shooter.x);
    const dy = Math.sign(target.y - shooter.y);

    // Start from target position, continue in same direction
    let x = target.x + dx;
    let y = target.y + dy;

    addLog(`  💨 Shot misses and continues...`, 'effect');

    while (isInBounds(x, y)) {
        // Check for unit at this tile
        const unitHit = getUnitAt(x, y);
        if (unitHit && unitHit !== shooter) {
            // Stray bullet hits someone!
            const strayDamage = Math.floor(weapon.damage * 0.75); // 75% damage
            dealDamage(unitHit, strayDamage);
            addLog(`  💥 STRAY SHOT hits ${unitHit.name} for ${strayDamage}!`, 'damage');

            // Show visual
            showImpact(x, y, 'stray');
            return;
        }

        // Check for wall/obstacle
        if (isBlocked(x, y)) {
            addLog(`  🧱 Bullet impacts wall at (${x},${y})`, 'effect');
            showImpact(x, y, 'wall');
            return;
        }

        // Continue along trajectory
        x += dx;
        y += dy;
    }

    // Bullet left the map
    addLog(`  → Bullet exits battlefield`, 'effect');
}
```

### Special Cases

**Shotgun Spread:**
```
Multiple pellets = multiple continuation paths
Each pellet that misses continues independently
Could hit multiple unintended targets!
```

**Beam Weapons:**
```
Beams don't continue - they dissipate
Energy disperses on miss
```

**Explosive Projectiles:**
```
Rockets/grenades explode where they land
If miss, they land BEHIND the target
Still does AoE damage at landing point
```

### Balance Considerations

| Factor | Implementation |
|--------|---------------|
| Stray bullet damage | 75% of normal (glancing hit) |
| Friendly fire | YES - be careful where you shoot! |
| Cover interaction | Stray bullets can hit cover, stopping them |
| Wall penetration | Based on weapon penetration stats |
| Max travel distance | 20 tiles or edge of map |

### Tactical Implications

1. **Firing lanes matter** - Don't shoot if ally is behind target
2. **Positioning depth** - Back-row units at risk from stray fire
3. **Suppressive fire** - Missing intentionally to threaten area
4. **Cover placement** - Put cover BEHIND your units too
5. **Friendly fire fear** - Adds tension to every shot

---

## IMPLEMENTATION PRIORITY

### Phase 1: Core Systems
1. Ammo/Reload system
2. Basic resource display (Option A bars)
3. Projectile continuation on miss

### Phase 2: Grenades
4. Frag Grenade
5. Smoke Grenade
6. Flashbang
7. AoE targeting preview

### Phase 3: Gadgets
8. Medkit
9. Portable Cover
10. Grappling Hook

### Phase 4: Traps
11. Proximity Mine
12. Trip Wire
13. Trap detection system

### Phase 5: Polish
14. Animated resource bars
15. Low ammo warnings
16. Reload animations
