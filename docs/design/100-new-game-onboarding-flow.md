# 100 — New-Game / Onboarding & Faction-Start Flow

> **System:** New-Game / Onboarding & Faction-Start Flow
> **Status:** BUILD-READY spec (developer-ready, zero-follow-up target)
> **Author lens:** senior game-systems designer
> **Anchors:** Bible §0 (core loop), §6.4 (factions), §10 (Player_Scaling tier-1 start), §11 (time-travel save), §13 (rulings)
> **Primary source tables:**
> - `docs/csv-source-data/Game_Mechanics_Spec/Faction_Specification.csv` (factions, starting resources, win conditions, territory CS)
> - `docs/csv-source-data/Player_Scaling.csv` (Tier-1 Street Operative: scope, team size, funding, threat cap)
> - `docs/csv-source-data/Game_Mechanics_Spec/Origin_Types.csv` (9 origins, threat/perception modifiers)
> - `docs/csv-source-data/Character_Creation_Wizard.csv` (random/point-buy/faction-appropriate generation methods + probability weights)
> - `docs/csv-source-data/SuperHero Tactics World Bible - Country.csv` / `- Cities.csv` (35 country columns, 10-type city/crime/sector data — the SPINE)
> - `docs/csv-source-data/Game_Mechanics_Spec/Country_Attribute_Effects.csv`, `City_Type_Effects.csv`, `Culture_Region_Effects.csv` (stat → ±CS effect maps)
> - `docs/csv-source-data/Game_Mechanics_Spec/Travel_Time_System.csv` + `docs/csv-source-data/Time_Management.csv` (clock ratios, sector grid, countdown)
> - `docs/csv-source-data/Game_Mechanics_Spec/Primary_Stats_Spec.csv` (7 stats, derived formulas)
> - `SuperHero Tactics/Combat Compendium REAL - 🎯PERSONALITY TARGET SELECTION🎯.csv` (20 personalities → AI target preference)
> - `SuperHero Tactics/FIST GDD v02.txt` (story frame, time-walker, 2472-day countdown)
> - `SHT_MECHANICS_BIBLE.md` (the spine + rulings the flow must honor)
>
> **Existing code this spec formalizes / corrects:**
> `MVP/src/stores/enhancedGameStore.ts` (gamePhase state machine, `selectFaction/selectCountry/selectCity`, `budget`, `currentSector`, `doomClock`), `MVP/src/components/FactionSelection.tsx`, `MVP/src/components/CountrySelection.tsx`, `MVP/src/components/FixedCitySelection.tsx`, `MVP/src/components/RecruitingPage.tsx`, `MVP/src/App.tsx` (phase router).

---

## 1. Overview & player fantasy

**Player fantasy.** "I am the spymaster-general who just got handed a nation, a countdown, and a phone." The opening is not a menu — it is the first move in a grand-strategy game. In ten minutes the player picks *who they answer to* (faction), *where they stand* (country → city), *what they build* (base), and *who they bleed for* (the starting LSWs/mercs). Then the laptop boots, the world clock starts ticking toward the alien armada (Bible §0; FIST GDD line 330: invasion arrives "in precisely 2472 days"), and the world is already alive and talking to them.

