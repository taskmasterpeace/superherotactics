# 17 — Fame / Reputation / Public Perception / Legal Consequences

> **Build-ready system spec.** Every number traces to a named source table. Rulings (`RULING:`) and product choices (`OWNER-FORK:`) are labeled. A coding agent should implement this with zero follow-up.
>
> **Primary source table:** `docs/csv-source-data/Public_Perception.csv` (34 perception-event rows: scale, media type, reputation delta, financial consequence, legal action, legal cost range, insurance impact, political fallout, international effect, long-term effect).
>
> **Other source tables consumed:**
> - `docs/csv-source-data/Game_Mechanics_Spec/Country_Attribute_Effects.csv` (MediaFreedom / LSWRegulations / Vigilantism / GovernmentPerception → ±CS rows; the "LSW Haven" / "Failed State" / "Lawless" combos; per-faction-nation rows).
> - `docs/csv-source-data/SuperHero Tactics World Bible - Country.csv` (35 country stat columns incl. `MediaFreedom`, `LSWRegulations`, `Vigilantism`, `LawEnforcement`, `GovermentCorruption`, `GovernmentPreception`, `IntelligenceServices`, `MilitaryServices`, `Science`, `Cloning`, `CapitalPunishmentType`).
> - `docs/csv-source-data/SuperHero Tactics World Bible - Cities.csv` (`HVT`, `CrimeIndex`, `SafetyIndex`, `CityType1-4`, `PopulationRating`).
> - `SuperHero Tactics/Combat Compendium REAL - 🎯PERSONALITY TARGET SELECTION🎯.csv` (20 personality → target-preference codes; consumed here for *villain attention* selection).
> - `SHT_MECHANICS_BIBLE.md` §3 (Universal Table / Column-Shift currency), §6.1 (Country spine), §8 (Combined-effects: LSW affairs, Media control, Politics), §9 (this exact system), §13 (rulings).
> - **Existing code to reconcile (do NOT rewrite blindly):** `MVP/src/data/fameSystem.ts` (fame 0–100, reputation −100..+100, `FAME_THRESHOLDS`, `FAME_CHANGES`, civilian reactions), `MVP/src/data/factionSystem.ts` (`STANDING_THRESHOLDS`, per-faction-per-country standing), `MVP/src/data/combinedEffects.ts` (`calculateSuperhumanAffairs`, `publicOpinionVolatility`).

---

## 1. Overview & player fantasy

You are not just winning fights — you are **building (or wrecking) a legend** that the living world reacts to. Every public act is filed by the press, scored by governments, sued over by victims, and remembered for the rest of the 2,472-day campaign. The fantasy is the comic-book double bind: **the more spectacular your save, the more collateral you risk, and collateral is a years-long debt** (lawsuits, insurance, sanctions, recruitment droughts), per `Public_Perception.csv` "Long_Term_Effects".

Three coupled meters, all already half-built in code:

| Meter | Range | Owns | Source of truth |
|---|---|---|---|
| **Fame** (how *known* you are) | 0–100 | recognition, villain attention, price of everything, mission access | `fameSystem.ts` `FAME_THRESHOLDS` |
| **Reputation / Public Perception** (how *liked* — hero↔villain) | −100..+100, tracked **globally and per-country** | civilian reactions, recruitment pool, legal severity multiplier | `fameSystem.ts` `regionReputation`; `Public_Perception.csv` `Reputation_Change` |
| **Legal Heat** (open legal/financial liability) | 0–100 per jurisdiction | lawsuits, fines, insurance status, arrest/sanction triggers | `Public_Perception.csv` `Legal_Action_Type` + `Legal_Cost_Range` + `Insurance_Impact` |

> **RULING (R-17.1) — three meters, one event pipeline.** Fame, Reputation, and Legal Heat are **three separate stored values** but are all written by **one event resolver** keyed on `Perception_Event` from `Public_Perception.csv`. This avoids the bug where combat code bumps `fameSystem.ts` reputation but the legal/insurance columns in `Public_Perception.csv` are never consumed (Bible §9 / §13.9: "combined-effects must be consumed"). The CSV row IS the authoring surface; code never invents a delta.

The phone is how this reaches the player (Bible: "a living world that talks to you"): a **News app** prints the press reaction, a **Legal app** tracks open suits and insurance, a **Personnel app** shows recruitment effects. Combat shows a live **Collateral / Heat overlay** so the player feels the bill accruing.

---

## 2. Data schema

### 2.1 `PerceptionEvent` (authored row — 1:1 with a `Public_Perception.csv` line)

```ts
// Loaded from Public_Perception.csv. NEVER hand-author deltas in code.
interface PerceptionEvent {
  id: string;                       // = Perception_Event (e.g. "Civilian_Casualties_Minor")
  scale: PublicImpactScale;         // Public_Impact_Scale column
  mediaCoverage: string;            // Media_Coverage_Type (verbatim, shown in News app)
  reputationChange: RepDelta;       // parsed from Reputation_Change (see 2.2)
  financialConsequence: string;     // Financial_Consequence (flavor + drives cost)
  legalActionType: string;          // Legal_Action_Type ("None" | "...lawsuits" | "...charges")
  legalCostRange: CostRange;        // parsed from Legal_Cost_Range (see 2.3)
  insuranceImpact: InsuranceImpact; // parsed from Insurance_Impact (see 2.4)
  politicalFallout: string;         // Political_Fallout (drives faction standing — §6)
  internationalEffect: string;      // International_Relations_Effect (drives relations matrix — §6)
  longTermEffect: string;           // Long_Term_Effects (drives the persistent flag — §5.3)
}

type PublicImpactScale =
  | 'Personal' | 'Local' | 'Regional' | 'National'
  | 'International' | 'Global' | 'Reality-Scale' | 'Faction'
  | 'Legal Action' | 'Financial' | 'Media Control'
  | 'Political Control' | 'Diplomatic' | 'Military' | 'Honor';
// All 15 distinct values present in Public_Perception.csv "Public_Impact_Scale".
```

