# 20 — Core Resolution Engine (4CS Universal Table)

> **System owner doc.** Build-ready spec for SuperHero Tactics' (SHT) single resolution engine: the seven primary stats, the FASERIP rank ladder, the **Column-Shift (CS)** currency, and the **d100 → Universal Table → {Failed / Minor / Success / Major}** lookup that resolves *every* action in the game — combat *and* non-combat (to-hit, dodge, investigation, strength feats, mental resistance).
>
> **Status:** spec. The combat scene already implements a FASERIP-flavored resolver (`MVP/src/game/scenes/CombatScene.ts`, `temp_combat1.ts`); this doc is the canonical engine all of that must converge on. Pure-function core; no Phaser, no React, no store dependency — so the same `resolve()` runs in combat, investigations, and AI threat assessment.
>
> **Bible alignment:** `SHT_MECHANICS_BIBLE.md` §3 (Core Resolution Engine), §3.3 (procedure), §13.1 (ship `_FIXED`, retire base), §14 (data→table map). The GDD confirms intent: *"Combat takes place on a 2D grid and is based on the 4C System Advanced rules (4CS)… this chart is used for many things outside of combat… Column Shifts (CS) is a result modifier… handled behind the scenes"* (`SHT-dir/FIST GDD v02.txt:660-664, 1071`).
>
> **Sourcing rule:** every number below cites a source table. A value with no table is marked `RULING:` (a Bible-consistent design call) or `OWNER-FORK:` (a product choice only the owner makes). Source files live under `docs/csv-source-data/` and `docs/csv-source-data/Game_Mechanics_Spec/` (abbrev. **GMS/**) and the root `SuperHero Tactics/` (abbrev. **SHT-dir/**). The four primary tables are:
> - **GMS/Universal_Table_FIXED.csv** — the shipped 100-row × 15-column outcome grid (Bible §13.1).
> - **GMS/Primary_Stats_Spec.csv** — the seven stats, derived stats, stat interactions.
> - **GMS/Stat_Rank_Mapping.csv** — raw value → rank → column, plus the +CS / −CS reference.
> - **GMS/Combat_Resolution_Quick_Reference.csv** — the 15-step resolution procedure + CS source list.
>
> **Sibling docs:** `07-character-model.md` owns the `Character` record (stats live there; this doc consumes them). `11-country-effects-spine.md`, `12-city-culture-terrain.md`, `13-factions-relations-territory.md` own the spine ±CS tables (this doc is the consumer that *sums* them into a final column). Combat-specific riders (knockback, crit→injury, damage types, flight, BAMPI, wrestling) are specced lighter in their own docs; this doc owns only the **resolution kernel** they all call.

---

## 1. Overview & player fantasy

There is **one chart.** A punch, a sniper shot, a psychic blast, a dodge, a lockpick, a lie-detection check, a "can I lift this bus?" — all of them are the same three steps: pick a stat, slide it left/right by Column Shifts, roll d100, read the band. This is the Marvel-Super-Heroes / FASERIP feel the Bible promises (§3) and the GDD locks as law (`FIST GDD v02.txt:660`): a public-domain **4C System Advanced** engine.

The **player never sees the math.** The GDD is explicit: *"All of those things are handled behind the scenes"* (`FIST GDD v02.txt:1071`). The fantasy the engine sells is **rank as identity** — your Captain-America-tier bruiser *feels* Remarkable because the table says even Remarkable only crits ~6% of the time, so power still needs tactics (`Universal_Table_FIXED.csv:123-125`, the design notes). A cosmic Unearthly attacker almost never misses but *still* rarely one-shots. Column Shifts are the verbs of tactics: take cover (+CS defense), aim (+CS), flank (+CS), get stunned (−CS) — the player learns to manufacture shifts, and the symbolic combat grid (plain glyphs, flight = an altitude integer) is *legible* precisely because every modifier collapses onto one ±CS axis.

Because the same kernel runs investigations and AI threat scoring, the engine is also the **strategic dice**: an investigation in a high-corruption country isn't a different system, it's the same `resolve()` with the country's `−2CS official / +3CS bribes` shifts (`Country_Attribute_Effects.csv:9`) summed in. **This is the spine reaching combat and meta-game through one function.**

---

## 2. Data schema (fields / types)

TypeScript-flavored. The kernel is **three data structures loaded from CSV at boot** (the rank ladder, the CS-source registry, and the 100×15 outcome grid) plus the **call/return contract** of `resolve()`.

```ts
// ============================================================================
// 2.1 RANK LADDER — loaded from Stat_Rank_Mapping.csv (one ladder for everything)
// Bible §3.2, §13.7: "one rank ladder for lift/break/knockback/throw."
// ============================================================================
type RankName =
  | 'Shift_0' | 'Feeble' | 'Poor' | 'Typical' | 'Good' | 'Excellent'
  | 'Remarkable' | 'Incredible' | 'Amazing' | 'Monstrous' | 'Unearthly'
  | 'Shift_X' | 'Shift_Y' | 'Shift_Z' | 'Class_1000'
  | 'Class_3000' | 'Class_5000' | 'Beyond';

interface RankRow {
  rank: RankName;
  min: number;            // Stat_Value_Min (Stat_Rank_Mapping.csv col 2)
  max: number;            // Stat_Value_Max (col 3)
  columnIndex: number;    // 0-based position in the Universal Table column list
  threatLevel: string;    // Threat_Level (col 5) — 'None'|'Alpha'|'Threat 1'..'Earthshaker'..
  liftCapacityLbs: string;// Lifting_Capacity_lbs (col 8) — consumed by strength/throw docs
}

// ============================================================================
// 2.2 OUTCOME GRID — loaded from Universal_Table_FIXED.csv (Bible §13.1)
// Rows = d100 roll (01..00); Columns = the 15 SHIPPED columns (see §4.1 note).
// Cell value ∈ {'Failed','Minor','Success','Major'}.
// ============================================================================
type Outcome = 'Failed' | 'Minor' | 'Success' | 'Major';
type OutcomeGrid = Outcome[/*roll 0..99*/][/*columnIndex*/];

