# 14 — Combined-Effects Systems (the spine, made *consumed*)

> **System owner doc.** Build-ready spec for the **12 combined-effect subsystems** — cloning, black market, surveillance, medical, research, organized crime, mercenaries, safe houses, border control, media, politics, LSW (superhuman) affairs — and, more importantly, **the consumption layer that wires them into mission generation, pricing, and difficulty.**
>
> **Status:** Spec. The *computation* already ships (`MVP/src/data/combinedEffects.ts`, 12 `calculate*` functions + `calculateAllCombinedEffects`). Per **Bible Ruling §13.9** ("Combined-effects must be **consumed** by mission-gen/pricing/difficulty, not just computed") the code currently computes and throws the result away. **This doc is the contract that makes them load-bearing.**
>
> **Primary sources (open these first):**
> - `docs/csv-source-data/Game_Mechanics_Spec/Country_Attribute_Effects.csv` — the `---ATTRIBUTE COMBINATION EFFECTS---` block (6 named combos) and per-stat band effects. **(primary — owns the combo→effect mappings)**
> - `SHT_MECHANICS_BIBLE.md` §8 (the 12-system table: *Driven by* / *Gives*), §6.1 (spine), §13.9 (ruling), §2 (Spine Principle).
> - `docs/csv-source-data/Game_Mechanics_Spec/City_Type_Effects.csv` — city-type & crime-index & population-rating modifiers that layer on top of the country combos.
> - `docs/csv-source-data/Game_Mechanics_Spec/Stat_Rank_Mapping.csv` — `+4CS…−6CS` reference, result bands (Failed/Minor/Success/Major).
> - `docs/csv-source-data/SuperHero Tactics World Bible - Country.csv` — the 35 raw stat columns the formulas read (mirrored as `MVP/src/data/allCountries.ts`).
> - `docs/csv-source-data/Public_Perception.csv` — reputation/financial/legal deltas the consumption layer writes into.
> - `docs/csv-source-data/Game_Mechanics_Spec/Faction_Specification.csv` — faction territory overlay (+3/+1/−2 CS) that stacks on combined effects.
>
> **Sibling specs this doc must NOT duplicate (it cites them):**
> - **`11-country-effects-spine.md`** owns the per-method `±CS` table and the `LocationEffectProfile` bundle. This doc's 12 subsystems are a *named field* inside that profile.
> - **`108-hospital-cloning-recovery-loop.md`** owns the death→Dying→clone *resurrection mechanic* and `recoverySystem.ts`. This doc owns `calculateCloningSystem`'s **availability/quality/price/wait** outputs only, which 108 consumes.
> - **`02-event-emergence-engine.md`** owns the authored event/mission **template** schema. This doc owns the **`UnlockedActions` / `MissionSeed` weights** the engine reads to *select & parameterize* those templates.
> - **`09-investigations.md`** owns investigation method resolution; this doc supplies the `±CS` and unlocked-method gates it consumes.
>
> **Hard rule honored throughout:** *Never invent a number.* Every value cites a source row, an existing-code line (already balanced against the data), or is tagged `RULING:` (a choice consistent with the Bible) / `OWNER-FORK:` (a product decision the owner must make).

---

## 1. Overview & player fantasy

**The fantasy:** *"The map is a menu of crimes."* A black-market railgun, a cloned teammate, a bought senator, a bulletproof safehouse, a planted news story, a hired super-merc — **none of these are global buttons.** Each is unlocked, priced, and made risky **by the stats of the country the player is standing in.** Corruption + weak law in Lagos opens an arms bazaar that does not exist in Oslo. China's surveillance score means a hero who lands ungloved is on a watchlist within hours. India's banned cloning means a death there is *permanent* unless the body is flown somewhere it isn't.

The 12 subsystems are the **emergent middle layer** of the Spine Principle (Bible §2): raw stats → 12 named systems → the verbs the player can actually perform. They are the reason two countries with identical mission text play completely differently.

**Why this doc exists (the ruling):** today the 12 `calculate*` functions in `combinedEffects.ts` run, produce a rich `CombinedEffects` object, and **nothing reads it.** Bible §13.9 makes wiring this "the highest-value strategic-depth work." This spec defines the three consumption channels — **(A) Unlocked Actions** (what the phone offers), **(B) Pricing & Time** (what shops/services charge), **(C) Mission/Difficulty Seeding** (what the event engine spawns and how hard) — plus the **risk-resolution loop** that turns each illegal action into a dice roll on the Universal Table.

**One-line definition.** Given a `Country` (and, where noted, the `City` + faction context), the system returns a memoized `CombinedEffects` bundle (12 sub-objects, already coded) **plus** a derived `ConsumptionProfile { unlockedActions, priceTable, missionSeeds, riskTable }` that every consumer (phone shop, event engine, hospital, news, combat reinforcement) reads.

---

## 2. Data schema (fields & types)

### 2.1 Inputs (already in code — confirmed field names)

