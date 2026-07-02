# 04 — World Map & Sectors

> **System:** The strategic world layer — sectors (mapped to countries), fog of war, blips, on-map notifications, deployment & travel.
> **Status:** BUILD-READY spec. Every number traces to a named source table; design choices that fill data gaps are tagged `RULING:`; product choices are tagged `OWNER-FORK:`.
> **Owns:** the screen the player stares at between missions — the "living world that talks to you."
> **Primary sources opened:** `SuperHero Tactics World Bible - Cities.csv` (1,068 city rows), `SuperHero Tactics World Bible - Country.csv` (168 country rows), `TerrainCodes.csv` (25 codes), `FIST GDD v02.txt` §"World Layer" (lines 578-640, 1455+), `MAP_VISUAL_LAYOUTS.txt`, `Game_Mechanics_Spec/Travel_Time_System.csv`, `Game_Mechanics_Spec/Country_Attribute_Effects.csv`, `Game_Mechanics_Spec/City_Type_Effects.csv`, `Game_Mechanics_Spec/Culture_Region_Effects.csv`, `Game_Mechanics_Spec/Tactical_Grid_System.csv`, `Player_Scaling.csv`, `World_State_Tracking_System.csv`, `SHT_MECHANICS_BIBLE.md` (§2 Spine, §6 World Layer, §11 Time, §13 Rulings).
> **Code reality cross-checked:** `MVP/src/data/sectors-populated.ts` (Sector interface, 1,008 sectors), `MVP/src/data/sectors.ts`, `MVP/src/data/travelSystem.ts`, `MVP/src/stores/enhancedGameStore.ts` (squad state, `deployToSector`).

---

## 1. Overview & Player Fantasy

You are not looking at a menu. You are looking at **Earth, and Earth is looking back.**

The world map is the home screen of the campaign. It is a **42-column × 24-row sector grid** laid over the real globe (1,008 sectors total; `sectors-populated.ts`, `importSectorsJSON` asserts `length === 1008` = 24 × 42). Each land sector carries one or more of the **168 countries** and the cities inside them (1,068 city rows in `World Bible - Cities.csv`). The map starts **largely unexplored and under fog of war** (FIST GDD line 637), and as your squads move, investigate, and as **news/email arrive**, the fog peels back and **blips** light up — a troop buildup in one sector, a super-criminal sighting in another, a distress email pinned to a third.

The fantasy, per the Bible's §2 Spine and the FIST GDD's "go *to* the threat" design (GDD line 612 — *"If there is something going on in Georgia the enemy would have to fly to Georgia to deal with that"*): **the world has its own agenda, runs in real time, and you chase it.** You issue *high-level orders* (GDD line 372 — *"the player issues high-level orders to units"*); you do not micro-walk. The grid itself is only drawn when you are picking a destination (GDD line 639 — *"The grid is only shown when selecting the destination of a squad"*) — otherwise the map reads as a living globe with blips and a clock.

Combat is one verb reachable *from* this screen, not the screen's purpose. The map's job is to **surface emergence** (blips driven by country stats + 20 personalities) and let you **commit a squad to a sector** at a real time-cost.

---

## 2. Data Schema

### 2.1 Sector (extends the existing `Sector` interface)

The base record already exists in `sectors-populated.ts`. This spec **extends** it with the strategic-layer fields. Fields marked ★ are new and must be added.

```ts
type SectorId = string;            // "A1".."X42" — letter = ROW (A-X, 24), number = COLUMN (1-42)
                                   // ⚠ see RULING-1: code currently inverts this. Lock the convention here.

type SectorTerrain =
  | 'ocean' | 'coastal' | 'land' | 'arctic'
  | 'desert' | 'mountain' | 'jungle' | 'forest' | 'plains';
// SOURCE: sectors-populated.ts SectorTerrain union (9 strategic buckets).
// These 9 buckets are the COARSE world-layer terrain. The 25 fine TerrainCodes.csv
// values map INTO these 9 (see §3.6 table) and are what the tactical layer reads.

interface Sector {
  // --- existing (sectors-populated.ts) ---
  id: SectorId;
  row: string;                     // "A".."X"  (24 rows)
  col: number;                     // 1..42     (42 cols)
  terrain: SectorTerrain;
  countries: string[];             // ISO/Bible country codes, display order, e.g. ["US","CA"]
  isOcean: boolean;
  isCoastal: boolean;
  notes?: string;

  // --- ★ NEW: strategic layer ---
  fineTerrain?: number;            // ★ 1..25 TerrainCodes.csv code (drives tactical map template + move cost)
  cityIds?: string[];             // ★ city rows from World Bible - Cities.csv whose Sector == id
  hvtIds?: string[];              // ★ High-Value Targets present (Cities.csv HVT column)
  cultureCode?: number;            // ★ 1..14 dominant Culture_Region_Effects code (from cities in sector)
  fog: FogState;                   // ★ per-sector fog (see 2.2)
  controlFaction?: FactionId;      // ★ 'US'|'IN'|'CN'|'NG'|null — territory overlay (Country_Attribute_Effects)
  blips: Blip[];                   // ★ active map markers in this sector (see 2.3)
  detectionRisk: number;           // ★ 0..100 base, from terrain + country IntelligenceBudget (see §3.5)
}
```

