# 111 — Alien-Invasion Endgame & Win/Loss Conditions

> **System owner doc.** Build-ready spec for the campaign's terminal arc: the 2,472-day countdown to the Grey armada, the escalation that telegraphs it, the final defense, and every way the campaign can be **won or lost**.
>
> **Status:** design-complete, unbuilt. The story frame exists (Bible §12, FIST GDD); the *system* that turns "armada arrives in 2,472 days" into win/loss states did **not** exist before this doc.
>
> **Primary sources (read these first):**
> - `SHT_MECHANICS_BIBLE.md` §0, §10, §11, §12, §13 (rulings)
> - `SuperHero Tactics/FIST GDD v02.txt` (countdown story, Time Walker save, Point of Interest news, robot/zombie invasion, off-world maps)
> - `SuperHero Tactics/SHT__ Origins, Threat Levels & Powers.txt` (LeFevre threat scale L1–L5+, PCF/STAM/SPAM)
> - `docs/csv-source-data/Time_Management.csv` (time ratios, crisis time, off-world travel)
> - `docs/csv-source-data/Player_Scaling.csv` (6 tiers, threat caps, mission XP, enemy types)
> - `docs/csv-source-data/Dynamic_Political_Events.csv` (POL_005 UN treaty, crisis escalation tiers, relationship modifiers)
> - `docs/csv-source-data/World_State_Tracking_System.csv` (crisis pipeline, escalation tracking, LSW census)
> - `docs/csv-source-data/Public_Perception.csv` (reputation/cost/legal deltas; "Mass_Destruction", "Time_Travel_Success")
> - `docs/csv-source-data/Scenario_Templates.csv` (SCEN_016 Cosmic Battle, SCEN_020 Veteran Showcase, Victory_* conditions, Environment_Space_Station / Environment_Alien_World)
> - `docs/csv-source-data/Game_Mechanics_Spec/Universal_Table_FIXED.csv` (resolution bands; the one chart)
> - `docs/csv-source-data/AI_Generated_Political_Scenarios.csv` (Alien_Contact, Diplomatic_Summit, Space_Race templates)
> - World Bible `Country.csv` / `Cities.csv` headers (spine stat columns)
> - Existing code: `MVP/src/data/doomClockSystem.ts` (sibling crime clock — must NOT collide), `MVP/src/data/timeEngine.ts` / `timeSystem.ts` (GameTime, day counter), `enhancedGameStore.ts`

---

## 1. Overview & Player Fantasy

You are not playing to "clear the map." From Day 0 a **doom horizon** sits at the top of every screen: a number that only goes down. **In 2,472 game-days the Grey armada arrives** (Bible §12; FIST GDD line 109). Everything you do — recruiting LSWs, training, building tech, courting nations, surviving collateral lawsuits — is implicitly a race to be *ready* when that number hits zero.

The fantasy has three movements:

1. **The long dread (Days 0 → ~1,800).** The countdown is mostly background. You run the JA2/CK game (missions, politics, the phone). The **"Point of Interest" international news** drip-feeds telegraphs — the same channel that "shows troop buildups before China invades Taiwan" (FIST GDD line 510) now shows **abduction spikes, sky anomalies, Grey artifacts**. The world *talks to you* about what's coming.

2. **The escalation (Days ~1,800 → 2,472).** The Greys stop hiding. **Invasion Phases** fire as scripted world-state crises (Bible §6.5; `Dynamic_Political_Events` POL_005 "cosmic threat level reached"; `World_State_Tracking_System` Crisis_Event_Pipeline). The UN convenes the **LSW Threshold Treaty** revision summit (POL_005). Your **readiness** — measured from your roster, tech, and the planet's collective defense — determines how hard the finale is.

3. **The choice at zero (Day 2,472, or earlier via Time Walker).** The campaign resolves into a **named terminal state**: a defensive finale battle (or chain of battles) you can WIN, LOSE, or — the signature SHT move — **the Time Walker (Sandra Locke) goes to the future and the armada is "instantly vanquished, she has changed your future"** at the cost of temporarily losing time travel (Bible §11; FIST GDD line 131). The future-jump is the *win against impossible odds* — but it is **gated by readiness**, so it can't be used as an escape hatch from a hopeless campaign without consequences.

**Why this is on-vision:** the endgame is delivered through the **phone (news + email), the world-map (where the armada appears), and the laptop (the countdown widget + summit dialogue)** — combat is one verb, fired only for the finale battles. It honors "a living world that talks to you": the world escalates on its own clock whether or not the player acts (Bible Pillar 4).

---

## 2. Data Schema (fields/types)

All numbers live in data tables so they can be rebalanced without code (Pillar 1). New tables introduced by this system are listed under **§3 Source-of-truth tables**; the runtime state below is what the store holds.

