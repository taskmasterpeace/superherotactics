# 06 — Character Management, Daily Activities & Time

> **System:** Character status state-machine · daily-activity scheduler · fatigue/stress upkeep · the real-time-with-pause world clock · the **time-travel rewind economy** (the diegetic save).
> **Status:** BUILD-READY SPEC (v1.0)
> **Spine consumed:** country STATs (Healthcare, HigherEducation, Science, MilitaryBudget, IntelligenceBudget, LSWActivity, Lifestyle, GovernmentCorruption); city Type + Crime Index + Population Rating; culture region; faction territory standing; personality type (the 20-row table) + STAM personality traits.
>
> **Primary source tables (open these to re-balance — never hardcode these numbers in code; load from data):**
> - `docs/csv-source-data/Daily_Activity_Framework.csv` — the **30 activities** (ACT_001…ACT_030): type, duration-hours, requirements, outcomes, country/faction modifiers, status effects, investigation hooks. **(authoritative for activities)**
> - `docs/csv-source-data/Time_Management.csv` — the **8 Character-Status states** (rows 34–41: Available/Busy/Traveling/Injured/Hospitalized/Missing/Dead/Undercover), the **5 time-flow ratios** (rows 2–5), and the **5 event-priority response windows** (rows 42–46). **(authoritative for status + clock)**
> - `SuperHero Tactics/FIST GDD v02.txt` — lines **219–304** (the Status verbs: Ready/Hospital/Investigation/CovertOps/Personal Life/Training/Patrol/Off-the-Grid/Engineering/Research/Travel/Recruit), lines **123–131 & 351–391** (the **time-travel save**), line **497** ("when the player opens the laptop time is paused but the player can restart it"). **(authoritative for verbs + rewind fantasy)**
>
> **Secondary sources:**
> - `docs/csv-source-data/Status_Effects_Complete.csv` — Exhausted (8h), Tired (4h), Sleep, Hospitalized/Critical/Stable, Diseased/Sickness day-counts. (fatigue + recovery upkeep)
> - `docs/csv-source-data/Game_Mechanics_Spec/Country_Attribute_Effects.csv` — per-STAT ±CS bands and combination effects the activities consume.
> - `docs/csv-source-data/Game_Mechanics_Spec/City_Type_Effects.csv` — city-type activity affinity, crime/population bands.
> - `docs/csv-source-data/Game_Mechanics_Spec/Education_Career_Complete.csv` — the 13 education tiers / 7×5 careers that Training/Research/Teaching read.
> - `docs/csv-source-data/Game_Mechanics_Spec/Stat_Rank_Mapping.csv` + `Universal_Table_FIXED.csv` — the FASERIP rank ladder + resolution table every activity check rolls against.
> - `SHT_MECHANICS_BIBLE.md` §2.4, §7.6 (daily activities), §11 (time + time-travel save), §13 rulings #8 (no XP) & #9 (consume combined-effects).
> - Existing code this spec **extends, does not replace:** `MVP/src/data/timeSystem.ts` (`GameTime`, `TimeSpeed`, `ACTIVITY_HOURS`, `Activity`, `ActivityCategory`), `MVP/src/data/characterLifeCycle.ts` (`calculateActivityDesires`, `processIdleDay`, aging/addiction), `MVP/src/data/characterStatusSystem.ts` (injury/status effects), `MVP/src/stores/enhancedGameStore.ts` (`gameTime`, `timeSpeed`, `isTimePaused`, `squadStatus`).
>
> **Scope split (LOCKED — do not cross these lines):**
> - This doc **owns:** the per-character **Status state-machine**, the **activity scheduler** (assign → tick → resolve), **fatigue & stress** upkeep, the **world clock** (speed/pause/ratios) and the **time-travel rewind economy**.
> - This doc **READS but does not re-spec:** personality idle-flavor & AI target choice (**doc 03**), travel-time resolution (**doc 05**), hospital/cloning/death recovery internals (**doc 108**), the events/encounter engine (**doc 02**), the phone/email surface (**doc 01**). It defines the **hand-offs** to each.

---

## 1. Overview & Player Fantasy

You don't control superheroes minute-to-minute. You control an **organization** (FIST GDD line 13). Between missions your roster of difficult, distinct individuals has to **do something with their days** — and the game asks you, the manager, to decide. A character left idle isn't paused: she's "becoming familiar with the city, texting you their concerns, aging by the day, secretly hiding an addiction" (FIST GDD lines 221–226). This system is the **between-missions loop** — the JA2 "sector inventory & merc downtime" texture — sitting on the laptop layer where **opening the laptop pauses the world clock** (FIST GDD line 497; Bible §7.1/§11).

Four jobs:

1. **Status state-machine.** Every character is always in exactly one of **8 states** (Available/Busy/Traveling/Injured/Hospitalized/Missing/Dead/Undercover — `Time_Management.csv` rows 34–41). The state decides what you can ask of them (a Hospitalized merc can't be deployed; a Busy merc can't take a new assignment until her activity completes).
2. **Daily-activity scheduler.** You assign an idle character one of **30 activities** (`Daily_Activity_Framework.csv` ACT_001…ACT_030), each with a real duration in **game-hours**, requirements, resource costs, outcomes, and **investigation hooks** ("Patrol can discover ongoing crimes"). Activities consume the **spine** — a Research session in a high-Science Innovation-Hub country resolves better and faster than the same session in a failed state.
3. **Fatigue & stress upkeep.** Activities and missions cost stamina and accrue stress; without **Sleep / Personal Life / Off-the-Grid** recovery, characters degrade (Tired → Exhausted → eventually sick), feeding the addiction/morale loops in doc 03 and the injury loop in doc 108.
4. **Time & the rewind economy.** The world clock runs **real-time-with-pause** at one of **5 flow ratios** (`Time_Management.csv` rows 2–5). The only save is the **Time Walker** going to the past (load) or future (a one-shot impossible-odds win), at a **sanity cost with shrinking destinations** (FIST GDD lines 123–131, 351–391; Bible §11). This doc specs the **rewind economy** as a tense resource, not a brick wall.

