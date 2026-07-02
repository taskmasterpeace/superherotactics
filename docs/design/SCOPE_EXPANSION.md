# SHT Scope Expansion — the whole board (2026-07-02 owner dump)

> **What this is.** The owner dumped a large batch of systems + legacy content ("years of stuff I created + acquired from other games to cherry-pick"). This organizes it: what each system is, **what already exists** (data / spec / code), the **gap**, and **which legacy file is the source of truth**. Five parallel audit agents produced the "exists/gap" columns. Keep feeding this board.
>
> **Rule that keeps repeating:** the *design & data are far ahead of the wiring*. 41 build-ready specs, ~122 source CSVs, 84 legacy files in `SuperHero Tactics/`, 127 code modules. Most asks are **integration + UI**, not net-new invention. The few genuine net-new builds are flagged.

---

## Master status table

| # | System | Data | Spec | Code | Verdict | Source of truth |
|---|--------|------|------|------|---------|-----------------|
| 1 | **Injuries / scarring / cybernetics** | ✅ rich | ✅ 23,22,24,108 | ⚠️ 80% (no UI) | **Integrate + display** | `characterStatusSystem.ts`, spec 23, `Injury_System.csv`, owner's `injury_table_d100.csv` |
| 2 | **Covert ops** (12 op types) | ⚠️ list only | ✅ 06 ACT_007, 02 | ❌ none | **Net build** | spec 06, `Daily_Activity_Framework.csv`, `Investigation_Methods.csv` |
| 3 | **Patrols** (choose what to patrol) | ✅ | ✅ 06 | ⚠️ loop only | **Add submenu** | `patrolSystem.ts`, `patrolEncounters.ts` |
| 4 | **Activity scheduler + assignment UI** | ✅ 30 activities | ✅ 06 | ❌ no UI | **Net build (UI)** | spec 06, `Daily_Activity_Framework.csv` |
| 5 | **JA2 world-map selection** (owner's live pain) | — | ✅ 102 | ⚠️ broken UX | **Fix now (cheap, high-impact)** | `WorldMapGrid.tsx`, `SquadRoster.tsx` |
| 6 | **Elections** (4-yr, player-influenced) | ✅ | ✅ 17 | ⚠️ deterministic, not persisted | **Wire influence + persist leader** | `electionSystem.ts`, `Dynamic_Political_Events.csv` |
| 7 | **Nuclear threats + UN voting** | ⚠️ | ✅ 111 (UN summit POL_005) | ❌ none | **Net build** | spec 111, `Dynamic_Political_Events.csv`, `doomClockSystem.ts` |
| 8 | **HVTs / jackals** (hunters w/ abilities) | ⚠️ `hvt` field empty | ⚠️ 08 | ⚠️ faction hunt squads only | **Populate HVTs + hunter NPC** | `factionHuntMissions.ts`, `..._Cities_with_HVTs.csv` |
| 9 | **Moods & emotions** (below MBTI) | ✅ MBTI/calling/morale | ✅ 03 | ⚠️ morale only, no drift | **Add mood layer** (feeds bubbles) | `personalitySystem.ts`, `callingSystem.ts`, `Personality, Emotions, Age.*` |
| 10 | **City familiarity** (unfamiliar = weaker) | ✅ tracked | ✅ 12 | ⚠️ **zero effect** | **Apply penalties** | `patrolSystem.ts`, `characterGeneration.ts`, `City_Type_Effects.csv` |
| 11 | **Base = physical multi-map** (bunker-in-mountain vs city) | ⚠️ location+grid | ✅ 19 | ⚠️ abstract facilities | **Net build (per-location maps)** | `baseSystem.ts`, spec 19, `mapTemplates.ts` |
| 12 | **Fast combat** (control *certain* aspects) | ✅ | ✅ 20,21 | ⚠️ auto-sim only | **Add interactive layer** | `FastCombat.tsx`, `battleRunner.ts` |
| 13 | **Education → characters** | ✅ big system | ✅ 18 | ⚠️ only base bonus | **Wire to jobs/training/investigations/stats** | `educationSystem.ts`, `Education_Career_Complete.csv`, `Education.xlsx` |
| 14 | **Pay schedule visibility** | ✅ weekly payday | ✅ 16 | ❌ not shown | **Quick win (display)** | `economySystem.ts`, `BudgetDisplay.tsx` |
| 15 | **Comic speech bubbles** | — | (spec 103 hooks) | ✅ **BUILT this session** | **MVP done → polish** | `src/speech-bubbles/`, `/bubble-lab` |

---

## Detail per system (what exists → the gap)

**1. Injuries / cybernetics.** Deep foundation: `characterStatusSystem.ts` has 11 body parts, 30+ injuries, a prosthetics catalog (basic→cybernetic with stat mods + research gates), care levels, and origin-gated healing (`originHealingSystem.ts`). Spec 23 defines the full crit→injury pipeline with severity bands that **already line up with the owner's d100 table** (Death / Permanent / Severe / Major / Minor / Mental / Scars / Survivability). **Gap:** (a) no post-combat injury **UI** — `combatResultsHandler.ts` computes XP but never emits injury records to the character; (b) no `Character.activeInjuries[] / installedProsthetics[] / permanentDisabilities[]` on the live record; (c) prosthetic-fitting workflow; (d) the "some shown now, some revealed at the hospital later" layered reveal; (e) bind the owner's d100 CSV, **adapted from D&D-5e language to 4CS** (DC checks → column-shift/rank checks, spell-level cures → SHT treatment ladder, death saves → the injury/hospital loop). Saved raw at `docs/design/source/injury_table_d100.csv`.

**5. JA2 selection (the live pain — do first).** Root cause found: selection state IS tracked (`selectedCharacterIds`, `selectedCell`) but has **zero visual feedback**, **no double-click handler**, and **no context menu** — so clicking silently toggles and you can't tell what you selected or what it's for. Fix = highlight the selected unit, a floating action menu (Deploy / Enter Vehicle / View / Assign Activity), double-click = default action, a "N selected" status line. Small, and it unblocks the whole world-map feel.

**9 + 15. Moods/emotions ↔ comic bubbles (they're one feature).** Today only `morale` is dynamic (event-driven, no time drift); `volatility`/`harmAvoidance` are static and unused. A **mood/emotion layer** (drifts toward a personality baseline, spikes on events) is the missing dynamism — and it's exactly what should **pick the speech-bubble mode** (panic → negative black bubble, anger → jagged, drunk → wavy). The bubble engine is built and waiting for this signal.

**10. City familiarity.** Fully tracked and earned (birth city 100%, patrol +2/hr, capped 75%) but **penalizes nothing**. Cheap, high-flavor win: unfamiliarity reduces power effectiveness / investigation quality / adds encounter danger. The owner specifically wants "powers weaker in an unfamiliar city."

**13. Education.** The classic "designed extensively, integrated minimally": every character carries `educationLevel`/`specialization` and `educationSystem.ts` is huge (31 fields, tracks, unlocks, dropout risk) — but it only feeds a base facility bonus. Wire it to jobs, training speed, investigation skill, and the `statBonuses` it already defines.

**14. Pay schedule (quick win).** Weekly Monday payday runs; the player just never SEES it. Add "next payday in N days" + per-character wage breakdown to `BudgetDisplay`/laptop.

*(Systems 2,3,4,6,7,8,11,12 detail in the master table + agent reports; all have their source-of-truth file identified.)*

---

## Legacy source map (where to cherry-pick)

- **Design:** `docs/design/01-29` (core) + `100-111` (extended) — 41 build-ready specs.
- **Rules CSVs:** `docs/csv-source-data/Game_Mechanics_Spec/` (31 — Universal Table, Injury_System, Combat, Education_Career, Country/City/Culture effects) + `docs/csv-source-data/` root (~91 — Combat Compendium, powers, investigations, political events, activities).
- **Original bible:** `SuperHero Tactics/` (84 — World Bible xlsx, FIST GDD v02.txt, Origins/Threat/Powers txt, Combat Compendium xlsx/csvs, Education.xlsx, Investigation Table.xlsx, TerrainCodes, Wrestling drawio, `Personality, Emotions, Age` for the mood layer, `SectorCityData` for the map).
- **Code:** 127 modules in `MVP/src/data/` grouped by system (character, combat, world, economy, crime, faction, investigation, time).

---

## Suggested attack order (owner decides)

1. **Quick wins (cheap, immediately felt):** JA2 selection feedback (#5), pay-schedule display (#14), city-familiarity penalty (#10), persist election leaders (#6).
2. **Character depth (ties to Phase 3):** post-combat injury display + d100 adaptation (#1), mood/emotion layer → wire into the bubble engine (#9+#15), education integration (#13).
3. **New activities:** activity scheduler + assignment UI (#4), covert ops (#2), patrol submenu (#3).
4. **World meta:** UN/nuclear (#7), HVTs/hunters (#8), multi-map base (#11), interactive fast combat (#12).

Combat stays confirm-only unless the owner reprioritizes. Every item above has its data/spec confirmed present — this is a wiring-and-UI roadmap, not a from-scratch one.
