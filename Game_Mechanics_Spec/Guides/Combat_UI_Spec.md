# Combat UI Front-End Specification

## Overview

This document specifies every UI element, button, panel, and interaction for the tactical combat screen. Use this to build React components that interface with the Phaser 3 game canvas.

---

## Screen Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TOP BAR                                                                     │
├───────────────────────────────────────┬─────────────────────────────────────┤
│                                       │                                     │
│                                       │                                     │
│         TACTICAL MAP                  │          SIDE PANEL                 │
│         (Phaser Canvas)               │          (React)                    │
│                                       │                                     │
│                                       │                                     │
│                                       │                                     │
├───────────────────────────────────────┴─────────────────────────────────────┤
│ BOTTOM BAR                                                                  │
│ CHARACTER INFO | WEAPONS | BELT | ACTION BUTTONS                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Layer Separation

| Layer | Technology | Responsibility |
|-------|------------|----------------|
| Top Bar | React | Turn info, game controls, time |
| Tactical Map | Phaser 3 | Grid, units, effects, movement |
| Side Panel | React | Combat log, unit details, modals |
| Bottom Bar | React | Selected unit HUD, actions |

---

## Component Specifications

### 1. TOP BAR

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  TURN: Blue Team  │  Round: 3  │  Time: 14:32  │  [Pause] [Settings] [Exit]  │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### Elements

| Element | Type | Data | Behavior |
|---------|------|------|----------|
| Turn Indicator | Text + Color | `currentTeam: string` | Shows which team's turn (Blue/Red/Green) |
| Round Counter | Text | `roundNumber: number` | Increments each full rotation |
| Mission Timer | Text | `missionTime: string` | Optional countdown or elapsed |
| Pause Button | Button | - | Pauses game, opens pause menu |
| Settings Button | Button | - | Opens settings modal |
| Exit Button | Button | - | Confirmation dialog, then exit |

#### Styling

```css
.top-bar {
  height: 48px;
  background: #1a1a2e;
  border-bottom: 2px solid #4a4a6a;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
}

.turn-indicator {
  font-size: 18px;
  font-weight: bold;
  color: var(--team-color); /* Blue: #4a90d9, Red: #d94a4a, Green: #4ad94a */
}
```

---

### 2. TACTICAL MAP (Phaser Canvas)

The Phaser canvas handles all tactical visualization. React communicates via Event Bridge.

#### Map Features (Phaser)

| Feature | Visual | Interaction |
|---------|--------|-------------|
| Grid Tiles | Isometric squares, terrain textures | Hover highlight, click select |
| Unit Tokens | Character sprites with team color base | Click to select, drag disabled |
| Health Bars | Red/green bar above unit | Updates on damage |
| Status Icons | Small icons (bleeding, stunned, etc.) | Tooltip on hover |
| Movement Range | Blue overlay tiles | Shows when MOVE active |
| Attack Range | Red overlay tiles | Shows when ATTACK active |
| LOS Indicator | Green/red line to target | Shows hit chance |
| Cover Icons | Shield icons on tiles | Half/full cover indicators |
| Throw Arc | Bezier curve with endpoint marker | Shows grenade trajectory |

#### Event Bridge: React → Phaser

```typescript
// React calls these to control Phaser
EventBridge.emit('select-unit', { unitId: string });
EventBridge.emit('start-move-mode', { unitId: string });
EventBridge.emit('start-attack-mode', { unitId: string, weaponId: string });
EventBridge.emit('start-throw-mode', { unitId: string, itemId: string });
EventBridge.emit('execute-action', { action: ActionPayload });
EventBridge.emit('cancel-action');
EventBridge.emit('end-turn');
EventBridge.emit('toggle-gadget', { gadgetId: string, state: boolean });
EventBridge.emit('set-gadget-intensity', { gadgetId: string, value: number });
EventBridge.emit('set-gadget-mode', { gadgetId: string, mode: string });
```

#### Event Bridge: Phaser → React