### 2.2 `RepDelta` — parsing the `Reputation_Change` column

The CSV uses heterogeneous strings. Parse to a normalized struct **at load time**:

```ts
interface RepDelta {
  flat?: number;          // e.g. "-5 National Reputation" -> -5
  range?: [number,number];// e.g. "+5 to +20 Reputation"  -> [5,20]
  scopeTag: string;       // "National" | "Global" | "Local" | "Faction" | "Personal" | "Military" | "Reality" | "Science" | ""
  varies?: boolean;       // "Varies by faction betrayed" / "Varies by building importance" -> true
}
```

**Exact authored values from `Public_Perception.csv` (Reputation_Change column, verbatim):**

| Perception_Event | Reputation_Change | Parsed |
|---|---|---|
| Street_Crime_Stopped | `+2 Local Reputation` | flat +2, scope Local |
| Property_Damage_Minor | `+1 Local; -1 Property` | flat +1 Local, −1 property-liability tag |
| Property_Damage_Major | `-2 Regional Reputation` | flat −2, scope Regional |
| Civilian_Casualties_Minor | `-5 National Reputation` | flat −5, scope National |
| Civilian_Casualties_Major | `-10 Global Reputation` | flat −10, scope Global |
| Building_Destruction | `Varies by building importance` | varies (see R-17.4) |
| Infrastructure_Damage | `-8 National Reputation` | flat −8, National |
| Hospital_Damage | `-12 National Reputation` | flat −12, National |
| School_Damage | `-15 National Reputation` | flat −15, National |
| Government_Building_Damage | `-20 International Reputation` | flat −20, International |
| Military_Base_Damage | `-25 Military Reputation` | flat −25, Military scope |
| Nuclear_Facility_Damage | `-50 Global Reputation` | flat −50, Global |
| Saved_Lives_Civilian | `+5 to +20 Reputation` | range [5,20] (see R-17.4) |
| Prevented_Disaster | `+10 to +30 Reputation` | range [10,30] |
| Alien_Technology_Recovery | `+25 Global Science Reputation` | flat +25, Science |
| Time_Travel_Success | `+40 Reality Reputation` | flat +40, Reality |
| Public_Identity_Exposed | `-10 Personal Reputation` | flat −10, Personal |
| Team_Member_Death | `-15 Faction Reputation` | flat −15, Faction |
| Faction_Betrayal | `Varies by faction betrayed` | varies |
| Mass_Destruction | `-100 Global Reputation` | flat −100, Global |
| Heroic_Recognition | `Global recognition for saving lives` | special → treat as +20 Global (see R-17.5) |

The 13 remaining rows (`Lawsuit_*`, `Insurance_Claim_*`, `Media_Spin_*`, `Government_Cover_Up`, `International_Treaty_Violation`, `War_Crimes_Accusation`) have **no numeric reputation delta** in the Reputation_Change column (they hold descriptive text); they are **consequence/process events**, not perception triggers — see §5.4 and R-17.6.

### 2.3 `CostRange` — parsing `Legal_Cost_Range`

```ts
interface CostRange {
  min: number;            // USD
  max: number;            // USD
  perUnit?: 'civilian' | 'school' | 'vehicle' | 'business' | 'patient' | 'death' | null;
  positive?: boolean;     // "Positive" / "Positive financial rewards" -> reward not cost
  impossible?: boolean;   // "Insurance impossible" / "Legal system must adapt"
}
```

**Exact `Legal_Cost_Range` values (verbatim from CSV):**

| Perception_Event | Legal_Cost_Range | min | max | perUnit |
|---|---|---|---|---|
| Street_Crime_Stopped | None | 0 | 0 | — |
| Property_Damage_Minor | $5K-$25K | 5,000 | 25,000 | — |
| Property_Damage_Major | $100K-$500K | 100,000 | 500,000 | — |
| Civilian_Casualties_Minor | $50K-$200K per civilian | 50,000 | 200,000 | civilian |
| Civilian_Casualties_Major | $500K-$5M per civilian | 500,000 | 5,000,000 | civilian |
| Building_Destruction | $250K-$10M | 250,000 | 10,000,000 | — |
| Infrastructure_Damage | $1M-$50M | 1,000,000 | 50,000,000 | — |
| Hospital_Damage | $2M-$20M | 2,000,000 | 20,000,000 | — |
| School_Damage | $1M-$15M per school | 1,000,000 | 15,000,000 | school |
| Government_Building_Damage | $5M-$100M | 5,000,000 | 100,000,000 | — |
| Military_Base_Damage | $10M-$200M | 10,000,000 | 200,000,000 | — |
| Nuclear_Facility_Damage | $100M-$10B | 100,000,000 | 10,000,000,000 | — |
| Public_Identity_Exposed | Personal security costs $50K-$500K | 50,000 | 500,000 | — |
| Team_Member_Death | $500K-$5M per death | 500,000 | 5,000,000 | death |
| Faction_Betrayal | Legal costs $1M-$50M | 1,000,000 | 50,000,000 | — |
| Mass_Destruction | $1B-$1T+ in damages | 1,000,000,000 | 1,000,000,000,000 | — |
| Lawsuit_Property_Individual | $5K-$500K | 5,000 | 500,000 | — |
| Lawsuit_Wrongful_Death | $500K-$10M + criminal penalties | 500,000 | 10,000,000 | — |
| Lawsuit_Environmental | $1M-$100M + restoration costs | 1,000,000 | 100,000,000 | — |
| Lawsuit_Constitutional | Legal costs $10M-$100M | 10,000,000 | 100,000,000 | — |
| Insurance_Claim_Vehicle | $10K-$200K per vehicle | 10,000 | 200,000 | vehicle |
| Insurance_Claim_Business | $50K-$5M per business | 50,000 | 5,000,000 | business |
| Insurance_Claim_Medical | $25K-$2M per patient | 25,000 | 2,000,000 | patient |
| Media_Spin_Positive | Media production costs $100K-$1M | 100,000 | 1,000,000 | — |
| Media_Spin_Negative | Legal defense costs $500K-$5M | 500,000 | 5,000,000 | — |
| Government_Cover_Up | Classification costs $1M-$10M | 1,000,000 | 10,000,000 | — |
| International_Treaty_Violation | $10M-$1B in reparations | 10,000,000 | 1,000,000,000 | — |
| War_Crimes_Accusation | Legal defense $10M-$100M | 10,000,000 | 100,000,000 | — |
| Heroic_Recognition | $100K-$1M for ceremony | 100,000 | 1,000,000 | — |
| Saved_Lives_Civilian | Positive | — | — | positive=true |
| Prevented_Disaster | Positive financial rewards | — | — | positive=true |
| Alien_Technology_Recovery | Intellectual property battles | — | — | (see R-17.7) |
| Time_Travel_Success | Legal system must adapt | — | — | impossible=true |
| Government_Building_Damage `Insurance` etc → see 2.4. |