// ============================================================================
// 2.3 CS-SOURCE REGISTRY — every modifier in the game is a ±CS entry.
// Sources enumerated in Combat_Resolution_Quick_Reference.csv:30-41 and
// Combat_System_Master_Reference.csv:35-43.
// ============================================================================
interface CSModifier {
  source: string;         // human label, e.g. 'Martial Arts', 'Cover: Heavy', 'Country: Corruption'
  value: number;          // signed integer CS (can be 0); see §5 for ranges per source
  category:               // for UI grouping & tooltip ordering
    | 'skill' | 'power' | 'weapon' | 'stance' | 'cover' | 'range'
    | 'altitude' | 'position' | 'status' | 'wound' | 'dodge'
    | 'spine_country' | 'spine_city' | 'spine_culture' | 'spine_faction' | 'situational';
}

// ============================================================================
// 2.4 RESOLVE CONTRACT — the single entry point for ALL checks.
// ============================================================================
type CheckKind =
  | 'melee'          // hit stat MEL          (Primary_Stats_Spec.csv:2)
  | 'ranged'         // hit stat AGL          (Primary_Stats_Spec.csv:3; Power_Attack_Stats.csv:46)
  | 'mental'         // hit stat CON          (Power_Attack_Stats.csv:48)
  | 'tech'           // hit stat INT or AGL   (Power_Attack_Stats.csv:49)
  | 'dodge'          // defensive — converts to attacker −CS (see §5.3)
  | 'strength_feat'  // STR — lift/break/throw (Advanced_Universal_Table.csv:73)
  | 'agility_feat'   // AGL — acrobatics/balance
  | 'endurance_feat' // STA — resist fatigue/poison
  | 'reason_feat'    // INT — investigation/deduction
  | 'intuition_feat' // INS — perception/danger sense
  | 'psyche_feat';   // CON — willpower/mental resistance

interface ResolveInput {
  kind: CheckKind;
  statValue: number;        // raw stat (1..N) of the acting unit for this kind
  modifiers: CSModifier[];  // every applicable ±CS, already gathered by the caller
  rng?: () => number;       // injectable 0..1 RNG for determinism/replay (default Math.random)
  forcedRoll?: number;      // 1..100 — for tests / time-travel replay (skips rng)
}