```typescript
// Phaser emits these to update React UI
EventBridge.on('unit-selected', (data: UnitData) => {});
EventBridge.on('unit-moved', (data: { unitId, from, to, apRemaining }) => {});
EventBridge.on('attack-resolved', (data: AttackResult) => {});
EventBridge.on('unit-damaged', (data: { unitId, damage, newHp }) => {});
EventBridge.on('unit-died', (data: { unitId, killedBy }) => {});
EventBridge.on('turn-changed', (data: { team, round }) => {});
EventBridge.on('tile-clicked', (data: { x, y, terrain, occupant }) => {});
EventBridge.on('action-cancelled');
```

---

### 3. SIDE PANEL

```
┌──────────────────────────┐
│ COMBAT LOG          [^]  │
├──────────────────────────┤
│ ► Batman attacks Thug 1  │
│   → Hit! 25 damage       │
│   → Thug 1 is bleeding   │
│                          │
│ ► Spider-Man moves       │
│   → (12,8) to (15,10)    │
│                          │
│ ► Joker throws grenade   │
│   → Lands at (14,9)      │
│   → 3 units in blast     │
│                          │
│ [Auto-scroll ✓]          │
├──────────────────────────┤
│ SELECTED: Batman         │
│ ─────────────────────────│
│ HP: 85/100 ████████░░    │
│ AP: 4/6    ████░░        │
│ ─────────────────────────│
│ STATUS:                  │
│ [Bleeding] [In Cover]    │
│ ─────────────────────────│
│ POSITION: (15, 22)       │
│ FACING: North            │
│ ELEVATION: Ground        │
└──────────────────────────┘
```

#### Combat Log Component

| Property | Type | Description |
|----------|------|-------------|
| `entries` | `LogEntry[]` | Array of log entries |
| `autoScroll` | `boolean` | Auto-scroll to newest |
| `maxEntries` | `number` | Limit displayed (default 100) |

```typescript
interface LogEntry {
  id: string;
  timestamp: number;
  type: 'attack' | 'move' | 'damage' | 'status' | 'death' | 'item' | 'system';
  actor: string;
  target?: string;
  message: string;
  details?: string[];
  color?: string;
}
```

#### Selected Unit Panel

| Field | Type | Source |
|-------|------|--------|
| Name | string | `unit.name` |
| Portrait | image | `unit.portrait_url` |
| HP | number/number | `unit.hp / unit.max_hp` |
| AP | number/number | `unit.ap / unit.max_ap` |
| Status Effects | StatusEffect[] | `unit.status_effects` |
| Position | {x, y} | `unit.position` |
| Facing | string | `unit.facing` |
| Elevation | string | `unit.elevation` |

---

