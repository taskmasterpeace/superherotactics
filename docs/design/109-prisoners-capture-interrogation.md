# 109 — Prisoners, Capture & Interrogation

> **System owner:** Strategic/Laptop layer + Tactical-combat hook
> **Status:** BUILD-READY spec
> **Bible anchors:** §4 (Origins), §5.6 (crit→injury, Dying/KO), §5.7 (status effects incl. *captured/quarantined*), §5.9 (wrestling KO holds), §7.3 (Personnel → **prisoner database**, recruits: vigilantes/foreign-nationals/imprisoned super-criminals), §7.4 (Investigation → **Force**/interrogation method), §8 (combined-effects spine), §9 (economy/fame/legal), §10 (`Player_Scaling`: containment facility + prosecution per enemy tier), §13 ruling #9 (combined-effects must be CONSUMED).
> **Primary source tables (opened & cited inline):** `Player_Scaling.csv`, `Investigation_Methods.csv`, `Investigator_Skills.csv`, `Investigation_Consequences.csv`, `Email_Investigation_Templates.csv`, `Public_Perception.csv`, `Combat Compendium REAL - 😢EFFECT_STATUS😴.csv`, `Game_Mechanics_Spec/Injury_System.csv`, `Game_Mechanics_Spec/Wrestling_Martial_Arts_Complete.csv`, `Game_Mechanics_Spec/Country_Attribute_Effects.csv`, `Game_Mechanics_Spec/Origin_Types.csv`, `SuperHero Tactics World Bible - Country.csv`, `Daily_Activity_Framework.csv`, `FIST GDD v02.txt` (§303, §336, §534–538).

---

## 1. Overview & player fantasy

You don't have to kill the people you beat. When a tactical fight ends with an enemy **knocked out, choked unconscious, or bleeding-out-then-stabilized instead of killed**, you can **take them prisoner**. A captured super-criminal is an *asset*: a body of intelligence to interrogate, a bargaining chip to trade to a foreign government, a recruit you can flip to your own roster (FIST's literal mandate — "recruit…or contain…or eliminate"), or a liability that rots in a cell while their faction hunts you to free them.

This is the JA2 "you can knock out and capture mercs" verb wired into the SHT spine: **where** you capture and **where** you hold someone changes *everything* — a corrupt failed state lets you "lose" a prisoner cheaply and torture freely; a free-press democracy turns a brutal interrogation into a Congressional hearing. The prisoner database in Personnel (§7.3) is the surfacing UI; the world's stats decide the rules.

**Three things a prisoner can become:**
1. **Intelligence** — interrogate to unlock investigations, mission leads, faction secrets, reverse-engineering hints.
2. **A traded/processed body** — hand to the host government (rep + legal cleanup), trade to a rival faction (relations + favor), or ransom.
3. **A recruit** — "break and turn" an imprisoned super-criminal onto your own team (the FIST/prisoner-database fantasy).

---

## 2. Where it sits in the loop

```
TACTICAL COMBAT  → enemy reaches Unconscious / Dying-then-stabilized / Submitted-via-hold
        │  (player chooses CAPTURE instead of leaving/killing)
        ▼
CAPTURE RESOLUTION (combat overlay) → Prisoner record created, custody = your squad
        │  must be EXTRACTED to a holding facility (base brig / host-nation prison / black site)
        ▼
PRISONER DATABASE  (Personnel app, §7.3)  ── prisoner roster, status, "heat", upkeep
        │
        ├─► INTERROGATE  (uses Investigation engine §7.4, METH_005 "Force")  → intelligence
        ├─► PROCESS      (hand to host govt / trade to faction / ransom / release)
        ├─► RECRUIT      (break-and-turn → roster as RecruitableCharacter)
        └─► (do nothing) → daily upkeep, escape risk, faction rescue missions
```

---

## 3. Data schema

### 3.1 `Prisoner` record (new — the core entity)

