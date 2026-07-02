# 12 — City Types / Culture Regions / Terrain Effects

> **System owner doc.** Build-ready spec for the geopolitical-flavor layer of the spine: the three
> location classifiers that turn a country/city/sector into concrete ±CS modifiers, recruit pools,
> equipment access, map templates, and travel cost.
>
> **Status:** spec (not yet fully wired). Implements Bible §2 spine step 2–3 and §6.2/§6.3.
>
> **Primary source tables** (open these first):
> - `docs/csv-source-data/Game_Mechanics_Spec/City_Type_Effects.csv`
> - `docs/csv-source-data/Game_Mechanics_Spec/Culture_Region_Effects.csv`
> - `SuperHero Tactics/TerrainCodes.csv`
> - `docs/csv-source-data/SuperHero Tactics World Bible - Cities.csv`
> - `docs/csv-source-data/Game_Mechanics_Spec/Country_Attribute_Effects.csv` (crime/pop interactions live here & in City_Type_Effects)
> - `docs/csv-source-data/Game_Mechanics_Spec/Tactical_Grid_System.csv` (terrain→movement/cover/template)
> - `docs/csv-source-data/Game_Mechanics_Spec/Travel_Time_System.csv` (sector→travel cost)
> - `SHT_MECHANICS_BIBLE.md` §2 (spine), §3 (CS engine), §5.3/§6.3 (terrain combat), §6.2 (city types)

---

## 1. Overview & Player Fantasy

**The world has texture you can read off the map.** Standing in a city is never neutral: a *Military
Industrial* city in a *Free-media, low-corruption* country in the *North America* culture region on a
*Desert* sector plays completely differently from a *Temple Village* in a *high-corruption South Asia*
country on a *Jungle Mountains* sector. The player learns to **read a destination before they go** —
the phone shows the modifiers, and the choice of *where* to run a mission becomes as tactical as *how*.

This system is the **second and third rungs of the spine** (Bible §2): COUNTRY stats already set rules,
prices, and factions; **CITY TYPE** narrows that to tactical options/services/encounters/recruits,
**CULTURE REGION** sets social ±CS + which powers locals have, and **TERRAIN** sets map tactics + travel
cost + the combat map template. All three resolve to the same universal currency — **Column Shifts (±CS)**
on the `Universal_Table_FIXED` chart (Bible §3.3) — so they stack cleanly with everything else.

It is **flavor that is mechanically consumed**: missions, pricing, difficulty, recruit pools, equipment
access, and the combat map all read from it. Per Bible §13, "combined-effects must be CONSUMED" — this
doc names every consumer.

Three classifiers, three jobs:

| Classifier | Source field | Count | Drives |
|---|---|---|---|
| **City Type** | `CityType1..CityType4` on each city | 11 types, up to 4/city | Investigation ±CS, recruit affinity, equipment access, special ability, threat table, combat collateral modifier |
| **Culture Region** | `CultureCode` on each city (inherited from country) | 14 regions | Social ±CS, language barrier, religion respect, LSW power affinity, regional investigation specialty |
| **Terrain** | `TerrainCode` of the **sector** the city sits in | 25 codes → 9 engine buckets | Movement cost, cover density, concealment, combat map template, world-map travel multiplier, environmental hazard |

---

## 2. Data Schema

### 2.1 City record (source of truth: `World Bible - Cities.csv`; live mirror `MVP/src/data/allCities.ts` / `cities.ts`)

The Cities CSV header is literally:
`Sector,CountryCode,CultureCode,CityName,Country,Population,PopulationRating,PopulationType,CityType1,CityType2,CityType3,CityType4,HVT,CrimeIndex,SafetyIndex`.

```ts
interface City {
  sector: string;            // e.g. "E08" (may be empty in source; see Edge Case EC-1)
  countryCode: number;       // FK → Country.CountryCode
  cultureCode: number;       // 1..14 → CultureRegion (Culture_Region_Effects.csv)
  cityName: string;
  country: string;           // display name
  population: number;
  populationRating: number;  // 2..7 (drives equipment/stealth/resource — §3.4)
  populationType: PopulationType; // 'Village'|'Small Town'|'Town'|'City'|'Large City'|'Mega City'
  cityType1: CityTypeCode;   // PRIMARY — dominant character of city
  cityType2: CityTypeCode | '';
  cityType3: CityTypeCode | '';
  cityType4: CityTypeCode | '';
  hvt: string[];             // high-value-target descriptors (mission seeds)
  crimeIndex: number;        // 0..100
  safetyIndex: number;       // 0..100 (≈ 100 - crimeIndex in source data)
}

type CityTypeCode =
  | 'Temple' | 'Military' | 'Political' | 'Industrial' | 'Resort'
  | 'Seaport' | 'Mining' | 'Educational' | 'Company' | 'Village';
// NOTE: City_Type_Effects.csv defines exactly these 10 rows. 'Village' doubles as a
// CityType AND a PopulationType — see EC-4. (RULING: 11 "types" in §1 counts Village twice;
// canonical CityType enum has 10 members.)

type PopulationType =
  | 'Village' | 'Small Town' | 'Town' | 'City' | 'Large City' | 'Mega City';
```