### 4. BOTTOM BAR - Character HUD

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ [Portrait] BATMAN          HP: 85/100 ████████░░    AP: 4/6 ████░░            │
├────────────────────────────────────────────────────────────────────────────────┤
│ PRIMARY         SECONDARY       MELEE        BELT ITEMS                        │
│ [1: Batarang▼]  [2: Staff▼]    [3: Fist]    [4][5][6][7][8][9]               │
│ Dmg:15 Rng:20   Dmg:25 Rng:1   Dmg:20       Smoke Flash Grap Med EMP C4      │
├────────────────────────────────────────────────────────────────────────────────┤
│ [A]TTACK  [M]OVE  [T]HROW  [G]ADGET  [I]NVENTORY  [O]VERWATCH  [E]ND TURN    │
└────────────────────────────────────────────────────────────────────────────────┘
```

#### Character Info Section

| Element | Type | Behavior |
|---------|------|----------|
| Portrait | 64x64 image | Shows selected character |
| Name | Text | Character name |
| HP Bar | Progress bar | Red when <25%, Yellow when <50% |
| AP Bar | Progress bar | Shows action points remaining |

#### Weapon Slots

| Slot | Hotkey | Type | Behavior |
|------|--------|------|----------|
| Primary | 1 | Dropdown | Shows equipped primary weapon, click to cycle |
| Secondary | 2 | Dropdown | Shows equipped secondary weapon |
| Melee | 3 | Button | Shows melee weapon/fists |

**Weapon Slot Dropdown Content:**
```
┌─────────────────────────┐
│ Equipped: Batarang      │
├─────────────────────────┤
│ ○ Batarang (15 dmg)     │
│ ○ Grappling Hook        │
│ ○ Taser (stun)          │
└─────────────────────────┘
```

#### Belt Slots (Hotkeys 4-9)

| Slot | Hotkey | Width | Content |
|------|--------|-------|---------|
| Belt 1 | 4 | 48px | Consumable/throwable item |
| Belt 2 | 5 | 48px | Consumable/throwable item |
| Belt 3 | 6 | 48px | Consumable/throwable item |
| Belt 4 | 7 | 48px | Consumable/throwable item |
| Belt 5 | 8 | 48px | Consumable/throwable item |
| Belt 6 | 9 | 48px | Consumable/throwable item |

**Belt Slot States:**
- Empty: Gray outline, no icon
- Filled: Item icon + quantity badge
- Selected: Highlighted border
- Cooldown: Grayed out + timer overlay

**Belt Slot Tooltip:**
```
┌─────────────────────────┐
│ Flashbang Grenade       │
│ ────────────────────────│
│ Quantity: 3             │
│ Effect: Blind 3 turns   │
│ Range: 15 squares       │
│ Blast: 3x3              │
│ AP Cost: 2              │
│ ────────────────────────│
│ [Click or press 5]      │
└─────────────────────────┘
```

#### Action Buttons

| Button | Hotkey | Icon | State Logic |
|--------|--------|------|-------------|
| ATTACK | A | Crosshair | Disabled if no weapon equipped or 0 AP |
| MOVE | M | Footprints | Disabled if 0 AP |
| THROW | T | Arc arrow | Disabled if no throwables |
| GADGET | G | Gear | Disabled if no gadgets |
| INVENTORY | I | Backpack | Always enabled |
| OVERWATCH | O | Eye | Disabled if <3 AP |
| END TURN | E | Checkmark | Always enabled |

**Button States:**
```css
.action-button {
  width: 100px;
  height: 48px;
  border-radius: 4px;
}

.action-button.enabled {
  background: #2a4a6a;
  color: #ffffff;
  cursor: pointer;
}

.action-button.disabled {
  background: #333333;
  color: #666666;
  cursor: not-allowed;
}

.action-button.active {
  background: #4a90d9;
  border: 2px solid #ffffff;
}

.action-button:hover:not(.disabled) {
  background: #3a5a7a;
}
```

---

## Modal Specifications

### 5. GADGET PANEL (G key)

```
┌─────────────────────────────────────────┐
│ GADGETS                           [X]   │
├─────────────────────────────────────────┤
│ ACTIVE GADGETS                          │
│ ─────────────────────────────────────── │
│ [◉] Night Vision - ON                   │
│     Power: ████████░░ 80%               │
│                                         │
│ [◉] Encrypted Radio - ON                │
│     Mode: [▼ Secure Channel]            │
│                                         │
├─────────────────────────────────────────┤
│ AVAILABLE GADGETS                       │
│ ─────────────────────────────────────── │
│ [○] Thermal Goggles - OFF               │
│     Mode: [▼ Standard]                  │
│     [Toggle: 1 AP]                      │
│                                         │
│ [○] Stealth Field - OFF                 │
│     Intensity: ═══════○═══ 0%           │
│     [Toggle: 2 AP]                      │
│                                         │
├─────────────────────────────────────────┤
│ DEPLOYABLES                             │
│ ─────────────────────────────────────── │
│ [Deploy] Motion Sensor (x2)  [2 AP]     │
│ [Deploy] C4 Explosive (x1)   [2 AP]     │
│                                         │
├─────────────────────────────────────────┤
│ CONTROLLED UNITS                        │
│ ─────────────────────────────────────── │
│ [Control] Recon Drone @ (15, 22)        │
│           Battery: 60%  [Recall]        │
└─────────────────────────────────────────┘
```

#### Gadget Panel Data Structure

```typescript
interface GadgetPanelProps {
  gadgets: Gadget[];
  currentAP: number;
  onToggle: (gadgetId: string, state: boolean) => void;
  onSetIntensity: (gadgetId: string, value: number) => void;
  onSetMode: (gadgetId: string, mode: string) => void;
  onDeploy: (gadgetId: string) => void;
  onControl: (gadgetId: string) => void;
  onRecall: (gadgetId: string) => void;
  onClose: () => void;
}

