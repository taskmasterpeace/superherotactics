# 18 — Progression & Scaling (6 tiers · threat caps · geographic scope · catch-up)

> **Build-ready system spec.** Every number traces to a named source table. Rulings (`RULING:`) and product choices (`OWNER-FORK:`) are labeled. A coding agent should implement this with zero follow-up.
>
> **Primary source table:** `docs/csv-source-data/Player_Scaling.csv` (the authoritative 6-tier table — rows 2–7 are the tiers; rows 8–14 mission types & XP; rows 15–20 enemy/threat bands; rows 21–35 faction-progression / resource / time-investment / catch-up / server-balance blocks).
>
> **Other source tables consumed:**
> - `docs/csv-source-data/Game_Mechanics_Spec/Country_Attribute_Effects.csv` (`Population`/`PopulationRating` → "+2CS recruitment / multiple operations"; "LSW Haven" combo; faction-territory ±CS) — gates *which countries a tier can reach* and how many simultaneous ops.
> - `docs/csv-source-data/Game_Mechanics_Spec/City_Type_Effects.csv` (Population_Type rows: "Mega City (Pop Rating 7) … multiple simultaneous operations possible") — sizes the active-op cap.
> - `docs/csv-source-data/Game_Mechanics_Spec/Faction_Specification.csv` (`Starting_LSWs`, `Starting_Budget`, `Starting_Tech_Level`, `Starting_Reputation`, win conditions) — seeds tier-1 state per faction.
> - `docs/csv-source-data/Game_Mechanics_Spec/Travel_Time_System.csv` (`Range_Limit` per travel mode; "82.4 days → 2472 days") — scope gates which travel modes/distances a tier may attempt.
> - `docs/csv-source-data/Public_Perception.csv` (`Reputation_Change` scale ladder: Local→Regional→National→International→Global→Reality-Scale) — the reputation events that **drive standing-based promotion** (see §4).
> - `SuperHero Tactics/FIST GDD v02.txt` (line 402 "Characters do not level up in this game"; line 580 "the scope of the World map largely depends on the **status of the team**. There are 5 different scopes"; line 627 flyers move faster "depending on the scope").
> - `SuperHero Tactics/SHT__ Origins, Threat Levels & Powers.txt` (the LeFevre Threat Scale Alpha → L1…L5; PCF/STAM/SPAM scoring lenses) — defines the threat-level cap unit.
> - **Existing code to reconcile (do NOT rewrite blindly):** `MVP/src/data/fameSystem.ts` (`FAME_THRESHOLDS`, fame 0–100, reputation −100..+100, `regionFame`/`regionReputation`), `MVP/src/data/reputationSystem.ts` (`TIER_THRESHOLDS` −100..+100, `getReputationTier`), `MVP/src/data/factionSystem.ts` (`STANDING_THRESHOLDS` per-faction-per-country), `MVP/src/data/doomClockSystem.ts` (the 2472-day clock), `MVP/src/stores/enhancedGameStore.ts` (`playerFame`, `fame`, `reputation`, `doomClock`, `gameTime.day`). The sibling spec `docs/design/104-ai-director-difficulty.md` already mirrors `Player_Scaling.csv` into a `TierRule` interface and reads `PlayerState.tier` — **this doc is the canonical producer of that `tier`/`scope`/`threatCap` state; 104 is a consumer.**
> - **Bible anchors:** `SHT_MECHANICS_BIBLE.md` §10 (this system), §13 ruling #8 ("No XP leveling; growth via training + 1 power via Time Chain"), §13 ruling #9 ("combined-effects must be consumed"), §13 ruling #10 ("unify on allCountries+allCities"), §11 (the time-travel rewind economy — a *demotion* is the worst rewind cost), §6 (world spine).

---

## 1. Overview & player fantasy

You start as **one masked operative working a single city's street crime out of a borrowed basement**, and — if your legend grows and the world lets you — you end as a **Cosmic Guardian fielding 8–15 heroes against reality-enders with a $2M+ budget and universal authority** (`Player_Scaling.csv` rows 2 & 7). Progression is the spine that makes the whole 168-country / 1,050-city world legible: it is the gate that decides **how far you may travel, how big a team you may run, how much money & tech you touch, which government doors open, and — critically — the *maximum threat level of enemy you are allowed to meet*** (the `Threat_Level_Cap` column).

The fantasy is **earned scope, not grinding XP**. You don't kill rats to hit level 5; you *prove* you can hold a city, then a region, then a nation, and the world (press, governments, the UN) *promotes you* by granting reach. The hook this enables: the doom clock is ticking toward the alien armada (`Travel_Time_System.csv`: 2,472 days), so progression is also a **race** — climb fast enough that by invasion day you have continental/cosmic reach, or face the endgame as a regional outfit that can't even legally cross a border.

### 1.1 The core reconciliation (read this first)

`Player_Scaling.csv` is authored as an **XP-range table** (`Experience_Range`, e.g. "0–500 XP", and `+XP per mission` rows). **This directly contradicts the GDD and Bible.**

- GDD line 402: *"Characters do not level up in this game."*
- GDD line 580: *"the scope of the World map largely depends on the **status of the team**."*
- Bible §13 ruling #8: *"No XP leveling; growth via training (with erosion) + 1 power via Time Chain."*

