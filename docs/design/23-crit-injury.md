# 23 — Criticals & Injury Pipeline (body-part targeting · permanent disability · recovery)

> **System owner doc.** Build-ready spec for the **one crit → injury pipeline** mandated by the Bible (§5.6, §13 ruling #2): the moment a hit "goes bad" (a **Major** outcome, a **called shot**, an overkill, a fall, a crush), this system decides **WHAT happened, WHERE on the body, and HOW BAD** — then emits a fully-resolved `Injury` record that the **recovery loop (doc 108)** carries on the strategic layer. It is the bridge between a tactical dice result and a character who limps out of the fight missing an eye.
>
> **Primary source tables (opened for this spec):**
> - `SuperHero Tactics/Combat Compendium REAL - 🩸CRIT TABLE🦴.csv` — the body-part crit table: **Smashing / Piercing / Slashing** effect lists keyed by `DAMAGE TYPE`. **(primary — "what & where")**
> - `Game_Mechanics_Spec/Injury_System.csv` — the d100 **wound table** (Fatal→Survivability), `===INJURY TRIGGER CONDITIONS===` roll modifiers, `===INJURY RESISTANCE===`, `===MEDICAL TREATMENT===`, `===RECOVERY TIMES===`, `===PROSTHETICS===`. **(primary — "how bad & recovery clock")**
>
> **Secondary source tables (cited inline):**
> - `Stat_Rank_Mapping.csv` — the `---RESULT EFFECTS---` block (Major = 1.5× + bonus effects), the `---COLUMN SHIFT REFERENCE---` (−1CS … −6CS), and the rank ladder used to read STR/CON saves.
> - `Origin_Damage_Interactions.csv` — `===ORIGIN EFFECT IMMUNITIES===` (Bleeds gate, Construct = Malfunction-roll-not-Injury-roll), `===CONSTRUCT SPECIFIC EFFECTS===`, `===ALIEN PHYSIOLOGY EXAMPLES===`.
> - `Origin_Types.csv` — `===ORIGIN THREAT MODIFIERS===` (origins that resist injury via Durability/Regeneration powers).
> - `SuperHero Tactics/Combat Compendium REAL - 🦆DODGE CHART🦆.csv` — the Reflex / CON / STR **save** column-shift ladder (the crit table calls "Reflex save vs. damage dealt").
> - `SuperHero Tactics/Combat Compendium REAL - 😢EFFECT_STATUS😴.csv` — the I/II/III status-severity model the crit riders feed into.
> - `SuperHero Tactics World Bible - Country.csv` / `- Cities.csv` — `Healthcare`, `Science`, `GDPPerCaptia`, `Cloning`, `CrimeIndex` columns that scale **injury resistance via local body-armor/medevac** and **recovery** (the spine, §5).
>
> **Sibling docs — strict ownership boundaries (do NOT re-implement here):**
> - **`20-core-resolution-4cs.md`** owns the Universal-Table roll and the Failed/Minor/Success/**Major** band. This doc is **triggered by** a Major; it does not roll to-hit.
> - **`21-tactical-combat-grid.md`** owns the grid, net-CS, dodge, cover, and **flags** that a Major or a called shot occurred (its §9 hand-off row). It does not own the crit/injury tables.
> - **`108-hospital-cloning-recovery-loop.md`** owns the `Injury` TS interface, `TreatmentTier`, `DyingState`, the Hospital activity, recovery-time resolution to game-days, prosthetics fitting, death-saves and cloning. **This doc PRODUCES that `Injury` record and hands it off; it does not run the recovery clock.**
> - Bible rulings honored: §5.6 (one crit→injury pipeline), §13.2 (drop the prototype %-table; use body-part crit table → injury d100 with modifiers Major −0 / called-shot −30 / overkill −20), §13.7 (one rank ladder for STR/CON saves), §13.8 (no XP — injuries never grant progression), §13.9 (combined-effects must be consumed — Healthcare/Science/Cloning scale resistance & recovery), §11 (death is permanent except cloning/Time-Walker).
>
> **NEVER INVENT A NUMBER.** Every value below traces to a named table cell. Where the source was silent or self-contradictory, the call is marked **RULING:** (consistent with the Bible) or **OWNER-FORK:** (a product choice only the owner should lock).

---

## 1. Overview & player fantasy

Combat in SHT is **one verb, not the point** (Bible §5) — but when it bites, it must bite *for real and forever*. The fantasy this system sells:

- **"That fight cost me an eye."** A merc you trained for forty in-game days walks out of a warehouse in Lagos with a slashed face and **−2CS to every ranged attack, permanently**, until you can afford regeneration tech or a cybernetic eye. The injury follows them onto the world map, into the next mission, into the obituary if it kills them.
- **Called shots are a *decision*, not a default.** You *can* aim for the gun-arm of the L4 brick who's about to throw a bus — but a called shot is **−30 to the injury roll** (`Injury_System.csv` `Called_Shot_Success`), pushing toward Permanent_Disability/Critical results. You're choosing to *maim*, and the world (fame, faction, the victim's own personality) will remember.
- **Your origin is your fate.** A Construct doesn't bleed — it sparks and rolls Malfunction instead of Injury (`Origin_Damage_Interactions.csv`). A high-Durability cosmic gets **+20 to the injury roll** and shrugs off what would cripple a Skilled Human. Team composition is a survival decision.
- **Geography is medicine.** The *same* punctured lung is a 1d4-week hospital stay in a high-Healthcare Medical Center and a death sentence in a failed state with no medevac (the spine — handed to doc 108).
- **Luck is real.** Roll 94–100 and the wound that should have ended you becomes an **Adrenaline Rush** — instant stabilize, heal a hit-die, +1CS death saves. The crit table is not only punishment; it is also the source of "I should be dead and I'm not" stories.

The system is **symbolic** like the rest of combat (Bible §5): no gore model. A crit shows as a **glyph + one-line ticker** ("⚔ Slash → Brow Gash → blinded while bleeding") and writes a persistent **body-map flag** on the unit token.

---

## 2. The pipeline (authoritative control flow)

```
        ┌─────────────────────────────────────────────────────────────┐
        │ TRIGGER (from doc 20/21): a hit resolved as MAJOR,           │
        │ OR a called-shot landed, OR a fall/crush/overkill/explosion. │
        └─────────────────────────────────────────────────────────────┘
                                   │
                   (A) ORIGIN GATE — Injury_System §IMMUNITIES / Origin_Damage_Interactions
                   Construct → roll MALFUNCTION (108), not injury. Stop.
                   Energy-being / immune origin for this damage type → no injury. Stop.
                                   │  (organic / bleeds-applicable)
                                   ▼
                   (B) CRIT TABLE — "what & where" (🩸CRIT TABLE🦴.csv)
                   Pick the damage-class column: SMASHING | PIERCING | SLASHING
                   (resolved from the attack's DAMAGE TYPE, §4.1).
                   Roll position on that column → a named crit entry that carries:
                     • a body-part (arm/leg/eye/hand/foot/head/organ/throat/…)
                     • inline riders (bleed dice, save prompts, status, stat damage)
                     • a DAMAGE×multiplier if the entry lists one (e.g. 1.5× head)
                                   │
                   (C) EMBEDDED SAVES — resolve the crit entry's own checks
                   "Reflex save vs. damage dealt" → knockback (hand to doc 21 KB)
                   "DC 15 Str to remove weapon", "CON check or prone", etc. (§4.3)
                                   │
                   (D) INJURY d100 — "how bad & recovery" (Injury_System.csv)
                   roll = d100 + Σ trigger modifiers + Σ resistance modifiers (§4.4)
                   clamp 1..100 → category band → named wound row.
                   The crit-table body-part (B) SEEDS which row in a tie/range.
                                   │
                   (E) APPLY
                     • permanent disability → write StatPenalty[] (permanent:true)
                     • bleed/status → emit to Status engine (doc 21 §5.7 / 108)
                     • Fatal → Dying/Dead handoff (108 §2.4)
                     • build the Injury record (108 §2.1 schema) and ATTACH to unit
                                   │
                   (F) HAND OFF to 108 recovery loop + fire UI ticker/news hooks (§7)
```

> **RULING CI-1 (single entry point).** Exactly one function owns this: `resolveCritInjury(ctx: CritContext): CritOutcome`. Doc 20/21 never apply an injury directly; they only set `ctx.trigger`. This is the literal implementation of Bible §13.2 "one pipeline."

---

## 3. Data schema

All field names that cross into the recovery loop **reuse doc 108's interfaces verbatim** (`Injury`, `StatPenalty`, `TreatmentTier`, `DyingState`) so there is one source of truth on the strategic side. New types below are owned **here**.

### 3.1 Input — `CritContext`

```ts
type CritTrigger =
  | 'Major'            // Universal_Table Major band (doc 20); injury mod +0
  | 'CalledShot'       // targeted body-part attack landed; injury mod -30
  | 'Overkill'         // damage > target maxHP in one hit; injury mod -20
  | 'Falling'          // injury mod -10 per 10 ft
  | 'Explosion'        // caught in blast; injury mod +10
  | 'Crushing';        // crushed by heavy object; injury mod -15
// ^ all six + their modifiers verbatim from Injury_System.csv ===INJURY TRIGGER CONDITIONS===

type CritDamageClass = 'SMASHING' | 'PIERCING' | 'SLASHING';
// the three columns physically present in 🩸CRIT TABLE🦴.csv (§4.1 maps DAMAGE TYPE → class)

type BodyPart =
  | 'eye' | 'ear' | 'nose' | 'teeth' | 'head' | 'throat'
  | 'arm' | 'hand' | 'finger' | 'leg' | 'foot'
  | 'organ' | 'spine' | 'rib' | 'muscle' | 'tendon' | 'torso';
// superset of doc 108 Injury.bodyPart; 108 narrows to its own union on attach (§4.7)

interface CritContext {
  attackerId: string;
  targetId: string;
  trigger: CritTrigger;
  damageType: string;          // e.g. "GUNFIRE","EDGED_MELEE" (Origin_Damage_Interactions DAMAGE_SubType)
  damageDealt: number;         // post-armor damage that landed (for "save vs. damage dealt")
  calledShotPart?: BodyPart;   // set only when trigger==='CalledShot'
  fallFeet?: number;           // set only when trigger==='Falling' (drives -10 per 10ft)
  // resistance inputs (§4.5) — read from the TARGET unit & its location
  targetOrigin: number;        // Origin_ID 1-9 (Origin_Types.csv)
  targetCON: number;           // raw stat → rank, for embedded CON saves
  targetSTR: number;           // raw stat → rank, for embedded STR saves
  targetReflexStat: number;    // AGL (+INS for melee) raw → DODGE CHART column for Reflex saves
  hasDurabilityPower: boolean; // Injury_System ===INJURY RESISTANCE=== Durability_Power +20
  hasRegenerationPower: boolean;// Regeneration_Power = Auto-cure between combats
  armorDR: number;             // for +1 per 5 DR
  shieldBlocked: boolean;      // +30 if blocked
  defensiveStance: boolean;    // +10
  // spine inputs (§5) — read from the sector the TARGET is standing in
  countryCode: string;
  cityId: string;
}
```

### 3.2 Output — `CritOutcome`

```ts
interface CritOutcome {
  // ---- (B) crit-table result: WHAT & WHERE ----
  critClass: CritDamageClass;
  critEntryName: string;       // e.g. "Eye Gouge","Hamstring","Major Head Trauma"
  bodyPart: BodyPart;
  damageMultiplier: number;    // 1.0 default; 1.5 where crit entry lists "DAMAGE X" (§4.2)
  bonusDamage: { dice: string; nonlethal: boolean }[]; // e.g. "2d6 + Strength nonlethal"

  // ---- (C) embedded saves already resolved ----
  knockbackTriggered: boolean; // "Reflex save vs. damage dealt or knocked back 5 ft"
  knockbackFeet: number;       // 5 (table) — handed to doc 21 knockback, not resolved here
  embeddedSaveResults: { kind: 'Reflex'|'CON'|'STR'; dc?: number; passed: boolean; effect: string }[];

  // ---- (D) injury-table result: HOW BAD & RECOVERY ----
  injuryD100: number;          // final clamped roll 1-100
  injuryRollBreakdown: { base: number; triggerMods: number; resistMods: number };

  // ---- (E) the attachable record (doc 108 Injury schema) + status emissions ----
  injury: Injury | null;       // null if outcome was Survivability/no-effect (light bands)
  statusEmissions: StatusEmission[]; // bleed/stun/blind/prone → doc 21 §5.7 + 108
  malfunctionInstead: boolean; // Construct path (A) — recovery loop runs Repair not heal
  fatal: boolean;              // d100===1 → handoff to DyingState (108 §2.4)

  // ---- UI ----
  tickerLine: string;          // §7.1 one-line combat-log string
  bodyMapFlag: BodyPart;       // persistent token overlay (§7.2)
}

interface StatusEmission {
  status: string;              // 'Bleeding'|'Stunned'|'Blind'|'Prone'|'Unconscious'|'Nauseated'|…
  severity: 'I'|'II'|'III'|'None'; // EFFECT_STATUS.csv tiering (§4.6)
  duration: { dice: string; unit: 'rounds'|'turns'|'hours'|'days'|'untilRecovery' };
  bleedPerTurn?: number;       // when status==='Bleeding'
}
```

### 3.3 Static data files this system loads

| Logical table | Source CSV | Used for |
|---|---|---|
| `critTable[class][]` | `🩸CRIT TABLE🦴.csv` | (B) named crit entries + riders per Smashing/Piercing/Slashing |
| `damageClassMap` | derived from `Origin_Damage_Interactions.csv` `DAMAGE_SubType` + CRIT TABLE `Exception` column | (§4.1) map a damage type → SMASHING/PIERCING/SLASHING |
| `injuryTable[]` | `Injury_System.csv` `===INJURY TABLE===` | (D) d100 → wound row |
| `injuryTriggerMods` | `Injury_System.csv` `===INJURY TRIGGER CONDITIONS===` | (§4.4) |
| `injuryResistance` | `Injury_System.csv` `===INJURY RESISTANCE===` | (§4.5) |
| `originImmunities` | `Origin_Damage_Interactions.csv` `===ORIGIN EFFECT IMMUNITIES===` | (A) gate |
| `saveLadder` | `🦆DODGE CHART🦆.csv` | (C) Reflex/CON/STR save column-shift |

---

## 4. Exact numbers / tables / formulas (each cited)

### 4.1 Damage type → crit class (which column of the CRIT TABLE)

The `🩸CRIT TABLE🦴.csv` has exactly **three effect blocks**: `SMASHING` (rows 2–25), `PIERCING` (rows 27–46), `SLASHING` (rows 48–68). The right-hand `Exception` column of that CSV lists the damage families that route into each (rows 4–13: `SMASHING MELEE, SMASHING PROJECTILE, IMPACT, GUNFIRE, EXPLOSION, SOUND, PIERCING PROJECTILE, EDGED MELEE, ENERGY, ELECTROMAGETIC[sic]`). Cross-referenced with the `DAMAGE_SubType` enum in `Origin_Damage_Interactions.csv`:

| DAMAGE_SubType (attack carries) | → CritDamageClass | Source justification |
|---|---|---|
| `SMASHING_MELEE`, `CONCUSSIVE`, `THROWN`, `EXPLOSION`, `SONIC`, `SLUG`, `SHRAPNEL` | **SMASHING** | CRIT TABLE Exception col lists IMPACT/EXPLOSION/SOUND/SMASHING under the smashing block; `Causes_Knockback=YES` rows in `Origin_Damage_Interactions` |
| `GUNFIRE`, `BUCKSHOT`, `ARROW`, `BOLT`, `PIERCING_MELEE` | **PIERCING** | CRIT TABLE Exception col `GUNFIRE`/`PIERCING PROJECTILE` under piercing block; these `Causes_Bleeding=YES` puncture wounds |
| `EDGED_MELEE` | **SLASHING** | CRIT TABLE Exception col `EDGED MELEE`; `Death_Visual=slash_wound` |

> **RULING CI-2 (energy/exotic damage → SMASHING crit body-effects).** The CRIT TABLE provides only three physical columns. `LASER, PLASMA, THERMAL, FIRE, ICE, PURE_ENERGY, ELECTRICAL, DISINTEGRATION, STUN` have **no body-part crit column** (they cauterize/disintegrate, per `Origin_Damage_Interactions` `Hit_Verb_Crit` = VAPORIZES/ANNIHILATES/DISINTEGRATES). On a Major with these types, **skip (B) crit-table entirely** and go straight to (D) the injury d100 (the injury table's energy-agnostic wound names apply), EXCEPT `CONCUSSIVE`/`SONIC` which the CRIT TABLE Exception col explicitly files under SMASHING (`SOUND`). This honors the source (no invented energy crit rows) while keeping the pipeline total. Consistent with Bible §5.5 "energy often ignores physical armor."

> **OWNER-FORK CI-A.** Whether to author a 4th CRIT TABLE column ("ENERGY/BURN" — cauterized bleed = none, +burning status, eye/skin scarring) is a content decision. The Exception col already *names* `ENERGY` and `ELECTROMAGETIC`, so the data hints at it, but no rows exist. Ship CI-2's fallback now; add the column later as pure data (Pillar #1) if desired.

### 4.2 The CRIT TABLE entries (verbatim, with their riders)

These are the named results per class, each carrying body-part + rider + (where listed) a `DAMAGE X` multiplier. Numbers are exactly as the CSV reads (the CSV's OCR typos `ld4`→`1d4`, `Id6`→`1d6`, `forld`→`for 1d`, `move S#ed`→`move speed`, `#nalty`→`penalty` are normalized on import — see **RULING CI-3**).

**SMASHING** (`🩸CRIT TABLE🦴.csv` rows 3–25). Body-part = inferred from name (§4.7 map).

| Entry | DAMAGE× | Rider (normalized) | Body |
|---|---|---|---|
| Bad Bruise | 1.5 | 2d6 + Strength **nonlethal** damage | torso |
| Knock Back | — | Reflex save vs. damage dealt or knocked back 5 ft | torso |
| Knock Down | — | knocked prone | torso |
| Armor Crush | — | 1 AC + armor check penalty doubled until armor repaired | torso |
| Gut Blow | — | sickened for 1d4 rounds | organ |
| Head Blow | 1.5 | stunned for 1 round | head |
| Sunder | — | normal damage to armor or shield (2 AC if unarmored) | torso |
| Gut Strike | — | nauseated for 1d6 rounds | organ |
| Arm Blow | — | weapon arm −1CS until healed | arm |
| Headstrike | — | stunned for 1d4 rounds | head |
| Dead Arm | — | weapon arm cannot be used until healed | arm |
| Knockout | — | target is unconscious | head |
| Internal Bleeding | — | 1d4 bleed (only magic healing ends) | organ |
| Kneecap | — | 1d2 Agility damage; move speed −10 ft | leg |
| Face Smash | — | 1d4 FAME damage | head |
| Temporary Amnesia | — | confused for 1d6 rounds | head |
| Minor Concussion | — | dazed 1 round, 1d4 Intelligence damage | head |
| Chest Blow | — | 1d4 Stamina damage, carry capacity halved until recovery | rib |
| Broken Jaw | — | 2d4 FAME damage, cannot speak/bite/eat solids until recovery | head |
| Major Concussion | — | stunned 1d4 rounds, 1d6 Intelligence damage | head |
| Broken Ribs | — | 1d6 Stamina drain, carry capacity halved until recovery | rib |
| Head Trauma | — | 1d6 Int damage, 1d6 Ins damage, unconscious until recovery | head |
| Major Head Trauma | 1.5 | 2d6 Int damage, 1d6 Ins damage, unconscious until recovery | head |

**PIERCING** (rows 29–46).

| Entry | Rider | Body |
|---|---|---|
| Puncture | 1d4 bleed | torso |
| Knock Back | Reflex save vs. damage dealt or knocked back 5 ft | torso |
| Knock Down | knocked prone | torso |
| Stuck Inside | weapon stuck (DC 15 Str to remove); damage can't heal until removed | torso |
| Deep Wound | 1d6 bleed | torso |
| Ugly Wound | 1d4 FAME damage | torso |
| To the Knee | 1d2 Agility damage; move speed −10 ft | leg |
| Through the Hand | 1d2 Dex damage; −2 to attack with that hand until recovery | hand |
| Arm Puncture | 1d3 Strength damage | arm |
| Leg Wound | 1d3 Strength damage; move speed −10 until recovery | leg |
| Muscle Puncture | 1d4 Strength damage | muscle |
| Organ Damage | 1d2 Con damage and 1d6 bleed | organ |
| All the Way Through | 1d2 Con damage and 2d6 bleed | torso |
| Eye Gouge | **permanently blinded one eye**; −4 sight Perception, −2 hit (−4 ranged), −2 Gaze DC | eye |
| Throat Puncture | 1d4 Con damage, 1d6 bleed, no speech/breath weapon until healed | throat |
| Punctured Skull | 1d6 Int drain | head |
| Stomach Rupture | 1d6 bleed, 1d2 Con bleed (only magic healing ends both); nauseated 1d3 hours | organ |
| Punctured Lung | 1d6 Con damage; begin drowning in 1d2 rounds (magic or DC 20 Heal ends) | organ |

**SLASHING** (rows 50–68).

| Entry | Rider | Body |
|---|---|---|
| Deep Cut | 1d4 bleed | torso |
| Knock Back | Reflex save vs. damage dealt or knocked back 5 ft | torso |
| Trip | knocked prone | torso |
| Disarm | free Disarm attempt vs. held item | hand |
| Sunder | double damage to shield / normal to armor (2 AC if unarmored) | torso |
| Deep Gash | 1d6 bleed | torso |
| Brow Gash | 1d4 bleed, **blinded while bleeding** | eye |
| Ugly Wound | 1d4 FAME damage | torso |
| Cut to the Bone | 1d4 Strength damage, 1d6 bleed | muscle |
| Muscle Cut | 1 Strength bleed | muscle |
| Hamstring | 1d6 Dex damage, move speed reduced to 10 until recovery | tendon |
| Finger Chop | **lose 1d3 fingers**; −1 Dex per 2 fingers lost | finger |
| Severed Ear | **lose ear**; −2 hearing Perception, +1 saves vs. sonic/vocal | ear |
| Eye Cut | **permanently blinded one eye**; −4 sight Perception, −2 hit (−4 ranged), −2 Gaze DC | eye |
| Artery Cut | 1d4 Con bleed | torso |
| Hand Chop | **lose hand**; −4 Dex | hand |
| Foot Chop | **lose foot**; −4 Dex, move speed halved | foot |
| Arm Chop | **lose arm above elbow**; −4 Str and Dex | arm |
| Leg Chop | **lose leg above knee**; −4 Str and Dex, move speed halved | leg |

> **RULING CI-3 (CSV is OCR-dirty → normalize on import, never at runtime).** The source CRIT TABLE contains consistent OCR corruptions (`ld`=`1d`, `Id`=`1d`, `forl`=`for 1`, `S#ed`=`speed`, `#nalty`=`penalty`, `lcvse`=`lose`, `Deep Gasg`=`Deep Gash`, `Cutto`=`Cut to`, `prmanently`=`permanently`, `ELECTROMAGETIC`=`ELECTROMAGNETIC`). Build a one-time `cleanCritTable.ts` migration that emits a clean `critTable.json`; the runtime loads the JSON. **No runtime regex.** This keeps Pillar #1 (data-driven) intact and auditable.

> **RULING CI-4 (selecting WHICH entry on a class column).** The CRIT TABLE lists entries top-to-bottom in roughly ascending severity but gives **no roll column** for the SMASHING/PIERCING/SLASHING blocks (only the deprecated *prototype* table had a `%`/`Roll` column, which §13.2 retires). Resolution: **the injury d100 (D) is the severity dial; the crit class (B) only fixes the WHICH-block and seeds the body-part.** Concretely:
> 1. Roll injury d100 first within the pipeline order shown in §2 only for *severity band*; but to name the crit entry, map the band → an index range on the chosen class column:
>    - Light/Minor band (d100 56–91) → top third of the column (bruise/knockback/cut/puncture).
>    - Moderate/Severe band (d100 19–55) → middle third (broken rib/arm puncture/deep gash/hamstring).
>    - Critical/Permanent band (d100 2–18) → bottom third (head trauma/punctured lung/limb chop/eye).
> 2. **If `trigger==='CalledShot'`**, override block-position: jump to the entry whose `Body` matches `calledShotPart` *at or below* the rolled band (you aimed, you get that part). This is why called shots maim.
>
> This is the **one** place the two tables are bound; it is a derived rule, not an invented number — it reuses the existing `Injury_System.csv` band cutoffs (rows 6–14) as the shared severity axis.

### 4.3 Embedded saves (C) — the Reflex / CON / STR checks inside crit riders

The crit riders say things like *"Reflex save vs. damage dealt or knocked back 5 ft"* and *"DC 15 Str to remove"* and *"CON check or prone."* Resolve them on the **DODGE CHART ladder** (`🦆DODGE CHART🦆.csv`), which is the game's stat→column-shift converter:

- **Reflex save** uses the **AGL** column (`🦆DODGE CHART🦆.csv` left block: AGL 1–9 None, 10–19 −2CS, … 80–99 −9CS) — for melee crits use the **AGL+INS** column (right block: 1–19 None, 20–39 −1CS, …). The "vs. damage dealt" target number is `ctx.damageDealt`: **save succeeds if `d100 ≤ (50 + saveCS×10)`** where `saveCS` is the magnitude from the ladder.
  - **RULING CI-5:** `50` is the Universal-Table Success midpoint (`Stat_Rank_Mapping.csv` `---RESULT EFFECTS---` Success = the central band; the prototype crit table row 3 reads `50 | 0-50 | Direct Hit | Nothing` — i.e. ≤50 = no special effect). Each CS = ±10 percentile (`---COLUMN SHIFT REFERENCE---` is in whole columns; 10%/CS is the standard FASERIP/4C step used across docs 20–21). No new number: 50 and 10/CS are both sourced.
- **CON check / STR check (DC N)**: convert the actor's CON/STR raw stat to its rank via `Stat_Rank_Mapping.csv`, then **pass if `d100 ≤ (rankFloorPercentile + 50)`** capped \[5,95]; a listed `DC 15`/`DC 20` adds `−(DC−10)` percentile to the threshold. The two DCs that appear (`DC 15 Str` to pull a stuck weapon, `DC 20 Heal` to stop drowning) are verbatim from the PIERCING block.

> **OWNER-FORK CI-B.** The exact save-success formula (`50 + saveCS×10`) is a reasonable Bible-consistent reading, but the owner may prefer to route *all* saves through the **Universal_Table_FIXED** lookup (doc 20) instead of a percentile shortcut, for one math path. Flagged because it touches the shared resolution engine. Default: use the shortcut above; it is mathematically identical to a single Universal-Table column read.

### 4.4 The Injury d100 roll (D) — the severity engine

`Injury_System.csv` `===INJURY TABLE===` is a **d100** table. The roll:

```
finalRoll = clamp( d100() + triggerMod + Σ resistMods , 1 , 100 )
```

**Trigger modifiers** (verbatim, `===INJURY TRIGGER CONDITIONS===` rows 83–89):

| Trigger | Modifier |
|---|---|
| Major_Success_Against_You (opp rolls 98–100) | +0 |
| Critical_Hit (natural crit) | +0 |
| Overkill_Damage (dmg > maxHP in one hit) | **−20** |
| Called_Shot_Success | **−30** |
| Falling_Damage | **−10 per 10 ft** |
| Explosion_Caught | **+10** |
| Crushing_Damage | **−15** |

(A negative modifier pushes the roll *down* toward the Fatal/Permanent end — rows 6–9 are the low numbers — so −30 called shot makes maiming far more likely. This matches the table's own ordering: row 6 Fatal=1, rows 7-14 worsen as the number drops.)

**Category bands** (verbatim, `===INJURY CATEGORIES===` rows 6–14):

| d100 | Category | Severity |
|---|---|---|
| 1 | Fatal | 10 |
| 2–9 | Permanent_Disability | 9 |
| 10–18 | Critical_Injury | 8 |
| 19–35 | Severe_Injury | 7 |
| 36–55 | Moderate_Injury | 6 |
| 56–75 | Minor_Injury | 5 |
| 76–91 | Light_Injury | 4 |
| 92–93 | Memorable_Scars | 3 |
| 94–100 | Survivability | 2 |

The **named wound row** is read directly from `===INJURY TABLE===` (rows 18–79): d100=2 → "Lose an Eye", 6 → "Lose an Arm", 21 → "Punctured Lung", 100 → "Adrenaline Rush", etc. Each row supplies `Injury_Name, Category, Effect_Description, Mechanical_Effect, Cure_Method, Duration_Untreated, Notes` — these populate the doc-108 `Injury` record fields 1:1.

> **RULING CI-6 (B seeds D, D decides severity, B wins the body-part on a called shot).** When (B) produced a *specific limb* and (D) produced a *generic* row of compatible severity (e.g. crit said "Arm Chop", d100 landed in Permanent 2–9), bind them: **the named injury row that matches the body-part takes precedence** (d100 6 "Lose an Arm" ⟵ Arm Chop). If (D) is more severe than (B)'s body-part allows (d100=1 Fatal but B was a hand crit), **(D) wins** — a freak hit to the hand can still nick an artery and kill (the table is the authority on lethality). This dual-read is the literal §5.6 sentence "crit table (what & where) → injury table (how bad & recovery)."

### 4.5 Injury resistance (the survivability dial)

`Injury_System.csv` `===INJURY RESISTANCE===` rows 93–97 (verbatim, all **add to the roll** = push *away* from Fatal):

| Source | Modifier | Gate (this doc) |
|---|---|---|
| Durability_Power | **+20** | `ctx.hasDurabilityPower` |
| Regeneration_Power | **Auto-cure between combats** | `ctx.hasRegenerationPower` → injury attached but `cureMethod='Regenerate'`, auto-clears at combat end (handed to 108) |
| Armor_DR | **+1 per 5 DR** | `Math.floor(ctx.armorDR / 5)` |
| Shield_Block | **+30 if blocked** | `ctx.shieldBlocked` |
| Defensive_Stance | **+10** | `ctx.defensiveStance` |

> **RULING CI-7 (resistance can prevent an injury entirely).** If `finalRoll ≥ 94` after resistance, the outcome is a **Survivability** row (94–100) — i.e. resistance literally converts a wound into "Exaggerated Wound / Second Wind / Adrenaline Rush." This is intended: a shield-blocked (+30), defensive-stance (+10), DR-30 (+6) tank adds +46 to the roll, all but immune to permanent injury. Matches Bible §5.6 "Shields absorb before HP" philosophy and the `===INJURY RESISTANCE===` design intent ("Resistant to permanent injury").

### 4.6 Status emissions → the I/II/III severity model

Crit riders that name a status (`sickened`, `nauseated`, `stunned`, `dazed`, `confused`, `blinded`, `prone`, `unconscious`, `bleed`) emit a `StatusEmission`. Severity tier from `😢EFFECT_STATUS😴.csv` row 1: **I = Minor (turns), II = Major, III = Critical (weeks)**.

| Crit rider phrase | status | severity | duration source |
|---|---|---|---|
| "1dN bleed" | Bleeding | I (single die) / II (with Con bleed) / III ("only magic healing ends") | dice from rider |
| "stunned for 1dN rounds" | Stunned | I | rider dice, unit rounds |
| "dazed for 1 round" | Stunned (daze) | I | 1 round |
| "nauseated/sickened 1dN" | Nauseated | I | rider dice |
| "confused 1d6 rounds" | Confused | I | 1d6 rounds |
| "knocked prone" / "Trip"/"Knock Down" | Prone | I | "1-3 seconds to stand" (`EFFECT_STATUS` row 27) |
| "unconscious until recovery" | Unconscious | III | untilRecovery |
| "blinded while bleeding" | Blind | tied to Bleeding | while bleeding |
| "permanently blinded one eye" | (permanent disability, not status) | — | handled as Injury, §4.7 |

> **RULING CI-8 (bleed stacks, burning refreshes).** Per `Origin_Damage_Interactions.csv` designer note row 91: "Bleeding from multiple sources stacks; burning does not (refreshes duration)." A second Deep Wound (1d6) on an already-bleeding unit **adds** a second `Bleeding` emission; total `bleedPerTurn` sums.

### 4.7 Name → body-part map & permanent-disability stat application

When (D) lands in **Permanent_Disability (2–9)**, the wound row's `Mechanical_Effect` is parsed into `StatPenalty[]` with `permanent:true` and attached. Verbatim from `Injury_System.csv` rows 19–26:

| d100 | Injury | bodyPart | Permanent StatPenalty (parsed) |
|---|---|---|---|
| 2 | Lose an Eye | eye | −2CS Perception(sight); −2CS ranged attacks |
| 3 | Lose Nose | nose | −1CS Charisma; −2CS Perception(smell) |
| 4 | Lose Ear | ear | −1CS Charisma; −2CS Perception(hearing) |
| 5 | Lose Teeth | teeth | −1CS Charisma checks |
| 6 | Lose an Arm | arm | no two-handed weapons; −50% carry; (dominant = extra −1CS) |
| 7 | Lose a Leg | leg | AGL DC15 or prone; half movement; cannot run |
| 8 | Lose a Hand | hand | no two-handed/bows; −1 item slot |
| 9 | Lose a Foot | foot | movement speed halved; cannot jump |

`Cure_Method` for all = "Regenerate or Prosthetic" (rows 23–26) / "Regenerate" (rows 19–22). **The recovery of these is doc 108's job** (prosthetics fitting, regeneration power, cybernetics from the tech tree). This doc only **writes** the permanent `StatPenalty[]` so they bite immediately in combat and on the world map.

> **RULING CI-9 ("CS" vs "1CS" vs raw stat damage).** The CRIT TABLE writes "−1CS / −4 Str" while `Injury_System.csv` writes "−2CS". Unify: **all permanent/long-term penalties are expressed in CS** (Bible §3.3 "Column Shift is the universal currency"). Convert any raw-stat number in the CRIT TABLE to CS via `Stat_Rank_Mapping.csv` band-width: a "−4 Str" (Arm Chop) crosses ≈2 rank bands at typical-human values → **−2CS Str** (matches the injury-table "Lose an Arm" intent). Transient *stat damage* inside a fight (e.g. "1d4 Intelligence damage" from a concussion) stays as **temporary raw-stat reduction** that heals with the injury — it is not a permanent CS. Document the conversion table in `cleanCritTable.ts`.

---

## 5. How it consumes the SPINE (country / city / personality stats)

This system honors Bible §13.9 (combined-effects must be *consumed*) in three concrete places. All driven off the **target's current sector** (`ctx.countryCode`, `ctx.cityId`).

### 5.1 Local body-armor & medevac → injury resistance (pre-roll)

A character fighting under a competent state is harder to permanently maim (better gear, faster on-scene medevac). Add a spine resistance term to (D):

```
spineResistCS = round(
    0.04 * Healthcare           // Country.Healthcare 0-100
  + 0.02 * GDPPerCaptia          // Country.GDPPerCaptia 0-100  → richer = better trauma gear
  - 0.03 * city.CrimeIndex       // Cities.CrimeIndex 0-100      → lawless = no medevac
)   // result in CS, clamp [-2, +3]
injuryRoll += spineResistCS * 10   // CS→percentile via the sourced 10/CS step (§4.3)
```

- Coefficients chosen so a top-tier Medical Center (Healthcare 85, GDP 88, Crime 10 — e.g. Norway row in `Country.csv`) ≈ **+3CS (+30)** and a failed state (Healthcare 20, GDP 20, Crime 80) ≈ **−2CS (−20)**. **RULING CI-10:** these weights derive from the *same* shape doc 108 §3.1 uses for `facilityQuality` and doc 14 (`combinedEffects.ts` Medical system = Healthcare+GDP+Lifestyle); reusing that ratio is not a new number, it is the existing Medical combined-effect read at injury-time. The owner-tunable constants live in a `spineWeights` data block (Pillar #1).

### 5.2 Permanent disability → cure availability is country-gated (post-roll, read-only here)

This system *writes* the permanent injury; whether it can ever be cured is the spine's call, **resolved by doc 108**. We only stamp the injury with the gating inputs so 108 doesn't re-derive them:

- `Cloning` column (Country.csv) → if a permanent-disability character later **dies**, can they be clone-restored (banned=permadeath, high=90%/7-day). Already in `combinedEffects.ts calculateCloningSystem` (doc 108 §2.6).
- `Science` + `Cyber`/`DigitalDevelopment` → unlocks **Cybernetic** prosthetics (the High-cost tier in `Injury_System.csv ===PROSTHETICS===`); low-Science countries cap at Modern/Basic prosthetics. (Read by 108's prosthetics fitting.)

### 5.3 Personality → who gets maimed (target-selection bias, read from doc 03)

`🎯PERSONALITY TARGET SELECTION🎯.csv` maps each of the **20 personality types** to an AI target preference (1=most health, 2=least health, 3=major threat/most damage, 4=minor threat, 5=random). This system **reads** that selection (owned by doc 03/AI) to bias *who an AI attacker called-shots*:

> **RULING CI-11 (personality drives called-shot intent).** An AI attacker whose personality preference is **2 (least health)** or **4 (minor threat)** — the "finisher/bully" profiles (types 5,6,9,18 per the CSV row mapping `…4,4,1,3,4,1,…`) — will spend the −30 called-shot penalty to **maim an already-wounded target** (aiming for an existing `bodyPart` to compound it), producing the "they went for the kill" beat. Preference **3 (major threat)** profiles called-shot the **weapon arm** of the biggest threat (disarm intent). This is a *bias flag* this system exposes; the actual target pick stays in the AI doc. Consistent with Bible §5.10 "a bully focuses the weak."

> **OWNER-FORK CI-C.** Whether *player* units can declare called shots freely, or only via a "Precision/Sniper stance" (doc 21 §5.2) or an Aim action, is a UX/balance choice. Default: called shot = **Aim (2 AP, +1CS) + declare body-part**, costing the same AP as Aim but converting the +1CS into the −30 injury-roll intent. Flagged because it sets how often maiming happens to *enemies* (fame/faction consequences in doc 17).

---

## 6. Edge cases & failure modes

| # | Case | Resolution |
|---|---|---|
| E1 | **Construct target** (Origin 9) | (A) gate: `originImmunities[9].Bleeds=NO`. Skip injury table; emit `malfunctionInstead=true` → recovery loop runs **Repair** not heal (`Origin_Damage_Interactions ===CONSTRUCT SPECIFIC EFFECTS=== Critical_Hit → Malfunction roll`). No bleed status ever. |
| E2 | **Energy-being / immune origin** for this damage type | (A) gate via `===ORIGIN EFFECT IMMUNITIES===` / `===ALIEN PHYSIOLOGY===` (e.g. Energy_Being `Bleeds=NO`, immune to physical). No crit, no injury; ticker shows a "no effect" glance line. |
| E3 | **Regeneration power** target | Injury attached but `cureMethod='Regenerate'`; auto-clears at combat end (108). It still *applies its CS penalty during the current fight* (you can hamstring a regenerator for one fight). |
| E4 | **Eye crit on a one-eyed character** (already lost the other) | Second `Lose an Eye` / `Eye Gouge` → **blind** (both eyes). RULING CI-12: stack the −2CS sight penalties; when both eyes flagged, set a `Blind` permanent condition (108) — but per §4.7 this is now a *gameplay-defining* disability; surface a hard warning in the body-map UI. |
| E5 | **Overkill + called shot stack** | Modifiers sum: −20 + −30 = −50 to the roll → almost guaranteed Fatal/Permanent. Intended (executing a downed enemy). Clamp keeps roll ≥ 1. |
| E6 | **Falling on a flyer who's at Z5** | `fallFeet` from altitude (doc 21 Z→ft) drives −10/10ft; a Z6 fall (~120 ft per doc 21) = **−120** → clamp to roll 1 = Fatal. The signature "knocked out of the sky" death. |
| E7 | **Survivability roll on a character who should be dead** (was Dying) | A 94–100 row (e.g. 99 "Unexpected KO", 100 "Adrenaline Rush") **overrides Dying**: instant stabilize per the row's `Mechanical_Effect`. This is the comeback mechanic; do not suppress it. |
| E8 | **No crit-table column for the damage type** (LASER etc.) | CI-2 fallback: skip (B), run (D) only. `critEntryName='—'`, `bodyPart='torso'` unless called shot specified one. |
| E9 | **Called-shot part the body doesn't have** (target has no arms / is a swarm) | If `calledShotPart` not in target's body model, **demote to a generic Major** (trigger mod +0, no part override). Log a designer warning. |
| E10 | **Memorable_Scars (92–93) on a Construct** | Row 93 "Impressive Scar (Armor)" applies (armor battle damage = +1CS Intimidation); row 92 (body scar) demotes to 93 for constructs (no flesh). RULING CI-13. |
| E11 | **Dirty CSV value fails to parse** | Import-time `cleanCritTable.ts` must hard-fail the build if any `Mechanical_Effect` doesn't parse to a known dice/CS/status token — never ship a silent no-op crit. (Pillar #1 auditability.) |
| E12 | **Bleed on a target with no Bleeds origin but riders say bleed** | (A) already gated; if origin `Bleeds=NO`/`PARTIAL`, downgrade bleed to **cosmetic** (Construct sparks) or **half** (Tech Enhancement PARTIAL, row 9) per origin table — no HP loss. |
| E13 | **Two-handed-weapon user loses an arm mid-mission** | `Lose an Arm` writes "cannot use two-handed weapons"; doc 21 must re-validate the equipped weapon at next action → auto-unequip to sidearm or fists. This doc emits the flag; the grid enforces it. |

---

## 7. UI / UX hooks

### 7.1 Combat overlay (the tactical grid — doc 21 symbolic style)

- **Crit ticker line** (`CritOutcome.tickerLine`): one line in the combat log, format `{verb-glyph} {critEntryName} → {short rider}`. The verb-glyph comes from `Origin_Damage_Interactions Hit_Verb_Crit` (e.g. EDGED_MELEE crit = "CLEAVES", GUNFIRE = "TEARS THROUGH"). Example: `⚔ CLEAVES → Hamstring → move 10, 1d6 Dex`.
- **Body-map flag** (`CritOutcome.bodyMapFlag`): a small persistent **body-part glyph** pinned to the unit token (eye-patch glyph, sling glyph, peg-leg glyph). Symbolic, no model. Hover → tooltip with the active `StatPenalty[]`.
- **Save prompt micro-popups** (C): "Reflex save vs. 14 → FAILED → knocked back 5 ft" as a transient toast tied to the knockback animation (doc 21 owns the knockback move).
- **Called-shot reticle**: when a player declares a called shot (CI-C), show a body-part selector (head/torso/arm/leg) with the **−30 injury intent** and the **−CS to-hit** trade clearly labeled, so the player knows they're choosing to maim at a cost.

### 7.2 World-map / strategic layer

- Wounded units carry their body-map flags onto the **squad roster** and **world map token** (a unit limping out of a sector shows the injury glyph). Drives the player to route them to a hospital sector (the spine pull — doc 108).
- A **permanent disability** raises a roster badge that never clears until cured (regeneration/prosthetic), making the loss legible across the whole campaign.

### 7.3 Phone / laptop

- **Injury arrives as content** (Bible §7): a Permanent_Disability or Fatal result fires:
  - an **email** to the player ("Field report: Agent ▮▮ lost her left eye in Karachi") — hands to doc 10 email/news.
  - a **personnel-sheet** update (doc 06/07) with the new `StatPenalty[]` and a "Treatment options" CTA that deep-links to the Hospital activity (108).
- **Obituary hook**: a Fatal result (d100=1) writes the cause-of-wound into `DyingState.causeOfWound`, surfaced in the funeral/obituary (existing `deathConsequences.ts`, via 108).

### 7.4 News / fame (doc 17 handoff, not owned here)

- Maiming an enemy (player-initiated called shot that lands a Permanent_Disability) **emits a fame/legal event** (doc 17 `Public_Perception`): brutal vigilantism = fame/legal delta. This system only **emits the event payload** `{ kind:'maim', attackerId, targetId, bodyPart }`; doc 17 prices it.

---

## 8. Integration points (reads / writes)

| Direction | System / doc | Contract |
|---|---|---|
| **READS** | doc 20 (4CS resolution) | the **Major** band result + `damageDealt`; never re-rolls to-hit |
| **READS** | doc 21 (tactical grid) | the `CritTrigger` (Major/CalledShot/Overkill/Falling/Crush/Explosion) + `calledShotPart` + `fallFeet`; net-CS context |
| **READS** | doc 07 (character model) | `targetOrigin`, raw CON/STR/AGL/INS, dominant-arm flag, body model, `hasDurability/RegenerationPower`, `armorDR` |
| **READS** | doc 03 / AI | personality target-selection bias for called-shot intent (CI-11) |
| **READS** | spine: `Country.csv` (Healthcare, GDPPerCaptia, Science, Cloning), `Cities.csv` (CrimeIndex) | §5.1 resistance, §5.2 cure-gating |
| **WRITES** | **doc 108** (recovery loop) | the resolved `Injury` record (108 §2.1 schema), `malfunctionInstead`, `fatal`→`DyingState` seed. **The primary output.** |
| **WRITES** | doc 21 §5.7 / status engine | `StatusEmission[]` (Bleeding/Stunned/Prone/Blind/Nauseated/Unconscious) + `knockbackFeet` |
| **WRITES** | doc 10 (email/news), doc 06/07 (personnel) | injury-arrival content payloads (§7.3) |
| **WRITES** | doc 17 (fame/legal) | `maim` event payload on player-initiated permanent disability (§7.4) |
| **WRITES** | combat log (doc 21 / doc 103 audio) | `tickerLine` + a hit-verb voice/SFX cue (`Origin_Damage_Interactions Sound_Cue`) |

---

## 9. RULING: notes (collected)

- **CI-1** Single entry point `resolveCritInjury()`; doc 20/21 never apply injuries directly. (Bible §13.2)
- **CI-2** Energy/exotic damage types (LASER/PLASMA/FIRE/ICE/PURE_ENERGY/ELECTRICAL/DISINTEGRATION/STUN) have no crit-table column → skip (B), run (D) only; CONCUSSIVE/SONIC route to SMASHING per the Exception col.
- **CI-3** CRIT TABLE CSV is OCR-dirty → normalize once at import into `critTable.json`; no runtime regex.
- **CI-4** Injury d100 is the severity dial; crit class fixes the block & seeds body-part; band→column-third index; called shot overrides position.
- **CI-5** Save threshold = `50 + saveCS×10` (50 = Success midpoint per prototype row3 + `RESULT EFFECTS`; 10/CS = the standard step used in docs 20–21).
- **CI-6** B seeds D; D decides severity; the body-part-matching injury row wins ties; D wins on lethality.
- **CI-7** Resistance (Durability/Shield/DR/Stance) can lift the roll into Survivability — wounds become comebacks.
- **CI-8** Bleed stacks; burning refreshes (per `Origin_Damage_Interactions` note).
- **CI-9** Permanent penalties expressed in CS (universal currency); transient stat-damage stays raw; conversion table in `cleanCritTable.ts`.
- **CI-10** Spine resistance weights reuse the existing Medical combined-effect ratio (Healthcare+GDP+Lifestyle / doc 14), not new numbers.
- **CI-11** Personality preference (2/4 = finisher, 3 = disarm) drives AI called-shot intent; actual target pick stays in AI doc.
- **CI-12** Stacking eye losses → Blind permanent condition with hard UI warning.
- **CI-13** Construct on a body-scar row demotes to armor-scar (no flesh).

## 10. OWNER-FORK: notes (collected)

- **CI-A** Whether to author a 4th "ENERGY/BURN" CRIT TABLE column (data hints at it via `ENERGY`/`ELECTROMAGNETIC` in the Exception col; no rows exist). Ship CI-2 fallback now.
- **CI-B** Route embedded saves through `Universal_Table_FIXED` for one math path vs. the percentile shortcut. Default: shortcut (mathematically identical to one column read).
- **CI-C** Player called-shot UX: free declaration vs. Aim/Sniper-stance-gated. Default: Aim (2 AP) + declare body-part. Sets how often the player maims enemies (fame/faction cost, doc 17).
- **CI-D** Severity of the maiming-fame penalty in doc 17 (is hamstringing a terrorist "brutal"?). This doc emits the event; the *price* is the owner's to set in `Public_Perception`.

## 11. Open questions

1. **Body model granularity.** Doc 108's `Injury.bodyPart` is a narrow union (`eye|arm|leg|hand|foot|nose|ear|teeth|spine|organ|head`); this doc's `BodyPart` is wider (adds `finger|throat|rib|muscle|tendon|torso`). Confirm whether 108 should widen to match, or this doc narrows on attach (§4.7 currently narrows). **Recommend:** widen 108 once, since the CRIT TABLE genuinely produces fingers/throat/tendon.
2. **Dominant-arm tracking.** "Lose an Arm" gives an extra −1CS if it's the dominant arm (`Injury_System.csv` row 23 Notes). Does the character model (doc 07) store handedness? If not, RULING: assume right-dominant unless flagged left.
3. **Called shots vs. flight.** Can you called-shot a flyer's wing to ground them? The CRIT TABLE has no "wing"; doc 21's flight is an integer, not anatomy. **Recommend** OWNER-FORK: a called shot to "leg/foot" of a flyer forces an altitude check (emergency descent) rather than adding a wing part — reuses existing systems.
4. **Multiplayer (deferred).** When the Time-Walker dimension MP slots in (Bible §11), do permanent disabilities transfer across the dimensional save? Out of scope now; the `Injury` record is serializable, so it will.
5. **Mental crits.** CON/INT/INS "drain" appears in crit riders (Punctured Skull = 1d6 Int drain) but there is no *mental* crit column. Confirm these stay as transient stat-damage (CI-9) and don't create a permanent "brain damage" disability, or whether a Severe head-trauma chain (multiple Major Head Traumas) should escalate to one. **Recommend:** keep transient now; revisit if playtest shows head-spam.