### 2.1 `InvasionEndgameState` (new store slice — `MVP/src/data/invasionEndgame.ts`)

```ts
export interface InvasionEndgameState {
  // --- Countdown (the doom horizon) ---
  invasionDay: number;            // 2472 = arrival day (campaign day index). SOURCE: Bible §12, FIST line 109
  startDay: number;               // day index when campaign began (usually 0)
  currentDay: number;             // derived from GameTime day counter (timeSystem.ts)
  daysRemaining: number;          // = invasionDay - currentDay (clamp >= 0)
  arrived: boolean;               // currentDay >= invasionDay AND not pre-empted

  // --- Phase progression (escalation ladder) ---
  currentPhase: InvasionPhaseId;  // see §3.1; advances by day-thresholds + crisis triggers
  phasesFired: InvasionPhaseId[]; // idempotency guard (fire each phase once)

  // --- Readiness (0-100; the score that gates the finale) ---
  readiness: number;              // 0-100 composite; see §4 formula
  readinessBreakdown: {
    rosterScore: number;          // 0-40  (team threat-level & size)
    techScore: number;            // 0-20  (research/tech tree completion)
    globalDefenseScore: number;   // 0-25  (planet's collective prep: allied nations + treaty)
    fameScore: number;            // 0-15  (global reputation -> recruit/cooperate ceiling)
  };

  // --- Terminal state ---
  outcome: EndgameOutcome;        // 'in_progress' | one of §6 named states
  outcomeResolvedDay: number | null;

  // --- Time Walker future-jump (the win-against-odds path) ---
  futureJumpAvailable: boolean;   // readiness >= FUTURE_JUMP_MIN_READINESS (§5)
  futureJumpUsed: boolean;        // one-shot per campaign by default (OWNER-FORK §9)
  timeWalkerAbsent: boolean;      // shared flag with save/time-travel system (Bible §11)

  // --- Finale battle chain ---
  finaleBattles: FinaleBattleDescriptor[]; // generated from readiness tier (§6.3)
  finaleBattleIndex: number;                // which battle we're on (0-based)
}

export type InvasionPhaseId =
  | 'P0_dread'        // Days 0..1199        (background)
  | 'P1_signs'        // Days 1200..1799     (Point-of-Interest telegraphs)
  | 'P2_contact'      // Days 1800..2099     (first overt Grey contact; UN summit)
  | 'P3_vanguard'     // Days 2100..2399     (scout/harvester incursions; off-world option)
  | 'P4_armada'       // Days 2400..2471     (armada visible; final mobilization)
  | 'P5_arrival';     // Day 2472            (finale battle chain)

export type EndgameOutcome =
  | 'in_progress'
  | 'WIN_defense'         // finale battle chain cleared on Earth
  | 'WIN_future_jump'     // Time Walker rewrote the future (impossible-odds win)
  | 'WIN_diplomatic'      // treaty/diplomacy path averted invasion (OWNER-FORK §9)
  | 'LOSS_overrun'        // finale lost OR Day 2472 reached with readiness < FLOOR
  | 'LOSS_extinction'     // catastrophic: planet collective defense collapsed pre-arrival
  | 'LOSS_timewalker_mad';// save/sanity system bottomed out (cross-system, Bible §11)
```

### 2.2 `InvasionPhase` (data row — `invasionPhases` table)

```ts
export interface InvasionPhase {
  id: InvasionPhaseId;
  dayStart: number;               // inclusive
  dayEnd: number;                 // inclusive
  label: string;                  // UI countdown banner label
  newsChannel: 'point_of_interest' | 'ANN' | 'both';  // FIST line 510-513
  newsTemplateIds: string[];      // telegraph headlines (links to newsTemplates.ts)
  emailTemplateId: string | null; // priority briefing email (Bible §7.1)
  crisisEventId: string | null;   // Dynamic_Political_Events row to fire (e.g., POL_005)
  worldEffects: PhaseWorldEffect[];  // stat changes applied to countries/cities on entry
  unlocks: string[];              // gameplay unlocks (e.g., 'off_world_travel', 'cosmic_tech')
  threatLevelCapBump: number;     // raises encounter threat cap (Player_Scaling)
}

export interface PhaseWorldEffect {
  scope: 'global' | 'country' | 'city_type' | 'culture';
  targetSelector: string;         // e.g. 'all', countryCode, 'Military', cultureCode
  stat: string;                   // a Country/City column name (§ spine)
  delta: number;                  // signed
  durationDays: number | null;    // null = permanent for rest of campaign
}
```

### 2.3 `FinaleBattleDescriptor` (generated per campaign)