**Design intent (honoring the locked context).**
- The onboarding is the **Location Cascade** (Bible §2) made interactive: every choice the player makes here pre-computes the ±CS environment they will live in. Choosing Lagos is not flavor — it sets recruitment rate, legality, prices, healing speed, encounter frequency.
- The flow **ends inside the diegesis**, not at a "Start" button: it terminates by booting the laptop/phone (Bible §7), so the meta-game UI *is* the first thing the player touches (Pillar #5, "UI is gameplay").
- The **time-travel save** (Bible §11) is introduced here as the ONLY save: a "New Game" is the Time Walker's *first* arrival in this timeline. There is no normal save slot to create.
- **Multiplayer is a stub** (Bible §15): the flow writes a `region_seed` and `dimension_id` so a later MP layer can seed players into different regions (Player_Scaling row `Server_Balance_Geographic`) without redesign. We do not build MP.

**Canonical phase chain (the core loop, Bible §0).**
`Country → City → Base → Recruit → Equip → World Map`, with **Faction** prepended (Faction_Specification.csv is the top of the spine, Bible §6.4). The shipped store currently runs `faction-selection → country-selection → city-selection → recruiting → playing` (`enhancedGameStore.ts:315`) and **collapses Base + Equip into implicit steps**. This spec promotes Base and Equip to first-class onboarding phases and inserts a **Difficulty/Start-Mode** gate, while keeping the existing phase enum backward-compatible.

---

## 2. The phase state machine

### 2.1 Canonical phases (extends the shipped enum)

| # | Phase id (`gamePhase`) | Player does | Writes to store | Source |
|---|---|---|---|---|
| 0 | `title` | New Game / Continue / Numbers (phone cheat-codes) | — | RULING (new) |
| 1 | `start-mode` | Pick Start Preset (Canon / Custom / Quickstart) + difficulty toggles | `startPreset`, difficulty flags | RULING (new) |
| 2 | `faction-selection` | Pick 1 of 4 factions | `selectedFaction`, faction bonuses, `budget`, `startingReputation` | Faction_Specification.csv §FACTION STARTING RESOURCES |
| 3 | `country-selection` | Pick base country (default = faction home; any of 168 allowed) | `selectedCountry`, `selectedCountryCode`, territory tier | World Bible Country.csv; Faction_Specification §TERRITORY |
| 4 | `city-selection` | Pick base city within country | `selectedCity`, `currentSector`, `localNewspaperName`, cultureCode | World Bible Cities.csv; `selectCity()` already in store |
| 5 | `base-setup` | Choose base type + name HQ | `baseId`, base facilities, `budget` debit | Bible §6 base building; `baseSystem.ts` |
| 6 | `recruiting` | Pick starting LSWs/mercs up to roster cap | `characters[]`, squad formed | Player_Scaling tier-1; Faction_Specification §STARTING; Character_Creation_Wizard.csv |
| 7 | `equip` | Assign starting loadout from faction/city equipment access | per-character equipment | City_Type_Effects.csv equipment access; `equipmentTypes.ts` |
| 8 | `boot` | Cinematic laptop boot + Time-Walker intro + first email | `doomClock` armed, clock starts | Bible §7, §11; FIST GDD time-walker |
| 9 | `playing` | World map / laptop live | `gamePhase='playing'`, `currentView='world-map'` | shipped |

> **RULING — backward compatibility.** Keep the four shipped enum values (`faction-selection`, `country-selection`, `city-selection`, `recruiting`, `playing`). ADD `title`, `start-mode`, `base-setup`, `equip`, `boot`. The App router (`App.tsx:490-496`) gains five new branches. The F2 dev-jump panel (`App.tsx:279-292`) gains buttons for the new phases.

### 2.2 Transition rules (deterministic; no ambiguity)

- Each phase has **Back** (returns to previous phase, restoring its committed value as editable) and **Confirm** (validates, commits, advances). Back from `faction-selection` returns to `start-mode`; Back from `title` is a no-op.
- **Confirm validation** per phase is in §6 (Edge cases). A phase cannot advance until its validator returns `ok`.
- **No timer runs before phase 8 (`boot`).** The world clock (`Time_Management.csv` base ratio 1 real day : 30 game days) is *paused* during setup. It starts the instant `boot` completes. Source: Bible §11 ("Time advances continuously on the world layer … pausable in the laptop") + Time_Management.csv `Base_Time_Flow`.
- **Skip-ahead (Quickstart preset)** auto-fills phases 3–7 with preset defaults (§3.2) and jumps straight to `boot`. Faction is still chosen (it defines the campaign).

```
title → start-mode → faction-selection → country-selection → city-selection
      → base-setup → recruiting → equip → boot → playing
                                   ▲ Quickstart preset auto-fills 3..7, jumps to boot
```

---

## 3. Data schema

### 3.1 New-game configuration object (persisted as the campaign seed)

```ts
// NEW: MVP/src/data/newGameConfig.ts
export interface NewGameConfig {
  // --- identity / save ---
  campaignId: string;          // uuid; this IS the diegetic save id (Bible §11)
  dimensionId: string;         // RULING: 'prime' for SP; reserved for MP (Bible §15)
  regionSeed: number;          // RULING: derived from base sector; MP geo-balance hook
  createdRealTimestamp: number;

  // --- start mode (phase 1) ---
  startPreset: 'canon' | 'custom' | 'quickstart';
  difficulty: {
    permadeath: boolean;       // default true (Bible §1 pillar 2)
    rewindBudget: 'tense' | 'lenient'; // maps to time-walker destinations (§5.6)
    economyMult: number;       // 1.0 default; affects startingBudget (OWNER-FORK)
    enemyScaling: number;      // 1.0 default; multiplies encounter rate
  };

  // --- faction (phase 2) ---
  factionId: 'US' | 'IN' | 'CN' | 'NG';

  // --- location (phases 3-4) ---
  countryCode: string;         // ISO/World-Bible code; links allCountries (Bible §13 ruling 10)
  cityId: string;              // links allCities
  baseSector: string;          // e.g. "K3"; from city.sector
  cultureCode: number;         // 1..14 from city; drives power/social ±CS

  // --- base (phase 5) ---
  baseTypeId: string;          // from baseSystem.ts base types
  baseName: string;

  // --- roster (phases 6-7) ---
  startingCharacterIds: string[]; // length = faction starting roster size (§4.3)

  // --- derived snapshot (computed at boot, cached for spine reads) ---
  environment: EnvironmentProfile; // §3.3
}
```

### 3.2 Start presets (phase 1)

```ts
export interface StartPreset {
  id: 'canon' | 'custom' | 'quickstart';
  label: string;
  forcesFaction?: 'US';        // canon forces US/FIST (story default)
  forcesCountryCode?: string;  // canon forces USA
  autoFillRoster: boolean;     // quickstart only
  description: string;
}
```

| Preset | Faction | Country | Roster | Difficulty defaults | Rationale (source) |
|---|---|---|---|---|---|
| **Canon (story)** | US/FIST (locked) | United States (locked) | hand-picked canon 5 | permadeath on, rewind tense | FIST GDD line 336 (FIST is the US org); Faction_Specification US = "5 (mixed threat levels)" |
| **Custom (sandbox)** | any of 4 | any of 168 | player-chosen up to cap | player-set | Bible §6.4 ("4 playable factions"); CountrySelection.tsx already allows any country |
| **Quickstart** | any of 4 | faction home capital | auto-filled to cap | defaults | Player_Scaling "Complete tutorial; Establish base" minimal path |

### 3.3 EnvironmentProfile (the cached spine snapshot)

Computed once at `boot` and recomputed on relocation. This is what every downstream system reads instead of re-deriving from raw stats.

```ts
export interface EnvironmentProfile {
  countryCode: string;
  cityId: string;
  cultureCode: number;
  factionTerritoryTier: 'home' | 'allied' | 'contested' | 'neutral' | 'hostile';

  // ±CS modifier bundles (signed integers), keyed by method/domain
  cs: {
    legalMethods: number;     // GovernmentPerception + LSWRegulations
    covertMethods: number;    // IntelligenceBudget + GovernmentPerception
    bribery: number;          // GovernmentCorruption
    recruitment: number;      // LSWActivity + Population + city recruit bonus
    techResearch: number;     // Science + HigherEducation
    socialDiplomacy: number;  // cultureCode match + faction identity
    publicOps: number;        // LSWRegulations + Vigilantism
  };

  // access / rules flags
  cloningTier: 'none' | 'basic' | 'advanced';   // Country.csv Cloning
  blackMarket: number;                          // 0..100 illegal-gear access
  encounterRate: number;                        // base combat/event frequency
  startingThreatCap: 'Alpha' | 'L1';            // Player_Scaling tier 1
  equipmentAccess: string[];                    // from City_Type_Effects
}
```

---

## 4. Exact numbers, tables & formulas (every value cited)

### 4.1 Faction starting resources (phase 2)

From **`Faction_Specification.csv` §FACTION STARTING RESOURCES** (lines 29–33) and **§UNIQUE INVESTIGATION METHODS** (lines 36–40):

| Faction | Starting LSWs | Starting Budget tier | Starting Reputation | Tech level | Signature method (CS / cooldown) | Win condition |
|---|---|---|---|---|---|---|
| **US** | 5 (mixed threat) | High | **+50** | Advanced | Shock and Awe: **+4CS** force, 7-day CD | Control 60% of global LSW pop via registration |
| **IN** | 4 (spiritual) | Medium | **+30** | Standard | Spiritual Consultation: **+3CS** mystical, 3-day CD | Balance mystical vs technological LSW dev |
| **CN** | 6 (quantity) | High | **+10** | Advanced | Mass Surveillance: **+4CS** tracking, 1-day CD | LSW control system across allied+neutral |
| **NG** | 4 (diverse) | Low | **+20** | Basic | Pan-African Network: **+3CS** Africa, no CD | Unite Africa; resource independence |

> **RULING — budget tiers → dollars.** Faction_Specification gives only "High/Medium/Low/Basic," and the shipped `FactionSelection.tsx` hard-codes US 75000 / IN 45000 / CN 60000 / NG 35000, while the store default `budget: 75000` (`enhancedGameStore.ts:611`). Player_Scaling Tier-1 funding band is **$5K–$15K** (`Player_Scaling.csv` row 2) — that is *mission funding*, not org starting capital. Reconcile by ruling: **starting org budget = Player_Scaling tier band scaled by faction tier**, then multiplied by `difficulty.economyMult`:
> `startingBudget = TIER1_BASE × factionBudgetMult × economyMult`, where `TIER1_BASE = 15000` (top of the $5K–$15K Tier-1 band, Player_Scaling), and `factionBudgetMult = { High:1.0, Medium:0.75, Low:0.5 }` → **US 15000, CN 15000, IN 11250, NG 7500**.
> This keeps the shipped *ordering* (High > Medium > Low) and traces every number to Player_Scaling + Faction_Specification. **OWNER-FORK** flags whether to instead keep the larger 35K–75K figures (see §8).

### 4.2 Faction starting territory (phase 3 default + CS)

From **`Faction_Specification.csv` §STARTING (line 3–9)** and **§TERRITORY CONTROL (lines 21–26)** + **`Country_Attribute_Effects.csv` §FACTION TERRITORY BONUSES (lines 45–49)**:

- Default base country = first listed Starting_Country: US→Washington DC/United States; IN→New Delhi/India; CN→Beijing/China; NG→Lagos/Nigeria.
- Territory tier of the *chosen* country relative to faction:
  - In a Starting_Country → **Home_Territory: +3CS all methods, full equipment, legal immunity, instant comms** (line 22).
  - In an allied country (faction-relations Allied/Friendly, lines 13–18) → **Allied: +1CS diplomatic, reduced equipment** (line 23).
  - Rival-controlled → **Hostile: −2CS all methods, equipment restrictions, detection risk** (line 25).
  - Else → **Neutral: standard, build from scratch** (line 26).
- Faction-specific home effect overrides (Country_Attribute_Effects lines 46–49): US **+3CS all**; IN **+2CS diplomatic/cultural/spiritual**; CN **+3CS surveillance, +2CS corporate/tech**; NG **+2CS tribal/underground/resource**.

### 4.3 Starting roster size & composition (phase 6)

- Roster cap at start = **faction Starting_LSWs** (US 5, IN 4, CN 6, NG 4) — Faction_Specification §STARTING.
- Hard cap also bounded by **Player_Scaling Tier-1 Team_Size_Limit = "1–2 characters" active squad** (`Player_Scaling.csv` row 2). **RULING:** *roster* (recruited, on payroll) can equal faction Starting_LSWs, but the **deployable squad** is Tier-1 capped at **2** until the player reaches Tier-2 (City Defender). The extra roster members sit in `Ready`/`Train`/`Personal Life` activities (Daily_Activity_Framework.csv). This reconciles the two tables without inventing a number.
- Starting LSW generation method = **`Faction_Appropriate`** (Character_Creation_Wizard.csv line 10: "Faction determines available options and bonuses").
- Origin/threat/power distribution for any *random* fills (quickstart, or "recruit more"):
  - **Origin weights** (Character_Creation_Wizard.csv line 2): Skilled Human 30% · Altered Human 25% · Tech Enhancement 15% · Spiritual/Mystic 10% · Alien 8% · Symbiotic 5% · Mutated 4% · Synthetics 2% · Scientific Weapon 1%. (Map "Spiritual"→Mystic origin id 5, "Mutated"→Mutant id 3, "Synthetics"→Construct id 9, "Symbiotic/Scientific Weapon"→Altered id 2 per Origin_Types.csv — RULING, see §7.)
  - **Threat weights** (line 3): Alpha 40% · L1 35% · L2 15% · L3 7% · L4 2.5% · L5 0.5%. **Onboarding override:** Tier-1 threat cap is **Alpha–L1** (Player_Scaling row 2 "Alpha-Threat Level 1"), so at start re-roll any draw above L1 down to L1.
  - **Power count** (line 4): Single 60% · Two 30% · Three 8% · Four+ 2%.
- Faction reputation bias on starting LSW origins (Faction_Specification §STARTING "Starting_Contacts" + playstyle): US biases Tech/Military, IN biases Mystic/Spiritual, CN biases quantity/Construct, NG biases diverse (flat origin weights). **RULING:** apply faction bias as ×2 weight on the listed origin(s) before normalizing.

### 4.4 Starting character stat baseline

From **`Primary_Stats_Spec.csv`** (7 stats MEL/AGL/STR/STA/INT/INS/CON) and Bible §3.2 rank tiers. Tier-1 Street Operative baseline:
- **RULING:** starting LSW raw stats roll in **Typical–Good band (6–20)** per stat (FASERIP ladder, Bible §3.2), centered by threat level: Alpha → mean 10 (Typical), L1 → mean 15 (Good). Source: Character_Creation_Wizard line 5 "Normal distribution around threat level baseline." Use σ=3, clamp [6,20] at start.
- Derived at creation (Primary_Stats_Spec §DERIVED): `Health = STA×2 + STR`; `Initiative = (AGL+INS)/2`; `Karma = (INT+INS+CON)/3`.

### 4.5 Personality assignment (phase 6, drives later AI)

Every starting LSW gets one of **20 personality types** (PERSONALITY TARGET SELECTION csv). Each maps to a combat target preference used the moment they ever fight as AI ally or turn enemy:
- Mapping row (the single data row): personalities 1..20 → preference codes `[1,3,4,4,1,3,4,1,2,2,1,4,2,3,3,3,2,5,5,2]` where **1=Most Health, 2=Least Health, 3=Major Threat (most dmg dealt), 4=Minor Threat, 5=Random**.
- **RULING:** at onboarding, assign personality with `Random_Personality` method (Character_Creation_Wizard line 16). Store the index 1..20 on the character; the combat layer reads the preference code from this table (already a Bible §5.10 system). Onboarding only *seeds* it.

### 4.6 The countdown / clock (armed at phase 8)

From **`Time_Management.csv`** and **`Travel_Time_System.csv` §REAL TIME TO GAME TIME**:
- Base ratio **1 real day : 30 game days** (Time_Management `Base_Time_Flow`).
- Full countdown **2472 game days = 82.4 real days** (Travel_Time_System line 52; FIST GDD line 330).
- Sector grid: **1 square ≈ 500 km**; adjacent = 1 day ground / 0.5 day air; diagonal = 1.4× (Travel_Time_System §SECTOR GRID REFERENCE lines 62–66). Base sector chosen in phase 4 sets `currentSector`.
- Clock states available later (not chosen at onboarding): Crisis 1:15, Accelerated_Research 1:45, Downtime 1:60 (Time_Management lines 3–5).
- **`doomClock`** (XCOM-style mastermind bar, `doomClockSystem.ts`) is *armed* (set `isActive=true`) at boot but starts at progress 0; it is a *separate* pressure track from the alien countdown. Onboarding sets `baseProgressRate=2`/week (its config default).

---

## 5. How it consumes the SPINE

The onboarding is the **first and most important spine consumer**: it reads country + city + culture + faction and writes the `EnvironmentProfile` (§3.3) that all later systems reuse. Formulas below cite their effect table. All inputs are 0–100 unless noted; outputs are signed ±CS integers unless noted.

### 5.1 Country-stat → ±CS (Country_Attribute_Effects.csv)

Let a country stat `s` with thresholds Low(0–35)/Med(36–65)/High(66–100). Each effect below is the table's High-band value, with the Low band as its negation (per the table's symmetric phrasing):

