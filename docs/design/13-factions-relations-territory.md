# 13 — Factions / Relations Matrix / Territory Control

> **System:** The geopolitical overlay that sits on top of the country/city spine — **who runs what, who likes whom, and what flips when you fight.** Four playable factions, a per-country web of six NPC faction standings, a 168×168 country-relations matrix, and sector territory control that combat moves.
> **Status:** BUILD-READY spec. Every number traces to a named source table; design choices that fill data gaps are tagged `RULING:`; product choices are tagged `OWNER-FORK:`.
> **Owns:** the ±CS overlay layer of the Spine (Bible §2 / §6.4), the "Personnel → country relationships (who's near war)" panel (Bible §7.3), bounty/heat consequences, and the territory layer the World Map (`04`) draws and Combat (`10`) feeds.
> **Primary sources opened:**
> - `Game_Mechanics_Spec/Faction_Specification.csv` — 4 playable factions: identities, relationships, territory-tier ±CS, starting resources, unique methods, win conditions.
> - `Faction_Relationships_Complete.csv` — 4-faction relation pairs (`Relationship_Level` −5..+5), internal sub-factions, 30+ ambient world factions (NATO/EU/criminal/alien/etc.) with `Player_Benefits`/`Player_Penalties`.
> - `SuperHero Tactics/countryrelationships.csv` + `MVP/src/data/countryRelationships.schema.md` — the 168×168 bilateral matrix (raw scale 1..6) and its decoded semantics.
> - `Game_Mechanics_Spec/Country_Attribute_Effects.csv` — `---FACTION TERRITORY BONUSES---` block (per-faction Home/Allied/Neutral/Hostile ±CS).
> - `Game_Mechanics_Spec/City_Type_Effects.csv`, `Culture_Region_Effects.csv` — recruitment pools, culture social ±CS that compose with faction overlay.
> - `Public_Perception.csv` — reputation deltas / financial / legal / international-relations consequences that *drive* standing changes.
> - `Game_Mechanics_Spec/Travel_Time_System.csv` — `Political_Checkpoint`/`Customs_Inspection` complications gated by hostile relations.
> - `SuperHero Tactics World Bible - Country.csv` (35-col header) — the country stats the overlay reads.
> - `FIST GDD v02.txt` §"Factions" (lines 192-209), story frame (lines 334-336), phone-alliances (line 487).
> - `SHT_MECHANICS_BIBLE.md` §2 (Spine), §6.4 (Factions/relations/territory), §8 (Combined effects), §9 (Public perception), §13 (rulings).
> **Code reality cross-checked:** `MVP/src/data/factionSystem.ts` (6 NPC faction TYPES, standing −100..+100, bounty thresholds, price/travel modifiers), `territorySystem.ts` (sector control, militia, liberation, defense missions), `reputationSystem.ts` (4-axis fame), `factionSystem.ts` initial-standing formulas, `countryRelationships.schema.md`.

---

## 1. Overview & Player Fantasy

You run **FIST** (or India/Establishment 24, China/Collective, Nigeria/Adaptive). Earth is not a neutral board — it is a **web of allegiances you are constantly leaning on or against.** Three layers, each a different texture of the same fantasy:

1. **Your faction is who you ARE.** Picking US/India/China/Nigeria sets your home turf, your signature investigation move, your win condition, and a permanent ±CS color on everything (`Faction_Specification.csv`). FIST kicks doors (`Shock and Awe +4CS`); China watches everything (`Mass Surveillance +4CS in controlled territory`); India talks (`Karma Network +2CS relationships`); Nigeria knows everybody on the continent (`Pan-African Network +3CS any African country`).

2. **Every country is a stack of six local powers** — Police, Military, Government, Media, Corporations, Underworld (`factionSystem.ts FactionType`). Each tracks a **−100..+100 standing** with you. Save civilians in Lagos and the Nigerian government warms; flatten a city block and the police post a bounty (`factionSystem.ts BOUNTY_THRESHOLDS`). This is the "living world that talks to you" — it talks through **email reactions** (`factionSystem.ts modifyStanding` already fires `generateFactionReactionEmail`) and through doors that open or close.

3. **Countries have their own opinions of each other** — the 168×168 matrix (`countryrelationships.csv`). India and Pakistan are at −3; if you operate out of India, Pakistan treats you as the enemy's agent. Borders open for allies and slam shut for rivals (`Travel_Time_System.csv Political_Checkpoint`). The whole web is **alive**: a treaty signed or a war started (Bible §6.5 `Dynamic_Political_Events`) ripples standings across the map.

4. **Territory is what fighting MOVES.** Sectors are controlled by factions at a 0–100% level (`territorySystem.ts`); winning combat in a sector pushes liberation progress; cross 100% and it **flips** to you, paying weekly income, intel, and fame (`territorySystem.ts calculateSectorBonuses`). You can raise **militia** to hold ground you can't garrison.

The point, per Bible §13 ruling #9: **all of this must be CONSUMED** — by mission generation, prices, recruitment pools, travel, and combat difficulty — not merely displayed. This spec defines the exact consumption formulas.

### 1.1 Three faction concepts — keep them distinct (naming lock)

The data uses "faction" for three different things. This spec locks the vocabulary so code never confuses them:

| Term | Count | Source | What it is |
|---|---|---|---|
| **PlayerFaction** | 4 | `Faction_Specification.csv` | The geopolitical power the player *embodies*: `US` / `IN` / `CN` / `NG`. One per campaign. |
| **LocalFaction** | 6 per country | `factionSystem.ts FactionType` | NPC power blocs *inside* each country: `police`/`military`/`government`/`media`/`corporations`/`underworld`. The player has a standing with each. |
| **CombatFaction** | 8 | `FIST GDD v02.txt` lines 197-209 | Battlefield sides: FIST Mercenary, Super Criminal, Mercenary, Terrorist, Local Police, National Police, Military, Jackal. (Also `territorySystem.ts FactionId`: player/criminal/government/corporate/rebel/neutral/contested.) Used by Combat (`10`) and Territory. |

