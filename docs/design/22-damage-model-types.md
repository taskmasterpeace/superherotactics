# 22 — Damage Model & 30+ Damage Types

> **System owner:** the *damage doc*. This is the build-ready spec for how a landed hit becomes HP loss, status effects, and downstream triggers.
> **Locked context honored:** combat is SYMBOLIC (plain grid + glyphs; flight = altitude integer; the math is hidden behind glyphs, but it still RESOLVES on the grid). This system is specced *fully* (it is the depth that makes team composition matter, Bible §5.5) but its **UI is light** — see §11.
> **Position in the pipeline:** the resolution kernel (`20-core-resolution-4cs.md`) owns *whether a hit lands and how hard* (`outcome` + `damageMultiplier` + `triggersKnockback`/`triggersCritTable` flags). **This doc owns steps 10–14**: `Final = Damage × OutcomeMult − Effective_DR`, then damage-type riders (bleed/burn/freeze/poison/etc.), origin interactions, and status application. Knockback distance is owned by the knockback doc; crit/injury body-part rolls by the crit/injury doc; this doc *hands off* to them.

**Primary source tables (opened for this spec):**
- `docs/csv-source-data/Combat Compendium REAL - 🔪DAMAGE TYPE TABLE🔫.csv` (DTT-1 — the categorized type taxonomy)
- `docs/csv-source-data/Combat Compendium REAL - 2nd 🔪DAMAGE TYPE TABLE🔫.csv` (DTT-2 — the parameterized N/M/K/L/O/P effect formulas; the build truth for riders)
- `docs/csv-source-data/Combat Compendium REAL - 💥DAMAGE TABLE💥.csv` (DT — weapon dmg/range anchors)
- `docs/csv-source-data/Game_Mechanics_Spec/Origin_Damage_Interactions.csv` (ODI — immunities, multipliers, death visuals, hit verbs)
- `docs/csv-source-data/Game_Mechanics_Spec/Origin_Types.csv` (OT — 9 origins)
- `docs/csv-source-data/Combat Compendium REAL - 😢EFFECT_STATUS😴.csv` (ES — status severity I/II/III intent)
- `docs/csv-source-data/Status_Effects_Complete.csv` (SEC — the full status numbers: durations, HP/turn, penalties)
- `docs/csv-source-data/Combat Compendium REAL - Weapons.csv` (W — per-weapon dmg/type/sub-type/specific/CS, the weapon→damage-type binding)
- `docs/csv-source-data/Game_Mechanics_Spec/Penetration_Continuation_System.csv` (PCS — penetration multipliers, material HP, knockback-impact damage, ammo)
- `docs/csv-source-data/Game_Mechanics_Spec/Armor_Complete.csv` (ARM — DR_Physical/DR_Energy/DR_Mental pools, special properties)
- `docs/csv-source-data/Game_Mechanics_Spec/Stat_Rank_Mapping.csv` (SRM — outcome multipliers, rank ladder)
- `docs/csv-source-data/Game_Mechanics_Spec/Universal_Table_FIXED.csv` (UTF — outcome distribution)
- `docs/csv-source-data/Combat Compendium REAL - 🪓BAMPI🔫.csv` (BAMPI — attack-shape notes)
- `SHT_MECHANICS_BIBLE.md` §5.5, §5.6, §5.7, §13 (rulings)