interface Gadget {
  id: string;
  name: string;
  operation_type: 'passive' | 'toggle' | 'intensity' | 'mode_select' | 'deploy' | 'consumable' | 'controlled';
  ui_control: 'none' | 'switch' | 'slider' | 'dropdown' | 'place_button' | 'use_button' | 'unit_control';
  is_active: boolean;
  current_mode?: string;
  modes?: string[];
  current_intensity?: number;
  intensity_range?: { min: number; max: number };
  power_level?: number;
  quantity?: number;
  cooldown_remaining?: number;
  ap_cost: number;
  deployed_position?: { x: number; y: number };
}
```

#### Gadget UI Controls

**Toggle Switch:**
```
[◉ ON / ○ OFF]   ← Click to toggle
```

**Mode Dropdown:**
```
Mode: [▼ Standard Vision  ]
      ┌──────────────────┐
      │ Standard Vision ◄│
      │ X-Ray Vision     │
      │ Heat Signature   │
      └──────────────────┘
```

**Intensity Slider:**
```
Intensity: ═══════●═══ 75%
           0%          100%
```

**Deploy Button:**
```
[Deploy] Motion Sensor (x2)  [2 AP]
         ↓
Click map to place
```

---

### 6. INVENTORY PANEL (I key)

```
┌─────────────────────────────────────────────────────────────────┐
│ INVENTORY                                               [X]     │
├───────────────────────────────┬─────────────────────────────────┤
│ EQUIPPED                      │ BACKPACK                        │
│ ─────────────────────────     │ ─────────────────────────────── │
│ HEAD:    [Night Vision]       │ [Medkit x3] [Ammo x20] [Rope]   │
│ TORSO:   [Tactical Vest]      │ [Smoke x2]  [Flash x2] [EMP]    │
│ ARMS:    [Empty]              │ [Lockpick]  [Binoculars] [Map]  │
│ HANDS:   [Grapple Gloves]     │ [Empty]     [Empty]     [Empty] │
│ LEGS:    [Combat Pants]       │                                 │
│ FEET:    [Stealth Boots]      │ Weight: 45/60 lbs               │
│                               │                                 │
│ PRIMARY:  [Batarang ▼]        │ ─────────────────────────────── │
│ SECONDARY:[Staff]             │ GROUND ITEMS (adjacent)         │
│ MELEE:   [Fists]              │ ─────────────────────────────── │
│                               │ [Pistol] [Ammo x5]              │
│ BELT:                         │                                 │
│ [4:Smoke][5:Flash][6:Grap]    │ [Pick Up: 1 AP each]            │
│ [7:Med]  [8:EMP]  [9:C4]      │                                 │
├───────────────────────────────┴─────────────────────────────────┤
│ SELECTED: Medkit                                                │
│ Heals 25 HP. Single use.                                        │
│ [EQUIP TO BELT]  [DROP]  [USE NOW: 1 AP]                        │
└─────────────────────────────────────────────────────────────────┘
```

#### Equipment Slots

| Slot | Accepts | Examples |
|------|---------|----------|
| HEAD | Helmets, Goggles, Masks | Night Vision, Gas Mask, Tactical Helmet |
| TORSO | Armor, Vests | Tactical Vest, Kevlar, Power Armor |
| ARMS | Bracers, Shields | Wrist Computer, Forearm Guards |
| HANDS | Gloves | Grapple Gloves, Insulated Gloves |
| LEGS | Pants, Greaves | Combat Pants, Leg Armor |
| FEET | Boots | Stealth Boots, Jump Boots |
| PRIMARY | Ranged weapons | Rifle, Pistol, Bow |
| SECONDARY | Ranged/melee | Pistol, SMG, Sword |
| MELEE | Melee weapons | Knife, Baton, Fists |
| BELT (x6) | Quick-use items | Grenades, Medkits, Gadgets |

#### Inventory Interactions

| Action | AP Cost | Behavior |
|--------|---------|----------|
| Equip item | 1 AP | Move from backpack to slot |
| Unequip item | 1 AP | Move from slot to backpack |
| Drop item | 0 AP | Item appears on ground at feet |
| Pick up item | 1 AP | Must be adjacent, adds to backpack |
| Use item | Varies | Consume item, apply effect |
| Swap weapons | 1 AP | Switch primary/secondary |

#### Drag-and-Drop Rules

```typescript
interface DragDropRules {
  // Backpack → Equipment slot: Check slot type match
  // Equipment slot → Backpack: Always allowed if space
  // Backpack → Belt: Only quick-use items
  // Belt → Backpack: Always allowed
  // Any → Ground: Drop (0 AP)
  // Ground → Backpack: Pick up (1 AP)
}
```

---

### 7. THROW MODE OVERLAY

When THROW is active (T key or belt item selected):

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│    Character                                                │
│        ●━━━━━━━━━━━━━╮                                     │
│                       ╲                                     │
│                        ╲    ← Bezier arc (green=in range)  │
│                         ●   ← Cursor/target                │
│                        ◯◯◯                                  │
│                       ◯◯◯◯◯ ← Blast radius (orange)        │
│                        ◯◯◯                                  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ THROWING: Flashbang    Range: 15    Blast: 3x3    [Cancel]  │
└─────────────────────────────────────────────────────────────┘
```