interface ResolveResult {
  outcome: Outcome;                 // Failed | Minor | Success | Major
  damageMultiplier: 0 | 0.5 | 1 | 1.5;  // §6.1
  roll: number;                     // 1..100 (100 shown as '00')
  baseRank: RankName;               // rank before CS
  netCS: number;                    // sum of modifiers.value, clamped (§5.6)
  finalRank: RankName;              // rank AFTER CS (the column actually rolled on)
  finalColumnIndex: number;
  isCritFumble: boolean;            // roll === 99  (always Failed; §4.3)
  isCritSuccess: boolean;           // roll === 100 (always Major;  §4.3)
  triggersKnockback: boolean;       // §6.2 — handoff flag, not computed here
  triggersCritTable: boolean;       // §6.3 — handoff flag, not computed here
  appliedModifiers: CSModifier[];   // pass-through for the UI breakdown tooltip
}
```

**Hard architectural rule (`RULING:`):** `resolve()` is a **pure function** — no Phaser, no Zustand, no DOM. The caller gathers `modifiers[]` (combat scene, investigation screen, or AI scorer) and passes them in; the kernel only does ladder lookup + clamp + roll + grid read. This is what lets the Bible's "investigations resolve on the same table" (§7.4) be literally true and lets the time-travel save replay combat deterministically via `forcedRoll` (Bible §11).

---

## 3. The seven primary stats (and what each resolves)

Source: **Primary_Stats_Spec.csv:2-8** (definitions + combat/investigation application + CS source).

| Stat | Name | Hit/feat role | Source row |
|---|---|---|---|
| **MEL** | Melee | To-hit for punches/kicks/melee weapons & grapples | `Primary_Stats_Spec.csv:2` |
| **AGL** | Agility | To-hit for ranged/thrown/energy; **dodge**; initiative | `:3` |
| **STR** | Strength | Melee **damage**, knockback distance, lift/throw feats | `:4` |
| **STA** | Stamina | Health pool; resist poison/disease/fatigue | `:5` |
| **INT** | Intelligence | Tech/tactics; **primary investigation stat** | `:6` |
| **INS** | Instinct | Initiative; perception; detect ambush/lies | `:7` |
| **CON** | Concentration | Resist mental; sustain powers; **psychic attack to-hit** | `:8` |

**Derived stats** (consumed by other systems; computed once per unit, not by `resolve()`):
- `Health = STA × 2 + STR` — `Primary_Stats_Spec.csv:22`.
- `Initiative = (AGL + INS) / 2 + modifiers` — `Primary_Stats_Spec.csv:23`. The `/2` value is then mapped to a rank column for the initiative roll (worked example: AGL 25 + INS 20 = 45 / 2 = 22 → Excellent column, `Combat_Resolution_Quick_Reference.csv:2`).
- `Karma = (INT + INS + CON) / 3` — `Primary_Stats_Spec.csv:24`. (Luck/reroll pool; consumed by an optional reroll system, not the kernel.)

**Hit-stat selection by attack/power type** (the kernel's `kind` is chosen by the caller from these):
- Punch/Kick → MEL; Melee Weapon → MEL; Thrown → AGL; Ranged Weapon → AGL; Super-Strength attack → MEL; Energy Blast → CON or AGL; Psychic → CON; Grapple → MEL (contested). Source: `Combat_Resolution_Quick_Reference.csv:20-27`.
- Power-by-power hit-stat map (Super Strength=MEL, Fire Generation=AGL, Psychic Blast=CON, Telekinesis=CON, Technopathy=INT, …): `Power_Attack_Stats.csv:3-37`.

---

## 4. The rank ladder & the Universal Table (exact numbers)

### 4.1 Rank tiers (raw value → rank → column)

Source: **Stat_Rank_Mapping.csv:2-19**. This is also the row-1 header order of **Universal_Table_FIXED.csv:1**.

| Rank | Value range | Column header in `_FIXED` | Threat level (`Stat_Rank_Mapping.csv`) |
|---|---|---|---|
| Shift_0 | 0 | `Shift_0` | None |
| Feeble | 1–2 | `Feeble` | None |
| Poor | 3–5 | `Poor` | None |
| Typical | 6–10 | `Typical` | None |
| Good | 11–20 | `Good` | None |
| Excellent | 21–30 | `Excellent` | Alpha |
| Remarkable | 31–40 | `Remarkable` | Threat 1 |
| Incredible | 41–50 | `Incredible` | Threat 2 |
| Amazing | 51–75 | `Amazing` | Threat 3 |
| Monstrous | 76–100 | `Monstrous` | Threat 4 |
| Unearthly | 101–150 | `Unearthly` | Threat 5 |
| Shift_X | 151–250 | `Shift_X` | Earthshaker |
| Shift_Y | 251–500 | `Shift_Y` | Earthbreaker |
| Shift_Z | 501–1000 | `Shift_Z` | Eartheater |
| Class_1000 | 1001–2500 | `Class_1000` | Sunbreaker |
| Class_3000 | 2501–5000 | *(see note)* | Suneater |
| Class_5000 | 5001–10000 | *(see note)* | Omnipotent |
| Beyond | 10001–999999 | *(see note)* | Beyond |

> `RULING:` **The shipped `Universal_Table_FIXED.csv` has 15 outcome columns** (`Shift_0 … Class_1000`, header row `:1`), while `Stat_Rank_Mapping.csv` defines **18 ranks** (through `Beyond`). For ranks **above `Class_1000`** (`Class_3000`, `Class_5000`, `Beyond`), **clamp the column read to the `Class_1000` column** (the rightmost shipped column). Rationale: `Class_1000` already reads ~Failed only on roll 99 (Bible §13.1), so cosmic-cosmic checks are functionally "auto-hit unless fumble"; higher tiers add no resolvable distinction on this grid. This matches `Advanced_Universal_Table.csv`, which *does* define thresholds through `Beyond` (`:27`) and can be used as the lookup *implementation* (Bible §13.1: "keep `Advanced_Universal_Table` only as the lookup implementation"). **If the owner wants distinct Class_3000+ behavior, that is an `OWNER-FORK:` to extend `_FIXED` with three more columns.**

### 4.2 The outcome grid (how a roll reads)

`Universal_Table_FIXED.csv` is a **direct lookup**: row = d100 roll (`01`..`00`, file rows `:7`–`:106`), column = `finalColumnIndex`. Read the cell → it is literally one of `Failed / Minor / Success / Major`. No threshold math at runtime; it is a 100×15 table.

The **probability profile** this produces (`Universal_Table_FIXED.csv:108-120`, the embedded summary) — these are the numbers the player implicitly feels:

| Rank | Failed% | Minor% | Success% | Major% |
|---|---|---|---|---|
| Shift_0 | 98 | 1 | 0 | 1 |
| Feeble | 24 | 45 | 30 | 1 |
| Poor | 14 | 35 | 50 | 1 |
| Typical | 5 | 29 | 60 | 6 |
| Good | 5 | 14 | 65 | 16 |
| Excellent | 0 | 14 | 61 | 25 |
| Remarkable | 0 | 9 | 56 | 35 |
| Incredible | 0 | 9 | 46 | 45 |
| Amazing | 0 | 4 | 36 | 60 |
| Monstrous | 0 | 4 | 26 | 70 |
| Unearthly | 0 | 4 | 16 | 80 |

> Note the two competing summaries: the **`_FIXED` grid's own summary** (above) is steeper at the top (Unearthly = 80% Major) than `Advanced_Universal_Table.csv:46-64` (Unearthly = 15% Major). `RULING:` **the `_FIXED` *grid itself* is the source of truth at runtime** (Bible §13.1 ships `_FIXED`); the summary table is informational. A coder must read outcomes from the 100×15 cells, **not** re-derive from either summary. If a balance pass later flattens the high-end Major curve, edit the `_FIXED` cells (data-driven, Pillar #1) — do not hardcode.

### 4.3 Critical fumble / critical success (always-rules)

Source: `Universal_Table_FIXED.csv:105-106` + design notes `:126-127`, confirmed by `Advanced_Universal_Table.csv:39-40`:
- **Roll `99` is ALWAYS `Failed`** at *every* column (critical fumble). Row `:105` is all-`Failed`.
- **Roll `00` (=100) is ALWAYS `Major`** at every column (critical success). Row `:106` is all-`Major`.
These override the column read. Set `isCritFumble`/`isCritSuccess` accordingly.

> `RULING:` Roll is **1..100**, where `100` is displayed as `00` and `99` is the fumble. Generate with `roll = Math.floor(rng() * 100) + 1`. `forcedRoll` (tests/replay) takes 1..100 directly.

---

## 5. Column Shifts — the universal currency (exact ranges)

Every modifier is ±CS; they **sum** into `netCS`, which shifts the base rank that many columns right (+) or left (−). Source registry: `Combat_Resolution_Quick_Reference.csv:30-41`, `Combat_System_Master_Reference.csv:35-43`, `Stat_Rank_Mapping.csv:22-33`.

### 5.1 General CS reference (the legend)

`Stat_Rank_Mapping.csv:23-33`: `+4CS` major power advantage … `+1CS` minor advantage … `0CS` standard … `−1CS` minor disadvantage … down to `−6CS` near-impossible. CS is a signed integer; there is no fractional CS.

### 5.2 Combat CS sources (the catalog the caller assembles)

Source: `Combat_Resolution_Quick_Reference.csv:31-41` + `Combat_System_Master_Reference.csv:36-43`.

| Source | CS | Condition | Source row |
|---|---|---|---|
| Skill bonus | +1..+4 | Per skill (Martial Arts +2; Sniper +3 to rifles at range) | `CRQR:31`, `CSMR:36/90` |
| Power bonus | +1..+5 | Per power (Fire Gen High +3 area) | `CRQR:32`, `CSMR:37` |
| Weapon accuracy | variable | Per weapon (Pistol −2CS, Assault Rifle −1CS) | `CRQR:33`, `CSMR:38` |
| Range band | +2..−3 | Point-blank +2 / Short 0 / Medium 0 / Long −1 / Extreme −2 / Max −3 (Bible §5.3) | Bible §5.3 |
| Cover | −1..−3 (def) | Partial −1 / Half −2 / Full −3 (attacker penalty) | `CRQR:35`, `CSMR:40` |
| Prone target | +1 | Target on ground | `CRQR:36` |
| Flanking | +1 | Attacking from side/behind | `CRQR:37`, `CSMR:42` |
| Wounded | −1 per 25% HP lost | At 50% HP = −2CS | `CRQR:38`, `CSMR:43` |
| Stunned | −2 | Stunned status | `CRQR:39`, `CSMR:41` |
| Blinded | −4 | Blinded status | `CRQR:40` |
| Multiple targets | −1 per extra | Attacking N>1 enemies | `CRQR:41` |
| Aim (mode) | +1 | Costs 2 AP, ×3 (Bible §5.1) | Bible §5.1 |
| Altitude height | +1..+3 | Height advantage by Z-level (Bible §5.4) | Bible §5.4 |

### 5.3 Dodge → attacker −CS (the defensive conversion)

Dodge is **not** a separate roll the defender wins; it is a **−CS the defender contributes to the attacker's column** (Bible §3.3: "Dodge converts AGL/AGL+INS → −CS for the attacker"). Two lookup tables, depending on attack type:

**Melee dodge** (use `AGL + INS`) — `SHT-dir/Combat Compendium REAL - 🦆DODGE CHART🦆.csv` (right-hand columns):

| AGL+INS | −CS to attacker |
|---|---|
| 1–19 | 0 |
| 20–39 | −1 |
| 40–59 | −2 |
| 60–79 | −3 |
| 80–99 | −4 |
| 100–119 | −5 |
| 120–139 | −6 |
| 140–169 | −7 |
| 170–199 | −8 |
| 200–299 | −9 |
| 300–499 | −10 |
| 500–999 | −11 |
| 1000–1999 | −12 |
| 2000–4999 | −13 |
| 5000–9999 | −14 |

**Ranged dodge** (use `AGL` alone) — same `DODGE CHART` (left-hand columns):

| AGL | −CS to attacker |
|---|---|
| 1–9 | 0 |
| 10–19 | −2 |
| 20–29 | −3 |
| 30–39 | −4 |
| 40–49 | −5 |
| 50–59 | −6 |
| 60–69 | −7 |
| 70–79 | −8 |
| 80–99 | −9 |
| 100–149 | −10 |
| 150–250 | −11 |
| 250–500 | −12 |
| 500–999 | −13 |
| 1000–1499 / 2500–4999 | −14 |

> `RULING:` These two charts are the canonical dodge tables (they are the only ones in the source data and they match Bible §3.3 / §5). The melee chart's higher-resolution AGL+INS band is used for `kind:'melee'` and `kind:'mental'` defense; the AGL-only chart for `kind:'ranged'`/`'tech'`. A dodging defender's contribution enters the attacker's `modifiers[]` as a `CSModifier{category:'dodge', value: <negative>}`. **A target that does not/cannot dodge (surprised, prone-and-pinned, unaware) contributes 0CS** — dodge is opt-in and costs the defender nothing but is gated by awareness/stance (Bible §5.2; gating owned by `21-tactical-combat`-class docs, not here).

### 5.4 Spine CS sources (how the strategic layer reaches the kernel)

For **non-combat checks** (investigations, social, covert) — and for combat that happens *in a place* — the caller folds in the country/city/culture/faction ±CS. These are owned by the spine docs but **consumed here** as ordinary `CSModifier` entries:

| Spine source | Example CS | Source table |
|---|---|---|
| Country: Government type | Democracy +2 legal / −1 covert; Authoritarian inverse | `Country_Attribute_Effects.csv:7` |
| Country: Corruption | High: −2 official, **+3 bribes/blackmail** | `:9` |
| Country: Military+Intel | "Security State": −2 covert, +2 official | `:36` |
| Country: Media freedom | Free: +2 media-investigation, −2 cover-ups | `:15` |
| City type | Military +2 military/security investig.; Temple +2 mystical | `City_Type_Effects.csv:5,3` |
| City crime index | High (60–80): −2 official / +2 underground | `:37` |
| City population | Mega City: +3 resources / −3 stealth | `:47` |
| Culture: same/opposed | Same +2 / similar +1 / opposed −1 social | `Culture_Region_Effects.csv:42` |
| Culture: power affinity | South Asia +2 spiritual/mystical investig. | `:11` |
| Culture: language barrier | −2 all social if no regional speaker | `:36` |
| Faction territory | Home +3 all (legal immunity); Hostile −2 all | `Country_Attribute_Effects.csv:46-49` |

> This is the literal mechanism of Bible §13.9 ("combined-effects must be **consumed** by mission-gen/pricing/difficulty"): the engine doesn't *know* about countries — the **investigation/mission caller** queries the spine, turns each effect into a `CSModifier`, and passes the bundle to the same `resolve()` that combat uses. One kernel, two callers.

### 5.5 Karma / luck reroll (optional layer)

`RULING:` The kernel exposes `forcedRoll` so a **Karma reroll** system (Bible §3.1 derived `Karma = (INT+INS+CON)/3`) can re-invoke `resolve()` with a fresh roll, spending a Karma point. The kernel does **not** manage the Karma pool — that is the combat/strategic caller's job. Default build ships **without** reroll active (`OWNER-FORK:` whether Karma rerolls are a player verb or AI-only).

### 5.6 Clamping (the only place ranks are bounded)

After summing `netCS`, shift the base column by that many indices, then **clamp**:
- `finalColumnIndex = clamp(baseColumnIndex + netCS, 0, 14)` — min `Shift_0` (index 0), max the rightmost shipped column (`Class_1000`, index 14). Source: `Advanced_Universal_Table.csv:42-43` ("Cannot shift below Shift_0 / above Beyond"); we cap at the shipped column count per §4.1.
- `Combat_Resolution_Quick_Reference.csv:6` independently states "min 0 max 11" for an 11-column legacy table; **use 0..14 for the shipped 15-column `_FIXED`** (the `:6` "11" is for the retired base table — Bible §13.1 retires it).

---

## 6. From outcome to effect (the kernel's outputs)

### 6.1 Damage multiplier

Source: `Stat_Rank_Mapping.csv:37-40`, `Advanced_Universal_Table.csv:82-85`, `Combat_Resolution_Quick_Reference.csv:46-48`:

| Outcome | Multiplier | Meaning |
|---|---|---|
| Failed | **0×** | Miss — no damage, no effect |
| Minor | **0.5×** | Glancing — half damage; **no** status effects (power-specific only) |
| Success | **1.0×** | Solid hit — full damage + standard status |
| Major | **1.5×** | Critical — 150% damage + knockback + crit-table roll + enhanced status |

The kernel returns `damageMultiplier`; **it does not compute damage.** Damage = `(weaponOrPowerBase + statBonus) × damageMultiplier − effectiveDR` is owned by the damage doc (Bible §5.5: `Final = Damage×OutcomeMult − Effective_DR`). The 15-step worked example lives in `Combat_Resolution_Quick_Reference.csv:8-16` and `Combat_System_Master_Reference.csv:3-19` — this doc's kernel is steps **3–9** of that procedure (column → CS → roll → outcome); steps 10–16 (damage, armor, knockback, status) belong to siblings.

### 6.2 Knockback handoff flag

`triggersKnockback = (outcome === 'Major') || (outcome === 'Success' && STR ≥ 40)`. Source: `Combat_Resolution_Quick_Reference.csv:47-48` ("Success: knockback if STR 40+; Major: always") and `Universal_Table_FIXED`-adjacent `Combat_System_Master_Reference.csv:52`. The **distance** is *not* computed here — it is read from the knockback ladder by the knockback doc (`SHT-dir/Combat Compendium REAL - 🙊Knockbag🙉.csv`: STR 40–49→4 sq, 50–59→6, 60–69→8, 70–79→10, 80–99→9, 100–150→10, etc.). The kernel only raises the flag.

### 6.3 Crit / injury handoff flag

`triggersCritTable = (outcome === 'Major') || calledShot`. Source: Bible §5.6, §13.2 — **one** crit pipeline: *hit → Major (or called shot) → crit table (what & where) → injury d100 (how bad)*. The kernel raises `triggersCritTable`; the crit/injury doc consumes it.

> `RULING:` honoring Bible §13.2, the kernel never references the **prototype %-roll crit table** (`SHT-dir/Combat Compendium REAL - Prototype 🩸CRIT TABLE🦴.csv`) — that table is **deprecated**. The canonical body-part crit table is `SHT-dir/Combat Compendium REAL - 🩸CRIT TABLE🦴.csv` (Smashing/Piercing/Slashing branches), feeding `GMS/Injury_System.csv`. The kernel's only job is the boolean trigger; it must not embed either crit table.

---

## 7. How it consumes the SPINE (formulas)

The kernel is spine-agnostic, but **the strategic callers must fold the spine in.** Canonical assembly for a **non-combat check** (investigation/social/covert), which is where the spine bites hardest:

```
finalCS_for_investigation =
    Σ investigatorSkillCS                                  // Complete_Skills_Talents (caller-owned)
  + countryEffectCS(country, method)                       // Country_Attribute_Effects.csv
  + cityTypeCS(city, investigationType)                    // City_Type_Effects.csv:3-21
  + cityCrimeCS(city.crimeIndex, method)                   // City_Type_Effects.csv:33-38
  + cityPopulationCS(city.popRating, axis)                 // City_Type_Effects.csv:41-47
  + cultureCS(actorCulture, targetCulture)                 // Culture_Region_Effects.csv:42
  + cultureAffinityCS(culture, investigationType)          // Culture_Region_Effects.csv:3-29
  + languageBarrierCS(actor, region)                       // Culture_Region_Effects.csv:36  (−2 if no speaker)
  + factionTerritoryCS(faction, country)                   // Country_Attribute_Effects.csv:46-49
