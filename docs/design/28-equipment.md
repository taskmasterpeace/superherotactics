# 28 — Equipment: Weapons / Armor / Ammo / Gadgets / Vehicles-in-Combat / Sound / Doors

> **System:** The full physical-gear layer — every weapon, armor piece, ammunition type, gadget/tech device, vehicle-as-tactical-unit, the sound/detection model that gear feeds, and the door/window/furniture interaction layer. This is the JA2 "kit" texture: what you carry, what it costs, what it does to the roll, what noise it makes, and what it breaks.
> **Status:** Build-ready spec (v1.0)
> **Primary sources:** `Game_Mechanics_Spec/Weapons_Complete.csv`, `Game_Mechanics_Spec/Armor_Complete.csv`, `Ammunition_System.csv`, `Game_Mechanics_Spec/Tech_Gadgets_Complete.csv`, `Game_Mechanics_Spec/Sound_Detection_System.csv`, `Game_Mechanics_Spec/Door_Interaction_System.csv`, `Game_Mechanics_Spec/Vehicles_Complete.csv`
> **Secondary sources:** `Game_Mechanics_Spec/Penetration_Continuation_System.csv` (penetration / continuation / cover degradation / knockback-impact), `SuperHero Tactics/Combat Compendium REAL - Weapons.csv` (the original FAST-turn weapon table + worldmap "easy to hide" flags), `Game_Mechanics_Spec/City_Type_Effects.csv` + `12-city-culture-terrain.md` (Arsenal Access −20%, equipment-access tags, pop-rating equipment tier), `14-combined-effects.md` (`blackMarket.weaponPriceModifier`, `research.techPriceModifier/techAvailability`), `16-economy.md` (`priceMultiplier`, COST_VALUES→$), `11-country-effects-spine.md` (military/intel gear-access ±CS), `SHT_MECHANICS_BIBLE.md` (§3.3 Universal Table, §5.3 cover, §5.5 armor math, §5.8 throwing, §5.11 sound/doors, §5.12 BAMPI, §13 rulings, §14 data map).
> **Existing code aligned:** `MVP/src/data/equipmentTypes.ts` (shared interfaces + `COST_VALUES`), `weapons.ts`, `armor.ts`, `gadgets.ts`, `vehicleSystem.ts`, `weaponsWithSounds.ts`. **This spec must not rename those fields** — it documents them and fills the gaps.
>
> **Scope (locked).** This doc owns: the **item data model** for all seven gear classes; the exact stat numbers/formulas from the seven tables; how a weapon/armor/ammo/gadget plugs into the resolution & damage math (it produces ±CS, damage, penetration, DR, and noise — it does **not** own the Universal-Table roll, the damage-type rider catalog, the crit→injury pipeline, or the BAMPI/Power-Activation engine; those are siblings §20/§22/§23/§5.12). It owns the **sound-emission + hearing model** and the **door/window/furniture interaction layer** because both are driven by gear and both feed combat directly. It owns **vehicles as tactical units** (HP/DR/ram/cover/called-shots); the world-map *travel* role of vehicles is owned by `05-travel-movement.md`. Combat is specced **lighter** per Bible §5 — gear is data-heavy but the math it feeds is thin.

---

## 1. Overview & player fantasy

