# 110 — Fork-in-the-Road / Decision Event UI & Resolution

> **System owner doc.** Build-ready spec for the player-facing presentation and resolution of *Fork-in-the-Road* (FITR) decision events.
> **Status:** Design complete, ready to implement.
> **Scope boundary:** This spec covers *presentation + choice capture + resolution + consequence application + ripple persistence* for decision events. It does **not** cover the upstream **Events Engine** (template selection / parameterization by country-stat + personality), which is system **#2** on the build checklist and is treated here as an **input contract** (see §9, "What the Events Engine must hand us"). FITR is the renderer + resolver that sits on top of that engine.
>
> **Primary sources (read before editing):**
> - `SHT_MECHANICS_BIBLE.md` §1 pillar 3 (Forks-in-the-Road ripple), §7.1 (email reply = your choice), §9 (consequences: reputation delta / financial / legal / insurance scale), §13 rulings.
> - `SuperHero Tactics/FIST GDD v02.txt` lines 135–151 (Email Replies are Dialogue Decisions), 380–399 (FITR + time-travel save), 1106–1117 (FITR definition + the three canonical examples).
> - `docs/csv-source-data/Public_Perception.csv` (the consequence scale table — THE numbers).
> - `docs/csv-source-data/Dynamic_Political_Events.csv` (`Player_Choices`, `Immediate_Consequences`, `Long_Term_Impact` columns).
> - `docs/csv-source-data/Result_Templates.csv` (success-band → relationship/reward/world-event mapping).
> - `docs/csv-source-data/Email_Investigation_Templates.csv` (`Priority_Level`, `Urgency_Hours`, `Response_Options`, `Auto_Expire` — the email envelope FITR rides in).
> - `docs/csv-source-data/Time_Management.csv` (`Event_Priority_*` response windows).
> - `SuperHero Tactics/Combat Compendium REAL - 🎯PERSONALITY TARGET SELECTION🎯.csv` (the 20 personality codes that drive NPC-initiated forks).
> - World Bible `Country.csv` / `Cities.csv` headers (the spine stat columns).
>
> **Existing code this must slot into (do not duplicate):**
> - `MVP/src/data/eventBus.ts` — `EventBus`, `GameEventType`, `GameEventBase`.
> - `MVP/src/data/emailSystem.ts` — `Email`, `EmailReplyOption`, `EmailPriority`, `EmailCategory`.
> - `MVP/src/data/reputationSystem.ts` — `ReputationAxis` (`public|government|criminal|heroic`), `ACTION_REPUTATION_CHANGES`, `adjustMultipleReputation`, `TIER_THRESHOLDS` (range **−100..+100**).
> - `MVP/src/data/deathConsequences.ts` — `processFuneralChoice` (the funeral fork is a FITR subtype).
> - `MVP/src/stores/enhancedGameStore.ts` — game state, money, time.

---

## 1. Overview & player fantasy

A **Fork-in-the-Road** is a *narrative decision moment* that can fire at any time — in the inbox, on the world map, or mid-combat — and asks the player to make a value-laden choice that **ripples through reputation, law, politics, and personnel for the rest of the campaign** (Bible §1 pillar 3). It is the game's "a game is a series of interesting choices" pillar made literal (GDD line 420, Sid Meier quote).

The fantasy: *you are the one in the chair when the hard call lands.* The GDD's three canonical examples (GDD lines 1114–1116) are the north star for tone:

1. *"When The Burning Man's secret identity is discovered by an investigative reporter, how will you respond when she bursts into your office?"*
2. *"Will you have Jacobs Hughes arrested when he steals drugs during the Cuatro Dedos super-cartel takedown?"*
3. *"When the super-criminal Ragic claims to have created a cure for superheroes dying from a terminal illness, will you trust him?"*

Three things make FITR distinct from a plain mission email:
- **It can surface in three contexts** — inbox (the default, GDD §7.1 "email reply = dialogue"), a world-map / phone *interrupt* (urgent, may pause the real-time clock per Bible §7 "laptop pauses time"), or a **combat overlay** (a battlefield call, e.g. "execute the surrendering villain?").
- **Inaction is a choice.** Ignoring a FITR resolves it via a `timeout`/`default` branch with its own consequences (GDD line 151: *"if the player does not respond to many events they will occur without the player being aware"*).
- **Consequences are scaled and durable** — they write to a persistent ledger and can be *partially undone only by diegetic time-travel rewind* (Bible §11), which costs Time-Walker sanity. There is no normal save-scum escape.

FITR reuses the **email envelope** (`Email` + `EmailReplyOption` in `emailSystem.ts`) for inbox-context forks, but adds a decision-specific payload (`ForkEvent`) so the same data can render in a modal interrupt or a combat overlay without an inbox round-trip.

---

## 2. Data schema (fields & types)

All new types live in a new file `MVP/src/data/forkSystem.ts`. They are designed to be **emitted by the Events Engine** and **consumed by the FITR renderer**.

### 2.1 `ForkEvent` (the decision instance)