> **RULING (R-18.1) — Standing replaces XP; the tier *bands* are kept verbatim.** We keep every authored value in `Player_Scaling.csv` (tier names, geographic scope, team-size limit, funding band, tech access, political authority, **threat-level cap**, enemy types, mission XP weights). We **only** replace the *promotion currency*: instead of an accumulating character-XP pool (a leveling mechanic, banned), promotion is driven by a **Standing Score** computed from systems that already exist — fame, per-country reputation, mission completion counts, and faction win-condition progress. The CSV's `+XP per mission` numbers (street +50 … alien-contact +3000, rows 8–14) are **reused unchanged as `standingWeight` per mission type** — same numbers, renamed currency, no leveling of *characters*. The `Experience_Range` thresholds (500 / 1500 / 4000 / 10000 / 25000) become **Standing thresholds** (§4.1). This honors ruling #8 (it is *org reputation*, not character XP — characters still never level) while wasting none of the authored balance.

> **RULING (R-18.2) — 6 tiers, not 5.** The GDD says "5 different scopes" (line 580); `Player_Scaling.csv` defines **6** tiers (Street Operative … Cosmic Guardian). We ship **6** because (a) the CSV is the named source table and the Bible §10 explicitly says "6 tiers", and (b) the GDD's 5 scopes map cleanly onto tiers 2–6's geographic scopes (metro/state/national/continental/unlimited) with Tier 1 ("Single city") as the tutorial pre-scope. The `geographicScope` enum (§2.1) is the canonical mapping.

Three coupled facts define a tier at any moment:

| Fact | Range | What it gates | Source |
|---|---|---|---|
| **`tier`** (1–6) | Street Operative → Cosmic Guardian | the whole rule-row below | `Player_Scaling.csv` rows 2–7 |
| **`standing`** (Standing Score, integer ≥0) | 0 → 25000+ | promotion/demotion between tiers | R-18.1; thresholds = CSV `Experience_Range` |
| **`threatCap`** (Alpha → L5+) | per-tier ceiling on enemy threat level | what the AI Director may spawn at you | `Player_Scaling.csv` `Threat_Level_Cap`; §104 consumes it |

The phone/world-map is how this reaches the player (Bible: "a living world that talks to you"): a **promotion is an email + a news headline + a world-map reveal**, never a silent number tick.

---

## 2. Data schema

### 2.1 `TierRule` — one row per tier, loaded 1:1 from `Player_Scaling.csv` rows 2–7

This is the **single source of truth** for the tier. `104-ai-director-difficulty.md` already declares a partial mirror of this; **this is the authoritative full definition** and 104 must import it.

```ts
// Loaded from Player_Scaling.csv rows 2–7. NEVER hand-author these in code.
interface TierRule {
  tier: 1 | 2 | 3 | 4 | 5 | 6;
  levelName: TierName;                 // "Street Operative" … "Cosmic Guardian"
  standingRange: [number, number];     // from Experience_Range, e.g. [0,500] (R-18.1: standing, not XP)
  geographicScope: GeographicScope;    // parsed from Geographic_Scope column
  teamSizeLimit: [number, number];     // from Team_Size_Limit, e.g. [1,2] … [8,15]
  fundingBand: [number, number];       // from Funding_Level, USD, e.g. [5000,15000] … [2_000_000, Infinity]
  techAccess: TechAccessTier;          // from Technology_Access
  politicalAuthority: PoliticalAuthority; // from Political_Authority
  threatCap: ThreatLevel;              // from Threat_Level_Cap — THE combat gate (§5)
  enemyTypes: string[];                // from Enemy_Types (semicolon-split, verbatim, for flavor + Director pools)
  unlockRequirements: string[];        // from Unlock_Requirements (semicolon-split — the human-readable gate, §4.3)
  progressionTimeEstimateDays: [number, number]; // from Progression_Time_Estimate "real days" (telemetry only)
}

type TierName =
  | 'Street Operative' | 'City Defender' | 'Regional Agent'
  | 'National Operative' | 'International Coordinator' | 'Cosmic Guardian';

// R-18.2: the GDD's 5 scopes + Tier-1 tutorial scope. Drives travel/range gating (§6.2).
type GeographicScope =
  | 'city'        // Tier 1 "Single city"
  | 'metro'       // Tier 2 "Metropolitan area"
  | 'state'       // Tier 3 "State/Province level"
  | 'national'    // Tier 4 "National boundaries"
  | 'continental' // Tier 5 "Continental scope"
  | 'unlimited';  // Tier 6 "Unlimited scope"

type TechAccessTier =
  | 'basic' | 'standard' | 'advanced' | 'military' | 'cutting_edge' | 'cosmic';
  // Basic equipment only → … → Alien and cosmic technology (CSV Technology_Access verbatim mapping)

type PoliticalAuthority =
  | 'none' | 'local_le' | 'state_gov' | 'federal' | 'diplomatic_immunity' | 'universal';
  // No political authority → … → Universal authority (CSV Political_Authority verbatim mapping)

type ThreatLevel = 'Alpha' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L5+';
```

### 2.2 The 6 rows, transcribed from `Player_Scaling.csv` (verbatim, parsed)

> Every number/string below is copied from `Player_Scaling.csv`. Nothing invented.

