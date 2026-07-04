# Character Stat Integration Ledger (pre-combat)

> Reconciles the owner's character-stat spec against the code, from 5 parallel
> audits, **before combat implementation begins**. Combat is the next task and it
> reads the stat model directly — so the model must be locked first. This ledger
> is decisive: it names the 2–3 calls the spec forces, then goes cluster-by-cluster
> (KEEP / CHANGE / ADD / TRASH-or-DEFER / FLAGS), and ends with a safe BUILD ORDER.
>
> Legend: **KEEP** = correct, do not touch · **CHANGE** = existing code must move ·
> **ADD** = net-new module/field · **TRASH/DEFER** = don't build now · **FLAGS** = open call + recommendation.

---

## Decisions forced by the spec

Three calls block everything downstream. Recommendations are the safe path.

### 1. CON → Psionic (the 7th stat identity)
The spec names the 7th stat **PSIONIC**; the code calls it **CON** and uses it as
*Concentration* — morale/will support, tech/medical role domains (`characterRoles.ts:34,36`),
karma (`characterSheet.ts:404`). That is a **semantic mismatch**, not just a label.
**Recommendation — alias, don't rename.** Add `PSI` as an alias/getter onto the `CharacterStats`
interface (`types.ts:230-238`) pointing at the `CON` field; surface **PSIONIC** in UI labels;
keep internal code referencing `CON`. Smallest blast radius, backward-compatible across all
~29 `.CON` consumers, and lets the label track the spec while the semantics stay stable. Full
CON→PSIONIC rename and any Psionic-*power* wiring is deferred to the combat/power pass.

### 2. Stat range: 0–100 → 1–5000 rank-scale retune (human vs LSW bands)
Spec range is **1–5000** with hard tiers: **1–39 Human**, 40–49 Low Superhuman, 50–74 Superhuman,
75–99 High Superhuman, 100–149 Low Cosmic, 150–999 Cosmic, 1000+ Beyond. Current generation
(`characterGeneration.ts:266-280`) rolls **25–130** and does not respect the Human/Superhuman
boundary: skilled humans (origins 1/9) must land **inside 1–39**, LSW origins (2–8) must land **40+**.
**Recommendation — retarget generation to the spec range now (not a display-only view layer).**
Origin 1/9 threat-scaled into 1–39; LSW origins into 40–150 (higher tiers reserved for authored/cosmic).
This forces a **normalization layer** for every derived-stat and combat formula that assumed 0–100
(combat math `combatResolution.ts:121-148`; HP `tournament.ts:54`; detective rank `enhancedGameStore.ts:3745`;
signing cost `characterGeneration.ts:1071-1082`). A view-only map just delays the reckoning — commit to
the spec range while it is riskless (read-only phase, before combat consumes it).

### 3. Health formula — CONFIRMED, no change
`health = MEL + AGL + STA + STR` (`characterSheet.ts:398`) **matches the spec** and overrides the
old `STA*2 + STR` rule. Combat already reads `char.health.current/maximum` (`CombatScene.ts:2577,2640`).
**This is settled — do not touch it.** It is listed here only to close the question so no later pass reopens it.

---

## Cluster 1 — Primary stat model (CON vs Psionic + 0–100 vs 1–5000 rank table)

**KEEP**
- LSW classification rule — origins 2–8 powered, 1/9 baseline humans (`lswSystem.ts:16`).
- Investigation detective-rank *inputs* INT+INS (`enhancedGameStore.ts:3741`) — formula stays, only the scale normalizes.
- Mood system reads STA, not CON (`combatResolution.ts:161`) — correct separation.
- Education fields + role domains (`characterRoles.ts`) — functional.

**CHANGE**
- **CON identity → PSI alias.** `CharacterStats` gains `PSI` pointing at `CON`; UI shows PSIONIC; code keeps `CON` (`types.ts:230-238`, `characterGeneration.ts:266-280`, + ~22 `.CON` consumers).
- **Stat range retune.** `generateStats()` outputs 1–39 for origin 1/9 (threat-scaled), 40–150 for LSW origins; normalize consumers (`characterGeneration.ts`, `combatResolution.ts` morale/damage/defense, `tournament.ts` HP, `characterSheet.ts` derived, `characterRoles.ts:72-76` statAvg thresholds, `enhancedGameStore.ts` detective rank).
- **Secondary stats broken by 1–5000.** karma `(INT+INS+CON)/3` (`characterSheet.ts:404`, mirror `CharacterScreen.tsx:239`), initiative `(AGL+INS)/2`, movement `6 + AGL/10`, carry `STR*10` all assume 0–100 input — route through normalization.

