# 02 — Stat-Driven Event & Emergence Engine

> **System:** Event & Emergence Engine — the **HYBRID** producer that turns the country/city STAT spine + 20 personalities into authored-but-parameterized **events, encounters, missions, and forks**. This is system **#2** on the build checklist; the FITR renderer (doc `110`) and the news/email surfaces are its **consumers**.
> **Status:** BUILD-READY SPEC
> **Spine consumed:** all ~35 country stats (`Country.csv`), city type/crime/population (`Cities.csv`), culture region, terrain, faction standing, the 20 personality types, and the 12 combined-effects systems (`combinedEffects.ts`). Bible ruling #9 (combined-effects must be *consumed*) is this engine's whole job.
> **Bible anchors:** §1 pillar 1 (data-driven), §1 pillar 3 (choices ripple), §1 pillar 4 (the world lives without you), §2 (the SPINE principle — read first), §5.10 (personality-driven AI), §6.5 (dynamic political events + world-state sim), §7.1 (email = the mission system), §7.4 (investigations engine), §11 (time-travel save), §13 ruling #9.
>
> **Primary source tables (read these to re-balance — never hardcode numbers in code; load from CSV at boot):**
> - `docs/csv-source-data/Dynamic_Political_Events.csv` — 15 authored political-event templates (POL_001..POL_015) + 2 AI-generation hooks + relationship/escalation modifiers. **THE event templates.**
> - `docs/csv-source-data/AI_Generated_Political_Scenarios.csv` — 20 scenario archetypes with `AI_Prompt_Template`, `Variable_Inputs`, `Dramatic_Potential`, `Realism_Level`. **THE parameterization grammar.**
> - `docs/csv-source-data/Scenario_Templates.csv` — 20 combat scenario setups (SCEN_001..SCEN_020) + 11 environment types + 5 victory conditions + 5 special rules. **THE encounter/combat-setup templates.**
> - `docs/csv-source-data/World_State_Tracking_System.csv` — 30 trackers (relationship matrix, regional balance, LSW census, crisis pipeline, public opinion…) + update frequency + AI-management notes. **THE world-state model the engine reads/writes.**
> - `docs/csv-source-data/Game_Mechanics_Spec/Country_Attribute_Effects.csv` — every country stat → ±CS + the 6 combination effects + 4 faction-territory bonuses. **THE spine→CS map.**
> - `docs/csv-source-data/Public_Perception.csv` — 34 reputation events with scale / reputation delta / financial / legal / insurance / international rows. **THE consequence scale (numbers).**
> - `docs/csv-source-data/Game_Mechanics_Spec/City_Type_Effects.csv` — 10 city types → investigation/recruitment/combat/threat + crime & population interaction tables.
> - `docs/csv-source-data/Email_Investigation_Templates.csv` — 14+ email envelopes with `Priority_Level`, `Urgency_Hours`, `Response_Options`, `Auto_Expire` (the inbox envelope events ride in).
> - `docs/csv-source-data/Result_Templates.csv` — 20 narrative templates (TEMP_001..TEMP_020) + variable + output-format rows (how an event's outcome renders to news).
> - `docs/csv-source-data/Time_Management.csv` — `Event_Priority_*` rows (response windows: Critical 2h / High 24h / Medium 72h / Low optional / Background).
> - `docs/csv-source-data/AI_Testing_Framework.csv` + `Narrative_Quality_Assessment.csv` — balance tolerances + the 6-metric narrative-quality gate (Country 25% / City 20% / Faction 20% / Cultural 15% / Media-style 10% / Consequence 10%).
> - `SuperHero Tactics/Combat Compendium REAL - 🎯PERSONALITY TARGET SELECTION🎯.csv` — the 20→target-preference map (the personality input; full decode in doc `03`).
> - World Bible `SuperHero Tactics World Bible - Country.csv` / `- Cities.csv` headers — the canonical spine columns.
>
> **Existing code this must slot into (do not duplicate):**
> - `MVP/src/data/eventBus.ts` — `EventBus`, `GameEventType`, `GameEventCategory` (add `'decision'` category + fork/encounter event types).
> - `MVP/src/data/missionGeneration.ts` / `missionSystem.ts` — `MissionType` (11), `MissionSource` (7), `MissionDifficulty` (1–5), `GeneratedMission`, per-city-type weight tables **already exist** — extend, don't replace.
> - `MVP/src/data/combinedEffects.ts` — 12 `calculate*System(country)` functions + `calculateAllCombinedEffects(country)` already compute the spine combos. This engine **consumes** their output.
> - `MVP/src/data/locationEffects.ts` — `calculateCountryEffects`, `calculateCityEffects`, `getLocationContext`, `getAvailableMissions`.
> - `MVP/src/data/emailSystem.ts` — `Email`, `EmailReplyOption`, `EmailPriority`, `EmailCategory` (inbox-context delivery).
> - `MVP/src/data/forkSystem.ts` (doc `110`) — `ForkEvent`, `ForkOption`, `ForkResolution`, `ForkSpineContext`, `ConsequenceBundle` — **the output contract this engine MUST fill** (doc 110 §9: "What the Events Engine must hand us").
> - `MVP/src/data/reputationSystem.ts` — `ReputationAxis` (`public|government|criminal|heroic`), range −100..+100, `adjustMultipleReputation`.
> - `MVP/src/data/newsGenerator.ts` / `newsTemplates.ts`, `factionSystem.ts`, `worldSimulation.ts`, `timeEventGenerator.ts`.

---

## 1. Overview & player fantasy

The Event & Emergence Engine is **the first emergence pillar** of SHT — the country/city STAT spine made to *speak*. It is the layer the Bible's one-paragraph pitch calls "a data-driven living world," and the layer doc `03` (Personality) and doc `110` (FITR) both name as **system #2 / the upstream producer.** Its single job (Bible ruling #9): take the spine — which the code already *computes* but does not yet *consume* — and convert it into the actual things the player encounters.

It is a **HYBRID** engine, not a generative free-for-all. Every event is an **authored template** (a row in `Dynamic_Political_Events.csv`, `AI_Generated_Political_Scenarios.csv`, `Scenario_Templates.csv`, or `Email_Investigation_Templates.csv`) **selected and parameterized** by the local spine + personality context. Authored templates guarantee tone, legality, and consequence-scale realism; spine parameterization guarantees that two playthroughs of the same template in Lagos vs Geneva feel completely different.

It produces **four output kinds** from one selection pipeline:

1. **Forks-in-the-Road** (`ForkEvent`, doc `110`) — value-laden decisions delivered to the inbox / phone interrupt / combat overlay.
2. **Missions** (`GeneratedMission`, `missionSystem.ts`) — deployable tactical jobs.
3. **Encounters** (`Encounter` — combat setups from `Scenario_Templates.csv`: team comp, environment, victory condition, special rules).
4. **World events** (`WorldEvent` — `Dynamic_Political_Events` rows that fire on the world map without the player, mutating the world-state trackers and the relations matrix).

The player fantasy: *"The world has its own life. My phone buzzes with things that are happening because of where I am, who I've angered, and who's on my team. The same crisis plays out differently in a corrupt failed state than in a surveillance superpower. When I ignore it, it happens anyway — and I read about it in the news."*

**Non-goals (scope guards):**
- This engine does **not render** forks/emails/news — it hands fully-parameterized payloads to FITR (doc 110), the email app, and `newsGenerator.ts`.
- It does **not resolve combat** — it *sets up* encounters; `CombatScene.ts` resolves them.
- It does **not own** the personality model — it *reads* `PersonalityType` (doc 03) to bias selection and NPC-initiated forks.
- It does **not** require an LLM at runtime. The `AI_Prompt_Template` columns are a **fallback authoring grammar**: the shipping path is template-table-driven string substitution. An optional online LLM hook is `OWNER-FORK-A`.
- Multiplayer (the time-traveler's other dimension) only ever *reads* world-state. The world-state store must be serializable + diffable so an MP shard can replicate it later (Bible: MP is an architectural stub). Design accordingly; do not build MP.

---

## 2. Data schema (fields / types)

All new types live in a new file `MVP/src/data/eventEngine.ts`, plus the four template loaders. Static template data is loaded **once at boot** from the CSVs (Bible pillar 1 — re-balance in spreadsheets, not code).

### 2.1 Static template reference data (loaded from CSV, immutable at runtime)

```ts
// ---- Political / fork / world-event templates: Dynamic_Political_Events.csv ----
type EventCategory =
  | 'political'    // POL_001..POL_015 (world events + forks)
  | 'crisis'       // Crisis_Escalation_* rows
  | 'relationship';// Relationship_Modifier_* rows

interface PoliticalEventTemplate {
  id: string;                       // 'POL_001' … (Event_ID)
  name: string;                     // Event_Name
  triggerConditions: TriggerSpec[]; // parsed from Trigger_Conditions (see §3.1)
  affectedFactions: string[];       // parsed from Affected_Factions
  descriptionTemplate: string;      // Event_Description (has {Faction_A} placeholders)
  choiceTemplates: string[];        // Player_Choices split on ';'  (2–4)
  immediateConsequences: string;    // Immediate_Consequences (parsed → ConsequenceBundle, §3.4)
  longTermImpact: string;           // Long_Term_Impact (→ RippleEffect, §3.4)
  aiGenerationTemplate: string;     // AI_Generation_Template (fallback/optional LLM grammar)
  scale: 'minor' | 'major' | 'global'; // from Crisis_Escalation rows; default 'minor'
}

// ---- Scenario grammar: AI_Generated_Political_Scenarios.csv ----
interface ScenarioArchetype {
  type: string;                     // 'Technology_Competition' … (Scenario_Type)
  promptTemplate: string;           // AI_Prompt_Template
  variableInputs: string[];         // Variable_Inputs split on ','
  dramaticPotential: 0|1|2|3;       // mapped Medium=1 / High=2 / Very High=3 (§3.6)
  realismLevel: 0|1|2|3;            // Low=0 / Medium=1 / High=2 / Very High=3
}

// ---- Encounter / combat setup: Scenario_Templates.csv ----
interface EncounterTemplate {
  id: string;                       // 'SCEN_001' (Scenario_ID)
  name: string;
  environmentId: string;            // FK → EnvironmentType (11 from same CSV)
  team1Setup: string; team2Setup: string;
  victoryConditionId: string;       // FK → VictoryCondition (5)
  specialRuleIds: string[];         // FK → SpecialRule (5)
  balanceFocus: string;
}
interface EnvironmentType {        // Environment_* rows
  id: string;                       // 'Urban_Street','Industrial_Zone',…
  coverProfile: string; destructionPotential: 'Low'|'Moderate'|'High'|'Ultimate';
  civilianPresence: 'Minimal'|'Limited'|'Possible'|'High';
  terrainCodeHints: string[];       // maps to TerrainCodes.csv for map template pick
}

// ---- Inbox envelope: Email_Investigation_Templates.csv ----
interface EmailEventTemplate {
  id: string;                       // 'EMAIL_001'
  priority: EventPriority;          // Priority_Level
  subjectTemplate: string;          // Subject_Template ({City_Name})
  senderType: string;               // Sender_Type
  investigationType: string;        // Investigation_Type
  urgencyHours: number;             // Urgency_Hours (in-GAME hours)
  bodyTemplate: string;             // Body_Template
  responseOptions: string[];        // Response_Options split on ';'
  autoExpire: boolean;              // Auto_Expire
}

// ---- Narrative render: Result_Templates.csv ----
interface NarrativeTemplate {
  id: string;                       // 'TEMP_001'
  combatScale: string;              // Combat_Scale
  promptTemplate: string;           // AI_Prompt_Template
  variablesRequired: string[];      // Variables_Required
  wordCount: [number, number];      // parsed "150-200"
  outputFormat: string;             // Output_Format
  tone: string;
}
```

`EventPriority` is shared with `Time_Management.csv` `Event_Priority_*` and doc 110's `ForkPriority`:

```ts
type EventPriority = 'critical' | 'high' | 'medium' | 'low' | 'background';
```

### 2.2 The frozen spine context (the parameterization input)

Captured **once at fire time** and frozen, so consequences are deterministic on time-travel rewind (matches doc 110 `ForkSpineContext`). Built by `buildSpineContext(city, country)` from existing `calculateCountryEffects` / `calculateAllCombinedEffects`.

```ts
interface EventSpineContext {
  // Location identity (Bible ruling #10 — unify on allCountries+allCities, ISO-linked)
  countryCode: string;              // ISO; Country.csv 'Country Code'
  cityName: string; sector: string; // Cities.csv 'Sector'
  cultureCode: number;              // Cities.csv 'CultureCode' (1..14)
  cityTypes: string[];              // CityType1..4 (primary first)
  crimeIndex: number;               // 0..100  (Cities.csv 'CrimeIndex')
  populationRating: number;         // 2..7    (Cities.csv 'PopulationRating')

  // Raw spine stats actually USED in formulas (Country.csv columns, 20–90)
  stats: {
    governmentPerception: number; governmentCorruption: number;
    militaryBudget: number; intelligenceBudget: number;
    mediaFreedom: number; lawEnforcement: number;
    healthcare: number; higherEducation: number; science: number;
    cyberCapabilities: number; cloning: number;            // 0–90, often 0
    lswActivity: number;
    lswRegulations: 'Banned'|'Regulated'|'Legal';
    vigilantism: 'Banned'|'Regulated'|'Legal';
    terrorismActivity: 'Inactive'|'Rare'|'Active';
    gdpNational: number; lifestyle: number;
  };

  // Derived combos (from combinedEffects.ts + Country_Attribute_Effects combination rows)
  combos: {
    securityState: boolean;   // High Military + High Intel
    failedState: boolean;     // Low Government + High Corruption
    innovationHub: boolean;   // High Science + High Education
    lswHaven: boolean;        // High LSWActivity + Legal
    medicalCenter: boolean;   // High Healthcare + High Cloning
    lawless: boolean;         // High Corruption + High Crime
  };

  // Faction overlay (faction the PLAYER belongs to vs this country)
  factionTerritory: 'home' | 'allied' | 'neutral' | 'hostile';

  // World-state snapshot keys this event reads (§2.3)
  worldTension: number;       // 0..100 regional military tension
  publicOpinion: number;      // −100..+100 toward LSWs in this country
  activeCrisisIds: string[];  // crises already running here
}
```

### 2.3 The mutable world-state store (`WorldState`)

The 30 trackers in `World_State_Tracking_System.csv`, distilled to the subset the engine reads/writes. Lives in `enhancedGameStore` (or a dedicated `worldStateStore`) so it survives a session and is serializable for the MP stub.

```ts
interface WorldState {
  // World_Politics_Matrix — read-only view of countryrelationships.csv, mutated by events
  relationDeltas: Record<string /*isoA|isoB*/, number>; // applied ON TOP of base codes 1..6
  // Regional_Power_Balance / Military_Tension_Tracking
  regionTension: Record<number /*cultureCode 1..14*/, number>; // 0..100
  // Public_Opinion_Tracking (per country, toward LSWs)
  publicOpinion: Record<string /*iso*/, number>;       // −100..+100
  // Crisis_Event_Pipeline
  activeCrises: ActiveCrisis[];
  // LSW_Population_Dynamics (emergence drives recruitment & encounters)
  lswDensity: Record<string /*sector*/, number>;       // 0..N
  // Campaign memory keys events set/read (shared with FITR flags)
  flags: Set<string>;
  // Doomsday clock (Bible §11): invasion in 2,472 game-days; events scale with it
  daysToInvasion: number;                              // starts 2472
}

interface ActiveCrisis {
  id: string; templateId: string;                       // 'POL_004'
  scale: 'minor'|'major'|'global';                      // Crisis_Escalation_*
  affectedFactions: string[];
  severity: number;                                     // 0..100, escalates if ignored
  spawnedAtDay: number; affectedSector: string;
}
```

### 2.4 The unified event instance (`EmergentEvent`) — the producer output

One internal record; the `kind` decides which consumer it is handed to.

```ts
type EventKind = 'fork' | 'mission' | 'encounter' | 'worldEvent';

interface EmergentEvent {
  id: string;                       // uuid
  kind: EventKind;
  templateId: string;               // FK to the chosen template row
  spine: EventSpineContext;         // frozen at fire time (§2.2)
  priority: EventPriority;
  firedAtGameMinute: number;
  // Exactly ONE of these is populated per kind:
  fork?: ForkEvent;                 // doc 110 contract (§7)
  mission?: GeneratedMission;       // missionSystem.ts
  encounter?: Encounter;            // §2.5
  worldEvent?: WorldEvent;          // §2.6
}
```

### 2.5 `Encounter` (combat setup from `Scenario_Templates.csv`)

```ts
interface Encounter {
  templateId: string;               // SCEN_0xx
  environmentId: string;            // → map template via TerrainCodes
  victoryConditionId: string;       // Defeat|Capture|Objective|Survival|Escape
  specialRuleIds: string[];         // No_Powers|Powers_Only|Env_Hazards|Civilian_Rescue|Time_Limit
  // Spine-driven roster scaling (§3.2):
  enemyFaction: MissionSource;      // police|military|underworld|terrorism|…
  enemyThreatCap: 'Alpha'|'L1'|'L2'|'L3'|'L4'|'L5'; // gated by player tier × LSWActivity
  enemyCount: number;
  civilianDensityCS: number;        // collateral ±CS from City_Type_Effects (§3.5)
}
```

### 2.6 `WorldEvent` (fires without the player)

```ts
interface WorldEvent {
  templateId: string;               // POL_0xx
  affectedSector: string; affectedFactions: string[];
  scale: 'minor'|'major'|'global';
  // Applied to WorldState on fire (§3.4):
  relationChanges: { isoA: string; isoB: string; delta: number }[];
  tensionDelta: number;             // to regionTension
  opinionDelta: { iso: string; delta: number }[];
  newsTemplateId: string;           // TEMP_0xx for the BNN/ANN story (§8)
  spawnsFork?: boolean;             // if player is in/near affectedSector, escalate to a ForkEvent
}
```

---

## 3. Exact numbers, tables & formulas (each cited)

### 3.1 Trigger evaluation — when a template becomes *eligible*

`Trigger_Conditions` (Dynamic_Political_Events.csv) is authored prose; parse each into a `TriggerSpec` predicate. The real, cited triggers per template:

| Template | Trigger (verbatim source) | Parsed predicate |
|---|---|---|
| POL_001 US_China_Technology_War | "China player completes advanced AI research OR US develops quantum computing" | `research.completed('advanced_ai') ‖ research.completed('quantum')` |
| POL_004 European_Neutrality_Crisis | "Any faction operates in Europe with collateral damage >$1M OR European LSW emerges" | `cultureCode∈Europe ∧ collateralDamage > 1_000_000` |
| POL_005 UN_LSW_Treaty_Revision | "Global LSW incidents exceed threshold OR cosmic threat level reached" | `worldState.globalIncidents ≥ THRESHOLD ‖ daysToInvasion ≤ COSMIC_GATE` |
| POL_008 African_Resource_War | "Nigeria controls 50%+ African resources OR external faction extracts" | `factionResourceShare('Nigeria','Africa') ≥ 0.5` |
| POL_013 LSW_Registration_Crisis | "High-profile LSW refuses registration OR registration fails globally" | `roster.any(fame ≥ HIGH ∧ unregistered)` |

> **RULING-A (thresholds the source leaves as "threshold"):** Where a template says "exceeds threshold," use these defaults, **all loaded from a `event_thresholds.csv` data file** so they are re-balanceable (Bible pillar 1):
> - `globalIncidents` threshold = **10** civilian-casualty-major events campaign-wide (`Public_Perception.csv` `Civilian_Casualties_Major` = −10 global each; 10 of them ≈ −100 = `Mass_Destruction` tier → treaty crisis is earned).
> - `COSMIC_GATE` = **494 days** (the final 20% of the 2,472-day clock; Bible §11/§12).
> - collateral `$1M` literal from POL_004 source text; matches `Public_Perception.csv` `Infrastructure_Damage` lower bound ($1M–$50M).

A template is **eligible** when its `TriggerSpec` is satisfied **and** at least one `affectedFaction` matches the player's faction or current country.

### 3.2 Selection weight — which eligible template fires (spine-driven)

For each eligible template `t` against the current `EventSpineContext s`, compute a weight; sample proportionally. Reuse the **existing** per-city-type base weights in `missionGeneration.ts` for `kind:'mission'`; this formula governs forks/encounters/world-events.

```
weight(t, s) = baseWeight(t)                       // 30/25/40… from missionGeneration.ts tables
             × cityTypeMatch(t, s)                 // ×1.5 if template theme ∈ s.cityTypes else ×1.0
             × crimeMod(s.crimeIndex)              // City_Type_Effects crime table, §3.3
             × comboMod(t, s.combos)               // §3.3
             × personalityMod(t, roster)           // §3.5
             × tensionMod(s.worldTension)          // 1 + worldTension/100  (0..+100%)
```

`cityTypeMatch` theme map (from `City_Type_Effects.csv` `Typical_Threats` / `LSW_Affinity` columns), cited:

| City type | Boosted event themes (×1.5) |
|---|---|
| Military | weapon theft, espionage, rogue soldiers, coup (POL_… military) |
| Political | missing officials, corruption, foreign agents, registration (POL_013) |
| Industrial | sabotage, gang violence, corporate crime (POL_006, POL_014) |
| Seaport | smuggling, trafficking, maritime |
| Educational | tech theft, academic conspiracy (POL_001, POL_012) |
| Temple | artifact theft, religious extremism (POL_007) |
| Company | corporate espionage, tech leaks (POL_006, POL_011) |

### 3.3 The spine → ±CS table (the consequence/difficulty driver)

**Authoritative, verbatim from `Country_Attribute_Effects.csv`** — do not invent. Used to (a) set encounter difficulty CS, (b) gate fork options, (c) price consequences. (Stat bands: Low 0–35 / Medium 36–65 / High 66–100.)

| Stat | Low (0–35) | High (66–100) |
|---|---|---|
| GovernmentPerception | Authoritarian: −2CS legal, +2CS covert | Democracy: +2CS legal, −1CS covert |
| GovernmentCorruption | +2CS official, −2CS bribes | −2CS official, **+3CS bribes/blackmail** |
| MilitaryBudget | easy infiltration, poor gear | −2CS infiltration, +2CS military gear |
| IntelligenceBudget | +2CS covert, easy surveillance | −2CS covert, **+3CS detection risk** |
| MediaFreedom | +2CS propaganda, −2CS media investigation | +2CS media investigation, −2CS cover-ups |
| Healthcare | −2CS medical cover, +3CS disease invest. | +2CS medical, faster heal, **cloning possible** |
| Science | −2CS tech invest. | +2CS tech invest., +2CS reverse-eng |
| HigherEducation | −2CS academic, −1CS tech research | +2CS academic, +2CS tech research speed |
| CyberCapabilities | easy hacking | −2CS hacking, +2CS cyber surveillance |
| LSWActivity | −2CS recruitment, peaceful | +2CS recruitment, **+2CS LSW combat encounters** |
| LSWRegulations=Banned | −3CS public ops; +2CS if caught as victim | (Legal) +2CS public ops, public support |
| Vigilantism=Banned | −3CS vigilante, criminal charges | (Legal) +2CS vigilante, public support |
| Cloning=0 | **LSW death permanent here** | 90% resurrection, 7-day clone |

**Combination effects** (verbatim, `Country_Attribute_Effects.csv` rows 37–42 — set `s.combos`):

| Combo | Condition | Effect |
|---|---|---|
| Security State | High Military + High Intel | all covert −2CS; all official +2CS |
| Failed State | Low Government + High Corruption | no legal methods; only force/bribery |
| Innovation Hub | High Science + High Education | +3CS all tech research; unique tech |
| LSW Haven | High LSWActivity + Legal | +4CS recruitment; international LSW hub |
| Medical Center | High Healthcare + High Cloning | fastest healing/best resurrection |
| Lawless | High Corruption + High Crime | all criminal methods +3CS; no legal consequence |

**Faction territory overlay** (verbatim, rows 45–49) applied on top:

| Faction | Home | Allied | Hostile |
|---|---|---|---|
| United States | +3CS all, full gear, legal immunity | — | −2CS all, −2CS gear |
| India | +2CS diplomatic/cultural/spiritual | +1CS diplomatic | −3CS hostile |
| China | +3CS surveillance, +2CS corporate/tech | +1CS tech | −2CS diplomatic, +2CS covert |
| Nigeria | +2CS tribal/underground/resource | +1CS continental | −2CS official |

**Crime index modifier** (`City_Type_Effects.csv` crime table — `crimeMod` in §3.2, and an encounter ±CS):

| Crime | Effect |
|---|---|
| Very Low (0–20) | +1CS all investigations; −1CS criminal recruitment; `crimeMod ×0.8` |
| Low (20–40) | no modifier; `crimeMod ×1.0` |
| Moderate (40–60) | −1CS political invest.; +1CS criminal contacts; `crimeMod ×1.1` |
| High (60–80) | −2CS official, +2CS underground, **combat more likely**; `crimeMod ×1.4` |
| Very High (80–100) | −3CS all legal, +3CS criminal, **constant combat risk**; `crimeMod ×1.8` |

### 3.4 Consequence numbers — verbatim from `Public_Perception.csv`

When an event resolves, its `ConsequenceBundle` (doc 110 `§2.3`) pulls these **exact** scale/delta/cost rows. Selected anchors (full 34 rows in source):

| Perception event | Scale | Reputation Δ | Financial / Legal cost | Legal action |
|---|---|---|---|---|
| Street_Crime_Stopped | Local | +2 local | small reward | none |
| Property_Damage_Minor | Local | +1 / −1 property | $5K–$25K | property claims |
| Property_Damage_Major | Regional | −2 regional | $100K–$500K (+25% insurance) | lawsuits |
| Civilian_Casualties_Minor | National | **−5 national** | $50K–$200K **per civilian** | wrongful injury |
| Civilian_Casualties_Major | International | **−10 global** | $500K–$5M **per civilian** | wrongful death; war-crimes calls |
| Infrastructure_Damage | National | −8 national | $1M–$50M | govt claims |
| Hospital_Damage | National | −12 national | $2M–$20M | medical lawsuits |
| Government_Building_Damage | International | −20 international | $5M–$100M | constitutional |
| Military_Base_Damage | International | −25 military | $10M–$200M | treason/court-martial |
| Nuclear_Facility_Damage | Global | **−50 global** | $100M–$10B | environmental terrorism |
| Mass_Destruction | Global | **−100 global** | $1B–$1T | crimes against humanity |
| Saved_Lives_Civilian | Local→Global | **+5 to +20** | civic awards | none |
| Prevented_Disaster | Regional→Intl | **+10 to +30** | govt awards | commendation |
| Alien_Technology_Recovery | Global | +25 science | massive funding | patent hearings |
| Team_Member_Death | Faction | −15 faction | $500K–$5M per death | wrongful-death vs faction |

**Faction-relation deltas** (`Dynamic_Political_Events.csv` Relationship_Modifier rows): positive action **+1 to +3**; negative action **−1 to −5**; neutral **0**. Crisis escalation scale: Minor (single region) / Major (multiple countries) / Global (all factions).

These feed `WorldEvent.relationChanges` and the FITR `ConsequenceBundle.factionRelations`. **Map a `reputation Δ` to the four `ReputationAxis` of `reputationSystem.ts`** (range −100..+100) per doc 110 §5.2 (tone→axis): heroic outcomes → `heroic`+`public`; ruthless → `criminal`+ `government`−.

### 3.5 Personality bias on selection & NPC-initiated forks

The 20-type → target-preference codes (`PERSONALITY TARGET SELECTION`, decoded authoritatively in doc `03 §3.1`): per-id codes `[1,3,4,4,1,3,4,1,2,2,1,4,2,3,3,3,2,5,5,2]` where 1=MostHealth, 2=LeastHealth, 3=MajorThreat, 4=MinorThreat, 5=Random.

- **`personalityMod` (selection):** `1 + 0.25 × (#roster members whose type's aggression ≥ 0.6) / rosterSize` for combat/crisis templates; `1 − 0.15 × (#diplomatic-leaning members)/rosterSize` (caps ±25%). Aggression per type from doc 03 §2.1 `PersonalityType.aggression` (data-driven; not invented here — owned by doc 03).
- **NPC-initiated forks (the GDD's three canonical examples):** when a `WorldEvent` of category `crisis` fires in the player's sector, the engine spawns a `ForkEvent` whose **default/timeout branch** is biased by the *instigator NPC's* personality target-preference: a `LEAST_HEALTH` (bully) NPC escalates against the weakest roster member; a `MAJOR_THREAT` (pragmatist) NPC targets the player's star. This is the only place personality writes back into the event stream.
- **Civilian-density collateral CS** (`encounter.civilianDensityCS`, from `City_Type_Effects.csv`): Temple −1, Resort −2, Populated/Mega-city −3, Open/Village 0. Lower = more reputation risk from area attacks.

### 3.6 Dramatic potential & realism (pacing the firehose)

`AI_Generated_Political_Scenarios.csv` rates each archetype `Dramatic_Potential` (Medium/High/Very High → 1/2/3) and `Realism_Level` (Low..Very High → 0..3). Use for the **pacing budget** (§4): the engine may fire at most **one Very-High-drama (3) event per game-week**, **two High (2) per week**, unlimited Low. This prevents the "every day is a nuclear crisis" failure and is the only place dramatic potential is consumed.

### 3.7 Encounter scaling (Scenario_Templates → CombatScene)

From `Scenario_Templates.csv` + `AI_Testing_Framework.csv` balance tolerances:
- Threat-level scaling target (PHASE_1A): **Level N+1 beats Level N at ~70%** (L2 v L1) / **~65%** (L3 v L2). The engine sets `enemyThreatCap = playerTier` so encounters are *winnable but not trivial* — never spawn an enemy more than **+1 threat level** above the player's `Player_Scaling` tier cap (Bible §10).
- Same-threat matchups must sit **45–55%** (PHASE_1B): when generating a `skirmish` encounter, mirror enemy count to squad size.
- Environment pick: `EnvironmentType.terrainCodeHints` → `TerrainCodes.csv` → combat map template (this is the city-type→map wiring already in `CLAUDE.md` "Wire map templates to combat by city type").

---

## 4. How it consumes the SPINE (which stats drive what)

This is the section Bible ruling #9 grades. **Every spine input is consumed by a named formula above:**

| Spine input | Consumed by | Effect |
|---|---|---|
| Country `LSWActivity` | §3.2 `tensionMod`/selection; §3.3 +2CS encounters | high → more & harder LSW encounters, +recruitment |
| Country `GovernmentCorruption` | §3.3 fork-option gates | unlocks **bribe** fork options (+3CS); Failed/Lawless combos |
| Country `IntelligenceBudget` | §3.3 detection; §6 covert-fork risk | high → covert forks roll at −2CS, +3CS detection (failure spawns a follow-up crisis) |
| Country `Cloning` | §3.4 `Team_Member_Death` bundle | 0 → death-fork is **permanent**; high → clone-recovery branch offered |
| Country `MediaFreedom` | §8 news rendering; §3.3 cover-up forks | low → events become **propaganda forks** (plant/censor); high → media-investigation forks |
| Combo `securityState`/`failedState`/`lawless` | §3.2 `comboMod` (×1.6 thematic) | reshapes which template family dominates a region |
| City `crimeIndex` | §3.2 `crimeMod`; §3.3 encounter CS | high → combat-encounter weight ×1.4–1.8, −3CS legal forks |
| City type(s) | §3.2 `cityTypeMatch ×1.5`; §3.5 collateral CS | military city → weapon-theft/coup events; temple → artifact events |
| `cultureCode` | §3.1 region triggers (POL_004 Europe); culture ±CS | gates region-specific political events |
| `factionTerritory` | §3.3 overlay | home territory softens consequences (legal immunity); hostile amplifies them |
| `daysToInvasion` | §3.1 COSMIC_GATE; §3.6 drama budget | as clock runs down, alien/cosmic templates unlock & drama budget rises |
| World-state `tension`/`publicOpinion` | §3.2 `tensionMod`; §3.4 deltas | a region you've destabilized fires more crises; opinion gates recruitment |

The engine calls **existing** `calculateAllCombinedEffects(country)` and `calculateCountryEffects(country)` to populate `EventSpineContext.combos`/`stats` — it does not re-derive the spine. **This is the wiring that closes Bible ruling #9** (combinedEffects.ts is computed today but unconsumed; this engine consumes it).

---

## 5. Edge cases & failure modes

1. **No eligible template** (remote village, low everything): fall back to the **mission** pipeline (`missionGeneration.ts` always returns at least `patrol_city`). Never return empty; a silent world is the worst failure (FIST GDD: the world must feel alive).
2. **Template field missing / unparseable trigger:** **fail loud** (Bible §13 ethos). Log `templateError(id, field)`, skip the template for this tick, surface in dev console (F2 panel). Do not crash the tick.
3. **Firehose / event spam:** the §3.6 drama budget + §4 pacing cap throttle to ≤1 Very-High + 2 High dramatic events per game-week. Per-sector cooldown: a fired `templateId` cannot re-fire in the same sector for **7 game-days** (matches `Email_Investigation_Templates` `Urgency_Hours` ceilings; data-driven).
4. **Cloning=0 + Team_Member_Death:** the death fork must **not** offer a clone branch; offer funeral (`deathConsequences.processFuneralChoice`) only. Cross-check `s.stats.cloning > 0` before emitting a resurrection option.
5. **Player ignores a `critical` fork** (Time_Management: 2h real-time window): resolve via the `default` branch (doc 110), then **escalate** `activeCrisis.severity += 20` and possibly fire the `Crisis_Escalation_Major` follow-up. "The world lives without you" (Bible pillar 4) — inaction has teeth.
6. **Time-travel rewind (Bible §11):** events carry `firedAtGameMinute` + frozen `spine`; on rewind, all events after the destination tick are set `status:'rewound'` and their `WorldState` deltas are reverse-applied from the append-only `worldStateLedger`. Re-rolling is **deterministic** off the frozen spine + a seeded RNG (`seed = hash(templateId + firedAtGameMinute)`) so a rewind doesn't silently reshuffle the world (avoids save-scum exploit; the *only* cost is Time-Walker sanity).
7. **Faction overlay missing** (country not in any faction's territory map): default `neutral` (no overlay). Never throw.
8. **Multiplayer stub:** `WorldState` must remain JSON-serializable and mutate only through `applyWorldDelta(delta)` (no direct field writes) so an MP shard can replay the delta log. No MP logic is built — only this discipline is enforced.
9. **Encounter unwinnable guard:** clamp `enemyThreatCap` to `playerTier + 1` (§3.7); if `Player_Scaling` tier is 1 (Street Operative, ≤L1), never spawn L3+.
10. **Conflicting simultaneous world events** on the same relation pair: deltas are additive into `relationDeltas[isoA|isoB]` and clamped so `baseCode + delta` stays in the legal 1..6 band (doc 03 `CountryRelationCode`).

---

## 6. UI/UX hooks (phone / world-map / laptop / combat overlay)

The engine produces payloads; these are the surfaces (consumers) that show them — wiring points only:

- **Phone (interrupt):** `critical`/`high` forks set `pausesClock:true` and surface as a phone buzz → modal (doc 110 `interrupt` context). Bible §7: laptop/phone pauses time.
- **Laptop → Email app:** `medium`/`low` forks and all `mission`/investigation events land in the inbox using the `EmailEventTemplate` envelope (`emailSystem.ts`). `Priority_Level` color-codes; `Auto_Expire` + `Urgency_Hours` drive the countdown badge. Email reply = choice (Bible §7.1).
- **Laptop → News app (BNN/ANN + Point of Interest):** every `worldEvent` and every resolved event renders a story via its `newsTemplateId` (`Result_Templates.csv` TEMP_0xx) through `newsGenerator.ts`. "Point of Interest" (international) telegraphs AI faction moves before they hit (Bible §7.2) — i.e. a `WorldEvent` with `scale:'major'` posts a POI 1–2 game-days before it can escalate into a fork.
- **World map:** `WorldEvent`s drop a marker on `affectedSector` (severity-colored); `activeCrises` pulse. Clicking shows the crisis card + "deploy" if it's spawnable into an encounter/mission.
- **Combat overlay:** `combat`-context forks (doc 110) — e.g. "execute the surrendering villain?" — appear as a battlefield prompt; resolved on the spot, write straight to `ConsequenceBundle`.
- **Dev panel (F2):** a template-debug view: which templates are eligible here, their weights, the frozen spine — so designers can see why an event fired (supports the `Narrative_Quality_Assessment` loop).

---

## 7. Integration points (systems it reads / writes)

**Reads:**
- `combinedEffects.ts` (`calculateAllCombinedEffects`), `locationEffects.ts` (`calculateCountryEffects`/`calculateCityEffects`) — the spine.
- `allCountries`/`allCities` (Bible ruling #10 canonical sets), `countryrelationships.csv`, `TerrainCodes.csv`.
- `PersonalityType` (doc 03), roster, `Player_Scaling` tier, `factionSystem.factionStanding`.
- The 6 CSV template families (§1) at boot.

**Writes / emits:**
- **Hands `ForkEvent` to FITR** (doc 110) — fills the exact input contract: `templateId`, `context`, `priority`, parameterized `title`/`body`, frozen `ForkSpineContext`, 2–4 fully-resolved `ForkOption`s. If any field is missing, FITR rejects (fail-loud).
- **`missionSystem`/`missionGeneration`** — extends existing `GeneratedMission` output (reuses its per-city-type weight tables).
- **`WorldState`** — via `applyWorldDelta` only; appends to `worldStateLedger` for rewind/MP.
- **`eventBus.emit`** — new types (below) so news/economy/reputation/investigation subscribers stay decoupled (existing pub/sub pattern).
- **`newsGenerator.ts`** — passes `newsTemplateId` + variables for the story.
- **`reputationSystem.adjustMultipleReputation`** and **`factionSystem`** — only indirectly, via the `ConsequenceBundle` FITR/handlers apply (the engine *sets up* consequences; it does not apply reputation itself — that stays in the resolver, matching doc 110's split).

**New `GameEventType` values to add to `eventBus.ts`** (new category `'decision'`):
```
'event:fired' | 'event:expired'
'worldEvent:fired' | 'worldEvent:escalated'
'encounter:spawned'
// (fork:fired/resolved/expired/rewound are already specified by doc 110 §9)
```

---

## 8. Narrative rendering & quality gate

When an event resolves or a `worldEvent` fires, it renders to news through `Result_Templates.csv` (TEMP_001 Local Hero … TEMP_020 Victory Celebration) chosen by `combatScale`/event scale. The variables (`Variable_Winner`, `Variable_Location`, `Variable_Property_Damage`, …) are filled from the frozen spine + outcome.

**Quality gate (`Narrative_Quality_Assessment.csv`)** — a generated story must hit the weighted target before it ships to the news feed (dev-build assertion; production logs only):
Country integration **25%** (≥80% country elements) · City **20%** (≥75%) · Faction **20%** (≥70%) · Cultural authenticity **15%** (≥65%) · Media-style **10%** (≥85%) · Consequence realism **10%** (≥80%). This is why the spine is woven into every template's variable list — a story that doesn't mention the country's wealth/politics/media-freedom **fails its own QA**.

---

## 9. RULING: notes (where the data was silent)

- **RULING-A** — Threshold defaults (`globalIncidents=10`, `COSMIC_GATE=494d`, `$1M` collateral) derived from `Public_Perception.csv` deltas + the 2,472-day clock; **all live in `event_thresholds.csv`** (re-balanceable, Bible pillar 1). (§3.1)
- **RULING-B** — `Dramatic_Potential`/`Realism_Level` strings (Medium/High/Very High; Low..Very High) mapped to integers 0–3; pacing budget = 1×drama-3 + 2×drama-2 per game-week. Source rates the strings but assigns no budget; this is the consumption of that column. (§3.6)
- **RULING-C** — `personalityMod` caps at ±25% so personality colors but never dominates spine selection (spine is the primary pillar; personality is secondary, per doc 03 scope). (§3.5)
- **RULING-D** — Per-sector template cooldown = 7 game-days (anchored to `Email_Investigation_Templates` `Urgency_Hours` ceiling of 120h ≈ 5 days, rounded up to a game-week). Prevents event spam. (§5.3)
- **RULING-E** — Rewind determinism uses `seed = hash(templateId + firedAtGameMinute)`; the source has no RNG-seed policy, but Bible §11 demands rewind be a *mechanic with consequences*, not a reshuffle exploit. (§5.6)
- **RULING-F** — Reputation Δ (a single scalar in `Public_Perception.csv`) is split across the 4 `ReputationAxis` by the resolving fork's `tone` (doc 110 §5.2 owns the mapping); this engine only carries the scalar + scale. (§3.4)
- **RULING-G** — `enemyThreatCap ≤ playerTier + 1` to satisfy the `AI_Testing_Framework` 70%/65% winnability targets; source gives the win-rate targets but not the spawn cap. (§3.7)

## 10. OWNER-FORK: notes (product choices only the owner can make)

- **OWNER-FORK-A — Runtime LLM vs pure templates.** The `AI_Prompt_Template`/`AI_Generation_Template` columns and the `AI_Event_Generation_*` rows imply an online generative model. The shipping recommendation is **template-table string substitution** (deterministic, offline, free, MP-safe). Wiring a runtime LLM (e.g. the Mac-mini Ollama box) for novel event/news prose is a real product choice with cost, latency, determinism-on-rewind, and content-safety implications. Default OFF; expose as a toggle.
- **OWNER-FORK-B — World-event aggression (the "lives without you" dial).** How often `WorldEvent`s fire when the player is *absent* from a region (the §4 pacing budget's floor). A high floor = a turbulent, JA2/CK-style world that moves fast; a low floor = a calmer sandbox. This is a core feel decision, not a balance number.
- **OWNER-FORK-C — Doomsday-clock event ramp.** Whether (and how steeply) the §3.6 drama budget scales up as `daysToInvasion` shrinks (slow-boil dread vs late-game crisis storm). Affects the whole campaign's pacing arc.
- **OWNER-FORK-D — Which of the 20 political/scenario templates are in the v1 content cut.** All 15 POL_ + 20 scenario archetypes are authored, but some (POL_010 Time-Travel-Paradox, POL_005 cosmic treaty) presuppose late-game systems (time travel, alien contact). Owner picks the v1 subset and gating order.

## 11. Open questions

1. **Research/career trigger plumbing.** Several POL_ triggers fire on "player completes advanced AI research" / "Business career reaches CEO." Are `Research_Projects.csv` / `Education_Career_Complete.csv` completion events already on `eventBus`? If not, those triggers are inert until the research/career systems emit completion events — confirm the emit points.
2. **`countryrelationships.csv` code legend.** Doc 03 rules codes 1..6 as WAR..SPECIAL (RULING, "confirm with owner"). This engine's `relationChanges` clamp depends on that legend being correct — needs owner confirmation (single source of truth shared with doc 03).
3. **Global-incident counter ownership.** `globalIncidents` (RULING-A) needs a home — is it a `WorldState` field the combat-results handler increments on every `Civilian_Casualties_Major`, or derived from the reputation ledger? Recommend a `WorldState.globalIncidents` counter written by `combatResultsHandler.ts`.
4. **Encounter→map-template binding.** `EnvironmentType.terrainCodeHints` → `TerrainCodes.csv` → combat map: is the existing "map templates by city type" wiring (CLAUDE.md) keyed on city type or terrain code? They must agree so `Scenario_Templates` environments resolve to real maps.
5. **POI lead-time tuning.** §6 posts a "Point of Interest" 1–2 game-days before a major world event can escalate. Is that lead-time a fixed constant or itself spine-driven (e.g. high-Intel countries get *longer* warning because your networks see it coming)? The latter is more on-theme — flag for owner.
