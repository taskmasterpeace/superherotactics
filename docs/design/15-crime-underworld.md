# 15 — Crime / Underworld (Organization Lifecycle, Activities, Crime Index → Missions / News)

> **Status:** Build-ready spec. The core of this system **already exists in code** (see Integration Points). This document is the canonical reference that (a) freezes the numbers already shipped, tracing each to its source table, (b) **resolves the two parallel implementations** into one, and (c) specifies the four wiring gaps that turn the existing background sim into a system the player *plays with*, not just reads about.
>
> **Master sources:** `SHT_MECHANICS_BIBLE.md` §6.4 (factions/underworld), §6.5 (living world), §8 (Combined-Effects: *Organized Crime*, *Black Market*, *Safe Houses*), §2 (Spine Principle), §13 ruling #9 (combined-effects must be **consumed**).
> **Primary data:** `SuperHero Tactics World Bible - Cities.csv` (`CrimeIndex`, `SafetyIndex`, `PopulationRating`, `CityType1-4`), `SuperHero Tactics World Bible - Country.csv` (`governmentCorruption`, `lawEnforcement`, `lawEnforcementBudget`, `intelligenceServices`, `cyberCapabilities`, `gdpPerCapita`, `militaryServices`/`militaryBudget`, `mediaFreedom`, `governmentPerception`, `terrorismActivity`), `Dynamic_Political_Events.csv`, `Combat Compendium REAL - 🎯PERSONALITY TARGET SELECTION🎯.csv`.
> **Built code that owns these numbers today:** `MVP/src/data/criminalOrganization.ts`, `crimeActivities.ts`, `criminalSimulation.ts`, `criminalNewsBridge.ts`, `criminalInvestigationBridge.ts`, `MVP/src/stores/underworldStore.ts`, plus the wiring in `MVP/src/stores/enhancedGameStore.ts` (`initializeUnderworld`, `runUnderworldSimulation`, week-boundary tick at ~L2813), `combinedEffects.ts` (`calculateOrganizedCrime`), and `worldSystems/underworldSystem.ts` (black-market/smuggler contacts).

---

## 1. Overview & Player Fantasy

