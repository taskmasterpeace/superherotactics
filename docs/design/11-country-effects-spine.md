# 11 — Country Attributes → Effects (THE SPINE)

> **System owner doc.** Build-ready spec for the single most load-bearing system in SuperHero Tactics: the function that turns a country's 35 stat columns (plus its city, culture, terrain, and faction context) into the **±CS modifiers, access rules, prices, and emergent systems** every other system reads.
>
> **Status:** Spec. Partially implemented in code (`MVP/src/data/locationEffects.ts`, `combinedEffects.ts`) — this doc is the canonical contract that reconciles that code with the source CSVs and the Mechanics Bible.
>
> **Primary sources (open these first):**
> - `docs/csv-source-data/Game_Mechanics_Spec/Country_Attribute_Effects.csv` — the master attribute→effect table.
> - `docs/csv-source-data/SuperHero Tactics World Bible - Country.csv` — 168 countries, raw stat values (mirrored as `MVP/src/data/allCountries.ts`).
> - `docs/csv-source-data/Game_Mechanics_Spec/City_Type_Effects.csv` — 10 city types layered on top.
> - `docs/csv-source-data/Game_Mechanics_Spec/Culture_Region_Effects.csv` — 14 culture regions.
> - `docs/csv-source-data/Game_Mechanics_Spec/Faction_Specification.csv` — 4 factions + territory overlay.
> - `docs/csv-source-data/Game_Mechanics_Spec/Stat_Rank_Mapping.csv` — CS reference (`+1CS…−6CS`) and result bands.
> - `SuperHero Tactics/Combat Compendium REAL - 🎯PERSONALITY TARGET SELECTION🎯.csv` — 20-personality target preference.
> - `SHT_MECHANICS_BIBLE.md` §2 (Spine), §6.1–6.4, §8 (Combined Effects), §13 (Rulings).
>
> **Hard rule honored throughout:** *Never invent a number.* Every value below cites a source row. Where the data is silent, the choice is tagged `RULING:` (consistent with the Bible) or `OWNER-FORK:` (a product decision the owner must make).

---

## 1. Overview & player fantasy

**The fantasy:** *"Where you stand changes everything."* The same mission — break a prisoner out, recruit an LSW, buy a railgun, heal a dying teammate — plays completely differently in **Norway** (free press, clean cops, banned cloning, no bribes) versus **Nigeria** (corrupt, underground-network rich, cheap bribes, terror-active) versus **China** (surveillance state, banned vigilantism, mass-production cloning regulated). The player learns to *read a country like a chessboard* before deploying, and to route operations through the nations whose stats favor the verb they need.

The Spine is **not a feature the player clicks** — it is the invisible engine that makes the living world legible. Its outputs surface everywhere: the phone's "Country Brief," the world-map sector tint, mission difficulty, shop prices, who's hostile when you land, and what the locals' powers look like. It is the mechanical embodiment of Bible Pillar #4 ("the world lives without you") and the Spine Principle (§2): *single stats are weak; combined stats create the game.*

**One-line definition.** Given `(country, city, cultureCode, terrainCode, faction, methodTag)`, the Spine returns a `LocationEffectProfile`: a bundle of **±CS modifiers keyed by method/operation tag**, **boolean access gates**, **price/time multipliers**, **enemy-quality templates**, **power-affinity tags**, and the **12 combined-effect subsystems**. Every consumer (missions, pricing, combat, investigation, recruitment, hospital, news) reads from this one bundle.

---

## 2. Data schema (fields & types)

### 2.1 Input — `Country` (already in `MVP/src/data/allCountries.ts`)

The 35 World-Bible columns. Numeric stats are `0–100` unless noted (raw range in the Bible is 20–90 for most; see `Country_Attribute_Effects.csv` "Rating_Range" column). Enumerated columns are strings.

