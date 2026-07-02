# 102 — UI/UX Shell & Information Architecture (Laptop / Phone / World-Map Navigation)

> **System owner doc.** This is the BUILD-READY spec for the *shell* that hosts and switches the three game layers (Laptop, World-Map, Tactical) and the four laptop apps + phone. The individual apps (Email #10, News #10, Personnel, Investigations) and combat are specced in their own docs; THIS doc owns the **container, the navigation model, the time-pause contract, the notification router, and the responsive layout**.
>
> **Primary sources read for this spec** (cited inline):
> - `SHT_MECHANICS_BIBLE.md` §6 (World Layer), §7 (Laptop & Phone Layer — "opening the laptop pauses time; four apps + the phone"), §11 (Time & the Time-Travel Save), §13 (rulings).
> - `SuperHero Tactics/FIST GDD v02.txt` lines 367–657 ("Design Layers", "Mobile", "Laptop", "World Layer", "Tactical", "UI"), 219–306 (Status/activity list), 493–498 ("When the player opens the laptop time is paused but the player can restart it while in the laptop").
> - `docs/csv-source-data/Mobile_vs_Desktop_Experience.csv` (28 rows: platform foci, session lengths, core features, cross-platform sync, notifications).
> - `docs/csv-source-data/Time_Management.csv` (time ratios, character status enums, **Event_Priority_Critical/High/Medium/Low/Background** with response windows).
> - `docs/csv-source-data/Email_Investigation_Templates.csv` (Priority_Level enum: Critical/High/Medium/Low; Urgency_Hours; Auto_Expire).
> - `docs/csv-source-data/Daily_Activity_Framework.csv` (30 activities; `Status_Effects_Applied`).
> - `docs/csv-source-data/Game_Mechanics_Spec/Travel_Time_System.csv` (travel commitment, sector grid, real→game ratio).
> - `docs/csv-source-data/Professional_QOL_Features.csv` (loading states, tooltips, undo/redo, hotkeys, accessibility, responsive).
> - World Bible `Country.csv` / `Cities.csv` headers (exact spine column names).
> - Existing code: `MVP/src/App.tsx`, `MVP/src/stores/enhancedGameStore.ts` (`currentView`, `TIME_SPEEDS`, `togglePause`), `MVP/src/components/MobilePhone.tsx`, `TimeDisplay.tsx`, `GameHUD.tsx`.
>
> **Rule honored:** No invented numbers. Every value below traces to a named table; design gaps are tagged **RULING:** (Bible-consistent) or **OWNER-FORK:** (a product choice only the owner can settle).

---

## 1. Overview & Player Fantasy

**Fantasy:** *"I run a superhuman strike org from a laptop and a phone, and the world talks back to me through them."* The shell is the diegetic device the player lives inside. Per Bible Pillar #5 and the GDD ("UI *is* gameplay" — Brenda Romero quote, GDD line 425), the shell is **not a menu system around the game — it IS the meta-game.** The laptop is where you read the world (News), get your missions (Email-as-dialogue), inspect your people (Personnel), and run the detective loop (Investigations). The phone is the world reaching *into your pocket* — texts from worried mercs, incoming calls, arrival pings, and the dial-a-number cheat-code system (GDD lines 453–490).

**The three layers the shell switches between** (GDD lines 367–373, Bible §5/§6/§7):
1. **Laptop Layer** (strategic UI) — manage team, read world. **Opening it PAUSES time.**
2. **World-Map Layer** (strategic map) — issue squad orders; time runs real-time-with-pause.
3. **Tactical Layer** (combat) — the grid; its own turn clock.

**The shell's job** is to make moving between those three layers *feel like operating one device,* enforce the **time-pause contract**, and route every world event to the right surface (phone vs. laptop-app badge vs. world-map blip vs. combat overlay) so the player is never surprised by something the world did silently — while still honoring the GDD's "you are never forced to read or respond" principle (GDD lines 150, 501).

**Non-goals of this doc:** the internal design of Email/News/Personnel/Investigation apps; combat rules; the time-travel save economy (Bible §11 — the shell only exposes its entry point). Those are referenced as integration points.

---

## 2. Information Architecture (the navigation model)

### 2.1 The shell topology

```
APP ROOT
├── SETUP FLOW  (pre-game; not pausable — no world yet)
│     faction-selection → country-selection → city-selection → recruiting
│           (gamePhase enum, enhancedGameStore.ts:315)
│
└── GAME SHELL  (gamePhase === 'playing')   ── persistent chrome ──
      ├── TopBar:  clock + speed control + budget + fame + faction crest
      ├── Phone:   floating, always-on-top, draggable (MobilePhone.tsx)
      ├── NotificationRouter (invisible; dispatches to surfaces)
      └── PRIMARY SURFACE (exactly one mounted at a time = `currentView`)
            ├── WORLD-MAP        (world-map-grid)         [time RUNS]
            ├── LAPTOP           (laptop shell w/ 4 apps)  [time PAUSED on open]
            │     ├── EMAIL      (email app)
            │     ├── NEWS       (news app: Point of Interest / BNN)
            │     ├── PERSONNEL  (roster/recruits/prisoners/obituaries)
            │     └── INVESTIGATIONS (detective loop)
            ├── TACTICAL-COMBAT  (tactical-combat)        [combat clock]
            └── SUB-SCREENS reached from laptop/world-map (time PAUSED):
                  hospital · equipment-shop · training · base ·
                  characters · investigation-board · encyclopedia · almanac
```

> **RULING — fold "4 apps" onto the existing `currentView` enum, do not rebuild.** The code already has a flat `currentView` union (`enhancedGameStore.ts:321`) with `world-map`, `tactical-combat`, `news`, `characters`, `investigation`, `hospital`, etc. The Bible's "laptop = 4 apps" (Bible §7) is the *conceptual* grouping. **Implementation:** add one new view value `'laptop'` whose component is a tabbed container hosting Email/News/Personnel/Investigation; keep the legacy direct views as deep-link aliases (clicking a news blip can still route to `currentView:'news'`, which the laptop shell renders with the News tab active). This satisfies the Bible without a rewrite. (Source: Bible §7 four-app model; `App.tsx` view switch; ruling consistent with Bible §13.10 "unify, don't duplicate.")

### 2.2 The view taxonomy (which surfaces pause time)

| Surface group | `currentView` values | Time behavior | Source |
|---|---|---|---|
| **World-Map** | `world-map`, `world-map-grid` | **RUNS** at chosen speed | GDD 631 "During this layer time moves in real time"; Bible §6 |
| **Laptop apps** | `laptop` (Email/News/Personnel/Investigations) | **PAUSE on open**, player may un-pause | GDD 497–498; Bible §7 |
| **Laptop sub-screens** | `hospital`, `equipment-shop`, `training`, `base`, `characters`, `investigation`, `investigation-board`, `loadout-editor`, `encyclopedia`, `almanac`, `news` | **PAUSE** (they are laptop-reached) | RULING below |
| **Tactical** | `tactical-combat`, `combat-lab` | Combat turn clock (world clock frozen) | GDD 658; Bible §5 |
| **Dev/tools** | `database`, `data-viewer`, `sound-config`, `sector-editor`, `world-data`, `balance` | PAUSE; gated behind dev flag (`?dev=true`, `App.tsx:117`) | existing code |

> **RULING — pause is a property of the *surface group*, not of each view.** The GDD only explicitly says the **laptop** pauses (line 497). The Bible generalizes: laptop & phone pause (§7, §11). **Ruling:** every surface in the "Laptop apps" + "Laptop sub-screens" + open-phone state sets `isTimePaused = true`; only `world-map*` runs the clock; tactical uses its own clock. This is the one consistent rule a coding agent implements as `shouldWorldClockRun(currentView, phoneOpen) = (currentView ∈ {world-map, world-map-grid}) && !phoneOpen && !inCombat`.

---

## 3. Data Schema (fields / types)

All shell state lives in the existing Zustand store (`enhancedGameStore.ts`). This doc adds a typed `ShellState` slice and a `NotificationEnvelope` type. **No new persistence layer** — it rides the existing store (which already has `currentView`, `gameTime`, `timeSpeed`, `isTimePaused`, `notifications`).

### 3.1 `ShellState` (new slice)

```ts
type SurfaceId =
  | 'world-map-grid' | 'laptop' | 'tactical-combat'
  | 'hospital' | 'equipment-shop' | 'training' | 'base'
  | 'characters' | 'investigation' | 'investigation-board'
  | 'news' | 'encyclopedia' | 'almanac' | 'loadout-editor'
  // dev-only:
  | 'database' | 'data-viewer' | 'sound-config' | 'sector-editor'
  | 'world-data' | 'balance' | 'combat-lab';

type LaptopAppId = 'email' | 'news' | 'personnel' | 'investigations';

interface ShellState {
  currentView: SurfaceId;            // already exists (enhancedGameStore.ts:321) — widen union
  previousView: SurfaceId | null;    // for "Back" / restore-on-close
  laptopOpen: boolean;               // is the laptop chrome mounted
  activeLaptopApp: LaptopAppId;      // which tab inside the laptop
  phoneOpen: boolean;                // MobilePhone.tsx local → lift to store
  phoneTab: 'messages' | 'email' | 'contacts' | 'dialer';  // MobilePhone.tsx:63 + dialer
  // Time pause is DERIVED, but we cache the pre-laptop speed to restore it:
  speedBeforePause: TimeSpeed;       // restore on laptop/phone close
  // Modal stack (FITR, funeral, kill-warning, confirm dialogs):
  modalStack: ShellModal[];          // LIFO; top modal is focus-trapped
  // Responsive:
  platform: 'desktop' | 'mobile';    // from breakpoint, see §7
  minWidthBlocked: boolean;          // <1024px hard block (App.tsx:111)
}

interface ShellModal {
  id: string;
  kind: 'fitr' | 'funeral' | 'kill-warning' | 'confirm' | 'fork' | 'time-travel';
  dismissible: boolean;              // FITR & time-travel often NOT dismissible
  payload: unknown;                  // typed per kind by the owning system
}
```

### 3.2 `NotificationEnvelope` (the router's unit of work)

Field values are constrained to enums that already exist in the source CSVs.

```ts
interface NotificationEnvelope {
  id: string;
  // Priority — EXACT enum from Time_Management.csv (Event_Priority_*)
  //            and Email_Investigation_Templates.csv (Priority_Level):
  priority: 'Critical' | 'High' | 'Medium' | 'Low' | 'Background';
  // Which surface(s) this event should reach:
  channel: NotificationChannel[];    // see §5.1 routing table
  source: 'email' | 'news' | 'phone' | 'world' | 'combat' | 'faction'
        | 'investigation' | 'economy' | 'roster' | 'time';
  title: string;
  body: string;
  // Time semantics (from Time_Management.csv response windows):
  createdGameDay: number;            // gameTime.day at creation
  respondByGameHours: number | null; // urgency window; null = no deadline
  autoExpire: boolean;               // Email_Investigation_Templates.csv Auto_Expire
  // Spine context (so the surface can theme/locate the event):
  sectorCode: string | null;         // links to a world-map blip
  countryCode: string | null;        // World Bible Country.csv "Country Code"
  cityName: string | null;
  // Lifecycle:
  read: boolean;
  dismissed: boolean;
  actionTaken: boolean;
  deepLink: { view: SurfaceId; app?: LaptopAppId; entityId?: string } | null;
}

type NotificationChannel =
  | 'phone-toast'       // vibrate + bubble on the phone
  | 'phone-badge'       // unread count on phone icon
  | 'laptop-badge'      // dot/count on a laptop app tab
  | 'worldmap-blip'     // pin on the sector
  | 'combat-overlay'    // floating combat-log line (only while in tactical)
  | 'topbar-alert';     // persistent banner for Critical
```

> **RULING — reuse the existing `notifications` array.** `MobilePhone.tsx:48` already reads `notifications` with `PHONE_MESSAGE_TYPES = ['idle_warning','call_incoming','arrival','handler']`. **Ruling:** generalize the existing notification object into `NotificationEnvelope` (superset; old `type` maps to `source`), and let the NotificationRouter compute `channel[]` from `priority` + `source` via the §5.1 table. This keeps the one source of truth and the existing vibrate logic (`MobilePhone.tsx:61`).

---

## 4. Exact Numbers, Tables & Formulas (each cited)

### 4.1 Time-pause contract & the world clock

The shell does not invent clock speeds — it uses the speeds already shipped in `enhancedGameStore.ts:248` (`TIME_SPEEDS`), which themselves implement the Bible/Travel ratio.

| Speed index | Label | minutes/sec (real) | Source |
|---|---|---|---|
| 0 | PAUSED | 0 | `enhancedGameStore.ts:249` |
| 1 | 1X | 1 | `enhancedGameStore.ts:250` |
| 2 | 10X | 10 | `enhancedGameStore.ts:251` |
| 3 | 60X | 60 (1 hr/sec) | `enhancedGameStore.ts:252` |
| 4 | 360X | 360 (6 hr/sec) | `enhancedGameStore.ts:253` |

**Sanity-check against canon:** Bible §6 and `Time_Management.csv` row `Base_Time_Flow` state **1 real day : 30 game days** (1:30), giving **82.4 real days to the 2,472-day countdown** (`Travel_Time_System.csv` line 52: "82.4 days → 2472 days"). The shipped speed 4 (360 min/sec = 6 game-hours/sec) means a 24-game-hour day passes in 4 real seconds; running speed 4 continuously = 1 game day / 4 sec ≈ 21,600 game-days/real-day, which is the *max* fast-forward, not the base flow. **This is consistent:** the 1:30 ratio is the *narrative pacing target* (`Time_Management.csv` Base_Time_Flow), the speed buttons are *player fast-forward controls* on top of pause. The shell exposes both; it does not change either number.

**Pause contract pseudocode (the load-bearing rule):**
```
onEnterSurface(view):
   if view ∈ WORLD_RUN_VIEWS:          // {world-map-grid}
       restoreSpeed(speedBeforePause)  // resume at last non-zero speed
   else:                               // laptop, sub-screens, dev tools
       speedBeforePause = max(timeSpeed, 1)   // remember
       setTimeSpeed(0)                 // PAUSE  (togglePause/​setTimeSpeed exist)
onOpenPhone():  speedBeforePause = max(timeSpeed,1); setTimeSpeed(0)
onClosePhone(): if currentView ∈ WORLD_RUN_VIEWS: restoreSpeed(speedBeforePause)
onEnterCombat(): freezeWorldClock()    // tactical owns its own turn clock
```
Citations: pause requirement GDD 497–498 & Bible §7; "may restart it while in the laptop" → the speed control stays interactive while paused (the TopBar clock is always live); `setTimeSpeed`/`togglePause` already implemented (`enhancedGameStore.ts:2660, 2671`).

> **RULING — un-pausing inside the laptop is allowed but does NOT close the laptop.** GDD line 498: "the player can restart it while in the laptop." So the TopBar play button works even while the laptop is the primary surface. The world advances *behind* the laptop; incoming events raise laptop-badges/phone-toasts. Closing the laptop returns to `previousView`. (This is the explicit GDD behavior — not a fork.)

### 4.2 Notification priority → response window (from `Time_Management.csv`)

These are the **only** priority numbers in the source data; the router uses them verbatim.

| Priority | Response requirement | Real-time window | Source row |
|---|---|---|---|
| **Critical** | "Immediate response required" — assign within **2 hours real time** | 2 h | `Time_Management.csv` `Event_Priority_Critical` |
| **High** | within **24 game-hours / 1 real day** | 24 gh | `Event_Priority_High` |
| **Medium** | within **72 game-hours / 3 real days** | 72 gh | `Event_Priority_Medium` |
| **Low** | optional; may be delayed/ignored | — | `Event_Priority_Low` |
| **Background** | passive monitoring; no deadline | — | `Event_Priority_Background` |

**Email urgency** is per-template, not per-priority-tier: `Email_Investigation_Templates.csv` carries `Urgency_Hours` (range observed **4–168**, e.g. Reality Breach = 4h, Cultural Exchange = 168h) and `Auto_Expire` (Yes/No). The router copies `Urgency_Hours → respondByGameHours` and `Auto_Expire → autoExpire` directly; it does **not** override them with the tier defaults above (the tier table is the fallback when an event has no template-specific window).

> **RULING — expiry math.** An envelope with `autoExpire=true` is auto-dismissed (and its world consequence fires per the GDD "events occur without the player" principle, GDD 150/501) when `(gameTime.day - createdGameDay) * 24 + elapsedGameHoursToday ≥ respondByGameHours`. Background/Low never auto-expire. (Consistent with `Email_Investigation_Templates.csv` Auto_Expire column and GDD 501.)

### 4.3 Travel & commitment surfacing (from `Travel_Time_System.csv`)

The world-map surface must show, on a deploy action, the numbers the travel table already defines — the shell does not compute new ones, it *displays* them:
- **Grid scale:** 1 sector ≈ **500 km** (`Travel_Time_System.csv` line 64).
- **Adjacent sector:** 1 day ground / 0.5 day air; **diagonal = 1.4× adjacent** (lines 65–66).
- **Commitment lock:** once travel begins it cannot be interrupted without an LSW power; **Emergency_Abort at −50% progress, no time refund** (lines 56–58). The shell renders the "Commit travel?" confirm modal (a `ShellModal kind:'confirm'`, dismissible) citing these.

### 4.4 Character status badges (from `Time_Management.csv` + `Daily_Activity_Framework.csv`)

The Personnel app and phone roster surface each unit's status using the **exact status enum** from `Time_Management.csv` (`Status_*` rows): `Available, Busy, Traveling, Injured, Hospitalized, Missing, Dead, Undercover`. Idle ("Ready/Available") units exhibit the GDD idle behaviors (GDD 219–227): "becoming familiar with the city / **texting you their concerns** / aging by the day / secretly hiding an addiction." The "texting you their concerns" idle behavior is a `source:'phone', priority:'Low'` envelope — this is *why the phone exists* in the fantasy and the shell must wire it. (GDD 226; `MobilePhone.tsx` `idle_warning` type already present.)

---

## 5. The Notification Router (the shell's brain)

### 5.1 Channel routing table (priority × source → channels)

This table is a **RULING** (the source data names priorities and surfaces but does not give the explicit cross-product). It is built strictly from named surfaces in `Mobile_vs_Desktop_Experience.csv` (phone = communication hub; world-map = monitoring; laptop = email/news) and the GDD's "priority flag" concept (GDD 504).

| Priority \ Source | Channels emitted |
|---|---|
| **Critical** (any source) | `topbar-alert` + `phone-toast` + `phone-badge` + (`worldmap-blip` if sectorCode) + (`combat-overlay` if in combat). Also **auto-pauses the world clock** and surfaces a non-dismissible-until-acknowledged banner. |
| **High** | `phone-toast` + `phone-badge` + `laptop-badge` + (`worldmap-blip` if sectorCode). No auto-pause. |
| **Medium** | `phone-badge` + `laptop-badge` + (`worldmap-blip` if sectorCode). |
| **Low** | `laptop-badge` only (+ `phone-badge` if `source==='phone'`, e.g. a merc text). |
| **Background** | silent; visible only inside the relevant app list / world-map layer. No badge. |

> **RULING — only Critical auto-pauses.** GDD/Bible say the player is never forced to act (GDD 150). But a Critical alert with a 2-hour real window (`Event_Priority_Critical`) at speed 4 would expire in well under a second of inattention. **Ruling:** Critical events auto-pause the world clock and raise a topbar banner the player must *acknowledge* (not *resolve*) to resume; acknowledging without acting still lets the consequence fire on expiry. This preserves "never forced to respond" (you can acknowledge-and-ignore) while preventing the clock from silently eating a Critical. **OWNER-FORK** flagged in §10 for whether even Critical should respect a "never auto-pause" hardcore mode.

### 5.2 De-dup & coalescing

- Envelopes are keyed by `(source, deepLink.entityId)`. A re-fire updates the existing envelope (no stacking spam) — same pattern as the existing `dismissed`/`read` flags on `notifications`.
- The phone badge shows `min(unreadCount, 99)`; `MobilePhone.tsx:77` already computes `unreadCount`. Laptop app-tab badges show per-app unread (`email`, `news`, `investigations`, `personnel`).

---

## 6. How It Consumes the SPINE (country / city / personality → shell behavior)

The shell is mostly *presentation*, but per Bible §2 ("everything downstream is computed from the country/city the player is standing in") it consumes the spine in four concrete, formula-backed ways. Column names are the **exact headers** from World Bible `Country.csv` / `Cities.csv`.

### 6.1 Surveillance pressure → notification noise & "you are being watched" chrome
**Driver (Bible §8 Surveillance system):** `Intel + Cyber + (100 − MediaFreedom)`, using Country columns `IntelligenceBudget`, `CyberCapabilities`, `MediaFreedom` (Country.csv header). 
**Shell effect:** when the player's *current* country surveillance score is high, the TopBar shows a "MONITORED" indicator and incoming covert-investigation envelopes get a `Background`→`Low` bump (you notice you're being tracked). 
**Formula (RULING, Bible-consistent):**
```
surveillance = clamp(IntelligenceBudget + CyberCapabilities + (100 - MediaFreedom), 0, 300)
monitoredChrome = surveillance >= 180     // 2/3 of max → show MONITORED badge
```
Threshold is a RULING (the §8 table gives the formula but not the display cutoff); 180/300 chosen as "two of three drivers high," consistent with Bible §6.1 combo thresholds.