### 2.2 FogState

```ts
type FogLevel =
  | 'unexplored'   // never seen — solid fog, no country names, no blips
  | 'rumored'      // a blip/news told you SOMETHING is here, but not what (silhouette only)
  | 'scouted'      // a squad passed adjacent or investigation revealed it — terrain + country visible
  | 'revealed';    // a squad has occupied/cleared it — full city list, stats, live blips

interface FogState {
  level: FogLevel;
  lastSeenGameDay: number;         // game-day index when last 'scouted'/'revealed'
  decayToRumoredAfterDays: number; // ★ revealed → rumored decay (see RULING-3)
}
```
SOURCE for fog existence & "starts unexplored": FIST GDD lines 637-639. The 4-tier ladder is `RULING-2` (the GDD names only "fog of war" + "the grid is only shown when selecting a destination"; tiers fill the gap).

### 2.3 Blip (on-map notification marker)

```ts
type BlipKind =
  | 'mission'        // email/investigation produced a deployable objective
  | 'crime'          // crime-sim spike (per-city crimeIndex) — catchable if you Patrol/deploy
  | 'lsw_sighting'   // an LSW emerged or was sighted (recruit / fight)
  | 'faction_move'   // AI faction maneuver ("Point of Interest" — telegraphs an enemy move)
  | 'crisis'         // Dynamic_Political_Events crisis localized to this sector
  | 'distress'       // priority email pinned to a place
  | 'recruit'        // a recruitable vigilante/national appeared
  | 'squad'          // one of YOUR squads (always shown, never fogged)
  | 'apocalypse';    // special apocalypse-map node (GDD line 634)

type BlipUrgency = 'ambient' | 'normal' | 'priority' | 'critical';

interface Blip {
  id: string;
  kind: BlipKind;
  sectorId: SectorId;
  cityId?: string;                 // optional precise city anchor
  urgency: BlipUrgency;
  title: string;                   // "Troop buildup near Tbilisi"
  spawnedGameDay: number;
  expiresGameDay?: number;         // blip rots if ignored (event happens without you — GDD/Bible Pillar 3)
  threatLevelCap?: ThreatLevel;    // Alpha..L5 — gates against player tier (Player_Scaling)
  payloadId?: string;              // FK into mission/email/event engine (HYBRID template instance)
  requiresFog: FogLevel;           // min fog level at which this blip becomes visible (see §3.4)
}
```
SOURCE: FIST GDD line 630 "Blips"; line 635 "Combat encounters or choices in almost all sectors"; Bible §7.2 News ("Point of Interest" telegraphs AI moves) and §6.5 (crime sim feeds blips). `BlipKind` enumerates the event sources the Bible already names.

### 2.4 Squad position (already in `enhancedGameStore.ts` — referenced, not redefined)

```ts
// EXISTING (enhancedGameStore.ts lines 332-334, 625-627):
currentSector: SectorId;                 // "K3"
destinationSector?: SectorId;
squadStatus: 'idle' | 'traveling' | 'on_mission' | 'in_combat';
travelProgress: number;                  // 0..1
```
This spec reads/writes these. Multi-squad lives in `squadSystem.ts` (CLAUDE.md Phase 4); each squad carries its own `currentSector`/`squadStatus`.

---

## 3. Exact Numbers, Tables & Formulas (each cited)

### 3.1 Grid dimensions & sector-ID convention

| Quantity | Value | Source |
|---|---|---|
| Grid size | **42 columns × 24 rows = 1,008 sectors** | `sectors.ts` header comment "42x24 grid (A-X rows, 1-42 columns)"; `importSectorsJSON` asserts `length === 1008` |
| Row labels | **A–X** (24 letters) | `sectors-populated.ts` `Sector.row` |
| Column labels | **1–42** | `sectors-populated.ts` `Sector.col` |
| Real-world scale | **1 sector ≈ 500 km** | `Travel_Time_System.csv` → "Grid_Scale, Each grid square = approximately 500km" |
| Sector ID format | `${row}${col}` e.g. `"K3"` = row K, column 3 | `sectors-populated.ts` examples ("A1","K15") |

