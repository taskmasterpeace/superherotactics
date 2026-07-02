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

---

# Round 2 — deep-character direction (2026-07-02 owner dump #2)

> New vision layer: characters **age**, go to the **hospital**, have **personalities**, and eventually **talk to you on the phone** (portrait on the side + comic bubble + accept/decline choices, LLM-driven later). Every character should be **effective at something** — investigator, base-builder, field-deployer — so nothing is dead weight; everything is weighted and means something, and once the simulator runs we can ballot/balance it. Directive: **fix the injury-table contradictions with subagents**, and **reserve portraits now**.

## A. Injury & mental-state system + the color-coded report

**The report the owner wants:** a Personnel/roster screen where each character's **physical injury state** and **mental state** read at a glance by **color** (green healthy, amber hurt, red critical; calm, stressed, panic/broken), with the character's **portrait**. Some injuries are visible immediately after combat; others are **revealed later at the hospital** (a diagnosis reveal). This is the post-combat injury display (#1) elevated to a persistent, color-coded health + psyche board.

**The d100 table is a 5e master-guide, not runtime-ready.** Specs 23 (crit-injury) + 24 (status/treatment ladder) are the SHT-native authority. A subagent contradiction hunt confirmed the owner's instinct — it is riddled with issues:
- **Duplicates / same-effect rows:** "Pulled thigh" in two tiers with different effects (rows 50 and 66); "Broken spine" equals "Fractured spine" verbatim-identical effect but a 6th-vs-4th-level cure inversion (rows 16 and 24); "Severed muscles" equals "Overstretched muscle", "Ruptured" equals "Bruised liver", "Dislocated shoulder" equals "finger" (identical -2 attack, different cure).
- **Cure/severity inversions:** cure tier does not scale within a tier and even inverts (mild concussion costs more than minor; a full **Paralysed** sits in the mild "Injury" tier healing on a long rest, while spine breaks take 2d8 weeks).
- **Mis-placed permanence:** "Amnesia" (Forever/uncurable) filed under the lower Mental-trauma tier, below curable "Severe mental trauma."
- **Non-monotonic boon band:** the high-roll survivability/boon rows (86-101) are lateral, not ascending — a higher roll can give a weaker boon.
- **Wall-to-wall 5e:** DC saves, spell slots ("Nth-level healing spell"), exhaustion levels, death saving throws, advantage/disadvantage, concentration, long/short rest, prone/frightened/paralysed conditions, hit dice, even "prestidigitation" and "the pesky rogue." None exist in 4CS.
- **Missing SHT gates:** no row consumes **origin** (a Construct should Malfunction, not Bleed) or the **spine** (Healthcare/Cloning gating cure availability) — both mandatory per specs 23/24.

**Translation rules (to SHT-native):** cure column to the spec-24 TreatmentTier ladder (None/Rest/FirstAid/FieldSurgery/HospitalCare/AdvancedMedical/PowerHealing/Regeneration/CloneReplacement); advantage/disadvantage and flat plus/minus N to **Column Shift** (disadvantage -1CS, "all" -2CS, advantage +1CS); ability map CON to CON, STR to STR, DEX to AGL, INT to INT, **WIS to INS** and **Charisma to FAME** (OWNER-FORKS, see below); "Until short rest" to "until end of combat", "Long rest" to strategic Hours/Days; add an **origin gate** and **spine note** to every relevant row; re-order to one **monotonic severity axis** (low d100 worse, high better).

**Deliverable — DONE (draft):** the subagent workflow translated all 100 rows + reconciled them into a clean **SHT-native injury table** at [`docs/design/source/injury_table_sht.md`](source/injury_table_sht.md) — deduped, 4CS-native (Column-Shift penalties, spec-24 treatment ladder, origin+spine gates, one monotonic severity axis), with 10 contradictions resolved and 13 owner-forks flagged (sensible defaults applied, editable). **Not yet wired to runtime.** It is the new starting point the owner reacts to.

**OWNER-FORKS (need a ruling):** (1) **WIS to INS?** (5e Wisdom maps to Instinct?) (2) **Charisma to FAME?** (or to a social stat?) (3) do "quicker death" social rows ("enemies take pity") stay as flavor or get cut? (4) which thin categories to expand from the crit table (Finger/Ear/throat/tendon/rib)?

## B. Education to roles ("everyone effective at something")

**Finding:** education is a **major designed power system** that is almost entirely unwired. The source (`educationSystem.ts` + `Education_Career_Complete.csv`) designs **four effects**: (1) permanent **stat bonuses** scaling by degree level x field; (2) **skill + equipment unlocks** per specialization (some gated by restricted field / INT / origin / reputation); (3) a full **jobs/careers tree** — ~85 ranked jobs + ~18 day-jobs giving **weekly income, cover identity, workplace/info access, research capability, and per-career investigation bonuses**; (4) **training/research speed** (stat x institution). This IS the owner's "everyone effective at something" backbone — a doctorate makes a cybersurgeon, a military track makes a squad-leader/sniper, an investigation field makes a detective, engineering makes a base-builder.

**But it is broken/unwired today** — only ~investigations are partly wired, and there are real bugs:
- **Three conflicting `EducationLevel` types** (`data/educationSystem` DegreeLevel vs `worldSystems/educationSystem` vs `db/types`) + a **broken import** in characterSheet (imports a name the file does not export; assigns literals matching none). **Unify this first.**
- TrainingCenter fabricates hard-coded stat bonuses ({stat:5,int:3}) and reads `optimalStat` when the field defines `optimalStatValue` — so per-field/level bonuses never apply; a doctorate equals an associate.
- `DAY_JOBS`, `getAvailableJobs`, exams (`rollExam`), dropout, `calculateLearningSpeed` are all exported but **never called** — no income, no cover, no real training speed.
- Generation seeds a **4th education vocabulary** (`EducationField[]`) never reconciled with the degree system.

**Integration plan (priority order):** (1) **unify `EducationLevel`** into one type + fix the broken import; (2) author a real `DEGREES` dataset (FieldOfStudy x level to concrete statBonuses/skillUnlocks/equipmentUnlocks/jobUnlocks); (3) fix TrainingCenter enroll to use real field/level data; (4) make runtime training speed real (`calculateLearningSpeed` x facility bonus); (5) wire **exams + dropout**; (6) persist completion to a single source of truth (`completedDegrees[]`, apply stat bonuses to the sheet); (7) wire **jobs/careers** (`getAvailableJobs` to day-job assignment to income/cover/access, shown with the pay schedule from #14); (8) wire **skill/equipment unlocks** to loadout/combat gates; (9) deepen investigation gating beyond the ~12 templates. Files: `educationSystem.ts`, `worldSystems/educationSystem.ts`, `db/types.ts`, `characterSheet.ts`, `characterGeneration.ts`, `TrainingCenter.tsx`, `enhancedGameStore.ts`, `investigationSystem.ts`.

## C. Phone-call dialogue (portrait + bubble + choices)

**Vision to build.** Today `MobilePhone.tsx:612-657` is a one-shot call screen (the dealer GO NOW/LATER). Target: **call a contact/character, their portrait on the side + a comic `<SpeechBubble>` of what they say + accept/decline (or richer) choices**, eventually LLM-driven from their personality.

- **Portraits: art already exists** — `public/assets/images/status_icons/portrait_01..12.png` (+ metadata). Wire contacts/recruits to a `portrait?: PortraitInfo` (mirroring the new CharacterSheet slot) with a seeded fallback to those PNGs. The `resolvePortrait()` + `CharacterPortrait` built this round render it.
- **Choices: reuse the email-reply pattern** — `emailSystem` already has `replyOptions?: EmailReplyOption[]` with effects (reputation/relationship/triggersMission) and `handleEmailReply`. A call's choices equal the same structure; each fires `executeContactEffects()`.
- **Bubble: mode from personality** — `resolveBubbleMode({ emotion, volume })` picks the look from the caller's mood (nervous merc to whisper, panicked to negative, angry to jagged).
- **Build order:** (1) add `portrait? / personality? / choices?` to the `Contact` interface + seed existing contacts; (2) `CallScreen` = portrait side panel + `<SpeechBubble>` + choice buttons (extract from MobilePhone activeCall block); (3) wire choices to `executeContactEffects`; (4) later: LLM prompt from MBTI/calling/mood to dynamic line + multi-turn, cached.

## D. Portraits, aging, hospital, LLM readiness

- **Portraits:** slot reserved this round (`PortraitInfo` on CharacterSheet + `resolvePortrait()` + `CharacterPortrait.tsx`; 12 stock PNGs available). Real art / LLM-described faces drop into `portrait.url` with no call-site changes.
- **Aging:** `AgingInfo` already exists on the character; needs birthdays + aging events wired to the world clock (stat drift with age, per the owner's "characters age").
- **Hospital:** the recovery loop is specced (108) and the status/treatment ladder exists (24); connect injury records to hospital admission to recovery timeline to the color-coded report (A).
- **LLM talking (future):** personality attributes (MBTI, calling, volatility, harm-avoidance, mood) + portrait + the bubble engine are the display + prompt substrate; drop in an LLM to generate lines when ready.

## E. Covert ops & patrols = "what characters DO in the city"

Owner reframed #2/#3: covert ops and patrols are the **city-action menu** — when a character is in a city, what do they do there. Covert-ops list (Destroy Ammo Depot, Disable Aircraft, Capture Officer, Cut Pipeline, KO Radar, Disable SAM, Liberate POW, Photograph Aircraft, Free Hostages, Create Diversion, Delayed Sabotage) + patrol sub-choices become a submenu **driven by the country dynamic**, using character **skills/education/roles** (B) to grant weighted bonuses. Net build; source = spec 06 activities + `Investigation_Methods.csv`. (Owner will add more detail.)

## Master-table updates (this round)

- **#1 Injuries** verdict now **"reconcile first (subagent workflow), then wire display + color report"**; d100 table is a flawed master-guide, specs 23/24 are authority.
- **#9 Moods** the mood/emotion layer feeds BOTH the color-report (A) and the bubble mode resolver (C) — one signal, two consumers.
- **#13 Education** upgraded from "wire it" to a **9-step integration plan** (unify types first); it is the roles/effectiveness backbone.
- **Portraits** slot + placeholder renderer **DONE** this round.
