# 24 — Status Effects: Severity Tiers, Durations, Treatment

> **System owner doc.** Build-ready spec for the **status-effect catalog and runtime engine**: the severity tiers (I/II/III), the per-turn / per-day mechanical effects, the duration & tick model, the application gates (who can be afflicted), stacking rules, and the **treatment ladder** that links each effect back to the recovery loop.
>
> **Status:** Build-ready spec (v1.0)
>
> **Primary source tables** (open these first):
> - `docs/csv-source-data/Status_Effects_Complete.csv` — the full catalog: 70 effect rows, each with `Severity_Level`, `Duration_Type`, `Duration_Value`, `Gameplay_Effect`, `Movement_Penalty`, `Action_Penalty`, `Recovery_Method`, `Medical_Treatment`, `Clone_Required`, `Description`, `Prerequisites`. **(canonical numbers live here)**
> - `SuperHero Tactics/Combat Compendium REAL - 😢EFFECT_STATUS😴.csv` — the design-intent notes: severity legend (`I, II, III = Minor, Major, Critical`), turns-vs-weeks duration note, the Stamina thresholds for Exhausted/Tired, the Frozen strength-rank rule, Mind-Control "player controls enemy unit," the `Animated` (Tech-Zombie) note.
>
> **Secondary / cross-reference tables** (all under `docs/csv-source-data/` unless noted):
> - `Game_Mechanics_Spec/Universal_Table_FIXED.csv` — outcome bands (Failed/Minor/Success/Major) that **trigger** status application; `===RESULT EFFECTS===` (`Minor … may still apply status`, `Major … bonus effects: knockback stun etc.`).
> - `Game_Mechanics_Spec/Injury_System.csv` — `===MEDICAL TREATMENT===` (First_Aid / Field_Surgery / Hospital_Care / Magical_Healing / Regenerate / Clone_Replacement), `===RECOVERY TIMES===`, `===INJURY RESISTANCE===` (Durability/Regeneration/Defensive-Stance). The **status treatment ladder maps onto these exact tiers** (shared with spec 108).
> - `Game_Mechanics_Spec/Origin_Damage_Interactions.csv` — `===ORIGIN EFFECT IMMUNITIES===` (Bleeds/Burns/Freezes/Stuns/Poisons/EMP_Vulnerable per origin) and `===CONSTRUCT SPECIFIC EFFECTS===`. **The application gate for every effect.**
> - `SuperHero Tactics/Combat Compendium REAL - 🔪DAMAGE TYPE TABLE🔫.csv` + `Origin_Damage_Interactions.csv` `===DAMAGE TYPE EFFECTS===` — which **damage sub-type** rolls which status (`Causes_Bleeding`, `Causes_Burning`, `Causes_Freezing`).
> - `SuperHero Tactics/Combat Compendium REAL - 🩸CRIT TABLE🦴.csv` — crit results that **name statuses** (stunned/dazed/nauseated/sickened/confused/unconscious/blinded) with their round counts.
> - `Game_Mechanics_Spec/Country_Attribute_Effects.csv`, `City_Type_Effects.csv`, `Culture_Region_Effects.csv` — the **spine**: Healthcare/Cloning/Science bands and city/crime modifiers that decide how fast a status is treated, and where treatment even exists.
> - `Game_Mechanics_Spec/Stat_Rank_Mapping.csv` — the rank ladder (Feeble…Beyond) used by the **Frozen** strength-rank check and the Choke stamina clock.
>
> **Sibling docs this spec hands off to (does NOT re-own):**
> - **`108-hospital-cloning-recovery-loop.md`** owns the *strategic-layer recovery* of the medical & meta conditions (Dying→Dead→Cloning, Hospitalized/Critical/Stable/Quarantined, injury recovery clocks). This doc owns the **in-combat catalog and tick engine**; it produces the condition records that 108 consumes. The `TreatmentTier` enum and `HealthCondition` type are **shared** with 108 (defined once, §2.4).
> - **`21-tactical-combat-grid.md`** owns the grid/AP/altitude skeleton and exposes `statusFlags` on `CombatUnit`. This doc defines what populates that set and how each flag restricts movement/modes.
> - **`20-core-resolution-4cs.md`** owns the Universal-Table roll. This doc defines the **application roll** that piggybacks on it (a Minor/Major outcome → status application, §5).
> - The damage-types doc (sibling, in progress) owns the 30+ damage-type riders; this doc owns the **status objects** those riders instantiate.
>
> **Bible rulings honored:** §5.7 (status catalog = severity tiers I/II/III + treatment tiers time→first-aid→hospital→advanced→power), §13.2 (one crit→injury pipeline — statuses applied by crits route through that, not a parallel system), §13.8 (no XP; recovering from a status never levels anyone), §13.9 (combined-effects must be *consumed* — Healthcare/Cloning bands actually change status duration here), §5.5 (origin damage interactions gate effects), §3.3 (`Universal_Table_FIXED` outcome bands), §11 (time-travel is the only save; an untreated status that kills is permanent).
>
> **Scope (locked).** This doc owns: the **status enum & catalog**, **severity-tier numbers** (duration, HP/turn, CS penalties, movement penalties), the **tick/duration engine**, the **application gate** (origin immunities + resist roll), **stacking/refresh rules**, the **treatment ladder mapping**, and the **UI surfaces** for statuses (combat overlay badges, phone roster condition list, hospital triage). It does NOT own: the recovery-clock simulation on the strategic layer (108), the grid/AP rules (21), the resolution roll (20), the wrestling state machine that *produces* the hold statuses (sibling wrestling doc — this doc only defines the resulting Pinned/Choked/Grappled/limb statuses), or the injury d100 table (108/Injury_System). Per Bible §5, combat systems are specced **lighter** than the spine — but the status catalog is large, so this doc is the index that keeps it data-driven.

---

## 1. Overview & player fantasy

A hit is rarely *just* damage. A status effect is the **memory of a hit** — the thing that follows a character off the grid, into the inbox, into the hospital, and sometimes into an obituary. This system is what makes "she got shot" different from "she got shot in the artery and bled out in the ambulance because you were standing in a failed state with no hospital."

The player fantasy, by layer:

