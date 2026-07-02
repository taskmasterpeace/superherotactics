# 27 — Powers + BAMPI + Power Activation Engine

> **System owner doc.** Build-ready spec for the **30-power LSW catalog**, the **BAMPI attack-shape descriptor** (Beam / Area / Melee / Projectile / Instant), and the **Power Activation Engine** — the single `activatePower(unit, power, target, ctx)` function that takes any of the 30 powers and resolves it on the symbolic combat grid (or as a non-combat utility). This is Bible **§13 ruling #6**: *"make BAMPI a first-class attack descriptor + a Power Activation Engine — the missing piece that makes all 30+ powers actually castable."* Today only ~2 of 30 powers fire (`SHT_MECHANICS_BIBLE.md:326`).
>
> **Status:** spec (v1.0). Code today has a UI shell (`MVP/src/components/PowersPanel.tsx`) and a thin `PowerData` interface (`MVP/src/game/EventBridge.ts:192`) with no resolver. This doc is the canonical engine that shell must converge on.
>
> **Bible alignment:** `SHT_MECHANICS_BIBLE.md` §4 (powers in the character model), §5.4 (flight/altitude), §5.5 (attack resolution & damage), §5.6 (crit→injury), §5.7 (status), §5.12 (BAMPI + Power Activation Engine), §13 rulings #4/#5/#6/#7/#8, §14 (data→table map: Powers row).
>
> **Sourcing rule (LOCKED).** Every number/formula below cites a source table. A value with no table is marked **`RULING:`** (a Bible-consistent design call) or **`OWNER-FORK:`** (a product choice only the owner makes). Source files live under `docs/csv-source-data/` (abbrev. **CSV/**), `docs/csv-source-data/Game_Mechanics_Spec/` (abbrev. **GMS/**), and root `SuperHero Tactics/` (abbrev. **SHT-dir/**).
>
> **Primary source tables (opened for this spec):**
> - **CSV/LSW_Powers_Complete_Database.csv** — the 30 powers (POW_001..POW_030): category, subcategory, tags, low/high descriptions, observed regions, combat/investigation application, drawbacks. Plus the category/tag/rarity/origin reference rows.
> - **CSV/LSW_Power_Combat_Mechanics.csv** — per-power **Low & High** combat rows: AP cost, range (squares), duration, attack type, **damage formula**, **column-shift bonus**, area of effect, bypass-armor, status caused, drawback, environmental interaction, power-vs-power counter, **threat-level scaling**.
> - **GMS/Power_Attack_Stats.csv** — which **Hit_Stat** (MEL/AGL/CON/INT) and **Damage_Stat** (STR/Power Rank/Health Spent) each power uses, plus the attack-stat & damage-stat rules.
> - **SHT-dir/Combat Compendium REAL - 🪓BAMPI🔫.csv** — the five attack shapes and their core notes (Beam maintains aim / chargeable / vulnerable; Area cannot be aimed / high collateral; Melee = martial-artist rule; Projectile; Instant).
> - **CSV/Flight_Altitude_System.csv** — the 7 altitude levels (Z0–Z6), movement/AP cost, ±CS by altitude, weapon falloff, flight-power-type rows (Natural/Tech/Magical/Telekinetic), combat-type rows (Dive/Hover/Strafe/Aerial-Grapple).
>
> **Secondary sources:** GMS/Stat_Rank_Mapping.csv (rank ladder, ±CS reference, **threat level**), GMS/Universal_Table_FIXED.csv (the roll grid), GMS/Origin_Types.csv & GMS/Origin_Damage_Interactions.csv (origin immunities, EMP, bleed gate), CSV/Building_Flight_Limitations.csv (indoor ceiling caps), GMS/Penetration_Continuation_System.csv (Projectile pass-through), CSV/Combat Compendium REAL - 🔪DAMAGE TYPE TABLE🔫.csv & CSV/Combat Compendium REAL - 🩸CRIT TABLE🦴.csv & CSV/Combat Compendium REAL - 😢EFFECT_STATUS😴.csv (damage types / crit / status), GMS/Country_Attribute_Effects.csv & GMS/Culture_Region_Effects.csv (the spine), SHT-dir/Combat Compendium REAL - 🎯PERSONALITY TARGET SELECTION🎯.csv (AI targeting), SHT-dir/SHT__ Origins, Threat Levels & Powers.txt.
>
> **Sibling docs (hand-off contracts, NOT re-specced here):**
> - `20-core-resolution-4cs.md` owns `resolve(stat, netCS, roll)` → {Failed/Minor/Success/Major}. This doc *calls* it; it never re-rolls the table.
> - `21-tactical-combat-grid.md` owns the **Z0–Z6 altitude integer**, range bands, cover, LOS, AP economy, and produces the **net-CS / valid-target** inputs. This doc consumes its `getAltitudeCS()`, `getRangeCS()`, `getCoverCS()`, and indoor-ceiling cap.
> - `22-damage-model-types.md` owns the damage-type rider table and `applyDamage(target, amount, type, penetration)` (armor pools, bleed gate). This doc passes it the `damage` + `damageType` a power produces.
> - `23-crit-injury.md` owns the crit→injury pipeline a **Major** triggers. This doc only flags `isMajor`.
> - `24-status-effects.md` owns the status catalog + durations. This doc names the `Status_Effect_Caused` string from the mechanics CSV; that doc applies it.
> - `07-character-model.md` owns the `Character` record (which powers a unit has, their **power rank** value, origin, threat level). This doc consumes `unit.powers[]`.
> - `11/12/13-*` own the spine ±CS tables. This doc consumes their summed shift for ranged/energy/mental **to-hit** and for power **availability/affinity**.

---

## 1. Overview & player fantasy

A power is **a verb your hero owns that the world has to answer.** The 30 LSW powers (`LSW_Powers_Complete_Database.csv:2-31`) are the Marvel-Super-Heroes feel of the game: Super Strength that throws a bus, Psychic Blast that ignores armor and passes through walls, Flight that puts you on a rooftop the ground troops can't reach, Reality Warping that breaks the rules at a sanity-shredding cost. The **player fantasy of this layer** is *"my power is my identity, and the game models exactly what it does — its reach, its cost, who it beats, what it breaks, and what it costs me to use it."*

The signature design move is **BAMPI** (`Combat Compendium REAL - 🪓BAMPI🔫.csv`): every power (and every weapon) carries one of **five attack shapes** — **B**eam, **A**rea, **M**elee, **P**rojectile, **I**nstant — and that single letter drives *how* the power resolves on the grid:

- A **Beam** (sustained energy stream) you hold across turns to keep damaging; you can **charge** it for more damage but you stand still and become vulnerable, and you risk hitting property/people (`BAMPI.csv:1-5`).
- An **Area** power **cannot be aimed** and has a **high chance of harming property or people** (`BAMPI.csv:1,2` — Area column) — it hits a zone with center→edge falloff, and (Bible §5.4 ruling #4) loses effect at high altitude.
- A **Melee** power uses MEL, range 0–1, and opens the wrestling state machine (`Power_Attack_Stats.csv:3,45,50`).
- A **Projectile** travels, **can be dodged/intercepted**, and penetrates/continues through targets and cover (`Penetration_Continuation_System.csv:6-10`).
- An **Instant** power is hitscan (laser/psychic) and **cannot be dodged by anyone slower than light** (`DAMAGE TYPE TABLE🔫.csv:28` — Laser line; Bible §5.12).

Because combat is **symbolic** (Bible §5: plain grid + glyphs; flight = an altitude integer + a wing/shadow indicator, not 3D), the *full* rules still resolve — the player reads "this Beam is charging (it's locked in place, glowing), this Area will catch two civilians, this flyer is at Z4 so my pistol is at −2CS" at a glance. The **Power Activation Engine** (`activatePower`) is the one function that makes this true for all 30 powers instead of the ~2 wired today — it branches on BAMPI, sums the spine/altitude/range CS, calls the shared `resolve()`, and routes the result into damage / status / movement / utility.

And powers reach the **meta-game**: every power has an **Investigation_Application** (`LSW_Powers_Complete_Database.csv` col 11) and **Observed_Regions** (col 9) that the spine consumes — a region's **power affinity** (`Culture_Region_Effects.csv:11` South Asia +2CS mystical) decides which powers your recruits *have*, and a power like Technopathy or Psychic Persuasion is a literal investigation method on the laptop. *The power isn't just a combat button; it's a key the living world recognizes.*

---

## 2. Data schema (fields / types)

TypeScript-flavored. Powers are **data loaded from CSV at boot**, joined across the three power tables by `Power_Name`. Nothing here is hand-coded per power.

```ts
// ============================================================================
// 2.1 BAMPI — the attack-shape descriptor (Bible §5.12)
// Source: SHT-dir/Combat Compendium REAL - 🪓BAMPI🔫.csv
// ============================================================================
type BampiShape = 'Beam' | 'Area' | 'Melee' | 'Projectile' | 'Instant';

// ============================================================================
// 2.2 POWER DEFINITION — joined from the 3 primary tables, keyed by Power_Name.
// ============================================================================
type PowerCategory =        // LSW_Powers_Complete_Database.csv col 3
  | 'Physical' | 'Mental' | 'Elemental' | 'Energy' | 'Technology'
  | 'Temporal' | 'Spatial' | 'Cosmic' | 'Physics' | 'Sonic' | 'Reality';

type AttackType =           // LSW_Power_Combat_Mechanics.csv col 5 (Attack_Type)
  | 'Physical' | 'Energy' | 'Mental' | 'Movement' | 'Defense'
  | 'Utility' | 'Reality';

type HitStat   = 'MEL' | 'AGL' | 'CON' | 'INT' | 'NA';   // Power_Attack_Stats.csv col 3
type DamageStat= 'STR' | 'PowerRank' | 'HealthSpent' | 'Variable' | 'NA'; // col 4

type PowerLevel = 'Low' | 'High';   // LSW_Power_Combat_Mechanics.csv col 2

// One row of the combat-mechanics table (there are TWO per power: Low + High).
interface PowerCombatTier {
  level: PowerLevel;              // 'Low' | 'High'                       (col 2)
  apCost: number;                // Action_Point_Cost                    (col 3)
  range: RangeSpec;              // Range_Squares: number | 'Self'|'Touch'|'Special'|'Unlimited' (col 4)
  durationTurns: DurationSpec;   // Duration_Turns: number|'Instant'|'Sustained'|'Permanent'|'Special' (col 5)
  attackType: AttackType;        // Attack_Type                          (col 5)
  damageFormula: string;         // Damage_Formula (e.g. 'STR+20 damage','25 psychic damage','No damage') (col 6)
  columnShift: string;           // Column_Shift_Bonus (e.g. '+3CS Stealth','+2CS lifting','-') (col 7)
  aoe: string;                   // Area_of_Effect ('Single target','Area 5x5','Self','Multiple targets','Line of sight') (col 8)
  bypassArmor: string;           // Bypass_Armor ('No','Physical armor only','All armor','Energy armor only','All') (col 9)
  statusCaused: string;          // Status_Effect_Caused (maps to 24-status-effects)  (col 10)
  drawback: string;              // Possible_Drawback                    (col 11)
  environmentInteraction: string;// Environmental_Interaction            (col 12)
  counter: string;               // Power_vs_Power_Interaction (what counters it)     (col 13)
  threatScaling: string;         // Threat_Level_Scaling (e.g. '+10 damage per threat level') (col 14)
}

interface PowerDef {
  // -- identity (LSW_Powers_Complete_Database.csv) --
  id: string;                    // Power_ID 'POW_001'                   (col 1)
  name: string;                  // Power_Name                           (col 2)
  category: PowerCategory;       //                                      (col 3)
  subcategory: string;           // Enhancement|Movement|Defense|Stealth|Attack|Control|Manipulation|... (col 4)
  tags: string[];                // Power_Tags (split on ',')            (col 5)
  lowDesc: string;               // Low_Level_Description                (col 7)
  highDesc: string;              // High_Level_Description               (col 8)
  observedRegions: string[];     // Observed_Regions (split on ',')      (col 9) — SPINE input
  combatApplication: string;     // Combat_Application                   (col 10)
  investigationApplication: string; // Investigation_Application         (col 11) — META input
  drawbacks: string;             // Possible_Drawbacks                   (col 12)

  // -- resolution (Power_Attack_Stats.csv) --
  bampi: BampiShape;             // RULING §3.1: derived from Attack_Type+AoE+range (see mapping table)
  hitStat: HitStat;              // Hit_Stat                             (Power_Attack_Stats col 3)
  damageStat: DamageStat;        // Damage_Stat                          (col 4)
  attackStatNotes: string;       // Notes                                (col 5)

  // -- the two tiers (LSW_Power_Combat_Mechanics.csv: Low row + High row) --
  tiers: { Low: PowerCombatTier; High: PowerCombatTier };

  // -- derived for engine (computed at load) --
  isAttack: boolean;             // hitStat !== 'NA' && damageFormula !== 'No damage'
  isSustained: boolean;          // any tier duration === 'Sustained' (Flight, Durability)
  isChargeable: boolean;         // bampi === 'Beam' (BAMPI.csv: "Units can charge attacks")
  damageType: DamageSubType;     // RULING §3.2: mapped from category → DAMAGE TYPE TABLE sub-type
}

type RangeSpec    = number | 'Self' | 'Touch' | 'Special' | 'Unlimited';
type DurationSpec = number | 'Instant' | 'Sustained' | 'Permanent' | 'Special';

// ============================================================================
// 2.3 RUNTIME — what a unit carries (joins to 07-character-model.md Character)
// ============================================================================
interface UnitPower {
  defId: string;                 // -> PowerDef.id
  rank: number;                  // power's raw rank value (Stat_Rank_Mapping ladder); maps to a UT column
  tierInUse: PowerLevel;         // 'Low' below a rank threshold, 'High' at/above (RULING §3.4)
  currentCooldown: number;       // turns remaining (RULING §3.5 — no cooldown column in source)
  sustainedActive: boolean;      // for Flight/Durability/Invisibility/Beam-maintained
  chargeStacks: number;          // 0..MAX_CHARGE for Beam (RULING §4.1)
  aimLockedTarget?: UnitId;      // Beam maintained-aim target across turns
}

// ============================================================================
// 2.4 ENGINE CALL/RETURN CONTRACT
// ============================================================================
interface ActivationContext {
  attacker: Unit;
  power: UnitPower;
  def: PowerDef;
  targets: GridTarget[];         // resolved by BAMPI shape (single / line / zone / self)
  netSpineCS: number;            // summed from 11/12/13 spine for ranged/energy/mental to-hit
  altitudeCS: number;            // from 21-grid getAltitudeCS(attacker, target)
  rangeCS: number;               // from 21-grid getRangeCS(weaponRange, distance)
  coverCS: number;               // from 21-grid getCoverCS(target)
  roll: number;                  // d100; injected (testable / deterministic in sims)
}

interface ActivationResult {
  fired: boolean;                // false if precondition failed (no AP, no LOS, on cooldown, no rank)
  failReason?: string;
  perTarget: Array<{
    targetId: UnitId;
    outcome: Outcome;            // Failed|Minor|Success|Major (from 20-resolve)
    damage: number;              // after outcome multiplier, BEFORE 22-armor
    damageType: DamageSubType;
    bypassArmor: string;         // passed to 22-damage so it picks the right DR pool
    isMajor: boolean;            // -> 23-crit-injury
    statusToApply?: string;      // -> 24-status-effects
    knockbackSquares: number;    // RULING §5.3 (uses STR rank, Bible §5.5 / Power_Attack_Stats:59)
  }>;
  selfEffects: SelfEffect[];     // STA drain, health spent, charge-vulnerability, sanity, drawback proc
  apSpent: number;
  fxEvent: PowerFxEvent;         // -> EventBridge for the symbolic-grid overlay (§7)
}
```

---

## 3. The 30 powers — exact numbers (cited per row)

All numbers in §3.6 come **verbatim** from `LSW_Power_Combat_Mechanics.csv` (two rows per power: Low, High) and `Power_Attack_Stats.csv` (Hit/Damage stat). The loader joins them by `Power_Name`. **No value here is invented.**

### 3.1 BAMPI derivation (RULING — the one rule that wires shapes)

The five-shape `BAMPI.csv` lists the shapes but does **not** tag each of the 30 powers. **RULING (Bible §5.12, §13 #6):** derive `bampi` deterministically from the data already present, by this priority table:

| If `Attack_Type` / `AoE` / `Range` is… | → BAMPI | Rationale (source) |
|---|---|---|
| `Attack_Type=Movement` or `Defense` or `Utility` with `Damage_Formula='No damage'` | **(non-attack)** — `bampi=Melee` placeholder, `isAttack=false` | These are buffs/utility (`Power_Attack_Stats.csv:4-6,26-30`) |
| `Range='Touch'` or `Range≤1`, `Attack_Type=Physical` | **Melee** | range 0–1 + MEL (`BAMPI.csv:1` Melee col; `Power_Attack_Stats.csv:3`) |
| `AoE` contains `Area NxN` | **Area** | "Cannot be aimed; high collateral" (`BAMPI.csv:1,2`) |
| `Damage_Type∈{Laser, Psychic/Mental, Disintegration}` (hitscan) **and** `AoE='Single target'` | **Instant** | "cannot be dodged by sub-light" (`DAMAGE TYPE TABLE🔫.csv:28`; Bible §5.12) |
| `Attack_Type=Energy` **and** `Duration` sustained/maintained | **Beam** | "maintains aim over time to continue damage; chargeable" (`BAMPI.csv:1-5`) |
| else ranged with a travel path (`Range`=number, `AoE='Single target'/'Line of sight'`) | **Projectile** | "travels, can be dodged/intercepted" (Bible §5.12; `Penetration_Continuation_System.csv`) |

> **RULING:** Mental attacks (`Psychic Blast` single-target) resolve as **Instant** (hitscan, "passes through walls" `LSW_Power_Combat_Mechanics.csv:8`); the **High** tier `Area 5x5` (`:9`) flips it to **Area**. A power's BAMPI can therefore differ Low vs High (Psychic Blast Low=Instant, High=Area; Fire Generation Low=Projectile, High=Area; Sound Absorption Low=Area utility, High=Area attack). The loader computes `bampi` **per tier**.

### 3.2 Damage-type mapping (RULING — power → DAMAGE TYPE TABLE)

The power CSVs say "fire damage / psychic damage / disintegration" in prose; the rider system lives in `DAMAGE TYPE TABLE🔫.csv` + `Origin_Damage_Interactions.csv`. **RULING:** map each power's `category`/wording to a `Damage_SubType` so the damage doc applies the right rider (fire spreads, electrical ×2 vs Construct, laser cannot be dodged, etc.):

| Power(s) | Damage_SubType (source row) |
|---|---|
| Super Strength (melee) | `SMASHING_MELEE` → knockback (`Origin_Damage_Interactions.csv:19`) |
| Fire Generation / Manipulation | `FIRE`/`THERMAL` → burning DOT (`:33,39`; `DAMAGE TYPE TABLE🔫.csv:22`) |
| Psychic Blast / Persuasion / Memory Imprinting | `MENTAL` → bypasses physical armor (`DAMAGE TYPE TABLE🔫.csv:36-37`) |
| Bio-Energy Projection / Energy Siphoning | `PURE_ENERGY` (Siphon rider heals attacker, `DAMAGE TYPE TABLE🔫.csv:43`) |
| Molecular Disintegration | `DISINTEGRATION` → bypasses all armor (`:37`; `DAMAGE TYPE TABLE🔫.csv:39`) |
| Metal Manipulation / Telekinesis / Gravitational (thrown) | `IMPACT`/`THROWN` → knockback (`DAMAGE TYPE TABLE🔫.csv:9,17`) |
| Sound Absorption (released) / Harmonic Resonance | `SONIC` → knockback rider (`Origin_Damage_Interactions.csv:29`) |
| Reality / Chrono-Spatial / Probability | `SPIRITUAL` ("Affects all origins" `DAMAGE TYPE TABLE🔫.csv:40`) |

### 3.3 Hit-stat & damage-stat (verbatim from `Power_Attack_Stats.csv`)

| Power | Hit_Stat | Damage_Stat | Source line |
|---|---|---|---|
| Super Strength | MEL | STR | `Power_Attack_Stats.csv:3` |
| Fire Generation | AGL | Power Rank | `:9` |
| Fire Manipulation | CON | Power Rank | `:10` |
| Psychic Blast | CON | Power Rank | `:11` |
| Bio-Energy Projection | CON | Health Spent | `:12` |
| Psychic Persuasion / Memory Imprinting | CON | — (contested) | `:15-16` |
| Telekinesis | CON | Power Rank | `:20` |
| Metal Manipulation | CON | Variable | `:21` |
| Gravitational Field | CON | Variable | `:22` |
| Molecular Disintegration | CON | Power Rank | `:23` |
| Reality Warping / Chrono-Spatial / Probability / Quantum / Time Travel | CON | Variable / — | `:33-37` |
| Technopathy | INT | Variable | `:40` |
| Super Speed / Durability / Flight / Invisibility / Adaptive Camo / Dimensional Storage / Enhanced Inventing | N/A | N/A (not attacks) | `:4-6,26-30` |

**Attack-stat rules** (`Power_Attack_Stats.csv:43-50`): physical-touch → MEL; thrown/ranged → AGL; energy projection → AGL ("like aiming"); mental/psychic → CON; tech → INT or AGL; grappling → MEL contested by target MEL/STR. **Damage-stat rules** (`:52-59`): Super Strength STR+power; energy/mental → power rank (mental bypasses physical armor); **knockback always uses STR rank regardless of power type** (`:59`).

### 3.4 Low vs High tier selection (RULING)

Every power has a **Low** and **High** row. The CSV gives no rank cutoff. **RULING (Bible §3.2 ladder + §4 threat levels):** a unit fires the **High** tier when its power `rank` ≥ **Remarkable (31)** (= Threat 1 on the LeFevre scale, `Stat_Rank_Mapping.csv:8`); otherwise **Low**. This is the same line the Bible uses for "low superhuman." `tierInUse` is computed once at load and cached on `UnitPower`.

> **OWNER-FORK:** alternative cutoff is **Incredible (41 / Threat 2)** if playtests find too many Low-tier heroes jumping to High. The threshold is a single constant `HIGH_TIER_MIN_RANK` (default 31) — owner picks.

### 3.5 Cooldowns (RULING — no source column)

`LSW_Power_Combat_Mechanics.csv` has **no cooldown column** (only AP cost + duration). The thin code `PowerData` does carry `cooldown` (`EventBridge.ts:198`). **RULING:** cooldown is **0 by default** (powers are gated by AP, by `Sustained` upkeep, and by per-use **drawbacks/STA drain** — that *is* the economy). Exceptions, set as data overrides:

| Power | Cooldown (turns) | Why (source-anchored) |
|---|---|---|
| Time Travel | combat-disabled | "no time travel until she returns" is the strategic save layer (Bible §11), not a combat button |
| Reality Warping | **3** | "Reality backlash / universal consequences" (`LSW_Power_Combat_Mechanics.csv:34-35`) — RULING converts the stated backlash into a 3-turn lockout |
| Molecular Disintegration (High) | **2** | "destroys everything nearby" (`:43`) — RULING gates the 200-dmg AoE |

> **OWNER-FORK:** whether *any* combat cooldowns exist at all, or whether everything is purely AP+drawback-gated. Default = the 3-row table above.

### 3.6 The full per-power combat table (verbatim, `LSW_Power_Combat_Mechanics.csv`)

Format: `Power — Tier: AP / Range / Duration / Damage / CS-bonus / AoE / BypassArmor / Status / Threat-scaling`. Cite line numbers are the CSV rows.

**Physical / movement / defense (mostly non-attack buffs):**
- **Super Strength — Low:** 1AP / Touch / Instant / `STR+20 dmg` / `+2CS lifting` / Single / Physical-armor-only / Knockback / `+10 dmg per threat lvl`. **High:** 2AP / `STR+50 dmg` / `+4CS lifting` / Knockback+Stun / `+25/lvl` (`:4-5`). **BAMPI=Melee**, Hit=MEL, Dmg=STR.
- **Super Speed — Low:** 1AP / Special / 1 turn / no dmg / `+2CS dodge` / Self / Haste. **High:** 2AP / 3 turns / `+4CS all actions` / **Multiple Actions** / sonic-boom dmg drawback (`:10-11`). Non-attack; grants CS, extra-action mode (Bible §5.2).
- **Flight — Low:** 1AP / Special / **Sustained** / `+1CS mobility` / max altitude +50ft per threat lvl. **High:** 2AP / `+3CS mobility` / Supersonic / `+500ft/lvl` (`:12-13`). Non-attack; sets **max reachable Z** only (Bible §5.4 ruling #5 + §6 here).
- **Super Durability — Low:** 0AP / Self / Sustained / `+2CS defense` / Damage Resistance / **−1CS agility drawback** / `+5 DR per threat lvl`. **High:** 0AP / `+4CS defense` / `−2CS agility` / `+15 DR/lvl` (`:14-15`). Passive DR pool (Bible §5.5).
- **Invisibility — Low:** 2AP / Self / 10 turns / `+3CS Stealth` / "Revealed if making noise". **High:** 3AP / 20 turns / `+4CS Stealth` (`:2-3`). Non-attack stealth.
- **Adaptive Camouflage — Low:** 2AP / Self / 10 / `+3CS stealth` / movement reveals. **High:** 3AP / 20 / `+5CS invisibility` (`:50-51`).

**Energy / projectile / beam:**
- **Fire Generation — Low:** 2AP / range **8** / 3 turns / `30 fire dmg` / `+1CS accuracy` / Single / **Energy-armor-only** / Burning / `+10 dmg/lvl`. **High:** 4AP / range 20 / `75 fire dmg` / `+3CS area` / **Area 5x5** / Burning+Smoke / `+30/lvl` (`:24-25`). Low=**Projectile**, High=**Area**. Hit=AGL, Dmg=PowerRank.
- **Fire Manipulation — Low:** 3AP / 15 / 5 / Variable / `+2CS control` / Multiple / Energy-armor-only / Burning. **High:** 5AP / 30 / 12 / `+4CS mass control` / **Area 15x15** / Inferno (`:26-27`). Hit=CON.
- **Psychic Blast — Low:** 2AP / 15 / Instant / `25 psychic dmg` / `+1CS accuracy` / Single / **All physical armor (bypass)** / Stunned / `+10/lvl`. **High:** 4AP / 30 / `80 psychic dmg` / `+3CS accuracy` / **Area 5x5** / Unconscious / `+40/lvl` (`:8-9`). Low=**Instant**, High=**Area**. Hit=CON, Dmg=PowerRank.
- **Bio-Energy Projection — Low:** 3AP / 12 / Instant / `Own health as damage` / `+2CS accuracy` / Single / Energy-armor-only / Energy Drained / `dmg = health spent × threat lvl`. **High:** 5AP / 25 / `health × 3` / `+4CS area` / **Area 7x7** / `× 3 × lvl` (`:38-39`). Hit=CON, Dmg=HealthSpent (**self-damage drawback**, Bible §5.5).
- **Sound Absorption — Low:** 2AP / 10 / 5 / no dmg / `+2CS stealth` / **Area 3x3** / Silenced. **High:** 3AP / 20 / 10 / `20 sonic dmg` / `+4CS stealth` / **Area 7x7** / Deafened / "Releases as sonic weapon" (`:18-19`).
- **Energy Siphoning** — *(no combat-mechanics row; damage = drain.)* **RULING §3.7.**

**Physical manipulation (CON-controlled "ranged"):**
- **Telekinesis — Low:** 2AP / 12 / 3 / Variable / `+2CS throwing` / Line-of-sight / Lifted / `+100 lb force/lvl`. **High:** 4AP / 25 / 10 / `+4CS mass` / Telekinetic Crush / `+1 ton/lvl` (`:28-29`). **BAMPI=Projectile** (thrown object), Hit=CON. Damage = thrown-object damage via throwing formula (Bible §5.8, sibling `25-strength-throwing.md`).
- **Metal Manipulation — Low:** 2AP / 15 / 3 / Variable / `+2CS vs metal` / LOS / **Bypasses metal armor** / Disarmed / `+1 ton/lvl`. **High:** 4AP / 30 / 10 / `+4CS vs metal` / **Destroys metal armor** / `+10 ton/lvl` (`:20-21`).
- **Gravitational Field — Low:** 3AP / 10 / 3 / Variable / `+2CS lifting` / **Area 3x3** / Weightless-or-Heavy / `+100 lb/lvl`. **High:** 5AP / 25 / 8 / `+4CS area control` / **Area 10x10** / Gravity Crushed / `+1 ton/lvl` (`:22-23`).
- **Molecular Disintegration — Low:** 4AP / 5 / Instant / `50 disintegration` / `+3CS vs structures` / Single / **All armor (bypass)** / Disintegrated / `+25/lvl`. **High:** 6AP / 15 / `200 disintegration` / `+5CS` / **Area 5x5** / `+100/lvl` (`:42-43`). Hit=CON.

**Mental (contested CON, no damage):**
- **Psychic Persuasion — Low:** 3AP / 10 / 5 / no dmg / Single / **All armor** / Mind Controlled / `+1 target/lvl`. **High:** 4AP / 20 / 10 / **Multiple** / Mass Mind Control / `+5 targets/lvl` (`:6-7`). Contested CON vs target CON (`Power_Attack_Stats.csv:15`).
- **Memory Imprinting — Low:** 3AP / Touch / Permanent / Single / All armor / False Memories. **High:** 5AP / 10 / **Multiple** / Complete Personality Change / `+10 memories/lvl` (`:48-49`).

**Utility / tech / exotic:**
- **Technopathy — Low:** 2AP / 20 / 5 / Variable / `+3CS tech control` / Electronics / Hacked / `+5 devices/lvl`. **High:** 4AP / 50 / 15 / `+5CS` / **All tech in area** / System Override / `+50 devices/lvl` (`:32-33`). Hit=INT.
- **Enhanced Inventing — Low:** 0AP / Special / Permanent / `+3CS tech use`. **High:** 0AP / `+5CS tech creation` (`:30-31`). Non-combat; feeds research/gadgets (sibling `06`/investigation `09`).
- **Dimensional Storage — Low:** 1AP / Touch / Permanent / Stored / "Living things die in storage". **High:** 2AP / 10 / **Mass Storage** / `+1000 cu ft/lvl` (`:36-37`).
- **Time Travel — Low:** 5AP / Self / Special / `+5 min range/lvl`. **High:** 8AP / Reality damage / `+5CS tactical` / Timeline Shift / **madness risk** (`:16-17`). **Combat-disabled** (§3.5); routes to the strategic time-save (Bible §11).
- **Reality Warping — Low:** 6AP / 5 / 1 / Variable / `+3CS impossible actions` / **All (bypass)** / Local Reality Change / `+1 law/lvl`. **High:** 10AP / 15 / 5 / Infinite / `+5CS godlike` / **Area** / Reality Rewrite / `+5 laws/lvl` (`:34-35`).
- **Chrono-Spatial — Low:** 5AP / 10 / 3 / Variable / `+3CS space-time` / All / Time-Space Shifted. **High:** 8AP / 25 / 10 / `+5CS reality control` / `+1 hour shift/lvl` (`:44-45`).
- **Probability Manipulation — Low:** 3AP / 15 / 5 / Variable / `+2CS luck` / **Area effect** / Lucky/Unlucky / `+10% prob/lvl`. **High:** 5AP / 30 / 15 / `+4CS fate control` / `+25%/lvl` (`:46-47`). **RULING §3.8.**
- **Quantum Entanglement — Low:** 4AP / 50 / 10 / no dmg / Two targets / Quantumly Linked. **High:** 6AP / **Unlimited** / 25 / Multiple / Quantum Network (`:40-41`).

### 3.7 RULING — Energy Siphoning has no combat row

`LSW_Powers_Complete_Database.csv:26` defines POW_025 Energy Siphoning, but `LSW_Power_Combat_Mechanics.csv` has **no row** for it. **RULING:** model it on **Bio-Energy Projection's** mechanics inverted — `Attack_Type=Energy`, Hit=CON (energy aiming), **BAMPI=Beam** (drain stream), damage = `target_current_energy_drained`, and the **Siphon** damage-type rider (`DAMAGE TYPE TABLE🔫.csv:43`) heals the attacker for the amount drained. Low: 3AP/range 10/Single; High: 5AP/range 20/`Multiple`. Tag as `SOURCE_GAP` so a designer can replace with a real row.

### 3.8 RULING — Probability Manipulation = a CS engine, not damage

Probability's `Damage_Formula='Variable'` and effect is "changes chance of success" (`LSW_Powers_Complete_Database.csv`/`_Combat_Mechanics.csv:46-47`). **RULING:** it is **not** an attack; it applies a **±CS to a chosen ally's next roll or an enemy's next roll**, magnitude from threat scaling (`+10%`/lvl Low, `+25%`/lvl High). Convert % → CS using the ladder's CS reference: **±1CS per 10%** (`Stat_Rank_Mapping.csv:23-33` treats one column as the unit of advantage). So Low at threat-3 = +30% ≈ **+3CS**; High at threat-3 = +75% ≈ capped at **+5CS** ("godlike" ceiling, matching Reality's `+5CS`). Cap ±5CS.

---

## 4. BAMPI resolution rules (the engine's branch logic)

`activatePower` branches on `def.bampi` (per the tier in use). Each branch resolves targets, computes net-CS, calls `resolve()`, and produces `perTarget` results. Numbers cite the BAMPI CSV, Flight CSV, and the per-power rows above.

### 4.1 Beam (`BAMPI.csv:1-5`)

- **Sustained, maintained aim:** a Beam keeps damaging the **same target each turn** as long as the attacker spends its AP and the target stays in LOS/range. Store `aimLockedTarget`. Breaking LOS or moving the target out of range ends the beam.
- **Chargeable:** "Units can charge attacks to increase damage… makes them vulnerable… can only move forward or stand still while charging" (`BAMPI.csv:2-5`). **RULING:** each charge turn adds **+1 `chargeStacks`** (max `MAX_CHARGE=3` — RULING, bounded so it doesn't run away), each stack = **+50% base damage** (RULING, mirrors the Success→Major 1.0×→1.5× step from `Stat_Rank_Mapping.csv:39`). While charging: attacker is locked (move-forward-or-still only), and gains **−2CS defense** (RULING — "makes them vulnerable", same window value as the flight takeoff/landing penalty in Bible §5.4 ruling #4 for consistency).
- **Collateral:** "High chance of harming property or people" — Beams that pass over/through occupied squares roll the penetration/continuation check (`Penetration_Continuation_System.csv:6-10`) against intervening cover/units.

### 4.2 Area (`BAMPI.csv:1,2`)

- **Cannot be aimed** → **no dodge CS from the target** (target's AGL doesn't reduce the attacker's column; the zone just lands). The attacker still rolls to place the center (AGL to-hit for "did the blast land where intended"); on **Failed**, scatter the center 1 square (RULING — keeps "cannot be aimed" honest without inventing a scatter table; 1 square = the grid's minimum unit, Bible §5: 1 sq ≈ 2 m).
- **Falloff:** center square = full damage; each ring out = **−25%** (RULING — mirrors the 0.5×/1.0×/1.5× quartering the table uses; no AoE-falloff column exists). Zone size from `AoE` (`Area 5x5` = center + 2-ring, etc.).
- **High-altitude falloff (Bible §5.4 ruling #4):** Area powers (esp. explosive/Area Fire) **lose effect at Z3+** — `−1 damage ring per altitude level above Z2` (RULING, implements the Bible's "grenades/explosives lose effect Z3+" fix that killed the 94.7% altitude-bombing win). At Z3 a 5x5 acts as 3x3; at Z5 it's center-only.
- **Collateral is automatic:** every non-target unit (incl. civilians) in the zone is a target → feeds Fame/legal consequences (Bible §9; sibling `17-fame-reputation-legal.md`).

### 4.3 Melee (`BAMPI.csv:1` Melee col; `Power_Attack_Stats.csv:3,45,50`)

- **Range 0–1**, Hit=**MEL**, contested by target dodge (AGL) per the grid doc.
- Super-Strength melee adds **STR to damage** and **knockback** (`Power_Attack_Stats.csv:54,59`); a **Major** opens the wrestling state machine (sibling `26`/Bible §5.9) if the attacker chooses Grapple.
- "Martial Artist rule here" (`BAMPI.csv:2`) → melee powers stack with martial-art ±CS packages (Bible §5.8/§5.9).

### 4.4 Projectile (`BAMPI.csv` Projectile col; `Penetration_Continuation_System.csv`)

- **Travels** along a path → **can be dodged** (target AGL applies −CS to attacker, via grid doc) **and intercepted** (an Overwatch/Ready unit may shoot it down — RULING, reuses the X-Com interrupt from Bible §5.1).
- **Penetration & continuation:** `Effective_Penetration = Base_Damage × Penetration_Multiplier`; penetrates if `> Obstacle_HP`; continues with `Base_Damage − (Obstacle_HP ÷ 2)`, minimum 1 (`Penetration_Continuation_System.csv:6-9`). A line attack hits **up to 5 targets**, damage dropping each pass (Bible §5.12). Thrown/TK objects add **STR ÷ 5** to penetration (`Penetration_Continuation_System.csv:10`).
- Material HP for cover pass-through: Glass 10 / Drywall 25 / Wood 40 / Brick 80 / Concrete 120 / Steel 150–200 (`Penetration_Continuation_System.csv:13-25`).

### 4.5 Instant (`DAMAGE TYPE TABLE🔫.csv:28`; Bible §5.12)

- **Hitscan** — no travel, **cannot be dodged by sub-light targets** (target AGL gives **no** dodge CS). Lasers, psychic, disintegration single-target.
- Counter only via the power's stated `Power_vs_Power_Interaction` (e.g. Psychic Blast "Blocked by psychic defenses" `:8`; Laser blinds at low intensity `DAMAGE TYPE TABLE🔫.csv:28`).
- Targets that *are* light-speed+ (Super Speed High "breaks sound barrier" is **not** light-speed; only Time-manipulation counters per `:11`) — **RULING:** only units with an active **temporal/time-manip** power may dodge Instant; everyone else cannot.

### 4.6 The resolution procedure (every BAMPI ends here)

```
1. Precheck: AP available? cooldown==0? rank>0? LOS (non-Instant)? range OK?  → else fired=false.
2. Resolve targets by BAMPI (single / line / zone / self / aimLocked).
3. Net column = powerRank_column
     + power.columnShift (e.g. +1CS accuracy)           [LSW_Power_Combat_Mechanics col 7]
     + ctx.altitudeCS + ctx.rangeCS - ctx.coverCS        [21-grid]
     + ctx.netSpineCS  (ranged/energy/mental only)       [11/12/13 spine]
     + chargeStacks bonus (Beam) / temporal counters
     - target dodge CS  (Projectile & Melee ONLY; 0 for Area/Instant per §4)
4. outcome = resolve(hitStat, netColumn, ctx.roll)        [20-core-resolution-4cs]
5. damage = damageBase(power, tier, attacker)             [§3.6 formula]
           × outcomeMult(outcome)  (0 / 0.5 / 1.0 / 1.5)  [Stat_Rank_Mapping:37-40]
           × areaFalloff(ring)     (Area only, §4.2)
6. route: damage+bypassArmor → 22-damage;  isMajor → 23-crit;  statusCaused → 24-status;
          knockback(STR rank) → 21-grid;  selfEffects (STA/health/sanity/drawback) → unit.
7. emit PowerFxEvent → EventBridge for the symbolic overlay (§7).
```

---

## 5. Self-cost economy — STA drain, drawbacks, sustain (RULING-heavy, all Bible-anchored)

The power CSVs name **drawbacks** in prose; the Bible turns them into the **balance brakes**. This is the "powers cost you something" layer.

### 5.1 Sustained-power upkeep
- **Flight altitude stamina drain (Bible §5.4 ruling #4):** Z4+ costs **1 STA/turn**, Z6 costs **2 STA/turn** while aloft. Source: `Flight_Altitude_System.csv:43` ("Stamina drain over time" for natural flight) + Bible §5.4. Tech flight instead risks `Equipment failure` (`:44`); magical flight `+1 AP cost` & dispel-vulnerable (`:45`); telekinetic flight `+1 AP` & mental-fatigue (`:46`).
- **Durability/Invisibility/Camo sustain:** Durability is `0 AP` upkeep but pays the **−1/−2CS agility** drawback continuously (`LSW_Power_Combat_Mechanics.csv:14-15`). Invisibility/Camo end on noise/movement (`:2,50`).

### 5.2 Per-use drawbacks (proc from CSV col 11)
Each tier's `Possible_Drawback` fires on use:
- **Bio-Energy:** spends real HP (`Own health as damage`); **High may kill the user** (`:39`) — RULING: if `health_spent ≥ current_HP`, the user drops to Dying (Bible §5.6).
- **Super Strength High:** "Always damages surroundings" (`:5`) → auto structural/collateral roll.
- **Super Speed High:** "Sonic boom damage" (`:11`) → small SONIC AoE on self-adjacent squares.
- **Reality Warping:** "Reality backlash / Universal consequences" (`:34-35`) → 3-turn cooldown (§3.5) + a Fame/world-state event (Bible §8/§9).
- **Time Travel / Reality / Chrono High:** **madness/sanity risk** (`:17,35`) → ties to the **Time-Walker sanity economy** (Bible §11). RULING: each High exotic use in combat adds **+1 sanity-strain point** to the nation's Time Walker (sibling save-doc owns the meter).

### 5.3 Knockback (RULING — one rule, Bible §5.5)
Per `Power_Attack_Stats.csv:59` "Knockback calculation always uses STR rank regardless of power type." **RULING:** `knockbackSquares` is computed by the grid/strength doc's knockback function using the **attacker's STR rank** (for STR/impact powers) — *not* the power rank — so a weak telekinetic doesn't launch tanks. Powers whose `Status_Effect_Caused` includes "Knockback" (`:4-5` Super Strength) or whose damage-type carries a knockback rider (`SMASHING/IMPACT/SONIC/CONCUSSIVE/EXPLOSION`, `Origin_Damage_Interactions.csv:19,28-30`) pass `causesKnockback=true`.

---

## 6. Flight as the signature power (consumes the altitude integer)

Flight is **POW_003** and the system's signature (Bible §5.4). It is **not an attack** — it sets a flyer's **max reachable Z** and grants `+CS mobility`, then the **grid doc (`21`) owns the Z0–Z6 integer**. This doc's job is the *power→altitude* contract.

| Source value | Effect | Source |
|---|---|---|
| Flight Low grants `+1CS mobility`; threat scaling `+50 ft altitude / threat level` | a Low flyer's **max Z** = floor(50ft × threatLevel ÷ height-per-level) | `LSW_Power_Combat_Mechanics.csv:12` + Bible §5.4 ruling #5 (feet only set max-Z) |
| Flight High `+3CS mobility`; `+500 ft / threat level`; Supersonic | High flyers reach Z6; supersonic enables `+1CS speed` Strafe/Jet-class | `:13`; `Flight_Altitude_System.csv:41,49` |
| Altitude height bonus | **+1CS (Z1–Z2), +2CS (Z3–Z4), +3CS (Z5–Z6)** to-hit-from-height | `Flight_Altitude_System.csv:3-8` (Tactical_Advantages col) |
| Weapon-from-ground falloff | ranged **−1CS (Z3), −2CS (Z4), −3CS (Z5), −4CS (Z6)** | `Flight_Altitude_System.csv:5-8` (Weapon_Effectiveness col) |
| Dive | **+1CS attack accuracy**, +50% move, 1AP | `Flight_Altitude_System.csv:12` |
| Hover | **+1CS accuracy** but "sitting duck" | `:13` |
| Takeoff/Landing | 2AP + Bible **−2CS defense window** | `:9-10` + Bible §5.4 ruling #4 |
| Aerial Grapple | grappling rules; **both may fall if failed** | `:18` |
| Indoor ceiling cap | `max indoor Z = ceiling_ft ÷ 10`; subway/underground = **no flight** | `Building_Flight_Limitations.csv:24,11,19` |

**Indoor caps (verbatim, `Building_Flight_Limitations.csv:2-20`):** Residential Z0; Apartment Z0–1; Office Z1; Warehouse Z1–2; Mall Z2–3; Factory Z2–4; Stadium Z5–6; Underground/Subway/Sewer **no flight**. Breaking a ceiling needs the listed STR (e.g. Office drop-ceiling STR 35+, structural STR 60+; Government STR 75+; reinforced underground STR 90+) and triggers structural-damage + legal consequence (Bible §9).

---

## 7. UI / UX hooks (symbolic grid + phone + laptop)

The aesthetic is **symbolic** (Bible §5: glyphs, no 3D). The existing `PowersPanel.tsx` already maps role→color and a **manifest icon set** (`beam '─→' / blast '💥' / touch '✋' / aura '○' / zone '⬡' / self '⟳' / target '◎' / portal '🚪'` — `PowersPanel.tsx:33-43`); **reuse it directly** — `manifest` is the visual twin of `bampi` (Beam→`─→`, Area→`⬡`, Projectile→`◎`, Melee→`✋`, Instant→`💥`).

**Combat overlay (the grid):**
- **Power tray:** the `PowersPanel` row per power shows emoji, **AP cost**, **cooldown state**, and greys out if `currentAp < apCost` or `rank===0`. (`PowersPanel.tsx` already takes `currentAp`.)
- **Targeting preview on hover:** BAMPI drives the highlight — Beam = a **line to `aimLockedTarget`** (with a charge-meter pip when held); Area = the **zone footprint with ring shading** (and a red ⚠ on civilians in the blast); Projectile = the **travel path + penetration markers** on cover; Instant = a **single flash glyph** ("can't be dodged" badge); Melee = adjacent-square highlight.
- **Altitude readout:** a flyer token shows its **Z integer + wing/shadow indicator** (Bible §5.4); ground attacks targeting it show the live falloff CS (e.g. "−2CS, Z4").
- **Charge state (Beam):** charging unit glows and is locked; a `−2CS DEF` badge warns the player it's exposed (`BAMPI.csv:3`).
- **Self-cost badges:** STA drain at Z4+ (💨), HP-spend on Bio-Energy (❤️−), sanity-strain on exotic powers (🌀) — surfaced as floating numbers (Bible §5.4/§11).

**Laptop / phone (powers as meta-game keys):**
- **Investigations app:** powers with an `Investigation_Application` (`LSW_Powers_Complete_Database.csv` col 11) appear as **method options** in the investigation flow (sibling `09`) — Technopathy = "digital investigation", Psychic Persuasion = "interrogation", Perfect Recollection = "evidence recall".
- **Roster sheet (Personnel):** a unit's power list shows category icon, BAMPI shape, Low/High tier, and **observed-region** flavor (Bible §7.3).
- **Recruitment:** a region's **power affinity** (`Culture_Region_Effects.csv:11`) is surfaced on the recruit card ("South Asia — mystical/divine powers likely").

---

## 8. How it consumes the SPINE (country / city / culture → power)

The spine reaches powers through **four** channels, each a formula over country/city/culture stats (Bible §2 SPINE PRINCIPLE, §13 ruling #9 "combined-effects must be consumed").

**8.1 To-hit (ranged/energy/mental powers, in combat).** The net column (§4.6 step 3) **adds the summed spine CS** for the active country/city the combat is in. Example: a Technopathy hack in a **high-cyber** country gets `−2CS hacking` becomes harder for *defenders* / the country's `+2CS cyber surveillance` raises detection (`Country_Attribute_Effects.csv:33`); mental/social powers get the **culture social modifier** (`Culture_Region_Effects.csv:42`: same-culture +2CS, opposed −1CS; language barrier −2CS, `:36`).

```
toHitNetCS += spineCS(country, city, culture)
  where spineCS sums the relevant rows from
  Country_Attribute_Effects.csv + City_Type_Effects.csv + Culture_Region_Effects.csv
  (the SAME sum 20-core-resolution-4cs.md already builds; this doc just passes it in).
```

**8.2 Power *availability* on recruits (worldgen).** A unit's powers are rolled with **regional affinity**: `LSW_Powers_Complete_Database.csv` col 9 `Observed_Regions` × `Culture_Region_Effects.csv` `LSW_Power_Affinity` (`:11` "Mystical/Divine/Elemental common", `:27` North America "Tech/Mutation"). **RULING (the rule already in the CSV, `Culture_Region_Effects.csv:34`):** *"LSWs from region 2× likely to have listed power types."* So Fire Generation (observed "US/Canada/Mexico/Central/South America") and South-Asia mystical powers are weighted 2× in those regions. This is consumed by character generation (sibling `07`/`08`).

**8.3 Power *strength* gating (combined-effects → tier/research).** High-tier powers and power-tech depend on combined-effect systems (Bible §8): **Research speed** (`Science+Education+GDP+Cyber`) gates how fast a faction unlocks power-tech (flight suits, dampeners — Enhanced Inventing feeds this, `LSW_Powers_Complete_Database.csv:16`); **Cloning** (`Healthcare+Science+GDP`) decides whether a dead power-user comes back (Bible §8). **Superhuman Affairs** (`LSWActivity+Intel+Military+Science`, `Country_Attribute_Effects.csv:25-27`) sets **whether using powers publicly is legal** (`LSWRegulations` Banned → `−3CS public ops`; Legal → `+2CS`). A flashy Area power in a Banned country is a Fame/legal time-bomb (Bible §9).

**8.4 Pricing & difficulty (the consumption ruling).** Per Bible §13 #9, the spine must drive prices/difficulty: a **mission** in a high-Intel/high-Military country raises detection on stealth powers (`Country_Attribute_Effects.csv:13,11`); **mercenary/recruit price** for a rare power scales with the region's `LSW_Power_Affinity` (common locally = cheaper). The mission generator (sibling `02-event-emergence-engine.md`) reads a target's power list to parameterize encounter difficulty (a flyer-heavy enemy squad forces indoor/weather maps per Bible §5.4).

---

## 9. Integration points (reads / writes)

| Direction | System | Contract |
|---|---|---|
| **calls** | `20-core-resolution-4cs.md` | `resolve(hitStat, netColumn, roll)` → Outcome. This doc never owns the table. |
| **reads** | `21-tactical-combat-grid.md` | `getAltitudeCS`, `getRangeCS`, `getCoverCS`, `getLOS`, indoor-Z-cap, AP economy, dodge CS, Overwatch interrupt (Projectile). |
| **reads** | `07-character-model.md` | `unit.powers[]` (defId, rank), `unit.origin`, `unit.threatLevel`, `unit.sta`/`unit.hp`. |
| **writes** | `22-damage-model-types.md` | `{damage, damageSubType, bypassArmor, penetrationMult, causesKnockback}` → armor pools + bleed gate. |
| **writes** | `23-crit-injury.md` | `isMajor` (and called-shot flag) → crit→injury d100. |
| **writes** | `24-status-effects.md` | `statusCaused` string (Burning/Stunned/Mind Controlled/Frozen/…) → status apply with tier/duration. |
| **reads** | `25-strength-throwing.md` | throw/penetration formula for Telekinesis/Metal/Gravitational "thrown object" damage. |
| **reads** | `11/12/13-spine` | summed spine CS (to-hit), `LSW_Power_Affinity` (worldgen), `LSWRegulations` (legality). |
| **writes** | `02-event-emergence-engine.md` | target power lists parameterize encounters; power use logs feed news/world-state. |
| **writes** | `17-fame-reputation-legal.md` | Area/collateral & banned-country public power use → Fame/legal deltas. |
| **reads/writes** | `09-investigations.md` | powers with `Investigation_Application` become methods; results feed back. |
| **writes** | Time-Walker save (`Bible §11`) | exotic High powers add sanity-strain points. |
| **writes** | `EventBridge.ts` | `PowerFxEvent` for the symbolic overlay; reuses `PowerData` (`EventBridge.ts:192`) extended with `bampi`. |
| **AI reads** | `PERSONALITY TARGET SELECTION` | the 20-personality target-preference picks **which** valid target an AI uses a power on (most/least health, major/minor threat, random — `Combat Compendium REAL - 🎯PERSONALITY TARGET SELECTION🎯.csv`). |

---

## 10. Edge cases & failure modes

1. **No rank / power not owned:** `rank===0` → `fired=false, failReason='no rank'`. Power tray greys it out.
2. **Insufficient AP:** `currentAp < tier.apCost` → blocked; UI greys. (Reality High = 10AP > 6AP/turn → **needs Super-Speed extra actions or a multi-turn charge**; RULING: cannot fire in one normal turn — surface "needs 10 AP".)
3. **LOS broken mid-Beam:** sustained Beam ends; `aimLockedTarget` cleared; charge stacks lost.
4. **Area scatters onto allies/civilians:** automatic targeting of everyone in zone → ally friendly-fire is real; civilian hits → Fame/legal (Bible §9). UI ⚠ pre-warns.
5. **Mental power vs immune origin:** `bypassArmor='All armor'` but **Construct** has no mind → RULING: Mental powers **fail vs Construct/Energy-Being** origins (`Origin_Damage_Interactions.csv:14` Construct, `:78` Energy_Being); engine checks origin before applying Mind-Controlled.
6. **Bleed/burn on immune origin:** route through `22-damage` which checks `origin.bleeds`/`burns` (`Origin_Damage_Interactions.csv:6-14,86`); Construct bleeding → cosmetic sparks only (`:68`); EMP/Electrical ×-effect vs Construct & Tech (`:71,9`).
7. **Instant vs sub-light target:** no dodge allowed (§4.5); only a temporal-power unit may dodge.
8. **Flight indoors over ceiling cap:** clamp Z to `ceiling÷10`; attempting higher = collision damage (`Building_Flight_Limitations.csv:24`); subway/underground forces Z0.
9. **Charging interrupted (Beam):** if the charging unit is hit (it's at −2CS DEF), RULING: charge stacks are **kept** (the data only says "vulnerable", not "lose charge") unless the hit is a Major (then reset). OWNER-FORK on whether any hit cancels.
10. **Sustained Flight runs STA to 0:** Z4+ drain hits 0 STA → Exhausted status (`EFFECT_STATUS😴.csv:16` "<20% Stamina") → forced **Emergency Descent** (`Flight_Altitude_System.csv:14`, falling-damage risk).
11. **Time Travel in combat:** disabled (§3.5); attempting routes to the strategic save UI, not a combat resolve.
12. **Bio-Energy lethal self-cost:** `health_spent ≥ HP` → user → Dying (Bible §5.6); engine refuses if it would be instant-death unless player confirms (OWNER-FORK: "berserk last stand" toggle).
13. **Probability ±CS stacking:** cap **±5CS** total from Probability on any one roll (§3.8) to prevent certainty loops.
14. **Threat-scaling overflow:** `+damage per threat level` (e.g. Disintegration `+100/lvl`) at Threat 5 = huge — clamp final damage to the target's **max HP × 3** (RULING — prevents UI overflow; cosmic still always lethal). OWNER-FORK on the multiplier.
15. **SOURCE_GAP powers (Energy Siphoning §3.7):** flagged so a designer notices the modeled-not-sourced row; never silently shipped as "real."

---

## 11. RULING: notes (collected — all Bible-consistent, source-anchored)

- **R1 — BAMPI derivation** (§3.1): compute `bampi` per tier from `Attack_Type`+`AoE`+`Range`+damage-type; the CSV doesn't tag it. (Bible §5.12, §13 #6.)
- **R2 — Damage-type mapping** (§3.2): map each power's prose to a `DAMAGE TYPE TABLE` sub-type so riders apply.
- **R3 — Low/High cutoff** (§3.4): High tier at rank ≥ Remarkable (31 / Threat 1). Constant `HIGH_TIER_MIN_RANK`.
- **R4 — Cooldowns** (§3.5): default 0 (AP+drawback gated); 3-row exception table for Time/Reality/Disintegration.
- **R5 — Energy Siphoning model** (§3.7): Beam drain healing attacker (Siphon rider); `SOURCE_GAP`.
- **R6 — Probability = CS engine** (§3.8): ±1CS per 10%, cap ±5CS; not damage.
- **R7 — Beam charge** (§4.1): +1 stack/turn (max 3), +50% dmg/stack, −2CS DEF while charging.
- **R8 — Area falloff** (§4.2): −25%/ring; scatter 1 sq on Failed; high-altitude −1 ring/Z above Z2.
- **R9 — Projectile interception** (§4.4): Overwatch units may shoot down a projectile (X-Com interrupt).
- **R10 — Instant dodge** (§4.5): only temporal-power units may dodge hitscan.
- **R11 — Knockback uses STR rank** (§5.3): per `Power_Attack_Stats.csv:59`, not power rank.
- **R12 — Mental vs mindless** (§10.5): Mental powers fail vs Construct/Energy-Being origins.
- **R13 — Sanity-strain** (§5.2): exotic High powers add Time-Walker sanity-strain (Bible §11).
- **R14 — Threat-scaling clamp** (§10.14): final damage ≤ target maxHP×3.
- **R15 — Worldgen affinity** (§8.2): 2× weight for region-affine powers (`Culture_Region_Effects.csv:34`).

## 12. OWNER-FORK: notes (product choices only the owner makes)

- **OF1 — High-tier cutoff** (§3.4): Remarkable (31) vs Incredible (41). Default 31.
- **OF2 — Combat cooldowns exist at all** (§3.5): pure AP+drawback economy, or the 3-row cooldown table. Default = table.
- **OF3 — Charge cancellation** (§10.9): any hit cancels Beam charge, vs only a Major resets. Default = only Major.
- **OF4 — Bio-Energy lethal confirm** (§10.12): allow "last stand" self-kill toggle. Default = refuse instant self-death.
- **OF5 — Threat-scaling clamp multiplier** (§10.14): maxHP×3 default; owner may lift the cap for cosmic-tier sandbox.
- **OF6 — Probability scope:** can it retro-edit an *already-rolled* result, or only modify the *next* roll? Default = next roll only.
- **OF7 — Time Travel in combat:** fully disabled (default) vs a costly "1 jump = undo last action" combat rewind tied to sanity.

## 13. Open questions

1. **Rank source for a power:** does a unit's *power rank* equal one of its 7 primary stats, or is it a separate stored value on `UnitPower.rank`? (Spec assumes separate, joined from `07-character-model`. Confirm the character sheet carries per-power ranks.)
2. **Sustained power AP at start of turn:** is maintaining Flight/Invisibility free each turn (0 AP) and only the *cost* is STA/duration, or does re-sustain cost AP? (Spec: 0 AP, cost is STA/duration per CSV. Confirm.)
3. **Multi-power synergy** (e.g. Telekinetic Flight = Flight via Telekinesis, `Flight_Altitude_System.csv:46`): is that a *separate* power or Flight tagged `Power_Telekinetic_Flight`? (Spec treats it as Flight's flight-type sub-tag. Confirm.)
4. **Charge & AP interaction:** does charging a Beam consume the AP each turn, or lock the unit's full turn? (Spec: spends the Beam's AP, locks movement to forward/still per `BAMPI.csv:5`.)
5. **Power-vs-power explicit counters:** the CSV `Power_vs_Power_Interaction` column names counters in prose ("countered by gravity control", "only psychic immunity"). Should these be a hard data table (counter graph) the AI uses to pick powers, or flavor only? (Recommend: a `counters[]` lookup the AI reads — out of scope for v1, flagged.)
6. **Energy Siphoning real row:** needs an authored `LSW_Power_Combat_Mechanics` row to replace the `SOURCE_GAP` model (§3.7).