> **⚠ RULING-1 (grounded in a real code bug):** `enhancedGameStore.ts:1520-1523` parses an ID by treating the **letter as the column** (`charCodeAt(0)-65`) and the **number as the row** (`parseInt(slice(1))`). But `sectors-populated.ts` defines **letter = row, number = col**. These contradict. **Lock the canonical convention to `sectors-populated.ts`: letter = ROW (A→X, north→south), number = COLUMN (1→42, west→east).** The deploy-distance code must be corrected to `rowIndex = id.charCodeAt(0)-65`, `colIndex = parseInt(id.slice(1))-1`. Until corrected, travel distances are transposed. This is a build-blocking inconsistency, fixed here by ruling.

### 3.2 Sector distance & travel time

**Distance** (existing convention in `enhancedGameStore.ts:1524`, kept):
```
dRow = abs(rowIndex_A − rowIndex_B)
dCol = abs(colIndex_A − colIndex_B)
manhattan = dRow + dCol
chebyshev = max(dRow, dCol)            // # of sector "steps" incl. diagonals
diagonals = min(dRow, dCol)
straights = chebyshev − diagonals
sectorSteps = straights + (diagonals × 1.4)   // diagonal = 1.4× a straight step
```
SOURCE for the 1.4× diagonal: `Travel_Time_System.csv` → "Diagonal_Sectors, 1.4x adjacent time". (The legacy code uses pure Manhattan; this spec upgrades it to the 1.4×-diagonal model the data specifies.)

**Travel time per sector step** — driven by **mode** (`Travel_Time_System.csv`):

| Mode | Game-days **per adjacent sector** | Source row |
|---|---|---|
| Ground (walk/vehicle) | **1.0 day** | "Adjacent_Sectors, 1 day ground travel; 0.5 day air" |
| Air (commercial/private/military) | **0.5 day** | same row |
| LSW Flight (Low) | **0.5 day** | matrix "LSW_Flight_Low, Same_Continent 1-2" → ~0.5/step |
| LSW Flight (High) | **0.5 day continental, 0 same-country** | matrix "LSW_Flight_High" |
| Super Speed (High) | treat as Air, **0.5 day** floor | matrix "Super_Speed_High … Extreme" |
| Teleportation | **0 days** (if destination known/revealed) | matrix "Teleportation, 0 (if known)" |

```
travelGameDays = sectorSteps × dayPerStep[mode] × terrainMult × complicationMult
```

**Terrain multiplier** (`terrainMult`) per the fine terrain of sectors crossed — derived from `Tactical_Grid_System.csv` "MOVEMENT COSTS BY TERRAIN" + `travelSystem.ts` `groundSpeedMod` (movement-cost is the inverse of speed-mod):

| Fine terrain (TerrainCodes.csv) | Ground mult | Air mult | Source |
|---|---|---|---|
| Plains / Grasslands / Farmland (6,8,23) | ×1.0 | ×1.0 | `travelSystem.ts` plains `groundSpeedMod:1.0` |
| Paved/Unpaved Roads (5,7) | ×1.0 | ×1.0 | Grid "Clear, 1 square = 1 movement" |
| Desert / Rocky Desert (4,9) | ×1.5 | ×1.0 | `travelSystem.ts` desert (slow ground, normal air) |
| Forest/Light/Heavy (15,16,18) | ×1.5 | ×1.0 | `travelSystem.ts` forest "Moderate ground" |
| Hills (10) | ×1.5 | ×1.0 | RULING-4 (interpolated, between plains & mountains) |
| Swamp (11) | ×2.0 | ×1.0 | Grid "Difficult, 1 square = 3 movement" (mud) → ~2× world-scale |
| Jungle / Rain Forest / Jungle Mtns (13,17) | ×2.0 | ×1.5 | `travelSystem.ts` jungle "slow ground, can't see from air" |
| Mountains / High-Alt / Forested Mtns (14,19) | ×2.0 | ×1.5 | `travelSystem.ts` mountain "Very slow ground, slow air" |
| Snow / Ice (12,22) | ×2.0 | ×1.5 | `travelSystem.ts` arctic "Slow ground, slow air" |
| Wasteland / Exclusion Zone (24,25) | ×1.5 (+radiation, §3.6) | ×1.0 | Bible §6.3 "wasteland/exclusion-zone radiation" |
| Ocean (1) | ground **blocked** | ×1.0 | `travelSystem.ts` ocean `allowsGround:false` |
| Coastal/Lake/River (2,20,21) | ×1.0 water, ground ×1.5 | ×1.0 | `travelSystem.ts` coastal |

