# 07 — Character Model & Data Schema

> **System owner doc.** Build-ready spec for the SuperHero Tactics (SHT) character: primary stats, derived stats, origins, threat level, skills, talents, martial arts, identity, health, and how the character is computed against the geopolitical **spine**.
>
> **Status:** spec. Aligns with existing code in `MVP/src/data/characterSheet.ts` + `characterStatusSystem.ts` + `personalitySystem.ts`; this doc is the canonical schema those files must converge on.
>
> **Bible alignment:** `SHT_MECHANICS_BIBLE.md` §4 (Character Model), §3 (Universal Table), §13 (rulings), §14 (data→table map). Honors: NO XP leveling (§13.8); one rank ladder (§13.7); combined-effects must be consumed (§13.9); unify on `allCountries`+`allCities` (§13.10).
>
> **Sourcing rule:** every number below cites a source table. A value with no table is marked `RULING:` (a Bible-consistent design call) or `OWNER-FORK:` (a product choice only the owner makes). Source files live under `docs/csv-source-data/` and `docs/csv-source-data/Game_Mechanics_Spec/` (abbrev. **GMS/**) and `SuperHero Tactics/` (abbrev. **SHT-dir/**).

---

## 1. Overview & player fantasy

You run a government org (FIST or a rival faction) and your roster is a stable of **mercenaries and Living Super Weapons (LSWs)** — JA2 mercs with superpowers. The character model is the data behind *"the characters you care about"* (Bible Pillar #2): each unit has a personality that drives its combat AI and idle behavior, an origin that changes how it bleeds and burns, a threat level that gates where it can fight, injuries that scar permanently, and a hometown it gets a morale boost in.

A character is **~55 fields in nine groups** (Bible §4, `Complete_Character_Sheet.csv`). The same `Character` object is consumed by:
- **Combat** (the 4CS Universal Table — stats become to-hit columns; origin gates status effects).
- **The phone/laptop** (Personnel app — roster sheet, relationships, obituaries).
- **The world map** (threat level gates mission tier; nationality + current country drive the spine modifiers).
- **The investigation/economy loop** (skills add ±CS; career gates tech).

**One ruling up front (Bible §13.8):** characters do **not** level up. They improve only via **training** (which *erodes* without upkeep) and gain **one** extra power via the Time Chain. There is **no XP-to-level pool**. (The legacy `Experience_Points / XP` row in `Complete_Character_Sheet.csv` line 52 and the `level_up` morale event in `characterSheet.ts:772` are **deprecated** — see §10.)

---

## 2. Data schema (fields / types)

TypeScript-flavored canonical schema. Field groups match `Complete_Character_Sheet.csv` (9 `Attribute_Category` groups) and the `Character_Template.csv` section order. Types in `()` cite their source table.

```ts
// ============================================================================
// CharacterModel — canonical record (~55 fields, 9 groups)
// Source: Complete_Character_Sheet.csv (groups), Character_Template.csv (order)
// ============================================================================
interface CharacterModel {
  id: string;                       // stable uuid

  // --- GROUP 1: IDENTITY (Personal_Identity rows, Complete_Character_Sheet.csv:14-19) ---
  identity: {
    realName: string;               // NAME_REAL (text)
    codeName: string;               // NAME_CODE (text) — public reputation key
    secretIdentity: boolean;        // SECRET_ID (bool) — maintains civilian life?
    age: number;                    // AGE (15-80+) — gates stat min/max
    nationality: string;            // NATIONALITY — ISO country code (allCountries key; §13.10)
    currentLocationId: string;      // LOCATION — current city id (allCities key)
    homeCityId?: string;            // hometown — morale bonus when present (RULING, §5.6)
    handedness: 'left' | 'right';   // RULING: 90% right (characterSheet.ts:1405)
    birthday: { month: number; day: number; zodiacSign: string };
  };

  // --- GROUP 2: PRIMARY STATS (7) (Primary_Stats_Spec.csv:2-8) ---
  stats: {                          // raw integer values 1-150+ (Character_Template.csv:11-17)
    MEL: number; AGL: number; STR: number; STA: number;
    INT: number; INS: number; CON: number;
  };

  // --- GROUP 3: LSW CLASSIFICATION (Complete_Character_Sheet.csv:9-13) ---
  classification: {
    characterType: CharacterType;   // derived from origin (characterSheet.ts:45)
    origin: OriginType;             // ORIGIN (1 of 9) (Origin_Types.csv:2-10)
    threatLevel: ThreatLevel;       // THREAT (Alpha..L5/Cosmic) (Stat_Rank_Mapping.csv:7-19)
    // Threat scoring lenses (LeFevre) — see §4.3
    pcf?: number;                   // (I*C*E)/1000 (SHT-dir/SHT__Origins...txt:144)
    stam?: number;                  // 0.3P+0.4M+0.3H  (idem:173)
    spam?: number;                  // 0.2S+0.2P+0.3A+0.3M (idem:206)
  };

  // --- GROUP 4: POWERS (0-3 base + 1 via Time Chain) (Complete_Character_Sheet.csv:11-13) ---
  powers: CharacterPower[];         // count capped by threatLevel.maxPowers (§4.2)

  // --- GROUP 5: SKILLS / TALENTS / MARTIAL ARTS ---
  skills: CharacterSkill[];         // SKILLS_* (Complete_Skills_Talents.csv, type=Combat)
  talents: CharacterSkill[];        // (Complete_Skills_Talents.csv, type=Talent/Physical)
  martialArts: MartialArtsTraining; // (Wrestling_Martial_Arts_Complete.csv; characterSheet.ts:1189)

  // --- GROUP 6: PERSONALITY & EMOTIONS (drives AI + idle) ---
  personality: {
    typeId: PersonalityTypeId;      // 1 of 20 (PERSONALITY TARGET SELECTION.csv)
    targetPreference: TargetPref;   // derived from typeId (§6.2)
    // STAM inputs (1-10) (Complete_Character_Sheet.csv:45-47)
    personalityRating: number;      // PERSONALITY 1-10 (volatility)
    motivationRating: number;       // MOTIVATION 1-10 (moral compass)
    harmPotentialRating: number;    // HARM_POTENTIAL 1-10
  };

  // --- GROUP 7: CAREER & EDUCATION (Complete_Character_Sheet.csv:20-23) ---
  career: {
    careerPath: CareerCategory;     // CAREER (1 of 7) (Education_Career_Complete.csv)
    careerRank: number;             // CAREER_RANK 1-5
    educationLevel: number;         // EDUCATION 1-5 (gates research/tech, §9)
    specialization?: string;
  };

  // --- GROUP 8: HEALTH / INJURIES / STATUS (Complete_Character_Sheet.csv:41-44) ---
  health: CharacterHealthStatus;    // HP, injuries, status (characterStatusSystem.ts)
  mentalState: MentalState;         // MENTAL — stress/trauma (§7.4)

  // --- GROUP 9: RELATIONSHIPS / REPUTATION / BACKGROUND ---
  contacts: Contact[];              // CONTACTS (characterSheet.ts:683)
  factionStandings: FactionStanding[]; // FACTION_STAND
  reputation: Reputation;           // PUBLIC_REP + criminal record (characterSheet.ts:715)
  cityFamiliarity: CityFamiliarityEntry[]; // per-city knowledge (characterSheet.ts:704)
  morale: MoraleState;              // JA2 merc morale (characterSheet.ts:729)
  fatigue: FatigueState;            // (characterSheet.ts:1415)
  employment: Employment;           // contract & pay (characterSheet.ts:827)
  combatRecord: CombatRecord;       // kill log + scrutiny (characterSheet.ts:879)
  background: {
    appearance: string; backstory: string;
    motivations: string; criminalRecord: boolean;
    militaryService?: string;
  };

  // --- DERIVED (computed, never stored authoritative) — see §4.1 ---
  derived?: DerivedStats;           // recompute on stat/age/injury change
}
```

### 2.1 Enums (exact members, cited)

```ts
// CharacterType (characterSheet.ts:45 — code truth, keep)
type CharacterType = 'normal' | 'lsw' | 'mutant' | 'synthetic' | 'alien' | 'cosmic';

// OriginType — 9 origins. (Origin_Types.csv:2-10 is the design truth.)
// NOTE: code uses an alternate 9-set (characterSheet.ts:51-60). See §4.4 reconciliation.
type OriginType =
  | 'skilled_human' | 'altered_human' | 'mutant' | 'tech_enhancement'
  | 'mystic' | 'alien' | 'cosmic' | 'divine' | 'construct';

// ThreatLevel — (Stat_Rank_Mapping.csv:7-19 Threat_Level column)
type ThreatLevel = 'alpha' | 'level_1' | 'level_2' | 'level_3' | 'level_4' | 'level_5' | 'cosmic';

// PersonalityTypeId 1..20 (PERSONALITY TARGET SELECTION.csv)
type PersonalityTypeId = 1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17|18|19|20;
type TargetPref = 'most_health' | 'least_health' | 'major_threat' | 'minor_threat' | 'random';

// CareerCategory — 7 (Bible §7.6; Education_Career_Complete.csv)
type CareerCategory = 'medical' | 'arts' | 'liberal_arts' | 'engineering'
  | 'business' | 'psychology' | 'physical';
```

---

## 3. Exact numbers / tables / formulas

### 3.1 Primary stats → rank ladder (THE one ladder)

**Source: `Stat_Rank_Mapping.csv:2-19`** (rank, min, max, threat, lift). This is the single ladder for stat→rank, strength→lift, knockback→distance, throw range (Bible §13.7). `characterSheet.ts:354` `getStatRank()` already implements this — keep it as the implementation, this table is the data of record.

| Rank | Min | Max | Threat tier | Lift capacity (lb) |
|---|---:|---:|---|---|
| Shift 0 | 0 | 0 | None | 0 |
| Feeble | 1 | 2 | None | 50–60 |
| Poor | 3 | 5 | None | 80–120 |
| Typical | 6 | 10 | None | 140–220 |
| Good | 11 | 20 | None | 240–400 |
| Excellent | 21 | 30 | **Alpha** | 425–800 |
| Remarkable | 31 | 40 | **Threat 1** | 900–2,200 |
| Incredible | 41 | 50 | **Threat 2** | 2,500–22,400 |
| Amazing | 51 | 75 | **Threat 3** | 25,000–50,000 |
| Monstrous | 76 | 100 | **Threat 4** | 50,000–100,000 |
| Unearthly | 101 | 150 | **Threat 5** | 100,000–500,000 |
| Shift X | 151 | 250 | Earthshaker | 500,000–1,000,000 |
| Shift Y | 251 | 500 | Earthbreaker | 1M–5M |
| Shift Z | 501 | 1,000 | Eartheater | 5M–10M |
| Class 1000 | 1,001 | 2,500 | Sunbreaker | Planetary |
| Class 3000 | 2,501 | 5,000 | Suneater | Stellar |
| Class 5000 | 5,001 | 10,000 | Omnipotent | Galactic |
| Beyond | 10,001 | 999,999 | Beyond | Universal |

> `RULING:` The `Stat_Rank_Mapping` ladder's Threat-tier column is the **canonical mapping from a unit's highest combat stat/power to its Threat Level for AUTO-CLASSIFICATION** (Excellent→Alpha … Unearthly→L5). The narrative scale in `SHT-dir/SHT__Origins,Threat...txt:515-597` (Grey-encounter count) is **lore flavor only**, not a mechanical input. Bible-consistent with §3.2 ("one scale to rule them all").

### 3.2 The 7 stats — what each governs (Primary_Stats_Spec.csv:2-8)

| Code | Name | Combat to-hit / role | Investigation role | +CS skill source |
|---|---|---|---|---|
| **MEL** | Melee | Hit roll for melee/unarmed | Interrogation, physical evidence | Martial Arts +CS |
| **AGL** | Agility | Dodge, initiative, ranged hit | Stealth, escape, pursuit | Acrobatics/Dodge +CS |
| **STR** | Strength | Melee damage, knockback, grapple | Break/move heavy evidence | Super Strength +CS |
| **STA** | Stamina | Max health, resist status | Stakeouts, torture resistance | Durability +CS |
| **INT** | Intelligence | Tactics, device op, weak-point | **Primary** investigation stat | Science/Engineering +CS |
| **INS** | Instinct | Initiative, detect ambush/hidden | Reading people, hidden clues | Perception/Detective +CS |
| **CON** | Concentration | Resist mind control, sustain powers | Resist interrogation, psychic | Psychic attack stat |

### 3.3 Stat interactions & derived stats — exact formulas

**Source: `Primary_Stats_Spec.csv:11-26`** (`---STAT INTERACTIONS---` and `---DERIVED STATS---` blocks).

| Derived | Formula | Source |
|---|---|---|
| **Health** | `STA*2 + STR` | Primary_Stats_Spec.csv:22; Character_Template.csv:20 |
| **Initiative** | `(AGL+INS)/2 + mods` | Primary_Stats_Spec.csv:23 |
| **Karma** (luck/reroll) | `(INT+INS+CON)/3` | Primary_Stats_Spec.csv:24 |
| Combat Power | `MEL for hit + STR for damage` | Primary_Stats_Spec.csv:12 |
| Reflexes (init) | `max(AGL,INS)` sets initiative column | Primary_Stats_Spec.csv:13 |
| Physical Power | `(STR+STA)/2` for physical feats | Primary_Stats_Spec.csv:14 |
| Awareness (invest.) | `(INT+INS)/2` for investigation checks | Primary_Stats_Spec.csv:15 |
| Melee Defense | `AGL+INS` → dodge CS column | Primary_Stats_Spec.csv:16 |
| Ranged Defense | `AGL` alone → dodge CS | Primary_Stats_Spec.csv:17 |
| Resistance | `(CON+STA)/2` for torture/endurance | Primary_Stats_Spec.csv:18 |

> ⚠️ **CONTRADICTION FLAGGED — Health formula.** Source data says `Health = STA*2 + STR` (Primary_Stats_Spec.csv:22, Character_Template.csv:20). Code computes `Health = MEL+AGL+STA+STR` (`characterSheet.ts:398`). These disagree.
> `RULING:` **Ship the source-data formula `Health = STA*2 + STR`.** It is the value of record in two source tables and the Bible (§3.1: "Health = STA×2 + STR"). The code's 4-stat version is a drift and must be corrected. Worked example: the canonical example character "Granite" (STR 65, STA 70) → `70*2+65 = 205` HP, matching `Character_Template.csv:94`. (The 4-stat code formula would give `35+25+70+65 = 195`, which does **not** match the source sheet — confirming the code is wrong.)

### 3.4 Dodge column-shift table (AUTHORITATIVE)

**Source: `SHT-dir/Combat Compendium REAL - 🦆DODGE CHART🦆.csv`.** This is the table of record — it has **two columns**: **ranged dodge by AGL alone** (left block) and **melee dodge by AGL+INS** (right block, "Actual Melee Dodge system"). Values are **negative CS = the defender is harder to hit** (a penalty applied to the *attacker's* to-hit column). Higher dodge stat → larger negative CS → harder to hit. Verbatim:

**Ranged dodge (AGL only):**

| AGL | Dodge CS (vs attacker) | Tier |
|---|---:|---|
| 1–9 | None (0) | Little Human |
| 10–19 | −2CS | Above-Avg Human |
| 20–29 | −3CS | Exceptional Human |
| 30–39 | −4CS | Max Human (Alpha) |
| 40–49 | −5CS | Low Superhuman (L1) |
| 50–59 | −6CS | Superhuman (L2) |
| 60–69 | −7CS | Superhuman (L3) |
| 70–79 | −8CS | Superhuman (L4) |
| 80–99 | −9CS | High Superhuman (L5) |
| 100–149 | −10CS | Low Cosmic |
| 150–250 | −11CS | Cosmic |
| 250–500 | −12CS | High Cosmic |
| 500–999 | −13CS | Supreme Cosmic |
| 1000–1499 | −14CS | Deity |

**Melee dodge (AGL+INS):**

| AGL+INS | Dodge CS (vs attacker) |
|---|---:|
| 1–19 | None (0) |
| 20–39 | −1CS |
| 40–59 | −2CS |
| 60–79 | −3CS |
| 80–99 | −4CS |
| 100–119 | −5CS |
| 120–139 | −6CS |
| 140–169 | −7CS |
| 170–199 | −8CS |
| 200–299 | −9CS |
| 300–499 | −10CS |
| 500–999 | −11CS |
| 1000–1999 | −12CS |
| 2000–4999 | −13CS |
| 5000–9999 | −14CS |

> ⚠️ **CONTRADICTION RESOLVED + code bug.** The chart confirms Granite's example: AGL 25 → ranged −3CS (`Character_Template.csv:98` `Dodge_CS_Ranged=-3CS` ✓); AGL+INS=45 → melee −2CS — but `Character_Template.csv:97` lists `-3CS` for melee, an **off-by-one-tier error in the example sheet** (45 falls in the 40–59=−2CS band, not 60–79=−3CS). The **chart is authoritative**; the example sheet is wrong.
> `RULING:` **Ship the `🦆DODGE CHART🦆.csv` two-column table above.** The code's `calculateDodgeCS` (`characterSheet.ts:412-422`) uses the **wrong sign** (returns *positive* CS for high stats) and **wrong thresholds** — it must be **replaced** with these tables (melee keyed on AGL+INS, ranged keyed on AGL, both returning negative CS). Dodge is a penalty to the attacker, per `Primary_Stats_Spec.csv:16-17` ("AGL+INS determines dodge column shift" / "AGL alone for ranged dodge"). Add a unit test: AGL 25,INS 20 → ranged −3CS, melee −2CS.

### 3.5 Skills & Talents — exact ±CS values

**Source: `Complete_Skills_Talents.csv`** (74 rows). Each skill is a **±CS package** with prerequisites and a special effect. Selected canonical values (full list = the CSV, do not re-key):

| Skill | Type | Base CS | Prereq | Notable effect |
|---|---|---:|---|---|
| Shooting | Combat | +2CS | — | +2CS all ranged; −1s reload |
| Sniper | Combat | +3CS | Shooting | +4CS rifles at 50+ range; called shots at range |
| Heavy Weapons | Combat | +2CS | STR>20 | +3CS heavy weapons |
| Throwing | Combat | +1CS | — | +2CS thrown; range scales with STR |
| Martial Arts | Martial Arts | +2CS | — | unarmed counts as armed for damage |
| Krav Maga | Martial Arts | +3CS | — | +3CS unarmed; targets vitals |
| Aikido | Martial Arts | +1CS | — | +3CS defense; redirect attacks |
| Acrobatics | Talent | +1CS | AGL>25 | move through enemy squares |
| Stealth | Talent | +2CS | — | +2CS ambush; first-strike damage bonus |
| Perception | Talent | +2CS | — | detect hidden enemies/traps |
| First Aid | Talent | +2CS | — | stabilize dying characters |
| Forensics | Talent | +2CS | Detective | +4 investigation; cause of death |
| Roll With Blow | Physical | +2CS | Reflex | halve blunt damage |
| Dodge | Physical | +2CS | AGL>20 | +AGL bonus to all dodge |

Prerequisite chains to enforce at character-build time (from the CSV `Prerequisites` column): `Sniper←Shooting`, `Gunslinger←Shooting+Quick Draw`, `Rocketman←Heavy Weapons`, `Reverse Engineer←Engineer`, `Forensics←Detective`, `Chemistry/Physics/Biology←Science`, `Roll With Blow←Reflex`, `Parry←any melee weapon skill`, `Capoeira←AGL>30`, `Acrobatics←AGL>25`, `Dodge←AGL>20`.

> Investigation skills also carry a flat **`Investigation_Bonus`** integer (separate from CS), e.g. Forensics `+4`, Detective/Stealth/Surveillance/Tracking/Psychology/Research `+3` (`Complete_Skills_Talents.csv` col 9). Consumed by the investigation loop (§9).

### 3.6 Martial arts (cross-reference)

The full wrestling/martial-arts grapple state machine is specced in the **combat doc** (Bible §5.9, `Wrestling_Martial_Arts_Complete.csv`). The **character-model** owns only the *training record*: which styles, belt rank, XP-in-style, who can teach. Implementation exists (`characterSheet.ts:1026-1386`). Belt CS bonuses (`BELT_REQUIREMENTS`, characterSheet.ts:1041): white 0 → yellow/orange +1 → green/blue +2 → purple/brown +3 → black +4 → master +5.

> `RULING:` Belt XP here is **style proficiency**, not character XP — it does **not** violate the no-leveling rule (§13.8) because it advances only through the **Train activity** and **erodes without upkeep** like all training (§10). Keep the belt system; rename the field `styleProficiency` if "XP" causes confusion.

---

## 4. Origin, threat, and classification numbers

### 4.1 Derived-stat recompute trigger

`derived` is recomputed (never authoritatively stored) whenever any of: a **primary stat**, **age** (§7.1 age modifiers), **active injury** (§7.3 stat penalties), **fatigue** tier, or **morale** tier changes. Order of application:
```
effectiveStat = baseStat
  + originStatBonus          (§4.4)
  + threatLevel.statBonus    (§4.2)
  + ageStatModifier          (characterSheet.ts:578 calculateAgeModifiers)
  − injuryStatPenalty        (§7.3)
  − fatigue.statPenalty(CS)  (characterSheet.ts:1421; applied as CS, not raw)
then derived = f(effectiveStats)   // §3.3 formulas
```

### 4.2 Threat Level — stat bonus, power cap, pay

**Source: `Stat_Rank_Mapping.csv:7-19`** for the **rank↔threat mapping** (the authoritative gate). The **per-level stat bonus / max powers / point budget / pay** are **code-only** (`characterSheet.ts:250-335`, `:850`) and are flagged below for owner confirmation:

| Threat | statBonus | maxPowers | pointBudget | weeklyPay ($) | Source |
|---|---:|---:|---:|---:|---|
| alpha | 0 | 0 | 200 | 1,500 | code `characterSheet.ts:251,850` |
| level_1 | 5 | 1 | 250 | 2,500 | code |
| level_2 | 10 | 3 | 350 | 5,000 | code |
| level_3 | 15 | 2 | 450 | 10,000 | code |
| level_4 | 25 | 4 | 600 | 25,000 | code |
| level_5 | 40 | 5 | 800 | 75,000 | code |
| cosmic | 100 | 10 | 2,000 | 0 (NPC) | code |

> ⚠️ `maxPowers` is **non-monotonic** in the code (L2=3 then L3=2). That is almost certainly a bug.
> `OWNER-FORK:` confirm the `maxPowers` curve and the `statBonus`/`pointBudget`/`weeklyPay` numbers — **none of these trace to a source CSV**, they are code defaults. The Bible only fixes "Threat Level → initiative bonus +5/level" (§4) and "no XP leveling." Until confirmed, treat these as provisional and DO NOT ship balance off them. Cross-check anchor: Bible §4 says initiative bonus = `+5/level` — that is the one threat-derived number with Bible backing.

### 4.3 Threat scoring lenses (LeFevre) — PCF / STAM / SPAM

**Source: `SHT-dir/SHT__ Origins, Threat Levels & Powers.txt:144,173,206`.** Optional scoring used for **AI threat assessment, recruitment pricing, and mission gating** (Bible §4). Not required to play a character; computed on demand.

```
PCF  = (I * C * E) / 1000        // raw power
   I = power Intensity 1..10 ; C = Control 1..10 ; E = effect range in METERS
   ex: I10 C9 E10000  -> (10*9*10000)/1000 = 900   (file:155)

STAM = 0.3*P + 0.4*M + 0.3*H      // volatility/intent  (file:173)
   P = Personality volatility 1..10 ; M = Motivation malice 1..10 ; H = Harm potential 1..10
   ex: P2 M2 H10 -> 0.3*2+0.4*2+0.3*10 = 4.2   (file:184)
   INPUTS come from personality.personalityRating / motivationRating / harmPotentialRating

SPAM = 0.2*S + 0.2*P + 0.3*A + 0.3*M   // situational  (file:206)
   S = Situational potential ; P = perf under Pressure ; A = past Actions ; M = max harm
   ex: S10 P10 A2 M10 -> 0.2*10+0.2*10+0.3*2+0.3*10 = 8.6   (file:217)
```

> `RULING:` **STAM's three inputs are the same fields the character already stores** (`personality.personalityRating/motivationRating/harmPotentialRating`, `Complete_Character_Sheet.csv:45-47`). Wire STAM directly to those. PCF's I/C/E come from the character's **highest-rank power** (`Power_Attack_Stats.csv`); SPAM's A (past actions) comes from `combatRecord` + `reputation`. This makes all three lenses **computed, not hand-authored** — consistent with the data-driven pillar.

### 4.4 Origins (9) — stat tendencies, weakness, threat/reputation modifier

**Source: `Origin_Types.csv:2-10`** (tendencies/weakness) and **`Origin_Types.csv:13-22`** (`---ORIGIN THREAT MODIFIERS---`).

| ID | Origin | Stat tendency | Weakness tendency | Base threat mod | Investigation mod | Public-perception mod |
|---|---|---|---|---|---|---|
| 1 | Skilled Human | High MEL/AGL/INT balanced | Equipment dependency | 0 | +2CS | +20 trust |
| 2 | Altered Human | High STR/STA; variable | Tied to transformation source | −1 (sympathy) | 0 | variable |
| 3 | Mutant | Varies widely | Emotional/psych triggers | +1 (fear) | 0 | −20 trust |
| 4 | Tech Enhancement | High INT; enhanced physical | EMP vuln; maintenance | 0 | +1CS tech | −10 trust |
| 5 | Mystic | High CON/INT; variable | Magic has rules/counters | +1 (unknown) | −1CS | variable by culture |
| 6 | Alien | Varies by species | Environmental (atmosphere) | +2 (xenophobia) | −2CS (unfamiliar) | −30 initial |
| 7 | Cosmic | Extremely high across board | Tied to power source | +3 (power level) | 0 | awe/fear |
| 8 | Divine | High across; extreme STA | Divine rules; artifacts | +2 (divine) | +1CS historical | −10 (religious) |
| 9 | Construct | High STA/STR; may lack CON | Programming; shutdown method | +1 (artificial) | +2CS tech | −20 (uncanny) |

> ⚠️ **CONTRADICTION — origin set mismatch.** The design table (`Origin_Types.csv`) uses **{skilled, altered, mutant, tech, mystic, alien, cosmic, divine, construct}**. The code (`characterSheet.ts:51-60`) uses **{skilled, altered, tech, mutated, spiritual, synthetics, symbiotic, aliens, scientific_weapon}** and a different threat/HP behavior set.
> `RULING:` **The CSV `Origin_Types.csv` set is canonical** (it is the design source of record and is what the Origin Damage Interactions and Public Perception tables key off). The code's `spiritual`→`mystic`, `synthetics`→`construct`, `scientific_weapon`→folds into `tech_enhancement`. The code-only origins **`symbiotic`** has no source-table backing.
> `OWNER-FORK:` decide whether **`symbiotic`** survives as a 10th origin (it has a real gameplay hook — shares powers with the team — but no CSV). If kept, it needs its own row in `Origin_Types`, `Origin_Damage_Interactions`, and a threat/reputation modifier. Default recommendation: keep it, author the missing rows.

### 4.5 Origin → damage interaction (the depth that makes origin matter)

**Source: `Origin_Damage_Interactions.csv:5-14`** (`ORIGIN EFFECT IMMUNITIES`). This is consumed at **damage-resolution time** (the combat doc owns the resolver; the character model owns the *flags*).

| Origin | Bleeds | Burns | Freezes | Stuns | Poisons | EMP-vuln |
|---|---|---|---|---|---|---|
| Skilled Human | YES | YES | YES | YES | YES | NO |
| Altered Human | USUALLY | YES | YES | YES | VARIES | NO |
| Mutant | USUALLY | YES | YES | YES | VARIES | NO |
| Tech Enhancement | PARTIAL¹ | YES | YES | YES | PARTIAL | **YES** |
| Mystic | USUALLY | YES | YES | YES | VARIES | NO |
| Alien | SPECIES | SPECIES | SPECIES | YES | SPECIES | NO |
| Cosmic | RARELY | VARIES | VARIES | VARIES | NO | NO |
| Divine | ICHOR² | VARIES | RARELY | RARELY | NO | NO |
| Construct | **NO**³ | PARTIAL | YES | YES | **NO** | **YES** |

¹ Tech ≥50% cybernetics counts as PARTIAL for bleeding (`Origin_Damage_Interactions.csv:92`).
² Divine "bleeds" golden ichor — **cosmetic only, same mechanics** (`:88`).
³ Constructs **take full damage** but show sparks/smoke instead of blood; bleeding→"sparking (cosmetic)", poison→immune, EMP→stun+damage, healing→requires Repair skill, crit→malfunction roll (`Origin_Damage_Interactions.csv:67-73`).

**Implementation contract:** before applying any `bleeding`/`poison` status, check `origin.bleeds`/`origin.poisons` (`Origin_Damage_Interactions.csv:86` Designer Note: *"Always check origin.bleeds before applying bleeding status"*). Store a resolved boolean map on the character at creation:
```ts
interface OriginInteractionFlags {
  bleeds: 'yes'|'usually'|'partial'|'rarely'|'no'|'species'|'ichor';
  burns: 'yes'|'partial'|'varies'|'species'|'rarely';
  freezes: 'yes'|'rarely'|'varies'|'species';
  stuns: 'yes'|'rarely'|'varies';
  poisons: 'yes'|'no'|'varies'|'species';
  empVulnerable: boolean;
}
```
For `SPECIES`/`VARIES`, resolve from an alien-physiology template (`Origin_Damage_Interactions.csv:76-82`: Humanoid/Silicon/Energy/Insectoid/Aquatic/Plant) at creation, then store the concrete value.

---

## 5. How it consumes the SPINE

The character is computed against **the country/city it stands in** (Bible §2 spine). Country stats set the rules; the character's nationality + current location pull the modifiers. **Country column names are exact** from `SuperHero Tactics World Bible - Country.csv` header (line 1).

### 5.1 Country-attribute → character ±CS (Country_Attribute_Effects.csv)

These are applied to the character's **action columns** while operating in that country (not to base stats). Thresholds: Low 0–35 / Medium 36–65 / High 66–100 (`Country_Attribute_Effects.csv:1`).

| Country column (exact) | High (66–100) effect on the character | Source |
|---|---|---|
| `GovermentCorruption` | −2CS official channels, **+3CS bribes/blackmail** | Country_Attribute_Effects.csv:9 |
| `GovernmentPreception` | Democracy: +2CS legal methods, −1CS covert | :7 |
| `MilitaryBudget` | −2CS infiltration, +2CS military gear access | :11 |
| `IntelligenceBudget` | −2CS covert, **+3CS detection risk** against the character | :13 |
| `MediaFreedom` | +2CS media investigation, −2CS cover-ups | :15 |
| `Healthcare` | faster healing, +2CS medical methods, **cloning possible** | :17 |
| `Science` | +2CS tech investigation, +2CS reverse-engineering | :21 |
| `Cloning` | High → 90% resurrection / 7-day clone; 0 → **permadeath here** | :23 |
| `LSWRegulations` | Banned → −3CS public ops; Legal → +2CS public ops | :27 |
| `Vigilantism` | Banned → −3CS vigilante actions + charges; Legal → +2CS | :29 |
| `CyberCapabilities` | −2CS hacking, +2CS cyber surveillance vs character | :33 |

### 5.2 Faction territory overlay (Country_Attribute_Effects.csv:44-49)

On top of base country stats, the character's **faction** vs the country's owner applies:

| Faction | Home territory | Allied | Hostile |
|---|---|---|---|
| United States | +3CS all methods, full equipment, **legal immunity** | — | −2CS all methods + equipment |
| India | +2CS diplomatic/cultural/spiritual | +1CS diplomatic | −3CS hostile + cultural penalty |
| China | +3CS surveillance, +2CS corporate/tech | +1CS tech | −2CS diplomatic, +2CS covert |
| Nigeria | +2CS tribal/underground/resource | +1CS African-continental | −2CS official → unofficial only |

### 5.3 Spine combos consumed (Bible §8 — MUST be consumed, §13.9)

The character model **reads** these computed systems (it does not compute them — `combinedEffects.ts`/`locationEffects.ts` do). The character-relevant consumers:

| Combined system | Character consumption |
|---|---|
| **Cloning/resurrection** (Healthcare+Science+GDP+Cloning law) | Decides 0-HP outcome: clone vs permadeath (§7.5). |
| **Medical/recovery** (Healthcare+GDP+Lifestyle) | Sets injury/status recovery speed (§7.3 treatment tiers). |
| **Mercenaries** (Military+GDP+Corruption) | Sets recruit availability/quality/**price** (uses threatLevel pay, §4.2). |
| **Surveillance** (Intel+Cyber+(100−MediaFreedom)) | Sets how fast the character's combatRecord scrutiny rises (§8 below). |
| **LSW affairs** (LSWActivity+Intel+Military+Science) | Sets registration requirement + public-op legality (combines with §5.1 LSWRegulations). |

### 5.4 Culture & nationality social ±CS

**Source: `Culture_Region_Effects.csv`** (14 regions, Bible §6.3). Same-culture +2CS social, opposed −1CS, language barrier −2CS; power affinity (e.g., South Asia +2CS spiritual/mystic LSWs). The character's `nationality`→culture region is the input; consumed in investigation/diplomacy and in **mystic/spiritual power effectiveness** for those origins.

---

## 6. Personality (20 types) — AI + identity

### 6.1 The 20 → 5 target-preference map (exact)

**Source: `SHT-dir/Combat Compendium REAL - 🎯PERSONALITY TARGET SELECTION🎯.csv`.** The single data row maps personality type 1..20 to a preference code 1..5. Legend (from the same file): `1=Most Health, 2=Least Health, 3=Major Threat (most damage dealt), 4=Minor Threat (least damage dealt), 5=Random`.

| Type | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Pref code** | 1 | 3 | 4 | 4 | 1 | 3 | 4 | 1 | 2 | 2 | 1 | 4 | 2 | 3 | 3 | 3 | 2 | 5 | 5 | 2 |

```ts
// Direct port of the CSV row — index = personality typeId (1-based)
const TARGET_PREF_BY_TYPE: Record<PersonalityTypeId, 1|2|3|4|5> = {
  1:1, 2:3, 3:4, 4:4, 5:1, 6:3, 7:4, 8:1, 9:2, 10:2,
  11:1, 12:4, 13:2, 14:3, 15:3, 16:3, 17:2, 18:5, 19:5, 20:2,
};
const PREF_CODE_TO_NAME: Record<1|2|3|4|5, TargetPref> = {
  1:'most_health', 2:'least_health', 3:'major_threat', 4:'minor_threat', 5:'random',
};
```

> `OWNER-FORK:` **The 20 personality type *names* are not in the CSV** (only the numbered columns). The named-personality list (the "20 personalities" of the spine) lives in `SHT-dir/Personality, Emotions, Age.one`/`.mht` (OneNote, not machine-readable here). **The owner must supply the ordered list of 20 names** so type 1..20 gets a label. Until then, ship them as `PERSONALITY_01..20` with the target-pref already wired — combat AI works without the names; only the UI label is missing.

### 6.2 Personality drives AI + idle (Bible §5.10)

- **Combat:** AI picks its target each turn via `TARGET_PREF_BY_TYPE[unit.personality.typeId]` evaluated over visible enemies (most/least health, most/least cumulative damage dealt, or random). A bully (pref `2 least_health`) finishes the weak; a pragmatist (pref `3 major_threat`) focuses the biggest gun.
- **Idle/world:** extend the same type into idle behavior per the GDD (becoming familiar with the city, texting concerns, hiding an addiction). `RULING:` idle behavior maps off the existing `PersonalityTraits` (impatience/initiative/volatility/discipline/sociability/riskTolerance/harmAvoidance, `personalitySystem.ts:17`) — keep that 7-trait vector as the **behavioral** layer and the 20-type id as the **combat-target + label** layer. They coexist: traits drive *when/whether* a unit acts idle; the 20-type drives *whom it shoots*.

### 6.3 MBTI bridge (existing code)

`personalitySystem.ts` derives the 7-trait vector from a 16-type MBTI string. `RULING:` MBTI is an **internal generator** for the trait vector only; it is **not** the 20-type combat personality. Map each of the 20 types to a default trait vector (owner-authored alongside the names) OR keep MBTI as the trait source and attach a separate `typeId` 1..20 for targeting. Default: **decouple** — store both `typeId` (1..20, targeting) and `traits` (7-vector, behavior); MBTI is just one way to seed `traits`.

---

## 7. Health, injury, aging, mental state, death

### 7.1 Aging & age stat modifiers

**Source: code `characterSheet.ts:578-605`** (no source CSV — flagged). Age category from biological age; per-category stat deltas:

| Category | Age | Stat modifiers |
|---|---|---|
| child | 0–12 | STR −10, STA −5, INT −3 |
| teenager | 13–17 | STR −3, INT −1 |
| young_adult | 18–25 | STR +2, AGL +2 (peak physical) |
| adult | 26–40 | baseline |
| middle_aged | 41–55 | STR −2, AGL −2, INT +2, INS +2 |
| senior | 56–70 | STR −5, AGL −5, STA −3, INT +3, INS +3 |
| elderly | 71+ | STR −10, AGL −10, STA −8, INT +2, INS +5 |

Time ratio: **30 game days : 1 real day** (Bible §6.5; `characterSheet.ts:615`). Synthetics/Construct don't age (`:582`). Birthday → +1 age, +5 morale (`:512-528`).

> `OWNER-FORK:` the age-modifier numbers are code defaults with **no source table**. `Complete_Character_Sheet.csv:17` only says "Age affects stat maximums and minimums" without numbers. Confirm or replace; they are gameplay-significant.

### 7.2 Health pool & states

`maxHealth = STA*2 + STR` (§3.3, corrected). Current health 0..max. `CharacterHealthStatus` lives in `characterStatusSystem.ts` (HP, active injuries, active status effects, body-part tracking).

### 7.3 Injuries (permanent) & status effects

**Source: `Injury_System.csv`, `Status_Effects_Complete.csv`, `🩸CRIT TABLE🦴.csv`** (combat doc owns the crit→injury pipeline, Bible §5.6/§13.2). The **character model owns the injury record + its stat penalty + recovery state.**

- A **Major** hit (or called shot) rolls crit table → **body part + severity**; severe outcomes apply **permanent disability** (lost eye/arm/leg → stat penalties) curable only by **Regeneration power, prosthetics (tech tree), or hospital surgery + weeks** (Bible §5.6).
- Status effects come in **severity tiers I/II/III** with **treatment tiers** (time → first-aid → hospital → advanced → power) (`Status_Effects_Complete.csv`, Bible §5.7).
- **Recovery speed is spine-modulated:** Healthcare High → faster healing (`Country_Attribute_Effects.csv:17`); Medical Center combo (Healthcare+Cloning) → fastest (`:41`).

> `RULING:` Body-part injury **must gate `origin.bleeds`** (§4.5): a Construct that "loses an arm" sparks and gets a Malfunction roll instead of a bleeding artery (`Origin_Damage_Interactions.csv:67-73`). One crit pipeline, origin-aware visuals.

### 7.4 Mental state (stress/trauma)

**Source: `Complete_Character_Sheet.csv:44` (MENTAL).** Tracks stress/trauma; affects decision-making and **power control** (links to STAM personalityRating). Improved through therapy (Daily Activity, Bible §7.6). `RULING:` model as a 0–100 `mentalStress` with thresholds mirroring morale (calm/stressed/traumatized/breaking); high stress applies −1/−2CS to **power activation** and raises desertion risk. No source numbers exist → reuse the morale threshold shape (§ characterSheet.ts:753) and mark provisional.

### 7.5 Death & 0-HP behavior (origin- and spine-gated)

0-HP outcome depends on **origin** AND the **country's Cloning stat**:

| Origin | 0-HP base behavior (code `characterSheet.ts:zeroHpBehavior`) |
|---|---|
| skilled/altered/tech/mutant/mystic/scientific | hospital (recoverable) |
| synthetic/construct | **destroyed** (cannot be rebuilt) |
| mystic (spiritual) | **dead** (spirit departs) |
| alien | varies by physiology |

Then **cloning gate** (`Country_Attribute_Effects.csv:23`): country Cloning High → 90% resurrection / 7-day clone; Basic → 50% / 30-day; 0 → **permadeath** in that country. Death → Dying → death saves → permadeath, with cloning as the only resurrection hook (Bible §5.6). A dead hero **stays on the roster until their funeral** (Bible §7.3 — obituaries).

> `OWNER-FORK:` the origin-specific zeroHp behaviors are code values; confirm against the canonical origin set (§4.4) — `spiritual=dead` and `synthetic=destroyed` are strong design choices worth keeping but have no CSV.

---

## 8. Combat record, scrutiny & identity

`combatRecord` (`characterSheet.ts:879`) tracks every kill **with the murder weapon**, and accumulates **local (city) and national (country) scrutiny** + traceable evidence. Witnessed kill → +10 local, +3 national scrutiny (`:970-973`). This is the input to **investigations targeting the player** and to the **Surveillance** combined-effect (§5.3): a high-Intel/Cyber country raises scrutiny faster. `secretIdentity` (§2) gates whether scrutiny attaches to the civilian or the code name. This is the bridge from combat to the consequence/legal system (Bible §9).

---

## 9. Career, education → tech gating

**Source: `Complete_Character_Sheet.csv:20-23`, `Education_Career_Complete.csv`, Bible §7.6.** 7 career categories × 5 ranks; education 1–5 (Bible says "9 education tiers" §7.6 — *flag*: the character sheet says 1–5, the Bible says 9). Career/education **gate technology trees & research projects** (`Technology_Trees_Integrated.csv`, `Research_Projects.csv`) — the path to advanced suits, prosthetics, cloning access. The character's `INT` + `educationLevel` + relevant skills (Engineer/Science/Reverse Engineer) feed **research speed** (Bible §8 Research combined-effect).

> ⚠️ `OWNER-FORK:` education tier count — `Complete_Character_Sheet.csv:22` says **1–5**, Bible §7.6 says **9 education tiers**. Reconcile against `Education_Career_Complete.csv` (the data of record). Recommend: ship whatever `Education_Career_Complete.csv` actually enumerates; do not invent a number.

---

## 10. No-XP-leveling rule — exact consequences

Bible §13.8: **no XP-to-level pool.** Concrete schema effects:
- **DELETE** `Experience_Points/XP` as a character-advancement field (`Complete_Character_Sheet.csv:52` row is deprecated; `Advancement_Tracking` group keeps only `Training_Progress`, `Research_Projects`, `Mission_History`).
- **DELETE** the `level_up` morale event (`characterSheet.ts:772`) — replace with `skill_improved` / `belt_promoted` (training-driven).
- Stat/skill growth happens **only via the Train activity** and **erodes without upkeep** (Bible §7.6: *"they erode without it; robots can't train"*). `RULING:` erosion = the inverse of `trainingSystem.ts`; constructs/synthetics cannot train (origin flag).
- The Time Chain grants **exactly +1 power** over a campaign (Bible §4). Enforce as a one-shot flag `timeChainPowerGranted: boolean`.

---

## 11. Edge cases & failure modes

| Case | Required behavior |
|---|---|
| Stat exceeds 150 (Unearthly+) | Rank ladder continues (Shift X..Beyond, §3.1). UI must not assume ≤150. |
| Construct takes "bleeding" status | **Suppress** bleeding; apply "sparking" cosmetic; full DOT still applies as overheating (`Origin_Damage_Interactions.csv:67`). Never tick HP-from-bleed on a `bleeds:'no'` origin. |
| Construct healed by medkit | Reject; require **Repair** skill (`:72`). |
| Tech-enhancement hit by EMP | Apply stun + damage (only origins with `empVulnerable:true`: tech, construct). |
| Character dies in a Cloning=0 country | **Permadeath**, no clone offered. Body → funeral → roster removal. |
| Power count > threatLevel.maxPowers | Reject at build time. (Resolve the non-monotonic maxPowers bug first, §4.2.) |
| Skill added without prereq | Reject (enforce §3.5 prereq chains). |
| Age crosses category boundary mid-campaign | Recompute `ageStatModifiers` + `derived` (§4.1) on birthday tick. |
| `SPECIES`/`VARIES` origin interaction unresolved | Resolve to a concrete alien-physiology template **at creation**, store concrete flags; never leave `'species'` at damage time. |
| Cosmic entity (threat=cosmic) | `generationWeight 0` → never random-generated; NPC-only (`characterSheet.ts:332`). |
| Synthetic/construct ages | No-op (`:582`); lifeExpectancy 500 (`:622`). |
| Health formula drift | Single source of truth `STA*2+STR` (§3.3); add a unit test asserting Granite=205. |
| Dodge sign/threshold | Replace `calculateDodgeCS` with the authoritative two-column `🦆DODGE CHART🦆.csv` tables (negative CS, melee=AGL+INS, ranged=AGL) (§3.4). |
| Missing personality name | Render `PERSONALITY_NN`; AI targeting still functions off the numeric pref (§6.1). |

---

## 12. UI / UX hooks

| Surface | Hook |
|---|---|
| **Phone — Personnel app** (Bible §7.3) | Unit sheet: stats→rank labels (§3.1), powers, skills (+CS), relationships (love/hate emojis), popularity, hometown badge. Obituary view for dead-but-unfuneraled. |
| **Phone — relationships** | `contacts` + `factionStandings` + who-loves/hates-whom graph. |
| **World map** | Threat-level badge gates which sectors/missions the unit may deploy to (Bible §10 scaling). Nationality flag + current-country spine summary (legality of public ops here). |
| **Laptop — investigation** | Investigation skills surface their flat `+N` bonus (§3.5) + INT/INS awareness `(INT+INS)/2`. |
| **Combat overlay (symbolic grid)** | Glyph + HP bar; **origin tag** (so player knows "construct: immune to poison"); status-effect icons by severity tier; injury markers on body-part. Personality target-pref shown on enemy inspect ("targets weakest"). Per Bible: FLIGHT shown as **altitude integer + wing/shadow glyph**, not 3D — the character's flight power sets max-Z only. |
| **Character creation wizard** | Point-buy against `threatLevel.pointBudget` (§4.2, provisional); enforce prereqs (§3.5) and maxPowers; origin pick auto-fills interaction flags (§4.5) + threat/reputation modifiers (§4.4). |
| **Morale/fatigue** | JA2-style mood indicator (`MORALE_EFFECTS`, characterSheet.ts:753); accuracy/damage/desertion deltas visible on hover. |

---

## 13. Integration points (reads / writes)

**Reads (the character consumes):**
- `Stat_Rank_Mapping.csv` (rank ladder, threat auto-classify) · `Primary_Stats_Spec.csv` (derived formulas) · `Complete_Skills_Talents.csv` (skill CS) · `Origin_Types.csv` + `Origin_Damage_Interactions.csv` (origin flags) · `Country_Attribute_Effects.csv` + `Culture_Region_Effects.csv` (spine ±CS) · `combinedEffects.ts`/`locationEffects.ts` (cloning/medical/mercs/surveillance/LSW-affairs) · `Universal_Table_FIXED` (resolution, §3) · `PERSONALITY TARGET SELECTION.csv` (AI) · `Education_Career_Complete.csv` (career/edu gates).

**Writes (the character produces):**
- → **Combat** (`CombatScene.ts`): stats→to-hit columns, origin→status gating, injuries→penalties.
- → **Investigations** (`investigationSystem.ts`): skill +N bonuses, awareness stat.
- → **Economy** (`economySystem.ts`/`mercenaryPool.ts`): `employment.weeklyPay` by threat (§4.2).
- → **Consequences/legal** (Bible §9): `combatRecord` scrutiny + `reputation`.
- → **Personnel UI** + **obituaries/funerals** (Bible §7.3): roster, relationships, death state.
- → **Save/Time-Travel** (Bible §11): the character record is part of the diegetic save state the Time Walker rewinds.

**Sibling docs that own adjacent numbers (do not duplicate here):**
- Combat resolution, crit→injury pipeline, wrestling state machine, BAMPI/powers → the **combat** spec(s) (Bible §5).
- Country/city/culture spine tables in full → the **world/spine** spec (Bible §6).
- Investigation loop, careers/tech trees in full → the **laptop/meta** spec (Bible §7).

---

## 14. RULING: notes (collected)

1. **Health = `STA*2 + STR`** (source-data), not the code's 4-stat sum. Correct the code; add Granite=205 test. (§3.3)
2. **`Stat_Rank_Mapping` threat column = canonical stat→threat auto-classification.** Grey-encounter lore is flavor only. (§3.1)
3. **`Origin_Types.csv` 9-set is canonical**; code origin names map onto it (spiritual→mystic, synthetics→construct, scientific_weapon→tech). (§4.4)
4. **STAM/PCF/SPAM are computed from existing fields**, not hand-authored. (§4.3)
5. **Always check `origin.bleeds/poisons` before applying those statuses**; resolve `SPECIES/VARIES` to concrete at creation. (§4.5, §11)
6. **20-type personality (targeting) and 7-trait vector (behavior) coexist**; MBTI is just a trait seeder. (§6.2–6.3)
7. **No XP leveling**: delete XP field + `level_up` event; growth via Train (with erosion); +1 power via Time Chain. (§10)
8. **Belt "XP" = style proficiency**, training-driven & erodable — not character XP; rename to `styleProficiency`. (§3.6)
9. **Mental state** modeled on the morale threshold shape (provisional, no source numbers). (§7.4)
10. **Dodge = authoritative two-column `🦆DODGE CHART🦆.csv`** (negative CS, melee=AGL+INS / ranged=AGL); the code's `calculateDodgeCS` is wrong-signed and must be replaced. The `Character_Template.csv:97` melee value is an off-by-one error vs the chart. (§3.4)

## 15. OWNER-FORK: notes (collected)

1. **The 20 personality-type NAMES** are not in any machine-readable source (live in OneNote `Personality, Emotions, Age.one`). Owner must supply the ordered list of 20 labels. AI targeting already works without them. (§6.1)
2. **`symbiotic` as a 10th origin** — keep it (real hook: shares powers with team) and author the missing `Origin_Types`/`Origin_Damage_Interactions`/threat rows, or drop it. (§4.4)
3. **Threat-level numbers** (`statBonus`, `maxPowers` curve [non-monotonic = likely bug], `pointBudget`, `weeklyPay`) are code defaults with no source CSV. Confirm/replace before balance lock. Only the Bible's "+5 initiative/level" is backed. (§4.2)
4. **Age stat-modifier numbers** are code defaults with no source table. Confirm. (§7.1)
5. **Origin-specific 0-HP behaviors** (`spiritual=dead`, `synthetic=destroyed`) are code values; confirm against canonical origin set. (§7.5)
6. **Education tier count**: character sheet says 1–5, Bible says 9. Reconcile against `Education_Career_Complete.csv` (data of record). (§9)
7. *(Resolved — moved out of fork.)* Dodge curve is settled by `🦆DODGE CHART🦆.csv` (§3.4); the only residual is a one-line correction to the example sheet's melee value and replacing the code's wrong-signed `calculateDodgeCS`. No owner decision needed.

---

## 16. Open questions

1. **Personality names** (the "20 personalities" of the spine pitch) — OneNote-locked (`Personality, Emotions, Age.one`); the owner must supply the ordered 20 labels. Combat AI works without them (§6.1). *Highest-priority unblock.*
3. **Threat-level balance table** — is `maxPowers` non-monotonic intentional, or a typo (L3 should be ≥3)? (§4.2)
4. **Education**: 5 tiers or 9? (§9)
5. **Mutant** appears in BOTH `OriginType` (origin) and `CharacterType` (category, `characterSheet.ts:45`). Confirm they are distinct axes (a Mutant origin produces a `mutant` characterType) and not duplicated — schema in §2 treats `characterType` as **derived from origin**, which resolves it, but the owner should confirm the mapping table (which of the 9 origins maps to each of the 6 character types).
6. **Time Chain power**: does the +1 power respect `threatLevel.maxPowers`, or override it? (§10)
7. **STAM inputs at generation**: are `personalityRating/motivationRating/harmPotentialRating` author-set per-character, or derived from the 20-type personality + origin? (Recommend: seed from type+origin, allow author override.) (§4.3)
