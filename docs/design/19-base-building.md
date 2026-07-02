# 19 — Base Building & Facilities

> **System tier:** 3 (Spine) · **Status:** DRAFTING
> **Owns:** the player's **physical bases** (real estate the org owns/rents), the **grid placement** of facilities, the **facility catalog** (player-ops facilities + the research/engineering lab line), **build/upgrade queues**, **power & upkeep** economy, the **research & engineering pipeline** (tech nodes → projects → crafted items/suits/cures), **facility staffing** (assigning characters to do work), **base defense → tactical map** when a base is raided, and the **base→spine bonuses** consumed by Hospital, Investigation, Training, Crafting, and Economy.
> **Sibling specs it leans on:** `06-character-mgmt-activities.md` (Engineering / Research / Train daily activities, character assignment), `07-character-model.md` (Career×Rank, Education tiers — the research gate), `09-investigations.md` (intel-center bonus, evidence analysis), `11-country-effects-spine.md` (Science/Education/GDP → research-speed & price formulas), `12-city-culture-terrain.md` (City type → workshop/research bonus, terrain → tactical raid map), `13-factions-relations-territory.md` (Home/Ally/Hostile territory ±, base legality), `16-economy.md` (the single money pool, upkeep as a daily/weekly expense, bankruptcy), `108-hospital-cloning-recovery-loop.md` (Medical Bay / Mutagenics → healing & cloning), `104-ai-director-difficulty.md` (base-raid escalation), `10-email-news.md` (base-discovered alert, research-complete email).
> **Hard rule honored throughout:** *Never invent a number.* Every value cites a source row/table or an existing canonical code file (treated as source — it was written from the same World Bible). Where source data is silent, the choice is tagged **RULING:** (consistent with the Mechanics Bible) or **OWNER-FORK:** (a product decision). Owner-forks already logged in `DECISIONS-NEEDED.md` are **referenced, not duplicated** (esp. **O6 base-type prices**).

---

## 1. Overview & player fantasy

You run a government-backed paramilitary org, and a base is your **home node on the world map** — the place your idle characters live, heal, train, build, and research, and the place enemies eventually come to **raid**. This is the JA2/X-COM "between-missions" loop given a superhero spine: you **buy a property** (warehouse, safehouse, mansion, underground bunker, corporate front, fortified compound), you **lay facilities into its grid** (training room, medical bay, engineering lab, intel center, power generator…), and each facility **feeds a bonus into the rest of the game** — faster healing, faster investigations, the ability to **build flight/fighting/stealth tech-suits**, repair your robot teammates, and research cures for a terminal disease before it kills a merc.

The deeper fantasy, straight from the FIST GDD (lines 274–287): *"Characters who are engineers can build tech suits… build robots… create tech implants… repair tech teammates"* and *"send characters to the lab or university to unlock tech suits… discover new ways to use their powers in combination… research a way to cure a terminal disease… analyze evidence in an investigation."* The base is where that happens. It is the **engine room of progression** — and because *"characters don't level up"* (Bible §4, ruling 8), the base + research tree is the **only** way the org gets stronger: better gear, better suits, better facilities, not bigger XP bars.

Three numbers the player watches on the base screen: **Slots used / total** (grid pressure), **Power used / capacity** (you must build generators), and **Daily upkeep** (the base bleeds money — `16-economy.md`).

**Where you stand still matters.** A base in a **high-Science, high-Education** country researches *faster* (Country spine); a base in an **Industrial city** gets a workshop discount; a base in **Home territory** is legal and harder to raid; a base in a **corrupt / high-crime** city is cheaper to hide but gets discovered sooner. The base **consumes the spine** like every other system.

---

## 2. The reconciliation (read before schema)

Two source layers describe "facilities," and the spec **unifies them**:

1. **Player-facing base layer — already implemented, adopted as canonical CODE.** `MVP/src/data/baseSystem.ts` defines 6 **base types**, 13 **facility types**, a 3×3 / 3×4 / 4×4 **grid**, **power/upkeep/security** math, **3 facility levels**, a **construction queue**, **bonus accessors** (education/healing/investigation/crafting/team/vehicle), and **base→tactical-map conversion**. This is the player's hands-on base builder and we keep it verbatim (§3).

2. **Research/engineering economy layer — `Research_Projects.csv` (PRIMARY SOURCE).** Defines 12 **research facilities** (`FAC_001`–`FAC_012`, with build cost / monthly cost / max team / enabled types / upgrade costs), 15 **research trees**, ~40 **tech-unlock nodes** and ~50 **research projects** (`PRJ_*`), a **resource economy** (Materials/Components/Samples tiers), **team composition** roles & **speed multipliers**, and a **complications d100 table**. The Gadget catalog those projects *output* lives in `Tech_Gadgets_Complete.csv`.

> ⚖️ **RULING — one facility model, two zoom levels (this is the central design ruling of this system).** The 13 code facilities are the **base-grid objects** the player physically places. The 12 CSV research labs are **specializations of two grid facilities** — `engineering_lab` (TECH research) and `medical_bay` (MED/Bio research), plus three *new* grid facilities this spec adds for the gated end-game trees (`robotics_lab`, `mutagenics_lab`, `alien_tech_lab`). Concretely: a placed `engineering_lab` **is** an instance of one or more `FAC_*` research facilities, chosen by which **research tree** you point it at; its **facility level (1/2/3)** maps to the CSV's **Basic/Advanced→Cutting-Edge/Experimental** facility tiers and the matching **speed multiplier** (§7.4). This means: *the player places a lab on the grid (code layer); the research screen then runs the CSV tech-tree economy through that lab.* No third system, no contradiction. Mapping table in §6.3.

---

## 3. Data schema — base & facility (adopted verbatim from code)

Source of truth: `MVP/src/data/baseSystem.ts`. The spec **adopts these types as-is** and adds the research/staffing fields in §4–§5. Field names below match the file exactly.

### 3.1 Base & facility core