**ADD**
- **`statUtils.ts`** (new) or `characterSheet.ts` extension — percent-based derived layer: `initFromStats`, `hpFromStats`, `carryCapFromStats`, `karmaFromStats`; each normalizes 1–5000 → 0–100 intermediate, applies formula, returns game units.
- **`normalizeDetectiveRank(int, ins)`** in `enhancedGameStore.ts:3738-3745` — dampen 5000-scale to a usable 1–200 (e.g. `(INT+INS)/50`).
- **Signing-cost retune** `computeSigningCost` (`characterGeneration.ts:1071-1082`) — baseline 200 is tuned to 25–130; refit to the new range, clamp 500–5000.

**TRASH / DEFER**
- Cosmetic CON→PSIONIC icon/label sweep — deferred to the CON-rename task; alias first, cosmetics later.

**FLAGS**
- *CON or PSIONIC?* → **Alias PSI to CON in types** (Option 1). Backward-compatible, UI shows PSIONIC. `types.ts:230-238`.
- *Soft retarget or hard 1–5000?* → **Retarget generation to spec range** (Option 2). Spec is canonical; consumers need Human/Superhuman thresholds. View-layer delays the reckoning.
- *When?* → **Now**, in this read-only phase. Combat is next and must inherit a locked model — fixing here is riskless.

---

## Cluster 2 — Combat-prep math modules (rank interpreter, dodge chart, strength table)

**KEEP**
- `strengthSystem.ts:27-118` — full STRENGTH_TABLE (28 entries, STR→rank→lift lbs→weight) matches spec exactly. Functions `getStrengthRank/getLiftingCapacity/getCharacterWeight/getStrengthDamageBonus` all present. **Keep as-is.**
- `core.ts:407-414` `calculateAccuracy()` AGL-evasion baseline — adapt when the dodge chart lands, don't discard.
- `characterSheet.ts:354-373` `getStatRank()` descriptive labels — correct; can seed the numeric tier map.

**CHANGE**
- **AGL evasion → tiered dodge chart.** Replace the linear `-1%/2 AGL above 15` in `core.ts:407-414` with the spec dodge chart (AGL band → −CS penalty → threat class), applied as `accuracy -= columnShiftPenalty`. *Rebalances baseline to-hit across all tests* — fire modes and stance bonuses must be re-tuned after.
- **New `rankSystem.ts`** — stat→rank→tier→threat interpreter: `getRankFromStatValue`, `getRankTier`, `getThreatLevelFromRank`, `getDodgeChartEntry`. Validate against `characterSheet.ts` `getStatRank()` and `lswSystem.ts` `powerLevelForThreat()`.

**ADD**
- **`dodgeSystem.ts`** (new, in `data/` not `combat/core`) — the spec dodge chart as pure AGL→−CS data. It is character-derived stat mapping, not engine logic.
- **Wire dodge chart into accuracy** — single source of truth for AGL→penalty in `core.ts:407-414` and `CombatScene.ts` accuracy phase.

**TRASH / DEFER**
- `characterLifeCycle.ts` `columnShift` stub (familiarity tiers, `:53–98`) — leave as-is; it's a *city-familiarity* mechanic, a separate concern from AGL dodge. New AGL columnShift lives in `dodgeSystem.ts`; no conflict if scoped.

**FLAGS**
- *Apply dodge at target-select, hit-roll, or reaction?* → **Hit roll**, inside `calculateAccuracy()` (Option a). Matches spec ("attacker Column Shift penalty") and existing AGL logic + cover bonus (`core.ts:353`).
- *AGL above 250 (High Cosmic)?* → **Clamp at −12CS floor** (Option a). Generation caps AGL ~500 at cosmic; above-250 is rare; clamping is safe.
- *Does rankSystem import dodgeSystem?* → **Neither; keep both standalone** (Option b). rank = metadata, dodge = math; callers needing both import both.

---

## Cluster 3 — Secondary stats + boolean flags

**KEEP**
- `hasSecretIdentity` boolean (`characterSheet.ts:2017`).
- `wealth` numeric 0–10000 (`:2058`).
- `cityFamiliarity` per-city array (`:2079`).
- **Health formula MEL+AGL+STA+STR (`:398`) — confirmed correct.**
- `employment.isEmployed` (hiring status), `status` field w/ hospitalized/dead (`:2110`), `activeInjuries` for disease/poison (`characterStatusSystem.ts:437-467`).