**The fantasy:** *"Loadout is a sentence you write before the mission, and the city you're in decides which words you're allowed."* You are a JA2 quartermaster with a superhero budget. A street operative in Lagos kits a pistol, a kevlar vest, hollow-points, a lockpick set and a burner phone — because that's what the gray market and the city tier will sell. A national operative raiding a Chinese cyber-vault brings a suppressed SMG (to stay under the dB threshold), AP ammo (to punch the steel security door's cover), a breaching charge (in case STR can't), an EMP grenade (for the drones), and thermal goggles (the lights will be off). Every item is a **column-shift, a damage number, a decibel value, and a price** — and all four trace to a table.

Four things make this layer *the game's texture* rather than a menu:

1. **Gear is the player's ±CS lever when they can't pick their stats.** A scope is +1..+3 CS at range; AP ammo is +2.0× penetration but −25% vs unarmored; a riot shield is +2CS from the front but costs a Block action. You *buy* tactical options. (`Weapons_Complete.csv` Accuracy_CS, `Ammunition_System.csv`, `Armor_Complete.csv` shields, `Tech_Gadgets_Complete.csv` MODs.)
2. **Noise is a resource.** Everything you do emits decibels; a pistol is 140 dB / heard 50 squares away; a suppressor drops it to ~110; careful-walk is 15 dB / 1 square. Stealth is *the choice to spend quiet* — and gear (suppressors, subsonic ammo, careful movement) buys it. (`Sound_Detection_System.csv`.)
3. **The interior is destructible and interactive.** Doors have HP, a STR-to-break, a lock tier (pick / kick / ram / breach), and a cover value; furniture flips for +1CS or topples for crush damage; windows shatter for 1d6 cutting. This is the JA2 "stack on the door, breach-and-clear" loop. (`Door_Interaction_System.csv`.)
4. **The world you stand in is the quartermaster.** Military cities sell military gear −20%; pop-rating sets your equipment ceiling; corruption opens the black market and discounts illegal weapons; a country's GDP-per-capita multiplies every price 0.4–1.6×. **Where you stand changes what you can carry.** (§9.)

**One-line pitch:** *Seven gear tables collapse into four numbers per item — ±CS, damage/DR, decibels, and price — and the country/city spine decides which items the shop will even show you.*

---

## 2. Canonical units & cross-references (READ FIRST)

| Quantity | Unit / rule | Source |
|---|---|---|
| 1 grid square | **2 meters** | Bible §5; `Tactical_Grid_System.csv` |
| Weapon `Range_Squares` | already in **squares** (e.g. Pistol 25, Sniper 100) | `Weapons_Complete.csv` Range_Squares |
| Accuracy_CS | a **±Column Shift** added to the attacker's final column before the d100 roll (§5 Bible) | `Weapons_Complete.csv` Accuracy_CS |
| Decibels (dB) | absolute loudness of an action; drives `Hearing_Range` | `Sound_Detection_System.csv` |
| `Hearing_Range` | **`(INS / 5) × (Effective_dB / 30)`** squares | `Sound_Detection_System.csv` (Bible §5.11) |
| Cost_Level → dollars | `Free 0 · Low 100 · Medium 500 · High 2000 · Very_High 10000 · Ultra_High 50000` (base list price, pre-spine) | `equipmentTypes.ts` `COST_VALUES` (verbatim) |
| Penetration | `Effective_Penetration = Base_Damage × Penetration_Mult`; penetrates if `> Obstacle_HP` | `Penetration_Continuation_System.csv` |
| Vehicle speed→squares | **10 MPH = 2 squares/turn** | `Vehicles_Complete.csv` Designer note |
| Knockback wall-impact dmg | `Remaining_Knockback_Squares × 5` | `Penetration_Continuation_System.csv` |

**Hand-off contract.** This doc *outputs* into the resolution engine (§20 / Bible §3.3, §5.5):
- to the **to-hit roll**: `Accuracy_CS` (weapon) + ammo/mod CS + cover CS (target's, possibly degraded — §7) + range-band CS;
- to the **damage step**: `Base_Damage` (weapon) → ×OutcomeMult (sibling) → `− Effective_DR` (armor, §6) → shields absorb first (§6.6);
- to the **damage-type rider** (sibling §22): `Damage_Type` + `Sub_Type` strings carried verbatim from the weapon row;
- to **knockback / penetration** (sibling §25 + §7 here): `Penetration_Mult`, blast radius, knockback flags;
- to **sound/detection** (§8 here): the dB value of the action the weapon/gear performs;
- to **BAMPI / Power Activation** (sibling §5.12): each weapon row carries a derived `bampiShape` (§3.7).

> **RULING EQ-0 (data canon).** Where `Weapons_Complete.csv` (newer, squares-based, full availability/penetration columns) disagrees with `Combat Compendium REAL - Weapons.csv` (older, FAST-turn DPS, seconds-based), **`Weapons_Complete.csv` is canonical for stats**; the Compendium is retained only for (a) the per-turn DPS figures (`Damage_per_FAST_turn`) used by AI-vs-AI auto-resolve, and (b) the worldmap "easy to hide / take to closed areas" concealment flags (§3.2 `concealable`). This mirrors Bible §13 #1's "ship one table" discipline.

---

## 3. Data schema (fields / types)

All TypeScript-flavored, **aligned to existing `equipmentTypes.ts`** (do not rename). New fields this spec adds are flagged `// NEW`.

### 3.1 Shared enums (verbatim from `equipmentTypes.ts`)
```ts
type CostLevel    = 'Free'|'Low'|'Medium'|'High'|'Very_High'|'Ultra_High';
const COST_VALUES: Record<CostLevel, number> =
  { Free:0, Low:100, Medium:500, High:2000, Very_High:10000, Ultra_High:50000 };

type Availability =                                   // who can legally/practically sell it
  | 'Common' | 'Abundant' | 'Restricted' | 'Law_Enforcement'
  | 'Military' | 'Military_Only' | 'Specialized' | 'High_Tech'
  | 'Alien' | 'Alien_Tech' | 'Medical' | 'VIP' | 'Religious' | 'Commercial' | 'Licensed';
type DamageMode   = 'kill' | 'stun';                  // toggle (blunt/energy/concussive can switch)
type BampiShape   = 'Beam'|'Area'|'Melee'|'Projectile'|'Instant'; // NEW — Bible §5.12
```

### 3.2 `Weapon` (source: `Weapons_Complete.csv`)
```ts
interface Weapon {
  id: string;                  // 'MEL_001' … 'NRG_010' … 'GRN_010'
  name: string;
  category: WeaponCategory;    // Melee_Regular|Melee_Skill|Ranged_Regular|Ranged_Skill|
                               //   Special_Ranged|Energy_Weapons|Grenades|Improvised|Thrown
  baseDamage: number;          // Base_Damage (0 for flamethrower/utility — see §4.4)
  damageType: DamageType;      // PHYSICAL|BLEED_PHYSICAL|ENERGY|SPECIAL  (string → sibling §22)
  damageSubType: DamageSubType;// EDGED_MELEE|SMASHING_MELEE|PIERCING_MELEE|GUNFIRE|BUCKSHOT|
                               //   SLUG|THROWN|ARROW|BOLT|EXPLOSION|FIRE|ELECTRICAL|LASER|
                               //   PLASMA|THERMAL|ICE|PURE_ENERGY|SONIC|CONCUSSIVE|
                               //   DISINTEGRATION|STUN|FLASH|SMOKE|GAS|EMP|SHRAPNEL|ENTANGLE
  attackSpeedSec: number;      // Attack_Speed_Sec (initiative/FAST-turn tie-break)
  rangeSquares?: number;       // Range_Squares (fixed-range weapons)
  rangeFormula?: string;       // Range_Formula (thrown/grenades, e.g. '10 + STR/10')
  accuracyCS: number;          // Accuracy_CS as integer (+0,+1,−2,−4…)
  reloadSec?: number;          // Reload_Sec (firearms/energy)
  skillRequired: SkillRequirement; // 'None'|'Shooting'|'Sniper'|'Heavy_Weapons'|'Bowmaster'|
                               //   'Katana'|'Staff'|'Swords'|'Martial_Arts'|'Energy_Weapons'|
                               //   'Flamethrower'|'Rocketman'|'Throwing'|'Spear'|'Crossbow'
  strRequired: number;         // STR_Required (0 = none)
  specialEffects: string[];    // free-text riders (parsed to flags where mechanical — §4.6)
  penetrationMult: number;     // Penetration_Mult base (0.25…3.0; energy '2.0x (2.0x conductive)' → see §4.5)
  defaultAmmo?: string;        // Default_Ammo / Power_Cell ('9mm_Standard'…'Energy_Cell')
  magazineSize?: number;       // Magazine_Size / Power_Cell_Size
  blastRadius?: string;        // Blast_Radius for grenades/explosives ('3x3','5x5')
  costLevel: CostLevel; costValue: number; // costValue = COST_VALUES[costLevel]
  availability: Availability;
  investigationBonus?: string; // Investigation_Bonus ('+2CS military', '+3CS surveillance' — §9.5)
  notes?: string;
  // ── DERIVED / NEW ──
  bampiShape: BampiShape;      // NEW — §3.7 mapping
  concealable: boolean;        // NEW — from Compendium "easy to hide" flag (Knife,Pistol,SMG,Dagger,ThrowingKnife,BrassKnuckles)
  defaultMode: DamageMode;     // existing in weapons.ts (kill/stun)
  stunCapable: boolean;        // existing — blunt/energy/concussive can toggle
  decibels: number;            // NEW — sound emitted on fire/swing (§8 mapping table)
  emoji: string;               // glyph for symbolic grid
}
```

### 3.3 `Armor` (source: `Armor_Complete.csv`)
```ts
interface Armor {
  id: string;                  // 'ARM_LGT_001' … 'ARM_NAT_008'
  name: string;
  category: ArmorCategory;     // Light|Medium|Heavy|Power|Shield|Natural
  drPhysical: number;          // DR_Physical
  drEnergy: number;            // DR_Energy
  drMental: number;            // DR_Mental
  coverage: CoverageType;      // Torso|Full|Limbs|Head_Partial|Hands|Directional|Bubble
  conditionMax: number|'Infinite'; // Condition_Max (Natural = Infinite)
  weightLbs: number; strRequired: number;
  movementPenalty: string;     // '0' | '-1 square' | '-2 squares' | 'Flight 50mph' | '+1 square'
  stealthPenalty: number;      // Stealth_Penalty as CS integer (−4…+3; Stealth_Suit = +3)
  costLevel: CostLevel; costValue: number; availability: Availability;
  specialProperties: string[]; // 'STR +30','Flight','cannot be knocked back','+3DR vs edged'…
  // ── ammo/ballistic bridge (already in armor.ts) ──
  stoppingPower: number;       // ballistic stop rating (0 = none) — used by AP-ammo interaction §6.5
  caliberRating: CaliberClass; // 'none'|'pistol'|'rifle'|'AP' — highest round it reliably stops
  notes?: string;
  emoji: string;
}
interface ArmorComponent {     // CMP_001… add-ons
  id: string; name: string; slot: string;        // Torso|Head|Face|Legs|Arms|Back|Surface…
  drPhysicalBonus: number; drEnergyBonus: number; drMentalBonus: number;
  weightAdd: number; costLevel: CostLevel; costValue: number;
  availability: Availability; effect: string; compatibleWith: string[]; // 'Light'|'Medium'|'Heavy'|'Power'|'Any'
  researchRequired?: string;   // 'Metallurgy_1','Electronics_2','Stealth_2'… (§ research gate)
  notes?: string;
}
interface ArmorMaterial {      // MAT_001… custom-build multipliers
  id: string; name: string;
  drPhysicalMult: number; drEnergyMult: number; weightMult: number;
  conditionMult: number|'Infinite'|'Self_Repair'; costMult: number;
  researchRequired?: string; specialProperties: string[];
}
interface ArmorFrame {         // FRM_001… custom-build base
  id: string; name: string; category: ArmorCategory;
  baseDRPhys: number; baseDREnergy: number; coverage: CoverageType;
  baseWeight: number; baseCondition: number; slotsAvailable: number;
  costLevel: CostLevel; researchRequired?: string;
}
```

### 3.4 `Ammunition` (source: `Ammunition_System.csv` + Weapons_Complete `===AMMUNITION TYPES===`)
```ts
interface Ammunition {
  id: string;                  // 'AMO_001'… (Weapons table) and named types (Ammunition_System)
  name: string; caliber: string;            // 'Universal'|'12ga only'|'Pistol'|'Rifle'…
  damageModifier: string;      // '+25% vs unarmored' | '-25% vs unarmored' | '-75% (non-lethal)'
  penetrationMult: number;     // 0.1…2.5 (multiplies weapon penetrationMult — §4.5)
  costMult: number;            // Cost_Mult (1.0…50.0 — multiplies the weapon/round base price)
  availability: Availability;
  specialEffects: string[];    // 'Expands on impact','+Fire_DOT','-20 dB sound','+100% vs supernatural'…
  ammoCountPerLoad?: number;   // Ammunition_System Ammo_Count_Per_Load
  maxCarry?: number;           // Max_Carrying_Capacity
  weightPerRound?: number;     // 0.02…7.0 lbs
  legalRestriction: string;    // 'Civilian legal' | 'Military/Police only' | 'Heavily restricted'
  notes?: string;
}
```

### 3.5 `Gadget` / `Drone` (source: `Tech_Gadgets_Complete.csv`)
```ts
interface Gadget {             // verbatim from equipmentTypes.ts (already implemented)
  id: string; name: string; category: GadgetCategory; // Drones|Hacking_Tools|Sensors|
                               //   Communications|Weapon_Mods|Field_Gear|Medical_Tech|Surveillance|Utility
  operationType: OperationType;// passive|toggle|intensity|mode_select|deploy|consumable|controlled
  uiControl: UIControl;        // none|switch|slider|dropdown|place_button|use_button|unit_control
  modes?: string[];            // for mode_select ('Kill;Stun','Standard;X-Ray;Enhanced')
  intensityRange?: string;     // for intensity ('0-100')
  deployDuration?: string;     // 'Until_destroyed'|'Until_removed'|'Until_detonated'|number(turns)
  cooldownTurns: number; apCost: number;
  range?: number|string; duration?: number; uses?: number|string;
  skillRequired: SkillRequirement;
  combatEffect?: string;       // 'Heal 25 HP','Block comms in radius','+2CS all stats 10 turns'
  costLevel: CostLevel; costValue: number; availability: Availability;
  weight?: number; detectionRisk?: string; notes?: string; emoji: string;
}
interface Drone {              // DRN_001… — a CONTROLLED gadget that is also a tactical unit
  id:string; name:string; category:'Aerial'|'Ground'|'Aquatic';
  speedMPH:number; controlRangeFt:number; flightTimeMin:number; payloadLbs:number; armorHP:number;
  sensors:string; weapons?:string; operationType:'controlled'; apCost:number; modes:string[];
  costLevel:CostLevel; costValue:number; availability:Availability; notes?:string; emoji:string;
}
```
`WeaponMod` (MOD_001…) is modeled as a `Gadget` of `category:'Weapon_Mods'` whose `combatEffect` carries the ±CS / dB delta it applies to its host weapon (§4.7).

### 3.6 `Vehicle` (combat) + `Door`/`Window`/`Furniture`
```ts
interface Vehicle {            // verbatim equipmentTypes.ts; combat-unit role here (§10)
  id:string; name:string; category:'Ground'|'Aircraft'|'Watercraft';
  speedMPH:number; speedSquaresPerTurn:number; altitudeMax?:number;
  passengers:number; cargoLbs:number; armorHP:number; armorDR:number;
  fuelType:string; rangeMiles:number; pilotSkill:SkillRequirement;
  weaponMounts: number;        // NEW (Vehicles_Complete Weapon_Mounts) — combat capability
  specialProperties:string[];  // '+2CS evasion','Ram attack','bulletproof glass','Mine resistant'…
  costLevel:CostLevel; costValue:number; availability:Availability; notes?:string; emoji:string;
}
interface Door {               // Door_Interaction_System.csv
  type: DoorType;              // Wooden_Interior…Blast_Door|Glass_Door|Revolving_Door|Sliding_Door
  hp:number; strToBreak:number; lockType:LockType; // LockType §3.6.1
  soundDampeningDb:number;     // e.g. −25 (subtract from any dB passing through)
  coverValue:'None'|'Light'|'Medium'|'Heavy'|'Full';
  apToPass:number;             // 1..3
  state:'Open'|'Closed'|'Locked'|'Barricaded'|'Destroyed';
  barricadeHpBonus?:number;    // +20..+50 if furniture-blocked
}
interface Window {             // Window_Type rows
  type:string; hp:number; strToBreak:number; coverWhenClosed:string;
  soundDampeningDb:number; seeThrough:'Yes'|'No'|'One direction'|'Reduced';
}
interface CoverObject {        // Furniture/Cover rows
  type:string; coverValue:'None'|'Light'|'Medium'|'Heavy';  // → +0/+1/+2/+3 CS
  hp:number; strToMove:number; strToFlip?:number;
  canHideBehind:boolean; canHideUnder:boolean; flammable?:boolean;
}
```
**3.6.1 LockType** = `None|Simple|Standard|Advanced|Electronic_Keypad|Electronic_Card|Biometric|High_Security|Vault` with `(lockpickDifficulty: OutcomeBand, apToPick: number, toolsRequired: string, electronic: boolean)` from the LOCK TYPES table (§7.2).

### 3.7 BAMPI shape derivation (NEW — Bible §5.12, RULING EQ-1)
> **RULING EQ-1.** Every weapon row carries a `bampiShape` derived deterministically from `category`/`damageSubType` so the Power-Activation engine (sibling §5.12) can branch. Mapping:
> - `Melee_*` or `damageSubType ∈ {EDGED_MELEE,SMASHING_MELEE,PIERCING_MELEE}` → **Melee**.
> - `Grenades`, `EXPLOSION`, `SHRAPNEL`, `FIRE` (flamethrower cone), `SMOKE/GAS/FLASH/EMP/CONCUSSION` AoE → **Area**.
> - `LASER`, `SONIC`, `DISINTEGRATION`, `STUN`-beam (hitscan, ignore-dodge per Bible §5.12 Instant) → **Instant**.
> - other `Energy_Weapons` sustained (`PLASMA`,`THERMAL`,`ICE`,`PURE_ENERGY`,`ELECTRICAL`,`CONCUSSIVE`) → **Beam**.
> - `GUNFIRE`,`BUCKSHOT`,`SLUG`,`ARROW`,`BOLT`,`THROWN` → **Projectile**.
> This is a *labeling* of existing weapons; no number is invented. (Beam/Instant distinction follows Bible §5.12 verbatim: Instant = hitscan can't be dodged by sub-light targets; Beam = sustained, must maintain aim, chargeable.)

---

## 4. Exact numbers / tables / formulas — WEAPONS (cited)

> Every row below is transcribed from `Weapons_Complete.csv`. Damage is the raw `Base_Damage`; melee "+STR" riders are applied by the damage step (Bible §5.5: melee damage = STR(+weapon)).

### 4.1 Melee (`===MELEE WEAPONS===`)
| ID | Name | Dmg | Type/Sub | Rng(sq) | Acc | Skill | STR | Pen | Special | Cost/Avail |
|---|---|---|---|---|---|---|---|---|---|---|
| MEL_001 | Knife | 10 | PHYS/EDGED | 1 | +0 | None | — | 0.5× | conceal; fast draw | Low/Common |
| MEL_002 | Lead Pipe | 5 | PHYS/SMASH | 2 | +0 | None | — | 0.25× | dmg+STR | Free/Common |
| MEL_004 | Brass Knuckles | 5 | PHYS/SMASH | 1 | +1 | None | — | 0.25× | +5 unarmed dmg | Low/Restricted |
| MEL_005 | Baseball Bat | 12 | PHYS/SMASH | 2 | +0 | None | 10 | 0.5× | dmg+STR; knockback chance | Low/Common |
| MEL_007 | Katana | 15 | PHYS/EDGED | 2 | +0 | Katana | — | 1.0× | crit→bleed; dismember on Major | High/Specialized; **+2CS cultural (Asia)** |
| MEL_011 | Spear | 12 | PHYS/PIERCE | 3 | +0 | Spear | — | 1.0× | longest melee reach; throwable | Low/Common |
| MEL_012 | Axe | 15 | PHYS/EDGED | 1 | −1 | None | 15 | 1.0× | **ignores 5 DR** | Medium/Common |
| MEL_015 | War Hammer | 20 | PHYS/SMASH | 2 | −1 | Heavy_Weapons | 25 | 1.5× | **ignores 10 DR**; high knockback | High/Specialized |

*(Full 15-row set MEL_001–MEL_015 lives in `weapons.ts`; the rows above are the mechanically distinctive ones. Club/Machete/Battle Staff/Nunchaku/Tonfa/Sword/Dagger transcribe identically from the CSV.)*

### 4.2 Firearms (`===RANGED WEAPONS - FIREARMS===`)
| ID | Name | Dmg | Sub | Rng | Acc | Reload | Skill | STR | Pen | Ammo / Mag | Cost/Avail |
|---|---|---|---|---|---|---|---|---|---|---|---|
| RNG_001 | Pistol_Light | 15 | GUNFIRE | 20 | −2 | 2s | None | — | 1.0× | 9mm /15 | Low/Common |
| RNG_002 | Pistol_Standard | 20 | GUNFIRE | 25 | −2 | 2s | None | — | 1.0× | 9mm /17 | Medium/Common |
| RNG_003 | Pistol_Heavy | 25 | GUNFIRE | 25 | −2 | 2s | None | 10 | 1.0× | .45 /8 | Medium/Common |
| RNG_004 | Revolver | 25 | GUNFIRE | 20 | −1 | 5s | None | — | 1.0× | .357 /6 | Medium/Common |
| RNG_005 | SMG | 20 | GUNFIRE | 20 | −3 | 3s | None | — | 1.0× | 9mm /30 | High/Restricted |
| RNG_006 | Shotgun_Pump | 35 | BUCKSHOT | 5 | −3 | 5s | None | 10 | 0.5× | 12ga /8 | Medium/Common |
| RNG_008 | Shotgun_Slug | 35 | SLUG | 15 | −2 | 5s | None | 10 | 1.5× | 12ga_Slug /8 | Medium/Common |
| RNG_009 | Assault_Rifle | 30 | GUNFIRE | 60 | −1 | 4s | Shooting | — | 1.0× | 5.56 /30 | High/Military **+1CS mil** |
| RNG_010 | Battle_Rifle | 35 | GUNFIRE | 70 | −1 | 5s | Shooting | — | 1.2× | 7.62 /20 | High/Military |
| RNG_011 | Sniper_Rifle | 45 | GUNFIRE | 100 | −1 | 6s | Shooting+Sniper | — | 1.5× | .308_AP /10 | Very_High/Military **+3CS surv** |
| RNG_012 | Anti_Materiel | 60 | GUNFIRE | 150 | +0 | 8s | Shooting+Heavy | 20 | 2.5× | .50 /5 | Ultra_High/Military_Only |
| RNG_013 | Machine_Gun | 30 | GUNFIRE | 30 | −3 | 6s | Shooting | 20 | 1.0× | 7.62 /100 | Very_High/Military |
| RNG_014 | Minigun | 30 | GUNFIRE | 20 | −4 | 10s | Shooting | 25 | 1.0× | 7.62 /500 | Ultra_High/Military_Only |

### 4.3 Thrown / Special / Energy / Grenades (key rows)
**Thrown** (`Range_Formula` uses STR): Throwing_Knife 10 dmg `5+STR/10` −2CS 0.5×; Throwing_Star 8 `6+STR/10` −1CS 0.25× (Martial_Arts); Javelin 15 `10+STR/5` −1CS 1.0× (Throwing,STR15); Rock 5 `STR/5` −2CS 0.25×; Brick 8 `STR/5` −2CS 0.5×. *(Source: `===RANGED WEAPONS - THROWN===`.)*

**Special** (`===RANGED WEAPONS - SPECIAL===`): Bow_Compound 15 ARROW rng40 +0 (Bowmaster,STR15); Crossbow 20 BOLT rng30 −1 1.5×; **Flamethrower** baseDamage 0 ENERGY/FIRE rng5 +0 (`15 dmg/turn burn`, area cone, Flamethrower skill, STR20); **Rocket_Launcher** 50 EXPLOSION rng50 −2 0.75× **3×3 blast, high knockback** (Rocketman,STR20); Grenade_Launcher 40 EXPLOSION rng40 −2 0.75× (Shooting,STR15); **Taser** 5 ELECTRICAL rng5 −1 (`stun 1d4`, non-lethal); **Net_Gun** 0 ENTANGLE rng10 −2 (`escape DC15`, non-lethal).

**Energy** (`===ENERGY WEAPONS===`, balanced per Designer Note row): Laser_Rifle 40 LASER rng50 −1 **2.0×**; Plasma_Rifle 45 PLASMA rng30 −2 **2.0×** (burns armor + DoT); Thermal_Rifle 35 THERMAL rng50 −1 1.5×; Ice_Rifle 30 ICE rng20 −1 0.75× (slow/freeze); Energy_Rifle 35 PURE_ENERGY rng40 −2 1.5× (**bypasses physical DR**); Electric_Rifle 30 ELECTRICAL rng30 −2 `1.0× / 2.0× conductive` (chain+stun); **Sonic_Rifle** 30 SONIC rng70 −1 0.5× (`ignores physical armor; passes through cover`); Pulse_Rifle 35 CONCUSSIVE rng40 −1 1.0× (knockback); **Disruptor** 50 DISINTEGRATION rng20 −2 **3.0× (ignores ALL DR)** (Alien); Stun_Rifle 15 STUN rng30 −1 0.5× (`stun 1d6`, non-lethal).

**Grenades** (`===GRENADES===`, all `Range_Formula = 10 + STR/10`, −2CS): Combat_Grenade 50 EXPLOSION 3×3 0.75×; Sticky_Grenade 50 (sticks first contact); Flash_Grenade 0 FLASH 5×5 (`−4CS blind 1d4`); Stun_Grenade 0 CONCUSSION 4×4 (`stun 1d4`); Shrapnel_Grenade 50 BLEED 4×4 0.5×; Smoke_Grenade 0 SMOKE 5×5 (`block LOS, −4CS through`); Incendiary_Grenade 30 FIRE 3×3 1.0× (`15 dmg/turn area`); Gas_Grenade 0 GAS 4×4 (poison/sleep); EMP_Grenade 0 EMP 5×5 (anti-tech/robot); Plasma_Grenade 60 PLASMA 3×3 1.5×.

### 4.4 Damage = 0 weapons (RULING EQ-2)
> **RULING EQ-2.** Rows with `Base_Damage = 0` (Flamethrower, Net_Gun, Flash/Stun/Smoke/Gas/EMP grenades) are **effect-only**: they deal *no HP damage on the main hit* and instead apply their `specialEffects` to the status engine (sibling §24). Flamethrower's "15 damage/turn burn" and Incendiary's "15 dmg/turn area" are **status-tick** damage owned by §24, not a hit-damage number here. This resolves the apparent "0-damage weapon" contradiction without inventing a number.

### 4.5 Penetration (cover/material) — `Penetration_Continuation_System.csv`
- `Effective_Penetration = Base_Damage × Penetration_Mult × Ammo_Penetration_Mult` (§4.6). Penetrates an obstacle if `Effective_Penetration > Obstacle_HP`.
- **Continuing damage** to the target behind = `Base_Damage − (Obstacle_HP ÷ 2)`, min **1**. (Thrown objects add `+ STR/5` to penetration.)
- **Material HP** (canonical, from Penetration table — supersedes the shorter list in Weapons_Complete `===PENETRATION QUICK REFERENCE===` where they differ): Glass 10 · Drywall 25 · Plywood 30 · Wood_Solid 40 · Wood_Reinforced 50 · Brick 80 · Concrete 120 · Concrete_Reinforced 180 · Steel_Thin 100 · Steel_Structural 150 · Steel_Armored 200 · Blast_Rated 300.
- **Electric `2.0× conductive`**: penetrationMult is `1.0×` vs insulated material, `2.0×` vs conductive (metal). Implement as `penetrationMultConductive?: number` on the weapon; pick at runtime by obstacle material.
- **Line attacks** (Beam/Projectile that continue): check penetration target-by-target nearest→farthest, damage drops each pass, **max 5 targets/obstacles** (hard cap). Explosives use **0.75× and blast goes AROUND cover** (not through). Shotgun pellets check separately, −1 dmg/pellet/obstacle. *(All verbatim from `===LINE ATTACK RULES===` / `===SPECIAL PENETRATION CASES===`.)*

### 4.6 Special-effect flag parsing (RULING EQ-3)
> **RULING EQ-3.** `specialEffects` free-text is parsed once at load into mechanical flags so the combat engine never string-matches at runtime. Canonical flags + their source phrase:
> `ignoresDR: number` ("ignores N DR" — Axe 5, War Hammer 10); `bleedOnCrit` ("crit→bleeding" — Katana, Machete, arrows); `dismemberOnMajor` ("dismemberment on Major" — Katana); `knockbackChance` ("chance to knockback" — Bat, Minigun, Rocket, grenades); `areaCone` ("burns in cone" — Flamethrower); `chainTo: 'conductors'` (Electric_Rifle); `bypassesPhysicalDR` (Energy_Rifle, Sonic_Rifle); `ignoresAllDR` (Disruptor); `passesThroughCover` (Sonic); `nonLethal` (Taser, Net, Stun_Rifle, rubber/beanbag ammo). Effects with no mechanical flag stay as display text.

### 4.7 Weapon mods (`Tech_Gadgets_Complete.csv ===WEAPON MODIFICATIONS===`)
Applied as host-weapon deltas (model as `Gadget` cat `Weapon_Mods`): Scope_2x +1CS@range; Scope_4x +2CS@range/−1CS close; Scope_8x +3CS long/−2CS close; Scope_Thermal/NV (see-heat/dark, battery); **Silencer −30 dB / −10% range** (§8); Compensator −1 recoil/+10 dB; Extended_Mag +50% cap/+1s reload; Drum_Mag +200% cap/+3s reload/jam risk; Laser_Sight +1CS close (reveals position); Foregrip/Bipod recoil/+2CS deployed; Bayonet +10 melee. *(All numbers verbatim.)*

---

## 5. Exact numbers — AMMUNITION (cited)

Two ammo tables exist; **RULING EQ-4: the `Penetration_Continuation_System.csv ===AMMUNITION PENETRATION MULTIPLIERS===` block is canonical for `penetrationMult`** (it adds Depleted_Uranium and is internally consistent with the penetration math); `Ammunition_System.csv` is canonical for **economy/logistics** fields (count-per-load, max-carry, $/round, weight, legal). Weapons_Complete `===AMMUNITION TYPES===` (AMO_001–015) supplies the **exotic/monster** rounds and the `damageModifier`.

| Ammo | PenMult | Cost× | Avail | Effect | $/rnd · carry · wt | Source |
|---|---|---|---|---|---|---|
| Standard_FMJ | 1.0× | 1.0× | Common | baseline | 0.50 · 300 · 0.02 | both |
| Hollow_Point | 0.5× | 1.2× | Common | +25% vs unarmored; no over-pen | 0.75 · 240 · 0.025 | both |
| Armor_Piercing | 2.0× | 3.0× | Restricted | −25% vs unarmored; punches armor/cover | 1.25 · 200 · 0.03 | both |
| Tungsten_Core | 2.5× | 10.0× | Military_Only | −25% vs unarmored | — | Weapons table |
| Depleted_Uranium | 2.5× | Military | Military_Only | −25%; +radiation; pyrophoric | — | Pen table |
| Incendiary | 1.0× | 5.0× | Restricted | +Fire DoT (5/turn); ignites behind cover | 2.00 · 160 · 0.035 | both |
| Tracer | 1.0× | 2.0× | Common | −1CS stealth; +1CS@night | — | both |
| Subsonic | 0.75× | 1.5× | Common | **−20 dB**; −10 range | — | both |
| Frangible | 0.25× | 2.0× | Special | shatters on hard surface; aircraft-safe | — | both |
| Rubber | 0.1× | 1.5× | Law_Enf | −75% (non-lethal); stun chance | — | Weapons table |
| Beanbag (12ga) | 0.1× | 1.0× | Law_Enf | −50% (non-lethal); high knockback | — | Weapons table |
| Silver | 1.0× | 20.0× | Specialized | **+100% vs supernatural** | — | Weapons table |
| Cold_Iron | 1.0× | 15.0× | Specialized | +100% vs fae | — | Weapons table |
| Blessed | 1.0× | 25.0× | Religious | +100% vs demons | — | Weapons table |
| Energy_Cell_Std | — | 1.0× | High_Tech | 50 shots/load, 500 max, 0.5 lb/cell | $2.00/cell | Ammunition_System |
| Energy_Cell_Overcharged | — | 2.0× | High_Tech | +50% dmg; overheat risk; 25 shots | $4.00 | Ammunition_System |
| Plasma_Cartridge | — | 4.0× | Ultra-Tech | +burning; 10 shots/100 max | $8.00 | Ammunition_System |
| Laser_Power_Pack | — | 1.5× | High_Tech | no ballistic drop; 100 shots/1000 max | $3.00 | Ammunition_System |

**Damage-modifier resolution (RULING EQ-5).** "vs unarmored" / "vs armor" modifiers apply at the damage step *after* checking target's effective DR: if `target.effectiveDR == 0` apply the "vs unarmored" delta; else the round's penetration already handled armor. "+100% vs supernatural/fae/demon" keys off the **target origin/threat tag** (sibling §22/Origins). Energy weapons consume `Power_Cell` charges not rounds — `magazineSize` = cell shots.

**Scarcity → price tiers** (`Ammunition_System.csv`): Common 1×; Military 2–5×; High-Tech 5–10×; Ultra-Rare 10–50× — these multiply the per-round base and are **further** modified by the spine (§9). Storage tiers: Personal (carry cap), Vehicle (larger), Base (unlimited). Resupply: Field (scavenge), Purchase (between missions), Manufacturing (Engineering career, §9.4).

---

## 6. Exact numbers — ARMOR & the DR math (cited)

### 6.1 The damage→armor pipeline (Bible §5.5, single source)
```
Final_Damage = (Base_Damage × OutcomeMult)  − Effective_DR_of_matching_pool
Effective_DR = DR_pool × (1 − weaponOrAmmoPenetrationConsumed)   // Bible §5.5
Shields absorb against shieldHP BEFORE DR/HP   (§6.6)
Separate pools: DR_Physical | DR_Energy | DR_Mental   // chosen by weapon damageType
```
`OutcomeMult` (Failed 0 / Minor 0.5 / Success 1.0 / Major 1.5) is owned by the resolution engine; this doc only supplies the **DR numbers** and the **penetration that erodes them**.

### 6.2 Pre-made armor (representative rows; full set in `armor.ts`)
| ID | Name | Cat | DRp | DRe | DRm | Cover | Cond | Wt | STR | MovePen | StlthCS | Cost/Avail | Special |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ARM_LGT_002 | Kevlar_Vest | Light | 8 | 0 | 0 | Torso | 40 | 4 | 0 | 0 | 0 | Med/Common | stops pistol; conceal |
| ARM_LGT_003 | Stab_Vest | Light | 5 | 0 | 0 | Torso | 30 | 3 | 0 | 0 | 0 | Low/Common | +3DR vs edged |
| ARM_MED_003 | Combat_Armor | Med | 18 | 5 | 0 | Full | 100 | 20 | 20 | −1sq | −2 | High/Military | modular; plates |
| ARM_HVY_001 | Military_Plate | Heavy | 25 | 10 | 0 | Full | 150 | 30 | 25 | −2sq | −3 | V.High/Military | rifle-rated |
| ARM_HVY_002 | Bomb_Suit | Heavy | 40 | 15 | 0 | Full | 200 | 80 | 35 | −4sq | −4 | Ultra/Military | +20DR vs explosion |
| ARM_HVY_003 | Juggernaut | Heavy | 35 | 15 | 0 | Full | 180 | 50 | 30 | −3sq | −4 | Ultra/Mil_Only | **cannot be knocked back**; +2CS intimidate |
| ARM_PWR_001 | Power_Armor_Mk1 | Power | 30 | 30 | 0 | Full | 200 | 150 | 0 | 0 | −4 | Ultra/HighTech | **STR+30; Flight; 4hr batt** |
| ARM_PWR_002 | Power_Armor_Mk2 | Power | 40 | 40 | 5 | Full | 250 | 120 | 0 | +1sq | −3 | Ultra/HighTech | STR+40; Flight; 8hr; AI |
| ARM_PWR_003 | Stealth_Suit | Power | 15 | 15 | 0 | Full | 100 | 30 | 0 | +2sq | **+3** | Ultra/HighTech | active camo; sound damp |
| ARM_PWR_004 | Flight_Suit | Power | 20 | 25 | 0 | Full | 120 | 40 | 0 | Flight 50mph | −2 | Ultra/HighTech | air superiority |
| ARM_PWR_006 | Heavy_Assault | Power | 50 | 35 | 0 | Full | 300 | 200 | 0 | −1sq | −5 | Ultra/Mil_Only | STR+50; weapon+missile mounts |

### 6.3 Shields (require a **Block action**, directional) — `===SHIELDS===`
Riot_Shield 20/5 +2CS-vs-melee-front; Ballistic_Shield 30/10 stops rifle front; Tower_Shield 25/5 full-front; **Energy_Shield 15/40/10** (excellent vs energy, 2hr batt); Buckler 10/0 (Parry, +1CS melee def); **Force_Shield_Generator 25/50/15** 3×3 bubble, 1hr, stationary. (DRm column populated only here + Power Mk2/Force_Aura/Psi materials.)

### 6.4 Natural armor (super powers, `Condition = Infinite`) — `===NATURAL ARMOR===`
Super_Durability_Low 15/10; _High 30/20; **Stone_Skin** 25/5 (+5 vs blunt, −5 vs sonic); **Metal_Skin** 35/15 (+10 vs edged, weak vs magnetic); Force_Aura 20/30/10; **Adaptive_Armor** 20/20 (after a hit: +10DR vs that damage type 1hr); Regeneration_Armor 10/10 (heals 5 condition/turn, never breaks); **Elastic_Body** 5/5 (blunt halved, **immune to knockback**).

### 6.5 Stopping-power / ballistic bridge (ties armor↔ammo, RULING EQ-6)
> **RULING EQ-6.** `Armor.stoppingPower` + `caliberRating` (already in `armor.ts`) model JA2-style ballistic stops independent of raw DR: an armor with `caliberRating:'pistol'` reduces a pistol round to its DR (stops "stopping pistol rounds" per Kevlar_Vest note); AP ammo (`penetrationMult ≥ 2.0`) **bypasses caliberRating one tier** (pistol-rated armor no longer "stops" an AP round, falls back to raw DR×penetration). This implements the "Kevlar stops pistols / AP defeats it" fantasy from the CSV notes without a new number — `stoppingPower` is the existing field, `caliberRating` the existing enum.

### 6.6 Components / Materials / Custom build (`===COMPONENTS===`,`===MATERIALS===`,`===CUSTOM BUILD FORMULA===`)
Components add flat DR by slot (e.g. Ceramic_Plate_Insert +8/+2 breaks after 3 hits; Titanium_Plate +12/+3 needs `Metallurgy_1`; Graphene_Weave +5/+5 no weight; Trauma_Pad −5 knockback dmg; Helmet_Ballistic +10/+3 −1CS perception; Visor_HUD +2/+2 targeting +1CS needs `Electronics_2`; Flight_Pack flight 30mph 2hr needs `Propulsion_3`). **Custom build (verbatim formula):**
```
Final_DR_Physical = (Base_DR_Phys × Material_Phys_Mult) + ΣComponent_Bonuses
Final_DR_Energy   = (Base_DR_Energy × Material_Energy_Mult) + ΣComponent_Bonuses
Final_DR_Mental   = ΣComponent_Bonuses + Material_Mental_Bonus
Final_Weight      = (Base_Weight × Material_Weight_Mult) + ΣComponent_Weights
Final_Condition   = Base_Condition × Material_Condition_Mult
Total_Cost        = Frame_Cost + (Material_Cost_Mult × Base) + ΣComponent_Costs
```
Materials: Standard 1.0×; Titanium 1.2/1.1/0.7wt (`Metallurgy_2`); Graphene_Layer 1.5/1.3/0.3wt 10× (`Materials_3`); **Vibranium_Alloy 2.0/1.5/0.6wt 50×** (absorbs kinetic, `Alien_Tech`); **Adamantium 2.5/1.0/1.5wt 100×** (Condition Infinite, `Alien_Tech`); Psi_Shielded `+15 DR_Mental` (`Psi_Tech_2`); Reactive (explodes outward on Major, one use); Bio_Organic / Nano_Weave self-repair. Build gates via the `===RESEARCH REQUIREMENTS===` tree (RES_ARM_001–018).

### 6.7 Condition & repair (`===ARMOR CONDITION AND REPAIR===`)
Perfect 100% full; Good 75–99% full; **Worn 50–74% −2 DR all**; **Damaged 25–49% −5 DR, −1CS move**; **Critical 1–24% −10 DR, −2CS all**; **Broken 0% no protection**. Repair: Basic 30min anywhere; Field 1hr (`Engineering +0CS`, repair kit); Workshop 4hr (`+1CS`, spare parts); Full Rebuild 8hr (`+2CS`, 50% materials). Power-armor batteries (4–8hr) are a runtime resource; at 0 battery a Power suit drops to its base DR and loses STR-boost/flight.

---

## 7. Doors / windows / furniture (interior tactics) — `Door_Interaction_System.csv`

### 7.1 Doors
| Type | HP | STR-break | Lock | SoundDamp | Cover | AP-pass |
|---|---|---|---|---|---|---|
| Wooden_Interior | 20 | 20 | Simple | −25 dB | Light | 1 |
| Wooden_Exterior | 35 | 25 | Standard | −30 | Light | 1 |
| Reinforced_Wood | 50 | 35 | Standard | −35 | Medium | 1 |
| Metal_Standard | 80 | 50 | Standard | −30 | Medium | 1 |
| Metal_Security | 120 | 60 | Advanced | −40 | Heavy | 1 |
| Steel_Vault | 200 | 80 | High_Security | −50 | Full | 2 |
| Blast_Door | 350 | 100 | Biometric | −60 | Full | 3 |
| Glass_Door | 10 | 10 | Simple | −10 | None | 1 (shatters) |

### 7.2 Door actions (AP · dB · skill) — `===DOOR ACTIONS===`
Open/Close 1AP/40dB; **Quiet_Open/Close 2AP/20dB** (Stealth/INS roll); Slam 1AP/70dB; Pick_Simple 3AP/20dB (Lockpicking, Minor); Pick_Standard 4AP (Success); Pick_Advanced 6AP (+2CS, Major); Pick_HighSec 8AP (+4CS); **Break_Light 3AP/80dB** (STR≥req); **Break_Heavy 4AP/90dB**; **Kick_In 2AP/85dB** (STR vs door −1CS, faster/louder); **Ram 3AP/95dB** (battering ram +2CS); **Breach 4AP/100dB** (Demolitions + explosive, guaranteed open). Lock tiers from `===LOCK TYPES===`: None/Simple/Standard/Advanced/Electronic_Keypad(code 2AP)/Electronic_Card(card 1AP)/Biometric/High_Security(8AP)/Vault(10AP).

### 7.3 Windows — `===WINDOW TYPES/ACTIONS===`
Standard_Glass HP5 STR10 −10dB; Reinforced HP25 STR30; Bulletproof HP60 STR50; Barred (STR40 bars). **Break_Window 2AP/75dB → 1d6 cutting (STR20+ none); Break_Reinforced 3AP/80dB → 2d6 (STR40+ none); Shoot_Through 0AP −1CS unless broken; Climb_Through 2AP/25dB.**

### 7.4 Furniture / cover — `===FURNITURE/COVER OBJECTS===` → cover CS
Cover_Value maps to the Bible §5.3 cover CS: **None→+0, Light→+1CS, Medium→+2CS, Heavy→+3CS.** Each object has HP, STR_To_Move, STR_To_Flip, hide-behind/under flags. Examples: Desk_Wood Light HP30 (move 15, flip 25); Desk_Metal Medium HP50; Bookshelf Medium HP35 (**Topple 3AP/70dB → 2d6 crush** if STR35+); Dumpster Heavy HP80; Chair None HP10 (throwable); Refrigerator Medium HP70; Barrel Light HP25 (flammable). Actions: Flip_Table 2AP/50dB STR20+ (instant Light cover); Move_Heavy 3AP STR30+; Throw_Furniture 4AP → sibling §25 throwing.

### 7.5 Cover degradation on penetration (`Penetration_Continuation_System.csv ===COVER EFFECTIVENESS POST-PENETRATION===`)
When an attack penetrates a cover object, its CS bonus drops one tier for the rest of combat: **Full→Heavy(+3)→Medium(+2)→Light(+1)→None**. The object's `hp` also drops; at 0 HP it's Destroyed (state `Destroyed` → no cover, may slow movement as rubble). This is the destructible-cover loop Bible §5.3 calls for.

### 7.6 Knockback into walls (`===KNOCKBACK IMPACT RULES===`)
`Impact_Damage = Remaining_Knockback_Squares × 5`; if `Impact_Damage > Wall_HP` the unit **goes through** (takes `Wall_HP ÷ 2`, knockback −2sq, wall destroyed); `75–100% of Wall_HP` → **Embedded** (2AP to extract, Prone); any wall stop → **Prone**. Dazed/Stunned thresholds: 3–5sq Dazed, 6–8sq Stunned 1 turn, 10sq Stunned 2, 12+sq lethal zone. *(This doc owns the wall/door/furniture HP that the knockback check reads; the knockback distance itself is sibling §25.)*

### 7.7 Tactical uses (`===TACTICAL USES===`)
Stack_on_Door +2CS entry; Breach_and_Clear +3CS surprise first turn; Hold_Door (block doorway, others need grapple/push); Block_with_Furniture (+20–50 HP to door → `barricadeHpBonus`); Sniper_Window +1CS accuracy + cover.

---

## 8. Sound / detection model — `Sound_Detection_System.csv`

### 8.1 The one formula (Bible §5.11, RULING: single source)
```
Effective_dB = Base_dB(action) − Σ Material_Dampening(walls/doors between source & listener)
Hearing_Range_sq = (Listener.INS / 5) × (Effective_dB / 30)
Heard  ⇔  distance ≤ Hearing_Range_sq
```
Worked examples (verbatim): pistol(140) through wooden wall(−20)=120 → range `6×(120/30)=24 sq`; running(50) through brick(−40)=10 → `6×(10/30)=2 sq`; whisper(20) through door(−25)=−5 → **not heard**.

### 8.2 Action → decibels (the table gear feeds)
Standing 0 · **Walking_Careful 15** (½ speed) · Walking 30 · Running 50 · Sprinting 60 · Crawling 20 · Door_Open 40 · Door_Slam 70 · Door_Break 80 · Window_Break 75 · Melee_Hit 60 · Unarmed 50 · Grapple 55 · **Pistol 140 · Rifle 160 · Shotgun 155 · SMG 150 · Heavy_Weapon 165 · Explosion_Small 170 · Explosion_Large 180** · Whisper 20 · Talk 50 · Shout 65 · Scream 80 · Super_Power_Low 70 · Super_Power_High 100 · Flight_Low 45 · Flight_High 80. *(These populate `Weapon.decibels` per §3.2: map by category — firearm→its row, melee hit→60, thrown→Melee_Hit, energy→Super_Power_Low 70 unless sonic→its own.)*

### 8.3 Dampening, hearing mods, stealth gear
Material dampening (subtractive dB / range%): Wooden_Wall −20/40% · Brick −40/60% · Concrete −50/70% · Steel −35/55% · Glass −10/20% · Wooden_Door −25/45% · Steel_Security_Door −40/65% · Floor/Ceiling −30/50% (between Z-levels); **multiple walls cumulative**. Hearing mods: Helmet/Armor −1..−3 sq; Enhanced_Hearing ×2; Deaf 0. **Stealth gear (the gear→sound bridge):** Silencer −30 dB (pistol 140→110), Subsonic ammo −20 dB, Silenced_Weapon row caps at 80 dB, Careful movement 15 dB, Sound_Absorption power nullifies up to 140 dB (silent zone). Active_Listen 2AP +50% range; Focused_Listen 4AP +100% pinpoint. Sound-ID roll (Failed/Minor/Success/Major → vague→exact). Environmental masking: City_Ambient 40 dB, Heavy_Rain/Storm −30% hearing, Crowd 60 dB covers movement.

### 8.4 UI: sound cones (`===SOUND CONES===`)
Exact=point/green; General=45°/yellow; Vague=90°/orange; Unknown=360°/red. Drives the combat overlay (§11).

---

## 9. How this consumes the SPINE (country / city / personality → gear)

This is the section that makes equipment "talk to the world." Every channel below cites a real spine field/formula and an existing system to write into.

### 9.1 Price (every item) — country GDP (`16-economy.md`, `locationEffects.ts`)
```
listPrice      = COST_VALUES[item.costLevel]            // §2 base
finalPrice     = round( listPrice
                        × priceMultiplier(country)       // = 0.4 + (GDPPerCaptia/100)×1.2  → 0.4–1.6×
                        × cityTypeMod                     // §9.2 (e.g. Military Arsenal −20% → 0.8)
                        × ammoScarcityMult                // §5 (ammo only)
                        × blackMarketMod )                // §9.3 (illegal gear only)
```
`priceMultiplier` is **verbatim** from `locationEffects.ts ~L251` (Japan GDPcap=86 → 1.43×; North Korea 43 → 0.92×). No new price math is invented — equipment reuses the economy's existing multiplier.

### 9.2 City type → what the shop SHOWS + discounts (`City_Type_Effects.csv`, `12-city-culture-terrain.md`)
- **Equipment-access tags**: an item is *purchasable in a city* only if its `availability` tier is unlocked by the union of the city's `equipmentAccess` tags. **Military** city unlocks `Military weapons; Armor; Vehicles` and grants **Arsenal Access — military gear −20% cost** (`cityTypeMod = 0.8` for `availability ∈ {Military, Military_Only}`). **Industrial** unlocks `Industrial equip; mods` + **Workshop** (enables on-site armor repair/mod, §6.6/§4.7). **Temple** Sanctuary (24h no-combat). (Source: `12-city-culture-terrain.md` §"Type" table rows.)
- **Pop-rating equipment ceiling** (`populationRating` 2–7 → tier `{2:Limited … 7:All}`): a low-pop village cannot stock `Ultra_High`/`Alien_Tech` gear regardless of money; a megacity stocks everything. (Source: `12-city-culture-terrain.md` §3.4 pop-tier table.) Implement as `maxAvailabilityTier(popRating)`.

### 9.3 Country corruption/law → black market (`14-combined-effects.md`, `combinedEffects.ts`)
Restricted/Military_Only/illegal gear that a *legal* shop won't show is offered by the **black-market** channel when `blackMarket.available` (Corruption + Military − Law). It carries:
- price `× blackMarket.weaponPriceModifier`, quality from `weaponQualityRange`, and a **risk roll** (`policeRaidChance`, `scamChance`, `fedInfiltrationRisk`) resolved on the Universal Table per `14-combined-effects.md` §"buy_blackmarket_weapon". (So a railgun is *cheap and risky* in Lagos, *unavailable* in Oslo — Bible §8.)

### 9.4 Country science/education → high-tech gear & manufacturing (`research` system)
Energy/Power/Alien gear (`availability ∈ {High_Tech, Alien_Tech, Ultra_High}`) is gated by `research.techAvailability` and priced `× research.techPriceModifier` (Science + Education + GDP + Cyber). Custom-armor research gates (RES_ARM_001–018, §6.6) and **ammo manufacturing** (Engineering career, `Ammunition_System` Manufacturing resupply) read this. (Source: `14-combined-effects.md` research row; `Tech_Gadgets`/`Armor_Complete` research columns.)

### 9.5 Gear → spine (write-back): investigation & detection
- **`investigationBonus`** on weapons/energy gear feeds the **investigation** system as a non-combat ±CS (Katana +2CS cultural-Asia, Sniper +3CS surveillance, Laser +2CS technology). (Source: Weapons_Complete `Investigation_Bonus`; consumed by `09-investigations.md`.)
- Surveillance/sensor/hacking gadgets feed the **surveillance/detection** combined-effect (their `detectionRisk`, range, `Detection_DC`) and the ballistic-forensics investigation hook (`Ammunition_System` `Investigation_Integration_Ballistics` — AP/exotic rounds leave traceable evidence; purchases create a paper trail).
- **Ammo supply chain** is faction/relations-gated (`Ammunition_System Supply_Chain_Integration`: allied nations supply, hostile restrict) → reads `13-factions-relations-territory.md` standings.

### 9.6 Personality → AI loadout & target choice (`PERSONALITY TARGET SELECTION`, Bible §5.10)
Enemy/ally AI **picks gear consistent with personality** at spawn and **targets** per its personality row: a "Bully" (targets least-health) prefers high-burst close weapons (shotgun/SMG); a "Pragmatist" (targets major threat) takes the longest-range accurate option it can afford (sniper/battle rifle). This is a *selection bias over the same gear tables*, not new items. (Hand-off: the loadout-generator reads `personalityType` + tier budget + city availability and returns a weapon/armor set.)

### 9.7 Stance/mode interaction (sibling §21)
`Sniper`/`Power`/`Aim` stances/modes multiply weapon `Accuracy_CS`; `Stealth` mode requires sub-threshold dB (§8) — so suppressor/subsonic gear is what *enables* the stance. Heavy armor `movementPenalty` reduces the `Mobile` stance benefit. Gear and stance are read together by the resolution engine.

---

## 10. Vehicles as tactical units — `Vehicles_Complete.csv`

**Scope:** this is the *combat* role (the world-map travel role is `05-travel-movement.md`). A vehicle in combat is a unit with `armorHP` (a health pool), `armorDR`, a `speedSquaresPerTurn` (=`MPH/10×2`), `passengers`, `weaponMounts`, and `specialProperties`.

- **Speed→grid:** `speedSquaresPerTurn = MPH/10 × 2` (Designer note). Car_Sedan 130 MPH → 26 sq/turn; Tank_Main 40 → 8.
- **Ram attack** (`===VEHICLE COMBAT RULES===`): `Damage = Speed/10 × VehicleHP/100`. Bulldozer/Dump_Truck/Giant_Robot flagged `Ram attack`/`demolition`.
- **Drive-by** −2CS; **Vehicle as cover** +2CS..+4CS by position; **Called-shot tires** −2CS (control check on hit); **Called-shot driver** −3CS (windshield DR 5–15); **Fuel-tank shot** −2CS (25% explosion if penetrated).
- **Damage states** (`===VEHICLE DAMAGE STATES===`): 0–25% operational; 26–50% −25% speed/−1CS handling; 51–75% −50%/−2CS; 76–99% −75%/−3CS/25% fire; 100% destroyed (explosion risk). Vehicle Major damage → driver control check or loses control.
- **HP/DR reference rows** (combat): Motorcycle_Sport 60/5 (+2CS evasion); Car_Sedan 100/8; Car_Armored 200/25 (bulletproof glass, run-flat); SUV_Armored 200/25; Humvee 200/20 (1 mount); APC 300/35 (2 mounts); MRAP 350/40; Tank_Light 400/50; Tank_Main 500/60 (1 main+2 MG); Helicopter_Attack 200/20 (4 mounts); Fighter_Jet 150/15 (6 mounts, altitude 60000ft); Giant_Robot 500/50 (20ft, weapon systems). Exotic (campaign-defining, GM-gated): Hover_Car/Bike, Power_Armor_Flight 300/40, Teleporter_Pad, Invisible_Jet.
- **Weapon mounts**: `weaponMounts > 0` means N weapons from §4 can be slaved to the vehicle; mounted Minigun/Rocket fire uses the vehicle as the firing platform (drive-by −2CS unless stationary).

---

## 11. UI / UX hooks

**Phone / Laptop (meta, pauses time — Bible §7):**
- **Quartermaster / Shop app:** lists only items the current city *shows* (availability ∩ equipmentAccess ∩ popTier, §9.2); each card shows `finalPrice` (with a struck-through list price when a discount/black-market mult applies), the four headline numbers (±CS, dmg/DR, dB, $), legal flag, and a "via Black Market — risk" badge when applicable. Filter by class/availability/affordability.
- **Loadout screen (pre-mission):** drag weapons/armor/ammo/gadgets onto a paper-doll + slot grid; shows total weight vs STR cap, stealth-CS sum, and a **"noisiest action: X dB / heard N sq"** readout so the player can plan a quiet kit. Ammo selector per firearm (penMult/cost preview). Mod attach (host-weapon CS preview).
- **Custom-armor bench (Industrial city / base Workshop):** Frame + Material + Components builder showing the live `===CUSTOM BUILD FORMULA===` outputs and the research gates still locked.
- **Encyclopedia entry** (`EncyclopediaEntry` in equipmentTypes.ts): every item has a reference page (stats, source-table cite, balance note).

**World-map:** vehicle assignment to squads (combat HP/DR shown on the squad token); ammo/repair resupply at owned bases.

**Combat overlay (symbolic grid — Bible §5):**
- Each unit glyph shows a tiny **armor pip** (DR), a **weapon glyph**, and an **ammo-count** number; low/empty mag flashes (reload = AP cost from `reloadSec` mapped to AP per §21).
- **Sound cones** (§8.4) render as the green/yellow/orange/red wedges; a fired weapon emits a dB ring sized to its hearing range; suppressed shots show a smaller ring.
- **Doors/windows/furniture** are interactive glyphs: a closed door shows its lock tier + HP; right-click → contextual actions (Open/Quiet-Open/Pick/Kick/Ram/Breach) each labeled with AP·dB; cover objects show their +CS pip, dimming a tier when penetrated (§7.5).
- **Vehicle** units show an HP bar + damage-state color; called-shot sub-targets (tires/driver/fuel) selectable from a radial.
- **Penetration preview:** when aiming through cover, the line shows `Effective_Penetration vs Obstacle_HP` and the continuing-damage estimate.

**Accessibility:** every ±CS / dB / price is text-labeled (no color-only), per `105-accessibility-input-config.md`.

---

## 12. Integration points (reads / writes)

**Reads from:**
- `20-core-resolution-4cs.md` / Bible §3.3 — supplies the Universal-Table roll & OutcomeMult this doc's numbers plug into.
- `21-tactical-combat-grid.md` — range bands, stances/modes, cover CS, altitude (for area-weapon falloff Z3+, Bible §5.4), AP economy (maps `reloadSec`/`attackSpeedSec` → AP).
- `22-damage-model-types.md` — owns the `damageType`/`subType` rider catalog this doc tags items with.
- `23-crit-injury.md` — consumes `ignoresDR`, `bleedOnCrit`, `dismemberOnMajor` flags.
- `25-strength-throwing.md` — owns the throwing formula; this doc supplies thrown-weapon/improvised stats + object HP.
- `24-status-effects.md` — owns burn/stun/blind/EMP riders that effect-only (0-dmg) weapons apply.
- `11/12/13/14/16` (spine) — price, availability, black-market, research, faction supply (§9).

**Writes into:**
- The **to-hit/damage** pipeline (Accuracy_CS, baseDamage, penetration, DR — §2 hand-off).
- The **sound/detection** state (every action's dB → §8 → AI alert + stealth).
- **Investigation/surveillance** (`investigationBonus`, sensor DCs, ballistic forensics — §9.5).
- **Economy** (`equipment_purchase/sale`, `equipment_maintenance`, ammo cost — `16-economy.md` transaction categories, verbatim).
- **Hospital/recovery** indirectly (armor condition + medical gadgets pre-stabilize before §108).

---

## 13. Edge cases & failure modes

1. **0-damage weapons** → RULING EQ-2 (effect-only; status engine owns the tick). Never divide-by-zero in DPS; AI auto-resolve treats them as utility (apply effect, skip damage).
2. **Energy weapons fed by cells, not rounds** → ammo tracking uses `Power_Cell` shots; an energy weapon at 0 cells cannot fire (no "0-round reload"). Overcharged cell = +50% dmg but rolls overheat (disable 1 turn) — owned by status engine.
3. **STR below `strRequired`** → weapon usable at **−1CS per 5 STR short** (RULING EQ-7: the CSV gates by STR but gives no under-STR penalty; this keeps it soft like JA2 rather than a hard lock) and cannot brace/fire-from-hip heavy weapons (Minigun/AMR need STR20–25 to *carry* per Compendium → cannot move + fire same turn if under).
4. **Armor caliberRating vs AP ammo** → RULING EQ-6 (AP bypasses one tier).
5. **Penetration over-chains** → hard cap 5 targets; continuing damage min 1; explosives never line-penetrate (go around cover).
6. **Electric conductive ambiguity** → `penetrationMultConductive` chosen by obstacle material at runtime (§4.5).
7. **Suppressor + subsonic stack** → dB reductions are subtractive and stack (140 −30 −20 = 90 dB) but floor at the `Silenced_Weapon` 80 dB row (RULING EQ-8: never below 80 for a firearm; magic/power silence (Sound_Absorption) can go lower).
8. **Item available in city but unaffordable / illegal here** → shop greys it with reason ("requires Military access" / "black market only" / "above town tier"); never silently hidden.
9. **Power-armor battery depletion mid-combat** → drops to base DR, loses STR-boost & flight (a flyer at altitude must emergency-descend, sibling §5.4) — telegraph battery % in HUD.
10. **Natural armor + worn armor** → take the **higher DR per pool**, do not sum (RULING EQ-9: prevents Adamantium-skin + Heavy_Assault stacking to absurd DR; matches "natural armor balances powered vs non-powered" designer note). Shields still add (separate Block).
11. **Vehicle destroyed with passengers** → passengers take the explosion/impact per knockback-impact rules; eject check (AGL) to bail before destruction.
12. **Thrown weapon as both melee & ranged** (Spear, Dagger, Throwing_Knife reusable) → item carries both `rangeSquares`(melee) and `rangeFormula`(thrown); UI offers both verbs.
13. **Door/cover HP desync after save (time-travel)** → interior interaction state is per-encounter, not persisted across the diegetic save (Bible §11); a rewound mission regenerates fresh doors/cover.
14. **Mod incompatible with weapon** (Drum_Mag on a revolver) → `compatibleWeapons` check; UI blocks attach.

---

## 14. RULING notes (collected, all Bible-consistent)

- **EQ-0** `Weapons_Complete.csv` is stat-canonical; Compendium retained for FAST-turn DPS + concealment flags only. (Bible §13 #1 discipline.)
- **EQ-1** Every weapon carries a derived `bampiShape` (Beam/Area/Melee/Projectile/Instant) for the Power-Activation engine. (Bible §5.12.)
- **EQ-2** `Base_Damage = 0` weapons are effect-only; burn/15-dmg-per-turn are status ticks (sibling §24).
- **EQ-3** `specialEffects` parsed once into mechanical flags (`ignoresDR`, `bleedOnCrit`, `nonLethal`, …).
- **EQ-4** Penetration table is ammo `penetrationMult` canon; `Ammunition_System.csv` is logistics canon.
- **EQ-5** "vs unarmored/armor/supernatural" modifiers resolve at the damage step keyed off target DR / origin tag.
- **EQ-6** `stoppingPower`+`caliberRating` model ballistic stops; AP ammo bypasses one tier.
- **EQ-7** Under-`strRequired` use = −1CS per 5 STR short (soft gate), heavy weapons can't move+fire if under carry-STR.
- **EQ-8** Firearm dB floors at 80 (Silenced_Weapon row); only powers go lower.
- **EQ-9** Natural vs worn armor = take higher DR per pool, don't sum; shields add (Block).
- **Material HP canon** = `Penetration_Continuation_System.csv` values (supersede the shorter Weapons_Complete quick-ref where they differ, e.g. it lacks Concrete_Reinforced/Blast_Rated).

## 15. OWNER-FORK notes (product choices, not in source tables)

- **OF-1 — Loadout slot count & weight model.** Source gives weapon/armor weights and `Tactical_Vest +6 slots / Backpack +10 slots`, but no canonical character carry-capacity formula tying STR→max-weight for *kit* (the STR ladder governs *lifting/throwing*, §25, not encumbrance). Owner to choose: (a) slot-only (JA2-lite, ignore weight), (b) weight-vs-STR encumbrance using the §25 lift ladder, or (c) hybrid (slots for access + soft weight CS penalty). Recommend (c). **No number invented here.**
- **OF-2 — Durability/economy of ammo at low tiers.** `$/round` exists; whether Tier-1 players track individual rounds or buy "mags" as abstract units is a UX/economy granularity call. Recommend abstract mags early, per-round forensic tracking only when an investigation needs it.
- **OF-3 — Exotic/Alien gear acquisition gate.** Tables mark Disruptor, Vibranium, Adamantium, Zero_Point, Teleporter as `Alien_Tech` "GM approval"/"campaign-defining" with no price-able path. Owner to decide the *single* canonical unlock (reverse-engineer captured tech via research vs alien-contact mission reward vs Time-Chain power). Recommend: research reverse-engineering of *captured* alien items (ties to RES_ARM_018 + investigations).
- **OF-4 — Weapon-mod stacking limits.** Source lists mods with drawbacks but no per-weapon mod-slot cap. Owner to set (recommend: optic + barrel + magazine + accessory = 4 slots, one per category) to prevent stacking 3 scopes.
- **OF-5 — Vehicle combat depth.** Designer notes call chases "dramatic tension, not just dice" and fuel "optional." Owner to decide how deep vehicle combat goes (full tactical-unit vs abstracted chase mini-resolution). Recommend abstracted chase + full tactical-unit only when a vehicle is *in* a combat encounter.

## 16. Open questions

1. **AP mapping of `attackSpeedSec`/`reloadSec`.** §21 owns the AP economy (Attack 3AP, Reload 2AP). Does a 0.1s Minigun get extra shots/turn vs a 3s Sniper's one, or is it abstracted to one Attack action with DPS baked into damage? (Compendium's `Damage_per_FAST_turn` suggests a multi-shot model; needs a §21 ruling.)
2. **Shotgun spread vs grid** — does buckshot roll per-pellet on the symbolic grid, or one roll with the "−1 dmg/pellet/obstacle" abstraction? (Lighter spec leans toward one roll.)
3. **Stopping-power numbers** — `caliberRating` enum exists but the per-armor mapping (which armors are pistol/rifle/AP-rated) is currently inferred from notes ("stops pistol rounds"); needs a one-pass authored table to remove inference (not invention — re-reads the CSV `Special_Properties`).
4. **Drone-as-unit AP economy** — controlled drones cost 2–5 AP to launch; do they then act on the *operator's* initiative or their own? (Cross-ref §21 initiative + this doc's `Drone`.)
5. **Black-market quality variance** — `weaponQualityRange` from `combinedEffects.ts` implies a stat roll on bought illegal gear (jam chance / reduced condition). Exact quality→stat mapping needs a §14 ruling.

---

*Build-ready: a coder can implement every item from the seven primary tables using the schemas in §3, the numbers in §4–§8 & §10, and the spine-consumption formulas in §9 — with the field names already matching `equipmentTypes.ts`. No number in this document is invented; each traces to a named source row, or is a labeled RULING/OWNER-FORK consistent with `SHT_MECHANICS_BIBLE.md`.*