```

…and the **acting stat** is `INT` (primary investigation stat, `Primary_Stats_Spec.csv:6`) or `(INT+INS)/2` "Awareness" for clue analysis (`Primary_Stats_Spec.csv:15`). Then call `resolve({kind:'reason_feat', statValue, modifiers: <the CSModifier[] from the sum above>})`. The same pattern for combat *in a place* (e.g., a "Lawless" country grants `+3CS criminal methods`, `Country_Attribute_Effects.csv:42`, which a black-market combat encounter would fold in).

**Combos** are pre-summed spine entries (Bible §6.1, §8): "Security State", "Failed State", "Innovation Hub", "LSW Haven +4CS recruitment", etc. (`Country_Attribute_Effects.csv:36-42`). These are computed by the combined-effects system (`14-combined-effects.md`) and arrive as single `CSModifier` rows — the kernel never sees the raw country columns.

**Personality → no CS, but → target choice.** The kernel does not consume personality, but the **AI caller** does: `SHT-dir/Combat Compendium REAL - 🎯PERSONALITY TARGET SELECTION🎯.csv` maps each of the **20 personality IDs → a target preference 1–5** (1=most health, 2=least health, 3=major threat/most-damage-dealt, 4=minor threat, 5=random). The full row (personality 1→pref 1, 2→3, 3→4, 4→4, 5→1, 6→3, 7→4, 8→1, 9→2, 10→2, 11→1, 12→4, 13→2, 14→3, 15→3, 16→3, 17→2, 18→5, 19→5, 20→2) is the AI's target selector *before* it calls `resolve()`. This is the link from §5.10 of the Bible to the engine: personality picks **who**, the kernel resolves **whether it lands**.

---

## 8. Edge cases & failure modes

| # | Case | Rule | Source / label |
|---|---|---|---|
| E1 | Roll = 99 | Always `Failed`, override column | `Universal_Table_FIXED.csv:105` |
| E2 | Roll = 00/100 | Always `Major`, override column | `:106` |
| E3 | `netCS` shifts past `Shift_0` | Clamp to index 0 (`Shift_0`); a Shift_0 column is ~98% Failed (`:110`) — heavy penalty, not an error | `Advanced_Universal_Table.csv:42` |
| E4 | `netCS` shifts past rightmost shipped column | Clamp to index 14 (`Class_1000`) | §4.1 RULING |
| E5 | Stat value above `Class_1000` (>2500) | Read on `Class_1000` column (clamp) | §4.1 RULING |
| E6 | Stat value 0 | Maps to `Shift_0` (index 0); valid for "no capability" (e.g., a robot's CON) | `Stat_Rank_Mapping.csv:2` |
| E7 | Negative stat value | `RULING:` clamp to 0 → `Shift_0`. Stats should never be negative (drain/damage floors at 0). |
| E8 | Defender cannot dodge (surprised/pinned/unaware) | Dodge contributes **0CS**; do not auto-apply the dodge table | §5.3 RULING |
| E9 | Stacking dodge with cover | Both apply (dodge −CS + cover −CS sum); no diminishing-returns rule in source → they stack linearly | `CRQR:34-35` (separate rows) |
| E10 | Minor outcome + status effect | Minor applies **no** status (only power-specific) and **0.5×** damage | `Advanced_Universal_Table.csv:83` |
| E11 | Major but damage type is non-physical (e.g., Fire) | `triggersKnockback=false` for non-STR/non-physical (fire "doesn't cause knockback") | `Combat_System_Master_Reference.csv:115` (worked example "No Knockback / Energy attack") |
| E12 | Two summaries disagree (§4.2) | Grid cells win; never re-derive from a summary table | §4.2 RULING |
| E13 | `forcedRoll` out of 1..100 | Throw/assert in dev; clamp to 1..100 in prod | `RULING:` |
| E14 | Mental attack vs physical armor | Outcome unchanged; armor bypass is a **damage-doc** concern, not the kernel's (`Major` still `Major`) | `Power_Attack_Stats.csv:48`; Bible §5.5 |
| E15 | Contested check (grapple, psychic persuasion) | `RULING:` resolve as **attacker `resolve()` with defender's stat folded as a −CS via the dodge-style conversion** — *not* two independent rolls. Grapple = MEL vs (STA+MEL)/2 (Bible §5.9); the defender's contested value becomes a `−CS` using the melee dodge band on that value. Keeps everything single-roll on one table. |
| E16 | Initiative tie | `RULING:` higher raw `(AGL+INS)` breaks the tie; if still tied, higher INS, then coin-flip via injected RNG (deterministic under replay) |

**Failure modes to guard in code:**
- **Grid not fully loaded** → `resolve()` must assert the grid is 100×15 at boot (`Universal_Table_FIXED.csv` rows 7–106 × 15 cols) and refuse to run on a partial table (silent wrong-outcome is worse than a crash).
- **CS double-counting** → callers must build `modifiers[]` from disjoint sources; the kernel sums blindly. Provide a dev-mode warning if two `CSModifier` share the same `source` string.
- **RNG nondeterminism under time-travel replay** → always thread `rng`/`forcedRoll`; never call `Math.random()` inside the kernel directly.

---

## 9. UI / UX hooks

**Combat overlay (symbolic grid).** Per the locked context, combat is plain grid + glyphs and the math is hidden by default (`FIST GDD v02.txt:1071`). The hooks:
- **Hit-chance preview** before committing AP: show the *outcome distribution* of the resolved column as a compact bar — `Failed / Minor / Success / Major` %s read straight from that column's profile (§4.2). Not raw numbers; a 4-segment bar.
- **CS breakdown tooltip** (advanced/optional, F-key): list `appliedModifiers[]` with their labels and signed values, then the net column. This is the only place the player sees "Remarkable −1CS = Excellent". Off by default; a toggle for tactics-minded players.
- **Result flash:** map outcome → glyph/color. `Failed` = grey "MISS"; `Minor` = white "graze"; `Success` = yellow "HIT"; `Major` = red "CRIT!" with the knockback/crit follow-up animation. Colors come from `Advanced_Universal_Table.csv:3` (White/Green/Yellow/Red result legend) — `RULING:` map Green(Minor)/Yellow(Success)/Red(Major)/White(Failed) but recolor per the project palette (no purple).
- **Flight:** altitude is an integer label on the unit glyph + a wing/shadow indicator; the **only** way altitude touches this kernel is as an `altitude` `CSModifier` (§5.2). No 3D.

**Phone / laptop (investigation & email).** When an investigation resolves on this kernel, surface the result as **diegetic copy, not dice**: the email/news result template is chosen by `outcome` (Bible §7.4 → §7.1). A `Major` investigation reads "Breakthrough — full intel + a lead"; a `Failed` reads "Dead end — and you've been noticed" (the latter feeding detection-risk). The CS breakdown can appear as a one-line "why" ("+3 corruption bribe channel, −2 language barrier") in an *Advanced* expander.

**World map.** The kernel itself has no map UI, but **threat-level gating** uses the same ladder (`Stat_Rank_Mapping.csv` Threat_Level column): a sector's encounter threat tier and a unit's stat-derived threat tier come from one ladder, so the map's "can my squad handle this?" readout and the combat resolver speak the same language.

**Determinism / time-travel:** every `resolve()` call should log `{roll, finalColumnIndex, outcome}` to the combat replay buffer so the Time Walker save (Bible §11) can re-run a battle exactly via `forcedRoll`. The UI's "rewind" affordance depends on this kernel being pure + seedable.

---

## 10. Integration points (reads / writes)

**Reads (inputs the kernel needs the caller to supply):**
- Acting unit's stat for `kind` ← `Character` record (`07-character-model.md`; stats from `Primary_Stats_Spec.csv`).
- `modifiers[]` ← assembled by the caller from: skills/talents/martial-arts (`Complete_Skills_Talents.csv`), powers (`LSW_Power_Combat_Mechanics.csv`, `Power_Attack_Stats.csv`), weapons (`Weapons_Complete.csv`), stance/mode (`Combat_Modes_Stances.csv`), cover/range/altitude/position (tactical doc), status/wound (`Status_Effects_Complete.csv`), dodge (§5.3 charts), and the **spine** (§5.4 tables).
- Ladder + grid ← `Stat_Rank_Mapping.csv` + `Universal_Table_FIXED.csv` (loaded once at boot).

**Writes (outputs other systems consume):**
- `outcome` + `damageMultiplier` → **damage system** (Bible §5.5; `DAMAGE TABLE`, `armorIntegration.ts`).
- `triggersKnockback` → **knockback system** (`Knockbag` chart; `knockbackSystem.ts`).
- `triggersCritTable` → **crit/injury pipeline** (`CRIT TABLE` → `Injury_System.csv`; Bible §5.6).
- `outcome` → **status-effect system** (Minor=none, Success=standard, Major=enhanced; `Status_Effects_Complete.csv`).
- `outcome` → **investigation consequences** (`Investigation_Consequences.csv`) and **email/news templates** (`Email_Investigation_Templates.csv`, Bible §7).
- `outcome` → **fame/reputation/legal** deltas on combat resolution (collateral on `Major` overkill; `Public_Perception.csv`, Bible §9).
- `roll`/`finalColumnIndex` → **replay buffer** for the time-travel save (Bible §11).

**Sibling consumers that must call THIS kernel (not roll their own):** combat scene (`CombatScene.ts`), investigations (`09-investigations.md`), AI threat assessment (`104-ai-director-difficulty.md`), strength/throw feats, door/lock breaching (`Door_Interaction_System.csv` STR checks), stealth detection (`Sound_Detection_System.csv` INS perception checks). `RULING:` **no system may implement its own d100-to-outcome logic** — duplicate resolvers are the #1 contradiction risk the Bible's §13.1 ruling exists to kill.

---

## 11. RULING: notes (collected)

1. **`resolve()` is a pure, seedable function** — no engine/store/DOM deps; enables one kernel for combat + investigations + replay. (§2.4)
2. **Ship the 15-column `_FIXED` grid; clamp ranks above `Class_1000` to its rightmost column.** Use `Advanced_Universal_Table.csv` only as the threshold *implementation* if a coder prefers thresholds to a 100×15 array — both must produce identical outcomes; the array is canonical. (§4.1, §4.2)
3. **The `_FIXED` grid cells are the runtime truth**; the two embedded probability summaries are informational and disagree — never re-derive outcomes from a summary. (§4.2)
4. **Roll is 1..100**, `99`=always-Fail, `00`/100=always-Major. (§4.3)
5. **Dodge is a defender-supplied −CS, not a second roll**, via the two `DODGE CHART` bands (AGL+INS for melee/mental, AGL for ranged). Non-dodging defenders contribute 0. (§5.3)
6. **Contested checks (grapple/psychic-persuasion) resolve single-roll** by folding the defender's contested stat into the attacker's column as a −CS. (E15)
7. **Clamp `finalColumnIndex` to 0..14** (Shift_0 .. Class_1000); the legacy "0..11" cap is for the retired base table. (§5.6)
8. **Kernel raises handoff flags** (`triggersKnockback`, `triggersCritTable`) but computes neither distance nor injury — those are sibling docs. (§6.2, §6.3)
9. **Deprecate the prototype %-crit table**; canonical crit = body-part `CRIT TABLE` → `Injury_System` (Bible §13.2). The kernel references neither. (§6.3)
10. **Non-physical Major = no knockback** (fire/energy/mental); knockback gates on STR/physical. (E11)
11. **Negative/zero stats clamp to `Shift_0`.** (E6, E7)
12. **Color legend** Failed=White, Minor=Green, Success=Yellow, Major=Red (from `Advanced_Universal_Table.csv:3`), recolored to project palette. (§9)

---

## 12. OWNER-FORK: notes

1. **Class_3000 / Class_5000 / Beyond distinct columns.** The shipped `_FIXED` grid stops at `Class_1000`; everything cosmic-plus currently clamps there (§4.1). Whether the very top of the ladder needs three *more* outcome columns (to differentiate Galactus from a Celestial in a fight) is a product call — it only matters if the campaign ever pits two `Class_3000+` entities against each other, which the 2,472-day human-scale story may never do.
2. **High-end Major curve.** `_FIXED`'s own summary has Unearthly at **80% Major** (§4.2), far steeper than `Advanced_Universal_Table`'s 15%. Shipping `_FIXED` as-is makes top-tier characters *very* swingy/lethal. Flattening this (editing the high-roll cells) is a balance/feel choice for the owner — the data supports either.
3. **Karma rerolls as a player verb.** The kernel supports rerolls via `forcedRoll`/re-invoke (§5.5), but whether the *player* spends Karma to reroll (vs. Karma being AI/flavor only) changes the tactical feel and the save/replay economy. Off by default.
4. **CS breakdown visibility default.** Whether the per-attack CS tooltip (§9) is **hidden** (pure symbolic feel) or **shown** (tactics-forward) by default is a UX/audience call. Spec defaults to hidden with a toggle.
5. **Dodge as opt-in cost.** Source data lets dodge contribute its −CS "for free" (awareness-gated). The owner may want dodge to cost a reaction/AP (X-Com-ish) to make heavy-flanking tactics matter more — a combat-economy fork, not a kernel change.

---

## 13. Open questions

1. **Initiative as a kernel check?** Initiative is `(AGL+INS)/2` mapped to a rank then "rolled" (`Combat_Resolution_Quick_Reference.csv:2`) — but is it a *resolve()* call (roll on the column) or just a sorted modifier sum? The worked example implies a column lookup; the Bible §5.1 implies a deterministic sum + mods. **Recommendation:** deterministic sort by `(AGL+INS)/2 + threat/power/surprise mods` (Bible §5.1) with the kernel used only for *contested* initiative ties (E16). Confirm with combat-flow doc.
2. **Does Minor ever apply status?** `Advanced_Universal_Table.csv:83` says "no status (power-specific only)"; `Universal_Table_FIXED`-adjacent `Stat_Rank_Mapping.csv:38` says "may still apply status." `RULING:` taken as **power-specific only** (E10), but flag for the damage-types doc to confirm per-type.
3. **Range bands as fixed CS vs per-weapon brackets.** Bible §5.3 gives generic range CS; `equipmentTypes.ts` (per CLAUDE.md) gives per-weapon optimal ranges. Which authority wins when they conflict? **Recommendation:** per-weapon bracket overrides the generic band when present; generic band is the fallback. Owned by the weapon/equipment doc.
4. **Wounded −CS granularity.** "−1CS per 25% HP lost" (`CRQR:38`) — is that floor(HP%/25) computed off `max HP` or current? **Recommendation:** `floor((1 − currentHP/maxHP) / 0.25)` so 50% loss = −2. Confirm with status/injury doc.
5. **Should the spine fold into *combat* to-hit, or only non-combat checks?** §5.4/§7 fold spine CS into investigations cleanly; whether a country's stats also shift *tactical* to-hit (vs only encounter setup/difficulty) needs a design call so combat doesn't become location-swingy. **Recommendation:** spine affects encounter *generation/difficulty* and *non-combat* checks; tactical to-hit uses only tactical CS (cover/range/skill/power/status). Confirm with combined-effects doc (§13.9).
```