> **RULING-4:** Hills (code 10) and the multi-square Grid costs (1/2/3 movement) are mapped to world-scale multipliers ×1.0 / ×1.5 / ×2.0 to keep the world-layer math integer-friendly. `travelSystem.ts` is the existing source of truth for the 9 coarse buckets; this table just resolves the 25 fine codes onto it.

**Complication multiplier** (`complicationMult`) — rolled once per leg (`Travel_Time_System.csv` "TRAVEL COMPLICATIONS"):

| Complication | Chance | Effect | Source |
|---|---|---|---|
| Weather delay | **15%** | ×1.5 travel time | "Weather_Delay,15%,+50% travel time" |
| Political checkpoint | **10%** in hostile territory | +2 game-days **and** detection roll | "Political_Checkpoint,10%(hostile)…+2 days + detection risk" |
| Equipment failure | **5%** | stranded; must re-route | "Equipment_Failure,5%,Stranded" |
| Customs inspection | **20%** international (cross-country leg) | possible gear confiscation | "Customs_Inspection,20%(international)" |
| LSW encounter | variable by region | combat or social encounter (spawns a `lsw_sighting` blip mid-travel) | "LSW_Encounter,Variable by region" |

**Travel commitment rules** (`Travel_Time_System.csv` "TRAVEL COMMITMENT RULES"):
- **Commitment lock:** once travel begins it cannot be interrupted *without an LSW power* (teleport/time).
- **Emergency abort:** allowed at **−50% progress**, no time refund.
- **Multi-stop:** each extra waypoint **+50% base time**.
- **Rush travel:** pay **2× cost for −25% time** (commercial only).
- **Covert travel:** **+50% time** for an untraceable route (reduces detection — see §3.5).

### 3.3 Real-time clock ↔ game-time conversion

| Real | Game | Source |
|---|---|---|
| 1 minute active play | 0.02 days (~30 min) | `Travel_Time_System.csv` "REAL TIME TO GAME TIME REFERENCE" |
| 1 hour | 1.25 days | same |
| 1 real day | 30 game days | same; Bible §6.5 "1 real day : 30 game days" |
| 1 real week | 210 game days | same |
| **82.4 real days** | **2,472 game days** (full countdown to invasion) | same; Bible §0 "2,472-day countdown" |

The world clock is **real-time-with-pause** (Bible §11; CLAUDE.md "REAL-TIME WITH PAUSE"). **Opening the laptop/phone pauses time** (Bible §7); the player has speed controls. Blips, travel progress, crime ticks, and AI faction moves all advance on this clock.

### 3.4 Blip visibility vs fog (gating table)

A blip is drawn only if `sector.fog.level >= blip.requiresFog`. Default `requiresFog` per kind:

| BlipKind | Min fog to show | Rationale (source) |
|---|---|---|
| `squad` | always (ignores fog) | your own units (GDD line 632) |
| `distress` / `mission` (from email) | `rumored` | email arrives regardless of map state (Bible §7.1 "missions arrive in your inbox") |
| `faction_move` ("Point of Interest") | `rumored` | News telegraphs AI moves before you've scouted (Bible §7.2) |
| `crisis` | `rumored` | global crises broadcast (World_State_Tracking "Crisis_Event_Pipeline") |
| `lsw_sighting` / `recruit` | `scouted` | requires you to have eyes near the area |
| `crime` | `scouted` | local crime needs local presence/intel (Bible §6.5 crime sim) |
| `apocalypse` | `revealed` | special node revealed by occupying |

A `rumored` blip shows **only a silhouette + urgency color, no title text** until the sector reaches `scouted`. This is the "the world is talking, but you don't fully understand yet" beat.

### 3.5 Detection risk (consumes the spine — Intel/Cyber)

Moving/operating in a sector rolls detection. Base from terrain (`travelSystem.ts` `detectionRisk`, e.g. ocean 20), modified by the **country's Intelligence & Cyber stats** (`World Bible - Country.csv` columns `IntelligenceBudget`, `CyberCapabilities`):

```
detectionRisk_sector =
    base_terrain_detection                         // travelSystem.ts (0..100)
  + intelCS                                        // see below
  + cyberCS
  − covertMods                                     // covert travel −, stealth powers −
  − factionTerritoryMod                            // home territory −, hostile +
```
Where the country-stat → CS mapping is (`Country_Attribute_Effects.csv`):

| Country stat band | Effect on covert/detection | Source row |
|---|---|---|
| IntelligenceBudget High (66-100) | **−2CS covert; +3CS detection risk** | "Strong intel: -2CS covert; +3CS detection risk" |
| IntelligenceBudget Low (0-35) | +2CS covert; easy surveillance (low detection) | "Weak intel: +2CS covert ops; easy surveillance" |
| CyberCapabilities High (66-100) | −2CS hacking; +2CS cyber surveillance (higher detection) | "High cyber: -2CS hacking; +2CS cyber surveillance" |
| **High Military + High Intel** combo | **Security State: all covert −2CS** | combo table |