```ts
export interface FinaleBattleDescriptor {
  index: number;
  name: string;                   // e.g. "Harvester Beachhead — Lagos"
  environmentId: string;          // Scenario_Templates Environment_* id
  victoryCondition: VictoryConditionId; // Scenario_Templates Victory_* (§3.4)
  enemyComposition: FinaleEnemyWave[];
  enemyThreatCap: 'L3' | 'L4' | 'L5' | 'L5plus';  // Player_Scaling threat caps
  turnLimit: number | null;       // Victory_Survival uses this
  civilianPresence: boolean;      // Scenario_Templates Special_Rule_Civilian_Rescue
  modifiersFromReadiness: number; // ±CS to player units (§6.3)
}

export interface FinaleEnemyWave {
  enemyTypeId: string;            // 'grey_scout' | 'grey_harvester' | 'grey_warform' | ...
  count: number;
  threatLevel: 'L3' | 'L4' | 'L5' | 'L5plus';
}
```

> **RULING — invasion enemy roster.** The source data names the antagonist ("Greys", FIST line 109/321) and the *threat scale* (L1–L5+, `Player_Scaling` Enemy_Cosmic_Entity = "Threat Level 5+"), and the GDD explicitly wants a **robot invasion and zombie invasion** reusable via time travel (FIST line 618). It does **not** stat individual Grey unit types. **Ruling:** Grey finale enemies reuse the existing combat unit pipeline; their stats are authored as ordinary characters at the threat levels above (Enemy_Cosmic_Entity = L5+, Enemy_Global_Threat = L4-5 per `Player_Scaling`), with origin **Alien/Cosmic** (Bible §4: "Alien/Cosmic/Divine gated by artifacts/equals"). The three named tiers — `grey_scout` (L3), `grey_harvester` (L4), `grey_warform` (L5/L5+) — are placeholders for the writing team; only their **threat-level cap** is mechanically load-bearing here.

---

## 3. Exact Numbers, Tables & Formulas (each cited)

### 3.1 The countdown — `invasionDay = 2472`

| Constant | Value | Source |
|---|---|---|
| `INVASION_DAY` | **2472** game-days | Bible §0/§12 ("2,472-day countdown"); FIST GDD line 109; `Time_Management.csv` row Base_Time_Flow ("meaningful 2472-day countdown") |
| Real-time-to-arrival (default speed) | **82.4 real days** | `Time_Management.csv` Base_Time_Flow: "82.4 real days" at 1:30 |
| Time ratio (default) | **1 real day : 30 game days** | `Time_Management.csv` Base_Time_Flow `1:30` |
| Time ratio (crisis) | **1 real day : 15 game days** | `Time_Management.csv` Crisis_Time `1:15` ("during major crises") |
| Time ratio (downtime) | **1 real day : 60 game days** | `Time_Management.csv` Downtime `1:60` |

> **RULING — crisis time auto-engages in escalation.** `Time_Management` defines Crisis_Time (1:15) "during major crises or emergency situations" but does not say what auto-triggers it. **Ruling:** when `currentPhase >= 'P2_contact'`, the world clock's *default* ceiling drops to Crisis_Time (1:15) so the finale doesn't blow past in a real-afternoon; player speed control still applies under that ceiling (real-time-with-pause is locked design). This converts the last ~672 game-days (≈ 44.8 real days at 1:15) into the dramatic stretch.

### 3.2 Phase ladder (day thresholds)

Phases advance on **whichever comes first**: the day threshold, or a triggering crisis event. Day windows below are a **RULING** (the source gives the endpoints 0 and 2472 and the *fact* of escalating telegraphs, not the internal boundaries):

| Phase | Day window | Real-time @1:30 | What fires |
|---|---|---|---|
| `P0_dread`    | 0 – 1199    | 0 – 40.0 rd  | Background. Occasional "Point of Interest" oddities (abductions). |
| `P1_signs`    | 1200 – 1799 | 40.0 – 60.0 rd | Telegraph headlines escalate; first priority email from FIST command. |
| `P2_contact`  | 1800 – 2099 | 60.0 – 70.0 rd | **Overt first contact** (`AI_Generated_Political_Scenarios` Alien_Contact). UN summit (POL_005). Crisis time engages. |
| `P3_vanguard` | 2100 – 2399 | 70.0 – 80.0 rd | Scout/harvester incursions become live missions. **Off-world travel unlocks** (FIST line 606-615; `Time_Management` Travel_Off_World). |
| `P4_armada`   | 2400 – 2471 | 80.0 – 82.4 rd | Armada visible on world-map. Final mobilization. Readiness locks for finale tiering at Day 2460. |
| `P5_arrival`  | 2472        | 82.4 rd | Finale battle chain (§6.3). |

