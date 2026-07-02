# 05 — Travel & Movement

> **System:** Travel-time system · Vehicles-as-travel · LSW flight/teleport
> **Status:** Build-ready spec (v1.0)
> **Primary sources:** `Game_Mechanics_Spec/Travel_Time_System.csv`, `Game_Mechanics_Spec/Vehicles_Complete.csv`, `SuperHero Tactics/TerrainCodes.csv`
> **Secondary sources:** `Flight_Altitude_System.csv`, `Building_Flight_Limitations.csv`, `LSW_Power_Combat_Mechanics.csv`, `Game_Mechanics_Spec/Stat_Rank_Mapping.csv`, World Bible `Country.csv`/`Cities.csv`, `SHT_MECHANICS_BIBLE.md` (§5.4, §6.5, §11, §13).
>
> **Scope split (locked):** This doc owns **STRATEGIC (world-map) travel** — moving a squad between sectors over game-days, choosing a travel *mode*, paying time/money/detection cost, and resolving travel complications. It does **NOT** re-spec **TACTICAL flight on the combat grid** (the Z0–Z6 altitude integer); that lives in the combat layer and is already ruled in Bible §5.4. This doc only defines the **handoff** between the two (which combat units/altitudes a flying or teleporting traveller arrives with) and the **LSW-flight/teleport strategic travel modes** that share data with the tactical altitude system.

---

## 1. Overview & player fantasy

The world map is a grid of **sectors** (~500 km each — `Travel_Time_System.csv` row "Grid_Scale"). You point a squad at a destination sector and the game asks **how** you get there. The *how* is the fantasy:

- A street team without a jet **drives** for days, risks a hostile-border checkpoint, and arrives tired.
- A funded org **charters a private jet** — fast, expensive, but flagged at customs.
- A faction member calls in a **military transport** — fastest conventional option, but only across friendly territory.
- An **LSW who can fly** crosses an ocean herself in hours, no airport, no ticket, no customs — but burns stamina and is limited by range tier.
- A **teleporter** is *there instantly* — if she's been there before or has line of sight — which collapses the entire travel layer into a single button, and is therefore deliberately rare and range-gated.

Travel is a **resource-spend minigame** that the living world pushes back on: weather delays you, a hostile checkpoint exposes you, customs may confiscate your gear. Travel-time is the **pacing dial** of the whole game — the 2,472-day invasion countdown means every day spent in transit is a day not spent defending (Bible §6.5, §11).

**One-line pitch:** *Where you can go, how fast, how visibly, and how expensively is computed from your roster's powers, your vehicles, your wealth, and the geopolitics of the ground you cross.*

---

## 2. Canonical units & the two grids (reconciliation — READ FIRST)

The source data and the current code disagree on grid size and the real→game time ratio. This section makes the rulings so a coder builds **one** model.

### 2.1 Time ratio
`Travel_Time_System.csv` "REAL TIME TO GAME TIME REFERENCE" gives two contradictory rows:
- `1 hour, 1.25 days` and per-mode `Game_Days_Per_Real_Hour` (e.g. Walking `0.5 days/hour`, Commercial_Flight `12 days/hour`).
- `1 day, 30 days` ("Base time flow"); `82.4 days, 2472 days` ("Full game countdown").

Bible §6.5 and §11 lock the **strategic clock** at **≈1 real day : 30 game days** (→ 82 real days to the 2,472-day countdown). `82.4 × 30 = 2,472` ✓ — internally consistent.