```ts
export type ForkContext = 'inbox' | 'interrupt' | 'combat';

export type ForkPriority = 'critical' | 'high' | 'medium' | 'low' | 'background';
// 1:1 with Email_Investigation_Templates.Priority_Level and Time_Management.Event_Priority_*

export interface ForkEvent {
  id: string;                       // uuid
  templateId: string;               // FK to the authored FITR template (Events Engine #2 owns templates)
  context: ForkContext;             // where it surfaces
  priority: ForkPriority;
  title: string;                    // parameterized subject line ("URGENT: Reporter at the door")
  body: string;                     // parameterized situation text (the "fork" prose)
  imageRef?: string;                // optional illustration key (reuses EmailAttachment image pipeline)

  // Spine context captured AT FIRE TIME (frozen so consequences are deterministic on rewind)
  spine: ForkSpineContext;          // see §2.4

  // The choices
  options: ForkOption[];            // 2–4 (see RULING-A)
  defaultOptionId: string;          // resolved if timed out / ignored

  // Timing
  firedAtGameMinute: number;        // game clock when it appeared
  urgencyHours: number;             // in-GAME hours until auto-resolve (see §4 table). 0 = no expiry.
  pausesClock: boolean;             // interrupt/combat forks pause real-time; inbox forks do not
  autoExpire: boolean;              // Email_Investigation_Templates.Auto_Expire

  // State
  status: 'pending' | 'resolved' | 'expired' | 'rewound';
  chosenOptionId?: string;
  resolvedAtGameMinute?: number;
  resolvedBy?: 'player' | 'timeout' | 'rewind';
}
```

### 2.2 `ForkOption` (one branch of the fork)

```ts
export interface ForkOption {
  id: string;
  label: string;                    // short button text ("Have him arrested")
  detail?: string;                  // hover/expand explanation of likely fallout
  tone: 'heroic' | 'pragmatic' | 'ruthless' | 'evasive' | 'neutral';
                                    // drives the 4 reputation axes (see §5.2 mapping)

  // Optional skill/resource gate — option shown but disabled if unmet
  requirement?: ForkRequirement;

  // What happens. EITHER deterministic OR a roll on the Universal Table.
  resolution: ForkResolution;
}

export interface ForkRequirement {
  type: 'money' | 'reputation' | 'stat' | 'item' | 'character_present' | 'faction_standing';
  axis?: ReputationAxis;            // for type 'reputation'
  stat?: 'INT' | 'INS' | 'CON' | 'MEL' | 'AGL' | 'STR' | 'STA'; // Bible §3.1
  min: number;                      // threshold to enable
  consumeOnPick?: boolean;          // e.g. bribe spends money
  amount?: number;                  // money/item qty consumed
}
```

### 2.3 `ForkResolution` (the consequence payload)

```ts
export interface ForkResolution {
  // If rolled, the outcome BAND selects which ConsequenceBundle applies.
  roll?: {
    stat: 'INT' | 'INS' | 'CON' | 'MEL' | 'AGL' | 'STR' | 'STA';
    columnShift: number;            // ±CS from spine/skills (Bible §3.3 "CS is the universal currency")
    // Bands map to Result_Templates.csv success levels:
    // 'criticalSuccess' 95-100 | 'majorSuccess' 80-94 | 'success' 60-79
    // | 'partial' 40-59 | 'failure' 20-39 | 'criticalFailure' 0-19
  };
  // If roll is omitted, 'success' bundle applies unconditionally (deterministic fork).
  bundles: Partial<Record<OutcomeBand, ConsequenceBundle>>;
}

export type OutcomeBand =
  | 'criticalSuccess' | 'majorSuccess' | 'success'
  | 'partial' | 'failure' | 'criticalFailure';

export interface ConsequenceBundle {
  // Immediate, mechanical effects (all optional)
  reputation?: ReputationDelta[];          // §5.2 — writes via adjustMultipleReputation
  money?: number;                          // + reward / − cost (see §3, Financial_Consequence)
  legal?: LegalConsequence;                // §3, Legal_Action_Type + Legal_Cost_Range
  insurance?: InsuranceImpact;             // §3, Insurance_Impact
  factionRelations?: FactionRelationDelta[];// Dynamic_Political_Events Relationship_Modifier
  personnel?: PersonnelEffect[];           // recruit/lose/injure/relationship a character
  spawnFollowups?: FollowupSpawn[];        // unlock missions / investigations / future forks
  worldEvent?: WorldEventTrigger;          // fire a Dynamic_Political_Event
  flags?: { set?: string[]; clear?: string[] }; // campaign memory keys

  // Long-tail ripple — persisted and re-evaluated on a schedule (§6)
  ripple?: RippleEffect[];

  // Player-facing summary card shown after Send
  resultSummary: string;                   // "The reporter runs the story. Public −10."
}
```

### 2.4 Supporting types