| tier | levelName | standingRange (was Experience_Range) | geographicScope | teamSizeLimit | fundingBand (USD) | techAccess | politicalAuthority | **threatCap** | progressionTimeEstimateDays |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Street Operative | `[0, 500]` | city | `[1, 2]` | `[5_000, 15_000]` | basic | none | **Alpha** (CSV "Alpha-Threat Level 1") | `[7, 14]` |
| 2 | City Defender | `[501, 1500]` | metro | `[2, 4]` | `[15_000, 50_000]` | standard | local_le | **L2** (CSV "Threat Level 1-2") | `[14, 30]` |
| 3 | Regional Agent | `[1501, 4000]` | state | `[3, 6]` | `[50_000, 150_000]` | advanced | state_gov | **L3** (CSV "Threat Level 2-3") | `[30, 60]` |
| 4 | National Operative | `[4001, 10000]` | national | `[4, 8]` | `[150_000, 500_000]` | military | federal | **L4** (CSV "Threat Level 3-4") | `[60, 120]` |
| 5 | International Coordinator | `[10001, 25000]` | continental | `[6, 12]` | `[500_000, 2_000_000]` | cutting_edge | diplomatic_immunity | **L5** (CSV "Threat Level 4-5") | `[120, 180]` |
| 6 | Cosmic Guardian | `[25001, Infinity]` | unlimited | `[8, 15]` | `[2_000_000, Infinity]` | cosmic | universal | **L5+** (CSV "Threat Level 5+") | `[180, Infinity]` |

**`enemyTypes` per tier** (verbatim from CSV `Enemy_Types`, semicolon-split — used by §104 Director for pool selection and by News/Email for flavor):

- T1: `Street criminals; Gang members; Corrupt officials`
- T2: `Organized crime; Corporate villains; Rogue LSWs`
- T3: `Regional crime syndicates; State-level threats; Foreign agents`
- T4: `National threats; International terrorists; Enemy nation agents`
- T5: `Global conspiracies; Alien threats; Reality manipulators`
- T6: `Cosmic entities; Timeline destroyers; Reality enders`

**`unlockRequirements` per tier** (verbatim from CSV `Unlock_Requirements`, the human-readable gate — see §4.3 for how each is measured):

- T1: `Complete tutorial; Establish base`
- T2: `Complete 5 street-level investigations; Gain local reputation`
- T3: `Complete 10 city-level missions; Gain state recognition`
- T4: `Complete 15 regional missions; Gain federal clearance`
- T5: `Complete 20 national missions; Gain UN recognition`
- T6: `Complete 25 international missions; Save reality`

### 2.3 `MissionStandingWeight` — from `Player_Scaling.csv` rows 8–14 (the `+XP per mission` column, reused as standing per R-18.1)

```ts
// Loaded from Player_Scaling.csv rows 8–14. Key = mission tier band; value = standing granted on success.
const MISSION_STANDING_WEIGHT: Record<MissionBand, number> = {
  street:              50,   // Mission_Street_Crime           "+50 XP per mission"
  corporate:          150,   // Mission_Corporate_Investigation "+150 XP per mission"
  gang_war:           200,   // Mission_Gang_War                "+200 XP per mission"
  state_security:     400,   // Mission_State_Security          "+400 XP per mission"
  counter_terrorism:  750,   // Mission_Counter_Terrorism       "+750 XP per mission"
  international:     1500,    // Mission_International_Crisis     "+1500 XP per mission"
  alien_contact:    3000,    // Mission_Alien_Contact            "+3000 XP per mission"
};
type MissionBand =
  | 'street' | 'corporate' | 'gang_war' | 'state_security'
  | 'counter_terrorism' | 'international' | 'alien_contact';
```

> Mission *rows* in `Player_Scaling.csv` (8–14) also carry `Mission_Scope`, `Cooperation_Required`, `Time_Required`, `Risk_Level`, `Enemy_Type`, `News_Coverage`, `Reputation_Impact`. Those are **read by the Mission-Gen + News + Public-Perception systems** (siblings 02 / 10 / 17); this system consumes **only** the standing weight. Cross-reference, do not duplicate.

### 2.4 `ProgressionState` — the stored player object

```ts
interface ProgressionState {
  tier: 1|2|3|4|5|6;                  // current tier (R-18.1)
  standing: number;                    // Standing Score, integer ≥0 (the promotion currency)
  pendingPromotion: boolean;           // standing crossed next threshold AND requirements met, awaiting email-accept (§4.4)
  pendingDemotion: boolean;            // standing fell a full band below current tier floor (§4.5)
  missionsCompletedByBand: Record<MissionBand, number>; // counts for unlockRequirements (§4.3)
  unlockFlags: Record<string, boolean>; // 'tutorial_complete','base_established','un_recognition','reality_saved', …
  highestTierEverReached: 1|2|3|4|5|6; // for the soft-floor demotion guard (§4.5)
  standingHistory: { day: number; delta: number; reason: string }[]; // for the phone's "why did I rank up?" log
}
```

`ProgressionState` lives on the existing store (`enhancedGameStore.ts`) alongside `playerFame`/`doomClock`. The sibling `104-ai-director-difficulty.md`'s `PlayerState.tier` reads `ProgressionState.tier`.

---

## 3. Exact numbers, tables & formulas (each cited)

### 3.1 The Standing thresholds (promotion gates)

Directly from `Player_Scaling.csv` `Experience_Range` (re-typed as standing per R-18.1). Promotion from tier *N* to *N+1* requires `standing ≥ standingRange[N+1].min`:

