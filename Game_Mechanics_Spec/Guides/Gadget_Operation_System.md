# Gadget Operation System

## Overview

Every gadget has an **operation type** that defines HOW the player interacts with it. This determines:
- What UI control appears (switch, slider, button, etc.)
- How much AP it costs to use
- Whether it persists on the map
- If it has cooldowns or limited uses

---

## Operation Types

### 1. Passive (`passive`)

**UI Control:** None (always active)

**Description:** Works automatically when equipped. No player input needed.

**Examples:**
- Tactical Vest (+6 equipment slots)
- Gas Mask (filters air)
- Metal Detector (always detects nearby metal)

**Combat Behavior:**
- Effect is always on
- No AP cost
- Cannot be toggled off
- No cooldown

```
┌─────────────────────────────┐
│ [Icon] Gas Mask             │
│ Status: ACTIVE              │
│ Effect: Immune to gas       │
└─────────────────────────────┘
```

---

### 2. Toggle (`toggle`)

**UI Control:** On/Off Switch

**Description:** Player can turn on or off. Some consume power while active.

**Examples:**
- Night Vision Goggles
- Thermal Goggles
- Encrypted Radio mode
- Stealth Field

**Combat Behavior:**
- 0-1 AP to toggle (varies by gadget)
- May drain power while active
- Can have cooldown after deactivation
- Some have multiple modes (dropdown + toggle)

```
┌─────────────────────────────────────┐
│ [Icon] Night Vision Goggles         │
│ ────────────────────────────────────│
│ Status: [ON ◉ / ○ OFF]              │
│                                      │
│ Power: ████████░░ 80%               │
│ Effect: See in darkness             │
└─────────────────────────────────────┘
```

---

### 3. Intensity (`intensity`)

**UI Control:** Slider (0-100%)

**Description:** Variable power/range/effect. Player adjusts intensity.

**Examples:**
- Signal Jammer (higher = wider radius)
- Beam Width (narrow vs wide)
- Stealth Field power (higher = more invisible but drains faster)

**Combat Behavior:**
- Can be adjusted freely (0 AP to adjust)
- Higher intensity = more effect but faster power drain
- Some have minimum intensity to function

```
┌─────────────────────────────────────┐
│ [Icon] Signal Jammer                │
│ ────────────────────────────────────│
│ Status: [ON ◉ / ○ OFF]              │
│                                      │
│ Intensity: ═══════●═══  75%         │
│ Radius: 375ft (500ft max)           │
│                                      │
│ Power: ██████░░░░ 60%               │
│ Drain: High (75% intensity)         │
└─────────────────────────────────────┘
```

---

### 4. Mode Select (`mode_select`)

**UI Control:** Dropdown Menu

**Description:** Multiple operating modes. Player selects one.

**Examples:**
- Weapon: Kill / Stun
- Chemical Sniffer: Explosives / Drugs / Both
- Thermal Goggles: Standard / X-Ray / Enhanced
- Drone: Scout / Attack / Return

**Combat Behavior:**
- 0-1 AP to switch modes (varies)
- Only one mode active at a time
- May have cooldown on mode switch
- Modes have different effects/costs

```
┌─────────────────────────────────────┐
│ [Icon] Thermal Goggles              │
│ ────────────────────────────────────│
│ Status: [ON ◉ / ○ OFF]              │
│                                      │
│ Mode: [▼ Standard Vision  ]         │
│       [ Standard Vision   ] ◄       │
│       [ X-Ray Vision      ]         │
│       [ Heat Signature    ]         │
│                                      │
│ Power: ████████░░ 80%               │
└─────────────────────────────────────┘
```

---

### 5. Deploy (`deploy`)

**UI Control:** Place Button + Map Click

**Description:** Place on the tactical map. Persists until destroyed or expires.

**Examples:**
- Motion Sensor
- C4 Block
- Hidden Camera
- Signal Jammer
- GPS Tracker

**Combat Behavior:**
- 2-3 AP to deploy
- Click location on map to place
- Remains until destroyed/removed/expires
- Some can be picked up again
- Shows as object on tactical map

```
┌─────────────────────────────────────┐
│ [Icon] Motion Sensor                │
│ ────────────────────────────────────│
│ Quantity: 2 remaining               │
│                                      │
│ [DEPLOY] ← Click, then click map    │
│                                      │
│ Effect: Alerts on movement (50ft)   │
│ Duration: Until destroyed           │
│ AP Cost: 2                          │
└─────────────────────────────────────┘
```

**Deployed Object UI (on map):**
```
     [M]  ← Motion Sensor icon
      |
   ╭──┴──╮
   │     │ ← Detection radius (dashed)
   ╰─────╯
```

---

### 6. Consumable (`consumable`)

**UI Control:** Use Button

**Description:** Single use or limited uses. Removed after depleted.

**Examples:**
- Grenades (Frag, Smoke, Flash)
- Medkits
- Auto-Injectors
- Breaching Charges

**Combat Behavior:**
- 1-3 AP to use
- Limited quantity
- May require targeting (click enemy/location)
- Some have multiple uses (Medkit x10)
- Removed when depleted

