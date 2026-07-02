# 103 — Audio Director & Voice / Sound-Line Hook System

> **System:** Audio Director & Voice / Sound-Line Hook System (diegetic-dB audio bus · voice-line bark engine · phone "comic-bubble" speaker mode · personality idle pings · per-faction ambient beds)
> **Status:** BUILD-READY SPEC
> **Spine consumed:** Country STATs (Corruption, MediaFreedom, LawEnforcement, faction-home flag), City Type (10) + Culture Region (14) + Terrain (25) (select ambient bed), Faction identity (4) (faction ambient/voice pack), 20 Personality types (pick bark voice & idle-ping tone), Threat Level (LeFevre) (voice-pack tier / scream urgency), INS stat (hearing-range, the listener side of every diegetic line).
> **Bible anchors:** §5.11 (Sound, stealth, doors — the **decibel model is a MECHANIC**, every audio cue carries a dB so it feeds detection); §7.5 (PHONE — "turning on the 'speaker'… change the text bubble to display as if it is louder like in comic books"); §2 SPINE / §5.10 (Personality-driven AI → idle behavior: "becoming familiar with the city / texting concerns / hiding an addiction"); §6.5 / §7.2 (world clock real-time-with-pause; laptop pauses); §13 ruling #9 (combined-effects must be CONSUMED, not just computed); §13 ruling #1 (one Universal Table — the bark engine *reads* its outcome bands, never re-rolls).
>
> **Source tables (read these to re-balance — never hardcode the numbers in code):**
> - `docs/csv-source-data/Game_Mechanics_Spec/Sound_Detection_System.csv` — **AUTHORITATIVE** for every decibel value, material dampening, the `Hearing_Range = (INS/5) × (Effective_dB/30)` formula, active-listen AP costs, sound-cone UI colours, environmental sound beds, and the powers-that-affect-sound list. The Audio Director MUST emit the exact `Base_Decibels` from this table for each cue.
> - `SuperHero Tactics/Combat Compendium REAL - 🎯PERSONALITY TARGET SELECTION🎯.csv` — the 20 personality → target-preference map; the bark engine reuses the same `personalityId (1..20)` to pick the voice/line tone (it does NOT re-derive target logic; that is system 03's job).
> - `SuperHero Tactics/FIST GDD v02.txt` — voice & sound design intent: lines 178–179 (custom character voices), 221–226 (idle pings: becoming familiar with city / **texting you their concerns** / aging / **secretly hiding an addiction**), 397 (funeral — "he is not going to hear that voice again"), 486 (speaker → comic-bubble), 487 (dial-a-number phone calls), 1451–1469 (the Sound section: Laptop / World / Tactical layers; per-faction USA/Nigeria/China/India ambient; Character Movement / Hit-Collision / Injured-Death sound lists).
> - `docs/csv-source-data/Game_Mechanics_Spec/Stat_Rank_Mapping.csv` — FASERIP rank ladder + the Column-Shift reference; used to map Threat Level → voice-pack tier and to read the same ±CS the Universal Table produced for a hit (drives bark category Miss/Graze/Hit/Crit).
> - `docs/csv-source-data/Game_Mechanics_Spec/Universal_Table_FIXED.csv` — the resolution table whose **outcome band** (Failed / Minor / Success / Major, Bible §3.3) the bark engine listens to; the Audio Director never rolls — it subscribes.
> - `docs/csv-source-data/Public_Perception.csv` — reputation events (Saved_Lives_Civilian, Civilian_Casualties_*, Team_Member_Death) that fire one-shot world-layer voice/sting cues.
> - `docs/csv-source-data/Daily_Activity_Framework.csv` — the 30 idle activities (ACT_001…ACT_030) whose `Status_Effects_Applied` flavour the personality idle ping draws from (e.g. ACT_001 Personal Life → "secret identity" / stress).
> - `docs/csv-source-data/Time_Management.csv` — `Event_Priority_*` (Critical/High/Medium/Low/Background) → phone notification urgency / ringtone tier; `Status_*` rows → which character states are allowed to bark.
> - `docs/csv-source-data/City_Type_Effects.csv`, `Culture_Region_Effects.csv`, `Faction_Specification.csv`, `TerrainCodes.csv` (in `SuperHero Tactics/`) — the spine inputs that select the ambient bed and voice pack.
>
> **Existing code this spec extends (do NOT rewrite — wire to it):**
> - `MVP/src/game/systems/SoundManager.ts` — Phaser audio engine. Already has: `loadCatalog()`, `preloadSounds()`, positional audio (`pan/maxDistance/rolloffFactor`), per-category volume (`setCategoryVolume`), `calculateSoundRadius({decibels, baseRange})`, `playSoundWithRadius()`, 8 `SoundCategory` values. The Audio Director is a **layer above** this — it decides *what* to play and *at what dB*; SoundManager decides *how* to play it.
> - `MVP/public/assets/sounds/catalog.json` — **381 sounds across 44 categories** already on disk: `ambient, ambient_combat, animals, arrows, character, combat, combat_ui, combat_ui_results, combat_ui_turn, combat_ui_unit, damage_types, destruction, elemental, energy_weapons, env_cover, env_destruction, env_footsteps, environment, firearms, grenades, impacts, injuries, ma_counter, ma_grappling, ma_internal, ma_striking, ma_submission, materials, melee, powers, powers_control, powers_energy, powers_mental, powers_mobility, powers_physical, psychic, results, robots, status_control, status_dot, status_effects, ui, ui_nav, ui_notify`.
> - `MVP/src/game/EventBridge.ts` — React⇆Phaser event channel (the bark engine emits to this so the React HUD / phone can render bubbles).
> - `MVP/src/components/MobilePhone.tsx` — already declares `PHONE_MESSAGE_TYPES = ['idle_warning','call_incoming','arrival','handler']` and has a rendered top-speaker element. The phone speaker-mode bubble and idle pings dock here.

---

## 1. Overview & Player Fantasy

The Audio Director is the **third emergence pillar**: the country/city STAT spine is the first, the 20-Personality engine (system 03) is the second, and **audio is how both of those reach the player's ears**. Bible §0 names the target feel as "a living world that talks to you"; this system is literally the part that *talks*. It does five jobs, and the first is a hard **mechanic**, not polish:

1. **Diegetic-dB audio bus (a MECHANIC, Bible §5.11).** Every sound the game plays carries a **decibel value taken from `Sound_Detection_System.csv`** and a world position. The Audio Director routes that cue through two consumers at once: (a) `SoundManager` plays it positionally for the human player, and (b) the **Sound-Detection subsystem** uses the *same* dB + the listener's `INS` to decide whether AI/NPC units *hear* it (`Hearing_Range = (INS/5) × (Effective_dB/30)`). A silenced pistol is quieter *and* harder to detect because **one number drives both**. This is the JA2 stealth texture: audio is gameplay.
2. **Voice-line / "bark" engine.** Combat and world events emit *barks* — short voice lines chosen by the acting character's **personality (1..20)**, **Threat Level**, and the **Universal-Table outcome band** that just resolved (Miss/Graze/Hit/Crit/Down). The engine subscribes to outcomes; it never rolls dice. (FIST GDD 178–179: characters get custom voices that "become famous"; §13 ruling #1: one table, everyone reads it.)
3. **Phone "comic-bubble" speaker mode (Bible §7.5 / GDD 486).** When the player toggles the phone's **speaker**, a spoken line renders as a *louder comic-book bubble* (bigger, bold, jagged-tail style) and, if a voice file exists, plays the audio. This is the diegetic skin over the email/dial-a-number dialogue.
4. **Personality idle pings ("the world that talks to you", GDD 221–226).** Idle characters on `Ready` periodically text/voice the player: becoming familiar with the city, **texting their concerns**, aging, or **secretly hiding an addiction**. Personality (system 03) chooses tone & frequency; the Audio Director renders it as a phone notification (+ optional TTS/voice clip).
5. **Per-layer & per-faction ambient beds (GDD 1451–1465).** Three audio layers (Laptop / World / Tactical) each have a bed; the Tactical bed is selected by **faction (USA/Nigeria/China/India ambient) + city type + terrain + weather**, mixed under everything.

**The player fantasy:** *"My team has voices I'd miss. The world reacts out loud — a gunshot two rooms away is a sound I can use or be caught by. When I put the phone on speaker, the call booms like a comic panel. My idle mercs text me their problems. The place I'm fighting in *sounds* like that place."*

**Non-goals (scope guards):**
- This system does **not author** dialogue content (that's the writers / events engine) — it *selects, sequences, and renders* lines from data.
- It does **not** re-implement detection. It *emits* dB into the existing Sound-Detection subsystem (system that owns §5.11 detection logic) — owns the *emit* side, reads back nothing.
- It does **not** re-roll combat. It subscribes to Universal-Table outcomes (Bible §13 #1).
- **Multiplayer (the time-traveler's other dimension) is an architectural stub.** Audio is local-only; barks/ambient never sync across the dimension boundary. Voice-line *selection* is deterministic from a seed so a future MP build can replay the same line from the same event without shipping audio state — design the bark resolver pure (see §4.6).

---

## 2. Data Schema (fields / types)

All numeric content lives in data files so it is re-balanceable without code (Pillar #1). Three new data files + additive fields on existing records.

### 2.1 `AudioCue` — the universal envelope every sound is wrapped in (runtime, transient)

Every play request in the game becomes an `AudioCue`. This is the single chokepoint that guarantees a dB is attached.

```ts
type AudioLayer = 'laptop' | 'world' | 'tactical';

interface AudioCue {
  cueId: string;            // catalog key OR voice-line id (see §2.3)
  category: string;         // one of the 44 catalog categories (§1 list) OR 'voice'
  layer: AudioLayer;        // routing bus
  decibels: number;         // REQUIRED. From Sound_Detection_System.csv Base_Decibels.
                            //   -1 = "non-diegetic" (UI/laptop) → skips detection entirely.
  canPenetrateWalls: 'no' | 'muffled' | 'same_floor' | 'yes'; // Sound_Detection_System col 4
  position?: { x: number; y: number; z: number };  // tactical grid; z = altitude level Z0..Z6
  sourceUnitId?: string;    // who/what made it (for bark voice-pack + cone origin)
  volume?: number;          // 0..1 player-mix override (NOT the dB; dB is the mechanic)
  priority?: number;        // 0..100 mixer priority (see §3.6 ducking)
}
```

> **RULING (R1):** `decibels` is **mandatory and validated at the Audio Director boundary**. A cue with `category !== 'ui' && category !== 'voice' && decibels === undefined` is a **build error** (assert in dev, default to `0 dB` + console.error in prod). This is what makes §5.11 a mechanic instead of an aspiration — you cannot play a diegetic sound without declaring how loud it is. Source: Bible §5.11 ("Everything generates sound").

### 2.2 `cueDbMap` — catalog-key → decibel binding (NEW data file: `data/audio/cueDbMap.json`)

Maps each of the 381 catalog keys (and synthetic action keys) to its `Base_Decibels` + `Can_Penetrate_Walls` straight out of `Sound_Detection_System.csv`. This is the table that makes the mechanic data-driven.

```ts
interface CueDbBinding {
  actionType: string;       // matches Sound_Detection_System "Action_Type" (e.g. "Pistol_Shot")
  baseDecibels: number;     // 140 for Pistol_Shot, etc. — COPIED from the CSV
  hearingRangeSquares: number; // 50 for Pistol_Shot — the CSV's pre-computed @ avg INS 30
  canPenetrateWalls: 'no' | 'muffled' | 'same_floor' | 'yes';
  catalogCategories: string[]; // which of the 44 catalog categories satisfy this action
}
type CueDbMap = Record<string /*actionType*/, CueDbBinding>;
```

### 2.3 `VoiceLine` & `VoicePack` (NEW data file: `data/audio/voiceLines.json`)

The bark content. Lines are *templates* keyed by trigger + personality bucket; the resolver fills them.

```ts
type BarkTrigger =
  | 'spot_enemy' | 'attack_hit' | 'attack_miss' | 'attack_crit' | 'take_hit'
  | 'go_down' | 'ally_down' | 'kill' | 'reload' | 'low_hp' | 'flee' | 'overwatch_trigger'
  | 'idle_concern' | 'idle_city' | 'idle_addiction' | 'idle_aging'   // GDD 221–226
  | 'phone_greeting' | 'phone_signoff'                               // §7.5 dial-a-number
  | 'rep_praise' | 'rep_condemn' | 'funeral';                        // Public_Perception one-shots

interface VoiceLine {
  id: string;                 // e.g. "VL_spot_enemy_aggressive_03"
  trigger: BarkTrigger;
  personalityBucket: number[];// subset of 1..20 this line suits (empty = any)
  threatTierMin?: string;     // 'Alpha'..'Threat 5' gate (Stat_Rank_Mapping Threat_Level)
  text: string;               // bubble text (shown when speaker on, or as toast)
  audioKey?: string;          // catalog 'character' key if a recorded VO exists; else TTS/text-only
  decibels: number;           // diegetic loudness of *speaking* this line (see §3.2)
  cooldownSec: number;        // per-unit anti-spam (RULING default 8, §3.4)
}

interface VoicePack {
  packId: string;             // 'faction_USA' | 'faction_NGA' | 'faction_CHN' | 'faction_IND' | 'generic'
  personalityId?: number;     // optional per-character override (1..20)
  lines: string[];            // VoiceLine ids in this pack
}
```

### 2.4 `AmbientBed` (NEW data file: `data/audio/ambientBeds.json`)

```ts
interface AmbientBed {
  bedId: string;
  layer: AudioLayer;
  selector: {                 // ANY match scopes this bed; most-specific wins (§3.5)
    faction?: 'USA' | 'NGA' | 'CHN' | 'IND';   // GDD 1457–1464
    cityType?: string;        // City_Type_Effects (10 types)
    terrainCode?: string;     // TerrainCodes (25)
    cultureRegion?: string;   // Culture_Region_Effects (14)
    weather?: 'clear' | 'rain' | 'storm' | 'fog';
  };
  loopKeys: string[];         // catalog 'ambient'/'environment' keys, randomly layered
  baseVolume: number;         // 0..1 (defaults from SoundManager DEFAULT_CATEGORY_VOLUMES.ambient = 0.2)
  maskingDb: number;          // environmental dB this bed contributes (City_Ambient 40 dB, etc. — §2.5)
}
```

### 2.5 Additive fields on existing records

- **Character record (extends system-03's `Character`):** `voicePackId: string` (defaults to faction pack), `voiceOverride?: number` (1..20 personalityId for line tone), `lastBarkAt: Record<BarkTrigger, number>` (cooldown bookkeeping), `isMute: boolean` (deaf/silenced status zeroes both speaking and `idle_concern`).
- **Tactical unit (Phaser):** `currentZ: number` (altitude 0..6 — feeds positional pan/attenuation & flight-sound dB swap, §3.3).
- **World/laptop state:** `phoneSpeakerOn: boolean` (the §7.5 toggle), `audioMix: { master, layerVolumes: Record<AudioLayer,number>, categoryVolumes }` (player settings, persisted to local prefs — NOT to the diegetic save).

---

## 3. Exact Numbers, Tables & Formulas (each cited)

### 3.1 The decibel table (verbatim from `Sound_Detection_System.csv`)

Every diegetic cue MUST use one of these `Base_Decibels`. (Selected rows; the full table is the source of truth — `cueDbMap.json` mirrors all of it.)

| Action_Type | Base_dB | Hearing_Range (sq @ INS 30) | Penetrates walls |
|---|---|---|---|
| Standing_Still | 0 | 0 | No |
| Walking_Careful | 15 | 1 | No |
| Crawling | 20 | 2 | No |
| Walking_Normal | 30 | 3 | No |
| Climbing | 35 | 4 | No |
| Running | 50 | 8 | Muffled |
| Unarmed_Strike | 50 | 8 | Muffled |
| Talking_Normal | 50 | 6 | Muffled |
| Grappling_Struggle | 55 | 9 | Muffled |
| Sprinting | 60 | 12 | Muffled |
| Melee_Attack_Hit | 60 | 10 | Muffled |
| Talking_Loud | 65 | 12 | Yes (muffled) |
| Door_Slam | 70 | 15 | Yes |
| Super_Power_Low | 70 | 15 | Varies |
| Window_Break | 75 | 18 | Yes |
| Door_Break / Scream / Flight_High | 80 | 20 / 25 / 20 | Yes |
| Super_Power_High | 100 | 30 | Yes |
| Pistol_Shot | 140 | 50 | Yes (reduced to 30 sq) |
| SMG_Burst | 150 | 60 | Yes (reduced to 40 sq) |
| Shotgun_Blast | 155 | 70 | Yes (reduced to 45 sq) |
| Rifle_Shot | 160 | 75 | Yes (reduced to 50 sq) |
| Heavy_Weapon | 165 | 80 | Yes (reduced to 55 sq) |
| Explosion_Small / Large | 170 / 180 | 100 / 150 | Yes (reduced to 70 / 100 sq) |

**Stealth swaps (`Sound_Detection_System.csv` "STEALTH VS SOUND" + "POWERS AFFECTING SOUND"):**
- Silenced weapon: **80 dB** (vs 140 normal pistol) — emit `decibels: 80`, not 140.
- Silent takedown: **20 dB** (vs 60). Stealth movement: **15 dB** (vs 30; requires half-speed = the `Walking_Careful` cue).
- `Sound_Absorption_Low` power: **−20 dB** inside a 3×3 area (range 10 sq); `Sound_Absorption_High`: **−140 dB** inside 7×7 (range 20 sq) → effectively silences anything ≤140 dB inside the zone. The Audio Director applies these as **per-tile dB modifiers** before routing.

### 3.2 Hearing-range & wall-dampening formula (verbatim §5.11)

```
Effective_dB = Base_dB − Σ(material dampening between source and listener)
Hearing_Range_squares = (listener.INS / 5) × (Effective_dB / 30)
heard  ⟺  grid_distance(source, listener) ≤ Hearing_Range_squares
```

Material dampening (from the CSV "MATERIAL DAMPENING" block; cumulative for multiple walls):

| Material | dB reduction |
|---|---|
| Open_Air | 0 |
| Glass_Window | −10 |
| Wooden_Wall | −20 |
| Wooden_Door_Closed | −25 |
| Metal_Door_Closed / Floor-Ceiling | −30 |
| Steel_Wall | −35 |
| Brick_Wall / Steel_Security_Door | −40 |
| Concrete_Wall | −50 |

Worked example (CSV "EXAMPLE CALCULATIONS", reproduced so the implementer can unit-test against it): *Pistol through a wooden wall* → `140 − 20 = 120 dB`; `Range = 6 × (120/30) = 24 squares` (the CSV uses INS 30 → INS/5 = 6). The Audio Director's `emitDiegetic()` MUST reproduce `24` for this input. *Whisper through a door* → `20 − 25 = −5 dB → not heard` (clamp negative Effective_dB to 0 range).

**Voice-line (bark) loudness** = the dB of the matching `Talking_*` row:
- normal combat bark → `Talking_Normal` 50 dB; a `spot_enemy` shout or `scream` (`go_down`, `low_hp` panic) → `Talking_Loud` 65 dB or `Scream` 80 dB. So **barking gives away position** exactly like real talking does (a stealth unit's `isMute`/whisper keeps it at `Talking_Whisper` 20 dB). Source: §5.11 Talking rows.

### 3.3 Flight & altitude audio (Bible §5.4 + §5.11 flight rows)

- Flight cue dB swaps by altitude: `Flight_Low` **45 dB** (range 6, no wall penetration) at Z0–Z2; `Flight_High` **80 dB** (range 20, penetrates, "supersonic boom possible") at Z3+. `Super_Speed_Sonic_Boom` adds **+80 dB** at 30-sq range when a super-speedster breaks the barrier (unavoidable — no stealth flight at that speed). Source: `Sound_Detection_System.csv` rows Flight_Low/High + Super_Speed_Sonic_Boom.
- Positional audio uses the unit's `currentZ` for vertical attenuation: pass `maxDistance` to `SoundManager.playPositional` scaled by the cue's `Hearing_Range_squares`, and add an extra **−1 dB per altitude level of separation** between source-Z and listener/camera-Z (RULING R2, consistent with §5.4 "−CS to-hit-from-ground / weapon falloff as you climb"; the data gives no per-level audio number so this mirrors the to-hit falloff at 1:1).

### 3.4 Bark selection (the resolver) & anti-spam

On any `BarkTrigger`, the resolver:
1. Filter `voiceLines.json` to lines where `trigger` matches AND (`personalityBucket` empty OR contains the unit's effective `personalityId`) AND threat gate passes (`Stat_Rank_Mapping` Threat_Level ≥ `threatTierMin`).
2. If `now − character.lastBarkAt[trigger] < cooldownSec` → **suppress** (no line). **RULING R3:** default `cooldownSec = 8s`, global per-unit floor of `2s` across *all* triggers so a unit can't machine-gun barks (data lacks a number; 8/2 chosen to match JA2-style bark density — owner-tunable in data).
3. Pick deterministically: `index = hash(eventSeed ⊕ unitId ⊕ trigger) mod candidates.length` (pure function → see §4.6 MP-replay & §7.5 — **never `Math.random()`** in the resolver).
4. Emit the line as: a phone/HUD bubble (text) + an `AudioCue{ category:'voice', decibels: <Talking_* per §3.2> }`. If `audioKey` present, play VO; else text-only (TTS is OWNER-FORK F3).

### 3.5 Ambient-bed selection (consumes the spine)

```
score(bed) = (bed.selector.faction matches ? 8 : 0)
           + (bed.selector.cityType matches ? 4 : 0)
           + (bed.selector.terrainCode matches ? 2 : 0)
           + (bed.selector.cultureRegion matches ? 1 : 0)
           + (bed.selector.weather matches ? 1 : 0)
chosen = argmax(score); ties → first in file order; fallback = layer's 'generic' bed
```
Weights (faction 8 > cityType 4 > terrain 2 > culture/weather 1) encode the GDD's explicit per-faction ambient priority (1457–1464: "USA Levels Ambient / Nigeria / China / India") over the finer environmental texture. **RULING R4:** weights are data-overridable constants in `ambientBeds.json` `_meta`; the values here are the defaults (source: GDD lists faction beds first and by name, so faction dominates).

Environmental masking (CSV "ENVIRONMENTAL SOUND SOURCES") raises the **detection floor**, not just the mix: `City_Ambient` 40 dB, `Rain` 35 dB (−10% hearing range), `Heavy_Rain/Storm` 55 dB (−30% range), `Crowd_Noise` 60 dB ("covers movement sounds"), `Combat_Zone` 80+ dB. The active bed's `maskingDb` is fed to the detection subsystem so e.g. `Walking_Careful` (15 dB) is **inaudible under city ambient** — exactly the JA2 "use the crowd" texture. Apply the range-reduction percentages from the CSV directly.

### 3.6 Mixer / ducking (layered priorities)

- Three layer buses (`laptop`/`world`/`tactical`) each with a player volume slider; `SoundManager` category volumes nest under them.
- **Laptop pauses the world** (Bible §7 / GDD 497): when laptop opens, **duck** world+tactical beds to 20% over 300 ms; restore on close. This is the audio of "time paused."
- **Speaker bubble & priority barks duck ambient:** a `priority ≥ 70` cue (scream, `phone_greeting` on speaker, `rep_condemn` sting) ducks the active ambient bed by −6 dB-equivalent (×0.5 volume) for the cue's duration. **RULING R5:** ducking amount/attack/release (0.5×, 300 ms / 500 ms) are not in the data; chosen as standard game-audio ducking and exposed in `audioMix._meta`.

### 3.7 Phone notification urgency → ringtone tier (consumes `Time_Management`)

`Event_Priority_*` (Time_Management.csv) maps to phone alert tier:

| Event_Priority | Phone cue | Bubble emphasis |
|---|---|---|
| Critical (respond ≤2h) | `ui_notify` urgent + repeat ×3 + vibrate flag | red, large |
| High (≤24h) | `ui_notify` urgent ×1 | orange |
| Medium (≤72h) | `ui_notify` standard | yellow |
| Low (optional) | `ui_nav` soft chime | neutral |
| Background | silent badge only | none |

This reuses the catalog `ui_notify` / `ui_nav` categories already on disk. `MobilePhone.tsx`'s existing `PHONE_MESSAGE_TYPES` map onto triggers: `call_incoming`→`phone_greeting`, `idle_warning`→`idle_concern`/`idle_addiction`, `arrival`→a `world` arrival sting, `handler`→priority-gated `ui_notify`.

---

## 4. How It Consumes the SPINE (which stats drive it, with formulas)

The Audio Director is a **pure consumer** of the spine — it never writes country/city/personality state. Five reads:

1. **City Type + Terrain + Culture (+ Faction) → ambient bed.** `chooseBed()` per §3.5. (Spine: `City_Type_Effects` 10 types, `TerrainCodes` 25, `Culture_Region_Effects` 14, `Faction_Specification` 4.)
2. **Faction identity → voice pack.** `character.voicePackId ??= 'faction_' + character.faction` (GDD 1457–1464 per-faction sound). A character with a `voiceOverride` personality uses that for *line tone* while keeping the faction *accent* pack.
3. **Personality (1..20) → bark line filter & idle-ping tone.** Same `personalityId` system 03 uses for target selection (`PERSONALITY TARGET SELECTION`); here it filters `VoiceLine.personalityBucket`. Aggressive types (target-pref MAJOR_THREAT, e.g. ids 4/12 in the table) get taunt-heavy `attack_hit` lines; "least-health predator" bullies (LEAST_HEALTH pref, e.g. id 2/9/14) get cruel `kill` lines; RANDOM types (ids 18/19) get erratic/comic lines. (RULING R6: the *bucketing* of which ids get which tone is content authored in `voiceLines.json` — the spec fixes the *mechanism*, the writers fill the *flavour*; this is exactly system 03's "personality is the voice" hand-off, Bible §5.10 final sentence.)
4. **Threat Level (LeFevre) → voice-pack tier & scream gate.** `threatTierMin` gates "cosmic-confidence" lines to L3+ and panic `low_hp`/`go_down` screams scale: Alpha/peak-human units scream (`Scream` 80 dB) at low HP; L4+ powerhouses stay at `Talking_Loud` 65 dB (RULING R7 — data gives Threat_Level but no audio mapping; mapping confidence inversely to fear is a Bible-consistent ruling, owner-tunable).
5. **INS (listener) → the detection side of every cue.** `Hearing_Range = (INS/5) × (Effective_dB/30)` (§3.2). High-INS units hear the player's careless footsteps from far; `Enhanced_Hearing` power doubles it; `Helmet/Armor` subtracts 1–3 sq; `Deaf` status → 0 (and `isMute` characters emit no barks). (Spine: `Primary_Stats_Spec` INS; `Sound_Detection_System` CHARACTER HEARING block.)

**Combined-effects consumption (Bible §13 #9 — the explicit ruling that this must feed real systems):** the dB the Audio Director emits is **consumed by the Surveillance/Detection combined-effect** (Intel + Cyber + (100−MediaFreedom), Bible §8). High-surveillance countries lower the effective hearing threshold (cameras + mics extend the AI's "ears"); a `Corruption`-driven safe-house or a high-`Crowd_Noise` city raises masking. **Formula hook:** `detectionThreshold_sq = baseHearingRange × (1 − surveillanceModifier)` where `surveillanceModifier` is supplied by the Surveillance combined-effect system (this spec defines the *audio input*; the detection system owns the multiplier). This is the spine "made playable" rather than merely computed.

---

## 5. Edge Cases & Failure Modes

| # | Case | Handling |
|---|---|---|
| E1 | Cue missing a dB (diegetic) | **Dev:** assert/throw. **Prod:** default `0 dB`, `console.error`, still play for the human player but emit nothing to detection (so a content bug can't silently make a unit undetectable-but-loud). (R1) |
| E2 | Voice line exists but no `audioKey` (no VO recorded) | Render **text bubble only** (+TTS if F3 owner-enabled). Never block on missing audio — text-first, audio-progressive. |
| E3 | Bark trigger but unit is `Deaf`/`isMute`/`Status_Dead` | Suppress barks. Dead units may still get a one-shot `funeral` line *about* them (GDD 397) emitted by the world layer, not by the unit. |
| E4 | Two units bark same trigger same tick (e.g. squad spots enemy) | Mixer caps **concurrent voice cues at 2** (R8 — no data; chosen so a squad doesn't shout in unison); pick the 2 highest `priority`, others suppressed (still respect cooldown). |
| E5 | Speaker toggled ON mid-call with no VO for that line | Bubble renders in loud comic style (visual works without audio); play a generic `ui_notify` "speaker click". The visual comic-bubble is the *primary* §7.5 deliverable; audio is optional. |
| E6 | Sound source on a different floor / behind ≥3 walls | Apply cumulative dampening (§3.2); if `Effective_dB ≤ 0` → not heard (detection) AND attenuate human-player volume to near-zero (don't hard-cut — a faint thud through concrete is good feel; clamp floor at 5% volume). |
| E7 | `Sound_Absorption_High` zone overlaps a gunshot | Subtract −140 dB per the power; `140 − 140 = 0` → silent zone works (CSV row). Cue still *plays at 0 effective dB* (visual muzzle flash, no audible report) — emit `decibels: 0`. |
| E8 | Altitude Z6 flyer firing on Z0 ground | Flight cue uses `Flight_High` 80 dB; weapon cue unchanged; apply §3.3 −1 dB/level vertical attenuation for the human mix only (detection uses ground-plane distance per §5.11, which is 2D). |
| E9 | Laptop opened during loud combat | Duck tactical/world to 20% (§3.6); **do not stop** active one-shots (let the explosion ring out under the duck) — pausing time pauses *new* cues, not the tail of current ones. |
| E10 | Ambient bed has no `selector` match at all | Fall back to layer `generic` bed (always present in `ambientBeds.json`); log once. Never silence the world. |
| E11 | Idle ping fires while that character is `Status_Traveling/Busy/Hospitalized` | Gate `idle_*` triggers to `Status_Available`/`Ready` only (Time_Management Status rows). A hospitalized merc can still send an `idle_concern` *about* their health (R9 — flavour exception, owner-tunable) but not `idle_city`. |
| E12 | MP dimension boundary (stub) | Bark resolver is pure (§4.6); audio never crosses the dimension. If a remote unit acts, the local client replays the line from the shared `eventSeed` — no audio state synced. |
| E13 | Player muted master / category | Mute affects **only the human mix**; detection dB still emitted (muting your speakers must not make you stealthy). Hard invariant. |

---

## 6. UI / UX Hooks (how it surfaces)

- **Combat overlay (Phaser):**
  - **Sound cones** (CSV "SOUND CONES" block): when an AI unit *hears* something it didn't see, draw a cone at the heard-from bearing coloured by certainty — **Green** point (Exact, from `Major` sound-ID roll), **Yellow** 45° (Success/General direction), **Orange** 90° (Minor/Vague), **Red** 360° (Failed/heard-but-unknown). These are emitted by the detection system but *rendered* by the Audio Director's overlay so audio + visual stay coupled.
  - **Sound-radius rings:** reuse `SoundManager.calculateSoundRadius({decibels, baseRange})` to draw the expanding ring of any diegetic cue the *player's* units could be heard by (player-facing stealth feedback) — radius = `Hearing_Range_squares`.
  - **Bark bubbles:** small speech bubble over the acting unit (combat), 1.5 s, personality-coloured; mirrors the phone comic-bubble style at smaller scale.
- **Phone (`MobilePhone.tsx`, Bible §7.5):**
  - **Speaker toggle** (`phoneSpeakerOn`): flips the active dialogue/idle bubble into **loud comic-bubble** styling — larger font, bold weight, jagged/double-stroke tail, slight shake-on-enter — and plays VO if present (GDD 486). This is the headline §7.5 feature.
  - **Idle pings** dock as phone messages using existing `PHONE_MESSAGE_TYPES`: `idle_concern`/`idle_addiction`/`idle_city`/`idle_aging` → message with personality avatar + optional voice clip; tap to read full bubble. (GDD 221–226.)
  - **Dial-a-number calls** (GDD 487): an incoming/placed call opens a call view; on speaker → comic bubbles; ringtone tier from §3.7.
- **World map:** one-shot **stings** for `Public_Perception` events (Saved_Lives → triumphant `results` sting; Civilian_Casualties → dread sting; Team_Member_Death/`funeral` → memorial cue, GDD 397). Ambient bed audible under the map per active sector's faction/terrain.
- **Laptop:** UI sounds are `category:'ui'`, `decibels:-1` (non-diegetic); opening the laptop triggers the world-duck (§3.6). All four apps (Email/News/Personnel/Investigations) use `ui_nav`/`ui_notify` per §3.7.
- **Settings:** a mix panel exposing master + 3 layer sliders + the 44 category volumes (already supported by `SoundManager.setCategoryVolume`); a "Speaker default ON/OFF" toggle; F3-gated TTS toggle. Persisted to local prefs, **not** the diegetic save.

---

## 7. Integration Points (reads / writes)

| System | Audio Director READS | Audio Director WRITES |
|---|---|---|
| **Sound-Detection (§5.11)** | nothing | **emits dB + position** for every diegetic cue (the mechanic) |
| **Universal Table (§3.3 / ruling #1)** | combat outcome band (Failed/Minor/Success/Major) → bark `trigger` (miss/graze/hit/crit) | nothing (never rolls) |
| **Personality engine (system 03)** | `personalityId 1..20` → bark filter + idle-ping tone | nothing |
| **`CombatScene.ts` / `EventBridge.ts`** | combat events (attack resolved, unit down, overwatch) | emits `AudioCue` + bark bubble events back over EventBridge to React HUD |
| **`SoundManager.ts`** | catalog, category volumes | calls `playPositional` / `playSoundWithRadius` (delegates *how* to play) |
| **`MobilePhone.tsx`** | `phoneSpeakerOn`, message queue | renders comic bubbles, idle pings, call audio |
| **World clock / Laptop (§6.5)** | pause/open state | ducks world+tactical buses |
| **`Public_Perception.csv`** | reputation events | fires one-shot world stings + `funeral` lines |
| **`Time_Management.csv`** | `Event_Priority_*`, `Status_*` | selects ringtone tier; gates idle-ping eligibility |
| **Surveillance combined-effect (§8)** | `surveillanceModifier` | feeds emitted dB into the threshold formula (§4 "combined-effects consumption") |
| **Save / Time-Travel (§11)** | nothing diegetic | **NOTHING** — audio mix is local prefs only; barks are deterministic from event seeds, so a rewind replays the same lines without stored audio state |

---

## 8. RULING notes (resolved here because the data didn't settle them)

- **R1 — dB is mandatory on diegetic cues** (validated at the boundary). Makes §5.11 a real mechanic. (§2.1)
- **R2 — vertical audio attenuation = −1 dB per altitude level of source/listener separation** (human mix only), mirroring §5.4's to-hit falloff 1:1 because the audio data gives no per-level number. (§3.3)
- **R3 — bark cooldown 8 s/trigger, 2 s global floor per unit.** No data value; JA2-density default, data-overridable. (§3.4)
- **R4 — ambient selector weights faction 8 / cityType 4 / terrain 2 / culture 1 / weather 1.** Encodes GDD's faction-first ambient listing; in-data `_meta`. (§3.5)
- **R5 — ducking 0.5× volume, 300 ms attack / 500 ms release.** Standard game-audio default; in `audioMix._meta`. (§3.6)
- **R6 — line-tone↔personality bucketing is authored content, not code.** Spec fixes the mechanism; `voiceLines.json` holds the flavour. (§4.3)
- **R7 — scream/panic loudness scales inversely with Threat Level** (Alpha screams at 80 dB, L4+ stays ≤65). Bible-consistent (powerhouses don't panic), owner-tunable. (§4.4)
- **R8 — max 2 concurrent voice cues per tick.** Prevents squad-shout cacophony; no data. (§E4)
- **R9 — hospitalized units may still send `idle_concern` about their health** but not other idle pings. (§E11)

## 9. OWNER-FORK notes (genuine product choices only the owner can make)

- **F1 — Voiced VO vs. text-only at ship.** GDD 178–179 wants bespoke "famous-voice" actors for every character. That is a large content/budget commitment. **Owner decides:** (a) full VO for hero/named cast + text-only for generics, (b) text-only at ship with VO post-launch, or (c) full VO. The engine supports all three (E2); this choice sets the content budget and whether `audioKey` is usually present.
- **F2 — Run-time TTS for un-voiced lines (and idle pings/dial-a-number).** Synthesizing un-recorded lines (incl. the player handing out real phone numbers, GDD 487) would make *every* character "talk" cheaply, but risks an off-brand robotic voice and adds a dependency/latency/cost. **Owner decides** whether TTS is shipped, and if so which engine and whether per-character voice profiles are allowed.
- **F3 — Diegetic-bark loudness as difficulty toggle.** Barks at `Talking_*` dB give away your stealth (§3.2). Some players will hate that their merc shouting blew their infiltration. **Owner decides:** is "barks are audible to enemies" always-on (hardcore JA2 feel), an Easy-mode toggle, or off? Affects the §4 spine-consumption loop's tension.
- **F4 — Per-faction *accent/language* in voice packs.** GDD lists USA/Nigeria/China/India beds (1457–1464) and the world is 168 real countries. **Owner decides** how far localized voice/accent goes (full localized casts vs. English-with-accent vs. universal) — a brand, cost, and sensitivity decision, not a mechanics one.
- **F5 — Music layer ownership.** The GDD Sound section (1451) lists ambient/SFX but **no score/music system**. Is adaptive music part of *this* Audio Director, a separate system, or out of scope for the design phase? **Owner decides** scope; this spec covers SFX/voice/ambient and leaves a `layer:'music'` enum slot reserved but unspecified.

## 10. Open Questions

1. **Detection authority boundary.** This spec *emits* dB; which existing module owns the `Hearing_Range` comparison and the AI alert state machine — `CombatScene.ts` directly, or a dedicated `SoundDetection` service to be specced separately? (Recommend the latter; this spec assumes a `detection.emit(cue)` seam.)
2. **`cueDbMap.json` generation.** Should the 381 catalog keys be auto-bound to `Sound_Detection_System` action types by a build script (fuzzy category match) with manual overrides, or hand-authored? (Recommend script + override file.)
3. **Idle-ping cadence.** GDD says idle characters "text you their concerns" but gives no frequency. Tie to game-clock (e.g. one ping per character per game-day, weighted by personality `sociability`)? Needs a number once system 03's `sociability` field lands.
4. **Sound-cone rendering ownership in the symbolic combat grid.** Bible says combat is symbolic (plain grid + glyphs); do cones render as glyph overlays on the grid, or only on the phone "tactical readout"? Confirm with the combat-UI spec.
5. **Funeral audio.** GDD 397 makes a dead character's lost voice emotionally central. Is the funeral a scripted set-piece (bespoke audio) or a templated world-layer event with a memorial sting? (Content/owner call, relates to F1.)

---

*This spec owns the **emit** side of audio: it wraps every sound in an `AudioCue` carrying a decibel value straight from `Sound_Detection_System.csv`, so the §5.11 detection mechanic and the player's ears are driven by one number; it selects voice-line barks from the same 20-personality + Universal-Table outcomes the rest of the game uses; and it renders the §7.5 phone comic-bubble speaker mode and the GDD's idle "world-that-talks-to-you" pings. Every number traces to a named table or is a labeled RULING; every genuine product choice is a labeled OWNER-FORK.*