Convert ±CS to risk points at **1 CS = ±8 risk** (RULING-5; see §3.7). Covert-travel route subtracts a flat **−25 risk** at the +50% time cost (from "Covert_Travel" commitment rule). Clamp 0..100.

### 3.6 Fine terrain → tactical map template & hazards

`fineTerrain` (1..25, `TerrainCodes.csv`) picks the **combat map template** when a blip is engaged (Bible §6.3 "Terrain also picks the combat map template"). Mapping the 25 codes onto the shipped templates (`MAP_VISUAL_LAYOUTS.txt`: Urban Warehouse, Military Compound, City Streets) plus terrain hazards:

| Fine code(s) | Map template | World hazard |
|---|---|---|
| 4,9 Desert/Rocky | open/low-cover desert variant | heat; ×1.5 ground (§3.2) |
| 5,6,7,8,23 Roads/Plains/Grass/Farm | **City Streets** if cityType urban, else open field | none |
| 10,14,18,19 Hills/Mountains | mountain pass (high-cover, vertical) | ×2 ground; altitude affects flight Z-cap |
| 11 Swamp / 13,17 Jungle | dense-concealment template | difficult terrain; "can't see from air" |
| 12,22 Snow/Ice | arctic | cold STA drain (ties to Flight_Altitude_System STA-drain ruling) |
| 24,25 Wasteland/Exclusion Zone | ruined-urban | **radiation** status applied to non-immune units (Bible §6.3) |
| 1,2,3,20,21 Ocean/Coastal/Islands/Lake/River | seaport/dock template | water blocks ground; flight/water only |
| City present (any of CityType1-4) | by CityType (Military→Military Compound; Industrial→Urban Warehouse; else City Streets) | per CityType (`City_Type_Effects.csv`) |

SOURCE: `City_Type_Effects.csv` `Combat_Modifier` column (e.g. Military "Military response if detected"; Industrial "Environmental hazards in combat"; Resort "Civilian density very high −2CS collateral").

### 3.7 The CS↔points conversion constant

> **RULING-5:** The spine speaks in **±CS** (Column Shifts — Bible §3.3 "Column Shift is the universal currency"), but the map needs scalar risk/price/difficulty numbers. **Define 1 CS = 8 points** on any 0-100 scale (so the full ±3CS legal/covert swing the country tables describe spans ±24, leaving headroom). This is the single conversion used everywhere the world layer turns a CS modifier into a number (detection, price, mission difficulty). No source table states a numeric CS value; this ruling makes the conversion explicit and consistent so combined-effects are actually consumed (Bible §13 ruling 9).

---

## 4. How It Consumes the SPINE

The map is the **primary surface** of the Spine (Bible §2). Every sector's behavior is computed from the country/city/culture/faction it contains. Concrete consumption:

### 4.1 Country stats → sector strategic profile

For each sector, aggregate its `countries[]` (weighted by which country owns the most cities in the sector) and read `World Bible - Country.csv`. Applied via `Country_Attribute_Effects.csv`:

| Country column | Drives on the map | Formula / band |
|---|---|---|
| `LSWRegulations` (Banned/Regulated/Legal) | Whether public ops are legal here → **mission legality tint** on sector; Banned = **−3CS public ops** | `Country_Attribute_Effects` "Banned: -3CS public operations" |
| `LSWActivity` (20-90) | **Blip spawn rate** of `lsw_sighting`/`recruit`; High = +2CS recruitment | "High activity: +2CS recruitment; +2CS LSW combat encounters; frequent events" → blipRate = lerp(low→high) |
| `IntelligenceBudget` + `CyberCapabilities` | **detectionRisk** (§3.5) | §3.5 |
| `GovernmentCorruption` (20-90) | bribe-path availability on `mission` blips; black-market access | "High corruption: -2CS official; +3CS bribes/blackmail" |
| `MilitaryBudget` (20-90) | `faction_move` blip frequency; military-response severity on engage | "Strong military: -2CS infiltration; +2CS military equipment access" |
| `Healthcare` + `Cloning` | post-combat recovery & resurrection availability in this sector | Bible §8 Cloning; "High Healthcare + High Cloning = Medical Center" |
| `TerrorismActivity` (Inactive/Rare/Active) | spawns `crisis`/`crime` blips; Active = +2CS anti-terror | "Active: frequent terror events; +2CS anti-terror investigations; combat risk" |

### 4.2 City stats → blip anchoring & engagement options