### 6.2 City type → which laptop app the world *nudges* you toward
**Driver:** `Cities.csv` `CityType1..CityType4` (10 types) → `City_Type_Effects.csv` `Investigation_Bonus` / `LSW_Affinity`. 
**Shell effect:** the laptop's default-open app and the Investigation app's suggested-method ordering are themed by city type. E.g. **Military** city (`City_Type_Effects.csv` line 5: "+2CS Military/Security investigations", "Arsenal Access") → Investigations app surfaces military-method first and the equipment-shop sub-screen flags "Arsenal Access: −20% cost". **Temple** → mystical-investigation theming + the "Sanctuary 24h" affordance shown in the world-map deploy panel. This is pure surfacing of `City_Type_Effects.csv` Special_Ability/Investigation_Bonus — no new numbers.

### 6.3 Crime / safety → world-map blip density & phone "ear to the streets"
**Driver:** `Cities.csv` `CrimeIndex` & `SafetyIndex`, plus `PopulationRating` (Cities.csv header). 
**Shell effect:** the world-map surface scales the **expected blip frequency** of street-crime envelopes off `CrimeIndex` (the GDD Patrol activity, "keep your ear to the streets," GDD 263–267, generates `source:'phone'/'world'` Low envelopes). The shell only *renders* the blips; generation is owned by the crime sim (Bible §6.5, "per-city crimeIndex … feeds missions/news"). The shell's contract: a city with higher `CrimeIndex` shows proportionally more `worldmap-blip` channels active.