### 2.2 CityType effect record (source: `City_Type_Effects.csv`, rows 3–21)

```ts
interface CityTypeEffect {
  type: CityTypeCode;
  description: string;
  investigationBonus: { tags: string[]; cs: number };   // e.g. {tags:['Military','Security'], cs:+2}
  combatModifier: string;                                // narrative + collateral CS (parse table §3.1)
  recruitmentBonus: { affinity: string; cs: number };   // e.g. {affinity:'military-trained', cs:+3}
  equipmentAccess: string[];                             // unlock tags
  specialAbility: { id: string; effect: string };        // e.g. Arsenal Access: -20% military cost
  typicalThreats: string[];                              // mission/encounter seeds (3 each)
  lswAffinity: string[];                                 // power tags locals tend to have
}
```

### 2.3 CultureRegion effect record (source: `Culture_Region_Effects.csv`, rows 3–29)

```ts
interface CultureRegionEffect {
  cultureCode: number;        // 1..14
  regionName: string;
  countriesExample: string[];
  investigationModifier: { tags: string[]; cs: number };  // regional specialty
  lswPowerAffinity: string[]; // 2× likely power types (Power_Affinity rule, row 34)
  socialModifier: string;     // narrative custom
  languageFamily: string;
  religionInfluence: string;
  specialCharacteristic: string;
}
```

### 2.4 Terrain record (source: `TerrainCodes.csv` = code→name only; effects added by this spec from `Tactical_Grid_System.csv` + Bible §6.3)

```ts
interface TerrainEffect {
  code: number;               // 1..25 (TerrainCodes.csv)
  name: string;               // e.g. "Jungle Mountains"
  engineBucket: SectorTerrain; // 9-value collapse used by MVP/src/data/sectors-populated.ts
  moveCostClass: 'Clear'|'Rough'|'Difficult'|'Impassable'; // Tactical_Grid_System.csv rows 24–27
  travelMultiplier: number;   // ×base sector travel time (Bible §6.3) — see §3.3
  coverDensity: 'none'|'light'|'medium'|'heavy';
  concealment: boolean;       // soft cover / harder to spot (Tactical_Grid_System row 57)
  hazard?: 'radiation'|'cave-in'|'cold'|'drowning'|'none';
  combatMapTemplate: string;  // which Phaser map template this terrain selects (§5.4)
}
```

---

## 3. Exact Numbers, Tables & Formulas (each cited)

### 3.1 City Type table — full values (source `City_Type_Effects.csv` rows 3–21)

| Type | Investigation | Recruit | Equipment unlock | Special ability | Collateral combat mod |
|---|---|---|---|---|---|
| **Temple** | +2CS Religious/Mystical | +2CS mystical LSWs | Religious artifacts; Mystical | **Sanctuary** — hide from authorities 24 h | Civilians present **−1CS collateral** |
| **Military** | +2CS Military/Security | +3CS military-trained | Military weapons; Armor; Vehicles | **Arsenal Access** — military gear **−20% cost** | Military response if detected |
| **Political** | +2CS Political/Diplomatic | +1CS government-connected | Diplomatic creds; Gov intel | **Political Cover** — official investigation status | **High legal consequences** if caught |
| **Industrial** | +2CS Corporate/Sabotage | +2CS tech/science | Industrial equip; mods | **Workshop** — equipment repair/mod available | **Environmental hazards** in combat |
| **Resort** | +1CS Social/Surveillance | +1CS wealthy/connected | Luxury; Social access | **High Society** — elite networking events | Civilian density very high **−2CS collateral** |
| **Seaport** | +2CS Smuggling/Maritime | +2CS maritime | Naval weapons; Boats; Diving | **Maritime** — water ops enabled | Naval/Coast Guard response possible |
| **Mining** | +2CS Environmental/Industrial | +2CS earth/strength | Mining equip; Explosives; Raw mats | **Underground** — tunnel networks | Hazardous terrain (cave-ins, explosions) |
| **Educational** | +2CS Academic/Research | +3CS intelligent/scientific | Research data; Lab; Academic contacts | **Research** — +1CS all tech investigations | Student presence (reputation risk) |
| **Company** | +2CS Corporate/Financial | +2CS corporate-connected | Corporate resources; Legal support | **Corporate** — business intel networks | Security systems active |
| **Village** | +1CS Rural/Traditional | +1CS local/traditional | Traditional weapons; Local knowledge | **Local Trust** — faster community rep | **No backup response available** |

