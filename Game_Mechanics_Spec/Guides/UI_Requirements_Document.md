# SHT UI Requirements Document

## Overview

This document specifies all UI elements needed for SuperHero Tactics mockups and implementation. It covers the tactical combat screen, character sheets, equipment interfaces, and specialized systems like grappling.

---

## Screen List

| Screen | Priority | Description |
|--------|----------|-------------|
| Tactical Combat | Critical | Main gameplay screen with isometric grid |
| Character Sheet | High | Stats, equipment, status effects |
| Equipment/Inventory | High | Weapon/armor selection and management |
| Grappling Modal | Medium | Wrestling position diagram and actions |
| Combat Results | Medium | Post-combat summary and statistics |
| Turn Order Panel | High | Initiative and turn queue |
| Combat Log | Medium | Scrolling action history |

---

## 1. Tactical Combat Screen

The primary gameplay interface showing the battlefield, units, and available actions.

### 1.1 Grid Layout

```
+------------------------------------------------------------------+
|  HEADER BAR (Turn, Phase, Menu)                                   |
+------------------------------------------------------------------+
|                                          |                        |
|                                          |  UNIT INFO PANEL       |
|          TACTICAL GRID                   |  - Selected unit stats |
|          (Isometric view)                |  - Equipment           |
|          25x25 squares                   |  - Status effects      |
|                                          |                        |
|                                          +------------------------+
|                                          |  ACTION BUTTONS        |
|                                          |  Move | Attack | etc   |
|                                          +------------------------+
|                                          |  TURN ORDER            |
|                                          |  (Unit portraits)      |
+------------------------------------------+------------------------+
|  COMBAT LOG (scrolling action history)                           |
+------------------------------------------------------------------+
```

### 1.2 Grid Tile Types

| Tile Type | Visual | Color/Style | Notes |
|-----------|--------|-------------|-------|
| Floor | Flat | Gray/stone texture | Default walkable |
| Wall | Raised cube | Brown/brick texture | Blocks movement and LOS |
| Cover (Low) | Half-height | Green/foliage | +1CS defense, doesn't block LOS |
| Cover (High) | 3/4 height | Darker green | +2CS defense, blocks LOS |
| Door (Closed) | Panel | Brown with gold trim | Can be opened |
| Door (Open) | Frame | Empty archway | No obstruction |
| Door (Locked) | Panel + lock icon | Red border | Requires lockpick/breach |
| Water | Animated | Blue | Movement penalty |
| Hazard | Warning pattern | Orange/yellow stripes | Damage per turn |

### 1.3 Unit Tokens

**Token Components:**
```
     +--------+
     |  ICON  |  <- Character portrait/symbol
     +--------+
     | HP BAR |  <- Green/yellow/red gradient
     +--------+
     [FACTION]   <- Color ring (Blue=player, Red=enemy, Green=ally)
```

**Unit States:**

| State | Visual Indicator |
|-------|------------------|
| Selected | Golden glow outline |
| Active Turn | Pulsing border |
| Damaged (<50%) | Yellow HP bar |
| Critical (<25%) | Red HP bar + warning icon |
| Stunned | Stars above head |
| Grappling | Purple chain link icon |
| In Cover | Shield icon on tile |
| Prone | Horizontal token |

### 1.4 Movement Overlay

When a unit is selected for movement:

| Overlay Type | Color | Opacity | Meaning |
|--------------|-------|---------|---------|
| Move Range | Green | 30% | Can reach with available AP |
| Extended Range | Yellow | 20% | Requires full AP |
| Blocked | None | - | Cannot move (wall/unit) |
| Dash Required | Orange | 25% | Uses dash action |

### 1.5 Attack Overlay

When a unit is selected for attack:

| Overlay Type | Color | Opacity | Meaning |
|--------------|-------|---------|---------|
| Optimal Range | Red | 30% | Full accuracy |
| Long Range | Orange | 20% | Accuracy penalty |
| Out of Range | None | - | Cannot attack |
| Valid Target | Red circle | 50% | Enemy in range |

### 1.6 Line of Sight Indicator

```
[Attacker] ---- dotted line ---- [Target]
                   |
            (turns red if blocked by wall)
            (turns yellow if partial cover)
```

### 1.7 Sound Rings

When a sound is generated:

| Sound Level | Ring Size | Color | Duration |
|-------------|-----------|-------|----------|
| Quiet (20dB) | 3 tiles | Light blue | 0.5s fade |
| Normal (40dB) | 6 tiles | Blue | 1s fade |
| Loud (60dB) | 12 tiles | Yellow | 1.5s fade |
| Very Loud (80dB) | 20 tiles | Orange | 2s fade |
| Gunshot (100dB+) | 30+ tiles | Red | 2s fade |