> `RULING-NAME`: The three are **linked but not merged.** A `LocalFaction` standing maps to a `CombatFaction` when a mission turns hostile (e.g. `police` standing < −50 → `Local Police`/`National Police` spawn as enemies; see §7.4). A `PlayerFaction` choice seeds the *home* `LocalFaction` standings high (§4.3). Territory `CombatFaction` ⊂ the 8-side list. **Do not** collapse them into one enum.

---

## 2. Data Schema

All types are TypeScript; they extend what already exists in `factionSystem.ts` / `territorySystem.ts` rather than replacing it.

### 2.1 PlayerFaction (the 4 playable powers)

```ts
type PlayerFactionId = 'US' | 'IN' | 'CN' | 'NG';
// SOURCE: Faction_Specification.csv Faction_ID column (US/IN/CN/NG).

interface PlayerFaction {
  id: PlayerFactionId;
  name: string;                 // "United States" | "India" | "China" | "Nigeria"
  fullName: string;             // "United States LSW Division" etc. (Faction_Specification.csv Full_Name)
  headquarters: string;         // "Washington DC" | "New Delhi" | "Beijing" | "Lagos"
  homeCountryCodes: string[];   // Starting_Countries column, split — see §3.1 table
  playstyle: string;            // "Military-Industrial Complex" etc.

  // ±CS identity package (Faction_Specification.csv Strengths/Weaknesses, parsed to structured mods)
  bonuses: FactionCSMod[];      // e.g. { tag:'military_ops', cs:+3 }, { tag:'technology', cs:+2 }
  penalties: FactionCSMod[];    // e.g. { tag:'covert', cs:-2 }

  uniqueAbility: UniqueAbility;       // "Arsenal of Democracy" etc. (Unique_Ability)
  uniqueMethod: UniqueInvestigation;  // signature investigation method (---FACTION UNIQUE INVESTIGATION METHODS---)
  winCondition: FactionWinCondition;  // ---FACTION WIN CONDITIONS---

  startingResources: {                // ---FACTION STARTING RESOURCES---
    startingLSWs: number;             // US 5, IN 4, CN 6, NG 4
    startingBudgetTier: 'Low' | 'Medium' | 'High';
    startingTechLevel: 'Basic' | 'Standard' | 'Advanced';
    startingContacts: string[];       // e.g. ["Military","Corporate"]
    startingReputation: number;       // US +50, IN +30, CN +10, NG +20 (see §3.1)
  };
}

interface FactionCSMod { tag: string; cs: number; note?: string; }

interface UniqueAbility {
  id: string; name: string; effect: string;
  // US "Arsenal of Democracy": all military equipment at 20% discount → priceMult 0.80 on military gear
  discountMult?: number;
}

interface UniqueInvestigation {
  name: string;           // "Shock and Awe" | "Spiritual Consultation" | "Mass Surveillance" | "Pan-African Network"
  cs: number;             // +4 / +3 / +4 / +3 (Bonus column)
  requirement: string;    // "Military authorization" | "Spiritual LSW" | "Tech infrastructure" | "African operation"
  cooldownDays: number;   // US 7, IN 3, CN 1, NG 0 (None)
}

interface FactionWinCondition {
  primaryGoal: string; secondaryGoal: string; victoryCondition: string;
  // US: "Control 60% of global LSW population through registration" → see §6.4 victory tracking
}
```

### 2.2 PlayerFactionRelation (4×4 relation graph)

```ts
type PlayerFactionRelationStatus =
  | 'Cautious_Alliance' | 'Cold_War_Rivals' | 'Emerging_Partnership'
  | 'Border_Tensions' | 'South_South_Cooperation' | 'Economic_Partnership';
// SOURCE: Faction_Relationships_Complete.csv Relationship_Status column (rows 2-7).

interface PlayerFactionRelation {
  a: PlayerFactionId; b: PlayerFactionId;
  status: PlayerFactionRelationStatus;
  level: number;                 // Relationship_Level: −5..+5 (see §3.2 table)
  cooperationAreas: string[];    // Cooperation_Areas column
  conflictPoints: string[];      // Conflict_Points column
  playerBenefits: string;        // Player_Benefits column (parsed to a CS/equipment effect)
  playerPenalties: string;       // Player_Penalties column
  dynamicEvents: string[];       // Dynamic_Events_Possible column → seeds Event Engine (02)
}
```

### 2.3 LocalFactionStanding — **already exists in `factionSystem.ts`; this spec extends, does not rewrite**

```ts
// EXISTING (factionSystem.ts) — kept verbatim:
type FactionType = 'police' | 'military' | 'government' | 'media' | 'corporations' | 'underworld';
interface FactionStanding {
  factionId: string;            // "police_us"
  factionType: FactionType;
  countryCode: string; countryName: string;
  standing: number;             // −100..+100
  standingLabel: StandingLabel; // Hero..Terrorist (8 bands, factionSystem.ts STANDING_THRESHOLDS)
  lastChanged: number; lastChangeReason: string; history: StandingEvent[];
  activeBounty: Bounty | null; isMember: boolean; memberRank?: number;
  unlockedMissions: string[]; unlockedEquipment: string[]; unlockedSafeHouses: string[];
}

// ★ NEW fields to add to FactionStanding:
interface FactionStandingExt {
  heat: number;                 // ★ 0..100 short-term "they are actively looking for you" meter (§5.4)
                                //   decays faster than standing; drives encounter chance THIS week.
  perceivedPlayerFaction: boolean; // ★ does this LocalFaction know which PlayerFaction you serve?
                                //   gates the relations-matrix penalty (§3.4).
}
```

### 2.4 CountryRelation (the 168×168 matrix, normalized to pairs)

```ts
// Raw matrix is countryrelationships.csv (1..6). Normalize ONCE at load (see §3.3 RULING).
type RelStatus = 'war' | 'hostile' | 'tense' | 'neutral' | 'friendly' | 'allied' | 'strong_alliance';
// SOURCE: countryRelationships.schema.md "Proposed Database Schema" (the canonical decode).

interface CountryRelation {
  aCode: string; bCode: string;       // ISO/Bible country codes (symmetric: store a<b once)
  level: number;                      // −5..+5 (decoded, see §3.3)
  status: RelStatus;
  volatility: number;                 // 1..10 how likely to change (schema.md field; default 3)
  // optional factor breakdown (schema.md Option A) — default 0, filled by events:
  factors?: { trade: number; military: number; diplomatic: number; cultural: number; intelligence: number; };
  hasBorderDispute?: boolean;
}
```