### 6.4 Personality → phone voice & idle texts (the "living world talks to you")
**Driver:** the **20 personality types** (Bible §5.10 `PERSONALITY TARGET SELECTION`; GDD 583 "20 different personality types"). 
**Shell effect:** idle units (`Status_Available`) emit `source:'phone'` Low envelopes whose *tone* is selected by the unit's personality type (GDD 226 "texting you their concerns"). The shell does not author the text (content system owns templates) — it owns the **rule that personality picks the template bucket** and that speaker-mode renders louder comic bubbles (GDD 486; Bible §7.5). 
**Formula (RULING):** `idleTextTemplateBucket = personalityType` (1:1 map of 20 types → 20 buckets); `bubbleStyle = phone.speakerOn ? 'loud-comic' : 'normal'` (GDD 486).

> All four consumptions are *reads* of spine data the shell never writes. Writes to the spine (reputation, faction standing) come from missions/combat, not the shell (see §8).

---

## 7. UI/UX Hooks (how it surfaces, per platform)

### 7.1 Desktop layout (the primary target — PC, GDD line 28; min-width 1024, `App.tsx:111`)
Per `Mobile_vs_Desktop_Experience.csv` Desktop rows (Desktop_Strategic, Desktop_Tactical, Desktop_Investigation):
- **TopBar (persistent):** clock + time-of-day icon + speed control (`TimeDisplay.tsx`), budget (`BudgetDisplay`), fame, faction crest, MONITORED indicator (§6.1). Always live even when world is paused.
- **Primary surface** fills the viewport; **Phone floats** bottom-right, draggable (`MobilePhone.tsx` already draggable via `GripHorizontal`).
- **Laptop** = full-surface tabbed chrome (4 app tabs: Email/News/Personnel/Investigations), each tab carrying its unread `laptop-badge`.
- **Keyboard:** `Professional_QOL_Features.csv` row `UX_Enhancement_Keyboard_Navigation` + `Quality_Of_Life_Hotkeys` mandate full hotkey nav. Existing `KeyboardShortcuts.tsx` + `F2` dev panel / `F4` asset manager (CLAUDE.md). **RULING — reserved global hotkeys:** `Space`=toggle pause, `1–4`=set speed, `Esc`=close top modal / close laptop / close phone (in that LIFO order), `L`=laptop, `M`=world-map, `Tab`-cycle laptop apps. (These are a RULING; the source mandates "comprehensive hotkeys" but not the bindings.)

