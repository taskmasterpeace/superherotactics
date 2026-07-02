# 105 — Accessibility, Input Binding & Settings

> **System:** Accessibility, Input Binding & Settings (the cross-cutting "preferences layer" — colorblind/legibility for symbolic combat, input remapping, time-speed presets, audio/text presentation, motor/cognitive aids)
> **Status:** BUILD-READY SPEC
> **Tier:** Cross-cutting (touches every layer: phone, world-map, laptop, combat overlay). No checklist row — this spec covers the implicit accessibility risk created by SHT's symbolic combat and emoji-coded UI.
> **Spine consumed:** This system is mostly **presentation/config**, so it consumes the spine *indirectly* — it re-skins the glyphs/colors that the spine-driven systems emit (damage-type glyphs, status glyphs, relationship emojis, faction-standing colors, altitude indicators). The one place it *reads* live spine data is the **legend/inspector** (§6.5): it pulls the current country/city stat block to label what an on-screen color means. It writes nothing to the spine.
> **Bible anchors:** §3 (symbolic glyph-based combat — the colorblind/legibility risk this system mitigates), §5.4 (FLIGHT = altitude integer + wing/shadow indicator — needs a non-3D legible representation), §7.3 (PERSONNEL roster: who loves/hates whom in **emojis** — colorblind/emoji-legibility risk), §7.5 (PHONE speaker mode → louder comic-book bubbles — a text-presentation accessibility hook the GDD already calls for), §11 / §7 (REAL-TIME WITH PAUSE — timing sensitivity; laptop pauses), §13 ruling #1 (ship `Universal_Table_FIXED`), §13 ruling #9 (combined-effects must be consumed — the legend consumes them for explanation).

> **Source tables (read these to re-balance — never hardcode the numbers in code):**
> - `docs/csv-source-data/Professional_QOL_Features.csv` — **authoritative feature list**: rows `Accessibility_Screen_Reader`, `Accessibility_Color_Blind`, `Accessibility_Motor_Impairment`, `UX_Enhancement_Keyboard_Navigation`, `Quality_Of_Life_Hotkeys` ("Configurable hotkey system with conflict detection"), `Quality_Of_Life_Themes`, `UX_Enhancement_Tooltips`, `UX_Enhancement_Undo_Redo`, `UX_Enhancement_Auto_Save`.
> - `docs/csv-source-data/Mobile_vs_Desktop_Experience.csv` — **authoritative platform list**: `Mobile_Optimization_Touch_Controls` ("Large touch targets"), `Mobile_Optimization_Battery_Efficiency` ("Reduced animations"), `Desktop_Optimization_Keyboard_Shortcuts` ("customizable bindings"), `Cross_Platform_Synchronization` (settings must follow the save), `Cross_Platform_Notification`.
> - `docs/csv-source-data/Time_Management.csv` — the real-time ratios and `Event_Priority_*` deadlines that the **timing-assist** settings (auto-pause triggers) operate on.
> - `MVP/src/stores/enhancedGameStore.ts` lines 240–253 — the **already-shipped** `TimeSpeed` enum + `TIME_SPEEDS` table (`PAUSED / 1X / 10X / 60X / 360X`). The settings system **owns the default speed and the auto-pause rules**, not new speeds.
> - `MVP/src/components/KeyboardShortcuts.tsx` — the **already-shipped** static keybind map (Global / Navigation / Combat / World Map / Squad). The settings system makes this map **editable + persisted** and adds conflict detection.
> - `SuperHero Tactics/Combat Compendium REAL - 🔪DAMAGE TYPE TABLE🔫.csv` — the damage-type **glyphs/emoji** (🔨 Physical, 🏹 Bleed, ⚡ Energy, 💉 Biological, 🧠 Mental, ❓ Other, 😴 Out-of-Combat) that need colorblind-safe + shape-redundant rendering.
> - `SuperHero Tactics/Combat Compendium REAL - 😢EFFECT_STATUS😴.csv` — the status-effect catalog (Bleeding, Burning, Frozen, Stunned, Blind, Prone, Sleep, Mind Controlled, Berserk, …) each of which gets an icon that must be shape-distinct.
> - `docs/csv-source-data/Flight_Altitude_System.csv` — the 7 altitude levels (Z0–Z6) the combat overlay must render as a legible **integer + wing/shadow** indicator (Bible §5.4), not a 3D scene.
> - `docs/csv-source-data/Game_Mechanics_Spec/Tactical_Grid_System.csv` — the grid/glyph layer the combat overlay sits on (visibility conditions, cover tiers — all currently color-coded).
> - `SuperHero Tactics/FIST GDD v02.txt` lines 486–487 — **speaker mode**: "turning on the 'speaker' … will change the text bubble to display as if it is louder like in comic books" (text-presentation hook).