> **RULING — TR-1 (time ratio):** The **world clock** advances at **30 game-days per real-day** at 1× speed, real-time-with-pause (Bible §11; clock is owned by `TimeDisplay.tsx`/`timeEventGenerator.ts`, not this system). The per-mode `Game_Days_Per_Real_Hour` column in `Travel_Time_System.csv` is **deprecated as a clock**; those numbers are **re-interpreted as the relative SPEED RANKING of modes** (see §5, TR-3), not as a second clock. Travel duration is denominated in **GAME-DAYS** (so it's clock-rate-independent and survives the player changing game speed mid-trip).

### 2.2 Grid size & sector scale
Two grids exist in code (Bible build-note / §13.10 dataset-unification spirit):
- `globeTravel.ts`: **20 cols (A–T) × 10 rows (1–10)**, `BASE_HOURS_PER_SECTOR = 6`, horizontal wrap, polar rows `[1,10]` ×1.5.
- `sectors.ts` / `sectors-populated.ts`: **42 cols × 24 rows = 1008 sectors** (A–X rows, 1–42 cols), used to place the 1,050 cities.
- `WorldMapGrid.tsx` parses city sector codes as **`[RowLetter][ColLetter][SubSector#]`** (e.g. `LJ5`).

`Travel_Time_System.csv` is grid-agnostic: it gives **distance BANDS** (Same_City / Same_Country / Same_Continent / Different_Continent / Global_Opposite) and a **physical scale** (`Grid_Scale = ~500 km/square`; `Adjacent_Sectors = 1 day ground / 0.5 day air`; `Diagonal_Sectors = 1.4× adjacent`).

> **RULING — TR-2 (grid = the populated grid; travel = distance bands):** The **canonical grid is the 42×24 `sectors-populated` grid** (it owns the 1,050 cities; the 20×10 `globeTravel` grid is **legacy** and its `BASE_HOURS_PER_SECTOR = 6` is replaced). Travel cost is computed in **two stages**: (a) a **per-step base cost from the CSV** (`Adjacent = 1 game-day ground / 0.5 game-day air`, `Diagonal = 1.4×`), then (b) a **distance-BAND sanity clamp** (§5.3) so a cross-planet trip lands inside the CSV's `Different_Continent` / `Global_Opposite` ranges. Stage (a) is the engine; stage (b) is the designer guardrail that keeps numbers inside authored bounds. Horizontal wrap and the polar ×1.5 multiplier from `globeTravel.ts` are **retained** (see RULING TR-5). **OWNER-FORK OF-1**: if the team prefers to keep the 20×10 grid as the *travel* abstraction over the 42×24 *display* grid, that is a product choice — see §11.

### 2.3 Distance metric
> **RULING — TR-3 (distance):** Sector-to-sector distance is **Chebyshev** (king-moves: `max(|Δcol|, |Δrow|)`), with **diagonal steps costing 1.4× a cardinal step** per the CSV `Diagonal_Sectors` row. This honors the CSV's explicit diagonal rule. (The legacy `globeTravel.ts` uses Manhattan distance; that is replaced.) Horizontal **wrap** is applied to `Δcol` exactly as `globeTravel.ts` already does: `Δcol = min(|c2−c1|, GRID_COLS − |c2−c1|)`.

---

## 3. Data schema

All travel content is **data-table-driven** (Pillar #1). Three tables + one computed record.

### 3.1 `TravelMode` (one row per mode — seeded from `Travel_Time_System.csv` GROUND/AIR/SEA/LSW blocks)

```ts
type TravelClass = 'ground' | 'air' | 'sea' | 'lsw';
type SpeedCategory =                       // CSV "Speed_Category"
  'VerySlow' | 'Slow' | 'Medium' | 'Fast' | 'VeryFast' | 'Extreme' | 'Instant' | 'Special';
type RangeLimit =                          // CSV "Range_Limit" normalized
  'cityOnly' | 'sameCountry' | 'sameContinent' | 'global'
  | 'coastal' | 'railNetwork' | 'factionTerritory'
  | { miles: number }                      // LSW low-flight 500 mi / super-speed 1000 mi
  | 'lineOfSightOrKnown';                  // teleport

interface TravelMode {
  id: string;                  // 'Vehicle_Standard', 'Commercial_Flight', 'Flight_Low', ...
  label: string;               // UI display
  travelClass: TravelClass;
  speedCategory: SpeedCategory;
  speedRank: number;           // 0..7 ordinal derived from Game_Days_Per_Real_Hour (TR-3 of §5)
  rangeLimit: RangeLimit;      // CSV "Range_Limit"
  requirements: Requirement[]; // CSV "Requirements" parsed (see §3.4)
  notes: string;               // CSV "Notes"
  costModel: TravelCostModel;  // money cost (§6)
  detectionBase: number;       // 0..100 base detection contribution (§7)
}
```

### 3.2 `TravelComplication` (from `Travel_Time_System.csv` "TRAVEL COMPLICATIONS")

```ts
interface TravelComplication {
  id: 'Weather_Delay' | 'Political_Checkpoint' | 'Equipment_Failure'
     | 'LSW_Encounter' | 'Customs_Inspection';
  chance: number;              // base % (0..100), may be conditional (see trigger)
  trigger: 'always' | 'hostileTerritory' | 'international' | 'regional';
  effect: ComplicationEffect;  // structured (§8.1)
  preventedBy: string[];       // tags that negate/reduce (CSV "Prevention")
}
```

### 3.3 `TravelTerrain` (from `TerrainCodes.csv`, 25 codes)

```ts
interface TravelTerrain {
  code: number;                // 1..25 (TerrainCodes.csv)
  name: string;                // 'Ocean','Mountains','Exclusion Zone',...
  groundMult: number;          // multiplier on per-step ground time (RULING TR-4)
  airMult: number;
  seaMult: number;
  passableGround: boolean;
  passableSea: boolean;
  detectionMod: number;        // +/- to detection while crossing
}
```

### 3.4 `Requirement` (parsed from CSV "Requirements")
```ts
type Requirement =
  | { kind: 'vehicle'; categoryTag: string }          // 'Vehicle','Fast vehicle + roads'
  | { kind: 'infra'; infra: 'airport'|'port'|'rail' } // 'Airport + tickets','Port access'
  | { kind: 'wealth'; minTier: CostTier }             // 'Wealth + airport'
  | { kind: 'faction'; level: 'member'|'authorization' } // 'Military authorization'
  | { kind: 'power'; powerId: string; minTier: 'Low'|'High' } // 'Flight power (Low)'
  | { kind: 'access'; tag: 'rare'|'special' };        // 'Rare access','Military/special'
```

### 3.5 `TravelPlan` (the computed, persisted in-flight record — diegetic, survives save/time-travel)

```ts
interface TravelPlan {
  squadId: string;
  from: string; to: string;          // sector codes 'LJ5'
  path: string[];                    // resolved sector path (Chebyshev, wrap-aware)
  modeId: string;
  baseGameDays: number;              // §5
  modifiedGameDays: number;          // after terrain/options/complications
  moneyCost: number;                 // §6
  detectionScore: number;            // 0..100 running (§7)
  options: TravelOption[];           // ['rush'|'covert'|'multiStop']
  progress: number;                  // 0..1 (commitment lock, §8.2)
  rolledComplications: string[];     // resolved this trip
  arrivalAltitude?: number;          // Z0..Z6 handoff for flight modes (§9)
  staminaDrainPerDay?: number;       // LSW flight upkeep (§5.4 ruling)
}
```

---

## 4. The 16 travel modes (verbatim from `Travel_Time_System.csv`)

Every number below is the CSV value. `Game_Days_Per_Real_Hour` is **reinterpreted as a speed RANK** (TR-1 above): higher = faster, used to order modes and to derive per-step time (§5.2). `Range_Limit` and `Requirements` are the gates.

| id | Class | Speed_Category | CSV Game_Days/Real_Hr (→ speedRank) | Range_Limit | Requirements |
|---|---|---|---|---|---|
| Walking | ground | Very Slow | 0.5 → 0 | City only | None |
| Vehicle_Standard | ground | Slow | 2 → 2 | Same country | Vehicle |
| Vehicle_Fast | ground | Medium | 4 → 3 | Same continent | Fast vehicle + roads |
| Train | ground | Medium | 3 → 3 | Rail network | Train access |
| Commercial_Flight | air | Fast | 12 → 5 | Global | Airport + tickets (6hr min) |
| Private_Jet | air | Very Fast | 18 → 6 | Global | Wealth + airport |
| Military_Transport | air | Very Fast | 20 → 6 | Faction territory | Military authorization |
| Supersonic | air | Extreme | 30 → 7 | Global | Rare access (expensive) |
| Boat_Small | sea | Very Slow | 1 → 1 | Coastal | Boat |
| Ship_Standard | sea | Slow | 3 → 2 | Global | Port access |
| Ship_Fast | sea | Medium | 6 → 4 | Global | Naval vessel |
| Submarine | sea | Medium | 5 → 4 | Global | Military/special (no detection) |
| Flight_Low (LSW) | lsw | Fast | 15 → 5 | 500 miles | Flight power (Low) |
| Flight_High (LSW) | lsw | Very Fast | 25 → 6 | Global | Flight power (High) |
| Super_Speed_Low (LSW) | lsw | Fast | 10 → 5 | 1000 miles | Super Speed (Low) |
| Super_Speed_High (LSW) | lsw | Extreme | 40 → 7 | Global | Super Speed (High) |
| Teleportation (LSW) | lsw | Instant | Instant | LOS or known location | Teleportation power |
| Time_Travel (LSW) | lsw | Special | Variable | Any time/place | Time Travel power |

> **Note on Teleportation/Time_Travel:** Teleportation is the **save/movement edge case** — it can collapse travel entirely. Time_Travel is **NOT a travel mode in the normal loop**; it is the **diegetic SAVE/LOAD system** (Bible §11) and is excluded from `getTravelOptions()`. It appears here only because it lives in this CSV. See §8.4.

---

## 5. Exact time formula

### 5.1 Inputs
- `path[]` — resolved sectors (Chebyshev + wrap, TR-3).
- `mode` — chosen `TravelMode`.
- `stepClass(mode)` — `air`/`lsw-flight` use the CSV **air** per-step base; `ground`/`lsw-superspeed` use **ground** base; `sea` uses sea base.

### 5.2 Per-step base time (from CSV "SECTOR GRID REFERENCE")
The CSV is explicit:
- `Adjacent_Sectors = 1 day ground travel; 0.5 day air` → **`STEP_GROUND = 1.0` game-day**, **`STEP_AIR = 0.5` game-day** per cardinal sector step.
- `Diagonal_Sectors = 1.4× adjacent time`.
- Sea: no CSV per-step value → **RULING TR-4 below.**

```
stepBase(mode) =
  air  | lsw(Flight_*)        -> 0.5  game-days   // CSV "0.5 day air"
  ground | lsw(Super_Speed_*) -> 1.0  game-days   // CSV "1 day ground"
  sea                         -> 0.75 game-days   // RULING TR-4
```

> **RULING — TR-4 (sea per-step):** The CSV gives sea modes a `Game_Days_Per_Real_Hour` speed between ground and air (Boat 1, Ship_Standard 3, Ship_Fast 6, Sub 5; cf. Vehicle_Standard 2, Commercial 12). Lacking an explicit per-step number, set **`STEP_SEA = 0.75` game-days** (faster than ground's 1.0, slower than air's 0.5), consistent with the CSV's ordering. Sea is further gated by terrain passability (§5.5) — it can only traverse Ocean/Coastal/Lake/River/Islands sectors.

### 5.3 Speed-rank scaling (so faster modes are faster, per CSV ranking)
The 16 modes have different real speeds in the CSV; collapse them to a multiplier on `stepBase` via the **speedRank** (0..7, §4):

```
speedMult(mode) = SPEED_MULT[mode.speedRank]
SPEED_MULT = { 0:2.0, 1:1.6, 2:1.3, 3:1.0, 4:0.8, 5:0.6, 6:0.45, 7:0.3 }
```
> **RULING — TR-3b (speedMult ladder):** The CSV gives ordinal speeds, not a per-sector formula. `SPEED_MULT` is a **monotonic ladder** (rank 3 = 1.0 baseline = "Medium" modes like Vehicle_Fast/Train/Ship_Fast, which the CSV all rates Medium). It is the minimum content needed to make the CSV's speed ordering produce per-sector times. The endpoints are clamped by the distance-band guardrail (§5.4), so this ladder cannot push a trip outside authored CSV bounds. Tunable in data.

### 5.4 Full per-step time
```
perStep(sector, mode) =
   stepBase(mode)
 × speedMult(mode)
 × terrainMult(sector, mode.travelClass)         // §5.5, from TerrainCodes
 × (POLAR.includes(row(sector)) ? 1.5 : 1.0)      // RULING TR-5 (retain globeTravel polar)
 × (isDiagonalStep ? 1.4 : 1.0)                   // CSV Diagonal_Sectors

baseGameDays = Σ perStep(sector, mode) over path
```

> **RULING — TR-5 (retain polar penalty):** `globeTravel.ts` already applies `POLAR_TRAVEL_MULTIPLIER = 1.5` to rows `[1,10]`. Mapped to the 42×24 grid, the **polar rows are the top 2 and bottom 2 row-letters** (A,B and W,X). Keep the ×1.5. This is the only non-CSV multiplier carried over from existing code; it is consistent with `TerrainCodes` Ice/Snow being slow.

### 5.5 Terrain multipliers (from `TerrainCodes.csv` + Bible §6.3)
`terrainMult` keys off the destination-side sector's terrain code. The CSV is just the **name list** (25 codes); the multipliers are a **RULING** consistent with Bible §6.3 ("desert +50% move, jungle +75%, mountains +100%") and the existing `BASE_TERRAIN_RULES` in `travelSystem.ts`.

> **RULING — TR-6 (terrain multipliers):** Strategic terrain cost table, by `TerrainCode`. `ground` uses `groundMult`; `air`/`lsw-flight` ignore terrain except weather (set to 1.0, flying over it) **but** mountains/high-altitude impose air ×1.25 (wind shear, per `Flight_Altitude_System.csv` `Terrain_Mountain +1 movement`); `sea` only traverses water codes.

| Code | Terrain | groundMult | airMult | seaMult | passGround | passSea |
|---|---|---|---|---|---|---|
| 1 | Ocean | — | 1.0 | 1.0 | no | yes |
| 2 | Coastal | 1.25 | 1.0 | 1.0 | yes | yes |
| 3 | Islands | 1.5 | 1.0 | 1.0 | yes | yes |
| 4 | Desert | 1.5 | 1.0 | — | yes | no |
| 5 | Paved Roads | 1.0 | 1.0 | — | yes | no |
| 6 | Plains | 1.0 | 1.0 | — | yes | no |
| 7 | Unpaved Roads | 1.25 | 1.0 | — | yes | no |
| 8 | Grasslands | 1.1 | 1.0 | — | yes | no |
| 9 | Rocky Desert | 1.6 | 1.0 | — | yes | no |
| 10 | Hills | 1.4 | 1.0 | — | yes | no |
| 11 | Swamp | 1.75 | 1.0 | — | yes | no |
| 12 | Snow | 1.5 | 1.0 | — | yes | no |
| 13 | Rain Forest/Jungle | 1.75 | 1.0 | — | yes | no |
| 14 | Mountains | 2.0 | 1.25 | — | yes | no |
| 15 | Light Forest | 1.25 | 1.0 | — | yes | no |
| 16 | Heavy Forest | 1.5 | 1.0 | — | yes | no |
| 17 | Jungle Mountains | 2.25 | 1.25 | — | yes | no |
| 18 | Forested Mountains | 2.0 | 1.25 | — | yes | no |
| 19 | High Altitude Mountains | 2.5 | 1.5 | — | yes | no |
| 20 | Lake | — | 1.0 | 1.0 | no | yes |
| 21 | River | 1.5 | 1.0 | 1.0 | yes | yes |
| 22 | Ice | 1.75 | 1.0 | 1.25 | yes | yes |
| 23 | Farmland | 1.0 | 1.0 | — | yes | no |
| 24 | Wasteland | 1.5 | 1.0 | — | yes | no |
| 25 | Exclusion Zone | 2.0 | 1.0 | — | yes | no |

> Source basis: code names = `TerrainCodes.csv`; multiplier *values* are the existing `travelSystem.ts` `BASE_TERRAIN_RULES` philosophy + Bible §6.3 anchors (desert +50% → 1.5; jungle +75% → 1.75; mountains +100% → 2.0). Where the Bible gives no anchor (swamp, hills, ice) values interpolate on the same scale. **These are the only invented-by-interpolation numbers and are flagged for balance.**

### 5.6 Distance-band guardrail (keeps results inside CSV bounds)
After `baseGameDays` is computed, **clamp** it into the CSV "TRAVEL TIME MATRIX (in Game Days)" range for the trip's distance band, so the engine can never produce a number outside the authored table.

`band = Same_City | Same_Country | Same_Continent | Different_Continent | Global_Opposite`
(derived: Same_City = same sector; Same_Country = sectors share `CountryCode`; Same_Continent = share `CultureCode` region group; else Different_Continent; antipodal (Δ ≥ half grid both axes) = Global_Opposite.)

CSV matrix (game-days), used as `[min, max]` clamp per mode-family × band:

| From_Region | Same_City | Same_Country | Same_Continent | Different_Continent | Global_Opposite |
|---|---|---|---|---|---|
| Ground | 0.5 | 2–5 | N/A | N/A | N/A |
| Commercial_Air | N/A | 1 | 3–5 | 8–15 | 20–30 |
| Private_Air | N/A | 0.5 | 2–3 | 5–10 | 12–18 |
| LSW_Flight_Low | 0 | 0.5 | 1–2 | N/A (range limit) | N/A |
| LSW_Flight_High | 0 | 0 | 0.5 | 1–3 | 3–5 |
| Teleportation | 0 | 0 | 0 (if known) | 0 (if known) | 0 (if known) |

```
modeFamily(mode):  ground modes -> 'Ground'; Commercial_Flight/Military_Transport -> 'Commercial_Air';
                   Private_Jet/Supersonic -> 'Private_Air'; Flight_Low/Super_Speed_Low -> 'LSW_Flight_Low';
                   Flight_High/Super_Speed_High -> 'LSW_Flight_High'; Teleportation -> 'Teleportation';
                   sea modes -> use 'Commercial_Air' band rows as the sea proxy ×1.5 (RULING TR-7)
modifiedGameDays = clamp(baseGameDays, bandMin, bandMax)   // 'N/A' cell => mode illegal for that band (§8.3)
```

> **RULING — TR-7 (sea band proxy):** The CSV matrix has no sea row. Sea trips clamp to the `Commercial_Air` band × 1.5 (sea is ~1.5× slower than air per the speedRank ordering and is the only mode that crosses oceans without a power or airport). Tunable.

### 5.7 Worked example (sanity check against CSV)
Squad in **Lagos (sector e.g. `LJ5`)** travels to a sector on another continent, **Different_Continent** band, by **Commercial_Flight**:
- speedRank 5 → `speedMult = 0.6`; `stepBase(air) = 0.5`.
- Suppose Chebyshev wrap-aware path = 11 cardinal steps, avg `terrainMult` 1.0 (flying), no polar.
- `baseGameDays = 11 × 0.5 × 0.6 × 1.0 = 3.3`.
- Clamp to Commercial_Air × Different_Continent = `[8, 15]` → **`modifiedGameDays = 8`** (clamped up to the authored floor). ✓ inside CSV bounds.
By **Private_Jet** (speedRank 6 → 0.45): `11 × 0.5 × 0.45 = 2.475`, clamp to Private_Air Different_Continent `[5,10]` → **5 days.** ✓ Private jet ≈ faster than commercial, exactly as the CSV intends.

This is why the engine (§5.4) sets the *texture* (terrain, polar, diagonal) and the guardrail (§5.6) sets the *authored bounds* — together they can't drift.

---

## 6. Money cost

`Travel_Time_System.csv` gives **no dollar figures** (only `Cost_Level` text in `Vehicles_Complete.csv`: Low/Medium/High/Very_High/Ultra_High). So money is **RULING**, anchored to the vehicle `Cost_Level` ladder and the player-funding tiers in Bible §10 ($5–15k street … $2M+ cosmic).

> **RULING — TR-8 (travel pricing):** Cost = `perSectorRate(mode) × pathLength × bandSurcharge`. Per-sector base rates (USD), tied to `Cost_Level`:

| Mode family | Cost_Level basis | Per-sector rate | Notes |
|---|---|---|---|
| Walking / owned-vehicle ground | Low | $0 (fuel abstracted) | `Vehicles_Complete` "Fuel_Management ignored by most games" |
| Train | Low | $200 | per CSV Train = rail-network ticketed |
| Commercial_Flight | (tickets) | $1,500 / passenger | CSV "Airport + tickets"; ×squad size |
| Private_Jet | Ultra_High | $25,000 | CSV "expensive; on-demand" |
| Military_Transport | (faction) | $0 cash, costs **faction favor** | members only; bills reputation not money |
| Supersonic | Ultra_High + Rare | $120,000 | CSV "very expensive; limited" |
| Ship_Standard / Ferry | High | $400 / passenger | port access |
| Ship_Fast / Submarine | Ultra_High / Military | $8,000 / $0 (military) | |
| LSW Flight/Super-Speed | — | $0 | the power IS the vehicle |
| Teleportation | — | $0 + **stamina** | §8.4 |

`bandSurcharge`: Same_Country ×1, Same_Continent ×2, Different_Continent ×4, Global_Opposite ×6 (mirrors the CSV matrix spread). **Rush_Travel** (CSV) = ×2 cost for −25% time (commercial only). **Covert_Travel** (CSV) = +50% time for untraceable (detection ≈ 0).

---

## 7. Detection / visibility (spine-consumed — see §10)

Travel is not free of consequence: crossing hostile ground can **expose** the squad (feeds the Surveillance combined-effect, Bible §8). `detectionScore` (0..100) accumulates over the path:

```
detectionScore = clamp( Σ_over_path [
      mode.detectionBase
    + terrain.detectionMod
    + borderControlContribution(sector)        // §10.2, spine
  ] − covertReduction − submarineBonus , 0, 100)
```
- `Submarine` CSV note = "Covert travel; no detection" → `submarineBonus = 100` (forces 0).
- `Covert_Travel` option → `covertReduction = 50` (+50% time, CSV).
- `LSW Flight_High` / `Super_Speed_High` are **fast but loud** (sonic boom — `LSW_Power_Combat_Mechanics.csv` High Flight "Sonic boom", High Super Speed "Sonic boom damage") → `detectionBase = +25`.
- `Teleportation` → `detectionBase = 0` (instantaneous, no transit footprint).

At `detectionScore ≥ 70`, the **Customs_Inspection** and **Political_Checkpoint** complication chances are **doubled** (§8.1), and a **news/intel ping** may fire (writes to the news/investigation systems).

---

## 8. Edge cases & failure modes

### 8.1 Travel complications (resolution, from CSV "TRAVEL COMPLICATIONS")
Rolled **once per trip per applicable complication** at plan-confirm time (deterministic from a trip seed so it survives save/time-travel reloads — Bible §11).

| Complication | Base chance | Trigger gate | Effect (structured) | Prevented/reduced by |
|---|---|---|---|---|
| Weather_Delay | 15% | always | `modifiedGameDays ×1.5` | Weather-control LSW power; indoor/ground route |
| Political_Checkpoint | 10% | hostile territory only | `+2 game-days` **and** `+detectionRisk` (combat-trigger if standing fails) | Diplomatic credentials (faction Home/Ally sector); Covert option |
| Equipment_Failure | 5% | ground/sea modes w/ vehicle | **Stranded** — trip aborts at current sector; must re-plan | Backup vehicle in squad; Repair skill (INT) on a roster member |
| LSW_Encounter | variable by region (= `LSWActivity` stat, §10) | always | rolls an **encounter/mission template** (combat or social) at a mid-path sector | Stealth (low detection); Super_Speed/Teleport (skip the sector) |
| Customs_Inspection | 20% | international (crosses `CountryCode` border) | `25% chance equipment confiscation` of one carried illegal item | Diplomatic immunity (faction); Smuggling (Seaport city bonus, Bible §6.2) |

> `LSW_Encounter` "variable by region" is the **explicit spine hook** — chance = `LSWActivity / 5` % per border crossing (§10.1).

### 8.2 Commitment & abort (CSV "TRAVEL COMMITMENT RULES")
- **Commitment_Lock:** once travel begins it **cannot be interrupted** without an LSW movement power. (A squad with a flier/teleporter/super-speedster may re-route mid-trip; others are locked.)
- **Emergency_Abort:** abort at **−50% progress** (the squad ends up at the path's midpoint sector), **no time refund.**
- **Multi-Stop:** each extra waypoint **+50% base time.**
- **Rush_Travel:** ×2 cost, **−25% time**, *commercial only.*
- **Covert_Travel:** **+50% time**, untraceable (detection→~0).
> These are stored as `TravelOption[]` toggles on the `TravelPlan` and applied before the §5.6 clamp.

### 8.3 Illegal / impossible plans (validation, fail-closed)
Reject a plan (UI shows the reason) when:
- **Range exceeded:** `Flight_Low` beyond 500 mi, `Super_Speed_Low` beyond 1000 mi (CSV `Range_Limit`). 500 mi ≈ **1 sector** (CSV `Grid_Scale ~500 km/square`; 500 mi ≈ 805 km ≈ ~1.6 sectors → **RULING TR-9: Flight_Low = 1 sector cap, Super_Speed_Low = 2 sectors cap**).
- **Requirement unmet:** no vehicle / no airport-in-sector / no faction authorization / no roster member with the power & tier (§3.4).
- **Terrain impassable:** ground mode routed through an Ocean/Lake sector with no land bridge, or sea mode through landlocked sectors (§5.5) → either auto-suggest a mixed-mode multi-stop or reject.
- **Band cell = N/A** in §5.6 matrix (e.g. Ground across Different_Continent) → mode unavailable, surface only legal modes.

### 8.4 Teleportation & Time_Travel (the collapse cases)
- **Teleportation** is legal only to **(a) a sector the squad has previously visited (`known location`)** or **(b) line-of-sight (adjacent sector)** — CSV `Range_Limit`. Cost = **0 money + Concentration/stamina** (`LSW_Power_Combat_Mechanics.csv`: Chrono-Spatial / teleport powers have AP & "may become lost in space-time" drawback). **RULING TR-10:** strategic teleport costs the teleporter **1 "exhaustion" status (1 game-day unavailable for combat after arrival)** to keep it from trivializing the world layer; unknown destinations are simply not selectable.
- **Time_Travel** is **excluded from travel** — it is the **diegetic save/load** (Bible §11), owned by the time-travel/save system doc, not here. `getTravelOptions()` must never return it.

### 8.5 Mixed-power squads
A squad's available modes = **union** of every member's powers/vehicles **∩** infra in the from-sector. But the **whole squad travels together at the slowest qualifying member's constraint** unless every member can fly/teleport. **RULING TR-11:** a flier cannot carry non-fliers on the strategic layer unless a member has a `carry`-tagged power or a multi-passenger flight vehicle (`Vehicles_Complete` Hover_Car/VTOL/Helicopter passenger counts). Otherwise the squad falls back to the fastest **conveyance** mode that fits all members.

### 8.6 Determinism under time-travel reload
All RNG (complication rolls, encounter selection, customs confiscation pick) is seeded from `hash(squadId, from, to, modeId, departGameDay)` so that **reloading a save (time-travel) reproduces the same trip outcome** unless the player changes the plan — preserving the Bible §11 "rewinds are tense, not random save-scum" intent.

---

## 9. Handoff to tactical combat (flight altitude)

This system does **not** own the combat Z-axis (Bible §5.4), but it **sets the arrival state**:

> **RULING — TR-12 (arrival altitude):** When a travel mode is a **flight** mode and the trip ends in a combat trigger (LSW_Encounter, Political_Checkpoint failure), the flying member(s) **enter combat already airborne**:
> - `Flight_Low` / Hover/VTOL vehicles → **arrive at Z1–Z2** (`Flight_Altitude_System.csv` Low/Medium-Low).
> - `Flight_High` / `Super_Speed_High` → **arrive at Z3** (Medium), with the **takeoff/landing −2CS window already paid** (they were already flying).
> - Ground/sea/teleport arrivals → **Z0**.
> - Indoor combat triggers **cap arrival altitude** at the building ceiling (`Building_Flight_Limitations.csv`: `max Z = ceiling_ft ÷ 10`); a forced indoor arrival from a flight mode lands the unit at the capped Z, not above it.
> Non-flying squadmates always arrive at **Z0**. This is the only datum this system writes into the combat layer.

---

## 10. How it consumes the SPINE

Travel reads **country**, **city**, **culture/terrain**, and **faction** stats (Bible §2 spine). Every driver below cites a real column.

### 10.1 LSW_Encounter frequency ← `LSWActivity` (Country.csv col 32)
```
encounterChancePerBorderCrossing% = LSWActivity / 5
```
(CSV `LSW_Encounter` = "Variable by region"; Bible §6.1 "LSW activity sets encounter frequency".) A trip through a high-LSW country (e.g. value 60+) is ~12%+ per crossing; a banned/low country is near-zero. This makes *route choice* meaningful — avoid LSW-hot countries or embrace the encounters.

### 10.2 Detection / checkpoint severity ← **Border Control** combined-effect = `MilitaryBudget + IntelligenceBudget + LawEnforcement` (Country.csv cols 14, 16, 19; Bible §8 "Border control = Military + Intel + Law")
```
borderControlScore(country) = (MilitaryBudget + IntelligenceBudget + LawEnforcement) / 3   // 0..100
borderControlContribution(sector) = borderControlScore(country(sector)) × 0.3               // detection per sector
Political_Checkpoint.chance = base 10% × (1 + borderControlScore/100)  // in hostile territory
Customs_Inspection equipment-confiscation severity ↑ with borderControlScore
```
High-security states (China-like surveillance, Bible §6.1 "Security State") are dangerous to cross covertly; failed/corrupt states are porous.

### 10.3 Visa difficulty / smuggling ← `GovermentCorruption` (col 10), `LawEnforcement` (col 19)
```
// Bible §8 Black market / safe houses use Corruption + (100−Law)
smugglingEase(country) = (GovermentCorruption + (100 − LawEnforcement)) / 2
```
High-corruption / low-law → cheaper **Covert_Travel**, easier customs evasion, illegal-gear transport survives confiscation. Drives whether the Covert option's detection reduction is full or partial.

### 10.4 Air/sea infrastructure ← city `CityType` (Cities.csv cols 9–12) + `GDPNational` (Country.csv col 21)
- **Seaport** city type → unlocks `Ship_*`/`Submarine` embarkation **and** grants the smuggling bonus vs Customs (Bible §6.2 "Seaport = +smuggling/maritime").
- **Airport availability:** `Commercial_Flight`/`Private_Jet` require a sector whose city is large enough — **RULING TR-13:** airport present if `PopulationRating ≥ 30` (Cities.csv col 7) **or** city type ∈ {Political, Company, Industrial}; private-jet additionally requires `GDPNational ≥ 50` in-country (wealth gate, CSV `Private_Jet` "Wealth + airport").
- **Rail (`Train`)** requires `DigitalDevelopment`/infrastructure proxy ≥ 50 (Country.csv col 29) — CSV "Limited to countries with rail."

### 10.5 Faction territory overlay (Bible §6.4)
- **Military_Transport** legal only across the player faction's **Home/Ally** sectors (CSV `Range_Limit = Faction territory`; `Requirements = Military authorization`); costs faction favor, not cash (§6).
- **Home sector** travel: Political_Checkpoint chance → 0 (diplomatic immunity, Bible §6.4 "+legal immunity"); **Hostile** sector: checkpoint chance and detection both ×1.5.

### 10.6 Terrain (TerrainCodes) — §5.5, already spine-consumed via the destination sector's `TerrainSector` code.

### 10.7 Money cost ← player funding tier (Bible §10) gates which modes are *affordable*, and `GDPPerCaptia` (col 22) sets local charter availability for Private_Jet.

> This satisfies Bible §13 ruling #9 ("combined-effects must be CONSUMED"): travel **consumes** Border-Control, Black-Market/Smuggling, Surveillance, and LSW-Affairs combined-effects to set time, money, detection, and encounter rates — not merely compute them.

---

## 11. UI / UX hooks

### 11.1 World-map (primary — `WorldMapGrid.tsx`)
- **Select destination sector → Travel panel** opens (replaces the current bare "Deploy" button).
- **Mode list:** show only *legal* modes (§8.3) with an icon, the **`modifiedGameDays`**, **money cost**, **detection bar (0–100)**, and a **range/requirement chip** if a mode is greyed out (tooltip explains the missing requirement).
- **Path preview:** highlight the resolved `path[]` on the grid; tint sectors by terrain `groundMult`; flag border-crossings (passport icon) and high-`LSWActivity` sectors (hazard glyph).
- **Option toggles:** Rush / Covert / Multi-Stop chips (§8.2) that live-update time/cost/detection.
- **Confirm → commitment lock** banner; an **in-transit squad token** animates along the path; **ETA in game-days** and a live countdown.

### 11.2 Phone / laptop (pauses time — Bible §7)
- Opening the laptop **pauses** the world clock (so the player plans travel without bleeding days).
- **Phone "call a ride":** the dial-a-number motif (Bible §7.5) can summon a **private jet / faction transport** if you have the number/favor — surfaces as a phone contact, not a menu.
- **Email arrival:** complication outcomes (a checkpoint, a customs seizure, an LSW_Encounter) arrive as **email/news** (Bible §7.1–7.2), making travel feed the "living world that talks to you."

### 11.3 Combat overlay (handoff only)
- On a travel-triggered combat, the **briefing screen shows arrival altitude** (Z-level, §9) and a wing/shadow glyph on airborne units (Bible §5.4 "FLIGHT = altitude integer + wing/shadow indicator, NOT 3D").

### 11.4 Accessibility / clarity
- Every number on the panel has a **breakdown tooltip** ("8 days = 3.3 base, clamped to authored 8-day Different-Continent floor"). No hidden math.

---

## 12. Integration points (reads / writes)

| Direction | System | Data |
|---|---|---|
| **reads** | World clock (`TimeDisplay.tsx`, `timeEventGenerator.ts`) | current game-day; advances by `modifiedGameDays` on confirm |
| **reads** | `sectors-populated.ts` / `cities.ts` | sector terrain code, `CountryCode`, `CityType`, `PopulationRating`, HVT |
| **reads** | World Bible `Country.csv` (via `allCountries`) | `LSWActivity`, `MilitaryBudget`, `IntelligenceBudget`, `LawEnforcement`, `GovermentCorruption`, `GDPNational`, `DigitalDevelopment` |
| **reads** | Faction system (`factionSystem.ts`) | Home/Ally/Hostile/Neutral overlay; military-transport authorization & favor |
| **reads** | Squad roster (`squadSystem.ts`) | members' powers (Flight/Super-Speed/Teleport tiers), vehicles, INT (repair), Smuggling |
| **reads** | `Vehicles_Complete` (`vehicleSystem.ts`) | passenger counts, exotic/hover/VTOL flight-capable conveyances |
| **writes** | Squad state (`enhancedGameStore.ts`) | `squadStatus='traveling'`, `currentSector`, `TravelPlan`, progress |
| **writes** | Detection/Surveillance combined-effect (Bible §8) | `detectionScore` → may spawn intel ping |
| **writes** | News/Email (`NewsBrowser.tsx`, email system) | complication outcomes as messages |
| **writes** | Investigation/Mission gen | `LSW_Encounter` → mission/encounter template |
| **writes** | Combat scene (`CombatScene.ts` via `EventBridge.ts`) | `arrivalAltitude` (Z), airborne flags on units |
| **writes** | Economy (`mercenaryPool.ts`/payday) | `moneyCost` debit; faction-favor debit for military transport |

---

## 13. RULING summary (canonical, traceable)

- **TR-1** Clock = 30 game-days/real-day (Bible §6.5/§11); CSV per-mode `Game_Days_Per_Real_Hour` reinterpreted as speed RANK.
- **TR-2** Canonical grid = 42×24 `sectors-populated`; travel = CSV distance bands + per-step engine + band clamp; legacy 20×10 retired (OWNER-FORK OF-1).
- **TR-3 / TR-3b** Chebyshev distance, wrap-aware, diagonal ×1.4 (CSV); `SPEED_MULT` ladder for mode speeds.
- **TR-4** Sea per-step = 0.75 game-days (between ground 1.0 and air 0.5).
- **TR-5** Retain `globeTravel` polar ×1.5 on rows A,B,W,X.
- **TR-6** Terrain multipliers table (names from CSV; values from Bible §6.3 anchors + `travelSystem.ts`).
- **TR-7** Sea band proxy = Commercial_Air band ×1.5.
- **TR-8** Travel pricing ladder (CSV `Cost_Level` → USD; military = faction favor).
- **TR-9** Flight_Low cap = 1 sector; Super_Speed_Low cap = 2 sectors (from 500/1000 mi vs ~500 km/sector).
- **TR-10** Strategic teleport = 0$, +1 game-day arrival exhaustion; known/LOS destinations only.
- **TR-11** Fliers can't carry non-fliers strategically without a `carry` power or passenger flight vehicle.
- **TR-12** Flight-mode arrival altitude handoff (Z1–Z3); indoor ceiling cap.
- **TR-13** Airport gate (`PopulationRating ≥ 30` or city type); rail gate (`DigitalDevelopment ≥ 50`).

---

## 14. OWNER-FORK notes

- **OF-1 — Travel grid abstraction.** Keep the 42×24 populated grid as the single source (this spec's default), OR keep a coarser 20×10 *travel* grid layered over the 42×24 *display/city* grid. The former is simpler and unifies datasets (Bible §13.10); the latter matches the existing `globeTravel.ts` and gives shorter, more readable paths. Product/feel choice.
- **OF-2 — How punishing should travel be?** The CSV complication chances (15% weather, 20% customs) are per-trip; on long campaigns this compounds. Owner decides whether to keep raw CSV rates or scale by trip length / difficulty setting (ties into `104-ai-director-difficulty.md`).
- **OF-3 — Teleport economy.** TR-10 gives teleport a 1-day exhaustion cost. Owner may instead price it in **Time-Walker sanity / power-dampening** to bind it to the §11 save fantasy, or leave it nearly free as a high-tier reward. This directly tunes how much the late-game world layer "collapses."
- **OF-4 — Does the squad split?** TR-11 keeps a squad together. Owner may allow **split travel** (fliers go ahead, ground crew follows) for JA2-style logistics depth, at UI cost.
- **OF-5 — Real money vs abstract upkeep.** TR-8 charges per-trip USD. Owner may fold travel into weekly upkeep/abstract logistics instead of itemized billing.

---

## 15. Open questions

1. **Antipodal/Global_Opposite detection:** does a true around-the-world flight cross *every* intervening country's border for detection, or sample a few? (Perf vs realism.)
2. **Mid-trip world events:** if a country goes to war (`Dynamic_Political_Events`) while a squad is mid-transit through it, does the trip re-roll Political_Checkpoint? (Suggest: yes, at the next un-traversed border, honoring commitment-lock for everything already crossed.)
3. **Vehicle persistence:** does a ground vehicle used for travel *arrive with* the squad as a tactical unit (`Vehicles_Complete` HP/DR), or is it abstracted away on arrival? (Affects combat-layer vehicle spawning.)
4. **Multi-modal auto-routing:** when a single mode can't reach (e.g. ground squad needs to cross an ocean), should the planner auto-compose ground→ship→ground multi-stop, or force the player to chain it manually?
5. **Time-Walker interaction:** can a *future* time-jump (Bible §11) strand a traveling squad? Likely owned by the save/time-travel doc, but the `TravelPlan` must serialize cleanly across a rewind regardless.
