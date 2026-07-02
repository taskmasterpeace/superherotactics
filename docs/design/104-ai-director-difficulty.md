# 104 — AI Director, Encounter Pacing & Difficulty

> **System:** AI Director (encounter pacing · difficulty metering · escalation/cooldown · threat budgeting)
> **Status:** BUILD-READY SPEC
> **Spine consumed:** country STATs (Corruption, LawEnforcement, Military, Intel, LSWActivity, GDP), city Crime Index + City Type + Population Rating, culture/terrain codes (read for encounter chance), faction standings, and the player's tier/fame state. Personality is **read** (it sets *who AI shoots*, §5.10) — the Director never overrides it.
> **Bible anchors:** §6.5 (Dynamic_Political_Events + World_State_Tracking fire "by player action or AI"; travel/encounter chances), §10 (Player_Scaling: 6 tiers, threat-level **cap** per tier), §5.10 (personality AI is *tactical target choice only* — the Director sits ABOVE it), §13 ruling #9 (combined-effects must be **consumed** by difficulty), §11 (the time-travel/rewind save economy must be tense — the Director is what makes a rewind *meaningful*).
>
> **Source tables (read these to re-balance — NEVER hardcode these numbers in code; load them from the CSVs/JSON at boot):**
> - `docs/csv-source-data/Player_Scaling.csv` — **authoritative** tier table: threat-level cap, team-size limit, funding band, enemy types, XP-per-mission-type, geographic scope.
> - `docs/csv-source-data/AI_Testing_Framework.csv` — **authoritative** target win-rate distribution by threat-level gap, and tactical-variety targets.
> - `docs/csv-source-data/Auto_Balance_Adjustment.csv` — **authoritative** pacing metrics: combat-length target (3–8 rounds), tactical-decision target (2–5), and the auto-tune adjustment formulas/limits.
> - `docs/csv-source-data/Time_Management.csv` — **authoritative** time ratios (1:30 base, 1:15 crisis, 1:45 research, 1:60 downtime), random-encounter chances, and event-priority response windows.
> - `docs/csv-source-data/Initiative_Turn_Order.csv` — threat-level initiative bonus (+0/+5/+10/+15/+20/+25) the Director reads when sizing an encounter.
> - `docs/csv-source-data/Dynamic_Political_Events.csv` — the event templates the Director schedules (trigger conditions, escalation tiers Minor/Major/Global, relationship deltas).
> - `docs/csv-source-data/World_State_Tracking_System.csv` — the world-state channels the Director reads/writes (Crisis_Event_Pipeline, Event_Escalation_Tracking, LSW_Population_Dynamics, Faction_Reputation_Tracking).
> - `docs/csv-source-data/Scenario_Templates.csv` — the 20 authored scenario archetypes + 5 victory conditions + special rules the Director picks from.
> - `docs/csv-source-data/Public_Perception.csv` — the consequence ladder the Director reads (fame/heat) and writes back after an encounter.
> - `SuperHero Tactics/Combat Compendium REAL - 🎯PERSONALITY TARGET SELECTION🎯.csv` — read-only; the Director never touches target choice.
> - `docs/csv-source-data/Game_Mechanics_Spec/Stat_Rank_Mapping.csv` + `Universal_Table_FIXED.csv` — the rank ladder & resolution table all sizing math ultimately resolves against.

---

## 1. Overview & Player Fantasy