```ts
export interface ReputationDelta { axis: ReputationAxis; amount: number; scope: ConsequenceScope; }

// ConsequenceScope = Public_Perception.Public_Impact_Scale
export type ConsequenceScope = 'personal' | 'local' | 'regional' | 'national' | 'international' | 'global';

export interface LegalConsequence {
  actionType: string;               // Public_Perception.Legal_Action_Type ("Property damage lawsuits")
  costMin: number; costMax: number; // Public_Perception.Legal_Cost_Range parsed to numbers
  chargeTier: 'none' | 'civil' | 'federal' | 'war_crimes'; // Bible §9 escalation ladder
  jurisdictionCountryCode?: string; // scales by country stats (allied minimal / hostile escalated)
}

export interface InsuranceImpact {
  direction: 'improve' | 'increase' | 'denied' | 'collapse'; // Public_Perception.Insurance_Impact buckets
  ratePctDelta?: number;            // e.g. +25 (Property_Damage_Major), see §3
}

export interface FactionRelationDelta { factionId: string; amount: number; } // −5..+3, Dynamic_Political_Events §22

export interface PersonnelEffect {
  characterId: string;
  effect: 'recruit' | 'dismiss' | 'imprison' | 'injure' | 'kill' | 'morale' | 'relationship';
  value?: number;                   // morale/relationship delta
  relationshipTargetId?: string;
}

export interface FollowupSpawn { kind: 'mission' | 'investigation' | 'fork' | 'email'; templateId: string; delayGameHours: number; }
export interface WorldEventTrigger { eventId: string; /* FK Dynamic_Political_Events.Event_ID */ params?: Record<string,string>; }

export interface RippleEffect {
  id: string;
  description: string;              // "Reporters distrust the org" (player-readable in a 'Consequences' log)
  reEvaluateEveryGameDays: number;  // cadence to re-apply (e.g. 7)
  expiresAtGameDay?: number;        // undefined = "rest of campaign" (Bible §1 pillar 3)
  effectOnTick: ConsequenceBundle;  // recursive but ripple omitted to avoid infinite nesting
}

// Frozen spine snapshot (§2.1) — see §5 for which fields drive what.
export interface ForkSpineContext {
  countryCode: string;
  cityName?: string;
  cityType1?: string; cityType2?: string;          // City_Type_Effects
  cultureCode?: string;                            // Culture_Region_Effects
  // raw country stats pulled from World Bible Country.csv at fire time:
  corruption: number; lawEnforcement: number; mediaFreedom: number;
  militaryBudget: number; intelligenceBudget: number; gdpNational: number;
  healthcare: number; lswRegulations: number; vigilantism: number;
  // initiating NPC (for NPC-driven forks)
  npcId?: string;
  npcPersonalityCode?: number;                     // 1..20, PERSONALITY TARGET SELECTION columns
  factionStanding?: 'home' | 'ally' | 'neutral' | 'hostile'; // Bible §6.4
}
```

---

## 3. Exact numbers, tables & formulas (each cited)

### 3.1 Consequence SCALE — the master table (`Public_Perception.csv`)

Every `ConsequenceBundle` for a *collateral / heroic* outcome is authored against this table. These are the canonical numbers — **never invent others.** (Source: `docs/csv-source-data/Public_Perception.csv`, columns `Public_Impact_Scale`, `Reputation_Change`, `Financial_Consequence`, `Legal_Action_Type`, `Legal_Cost_Range`, `Insurance_Impact`.)

| Perception_Event | Scope | Reputation_Change | Legal_Cost_Range | Insurance_Impact |
|---|---|---|---|---|
| Street_Crime_Stopped | Local | **+2** local | None | improve |
| Property_Damage_Minor | Local | **+1 local / −1 property** | $5K–$25K | slight increase |
| Property_Damage_Major | Regional | **−2** regional | $100K–$500K | **+25%** |
| Civilian_Casualties_Minor | National | **−5** national | $50K–$200K per civilian | coverage questioned |
| Civilian_Casualties_Major | International | **−10** global | $500K–$5M per civilian | denied |
| Building_Destruction | Regional | varies by building | $250K–$10M | rates skyrocket |
| Infrastructure_Damage | National | **−8** national | $1M–$50M | govt review |
| Hospital_Damage | National | **−12** national | $2M–$20M | medical crisis |
| School_Damage | National | **−15** national | $1M–$15M/school | review |
| Government_Building_Damage | International | **−20** | $5M–$100M | govt crisis |
| Military_Base_Damage | International | **−25** | $10M–$200M | review |
| Nuclear_Facility_Damage | Global | **−50** global | $100M–$10B | industry panic |
| Mass_Destruction | Global | **−100** global | $1B–$1T+ | collapse |
| Saved_Lives_Civilian | Local→Global | **+5 to +20** | positive | improve |
| Prevented_Disaster | Regional→Intl | **+10 to +30** | positive | gratitude |
| Alien_Technology_Recovery | Global | **+25** science | IP battles | implications |
| Public_Identity_Exposed | Personal | **−10** personal | $50K–$500K personal security | terminated |
| Team_Member_Death | Faction | **−15** faction | $500K–$5M/death | life-insurance claims |
| Faction_Betrayal | Global | varies | $1M–$50M | political-risk |
| Heroic_Recognition | Honor | global +recognition | ceremony $100K–$1M | honor-guard |