```ts
interface Prisoner {
  id: string;                    // uuid
  sourceCharacterId: string;     // FK to the combat unit / world character that was captured
  alias: string;
  name: string;
  origin: OriginType;            // §4 / Origin_Types.csv — drives containment + weakness
  threatLevel: 'ALPHA'|'THREAT_1'|'THREAT_2'|'THREAT_3'|'THREAT_4'|'THREAT_5';
  stats: { MEL:number; AGL:number; STR:number; STA:number; INT:number; INS:number; CON:number };
  powers: string[];
  factionId: string | null;      // who they belong to (drives rescue-mission generation)
  nationality: string;           // ISO code → which govts will demand/accept them

  // --- capture context ---
  capturedAt: number;            // game-time timestamp
  captureSectorId: string;
  captureMethod: CaptureMethod;  // see 3.2
  capturingSquadId: string;
  custody: 'IN_FIELD'|'IN_TRANSIT'|'HELD'|'PROCESSED'|'ESCAPED'|'DEAD'|'RECRUITED';
  holdingFacilityId: string|null;// where they are; null while IN_FIELD/IN_TRANSIT

  // --- containment state (live) ---
  containmentRating: number;     // current effective containment CS of the facility vs this prisoner
  health: number;                // carries over from combat; Dying prisoners can still die
  injuries: InjuryRef[];         // from Injury_System.csv, carried from capture
  restraintTier: 0|1|2|3;        // 0 none → 3 power-dampened (see 6.4)
  morale: number;                // 0-100, drops interrogation resistance / raises flip chance
  intelExtracted: number;        // 0-100, how much they've already given up (caps repeat value)
  resistance: number;            // current mental resistance, derived (see 5.3)

  // --- meta / consequences ---
  heat: number;                  // 0-100 political/legal exposure accrued (see 7)
  knownToPublic: boolean;        // has the capture leaked? (media)
  upkeepPerDay: number;          // $/day to hold (see 6.3)
  rescueTimer: number|null;      // game-days until faction rescue attempt fires (see 8)
  legalStatus: LegalStatus;      // jurisdiction outcome path (see 5.5)
  notes: string;                 // narrative log
}

type OriginType =
  'Skilled Human'|'Altered Human'|'Mutant'|'Tech Enhancement'|'Mystic'|
  'Alien'|'Cosmic'|'Divine'|'Construct';        // Origin_Types.csv Origin_ID 1-9

type CaptureMethod = 'KO'|'CHOKE_SUBMISSION'|'STABILIZED_DYING'|'PACIFIED_NONLETHAL'|'SURRENDER';
type LegalStatus = 'UNPROCESSED'|'HANDED_TO_HOST'|'TRADED'|'RANSOMED'|'RELEASED'|'EXTRAJUDICIAL';
```

### 3.2 `HoldingFacility` record (new)

```ts
interface HoldingFacility {
  id: string;
  type: 'BASE_BRIG'|'HOST_NATION_PRISON'|'BLACK_SITE'|'MOBILE_HOLD';
  sectorId: string;
  countryCode: string;           // host country → spine stats apply
  capacity: number;
  occupants: string[];           // prisoner ids
  baseContainmentCS: number;     // see 6.1
  powerDampener: boolean;        // restraintTier 3 capable? (tech-gated)
  upkeepPerDayBase: number;
}
```

### 3.3 `InterrogationSession` record (new — one resolution of the Force method)

```ts
interface InterrogationSession {
  id: string;
  prisonerId: string;
  investigatorId: string;        // which roster character runs it
  method: 'COERCIVE'|'PSYCHIC'|'RAPPORT'|'CHEMICAL';   // see 5.1
  resultBand: 'CRIT_FAIL'|'FAIL'|'PARTIAL'|'SUCCESS'|'MAJOR'|'CRIT_SUCCESS';
  intelGained: IntelPayload[];
  resistanceDamage: number;      // how much resistance/morale this session burned
  heatGained: number;            // legal/political fallout
  detected: boolean;
}
```

---

## 4. CAPTURE — when & how a prisoner is created (TACTICAL hook)

### 4.1 Capture-eligible end states (cited)

A combat unit becomes **capture-eligible** the moment it enters one of these states from `Combat Compendium REAL - 😢EFFECT_STATUS😴.csv` / `Injury_System.csv`:

| Eligible state | Source row | CaptureMethod |
|---|---|---|
| **Unconscious** (HP→0 via subdual, or "Knocked out") | EFFECT_STATUS line 28 "Unconscious — Knocked out" | `KO` |
| **Unconscious via submission hold** (RNC/Triangle/Guillotine) | Wrestling Sheet 4: `HOLD_RNC` "Instant KO on Major"; `HOLD_TRIANGLE`/`HOLD_GUILLOTINE` → "Unconscious" | `CHOKE_SUBMISSION` |
| **Dying, then stabilized** | Injury_System "First_Aid — Stabilize + stop bleeding, 2 AP, Medicine DC10" (line 101); status "Dying" (characterStatusSystem.ts:585) | `STABILIZED_DYING` |
| **Sleep / Frozen / Mind-Controlled** (non-lethal incapacitation) | EFFECT_STATUS lines 21 (Sleep), 22 (Frozen), 26 (Mind Controlled) | `PACIFIED_NONLETHAL` |
| **Surrender** (AI personality / low morale yields) | RULING 4.4 | `SURRENDER` |