**CHANGE**
- **Reputation interface** (`characterSheet.ts:715-721`) — add `fear` and `respect` (0–100) alongside `publicReputation`; wire into generation + reputation updates.
- **POPULARITY** — add `popularity` (0–5000) to CharacterSheet (`:2058`); distinct from fame (recognition) — positive public affinity/following.
- **Flight / breathing** — add `flight` + `breatheAir` booleans (`:2040`) for combat Z-axis + gas/asphyxiation immunity; **set at generation from powers/origin**, don't parse power names mid-combat.

**ADD**
- `fear: number (0–100)` — Reputation; fed by kills/notoriety/intimidation; combat reads for NPC morale/flee.
- `respect: number (0–100)` — Reputation; fed by heroic/leadership acts; NPC standing reads.
- `popularity: number (0–5000)` — CharacterSheet; fans/supporters; from heroic patrols + press. Orthogonal to fame/fear/respect.
- `flight: boolean (default false)` — set true for flight power / powered armor.
- `breatheAir: boolean (default true)` — false for synthetics/oxygen-less aliens; gates gas/asphyxiation effects.

**TRASH / DEFER**
- `ALIVE` flag — redundant; use `status !== 'dead'`.
- `HIRED` flag — redundant; `employment.isEmployed` is the single source of truth.

**FLAGS**
- *Where to display secondary stats?* → **Layered**: PersonnelReport quick chips for notable fear/respect (>60 / <20); PsycheTab shows the fear/respect/popularity triplet; IdentityTab shows wealth + secret-identity + flight/breatheAir.
- *How to wire FLIGHT/BREATHEAIR?* → **Set at generation** (Option 1). e.g. `'Super Speed' || 'Jump Jets'` in powers ⇒ `flight=true`; non-synthetics `breatheAir=true`, synthetics/specific aliens false. Combat trusts the flag, never parses names.
- *Fame vs Popularity?* → **Keep distinct** (Option 2). fame = recognition, reputation = sentiment (−100..+100), popularity = affection (0–5000), fear = threat, respect = authority, wealth = resources.

---

## Cluster 4 — Travel/vehicle speed + unit factions

**KEEP**
- `travelSystem.ts` modifier system (powers/skills/equipment override terrain/speed), `BASE_TERRAIN_RULES`, `calculateTravel()` engine.
- `vehicleSystem.ts` VEHICLES db, `travelMode` field, fuel/cost/incident systems, helpers (`getVehiclesByTravelMode`, `getVehicleTravelSpeed`).
- `squadSystem.ts` TravelMode via `calculateTravel()`.
- `countryOrganizations.ts` — 168 per-country national orgs, already complete.
- `lswSystem.ts` origin power generation; `combat/enemyFactions.ts` FactionId (8 tactical factions); `enemyGeneration.ts` `determineFaction()`; `factionSystem.ts` country reputation across 168 countries.

**CHANGE**
- **`travelSpeedSystem.ts`** (new) — `enum TravelSpeed { None=0, City=1, CityFast=2, Nation=3, NationFast=4, Planet=5, PlanetFast=7, Cosmic=8, CosmicFast=9 }` + `getTravelSpeedName`/`getTravelSpeedMultiplier`. Per-**squad** attribute that scales `BASE_TRAVEL_SPEEDS`; distinct from `vehicle.travelMode` (ground/air/water, unchanged).

**ADD**
- **`unitFactionSystem.ts`** (new) — strategic `UnitFaction` enum (SPEAR, FIST_Hero, PeoplesWorldArmy, AfricanUnion, LocalPoliceEnforcement, Jackal, NationalPoliceEnforcement, FIST_Mercenary, Establishment24, Hero, Vigilante, SuperCriminal, Criminal, Mercenary, Terrorist, LivingSuperWeapon, VIP_Civilian, Civilians). **Do not** duplicate `enemyFactions.ts` (tactical AI/equipment). Map `countryOrganizations.ts` orgs → UnitFactions (FIST org → FIST_Hero + FIST_Mercenary). `generateEnemySquad()` tags units with **both** FactionId (tactical) and UnitFaction (strategic).

**TRASH / DEFER**
- Per-**character** `travelSpeed` field — travelSpeed is squad-level; characters only override in the tactical/combat layer. Defer to power-system integration.
- Separate `VEHICLE_SPEED` 0–9 enum — derive from `vehicle.topSpeedMph` on demand in `squadSystem.ts`; don't create a parallel enum.

**FLAGS**
- *travelSpeed per-character or squad?* → **Squad-wide** (Option 2). Strategic map is squad-scoped; `squad.travelSpeed = max(vehicle capability, assigned members' powers)`.
- *unitFactionSystem replace or supplement enemyFactions?* → **Supplement** (Option 2). enemyFactions = tactical behavior+equipment; unitFactionSystem = campaign/diplomacy/news tags. Tag with both.

---