The formulas read `Country` from `MVP/src/data/allCountries.ts`. **Confirmed numeric fields (0–100):** `governmentCorruption` (higher = more corrupt), `militaryServices`, `militaryBudget`, `intelligenceServices`, `intelligenceBudget`, `mediaFreedom`, `lawEnforcement`, `lawEnforcementBudget`, `gdpNational`, `gdpPerCapita`, `healthcare`, `higherEducation`, `socialDevelopment`, `lifestyle`, `cyberCapabilities`, `digitalDevelopment`, `science`, `lswActivity`. **Confirmed enum (string) fields:** `governmentPerception`, `cloning` (`Banned|Regulated|Legal`), `lswRegulations` (`Banned|Regulated|Registration|Legal`), `vigilantism`, `terrorismActivity` (`Inactive|Rare|Active`), `capitalPunishment`.

> ⚠️ **RULING — fix two type bugs the consumption layer would inherit.** `combinedEffects.ts` currently treats some string columns as numbers, which silently evaluates to `NaN`/`false` and would make the consumption layer mis-gate:
> - `calculateMercenarySystem` reads `country.terrorismActivity >= 40` and `calculateSuperhumanAffairs`/`calculateOrganizedCrime` compare numbers, but `terrorismActivity` is the **string** `Inactive|Rare|Active`. Map via the existing `TERRORISM_LEVELS` const in `countries.ts` (`Inactive→0, Rare→25, Active→75`) **before** the comparison.
> - `calculateBorderControl` reads `country.coastline` and `calculateMercenarySystem`/cloning read `country.iso`; **neither field exists** on `Country` (the field is `code`, and there is no coastline column). Replace `country.iso` → `country.code`; replace the `coastline > 0` sea-routes gate with `RULING:` below. These must be fixed or the consumption gates inherit garbage. *(Grounds: `allCountries.ts` interface; `countries.ts` `TERRORISM_LEVELS`.)*
>
> **RULING — coastline proxy:** there is no coastline column in `Country.csv`. Until a `hasCoastline:boolean` is added to `allCountries.ts`, gate `seaRoutes` on **city type `Seaport`** instead (a city the squad is *in* — `City_Type_Effects.csv` row Seaport: "Maritime: Water-based operations enabled"). This is more correct anyway: smuggling-by-sea is a *port-city* affordance, not a country average.

### 2.2 The 12 computed sub-objects (already coded — this doc freezes them as the contract)

These ship in `combinedEffects.ts`. Field lists are authoritative; **do not redefine, import.**

| Subsystem | `calculate*` fn | Driven by (Bible §8) | Key consumed outputs |
|---|---|---|---|
| `cloning: CloningSystem` | `calculateCloningSystem` | `cloning` law + Healthcare + Science + GDP | `available`, `regulation`, `cloneQuality`, `baseCost`, `premiumCost`, `waitTime`, `memoryTransfer`, `cloneDefectChance`, `blackMarketClones` |
| `blackMarket: BlackMarketSystem` | `calculateBlackMarket` | Corruption + Military − Law | `available`, `accessDifficulty`, `militaryWeaponsAvailable`, `weaponPriceModifier`, `weaponQualityRange`, `hitmanCost`, `policeRaidChance`, `scamChance`, `fedInfiltrationRisk` |
| `surveillance: SurveillanceSystem` | `calculateSurveillance` | Intel + Cyber + (100−MediaFreedom) | `surveillanceScore`, `privacyLevel`, `heatDecayRate`, `identityChangeEffectiveness`, `canGoOffGrid`, `offGridCost`, `internetCensorship` |
| `medical: MedicalSystem` | `calculateMedicalSystem` | Healthcare + GDP + Lifestyle + Science | `hospitalTier`, `recoverySpeedMultiplier`, `surgeryCost`, `cybernetics`, `medicalTourismScore` |
| `research: ResearchSystem` | `calculateResearchSystem` | Science + Education + GDP + Cyber | `researchTier`, `researchSpeedMultiplier`, `techAvailability`, `techPriceModifier`, `specialistRecruitment[]`, `talentPool` |
| `organizedCrime: OrganizedCrimeSystem` | `calculateOrganizedCrime` | Corruption + (100−Law) | `crimePower`, `crimeOrganization`, `randomExtortionChance`, `canHireMusclE`, `muscleQuality`, `policeOnPayroll` |
| `mercenaries: MercenarySystem` | `calculateMercenarySystem` | Military + GDP + Corruption | `poolSize`, `canHire{Thugs,Veterans,Elite,Supers}`, `*CostPerDay`, `loyaltyRating`, `equipmentQuality` |
| `safeHouses: SafeHouseSystem` | `calculateSafeHouseSystem` | Corruption + (100−Law) + (100−Intel) | `availability`, `{flophouse,apartment,safehouse,fortress}{Cost,Security}`, `tunnelNetworkAccess` |
| `borders: BorderControlSystem` | `calculateBorderControl` | Military + Intel + Law | `porosity`, `visaCost`, `visaWaitDays`, `illegalEntryCost`, `illegalEntryRisk`, `bribeCost`, `fleeingDifficulty` |
| `media: MediaSystem` | `calculateMediaSystem` | MediaFreedom + Corruption + Cyber | `canPlantStories`, `storyPlantCost`, `canBuryStories`, `storyBuryCost`, `trollFarmCost`, `censorshipSpeed`, `fakenewsEffectiveness` |
| `politics: PoliticalSystem` | `calculatePoliticalSystem` | GDP + Corruption + MediaFreedom | `coupRisk`, `revolutionRisk`, `lobbyCost`, `politicianBribeCost`, `coupCost`, `coupSuccessChance`, `legalSystemSpeed` |
| `superhuman: SuperhumanAffairsSystem` | `calculateSuperhumanAffairs` | LSWActivity + Intel + Military + Science | `superheroLegalStatus`, `vigilanteResponse`, `publicOpinionOfSupers`, `superhumanDatabase`, `powerNullifiers`, `governmentAttitude` |

