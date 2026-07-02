# 106 — Modding / Data Pipeline & Balancing Tooling

> **System:** Modding / Data Pipeline & Balancing Tooling (the build chain that turns the ~45 source CSVs into typed, validated game data — plus the headless simulator, auto-balancer, and narrative-QA harness that keep them tuned)
> **Status:** BUILD-READY SPEC
> **Spine consumed:** This system does not *play* the spine — it **enforces and validates** it. It reads every spine table (country/city/culture/terrain/faction/personality) to (a) typecheck them on load, (b) feed the headless combat simulator with real country/city/personality modifiers so balance numbers reflect the *spine-modified* outcome, and (c) gate which tuning rows a content author may edit without code review.
> **Bible anchors:** Pillar #1 ("Every system is a data table. New content and rebalancing happen in spreadsheets, not code" — §1.1); §2 (THE SPINE PRINCIPLE — the layering this pipeline must preserve); §3.3 ruling (ship `Universal_Table_FIXED`, retire base table); §13 rulings #1–#10 (every ruling names a *tunable data row* this pipeline owns — e.g. flight stamina drain §5.4, throwing formula §5.8, dataset unification #10); §14 (DATA → MECHANICS MAP — the canonical source-of-truth list this pipeline ingests); §15 (the 4 mechanics gaps the simulator must regression-guard).
>
> **Source tables (read these to re-balance — never hardcode the numbers in code):**
> - `docs/csv-source-data/Auto_Balance_Adjustment.csv` — **authoritative** for the auto-balancer: 11 `Adjustment_Type` rows, each with `CSV_File_Target`, `Column_Target`, `Target_Metric`, `Tolerance_Range`, `Adjustment_Formula`, `Adjustment_Limit`, `Validation_Required`, `Integration_Check`.
> - `docs/csv-source-data/AI_Testing_Framework.csv` — **authoritative** for the simulator harness: 12 test phases (`PHASE_1A`…`PHASE_4C`) with `Simulation_Count`, `Success_Criteria`, `Auto_Adjustment_Rules`, `Statistical_Confidence`; plus the 5 `Balance_Target_*` win-rate goals and the 3 `Simulation_Engine_*` test depths.
> - `docs/csv-source-data/Narrative_Quality_Assessment.csv` — **authoritative** for the narrative-QA gate: the weighted `Quality_Score_Calculation` formula and the `Quality_Threshold_Publication` (85%).
> - `docs/csv-source-data/Data_Export_Tools.csv` — **authoritative** for export/import formats, validation, version-control, and audit-trail features.
> - `docs/csv-source-data/Scenario_Templates.csv` — 20 named simulator scenarios (`SCEN_001`…`SCEN_020`) + 9 `Environment_*` rows the sim runs.
> - `docs/csv-source-data/Character_Builder.csv` — the option/cost table the sim uses to assemble test combatants (Origins, Threat Levels, Powers, Secondary powers).
> - `docs/csv-source-data/CSV_File_Directory.csv` — the **manifest**: every CSV's `File_Purpose`, `Primary_Systems`, `Row_Count`, `Key_Columns`, `Integration_Points`, `Implementation_Priority`. This is the registry the loader iterates.
> - `docs/csv-source-data/Game_Mechanics_Spec/World_Data_Gap_Analysis.csv` — the canonical list of missing-data gaps the validator reports against.
> - `docs/csv-source-data/Game_Mechanics_Spec/Universal_Table_FIXED.csv` — the resolution table the simulator resolves every roll against (and which the pipeline must ship in place of the base table, per §3.3 ruling).
> - `docs/csv-source-data/Game_Mechanics_Spec/Combat_Resolution_Quick_Reference.csv` — the 15-step resolution procedure the headless simulator implements verbatim.
> - `SHT_MECHANICS_BIBLE.md` §14 — the master DATA → MECHANICS MAP that defines which file is the source of truth for each system.
>
> **Existing code this spec formalizes / replaces (read before building):**
> - `MVP/scripts/generate-data.js` — the *current* CSV→JSON generator (uses `papaparse`, outputs to `MVP/src/data/generated/`, wired as `npm run generate-data`). This spec **extends** it into the full validated pipeline; do not start from scratch.
> - `MVP/scripts/validate-countries.js`, `MVP/scripts/validate-sectors.js` — existing ad-hoc validators (regex against the generated `.ts`). Fold their checks into the schema validator (§4).
> - `MVP/scripts/fix-*.js` (12 files: `fix-corrupted-countries*.js`, `fix-nigeria.js`, `fix-invalid-sectors.js`, …) — these exist **because the pipeline has no validation gate today**. Goal: the gate makes them unnecessary; delete on green.
> - `MVP/src/data/balanceAnalysis.ts` + `MVP/scripts/combat-balance-test.js` — the *current* hand-rolled balance harness (mock weapon/armor data, console output). This spec replaces the mock data with real generated data and the console output with the structured report (§6).

---

## 1. Overview & Player Fantasy

This is the only system in SHT with **two audiences**: the **content author** (who edits spreadsheets) and the **player** (who never sees it — but feels it through a balanced, mod-able game).