### 7.2 Mobile layout (iOS is a shipped target — GDD line 28; `Mobile_vs_Desktop_Experience.csv` Mobile_* rows)
- **Session model:** Mobile = "Quick_Decision_Making / Communication_Hub / World_Awareness," 1–15 min sessions, portrait, large touch targets (`Mobile_vs_Desktop_Experience.csv` rows 2–4). **Core mobile features:** email response, quick character assignment, emergency response, phone calls, world-state monitoring, news feed.
- **The phone IS the mobile shell.** On mobile, the floating phone becomes the full screen; laptop apps render as the phone's apps. Tactical combat is **desktop-primary** (`Desktop_Tactical`, 30–120 min sessions) — on mobile the shell **blocks** entering `tactical-combat` below 1024px and shows `MinWidthWarning` (`App.tsx:81`), routing the player to "resolve via fast-combat / wait for desktop." **OWNER-FORK** (§10): whether mobile gets a fast-combat-only path or is monitoring-only.
- **Cross-platform parity:** `Mobile_vs_Desktop_Experience.csv` `Cross_Platform_Synchronization` row — "all platforms share identical game state with real-time synchronization." The store is the single state; layout is the only platform difference. The shell exposes `platform` (§3.1) computed from breakpoint, never forks game logic.

### 7.3 Combat overlay
While `currentView==='tactical-combat'`, the world clock is frozen and only `combat-overlay` + `topbar-alert` (Critical) channels render — the phone/laptop are **collapsed to a peek state** (you can see a Critical banner but cannot open the laptop mid-turn). Closing combat restores the prior surface and `previousView`.