From `World Bible - Cities.csv` (real columns: `Sector, CountryCode, CultureCode, CityName, Population, PopulationRating, CityType1-4, HVT, CrimeIndex, SafetyIndex`):

- **`Sector`** column is the **direct FK** — a city joins its sector by this code (e.g. Kabul→`LJ5`... note: Cities.csv uses some 2-letter sector codes like `LJ5`, `IV3`; the world-grid uses 1-letter+number — see Open Question 8.1).
- **`CrimeIndex`** (per-city 0-100) → **`crime` blip spawn weight** and `City_Type_Effects.csv` crime bands: e.g. CrimeIndex 60-80 = "−2CS official methods; +2CS underground methods; combat more likely"; 80-100 = "constant combat risk". Drives how often a sector lights up with a crime blip and whether it auto-escalates to combat.
- **`CityType1-4`** → engagement template (§3.6) + investigation/recruitment bonuses (`City_Type_Effects.csv`). Multi-type: primary full, secondary = ½ bonus rounded down ("Secondary_Caps").
- **`PopulationRating`** (2-7) → resource/stealth tradeoff on missions in this city (`City_Type_Effects.csv` "POPULATION TYPE INTERACTIONS": Mega City rating 7 = "+3CS resources; −3CS stealth").
- **`HVT`** → seeds `hvtIds`; an HVT present raises blip urgency to ≥ `priority`.
- **`SafetyIndex`** (= 100 − CrimeIndex in the data) → fog-reveal friendliness (safer cities easier to scout).

### 4.3 Culture (1-14) → social & power flavor of the sector

`CultureCode` (Cities.csv) → `Culture_Region_Effects.csv`:
- **Social ±CS** for recruit/diplomacy blips: same culture **+2CS**, similar **+1CS**, opposed **−1CS**; language barrier **−2CS** ("CULTURE INTERACTION MATRIX").
- **LSW power affinity** seeds *what kind* of `lsw_sighting` spawns (e.g. South Asia code 5 = "+2CS spiritual/mystical investigations; Mystical/Divine/Elemental powers common"; North America code 13 = "+2CS technology investigations; Tech/Mutation powers").

### 4.4 Faction territory overlay (4 factions)

`controlFaction` overlays `Country_Attribute_Effects.csv` "FACTION TERRITORY BONUSES" on top of base country stats:

| Relationship | Modifier (US example) | Source |
|---|---|---|
| Home | **+3CS all methods; full equipment; legal immunity** | "United States … Home" |
| Allied | +1 (per-faction signature, e.g. India +1CS diplomatic) | table |
| Neutral | standard | table |
| Hostile | **−2CS all methods; −2CS equipment** | "−2CS all methods" |

This tints each sector with a faction color and changes the CS math for every blip resolved there.

### 4.5 Personality (20 types) → which blips, where

The 20 personality types (Bible §5.10, `PERSONALITY TARGET SELECTION`) are the **emergence engine** for blip *content*: an aggressive AI faction leader generates more `faction_move`/`crisis` blips toward rivals; a paranoid one generates `surveillance` detection spikes. The map consumes this indirectly — personality drives the HYBRID event engine that *parameterizes* the authored blip/mission templates (Bible §6.5 Dynamic Political Events). The map only needs the *output* (`Blip.payloadId` → a template instance), but its **spawn weighting** reads the controlling entity's personality (see Integration §6, `worldEventEngine`).

---

## 5. Edge Cases & Failure Modes