---

## 2. Unit Info Panel

Right-side panel showing selected unit details.

### 2.1 Layout

```
+---------------------------+
|  [Portrait]    NAME       |
|               Team: ALPHA |
+---------------------------+
|  HP: ████████░░  85/100   |
|  AP: ████░░░░░░   4/6     |
+---------------------------+
|  STATS                    |
|  STR: 30    AGL: 40       |
|  INT: 25    INS: 30       |
+---------------------------+
|  EQUIPMENT                |
|  Weapon: [Assault Rifle]  |
|  Armor:  [Combat Armor]   |
|  Items:  [Medkit] [Flash] |
+---------------------------+
|  STATUS EFFECTS           |
|  [Bleeding] [In Cover]    |
+---------------------------+
|  POSITION                 |
|  (12, 8) - Behind Cover   |
+---------------------------+
```

### 2.2 Stat Display Requirements

| Stat | Display Format | Color Coding |
|------|---------------|--------------|
| HP | Bar + numbers | Green>50%, Yellow 25-50%, Red<25% |
| AP | Bar + numbers | White (current), Gray (spent) |
| Attributes | Number | White default, Green buffed, Red debuffed |

### 2.3 Equipment Display

Each equipment slot shows:
- Item icon
- Item name
- Key stat (damage for weapons, DR for armor)
- Ammo count (for ranged weapons)

---

## 3. Action Buttons

Primary action interface for the active unit.

### 3.1 Main Actions

```
+--------+ +--------+ +--------+ +--------+ +--------+
|  MOVE  | | ATTACK | |GRAPPLE | |  ITEM  | |  END   |
| [icon] | | [icon] | | [icon] | | [icon] | | TURN   |
+--------+ +--------+ +--------+ +--------+ +--------+
```

### 3.2 Action Button States

| State | Visual | Meaning |
|-------|--------|---------|
| Available | Full color | Can perform action |
| Unavailable | Grayed out | Not enough AP or invalid |
| Selected | Glowing border | Currently active |
| Cooldown | Timer overlay | Waiting for cooldown |

### 3.3 Sub-Action Menus

**Attack Sub-Menu:**
```
+------------------+
| Standard Attack  |  (2 AP)
| Aimed Shot       |  (3 AP, +1CS)
| Burst Fire       |  (4 AP, 3 attacks)
| Called Shot      |  (3 AP, -2CS, bypass armor)
+------------------+
```

**Item Sub-Menu:**
```
+------------------+
| [Medkit]         |  Heal 30 HP (2 AP)
| [Flash Grenade]  |  Blind 4x4 area (2 AP)
| [Smoke]          |  Block LOS (1 AP)
+------------------+
```

---

## 4. Turn Order Panel

Shows initiative order for all units in combat.

### 4.1 Layout

```
TURN ORDER
+---+ +---+ +---+ +---+ +---+
| A | | B | | C | | D | | E |
|[1]| |[2]| |[3]| |[4]| |[5]|
+---+ +---+ +---+ +---+ +---+
  ^
Current Turn
```

### 4.2 Turn Order Elements

| Element | Display |
|---------|---------|
| Current Unit | Highlighted, enlarged |
| Player Units | Blue border |
| Enemy Units | Red border |
| Allied NPCs | Green border |
| Delayed Units | Dimmed |
| Dead Units | X overlay |

---

## 5. Combat Log

Scrolling text log of all combat actions.

### 5.1 Log Entry Types

| Type | Color | Icon | Example |
|------|-------|------|---------|
| Attack | Orange | Crosshair | "Alpha attacks Beta with Rifle" |
| Damage | Red | Burst | "35 damage - 12 DR = 23 damage!" |
| Miss | Gray | X | "Attack missed!" |
| Movement | Green | Footprints | "Alpha moves to (12, 8)" |
| Grapple | Purple | Chain | "Alpha grapples Beta - Clinch!" |
| Status | Yellow | Alert | "Alpha is Bleeding" |
| Turn | White | Clock | "--- Turn 5: Beta's turn ---" |

### 5.2 Log Format

```
[Turn 5] Alpha attacks Beta with Assault Rifle
  Roll: 72 + 5 (AGL) - 10 (cover) = 67
  Result: Minor Hit (0.5x)
  Damage: 15 - 12 DR = 3 damage
  Beta HP: 82/100
```

---

## 6. Grappling Modal

Special interface when units are grappling.

### 6.1 Layout