### 7.4 Loading, transitions, errors (polish contract — `Professional_QOL_Features.csv`)
Mandatory per that table: smooth transitions (`UI_Polish_Animations`), interactive feedback on every clickable (`UI_Polish_Visual_Feedback`), **loading/skeleton states** between surface switches (`UI_Polish_Progressive_Enhancement`), graceful error handling with `ErrorBoundary` (`UI_Polish_Error_Handling`; `components/ui/ErrorBoundary.tsx` exists), tooltips on all features (`UX_Enhancement_Tooltips`), and responsive design (`Professional_Polish_Responsive`). Surface switches use the existing Retro UI kit (`components/ui/Retro*`) — honor the project's pixel/arcade aesthetic, **no purple** (global rule).

---

## 8. Integration Points (reads / writes)

| System | Shell reads | Shell writes | Reference |
|---|---|---|---|
| **Time engine** | `gameTime`, `timeSpeed`, `isTimePaused` | sets `timeSpeed=0` on pause-surfaces; restores on close | `enhancedGameStore.ts:2660+`, `timeEngine.ts`, `TimeDisplay.tsx` |
| **Email app (#10)** | email list, unread, `Priority_Level`, `Urgency_Hours`, `Auto_Expire` | marks read/archived; deep-links | `Email_Investigation_Templates.csv`, `MobilePhone.tsx:33` |
| **News app (#10)** | Point-of-Interest / BNN feed, unread | marks read | Bible §7.2; `NewsBrowser.tsx` |
| **Personnel app** | roster, status enum, relationships, obituaries, recruits, prisoners | none (sub-screens write) | Bible §7.3; GDD 518–571 |
| **Investigations app** | investigation list, methods, city/country ±CS | opens method picker | Bible §7.4; `Investigation_*.csv` |
| **World-map (#06)** | sectors, blips, squad positions, travel | issues deploy/travel orders (confirm modal) | Bible §6; `WorldMapGrid.tsx`, `Travel_Time_System.csv` |
| **Tactical (combat)** | in-combat flag | enter/exit; freezes world clock | Bible §5; `CompleteTacticalCombat.tsx` |
| **Notification/Event bus** | all `NotificationEnvelope`s | computes `channel[]`; sets read/dismissed | `data/eventBus.ts`, `notifications` array |
| **Spine** | Country.csv / Cities.csv columns (§6) | **never writes spine** | World Bible CSVs |
| **Fame / Public Perception** | fame value for TopBar | none | Bible §9; `Public_Perception.csv` |
| **Faction** | standing for TopBar crest | none | `factionSystem.ts`, `ReputationDisplay.tsx` |
| **Time-travel save (Bible §11)** | sanity / destinations | opens time-travel modal (entry point only) | Bible §11; `kind:'time-travel'` modal |
| **FITR / Funeral** | pending forks | pushes/pops `ShellModal` | GDD 396–398, 1101–1116; `FuneralDecision.tsx`, `KillWarningModal.tsx` |

---

## 9. Edge Cases & Failure Modes

1. **World event fires while laptop is open and player has un-paused** (GDD 498 allows this). → Router emits `laptop-badge` + `phone-toast`; if Critical, auto-pause + topbar banner over the laptop. Laptop stays open. (Covered §4.1, §5.1.)
2. **Critical event during tactical combat.** → World clock already frozen; render `combat-overlay` + `topbar-alert` only; do NOT yank the player out of their turn. Resolve after combat. (§7.3.)
3. **Multiple modals stack** (FITR fires while a confirm dialog is open). → `modalStack` LIFO; only the top is focus-trapped; `Esc` pops one at a time; non-dismissible modals (FITR/time-travel) block `Esc`. (§3.1, §7.1.)
4. **Auto-expire race:** envelope expires the same tick the player opens it. → Resolution order: process expiries *before* render each tick; an envelope already expired shows as "Expired — consequence applied," never as actionable. (§4.2 ruling.)
5. **Phone open + player clicks world-map travel.** → Phone-open pauses the world; the travel-confirm modal is allowed; committing travel closes the phone and resumes the clock (travel is a world-layer action). (§4.1, §4.3.)
6. **Below min-width (1024px) on desktop browser** → `MinWidthWarning` hard block for tactical; strategic surfaces degrade to mobile layout. (`App.tsx:81/111`.)
7. **Notification flood** (crime sim spikes in a high-`CrimeIndex` city). → Coalesce by `(source, entityId)` (§5.2); cap active `worldmap-blip` rendering; overflow collapses into a single "N incidents in {city}" Low envelope.
8. **Speed restore ambiguity** (player paused manually at speed 0, then opened laptop). → `speedBeforePause = max(prevSpeed, 1)`; if the player *manually* paused before opening, restore to manual pause (track `manualPause` boolean) so closing the laptop does NOT silently resume. **RULING:** distinguish `manualPause` (player hit pause) from `surfacePause` (laptop opened); only `surfacePause` auto-restores. (§4.1.)
9. **Dev/tool view entered in production build.** → Dev views gated behind `?dev=true` (`App.tsx:117`); if reached without flag, redirect to `world-map-grid`.
10. **Deep-link to a dead entity** (notification references a now-dead merc). → Personnel keeps the dead unit on roster "until their funeral" (GDD 1104); deep-link resolves to the obituary/funeral view, never a 404.
11. **Tactical combat exits with no `previousView`** (combat entered from a fresh load). → Fall back to `world-map-grid`. (Matches `enhancedGameStore.ts:1650` `currentView:'world-map'` reset.)

---

## 10. RULING & OWNER-FORK Summary

**RULINGS made (Bible-consistent, no owner needed):**
- R1. Fold "4 laptop apps" onto the existing flat `currentView` enum via one `'laptop'` tabbed container + legacy deep-link aliases. (§2.1)
- R2. Pause is a property of the *surface group*; `shouldWorldClockRun = currentView ∈ {world-map-grid} && !phoneOpen && !inCombat`. (§2.2, §4.1)
- R3. Reuse the existing `notifications` array, generalized to `NotificationEnvelope`. (§3.2)
- R4. Auto-expire math + Background/Low never expire. (§4.2)
- R5. Priority×source→channel routing table. (§5.1)
- R6. Only Critical auto-pauses, and only requires *acknowledge*, not *resolve*. (§5.1)
- R7. Surveillance-chrome cutoff 180/300; spine reads only, never writes. (§6.1)
- R8. Personality 1:1 → idle-text template bucket; speaker-mode bubble style. (§6.4)
- R9. Reserved global hotkeys (Space/1–4/Esc/L/M/Tab). (§7.1)
- R10. `manualPause` vs `surfacePause` distinction for speed restore. (§9.8)

**OWNER-FORKS (genuine product choices — do NOT ship a guess):**
- **F1.** Should a "hardcore / no-hand-holding" mode exist where even **Critical** events never auto-pause the world clock (so the player can lose a Critical by inattention)? Default ruling auto-pauses Critical; the owner decides if an opt-out hardcore mode is in scope. (§5.1)
- **F2.** On **mobile/iOS**, does tactical combat get a **fast-combat-only** path (auto-resolve), or is mobile strictly a *monitoring + management* client with all real combat deferred to desktop? `Mobile_vs_Desktop_Experience.csv` marks combat "Desktop_Primary" but doesn't forbid a mobile fast-resolve. (§7.2)
- **F3.** Default **time speed on un-pause** after the very first laptop open of a session: 1X (gentle) or the speed the player last used? Affects new-player pacing. (§4.1)
- **F4.** Is the **phone always-on-top and draggable** on desktop (current code), or should it dock to a fixed tray to avoid covering the tactical grid? Cosmetic but affects combat readability. (§7.1/§7.3)
- **F5.** Does opening the **News** app pause time like Email/Personnel, or should News be a *passive ticker* that can run live on the world-map (so the player reads news without stopping the world)? Bible §7 says the *laptop* pauses; News-as-live-ticker is a plausible product variant. (§2.2)

---

## 11. Open Questions

1. **Notification persistence across time-travel saves** (Bible §11): when the player rewinds, do already-read/expired envelopes from the "erased" future return to the inbox, or are they wiped? (Touches the diegetic-save system — likely owned by doc on Time-Travel Save; flagged here because the shell renders the inbox.)
2. **Speaker-mode audio** (GDD 486): does turning on the phone "speaker" also play VO louder, or is it purely the visual louder-comic-bubble? Affects the sound system contract.
3. **Multiplayer stub** (Bible §11 "other dimension"): the shell's NotificationRouter should be the seam where another player's actions could later arrive as envelopes (`source:'world'`). Confirm the router interface is the intended MP injection point so we shape it now (architectural stub only).
4. **Per-app vs. global unread**: should the TopBar show one aggregate unread count, or only per-surface badges? (Leaning per-surface per §5.1; confirm.)
5. **FITR cadence governance** (GDD 396 "could pop up at any time"): does the shell rate-limit FITR modals so they don't interrupt a tactical turn or stack three-deep? Proposed: queue FITR behind combat and cap one active FITR modal; confirm with the FITR system owner.
