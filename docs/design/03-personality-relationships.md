# 03 — Personality & Relationship Engine

> **System:** Personality & Relationship Engine (20 types · like/hate · decisions · idle · AI target selection)
> **Status:** BUILD-READY SPEC
> **Spine consumed:** country relationship codes, country STATs (Corruption, MediaFreedom, Lifestyle, LSWActivity), city Crime Index + City Type, faction standings, STAM ratings.
> **Bible anchors:** §2.4 (Personality & Emotions → AI target choice + idle), §5.10 (Personality-driven AI), §9.3 (Character roster: who loves/hates whom, emojis), §13 ruling #8 (no XP leveling — train with erosion), §13 ruling #9 (combined-effects must be consumed).
>
> **Source tables (read these to re-balance — never hardcode the numbers in code):**
> - `SuperHero Tactics/Combat Compendium REAL - 🎯PERSONALITY TARGET SELECTION🎯.csv` — the 20→target-preference map (**authoritative**).
> - `SuperHero Tactics/Personality, Emotions, Age.mht` — the 16-temperament names, the MBTI↔temperament map, and the **like/hate compatibility matrix** (1–5 ratings).
> - `docs/csv-source-data/Character_Archetypes.csv` — 20 sample archetypes + Personality_Traits strings + Combat_Role taxonomy.
> - `docs/csv-source-data/Complete_Character_Sheet.csv` — relationship/STAM fields (rows 37–47): `TEAM_REL`, `PERSONALITY (1-10)`, `MOTIVATION (1-10)`, `HARM_POTENTIAL (1-10)`.
> - `SuperHero Tactics/countryrelationships.csv` — 168×168 country relation codes (1–6).
> - `docs/csv-source-data/Daily_Activity_Framework.csv` — 30 idle activities (ACT_001…ACT_030).
> - `docs/csv-source-data/Public_Perception.csv` — fame/reputation deltas that decisions read/write.
> - `docs/csv-source-data/Game_Mechanics_Spec/Universal_Table_FIXED.csv` + `Stat_Rank_Mapping.csv` — the resolution table and the FASERIP rank ladder all checks resolve against.

---

## 1. Overview & Player Fantasy

The Personality & Relationship Engine is the **second emergence pillar** of SHT (the first is the country/city STAT spine). It is what turns mercs and LSWs from stat-blocks into **people the player grieves over** (FIST GDD line 177–178: "Players must care when the character dies"). It does four jobs:

1. **AI target selection (combat).** Each character carries one of **20 personality types**. In combat, an AI unit (enemy or AI-controlled ally) picks its target according to its type's preference — a bully focuses the weakest enemy, a pragmatist focuses the biggest threat. (Bible §5.10; source: `PERSONALITY TARGET SELECTION`.)
2. **Like/hate relationships.** Every pair of roster characters has a relationship score derived from their two personality types (compatibility matrix) plus shared history. This drives squad morale, FITR ("Fall In The Rotation" / friction) events, and the "who loves/hates whom (emojis)" roster screen (Bible §9.3; FIST GDD lines 529–542).
3. **Decisions (world layer).** Off-mission, personality biases which **idle activity** a character drifts toward when left on `Ready`, how they react to political events, and whether they develop secret-life problems (addiction, leaving). (FIST GDD lines 221–239; `Daily_Activity_Framework`.)
4. **Idle behavior / "the world that talks to you."** Idle characters generate **flavor pings** to the phone (texting concerns, becoming familiar with the city, hiding an addiction, aging) — the personality is the voice. (Bible §2.4 / §5.10 final sentence; FIST GDD lines 221–225.)

The player fantasy: *"I run a team of difficult, distinct individuals. Their quirks help and hurt me. Combat behaves the way their character would. When two of them hate each other I feel it; when one dies I feel it more."*