---

## 1. Overview & Player Fantasy

SHT made two deliberate art bets that **create accessibility debt**, and this system pays it down:

1. **Combat is symbolic** (Bible §3, §5.4): a plain grid of **glyphs**, where flight is "an altitude integer + a wing/shadow indicator," damage types are **emoji** (🔨⚡💉🧠), and status/cover/visibility are **color tiers**. Symbolic UIs are fast to read *if you can distinguish the symbols* — and brutal if you can't (color vision deficiency, low vision, small mobile screens).
2. **The world talks to you in emoji** (Bible §7.3): the roster shows "who loves/hates whom (emojis)," factions are color-banded (Home green / Hostile red), and the phone pings with priority colors.

Plus the clock is **real-time-with-pause** (Bible §11): a player who reads slowly, or has motor latency, must never lose a campaign because they couldn't click in time. The Bible's own design *gives the tools* — the laptop already pauses; this system makes pausing **automatic and configurable** so timing is a preference, not a skill gate.

**Player fantasy (the accessible version of the core fantasy):** *"I can read this board. The fire glyph is unmistakable even though I can't tell red from green. Combat never out-clocks me because the game pauses when something needs me. I rebound every key to where my hands actually are. The game looks how I need it to look — and none of that cost me a single mechanical advantage."*