```
┌─────────────────────────────────────┐
│ [Icon] Flashbang Grenade            │
│ ────────────────────────────────────│
│ Quantity: 3                         │
│                                      │
│ [USE] ← Click, then click target    │
│                                      │
│ Effect: Blind/deafen (5x5 area)     │
│ Range: 15 squares                   │
│ AP Cost: 2                          │
└─────────────────────────────────────┘
```

---

### 7. Controlled (`controlled`)

**UI Control:** Unit Control Panel

**Description:** Operates as a separate controllable unit. Requires operator attention.

**Examples:**
- Recon Drone
- Combat Drone
- Ground Robot
- Swarm Drones

**Combat Behavior:**
- 3-5 AP to launch
- Becomes separate unit on tactical map
- Has own movement and actions
- Operator loses AP while controlling
- Can be destroyed
- May have autonomous modes

```
┌─────────────────────────────────────┐
│ [Icon] Recon Drone                  │
│ ────────────────────────────────────│
│ Status: DEPLOYED at (15, 22)        │
│                                      │
│ Drone HP: 10/10                     │
│ Battery: ████████░░ 80%             │
│ Range from Operator: 45/100 ft      │
│                                      │
│ Mode: [▼ Scout        ]             │
│       [ Scout         ] ◄           │
│       [ Return        ]             │
│                                      │
│ [CONTROL] ← Switch to drone view    │
│ [RECALL]  ← Auto-return             │
└─────────────────────────────────────┘
```

---

## UI Implementation

### Combat HUD Integration

When a character is selected, their gadgets appear in a panel:

```
┌───────────────────────────────────────────────────────┐
│ GADGETS                                        [G]    │
├───────────────────────────────────────────────────────┤
│ ACTIVE:                                               │
│ [◉] Night Vision - ON      [◉] Encrypted Radio - ON  │
│                                                       │
│ TOGGLEABLE:                                           │
│ [○] Thermal Goggles - OFF  [○] Stealth Field - OFF   │
│                                                       │
│ DEPLOYABLES:                                          │
│ [Deploy] Motion Sensor (x2)  [Deploy] C4 (x1)        │
│                                                       │
│ CONSUMABLES:                                          │
│ [Use] Flashbang (x3)  [Use] Medkit (x5)              │
│                                                       │
│ DRONES:                                               │
│ [Control] Recon Drone - Deployed (15, 22)            │
└───────────────────────────────────────────────────────┘
```

### Hotkey Access

| Hotkey | Action |
|--------|--------|
| G | Open Gadget Panel |
| 1-0 | Quick toggle gadgets 1-10 |
| Shift+1-0 | Quick use consumables 1-10 |

---

## Quick Reference

### Operation Type Summary

| Type | UI | AP | Persists | Example |
|------|----|----|----------|---------|
| passive | none | 0 | always | Gas Mask |
| toggle | switch | 0-1 | while on | Night Vision |
| intensity | slider | 0 | while on | Signal Jammer |
| mode_select | dropdown | 0-1 | while on | Thermal Goggles |
| deploy | place | 2-3 | on map | Motion Sensor |
| consumable | use | 1-3 | removed | Grenade |
| controlled | unit | 3-5 | as unit | Drone |

### Power Drain

| Gadget Type | Power Drain |
|-------------|-------------|
| Passive | None |
| Toggle (low power) | 1% per turn |
| Toggle (high power) | 5% per turn |
| Intensity-based | (intensity/100) × 10% per turn |
| Deployed | Battery life fixed |
| Drone | 1% per square moved |

---

## Examples by Category

### Sensors

| Gadget | Operation | Modes | Effect |
|--------|-----------|-------|--------|
| Motion Sensor | deploy | - | Alert on movement |
| Thermal Scanner | toggle | Standard, Enhanced | See heat |
| Life Sign Detector | toggle | - | See heartbeats |
| Metal Detector | passive | - | Always detect metal |

### Combat Gear

| Gadget | Operation | Modes | Effect |
|--------|-----------|-------|--------|
| Flashbang | consumable | - | Blind/deafen |
| C4 | deploy | - | Remote explosive |
| Smoke Grenade | consumable | - | Block LOS |
| Signal Jammer | deploy+intensity | - | Block comms |

### Vision Enhancement

| Gadget | Operation | Modes | Effect |
|--------|-----------|-------|--------|
| Night Vision | toggle | - | See in dark |
| Thermal Goggles | toggle+mode | Standard, X-Ray, Enhanced | See heat/walls |
| Binoculars | toggle | - | Magnify |

### Drones

| Gadget | Operation | Modes | Effect |
|--------|-----------|-------|--------|
| Recon Drone | controlled | Scout, Return | Reveal fog |
| Combat Drone | controlled | Attack, Scout, Return | Armed unit |
| Medical Drone | controlled | Deliver, Return | Supply drop |

---

## Related Files

| File | Contents |
|------|----------|
| Tech_Gadgets_Complete.csv | Full gadget database with operations |
| Combat_UI_Spec.md | UI layout for gadget panel |
| Tech_Equipment_System.md | Equipment slots and loadouts |

---

*Last Updated: 2024-12-05*
*Version: 1.0*