```
+----------------------------------------------+
|              GRAPPLING COMBAT                |
+----------------------------------------------+
|                                              |
|     [Unit A Portrait]  VS  [Unit B Portrait] |
|         Controller         Controlled        |
|                                              |
+----------------------------------------------+
|                POSITION DIAGRAM              |
|                                              |
|         [Standing]                           |
|              |                               |
|         [Clinch] ----+                       |
|           / \        |                       |
|  [Guard]     [Mount] |                       |
|     \         /      |                       |
|   [Side Control]-----+                       |
|        |                                     |
|   [Back Mount]                               |
|                                              |
|   Current: CLINCH (highlighted)              |
+----------------------------------------------+
|  AVAILABLE ACTIONS                           |
|  +------------+ +------------+ +----------+  |
|  | Apply Hold | | Transition | |  Escape  |  |
|  +------------+ +------------+ +----------+  |
|  +------------+ +------------+               |
|  |  Release   | |   Strike   |               |
|  +------------+ +------------+               |
+----------------------------------------------+
|  HOLD OPTIONS (if Apply Hold selected)       |
|  [Choke] [Armbar] [Leg Lock] [Crush]         |
+----------------------------------------------+
```

### 6.2 Position Diagram

- Nodes represent grappling positions
- Lines show valid transitions
- Current position highlighted (purple)
- Available transitions highlighted (green)
- Unavailable positions dimmed

### 6.3 Hold Display

When a hold is active:
```
+------------------------+
| ACTIVE HOLD: Rear Choke |
| Damage/Turn: 15         |
| Status: Choking (-2CS)  |
| Escape DC: 18           |
+------------------------+
```

---

## 7. Equipment/Inventory Screen

Full-screen interface for equipment management.

### 7.1 Layout

```
+------------------------------------------------------------------+
|  CHARACTER EQUIPMENT                               [Close Button] |
+------------------------------------------------------------------+
|                                                                   |
|  [Character      |  EQUIPMENT SLOTS                               |
|   Model/         |  +----------+  +----------+  +----------+      |
|   Silhouette]    |  |  WEAPON  |  |  ARMOR   |  |   ITEM   |      |
|                  |  | Rifle    |  | Combat   |  | Medkit   |      |
|                  |  | 30 dmg   |  | DR 18    |  | Heal 30  |      |
|                  |  +----------+  +----------+  +----------+      |
|                  |                                                |
|                  |  +----------+  +----------+  +----------+      |
|                  |  |  ITEM 2  |  |  ITEM 3  |  |  ITEM 4  |      |
|                  |  | Flash    |  | Smoke    |  | Empty    |      |
|                  |  +----------+  +----------+  +----------+      |
|                  |                                                |
+------------------+------------------------------------------------+
|  INVENTORY                                                        |
|  +--------+ +--------+ +--------+ +--------+ +--------+ +-------+ |
|  | Pistol | | Kevlar | | Medkit | | Flash  | | Ammo   | |  ...  | |
|  +--------+ +--------+ +--------+ +--------+ +--------+ +-------+ |
+------------------------------------------------------------------+
|  SELECTED ITEM: Assault Rifle                                     |
|  Damage: 30 | Range: 60 | Accuracy: -1CS | AP Cost: 2             |
|  Penetration: 1.0x | Magazine: 30 | Skill: Shooting               |
|  [EQUIP]                                             [DROP]       |
+------------------------------------------------------------------+
```

### 7.2 Weapon Tooltip

When hovering over a weapon:
```
+---------------------------+
| ASSAULT RIFLE             |
+---------------------------+
| Damage:      30           |
| Range:       60 squares   |
| Accuracy:    -1CS         |
| AP Cost:     2            |
| Penetration: 1.0x         |
| Magazine:    30/30        |
| Skill:       Shooting     |
+---------------------------+
| "Military-grade assault   |
| rifle for sustained       |
| combat."                  |
+---------------------------+
```

### 7.3 Armor Tooltip

```
+---------------------------+
| COMBAT ARMOR              |
+---------------------------+
| DR:          18           |
| Max AP:      85           |
| Weight:      Heavy        |
| Protection:  Physical     |
| Bypassed By: Energy, EMP  |
+---------------------------+
| Requirements: STR 20      |
| Special: Full body        |
+---------------------------+
```

---

## 8. Combat Results Screen

Post-combat summary shown after battle.

### 8.1 Layout