### 2.4 `InsuranceImpact` — parsing `Insurance_Impact`

```ts
type InsuranceTrend = 'improve' | 'slight_up' | 'up_25pct' | 'up' | 'questioned'
                    | 'denied' | 'crisis' | 'collapse' | 'impossible' | 'neutral';
interface InsuranceImpact { trend: InsuranceTrend; note: string; } // note = verbatim CSV cell
```

**Authored mapping (verbatim → enum):** `Insurance rates improve`→`improve`; `Slight insurance increase`→`slight_up`; `Insurance rates increase 25%`→`up_25pct` (the **only explicit % in the table**); `Insurance coverage questioned`→`questioned`; `Insurance coverage denied`→`denied`; `Commercial insurance rates skyrocket` / `Medical insurance industry crisis` / `Government insurance crisis`→`crisis`; `Global insurance industry collapse` / `Global insurance industry panic`→`collapse`; `Insurance coverage impossible` / `Reality insurance impossible` / `War crimes insurance impossible` / `Constitutional insurance impossible`→`impossible`.

### 2.5 Runtime state (the three meters)

```ts
interface PerceptionState {
  // FAME — reuse fameSystem.ts verbatim (do not fork the scale)
  fame: number;                              // 0..100
  regionFame: Record<string,number>;         // ISO country code -> fame

  // REPUTATION — reuse fameSystem.ts -100..+100
  reputation: number;                        // global
  regionReputation: Record<string,number>;   // ISO country code -> -100..+100

  // LEGAL HEAT — NEW (this spec adds it; Public_Perception legal columns were unconsumed)
  legalHeat: Record<string, number>;         // ISO country code -> 0..100
  openCases: LegalCase[];
  insuranceStatus: Record<string, InsuranceTrend>; // per country, latest trend
  treasuryLiability: number;                 // sum of unpaid case.amountOwed

  // Persistent flags from Long_Term_Effects (banlist / privileges)
  worldFlags: string[];                      // e.g. "GLOBAL_LSW_BAN", "HERO_STATUS", "MEDICAL_NONCOOP"
}

interface LegalCase {
  id: string;
  sourceEventId: string;       // PerceptionEvent.id that spawned it
  countryCode: string;
  courtTier: CourtTier;        // derived from Legal_Action_Type / scale (§4.1)
  amountOwed: number;          // rolled inside CostRange × jurisdiction multiplier (§4.2)
  status: 'filed' | 'discovery' | 'trial' | 'settled' | 'lost' | 'won' | 'dismissed';
  filedDay: number;            // game day
  resolveByDay: number;        // filedDay + tier duration (§4.3)
  criminal: boolean;           // legalActionType contains "charges"/"treason"/"crimes"
}

type CourtTier = 'civil_local' | 'civil_federal' | 'criminal' | 'constitutional'
               | 'international' | 'tribunal';
```

---

## 3. The personality table → **villain attention** (consuming `PERSONALITY TARGET SELECTION`)

Fame is the *targeting beacon* for the world's hostile actors. When the world-state sim picks **which villain/faction comes after the player's roster**, it reuses the combat target-preference codes from `Combat Compendium REAL - 🎯PERSONALITY TARGET SELECTION🎯.csv` (20 personalities, codes `1=Most Health, 2=Least Health, 3=Major Threat (most damage dealt), 4=Minor Threat, 5=Random`). On the strategic layer we **remap the same five codes to fame/reputation** so a villain's personality drives who they hunt — identical data, second consumer (Bible §5.10 "Extend this into idle/world behavior"):

| Code (verbatim) | Combat meaning | **Strategic remap (this spec)** |
|---|---|---|
| 1 Most Health | most-HP enemy | hunt the **highest-Fame** hero (glory-seeker) |
| 2 Least Health | least-HP enemy | hunt the **lowest-Fame** hero (easy headline) |
| 3 Major Threat | most-damage-dealt | hunt the **most-feared** hero (lowest reputation / highest infamy) |
| 4 Minor Threat | least-damage-dealt | hunt the **most-beloved** hero (highest reputation — topple the icon) |
| 5 Random | random | random roster member |