| # | Case | Handling |
|---|---|---|
| E1 | **Transposed sector ID** (RULING-1) | Lock letter=row, number=col; fix `enhancedGameStore.ts:1520-1523`. Add a unit test asserting `parse("K3") = {row:10,col:3}`. |
| E2 | **Ocean sector deploy with ground-only squad** | `travelSystem.ts` `ocean.allowsGround=false` → block deploy, surface "needs air/water transport" (toast already exists pattern). |
| E3 | **Blip in unexplored sector** | Gated by §3.4 `requiresFog`. `rumored` blips render as silhouettes; never leak country/city names until `scouted`. |
| E4 | **Blip expires (ignored)** | At `expiresGameDay`, remove blip and fire the "event happened without you" consequence (Bible Pillar 3 / §7.1 "Ignoring email lets events happen without you"). Log to news. |
| E5 | **Squad mid-travel, target blip expires** | Travel still completes (Commitment Lock); on arrival the objective is gone → spawn a downgraded "aftermath" investigation blip instead. |
| E6 | **Two squads same sector** | Allowed; both render with offset; engaging combines into one tactical deployment (squad cap per `Player_Scaling` tier: 1-2 at tier 1 … 8-15 at tier 6). |
| E7 | **Equipment-failure complication (5%)** mid-leg | Squad stranded at the last-entered sector; `squadStatus` stays `traveling` but `travelProgress` frozen; player must re-route or abort (−50% rule). |
| E8 | **Teleport to unrevealed sector** | Disallowed — matrix says "0 (if known)". Teleport requires `fog.level >= scouted`. Surface "destination unknown — scout first." |
| E9 | **Threat-cap mismatch** | If `blip.threatLevelCap > player tier cap` (`Player_Scaling` Threat_Level_Cap), show blip as **locked/grayed** with "exceeds your authority (Tier N)"; cannot deploy. |
| E10 | **Country spans many sectors / sector spans many countries** | `Sector.countries[]` ordered by city-count; strategic profile = city-weighted average. A `crisis` for a country lights **all** its sectors but anchors the blip in its highest-population city's sector. |
| E11 | **Apocalypse / planet swap** (GDD lines 606,615,618) | Map is data-swappable: the grid + fog + blip systems are planet-agnostic; an `apocalypse` flag re-skins terrain and seeds combat-in-almost-every-sector (GDD line 635). Single-player ships Earth; the swap is an architectural seam. |
| E12 | **Time-travel rewind** (save = diegetic) | On rewind, fog/blip state restores to the snapshot's `lastSeenGameDay`; **`revealed` sectors stay revealed** (you remember the map) but **live blips reset** to the past state. Memory persists, world resets — matches the Time Walker fiction (Bible §11). |
| E13 | **Real-time blip flood** | Cap simultaneous `critical` blips; queue overflow into the News/email app rather than the map. Prevents the map from becoming unreadable during a crisis cascade. |
| E14 | **Detection roll ≥ 100** | Squad is **made**: spawns a `faction_move`/`crisis` counter-blip and applies a reputation/legal consequence (Bible §9). |

---

## 6. UI/UX Hooks

### 6.1 World-map screen (the home base)
- **Globe/grid view**: sectors colored by `terrain` (`TERRAIN_COLORS` in `sectors-populated.ts`), tinted by `controlFaction`, dimmed by `fog.level`. Country labels appear at `scouted`+.
- **Grid overlay only on deploy** (GDD line 639): when the player taps a squad → "Deploy", the destination grid appears with reachable sectors highlighted (by mode range, §3.2) and ETA labels.
- **Blip layer**: pulsing markers by `urgency` color (ambient→gray, normal→white, priority→amber/gold per house palette, critical→blood-red). Silhouettes for `rumored`. Tap → preview card (title, ETA, threat cap, "Deploy" / "Send email reply" / "Dismiss").
- **Clock + speed control** (top bar): real-time-with-pause; shows game-day index and **days-to-invasion** (2,472 countdown). Pauses automatically when laptop/phone opens.

### 6.2 Phone (the "world talks to you" channel)
- New `priority`/`critical` blips push a **phone notification** (comic-bubble style, Bible §7.5) even while the map is closed; tapping jumps the camera to the sector. This is the literal realization of "a living world that talks to you."

### 6.3 Laptop / News / Email
- **News "Point of Interest"** items (Bible §7.2) are the *narrative twin* of `faction_move` blips — clicking a news item flies the map to the relevant sector.
- **Email** missions drop `mission`/`distress` blips; replying in email (the dialogue system) can *resolve a blip without deploying* (diplomatic option).

### 6.4 Combat overlay (the seam to the tactical layer)
- Engaging a blip launches `CombatScene` with the **map template chosen by §3.6** (fine terrain + city type), the **collateral CS** from city density (`City_Type_Effects.csv` Combat_Modifier), and the **faction-response severity** from country `MilitaryBudget`.
- On combat exit, results write back: clear/expire the blip, update `controlFaction` if it was a control fight, spawn aftermath blips (wounded→hospital, captured→prisoner), advance the clock.

---

## 7. Integration Points (reads / writes)

**Reads:**
- `sectors-populated.ts` (`SECTORS`, `getSector`, `getAdjacentSectors`) — grid truth.
- `World Bible - Country.csv` via `allCountries` (Bible §13 ruling 10: unify on `allCountries`+`allCities`).
- `World Bible - Cities.csv` via `allCities` — joined by the `Sector` column.
- `TerrainCodes.csv` (`fineTerrain` → template/hazard), `travelSystem.ts` (`BASE_TERRAIN_RULES`).
- `Country_Attribute_Effects.csv`, `City_Type_Effects.csv`, `Culture_Region_Effects.csv` — the spine effect tables.
- `Player_Scaling.csv` — geographic scope + threat cap gating (E9).
- `Travel_Time_System.csv` — all travel math.

