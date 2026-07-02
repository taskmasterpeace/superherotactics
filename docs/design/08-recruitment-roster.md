# 08 — Recruitment & Roster

> **System:** Recruitment & Roster (named World-Bible cast + procedural pool of mercs / vigilantes / foreign nationals / imprisoned super-criminals)
> **Status:** BUILD-READY SPEC
> **Spine consumed:** country `LSWActivity`, `LSWRegulations`, `Vigilantism`, `Population`/`PopulationRating`, `MilitaryServices`/`MilitaryBudget`, `GDPPerCaptia`, `HigherEducation`, `Science`, `GovernmentCorruption`; city `CityType1..4`, `CrimeIndex`, `PopulationRating`; culture region power-affinity; faction territory (Home/Ally/Hostile/Neutral) + faction reputation + faction signature method.
> **Bible anchors:** §4 (Character model, 9 origins, threat scale), §4 ruling #8 (NO XP leveling — train-with-erosion + 1 power via Time Chain), §6.1 (`Country_Attribute_Effects` → ±CS spine), §6.2 (`City_Type_Effects` recruitment bonuses), §6.4 (faction territory ±CS), §7.3 (PERSONNEL app: team / vigilantes / prisoners / obituaries), §7.6 (Recruit daily activity), §8 ruling #9 (combined-effects must be CONSUMED), §9 (`Public_Perception`: Fame gates recruitment), §10 (`Player_Scaling`: tier caps team size / funding / threat cap), §11 (Time-travel save: roster is diegetic state).
>
> **Source tables (read these to re-balance — never hardcode these numbers in code):**
> - `docs/csv-source-data/Character_Builder.csv` — **authoritative** point-buy: Origin (9, rows 2–10) / Threat_Level (Alpha–5, rows 11–16) / Powers / Equipment / Skills with `Cost_Points`, `Stat_Effects`, `Restrictions`. This is the cost model.
> - `docs/csv-source-data/Character_Archetypes.csv` — 20 named sample casts + 7 creation templates (rows 22–28) + faction templates (rows 29–32) with concrete `Stats` strings (e.g. `MEL:65 AGL:55 STR:60 …`).
> - `SuperHero Tactics/SuperHero Tactics World Bible - Country.csv` — the 168-country STAT spine (`LSWActivity`, `LSWRegulations`, `Vigilantism`, `Population`, `MilitaryServices`, `GDPPerCaptia`, `HigherEducation`, `Science`, `GovernmentCorruption`, …).
> - `SuperHero Tactics/SuperHero Tactics World Bible - Cities.csv` — `CityType1..4`, `CrimeIndex`, `SafetyIndex`, `PopulationRating`, `HVT` (named high-value-target seeds).
> - `docs/csv-source-data/Player_Scaling.csv` — **tier table** (rows 2–7): `Team_Size_Limit`, `Funding_Level`, `Threat_Level_Cap` per tier. (Read for caps ONLY — its `Experience_Range` / XP columns are **deprecated** per Bible ruling #8.)
> - `docs/csv-source-data/Game_Mechanics_Spec/Origin_Types.csv` — 9 origins + threat/investigation/public-perception modifiers (rows 14–22) used for procedural generation and pricing.
> - `docs/csv-source-data/Game_Mechanics_Spec/Stat_Rank_Mapping.csv` — FASERIP rank ladder (stat value → rank → Threat Level), used to validate generated stat blocks.
> - `docs/csv-source-data/Game_Mechanics_Spec/Country_Attribute_Effects.csv` — `Population`, `LSWActivity`, `LSWRegulations`, `Vigilantism` recruitment ±CS (rows 3, 25, 27, 29) + combo `LSW Haven: +4CS recruitment` (row 40).
> - `docs/csv-source-data/Game_Mechanics_Spec/City_Type_Effects.csv` — per-city-type `Recruitment_Bonus` (+1..+3CS) + `LSW_Affinity` + the **"Recruitment_Best: use best applicable recruitment bonus (don't stack)"** rule (row 12).
> - `docs/csv-source-data/Game_Mechanics_Spec/Faction_Specification.csv` — faction starting LSWs/budget/reputation (rows 29–33), territory ±CS (rows 21–25), signature recruit-relevant method (rows 36–40).
> - `SuperHero Tactics/SuperHero Tactics Education and Career sheet - Sheet1.csv` — 7 career categories × 5 rank brackets of professions (Della-Jackson "Doctor" style), the procedural profession pool.
> - `docs/csv-source-data/Daily_Activity_Framework.csv` — `ACT_020 Recruitment Activity` (row 21): Organizational, base 6 time-units, needs Leadership, "Population and education affect candidate quality," "success varies by faction reputation."
> - `docs/csv-source-data/Public_Perception.csv` — Fame deltas; `Improved local recruitment` (row 2), `National recruitment becomes harder` (row 5), `easier recruitment` (rows 14–15).
> - `SuperHero Tactics/Combat Compendium REAL - 🎯PERSONALITY TARGET SELECTION🎯.csv` — the 20→preference map every generated character is stamped with (owned by spec 03; this spec only **assigns** it).
> - `SuperHero Tactics/FIST GDD v02.txt` — lines 298–303 (Recruit categories), 518–566 (PERSONNEL app + "GANGSTERS FOR HIRE / UPFRONT $30,000 / 26% of profit" hiring economics), 392 ("not always have access to favorite characters").

---

## 1. Overview & Player Fantasy

Recruitment & Roster is the **front door of the whole game**: before the player ever touches the world map or combat, they pick a faction and stand up a team. It then runs for the entire campaign as the system that **adds, prices, holds, and loses characters.** It has two halves that share one data model:

1. **The named World-Bible cast** — hand-authored, story-load-bearing heroes/leaders (Sandra Locke the Time Walker, Kaiser Eziobi, Liu Xiao, Col. Raghavan Reddy, etc.; the 20 `Character_Archetypes` rows; the per-city `HVT` seeds). These are **fixed entries** — guaranteed stats, fixed personality, scripted availability gated by story/faction/fame. Source: `Character_Archetypes.csv`, World Bible Cities `HVT` column, FIST GDD story §12.
2. **The procedural pool** — generated mercs / vigilantes / foreign nationals / imprisoned super-criminals (FIST GDD line 298–303), **parameterized by the country/city the recruiting draws from** so a Lagos pool ≠ a Tokyo pool. This is the JA2 A.I.M./M.E.R.C. mechanic crossed with the SHT spine.

The player fantasy (FIST GDD lines 17, 392, 394): *"I am the boss of a private super-team. I shop a roster of distinct, expensive, sometimes-unavailable individuals — a vibranium-shield super-soldier here, an imprisoned pyrokinetic I sprang from a Cairo black-site there — and I assemble the squad my mission and my budget actually allow."* The tension the system must produce: **you can't have everyone** — money, fame, faction reputation, threat-level cap, team-size cap, and personal-life unavailability all say no.

**Non-goals (scope guards):**
- This system does NOT design personality behavior (spec 03 owns the 20-type → target-preference map and like/hate matrix; this system only *assigns* a type at generation and *reads* relationships for roster display).
- It does NOT run combat, training stat-changes, hospital/cloning, or the email transport (Recruit emails are authored by the events engine, spec 02; this system supplies the *candidate payload*).
- It does NOT level characters up. Per Bible ruling #8, there is **no XP**. `Player_Scaling`'s XP columns are read ONLY for the tier-gate thresholds (team size / funding / threat cap), and even those are re-expressed as **Fame thresholds** (§3.7) so the build never stores XP.
- Multiplayer only ever *reads* the roster (the time-traveler's other dimension); design the roster as serializable single-player state with no MP-only fields.

---

## 2. Data Schema (fields / types)

### 2.1 `RecruitCategory` (enum)

From FIST GDD lines 300–303 + the named cast:
```ts
type RecruitCategory =
  | 'NAMED_CAST'        // hand-authored World-Bible entry (Archetypes / HVT)
  | 'FORMER_MILITARY'   // ex-PMC/soldier, often Skilled/Altered origin
  | 'FOREIGN_NATIONAL'  // recruited abroad; LSW Threshold Treaty friction (§5.4)
  | 'VIGILANTE'         // public independent; Vigilantism law gates legality
  | 'IMPRISONED_CRIMINAL'; // sprung/paroled super-criminal; loyalty penalty (§3.6)
```

### 2.2 `CharacterTemplate` (static reference data — the named cast + creation templates)

Loaded at boot, immutable. One row per `Character_Archetypes.csv` data row.
```ts
interface CharacterTemplate {
  id: string;                 // "ARCH_001" … or "TPL_BALANCED" …
  codeName: string;           // "Captain America"
  realName: string;           // "Steve Rogers"
  category: RecruitCategory;  // NAMED_CAST for ARCH_*; n/a for TPL_*
  archetypeType: string;      // "Enhanced Soldier" (free-text label)
  faction: FactionId | 'Independent' | 'Criminal' | 'Law Enforcement' | …;
  stats: PrimaryStats;        // parsed from "MEL:65 AGL:55 STR:60 STA:70 INT:45 INS:50 CON:65"
  powers: string[];           // parsed from Powers col
  equipment: string[];        // parsed from Equipment col
  skills: Record<string, number>; // "Leadership 4, Shield Combat 3" → {Leadership:4,…}
  background: string;
  combatRole: 'Tank'|'DPS'|'Support'|'Control'|'Assassin'; // from Combat_Role taxonomy
  personalityTypeId: number;  // 1..20 (RULING map §3.3 — sole authority is spec 03's enum)
  // availability gates (RULING values, §3.7):
  fameRequired: number;       // 0..1000 Fame to recruit
  factionGate: FactionId|null;// only recruitable by this faction (null = any)
  storyFlagGate: string|null; // event flag that must be set (e.g. "ANDREWS_RESOLVED")
}
```
> `PrimaryStats = { MEL, AGL, STR, STA, INT, INS, CON }` — all integers 0–150 on the FASERIP scale (`Stat_Rank_Mapping.csv`).

### 2.3 `RecruitCandidate` (generated, lives in the candidate pool)

```ts
interface RecruitCandidate {
  id: string;                 // uuid
  category: RecruitCategory;
  codeName: string; realName: string;
  originId: number;           // 1..9 (Origin_Types.csv)
  threatLevel: 'Alpha'|'1'|'2'|'3'|'4'|'5';
  stats: PrimaryStats;
  powers: string[];           // 0..n from LSW_Powers DB (spec 09 owns the catalogue)
  profession: string;         // from Education_Career sheet (e.g. "Surgeon")
  careerCategoryId: number;   // 1..7 (Education_Career sheet)
  careerRank: number;         // 1..5
  personalityTypeId: number;  // 1..20
  combatRole: 'Tank'|'DPS'|'Support'|'Control'|'Assassin';
  // economics (§3.5):
  upfrontCost: number;        // USD lump sum to hire
  dailyWage: number;          // USD/game-day upkeep
  profitCutPct: number;       // % of mission reward (the "26% of profit" model)
  // origin / availability:
  sourceCountryCode: number;  // country the pool drew from
  sourceCityHVT: string|null; // non-null if seeded from a city HVT
  expiresOnGameDay: number;   // candidate leaves the pool if not hired (§4 churn)
}
```

### 2.4 `RosterMember` (a hired character — the live game entity)

This is the existing `Complete_Character_Sheet` record (~55 fields, Bible §4) plus the recruitment-only fields:
```ts
interface RosterMemberRecruitFields {
  category: RecruitCategory;
  hiredOnGameDay: number;
  contract: { upfrontPaid: number; dailyWage: number; profitCutPct: number };
  loyalty: number;            // 0..100 (§3.6) — drives defection / quit
  availability: AvailabilityState; // §6
  obituary: { died: boolean; deathGameDay: number|null; funeralHeld: boolean }; // §7.3
}
type AvailabilityState =
  | 'AVAILABLE' | 'ON_MISSION' | 'HOSPITAL' | 'PERSONAL_LIFE'
  | 'OFF_THE_GRID' | 'TRAINING' | 'TRAVELING' | 'DEAD_PENDING_FUNERAL';
```

### 2.5 `CandidatePool` (per-faction, regenerated on a tick)

```ts
interface CandidatePool {
  factionId: FactionId;
  candidates: RecruitCandidate[];     // cap = 12 visible at once (RULING §4)
  lastRefreshGameDay: number;
  knownVigilantes: string[];          // ids surfaced via news/investigation (§7.2 PERSONNEL)
  prisonerDatabase: PrisonerEntry[];  // imprisoned super-criminals (§3.6)
}
interface PrisonerEntry {
  candidateId: string; heldInCountryCode: number;
  charges: string; springDifficultyCS: number; // negative CS to extract
  paroleAvailable: boolean;
}
```

---

## 3. Exact Numbers / Tables / Formulas (each cited)

### 3.1 Stat block — origin + threat-level construction (point-buy)

A generated candidate's stat block is **not invented**; it is assembled from `Character_Builder.csv`:

1. **Base stats** start at the relevant creation-template baseline (`Character_Archetypes.csv` rows 22–28). Default procedural baseline = **Balanced** = all stats `50` (row 22: `MEL:50 AGL:50 STR:50 STA:50 INT:50 INS:50 CON:50`).
2. **Origin modifier** applied from `Character_Builder.csv` `Stat_Effects` (rows 2–10). Examples (verbatim):
   | Origin | Code | Stat_Effects | Cost_Points |
   |---|---|---|---|
   | Skilled Human | ORIG_001 | STR +0, AGI +5, INT +3 | 0 |
   | Altered Human | ORIG_002 | STR +3, END +3, INT +0 | 5 |
   | Tech Enhancement | ORIG_003 | STR +5, INT +5, AGI +0 | 10 |
   | Mutated Human | ORIG_004 | Random stat +10, Random stat −5 | 15 |
   | Synthetics | ORIG_006 | STR +10, END +10, INT +5 | 20 |
   | Aliens | ORIG_008 | All stats +5 | 30 |
3. **Threat-level modifier** applied from `Character_Builder.csv` rows 11–16 (verbatim):
   | Threat | Code | Stat_Effects | Cost_Points |
   |---|---|---|---|
   | Alpha | THREAT_A | no supernatural bonus | 0 |
   | Level 1 | THREAT_1 | All stats +5 | 10 |
   | Level 2 | THREAT_2 | All stats +10 | 25 |
   | Level 3 | THREAT_3 | All stats +15 | 45 |
   | Level 4 | THREAT_4 | All stats +25 | 70 |
   | Level 5 | THREAT_5 | All stats +40 | 100 |
4. **Validation:** the resulting stat block's STR must place it on the correct rank rung (`Stat_Rank_Mapping.csv`): Alpha→Excellent(21–30), L1→Remarkable(31–40), L2→Incredible(41–50), L3→Amazing(51–75), L4→Monstrous(76–100), L5→Unearthly(101–150). If a generated stat falls outside its threat band, clamp to the band edge (`Stat_Rank_Mapping.csv` Stat_Value_Min/Max).

> `END` in `Character_Builder.csv` maps to **STA**; `AGI`→**AGL**; `WIS`→folded into **CON** (the 7-stat model has no WIS — Bible §3.1). This rename is mechanical, not a new number.

### 3.2 Build-point budget per `Player_Scaling` tier → the candidate's power level

The total `Cost_Points` a generated candidate may spend = a **tier budget**, derived from `Player_Scaling.csv` `Threat_Level_Cap` (the only legitimate use of that table per ruling #8):

| Player tier (`Player_Scaling` row) | Threat_Level_Cap | Max candidate `Cost_Points` (RULING §3.2) |
|---|---|---|
| 1 Street Operative | Alpha–L1 | 25 |
| 2 City Defender | L1–L2 | 45 |
| 3 Regional Agent | L2–L3 | 75 |
| 4 National Operative | L3–L4 | 130 |
| 5 International Coordinator | L4–L5 | 200 |
| 6 Cosmic Guardian | L5+ | 300 |

> **RULING §3.2:** these budgets = the `Cost_Points` of the **highest threat level allowed at that tier** plus a typical origin+1 power, rounded. They are derived (Threat L1=10…L5=100 from `Character_Builder.csv`), not free invention. A candidate above the player's `Threat_Level_Cap` does **not** spawn in the recruitable pool (it spawns as an *enemy* instead — that path is owned by the events engine, spec 02).

### 3.3 Personality assignment

Every generated candidate is stamped with `personalityTypeId ∈ 1..20`. Source distribution = **uniform random 1–20** unless the city's `LSW_Affinity` biases it (RULING §3.3: e.g. Military city → bias toward disciplined types). The actual *behavior* of each id is owned by spec 03 / `PERSONALITY TARGET SELECTION` (the 20-value row `1,3,4,4,1,3,4,1,2,2,1,4,2,3,3,3,2,5,5,2`). Named cast use the fixed `personalityTypeId` in their template.

### 3.4 Origin / threat / public-perception riders (pricing inputs)

From `Origin_Types.csv` rows 14–22, each origin carries a **public-perception modifier** that this system reads into both pricing and recruitment difficulty:
| Origin | Threat mod | Public_Perception mod |
|---|---|---|
| Skilled Human | 0 | +20 trust |
| Altered Human | −1 (sympathy) | variable |
| Mutant | +1 (fear) | −20 trust |
| Tech Enhancement | 0 | −10 trust |
| Mystic | +1 (unknown) | variable |
| Alien | +2 (xenophobia) | −30 initial trust |
| Cosmic | +3 (power) | awe/fear |
| Divine | +2 (divine) | −10 |
| Construct | +1 (artificial) | −20 (uncanny valley) |

### 3.5 Recruitment economics (upfront + wage + profit cut)

Anchored to the only hard number in the source — FIST GDD lines 550–554, the "GANGSTERS FOR HIRE" card: **Della Jackson, profession Doctor, UPFRONT $30,000, profit cut 26%.** That single sample fixes the model shape (lump-sum + percentage cut, JA2-style). The build:

```
upfrontCost  = BASE_UPFRONT[careerRank] × threatMult × originMult × fameAvailDiscount
dailyWage    = round(upfrontCost × 0.02)        // RULING §3.5: 2% of upfront/day (JA2 daily-merc feel)
profitCutPct = clamp( 20 + (threatLevelIndex × 3) , 20 , 40 )   // anchors the 26% sample at ~L2
```
- `BASE_UPFRONT[careerRank 1..5]` = `{1:$5K, 2:$15K, 3:$30K, 4:$60K, 5:$120K}` — **RULING §3.5**, the $30K Della anchor placed at rank 3 (a "Doctor"/Surgeon sits at career-category-1 rank 2–3 in the Education sheet), doubling per rank. `careerRank` comes from the Education/Career sheet (§3.8).
- `threatMult` = `{Alpha:1.0, L1:1.5, L2:2.5, L3:4.5, L4:7.0, L5:10.0}` — **RULING §3.5**, mirrors the `Cost_Points` curve (10/25/45/70/100 from `Character_Builder.csv`, normalized to ×).
- `originMult` = `1.0 + max(0, −publicPerceptionMod/100)` so feared origins (Alien −30 → ×1.30) cost more to retain. (Inputs from §3.4 — derived, not invented.)
- `fameAvailDiscount` = `clamp(1 − Fame/2000, 0.5, 1.0)` — high Fame makes mercs *cheaper* (they want to work for you). **RULING §3.5**, ties to `Public_Perception` "easier recruitment" (rows 14–15) and "Hero status; easier recruitment" (row 15).
- `profitCutPct` anchored so **threatLevelIndex(L2)=2 → 26%**, exactly reproducing the Della card.

`threatLevelIndex` = `{Alpha:0, 1:1, 2:2, 3:3, 4:4, 5:5}`.

> **OWNER-FORK §3.5-A:** the constants `BASE_UPFRONT`, the 2% daily-wage ratio, and the `profitCutPct` slope are a product-economy choice. They reproduce the one shipped sample exactly but the rest of the curve is a designer dial. Ship them in a `RecruitEconomy.csv` so they re-balance without code (Pillar #1).

### 3.6 Loyalty (start value + category penalties)

```
loyalty (0..100 at hire) = 50
  + (personality.loyalty × 30)            // §03 personality trait, 0..1
  + (sameFactionHomeCountry ? +10 : 0)    // Faction_Specification home territory
  − categoryPenalty
categoryPenalty = { IMPRISONED_CRIMINAL: 25, FOREIGN_NATIONAL: 10, others: 0 }  // RULING §3.6
```
- `IMPRISONED_CRIMINAL` penalty (RULING §3.6): sprung criminals start untrustworthy — ties to `Public_Perception` and the GDD's "currently imprisoned Super Criminals" recruit path (line 303). Below loyalty 20 a member may **defect or quit** on the world-state tick (handler owned by spec 03 / events engine; this spec only sets the value and exposes it).
- Loyalty is read/written by: missions (success +, civilian harm −), pay (unpaid wage −5/day overdue), relationship friction (spec 03). This spec **defines and initializes** it; it does not run the decay loop.

### 3.7 Availability gates for the NAMED cast & Fame thresholds

Fame thresholds replace `Player_Scaling`'s XP gate (ruling #8). The tier the player has *reached* is itself Fame-gated:

| Player tier | Fame to reach (RULING §3.7) | Team_Size_Limit (`Player_Scaling`) | Funding_Level (`Player_Scaling`) | Threat_Level_Cap |
|---|---|---|---|---|
| 1 Street Operative | 0 | 1–2 | $5K–$15K | Alpha–L1 |
| 2 City Defender | 100 | 2–4 | $15K–$50K | L1–L2 |
| 3 Regional Agent | 250 | 3–6 | $50K–$150K | L2–L3 |
| 4 National Operative | 500 | 4–8 | $150K–$500K | L3–L4 |
| 5 International Coordinator | 750 | 6–12 | $500K–$2M | L4–L5 |
| 6 Cosmic Guardian | 1000 | 8–15 | $2M+ | L5+ |

> **RULING §3.7:** Team_Size_Limit / Funding_Level / Threat_Level_Cap are taken **verbatim** from `Player_Scaling.csv` rows 2–7. Only the *gate currency* changes from XP→Fame (0/100/250/500/750/1000, the `Public_Perception` Reputation scale). A roster may never exceed the upper bound of `Team_Size_Limit` for the player's tier (failure mode §5.1).

Named cast also obey `factionGate` and `storyFlagGate` (e.g. Sandra Locke the Time Walker is a US/FIST asset gated by the story; `Character_Archetypes.csv` ARCH_005).

### 3.8 Procedural profession & career rank

`profession` + `careerCategoryId` (1–7) + `careerRank` (1–5) are drawn from `SuperHero Tactics Education and Career sheet - Sheet1.csv`. The 7 categories and example rank-bracket professions (verbatim):
| Cat | Name | R1 examples | R5 example |
|---|---|---|---|
| 1 | Medical & Life Sciences | Clinical Physician, Vet, Botanist, Pharmacist | Mutagenics Researcher |
| 2 | Visual & Performance Arts | Fashion Model, Dancer, Indie Musician | (—) |
| 3 | Liberal Arts | School Teacher, Journalist, Photographer | THE PRESIDENT |
| 4 | Engineering/Tech | IT Technician, Motor Mechanic | Rocket Scientist, Nuclear Physicist |
| 5 | Business | Bank Teller, Store Manager, Accountant | Megacorp Owner |
| 6 | Psychology | School Counselor, Priest, Fortune Teller | Wizard |
| 7 | Physical | Construction Worker, Police Officer, Pro Sports | Pro-MMA Fighter (R2) |

Career rank ↑ raises `careerRank` in the economics (§3.5) and unlocks the laptop research/tech the recruit can do (Bible §7.6) — but does **not** raise combat stats (ruling #8). `FORMER_MILITARY` candidates draw from category 7 (PMC Soldier rank 2) preferentially; `FOREIGN_NATIONAL` skew toward the source country's strong stats (high `Science`→cat 4, high `Healthcare`→cat 1).

---

## 4. How It Consumes the SPINE (the formula)

The **recruitment difficulty CS** and the **pool size/quality** at the player's current location are computed from the country/city/faction the recruiting draws from. This is ruling #9 made concrete — the spine is *consumed*, not just displayed.

### 4.1 Recruitment CS (drives `ACT_020` success on the Universal Table)

```
recruitCS =
    countryLSWActivityCS          // Country_Attribute_Effects row 25: Low −2 / Med 0 / High +2
  + countryPopulationCS           // Country_Attribute_Effects row 3: <36 −2 / 36–65 0 / >65 +2
  + lswRegulationCS               // LSWRegulations: Banned −3 (public ops) / Regulated 0 / Legal +2  (row 27)
  + vigilanteCS                   // VIGILANTE category only — Vigilantism: Banned −3 / Reg 0 / Legal +2 (row 29)
  + cityRecruitBonusCS            // City_Type_Effects: BEST single applicable bonus, +1..+3 (DO NOT STACK — row 12)
  + factionTerritoryCS            // Faction_Specification rows 21–25: Home +3 / Ally +1 / Neutral 0 / Hostile −2
  + factionReputationCS           // RULING §4.1: floor(Fame/250) capped ±3 (Public_Perception "faction reputation")
  + cultureAffinityCS             // Culture_Region_Effects: matching power affinity +2 (spec 04 owns codes)
  + LSW_HAVEN_BONUS               // +4 if (LSWActivity High AND LSWRegulations Legal) — combo, Country_Attribute_Effects row 40
```

> **`cityRecruitBonusCS` (do-not-stack) is load-bearing:** `City_Type_Effects.csv` row 12 says explicitly *"Use best applicable recruitment bonus (don't stack)."* A multi-type city (CityType1..4) takes the **single highest** of: Military +3, Educational +3, Industrial/Seaport/Mining/Company +2, Temple +2, Political/Resort/Village +1. The matching `LSW_Affinity` also biases which **origin/power archetype** the pool generates (Military→Combat/Tech origins; Temple→Mystic/Divine; Educational→high-INT Tech/Mutant; Seaport→Water powers; Mining→Strength/Earth).

### 4.2 Pool size & refresh

```
poolSize = clamp( round( BASE_POOL × lswActivityFactor × populationFactor ) , 1 , 12 )
  BASE_POOL = 4
  lswActivityFactor = LSWActivity High 1.5 / Med 1.0 / Low 0.5   (Country_Attribute_Effects row 25 sign)
  populationFactor  = PopulationRating High 1.5 / Med 1.0 / Low 0.5 (row 3)
```
- **RULING §4.2:** `BASE_POOL = 4` mirrors `Faction_Specification.csv` starting-LSW counts (US 5 / IN 4 / CN 6 / NG 4, mean ≈ 4.75 → 4 floor). `12` cap = the PERSONNEL screen's practical list length. Refresh every **30 game-days** (= 1 real day, Bible §6.5 time ratio); on refresh, candidates past `expiresOnGameDay` churn out and new ones spawn. `IMPRISONED_CRIMINAL` candidates do not churn (they sit in the prisoner DB until sprung).

### 4.3 Candidate quality skew

Within the tier `Cost_Points` budget (§3.2), the **mean threat level** of generated candidates skews up with `LSWActivity` and the country's `Science`+`HigherEducation` (the Education/Career rank pool quality, per `ACT_020` note "Population and education affect candidate quality"). High-`Science` countries generate Tech/Mutant origins at higher career ranks; Banned-`LSWRegulations` countries generate fewer LSW-origin candidates and more plain `FORMER_MILITARY` (Skilled Human).

---

## 5. Edge Cases & Failure Modes

1. **Roster at `Team_Size_Limit`.** Recruit action is offered but **Hire is disabled** with reason "Team full (tier cap N) — promote to next tier or release a member." (Cap from `Player_Scaling`, §3.7.) Never silently drop an existing member.
2. **Can't afford `upfrontCost`.** Hire disabled; show shortfall. If the player can afford upfront but not projected `dailyWage`, allow hire but flag **"wage risk"** (unpaid wage → loyalty −5/day → defection at loyalty<20, §3.6).
3. **Candidate above `Threat_Level_Cap`.** Never appears in the recruit pool (spawns as enemy instead, §3.2). If a *named* cast member's threat exceeds the cap, they appear **greyed-out** with "Requires National Operative tier" — visible aspiration, not hireable.
4. **Recruiting in Banned-`LSWRegulations` / Banned-`Vigilantism` country.** `recruitCS` goes deeply negative (−3 each); the `ACT_020` roll usually fails AND a failed roll can trigger a `Public_Perception` legal event (`+2CS if caught as victim` becomes a *liability* — arrest/detection). Surface the risk before the roll.
5. **Foreign national + LSW Threshold Treaty.** A `FOREIGN_NATIONAL` LSW cannot legally cross borders (Bible §12 treaty). Recruiting one is legal *in their country* but **deploying them across a border** is an illegal act handled by Travel (spec 05) — recruitment must **stamp `treatyRestricted=true`** so downstream travel knows. Failure to flag = silent illegal deploy bug.
6. **Imprisoned criminal extraction fails.** If the spring/parole roll fails, candidate stays in prison, faction reputation with the holding country drops (`Faction_Specification` hostile shift), and the candidate's `springDifficultyCS` worsens by −1 (they're now watched). No infinite-retry farming.
7. **Hiring a candidate that expired this same tick.** Resolve hire **before** churn in the tick order; if the player clicked a now-expired candidate, show "This recruit took another offer" (JA2 flavor) and refund nothing (no cost was charged).
8. **Named cast death then re-recruit.** A dead `NAMED_CAST` member stays on the roster as `DEAD_PENDING_FUNERAL` until the funeral (§7.3); they cannot be re-recruited unless **cloning** resurrects them (country-gated, spec 108). "Some return like comics" (Bible §12) = a story flag, not a free re-hire.
9. **Save/time-travel rewind.** The full `CandidatePool` + `Roster` are diegetic state (Bible §11). A rewind restores the exact pool snapshot — a candidate the player let expire **comes back** on rewind (this is a feature, not a dupe bug). Pool RNG must be **seeded from (gameDay, factionId, countryCode)** so rewind regenerates identically.
10. **Two factions recruit the same vigilante (MP stub).** Single-player: vigilante belongs to whichever faction hires first; the other sees them as `HIRED elsewhere`. Field design leaves room for MP contention but resolves locally now.
11. **Generated stat outside threat band.** Clamp to band edge (§3.1 step 4); never ship an L1 with Monstrous STR.

---

## 6. UI/UX Hooks

| Surface | Hook |
|---|---|
| **Phone — Recruit email (events engine, spec 02)** | Inbox item "GANGSTERS FOR HIRE" / "Vigilante of interest" with the candidate card: name, profession, origin glyph, threat pips, UPFRONT / wage / cut (the Della-Jackson card layout, GDD line 546). Reply-to-hire = Send (Bible §7.1 email-as-dialogue). |
| **Laptop — PERSONNEL app** (Bible §7.3) | Four lists: **Team** (RosterMembers + availability badge + loyalty bar + love/hate emojis from spec 03), **Vigilantes** (`knownVigilantes` — surfaced by news/investigation), **Prisoners** (prisoner DB + springDifficulty + parole), **Obituaries** (DEAD_PENDING_FUNERAL until funeral). |
| **Laptop — Recruit activity (ACT_020)** | Assign a member with Leadership to recruit; shows live `recruitCS` breakdown (§4.1) so the player sees *why* this city is good/bad — the spine made visible. 6-time-unit cost (Daily_Activity_Framework row 21). |
| **World map — sector panel** | Recruiting a sector shows pool size + dominant origin affinity (from city LSW_Affinity), a "good hunting ground" hint when LSW Haven combo fires (+4CS). |
| **Candidate detail modal** | Full stat block (FASERIP ranks), powers, profession, contract terms, public-perception/loyalty warnings (feared origin, criminal penalty, treaty restriction). |
| **Combat overlay** | Recruitment writes nothing live to combat; but the **roster pre-combat squad-select** reads `availability` (only AVAILABLE/ON_MISSION members are deployable) and the personality glyph drives AI target choice (spec 03). |

---

## 7. Integration Points (reads / writes)

**Reads:**
- World Bible Country/Cities STATs (the spine) — §4.
- `Player_Scaling` (tier caps), `Public_Perception`/Fame (gates, discounts, loyalty) — §3.7, §3.5, §3.6.
- `Faction_Specification` (starting roster/budget/reputation, territory CS, signature method) — §4.1.
- `Character_Archetypes` / `Character_Builder` / `Origin_Types` / `Education_Career` (generation + cost) — §3.
- Culture_Region_Effects (affinity CS — spec 04), Universal_Table_FIXED (the `ACT_020` roll — Bible §3).

**Writes:**
- `Roster` (the team list every other system iterates) — combat squad-select, world-map deploy, hospital, training, daily activities all read it.
- `loyalty`, `availability`, `contract` on each member (consumed by economy tick, spec 03 friction, missions).
- `treatyRestricted` flag on foreign-national LSWs (consumed by Travel, spec 05).
- `prisonerDatabase` (consumed by CovertOps spring missions, spec 109).
- `obituary` (consumed by the funeral event, spec 03/108).
- Fame deltas on recruitment-relevant `Public_Perception` events (e.g. recruiting a feared criminal can cost local Fame).

**Owned-elsewhere (this spec must NOT duplicate):** the email transport (02), personality behavior + like/hate matrix (03), travel/treaty enforcement (05), hospital/cloning resurrection (108), prisoner extraction missions (109), the power catalogue (09), combat (the tactical specs).

---

## 8. RULING: notes (collected)

- **§3.2** Tier build-point budgets {25/45/75/130/200/300} derived from `Character_Builder` threat `Cost_Points`, not invented.
- **§3.3** Personality assignment = uniform 1–20, city-affinity-biased; behavior owned by spec 03.
- **§3.5** Economics shape (upfront + 2%/day wage + 20–40% profit cut) anchored to the single shipped sample (Della Jackson $30K / 26%); all other constants are designer dials shipped in `RecruitEconomy.csv`.
- **§3.6** Loyalty start 50 + traits + home −category penalty; IMPRISONED −25, FOREIGN −10.
- **§3.7** Tier gates re-expressed XP→Fame {0/100/250/500/750/1000}; caps verbatim from `Player_Scaling`.
- **§4.1** `factionReputationCS = floor(Fame/250)` capped ±3.
- **§4.2** `BASE_POOL = 4` from faction starting-LSW mean; 30-game-day refresh; seeded RNG for rewind-determinism.
- **§4.1 (do-not-stack)** city recruit bonus uses the single best applicable type, per `City_Type_Effects` row 12 — **not** invented; a direct ruling enforcing the source note.

## 9. OWNER-FORK: notes

- **§3.5-A — recruitment economy curve.** `BASE_UPFRONT` per career rank, the 2% daily-wage ratio, and the profit-cut slope are a monetization/difficulty choice. They reproduce the one canonical sample exactly; the rest of the curve is the owner's dial. Ship `RecruitEconomy.csv`.
- **OF-B — named-cast Fame/story gates.** Exactly which World-Bible cast are recruitable by which faction at which Fame/story-flag (§3.7) is authored content — the owner/writers set per-character gates. The spec fixes the *mechanism*; the *casting list* is theirs.
- **OF-C — imprisoned-criminal morality.** Whether springing super-criminals carries a permanent Fame/legal stain (vs a clean parole path) is a tone choice for the writers; default ruling applies a loyalty penalty only.
- **OF-D — pool churn aggression.** 30-game-day refresh and the 12-slot cap trade "always something new" against "the merc I wanted is still there." Owner may want named cast to *never* churn while procedural pool churns fast.

## 10. Open Questions

1. **Where do generated `powers` come from?** This spec stamps `powers[]` but the LSW power catalogue + per-origin/per-affinity weighting is owned by spec 09 (`LSW_Powers_Complete_Database`). Need spec 09 to expose a `samplePowersFor(originId, threatLevel, cityAffinity)` so generation isn't blocked.
2. **Profit-cut accounting.** Does `profitCutPct` come off the gross mission reward before or after collateral-damage costs (`Public_Perception` financial consequence)? Recommend **before** (merc gets paid off the win, you eat the damage) — needs economy-system (spec 02/world) sign-off.
3. **Multiplayer vigilante contention** (§5.10) — deferred to the MP dimension stub (spec 107); confirm the roster field shape is MP-forward (a `claimedByFaction` field) even though unused now.
4. **Faction starting roster identity.** `Faction_Specification` gives counts (US 5 / CN 6 / …) but not *which named cast*. Recommend the writers pin a fixed starting roster per faction (links to OF-B).
5. **Erosion + recruitment interaction.** Ruling #8 says skills/stats erode without training. Does a *just-recruited* merc arrive with erosion already in progress, or fresh? Recommend fresh-at-hire, erosion starts on the first idle day (needs training-system, spec TBD, agreement).