**Non-goals (scope guards):** This engine does NOT do dialogue trees, does NOT replace the events engine (it *parameterizes* it), and does NOT model country-vs-country diplomacy beyond reading the relation codes (that's the Geopolitical spine's job — this system only *reads* it for travel/friction). Multiplayer (the time-traveler's other dimension) only ever *reads* personality/relationship state; design accordingly (Bible: MP is an architectural stub).

---

## 2. Data Schema (fields / types)

### 2.1 `PersonalityType` (static reference data — 20 rows)

Loaded once from the two source CSVs at boot. Immutable at runtime.

```ts
type TargetPreference = 'MOST_HEALTH' | 'LEAST_HEALTH' | 'MAJOR_THREAT' | 'MINOR_THREAT' | 'RANDOM';

interface PersonalityType {
  id: number;                 // 1..20  (column index in PERSONALITY TARGET SELECTION)
  temperamentName: string;    // e.g. "Inspector", "Mastermind"  (from Personality,Emotions,Age)
  mbti: string;               // e.g. "ISFJ"  (RULING: derived mapping, see §3.2)
  targetPreference: TargetPreference;  // from PERSONALITY TARGET SELECTION row
  // Decision/idle biases (RULING values, §3.5 — all default-overridable from a data table):
  aggression: number;         // 0..1
  sociability: number;        // 0..1
  discipline: number;         // 0..1  (drives Train vs drift, addiction resistance)
  riskTolerance: number;      // 0..1
  loyalty: number;            // 0..1  (relationship decay resistance, defection)
  idleActivityWeights: Record<string, number>; // ACT_001..ACT_030 → weight
}
```

### 2.2 `Character` additive fields (on the existing character record)

```ts
interface CharacterPersonalityState {
  personalityTypeId: number;     // 1..20  (FK → PersonalityType)
  // STAM evaluation block — Complete_Character_Sheet rows 45-47:
  personalityRating: number;     // 1..10  volatility / emotional stability
  motivationRating: number;      // 1..10  moral compass / intentions
  harmPotentialRating: number;   // 1..10  capacity for harm (official assessment)
  // Secret-life / mood state (FIST GDD 221-225):
  morale: number;                // 0..100 (start 60)
  stress: number;                // 0..100 (start 0)
  secretFlags: SecretFlag[];     // e.g. {kind:'ADDICTION', severity:1..3, hidden:bool}
  currentActivityId: string | null; // ACT_0xx or null when on a mission
}

type SecretFlag = { kind: 'ADDICTION'|'DOUBTING'|'BURNOUT'|'IDENTITY_RISK'; severity: 1|2|3; hidden: boolean; };
```

### 2.3 `Relationship` (per ordered/unordered pair of roster characters)

```ts
interface Relationship {
  a: CharacterId;
  b: CharacterId;
  score: number;       // -100..+100  (see §3.3). 0 = neutral.
  band: 'NEMESIS'|'DISLIKE'|'NEUTRAL'|'FRIEND'|'BONDED'; // derived (§3.3)
  history: RelationshipEvent[]; // append-only log driving drift
}
type RelationshipEvent = { tick: number; delta: number; cause: string }; // cause e.g. "SAVED_IN_COMBAT"
```

### 2.4 `CountryRelation` (read-only spine view, from `countryrelationships.csv`)

```ts
// 168×168 matrix. Code legend (RULING §3.6 — confirm with owner):
//   1 = WAR/hostile, 2 = TENSE, 3 = NEUTRAL (the modal value), 4 = FRIENDLY, 5 = ALLIED, 6 = SPECIAL/embargo-or-bloc
type CountryRelationCode = 1|2|3|4|5|6;
function countryRelation(isoA: string, isoB: string): CountryRelationCode;
```

---

## 3. Exact Numbers, Tables & Formulas (each cited)

### 3.1 The 20 → Target Preference map — **AUTHORITATIVE, do not invent**

From `Combat Compendium REAL - 🎯PERSONALITY TARGET SELECTION🎯.csv`. Encoding in that file: `1=Most Health`, `2=Least Health`, `3=Major Threat (NME with most damage dealt)`, `4=Minor Threat (NME with least damage dealt)`, `5=Random`. The data row gives the preference code per personality id 1..20:

| Type ID | Pref code | TargetPreference | "Character-consistent" read |
|--------:|:---------:|------------------|-----------------------------|
| 1  | 1 | MOST_HEALTH  | brawler — picks the toughest standing foe |
| 2  | 3 | MAJOR_THREAT | pragmatist — kills the biggest damage dealer |
| 3  | 4 | MINOR_THREAT | finisher — mops up the weak hitter |
| 4  | 4 | MINOR_THREAT | finisher |
| 5  | 1 | MOST_HEALTH  | brawler |
| 6  | 3 | MAJOR_THREAT | pragmatist |
| 7  | 4 | MINOR_THREAT | finisher |
| 8  | 1 | MOST_HEALTH  | brawler |
| 9  | 2 | LEAST_HEALTH | bully — focuses the weakest (lowest HP) |
| 10 | 2 | LEAST_HEALTH | bully |
| 11 | 1 | MOST_HEALTH  | brawler |
| 12 | 4 | MINOR_THREAT | finisher |
| 13 | 2 | LEAST_HEALTH | bully |
| 14 | 3 | MAJOR_THREAT | pragmatist |
| 15 | 3 | MAJOR_THREAT | pragmatist |
| 16 | 3 | MAJOR_THREAT | pragmatist |
| 17 | 2 | LEAST_HEALTH | bully |
| 18 | 5 | RANDOM       | chaotic |
| 19 | 5 | RANDOM       | chaotic |
| 20 | 2 | LEAST_HEALTH | bully |

> **Code rule:** load this row verbatim into `PersonalityType.targetPreference`. It is the single source of truth for combat AI target selection. If the CSV row changes, behavior changes with zero code edit (Bible Pillar #1).

**Target resolution algorithm (combat):** on an AI unit's turn, after movement, among **valid targets** (in range of a usable BAMPI attack-shape + has LoS per the combat layer):
```
candidates = visibleEnemies.filter(canAttack)
if candidates.isEmpty: fall through to "advance toward nearest enemy" (combat layer default)
switch preference:
  MOST_HEALTH  -> argmax(currentHP)
  LEAST_HEALTH -> argmin(currentHP)
  MAJOR_THREAT -> argmax(damageDealtThisCombat)   // tracked per combatant, init 0
  MINOR_THREAT -> argmin(damageDealtThisCombat)
  RANDOM       -> uniform pick
tie-break order: (1) lowest "incidental cost" target — fewest blocking allies in line / no friendly splash;
                 (2) closest by grid distance; (3) stable lowest unitId.   // RULING §3.5
```
`damageDealtThisCombat` is reset at combat start to 0 for every combatant; for MAJOR/MINOR_THREAT on turn 1 (all zeros) the tie-break chain decides — effectively "closest" on turn 1. (RULING — the source table gives the preference but not turn-1 tie behavior.)

### 3.2 The 20 temperaments & the MBTI map

`Personality, Emotions, Age.mht` lists 16 Keirsey temperament names with their MBTI codes; SHT extends to **20 slots** (the target-selection table has 20). Confirmed name↔MBTI pairs from the source:

| Temperament | MBTI |
|---|---|
| Inspector | ISFJ |
| Protector | ISTJ |
| Counselor | INFJ |
| Mastermind | INTJ |
| Crafter | ISTP |
| Artist | ISFP |
| Idealist | INFP |
| Architect | INTP |
| Promoter | ESTP |
| Performer | ESFP |
| Champion | ENFP |
| Inventor | ENTP |
| Supervisor | ESTJ |
| Provider | ESFJ |
| Giver | ENFJ |
| Executive | ENTJ |

> **RULING (§3.2):** The source defines 16 named temperaments but the target-selection table has 20 slots. **Ship 16 named temperaments mapped to the first 16 ids, and define ids 17–20 as the four "extreme" archetypes the GDD/Public-Perception care about** — `Zealot` (17), `Berserker` (18), `Trickster` (19), `Stoic` (20) — chosen so ids 18/19 = RANDOM (chaotic) and ids 17/20 = LEAST_HEALTH (predatory) match the authoritative preference row in §3.1. (The CSV row decides behavior; these are only display labels for the 4 unnamed slots.) See OWNER-FORK #1 if the owner wants different labels.

### 3.3 Like/hate compatibility matrix → base relationship score

`Personality, Emotions, Age.mht` contains a **temperament-pair compatibility chart** with cell values **1–5** (Socionics "understanding" levels: `1 = No Understanding/Conflict`, `2 = Mutual Misunderstanding`, `3 = Possible`, `4 = Similar`, `5 = Mutual Understanding/Duality`). The diagonal and near-diagonal cells in the source read 5/5 (same/adjacent temperament = strong rapport). Decoded sample rows (read the file for the full triangle — it is symmetric):

```
            Insp Prot Coun Mast Craf Arti Idea Arch Prom Perf Cham Inve Supe Prov Give Exec
Inspector     5    5    3    4    4    3    2    3    3    2    1    2    4    2    3    2
Counselor     4    4    5    5    .    .    .    .    .    .    .    .    .    .    .    2
Mastermind    3    3    5    5    .    .    .    .    .    .    .    .    .    .    .    .
Provider      2    3    .    .    .    .    .    .    .    .    .    .    4    5    5    4
Giver         3    4    3    2    1    2    3    2    2    3    2    3    3    4    5    5
Executive     2    3    2    4    2    1    2    3    3    2    3    4    4    3    5    5
```
**Mapping 1–5 compatibility → starting relationship score (RULING §3.3, linear, owner-tunable):**
```
baseScore(a,b) = (compat(typeA, typeB) - 3) * 20      // → {1:-40, 2:-20, 3:0, 4:+20, 5:+40}
```
This yields a starting `score ∈ [-40,+40]`, leaving headroom for history to push to ±100.

**Band thresholds (derived):** `score ≤ -60 NEMESIS | -59..-20 DISLIKE | -19..+19 NEUTRAL | +20..+59 FRIEND | ≥+60 BONDED`. (RULING — even split of the −100..+100 range.)

**History drift (per `RelationshipEvent`, RULING §3.3 — owner-tunable table):**
| Cause | delta | source/justification |
|---|---:|---|
| `SAVED_IN_COMBAT` (a healed/shielded/rescued b) | +8 | combat layer emits |
| `KILLED_NEAR_ALLY` (a's reckless splash hit b) | −10 | mirrors Public_Perception "Civilian_Casualties" disapproval logic |
| `SHARED_VICTORY` (both survived a won mission) | +3 | Daily_Activity "Relationship building" |
| `SHARED_DEFEAT` | −2 | |
| `IDLE_TOGETHER_SAME_CITY` (per day) | +1 (cap from idle to +20) | FIST "becoming familiar"; ACT_022 Family/ACT_028 Social |
| `TEAMMATE_DEATH_WITNESSED` | −5 stress→ −0 rel but +15 stress | Public_Perception `Team_Member_Death` −15 faction rep |
| `RIVAL_PROMOTED / OUTSHONE` (fame gap event) | −4 | low-loyalty types only (loyalty<0.4) |

Each tick, `score` decays toward `baseScore` by `1 point/day * (1 - loyalty)` (high loyalty = relationships are "sticky"). Clamp to [-100,+100].

### 3.4 STAM ratings (volatility / intent / harm) — `Complete_Character_Sheet` rows 45–47

Three 1–10 ratings already specified in the character sheet:
- `PERSONALITY (1-10)` — *volatility & emotional stability.* "Affects power control and decision making under stress."
- `MOTIVATION (1-10)` — *moral compass & intentions.* "Affects tactical choices and collateral damage decisions."
- `HARM_POTENTIAL (1-10)` — *capacity for causing damage.*

**Consumption formulas (RULING §3.4, all owner-tunable; the sheet says *what* they affect, not the magnitude):**
```
// Power-control / "loss of control under stress" check (resolves on Universal_Table_FIXED):
//   column = rank(personalityRating*10) ; if stress > 60, shift the result one step worse.
loseControlChance = clamp01( (stress/100) * (1 - personalityRating/10) )   // gate: roll < this → berserk/charm vuln

// Collateral-damage willingness (does the AI/ally avoid friendly splash?):
collateralCare = motivationRating / 10        // 1.0 = never risks allies/civilians, 0.1 = doesn't care
// Used as a multiplier on the "incidental cost" tie-break weight in §3.1.

// Recruitment price & villain attention (Bible §2.4 STAM = recruitment pricing):
threatPriceMult = 1 + (harmPotentialRating/10)*0.5    // +0..50% asking price for high-harm assets
```
> **RULING:** these magnitudes are not in any table — flagged as RULING and kept in a single tunable `stam_tuning` data row so balance lives in data (Bible Pillar #1).

### 3.5 Decision (idle activity selection) — `Daily_Activity_Framework`

When a character sits on `Ready` for a full day-tick with no player order, pick an idle activity by weighted draw over the 30 `ACT_0xx` activities. The weight blends **(a) personality bias**, **(b) the spine** (country/city stats gate which activities are even available/attractive — the table's `Country_Benefits` column), and **(c)** current state:

```
weight(act) =
    personality.idleActivityWeights[act]                 // §3.5 default table below
  * spineMultiplier(act, country, city)                  // §4
  * stateMultiplier(act, character)                      // injured→Medical, high stress→Personal/OffGrid
```
**Default personality→activity bias (RULING §3.5 — a small, legible table; owner-tunable):**
| Personality trait high | Pulls toward |
|---|---|
| `discipline` | ACT_002 Training, ACT_026 Combat Training, ACT_024 Facility Mgmt |
| `sociability` | ACT_021 Media Relations, ACT_028 Social Networking, ACT_022 Family Time |
| `aggression` | ACT_004 Patrol, ACT_007 Covert Ops, ACT_009 Military Service |
| `riskTolerance` | ACT_014 Criminal Activity, ACT_010 Off the Grid, ACT_007 Covert Ops |
| low `discipline` + high `stress` | secret-life roll (§3.7 addiction) |

> **No XP leveling (Bible ruling #8):** Training (ACT_002/026/015) is how stats grow, and **stats erode if not trained** — disciplined personalities self-train when idle and therefore decay slower; undisciplined ones drift to Patrol/Personal and **erode** (this is the personality system's hook into the erosion rule).

### 3.6 Country-relationship codes → friction & travel (spine read)

`countryrelationships.csv` is a 168×168 matrix of codes 1–6 (modal value is `3`; `1`/`2` cluster between historic rivals, `4`/`5` between blocs/allies). The engine **reads** it for two things:
- **Cross-border friction:** if two squadmates hold nationalities `nA, nB` and `countryRelation(nA,nB) ≤ 2`, apply a standing `−10` to their relationship `baseScore` floor (RULING §3.6) — nationals of warring states distrust each other.
- **Travel/deployment gating** is the Travel system's job, not this one — we only surface the code on the roster's "country relationships / who's near war" screen (Bible §9.3; FIST GDD 530).

> **RULING (§3.6 — legend):** the file ships only integers with no legend row. Decoded by frequency + matching against the World-Bible `Allies`/`Enemies` columns in `Here are the allies and enemies col.csv` (e.g. Austria↔Norway listed as allies read `4–5`; Austria↔enemy entries read `1–2`). **Codes: 1=war, 2=tense, 3=neutral, 4=friendly, 5=allied, 6=special bloc/embargo.** OWNER-FORK #4 if the original legend differs.

### 3.7 Secret-life / idle pings (FIST GDD 221–225) and decisions on political events

- **Addiction roll** (only when idle, low discipline, high stress): each idle day, `P(developAddiction) = clamp01( (stress/100) * (1 - discipline) * 0.05 )`. On hit → add `SecretFlag{ADDICTION, severity 1, hidden:true}`. Severity escalates +1 per 14 idle days untreated; affects nothing mechanically until `severity ≥ 2`, then `−1CS to all Universal-Table checks` until treated at Hospital (ACT_005). (RULING §3.7 — the GDD names "hiding an addiction" but no numbers exist; kept tiny and tunable.)
- **Political-event reactions:** `Dynamic_Political_Events` rows fire from the spine; this engine supplies the **character's stance** for any event that lists `Player_Choices`. A high-`motivationRating` + high-`loyalty` character endorses the "cooperative/diplomatic" choice; high-`aggression` + low-`motivation` endorses "escalate/force." This is surfaced as advisor text on the phone, NOT an auto-decision (player still chooses). (RULING §3.7.)
- **Idle phone pings:** every idle character emits a flavor message to the phone feed at a personality-flavored cadence (`sociability` high → more texts). Content templates are authored, selected by `{personalityType, city.cityType, secretFlags}` — exactly the HYBRID events pattern (Bible: authored templates parameterized by stat+personality combos).

---

## 4. How It Consumes the SPINE (which stats drive it, with the formula)

The engine is a **consumer**, satisfying Bible ruling #9 ("combined-effects must be CONSUMED"). Concretely:

| Spine input | Source column | Drives | Formula |
|---|---|---|---|
| **Country relation code** | `countryrelationships.csv` | squadmate friction | `rel(nA,nB) ≤ 2 → baseScore floor −10` (§3.6) |
| **Country `GovermentCorruption`** | World Bible Country | idle `ACT_014 Criminal` availability/attraction | `spineMult(ACT_014) = 0.5 + corruption/100` (high-corruption country makes crime idle attractive — matches Daily_Activity "High crime countries provide more opportunities") |
| **Country `Lifestyle`** | World Bible Country | idle `ACT_001 Personal Life` / `ACT_022 Family` benefit | `spineMult(personal) = 0.5 + lifestyle/100` (table: "Better lifestyle countries provide more benefits") |
| **Country `MediaFreedom`** | World Bible Country | idle `ACT_021 Media Relations` | `spineMult(media) = mediaFreedom/100` (table: "Press freedom affects media cooperation") |
| **Country `LSWActivity` / `LSWRegulations`** | World Bible Country | secret-identity / `IDENTITY_RISK` flag pressure | high LSW regulation + exposed identity raises stress +2/day |
| **City Crime Index** | World Bible Cities | idle `ACT_004 Patrol` yield & encounter chance | `spineMult(patrol) = 0.5 + crimeIndex/maxCrime` (table: "High crime cities provide more opportunities") |
| **City Type** (Temple/Military/Political/…10 types) | World Bible Cities | which idle activities fit (Military city → ACT_009/026; Educational → ACT_003/012; Industrial → ACT_006/018) | `cityTypeBias[cityType][act] ∈ {0.5,1,1.5}` lookup table |
| **Faction standing** | `Faction_Relationships_Complete` | relationship floor between cross-faction members; defection check (low loyalty) | cross-faction pair with hostile factions → `baseScore −15` |
| **STAM ratings** | `Complete_Character_Sheet` 45–47 | power-control, collateral care, recruit price | §3.4 |

All resolution checks (control loss, addiction CS penalty, advisor endorsements that roll) go through **`Universal_Table_FIXED`** using the FASERIP rank ladder in `Stat_Rank_Mapping` (rank of a 1–10 rating = rating×10 mapped to a column). The engine never invents a dice mechanic — it reuses the one resolution table (Bible ruling #1).

---

## 5. Edge Cases & Failure Modes

1. **No valid combat target** for a preference (e.g. MOST_HEALTH but all enemies dead/out-of-range): fall through to combat-layer default ("advance to nearest enemy / overwatch"). Never throw.
2. **Turn-1 MAJOR/MINOR_THREAT** (all `damageDealtThisCombat == 0`): tie-break chain → effectively "closest." Documented, deterministic.
3. **RANDOM with seeded RNG:** RANDOM target picks MUST use the combat RNG stream (seedable) so the diegetic time-rewind save (Bible) reproduces identical combat on replay. Do not call `Math.random()`.
4. **Self/ally targeting:** preference operates only over the **enemy** candidate set; an AI ally never targets its own side even if "least health" would point at a wounded friend. Guard explicitly.
5. **Personality id 17–20 with no source name:** display fallback labels (§3.2 RULING); behavior still comes from the authoritative preference row, so a missing label never affects combat.
6. **Compatibility matrix is sparse** (the source triangle has blanks): treat any missing cell as `3` (neutral, baseScore 0) and log a data-warning so the content team can fill it. Never crash on a blank.
7. **Relationship score clamp:** always clamp to [-100,+100] after every delta + after decay, in that order.
8. **Dead character relationships:** a dead-but-not-funeral'd character (Bible §9.3 — stays on roster until funeral) keeps relationships frozen (no decay, no idle drift); witnessing their death already applied the stress hit once (guard against double-apply via the `history` log).
9. **Addiction double-treatment / negative severity:** Hospital treatment sets severity to 0 and clears the flag if 0; never let severity go below 0 or above 3.
10. **Idle weight all-zero** (every activity gated out by spine/state): fall back to `ACT_001 Personal Life` (always available) so a character is never stuck with no action.
11. **Missing nationality / unmapped ISO** in `countryRelation`: default code `3` (neutral), log warning. The 168-list and the matrix must stay ISO-linked to `allCountries` (Bible ruling #10 — unify datasets).
12. **MP read-safety:** all relationship/personality mutation goes through a single reducer so the future MP "other dimension" can subscribe read-only without racing writes.

---

## 6. UI/UX Hooks (how it surfaces)

- **Phone (real-time-with-pause feed):** idle pings ("`Iron Fist is becoming familiar with Lagos.`", "`Speed Demon texts: 'this downtime is killing me.'`"), addiction hints (vague while `hidden`), political-event advisor lines. Cadence scales with `sociability`. Tapping a ping opens the character.
- **Roster / Character Management screen (laptop layer, Bible §9.3):** the "**who loves/hates whom**" grid rendered **with emojis** (FIST GDD 542) — map `band` → emoji: `NEMESIS 💢 · DISLIKE 😒 · NEUTRAL 😐 · FRIEND 🙂 · BONDED ❤️`. Hover shows score + last 3 `history` causes. Same screen shows the **country relationships / who's-near-war** view straight from `countryrelationships.csv`. Personnel/status emojis per the FIST GDD personnel list.
- **Character sheet:** shows temperament name + MBTI, the three STAM bars (Volatility/Motivation/Harm), current `morale`/`stress`, current activity, and any *revealed* secret flags.
- **Combat overlay (symbolic grid):** on an enemy's turn, a 1-line "intent" toast keyed to preference ("`Bully — seeks the weakest.`") and a target reticle glyph on the chosen unit before the attack resolves — teaches the player to read enemy personality. No 3D; pure glyph/altitude-integer presentation per the symbolic-combat ruling.
- **World map:** idle characters show a small status glyph (Ready/Patrol/Train/Hospital/Off-grid) on their city; FITR friction between two deployed squadmates shows a small ⚡ between their tokens.
- **Recruitment screen:** asking price reflects `threatPriceMult` (§3.4); a personality blurb + emoji are shown so the player picks for fit, not just stats (JA2 merc-hire feel; FIST GDD "Gangsters for hire" reference).

---

## 7. Integration Points (reads / writes)

**Reads:** `PERSONALITY TARGET SELECTION` (preference), `Personality,Emotions,Age` (names/matrix), `Complete_Character_Sheet` (STAM), `countryrelationships.csv` + World-Bible Country/Cities (spine), `Faction_Relationships_Complete` (faction standing), `Daily_Activity_Framework` (idle menu), `Universal_Table_FIXED`/`Stat_Rank_Mapping` (resolution).

**Writes / emits:**
- → **Combat layer:** the chosen target id + the "intent" toast each AI turn. (Combat resolves the actual attack via BAMPI/Power-Activation engine; this system only *chooses*.)
- → **Events/Email engine:** personality+city+secretFlag tuple used to select authored templates (the HYBRID engine). Relationship `NEMESIS`/`BONDED` pairs unlock FITR/bonding event templates.
- → **Economy/Recruitment:** `threatPriceMult` into asking price.
- → **Public Perception / Fame:** reckless (`low motivationRating`) characters more likely to cause `Property_Damage`/`Civilian_Casualties` events → fame loss (`Public_Perception` deltas). Conversely BONDED squads get a small combat coordination bonus (RULING: `+1CS to assist actions when ≥2 BONDED members in squad`).
- → **Hospital/Activity system:** writes `currentActivityId`, consumes Medical treatment to clear addiction/stress.
- → **Time system:** subscribes to the day-tick for idle resolution, decay, erosion, addiction rolls.

**Order of operations each day-tick:** (1) resolve idle activity outcomes → (2) apply relationship history deltas & decay → (3) apply stat erosion for un-trained → (4) addiction/secret rolls → (5) emit phone pings. Combat target selection runs independently on each AI unit's combat turn.

---

## 8. RULING: notes (decisions the data did not settle)

- **R1 (§3.2):** 16 named temperaments + 4 extended labels (Zealot/Berserker/Trickster/Stoic) for ids 17–20; labels are display-only, behavior comes from the authoritative preference row.
- **R2 (§3.3):** compatibility 1–5 → relationship `baseScore (compat−3)*20`; band thresholds even-split of ±100; history delta table values.
- **R3 (§3.1):** turn-1 / no-target tie-break order (incidental-cost → closest → unitId); RANDOM uses the seeded combat RNG.
- **R4 (§3.4):** STAM consumption magnitudes (control loss, collateral care, +0–50% recruit price) — not in any table; isolated in a `stam_tuning` data row.
- **R5 (§3.5):** personality→idle-activity bias table and the erosion linkage (disciplined self-trains).
- **R6 (§3.6):** `countryrelationships.csv` legend (1=war … 6=special) reverse-engineered from the Allies/Enemies columns; cross-national friction `−10`.
- **R7 (§3.7):** addiction probability/escalation/CS penalty; political-event stance mapping; idle-ping cadence.
- **R8 (§7):** BONDED squad `+1CS assist` coordination bonus.

All RULING magnitudes live in data tables, not code, so they are re-balanceable (Bible Pillar #1). None override a Bible ruling.

---

## 9. OWNER-FORK: notes (genuine product choices only the owner can make)

1. **Labels & count for the 4 extended personality slots (ids 17–20).** Source names only 16 temperaments but the authoritative combat table has 20. Do we (a) keep 20 with 4 owner-named extended types, (b) collapse to 16 and remap ids 17–20's preferences onto existing types, or (c) author 20 bespoke SHT temperament names divorced from MBTI? (Spec assumes (a).)
2. **Visibility of STAM/personality to the player.** Should `Volatility/Motivation/Harm` and the personality type be **fully visible at recruit time**, **partially hidden until played** (JA2-style "you learn the merc"), or **only inferable from behavior**? This changes recruitment UX and the "characters you grow to know" fantasy.
3. **Severity of relationship friction on gameplay.** How punishing should NEMESIS pairs be — purely flavor/morale, or hard mechanical penalties (refuse to deploy together, −CS, desertion)? Sets the floor between "spicy" and "frustrating."
4. **Canonical legend for `countryrelationships.csv` codes 1–6.** The file ships integers with no legend; §3.6 reverse-engineered one. Owner should confirm the intended meaning (esp. what `6` is — special bloc, embargo, or vassal?).
5. **Permadeath ↔ relationship payoff.** How hard should a BONDED-partner death hit the survivor (temporary −CS grief debuff? berserk risk? leave-the-team risk?)? This is the emotional core the GDD calls out (line 177) and is a tone decision.
6. **How directive idle decisions are.** Do idle characters **auto-take** activities (sim-like, surprises the player) or only **suggest** via the phone and wait for confirmation? Affects how "alive" vs how "controllable" the team feels.

---

## 10. Open Questions

- The compatibility matrix in the source is a partial triangle; the content team must fill the remaining cells (default `3`/neutral until then). Is there a fuller version in `SuperHero Tactics World Bible.xlsx` (Relations sheet) we should prefer over the `.mht`?
- Does `Faction_Relationships_Complete` already encode cross-faction member friction in a way we should read directly instead of deriving from faction standing?
- Should personality be **mutable** ("can change through experience and therapy" — `Complete_Character_Sheet` row 45 says yes for the 1–10 ratings; the *type* itself presumably stays fixed)? Spec treats `personalityTypeId` as fixed and the three ratings as slowly mutable.
- Do AI **allies** (player's own AI-resolved units in AI-vs-AI or auto-resolve) use the same target-preference table, or only enemies? (Spec: same table for both — it is character-consistent either way.)
```