The 20 authored personality codes (verbatim row from the CSV, columns 1–20):
`1,3,4,4,1,3,4,1,2,2,1,4,2,3,3,3,2,5,5,2`.
A villain whose `personalityType ∈ [1..20]` looks up its code in this array and selects its strategic target accordingly. This wires the existing combat data into the consequence loop with **zero new numbers invented**.

> **RULING (R-17.2).** Villain-attack *frequency* scales with the targeted hero's Fame band, reusing `FAME_THRESHOLDS.recognitionChance` (`fameSystem.ts`) as the per-week encounter roll: unknown 0.05 → local 0.15 → regional 0.30 → national 0.50 → international 0.70 → legendary 0.95. Same numbers, now driving "famous heroes get attacked more," which is the cost side of Fame.

---

## 4. Legal system — exact formulas

### 4.1 `Legal_Action_Type` → `CourtTier` (authored mapping)

Derived deterministically from the CSV `Legal_Action_Type` + `Media_Coverage_Type` strings:

| If `legalActionType` contains… | CourtTier | criminal |
|---|---|---|
| `None` | (no case) | — |
| `property damage` / `structural` / `vehicle` / `business interruption` | `civil_local` | false |
| `wrongful injury` / `wrongful death lawsuits` (civil only) | `civil_local` | false |
| `infrastructure claims` / `government infrastructure` / `negligence` / `subrogation` | `civil_federal` | false |
| `charges` (e.g. `Environmental terrorism charges`, `Treason`, `Treason and sabotage`, `criminal charges`) | `criminal` | true |
| `Constitutional violation` | `constitutional` | true |
| `International Court of Justice` / `treaty violation` | `international` | false |
| `War crimes` / `International Criminal Court` / `tribunal` | `tribunal` | true |

These strings are all present verbatim in `Public_Perception.csv` `Legal_Action_Type`.

### 4.2 Amount owed (rolls inside the authored `CostRange`)

```
base = uniformRoll(costRange.min, costRange.max)         // from §2.3 table
if perUnit: base *= collateralCount[perUnit]             // e.g. #civilians killed this op
amountOwed = round( base × jurisdictionMultiplier )      // §4.4
```

`collateralCount` is produced by the **combat collateral tracker** (§7), not invented here. If `costRange.positive`, this is a **reward** credited to treasury, not a debt. If `costRange.impossible`, no monetary case is filed — a `worldFlag` is set instead (Time_Travel_Success → `TEMPORAL_LAW_PENDING`).

### 4.3 Case duration (time-to-resolve, in game days)