```ts
type BaseType = 'warehouse'|'safehouse'|'mansion'|'underground'|'corporate'|'compound';

type FacilityType =
  | 'training_room' | 'library' | 'simulator'          // education-tied
  | 'medical_bay'  | 'pharmacy'                          // medical-tied
  | 'engineering_lab' | 'armory'                         // crafting/repair
  | 'intel_center' | 'communications' | 'garage'         // operations
  | 'living_quarters' | 'power_generator' | 'security_system'; // support
  // + NEW gated research facilities (§6.3): 'robotics_lab' | 'mutagenics_lab' | 'alien_tech_lab'

type FacilityLevel = 1 | 2 | 3;

interface Facility {
  id: string;
  type: FacilityType;
  level: FacilityLevel;
  condition: number;        // 0–100; <100 needs maintenance; 0 = non-operational
  gridX: number; gridY: number;
  isOperational: boolean;   // disabled by damage or power loss
  assignedStaff?: string[]; // character IDs (drives §5 staffing)
  researchTree?: TreeId;    // NEW — which CSV tree this lab is configured for (§6)
}

interface PlayerBase {
  id: string; name: string;
  location: string;         // Sector code (links to 04-world-map-sectors)
  country: string;          // ISO Country Code → spine (§8)
  type: BaseType;
  gridWidth: number; gridHeight: number;
  grid: (Facility | null)[][];
  security: number;         // 0–100 defense rating (auto-calc)
  discovered: boolean;      // has an enemy found this base? (drives raids §10)
  monthlyUpkeep: number;    // auto-calc
  powerCapacity: number; powerUsed: number;
}

interface BaseState {
  bases: PlayerBase[];
  activeBaseId: string | null;
  maxBases: number;                 // = 3 default [code DEFAULT_BASE_STATE]
  constructionQueue: ConstructionProject[];
}

interface ConstructionProject {
  id: string; baseId: string;
  facilityType: FacilityType; targetLevel: FacilityLevel;
  gridX: number; gridY: number;
  hoursRemaining: number; totalHours: number;
  cost: number; startDay: number;
}
```

### 3.2 Base types — exact numbers (cited: `baseSystem.ts → BASE_TYPES`)

| BaseType | Grid | Slots | baseSecurity | monthlyUpkeep | purchaseCost | basePower |
|---|---|---|---|---|---|---|
| `warehouse` | 3×3 | 9 | 20 | $2,000 | $50,000 | 50 |
| `safehouse` | 3×3 | 9 | 40 | $3,000 | $75,000 | 40 |
| `mansion` | 3×4 | 12 | 30 | $8,000 | $200,000 | 100 |
| `underground` | 3×4 | 12 | 60 | $5,000 | $150,000 | 80 |
| `corporate` | 3×4 | 12 | 35 | $10,000 | $250,000 | 120 |
| `compound` | 4×4 | 16 | 70 | $15,000 | $500,000 | 200 |

> **O6 (DECISIONS-NEEDED.md):** these prices are not in a source CSV — they are the values already coded. The only constraint logged is *"cheapest base affordable on the smallest budget (NG $7.5K)."* The cheapest base here is `$50K`, which a Street-tier org ($5K–$15K funding, `Player_Scaling.csv` L1) **cannot** buy outright. **RULING:** keep the coded prices, but the **first base is granted/financed at New-Game** (the L1 unlock requirement is literally *"Complete tutorial; Establish base,"* `Player_Scaling.csv` row 1) — i.e. base #1 is a story grant, bases #2–#3 are bought with the prices above. This satisfies O6 without inventing a price; flag for owner confirmation in §13.

### 3.3 Facility catalog — exact numbers (cited: `baseSystem.ts → FACILITIES`)

All arrays are `[L1, L2, L3]`. `buildCost`/`upkeepCost` in $; `buildHours` in game-hours; `powerRequired` in power units.

| FacilityType | buildCost | buildHours | upkeepCost | powerRequired | Requires | Bonus (per level) |
|---|---|---|---|---|---|---|
| `training_room` | 10k/25k/50k | 24/48/96 | 200/400/800 | 5/10/20 | — | education +20/40/60% (combat fields) |
| `library` | 8k/20k/40k | 16/32/64 | 150/300/600 | 3/6/12 | — | education +15/30/45%, investigation +10/20/30 |
| `simulator` | 30k/60k/120k | 48/96/192 | 500/1000/2000 | 20/40/80 | `power_generator` | education +25/50/75% (vehicle/weapons) |
| `medical_bay` | 15k/35k/75k | 32/64/128 | 300/600/1200 | 10/20/40 | — | healing +25/50/100% |
| `pharmacy` | 12k/28k/55k | 24/48/96 | 250/500/1000 | 8/16/32 | `medical_bay` | healing +10/20/30%, crafting +15/30/45 |
| `engineering_lab` | 20k/45k/90k | 36/72/144 | 400/800/1600 | 15/30/60 | — | crafting +20/40/60% |
| `armory` | 18k/40k/80k | 24/48/96 | 350/700/1400 | 5/10/20 | — | crafting +10/20/30, security +5/10/15 |
| `intel_center` | 25k/55k/110k | 40/80/160 | 450/900/1800 | 20/40/80 | `communications` | investigation +20/40/60, security +10/20/30 |
| `communications` | 15k/35k/70k | 24/48/96 | 300/600/1200 | 15/30/60 | — | investigation +10/20/30 |
| `garage` | 12k/28k/55k | 20/40/80 | 200/400/800 | 5/10/20 | — | vehicleSlots +2/4/6 |
| `living_quarters` | 8k/18k/35k | 16/32/64 | 150/300/600 | 5/10/20 | — | teamCapacity +2/4/6, healing +5/10/15 (rest) |
| `power_generator` | 20k/45k/90k | 32/64/128 | 400/800/1600 | 0/0/0 | — | **generates** power +50/100/200 (`POWER_GENERATOR_OUTPUT`) |
| `security_system` | 15k/35k/70k | 24/48/96 | 250/500/1000 | 10/20/40 | — | security +15/30/50 |