### 2.5 TerritoryControl — **already exists in `territorySystem.ts`; kept verbatim, two fields added**

```ts
// EXISTING (territorySystem.ts):
type FactionId = 'player' | 'criminal' | 'government' | 'corporate' | 'rebel' | 'neutral' | 'contested';
interface TerritoryControl {
  sectorId: string;
  controllingFaction: FactionId;
  controlPercent: number;        // 0..100
  militiaStrength: number;       // 0..100
  liberationProgress: number;    // 0..100 (progress to flip)
  lastCombatTurn: number;
  contestedBy: FactionId | null;
  bonuses: TerritoryBonus[];     // income/recruitment/intel/equipment/fame

  // ★ NEW:
  playerFactionOverlay?: PlayerFactionId; // ★ which of US/IN/CN/NG claims this (for Home/Ally/Hostile ±CS)
  garrisonSquadIds?: string[];           // ★ player squads stationed here (raises hold, see §6.3)
}
```

---

## 3. Exact Numbers / Tables / Formulas (each cited)

### 3.1 The four PlayerFactions (literal data, `Faction_Specification.csv`)

| Field | US | IN | CN | NG |
|---|---|---|---|---|
| Full name | United States LSW Division | Indian Supernatural Affairs Bureau | Ministry of State Superhuman Security | Pan-African LSW Coalition |
| HQ | Washington DC | New Delhi | Beijing | Lagos |
| Home countries | US, CA, GB, AU, JP, KR, DE, FR, IL | IN, BD, NP, LK, BT, MU, FJ | CN, KP, LA, KH, MM, PK(partial) | NG, GH, KE, ZA, ET, SN, TZ |
| Playstyle | Military-Industrial | Spiritual-Diplomatic | Surveillance-Control | Resource-Network |
| Signature ±CS | +3CS military ops, +2CS tech | +3CS mystical/spiritual, +2CS diplomatic | +3CS surveillance, +2CS corporate infiltration | +3CS underground networks, +2CS resource ops |
| Weakness ±CS | −2CS covert | (limited military budget) | −2CS diplomatic | (limited technology) |
| Unique ability | Arsenal of Democracy: all military gear −20% | Karma Network: +2CS all relationship building | Great Firewall: +3CS info control in territory | Ubuntu Bond: +2CS all African ops |
| Unique method (CS / cooldown) | Shock and Awe +4CS / 7d | Spiritual Consultation +3CS / 3d | Mass Surveillance +4CS / 1d | Pan-African Network +3CS / no cooldown |
| Starting LSWs | 5 | 4 | 6 | 4 |
| Starting budget | High | Medium | High | Low |
| Starting tech | Advanced | Standard | Advanced | Basic |
| Starting reputation | +50 (known heroes) | +30 (respected) | +10 (feared) | +20 (underdog) |
| Win condition | Control 60% of global LSW pop via registration | Balance mystical vs tech LSW development | LSW control system across allied+neutral territory | Unite Africa + resource independence |

