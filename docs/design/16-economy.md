# 16 — Economy (money / payday / wages / budgets by tier)

> **System tier:** 3 (Spine) · **Status:** DRAFTING
> **Owns:** the single money number, the weekly **payday** cycle, **mercenary wages**, **per-tier budgets**, country **funding**, prices/costs, debt, and **bankruptcy** (a real failure state).
> **Sibling specs it leans on:** `11-country-effects-spine.md` (GDP→price/pay formulas, band model), `12-city-culture-terrain.md` (city price/resource bands), `13-factions-relations-territory.md` (territory ±, faction funding spread), `08-recruitment-roster.md` & merc pool (hiring), `09-investigations.md` (method `$` costs), `10-email-news.md` (mission rewards, funding emails), `108-hospital-cloning-recovery-loop.md` (medical/clone costs), `100-new-game-onboarding-flow.md` (starting budget), `19-base-building` (upkeep).
> **Hard rule honored throughout:** *Never invent a number.* Every value cites a source row/table or an existing canonical code formula (treated as source, since it was written from the same World Bible). Where the data is silent, the choice is tagged **RULING:** (consistent with the Bible) or **OWNER-FORK:** (a product decision). Owner-forks already raised in `DECISIONS-NEEDED.md` are **referenced, not duplicated**.

---

## 1. Overview & player fantasy

You run a **government-backed paramilitary org** (FIST or a rival faction). Like Jagged Alliance 2's A.I.M. economy, **money is the constant pressure**: a country pays you a **weekly retainer**, you **bleed cash daily** on merc wages, medical bills, base upkeep, travel and bribes, and you **earn** it back through mission rewards, bounties, performance bonuses, and selling loot. Run out of money with no sponsor and it's **game over** — but the time-traveler save means a death-spiral can be *rewound* (at a sanity cost; see `29-time-travel-save`).

The economy is **the most direct consumer of the SPINE**: a country's **GDP per capita** sets prices and pay, its **corruption** taxes your funding and cheapens the black market, its **military/intel budgets** swell or shrink the sponsor retainer. A rich, clean democracy (Switzerland, Japan) funds you generously but charges premium prices and watches your reputation; a poor, corrupt state (Nigeria, North Korea) hands you less but lets you operate cheaply in the gray market. **Where you stand changes what you can afford.**

Three numbers the player watches on the phone: **Cash** (now), **Weekly net** (income − expenses), and **Runway** (weeks of cash left at the current burn). The fantasy is *"keep the team funded long enough to be ready for the invasion."*