### 2.3 NEW — the consumption layer (this doc's deliverable)

New module **`MVP/src/data/combinedEffectsConsumption.ts`**. All types below are new.

```ts
// One enum of every action the 12 systems can unlock. The phone & event engine key off these.
type CombinedActionTag =
  // black market
  | 'buy_blackmarket_weapon' | 'hire_hitman' | 'buy_forged_docs'
  // cloning / medical (resurrection mechanic itself lives in spec 108)
  | 'order_clone' | 'order_blackmarket_clone' | 'buy_cybernetics' | 'medical_tourism_heal'
  // surveillance / safe houses / borders
  | 'go_off_grid' | 'rent_safehouse' | 'rent_fortress' | 'smuggle_across_border' | 'bribe_border_guard'
  // mercenaries / crime
  | 'hire_merc_thug' | 'hire_merc_veteran' | 'hire_merc_elite' | 'hire_merc_super'
  | 'pay_protection' | 'hire_street_muscle'
  // media / politics
  | 'plant_story' | 'bury_story' | 'run_troll_farm' | 'bribe_journalist'
  | 'lobby' | 'bribe_politician' | 'bribe_judge' | 'stage_coup'
  // research
  | 'buy_cutting_edge_tech' | 'recruit_specialist';

interface UnlockedAction {
  tag: CombinedActionTag;
  available: boolean;          // gate from the sub-object boolean
  price: number;               // from the sub-object cost field (already GDP-scaled)
  timeDays: number;            // resolution time on the strategic clock
  legality: 'legal' | 'gray' | 'illegal';
  riskTag: RiskTag | null;     // which risk roll fires on use (null = no roll)
  sourceSystem: keyof CombinedEffects;
}

type RiskTag =
  | 'police_raid'              // blackMarket.policeRaidChance
  | 'scammed'                  // blackMarket.scamChance
  | 'fed_sting'               // blackMarket.fedInfiltrationRisk
  | 'border_caught'           // borders.illegalEntryRisk
  | 'extorted'                // organizedCrime.randomExtortionChance
  | 'clone_defect'            // cloning.cloneDefectChance
  | 'surveillance_flag'       // derived from surveillance.surveillanceScore
  | 'merc_betrayal'           // 100 - mercenaries.loyaltyRating
  | 'coup_fail';              // 100 - politics.coupSuccessChance

interface RiskOutcome {
  tag: RiskTag;
  chance: number;              // %, from the sub-object (see §4)
  onFail: ConsequenceRef;      // points at a Public_Perception row + combat-trigger flag
}

// What the event engine reads to bias template selection. NOT the template itself (that's spec 02).
interface MissionSeed {
  templateCategory: string;    // matches a tag in 02-event-emergence-engine templates
  weight: number;              // selection weight 0..100 (see §5)
  difficultyCS: number;        // ±CS applied to the spawned mission's resolution
  enemyQualityTier: 1|2|3|4;   // reinforcement/guard quality (maps to merc/crime tiers)
}

interface ConsumptionProfile {
  countryCode: string;
  unlockedActions: UnlockedAction[];
  riskTable: Record<RiskTag, RiskOutcome>;
  missionSeeds: MissionSeed[];
  // global multipliers a consumer can apply directly:
  shopPriceMult: number;       // gdpPerCapita / 50  (the base used everywhere in combinedEffects.ts)
  recoveryTimeMult: number;    // 1 / medical.recoverySpeedMultiplier
  researchTimeMult: number;    // 1 / research.researchSpeedMultiplier
  heatDecayPerDay: number;     // surveillance.heatDecayRate
}

function buildConsumptionProfile(country: Country, city?: City): ConsumptionProfile;
```

> **RULING — memoize.** `calculateAllCombinedEffects` + `buildConsumptionProfile` are pure functions of `(country, city)`. Country stats only change via rare `Dynamic_Political_Events` (Bible §6.5). Memoize by `country.code` (+ `city.id` when a city is passed) and **invalidate on a world-state event**, not per frame.

---

## 3. Exact numbers / tables / formulas (each cited)

**All sub-object formulas already exist and are balanced against the data — they are NOT re-derived here.** This section specifies the *new* consumption math, citing the source for every constant.

### 3.1 The price spine (one multiplier, cited everywhere)