**The author fantasy (Pillar #1, the law):** *"I open a Google Sheet, change `altitude STA drain` from 1 to 2, paste it back, run one command, and the game is rebalanced — without a programmer, without a recompile of game logic, and without quietly breaking three other systems."* SHT is content-heavy by design (~300 powers, 168 countries, 1,050 cities, ~45 mechanics tables); the whole project only survives if rebalancing and new content happen **in data, not code** (`SHT_MECHANICS_BIBLE.md` §1.1). This system is the machine that makes that promise real and *safe*.

**The player fantasy (downstream):** *"The game is tuned — a Level-2 LSW beats a Level-1 about 70% of the time, every power has a counter, no single build dominates, and the world's stats actually change how hard a city is. And if I'm the modding kind, I can drop in my own roster and the game won't crash."* (Balance targets: `AI_Testing_Framework.csv` `Balance_Target_*` rows; design goal "Chess Depth / Competitive Integrity": `Auto_Balance_Adjustment.csv` `Balance_Philosophy_*` rows.)

The system has **four pillars**, each owned by a named source table:

1. **The Pipeline (build chain).** Ingest the ~45 source CSVs → validate against schemas → typecheck cross-references → emit typed, frozen JSON/TS into `MVP/src/data/generated/`. One command, deterministic, fails loud. (Extends `generate-data.js`; manifest from `CSV_File_Directory.csv`.)
2. **The Headless Simulator.** A no-render combat engine that runs `Scenario_Templates.csv` scenarios thousands of times, resolving on `Universal_Table_FIXED` via the `Combat_Resolution_Quick_Reference` 15-step procedure, **with real spine modifiers applied**, and emits win-rate / combat-length / tactical-decision metrics. (Harness: `AI_Testing_Framework.csv`.)
3. **The Auto-Balancer.** Reads the simulator's metrics, compares them to `Target_Metric` per `Adjustment_Type`, and proposes (never silently commits) data-row edits via the named `Adjustment_Formula`, clamped by `Adjustment_Limit`, then re-validates via `Integration_Check`. (`Auto_Balance_Adjustment.csv`.)
4. **The Narrative-QA Gate.** Scores AI-generated combat/news narratives against the weighted `Quality_Score_Calculation` and blocks any below the `Quality_Threshold_Publication` (85%). (`Narrative_Quality_Assessment.csv`.)

**Non-goals (scope guards):**
- This system does **not** author content — it ingests, validates, simulates, and proposes. A human approves every balance change (§7 ruling R-1; FIST/Bible never license silent self-balancing into a shipped build).
- It does **not** implement the combat rules — it *re-implements them headlessly* from the same source tables the live `CombatScene` uses, so the two must be driven by the *same generated data* (§8 integration; §15 regression guard).
- It does **not** design multiplayer. Per the Bible's MP stub, the pipeline must emit **deterministic, content-hash-stamped** data so two clients (or the time-traveler's "other dimension") can verify they're running identical rules — but no netcode is specified here.
- Combat is **symbolic** (plain grid + glyphs; flight = an altitude integer per §5.4); the simulator therefore needs **no renderer** — it operates purely on grid coordinates + the altitude integer, which is exactly why a fast headless sim is cheap to build.

---

## 2. Data Schema (fields / types)

The pipeline is itself **data-driven**: it does not hardcode which files to load. It reads a **manifest** (derived from `CSV_File_Directory.csv`) and processes each entry.

### 2.1 `SourceTableManifestEntry` (one row per source CSV)

Authoring source: `docs/csv-source-data/CSV_File_Directory.csv` (columns `CSV_File_Name`, `File_Purpose`, `Primary_Systems`, `Row_Count`, `Key_Columns`, `Integration_Points`, `Implementation_Priority`, `Documentation_Status`). The manifest extends each row with build metadata.

```ts
interface SourceTableManifestEntry {
  id: string;                 // stable key, e.g. "universal_table_fixed"
  sourcePath: string;         // repo-relative path to the .csv (resolves emoji filenames literally)
  outputModule: string;       // generated file, e.g. "generated/universalTable.ts"
  schemaId: string;           // -> TableSchema.id (§2.2)
  expectedRowCount: number | null; // from CSV_File_Directory Row_Count; null = variable
  rowCountTolerancePct: number;     // RULING R-7: default 0 (exact). >0 only for variable tables.
  priority: 'Critical' | 'High' | 'Medium' | 'Development'; // from Implementation_Priority
  primarySystems: string[];   // from Primary_Systems (split on '+')
  integrationPoints: string[];// from Integration_Points — drives cross-ref checks (§4.3)
  isTunable: boolean;         // RULING R-5: true => editable by content-author role w/o code review
  contentHashExcluded: boolean; // dev-only tables (sim/QA) excluded from the gameplay content hash (§3.4)
}
```

### 2.2 `TableSchema` (one per logical table — the validation contract)

There is **no single global schema**; each table ships a schema describing its columns. Schemas are authored as TS (checked into `MVP/scripts/pipeline/schemas/`) because they encode types + enums + ranges + cross-refs that CSV cannot express.

```ts
interface ColumnSchema {
  csvHeader: string;          // raw header in the CSV (pre-normalization)
  field: string;              // normalized output field (camelCase)
  type: 'string' | 'int' | 'float' | 'bool' | 'enum' | 'csv-list' | 'formula' | 'cs' | 'ref';
  required: boolean;
  enumValues?: string[];      // for type 'enum' (e.g. LSWRegulations: Banned|Regulated|Legal)
  min?: number; max?: number; // for int/float/cs (range gate, §4.2)
  ref?: { table: string; key: string }; // for type 'ref' (cross-table FK, §4.3)
  unit?: string;              // documentation only (e.g. "CS", "squares", "STA/turn", "$")
  notes?: string;             // cite the Bible section / source row this column traces to
}
interface TableSchema {
  id: string;
  primaryKey: string;         // field that must be unique & non-null
  columns: ColumnSchema[];
  rowInvariants?: RowInvariant[];   // cross-column rules within one row (§4.4)
  tableInvariants?: TableInvariant[]; // whole-table rules (e.g. win-rate monotonicity in a ladder)
}
```