**Already in code (build ON this, don't rebuild):** `MVP/src/data/damageSystem.ts` — exports `DamageCategory`, `DamageSubType`, `DamageDefinition`, `DAMAGE_TYPES: Record<string, DamageDefinition>`, plus `KnockbackEffect`/`BleedingEffect`/`BurningEffect`/`FreezeEffect`/`PoisonEffect`/`StunEffect`/`OriginModifiers`/`ArmorInteraction`/`SpecialMechanics`, and helpers `getDamageType`, `calculateOriginDamage`, `calculateArmoredDamage`, `canCauseKnockback/Bleeding/Burning/Freeze/Poison/Stun`. This spec is the *authoritative reconciliation* of that file against the source tables; where the code diverges from a table, the table wins and a `RULING:` is noted.

---

## 1. Overview & player fantasy

**Fantasy:** *the right damage matters.* You don't just shoot the robot — you bring the **Electric Rifle** (×2 vs robotic, can break it; ODI/DTT-2). You don't punch the energy being — punches barely scratch it (×0.5; `damageSystem.ts:188`). Fire **spreads and keeps burning**; acid **eats armor**; a laser **can't be dodged** and **cauterizes** (no bleed); a psychic blast **goes straight through the wall**; a siphon **heals the attacker**. Constructs **spark instead of bleed**; the divine **bleed golden ichor** (cosmetic). This is the layer that turns "30+ damage types" from flavor text into a reason to build a balanced team and read the enemy's origin before you fire.

**Symbolic surface (locked):** none of this needs a 3D engine. A hit is a glyph flash + a verb (`ODI:18-39` gives the verbs: *grazes / slashes / CLEAVES*), a status is a small icon on the unit, DoT is a falling number each tick. The *math* (this doc) is hidden by default; an optional tooltip reveals the breakdown (§11). The grid still RESOLVES every rider exactly.

**One sentence:** given a landed outcome from the kernel, this system computes final HP loss through the armor pools, then fires the damage type's riders (DoT, CC, knockback/crit handoffs) filtered through the target's origin.

---

## 2. The 6 categories & the canonical 32 damage types (the taxonomy)

Source: DTT-1 (categories + sub-types), DTT-2 (the parameterized effects), W (weapon bindings), `damageSystem.ts:10-60` (existing enums). The Bible (§5.5) says "30+ damage types, grouped Physical / Bleed / Energy / Biological / Mental / Other." Below is the canonical reconciled list. **32 types across 6 categories.** Each row cites the source line that defines its rider.

### Category 1 — PHYSICAL 🔨 (`knockback` family; bullet-proof armor effective)

| # | id (`DamageSubType`) | Specific | Bound weapon (W) | Rider source |
|---|---|---|---|---|
| 1 | `SMASHING_MELEE` | Punch | unarmed | DTT-2:9 — knockback %≈f(atk STR, tgt STR); dmg=f(atk STR) |
| 2 | `BLUNT_WEAPON` | Blunt Weapon | Lead Pipe, Battle Staff (W:8,12) | DTT-2:11 — dmg=STR + weapon; can block |
| 3 | `SMASHING_PROJECTILE` | Thrown object | (thrown env objects) | DTT-2:13 — dmg=STR + object weight |
| 4 | `SMASHING_PROJECTILE_LARGE` | Thrown large object | (cars, §7) | DTT-2:15-17 — K-L% lands-on-pin → target STR-check or Immobile |
| 5 | `IMPACT` | Kinetic/Force | fall, gravity, telekinesis (DTT-1:9) | DTT-2:18 — knockback %=f(tgt STR); dmg uses additional table |
| 6 | `GUNFIRE_BUCKSHOT` | Buckshot | Shotgun (W:21) | DTT-2:20-21 — KB inversely ∝ range; **all armor ×1.5 effective** |
| 7 | `GUNFIRE_BULLET` | Shot | Pistol, SMG, Rifles (W:18-29) | DTT-1:11 / W — standard bullet; targets items |
| 8 | `EXPLOSION_CONCUSSION` | Concussion Blast | Grenade, Rocket (W:34,38) | DTT-2:23 — KB inversely ∝ blast area |
| 9 | `SOUND_ULTRASONIC` | Ultrasonic | military/LSW (DTT-1:13) | DTT-2:25 — KB=f(weapon type); dmg=f(distance) |
| 10 | `SOUND_SONIC` | Sonic | Sonic Rifle (W:37) | DTT-2:27 — same as ultrasonic |

### Category 2 — BLEED PHYSICAL 🏹 (`bleeding` family)

| # | id | Specific | Bound weapon (W) | Rider source |
|---|---|---|---|---|
| 11 | `EXPLOSION_SHRAPNEL` | Shrapnel Explosion | Shrapnel Grenade (W:49) | DTT-2:35 — bleed% inversely ∝ blast area |
| 12 | `PIERCING_PROJECTILE` | Thrown object | Throwing Knife, Bow (W:16,27) | DTT-2:37 — bleed%=f(atk STR); can impale |
| 13 | `GUNFIRE_AP` | Armor Piercing Rounds | (AP ammo, PCS) | DTT-1:18 / PCS:31 — 2.0× pen, −25% vs unarmored |
| 14 | `EDGED_PIERCING` | Piercing | Knife (W:6) | DTT-2:41-43 — N-M% bleed if armor ignored; K-L% ignore armor (not Force Shield) |
| 15 | `EDGED_SLASHING` | Slashing | Katana (W:10) | DTT-2:44-46 — N-M% bleed; K% cut body part ∝ STR |

### Category 3 — ENERGY ⚡ (`burning`/`freeze` + disintegration family; energy DR pool)

| # | id | Specific | Bound weapon (W) | Rider source |
|---|---|---|---|---|
| 16 | `ENERGY_FIRE` | Fire | Flamethrower (W:30) | DTT-2:49-52 — only on flammable surfaces; persists; lowers when moving; dmg=N+M×K rising |
| 17 | `ENERGY_THERMAL` | Thermal | Thermal Rifle (W:50) | DTT-2:53-55 — dmg=N+M×K; L% disintegration ∝ temp; fast decay |
| 18 | `ENERGY_PLASMA` | Plasma | Plasma Rifle (W:51) | DTT-2:56-59 — persists; N/sec; M-K% disintegration |
| 19 | `ENERGY_ICE` | Ice | Ice Rifle (W:52) | DTT-2:60-63 — N/sec ∝ temp; K-L% freeze ∝ temp; M% disintegration |
| 20 | `ELECTROMAGNETIC_PURE` | Pure Energy | Energy Rifle (W:53) | DTT-2:64-66 — N% disintegration; K% explode-and-disintegrate area |
| 21 | `ELECTROMAGNETIC_BOLT` | Electricity | Electric Rifle (W:54) | DTT-2:67-71 — N% paralyze K-L sec; **×2 to robotic**; O% break robotic; P% disintegration |
| 22 | `ELECTROMAGNETIC_RADIATION` | Radiation | cosmic/nuclear (DTT-1:27) | DTT-2:72-73 — **no direct dmg**; N% melt living ∝ exposure time |
| 23 | `ELECTROMAGNETIC_LASER` | Laser | Laser Rifle (W:55) | DTT-2:74-77 — N% blind; **can't be dodged** (sub-lightspeed); K% disintegration |

### Category 4 — BIOLOGICAL 💉 (`poison` family + sickness; no effect on robotic)

| # | id | Specific | Rider source |
|---|---|---|---|
| 24 | `TOXIN_POISON` | Poison | DTT-2:80-83 — dmg=N-M×K (decays); any attack except piercing/bite; L% sickness; **no robotic** |
| 25 | `TOXIN_VENOM` | Venom | DTT-2:84-88 — dmg=N-M×K; **only via piercing/bite**; stronger+longer than poison; L% sickness; no robotic |
| 26 | `TOXIN_ACID` | Acid | DTT-2:89-91 — N/sec for K-L sec; **×2 damage to armor**; M% sickness |
| 27 | `BIOTOXIN_VIRUS` | Virus | DTT-2:92-95 — no direct dmg; Sickness 100% while active; after N sec → Disease; no robotic |
| 28 | `BIOTOXIN_DISEASE` | Disease | DTT-2:96-99 — N dmg per M sec; Sickness 100%; **hospital-only cure**; no robotic |
| 29 | `NECROTIC_BITE` | Zombie/animated bite | `damageSystem.ts:49` + ES:5 ("Animated… eat the non-tech units") — high infection; routes to Virus→Disease |

### Category 5 — MENTAL 🧠 (`weakness` family; mental DR pool; bypasses physical cover)

| # | id | Specific | Rider source |
|---|---|---|---|
| 30 | `MENTAL_CONTROL` | Mind Control | DTT-2:114-116 — no dmg; control target N sec; M% weakness |
| 31 | `MENTAL_BLAST` | Mental Blast | DTT-2:117-118 — N dmg; M% weakness; PCS:59 — 2.0× pen, ignores physical barriers |

### Category 6 — OTHER ❓ (special/exotic)

| # | id | Specific | Rider source |
|---|---|---|---|
| 32 | `DISINTEGRATION` | Disintegration | DTT-1:39 / ODI:37 — turns target to dust; death visual `dust` |
| 33 | `SPIRITUAL` | Spiritual / Exile | DTT-2:119-120 — affects **all origins**; N% life-leaves-body ∝ exposure |
| 34 | `SIPHON` | Siphon | DTT-2:121 — N dmg/sec **and +N heal/sec to attacker** |
| 35 | `ASPHYXIATION` | Asphyxiation | DTT-2:102-105 — dmg=N+M×K rising; O% unconscious P sec; **no robotic** |
| 36 | `EBULLISM` | Ebullism | DTT-2:106-108 — dmg=N+M×K; after L sec living origin collapses (vacuum / too-high flight, DTT-1:42) |
| 37 | `DECOMPOSITION` | Decomposition / Aging | DTT-2:100-101 — Sickness 100%; N% lose body parts (Aging power, DTT-1:44) |
| 38 | `SICK_NAUSEATED` | Nauseated / Illness | DTT-1:45,51 — temporary stat reduction (out-of-combat illness) |

> `RULING: 22-A — "30+" is satisfied at 32+ shippable types.` The two source tables disagree on exact membership (DTT-1 lists `Spiritual`/`Decomposition`/`Nauseated`; DTT-2 adds `Exile`, splits `Fire` from `Thermal`, drops some). The canonical set is the **union above (38 numbered slots, 32 with distinct mechanical riders)**, matching the existing `DamageSubType` union in `damageSystem.ts:18-60` (which has 31 members) **plus** the four it is missing: split `ENERGY_FIRE` out of `ENERGY_THERMAL`, split `SMASHING_PROJECTILE_LARGE`, and add `SPIRITUAL`-as-`Exile`. The MVP may ship a **subset** (§13, OWNER-FORK 22-F); the data model must define all of them so content is data-driven (Pillar #1).

> `RULING: 22-B — id naming is canonical.` Use the `damageSystem.ts` SCREAMING_SNAKE ids verbatim where they exist; new ids follow the same pattern (`ENERGY_FIRE`, `SMASHING_PROJECTILE_LARGE`). The Cyrillic "Е" in DTT-2:67 ("Еlectricity") is a data typo — the id is ASCII `ELECTROMAGNETIC_BOLT`.

---

## 3. Data schema (fields / types)

Extends the existing `DamageDefinition` (`damageSystem.ts:145-169`). **Keep the existing interface**; this section pins every field to a source and adds the missing ones. All numbers configurable in data (the `N/M/K/L/O/P` of DTT-2:127-128 become named config fields, never magic numbers in code).

```ts
// ---- Top-level (existing, retained) ----
type DamageCategory =
  | 'PHYSICAL' | 'BLEED_PHYSICAL' | 'ENERGY' | 'BIOLOGICAL' | 'MENTAL' | 'OTHER'; // damageSystem.ts:10

interface DamageDefinition {
  id: string;                 // §2 canonical id
  name: string;
  category: DamageCategory;   // → picks the DR pool (§4)
  subType: DamageSubType;     // §2
  emoji: string;              // glyph for symbolic UI (DTT-1:4 category emojis)
  description: string;

  // BAMPI attack-shape (NEW — Bible §5.12, §13.6) — every type declares its shape
  bampi: 'BEAM' | 'AREA' | 'MELEE' | 'PROJECTILE' | 'INSTANT'; // BAMPI.csv

  // Rider effect blocks (all optional; presence = "this type can do X")
  knockback?: KnockbackEffect;   // damageSystem.ts:64
  bleeding?:  BleedingEffect;    // :71
  burning?:   BurningEffect;     // :81
  freeze?:    FreezeEffect;      // :90
  poison?:    PoisonEffect;      // :98
  stun?:      StunEffect;        // :108  (used for paralyze/electricity)
  disintegration?: DisintegrationEffect; // NEW (DTT-2)
  siphon?:    SiphonEffect;       // NEW (DTT-2:121)
  weakness?:  WeaknessEffect;     // NEW (DTT-2:109-113, mental "weakness")
  statusApplications?: StatusApplication[]; // NEW — generic link to Status_Effects_Complete

  // Modifiers (existing)
  originModifiers: OriginModifiers;   // :116 — per-origin damage multipliers
  armorInteraction: ArmorInteraction; // :124
  specialMechanics: SpecialMechanics; // :131

  dotType?: 'constant' | 'increasing' | 'decreasing' | 'scaling'; // :167
  visualEffect?: string;        // death-visual id from ODI:41-64
}
```

**New effect blocks (all parameters are the DTT-2 `N/M/K/L/O/P`, made explicit):**

```ts
interface DisintegrationEffect {           // DTT-2:47-48, 55, 59, 63, 66, 71, 77
  baseChancePct: number;                   // N (e.g. 5)
  scalesWith?: 'temp' | 'intensity' | 'none';
  areaExplodeChancePct?: number;           // K — Pure Energy "explode & disintegrate area" (DTT-2:66)
  threshold?: 'living' | 'any';            // radiation/thermal melt living only (DTT-2:73)
}
interface SiphonEffect {                    // DTT-2:121
  drainPerTick: number;                    // N dmg/sec to target
  healPerTickToAttacker: number;           // +N heal/sec to attacker
}
interface WeaknessEffect {                  // DTT-2:109-113 "weakness" / Power_Dampened (SEC:53)
  energyDrainPctMin: number;               // lowers N-M% of one random char's energy
  energyDrainPctMax: number;
  fastVariantForcesSingleTarget: boolean;  // "FAST Weakness: can attack only one chosen enemy"
}
interface StatusApplication {               // generic bridge to Status_Effects_Complete.csv
  effect: string;                          // SEC Effect_Name (e.g. 'Paralyzed','Blind','Burning')
  severity?: 'I' | 'II' | 'III' | 'None';  // SEC Severity_Level
  chancePct: number;                       // application probability (default 100 on Success)
  chanceScalesWith?: 'distance' | 'temp' | 'exposure' | 'str' | 'none';
}
```

**Extended `OriginModifiers`** (existing has 5 buckets; ODI uses 9 origins — keep buckets, add `vsOrigin` map for the full table):

```ts
interface OriginModifiers {                 // damageSystem.ts:116 (retained) + extension
  biological: number; robotic: number; energy: number; undead: number; construct: number;
  vsOrigin?: Partial<Record<OriginId, number>>; // NEW — fine-grained per-origin override (ODI)
}
type OriginId = 1|2|3|4|5|6|7|8|9; // OT:1-10 — Skilled Human..Construct
```

**Extended `ArmorInteraction`** to carry the three multipliers the tables actually use:

```ts
interface ArmorInteraction {                // damageSystem.ts:124 (retained) + pin
  armorEffectiveness: number;   // 1.0 normal; 1.5 buckshot (DTT-2:21); used to scale DR (§4)
  ignoresArmor: boolean;        // edged piercing K-L% chance (DTT-2:42) — resolved per-hit, see §4
  damagesArmor: boolean;        // acid (DTT-2:90), explosion
  damagesArmorMult?: number;    // acid = 2.0× to armor (DTT-2:90); NEW
  bypassesShields: boolean;     // piercing ignores armor "except Force Shield" (DTT-2:42) → false
  drPool: 'physical' | 'energy' | 'mental'; // NEW — explicit pool selector (§4); default by category
  penetrationMult: number;      // PCS:31 (AP=2.0×, laser=2.0×, psychic=2.0×, ice=0.75×) — §6
}
```

---

## 4. The damage equation — exact numbers/formulas (the core)

**Canonical formula (Bible §5.5, the locked ruling):**

```
Final_HP_Loss = round( (Base + StatBonus) × OutcomeMult × OriginMult × CategoryArmorMult ) − Effective_DR
Final_HP_Loss = max(Final_HP_Loss, 0)            // damage floors at 0 (never heals the target)
Effective_DR  = DR_pool × (1 − penetrationMult_normalized) × armorEffectiveness_inverse
```

Step-by-step, every constant cited:

**Step 1 — Base damage.** From W (`Dmg per shot/hit` column): Knife 10, Lead Pipe 5, Katana 15, Pistol 20, Shotgun 30, SMG 20, Assault Rifle 30, Combat Rifle 35, Sniper 40, Rocket Launcher 50, Grenades 50 (W:6-49). Melee/thrown `Base = 0` and damage comes from `StatBonus` (Bible §5.5: melee = STR(+power)). Energy weapons (Thermal/Plasma/Ice/Energy/Electric/Laser Rifle) show `-` in W (W:50-55) → their damage is **power-rank-driven** (`Power_Attack_Stats.csv`), not a flat weapon number. `RULING: 22-C` — for those, `Base = power rank value` (SRM ladder), DoT from the type's `burning`/`freeze` block.

**Step 2 — StatBonus.** `BLUNT_WEAPON`/`SMASHING_*`: `+ STR` (W:8 "dealt damage = weapon damage + STR"). `THROWN`: `+ object weight class + STR/scale` (handed off to throwing formula, Bible §13.3 / `05`/`21` docs; this doc only consumes the thrown `Base`). Ranged gunfire: no STR bonus (weapon is the whole number).

**Step 3 — OutcomeMult** (from the kernel; SRM:37-40, mirrored from `20-core-resolution-4cs.md` §6.1):

| Outcome | Mult | Status policy |
|---|---|---|
| Failed | **0×** | none |
| Minor | **0.5×** | **no status riders** (only power-intrinsic); DoT does not start |
| Success | **1.0×** | standard riders at their base chance |
| Major | **1.5×** | enhanced riders (max chance) + knockback + crit handoff |

**Step 4 — OriginMult** (ODI:5-14 immunities × `damageSystem.ts` multipliers). Resolve in this order:
1. **Hard immunity** → damage rider voided (not the base damage). Construct: Poison/Venom/Asphyxiation/Bleeding = **no effect** (ODI:9,71; "Constructs take full damage but show sparks", ODI:92). Energy-being alien: physical mostly immune (ODI:80).
2. **Multiplier** from `originModifiers` (existing values are authoritative defaults): `SMASHING_MELEE` vs energy = **0.5×** (`damageSystem.ts:188`); vs construct = 0.7×. `ELECTROMAGNETIC_BOLT` vs robotic = **2.0×** (DTT-2:69). `TOXIN_ACID` vs armor = 2.0× (handled in DR, not body).
3. **Tech Enhancement split:** 50%+ cybernetics → counts as PARTIAL bleeder (ODI:92); EMP_Vulnerable=YES → electricity/EMP applies and **stuns + damages** (ODI:71).

**Step 5 — CategoryArmorMult & DR pool.** `category` selects the DR pool (ARM exposes `DR_Physical`, `DR_Energy`, `DR_Mental`):

| Category | DR pool read | Notes |
|---|---|---|
| PHYSICAL, BLEED_PHYSICAL | `DR_Physical` | Buckshot: pool ×1.5 effective (DTT-2:21; `armorEffectiveness`) |
| ENERGY | `DR_Energy` | Energy-hardened materials (MAT_010 2.0×, ARM:114) shine here |
| BIOLOGICAL | `DR_Physical` if sealed (Hazmat/Fire/Air-Filter armor → **immune**, ARM:30,31,95), else **0 DR** | toxins bypass normal plate (skin contact) |
| MENTAL | `DR_Mental` | most armor = 0; Psi_Shielded (+15, MAT_011) / Force_Shield (15) / Energy_Shield (10) matter |
| OTHER | type-specific | Disintegration/Spiritual/Siphon ignore DR (§5); Ebullism/Asphyxiation gated by **sealed-suit immunity** |

**Step 6 — Effective_DR with penetration** (PCS:6-7, :31, :59):

```
penetrationMult = ammoOrPowerPenMult (PCS:31 AP=2.0, Tungsten=2.5, HollowPoint=0.5; PCS:59 Laser/Psychic/Plasma=2.0, Ice=0.75)
Effective_DR    = max( 0, DR_pool − round(DR_pool × (penetrationMult − 1) / penetrationMult) )   // pen ≥1 erodes DR
// equivalently: a 2.0× pen halves DR; 2.5× removes 60%; 0.5× DOUBLES effective DR (hollow point worse vs armor)
```

`ignoresArmor` (edged piercing K-L% per DTT-2:42): on a per-hit roll, if it fires, `Effective_DR = 0` **except Force Shield / Durability** (DTT-2:42; W:25 sniper "not force shield and durability"). Force Shield armor (ARM_SHD_006, ARM_NAT_005) and `Super_Durability` (ARM_NAT_001/2) set a `forceShield: true` flag that survives `ignoresArmor`.

**Step 7 — Armor condition.** Apply ARM:181-187 condition penalties to DR before Step 6: Worn(50-74%) −2 DR, Damaged(25-49%) −5 DR, Critical(1-24%) −10 DR, Broken 0 DR. `damagesArmor` types degrade `Condition_Max` (acid ×2, explosion); Ceramic plates break after 3 hits (CMP_001, ARM:77).

> `RULING: 22-D — round once, at the end of Step 1's product, then subtract integer DR.` Keep all intermediate multipliers as floats; `round()` the `(Base+StatBonus)×OutcomeMult×OriginMult×CategoryArmorMult` product to an int, then subtract integer `Effective_DR`. This avoids the double-rounding drift that makes balance non-reproducible under time-travel replay (Bible §11).

### Worked example (must reproduce in tests)
*Assault Rifle (Base 30, GUNFIRE_BULLET, FMJ pen 1.0) vs a Skilled Human in a Kevlar Vest (DR_Physical 8), Success outcome:*
`(30 + 0) × 1.0 × 1.0(bio) × 1.0 = 30`; `Effective_DR = 8 × (1 − 0) = 8`; **Final = 30 − 8 = 22 HP**. Bleed rider fires (gunfire→bleeding, DTT-2:39) at base chance.
*Same shot with AP rounds (pen 2.0):* `Effective_DR = 8 − round(8 × 0.5) = 4`; **Final = 30 − 4 = 26**; but AP is −25% vs unarmored (PCS:31) — N/A here (target armored).
*Electric Rifle (power Base 30) vs a Sentinel construct (DR_Physical 25 in `DR_Energy`? — electricity reads `DR_Energy`):* construct DR_Energy say 15 → `30 × 2.0(robotic) = 60`; `60 − 15 = 45`; plus O% "break robotic" malfunction roll (DTT-2:70 → ODI:72 Critical_Hit=Malfunction).

---

## 5. Damage-type riders — exact effect numbers (the depth)

Riders fire **on Success/Major only** (Minor = 0.5× damage, no rider; §4 Step 3). Numbers come from `Status_Effects_Complete.csv` (the only table with concrete durations/HP) cross-referenced to DTT-2's qualitative formulas. Where DTT-2 gives only `N/M/K`, the SEC severity tiers supply the shipped defaults.

### 5.1 Bleeding (BLEED_PHYSICAL types 11-15) — SEC:2-4
| Severity | Dmg/turn | Duration | Move pen | Action pen | Source |
|---|---|---|---|---|---|
| I | 5 HP | 3 turns | none | −1CS phys | SEC:2 |
| II | 10 HP | 5 turns | −1 sq | −2CS phys | SEC:3 |
| III | 20 HP | until treated | −2 sq | −3CS all | SEC:4 |
- **Severity selection:** Success→I, Major→II, called-shot/Major-overkill→III. `RULING: 22-E`.
- **Stacking:** bleeding from multiple sources **stacks** (ODI:91). `maxStacks` per `BleedingEffect` (default 3).
- **Origin gate:** check `origin.Bleeds` (ODI:5-14) before applying. Construct→spark cosmetic, no HP rider (ODI:68). Divine→golden ichor, same mechanics (ODI:88).
- DTT-2:29-34 "FAST Bleeding" = turn-based variant (deals N each M **turns**); use for the real-time clock mode.

### 5.2 Burning / Fire (ENERGY type 16-17) — SEC:34, DTT-2:49-55
- `BurningEffect`: `initialDamage` + `damageIncrease`/turn (DTT-2:52 "N+M×K rising"), `duration` 4 turns (SEC:34), `spreadChance` % to adjacent tiles (only on **flammable surfaces**, DTT-2:49 → `TerrainCodes`/`Environmental_Objects` flammable flag).
- **Does NOT stack — refreshes duration** (ODI:91). **Stop-drop-roll or water** ends it (SEC:34).
- Thermal vs Fire: Thermal **decays fast after attack ends** (DTT-2:53), Fire **persists** (DTT-2:50). Both can disintegrate at high temp (DisintegrationEffect, §5.6).
- **Fire causes NO knockback** (kernel E11; `20-core` §6.2) — `knockback` block absent.

### 5.3 Freeze (ENERGY_ICE type 19) — SEC:33, DTT-2:60-63
- `FreezeEffect`: N/sec DoT ∝ temp; `duration` 3 turns (SEC:33); **K-L% chance to Frozen** ∝ temp. Frozen = immobile, blind, physical actions −3CS (SEC:33).
- **Break free:** target STR-check vs freeze rank (SEC:33; ES:22-24), OR a higher-rank attack hits, OR `canShatter` → **shatter for extra damage** (`shatterDamage`; ES:24 "attack of higher rank"). Death visual `frozen` → `freeze_shatter` / ice_shards (ODI:59).

### 5.4 Poison / Venom / Acid / Virus / Disease (BIOLOGICAL types 24-29) — SEC:5-10
| Type | Dmg model | Duration | Cure | Robotic? | Source |
|---|---|---|---|---|---|
| Poison I/II/III | 3/8/15 HP/turn **decaying**; −1/−2/−3CS CON | 6/10/until-treated turns | antidote/medical | **no effect** | SEC:5-7, DTT-2:80-83 |
| Venom | as poison but **stronger+longer**; only via piercing/bite | longer | antidote | no effect | DTT-2:84-88 |
| Acid | N/sec for K-L sec; **×2 to armor** (DR, §4) | short | wash/medical | armor yes, body yes | DTT-2:89-91 |
| Virus | no direct dmg; Sickness 100%; → Disease after N sec | until cured | (becomes Disease) | no effect | DTT-2:92-95 |
| Disease I/II/III | daily stat loss / −1CS / −2CS all stats | 7d/14d/weeks | **hospital only** (III: quarantine) | no effect | SEC:8-10, DTT-2:96-99 |
- **All biological gated by origin:** Poison/Venom/Virus/Disease/Asphyxiation = **no robotic** (ODI:9 Construct Poisons=NO; DTT-2). Acid is the exception (eats armor).
- Sickness side-effect (DTT-2:82 "L% chance"): apply `SICK_NAUSEATED` status (SEC:14-16 — flu/fever/critical I/II/III, −1CS to N random stats, 25/50/cannot-act turn-loss).

### 5.5 Electricity & paralysis (ELECTROMAGNETIC_BOLT type 21) — DTT-2:67-71, SEC:31
- N% **paralyze** living K-L sec → `Paralyzed` (cannot move, no physical actions, 5 turns, SEC:31). M dmg. **×2 vs robotic** (origin, §4). O% **break robotic** → construct Malfunction roll (ODI:72). P% disintegration.
- EMP interaction: Tech Enhancement origin EMP_Vulnerable=YES → "Stunned + damage" (ODI:71); Construct EMP=YES (ODI:14).

### 5.6 Disintegration (types 17-23 chance, 32 guaranteed) — DTT-2 + ODI:37
- `DisintegrationEffect.baseChancePct` (N) per hit; on fire → target reduced to **dust** (death visual `dust`, ODI:37,60 — `leaves_body=NO`, no clone-from-body possible → interacts with cloning, `108-hospital-cloning-recovery-loop.md`).
- `threshold: 'living'` for Radiation/Thermal "melt living only" (DTT-2:73). `areaExplodeChancePct` for Pure Energy (DTT-2:66).
- `RULING: 22-G` — disintegration **ignores DR** (it's a state change, not HP); resolve as: if chance fires AND target HP after this hit ≤ 0 → death visual `dust`; if target survives, no disintegration (you can't half-disintegrate). This keeps it a kill-confirm flourish, not a damage multiplier.

### 5.7 Mental (types 30-31) — DTT-2:109-118, SEC:21,53
- `MENTAL_CONTROL`: no damage; `Mind Controlled` status (enemy controls all actions, SEC:21), duration N sec; M% `weakness` (Power_Dampened, SEC:53, −50% LSW). Bypasses physical cover (PCS:59 — 2.0× pen, "ignores physical barriers"); blocked by `DR_Mental` / psi-shield / Force_Aura (ARM_NAT_005).
- `MENTAL_BLAST`: N damage (read `DR_Mental`), M% weakness.

### 5.8 Other exotic (types 32-38)
- `SIPHON`: N dmg/sec to target **+ N heal/sec to attacker** (DTT-2:121). Affects all but constructs (no life energy).
- `SPIRITUAL/Exile`: affects **all origins** (DTT-2:119; ODI cannot grant immunity); N% "life leaves body" ∝ exposure → instant-death check.
- `ASPHYXIATION`: rising dmg; O% unconscious P sec; **no robotic** (sealed suits/Air_Filter immune, ARM:95).
- `EBULLISM`: rising dmg; after L sec living origin **collapses**; triggered by **vacuum or flying too high** (DTT-1:42 → Flight altitude Z6+, Bible §5.4) — the only damage type the **flight system** can self-inflict.
- `DECOMPOSITION/Aging`: Sickness 100%; N% lose body parts → feeds crit/injury permanent-disability pipeline (Bible §5.6).

---

## 6. BAMPI — attack-shape modifies how the damage is delivered

Source: BAMPI.csv (notes), Bible §5.12/§13.6. Every `DamageDefinition.bampi` declares one shape; the **Power Activation Engine** branches on it. This doc owns how shape changes *damage delivery* (not the kernel's to-hit):

| Shape | Damage-delivery rule | Source |
|---|---|---|
| **BEAM** | Must maintain aim across turns to keep dealing DoT; **chargeable** → +damage but caster is vulnerable & can only move-forward/stand (BAMPI:1-5). | BAMPI |
| **AREA** | Center→edge falloff; **altitude falloff** Z3+ (grenades/explosives lose effect, Bible §5.4 RULING). High chance of collateral (BAMPI:2). | BAMPI:2; Bible §5.4 |
| **MELEE** | Range 0–1, enables wrestling; uses STR for damage. | BAMPI:2; §5.9 |
| **PROJECTILE** | Travels; dodgeable/interceptable; penetration & **continuation** (line attacks hit ≤5 targets, −damage each pass, PCS:111-116). | PCS |
| **INSTANT** | Hitscan (laser/psychic); **can't be dodged** by sub-light targets (DTT-2:75). | DTT-2 |

**Continuation (PROJECTILE/BEAM through cover/targets), PCS:6-10, :111-116:**
```
Continuing_Damage = Base_Damage − (Obstacle_HP ÷ 2)   // min 1 if it penetrates (PCS:9)
Penetrates if: Base_Damage × penetrationMult > Obstacle_HP   (PCS:7)
Max 5 penetrations (PCS:115); 3×3 reduced-damage debris zone behind (PCS:116)
```
Material HP for the penetration check: Glass 10, Drywall 25, Wood 40, Brick 80, Concrete 120, Steel_Structural 150, Steel_Armored 200, Blast_Rated 300 (PCS:13-25). Cover degrades one tier when penetrated (PCS:127-131).

---

## 7. Throwing & knockback impact (this doc's slice)

This doc **consumes** the canonical throwing formula (Bible §13.3, owned by `21-tactical-combat-grid.md`) — it only needs the *damage* outputs:
- Thrown-object base damage by weight class (PCS:67-74): Light 5, Medium 15, Heavy 30, Very_Heavy(car) 50, Massive(bus) 100, Colossal 150; `+ STR/scale`.
- **Knockback impact damage** (when a knocked-back unit hits a wall, PCS:90-109): `Impact_Damage = Remaining_KB_squares × 5`; 3sq→Dazed, 6sq→Stunned 1t, 10sq→Stunned 2t (PCS:100-109). Wall-penetration if `Impact_Damage > Wall_HP` (PCS:92) → through-wall damage `Wall_HP ÷ 2`, KB −2 sq, target Prone (PCS:94-97).
- Knockback **distance** itself is the knockback doc's job (Knockbag chart: STR 40-49→4sq, 50-59→6, 60-69→8, 70-79→10, 80-99→9, 100-150→10). This doc raises `triggersKnockback` exactly as the kernel set it (`20-core` §6.2) and consumes the returned distance to compute impact damage above.

> `RULING: 22-H` — "thrown large object lands-on-pin" (type 4, DTT-2:15-17): on a K-L% roll the object pins the target → apply `Immobile` (SEC `Pinned`-style, until STR-check passes) **instead of** knockback. The two are mutually exclusive per hit.

---

## 8. How it consumes the SPINE (country / city / culture → damage)

The damage *kernel* is location-agnostic, but the spine reaches it through **what enters combat** and through a small set of damage-relevant modifiers. Every link cites its table.

**8.1 Origin distribution is set by the spine.** Which origins you *face* (and thus which damage types are effective) is a country/culture output:
- `Culture_Region_Effects.csv` power affinity (Bible §6.3): South Asia +2CS spiritual/mystical LSWs → expect Mystic/Divine origins (ODI:13 ichor, Spiritual affects all). North America +2CS mutation/tech → expect Mutant/Tech-Enhancement (EMP-vulnerable, electricity ×2). The encounter generator (`02-event-emergence-engine.md`) reads culture → seeds enemy `OriginId` → this doc's `OriginModifiers` decide what hurts them.

**8.2 City type gates damage-type *access* (your loadout).** `City_Type_Effects.csv`:
- Military city: arsenal −20% gear (Bible §6.2) → energy/AP ammo available → you can bring `ELECTROMAGNETIC_BOLT`/`GUNFIRE_AP`. A Village has none → you fight with `SMASHING_MELEE`/`BLUNT_WEAPON`.
- Temple/mystic affinity → `SPIRITUAL`/`MENTAL` damage sources for sale.
- **Formula:** `availableDamageTypes(city) = union(weapon.damageType for weapon in cityArsenal(city.type, city.country))`. The damage model itself doesn't compute this; it is consumed by loadout (`sht-loadout-optimizer`), but the *binding weapon→damageType* (§2 column) is this doc's contract.

**8.3 Country science/cloning changes the *stakes* of disintegration & death.** `Country_Attribute_Effects.csv` Cloning column (Bible §6.1): Cloning High → 90% resurrection. **Disintegration (`dust`, leaves_body=NO, ODI:60) defeats body-based cloning** → a disintegrated hero in a no-clone or body-required country is **permadead** (Bible §5.6, `108-hospital-cloning-recovery-loop.md`). So the *value* of bringing/avoiding disintegration damage is a spine output. Formula consumed downstream:
```
canResurrect(unit) = country.cloningLevel ≥ threshold
                     AND NOT (unit.deathVisual == 'dust')   // disintegration/ebullism leave no body
```

**8.4 Country Healthcare/Science → DoT cure speed.** `Status_Effects_Complete.csv` ties Disease III to "hospital only / quarantine" (SEC:10); the **hospital quality** that clears it is `Healthcare + GDP` (Bible §8 Medical row). So a Poison/Disease rider's *real-world cost* (days out of action) is set by the country you heal in. This doc emits the status + `Medical_Treatment` requirement (SEC column); the hospital system (`108-…`) consumes it with the spine formula.

**8.5 Personality → no damage numbers, but → who eats the damage.** `PERSONALITY TARGET SELECTION` (Bible §5.10) picks the *target*; this doc then resolves the type-vs-origin interaction on that target. (No CS from this doc; pure AI-caller handoff, per `20-core` §7.)

> `RULING: 22-I` — the damage model **reads** spine outputs (origin mix, arsenal, cloning, healthcare) but **never reads raw country columns**. It receives a resolved `EncounterContext { enemyOrigins, availableDamageTypes, canResurrect, hospitalTier }` from the combined-effects layer (`14-combined-effects.md`), honoring Bible §13.9 ("combined-effects must be consumed"). This keeps the damage code pure and data-driven.

---

## 9. Edge cases & failure modes

| # | Case | Rule | Source / label |
|---|---|---|---|
| E1 | Minor outcome | 0.5× damage, **no riders start**, no DoT, no status | §4 Step 3; `Advanced_Universal_Table.csv:83` |
| E2 | Final_HP_Loss < 0 (DR > damage) | Clamp to **0**; "absorbed"/"deflects off" verb (ODI:22 Armor_Verb_Block) | §4; ODI |
| E3 | Bleeding on a Construct/Energy-being | Void rider; show **sparks** (Construct, ODI:68) / nothing (energy being) | ODI:9,91 |
| E4 | Poison/Venom/Asphyxiation on Construct | **No effect** (immune); show no status | ODI:9; DTT-2:83 |
| E5 | Acid on Construct | Damage + **armor erosion still apply** (acid eats non-bio too, DTT-1:32) | DTT-1:32; DTT-2:90 |
| E6 | `ignoresArmor` rolls true vs Force Shield / Durability | Armor still applies (the named exceptions) | DTT-2:42; W:25 |
| E7 | Burning + Burning (second fire hit) | **Refresh duration, do not stack** | ODI:91 |
| E8 | Bleeding + Bleeding | **Stack** (up to maxStacks) | ODI:91 |
| E9 | Disintegration fires but target survives the HP hit | **No disintegration** (can't half-dust) — flag only on lethal | §5.6 RULING 22-G |
| E10 | Laser/Psychic vs a dodging defender | Dodge contributes **0CS** (can't be dodged, DTT-2:75; PCS:59) | DTT-2; PCS |
| E11 | Mental damage vs 0 DR_Mental target | Full damage + weakness; this is *intended* (most armor has no mental DR) | ARM; §4 |
| E12 | Radiation/Virus "no direct damage" | Apply **status only** (melt-chance / Sickness); Final_HP_Loss from base = 0 | DTT-2:72,92 |
| E13 | Hollow-point vs heavy armor | pen 0.5× → `Effective_DR ×2` (worse); −intended | PCS:31; §4 Step 6 |
| E14 | Ebullism on a robotic origin at Z6 | **No effect** (no moisture); robots may fly high safely | DTT-1:41; §5.8 |
| E15 | Damage type has no DR pool match (exotic) | Spiritual/Siphon/Disintegration **ignore DR** entirely | §5.6,§5.8 |
| E16 | Two source tables disagree on a type's rider | **DTT-2 (parameterized) wins** over DTT-1 (descriptive); both lose to `Status_Effects_Complete.csv` for concrete numbers | RULING 22-J |
| E17 | Armor at 0% condition (Broken) | DR = 0 for all pools; cannot be worn (ARM:187) | ARM:187 |
| E18 | DoT tick while unit is Frozen/Stunned | DoT continues (passive); CC blocks *actions*, not riders | SEC; §5 |

**Failure modes to guard in code:**
- **Rider double-application** under the real-time clock: a DoT must tick on a **fixed cadence** (per game-turn in turn mode; per `M secs` in real-time mode, DTT-2:30) — gate ticks by a `lastTickAt` timestamp so pause/time-travel replay (Bible §11) is deterministic.
- **Origin not loaded** → never apply a bio/electric rider without `origin` present; default-deny (treat unknown origin as Skilled Human, ODI:6, all standard vulnerabilities) and log a dev warning.
- **Non-integer HP drift** → enforce RULING 22-D (single round); add a test asserting the §4 worked examples reproduce exactly.
- **Disintegration + cloning race** → set `deathVisual='dust'` atomically with the death event so `canResurrect` (§8.3) reads the right flag.

---

## 10. Integration points (systems this reads / writes)

**Reads (inputs):**
- `outcome` + `damageMultiplier` + `triggersKnockback` + `triggersCritTable` ← **resolution kernel** (`20-core-resolution-4cs.md` §6).
- Attacker `STR`/power rank, weapon/power `Base` + `bampi` + `penetrationMult` ← `Character` (`07-character-model.md`), `Weapons_Complete.csv`/`W`, `Power_Attack_Stats.csv`.
- Target `OriginId`, DR pools (`DR_Physical/Energy/Mental`), armor condition, `forceShield`/`durability` flags ← `Character`, `Armor_Complete.csv`/`armor.ts`, shield system (`SHIELD_IMPLEMENTATION.md`).
- `EncounterContext` (enemy origins, arsenal, cloning, hospital tier) ← **combined-effects** (`14-combined-effects.md`), spine §8.
- Obstacle/material HP, cover tier ← tactical grid (`21-tactical-combat-grid.md`; PCS material table).

**Writes (outputs other systems consume):**
- `Final_HP_Loss` → unit HP (combat scene `CombatScene.ts`).
- Status applications → **status-effect system** (`Status_Effects_Complete.csv` runtime; the CC/DoT manager).
- `deathVisual` + `leaves_body` → **death/funeral & cloning** (`108-hospital-cloning-recovery-loop.md`, Bible §5.6,§7.3); `'dust'`→no body.
- `triggersKnockback` (+ computed `Impact_Damage`) → **knockback system** (`knockbackSystem.ts`, Knockbag chart).
- `triggersCritTable` → **crit/injury pipeline** (`CRIT TABLE`→`Injury_System.csv`; permanent-disability for Decomposition/limb-loss).
- `damagesArmor` → **armor condition** (ARM:181-194 degrade/repair).
- Collateral on `Major` overkill / environmental fire spread → **fame/reputation/legal** (`17-fame-reputation-legal.md`, `Public_Perception.csv`, Bible §9 — collateral is a years-long consequence).
- Bleed/poison/disease persisting after combat → **hospital/recovery** (`108-…`; SEC `Medical_Treatment`/`Clone_Required` columns).
- Every damage event `{type, base, outcome, final, deathVisual}` → **combat replay buffer** for time-travel save (Bible §11).

**Sibling consumers that must call THIS doc (not roll their own damage):** `CombatScene.ts`, the Power Activation Engine (BAMPI dispatch), environmental hazards (fire/acid tiles), trap/explosion resolution. `RULING: 22-K` — **no system computes `Final = Damage − DR` itself**; all route through this module's `applyDamage(context)`. Duplicate damage math is the contradiction the Bible §13 rulings exist to prevent.

---

## 11. UI / UX hooks (symbolic, light)

Per the locked context, combat is **plain grid + glyphs**; the damage math is hidden. Hooks:

- **Hit verb flash** (combat overlay): map `category`+`outcome`+armor result → a verb from `ODI:18-39`. e.g. EDGED_MELEE Success="slashes", Major="CLEAVES", armor-block="deflects off", armor-bypass="RENDS through". This is the *whole* symbolic readout of a hit — one word + a damage number floats up.
- **Damage number color by category:** Physical=bone/white, Energy=gold/amber, Bio=green, Mental=teal, Other=red (project palette; **no purple**, per house rule). DoT ticks are smaller, same color.
- **Status icons** on the unit glyph: burning 🔥, frozen ❄, bleeding 🩸, poisoned 💉, paralyzed ⚡, mind-controlled 🧠 — one small icon per active effect (emojis from DTT-1:4 category set / `damageSystem.ts` `emoji`).
- **Death visual** (symbolic): `ODI:41-64` → a single glyph transition + sound cue. `frozen`→shatter, `dust`→scatter (and a "NO BODY — cannot clone" toast if the unit had a clone backup, tying §8.3 to the phone).
- **Optional damage tooltip** (advanced, off by default, same F-key as the kernel's CS breakdown, `20-core` §9): shows `(Base+STR) × OutcomeMult × OriginMult − Effective_DR = Final`, with the origin-interaction line highlighted ("×2 vs Robotic", "Immune: Poison"). This is the only place the player sees the equation.
- **Phone/laptop:** post-combat **injury/DoT report** in the personnel app — "Agent K: Bleeding II (5 turns), needs hospital" (SEC `Medical_Treatment`); a disease/poison sets a recovery timer the player sees on the world map. A disintegration death triggers an **obituary** entry (Bible §7.3) immediately (no body to recover).
- **World map:** no direct damage UI, but the **encounter preview** can hint "enemy: Construct — bring energy/EMP" (reading `OriginModifiers` weaknesses), turning §8.1's spine output into a readable tactical tell.

---

## 12. Open questions

1. **Real-time vs turn DoT cadence.** DTT-2 specifies DoT in "secs" with a "FAST" turn-based variant (DTT-2:30,33). The world clock is real-time-with-pause (Bible §11) but tactical combat is turn-based (Bible §5.1). Need a confirmed mapping `1 turn = N secs` for DoT (proposed: reuse the §5.1 action economy's implicit turn length). **Blocks** exact bleed/burn totals.
2. **`N/M/K/L/O/P` shipped defaults.** DTT-2:127 explicitly leaves these as config knobs. §5 fills the ones SEC pins (bleed 5/10/20, etc.); the rest (disintegration %, freeze %, paralyze sec) need a balance pass. Proposed defaults are labeled but should go through `combat_batch_tester.js` (the existing sim harness) before lock.
3. **Force Shield vs `ignoresArmor` interaction** when a unit has BOTH normal armor and a force shield (ARM_SHD_006 bubble): does piercing ignore the plate but not the bubble? §4 Step 6 says force-shield survives; confirm the bubble absorbs first (shield-before-HP, `SHIELD_IMPLEMENTATION.md`).
4. **Alien per-species tables.** ODI:75-82 gives 6 alien archetypes (Silicon/Energy/Insectoid/etc.) with custom immunities; the schema's `vsOrigin` only keys the 9 base origins. Do aliens get a sub-type key, or is each alien a data row with explicit immunities? (Proposed: alien `Character` carries its own `damageImmunities[]` overriding origin defaults.)

---

## 13. RULING: notes (collected)

- **22-A** "30+" satisfied at 32+ types; canonical set = union of DTT-1 ∪ DTT-2 ∪ `damageSystem.ts` (38 slots, 32 distinct riders). (§2)
- **22-B** ids are the `damageSystem.ts` SCREAMING_SNAKE; fix the Cyrillic-Е typo. (§2)
- **22-C** energy-rifle damage (W shows `-`) = power rank value, not a flat weapon number. (§4 Step 1)
- **22-D** round the multiplier product **once**, then subtract integer DR (replay determinism). (§4)
- **22-E** bleed severity: Success→I, Major→II, called-shot/overkill→III. (§5.1)
- **22-G** disintegration ignores DR; only fires on an otherwise-lethal hit (no half-dusting). (§5.6)
- **22-H** "thrown large object pin" applies Immobile **instead of** knockback. (§7)
- **22-I** damage model reads resolved spine outputs (`EncounterContext`), never raw country columns. (§8)
- **22-J** table precedence: `Status_Effects_Complete.csv` (numbers) > DTT-2 (parameterized) > DTT-1 (descriptive). (§9 E16)
- **22-K** single `applyDamage()` chokepoint; no system computes `Damage − DR` itself. (§10)
- **Inherited from `20-core`:** Minor=0.5×/no status; Major=1.5×+handoffs; non-physical Major = no knockback; one crit pipeline (prototype %-crit table deprecated). (§4)

---

## 14. OWNER-FORK: notes (product choices, not derivable from data)

- **22-F — MVP damage-type subset.** The data model defines all 32+; which ship in the first playable is a content/scope call. *Recommendation* (not a ruling): ship the **physical + bleed + fire/electric/laser + poison + concussion** core (~14 types) that bind to the existing weapon list (W:6-55), and gate the exotic OTHER category (Spiritual/Siphon/Ebullism/Decomposition) behind later LSW-power content. The schema must still define them so modders/content can enable them without code (Pillar #1).
- **22-L — Gore/death-visual intensity.** ODI death visuals (charred, blood_pool, dust, internal_bleed) are flavorful but tone-setting. The symbolic-grid aesthetic can render these as abstract glyphs (a puff, a shatter) or literal. Owner picks the tone; default to **abstract glyph + sound cue** to match "plain grid + glyphs."
- **22-M — Friendly-fire & collateral lethality.** AREA/continuation damage can hit allies and civilians (PCS:118 "GM tracks what's behind targets"; fame §9). How punishing collateral is (full damage to allies? civilian-death fame cliff?) is a difficulty/tone choice — wire it to `104-ai-director-difficulty.md`, default **on** (collateral matters, Bible Pillar #3).
- **22-N — Hollow-point/AP ammo economy.** PCS:31 gives ammo a cost multiplier (AP 3×, Tungsten 10×). Whether ammo types are an inventory/economy item or a simple toggle is a product call; default to **economy item** so the §8.2 city-arsenal spine matters.