> `RULING-HOME-COUNTRY-CODES`: `Faction_Specification.csv` writes home countries as **names**; convert to the canonical ISO/Bible codes from `allCountries.ts` (Bible §13 ruling #10 — unify on `allCountries`/`allCities`). "Pakistan (partial)" for CN → `RULING`: CN gets a **+1CS (half) territory bonus** in PK rather than full Home (PK is also India-adjacent); see §3.6.

### 3.2 PlayerFaction relations (4×4, `Faction_Relationships_Complete.csv` rows 2-7)

| Pair | Status | Level | Player effect (when you are faction A) |
|---|---|---|---|
| US–IN | Cautious_Alliance | **+2** | +2CS investigation cooperation; equipment sharing; diplomatic immunity in allied territory. Penalty: −1CS ops in India without consultation. |
| US–CN | Cold_War_Rivals | **−3** | Investigation **blocked** in Chinese territory; **−3CS all ops in China**; sanctions raise equipment cost. |
| US–NG | Emerging_Partnership | **+1** | +1CS Africa ops; cultural-exchange bonus. Penalty: −2CS ops without cultural sensitivity. |
| IN–CN | Border_Tensions | **−2** | +1CS in disputed territory (Indian POV); investigation complications in border regions. |
| IN–NG | South_South_Cooperation | **+3** | +3CS Africa ops; cultural authenticity bonus. No penalties. |
| CN–NG | Economic_Partnership | **+1** | +2CS infrastructure projects; tech access. Penalty: −1CS ops without economic cooperation. |

This is the **simpler 4-faction table also present in `Faction_Specification.csv` rows 13-18** (Allied/Rival/Friendly/Tense/Neutral with ±1CS). `RULING-FACTION-REL-SOURCE`: where the two source tables disagree (e.g. US–IN is "Allied +1CS" in Faction_Specification vs "Cautious_Alliance +2" in Faction_Relationships_Complete), **use `Faction_Relationships_Complete.csv`** — it is the richer, later table with explicit benefits/penalties/events. Map its `Relationship_Level` to ±CS via §3.5.

### 3.3 The 168×168 country matrix — decode + normalize (`countryrelationships.csv`)

Raw cells are **1..6** with this decode (`countryRelationships.schema.md` "Relationship Values (Current)"):

| Raw | Meaning | Normalized `level` | `status` |
|---|---|---|---|
| 1 | Strong Alliance | **+5** | strong_alliance |
| 2 | Friendly | **+2** | friendly |
| 3 | Neutral | **0** | neutral |
| 4 | Tense | **−2** | tense |
| 5 | Hostile | **−4** | hostile |
| 6 | Conflict (war/near-war) | **−5** | war |
| empty | self / no data | n/a | skip (diagonal) |

> `RULING-MATRIX-NORMALIZE`: at load, **transform raw→normalized once** using the table above and store as `CountryRelation` pairs (`schema.md` "Next Steps #1: Convert Matrix to Pairs"). The schema.md *also* proposes a richer −5..+5 with 11 bands; we **down-map to the 6 source values** because that is the only data that actually exists (never invent intermediate values per the no-invented-numbers rule). The 11-band table in schema.md is a **future authoring target, not current data.**
>
> `RULING-MATRIX-INTEGRITY`: the raw CSV has **visible row-misalignment corruption** (many rows repeat the same 1..6 run-length pattern and some rows are shifted, e.g. blocks of `2,2,5,3,2,2,2,2,4,2,4,3,3,4`). Treat any cell whose row and column country indices don't both resolve to a known country code as **`3`/neutral (level 0)** at load, and log it. Authoritative real-world overrides for the **handful of canonical conflicts** are in `schema.md` "Current Conflicts (2024 baseline)" and MUST be applied on top after normalize:

| Pair | Forced `level` | Source |
|---|---|---|
| Russia–Ukraine | −5 (war) | schema.md baseline |
| Israel–Iran | −4 (hostile) | schema.md baseline |
| India–Pakistan | −3 → store as −4 hostile (no −3 source value) → `RULING`: use −4 | schema.md baseline |
| China–Taiwan | −4 (hostile) | schema.md baseline |
| North Korea–South Korea | −4 (hostile) | schema.md baseline |

`RULING`: India–Pakistan is "−3" in schema.md prose but −3 has no source band; snap to the nearest existing band **−4 (hostile)**. Flag as `OWNER-FORK-IP` below if owner wants a dedicated −3 "tense-plus" band.

### 3.4 Country relation → player operations (`countryRelationships.schema.md` "Game Integration")

The schema.md ships exact functions; reuse them verbatim. **Operating country = your PlayerFaction's home country (or the country your active squad deployed from); target = the country you are acting in.**

```
getOperationModifier(level):  level≥3 → +2CS ;  level∈[1,2] → +1CS ;  0 → 0 ;
                              level∈[−2,−1] → −1CS ;  level∈[−4,−3] → −2CS ;  level=−5 → −3CS
getTravelModifier(level):     level≤−4 → BLOCKED ;  level≤−2 → cost ×2.0, time ×1.5 ;
                              level≥3 → cost ×0.8, time ×0.9 ;  else ×1.0
getRecruitmentModifier(level):level≥4 → +3CS ;  level≥2 → +1CS ;  level≤−3 → −3CS ;  else 0
```
SOURCE: `countryRelationships.schema.md` lines 213-253 (verbatim). These are the **dynamic relationship events** that move `level` (schema.md "Dynamic Relationship Events"):

| Player action | Δlevel with that country |
|---|---|
| Joint operation success | +1 with partner |
| Collateral damage in country | −1 |
| Save civilians | +1 |
| Violate sovereignty (unauthorized op) | −2 |
| Share technology | +1 |
| International incident (by severity) | −1 to −3 |

> `RULING-PERCEIVED-FACTION`: the matrix penalty only bites once a `LocalFaction` flags `perceivedPlayerFaction = true` (you've been *seen* operating as US/IN/CN/NG). Covert ops (Bible §7.6 CovertOps) keep it `false`; getting caught (detection roll vs `IntelligenceBudget`, §3.7 Country_Attribute_Effects) sets it `true` and *retroactively* applies the pending relations penalty. This makes the China/US −3 wall a stealth challenge, not a brick wall (honors the "tense, not a brick wall" save-economy spirit).

### 3.5 Faction-relation level → ±CS (single conversion, used by §3.2 and §3.3)

```
levelToCS(level):  +5→+3 ; +4→+2 ; +3→+2 ; +2→+1 ; +1→+1 ; 0→0 ;
                   −1→−1 ; −2→−1 ; −3→−2 ; −4→−2 ; −5→−3
```
SOURCE: identical mapping in `countryRelationships.schema.md` "Relationship Level Scale (Proposed)" (the CS column) AND `Faction_Specification.csv` `---FACTION RELATIONSHIPS---` (Allied=+1CS, Rival=−1CS). One function, two callers. **No invented values** — every output is a band that appears in a source table.

### 3.6 PlayerFaction territory tiers → ±CS (`Country_Attribute_Effects.csv` `---FACTION TERRITORY BONUSES---` + `Faction_Specification.csv` `---FACTION TERRITORY CONTROL---`)

A country, relative to your PlayerFaction, is in exactly one tier. The ±CS is **faction-specific** (two source tables; merge as below):

| Tier | Definition | US | IN | CN | NG | (generic, Faction_Spec) |
|---|---|---|---|---|---|---|
| **Home** | country ∈ your `homeCountryCodes` | +3CS all methods; full equipment; **legal immunity**; instant comms | +2CS diplomatic/cultural/spiritual | +3CS surveillance, +2CS corporate, +2CS tech | +2CS tribal/underground/resource | +3CS all; legal immunity (Faction_Spec Home_Territory) |
| **Allied** | matrix level ≥ +1 to your home, OR home of an allied PlayerFaction (§3.2 level ≥ +1) | (generic +1CS diplomatic) | +1CS diplomatic | +1CS technology | +1CS African continental | +1CS diplomatic; reduced equipment access |
| **Contested** | another PlayerFaction also claims/operates here | no bonus; **+encounter chance**; political sensitivity | — | — | — | no bonus; +encounter chance (Faction_Spec Contested) |
| **Neutral** | no claim, matrix level ≈ 0 | standard ops | — | — | — | build relationships from scratch |
| **Hostile** | matrix level ≤ −3 to your home, OR home of a rival PlayerFaction (§3.2 level ≤ −2) | −2CS all; −2CS equipment access | −3CS; cultural penalties | −2CS diplomatic, **+2CS covert** | −2CS official; rely on unofficial | −2CS all; equipment restrictions; detection risk |

> `RULING-TERRITORY-MERGE`: `Country_Attribute_Effects.csv` gives the **faction-specific** numbers (use these as primary); `Faction_Specification.csv` gives the **generic fallback** for tiers a faction's row omits (e.g. China's Contested). When both exist, faction-specific wins. The China-Hostile "+2CS covert" is real source data (China is a surveillance faction that thrives operating covertly in enemy turf) — keep it.

### 3.7 Country stats that seed/move LocalFaction standings (`Country_Attribute_Effects.csv`, consumed by `factionSystem.ts getInitialStanding`)

The existing `getInitialStanding()` (factionSystem.ts lines 215-278) is **already correct and traces to source**; documented here for completeness:

| LocalFaction | Seeded from country stat | Formula (existing code) |
|---|---|---|
| police | `LSWRegulations` | Legal +25, Regulated 0, Banned −15 (matches `Country_Attribute_Effects.csv LSWRegulations`: Legal "+2CS public ops", Banned "−3CS public ops") |
| military | `GovernmentPerception` + home | Home +30; Full Democracy +10; Flawed 0; Hybrid −10; Authoritarian −25 (matches GovernmentPerception "Democracy +2CS legal") |
| government | home + culture match | Home +50; same culture group +15; else 0 |
| media | `MediaFreedom` | ≥70 +10; ≥40 0; else −10 (matches MediaFreedom "Free media +2CS media investigation") |
| corporations | `GDPPerCapita` | ≥60 +15; ≥40 +5; else −5 |
| underworld | avg city `CrimeIndex` | `round((avgCrime − 50) × 0.6)` (matches `City_Type_Effects.csv` crime block: High crime "+2CS underground") |

> `RULING-PLAYERFACTION-SEED`: extend `getInitialStanding` so a chosen **PlayerFaction also seeds its home `LocalFaction`s by its `startingReputation`** (US +50 → home government/military start +50 instead of +30/+50 baseline-merged; take the **max**). Source: `Faction_Specification.csv` `---FACTION STARTING RESOURCES---` Starting_Reputation column.

### 3.8 LocalFaction standing → consumed effects (`factionSystem.ts`, verbatim — the consumption layer)

These already exist and are correct; this is the **spine-consumption contract** other systems call:

| Effect | Function (factionSystem.ts) | Bands |
|---|---|---|
| Buy price | `getPriceModifier(standing)` | ≥75 ×0.75 · ≥50 ×0.90 · ≥25 ×1.0 · ≥0 ×1.15 · ≥−49 ×1.30 · else ×1.75 |
| Sell price | `getSellPriceModifier` | ≥75 ×1.20 · ≥50 ×1.10 · ≥25 ×1.0 · ≥0 ×0.90 · ≥−49 ×0.70 · else ×0.50 |
| Equipment tier | `getEquipmentTier` | ≥75 classified · ≥50 military · ≥25 advanced · else basic |
| Safe-house access | `hasSafeHouseAccess` | police 50 · military 60 · government 70 · corporations 40 · underworld 30 · media 50 |
| Country travel time | `getTravelTimeModifier(overallRep)` | ≥75 ×0.50 · ≥50 ×0.75 · ≥25..0 ×1.0 · ≥−24 ×1.25 · ≥−49 ×1.50 · ≥−74 ×2.0 · else **∞ (cannot enter)** |
| Bounty | `BOUNTY_THRESHOLDS` | minor (−49..−25): $10k, 1-3 hunters TL2, 10%/day · major (−74..−50): $50k, 4-8 TL4, 25%/day · extreme (−100..−75): $250k, 8-15 TL7, 50%/day |
| Cross-faction bleed | `getRelatedFactionEffects` | police↔underworld enemy ×0.67; police-government ally ×0.50; military-government ally ×0.53; etc. (FACTION_RELATIONSHIPS array) |
| Decay | `getStandingDecay` | toward 0 at 1/30 days, only outside [−50,+50] |

> `RULING-OVERALL-REP`: `getCountryReputation` averages all 6 LocalFactions for `overallReputation`, which drives travel/border. **Weight it** so government and military count double for *legal* border crossing (they run the border) while underworld counts double for *smuggling* routes: `legalRep = (gov×2 + military×2 + police + media)/6`; `smugglingRep = (underworld×2 + corporations + (100−police... ))`. SOURCE for the weighting intent: `Travel_Time_System.csv Political_Checkpoint` (military/diplomatic) vs `Customs_Inspection`/smuggling. `OWNER-FORK-BORDER-WEIGHT` if owner prefers the existing flat average.

### 3.9 Reputation deltas that drive standings (`Public_Perception.csv` — the event→standing bridge)

When combat/missions produce a perception event, apply its `Reputation_Change` to the relevant LocalFactions in the country, scaled to the −100..+100 standing axis. **These are the source numbers; do not invent your own combat-consequence values.**

| Event | Reputation_Change | Which LocalFactions move | Financial / Legal rider |
|---|---|---|---|
| Street_Crime_Stopped | +2 local | police +2, government +1 | small reward |
| Property_Damage_Minor | +1 / −1 property | corporations −1, police −1 | $5K–25K |
| Property_Damage_Major | −2 regional | corporations −2, government −2 | $100K–500K; insurance +25% |
| Civilian_Casualties_Minor | −5 national | government −5, police −5, media −3 | $50K–200K/civilian; congressional hearings |
| Civilian_Casualties_Major | −10 global | ALL −10 (cross-border via matrix) | $500K–5M/civilian; war-crimes calls |
| Infrastructure_Damage | −8 national | government −8, military −4 | $1M–50M |
| Hospital_Damage | −12 national | government −12, media −10 | $2M–20M |
| School_Damage | −15 national | government −15, media −12 | $1M–15M/school |
| Government_Building_Damage | −20 intl | government −20 (and rival-faction matrix bleed) | $5M–100M |
| Military_Base_Damage | −25 military | military −25, government −15 | $10M–200M; court martial |
| Nuclear_Facility_Damage | −50 global | ALL −50; **global LSW ops banned** | $100M–10B; UN tribunal |
| Saved_Lives_Civilian | +5..+20 | government +, media +, police + | civic awards; recruitment easier |
| Prevented_Disaster | +10..+30 | ALL + | permanent hero status |
| Team_Member_Death | −15 faction | own-faction morale −15 | funeral; recruitment harder |
| Mass_Destruction | −100 global | ALL −100; **abilities globally regulated** | $1B–1T |

> `RULING-DELTA-SCALING`: `Public_Perception.csv` deltas are already on a comparable −100..+100 scale (street crime +2 … mass destruction −100), so apply **1:1** to standing, clamped to [−100,+100] (matches `factionSystem.ts modifyStanding` clamp). "Local/Regional/National/Global" `Public_Impact_Scale` sets the **blast radius**: Local → just the city's country LocalFactions; Regional → +adjacent-country matrix bleed at half; National → whole country; Global → every country whose matrix level to the incident country ≤ −1 gets the full delta (enemies amplify your sins), allies get half.

### 3.10 Travel complications gated by relations (`Travel_Time_System.csv` `---TRAVEL COMPLICATIONS---`)

| Complication | Trigger | Effect | Bypass |
|---|---|---|---|
| Political_Checkpoint | 10% **in hostile territory** (matrix level ≤ −3 OR Hostile tier §3.6) | +2 days + detection risk roll | Diplomatic credentials; covert entry |
| Customs_Inspection | 20% on **international** crossing | possible equipment confiscation | Diplomatic immunity (Home/Allied tier); smuggling (underworld safe-house) |

These compose with `getTravelTimeModifier` (§3.8) multiplicatively. SOURCE: `Travel_Time_System.csv` lines 41-44.

---

## 4. How It Consumes the SPINE

Per Bible §2, this overlay reads country/city/culture/personality and writes ±CS the rest of the game obeys. **The resolved modifier for any action is the sum of independent ±CS contributions on the one Universal Table axis (Bible §3.3 "Column Shift is the universal currency").**

### 4.1 The master operation-CS stack (the spine made concrete)

For any investigation/covert/diplomatic/combat action in country C, city Y, by PlayerFaction F:

```
opCS =  faction.uniqueMethod.cs            // §3.1 (if method used & off cooldown & requirement met)
      + factionSignatureCS(F, actionTag)    // §3.1 strengths/penalties matching the action tag
      + territoryTierCS(F, C)               // §3.6 Home/Allied/Contested/Neutral/Hostile
      + levelToCS(matrix(F.home, C))        // §3.5 bilateral country relation (if perceivedPlayerFaction)
      + countryAttrCS(C, actionTag)         // §3.7 / Country_Attribute_Effects (corruption, intel, media…)
      + cityTypeCS(Y, actionTag)            // City_Type_Effects.csv (Military city +2CS military invest, etc.)
      + cultureCS(F.homeCulture, C.culture) // Culture_Region_Effects: same +2 / similar +1 / opposed −1
      + crimeCS(Y.crimeIndex, actionTag)    // City_Type_Effects crime block (High crime −2 legal / +2 underground)
      + localFactionMethodCS(standing, ...) // §3.8 (member bonus, safe-house, equipment tier)
```
Every term cites a source table above. This single stack is what makes the world "talk": stand in a corrupt failed state as China and your covert CS soars; stand in a free-media democracy as the US and your public ops soar but covert tanks.

### 4.2 Which stats drive what (explicit spine map)

| Spine input | Source table | Faction/territory effect |
|---|---|---|
| `GovernmentCorruption` | Country_Attribute_Effects | High → cheaper bribes to raise LocalFaction standing fast (+3CS bribe path); enables black-market equipment regardless of standing |
| `IntelligenceBudget` | Country_Attribute_Effects | High → faster detection → flips `perceivedPlayerFaction` → triggers matrix penalty; +detection risk in Hostile tier |
| `LSWRegulations` / `Vigilantism` | Country_Attribute_Effects | Seeds police standing (§3.7); Banned → public faction ops illegal (−3CS) |
| `MediaFreedom` | Country_Attribute_Effects | Seeds media standing; high media → perception events propagate to MORE LocalFactions (Public_Perception blast radius ×) |
| city `CrimeIndex` | World Bible Cities | Seeds underworld standing; high → safe-house / smuggling route access |
| `CityType` | City_Type_Effects | Sets which LocalFaction's recruits you can pull (Military city → military LSWs +3CS) |
| `CultureCode` | Culture_Region_Effects | Same-culture countries cluster into Allied tier faster; opposed −1CS social to standing-raising |
| **personality** (20 types) | PERSONALITY TARGET SELECTION | Drives `Dynamic_Events_Possible` selection (§5.5) and which faction an NPC leader favors |

### 4.3 Campaign start (consumes faction choice → seeds the whole web)

On new game: pick PlayerFaction → `initializeFactionStandings(allCountries, homeCode)` (existing) → **then** apply §3.7 `RULING-PLAYERFACTION-SEED` (home factions to `startingReputation`) → normalize the 168×168 matrix (§3.3) → seed territory: each PlayerFaction's `homeCountryCodes` sectors start `controllingFaction='player'`/their overlay at `controlPercent` from `Faction_Specification.csv` Starting_Reputation-tier (US/CN High → 75%, IN/NG Medium/Low → 50%). `OWNER-FORK-START-CONTROL` for exact starting %.

---

## 5. Edge Cases & Failure Modes

1. **Matrix corruption / unknown code (§3.3 `RULING-MATRIX-INTEGRITY`).** Any cell where row or column country index doesn't resolve → default `level 0`/neutral, log once. Never crash, never invent a non-source value.
2. **Symmetric vs asymmetric relations.** The raw matrix is *roughly* symmetric but corrupted rows make `A→B ≠ B→A`. `RULING`: store **one canonical pair (a<b by code)**; on read use the canonical value both directions (schema.md stores `UNIQUE(a,b)`). Exception: forced real-world overrides (§3.3) are symmetric.
3. **Standing clamp.** All standing math clamps to [−100,+100] (`modifyStanding`). Cross-faction bleed (`getRelatedFactionEffects`) applies *after* clamp on the source, then clamps each target.
4. **Decay vs active heat.** `standing` decays slowly (`getStandingDecay`, 1/30d, only outside ±50). `heat` (★new) decays **fast** (`RULING`: −10/day, floor 0) so a single atrocity makes the next week dangerous without permanently branding you. Encounter chance this week = `BOUNTY_THRESHOLDS.encounterChancePerDay × (1 + heat/100)`.
5. **"Cannot enter" deadlock.** If `getTravelTimeModifier` returns ∞ (overallRep ≤ −75) for your ONLY route, the player can still enter **covertly** (smuggling route via underworld safe-house, §3.8) or via an allied PlayerFaction's territory bridge. Never strand the player with zero legal+illegal options. `RULING`: if all six LocalFactions in a country are ≤ −75, a **forced "wanted everywhere" combat encounter** spawns on entry instead of a hard block.
6. **Territory flip thrash.** `territorySystem.applyCombatOutcome` flips at `liberationProgress ≥ 100` then resets to 50%; rapid back-and-forth could thrash. `RULING`: add a **48-game-hour cooldown** (`lastCombatTurn`) before a sector can flip again (the code already stamps `lastCombatTurn`; gate the flip on `gameDay − lastCombatTurn ≥ 2`).
7. **Self-relation / home matrix.** Diagonal of the matrix is empty; `matrix(C,C)` → treat as +5 (you are home). Guards §4.1.
8. **PlayerFaction at war with itself.** N/A — only one PlayerFaction per campaign; the other three are AI. Their pairwise relations (§3.2) drive AI behavior and `Dynamic_Events_Possible`, not the player's stack, *except* via territory tier (you in a rival's home = Hostile).
9. **Perception event with no clear country.** Combat in international waters / alien sector → apply Global-scale deltas to your PlayerFaction's home factions + the UN/EU ambient factions (`Faction_Relationships_Complete.csv` rows 16, 19). `RULING`.
10. **Militia with zero loyalty.** `territorySystem` militia `loyalty` can hit 0 via attrition → `RULING`: at loyalty 0 the militia **defects to `contestedBy`** (or disbands if none), accelerating liberation. Source intent: territorySystem already models loyalty; this gives it teeth.
11. **Win-condition griefing (US 60% LSW registration).** Track via §6.4; if unreachable because rivals hold registration territory, the FITR/event engine (`02`) must offer alternative paths (Dynamic_Events_Possible "Technology sharing", "Diplomatic incidents"). `OWNER-FORK-WINCON-FALLBACK`.