**Design stance — accessibility is settings, never a separate "easy mode":** every option here is **cosmetic or timing**, and changes **zero** combat math. Colorblind palettes re-skin glyphs; they do not change `Universal_Table_FIXED` outcomes. Auto-pause changes *when* the clock stops, never the 1:30 time ratio. This keeps the spine pure (Pillar #1: the data tables own the numbers; settings only own presentation).

**Non-goals (scope guards):**
- Does **not** add new combat mechanics, new time speeds (the 5 in `TIME_SPEEDS` are canon), or new emoji.
- Does **not** localize text (i18n is a separate system; this system only owns *font size, weight, and bubble style*).
- Does **not** design multiplayer settings sync — but per `Cross_Platform_Synchronization`, settings are **stored separately from the save** (device-local) so the time-traveler's other-dimension MP stub can later sync *game state* without dragging a player's personal a11y prefs across devices. (Bible: MP is an architectural stub.)

---

## 2. Data Schema (fields / types)

All settings live in one device-local store, versioned for migration. **Settings are NOT part of the diegetic time-travel save** — they are per-device, per-player config (per `Cross_Platform_Synchronization`: "Platform-independent data layer"; presentation prefs should not rewind when you load a save).

```ts
// ─────────────────────────────────────────────────────────────────────────────
// Persisted to localStorage key "sht.settings.v1" (web) / platform pref store.
// VERSION it so old configs migrate instead of crashing (QOL: Auto_Save / Data_Validation).
// ─────────────────────────────────────────────────────────────────────────────
interface SettingsState {
  schemaVersion: 1;

  vision:    VisionSettings;
  audio:     AudioSettings;
  text:      TextSettings;
  motor:     MotorSettings;
  cognitive: CognitiveSettings;
  timing:    TimingSettings;
  input:     InputSettings;
  platform:  PlatformOverrides;
}

// ── VISION ──────────────────────────────────────────────────────────────────
type ColorBlindMode = 'OFF' | 'PROTANOPIA' | 'DEUTERANOPIA' | 'TRITANOPIA' | 'MONOCHROME';
interface VisionSettings {
  colorBlindMode: ColorBlindMode;          // re-maps the palette token set (§3.1)
  glyphRedundancy: boolean;                 // ALWAYS show shape+label, never color-only (§3.2). DEFAULT true.
  highContrast: boolean;                    // swaps to the HC palette (§3.1). DEFAULT false.
  uiScale: number;                          // 0.75..2.0 multiplier on all UI px. DEFAULT 1.0 (§3.3)
  combatGlyphScale: number;                 // 0.75..2.0 multiplier on grid glyphs only. DEFAULT 1.0
  reduceTransparency: boolean;              // solid panels instead of blur/alpha. DEFAULT false.
  altitudeIndicatorStyle: 'NUMBER_ONLY' | 'NUMBER_PLUS_SHADOW' | 'NUMBER_PLUS_SHADOW_PLUS_BAR'; // §3.4
}

// ── AUDIO ───────────────────────────────────────────────────────────────────
interface AudioSettings {
  master: number; music: number; sfx: number; voice: number; ui: number; // 0..100 each
  speakerMode: boolean;          // GDD 486: render dialogue as LOUD comic bubbles + show captions. DEFAULT false.
  subtitles: boolean;            // captions for all voiced/phone content. DEFAULT true (a11y default-on).
  visualSoundCues: boolean;      // mirror the dB sound model (Bible §5.11) as on-screen ripples for deaf play. DEFAULT false.
  monoAudio: boolean;            // collapse stereo to mono (single-ear / HoH). DEFAULT false.
}

// ── TEXT ────────────────────────────────────────────────────────────────────
type FontFace = 'DEFAULT' | 'DYSLEXIC' | 'HIGH_LEGIBILITY';
interface TextSettings {
  fontFace: FontFace;            // DEFAULT 'DEFAULT'
  fontScale: number;             // 0.85..1.75 on body text. DEFAULT 1.0
  lineSpacing: number;           // 1.0..2.0. DEFAULT 1.4 (matches design std)
  bubbleStyle: 'NORMAL' | 'LOUD_COMIC';  // mirrors speakerMode for the phone (GDD 486)
  screenReader: boolean;         // emit ARIA live-region announcements (§3.6). DEFAULT auto-detect.
}

// ── MOTOR ───────────────────────────────────────────────────────────────────
interface MotorSettings {
  largeTouchTargets: boolean;    // Mobile_Optimization_Touch_Controls. DEFAULT (mobile=true / desktop=false)
  dragTolerancePx: number;       // Accessibility_Motor_Impairment "drag tolerance". DEFAULT 8 (mobile 16)
  holdToConfirmMs: number;       // long-press duration for destructive confirms. DEFAULT 500
  stickyModifiers: boolean;      // tap Shift/Ctrl then key instead of chord. DEFAULT false.
  doubleTapWindowMs: number;     // 200..600. DEFAULT 300
  noTimedDoubleClick: boolean;   // replace all double-clicks with single-tap+menu. DEFAULT false.
}

// ── COGNITIVE ───────────────────────────────────────────────────────────────
interface CognitiveSettings {
  reduceMotion: boolean;         // kill non-essential animation (Battery_Efficiency / vestibular). DEFAULT respects OS prefers-reduced-motion.
  confirmDestructive: boolean;   // dialog before irreversible acts (fire merc, time-jump). DEFAULT true.
  tooltipVerbosity: 'OFF' | 'TERSE' | 'FULL'; // UX_Enhancement_Tooltips. DEFAULT 'FULL'
  tooltipDelayMs: number;        // 0..1500. DEFAULT 400
  showGlyphLegendAlways: boolean;// pin the combat legend (§6.5). DEFAULT false (true on first 3 combats)
  undoBufferEnabled: boolean;    // UX_Enhancement_Undo_Redo for free-movement & menu acts. DEFAULT true.
}

// ── TIMING (the real-time-with-pause assist layer) ──────────────────────────
interface TimingSettings {
  defaultSpeed: TimeSpeed;       // 0..4 — which speed a new session/un-pause resumes at. DEFAULT 1 (1X)
  autoPauseOn: AutoPauseTriggers;
  combatTurnTimerSeconds: number | 'OFF'; // OFF = no per-turn clock (DEFAULT 'OFF' — SHT is turn-based)
  worldEventGraceMode: boolean;  // hold an Event_Priority_Critical alert paused until acknowledged. DEFAULT true.
}
interface AutoPauseTriggers {
  onLaptopOpen: boolean;         // Bible §7: laptop pauses time. DEFAULT true (CANNOT be disabled — see §3.5)
  onPhonePing: boolean;          // pause on incoming priority ping. DEFAULT false
  onCriticalEvent: boolean;      // pause on Event_Priority_Critical (Time_Management). DEFAULT true
  onHighEvent: boolean;          // pause on Event_Priority_High. DEFAULT false
  onSquadArrival: boolean;       // pause when a travelling squad reaches destination. DEFAULT true
  onCombatStart: boolean;        // pause the world clock when "CONTACT!" fires. DEFAULT true (CANNOT be disabled)
  onMemberInjuredOrDown: boolean;// pause on roster Status_Injured/Dead transition. DEFAULT true
}

// ── INPUT (rebindable keymap + pointer) ─────────────────────────────────────
interface InputSettings {
  bindings: Record<ActionId, Binding[]>;   // ActionId → up to 2 bindings (primary+alt) (§3.7)
  mouseSensitivity: number;                 // world-map pan/zoom speed 0.25..3.0. DEFAULT 1.0
  invertZoom: boolean;                      // DEFAULT false
  edgeScrollEnabled: boolean;               // world-map edge-pan. DEFAULT (desktop true / mobile false)
}
interface Binding { code: string; mods: ('Shift'|'Ctrl'|'Alt'|'Meta')[]; } // code = KeyboardEvent.code
type ActionId = string;  // stable id, e.g. "combat.endTurn", "nav.worldMap" (catalog in §3.7)

// ── PLATFORM (auto-detected, user-overridable) ──────────────────────────────
interface PlatformOverrides {
  detected: 'DESKTOP' | 'MOBILE' | 'TABLET'; // from viewport+input (Mobile_vs_Desktop_Experience)
  forceProfile: 'AUTO' | 'DESKTOP' | 'MOBILE';   // DEFAULT 'AUTO'
  batterySaver: boolean;                          // Mobile_Optimization_Battery_Efficiency. DEFAULT false
  offlineFirst: boolean;                          // Mobile_Optimization_Offline_Capability. DEFAULT (mobile true)
}
```

`TimeSpeed` and `TIME_SPEEDS` are imported from `enhancedGameStore.ts` — **do not redefine them here.** This system reads/writes `defaultSpeed` and calls the existing `setTimeSpeed()` / `togglePause()` actions; it does not own the clock.

---

## 3. Exact Numbers, Tables & Formulas (each cited)

### 3.1 Colorblind palette token set — re-skin, don't recompute

The game must render every color through a **named token**, never a raw hex literal, so `colorBlindMode` can swap the token table. The semantic tokens come from what the source data actually color-codes:

| Token | Used by (source) | Default hue family | The redundancy rule |
|---|---|---|---|
| `dmg.physical` | DAMAGE TYPE TABLE 🔨 | grey/steel | + glyph 🔨 + label "PHYS" |
| `dmg.bleed` | DAMAGE TYPE TABLE 🏹 | crimson | + glyph 🩸 + label "BLEED" |
| `dmg.energy` | DAMAGE TYPE TABLE ⚡ | amber/gold | + glyph ⚡ + label "NRG" |
| `dmg.biological` | DAMAGE TYPE TABLE 💉 | green | + glyph 💉 + label "BIO" |
| `dmg.mental` | DAMAGE TYPE TABLE 🧠 | teal | + glyph 🧠 + label "PSI" |
| `dmg.other` | DAMAGE TYPE TABLE ❓ | white | + glyph ❓ + label "OTHER" |
| `cover.light/med/heavy` | Tactical_Grid_System cover tiers (+1/+2/+3 CS) | 1/2/3 chevrons | shield-pip count, not hue |
| `vis.bright/dim/dark` | Tactical_Grid_System visibility | brightness ramp | always pair with a sun/cloud/moon icon |
| `rel.nemesis…bonded` | roster who-loves/hates emojis (Bible §7.3) | red→green ramp | + emoji 💢/🙁/😐/🙂/❤️ (shape-distinct) |
| `faction.home/ally/neutral/hostile` | Faction territory ±CS (Bible §6.4) | green/blue/grey/red | + border pattern (solid/dashed/dotted/double) |
| `priority.critical…background` | Time_Management Event_Priority_* | red→grey ramp | + numeral 1–5 badge |
| `outcome.failed/minor/success/major` | Universal_Table_FIXED bands | grey/yellow/green/gold | + word label (never color alone) |

**The four modes** are **palette transforms**, applied at the token layer (one place):
- `PROTANOPIA` / `DEUTERANOPIA` — shift the red↔green pairs to a **blue/orange axis** (the standard CVD-safe pair). Affects `dmg.bleed↔dmg.biological`, `rel.*`, `faction.home↔hostile`, `priority.*`, `outcome.*`.
- `TRITANOPIA` — shift the blue↔yellow pairs; remap `dmg.energy↔dmg.mental`.
- `MONOCHROME` — drop all hue; everything renders by **shape + label + brightness** only. This is the ultimate fallback and proves redundancy is complete.

> No combat number changes. The palette transform is a lookup `displayColor = paletteTable[colorBlindMode][token]`. (Source for the requirement: `Professional_QOL_Features.csv` → `Accessibility_Color_Blind` = "Color-blind safe palette; shape indicators; pattern usage".)

### 3.2 Glyph redundancy rule (the core mitigation for symbolic combat)

`glyphRedundancy = true` (default) enforces: **no piece of game-state information may be conveyed by color alone.** Every colored element must *also* carry at least one of {distinct glyph, text label, shape/pattern, numeral}. This is checkable: the combat renderer asserts that each glyph has a non-null `shapeId` and `label`. Source requirement: `Accessibility_Color_Blind` ("shape indicators; pattern usage") and the symbolic-combat risk in Bible §3.

### 3.3 UI scale — exact clamp & layout rule

`uiScale ∈ [0.75, 2.0]`, step 0.05, applied as a root `--ui-scale` CSS var. `combatGlyphScale` is independent so a player can blow up the *grid* without bloating the HUD. Mobile minimum touch target when `largeTouchTargets=true`: **44×44 CSS px** (the platform-standard from `Mobile_Optimization_Touch_Controls` "Large touch targets"). RULING on the exact px (data says "large," not a number) — see §8.

### 3.4 Altitude indicator — the legible non-3D representation (Bible §5.4)

The Bible mandates flight = "an altitude integer + a wing/shadow indicator." `altitudeIndicatorStyle` controls how much redundancy:

| Style | Renders | Source |
|---|---|---|
| `NUMBER_ONLY` | the Z-level integer `0..6` on the unit | Flight_Altitude_System `Altitude_Level` |
| `NUMBER_PLUS_SHADOW` (DEFAULT) | integer **+** a ground-shadow offset whose size scales with Z (small shadow = high) | wing/shadow indicator (Bible §5.4) |
| `NUMBER_PLUS_SHADOW_PLUS_BAR` | the above **+** a 7-segment vertical bar lit to current Z (max-Z capped per power) | for low-vision: a second channel |

The integer is sourced directly from the unit's altitude level (`Flight_Altitude_System` rows Z0=Ground … Z6=Extreme, 1500+ ft). No new altitude math — this is purely how the existing integer is drawn. Indoor ceiling caps (max Z = ceiling_ft ÷ 10, Bible §5.4) still apply and the bar greys-out unreachable segments.

### 3.5 Auto-pause — exact trigger semantics, and what CANNOT be disabled

Time only advances on the world layer (Bible §11; the existing clock ticks per `TIME_SPEEDS[speed].tickInterval`). Auto-pause calls the existing `togglePause()`/`setTimeSpeed(0)`:

| Trigger | Default | Disable-able? | Source |
|---|---|---|---|
| `onLaptopOpen` | ON | **NO** (Bible §7: "Opening the laptop pauses time") | Bible §7 |
| `onCombatStart` | ON | **NO** (combat is turn-based; the world clock must hold) | Bible §5.1 "CONTACT!" |
| `onCriticalEvent` | ON | yes | Time_Management `Event_Priority_Critical` ("must respond within 2 hours real time") |
| `onHighEvent` | OFF | yes | `Event_Priority_High` ("within 24h") |
| `onSquadArrival` | ON | yes | Status_Traveling → arrival (Time_Management) |
| `onMemberInjuredOrDown` | ON | yes | roster Status_Injured/Dead |
| `onPhonePing` | OFF | yes | phone priority ping (system #1) |

`worldEventGraceMode = true` means an Event_Priority_Critical alert **holds the game paused** until the player explicitly acknowledges (so a player who stepped away or reads slowly never auto-fails a 2-hour-real-time deadline — converting the timing pressure into a notification, not a fail-state). The deadline *clock* still exists in fiction but does not tick while grace-paused.

`combatTurnTimerSeconds` defaults to `'OFF'` — SHT combat is turn-based (Bible §5.1, 6 AP/turn), so there is **no** per-turn shot clock by default. The field exists only so a future "speed-run/MP" mode could opt in; single-player never imposes one.

### 3.6 Screen-reader announcement contract

When `screenReader=true` (auto-detected via the OS/AT API where the platform exposes it), the game emits ARIA live-region text for: turn order changes, hit/miss outcome bands (the `outcome.*` word, e.g. "Major — critical hit, knockback"), HP threshold crossings, incoming priority pings, and squad arrivals. Combat outcome wording is the **band name from `Universal_Table_FIXED`** (Failed/Minor/Success/Major) so the announcement and the visual agree. Source requirement: `Accessibility_Screen_Reader` = "ARIA labels; semantic HTML; screen reader testing".

### 3.7 Rebindable input — action catalog & conflict detection

The bindings map seeds from the **already-shipped** `KeyboardShortcuts.tsx` map. Each row becomes a stable `ActionId`:

| ActionId | Default `code` | Context | (from KeyboardShortcuts.tsx) |
|---|---|---|---|
| `global.help` | `Slash` (?) | global | "Show/hide shortcuts" |
| `global.back` | `Escape` | global | "Close modals" |
| `global.devMode` | `F2` | global (dev) | "Toggle dev mode" |
| `global.assetMgr` | `F4` | global (dev) | "Asset Manager" |
| `nav.worldMap` | `KeyM` | nav | "Open World Map" |
| `nav.character` | `KeyC` | nav | "Character Screen" |
| `nav.investigations` | `KeyI` | nav | "Investigations" |
| `nav.news` | `KeyN` | nav | "News Browser" |
| `nav.hospital` | `KeyH` | nav | "Hospital" |
| `nav.equipment` | `KeyE` | nav | "Equipment Shop" |
| `combat.endTurn` | `Space` | combat | "End turn / Confirm" |
| `combat.cycleUnit` | `Tab` | combat | "Cycle units" |
| `combat.slot1..9` | `Digit1..9` | combat | "Select action/weapon slot" |
| `combat.reload` | `KeyR` | combat | "Reload" |
| `combat.overwatch` | `KeyO` | combat | "Toggle overwatch" |
| `combat.grenade` | `KeyG` | combat | "Toggle grenade mode" |
| `map.pan*` | `Arrow*` | worldMap | "Pan map" |
| `map.zoomIn/Out` | `Equal`/`Minus` | worldMap | "Zoom" |
| `map.deploy` | `KeyD` | worldMap | "Deploy to sector" |
| `map.timeControls` | `KeyT` | worldMap | "Time controls" |
| `squad.member1..4` | `Digit1..4` | squad | "Select squad member" |
| `squad.selectAll` | `KeyA` | squad | "Select all" |

**Conflict detection** (`Quality_Of_Life_Hotkeys` = "Configurable hotkey system with **conflict detection**"): a binding conflicts only if another action **in the same `context`** uses the identical `{code, mods}`. The same key may bind different actions across contexts (e.g. `Digit1` = combat slot 1 *and* squad member 1 — never active simultaneously). The rebind UI shows a red badge + the conflicting action's name and refuses to save until resolved or the player chooses "unbind the other." `stickyModifiers` (Motor) lets a player press Shift then the key instead of chording.

### 3.8 Time-speed presets — reuse the shipped table, don't invent

`defaultSpeed` selects from the **existing** five speeds (`enhancedGameStore.ts` 248–253): `0 PAUSED / 1 = 1X (1 min/tick) / 2 = 10X / 3 = 60X / 4 = 360X`. No new speeds are added. The settings layer only decides (a) which speed a new game/un-pause resumes at and (b) the auto-pause rules of §3.5.

---

## 4. How It Consumes the SPINE

This is a presentation layer, so it consumes the spine **as labels and colors to explain**, never as math it alters. Three concrete consumptions:

1. **Legend/inspector explains spine colors (read-only).** When the player opens the combat/world legend (§6.5), the panel reads the **current country + city stat block** (the spine) to caption what an on-screen color *means here*. Formula: for a hovered faction-tinted sector, the legend pulls `faction.standing(country)` (Home/Ally/Neutral/Hostile, Bible §6.4) and the driving combined-effect (e.g. Surveillance = `Intel + Cyber + (100−MediaFreedom)`, Bible §8) and renders: *"Red border = HOSTILE territory here (−2CS). Surveillance HIGH (78) — you're spotted fast."* This satisfies ruling #9 (combined-effects must be *consumed*) at the explanation layer. Computed by the spine systems; this system only formats their output.

2. **Relationship emojis (read-only re-skin).** The roster's who-loves/hates display (Bible §7.3) is driven by system #03's `Relationship.band` (NEMESIS…BONDED). This system maps each band to a **shape-distinct, colorblind-safe emoji** (💢/🙁/😐/🙂/❤️) so the relationship reads without color. It reads the band; it never changes the score.

3. **Priority colors (read-only re-skin).** Phone/world pings carry an `Event_Priority_*` level (Time_Management). This system renders that level as `color + numeral badge (1–5)` and, when `autoPauseOn.onCriticalEvent`, halts the clock. The priority is computed upstream (events engine); this system styles + paces it.

**It writes nothing to the spine.** Settings never modify country/city/personality stats, CS values, or outcomes.

---

## 5. Edge Cases & Failure Modes

| # | Case | Required behavior |
|---|---|---|
| E1 | Corrupt/old settings blob on load | Validate against `schemaVersion`; on mismatch run a migrator, on unrecoverable data **reset to defaults** and toast "Settings reset" (never crash — `Data_Validation` QOL row). |
| E2 | Player rebinds a key to something already used in the same context | Block save, show conflict badge + offending action name; offer "swap" or "unbind other" (§3.7). |
| E3 | Player unbinds an essential action (e.g. `combat.endTurn`) | Allowed, but the on-screen button for that action **stays** (buttons are never keyboard-only) so the game is never softlocked. |
| E4 | `colorBlindMode=MONOCHROME` but a third-party/news image is inherently color | Don't recolor content imagery; only recolor **game-state tokens**. Captions/labels carry the meaning. |
| E5 | Auto-pause storms (3 triggers fire in one tick) | Pause is idempotent — first trigger pauses, the rest are no-ops; queue the notifications, surface highest-priority first. |
| E6 | Player disables `onCriticalEvent` auto-pause then misses a 2-hour-real deadline | Allowed (player choice), but `worldEventGraceMode` (default ON) still *holds the alert* until acknowledged, so the deadline can't silently expire unless the player also turned grace OFF. |
| E7 | `forceProfile=MOBILE` on a desktop (or vice-versa) | Honor the override fully (layout + touch targets), per `Mobile_vs_Desktop_Experience` `forceProfile`. |
| E8 | Screen reader on, but platform exposes no AT API | Degrade to **visible** live-region text (a captions strip) so info is still non-audio. |
| E9 | `reduceMotion=true` collides with an animation that conveys info (e.g. knockback arc) | Replace the *animation* with an instant state change **plus a one-frame marker/label** ("KB→3sq"), never drop the information. |
| E10 | Settings changed mid-combat | Apply visual settings live; defer input-rebind changes to end of current action to avoid eating an in-flight keypress. |
| E11 | `combatGlyphScale=2.0` overflows a 20×20 grid on mobile | Glyphs clip to cell with a scrollable/zoomable grid; never overlap neighboring tiles' hit areas. |
| E12 | Two devices, one save (Cross_Platform_Synchronization) | Game state syncs; **settings stay device-local** (do not sync a11y prefs across devices — §1 non-goal). |

---

## 6. UI/UX Hooks (how it surfaces)

### 6.1 Settings entry points
- **Laptop:** a `Settings` app icon (matches the existing `Settings` lucide icon already imported in `KeyboardShortcuts.tsx`). Opening it pauses time (it's a laptop app — §3.5).
- **Combat overlay:** a small gear in the combat HUD opens a **reduced** settings panel (vision + glyph scale + legend toggle + reduce-motion) without leaving combat.
- **Phone:** mobile profile gets the same store via a touch-first sheet (`Mobile_Strategic` portrait layout).

### 6.2 Panel structure (tabs, matching the schema groups)
`Vision · Audio · Text · Motor · Cognitive · Timing · Input · Platform`. Each control shows a **live preview** (the design-std modal pattern): the Vision tab renders a sample combat tile (fire glyph, a wounded unit, a Z-3 flyer, a HOSTILE-border sector) that re-skins instantly as the player toggles `colorBlindMode` — so they *see* the fix before committing.

### 6.3 First-run accessibility prompt
On first launch, a one-screen prompt offers: text size, colorblind mode, reduce motion, subtitles (default ON). Skippable, re-openable from Settings. (Respects OS `prefers-reduced-motion` / `prefers-contrast` as the initial defaults.)

### 6.4 Input rebind UI
Per-context list (the §3.7 catalog), "click to rebind → press key," live conflict badge, "Reset section" and "Reset all" buttons. The existing read-only `KeyboardShortcuts.tsx` modal becomes the **rendered view** of the live bindings (so the help overlay always shows the player's *actual* keys, not the defaults).

### 6.5 The combat glyph legend (the keystone a11y hook)
A pinnable panel (toggle `showGlyphLegendAlways`, auto-pinned for the first 3 combats) listing every on-screen glyph with its **shape + label + meaning**, and — consuming the spine (§4.1) — a "here & now" line explaining the local faction tint and the dominant combined-effect. This is what makes a symbolic board *teachable*.

### 6.6 World-map & phone
- World-map sector tints get the colorblind transform + the border-pattern redundancy (`faction.*` patterns from §3.1).
- Phone pings get the `priority` numeral badge; `speakerMode`/`bubbleStyle=LOUD_COMIC` renders incoming calls as large comic bubbles with captions (GDD 486) — doubling as a low-vision + Deaf/HoH aid.

---

## 7. Integration Points (what it reads / writes)

| System | Reads | Writes |
|---|---|---|
| Clock / Time (enhancedGameStore `TIME_SPEEDS`, `togglePause`, `setTimeSpeed`) | the 5 speeds, current pause state | calls `setTimeSpeed`/`togglePause` for auto-pause & default speed (§3.5/3.8) |
| Combat overlay (CombatScene / Tactical_Grid_System) | grid glyph + altitude integer (Flight_Altitude_System) + cover/visibility tiers | the **palette token table + glyph scale + altitude style + reduceMotion** the renderer must obey |
| Personality & Relationship engine (#03) | `Relationship.band` | nothing (re-skins band → emoji only) |
| Events engine / Phone (#01/#02) | `Event_Priority_*` of each ping | auto-pause decision + priority badge styling |
| Spine (Country/City effects, Combined-effects §8) | current stat block, faction standing | nothing (legend formats it — §4.1) |
| Save/Load (diegetic time-travel) | nothing | **settings are NOT in the save**; stored device-local, never rewound (§1/E12) |
| Platform detector (Mobile_vs_Desktop_Experience) | viewport, input type | `platform.detected`; honored unless `forceProfile` overrides |
| Screen reader / OS AT | OS prefs (reduced-motion, contrast, AT presence) | ARIA live announcements (§3.6) |

**Contract for every other system:** *never read a raw color or a raw key.* Read the **token** (`paletteTable[mode][token]`) and the **binding** (`bindings[actionId]`). This single rule is what makes the whole game re-skinnable from one place and is the build-time guard for the glyph-redundancy assertion (§3.2).

---

## 8. RULING: notes (where the data didn't fully settle)

- **RULING R1 — Minimum touch target = 44 CSS px.** `Mobile_Optimization_Touch_Controls` says "large touch targets" but gives no number. Ruling: 44×44 px when `largeTouchTargets=true` (the cross-platform de-facto standard), 32×32 otherwise. Re-balanceable; lives in the settings defaults table, not code.
- **RULING R2 — Colorblind transform pairs.** The source only requires "color-blind safe palette." Ruling: implement the standard CVD-safe **blue/orange** substitution for red↔green tokens (protan/deutan) and **blue/yellow** for tritan, applied at the token layer (§3.1). The specific hexes go in a data table so an artist can tune them.
- **RULING R3 — `onLaptopOpen` and `onCombatStart` auto-pause cannot be disabled.** The Bible states laptop pauses time (§7) and combat is turn-based (§5.1). Making these optional would contradict core design, so they're locked ON. All *other* triggers are optional.
- **RULING R4 — Settings are device-local and excluded from the time-travel save.** The diegetic save is for *game state* (Bible §11). Re-applying a rewound font size would be absurd and would fight `Cross_Platform_Synchronization`. Ruling: a separate versioned store.
- **RULING R5 — Subtitles default ON.** The data lists captions as a feature but not a default. Ruling: default ON (accessibility-first; trivially toggled), matching `speakerMode`'s comic-bubble captioning intent (GDD 486).
- **RULING R6 — `combatTurnTimerSeconds` defaults to OFF.** No source table imposes a per-turn shot clock; combat is AP/turn-based (Bible §5.1). The field exists only as an opt-in for a possible future timed/MP mode.
- **RULING R7 — Glyph redundancy is a hard renderer assertion, not a setting you can fully defeat.** Even with `glyphRedundancy=false` (a power-user "clean" view), critical-state glyphs (burning, bleeding, down, mind-controlled — from EFFECT_STATUS) keep their shape marker; only decorative redundancy is dropped. Source intent: `Accessibility_Color_Blind` "shape indicators."

---

## 9. OWNER-FORK: notes (genuine product choices only the owner can make)

- **OWNER-FORK F1 — Bundle dyslexia/high-legibility fonts?** Shipping OpenDyslexic / Atkinson Hyperlegible adds licensing + bundle size. Owner decides: bundle them, fetch them, or expose a generic "high-legibility" system font only. (Affects `TextSettings.fontFace`.)
- **OWNER-FORK F2 — How far does "no-fail timing" go?** `worldEventGraceMode` (hold critical alerts paused until acknowledged) effectively removes real-time-deadline fail-states for players who want that. Is that the intended floor for everyone, an accessibility opt-in, or off by default for "hardcore"? This is a difficulty-philosophy call, not a data point.
- **OWNER-FORK F3 — Does `speakerMode`/LOUD_COMIC bubble style change anything mechanical** (e.g. NPCs "hearing" you on speaker, per the dB sound model Bible §5.11), or is it purely presentation? The GDD (486) describes it as visual; confirm it stays cosmetic so it can live safely in this system.
- **OWNER-FORK F4 — Phone-number "cheat codes" as an accessibility/onboarding channel.** GDD 487 hands out real phone numbers like cheat codes. Should the Settings layer expose an "accessibility cheat sheet" of these, or keep them diegetic-only discovery? (Surfacing them is an onboarding/accessibility win but spends the mystery.)
- **OWNER-FORK F5 — Multiplayer settings policy.** When the time-traveler's other-dimension MP stub activates, do timing-assist settings (auto-pause, grace mode) carry into shared sessions, or does MP impose a common pace? (Out of scope to design, but the owner should reserve the stance now so SP defaults don't surprise later.)

---

## 10. Open Questions

1. **Telemetry for a11y defaults?** `Professional_Metrics_Dashboard` (QOL) suggests analytics. Do we measure which a11y options are used to tune defaults, given the privacy note in that same row? (Owner/privacy call.)
2. **Per-save vs per-profile timing prefs.** Settings are device-local (R4) — but should *timing* prefs (default speed, auto-pause) optionally attach to a campaign profile, since they shade difficulty more than cosmetics do?
3. **Combat legend auto-pin heuristic.** Default auto-pins the legend for "first 3 combats" (§6.5) — is 3 right, or should it key off the player toggling colorblind mode (auto-pin whenever CVD mode ≠ OFF)?
4. **Gamepad/alt-input.** `Accessibility_Motor_Impairment` mentions "alternative input methods." This spec covers keyboard+pointer+touch; is a gamepad map in scope for v1, or deferred? (Schema supports it via `Binding.code`, but the catalog/UI would expand.)
5. **Exact reduced-motion taxonomy.** Which animations are "essential" (knockback direction, turn handoff) vs "decorative" (idle bob, panel slide)? Needs a per-animation tag pass once the combat VFX list is finalized in system #21.