Every monetary value in `combinedEffects.ts` is already scaled by `gdpPerCapita / 50` (e.g. `thugCostPerDay = round(100 * gdpPerCapita/50)`, line ~626; `surgeryCost = round(15000 * gdpPerCapita/50)`, line ~356; `bribeCost = round(200 * (100−corruption)/100 * gdpPerCapita/50)`, line ~833). The consumption layer **reuses these fields verbatim** — `UnlockedAction.price` is a direct copy, never recomputed. `shopPriceMult = gdpPerCapita / 50` is exposed for any *new* shop item priced at runtime. *(Source: `combinedEffects.ts` cost lines; Bible §8 "illegal gear access & price".)*

### 3.2 Time spine (strategic-clock cost of each action)

`UnlockedAction.timeDays` comes from the sub-object's own wait fields where they exist, else the `RULING:` defaults below (chosen to read against `Travel_Time_System.csv`'s game-day scale where 1 real-day = 30 game-days, so these are "feels like a real errand" sized):

| Action | timeDays | Source |
|---|---|---|
| `order_clone` | `cloning.waitTime` | `combinedEffects.ts` (`max(7, 60−healthcare*0.5)`); matches `Country_Attribute_Effects.csv` Cloning band ("30 day"/"7 day"). |
| `order_blackmarket_clone` | `cloning.waitTime + 5` | RULING: black-market is slower & dodgier (+5 game-days). |
| `medical_tourism_heal` / hospital | drives `recoveryTimeMult`, computed in spec 108 | `medical.recoverySpeedMultiplier`. |
| `smuggle_across_border` | `borders.visaWaitDays` (legal) or `RULING: 2` (illegal) | `Travel_Time_System.csv` "Political_Checkpoint: +2 days". |
| `plant_story`/`bury_story` | `RULING: 1` | `media.censorshipSpeed` is in **hours**; 1 game-day rounding. |
| `hire_merc_*` | `RULING: 1` (arrives next day) | no source field; 1-day default. |
| `lobby`/`bribe_*` | `RULING: 3` | `Faction_Specification.csv` cooldowns are 1–7 days; 3 is the median. |
| `stage_coup` | `RULING: 7` | matches `Faction_Specification.csv` "Shock and Awe" 7-day cooldown as the heaviest action. |
| all other shop buys | `RULING: 0` (instant, same as buying gear) | — |

### 3.3 Legality classification (drives `riskTag` + Public_Perception consequence)

```
legal   : medical_tourism_heal, buy_cybernetics, recruit_specialist, lobby,
          order_clone (where cloning.regulation ∈ {regulated, legal}),
          hire_merc_* (where superhuman.superheroLegalStatus ∈ {licensed,encouraged,state_sponsored}),
          rent_safehouse/rent_fortress (always — renting property is legal)
gray    : buy_cutting_edge_tech, run_troll_farm, plant_story, bury_story,
          go_off_grid, smuggle_across_border (where borders.bribeBorderGuards)
illegal : buy_blackmarket_weapon, hire_hitman, buy_forged_docs, order_blackmarket_clone,
          bribe_border_guard, bribe_journalist, bribe_politician, bribe_judge,
          pay_protection, hire_street_muscle, stage_coup
```
*(Grounds: `Country_Attribute_Effects.csv` GovernmentCorruption row — "High corruption: +3CS bribes/blackmail"; `City_Type_Effects.csv` Crime-Index block — "High (60-80): −2CS official, +2CS underground"; Bible §9 legal-system scaling.)*

### 3.4 Risk roll resolution (the Universal Table loop)

Every `illegal`/`gray` action with a non-null `riskTag` resolves a roll **before** the benefit applies:

```
risk_chance = riskTable[tag].chance              // a % from §4
roll d100
if roll < risk_chance  → action FAILS its risk:
    apply riskTable[tag].onFail (Public_Perception row + optional combat trigger)
else                   → action succeeds, benefit applies
```

> **RULING — risk is a flat d100, NOT the 4CS column table.** The 4CS Universal Table (`Stat_Rank_Mapping.csv` result bands) is for *character actions resolved by a stat*. A black-market raid is an **environmental probability** already expressed as a %, so it rolls d100 vs. the % directly (consistent with how `Injury_System.csv` and `Travel_Time_System.csv` complications use flat % chances — e.g. "Customs_Inspection 20%"). Character skill enters only via the `±CS → %` *modifier* in §3.5. *(Grounds: `Travel_Time_System.csv` "TRAVEL COMPLICATIONS" % column; `Public_Perception.csv` consequence rows.)*

### 3.5 Skill/heat modifiers to risk (where the player's own units matter)

`final_chance = clamp(base_chance + heat_penalty − skill_bonus, 0, 95)`:
- `heat_penalty = current_heat × (1 − heatDecayRate/100)` capped at +20 — a hunted player draws more raids. `current_heat` is the unit's existing heat stat; `heatDecayRate` from `surveillance` (`combinedEffects.ts` `max(1, 10 − surveillanceScore/20)`).
- `skill_bonus`: the acting unit's relevant skill expressed as **−CS-to-% via the standard CS ladder** — each `+1CS` of relevant skill (Streetwise for black market, Stealth for off-grid/smuggle, Deception for media/bribes) subtracts **5%** (`RULING:` mapping `1CS ≈ 5%`, anchored on `Stat_Rank_Mapping.csv` where adjacent rank bands span ~10 raw points and a CS = one band; half-band ≈ 5%). *(Grounds: `Stat_Rank_Mapping.csv` COLUMN SHIFT REFERENCE.)*