---

## 6. UI/UX Hooks

### 6.1 Phone / Laptop — Personnel app "Country Relationships" panel (Bible §7.3)
- A **standings board**: 6 LocalFaction icons (`factionSystem.ts FACTION_ICONS`: 👮⚔️🏛️📰🏢🎭) per country, each a colored bar (`getStandingColor`) with the band label (Hero…Terrorist). **Honor global rule: replace the existing `Terrorist` band purple `#a855f7`** with a non-purple hostile color (deep crimson `#7f1d1d`). `RULING-NO-PURPLE`.
- A **"who's near war" ticker** (Bible §7.3 literal ask): list country pairs at matrix level ≤ −4, sorted by your involvement. Clicking opens the relations sub-graph.
- **Email reactions already fire** (`modifyStanding` → `generateFactionReactionEmail`): surface the resulting email as the diegetic notification (no separate toast).

### 6.2 World Map overlay (consumed by `04-world-map-sectors.md`)
- **Territory tint** per sector = `controllingFaction` color (`territorySystem.getControlColor`), opacity = `controlPercent`. Player-faction overlay border for Home/Allied/Hostile tier.
- **Contested sectors pulse** (`contestedBy != null`); show `liberationProgress` as a fill ring.
- **Relation lens** (toggle): recolor every country by its matrix level to your home country (green allied → red war), so the player reads the geopolitical board at a glance.
- **Border-closed icon** on countries where `getTravelTimeModifier === ∞`.