> **RULING (4.1a):** A unit at HP 0 is **KO not dead** when the lethal blow was **subdual** (melee/unarmed with "non-lethal" toggle, stun rounds, or a hold). Lethal weapons that reduce HP to 0 roll the `Injury_System` d100 — only a **Fatal (roll 1)** or **failed death save** kills outright; any **Survivability** roll (94–100, e.g. row 99 "Unexpected KO — regain consciousness in 1d4 hours") leaves a **capturable unconscious body**. This reuses the one crit→injury pipeline (Bible ruling #2); no new table.

### 4.2 Capture action (combat overlay)

When an eligible enemy is within **1 square** of a conscious friendly unit at end of the friendly turn, a **CAPTURE** button appears on the combat overlay.

- **AP cost:** 2 AP (same as Injury_System `First_Aid` 2 AP / EFFECT_STATUS "stand/restrain" class action). **RULING (4.2a)** — restraining a body is mechanically identical cost to applying first aid.
- **Auto-success** vs Unconscious/Sleep/Frozen/Stabilized-Dying targets (they cannot resist).
- vs a **conscious Surrender** target: auto-success.
- The captured unit is removed from the enemy turn order and flagged `custody: IN_FIELD`.

### 4.3 Extraction (the JA2 "carry the body out" beat)

A captured body must **survive to the end of combat AND be extracted** to convert into a `Prisoner` record:

- A friendly unit must **end the mission on the same or adjacent square** as each IN_FIELD body, OR the squad must reach the exit/extraction zone with the body.
- Carrying a body: **−1 square movement** and **cannot fly above Z1** while carrying (one body per unit). *(RULING 4.3a — ties to Flight §5.4: you can't carry a prisoner to orbit; consistent with §5.4 altitude/STA brakes.)*
- If combat re-escalates and the body is left **adjacent to a conscious enemy** for a full enemy turn, that enemy may **free** it (it re-enters their side at restraintTier 0). *(RULING 4.3b.)*
- A **Dying** prisoner not stabilized within their death-save window dies → `custody: DEAD`, no record. (Injury_System death-save rules, §5.6.)

### 4.4 Surrender trigger (uses personality AI)

> **RULING (4.4):** A conscious enemy auto-offers **Surrender** when ALL of: HP < 25% **AND** morale-break (already in combat) **AND** their personality is in the *non-fanatic* set. Use `PERSONALITY TARGET SELECTION` personality types — fanatic/berserk/psychotic types (EFFECT_STATUS "Berserk" line 12, "Psychotic" line 13) **never** surrender. Exact personality→surrender mapping is an **OWNER-FORK** (see §11) because it's a tuning/flavor product call, not derivable from a number.

---

## 5. INTERROGATION — exact numbers, tables & formulas

Interrogation **is** an Investigation resolution (Bible §7.4) using the **Force** family of methods, run against the prisoner instead of a location.

### 5.1 Interrogation methods (cited to `Investigation_Methods.csv` + `Investigator_Skills.csv`)

| In-game method | Source method/skill | Success mod | Risk / Detection | Heat driver |
|---|---|---|---|---|
| **COERCIVE** (threats/force) | `METH_005 Force Deployment` (+3, Very High risk, 95% detection) | **+3CS** | Very High | High (torture = legal §7) |
| **PSYCHIC** (telepath reads them) | `Investigator_Skills`: *Psychic Persuasion* +4 ("Extract information from unwilling subjects"); *Psychic Blast* +2 ("break mental resistance"); *Thought Induction* +3; *Emotion Negation* +2 ("remove emotional barriers to truth") | **+2…+4CS** (by power, see table) | Low detection (no marks) but **trauma** rider | Low legal, but **morale damage** to prisoner |
| **RAPPORT** (build trust over time) | `METH_007 Diplomatic Inquiry` (+0, Very Low risk) / `METH_015 Asset Recruitment` (turn into source) | **+0CS**, slow (duration ×1.2) | Very Low | None; **raises flip chance** (§9) |
| **CHEMICAL** (truth drugs) | `Investigator_Skills`: *Medical Savant* +3; EFFECT_STATUS "Drug Influenced — Temporary stat decrease" (line 33) | **+1CS**, requires Medical career | Medium | Medium; injury risk |

Psychic power → bonus mapping (verbatim from `Investigator_Skills.csv`):
`Psychic Persuasion +4`, `Thought Induction +3`, `Psychic Blast +2`, `Emotion Negation +2`, `Bio-Energy Projection +1`, `Memory Vessel +3` (store extracted detail perfectly).

### 5.2 Investigator skill bonus

`investigatorBonusCS` = the investigator's matching power bonus from `Investigator_Skills.csv` **+** their INT rank CS (Bible §3 — INT governs investigation) **+** any country/city CS (§6). If no relevant power, COERCIVE/CHEMICAL fall back to **MEL**(intimidation) or **Medical career rank** respectively.

### 5.3 Resistance (the defender side)

```
resistance = CON_rank_CS                                  // §3.1: CON resists mental
           + threatLevelBonus  (Alpha 0; +1 per Threat Level, per Bible §4 "+5/level" initiative → here /5 as CS)
           + originResistMod                              // see 5.4
           - moraleCS                                     // low morale lowers resistance
           - injuryCS                                     // each "Critical/Severe" injury from Injury_System.csv = -1CS
           - restraintTierCS                              // power-dampened prisoners resist worse: tier3 = -3CS
```
> **RULING (5.3a):** `threatLevelBonus = floor(LeFevreLevel/1)` capped at +5, mapped onto the CS axis. Derived from Bible §4 "Threat Level → initiative bonus +5/level"; reused here as mental-resistance scaling so a Threat-5 telepath is genuinely hard to crack.
> **RULING (5.3b):** `moraleCS = (50 - morale)/10` (so morale 0 = +5CS to the interrogator; morale 100 = −5CS). Linear, mirrors the ±5CS bands already pervasive in `Country_Attribute_Effects.csv`.

### 5.4 Origin modifiers to interrogation/containment (cited `Origin_Types.csv`)

| Origin | Interrogation rider | Containment rider (see 6) |
|---|---|---|
| **Tech Enhancement** | EMP/drain disables built-in defenses → **+2CS** PSYCHIC/CHEMICAL once dampened | "EMP vulnerability" → power-dampener trivial (tier-3 cheap) |
| **Construct** | "may lack CON" → **+2CS** but **immune to CHEMICAL** (no biology) | "specific shutdown methods" → can be fully powered-off (auto tier-3) |
| **Mutant** | "emotional/psychological triggers" → **+1CS** PSYCHIC | standard |
| **Mystic** | "magic has rules/counters" → PSYCHIC **−2CS** unless counter known | needs warded cell (RULING: black-site only) |
| **Alien** | "+2 threat (xenophobia)"; unfamiliar physiology → CHEMICAL **−2CS** | environmental weakness exploitable |
| **Cosmic / Divine** | "too powerful to relate to" → interrogation **−3CS**; often un-capturable below Threat-4 facility | requires highest containment; see 6.5 |
| **Skilled Human** | no power defenses → COERCIVE **+1CS** | trivial containment |

### 5.5 Resolution & outcome bands (cited `Universal_Table_FIXED` + `Investigation_Consequences.csv`)

1. `finalCS = investigatorBonusCS + methodCS − resistance + countryCityCS`
2. Roll **d100** on `Universal_Table_FIXED` (Bible §3.3; 99 always Fail, 00 always Major).
3. Map outcome to `Investigation_Consequences.csv` success bands:

| Band (Consequences.csv) | % | Intel result | Side effects |
|---|---|---|---|
| **Critical Success** | 95-100 | "Complete target intelligence; future plans revealed"; **2-3 new investigations unlock** | morale −30, resistance broken |
| **Major Success** | 80-94 | "Primary objective + bonus intel"; **1-2 investigations** | morale −20 |
| **Success** | 60-79 | "Primary objective achieved"; **1 investigation** | morale −10 |
| **Partial Success** | 40-59 | "Incomplete intelligence; missing key details" | morale −5 |
| **Failure** | 20-39 | "Minimal useful intel"; **subsequent sessions harder** (−1CS) | prisoner gains +5 morale (defiance) |
| **Critical Failure** | 0-19 | "False intelligence; compromised operation" — **plants a false lead** (bad mission) | injury/death risk on COERCIVE (see 5.6) |

Each prisoner has a finite **intel pool**: `intelExtracted` rises by band value; once ≥100 they yield only repeat/low-value chatter (−3CS, no new investigations). *(RULING 5.5a — prevents one prisoner being an infinite intel faucet; mirrors `Investigation_Consequences` "Investigation becomes harder".)*

### 5.6 COERCIVE damage & death risk

COERCIVE and CHEMICAL deal real harm. On **Critical Failure** (or on each COERCIVE session beyond the 3rd), roll `Injury_System.csv` with **Crushing_Damage −15** trigger modifier (line 89). A **Fatal/Critical** result can **kill the prisoner** (`custody: DEAD`) — losing all future intel and spiking heat (Public_Perception "Civilian_Casualties" class if leaked). PSYCHIC deals **morale/resistance** damage only (trauma rider, no HP) unless `Psychic Blast` Major → EFFECT_STATUS "Stunned" + 1 injury roll.

---

## 6. CONTAINMENT — holding & the facility math

### 6.1 Base containment by facility type (RULING, traced to Player_Scaling + Country_Attribute_Effects)

`Player_Scaling.csv` defines the legal/handling line per enemy tier ("Capture and **LSW containment facility**", "International tribunal; prisoner exchange", etc.). It does **not** give a containment number, so:

> **RULING (6.1):** `baseContainmentCS` by facility type (on the same ±CS axis as everything else):
> - `MOBILE_HOLD` (squad/vehicle) = **0 CS** (temporary only; auto-escalates escape risk)
> - `HOST_NATION_PRISON` = **+2 CS** (you don't control it — see 6.2 leak risk)
> - `BASE_BRIG` (your base, baseSystem.ts facility) = **+3 CS**
> - `BLACK_SITE` (corruption-gated, see 6.2) = **+3 CS** and **legally invisible** (no heat from the *holding*, only from the *act*)
> Numbers chosen to sit inside the established Light/Medium/Heavy cover band (+1/+2/+3, `Tactical_Grid_System`/Bible §5.3) so the design uses one CS vocabulary.

### 6.2 Spine-gated facility access (CONSUMES combined-effects, per Bible ruling #9)

- **BLACK_SITE availability** uses the **Safe Houses** combined system (Bible §8): `Corruption + (100−Law) + (100−Intel)`. A black site is available in a sector only if that score ≥ a threshold. **RULING (6.2a): threshold = 150** (sum of three 0-100 stats; ~mid). Sources: country `GovermentCorruption` (col 11), `LawEnforcement` (col 20), `IntelligenceServices` (col 16) from `World Bible - Country.csv`.
- **HOST_NATION_PRISON leak/escape risk** scales with host **LawEnforcement** (high law = secure, low law = "lose" the prisoner cheaply but they may be freed by bribed guards): `weeklyLeakChance = clamp((60 − lawEnforcement)/2, 0, 40)%`. **RULING (6.2b)**, anchored to `Country_Attribute_Effects.csv` GovernmentCorruption "High corruption: +3CS bribes" — a corrupt low-law prison is a sieve.

### 6.3 Upkeep ($/day) — CONSUMES economy spine

```
upkeepPerDay = base[facilityType]
             × (1 + restraintTier × 0.5)          // power-dampening is expensive
             × hostCostMultiplier                  // host GDPPerCapita band
```
> **RULING (6.3):** `base` = { MOBILE_HOLD 0, HOST_NATION_PRISON 200, BASE_BRIG 500, BLACK_SITE 1000 } per day. Chosen to read against `Player_Scaling.csv` funding bands ($5K–15K at tier 1 up to $2M+ at tier 6) so holding a power-dampened cosmic prisoner is a tier-5+ budget item, not a tier-1 one. `hostCostMultiplier` = GDPPerCapita band (low 0.6 / mid 1.0 / high 1.5), reusing the Medical/`Public_Perception` cost-by-wealth pattern.

### 6.4 Restraint tiers & power-dampening

| Tier | Name | Effect | Gate |
|---|---|---|---|
| 0 | None | prisoner can use powers if they escape; resists interrogation normally | — |
| 1 | Physical restraints | blocks Melee/wrestling escape; −0CS interrogation | any facility |
| 2 | Suppressants (CHEMICAL) | EFFECT_STATUS "Drug Influenced" → stat decrease; powers −2CS | Medical career on staff |
| 3 | **Power-dampener** | EFFECT_STATUS "power-dampened/drained" (Bible §5.7 meta suite); powers OFF; resistance −3CS | tech tree (`Tech_Gadgets`/Research) + facility `powerDampener:true` |

> **RULING (6.4):** Tier-3 dampener for **Construct/Tech** origins is **auto** (Origin_Types "shutdown methods"/"EMP vulnerability"); for **Mystic/Cosmic/Divine** it requires a black site / advanced research project (their containment is the §11 OWNER-FORK on end-game scope).

### 6.5 Threat-cap gate (cited `Player_Scaling.csv`)

A facility can only hold a prisoner whose **Threat Level ≤ the player's tier `Threat_Level_Cap`** (Player_Scaling col `Threat_Level_Cap`: tier1 ≤ THREAT_1 … tier6 THREAT_5+). Holding above-cap → containment degrades each day (`containmentRating −1CS/day`) until **escape** (§8). This is *why* a street operative can't keep a cosmic entity in a county jail.

---

## 7. HEAT — the legal/political consequence meter (CONSUMES §9 + spine)

`heat` (0-100) accrues from how & where you hold/interrogate, and converts to `Public_Perception.csv` events when it leaks or crosses thresholds.

`heatGainedPerSession`:
| Method | Base heat | Modifier |
|---|---|---|
| COERCIVE (torture) | +15 | ×(MediaFreedom/50) — free press amplifies |
| CHEMICAL | +8 | ×(MediaFreedom/50) |
| PSYCHIC | +5 | ×(LSWRegulations factor) |
| RAPPORT | +0 | — |

Holding heat (per day) `+= (knownToPublic ? extrajudicialDailyHeat : 0)`.

**Spine consumption (cited `World Bible - Country.csv` + `Country_Attribute_Effects.csv`):**
- **MediaFreedom (col 19):** high → heat amplified, brutal acts surface fast (Country_Attribute_Effects "Free media: −2CS cover-ups"). Low → you can suppress (propaganda +2CS).
- **LSWRegulations (col 34) / Vigilantism (col 35):** `Banned/Regulated/Legal`. **Banned** host nation → capturing/holding an LSW yourself is itself a crime: **−3CS public operations; +2CS if caught as victim** (Country_Attribute_Effects line 27). **Legal** → you may hold openly (+2CS public support).
- **CapitalPunishmentType (col 18):** `Active/Rare/Inactive` (note: some rows store a 0-100 number — see schema note §10.3). **Active** → handing a prisoner to the host can mean **execution** (rep swing depends on prisoner's public sympathy, Origin_Types Public_Perception_Modifier). **Inactive** → no execution path.
- **GovernmentCorruption (col 11):** high → **bribe to bury heat** (`Country_Attribute_Effects` "+3CS bribes/blackmail"): spend money, reduce heat. Low → no bury option.

**Heat → Public_Perception event mapping (cited `Public_Perception.csv`):**
| Heat threshold / trigger | Event row | Effect |
|---|---|---|
| Torture leaks in free-press democracy | `War_Crimes_Accusation` / `Lawsuit_Constitutional` | rep −, ICC proceedings, legal $10M-100M |
| Prisoner dies in custody, leaks | `Civilian_Casualties_*` class | rep −5…−10, wrongful-death suit |
| Extrajudicial holding exposed | `Government_Cover_Up` / `International_Treaty_Violation` | secrecy costs, treaty fallout |
| Clean hand-to-host of a wanted criminal | `Street_Crime_Stopped` / `Heroic_Recognition` (scaled by threat) | rep +, reward |

---

## 8. ESCAPE & RESCUE (failure-mode engine)

### 8.1 Escape check (per day, per held prisoner)

```
escapeChance% = base[custody]
              + (prisonerThreatCS − containmentRating)×3        // over-cap prisoners climb fast
              + powerEscapeMod                                  // un-dampened powers (Teleport/Phase = +large)
              − restraintTier×8
escape if roll(d100) < escapeChance
```
`base` = { IN_FIELD 25, IN_TRANSIT 15, MOBILE_HOLD 10, HOST/BRIG/BLACK 2 }. **RULING (8.1)** — values chosen so a properly-dampened in-brig prisoner almost never escapes (≈2%/day) while a body left in the field is a real liability (~25%/day), reproducing the JA2 tension. `powerEscapeMod`: powers with `Teleport`, `Intangible Phasing`, `Spatial Blink`, `Technopathy` (vs electronic locks) add **+30** unless restraintTier ≥ 2.

On escape: `custody: ESCAPED`, prisoner returns to world/faction pool, **faction relations −1** (you embarrassed them by losing their asset), generates a **revenge/"they're loose" news + mission** (criminalNewsBridge.ts hook).

### 8.2 Faction rescue mission (cited Faction systems)

When a prisoner with `factionId != null` is held > `rescueTimer` days, their faction launches a **rescue mission** targeting your holding facility's sector:
- `rescueTimer` = `clamp(14 − factionStrength/10, 3, 14)` game-days. **RULING (8.2)** — stronger/closer factions come faster. Reads `factionSystem.ts` standings.
- Rescue is a generated combat mission (missionGeneration.ts) at the facility sector; success frees the prisoner, failure raises your standing and the prisoner's heat.

### 8.3 Other failure modes (explicit)

- **Prisoner dies in interrogation** (§5.6) → lose intel, heat spike if leaks.
- **You can't afford upkeep** → forced choice modal: release (rep neutral, intel lost), hand-to-host (cleanup), or "conditions deteriorate" (morale/health drop, escape risk up).
- **Capture above threat-cap** (§6.5) → containment decays → near-certain escape; the game **warns** at capture time ("This facility cannot safely hold a Threat-N").
- **Mystic prisoner in non-warded cell** → escape +20%/day until moved to black site.
- **Public sympathy backfire**: handing a low-threat *Altered Human* ("often seen as victims", Origin_Types −1 threat / sympathy) to an `Active` capital-punishment state → rep **loss** not gain.

---

## 9. RECRUIT — break-and-turn (the FIST prisoner-database payoff)

Per FIST GDD §303/§538 ("formerly or currently imprisoned Super Criminals" are a recruit source) and Bible §7.3, a held prisoner can be **flipped** onto your roster.

**Flip eligibility & chance:**
```
flipChance% = 20                                   // base
            + (50 − morale)/2                       // broken prisoners flip easier  → up to +25
            + rapportSessions×5                     // RAPPORT method invests trust  (METH_015 Asset Recruitment)
            + factionHostilityBonus                 // they hate their own faction (relations-driven)
            + originLoyaltyMod                       // Skilled Human +10 (mercenary); Divine/Cosmic −30 (won't serve)
            − threatLevelPenalty                    // higher threat = harder to turn (−5 per level)
flip if a RECRUIT attempt rolls Universal_Table_FIXED Success+ at finalCS derived from flipChance band
```
> **RULING (9.1):** A flip attempt is a single **Asset Recruitment** resolution (`METH_015`, +0 mod, "turn local contacts into permanent intelligence sources" — here permanent *roster*). Requires `morale ≤ 30` **OR** `rapportSessions ≥ 3`. On success, create a `RecruitableCharacter` from the prisoner's `stats/origin/powers/threatLevel/nationality` (the interface already exists, recruitableCharacters.ts:2) and set `custody: RECRUITED`. A flipped recruit carries a **loyalty risk** flag (small per-week chance to betray/leave if your fame drops — reuses characterLifeCycle.ts).
> **OWNER-FORK:** whether flipped super-criminals are **fully trusted roster members or "on probation"** (escorted, can't solo) is a product/tone call — see §11.

**Process alternatives (non-recruit):**
- **Hand to host government** → `legalStatus: HANDED_TO_HOST`; rep per `Public_Perception` (positive for wanted criminals, scaled by threat); clears upkeep & heat. Host must have `LSWRegulations != Banned` to accept openly (else covert handoff, partial credit).
- **Trade to rival faction** → relations + favor token (factionSystem.ts); they may use the prisoner against you later.
- **Ransom** → cash from prisoner's faction; relations −1 with everyone who sees it as weakness.
- **Release** → rep neutral/positive (mercy), but the prisoner re-enters the world and may reoffend.

---

## 10. Data plumbing & schema notes

### 10.1 Reads
- `allCountries.ts` (canonical, Bible ruling #10): `governmentCorruption, lawEnforcement, intelligenceServices, mediaFreedom, lswRegulations, vigilantism, cloning, capitalPunishment, gdpPerCapita, science, healthcare` (interface confirmed at allCountries.ts:7-45).
- `allCities.ts`: `crimeIndex`, `cityType*` (Seaport/Military affect black-site & interrogation CS via `City_Type_Effects.csv`).
- `Origin_Types.csv` / `Origin_Damage_Interactions` for containment & interrogation riders.
- `factionSystem.ts` standings; `baseSystem.ts` for BASE_BRIG facility; combat scene end-state for capture.

### 10.2 Writes
- New `Prisoner[]`, `HoldingFacility[]`, `InterrogationSession[]` collections in `enhancedGameStore.ts`.
- Intel payloads → `investigationSystem.ts` (unlock new investigations) and `missionGeneration.ts` (mission leads).
- Heat → `Public_Perception` events → fame/reputation in store; news via `criminalNewsBridge.ts`/NewsBrowser.
- Recruit → `RecruitableCharacter` into the roster.

### 10.3 Schema gotcha (must handle)
The raw `World Bible - Country.csv` stores **`Cloning`, `LSWRegulations`, `Vigilantism`, `CapitalPunishmentType` inconsistently** — some rows are categorical (`Banned/Regulated/Legal`, `Active/Rare/Inactive`) and some are **numeric 0-100** (verified: e.g. `Cloning:20`, `LSWREG:34`, `VIG:29`, `CapitalPunishment:40`). The canonical `allCountries.ts` already types these as `string`. **RULING (10.3):** treat numeric values via band: `<35 = Banned/Inactive`, `35–65 = Regulated/Rare`, `>65 = Legal/Active` (matching the `Country_Attribute_Effects.csv` Low/Medium/High 0-35/36-65/66-100 bands). Normalize on load; never branch on raw type at call sites.

---

## 11. OWNER-FORK notes (genuine product choices)

1. **Personality → surrender mapping (§4.4):** which of the 20 `PERSONALITY TARGET SELECTION` types surrender vs fight-to-the-death is a tone/flavor decision, not a derivable number. Owner must assign each personality a surrender disposition.
2. **Flipped-criminal trust level (§9):** are turned super-criminals full roster members or permanently "on probation" (supervised, betrayal risk)? Affects whether capture-and-flip is a *core* progression path or a risky edge play.
3. **Torture-as-mechanic tone & rating:** COERCIVE/torture is in the source data (`Force Deployment` 95% detection; `Psychic Blast` "causes trauma"). How explicit/punished it is (and whether an "ethical mode" disables it) is a content-rating and brand call.
4. **Cosmic/Divine capturability:** can the player ever cage a Threat-5 Cosmic/Divine being, and what end-game research/black-site unlocks it? This defines whether prisoners stay a mid-game system or scale to the finale.
5. **Player-character capture (reciprocity):** can the *enemy* capture **your** heroes (mirror of this system) and force a rescue/ransom/Time-Walker rewind? Big scope decision touching the diegetic-save system (Bible §11).
6. **Cloning interaction:** if a captured prisoner is executed by a host with `Active` capital punishment but their nation has high `Cloning`, do they come back (Bible §8 cloning resurrection)? Owner decides if cloning resurrects *enemies*, not just the player's team.

---

## 12. Open questions

- Does interrogated intel **expire** (timeliness) the way `Investigation_Consequences` "Timeline_Impact" implies, or is it permanent once extracted?
- Should **HVT** cities (`allCities.ts` HVT flag) host special high-security federal prisons with higher `baseContainmentCS`?
- Multi-prisoner **interactions** (cellmates from rival factions → intel or violence)? Deferred; flag for a v2.
- How does capture interact with the **multiplayer stub** (Bible §11 other-dimension) — can a prisoner be traded across the dimensional/MP boundary? Architectural note only; do not design now.

---

## 13. Build checklist (zero-follow-up implementation order)

1. Add `Prisoner`, `HoldingFacility`, `InterrogationSession` types + store collections.
2. Combat overlay: detect capture-eligible end states (§4.1) → CAPTURE action (2 AP) → IN_FIELD flag → extraction conversion (§4.3).
3. Country/city normalization loader (§10.3) for legal/cloning/reg fields.
4. Facility resolver: `baseContainmentCS` (§6.1), black-site gate via Safe-Houses score (§6.2a), upkeep (§6.3), threat-cap gate (§6.5).
5. Interrogation resolver: `finalCS` (§5.1-5.5) on `Universal_Table_FIXED`, outcome→Consequences bands, intel-pool cap, COERCIVE injury risk (§5.6).
6. Heat accrual + `Public_Perception` event mapping (§7); media/corruption/regs spine consumption.
7. Daily tick: upkeep charge, escape check (§8.1), rescue-timer & mission fire (§8.2).
8. Process actions: hand-to-host / trade / ransom / release / **flip-recruit** (§9) → `RecruitableCharacter`.
9. Personnel UI: prisoner database tab (§14 below).

---

## 14. UI / UX hooks

- **Combat overlay (Tactical):** a **CAPTURE** button on downed/submitted adjacent enemies; a "carrying prisoner" icon + movement penalty; an end-of-mission "Prisoners extracted: N" summary. A warning badge if the target's Threat Level exceeds your facility cap.
- **Phone / push (the "living world that talks to you"):** a priority alert when a faction rescue mission spawns ("They're coming for [alias]"), when a prisoner escapes, or when an interrogation leak triggers a `War_Crimes_Accusation`. Surfaced as `Email_Investigation_Templates`-style inbox items (e.g. an EYES-ONLY interrogation brief mirroring `EMAIL_003`).
- **Laptop → Personnel app (§7.3 prisoner database):** the prisoner roster table — alias, origin, threat, custody, facility, heat meter, upkeep/day, intelExtracted bar, restraintTier, rescue countdown. Row actions: **Interrogate / Process / Recruit / Move facility / Release**. Interrogation opens a modal showing method choice (COERCIVE/PSYCHIC/RAPPORT/CHEMICAL) with predicted `finalCS`, detection %, and heat preview before commit.
- **World map overlay:** holding-facility sectors flagged; black-site availability shown only in sectors where the Safe-Houses score qualifies; rescue-mission markers when a timer fires.
- **News (BNN/ANN):** custody deaths, torture leaks, and clean hand-offs generate news items (rep deltas visible), per `Public_Perception` + criminalNewsBridge.ts.

---

## 15. Integration points (reads / writes summary)

| System | Reads | Writes |
|---|---|---|
| Tactical combat (`CombatScene`) | unit end-state (Unconscious/Dying/Submitted) | capture flag, IN_FIELD bodies |
| Investigation (§7.4) | investigator skills/powers, country/city CS | new investigations unlocked from intel |
| Mission generation | intel payloads | mission leads; faction rescue missions |
| Faction system | standings, faction strength | relations deltas on escape/trade/ransom |
| Economy | funding bands (`Player_Scaling`) | daily upkeep charges |
| Public_Perception/Fame | MediaFreedom, LSWRegs, CapitalPunishment, Corruption | reputation events, legal costs |
| Base system | base facilities | BASE_BRIG holding facility |
| Recruiting | `RecruitableCharacter` interface | flipped prisoners onto roster |
| News | heat events | custody-related news items |
| Hospital/Injury | carried injuries, Dying state | death-in-custody outcomes |
| Cloning (§8 spine) | host `cloning` stat | (OWNER-FORK) enemy resurrection |
```