`type: 'cs'` is a first-class type because **Column Shift is the universal currency** (Bible §3.3): every modifier in the game is a ±CS integer, and the validator range-checks them against the auto-balancer's per-row `Adjustment_Limit` (e.g. skill CS bonuses are clamped to ±2 CS/adjustment — `Auto_Balance_Adjustment.csv` `SKILL_IMPACT_VALIDATION`).

`type: 'formula'` columns (e.g. `Adjustment_Formula`, `Damage_Formula`) are validated as **parseable expressions over a whitelisted variable/operator set** (§4.5), never `eval`-ed blindly.

### 2.3 `GeneratedDataBundle` (the pipeline's output)

```ts
interface GeneratedDataBundle {
  buildId: string;            // ISO timestamp + short git sha
  contentHash: string;        // SHA-256 over all gameplay tables (excludes dev tables) — §3.4
  schemaVersion: number;      // bump when any TableSchema changes shape
  tables: Record<string, FrozenTable>; // Object.freeze'd, keyed by manifest id
  manifestDigest: string;     // hash of the manifest used, for reproducibility
}
```

### 2.4 `SimRun` / `BalanceReport` (simulator + auto-balancer output)

```ts
interface SimRun {
  scenarioId: string;         // SCEN_001..SCEN_020 (Scenario_Templates.csv)
  testPhase: string;          // PHASE_1A..PHASE_4C (AI_Testing_Framework.csv)
  simulationCount: number;    // from the phase's Simulation_Count column
  environment: string;        // one of the 9 Environment_* rows
  seed: number;               // RULING R-6: every run is seeded & reproducible
  results: {
    winRateA: number;         // % (Combat_Metric_Win_Rate)
    ci95: [number, number];   // 95% confidence interval (Statistical_Confidence column)
    avgCombatLength: number;  // rounds (Combat_Metric_Combat_Duration; target 3-8)
    avgTacticalDecisions: number; // (Combat_Metric_Tactical_Decisions; target 2-5)
    avgPropertyDamage: number;    // $ (Test_Result_Property_Damage)
    civilianCasualties: number;   // (Test_Result_Civilian_Impact)
  };
}
interface BalanceProposal {        // never auto-applied (R-1)
  adjustmentType: string;          // Auto_Balance_Adjustment.csv row id
  targetFile: string; targetColumn: string; targetRowKey: string;
  currentValue: number; proposedValue: number;
  formulaUsed: string;             // the literal Adjustment_Formula
  clampedByLimit: boolean;         // true if Adjustment_Limit bound the change
  integrationChecksRun: string[];  // from Integration_Check
  cascadeRetestsPassed: boolean;   // Adjustment_Validation_Cascade
}
```

---

## 3. The Pipeline (exact behavior)

### 3.1 Command surface (deterministic, one command per job)

Extends `MVP/package.json` scripts (currently only `generate-data`):

| Command | Job | Exit code contract |
|---|---|---|
| `npm run data:validate` | Validate all source CSVs against schemas; **no output written**. | 0 = clean; 1 = any `error`; 2 = `warning`-only (CI may treat as pass) |
| `npm run data:generate` | Validate **then** emit `GeneratedDataBundle` to `src/data/generated/`. Refuses to write if validate ≠ 0. | 0 = bundle written; 1 = aborted on validation |
| `npm run sim -- --phase PHASE_1A` | Run one test phase headlessly; write `SimRun[]` report. | 0 = ran; 1 = sim crash / impossible result (Edge_Case_Detection) |
| `npm run balance:propose` | Run all phases, diff vs targets, emit `BalanceProposal[]` (a *patch file*, never applied). | 0 always (proposals are advisory) |
| `npm run narrative:qa` | Score a batch of narratives; fail if any < threshold. | 0 = all ≥85%; 1 = any below (regenerated set listed) |

> **RULING R-2 (fail-loud, fail-closed):** `data:generate` MUST refuse to emit a bundle if validation produced any `error`-severity finding. The reason the 12 `fix-*.js` scripts exist today is that the current `generate-data.js` writes whatever it parses. The gate ends that class of bug.

### 3.2 Ingest & normalization (formalizes existing `generate-data.js`)