**`chargeTier` ladder** (Bible §9 "property → civil suits → federal → war-crimes"): map `Legal_Action_Type` strings → `none` (None/positive), `civil` (lawsuits/claims), `federal` (federal investigation, constitutional, environmental EPA), `war_crimes` (war crimes / crimes against humanity / international tribunal).

### 3.2 Choice → consequence linkage (`Dynamic_Political_Events.csv` + `Result_Templates.csv`)

For *political* forks, the four-way `Player_Choices` column already enumerates branch labels (e.g. POL_001: *"Escalate tech competition; Share research for cooperation; Steal technology through espionage; Diplomatic negotiation"*), with `Immediate_Consequences` and `Long_Term_Impact` columns providing the `ConsequenceBundle` and `ripple` text respectively. **Authoring rule:** a political FITR option's `resolution.bundles.success` is filled from `Immediate_Consequences`; its `ripple[0].description` from `Long_Term_Impact`.

**Faction relation deltas** (Source: `Dynamic_Political_Events.csv` rows 20–22):
- Positive faction action: **+1 to +3**
- Negative faction action (betrayal/aggression/civilian casualties in allied territory): **−1 to −5**
- Neutral / non-engagement: **0**

**Outcome bands** for rolled forks (Source: `Result_Templates.csv`, `Success_Level` column):

| Band | Roll % | Relationship_Change | Reward | Follow-ups | World_Event | Detection |
|---|---|---|---|---|---|---|
| criticalSuccess | 95–100 | **+3** country | high-value | 2–3 unlock | major positive | none |
| majorSuccess | 80–94 | **+2** | med-high | 1–2 unlock | positive | low |
| success | 60–79 | **+1** | standard | 1 unlock | neutral | medium |
| partial | 40–59 | **0** | reduced | 50% chance | minor negative | high |
| failure | 20–39 | **−1** | none | harder | negative | very high |
| criticalFailure | 0–19 | **−2** | resource loss | locked | major negative | full exposure |

### 3.3 Resolution roll (when `resolution.roll` present)

Reuse the **one** resolution engine (Bible §3.3, RULING §13.1 — `Universal_Table_FIXED`):
1. `finalColumn = rankOf(stat) + columnShift` where `columnShift` is summed from spine + skill modifiers (§5.3).
2. Roll **d100** (99 = always Fail, 00 = always Major — Bible §3.3 ruling).
3. Read the outcome band on `Universal_Table_FIXED` → map to `OutcomeBand` via the §3.2 percentage bands.
4. Apply the matching `ConsequenceBundle`. If a band has no authored bundle, fall back to the nearest lower-severity band that does (RULING-B).