```
+------------------------------------------------------------------+
|                    COMBAT RESULTS                                 |
+------------------------------------------------------------------+
|                                                                   |
|                      VICTORY! (or DEFEAT)                         |
|                                                                   |
+------------------------------------------------------------------+
|  STATISTICS                                                       |
|  +------------------------+  +------------------------+           |
|  | Turns Elapsed: 12      |  | Total Damage Dealt:    |           |
|  | Kills: 3               |  | 450 (Your Team)        |           |
|  | Injuries: 1            |  | 280 (Enemy Team)       |           |
|  +------------------------+  +------------------------+           |
|                                                                   |
|  UNIT PERFORMANCE                                                 |
|  +------------------+-------+--------+--------+--------+          |
|  | Unit             | Kills | Damage | Taken  | Status |          |
|  +------------------+-------+--------+--------+--------+          |
|  | Alpha            | 2     | 180    | 45     | Alive  |          |
|  | Beta             | 1     | 120    | 0      | Alive  |          |
|  | Charlie          | 0     | 150    | 80     | Injured|          |
|  +------------------+-------+--------+--------+--------+          |
|                                                                   |
|  REWARDS                                                          |
|  Experience: +500                                                 |
|  Credits: +1,200                                                  |
|  Items Found: [Medkit] [Ammo x30]                                 |
|                                                                   |
|                    [CONTINUE]                                     |
+------------------------------------------------------------------+
```

---

## 9. Status Effect Icons

Visual indicators for all status effects.

| Effect | Icon | Color | Animation |
|--------|------|-------|-----------|
| Bleeding | Blood drop | Red | Dripping |
| Burning | Flame | Orange | Flickering |
| Poisoned | Skull | Green | Pulsing |
| Stunned | Stars | Yellow | Rotating |
| Blinded | Eye with X | White | None |
| Slowed | Snail | Blue | None |
| Grappled | Chain | Purple | Swaying |
| In Cover | Shield | Blue | None |
| Prone | Horizontal figure | Gray | None |
| Defensive | Shield+ | Green | Glowing |
| Aggressive | Sword | Red | Glowing |

---

## 10. Sound/Audio Indicators

Visual feedback for game sounds.

| Sound Type | Visual |
|------------|--------|
| Gunshot | Screen flash + expanding ring |
| Explosion | Screen shake + flash |
| Footsteps | Subtle ripple from unit |
| Door Open | Highlight on door |
| Grapple | Impact burst effect |
| Power Activation | Colored aura |

---

## 11. Damage Numbers

Floating combat text requirements.

| Damage Type | Color | Style | Example |
|-------------|-------|-------|---------|
| Physical | White | Normal | "25" |
| Critical | Yellow | Large + burst | "45!" |
| Blocked | Gray | Strikethrough | "~~20~~" |
| Healing | Green | + prefix | "+30" |
| Status | Orange | Italic | "Bleeding!" |
| Miss | Gray | Smaller | "Miss" |

---

## 12. Minimap (Optional)

Small overview map in corner.

```
+----------------+
| . . . . . . . .|
| . # # . . . . .|  # = Wall
| . . . A . . . .|  A = Player units
| . . . . . B . .|  B = Enemy units
| . . . . . . . .|  . = Floor
+----------------+
```

---

## 13. Data Display Requirements

### Weapon Stats to Show
- Name
- Damage
- Range (in squares)
- Accuracy modifier
- AP cost
- Penetration multiplier
- Ammo/magazine size
- Skill requirement

### Armor Stats to Show
- Name
- Damage Reduction (DR)
- Max Armor Points
- Weight class
- Protection types
- Weakness types

### Unit Stats to Show
- Name
- HP / Max HP
- AP / Max AP
- STR, AGL, INT, INS
- Active status effects
- Current weapon
- Current armor
- Position coordinates

---

## 14. Responsive Design Notes

### Minimum Resolution
- 1280 x 720 (720p)

### Recommended Resolution
- 1920 x 1080 (1080p)

### Scaling Requirements
- Grid tiles should scale with resolution
- UI panels should have minimum sizes
- Text should remain readable at all sizes

---

## 15. Animation Requirements

| Animation | Duration | Priority |
|-----------|----------|----------|
| Unit Movement | 0.5s per tile | High |
| Attack Animation | 0.3s | High |
| Damage Flash | 0.2s | High |
| Turn Transition | 0.5s | Medium |
| Menu Open/Close | 0.2s | Low |
| Status Effect Apply | 0.3s | Medium |

---

## 16. Accessibility Considerations

- Color-blind friendly palette options
- High contrast mode
- Screen reader support for combat log
- Keyboard navigation for all menus
- Configurable text size
- Audio cues for important events

---

## Summary

This document covers all UI elements needed for:
1. Tactical combat gameplay
2. Unit management
3. Equipment handling
4. Grappling system
5. Combat feedback
6. Results display

Use these specifications when creating mockups or implementing the actual game UI.

---

*Related Files:*
- Complete_Combat_Simulator.html (reference implementation)
- Weapons_Complete.csv (weapon data)
- Armor_Equipment.csv (armor data)
- Wrestling_Martial_Arts_Complete.csv (grappling data)