1. Read `SourceTableManifestEntry[]`.
2. For each entry, parse the CSV with `papaparse` (already a dependency), `header: true`, `skipEmptyLines: true`. **Header normalization** matches the existing generator: `trim().toLowerCase().replace(/\s+/g,'_')` — but the schema's `csvHeader` is matched **case-insensitively against the raw header** so authors can keep human-readable headers.
3. **Emoji-filename handling (real, per Bible §14 / repo):** several source files have emoji in the path (`Combat Compendium REAL - 🪓BAMPI🔫.csv`). The manifest stores the literal path; the loader does a raw `fs.readFileSync` (no shell glob), so emoji are non-issues. (Glob discovery for *new* files is a `data:scan` helper that lists CSVs not yet in the manifest and warns.)
4. **Skip metadata rows.** Many source CSVs carry a second "description" header row (e.g. the Country CSV's row 2 is `Unique # for each country…`). RULING R-3: a row whose primary-key cell matches `/^(unique|formula|note:|---)/i` or is empty is treated as a **comment row** and dropped before validation.

### 3.3 The `Universal_Table_FIXED` special case (§3.3 ruling, enforced)

The pipeline MUST emit `Universal_Table_FIXED` as the resolution table and **refuse to emit the base `Universal_Table`** (`tableInvariant`: manifest may not contain both with `outputModule` colliding). This bakes Bible ruling #1 into the build, not into reviewer vigilance. The CSV's leading `Value_Range` row and the two `---…---` / `Note:` rows are comment rows (R-3). Output shape: `roll (1-100) → { [rankColumn]: 'Failed'|'Minor'|'Success'|'Major' }`.

### 3.4 Content hashing (the multiplayer-stub hook)

After generation, compute `contentHash = SHA256(canonical-json of all tables where contentHashExcluded=false)`. Dev-only tables (`AI_Testing_Framework`, `Auto_Balance_Adjustment`, `Narrative_Quality_Assessment`, `Scenario_Templates`, `Character_Builder`) are **excluded** — they tune the build but are not gameplay rules a peer needs to match. This single hash is what a future MP layer (the time-traveler's other dimension) compares to confirm two clients run identical rules. No netcode here — just the deterministic stamp it will need.

---

## 4. Validation (the safety gate — exact checks)

Every finding has `severity: 'error' | 'warning' | 'info'`, a `tableId`, a `rowKey`, a `column`, and a `message`. Errors block `data:generate` (R-2).

### 4.1 Structural

- Header set matches schema (missing required header = `error`; unknown extra header = `warning`).
- `expectedRowCount`: row count must equal manifest `expectedRowCount` within `rowCountTolerancePct` (R-7: default exact). E.g. `Universal_Table_FIXED` covers rolls 01–00 (100 data rows after comment-row strip); `Player_Scaling` = 6 tiers; `Scenario_Templates` = 20 scenarios + 9 environments. Mismatch = `error` (this catches truncated paste-backs — the #1 author mistake).
- Primary key unique & non-null (`error`).

### 4.2 Type & range

- `int`/`float`/`cs`: parseable number, within `[min,max]`. Out-of-range = `error`.
- `enum`: value ∈ `enumValues`. The known-good enums to encode (from the Country CSV header + Bible §6.1): `LSWRegulations ∈ {Banned, Regulated, Legal}`, `Vigilantism ∈ {Banned, Regulated, Legal}`, `Cloning` (capability rating), `GovernmentStructureType` (closed set). **This single check would have prevented the entire `fix-corrupted-countries*.js` family** — those scripts exist to repair numeric values that leaked into string/enum fields (see `validate-countries.js`: it greps for `lswRegulations:"<digits>"`). Encode those exact checks as schema enums.
- `bool`: ∈ {true,false,yes,no,1,0} (normalized).
- `csv-list`: splits on `;` or `,` per the source convention (e.g. `Primary_Systems` uses `+`, `Key_Columns` uses `;`); each element non-empty.

### 4.3 Cross-reference (the spine integrity check)

`type: 'ref'` columns must resolve to an existing primary key in the referenced table. Drive this from `Integration_Points` in `CSV_File_Directory.csv`. Concretely:
- Every `Cities.CountryCode` must exist in `Country.Country Code` (this is Bible ruling #10: unify on `allCountries`+`allCities`, ISO-linked — the validator **enforces** the linkage).
- Every `Cities.CultureCode` ∈ the 14 culture regions (`Culture_Region_Effects`).
- Every `Scenario_Templates.Environment` ∈ the 9 `Environment_*` rows.
- Every `Auto_Balance_Adjustment.CSV_File_Target` must name a real manifest file, and its `Column_Target` must be a real column in that file's schema. **A balance row pointing at a non-existent column is an `error`** — this is what makes the auto-balancer safe to run.
- Every `City.CityType{1..4}` ∈ the 10 city types (`City_Type_Effects`).

Dangling ref = `error`. Orphan target (a country with zero cities) = `warning`.

### 4.4 Row invariants (cross-column, one row)

Examples to encode (each cites its ruling):
- `Auto_Balance_Adjustment`: `|proposed adjustment| ≤ Adjustment_Limit` is enforced at *runtime* by the balancer, but the **limit itself** must parse (e.g. `±2 CS per adjustment`, `±50% per adjustment`) — invariant: `Adjustment_Limit` matches `/^±\d+(\.\d+)?\s*(CS|%|squares|.*)\s*(per adjustment)?$/`.
- `Player_Scaling`: `Threat_Level_Cap` must be ≤ the next tier's cap (monotonic ladder) and team size ranges must not overlap-gap.
- `Universal_Table_FIXED`: within a single roll row, outcomes may only *improve* left→right across rank columns (Feeble→Class_1000 is monotonic non-decreasing in outcome severity) — guards against a paste error flipping a cell.

### 4.5 Formula columns (parse, don't `eval`)

`Adjustment_Formula` / `Damage_Formula` cells are parsed into an AST over a **whitelisted grammar**: identifiers (must be known variables, e.g. `Current_Value`, `Target_Win_Rate`, `Actual_Win_Rate`, `STR_rank_value`, `Weight`), numeric literals, `+ - * / ^`, `clamp(a,b,c)`, `min/max`, parentheses. Unknown identifier or operator = `error`. This lets authors edit formulas in the sheet (Pillar #1) while guaranteeing the engine can execute them safely and deterministically. The canonical throwing formula (Bible §5.8, ruling #3) — `Range_sq = clamp(STR_rank_value − Weight/50, 1, STR/10)` — is exactly such a parseable cell.

### 4.6 Gap reporting

`data:validate --gaps` cross-checks the manifest against `World_Data_Gap_Analysis.csv` and prints which `Critical`/`High` gaps are still unfilled (e.g. "Country_Faction_Territory: no formal territory ownership"). This keeps the §15 mechanics-gap list honest and visible.

---

## 5. The Headless Simulator (exact behavior)

### 5.1 What it is

A renderer-free re-implementation of the combat loop that the live `CombatScene` runs, driven by the **same generated bundle**. Because combat is symbolic (grid + glyphs; flight = an altitude integer §5.4), the sim needs only: grid coordinates, the altitude integer per unit, the 7 primary stats, equipped weapon/armor rows, powers (with their BAMPI descriptor, §5.12), and the active environment/spine modifiers. No graphics, no sound.

### 5.2 Resolution (verbatim from `Combat_Resolution_Quick_Reference.csv`)

The sim implements the 15 steps literally: initiative `(AGL+INS)/2` → attack column (MEL/AGL/CON) → apply ±CS → roll d100 → look up `Universal_Table_FIXED` → multiplier (Failed 0× / Minor 0.5× / Success 1× / Major 1.5×) → base damage (weapon + STR/power) → dodge column shift → armor DR → apply → knockback (STR rank → squares) → crit/injury on Major. Every constant traces to that table; the sim invents nothing.

### 5.3 Spine modifiers are applied (this is the differentiator)

Per `AI_Testing_Framework.csv` `Narrative_Integration_*` and `Tactical_Variety_*` goals and the Bible spine, the sim does **not** test combatants in a vacuum. Each `SimRun` carries a `country`+`city`+`environment` context, and the sim applies the same ±CS the live game would: city-type / culture / terrain / faction-territory modifiers (Bible §6). This is why the auto-balancer can claim a number is balanced *in the world*, not just on a blank grid. (E.g. PHASE_2C "Environmental_Factor_Testing" runs the same fight across the 9 environments and expects 5–20% tactical variety.)

### 5.4 Test depths & phases

- Depths (`AI_Testing_Framework.csv` `Simulation_Engine_*`): **Speed** = 100 sims (dev iteration), **Standard** = 1,000 (default), **Deep** = 10,000 (release gate).
- Phases (`PHASE_1A`…`PHASE_4C`) define scope, `Simulation_Count`, `Success_Criteria`, and `Statistical_Confidence` (85–95% CI). The sim runs each phase's matched scenarios from `Scenario_Templates.csv` (e.g. PHASE_1A "Threat_Level_Scaling" ↔ SCEN_003).
- **Combatant assembly** uses `Character_Builder.csv`: pick Origin + Threat Level + Power(s) by `Option_Code`, apply the row's `Stat_Effects`/`Combat_Modifiers`, sum `Cost_Points` for parity checks. The sim never hardcodes a test build — it composes from that table.

### 5.5 Metrics emitted (the balance contract)

Per `AI_Testing_Framework.csv` `Combat_Metric_*` and `Auto_Balance_Adjustment.csv` `Test_Result_*`:
- **Win rate** + 95% CI (primary metric).
- **Combat length** (target **3–8 rounds**; `Test_Result_Combat_Length`).
- **Tactical decisions** (target **2–5 meaningful choice points**; `Test_Result_Tactical_Decisions`).
- **Property damage** ($, exponential with threat; `Test_Result_Property_Damage`) and **civilian casualties** (`Test_Result_Civilian_Impact`) — these feed the narrative-QA realism check and `Public_Perception` calibration.

---

## 6. The Auto-Balancer (exact behavior, advisory-only)

For each of the 11 `Adjustment_Type` rows in `Auto_Balance_Adjustment.csv`:

1. Read the row's `Target_Metric` and `Tolerance_Range` (e.g. `THREAT_SCALING`: 70% win for 1-level diff, ±5%).
2. Compare to the matched `SimRun` metric.
3. If outside tolerance, compute `proposedValue` via the **literal `Adjustment_Formula`** (parsed per §4.5). Worked examples straight from the table:
   - `THREAT_SCALING`: `New_Value = Current_Value × (Target_Win_Rate / Actual_Win_Rate)^0.3`.
   - `POWER_BALANCE_SAME_LEVEL`: `New_Bonus = Current_Bonus + ((50 − Actual_Win_Rate) / 10)`, clamped `±3 CS`.
   - `SKILL_IMPACT_VALIDATION`: `New_CS = Current_CS + ((Target_Advantage − Actual_Advantage) / 5)`, clamped `±2 CS`.
4. **Clamp** to the row's `Adjustment_Limit`; set `clampedByLimit`.
5. Run the row's `Integration_Check` and the global `Adjustment_Validation_Cascade` (re-run *related* phases after the proposed edit on a scratch bundle). If a cascade fails, mark `cascadeRetestsPassed=false` and **down-rank** the proposal (do not drop it — surface it for human judgment).
6. Emit a **`BalanceProposal` patch file** (`reports/balance-proposals/<buildId>.json`) — a diff against the source CSV, plus a human-readable summary. **It is never written back to the CSV automatically.**

> **RULING R-1 (human-in-the-loop):** Auto-balance **proposes**, a person **disposes**. `Auto_Balance_Adjustment.csv` itself demands `Validation_Required: Re-test after adjustment` on every row and an `Adjustment_Validation_Cascade` / `Convergence` discipline; nothing in the data licenses an unattended write to a shipped balance table. The balancer's output is a reviewable patch, applied by `npm run balance:apply -- <proposalId>` only after a human opts in. (This also keeps the content hash, §3.4, changing only on intentional edits.)

**Convergence guard** (`Adjustment_Validation_Convergence`): the balancer tracks proposal frequency across runs; if a row oscillates (proposes up then down then up across 3 runs), it flags **non-convergence** and stops proposing for that row, surfacing it as "needs design decision" rather than thrashing.

---

## 7. The Narrative-QA Gate (exact behavior)

For each candidate narrative (combat report / news article generated from world-state + a mission):

`Quality = Country_Integration×25% + City_Integration×20% + Faction_Integration×20% + Cultural_Authenticity×15% + Media_Style_Authenticity×10% + Consequence_Realism×10%` (verbatim `Narrative_Quality_Assessment.csv` `Quality_Score_Calculation`).

Each component is scored by checking the narrative includes the expected spine tokens (e.g. Country_Integration ≥80% requires the relevant country wealth/education/politics elements appear; `Assessment_Country_*` rows define what counts). `narrative:qa` **rejects and regenerates** any narrative `< 85%` (`Quality_Threshold_Publication`) and tracks `Narrative_Variety_Tracking` (target `<10%` similarity across same-scenario generations) so reports don't read as boilerplate. Cultural-sensitivity validation (`Cultural_Sensitivity_Validation`, 100% respectful) is a **hard block**, not a score.

> This gate is the QA arm of "a living world that talks to you" — it guarantees the phone/news copy that *is* the game's voice stays grounded in the actual country/city/faction the event happened in.

---

## 8. How It Consumes the SPINE (which stats drive it, with the formula)

This system's relationship to the spine is **enforcement + simulation**, expressed as concrete couplings:

| Spine input | How this system consumes it | Source |
|---|---|---|
| **Country stats** (35 cols: Corruption, Military, Intel, GDP, Healthcare, Science, MediaFreedom, LawEnforcement, Cloning, LSWActivity, LSWRegulations, Vigilantism, …) | (a) Schema-validated on load — enums/ranges gate them (§4.2); (b) **fed into every `SimRun`** so balance numbers reflect spine-modified ±CS (§5.3); (c) cross-ref'd: every `City.CountryCode` must resolve (§4.3, ruling #10). | World Bible `Country.csv`; `Country_Attribute_Effects`; §6.1 |
| **City stats** (CityType1-4, CrimeIndex, PopulationRating, CultureCode, HVT) | City-type/crime ±CS applied in sim context; `CityType{1..4}` and `CultureCode` cross-ref-validated against the 10 types / 14 cultures. | World Bible `Cities.csv`; `City_Type_Effects`; §6.2 |
| **Culture (14) + Terrain (25)** | Drive the 9 `Environment_*` rows the sim iterates for PHASE_2C tactical-variety testing; mismatched culture/terrain codes = validation `error`. | `Culture_Region_Effects`, `TerrainCodes`; §6.3 |
| **Faction territory + relations** | Home/Ally/Hostile/Neutral ±CS applied in faction-vs-faction sims (SCEN_018, PHASE_4? faction integration); narrative-QA Faction_Integration (20% weight) checks the report names the political context. | `Faction_Specification`, `Faction_Relationships_Complete`; §6.4 |
| **Personality (20 types)** | The sim drives AI target selection from the personality→target-preference map so simulated combat behaves like real combat (a balance number for "bully build" must reflect that it focuses the weak). | `PERSONALITY TARGET SELECTION`; §5.10 |
| **Player_Scaling tiers** | The balance targets are *tier-aware*: a Street-tier fight (≤L1) and a Cosmic fight (L5) have different `Combat_Metric_Consequence_Scaling` expectations; the sim tags each run with the tier so the auto-balancer compares against the right `Balance_Target_*` band. | `Player_Scaling`; §10 |

**The key formula this system owns:** the validator clamps every editable ±CS/numeric cell to the auto-balancer's per-row `Adjustment_Limit`, so the spine can be re-tuned in spreadsheets *within guardrails*: `editableValue ∈ [current − Adjustment_Limit, current + Adjustment_Limit]` per the matching `Auto_Balance_Adjustment` row. That is the precise mechanism by which "rebalancing happens in spreadsheets, not code" stays safe.

---

## 9. Edge Cases & Failure Modes

| Case | Behavior |
|---|---|
| **Truncated paste-back** (author copies only some rows) | Row-count check (§4.1) fails `data:generate` with the expected vs actual count and the table id. (This is the most common author error.) |
| **Numeric leaks into enum/string field** (the `fix-corrupted-countries` bug) | Enum/type check (§4.2) fails with the exact row+column. No silent generation. |
| **Dangling cross-ref** (city in a deleted country; balance row targets a renamed column) | `error`, names both sides of the broken link (§4.3). |
| **Both `Universal_Table` and `Universal_Table_FIXED` present** | `tableInvariant` error — pipeline refuses (§3.3, ruling #1). |
| **Formula cell with unknown variable/operator** | Parse error names the bad token (§4.5); never `eval`-ed. |
| **Sim produces an impossible result** (e.g. negative HP overflow, 0% and 100% on the same matchup) | `Edge_Case_Detection` flags it, the run exits 1, and the matchup is quarantined for manual review (`AI_Testing_Framework.csv` `Edge_Case_Detection`). |
| **Auto-balancer oscillation / non-convergence** | Convergence guard (§6) stops proposing for that row, flags "needs design decision." Prevents thrashing the content hash. |
| **Cosmic-gap matchup** (L5 vs Alpha) | Expected ≥99% win is **correct, not a bug** (`Balance_Target_Four_Plus_Higher`). The balancer must *not* try to "fix" it toward 50%; the target band itself encodes the intended blowout. |
| **Cascade failure on a proposed edit** | Proposal kept but down-ranked with `cascadeRetestsPassed=false`; never auto-applied (§6, R-1). |
| **New CSV added but not in manifest** | `data:scan` warns; it is **not** auto-ingested (an unmanifested table has no schema, so it can't be validated → must not ship). |
| **Narrative below 85% / fails cultural-sensitivity** | Regenerated (score) or hard-blocked (sensitivity) before reaching the player (§7). |
| **Content-hash mismatch between two builds** | Surfaced for the (future) MP layer; single-player ignores it. No crash. |
| **Modder ships a roster the sim has never balanced** | Game still loads (validation passes = playable); a `data:validate --gaps` warning notes it's unbalanced. Modding is supported; *balance guarantees* are not promised for un-simulated content (OWNER-FORK F-3). |

---

## 10. UI/UX Hooks

This system is **mostly tooling**, but it surfaces in four places:

1. **CLI / CI (author-facing, primary).** All five `npm run` commands print human-readable, color-coded findings (severity, table, row, column, message) and write machine-readable JSON reports to `reports/`. CI runs `data:validate` on every PR touching `docs/csv-source-data/**` and blocks merge on `error`.
2. **In-game Dev Panel (F2, exists today per CLAUDE.md).** Add a **"Data / Balance"** tab showing: current `buildId` + `contentHash`, last validation status, and a read-only table browser of the generated bundle. This is how a designer confirms the running build matches the sheets. (Symbolic, plain — matches the game's aesthetic; no purple.)
3. **Balance Report viewer (laptop layer, optional).** The `BalanceReport`/`BalanceProposal` JSON renders as a sortable table (win-rate vs target, proposed deltas, clamp flags) — reusable by the existing `balanceAnalysis.ts` surface. Lives in the laptop's dev/console app, never on the player's phone.
4. **Combat overlay (debug only).** When a debug flag is set, the symbolic combat grid can echo the *exact* ±CS stack the sim/engine computed for a hit (attack column, each modifier, final column, roll, band) — the same trace the simulator logs — so a designer can confirm live combat and headless sim agree. Off by default; never shown to players.

The system **never** surfaces on the player's phone/world-map during normal play. The player feels it only as "the game is balanced and mod-able."

---

## 11. Integration Points (reads / writes)

**Reads (source of truth — never mutates):** all ~45 tables in `SHT_MECHANICS_BIBLE.md` §14, via the manifest. Notably `Universal_Table_FIXED`, `Combat_Resolution_Quick_Reference`, `Scenario_Templates`, `Character_Builder`, the spine tables (Country/Cities/Culture/Terrain/Faction), `Player_Scaling`, `Public_Perception`.

**Writes (generated artifacts only):**
- `MVP/src/data/generated/*` — the typed bundle every other system imports. (This is the contract: **no game system reads a raw CSV at runtime**; they read the generated bundle. That is what keeps the live game and the headless sim provably in sync — §15 regression guard.)
- `reports/sim/*`, `reports/balance-proposals/*`, `reports/narrative-qa/*` — advisory outputs.
- `MVP/docs/CHANGELOG-data.md` — audit trail (`Data_Export_Tools.csv` `Professional_Feature_Audit_Trail`): who changed which table, when, old→new, and the resulting `contentHash`.

**Consumed by (downstream):**
- **Combat (`CombatScene`)** — imports the generated weapon/armor/power/universal-table data; the sim must resolve identically (§15).
- **Spine / mission-gen / pricing / difficulty** — consume the validated country/city tables (Bible ruling #9: combined-effects must be *consumed*; this pipeline guarantees the data they consume is well-formed).
- **News / narrative system** — its output passes through the Narrative-QA gate (§7) before reaching the player's phone.
- **Export/Import (`Data_Export_Tools.csv`)** — character/scenario/balance JSON+CSV export for sharing/modding; **Import_Validation** runs the same schema validator on incoming modded data (mod safety = the validator, reused).

**Export/Import formats (from `Data_Export_Tools.csv`, scoped to MVP):** ship `Character_Export` (JSON/CSV), `Combat_Results_Export` (JSON/CSV), `Balance_Analysis_Export` (JSON), `System_Configuration_Export` (JSON = the whole bundle for backup/version-control), and `Import_Character`/`Import_Combat_Scenario`/`Import_Balance_Data` (each gated by `Import_Validation`). PDF/Excel/cloud/encryption/RBAC rows in that table are **post-MVP** (OWNER-FORK F-4).

---

## 12. RULING: notes (where the data didn't settle, resolved per the Bible)

- **R-1 — Auto-balance is advisory, never auto-apply.** `Auto_Balance_Adjustment.csv` describes formulas + limits but also mandates `Validation_Required` + cascade re-tests on every row; nothing licenses an unattended write. Output is a reviewable patch; a human runs `balance:apply`. Keeps Pillar #1 ("rebalance in spreadsheets") *and* keeps a human accountable.
- **R-2 — Fail-closed generation.** `data:generate` aborts on any `error`. Justified by the existence of 12 `fix-*.js` repair scripts caused by today's no-gate generator.
- **R-3 — Comment-row stripping.** Rows whose PK matches `/^(unique|formula|note:|---)/i` or is empty are dropped pre-validation (the source CSVs ship description/formula/divider rows). Documented, deterministic.
- **R-4 — Generated bundle is the only runtime data source.** No system reads raw CSV at runtime; all read `src/data/generated/`. This is the mechanism that keeps the live engine and the headless sim provably equivalent (§15) and that the content hash (§3.4) can stamp.
- **R-5 — `isTunable` flag gates author edits.** Tunable rows (the ±CS / numeric balance levers — e.g. flight STA drain §5.4, throwing scale §5.8, skill CS bonuses) may be edited by the content-author role and merged on green CI; structural changes (adding columns, changing schemas) require code review. Encodes "data not code" with a safety boundary.
- **R-6 — Every sim run is seeded & reproducible.** Required for the auto-balancer's cascade re-tests to be meaningful and for CI determinism.
- **R-7 — Row-count tolerance defaults to exact (0%).** Catches truncated paste-backs. Variable tables opt into a tolerance explicitly in the manifest.
- **R-8 — Dataset unification is enforced by the cross-ref check, not just documented.** Bible ruling #10 says "unify on `allCountries`+`allCities`"; this pipeline makes the city→country FK a hard validation error, so the legacy 43-row `worldData` set cannot silently re-enter. The pipeline emits exactly one canonical country table and one city table.

## 13. OWNER-FORK: notes (genuine product choices only the owner can make)

- **F-1 — Source-of-truth workflow: Sheets-first vs Git-CSV-first.** Do authors edit in Google Sheets and export to the repo CSVs, or edit the repo CSVs directly (with the sheet as a view)? This decides whether the pipeline needs a Sheets pull step + an authoritative-direction rule for merge conflicts. (Pillar #1 demands spreadsheets, but *which* spreadsheet is canonical is a process choice.)
- **F-2 — Should auto-balance ever be allowed to write unattended in a dev/nightly context** (behind a flag, never in a release build), or is it *always* human-gated even in nightly CI? R-1 chooses always-gated as the safe default; the owner may want a faster nightly loop.
- **F-3 — Modding contract & support tier.** Do we officially support player mods (publish the schemas + import validator as a public modding SDK), tolerate them (load if valid, no guarantees), or lock them down? This sets how much of `Data_Export_Tools.csv` (cloud sharing, RBAC, encryption, app-store template publishing) we build. It also interacts with the MP stub (modded content + the time-traveler's other dimension = whose rules win?).
- **F-4 — Export-format scope for MVP.** Ship only JSON/CSV (engineering/backup) now, or invest in the PDF/Excel/HTML "professional report" tier from `Data_Export_Tools.csv` for stakeholder/designer-facing balance reports? Pure scope/priority call.
- **F-5 — Balance philosophy dial.** `Auto_Balance_Adjustment.csv` encodes a "Chess Depth + Competitive Integrity + every build viable" philosophy with specific win-rate targets (50/70/85/95/99 across threat gaps). If SHT wants a more *power-fantasy* feel (deliberately lopsided high-tier blowouts as a reward), the owner must restate those target bands — the tooling will faithfully balance toward whatever targets are set, so the targets are a design statement, not a given.

## 14. Open Questions

1. **Sim fidelity vs the live engine.** Is the headless sim a *second implementation* (risk: drift) or does it import the *same* resolution module the `CombatScene` uses (preferred, but requires extracting combat math out of the Phaser scene)? §15 regression guard assumes the latter is the goal; confirm the refactor is in scope.
2. **Which spine modifiers are in scope for v1 of the sim?** Full country+city+culture+terrain+faction ±CS is the target, but a v1 could ship with country+city only and add the rest behind the gap report. Owner/lead to scope.
3. **CI budget.** Deep tests are 10,000 sims/matchup × dozens of matchups. Run Deep only on release tags, Standard (1,000) on PRs, Speed (100) locally? (Proposed default in §5.4 — confirm CI minutes are acceptable.)
4. **Narrative-QA scorer implementation.** Token-presence heuristics (cheap, deterministic, specified here) vs an LLM-judge (richer, non-deterministic, cost). `Narrative_Quality_Assessment.csv` implies the former for the gate; the latter is an OWNER-FORK-adjacent upgrade.
5. **Versioning the schema.** When a `TableSchema` changes shape, do we migrate old saves/exports automatically (`Import_Migration` in `Data_Export_Tools.csv`) or require re-export? Matters once players have saved/modded data.

---

*This spec keeps SHT honest to its first pillar: the game is a stack of data tables, and this is the machine that lets those tables be edited safely, simulated rigorously, and balanced deliberately — without a programmer in the loop for content, but never without a human in the loop for balance.*