```
legalMethods   = step(GovernmentPerception, {High:+2, Med:+1, Low:-2})        // line 7
               + (LSWRegulations=='Legal' ? +2 : LSWRegulations=='Banned' ? -3 : 0) // line 27
covertMethods  = step(GovernmentPerception, {High:-1, Med:+1, Low:+2})        // line 7 inverse
               + step(IntelligenceBudget,   {High:-2, Med:0,  Low:+2})        // line 13
bribery        = step(GovernmentCorruption, {High:+3, Med:0,  Low:-2})        // line 9
techResearch   = step(Science,        {High:+2, Med:0, Low:-2})               // line 21
               + step(HigherEducation,{High:+2, Med:0, Low:-1})               // line 19
recruitment    = step(LSWActivity,    {High:+2, Med:0, Low:-2})               // line 25
               + step(Population,      {High:+2, Med:0, Low:-2})              // line 3
publicOps      = (LSWRegulations=='Legal'? +2 : 'Banned'? -3 : 0)             // line 27
               + (Vigilantism=='Legal'?  +2 : 'Banned'? -3 : 0)              // line 29
detectionRisk  = step(IntelligenceBudget, {High:+3, Med:0, Low:0})           // line 13
```
where `step(s, m)` returns `m.High` if s≥66, `m.Low` if s≤35, else `m.Med`.