#### Arc Visualization

```typescript
interface ThrowArcProps {
  origin: { x: number; y: number };
  target: { x: number; y: number };
  maxRange: number;
  blastRadius: number;
  isInRange: boolean;
}

// Colors
const ARC_IN_RANGE = '#4ad94a';      // Green
const ARC_OUT_OF_RANGE = '#d94a4a';  // Red
const BLAST_RADIUS = '#d9944a';      // Orange
```

---

### 8. ATTACK MODE OVERLAY

When ATTACK is active (A key):

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│    Character                                                │
│        ●━━━━━━━━━━━━●  Target                              │
│              ↑                                              │
│         LOS line (green = clear, red = blocked)            │
│                                                             │
│    [Thug 1]              [Target selected]                  │
│    HP: 45/60            Hit Chance: 75%                     │
│    Cover: Half          Damage: 15-25                       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ ATTACKING: Batarang    Target: Thug 1    [Confirm] [Cancel] │
└─────────────────────────────────────────────────────────────┘
```

#### Target Info Panel

```typescript
interface TargetInfoProps {
  target: {
    name: string;
    hp: number;
    maxHp: number;
    cover: 'none' | 'half' | 'full';
    distance: number;
  };
  attack: {
    hitChance: number;
    damageRange: { min: number; max: number };
    apCost: number;
    ammoRemaining: number;
  };
}
```

---

### 9. OVERWATCH MODE

When OVERWATCH is active (O key):

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│              ╱ Overwatch cone (blue overlay)                │
│             ╱                                               │
│    ●━━━━━━╱                                                │
│    Character                                                │
│             ╲                                               │
│              ╲                                              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ OVERWATCH: Click to set direction    AP: 3    [Cancel]      │
└─────────────────────────────────────────────────────────────┘
```

#### Overwatch Data

```typescript
interface OverwatchState {
  unitId: string;
  direction: number; // 0-360 degrees
  coneAngle: number; // Default 90 degrees
  range: number;     // Weapon range
  apCost: number;    // Usually 3
}
```

---

## Hotkey Reference

### Global Hotkeys

| Key | Action | Context |
|-----|--------|---------|
| Escape | Cancel current action / Close modal | Always |
| Space | End turn | No modal open |
| Tab | Cycle through units | No modal open |
| ` (backtick) | Toggle combat log | Always |

### Combat Hotkeys

| Key | Action | Requirements |
|-----|--------|--------------|
| A | Attack mode | Unit selected, weapon equipped |
| M | Move mode | Unit selected, AP > 0 |
| T | Throw mode | Unit selected, throwable item |
| G | Open gadget panel | Unit selected |
| I | Open inventory | Unit selected |
| O | Overwatch mode | Unit selected, AP >= 3 |
| E | End turn | Unit selected |

### Weapon Hotkeys

| Key | Action |
|-----|--------|
| 1 | Select primary weapon |
| 2 | Select secondary weapon |
| 3 | Select melee weapon |
| 4-9 | Use belt item in slot |
| R | Reload current weapon |

### Camera Hotkeys

| Key | Action |
|-----|--------|
| W/Up | Pan camera up |
| A/Left | Pan camera left |
| S/Down | Pan camera down |
| D/Right | Pan camera right |
| Q | Rotate camera left |
| E | Rotate camera right |
| Mouse Wheel | Zoom in/out |
| Middle Click + Drag | Pan camera |

---

## State Management

### Combat State Shape

```typescript
interface CombatState {
  // Turn management
  currentTeam: 'blue' | 'red' | 'green';
  roundNumber: number;
  selectedUnitId: string | null;