LSW affinity per type (used by recruit-pool power weighting, §4.2): Temple→Mystical/Divine; Military→Combat/Tech-enhanced;
Political→Psychic/Social; Industrial→Strength/Durability; Resort→Appearance/Social; Seaport→Water/Aquatic;
Mining→Earth/Strength; Educational→Intelligence/Invention; Company→Tech/Wealthy; Village→Nature/Traditional.

**Multi-type stacking rules (source rows 24–30):**
- **Stacking** — investigation bonuses **stack** for matching investigation types across all the city's types.
- **Primary_Type** — `CityType1` determines the dominant character (used for default map template tint, dominant threat).
- **Secondary_Caps** — `CityType2..4` give **half bonus, round down**, if their tag matches. (So a Military(+2) + Educational(+2) city investigating "Tech" via Educational's Research ability gives +2 from Educational-primary OR +1 if Educational is secondary. Implement: full CS if the matching type is `CityType1`, `floor(cs/2)` if it is `CityType2..4`.)
- **Equipment_Access** — union of all equipment tags from all of the city's types.
- **Recruitment_Best** — do **NOT** stack recruit bonuses; **use the single best applicable** recruit CS for the LSW being recruited.
- **Threat_Union** — encounter/mission generator may draw a threat from **ANY** of the city's types.

### 3.2 Crime-index interactions (source `City_Type_Effects.csv` rows 33–38)

Apply on top of city-type CS, keyed off `crimeIndex`:

| Crime band | Effect |
|---|---|
| Very Low (0–20) | +1CS all investigations (organized society); **−1CS criminal recruitment** |
| Low (20–40) | no modifier (balanced) |
| Moderate (40–60) | −1CS political investigations (corruption); +1CS criminal contacts |
| High (60–80) | −2CS official methods; +2CS underground methods; **combat more likely** |
| Very High (80–100) | −3CS all legal methods; +3CS criminal methods; **constant combat risk** |

`crimeBand(crimeIndex)` boundaries are inclusive-low/exclusive-high except the top: `[0,20) [20,40) [40,60) [60,80) [80,100]`.

### 3.3 Terrain table — full values

**Names** are authoritative from `TerrainCodes.csv` (25 codes). **Movement classes** map from
`Tactical_Grid_System.csv` rows 24–27 (Clear=1×, Rough=2×, Difficult=3×, Impassable=blocked).
**Travel multipliers** are from Bible §6.3 ("desert +50% move/low cover; jungle +75% & concealment;
mountains +100%; ice/snow hazards; wasteland/exclusion-zone radiation").

| Code | Name | Move class | World-map travel ×base | Cover | Conceal | Hazard | Notes/cite |
|---|---|---|---|---|---|---|---|
| 1 | Ocean | Impassable (foot)¹ | n/a (sea routes only) | none | no | drowning | ¹requires Boat/Ship/flight (Travel_Time §SEA) |
| 2 | Coastal | Clear | 1.0× | light | no | none | beach/shore |
| 3 | Islands | Clear | 1.0× | light | no | drowning(adjacent) | |
| 4 | Desert | Clear | **1.5×** (+50%, §6.3) | none | no | none | low cover; open sightlines |
| 5 | Paved Roads | Clear | **0.8×** (roads, Travel_Time row 6 fast-vehicle req.) | none | no | none | vehicle-friendly |
| 6 | Plains | Clear | 1.0× | none | no | none | |
| 7 | Unpaved Roads | Rough | 1.2× | none | no | none | |
| 8 | Grasslands | Clear | 1.0× | light | no | none | |
| 9 | Rocky Desert | Rough | **1.5×** (+50%, §6.3) | light | no | none | |
| 10 | Hills | Rough | 1.3× | light | no | none | elevation cover (Grid row 66) |
| 11 | Swamp | Difficult | 1.75× | light | yes | drowning | "deep water/mud" = Difficult (Grid row 26) |
| 12 | Snow | Rough | **1.5×** | none | no | cold | ice/snow hazard (§6.3) |
| 13 | Rain Forest/Jungle | Difficult | **1.75×** (+75%, §6.3) | medium | yes | none | concealment (§6.3) |
| 14 | Mountains | Difficult | **2.0×** (+100%, §6.3) | heavy | yes | cave-in(rockfall) | |
| 15 | Light Forest | Rough | 1.3× | light | yes | none | |
| 16 | Heavy Forest | Difficult | 1.6× | medium | yes | none | |
| 17 | Jungle Mountains | Difficult | **2.0×** (max of jungle 1.75/mtn 2.0, §6.3) | heavy | yes | cave-in | take worse of the two |
| 18 | Forested Mountains | Difficult | **2.0×** | heavy | yes | cave-in | |
| 19 | High Altitude Mountains | Difficult | **2.0×** | heavy | yes | cold + cave-in | flight altitude penalties apply |
| 20 | Lake | Impassable (foot)¹ | n/a | none | no | drowning | |
| 21 | River | Difficult | 1.75× | light | no | drowning | crossable on foot at fords |
| 22 | Ice | Rough | **1.5×** | none | no | cold | slip hazard |
| 23 | Farmland | Clear | 1.0× | light | no | none | maps to Village/agriculture content |
| 24 | Wasteland | Rough | 1.4× | light | no | radiation | §6.3 |
| 25 | Exclusion Zone | Difficult | 1.6× | medium | yes | **radiation** | §6.3; Chernobyl-mutant content (Culture 10) |

> **RULING (R-T1) — travel multipliers for codes not named in §6.3.** Bible §6.3 only names desert (+50%),
> jungle (+75%), mountains (+100%), ice/snow (hazard), wasteland/exclusion-zone (radiation). The other
> codes' multipliers above are derived **by movement class**, not invented per-code: `Clear=1.0×, Rough∈[1.2–1.5]×,
> Difficult∈[1.6–2.0]×`, with the named codes pinned to their §6.3 values and the rest ranked between by class.
> Paved roads get **0.8×** because Travel_Time_System row 6 makes fast vehicles road-dependent. Any future
> per-code tuning lives in one table; nothing here contradicts a named source number.

**In-combat terrain → grid effects** (already specced in `Tactical_Grid_System.csv`, this just maps terrain→those rows):
- Move class drives per-square cost: Clear `1`, Rough `2`, Difficult `3`, Impassable `enter=false` (Grid rows 24–27).
- Cover density seeds default `coverTier` for natural tiles: light `+1CS`, medium `+2CS`, heavy `+3CS` defense (Grid rows 62–64).
- `concealment:true` adds soft cover: "harder to see, not harder to hurt once hit" (Grid row 57) — a `−1CS` to enemy *perception/spot*, not to-hit.
- Hazards: `radiation` ticks per Bible §5.5 radiation rider (living-only); `cold` → escalating −CS like weather (Bible §5.4); `cave-in`/`drowning` are scripted environment objects, not passive ticks.

### 3.4 Population-rating interactions (source `City_Type_Effects.csv` rows 42–47; cross-checked `Country_Attribute_Effects.csv` rows 3–5)

Keyed off `populationRating` (2–7) — **equipment ceiling, stealth, resources, parallel ops:**

| Pop rating | Pop type | Equipment | Stealth CS | Resource CS | Parallel ops |
|---|---|---|---|---|---|
| 2 | Village | Limited | +2CS | −2CS | 1 |
| 3 | Small Town | Basic | +1CS | −1CS | 1 |
| 4 | Town | Standard | 0 | 0 | 1 |
| 5 | City | Full | −1CS | +1CS | 1 |
| 6 | Large City | Premium | −2CS | +2CS | 1 |
| 7 | Mega City | All | −3CS | +3CS | **multiple simultaneous** |

### 3.5 Culture region table — full values (source `Culture_Region_Effects.csv` rows 3–29)

| Code | Region | Investigation specialty | LSW power affinity | Special characteristic |
|---|---|---|---|---|
| 1 | North Africa | +1CS historical | Fire; Sand; Sun | Ancient Egyptian tech possible |
| 2 | Central Africa | +1CS tribal-network | Nature; Animal; Spirit | Deep-jungle concealment; tribal LSW traditions |
| 3 | Southern Africa | +1CS mining/resource | Earth; Animal | Mineral-enhanced LSWs; apartheid history affects relations |
| 4 | Central Asia | +1CS Silk-Road/trade | Nomadic; Horse; Wind | Vast distances; nomadic informants |
| 5 | South Asia | **+2CS spiritual/mystical** | Mystical; Divine; Elemental | Ancient mystical traditions; yoga-enhanced LSWs |
| 6 | East + SE Asia | +1CS corporate/tech | Martial; Tech; Spirit | Martial-arts LSW traditions; corporate LSW programs |
| 7 | The Caribbean | +1CS smuggling | Voodoo; Water; Music | Voodoo-origin LSWs; pirate smuggling routes |
| 8 | Central America | +1CS cartel/trafficking | Aztec; Jungle; Death | Aztec/Mayan mystical LSWs; cartel LSW armies |
| 9 | Western Europe | +1CS corporate/political | Tech; Noble; Classical | Oldest LSW documentation; aristocratic LSW families |
| 10 | Eastern Europe | +1CS Cold-War/spy | Winter; Nuclear; Psychic | Soviet super-soldier programs; Chernobyl mutants |
| 11 | Oceania | +1CS environmental | Nature; Ocean; Aboriginal | Dreamtime LSWs; isolated evolution |
| 12 | South America | +1CS jungle/cartel | Jungle; Ancient; Passion | Amazon mystical LSWs; Incan technology |
| 13 | North America | **+2CS technology** | Tech; Mutation; Patriotic | Most-documented LSW pop; superhero culture |
| 14 | Middle Eastern | +1CS religious/political | Divine; Desert; Ancient | Djinn-type LSWs; holy-site powers |

**Culture mechanical rules (source rows 33–43):**
- **Power_Affinity** — LSWs from a region are **2× as likely** to roll the listed power tags (recruit generation, §4.2).
- **Language_Barrier** — `−2CS all social methods` if the squad has **no speaker** of the region's `languageFamily`.
- **Religion_Respect** — `−1CS` if the player disrespects local religious customs (event-driven flag).
- **Cross_Cultural** — two countries sharing a `cultureCode` → `+1CS social interactions` between them.
- **Culture interaction matrix (rows 41–43):** Same culture `+2CS social`; Similar (adjacent region / shared history) `+1CS`; Neutral `0`; Opposed `−1CS`.

> **RULING (R-C1) — "Similar" and "Opposed" adjacency.** The matrix says "Similar = adjacent regions or
> shared history" but ships no adjacency list. Ship an explicit `CULTURE_ADJACENCY: Record<code, code[]>`
> map seeded from the regions' own `countriesExample`/`languageFamily` overlap (e.g. 1↔14 share Arabic/Islamic →
> Similar; 5↔6 adjacent Asia → Similar; 9↔13 share Western/secular-Christian, Germanic/Romance + English → Similar).
> "Opposed" pairs are **authored, not derived** (e.g. by Cold-War or colonial history) and default to **empty**
> until a designer fills them — absent an entry, two different cultures are **Neutral (0CS)**, never auto-Opposed.
> This avoids inventing relationship numbers while keeping the matrix usable.

---

## 4. How It Consumes the SPINE

The location context object is built once per "where the player is" and fed to every consumer. **Inputs are
all real source fields.** No standalone numbers — every CS below traces to §3.

### 4.1 Context assembly (the one function everything calls)

```
buildLocationContext(city, country, sector, squad) → LocationContext {
  cityTypes:      [city.cityType1..4 filtered]                 // → §3.1
  culture:        CultureRegionEffect[city.cultureCode]        // → §3.5
  terrain:        TerrainEffect[sector.terrainCode]            // → §3.3
  crimeBand:      crimeBand(city.crimeIndex)                   // → §3.2
  popTier:        city.populationRating                        // → §3.4
  // resolved CS bundles, each a sum of cited rows:
  investigationCS(tag): sum of matching city-type CS (primary full / secondary floor(cs/2))
                        + crimeBand mod + culture specialty if tag matches + Educational Research +1CS(tech)
  socialCS:       cultureMatrix(squad.culture, city.culture)  // §3.5 matrix
                  + (squad has languageFamily speaker ? 0 : −2)   // language barrier
                  + (religionRespectFlag ? −1 : 0)
  recruitCS(lsw): BEST single city-type recruit CS for lsw          // Recruitment_Best, never stacks
                  + crimeBand criminal mod (if criminal lsw)
                  + popTier… (no recruit term; popTier is equip/stealth/resource only)
  equipmentTags:  union of all city-type equipmentAccess           // Equipment_Access union
  equipmentTier:  popTier → {2:Limited…7:All}                      // §3.4
  stealthCS:      popTier stealth value                            // §3.4
  resourceCS:     popTier resource value                           // §3.4
  parallelOps:    popTier === 7 ? many : 1                         // §3.4
}
```

### 4.2 Which spine stats drive each output (with formula)

| Spine input (field) | Output | Formula / rule | Source |
|---|---|---|---|
| `cityType1..4` | investigation ±CS | primary full CS, secondary `floor(cs/2)`, all stack by tag | City_Type_Effects rows 3–21, 27 |
| `cityType1..4` | equipment unlock set | union of `equipmentAccess` tags | row 28 |
| `cityType1..4` + `lsw.tags` | recruit ±CS | **best single** matching recruit CS (no stack) | row 29 |
| `cityType1..4` | special ability | enable e.g. Sanctuary/Arsenal/Workshop | rows 3–21 |
| `cultureCode` (city, inherited from country) | social ±CS | matrix + language −2 + religion −1 | Culture rows 36–43 |
| `cultureCode` | recruit power weighting | listed affinity tags **2× weight** | row 34 |
| `cultureCode` + investigation tag | investigation ±CS | regional specialty if tag matches | row 33 |
| `crimeIndex` | legal vs underground ±CS, combat-likelihood | crime band table | City_Type_Effects rows 33–38 |
| `populationRating` | equipment tier, stealth/resource ±CS, parallel ops | pop tier table | rows 42–47 |
| `sector.terrainCode` | move cost, cover, concealment, map template, travel × | terrain table | TerrainCodes + Grid + §6.3 |
| `country.*` (Military/Intel/Healthcare/Science/Corruption/LSWRegulations…) | upstream rules/prices/factions | **already set before this layer** | Country_Attribute_Effects |

**Combined examples (these are the emergent payoff, Bible §2 bottom of spine):**
- *Underground market access* in a city ⇐ `Mining/Seaport "Underground/Maritime"` ability **+** `crimeBand≥High` (+2CS underground) **+** country corruption (set upstream). All three real fields → one unlocked vendor.
- *Mystic recruit jackpot* ⇐ `Temple` (+2CS mystical recruit) **+** `cultureCode 5 South Asia` (Mystical affinity 2× **and** +2CS spiritual investigations) → a Temple in India yields the best mystic recruits in the game, with no invented numbers.

### 4.3 Difficulty / pricing consumption (Bible §13 "combined-effects must be CONSUMED")

- **Mission difficulty** = base − Σ(player-favorable CS from context) + Σ(player-unfavorable CS). A Mega-City
  (−3CS stealth) High-crime (constant combat) Mountains (move 3×, heavy cover for defenders) mission is concretely
  harder *and the player can see why on the phone*.
- **Pricing** — `Arsenal Access −20%` (Military) and `equipmentTier` (pop) directly modify the equipment shop;
  `crimeBand` shifts black-market price (consumed by the black-market combined system in `combinedEffects.ts`).
- **Recruit pool** — culture affinity (2× weight) + city-type recruit CS shape *who shows up* and *how cheap*.

---

## 5. UI / UX Hooks

### 5.1 Phone — "Destination Brief" card (primary surface; pauses clock per Bible §1)
When the player taps any city on the world map, the phone shows a **read-before-you-go** brief:
- **Header:** city name, country flag, `PopulationType` glyph, primary `CityType1` icon + secondary type chips.
- **Culture badge:** region name + language-family icon; **red ⚠ if no squad speaker** (the −2CS social warning).
- **Three modifier rows** (City / Culture / Terrain) each rendered as `+N`/`−N` CS chips with a tooltip citing the source row text (e.g. "Military: +3CS recruiting military-trained LSWs").
- **Crime meter** (0–100) with its band label and the "combat likely" flag at High+.
- **Special abilities** available here (Sanctuary, Arsenal Access −20%, Workshop, Underground…) as actionable buttons where relevant.
- **Equipment tier** badge (Limited→All) and **parallel-ops** indicator for Mega Cities.

### 5.2 World map — terrain & culture overlays
- Terrain tint per sector already exists (`TERRAIN_COLORS`, sectors-populated.ts). Add a **culture-region heat overlay** (toggle) colored by `cultureCode`, and a **travel-cost overlay** showing the terrain `travelMultiplier` so route planning is legible.
- Hovering a sector shows its terrain name + move class + travel × (so the player feels mountains/jungle "cost more" before committing — Bible §1 "world that talks to you").

### 5.3 Laptop / investigation screen
- The investigation method picker shows **live ±CS** for the current city: e.g. in an Educational city the "Tech/Research" method lights up `+2CS` (type) `+1CS` (Research ability) `+2CS` (if Culture 13 North America). Methods the crime band penalizes show the −CS in red.

### 5.4 Combat overlay — terrain → map template + tile legend
- On "ENTER COMBAT", the terrain `combatMapTemplate` selects the Phaser map (Bible §6.3 "terrain picks the combat map template"; GDD: "downtown city streets, national parks, Nevada desert, moon surface"). `CityType1` tints the dressing (Industrial→factory props w/ explosive hazards; Resort→crowded civilians for the −2CS collateral rule).
- Natural-terrain tiles seed cover/concealment per §3.3; a small legend chip shows the active hazard (radiation/cold/cave-in) with its rule.

> **RULING (R-M1) — terrain→template mapping table.** Ship a `TERRAIN_MAP_TEMPLATE: Record<engineBucket, templateId[]>`
> (one or more templates per bucket, picked by `CityType1`). The 9 engine buckets, not the 25 codes, drive template
> selection to keep the art set bounded; codes that share a bucket (e.g. Mountains/Jungle Mountains/High-Altitude all → `mountain`)
> share templates but differ in hazard/cover from §3.3. Template *content* is art-team scope (OWNER-FORK F-3).

---

## 6. Integration Points (reads / writes)

**Reads from:**
- `allCities.ts` / `cities.ts` (city fields), `allCountries.ts` (country stats already resolved by Country_Attribute_Effects), `sectors-populated.ts` (`sector.terrain`), `Culture_Region_Effects.csv`, `City_Type_Effects.csv`, `TerrainCodes.csv`, `Tactical_Grid_System.csv`, `Travel_Time_System.csv`.

**Writes / feeds into:**
- `combinedEffects.ts` / `locationEffects.ts` — supplies the CS bundles the combined systems (black market, surveillance, safe houses, mercenaries…) already expect.
- **Mission/event generator** (HYBRID engine) — `typicalThreats[]` + `hvt[]` + `crimeBand` parameterize authored templates (Bible §1 events engine).
- **Recruit system** — culture affinity weights + city-type recruit CS shape the pool (`sht-character-builder`, `mercenaryPool`).
- **Equipment shop / pricing** — `equipmentTags`, `equipmentTier`, Arsenal `−20%`, crime-band black-market price.
- **Travel system** — `travelMultiplier` × the sector base costs in `Travel_Time_System.csv` (adjacent 1 day ground / 0.5 air; diagonal ×1.4).
- **Combat (CombatScene)** — `combatMapTemplate`, terrain cover/concealment/move-cost/hazard, collateral CS modifier (Temple −1, Resort −2).
- **Investigation center** — investigation ±CS per method.

---

## 7. Edge Cases & Failure Modes

- **EC-1 Missing sector code.** Many source city rows have a **blank `Sector`** (e.g. Algiers). → `terrain` is then unknown.
  **RULING (R-E1):** if `city.sector` is blank, resolve terrain from the **country's capital/primary sector**, else
  default `engineBucket='plains'` (Clear, 1.0×, no hazard) so the city is always playable. Log a data-gap warning
  (`World_Data_Gap_Analysis.csv` is the existing place for these).
- **EC-2 City with zero CityTypes.** Source allows all four blank. → treat as `['Village']`-equivalent default (Local Trust, +1CS rural, no backup) so every city has a character. Mark as data gap.
- **EC-3 CityType `Village` vs PopulationType `Village`.** They are different columns (type-effect vs pop-tier). A city can be CityType `Industrial` but PopulationType `Village`. Apply **both** independently (§3.1 and §3.4) — they don't conflict; pop-tier handles equipment/stealth, city-type handles investigation/recruit/threats.
- **EC-4 Multi-type investigation double-count.** Guard the secondary-cap rule: a tag matching **both** `CityType1` and a secondary must take **only the primary full CS** for that tag, not full+half. Dedupe by tag, keep max.
- **EC-5 Ocean/Lake city.** A "Seaport" on an Ocean sector: foot movement is Impassable on open water tiles but the **combat map** is a dockside template (mostly land). Terrain `Impassable` applies to *open-water tiles within the map*, not the whole encounter. Travel to the city itself uses sea routes (Travel_Time SEA).
- **EC-6 Language barrier with mixed squad.** Speaker check is **per squad**, satisfied if **any** member speaks the region `languageFamily`; otherwise −2CS social applies to the whole squad's social actions.
- **EC-7 CultureCode out of range / 0.** Clamp to `[1,14]`; if 0/blank, inherit from country's culture; if still unknown, `Neutral (0CS)` social, no affinity. Data gap.
- **EC-8 Crime band edge values.** `crimeIndex` exactly 20/40/60/80 → use the boundary rule in §3.2 (`[0,20)…[80,100]`); 100 is valid (top band).
- **EC-9 Terrain code 0 / >25.** Unknown → `plains` default; never crash the map.
- **EC-10 Stacking blowout.** Cap total context CS contribution to **±5CS** per resolved action before the universal table (sanity guard so a perfect-storm city can't trivialize the `Universal_Table_FIXED` — consistent with Bible §3 keeping Majors rare). RULING (R-E2); tunable in one constant.

---

## 8. RULING Notes (consolidated)

- **R-T1** — Travel multipliers for codes not named in §6.3 are derived **by movement class**, with named codes pinned to §6.3 values; nothing invented per-code (§3.3).
- **R-C1** — `CULTURE_ADJACENCY` map ships explicit; "Opposed" pairs are authored and **default empty** → unknown cross-culture = Neutral 0CS, never auto-Opposed (§3.5).
- **R-M1** — Terrain→combat-template selection keys off the **9 engine buckets**, not 25 codes, to bound the art set (§5.4).
- **R-E1** — Blank `Sector` → country primary sector → else `plains` default + data-gap log (§7).
- **R-E2** — Context CS contribution capped at **±5CS** per action pre-table (§7).
- **R-V (Village double-count)** — Canonical `CityTypeCode` enum has **10** members; "Village" is also a PopulationType and is applied separately (§2.1, EC-3).

---

## 9. OWNER-FORK Notes (product choices for the owner)

- **F-1 — Terrain granularity.** Source has **25 terrain codes**; the live `SectorTerrain` enum collapses to **9 buckets**.
  *Fork:* keep the 9-bucket collapse for art/template economy (recommended, R-M1), **or** expand to all 25 with distinct
  tactical feel (more art, richer maps). The data schema (`engineBucket` field) supports either without breaking saves.
- **F-2 — "Opposed culture" history.** Whether (and which) culture pairs are diplomatically **Opposed** (−1CS) is an
  authored worldbuilding choice (Cold-War/colonial flavor). Owner decides the list; default empty (R-C1).
- **F-3 — Combat map template art.** How many distinct Phaser templates per terrain bucket × `CityType1` dressing
  (GDD names city-street / national-park / desert / moon). Pure content scope; spec is template-agnostic.
- **F-4 — Mega-City parallel ops.** Source grants Mega Cities "multiple simultaneous operations." Owner sets the
  **cap** (2? 3? unbounded by squad count?) — source gives the unlock, not the number.
- **F-5 — Population recruit term.** Pop tier in source affects equipment/stealth/resource but **not** recruit CS,
  while `Country_Attribute_Effects` Population row says big country = +2CS recruitment. *Fork:* attribute recruit CS to
  **country.Population** (Country_Attribute_Effects) and keep **city.populationRating** for equipment/stealth/resource
  (recommended — avoids double-dipping), or merge them. Both are real source numbers; owner picks which owns recruit.

---

## 10. Open Questions

1. **Sector→terrain authority.** Is `sectors-populated.ts` (9 buckets, auto-generated) the runtime truth, or should a
   new `sectorTerrainCodes.ts` carry the full 25-code value per sector? (Blocks F-1; needed before combat templates.)
2. **Squad language model.** Where is a character's spoken `languageFamily` stored? (`Complete_Character_Sheet` has
   nationality/culture but the spoken-language field needs confirming for the EC-6 speaker check.)
3. **Religion-respect trigger.** What player action sets the `religionRespectFlag` (−1CS)? Likely an event/mission
   choice — needs the events engine to emit it.
4. **Cross-culture "Similar" list.** Confirm the adjacency seed (R-C1) with the worldbuilding owner before lock.
5. **Collateral CS consumption.** Temple −1 / Resort −2 "collateral" — does this feed **reputation/fame** (Public_Perception.csv)
   on civilian casualties, or a to-hit penalty near civilians? Spec assumes a **reputation-risk multiplier on collateral**, not a to-hit mod — confirm.
```