### 6.3 Territory / Base panel
- Per controlled sector: bonuses list (`calculateSectorBonuses`: income ≥50%, intel ≥75%, fame 100%), militia roster (`getSectorMilitia`), garrison-squad slots (★new field), "Train militia" button (`trainMilitia`: +0.5 strength/day).
- **Defense/Liberation mission cards** (`getActiveDefenseMissions`) appear here and as priority email.

### 6.4 Win-condition tracker (per PlayerFaction)
- US: **global LSW-registration %** progress bar (target 60%) = (LSWs in player-controlled+registered territory) / (global LSW pop from `LSWActivity` sums). IN: mystical-vs-tech balance gauge. CN: % allied+neutral territory under "control system". NG: African-unity % + resource-independence gauge. SOURCE: `Faction_Specification.csv ---FACTION WIN CONDITIONS---`. `OWNER-FORK-WINCON-MATH` for exact denominators.

### 6.5 Combat overlay (Bible §6.4 — symbolic combat, light)
- Enemy units carry a **CombatFaction glyph** (FIST/Police/Military/Jackal/Super-Criminal/Terrorist/Mercenary). When a `LocalFaction` standing is the *reason* they're hostile, a small standing-band chip shows under the glyph (e.g. police chip "Criminal −60").
- No 3D; flight = altitude integer + wing/shadow indicator (per project combat lock) — faction system adds **no** combat geometry, only side-assignment and the ±CS that pre-loads into the unit's column.