> **RULING:** boundaries chosen so the back third (Days 1800-2472, the "Crisis_Escalation_Global" zone of `Dynamic_Political_Events`) is the visible endgame, matching `Player_Scaling` Tier 5–6 where threat caps reach L4-L5+ and missions include "Alien encounters; Reality threats" (Tier 5) / "Universal threats" (Tier 6).

### 3.3 Phase world effects (cited to spine tables)

Each phase, on entry, applies `PhaseWorldEffect` rows. The deltas trace to existing systems:

| Phase | Effect | Magnitude | Source justification |
|---|---|---|---|
| P2_contact | Global `MediaFreedom` censorship pressure; `LSWRegulations` tighten | regulations +10 global | `Dynamic_Political_Events` POL_005 ("LSW Treaty revision … faction authority redefinition") + POL_013 registration crisis |
| P2_contact | UN summit modifies faction relations | per-choice ±1..±3 | `Dynamic_Political_Events` Relationship_Modifier_Positive_Action (+1..+3) / Negative (−1..−5) |
| P3_vanguard | Incursion city suffers stat drop (cf. doomClock crisis precedent) | −20 to all stats, 4 weeks (28 days) | `doomClockSystem.ts` THRESHOLD_EVENTS 75% ("−20 to all stats for 4 weeks") — reuse this magnitude for consistency |
| P3_vanguard | `Military` budget mobilization (allied nations) | +15 Military, permanent | `World_State_Tracking_System` Military_Buildup_Tracking ("military buildups based on threat perception") |
| P4_armada | Global panic: `Lifestyle`/`SocialDevelopment` drop, `crimeIndex` rise | Lifestyle −10, crimeIndex +15 global | `World_State_Tracking_System` Public_Opinion_Tracking + Cultural_Movement_Tracking ("fear factors") |

> **RULING:** the −20/4-week magnitude is borrowed from the existing `doomClockSystem` 75% event so the two clocks feel like one world. All other magnitudes are scaled to the existing reputation/relation deltas in `Public_Perception` / `Dynamic_Political_Events` rather than invented.

### 3.4 Finale victory conditions (cited)

Finale battles use `Scenario_Templates.csv` victory conditions verbatim:

| Condition id | Rule | Source row |
|---|---|---|
| `Victory_Defeat`    | Reduce enemy wave to 0 HP/unconscious | `Scenario_Templates` Victory_Defeat |
| `Victory_Objective` | Destroy the harvester / hold the beacon (objective > kills) | Victory_Objective |
| `Victory_Survival`  | Survive `turnLimit` turns until reinforcements | Victory_Survival |
| `Victory_Escape`    | Evacuate civilians off the board | Victory_Escape |

Finale environments use `Scenario_Templates` Environment rows: **Environment_Populated_Area** (beachhead), **Environment_Space_Station** ("Station destruction kills everyone"), **Environment_Alien_World** ("Reality-altering destruction possible") — the last two only when off-world travel unlocked in P3.

The cosmic-tier showcase battle uses **SCEN_016 Cosmic Scale Battle** ("Prevent reality destruction", "Cosmic consequence rules") and **SCEN_020 Veteran Showcase** ("Save the world", "All advanced rules active") as authored templates.

### 3.5 Resolution remains the one chart