### 3.6 Faction & city overlay on top of combined effects

Combined-effect *prices and risks* stack with the faction-territory overlay from `Faction_Specification.csv` and the city-type/crime overlay from `City_Type_Effects.csv`:
- **Home territory** (`+3CS all methods; legal immunity`): all `illegal`-action risk rolls are **skipped** (legal immunity) and `gray` actions reclassify to `legal`. *(Faction_Specification.csv "Home_Territory".)*
- **Hostile territory** (`−2CS all methods; detection risk`): add **+15%** to every risk chance (the −2CS expressed as % via §3.5). *(Faction_Specification.csv "Hostile_Territory".)*
- **City crime index** (`City_Type_Effects.csv` Crime-Index block): `Very High (80-100): −3CS legal, +3CS criminal` → **−15% to illegal-action risk** and **+1 to `enemyQualityTier`** on spawned missions; `Very Low (0-20): +1CS investigations, −1CS criminal recruitment` → **+10% to illegal-action risk**.
- **City special abilities** unlock actions directly: `Temple → Sanctuary` grants a free `go_off_grid` for 24h (`City_Type_Effects.csv` Temple "Sanctuary: hide from authorities for 24hrs"); `Military → Arsenal Access` gives `buy_blackmarket_weapon` at **−20% price** even if legal (`City_Type_Effects.csv` Military "Arsenal Access: −20% cost"); `Seaport → Maritime` enables `seaRoutes`.

---

## 4. How it consumes the SPINE (which stats drive each subsystem → consumption)

The 12 formulas are the spine→system step (already coded). This table is the **system→consumption** step (the new work), with the exact field read and the exact consumer effect.

| Subsystem field | Stat formula (in code) | **Consumed as** |
|---|---|---|
| `blackMarket.policeRaidChance` | `max(0, law − corruption) × 0.3` (line ~175) | `riskTable.police_raid.chance` for `buy_blackmarket_weapon`/`hire_hitman`. |
| `blackMarket.scamChance` | `max(5, 25 − corruption×0.2)` (line ~176) | `riskTable.scammed.chance` (on fail: lose money, no goods). |
| `blackMarket.weaponPriceModifier` | `max(0.4, 1.5 − corruption/100 − …)` (line ~156) | multiplies the **shop weapon price** for any weapon flagged black-market in `weapons.ts`. |
| `blackMarket.weaponQualityRange` | `[minTier,maxTier]` by `militaryBudget` (line ~159) | caps which weapon `tier` rows in `weapons.ts` appear in the black-market shop. |
| `surveillance.surveillanceScore` | `intel×0.4 + cyber×0.3 + (100−media)×0.3` (line ~236) | `riskTable.surveillance_flag.chance = surveillanceScore` for any **un-disguised public op**; also tints the world-map sector (§6). |
| `surveillance.heatDecayRate` | `max(1, 10 − score/20)` (line ~268) | `ConsumptionProfile.heatDecayPerDay` — how fast a unit's heat cools while in-country. |
| `surveillance.identityChangeEffectiveness` | `max(10, 100−score)` (line ~269) | success % of `go_off_grid` (high-surveillance country = a new ID barely works). |
| `medical.recoverySpeedMultiplier` | `0.5 + hq/100 + lifestyle/200` (line ~350) | `recoveryTimeMult = 1/this` — **consumed by spec 108** hospital activity. |
| `medical.surgeryCost`, `cybernetics` | GDP-scaled (line ~356) | price + gate for `buy_cybernetics`/`medical_tourism_heal`. |
| `research.researchSpeedMultiplier` | `0.5 + score/100` (line ~420) | `researchTimeMult = 1/this` — consumed by Research activity / tech tree (spec 06/Bible §7.6). |
| `research.techAvailability` | by `researchScore` (line ~442) | gates `buy_cutting_edge_tech`; `'black_market_only'` reroutes the buy through `blackMarket`. |
| `research.specialistRecruitment[]` | by `higherEducation` (line ~434) | populates `recruit_specialist` options (Engineers/Doctors/Scientists/Hackers…). |
| `mercenaries.poolSize` + `canHire*` | military+corruption+law (line ~603) | gates the 4 `hire_merc_*` actions; `poolSize` caps simultaneous hires. |
| `mercenaries.loyaltyRating` | `max(20, 100 − corruption×0.8)` (line ~639) | `riskTable.merc_betrayal.chance = 100 − loyaltyRating` (rolled on **hire** and per **payday miss**). |
| `safeHouses.{tier}Security` | `base + corruption×0.3 − intel×0.2` (lines ~731-734) | sets the **chance a safehouse hides the squad** during a manhunt event. |
| `safeHouses.{tier}Cost` | GDP-scaled (lines ~722-725) | price of `rent_safehouse`/`rent_fortress`. |
| `borders.illegalEntryRisk` | `min(90, borderSecurityLevel)` (line ~822) | `riskTable.border_caught.chance` for `smuggle_across_border`. |
| `borders.fleeingDifficulty` | by `borderSecurityLevel`+corruption (line ~837) | modifies the **escape window** when a mission goes loud and the squad bugs out. |
| `organizedCrime.randomExtortionChance` | `min(30, crimePower×0.3)` (line ~540) | per-game-day **passive event**: roll to trigger a shakedown email/encounter while in-country. |
| `organizedCrime.muscleQuality` + `crimePower` | corruption+law (line ~508) | `MissionSeed.enemyQualityTier` for crime-flavored missions; gates `hire_street_muscle`. |
| `media.canPlantStories`/`storyPlantCost` | corruption+media (line ~914) | unlocks `plant_story`; **writes a `Public_Perception` Media_Spin_Positive event** (reputation +). |
| `media.fakenewsEffectiveness` | `max(10, 100−media−edu×0.3)` (line ~923) | the **reputation delta size** a planted/buried story produces. |
| `politics.coupRisk`/`revolutionRisk` | stability formula (line ~1001) | `MissionSeed` weight for political-crisis templates; world-state input to `Dynamic_Political_Events`. |
| `politics.politicianBribeCost`/`canBribePoliticians` | corruption (line ~1019) | unlocks `bribe_politician` (effect: temporary `legal` reclassification of one mission). |
| `superhuman.superheroLegalStatus` | `lswRegulations` enum (line ~1129) | **master legality gate**: `illegal` here means *every public op* rolls `surveillance_flag`; `state_sponsored` removes it. |
| `superhuman.vigilanteResponse` | `lswRegulations`+law (line ~1146) | the **enemy faction that spawns** when the squad is detected (`shoot_on_sight`→military reinforcement; `arrest`→police; `tolerate`→none). |
| `superhuman.publicOpinionOfSupers` | base by policy + `(media−50)` (line ~1163) | recruitment-bonus ±CS and crowd reaction in combat (collateral multiplier). |