The events engine (Bible #2, the **Hybrid** authored-template + stat/personality selector) decides *which* template fires and parameterizes it. **Nothing in that engine meters PACE or DIFFICULTY** — it can fire a Global crisis on day 3 and three street muggings in a row on day 200. The **AI Director** is the missing governor that sits between the world simulation and the events engine and answers three questions the events engine cannot:

1. **WHEN** does the next encounter/mission/event fire? (pacing — pressure vs. breathing room)
2. **HOW BIG** is it? (difficulty — threat budget, sized to the player's tier and current strength)
3. **WHICH** template, victory condition, and modifiers best fit the current world-state and the *drama beat* we want next? (selection bias handed to the events engine)

The Director is **not** an enemy AI (that is personality-driven, §5.10) and **not** the world simulation (countries war on their own clock, §6.5). It is a **scheduler + budgeter + curator** that watches a small set of world signals and nudges the events engine's selection weights and the world clock's tempo. It is deliberately *light-touch and legible*: it never spawns enemies the player can't see coming (Bible Pillar: "Point of Interest news telegraphs AI moves"), never violates the tier threat-cap (§10), and never silently rubber-bands.

**Player fantasy:** *"The world has a heartbeat. It leans on me when I'm strong and gives me air when I'm bleeding — but it never lies to me about how hard it's pushing, and it never cheats. When I rewind time, the pressure I escaped was real."*

**Two contracts the Director must honor (these are the design constraints, not flavor):**

- **The legibility contract.** Every escalation is *foreshadowed* before it lands (a Point-of-Interest news item, an email, a map heat-bloom — §7) and *attributable* after (the after-action panel shows why this encounter was this size). The Director is a stage manager, not a hidden hand. (Bible §7.2 News telegraphs AI moves; Auto_Balance `Narrative_Quality_*`.)
- **The honesty contract (anti-rubber-band).** The Director adjusts *frequency and selection*, and may apply a **bounded** sizing nudge, but it MUST NOT secretly alter unit stats mid-combat. All combat numbers stay traceable to `Universal_Table_FIXED`. The Director's only mid-campaign "difficulty knob" is the **Heat/Pressure** value (§3), which is surfaced to the player. (Bible §13 #9: combined-effects consumed *visibly*; honesty is what makes the time-travel save tense — §11.)

**Non-goals (scope guards):**
- Does NOT pick combat targets (that's personality, §5.10) or run tactical AI.
- Does NOT author event *content* (that's the Hybrid events engine + writers, §12). It only *biases selection* and *schedules*.
- Does NOT model country-vs-country diplomacy (the world sim owns that; the Director only reads `Faction_Reputation_Tracking` / relation codes).
- Does NOT generate new numbers for combat — all combat math stays in the combat tables.
- Multiplayer (the time-traveler's other dimension) only ever *reads* Director state; per-nation Director instances must be independent so an MP layer can run N of them. Design accordingly (Bible: MP is an architectural stub).

---

## 2. Where the Director sits (control flow)

```
WORLD SIMULATION (countries war/elect/spawn LSWs on their own clock — §6.5)
        │  emits raw world-state deltas
        ▼
┌───────────────────────── AI DIRECTOR (this spec) ─────────────────────────┐
│  reads:  PlayerState (tier, fame, squad strength, injuries, cash)         │
│          WorldState (crisis pipeline, faction rep, LSW density)           │
│          Heat (per-region pressure accumulator)  ← the one visible knob   │
│  decides: (a) next encounter TIME  (pacing — §4)                          │
│           (b) encounter THREAT BUDGET (difficulty — §5)                   │
│           (c) selection WEIGHTS + victory cond + modifiers (curation — §6) │
│  writes:  schedules events into the Crisis_Event_Pipeline,                │
│           updates Heat, sets clock tempo (1:15…1:60), logs an audit row   │
└──────────────────────────────────┬────────────────────────────────────────┘
                                    │  "fire template X, budget B, mods M, at T"
                                    ▼
HYBRID EVENTS ENGINE (#2)  →  picks/parameterizes the authored template
                                    │
                                    ▼
ENCOUNTER  →  COMBAT (personality AI §5.10 picks targets)  →  consequences (§9)
                                    │  after-action deltas
                                    └──────────────► back to Director (closes loop)
```

The Director runs as a **tick** on the world clock (one evaluation per game-day at base tempo; see §4.4) plus an **event-driven** evaluation whenever the player completes/aborts an encounter or the world sim raises a flag.

---

## 3. Data Schema (fields / types)

All tunables live in a single boot-loaded data table (`ai_director_config` — a JSON or CSV mirror of the cited source numbers) so the system stays data-driven (Pillar #1). The TypeScript below is the *runtime* shape; every literal in it has a `// SRC:` or `// RULING:` trace in §5–§6.

### 3.1 `DirectorTuning` (static reference — loaded once, immutable at runtime)

```ts
// Mirror of Player_Scaling.csv (one row per tier, 6 rows). SRC: Player_Scaling.csv rows 2–7.
interface TierRule {
  tier: 1|2|3|4|5|6;
  name: string;                 // "Street Operative" … "Cosmic Guardian"
  threatLevelCap: number;       // 1,2,3,4,5,6  → max enemy threat level allowed (Alpha=0)
  teamSizeMin: number;          // 1,2,3,4,6,8
  teamSizeMax: number;          // 2,4,6,8,12,15
  fundingFloor: number;         // 5_000 … 2_000_000   (USD, low end of band)
  fundingCeil: number;          // 15_000 … Infinity
  geographicScope: 'city'|'metro'|'state'|'national'|'continental'|'unlimited';
}

// Mirror of AI_Testing_Framework.csv Balance_Target_* rows. SRC: rows 14–18.
interface WinRateTarget {
  threatGap: number;            // enemy_TL − player_TL  (… −1,0,+1,+2,+3,+4)
  targetWinRateForPlayer: number; // 0..1  (player's expected win prob)
  tolerance: number;            // ± band
}

// Mirror of Auto_Balance_Adjustment.csv Test_Result_* + Time_Management.csv.
interface PacingTuning {
  combatRoundsTargetMin: number;   // 3   SRC: Auto_Balance row 14 (Test_Result_Combat_Length 3–8)
  combatRoundsTargetMax: number;   // 8
  tacticalDecisionsMin: number;    // 2   SRC: Auto_Balance row 15 (2–5 major decisions)
  tacticalDecisionsMax: number;    // 5
  timeRatioBase: number;           // 30  SRC: Time_Management row 2 (1:30)
  timeRatioCrisis: number;         // 15  SRC: row 4 (1:15)
  timeRatioResearch: number;       // 45  SRC: row 3 (1:45)
  timeRatioDowntime: number;       // 60  SRC: row 5 (1:60)
}

// Base random-encounter chances by scope. SRC: Time_Management.csv rows 29–33.
interface EncounterChance {
  scale: 'street'|'gang'|'terrorist'|'international'|'alien';
  baseChance: number;  // 0.15, 0.08, 0.03, 0.01, 0.001
  context: 'patrol'|'urban_travel'|'national_travel'|'international_travel'|'space_travel';
}

// Event response windows. SRC: Time_Management.csv rows 42–46.
interface PriorityWindow {
  priority: 'critical'|'high'|'medium'|'low'|'background';
  responseHoursReal: number; // 2, 24, 72, Infinity, Infinity
}
```

### 3.2 `DirectorState` (per-nation save — mutable, serialized into the save/time-travel snapshot)

```ts
interface DirectorState {
  // ── The one visible difficulty knob (Heat / Pressure) ──
  heatGlobal: number;                 // 0..100  campaign-wide pressure
  heatByRegion: Record<string, number>; // ISO-region → 0..100 local pressure
  // ── Pacing memory ──
  lastEncounterDay: number;           // game-day of last firing
  encounterCooldownDays: number;      // computed each tick (§4)
  beat: 'TENSION'|'SPIKE'|'RELIEF'|'CALM'; // current drama beat (§4.3)
  beatStartedDay: number;
  tempo: 'base'|'crisis'|'research'|'downtime'; // selects time ratio
  // ── Difficulty memory (the honesty ledger) ──
  recentPlayerWinRate: number;        // rolling, last N encounters (N=10) — 0..1
  recentAvgCombatRounds: number;      // rolling — for pacing auto-nudge
  challengeBias: number;              // −2..+2 CS-equivalent sizing nudge (§5.4) — BOUNDED, surfaced
  // ── Selection memory (anti-repetition) ──
  recentTemplateIds: string[];        // last 8 fired template ids (dedupe window)
  recentScenarioTypes: string[];      // last 8 scenario archetypes
  // ── Audit ──
  log: DirectorDecision[];            // ring buffer, last 50 — drives after-action "why"
}

interface DirectorDecision {
  day: number;
  kind: 'encounter'|'event'|'tempo_change'|'heat_change';
  templateId?: string;
  threatBudget?: number;     // §5
  appliedBias?: number;      // §5.4 (so the player can SEE it)
  reasonCodes: string[];     // e.g. ['HIGH_HEAT','SQUAD_INJURED','TIER_CAP_4']
}
```

### 3.3 `PlayerSnapshot` (read each tick — assembled from existing stores, not owned here)

```ts
interface PlayerSnapshot {
  tier: 1|2|3|4|5|6;                 // from Player_Scaling progression (existing)
  fame: number;                      // Public_Perception cumulative reputation
  cash: number;
  squad: { count: number; avgThreatLevel: number; injuredFraction: number;
           avgHealthFraction: number; rewindCharges: number; timeWalkerSanity: number };
  region: string;                    // current ISO-region / sector
}
```

---

## 4. Pacing — WHEN the next thing fires

### 4.1 The cooldown is the spine of pacing

Encounters do not fire on a flat timer. Each Director tick computes an **encounter cooldown** (in game-days) — the minimum gap before the next *Director-scheduled* encounter may fire. (World-sim and travel encounters are separate, §4.5.) The cooldown shrinks as Heat rises and grows when the squad is hurt:

```
cooldownDays = baseCooldown[tier]                       // RULING table §4.2
             × (1 − 0.6 × heatRegion/100)               // RULING: high heat → up to 60% shorter
             × reliefMultiplier(beat)                    // §4.3
             × squadStressMultiplier(injuredFraction)    // §4.4
```

Each clause is bounded so the product can never collapse to 0 or balloon unboundedly:

```
cooldownDays = clamp( cooldownDays, minGapDays[tier], maxGapDays[tier] )   // RULING §4.2
```

### 4.2 `baseCooldown`, `minGap`, `maxGap` per tier — RULING (anchored to scope/time)

> **RULING.** Player_Scaling.csv (`Time_Investment_*` / `Progression_Time_Estimate`) and Time_Management.csv give *operation durations and time ratios* but not an explicit encounter cadence. Derive cadence from those: lower tiers (city scope, quick ops) get *frequent small* encounters; higher tiers (continental, multi-week ops) get *rare large* ones. Numbers below are the rulings — all overridable from `ai_director_config`.

| Tier | baseCooldown (game-days) | minGap | maxGap | Anchor (SRC) |
|---|---|---|---|---|
| 1 Street | 3 | 1 | 7 | Player_Scaling row 28 "Time_Investment_Street 1–4 days/op" |
| 2 City | 5 | 2 | 14 | Player_Scaling row 29 "City 5–14 days" |
| 3 Regional | 9 | 3 | 21 | Player_Scaling row 30 "National 15–45" (lower bound) |
| 4 National | 15 | 5 | 45 | Player_Scaling row 30 "15–45 days/op" |
| 5 International | 25 | 7 | 60 | Player_Scaling row 31 "Global 45+ days" |
| 6 Cosmic | 35 | 10 | 90 | Player_Scaling row 31 (45+) + Alien-Contact op "14–60 days" row 14 |

(Note: cooldowns are in **game-days**; at base tempo 1 real day = 30 game-days, so a Tier-1 3-day cooldown ≈ 2.4 real hours of wall-clock — SRC: Time_Management row 2.)

### 4.3 Drama beats — the pacing oscillator

The Director runs a **4-beat cycle** so pressure is rhythmic, not flat (the JA2/CK "lull then surge" feel). Beats are a pure function of Heat + time-since-last-spike; they set `reliefMultiplier`:

| Beat | Entered when | reliefMultiplier | tempo | Player-felt |
|---|---|---|---|---|
| **CALM** | heatRegion < 25 AND ≥ maxGap since last encounter | 1.5 | downtime (1:60) | breathing room; train/heal/build |
| **TENSION** | heatRegion 25–60 | 1.0 | base (1:30) | normal cadence, foreshadowing rises |
| **SPIKE** | heatRegion ≥ 60 OR a Major/Global event scheduled | 0.5 | crisis (1:15) | back-to-back pressure |
| **RELIEF** | for `reliefDays` immediately AFTER any SPIKE resolves | 2.0 | base→downtime | guaranteed cooldown so the player recovers |

> **RULING — guaranteed relief after a spike.** After a SPIKE encounter resolves, force a RELIEF beat of `reliefDays = 2` (Tier 1–2), `3` (Tier 3–4), `4` (Tier 5–6) game-days during which `reliefMultiplier = 2.0` and the Director may NOT schedule another SPIKE. This is the anti-frustration valve; it is what makes the time-ratio shift to downtime (1:60) meaningful — SRC pacing intent: Auto_Balance row 21 (`Adjustment_Validation_Convergence` — system must "stabilize"), and Time_Management row 5 (Downtime exists as a real state).

### 4.4 Squad-stress multiplier — the "give the player air when bleeding" rule

```
squadStressMultiplier =
    1.0                                   if injuredFraction < 0.25
    1.0 + 1.5 × (injuredFraction − 0.25)  if 0.25 ≤ injuredFraction < 0.75  // longer gaps
    3.0                                   if injuredFraction ≥ 0.75          // max breathing room
```

> **RULING.** No source numbers a "mercy" curve; this is the ruling. injuredFraction = (units with HP < 50% OR status `Injured`/`Hospitalized`) ÷ squad size. Caps at 3× so a wiped squad gets up to triple the gap to heal — but never *zero* pressure (the clamp in §4.1 still applies; the world does not freeze). Aligns with Bible §7.6 (hospital/heal is a real activity that needs time) and Auto_Balance `Test_Result_Civilian_Impact`/pacing intent.

### 4.5 Three encounter sources — the Director only governs one

| Source | Owner | Director role |
|---|---|---|
| **Scheduled** (mission/crisis the Director queues) | **Director** | full control of time+budget+selection |
| **Travel/random** (patrol mugging, border incident) | Time_Management encounter table | Director *reads* the roll but does not gate it; it only **sizes** it to the tier cap (§5) and logs it into Heat | 
| **World-sim** (a country goes to war on its own clock) | World simulation §6.5 | Director cannot suppress; it may *react* by raising Heat and scheduling a related mission |

Travel/random base chances are fixed by SRC (Time_Management rows 29–33): street **15%** on patrol, gang **8%** on urban travel, terrorist **3%** on national travel, international **1%**, alien **0.1%**. The Director applies a Heat multiplier to these (§4.6) but never the priority-window gate.

### 4.6 Heat (Pressure) — the one visible difficulty accumulator

Heat is the Director's memory of "how spicy is it right now," 0–100, per region and global. It is **surfaced on the world map as a heat-bloom** (§7) so the honesty contract holds.

```
// Per Director tick, for each region:
heatRegion += inflow − decay
  inflow  = 0.4 × (cityCrimeIndex/100)            // SRC: Bible §6.2 crimeIndex drives encounters
          + 0.3 × (100 − countryLawEnforcement)/100
          + 0.3 × (countryCorruption/100)          // SRC: Bible §8 Organized-crime = Corruption+(100−Law)
          + 0.5 × (countryLSWActivity/100)          // SRC: Bible §6.1 LSWActivity sets encounter frequency
          + spikeFromEvents(region)                 // +20 Minor, +40 Major, +60 Global  (§6.3)
          + 0.2 × (playerFameInRegion/maxFame)      // RULING: fame draws villain attention (Public_Perception "villain attention")
  decay   = 2.0 per game-day at base tempo          // RULING: heat cools when you leave a region alone
heatRegion = clamp(heatRegion, 0, 100)
heatGlobal = max(heatByRegion) × 0.6 + mean(heatByRegion) × 0.4   // RULING blend
```

> **RULING — the inflow weights (0.4/0.3/0.3/0.5/0.2) and decay (2.0/day) are the rulings.** Their *inputs* are all spine stats with cited owners (crimeIndex, LawEnforcement, Corruption, LSWActivity, fame); only the mixing coefficients are authored, and they live in `ai_director_config` for re-tuning. This is the literal realization of Bible §13 #9 ("combined-effects must be CONSUMED by difficulty").

Heat multiplies the travel/random encounter chance: `effectiveChance = baseChance × (1 + heatRegion/100)` (so a 15% patrol mugging becomes up to 30% in a maxed-Heat region). It also shrinks the cooldown (§4.1).

---

## 5. Difficulty — HOW BIG the encounter is (threat budgeting)

### 5.1 The tier threat-cap is a hard wall (never violated)

The single most important difficulty rule comes straight from `Player_Scaling.csv`: **the enemy threat level may never exceed the player's tier cap.** (SRC: Player_Scaling rows 2–7 `Threat_Level_Cap` column → Tier1 ≤ Alpha/L1, Tier2 ≤ L2, Tier3 ≤ L3, Tier4 ≤ L4, Tier5 ≤ L5, Tier6 = L5+.) The Director clamps every spawned enemy's threat level to `min(rolledTL, tierRule.threatLevelCap)`. A street-tier player is **never** handed a Level-5 cosmic enemy by the Director (the world sim can still *exist* at L5 nearby — but the Director won't *route the player into* it; it routes via Point-of-Interest foreshadowing instead).

### 5.2 The threat budget

Each scheduled encounter gets a **threat budget** — an abstract points pool the events engine spends on enemy count × enemy threat level. The budget is sized to put the *player's* expected win-rate inside the AI_Testing_Framework target band:

```
playerStrength = squad.count × rankValue(squad.avgThreatLevel)   // rankValue via Stat_Rank_Mapping
desiredGap     = chooseGap(beat)                                  // §5.3
targetEnemyTL  = clamp( squad.avgThreatLevel + desiredGap, 0, tierRule.threatLevelCap )  // §5.1 wall
threatBudget   = playerStrength × budgetFactor(desiredGap) × (1 + challengeBias×0.1)      // §5.4
```

`budgetFactor` is read straight from the win-rate target table so the encounter lands on the intended win probability:

| desiredGap (enemyTL − playerTL) | target player win-rate | budgetFactor | SRC |
|---|---|---|---|
| −1 (easier) | ~85% | 0.7 | AI_Testing_Framework row 15 inverse |
| 0 (even) | 50% ±5 | 1.0 | AI_Testing_Framework row 14 |
| +1 (stretch) | 30% (player is the underdog) → tune to **70% enemy** | 1.3 | row 15 (70%±10 for +1) |
| +2 (hard) | 15% | 1.7 | row 16 (85%±5) |
| +3 (brutal, gated) | 5% | 2.2 | row 17 (95%±3) |

> **RULING — gating of +2/+3.** The Director may only choose desiredGap ≥ +2 during a SPIKE beat, when the world-sim raised a flag, AND when the player has ≥ 1 unused rewind charge (so a brutal encounter is survivable narrative-wise — Bible §11). Otherwise desiredGap ∈ {−1, 0, +1}. This keeps the "upset possible but power gap real" promise (AI_Testing_Framework rows 15–18) without sandbagging the player with un-winnable fights.

### 5.3 `chooseGap(beat)` — pacing drives difficulty

```
CALM     → −1   (a softball; let the player feel strong / onboard new recruits)
TENSION  →  0   (fair fight)
SPIKE    → +1, or +2/+3 if §5.2 gate passes
RELIEF   → −1   (guaranteed easier; recovery)
```

### 5.4 `challengeBias` — the ONLY mid-campaign auto-adjust, and it's bounded + visible

This is the honesty-contract centerpiece. The Director tracks `recentPlayerWinRate` over the last 10 encounters and nudges a **single, small, surfaced** bias:

```
if recentPlayerWinRate > 0.70 over last 10:  challengeBias += 1   (harder)
if recentPlayerWinRate < 0.40 over last 10:  challengeBias -= 1   (easier)
challengeBias = clamp(challengeBias, −2, +2)     // HARD CAP
```

`challengeBias` feeds only the threat *budget* (±20% max at ±2) and never unit stats. It decays toward 0 by 1 step every RELIEF beat (so the game drifts back to honest baseline). It is **shown to the player** as a one-word label in the after-action panel ("World pressure: HARDER / NORMAL / EASIER") — see §7.

> **RULING / anti-rubber-band.** Auto_Balance_Adjustment.csv defines *designer-time* auto-tuning (re-running 1000 sims and editing CSVs), NOT runtime cheating. The Director's `challengeBias` is the *only* runtime adjustment, it is bounded to ±2 (≈±20% budget), it touches *frequency/budget* not stats, and it is disclosed. This satisfies AI_Testing_Framework `Balance_Philosophy_Competitive_Integrity` ("skill determines outcomes more than power level") while still helping a stuck player. The adjustment-limit discipline mirrors Auto_Balance's "±X per adjustment / rollback if cascade fails" rows 2–11.

### 5.5 Translating budget → actual enemies (handed to the events engine)

The Director outputs `{ targetEnemyTL, threatBudget }`; the events engine fills it. The canonical fill (RULING, so the events engine has zero ambiguity):

```
remaining = threatBudget
enemies = []
while remaining ≥ rankValue(minEnemyTL):
    tl = pick TL in [max(0, targetEnemyTL−1) … targetEnemyTL]   // small spread for variety
    cost = rankValue(tl) × (1 + 0.05 × enemies.length)          // RULING: each extra body +5% (swarm tax)
    if cost > remaining: break
    enemies.push(enemyOfTL(tl)); remaining −= cost
clamp enemies.length to [1, 3 × squad.count]                    // RULING: never a hopeless mob
apply tier threat-cap (§5.1) to every enemy
```

The `enemyOfTL(tl)` picker pulls archetype from `Player_Scaling.csv` `Enemy_*` rows (street criminal → gang LSW → corporate villain → state actor → global threat → cosmic entity, SRC rows 15–20) filtered by region/faction. Initiative sizing uses the threat-level initiative bonus (+5/level, SRC Initiative_Turn_Order rows 6–11) so the player can *read* the danger.

---

## 6. Curation — WHICH template, victory condition & modifiers

The Director does not author content; it hands the events engine a **weighted selection request**. It biases the engine's template pool toward the current beat, region, and anti-repetition memory.

### 6.1 Selection weight formula

For each candidate template `t` from the Hybrid engine's eligible pool (already filtered by stat/personality fit):

```
weight(t) = fitScore(t)                              // from events engine (stat/personality match)
          × beatBias(t.scenarioType, beat)           // §6.2
          × scopeMatch(t.scale, tier.geographicScope)// 0 if out of scope, 1 if in
          × noveltyPenalty(t.id)                      // §6.4
          × heatGate(t.escalationTier, heatRegion)    // §6.3
```

### 6.2 `beatBias` — beats prefer scenario shapes (RULING, from Scenario_Templates victory conditions)

| Beat | Favored victory conditions (SRC: Scenario_Templates rows 32–36) | Favored scenario types |
|---|---|---|
| CALM | Victory_Objective, Victory_Escape (low-stakes) | recruitment, investigation, humanitarian |
| TENSION | Victory_Defeat, Victory_Capture | street crime, gang, corporate |
| SPIKE | Victory_Survival, Victory_Objective (protect) | terrorist, border conflict, assassination, nuclear |
| RELIEF | Victory_Objective (easy), Victory_Defeat (softball) | training, investigation |

Special-rule modifiers (Scenario_Templates rows 37–41: `No_Powers`, `Powers_Only`, `Environmental_Hazards`, `Civilian_Rescue`, `Time_Limit`) are added by the Director to hit the **tactical-variety target** (Auto_Balance row 15: 2–5 meaningful decisions/combat): if the Director's rolling `recentAvgTacticalDecisions < 2`, it injects a special rule (e.g. `Civilian_Rescue` or `Time_Limit`) to force more choices.

### 6.3 `heatGate` — escalation tier must match Heat (legibility contract)

A Global crisis cannot drop out of nowhere. Escalation tiers (Dynamic_Political_Events rows 23–25: Minor/Major/Global) are gated by Heat:

```
Minor   event: always eligible
Major   event: eligible only if heatRegion ≥ 50  (and emits a foreshadow news item 1 cooldown earlier)
Global  event: eligible only if heatGlobal ≥ 75  AND a prior Major event in the same chain resolved
```

> **RULING.** Dynamic_Political_Events gives trigger *conditions* ("player completes X OR AI generates") but no cadence/heat gating; this is the ruling that prevents tonal whiplash and honors "News telegraphs AI moves" (Bible §7.2). A Major/Global event ALWAYS posts a Point-of-Interest news item and/or priority email at least one cooldown before it fires (response windows: Critical 2h / High 24h — SRC Time_Management rows 42–43).

### 6.4 `noveltyPenalty` — anti-repetition

```
noveltyPenalty(id) = 0.15  if id ∈ recentTemplateIds (last 8)     // RULING: heavy down-weight, not zero
                   = 0.5   if t.scenarioType ∈ recentScenarioTypes (last 8)
                   = 1.0   otherwise
```

> **RULING.** No source numbers anti-repetition; 0.15/0.5/1.0 are rulings, overridable. Prevents the "three muggings in a row" failure the events engine alone allows. Aligns with Auto_Balance `Narrative_Quality_*` (variety) and `Balance_Philosophy_Chess_Depth` (replay value).

---

## 7. UI/UX hooks (how it surfaces)

The Director is *legible by contract*, so every decision has a surface. Per the §0 brand rules: warm-dark base, NON-purple accent (gold/amber `#f5b21a`-family for "pressure," red for SPIKE), 10px radius, hover states, no glassmorphism.

| Surface | What the Director shows | Tied to |
|---|---|---|
| **World-map heat-bloom** | Per-region Heat 0–100 as a soft amber→red gradient overlay on the sector grid; intensity = `heatRegion`. Click a region → tooltip lists the top 3 `inflow` contributors ("Crime Index 78 · LSW Activity 64 · recent Major event"). | §4.6 Heat, World_State `Player_Observation_Dashboard` |
| **Phone / News (Point of Interest)** | The mandatory foreshadow: a "Point of Interest" headline 1 cooldown before any Major/Global event ("Troop buildup near Lagos"). This IS the legibility contract surfacing. | §6.3, Bible §7.2 |
| **Phone / Email (priority flag)** | Scheduled missions arrive as priority email within the response window (Critical 2h / High 24h badge). | §6.3, Time_Management rows 42–46 |
| **Laptop / Threat Forecast panel** | A small "next 7 days" pressure forecast: current beat (CALM/TENSION/SPIKE/RELIEF), tempo (1:15…1:60 clock-speed indicator), and a one-line "what the world is doing." | §4.3 beats, §3.2 |
| **Combat overlay (pre-deploy brief)** | "Estimated difficulty: EVEN / STRETCH / HARD" derived from `desiredGap`; enemy count + top threat level; the gate warning if +2/+3 ("This is a hard fight — a rewind charge is recommended"). | §5 budget |
| **After-action panel (the "why")** | Shows `appliedBias` as one word ("World pressure: NORMAL/HARDER/EASIER"), the `reasonCodes` in plain language ("scaled down — your squad was injured"), and Heat delta. This is the honesty contract surfacing. | §3.2 log, §5.4 |
| **Time controls** | The existing real-time-with-pause speed control reflects Director `tempo`; entering crisis tempo (1:15) flashes the clock. | Time_Management, Bible §11 |

**Accessibility / control:** the Heat overlay is toggleable; the Threat Forecast is opt-in (laptop app). The player can *lower* difficulty manually via an OWNER-FORK setting (§11) but the Director never auto-hides its state.

---

## 8. Integration points (reads / writes)

| System | Director READS | Director WRITES |
|---|---|---|
| **Player progression** (`Player_Scaling`) | tier, threat-cap, team size, scope, funding band | — |
| **Hybrid events engine (#2)** | eligible template pool + fitScores | selection weights, threat budget, victory cond, special-rule modifiers, schedule time |
| **World simulation** (`World_State_Tracking_System`) | Crisis_Event_Pipeline, Faction_Reputation, LSW_Population_Dynamics, Event_Escalation | schedules into Crisis_Event_Pipeline; raises Heat on world flags |
| **World clock / Time** (`Time_Management`) | current ratio, encounter rolls, priority windows | sets `tempo` (base/crisis/research/downtime → 1:30/1:15/1:45/1:60) |
| **Combat** (`Universal_Table_FIXED`, `Initiative_Turn_Order`) | after-action win/loss, rounds elapsed, decisions made | nothing into combat math (honesty contract) — only reads results |
| **Personality AI** (`PERSONALITY TARGET SELECTION`, §5.10) | — (read-only awareness) | NOTHING — never overrides target choice |
| **Public Perception / fame** (`Public_Perception`) | fame (→ Heat inflow), consequence ladder | — (consequences are applied by combat-results, not the Director) |
| **Spine** (country/city stats, factions) | Corruption, Law, LSWActivity, crimeIndex, faction standing | — |
| **Time-travel save** (Bible §11) | rewindCharges, timeWalkerSanity (gate for +2/+3, §5.2) | `DirectorState` is serialized INTO the snapshot so a rewind restores the exact pressure the player escaped |

**Save/rewind contract (critical):** `DirectorState` is part of the per-nation save snapshot. When the Time Walker rewinds, Heat/beat/bias/cooldown all roll back to the snapshot — the pressure the player fled is *exactly* what they face again. This is what makes the rewind tense rather than a free escape (Bible §11). Each nation has its own `DirectorState` instance (MP-ready, §1 non-goals).

---

## 9. Edge cases & failure modes

| # | Case | Handling |
|---|---|---|
| E1 | **Player idles for weeks (never moves).** | Heat decays (−2/day) toward 0 → beat goes CALM → tempo 1:60. But a `maxGap[tier]` floor still fires a soft Tier-appropriate encounter so the world isn't dead (Bible Pillar #4 "world lives without you"). World-sim events still fire independently. |
| E2 | **Squad wiped / 1 unit left.** | injuredFraction ≥ 0.75 → squadStressMultiplier = 3 → max cooldown; desiredGap forced to −1; +2/+3 gate fails (no SPIKE). Director schedules a recovery beat. Does NOT freeze the world. |
| E3 | **Player on a massive win streak (winRate > 0.9).** | challengeBias rises to cap +2 (max +20% budget) and desiredGap biases to +1; if still stomping, the Director CANNOT exceed the tier cap (§5.1) — instead it posts a Point-of-Interest hinting the player should advance a tier. No silent stat inflation. |
| E4 | **Tier cap = enemy ceiling but player is far over-leveled within tier.** | desiredGap can't push enemy TL past cap, so budget scales via enemy *count* (more bodies) up to `3×squad.count`, then the Director surfaces "you've outgrown this region." |
| E5 | **World-sim fires a Global war the player can't reach (out of scope/tier).** | Director does NOT route the player into it; it raises regional Heat and offers a *scoped* related mission (e.g. "evacuate civilians" Victory_Objective) instead. The war exists in news; the player isn't thrown at L5. |
| E6 | **Two regions both max Heat.** | heatGlobal blend (§4.6) → crisis tempo; Director alternates which region spikes (anti-repetition on region) so the player isn't pinned in one place. |
| E7 | **Events engine returns an empty eligible pool** (no template fits). | Director falls back to a generic scoped encounter from `Player_Scaling` `Enemy_*` rows at desiredGap 0; logs `reasonCode: 'POOL_EMPTY_FALLBACK'`. Never crashes, never skips a beat silently. |
| E8 | **challengeBias and squadStress disagree** (stuck player who is *also* winning rarely). | squadStress (pacing) and challengeBias (budget) are orthogonal — both apply; the player gets *longer gaps* AND *slightly smaller* fights. No conflict. |
| E9 | **Rewind spam** (player rewinds to dodge every hard fight). | DirectorState rolls back with the save, so the same SPIKE re-arrives. Per §11, rewinds cost sanity and shrink destinations — the Director makes that cost *felt* because the pressure persists. The +2/+3 gate (§5.2) requires a rewind charge, so spamming rewinds eventually disables the brutal-fight path (charges spent) → Director auto-eases. |
| E10 | **Difficulty data table missing/malformed at boot.** | Hard-fail to safe defaults baked from the cited SRC rows (the §3 literals), log a warning. Never run with undefined budgets. |
| E11 | **Time tempo thrash** (crisis↔downtime flipping every tick). | Tempo changes are debounced: a tempo must persist ≥ `minGap[tier]` game-days before it may change again (RULING) — prevents clock-speed strobing. |
| E12 | **Player at Tier 6 (cap = L5+, no higher tier to suggest).** | Endgame: Director removes the tier-advance hint, allows desiredGap up to +1 against L5 enemies, leans on enemy *count* + cosmic special rules (Scenario row 16) for challenge, and lets world-sim Global events through more freely (heatGate Global threshold drops to 60). |

---

## 10. Worked example (so a coding agent can self-check)

> Tier 3 Regional player, squad of 4, avg threat level 2, 0 injured, in Lagos region. Country Corruption 70, LawEnforcement 30, LSWActivity 60; city Crime Index 78. Fame moderate. 2 rewind charges. No event scheduled.

1. **Heat inflow** = 0.4×(78/100) + 0.3×(70/100) + 0.3×(70/100)... wait, Corruption 70 and (100−Law)=70: 0.4×0.78 + 0.3×0.70 + 0.3×0.70 + 0.5×0.60 + 0.2×fame≈0.312+0.21+0.21+0.30+0.04 ≈ **+1.07/day** vs decay 2.0 → if region was quiet, Heat sits low-moderate. Say current `heatRegion = 45`.
2. **Beat**: heat 45 ∈ [25,60] → **TENSION**, tempo base (1:30).
3. **Cooldown** = baseCooldown[3]=9 × (1−0.6×0.45)=×0.73 × reliefMult(TENSION=1.0) × squadStress(0 injured=1.0) = 9×0.73 = **6.6 → clamp[3,21] = 6.6 game-days** until next scheduled encounter.
4. **desiredGap** = chooseGap(TENSION) = **0**.
5. **targetEnemyTL** = clamp(2+0, 0, cap[3]=3) = **2** (under cap, fine).
6. **threatBudget** = playerStrength(4×rankValue(TL2)) × budgetFactor(0)=1.0 × (1+0=challengeBias 0) → an even fight (~50% win, AI_Testing row 14).
7. **Selection**: TENSION favors Victory_Defeat/Capture + street/gang/corporate; heatGate allows Minor only (heat 45 < 50). noveltyPenalty avoids the last 8 templates. Lagos region + Nigeria faction filters the enemy archetype to gang LSW (`Enemy_Gang_LSW`, Player_Scaling row 16, TL1–2).
8. **Surface**: priority email arrives within 24h window; combat brief reads "Estimated difficulty: EVEN, 3 enemies, top TL2."
9. **After combat** (player wins, 5 rounds — inside 3–8 target): winRate rolling updates; Heat +0 (no event); log row written with reasonCodes `['TIER_3','BEAT_TENSION','GAP_0']`.

---

## 11. OWNER-FORK notes (genuine product choices — do not guess as settled)

- **OWNER-FORK 1 — Difficulty philosophy: invisible-honest vs. player-chosen.** This spec ships a *bounded, disclosed* auto-adjust (challengeBias ±2). Does the owner instead want (a) NO runtime adjust at all (pure tier-cap, fully deterministic — most "competitive integrity," per AI_Testing `Balance_Philosophy_Competitive_Integrity`), (b) the disclosed ±2 as specced, or (c) a classic player-selectable difficulty setting (Story/Normal/Brutal) that sets the bias range and gate thresholds? This is a core feel decision.
- **OWNER-FORK 2 — How visible should Heat be?** Full numeric Heat overlay (specced) is maximally legible but can feel "gamey." Alternatives: diegetic-only (Heat shown solely through news intensity + email volume, no number/overlay), or a middle "weather forecast" metaphor. Affects whether the world reads as *living* or *instrumented*.
- **OWNER-FORK 3 — Should the Director ever route the player toward a too-hard fight (the "you're not ready" beat)?** Spec says no (it foreshadows and suggests tiering up). Some designers want a deliberate over-tier ambush as a teaching/dramatic moment. If yes, it must still respect the rewind-charge gate — owner call on whether that beat exists at all.
- **OWNER-FORK 4 — Relief duration & strength.** `reliefDays` (2/3/4) and reliefMultiplier 2.0 set how much "air" the player gets. This is pure pacing taste (JA2 grind vs. CK breathing room) — owner should playtest-tune.
- **OWNER-FORK 5 — Rewind interaction depth.** Spec ties the +2/+3 brutal-fight gate to rewind charges, and rolls DirectorState back on rewind. Owner may want the opposite: that rewinding *escalates* Heat (the timeline "remembers" and pushes harder), making save-scumming actively dangerous. Big tonal lever on the §11 time-travel fantasy.
- **OWNER-FORK 6 — Per-nation Director independence for MP.** Spec keeps one DirectorState per nation (MP-ready). If MP will ever have *shared* world pressure (one Director for a shared dimension), the schema needs a coordination layer now. Owner should confirm the MP shape before this is built, or accept a later refactor.

---

## 12. Open questions

1. **Tactical-decision counting.** Auto_Balance targets "2–5 meaningful decisions per combat" (row 15) but does not define how to *count* a decision at runtime. Proposed proxy (RULING, needs validation): count = (#stance/mode switches) + (#power-vs-basic choices) + (#target re-prioritizations) + (#terrain/throw interactions). Needs a real metric before the special-rule injector (§6.2) can fire correctly.
2. **Heat inflow coefficient tuning.** The 0.4/0.3/0.3/0.5/0.2 weights and 2.0/day decay are first-pass rulings; they need a sim pass (Auto_Balance's 1000-run methodology) to confirm Heat reaches SPIKE at a satisfying cadence per tier.
3. **Cross-region travel and Heat.** When the player travels mid-cooldown (Time_Management travel encounters), does the *origin* region's Heat keep climbing while they're away? Spec assumes yes (decay still applies, inflow continues from stats) — confirm this matches the "world lives without you" intent vs. performance cost of ticking every region.
4. **World-sim authority precedence.** When a world-sim Global event (§6.5) and a Director SPIKE want the clock at different tempos simultaneously, which wins? Spec says world-sim crisis tempo (1:15) dominates; confirm the world simulation exposes a tempo-request API the Director can defer to.
5. **Fame→Heat saturation.** `playerFameInRegion/maxFame` assumes a known `maxFame`. Public_Perception is an open-ended ladder (−100 to +40 named events) with no hard ceiling. Need a normalization constant (RULING placeholder: maxFame = 100) confirmed against the fame system's actual range.
6. **Onboarding override.** Tier-1 first-hour pacing (SCEN_019 "New Player Training", Scenario_Templates row 20) may want the Director *disabled or scripted* for the tutorial. Spec assumes the tutorial bypasses the Director entirely; confirm the handoff point where the Director takes over.

---

*This spec governs PACE and SIZE; it never authors content (events engine) and never picks targets (personality §5.10). Every coefficient lives in `ai_director_config` so the world can be re-tuned in a spreadsheet, not code — Pillar #1. Its prime directive is the two contracts: foreshadow everything, cheat nothing.*
