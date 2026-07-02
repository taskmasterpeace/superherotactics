# 26 — Wrestling / Grappling / Martial Arts

> **System:** A real grappling **state machine** (Standing Clinch → Mount/Back/Side/Half-Guard/Guard/Turtle), holds & submissions, throws, position transitions, escapes/reversals, 10 martial-art ±CS packages, super-strength scaling — all resolving on the symbolic 2D grid (combat is *one verb, not the point*; specced lighter than the spine).
> **Status:** Build-ready spec (v1.0)
> **Primary sources:**
> - `docs/csv-source-data/Game_Mechanics_Spec/Wrestling_Martial_Arts_Complete.csv` (12 sheets — the canonical state machine, holds, throws, transitions, MA bonuses, super-strength, ground strikes, escapes, reversals, AP costs)
> - `SuperHero Tactics/Combat Compendium REAL - 🐱_👤Skills, Talents, Martial Art.csv` ("Reflex / Roll-with-blow", "Escape Artist" talent)
> **Secondary sources (numbers cited inline):**
> - `Game_Mechanics_Spec/Universal_Table_FIXED.csv` (roll resolution — the one table per Bible §13 #1)
> - `Game_Mechanics_Spec/Stat_Rank_Mapping.csv` (stat→rank→column, threat tiers, lift capacity)
> - `Game_Mechanics_Spec/Combat_Modes_Stances.csv` (Grappling_Stance, MA+stance combos, "MODE INTERACTIONS WITH GRAPPLING / MARTIAL ARTS")
> - `Game_Mechanics_Spec/Injury_System.csv` (crit→injury d100 pipeline; Crushing_Damage −15, Called_Shot −30 modifiers; Broken Arm/Leg rows)
> - `Game_Mechanics_Spec/Combat_System_Master_Reference.csv` ("Grappling — Use MEL; contested by target MEL or STR", grappling = action at Step 2)
> - `SuperHero Tactics/Combat Compendium REAL - 🙊Knockbag🙉.csv` (MELEE KNOCK BACK CHART — used by throws)
> - `SuperHero Tactics/Combat Compendium REAL - 🦆DODGE CHART🦆.csv` (AGL+INS → −CS, used by escapes/reversals defensive math)
> - `SuperHero Tactics/Combat Compendium REAL - 🏋🏾_♀️STRENGTH AND WEIGHT💪🏾.csv` (STR rank → max lbs, used by Weight_Check)
> - `SuperHero Tactics/Combat Compendium REAL - 😢EFFECT_STATUS😴.csv` (Unconscious/Prone/Stunned/Immobile/Sleep definitions consumed by holds)
> - `SHT_MECHANICS_BIBLE.md` §3.3 (resolution), §5.1 (AP economy), §5.6 (crit/injury), §5.9 (wrestling overview), §5.10 (personality AI), §13 (rulings)
> - `SuperHero Tactics/FIST GDD v02.txt` line 261 (martial arts erode without training), line 1479 ("throw each other, punch each other")
> - Sibling specs: `21-tactical-combat-grid.md` (grid/CS hand-off, glyph conventions, RULING TC-1 altitude), `23-crit-injury.md`, `24-status-effects.md`, `25-strength-throwing.md` (canonical throwing formula), `03-personality-relationships.md` (authoritative 20→target map).
>
> **Scope (locked).** This doc owns the **grapple sub-loop**: entering/leaving the clinch, the 7 positions and their control levels, the 3-roll struggle, 11 hold types, 8 throw types, the transition matrix, ground strikes, escapes, reversals, the 10 martial-art ±CS packages, and super-strength grappling scale. It **consumes** but does **not own**: the Universal-Table roll (`20-core-resolution-4cs.md`), the crit→injury d100 pipeline (`23-crit-injury.md`), the status-effect catalog (`24-status-effects.md`), the knockback chart and throw *distance/damage* base (`25-strength-throwing.md` for environmental object throws; the MELEE KNOCK BACK CHART for body throws), and the grid/CS/altitude skeleton (`21-tactical-combat-grid.md`). Hand-off contracts to those are in §10.

---

## 1. Overview & player fantasy

You clinch up, you take the back, you sink the choke, you slam a man through a wall. Wrestling is the **one combat sub-system in the source data that is genuinely complete** (Bible §5.9: "one of the most complete systems in the data — lead with it as a differentiator"), so SHT ships it as a real **state machine**, not a single "grapple" attack.

The fantasy has three rungs, all on the same flat grid of glyphs:

1. **Human grappler.** A Wrestling/Judo/BJJ-trained merc with normal STR can out-position a stronger brawler — initiate the clinch, sweep to mount, sink an arm-bar, *break the arm* and end the fight without a gun. Skill (martial-art ±CS + position control) beats raw stats. This is the JA2 "your scrawny medic is secretly a black belt" texture.
2. **Super-strength monster.** STR 50+ unlocks the **Crushing Hold** (internal damage per turn); STR 70+ unlocks the **Superhuman Launch** that throws a man `STR/10` squares and damages buildings. At STR 90+ you auto-win grapples against any non-super. Grappling scales smoothly from MMA to "orbital throw."
3. **The personality read.** Because grappling is slow (it eats turns and pins you in melee range), *who* you grapple matters — and enemy AI grapples according to its **personality target preference** (a bully clinches the weakest; a pragmatist clinches your biggest damage dealer to neutralize it). Wrestling is where the personality engine becomes legible in combat.

**One-line pitch:** *A position-based grapple state machine where martial art ±CS and body position out-leverage raw stats — until raw stats get superhuman, at which point you throw the wrestler through a building.*

**Symbolic-combat note (Bible §5 / sibling 21).** No 3D, no ragdoll. A grappled pair renders as **two stacked glyphs in one square with a position label** (e.g. `▲MNT` over `▽`), an **AP-upkeep pip**, and a **hold/submission progress meter**. Aerial Grapple (both may fall) is a Z-axis edge case handled by altitude (RULING WG-9).

---

## 2. Canonical inputs, units & where grappling sits in the turn

### 2.1 Stats consumed (all from `Stat_Rank_Mapping.csv` / Bible §3.1)
| Stat | Role in grappling | Source |
|---|---|---|
| **STR** | Initiate/struggle attacker term; hold damage; throw damage; super-strength scale; Weight_Check | `Wrestling_…csv` Sheets 2/4/5/8 |
| **MEL** | Initiate/struggle both terms; to-hit for the grapple action itself | `Combat_System_Master_Reference.csv` "Grappling — Use MEL"; `Wrestling_…csv` Sheet 2 |
| **STA** | Defender struggle term; explosive escape; stand-up | `Wrestling_…csv` Sheets 2/3/10 |
| **AGL** | Transitions to Back/Sweep; technical/guard escapes; reversals | `Wrestling_…csv` Sheets 6/10/11 |
| **INS** | Technical Escape term | `Wrestling_…csv` Sheet 10 |

### 2.2 Units & action economy (from `Wrestling_…csv` Sheet 12 + Bible §5.1)
- Turn budget = **6 AP** (Bible §5.1; sibling 21 §2). Every grapple action below costs AP from that pool.
- 1 grid square = **2 m** (sibling 21). Throws move the target a number of **squares** read off the MELEE KNOCK BACK CHART or a throw's own `Knockback_Squares`.
- "Roll" = one **d100 vs `Universal_Table_FIXED`** lookup (sibling 20 / §3 below). Outcome band ∈ {Failed, Minor, Success, Major}.

### 2.3 Turn placement — grappling is an *alternative to a standard attack at Step 2*
`Wrestling_…csv` Sheet "INTEGRATION" row: *"Combat_System_Master_Reference.csv — Grappling is alternative to standard attack at Step 2."* In the master combat flow (`Combat_System_Master_Reference.csv` Step_2), the active unit declares **Power attack OR Weapon attack OR Skill use** — **grapple is a Skill-use declaration.** Once declared, resolution branches into this doc's sub-loop instead of the standard hit→damage chain.

> **RULING WG-0 (one resolver).** Every grapple roll uses **`Universal_Table_FIXED`** (the one table, Bible §13 #1). No grapple uses a bespoke d20/percentile mechanic. Where a source row says "Success/Major/Minor" as a *required band* (e.g. transition "Difficulty_Result = Major"), that means *the roll's outcome band must be ≥ that band* to succeed; otherwise the `Failure_Consequence` applies. (Defined precisely in §6.)

---

## 3. Core resolution (how a grapple roll is computed)

All grapple rolls follow the Bible §3.3 procedure. The grapple-specific column inputs:

### 3.1 Initiate / Defend (from Sheet 2 "CORE GRAPPLING MECHANICS")
| Action | Roll formula (→ stat value → column) | AP | Source |
|---|---|---|---|
| **Initiate_Grapple** | attacker `(STR + MEL) / 2` | 4 AP | Sheet 2; Sheet 12 |
| **Defend_Grapple** | defender `(STA + MEL) / 2` (free reaction) | 0 AP | Sheet 2; Sheet 12 |

Resolution: take attacker's `(STR+MEL)/2`, map to a rank/column via `Stat_Rank_Mapping.csv`, apply **net CS** (martial-art initiate CS from Sheet 7 + stance CS from `Combat_Modes_Stances.csv` + super-strength CS from Sheet 8 + status CS), then **subtract the defender's contested column** as a CS penalty. Roll d100 on the final column → band.

> **RULING WG-1 (contested → CS, consistent with the dodge model).** Source says initiate is "vs Universal Table" and `Combat_System_Master_Reference.csv` says grappling is "contested by target MEL or STR." We resolve the contest exactly like dodge (sibling 21 §, `DODGE CHART`): the **defender's `(STA+MEL)/2` rank becomes a −CS to the attacker's column**, scaled by the same rank ladder the dodge chart uses (a Typical defender ≈ −0/−1CS, a Remarkable defender ≈ −2/−3CS). Specifically: `defenseCS = −1 × (defenderColumn − typicalColumn)`, clamped to [−6, 0]. This keeps grappling on the **one CS axis** (Bible §3.3) instead of inventing a second opposed-roll system. The 3-roll struggle (§4) is used for *sustained* position fights; the single Initiate roll is only for *entering* a grapple from neutral.

### 3.2 Weight_Check gate (Sheet 2)
Before a grapple may even be attempted: `Attacker_STR_rank ≥ Defender_Weight_Category`. Weight category = the defender's body weight bracket from `STRENGTH AND WEIGHT💪🏾.csv` (STR rank → max lbs table), mapped to the **lift ladder** in `Stat_Rank_Mapping.csv` (`Lifting_Capacity_lbs`). If the attacker cannot lift the defender's weight class, **takedowns/throws auto-fail**; only **clinch holds** (no off-the-ground component: Basic Hold, Body Lock, chokes) are legal. (Source: Sheet 2 `Weight_Check` row → "See Strength_Scale_Equivalencies.csv"; we bind it to the shipped `STRENGTH AND WEIGHT` + `Stat_Rank_Mapping` lift columns since that is the canonical lift ladder per Bible §13 #7.)

### 3.3 Super_Strength_Bonus to the contest (Sheet 2 + Sheet 8)
`Super_Strength_Bonus = +1CS per 20 STR above opponent, max +5CS` (Sheet 2). This is **in addition to** the flat per-rank `Grapple_CS_Bonus` in Sheet 8 (see §8). Both stack onto the initiate/struggle column.

---

## 4. The 3-Roll Struggle System (Sheet 3) — the heart of sustained grappling

When two units are *already* in a grapple and both contest control (initiate-then-fight, or both trying to improve position in the same exchange), resolve a **best-of-points struggle over 3 rolls**.

### 4.1 Per-roll points (exact, from Sheet 3)
Each of the 3 rolls, **both** fighters roll their formula on `Universal_Table_FIXED`; the **outcome band** awards points from a band-specific random range:

| Outcome band | Points awarded (inclusive random int) |
|---|---|
| Failed | `Random(0–1)` |
| Minor | `Random(2–3)` |
| Success | `Random(4–5)` |
| Major | `Random(6–7)` |

- **Attacker formula (all 3 rolls):** `(STR + MEL) / 2` vs `Universal_Table_FIXED`.
- **Defender formula (all 3 rolls):** `(STA + MEL) / 2` vs `Universal_Table_FIXED`.
- Apply net CS (MA + stance + super-strength + status) to each side's column **before** rolling, every roll.
- Sum each side's 3 point-awards → `Attacker_Total`, `Defender_Total`.

### 4.2 Outcome resolution (exact, from Sheet 3)
| Outcome | Condition | Result |
|---|---|---|
| **Attacker_Dominant_Win** | `Attacker_Total > Defender_Total + 5` | Attacker chooses position **+ free action** |
| **Attacker_Win** | `Attacker_Total > Defender_Total` | Attacker chooses position |
| **Draw** | `Attacker_Total = Defender_Total` | Both return to **Standing Clinch** (`POS_STAND`) |
| **Defender_Win** | `Defender_Total > Attacker_Total` | Defender escapes or reverses |
| **Defender_Dominant_Win** | `Defender_Total > Attacker_Total + 5` | Defender escapes **+ free reversal attempt** |

> **RULING WG-2 (struggle cost & cadence).** Source does not give the struggle a single AP price (Sheet 12 prices the component actions, not "a struggle"). We bind the struggle to the **declared grapple action's** AP: it is the resolution *of* an Initiate (4 AP), a contested Transition (2–5 AP per Sheet 6), or a contested Escape (3–4 AP per Sheet 10). One declared action = one 3-roll struggle = one outcome. This prevents a free infinite re-roll loop and keeps the 6-AP turn honest.

---

## 5. Positions (Sheet 1) — the state machine

7 states. A grappled unit is always in exactly one. Fields are exact from Sheet 1.

| Position_ID | Name | Control | Strike CS (top fighter) | Escape difficulty | Valid holds | AP to maintain | Notes |
|---|---|---|---|---|---|---|---|
| `POS_STAND` | Standing Clinch | Neutral | +0CS | Easy (−2CS) | Basic Hold; Body Lock | 2 | Both standing in close grip |
| `POS_GUARD` | Guard (Bottom) | Disadvantaged | −2CS | Medium (+0CS) | Triangle; Arm Bar; Guillotine | 2 | On back, opponent between legs |
| `POS_MOUNT` | Mount (Top) | **Dominant** | **+2CS** | Hard (+2CS) | Any submission; Ground Pound | 2 | Sitting on torso |
| `POS_BACK` | Back Control | **Dominant** | +1CS | **Very Hard (+3CS)** | RNC; Body Triangle | 3 | Behind, hooks in |
| `POS_SIDE` | Side Control | Advantaged | +1CS | Medium (+0CS) | Americana; Kimura; Knee-on-Belly | 2 | Perpendicular to grounded foe |
| `POS_HALF` | Half Guard | Slight Disadv. | −1CS | Easy (−1CS) | Basic Hold; Kimura attempt | 2 | One leg trapped |
| `POS_TURTLE` | Turtle | Defensive | −3CS | Medium (+0CS) | None (defensive only) | 1 | Hands & knees; back can be taken |

**Reading the columns:**
- **Strike CS** is applied to *that fighter's* ground-strike to-hit (see §9 ground strikes) and is the per-position positional advantage.
- **Escape difficulty** is a CS modifier applied to the *escaping* fighter's escape roll (more positive = harder to escape). It is added to the escape's `Base_Difficulty_CS` (Sheet 10).
- **AP to maintain** is paid by the *controlling* fighter at the start of each of their turns to keep the position; failing to pay (or spending all AP elsewhere) drops control to the neutral state (`POS_STAND`) at turn end. (RULING WG-3 below.)
- **Valid holds** gates which submissions can be applied from here (cross-checked against each hold's `Valid_From_Positions`, Sheet 4).

> **RULING WG-3 (upkeep & lapse).** Sheet 1 gives `AP_to_Maintain` but not the lapse rule. Ruling: at the start of the controller's turn they must reserve `AP_to_Maintain`; if they spend AP such that they cannot cover upkeep, the grapple **lapses to Standing Clinch** at end of turn (both still engaged, neutral control) — *not* a full break. A full break requires the explicit `Release` action (0 AP, Sheet 6/12) or a successful Escape (§10). Exception: **Wrestling**'s "Pin Hold: auto-maintain for 2 turns" (Sheet 7) waives upkeep for 2 turns.

---

## 6. Transition Matrix (Sheet 6) — moving between positions

Exact from Sheet 6. `Difficulty_Result` = the **minimum outcome band** the roll must reach (per RULING WG-0).

| From | To | AP | Roll formula | Min band | MA bonus | Failure consequence | Super-STR mod |
|---|---|---|---|---|---|---|---|
| Standing Clinch | Mount | 4 | `(STR+MEL)/2` | Success | Wrestling +2CS | Remain in Clinch | +1CS / 20 STR above |
| Standing Clinch | Back Control | 5 | `(AGL+MEL)/2` | Major | Ninjitsu +2CS | Remain in Clinch | +1CS / 30 STR above |
| Standing Clinch | Guard Pull | 2 | Auto | — | Judo +1CS (def) | N/A | N/A |
| Mount | Back Control | 3 | `MEL` | Success | Wrestling +1CS | Lose Mount → Half Guard | +1CS / 20 STR |
| Mount | Side Control | 2 | Auto | — | — | N/A | N/A |
| Side Control | Mount | 3 | `(STR+MEL)/2` | Minor | Wrestling +1CS | Remain in Side Control | +1CS / 20 STR |
| Side Control | Back Control | 4 | `(AGL+MEL)/2` | Success | Ninjitsu +1CS | Remain in Side Control | +1CS / 20 STR |
| Guard | Sweep to Mount | 4 | `(AGL+STR)/2` | Major | Judo +2CS | Remain in Guard | +1CS / 20 STR |
| Guard | Stand Up | 3 | `(AGL+STA)/2` | Success | Capoeira +2CS | Remain in Guard | None |
| Half Guard | Full Guard | 2 | `AGL` | Minor | — | Lose → Side Control | None |
| Turtle | Stand Up | 4 | `(AGL+STA)/2` | Success | Wrestling +1CS | Back Control taken (by opponent) | None |
| Any | Release | 0 | Auto | — | — | N/A | N/A |

**Band ordering** (for "min band" checks): `Failed < Minor < Success < Major`. "Auto" transitions always succeed (no roll). On failure, apply the row's `Failure_Consequence` exactly (note several are *worse than no-op*: a failed Half-Guard→Full-Guard drops you to Side Control; a failed Turtle stand-up gives your back away).

> **RULING WG-4 (AP cost of transitions binds to Sheet 12).** Sheet 12 buckets transitions as Easy=2 / Normal=3 / Hard=4–5; Sheet 6 gives per-row AP that matches those buckets. Use the **per-row Sheet 6 AP** (more specific). Where Sheet 6 says "Auto" with a 2 AP cost, it still costs the AP (you pay to move, you just don't roll).

---

## 7. Hold Types & Submissions (Sheet 4) — exact

Damage formulas use STR (the attacker's strength value, not rank). All exact from Sheet 4.

| Hold_ID | Name | AP apply | AP maintain | Dmg/turn | Escape CS mod | Status effect | Turns to effect | Valid from | MA bonus | Critical effect (on Major) |
|---|---|---|---|---|---|---|---|---|---|---|
| `HOLD_BASIC` | Basic Hold | 2 | 2 | 0 | +0CS | Immobilized | Instant | Any | Wrestling +1CS | None |
| `HOLD_ARMLOCK` | Arm Lock | 3 | 3 | STR/5 | +1CS | Arm_Damaged | 1 | Mount; Side; Guard | Aikido +2CS | **Broken Arm** (arm unusable) |
| `HOLD_LEGLOCK` | Leg Lock | 3 | 3 | STR/5 | +1CS | Leg_Damaged | 1 | Guard; Half Guard | Martial Arts +1CS | **Broken Leg** (−4 move) |
| `HOLD_RNC` | Rear Naked Choke | 4 | 4 | STR/3 | +2CS | Unconscious | 3 | Back Control | Ninjitsu +2CS | **Instant KO on Major** |
| `HOLD_GUILLOTINE` | Guillotine | 4 | 3 | STR/4 | +1CS | Choked (−1CS all) | 2 | Standing Clinch; Guard | Krav Maga +1CS | Unconscious |
| `HOLD_TRIANGLE` | Triangle Choke | 4 | 3 | STR/3 | +3CS | Unconscious | 4 | Guard | Martial Arts +2CS | Unconscious + arm damaged |
| `HOLD_KIMURA` | Kimura | 3 | 3 | STR/4 | +2CS | Shoulder_Damaged | 1 | Side; Mount; Guard | Wrestling +1CS | Dislocated Shoulder |
| `HOLD_AMERICANA` | Americana | 3 | 3 | STR/4 | +2CS | Shoulder_Damaged | 1 | Side; Mount | Wrestling +1CS | Dislocated Shoulder |
| `HOLD_CRUCIFIX` | Crucifix | 4 | 4 | STR/5 | +3CS | Arms_Pinned | Instant | Back; Side | Wrestling +2CS | Free Ground Pound |
| `HOLD_BODYLOCK` | Body Lock | 2 | 2 | STR/10 | +0CS | Compression | 1 | Standing Clinch; Back | Wrestling +2CS | Can transition to Suplex |
| `HOLD_CRUSH` | Crushing Hold | 4 | 4 | STR/3 | +2CS | Crushed (internal) | 1 | Any | **Super Strength only (STR 50+)** | **Broken Ribs** |

**How a submission resolves each turn it is held:**
1. Controller pays `AP apply` the turn it's locked in, `AP maintain` each subsequent turn (waivable by Wrestling Pin-Hold for 2 turns).
2. Each maintained turn deals `Dmg/turn` (e.g. RNC at STR 60 = 60/3 = **20 dmg/turn**), reduced by the defender's appropriate DR (chokes/internal bypass *physical* armor per RULING WG-5).
3. After `Turns_to_effect` consecutive maintained turns, the `Status_Effect` lands (e.g. RNC → **Unconscious** after 3 turns). The defender may attempt an **Escape** (§10) each of their turns to reset the counter.
4. The hold's **`Escape CS mod`** is added to the *defender's* escape difficulty (more positive = harder), on top of the position's escape difficulty.
5. On any maintained-turn roll that comes up **Major**, apply the **Critical_Effect** immediately and feed it to the crit→injury pipeline (§10 below, RULING WG-6).

> **RULING WG-5 (chokes & crush bypass physical armor; map to injury).** Sheet 4 names damage types implicitly (chokes, internal crush). Per Bible §5.6 and the damage-type model (sibling 22), **chokes (RNC, Guillotine, Triangle) and Crushing Hold ignore physical DR** (they don't punch plate, they cut air/crush organs) but are stopped by *sealed/rigid* armor with the `Asphyxiation_Immune` or `Rigid_Shell` tag and by Construct origin (can't be choked — Bible §4 "Construct can't bleed"). Limb-locks (Arm/Leg/Kimura/Americana) *do* respect DR (you must out-torque the armor). This binds the holds to the existing damage-type/origin model rather than inventing a choke rule.

> **RULING WG-6 (critical hold effects feed the ONE injury pipeline).** "Broken Arm", "Broken Leg", "Dislocated Shoulder", "Broken Ribs", "Instant KO" are the hold `Critical_Effect`s. Per Bible §13 #2 there is **one** crit→injury path. So a hold Critical does **not** roll a bespoke effect — it **forces the matching `Injury_System.csv` row** (Broken Arm = row 18, Broken Leg = row 19, Broken Ribs = row 22, Dislocated Shoulder ≈ row 16 "Severed Muscles" / GM-mapped to a shoulder severe injury) with the **Crushing_Damage −15** roll modifier (`Injury_System` "INJURY TRIGGER CONDITIONS"). "Instant KO" / "Unconscious" applies the **Unconscious** status (sibling 24; `EFFECT_STATUS` "Knocked out") rather than the injury table. This keeps holds inside the unified injury system; no new disability table.

---

## 8. Throw Types (Sheet 5) — exact

All exact from Sheet 5. Damage formulas use STR value. `Knockback_Squares` is the throw's own value; for STR-driven body throws it is **overridden upward** by the MELEE KNOCK BACK CHART when STR is high (RULING WG-7).

| Throw_ID | Name | AP | Base damage | Knockback sq | Result pos. | MA bonus | STR req | Special effect | Environment |
|---|---|---|---|---|---|---|---|---|---|
| `THROW_HIP` | Hip Throw | 4 | STR/4 | 1 | Prone | Judo +2CS | — | Target Prone | None |
| `THROW_SHOULDER` | Shoulder Throw | 4 | STR/3 | 2 | Prone | Judo +3CS | — | Dazed on Major | Possible wall impact |
| `THROW_SUPLEX` | Suplex | 5 | STR/2 | 0 | **Mount** (thrower) | Wrestling +2CS | STR 30+ | Thrower lands in Mount | Floor damage possible |
| `THROW_SLAM` | Power Slam | 5 | **STR/2 + 10** | 2 | Prone | Wrestling +2CS | STR 40+ | Environmental knockback | Wall/floor destruction |
| `THROW_SWEEP` | Foot Sweep | 3 | STR/6 | 1 | Prone | Judo +2CS; Capoeira +2CS | — | Target Prone only | None |
| `THROW_SPIN` | Spinning Throw | 5 | **STR/3 + 5** | 3 | Prone | Aikido +3CS | — | Disoriented 1 turn | Possible multi-target |
| `THROW_COUNTER` | Counter Throw | 3 | **Opponent STR/3** | 2 | Prone | Aikido +3CS; Judo +2CS | — | Uses attacker momentum | Uses attacker's knockback |
| `THROW_LAUNCH` | Superhuman Launch | 6 | STR/2 | **STR/10 squares** | Prone | Super Strength only | **STR 70+** | Full knockback rules | Building destruction |

**To-hit for a throw** = the controller's MEL column (Bible §5.5 "thrown… AGL"; but a *body throw from a clinch* is a melee action — RULING WG-8) ± throw MA bonus ± super-strength CS, minus the defender's contested `(STA+MEL)/2` (WG-1). Outcome band scales damage by the Universal multiplier (Failed 0× / Minor 0.5× / Success 1× / Major 1.5×, `Universal_Table_FIXED` RESULT EFFECTS).

> **RULING WG-7 (throw knockback = MELEE KNOCK BACK CHART, gated by the throw row).** Two knockback numbers exist: each throw's small `Knockback_Squares` (1–3) and the STR-scaled `MELEE KNOCK BACK CHART` (`🙊Knockbag🙉.csv`: STR 50–59 = 6 sq, 70–79 = 10 sq, etc.). Ruling: a throw's `Knockback_Squares` is the **floor**; the **actual knockback = max(throw's Knockback_Squares, MELEE KNOCK BACK CHART value for the thrower's STR)** *only for throws flagged "Environmental knockback / Full knockback rules"* (Power Slam, Superhuman Launch, Counter Throw). Technique throws (Hip/Shoulder/Sweep/Spin/Suplex) use their **fixed** small value regardless of STR (they're controlled placements, not blasts). `THROW_LAUNCH`'s `STR/10 squares` is itself ≈ the chart at high STR, so they agree. This resolves the "two knockback values" contradiction without a new number.

> **RULING WG-8 (throw hit-stat = MEL).** `Combat_System_Master_Reference.csv` lists *thrown weapons/objects* as AGL, but a **body throw initiated from a clinch** is hand-to-hand placement → **MEL** (consistent with "Grappling — Use MEL"). Throwing an *environmental object or a person you are not clinched with* (e.g. picking up a downed foe and hurling them) is the **`25-strength-throwing.md` projectile system** (AGL, that doc's canonical formula), not this sub-loop. The dividing line: *in a clinch → here (MEL); pick-up-and-hurl → sibling 25 (AGL).*

> **RULING WG-9 (Aerial Grapple / both may fall).** Bible §5.4 lists "Aerial Grapple (both may fall)." If a grapple is initiated or maintained at Z≥1 (altitude, sibling 21 RULING TC-1), each upkeep turn both fighters roll `(AGL+STA)/2` vs `Universal_Table_FIXED`; on **Failed**, that fighter falls to Z0 and takes falling damage per `Injury_System` "Falling_Damage −10 per 10ft" (sibling 23). A `THROW_*` executed at altitude additionally hurls the target downward, converting `Knockback_Squares` into **vertical fall** (Z×~10ft per level). Flyers without a free-flight power cannot maintain a grapple above their max-Z.

---

## 9. Ground Strikes (Sheet 9) — striking from a dominant position

Exact from Sheet 9. Available only while controlling the listed position. Damage uses STR. `Accuracy_CS` is added to the striker's MEL column; the position's own Strike CS (§5) also applies.

| Position | Strike | AP | Damage | Accuracy CS | Valid MA (bonus) | Defender options | Stun % |
|---|---|---|---|---|---|---|---|
| Mount | Punch | 2 | Full STR | +2CS | Boxing +2; Krav Maga +3; MA +2 | Block −2CS; Cover (½ dmg); Escape | 15% |
| Mount | Elbow | 2 | STR + 5 | +1CS | Krav Maga +3; MA +2 | Block −2CS; Cover; Escape | 25% |
| Mount | Hammer Fist | 2 | STR + 3 | +2CS | Boxing +1; Wrestling +1 | Block −2CS; Cover; Escape | 20% |
| Side Control | Knee Strike | 3 | STR + 8 | +1CS | Krav Maga +3; MA +2 | Cover only; Escape | 10% |
| Side Control | Elbow | 2 | STR + 5 | +1CS | Krav Maga +3 | Block −3CS; Cover; Escape | 25% |
| Back Control | Punch (side head) | 2 | STR/2 | −1CS (bad angle) | Boxing +1; Krav Maga +2 | Cover only; Escape | 10% |
| Guard (top) | Punch | 3 | STR/2 | +0CS (defended) | Boxing +2; MA +2 | Block; Sweep; Triangle attempt | 5% |
| Guard (top) | Elbow | 3 | STR/2 + 3 | −1CS (risky) | Krav Maga +2 | Block; Sweep; Triangle attempt | 15% |

**Stun %** = flat chance (independent of the to-hit roll) to apply **Stunned** (sibling 24; `EFFECT_STATUS` "Stunned — unable to take turn") on a hit of band ≥ Success. **Defender options** are *reactions* the bottom fighter may declare instead of taking the hit clean: Block (−CS to the strike), Cover (halve damage), Escape (§10), or — from Guard — a **Sweep/Triangle counter** (i.e. a transition or hold attempt as the reaction). On a **Major** strike, feed the crit→injury pipeline (RULING WG-6).

---

## 10. Escapes (Sheet 10) & Reversals (Sheet 11) — exact

### 10.1 Escapes (Sheet 10)
The grappled (disadvantaged) fighter spends AP to improve or break out. `Base_Difficulty_CS` is the escape's own modifier; **add** the position's Escape difficulty (§5) and **add** the active hold's `Escape CS mod` (§7). More positive total = harder.

| Escape | AP | Roll formula | Base diff CS | MA bonus | Success | Major success | Super-STR mod |
|---|---|---|---|---|---|---|---|
| Technical Escape | 3 | `(AGL+INS)/2` | +0CS | Escape Artist +2; Aikido +1 | Improve position by 1 | Full escape → standing | Opponent STR/20 penalty (to you) |
| Explosive Escape | 4 | `(STR+STA)/2` | +1CS | Wrestling +1; Krav Maga +2 | Break to neutral | Full escape + free strike | **Your** STR/20 bonus |
| Reversal Escape | 4 | `(AGL+MEL)/2` | +2CS | Aikido +3; Judo +2 | Reverse positions | Reverse + apply submission | Harder vs higher STR |
| Guard Recovery | 2 | `AGL` | +0CS | Judo +1; MA +1 | Move to Guard from worse pos. | Guard + sweep attempt | None |
| Turtle Defense | 1 | `STA` | −1CS | Wrestling +1 | Move to Turtle from any bad pos. | Turtle + stand attempt | Opponent STR/30 penalty |
| Stand Up | 3 | `(AGL+STA)/2` | +0CS | Capoeira +2; Wrestling +1 | Return to standing | Standing + free movement | Opponent STR/30 penalty |

**`Escape Artist`** is a real talent (`🐱_👤Skills, Talents, Martial Art.csv`: *"Ability to exit combat without penalty when the NME doesn't see them"*) → in-grapple it grants **+2CS Technical Escape** (Sheet 10) and, out of grapple, lets a unit disengage without an opportunity-interrupt when unobserved.

### 10.2 Reversals (Sheet 11)
A reversal is a *triggered* outcome, not a freely-declared action — it fires when a defensive roll comes up Major (or a critical fumble by the attacker). Exact triggers from Sheet 11:

| Trigger | Type | Requirement | MA bonus | Result | Damage | Notes |
|---|---|---|---|---|---|---|
| Escape roll Major vs attacker Failed | Position Reversal | Major on escape | Aikido +3; Judo +2 | Swap **all** positions | None | Immediate swap |
| Throw Defense Major | Counter Throw | Major on defense | Aikido +3; Judo +2 | Thrower becomes thrown | `Attacker STR/3` | Uses momentum (`THROW_COUNTER`) |
| Strike Parry Major | Strike Reversal | Major on parry | Aikido +2; Boxing +1 | Free counter strike | Normal strike dmg | Immediate counter |
| Submission Escape Major | Submission Reversal | Major on escape | Aikido +2; Wrestling +1 | Apply submission back | Standard submission | Turn the tables |
| Grapple Entry Failure | Entry Reversal | Attacker Failed **+** Defender Major | Aikido +3 | Defender chooses throw or clinch | Varies | Punish failed entry |
| Any Position | Desperate Reversal | **Critical Success (roll 00)** | All MA +1 | Full swap + free action | **10 dmg minimum** | **Once per combat max** |

> **RULING WG-10 (reversal trigger binds to the table bands).** "Major Success" in Sheet 11 = the **Major band** on `Universal_Table_FIXED` (roll 00 always Major, §3). "Critical Success (roll 00)" = the literal natural 00. "Attacker Failed" = the attacker's roll landed in the **Failed band** (or natural 99). The Desperate Reversal's "once per combat" is a per-unit per-encounter flag.

---

## 11. Martial Arts ±CS packages (Sheet 7) — exact, the specialization layer

Each style is a vector of ±CS across grappling sub-actions, plus one signature ability and one weakness. Exact from Sheet 7. A character carries **0 or 1** grappling martial art (the style they trained). The CS applies only to the matching sub-action.

| Martial Art | Initiate | Defense | Escape | Reversal | Gnd Strike | Throw | Submission | Special ability | Weakness |
|---|---|---|---|---|---|---|---|---|---|
| **Wrestling** | +2 | +1 | +0 | +1 | +0 | +1 | +2 | Pin Hold: auto-maintain 2 turns | −1CS vs strikes while grappling |
| **Judo** | +0 | +1 | +1 | +2 | +0 | +2 | +0 | Sacrifice Throw: reversal becomes throw | −1CS sustained submissions |
| **Boxing** | +0 | +0 | +0 | +0 | +2 | +0 | +0 | Clinch Uppercut: +3CS strike from clinch | −2CS all ground positions |
| **Krav Maga** | +1 | +0 | +3 | +0 | +3 | +0 | +1 | Groin Strike Escape: auto-slip 1×/fight | No control-position bonuses |
| **Capoeira** | −1 | +1 | +2 | +1 | +0 | +1 | +0 | Cartwheel Escape: +3CS standing escape | −2CS ground control |
| **Aikido** | +0 | +3 | +1 | +3 | +0 | +3 | +1 | Redirect: use attacker's STR for throw dmg | −1CS initiating grapples |
| **Ninjitsu** | +1 | +0 | +1 | +0 | +1 | +0 | +2 (chokes) | Silent Choke: no noise on KO | −1CS frontal grapple entry |
| **Katana** | −2 | −1 | −1 | −1 | +1 | +0 | −2 | Saya Strike: pommel stun +2CS | −3CS all grappling (weapon focus) |
| **Staff** | −1 | +2 | +0 | +0 | +0 | +0 | −1 | Staff Trip: +3CS sweep from range | −2CS if grappled (loses weapon) |
| **Martial Arts** (generalist) | +2 | +1 | +1 | +1 | +2 | +1 | +1 | Universal Competence: no penalties anywhere | No specialization (+3CS) bonus |

**Signature abilities, fully specified:**
- **Wrestling Pin Hold:** waives `AP_to_Maintain` for the current hold/position for 2 turns (WG-3 exception).
- **Judo Sacrifice Throw:** when a Reversal triggers (Sheet 11), Judo may convert it into a `THROW_*` instead of a position swap (applies the Counter-Throw damage).
- **Boxing Clinch Uppercut:** +3CS to a Ground/Clinch strike specifically from Standing Clinch.
- **Krav Maga Groin Strike Escape:** once per combat, auto-succeed one Escape (no roll), to neutral.
- **Capoeira Cartwheel Escape:** +3CS to **Stand Up** escapes specifically.
- **Aikido Redirect:** Aikido's throws use the **opponent's STR** for damage (so a weak Aikidoka throws a strong man hard) — already baked into `THROW_COUNTER` (Opponent STR/3); Redirect extends it to *all* Aikido throws.
- **Ninjitsu Silent Choke:** an RNC/choke KO emits **0 dB** (sibling: `Sound_Detection_System`) — no alarm, stealth-kill enabler.
- **Katana / Staff** are weapon styles: they are bad at grappling (negative CS) but bring a stun (Saya Strike) / a ranged sweep (Staff Trip). They exist so an armed fighter *can* grapple, badly.
- **Martial Arts (generalist):** competent everywhere (no negatives) but never gets a single-discipline **+3CS** spike.

> **RULING WG-11 (stance synergy is additive and from `Combat_Modes_Stances.csv`).** `Combat_Modes_Stances.csv` "MODE INTERACTIONS WITH MARTIAL ARTS" gives recommended stance combos (Wrestling + Grappling_Stance = **+3CS total grapple initiate**; Aikido + Defensive_Stance = **+5CS defense / +4CS reversal**; Krav Maga + Aggressive = **+5CS unarmed / +4CS escapes**). These are the **sum** of the Sheet 7 MA CS and the stance CS (`Grappling_Stance` = +2CS counter-grapple; `Defensive_Stance` = +2CS defense / +1CS counter-grapple) — not a separate bonus. Implement as: `netCS = MA_CS + stance_CS + super_str_CS + status_CS`. The "recommended combo" rows are a UX hint, not extra math. `Grappling_Stance` also requires **hands free** (no two-handed weapon) per `Combat_Modes_Stances.csv` restriction.

> **RULING WG-12 (martial arts erode without training — Bible §4 / GDD line 261).** A martial art "which can be skill or talent erode[s] without training" (FIST GDD line 261). Per Bible §13 #8 (no XP; growth via training with erosion): a character's MA ±CS package **degrades one tier toward generic if not maintained** by the **Train** daily activity (sibling `06-character-mgmt-activities.md`). Robots cannot train and thus cannot hold a martial art (GDD line 261 "robots cannot train"). Erosion cadence and exact decay curve = OWNER-FORK WG-A.

---

## 12. Super-Strength Grappling (Sheet 8) — the scaling layer

Exact from Sheet 8. Indexed by the attacker's raw STR value. These bonuses **stack** with the per-20-STR-differential `Super_Strength_Bonus` (§3.3).

| STR range | Rank | Grapple CS | Auto-win threshold | Crush dmg/turn | Throw enhancement | Special | Environment |
|---|---|---|---|---|---|---|---|
| 1–19 | Feeble–Poor | −2CS | — | None | None | None | None |
| 20–29 | Typical | +0CS | — | None | Normal throws | None | None |
| 30–39 | Good | +0CS | — | None | Normal throws | None | None |
| 40–49 | Excellent | +1CS | STR diff 30+ | None | +1 knockback | Weight advantage | None |
| 50–59 | Remarkable | +2CS | STR diff 25+ | STR/10 | +2 knockback | **Crushing Hold available** | Minor floor cracks |
| 60–69 | Incredible | +2CS | STR diff 20+ | STR/8 | +3 knockback + wall impact | Throw through walls | Wall damage on throws |
| 70–79 | Amazing | +3CS | STR diff 15+ | STR/6 | +4 knockback + structure dmg | **Launch opponent** | Building damage possible |
| 80–89 | Monstrous | +3CS | STR diff 10+ | STR/5 | +5 knockback + area dmg | Orbital throw | Significant destruction |
| 90–99 | Unearthly | +4CS | **Any non-super** | STR/4 | Full knockback table | Reality-tier grappling | Massive environmental dmg |
| 100+ | Shift X+ | +5CS | **All normal humans** | STR/3 | Unlimited knockback | Cosmic grappling | Catastrophic destruction |

**Auto-win threshold:** if `Attacker_STR − Defender_STR ≥ threshold` **and** the defender is non-super (or "any" at 90+), the grapple **Initiate auto-succeeds** (skip the roll) — the strong fighter simply takes the position. The 3-roll struggle is skipped; attacker chooses position. (RULING WG-13: auto-win still costs the 4 AP Initiate and does **not** auto-apply a submission — you still must spend AP to lock a hold; it only removes the *position* contest.)

**Crushing damage** applies while `HOLD_CRUSH` is maintained (Sheet 4 gates it to STR 50+, agreeing with Sheet 8). **Environment** column writes destruction events to the grid (cover degrades, walls breach) per sibling 21 destructible-cover and sibling 25 break-materials ladder.

---

## 13. How this consumes the SPINE (country / city / personality)

Combat is *one verb* (Bible §5), so grappling's spine-consumption is **light but real** — it must not be a closed combat island. Three concrete hooks:

### 13.1 Personality → who gets grappled (the legible hook)
The grapple **target selection** for AI units reads the **authoritative 20→preference map** (sibling `03-personality-relationships.md` §3.1; source `PERSONALITY TARGET SELECTION.csv`):

| Pref | Bands | Grapple behavior |
|---|---|---|
| `MOST_HEALTH` (1) | types 1,5,8,11 | "brawler" — clinches the **toughest standing foe** (grappling is how a brawler neutralizes a tank) |
| `LEAST_HEALTH` (2) | types 9,10,13,17,20 | "bully" — clinches/pins the **weakest** (lowest HP) to finish them helpless |
| `MAJOR_THREAT` (3) | types 2,6,14,15,16 | "pragmatist" — clinches your **biggest damage dealer** to **immobilize** it (a grapple is a soft-CC) |
| `MINOR_THREAT` (4) | types 3,4,7,12 | "finisher" — grapples the weak hitter only opportunistically |
| `RANDOM` (5) | types 18,19 | "chaotic" — random grapple targets |

**Design intent:** a *pragmatist* enemy using a Triangle Choke to lock down your blaster while its allies shoot you is the moment the personality engine becomes visible in tactical play. Submission holds are AI-weighted as **soft crowd-control**, not just damage. (RULING WG-14: AI values a hold by `expected_immobilize_turns × target_threat`, so pragmatists prefer chokes on high-threat targets and bullies prefer pins on low-HP targets — derived from the existing target-preference map, no new data.)

### 13.2 Country/city → who *can* grapple well, and what it costs
- **Recruitment pool (spine §6.1/§6.2).** Which martial arts are available among recruits is set by **city type + culture region** (Bible §6.2/§6.3): a Temple city / South-Asia culture skews recruits toward spiritual/MA styles (Aikido, Martial Arts generalist); a Military city skews toward Krav Maga & Wrestling. So the *country you start in* shapes whether your roster can grapple at all. (Consumes `City_Type_Effects.csv` recruitment pool + `Culture_Region_Effects.csv` power affinity — already the spine's job; grappling just reads the resulting roster.)
- **Crippling has a legal/fame price (spine §9).** Breaking a man's arm or choking him unconscious is a **non-lethal capture** in a low-law/high-corruption sector (good — feeds the prisoner/interrogation loop, sibling `109-prisoners-capture-interrogation.md`) but is **excessive force** in a high-law, high-media-freedom democracy → fame/legal hit via `Public_Perception` (Bible §9). RULING WG-15: a grapple that ends in **Unconscious** (non-lethal) is the *preferred capture verb* and is scored by the spine's reputation system more favorably than a kill in lawful nations, and more harshly (it's "a brutal beating on camera") where media freedom is high. This makes wrestling the *capture-alive* tool the strategic layer wants.

### 13.3 Crime/sector difficulty → grapple frequency
High-crime sectors (Bible §6.5 crime sim) spawn more melee-range thug encounters where grappling is decisive (no guns at arm's length). The encounter generator (sibling `02-event-emergence-engine.md`) tags melee-heavy templates so grappling-built squads shine in alleys and riots — consuming the per-city `crimeIndex` the spine already computes. (RULING WG-16: this is a *template tag*, not a new number — grappling reads the encounter tag, it does not set it.)

---

## 14. Edge cases & failure modes

| # | Case | Resolution |
|---|---|---|
| E1 | **Grapple a flyer / mid-air grapple** | Allowed only if grappler can reach the target's Z (sibling 21). Maintained → Aerial Grapple fall checks (WG-9). |
| E2 | **Weight_Check fails** (can't lift the target) | Takedowns/throws auto-fail; only clinch holds (Basic, Body Lock, chokes) legal (§3.2). |
| E3 | **Both fighters super-strong, both over auto-win threshold vs the other** | Neither auto-wins; fall back to the **3-roll struggle** (§4) with both super-STR CS applied. |
| E4 | **Target is a Construct origin** (can't be choked/bled) | Chokes (RNC/Guillotine/Triangle) and Crush deal **0** and never reach Unconscious; limb-locks still work (snap servos) (WG-5; Bible §4). |
| E5 | **3rd party attacks a grappled pair** | Grappled units are **Immobilized** (`EFFECT_STATUS`) → attacker gets **prone/pinned +CS** (sibling 21 "Prone target +1CS"). A stray AoE hits **both** grapplers. |
| E6 | **Controller runs out of AP for upkeep** | Position lapses to Standing Clinch at end of turn (WG-3); hold drops (no submission progress that turn). |
| E7 | **Submission lands its status, then defender escapes** | Status already applied (e.g. Choked −1CS) persists per its own duration (sibling 24); escape only stops *further* progress toward Unconscious. |
| E8 | **Stunned / Frightened controller** | `Combat_Modes_Stances.csv` "STATUS EFFECTS AFFECTING MODES": Stunned cancels all modes; **Grappled** state cancels most modes but allows **Berserk**. A Stunned grappler cannot maintain → lapse (E6). |
| E9 | **Desperate Reversal already used this combat** | Per-unit flag blocks a 2nd (WG-10). |
| E10 | **Throw target into a wall / off a ledge** | `Knockback_Squares` resolved on grid; impact with a wall = wall impact damage (sibling 25 + 21 destructible cover); off a ledge = falling damage (sibling 23). |
| E11 | **Throw into another unit** | `THROW_SPIN` "possible multi-target" / Power Slam area: the thrown body deals **0.75× damage to the unit it lands on** (binds to sibling 25 throwing-into-crowd rule, RULING WG-17). |
| E12 | **Grappler has a martial art but a two-handed weapon equipped** | Cannot enter `Grappling_Stance` (hands not free, `Combat_Modes_Stances.csv`); Staff/Katana styles take their built-in grapple penalty; may still attempt a bare Initiate at −CS. |
| E13 | **Robot/Construct attempts to use a martial art** | Robots can't train → can't *hold* a martial art (WG-12); they grapple as the generic 0-CS profile, gated only by STR (Sheet 8). |
| E14 | **Mutual KO / both choke each other** | Resolve by initiative order (sibling 21): the unit whose Unconscious counter completes first on its own turn goes out first. |
| E15 | **AI with no valid grapple target** (everyone out of melee reach) | Falls back to its normal ranged/strike behavior (sibling 21 AI); grappling is only chosen when a personality-preferred target is within reach (1 sq, same Z). |

**Failure modes to guard against in code:**
- **Infinite re-roll loop:** prevented by WG-2 (one declared action = one struggle = one AP spend).
- **Submission stun-lock:** the defender always gets an Escape attempt on their turn (§7 step 3), and chokes have a `Turns_to_effect` ≥ 2 (RNC=3, Triangle=4) giving counterplay before KO.
- **Super-strength trivializing all fights:** auto-win removes the *position* contest only, not the AP cost or the submission step (WG-13); and a high-AGL grappler can still **Reversal-Escape** a stronger but slower foe (Sheet 11).
- **Stalled grapple (both turtling):** a Draw returns both to Standing Clinch (Sheet 3); if neither commits AP, the grapple lapses to neutral and either may Release (0 AP).

---

## 15. UI / UX hooks (symbolic combat — sibling 21 conventions)

**Combat grid overlay (the only place the full state machine renders):**
- Grappled pair = **two stacked glyphs in one square** + a **position label** (`MNT`/`BK`/`SD`/`HG`/`GD`/`TRT`/`CL`), top fighter on top. Controlling/dominant fighter outlined in the **accent** color; disadvantaged in muted.
- **AP-upkeep pip** on the controller's glyph (shows `2`/`3` reserved); greys out if they can't cover it (telegraphs an incoming lapse).
- **Submission progress meter** = a small `n/Turns_to_effect` bar under the hold name (e.g. `RNC 2/3`), fills toward the status (turns red the turn before Unconscious lands).
- **Throw preview:** on selecting a throw, draw the **knockback vector** (arrow of `Knockback_Squares` length) and highlight the **landing square** + any wall/unit it will hit (red = destruction/area).
- **Auto-win indicator:** if super-strength auto-win applies, the Initiate button shows a **"⚡ AUTO"** badge instead of a hit %.

**Action menu (when a grapple is the declared action):** a radial/list of *only the legal* sub-actions for the current position — transitions valid from here (Sheet 6), holds valid from here (`Valid_From_Positions`), valid ground strikes (Sheet 9), and Escape/Release — each showing **AP cost** and **net CS / hit %**. Illegal actions are hidden, not greyed (keeps the symbolic UI uncluttered).

**Martial-art badge:** each unit's sheet shows its MA style as a one-glyph badge with a tooltip listing the Sheet 7 ±CS vector and the signature ability. A **down-arrow** on the badge warns when the style is **eroding** (untrained, WG-12) — a phone/laptop nudge ("Reyes hasn't trained Judo in 12 days").

**Phone / laptop hooks (meta-layer, Bible §7):**
- **Personnel screen:** MA style + "grapple control" derived rating, so the player builds a grappling specialist deliberately.
- **News (Bible §7.2):** a fight ended by a **public choke-out** in a high-media-freedom nation can surface as a BNN clip ("FIST operative filmed choking suspect unconscious") — the fame/legal consequence of WG-15, made visible.
- **Prisoner database (sibling 109):** a foe KO'd by a **non-lethal Unconscious** grapple arrives as a **capturable prisoner**, not a corpse — the strategic payoff loop for grappling.
- **Email/mission briefs (Bible §7.1):** capture-alive missions ("we need him breathing") explicitly reward grappling KOs over kills.

**Audio (sibling 103):** Ninjitsu Silent Choke emits 0 dB (no alarm SFX); a Power Slam through a wall triggers the destruction SFX + screen-shake; submission "tap/snap" cue on the Critical_Effect.

---

## 16. Integration points (reads / writes)

**Reads:**
- `Universal_Table_FIXED` — every roll (WG-0).
- `Stat_Rank_Mapping` — stat→column, lift ladder (Weight_Check), threat tiers.
- `Combat_Modes_Stances` — Grappling_Stance CS, MA+stance combos, status→mode cancels.
- `STRENGTH AND WEIGHT` — defender weight bracket for Weight_Check.
- `DODGE CHART` — the rank→−CS scale reused for contested defense (WG-1).
- Personality target map (sibling 03 / `PERSONALITY TARGET SELECTION`) — AI grapple target choice.
- Grid/altitude (sibling 21) — reach, Z, prone/pinned CS, destructible cover.
- Origin model (Bible §4) — Construct immunity to chokes (WG-5).

**Writes:**
- **Status effects** (sibling 24): Immobilized, Choked, Unconscious, Arm/Leg/Shoulder_Damaged, Arms_Pinned, Compression, Crushed, Prone, Dazed, Disoriented.
- **Injury pipeline** (sibling 23): forced injury rows on hold/throw Criticals (WG-6), with Crushing_Damage/Called_Shot/Falling modifiers.
- **Knockback / destruction** (sibling 25 + 21): throw knockback, wall/floor breach, area damage to adjacent.
- **Capture/prisoner** (sibling 109): non-lethal Unconscious → prisoner.
- **Fame/legal/reputation** (Bible §9): excessive-force vs lawful-capture scoring (WG-15).
- **Sound** (`Sound_Detection_System`): Silent Choke 0 dB; Power Slam loud.
- **Crit→injury** is the single shared pipeline — grappling never spawns a parallel disability table (Bible §13 #2).

---

## 17. Implementation order (zero-follow-up build path)

1. **State enum + position table** (Sheet 1) and the legal-action gate (`Valid_From_Positions`, transition matrix).
2. **Resolver glue** to `Universal_Table_FIXED` with `netCS = MA_CS + stance_CS + superStrCS + statusCS − contestedDefenseCS` (WG-1).
3. **Initiate / Weight_Check / Super-strength auto-win** (Sheets 2, 8; §3, §12).
4. **3-roll struggle** (Sheet 3, §4) bound to one declared action (WG-2).
5. **Transition matrix** with min-band checks & failure consequences (Sheet 6, §6).
6. **Holds** with per-turn damage, status, `Turns_to_effect` counter, Critical→injury (Sheet 4, §7, WG-5/6).
7. **Throws** with knockback resolution (Sheet 5, §8, WG-7/8).
8. **Ground strikes** (Sheet 9, §9) + defender reactions.
9. **Escapes & reversals** (Sheets 10/11, §10) incl. Escape Artist talent.
10. **Martial-art packages** as data (Sheet 7, §11) + stance synergy (WG-11) + erosion (WG-12).
11. **Spine hooks:** personality grapple-AI weighting (§13.1, WG-14), capture→prisoner, fame/legal scoring (§13.2).
12. **UI overlay** (§15): stacked glyphs, upkeep pip, submission meter, throw preview, legal-action menu.

Every number above is in a cited source table; only the labeled **RULING/OWNER-FORK** items add design on top, and each is consistent with a Bible §13 ruling.

---

## 18. RULING: notes (collected)

- **WG-0** One resolver: all grapple rolls use `Universal_Table_FIXED` (Bible §13 #1).
- **WG-1** Contested grapple/throw → defender column becomes −CS to attacker (reuse the dodge model), keeping the one-CS axis. `defenseCS = −(defCol − typicalCol)`, clamp [−6,0].
- **WG-2** One declared grapple action = one 3-roll struggle = one AP spend (no infinite re-roll).
- **WG-3** Position upkeep: can't pay → lapse to Standing Clinch at end of turn (not full break); Wrestling Pin-Hold waives 2 turns.
- **WG-4** Use per-row Sheet 6 AP costs (they match Sheet 12 buckets).
- **WG-5** Chokes & Crush bypass physical DR but are stopped by sealed/rigid armor & Construct origin; limb-locks respect DR.
- **WG-6** Hold/throw Criticals force the matching `Injury_System` row (the one injury pipeline, Bible §13 #2) with Crushing_Damage −15; "Unconscious/KO" applies the status, not an injury roll.
- **WG-7** Throw knockback = max(throw's fixed value, MELEE KNOCK BACK CHART for STR) **only** for "full/environmental" throws; technique throws use their fixed value (resolves the two-knockback-value conflict).
- **WG-8** Throw hit-stat = MEL for clinch body throws; pick-up-and-hurl uses sibling 25's AGL projectile system.
- **WG-9** Aerial Grapple: per-turn `(AGL+STA)/2` fall check at Z≥1; Failed → fall + falling damage.
- **WG-10** Reversal triggers bind to Universal-Table bands; Desperate Reversal = natural 00, once per combat.
- **WG-11** MA+stance CS is additive from `Combat_Modes_Stances.csv`; "recommended combo" rows are UX hints, not extra math.
- **WG-12** Martial arts erode without the Train activity (GDD line 261; Bible §13 #8); robots can't hold a style.
- **WG-13** Super-strength auto-win removes only the *position* contest; AP cost & submission step still required.
- **WG-14** AI weights a grapple by `expected_immobilize_turns × target_threat`, derived from the personality target map (no new data).
- **WG-15** Non-lethal Unconscious grapple = the preferred *capture* verb; scored by the spine's fame/legal system (favorable in lawful nations, harsh where media freedom is high).
- **WG-16** Grapple-frequency is an encounter-template tag reading the spine's `crimeIndex`, not a new number.
- **WG-17** Throw-into-unit deals 0.75× to the landing unit (binds to sibling 25 crowd-throw rule).

---

## 19. OWNER-FORK: notes (product choices for the owner)

- **OWNER-FORK WG-A — martial-art erosion curve.** WG-12 establishes that styles erode without training, but the **decay rate** (days-to-drop-a-tier, whether it caps at generic or hits 0, whether one missed Train cycle matters) is a difficulty/feel dial. Source only says "erode," no number. *Recommend:* −1 effective CS per real-week untrained, floor at the generic 0-CS profile, tunable in a `martial_art_erosion` data row. Owner sets the pace.
- **OWNER-FORK WG-B — lethality of submissions vs. game tone.** Holds can *break arms* and *choke unconscious*. How permanent should crippling be on **player** mercs (vs. enemies)? Options: (a) symmetric — your mercs lose arms too (JA2-brutal); (b) player-favored — player mercs roll injury at +X to roll (less likely permanent). The injury table already supports both (`Injury_System` resistance modifiers). Owner picks the brutality contract (ties into the cloning/permadeath stance, Bible §11).
- **OWNER-FORK WG-C — auto-win visibility & "boring fights."** Super-strength auto-win (Sheet 8) makes a Hulk-tier hero trivially out-grapple humans. Is that **satisfying power fantasy** (keep auto-win, fast-resolve the grapple) or **boring** (force at least the 3-roll struggle so even gods can slip a choke)? *Recommend keep auto-win for position, keep the submission step manual* (WG-13) — but flag it for the owner since it shapes how high-tier fights feel.
- **OWNER-FORK WG-D — should NPC AI ever grapple the PLAYER's flyers out of the sky?** Aerial Grapple (WG-9) lets an enemy super clinch a player flyer and drag both down. Powerful, cinematic, potentially frustrating (losing your flyer's positional advantage to one enemy action). Owner decides whether AI is *allowed* to open with an Aerial Grapple or only counter-grapples.
- **OWNER-FORK WG-E — capture economy weighting.** WG-15 makes grappling the capture-alive verb. How strongly should the strategic layer **reward** captures (intel, ransom, recruitment of defeated super-criminals — Bible §7.3 prisoner database) vs. kills? This is a core meta-loop incentive dial the owner owns.

---

## 20. Open questions

1. **Dislocated Shoulder injury row.** `Injury_System.csv` has no literal "Dislocated Shoulder" row; WG-6 maps it to row 16 (Severed Muscles) as a shoulder-localized severe injury. Confirm the intended mapping or add a dedicated row to `Injury_System.csv`.
2. **`Compression` / `Arms_Pinned` / `Crushed` status definitions.** Sheet 4 names these statuses but `EFFECT_STATUS😴.csv` doesn't define them explicitly (it has Immobile, Unconscious, Prone, etc.). Sibling 24 should add precise rows (duration/effect); this doc treats Compression≈stamina-drain, Arms_Pinned≈can't-attack-can't-block, Crushed≈internal-DoT — confirm.
3. **Strength_Scale_Equivalencies STR 50–81 gap.** Bible §13 #3 notes the lift ladder has a gap (the `STRENGTH AND WEIGHT` table goes blank 40–49+ and stops at 80). Weight_Check above STR 50 needs that gap filled (owner data task) for the lift gate to be continuous.
4. **Does the generalist "Martial Arts" style stack with a *specific* style?** Sheet 7 lists it as its own row (no specialization spike). Assumed: a character has exactly one MA entry; "Martial Arts" is the no-weakness generalist *instead of* a specialist. Confirm a character can't carry both.
5. **Multi-fighter grapples (2-on-1 pin).** Source covers 1-on-1 only. Should two units be able to co-grapple one target (double-team pin)? Out of scope for v1; flagged for a later sheet.
6. **Grapple vs. ranged interrupt (Overwatch).** `Combat_Modes_Stances.csv` says Overwatch "cannot react to melee/grapple." Confirm a grappler walking into Overwatch range is *not* interrupted before the clinch (assumed: not interrupted; the clinch closes inside the overwatch reaction window).

---

*Grappling is the single most complete system in the source data (Bible §5.9). This spec ships it whole: 7-state machine, 11 holds, 8 throws, the 3-roll struggle, 10 martial-art ±CS packages, and a clean super-strength scale — every number traced to `Wrestling_Martial_Arts_Complete.csv` and its named sibling tables, every gap closed with a labeled ruling consistent with the Bible.*