> ⚖️ **RULING — `simulator.color` must change.** `baseSystem.ts` ships `simulator.color: 'purple'`. **Purple is banned** by the project art rules. Re-tag to `'cyan'` (or any non-purple). This is the only contradiction with the global art ruling in this file; fix on first edit.

### 3.4 Derived math (cited: `baseSystem.ts` functions — adopt verbatim)

- `powerUsed = Σ powerRequired[level]` over operational non-generator facilities (`calculatePowerUsage`).
- `powerCapacity = basePower + Σ POWER_GENERATOR_OUTPUT[level]` over operational generators (`calculatePowerCapacity`).
- **Power rule:** a base is over-capacity if `powerUsed > powerCapacity`; **RULING (fills a code gap):** when over-capacity, facilities flip `isOperational=false` in **descending `powerRequired` order** until `powerUsed ≤ powerCapacity` (newest/highest-draw browns out first; `power_generator`, `living_quarters`, `security_system` are last to drop). Surfaces a red "BROWNOUT" badge (§9).
- `monthlyUpkeep = base.monthlyUpkeep + Σ facility.upkeepCost[level]` (`calculateMonthlyUpkeep`). **Economy hook:** `16-economy.md` consumes this; convert to **daily** via `÷30` for the daily burn ticker (matches Bible §11 1:30 ratio context, and economy's daily expense model).
- `security = min(100, baseSecurity + Σ securityBonus[level] over operational facilities)` (`calculateSecurity`).
- **Build cancel refund:** `floor(cost × (1 − progressPercent) × 0.75)` (`cancelConstruction`) — 75% of the *unspent* portion.

---

## 4. Data schema — research & engineering pipeline (from `Research_Projects.csv`)

This is the layer the research screen runs **through** a placed lab (§2 ruling). All numbers cite `Research_Projects.csv` unless noted.

### 4.1 New state

```ts
interface ResearchState {
  knownNodes: NodeId[];                 // unlocked tech-tree nodes
  activeProjects: ResearchJob[];        // in-progress projects/nodes
  completedProjects: ProjectId[];
  resources: Record<ResourceType, number>; // inventory (§4.5)
}

interface ResearchJob {
  jobId: string;
  kind: 'node' | 'project';             // tech-tree node OR a craftable project
  refId: NodeId | ProjectId;
  baseId: string; facilityId: string;   // which placed lab is running it
  team: string[];                       // assigned character IDs (§4.6)
  daysRemaining: number; baseDays: number;
  startDay: number;
  riskBand: 'safe' | 'dangerous';       // dangerous → needs Safety_Officer (§4.6)
}

type TreeId =
 | 'TREE_ARMOR'|'TREE_METAL'|'TREE_MAT'|'TREE_ELEC'|'TREE_CYBER'|'TREE_ROBOT'
 | 'TREE_AI'|'TREE_PROP'|'TREE_STEALTH'|'TREE_WEAP'|'TREE_MED'|'TREE_BIO'
 | 'TREE_MUTA'|'TREE_PSI'|'TREE_ALIEN';                 // 15 trees [csv RESEARCH TREES]
```

### 4.2 Tech-unlock node (cited: `Research_Projects.csv → TECH UNLOCK NODES`)

```ts
interface TechNode {
  id: NodeId;                  // e.g. NODE_002
  treeId: TreeId;
  baseDays: number;            // e.g. Armor_1 = 10
  tier: 'Basic'|'Intermediate'|'Advanced'|'Expert'|'Experimental';
  careerRequired: 'TECH'|'MED'|'PSY';
  careerRank: 1|2|3|4|5;       // lead researcher must meet this
  facilityRequired: string;    // CSV facility name, e.g. 'Armor_Workshop'
  prerequisiteNodes: NodeId[]; // e.g. [NODE_001]
  unlocksProjects: ProjectId[];
}
```
Representative real rows (verbatim): `NODE_001 Basic_Armor_Knowledge TREE_ARMOR 5d Basic TECH/1 Workshop · NODE_004 Armor_3 20d Expert TECH/4 Armor_Workshop ← NODE_003 · NODE_060 AI_1 21d Advanced TECH/4 Cyber_Lab ← NODE_041 · NODE_130 Mutagenics_1 45d Experimental MED/5 Mutagenics_Lab ← NODE_121 · NODE_151 Alien_Advanced 60d Experimental TECH/5 Alien_Tech_Lab ← NODE_150`.

### 4.3 Research project (cited: `Research_Projects.csv → RESEARCH PROJECTS`)

```ts
interface ResearchProject {
  id: ProjectId;               // e.g. PRJ_040
  treeId: TreeId; baseDays: number; tier: Tier;
  careerRequired: 'TECH'|'MED'|'PSY'; careerRank: 1|2|3|4|5;
  facilityRequired: string;
  prerequisiteNodes: (NodeId|ProjectId)[];
  resourceCost: ResourceCost[]; // e.g. [{type:'Materials:Exotic', qty:100}, {type:'Components:Exotic', qty:80}]
  outputType: 'Skill_Unlock'|'Node_Unlock'|'Component'|'Material'|'Equipment'
            | 'Weapon_Mod'|'Ammo_Type'|'Frame'|'Armor'|'Weapon'|'Implant'|'Treatment'|'Serum'|'Crafting_Unlock';
  outputId: string;            // e.g. ARM_POWER1 → bridges to Tech_Gadgets/Armor_Complete
  outputDescription: string;
}
```
Anchor examples (verbatim): `PRJ_005 Field_Medicine 3d Basic MED/1 Medical_Lab → SKILL_MED_1 (Supplies:Medical:10)` · `PRJ_018 Recon_Drone 10d Inter TECH/3 Robotics_Lab ← NODE_050 (Components:Advanced:20) → DRN_001` · `PRJ_040 Power_Armor_Mk1 30d Expert TECH/4 Robotics_Lab (Materials:Exotic:100; Components:Exotic:80) → ARM_POWER1 "25/15 DR +20 STR"` · `PRJ_080 LSW_Serum 120d Experimental MED/5 Mutagenics_Lab (Samples:LSW_DNA:10; Supplies:Medical:100) → SER_LSW "grants random power (dangerous)"` · `PRJ_101 Vibranium_Armor 120d Experimental TECH/5 Alien_Tech_Lab (Materials:Alien:50) → MAT_VIBRANIUM "2.0x DR multiplier"`.

### 4.4 Research-facility definitions (cited: `Research_Projects.csv → FACILITIES`)

These 12 are the **research configuration** of a placed grid lab (§2 ruling, mapping in §6.3). Numbers verbatim:

| FAC | Name | Build $ | Monthly $ | MaxTeam | Enables | Upg Adv / Cut / Exp |
|---|---|---|---|---|---|---|
| FAC_001 | Workshop | 50,000 | 2,000 | 2 | Basic_Armor;Weapon_Mods;Field_Gear;Tools | 25k/50k/100k |
| FAC_002 | Electronics_Lab | 100,000 | 5,000 | 3 | Electronics;Sensors;Comms | 50k/100k/200k |
| FAC_003 | Medical_Lab | 150,000 | 8,000 | 3 | Medical;Basic_Bio | 75k/150k/300k |
| FAC_004 | Cyber_Lab | 200,000 | 10,000 | 4 | Hacking;Software;AI_Basic | 100k/200k/400k |
| FAC_005 | Weapons_Lab | 250,000 | 12,000 | 4 | Weapons;Ammo;Explosives | 125k/250k/500k |
| FAC_006 | Armor_Workshop | 200,000 | 10,000 | 4 | All_Armor;Materials;Stealth | 100k/200k/400k |
| FAC_007 | Robotics_Lab | 500,000 | 25,000 | 5 | Robotics;Drones;Exo;Power_Armor | 250k/500k/1M |
| FAC_008 | Aerospace_Lab | 750,000 | 30,000 | 5 | Propulsion;Flight;Vehicles | 375k/750k/1.5M |
| FAC_009 | Genetics_Lab | 500,000 | 25,000 | 4 | Biological;Genetic | 250k/500k/1M |
| FAC_010 | Mutagenics_Lab | 1,000,000 | 50,000 | 4 | Mutagenics;LSW_Research | 500k/1M/2M |
| FAC_011 | Psi_Lab | 500,000 | 25,000 | 3 | Psi_Tech;Psychic | 250k/500k/1M |
| FAC_012 | Alien_Tech_Lab | 2,000,000 | 100,000 | 6 | Alien_Tech;Exotic | 1M/2M/4M |

### 4.5 Resource economy (cited: `Research_Projects.csv → RESOURCE TYPES`)

```ts
type ResourceType =
 | 'Materials:Basic'|'Materials:Advanced'|'Materials:Exotic'|'Materials:Alien'
 | 'Components:Basic'|'Components:Advanced'|'Components:Exotic'|'Components:Alien'
 | 'Samples:DNA'|'Samples:LSW_DNA'|'Samples:Neural'|'Samples:Alien'
 | 'Supplies:Medical';
```

| Resource | Acquisition | Base $/unit |
|---|---|---|
| Materials:Basic | Purchase | 10 |
| Materials:Advanced | Purchase | 50 |
| Materials:Exotic | Black_Market; Missions | 200 |
| Materials:Alien | **Missions_Only** | 1,000 |
| Components:Basic / Advanced / Exotic / Alien | Purchase / Purchase / BlackMkt;Missions / **Missions_Only** | 5 / 25 / 100 / 500 |
| Samples:DNA / LSW_DNA / Neural / Alien | Medical_Labs / Missions;Capture / Medical_Labs / **Missions_Only** | 20 / 500 / 100 / 1,000 |
| Supplies:Medical | Purchase | 10 |

> **Spine consumption hook:** *Purchase* prices are **multiplied by the country GDP price-band** from `11-country-effects-spine.md`; *Black_Market* acquisition uses the **Black-Market combined effect** (Corruption + Military − Law, Bible §8) for availability/price; *Missions_Only* resources are **gated to mission rewards** — they *cannot* be bought, which is what makes the experimental tier (Alien/Mutagenics) a campaign-long chase (see §8.4).

### 4.6 Team composition & risk (cited: `Research_Projects.csv → TEAM COMPOSITION`)

| Role | Education req | Career req | Speed bonus | Max/team |
|---|---|---|---|---|
| Lead_Researcher | Bachelors+ | Matching_Career | base (sets base speed) | 1 (required) |
| Assistant_Researcher | Bachelors+ | Any TECH/MED | +0.25× | 3 |
| Technician | Trade_School+ | Any | +0.10× | 2 |
| Specialist | Bachelors+ | Matching_Career | +0.15× | 2 |
| Safety_Officer | Any | Any | +0.00× | 1 (**required for dangerous research**) |

> **Dangerous research** = any project whose output is flagged risky in the CSV (`SER_LSW "dangerous"`, `SER_CONTROL "still risky"`) **plus** all `Experimental`-tier nodes/projects. **RULING:** if `riskBand==='dangerous'` and no `Safety_Officer` is assigned, the project **cannot start**, and its complication roll (§7.6) is shifted **−20** (worse) if the officer is later removed mid-job.

---

## 5. Staffing model (assigning characters to a facility)

Bible §7.6 lists **Engineering** and **Research** as daily activities a character performs; `06-character-mgmt-activities.md` owns the activity scheduler. This system owns **where** that work happens.

- A character on the **Research** activity must be `assignedStaff` of a placed lab whose `researchTree` matches an active `ResearchJob`. The character supplies a **team role** (§4.6) based on their Career/Education.
- A character on the **Engineering** activity assigned to an `engineering_lab` performs **repair** (robot/tech teammates, GDD lines 279/283) and **crafting** of unlocked outputs; throughput scales by the lab's `craftingBonus` (§3.3) and the character's matching `educationFields`.
- A character on **Train** assigned to a `training_room`/`simulator` raises stats/skills at `educationBonus` rate (`06-…`), and *robots can't train* (Bible §7.6).
- A character on **Hospital** at a `medical_bay` heals at `healingBonus` rate (`108-hospital-…`).

> **RULING — staffing cap = facility's research `MaxTeam`** for research jobs (§4.4), and **1 worker per non-research facility level** for ops/medical/training (so an L3 medical bay can host 3 patients/medics). Prevents stacking the whole roster on one bonus.

---

## 6. Build / upgrade / configure flow

### 6.1 Build a facility (cited: `startConstruction`/`progressConstruction`)
1. Player picks an empty grid cell (`isPositionAvailable`), a `FacilityType`, and target `level`.
2. Gates checked: **slot free**, **prereq facilities** present (`hasRequiredFacilities`), **money** ≥ `buildCost[level-1]` (debited via `16-economy`), and **power** would not brown out at completion (warn, don't block — §3.4).
3. A `ConstructionProject` enters `constructionQueue` with `hoursRemaining = buildHours[level-1]`.
4. The world clock (real-time-with-pause, Bible §11) ticks `progressConstruction(hours)`; at `≤0` the facility is placed via `addFacility` and an **email** fires (`10-email-news`).

### 6.2 Upgrade (cited: `upgradeFacility`, cap `level>=3`)
In-place L→L+1; **RULING:** upgrade cost = `buildCost[targetLevel-1] − buildCost[currentLevel-1]` (pay the delta), and upgrade hours = `buildHours[targetLevel-1] − buildHours[currentLevel-1]`. For **research labs**, upgrading the grid level also advances the CSV facility tier (Basic→Advanced→Cutting-Edge) and pays the CSV `Upgrade_Cost_*` (§4.4) — **OWNER-FORK O-19a:** whether grid-upgrade $ and CSV upgrade $ are the *same* spend or *stacked* (recommend: the larger of the two, not both — see §13).

### 6.3 Configure a lab to a tree — the mapping (resolves §2 ruling)

| Grid facility (code) | Grid level → CSV facility & tier | Research trees it can run |
|---|---|---|
| `engineering_lab` L1 | Workshop (FAC_001) Basic | TREE_ARMOR(basic), TREE_WEAP(mods), Field_Gear, Tools |
| `engineering_lab` L2 | Armor_Workshop (FAC_006) / Weapons_Lab (FAC_005) / Electronics_Lab (FAC_002) | TREE_ARMOR, TREE_METAL, TREE_MAT, TREE_STEALTH, TREE_WEAP, TREE_ELEC |
| `engineering_lab` L3 | Cyber_Lab (FAC_004) / Aerospace_Lab (FAC_008) | TREE_CYBER, TREE_AI(basic), TREE_PROP |
| `communications` L2+ | Cyber_Lab (FAC_004) | TREE_CYBER, TREE_AI |
| `medical_bay` L1–L2 | Medical_Lab (FAC_003) | TREE_MED, TREE_BIO(basic) |
| `medical_bay` L3 + `pharmacy` | Genetics_Lab (FAC_009) | TREE_BIO, TREE_MED(expert) |
| **NEW** `robotics_lab` | Robotics_Lab (FAC_007) | TREE_ROBOT, TREE_AI, Power_Armor, Drones |
| **NEW** `mutagenics_lab` | Mutagenics_Lab (FAC_010) | TREE_MUTA, LSW_Research |
| **NEW** `alien_tech_lab` | Alien_Tech_Lab (FAC_012) | TREE_ALIEN, Exotic |
| **NEW (psi)** repurpose | Psi_Lab (FAC_011) | TREE_PSI |

> **RULING — three new grid facilities** (`robotics_lab`, `mutagenics_lab`, `alien_tech_lab`, and optionally `psi_lab`) are added to `FacilityType` to host the gated end-game CSV labs (FAC_007/010/012/011). Their **grid stats** (buildCost/upkeep/power/buildHours) come **directly from the CSV** (§4.4 Build $ / Monthly $) — e.g. `robotics_lab.buildCost=[500000,…]`, `upkeepCost` from Monthly $; **buildHours and powerRequired are not in the CSV → set by RULING** as a continuation of the code ladder (largest existing lab `intel_center` = 40/80/160h, 20/40/80 power; these gated labs are bigger, so **robotics 60/120/240h @ 30/60/120 power; mutagenics 90/180/360h @ 40/80/160; alien 120/240/480h @ 60/120/240**). All four **require `power_generator`** (like `simulator`). Flagged as OWNER-FORK O-19b for tuning.

---

## 7. Exact numbers, tables & formulas

### 7.1 Slot & grid limits
- Slots per base = `BASE_TYPES[type].totalSlots` (9 / 12 / 16, §3.2). Max bases default **3** (`DEFAULT_BASE_STATE.maxBases`).
- **RULING — `maxBases` scales with player tier** (`Player_Scaling.csv` geographic scope): L1–2 = 1 base (Single city / Metropolitan), L3 = 2 (State/Province), L4 = 3 (National), L5 = 4 (Continental), L6 = unlimited→cap 6 (Unlimited scope). Replaces the flat code default; keep `maxBases` as the field the rule writes.

### 7.2 Power (cited §3.4) — worked example
`compound` basePower 200. Place: `intel_center` L2 (40) + `communications` L1 (15) + `engineering_lab` L2 (30) + `simulator` L1 (20) + `medical_bay` L1 (10) = 115 used ≤ 200 OK. Add `robotics_lab` L1 (30 per §6.3 ruling) → 145 ≤ 200 OK. Add a second draw to exceed 200 → brownout drops highest-draw first (§3.4).

### 7.3 Upkeep → economy (cited §3.4)
Daily burn = `monthlyUpkeep ÷ 30`. Example `underground` with medical_bay L2 + engineering_lab L1 + power_generator L1 = 5000 + 600 + 400 + 400 = **$6,400/mo ≈ $213/day**, posted as `category:'base_upkeep'` to `16-economy`.

### 7.4 Research time formula (cited: `Research_Projects.csv → SPEED MODIFIERS` + TEAM COMPOSITION)

```
team_multiplier = 1.0                          // lead sets base
                + Σ(Assistant)×0.25            // up to 3 → +0.75
                + Σ(Technician)×0.10           // up to 2 → +0.20
                + Σ(Specialist)×0.15           // up to 2 → +0.30
edu_multiplier  = { TradeSchool 0.5, Associates 0.75, Bachelors 1.0,
                    Masters 1.25, Doctorate 1.5, Post_Doc 2.0 }[lead.education]
fac_multiplier  = { Basic 1.0, Advanced 1.25, Cutting_Edge 1.5, Experimental 1.75 }[lab.tier]
ai_bonus        = AI_Assistant present ? +1CS to complication rolls (not a time mult) [csv]
spine_multiplier= 1 + (Science_band + Education_band) × 0.25   // §8.2, RULING-derived

actual_days = ceil( baseDays / (team_multiplier × edu_multiplier × fac_multiplier × spine_multiplier) )
```
Designer note from source: *"Optimal teams reduce time by 50–75%; solo research is slow"* and *"High-tier research takes real-world weeks"* — both hold here (max team×edu×fac ≈ `2.25×2.0×1.75 = 7.9×`, so a 120-day project → ~16 days with a perfect Post-Doc team in an Experimental lab).

### 7.5 Resource cost → money (cited §4.5)
`project_cash_cost = Σ over resourceCost ( qty × baseCostPerUnit × country_price_band )`, *only for Purchase/Black_Market resources*. Missions_Only resources are consumed from inventory and **block start if absent** (no cash substitute).

### 7.6 Complications (cited: `Research_Projects.csv → COMPLICATIONS TABLE`, d100)

| Roll | Complication | Effect |
|---|---|---|
| 01–20 | Minor_Delay | +25% time remaining |
| 21–40 | Resource_Waste | +25% materials needed |
| 41–55 | Equipment_Damage | facility 1–3 day repair (offline) |
| 56–70 | Partial_Success | output −1 tier quality |
| 71–80 | Breakthrough | completes 25% faster |
| 81–90 | Minor_Injury | researcher injured (1d6 days recovery → `108-hospital`) |
| 91–95 | Catastrophic_Failure | research restarts from 0% |
| 96–99 | Explosion_Accident | major facility damage + injuries |
| 00 | Unexpected_Discovery | bonus related research unlocked free |

> **When rolled:** once per project on completion (RULING), **−20 to the roll** for Experimental tier and for any dangerous project missing a Safety_Officer mid-run (§4.6); `AI_Assistant` (PRJ_043 output) applies **+1CS** (favorable shift) per CSV. *Explosion_Accident* feeds `damageFacility()` (§3.1) and the injury → Injury_System (Bible §5.6).

---

## 8. How it consumes the SPINE

The base **reads the country/city it sits in** (`PlayerBase.country`, `PlayerBase.location`) and the faction territory overlay, exactly per the Spine Principle (Bible §2). All inputs are real spine columns/tables.

### 8.1 Country attributes → research & build (cited: `Country_Attribute_Effects.csv`, World Bible Country columns)

| Spine input (column) | Effect on base | Source |
|---|---|---|
| **Science** (low/med/high) | high: *"+2CS tech investigations; advanced tech access; +2CS reverse engineering"* → unlocks higher research tiers & faster TECH trees | `Country_Attribute_Effects.csv` Science row |
| **HigherEducation** | high: *"+2CS tech research speed"* → research-speed band (§7.4 `spine_multiplier`) | same, HigherEducation row |
| **Healthcare** | high: *"faster healing; cloning possible"* → `medical_bay`/`mutagenics_lab` effectiveness, enables clone projects | same, Healthcare row + Bible §6.1 |
| **GDPPerCaptia** | sets the **price band** multiplying buildCost, upkeep, and Purchase resources | `11-country-effects-spine` (GDP→price), Bible §8 |
| **GovermentCorruption** | high: *"+3CS bribes; cheap black market"* → cheaper Black_Market resources, but +discovery risk | `Country_Attribute_Effects.csv` Corruption row |
| **Science + HigherEducation** combo | *"Innovation Hub: +3CS all technology research; unique tech available"* | same, ATTRIBUTE COMBINATION row |
| **Healthcare + Cloning** combo | *"Medical Center: fastest healing; best resurrection rates"* | same combination row + `108-hospital` |

> **RULING — `spine_multiplier` band mapping (§7.4):** map each attribute's 0–100 rating to a band {0–35 → −1, 36–65 → 0, 66–100 → +1} per the CSV's own Low/Medium/High split; `Science_band + Education_band ∈ {−2…+2}`; `spine_multiplier = 1 + that_sum × 0.25` (so an Innovation Hub research-speeds at 1.5×, a backwater at 0.5×). Derived from the CSV's own ±2CS Science/Education language — labeled RULING because the *exact* multiplier step (0.25) is a design choice consistent with the §7.4 ladder, not a copied number.

### 8.2 City type → workshop & lab (cited: `City_Type_Effects.csv`)
- **Industrial** city Special Ability: *"Workshop: Equipment repair/modification available"* → `engineering_lab` repair/craft **+1 effective level** here. **Military** city: *"Arsenal Access: military equipment at −20% cost"* → `armory` builds/resources −20%. **Educational** city: *"Research: +1CS to all technology investigations"* → flat research-speed bump (stacks into §7.4). **Mining** city: *"Underground: tunnel networks"* → cheaper `underground` base + a hidden second entrance on the raid map (§10).
- **Crime index** (`City_Type_Effects.csv` crime rows): High/Very-High crime → cheaper to hide the base but **discovery clock faster** (§10). **Population rating** → equipment/resource availability bands (Mega City +3CS resources … Village −2CS).

### 8.3 Faction territory → legality & raid pressure (cited: `Country_Attribute_Effects.csv → FACTION TERRITORY BONUSES`)
- **Home** territory: *"+3CS all methods; legal immunity"* → base is **legal**, `discovered` raids are defended *with* law enforcement on your side (raid difficulty −). **Hostile** territory: *"−2CS all methods; −2CS equipment access"* → base is **illegal/black-site**, raids escalate, resource Purchase blocked (black-market only). Drives the `security`/discovery interplay in §10.

### 8.4 Combined-effects consumption (Bible §8 + ruling 9 — *must be consumed, not just computed*)
- **Black market** (Corruption + Military − Law) → availability & price of `Materials:Exotic`, `Components:Exotic` (the only non-mission way to get exotic-tier; §4.5).
- **Research speed** (Science + Education + GDP + Cyber) → the §7.4 `spine_multiplier` (this is *the* place that combined effect is finally consumed — closes the open item).
- **Surveillance/detection** (Intel + Cyber + (100−MediaFreedom)) → **base discovery clock** (§10): high-surveillance hostile states find your black-site faster.
- **Medical/recovery** (Healthcare + GDP + Lifestyle) → `medical_bay` heal-rate multiplier and clone wait-time (hands off to `108-hospital`).
- **Mercenaries / Safe houses** effects → bias *which base type* is cheap/secure where (Safe-house effect lowers `safehouse`/`underground` discovery in corrupt low-law states).

---

## 9. UI/UX hooks

- **Laptop → "Base" app (pauses time, Bible §7):** primary screen = the **grid** (`BaseManager.tsx` exists). Drag a facility from a palette onto a free cell; cells show icon + level pips. Top bar: **Slots x/total**, **Power used/cap** (red BROWNOUT badge when over, §3.4), **Daily upkeep**, **Security %**. Per-facility hover card = stats from §3.3 + assigned staff. **No purple** (fix `simulator.color`, §3.3 ruling).
- **Research sub-tab:** the configured-lab view — pick a **tree** → a node/project graph (locked nodes greyed with their `careerRank`/`facility`/`prereq` gate shown), a **team slotter** (drag characters into Lead/Assistant/Technician/Specialist/Safety roles with live `actual_days` from §7.4), a **resource bill** (§7.5) with a red flag if a `Missions_Only` resource is missing, and a **start** button gated by §6.1/§4.6.
- **Phone (mobile, pausable):** compact base card — name, country flag, slots/power/upkeep, "X research jobs, next done in N days," and a **base-discovered push alert** when `discovered` flips true (`10-email-news`).
- **World-map hook (`04-world-map-sectors`):** base icon on its sector; click → travel-to/deploy-from; **raid incoming** marker when the AI Director (`104-…`) schedules an attack.
- **Combat overlay (base raid):** when a base is raided, `convertBaseToTacticalMap()` (§3.1) turns the grid into a symbolic tactical map — facilities = cover-50 tiles, edges = attacker spawns, `living_quarters` = defender spawn. Honors the **symbolic combat** rule (plain grid + glyphs, flight = altitude integer): facilities render as glyph tiles, not 3D. Terrain template still chosen by the city's terrain code (`12-…`).
- **Email/News (`10-…`):** research-complete email (with the crafted item attached to inventory), complication email (delay/injury/explosion), base-discovered priority email, "researcher hospitalized" obituary-adjacent note.

---

## 10. Edge cases & failure modes

1. **Power brownout** — `powerUsed > powerCapacity`: deterministic shutdown order (§3.4); build UI must warn at queue time but allow it (player may plan a generator next).
2. **Facility damaged to 0 condition** (`damageFacility`): `isOperational=false`, its bonus drops, and if it's the *required* facility for a `requiredFacilities` dependent (e.g. `medical_bay` for `pharmacy`), the dependent also browns out. Repaired via `repairFacility` (engineering staff or cash, `16-economy`).
3. **Research job orphaned** — its lab is destroyed/sold mid-job: job pauses (`daysRemaining` frozen); if lab not restored in **7 days (RULING)**, job cancels with a `Catastrophic_Failure`-equivalent (resources lost). Surfaced as a warning email.
4. **Lead researcher dies/leaves mid-job** (permadeath, Bible §4): job halts; if no valid replacement Lead (matching career/rank) is reassigned within **3 days (RULING)**, job downgrades one complication tier on resume.
5. **Missing Safety_Officer on dangerous job** (§4.6): cannot start; removing one mid-run shifts complications −20.
6. **Insufficient resources at start:** Purchase/BlackMkt shortfalls can be auto-bought if cash allows (§7.5); Missions_Only shortfall hard-blocks.
7. **Selling/abandoning a base:** **RULING** refund = `floor(purchaseCost × 0.5)` (real-estate haircut), facilities are **not** refunded, active construction refunds per `cancelConstruction` (§3.4). Active research orphaned per #3.
8. **Base in hostile territory & illegal** (§8.3): cannot use legal resource Purchase; higher discovery; raid defenders get no law-enforcement help.
9. **Max bases reached** (`addBaseToState` rejects beyond `maxBases`, §7.1): UI must hide/disable "buy base" and explain the tier gate.
10. **Cannot afford daily upkeep** → routes to `16-economy` debt/bankruptcy; **RULING:** a base that goes unpaid for **2 paydays** auto-flips lowest-value facilities to non-operational (mothballed) before bankruptcy triggers.
11. **Duplicate prereq logic:** `hasRequiredFacilities` checks *type presence only*; **RULING** it must also require the prereq be **operational** (an off `communications` shouldn't satisfy `intel_center`).

---

## 11. Integration points (reads / writes)

**Reads:** `enhancedGameStore` (game-day clock, player tier), World Bible Country/Cities (spine, §8), `Country_Attribute_Effects.csv` / `City_Type_Effects.csv`, faction territory (`13-…`), Economy cash (`16-…`), character roster + Career/Education (`07-…`), mission rewards inventory (Missions_Only resources, §4.5).

**Writes:** facility **bonuses** consumed by → Hospital/healing (`108-…` via `getHealingBonus`), Investigation (`09-…` via `getInvestigationBonus`), Training/Education (`06-…` via `getEducationBonus`), Crafting/repair (`getCraftingBonus`), team capacity (`getTeamCapacityBonus`), vehicle slots (`garage` → `05-travel`/squad). Writes **upkeep & build/research spend** to `16-economy`. Writes **crafted outputs** (`outputId`) into the equipment inventory bridging to `Tech_Gadgets_Complete.csv` / `Armor_Complete` / `Weapons_Complete`. Writes **base→tactical map** to the combat scene on raid. Emits **emails/news** (`10-…`) on build/research/discovery events.

**Bridges to honor (Bible rulings):** crafted-armor outputs feed the **one DR/armor pipeline** (Bible §5.5); flight-pack/jump-jet outputs set a unit's **max-Z** only (ruling 5); LSW_Serum grants **one extra power**, *not* an XP level (ruling 8); `AI_Assistant` gives **+1CS** on the Universal Table family (ruling 1), never a flat number.

---

## 12. RULING: notes (collected)

- **R1** One facility model, two zoom levels: 13 grid facilities are physical; 12 CSV labs are research-configurations of `engineering_lab`/`medical_bay` + 3 new gated grid labs. (§2, §6.3)
- **R2** `simulator.color` must not be purple → retag `'cyan'`. (§3.3)
- **R3** Brownout: shut down facilities in descending `powerRequired` order until within capacity. (§3.4)
- **R4** Upkeep is daily = monthly ÷ 30 for the burn ticker; posted to Economy. (§3.3/§7.3)
- **R5** First base is a New-Game story grant (satisfies O6 affordability); bases #2–3 use coded prices. (§3.2)
- **R6** `maxBases` scales by player tier 1→6 (1/1/2/3/4/6). (§7.1)
- **R7** Upgrade cost/hours = delta between levels; research labs also pay CSV tier-upgrade. (§6.2)
- **R8** New gated grid labs (`robotics_lab`/`mutagenics_lab`/`alien_tech_lab`[/`psi_lab`]) take build $/upkeep from CSV; buildHours/power continue the code ladder; require a generator. (§6.3)
- **R9** `spine_multiplier` band mapping (0.25 step) for research speed; consumes the Research-speed combined effect. (§7.4/§8.1/§8.4)
- **R10** Staffing caps: research = CSV MaxTeam; ops/medical/training = 1 worker per level. (§5)
- **R11** Complication rolled once on completion; −20 for Experimental / missing Safety Officer; +1CS with AI_Assistant. (§7.6)
- **R12** Orphaned-job (7-day) and lost-Lead (3-day) grace windows; sell-base 50% land refund; mothball before bankruptcy; prereqs must be *operational*. (§10)

## OWNER-FORK: notes

- **O6 (existing, DECISIONS-NEEDED.md):** confirm base-type prices / the "first base granted" approach (§3.2).
- **O-19a:** when upgrading a research lab, are grid-upgrade $ and CSV facility-upgrade $ **the same spend, stacked, or max-of-two**? (Recommend max-of-two.) (§6.2)
- **O-19b:** buildHours & powerRequired for the 3 new gated labs are a RULING extrapolation — owner should tune the actual numbers. (§6.3)
- **O-19c:** `maxBases` ceiling at tier 6 (recommend 6; could be unlimited per "Unlimited scope"). (§7.1)
- **O-19d:** alien-world / off-Earth bases (GDD lines 615–618: *"set up a base in an alien world"*) — deferred; does the same grid model apply, or a distinct alien-base type? (§13)
- **O-19e:** can a base be **rented** (lower upfront, higher upkeep) vs bought, à la JA2? Not in source; product call.

---

## 13. Open questions

1. **Off-Earth bases** (GDD 615): the GDD explicitly wants alien-world bases. Reuse this grid/facility model with an alien base type + alien terrain raid map, or a separate spec (`111-alien-invasion-endgame`)? (O-19d)
2. **Multiple bases & shared research:** can a research job draw a Lead from one base and Assistants from another, or is each job confined to one base's staff? (Recommend: confined — JA2 keeps teams local.)
3. **Robot/tech-teammate repair** (GDD 279) — is that an Engineering *activity* output (handled in `06-…`) or a craftable PRJ here? (Recommend: an Engineering activity that *uses* `engineering_lab.craftingBonus`, specced in `06-…`, not a PRJ.)
4. **Resource storage cap:** is inventory unlimited, or does a facility (`armory`/warehouse base) cap how many `Materials/Components` you can stockpile? (Source silent.)
5. **CSV facility tier vs grid level granularity:** the CSV has 4 facility tiers (Basic/Advanced/Cutting-Edge/Experimental) but the grid has 3 levels — confirm the L3→(Cutting-Edge *or* Experimental) split is acceptable, or whether Experimental needs a 4th level / a distinct lab. (§6.3)
6. **Security_System vs Surveillance combined effect:** both push the discovery clock — confirm `security` (defense) and *discovery* (detection) are the two distinct axes intended (defense reduces raid damage; surveillance sets raid *frequency*).

---

*Every number in this spec traces to `baseSystem.ts` (canonical code), `Research_Projects.csv`, `Tech_Gadgets_Complete.csv`, `Country_Attribute_Effects.csv`, `City_Type_Effects.csv`, `Player_Scaling.csv`, `Travel_Time_System.csv`, the FIST GDD, or a labeled RULING/OWNER-FORK. No values were invented.*