**Money is a single global pool** (the org's treasury), not per-character wallets — this matches the existing `EconomyState.cash` in `economySystem.ts` and the JA2 model.

---

## 2. Data schema (fields / types)

### 2.1 Core money state — already implemented, adopted as canonical
Source: `MVP/src/data/economySystem.ts` → `EconomyState`. The spec **adopts this verbatim** and adds the fields in §2.2–2.4.

```ts
interface EconomyState {
  cash: number;                       // the org treasury (global pool)
  weeklyIncome: number;               // accumulator, reset each payday
  weeklyExpenses: number;             // accumulator, reset each payday
  lastPayday: number;                 // game-day of last payday
  projectedWeeklyIncome: number;
  projectedWeeklyExpenses: number;
  transactions: Transaction[];        // rolling log (default cap 100)
  maxTransactionHistory: number;      // = 100
  debt: number;                       // owed principal
  debtInterestRate: number;           // weekly, default 0.05 (= 5%/wk) [code]
}

interface Transaction {              // [code, economySystem.ts] — adopted as-is
  id: string;
  timestamp: number;                  // game-day
  hour: number;
  type: 'income'|'expense'|'purchase'|'sale'|'transfer';
  category: TransactionCategory;      // 26-value enum [code]; see §2.5
  amount: number;                     // +in / −out
  description: string;
  relatedEntityId?: string;
  balanceAfter: number;
}
```

### 2.2 Funding config (per sponsoring country) — already implemented, adopted
Source: `economySystem.ts` → `CountryFundingConfig` + `calculateCountryFunding()`. Adopted as canonical; numbers re-derived & re-anchored in §4.3 against `Player_Scaling.csv`.

```ts
interface CountryFundingConfig {
  countryCode: string;
  countryName: string;
  baseFunding: number;                // weekly $ before corruption tax
  reputationThreshold: number;        // min rep to keep funding (−100..100)
  corruptionTax: number;              // % of funding skimmed (0..50)
  performanceBonus: number;           // $ per successful mission
  fundingLevel: 'minimal'|'standard'|'generous'|'lavish';
}
```

### 2.3 NEW — Budget tier (gates ceilings, ties to progression)
The economy must read the player's **scaling tier** (`Player_Scaling.csv`, 6 tiers) to set the **funding band** and **purchasing ceiling**. Add:

```ts
interface BudgetTier {
  tier: 1|2|3|4|5|6;                   // Player_Scaling Player_Level
  name: string;                        // "Street Operative" … "Cosmic Guardian"
  fundingFloor: number;                // weekly $ floor   (Player_Scaling Funding_Level low)
  fundingCeil: number;                 // weekly $ ceiling (Player_Scaling Funding_Level high)
  annualBudgetFloor: number;           // Resource_* tier annual band (Player_Scaling)
  annualBudgetCeil: number;
  teamSizeLimit: number;               // Player_Scaling Team_Size_Limit (wage-cap driver)
}
```

### 2.4 NEW — Merc contract economics (extends existing pool)
The merc pool (`mercenaryPool.ts`) already has `dailyRate` and pays daily. Add the **JA2 "upfront + take" hire model** the GDD shows ("GANGSTERS FOR HIRE / DELLA JACKSON / UPFRONT $30,000 / TAKE $20[k] (26% of profit)"). Source: FIST GDD v02 lines 546–558 (the A.I.M.-style hire screen).

```ts
interface MercHireTerms {
  upfront: number;                     // one-time signing fee
  dailyRate: number;                   // already in MercenaryListing [code]
  profitTakePct: number;               // 0..40 — share of mission rewards owed
  minContractDays: number;             // desertion penalty if fired early
}
```

### 2.5 Transaction categories (the 26-value enum) — adopted from code
Income: `job_pay, mission_reward, investment_return, bounty_collected, insurance_payout, gift, country_funding, country_bonus`. Expenses: `base_upkeep, medical_expense, education_tuition, equipment_maintenance, travel_expense, bribe, fine, salary_payment, insurance_premium, merc_salary`. Purchases/Sales: `equipment_purchase, equipment_sale, vehicle_purchase, vehicle_sale, property_purchase, property_sale, service_purchase, merc_hire`. Other: `other`. *(Source: `economySystem.ts` `TransactionCategory` — verbatim. Display icon/color map already exists in `TRANSACTION_CATEGORY_INFO`.)*

> **RULING R1 — one money pool, one source file.** `economySystem.ts` is canonical for the money number and the payday loop. `dynamicEconomy.ts` (market price fluctuation, currency exchange) is a **price-modifier layer** that feeds purchase amounts; it must NOT hold a second cash balance. (Avoids the Bible §13 "three datasets" class of bug.)

---

## 3. Band model (shared with the spine)

All country stats are **0–100 ratings** (World Bible Country.csv; nominal raw range 20–90). The economy uses the spine's canonical band thresholds from `11-country-effects-spine.md` §3 (which come from `Country_Attribute_Effects.csv` column headers):

```
band(v): v ≤ 35 → low | 36..65 → medium | ≥ 66 → high
```

GDP columns used: **`GDPPerCaptia`** (col 22, rating 0–100) drives **prices & pay**; **`GDPNational`** (col 21, a derived FORMULA rating 0–100) drives **sponsor funding scale & pool size**. (Source: World Bible Country.csv header; example rows — Denmark GDPNat=90, GDPcap=76; Slovenia 46/64; North Korea 27/43; Switzerland GDPNat=18 but GDPcap=54, showing the two columns are independent.)

> **RULING R2 — GDPNational is "how big the economy is" (funding/pool), GDPPerCaptia is "how rich per person" (prices/wages).** This matches existing code: `calculateCountryFunding()` keys funding off per-capita+budgets, and `locationEffects.ts` keys prices off per-capita. We keep per-capita for prices/pay (already canonical) and **add GDPNational as the funding-scale input** (§4.3) — the spec's one new use of an un-consumed column.

---

## 4. Exact numbers / tables / formulas (each cited)

### 4.1 Starting cash & the per-tier funding band (`Player_Scaling.csv`)

`Player_Scaling.csv` gives **Funding_Level** (weekly working capital) and **Resource_* annual budget** per tier — verbatim:

| Tier | Name | Funding_Level (weekly) | Annual budget band | Team_Size_Limit | Source |
|---|---|---|---|---|---|
| 1 | Street Operative | **$5K–$15K** | $5K–$50K (Resource_Local) | 1–2 | Player_Scaling rows 2 & 24 |
| 2 | City Defender | **$15K–$50K** | — | 2–4 | row 3 |
| 3 | Regional Agent | **$50K–$150K** | — | 3–6 | row 4 |
| 4 | National Operative | **$150K–$500K** | $50K–$2M (Resource_National) | 4–8 | rows 5 & 25 |
| 5 | International Coordinator | **$500K–$2M** | $2M–$50M (Resource_International) | 6–12 | rows 6 & 26 |
| 6 | Cosmic Guardian | **$2M+** | $50M+ (Resource_Cosmic) | 8–15 | rows 7 & 27 |

**Starting cash:** Tier-1 floor = **$5,000**; Tier-1 ceiling = **$15,000** (`Player_Scaling` row 2 `$5K-$15K`). The existing code default `cash: 10000` (`economySystem.ts` `DEFAULT_ECONOMY_STATE`) sits inside this band and is retained as the **neutral default**.

> **OWNER-FORK (already raised — `DECISIONS-NEEDED.md` O1/§onboarding O1):** exact **per-faction starting cash** within the Tier-1 band. The owner's recorded rule: *"TIGHT budgets with a WIDE inter-faction spread (US notably higher)."* Recorded recommendation there: **US $15K → Nigeria $7.5K**. This spec **honors that as the default** and does not re-open it. (Mapping in §5.3.)

### 4.2 Prices & pay from GDP per capita — canonical code formulas

These already exist and are cited as canonical (`locationEffects.ts`, written from the World Bible):

| Output | Formula | Source |
|---|---|---|
| **Price multiplier** (everything you buy in-country) | `priceMultiplier = 0.4 + (GDPPerCaptia/100) × 1.2` → range ~**0.4–1.6×** | `locationEffects.ts` ~L251 |
| **Job pay multiplier** (day-job income for idle units) | `jobPayMultiplier = 0.5 + GDPPerCaptia/100` → range ~**0.5–1.5×** | `locationEffects.ts` ~L260 |
| **Hospital cost mult.** | `priceMultiplier × (healthcare>50 ? 1.2 : 0.8)` | `locationEffects.ts` ~L270 |
| **Training cost mult.** | `priceMultiplier × (higherEducation>50 ? 1.3 : 0.7)` | `locationEffects.ts` ~L276 |
| **Mission reward mult.** | `missionReward = 0.5 + GDPPerCaptia/100` | cited in `11-country-effects-spine.md` §5.1 `[code]` ~L260 |

Worked example (Japan, GDPcap=86): `priceMultiplier = 0.4 + 0.86×1.2 = 1.43×`; `jobPay = 0.5 + 0.86 = 1.36×`. (North Korea GDPcap=43): `price = 0.4+0.43×1.2 = 0.92×`; `jobPay = 0.93×`. Rich = expensive but pays better; poor = cheap but lean.

### 4.3 Sponsor (country) funding — re-anchored to the tier band

The existing `calculateCountryFunding()` (`economySystem.ts`) computes weekly funding from per-capita + military + intel + corruption. It is adopted, with **one correction** so its output lands inside the `Player_Scaling` tier band rather than its hard-coded $5K–$200K range:

```
base   = GDPNational_rating/100                       // R2: national size, 0..1
resMul = 0.5 + (MilitaryBudget + IntelligenceBudget)/200   // [code], 0.5..1.5
raw    = lerp(tier.fundingFloor, tier.fundingCeil, base) × resMul
corruptionTax = min(50, floor(GovernmentCorruption × 0.5)) // [code] — % skimmed
weeklyFunding = round(raw × (1 − corruptionTax/100))
weeklyFunding = clamp(weeklyFunding, tier.fundingFloor, tier.fundingCeil)
```

- **lerp/clamp to the tier band** = the correction (so a Tier-1 org never receives Tier-4 money from a rich sponsor). `tier.fundingFloor/Ceil` come from §4.1.
- `resMul`, `corruptionTax` are the existing code formulas, unchanged.
- **Performance bonus** (per successful mission) keeps the code formula `2000 + ((100 − gdpFactor×100) × 50)` — poorer sponsors pay bigger per-mission bonuses (they need results). Range ~**$2K–$7K** at Tier 1; scales with tier via the same lerp. (Source: `economySystem.ts` `performanceBonus`.)
- **fundingLevel** label thresholds (`minimal<20K / standard<50K / generous<100K / lavish`) retained from code for UI copy.

**reputationThreshold** by government type (`GovernmentPreception`): Full Democracy −25, Flawed Democracy −10, Hybrid Regime +10, Authoritarian +25. (Source: `economySystem.ts` `processCountryFunding`/switch — democracies are patient, authoritarians demand results fast.) If `countryReputation < threshold` → **funding suspended** (the `processCountryFunding` early-return), an email fires (§6).

### 4.4 Mercenary wages & hire terms

**Daily wage** is already paid by `mercenaryPool.ts` on `day_change` (`payDailyWages()` → `store.addMoney(−total)`). The wage value is `MercenaryListing.dailyRate = npc.salary || 200`.

- **Wage floor:** **$200/day** (`mercenaryPool.ts` fallback). Adopted as the Tier-1 generalist floor.
- **Wage scales by rating & local economy.** Rating is the 1–5 star value from `calculateRating()` (avg stat ≥40→5★ … <16→1★). Local cost shifts via `getHiringBonus()` = `corruption/200 − lawEnforcement/100` (corrupt = cheaper, high-law = premium). **RULING R3 — wage = `200 × ratingMult × priceMultiplier(country)`** where `ratingMult = {1:1, 2:1.5, 3:2.5, 4:4, 5:6}`. (Star multipliers are a **RULING** — the data gives the 200 floor and the rating tiers but no explicit per-star $; the curve mirrors JA2's steep top-merc premium and stays affordable at Tier 1: a 1★ merc in a cheap country ≈ $80–200/day.)

**Upfront + profit-take (JA2 / GDD hire screen):** Source FIST GDD v02 (Della Jackson example: **upfront $30,000**, **take = 26% of profit**).

| Term | Value | Source |
|---|---|---|
| `upfront` | `dailyRate × 30 × ratingMult'` (≈ one month's pay as signing fee) | **RULING R4** — anchored so a generalist's upfront ≈ low-thousands and a 5★ named merc ≈ ~$30K, matching the GDD's $30K Della Jackson example |
| `profitTakePct` | **0–40%**, default scales with rating: `{1:0, 2:10, 3:20, 4:26, 5:40}` | The **26%** mid-point is the GDD value (Della = experienced); ladder built around it (RULING) |
| `minContractDays` | **7** (one payday cycle) | **RULING R5** — fire before day 7 → pay remaining days as severance (JA2 desertion analog) |

> **RULING R6 — two hire modes, owner-tunable.** *Salaried* (daily wage only, no profit cut — predictable burn) vs *Cut* (lower/zero daily + `profitTakePct` of rewards — cheap when idle, expensive when winning). Default offered: named World-Bible cast use **Cut** (the GDD screen), procedural pool mercs use **Salaried** (the existing `dailyRate` path). Expose both as a per-listing choice.

### 4.5 Recurring expenses (the weekly burn)

Processed at payday by `processPayday(state, jobIncome, recurringExpenses[], time)` (`economySystem.ts`). The recurring set:

| Expense | Amount | Source |
|---|---|---|
| **Merc daily wages** | Σ `dailyRate` × 7 (paid daily, not at payday) | `mercenaryPool.ts` `payDailyWages` |
| **Base upkeep** | per-facility weekly cost (see `19-base-building`) | **OWNER-FORK (DECISIONS-NEEDED O6):** base-type prices not in source tables; owner to set, constrained "cheapest base affordable on smallest budget (NG $7.5K)." Not re-opened here. |
| **Insurance premium** | scales with collateral history (Public_Perception) | §4.6 |
| **Medical / education / maintenance / travel** | event-driven, priced by §4.2 multipliers | `locationEffects.ts` |
| **Debt interest** | `debt × 0.05` weekly | `economySystem.ts` `debtInterestRate` |

### 4.6 Income & collateral costs (`Public_Perception.csv` — the fame↔money bridge)

`Public_Perception.csv` is the canonical source for **financial consequences of reputation events**. Each row carries a `Financial_Consequence`, `Legal_Cost_Range`, and `Insurance_Impact`. Build-ready extract (verbatim ranges):

| Event | Reputation Δ | Financial / legal cost | Insurance | Source row |
|---|---|---|---|---|
| Street crime stopped | +2 Local | small citizen reward | rates improve | row 2 |
| Property damage minor | +1/−1 | **$5K–$25K** | slight ↑ | row 3 |
| Property damage major | −2 Regional | **$100K–$500K** | +25% | row 4 |
| Civilian casualties minor | −5 National | **$50K–$200K per civilian** | questioned | row 5 |
| Civilian casualties major | −10 Global | **$500K–$5M per civilian** | denied | row 6 |
| Building destruction | varies | **$250K–$10M** | rates skyrocket | row 7 |
| Infrastructure damage | −8 National | **$1M–$50M** | govt review | row 8 |
| Hospital damage | −12 National | **$2M–$20M** | crisis | row 9 |
| School damage | −15 National | **$1M–$15M/school** | review | row 10 |
| Govt building | −20 Intl | **$5M–$100M** | crisis | row 11 |
| Military base | −25 | **$10M–$200M** | review | row 12 |
| Nuclear facility | −50 Global | **$100M–$10B** | global panic | row 13 |
| Mass destruction | −100 Global | **$1B–$1T+** | industry collapse | row 21 |
| Saved lives (civilian) | +5..+20 | civic awards (income) | rates improve | row 14 |
| Prevented disaster | +10..+30 | govt awards (income) | gratitude | row 15 |
| Alien tech recovery | +25 | massive sci funding (income) | — | row 16 |

> **RULING R7 — collateral debits are billed at the *low* end of the range on a Minor outcome and scale toward the *high* end with severity** (number of victims, building tier, jurisdiction hostility). Hostile-jurisdiction multiplier and legal-escalation curve are owned by `17-fame-reputation` / `13-factions` (`DECISIONS-NEEDED.md` K3 owns the *harshness* fork — referenced, not re-opened: recorded rec = **harsh-but-recoverable**).

### 4.7 Investigation / method `$` costs (consumed from spine)

Investigation methods carry a **Resource_Cost tier** (`09-investigations.md`). Default tiers (from `DECISIONS-NEEDED.md` M1, anchored to research economics + Player_Scaling street funding): **Low $5K / Medium $20K / High $75K / Very High $200K**, exposed as CSV-tunable `Method_Cost_Tiers`. Bribe cost uses the spine: corruption-cheapened (`Country_Attribute_Effects.csv` "High corruption: +3CS bribes" → cheaper/effective). **Referenced, not re-opened.**

### 4.8 Black-market / clone / protection prices (consumed from `combinedEffects.ts`)

These already exist and are the economy's "gray market" price source — adopted as canonical:

| Cost | Formula | Source |
|---|---|---|
| Clone (basic) | `50000 × (GDPcap/50) × (1.5 − science/200)` | `combinedEffects.ts` ~L62 |
| Clone (premium) | `5×` basic | ~L65 |
| Black-market weapon price mult. | `max(0.4, 1.5 − corruption/100 − (0.5 − GDPcap/200))` | ~L156 |
| Hitman | `10000 × (2 − corruption/100) × (GDPcap/50)` | ~L170 |
| Crime "protection" (weekly) | `500 + crimePower×20 × (GDPcap/50)` | ~L531 |

---

## 5. How it consumes the SPINE (driver formulas, all cited)

```
GDPPerCaptia  → priceMultiplier (0.4+gdpcap/100×1.2) → ALL purchases, wages, hospital, training, missionReward   [locationEffects.ts]
GDPNational   → sponsor funding scale (lerp over tier band)                                                       [R2 + economySystem.ts]
GovernmentCorruption → corruptionTax on funding (skim, max 50%)  AND  cheaper black market/bribes/mercs           [economySystem.ts + combinedEffects.ts]
Military+Intel Budget → resMul (0.5..1.5) on sponsor funding                                                      [economySystem.ts]
GovernmentPreception  → reputationThreshold to KEEP funding (Dem −25 … Auth +25)                                  [economySystem.ts]
LawEnforcement        → merc/black-market premium (high law = pricier gray market)                                [mercenaryPool getHiringBonus]
Healthcare/HigherEducation → hospital/training cost multipliers                                                   [locationEffects.ts]
Science               → cheaper clones / tech, efficient research economy                                         [combinedEffects.ts]
City type + Pop rating → equipment availability & resource ± (Mega City +3CS resources … Village −2CS)            [City_Type_Effects.csv]
Faction territory     → Home/Ally/Hostile ± on prices & funding (Home = legal immunity, cheaper ops)              [13-factions; Country_Attribute_Effects "FACTION TERRITORY BONUSES"]
Public_Perception     → collateral debits / heroic rewards / insurance premium                                    [Public_Perception.csv]
Player_Scaling tier   → funding band, purchasing ceiling, team-size wage cap                                      [Player_Scaling.csv]
```

### 5.1 The weekly tick (authoritative order of operations)
On **payday** (Monday; `isPayday()` from `timeSystem`), in order:
1. **Sponsor funding** — `processCountryFunding(state, config, rep, time)`; if `rep < threshold`, skip + suspension email (§6).
2. **Day-job income** — Σ idle units' `baseJobPay × jobPayMultiplier(country)` (`locationEffects.ts`); careers/ranks from `Education_Career_Complete` set base pay tiers.
3. **Recurring expenses** — base upkeep, insurance premium, scheduled medical/education, debt interest (§4.5).
4. **Reset** `weeklyIncome/weeklyExpenses`, set `lastPayday = day`.

**Daily** (`day_change`): merc wages (`payDailyWages`), per-diem (travel/medical accruals). **Event-driven** (any time): mission rewards & bonuses (in), purchases/bribes/collateral (out).

### 5.2 Mission reward computation (consumed by `10-email-news` mission completion)
```
reward = baseRewardByMissionType × missionReward(country) × (1 + tierBonus)
       − Σ collateralDebits(Public_Perception)
       − mercProfitTake (Σ active Cut-contract mercs' profitTakePct × reward)
```
`baseRewardByMissionType` ladders with `Player_Scaling` mission XP rows as the relative scale (street smallest → alien-contact largest); **OWNER-FORK F1** (§9) sets the absolute $ per mission type — only the *ratios* are anchored (Player_Scaling rows 8–14). `missionReward(country)` = `0.5 + GDPcap/100`.

### 5.3 Per-faction starting cash (honors DECISIONS-NEEDED O1)
Default mapping inside the Tier-1 band, by faction GDPNational (US highest):

| Faction | Start cash | Basis |
|---|---|---|
| US / FIST | **$15,000** | Tier-1 ceiling; "US notably higher" (O1) |
| China / Collective | **$12,000** | high national economy |
| India / Establishment 24 | **$10,000** | code neutral default |
| Nigeria / Adaptive | **$7,500** | O1 recorded low anchor |

*(All four sit inside `Player_Scaling` Tier-1 `$5K–$15K`. This is the O1 default, not a new fork.)*

---

## 6. UI / UX hooks

- **Phone — Wallet glance (always-on status bar):** `Cash` · `Weekly net` (green/red) · `Runway` (`= floor(cash / weeklyBurn)` weeks; turns amber <4 wks, red <1 wk). Uses `formatCurrency()` (`economySystem.ts`: `$12.0K`, `$2.4M`).
- **Laptop — Budget app (BudgetDisplay.tsx already exists):** weekly income/expense breakdown by category (`getIncomeBreakdown`/`getExpenseBreakdown`), transaction log, **Budget Planner** (`createBudgetPlan` → surplus projection). Opening laptop **pauses time** (Bible §7).
- **Email (priority flags):** *Funding deposited* (low priority), *Funding SUSPENDED — reputation* (priority), *Bankruptcy warning <$5K* (priority), *Collateral invoice / lawsuit* (priority), *Merc desertion / unpaid wages* (priority). (Email-as-dialogue, `10-email-news`.)
- **News (BNN/Point of Interest):** market booms/crises (`dynamicEconomy` MarketCondition) surface as econ headlines that telegraph price swings — a soft "buy now" signal.
- **World-map ping:** entering a country shows a one-line **cost-of-living tag** ("Prices ×1.43 · Pay ×1.36 · Gray market: contacts needed") derived from §4.2/§4.8 bands.
- **Recruitment / merc screen (MercRecruitment.tsx):** show `upfront`, `dailyRate`, `profitTakePct`, star rating, and **"affordable?"** check (`canAfford`). The JA2 hire card (GDD §"GANGSTERS FOR HIRE").
- **Combat overlay (symbolic):** a small **$-risk glyph** on destructible/expensive environment objects (Environmental_Objects carries dollar value + legal tier — e.g. city bus $300k). Throwing a car is *visibly* a money/legal decision. (Bible §5.8; combat stays symbolic — this is a tooltip, not a sim.)

---

## 7. Integration points (reads / writes)

**Reads:** `Player_Scaling.csv` (tier band) · World Bible Country.csv `GDPNational/GDPPerCaptia/GovernmentCorruption/Military/IntelligenceBudget/GovernmentPreception/LawEnforcement/Healthcare/HigherEducation/Science` · `City_Type_Effects.csv` (resource ±, equipment access) · `Public_Perception.csv` (collateral/heroic $) · `Travel_Time_System.csv` (rush-travel 2× cost, `travel_expense`) · faction territory (`13-factions`) · `combinedEffects.ts` (clone/black-market/protection prices) · `locationEffects.ts` (price/pay multipliers).

**Writes / notifies:** `enhancedGameStore` cash (`addMoney`) · merc pool (wage debits, contract state) · email/news generators (funding, suspension, invoices) · hospital/cloning loop (medical debits, `108-`) · base system (upkeep, `19-`) · investigations (method costs, `09-`) · time-travel save (a rewind can restore a pre-collapse cash snapshot — `29-`). **Bankruptcy** (`checkBankruptcy`) → game-over handler (which offers a time-rewind instead of a hard end; see §8 E5).

---

## 8. Edge cases & failure modes

| # | Case | Handling |
|---|---|---|
| E1 | **Missing/blank GDP stat** (World Bible has confirmed blanks, e.g. Serbia Cloning, Nicaragua LSWRegulations) | Treat blank rating as **Medium = 50** before any formula; never `NaN`. (Mirrors `11-spine` E1.) |
| E2 | **Stat out of 0–100** (raw nominal 20–90; Morocco `Population=4992` typo class) | `clamp([0,100])` before use. |
| E3 | **Funding suspended (low rep)** | `processCountryFunding` returns $0 + email; org runs on reserves/missions only. Not instant game-over. |
| E4 | **Cash < $5,000** | `checkBankruptcy` warning email (priority); no penalty yet. |
| E5 | **Cash ≤ 0 AND rep < fundingThreshold** | `isBankrupt = true` → **NOT a hard game-over**: trigger the **time-rewind offer** (diegetic save, `29-`). Hard end only if the player declines/has no rewinds left (sanity exhausted). **RULING R8.** |
| E6 | **Can't pay merc wages** | First missed day → morale hit + desertion-risk email; second consecutive missed payday → merc deserts (`contract.status='deserted'`, pool listing freed). Mirrors JA2. **RULING R9.** |
| E7 | **Negative price from a stacked discount** (e.g. corruption + flooded market) | `max(0.4, …)` floor already in black-market formula (`combinedEffects.ts`); apply a global **price floor 0.3×** so nothing is ever free. **RULING R10.** |
| E8 | **Collateral invoice > cash** | Becomes **debt** (`takeLoan`-style) at the forced 5%/wk; lawsuits (Public_Perception) can escalate jurisdiction over weeks. |
| E9 | **Selling loot** | `equipment_sale` at **50% of priceMultiplier-adjusted value** (resale haircut). **RULING R11** (no source $ for resale; 50% is the JA2 convention). |
| E10 | **Currency display** | `dynamicEconomy.ts` exchange rates are **cosmetic/flavor** for foreign-price display; the treasury is always USD. (R1.) |
| E11 | **Time-rewind & money** | Rewinding restores the cash snapshot of the destination day (money is part of game state). No exploit: rewinds cost sanity/destinations (`29-`), not free. |
| E12 | **Tier-up mid-week** | Funding band changes at next payday, not retroactively; purchasing ceiling lifts immediately. |

---

## 9. Open questions / OWNER-FORK notes

Forks already recorded in `DECISIONS-NEEDED.md` are **referenced, not duplicated**: **O1** (per-faction starting cash — defaulted in §5.3), **O6** (base-type prices — §4.5), **M1** (method `$` cost tiers — §4.7), **K3** (legal/financial harshness — §4.6). New forks this spec surfaces:

- **OWNER-FORK F1 — Absolute mission reward $ by type.** Only the *ratios* are anchored (Player_Scaling XP rows 8–14: street→alien-contact). The owner must set the dollar anchor for one mission type (recommend: **street mission ≈ $3K–$8K** so a Tier-1 org clears ~one merc-month per mission), and the rest scale by the XP ratio. *Rec: anchor street = $5K.*
- **OWNER-FORK F2 — Merc star-wage curve.** §4.4 RULING R3 sets `{1★:1, 2★:1.5, 3★:2.5, 4★:4, 5★:6}` × $200 base. Owner may flatten (gentler) or steepen (JA2-harsh top end). *Rec: keep as-is; expose as CSV `Merc_Wage_Multipliers`.*
- **OWNER-FORK F3 — Profit-take vs salaried default per cast.** §4.4 R6 puts named cast on Cut (26%, the GDD value) and procedural mercs on Salaried. Owner may make it fully player-chosen at hire. *Rec: offer both; default as stated.*
- **OWNER-FORK F4 — Debt/loan source.** Code supports loans (`takeLoan`, 5%/wk) but there's no source table for *who* lends (bank vs criminal) or rates by country. Owner to decide if loans are a feature or only the forced-debt-from-unpaid-invoices path (E8). *Rec: enable criminal loans only in high-corruption/low-law countries (gray-market tie-in), rate = `5% + (100−law)/500` weekly.* (RULING-candidate, pending owner.)
- **Q1 — Investment returns.** `investment_return` category exists but no formula/source. Defer to a future "assets/holdings" mini-system or cut for v1. *Rec: cut from v1; keep the category.*
- **Q2 — Inflation over the 2,472-day campaign.** `dynamicEconomy` has per-currency `inflation`. Does the org's costs drift up over the ~82 real-day campaign (raising late-game pressure), or stay flat? *Rec: flat for v1 (tier-up already raises stakes); revisit if late game feels too easy.*

---

## 10. RULING notes (collected)

- **R1** — One money pool / one source file (`economySystem.ts`); `dynamicEconomy.ts` is a price layer only.
- **R2** — `GDPNational`→funding scale & pool; `GDPPerCaptia`→prices & wages.
- **R3** — Merc wage = `200 × ratingMult × priceMultiplier`, `ratingMult{1:1,2:1.5,3:2.5,4:4,5:6}`.
- **R4** — Merc `upfront ≈ 30 days' pay × rating'` (anchored to GDD's $30K Della Jackson).
- **R5/R6** — 7-day min contract; two hire modes (Salaried / Cut) — named cast default Cut@26%.
- **R7** — Collateral billed low→high across the Public_Perception range by severity.
- **R8** — Bankruptcy offers a time-rewind, not an instant hard game-over.
- **R9** — Two missed paydays → merc desertion.
- **R10** — Global price floor 0.3× (and existing 0.4× black-market floor); nothing is free.
- **R11** — Loot resale at 50% of adjusted value.

---

*Source-traceability: every $ value above traces to `Player_Scaling.csv`, `Public_Perception.csv`, the World Bible Country GDP columns, `Country_Attribute_Effects.csv`, `City_Type_Effects.csv`, `Travel_Time_System.csv`, or an existing canonical code formula in `economySystem.ts` / `locationEffects.ts` / `combinedEffects.ts` / `mercenaryPool.ts`. The only un-sourced numbers are explicitly tagged RULING (consistent with the Bible) or OWNER-FORK (a product decision), per the loop's no-invented-numbers rule.*