> **RULING (R-17.3) — case durations.** `Public_Perception.csv` gives **no** durations. The Bible says collateral is "a *years-long* consequence, not a slap" (§9) and the time ratio is ≈1 real day : 30 game days (§6.5). Per court tier (consistent with Bible's escalation order property→federal→war-crimes):

| CourtTier | resolve window (game days) | Rationale |
|---|---|---|
| civil_local | 60 | small-claims pace |
| civil_federal | 180 | federal docket |
| criminal | 365 | indictment→trial |
| constitutional | 540 | supreme-court pace |
| international | 720 | ICJ pace |
| tribunal | 900 | war-crimes tribunal |

These are RULING numbers (no source); flagged so a balancer can tune in one file.

### 4.4 Jurisdiction multiplier (THE SPINE — §6 has the full formula)

`amountOwed` and reputation severity are both scaled by **where it happened**. Allied/home nations go soft; hostile nations escalate (Bible §9: "allied nations minimal; hostile escalated"). The multiplier is computed from country stats + faction relation — see §6.2.

### 4.5 Insurance state machine

`insuranceStatus[country]` advances along the worst trend seen, monotonically toward denial:
`improve → slight_up → up_25pct → up → questioned → denied → crisis → collapse/impossible`.
At `denied`+, new property/medical cases bill the **player treasury directly** (no insurance offset). The only explicit numeric is `up_25pct` = **+25% premiums** (authored, `Public_Perception.csv` Property_Damage_Major row). Premium math beyond that single authored 25% is an OWNER-FORK below.

> **OWNER-FORK (OF-17.A) — premium economy.** Whether players pay a recurring insurance *premium* line-item (and the exact % for trends other than the authored 25%) is a product/economy choice. The CSV only authors *direction* + the one 25% figure. Default ship: insurance is binary (covered → offsets 100% of civil_local property/vehicle/business/medical cases; denied → 0% offset). The graded-premium model is an owner decision.

---

## 5. Reputation event resolution — the one pipeline

### 5.1 Trigger sources (who calls `applyPerceptionEvent`)

1. **Combat collateral tracker** (§7) → after combat: maps destroyed-tile types to `Property_Damage_*`, `Building_Destruction`, `Infrastructure_Damage`, `Hospital_Damage`, `School_Damage`, `Government_Building_Damage`, `Military_Base_Damage`, `Nuclear_Facility_Damage`; maps civilian kills to `Civilian_Casualties_*`; maps rescues to `Saved_Lives_Civilian`.
2. **Mission resolver** → `Prevented_Disaster`, `Alien_Technology_Recovery`, `Faction_Betrayal`, `Team_Member_Death`.
3. **Investigation/world-state** → `Public_Identity_Exposed`, `Government_Cover_Up`, `Media_Spin_*`, `International_Treaty_Violation`, `War_Crimes_Accusation`.
4. **Time-travel save** → `Time_Travel_Success` (Bible §11).

### 5.2 Resolver algorithm

```
applyPerceptionEvent(eventId, ctx /* {countryCode, collateralCount, factionRelation, ...} */):
  ev = PerceptionEvents[eventId]                         // from CSV, never invented
  # 1) Reputation
  delta = resolveRepDelta(ev.reputationChange, ctx)      // flat | midpoint(range) | R-17.4 varies
  sevMult = jurisdictionRepMultiplier(ctx)               // §6.2
  applyToFame(fameSystem, { reputationChange: round(delta*sevMult),
                            fameChange: fameFromScale(ev.scale),   // §5.5
                            wasPublic: ctx.wasPublic, location: ctx.countryCode })
  # 2) Legal
  if ev.legalActionType != "None" and not ev.repDelta.positive:
     case = openCase(ev, ctx)                            // §4.1–4.4
     legalHeat[ctx.countryCode] += heatFromTier(case.courtTier)   // R-17.8
  # 3) Insurance
  advanceInsurance(ctx.countryCode, ev.insuranceImpact.trend)     // §4.5
  # 4) Political & international (faction + relations matrix)
  applyPoliticalFallout(ev.politicalFallout, ctx)        // §6.3
  applyInternational(ev.internationalEffect, ctx)        // §6.3
  # 5) Persistent world flag
  if ev.longTermEffect matches a flag rule: worldFlags.add(flag)  // §5.3
  # 6) Notify phone (News + Legal + Personnel apps)
  emit('perception_event', {ev, delta, case})            // §7 UI hooks
```

### 5.3 `Long_Term_Effects` → persistent `worldFlags` (authored extremes)

The most severe long-term cells become hard world flags (these gate later content, per Bible §9):

| Perception_Event | Long_Term_Effect (verbatim) | worldFlag |
|---|---|---|
| Nuclear_Facility_Damage | `Global LSW operations banned` | `GLOBAL_LSW_BAN` |
| Mass_Destruction | `LSW abilities globally regulated or banned` | `GLOBAL_LSW_REGULATED` |
| War_Crimes_Accusation | `LSW operations classified as weapons of mass destruction` | `LSW_CLASSIFIED_WMD` |
| Hospital_Damage | `Medical community refuses LSW cooperation` | `MEDICAL_NONCOOP` (blocks hospital healing in country) |
| Military_Base_Damage | `Military cooperation with LSWs terminated` | `MILITARY_NONCOOP` |
| Government_Building_Damage | `Government cooperation with LSWs ends` | `GOV_NONCOOP` |
| Public_Identity_Exposed | `Must live as full-time LSW; no civilian life possible` | `IDENTITY_BLOWN` (disables Personal-Life activity) |
| Saved_Lives_Civilian / Prevented_Disaster / Heroic_Recognition | `Hero status…` / `government cooperation` / `special privileges` | `HERO_STATUS` (+CS recruitment, gov cooperation) |

`MEDICAL_NONCOOP`, `MILITARY_NONCOOP`, `GOV_NONCOOP` are **per-country** flags (block the respective Daily Activity / service in that nation); the `GLOBAL_*` flags are world-wide. Flag→service wiring is the integration point in §8.

### 5.4 Consequence-only events (no reputation delta)

The `Lawsuit_*`, `Insurance_Claim_*`, `Media_Spin_*`, `Government_Cover_Up`, `International_Treaty_Violation`, `War_Crimes_Accusation` rows are **invoked as follow-ups** (often auto-spawned by a primary event's `Legal_Action_Type`), not as primary perception triggers. They write Legal/Insurance/Political state only.

> **RULING (R-17.6).** `Media_Spin_Positive` and `Government_Cover_Up` are **player-purchasable counter-moves** (laptop actions) that *cost* the authored `Legal_Cost_Range` (`$100K-$1M` and `$1M-$10M` respectively) and **suppress** the News-app printing of a negative event (cover-up) or **add** reputation via the Media-control combined-effect (Bible §8 Media control). Spend money → soften the headline. This is the diegetic spin-control loop; numbers are 100% authored.

### 5.5 Fame delta from scale (authored crosswalk)

`Public_Perception.csv` authors *reputation* deltas but not a separate fame number. Reuse `fameSystem.ts` magnitudes by mapping `Public_Impact_Scale` → that file's `magnitude`, so the existing `FAME_CHANGES` table supplies all fame numbers (no new numbers):

| scale | fameSystem magnitude | fameChange (heroic/villain) |
|---|---|---|
| Personal / Local | minor | +2 / +1 |
| Regional | moderate | +5 / +3 |
| National | major | +10 / +8 |
| International / Faction / Military / Diplomatic | major | +10 / +8 |
| Global / Reality-Scale | legendary | +25 / +20 |

Positive-reputation events use the `heroic_act` row; negative use `villain_act`; both ×1.5 if `wasPublic` (existing `fameSystem.ts` rule).

---

## 6. How it consumes the SPINE (country / city / personality)

This is the heart: the **same delta does wildly different things depending on where you are**, using the World Bible country stats and `Country_Attribute_Effects.csv`.

### 6.1 Inputs pulled from the spine (per event)

Per the standing country's `SuperHero Tactics World Bible - Country.csv` row + the city's row:

- `MediaFreedom` (20–90) — how loud/sticky the press reaction is.
- `LSWRegulations` ∈ {Banned, Regulated, Legal} — base legality.
- `Vigilantism` ∈ {Banned, Regulated, Legal} — independent-action legality.
- `GovernmentPreception` (democracy scale 20–90) — court fairness vs. show-trial.
- `LawEnforcement` (0–90) + `GovermentCorruption` (0–90) — chance a case is filed vs. buried.
- `IntelligenceServices` + `MilitaryServices` + `Science` — feed the Superhuman-Affairs combined effect (Bible §8).
- City `HVT`, `CrimeIndex`, `SafetyIndex`, `CityType1-4` — local stakes & whether collateral even draws a suit.
- Faction relation (Home/Ally/Hostile/Neutral) from the relations matrix.

### 6.2 Jurisdiction multipliers (formulas, all factors cited)

**(a) Reputation severity multiplier** `jurisdictionRepMultiplier`:
```
mediaMult   = 0.5 + (MediaFreedom / 90)          // free press amplifies; 20→0.72, 90→1.5  [Country.csv MediaFreedom 20–90]
relationMult= { Home:0.5, Ally:0.75, Neutral:1.0, Hostile:1.5 }[factionRelation]
                                                  // Bible §9 "allied minimal; hostile escalated"
sevMult     = mediaMult × relationMult           // applied to NEGATIVE deltas
posMult     = (eventIsPositive) ? mediaMult : 1.0 // free press also amplifies HEROISM
```
`mediaMult` endpoints are anchored to the authored `Country_Attribute_Effects.csv` MediaFreedom rule: *Free media = +2CS media investigation / −2CS cover-ups; Controlled = +2CS propaganda / −2CS investigation* — i.e. high MediaFreedom = louder consequences. The 0.5–1.5 span equals a **±2CS** band, matching the Bible's Column-Shift currency (§3.3).

**(b) Legal jurisdiction multiplier** `jurisdictionMultiplier` (scales `amountOwed`, §4.2):
```
lawfileChance = clamp( (LawEnforcement - GovermentCorruption + 50) / 100, 0.05, 0.98 )
                                                  // high law & low corruption => case very likely filed
                                                  // [Country.csv LawEnforcement, GovermentCorruption]
relationMult  = same Home/Ally/Hostile table as (a)
legalityMult  = LSWRegulations=='Banned' ? 1.5    // -3CS public ops if Banned [Country_Attribute_Effects.csv]
              : LSWRegulations=='Legal'  ? 0.6    // +2CS public ops, public support possible
              : 1.0                               // Regulated
amountOwed   *= relationMult × legalityMult
caseFiled?    = random() < lawfileChance          // Failed/Lawless states may bury it entirely
```
The `legalityMult` 1.5 / 0.6 anchors to the authored `Country_Attribute_Effects.csv` LSWRegulations rows (Banned −3CS, Legal +2CS). The **"Lawless"** combo (`High Corruption + High Crime` → "no legal consequences", authored in `Country_Attribute_Effects.csv`) forces `caseFiled=false` when `GovermentCorruption ≥ 70 AND city.CrimeIndex ≥ 70`. The **"Failed State"** combo (`Low Government + High Corruption` → "only force/bribery") likewise sets `lawfileChance` to its 0.05 floor.

**(c) City filter.** A case is only spawned if there was a *complainant*: collateral on tiles with `HVT=1` always files (high-value target); ordinary property on a city with `CrimeIndex ≥ 70` (lawless) may not (per the Lawless combo). City `SafetyIndex` raises civilian-presence (more potential casualties to count). City `CityType` redirects the event id — collateral in a `Military` city escalates a generic Building_Destruction to `Military_Base_Damage`; in an `Educational` city to `School_Damage`; in a `Political` city to `Government_Building_Damage`. (CityTypes per World Bible Cities; mapping per Bible §6.2.)

### 6.3 Political fallout & relations matrix

`Political_Fallout` and `International_Relations_Effect` (verbatim CSV columns) are routed to existing systems:
- `Political_Fallout` → **faction standing** in `factionSystem.ts` for the host nation's faction. Mapping: any cell containing `approval/boost/gain/support` → +standing; `investigation/hearing/outrage/crisis/review/tribunal` → −standing, scaled by `relationMult`. Standing buckets already exist (`STANDING_THRESHOLDS`: Hero 75+, Respected 50+, … Terrorist ≤−75).
- `International_Relations_Effect` → **country×country relations matrix** (Bible §6.4, World Bible "Countries Relations"). Cells like `Enemy nations call for war crimes tribunal` / `NATO/allied nation security review` / `International praise` push the host nation's relation toward allies/enemies. Threshold escalations (`International sanctions possible`, `United Nations emergency session`) fire **`Dynamic_Political_Events`** entries (Bible §6.5).

### 6.4 Superhuman-Affairs coupling (reuse existing combined-effect)

`combinedEffects.ts → calculateSuperhumanAffairs(country)` already derives `publicOpinionOfSupers` (−100..+100), `registrationRequired/Enforcement`, from `LSWRegulations + Intelligence + Military + Science` (Bible §8 "LSW affairs"). **This spec reads it, doesn't duplicate it:** a country's baseline `regionReputation[country]` is **seeded** at campaign start to `calculateSuperhumanAffairs(country).publicOpinionOfSupers` instead of 0, so a hero starts beloved in LSW-Haven nations and hated in Banned nations. `publicOpinionVolatility` (already `100 − pressFreedom×0.5` in code) multiplies the applied reputation delta: low-freedom nations swing faster (easy to sway), exactly as authored.

> **RULING (R-17.4) — "Varies" rows.** `Building_Destruction` and `Faction_Betrayal` use `Varies by …`. Resolve `Building_Destruction` from the **city `CityType` + `HVT`**: HVT building → escalate to the matching specific event (Hospital/School/Gov/Military) and use its delta; ordinary → −2 (mirror Property_Damage_Major). Resolve `Faction_Betrayal` from the betrayed faction's current `standing`: `repDelta = −(standing/2)` (betraying an ally hurts more than betraying an enemy). Range rows (`+5 to +20`, `+10 to +30`) resolve to the **midpoint scaled by rescue count**: `min + (max−min)×clamp(rescues/10,0,1)`.

> **RULING (R-17.5) — Heroic_Recognition / Saved_Lives upper band.** `Heroic_Recognition` Reputation_Change is descriptive (`Global recognition…`); treat as **+20 Global** (= top of the authored `Saved_Lives_Civilian` +5..+20 band, the nearest authored anchor). Flagged as a ruling, not invented out of thin air.

> **RULING (R-17.7) — Alien_Technology_Recovery legal cell.** Its `Legal_Cost_Range` is `Intellectual property battles` (no number) → spawns a `civil_federal` **patent dispute** case whose `amountOwed` rolls the `Lawsuit_Constitutional` band fallback ($10M–$100M) — nearest authored "high-stakes IP/federal" range — OR resolves as **+research bonus** if `Science ≥ 70` (innovation hub). OWNER may prefer pure-positive; see OF-17.B.

> **RULING (R-17.8) — legal-heat increments.** `legalHeat` per tier (no source; tune in one place): civil_local +5, civil_federal +12, criminal +25, constitutional +30, international +35, tribunal +50. At `legalHeat[country] ≥ 60` the host nation issues an **arrest/expel order** (squad in that country becomes "wanted" — combat-trigger or forced exfil); at `≥ 90` → international warrant (all Ally/Neutral nations raise border control). Decays −1/game-week if no new case.

---

## 7. UI/UX hooks (phone / world-map / laptop / combat overlay)

The phone is the delivery surface (Bible: "the PHONE & WORLD-MAP are how it reaches the player"). Time pauses when the laptop/phone is open (Bible §7).

### 7.1 Combat overlay — "Collateral / Heat" HUD
- Live **Collateral counter** top-right: running `$` estimate (sum of would-be `amountOwed` from tiles destroyed + civilians endangered), color-ramped green→amber→red. Updates as the player destroys cover/buildings (each destructible tile carries its `Public_Perception` event id + cost band).
- **Civilian glyphs** (symbolic, per locked combat style): a small bystander glyph; killing one flips a red skull and pre-stages a `Civilian_Casualties_*` event. A "civilians clear" pip when none remain in blast radius.
- On combat end: a **"News will report…" preview card** showing the worst event id that will fire, so the player feels the bill before it lands.

### 7.2 Phone — News app
- Prints `Media_Coverage_Type` verbatim as the headline tone (`Local News Positive` → green banner; `Global News Condemnation` → red full-bleed). Body uses the event's flavor (`Financial_Consequence`, `Political_Fallout`).
- A **"Spin"** button on negative stories (cost = `Media_Spin_Positive` / `Government_Cover_Up` band, R-17.6).

### 7.3 Phone — Legal app (NEW)
- **Open Cases** list: each `LegalCase` as a card — court tier badge (colored rounded square), `amountOwed`, `resolveByDay` countdown, criminal/civil tag, jurisdiction flag.
- Actions per case: **Settle now** (pay min of range, drops case, −small reputation hit avoided), **Fight in court** (rolls Universal Table using team's best INT/legal skill vs jurisdiction fairness `GovernmentPreception`; win → dismissed, lose → pay max), **Ignore** (heat keeps rising → arrest at heatThreshold).
- **Insurance status** strip per country (improve→collapse enum, §4.5) and **Treasury Liability** total.

### 7.4 Phone — Personnel app
- Recruitment pool size shows the reputation modifier (HERO_STATUS = "+recruits"; villain rep / `*_NONCOOP` flags = "recruiting blocked / hard").
- Per-hero **Heat tag** if that hero is `IDENTITY_BLOWN` or personally wanted.

### 7.5 World-map
- Each country tints by `regionReputation` (beloved green → hated red) and shows a small **gavel icon** if `legalHeat ≥ 60` (wanted) — deploying a squad there warns of arrest.
- `worldFlags` banners: a struck-through LSW icon over countries under `GLOBAL_LSW_BAN`.

### 7.6 Laptop — Reputation dashboard
- Global Fame band (reuse `getFameDisplay()` icon/color from `fameSystem.ts`).
- Per-country reputation + faction standing (reuse `factionSystem.ts` `STANDING_THRESHOLDS`).
- Timeline of `lastMajorEvent` history (already stored in `fameSystem.ts`).

---

## 8. Integration points (reads / writes)

| Reads from | What |
|---|---|
| `combat collateral tracker` (§7.1) | destroyed-tile event ids, civilian kills, rescues, `collateralCount[perUnit]` |
| `SuperHero Tactics World Bible - Country.csv` | MediaFreedom, LSWRegulations, Vigilantism, LawEnforcement, GovermentCorruption, GovernmentPreception, Intelligence/Military/Science |
| `… - Cities.csv` | HVT, CrimeIndex, SafetyIndex, CityType1-4, PopulationRating |
| `combinedEffects.ts::calculateSuperhumanAffairs` | seed `regionReputation`, `publicOpinionVolatility` multiplier |
| `factionSystem.ts` | host-nation faction + `STANDING_THRESHOLDS` |
| relations matrix (World Bible) | for `International_Relations_Effect` routing |
| `PERSONALITY TARGET SELECTION` csv | villain attention target code (§3) |

| Writes to | What |
|---|---|
| `fameSystem.ts` (`applyFameEvent`) | fame & reputation deltas (global + regional) |
| `factionSystem.ts` | political-fallout standing changes (§6.3) |
| `economySystem.ts` / treasury | `amountOwed` debits, `positive` rewards, insurance offsets |
| `Dynamic_Political_Events` / `World_State_Tracking_System` | sanctions / UN session / tribunal escalations |
| Daily-Activity services | `MEDICAL_NONCOOP` blocks Hospital, `MILITARY_NONCOOP` blocks military gear, `GOV_NONCOOP` blocks cooperation, `IDENTITY_BLOWN` disables Personal-Life |
| Mission generator | reputation/heat gate which missions appear (Bible §8 "combined-effects consumed") |
| News app + EventBus | `emit('perception_event', …)` |

**Event-bus contract:** all writes go through the existing `eventBus.ts` so News/Legal/Personnel re-render reactively (matches existing architecture).

---

## 9. Edge cases & failure modes

1. **Reputation floor/ceiling clamps** to [−100,+100], fame to [0,100] (existing `fameSystem.ts` `Math.max/min`). `Mass_Destruction` −100 hard-bottoms reputation in one event — intended (Bible §9). Region values clamp independently.
2. **Double-counting:** a single op that destroys a hospital AND kills civilians fires **two** events (Hospital_Damage + Civilian_Casualties_*). Each opens its own case. Dedup only identical (event id × tile) pairs within one combat resolution.
3. **No complainant / Lawless:** if `caseFiled=false` (Lawless/Failed-State combo, §6.2c) the reputation delta still applies but **no legal case or insurance change** — you can be a monster in a failed state cheaply (intended emergent play).
4. **Banned-LSW nations:** every public op there is itself a `Vigilantism=Banned` offense → minimum `legalHeat += civil/criminal` even with zero collateral, per `Country_Attribute_Effects.csv` "Banned: criminal charges if caught."
5. **Positive event in hostile nation:** `posMult` still amplifies via free press but `relationMult` Hostile does **not** reduce a *reward* (you can be a hero abroad); standing gain is dampened, not the reward.
6. **Treasury can't pay:** if `treasuryLiability` exceeds funds, cases auto-escalate status `filed→lost` at `resolveByDay`, converting to `legalHeat` and possible asset seizure (economy system's bankruptcy path).
7. **Identity exposed twice:** `IDENTITY_BLOWN` is idempotent (flag already set → no re-fire).
8. **Time-travel rewind (save load):** rewinding (Bible §11) **must restore** the full `PerceptionState` snapshot including `openCases`/`worldFlags` — reputation is part of the diegetic timeline. A rewind that "un-happens" a massacre also dismisses its cases (this is the *point* of the time-traveler save).
9. **Range with zero rescues:** `Saved_Lives_Civilian` with `rescues=0` → midpoint formula yields the floor (+5), never negative.
10. **CSV parse failure / unknown event id:** resolver throws in dev, no-ops + logs in prod (never silently corrupts the meters). Loader validates all 34 rows present at boot.

---

## 10. RULING summary (collected)

- **R-17.1** Three stored meters, one CSV-keyed event resolver.
- **R-17.2** Villain-attack frequency reuses `FAME_THRESHOLDS.recognitionChance`.
- **R-17.3** Court-tier durations (60–900 game days) — RULING numbers.
- **R-17.4** "Varies" rows resolved from city HVT/CityType (buildings) and betrayed-faction standing; range rows = floor + span×(rescues/10).
- **R-17.5** Heroic_Recognition = +20 Global (top of authored Saved_Lives band).
- **R-17.6** Media_Spin_Positive / Government_Cover_Up are paid player counter-moves at their authored cost bands.
- **R-17.7** Alien_Technology_Recovery → patent case (fallback $10M–$100M) or research bonus if Science ≥ 70.
- **R-17.8** Legal-heat increments per tier + arrest(60)/warrant(90) thresholds — RULING numbers.

## 11. OWNER-FORK summary

- **OF-17.A** Insurance premium economy: binary coverage (ship default) vs. graded recurring premiums. CSV only authors direction + the single +25% figure.
- **OF-17.B** Alien_Technology_Recovery as pure-positive (research/fame only) vs. the IP-lawsuit reading (R-17.7).
- **OF-17.C** Whether `GLOBAL_LSW_BAN` (Nuclear_Facility_Damage / Mass_Destruction) is a soft global −CS to all public ops or a hard lockout of public operations worldwide. Bible §9 says "globally banned"; severity of enforcement is a campaign-tuning product call.
- **OF-17.D** Multiplayer (Bible: other-dimension stub): whether one player's `GLOBAL_*` world flags bleed into a shared world. Design single-player so `worldFlags` is per-save; MP merge policy deferred.

## 12. Open questions

1. **Reputation decay vs. legal persistence:** fame decays (existing `fameSystem.ts` weekly decay) but should *reputation* decay toward the country's `publicOpinionOfSupers` baseline over time, or stay sticky? (Leaning: drift 1/week toward baseline; needs owner sign-off.)
2. **Collateral attribution in AI-vs-AI / multi-faction combat:** when the player's ally faction causes collateral, does the player's reputation eat it? (Suggest: only player-unit-caused tiles count; ally collateral hits the ally faction's standing.)
3. **Per-hero vs. team reputation:** `fameSystem.ts` is team-global today; do we need per-hero fame for the "topple the beloved icon" villain code (§3)? Minimum viable: per-hero fame field, team reputation shared.
4. **Currency of `amountOwed` vs. mission rewards scale:** are CSV USD figures ($5K–$1T) on the same scale as `Player_Scaling` budgets ($5–15k street … $2M+ cosmic)? If so, a single Nuclear_Facility case ($100M–$10B) is unpayable by design — confirm that's the intended "you broke the world" wall, not a balance bug.
5. **Cloning interaction:** `Team_Member_Death` reputation hit (−15 Faction) vs. country cloning law — does a successful clone (Bible §8) refund the reputation/PR hit, or is the *death* still news? (Suggest: clone refunds roster loss but not the public memorial reputation event.)