> **RULING-B (band fallback):** Authors are not required to write all six bundles. Resolution selects the chosen band; if absent, it walks **toward `success`** (criticalSuccess→majorSuccess→success; criticalFailure→failure→partial→success) until a bundle is found. This keeps templates terse without runtime crashes. (No source table specifies fallback; ruled here for buildability, consistent with Bible §13's "ship one thing" ethos.)

### 3.4 Reputation axis values (existing code, do not re-derive)

FITR writes reputation through `reputationSystem.adjustMultipleReputation`. The axes are `public | government | criminal | heroic`, each clamped **−100..+100** (`reputationSystem.ts` `clampReputation`, `TIER_THRESHOLDS`). When a fork option maps to an existing `ReputationAction`, **reuse `ACTION_REPUTATION_CHANGES`** rather than hand-authoring numbers. Examples already defined:
- `civilian_casualties`: `{ public:−25, government:−20, criminal:+5, heroic:−25 }`
- `expose_corruption`: `{ public:+20, government:−10, criminal:−10, heroic:+15 }`
- `betray_heroes`: `{ public:−20, government:0, criminal:+15, heroic:−50 }`
- `work_with_police`: `{ public:+5, government:+15, criminal:−15, heroic:+5 }`

(Source: `MVP/src/data/reputationSystem.ts` `ACTION_REPUTATION_CHANGES`.)

---

## 4. Timing & priority (`Email_Investigation_Templates.csv` + `Time_Management.csv`)

`ForkPriority` is 1:1 with both the email `Priority_Level` and `Time_Management.Event_Priority_*`. The **response window** (`urgencyHours`, in-game hours) and clock behavior:

| Priority | Response window (real-time, Time_Management) | `urgencyHours` default (in-game) | `pausesClock` | Surfaces as |
|---|---|---|---|---|
| critical | respond within **2h real** (`Event_Priority_Critical`) | from template (`Urgency_Hours` e.g. 4–12) | **true** (interrupt) | full-screen interrupt + 🔴 inbox flag |
| high | within **24h real** (`Event_Priority_High`) | template (18–48) | inbox: false; interrupt: true | priority inbox + optional toast |
| medium | within **72h real** (`Event_Priority_Medium`) | template (48–96) | false | inbox |
| low | optional (`Event_Priority_Low`) | template (96–168) or 0 | false | inbox |
| background | passive monitoring | 0 (no expiry) | false | inbox (no flag) |

Sample `Urgency_Hours` straight from `Email_Investigation_Templates.csv`: EMAIL_025 Reality Breach = **4**, EMAIL_007/021 = **6**, EMAIL_017 = **8**, EMAIL_003/013 = **12**, EMAIL_008 = **18**, EMAIL_001/020 = **24**. Use the template's value; the table above is only the **default if the template omits it.**

**Auto-resolve:** when `gameMinute ≥ firedAtGameMinute + urgencyHours*60` and `autoExpire`, resolve via `defaultOptionId` with `resolvedBy:'timeout'`. The default branch is authored (GDD line 151: inaction has consequences). If `autoExpire:false`, the fork waits indefinitely in the inbox.

**Clock interaction (Bible §7):** opening the laptop pauses the real-time world clock; the player may un-pause. `critical`/`combat` forks force `pausesClock:true` so the player can't be steamrolled. Inbox forks never auto-pause — they sit and tick toward expiry, matching GDD §7.1's "never forced to read or respond."

---

## 5. How it consumes the SPINE (the load-bearing formulas)

The spine (Bible §2) shapes a fork in **three** places: *which options appear*, *the column-shift on rolled options*, and *how consequences scale*. All inputs are frozen into `ForkSpineContext` at fire time (so a rewind re-applies identically).

### 5.1 Option availability gates (country/city stats → show/hide a branch)

Authored gates reference spine fields. Canonical mappings (Source: `Country_Attribute_Effects` summarized in Bible §6.1, and `City_Type_Effects` Bible §6.2):

| Branch type | Spine gate (from frozen country stats) | Rule |
|---|---|---|
| **Bribe / pay-off** | `corruption` | Enabled only if `corruption ≥ 50`. Cost scales: `bribeCost = baseCost × (1 + (100 − corruption)/100)` — high corruption = cheaper bribes (Bible §6.1 "High corruption: +3CS bribes, cheap black market"). |
| **Cover it up** | `mediaFreedom` | Enabled if `mediaFreedom ≤ 40` (low media freedom enables cover-ups, Bible §6.1). |
| **Go to the press / expose** | `mediaFreedom` | Stronger effect if `mediaFreedom ≥ 60` (reputation delta ×1.5). |
| **Call in the military / lethal force** | `factionStanding` + `militaryBudget` | Enabled if `factionStanding ∈ {home, ally}` OR `militaryBudget ≥ 60`. |
| **Use cloning / resurrect** | country `cloning` law | Only if cloning legal (Bible §6.1). |
| **Sanctuary / lie low** | `cityType*` includes Temple (24h sanctuary, Bible §6.2) | Adds an "Take sanctuary" option. |

### 5.2 Option TONE → reputation axes (the default mapping)

Each `ForkOption.tone` provides a *baseline* reputation vector (overridable per-option). RULING-C below sets the numbers, consistent with `ACTION_REPUTATION_CHANGES` magnitudes (±5/±10/±15/±25 family).

| tone | public | government | criminal | heroic | Mirrors existing action |
|---|---|---|---|---|---|
| heroic | +10 | +5 | −5 | +10 | `save_civilians` |
| pragmatic | 0 | +5 | 0 | 0 | (between work_with_police & neutral) |
| ruthless | −10 | +5 | +10 | −15 | (vigilante_justice ∪ defy) |
| evasive | −3 | −5 | +3 | −5 | (cover-up flavor of vigilante_justice) |
| neutral | 0 | 0 | 0 | 0 | — |

> **RULING-C:** these tone vectors are the **fallback** only when an option does not specify an explicit `reputation` bundle. Authored forks should prefer named `ReputationAction`s (reuse) or explicit deltas keyed to the §3.1 scale. (Source for magnitudes: `ACTION_REPUTATION_CHANGES`; tone grouping is a design ruling.)

### 5.3 Spine → column shift on rolled forks

For an option with `resolution.roll`, the **base `columnShift` is authored**, then modified by spine at resolve time:

```
effectiveCS = option.resolution.roll.columnShift
            + factionCS(factionStanding)        // home +3, ally +1, neutral 0, hostile −2   (Bible §6.4)
            + cultureCS(npc.culture, actor.culture) // same +2, opposed −1, language barrier −2 (Bible §6.3)
            + corruptionCS(stat, corruption)    // if stat is a "covert/bribe" check & corruption≥60: +3 (Bible §6.1)
```

`factionCS`, `cultureCS` values are **verbatim from Bible §6.3/§6.4** — do not invent. The roll then runs §3.3.

### 5.4 Consequence SCALING by jurisdiction

`LegalConsequence` severity scales by the country the fork fired in (Bible §9 "allied nations minimal; hostile escalated"):

```
legalMultiplier = factionStanding === 'home'    ? 0.25
                : factionStanding === 'ally'     ? 0.5
                : factionStanding === 'neutral'  ? 1.0
                : /* hostile */                    2.0
finalCostMin = round(bundle.legal.costMin × legalMultiplier)
finalCostMax = round(bundle.legal.costMax × legalMultiplier)
```

> **RULING-D:** the 0.25/0.5/1.0/2.0 jurisdiction multipliers are derived from Bible §6.4's CS tiers (home/ally/neutral/hostile) re-expressed as cost multipliers, because `Public_Perception.csv` gives ranges but not the per-jurisdiction scalar. Consistent with Bible §9's stated direction. **OWNER may retune** (see OWNER-FORK 3).

### 5.5 NPC personality → which fork the *NPC* initiates (NPC-driven forks)

When a fork is initiated by an NPC (e.g. a teammate confronts you, a villain offers a deal), the NPC's personality code (`npcPersonalityCode`, 1..20 from `PERSONALITY TARGET SELECTION`) biases *which* template the Events Engine picks and the **tone of the default/timeout branch**. The 20 codes resolve to a target-preference value in `{1=most-health, 2=least-health, 3=major-threat, 4=minor-threat, 5=random}` per the source CSV row 2. FITR maps that target-preference into a *social* disposition for the default branch:

| Target-pref value | Social disposition of NPC's default branch |
|---|---|
| 3 (major threat) | Confrontational — default branch escalates against the player |
| 4 (minor threat) | Opportunistic — default branch exploits the weakest position |
| 1 (most health) | Cautious — default branch is a stand-off / delay |
| 2 (least health) | Predatory — default branch presses an advantage |
| 5 (random) | Erratic — default branch chosen at random among authored branches |

> **RULING-E:** mapping the *combat* target-preference onto a *social* disposition is a design ruling — the source table only defines combat targeting. It is the only personality signal currently in the data with all 20 codes resolved; using it keeps NPC forks "character-consistent" (Bible §5.10) until a dedicated social-disposition table exists. (Source: `PERSONALITY TARGET SELECTION` CSV; mapping is ruled.)

---

## 6. Ripple persistence (the "rest of the campaign" requirement)

Bible §1 pillar 3 demands consequences "ripple … for the rest of the campaign." Implementation:

- On resolve, every `RippleEffect` in the applied bundle is appended to a persistent store `forkRippleLedger: RippleEffect[]` in `enhancedGameStore`.
- A subscriber to `time:day-passed` (`eventBus.ts`) ticks the ledger: for each ripple where `currentGameDay % reEvaluateEveryGameDays === 0`, apply `effectOnTick` (reputation drift, recurring cost, recurring world pressure).
- A ripple with no `expiresAtGameDay` runs until campaign end (or until cleared by a flag — e.g. a later "make amends" mission sets a flag that the ripple checks).
- The **Consequences Log** UI (§7.4) reads this ledger so the player can *see* the long tail of their choices (GDD line 411 "give the player feedback").

**Determinism on rewind (Bible §11):** because `ForkSpineContext` is frozen and rolls are seeded (`seed = hash(forkId + firedAtGameMinute)`), re-resolving a fork after a time-travel rewind reproduces identical option availability and roll bands unless the player picks a different branch. A rewound fork's prior `ConsequenceBundle` (and its ripples) are **rolled back** from the ledger before the new branch applies. (See §8 failure modes for partial-rollback edge cases.)

---

## 7. UI/UX hooks

FITR renders in **three** surfaces, sharing one `<ForkCard>` core component (title, body, image, option buttons, requirement badges, result summary). All visuals follow the project's authored aesthetic (no purple; warm-dark base with a non-purple accent per global design rules).

### 7.1 Inbox context (default — GDD §7.1)
- Renders inside the existing **Email** app. A FITR is an `Email` with `category:'mission_briefing'` (or a new `'decision'` category) and `replyOptions` populated from `ForkOption[]`.
- The body shows the situation; the reply options are the fork branches; **Send = commit the choice** (GDD lines 147–148). No free text.
- Priority flag (🔴 critical / 🟠 high) per §4. A countdown chip shows `urgencyHours` remaining when `autoExpire`.
- Disabled options (requirement unmet) show a greyed button with a reason tooltip ("Need $25,000" / "Government rep ≥ 25").

### 7.2 Interrupt context (urgent / world-map / phone)
- A modal overlay that **pauses the real-time clock** (`pausesClock:true`, Bible §7). Used for `critical`/`high` forks that shouldn't wait in an inbox (the GDD's "reporter bursts into your office").
- Dismiss = defer to inbox **only if** `autoExpire` window still open; otherwise the modal is forced (cannot dismiss a `critical` fork that has no inbox fallback).

