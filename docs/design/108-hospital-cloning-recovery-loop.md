# 108 — Hospital, Death & Cloning Recovery Loop

> **System owner doc.** Build-ready spec for the single recovery pipeline that handles: a downed character → Dying → death-saves → permadeath, and the **Hospital** activity (heal / injury / disease / mental / terminal) plus **Cloning** as the country-gated resurrection hook.
>
> **Source-of-truth tables** (all under `docs/csv-source-data/`):
> - `Game_Mechanics_Spec/Injury_System.csv` — crit→injury d100, death-save modifiers, recovery times, treatment tiers, prosthetics, clone replacement. **(primary)**
> - `Status_Effects_Complete.csv` — Dying / Dead / Cloned / Hospitalized / Critical Condition / Stable Condition / Quarantined / Memory Loss / Cybernetic Rejection, with `Clone_Required` flags and treatment columns. **(primary)**
> - `Game_Mechanics_Spec/Country_Attribute_Effects.csv` — Cloning band (0-35/36-65/66-100), Healthcare band, "Medical Center" combo. **(spine)**
> - `Daily_Activity_Framework.csv` — ACT_005 Medical Treatment, ACT_029 Physical Recovery, ACT_030 Mental Recovery (the Hospital activity).
> - `Time_Management.csv` — Status_Injured / Status_Hospitalized / Status_Dead, 1 real-day : 30 game-day ratio.
> - `Game_Mechanics_Spec/City_Type_Effects.csv` — population/crime modifiers that scale local hospital quality.
> - `Game_Mechanics_Spec/Research_Projects.csv` — TREE_MED nodes (Basic_Medical → Neuro_2), the buildable medical/cloning tech path.
> - `Public_Perception.csv` / `Result_Templates.csv` — Team_Member_Death reputation, Memorial Service template.
> - World Bible `Country.csv` columns: `Healthcare`, `Science`, `GDPNational`, `GDPPerCaptia`, `Lifestyle`, `LawEnforcement`, `Cloning`, `LSWRegulations`.
> - Existing code this spec **extends, does not replace**: `MVP/src/data/deathConsequences.ts` (funerals/morale/family), `MVP/src/data/combinedEffects.ts` (`calculateCloningSystem`), `MVP/src/components/HospitalScreen.tsx`.
> - Bible rulings honored: §5.6 (one crit→injury pipeline), §6.1/§8 (combined-effects must be consumed), §13.2 (one crit path), §13.9 (consume combined-effects), §11 (time-travel is the only save — death is otherwise permanent), §4 (no XP; recovery doesn't level anyone).

---

## 1. Overview & player fantasy

Combat is one verb; **consequence is the point.** When a hero drops, the question the game asks is not "reload?" (the only reload is the Time Walker, §11 of the Bible — expensive and sanity-costed) but **"can I save them, and what will it cost?"** This system is the answer surface.

The loop, from the player's seat:

1. A character hits **0 HP in tactical combat** → status `Dying`. They make **death saves each turn** (`Status_Effects_Complete.csv` row `Dying`). A teammate with First Aid, a healing power, or simply ending the fight can stabilize them. Three failures = `Dead`.
2. Survivors are extracted to the **strategic layer wounded**, carrying real `Injury_System.csv` injuries (broken ribs, lost eye, ruptured aorta) and `Status_Effects_Complete.csv` conditions (Bleeding III, Diseased, Radiation Sickness, Memory Loss, Critical Condition).
3. On the **laptop/phone**, the player sends them to the **Hospital activity** (`ACT_005` Medical Treatment / `ACT_029` Physical Recovery / `ACT_030` Mental Recovery). The hospital they reach is **only as good as the country/city they're standing in** — that is the spine. A wounded merc in a high-Healthcare Medical Center heals in days; the same merc in a failed state rots for weeks or dies of an untreated infection.
4. If a character **dies**, the only non-Time-Walker return is **Cloning** — and cloning is **country-gated** (`Cloning` column). Banned country → permadeath, funeral, obituary (handoff to existing `deathConsequences.ts`). High-Cloning Medical Center → 90% resurrection in 7 days with full memory transfer. In between, you gamble: 50% resurrection, 30-day wait, possible defect/memory-loss clone.

The fantasy: **your roster is mortal, the world's geography decides who you can save, and bringing someone back is a fraught, expensive, slightly-wrong miracle** — exactly the JA2-merc-death + comic-book-resurrection tone the Bible asks for (§1 pillar 2, §12).

---

## 2. Data schema (fields / types)

All new types live in a new module `MVP/src/data/recoverySystem.ts`. It **reuses** `DeathRecord`/`FuneralOption`/`MoraleEffect` from `deathConsequences.ts` and `CloningSystem` from `combinedEffects.ts` rather than redefining them.

### 2.1 Injury record (from `Injury_System.csv`)

```ts
type InjuryCategory =
  | 'Fatal'              // d100 = 1
  | 'Permanent_Disability' // 2-9
  | 'Critical_Injury'   // 10-18
  | 'Severe_Injury'     // 19-35
  | 'Moderate_Injury'   // 36-55
  | 'Minor_Injury'      // 56-75
  | 'Light_Injury'      // 76-91
  | 'Memorable_Scars'   // 92-93
  | 'Survivability';    // 94-100

interface Injury {
  id: string;
  d100Roll: number;            // the roll that produced it (1-100)
  name: string;                // e.g. "Punctured Lung" (Injury_System.csv col Injury_Name)
  category: InjuryCategory;
  mechanicalEffect: string;    // CS penalties as a parsed list (see §4.6)
  csPenalties: StatPenalty[];  // parsed from Mechanical_Effect (e.g. -2CS ranged)
  bleedPerTurn: number;        // 0 unless Notes says "Bleeds N damage/turn"
  cureMethod: 'Rest'|'First Aid'|'Medicine'|'Magical healing'|'Regenerate'|'Prosthetic'|'Resurrection';
  // Recovery clock, RESOLVED to game-days at injury time (see §4.4)
  baseDurationDays: number;    // rolled from Injury_System "===RECOVERY TIMES==="
  remainingDays: number;       // ticks down with the time engine
  treatedTier: TreatmentTier;  // best treatment currently applied
  permanent: boolean;          // Permanent_Disability & Memorable_Scars
  bodyPart?: 'eye'|'arm'|'leg'|'hand'|'foot'|'nose'|'ear'|'teeth'|'spine'|'organ'|'head';
}

interface StatPenalty { stat: string; cs: number; note?: string; }
```

### 2.2 Treatment tier (from `Injury_System.csv` `===MEDICAL TREATMENT===` + `===RECOVERY TIMES===`)

```ts
type TreatmentTier =
  | 'None'           // no care; Duration_Untreated applies
  | 'Rest'           // short/long rest (Light/Minor)
  | 'FirstAid'       // stabilize + stop bleed; 2 AP; Medicine DC10
  | 'FieldSurgery'   // duration ×0.5; 10 min; Medicine DC15
  | 'HospitalCare'   // duration ×0.25; "1 day" baseline professional care
  | 'MagicalHealing' // cure moderate/minor instantly; 1 action; healing power
  | 'Regenerate'     // cure permanent disabilities; 1 action; Regeneration power
  | 'CloneReplacement'; // full recovery; cost/time per cloning system
```

### 2.3 Health-status condition (from `Status_Effects_Complete.csv`)

```ts
type HealthCondition =
  | 'Bleeding' | 'Poisoned' | 'Diseased' | 'Radiation_Sickness' | 'Sickness'
  | 'Dying' | 'Dead' | 'Cloned' | 'Hospitalized' | 'Critical_Condition'
  | 'Stable_Condition' | 'Quarantined' | 'Memory_Loss' | 'Cybernetic_Rejection'
  | 'Power_Dampened' | 'Power_Drained';

interface ActiveCondition {
  condition: HealthCondition;
  severity: 'I'|'II'|'III'|'None';
  durationType: 'Turns'|'Days'|'Weeks'|'Hours'|'Permanent'|'Special';
  remaining: number;            // in the durationType's unit
  cloneRequired: boolean;       // Status_Effects_Complete.csv col Clone_Required
  medicalTreatment: string;     // e.g. "Hospital detox required"
  statDelta: StatPenalty[];     // parsed Gameplay_Effect (e.g. -2CS Constitution daily)
}
```

### 2.4 Dying / death-save state (from `Status_Effects_Complete.csv` `Dying` + `Injury_System.csv` death-save modifiers)

```ts
interface DyingState {
  characterId: string;
  successes: number;            // need 3 to stabilize
  failures: number;            // 3 = Dead
  perTurnModifierCS: number;    // sum of -2CS death saves riders from injuries
  autoFailThisTurn: boolean;    // Ruptured Aorta = "instant failed death save"
  stabilized: boolean;
  causeOfWound?: string;        // for the death record / obituary
}
```

### 2.5 Hospital stay (the strategic-layer activity instance)

```ts
interface HospitalStay {
  characterId: string;
  activityId: 'ACT_005'|'ACT_029'|'ACT_030'; // medical / physical / mental
  cityId: string; countryCode: string;       // where they're being treated
  facilityQuality: number;     // 0-100, computed from spine (§3.1)
  treatmentTier: TreatmentTier;// best tier this facility can offer (§3.2)
  injuries: string[];          // Injury.id being treated
  conditions: HealthCondition[];
  startGameDay: number;
  etaGameDay: number;          // when fully recovered
  dailyCost: number;           // $/game-day (§3.3)
  paid: boolean;               // insurance/payment gate (ACT_005 Resource_Costs)
  complicationRolled: boolean; // see §5
}
```

### 2.6 Clone order (extends `combinedEffects.ts` `CloningSystem`)

```ts
interface CloneOrder {
  deadCharacterId: string;
  facilityCountryCode: string;
  facilityCityId: string;
  cloningSystem: CloningSystem; // from calculateCloningSystem(country)
  resurrectionChance: number;   // 0/0.50/0.90 from Cloning band (§4.7)
  waitDays: number;             // 30 or 7 from Cloning band (§4.7)
  cost: number;                 // cloningSystem.baseCost (or premiumCost)
  memoryTransfer: boolean;      // cloningSystem.memoryTransfer
  orderedGameDay: number;
  readyGameDay: number;
  outcome?: 'pending'|'success'|'defect'|'failed_permadeath';
  defect?: CloneDefect;         // if outcome === 'defect'
}

type CloneDefect =
  | 'Memory_Loss_I'   // amnesia of recent events (Status_Effects_Complete Memory_Loss I)
  | 'Memory_Loss_II'  // lost personal history
  | 'stat_degradation'// cloningSystem.degradationRate % stat loss
  | 'cosmetic';       // narrative only
```

---

## 3. How it consumes the SPINE (the whole point — Bible §13.9)

Every number a player feels in this loop is **derived from the country/city they're standing in**. No flat constants for facility quality, recovery speed, cost, or resurrection odds.

### 3.1 Hospital facility quality — `Healthcare + GDP + Lifestyle` (Bible §8 "Medical / recovery")

> Source: Bible §8 row *Medical / recovery = Healthcare + GDP + Lifestyle → hospital quality, recovery speed*; `Country_Attribute_Effects.csv` Healthcare row (High = "faster healing"); `City_Type_Effects.csv` population/crime modifiers.

```
facilityQuality (0-100) =
    0.55 * Healthcare            // Country.csv Healthcare 20-90
  + 0.30 * GDPNational           // Country.csv GDPNational
  + 0.15 * Lifestyle             // Country.csv Lifestyle
  + cityPopulationModifier       // City_Type_Effects "POPULATION TYPE": +0 Town … Mega City scales resources
  - crimePenalty                 // City crimeIndex >60 → degrades care access
```

`cityPopulationModifier` (from `City_Type_Effects.csv` `---CITY TYPE + POPULATION TYPE---`, mapped to a 0-100 quality nudge):
| Pop Rating | Modifier |
|---|---|
| 2 Village | −10 (`-2CS resources`) |
| 3 Small Town | −5 |
| 4 Town | 0 |
| 5 City | +5 (`+1CS resources`) |
| 6 Large City | +10 (`+2CS resources`) |
| 7 Mega City | +15 (`+3CS resources`) |

`crimePenalty` (from `City_Type_Effects.csv` `---CITY TYPE + CRIME INDEX---`): crimeIndex 60-80 → −5; 80-100 → −10 (legal/medical access degraded in lawless cities). **RULING-1** (the −5/−10 magnitudes are a ruling — see §7).

Weights 0.55/0.30/0.15 are **RULING-2** (the Bible names the three inputs but not their weighting; Healthcare dominates because the source Healthcare row alone already says "faster healing," GDP and Lifestyle are amplifiers). The weights sum to 1.0 so quality stays on the same 0-100 scale as the input stats.

### 3.2 Best treatment tier the facility can offer (gates how fast injuries clear)

`facilityQuality` selects the maximum `TreatmentTier` available **without a healing power**:

| facilityQuality | Max tier available | Recovery multiplier (from `Injury_System.csv ===RECOVERY TIMES===`) |
|---|---|---|
| 0-24 (failed state / village) | `None` or `FirstAid` only | Untreated `Duration_Untreated`; FirstAid stabilizes but doesn't shorten |
| 25-49 | `FieldSurgery` | duration ×0.5 (`Field_Surgery: Reduce duration by half`) |
| 50-74 | `HospitalCare` | duration ×0.25 (`Hospital_Care: Reduce duration to 1/4`) |
| 75-100 (Medical Center) | `HospitalCare` + research-unlocked accelerants | ×0.25, and **enables Cloning/Regen facilities** if `Cloning` allows |

The recovery multipliers (×0.5, ×0.25) are **directly from** `Injury_System.csv` (`Field_Surgery: Reduce duration by half`; `Hospital_Care: Reduce duration to 1/4`). The facilityQuality→tier thresholds (24/49/74) are **RULING-3**.

### 3.3 Daily hospital cost — `GDPPerCaptia` (richer country = pricier care)

> Source: `Daily_Activity_Framework.csv` ACT_005 `Resource_Costs = "Medical insurance or payment"`; `Public_Perception.csv` "Medical and funeral costs"; mirrors `combinedEffects.ts` clone-cost-scales-with-GDP pattern.

```
dailyCost ($/game-day) = round( 200 * (GDPPerCaptia / 50) * severityMultiplier )
  severityMultiplier:  Minor 1.0 · Moderate 1.5 · Severe 2.5 · Critical 4.0 · MentalRecovery 1.5
```
The `200` base and severity multipliers are **RULING-4** (no source dollar figure for hospital day-rate exists; the `GDPPerCaptia/50` divisor matches the existing `combinedEffects.ts` clone-cost formula `country.gdpPerCapita / 50` so pricing stays internally consistent).

### 3.4 Cloning — `Cloning` band × (`Healthcare + Science`) quality × `GDPPerCaptia` cost (Bible §6.1/§8, **all numbers sourced**)

> Source: `Country_Attribute_Effects.csv` `Cloning` row — the only fully-numbered cloning table in the data:
> - **0-35:** "No cloning: LSW death permanent in this country."
> - **36-65:** "Basic cloning: 50% resurrection chance; 30 day recovery."
> - **66-100:** "Advanced cloning: 90% resurrection; 7 day recovery; clone army possible."

Plus Bible §6.1 confirms: *"Cloning: Banned → permadeath; High → 90% resurrection, 7-day clone"* and §8 *"Cloning / resurrection = Healthcare + Science + GDP + country Cloning law → clone quality, wait time, memory-transfer success."*

This is consumed exactly as `combinedEffects.ts calculateCloningSystem()` already does for quality/cost/wait, **with the band table bolted on for resurrectionChance and the canonical wait-days** (see §4.7).

### 3.5 Mental recovery — `Healthcare` + Research `TREE_MED` Neuro nodes

ACT_030 Mental Recovery / `Memory_Loss` / psychiatric conditions key off `Healthcare` for base speed and are **accelerated by built tech**: `Research_Projects.csv` `PRJ_062 Neuro_Stimulator (+2CS mental recovery)` and `NODE_113 Neuro_1`. A character with Memory_Loss in a country with no Neuro tech recovers at base; with `Neuro_Stimulator` built, apply +2CS to the recovery roll (§4.5).

### 3.6 Which spine stats drive what (summary table)

| Outcome the player feels | Country/City stat(s) | Formula ref |
|---|---|---|
| How fast injuries clear | Healthcare + GDP + Lifestyle + city pop/crime | §3.1 → §3.2 |
| Whether the hospital can do surgery at all | facilityQuality threshold | §3.2 |
| $/day to stay hospitalized | GDPPerCaptia × severity | §3.3 |
| Whether a dead hero can come back | **Cloning** band | §3.4 / §4.7 |
| Clone resurrection odds & wait | **Cloning** band | §4.7 |
| Clone quality / defect chance | Healthcare + Science | `combinedEffects.ts` |
| Clone price | GDPPerCaptia + Science | `combinedEffects.ts` |
| Mental/memory recovery speed | Healthcare + built Neuro tech | §3.5 |
| Funeral reputation hit if you DON'T clone | per-country LSWRegulations / faction territory | `deathConsequences.ts` + `Public_Perception.csv` |
| "Medical Center" super-facility unlock | High Healthcare + High Cloning combo | `Country_Attribute_Effects.csv` combos |

---

## 4. Exact numbers, tables & formulas (each cited)

### 4.1 Entering Dying (combat → 0 HP)
> Source: `Status_Effects_Complete.csv` row `Dying` ("Health reaches 0 … make death saves each turn … Clone_Required = Yes if death occurs"); Bible §5.6 ("Death → Dying → death saves → permadeath").

When `currentHP <= 0` and the character is not already Dead: set `ActiveCondition{Dying}`, create `DyingState{successes:0, failures:0}`. The character is `Unconscious` (cannot move/act; defenses −3CS per `Status_Effects_Complete.csv Unconscious`).

### 4.2 Death saves (per combat turn)
> Source: `Injury_System.csv` death-save modifiers — the only death-save numbers in the data: `Ruptured Aorta: "-2CS death saves; instant failed death save"`, `Arm/Leg Artery Cut: "-2CS death saves"`, `Adrenaline Rush (d100=100): "Start with 1 success on death saves; +1CS death saves; instant stabilize"`. Three-strike structure is **RULING-5** (standard d20 death-save shape, consistent with the table's "+1 success / instant stabilize" language — the table assumes a 3-success/3-failure ladder).

Per turn while Dying, roll on the **Universal_Table_FIXED** (Bible §3.3, one resolution chart) against a base column representing the character's `CON` rank:
```
deathSaveColumn = CON_rank + perTurnModifierCS    // perTurnModifierCS = Σ injury death-save CS (e.g. -2 per artery cut)
roll d100 on Universal_Table_FIXED at deathSaveColumn:
   Success or Major → +1 success
   Failed or Minor  → +1 failure
   d100 == 00 (Major auto) → instant stabilize (treat as 3 successes)
   d100 == 99 (Fail auto)  → +1 failure
If any injury carries "instant failed death save" (Ruptured Aorta) → that injury forces +1 failure automatically each turn until treated.
successes >= 3 → STABILIZED (Dying removed, Unconscious remains, character now Critical_Condition off-grid)
failures  >= 3 → DEAD (apply §4.8)
```
`Adrenaline Rush` (Injury_System d100=100) pre-seeds `successes:1` and applies `+1CS` and `instant stabilize` — i.e. the character self-stabilizes the turn they'd otherwise drop.

### 4.3 Stabilizing actions (anyone can interrupt the dying clock)
> Source: `Injury_System.csv ===MEDICAL TREATMENT===` (`First_Aid: Stabilize + stop bleeding, 2 AP, Medicine DC10`) and `===INJURY RESISTANCE===`.

- **First Aid** (teammate, 2 AP, Medicine DC10 on Universal_Table_FIXED) → instant stabilize, stop bleeding.
- **Magical Healing power** (1 action) → stabilize + cure Moderate/Minor injuries instantly.
- **End of combat with the character still alive** → auto-stabilize at fight end (they survived the encounter; injuries persist to strategic layer). **RULING-6** (no source states this, but it is required so a dying character who is rescued by winning the fight doesn't keep rolling forever; consistent with the strategic-layer "Status_Injured" hand-off in `Time_Management.csv`).

### 4.4 Recovery times (the strategic clock)
> Source: `Injury_System.csv ===RECOVERY TIMES===` (verbatim):

| Injury_Category | Base_Duration (untreated) | With_Treatment (Field Surgery) | Hospital_Care |
|---|---|---|---|
| Fatal | Permanent | Resurrection only | N/A |
| Permanent_Disability | Permanent | Regenerate/Prosthetic | N/A |
| Critical_Injury | Until stable | Magical healing | **1 week** |
| Severe_Injury | **2d8 weeks** | **1d8 weeks** | **1d4 weeks** |
| Moderate_Injury | **2d6 days** | **1d6 days** | **1d3 days** |
| Minor_Injury | **1d4 days** | **1d2 days** | **1 day** |
| Light_Injury | Long rest | Short rest | Immediate |
| Memorable_Scars | Permanent (cosmetic) | optional removal | N/A |
| Survivability | Immediate | — | — |

Dice are resolved to integer **game-days** at injury creation (1 week = 7 game-days; Bible §11 = 1 real day : 30 game days, so a 2d8-week severe injury ≈ 0.3-0.5 real days of play). `remainingDays` ticks down each `day_change` event from the time engine (same hook `deathConsequences.ts` already uses).

**Treatment selection at the hospital** (per `HospitalStay.treatmentTier`, §3.2):
- `None` → use Base_Duration column.
- `FieldSurgery` → use With_Treatment column (×0.5 equivalent).
- `HospitalCare` → use Hospital_Care column (×0.25 equivalent).
- `MagicalHealing` → Moderate/Minor cured instantly; Critical → stabilized then 1 week.
- `Regenerate` → Permanent_Disability cured instantly (clears `bodyPart`, restores CS penalties).

### 4.5 Condition durations (Bleeding / Disease / Radiation / Sickness / Mental)
> Source: `Status_Effects_Complete.csv` `Duration_Value` + `Recovery_Method` columns (verbatim):

| Condition | Sev | Duration | Per-tick effect | Hospital escalation |
|---|---|---|---|---|
| Bleeding | I/II/III | 3 / 5 turns / until treated | −5/−10/−20 HP per turn | III needs Surgery; Clone "Possible" |
| Poisoned | I/II/III | 6 / 10 turns / until treated | −3/−8/−15 HP; −1/−2/−3CS CON | III "Intensive care", Clone Possible |
| Diseased | I/II/III | 7 / 14 days / weeks-until-treated | daily stat reduction; −1/−1all/−2all CS | III "Quarantine + intensive care", **Clone_Required = Yes** |
| Radiation_Sickness | I/II/III | 5 days / 3 weeks / until treated | −1CS CON … organ failure −3CS physical | III "Bone marrow transplant", **Clone Yes** |
| Sickness | I/II/III | 3 / 7 days / weeks | 25%/50% lose turn … −3CS all | III "Life support", Clone Possible |
| Memory_Loss | I/II/III | 7 days / 4 weeks / permanent | −2CS / −3CS knowledge / amnesia | III Clone Possible; +2CS from Neuro tech (§3.5) |
| Critical_Condition | None | Days (variable) | life support; unconscious | ICU; Clone Possible |
| Stable_Condition | None | Days (variable) | conscious, bedridden, limited | hospital monitoring |
| Cybernetic_Rejection | None | Weeks (variable) | implant malfunctions | immunosuppressive therapy; Clone Possible |
| Quarantined | None | Days (variable) | isolated, no contact | until disease cured |

These conditions are **carried out of combat** and resolved by the Hospital activity. `Clone_Required`/`Clone Possible` means: if untreated past its duration (because the country has no facility able to treat it), the condition **escalates to Dying** (see §5 failure modes).

### 4.6 Injury CS-penalty parsing (so injuries actually bite in later combat)
The `Mechanical_Effect` strings in `Injury_System.csv` are parsed into `csPenalties[]` and applied to the character's tactical stats until `remainingDays == 0`. Examples (verbatim from source):
- Lose an Eye → `-2CS perception(sight); -2CS ranged attacks`
- Lose an Arm → `cannot use two-handed weapons; -50% carry capacity`
- Broken Leg → `movement speed halved`
- Punctured Lung → `Concentration check DC10 every turn`
- Impressive Scar (Body) → `+1CS Intimidation` (a *positive* permanent effect — keep it)

### 4.7 Cloning resurrection (the band table + quality bolt-on)
> Source: `Country_Attribute_Effects.csv` Cloning row (the three bands) + `combinedEffects.ts calculateCloningSystem()` (quality/cost/defect).

```
band = cloningBand(country.Cloning)   // see §7 RULING-7 for enum/numeric reconciliation
switch(band):
  'none'  (0-35  OR "Banned"):    resurrectionChance = 0.00; waitDays = ∞ (permadeath)
  'basic' (36-65 OR "Regulated"): resurrectionChance = 0.50; waitDays = 30
  'advanced'(66-100 OR "Legal"):  resurrectionChance = 0.90; waitDays = 7

cost            = cloningSystem.baseCost          // combinedEffects.ts: 50000 * (gdpPerCapita/50) * (1.5 - science/200)
cloneQuality    = (Healthcare + Science) / 2      // combinedEffects.ts
defectChance    = cloningSystem.cloneDefectChance // combinedEffects.ts
memoryTransfer  = cloningSystem.memoryTransfer    // combinedEffects.ts; advanced bands carry full memory

On readyGameDay, roll d100:
  roll <= resurrectionChance*100:
      roll d100 again vs defectChance:
        <= defectChance*100 → outcome 'defect' (assign CloneDefect; see §2.6)
        else               → outcome 'success' (full restore; if !memoryTransfer → force Memory_Loss_II)
  else:
      outcome 'failed_permadeath' → the clone failed; character is now truly gone → §4.8 funeral path
```
Resurrection % and wait-days (0/0.50/0.90, ∞/30/7) are **verbatim** from `Country_Attribute_Effects.csv`. Cost/quality/defect re-use the **already-shipped** `combinedEffects.ts` formulas — no new numbers invented.

### 4.8 Death finalization → handoff to existing systems (DO NOT re-implement)
When a character is confirmed `Dead` (3 failed saves, OR no clone available, OR clone `failed_permadeath`):
1. Call `deathConsequences.ts → recordDeath()` (already builds `DeathRecord`, last words by MBTI, family).
2. Show the existing **funeral notification** (`generateDeathNotification`, 7 funeral options, morale math) — **unchanged**.
3. Reputation hit: `Public_Perception.csv` `Team_Member_Death = -15 Faction Reputation, $500K-$5M family compensation, recruitment difficulty`.
4. Obituary/news: `Result_Templates.csv TEMP_019 Memorial Service` (250-300 words). Bible §9.3.
5. Character stays on roster as **deceased** until funeral chosen (Bible §7.3: "a dead hero stays on the roster until their funeral").

**The clone path runs BEFORE step 1**: if the death country (or a reachable Medical-Center country) supports cloning AND the player pays, we open a `CloneOrder` instead of finalizing death. Death only finalizes if cloning is banned/declined/failed.

---

## 5. Edge cases & failure modes

1. **Untreated lethal condition escalates.** Bleeding III / Poisoned III / any `Clone_Required` condition left past its `until treated` duration because the current country can't offer the needed tier (§3.2) → the condition forces the character back into `Dying` (§4.1). This is how a low-Healthcare country *kills* a wounded merc the player parked there. (`Status_Effects_Complete.csv` III rows all say "until treated / surgery / ICU".)
2. **Dying outside combat.** If a strategic-layer condition triggers Dying (case 1), run a **simplified daily death save** (1 save/game-day instead of per-turn) using §4.2. Gives the player a real-time window to evacuate them to a better hospital. **RULING-8**.
3. **No reachable hospital.** Village / failed state with facilityQuality < 25: only `FirstAid` (stabilize, no duration cut). Severe+ injuries run their full untreated `2d8 weeks`. Player must **travel** the character to a better city (Travel system) — recovery pauses or continues at the destination's tier on arrival.
4. **Construct/robot characters cannot be cloned or hospitalized normally.** `Origin_Types.csv` row 9 Construct + `Origin_Damage_Interactions.csv` ("Robots spark/leak; don't bleed; take full damage but show sparks"). A Construct's "Hospital" is **Engineering/repair** (ACT_006), not Medical; its "clone" is rebuild-from-schematic if schematics exist. **RULING-9**: Constructs route Dying→repair, never to the cloning facility; Bleeding/Poisoned/Disease conditions never apply (immune per origin table).
5. **Cloning a clone (generational degradation).** `combinedEffects.ts degradationRate` already models stat loss per generation. Track `cloneGeneration` on the character; each successive clone applies `degradationRate%` stat loss. A character cloned 4× in a low-Science country becomes mechanically worthless — a deliberate "don't farm resurrection" brake. **RULING-10**.
6. **Memory-loss clone.** If `memoryTransfer == false` (basic facilities), the returned character gets `Memory_Loss_II` (lost personal history) → loses learned skills/relationships per `Status_Effects_Complete.csv`. The roster shows them as "(clone)". This is the comic-book "they came back wrong" beat the Bible §11/§12 wants.
7. **Permanent disability + no Regeneration/prosthetic tech.** Lost limb stays lost (Bible §5.6). The character is playable but permanently −CS until the player builds `Modern_Prosthetic`/`Cybernetic` (Injury_System `===PROSTHETICS===`) or recruits a Regeneration power.
8. **Player ignores the death notification.** `deathConsequences.ts` already auto-selects `skip` after 48h (morale −30). Clone window: if the player neither clones nor funerals before `cloneWindowDays` (RULING-11: default **3 game-days** post-death, since clone viability degrades), the clone option closes and death finalizes.
9. **Quarantine spreads.** Diseased III is contagious (`Quarantined`). If a quarantined character is kept on an active squad, roll daily infection vs squadmates' CON (uses Disease exposure prereq). **RULING-12** (source says "isolated due to contagion risk" but gives no spread formula).
10. **Time-travel interaction.** Loading a Time-Walker save (Bible §11) is the *only* way to undo a death without cloning — and it costs sanity. The recovery loop must expose death as **final-unless-cloned** so the Time-Walker save retains its weight. No silent auto-revive.
11. **Paying for the hospital.** ACT_005 requires "Medical insurance or payment." If the player can't pay `dailyCost`, the stay drops to `None`/`FirstAid` tier (charity ward) and recovery slows to untreated. No free top-tier care.
12. **Cybernetic Rejection loop.** Installing a Cybernetic prosthetic can roll `Cybernetic_Rejection` (weeks, implant malfunctions) → needs immunosuppressive therapy (a hospital condition). Don't let prosthetics be a free permanent fix.

---

## 6. UI/UX hooks (how it surfaces)

The Bible's law: **UI is gameplay (§1.5), the phone/laptop is the meta-game (§7).** This system must reach the player through those surfaces, never a hidden timer.

### 6.1 Combat overlay (tactical layer — symbolic, Bible §intro)
- A downed unit shows a **Dying glyph** + a death-save tracker `●●○ / ○○○` (successes/failures) above the symbolic grid token. No gore; glyph + counter.
- Hovering a unit shows its injury list and CS penalties (so the player understands why their sniper is suddenly −2CS ranged: lost an eye last fight).
- "First Aid (2 AP)" appears as a contextual action on any adjacent conscious teammate when standing over a Dying ally.

### 6.2 Phone (push alerts, pauses time — Bible §7)
- **Push notification** the moment a merc enters Critical_Condition or Dying-out-of-combat: *"AGENT NDIAYE IS CRITICAL — evac to a hospital."* Opening the phone **pauses the world clock** (Bible §7 — laptop pauses time).
- **Death alert** routes into the existing `deathConsequences.ts` funeral notification UI.
- **Clone offer** as a phone decision card: *"A cloning facility in Seoul can attempt resurrection: 90% success, 7 days, $X, full memory transfer. [Authorize] [Decline → funeral]"* — surfaces the spine numbers (§4.7) directly so the player feels geography.

### 6.3 Laptop — Hospital app (extends existing `HospitalScreen.tsx`)
- Roster of wounded with: portrait, injury chips (color by category), condition chips, **ETA bar** (remainingDays), facilityQuality stars for the current city, and `$/day` cost.
- **"Transfer" button** per patient → opens a city picker showing facilityQuality + best tier + clone availability per candidate city (this is the spine made visible — the player shops for a Medical Center). Wires to the Travel system.
- **Cloning bay tab** (only visible if a reachable country's `Cloning` band ≠ none): pending `CloneOrder`s with countdown, success odds, and a defect-risk warning.
- Empty state: "No personnel require medical care." (per global design standard — large icon in colored circle, no purple).

### 6.4 World map (strategic layer — Bible §6)
- Cities with a clone-capable facility get a **medical-cross marker** when a player merc is dead/dying (so the player can see where to evac). Driven by `Cloning` band + facilityQuality.
- A character "Hospitalized" shows a bed icon on their sector and is `Status_Hospitalized` (cannot deploy — `Time_Management.csv`).

### 6.5 News / obituary (Bible §9.3, §7.2)
- A team death generates a **BNN/ANN obituary** via `Result_Templates.csv TEMP_019` in the News app, and a roster obituary entry (Bible §7.3). A *successful clone* generates a quieter "miraculous recovery / cloning controversy" story (driven by `LSWRegulations` of the cloning country — a clone in a Banned-cloning country is a scandal).

---

## 7. RULING: notes (where the data didn't settle — decided here, Bible-consistent)

- **RULING-1 — crime→care penalty magnitudes.** crimeIndex 60-80 = −5, 80-100 = −10 to facilityQuality. (`City_Type_Effects.csv` only gives CS modifiers to *methods*, not a quality number; mapped to keep failed/lawless cities medically worse.)
- **RULING-2 — facilityQuality weights** 0.55 Healthcare / 0.30 GDP / 0.15 Lifestyle. Bible §8 names the three inputs but not the mix; Healthcare dominates because its own source row already grants "faster healing."
- **RULING-3 — facilityQuality→tier thresholds** 24/49/74 mapping to FirstAid/FieldSurgery/HospitalCare. (`Injury_System.csv` defines the tiers and their multipliers; the country-quality gating is the design bridge.)
- **RULING-4 — hospital day-rate** `$200 × GDPPerCaptia/50 × severityMult`. No source dollar figure for a hospital day; the GDP divisor matches the shipped clone-cost formula for internal consistency.
- **RULING-5 — 3-success/3-failure death-save ladder.** The source table speaks of "+1 success" and "instant stabilize" but never states the count; 3/3 is the standard shape the table's language assumes.
- **RULING-6 — combat-end auto-stabilize.** A Dying character alive when combat ends is stabilized (carries injuries to strategic layer). Required to avoid an infinite dying loop; consistent with the `Status_Injured` strategic hand-off.
- **RULING-7 — Cloning column type reconciliation (DATA BUG).** The World Bible `Country.csv` `Cloning` column is **inconsistent**: 64 rows hold the enum `Banned`, 22 `Regulated`, 15 `Legal`, but ~30 rows hold a **numeric 0-90** (e.g. Finland = 65). `combinedEffects.ts` reads it as an enum and silently mishandles the numeric rows. **Ruling:** normalize at load — numeric 0-35→`Banned`/`none`, 36-65→`Regulated`/`basic`, 66-100→`Legal`/`advanced` (matching the `Country_Attribute_Effects.csv` bands exactly), and map the enums `Banned→none / Regulated→basic / Legal→advanced`. This unifies both representations onto the §4.7 band table. (Also satisfies Bible §13.10 "unify the datasets.")
- **RULING-8 — out-of-combat death saves** run once per game-day (not per turn).
- **RULING-9 — Construct origin** routes Dying→Engineering repair, never cloning; immune to bio conditions (per `Origin_Damage_Interactions.csv`).
- **RULING-10 — generational clone degradation** uses the existing `degradationRate` per clone generation.
- **RULING-11 — clone window** closes 3 game-days after death (clone viability degrades).
- **RULING-12 — quarantine spread**: daily infection roll vs squadmate CON if a Diseased-III character stays on an active squad.

---

## 8. OWNER-FORK: notes (genuine product calls only the owner can make)

> These are **not** guesses to be settled by data — they are design-direction choices with real consequences for game feel. Flagged for the owner; defaults proposed but not assumed final.

- **OWNER-FORK A — Permadeath hardness.** Should *player-faction mercs* be cloneable everywhere they can reach a facility, or should cloning be **rare and precious** (e.g. only the player's *home faction* Medical Center, or a once-per-character limit)? Tunes whether the roster feels truly mortal (JA2) or comic-book-revolving-door. *Default proposed: cloneable anywhere with a band≥basic facility, but generational degradation (RULING-10) + cost make repeat resurrection self-limiting.*
- **OWNER-FORK B — Does cloning resurrect ENEMY/NPC LSWs too, or only the player's roster?** "Clone army possible" (advanced band) implies enemies could field clones. Big balance + narrative lever. *Default proposed: player-roster only for now; flag enemy-clone-army as a later world-sim feature.*
- **OWNER-FORK C — Memory-loss clone severity.** When `memoryTransfer == false`, does the returned character lose **skills/training** (mechanically painful, JA2-harsh) or only **relationships/personal history** (narrative, softer)? *Default proposed: relationships + Memory_Loss_II, but keep trained stats (training erosion is already a separate system, Bible §4).*
- **OWNER-FORK D — Is cloning a moral/reputation event?** Should cloning in a `Banned`-cloning country (illegal resurrection) carry an LSW-affairs / public-opinion penalty and risk legal fallout (Bible §8 LSW affairs, §9 reputation)? *Default proposed: yes — a black-market clone is a news scandal scaled by the country's LSWRegulations.*
- **OWNER-FORK E — Should the Time-Walker save fully bypass this loop?** If loading a save un-kills a merc for free, does that undercut the cloning economy? Owner must decide the intended tension between the two resurrection mechanics (sanity-cost rewind vs money/geography clone). *Default proposed: Time-Walker is the rare "undo the whole timeline" lever; cloning is the routine "buy this one back" lever — they serve different scales and should coexist.*
- **OWNER-FORK F — Real-time pressure on dying-out-of-combat.** With the 1:30 time ratio, a 30-day clone wait is ~1 real day. Is that the intended pacing, or should clone/recovery waits be felt more (slower ratio during medical crises, like `Crisis_Time` 1:15)? *Default proposed: use base 1:30; consider Crisis_Time only if a player merc is actively Dying.*

---

## 9. Integration points (what it reads / writes)

**Reads:**
- `combinedEffects.ts → calculateCloningSystem(country)` — clone quality/cost/defect/memory (do not duplicate).
- `locationEffects.ts / countries.ts` — Healthcare, Science, GDPNational, GDPPerCaptia, Lifestyle, Cloning, LSWRegulations, LawEnforcement, crimeIndex, city pop rating.
- Tactical combat (`CombatScene.ts`) — fires `onUnitDowned(unitId)` / `onCombatEnd(survivors, casualties)` into this system.
- `Injury_System.csv` (loaded as data) — the crit→injury d100 + recovery tables.
- `Research_Projects.csv` — which TREE_MED / Neuro / prosthetic tech the player has built (recovery accelerants).
- Travel system — for "transfer patient to better hospital."

**Writes:**
- `deathConsequences.ts → recordDeath()` / funeral flow (on confirmed death — reuse, don't fork).
- Character registry — injury list, conditions, hospitalized/dead status, clone generation.
- `Time_Management` status — sets `Status_Injured` / `Status_Hospitalized` / `Status_Dead` (gates deployment & activities).
- News engine — obituary (TEMP_019) / clone-controversy story.
- Reputation (`Public_Perception.csv` Team_Member_Death) and morale (`deathConsequences.ts` MoraleEffect).
- Economy — hospital `dailyCost`, clone `cost`, funeral cost (debits player funds).

**Event hooks (mirror `deathConsequences.ts` pattern):**
- `timeEngine.on('day_change')` → tick `remainingDays`, run out-of-combat death saves, resolve clone-ready orders, escalate untreated lethal conditions.
- `timeEngine.on('hour_change')` → not needed here (day granularity is enough; morale decay stays in `deathConsequences.ts`).

---

## 10. Open questions

1. **Healing powers as a roster service.** A Regeneration/Healing LSW on the team should let the player skip the hospital for allies. Where does the "use Hero X's healing power on Hero Y between missions" UI live — Hospital app, or a power-activation action? (Touches the BAMPI/Power-Activation-Engine work, Bible §5.12.)
2. **Prosthetics vs Regeneration economy.** Both cure Permanent_Disability. Is there a reason to ever pick a prosthetic (cheaper, faster, but `Cybernetic_Rejection` risk) over waiting for a Regeneration recruit? Needs a cost/time/risk pass once the tech tree is wired.
3. **Disease as an offensive enemy tool.** Diseased-III is `Clone_Required` and contagious — should enemy bio-LSWs be able to *inflict* campaign-level plagues on a squad as a strategic threat? (Cross-refs World_State_Tracking / Dynamic_Political_Events.)
4. **Insurance system depth.** ACT_005 says "Medical insurance or payment." Is insurance a real purchasable system (premiums vs payout) or just a flavor word for "you pay"? Owner call (could be a small economy subsystem).
5. **Clone identity & law.** Is a clone legally the same person (keeps fame, country reputations, prisoner record) or a new entity? Affects News, Personnel, and LSW-registration systems.