---

## 7. Integration Points (reads / writes)

| System | This system READS | This system WRITES |
|---|---|---|
| **Spine / countries** (`allCountries.ts`, `Country_Attribute_Effects`) | all 35 country stats, culture, city crime | — |
| **Investigations** (`09`) | provides `opCS` stack (§4.1); faction unique methods (Shock&Awe etc.) | investigation outcomes → standing deltas, `perceivedPlayerFaction` flips |
| **Event/Emergence Engine** (`02`) | `Dynamic_Events_Possible` (§2.2), `World_State_Tracking_System` | seeds political events; war/treaty changes write matrix `level` |
| **Combat** (`10`, `combatFactionWiring.ts`) | LocalFaction standing → enemy side assignment; bounty hunter spawns (`BOUNTY_THRESHOLDS`) | `Public_Perception` event from combat → standing deltas (§3.9); territory `applyCombatOutcome` |
| **Territory** (`territorySystem.ts`) | combat outcome, militia | sector control %, flips, weekly income/intel/fame bonuses |
| **Travel** (`05`, `Travel_Time_System`) | `getTravelTimeModifier`, complications (§3.10) | — |
| **Economy / prices** | `getPriceModifier`/`getSellPriceModifier`, faction discounts (Arsenal of Democracy −20%) | — |
| **Recruitment** (`08`) | `getRecruitmentModifier` (matrix), city-type recruit pool, culture | — |
| **Phone alliances** (Bible §7.5 / GDD 487) | "call Pakistan to ally" → bumps matrix `level` +1..+2 | matrix write |
| **Reputation/Fame** (`reputationSystem.ts`) | 4-axis fame as a global modifier on standing deltas | — |
| **Multiplayer stub** (`107`) | PlayerFaction = the natural per-player identity; relations matrix = the natural PvP diplomacy layer | (design-only; do not build) |

### 7.4 LocalFaction standing → CombatFaction hostility (the link, §1.1 `RULING-NAME`)