**Combination overrides** (Country_Attribute_Effects §COMBINATION, lines 37–42) applied after the above:
- `High Military && High Intel` → Security State: covert −2 (extra), official +2.
- `Low Government && High Corruption` → Failed State: zero out legalMethods; force/bribery only.
- `High Science && High Education` → Innovation Hub: techResearch +3 (extra).
- `High LSWActivity && LSWRegulations==Legal` → LSW Haven: recruitment **+4** (extra).
- `High Healthcare && High Cloning` → Medical Center: set `cloningTier='advanced'`.

### 5.2 City-type → effects (City_Type_Effects.csv)

City has up to 4 types (Cities.csv CityType1–4) + CrimeIndex + PopulationRating.
- `recruitment += bestRecruitBonus(types)` — **best applicable, do NOT stack** (line 29). E.g. Educational/Military = +3CS, Industrial/Seaport/Mining/Company = +2CS, Temple/Political/Resort/Village = +1/+2CS per line 3–21.
- `equipmentAccess = union(types.equipment)` (line 28). Military adds military weapons/armor/vehicles at **−20% cost** (Arsenal Access, line 5).
- Investigation bonuses stack for matching type (line 25), cached but consumed by Investigation system not onboarding.
- **Crime index** (lines 33–38): Very Low(0–20) +1CS legal/−1 criminal recruit; High(60–80) −2 official/+2 underground + combat more likely → `encounterRate += 0.2`; Very High(80–100) −3 legal/+3 criminal, `encounterRate += 0.4`.
- **Population type** (lines 41–47): Village(2) +2CS stealth/−2 resources … Mega City(7) +3 resources/−3 stealth + multiple simultaneous ops. Affects `equipmentAccess` breadth and stealth column.