The fantasy: *"My team is a set of living people whose days I budget. The clock is always burning toward the invasion. When I overreach I can rewind time — but the Time Walker pays for it in her mind, and each rewind there are fewer places left to run to."*

**Non-goals (scope guards):** No dialogue trees (doc 01). No combat resolution (combat layer). No re-spec of personality idle-*flavor text* — this doc decides *which activity* a character drifts toward and *that they ping the phone*; doc 03 owns the *voice/wording* and the AI target preference. No travel-time math (doc 05); we only set the `Traveling` status and read the ETA. No hospital/clone internals (doc 108); we only route to the Hospital activity and read recovery status back. Multiplayer (the Time Walker's "other dimension") only ever **reads** status/clock state — design accordingly (Bible: MP is an architectural stub).

---

## 2. Data Schema (fields / types)

All new types live in a new module `MVP/src/data/characterManagement.ts`, which **imports and extends** the existing `timeSystem.ts`, `characterLifeCycle.ts`, and `characterStatusSystem.ts` rather than redefining their types.

### 2.1 `CharacterStatus` — the 8-state machine (from `Time_Management.csv` rows 34–41)

```ts
type CharacterStatus =
  | 'Available'     // row 34 — Ready for assignment; full strategic flexibility
  | 'Busy'          // row 35 — Currently assigned; cannot take new assignment until activity completes
  | 'Traveling'     // row 36 — In transit (owned by doc 05); may trigger travel encounters
  | 'Injured'       // row 37 — Can ONLY be assigned to Medical Treatment; combat effectiveness severely reduced
  | 'Hospitalized'  // row 38 — Cannot be assigned to anything (owned by doc 108)
  | 'Missing'       // row 39 — Location unknown; must be located by investigation (set by Off-the-Grid ACT_010)
  | 'Dead'          // row 40 — Cannot be assigned unless cloned/resurrected (owned by doc 108)
  | 'Undercover';   // row 41 — Deep-cover; limited availability, identity protected (set by CovertOps ACT_007)
```

> **Mapping note (RULING):** the FIST GDD calls the *verbs* "Status" (Ready, Patrol, Training…), while `Time_Management.csv` calls the *machine states* "Status" (Available, Busy…). These are two layers. **RULING:** the 8 `Time_Management` rows are the **machine state**; the GDD verbs are **activities** (§2.3) that, while running, put the character in `Busy` (or `Traveling`/`Undercover`/`Missing` for the three that change machine state). "Ready" (GDD) ≙ "Available" (Time_Management) — same thing, one name: use **`Available`** in code.

### 2.2 `Character` additive fields (on the existing character record)

```ts
interface CharacterMgmtFields {
  status: CharacterStatus;            // §2.1 — default 'Available'
  currentActivityId: string | null;   // ACT_001..ACT_030 or null when Available
  activityEndsAtGameHour: number;     // absolute game-hour timestamp; null when Available
  // Upkeep meters (0..100). RULING values (§4.4) — names mirror Status_Effects_Complete fatigue ladder.
  stamina: number;                    // 100 = fresh; drains per activity-hour; <30 => Tired, <10 => Exhausted
  stress: number;                     // 0 = calm; rises with ops/combat; >70 raises addiction-relapse roll (doc 03)
  daysSinceRecovery: number;          // game-days since last Sleep/Personal-Life/Off-Grid; gates the upkeep penalty
  // Aging is owned by characterLifeCycle.ts (already in code) — we only READ age for the elderly upkeep modifier.
}
```

### 2.3 `ActivityDef` — static reference data, 30 rows (from `Daily_Activity_Framework.csv`)

Loaded once at boot from the CSV; immutable at runtime. **All numbers come from the CSV — do not invent.**

```ts
type ActivityType =
  | 'Lifestyle' | 'Physical' | 'Academic' | 'Security' | 'Recovery' | 'Technical'
  | 'Mission' | 'Political' | 'Combat' | 'Survival' | 'Business' | 'Education'
  | 'Spiritual' | 'Illegal' | 'Creative' | 'Mental' | 'Innovation' | 'Detective'
  | 'Organizational' | 'Public' | 'Personal' | 'Social' | 'Administrative'
  | 'Analytical' | 'Military';   // 25 distinct Activity_Type values present in the CSV

interface ActivityDef {
  id: string;                        // "ACT_001".."ACT_030"
  name: string;                      // "Personal Life", "Training", ...
  type: ActivityType;                // CSV Activity_Type
  durationHours: number | 'Variable';// CSV Duration_Hours (see §3.1 for the 'Variable' resolution rule)
  successRequirements: string;       // CSV Success_Requirements (e.g. "Research skill", "Education level 2+")
  potentialOutcomes: string[];       // CSV Potential_Outcomes split on ';'
  triggerEvents: string;             // CSV Trigger_Events (handoff to events engine, doc 02)
  countryBenefitRule: string;        // CSV Country_Benefits (spine hook — parsed into a modifier, §5)
  factionRestriction: string;        // CSV Faction_Restrictions
  characterRequirement: string;      // CSV Character_Requirements
  resourceCost: string;              // CSV Resource_Costs
  experienceGained: string;          // CSV Experience_Gained (NOTE: skill XP, NOT level XP — Bible §13 #8)
  statusEffectApplied: string;       // CSV Status_Effects_Applied (e.g. "Temporary fatigue")
  equipmentEffect: string;           // CSV Equipment_Effects
  investigationHook: string;         // CSV Investigation_Opportunities (handoff to investigation, doc 02)
}
```

### 2.4 `ActivityAssignment` (runtime, one per Busy character)

```ts
interface ActivityAssignment {
  characterId: string;
  activityId: string;                // ACT_xxx
  startedAtGameHour: number;
  endsAtGameHour: number;            // start + resolvedDurationHours (§3.1)
  cityId: string;                    // where it's being performed (spine context locked at assignment)
  countryId: string;
  resolvedModifierCS: number;        // net ±CS from spine (§5) — frozen at assignment time
  approved: boolean;                 // false until player confirms (some activities auto-suggest; see §3.3)
}
```

### 2.5 `WorldClock` (extends existing `enhancedGameStore` fields)

```ts
type TimeFlow = 'Crisis' | 'Base' | 'Accelerated_Research' | 'Downtime';
// game-days advanced per ONE real day, from Time_Management.csv rows 2–5:
const TIME_FLOW_RATIO: Record<TimeFlow, number> = {
  Crisis: 15,                 // row 4  (1 real day : 15 game days)
  Base: 30,                   // row 2  (1 real day : 30 game days) — DEFAULT
  Accelerated_Research: 45,   // row 3  (1 real day : 45 game days)
  Downtime: 60,               // row 5  (1 real day : 60 game days)
};
// Existing TimeSpeed (0..4) in code is the PLAYER's manual multiplier ON TOP of the flow ratio (§6.2).
```

### 2.6 `TimeWalkerState` — the rewind economy (from FIST GDD lines 123–131, 351–391)

```ts
interface TimeWalkerState {
  sanity: number;                    // 0..100; 100 = lucid. Each PAST jump costs sanity (§7.2). 0 => madness lockout
  destinationsRemaining: number;     // save-checkpoints left; each PAST jump consumes one (FIST GDD line 126)
  pastJumpsUsed: number;             // running count (drives escalating sanity cost, §7.2)
  futureJumpAvailable: boolean;      // the one-shot impossible-odds win (FIST GDD line 131)
  walkerAbsentUntilGameDay: number | null; // set after a FUTURE jump; she's gone "days or weeks" (FIST GDD line 354)
  realignmentTasksActive: string[];  // tasks the player can run to recover sanity (FIST GDD line 127)
}
```

---

## 3. The Activity Scheduler — assign → tick → resolve

### 3.1 Duration resolution (the `'Variable'` rule)

Most activities have a fixed `Duration_Hours` from the CSV. **Seven** are `Variable` (ACT_005 Medical, ACT_007 CovertOps, ACT_014 Criminal, ACT_019 Investigation, ACT_029 Physical Recovery, ACT_030 Mental Recovery; ACT_010 Off-the-Grid is fixed 24h).

> **RULING — `Variable` duration resolution** (Bible §13: prefer one rule over three). `Variable` activities resolve their duration from the **system they hand off to**, not from this scheduler:
> - **ACT_005 / ACT_029 / ACT_030** (Medical / Physical / Mental Recovery) → duration owned by **doc 108** (Hospital). This scheduler just sets `Busy` and polls doc 108 for completion. Base reference: `ACTIVITY_HOURS.hospitalCare = 24` (existing code) per recovery day, scaled by country Healthcare (§5).
> - **ACT_007 CovertOps / ACT_019 Investigation** → duration owned by the **mission/investigation generator** (doc 02). Reference floor: `missionBriefing 2h + investigationSession 4h` (existing `ACTIVITY_HOURS`).
> - **ACT_014 Criminal** → treat as a mission (doc 02) with a legal-risk rider (§3.5).
>
> A `Variable` activity therefore stores `endsAtGameHour = null` until the owning system reports completion; the scheduler shows "Ongoing" in the UI.

Fixed durations (verbatim from `Daily_Activity_Framework.csv`, Duration_Hours column):

| Hrs | Activities (ACT id) |
|----:|---------------------|
| 3 | Vehicle Maintenance (023), Equipment Repair (027) |
| 4 | Training (002), Religious Service (013), Artistic Pursuits (016), Combat Training (026), Social Networking (028), Media Relations (021), Facility Management (024) |
| 6 | Research (003), Engineering (006), Diplomatic (008), Academic Teaching (012), Psychological (017), Investigation Analysis-prep (025), Recruitment (020), Family Time (022) |
| 8 | Personal Life (001), Patrol (004), Military Service (009), Corporate (011), Scientific Research (015), Technology Development (018) |
| 24 | Off-the-Grid (010) |

> **Consistency check:** these match the existing `ACTIVITY_HOURS` constants in `timeSystem.ts` (training 4, fullStudy/patrol 8, investigationSession 4, etc.). Where the CSV and code differ, **the CSV wins** (data-driven pillar, Bible §1.1) and the code constant is corrected to match.

### 3.2 The tick loop

The world clock (§6) advances `gameTime` in **minutes-per-tick**. On every tick:

```
for each character where status == 'Busy' and currentActivityId != null:
    if gameTime.absoluteHour >= assignment.endsAtGameHour:
        resolveActivity(character, assignment)     // §3.4
        character.status = 'Available'
        character.currentActivityId = null
    else:
        applyHourlyUpkeep(character, assignment)    // §4.2 (stamina drain, stress)
```

`applyHourlyUpkeep` runs **per game-hour crossed** this tick (not per real tick) so results are independent of `TimeSpeed`.

### 3.3 Assignment flow (player-driven vs. auto-suggested)

1. Player opens the **Roster / Daily Activities** screen (clock auto-pauses, FIST GDD line 497).
2. For a selected `Available` character, the UI lists **eligible** activities = those whose `characterRequirement`, `successRequirements`, and `factionRestriction` are met (§3.6) **and** are supported by the current city type (`CITY_ACTIVITY_SUPPORT` in existing code; `City_Type_Effects.csv`).
3. Each eligible activity shows its **resolved ±CS** (§5), duration, resource cost, and **what it can discover** (the investigation hook). Player confirms → `approved = true`, status → `Busy`.
4. **Auto-suggest (idle drift):** if a character stays `Available` past **1 game-day** with no assignment, the system uses `calculateActivityDesires(personality, health, morale)` (existing `characterLifeCycle.ts`) to pick a *default* activity and **proposes** it on the phone (a ping — doc 03 owns the wording). The player can accept or override. This is the GDD's "idle units are doing *something*" (lines 221–226). **It never auto-commits a risky/illegal activity** (ACT_007/010/014) without approval.

### 3.4 Resolution (`resolveActivity`)

On completion, roll **one Universal-Table check** (Bible §3, `Universal_Table_FIXED.csv`) for activities that have a `Success_Requirements` skill; requirement-free activities (Personal Life, Patrol, Medical, Family Time, Recovery) **auto-succeed** but still roll for their *event/outcome* table.

```
outcomeRank = lookupUniversalTable(
    actorSkillRank,                         // FASERIP rank of the gating skill (Stat_Rank_Mapping)
    columnShift = assignment.resolvedModifierCS   // net spine ±CS, frozen at assign time (§5)
)
=> one of Failed / Minor / Success / Major   (Universal_Table_FIXED result band)
```

Then apply, in order:
1. **Outcome** from `Potential_Outcomes` scaled by result band (Failed = nothing or the negative branch; Minor = 0.5×; Success = 1×; Major = 1.5× + bonus — mirrors the Stat_Rank_Mapping RESULT EFFECTS multipliers 0/0.5/1/1.5).
2. **Skill experience** (`Experience_Gained`) — applied as **skill/stat practice**, NOT character levels (Bible §13 #8: no XP leveling; growth is training-with-erosion). Hands off to the training system (doc 03 / Education_Career).
3. **Status effect** (`Status_Effects_Applied`, e.g. "Temporary fatigue") via `characterStatusSystem.ts`.
4. **Investigation hook** (`Investigation_Opportunities`) — on `Success`/`Major`, emit a **lead** to the investigation/events engine (doc 02) with probability scaled by result band.
5. **Trigger event** (`Trigger_Events`, e.g. "Training accidents possible", "Random crime encounters") — emit to the events engine (doc 02) as a *possible* encounter, gated by city Crime Index / LSWActivity (§5).

### 3.5 Risk riders (negative branches)

Several activities carry an explicit downside in the CSV that fires on `Failed` (and sometimes on `Success` in a hostile spine):

| Activity | Risk rider (CSV source) | Fires when |
|---|---|---|
| Patrol (004) | "Minor injury risk" + "Random crime encounters; Villain sightings" | `Failed`, or city Crime ≥ High (60–80) regardless |
| Training (002)/Combat Training (026) | "Training accidents possible" / "Training injuries" | `Failed` → minor injury (doc 108) |
| Covert Ops (007) | "Mission complications; Identity exposure" | `Failed` → may flip status `Undercover`→exposed |
| Criminal Activity (014) | "Legal consequences" + `factionRestriction` legal risk | `Failed` in low-Corruption / high-Law country (§5) |
| Off-the-Grid (010) | "Discovery by enemies" | `Failed` → status stays `Missing` longer |
| Engineering (006)/Eng. Work | "Equipment failures; Industrial accidents" | `Failed` → equipment damaged |

### 3.6 Eligibility predicate

A character is eligible for an activity iff **all** hold:
- `status == 'Available'` (or `'Injured'` only for ACT_005/029/030).
- `characterRequirement` satisfied — e.g. ACT_003 needs "Education level 2+" → check `education >= EDU_02` (`Education_Career_Complete.csv`); ACT_006 needs Engineering skill; ACT_008 needs Diplomacy/charisma; robots **cannot** Train (FIST GDD line 262 — Origin == Construct/Robot blocks ACT_002/026).
- `successRequirements` skill is present (else activity is greyed with the missing-requirement tooltip).
- `factionRestriction` not violated by the active faction in the current territory (`Faction_Specification.csv`).
- City supports it: `CITY_ACTIVITY_SUPPORT[cityType][category] > 0`.

---

## 4. Fatigue & Stress Upkeep

> **Why this exists:** the GDD says idle characters are "aging by the day, secretly hiding an addiction" (lines 225–226) and that "martial arts erode without training" (line 261). Upkeep is the pressure that makes downtime a *budget*, not free. It feeds the addiction/morale loops (doc 03) and the injury/hospital loop (doc 108).

### 4.1 The fatigue ladder (anchored to `Status_Effects_Complete.csv`)

The CSV defines exactly two graded fatigue states and one sleep state (rows "Tired", "Exhausted", "Sleep"):

| State | Source row | Trigger | Effect (CSV) | Recovery (CSV) |
|---|---|---|---|---|
| **Tired** | `Status_Effects_Complete` "Tired" | `stamina < 30` | **−1CS to all actions** | 4 hours rest |
| **Exhausted** | `Status_Effects_Complete` "Exhausted" | `stamina < 10` | **−2CS to all actions; movement halved** | 8 hours rest |
| **Sleep** | `Status_Effects_Complete` "Sleep" | the Sleep recovery itself | unconscious until awakened | external awakening |

These ±CS feed directly into §3.4 resolution and into combat (the same Universal-Table currency, Bible §3).

### 4.2 Stamina drain (RULING — labelled; built on CSV-anchored recovery times)

The CSV gives *recovery* times (4h Tired, 8h Exhausted) but not a *drain rate per activity-hour*. **RULING (data-driven, override from a table):** drain is proportional to activity intensity, calibrated so a full 8-hour `Physical`/`Combat` activity moves a fresh character to "Tired" exactly:

```
staminaDrainPerHour(activity) =
   { Physical, Combat, Military, Mission, Survival, Illegal:  9   // 8h → −72 → stamina 28 (Tired) ✓
     Technical, Academic, Detective, Analytical, Innovation:   6   // 8h → −48
     Political, Social, Public, Creative, Spiritual, Business:  4
     Lifestyle, Personal, Recovery (Sleep/Rest):          (negative = RESTORES, §4.3) }
```

> **RULING basis:** the 9/hr figure is derived from the CSV anchor (Tired at `stamina < 30`, fresh = 100, an 8-hour shift = the canonical "full day's work"): `(100 − 30) / 8 ≈ 8.75 → 9`. Tunable in a data table; not invented out of nothing.

### 4.3 Recovery activities (restore stamina / reduce stress)

| Activity | Restores | Source |
|---|---|---|
| **Sleep** (`ACTIVITY_HOURS.sleep = 8`, existing code) | stamina to 100; clears Tired/Exhausted | `Status_Effects_Complete` "Exhausted" recovery = 8h |
| **Short Rest** (`shortRest = 4`) | +35 stamina; clears Tired | `Status_Effects_Complete` "Tired" recovery = 4h |
| **Personal Life** (ACT_001, 8h) | "Stress relief; Relationship building" — **−stress**, **+morale** | `Daily_Activity_Framework` ACT_001 Potential_Outcomes |
| **Family Time** (ACT_022, 6h) | "Emotional stability" — −stress | ACT_022 |
| **Off-the-Grid** (ACT_010, 24h) | "Stress recovery; Hidden from enemies" — large −stress, sets `Missing` | ACT_010 |
| **Mental Recovery** (ACT_030, Variable) | "Stress reduction; Trauma healing" — owned by doc 108 | ACT_030 |

> **RULING — stress restore amounts:** Personal Life −15 stress; Family Time −10; Off-the-Grid −40 (it's 24h and isolating); these are the data-table defaults, calibrated against the stress band (>70 triggers relapse roll, §4.4). Tunable.

### 4.4 The daily upkeep penalty (the "secret addiction / erosion" pressure)

Once per game-day, for each character:
- If `daysSinceRecovery >= 3` (no Sleep/Personal/Family/Off-Grid in 3 game-days): **+1 stress/day** and a **morale tick down** (hand off to doc 03's morale).
- If `stress > 70`: roll the **addiction-relapse / secret-life** check — **owned by doc 03** (`characterLifeCycle.ts` addiction logic); this doc only *fires the trigger*.
- If `character.age` is in the elderly band (read from `characterLifeCycle.ts` aging): stamina cap reduced (RULING: −1 max-stamina per year over 60, floor 50; tunable) — the GDD's "aging by the day."
- **Erosion (RULING, GDD line 261):** any **trained** skill/martial-art not exercised by a relevant activity in **30 game-days** loses 1 rank-point (handoff to the training system, doc 03). This doc only timestamps "last trained" per skill and flags erosion; doc 03 applies it.

---

## 5. How This System Consumes the SPINE

Every activity's `resolvedModifierCS` (frozen at assignment, §2.4) is the **sum** of the spine modifiers below. **All ±CS values are verbatim from `Country_Attribute_Effects.csv` and `City_Type_Effects.csv`** — none invented.

### 5.1 Country STAT → activity modifier (per `Country_Attribute_Effects.csv`)

| Activity (type) | Driving STAT(s) | Modifier (CSV band: Low 0–35 / High 66–100) |
|---|---|---|
| Research (003) / Scientific (015) / Tech Dev (018) | `Science` | High Science: **+2CS** tech investigations & reverse-engineering; Low: **−2CS**, no advanced research |
| Research / Academic Teaching (012) | `HigherEducation` | High: **+2CS** academic & **+2CS** tech-research speed; Low: **−2CS** academic, **−1CS** tech |
| Medical Treatment (005) / Recovery (029/030) | `Healthcare` | High: **+2CS** medical, faster healing, cloning possible; Low: **−2CS** medical, **+3CS** disease-investigations |
| Covert Ops (007) / Intelligence Analysis (025) | `IntelligenceBudget` | Strong intel: **−2CS** covert, **+3CS** detection risk, better rewards; Weak: **+2CS** covert |
| Military Service (009) / Combat Training (026) | `MilitaryBudget` | Strong: **+2CS** military-equipment access (Military city −20% cost); Weak: easy infiltration, poor gear |
| Diplomatic (008) / Media Relations (021) | `MediaFreedom` | Free media: **+2CS** media investigation, **−2CS** cover-ups; Controlled: **+2CS** propaganda, **−2CS** media-investigation |
| Criminal Activity (014) / black-market | `GovernmentCorruption` | High corruption: **−2CS** official, **+3CS** bribes/blackmail; Low: **+2CS** official, **−2CS** bribes |
| Patrol (004) / Recruitment (020) | `LSWActivity`, `Population` | High LSWActivity: **+2CS** recruitment, **+2CS** LSW encounters; large Population: **+2CS** recruitment |
| Personal Life (001) / Family Time (022) | `Lifestyle` (Country.csv) | High Lifestyle → larger stress-relief & morale gain ("better lifestyle countries provide more benefits", ACT_001 CSV) |

### 5.2 Combination effects (consumed, per Bible §13 #9)

From `Country_Attribute_Effects.csv` "ATTRIBUTE COMBINATION EFFECTS":
- **Innovation Hub** (High Science + High Education): **+3CS** to all Research/Tech-Dev/Scientific activities (003/015/018).
- **Security State** (High Military + High Intel): all covert (007/025) **−2CS**, all official (008/012/020) **+2CS**.
- **Failed State** (Low Govt + High Corruption): legal activities (008/012/020/021) fail; only force/bribery (014) works → **+3CS** criminal, official methods unavailable.
- **Medical Center** (High Healthcare + High Cloning): fastest recovery (005/029/030) — exact heal-rate owned by doc 108.
- **Lawless** (High Corruption + High Crime): all criminal methods **+3CS**, no legal consequence on ACT_014 fail.

### 5.3 City type & crime/population (per `City_Type_Effects.csv`)

- **City type → activity affinity** (already in code as `CITY_ACTIVITY_SUPPORT`): e.g. Educational city → **+3CS** recruiting intelligent LSWs & **+1CS** all tech investigations (Research/ACT_003); Military city → **+3CS** military recruits, arsenal **−20%** (Combat Training/ACT_026); Industrial → Workshop enables Engineering/Repair (006/027); Temple → 24h sanctuary (pairs with Off-the-Grid/ACT_010).
- **Crime Index band** (City_Type CRIME interactions): Very High (80–100) → **−3CS** all legal methods, **+3CS** criminal, **constant combat risk** (forces Patrol/004 risk rider, §3.5).
- **Population Rating band**: Mega City (7) → all equipment, **+3CS** resources, **−3CS** stealth, **multiple simultaneous operations**; Village (2) → **+2CS** stealth, **−2CS** resources (limits resource-cost activities).

### 5.4 Faction territory (per `Country_Attribute_Effects.csv` "FACTION TERRITORY BONUSES")

The active faction's standing in the current country applies a flat shift to **all** activities: e.g. United States **home** = **+3CS all methods**; **hostile** = **−2CS all methods, −2CS equipment access**. China home = **+3CS surveillance** (boosts CovertOps/Intel). Read from `factionSystem.ts` (existing) ∪ `Faction_Specification.csv`.

### 5.5 Personality (the second spine, doc 03)

`calculateActivityDesires(personality, health, morale)` (existing code) decides **which** activity an idle character drifts toward (§3.3 auto-suggest). High `discipline` → Training/Research drift; high `riskTolerance` + `impatience` → Patrol/CovertOps drift; low health → Recovery drift. This doc consumes the *output*; doc 03 owns the *formula and the personality voice*.

---

## 6. The World Clock — real-time-with-pause

### 6.1 Two layers of time (the locked model)

1. **Flow ratio** (`TimeFlow`, §2.5): the *story-driven* game-days-per-real-day, from `Time_Management.csv`. **Base = 30** (the canonical 1:30 → 82.4 real days to the 2,472-day invasion, Bible §11). Crisis auto-engages 15:1 when a Critical event is live; Downtime 60:1 in peaceful stretches; Accelerated_Research 45:1 when a major research project is the only active task. The system **selects** the flow from world state (RULING: Crisis if any `Event_Priority_Critical` open; else Accelerated_Research if a research project is the sole active assignment; else Downtime if no open events & no missions; else Base).
2. **Player speed** (`TimeSpeed` 0..4, existing code): the *manual* multiplier the player sets — Pause / 1× / 30× / 120× / 360× (existing `TIME_SPEEDS`). This is **on top of** the flow ratio and is purely a convenience for burning real seconds; it never changes the game-day:real-day *story* ratio.

### 6.2 Pause rules (FIST GDD line 497)

- **Opening the laptop/phone auto-sets `isTimePaused = true`** — but the player may un-pause while inside (FIST GDD line 497: "time is paused but the player can restart it while in the laptop"). UI shows a pulsing "PAUSED — resume?" affordance.
- **Combat** hard-pauses the world clock (turn-based; no world time passes during a tactical fight — combat resolves "in minutes", `Time_Management.csv` row 2).
- **Event-priority response windows** (`Time_Management.csv` rows 42–46) are measured in **real time** and are NOT paused by being in the laptop beyond a grace period: Critical = **2 real hours**, High = **1 real day**, Medium = **3 real days**, Low/ Background = optional. The clock surfaces a countdown for any open Critical/High event (handoff to events engine, doc 02).

### 6.3 The tick

```
on real-time tick (interval = TIME_SPEEDS[timeSpeed].tickInterval):
    if isTimePaused or inCombat: return
    gameMinutesAdvanced = TIME_SPEEDS[timeSpeed].minutesPerTick   // existing
    advanceGameTime(gameMinutesAdvanced)                          // existing advanceNewTime()
    runActivitySchedulerTick()                                    // §3.2
    runHourlyUpkeepForCrossedHours()                              // §4.2
    runDailyUpkeepIfNewDay()                                      // §4.4
    decrementResponseWindows(realDeltaMs)                         // §6.2
```

---

## 7. The Time-Travel Rewind Economy (the signature)

> The only save/load in SHT (Bible §11; FIST GDD lines 123–131, 351–391). It must be **tense, not a brick wall**: the player can always rewind, but every rewind costs the Time Walker (Sandra Locke) sanity and shrinks the set of places she can reach.

### 7.1 Two directions

- **PAST jump = load a checkpoint** (FIST GDD lines 125–127). "The player just took a devastating loss on Day 25… does the player go back to Day 2 or Day 24." → present the player the list of `destinationsRemaining` checkpoints; jumping consumes one and rewinds world state to it.
- **FUTURE jump = the impossible-odds win** (FIST GDD lines 130–131). "Send the Time Walker to the future… your enemies are instantly vanquished." One-shot; immediately resolves a hopeless combat/mission as a win, **at the cost of losing the Time Walker** (`futureJumpAvailable=false`, she's absent until `walkerAbsentUntilGameDay`, returns "changed" — cyborg arm / warning / duplicate teammate, FIST GDD line 390).

### 7.2 The sanity & destination economy (RULING — labelled, FIST-grounded)

The GDD states the *mechanic* (each jump → closer to madness, fewer destinations; tasks realign and recover sanity) but **no numbers**. RULING (all tunable from a data table):

```
PAST jump cost:
  sanityCost(n)  = 10 + 5 * pastJumpsUsed      // escalating: 1st jump −10, 2nd −15, 3rd −20 …
  destinationsRemaining -= 1                    // FIST GDD line 126 (fewer destinations each use)
  if sanity - sanityCost <= 0:  MADNESS LOCKOUT // no further PAST jumps until realignment (§7.3)

Starting values (campaign): sanity = 100, destinationsRemaining = 5, pastJumpsUsed = 0.
```

> **RULING basis:** 5 starting checkpoints + escalating 10/15/20/25/30 sanity cost means a player can panic-rewind ~4–5 times before lockout — tense, not a wall. The escalation makes the *first* rewind cheap (forgiving early mistakes) and the *fifth* nearly fatal (forces the player to live with consequences late-game), matching the GDD's "deal with the consequences of failure" intent (line 387). All five constants live in one data table.

### 7.3 Realignment (recovering sanity — FIST GDD line 127)

"The player can complete real tasks to realign the time path and regain her sanity." → `realignmentTasksActive` are special objectives (handoff to the events/mission engine, doc 02) that, on completion, **restore sanity** (RULING: +20 sanity per realignment task, and +1 `destinationsRemaining` per *two* tasks, cap at starting 5). This gives a *way out* of madness lockout without making rewinds free.

### 7.4 Checkpoint creation

Checkpoints (the "destinations") are created **automatically** at narrative beats (mission start, day rollover, major fork-in-the-road) — NOT on a manual "Save" button (saving *is* time travel, there is no normal save, Bible §11). A checkpoint snapshots full world+roster+clock state. `destinationsRemaining` caps how many are *reachable*, not how many exist.

### 7.5 Multiplayer hook (stub only)

The FUTURE jump is where MP lives ("the time-traveler's other dimension", task brief). **Design now:** when `futureJumpAvailable` is spent, the snapshot handed to the future-resolution function is the **same payload** an MP "other-dimension" call would consume. Build the single-player future-jump as a local function with that payload shape; MP later swaps the implementation. **Do not build MP.**

---

## 8. Edge Cases & Failure Modes

| # | Case | Handling |
|---|---|---|
| 1 | Activity assigned, then character is wounded mid-activity by a travel/event encounter | Interrupt: cancel assignment, status → `Injured`, partial outcome on `Minor` band, refund no resources. |
| 2 | `Variable` activity whose owner system (doc 02/108) never reports completion (stuck) | Watchdog: after `2× expected` game-hours, force-resolve as `Failed` and free the character (logged). |
| 3 | Player un-pauses in laptop, an activity completes while UI is open | Resolve silently; surface a phone ping (doc 01) rather than a modal, so the laptop session isn't interrupted. |
| 4 | Robot/Construct character sent to Train (ACT_002/026) | Blocked at eligibility (§3.6, FIST GDD line 262: "robots cannot train"); greyed with tooltip. |
| 5 | Character on Off-the-Grid (`Missing`) when a Critical event needs them | Cannot respond (Time_Management row 39); event must be solved by others or expires — this is the *cost* of hiding. |
| 6 | Stamina hits 0 during a forced activity | Clamp to 0; apply Exhausted (−2CS, half move); next assignment must be a Recovery (UI nudges Sleep). |
| 7 | PAST jump requested at `destinationsRemaining == 0` or madness lockout | Block with the realignment prompt (§7.3); never silently fail — explain *why* (tense, not opaque). |
| 8 | FUTURE jump used, then player wants to rewind while Walker is absent | All time travel disabled until `walkerAbsentUntilGameDay` (FIST GDD line 131); UI shows her ETA. |
| 9 | Flow ratio flips Crisis↔Downtime mid-activity | Activity durations are in **game-hours** (absolute), so a flow change only alters *real* pacing, never the activity's game-time length. No recompute needed. |
| 10 | Two activities both want the same scarce resource (one workshop, one budget) | Resource is reserved at assignment (`resourceCost` debited up front); second assignment sees it unavailable. |
| 11 | Character dies during an activity (e.g. Patrol injury cascade) | Status → `Dead`; hand to doc 108 (funeral/clone). Activity cancelled, no outcome. |
| 12 | City changes type/crime mid-activity (world-state event) | `resolvedModifierCS` is **frozen at assignment** (§2.4) — the character committed under the old conditions; the change applies to the *next* assignment only. |

---

## 9. UI / UX Hooks

### 9.1 Phone (doc 01 owns the surface; this doc supplies the data)
- **Idle pings:** "becoming familiar with the city / texting concerns / hiding an addiction" (FIST GDD lines 221–226) — emitted by §3.3 auto-suggest & §4.4 upkeep; doc 03 writes the words.
- **Activity-complete pings:** non-modal notification with outcome band + any investigation lead (§8 case 3).
- **Response-window countdowns:** Critical 2h / High 1d badges (§6.2).

### 9.2 Laptop — "Roster / Daily Activities" screen
- One row per character: portrait, **Status badge** (8 colors for the 8 states), current activity + ETA bar, **stamina** and **stress** meters (the fatigue ladder colors at <30/<10).
- Click an `Available` character → activity picker (§3.3) showing eligible activities, each with **resolved ±CS, duration, cost, "can discover…"**.
- A **"Recommended"** chip on the auto-suggested activity (from `calculateActivityDesires`).
- Greyed ineligible activities with the missing-requirement tooltip (§3.6).

### 9.3 World clock widget (extends existing `TimeDisplay.tsx`)
- Day counter + **countdown to invasion** (2,472 − day), the canonical pressure.
- **Flow indicator** (Crisis/Base/Accel/Downtime) + the manual **speed control** (Pause/1×/30×/120×/360×, existing `TIME_SPEEDS`).
- Auto-pause indicator when laptop is open ("PAUSED — resume?").

### 9.4 Time-Walker panel (new)
- **Sanity meter** (0–100) and **destinations remaining** dots (●●●○○).
- PAST-jump = a checkpoint list with each jump's **sanity cost preview** (§7.2) before confirming.
- FUTURE-jump = a single dramatic button, disabled with "Sandra returns Day N" while absent.
- Active **realignment tasks** with their sanity reward (§7.3).

### 9.5 Combat overlay (read-only)
- The fatigue ±CS (Tired/Exhausted) shows on the unit's modifier stack alongside cover/altitude (same ±CS currency, Bible §3) — so the player sees *why* a tired merc is shooting worse.

---

## 10. Integration Points (reads / writes)

| Direction | System | Interaction |
|---|---|---|
| **reads** | doc 03 Personality | `calculateActivityDesires` (idle drift), morale, addiction-relapse trigger consumer |
| **reads** | doc 05 Travel | sets `Traveling` status, reads ETA; does not compute travel time |
| **reads/writes** | doc 108 Hospital/Death | routes Injured→ACT_005, polls recovery; receives `Dead` on activity death |
| **writes** | doc 02 Events/Investigations | emits `Trigger_Events` + `Investigation_Opportunities` leads; emits realignment-task completions |
| **reads** | Spine (Country/City/Faction) | all `resolvedModifierCS` inputs (§5) |
| **reads** | `Education_Career_Complete` | gates ACT_003/012/015/018 by education tier; Training writes skill practice |
| **reads/writes** | `enhancedGameStore` | `gameTime`, `timeSpeed`, `isTimePaused`, `squadStatus`; new `timeWalker`, per-char mgmt fields |
| **writes** | doc 01 Phone | idle pings, activity-complete notifications, response-window countdowns |
| **reads** | Combat layer | injects Tired/Exhausted ±CS into the modifier stack; hard-pauses clock during a fight |
| **stub** | doc 107 Multiplayer | FUTURE-jump payload shape == MP "other-dimension" call (§7.5); not implemented |

---

## 11. RULING Notes (collected)

1. **State vs. verb (§2.1):** `Time_Management`'s 8 machine-states are canonical; GDD "Status verbs" are activities. "Ready" == "Available" — use `Available`. Running an activity sets `Busy` (or Traveling/Undercover/Missing).
2. **`Variable` duration (§3.1):** resolves from the owning system (Hospital/doc 108, Missions/doc 02), not from this scheduler; stored as "Ongoing" until that system reports done.
3. **CSV wins over code constants (§3.1):** where `ACTIVITY_HOURS` and `Daily_Activity_Framework.csv` disagree, the CSV is truth (data-driven pillar).
4. **Stamina drain rate 9/6/4 per hour (§4.2):** derived from the CSV "Tired at <30" anchor over an 8-hour shift; not invented; lives in a tunable table.
5. **Stress-restore amounts (§4.3):** Personal −15 / Family −10 / Off-Grid −40, calibrated to the >70 relapse threshold; tunable.
6. **Skill erosion at 30 game-days un-practiced (§4.4):** quantifies GDD line 261 ("martial arts erode without training"); doc 03 applies the rank loss.
7. **Flow-ratio auto-selection (§6.1):** Crisis if any open Critical event; else Accelerated_Research if a research project is the only task; else Downtime if idle; else Base. Player speed (0–4) is independent.
8. **Rewind economy constants (§7.2):** sanity 100 start, 5 destinations, escalating 10+5n sanity cost; +20 sanity / +1 destination-per-2-tasks on realignment. Tense by design; all in one table.
9. **Checkpoints are auto-created at narrative beats, never via a Save button (§7.4)** — saving *is* time travel (Bible §11).
10. **No XP leveling (§3.4):** activity `Experience_Gained` is skill/stat practice routed to training, never character levels (Bible §13 #8).

---

## 12. OWNER-FORK Notes (product choices only the owner should make)

1. **OWNER-FORK — rewind generosity curve.** §7.2's "5 destinations, 10+5n sanity cost" is the *tense* default. Owner may prefer **forgiving** (8 destinations, flat 8 cost — more save-scummy, gentler) or **brutal** (3 destinations, 20+10n — near-permadeath roguelike). This single choice reshapes the game's difficulty identity; it is the owner's call.
2. **OWNER-FORK — does un-pausing inside the laptop ever expire a Critical event?** §6.2 says response windows tick in real time. Owner may instead want the laptop to **fully freeze** Critical countdowns (pure puzzle pacing) vs. the current "grace period then it burns" (pressure pacing). Affects how stressful the meta-layer feels.
3. **OWNER-FORK — auto-suggest aggressiveness.** §3.3 proposes a default activity after 1 idle game-day. Owner may want **full automation** (idle characters auto-commit to their top desire, JA2-"sleep through the night" style) vs. the current **propose-only** (player must confirm). Trade-off: micromanagement vs. control.
4. **OWNER-FORK — should the FUTURE jump be once-per-campaign or rechargeable?** §7.1 specs one-shot. Owner may make it rechargeable after N realignment tasks, changing it from a "break glass in emergency" finale tool to a repeatable strategy.
5. **OWNER-FORK — elderly stamina decay (§4.4).** The "−1 max-stamina per year over 60" RULING makes aging mechanically punishing. Owner may prefer aging be **purely cosmetic/narrative** (the GDD's "aging by the day" as flavor only) to avoid pressuring the player to retire veteran mercs.

---

## 13. Open Questions

1. **Multi-day activities & day-rollover events.** An 8-hour activity is intra-day, but recovery/hospital (Variable) spans days. Does the daily upkeep (§4.4) run *while* a character is mid-Hospital (probably not — they're being cared for)? Proposed: Hospitalized/Injured characters are **exempt** from stress upkeep but still age. Confirm with doc 108.
2. **Concurrent activities per character.** Spec assumes **one activity at a time** (status is single-valued). Should a character be able to "Patrol by day, Personal Life by night" within one game-day? Current answer: no (one assignment occupies the character until done) — but the 8-hour activities leave 16 hours nominally free. Do we model a 24-hour day-planner, or is "one activity = one day" the abstraction? **Recommend** the simpler "one activity blocks the character until it completes" for v1; revisit if playtests find it too coarse.
3. **Does `TimeSpeed` (player multiplier) interact with response-window real-time?** If the player runs 360× to burn time, do Critical 2-real-hour windows also compress? Proposed: response windows are **wall-clock real time**, unaffected by TimeSpeed (they're a "respond now or lose it" pressure). Confirm with doc 02.
4. **Checkpoint storage cost.** Auto-checkpoints at every narrative beat could be many full snapshots. Engineering question for the save system: ring-buffer of the last K reachable checkpoints vs. full history. Out of design scope, flagged for the build.
5. **Undercover (ACT_007 → `Undercover` status) availability.** Time_Management row 41 says "limited availability." What *can* an Undercover character still do — accept new CovertOps only, or nothing until extracted? Proposed: only CovertOps continuation + emergency recall; confirm with doc 02.
