# 101 — Tutorial & First-Hour Guided Experience

> **System:** Tutorial & First-Hour Guided Experience (new-game flow · contextual coach-marks · scripted first mission · "graduation" into the open sandbox)
> **Status:** BUILD-READY SPEC
> **Spine consumed:** the player's chosen **faction** (starting LSWs/budget/reputation/territory), chosen **country** stats (sets first-mission legality + difficulty), chosen **city** type + Crime Index + Population Rating (sets the scripted mission template and combat map), and the resolution table the tutorial fight rolls on.
> **Bible anchors:** §1 pillar #5 ("UI *is* gameplay"), §1 pillar #6 ("Time travel as narrative save"), §7.1 (email-as-dialogue is the mission-delivery loop the tutorial must teach), §10 (`Player_Scaling`: Level-1 unlock requirement is literally *"Complete tutorial; Establish base"*), §13 rulings #1 (`Universal_Table_FIXED`), #8 (no XP leveling — train with erosion), #9 (combined-effects must be consumed). Notoriously-opaque JA2/CK depth (§0) is the problem this system exists to solve.
>
> **Source tables (read these to re-balance — never hardcode the numbers in code):**
> - `docs/csv-source-data/Player_Scaling.csv` — Level 1 "Street Operative": `Unlock_Requirements = "Complete tutorial; Establish base"`, `Threat_Level_Cap = Alpha–Threat Level 1`, `Team_Size_Limit = 1-2`, `Funding_Level = $5K-$15K`, `Progression_Time_Estimate = $0 initial; 7-14 real days`. **The tutorial's scope, enemy cap, and team size all come from this row — authoritative.**
> - `docs/csv-source-data/Scenario_Templates.csv` — **SCEN_019 "New Player Training"** (`Test_Purpose = Test new player experience`, `Environment = Training Facility`, `Team_1 = New player character (Alpha-Level 1)`, `Team_2 = AI opponent scaled to challenge`, `Victory_Condition = Learn combat system`, `Special_Rules = Training rules and guidance`, `Expected_Outcome = Should be educational and engaging`). **The scripted tutorial fight — authoritative.**
> - `docs/csv-source-data/Email_Investigation_Templates.csv` — **EMAIL_001 "URGENT: Gang Violence Escalating"** (`Priority = High`, `Investigation_Type = Gang War Escalation`, `Urgency_Hours = 24`, `Response_Options = Deploy Team Immediately;Send Investigators;Request More Information;Decline Mission`). The first scripted email-as-dialogue the tutorial delivers.
> - `docs/csv-source-data/Investigation_Templates.csv` — **INV_001 "Gang War Escalation"** (`City_Type = Industrial`, `Crime_Index_Range = 80-100`, `Base_Difficulty = 7`, `Duration_Days = 5`, `Threat_Level = 2-3`, `Potential_Rewards = LSW Recruitment; Gang Intelligence; Weapon Cache`). The mission the first email opens. **Tutorial uses a difficulty-clamped variant (see §3.4).**
> - `docs/csv-source-data/Game_Mechanics_Spec/Universal_Table_FIXED.csv` — the d100 outcome table every tutorial combat roll resolves against (Roll 99 = always Failed; Roll 00 = always Major; ruling #1).
> - `docs/csv-source-data/Game_Mechanics_Spec/Faction_Specification.csv` — `---FACTION STARTING RESOURCES---` (US: 5 LSWs / High budget / +50 rep; IN: 4 / Medium / +30; CN: 6 / High / +10; NG: 4 / Low / +20) and `Starting_Countries` per faction. **Sets what the player has when the tutorial begins.**
> - `docs/csv-source-data/Game_Mechanics_Spec/City_Type_Effects.csv` — city-type → investigation/combat/recruitment modifiers + the `---CITY TYPE + CRIME INDEX INTERACTIONS---` and `---CITY TYPE + POPULATION TYPE INTERACTIONS---` blocks the tutorial uses to pick a safe first city.
> - `docs/csv-source-data/Time_Management.csv` — `Base_Time_Flow = 1 Real Day : 30 Game Days`, `Event_Priority_*` rows (Critical = respond ≤2h; High = ≤24h). The tutorial teaches the clock + pause.
> - `docs/csv-source-data/Mobile_vs_Desktop_Experience.csv` — `Mobile_Strategic` / `Desktop_Tactical` split; session-length targets the first hour must respect.
> - `docs/csv-source-data/Public_Perception.csv` — `Street_Crime_Stopped = +2 Local Reputation; Small reward`. The reward the tutorial mission pays out (teaches the consequence loop).
> - `docs/csv-source-data/Daily_Activity_Framework.csv` — `ACT_002 Training`, `ACT_004 Patrol`, `ACT_020 Recruitment Activity` — the three idle activities the tutorial introduces ("what to do next").
> - `GAME_DESIGN_DOCUMENT.md` §"New Game" (lines 78-87) and §"Milestone 1" (lines 268-276) — **the canonical flow: `New Game → Faction Select → Country Select → City Select → Base Setup → Recruit Team → Equip → playing`**, and the state-phase chain `…city → base-setup → recruiting → equip → playing`. **The tutorial is the rails on top of this exact flow.**

---

## 1. Overview & Player Fantasy

SHT has the depth of Jagged Alliance 2 and Crusader Kings — and that depth is *notoriously opaque* (Bible §0). A new player who lands on the world map with 168 countries, 1,050 cities, a 35-column stat spine, email-as-dialogue, a real-time clock, FASERIP combat, and time-travel saving will **bounce**. The Tutorial & First-Hour Guided Experience is the on-ramp: it takes a player from "New Game" to **finishing one real mission and understanding the core loop** without ever leaving the actual game systems (no separate sandbox, no fake UI). It teaches by *doing the real thing on rails*.

It is **not** a wall of text. Per pillar #5 ("UI *is* gameplay"), the tutorial teaches through the same surfaces the player will use forever: a **scripted email** (the mission-delivery verb), a **world-map deploy** (the movement verb), a **scripted first fight** (the combat verb), and a **payout that visibly moves reputation** (the consequence verb). Completing it satisfies the literal `Player_Scaling` Level-1 unlock requirement: *"Complete tutorial; Establish base."*

**Player fantasy:** *"In my first hour I picked who I am, set up my base, recruited my first hero, got my first urgent email from a desperate minister, deployed, won a fight I actually understood, and watched my reputation tick up — and now the training wheels are off and the whole world is open."*

**The four verbs the first hour MUST teach (and nothing more):**
1. **EMAIL = missions arrive** (you reply to act; ignoring has consequences). — Bible §7.1
2. **WORLD MAP = you go to the threat** (deploy a squad; the clock moves; the laptop pauses). — Bible §6, §11
3. **COMBAT = one tactical fight** (move, attack, the d100/CS resolution, win condition). — Bible §3, §5
4. **CONSEQUENCE = the world reacts** (reputation/fame, a reward, "what to do next"). — Bible §9

**Non-goals (hard scope guards):**
- The tutorial does **NOT** teach flight/altitude, wrestling, damage-typing, BAMPI powers, throwing cars, investigations-as-a-method, the combined-effects spine math, or time-travel saving. Those are **deferred** to contextual "first-time-you-touch-it" tips (§3.7) the open game fires later — never crammed into the first hour.
- It does **NOT** add a separate tutorial mode or fake data. SCEN_019's "Training Facility" is the *map template* for the fight, not a sandbox — the player is in their real chosen city with their real recruit.
- It does **NOT** introduce a second squad, a second city, or any Threat-Level-2+ enemy (clamped by `Player_Scaling` Level 1).
- It is **skippable** for returning players (§3.6) and **never blocks** the player from quitting to the open game.

---

## 2. Data Schema (fields / types)

### 2.1 `TutorialStep` (static reference data — the scripted rail)

Loaded once at boot from a data table (`tutorial_steps.csv` / `.ts`). Ordered. Each step is one teaching beat anchored to a real UI surface. **Numbers/copy are data, never code** (Pillar #1).

```ts
type TutorialSurface =
  | 'NEW_GAME' | 'FACTION_SELECT' | 'COUNTRY_SELECT' | 'CITY_SELECT'
  | 'BASE_SETUP' | 'RECRUIT' | 'EQUIP'
  | 'WORLD_MAP' | 'LAPTOP_EMAIL' | 'LAPTOP_NEWS'
  | 'COMBAT' | 'RESULTS' | 'CHARACTER_MGMT';

type TutorialGate =
  // the player action that advances the step (the tutorial NEVER auto-advances combat)
  | 'CLICK_ELEMENT'        // clicked a specific UI element (anchorSelector)
  | 'SELECT_FACTION' | 'SELECT_COUNTRY' | 'SELECT_CITY'
  | 'PLACE_FACILITY'       // dropped the HQ facility in Base Setup
  | 'RECRUIT_CHARACTER'    // confirmed first roster member
  | 'EQUIP_ITEM'           // equipped at least one item (or pressed "Skip equip")
  | 'OPEN_EMAIL'           // opened the scripted EMAIL_001
  | 'SEND_EMAIL_REPLY'     // chose a reply option (any of the 4)
  | 'DEPLOY_SQUAD'         // deployed to the mission sector on the world map
  | 'ENTER_COMBAT'
  | 'COMBAT_MOVE' | 'COMBAT_ATTACK' | 'COMBAT_VICTORY'
  | 'ACK_RESULTS'          // dismissed the results/reputation screen
  | 'NONE';                // pure informational beat, advanced by "Got it"

interface TutorialStep {
  id: string;                 // 'T01'..'Tnn'
  order: number;
  surface: TutorialSurface;
  gate: TutorialGate;
  anchorSelector?: string;    // CSS/test-id of the element to spotlight (coach-mark target)
  title: string;              // short headline (≤ 40 chars)
  body: string;               // 1-2 sentences, plain language; supports {placeholders}
  pointerSide?: 'top'|'bottom'|'left'|'right';
  blocking: boolean;          // true = modal coach-mark dims rest of UI until gate met
  pauseClock: boolean;        // true = force world clock paused while this step is active
  skippableIndividually: boolean; // can THIS beat be dismissed without doing the gate
  fireOnce: boolean;          // contextual tips (§3.7) set false→true after first trigger
  teachesVerb?: 'EMAIL'|'MAP'|'COMBAT'|'CONSEQUENCE'|null;
}
```

### 2.2 `TutorialState` (per-save runtime, on the game store)

Persisted with the save (it is part of the diegetic time-traveler save, Bible §11 — but see §5 edge case: rewinding past the tutorial must NOT replay it).

```ts
interface TutorialState {
  active: boolean;             // false once graduated or skipped
  completed: boolean;          // true once T_FINAL fired (sets Player_Scaling Level-1 unlock)
  skipped: boolean;            // player chose "Skip tutorial" at New Game
  currentStepId: string | null;
  completedStepIds: string[];
  contextualTipsSeen: Record<string, boolean>; // fireOnce ledger for §3.7 tips
  // captured choices so later steps reference them in {placeholders}:
  chosenFactionId: string | null;   // 'US'|'IN'|'CN'|'NG'
  chosenCountryCode: number | null; // links to allCountries (Bible ruling #10)
  chosenCitySector: string | null;  // links to allCities
  firstRecruitId: string | null;
  scriptedMissionId: string | null; // the clamped INV_001 instance
  startedAtRealTs: number;          // for the "first hour" analytics hook (FIST GDD line 417)
}
```

### 2.3 `ScriptedMission` (the tutorial's clamped INV_001 instance)

The tutorial mission is a **parameterized instance** of the hybrid event/template engine (Pillar: events are authored templates parameterized by stats), built from `Investigation_Templates.INV_001` and delivered by `Email_Investigation_Templates.EMAIL_001`, then **difficulty-clamped** to Level-1 scope (§3.4):

```ts
interface ScriptedMission {
  templateId: 'INV_001';            // Gang War Escalation
  emailTemplateId: 'EMAIL_001';
  forcedThreatLevel: 'Alpha';       // CLAMP: INV_001 native is TL 2-3; tutorial forces Alpha (RULING §3.4)
  enemyCount: 2;                     // RULING §3.4 (within Player_Scaling 1-2 team scope)
  mapTemplate: 'Training Facility';  // from SCEN_019; else city-type map if returning-player skip
  rewardEvent: 'Street_Crime_Stopped'; // Public_Perception: +2 Local Reputation + small reward
  scriptedToWin: true;              // see §3.5 safety net
}
```

---

## 3. Exact Numbers, Tables & Formulas (each cited)

### 3.1 The first-hour spine (the ordered rail)

The tutorial is rails laid over the **canonical New Game flow** (`GAME_DESIGN_DOCUMENT.md` lines 78-80, state-phase chain line 269):

```
New Game → Faction Select → Country Select → City Select
        → Base Setup → Recruit Team → Equip → World Map → Email → Deploy → Combat → Results → Graduate
state:    faction → country → city → base-setup → recruiting → equip → playing
```

Target wall-clock for the whole sequence: **≤ 60 real minutes** (the section title's promise; consistent with `Mobile_vs_Desktop_Experience.csv` `Desktop_Tactical` 30-120 min sessions and `Player_Scaling` Level-1 estimate of 7-14 real days for the *whole* level — the first hour is just the on-ramp).

**Default step list (data — copy is illustrative, all overridable):**

| id | surface | gate | teachesVerb | blocking | pauseClock | body (summary) |
|----|---------|------|-------------|----------|------------|----------------|
| T01 | NEW_GAME | CLICK_ELEMENT | — | yes | yes | "Welcome. We'll get you through your first mission. (You can Skip.)" |
| T02 | FACTION_SELECT | SELECT_FACTION | — | yes | yes | "Pick your organization. This sets your starting heroes, money, and reputation." (reads `Faction_Specification` starting-resources) |
| T03 | COUNTRY_SELECT | SELECT_COUNTRY | — | yes | yes | "Choose your home country. Its laws and stats shape every mission here." (recommends a faction `Starting_Countries` entry) |
| T04 | CITY_SELECT | SELECT_CITY | — | yes | yes | "Pick your first city. We've highlighted a calm one to start." (see §3.2 safe-city pick) |
| T05 | BASE_SETUP | PLACE_FACILITY | — | yes | yes | "Drop your HQ. This 'Establishes your base' — half of becoming a Street Operative." (`Player_Scaling` unlock) |
| T06 | RECRUIT | RECRUIT_CHARACTER | — | yes | yes | "Recruit your first hero. You can field 1-2 at this level." (`Player_Scaling` Team_Size_Limit) |
| T07 | EQUIP | EQUIP_ITEM | — | no | yes | "Equip them — or skip and use what they came with." |
| T08 | WORLD_MAP | NONE | MAP | no | no | "This is the world. Time is running. The laptop pauses it." (`Time_Management` 1:30) |
| T09 | LAPTOP_EMAIL | OPEN_EMAIL | EMAIL | yes | yes | "You have an urgent email. In this game, missions arrive as mail." (EMAIL_001) |
| T10 | LAPTOP_EMAIL | SEND_EMAIL_REPLY | EMAIL | yes | yes | "Your reply IS your decision. Choose how to respond." (4 options) |
| T11 | WORLD_MAP | DEPLOY_SQUAD | MAP | yes | no | "Deploy your squad to the flagged sector. Watch the clock advance." |
| T12 | COMBAT | ENTER_COMBAT | COMBAT | no | n/a | "Time for the tactical layer. Enemies are Alpha-tier — beatable." (`Player_Scaling` cap) |
| T13 | COMBAT | COMBAT_MOVE | COMBAT | yes | n/a | "Click your hero, then a tile. Moving costs Action Points." (Bible §5.1: 6 AP) |
| T14 | COMBAT | COMBAT_ATTACK | COMBAT | yes | n/a | "Attack the nearest enemy. We roll d100 vs your skill column." (`Universal_Table_FIXED`) |
| T15 | COMBAT | COMBAT_VICTORY | COMBAT | no | n/a | "Defeat both enemies to win." (`Scenario_Templates` Victory_Defeat) |
| T16 | RESULTS | ACK_RESULTS | CONSEQUENCE | yes | yes | "You're famous-er. +2 local reputation and a small reward." (`Public_Perception` Street_Crime_Stopped) |
| T17 | WORLD_MAP | NONE | CONSEQUENCE | no | no | "Training complete. Next: Patrol, Train, or Recruit. The world is yours." (`Daily_Activity_Framework` ACT_004/002/020) |

`T17` sets `TutorialState.completed = true` → triggers `Player_Scaling` Level-1 unlock (`Complete tutorial; Establish base`).

### 3.2 Safe first-city selection (which city T04 highlights)

The tutorial does **not** force a city; it **highlights a recommended one** to avoid dropping a new player into an 80-100 Crime Index warzone. Recommendation rule, computed from the chosen faction's `Starting_Countries` cities (`City_Type_Effects.csv`):

```
candidate cities = all cities in chosen country (allCities)
score(city) =
    + 30  if CrimeIndex ≤ 40                  // City_Type_Effects: "Low (20-40) = No modifier"; "Very Low (0-20) +1CS all investigations"
    + 20  if PopulationRating ∈ {4,5}          // City_Type_Effects: Town/City = full equipment, no harsh stealth penalty
    + 15  if CityType1 ∈ {Industrial, Company, Political}  // has the INV_001 Gang-War template available (Industrial) OR safe legal cover
    - 40  if CrimeIndex ≥ 80                    // City_Type_Effects: "Very High (80-100) -3CS all legal methods; constant combat risk"
RECOMMENDED = argmax(score)   // ties broken by lowest CrimeIndex, then highest PopulationRating
```
> **RULING (§3.2):** The tutorial mission template is INV_001 (Industrial, Crime 80-100 native). To keep the *recommended starter city* calm while still serving the gang mission, the scripted INV_001 instance is **localized to a flagged sector adjacent to** the recommended city, NOT the city core — so the player lives somewhere safe and *travels to* the threat (Bible §6 "go to the threat"). If the country has no Industrial city, fall back to the highest-Crime city of any type and reskin the email sender per `Email_Investigation_Templates` city-type mapping. No invented numbers — all from `City_Type_Effects` interaction blocks.

### 3.3 Starting resources the tutorial assumes (per faction)

Pulled verbatim from `Faction_Specification.csv` `---FACTION STARTING RESOURCES---`:

| Faction | Starting_LSWs | Starting_Budget | Starting_Reputation | Starting_Countries (T03 default highlight) |
|---------|---------------|-----------------|---------------------|--------------------------------------------|
| US | 5 (mixed threat) | High | +50 (known heroes) | United States* / Canada / UK / Australia / Japan / S.Korea / Germany / France / Israel |
| IN | 4 (spiritual) | Medium | +30 (respected) | India / Bangladesh / Nepal / Sri Lanka / Bhutan / Mauritius / Fiji |
| CN | 6 (quantity) | High | +10 (feared) | China / N.Korea / Laos / Cambodia / Myanmar / Pakistan(partial) |
| NG | 4 (diverse) | Low | +20 (underdog) | Nigeria / Ghana / Kenya / S.Africa / Ethiopia / Senegal / Tanzania |

> **\* OWNER-FORK (§3.3a):** `GAME_DESIGN_DOCUMENT.md` line 67 reserves the **USA as a non-selectable global "target"** for the future multiplayer layer. In single-player the US faction's home is Washington DC (`Faction_Specification` Headquarters). The tutorial's T03 default highlight for the US faction must therefore be **Canada or UK**, not the USA, *if and only if* the owner confirms the USA-reserved rule applies to single-player too. Until confirmed, single-player highlights the USA. **This is a product decision the data cannot settle.**

Budget tiers (`High`/`Medium`/`Low`) are categorical in the source; the tutorial only needs the *category* to display "you can afford 1-2 recruits" — it does not invent a dollar figure. The dollar band is owned by `Player_Scaling` Level 1: **$5K-$15K funding** (the tutorial states this number, cited).

### 3.4 The scripted fight — clamping INV_001 to Level 1

INV_001 native parameters (`Investigation_Templates.csv`): `Base_Difficulty 7`, `Threat_Level 2-3`. That is **above** the Level-1 cap. The tutorial fight uses **SCEN_019 "New Player Training"** constraints layered on top:

| Parameter | Native (INV_001) | Tutorial clamp | Source of the clamp |
|-----------|------------------|----------------|---------------------|
| Threat Level | 2-3 | **Alpha** | `Player_Scaling` L1 `Threat_Level_Cap = Alpha-Threat Level 1`; `Scenario_Templates` SCEN_019 Team_2 = "AI opponent scaled to challenge" |
| Enemy count | 5-day investigation, open | **2** (RULING) | within `Player_Scaling` L1 `Team_Size_Limit = 1-2` symmetry |
| Map | Industrial city core | **"Training Facility"** template | `Scenario_Templates` SCEN_019 Environment |
| Victory | mission objective | **Defeat both enemies** | `Scenario_Templates` Victory_Defeat row ("Reduce opponent to 0 health or unconscious") |
| Reward | LSW Recruitment; Gang Intel; Weapon Cache | **Street_Crime_Stopped** (+2 local rep, small reward) | `Public_Perception.csv` row 2 (downscaled to match the clamped scope) |

> **RULING (§3.4):** The enemy count (2) and the Alpha clamp are the only invented-looking numbers; both are *derived* — 2 mirrors the `Player_Scaling` Level-1 team size of 1-2, and Alpha is the explicit Level-1 threat cap. We do not invent enemy stats: the two tutorial enemies are **`Enemy_Street_Criminal` (Threat Level Alpha, "Basic human criminal, conventional weapons")** straight from `Player_Scaling.csv` row 15. Their stat block comes from the character/combat spec, not this doc.

### 3.5 Combat resolution shown in the tutorial (and the safety net)

The tutorial fight resolves on the **one canonical table**, `Universal_Table_FIXED` (ruling #1). The teaching beat T14 surfaces the actual mechanic:

```
to-hit column = attacker MEL (melee) or AGL (ranged) rank   // Bible §3.3 step 1
final column  = rank ± Column Shifts (cover/range/stance/dodge)  // Bible §3.3 step 2; tutorial fight has 0 CS mods to keep it legible (RULING)
roll d100 → read band on Universal_Table_FIXED → Failed / Minor / Success / Major
```
Against an **Alpha Enemy_Street_Criminal** (Threat Alpha → low stats), a Level-1 player hero with a Typical-to-Good attack rank reads from the **Typical (6-10) / Good (11-20)** columns: ~60-65% Success, ~5% fail (`Universal_Table_FIXED` PROBABILITY SUMMARY rows 113-114). So the player *will usually hit* — the table itself makes the first fight winnable; we are not faking the dice.

> **RULING (§3.5) — anti-frustration safety net:** SCEN_019 expects the fight to be "educational and engaging," not a loss. If the player's hero is reduced to **≤ 20% HP** OR the player has missed **3 attacks in a row** (`Failed` band), the tutorial silently applies a **+1 CS** ("Lucky break") to the player's next to-hit AND drops the next enemy roll by one band. This is a *tutorial-only* dampener keyed off `TutorialState.active`; it is **off** the instant the player graduates. Numbers (20%, 3 misses, +1 CS) are the dampener's tuning — flagged as a RULING, overridable in `tutorial_steps` config. The fight is `scriptedToWin: true` in the sense that the *encounter cannot end in permadeath* (see §4 edge cases): a downed tutorial hero is **knocked out, not killed**.

### 3.6 Skip / returning-player path

At T01 a **"Skip Tutorial"** control is always present (pillar: never force the player). Behavior:
- Sets `TutorialState.skipped = true`, `active = false`.
- The New Game flow proceeds **unrailed** (every screen behaves normally, no coach-marks).
- **Establishing a base still satisfies** the `Player_Scaling` Level-1 `Establish base` half-requirement; the `Complete tutorial` half is auto-marked satisfied for skippers (RULING: skipping = "I already know this," so we don't gate Level-2 progression behind a tutorial the player opted out of).
- Contextual first-time tips (§3.7) **still fire** unless the player also disables them in settings (`OWNER-FORK §3.6a`: do tips respect the global Skip, or are they a separate toggle? Recommend separate toggle; owner confirms).

### 3.7 Deferred contextual tips (fire later, once each — NOT in the first hour)

These are `TutorialStep` rows with `fireOnce:true`, `blocking:false`, triggered the **first time** the player touches a system the tutorial deliberately skipped. They keep the first hour clean while still teaching depth. Each cites the system that owns it:

| Trigger (first time) | Tip teaches | Owned-by table / Bible |
|----------------------|-------------|------------------------|
| First flying unit selected in combat | "The number above a unit is its altitude (Z0-Z6)." | `Flight_Altitude_System`, Bible §5.4 |
| First grapple initiated | "Wrestling has positions and submissions." | `Wrestling_Martial_Arts_Complete`, Bible §5.9 |
| First time opening Investigations as a method | "Pick Covert/Official/Force/Diplomatic; country stats matter." | `Investigation_Methods`, Bible §7.4 |
| First time a combined-effect changes a price | "This price is set by this country's stats." | Bible §8 (combined-effects MUST be consumed, ruling #9) |
| First time the player tries to save | "Saving is time travel — it costs the Time Walker's sanity." | Bible §11, §13; **and is the on-ramp for the time-travel-save system (doc 029)** |
| First character death | "Death is usually permanent. There will be a funeral." | Bible §1 pillar #2, §5.6 |

> **RULING (§3.7):** The time-travel-save tip is the *only* place the first-hour experience even *mentions* saving — full mechanics live in the diegetic-save spec. The tutorial must **not** trigger a real time-travel rewind; it only labels the button.

---

## 4. How It Consumes the SPINE

The tutorial is unusual: it *reads* the spine to **parameterize itself**, but writes almost nothing back (it must leave the world in a clean, normal state at graduation). Exact consumption:

| Spine input | Read by | Formula / effect | Source |
|-------------|---------|------------------|--------|
| **Faction** (US/IN/CN/NG) | T02→T06 | Determines starting LSW count (5/4/6/4), budget tier, reputation (+50/+30/+10/+20), and the `Starting_Countries` highlighted in T03. | `Faction_Specification` starting-resources |
| **Country stats** (chosen in T03) | T11/T12 difficulty | Legality of the public op + combat consequence severity flow from country stats (Government type, Law Enforcement, Corruption). Tutorial does NOT compute the full ±CS — it just lets the existing spine apply, then **clamps the result to Alpha** (§3.4). | `Country_Attribute_Effects`, Bible §6.1 |
| **City Type** (chosen in T04) | T04 safe pick, T09 email reskin | `score(city)` in §3.2; the email sender/flavor (`Email_Investigation_Templates` is city-type keyed). Industrial → INV_001 gang war; if not Industrial, reskin. | `City_Type_Effects`, `Investigation_Templates`, `Email_Investigation_Templates` |
| **City Crime Index** | T04 | `+30 if ≤40`, `-40 if ≥80` in the recommendation score; "Very High (80-100) = constant combat risk" is what we steer the newbie *away* from. | `City_Type_Effects` CRIME INDEX block |
| **City Population Rating** | T04, T06 | `+20 if rating ∈{4,5}`; rating also gates equipment availability at T07 (Village = limited). | `City_Type_Effects` POPULATION block |
| **Personality** (of first recruit) | T13-T15 (display only) | If the recruited hero is AI-assisted at any beat, its `targetPreference` drives behavior — but the tutorial fight is **player-controlled**, so personality is only *surfaced* ("your hero is a Pragmatist"), not consumed for AI. Enemy personality (Enemy_Street_Criminal) drives the 2 enemies' target choice normally. | `PERSONALITY TARGET SELECTION`, Bible §5.10; cross-ref doc 03 |

**Spine writes (the only ones):** on T16, the mission pays out `Public_Perception.Street_Crime_Stopped` → `+2 local reputation` + small reward to the chosen country's public-opinion track. That is the *only* permanent world-state change the tutorial makes, and it is a real, desirable one (it bootstraps the consequence loop). The clock advances by the real deploy→combat travel time per `Time_Management` (no special tutorial time-freeze beyond the laptop pauses).

---

## 5. Edge Cases & Failure Modes

| # | Case | Handling |
|---|------|----------|
| E1 | **Player closes the laptop mid-email (T09/T10)** | Coach-mark persists; reopening the laptop re-anchors to the same step. The scripted email keeps `Priority=High`, `Urgency_Hours=24` (`EMAIL_001`) so even if dismissed it stays in the inbox and the world-map blip persists. |
| E2 | **Player picks "Decline Mission" at T10** | Valid choice (it's the real game). Tutorial branches: fire a one-time tip "Ignoring missions has consequences — but you can act later," then **re-offer** the same mission as a still-open inbox item and advance the rail to T11 only when they later choose a deploy-capable reply. Tutorial must NOT soft-lock on Decline. (RULING.) |
| E3 | **Player's only hero is downed in the tutorial fight** | Per §3.5 safety net, tutorial heroes are **KO'd, never killed** while `TutorialState.active`. On KO, the fight does not auto-fail; remaining enemies are also dampened, and a tip explains "Down but not out — finish them." If literally impossible to continue (1v1 and your hero is KO'd), auto-resolve a `Minor` recovery and let the player retry the swing. No permadeath in the tutorial. |
| E4 | **Player time-travels (saves/loads) before graduating** | The save tip (§3.7) labels the button but the tutorial **blocks an actual rewind** until `TutorialState.completed`. If a returning player loads an older save whose `TutorialState.completed=true`, the tutorial does NOT replay (`completedStepIds` is persisted in the save). |
| E5 | **Returning player skipped at T01 but later wants the tutorial** | A "Replay Tutorial" entry exists in Settings; it resets `TutorialState` and re-enters at T01 *without* re-doing New Game (uses the existing faction/country/city). It re-runs only the email→combat→results beats (T08-T17). |
| E6 | **Chosen country has no valid INV_001 city** (§3.2 fallback exhausted) | Fall back to **EMAIL_010 "Missing Person - LSW Suspected"** (`Priority=Low`, generic, any city) reskinned to High for the tutorial, with a generic `Training Facility` map. The mission template degrades gracefully; the four verbs are still taught. |
| E7 | **Player tabs to mobile mid-tutorial** | `Mobile_vs_Desktop_Experience`: combat (T12-T15) is `Desktop_Tactical` only. If the player is on mobile at T12, the tutorial shows "The tactical fight needs the desktop/large screen" and either (a) defers combat with the blip held open, or (b) on a touch build, loads the simplified tactical grid. (OWNER-FORK §5a: is combat playable on mobile at all? `Mobile_vs_Desktop` implies desktop-primary.) |
| E8 | **Player never opens the laptop (ignores T08)** | T08 is non-blocking, but if the player sits on the world map > N seconds without progress, escalate the email to a **pulsing world-map notification + phone ping** (cross-ref doc 01 Phone & comms). The `Time_Management.Event_Priority_High` rule ("respond within 24h") gives a diegetic deadline; on expiry the mission auto-declines and the tutorial branches as E2. |
| E9 | **Save corruption / missing `TutorialState`** | If `TutorialState` is absent on an existing save (migration), default `active=false, completed=true` (assume veteran) — never force a returning player back into T01. |
| E10 | **Player recruits 0 heroes / dismisses recruit** | T06 is blocking; cannot advance to deploy without ≥1 deployable unit (you can't fight with no one). If the player has a faction-starting LSW already (US has 5), allow using one of those instead of recruiting, and reword T06 to "field one of your starting heroes." |

---

## 6. UI/UX Hooks (how it surfaces)

Per pillar #5, the tutorial uses the **real surfaces**, spotlighted:

- **Coach-mark / spotlight overlay (all blocking steps):** dims the screen, cuts a hole around `anchorSelector`, shows `title`+`body` in a small card on `pointerSide`, with a "Got it" (NONE gates) or auto-advance on the real gate action. Style per global design standards: 10px radius card, subtle border, no purple, warm-dark accent. Never covers the element the player must click.
- **New Game / Faction / Country / City (T01-T04):** the tutorial highlights the recommended faction-country-city but lets the player choose freely. The recommendation badge ("Recommended start") sits on the safe-city card (§3.2).
- **Base Setup (T05):** spotlight the HQ facility in the placement tray; gate = `PLACE_FACILITY`. Completing it shows a "Base Established ✓" toast that explicitly echoes the `Player_Scaling` unlock language.
- **Laptop / Email (T09-T10):** the scripted `EMAIL_001` is pre-seeded in the inbox with the `High` priority flag visible. The body shows the 4 `Response_Options` as send-buttons (email-as-dialogue, Bible §7.1). Opening the laptop **pauses the clock** (Bible §7) — the tutorial calls this out once.
- **World map (T08, T11, T17):** the mission sector pulses with a blip; T08 points at the **clock/speed control** and the **pause-on-laptop** behavior; T11 points at the Deploy button. Cross-refs the world-map spec (doc 04) and phone/notifications spec (doc 01) for the blip + ping primitives — the tutorial does not invent them, it triggers them.
- **Combat overlay (T12-T15):** symbolic grid + glyphs (locked context: combat is symbolic, flight is an integer, NOT 3D). Coach-marks point at: the selected unit's **AP pips** (T13, "6 AP" per Bible §5.1), a movement-range tint, and the **to-hit readout** that shows the column + the d100 result band from `Universal_Table_FIXED` (T14). The tutorial fight uses **0 CS modifiers** for legibility (§3.5 RULING).
- **Results (T16):** the post-combat screen shows the reputation delta (+2 local) and reward as a clear before→after, teaching the consequence loop. Cites `Public_Perception`.
- **Graduation (T17):** a non-blocking card on the world map pointing at the daily-activity controls — `Patrol` (ACT_004), `Train` (ACT_002), `Recruit` (ACT_020) — as the "what now?" menu. Dismissing it ends the tutorial.
- **Phone:** the tutorial uses the phone as the **escalation channel** (E8) — a ping when the player is idle on the world map. It does NOT teach dial-a-number (deferred contextual tip).

---

## 7. Integration Points (reads / writes)

| System | Tutorial reads | Tutorial writes |
|--------|----------------|-----------------|
| **New Game flow / game store** | current phase (`faction→…→playing`), `GAME_DESIGN_DOCUMENT` lines 78-87 | advances phase only via the real gates; never skips a phase |
| **Faction system** | starting LSWs/budget/rep/territory (`Faction_Specification`) | nothing (read-only) |
| **Country/City data (allCountries/allCities)** | stats for §3.2 + §3.4 (ruling #10: unified datasets) | nothing |
| **Email-as-dialogue (doc 10)** | seeds `EMAIL_001`; reads `Response_Options` | marks the email read/answered |
| **Event/emergence engine (doc 02)** | requests a *clamped* INV_001 instance (it is a parameterized template) | registers the scripted mission instance, then lets it resolve normally |
| **World map & travel (doc 04, 05)** | sector blip + deploy + `Travel_Time_System` | issues the real deploy order; advances the clock normally |
| **Time/clock (doc 06)** | `Base_Time_Flow 1:30`, pause-on-laptop, `Event_Priority_High` deadline | forces pause on blocking steps; otherwise hands control back |
| **Combat (docs 20-28)** | spawns the SCEN_019 fight; reads `Universal_Table_FIXED` | applies the §3.5 safety dampener while `active`; converts lethal → KO |
| **Public perception / fame (doc 17)** | `Street_Crime_Stopped` payout | **+2 local reputation + small reward (the one write)** |
| **Player scaling (doc 18)** | Level-1 row | on T17/skip, sets the `Complete tutorial; Establish base` unlock flag |
| **Personality engine (doc 03)** | first recruit's type (display); enemy `targetPreference` | nothing |
| **Diegetic save (doc 29)** | blocks rewind until `completed`; labels the save button | persists `TutorialState` inside the save |
| **Analytics (FIST GDD line 417)** | `startedAtRealTs` | logs step timings + drop-off (telemetry hook for tuning the funnel) |

---

## 8. RULING: notes (where the data didn't fully settle)

- **§3.2** — Recommended starter city is a flagged sector *adjacent to* a calm city, not the gang-war core, so "live safe, travel to the threat" holds. Fallback to highest-crime city + email reskin if no Industrial city exists.
- **§3.4** — Tutorial enemy count = **2** (mirrors Level-1 team size 1-2); threat clamped to **Alpha** (Level-1 cap). Enemies are `Enemy_Street_Criminal` (Alpha) verbatim from `Player_Scaling`. No enemy stats invented here.
- **§3.5** — Anti-frustration dampener (trigger at ≤20% HP or 3 consecutive misses → +1 CS + enemy band drop), tutorial heroes KO instead of die. All numbers are config-overridable.
- **§3.5** — Tutorial fight forced to **0 CS modifiers** for teaching legibility.
- **§3.6** — Skipping the tutorial auto-satisfies the `Complete tutorial` unlock (opting out ≠ being blocked).
- **§3.7** — The time-travel-save tip only *labels* the button; it must not trigger a real rewind; full mechanics live in doc 029.
- **§4** — The tutorial's only permanent spine write is the `Street_Crime_Stopped` reputation payout.
- **E2/E8/E10** — Decline/ignore/zero-recruit paths must never soft-lock; defined branches above.
- **E9** — Missing `TutorialState` on migration defaults to "veteran" (never re-trap a returning player).

## 9. OWNER-FORK: notes (genuine product choices only the owner can make)

- **§3.3a — USA selectability in single-player.** `GAME_DESIGN_DOCUMENT` line 67 reserves the USA as a non-selectable global *target* for the future multiplayer layer. Does that reservation apply to single-player too? If yes, the US faction's T03 default-highlight country must be Canada/UK, not the USA. **Owner decides; default until then = USA selectable in SP.**
- **§3.6a — Contextual-tips toggle vs global Skip.** When a player hits "Skip Tutorial," should the deferred §3.7 first-time tips also be suppressed, or are they a separate "show gameplay tips" setting? (Recommendation: separate toggle, on by default.)
- **§5a — Is tactical combat playable on mobile at all?** `Mobile_vs_Desktop_Experience` marks combat `Desktop_Tactical`. If mobile combat is out of scope, the tutorial must gate T12-T15 to desktop (E7). If a touch tactical build is planned, the tutorial needs a mobile combat coach-mark set. **Owner sets the platform contract.**
- **Length/voice fork.** Should the first hour carry **authored VO/character voice** (the GDD ships a `Voice-enhanced-90p.wav`) for the intro beats, or stay text-only for v1? (Affects content budget; not a data question.)
- **Hand-holding intensity fork.** Two valid philosophies: (a) *strict rails* — every blocking step must be completed in order (safer for the JA2-opaque audience); (b) *soft guide* — only the four verb-teaching beats block, everything else is a dismissible hint (respects veterans). The step table above is authored for (a) with per-step `skippableIndividually`; the owner picks the default posture.

## 10. Open Questions

1. **Where does the recruited first hero come from?** The named World-Bible cast vs the procedural pool (doc 08 owns this). The tutorial assumes ≥1 recruitable unit exists in the chosen city; if the recruitment system can return an empty pool, T06 needs the "use a starting LSW" fallback (E10) wired — confirm the recruitment spec guarantees at least one offer in a starter city.
2. **Does "Establish base" require a specific facility, or any HQ placement?** §3.1 T05 assumes dropping the HQ facility satisfies it; the base-building spec (doc 19) owns the exact "established" predicate. Align the unlock check.
3. **Clock speed during the first deploy.** T11 says "watch the clock advance" — at `1 real day : 30 game days`, a same-country deploy is minutes of game time. Confirm the world-map deploy actually advances visibly at default speed, or have the tutorial bump speed for the demo beat.
4. **Telemetry schema.** FIST GDD line 417 wants hooks to learn how players play. Define the exact analytics events for step start/complete/skip/drop-off (owner + analytics owner).
5. **Localization of the scripted email/coach copy.** All `body`/`title` strings are `{placeholder}`-templated; confirm the i18n pipeline before authoring final copy.
