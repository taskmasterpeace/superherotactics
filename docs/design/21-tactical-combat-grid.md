# 21 — Tactical Combat: Symbolic Grid

> **System:** Turn / AP / initiative / stances & modes / square grid / movement / range / LOS / cover, with **flight-as-altitude-integer** (Z0–Z6) and a wing/shadow indicator (NOT 3D).
> **Status:** Build-ready spec (v1.0)
> **Primary sources:** `Game_Mechanics_Spec/Tactical_Grid_System.csv`, `Game_Mechanics_Spec/Combat_Modes_Stances.csv`, `Initiative_Turn_Order.csv`, `SuperHero Tactics/Combat Compendium REAL - 🦆DODGE CHART🦆.csv`, `Flight_Altitude_System.csv`
> **Secondary sources:** `Building_Flight_Limitations.csv`, `Game_Mechanics_Spec/Combat_Resolution_Quick_Reference.csv`, `Game_Mechanics_Spec/Universal_Table_FIXED.csv`, `Game_Mechanics_Spec/City_Type_Effects.csv`, `Game_Mechanics_Spec/Culture_Region_Effects.csv`, `SuperHero Tactics/TerrainCodes.csv`, `SuperHero Tactics/Combat Compendium REAL - 🎯PERSONALITY TARGET SELECTION🎯.csv`, World Bible `Country.csv`/`Cities.csv`, `SHT_MECHANICS_BIBLE.md` (§3.3, §5.1–§5.4, §5.10, §13 #1/#4/#5/#9/#10, §14).
>
> **Scope (locked).** This doc owns the **spatial + turn skeleton** of tactical combat: how a turn/round runs, the AP economy, initiative ordering, stances & modes, the square grid, movement & terrain cost, range bands, line-of-sight, cover, and the **flight/altitude integer (Z0–Z6)** with its CS effects and indoor caps. It produces the **net Column-Shift (CS)** and **valid-target** inputs that the **resolution engine** (§3.3 Bible) consumes, but it does **NOT** own: the Universal-Table roll itself, damage/armor math, the crit→injury pipeline, status-effect catalogs, wrestling state machine, throwing formula, or the BAMPI/Power-Activation engine. Those are sibling docs. This doc defines the **hand-off contract** to them (see §9). Per Bible §5 these combat systems are specced **lighter** than the world/spine layer — combat is *one verb, not the point*.

---

## 1. Overview & player fantasy

Combat is **symbolic**: a plain square grid drawn in glyphs, units as icons, no 3D camera. A flyer is not a 3D model — she is a token carrying an **altitude integer** and a **wing/shadow indicator** that tells you, at a glance, "this unit is up there, ground melee can't reach her, but she's a sitting duck if she hovers." The *whole point* is that the rich rules — damage types, wrestling, injury, knockback — still **resolve on this flat grid**, so the player reads a tactical situation instantly without a camera fight.

The player fantasy of this layer specifically:

- **Position is a stat.** Standing on a rooftop, behind a half-wall, or one square higher than your target changes the math (`Tactical_Grid_System.csv` Elevation/Cover sections) — you win by *where* you stand before you win by *what* you roll.
- **The clock is honest.** 6 AP/turn (`Tactical_Grid_System.csv` `Total_AP`); every action has a price; you cannot Aim three times and still attack (`Combat_Modes_Stances.csv` AP-budget example proves it overflows). You are always trading.
- **Flight is a real third axis without a third dimension.** Going up costs AP and movement, buys you a **+1..+3 CS height advantage** and makes ground attackers eat **−CS** to reach you — but burns stamina at Z4+, strips your area-weapon power at altitude, and leaves you exposed during takeoff/landing (Bible §5.4 ruling). Indoors a ceiling slams the door on it (`Building_Flight_Limitations.csv`). Flight is *powerful and answerable* — which is the whole reason maps must vary.
- **The world you stand in tilts the fight.** A fight in a Mega-City Resort means civilians everywhere (collateral CS penalties); a fight in a Military city means an armed response clock; a high-crime sector means constant combat risk. The country/city/terrain **spine** reaches *into the grid* (see §8).

**One-line pitch:** *A flat grid of glyphs where altitude is an integer and position is a stat — every modifier in the game collapses onto one axis (±CS) and the country you're standing in is one of those modifiers.*

---

## 2. Canonical units, axes & the round structure (READ FIRST)

### 2.1 Spatial units
| Unit | Value | Source |
|---|---|---|
| 1 grid square | **2 meters** | `Tactical_Grid_System.csv` `Grid_Type` |
| Map sizes | Street fight **20×20**, City block **50×50**, District **100×100** (variable 20×20→100×100) | `Tactical_Grid_System.csv` `Grid_Size` |
| Coordinate | `(X col, Y row, Z altitude)`; e.g. `(15,7,0)` = col 15 row 7 ground | `Tactical_Grid_System.csv` `Coordinate_System` |
| Diagonal move cost | **1.5×** (round down; every 2 diagonals = 3 squares) | `Tactical_Grid_System.csv` `Diagonal_Movement` |

> **RULING TC-1 (altitude unit reconciliation).** Two altitude scales exist in source: `Tactical_Grid_System.csv` says `Z=1 per floor … Flight Z=1 to 10+`; `Flight_Altitude_System.csv` defines **7 discrete levels Z0 (ground) → Z6 (extreme, 1500+ ft)**. Per Bible §5.4 ruling and §13 #5, **the 7-level `Flight_Altitude_System` scale (Z0–Z6) is the grid truth.** Building floors map onto the *same* integer (`Tactical_Grid_System` `Floor_Levels` = +1 Z per floor) and a flyer's power tier only sets her **max reachable Z**, never a second unit. One integer, period.

### 2.2 Round structure (the skeleton this doc owns)
```
PHASE 0  FREE-MOVEMENT / EXPLORATION  (Bible §5.1)
         No AP spent. Units reposition until first enemy enters LOS.
         On first sighting → "CONTACT!" banner → roll Initiative → enter AP combat.
              │
PHASE 1  INITIATIVE ROLL  (§4)  — order all units high→low by Initiative score.
              │
PHASE 2  ROUND LOOP  (repeat until one side eliminated/routed/objective met):
           for each unit in initiative order:
              ├─ refresh AP to 6 (minus any maintained-mode upkeep, §5)
              ├─ pay persistent-stance & toggle-mode upkeep
              ├─ spend AP on moves / attacks / mode toggles / altitude changes
              ├─ Overwatch/Ready interrupts may fire out-of-order (§4.3)
              └─ end unit turn
           end-of-round bookkeeping: stamina drain (altitude), status ticks (sibling),
              suppressive-fire / aim decay, weather re-roll if scripted.
```
The *exploration → CONTACT → initiative → AP combat* flow is locked by Bible §5.1. This doc owns Phases 0–2 framing and every per-unit spatial action inside Phase 2; it hands the **attack resolution** itself to the resolution engine.

---

## 3. Data schema (fields / types)

All names are TypeScript-flavored; a coder implements directly. Stat fields (MEL/AGL/STR/STA/INT/INS/CON) are the 7 primaries (Bible §3.1).

### 3.1 `GridMap`
```ts
interface GridMap {
  width:  number;            // 20..100  (Tactical_Grid_System Grid_Size)
  height: number;            // 20..100
  encounterScale: 'street'|'cityBlock'|'district'; // → 20|50|100 default sizes
  tiles: Tile[][];           // [y][x]
  maxZ: number;              // 6 outdoors; clamped indoors per ceiling (§7.4)
  ambientVisibility: VisibilityCondition; // Bright|Dim|Dark|PitchBlack|Smoke|Rain|HeavyRain
  weather: FlightWeather;    // Clear|LightWind|StrongWind|Storm|Fog|Rain|Snow  (Flight_Altitude_System)
  terrainCode: number;       // 1..25  (TerrainCodes.csv) — set from sector at handoff (§8)
  cityType: CityType;        // drives spine combat modifier (§8)
  crimeIndex: number;        // 0..100 (spine, §8)
  popRating: number;         // 2..7   (spine, §8)
}
```

### 3.2 `Tile`
```ts
interface Tile {
  x: number; y: number;
  terrain: TerrainType;      // Street|Sidewalk|BuildingInterior|Rubble|VehicleWreck|
                             //   WaterShallow|WaterDeep|Rooftop|ParkOpen|ParkDense (Tactical_Grid_System TERRAIN TYPES)
  moveClass: 'Clear'|'Rough'|'Difficult'|'Impassable'; // → cost 1|2|3|∞ (§6.1)
  cover: CoverType;          // None|Light|Medium|Heavy|Full  (§6.4)
  coverDurability: number;   // hits before cover degrades one tier (destructible, §6.4)
  elevationZ: number;        // static ground/floor Z of this tile (0 = street)
  ceilingZ: number | null;   // indoor altitude cap = floor(ceilingFt/10); null = open sky (§7.4)
  ceilingFt: number | null;  // Building_Flight_Limitations.csv Ceiling_Height_Feet
  buildingType: BuildingType | null; // Building_Flight_Limitations.csv (gates indoor maxZ + breach STR + legal tier)
  blocksLOS: boolean;        // true for Full cover / solid wall / Impassable
  concealment: number;       // 0..3 CS soft-cover (smoke/bushes/dark) — harder to SEE not to HURT
  destructible: 'Light'|'Medium'|'Heavy'|'Indestructible' | null; // §6.4 destruction thresholds
}
```

### 3.3 `CombatUnit` (spatial/turn fields only — full sheet is a sibling)
```ts
interface CombatUnit {
  id: string; team: 'player'|'enemy'|'neutral';
  pos: { x:number; y:number; z:number };  // z is altitude integer Z0..Z6
  stats: { mel:number; agl:number; str:number; sta:number; int:number; ins:number; con:number };
  threatLevel: 'Alpha'|'L1'|'L2'|'L3'|'L4'|'L5'; // initiative bonus (§4)
  ap: number;                 // current; refreshes to AP_PER_TURN=6 each round
  initiative: number;         // computed (§4)
  stance: Stance;             // persistent (§5.2)
  modes: Set<ToggleMode>;     // active maintained modes (§5.1)
  facing?: number;            // 0..7 octant — for flanking/cone (optional, §6.3/§6.4)
  // FLIGHT
  canFly: boolean;
  flightType?: 'Natural'|'Technological'|'Magical'|'Telekinetic'; // upkeep flavor (Flight_Altitude_System Power Types)
  maxReachableZ: number;      // set by power tier; ≤ map.maxZ (TC-1)
  isFlying: boolean;          // z>0 via flight (vs standing on an elevated tile)
  // STATUS hooks owned by sibling but read here for mode/stance restriction:
  statusFlags: Set<'Stunned'|'Grappled'|'Frightened'|'Prone'|'Exhausted'|'Wounded'|'Confused'|'Blinded'>;
  woundedFraction: number;    // 0..1 (health lost) → −CS (§6.5)
  personalityType: number;    // 1..20 → AI target preference (§8.3)
}
```

### 3.4 Action enum (AP-costed; this doc owns costs)
```ts
type CombatAction =
  | { kind:'Move', path: GridPoint[] }              // 1 AP/sq × terrain × altitude (§6)
  | { kind:'Sprint', path: GridPoint[] }            // 2× move, no attack this turn
  | { kind:'AttackMelee' } | { kind:'AttackRanged' } | { kind:'AttackPower', apCost:number }
  | { kind:'Aim' }                                  // 2 AP, +1CS next (max +3CS)
  | { kind:'Reload', apCost:number }                // 2..6 weapon-dependent
  | { kind:'UseItem' } | { kind:'TakeCover' } | { kind:'StandUp' }
  | { kind:'ChangeAltitude', deltaZ:number }        // 2 AP/level (Tactical_Grid_System) — see §7 nuance
  | { kind:'Overwatch' } | { kind:'Ready', trigger:string }
  | { kind:'ToggleMode', mode:ToggleMode } | { kind:'ChangeStance', stance:Stance };
```

---

## 4. Initiative & turn order — exact numbers/formulas

### 4.1 Base initiative formula
> Bible §3.1/§5.1 and `Combat_Resolution_Quick_Reference.csv` row 1 lock the base: **`Initiative = (AGL + INS) / 2 + mods`.**

`Initiative_Turn_Order.csv` decomposes it as **Base = full AGL + half INS**, which is **not** identical to `(AGL+INS)/2`. This is a real contradiction.

> **RULING TC-2 (initiative formula).** Ship the **Bible-canonical** `Initiative = (AGL + INS)/2` as the **base**, because Bible §3.1 explicitly lists it as the derived stat and §13 makes the Bible the tie-breaker. The richer per-source modifier columns in `Initiative_Turn_Order.csv` are kept as **additive `+mods`** on top of that base (they were authored as flat bonuses, not as a competing base). So:
> ```
> Initiative = floor((AGL + INS)/2)
>            + threatBonus + powerBonus + equipmentMod + situationalMod + teamMod
> ```

### 4.2 Modifier table (all values cited to `Initiative_Turn_Order.csv`)
| Modifier | Value | Source row |
|---|---|---|
| Threat Alpha / L1 / L2 / L3 / L4 / L5 | **+0 / +5 / +10 / +15 / +20 / +25** | rows "Threat Level Alpha"…"Threat Level 5" |
| Reflex skill / Quick Draw (ranged) | +10 / +5 | "Reflex Skill", "Quick Draw Skill" |
| Super Speed / Precognition / Time Travel / Enhanced Reflexes | +30 / +25 / +20 / +15 | power-bonus rows (stack with threat) |
| Flight / Psychic / Energy / Invisibility | +10 / +8 / +5 / +5 | power-bonus rows |
| Tech enhancement / Cybernetic implants / Martial arts | +12 / +10 / +8 | tech & martial rows |
| Armor: Light / Medium / Heavy | −0 / −2 / −5 | "Light/Medium/Heavy Armor" |
| Surprise attack / Ambush setup | +15 / +10 | situational rows |
| Caught off-guard / Confused | −10 | situational rows |
| Stunned | −15 | "Stunned Condition" |
| Wounded / Frightened | −5 | conditions |
| Exhausted | −8 | "Exhausted Condition" |
| Team: Leadership / Coordination / Formation / Hive Mind | +3 / +2 / +4 / +5 (to whole team) | team-bonus rows |
| Environmental (darkness/underwater/zero-G/etc.) | −3..−12 | situational rows (apply only if map condition true) |

### 4.3 Ordering & interrupts
- Sort all units **high→low** by `Initiative`. **Ties** broken by higher AGL, then higher INS, then player-team-first (RULING TC-3, no source tiebreak exists; consistent with AGL-driven §3.1).
- **Overwatch** (4 AP, `Combat_Modes_Stances.csv`): unit forgoes its turn; when an enemy **moves within LOS** during another unit's turn, Overwatch fires a ranged attack as an interrupt (X-Com style, Bible §5.1). Overwatch **cannot react to melee/grapple** (`Combat_Modes_Stances.csv` "Overwatch / Cannot react to melee/grapple").
- **Ready** (2 AP): declare a trigger + action; interrupt when trigger occurs, else expires at round end.
- **Multiple Actions / action-splitting** (`Initiative_Turn_Order.csv` "Multiple Actions"): taking >1 major action incurs an initiative penalty per extra action; high stats reduce it. Super-Speed mode (`Combat_Modes_Stances.csv`) explicitly grants extra actions for 2 AP/turn — handled as the sanctioned exception.

---

## 5. Stances & modes — exact numbers (all cited to `Combat_Modes_Stances.csv`)

> **Currency rule (Bible §3.3):** every modifier below is **±CS** applied to the **final column** of the resolution engine. This doc emits them; it does not roll.

### 5.1 Toggle modes (cost AP **each turn to maintain**)
| Mode | Maint AP/turn | Activation | Offense | Defense | Movement | Perception | Effect |
|---|---|---|---|---|---|---|---|
| Alert | 2 | 0 | +0 | **+2CS dodge** | half | **+2CS** | react to ambush; first-turn interrupt possible |
| Overwatch | 4 | 0 | +0 | +0 | cannot move | +1CS | interrupt enemy move with ranged (§4.3) |
| Aim | 2 | 0 | **+1CS/turn, max +3CS** | +0 | cannot move | +0 | stacking accuracy; lost if interrupted |
| Suppressive Fire | 3 | 3 (burst) | +0 | +0 | cannot move | +0 | forces cone targets to stay in cover or take fire (−1CS to them) |
| Guard Ally | 2 | 0 | +0 | +0 | stay ≤2 sq of ally | +0 | redirect adjacent ally's incoming hits to self |
| Ready | 2 | 0 | +0 | +0 | cannot move | +0 | declare trigger+action; interrupt on trigger |

**Character-specific modes** (gated by power/training):
| Mode | Requirement | AP | Effect |
|---|---|---|---|
| Berserk | certain powers/triggers | 0 (triggered) | **+3CS melee dmg, +2CS STR**; must attack nearest; cannot tell friend from foe |
| Focus | CON 40+ or Psychic | 3 | +2CS accuracy; immune fear/charm; **no defensive bonuses**; 3 turns |
| Stealth | Stealth skill or Invisibility | 2/turn | +3CS stealth; half move; attack breaks it |
| Flight-Combat | Flight power | 0 | **+2CS vs ground, −1CS vs other flyers**; ground melee cannot reach (see §7.5) |
| Super-Speed | Super Speed power | 2/turn | multiple actions; +4CS dodge; may cause sonic-boom dmg |

### 5.2 Persistent stances (set once until changed; change = **1 AP**, free to return to Neutral)
| Stance | Offense | Defense | Move | Grapple mod | Restriction |
|---|---|---|---|---|---|
| Neutral | +0 | +0 | normal | +0 | — |
| Defensive | −2CS atk | **+2CS def** | normal | +1CS counter | cannot charge |
| Aggressive | **+2CS atk** | −2CS def | normal | −1CS vs grapple | cannot Overwatch |
| Grappling | −1CS ranged | +1CS melee def | normal | **+2CS counter** | hands free |
| Low | −1CS ranged | **+2CS vs ranged** | half | +1CS vs takedown | cannot sprint |
| Mobile | +0 | −1CS def | **+2 move** | −1CS vs grapple | cannot Overwatch/Aim |
| Power | +1CS melee dmg | −1CS def | half | +1CS grapple init | cannot dodge (block/parry only) |
| Sniper | **+2CS ranged at Long+** | −2CS melee def | cannot move | −3CS vs grapple | must be stationary; lost if move |

### 5.3 Stacking & combination rules (`Combat_Modes_Stances.csv` "STANCE COMBINATIONS")
- **One stance at a time.** Modes **can** combine with a stance (e.g. Alert + Defensive).
- **Incompatible pairs:** Overwatch/Aim/Sniper require stationary → conflict with Mobile stance; Aggressive cannot Overwatch. Enforce at toggle time (reject the action).
- **Status overrides** (`Combat_Modes_Stances.csv` "STATUS EFFECTS AFFECTING MODES"): Stunned cancels **all** modes; Grappled cancels most (Grappling actions only; Berserk survives); Frightened blocks Aggressive/Overwatch; Prone blocks Sniper/Mobile; **Exhausted doubles all mode AP costs**.
- **Martial-art synergies** (same file "MODE INTERACTIONS WITH MARTIAL ARTS") are bonus CS packages applied by the wrestling/martial sibling, not here — but this doc must surface the *recommended stance* in the UI hint (§9 wrestling hand-off).

> **RULING TC-4 (AP budget enforcement).** `Combat_Modes_Stances.csv` "Aim+Aim+Attack = 7 AP exceeds budget." The engine **must validate** total spent AP ≤ `unit.ap` *including* maintained-mode upkeep, and reject the action that overflows, surfacing "Not enough AP" (no partial actions). This is the source-proven failure mode.

---

## 6. Grid, movement, range, LOS, cover — exact numbers

### 6.1 Movement & AP (all `Tactical_Grid_System.csv` unless noted)
| Item | Value | Source |
|---|---|---|
| Total AP/turn | **6** | `Total_AP` |
| Base move budget | **floor(AGL/5)** squares, **min 2** | `Base_Movement` |
| Move 1 square | **1 AP** | `Move_1_Square` |
| Diagonal | 1.5× (2 diag = 3 sq) | `Diagonal_Movement` |
| Sprint | 2× move, **no attack** | `Sprint_Action` |
| Crawl (prone) | half move; stealth bonus | `Crawl_Movement` |
| Climb (no flight) | 3 vertical sq = 1 turn; free hands | `Climb_Movement` |
| Flight move | **floor(AGL/3)** + power bonus (Low +5 / High +15) | `Flight_Movement` (see §7) |
| Charge | full move + melee; min 3 sq; **+1CS dmg, −1CS def** until next turn | `Charge` (SPECIAL MOVEMENT) |
| Tactical retreat | half move + disengage; no opp attacks; no attack this turn | `Tactical_Retreat` |
| Jump horizontal / vertical | STR/10 sq / STR/20 sq up | `Jump_Horizontal/Vertical` |

**Terrain move cost** (`Tactical_Grid_System.csv` MOVEMENT COSTS BY TERRAIN):
| Class | Cost/sq | Examples |
|---|---|---|
| Clear | 1 | roads, sidewalks |
| Rough | 2 | rubble, debris |
| Difficult | 3 | deep water, mud, dense vegetation |
| Impassable | ∞ | solid walls (destroy/phase to pass) |
| Stairs | 2/floor (vertical) | interior Z transition |
| Ladder | 3/Z-level (vertical) | external climb |

### 6.2 AP cost table (combat actions)
`Attack melee/ranged = 3 AP` · `Power = 1–10 AP` (per power) · `Aim = 2 AP` · `Reload = 2–6 AP` · `Use item = 2 AP` · `Take cover = 1 AP` · `Stand up = 2 AP` · `Change altitude = 2 AP/level` · `Overwatch = 4 AP`. (All `Tactical_Grid_System.csv` ACTION POINT SYSTEM.)

### 6.3 Range bands & weapon caps (`Tactical_Grid_System.csv` RANGE SYSTEM / WEAPON RANGE LIMITS)
**Range distance formula (chebyshev+half):** `Range_sq = max(|dx|,|dy|) + min(|dx|,|dy|)/2` (diagonal = 1.5). With altitude: `Range = sqrt(horizontal² + (verticalZ×2)²)` (`Altitude_Combat`; vertical Z weighted ×2 because each Z ≈ 2 m like a square — keep consistent with the 2 m/sq unit).

| Band | Squares | To-hit CS | Source |
|---|---|---|---|
| Point-blank | 0–1 | **+2CS** (cannot use long-range weapons) | `Point_Blank` |
| Short | 2–5 | +0 | `Short_Range` |
| Medium | 6–15 | +0 | `Medium_Range` |
| Long | 16–30 | **−1CS** | `Long_Range` |
| Extreme | 31–50 | **−2CS** | `Extreme_Range` |
| Maximum | 51+ | **−3CS** (most weapons can't reach) | `Maximum_Range` |

**Weapon max range (hard cap)** & optimal: Melee 0–1 (super-throw = STR/10) · Pistol 25 (opt 5–15) · Rifle 60 (opt 15–40) · Sniper 100 (opt 40–80) · Shotgun 15 (opt 3–8, cone) · SMG 20 (opt 5–15) · Heavy 50 (min 3 for explosives) · Thrown STR/5 · Energy/Psychic power-specific (e.g. Fire Gen 8 Low/20 High; Psychic Blast 15 Low/30 High). (`WEAPON RANGE LIMITS`.) The per-weapon exact numbers are owned by `Weapons_Complete` (sibling); this doc owns the **band CS** and the **range formula**.

### 6.4 Cover (`Tactical_Grid_System.csv` COVER SYSTEM)
| Cover | Concealment | Defense CS to target | Notes |
|---|---|---|---|
| None | 0% | +0 | exposed |
| Light | 25% | **+1CS** | low wall, car, furniture |
| Medium | 50% | **+2CS** | half-wall, window frame |
| Heavy | 75% | **+3CS** | doorway, pillbox |
| Full | 100% | **untargetable** | must destroy cover first |
| Elevation cover | — | **+1CS attacker; target loses cover** | attacker above target |

- **Partial LOS** (target behind cover) gives **−1CS..−3CS** to the attacker scaling with cover tier (`LINE OF SIGHT` `Partial_LOS`). Implement as: attacker −CS = target's cover CS (so Light cover = attacker −1 / target +1, applied once on the column — do not double-count; see RULING TC-5).
- **Concealment ≠ cover:** soft cover (smoke/bushes/dark) makes a target **harder to see, not harder to hurt once hit** (`Concealment` row). Model as a **LOS/detection** penalty, not a defense CS.
- **Corner peeking:** attacker **+1CS defense**, target gets cover (`Corner_Peeking`).
- **Destructible cover** degrades **one tier when penetrated** (Bible §5.3; thresholds from `Tactical_Grid_System.csv` ENVIRONMENTAL DESTRUCTION: Light = STR20+/20 dmg = 1 hit; Medium = STR40+/50 dmg = 2–3 hits; Heavy = STR60+/100 dmg = many/explosives; `coverDurability` field counts hits).

> **RULING TC-5 (no double-count of cover).** Cover appears in two source sections (COVER SYSTEM "+NCS to target's defense" and LINE OF SIGHT "Partial_LOS −1..−3CS to attacker"). These are the **same physical effect described from both ends.** Apply it **once**: a Light/Medium/Heavy cover tile contributes **+1/+2/+3 CS to the defender's column** (equivalently −1/−2/−3 to the attacker). Never stack both.

### 6.5 Other standing CS modifiers (for the column the resolution engine reads)
From `Combat_Resolution_Quick_Reference.csv` "COLUMN SHIFT QUICK REFERENCE" + `Tactical_Grid_System.csv`:
- Prone target **+1CS** to attacker · Flanking (side/behind) **+1CS** · Multiple targets **−1CS per extra** · Wounded **−1CS per 25% health lost** (`woundedFraction`) · Stunned **−2CS** · Blinded **−4CS**.
- **Elevation:** Higher ground **+1CS ranged**; Lower ground **−1CS ranged**; Flight advantage **+2CS vs ground** (`ELEVATION EFFECTS`; reconciled with §7).
- **Visibility:** Dim −1CS, Dark −3CS, Smoke/Fog −2CS, Rain −1CS, Heavy-rain/Storm −2CS (ranged) (`VISIBILITY CONDITIONS`).

### 6.6 Line of sight
- LOS = **center-to-center raycast**; if it crosses a `blocksLOS` tile (Full cover / solid wall / Impassable) → **No LOS** → no direct ranged attack, **except area effects bypass LOS** (`LINE OF SIGHT` `No_LOS`; Bible §5.3). Reuse the existing raycast already in `CombatScene.ts` (it ships LOS today — see §10).
- Concealment tiles add to a **detection** check (Stealth vs Perception, `STEALTH ON GRID`), not to the hit column.

### 6.7 Dodge → attacker −CS (the defender's evasion, from `🦆DODGE CHART🦆.csv`)
The defender's evasion is **the single largest −CS source** an attacker faces and is itself a positional/turn input (it depends on the defender's stance, prone, flight, etc., which this doc owns). The chart gives two columns; **which one applies depends on attack type** (`Combat_Resolution_Quick_Reference.csv` step 11: melee dodge uses `AGL+INS`, ranged dodge uses `AGL`).

**Ranged dodge — by AGL alone** (left column of `🦆DODGE CHART🦆.csv`):
| AGL | Attacker −CS | (Threat designation) |
|---|---|---|
| 1–9 | None | Little Human |
| 10–19 | −2CS | Above-Avg Human |
| 20–29 | −3CS | Exceptional Human |
| 30–39 | −4CS | Max Human (Alpha) |
| 40–49 | −5CS | Low Superhuman (L1) |
| 50–59 | −6CS | Superhuman (L2) |
| 60–69 | −7CS | (L3) |
| 70–79 | −8CS | (L4) |
| 80–99 | −9CS | High Superhuman (L5) |
| 100–149 | −10CS | Low Cosmic |
| 150–250 | −11CS | Cosmic |
| 250–500 | −12CS | High Cosmic |
| 500–999 | −13CS | Supreme Cosmic |
| 1000–1499 / 2500–4999 | −14CS | Deity / Supreme Being |

**Melee dodge — by AGL+INS** (right column of the same file):
| AGL+INS | Attacker −CS |
|---|---|
| 1–19 | None | 20–39 | −1CS | 40–59 | −2CS | 60–79 | −3CS | 80–99 | −4CS |
| 100–119 | −5CS | 120–139 | −6CS | 140–169 | −7CS | 170–199 | −8CS | 200–299 | −9CS |
| 300–499 | −10CS | 500–999 | −11CS | 1000–1999 | −12CS | 2000–4999 | −13CS | 5000–9999 | −14CS |

> **RULING TC-11 (dodge selection & stacking).** Use the **AGL-only** column for ranged/energy/thrown to-hit and the **AGL+INS** column for melee/unarmed (matches `Combat_Resolution_Quick_Reference.csv` step 11). Dodge −CS **stacks additively** with stance dodge bonuses owned here (e.g. Alert mode +2CS dodge, Super-Speed +4CS dodge, Defensive +2CS def) by **adding their CS to the defender's effective stat before reading the chart row is NOT done** — instead, mode/stance dodge bonuses are applied as **extra −CS on the attacker's column directly** (they are already authored as CS, not as stat). Caps: a target in **Power stance "cannot dodge"** (block/parry only) → use cover/armor defense, not the dodge chart; a **Stunned/Prone** target's dodge is overridden by the +CS-to-attacker rows in §6.5 (a prone/stunned target is easier to hit regardless of AGL). This is the one place an attacker's column can swing by double digits — it is *intended*: it is why a max-human (Alpha) shooter often cannot touch an L5 flyer without a power, a flank, or a called shot.

---

## 7. Flight & altitude (the signature spatial system) — exact numbers

**Model:** altitude is the integer `unit.pos.z ∈ {0..6}`, rendered as a wing/shadow indicator, never 3D. Levels from `Flight_Altitude_System.csv`:

| Z | Name | Height | Move cost | AP/sq | Height CS adv | Ranged-from-this-Z falloff | Notes |
|---|---|---|---|---|---|---|---|
| 0 | Ground | 0 ft | standard | 1 | +0 | standard | melee possible; full interaction |
| 1 | Low | 10–30 ft | +1 | 1 | **+1CS** | standard | wind −1CS accuracy; some cover lost |
| 2 | Med-Low | 31–60 ft | +1 | 1 | **+1CS** | ranged only | no ground interaction |
| 3 | Medium | 61–150 ft | +2 | 2 | **+2CS** | **−1CS** | hard to target from ground |
| 4 | High | 151–500 ft | +2 | 2 | **+2CS** | **−2CS** | weather −1CS all actions |
| 5 | Very High | 501–1500 ft | +3 | 3 | **+3CS** | **−3CS** | nearly untouchable from ground |
| 6 | Extreme | 1500+ ft | +3 | 3 | **+3CS** | **−4CS** | weather −3CS; limited combat effectiveness |

**Altitude transition actions** (`Flight_Altitude_System.csv` "Action" rows):
| Action | ΔZ | AP | Effect |
|---|---|---|---|
| Takeoff | 0→1 | 2 | last turn of ground interaction; **vulnerable that turn** |
| Landing | any→0 | 2 | next turn ground interaction; **vulnerable that turn**; crash risk if damaged |
| Climb | +1 | 1 | half move; gain altitude advantage |
| Dive | −1 | 1 | +50% move; **+1CS attack accuracy** |
| Hover | maintain | 1 | **+1CS accuracy** but **sitting duck / easy target** |
| Emergency Descent | −2 | 1 | falling damage if failed |
| Strafing Run | maintain | 3 | attack during movement; lower accuracy |
| Aerial Intercept | match target | 2 | engage another flyer (must match Z) |
| Aerial Grapple | same Z | 2 | grappling rules; **both may fall if it fails** |
| Dive Attack | higher→lower | 3 | **+2CS dmg & accuracy**; crash risk if target dodges |

> **RULING TC-6 (altitude AP reconciliation).** `Tactical_Grid_System.csv` says "Change altitude = 2 AP/level"; `Flight_Altitude_System.csv` gives **per-action** AP (Climb 1, Takeoff 2, Dive 1…) **and** per-Z movement-point costs (Z3–4 = 2/sq, Z5–6 = 3/sq). The **per-action AP from `Flight_Altitude_System` wins** (it is the more specific, signature-system source and is what the Bible §5.4 cites), and the "2 AP/level" generic line is the **fallback** for any altitude change not otherwise named (e.g. teleporting straight to Z3 = 3 levels × 2 AP = 6 AP). Movement-point costs are separate from the AP-to-change cost and apply to **horizontal** travel at that altitude.

### 7.1 Flight balance brakes (Bible §5.4 / §13 #4 — MANDATORY, sims proved flight broken without them)
1. **Altitude stamina drain:** **Z4+ costs 1 STA/turn; Z6 costs 2 STA/turn.** Drain at end-of-round; on STA reaching 0 the flyer must Emergency-Descend.
2. **Area-weapon falloff at altitude:** grenades/explosives/Area-BAMPI **lose effect at Z3+** (the fix for the 94.7%-win "altitude bombing" exploit). Beyond Z3, Area attacks deal 0 (or are disallowed) — this doc emits the flag `areaSuppressedByAltitude = (attacker.z >= 3)`; the BAMPI sibling applies it.
3. **Takeoff/Landing −2CS defense window:** during the Takeoff and Landing turns the flyer is at **−2CS defense** (fix for flyer-vs-ground dominance).

> These three are **not optional** — they are the reason indoor/urban/weather variety exists. With them, sims land flight at ~30–58% win (working as intended); without, ~94.7%.

### 7.2 Weather & airspace CS (apply to flyer's actions; `Flight_Altitude_System.csv`)
- Light wind −1CS above Z2 · Strong wind −2CS above Z1 (+1 move cost) · Storm −3CS all actions (+2 move, +1 AP) · Fog −2CS sight-based (Z0–3) · Rain −1CS (+1 move) · Snow −2CS (+1 move).
- Military airspace (Z4–6): +3 move cost, +2 AP, **radar detection** → triggers strategic military-response consequence (§8/§9 hand-off to faction/legal).

### 7.3 Flight-type flavor (`Flight_Altitude_System.csv` Power Types) — UI/audio + edge cases
Natural (stamina drain, unlimited time) · Technological (+1 move cost, equipment-failure risk, equipment visible) · Magical (+1 AP cost, dispel-vulnerable, aura visible) · Telekinetic (+1 AP cost, concentration-required → broken by Stun/Confuse). These set the **takeoff/loop/land SFX** (§9) and the **counter** (EMP grounds Technological; dispel grounds Magical; stun grounds Telekinetic).

### 7.4 Indoor altitude caps (`Building_Flight_Limitations.csv`) — the leash
- **Max indoor Z = floor(ceilingFt / 10)** (`Ceiling_Height_Restriction`). Subway/Sewer/Underground = **no flight** (Z0 only). Residential = Z0; Office = Z1; Warehouse Z1–2; Mall Z2–3; Factory Z2–4; Stadium/Hangar Z5–6.
- **Indoor maneuver penalties** (per building): Apartment −3CS, Office −2CS, Warehouse −1CS, Factory −1CS (collision with furniture/machinery).
- **Breaking through a ceiling** to gain altitude needs the building's **STR threshold** (Residential 30+, Office 35–60, Stadium 70+, Prison 85+…) and applies **structural damage** + a **legal-consequence tier** (family lawsuit → federal charges → court martial). Structural damage **>50% = collapse risk, >75% = imminent collapse** (`Structural_Damage_Calculation`). Emergency roof exit = **double AP** + structural damage (`Emergency_Exit_Flying`).
- **Flying through glass window:** take **1d6 cutting damage**, creates entry/exit; STR20+ = guaranteed safe passage (`Flight_Through_Windows`). Through a wall: take **damage = wall_strength − character_strength** (`Flight_Through_Walls`).

### 7.5 "Ground melee cannot reach" rule
A flyer at **Z≥1** cannot be reached by a non-flying melee attacker (Flight-Combat mode + `Flight_Altitude_System` "ground melee cannot reach"). Ground units must use ranged/area (eating the Z falloff), bring a flyer/jumper, or wait for Hover/Landing. **Jump-vertical** (STR/20 sq up, §6.1) lets a strong ground unit *briefly* contest Z1 — implement as a 1-turn reach window, not sustained flight.

---

## 8. How it consumes the SPINE (country / city / personality → the grid)

Per Bible §2 and §13 #9, **combined/spine effects must be CONSUMED, not just computed.** Tactical combat consumes them at three plug points. All values cite source tables.

### 8.1 City type → flat combat modifier (`City_Type_Effects.csv` `Combat_Modifier` + interaction blocks)
When a combat is generated, the **city's type(s)** set a persistent map modifier:
| City type | Combat modifier (source: `Combat_Modifier` column) | Engine effect |
|---|---|---|
| Temple / Resort | civilians present → **−1CS / −2CS collateral** | every miss/area near a civilian tile applies a fame/legal penalty (hand-off §9) |
| Military | "military response if detected" | start a **response timer**; on detection, reinforcements spawn (AI Director, doc 104) |
| Political / Government | "high legal consequences if caught" | multiplies the legal-tier of any collateral (hand-off to legal/fame) |
| Industrial / Mining | environmental hazards / hazardous terrain (cave-ins, explosions) | seed `VehicleWreck`/explosive/`Difficult` tiles; chain-explosion risk |
| Company | security systems active | Overwatch-style turret/alarm actors |
| Village | "no backup response available" | **no reinforcement timer** for either side |

**Crime index** (`City_Type_Effects.csv` "CITY TYPE + CRIME INDEX"): High (60–80) "**combat more likely**", Very-High (80–100) "**constant combat risk**" → raises the **encounter-spawn rate** and the chance any sector visit drops into combat (consumed by encounter-gen, doc 02). Within combat, crime tier also tilts which faction/threat templates populate the enemy roster.

**Population rating** (`City_Type_Effects.csv` "CITY TYPE + POPULATION TYPE"): drives **stealth ↔ resource** trade and **civilian density** on the map (Mega-City Pop7 = −3CS stealth, dense civilian tiles → more collateral risk; Village Pop2 = +2CS stealth, near-empty map). Sets `map.popRating` → number of civilian/neutral tokens placed.

### 8.2 Terrain & culture → grid generation (`TerrainCodes.csv`, `Culture_Region_Effects.csv`)
- The **sector's terrain code (1–25)** seeds the **tile palette & moveClass** for the generated map: e.g. code 13 Rain-Forest/Jungle → many `ParkDense`/`Difficult` tiles + concealment; code 11 Swamp → `WaterShallow`/`Difficult`; code 14 Mountains → elevation tiles + `Impassable`; code 5 Paved Roads → mostly `Clear` `Street`. (`TerrainCodes.csv` is the enum; the per-code tile mix is a generator table — see Open Question Q4 for the exact mix, which is **OWNER-FORK** content.)
- **Culture region (1–14, `Culture_Region_Effects.csv`)** sets **LSW power affinity of locally-spawned NPCs** (e.g. region 1 North Africa → Fire/Sand/Sun common; region 6 East Asia → Martial/Tech/Spirit; region 7 Caribbean → Voodoo/Water). This biases the **enemy roster's powers**, which changes the tactical problem (a Fire-affinity region throws burning-status fights; a Martial region throws grapple-heavy fights). The affinity is read by enemy-gen, then those units arrive on this grid with their powers.

### 8.3 Personality → AI targeting on the grid (`PERSONALITY TARGET SELECTION.csv`, Bible §5.10)
Each unit's `personalityType (1..20)` maps to a **target-preference code** the grid AI uses to pick whom to path toward / shoot:
```
preference[20] = [1,3,4,4,1,3,4,1,2,2,1,4,2,3,3,3,2,5,5,2]   // exact row from the CSV
// 1 = enemy with MOST health · 2 = LEAST health · 3 = MAJOR threat (most damage dealt)
// 4 = MINOR threat (least damage dealt) · 5 = RANDOM
```
The grid AI, on each enemy turn, evaluates valid targets (LOS + range + reachable, computed by **this** doc), filters by the personality preference, then chooses the action. This makes a *bully* (pref 2, least-health) dive the weakest hero while a *pragmatist* (pref 3, major-threat) focuses your heaviest hitter — character-consistent behavior driven by spine data, on the flat grid. (Damage-dealt is tracked per unit during the fight to resolve prefs 3/4.)

> **RULING TC-7 (spine plug contract).** This doc **reads** `cityType, crimeIndex, popRating, terrainCode, cultureCode, personalityType` from the sector/units at combat-start and turns them into: (a) map modifiers/timers, (b) the tile palette + civilian count, (c) enemy power affinity, (d) AI target preference. It **writes back** only collateral/detection events (§9). It does **not** recompute spine values — those come pre-resolved from the world layer (`allCountries`/`allCities`, the canonical datasets per §13 #10).

---

## 9. Integration points (systems this layer reads / writes)

| Direction | System (doc / table) | Contract |
|---|---|---|
| **READS** | Resolution engine (Bible §3.3, `Universal_Table_FIXED.csv`) | This doc supplies the **net CS** (stance+mode+range+cover+altitude+elevation+visibility+wounded+flanking+prone+multi-target) and **valid target/LOS/reach**; the engine rolls d100 and returns Failed/Minor/Success/Major. |
| **READS** | Character sheet / stats (Bible §4, `Primary_Stats_Spec`) | MEL/AGL/STR/STA/INT/INS/CON, threatLevel, powers, stance/mode legality. |
| **READS** | Spine: `City_Type_Effects`, `Culture_Region_Effects`, `TerrainCodes`, World Bible `Country`/`Cities`, `allCountries`/`allCities` | §8 plug contract. |
| **READS** | Personality AI (`PERSONALITY TARGET SELECTION`) | §8.3 target preference array. |
| **WRITES → (hand-off)** | **Damage/armor** (Bible §5.5, `Armor_Complete`) | Passes hit outcome + CS-derived multiplier; damage math is NOT here. Existing `armorIntegration.ts` already applies DR (§10). |
| **WRITES → (hand-off)** | **Crit → Injury** (Bible §5.6, one pipeline §13 #2) | A **Major** or called-shot triggers crit-table → injury-d100 (modifiers Major −0 / called-shot −30 / overkill −20). This doc only flags *Major occurred* + *body-part if called shot*. |
| **WRITES → (hand-off)** | **Knockback** (Bible §5.5, `Knockback_Mechanics`) | On Success(STR40+)/Major, emits attacker STR rank + direction; knockback distance & wall-impact resolved by sibling. Source: `Combat_Resolution_Quick_Reference.csv` "Check Knockback". |
| **WRITES → (hand-off)** | **Status effects** (Bible §5.7) | Emits status triggers (e.g. head-hit → Stunned) per crit table; durations owned by sibling. Status **reads back** into §5.3 mode/stance restriction + §4.2 initiative penalties. |
| **WRITES → (hand-off)** | **Wrestling/grappling** (Bible §5.9) | When a melee attacker declares Grapple, control passes to the wrestling state machine; this doc supplies reach (range 0–1, same Z), Grappling-stance CS, and Aerial-Grapple "both may fall" Z context. |
| **WRITES → (hand-off)** | **BAMPI / Power Activation** (Bible §5.12) | `AttackPower` actions branch on BAMPI; this doc supplies range/LOS/altitude flags incl. `areaSuppressedByAltitude` (§7.1) and per-Z falloff. |
| **WRITES → (strategic)** | **Fame/Legal/Faction** (docs 13/17) + **AI Director** (doc 104) | Collateral on civilian tiles, detection in Military/Government cities, structural collapse, radar detection at Z4–6 → strategic consequences (legal tier from `Building_Flight_Limitations`/`City_Type_Effects`). |
| **WRITES → (strategic)** | **Combat results handler** (`combatResultsHandler.ts`, existing) | End-of-combat outcome (win/loss/retreat), casualties, captures → world layer + news. |
| **READS** | **Time / save** (Bible §11) | Combat runs **inside a paused world clock**; the **time-traveler rewind** is the only undo (diegetic save) — there is **no mid-combat quicksave**; a wiped squad is rewound only via the nation's time-traveler at its sanity/destination cost. This layer must be **deterministic given a seed** so a rewind reproduces/branches cleanly (RULING TC-8). |

> **RULING TC-8 (determinism for diegetic rewind).** Because the only save is the time-traveler rewind (Bible §11, §13), the combat RNG **must be seeded** (seed stored with the encounter). All rolls (initiative ties, d100, dive-crash, 1d6 window damage) draw from that seed so a rewind re-enters the same fight reproducibly and the player's *different choices* are what diverge — not RNG noise. This also future-proofs the **multiplayer-dimension stub** (Bible: MP lives in the traveler's other dimension; a seeded, server-authoritative combat slots in later — do **not** build MP now, just keep combat seed-deterministic and side-effect-free except through the documented hand-offs).

---

## 10. What already exists in code (build-on, don't rebuild)

`MVP/src/game/scenes/CombatScene.ts` (~5000 lines) and CLAUDE.md confirm these are **WORKING** today and must be *extended*, not replaced:
- Turn-based AP combat, A* movement, **LOS raycast**, fog of war, hit/miss/graze/crit bands, weapon range brackets, knockback (basic), grenades/arc, several powers, 381 SFX via `SoundManager`, AI vs AI, free-movement-before-contact, character stats (MEL/INT/INS/CON) imported to units.
- `getCoverBonus(unit)` (line ~3686), `getTileCover(x,y)` + `COVER_BONUSES[...].drBonus` (line ~6771), `armorIntegration.ts` (DR applied), `weaponIntegration.ts` (70+ weapons bridged).
- **The four named gaps vs this spec** (Bible §15): (1) **the Z-axis is 2D today** — add `pos.z`, the 7-level model (§7), indicator render, indoor caps, balance brakes; (2) **stances/modes** as data (`Combat_Modes_Stances`) not yet a first-class toggle layer — add §5; (3) **spine consumption** (§8) — wire city/terrain/culture/personality into map-gen + AI; (4) **dataset unification** — read `allCountries`/`allCities`, not legacy `cities.ts`, per §13 #10.

---

## 11. UI / UX hooks

**Combat overlay (Phaser, symbolic):**
- **Altitude indicator:** each flying token shows a small **Z-badge (Z1..Z6)** + a **wing glyph**; its **ground shadow** detaches and offsets to read "airborne." Tapping a flyer shows a vertical **altitude ladder** (Z0–Z6) with reachable levels lit and current AP cost to climb/dive. (No 3D — the badge + shadow *is* the third axis.)
- **AP pips:** 6 pips; hovering an action greys the pips it will cost **including maintained-mode upkeep**; an over-budget action greys red with "Not enough AP" (RULING TC-4).
- **Range/LOS preview:** on selecting a ranged attack, paint reachable tiles by **range band color** (point-blank/short = green, long = yellow, extreme = orange, max/no-LOS = red), and draw the **LOS ray**; cover tiles show a **shield pip (+1/+2/+3)**.
- **Stance/mode tray:** a persistent toolbar of the 8 stances + 6 modes (+ character-specific) with their CS deltas in tooltips; illegal combos (Overwatch+Mobile) are disabled with the reason.
- **Initiative track:** a turn-order ribbon (X-Com style) showing the high→low order; interrupt icons (Overwatch/Ready) flag who can react.
- **Collateral warning:** civilian tiles (from `popRating`/city type) glow; an attack whose miss-cone or area overlaps one shows a **collateral/legal-tier warning** before confirm (consumes §8.1, Military/Government cities escalate).
- **Flight balance feedback:** Z4+ shows a **stamina drip** icon; Z3+ greys out grenade/area buttons ("Area weapons ineffective at altitude"); takeoff/landing turn flashes a **−2CS DEFENSE / VULNERABLE** banner.

**World-map / phone / laptop (out-of-combat hooks this layer feeds):**
- **Phone** pauses the world clock; entering combat hard-pauses it (Bible §11) — the phone shows the **"CONTACT"** push when an encounter triggers from a high-crime sector (§8.1).
- **World-map sector tile** surfaces the *expected* combat texture *before* you deploy: terrain icon (movement difficulty), city-type icon (civilian/legal risk), crime heat (combat likelihood) — i.e. the spine inputs of §8 are previewed so the player chooses fights informed.
- **Laptop / after-action:** the combat-results screen reports collateral, detection, structural damage and the resulting **fame/legal/faction** deltas (the §9 strategic writes), and offers the **time-traveler rewind** as the only "reload" (with its sanity/destination cost shown).
- **Audio hooks** (`SoundManager`, existing): `flight_takeoff_*`, `flight_loop_01`, `power_flight_hover/land_*` already exist — wire to Takeoff/Hover/Land actions; flight-type (§7.3) picks the variant.

**Accessibility/input** (defer detail to doc 105): all CS modifiers must be inspectable as a **text breakdown** ("to-hit: Remarkable −1 range −2 cover +1 height = Good") so the symbolic math is legible without color.

---

## 12. Edge cases & failure modes

1. **AP overflow** (Aim+Aim+Attack = 7 > 6): reject the overflowing action (RULING TC-4); never execute partial.
2. **Exhausted doubles mode AP** (`Combat_Modes_Stances` status block): re-validate every maintained mode at round start; auto-drop modes the unit can no longer afford (surface "Mode dropped: Exhausted").
3. **Stunned cancels all modes / Grappled cancels most:** on status apply, clear the relevant modes (§5.3) so a stunned unit doesn't keep "Aim +3CS."
4. **Flyer runs out of STA at Z4+** (§7.1): force Emergency Descent (−2 Z, falling-damage check) — not a soft "you may descend."
5. **Indoor ceiling lower than current Z** (e.g. flyer enters a building): clamp to `floor(ceilingFt/10)`; if already higher → collision damage (`Ceiling_Height_Restriction`) or forced descent.
6. **No-LOS ranged attempt:** block direct fire; offer area-effect (which bypasses LOS) if the unit has an Area-BAMPI weapon — but suppress it at Z3+ (§7.1).
7. **Full-cover target:** untargetable directly; UI must route the player to "destroy cover" (destructible thresholds §6.4) or reposition for a flank.
8. **Diagonal/altitude range rounding:** always use the cited formulas (`max+min/2`; `sqrt(h²+(z×2)²)`); never Euclidean on the horizontal alone (would mis-bracket range).
9. **Cover double-count:** guarded by RULING TC-5 — apply the cover CS exactly once.
10. **Ground melee vs flyer at Z1:** must be *impossible* except via Jump-vertical 1-turn window (§7.5); the AI must not path a non-flyer into a melee it can never land.
11. **Initiative ties:** deterministic tiebreak (TC-3) so a seeded rewind reproduces order.
12. **Takeoff/landing interrupted:** the −2CS-defense window persists for the whole transition turn even if the unit is hit mid-transition; a knockback during Takeoff aborts it back to Z0 (RULING TC-9, consistent with "last turn of ground interaction").
13. **Personality pref 3/4 with zero damage dealt yet** (round 1): if no damage tracked, fall back to pref-1 (most health) for "major" / pref-2 (least) for "minor" until data exists (RULING TC-10; avoids null-target AI freeze).
14. **Civilian on a destructible tile that collapses:** structural collapse >75% (§7.4) applies the city's legal tier *per civilian* — chain to the strategic legal system, do not silently ignore.
15. **Map smaller than weapon max range** (20×20 street fight, sniper range 100): cap effective range at map bounds; the band CS still applies by true distance.

---

## 13. RULING: notes (collected)

- **TC-1** Altitude unit = the 7-level Z0–Z6 scale (`Flight_Altitude_System`); floors & power-tier max-Z map onto it. (Bible §5.4/§13 #5.)
- **TC-2** Initiative base = `floor((AGL+INS)/2)` (Bible-canonical) + the `Initiative_Turn_Order.csv` modifier columns as additive bonuses.
- **TC-3** Initiative tiebreak: AGL → INS → player-team-first (deterministic).
- **TC-4** Hard AP-budget validation incl. mode upkeep; reject overflow (source-proven).
- **TC-5** Cover CS counted once (COVER & LINE-OF-SIGHT sections are the same effect).
- **TC-6** Per-action altitude AP (`Flight_Altitude_System`) wins over the generic "2 AP/level"; the generic line is the fallback for unnamed altitude jumps. Movement-point cost ≠ AP-to-change cost.
- **TC-7** Spine plug contract: combat reads pre-resolved spine values, turns them into map/AI/affinity; writes back only collateral/detection.
- **TC-8** Seeded, deterministic combat RNG (required by the diegetic time-traveler rewind; also future-proofs the MP-dimension stub).
- **TC-9** Knockback during Takeoff aborts the transition back to Z0.
- **TC-10** Personality prefs 3/4 fall back to 1/2 before any damage is tracked (round-1 safety).

---

## 14. OWNER-FORK: notes (product choices, not derivable from data)

- **OF-1 — Per-terrain-code tile mix.** `TerrainCodes.csv` gives the 25 enum names but **no tile-palette percentages**. The exact mix (e.g. "Jungle = 40% ParkDense / 25% Difficult / …") is a level-design choice. *Owner must author a `terrainCode → tilePalette` table* (or accept a placeholder uniform-ish generator). Recommend authoring it as data so it's moddable (doc 106 pipeline).
- **OF-2 — Map size per encounter type.** Source gives the 20/50/100 anchors but not which *encounter templates* use which size. Owner sets the mapping (ambush = street 20×20? boss = district 100×100?).
- **OF-3 — Reinforcement / military-response timer length.** `City_Type_Effects` says Military cities respond "if detected" but gives **no turn count**. Owner sets the timer (e.g. 4 turns to first wave) and whether the AI Director (doc 104) scales it to difficulty.
- **OF-4 — Collateral → fame/legal exchange rate.** The legal *tiers* exist (`Building_Flight_Limitations` family-lawsuit → court-martial; `City_Type_Effects` "high legal consequences"), but the **numeric fame/heat penalty per civilian / per structure** is a balance dial owned by the fame/legal docs (13/17), not derivable here.
- **OF-5 — Whether civilians are full grid actors or static hazard tiles.** Source implies presence (collateral CS) but not agency. Owner chooses: passive tiles (cheap) vs panicking pathing NPCs (richer, costlier). Recommend passive tiles for v1 (symbolic ethos), upgrade later.
- **OF-6 — Free-movement (exploration) phase scope.** Bible §5.1 mandates it; the *extent* (full map free-roam vs limited deploy radius) is a feel choice.

---

## 15. Open questions

- **Q1** Does **Dive Attack +2CS** (`Flight_Altitude_System`) stack with the **height CS advantage** of the launch altitude, or replace it for that attack? (Spec assumes *replace for the diving attack, since the unit ends lower*; confirm with combat-balance sim.)
- **Q2** When a flyer at Z2 attacks a ground target, does the target's **ground cover** still apply (the flyer is shooting *down* past the cover)? Elevation-cover row says "attacker above target → target loses cover bonus" — spec assumes **cover negated from above at Z≥ (cover height)**; needs a cover-height value per cover tier (currently none in source → likely OF/sim).
- **Q3** Exact **`reflex/quick-draw` skill presence** per unit — these +10/+5 initiative bonuses require the skill on the sheet; confirm `Complete_Skills_Talents` exposes them as booleans the initiative calc can read.
- **Q4** The **per-terrain tile-mix table** (OF-1) — author now or stub uniform for v1?
- **Q5** Does **Suppressive Fire's** "stay in cover or take fire" force an actual reaction roll, or just deny the suppressed unit's movement out of cover? (Spec assumes movement-denial + −1CS; confirm whether it consumes the suppressor's AP per suppressed unit.)
- **Q6** **Multiplayer determinism:** is the seed *per-encounter* (single-player rewind) or will the MP-dimension stub need *per-action server reconciliation*? Deferred to doc 107; TC-8 keeps the door open either way.

---

*Sources opened for this spec: `Tactical_Grid_System.csv`, `Combat_Modes_Stances.csv`, `Initiative_Turn_Order.csv`, `🦆DODGE CHART🦆.csv`, `Flight_Altitude_System.csv`, `Building_Flight_Limitations.csv`, `Combat_Resolution_Quick_Reference.csv`, `Universal_Table_FIXED.csv`, `City_Type_Effects.csv`, `Culture_Region_Effects.csv`, `TerrainCodes.csv`, `🎯PERSONALITY TARGET SELECTION🎯.csv`, World Bible `Country.csv`, `SHT_MECHANICS_BIBLE.md` (§2, §3.3, §5.1–§5.4, §5.10, §5.12, §11, §13, §14). Every number above traces to one of these; nothing invented — gaps are flagged RULING/OWNER-FORK/Open-Question.*