All finale combat resolves on **`Universal_Table_FIXED`** (Bible §13 ruling #1). No new resolution math. Readiness only injects **±CS** into player units (the universal currency, Bible §3.3) — see §6.3. L5+ Grey units sit at **Amazing/Monstrous+ ranks** on the FASERIP ladder (`Universal_Table_FIXED` columns), which is why a low-readiness roster is mechanically overwhelmed (Major-success rates of 60-80% against under-ranked defenders).

---

## 4. How It Consumes the SPINE (country/city/personality → readiness)

Readiness is the gate for everything terminal. It is a **composite of the spine**, computed each `week_change` tick and at Day 2460 (the lock). All inputs are real columns from World Bible `Country.csv` / `Cities.csv` and existing systems.

```
readiness = rosterScore + techScore + globalDefenseScore + fameScore   // 0..100
```

### 4.1 `rosterScore` (0–40) — your team

```
rosterScore = clamp( Σ over active roster of threatWeight(unit) , 0, 40 )
threatWeight(unit):  Alpha=1, L1=2, L2=4, L3=7, L4=11, L5=16, L5+=22
```
- Threat levels and their meaning are the **LeFevre scale** (`SHT__ Origins, Threat Levels & Powers.txt` lines 120, 222-245; Bible §4). Weights are a **RULING** chosen so a single L5+ ≈ 22 and a balanced 8–15-unit Tier-6 team (Bible §10) tops out the 40 band.
- Initiative/threat bonus of **+5 per threat level** (Bible §4) confirms the scale is linear-ish; weights front-load the top end because L5+ ("destroy entire planets", source line 245) is categorically the asset that matters vs an armada.

### 4.2 `techScore` (0–20) — research / tech tree

```
techScore = round( 20 * (completedCosmicTechProjects / totalCosmicTechProjects) )
```
- Tech-unlock rate is driven by the spine's **Research-speed combined effect** = `Science + Education + GDP + Cyber` (Bible §8 "Research speed"; `World_State_Tracking_System` Technology_Development_State). High-science nations (`Country.csv` columns `Science`, `HigherEducation`, `GDPNational`, `CyberCapabilities`) let you complete cosmic/alien-tech projects faster.
- "Alien_Technology_Recovery" gives **+25 Global Science Reputation** and "Access to cosmic-level technology" (`Public_Perception.csv`) — recovering Grey tech in P3 directly feeds `techScore`.

### 4.3 `globalDefenseScore` (0–25) — the planet, not just you

This is the *living world* contribution — the spine at planetary scale:

```
globalDefenseScore = clamp(
    0.15 * avg(allies.Military)            // allied-nation military readiness
  + 0.10 * avg(allies.Science)             // global tech base
  + treatyBonus                            // 0..10, from UN summit outcome (POL_005)
  , 0, 25)
```
- `allies` = countries at **Home/Ally** standing to the player faction (Bible §6.4 faction territory overlay; `Faction_Relationships_Complete`). Hostile nations contribute 0.
- `Military` and `Science` are `Country.csv` columns. The averages are **RULING**-weighted (0.15/0.10) to keep the band ≤ 25.
- `treatyBonus` is set by the **UN LSW-Treaty summit** (POL_005): a "Support stronger regulations / coordinated cosmic threat response" outcome grants up to +10 (`Dynamic_Political_Events` POL_005 "Cosmic threat response coordinated"); "Withdraw from treaty" grants 0 and damages ally relations (−1..−5).

### 4.4 `fameScore` (0–15) — reputation ceiling

```
fameScore = clamp( round( globalReputation / 10 ), 0, 15 )   // globalReputation 0..150 scale
```
- Fame "gates recruitment, prices, mission access" (Bible §9; `Public_Perception`). High fame → you could recruit the world's best LSWs before Day 2472; mass civilian harm (`Public_Perception` "Civilian_Casualties_Major" −10 global, "Mass_Destruction" −100 global) tanks `fameScore` and with it your finale.
- Uses the existing `reputationSystem.ts` global value.

### 4.5 Personality consumption (finale AI + summit)

- **Finale enemy AI** uses **`PERSONALITY TARGET SELECTION`** (Bible §5.10): Grey warforms are authored with an aggressive/"major-threat" target preference, so they focus your highest-damage LSW first — making roster *composition* (not just raw score) matter.
- **The UN summit** (POL_005) and any FITR endgame choices read the player faction's **signature method** and the relations matrix; a faction with strong diplomatic standing (India/Establishment 24, Bible §6.4) gets better `treatyBonus` access.

---

## 5. The Time Walker Future-Jump (win-against-impossible-odds)

The signature SHT victory. Sending **Sandra Locke** to the future "instantly vanquishes your enemies — she has changed your future" at the cost of "temporarily losing the ability to time travel" (Bible §11; FIST GDD lines 131, 354, 388).

| Constant | Value | Source / ruling |
|---|---|---|
| `FUTURE_JUMP_MIN_READINESS` | **60** /100 | **RULING.** Must be high enough that the jump is *earned*, not an escape hatch from a doomed campaign (Bible §11: "win against impossible odds", not "win from nothing"). 60 = roster + tech + some global prep. |
| Time-travel lockout on use | **days to weeks**, random | FIST GDD line 354/380 ("returns in days or weeks"); model as **7–28 game-days** absent |
| Return side-effects | cyborg arm / betrayal warning / +1 power / duplicate teammate | FIST GDD lines 132, 388-390 — fire one at random on return |
| Sanity cost | shared with save/time-travel system | Bible §11 ("each jump drives the Time Walker toward madness") |

**Mechanics:**
- `futureJumpAvailable = readiness >= 60 AND currentPhase >= 'P4_armada' AND !timeWalkerAbsent`. (Gating it to P4 keeps it a *finale* move, not a Day-100 cheat.)
- On use during P4/P5: outcome immediately resolves to **`WIN_future_jump`**; the finale battle chain is skipped ("enemies are instantly vanquished").
- **Cost that makes it tense, not a brick wall** (locked design): time travel (the save system) is **disabled** for the lockout window, and the Time Walker returns *changed*. If the player has been leaning on past-jumps (save-scumming) and the Walker's sanity is already low, the future-jump may push her to **`LOSS_timewalker_mad`** instead of a clean win — the cross-system failure mode below.

> **RULING — interaction with the diegetic save.** The save/load = past-time-travel system (Bible §11) and this future-jump share **one `timeWalkerAbsent` flag and one sanity pool**. This doc *consumes* that pool; it does not redefine it (owned by the save-system spec). Contract: future-jump **reads** `sanity`, **sets** `timeWalkerAbsent=true` for the lockout, and **may trigger** `LOSS_timewalker_mad` if `sanity <= MADNESS_FLOOR` at jump time. The save spec owns `MADNESS_FLOOR`.

---

## 6. Terminal States (named, exhaustive) + Edge Cases & Failure Modes

### 6.1 The named outcomes

| Outcome | Trigger | Notes |
|---|---|---|
| `WIN_defense` | Finale battle chain (§6.3) cleared | The "stand and fight" win. Earth holds. |
| `WIN_future_jump` | Future-jump used in P4/P5 with readiness ≥ 60 & sane Walker | The impossible-odds win (Bible §11). |
| `WIN_diplomatic` | **OWNER-FORK §9** path: treaty + first-contact diplomacy averts armada | Off by default; needs owner sign-off. |
| `LOSS_overrun` | Finale chain lost, OR Day 2472 reached with `readiness < READINESS_FLOOR (25)` and no future-jump | The default failure. |
| `LOSS_extinction` | `globalDefenseScore` collapses to 0 before arrival (all allies turn hostile/fall) | World-state catastrophe; can happen *before* Day 2472. |
| `LOSS_timewalker_mad` | Sanity floor hit (cross-system) | The save-abuse failure. Shared with save spec. |

### 6.2 `READINESS_FLOOR` and the lock

- `READINESS_FLOOR = 25` (**RULING**; equals the bottom of `getThreatLevel` "low" band in the sibling `doomClockSystem.ts` for consistency).
- **Readiness locks at Day 2460** (`P4_armada`): the finale is tiered off this snapshot so a player can't grind readiness *during* the finale chain. Locked value stored in `readinessBreakdown`.

### 6.3 Finale battle chain (tiered by locked readiness)

| Locked readiness | Battles | Enemy threat cap | Player ±CS | Source |
|---|---|---|---|---|
| 25–44 (LOW) | 3 battles | L4 (harvesters) | **−1 CS** to all player units | under-prepared; `Player_Scaling` Tier 5 cap = L4-5 |
| 45–64 (MID) | 2 battles | L5 | **0 CS** | even fight |
| 65–84 (HIGH) | 2 battles | L5 | **+1 CS** | `Player_Scaling` Tier 6 = L5+ |
| 85–100 (MAX) | 1 battle (SCEN_020 showcase) | L5+ | **+2 CS** | "Save the world / all advanced rules" (`Scenario_Templates` SCEN_020) |

- ±CS injects into the universal table per Bible §3.3 (Column Shift is the universal currency). It does **not** invent new combat math.
- If **off-world travel** was unlocked (P3) and the player chose to take the fight to space/alien world, the chain swaps to **Environment_Space_Station / Environment_Alien_World** with **SCEN_016 Cosmic Scale Battle** rules (`Scenario_Templates`).
- **Losing any battle in the chain → `LOSS_overrun`.** Clearing all → `WIN_defense`.

### 6.4 Edge cases & failure modes

| Case | Handling |
|---|---|
| **Player ignores all email/news** | Locked design allows this ("never forced to read", FIST line 150). Phases still fire on day-thresholds; readiness simply never improves → likely `LOSS_overrun`. The world escalated without them — intended (Pillar 4). |
| **Player past-jumps before Day 2472** (load a save into P2) | Countdown is a function of `currentDay`, so jumping back rewinds `daysRemaining` and re-arms `phasesFired` entries with day > new currentDay (re-fireable). Already-applied permanent `PhaseWorldEffect`s are **not** double-applied (idempotency via `phasesFired`). |
| **Time skips past a phase boundary** (sleep/travel crosses Day 1800→1810 in one tick) | On each `day_change`/`time_jump` event, evaluate ALL phases whose `dayStart <= currentDay` and not in `phasesFired`; fire them in order (catch-up). |
| **Future-jump attempted with readiness < 60** | Email/dialogue refuses: "Sandra: 'I can't change a future you haven't earned.'" No state change. |
| **Future-jump attempted while Walker absent** (already future-jumped, or on a past-jump cooldown) | Disabled in UI; `futureJumpAvailable=false`. |
| **Sibling crime doom-clock (`doomClockSystem.ts`) hits 100% before Day 2472** | Different clock, different outcome. Crime-clock 100% = "major setback" (its own consequence), NOT the alien `LOSS`. They must be visually & mechanically distinct (§7). The crime clock may *lower* `globalDefenseScore` (infrastructure attacks) but does not end the campaign. |
| **All allies become hostile mid-campaign** | `globalDefenseScore → 0`; if it stays 0 for `EXTINCTION_GRACE = 60` game-days, fire `LOSS_extinction`. (Grace prevents a one-tick wipe; **RULING**, mirrors `Time_Management` event response windows.) |
| **Day 2472 reached mid-tactical-combat** (an unrelated mission) | Defer phase P5 finale trigger until the active tactical battle resolves (combat is atomic). |
| **Multiplayer / Time Chain "other dimension"** | Architectural stub only (locked design). `InvasionEndgameState` is per-campaign-instance; the future-jump's "other dimension" is where MP would slot. Do **not** build MP; just don't hard-code single-instance assumptions in the store. |
| **Readiness exactly on a tier boundary** | Bands are `[low,high]` inclusive-lower; 45 = MID, 65 = HIGH, 85 = MAX. |

---

## 7. UI/UX Hooks (how it surfaces)

The endgame reaches the player through the three vision surfaces — **phone, world-map, laptop** — and only the finale touches combat.

### 7.1 Countdown widget (laptop + persistent HUD)
- A **"DAYS TO ARRIVAL: ####"** widget, always visible top-bar. Distinct styling from the sibling crime **Doom Clock** (which is a 0-100% progress bar with its own color ramp in `doomClockSystem.getDoomClockColor`). The invasion countdown is a **descending day counter**, not a percent bar — visually unmistakable.
- Color/urgency ramp by phase: P0-P1 neutral, P2-P3 amber, P4-P5 red-pulsing. (Honor the global no-purple rule; use amber/red, hues 25–90.)
- Hover → phase label + "readiness: NN/100" mini-breakdown.

### 7.2 Phone — News ("Point of Interest") + Email
- **"Point of Interest"** international channel runs the telegraph headlines per phase (`newsTemplateIds`) — exactly the FIST GDD mechanism ("troop buildups before the invasion", line 510). This is the *primary* way the player feels the clock without opening menus.
- **Priority email** at each major phase entry (P1, P2, P4): a briefing from FIST command / the UN, with reply choices (email-as-dialogue, Bible §7.1). The **UN summit** (P2) is a priority email thread whose reply sets `treatyBonus`.

### 7.3 World-map
- During **P3_vanguard**, incursion sectors get a **Grey marker**; entering one is a live mission.
- During **P4_armada**, the **armada appears on the world-map** (a moving/looming overlay). The **off-world travel** option (FIST line 606-615) appears as a destination toggle if unlocked.
- A **"Readiness" map layer** tints allied vs hostile nations (their `globalDefenseScore` contribution), so the player can *see* the planet preparing.

### 7.4 Laptop — Readiness panel
- A dashboard card breaking `readiness` into its four bars (roster/tech/global/fame) with the formula's inputs surfaced ("Allied military avg: 62 → +9.3"). Mirrors `World_State_Tracking_System` Player_Observation_Dashboard.
- **Future-jump button** appears here in P4 when `futureJumpAvailable`, with an explicit cost warning ("Sandra leaves for days–weeks; time travel disabled; she returns changed").

### 7.5 Combat overlay (finale only)
- Finale battles show the **±CS readiness modifier** as a banner ("PREPARED: +1 to all rolls" / "UNDERPREPARED: −1"). One line; combat stays symbolic (plain grid + glyphs, locked design).
- The terminal outcome screen names the state (e.g., "EARTH HOLDS — WIN_defense" or "THE FUTURE REWRITTEN — WIN_future_jump") with an authored epilogue slot.

---

## 8. Integration Points (reads/writes)

| System | This system READS | This system WRITES |
|---|---|---|
| `timeSystem.ts` / `timeEngine.ts` | `GameTime` day counter (→ `currentDay`); `day_change`/`week_change`/`time_jump` events | — (subscribes; sets Crisis-time ceiling flag in P2+) |
| `enhancedGameStore.ts` | roster, faction standings, fame | `InvasionEndgameState` slice; `outcome` (campaign end) |
| `reputationSystem.ts` | `globalReputation` (→ `fameScore`) | — |
| `factionSystem.ts` / `Faction_Relationships_Complete` | ally/hostile standings (→ `globalDefenseScore`) | summit choice writes relation deltas (POL_005) |
| Research / tech tree (`Technology_Trees_Integrated`, `Research_Projects`) | cosmic-tech completion (→ `techScore`) | unlocks `cosmic_tech`, `off_world_travel` at P3 |
| `newsGenerator.ts` / `newsTemplates.ts` / `NewsBrowser.tsx` | — | telegraph headlines per phase to "Point of Interest" |
| Email system (`Email_Investigation_Templates`) | — | priority briefing emails; UN summit thread |
| World-state (`World_State_Tracking_System`, `worldSimulation.ts`) | crisis pipeline | applies `PhaseWorldEffect`s to countries/cities |
| Combat (`CombatScene.ts`, `battleRunner.ts`) | finale battle resolved/lost | requests finale battles with ±CS + enemy waves |
| Save / Time-Walker system (Bible §11) | `sanity`, `timeWalkerAbsent`, `MADNESS_FLOOR` | sets `timeWalkerAbsent` on future-jump; may trigger `LOSS_timewalker_mad` |
| Sibling `doomClockSystem.ts` (crime) | crime-clock crisis events | — (crime clock may lower `globalDefenseScore`; does NOT end campaign) |
| `Player_Scaling.csv` | tier → threat cap | reads cap for finale `enemyThreatCap` |

---

## 9. OWNER-FORK notes (product choices only the owner can make)

These are genuine fork-in-the-road product decisions the data does **not** settle. They are listed as forks, not guessed-as-settled.

1. **Is `WIN_diplomatic` a real win path?** Should a player be able to *avert* the invasion entirely through the UN summit + first-contact diplomacy (Greys can be reasoned with / Rusty Richards' message exploited), or is the armada an immovable wall that can only be **fought** (`WIN_defense`) or **rewritten** (`WIN_future_jump`)? The source frames the Greys as genocidal aggressors (FIST line 109) but also as having "studied human behavior" (line 321) — both readings are defensible. Default in this spec: **OFF** (no diplomatic win) until owner decides.

2. **Is the Time Walker future-jump one-shot per campaign, or repeatable with escalating cost?** Bible §11 says each *past*-jump costs sanity and reduces destinations; it doesn't say whether the *future*-jump win can be "undone and retried." Default: **one-shot** (`futureJumpUsed` latches). Owner may prefer repeatable-with-madness-risk for replay tension.

3. **Hard fail at Day 2472, or a "last stand" grace?** If readiness < FLOOR at arrival, does the campaign hard-end in `LOSS_overrun`, or does the player still get to *play* a doomed finale battle for a heroic-last-stand epilogue (lose anyway, but on their feet)? Default: **playable doomed finale** (it's more JA2), but this is a tone call.

4. **Does the countdown length scale with difficulty / player tier?** 2,472 days = ~82 real days at default speed — long for some, short for others given speed control. Should Easy stretch it (more Downtime 1:60 stretches) or Hard compress it? The source fixes 2,472 as canon, so changing it is an owner call. Default: **fixed 2,472**, difficulty expressed through readiness thresholds and enemy threat caps instead.

5. **Off-world finale: optional flourish or required?** Should taking the fight off-world (P3 unlock) be a strategic *option* (defend Earth OR strike the mothership) with different risk/reward, or purely cosmetic? Default: **optional alternate finale environment** (Space_Station / Alien_World), same outcome rules.

---

## 10. Open Questions

- **Q1.** What exactly raises the shared Time-Walker `sanity` pool back up? Bible §11 says "run tasks to realign the timeline and recover sanity" but the *task list* is unspecified — owned by the save-system spec, but the future-jump's `LOSS_timewalker_mad` depends on it. Needs the save spec to define `MADNESS_FLOOR` and recovery tasks.
- **Q2.** Concrete Grey unit stat-blocks (HP/powers/origin interactions) — deferred to the writing/content team per the §2 RULING; this spec only fixes their threat-level caps.
- **Q3.** Exact `newsTemplateIds` / `emailTemplateId` copy per phase — content authoring task; schema slots are defined, strings are TBD by writers (Pillar 1: data, not code).
- **Q4.** Should `globalDefenseScore` also read the **crime doom-clock** progress as a negative term (a high crime-clock = distracted/weakened planet)? Plausible cross-wire; left as a soft integration note, not specced, pending owner call on how coupled the two clocks should feel.
- **Q5.** Multiplayer: the future-jump's "other dimension" is the architectural MP seam (locked: stub only). When MP is designed, does a co-op campaign share one countdown and one armada, or one-per-player-instance? Out of scope here; flagged so the store stays instance-safe.

---

*This spec is data-driven by construction: the countdown constant, phase windows, readiness weights, and finale tiers all live in tables (§2–§6) and trace to named sources or explicit RULINGs. A coding agent can implement `MVP/src/data/invasionEndgame.ts` against the schema in §2, wire the five integration writes in §8, and ship the four UI surfaces in §7 without further questions.*