### 5.3 Culture-region → effects (Culture_Region_Effects.csv)

`cultureCode` (1–14) from the chosen city (Cities.csv CultureCode):
- `socialDiplomacy`: same culture as faction-home culture **+2CS**, similar **+1CS**, opposed **−1CS** (§CULTURE INTERACTION MATRIX line 42). Language barrier (no regional-language speaker on roster) **−2CS** (line 36).
- Power affinity: LSWs recruited here are **2× likely** to roll the region's listed power types (line 34) — feeds phase-6 random fills. E.g. South Asia(5) → Mystical/Divine/Elemental; North America(13) → Tech/Mutation.
- Investigation regional bonus cached (e.g. South Asia +2CS spiritual, North America +2CS tech — lines 11, 27).

### 5.4 Faction territory overlay (Faction_Specification + Country_Attribute_Effects)

After 5.1–5.3, overlay the faction territory tier (§4.2). Home territory adds **+3CS all methods** (or faction-specific subset) and `legalImmunity=true`. This is added to every `cs.*` field. Hostile subtracts −2 from all.

### 5.5 Worked example (US/FIST in Lagos, Nigeria — a deliberately hostile-ish start)

Inputs (World Bible Country.csv Nigeria + a Lagos city row, Seaport/Company type, CrimeIndex ~70, cultureCode 3 Southern/2 Central Africa):
- `recruitment`: LSWActivity High +2, Population High +2, city Seaport +2 (best), Culture power-affinity n/a = **+6** before territory.
- Territory: Nigeria is NG home, not US → for a US player it is **Neutral** (NG is "Friendly" to US per faction relations line 15, so Allied-lite +1 diplomatic). `legalMethods` gets no home bonus.
- Crime High → `encounterRate += 0.2`, `covertMethods +2 underground / legalMethods −2`.
- Result: a *recruitment-rich but legally-rough* start — exactly the emergent texture the spine is meant to produce. The onboarding surfaces this as a **Start Briefing card** (§6 UI) so the player sees the trade-off before committing.