- **In combat (symbolic grid):** statuses are **glyph badges** on a unit token — a red drip for Bleeding, a flame for Burning, a "Zzz" for Stunned, a snowflake for Frozen. You read a tile and instantly know "that enemy is Frightened and fleeing, ignore him; that ally is Choked and has two turns before he's out — go cut him loose." Severity is color-coded (I yellow / II orange / III red). Statuses are *tactical objects you create and remove* — you Stun to buy a turn, you set Burning to deny a tile, you Choke to end a fight without a kill.
- **On the phone/laptop (the meta-game):** statuses are the **condition column on your roster**. A merc tagged *Radiation Sickness II* or *Memory Loss I* or *Diseased III* is a logistics problem — who covers their slot, where do you fly them to treat it, can you afford the hospital. The world reaches in: the **same status heals in days in a high-Healthcare nation and rots for weeks in a poor one** (§7). This is the spine made personal.
- **Across the campaign:** an untreated status is a clock. *Bleeding III* and *Poisoned III* read `Until treated` — ignore them and the character dies (→ 108's Dying/Dead/Cloning loop). *Frightened* and *Berserk* turn a teammate against the plan for a few turns. *Aged* and *Memory Loss III* are character-altering, near-permanent, comic-book consequences. **Death matters, and so does almost-death.**

**One-line pitch:** *Every effect is a small living clock attached to a character — color-coded on the grid, tracked on the phone, and ticking faster or slower depending on the country you're standing in.*

---

## 2. Data schema (fields / types)

All names are TypeScript-flavored; a coder implements directly. New module: `MVP/src/data/statusEffects.ts`. The catalog is a **data table** (Bible Pillar #1) — `STATUS_CATALOG` is generated/seeded from `Status_Effects_Complete.csv`, not hand-coded per effect.

### 2.1 Severity tier

> Source: `EFFECT_STATUS😴.csv` row 1 — **`I, II, III = Minor, Major, Critical`**. `Status_Effects_Complete.csv` `Severity_Level` column uses exactly `I` / `II` / `III` for tiered effects, `None` for single-tier effects, and the literal strings `Variable` (Drug Influenced/Enhanced) and `Rapid` (Aged).

```ts
type SeverityTier =
  | 'I'    // Minor
  | 'II'   // Major
  | 'III'  // Critical
  | 'None' // single-tier effect (most CC and meta effects)
  | 'Variable' // Drug Influenced / Drug Enhanced (set at application)
  | 'Rapid';   // Aged
```

### 2.2 Duration model

> Source: `Status_Effects_Complete.csv` `Duration_Type` + `Duration_Value`, and `EFFECT_STATUS😴.csv` row 1 note ("specifies if an effect will last turns or weeks").

```ts
type DurationType =
  | 'Turns'      // tactical rounds (in-combat tick)
  | 'Hours'      // strategic-layer game-hours (Tired/Exhausted/Drugs/Power Drained)
  | 'Days'       // strategic-layer (Diseased/Radiation/Sickness/Memory Loss I)
  | 'Weeks'      // strategic-layer (Radiation II/III, Diseased III, Memory Loss II)
  | 'Instant'    // resolves in 1 action (Prone)
  | 'Special'    // 'Until awakened' / 'Until reunited' (Unconscious/Sleep/Soul Separated)
  | 'Permanent'; // Dead / Cloned / Memory Loss III

// Duration_Value is one of: a number, the string 'Until treated',
// 'Until <X>' (escaped/released/healed/reset/awakened/reunited), or 'Variable'.
type DurationValue = number | 'UntilTreated' | 'UntilEscaped' | 'UntilReleased'
  | 'UntilHealed' | 'UntilReset' | 'UntilAwakened' | 'UntilReunited'
  | 'Variable' | 'Permanent';
```

> **RULING SE-1 (resolve `Variable` & `Until treated` at application time).** Several rows carry `Variable` or `Until treated` (e.g. Mind Controlled, Blind, Power Dampened, Bleeding III). The engine must turn these into a concrete tick count when the status is **applied**, so the tick loop never has to special-case strings:
> - `'UntilTreated'` / `'UntilHealed'` / `'UntilReset'` / `'UntilReleased'` / `'UntilEscaped'` / `'UntilAwakened'` / `'UntilReunited'` → `remaining = Infinity`; the status only ends when its **`recoveryEvent`** fires (treatment applied, hold released, escape roll won, etc. — §6.3). It never decrements on its own.
> - `'Variable'` duration on a **power-applied** effect (Mind Controlled, Blind, Power Dampened, Power Drained) → `remaining =` the **applying power's `effectDuration` rank value** in turns (from `Power_Attack_Stats.csv`, owned by the powers/BAMPI doc). If no power supplies it, fall back to the tier default in §4. **RULING, consistent with Bible §5.12** (powers carry their own duration).

### 2.3 Treatment ladder (shared enum with spec 108)

> Source: `Status_Effects_Complete.csv` `Recovery_Method` + `Medical_Treatment` columns, mapped onto `Injury_System.csv` `===MEDICAL TREATMENT===` tiers. The two source columns are collapsed into the **single canonical ladder** below so combat and hospital share one vocabulary.

```ts
// Identical to TreatmentTier in 108-hospital-cloning-recovery-loop.md §2.2.
type TreatmentTier =
  | 'None'             // 'Time' / 'Rest' columns; effect runs its natural duration
  | 'Rest'             // 'X hours rest' (Tired/Exhausted), 'Bed rest'
  | 'FirstAid'         // 'First Aid', 'Bandages and antiseptic' — 2 AP, Medicine DC10
  | 'FieldSurgery'     // 'Medical treatment required' in-field — duration ×0.5, Medicine DC15
  | 'HospitalCare'     // 'Hospital visit', 'Hospital detox', 'Extended hospital stay' — duration ×0.25
  | 'AdvancedMedical'  // 'Intensive care', 'Quarantine', 'Bone marrow transplant', 'Life support'
  | 'MagicalHealing'   // healing power — cure moderate/minor instantly
  | 'Regenerate'       // Regeneration power — cures permanent/limb effects (Bible §5.6)
  | 'CloneReplacement' // Clone_Required = Yes/Possible/Complete (handoff to 108 cloning)
  | 'PowerSpecific';   // 'Remove dampener', 'Quantum stabilization', 'Time correction', etc.
```

### 2.4 Health-condition handle (shared with 108)

```ts
// 108 owns the strategic-layer recovery sim for these; this doc populates them.
type HealthCondition =
  | 'Bleeding' | 'Poisoned' | 'Diseased' | 'RadiationSickness' | 'Sickness'
  | 'Frightened' | 'Panicked' | 'Berserk' | 'Psychotic' | 'MindControlled'
  | 'Charmed' | 'Confused' | 'Stunned' | 'Dazed' | 'Unconscious' | 'Dying' | 'Dead'
  | 'Exhausted' | 'Tired' | 'Paralyzed' | 'Sleep' | 'Frozen' | 'Burning' | 'Prone'
  | 'Blind' | 'Deaf' | 'Mute' | 'DrugInfluenced' | 'DrugEnhanced'
  | 'Shrunk' | 'Gigantic' | 'Invisible' | 'Intangible' | 'Aged' | 'TimeDisplaced'
  | 'RealityPhased' | 'QuantumUnstable' | 'SoulSeparated' | 'MemoryLoss'
  | 'PowerDampened' | 'PowerDrained' | 'PowerOverloaded' | 'Cloned'
  | 'Hospitalized' | 'CriticalCondition' | 'StableCondition' | 'Quarantined'
  | 'CyberneticRejection' | 'TemporalEcho'
  | 'Pinned' | 'Choked' | 'ArmDamaged' | 'LegDamaged' | 'ShoulderDamaged'
  | 'Crushed' | 'Dislocated' | 'ArmsPinned' | 'Grappled'
  | 'Animated'; // Tech-Zombie (EFFECT_STATUS😴.csv row "Animated")
```

### 2.5 Catalog row (one per `Status_Effects_Complete.csv` line)

```ts
interface StatusDef {
  condition: HealthCondition;
  tier: SeverityTier;                 // Severity_Level
  durationType: DurationType;
  durationValue: DurationValue;
  // Parsed mechanical effect (§4 tables):
  hpPerTurn: number;                  // negative = damage/turn (Bleeding/Poison/Burning); 0 default
  hpPerTurnEscalates: boolean;        // Burning & Choked: increases each turn (§4.5)
  statPenalties: StatPenalty[];       // -1CS Constitution, -2CS all rolls, etc.
  movePenalty: MovePenalty;           // None | -N | 'Halved' | 'Immobile' | 'CrawlOnly' | 'Random' | '+N'
  actionPenalty: ActionPenalty;       // see §4.3
  controlLoss: ControlLoss;           // who drives the unit this turn (§4.4)
  recovery: TreatmentTier;            // primary Recovery_Method tier
  medicalTreatment: TreatmentTier;    // the Medical_Treatment column tier
  cloneFlag: 'No' | 'Possible' | 'Yes' | 'Complete'; // Clone_Required
  ticksOn: 'combat' | 'strategic' | 'both'; // where its duration decrements (§3)
  prerequisites: string;              // Prerequisites column (damage type / source gate)
  description: string;
  stackRule: StackRule;               // §6.1
  visualGlyph: string;                // combat overlay badge (§8.1)
}

interface StatusInstance {           // a live status on a character
  def: StatusDef;
  remaining: number;                  // turns OR game-days, per durationType; Infinity for Until* (SE-1)
  appliedTier: SeverityTier;          // concrete tier chosen at application
  stacks: number;                     // Bleeding stacks (§6.1)
  turnsElapsed: number;               // for escalating effects (§4.5)
  sourceId?: string;                  // attacker/controller (for Mind Controlled, Charmed, holds)
  appliedDamageType?: DamageSubType;  // which sub-type rolled it (origin-immunity audit)
  treatedTier: TreatmentTier;         // best treatment applied so far ('None' default)
}

type StackRule = 'Stack' | 'RefreshDuration' | 'EscalateTier' | 'Exclusive';
type ControlLoss = 'None'|'FleeFromSource'|'RandomMove'|'AttackNearest'
  |'AttackFixedTarget'|'EnemyControls'|'CannotActWillful'|'Immobile';
type MovePenalty =
  | { kind:'None' } | { kind:'Flat', sq:number }   // sq<0 penalty, sq>0 bonus (Berserk +1)
  | { kind:'Halved' } | { kind:'Immobile' } | { kind:'CrawlOnly' }
  | { kind:'Random' } | { kind:'PhaseThrough' };
interface StatPenalty { stat: string; cs: number; scope?: 'physical'|'all'|'sight'|'audio'|'mental'|'specificLimb'; }
type ActionPenalty =
  | { kind:'None' } | { kind:'CS', cs:number, scope:string }
  | { kind:'LoseTurnChance', pct:number }   // Sickness 25%/50%
  | { kind:'OneActionOnly' } | { kind:'CannotAct' } | { kind:'EscapeOnly' }
  | { kind:'CannotUseSkills' } | { kind:'NoArmActions' } | { kind:'CannotAttackSource' };
```

---

## 3. Where a status ticks (combat clock vs strategic clock)

A status's `durationType` decides which clock decrements it (Bible §11: world runs ~1 real-day : 30 game-days; tactical runs in rounds).

| `durationType` | Clock | Decrement point | Examples |
|---|---|---|---|
| `Turns` | **Tactical round** | End-of-round bookkeeping (spec 21 §2.2 Phase-2 footer: *"status ticks (sibling)"* — that hook is THIS engine) | Bleeding, Burning, Stunned, Frozen, Frightened, Berserk |
| `Hours` | **Strategic game-clock** | Per game-hour tick on the world layer | Tired (4h), Exhausted (8h), Drug Influenced/Enhanced, Power Drained |
| `Days` / `Weeks` | **Strategic game-clock** | Per game-day tick (handoff to 108 recovery sim) | Diseased, Radiation Sickness, Sickness III, Memory Loss |
| `Instant` | Tactical | Resolves the action it's applied in | Prone (1 action to stand) |
| `Special` / `Permanent` | **Event-driven** | Only its `recoveryEvent` (§6.3) | Unconscious, Sleep, Soul Separated, Dead, Cloned |

> **RULING SE-2 (a Turns-status that survives combat).** If combat ends while a `Turns` status with `remaining > 0` is still active (e.g. Bleeding II with 2 turns left when the last enemy drops), convert remaining turns to strategic time at **1 combat-turn ≈ 6 seconds** (Bible §5.1 round ≈ a few seconds; FIST GDD treats a round as a short real interval) and **escalate the bleed/poison/burn to its strategic recovery clock**. Practically: a unit that leaves the grid still *Bleeding II* arrives at the strategic layer carrying the `Bleeding` `HealthCondition` and must be treated (handoff to 108). This is the bridge that makes "she bled out in the ambulance" possible. **RULING — no source number for the 6s, labeled as a ruling; the only load-bearing fact is that the status persists, not the exact seconds.**

---

## 4. Exact numbers / tables / formulas — the catalog

Every number below is transcribed from `Status_Effects_Complete.csv` (cited by row content) or `EFFECT_STATUS😴.csv`. Where the CSV says "Variable" or omits a number, the cell is marked and a RULING supplies a default consistent with the Bible.

### 4.1 Medical / damage-over-time suite (severity-tiered I/II/III)

> All values verbatim from `Status_Effects_Complete.csv`. `hpPerTurn` is the "Lose N health per turn" figure. CS penalties from `Action_Penalty`/`Gameplay_Effect`. `Clone_Required` from that column.

| Condition | Tier | Duration | HP/turn | Stat / action penalty | Move | Recovery → Medical | Clone | Prereq |
|---|---|---|---|---|---|---|---|---|
| **Bleeding** | I | 3 Turns | −5 | −1CS physical actions | None | First Aid → Bandages+antiseptic | No | Physical damage |
| | II | 5 Turns | −10 | −2CS physical actions | −1 | Medical required → Hospital | No | Major physical |
| | III | Until treated | −20 | −3CS all actions | −2 | Emergency medical → Surgery | **Possible** | Critical physical |
| **Poisoned** | I | 6 Turns | −3 | −1CS Constitution; −1CS all rolls | None | Time/antidote → Basic antidote | No | Poison exposure |
| | II | 10 Turns | −8 | −2CS Constitution; −2CS all rolls | −1 | Antidote/medical → Hospital detox | No | Major poison |
| | III | Until treated | −15 | −3CS Constitution; −3CS all actions | −2 | Immediate medical → Intensive care | **Possible** | Severe poison |
| **Diseased** | I | 7 Days | 0 | −1CS affected stats (daily roll) | None | Time/medical → Basic care | No | Disease exposure |
| | II | 14 Days | 0 | −1CS all stats daily; −2CS all actions | None | Medical → Extended hospital | No | Major disease |
| | III | Until treated (Weeks) | 0 | −2CS all stats daily; −3CS all actions | −1 | Advanced → Quarantine+ICU | **Yes** | Critical disease |
| **Radiation Sickness** | I | 5 Days | 0 | Nausea; −1CS Constitution; intermittent action loss | None | Rad-away/time → Radiation tx | No | Radiation exposure |
| | II | 3 Weeks | 0 | Hair loss; −2CS Constitution & Stamina; −2CS physical | None | Medical → Extended tx | No | Major radiation |
| | III | Until treated (Weeks) | 0 | Organ failure; −3CS all physical stats; −3CS all actions | −2 | Advanced → Bone-marrow transplant | **Yes** | Critical radiation |
| **Sickness** | I | 3 Days | 0 | −1CS to **2 random stats**; **25%** lose-turn | None | Rest/basic → Bed rest | No | Natural causes |
| | II | 7 Days | 0 | −2CS to **3 random stats**; **50%** lose-turn | None | Medical → Hospital | No | Major illness |
| | III | Until treated (Weeks) | 0 | −3CS all stats; cannot take strenuous actions | −1 | Intensive → Life support | **Possible** | Critical illness |

> **Bleeding stacks** (multiple sources accumulate) — `Origin_Damage_Interactions.csv` `===DESIGNER NOTES===`: *"Bleeding from multiple sources stacks."* **Burning does not** (refreshes) — same note. See §6.1.
> **Disease vs Virus speed** — `DAMAGE TYPE TABLE🔫.csv` rows 33–34: *Virus* clears "quicker than Diseases"; *Disease* clears "much slower than Virus." RULING SE-3: model Virus as `Diseased` with `durationValue ×0.5` (rounded down) and the `appliedDamageType='VIRUS'` flag; Disease uses the table value as-is.

### 4.2 Crowd-control / mental suite (single-tier, `Turns`)

| Condition | Duration | Effect | Move | Action | Control | Recovery → Medical | Source/Prereq |
|---|---|---|---|---|---|---|---|
| **Frightened** | 5 | Must move away from fear source | −2 | Cannot attack fear source | FleeFromSource | Remove fear source → Counseling | Fear effect |
| **Panicked** | 3 | Random movement; no planned actions | Random | Cannot coordinate w/ team | RandomMove | Time/calming → Sedatives | Extreme fear |
| **Berserk** | 4 | Must attack **nearest** target (ally or enemy) | **+1** | Cannot use skills/tactics | AttackNearest | Restraint/KO → Sedatives | Mental manipulation |
| **Psychotic** | 6 | Attack one **random enemy** until it's dead/incap | Normal | Cannot switch targets | AttackFixedTarget | Restraint/KO → Psychiatric | Mental breakdown |
| **Mind Controlled** | Variable | Enemy controls all actions (*player controls the enemy unit* — `EFFECT_STATUS😴.csv` row) | EnemyControls | EnemyControls | EnemyControls | Break controller concentration → Deprogramming | Psychic attack |
| **Charmed** | 10 | Friendly to source; won't attack them; −2CS vs source | Normal | CannotAttackSource | None | Distance/dispel → Therapy | Supernatural influence |
| **Confused** | 4 | **50%** chance of random action each turn | Normal | LoseTurnChance 50 (random act) | None | Time/clarity → Psych eval | Mental attack |
| **Stunned** | 2 | Cannot act but aware | Immobile | CannotAct | CannotActWillful | Time/stimulant → Stimulants | Physical shock |
| **Dazed** | 3 | One action/turn; −2CS all rolls | Halved | OneActionOnly | None | Time/aid → Basic medical | Head trauma |
| **Paralyzed** | 5 | Cannot move or take physical actions | Immobile | No physical actions | None | Time/medical → Nerve stimulation | Nerve damage/toxin |
| **Frozen** | 3 | Immobile **unless STR exceeds freeze rank**; physical at −3CS; unit is blind | Immobile | −3CS physical | Immobile | Heat/superior STR → Warming | Cold exposure |
| **Burning** | 4 | **Increasing** fire damage each turn; can spread to others | Normal | −1CS concentration | None | Stop-drop roll / water → Burn tx | Fire exposure |
| **Blind** | Variable | Cannot target visually; −4CS sight-based actions | Halved | −4CS sight actions | None | Restore sight/adapt → Eye tx | Blindness (flashbang per `EFFECT_STATUS`) |
| **Deaf** | Variable | Cannot hear; **immune to sonic attacks** | Normal | −2CS audio perception | None | Restore hearing → Hearing tx | Deafness |
| **Mute** | Variable | Cannot speak; no verbal powers/commands | Normal | No verbal abilities | None | Restore speech → Throat tx | Throat damage |
| **Prone** | Instant (1 action to stand) | −2CS ranged **defense**; **+2CS melee defense** when down | CrawlOnly | Standing = 1 action | None | Stand-up action → None | Knockdown |

> **Frozen STR check** (`EFFECT_STATUS😴.csv` rows 22–24): the unit breaks free if *"Unit's strength exceeds Freeze rank"* OR *"An attack of a higher rank hits."* RULING SE-4: each turn, roll the unit's **STR rank** (`Stat_Rank_Mapping.csv`) vs the **freeze rank** (the applying power's rank); STR rank ≥ freeze rank → auto-break, status ends. A heat/fire damage-type hit of rank ≥ freeze rank also ends it immediately.
> **Burning escalation** + **spread** (`Status_Effects_Complete.csv` Burning + `DAMAGE TYPE TABLE` *"fire deals a constantly increasing amount of damage"*): see §4.5.
> **Mind Controlled = player drives the enemy** (`EFFECT_STATUS😴.csv` row 26: *"Player controls Enemy Unit"*). On the player's controlled unit this means the *enemy AI* drives it. The `sourceId` is the controller; status ends when the controller's concentration breaks (took damage past CON check, KO'd, or out of range — handoff to powers doc).

### 4.3 Unconscious / dying / death / fatigue suite

| Condition | Duration | Effect | Recovery → Medical | Clone |
|---|---|---|---|---|
| **Unconscious** | Special (Until awakened) | No actions; **all defenses −3CS** | External awakening/time → Medical exam | No |
| **Dying** | Variable | Lose consciousness; **death saves each turn** | Medical intervention → Emergency medicine | **Yes if death occurs** |
| **Dead** | Permanent | No actions; ghost/spirit form possible | Resurrection/cloning → Morgue | **Yes** |
| **Sleep** | Special (Until awakened) | Unconscious; only others can wake (`EFFECT_STATUS😴.csv` row 21) | External awakening → Wake stimulants | No |
| **Exhausted** | 8 Hours | −2CS all actions; movement halved | 8h rest → Stimulants (short) | No |
| **Tired** | 4 Hours | −1CS all actions | 4h rest → Caffeine/stimulants | No |

> **Exhausted/Tired thresholds** (`EFFECT_STATUS😴.csv` rows 16–17): **Exhausted = <20% Stamina**, **Tired = <50% Stamina**. RULING SE-5: these are **auto-applied/cleared** by the engine off the live `currentStamina / maxStamina` ratio at end-of-round (combat) and per game-hour (strategic), *not* rolled. They are the only statuses with a continuous trigger. Health = `STA×2 + STR` (Bible §3.1); the % is of the stamina pool, not health.
> **Dying → death saves**: 3 failures = `Dead`; handoff to **108** for the death-save formula, Adrenaline-Rush auto-stabilize (`Injury_System.csv` d100=100), and the funeral/cloning branch. This doc only *applies* `Dying` when HP ≤ 0.

### 4.4 Wrestling-hold suite (produced by the wrestling state machine — sibling doc — this doc defines the resulting status)

> Source: `Status_Effects_Complete.csv` rows 63–71. Holds tick on the **tactical clock** and end on a `recoveryEvent` (escape/release roll, owned by the wrestling doc).

| Condition | Duration | Effect | Action restriction | Prereq |
|---|---|---|---|---|
| **Pinned** | Until escaped | Immobilized by grappler | Escape attempts only | Wrestling Pin Hold |
| **Choked** | Until released | **−1CS cumulative per turn; unconscious after 3–4 turns** | Increasing penalty/turn | Choke hold |
| **Grappled** | Until escaped | In grappling combat; limited options | Grappling actions only | Grapple initiated |
| **Arms_Pinned** | Until released | Cannot use arms for any action | No arm actions | Crucifix-type hold |
| **Arm_Damaged** | Until healed | −2CS MEL with affected arm | −2CS MEL actions | Arm-lock submission |
| **Leg_Damaged** | Until healed | −2 movement per leg damaged | −2CS AGL actions | Leg-lock submission |
| **Shoulder_Damaged** | Until healed | −2CS with arm; can't lift heavy | −2CS arm actions | Kimura/Americana |
| **Crushed** | Until released | **Internal damage continues after release; −2CS all** | −2CS all actions | Crushing Hold (STR 50+) |
| **Dislocated** | Until reset | **−3CS all actions** (extreme pain) | −3CS all actions | Critical submission failure |

> **Choke clock** (`Status_Effects_Complete.csv` Choked): cumulative −1CS/turn, KO after 3–4 turns. RULING SE-6: KO turn = **`clamp(round((targetStamina_rank_value)/10), 3, 4)`** — a higher-Stamina target lasts 4 turns, lower lasts 3. On the KO turn apply `Unconscious`. Uses `Stat_Rank_Mapping.csv` rank value. The −1CS is cumulative (`stacks++` each turn, §6.1).
> **Crushed STR 50+ gate** = Amazing rank (`Stat_Rank_Mapping.csv`: 51–75 Amazing; row says STR 50+). The "internal damage continues after release" = a **lingering** sub-status: when Crushed's hold ends, spawn a 3-turn `Bleeding I`-equivalent internal DOT. RULING SE-7 (no explicit number; reuses Bleeding I −5/turn for consistency).

### 4.5 Escalating-DOT formula (Burning, Choked)

> `Status_Effects_Complete.csv` Burning = *"Increasing fire damage each turn"*; `DAMAGE TYPE TABLE` = fire/thermal *"constantly increasing amount of damage."* No explicit per-turn number exists.

> **RULING SE-8 (Burning escalation).** Burning has no base HP/turn in the CSV. Canonical:
> ```
> burnDamage(turn) = BURN_BASE + (turnsElapsed × BURN_STEP)
> BURN_BASE = 5   // matches Bleeding I −5/turn floor (Status_Effects_Complete.csv)
> BURN_STEP = 3   // matches CRIT TABLE / throwing "momentum +3/square" cadence
> ```
> Turn 1 = 5, turn 2 = 8, turn 3 = 11, turn 4 = 14 (4-turn duration). **Spread:** at end of each Burning turn, each adjacent flammable tile/unit (origin `Burns=YES`, §5.2) rolls the **application gate** (§5) to catch Burning at turn-0. Burning **refreshes** rather than stacks (origin notes). Stop-drop-roll (a 2-AP action) or entering a water tile ends it (`Recovery_Method`).
> **Choked** escalation is linear −1CS/turn (the CSV's own "cumulative per turn"), no SE-8 needed.

### 4.6 Meta / exotic suite (strategic-layer; mostly handed to 108)

> `Status_Effects_Complete.csv` rows 39–62. These rarely fire in tactical combat; they are roster-level conditions. Numbers verbatim where present; `Variable` resolved per SE-1.

| Condition | Duration | Key effect | Recovery → Medical | Clone |
|---|---|---|---|---|
| **Drug Influenced** | Hours, Variable | Temporary stat **decreases** (`EFFECT_STATUS😴`: "Need match length") | Time/medical → Detox | No |
| **Drug Enhanced** | Hours, Variable | Temporary stat **increases** w/ side effects & crash | Time/crash → Medical monitoring | No |
| **Shrunk** | 10 Turns | +2CS dodge melee; **−2CS dodge ranged** | Dispel/time → Size restoration | No |
| **Gigantic** | 10 Turns | −1CS dodge; **+2CS melee damage**; structural issues | Dispel/time → Size restoration | No |
| **Invisible** | Variable | Cannot be targeted visually; **+3CS stealth/surprise** | Dispel/concentration loss → None | No |
| **Intangible** | Variable | Immune to physical; cannot touch physical | Concentration → None | No |
| **Aged** (Rapid) | Days, Variable | Stats decrease over time | Time reversal/medical → Age regression | **Yes** |
| **Memory Loss** | I 7 Days / II 4 Weeks / III Permanent | I −2CS knowledge; II −3CS all knowledge; III full amnesia | Therapy → Psych / Long-term care | III **Possible** |
| **Power Dampened** | Variable | LSW abilities **−50%** | Remove dampener → Power-restoration tx | No |
| **Power Drained** | Hours, Variable | LSW abilities **fully unavailable** | Time/restoration → Energy restoration | No |
| **Power Overloaded** | Variable | Powers fire **randomly** | Power-control training → Medical stabilization | **Possible** |
| **Cloned** | Permanent | New body, prior memories; full capability | — → Clone adjustment therapy | **Complete** |
| **Hospitalized / Critical / Stable / Quarantined** | Days, Variable | Facility-bound recovery states | (108 recovery sim) | varies |
| **Cybernetic Rejection** | Weeks, Variable | Implants cause immune response; tech malfunctions | Immunosuppressive → Cyber surgery | **Possible** |
| **Time Displaced / Reality Phased / Quantum Unstable / Temporal Echo / Soul Separated** | Special/Variable | Temporal/dimensional disruption | Power-specific stabilization | varies |
| **Animated** (Tech-Zombie) | Special | *"Was dead. Just wants to eat the non-tech-based units"* (`EFFECT_STATUS😴` row 5) | — (enemy state) | No |

> **Animated** is an **NPC enemy state**, not a player debuff: a reanimated unit that ignores Construct/Tech-origin targets and pursues organic units. RULING SE-9: treat as `controlLoss = AttackNearest` filtered to **non-Construct, non-Tech-Enhancement** origins (origin IDs 4 & 9 excluded as targets, `Origin_Damage_Interactions.csv`). Owner-fork below (whether to ship zombies at all).

---

## 5. Application gate — who can be afflicted, and the application roll

A status is **not** auto-applied on a hit. Two gates, in order:

### 5.1 Origin immunity gate (hard gate)

> Source: `Origin_Damage_Interactions.csv` `===ORIGIN EFFECT IMMUNITIES===` + `===CONSTRUCT SPECIFIC EFFECTS===` + designer note *"Always check origin.bleeds before applying bleeding status."*

```
function canApply(effect, target):
  switch effect.family:
    Bleeding:  origin.bleeds  in {YES, USUALLY, PARTIAL, ICHOR, SPECIES} → allowed
               origin.bleeds == NO (Construct, Energy_Being, Silicon-Based) → BLOCKED → cosmetic "Sparking"
    Burning:   origin.burns; Construct → "Overheating" (same DOT, smoke not flame)
    Freezing(Frozen): origin.freezes
    Stun:      origin.stuns
    Poison(Poisoned/Diseased/Radiation by biology): origin.poisons; Construct/Cosmic/Divine → BLOCKED
    EMP/Power(Power Drained via EMP): origin.emp_vulnerable (Construct & Tech YES)
```

Per-origin truth table (verbatim from CSV, origin IDs 1–9):

| Origin | Bleeds | Burns | Freezes | Stuns | Poisons | EMP-vuln |
|---|---|---|---|---|---|---|
| 1 Skilled Human | YES | YES | YES | YES | YES | NO |
| 2 Altered Human | USUALLY | YES | YES | YES | VARIES | NO |
| 3 Mutant | USUALLY | YES | YES | YES | VARIES | NO |
| 4 Tech Enhancement | PARTIAL | YES | YES | YES | PARTIAL | **YES** |
| 5 Mystic | USUALLY | YES | YES | YES | VARIES | NO |
| 6 Alien | SPECIES | SPECIES | SPECIES | YES | SPECIES | NO |
| 7 Cosmic | RARELY | VARIES | VARIES | VARIES | NO | NO |
| 8 Divine | ICHOR | VARIES | RARELY | RARELY | NO | NO |
| 9 Construct | **NO** | PARTIAL | YES | YES | **NO** | **YES** |

> **RULING SE-10 (resolve the fuzzy gate words to probabilities).** The CSV uses words, not numbers. Canonical mapping, applied as a pre-roll: `YES=100%`, `USUALLY=75%`, `PARTIAL=50%`, `SPECIES`/`VARIES`=look up the unit's `Alien_Physiology`/alteration record if present else `50%`, `ICHOR=100%` (cosmetic gold blood, same mechanics — designer note), `RARELY=15%`, `NO=0%`. Construct + Bleeding → 0% but show **Sparking** (`===CONSTRUCT SPECIFIC EFFECTS===`); Construct + EMP → Stunned + damage; Construct + Poison → immune.

### 5.2 Damage-type → status mapping

> Source: `Origin_Damage_Interactions.csv` `===DAMAGE TYPE EFFECTS===` (`Causes_Bleeding`/`Causes_Burning`/`Causes_Freezing`/`Causes_Knockback`) + `DAMAGE TYPE TABLE🔫.csv`.

```
EDGED_MELEE / PIERCING_MELEE / GUNFIRE / BUCKSHOT / SLUG / SHRAPNEL / ARROW / BOLT → Causes_Bleeding=YES
SMASHING_* / EXPLOSION / SONIC / CONCUSSIVE / THROWN → Causes_Knockback (Bleeding=NO)
LASER / PLASMA / THERMAL / FIRE → Causes_Burning=YES
ICE → Causes_Freezing=YES
ELECTRICAL → Causes_Burning=CHANCE; +damage & Stun vs Construct/robot (DAMAGE TYPE TABLE row 26)
STUN → applies Stunned; LASER (low intensity) → Blind (DAMAGE TYPE TABLE row 28)
ACID → "affects armor, biological and non" → applies Poisoned-equiv + armor-DR erosion
```

### 5.3 The application roll (piggybacks on the Universal Table)

> Source: `Universal_Table_FIXED.csv` `===RESULT EFFECTS===` — *Minor: "may still apply status"*; *Major: "bonus effects (knockback stun etc.)"*. The attack already rolled an outcome band (spec 20); status application reads that band — it does **not** roll a second d100 for whether-to-apply.

```
on attack outcome:
  Failed  → no status
  Minor   → status applies at tier I  (or its single tier) IF origin gate passes
            (CSV: "may still apply status" — a glancing hit gives the floor tier)
  Success → status applies at the damage-type's nominal tier (I/II/III per source/power)
  Major   → status applies at +1 tier (cap III) AND the crit/injury pipeline fires (Bible §13.2)
```

> **RULING SE-11 (tier from outcome, not invented).** The CSV gives I/II/III by *damage magnitude* ("Minor cuts" = I, "Serious wounds" = II, "Arterial/Critical" = III) but never the trigger threshold. Canonical: Minor→I, Success→source's nominal tier (default I unless the weapon/power declares II/III), Major→nominal+1 capped at III. This is the only place tier is chosen and it is fully deterministic. **Resist:** a target may negate via `Injury_System.csv` `===INJURY RESISTANCE===` analogues — **Defensive Stance −1 applied tier**, **Durability power −1 tier**, **Regeneration auto-clears DOT effects between combats** (those rows are reused, not invented).

---

## 6. Edge cases, stacking, failure modes

### 6.1 Stacking & refresh (`StackRule`)

| Rule | Applies to | Behavior |
|---|---|---|
| `Stack` | **Bleeding**, **Choked** | New instance adds; `hpPerTurn` sums (Bleeding I + Bleeding I = −10/turn); Choked `stacks++` adds −1CS each. (Origin note: *"Bleeding from multiple sources stacks."*) |
| `RefreshDuration` | **Burning**, **Poisoned**, most DOT | Re-application resets `remaining` to max, does **not** sum damage. (Origin note: *"burning does not [stack]; refreshes duration."*) |
| `EscalateTier` | tiered medical effects via Major (§5.3) | Re-applying Bleeding I with a Major → promote to Bleeding II (cap III). |
| `Exclusive` | mutually-exclusive control states | A unit cannot be both `Stunned` and `Berserk`; the **newer/higher-severity** wins; the displaced one is dropped. Exclusive groups: {Stunned, Dazed, Unconscious, Sleep, Paralyzed, Frozen}; {Frightened, Panicked, Berserk, Psychotic, MindControlled, Charmed, Confused}; {Shrunk, Gigantic}. |

### 6.2 Conflicting effects & precedence

- **Unconscious / Sleep / Dead** override all action-granting statuses (a Berserk unit that gets KO'd stops attacking; the Berserk instance is suspended, not cleared, and resumes if awakened with `remaining` intact).
- **Dead** clears every other status except `Cloned`/`SoulSeparated` (which are the *replacements* for being Dead).
- **Frozen** sets the unit **blind** (per `EFFECT_STATUS😴` rows 22–23) — apply a derived `Blind` while Frozen is active; remove it when Frozen ends.
- **Intangible** suppresses all *physical* DOT (Bleeding/Burning) but not *mental/temporal* (MindControlled/TimeDisplaced) — physical statuses pause (don't tick) while Intangible, resume after.
- **Charmed + Berserk** on the same unit: Berserk's "attack nearest" wins over Charm's "won't attack source" for nearest=source — RULING SE-12: Berserk (rage) overrides Charm (affection); the unit attacks even the charmer. Flag for narrative VO.

### 6.3 Recovery events (what ends `Until*` statuses)

| Until-value | Ends when |
|---|---|
| `UntilTreated` | A treatment of ≥ the effect's `medicalTreatment` tier is applied (§7) |
| `UntilReleased` / `UntilEscaped` | Wrestling escape/release roll won (handoff to wrestling doc) |
| `UntilHealed` | Limb injury healed via Hospital/Regenerate (handoff to 108) |
| `UntilReset` | Dislocated joint reset (painful) — a First-Aid-tier action |
| `UntilAwakened` | Another unit spends an action to wake (Sleep/Unconscious), or timer (Unconscious 1d4 hours per `Injury_System` d100=99) |
| `UntilReunited` | Soul restoration (power-specific) |

### 6.4 Failure modes (engine-level, must be handled)

1. **Status applied to immune origin** → silently swap to cosmetic (Sparking/Overheating) and **do not** add a tick (Construct never bleeds out). Log for QA so balance can see "this enemy is bleed-immune."
2. **Infinite `remaining` never resolved** → a roster character stuck on `Bleeding III` (`UntilTreated`) the player ignores **will die** when the strategic bleed clock zeroes their HP (correct, intended; surface a phone alert at <25% HP).
3. **Tier promotion past III** → clamp; a III hit on an already-III effect refreshes duration, never creates "IV."
4. **Random-stat effects** (Sickness I/II "−1CS to N random stats") → roll the random stat set **once at application**, store it on the instance, so it doesn't re-randomize every tick (would be exploitable/confusing).
5. **Control-loss on an already-acted unit** → if Mind Controlled/Berserk applied after the unit's turn this round, it takes effect **next** initiative pass (no double turn).
6. **Stamina-auto statuses fighting the player** (Exhausted/Tired) → these are recomputed each tick from the stamina ratio; if the player rests to >50% the Tired status auto-clears mid-clock. They must never be "stuck on."

---

## 7. How this consumes the SPINE (country / city / culture)

This is the §13.9 "combined-effects must be consumed" mandate, made concrete: **the same status heals at different speeds depending on where the character is.** The status object is identical; the *treatment effectiveness* and *treatment availability* are spine-driven.

### 7.1 Healthcare band → treatment-tier availability & speed

> Source: `Country_Attribute_Effects.csv` `Healthcare` row — Low(0-35): *"−2CS medical cover; +3CS disease investigations"*; High(66-100): *"+2CS medical methods; faster healing; cloning possible."* And the `Injury_System.csv` recovery multipliers (`Field_Surgery` ×0.5, `Hospital_Care` ×0.25).

```
hospitalTier(country):                      // best treatment a character can RECEIVE here
  Healthcare 0-35  → max tier = FirstAid     // no real hospital; DOT effects often run untreated
  Healthcare 36-65 → max tier = HospitalCare
  Healthcare 66-100→ max tier = AdvancedMedical (and Cloning if Cloning band allows)

treatmentDurationMult(tier):                // applied to a status's remaining days (Days/Weeks effects)
  None=1.0  Rest=1.0  FirstAid=0.75  FieldSurgery=0.5  HospitalCare=0.25  AdvancedMedical=0.15
// Injury_System ===RECOVERY TIMES===: Hospital ≈ 1/4 base; Field ≈ 1/2; AdvancedMedical RULING SE-13
// = 0.15 (faster than hospital, for ICU/transplant), consistent with the descending ladder.

healSpeedCS(country):                        // extra speed from Healthcare High "faster healing"
  Healthcare 66-100 → ×0.85 on top (the "+2CS medical / faster healing" line)
```

So **Bleeding III (`Until treated`)** in a Healthcare-66+ Medical Center is stabilized by `AdvancedMedical` in hours; the **same wound in a Healthcare-0-35 failed state** caps at `FirstAid` (stop the bleed but the underlying Severe injury runs its `2d8 weeks` clock — handoff to 108). The geography decides who you can save.

### 7.2 Cloning band → which `Clone_Required` statuses are recoverable

> Source: `Country_Attribute_Effects.csv` `Cloning` row — 0-35: *"LSW death permanent in this country"*; 36-65: *"50% resurrection; 30-day"*; 66-100: *"90% resurrection; 7-day."*

Statuses with `cloneFlag` ∈ {Yes, Possible, Complete} (Bleeding III, Poisoned III, Diseased III, Radiation III, Dying-on-death, Dead, Aged, Memory Loss III, Power Overloaded, Cybernetic Rejection) are only fully recoverable where Cloning ≥ band; otherwise they resolve to **permadeath / permanent condition** (handoff to 108). **This is the literal consumption: the `Clone_Required` column on every status row is read against the standing country's `Cloning` stat.**

### 7.3 City type + crime → local treatment friction

> Source: `City_Type_Effects.csv` — `Resort`/`Educational` host hospitals (population rating scales equipment); `===CITY TYPE + POPULATION TYPE===` (Village −2CS resources … Mega City +3CS resources); `===CITY TYPE + CRIME INDEX===` (Very High crime −3CS legal methods → hospitals harder to reach).

```
effectiveTreatmentTier = min( hospitalTier(country),
                              capByPopRating(city.popRating) )   // Village caps at FirstAid; MegaCity uncapped
treatmentReachable = crimeIndex < 80                            // Very-High-crime: -3CS legal → may have to treat off-grid
```

### 7.4 Culture / origin affinity → which statuses are common (event-gen feed)

> Source: `Culture_Region_Effects.csv` `LSW_Power_Affinity` (e.g. region 10 Eastern Europe *"Winter; Nuclear; Psychic"* → Frozen/Radiation/MindControl more common), `Origin_Damage_Interactions.csv` immunities. This feeds the **event/encounter emergence engine** (spec 02): a Radiation-Sickness outbreak template is far likelier in a Nuclear-affinity region near an exclusion-zone terrain; a Frozen-heavy enemy pack near Winter-affinity. Status frequency is **spine-parameterized**, not flat.

### 7.5 Spine consumption summary (the contract)

| Spine input | Status output it changes | Source cell |
|---|---|---|
| `Healthcare` band | max receivable `TreatmentTier`; duration multiplier; heal-speed | `Country_Attribute_Effects.csv` Healthcare |
| `Cloning` band | whether `Clone_Required` statuses are recoverable vs permanent | `Country_Attribute_Effects.csv` Cloning |
| `Science` band | unlocks `AdvancedMedical` / cures for exotic (Quantum/Temporal) statuses | `Country_Attribute_Effects.csv` Science |
| `city.popRating` | caps treatment tier (Village→FirstAid) | `City_Type_Effects.csv` population table |
| `city.crimeIndex` | gates whether a hospital is reachable (≥80 = off-grid only) | `City_Type_Effects.csv` crime table |
| `culture.LSW_Power_Affinity` | which statuses appear in encounters (event-gen) | `Culture_Region_Effects.csv` |
| `origin.*` immunities | hard application gate (§5.1) | `Origin_Damage_Interactions.csv` |

---

## 8. UI / UX hooks

### 8.1 Combat overlay (symbolic grid, spec 21)

- Each `CombatUnit` token shows up to **3 status badges** stacked at its corner; overflow → "+N" pip with a hover/long-press list. Glyphs (single char / emoji, matching the symbolic art direction):
  - Bleeding 🩸 (badge count = stacks), Burning 🔥, Frozen ❄️, Poisoned 🟢, Radiation ☢️, Stunned 💫, Dazed 😵, Prone ⬇️, Blind 🚫👁, Frightened 😱, Berserk 😡, Charmed 💗, MindControlled 🌀, Paralyzed 🪢, Choked 🫁, Grappled 🤼, Unconscious 💤.
- **Severity color ring** around the badge: I = yellow, II = orange, III = red (`EFFECT_STATUS😴` legend Minor/Major/Critical).
- **Escalating effects** (Burning, Choked) show a **countdown number** = turns until KO / next damage step.
- **Control-loss statuses** recolor the unit's selection ring (e.g. MindControlled enemy under your control gets the player-team ring) so the tactical read is instant.

### 8.2 Phone / laptop roster (Personnel app, Bible §7.3)

- Roster row shows a **condition chip** per active strategic status: `Radiation II · 12d` (tier + remaining). Tap → detail card: effect text, treatment needed, **where the nearest country/city that can treat it is** (computed via §7), ETA via travel system (spec 05).
- **Priority alert** (red flag, Bible §7.1 email-priority parity) when any roster member is on an `UntilTreated` lethal status (Bleeding/Poisoned III) or below 25% HP — pushed as an inbox item so ignoring it is a *choice*.

### 8.3 Hospital triage screen (handoff to 108)

- Triage list sorts wounded by **lethality clock** then **treatability here**. Each shows the status stack and a one-tap "Admit → `<TreatmentTier>`" gated by §7.1/§7.3. Greyed-out tiers show *why* ("Requires Healthcare 66+ — nearest: …").

### 8.4 Tooltips everywhere read from the catalog

The same `StatusDef.description` / mechanical fields drive: combat badge tooltip, roster chip detail, hospital triage, and the email/news flavor when a status drives a story beat ("your hero is in critical condition"). **One catalog, every surface** (data-driven, Pillar #1).

---

## 9. Integration points (reads / writes)

| Direction | System | Contract |
|---|---|---|
| **reads** | `20-core-resolution-4cs` | the attack outcome band (Failed/Minor/Success/Major) → §5.3 application |
| **reads** | damage-types doc + `Origin_Damage_Interactions.csv` | which sub-type causes which status; origin immunity gate (§5) |
| **reads** | wrestling doc | produces hold statuses (Pinned/Choked/limb) → §4.4 instantiates them; escape rolls fire their recoveryEvent |
| **reads** | powers/BAMPI doc (`Power_Attack_Stats.csv`) | `Variable`-duration power effects supply `effectDuration` (SE-1) |
| **reads** | spine (`Country/City/Culture_*` effects) | treatment tier/speed/availability + encounter frequency (§7) |
| **writes** | `21-tactical-combat-grid` | populates `CombatUnit.statusFlags`; movement/mode/action restrictions per §4 |
| **writes** | `108-hospital-cloning-recovery-loop` | persistent `HealthCondition` records + lethal/Clone_Required flags at extraction (SE-2) |
| **writes** | `02-event-emergence-engine` / `10-email-news` | status milestones (hero critical / cured / died) → news & priority email |
| **writes** | `03-personality-relationships` | a teammate Berserk-attacking an ally, or dying, feeds the relationship/morale system |
| **writes** | `17-fame-reputation-legal` | civilian Burning-spread / collateral statuses feed reputation deltas |

---

## 10. RULING notes (collected)

- **SE-1** Resolve `Variable`/`Until treated` to concrete tick counts at application; `Until*`→`remaining=Infinity`, ends only on recoveryEvent; power-applied `Variable`→power's `effectDuration`.
- **SE-2** A `Turns` DOT that outlives combat persists to the strategic layer as its `HealthCondition` (1 turn ≈ 6s ruling for the conversion; the load-bearing fact is persistence).
- **SE-3** Virus = `Diseased` with duration ×0.5 (vs Disease); per DAMAGE TYPE TABLE "quicker than Diseases."
- **SE-4** Frozen breaks when unit's STR rank ≥ freeze rank, or a heat hit of rank ≥ freeze rank lands.
- **SE-5** Exhausted (<20% STA) / Tired (<50% STA) are auto-applied/cleared from the live stamina ratio, not rolled.
- **SE-6** Choke KO turn = `clamp(round(targetStaminaRankValue/10),3,4)`; −1CS cumulative until then, then Unconscious.
- **SE-7** Crushed's "internal damage after release" = a 3-turn Bleeding-I-equivalent DOT (reuses −5/turn).
- **SE-8** Burning DOT = `5 + turnsElapsed×3` (BURN_BASE 5 from Bleeding I; BURN_STEP 3 from momentum cadence); refreshes, spreads via the application gate.
- **SE-9** Animated/Tech-Zombie is an NPC enemy state: AttackNearest filtered to non-Construct/non-Tech origins.
- **SE-10** Fuzzy immunity words → probabilities: YES=100, USUALLY=75, PARTIAL=50, RARELY=15, NO=0, ICHOR=100 (cosmetic), SPECIES/VARIES=lookup-or-50.
- **SE-11** Tier from outcome band: Minor→I, Success→nominal, Major→nominal+1 (cap III); Defensive Stance/Durability −1 tier, Regeneration clears DOT between combats.
- **SE-12** Berserk overrides Charm when nearest target = the charmer.
- **SE-13** `AdvancedMedical` duration multiplier = 0.15 (faster than Hospital 0.25), extending the Injury_System ladder downward.

## 11. OWNER-FORK notes

- **OWNER-FORK A — Tech-Zombies / `Animated`.** `EFFECT_STATUS😴.csv` row 5 floats "Tech Zombies?!" as an open idea ("Was dead. Just wants to eat the non-tech-based units"). Shipping a reanimation/horde enemy state is a **product/tone decision** (does SHT want a zombie faction?). Spec'd as SE-9 so it *can* exist, but gated behind owner approval — it changes the game's tone and the enemy roster.
- **OWNER-FORK B — Drug Enhanced as a player tool.** `Drug Enhanced` (temporary stat *increase* with a crash) could be either purely an enemy/NPC effect or a **consumable the player buys** (ties to black-market spine, spec 14). Whether players can dope their own mercs (and the addiction/relationship fallout, Bible §1 pillar 2) is an owner call.
- **OWNER-FORK C — Permanent-status leniency.** Memory Loss III / Aged / lost-limb are near-permanent. Owner decides how generous the "miracle cure" path is (Science-66+ research project? rare item? Time-Walker rewind only?) — this trades roster attrition tension against player frustration.
- **OWNER-FORK D — Status visibility on enemies.** Whether the player sees *enemy* status durations/tiers exactly (full info) or fogged ("looks badly burned") is a difficulty/UX fork; the data supports both (§8.1 badges can be exact or vague).

## 12. Open questions

1. **Exact freeze/dampen ranks** — `Frozen` and `Power Dampened` reference an applying power's rank, but `Power_Attack_Stats.csv`/the powers doc must publish each power's `effectRank` and `effectDuration` before SE-1/SE-4 are fully numeric. Tracked against the powers/BAMPI sibling.
2. **Death-save formula** — `Dying` applies here but the 3-strikes death-save math + Adrenaline-Rush auto-stabilize lives in 108/`Injury_System`. Confirm the shared boundary (this doc applies `Dying`; 108 resolves it).
3. **Sonic immunity from Deaf** — `Deaf` grants "immune to sonic attacks." Confirm with the damage-types doc that SONIC/ULTRASONIC sub-types check the `Deaf` flag (a rare beneficial-status interaction).
4. **Per-turn real-time length** — SE-2's 1-turn≈6s is a ruling; if the tactical layer later fixes a canonical round length (FIST GDD hints but doesn't state one), update the conversion.
5. **Stacking cap** — should Bleeding stacks be uncapped (theoretically −5×N/turn) or capped (e.g. ×5)? No source number; left uncapped pending playtest, flagged for balance.