---

## 5. Mission / difficulty seeding (consumption channel C — feeds spec 02)

`buildConsumptionProfile` emits `missionSeeds: MissionSeed[]` that the **event-emergence engine (spec 02)** reads to bias *which* authored template fires and *how hard*. **This doc does not author templates; it weights them.**

Seed rules (weights are 0–100; the engine normalizes):

| Trigger (combined-effect threshold) | `templateCategory` | `weight` | `difficultyCS` | `enemyQualityTier` |
|---|---|---|---|---|
| `organizedCrime.crimePower ≥ 60` (cartel/syndicate) | `crime_war` | `crimePower` | `−2` (harder) | `muscleQuality→tier` (thugs1/enforcers2/professionals3/elite4) |
| `blackMarket.militaryWeaponsAvailable` | `arms_deal` | `60` | `−1` | `weaponQualityRange[1]` |
| `politics.coupRisk ∈ {high,imminent}` | `political_crisis` | `revolutionRisk` | `−1` | `2` |
| `superhuman.superheroLegalStatus === 'illegal'` | `lsw_hunt` (govt hunts the squad) | `70` | `−2` | `vigilanteResponse→tier` (shoot_on_sight=4) |
| `terrorismActivity === 'Active'` | `terror_event` | `75` (the `TERRORISM_LEVELS` value) | `−2` | `3` |
| `surveillance.surveillanceScore ≥ 80` | `tail_and_burn` (you're being watched) | `surveillanceScore − 50` | `−1` | `2` |
| `cloning.blackMarketClones` | `clone_ring` (investigate illegal cloning) | `40` | `0` | `2` |
| `mercenaries.canHireSupers` | `super_merc_market` (recruit/fight) | `50` | `−1` | `4` |
| default / low-everything country | `street_crime` (baseline) | `30` | `0` | `1` |

*(Grounds: `City_Type_Effects.csv` "Typical_Threats" column per city type and the Crime-Index "combat more likely" rows; `Country_Attribute_Effects.csv` TerrorismActivity row "Active: frequent terror events, +2CS anti-terror, combat risk"; `countries.ts` `TERRORISM_LEVELS`; `Stat_Rank_Mapping.csv` for the CS values.)*

> **RULING — `difficultyCS` is applied to the *mission's* resolution, capped at the §3.6 faction overlay.** A Home-territory mission never goes below `0` net difficulty (legal immunity floor); a Hostile-territory mission adds the `−2CS` from `Faction_Specification.csv` on top. Net CS is clamped to the `Stat_Rank_Mapping.csv` `−6CS…+4CS` band.

> **OWNER-FORK — seed weights are first-pass.** The `weight` numbers tied to authored content density (`arms_deal=60`, `lsw_hunt=70`, `super_merc_market=50`, `street_crime=30`) are not in any CSV — they are tuning knobs that depend on how many templates spec 02 ships per category. The owner should rebalance these against the final template counts (a category with 2 templates should weight lower than one with 20 so the player doesn't see repeats). Flagged for the owner.

---

## 6. UI / UX hooks

| Surface | Hook | Source |
|---|---|---|
| **Phone — "Country Brief" card** | A read-only panel listing the unlocked verbs for the current country: "Black market: OPEN · Cloning: REGULATED · Surveillance: HIGH · Mercs: ABUNDANT." Each row = one subsystem's headline enum. **Pauses time** while open (Bible §7). | `combinedEffects.ts` enums; Bible §7 phone-pauses-time. |
| **Phone — Shop / "Services" app** | The `unlockedActions` list rendered as buy/hire buttons with `price`, `timeDays`, and a **legality color chip** (legal=neutral, gray=amber, illegal=red — *never purple*, per project design rule). Disabled rows show *why* ("Requires Corruption ≥ 40"). | §2.3 `UnlockedAction`; existing `generateLocalAds` (lines 1245-1442) already produces the ad copy — reuse it as the shop blurbs. |
| **World-map — sector tint** | Each sector tinted by **one selectable lens**: Surveillance (how watched), Lawlessness (`crimePower`), Legality-for-supers (`superheroLegalStatus`). A legend, not a heatmap-for-its-own-sake. | `surveillance.surveillanceScore`, `organizedCrime.crimePower`, `superhuman.superheroLegalStatus`. |
| **Laptop — "Local Classifieds" (news)** | `generateLocalAds(country, combined)` output (already coded, 30+ ad templates) dropped into the NewsBrowser as flavor + functional links to the shop. | `combinedEffects.ts` `generateLocalAds`. |
| **Combat overlay** | When detected, the reinforcement banner names the responder from `superhuman.vigilanteResponse` ("LOCAL POLICE INBOUND" / "MILITARY STRIKE TEAM INBOUND" / "no response — vigilantism tolerated"). Crowd-reaction collateral modifier from `publicOpinionOfSupers`. | `superhuman.vigilanteResponse`, `publicOpinionOfSupers`. |
| **Risk feedback** | On any risk roll, a single comic-bubble result ("BUSTED — police raid!" / "Scammed: fake docs" / "Clean."). No save-scum: the only undo is the Time Walker (Bible §11). | §3.4 risk loop; Bible §11. |

---

## 7. Integration points (systems it reads / writes)

**Reads:**
- `allCountries.ts` (`Country`) and `cities.ts` (`City`) — the spine inputs. Unify on `allCountries`/`allCities` per Ruling §13.10.
- Faction territory state (`13-factions-relations-territory.md`) for the §3.6 overlay.
- Unit `heat` + relevant skill ranks (`07-character-model.md`) for §3.5 risk modifiers.

**Writes / is-read-by:**
- **`02-event-emergence-engine.md`** ← `missionSeeds` (template selection + parameterization). *The single most important wire — this is Ruling §13.9 satisfied.*
- **`108-hospital-cloning-recovery-loop.md`** ← `cloning.*` (availability/quality/price/wait) and `medical.recoverySpeedMultiplier`. **108 owns the death/resurrection mechanic; this doc supplies its economic inputs.**
- **`09-investigations.md`** ← unlocked methods + `±CS` (which investigation methods are legal/available here).
- **`10-email-news.md`** ← `generateLocalAds` classifieds + media-spin events.
- **Pricing**: any shop (`weapons.ts`/`armor.ts`/`Tech_Gadgets_Complete`) reads `shopPriceMult`, `weaponPriceModifier`, `weaponQualityRange`.
- **`Public_Perception.csv` consequence pipeline** (Bible §9) ← every risk failure and every media/politics action writes a reputation/financial/legal row.
- **Mercenary management** (`MVP/src/data/mercenaryPool.ts`) ← merc pool gates, costs, loyalty/betrayal.
- **`Dynamic_Political_Events` / `World_State_Tracking_System`** ↔ `politics.coupRisk`/`revolutionRisk` both feed and react to world-state.

---

## 8. Edge cases & failure modes

1. **Country stat = 0 or missing.** Some World-Bible cells are blank/0 (e.g. `Cloning` is "often 0" per `Country_Attribute_Effects.csv`). Treat missing numeric as `0`, missing enum as the most-restrictive value (`cloning`→`Banned`, `lswRegulations`→`Banned`). **Never** let `undefined` reach a comparison (the §2.1 type bugs prove this fails silently).
2. **Divide-by-zero in price spine.** `gdpPerCapita` can be very low; `gdpPerCapita/50` → tiny but non-zero. `medicalTourismScore = healthcareQuality / healthcareCost` (line ~335) divides by `healthcareCost` which can round toward 0 → guard `max(healthcareCost, 0.1)`. **RULING:** clamp all denominators to `≥ 0.1`.
3. **Stacked overlays exceed the CS band.** Hostile faction (−2) + Very-High crime (+3 criminal) + skill could push net risk %/CS past the table. **Clamp risk chance to `[0,95]`** (never a guaranteed bust — escape is always *possible*) and net CS to `[−6,+4]` (`Stat_Rank_Mapping.csv`).
4. **Action unlocked but player can't afford it.** Show disabled with price; don't hide (the player should *see* what this country offers — that's the fantasy).
5. **Home-territory legal immunity vs. illegal action.** Immunity skips the *risk roll* but NOT the *reputation cost* of a botched outcome that still produces collateral (Bible §9 collateral is years-long regardless of jurisdiction). RULING: immunity zeroes `police_raid`/`fed_sting`/`border_caught`; it does **not** zero `Civilian_Casualties_*` reputation.
6. **Merc betrayal mid-mission.** `merc_betrayal` rolls on hire *and* on each missed payday (loyalty erodes). On betrayal during combat, the merc switches to the `vigilanteResponse` faction or flees. Edge: a betrayed *super*-merc is a serious threat — gate `hire_merc_super` behind a visible loyalty warning.
7. **Cloning a unit whose body is in a `Banned` country.** Permadeath there. RULING: the *recovery* spec (108) may offer "ship the body to a `Legal`-cloning country" as a paid travel action (`Travel_Time_System.csv` cost) — this doc just reports `cloning.available=false` for the current location. No contradiction with 108.
8. **No combined system available at all (e.g. tiny clean democracy).** `unlockedActions` may be nearly empty — that is *correct and intended* (Oslo is boring on purpose; it's a sanctuary, not a playground). The phone shows "Few illicit services available here."

---

## 9. RULING: notes (collected)

- **R1 — Memoize** `calculateAllCombinedEffects`/`buildConsumptionProfile` by `country.code`(+`city.id`); invalidate on world-state event, not per frame. (§2.3)
- **R2 — Fix the two inherited type bugs**: map `terrorismActivity` string→`TERRORISM_LEVELS` number before comparing; replace `country.iso`→`country.code`; replace `coastline` gate with city-`Seaport` gate. (§2.1)
- **R3 — Coastline proxy = city type `Seaport`** until a `hasCoastline` column exists. (§2.1)
- **R4 — Risk rolls are flat d100 vs %**, not the 4CS column table; skill enters as a −CS→−% modifier at `1CS ≈ 5%`. (§3.4–3.5)
- **R5 — Time defaults** for actions with no source wait field (coup=7, bribe/lobby=3, smuggle=2, merc/media=1, shop buys=0). (§3.2)
- **R6 — Clamp** risk chance `[0,95]`, net CS `[−6,+4]`, all price denominators `≥0.1`. (§3.6, §8.2-8.3)
- **R7 — Home-territory immunity** skips raid/sting/border risk rolls and reclassifies gray→legal, but never zeroes civilian-casualty reputation. (§3.6, §8.5)
- **R8 — `difficultyCS`** applies to the mission's resolution, clamped, floored at 0 in Home territory. (§5)

## 10. OWNER-FORK: notes (collected)

- **F1 — Mission-seed weights** (`arms_deal=60`, `lsw_hunt=70`, `super_merc_market=50`, `street_crime=30`, etc.) are tuning knobs, not sourced numbers; rebalance against spec 02's final per-category template counts. (§5)
- **F2 — The `1CS ≈ 5%` skill→risk mapping** is a defensible anchor but a design dial; the owner may prefer a steeper curve for high-skill specialists. (§3.5)
- **F3 — Legality table content rating.** This system surfaces hitmen, human-trafficking flags (`organizedCrime.humanTrafficking`), and organ harvesting. The owner must decide the content/ESRB line: keep as dark-strategic flavor (current code already generates these ads), soften the copy, or gate behind a content toggle. Pure product call.
- **F4 — Coup as a player verb.** `stage_coup` is computed (`politics.coupCost/coupSuccessChance`) but enabling the player to *topple a government* has huge downstream world-state consequences. Owner decides whether coups are a player action or AI/world-state-only.
- **F5 — Should `pay_protection` / `bribe_politician` give a *persistent* buff** (e.g. "this country is now friendly for N days") or a one-shot? Affects save/economy balance. Not in any CSV.

## 11. Open questions

1. **Heat model dependency.** §3.5 assumes a per-unit `heat` stat and a per-country heat pool. Is heat owned here, by surveillance (spec 11), or by a separate "wanted level" system? Needs one owner doc. *(Leaning: heat is a unit stat in `07-character-model.md`; this doc only *modifies decay* via `heatDecayPerDay`.)*
2. **Do combined-effect *prices* fluctuate** with player demand (buy 5 railguns → price rises) or stay flat per-country? Current code is flat. Economy-sim question for the owner.
3. **Multiplayer (Bible §11 stub).** When the time-traveler's other dimension opens MP, do two players in the same country *share* one black-market supply (scarcity competition) or get independent instances? Design single-player flat-per-country; flag the shared-scarcity hook as the MP slot — do not build.
4. **City-level vs country-level granularity.** §2.3 lets `buildConsumptionProfile` take an optional `city`. Which subsystems should vary *per city* vs per country? Proposed: black market / safe houses / crime / mercenaries vary by city (crime index + type); cloning / research / politics / borders / superhuman-affairs stay country-level. Confirm with spec 12 (city/culture/terrain).
5. **Interaction with the Time Walker.** A risk failure (busted) is permanent unless rewound. Does the rewind economy (Bible §11) need a specific "undo a bad deal" cost, or does the generic sanity cost cover it? Cross-ref the time-travel save spec.

---

*This system is the load-bearing answer to Bible Ruling §13.9. The 12 calculators already exist; the value is entirely in the consumption layer (§3–§5) that makes the world's stats change what the player can do, buy, and fight — the Spine Principle made playable.*