### 7.3 Combat overlay context
- A compact in-combat panel (battlefield decision, e.g. "The villain surrenders — execute, capture, or let walk?"). Combat is **symbolic** (Bible: plain grid + glyphs), so the overlay is a lightweight card pinned to the HUD; it pauses the turn timer, not the whole game.
- Resolution feeds the **same** consequence pipeline; combat-context forks commonly carry `personnel` (capture → prisoner DB) and `reputation` (execute → −heroic) effects.

### 7.4 Consequences Log (cross-cutting)
- A laptop tab listing resolved forks + active ripples (from the ledger), each with its `resultSummary`, the scope badge, and a "still in effect" indicator. This is the *feedback* surface (GDD line 411) and the place a rewind is initiated from (links to the Time-Walker UI).

### 7.5 Funeral fork (existing subtype)
- The **funeral decision** (GDD lines 1101–1104, 397) is a FITR specialization: it reuses `ForkEvent` with options wired to `deathConsequences.processFuneralChoice`. Do not build a parallel UI — author it as a FITR template.

---

## 8. Edge cases & failure modes

1. **Multiple forks fire simultaneously.** Queue by priority (`critical > high > medium > low > background`), then by `firedAtGameMinute`. Only one interrupt modal at a time; the rest wait in the inbox. (Combat-context forks always front of queue while in combat.)
2. **Fork fires during combat but is inbox-priority.** Hold it in a pending buffer; surface to inbox on combat exit (don't pop an inbox toast mid-fight).
3. **Requirement becomes unmet between fire and resolve** (player spent the money elsewhere). Re-validate `requirement` at *Send* time, not fire time. If now unmet, disable and require a different choice.
4. **Timeout with no authored default branch.** Validation error at template-load (every `autoExpire:true` fork MUST define `defaultOptionId`). RULING-F: load-time assert; ship-blocking.
5. **Referenced character is dead/missing for a `personnel` effect.** Skip that effect, log a warning, still apply the rest of the bundle. (A villain you'd arrest died in the prior combat → arrest branch silently no-ops the imprison.)
6. **Spine country has missing stat columns** (World Bible rows with blank cells). Treat missing numeric stats as the dataset median (RULING-G) so gates don't crash; log which fork/country to flag for data cleanup. (Bible §13.10: unify on `allCountries`/`allCities`.)
7. **Rewind partial rollback.** If a ripple already triggered downstream world events (a war started), rolling back the fork rolls back the *ripple ledger entry and direct deltas* but **not** independent world-state that has since diverged (Bible §11's whole point: rewinds are costly and imperfect). Mark such forks `irreversibleRippleFired:true` and warn the player before rewind.
8. **Faction the relation-delta targets has been dissolved** (Faction_Betrayal long-tail). No-op the delta, keep the reputation/legal effects.
9. **Player ignores a `background` fork forever** (`urgencyHours:0`, `autoExpire:false`). It persists in the inbox with no penalty until acted on — by design (GDD: low/background = optional).
10. **Double-Send / race.** `status` guards: once `pending → resolved`, further Send calls are rejected (idempotent on `chosenOptionId`).
11. **Combat-context fork where the game is also paused for laptop.** Combat forks suppress the laptop button; resolve the combat fork first.

---

## 9. Integration points (reads / writes)

**Reads:**
- Events Engine (#2) — *the input contract.* FITR consumes a fully-parameterized `ForkEvent` (template chosen + spine frozen + options assembled). FITR does **not** select templates.
- `World Bible Country.csv` / `Cities.csv` (via `allCountries`/`allCities`) — spine stats for `ForkSpineContext` (read once at fire time).
- `reputationSystem.ts` — `ACTION_REPUTATION_CHANGES`, `TIER_THRESHOLDS`, current `ReputationState`.
- `enhancedGameStore` — money, game clock, roster (for requirements/personnel).
- `factionSystem.ts` — `factionStanding` for spine + faction relation writes.

**Writes:**
- `reputationSystem.adjustMultipleReputation` — reputation deltas.
- `enhancedGameStore` — money delta, `forkRippleLedger`, campaign `flags`, prisoner DB (capture), roster (recruit/dismiss).
- `deathConsequences.processFuneralChoice` — funeral-subtype forks.
- `eventBus.emit` — new events (below) so news/economy/investigation systems react.
- `Dynamic_Political_Events` trigger — `worldEvent` fires a political event by `Event_ID`.
- `missionStore` / investigation system — `spawnFollowups` (mission/investigation unlocks; mirrors `Result_Templates.Follow_Up_Investigations`).

**New `GameEventType` values to add to `eventBus.ts`** (category `'player'` or new `'decision'`):
```
'fork:fired' | 'fork:resolved' | 'fork:expired' | 'fork:rewound'
```
Emit `fork:resolved` with `{ forkId, templateId, chosenOptionId, band, bundleApplied }` so news/economy/reputation subscribers stay decoupled (matches the existing pub/sub pattern in `emailSystem.ts` / `newsGenerator.ts`).

**What the Events Engine (#2) must hand us (input contract):** a `ForkEvent` with `templateId`, `context`, `priority`, parameterized `title`/`body`, a frozen `ForkSpineContext`, and 2–4 fully-resolved `ForkOption`s (labels, requirements, resolution bundles). If any field is missing, FITR rejects the event and logs a template error (fail loud — Bible §13 ethos).

---

## 10. RULING: notes (design rulings made where data was silent)

- **RULING-A (option count 2–4):** Forks have **2–4 options**. The GDD wizard example uses 3 (lines 137–141); `Dynamic_Political_Events.Player_Choices` consistently lists **4**; `Email_Investigation_Templates.Response_Options` lists 4. Ruled: min 2, max 4, author's discretion. (Source pattern: those two CSVs; exact cap is ruled.)
- **RULING-B (band fallback):** see §3.3 — walk toward `success` when a band's bundle is unauthored.
- **RULING-C (tone reputation vectors):** see §5.2 — fallback vectors keyed to `ACTION_REPUTATION_CHANGES` magnitude family.
- **RULING-D (jurisdiction legal multipliers 0.25/0.5/1.0/2.0):** see §5.4 — derived from Bible §6.4 CS tiers.
- **RULING-E (personality→social-disposition map):** see §5.5 — reuse the combat target-preference codes for NPC default-branch tone until a social table exists.
- **RULING-F (default branch mandatory for auto-expire):** §8.4 — load-time assert, ship-blocking.
- **RULING-G (missing stat → dataset median):** §8.6 — keeps gates safe on incomplete World Bible rows.
- **RULING-H (seeded rolls):** §6 — `seed = hash(forkId + firedAtGameMinute)` so rewinds are deterministic.
- **RULING-I (funeral = FITR subtype, not separate system):** §7.5 — reuse `ForkEvent` → `processFuneralChoice`.

---

## 11. OWNER-FORK: notes (genuine product calls only the owner can make)

These are real product decisions, not data gaps — do **not** guess them as settled:

1. **OWNER-FORK 1 — Inbox vs. interrupt threshold.** Should *all* `high`-priority forks force an interrupt modal (pausing the clock), or only `critical`? More interrupts = more drama but more friction; the GDD's reporter example reads like an interrupt, but §7.1's whole philosophy is "never forced to read." Owner sets the line. (Default in this spec: only `critical`/`combat` force interrupt; `high` is inbox + optional toast.)
2. **OWNER-FORK 2 — Rewind cost per fork class.** Bible §11 says rewinds cost Time-Walker sanity and shrink destinations. Should reversing a *major* FITR (e.g. a faction betrayal) cost **more** sanity than a combat loss rewind, and should some "irreversible-ripple" forks be **un-rewindable** entirely? This couples FITR to the time-travel save economy (a separate system); owner decides the coupling.
3. **OWNER-FORK 3 — Legal/financial severity curve.** The §5.4 jurisdiction multipliers (0.25–2.0) and whether collateral costs should be *punishing* (years-long debt, JA2-harsh) or *recoverable* set the whole difficulty tone. RULING-D is a placeholder; the owner owns the economy's pain threshold.
4. **OWNER-FORK 4 — How visible are likely consequences before choosing?** Show full predicted deltas on each option (transparent, strategic), show only flavor `detail` text (mysterious, narrative), or scale visibility by an investigation/intel stat (skill-gated foresight)? Changes the entire feel of decision-making.
5. **OWNER-FORK 5 — Can the player author/queue a *delayed* response** ("send this reply in 3 days") or is it immediate-only? Affects the inbox interaction model.
6. **OWNER-FORK 6 — Multiplayer stub coupling.** Bible says MP lives in the Time-Walker's other dimension. Should FITR outcomes ever be *shared/visible* across the dimensional boundary later (e.g. another player's fork choice seeds your world)? Design single-player now so this can slot in; the owner decides whether to reserve hooks.

---

## 12. Open questions

1. Does the Events Engine (#2) parameterize `urgencyHours` per-instance (e.g. closer threats = shorter fuse), or is it always the template constant? (Spec assumes template constant with the §4 default as fallback.)
2. Are FITR illustrations generated (reusing the `EmailAttachment` image pipeline) or hand-authored per template? (Schema supports `imageRef`; pipeline TBD.)
3. Should the **Consequences Log** surface *predicted* ripple end-states, or only what has already fired? (Affects how much the long tail is foreshadowed.)
4. Do combat-context forks need their own template pool, or are they tagged variants of the same FITR template table? (Spec assumes one table, `context` field discriminates.)
5. When a fork's spine country is one the player has *never visited*, do we still freeze its real stats, or use a "fog-of-war" approximation until intel improves? (Ties to OWNER-FORK 4.)

---

*This document is the resolver/presenter for decision events. The authored FITR template table and the stat+personality selection logic are owned by Events Engine #2 and are an input contract here. All numbers above trace to `Public_Perception.csv`, `Dynamic_Political_Events.csv`, `Result_Templates.csv`, `Email_Investigation_Templates.csv`, `Time_Management.csv`, `PERSONALITY TARGET SELECTION`, the World Bible stat columns, and `reputationSystem.ts`; everything else is an explicit RULING or OWNER-FORK.*