| Field (code) | Type | Source column | Notes |
|---|---|---|---|
| `code` | string | `Country Code` → ISO2 | Join key. Bible §13 ruling #10: unify on `allCountries`. |
| `name` | string | `Country` | |
| `population` | number | `Population` | Raw headcount. |
| `populationRating` | number (20–90) | `PopulationRating` | Drives LSW pool & simultaneous-ops cap. |
| `governmentPerception` | enum | `GovernmentPreception` | `Full Democracy \| Flawed Democracy \| Hybrid Regime \| Authoritarian Regime`. |
| `governmentCorruption` | number (0–100) | `GovermentCorruption` | **Higher = more corrupt** (inverted in code; see `countries.ts` header). |
| `militaryServices` | number | `MilitaryServices` | Soldier skill. |
| `militaryBudget` | number | `MilitaryBudget` | Equipment tier, response time. |
| `intelligenceServices` | number | `IntelligenceServices` | Tracking speed (how fast you're found). |
| `intelligenceBudget` | number | `IntelligenceBudget` | Surveillance density. |
| `capitalPunishment` | enum | `CapitalPunishmentType` | `Inactive \| Rare \| Active`. |
| `mediaFreedom` | number | `MediaFreedom` | |
| `lawEnforcement` | number | `LawEnforcement` | Cop skill / investigation speed. |
| `lawEnforcementBudget` | number | `LawEnforcementBudget` | Response time / patrol density. |
| `gdpNational` | number | `GDPNational` | Infrastructure. |
| `gdpPerCapita` | number | `GDPPerCaptia` | Price multiplier. |
| `healthcare` | number | `Healthcare` | Healing, **cloning gate**. |
| `higherEducation` | number | `HigherEducation` | Training/research quality. |
| `socialDevelopment` | number | `SocialDevopment` | Civilian cooperation. |
| `lifestyle` | number | `Lifestyle` | Safe-house quality. |
| `terrorismActivity` | enum | `TerrorismActivity` | `Inactive \| Rare \| Active` (→0/25/75 in code). |
| `cyberCapabilities` | number | `CyberCapabilities` | Hacking, cyber-surveillance. |
| `digitalDevelopment` | number | `DigitalDevelopment` | Comms reliability. |
| `science` | number | `Science` | Research, reverse-engineering, clone stability. |
| `cloning` | enum | `Cloning` | `Banned \| Regulated \| Legal` (note: World Bible column also carries a numeric 0–90 "Cloning rating" in `Country_Attribute_Effects.csv`; see §6.1 ruling). |
| `lswActivity` | number | `LSWActivity` | Recruitment rate, encounter rate. |
| `lswRegulations` | enum | `LSWRegulations` | `Banned \| Regulated \| Legal`. |
| `vigilantism` | enum | `Vigilantism` | `Banned \| Regulated \| Legal`. |
| `cultureCode` | number (1–14) | `CultureCode` (from Cities sheet) | Joins to `Culture_Region_Effects.csv`. |

> Field-name mapping is **verified against `allCountries.ts`** (`code, name, population, populationRating, governmentPerception, governmentCorruption, militaryServices, militaryBudget, intelligenceServices, intelligenceBudget, capitalPunishment, mediaFreedom, lawEnforcement, lawEnforcementBudget, gdpNational, gdpPerCapita, healthcare, higherEducation, socialDevelopment, lifestyle, terrorismActivity, cyberCapabilities, digitalDevelopment, science, cloning, lswActivity, lswRegulations, vigilantism, cultureCode`).

### 2.2 Input — `City` context (from `City_Type_Effects.csv` + Cities sheet)

```ts
interface CityContext {
  cityName: string;
  cityTypes: CityType[];      // ordered; [0] = primary (City_Type_Effects "Primary_Type" rule)
  crimeIndex: number;         // -20..100 (Cities sheet "CrimeIndex", "−20 as very low")
  populationRating: number;   // 2..7 city pop tier (City_Type_Effects "POPULATION TYPE" block)
  terrainCode: number;        // 1..25 (TerrainCodes.csv) — used by map/travel, passed through
  hvt?: string;               // High-Value Target flag (Cities sheet "HVT")
}
type CityType = 'Temple'|'Military'|'Political'|'Industrial'|'Resort'
              | 'Seaport'|'Mining'|'Educational'|'Company'|'Village';
```

### 2.3 Output — `LocationEffectProfile`

The single bundle every consumer reads. **All `±CS` values are integers** (column shifts; see `Stat_Rank_Mapping.csv` "COLUMN SHIFT REFERENCE", clamp −6..+4).

```ts
interface LocationEffectProfile {
  // ---- identity ----
  countryCode: string;
  cityName: string;
  faction: FactionId;                 // active player faction
  territoryType: TerritoryType;       // Home|Allied|Contested|Hostile|Neutral

  // ---- method/operation CS table (the core output) ----
  // Keyed by methodTag; value is total ±CS after stacking country+city+culture+faction.
  methodCS: Record<MethodTag, number>;  // see §4.1 for the tag list & stacking order

  // ---- access gates (booleans / tiers) ----
  access: {
    legalPublicOps: boolean;          // lswRegulations === 'Legal'
    vigilanteStatus: 'legal'|'tolerated'|'illegal'|'shoot_on_sight';
    blackMarket: 'open'|'contacts_needed'|'deep_underworld'|'impossible';
    militaryGear: boolean;            // Military city type OR militaryBudget high
    cloningTier: 'none'|'basic'|'advanced'|'black_market';
    deathPenaltyRisk: boolean;        // capitalPunishment Active/Rare
  };

  // ---- economic / temporal multipliers ----
  multipliers: {
    price: number;                    // shop/base price ×
    weaponPrice: number;
    techPrice: number;
    bribeCost: number;                // ×; LOW where corruption HIGH
    missionReward: number;
    healDays: number;                 // × on recovery time
    researchSpeed: number;            // × on research project clock
  };

  // ---- enemy templates ----
  enemies: {
    police:   'militia'|'standard'|'trained'|'elite';
    military: 'militia'|'standard'|'trained'|'elite';
    gang:     'street'|'organized'|'cartel'|'syndicate';
    terrorist:'cell'|'network'|'army'|null;
  };

  // ---- recruitment & power flavor ----
  recruit: {
    poolSizeCS: number;               // ±CS to recruitment rolls
    powerAffinity: string[];          // culture-region power tags (Culture_Region_Effects)
    cityRecruitTags: string[];        // city-type LSW affinity
  };

  // ---- combined subsystems (§6) ----
  combined: {
    cloning: CloningSystem;
    blackMarket: BlackMarketSystem;
    surveillance: SurveillanceSystem;
    medical: MedicalSystem;
    research: ResearchSystem;
    organizedCrime: OrganizedCrimeSystem;
    mercenaries: MercenarySystem;
    safeHouses: SafeHouseSystem;
    borderControl: BorderControlSystem;
    media: MediaSystem;
    politics: PoliticsSystem;
    lswAffairs: LSWAffairsSystem;
  };

  // ---- world-state flags (emergent labels, §6.3) ----
  flags: WorldFlag[];   // 'SecurityState'|'FailedState'|'InnovationHub'|'MedicalCenter'|'LSWHaven'|'Lawless'
}
```

---

## 3. Tier classification (the one helper everything uses)

`Country_Attribute_Effects.csv` defines **three effect bands** per attribute:

| Band | Range | Source |
|---|---|---|
| **Low** | `0–35` | `Country_Attribute_Effects.csv` col `Low_Effect (0-35)` |
| **Medium** | `36–65` | col `Medium_Effect (36-65)` |
| **High** | `66–100` | col `High_Effect (66-100)` |

```ts
function band(v: number): 'low'|'medium'|'high' {
  if (v <= 35) return 'low';
  if (v <= 65) return 'medium';
  return 'high';
}
```

> **This is the canonical threshold for ALL attribute→effect lookups.** It comes directly from the column headers of the master table — do not use ad-hoc cutoffs. (The legacy code in `locationEffects.ts` uses scattered cutoffs like `>60`, `>40`; §9 Open Question Q1 flags reconciling those to this band model.)

---

## 4. Exact numbers / tables / formulas (each cited)

### 4.1 The `methodCS` table — country attribute → ±CS by method

Every row below is transcribed from `Country_Attribute_Effects.csv`. The **MethodTag** column is the canonical key consumers pass to `getMethodCS(profile, tag)`.

| Attribute | Band | ±CS effect | MethodTag(s) affected | Source row |
|---|---|---|---|---|
| `governmentPerception` (Democracy scale) | Authoritarian (low) | `legal −2CS`, `covert +2CS` | `legal`, `covert` | `GovernmentPerception` row |
| | Hybrid (med) | `legal −1CS`, `covert +1CS` | | |
| | Democracy (high) | `legal +2CS`, `covert −1CS` | | |
| `governmentCorruption` | Low | `official +2CS`, `bribe −2CS` | `official`, `bribe` | `GovernmentCorruption` row |
| | High | `official −2CS`, `bribe/blackmail +3CS` | `bribe`, `blackmail` | |
| `militaryBudget` | High | `infiltration −2CS`, `militaryGear +2CS` | `infiltration`, `militaryGear` | `MilitaryBudget` row |
| `intelligenceBudget` | Low | `covert +2CS` | `covert`, `surveillance` | `IntelligenceBudget` row |
| | High | `covert −2CS`, `detectionRisk +3CS` | | |
| `mediaFreedom` | Low | `propaganda +2CS`, `mediaInvestigation −2CS` | `propaganda`, `mediaInvestigation`, `coverUp` | `MediaFreedom` row |
| | High | `mediaInvestigation +2CS`, `coverUp −2CS` | | |
| `healthcare` | Low | `medicalCover −2CS`, `diseaseInvestigation +3CS` | `medical`, `diseaseInvestigation` | `Healthcare` row |
| | High | `medical +2CS` (+ faster heal, cloning) | | |
| `higherEducation` | Low | `academic −2CS`, `techResearch −1CS` | `academic`, `techResearch` | `HigherEducation` row |
| | High | `academic +2CS`, `techResearch +2CS` | | |
| `science` | Low | `techInvestigation −2CS` | `techInvestigation`, `reverseEngineer` | `Science` row |
| | High | `techInvestigation +2CS`, `reverseEngineer +2CS` | | |
| `lswActivity` | Low | `recruit −2CS` | `recruit`, `lswCombat` | `LSWActivity` row |
| | High | `recruit +2CS`, `lswCombat +2CS` | | |
| `lswRegulations` | Banned | `publicOps −3CS` (+2CS if caught as victim) | `publicOps` | `LSWRegulations` row |
| | Legal | `publicOps +2CS` | | |
| `vigilantism` | Banned | `vigilante −3CS` | `vigilante` | `Vigilantism` row |
| | Legal | `vigilante +2CS` | | |
| `cyberCapabilities` | High | `hacking −2CS`, `cyberSurveillance +2CS` | `hacking`, `cyberSurveillance` | `CyberCapabilities` row |

> **Sign convention:** A *positive* CS makes the player's action **easier** (shifts the Universal Table column right per `Stat_Rank_Mapping.csv` "+1CS = Shift 1 column right (better)"). `detectionRisk` and `lswCombat` are *threat* tags — positive = more dangerous for the player; consumers interpret per §7.

### 4.2 City-type layer (`City_Type_Effects.csv`)

Each city type adds an **investigation bonus, recruitment CS, equipment access, a special ability, and an LSW power affinity**. Transcribed (investigation/recruit columns):

| City type | Investigation bonus | Recruit CS | Special ability | LSW affinity |
|---|---|---|---|---|
| Temple | `+2CS Religious/Mystical` | `+2CS mystical` | Sanctuary: hide from authorities 24h | Mystical / Divine |
| Military | `+2CS Military/Security` | `+3CS military-trained` | Arsenal: military gear −20% cost | Combat / Tech-enhanced |
| Political | `+2CS Political/Diplomatic` | `+1CS govt-connected` | Political Cover: official status | Psychic / Social |
| Industrial | `+2CS Corporate/Sabotage` | `+2CS tech/science` | Workshop: repair/modify gear | Strength / Durability |
| Resort | `+1CS Social/Surveillance` | `+1CS wealthy/connected` | High Society: elite networking | Appearance / Social |
| Seaport | `+2CS Smuggling/Maritime` | `+2CS maritime` | Maritime: water ops | Water / Aquatic |
| Mining | `+2CS Environmental/Industrial` | `+2CS earth/strength` | Underground: tunnel networks | Earth / Strength |
| Educational | `+2CS Academic/Research` | `+3CS intelligent/scientific` | Research: +1CS all tech investigations | Intelligence / Invention |
| Company | `+2CS Corporate/Financial` | `+2CS corporate-connected` | Corporate: business intel networks | Tech / Wealthy |
| Village | `+1CS Rural/Traditional` | `+1CS local/traditional` | Local Trust: faster community building | Nature / Traditional |

**Multi-type stacking rules** (`City_Type_Effects.csv` "MULTI-TYPE COMBINATION RULES"):
- **Stacking:** investigation bonuses stack across types for *matching* investigation tags.
- **Primary_Type:** `cityTypes[0]` sets the city's dominant character.
- **Secondary_Caps:** secondary/tertiary types give **half bonus, round down** when matching (`+2CS → +1CS`).
- **Recruitment_Best:** use the single best applicable recruit CS — **do not stack** recruit bonuses.
- **Equipment_Access:** any equipment type is available if the city has the matching type.
- **Threat_Union:** the city may spawn threats from **any** of its types.

**Crime-index modifier** (`City_Type_Effects.csv` "CITY TYPE + CRIME INDEX"):

| Crime level | Effect |
|---|---|
| Very Low (0–20) | `+1CS all investigations`, `−1CS criminal recruitment` |
| Low (20–40) | no modifier |
| Moderate (40–60) | `−1CS political investigations`, `+1CS criminal contacts` |
| High (60–80) | `−2CS official`, `+2CS underground`, combat more likely |
| Very High (80–100) | `−3CS all legal`, `+3CS criminal`, constant combat risk |

**Population-tier modifier** (`City_Type_Effects.csv` "CITY TYPE + POPULATION TYPE"):

| Pop rating | Effect |
|---|---|
| 2 Village | limited equipment; `+2CS stealth`; `−2CS resources` |
| 3 Small Town | basic equipment; `+1CS stealth`; `−1CS resources` |
| 4 Town | standard; no modifier |
| 5 City | full equipment; `+1CS resources`; `−1CS stealth` |
| 6 Large City | premium; `+2CS resources`; `−2CS stealth` |
| 7 Mega City | all equipment; `+3CS resources`; `−3CS stealth`; multi-ops |

### 4.3 Culture layer (`Culture_Region_Effects.csv`)

14 regions, each giving an **investigation modifier**, **power affinity**, and **social rules**. Key transcribed values:

| Code | Region | Investigation modifier | Power affinity |
|---|---|---|---|
| 1 | North Africa | `+1CS historical` | Fire / Sand / Sun |
| 5 | South Asia | `+2CS spiritual/mystical` | Mystical / Divine / Elemental |
| 6 | East+SE Asia | `+1CS corporate/tech` | Martial / Tech / Spirit |
| 9 | Western Europe | `+1CS corporate/political` | Tech / Noble / Classical |
| 10 | Eastern Europe | `+1CS Cold War/spy` | Winter / Nuclear / Psychic |
| 13 | North America | `+2CS technology` | Tech / Mutation / Patriotic |
| 14 | Middle East | `+1CS religious/political` | Divine / Desert / Ancient |

(Full 14 rows in source — codes 2,3,4,7,8,11,12 follow the same pattern, all `+1CS` to a regional specialty.)

**Culture mechanical rules** (`Culture_Region_Effects.csv` "MECHANICAL RULES" + "INTERACTION MATRIX"):
- **Power_Affinity:** LSWs from a region are **2× as likely** to have the listed power types (feeds recruitment + enemy generation).
- **Language_Barrier:** `−2CS all social methods` if no squad member speaks a regional language.
- **Religion_Respect:** `−1CS` if disrespecting local religious customs.
- **Social interaction matrix:** Same culture `+2CS social`; Similar (adjacent/shared-history) `+1CS`; Neutral `0`; Opposed `−1CS`.

### 4.4 Faction territory overlay (`Faction_Specification.csv` + `Country_Attribute_Effects.csv` "FACTION TERRITORY BONUSES")

Applied **on top** of everything above (it can dominate). Territory type is computed from the active faction's `Starting_Countries` and the relations matrix:

| Territory | Effect | Source |
|---|---|---|
| **Home** | `+3CS all methods`; full equipment; **legal immunity**; instant comms | `Faction_Specification.csv` "Home_Territory" |
| **Allied** | `+1CS diplomatic`; reduced equipment access; local cooperation | "Allied_Territory" |
| **Contested** | no bonus; increased encounter chance | "Contested_Territory" |
| **Hostile** | `−2CS all methods`; equipment restrictions; detection risk | "Hostile_Territory" |
| **Neutral** | standard ops; build relationships from scratch | "Neutral_Territory" |

**Faction signature method CS** (`Faction_Specification.csv` "UNIQUE INVESTIGATION METHODS") — gated, with cooldown:

| Faction | Method | Bonus | Requirement | Cooldown |
|---|---|---|---|---|
| US | Shock and Awe | `+4CS force` | Military authorization | 7 days |
| IN | Spiritual Consultation | `+3CS mystical` | Spiritual LSW on squad | 3 days |
| CN | Mass Surveillance | `+4CS tracking` in controlled territory | Tech infrastructure | 1 day |
| NG | Pan-African Network | `+3CS in any African country` | African operation | None |

**Faction baseline identity CS** (`Faction_Specification.csv` "Strengths"): US `+3CS military, +2CS technology`; IN `+3CS mystical/spiritual, +2CS diplomatic`; CN `+3CS surveillance, +2CS corporate`; NG `+3CS underground, +2CS resource`. **Weaknesses:** US `−2CS covert`; CN `−2CS diplomatic`.

### 4.5 Stacking order & clamp (the resolution pipeline)

```ts
function getMethodCS(ctx, methodTag): number {
  let cs = 0;
  cs += countryCS(ctx.country, methodTag);     // §4.1
  cs += cityCS(ctx.city, methodTag);           // §4.2 (primary full, secondary half-down)
  cs += crimePopCS(ctx.city, methodTag);       // §4.2 crime + pop tables
  cs += cultureCS(ctx.cultureCode, methodTag); // §4.3
  cs += socialMatrixCS(ctx);                   // §4.3 same/similar/opposed (social tags only)
  cs += territoryCS(ctx.faction, methodTag);   // §4.4 Home/Allied/Hostile
  cs += factionIdentityCS(ctx.faction, methodTag);
  // signature method CS added separately when the player explicitly invokes it (cooldown-gated)
  return clamp(cs, -6, 4);                      // Stat_Rank_Mapping.csv CS reference range
}
```

> **RULING — clamp at the source-defined bounds.** `Stat_Rank_Mapping.csv` "COLUMN SHIFT REFERENCE" enumerates `+4CS … −6CS`. Total stacked CS is clamped to `[−6, +4]` so no single location can become trivially auto-win/auto-lose. (Individual table rows never exceed these; the clamp matters only when 3+ modifiers align.)

> **RULING — stacking, not multiplying.** All modifiers are additive on the CS axis (Bible §3.3: "Column Shift is the universal currency… they all stack on one axis"). Territory `Home +3` and `Hostile −2` are **all-methods** and added once; per-method rows from §4.1 add on top, then the clamp applies. This is consistent with `Country_Attribute_Effects.csv` "ATTRIBUTE COMBINATION EFFECTS" which expresses combos as further additive `±CS`.

---

## 5. How it consumes the SPINE (driver formulas)

This section gives the **exact formula** for every derived output. Where a formula already exists in `locationEffects.ts`/`combinedEffects.ts`, it is cited as `[code]` and treated as canonical (the code was written from the same World Bible). Where only the CSV exists, it is cited `[csv]`.

### 5.1 Economy / time multipliers `[code: locationEffects.ts]`

| Output | Formula | Source |
|---|---|---|
| `price` | `0.4 + (gdpPerCapita/100) × 1.2` | `[code]` line ~251 |
| `weaponPrice` | `militaryBudget>60 ? 0.7 : militaryBudget>40 ? 0.85 : 1.0` | `[code]` ~213 |
| `techPrice` | `price × ((science+digitalDevelopment)/2 > 60 ? 0.75 : 1.1)` | `[code]` ~324 |
| `bribeCost` | `max(0.2, 2.0 − governmentCorruption/50)` | `[code]` ~244 |
| `missionReward` | `0.5 + gdpPerCapita/100` | `[code]` ~260 |
| `healDays` (× on recovery) | `2.0 − healthcare/100` → clamp `[0.5, 2.0]` | `RULING:` derived from `Healthcare` High = "faster healing" `[csv]`; mirrors code `hospitalQuality = healthcare` |
| `researchSpeed` (×) | `0.5 + science/100` | `[code]` `researchSpeedBonus = science/100`, rebased so med-science = ~1.0 |
| `militaryResponseMin` | `max(10, 120 − militaryBudget)` | `[code]` ~210 |
| `policeResponseMin` | `max(3, 60 − lawEnforcementBudget×0.5)` | `[code]` ~235 |
| `trackingHours` | `max(1, 48 − intelligenceServices×0.4)` | `[code]` ~222 |
| `newsSpreadHours` | `max(1, 24 − mediaFreedom×0.2)` | `[code]` ~289 |

### 5.2 Access gates `[code]`

| Gate | Condition | Source |
|---|---|---|
| `legalPublicOps` | `lswRegulations === 'Legal'` | `[csv]` LSWRegulations row |
| `vigilanteStatus` | `Legal→legal; Regulated→tolerated; (Authoritarian→shoot_on_sight); else illegal` | `[code]` ~307 |
| `blackMarket` open | `governmentCorruption>35 OR lawEnforcement<45` | `[code]` ~254 |
| `deathPenaltyRisk` | `capitalPunishment ∈ {Active, Rare}` | `[csv]` CapitalPunishmentType |
| `cloningTier` | see §6.1 | `[code+csv]` |

### 5.3 Enemy quality templates `[code]`

| Enemy | Tier formula | Source |
|---|---|---|
| police | `lawEnforcement ≥80 elite / ≥60 trained / ≥40 standard / else militia` | `[code]` ~344 |
| military | `militaryServices ≥80 elite / ≥60 trained / ≥40 standard / else militia` | `[code]` ~351 |
| gang | `score=corruption−lawEnforcement; ≥30 syndicate / ≥10 cartel / ≥−10 organized / else street` | `[code]` ~358 |
| terrorist | `terror≥70 army / ≥40 network / >0 cell / else null` (terror: Active=75,Rare=25,Inactive=0) | `[code]` ~367 |

### 5.4 Recruitment pool `[csv + code]`

```
poolSizeCS = lswActivityCS (§4.1)            // −2..+2
           + bestCityRecruitCS (§4.2)        // single best, not stacked
           + (territory Home ? +2 : 0)
           + (populationRating ≥ 70 ? +1 : 0)  // Country_Attribute_Effects "Population High = +2CS recruitment"
powerAffinity = cultureRegion.powerAffinity ∪ cityType.lswAffinity
```
Source: `Country_Attribute_Effects.csv` Population/LSWActivity rows; `City_Type_Effects.csv` recruit column; `Culture_Region_Effects.csv` power affinity.

### 5.5 Which stats drive which consumer (the spine map)

| Consumer system | Reads from profile | Driving country/city/culture stats |
|---|---|---|
| **Mission generation** | `methodCS`, `flags`, `enemies`, `access` | corruption, lawEnforcement, lswActivity, terrorism, city types, crimeIndex |
| **Shop / base pricing** | `multipliers.price/weaponPrice/techPrice` | gdpPerCapita, militaryBudget, science, digitalDevelopment |
| **Combat difficulty** | `enemies`, `methodCS.lswCombat`, `methodCS.detectionRisk` | military/lawEnforcement skill, lswActivity, intel |
| **Investigation** | `methodCS.*Investigation`, `combined.surveillance` | gov type, media, science, cyber, city types, culture |
| **Recruitment** | `recruit.*` | lswActivity, regulations, city types, culture affinity |
| **Hospital / healing** | `multipliers.healDays`, `combined.medical`, `combined.cloning` | healthcare, gdp, lifestyle, science, cloning law |
| **News / fame** | `multipliers.* (newsSpread)`, `combined.media` | mediaFreedom, corruption, cyber |
| **Travel / world map** | `enemies`, `access`, `combined.borderControl` | military, intel, lawEnforcement, terrain (passed through) |

---

## 6. Combined-effects subsystems (the emergent layer)

Bible §8 + §13 ruling #9: **these must be CONSUMED, not just computed.** Each subsystem already has a typed interface and formula in `combinedEffects.ts`; this section makes the formulas canonical and ties each to a consumer.

### 6.1 Cloning `[code: combinedEffects.ts calculateCloningSystem]`

| Field | Formula | Source |
|---|---|---|
| `cloneQuality` | `round((healthcare + science)/2)` | `[code]` ~55 |
| `degradationRate` | `max(5, 30 − science×0.25)` | `[code]` ~58 |
| `baseCost` | `round(50000 × (gdpPerCapita/50) × (1.5 − science/200))` | `[code]` ~61 |
| `waitTime` (days) | `max(7, round(60 − healthcare×0.5))` | `[code]` ~69 |
| `canCloneSupers` | `science ≥ 80 AND cloning==='Legal'` | `[code]` ~79 |
| `memoryTransfer` | `science ≥ 70 AND cyberCapabilities ≥ 60` | `[code]` ~80 |
| `blackMarketClones` | `cloning==='Banned' AND corruption ≥ 50 AND science ≥ 30` | `[code]` ~86 |

> **RULING — reconcile the two cloning encodings.** `Country.cloning` is the enum (`Banned/Regulated/Legal`) used by code. `Country_Attribute_Effects.csv` "Cloning" row ALSO describes a 0–90 numeric: `0 = permadeath`, `Basic = 50% resurrection / 30-day recovery`, `Advanced = 90% resurrection / 7-day recovery`. **Map enum→tier:** `Banned→none (permadeath, unless blackMarketClones)`, `Regulated→basic (50%/30d)`, `Legal + science≥80→advanced (90%/7d)`, else `Legal→basic`. The numeric column (e.g. Norway 20, US 49, North Korea 83) is retained as a **facility-density tiebreaker** only. Consumer: **Hospital/resurrection** (Bible §5.6, §7.6).

### 6.2 The other 11 subsystems

Driver formulas (Bible §8 table is the contract; `combinedEffects.ts` implements several):

| System | Driver formula (normalized 0–100 then banded) | Primary consumer |
|---|---|---|
| **Black market** | `corruption + militaryBudget − lawEnforcement` | weapon access & `weaponPrice` |
| **Surveillance** | `intelligenceBudget + cyberCapabilities + (100−mediaFreedom)`, /3 | detection speed, `hacking` CS |
| **Medical** | `healthcare + gdpPerCapita + lifestyle`, /3 | `healDays`, hospital quality |
| **Research** | `science + higherEducation + gdpNational + cyberCapabilities`, /4 | `researchSpeed`, tech unlock gate |
| **Organized crime** | `corruption + (100−lawEnforcement)`, /2 | gang missions, underworld contacts |
| **Mercenaries** | `militaryBudget + gdpNational + corruption`, /3 | merc availability/quality/price |
| **Safe houses** | `corruption + (100−lawEnforcement) + (100−intelligenceServices)`, /3 | hideout security, off-grid travel |
| **Border control** | `militaryBudget + intelligenceServices + lawEnforcement`, /3 | visa difficulty, smuggling, escape |
| **Media control** | `mediaFreedom + corruption + cyberCapabilities`, /3 | story planting, censorship, `newsSpread` |
| **Politics** | `gdpNational + corruption + mediaFreedom`, /3 | lobbying, bribe, coup chance |
| **LSW affairs** | `lswActivity + intelligenceServices + militaryBudget + science`, /4 | registration, govt stance, public opinion |

> **RULING — `(100 − stat)` inversions are intentional.** Bible §8 writes `(100−MediaFreedom)`, `(100−Law)`, `(100−Intel)` to express "absence of X helps the criminal/covert side." Implement literally. All 12 normalize to 0–100, then `band()` (§3) selects effect copy.

### 6.3 Attribute-combination flags (`Country_Attribute_Effects.csv` "ATTRIBUTE COMBINATION EFFECTS")

| Flag | Trigger (both High per §3) | Effect | Source |
|---|---|---|---|
| `SecurityState` | military **High** + intel **High** | all covert `−2CS`, all official `+2CS` | csv row |
| `FailedState` | governmentPerception Low + corruption **High** | no legal methods work; only force/bribery | csv row |
| `InnovationHub` | science **High** + higherEducation **High** | `+3CS all tech research`; unique tech | csv row |
| `LSWHaven` | lswActivity **High** + lswRegulations Legal | `+4CS recruitment`; LSW tourism | csv row |
| `MedicalCenter` | healthcare **High** + cloning Legal | fastest healing; best resurrection | csv row |
| `Lawless` | corruption **High** + crime High | all criminal methods `+3CS`; no legal consequences | csv row |

Flags are computed once per country and surfaced in the phone Country Brief (§7) and consumed by mission-gen as **template selectors** (e.g. `FailedState` → only force/bribe mission variants offered).

---

## 7. UI/UX hooks

The Spine is invisible mechanics; these are the surfaces that make it *felt* (Bible Pillar #5: "UI is gameplay").

### 7.1 Phone — "Country Brief" card (pauses time)
When the player opens a country on the phone, render a card driven by `LocationEffectProfile`:
- **Header chips:** territory type (`Home`/`Hostile` color-coded), active world flags (`SecurityState`, `LSW Haven`…).
- **Method rating bars:** show top 4 method CS as `+2`/`−3` badges with plain-English labels ("Covert ops: +2", "Public heroics: ILLEGAL here").
- **At-a-glance gates:** icons for `legalPublicOps`, `blackMarket`, `cloningTier`, `deathPenaltyRisk`.
- **Cost preview:** "Weapons ~70% price · Bribes cheap · Hospital slow."
- **OWNER-FORK:** whether the brief shows *exact* CS numbers or only qualitative bars (sim-depth vs. accessibility). Default: bars on phone, exact numbers in a "details" expander.

### 7.2 World map — sector tint & overlay
- Sector base tint by **dominant flag** (e.g. red wash = `Hostile`/`Lawless`, blue = `SecurityState`, green = `LSWHaven`). NO purple (global art rule).
- Hover tooltip: territory type + the single highest-magnitude method CS ("Best here: Underground +3").
- Deploy confirmation surfaces `detectionRisk` and enemy template tiers so the player knows what they're walking into.

### 7.3 Laptop — Investigation & shop integration
- Investigation method picker shows the **resolved CS** next to each method (Covert/Official/Force/Diplomatic), already including city + culture + faction stacking — so the player sees *why* Force is better than Official in a `FailedState`.
- Shop/base build screens apply `multipliers.price/weaponPrice/techPrice` live and show the delta vs. a 1.0 baseline.

### 7.4 Combat overlay (symbolic combat)
Per the symbolic-combat directive, the Spine reaches combat via **two glyph badges** on the encounter header, not 3D:
- **Enemy quality glyph** (militia→elite) from `enemies.*`.
- **Environment CS glyph** showing the net `lswCombat`/`detectionRisk` modifier (e.g. "⚠ +2 enemy LSW activity").
No new combat geometry — combat reads scalar CS and enemy tiers only.

### 7.5 Personality target-selection hook (`PERSONALITY TARGET SELECTION` csv)
The 20-personality → target-preference map is part of the spine's *character* layer (it parameterizes the AI templates the country spawns). Encode as a flat lookup:

```
PERSONALITY_TARGET[1..20] = [1,3,4,4,1,3,4,1,2,2, 1,4,2,3,3,3,2,5,5,2]
// 1=Most Health, 2=Least Health, 3=Major Threat(most dmg dealt),
// 4=Minor Threat(least dmg dealt), 5=Random
```
Source: `Combat Compendium REAL - 🎯PERSONALITY TARGET SELECTION🎯.csv` (single data row, verbatim). Consumer: combat AI target choice (Bible §5.10). The country/city does not change these values — it changes *which* personalities the local enemy pool draws from (e.g. `Lawless` → more aggressive bully/pragmatist archetypes). **OWNER-FORK:** the personality→archetype→country-pool mapping is a content decision (the 20 personality *names* live in the FIST GDD and `Personality, Emotions, Age` notes, not as a clean table yet — see §9 Q3).

---

## 8. Edge cases & failure modes

| # | Case | Required handling |
|---|---|---|
| E1 | **Missing/blank stat** (e.g. Serbia `Cloning` blank, Morocco `Population=4992` typo, Nicaragua `LSWRegulations` blank) | Treat blank as **Medium band default = 50**; treat enum blanks as the most-restrictive enum (`Banned`/`Regulated`). Never `NaN`. Log a data-warning. (Source: World Bible Country.csv has confirmed blanks in those rows.) |
| E2 | **Stat out of 0–100** (raw range is nominally 20–90) | Clamp to `[0,100]` before `band()`. |
| E3 | **Country with no city context** (world-map sector w/o selected city) | Resolve with `cityCS = 0`; use only country+culture+faction layers. |
| E4 | **Multi-type city, none matching the method** | City contributes 0 CS for that method (don't fabricate). |
| E5 | **CS stack exceeds bounds** | Clamp `[−6,+4]` (§4.5). A `Home (+3) + Democracy legal (+2) + city (+2)` legal op clamps to `+4`, not `+7`. |
| E6 | **Conflicting territory** (country in two factions' starting lists, e.g. Pakistan partial-CN) | Active player faction wins; if neither, compute via relations matrix; default `Neutral`. |
| E7 | **`Banned` public ops but player acts publicly** | Apply `publicOps −3CS` AND flip a `legalConsequence` event (Bible §9 reputation pipeline); if `deathPenaltyRisk`, escalate capture outcome. |
| E8 | **`cloning='Banned'` + character dies** | Permadeath UNLESS `blackMarketClones` true (§6.1) — then offer a risky, defect-prone black-market clone. |
| E9 | **Faction signature method on cooldown** | Do not add its CS; grey it out in UI with remaining cooldown (US 7d / IN 3d / CN 1d / NG none). |
| E10 | **Same value lands exactly on a band edge (35/36, 65/66)** | `band()` is inclusive-low: `≤35 low`, `≤65 medium`, else high (matches CSV header ranges `0-35 / 36-65 / 66-100`). |
| E11 | **Profile recomputed every frame** | **Memoize** `LocationEffectProfile` per `(countryCode, cityName, faction, day)`; invalidate on faction/relations/world-state change only. (Perf: 168×1050 combos must not recompute on hover.) |

---

## 9. Integration points

**Reads (inputs):**
- `allCountries.ts` / `allCities.ts` (canonical datasets, Bible §13 #10).
- `Faction_Specification.csv` + relations matrix (territory type).
- `Culture_Region_Effects.csv`, `City_Type_Effects.csv`, `Stat_Rank_Mapping.csv`.
- Active world-state (relations, elections) for territory + flag invalidation.

**Writes (outputs consumed by):**
- **Mission generation** (`MISSION_GENERATION_SYSTEM.md`) — `flags`, `methodCS`, `enemies` select templates & difficulty.
- **Investigation** (`Investigation_*` tables, `InvestigationCenter.tsx`) — `methodCS.*Investigation`.
- **Pricing** (shop/base build) — `multipliers.*`.
- **Combat** (`CombatScene.ts`) — `enemies.*` tiers, `methodCS.lswCombat/detectionRisk` scalars only (symbolic).
- **Hospital** (`HospitalScreen.tsx`) — `multipliers.healDays`, `combined.cloning`, `combined.medical`.
- **News/fame** (`NewsBrowser.tsx`, `Public_Perception.csv`) — `multipliers.newsSpread`, `combined.media`.
- **Recruitment** — `recruit.*`.
- **Travel** (`Travel_Time_System.csv`) — `combined.borderControl`, `enemies` for ambush rolls.

**The public API (build this):**
```ts
function resolveLocationProfile(
  country: Country, city: CityContext | null,
  faction: FactionId, relations: RelationsMatrix
): LocationEffectProfile;            // memoized

function getMethodCS(profile, tag: MethodTag): number;   // clamp [-6,4]
function getCombined<K extends keyof CombinedSystems>(profile, key: K): CombinedSystems[K];
```

---

## 10. RULING notes (collected)

- **R1 — Band thresholds.** Use `Country_Attribute_Effects.csv` headers verbatim: Low `0–35`, Medium `36–65`, High `66–100`, inclusive-low at edges. (§3)
- **R2 — CS clamp `[−6,+4]`.** Per `Stat_Rank_Mapping.csv` CS reference; applied only to the stacked total. (§4.5)
- **R3 — Additive stacking** on the CS axis, never multiplicative (Bible §3.3). (§4.5)
- **R4 — `healDays = 2.0 − healthcare/100`, clamp `[0.5,2.0]`.** Derived from "faster healing" High-band text; no explicit multiplier in CSV. (§5.1)
- **R5 — `researchSpeed = 0.5 + science/100`** (rebased from code's `science/100`). (§5.1)
- **R6 — Cloning enum↔numeric reconciliation** with the resurrection %/recovery-day map from the CSV Cloning row. (§6.1)
- **R7 — `(100−stat)` inversions implemented literally.** (§6.2)
- **R8 — Blank stat → Medium=50 (numeric) / most-restrictive (enum); never NaN.** (E1)
- **R9 — Territory overlay is all-methods and added once, then per-method rows stack, then clamp.** (§4.5)
- **R10 — Personality target table encoded verbatim** as the 20-int array; country changes the *pool*, not the values. (§7.5)

## 11. OWNER-FORK notes (decisions the owner must make)

- **F1 — CS visibility on the phone.** Show exact `±CS` numbers to the player, or qualitative bars only? (Sim-depth vs. accessibility.) Recommended default: bars + optional details expander. (§7.1)
- **F2 — Personality → archetype → country enemy-pool mapping.** The 20 personality *names* and which archetypes a `Lawless`/`SecurityState`/`LSWHaven` country spawns is unauthored content. Needs an owner table. (§7.5, §9 Q3)
- **F3 — Black-market clone risk economy.** Defect chance is in code (`25%`), but whether a `Banned`-country death should *ever* be recoverable (vs. true permadeath for tension) is a design-tone call tied to the time-travel save economy. (E8)
- **F4 — Faction signature-method cost.** Cooldowns are in the CSV, but whether invoking them also costs money/reputation/political-capital is unspecified. (§4.4)
- **F5 — World-flag art palette.** Sector tints per flag (must be non-purple); needs an owner-approved color key. (§7.2)
- **F6 — Numeric Cloning column usage.** Keep the 0–90 numeric (Norway 20 / US 49 / NK 83) as facility-density flavor, or promote it to a real second axis? Default: flavor only. (§6.1)

---

## 12. Open questions

- **Q1 — Reconcile legacy code cutoffs to the band model.** `locationEffects.ts` uses scattered `>60`/`>40`/`<45` cutoffs. Migrate them to `band()` (§3) for one source of truth, or keep code cutoffs where they encode finer gradients (e.g. enemy tiers at 80/60/40)? *Recommendation: keep the multi-tier enemy/equipment cutoffs (they're 4-band, intentional); migrate binary cutoffs to `band()`.*
- **Q2 — Relations matrix format.** Territory-type resolution needs the country×country relations matrix in a typed form. The World Bible "Countries Relations Chart" exists as a sheet — does a parsed `RelationsMatrix` already exist in code, or must it be generated? (Blocks §4.4 for non-starting countries.)
- **Q3 — The 20 personality names.** The target-preference *values* are sourced (§7.5), but the ordered *names* matching indices 1–20 are only in the FIST GDD prose + `Personality, Emotions, Age` notes. Need an authoritative ordered list to label the array. (Tied to F2.)
- **Q4 — Culture "Similar" adjacency.** The social matrix needs a defined adjacency graph ("Similar = adjacent regions or shared history" is prose). Which of the 14 codes are mutually "Similar"? Needs an owner-defined adjacency table.
- **Q5 — Crime index source.** `City_Type_Effects.csv` crime bands use 0–100; Cities sheet says CrimeIndex can be `−20` ("very low"). Confirm the live `crimeIndex` range and normalize before banding. (E2-adjacent.)