  // UI state
  activeMode: 'idle' | 'move' | 'attack' | 'throw' | 'overwatch' | 'deploy';
  openModal: 'none' | 'gadget' | 'inventory' | 'settings' | 'pause';

  // Units
  units: Unit[];

  // Map state
  groundItems: GroundItem[];
  deployedGadgets: DeployedGadget[];

  // Combat log
  logEntries: LogEntry[];

  // Targeting
  currentTarget: string | null;
  throwTarget: { x: number; y: number } | null;
  overwatchDirection: number | null;
}
```

### Unit Data Shape

```typescript
interface Unit {
  id: string;
  name: string;
  team: 'blue' | 'red' | 'green';
  portrait_url: string;

  // Stats
  hp: number;
  max_hp: number;
  ap: number;
  max_ap: number;

  // Position
  position: { x: number; y: number };
  facing: 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';
  elevation: 'ground' | 'elevated' | 'flying';

  // Status
  status_effects: StatusEffect[];
  is_in_cover: 'none' | 'half' | 'full';
  is_prone: boolean;
  is_overwatching: boolean;
  overwatch_direction?: number;

  // Equipment
  equipment: Equipment;
  inventory: InventoryItem[];
  gadgets: Gadget[];
}
```

---

## Color Palette

```css
:root {
  /* Backgrounds */
  --bg-dark: #1a1a2e;
  --bg-panel: #16213e;
  --bg-button: #2a4a6a;
  --bg-hover: #3a5a7a;

  /* Team Colors */
  --team-blue: #4a90d9;
  --team-red: #d94a4a;
  --team-green: #4ad94a;

  /* Status Colors */
  --health-full: #4ad94a;
  --health-half: #d9d94a;
  --health-low: #d94a4a;

  /* UI Colors */
  --border: #4a4a6a;
  --text-primary: #ffffff;
  --text-secondary: #aaaaaa;
  --text-disabled: #666666;

  /* Action Colors */
  --action-attack: #d94a4a;
  --action-move: #4a90d9;
  --action-throw: #d9944a;
  --action-gadget: #9444d9;
}
```

---

## Responsive Considerations

### Minimum Resolution
- **1280x720** (720p) - Minimum supported
- **1920x1080** (1080p) - Optimal

### Panel Behavior

| Resolution | Side Panel | Bottom Bar |
|------------|------------|------------|
| < 1280 | Collapsible | Compact mode |
| 1280-1919 | 300px fixed | Standard |
| >= 1920 | 350px fixed | Extended |

---

## Animation Timings

| Animation | Duration | Easing |
|-----------|----------|--------|
| Button hover | 150ms | ease-out |
| Panel slide | 200ms | ease-in-out |
| Modal open | 250ms | ease-out |
| Health bar change | 300ms | linear |
| Log entry appear | 200ms | ease-out |
| Tooltip appear | 100ms | ease-out |

---

## Accessibility

### Keyboard Navigation
- All interactive elements focusable with Tab
- Enter/Space activates buttons
- Arrow keys navigate within panels
- Escape closes modals

### Screen Reader
- All buttons have aria-labels
- Status changes announced
- Combat log auto-reads new entries (optional)

### Color Blindness
- Don't rely on color alone
- Use icons + color for status
- High contrast mode available

---

## Related Files

| File | Purpose |
|------|---------|
| `Gadget_Operation_System.md` | Gadget types and controls |
| `Tech_Gadgets_Complete.csv` | Full gadget database |
| `Weapons_Complete.csv` | Weapon stats |
| `Combat_System_Master_Reference.csv` | Combat rules |

---

*Last Updated: 2024-12-05*
*Version: 1.0*
