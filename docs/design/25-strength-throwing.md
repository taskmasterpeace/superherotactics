# 25 — Strength / Lifting / Throwing / Environmental Objects

> **System owner doc.** Build-ready spec for SuperHero Tactics' (SHT) **strength feats**: what a character can **lift / carry / break**, how an object becomes an **improvised thrown weapon** (or a held melee club), the **damage / range / accuracy** of throwing it, and the **environmental & legal fallout** of doing so on a city street. This is the system that delivers the GDD's promise — *"Characters that have enough strength can throw cars"* (`SHT-dir/FIST GDD v02.txt:1095`).
>
> **Status:** spec (v1.0). The combat scene already has basic knockback and a weapon bridge (`MVP/src/game/scenes/CombatScene.ts`, `weaponIntegration.ts`); object-throwing as a first-class attack is **not yet implemented** — this doc is the canonical design it must converge on.
>
> **Scope (locked).** This doc owns: the STR→liftable-weight ladder, the break/material ladder (what STR shatters glass→adamantium), the **lift / pick-up / throw action economy**, the **one canonical throwing formula** (range + damage + accuracy, per Bible §13 #3), thrown-object **area & Z-axis** rules, the **improvised-melee** use of objects, the **~50-object environmental catalog** (weight/damage/STR-req/value/legal tier), and the **collateral/legal write-back** to the strategic layer. It **hands off** to siblings and does **NOT** own: the d100 roll itself (doc 20), the grid/range-band/LOS/cover skeleton & AP refresh (doc 21), the damage-type rider math once `BLUNT/FIRE/ELECTRICAL/…` is assigned (doc 22), the crit→injury pipeline (doc 23), status effects (doc 24), throwing a **person** as a grapple move (doc 26 — `THROW_LAUNCH`), and BAMPI/Power-Activation for telekinetic throws (doc 27). It defines the **hand-off contract** to each (§9). Per Bible §5 combat is specced **lighter** — *one verb, not the point*.
>
> **Bible alignment:** `SHT_MECHANICS_BIBLE.md` §3.2 (one rank ladder), §5.5 (damage = STR + object), §5.8 (strength/lift/throw/environment + **the canonical throwing-formula ruling**), §13 #3 (one throwing formula; fill the STR 50–81 gap), #7 (strength ladder = the one ladder), #8 (no XP; STR rises only via training), #9 (combined-effects must be consumed), §14 (data→table map).
>
> **Sourcing rule:** every number cites a source table. A value with no table is `RULING:` (a Bible-consistent design call) or `OWNER-FORK:` (a product choice only the owner makes). Source files live under `docs/csv-source-data/` (root) and `docs/csv-source-data/Game_Mechanics_Spec/` (abbrev. **GMS/**), plus `SuperHero Tactics/` (abbrev. **SHT-dir/**). **Primary tables (opened for this spec):**
> - **SHT-dir/Combat Compendium REAL - 🏋🏾‍♀️STRENGTH AND WEIGHT💪🏾.csv** — the raw STR-value → max-liftable-lbs ladder (the granular per-point table).
> - **GMS/Lifting_Throwing_Projectile_System.csv** — lift bands, throw mechanics, thrown-damage classes, AP costs, Z-axis, area shapes.
> - **Environmental_Objects.csv** — the ~50-object catalog (weight, base damage, damage type, range/accuracy modifier, STR req, area, value, legal tier).
> - **Improvised_Weapons.csv** — per-weight-class throw/melee formulas that bridge the catalog into combat (range/damage/legal multipliers).
> **Secondary tables:** GMS/Stat_Rank_Mapping.csv (rank ladder + `Lifting_Capacity_lbs`), GMS/Universal_Table_FIXED.csv (the STR-column outcome bands), Knockback_Mechanics.csv (material-strength ladder + STR→knockback + falling damage), GMS/Wrestling_Martial_Arts_Complete.csv (Sheet 5 throws & Sheet 8 super-strength environmental destruction — the person-throw sibling), GMS/City_Type_Effects.csv & GMS/Country_Attribute_Effects.csv (the spine plug), GMS/Tactical_Grid_System.csv (grid unit = 2 m/sq), `SHT_MECHANICS_BIBLE.md`.
>
> **Sibling docs:** `20-core-resolution-4cs.md` owns `resolve()` and the rank ladder; `21-tactical-combat-grid.md` owns the grid/AP/range-band/cover skeleton (this doc's pick-up/throw actions are AP-costed inside its round loop); `22-damage-types` owns the rider once a damage type is tagged; `23-criticals-injury` and `24-status-effects` consume Major outcomes; `26-wrestling` owns throwing a *living* opponent; `27-powers-bampi` owns telekinetic/gravity throws. This doc is the bridge from "STR is a number" to "she ripped the bus stop out of the ground and threw it through a wall."

---

## 1. Overview & player fantasy

**Strength is a key to the world, not just a damage number.** The fantasy this system sells, in three beats:

1. **"I can pick that up."** Standing next to a parked car, a strong-enough hero gets a context verb: *grab it.* The street is an arsenal — a trash can ($50, harmless), a fire hydrant (heavy, soaks a hit), an ATM (slow, devastating, *and the bank presses charges*), a propane tank (light, but it goes off). Weak heroes throw chairs and rocks; an Incredible-tier bruiser uproots a tree; an Amazing-tier monster throws the city bus and the *whole street is the blast radius* (`Environmental_Objects.csv:9` City Bus, 120 dmg, Area 4×4). The GDD names this exact moment: *"Characters that have enough strength can throw cars"* (`SHT-dir/FIST GDD v02.txt:1095`).

2. **"Strength has a price tag."** Every object carries a **dollar value** and a **legal-consequence tier** (`Environmental_Objects.csv` `Cost_To_Replace`, `Legal_Consequences`). Throwing a hot-dog cart wrecks a vendor's livelihood; throwing a police car is *government property + emergency-service disruption*; rupturing a nuclear-waste cask is an environmental-disaster charge that follows you for the rest of the campaign (Bible §9, hand-off §9 here). This is the spine reaching *into the grid*: the country you're standing in decides how hard that charge lands (§8).

3. **"Big strength is the slow, loud, expensive option."** The action economy makes super-strength a *commitment*: picking up a bus costs 4 AP and throwing it costs 5 — that is your whole turn and then some, you are stationary, you eat a −5CS accuracy penalty, and you may level a building. It is a **risk/reward verb**, not a free auto-win. Per Bible §13 #8 there is **no XP leveling** — STR rises only through **training that erodes without upkeep** (GDD: *"weight training improves strength statistic,"* `SHT-dir/FIST GDD v02.txt:259`), so "can I throw the bus?" is a standing question about who you've kept in the gym.

**One-line pitch:** *The environment is ammunition priced by law — your STR rank decides what you can lift, what you can shatter, and how big a check the city writes you afterward.*

---

## 2. Canonical units & the STR rank ladder (READ FIRST)

### 2.1 Units (inherited, not re-defined)
| Unit | Value | Source |
|---|---|---|
| 1 grid square | **2 meters** | `GMS/Tactical_Grid_System.csv` `Grid_Type` (via doc 21 §2.1) |
| Weight unit | **pounds (lb)** is canonical for objects | `Environmental_Objects.csv` `Weight_Pounds` (the object catalog is in lb) |
| STR "rank value" | the **raw STR stat number** (1–10000+), *not* the rank-band index | `GMS/Stat_Rank_Mapping.csv` (resolves raw→rank) — see RULING ST-1 |
| Rank ladder | Feeble…Beyond, one ladder for lift/break/knockback/throw | Bible §3.2/§13 #7, `GMS/Stat_Rank_Mapping.csv` |

> **RULING ST-1 (what "STR" means in every formula below).** The throwing/lifting formulas in source mix "STR_rank_value", "Character_STR", and "STR" loosely. **Canonical: every formula uses the unit's raw STR stat integer** (e.g. STR 45), because (a) `Environmental_Objects.csv` STR requirements are written as raw thresholds ("STR 60+ required", `:10`), (b) the Bible §5.8 formula reads `STR_rank_value − Weight/50` and only raw STR makes the units commensurate with a weight-in-lb term, and (c) doc 20 already maps raw→rank for the *outcome-band lookup*. So: **raw STR drives lift-weight, range, damage, and STR-requirement gates; the rank ladder is used only to (i) read the Universal-Table column for the lift/throw-accuracy roll and (ii) read knockback distance.** One number, two lookups.

### 2.2 The lift-capacity ladder (raw STR → max liftable weight)

Two source tables describe the same ladder at different granularity. We ship **both**, layered:

**(A) Granular per-point table — `SHT-dir/🏋🏾‍♀️STRENGTH AND WEIGHT💪🏾.csv`** is the *fine* lookup (every STR value 2→49 has an explicit `Max lbs.`). Representative rows (all cited):
| Raw STR | Max lift (lb) | Rank band | Source row |
|---|---|---|---|
| 2 | 50 | Feeble | `:2` |
| 5 | 100 | Poor | `:7` |
| 9 | 200 | Typical | `:11` |
| 15 | 320 | Good | `:16` |
| 19 | 400 ("absolute most a 20-year-old should do") | Good | `:21` |
| 29 | 800 | Excellent | `:31` |
| 30 | 900 ("Gray Hulk") | Remarkable | `:32` |
| 39 | 2,200 | Remarkable | `:40` |
| 49 | 22,400 | Incredible | `:50` |

> **GAP (the documented STR 50–81 gap, Bible §13 #3):** rows 51–81 in this file are **empty** (`:51`–`:81` have only the STR index, no `Max lbs.`). This is the gap the Bible orders us to fill. We fill it from table (B) below — see RULING ST-2.

**(B) Banded fallback table — `GMS/Lifting_Throwing_Projectile_System.csv` "LIFTING CAPACITY BY STRENGTH" (`:5`–`:18`)** covers the *whole* range in bands and is the **continuous source of truth** that closes the gap:
| Raw STR band | Lift (kg) | Lift (lb) | Object examples | FEAT required | Source row |
|---|---|---|---|---|---|
| 1–5 | 50 | 110 | Chair / small box | Auto success | `:6` |
| 6–10 | 100 | 220 | Person / large TV | Auto success | `:7` |
| 11–20 | 200 | 440 | Motorcycle / refrigerator | Minor or better | `:8` |
| 21–30 | 400 | 880 | Small car / piano | Success or better | `:9` |
| 31–40 | 1,000 | 2,200 | Car / truck bed | Success or better | `:10` |
| 41–50 | 2,500 | 5,500 | SUV / small truck | Success or better | `:11` |
| **51–75** | **10,000** | **22,000** | **Bus / semi truck** | Success or better | `:12` |
| **76–100** | **50,000** | **110,000** | **Tank / small building** | Success or better | `:13` |
| 101–150 | 200,000 | 440,000 | Airplane / large building | Success or better | `:14` |
| 151–250 | 1,000,000 | 2,200,000 | Cruise ship / skyscraper | Success or better | `:15` |
| 251–500 | 5,000,000 | 11,000,000 | Aircraft carrier / mountain | Major required | `:16` |
| 501–1000 | 50,000,000 | 110,000,000 | Island / asteroid | Major required | `:17` |
| 1001+ | Unlimited | Unlimited | Planet / star | Cosmic only | `:18` |

> **RULING ST-2 (lift-capacity resolution order — closes the 50–81 gap).** `maxLiftLb(str)` resolves in this order: **(1)** if the granular table (A) has an explicit `Max lbs.` for that exact raw STR → use it (covers 2–49, plus the Hulk reference points). **(2)** Otherwise use the band table (B) (covers everything, especially 50–100+). Within a band, **linearly interpolate between the band's lb value and the next band's** so the curve is continuous, not a staircase (`interp` between `:12`/`:13`/… so STR 63 ≈ 66,000 lb, not a cliff at 75). This both honors the granular Marvel-reference anchors *and* fills the Bible-flagged gap with the only other source that spans it. `Stat_Rank_Mapping.csv` `Lifting_Capacity_lbs` (`:2`–`:19`) agrees with table (B) to the rank and is used as the cross-check, not a third source (it gives ranges like `2500-22400` for Incredible — i.e. bands B `:11`–`:12`).

### 2.3 The break / material-strength ladder (what STR shatters what)

From `Knockback_Mechanics.csv` "Material_*" rows (`:18`–`:27`) — **this is the one material ladder** (Bible §5.8 "glass→drywall→wood→brick→…→adamantium"):
| Material | Material strength (rank) | Destroyed by STR rank ≥ | Source row |
|---|---|---|---|
| Glass | Feeble (1–9) | Typical+ (≥20) | `:19` |
| Wood | Poor (10–19) | Good+ (≥30) | `:18` |
| Drywall | Typical (20–29) | Excellent+ (≥40) | `:20` |
| Brick | Good (30–39) | Incredible+ (≥60) | `:21` |
| Steel frame | Excellent (40–49) | Amazing+ (≥70) | `:22` |
| Reinforced concrete | Remarkable (50–59) | Monstrous+ (≥80) | `:23` |
| Steel wall | Incredible (60–69) | Unearthly+ (≥90) | `:24` |
| Titanium alloy | Amazing (70–79) | Shift X+ (≥100) | `:25` |
| Vibranium | Unearthly (90–99) | Shift Y+ (≥125) | `:26` |
| Adamantium | Shift X (100–124) | Class 1000+ (≥175) | `:27` |

This ladder is consumed by: object **destruction thresholds** (`Destruction_Threshold` column of the catalog), **flight-through-walls** (doc 21 §7.4), and **cover destructibility** (doc 21 §6.4). Vibranium **absorbs/redirects** knockback and Adamantium **reflects** it (`Knockback_Mechanics.csv:26-27`) — surfaced here as special-material flags for the knockback sibling.

---

## 3. Data schema (fields / types)

TypeScript-flavored; a coder implements directly. The catalog is **CSV-loaded at boot**; the formulas are pure functions.

### 3.1 `ThrowableObject` (one row of `Environmental_Objects.csv`)
```ts
interface ThrowableObject {
  id: string;                 // Object_ID  e.g. "ENV_007"
  name: string;               // Object_Name e.g. "Compact Car"
  category: ObjectCategory;   // Object_Category (Street Furniture | Vehicle | Furniture | Hazardous | ...)
  weightLb: number;           // Weight_Pounds
  baseDamage: number;         // Damage_Base (the object's intrinsic thrown damage, pre-STR)
  damageType: DamageType[];   // Damage_Type — "BLUNT", "BLUNT + ELECTRICAL", "BLUNT + FIRE" → array (doc 22 owns riders)
  throwRangeModifier: number; // Throw_Range_Modifier  (0.1 .. 1.5 multiplier on computed range — heavy = small)
  accuracyModifierCS: number; // Accuracy_Modifier  (+1CS .. -5CS) — parsed from "-3CS" / "+1CS" / "STR 60+ required"
  strRequirement: number|null;// parsed from Accuracy_Modifier cell when it reads "STR N+ required" (else null → use weight gate)
  areaEffect: AreaShape;      // Area_Effect  "Single target" | "Area 2x2" | "Area 3x3" | "Area 4x4" | "Area 5x5" | "Line area"
  special: string[];          // Special_Properties (e.g. "Fuel tank explosion risk", "Triggers alarms")
  destructionThreshold: { rank: RankName; value: number }; // Destruction_Threshold "Remarkable (50)" → {rank,value}
  rarity: Availability;       // Availability_Rarity  Common|Uncommon|Rare|<location-gated>
  replaceCostUSD: number;     // Cost_To_Replace  ($0 for natural objects)
  legalTier: LegalTier;       // Legal_Consequences mapped to enum (§6.3)
}
type AreaShape = 'Single' | 'Area2x2' | 'Area3x3' | 'Area4x2' | 'Area4x4' | 'Area4x6' | 'Area5x5' | 'Line';
type LegalTier  = 'Minimal' | 'Low' | 'Moderate' | 'High' | 'VeryHigh' | 'Extreme' | 'Ultimate'; // §6.3
```

### 3.2 `WeightClass` (procedural / generic objects + the per-class formula bridge)
For objects **not** in the catalog (procedural debris, rocks, generic furniture) we classify by weight and use `Improvised_Weapons.csv` / `Lifting_Throwing` class rows:
```ts
type WeightClass = 'Debris' | 'Light' | 'Medium' | 'Heavy' | 'VeryHeavy' | 'Vehicle' | 'Massive';
// thresholds (lb) — see §4.1 table
```

### 3.3 `ThrowResolution` (output the engine produces, consumed by siblings)
```ts
interface ThrowResolution {
  rangeSquares: number;       // §4.2  (clamped ≥1)
  netAccuracyCS: number;      // object CS mod + weight CS + Z-axis CS  (fed to doc 20's column, NOT rolled here)
  toHitStat: 'AGL';           // RULING ST-3: thrown to-hit uses AGL (ranged-class attack)
  damage: number;             // §4.3  (object base + STR scaling + momentum), pre-armor, pre-outcome-mult
  damageType: DamageType[];   // from object (doc 22 applies riders)
  area: AreaShape;            // from object; adjacent-tile splash = 0.75× (§4.4)
  knockbackStrRank: RankName; // attacker STR rank → doc 21/knockback sibling resolves distance
  secondaryHazard?: HazardSpawn; // §6.2 (fire/explosion/electrical/chemical/radiation persistent tile)
  collateral: CollateralEvent;// §6.3 (replaceCost + legalTier + objectName) → strategic write-back §9
}
```

### 3.4 New AP-costed actions (live inside doc 21's round loop)
```ts
type StrengthAction =
  | { kind:'PickUp', objectId:string }           // 1..4 AP by weight class (§5.1)
  | { kind:'ThrowObject', objectId:string, target:GridPoint } // 2..5 AP by weight class (§5.1)
  | { kind:'QuickThrow', objectId:string, target:GridPoint }  // 3 AP, pickup+throw a light object (§5.1)
  | { kind:'ImprovisedMelee', objectId:string, target:GridPoint } // 3 AP, swing held object (§5.5)
  | { kind:'BreakObstacle', tile:GridPoint }     // STR FEAT vs material ladder (§2.3)
  | { kind:'DropObject', objectId:string };      // free; may become a falling-object hazard (§4.5)
```

---

## 4. Exact numbers / tables / formulas (the heart)

> **All resolution uses doc 20's `resolve()` on the Universal Table.** This doc supplies the **net CS** and the **damage/range numbers**; doc 20 rolls the d100 and returns Failed/Minor/Success/Major. Nothing here re-implements the roll.

### 4.1 Weight classes & their action costs (`GMS/Lifting_Throwing_Projectile_System.csv` PICKUP/THROW blocks `:101`–`:114`)
| Weight class | Weight (lb) | Pick-up AP | Throw AP | Source rows |
|---|---|---|---|---|
| Light | 1–50 | **1** | **2** | `:103,:110` |
| Medium | 51–500 | **2** | **3** | `:104,:111` |
| Heavy | 501–5,000 | **3** | **4** | `:105,:112` |
| Massive | 5,001+ | **4** | **5** | `:106,:113` |
- **Quick Throw** (pick up + throw a *light* object in one action) = **3 AP total** (`:114`). For Medium+ objects, pick-up and throw are **separate turns/actions** (the commitment cost — §1 beat 3).
- These map onto the catalog's `Improvised_Weapons.csv` weight bands: Light `<50 lb` (`:2`), Medium `50–500` (`:3`), Heavy `501–5000` (`:4`), Vehicle (`:5`), Hazardous (`:6`).

### 4.2 Throwing RANGE — the one canonical formula (Bible §13 #3)

Three formulas exist in source and conflict (Bible §5.8 ruling, `Lifting_Throwing:30`, `Lifting_Throwing:63`, plus per-class `Improvised_Weapons:2-6`). **We ship the Bible §5.8 canonical formula** and treat the others as the source of its terms:

```
rangeSquares = clamp( STR − (weightLb / 50) , 1 , floor(STR / 10) )   // Bible §5.8
             × object.throwRangeModifier                              // catalog per-object taper (Environmental_Objects)
```
- **Term 1** `STR − weightLb/50` and **the cap `STR/10`** are *verbatim* Bible §5.8 (which itself reconciles `Lifting_Throwing:30` "Throw_Range = STR/10 squares (max)" and `:63` "Base_Range = (STR − Weight/50) × Range_Modifier").
- **`throwRangeModifier`** is the catalog's per-object fine taper (`Environmental_Objects.csv` `Throw_Range_Modifier`: trash can 1.0, compact car 0.2, SUV 0.1 — heavier objects fly less far at `:2`,`:8`,`:9`). This *replaces* the per-class `× 2 / × 1.5 / × 1 / × 0.5` multipliers in `Improvised_Weapons.csv:2-5`, which are the **coarse fallback** used only for procedural objects with no catalog row (RULING ST-4).
- **`clamp(...,1,...)`** guarantees a strong-enough thrower can always toss it at least 1 square; a too-heavy object is gated *before* this by the lift check (§5.2), so range never goes negative.
- **Reference values** (`Lifting_Throwing` "THROWING RANGE BY STRENGTH" `:36`–`:45`) sanity-check the cap: STR 1–10 → 1 sq, 11–20 → 2, 21–30 → 3, 31–40 → 4, 41–50 → 5, 51–75 → 6–7, 76–100 → 8–10, 101–150 → 10–15, 151+ → 15–25+. `floor(STR/10)` reproduces this curve (STR 75 → 7 sq ✔, STR 100 → 10 ✔).

> **RULING ST-4 (one range formula; per-class multipliers retire).** The Bible §5.8 formula above is canonical for **all** throws. The conflicting `Improvised_Weapons.csv` per-class range formulas (`Range = (STR − Weight/25)×1.5` etc., `:3`) and the `Lifting_Throwing:30` bare `STR/10` are **demoted**: `STR/10` survives only as the **range cap** inside the canonical formula, and the per-class `×N` multipliers are the **fallback `throwRangeModifier`** for objects lacking a catalog `Throw_Range_Modifier`. Net: one formula, no contradiction.

### 4.3 Thrown-object DAMAGE — the one canonical formula

Source gives an object-intrinsic base (catalog `Damage_Base`), a weight-class base (`Lifting_Throwing:48-53`), and STR-scaling riders (`Improvised_Weapons` per class, `Lifting_Throwing:31`). Reconciled per Bible §5.8 (`Damage = base_by_weight_class + STR/scale + momentum`):

```
damage = object.baseDamage                              // catalog Damage_Base (per-object; source of truth)
       + strBonusByClass(STR, weightClass)              // §4.3.1 (the STR scaling rider)
       + momentum(rangeSquares)                         // = min( rangeSquares × 3 , 15 )   (Bible §5.8 cap +15)
```

**4.3.1 `strBonusByClass`** — from `Improvised_Weapons.csv` + `Lifting_Throwing` "THROWN OBJECT DAMAGE" (`:48`–`:53`), unified (heavier objects convert more STR into damage):
| Weight class | STR bonus to damage | Source |
|---|---|---|
| Light (1–50 lb) | `STR / 10` | `Lifting_Throwing:49-50`, `Improvised:2` (no bonus for thrown-light → use the /10 ladder) |
| Medium (51–500) | `STR / 10` | `Improvised:3` "Object_Base_Damage + STR/10" |
| Heavy (501–5000) | `STR / 5` | `Improvised:4` "+ STR/5"; `Lifting_Throwing:52` "50 + STR/5" |
| Vehicle | `STR / 3` | `Improvised:5` "+ STR/3" |
| Massive (1001kg+, ~2200lb+ non-vehicle) | `STR / 2` | `Lifting_Throwing:53` "100 + STR/2" |
| Hazardous | `STR/5` + environmental damage | `Improvised:6` (+ secondary hazard §6.2) |

> **RULING ST-5 (catalog `Damage_Base` is the per-object source of truth; weight-class base is the procedural fallback).** When the object is a catalog row, use its explicit `Damage_Base` (e.g. Compact Car = 55, `Environmental_Objects.csv:8`) as the base, then add `strBonusByClass` + momentum. The `Lifting_Throwing:48-53` weight-class bases (Light "5 + STR/10", Heavy "30 + STR/10", etc.) are the **procedural fallback** for generic objects with no catalog row. This kills the third contradiction (object-base vs class-base) — catalog wins, class is the fallback. Damage is **pre-armor, pre-outcome-multiplier**: doc 21 applies the 0.5×/1×/1.5× outcome mult, doc 22 applies DR and the BLUNT/FIRE/etc. rider.

### 4.4 Thrown ACCURACY (the net CS this doc emits)
To-hit uses **AGL** (RULING ST-3 below); the **net accuracy CS** summed and handed to doc 20 is:
```
netAccuracyCS = object.accuracyModifierCS          // catalog Accuracy_Modifier (+1CS small … -5CS bus)
              + throwingSkillCS                     // if unit has Throwing skill (doc 07 / Complete_Skills_Talents) — else 0
              + zAxisCS                             // §4.6
// (range-band CS, dodge, cover, etc. are added by doc 21/20 — NOT double-counted here)
```
- The catalog `Accuracy_Modifier` already encodes the weight→accuracy penalty (trash can −0CS `:2`, motorcycle −2CS `:7`, compact car −3CS `:8`, SUV −4CS `:9`, bus −5CS `:10`). The `Improvised_Weapons.csv` per-class extra penalties (`Object_Accuracy_Modifier −1CS` medium, `−2CS` heavy, `−3CS` vehicle, `:3-5`) are **already baked into the catalog values** — do **not** add them again (RULING ST-6).
- **Area = 3×3 / 5×5** thrown objects (`Lifting_Throwing:33` "Large = 3×3, Huge = 5×5") are forgiving: an area throw that **misses** still lands adjacent and applies the splash (§4.5), so big objects trade single-target precision for guaranteed area coverage.

> **RULING ST-3 (thrown to-hit uses AGL).** Bible §5.5 lists thrown to-hit as **AGL** ("ranged & thrown") and doc 21 §6.7 routes thrown dodge through the **AGL-only** column. We honor that: `toHitStat = 'AGL'`. (Note `Lifting_Throwing:32` says "MEL stat + Throwing skill" — this is **overridden** by the Bible, the canonical tie-breaker per §13. The Throwing *skill* bonus still applies as `throwingSkillCS`.)

> **RULING ST-6 (no double-count of weight accuracy penalty).** Object accuracy penalty is counted **once**, from the catalog `Accuracy_Modifier`. The `Improvised_Weapons.csv` "−1CS/−2CS/−3CS" per-class lines describe the **same** penalty from the class side and are **not** added on top of catalog rows (only used for procedural objects with no catalog accuracy value).

### 4.5 AREA & splash (`Lifting_Throwing` AREA blocks `:75`–`:91`, Bible §5.8 "0.75× to adjacent")
- Object `areaEffect` shape comes from the catalog (`Single` … `Area5x5`, `Line`). Falloff per `Lifting_Throwing:88-91`: **Center 1.0× · 1–2 sq from center 0.75× · 3+ sq 0.5×**.
- Bible §5.8 caps heavy/vehicle **adjacent-tile area damage at 0.75×** — consistent with the inner-ring falloff above; use the falloff table as the implementation.
- Heavy/vehicle throws apply **−1..−3CS accuracy** (already in catalog values) and the area means a *miss still does something* (lands adjacent). This is the deliberate "big = forgiving but imprecise" design.

### 4.6 Z-AXIS throwing (`Lifting_Throwing` Z-AXIS block `:116`–`:121`)
| Situation | Range | Accuracy / damage | Source row |
|---|---|---|---|
| Throw UP (target higher Z) | **−50% range** | **−1CS accuracy** | `:118` |
| Throw DOWN (target lower Z) | **+25% range** | **+1CS damage** | `:119` |
| Throw HORIZONTAL (same Z) | normal | normal | `:120` |
| **Falling object** (dropped from height) | — | `damage = baseDamage + (5 × Z-levels fallen)` | `:121` |
- Ties directly into doc 21's flight/altitude: a flyer at Z3 **dropping** a girder on a ground target is the `Falling_Object` case (a `DropObject` action, free AP, resolved as a falling hazard), and **area-weapon altitude falloff (doc 21 §7.1, suppressed at Z3+)** applies to *area* thrown objects too — `areaSuppressedByAltitude = (attacker.z >= 3)` zeroes the splash but a Single-target thrown object still works.

### 4.7 Knockback from a thrown object (hand-off, `Knockback_Mechanics.csv`)
A thrown object that **hits (Success with STR≥40, or any Major)** emits knockback resolved by the knockback sibling using the **attacker's STR rank** (the throw imparts the thrower's strength, not the object's):
| STR rank | Knockback (sq) | Environmental interaction | Source row |
|---|---|---|---|
| Typical (20–29) | 3 | Fragile objects broken | `Knockback_Mechanics.csv:4` |
| Excellent (40–49) | 5 | Drywall destroyed | `:6` |
| Remarkable (50–59) | 6 | Brick cracked, cars dented | `:7` |
| Incredible (60–69) | 7 | Brick destroyed, steel bent | `:8` |
| Amazing (70–79) | 8 | Concrete cracked | `:9` |
| Monstrous (80–89) | 9 | Concrete destroyed | `:10` |
This doc only emits `knockbackStrRank` + direction; **distance, chain-knockback, falling damage, and wall-impact are owned by the knockback sibling** (per doc 21 §9). `Power_Knockback_Super_Strength` **doubles** distance (`:32`).

---

## 5. Lift / pick-up / break — the action economy in detail

### 5.1 AP costs (consolidated, §4.1)
`PickUp`: Light 1 / Medium 2 / Heavy 3 / Massive 4 AP. `ThrowObject`: Light 2 / Medium 3 / Heavy 4 / Massive 5 AP. `QuickThrow` (light only) 3 AP. `ImprovisedMelee` 3 AP (no reload; object breaks, §5.5). `BreakObstacle` = a STR FEAT (see §5.3). All validated against doc 21's 6-AP budget incl. mode upkeep (doc 21 RULING TC-4).

### 5.2 The lift check (`GMS/Lifting_Throwing_Projectile_System.csv` LIFTING MECHANICS `:20`–`:26`)
| Rule | Condition | Result | Source row |
|---|---|---|---|
| **Auto-lift** | object ≤ ½ your `maxLiftLb` | no roll, lift free as part of the PickUp action | `:23` |
| **Lift check** | object between ½ and 100% of `maxLiftLb` | STR FEAT on Universal Table (STR column) — Success+ lifts | `:22` |
| **Strain lift** | object 100%–150% of `maxLiftLb` | Success **required**; takes **1 round** to lift; **−1CS while holding** | `:24` |
| **Impossible** | object > 150% of `maxLiftLb` | cannot lift (unless a power/situation allows) | `:25` |
- The FEAT-required column in §2.2 table (B) (`Auto success` / `Minor or better` / `Success or better` / `Major required`) is the **per-band difficulty floor** for the lift roll — e.g. lifting at the 251–500 STR band's limit needs a Major (`:16`).
- **STR-requirement gate (catalog):** objects whose `Accuracy_Modifier` cell reads "STR N+ required" (`Environmental_Objects.csv` city bus `:10` STR 60+, semi `:11` STR 70+, fire truck `:33` STR 65+, etc.) **hard-gate** throwing: a unit below the threshold cannot pick the object up as a throwable at all (the verb is hidden in UI). For un-gated objects, the **weight gate** from `Improvised_Weapons.csv` `Requirements` applies (`STR > Weight/10` to throw-light `:2`, `STR > Weight/5` medium `:3`, `STR > Weight/2` heavy `:4`, `STR > Weight` vehicle `:5`).

### 5.3 Breaking obstacles / materials (`BreakObstacle`)
A STR FEAT vs the material ladder (§2.3): the unit can destroy a material if `STR rank ≥ material's "Destroyed by" rank`. Below that, it cannot be broken by force (only by power/explosives). Consumed by: destructible cover (doc 21 §6.4), flight-through-walls (`damage = wall_strength − STR`, doc 21 §7.4), and ripping `Structural_Component` weapons out of buildings (`Improvised_Weapons.csv:10`, STR>40, 3–5 turns, **Extreme legal — building-code/structural**).

### 5.4 Carrying & encumbrance
- Holding an object at **>100% lift capacity** imposes **−1CS while holding** (strain, `:24`) and consumes the held-object slot. **RULING ST-7:** a unit may hold **one** large (Medium+) object at a time; Light objects don't impose strain. (Source gives the strain penalty but not a slot count — this is the minimal Bible-consistent ruling; OWNER-FORK OF-3 if richer inventory desired.)
- Dropping (`DropObject`) is **free** (`Lifting_Throwing` AP table implies no listed cost; RULING ST-8) and from height becomes a `Falling_Object` hazard (§4.6).

### 5.5 Improvised MELEE (object as a club — `Improvised_Weapons.csv:7-8`, `:22`)
Objects are often **better as melee weapons than thrown** (`:22`):
| Use | Damage | Accuracy | Durability | STR gate | Source |
|---|---|---|---|---|---|
| Improvised melee, light | `object.baseDamage + STR` | object CS **+1CS** | breaks after **1d6 hits** | STR > weight/20 | `:7` |
| Improvised melee, heavy (>100 lb) | `object.baseDamage + STR×1.5` | object CS **−1CS** | breaks after **1d3 hits** | STR > weight/10 | `:8` |
- Melee use is **range 0–1** (doc 21 §6.3, uses **MEL** to-hit per Bible §5.5), enables the doc 26 wrestling stance, and the **+1CS for familiar objects** bonus (`:22`) applies indoors. Object durability (`1d6`/`1d3` hits) is tracked on the held-object instance.

---

## 6. Environmental catalog, hazards & legal tiers

### 6.1 The catalog (50 objects, `Environmental_Objects.csv:2-51`) — representative anchors
Full table is the CSV (loaded verbatim). Anchors proving the spread (Object · weight lb · base dmg · area · STR-gate · $ · legal):
| Object | lb | Dmg | Area | STR gate | $ | Legal tier | Row |
|---|---|---|---|---|---|---|---|
| Trash Can | 25 | 8 | Single | — | $50 | Minimal | `:2` |
| Wooden Chair | 15 | 6 | Single | — | $100 | Low | `:14` |
| Motorcycle | 400 | 35 | Single | — | $8,000 | High | `:7` |
| Compact Car | 2,800 | 55 | **Area 2×2** | — | $25,000 | Very High | `:8` |
| SUV | 5,500 | 75 | **Area 3×3** | — | $45,000 | Very High | `:9` |
| City Bus | 25,000 | 120 | **Area 4×4** | **STR 60+** | $300,000 | Extreme | `:10` |
| Police Car | 4,200 | 60 | Area 2×2 | — | $50,000 | **Extreme** (govt) | `:31` |
| Fire Truck | 35,000 | 140 | **Area 4×6** | **STR 65+** | $750,000 | **Ultimate** | `:33` |
| Propane Tank | 50 | 30 **+EXPLOSION** | **Area 3×3** | — | $200 | **Extreme** (explosion) | `:37` |
| Gas Pump | 300 | 40 **+EXPLOSION** | Area 4×4 | — | $8,000 | Extreme | `:36` |
| Chemical Barrel | 200 | 35 **+CHEMICAL** | Area 3×3 | — | $2,000 | Extreme | `:38` |
| Nuclear Waste Cask | 1,000 | 50 **+RADIATION** | **Area 5×5** | — | **$1,000,000** | **Ultimate** | `:39` |
| Boulder (natural) | 1,000 | 65 | Single | — | **$0** | Low (natural) | `:29` |
- **Availability is location-gated:** the catalog `Availability_Rarity` + category-info rows (`:52`–`:71`) say which environments spawn which objects — Urban = cars/buses/street furniture/electronics (`:66`); Industrial = machinery/chemical/steel (`:67`); Natural = trees/rocks/boulders, **legally safe, $0** (`:69`); Government/Military = **maximum/ultimate legal** (`:70-71`). **This is consumed at map-gen by the terrain/city-type plug (§8)** — a jungle map has boulders & trees, a downtown map has cars & ATMs.

### 6.2 Secondary hazards (`Environmental_Objects.csv` Special_Properties + `Improvised_Weapons.csv:15-19`)
When a hazardous object is destroyed/thrown, it spawns a **persistent area hazard tile** for the rest of the encounter (`Environmental_Objects.csv:78` "hazards affect combat area for remainder of encounter"):
| Trigger object | Hazard spawned | Mechanic | Source |
|---|---|---|---|
| Vehicle w/ fuel tank, Gas Pump | **Fire / explosion** | base dmg **+ 2d6 explosion**, fire spreads & persists | `Improvised:15`, `Env:35-36` |
| Propane Tank | **Explosion** (Area 3×3) | major blast | `Env:37` |
| Chemical Barrel | **Chemical contamination** (Area = container×3) | ongoing POISON area-denial | `Improvised:16`, `Env:38` |
| Power Line / Street Light / electronics | **Electrical hazard** | chain-arc to conductive tiles, ongoing shock | `Improvised:17`, `Env:25,:24` |
| Nuclear Waste Cask | **Radiation** (Area 5×5) | ongoing RADIATION (melts living only — doc 22) | `Env:39` |
| Fire Hydrant / water pipe | **Flooding** | knock-prone water stream + slippery (movement hazard) | `Improvised:19`, `Env:3` |
| Load-bearing `Structural_Component` | **Building collapse** | debris field, Area, occupants hit | `Improvised:18` |
The damage-type rider (how FIRE/CHEMICAL/RADIATION/ELECTRICAL behave) is **owned by doc 22**; this doc only spawns the hazard tile and tags its type + radius.

### 6.3 Legal tiers & dollar cost → strategic write-back
`Environmental_Objects.csv` `Legal_Consequences` parses to the **7-tier `LegalTier` enum** (§3.1), anchored to source phrasing:
| Tier | Source phrasing examples | Object examples |
|---|---|---|
| Minimal | "Minimal — public property" | Trash Can `:2` |
| Low | "Low — furniture replacement" | Chair `:14`, natural objects `:27-29` |
| Moderate | "Moderate — …" | Mailbox `:3`, Bicycle `:5`, Refrigerator `:17` |
| High | "High — …" | Fire Hydrant `:4`, Motorcycle `:7`, ATM `:20` |
| Very High | "Very High — grand theft + destruction" | Compact Car `:8`, SUV `:9`, Server Rack `:35` |
| Extreme | "Extreme — …terrorism/mass-casualty" | City Bus `:10`, Police Car `:31`, hazardous `:36-38` |
| Ultimate | "Ultimate — …environmental disaster" | Fire Truck `:33`, Nuclear Cask `:39` |
- **Legal multipliers by throw type** (`Improvised_Weapons.csv`): thrown-light **×1**, medium **×2** (`:3`), heavy **×5** (`:4`), **vehicle ×10** (`:5`), **hazardous ×20** (`:6`). The emitted `collateral.legalSeverity = baseTier × throwMultiplier`.
- **Both** the `replaceCostUSD` (financial liability) **and** the `legalTier` (criminal exposure) are written to the strategic layer at end-of-combat (Bible §9 reputation events have a *financial cost* **and** a *legal action* — §9 here). The **numeric fame/heat penalty per tier is an OWNER-FORK** (OF-4), inherited from doc 21 OF-4 / docs 13/17.

---

## 7. Person-throw vs object-throw — the boundary with doc 26 (Wrestling)

A clean split prevents two systems both "owning throws":
- **Throwing an OBJECT** (this doc): pick up `ThrowableObject`/debris → range/damage/area/legal per §4. To-hit **AGL**.
- **Throwing a LIVING opponent** (doc 26, `GMS/Wrestling_Martial_Arts_Complete.csv` Sheet 5 `:48`–`:57`): requires a **grapple first**; uses throw types (`THROW_HIP STR/4`, `THROW_SLAM STR/2+10 STR40+`, **`THROW_LAUNCH` Superhuman Launch STR/2, STR/10 sq knockback, STR 70+** `:57`). To-hit/contest is the grapple struggle, not an AGL throw.
- **Shared spine:** both consume the **same STR rank ladder** (§2) and the **same knockback table** (§4.7), and both can trigger **building destruction** at high STR (`Wrestling` Sheet 8 `:88-98`: STR60+ throw-through-walls, STR70+ building damage, STR80+ orbital throw). **RULING ST-9:** the *environmental-destruction* numbers in Wrestling Sheet 8 (floor cracks at STR50, wall damage at STR60, building damage at STR70) are the **same material ladder** as §2.3/§4.7 — they are not a separate scale; implement once, both docs read it.
- A held opponent thrown *into* an object, or an object thrown *at* a grappling pair, crosses the boundary: the **mover** (object vs person) decides which doc resolves the throw; the **impact** always routes through the shared knockback + material ladder.

---

## 8. How it consumes the SPINE (country / city / terrain → strength play)

Per Bible §13 #9, combined/spine effects must be **consumed**. Strength/throwing consumes them at three plug points (all values cited):

### 8.1 Map-gen: which objects exist where (`Environmental_Objects.csv` category-info `:66-71` + doc 21 §8.2 terrain plug)
The **sector's terrain code & city type** seed the throwable-object palette of the generated map:
- **Urban / high pop-rating cities** → cars, buses, ATMs, street furniture, electronics (`:66`) — *rich, expensive, legally costly* arsenal.
- **Industrial / Mining city type** (`GMS/City_Type_Effects.csv:9,:15` "Environmental hazards in combat / Hazardous terrain (cave-ins, explosions)") → chemical barrels, steel beams, machinery, propane → **more secondary-hazard objects** (§6.2); Mining also grants underground/tunnel context.
- **Natural terrain** (jungle/mountain/park) → trees, boulders, rocks (`:69`) — **$0 cost, Low legal** → the *consequence-free* place to go big.
- **Government / Military / Company city types** (`City_Type_Effects.csv:7` "High legal consequences if caught", `:5` military response, `:19` security systems) → throwing anything here **escalates the legal tier** (the city-type legal modifier multiplies §6.3 severity) and may **trip a military-response timer / alarm** (doc 21 §8.1 hand-off).

### 8.2 Country attributes → how hard the legal bill lands (`GMS/Country_Attribute_Effects.csv`)
The **dollar + legal severity** emitted in §6.3 is **scaled by the country you're standing in** (the spine deciding consequence):
- **Faction territory** (`Country_Attribute_Effects.csv:46-49`): in **Home territory** the US faction has *"legal immunity"* (`:46`) → collateral legal tier is **suppressed/minimal**; in **Hostile territory** *"−2CS all methods"* and escalated charges → collateral legal tier is **amplified**. (The exact suppress/amplify factor is OWNER-FORK OF-4, but the *direction* is sourced.)
- **GovernmentCorruption High** (`:9` "+3CS bribes/blackmail") → the financial liability can be **bribed down** post-combat (hand-off to the politics/legal combined-effect, Bible §8); **Low corruption** (`:9` "+2CS official channels") → charges stick.
- **LSWRegulations = Banned** (`:27` "−3CS public operations; +2CS if caught as victim") → throwing a car in public is a *crime in itself* regardless of target; **Legal** (`:27` "+2CS public operations") → sanctioned heroics soften the collateral. **Lawless** combo (High Corruption + High Crime, `:42` "no legal consequences") → collateral legal tier floored to Minimal.

### 8.3 City crime/pop → how much collateral is even present (`City_Type_Effects.csv:32-47`)
- **Population rating** sets civilian/throwable density (doc 21 §8.1): Mega-City Pop7 (`:47`) = dense civilian tiles → **every area-throw risks collateral** (the bus's 4×4 blast over a crowd is a fame catastrophe); Village Pop2 (`:42`, `City_Type_Effects.csv:21` "No backup response") = near-empty → big throws are **safe to attempt**.
- **Crime index** (`:37-38`): High/Very-High → "−2CS/−3CS legal methods" already in play → collateral charges are *relatively* cheaper where law has already collapsed.

> **RULING ST-10 (spine plug contract).** This doc **reads** `terrainCode, cityType, popRating, crimeIndex, country faction-territory + corruption + LSWRegulations` (pre-resolved by the world layer, canonical `allCountries`/`allCities` per Bible §13 #10) and turns them into: (a) the **throwable-object palette** at map-gen, (b) a **legal-severity multiplier** on §6.3 collateral, (c) **civilian-density** gating how much collateral exists. It **writes back** only the collateral event (object destroyed, $ cost, legal tier) to fame/legal (§9). It does **not** recompute spine values.

---

## 9. Integration points (systems this layer reads / writes)

| Direction | System (doc / table) | Contract |
|---|---|---|
| **READS** | Resolution engine (doc 20, `Universal_Table_FIXED.csv`) | Supplies STR-column for the **lift FEAT** and AGL-column net-CS for the **throw to-hit**; doc 20 rolls and returns Failed/Minor/Success/Major. |
| **READS** | Character sheet (doc 07, `Stat_Rank_Mapping.csv`) | STR (raw + rank), AGL, MEL, **Throwing skill** boolean (`Complete_Skills_Talents`), `maxLiftLb` derived via §2.2. |
| **READS** | Grid skeleton (doc 21) | AP budget/refresh, range bands, LOS, cover, Z-axis/altitude (`areaSuppressedByAltitude`), the `StrengthAction` AP costs live in its round loop. |
| **READS** | Spine: `City_Type_Effects`, `Country_Attribute_Effects`, `TerrainCodes`, `allCountries`/`allCities` | §8 plug: object palette + legal multiplier + civilian density. |
| **WRITES → (hand-off)** | **Damage / armor / damage-types** (doc 22, `Armor_Complete`) | Passes `damage` (pre-armor, pre-outcome-mult) + `damageType[]` (BLUNT/FIRE/ELECTRICAL/…); doc 22 applies outcome mult, DR, and the type rider. |
| **WRITES → (hand-off)** | **Knockback** (doc 21 §9, `Knockback_Mechanics.csv`) | On Success(STR≥40)/Major emits `knockbackStrRank` + direction; sibling resolves distance/chain/wall-impact/falling. |
| **WRITES → (hand-off)** | **Crit → Injury** (doc 23) | A Major thrown hit flags *Major occurred* (+ body part if a called shot) → crit-table → injury-d100. |
| **WRITES → (hand-off)** | **Status / hazards** (doc 24, doc 22) | Spawns persistent hazard tiles (fire/chemical/electrical/radiation/flood — §6.2) with type + radius; durations owned by sibling. |
| **WRITES → (hand-off)** | **Wrestling** (doc 26) | Person-throws route to doc 26; this doc supplies the shared STR ladder + knockback + material destruction (RULING ST-9). |
| **READS** | **BAMPI / Powers** (doc 27) | Telekinetic/Gravity throws (`Lifting_Throwing:98` Telekinesis_Throw, `Knockback:33-34`) reuse this doc's range/damage/area math but with the **power's** range and **CON/INT** to-hit — doc 27 calls this doc's `computeThrow()` with substituted stat. |
| **WRITES → (strategic)** | **Fame / Legal / Faction** (docs 13/17, Bible §9) | End-of-combat: per-object `replaceCostUSD` (financial) + `legalSeverity` (criminal, tier × throw-multiplier × spine modifier). |
| **WRITES → (strategic)** | **AI Director** (doc 104) | Structural collapse, military-city detection, hazardous-material release → escalation triggers. |
| **READS** | **Time / save** (Bible §11) | Combat runs in a paused clock; the only undo is the diegetic time-traveler rewind. **RULING ST-11:** all strength rolls (lift FEAT, throw, 1d6 cutting/glass, 2d6 explosion, object-durability 1d6/1d3) draw from the **encounter seed** (doc 21 RULING TC-8) so a rewind reproduces/branches cleanly and the MP-dimension stub stays viable. |

---

## 10. What already exists in code (build-on, don't rebuild)

`MVP/src/game/scenes/CombatScene.ts` + CLAUDE.md confirm these are **WORKING** and must be *extended*:
- **Basic knockback** ("Knockback WORKING — simple physics"; RPG/rocket knockback 5) — replace the simple version's distance lookup with the `Knockback_Mechanics.csv` STR-rank table (§4.7).
- **Grenades / arc throwing / explosions WORKING** — the arc/throw *rendering* and area-explosion already exist; reuse them for object-throw visuals and the §6.2 explosion hazards.
- **Character stats (MEL/STR/INT/INS/CON) imported to units** — `unit.str` is already present; wire `maxLiftLb(str)` and the lift/throw verbs on top.
- **`weaponIntegration.ts` (70+ weapons bridged), `armorIntegration.ts` (DR applied)** — thrown-object damage routes through the *same* damage→armor path as weapons (doc 22), so reuse the pipeline; objects are just "weapons" whose stats come from `Environmental_Objects.csv`.
- **Gaps to build:** (1) the `Environmental_Objects.csv` loader + per-object schema (§3.1); (2) the pick-up/throw/improvised-melee **actions & AP costs** (§3.4/§5.1) inside the round loop; (3) the **lift-capacity & material ladders** (§2.2/§2.3); (4) the **collateral/legal write-back** to the strategic layer (§6.3/§9); (5) **spine-driven object palette** at map-gen (§8.1).

---

## 11. UI / UX hooks

**Combat overlay (Phaser, symbolic — per doc 21 ethos):**
- **Context "grab" verb:** standing adjacent to (or on a tile with) a throwable object surfaces a **grab glyph**; objects the unit is **too weak to lift** are greyed with the STR threshold ("needs STR 60") — the catalog STR-gate (§5.2). This makes strength *legible*: a weak hero sees only chairs/rocks light up; a bruiser sees the whole street.
- **Held-object indicator:** a small icon on the token shows what it's holding + a **strain badge** (−1CS) if over capacity (§5.4).
- **Throw preview:** selecting Throw paints the **reachable tiles by range band** (reusing doc 21's range-band colors) computed from §4.2, draws the **area footprint** (Single / 2×2 / 4×4 / 5×5) over the target, and shows the **net accuracy CS** and **estimated damage** as a text breakdown ("Compact Car: 55 base + STR/5 + 12 momentum = 88, −3CS accuracy, Area 2×2") — accessibility-legible per doc 105.
- **Collateral / legal warning (the signature beat):** before confirming a throw whose area overlaps a **civilian tile** or whose object is High+ legal tier, show a **dollar + legal-tier banner** ("$300,000 · EXTREME — public transportation, mass-casualty risk") tinted by the **spine multiplier** (red in Government/Hostile, dimmed in Lawless/Home) — this is §8.2 made visible. The player *sees the price before they pay it*.
- **Hazard telegraph:** propane/gas/chemical/nuclear/power-line objects show a **⚠ hazard glyph** + predicted blast/contamination radius so the explosion isn't a surprise (§6.2).
- **Altitude interaction:** a flyer over a throwable shows the **Drop** verb (falling-object §4.6); area-throws greyed at Z3+ with "Area ineffective at altitude" (doc 21 §7.1).

**World-map / phone / laptop:**
- **World-map sector preview** already shows terrain/city-type/crime (doc 21 §11); add an **"arsenal" hint** — Industrial/Urban sectors flag "abundant throwables / hazards," Natural sectors flag "consequence-free terrain," Government/Military flag "high collateral cost." The player chooses *where* to go big.
- **Laptop after-action:** the combat-results screen itemizes **collateral** (objects destroyed, total $ liability, highest legal tier reached) and the resulting **fame/legal/faction deltas** (the §9 writes), then offers the time-traveler rewind as the only "undo" (with its sanity/destination cost). The GDD's *"care about consequences"* loop (Bible §9) lands here.
- **Audio (`SoundManager`, existing):** wire grab/lift grunt, throw whoosh, and material-specific impact (glass shatter / metal crunch / concrete boom keyed to the §2.3 material) + the §6.2 explosion/electrical SFX.

---

## 12. Edge cases & failure modes

1. **Object too heavy to throw but liftable (strain zone 100–150%):** allow the lift (1 round, −1CS) but **cap throw range at 1 sq** (clamp floor, §4.2); UI shows "can barely heave it."
2. **STR below catalog gate (e.g. STR 55 vs City Bus STR 60+):** verb **hidden**, not failed — never let the player commit AP to an impossible throw (§5.2).
3. **Throw misses but object has Area:** the object **still lands** (adjacent splash 0.75×, §4.5) — a missed bus is not a wasted turn; resolve the splash.
4. **Hazardous object thrown and missed:** the **secondary hazard still triggers** on impact wherever it lands (§6.2) — chemical/explosion doesn't require a hit. UI must warn (could land on an ally).
5. **Object destroyed before pick-up** (cover degraded, blown up by area attack): remove from throwable palette; a destroyed car may itself become a **fuel explosion** hazard (`Improvised:15`).
6. **Two units grab the same object same round:** initiative order (doc 21 §4) decides; the later unit's grab fails ("already taken").
7. **Throwing at a flyer (Z≥1) with a Single object:** apply Throw-UP penalties (−50% range, −1CS, §4.6); if range now <1 after the −50%, the throw is **out of reach** (block it).
8. **Falling object dropped on empty tile:** resolves as a thrown object with 0 momentum + the `5 × Z` falling bonus (§4.6) — harmless if it hits nothing but may spawn a hazard (propane).
9. **Adamantium/Vibranium object or target:** the **material reflect/absorb** flags (§2.3) route to the knockback sibling — do **not** silently apply normal knockback to an immovable/absorbing material.
10. **$0 / Low-legal natural objects in a Government city:** the **city-type legal multiplier still applies to property damage of the surroundings** even though the boulder itself is free — collateral is about *what you hit*, not only *what you threw* (§6.3/§8.2). Don't zero the legal write-back just because the projectile was a rock.
11. **Improvised-melee object breaks mid-combat (1d6/1d3 hits, §5.5):** drop it from the held slot, surface "weapon broke," free the unit to grab another.
12. **Power-throw (telekinetic) of an object the unit couldn't physically lift:** doc 27 substitutes the **power's** rank for STR in `computeThrow()`; the **physical lift gate (§5.2) is bypassed** (the power, not the muscles, lifts it) — but the **legal/collateral write-back still fires** (you still threw the bus).
13. **Determinism:** all dice (1d6 glass, 2d6 explosion, object durability) use the encounter seed (RULING ST-11) so a rewind reproduces the same shatter/explosion.
14. **Map smaller than computed range:** cap effective range at map bounds (consistent with doc 21 §12 #15).

---

## 13. RULING: notes (collected)

- **ST-1** Every formula uses **raw STR integer** (not the rank-band index); rank ladder used only for the outcome-column lookup and the knockback-distance lookup.
- **ST-2** `maxLiftLb` resolution order: granular per-point table (A) → band table (B) with **linear interpolation** within a band; this fills the Bible-flagged STR 50–81 gap from table (B).
- **ST-3** Thrown to-hit uses **AGL** (Bible §5.5 overrides `Lifting_Throwing:32`'s "MEL"); Throwing *skill* CS still adds.
- **ST-4** **One range formula** = Bible §5.8 `clamp(STR − weight/50, 1, STR/10) × throwRangeModifier`; per-class `×N` multipliers demoted to the procedural fallback `throwRangeModifier`.
- **ST-5** **Catalog `Damage_Base` is the per-object source of truth**; weight-class bases are the procedural fallback. Damage is pre-armor / pre-outcome-mult.
- **ST-6** Object accuracy penalty counted **once** (from the catalog `Accuracy_Modifier`); per-class `Improvised_Weapons` penalties are the same effect, not additive.
- **ST-7** A unit holds **one** Medium+ object at a time; Light objects don't strain.
- **ST-8** `DropObject` is a **free** action; from height it becomes a `Falling_Object` hazard.
- **ST-9** Wrestling Sheet 8 environmental-destruction numbers = the **same material ladder** as §2.3/§4.7 (implement once; both docs read it).
- **ST-10** Spine plug contract: read pre-resolved spine → object palette + legal multiplier + civilian density; write back only collateral.
- **ST-11** All strength dice draw from the **encounter seed** (diegetic-rewind determinism; future-proofs the MP-dimension stub).

---

## 14. OWNER-FORK: notes (product choices, not derivable from data)

- **OF-1 — The filled STR 50–81 / 50–100 lift values as authored DATA.** RULING ST-2 *computes* the gap by interpolating the band table, but the Bible (§13 #3) asks to **fill the equivalencies table**. The missing `Strength_Scale_Equivalencies.csv` (referenced by `Wrestling_Martial_Arts_Complete.csv:18` but **absent from the repo**) is the intended home. *Owner should author that file* (per-point lb values 50–100) so balance is moddable (doc 106) rather than living in code as an interpolation. Until then, ST-2's interpolation ships.
- **OF-2 — Numeric fame/heat penalty per legal tier & per dollar of collateral.** The tiers (Minimal…Ultimate) and dollar costs are sourced (`Environmental_Objects.csv`), but the **conversion to fame/heat/reputation deltas** is a balance dial owned by docs 13/17 (Bible §9). Owner sets, e.g., "Ultimate tier = −X global fame, $Y liability."
- **OF-3 — Held-object inventory richness.** ST-7 ships the minimal "one large object" rule. Owner may want a richer carry model (two-handed vs one-handed, throwing multiple light objects per turn) — defer unless playtesting demands it.
- **OF-4 — Spine legal-severity multiplier magnitude.** §8.2 sources the *direction* (Home immunity ↓, Hostile/Government ↑, Lawless floor) but not the **exact factor** (e.g. ×0.25 in Home, ×3 in Hostile). Owner/balance sim sets the numbers; the data only guarantees the sign.
- **OF-5 — Which encounter templates spawn which arsenal density.** §8.1 sources *category by environment*, but how *many* throwables a given map seeds (sparse vs dense) is a level-design dial (ties to doc 21 OF-2 map-size mapping).
- **OF-6 — Improvised-melee "+1CS familiar object" scope.** `Improvised_Weapons.csv:22` grants +1CS for "familiar objects" indoors; *which* objects count as "familiar" to *which* characters (a bartender's bottle? a soldier's rifle-butt?) is authored flavor, not in the data.

---

## 15. Open questions

- **Q1** Does the **momentum bonus** (`min(rangeSquares×3, 15)`, §4.3) apply to **improvised-melee** swings (range 0–1, so ~0 momentum) — i.e. is melee just `base + STR(×1.5)` with no momentum? (Spec assumes **no momentum on melee**, since the object isn't traveling; confirm.)
- **Q2** When a **vehicle with a fuel tank** is *thrown* (not destroyed in place), does the **2d6 explosion** (`Improvised:15`) trigger on *impact* at the target, on the thrower, or only if the vehicle is destroyed first? (Spec assumes **on impact at the landing tile**; confirm with combat-balance sim — this changes whether throwing a car is an area-denial nuke.)
- **Q3** **Strain-lift while holding −1CS** (§5.4): does the penalty apply to *all* the unit's actions that turn (movement, dodge) or only to attacks/throws with the held object? (Spec assumes **all actions while the object is held**, per the literal `:24` "−1CS penalty while holding.")
- **Q4** Does **Throwing skill** exist as a discrete skill in `Complete_Skills_Talents` with a defined CS value, or must `throwingSkillCS` default to 0 until that table is specced (doc 07/28)? (Confirm the skill's existence + value.)
- **Q5** For **telekinetic/gravity throws** (doc 27), is the **physical material-destruction** (throwing an object *through* a wall) gated by the power's rank or by raw STR? (Spec assumes **power rank substitutes for STR everywhere**, including material-break checks — RULING ST-1 + edge-case 12; confirm with doc 27.)
- **Q6** Does **Vibranium's knockback-absorption** (`Knockback:26`) mean a *thrown* vibranium object deals **reduced** knockback to its target, or that a vibranium *target* resists it? (Spec assumes the **material flag travels with whichever side is vibranium**; needs doc 21/knockback confirmation.)

---

*Sources opened for this spec: `SHT-dir/Combat Compendium REAL - 🏋🏾‍♀️STRENGTH AND WEIGHT💪🏾.csv`, `GMS/Lifting_Throwing_Projectile_System.csv`, `Environmental_Objects.csv`, `Improvised_Weapons.csv`, `Knockback_Mechanics.csv`, `GMS/Stat_Rank_Mapping.csv`, `GMS/Universal_Table_FIXED.csv`, `GMS/Wrestling_Martial_Arts_Complete.csv`, `GMS/City_Type_Effects.csv`, `GMS/Country_Attribute_Effects.csv`, `GMS/Tactical_Grid_System.csv` (via doc 21), `SHT-dir/FIST GDD v02.txt`, `SHT_MECHANICS_BIBLE.md` (§3.2, §5.5, §5.8, §9, §11, §13 #3/#7/#8/#9/#10, §14), and sibling specs `docs/design/20-core-resolution-4cs.md`, `docs/design/21-tactical-combat-grid.md`. Every number above traces to one of these; nothing invented — gaps are flagged RULING / OWNER-FORK / Open-Question.*