```
police standing  ≤ −50 → spawn Local Police / National Police as enemy CombatFaction (factionSystem swat_alert already fires at −50)
military standing ≤ −60 → Military CombatFaction can intervene
underworld standing ≤ −50 → Mercenary / Super-Criminal hostiles (criminal retaliation email already fires)
ANY standing ≤ −25 → bounty active → Jackal / Mercenary bounty hunters (BOUNTY_THRESHOLDS hunterCount/threatLevel)
```
SOURCE: `factionSystem.ts modifyStanding` already emits `swat_alert` (police, −50), `faction_retaliation` (underworld), `bounty_posted` (−25/−50). This codifies which CombatFaction those map to.

---

## 8. RULING: notes (collected)

- **RULING-NAME** — Keep PlayerFaction (4) / LocalFaction (6/country) / CombatFaction (8) as **three linked enums**, never merged. §1.1.
- **RULING-HOME-COUNTRY-CODES** — Convert `Faction_Specification` country *names* to `allCountries` codes; "Pakistan (partial)" → CN half-territory (+1CS). §3.1.
- **RULING-FACTION-REL-SOURCE** — On conflict, `Faction_Relationships_Complete.csv` (richer) beats `Faction_Specification.csv` for the 4-faction relations. §3.2.
- **RULING-MATRIX-NORMALIZE** — Decode raw 1..6 → −5..+5 using only the 6 source bands; the 11-band schema.md table is a future authoring target, not data. §3.3.
- **RULING-MATRIX-INTEGRITY** — Unresolvable cells → neutral(0)+log; apply schema.md "2024 baseline" forced overrides on top. §3.3.
- **RULING (IP band)** — India–Pakistan "−3" snaps to existing band −4 (hostile). §3.3.
- **RULING-PERCEIVED-FACTION** — Matrix penalty only applies once a LocalFaction has *seen* your PlayerFaction; detection roll vs `IntelligenceBudget` flips it. Makes the −3 China/US wall a stealth puzzle. §3.4.
- **RULING-TERRITORY-MERGE** — Faction-specific territory ±CS (`Country_Attribute_Effects`) beats generic (`Faction_Specification`). §3.6.
- **RULING-PLAYERFACTION-SEED** — Home LocalFactions seed to faction `Starting_Reputation` (max with baseline). §3.7/§4.3.
- **RULING-OVERALL-REP** — Weight government/military×2 for legal border, underworld×2 for smuggling. §3.8.
- **RULING-DELTA-SCALING** — `Public_Perception` deltas apply 1:1 to standing; `Public_Impact_Scale` sets blast radius via matrix. §3.9.
- **RULING-NO-PURPLE** — Recolor the `Terrorist` band away from `#a855f7` (global no-purple rule). §6.1.
- **RULING (heat)** — `heat` is a fast-decaying (−10/day) short-term meter separate from standing; scales weekly encounter chance. §5.4.
- **RULING (flip cooldown)** — 48-game-hour cooldown before a sector can flip again (anti-thrash). §5.6.
- **RULING (no-deadlock entry)** — Never strand the player: covert/smuggling/ally-bridge entry always exists; "wanted everywhere" → forced combat instead of hard block. §5.5.
- **RULING (militia defection)** — Loyalty 0 → defect to contester / disband. §5.10.

## 9. OWNER-FORK: notes

- **OWNER-FORK-IP** — Add a dedicated −3 "tense-plus" matrix band for India–Pakistan-type cases, or accept the −4 snap? (Affects exactly how punishing those border ops are.)
- **OWNER-FORK-BORDER-WEIGHT** — Use the new weighted `legalRep`/`smugglingRep` for border crossing, or keep the existing flat 6-faction average in `getCountryReputation`?
- **OWNER-FORK-START-CONTROL** — Exact starting `controlPercent` per PlayerFaction home sector (proposed: US/CN 75%, IN/NG 50%).
- **OWNER-FORK-WINCON-MATH** — Exact denominators/definitions for each faction's win-condition tracker (e.g. how "global LSW population" is summed from `LSWActivity`).
- **OWNER-FORK-WINCON-FALLBACK** — Alternative victory paths when rivals lock the primary one.
- **OWNER-FORK-DECAY** — Should standing decay be disabled entirely for the player's HOME factions (loyalty shouldn't erode at home)?
- **OWNER-FORK-PARTIAL-PK** — Confirm "Pakistan (partial)" handling for China, given Pakistan is also India-adjacent (border-tension faction).
- **OWNER-FORK-CONTESTED-SCALE** — How aggressive should AI PlayerFactions be at contesting the player's territory (frequency of contesting events)?

## 10. Open Questions

1. **Matrix authoring debt.** The 168×168 source is partly corrupted (§3.3). Does the owner want a one-time data-cleaning pass to author real bilateral values (schema.md "Next Steps #2"), or ship neutral-default + the ~5 forced conflicts and let the Event Engine grow the web dynamically?
2. **PlayerFaction switching.** Can the player ever change faction mid-campaign (defection — `Faction_Relationships_Complete.csv` has a `Faction_Betrayal` row, −Varies, "faction dissolution possible")? Or is faction locked at start?
3. **AI PlayerFaction depth.** How much should the 3 rival PlayerFactions *act* (seize territory, sign treaties, spawn LSWs) vs. be flavor? The win-conditions imply they compete — confirm scope for v1 vs. deferred.
4. **Ambient world factions (30+).** `Faction_Relationships_Complete.csv` rows 8-33 define NATO/EU/ASEAN/criminal/alien/corporate/academic/etc. with player benefits/penalties. Are these v1 standings the player tracks, or content hooks for the Event Engine only? (This spec treats the 6 LocalFactions as the tracked set and the 30+ as event/encounter modifiers.)
5. **Registration mechanic.** US win condition and Bible §8 "LSW affairs" both reference LSW *registration*. Is registration its own subsystem (a verb the player performs per-LSW per-country) or an abstract territory-control percentage? Affects §6.4 tracker math.
6. **Phone-alliance magnitude.** GDD line 487 ("call Pakistan to ally") — how big a matrix swing should a single phone alliance buy, and what does it cost (favor, money, a mission)? Proposed +1..+2 level; confirm.
