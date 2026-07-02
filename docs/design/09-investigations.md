# 09 — Investigations (templates / methods / skills / consequences → tech-suits / research)

> **System:** The Investigation loop — the laptop app that turns an **email alert** into a **method choice**, resolves it on the **Universal Table** using **investigator skills + the country/city/culture/faction spine**, and emits **consequences** (intel, relationship deltas, follow-ups, legal/political fallout, combat triggers) whose richest payoff is **tech-suits, reverse-engineered enemy tech, robot repair, and recruits** via the research pipeline. This is system **#9** on the build checklist.
> **Status:** BUILD-READY SPEC
> **Spine consumed:** all ~35 country stats (`Country.csv` via `Country_Attribute_Effects.csv`), city type/crime/population (`Cities.csv` via `City_Type_Effects.csv`), culture region (`Culture_Region_Effects.csv`), faction standing (faction-territory bonus rows), the 20 personality types (assigned investigator's idle/risk bias), and the 12 combined-effects systems (`combinedEffects.ts`). Bible ruling #9 (combined-effects must be *consumed*) is honored here for difficulty, cooperation, detection, and reward gating.
> **Bible anchors:** §3 (the 4CS Universal Table — investigations resolve on it, §3.3), §3.2 (rank/Column-Shift currency), §7.4 (INVESTIGATIONS → "the engine that builds tech & missions"), §7.6 (DAILY ACTIVITIES → Research/Engineering activities are the output sink), §6.1/§6.2 (country/city → ±CS spine), §6.3 (culture ±CS), §8 (combined-effects, esp. Surveillance/Research/Media), §9 (consequence/reputation scale), §11 (time-travel save touches Time-Anomaly investigations), §13 ruling #1 (ship `Universal_Table_FIXED`), ruling #9 (combined-effects consumed), ruling #10 (unify on `allCountries`+`allCities`).
>
> **Primary source tables (read these to re-balance — never hardcode numbers; load from CSV at boot):**
> - `docs/csv-source-data/Investigation_Templates.csv` — **25 authored investigation templates** (`INV_001..INV_025`): City_Type, Crime_Index_Range, Base_Difficulty (1–10), Duration_Days, Threat_Level, Potential_Rewards. **THE investigation catalog.**
> - `docs/csv-source-data/Investigation_Methods.csv` — **25 methods** (`METH_001..METH_025`): Success_Modifier (±CS), Risk_Level, Political_Impact, Resource_Cost, Duration_Modifier (×), Detection_Chance (%), Faction_Bonus, Requirements. **THE approach grammar.**
> - `docs/csv-source-data/Investigator_Skills.csv` — **58 power/skill → investigation-type bonuses** (Power_Name, Investigation_Type, Bonus_Modifier ±CS, Special_Ability, Limitations). **THE investigator-talent map.**
> - `docs/csv-source-data/Investigation_Consequences.csv` — **36 result rows**: 6 generic success-band rows (Critical Success→Critical Failure with %-band, intel, relation delta, reward tier, follow-ups, world event, detection, timeline) + 30 specialized outcome types (Tech Discovery, Alien Technology, Cover Blown…). **THE outcome resolver.**
> - `docs/csv-source-data/Email_Investigation_Templates.csv` — **25 email envelopes** (`EMAIL_001..EMAIL_025`): Priority_Level, Sender_Type, Investigation_Type, Urgency_Hours, Body_Template (with `{vars}`), Response_Options, Auto_Expire. **THE inbox delivery shell.**
> - `docs/csv-source-data/Game_Mechanics_Spec/Research_Projects.csv` — research tiers/trees/nodes/projects/facilities/resources/team/speed/complications. **THE tech-suit / reverse-engineering OUTPUT sink** (esp. `SKILL_ALIEN`, `NODE_150/151`, `PRJ_100/101/102` alien analysis; `PRJ_040/044/045` power armor; `COMP_FLIGHT/PRJ_041` flight pack; `ARM_STEALTH/PRJ_042` stealth suit).
> - `docs/csv-source-data/Game_Mechanics_Spec/Country_Attribute_Effects.csv` — every country stat → ±CS + 6 combination effects + 4 faction-territory bonuses. **THE spine→CS map.**
> - `docs/csv-source-data/Game_Mechanics_Spec/City_Type_Effects.csv` — 10 city types → Investigation_Bonus + crime & population interaction tables. **THE city ±CS map.**
> - `docs/csv-source-data/Game_Mechanics_Spec/Culture_Region_Effects.csv` — 14 culture regions → Investigation_Modifier (±CS). **THE culture ±CS map.**
> - `docs/csv-source-data/Game_Mechanics_Spec/Stat_Rank_Mapping.csv` — INT value → rank → Universal_Table column; the ±CS reference; the Result→multiplier rows. **THE resolution lookup.**
> - `docs/csv-source-data/Game_Mechanics_Spec/Universal_Table_FIXED.csv` — d100 × column → Failed/Minor/Success/Major. **THE roll table (Bible ruling #1).**
> - World Bible `SuperHero Tactics World Bible - Country.csv` / `- Cities.csv` headers — canonical spine columns.
>
> **Existing code this must slot into (do not duplicate — extend):**
> - `MVP/src/stores/gameStore.ts` / `enhancedGameStore.ts` — the `Investigation` interface (see §2; the legacy interface in the `sht-investigation` skill is the seed — superseded by §2 here).
> - `MVP/src/components/InvestigationCenter.tsx` / `WorkingInvestigationCenter.tsx` — the existing Investigations UI (CLAUDE.md marks `InvestigationCenter.tsx` **WORKING** with education bonuses wired). Extend, don't rebuild.
> - `MVP/src/data/emailSystem.ts` — `Email`, `EmailReplyOption`, `EmailPriority` (the alert delivery shell; doc 01/02 own it).
> - `MVP/src/data/missionGeneration.ts` / `missionSystem.ts` — investigations that escalate to combat emit a `GeneratedMission` (doc 02 owns the producer).
> - `MVP/src/data/combinedEffects.ts` — `calculateSurveillanceSystem`, `calculateResearchSystem`, `calculateMediaSystem`, etc. (consumed for detection/research/media ±CS).
> - `MVP/src/data/locationEffects.ts` — `calculateCountryEffects`, `calculateCityEffects`, `getLocationContext`.
> - `MVP/src/data/reputationSystem.ts` — `ReputationAxis` (`public|government|criminal|heroic`, −100..+100), `adjustMultipleReputation`.
> - `MVP/src/data/factionSystem.ts` — per-country faction standings (`factionSystem.ts`, `ReputationDisplay.tsx`).
> - **Research/Engineering** activity store (doc on Daily Activities; §7.6 Bible) — the sink that consumes `Tech_Lead` / `Sample` / `Schematic` rewards.

---

## 1. Overview & player fantasy

Investigations are **the laptop's detective loop and the spine's clearest voice.** An email arrives because of *where you are, who you've angered, and what the world is doing* (the city's type, the country's stats, the active crisis pipeline). You read the brief, pick **how** to approach it — quiet covert work, official channels, raw force, a diplomatic back-channel, your faction's signature trick — and **assign investigators** whose **powers and skills** are good (or terrible) at that kind of work. The world then resolves the attempt **on the same Universal Table that resolves a punch** (Bible §3), reading every relevant country/city/culture/faction stat as a Column Shift. What comes back is **intel, relationship swings, follow-up leads, legal/political fallout, an optional jump into tactical combat** — and, the prize, **schematics and samples** that feed the **research pipeline** to build **flight suits, fighting suits, stealth suits, reverse-engineered alien tech, robot repairs, and new recruits.**

The fantasy: *"I'm running an intelligence shop, not just a strike team. The same 'missing officials' case is a clean Official Investigation in a free-media democracy and a knife-in-the-dark Black-Market Contact job in a corrupt failed state. My psychic gets confessions; my technopath cracks the servers; my time-traveler is the only one who can touch the temporal anomaly. Win well and I walk away with the schematic that becomes my first flight suit."*

**This is the engine the Bible names twice** — §7.4 ("INVESTIGATIONS → the engine that builds tech & missions") and §0 (laptop = "email-as-dialogue, news, investigations"). It is the connective tissue between the **phone/laptop meta-game** and the **research/equipment economy**.

**Non-goals (scope guards):**
- Investigations do **not author the email envelope or the news** — they consume `Email_Investigation_Templates` rows delivered by the Event Engine (doc 02) and emit outcome facts the news generator renders.
- They do **not resolve combat** — when a method/outcome triggers a fight, they emit a `GeneratedMission` (doc 02 / `missionSystem.ts`) and hand off to `CombatScene.ts`.
- They do **not own the research tree** — they produce `ResearchUnlock` / `Sample` / `Schematic` reward objects that the Research/Engineering activity (Bible §7.6, `Research_Projects.csv`) consumes. §8 specifies the exact handoff contract.
- They do **not own personality** — they *read* the assigned investigator's `PersonalityType` (doc 03) only for the optional auto-method suggestion and detection-risk bias.
- Multiplayer: an investigation is a per-faction record; the store must be serializable/diffable so an MP shard can replicate it later (Bible MP stub). Do not build MP.

---

## 2. Data schema (fields / types)

All numeric/string constants below are **loaded from the source CSVs at boot**, never inlined. TypeScript interfaces (the runtime shape):

```ts
// ── Loaded from Investigation_Templates.csv ──────────────────────────────
interface InvestigationTemplate {
  id: string;                 // "INV_001"
  name: string;               // "Gang War Escalation"
  cityType: CityType | 'Any'; // Industrial | Political | Military | Temple | Company |
                              //   Seaport | Mining | Educational | Resort | Village | Any
  crimeIndexRange: [number, number] | 'Variable'; // [80,100]; 'Variable' for INV_023
  baseDifficulty: number;     // 1–10 (INV_022 = 10, the cap)
  durationDays: number | 'Variable';   // 5 .. 20 ; 'Variable' only INV_022
  threatLevelRange: [number, number];  // [2,3] .. [5,5]  (LeFevre Alpha→L5 band)
  description: string;
  potentialRewards: RewardTag[];       // parsed from "; "-split reward strings
}

// ── Loaded from Investigation_Methods.csv ────────────────────────────────
interface InvestigationMethod {
  id: string;                 // "METH_001"
  name: string;               // "Covert Operation"
  successModifier: number;    // ±CS, −1 .. +3   (THE method ±CS)
  riskLevel: RiskTier;        // VeryLow|Low|Medium|High|VeryHigh
  politicalImpact: ImpactTier;// None|VeryLow|Low|Medium|High|VeryHigh
  resourceCost: CostTier;     // Low|Medium|High|VeryHigh  (→ $ via §3.6)
  durationModifier: number;   // ×, 0.3 .. 2.5  (multiplies template durationDays)
  detectionChancePct: number; // 5 .. 95  (base detection; spine-modified §3.5)
  factionBonus: FactionBonusMap; // { US:+2, China:+1, India:0, Nigeria:0 } per row
  requirements: string[];     // "Stealth-capable LSW"; "Government authorization"…
}

// ── Loaded from Investigator_Skills.csv ──────────────────────────────────
interface InvestigatorTalent {
  powerName: string;            // "Technopathy"
  investigationType: string;    // "Digital Investigation"  (matches §3.4 tag set)
  bonusModifier: number;        // ±CS, +1 .. +5  (Time Travel = +5)
  specialAbility: string;       // free-text UI flavor
  limitations: string;          // free-text UI flavor (also gates, see §5)
}

// ── Loaded from Investigation_Consequences.csv ───────────────────────────
interface OutcomeBand {            // the 6 generic success-band rows
  resultType: SuccessBand;         // CriticalSuccess..CriticalFailure
  rollBand: [number, number];      // % band on the success scale, e.g. [95,100]
  relationDelta: number;           // −2 .. +3 (country relations, §6)
  rewardTier: RewardTier;          // HighValue..ResourceLossPenalty
  followUps: FollowUpRule;         // unlock count / chance / lockout
  worldEvent: WorldEventTag;       // MajorPositive..MajorNegative
  detection: DetectionTag;         // NoDetection..CompleteExposure
  timelineImpact: TimelineTag;     // Stabilization..MajorDisruption
}
interface SpecializedOutcome {     // the 30 themed rows (Tech/Alien/Cover-Blown…)
  resultType: string;              // "Technology Discovery"
  successLevel: string;            // "Tech Success"
  intelligenceGained: string;
  relationshipChange: string;      // parsed to per-axis deltas where signed
  resourceReward: string;          // → RewardTag(s) (§8 maps these to research)
  followUpInvestigations: string;
  worldEventTrigger: string;
  detectionConsequences: string;
  timelineImpact: string;
}

// ── Loaded from Email_Investigation_Templates.csv ────────────────────────
interface InvestigationEmail {
  id: string;                 // "EMAIL_001"
  priority: EmailPriority;    // Low|Medium|High|Critical
  subjectTemplate: string;    // "URGENT: Gang Violence Escalating - {City_Name}"
  senderType: string;         // "Local Government"
  investigationType: string;  // links to InvestigationTemplate.name
  urgencyHours: number;       // 4 .. 168   (response window; auto-expire timer)
  bodyTemplate: string;
  responseOptions: string[];  // "Deploy Team Immediately"; "Send Investigators"…
  autoExpire: boolean;        // Yes/No
}

// ── Runtime instance (the live case in the store) ────────────────────────
interface ActiveInvestigation {
  instanceId: string;             // uuid
  templateId: string;             // → InvestigationTemplate
  emailId: string | null;         // origin envelope (null = self-initiated/Patrol lead)
  locationISO: string;            // country ISO (Bible ruling #10: allCountries key)
  cityId: string;                 // allCities key
  methodId: string | null;        // chosen InvestigationMethod (null until committed)
  assignedInvestigators: string[];// character ids (1..N, §3.3 caps at 3 effective)
  startDay: number;               // game-day committed
  endDay: number;                 // startDay + effectiveDurationDays (§3.6)
  progressPct: number;            // 0..100, ticks per game-day (§4)
  finalColumn: number;            // cached resolved column (§3.2) for the progress UI
  state: 'lead' | 'awaiting_method' | 'in_progress'
       | 'resolved' | 'expired' | 'locked';
  rollResult: ResolutionResult | null; // populated at endDay (§3.7)
  detectionRollPct: number | null;     // populated at endDay (§3.5)
  lockUntilDay: number | null;         // Critical-Failure lockout (§6)
}
```

**Enum/constant tables (decoded from source, not invented):**
- `RiskTier`, `ImpactTier`, `CostTier` decode from the Methods CSV's verbal ladder. **RULING (§ below) fixes the numeric mapping.**
- `RewardTag` is the parsed `Potential_Rewards` / `Resource_Reward` token (e.g. `Tech Research Data`, `Military Equipment`, `Alien Technology`). §8 maps each tag to a research/recruit/intel effect.

---

## 3. Exact numbers / tables / formulas (each cited)

### 3.1 The resolution model (one chart, the Bible's §3)

An investigation resolves **exactly like any 4CS action** (Bible §3.3): pick the governing stat (here **INT** — Bible §3.1 "INT … investigation"), compute the **final column** = INT-rank ± all Column Shifts, roll **d100**, read the band on `Universal_Table_FIXED.csv`.
*Source: `SHT_MECHANICS_BIBLE.md` §3.1 (INT governs investigation), §3.3 (procedure), `Stat_Rank_Mapping.csv` (`Universal_Table_Column` per INT value), `Universal_Table_FIXED.csv` (the d100 grid).*

### 3.2 The Column-Shift stack (the whole formula)

```
finalColumn(investigation) = rankColumn(leadINT)
  + methodCS              // InvestigationMethod.successModifier   (−1 .. +3)
  + talentCS             // best-matching InvestigatorTalent.bonusModifier (+1 .. +5; team rule §3.3)
  + cityCS               // City_Type_Effects Investigation_Bonus if type matches (§3.4)
  + crimeCS              // City_Type + Crime_Index interaction (§3.4)
  + populationCS         // City_Type + Population interaction, resource/stealth axis (§3.4)
  + countryCS            // Country_Attribute_Effects per-method axis (§3.5)
  + cultureCS            // Culture_Region_Effects Investigation_Modifier if type matches (§3.4)
  + factionCS            // Faction_Bonus (method row) + faction-territory bonus (§3.5)
  − difficultyCS         // = baseDifficulty − 5  (template 1–10 normalized; §3.7)
```

- `rankColumn(leadINT)`: read the lead investigator's **INT** through `Stat_Rank_Mapping.csv` (e.g. INT 6–10 = Typical column, 11–20 = Good, 21–30 = Excellent…). *Source: `Stat_Rank_Mapping.csv` (`Stat_Value_Min/Max → Universal_Table_Column`).*
- Each `+xCS` is one column right, each `−xCS` one column left, on the `Universal_Table_FIXED` grid. *Source: `Stat_Rank_Mapping.csv` "COLUMN SHIFT REFERENCE" (+4CS … −6CS).*

> **RULING — difficulty → CS normalization:** the templates give `Base_Difficulty` 1–10 but the Universal Table speaks only in Column Shifts. Map `difficultyCS = baseDifficulty − 5` (so a difficulty-5 case is 0CS, difficulty-10 = −5CS, difficulty-1 = +4CS). This anchors the median template (difficulty 5–6 is the modal value across `Investigation_Templates.csv`) at roughly neutral and makes the 1–10 column meaningful without inventing a new scale. Consistent with Bible §3 "Column Shift is the universal currency."

### 3.3 Method ±CS, team & talent rule (cited numbers)

**Method Success_Modifier** is read verbatim from `Investigation_Methods.csv`. Examples (the real values):

| Method | Success_Modifier | Detection_Chance | Duration_Modifier | Risk | Political_Impact |
|---|---|---|---|---|---|
| METH_001 Covert Operation | **0** | 15% | 1.0 | Medium | None |
| METH_002 Deep Cover | **+2** | 5% | 1.5 | High | Low |
| METH_003 Official Investigation | **+1** | 40% | 0.8 | Low | Medium |
| METH_005 Force Deployment | **+3** | 95% | 0.3 | Very High | Very High |
| METH_007 Diplomatic Inquiry | **+0** | 25% | 1.2 | Very Low | Low |
| METH_010 Economic Pressure | **+2** | 70% | 2.0 | Low | Medium |
| METH_013 Technology Surveillance | **+2** | 35% | 0.9 | Medium | Medium |
| METH_014 Social Network Analysis | **+1** | 25% | 1.0 | Low | Low |
| METH_025 Vigilante Action | **+2** | 90% | 0.4 | Very High | Very High |

*Source: `Investigation_Methods.csv` rows 1–25, columns Success_Modifier / Detection_Chance / Duration_Modifier / Risk_Level / Political_Impact.* (Full 25-row table loads from CSV.)

**Talent CS — team rule:**
```
talentCS = bestMatchTalentCS(assignedInvestigators, investigationType)
         + 1 per ADDITIONAL investigator whose best matching talent ≥ +2CS  (cap +2 from assists)
```
- `bestMatchTalentCS`: across all assigned investigators, take the **single highest** `Investigator_Skills.csv` `Bonus_Modifier` whose `Investigation_Type` matches the case's tag set (§3.4). E.g. Technopathy = **+4CS** on a Digital Investigation; Time Travel = **+5CS** on Historical Investigation. *Source: `Investigator_Skills.csv` Bonus_Modifier column.*
- The assist clause models a 3-person team without letting +CS stack unboundedly.

> **RULING — assigned-team cap = 3 effective.** Source data gives no investigator team cap; `Research_Projects.csv` "TEAM COMPOSITION" caps research teams (1 lead + assists). Mirror it: **1 lead + up to 2 assists** count for `talentCS`; extra assignees only reduce `effectiveDurationDays` (§3.6). Keeps the math bounded and reuses the established research-team idiom.

### 3.4 City / crime / population / culture CS (cited)

**City type match → Investigation_Bonus** (`City_Type_Effects.csv`): if the case's `investigationType` matches the city's type bonus, apply it.

| City Type | Investigation_Bonus | Special_Ability (investigation-relevant) |
|---|---|---|
| Military | **+2CS** Military/Security | Arsenal Access −20% gear |
| Educational | **+2CS** Academic/Research **+1CS** ALL tech investigations | Research bonus |
| Company | **+2CS** Corporate/Financial | business-intel networks |
| Seaport | **+2CS** Smuggling/Maritime | water ops |
| Temple | **+2CS** Religious/Mystical | 24h sanctuary |
| Political | **+2CS** Political/Diplomatic | Political Cover (official status) |
| Industrial | **+2CS** Corporate/Sabotage | Workshop |
| Mining | **+2CS** Environmental/Industrial | tunnel network |
| Resort | **+1CS** Social/Surveillance | High-Society access |
| Village | **+1CS** Rural/Traditional | Local Trust |

Multi-type cities: **primary = full, each matching secondary = half (round down)**; bonuses **stack** for matching types (Educational's +1CS-all-tech stacks on top). *Source: `City_Type_Effects.csv` rows + "MULTI-TYPE COMBINATION RULES" (Stacking / Secondary_Caps).*

**Crime index interaction** (`City_Type_Effects.csv` "CITY TYPE + CRIME INDEX"):
| Crime | Effect on method class |
|---|---|
| Very Low (0–20) | **+1CS** all investigations; −1CS criminal recruitment |
| Low (20–40) | 0 |
| Moderate (40–60) | **−1CS** political investigations; +1CS criminal contacts |
| High (60–80) | **−2CS** official methods; **+2CS** underground methods; combat more likely |
| Very High (80–100) | **−3CS** all *legal* methods; **+3CS** criminal methods; constant combat risk |

→ `crimeCS` is applied **conditional on method class** (official/legal vs underground/criminal — classify each method by its `Risk_Level`/`Political_Impact`: VeryHigh-risk & low-political methods like METH_016 Black Market, METH_025 Vigilante = "criminal"; Low-risk + Medium/High-political like METH_003/004 = "official"). *Source: same CSV section.*

**Population interaction** (`City_Type_Effects.csv` "CITY TYPE + POPULATION"): affects the **resource vs stealth axis**, so it modifies covert methods' detection and resource-cost-tier, not raw success — e.g. Mega City (Pop 7) = +3CS resources / **−3CS stealth**; Village (Pop 2) = +2CS stealth / −2CS resources. Applied to detection (§3.5) and to covert-method `successCS` only when the method is stealth-class. *Source: same CSV section.*

**Culture match → Investigation_Modifier** (`Culture_Region_Effects.csv`): +2CS South Asia spiritual/mystical; +1CS East/SE Asia corporate/tech; +1CS Western Europe corporate/political; +1CS North Africa historical; +1CS Central Africa tribal; +1CS Southern Africa mining/resource; +1CS Caribbean smuggling; +1CS Central America cartel/trafficking; etc. Applied **only when the culture modifier's type matches the case type.** *Source: `Culture_Region_Effects.csv` Investigation_Modifier column (14 regions).*

**Investigation-type tag set** (the join key between template, talent, city, culture): normalize all to a controlled vocabulary derived from the union of the CSVs' type strings — `Military/Security`, `Political/Diplomatic`, `Corporate/Sabotage`, `Corporate/Financial`, `Academic/Research`, `Digital`, `Smuggling/Maritime`, `Religious/Mystical`, `Environmental/Industrial`, `Social/Surveillance`, `Rural/Traditional`, `Historical`, `Alien/Tech`, `Temporal`, `Information Gathering`, `Interrogation`. Each `InvestigationTemplate` carries one primary + optional secondary tag derived from its `City_Type` + name. *Source: union of type strings in `Investigation_Templates.csv`, `Investigator_Skills.csv` (`Investigation_Type`), `City_Type_Effects.csv`, `Culture_Region_Effects.csv`.*

### 3.5 Country spine CS + detection (cited — Bible ruling #9 consumption)

`countryCS` reads `Country_Attribute_Effects.csv` **per method axis** (the table's whole job is stat → ±CS per method). The wiring (real numbers from the CSV):

| Country stat (band) | Applies to | CS |
|---|---|---|
| GovernmentPerception High (Democracy 66–100) | legal/official methods | **+2CS**; covert −1CS |
| GovernmentPerception Low (Authoritarian 0–35) | legal | **−2CS**; covert +2CS |
| GovernmentCorruption High (66–100) | official | **−2CS**; bribes/blackmail **+3CS** |
| IntelligenceBudget High (66–100) | covert | **−2CS**; **+3CS detection risk** |
| MilitaryBudget High (66–100) | infiltration | **−2CS**; +2CS military-equipment access |
| MediaFreedom High (66–100) | media investigation | **+2CS**; cover-ups −2CS |
| Science High (66–100) | tech investigations | **+2CS**; +2CS reverse-engineering |
| HigherEducation High (66–100) | academic | **+2CS**; +2CS tech-research speed |
| CyberCapabilities High (66–100) | hacking/digital | **−2CS** to defender (i.e. harder); +2CS cyber-surveillance |
| Healthcare High (66–100) | medical-cover methods | **+2CS** |

**Combination effects** (`Country_Attribute_Effects.csv` "ATTRIBUTE COMBINATION EFFECTS") — applied as overrides:
- **Security State** (High Military + High Intel): **all covert −2CS, all official +2CS.**
- **Failed State** (Low Gov + High Corruption): **no legal methods work** (legal methods auto-fail eligibility — see §5); only force/bribery effective.
- **Innovation Hub** (High Science + High Education): **+3CS all tech research** (boosts Tech/Alien-tech investigation reward quality, §8).
- **Lawless** (High Corruption + High Crime): **all criminal methods +3CS; no legal consequences** (zeroes `politicalImpact` fallout).

These overrides are **the literal consumption** Bible ruling #9 demands — investigation difficulty/eligibility is computed *from* the spine, not flavor. *Source: `Country_Attribute_Effects.csv` rows + combination section; `SHT_MECHANICS_BIBLE.md` §6.1, §8, ruling #9.*

**Detection roll:**
```
effectiveDetectionPct = method.detectionChancePct
  + intelBudgetBand(country)        // +30 if Intel High (the "+3CS detection risk" → +30%)
  + surveillanceSystemBonus(country)// from combinedEffects.calculateSurveillanceSystem (Intel+Cyber+(100−MediaFreedom))
  + populationStealthPenalty(city)  // Mega City +30 ; Village −20 (the ±CS×10 stealth axis)
  − talentStealthBonus(team)        // Invisibility +3CS, Adaptive Camouflage +3CS, Sound Absorption +2CS → ×10 %
clamp 1..99
detected = roll(d100) ≤ effectiveDetectionPct
```
*Source: `Investigation_Methods.csv` Detection_Chance; `Country_Attribute_Effects.csv` IntelligenceBudget row ("+3CS detection risk"); `combinedEffects.ts` `calculateSurveillanceSystem` (Bible §8 Surveillance = Intel + Cyber + (100−MediaFreedom)); `Investigator_Skills.csv` stealth powers; `City_Type_Effects.csv` population stealth axis.*

> **RULING — ±CS↔% conversion for detection only.** Detection is the one place the data mixes a literal % (method) with ±CS spine modifiers. Convert **1CS = 10 percentage points** of detection for the spine/talent terms (so Intel-High's "+3CS detection risk" = +30%, Invisibility's +3CS = −30%). This is local to the detection clamp and does **not** alter the success column (success stays pure ±CS). Rationale: keeps the success math clean while honoring both source formats.

### 3.6 Duration & resource cost (cited)

```
effectiveDurationDays = round( template.durationDays
  × method.durationModifier            // 0.3 .. 2.5  (Investigation_Methods.csv)
  × teamSpeedFactor )                  // 1.0 − 0.10·extraAssistants, floor 0.6
```
- `template.durationDays`: `Investigation_Templates.csv` (5–20; INV_022 Time Anomaly = `Variable`, see §5).
- `method.durationModifier`: `Investigation_Methods.csv` (Force Deployment ×0.3 fastest, Asset Recruitment ×2.5 slowest).
- `teamSpeedFactor`: mirrors `Research_Projects.csv` "SPEED MODIFIERS" team logic (each extra assistant shaves time, floored). *Source: `Research_Projects.csv` SPEED MODIFIERS / TEAM COMPOSITION (+0.25x assistant idiom, here applied as time reduction).*

**Resource cost → $:** the method's `Resource_Cost` tier resolves to a dollar amount.

> **RULING — Resource_Cost tier → $.** Source gives only verbal tiers (Low/Medium/High/Very High). Set **Low = $5,000, Medium = $20,000, High = $75,000, Very High = $200,000** (per case). These are anchored to `Research_Projects.csv` resource economics (Materials:Basic $10/u, Advanced $50/u, Exotic $200/u) and to the `Player_Scaling` funding bands ($5–15k street tier) so the cheapest method is affordable at tier-1 and Force/Economic methods are a real strategic spend. **OWNER-FORK-INV-A** (§ Owner-forks) lets the owner rescale these four numbers.

### 3.7 Resolution → outcome bands (cited)

At `endDay`:
1. Roll **d100** on `Universal_Table_FIXED.csv` at `finalColumn` → one of **Failed / Minor / Success / Major** (the combat result, Bible §3.3). *Source: `Universal_Table_FIXED.csv`; `Stat_Rank_Mapping.csv` RESULT EFFECTS.*
2. Map that 4-band combat result onto the investigation's **6-band success ladder** in `Investigation_Consequences.csv` using the **roll position within the column** (how deep into the Success/Major region the roll landed), producing a success **percentage** that selects the `OutcomeBand` row:

> **RULING — combat-band → consequence-% mapping.** `Investigation_Consequences.csv` keys outcomes to a **0–100% success scale** (Critical Success 95–100 … Critical Failure 0–19), but the Universal Table emits only Failed/Minor/Success/Major. Bridge them deterministically:
> - **Major** → Critical Success (95–100) if roll ≤ 02 on the column else Major Success (80–94).
> - **Success** → Success (60–79).
> - **Minor** → Partial Success (40–59).
> - **Failed** → Failure (20–39) if roll < 80 on the column else Critical Failure (0–19) (the deepest misses are critical).
> This preserves the Bible's "Majors stay rare" intent (§3 ruling #1) and consumes the consequence table verbatim. *Source: `Investigation_Consequences.csv` Success_Level bands; `Universal_Table_FIXED.csv` distribution note ("Major Success should be RARE").*

3. Apply the selected `OutcomeBand`: `relationDelta`, `rewardTier`, `followUps`, `worldEvent`, `detection`, `timelineImpact` (the six generic rows). *Source: `Investigation_Consequences.csv` rows 2–7.*
4. **Theme overlay:** the case's `investigationType` selects a matching **SpecializedOutcome** row (rows 8–37) — e.g. an Alien/Tech case at Success applies **"Alien Technology"** (intel = "Extraterrestrial tech acquired", +2 science-country relations, reward = Alien artifacts, follow-up = first-contact investigations, low detection, timeline accel). This is **where tech-suit/research rewards come from** (§8). *Source: `Investigation_Consequences.csv` rows 8–37.*

**Outcome band → relation/reward (the real numbers):**
| Band | % | Relation Δ | Reward tier | Follow-ups | Detection |
|---|---|---|---|---|---|
| Critical Success | 95–100 | **+3** | High value | 2–3 unlock | None |
| Major Success | 80–94 | **+2** | Medium-high | 1–2 unlock | Low |
| Success | 60–79 | **+1** | Standard | 1 unlock | Medium |
| Partial Success | 40–59 | **0** | Reduced | 50% chance | High |
| Failure | 20–39 | **−1** | None | harder | Very high |
| Critical Failure | 0–19 | **−2** | Resource-loss penalty | **locked for a period** | Complete exposure |
*Source: `Investigation_Consequences.csv` rows 2–7 verbatim.*

---

## 4. Progress, ticking & the activity loop

- An `ActiveInvestigation` advances `progressPct` linearly per game-day: `+= 100 / effectiveDurationDays`. The Universal Table roll happens **once, at `endDay`** (not per-tick) — `finalColumn` is cached at commit so the progress bar can preview odds (§7).
- Investigations are a **Daily Activity** (Bible §7.6): an assigned investigator is in the `Investigation` activity and **cannot train / patrol / be deployed to combat** for the duration (unless the method itself is `Force Deployment`/`Vigilante Action`, which *is* a deployment). *Source: Bible §7.6 activity list.*
- World clock is real-time-with-pause (Bible §6/§11): the laptop pauses time; the day-tick that advances `progressPct` is the same global tick the travel/world-sim use.

---

## 5. Edge cases & failure modes

1. **`City_Type = 'Any'` templates (INV_021..INV_025):** eligible in every city; `cityCS = 0` unless the city's actual type also matches the case's derived tag (then it stacks normally). Crime range `'Variable'` (INV_023) and `0-100` (INV_021/022/024-ish) skip the crime-range gate. *Source: `Investigation_Templates.csv` City_Type='Any' rows.*
2. **INV_022 Time Anomaly — `Duration = Variable`, difficulty 10, Threat 5:** **RULING:** `effectiveDurationDays = 3` floor, and it is **gated to an investigator with the Time Travel talent (+5CS, `Investigator_Skills.csv`)** or it cannot be committed — the email (`EMAIL_008` "Deploy Time Walker") names the Time Walker explicitly. Ties to the diegetic save system (Bible §11): resolving it can *restore Time-Walker sanity/destinations*; `timelineImpact = "Major timeline repair"` (Consequences row 14). *Source: `Investigation_Templates.csv` INV_022; `Email_Investigation_Templates.csv` EMAIL_008; `Investigator_Skills.csv` Time Travel; `Investigation_Consequences.csv` Time Anomaly row; Bible §11.*
3. **Failed State country (Low Gov + High Corruption):** legal/official methods (METH_003/004/020) are **eligibility-blocked** in the method picker (greyed with reason "Failed State — only force/bribery work"); only force/black-market/bribe methods are selectable. *Source: `Country_Attribute_Effects.csv` Failed State combo.*
4. **Method requirements unmet:** each method's `Requirements` gate selection — e.g. Deep Cover needs "Acting skill; False identity documents", Diplomatic Inquiry needs "Diplomatic immunity; Embassy access", Vigilante Action needs "Combat capability; Willingness to break law". If no assigned investigator/faction satisfies a requirement, the method is greyed with the missing requirement shown. *Source: `Investigation_Methods.csv` Requirements column.*
5. **Talent limitations as soft gates:** `Investigator_Skills.csv` Limitations are surfaced as UI warnings and a few become hard riders — Time Travel "Temporal paradox risk", Psychic Persuasion "Ethical concerns" (reputation rider on the `heroic` axis if used on Interrogation cases), Dimensional Storage "Living things die in storage." **RULING:** limitations are **flavor + one optional reputation rider** (psychic/force interrogation methods cost −5 `heroic` reputation), not failure dice, to avoid double-penalizing. *Source: `Investigator_Skills.csv` Limitations; `reputationSystem.ts` heroic axis.*
6. **Email auto-expire:** if `autoExpire && now > emailReceived + urgencyHours` and the player never committed a method, the case **expires** → fires the `Failure`/negative world-event path (the world acts without you — Bible pillar 4) and the news generator reports it. `urgencyHours` ranges 4 (EMAIL_025 Reality Breach) → 168 (EMAIL_019 Cultural Exchange). *Source: `Email_Investigation_Templates.csv` Urgency_Hours / Auto_Expire.*
7. **Critical Failure lockout:** sets `state='locked'`, `lockUntilDay = endDay + LOCKOUT`. **RULING:** `LOCKOUT = template.durationDays` (the case "goes cold" for as long as it would have taken). *Source: `Investigation_Consequences.csv` Critical Failure "Investigation locked for period" — period unspecified; ruling fills it.*
8. **Detection consequences cascade:** when `detected`, apply the SpecializedOutcome's `Detection_Consequences` (e.g. Cover Blown row: −2 with all hostile factions, "Security crackdown" world event, max detection) **on top of** the band detection. Detection can flip a mechanical Success into a *diplomatic* loss. *Source: `Investigation_Consequences.csv` Detection columns.*
9. **No matching template for a city:** if a city has no type-matching non-`Any` template available and the lead is too low-INT, only `Any` templates and low-difficulty leads surface — prevents empty inboxes in remote `Village` cities (which still get INV_019/020). *Source: `Investigation_Templates.csv` Village rows.*
10. **Investigator KO/death mid-case:** if the lead is hospitalized/killed (combat between commit and `endDay`), the case auto-reassigns to the next-best assist or, if none, drops to `Partial Success` ceiling at resolution. *Bible §7.6 (Hospital activity), §5.6 (injury/death). RULING fills the unspecified handoff.*
11. **Multi-faction same case:** each faction has its own `ActiveInvestigation` instance; resolving one can fire a `worldEvent` that *raises difficulty* for the others (the world moved). MP-safe (per-faction record). *Bible MP stub.*

---

## 6. How it consumes the SPINE (summary with formulas)

The §3.2 column **is** the spine consumption. Restated as the audit Bible ruling #9 wants:

| Spine source | Consumed as | Formula term |
|---|---|---|
| Country stats (35) | per-method ±CS + eligibility overrides | `countryCS` (§3.5) |
| Combined-effects (Surveillance/Research/Media) | detection %, reward quality, reverse-eng speed | `effectiveDetectionPct`, §8 reward tier |
| City type (10) | type-match Investigation_Bonus | `cityCS` (§3.4) |
| Crime index | legal-vs-underground method ±CS | `crimeCS` (§3.4) |
| Population rating | resource/stealth axis → detection & resource tier | `populationStealthPenalty`, cost tier |
| Culture region (14) | type-match ±CS | `cultureCS` (§3.4) |
| Faction standing | method Faction_Bonus + territory bonus | `factionCS` (§3.5) |
| Personality (lead) | optional auto-method suggestion + risk bias | UI only (§7), no success change |
| Threat level (template) | combat-trigger scaling if escalated | handoff to `missionSystem` (§8) |

Every term traces to a named CSV. No term is invented.

---

## 7. UI / UX hooks (phone / world-map / laptop / combat overlay)

**Laptop — Investigations app (primary surface; extends `InvestigationCenter.tsx`):**
- **Inbox lead** → click → **Case Brief** panel: parameterized `Body_Template`, the `Response_Options` as buttons, `Priority` flag, and a live **Urgency_Hours countdown** (red <6h). *Source: `Email_Investigation_Templates.csv`.*
- **Method picker:** grid of the 25 methods, each showing its `successModifier` (±CS), `detectionChancePct`, `riskLevel`, `$cost` (resolved tier), `durationModifier`. **Ineligible methods greyed** with reason (Failed-State / unmet Requirement). Faction-signature methods badged (US→Force/Surveillance, India→Diplomatic/Spiritual, China→Surveillance/Social-Network, Nigeria→Tribal/Black-Market — from `Faction_Bonus` rows). *Source: `Investigation_Methods.csv`.*
- **Investigator assignment:** roster filtered by talent relevance; each candidate shows their **best matching talent +CS** for this case type (green if ≥+2). *Source: `Investigator_Skills.csv`.*
- **Odds preview bar:** before commit, show the cached `finalColumn` as a Failed/Minor/Success/Major probability split (read straight off `Universal_Table_FIXED` at that column) + the `effectiveDetectionPct`. No hidden math — JA2 transparency.
- **Active case card:** progress bar (`progressPct`), ETA (`endDay`), assigned crew, a "recall/abort" (forfeits resources, no penalty before 25% progress).
- **Resolution modal:** the `OutcomeBand` headline + the themed SpecializedOutcome narrative + the concrete rewards (with a "Send to Research/Engineering" CTA when the reward is a schematic/sample — §8), relation deltas, follow-up leads (auto-added to inbox), detection result.

**Phone:** a `Critical`-priority email pings as a phone interrupt (Bible §7.1 priority flags); the phone can deliver a one-line "case went cold / case cracked" push.

**World-map:** the case's `cityId` shows a **magnifying-glass glyph** on its sector; deploy-to-combat cases (Force/Vigilante methods, or escalated outcomes) drop a mission pin (handoff to doc 04 world-map + `missionSystem`).

**Combat overlay (symbolic combat, Bible combat note):** when an investigation *escalates to a fight*, the combat HUD shows an "INVESTIGATION: {name}" banner and an extraction objective; succeeding/failing the fight feeds back the SpecializedOutcome (e.g. capturing the target = the `Criminal Network`/`LSW Recruitment` outcome). Combat stays plain-grid + glyphs (no bespoke art).

---

## 8. Integration points (reads / writes) — incl. the tech-suit / research handoff

**Reads:** `allCountries`/`allCities` (Bible ruling #10), `Country_Attribute_Effects`, `City_Type_Effects`, `Culture_Region_Effects`, `Stat_Rank_Mapping`, `Universal_Table_FIXED`, `combinedEffects.ts` (Surveillance/Research/Media), `factionSystem.ts` standings, character INT + `PersonalityType` + talents, the email envelope (doc 02), the global day-tick.

**Writes:**
- **Reputation/relations:** `reputationSystem.adjustMultipleReputation` (the band `relationDelta` → `government` axis; SpecializedOutcome signed deltas → the named axis: criminal outcomes → `criminal` +, law → `government` −; psychic-interrogation rider → `heroic` −). *Source: `Investigation_Consequences.csv` Relationship_Change; `reputationSystem.ts`.*
- **News:** emits an outcome fact to `newsGenerator.ts` (the `worldEvent` tag → a BNN/ANN story). *Bible §7.2.*
- **Follow-up leads:** band `followUps` → 0–3 new `InvestigationEmail`s queued to the inbox (themed by the SpecializedOutcome `Follow_Up_Investigations`). *Source: Consequences Follow_Up columns.*
- **Combat:** Force/Vigilante methods and "Military Response"/"Terrorist Retaliation"/"Criminal Network" outcomes emit a `GeneratedMission` (`missionSystem.ts`, doc 02) scaled by the template `Threat_Level`.
- **World-state:** `worldEvent`/`timelineImpact` mutate the world-state trackers (doc 02) and, for Time-Anomaly, the Time-Walker save economy (Bible §11).

**★ The tech-suit / reverse-engineering handoff (the headline output, Bible §7.4):**
Each reward tag → a typed reward object the **Research/Engineering** activity (Bible §7.6; `Research_Projects.csv`) consumes:

| Reward tag (from Consequences/Templates) | → Research/Engineering effect | Cited target |
|---|---|---|
| `Tech Research Data` / `Technology Plans` / `Technology Schematics` | grants a **Schematic** = unlocks one matching `NODE_*` early (skips its `Base_Days` prerequisite research) | `Research_Projects.csv` TECH UNLOCK NODES |
| `Alien Technology` / `Alien artifacts` | grants `Samples:Alien` units (3 = one `PRJ_100 Alien_Analysis`) → path to `SKILL_ALIEN`, `PRJ_101 Vibranium_Armor`, `PRJ_102 Alien_Weapon` | `Research_Projects.csv` PRJ_100/101/102, NODE_150/151, RESOURCE Samples:Alien |
| `Military Equipment` / `Base Access` | grants `Materials:Advanced/Exotic` stock + unlocks `Weapons_Lab` tier projects | `Research_Projects.csv` FACILITIES / RESOURCE TYPES |
| `Equipment` / `Corporate Contact` (Industrial/Company) | grants `Components:Advanced` + a `Workshop` modification (the city's Workshop special) | `City_Type_Effects.csv` Industrial Workshop; `Research_Projects.csv` |
| `Research Data` (Educational) | applies **Innovation-Hub +3CS** style speed bonus to the next research project | `Country_Attribute_Effects.csv` Innovation Hub; `Research_Projects.csv` SPEED MODIFIERS |
| `LSW Recruitment` / `Veteran LSW Recruitment` / `Officer Recruitment` | adds a recruit to the Personnel candidate pool (Bible §7.3) | `Investigation_Templates.csv` reward strings; Bible §7.3 |
| `Smuggling Route Control` / `Black market access` | unlocks **Materials:Exotic / Components:Exotic** purchasing (Black_Market acquisition path) | `Research_Projects.csv` RESOURCE acquisition "Black_Market" |
| `Mystical Knowledge` / `Spiritual Enhancement` (Temple) | grants `Samples:Neural`/Psi research input (path to `PSI_AMP`, `PRJ_090`) | `Research_Projects.csv` TREE_PSI |

So the **canonical tech-suit chains** an investigation feeds (all in `Research_Projects.csv`):
- **Flight suit** = `NODE_070→071→072` Propulsion → `PRJ_041 Flight_Pack` (`COMP_FLIGHT`, full flight). A `Military Weapons Theft`/`Tech Leak` schematic can skip a node.
- **Fighting (power) suit** = `PRJ_020/021` frames → `PRJ_040 Power_Armor_Mk1` (25/15 DR +20 STR) → `PRJ_044/045` Mk2/Mk3. Mk2+ needs **Materials:Alien** = an **Alien Technology investigation reward.**
- **Stealth suit** = `NODE_080→081` → `PRJ_042 Stealth_Suit` (5/5 DR +4CS stealth). Fed by `Tech Research Data`.
- **Robot repair / drone** = `PRJ_018/029/032` (Recon/Medical/Combat drones) — investigations that recover `Equipment` or capture enemy drones grant the components.

**RULING — reward→research is a *grant*, not auto-build.** Investigations grant the **inputs/unlocks** (samples, schematics, exotic-material access, recruits); the player still runs the Research/Engineering activity (with its `Base_Days`, facility, career-rank, complications table) to *build* the suit. This keeps the two systems decoupled and makes investigations the *fuel*, research the *factory* — matching Bible §7.4 ("Outputs: build tech suits … reverse-engineer defeated-enemy tech") and §7.6.

---

## 9. RULING notes (collected)

1. **difficultyCS = baseDifficulty − 5** — normalizes the 1–10 template scale to ±CS (§3.2).
2. **Combat-band → consequence-% bridge** — deterministic mapping of Failed/Minor/Success/Major onto the 6 consequence bands, preserving "Majors rare" (§3.7).
3. **1CS = 10% for detection only** — reconciles method-% with spine-±CS without polluting the success column (§3.5).
4. **Resource_Cost tiers → $5k/$20k/$75k/$200k** — anchored to research economics + Player_Scaling funding (§3.6; owner-rescalable, OWNER-FORK-INV-A).
5. **Team cap = 1 lead + 2 assists effective** — mirrors the research-team idiom; extras only cut duration (§3.3).
6. **INV_022 Time Anomaly gated to Time-Travel talent, 3-day floor** — ties to the diegetic save economy (§5.2).
7. **Critical-Failure lockout = template.durationDays** — fills the unspecified "locked for period" (§5.7).
8. **Talent Limitations = flavor + one optional reputation rider** (psychic/force interrogation = −5 heroic), not failure dice (§5.5).
9. **Reward→research is a grant, not an auto-build** — investigations are fuel, research is the factory (§8).
10. **KO/death mid-case** auto-reassigns to best assist else caps at Partial Success (§5.10).

All numeric anchors trace to: `Investigation_*.csv`, `Email_Investigation_Templates.csv`, `Research_Projects.csv`, `Country_Attribute_Effects.csv`, `City_Type_Effects.csv`, `Culture_Region_Effects.csv`, `Stat_Rank_Mapping.csv`, `Universal_Table_FIXED.csv`, `Player_Scaling` (Bible §10).

---

## 10. OWNER-FORK notes (product/tone/scope calls the data can't settle)

- **OWNER-FORK-INV-A — Resource_Cost $ scale.** The four tier→$ numbers ($5k/$20k/$75k/$200k) are a ruling anchored to research/funding economics, but the absolute scale is a balance/tone call (tight JA2 economy vs smoother ramp — ties to onboarding O1). → **Rec: keep as-is for tight JA2 feel; expose as a CSV-tunable `Method_Cost_Tiers` row so it rebalances without code.**
- **OWNER-FORK-INV-B — Auto-method suggestion (personality-driven).** Should the assigned investigator's `PersonalityType` *auto-suggest* (or even auto-pick for high-autonomy personalities) a method, à la "a living world that talks to you"? Pure player-choice is safer; auto-suggest is more characterful. → **Rec: suggest-only (highlight the on-brand method), never auto-commit;** matches doc 03 P6 (suggest-and-confirm).
- **OWNER-FORK-INV-C — Psychic/force interrogation reputation cost.** §5.5 charges −5 `heroic` for ethically-flagged methods (Psychic Persuasion, Psychic Blast, force interrogation). Is that the right tone (heroes shouldn't torture) or should it be cost-free in a grim setting? → **Rec: keep the small heroic-reputation cost** — it gives the morality system teeth without blocking the option.
- **OWNER-FORK-INV-D — Investigation count at ship.** 25 templates × 25 methods × 58 talents already yields huge variety, but is 25 templates enough hand-authored breadth, or should the Event Engine (doc 02) generate *additional* parameterized investigations from the AI-scenario grammar? → **Rec: ship the 25 authored as the spine; let doc 02 spawn variants only for `Any`-type/world-state-driven cases** (keeps tone controlled).
- **OWNER-FORK-INV-E — Time-Anomaly ↔ save economy coupling strength.** How tightly does resolving INV_022 restore Time-Walker sanity/destinations (a powerful, possibly exploitable, save-economy lever)? → **Rec: small, capped sanity refund per successful Time-Anomaly case, with diminishing returns** — defer exact numbers to the save-system spec (doc 11/108).

---

## 11. Open questions

1. **Investigation-type tag canonicalization (data):** the union of type strings across four CSVs (§3.4) needs one authoritative `InvestigationType` enum + a join map (template/talent/city/culture → tag). Proposed set is in §3.4; confirm before coding the matcher.
2. **Faction-signature method binding:** the `Faction_Bonus` column names US/China/India/Nigeria bonuses, but each faction's *signature* method (Bible §6.4 "a signature investigation method") should be explicitly tagged for the UI badge — confirm: US→Force Deployment + Technology Surveillance, India→Diplomatic Inquiry + Spiritual Investigation, China→Technology Surveillance + Social Network Analysis, Nigeria→Tribal Network + Black Market Contact (read from highest `Faction_Bonus` per faction).
3. **Reward-tag vocabulary:** `Potential_Rewards` / `Resource_Reward` are free-text in source; §8 maps the common tags, but a few rare strings (`Diplomatic Immunity`, `First Contact Protocol`, `Reality Stabilization`) need an explicit effect or a documented "narrative-only" flag.
4. **Crime-range gate for `Variable`/`0-100` templates:** confirm `Variable` (INV_023) means "any crime index, no bonus/penalty from range" (current assumption, §5.1).
5. **Detection→combat escalation:** does a *detected* covert case auto-spawn an ambush encounter (the world fights back) or only raise the next case's difficulty? Current spec: difficulty + diplomatic loss; combat only via Force/Vigilante/escalation outcomes. Confirm desired aggressiveness.