**Writes / fires:**
- `enhancedGameStore.ts` squad state (`currentSector`, `squadStatus`, `travelProgress`) — **already wired** via `deployToSector`; this spec corrects RULING-1 and swaps Manhattan→1.4×-diagonal.
- `EventBus` events: `player:travel-started` (exists, line 1537), plus new `world:blip-spawned`, `world:blip-expired`, `world:sector-revealed`, `world:detection-triggered`.
- **News/email engine** (Bible §7) — blip expiry & detection write news items.
- **Combat** (`CombatScene` via `EventBridge`) — engage launches combat with §3.6 template.
- **worldEventEngine / Dynamic_Political_Events** — the HYBRID template engine that *produces* blip `payloadId`s; the map subscribes and renders.
- **Crime sim** (Bible §6.5, "already built in code: org lifecycles, 16 activities, weekly tick, per-city crimeIndex") — emits `crime` blips on its weekly tick.

---

## 8. RULING Notes (collected)

- **RULING-1** — Sector-ID convention is **letter=row, number=col** (per `sectors-populated.ts`); fix the transposed parse in `enhancedGameStore.ts:1520-1523`. Build-blocking. (§3.1)
- **RULING-2** — Fog has **4 tiers** (`unexplored / rumored / scouted / revealed`); the GDD only names "fog of war." (§2.2)
- **RULING-3** — `revealed` sectors **decay to `rumored`** after `decayToRumoredAfterDays` game-days of no presence (default **90 game-days** = 3 real days); your map memory fades but country/terrain stays known. (§2.2, E12)
- **RULING-4** — The 25 fine `TerrainCodes` map onto the 9 coarse `travelSystem.ts` buckets with ×1.0/×1.5/×2.0 ground multipliers; hills/swamp interpolated. (§3.2)
- **RULING-5** — **1 CS = 8 points** is the canonical CS↔scalar conversion for all world-layer numbers (detection, price, difficulty). (§3.7)

## 9. OWNER-FORK Notes (product choices)

- **OWNER-FORK-A — Blip density / pacing.** How many blips on screen at once before they overflow to News (E13)? This is a feel knob (sparse-and-tense vs busy-and-alive). Recommend starting at **8 visible non-squad blips per continent-scope view**, but the owner sets the target texture.
- **OWNER-FORK-B — Fog aggressiveness.** Whether the *whole* map starts `unexplored` (hardcore, GDD-literal) or whether your **home faction territory** starts `revealed` (friendlier onboarding). The GDD says "largely unexplored"; recommend home territory pre-revealed, rest fogged — but this is an onboarding/difficulty product call.
- **OWNER-FORK-C — Rewind & the map.** On a time-travel rewind, does the player **keep map knowledge** (revealed stays revealed, E12) or lose it for full tension? The Bible favors "tense, not a brick wall," which argues for keeping knowledge; the owner decides how punishing rewind feels on the map specifically.
- **OWNER-FORK-D — Real-time blip decay rate.** Whether ignored blips rot in **game-days** (story-paced) or **real minutes** (pressure-paced) while the map is open. Affects whether the player feels hunted by the clock.
- **OWNER-FORK-E — Multiplayer dimension seam.** The "other dimension" (Bible MP stub) is a **second map instance** the time-traveler can reach. Single-player ships one Earth grid; the schema is dimension-agnostic (E11). Owner decides whether dimension swap is even surfaced in SP.

## 10. Open Questions

1. **Sector-code reconciliation:** `World Bible - Cities.csv` uses sector codes like `LJ5`, `IV3`, `LD4` (2 letters + digit), but the world grid (`sectors-populated.ts`) uses 1 letter (A-X) + 1-2 digit cols (1-42). These are **different coordinate systems** and ~half the Cities rows have a blank `Sector`. **A join/mapping table is required** (Cities-sector-code → grid-sector-id) before cities can render on the grid. This is the single biggest data-integration blocker; recommend a one-time migration script (cross-ref with `DATA_MIGRATION_PLAN.md`).
2. **Blank-sector cities:** Many Cities rows (e.g. all Algeria rows in the sample) have an empty `Sector` field. Fallback: derive sector from country centroid? Owner/data decision.
3. **Diagonal travel & oceans:** does a diagonal step that clips an ocean corner count as ground-blocked? Recommend: diagonal is blocked if *either* orthogonal neighbor is impassable for the squad's mode.
4. **AI faction move cadence:** `World_State_Tracking_System.csv` says political state updates "every player action" + AI autonomous events — exact real-time tick rate for `faction_move` blip generation is unspecified (tie to the existing time engine's tick).
5. **Vehicle assignment vs flight:** GDD line 626 — "Characters using different movement types cannot be in the same squad." Does a flyer + a walker force two squads, or does the squad move at the slowest member's `dayPerStep`? Recommend slowest-member unless all can fly/ride.