## Cluster 5 — World-map roster (status + city location) + right-click drilldown

**KEEP**
- Right-click JA2 context-menu pattern, already wired to store mutations (`WorldMapGrid.tsx:527-551`).
- Character `status` field (persisted in store).
- Cities↔sectors link via `city.sector`.
- Roster card portrait/mood/weapon display — foundation for status detail.

**CHANGE**
- **City name in location column** — replace `{char.sector || HQ}` (`WorldMapGrid.tsx:513`) with a `getCityNameBySector()` lookup (`cities.ts`); show **[City] (sector)**. Handle grid-code (K3) vs city-code (LJ5) mismatch via existing `resolveSectorToCell`.
- **Status detail, not just label** (`:506`) — `getStatusDetail(char)` → `{emoji, label, detail}`: INVESTIGATION+rank, TRAINING+discipline, HOSPITALIZED+days, VEHICLE+name, PATROL, OFF-GRID+days, RESEARCH/ENGINEER+item. Requires model exposes `activeInvestigation`, `hospitalizedUntil`, `assignedVehicle`.
- **Expand right-click menu 5 → 11 items** (`:535-549`): TRAVEL, INVESTIGATE, PATROL, TRAIN, RESEARCH, ENGINEER, HOSPITAL, VEHICLE, OFF-THE-GRID, RECALL, CALL — routed via `setCharacterStatus`/`setCurrentView`. TRAVEL needs `selectedCell`, VEHICLE needs vehicles list (parent props).

**ADD**
- `getCityNameBySector(sector)` in `cities.ts` — resolve sector→city name, fallback to sector code, handle both formats.
- Status-detail mapping (`getStatusDetail` / `STATUS_DETAIL_MAP`) in `WorldMapGrid.tsx` — populated from nested character fields.

**TRASH / DEFER**
- Hierarchical/nested submenus — flat 11-item with separators is cleaner; revisit only if item count grows.

**FLAGS**
- *City name replace or alongside sector?* → **Both**: two-line, primary=city, secondary=sector.
- *Menu flat or grouped?* → **Flat 11-item** with visual separators (MOVEMENT | ACTIVITIES | SUPPORT), icons+emoji.
- *INVESTIGATE/ENGINEER routing?* → route to existing views (investigation-board, engineering-bay, training); label explicitly, comment the routing.

---

## BUILD ORDER

Sequenced safest-first: pure additions (no existing behavior changes) before anything that
touches formulas the rest of the game reads. Steps that ripple are flagged **⚠ cascades**.

1. **`rankSystem.ts`** — stat→rank→tier→threat interpreter. Pure new data module, no consumers yet. Validate against existing `getStatRank()` / `powerLevelForThreat()`.
2. **`dodgeSystem.ts`** — tiered AGL→−CS chart. Pure new data module; not yet wired into combat.
3. **Strength table** — already complete (`strengthSystem.ts`). **No work**; listed to confirm it's the reference the above two validate against.
4. **Secondary stats + booleans** — add `fear`/`respect`/`popularity`, `flight`/`breatheAir` to `characterSheet.ts` + Reputation; set flight/breatheAir at generation. Additive fields; safe. ⚠ *lightly cascades* into UI (PersonnelReport/PsycheTab/IdentityTab) — display only, no formula risk.
5. **`travelSpeedSystem.ts` enum + `unitFactionSystem.ts` enum** — two new enums. Pure additions; `unitFactionSystem` maps existing orgs and dual-tags in `generateEnemySquad()`. Does not touch tactical `enemyFactions.ts`.
6. **Stat-generation retune (0–100 → 1–5000) + `statUtils.ts` normalization + CON→PSI alias.** ⚠ **The big cascade.** Retarget `generateStats()` to Human/LSW bands, then normalize *every* consumer that assumed 0–100 (karma, initiative, movement, carry, detective rank, signing cost) and combat formulas (`combatResolution.ts`) via the new `statUtils` layer. Add `PSI` alias in the same pass. **Do this before combat starts** — combat inherits the locked model. Steps 1–3 (rank/dodge/strength) feed the threshold semantics this step needs.
7. **World-map roster + drilldown** — `getCityNameBySector`, `getStatusDetail`, 11-item menu. ⚠ *cascades* on the model fields surfaced in step 4 (status detail reads `activeInvestigation`/`hospitalizedUntil`/`assignedVehicle`); do after 4. UI-layer, no combat-math risk.

**Critical path:** 1–3 are risk-free and unlock 6's tier semantics. 6 is the gate for combat and
must land before the combat pass. 4 unblocks 7. 5 is independent and can slot anywhere before the
combat/enemy-generation pass.