| To reach tier | standing ≥ | Source |
|---|---|---|
| 2 (City Defender) | **501** | CSV "501-1500 XP" |
| 3 (Regional Agent) | **1501** | CSV "1501-4000 XP" |
| 4 (National Operative) | **4001** | CSV "4001-10000 XP" |
| 5 (International Coordinator) | **10001** | CSV "10001-25000 XP" |
| 6 (Cosmic Guardian) | **25001** | CSV "25001+ XP" |

### 3.2 How standing is *earned* (the only sources — all already in code)

> **RULING (R-18.3) — standing comes ONLY from existing tracked events; nothing new is invented.** Standing is granted by three already-built systems, so this system is pure consumption (Bible ruling #9):

```
standing += MISSION_STANDING_WEIGHT[band]            // on mission success (§2.3) — the dominant source
standing += repEventStandingBonus(perceptionEvent)   // on positive Public_Perception.csv events (§3.3)
standing += 0                                         // training/combat give NO standing (R-18.1: not leveling)
```

**`repEventStandingBonus`** maps the *positive* `Public_Perception.csv` rows (the ones with positive `Reputation_Change`) to a standing bonus equal to the **absolute reputation delta × 10** (so a "Saved_Lives_Civilian +5..+20" event grants +50..+200 standing — same order of magnitude as a mission, anchoring it to the CSV's own scale). Negative perception events grant **0** standing (they hurt *reputation*, handled by sibling 17, and can trigger *demotion* via §4.5, but never subtract standing directly).

| Public_Perception.csv positive event | `Reputation_Change` | standing bonus (×10) |
|---|---|---|
| Street_Crime_Stopped | +2 | +20 |
| Saved_Lives_Civilian | +5 to +20 | +50 to +200 |
| Prevented_Disaster | +10 to +30 | +100 to +300 |
| Alien_Technology_Recovery | +25 | +250 |
| Time_Travel_Success | +40 | +400 |
| Heroic_Recognition | (global recognition) | **+300** (RULING: anchored to the "+30" Prevented_Disaster ceiling ×10) |

> **RULING (R-18.4) — `Heroic_Recognition` has no numeric `Reputation_Change` in the CSV** ("Global recognition for saving lives", text only). Assign **+300 standing** = the Prevented_Disaster max (+30 ×10), the nearest authored anchor. Labeled ruling; overridable from config.

### 3.3 Funding, team-size, and active-op caps as live clamps

These are not flavor — they are **hard clamps** enforced whenever the relevant system acts:

- **Team size** — recruiting/squad-assembly UI must reject adding a hero beyond `teamSizeLimit[tier][1]` (e.g. Tier 1 hard-caps at **2**). The lower bound `teamSizeLimit[tier][0]` is the *recommended minimum* surfaced as a tooltip, not enforced.
- **Funding** — `fundingBand[tier]` is the **expected operating budget**, consumed by the Economy sibling (16) for the weekly payday ceiling and by pricing (a Tier-1 org literally cannot afford Tier-5 gear). It is a *soft* band: going over via crime/loot is allowed but flagged.
- **Active simultaneous operations** — `Player_Scaling.csv` does not give an explicit op-count, but `City_Type_Effects.csv` ("Mega City (Pop Rating 7) … multiple simultaneous operations possible") and `Country_Attribute_Effects.csv` ("Large country … multiple operations") tie op-count to **population**, not tier. 

> **RULING (R-18.5) — active-op cap = `tier` (count), capped further by location population.** Max concurrent active missions/squads = **`min(tier, popRating − 1)`** where `popRating` is the current city's `PopulationRating` (1–7). Rationale: a Tier-1 org runs 1 op; a Tier-6 org runs up to 6 — but only a Mega-City (popRating 7 → cap 6) can sustain that many at once, exactly matching `City_Type_Effects.csv`'s "multiple simultaneous operations possible" gate. Both inputs are real source values; the `min()` combine is the labeled ruling. Overridable from config.

### 3.4 Faction tier-1 seed (from `Faction_Specification.csv`)

A new game does **not** start blank — the chosen faction's row sets the Tier-1 starting state. These are *initial values layered onto* the Tier-1 rule:

| Faction | Starting_LSWs | Starting_Budget (interpreted vs T1 band) | Starting_Tech | Starting_Reputation → initial `standing` seed |
|---|---|---|---|---|
| US | 5 (mixed) | High → top of T1 band ($15K) | Advanced | +50 (known heroes) → **+50 standing** |
| IN | 4 (spiritual) | Medium → mid band ($10K) | Standard | +30 (respected) → **+30 standing** |
| CN | 6 (quantity) | High → top of band ($15K) | Advanced | +10 (feared) → **+10 standing** |
| NG | 4 (diverse) | Low → bottom band ($5K) | Basic | +20 (underdog) → **+20 standing** |

> **RULING (R-18.6) — `Starting_Reputation` seeds `standing`, but `Starting_LSWs` can exceed the Tier-1 team cap.** CN starts with 6 LSWs but Tier-1 caps the *deployable squad* at 2. Resolution: the extra LSWs sit on the **roster/reserve** (`08-recruitment-roster.md`), not in the field. The team-size clamp (§3.3) is a *squad* clamp, not a *roster* clamp. This matches the GDD (large rosters, small fielded squads).

---

## 4. Promotion, demotion & the catch-up system

### 4.1 Promotion trigger (two-gate)

Promotion is **AND of two conditions** — the numeric Standing gate (§3.1) **and** the human-readable `unlockRequirements` gate (§4.3). You cannot rank up on raw standing alone; you must have *done the work the tier describes*.

```
canPromote(N→N+1) =
     standing >= standingRange[N+1].min                 // §3.1
  && allUnlockRequirementsMet(tierRule[N+1])             // §4.3
```

### 4.2 Promotion is diegetic, never silent

> **RULING (R-18.7) — promotion is an inbox event the player accepts, not an automatic tick** (Bible: "UI is gameplay"; email is the dialogue system, sibling 10). When `canPromote` first turns true, set `pendingPromotion = true` and fire:
> 1. an **email** from the faction lead / a government / the UN (the `politicalAuthority` granting body of the new tier) offering the expanded mandate, with accept/decline reply options;
> 2. on **accept**, `tier += 1`, the world map reveals the newly-legal scope (§6.1), a **News** headline prints ("FIST cleared for national operations"), and the `threatCap` rises (§5);
> 3. on **decline/ignore**, the player stays at tier N (you may *choose* to stay small — some players want a tight street-level run); `pendingPromotion` remains true and the email re-offers next week.

This makes the granting body (and its country's stats) matter: a tier-4→5 promotion is *UN recognition*, gated by your global reputation, not a number you farmed.

### 4.3 Measuring `unlockRequirements` (each requirement → a concrete check)

The CSV strings are human-readable; here is the exact measurement for each:

| Requirement string | Measured as |
|---|---|
| `Complete tutorial` | `unlockFlags.tutorial_complete` (set by sibling 101) |
| `Establish base` | `unlockFlags.base_established` (a base exists in `baseSystem`) |
| `Complete N <band>-level investigations/missions` | `missionsCompletedByBand[band] >= N` (counts from §2.4) |
| `Gain local reputation` | global `reputation >= 25` (= `fameSystem` "liked"/`reputationSystem` "liked" tier) |
| `Gain state recognition` | any country `regionReputation >= 50` (= "respected", `STANDING_THRESHOLDS`) |
| `Gain federal clearance` | home-faction country standing `>= 50` (faction "Respected", `factionSystem`) |
| `Gain UN recognition` | `≥3` distinct countries at `regionReputation >= 50` **OR** faction win-condition progress flag (per `Faction_Specification.csv` win conditions) |
| `Save reality` | `unlockFlags.reality_saved` (endgame flag from sibling 111 alien-invasion) — Tier 6 is effectively the endgame ceiling |

> **RULING (R-18.8) — the `Complete N <band> missions` band maps to the mission tier directly below the target tier.** "Complete 5 street-level investigations" → 5 `street`-band; "Complete 10 city-level missions" → 10 `corporate`+`gang_war`-band (the City-level missions in CSV rows 9–10); "Complete 15 regional" → 15 `state_security`; "Complete 20 national" → 20 `counter_terrorism`; "Complete 25 international" → 25 `international`. All counts are verbatim from the CSV `Unlock_Requirements`; the band mapping is the labeled ruling (anchored to `Player_Scaling.csv` `Mission_Scope` column, rows 8–14).

### 4.4 The catch-up system (`Player_Scaling.csv` rows 32–34)

The CSV defines three catch-up mechanisms and a server-balance rule. They are authored for the **multiplayer dimension** (Bible §11 / sibling 107), but two have **single-player meaning now**:

| Mechanism (CSV row) | Single-player interpretation (ships now) | Multiplayer-only (stub, sibling 107) |
|---|---|---|
| **Mentoring** (row 32): "New players gain experience **50% faster** with mentor" | When a **veteran LSW** (a roster hero whose own threat level ≥ your current `threatCap`) is assigned to a squad, that squad's **mission standing weight is ×1.5**. The "+50%" is the CSV number, reused. | Cross-player mentoring grant. |
| **Resource Sharing** (row 33): veterans provide equipment/funding | A **fallen-behind faction** (see §4.5 demotion) gets a one-time **funding top-up to its tier's `fundingBand[0]`** if it drops below it. | Inter-faction resource transfer. |
| **Information Sharing** (row 34): intel sharing prevents duplicate effort | Completed investigations grant **+10% standing** if they re-use intel already in your `World_State_Tracking` (no double-work penalty). | Cross-player intel pool. |
| **Server_Balance_Geographic** (row 35): "new players seeded to different regions" | **Single-player N/A** — pure MP. The `geographicScope` start-region (`Faction_Specification.csv` `Starting_Countries`) is the SP analog. | The MP seeding rule. |

> **RULING (R-18.9) — the mentoring +50% and intel +10% ship in single-player as standing multipliers; the rest are MP stubs.** The CSV's catch-up numbers (50%, and the named mechanisms) are honored; their MP framing is deferred (Bible §11: design SP so MP slots in later). `standingWeight_final = base × (mentored ? 1.5 : 1.0) × (intelReuse ? 1.1 : 1.0)`.

### 4.5 Demotion (the missing failure mode the CSV omits)

`Player_Scaling.csv` has no demotion rule, but the campaign needs one: a reputation catastrophe (Bible §9 "−100 Global Reputation: Mass_Destruction") must be able to *cost you scope*, and the time-travel save (Bible §11) needs a worst-case cost.

> **RULING (R-18.10) — demotion on sustained standing collapse, with a soft floor.** If `standing` falls **a full band below the current tier's floor** (i.e. `standing < standingRange[tier].min − bandWidth`, where `bandWidth = standingRange[tier].max − standingRange[tier].min`), set `pendingDemotion = true` and, after a **30-game-day grace window** (anchored to the CSV `Progression_Time_Estimate` lower bound for the tier — you get one tier-length window to recover), drop one tier. **Soft floor:** you can never be demoted below `max(1, highestTierEverReached − 1)` — losing more than one tier of hard-won scope in a single collapse would be unrecoverable and un-fun. How standing *falls*: negative `Public_Perception.csv` events don't subtract standing directly (R-18.3), but **`Mass_Destruction` (−100) and `War_Crimes_Accusation` set a `standingPenalty` flag** that subtracts `|reputationDelta| × 10` from standing as a one-time hit (mirroring §3.2's earn rule in reverse). All numbers (×10, 30-day window, one-tier floor) are anchored or labeled rulings; overridable.

> **OWNER-FORK (OF-18.A) — should demotion exist at all, or only the soft "frozen promotion" version?** Two product directions: **(A)** real demotion as specced above (scope can be *lost* — high tension, matches Bible §11's "rewinds have teeth"); **(B)** standing can stall and freeze promotions but tier never drops (gentler, more JA2-merc-attrition than CK-dynasty-collapse). This doc ships (A) behind a config flag `allowDemotion: true`; flipping it to `false` yields (B). **Owner decides default.**

---

## 5. Threat-cap consumption (the combat gate)

The `threatCap` column is the single most load-bearing tier value: it is the **maximum LeFevre threat level of any enemy the player may face** (`Player_Scaling.csv` `Threat_Level_Cap`; threat scale from `SHT__ Origins, Threat Levels & Powers.txt`).

> **RULING (R-18.11) — `threatCap` is a hard ceiling on the AI Director, never on the world sim.** The sibling `104-ai-director-difficulty.md` already states it "never violates the tier threat-cap (§10)". Canonical contract:
> - The **AI Director** (sibling 104) MUST NOT spawn an encounter whose highest enemy threat level exceeds `tierRule[tier].threatCap`. (A Tier-1 player meets Alpha-only; an L4 reality-manipulator cannot be *scheduled* at them.)
> - The **world simulation** (sibling 02 / `World_State_Tracking`) MAY still *contain* higher-threat entities; the player simply isn't *routed into* fights with them until their tier permits. They appear as **"Point of Interest" news** (Bible §7.2) the player can't yet act on — telegraphing the climb.
> - **Player-initiated** over-cap fights are allowed but flagged: if the player deliberately travels to and engages an over-cap threat, fire a one-time "you are out of your depth" warning email; the Director does not soften it (the rewind save is your safety net, Bible §11).

`threatCap` mapping for the Director's budget (the L→initiative-bonus already exists: Bible §4 "+5/level"):

| tier | threatCap | Director may spawn up to |
|---|---|---|
| 1 | Alpha | peak-human only |
| 2 | L2 | Alpha–L2 |
| 3 | L3 | Alpha–L3 |
| 4 | L4 | Alpha–L4 |
| 5 | L5 | Alpha–L5 |
| 6 | L5+ | uncapped (cosmic) |

---

## 6. How this consumes the SPINE (country/city/personality stats)

Progression is mostly a *gate*, but the spine modulates **how hard the climb is** and **what scope means in practice**:

### 6.1 Geographic scope ↔ travel range (the spine's reach gate)

`geographicScope` (§2.1) caps which `Travel_Time_System.csv` `Range_Limit` bands you may legally use:

| scope | max legal travel `Range_Limit` (from `Travel_Time_System.csv`) | Why |
|---|---|---|
| city | "City only" / "Coastal" | Tier-1 has no political authority to cross jurisdictions; `Country_Attribute_Effects.csv` `LSWRegulations` Banned = "−3CS public operations" if you try |
| metro | "Same country" | local LE cooperation only |
| state | "Same continent" (ground) | state-gov authority |
| national | "Global" via commercial/military (faction territory) | federal authority + `Military_Transport` "Faction territory" requirement met |
| continental | "Global" all modes incl. `Supersonic` | diplomatic immunity clears `Customs_Inspection` (20% confiscation risk → 0) |
| unlimited | + LSW flight / teleport / **time travel** | universal authority + cosmic tech unlocks `Time_Travel` mode |

> **RULING (R-18.12) — crossing a border above your scope is *possible but penalized*, not blocked.** You may physically travel (the world is open), but operating above your scope applies the `Country_Attribute_Effects.csv` illegality penalties: `LSWRegulations: Banned → −3CS public operations`, `+2CS if caught as victim`, and a `Political_Checkpoint` (10% in hostile territory, "+2 days + detection risk"). Scope is *earned legitimacy*, not a wall — matching the GDD's open "go to the threat" world. The penalties are all verbatim source values.

### 6.2 Country `Population` / `PopulationRating` → recruitment & op-count

`Country_Attribute_Effects.csv` ties population to recruitment CS and op-count ("Large country … +2CS recruitment; multiple operations"). This feeds §3.3's active-op cap and the recruitment pool size — so a high-tier player in a small-population country still can't run 6 simultaneous ops (the `min(tier, popRating−1)` clamp bites). **The spine can throttle scope locally even when your tier permits it globally.**

### 6.3 "LSW Haven" combo accelerates the climb

`Country_Attribute_Effects.csv` combo "High LSWActivity + Legal Regulations → LSW Haven: +4CS recruitment". Operating from a Haven makes **`unlockRequirements` mission-count gates faster to clear** (more recruits → more squads → more concurrent missions → faster standing). No new number — the +4CS recruitment already exists; progression just *benefits* from it. Conversely a "Failed State" (Low Gov + High Corruption: "only force/bribery effective") makes legal mission bands (needed for `Gain federal clearance`) nearly unreachable, channeling the player toward force/black-market play.

### 6.4 Personality is **read, never written** by progression

Per Bible §5.10, the 20 personality types drive *tactical target selection* and idle behavior — progression does **not** consume them for tier logic (they belong to combat AI / sibling 03). The one touch-point: a hero's personality flavors the **promotion email's tone** (an arrogant lead gloats about the new mandate; a humble one frets) — cosmetic, sourced from `PERSONALITY TARGET SELECTION` only for the personality *label*.

---

## 7. Edge cases & failure modes

| # | Case | Handling |
|---|---|---|
| E1 | Standing crosses two thresholds at once (huge alien-tech recovery jump) | Promote **one tier per accepted email**; `pendingPromotion` re-fires next week for the second. No skipping tiers (each grants scope the player must learn). |
| E2 | Player declines/ignores all promotions, plays Tier-1 forever | Legal: `pendingPromotion` stays true; the player runs a "street vigilante" campaign by choice. The doom clock still ticks — declining scope is a self-imposed hard mode, surfaced in News. |
| E3 | `unlockRequirements` met but standing below threshold (did the missions, low rep) | No promotion. The two-gate AND (§4.1) holds. Email hints which gate is missing. |
| E4 | Standing above threshold but requirements unmet (farmed rep, did no missions) | No promotion. Same. Prevents "buying" rank without proving capability. |
| E5 | Faction starts with more LSWs than tier cap (CN: 6 vs cap 2) | Excess to reserve roster (R-18.6); not a bug. |
| E6 | Catastrophic reputation event at Tier 6 | Demotion floor (R-18.10): cannot drop below Tier 5 (`highestTierEverReached − 1`). |
| E7 | Time-travel rewind (Bible §11) to before a promotion | `ProgressionState` is part of the saved diegetic state; rewinding restores the *prior* tier. A rewind that *un-promotes* you is a real, intended cost of the save mechanic — surface it in the rewind-confirm dialog. |
| E8 | All countries hostile (global infamy), can't meet any recognition requirement | Player is locked at current tier; the *only* path up is the faction win-condition flag (R-18.8 `Save reality`) or rebuilding rep. This is a valid "burned all bridges" failure state, not a softlock — the doom clock still resolves the campaign. |
| E9 | Population-throttled op-cap = 0 (operating from a Pop-Rating-1 village at any tier) | `min(tier, popRating−1)` → `min(tier, 0)` = 0 active ops. Clamp floor to **1**: you can always run at least one op anywhere (R-18.5 amended: `max(1, min(tier, popRating−1))`). |
| E10 | Config disables demotion (OF-18.A → B) | `pendingDemotion` never set; promotions can still freeze. No tier ever drops. |
| E11 | Mentoring veteran dies mid-mission | The ×1.5 multiplier (R-18.9) is evaluated **at mission resolution** by current squad composition; a dead mentor mid-mission means no bonus that mission. |
| E12 | Standing weight authored as 0 / negative in modded CSV | Clamp `MISSION_STANDING_WEIGHT` to `≥0` at load; warn in the data-pipeline validator (sibling 106). |

---

## 8. UI/UX hooks

| Surface | Hook | Detail |
|---|---|---|
| **Phone — Email app** | Promotion offer / demotion warning | The granting authority emails; accept/decline reply options (§4.2, sibling 10). |
| **Phone — News app** | Promotion headline + over-cap "Point of Interest" | "FIST cleared for continental operations"; higher-threat entities you can't yet fight appear as POI news (R-18.11). |
| **Phone — Personnel/Profile** | **Rank card** | Current `levelName` + tier badge (1–6), a **standing progress bar** to next threshold (§3.1), and the `unlockRequirements` checklist (✓/✗ per §4.3) so the player always knows *exactly* what's left to climb. |
| **Phone — Standing log** | "Why did I rank up?" | Reads `standingHistory` (day/delta/reason) — every +50 mission, +200 rescue, mentoring ×1.5, etc. Transparent, never mysterious. |
| **World map** | **Scope reveal / fog** | On promotion, the newly-legal geographic scope un-fogs (metro→state→national…); over-scope sectors show a **lock/"requires Tier N" overlay** with the penalty preview (R-18.12). Flyers visibly move faster as scope grows (GDD line 627). |
| **World map — deploy** | Team-size + op-count clamps | Deploy UI greys out squad slots beyond `teamSizeLimit`, and blocks a new op when active ops hit `max(1, min(tier, popRating−1))` (§3.3/E9), with the reason shown. |
| **Laptop — Base/Roster** | Funding band gauge | The Economy view (sibling 16) shows current cash vs `fundingBand[tier]` with over/under flags. |
| **Combat overlay** | Threat-cap badge | When entering combat, a small badge confirms "within mandate (≤ {threatCap})" or, for player-initiated over-cap fights (R-18.11), a red "OUT OF MANDATE" warning. |

---

## 9. Integration points (reads / writes)

**This system WRITES:**
- `ProgressionState.tier` — **the canonical producer** of the tier read by `104-ai-director-difficulty.md` (`PlayerState.tier`), the Director's threat-cap, encounter cadence, and budget.
- `geographicScope` → consumed by **05-travel-movement** (range gating) and **04-world-map-sectors** (fog/scope reveal).
- `teamSizeLimit` → consumed by **08-recruitment-roster** (squad assembly clamp).
- `fundingBand` → consumed by **16-economy** (payday ceiling, pricing affordability).
- `threatCap` → consumed by **104-ai-director-difficulty** (hard spawn ceiling).
- `pendingPromotion`/`pendingDemotion` → fire events into **10-email-news** (the diegetic promotion/demotion delivery).

**This system READS (consumes the spine — Bible ruling #9):**
- `Player_Scaling.csv` (all tier/mission/enemy/catch-up rows) — the source of truth.
- `MISSION_STANDING_WEIGHT` ← mission results from **02-event-emergence-engine** (which `MissionBand` resolved).
- `Public_Perception.csv` positive events ← from **17-fame-reputation-legal** (`repEventStandingBonus`).
- `fameSystem.ts` `reputation`/`regionReputation` & `factionSystem.ts` standing ← for `unlockRequirements` (§4.3).
- `Faction_Specification.csv` ← Tier-1 seed + win-condition flags (§3.4, §4.3).
- `Country_Attribute_Effects.csv` / `City_Type_Effects.csv` `PopulationRating` ← op-count clamp & climb-speed modulation (§6.2/6.3).
- `Travel_Time_System.csv` `Range_Limit` ← scope→travel gating (§6.1).
- `doomClockSystem.ts` (`gameTime.day`, 2472-day clock) ← the climb-vs-clock race framing; demotion grace window anchors to `progressionTimeEstimateDays`.

**Load order:** `Player_Scaling.csv` must parse before the AI Director (104) initializes, since 104's `TierRule` mirror imports this one. Dataset must use the unified `allCountries`/`allCities` ISO-linked sets (Bible ruling #10) for the `PopulationRating` lookups in §6.2.

---

## 10. RULING summary (all labeled, all anchored or config-overridable)

- **R-18.1** Standing replaces XP as promotion currency; tier *bands* and mission weights kept verbatim (honors Bible #8 "no leveling").
- **R-18.2** 6 tiers (CSV/Bible), GDD's 5 scopes map to tiers 2–6 + Tier-1 tutorial scope.
- **R-18.3** Standing earned ONLY from existing tracked events (missions + positive perception); training/combat give none.
- **R-18.4** `Heroic_Recognition` (no CSV number) → +300 standing (anchored to +30 ceiling ×10).
- **R-18.5** Active-op cap = `max(1, min(tier, popRating−1))` (combines `Player_Scaling` tier + `City_Type_Effects` population gate).
- **R-18.6** `Starting_Reputation` seeds standing; excess starting LSWs go to reserve roster.
- **R-18.7** Promotion is an accept/decline inbox event, never a silent tick.
- **R-18.8** `unlockRequirements` mission bands map to the mission tier directly below the target tier.
- **R-18.9** Mentoring ×1.5 and intel-reuse ×1.1 ship in SP; geographic server-balance is MP-only.
- **R-18.10** Demotion on a full-band standing collapse, 30-day grace, one-tier soft floor.
- **R-18.11** `threatCap` is a hard ceiling on the AI Director, never on the world sim; player-initiated over-cap fights allowed-but-warned.
- **R-18.12** Operating above your geographic scope is penalized (CSV illegality CS), not blocked.

## 11. OWNER-FORK notes

- **OF-18.A** — **Demotion model:** ship real scope-loss demotion (A, default, `allowDemotion: true`) vs frozen-promotion-only (B). Owner picks default. (§4.5)
- **OF-18.B** — **Tier-1 promotion auto-accept:** should the *first* promotion (1→2) auto-accept to ease new players past the tutorial, or always require the inbox accept like all others? (R-18.7 currently: always manual.)
- **OF-18.C** — **Standing visibility:** show the raw Standing number to the player (transparent, MMO-like) or only the progress bar + checklist (more diegetic, "the world decides when you're ready")? Doc ships both surfaces (§8); owner may hide the raw number.
- **OF-18.D** — **Catch-up framing at launch:** the three catch-up mechanisms (§4.4) are authored for multiplayer. Ship their single-player reinterpretations now (mentoring/intel multipliers) or hold them entirely for the MP dimension (sibling 107)? Doc ships the SP versions; owner may gate them behind the MP flag.

## 12. Open questions

1. **Win-condition coupling:** Tier 6's `Save reality` requirement ties progression's ceiling to the endgame (sibling 111). Is Tier 6 reachable *before* the alien invasion resolves, or is it the endgame reward itself? (Affects whether the doom clock can be "outrun" into a cosmic-tier campaign.)
2. **Multi-faction / multi-squad tiering:** does `tier` belong to the *org* (one tier for the whole faction) or could different theaters/squads have different operating scopes? Current spec: one org-wide tier. Confirm vs sibling `squadSystem`.
3. **Standing decay:** fame decays over time (`fameSystem.ts` `decayAmount`). Should *standing* also decay if you go inactive, or is it a permanent ratchet (only lost via demotion)? Current spec: permanent ratchet (no passive decay), demotion is the only loss path.
4. **Per-band mission-count source:** §4.3/R-18.8 assumes mission resolution reports its `MissionBand`. Confirm sibling 02 emits the band on every completed mission so `missionsCompletedByBand` can increment reliably.