### 5.6 Time-Walker / rewind economy seeded at onboarding (Bible §11)

The new game **is** the Time Walker's first arrival. Onboarding seeds the rewind economy:
- `rewindDestinations` initial count = **`difficulty.rewindBudget=='tense' ? 3 : 6`** (RULING; Bible §11 "fewer destinations each use" — start finite, not infinite, but not a brick wall).
- `timeWalkerSanity = 100` at start; each rewind costs sanity and removes one destination (FIST GDD lines 126–127). Onboarding only *initializes* these; the rewind mechanic itself is a separate system.
- **No conventional save slot is created.** The campaign autosaves continuously under `campaignId`; "load" = invoke the Time Walker. This is enforced at onboarding by *not* exposing a save-slot picker.

---

## 6. Edge cases & failure modes

| # | Case | Required behavior |
|---|---|---|
| E1 | Country selected has **no city data** (`getCitiesByCountry` empty — already handled in CountrySelection.tsx:293) | Block Confirm; show "No operational cities — choose another country." Quickstart auto-skips such countries. |
| E2 | City has **missing/blank CityType** columns (Cities.csv allows blanks) | Treat as generic `Town` population type, no type bonus; `equipmentAccess = base civilian set`. Never crash on null type. |
| E3 | City `cultureCode` blank/invalid | Default cultureCode = country's modal culture; if unknown, `socialDiplomacy=0`, no affinity. Log a data-gap warning. |
| E4 | Faction home country chosen but that country row missing from World Bible | Fall back to faction `Headquarters` city string (Faction_Specification col Headquarters) as a synthetic base; flag `dataFallback=true`. |
| E5 | Player picks **fewer** starting LSWs than cap | Allowed (min 1). Empty roster (0) blocks Confirm: "You need at least one operative." |
| E6 | Player picks **more** than faction cap | Hard-blocked by UI; cap = faction Starting_LSWs (§4.3). |
| E7 | Insufficient budget for chosen base type (phase 5) | Disable that base option; show cost vs `budget`. Cheapest base always affordable (RULING: cheapest base cost ≤ smallest faction budget = NG 7500; OWNER-FORK on exact base prices). |
| E8 | Back navigation after committing downstream choices | Re-validate forward chain on next Confirm: if base country changed, **invalidate** city/base/roster that depended on it and force re-pick (don't silently keep a city in the wrong country). |
| E9 | Random origin draw resolves to an origin id with no powers defined | Re-roll up to 5×; then fall back to Skilled Human (id 1) — always valid (Origin_Types line 2). |
| E10 | Threat draw > L1 at onboarding | Clamp to L1 (Player_Scaling Tier-1 cap). |
| E11 | Quickstart with a faction whose home capital lacks city data | Use faction `Headquarters` synthetic base (same as E4). |
| E12 | Player closes/reloads mid-onboarding | `NewGameConfig` is written incrementally to localStorage under a `draftCampaign` key; on reload, resume at last committed phase. The shipped store already persists `gamePhase` from `window` (`enhancedGameStore.ts:602`). |
| E13 | Two saves / "New Game" over existing campaign | Diegetic prompt: "Starting a new timeline abandons the current one (the Time Walker cannot serve two)." Confirm overwrites `campaignId`. |
| E14 | `economyMult`/`enemyScaling` set to 0 by a modder | Clamp to [0.25, 4.0]; never allow 0 (division/empty-budget hazards). |
| E15 | Multiplayer `dimensionId` collision (future) | Onboarding always writes `dimensionId='prime'` for SP; reserved namespace, never blank. |

---

## 7. UI/UX hooks (how it surfaces)

**Surface = full-screen setup flow, then it hands off to the diegetic phone/laptop.** Honor the design standard (no purple; warm-dark base; authored, not generic-SaaS). The shipped components already use dark cards + accent gradients; keep that, swap any purple accent for amber/red/teal.

- **Title (phase 0):** logo, three buttons — *New Game*, *Continue* (if `draftCampaign`/campaign exists), *Numbers* (the phone cheat-code dial, Bible §7.5). Background: slow world-map pan with the 2472-day clock frozen.
- **Start-Mode (phase 1):** three preset cards (Canon / Custom / Quickstart) + a "Difficulty" disclosure with toggles (permadeath, rewind tense/lenient, economy slider, enemy scaling). Each toggle shows its mechanical effect inline.
- **Faction (phase 2):** the existing `FactionSelection.tsx` 4-card grid — **but** replace its hard-coded stat bars and budgets with values pulled from `Faction_Specification.csv` (§4.1) so the UI matches the source of truth. Hover reveals signature method (+CS/cooldown) and win condition. Card footer shows the *reconciled* starting budget (§4.1 ruling).
- **Country (phase 3):** the existing `CountrySelection.tsx` searchable list of 168 + the live stat panel. **Add a "Start Briefing" strip** that previews the computed `EnvironmentProfile.cs` (recruitment, legal, covert, tech ±CS) and territory tier for the chosen faction — so the player sees the spine consequence *before* committing (this is the core "living world talks to you" hook).
- **City (phase 4):** `FixedCitySelection.tsx` — show CityType chips, CrimeIndex/Safety, sector code, and the generated `localNewspaperName` (already wired in `selectCity()`), reinforcing that this is a *place*, not a coordinate.
- **Base (phase 5):** base-type cards from `baseSystem.ts` with cost vs budget, facility list, and a name field. Modal-style (per design standard: forms in modals).
- **Recruit (phase 6):** roster picker showing each candidate LSW's origin, threat (Alpha/L1), 7 stats, personality, and power(s). Squad-vs-roster distinction explained (deployable 2, roster = faction cap). "Re-roll candidate" button uses §4.3 weights.
- **Equip (phase 7):** per-character loadout from `equipmentAccess` (city/faction), Military cities flag the −20% arsenal discount.
- **Boot (phase 8):** cinematic — laptop powers on, Time-Walker (Sandra Locke) intro line (FIST GDD), the **first email** lands (priority-flagged mission brief, Bible §7.1), the world clock un-pauses with an audible tick, doomClock arms. This is the seam where onboarding becomes the live game.
- **Combat overlay:** none directly (onboarding has no combat), but the *first* tutorial mission email (boot) can route to a scripted Tier-1 street encounter (Player_Scaling "Street gang violence requiring LSW intervention").
- **Pause semantics:** the laptop/phone pauses time (Bible §7); during setup time is already paused, so the boot transition is the first un-pause the player experiences — teach the pause affordance here.

---

## 8. Integration points (reads / writes)

**Reads:**
- `data/allCountries.ts` + `data/allCities.ts` (canonical 168/1050, Bible §13 ruling 10) — country/city stats, sector, culture.
- `data/locationEffects.ts` / `data/combinedEffects.ts` (existing spine effect computations) — onboarding should call these to build `EnvironmentProfile`, not re-implement.
- `Faction_Specification.csv` (via a `data/factions.ts`) — resources, territory, win conditions.
- `data/characterGeneration.ts` (`characterGeneration.ts`) — to generate faction-appropriate starting LSWs (§4.3 weights).
- `data/baseSystem.ts` — base types/costs/facilities.
- `data/doomClockSystem.ts` — to arm the doom clock at boot.

**Writes:**
- `enhancedGameStore.ts`: `selectedFaction`, `selectedCountry`, `selectedCountryCode`, `selectedCity`, `currentSector`, `localNewspaperName`, `budget`, `characters[]`, squad, `factionStandings` (via existing `initFactionStandings()` called in `selectCountry()`), `gamePhase`, and **new** `newGameConfig`, `environment`, `timeWalker` (sanity/destinations), `doomClock.isActive`.
- Triggers `initFactionStandings()` (already in `selectCountry()` at `enhancedGameStore.ts:902`) and a new `armWorldClock()` at boot.
- Emits the **first email** into the email/news system (Bible §7.1) and a "campaign started" news item.

**Downstream systems that consume the onboarding output:**
- Investigation (reads `environment.cs`, equipmentAccess), Mission-gen (encounterRate, threat cap), Economy (budget), Recruitment (recruitment CS, power affinity), Hospital/Cloning (cloningTier), Reputation (startingReputation), Time/Travel (currentSector, clock state), Time-Walker save (campaignId, rewindDestinations).

---

## 9. RULING notes (data didn't settle these; ruled per Bible)

1. **Phase additions.** Promote Base and Equip to first-class phases and add `title`/`start-mode`/`boot`, keeping shipped enum values. (§2.1) — Bible §0 core loop names Base + Equip explicitly.
2. **Budget reconciliation.** `startingBudget = 15000 × {High:1, Med:.75, Low:.5} × economyMult` → US/CN 15000, IN 11250, NG 7500, tracing to Player_Scaling Tier-1 band + Faction_Specification tiers. (§4.1) — preserves shipped ordering; supersedes the un-sourced 35K–75K constants. *OWNER-FORK alternative in §10.*
3. **Roster vs squad.** Roster cap = faction Starting_LSWs; deployable squad Tier-1 capped at 2 (Player_Scaling). (§4.3)
4. **Origin label mapping.** Map Character_Creation_Wizard's labels (Spiritual/Mutated/Synthetics/Symbiotic/Scientific Weapon) onto Origin_Types' 9 canonical origins (Mystic/Mutant/Construct/Altered). (§4.3)
5. **Stat baseline.** Starting LSW stats roll Typical–Good (6–20), mean by threat (Alpha 10 / L1 15), σ=3. (§4.4) — from Character_Creation_Wizard "normal distribution around threat baseline."
6. **Threat clamp at start.** Any roll > L1 clamps to L1 (Tier-1 cap). (§4.3/E10)
7. **Rewind economy seed.** Initial destinations = 3 (tense) / 6 (lenient); sanity 100; no conventional save slot. (§5.6) — Bible §11.
8. **Cheapest base affordable.** Cheapest base cost ≤ NG starting budget so no faction is soft-locked. (E7)
9. **Multiplayer stub fields.** Always write `dimensionId='prime'` and a `regionSeed` derived from base sector; do not build MP. (§3.1, Bible §15)
10. **Clock paused during setup, armed at boot.** Time only starts at phase 8. (§2.2) — Bible §7/§11 + Time_Management.

---

## 10. OWNER-FORK notes (genuine product choices — do not guess as settled)

1. **Starting budget magnitude.** Keep the *small* Player_Scaling-derived figures (US 15K … NG 7.5K, my ruling §4.1) for a tight JA2-style early economy, **or** keep the shipped larger figures (US 75K … NG 35K) for a smoother ramp? The source tables support either reading (org capital vs mission funding). Owner must pick the economic feel.
2. **Canon-lock vs free faction.** Should the *default/recommended* first-time experience hard-lock US/FIST in the United States (matching the FIST narrative, GDD line 336), with the other 3 factions + 168 countries as an explicitly-labeled "Sandbox," or present all four as equal from the title screen (as shipped)? This shapes how strongly the authored story frames onboarding.
3. **Difficulty surface at onboarding.** Expose permadeath / rewind-budget / economy / enemy-scaling toggles up front, or hide them behind an "Advanced" wall to keep the first impression clean? (Bible pillar 2 leans permadeath-default.)
4. **Tutorial coupling.** Is the first email at boot a *forced* scripted tutorial mission (teaches combat + laptop), an *optional* skip, or absent (pure sandbox open)? Player_Scaling lists "Complete tutorial" as the Tier-1 unlock requirement, implying it exists — but whether it's skippable is a product call.
5. **Quickstart depth.** Should Quickstart auto-fill roster with *thematic* faction-canon characters or with *random* faction-appropriate rolls? Affects whether new players meet hand-authored personalities immediately.
6. **Base-type prices.** Exact dollar costs per base type are not in the cited source tables; owner/baseSystem must set them (constrained only by E7: cheapest ≤ 7500).

---

## 11. Open questions

1. **Which 168-vs-1050 dataset link key?** Bible §13 ruling 10 says unify on `allCountries`+`allCities` by ISO code, but World Bible Country.csv uses an internal "Country Code" (e.g. 163 Slovenia) while Cities.csv references the same. Confirm the join key (ISO-2 vs internal numeric) before wiring `EnvironmentProfile`.
2. **Faction-home culture for `socialDiplomacy` same/opposed test.** Each faction's "home culture" (US→13 North America, IN→5 South Asia, CN→6 East Asia, NG→2/3 Africa) needs a single canonical value per faction for the +2/−2 social test (§5.3). Proposed mapping above; confirm.
3. **Does choosing a *non-home* country reduce the faction's starting roster/budget?** Faction_Specification ties starting resources to the faction, not the country — but a US player starting in Lagos arguably shouldn't get full US home bonuses. Currently handled via territory tier (§4.2), but owner may want a resource penalty too.
4. **Where does the alien-invasion countdown live vs the doomClock?** Two pressure tracks exist (2472-day alien countdown in Time/Travel tables; XCOM-style mastermind `doomClockSystem.ts`). Confirm both run, and that onboarding arms both (alien countdown = passive timer; doomClock = mastermind bar).
5. **Re-roll cost.** Should "Re-roll candidate" in phase 6 be free (pre-commitment) or cost budget/time? Likely free pre-boot; confirm.
6. **Localization of name generation** for faction-appropriate LSWs uses `nameDatabase.ts` keyed by nationality/culture — confirm coverage for all 14 culture regions so quickstart never produces a blank name (Character_Creation_Wizard §Cultural_Authenticity_Check).