**The fantasy:** The underworld is the world breathing crime at you. Every nation you stand in has its *own* ecosystem of criminal organizations that **form, operate, fight, get hunted, and die without you** (Pillar #4, "the world lives without you"). You don't micromanage gangs — you *read the city*. The phone buzzes with a **Police Blotter** headline, the world map shows a city pulsing red, a **shadow network** quietly accretes power and ticks the doom clock toward the invasion. You choose: investigate the ring, raid the cartel, ignore it (and let it metastasize), or — if your hero's morality permits — **pay protection / hire muscle / buy black-market gear** from the very orgs you could be fighting.

**Why it exists (3 jobs):**
1. **Be the steady-state content generator** for the strategic layer: an evergreen stream of news, investigations, and combat missions parameterized by *where the player is* (the spine), so there is always something to do between authored story beats.
2. **Make the spine legible.** A corrupt, low-law, poor city *feels* different from a clean authoritarian one because the crime ecosystem visibly behaves differently (Somalia churns with cartels; China crushes street gangs). This is §8 ruling #9 ("combined-effects must be consumed") made *visible*.
3. **Feed the endgame.** `shadow_network`-type orgs are the only org type that scale across the whole map; their count drives the **doom clock** (already wired, `enhancedGameStore.advanceDoomClock`, ~L3576).

**The verb loop (player-facing):**
```
World ticks (real-time, pausable) → weekly crime sim runs in the player's country
   → orgs commit ACTIVITIES → generate HEAT + PROFIT + EVENTS
       → newsworthy events → PHONE/NEWS articles (Police Blotter etc.)
       → law-enforcement-grade events → INVESTIGATION leads (inbox)
       → high-heat / extreme activities → COMBAT MISSIONS (raid the HQ)
   → player acts (investigate / raid / ignore / collude)
       → org state machine reacts (declining / eliminated / recovers)
   → crimeIndex of the city drifts toward the local ecosystem's pressure
```

---

## 2. Data Schema (fields & types)

All interfaces below are **already defined** in `criminalOrganization.ts` / `crimeActivities.ts` / `criminalSimulation.ts`. Reproduced here as the frozen contract. New fields introduced by this spec are marked **`NEW`** with a RULING tag.

### 2.1 `CriminalOrganization` (`criminalOrganization.ts` L217)
| Field | Type | Range / Notes | Source |
|---|---|---|---|
| `id` | `string` | `org_<n>_<ts>` | code |
| `name` | `string` | generated (§7 name tables) | code |
| `type` | `OrgType` | `street_gang \| syndicate \| cartel \| shadow_network` | `ORG_TYPE_CONFIG` |
| `state` | `OrgState` | `dormant \| forming \| operating \| conflict \| declining \| eliminated` | `ORG_STATE_TRANSITIONS` |
| `stateEnteredAt` | `number` | game **week** index | code |
| `headquarters` | `string` | City name (FK → `cities`) | code |
| `headquartersCountry` | `string` | ISO code (FK → `allCountries`) | code |
| `territories` | `string[]` | City names | code |
| `personnel` | `number` | 0–100 (scaled member count) | code |
| `capital` | `number` | 0–100 (liquid funds, **$k** when surfaced; see §3.6) | code |
| `heat` | `number` | 0–100 (law-enforcement attention; **org heat, distinct from player heat** — see §8.1) | `HEAT_LEVELS` |
| `reputation` | `number` | 0–100 (street cred) | code |
| `leader` | `OrgLeader` | see 2.2 | code |
| `specialties` | `CrimeSpecialty[]` | max 3 | `CRIME_SPECIALTY_CONFIG` |
| `activeOperations` | `number` | counter | code |
| `allies` / `enemies` | `string[]` | org IDs | code |
| `formedAt` | `number` | game week | code |
| `arrestsMade`, `territoryLost`, `totalProfit`, `totalHeatGenerated` | `number` | lifetime stats | code |
| `crimeIndexContribution` **`NEW`** | `number` | 0–40, this org's current push on its HQ city's `CrimeIndex` (§6.2) | RULING-CI |

### 2.2 `OrgLeader` (`criminalOrganization.ts` L204)
| Field | Type | Notes |
|---|---|---|
| `id`, `name` | `string` | |
| `motivation` | `OrgMotivation` | `selfless \| neutral \| selfish` (derived from harm-avoidance, §3.3) |
| `calling` | `CallingId` | from `callingSystem.ts` (selfless/neutral/selfish pools, L134-146) |
| `imprisoned` | `boolean` | true → fast-tracks `declining → eliminated` |
| `prisonSentenceWeeks?` | `number` | |
| `loyalty`, `competence` | `number` | 0–100 |
| `personalityType` **`NEW`** | `1..20` | maps to `PERSONALITY TARGET SELECTION` for combat AI when the org is fought (§5.5, §8.4) |

### 2.3 `ActivityConfig` (`crimeActivities.ts` L40) & `ActivityResult` (L267)
16 activity types, each with: `specialty`, `baseHeat`, `baseProfit`, `baseDuration` (days), `personnelRequired`, `capitalRequired`, `riskLevel` (`low\|medium\|high\|extreme`), `canFail`, `failureConsequences[]`. Full number table in §3.4.

### 2.4 `SimulationEvent` (`criminalSimulation.ts` L43) & `SimulationResult` (L56)
Event: `{ id, week, type: 'crime'|'arrest'|'conflict'|'news'|'state_change'|'spawn'|'eliminated', orgId, orgName, city, description, details, newsworthy, headline? }`. Result aggregates weekly totals.

### 2.5 Static combined-effects view — `OrganizedCrimeSystem` (`combinedEffects.ts` L479)
The **per-country derived snapshot** (not the live sim). Fields: `crimeOrganization` (5 tiers), `crimePower` 0–100, six `*Trafficking`/`extortion`/`kidnapping` booleans, `canPayProtection`, `protectionCost`, `canHireMusclE`, `muscleQuality` (4 tiers), `randomExtortionChance`, `territoryDisputes`, `governmentCollusion`, `policeOnPayroll`. Number formulas in §3.5.

> ⚖️ **RULING-DUP (resolve the two implementations):** Two crime systems exist. **(A)** the **live org-lifecycle sim** (`criminalOrganization.ts` + `criminalSimulation.ts`) — stateful, per-city, weekly. **(B)** the **static derivation** (`combinedEffects.ts::calculateOrganizedCrime`) — a stateless per-country snapshot used for *pricing & access* (protection, muscle, extortion-of-player). **Keep both, with a strict contract:** (A) is the **simulation truth** (who exists, what they do, missions/news). (B) is the **spine-pricing oracle** consumed by shops/contacts (§8.3) and is **recomputed, never persisted**. (A)'s initial org count and tiering **must be seeded from (B)'s `crimePower`** so they never disagree (§3.1). `worldSystems/underworldSystem.ts` (black-market/smugglers) is the **commerce surface** of (B) and stays as-is. This kills the contradiction where two files independently decide "how much crime is here."

---

## 3. Exact Numbers, Tables & Formulas (each cited)

> Convention: a citation `[file:Lnn]` points at the built source that owns the number; `[Bible §x]` points at a design ruling; `[Cities.csv]` / `[Country.csv]` points at raw data.

### 3.1 Org type config — `ORG_TYPE_CONFIG` [criminalOrganization.ts:L16]
| Type | minCities | maxCities | visibility | corruptionAccess | growthRate |
|---|---|---|---|---|---|
| street_gang | 1 | 1 | 80 | 20 | 80 |
| syndicate | 2 | 5 | 50 | 50 | 50 |
| cartel | 5 | 15 | 30 | 80 | 30 |
| shadow_network | 15 | 100 | 10 | 60 | 15 |

`visibility` = ease of detection (higher → news/investigations surface it faster). `corruptionAccess` = bribe ceiling. `shadow_network` is the doom-clock driver [enhancedGameStore advanceDoomClock].

### 3.2 State machine — `ORG_STATE_TRANSITIONS` [criminalOrganization.ts:L62]
| State | canTransitionTo | minDurationWeeks |
|---|---|---|
| dormant | forming | 0 |
| forming | operating, eliminated | 2 |
| operating | conflict, declining | 4 |
| conflict | operating, declining | 1 |
| declining | operating, eliminated | 2 |
| eliminated | — | 0 |

**Transition triggers** [criminalSimulation.ts:L161-327]:
- `forming → operating`: `personnel ≥ 15 AND capital ≥ 20 AND weeksInState ≥ 2`.
- `forming → eliminated`: `personnel < 5 OR heat > 70`.
- `operating → conflict`: `heat > 50 OR (enemies.length>0 AND rand>0.7)`.
- `conflict → operating`: survives if `rand*100 < getCrimeSuccessRate(org,country)` (§3.7).
- `conflict → declining`: else.
- `declining → eliminated`: `personnel<10 OR capital<10 OR leader.imprisoned OR rand*100 < eliminationChance`, where `eliminationChance = (personnel<10?30:0)+(capital<10?30:0)+(leader.imprisoned?50:0)+(weeksDeclining>4?20:0)`.
- `declining → operating` (recovery): `heat<30 AND personnel>20 AND capital>30`.

### 3.3 Motivation — `MOTIVATION_CONFIG` [criminalOrganization.ts:L103]; derived from harm-avoidance [L480]
| Motivation | harmAvoidance range | heatMultiplier | targetsCivilians |
|---|---|---|---|
| selfless | 7–10 | 0.7 | false |
| neutral | 4–6 | 1.0 | false (only when necessary) |
| selfish | 1–3 | 1.5 | true |

`getMotivationFromHarmAvoidance(n)`: `≥7 selfless`, `≥4 neutral`, else `selfish`. harmAvoidance rolled `1 + floor(rand*10)` [L658].

### 3.4 Crime specialties & activities

**`CRIME_SPECIALTY_CONFIG`** [criminalOrganization.ts:L167] — 15 specialties: `heatGeneration / profitPotential / requiredCityTypes`:

| Specialty | heatGen | profit | requiredCityTypes |
|---|---|---|---|
| drugs | 15 | 80 | — |
| arms | 25 | 70 | Industrial, Military |
| human_trafficking | 40 | 90 | Seaport |
| smuggling | 10 | 50 | Seaport, Mining |
| extortion | 20 | 60 | Industrial, Company |
| theft | 8 | 40 | — |
| fraud | 5 | 65 | Company, Political |
| cyber_crime | 8 | 75 | Company |
| gambling | 5 | 55 | Resort |
| prostitution | 10 | 45 | Resort |
| piracy | 30 | 60 | Seaport |
| kidnapping | 35 | 85 | — |
| assassination | 50 | 95 | — |
| corruption | 15 | 70 | Political |
| terrorism | 100 | 20 | — |

**`CITY_CRIME_MAP`** (city type → specialties offered) [criminalOrganization.ts:L191]: Seaport→[smuggling, piracy, human_trafficking]; Industrial→[theft, extortion, arms]; Political→[corruption, fraud, assassination]; Company→[fraud, cyber_crime, extortion]; Resort→[drugs, gambling, prostitution]; Mining→[smuggling, theft, extortion]; Military→[arms, smuggling, corruption]; Educational→[drugs, fraud, cyber_crime].

> ⚖️ **RULING-CITYMAP-GAP:** `CITY_CRIME_MAP` covers only **8 of 10** city types from `City_Type_Effects` (`Temple`, `Village` are absent). **Add:** `Temple → []` (sanctuary: orgs default to `theft, extortion` per the L649 fallback — *correct*, low-crime by design), `Village → [theft, smuggling]` (small-scale, matches low rural `CrimeIndex`). No invented numbers — this is a data-completeness fix consistent with `City_Type_Effects`.

**`ACTIVITY_CONFIG`** [crimeActivities.ts:L54] — 16 activities. `heat / profit / duration(d) / personnelReq / capitalReq / risk`:

| Activity | specialty | heat | profit | dur | pers | cap | risk |
|---|---|---|---|---|---|---|---|
| drug_deal | drugs | 5 | 15 | 1 | 5 | 10 | medium |
| armed_robbery | theft | 25 | 40 | 1 | 8 | 5 | high |
| burglary | theft | 8 | 20 | 1 | 3 | 2 | low |
| extortion_collection | extortion | 10 | 25 | 1 | 4 | 0 | medium |
| smuggling_run | smuggling | 12 | 35 | 3 | 6 | 15 | medium |
| cyber_heist | cyber_crime | 15 | 60 | 7 | 3 | 20 | medium |
| assassination_contract | assassination | 50 | 80 | 7 | 2 | 10 | extreme |
| kidnapping_operation | kidnapping | 40 | 70 | 14 | 6 | 15 | high |
| gambling_operation | gambling | 5 | 20 | 7 | 4 | 25 | low |
| protection_racket | extortion | 15 | 30 | 7 | 8 | 5 | medium |
| arms_deal | arms | 30 | 50 | 3 | 5 | 40 | high |
| human_trafficking_run | human_trafficking | 45 | 75 | 7 | 8 | 30 | extreme |
| corruption_payoff | corruption | **−10** | **−20** | 1 | 1 | 30 | medium |
| territory_expansion | — | 20 | 0 | 14 | 15 | 20 | high |
| recruit_members | — | 3 | −5 | 7 | 3 | 10 | low |
| lay_low | — | −10 | −5 | 7 | 0 | 0 | low |

### 3.5 Static per-country pricing oracle — `calculateOrganizedCrime` [combinedEffects.ts:L508]
- `crimePower = max(0, corruption*0.6 + (100−lawEnforcement)*0.4)` → 0–100. **[Bible §8 "Organized Crime = Corruption + (100−Law)"]**
- `crimeOrganization` tier: `≥80 syndicate / ≥60 cartel / ≥40 organized / ≥20 local_crews / else street_gangs`.
- Active crime types: drugTrafficking `cp≥20`; humanTrafficking `cp≥40 AND law≤50`; armsTrafficking `cp≥30 AND militaryBudget≥30`; cyberCrime `cp≥30 AND cyber≥40`; extortion `cp≥25`; kidnapping `cp≥35`.
- `canPayProtection = cp≥30`; `protectionCost = round(500 + (cp*20)*(gdpPerCapita/50))` (**weekly $**).
- `canHireMuscle = cp≥20`; `muscleQuality`: `≥70 elite / ≥50 professionals / ≥30 enforcers / else thugs`.
- `randomExtortionChance = min(30, cp*0.3)` (% chance the *player* is shaken down).
- `territoryDisputes = cp≥50 AND law≤60`.
- `governmentCollusion = corruption≥70`; `policeOnPayroll = corruption≥50 AND law≤60`.

### 3.6 Profit & loss math [crimeActivities.ts:L327-371]
- `heatGenerated = baseHeat * motivation.heatMultiplier`; if `risk≠low`, `*= 1 + patrolDensity/200`; if failed, `*=1.5`. (corruption_payoff success → fixed `−15`.)
- `profitGenerated = (success ? baseProfit : floor(baseProfit*0.2)) * (1 + gdpPerCapita/200)`. **(richer country → richer loot)**
- On failure, `failureConsequences` each apply with `rand>0.5`; `arrests` → `personnelLost = floor(personnelReq*(0.2..0.5))`; seizures → `capitalLost = floor(capitalReq*(0.5..1.0))`.
- Applied [criminalSimulation.ts:L331]: `heat = clamp(heat + heatGen, 0,100)`, `capital = max(0, capital + profit − capitalLost)`, `reputation ±2/−5`.

### 3.7 Success, heat, bribery, decay [criminalOrganization.ts:L368-404]
- `getCrimeSuccessRate = clamp(50 + corruption*0.3 − law*0.25 − intel*0.15 − heat*0.3, 10, 90)`.
- **Per-activity** success [crimeActivities.ts:L291]: `60 − patrolDensity*0.2 − investigationQuality*0.1 (+ if high/extreme: − trackingSpeed*0.15) + corruption*0.25 + reputation*0.15 − heat*0.2 + crimeIndex*0.1`, clamped 10–95. **← `city.crimeIndex` consumed here.**
- `canBribeAuthorities`: `rand*100 < corruption*0.6 + capital*0.2 − law*0.2`.
- `calculateHeatDecay = max(1, 5 + corruption*0.1 − intel*0.05)` per week.

### 3.8 Heat response bands — `HEAT_LEVELS` [criminalOrganization.ts:L258] (org-side; distinct from player `HEAT_THRESHOLDS` in `heatSystem.ts`)
| heat | response | effects |
|---|---|---|
| 0–20 | Ignored | — |
| 21–40 | Monitored | investigations_start |
| 41–60 | Active | raids_possible, arrests_likely |
| 61–80 | Hunted | constant_raids, asset_seizure |
| 81–100 | War | military_response, shoot_on_sight |

Law-enforcement response [criminalSimulation.ts:L379]: at `heat>40`, raid chance `(heat−40)*0.5 + investigationQuality*0.3`; raid arrests `floor(personnel*(0.03..0.10))`; bribe halves arrests & `−10 heat` if affordable. Military at `heat ≥ escalationThreshold` (`80 − terrorism*0.2`): casualties `floor(personnel*(0.2..0.5))`, `capital ×0.5`.

### 3.9 Spawn & population caps [criminalSimulation.ts:L516; underworldStore.ts:L322]
- `canSpawnOrganization`: `opportunity = (100−law)*0.3 + corruption*0.3 + crimeIndex*0.2 + (100−gdpPerCapita)*0.2`; spawns if `opportunity>50 AND rand*100 < opportunity*0.1`. **← `crimeIndex` consumed.**
- `maxOrgs = floor(cities.length/5) + 3`.
- Initial seeding (`underworldStore`): `numOrgs = floor(2 + crimeLevel/25 + rand*3)` where `crimeLevel = (100−law)*0.3 + corruption*0.3 + (100−gdp)*0.2`; HQs picked from **highest-`crimeIndex` cities first**.

### 3.10 Raw data ranges (the spine inputs)
- **`Cities.csv` `CrimeIndex`**: real per-city 0–100; observed **min 2.45, max 94.12, mean 42.4** across 843 populated cities. `CrimeIndex + SafetyIndex = 100`. Distribution skews to 20–60 (peak 40–49: 187 cities; only 13 cities ≥80). Examples: Kabul 76.06, Herat 57.00, Mazar-e Sharif 78.19, Algiers 52.05, Luanda 67.52. **[Cities.csv]**
- **`Country.csv`** stat ranges (all 0–100 except `governmentPerception` enum & `terrorismActivity` string-number): e.g. Afghanistan corruption 66 / law 57 / intel 60 / gdp 36 / cyber 33; USA "Flawed Democracy" corruption 59 / law 37 / gdp 51. **[Country.csv / allCountries.ts]**

---

## 4. How It Consumes the SPINE (formulas with stat → effect)

This is the §13-ruling-#9 contract. Every number below already exists in code; this table makes the consumption auditable.

| Spine input (source) | Where consumed | Effect |
|---|---|---|
| `city.CrimeIndex` [Cities.csv] | spawn `opportunity` (×0.2); initial HQ selection (sorted desc); per-activity success (`+crimeIndex*0.1`); **init heat** `floor(crimeIndex*0.3 + rand*20)` [enhancedGameStore:L3480] | More crime → more orgs, born in the worst cities, who succeed more and start hotter. |
| `country.governmentCorruption` | crimePower (×0.6); success (`+0.3` / per-activity `+0.25`); bribe; heat decay (`+0.1`); collusion (`≥70`); police-on-payroll (`≥50`) | Corruption is the single biggest pro-crime lever. |
| `country.lawEnforcement` | crimePower (`(100−law)*0.4`); success (`−0.25`); `getPoliceResponse.investigationQuality = law*0.7`, `arrestSuccess = law*0.6 + (100−corruption)*0.3` | Strong, clean police = crime is hard & punished. |
| `country.lawEnforcementBudget` | `patrolDensity = budget*0.8`; `responseTime = max(5, 60 − budget*0.5)` | Funded police witness & arrive fast (escape harder). |
| `country.intelligenceServices` | success (`−0.15`); heat decay (`−0.05`, intel *remembers*); `trackingSpeed`, `undercoverChance`, `informantNetwork` | Spy states find HQs and infiltrate. |
| `country.cyberCapabilities` | `trackingSpeed += cyber*0.3`; `surveillanceLevel = cyber*0.7 + (100−mediaFreedom)*0.2`; gates `cyber_crime` viability | Cyber states surveil; also enable cyber-crime specialty. |
| `country.gdpPerCapita` | profit (`*(1+gdp/200)`); spawn opportunity (`(100−gdp)*0.2`, poverty breeds crime); `protectionCost` scales with gdp | Rich = richer loot but fewer orgs; protection costs more. |
| `country.militaryServices` / `militaryBudget` | military response `forceMultiplier = mil*0.8`, `collateral = 100 − mil*0.5`; gates `arms` trafficking (`militaryBudget≥30`) | Strong militaries crush War-tier orgs cleanly. |
| `country.mediaFreedom` | `GovernmentConstraints` (mass-surveil / disappear / torture gates); surveillance; news source bias | Free press = police need warrants; low freedom = orgs vanish quietly. |
| `country.governmentPerception` enum | `getGovernmentConstraints` (Authoritarian → can disappear/torture) | Authoritarian states are *better at killing crime*, worse for civil liberties. |
| `country.terrorismActivity` | military `escalationThreshold = 80 − terrorism*0.2` | Terror-prone states escalate to military faster. |
| `city.cityType1-4` [Cities.csv] | `CITY_CRIME_MAP` → specialties; `requiredCityTypes` gates | Seaports smuggle, Resorts run vice, Political cities breed corruption. |
| `city.PopulationRating` | org type at spawn: `>5 → syndicate else street_gang` | Big cities grow bigger orgs. |
| **Culture (14)** [Culture_Region_Effects] **`NEW`** | see RULING-CULTURE §11 | (deferred hook) |

---

## 5. Edge Cases & Failure Modes

| # | Case | Current behavior | Required handling |
|---|---|---|---|
| E1 | **City has no org HQ but `canSpawnOrganization` false everywhere** (clean country) | No spawns; ecosystem can go empty. | **Working as intended.** Norway/Japan *should* be near-crimeless. UI must show "No significant organized crime" rather than an empty error (§6.2). |
| E2 | **`maxOrgs` reached** | `maybeSpawnOrganization` returns early. | OK. But initial seeding (`enhancedGameStore.initializeUnderworld`) can exceed `maxOrgs` (10 cities × 1-2). **RULING-CAP:** clamp initial seed to `maxOrgs` to avoid an immediate over-cap state. |
| E3 | **Org city not found** (`cities.find(name)` miss) | `continue` (org skipped silently). | OK but logs nothing. Add a dev-warn; FK should never miss after dataset unification ([Bible §13 #10] `allCities`). |
| E4 | **`terrorismActivity` is a string** | Parsed defensively (`parseInt \|\| 0`) [criminalOrganization.ts:L343]. | Keep. After dataset unification, normalize to number at load. |
| E5 | **Player is in a country, sim only runs there** | Only `selectedCountry` simulates [enhancedGameStore:L3511]. Other 167 countries are frozen. | **RULING-WORLDTICK** (§8.5): keep full sim for player's country; run a **cheap aggregate tick** for others so global `shadow_network` counts (doom clock) and news-of-interest stay alive. |
| E6 | **Org `capital`/`personnel` hit 0 mid-week** | `Math.max(0,…)` clamps; declining → eliminated next tick. | OK. |
| E7 | **Two news/investigations spawn for the same crime** | News throttled to 5/week [criminalNewsBridge:L468]; investigations *not generated at all from the live loop* (gap, §8.2). | Wire `generateInvestigationFromCrime` with the throttle in §8.2. |
| E8 | **Save/load mid-sim (time travel)** | `criminalOrganizations[]` + `lastUnderworldWeek` persist in store; `events` capped at 200/500. | On time-travel rewind ([Bible §11]), org state rewinds with the save. **OWNER-FORK-A:** should rewinds also *un-eliminate* an org the player killed? (See §10.) |
| E9 | **Player colludes (pays protection) then raids same org** | No relationship tracked between player and org. | **RULING-COLLUDE:** add `playerStanding: number (−100..100)` to org; protection/black-market raise it, raids/investigations lower it. Gates whether the org *targets the player* (random extortion, ambush missions). |
| E10 | **crimeIndex never changes** | `CrimeIndex` is read-only static data. | **RULING-CI** (§6.2): orgs feed a *runtime* `cityCrimeState` overlay so a city visibly heats up / cools down; base CSV value is the floor. |
| E11 | **Infinite escalation** (org survives at War heat forever) | Heat decays 1–13/wk; military caps it. | Bounded. Confirm in tuning (`underworldTuning.ts` already measures survival 50–90% target). |
| E12 | **News spam** | Capped 5/wk [criminalNewsBridge:L468]; `underworldTuning` flags >4/wk. | Keep cap; expose as tunable constant. |

---

## 6. UI / UX Hooks

### 6.1 Phone / Laptop (the primary surface — [Bible §7])
- **News app:** crime articles already flow here via `addNewsArticle` (`CRIME_NEWS_SOURCES`: Police Blotter cred 75, Crime Watch 60, Underworld Insider 40 tabloid, Investigative Times 85). Importance ladder: `extreme → breaking`, `high → major`, `heat>60 → major` [criminalNewsBridge:L363]. Source bias colors the body copy.
- **Investigations inbox (NEW wiring):** newsworthy + law-grade events drop an **email alert** that opens an `Investigation` (§8.2). Difficulty `min(10, 3 + reputation/20 + (cartel?2:0))`; available approaches gated by country stats [criminalInvestigationBridge:L283].
- **"Most Wanted" widget:** `underworldStore.getMostWantedOrg()` → the highest-heat org, with a heat bar using the 5 `HEAT_LEVELS` bands. Shows `state`, `type`, `headquarters`, top specialty.
- **Underworld ledger (dev/advanced):** `underworldStats` totals (arrests, profit, events) + per-org sheet (state, personnel, capital, heat, reputation, leader). Already modeled in `underworldStore` selectors.

### 6.2 World Map (sector layer — [Bible §6])
- **Per-city crime glyph:** color a city dot by **effective crime** = `max(CrimeIndex_base, cityCrimeState.runtime)` (§ RULING-CI). Bands: <30 calm (green), 30–60 active (amber), >60 hot (red), org-HQ-with-War-heat = pulsing red skull. Symbolic only (matches the symbolic-combat ethos — glyphs, not art).
- **Org HQ marker** on cities with an `operating`/`conflict` org; tooltip = org card.
- **Empty-state copy** (E1): cities with no org and `effectiveCrime<30` show "Low organized-crime presence."

### 6.3 Combat overlay (symbolic grid — [Bible §5])
- When a crime mission is entered (§8.4), the **enemy faction = the org**: enemy units inherit the leader's `motivation` and `personalityType` → drives `PERSONALITY TARGET SELECTION` AI [§3.4/§5.10 of Bible]. `selfish` orgs target civilians/least-health; `neutral`/`selfless` won't. Muscle quality (from §3.5) sets enemy unit stat tier (thug→elite). No new combat rules — reuses the existing resolution engine.

### 6.4 Notifications
- Weekly toast already fires: `🌃 Underworld: N criminal events this week` [enhancedGameStore:L3552]. Keep; make tappable → opens the underworld ledger filtered to that week.

---

## 7. Name & Flavor Generation (frozen)
- Prefixes (18) [criminalSimulation.ts:L592]: Black, Red, Golden, Iron, Silver, Shadow, Night, Dark, Blood, Ghost, Crimson, Steel, Stone, Venom, Death, Silent, Jade, Scarlet.
- Suffixes (23) [L597]: Dragons, Serpents, Wolves, …, Familia, Brotherhood, Mafia.
- 30% chance to use `The <City> <Suffix>` form [L608].
- Leader names: 10 first × 10 last [L676]. **OWNER-FORK-B:** localize name pools by `cultureCode` (14 regions) for verisimilitude (currently a flat global pool).

---

## 8. Integration Points (systems it reads / writes)

### 8.1 Reads
- `allCountries` (spine stats), `allCities`/`cities` (`crimeIndex`, `cityType*`, `populationRating`, `sector`) — **[Bible §13 #10: unify on `allCities`]**.
- `callingSystem` (leader callings), `combinedEffects.calculateOrganizedCrime` (pricing oracle, RULING-DUP).
- `gameTime` week index (`floor(day/7)`) as the simulation clock.

### 8.2 Writes — News ✅ (wired) / Investigations ❌ (GAP — wire it)
- **News:** `generateWeeklyNews(events) → addNewsArticle` [enhancedGameStore:L3530]. **Done.**
- **Investigations:** `criminalInvestigationBridge.generateInvestigationFromCrime` exists but **is never called from the store**. **RULING-INV-WIRE:** in `runUnderworldSimulation`, after computing each `ActivityResult`, call `generateInvestigationFromCrime(org, result, country, city, day)`; if non-null, push to the investigation store. Throttle to **≤2 new investigations/week** (matches `underworldTuning.testInvestigationIntegration` "15–60%" target, ~3–12 per 20 activities). Outcome feeds back via `applyInvestigationOutcome` (already written: direct→arrests+leaderArrest 20%, technical→−30% capital, social→−10% personnel/−15% capital, etc. [criminalInvestigationBridge:L320]).

### 8.3 Writes — Black market / contacts / pricing (spine oracle B)
- `combinedEffects.calculateOrganizedCrime` → `protectionCost`, `muscleQuality`, `randomExtortionChance`, `governmentCollusion`. Consumed by `worldSystems/underworldSystem.ts` (`BlackMarketAccess`, `SmugglerContact`, `UnderworldDeal`) and the shop layer (`shopSystem.ts` references combinedEffects). **RULING-PRICE-CONSUME:** the shop/contacts UI must *actually read* these (price multiplier, sting risk) — currently computed; verify consumption per [Bible §13 #9].

### 8.4 Writes — Missions (GAP — wire it)
- **RULING-MISSION-WIRE:** missions are NOT generated from the live sim today. Add: when an org is in `conflict` state OR commits an `extreme`-risk activity OR reaches `heat ≥ 61` (Hunted), emit a **`underworld`-type mission** (the type already exists in `missionSystem.ts:L34`) targeting the org's HQ city. Mission reward scales with org `capital`/`reputation` (reuse `potentialReward` math from `criminalInvestigationBridge:L157`). Cap **1 auto-mission per org per 4 weeks** to avoid flooding. Completing it forces the org `→ declining` (or `→ eliminated` if leader captured), feeding `prisoners` ([Bible §7.3], spec 109).

### 8.5 Writes — Doom clock & world tick
- `shadow_network` count → `advanceDoomClock` [enhancedGameStore:L3576]. **Done.** **RULING-WORLDTICK (E5):** add a per-week **lightweight global pass** (no per-activity detail) that lets `shadow_network` orgs slowly accrete in non-player countries from `calculateOrganizedCrime.crimePower`, so the doom clock reflects the *whole world*, not just where the player stands. This is the architecturally-cheap stub that also pre-positions for the multiplayer "other dimension" ([Bible §6.5 / spec 107]) without designing MP.

### 8.6 Dynamic political events ([Dynamic_Political_Events.csv])
- High-end underworld outcomes should be able to *trigger* the authored political-event templates: e.g. a cartel reaching `syndicate`/War-tier in a corruption-≥70 country is a valid trigger for `POL_006 Corporate_LSW_Privatization` ("government LSW budget crisis") or a bespoke "Failed-State Collapse" template. **RULING-DPE-HOOK:** expose `underworldStats` + per-country `crimePower` to the event-emergence engine (spec 02) as trigger inputs; do not hard-code consequences here — the event engine owns those (keeps it data-driven).

---

## 9. RULING Notes (collected — all consistent with `SHT_MECHANICS_BIBLE.md`)
- **RULING-DUP** (§2.5): two implementations resolved — live sim (A) = truth; `calculateOrganizedCrime` (B) = stateless pricing oracle, recomputed never persisted; (A) seeds from (B)'s `crimePower`.
- **RULING-CITYMAP-GAP** (§3.4): add `Temple → []`, `Village → [theft, smuggling]` to `CITY_CRIME_MAP`.
- **RULING-CAP** (E2): clamp initial seed to `maxOrgs = floor(cities/5)+3`.
- **RULING-CI** (E10, §6.2): introduce runtime `cityCrimeState` overlay; effective crime = `max(base CrimeIndex, runtime)`; orgs add `crimeIndexContribution` (0–40) while operating, decays when eliminated. Base CSV is the floor; never mutate source data.
- **RULING-COLLUDE** (E9): add `playerStanding (−100..100)` to org; gates targeting the player.
- **RULING-INV-WIRE** (§8.2): call `generateInvestigationFromCrime` from the weekly tick, ≤2/week.
- **RULING-MISSION-WIRE** (§8.4): emit `underworld` missions on conflict / extreme-activity / heat≥61, ≤1 per org per 4 weeks.
- **RULING-PRICE-CONSUME** (§8.3): shop/contacts must consume the pricing oracle ([Bible §13 #9]).
- **RULING-WORLDTICK** (E5, §8.5): cheap global pass for non-player countries (doom-clock + news-of-interest).
- **RULING-DPE-HOOK** (§8.6): feed `crimePower`/`underworldStats` to the event engine as triggers; consequences owned by spec 02.
- **RULING-PERSONALITY** (§2.2/§6.3): leader carries a `personalityType 1..20` so fought orgs use `PERSONALITY TARGET SELECTION` AI (the doc maps types→{most/least health, major/minor threat, random}: e.g. type 1→"most health", 18/19→"random").

## 10. OWNER-FORK Notes (product choices for the owner)
- **OWNER-FORK-A (rewind & dead orgs):** When the Time Walker rewinds ([Bible §11]), an org the player *eliminated* in the lost future reappears. Intended (the underworld is part of the rewound timeline) — but confirm it doesn't feel like progress-erasure. Option: orgs killed *before* the rewind point stay dead; only post-point ones revive.
- **OWNER-FORK-B (localized names):** localize org/leader name pools by `cultureCode` (14 regions) vs the current flat global pool (§7). Pure flavor; cost is content authoring.
- **OWNER-FORK-C (player-as-crime-lord):** the data fully supports the player *running* an org (orgs have the same schema as the player's operation). Out of scope for v1, but the architecture is one flag away. Owner call on whether "go villain" is ever a campaign mode.
- **OWNER-FORK-D (collusion morality):** paying protection / hiring muscle / buying black-market gear is gated today only by affordability. Should hero **fame / public opinion** ([Bible §9 `Public_Perception`]) take a hit for dealing with criminals? Recommend yes (consistency with the fame system) — but it's a tone choice.
- **OWNER-FORK-E (news volume target):** `underworldTuning` targets 1–3 crime articles/week as "background noise." Owner sets the final cap constant (currently hard 5/week).

## 11. Open Questions
1. **Culture affinity (RULING-CULTURE, deferred):** Should `Culture_Region_Effects` modify crime (e.g. a region with strong smuggling tradition)? Data exists (14 regions) but no formula is specified; needs a design pass or it stays out.
2. **Cross-border orgs:** `cartel`/`shadow_network` have `maxCities` 15/100 but the sim only operates in the player's country. When do territories actually span borders, and does that need the global tick (E5) to be *full*, not aggregate?
3. **Player heat vs org heat unification:** `heatSystem.ts` (player, 5 bands `cold..inferno`) and `criminalOrganization.HEAT_LEVELS` (org, 5 bands `Ignored..War`) are separate scales. Confirm they stay separate (recommended — different subjects) or whether a shared "attention" model is wanted.
4. **Doom-clock weight of shadow networks:** is "count of `shadow_network` orgs" the right driver, or should it be total `crimePower`-weighted? (Affects how aggressively the player must police crime to slow the invasion.)
5. **Investigation → mission dedup:** if a crime spawns *both* an investigation (§8.2) and an auto-mission (§8.4), are these two routes to the same org, or mutually exclusive per event? (Recommend: investigation is the *soft* route, raid mission is the *hard* route; spawning one suppresses the other for that event.)

---

### Build checklist (zero-follow-up implementation order)
1. **Freeze** §2/§3 tables as the contract (already in code — add `crimeIndexContribution`, `playerStanding`, `personalityType` fields).
2. **RULING-DUP / RULING-CAP / RULING-CITYMAP-GAP:** data + seed fixes (small, local).
3. **RULING-INV-WIRE + RULING-MISSION-WIRE:** wire the two existing bridges into `runUnderworldSimulation` with the stated throttles. (Highest player-facing value.)
4. **RULING-CI:** runtime crime overlay + world-map glyph (§6.2).
5. **RULING-WORLDTICK + RULING-DPE-HOOK:** cheap global pass + event-engine triggers.
6. **UI:** Most-Wanted widget, underworld ledger, combat enemy-from-org mapping (§6).
