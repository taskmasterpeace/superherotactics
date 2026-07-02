# 01 — Phone & Comms (texts, calls, priority, arrival pings, world-map notifications)

> **System owner doc.** Build-ready spec for the player's *phone* — the diegetic device that the living world uses to reach the player: texts from idle mercs, incoming calls, priority flags, squad arrival pings, and world-map crisis notifications. The phone is the **delivery membrane** of the game's core fantasy ("a living world that talks to you"). It does **not** own mission *content* (that's Email, doc 07) or news *content* (that's News, doc 08); it is the **notification, escalation, dial-out, and routing layer** that surfaces them.
>
> **Status of source data:** Every number below traces to a named source table. Where the source data was silent, a `RULING:` is given consistent with `SHT_MECHANICS_BIBLE.md`. Owner-only product calls are flagged `OWNER-FORK:`.
>
> **Primary sources read:** `SHT_MECHANICS_BIBLE.md` (§2 spine, §5.10 personality AI, §6.5 living world, §7.1 email/priority, §7.2 news, §7.5 phone/dial, §11 time); `SuperHero Tactics/FIST GDD v02.txt` lines 135–227, 453–545 (Mobile / Dial / Speaker / Email priority / News / "texting you their concerns"); `docs/csv-source-data/Mobile_vs_Desktop_Experience.csv`; `docs/csv-source-data/Email_Investigation_Templates.csv`; `docs/csv-source-data/Result_Templates.csv`; `docs/csv-source-data/Time_Management.csv` (priority response windows + time ratio); `docs/csv-source-data/World_State_Tracking_System.csv` (mobile world-view cadence); `Combat Compendium REAL - 🎯PERSONALITY TARGET SELECTION🎯.csv`; World Bible `Country.csv` columns (spine inputs).
>
> **Existing code this binds to (source of truth for shapes — do not re-invent):**
> `MVP/src/types.ts` lines 147–187 (`NotificationType`, `NotificationPriority`, `GameNotification` — escalation fields already present); `MVP/src/stores/enhancedGameStore.ts` (`notifications[]`, `addNotification`, `dismissNotification`, `markNotificationRead`, `clearAllNotifications`, `getUnreadCount`, keep-last-50); `MVP/src/components/NotificationBar.tsx`; `MVP/src/components/MobilePhone.tsx` (vibrate, unread badge, tabs messages/email/contacts); `MVP/src/data/contactsSystem.ts` (`Contact`, `ContactService`, cooldown/standing); `MVP/src/data/emailSystem.ts` (`Email`, `EmailPriority`); `MVP/src/data/eventBus.ts` (`EventBus`, `GameEventType`); `MVP/src/data/timeEngine.ts` (tick = 10 min, 1s real = 10 game-min) and `MVP/src/data/timeSystem.ts` (`GameTime { totalHours, day, hour, ... }`).

---

## 1. Overview & player fantasy

The player runs a government-backed superhuman org. They are not omniscient — they find out what the world is doing the same way a handler would: **the phone buzzes.** A merc you parked in Lagos for three days texts that he's bored and "becoming familiar with the city" (FIST GDD line 223–224). A squad you sent to Karachi pings **ARRIVED** so you can finally enter combat. The Saudi teleporter you were given a number for (GDD line 487) gets a *call her now* button. A troop buildup in the South China Sea throws a **world-map crisis ping** with a 24-hour fuse (Email template EMAIL_001-style urgency; GDD line 510).

Three felt promises:

1. **The world reaches out first.** Players who never open the laptop still feel a living world via buzzes, badges, and map pings. ("UI *is* gameplay" — GDD design pillar, line 425; Bible Pillar #5.)
2. **Urgency is legible at a glance.** A red flag = act now or it expires. A grey dot = whenever. This maps 1:1 to the **PRIORITY flag** the GDD demands (line 504) and the four response windows in `Time_Management.csv` rows 42–46.
3. **Characters are people who text and call you.** Idle units escalate idle→text→call (already stubbed in `types.ts:181-183`), and the comic-book **speaker mode** renders a call as a "louder" bubble (GDD line 486).

**Scope boundary.** Phone & Comms owns: the notification queue, priority classification, escalation timers, arrival pings, world-map ping placement, the contacts/dial-out surface, and platform routing (mobile vs desktop). It **reads** content authored by Email, News, Investigation, Combat, Time, Travel, Faction, and Character systems and **routes** it. It writes back only `read/dismissed/escalation` state and dial-out *requests* (which the target system fulfills).

---

## 2. Data schema (fields/types)

### 2.1 The notification record — extend the existing `GameNotification`

`GameNotification` already exists (`types.ts:168-187`) with: `id, type, priority, title, message, characterId?, characterName?, location?, timestamp (game), realTimestamp, read, dismissed, escalationLevel?, nextEscalation?, actionType?, actionData?`. **Do not fork it.** Add the following optional fields (all additive, back-compatible):

```ts
// types.ts — ADD to NotificationType union (keep all existing members):
export type NotificationType =
  | 'arrival' | 'departure' | 'status_change'
  | 'mission' | 'mission_complete' | 'mission_failed'
  | 'combat' | 'injury' | 'death'
  | 'idle_warning' | 'call_incoming' | 'email'
  | 'world_event' | 'handler'
  | 'investigation_discovered' | 'investigation_complete' | 'investigation_failed'
  // NEW (this system):
  | 'crisis_ping'        // world-map crisis with a fuse (POI/BNN-sourced)
  | 'priority_email'     // an Email flagged Priority arrived (routes to inbox)
  | 'call_missed'        // an incoming call the player let ring out
  | 'contact_ready'      // a dialed contact's cooldown elapsed / service ready
  | 'payday'             // weekly economic ping (Monday, per timeEngine week_change)
  | 'sanity_warning';    // Time Walker sanity low (diegetic-save system, doc 11)

// GameNotification — ADD optional fields:
export interface GameNotification {
  // ...all existing fields unchanged...
  channel?: NotificationChannel;     // how it was delivered (default 'text')
  sectorId?: string;                 // world-map sector for crisis_ping placement
  fuseHours?: number;                // game-hours until auto-expire/auto-resolve (0 = none)
  expiresAtTotalHours?: number;      // GameTime.totalHours deadline (computed from fuseHours)
  sourceSystem?: NotificationSource; // which system emitted it (for routing/telemetry)
  sourceRefId?: string;              // id in the owning system (emailId, missionId, contactId, etc.)
  callContactId?: string;            // for call_incoming/contact_ready: the Contact.id
  groupKey?: string;                 // for stacking duplicates (e.g. one row per sector crisis)
}

export type NotificationChannel = 'text' | 'call' | 'ping' | 'email' | 'banner';
export type NotificationSource =
  | 'email' | 'news' | 'investigation' | 'combat' | 'time'
  | 'travel' | 'faction' | 'character' | 'economy' | 'timewalker' | 'contacts';
```

### 2.2 Priority model (canonical — the PRIORITY flag the GDD demands)

`NotificationPriority` already = `'low' | 'medium' | 'high' | 'urgent'` (`types.ts:166`). **Keep these four; they map exactly onto the four player-facing response windows in `Time_Management.csv`.** Add a derived display flag, not a new field:

| `NotificationPriority` | Source-table response window (`Time_Management.csv` rows 42–45) | Glyph | Email priority equiv. (`Email_Investigation_Templates.csv`) |
|---|---|---|---|
| `urgent`  | `Event_Priority_Critical` — respond within **2 hours real time** | red ●● + flag | `Critical` |
| `high`    | `Event_Priority_High` — respond within **24 hours real time** | orange ● + flag | `High` |
| `medium`  | `Event_Priority_Medium` — respond within **72 hours real time** | blue ● | `Medium` |
| `low`     | `Event_Priority_Low` — response optional / can be ignored | grey ● | `Low` |

> `Background` (`Event_Priority_Background`, row 46) is **not** a phone priority — background events do not buzz; they only appear in the world-map dashboard. `RULING:` map any incoming `Background` source to `priority:'low', channel:'ping'` and suppress vibration/sound (consistent with row 46 "passive monitoring, no immediate travel").

### 2.3 Contact / dial-out record

Reuse `Contact` from `contactsSystem.ts` verbatim (`id, name, alias, icon, service, factionType, requiredStanding, baseCost, cooldownHours, effects[]`). Phone & Comms adds **no new contact fields**; it adds a **dial intent** envelope it hands to the owning system:

```ts
export interface DialRequest {
  contactId: string;             // Contact.id from CONTACTS
  atTotalHours: number;          // GameTime.totalHours when dialed
  speakerMode: boolean;          // true => render reply as comic 'loud' bubble (GDD line 486)
}
export interface DialResult {
  ok: boolean;
  reason?: 'locked' | 'cooldown' | 'insufficient_funds' | 'hostile_standing';
  cooldownRemainingHours?: number;
  effectsApplied?: ContactEffect[];
}
```

### 2.4 Settings (player-controllable, persisted)

```ts
export interface CommsSettings {
  vibrate: boolean;              // default true  (MobilePhone already vibrates)
  sound: boolean;               // default true
  minBuzzPriority: NotificationPriority; // default 'medium' — low never buzzes
  pauseOnUrgent: boolean;       // default true — urgent crisis_ping auto-pauses world clock
  doNotDisturbInCombat: boolean;// default true — queue, don't interrupt the tactical turn
}
```

---

## 3. Exact numbers, tables & formulas (each cited)

### 3.1 Time base (the clock everything is measured against)

- **Time ratio = 1 real day : 30 game days (1:30).** Source: `Time_Management.csv` row 2 (`Base_Time_Flow`), confirmed `SHT_MECHANICS_BIBLE.md` §6.5 / §11. Crisis windows below are stated in **real time** because the source table states them in real time; convert to game-hours for `fuseHours` using the active ratio.
- **Tick = 10 game-minutes; 1 real second ≈ 10 game-minutes at default speed.** Source: `MVP/src/data/timeEngine.ts` lines 41–43 (`tickMinutes:10, tickIntervalMs:1000`). At default speed, **1 real day : 30 game days** is the *design* ratio (`Time_Management.csv`); the tick engine is the implementation clock. `RULING:` compute all deadlines in **game `totalHours`** (`timeSystem.ts:51`) so they are immune to real-time speed changes; only the *display countdown* ("~2h") uses the current ratio.

### 3.2 Priority → fuse (auto-expire) defaults

`fuseHours` is the **game-hours** until a notification auto-expires/auto-resolves. Defaults derive from the **email `Urgency_Hours`** column when the source is an email (those values are explicit, in *game hours*, in `Email_Investigation_Templates.csv`), otherwise from the priority band:

| Priority | Default `fuseHours` (game-hours) | Trace |
|---|---|---|
| `urgent` | **6** | min urgency in `Email_Investigation_Templates.csv` is 4–6h (EMAIL_007=6, EMAIL_021=6, EMAIL_025=4); take 6 as the safe default, override with the email's own `Urgency_Hours` when present |
| `high`   | **24** | EMAIL_001 `Urgency_Hours=24`; matches `Event_Priority_High` 24h window |
| `medium` | **72** | EMAIL_002 `Urgency_Hours=72`; matches `Event_Priority_Medium` 72h window |
| `low`    | **0 (no fuse)** | `Event_Priority_Low` = "response optional / can be delayed" (`Time_Management.csv` row 45) |

> **Rule:** if the emitting payload carries its own `urgencyHours` (Email always does, via `Urgency_Hours`; Auto_Expire column gates whether it expires at all), use it verbatim and ignore the band default. `Email_Investigation_Templates.csv` `Auto_Expire = No` ⇒ set `fuseHours = 0` even for High/Critical (e.g. EMAIL_002, EMAIL_005, EMAIL_006 persist).

### 3.3 Idle-merc text/call escalation (the "texting you their concerns" loop)

GDD line 222–224: idle units are "becoming familiar with the city / texting you their concerns / aging by the day / secretly hiding an addiction." `types.ts:181-183` already reserves `escalationLevel (0 init / 1 text / 2 call)` and `nextEscalation`. Concrete ladder:

| escalationLevel | Trigger (game-hours idle, default speed) | Channel | Priority | Trace |
|---|---|---|---|---|
| 0 → 1 (text) | after **24 game-hours** idle (`Status_Available`) | `text` | `low` | GDD line 222–224 ("texting you their concerns"); 24h = one game-day, the `time:day-passed` boundary (`timeEngine` `day_change`) |
| 1 → 2 (call) | after **72 game-hours** idle total | `call` (`call_incoming`) | `medium` | `RULING:` 72h = the medium response window in `Time_Management.csv`; an idle merc who's been ignored a full medium-cycle escalates to a call |
| 2 → resolved | player assigns an activity, OR unit goes `Off-the-Grid`/`Personal Life` on its own | — | — | GDD line 269 (`Off the Grid`), line 251 (`Personal Life`) |

> `RULING:` text/call *content* (the actual line of dialogue) is drawn by the **Character system** keyed by the unit's **personality type** (one of 20, `PERSONALITY TARGET SELECTION` lists all 20). Phone & Comms only owns the *timer and channel*. Personality flavor mapping (e.g. a "Random/erratic" personality texts more often) is `OWNER-FORK:` content tuning, not a mechanic this system numbers.

### 3.4 Arrival ping (squad reaches a sector → can enter combat)

- **Emit on `arrival`** when a traveling squad's `Status_Traveling` flips to arrived. Source for the state machine: `Time_Management.csv` rows 36 (`Status_Traveling`) and 34 (`Status_Available`); the combat-enable gate is the existing world-map `on_mission` rule (`CLAUDE.md` World Map layer, "Enter Combat — button appears when on_mission").
- Priority = `medium` by default; **`high` if the destination has an active `crisis_ping`** in the same `sectorId` (you arrived at a hot zone).
- `channel:'ping'`, `sectorId` set, so `NotificationBar` and the world map can both surface it (UI hooks §6).

### 3.5 World-map crisis ping (POI / BNN telegraph)

The GDD's signature "world reaches out": **`Point of Interest`** (international) telegraphs AI faction moves *before* they happen — "Before China invades Taiwan, reports of troop buildups in the South China Sea will appear" (GDD line 510); **BNN/ANN** surfaces national super-criminals/scandals/clues (line 511). Phone & Comms receives these from News/World-State and places them on the map:

| Crisis scale (`Result_Templates.csv` `Combat_Scale` + `World_State_Tracking_System.csv`) | Priority | Default `fuseHours` | Map glyph |
|---|---|---|---|
| Street / City (`TEMP_001`–`003`, local) | `low`–`medium` | 72 | small dot |
| National / Regional (`TEMP_005`, `Military_Tension_Tracking`) | `high` | 24 | pulsing ring |
| Global / Cosmic (`TEMP_006`–`007`, `Crisis_Event_Pipeline`) | `urgent` | 6 | red flare + auto-pause (if `pauseOnUrgent`) |

`groupKey = "crisis:" + sectorId` so a sector shows **one** stacked crisis row, not N (dedupe rule §5.4).

### 3.6 Mobile vs desktop delivery cadence & density

From `Mobile_vs_Desktop_Experience.csv`:

| Aspect | Mobile | Desktop | Row |
|---|---|---|---|
| World-state refresh | **every 15 minutes**, essential info only | continuous, complete | `World_State_Tracking_System.csv` rows 13–14 (`Mobile_World_View` = "every 15 minutes"); `Mobile_vs_Desktop_Experience.csv` `Mobile_Monitoring` |
| Notification urgency presentation | platform-native, urgency indicators | platform-native, full detail | `Cross_Platform_Notification` row 28 |
| Session length the comms layer is tuned for | 30s–5 min (`Mobile_Strategic`/`Emergency_Response`) | 30–180 min | rows 2, 8 / rows 5–6 |
| Info density | "Simplified essential information only" | "Complete information" | rows 2 / 5 |

> `RULING:` On mobile, the queue **batches non-urgent buzzes to a 15-minute heartbeat** (matches `Mobile_World_View` cadence) — `low`/`medium` notifications accumulate and deliver one buzz per 15 real-minutes; `high`/`urgent` always buzz immediately ("Critical alert response" / "immediate", `Mobile_vs_Desktop_Experience.csv` row 8 & 28). On desktop, every qualifying notification surfaces immediately (continuous).

### 3.7 Contacts / dial-out gating (reuse, no new numbers)

All numbers come from `contactsSystem.ts`: unlock when `factionStandings[contact.factionType] >= contact.requiredStanding`; usable when `getContactCooldownRemaining()==0` and `budget >= baseCost`; cost = `baseCost`; cooldown = `cooldownHours`. Phone & Comms invents **none** of these — it only renders the dial UI and emits the `DialRequest`. Speaker mode toggles the bubble style (GDD line 486); it has **no mechanical effect** (cosmetic) — `OWNER-FORK:` if speaker should ever carry a gameplay rider (e.g. team morale on a "rally" call).

---

## 4. How it consumes the SPINE (country / city / personality stats → formulas)

Per `SHT_MECHANICS_BIBLE.md` §2 (spine) and §8 (combined effects must be *consumed*, ruling #9), the phone is not flavor — the **country/city the player is standing in modulates what reaches them and how reliably.** All inputs below are real World Bible `Country.csv` columns (§ header enumerated: `MediaFreedom`, `IntelligenceServices`/`IntelligenceBudget`, `CyberCapabilities`, `GovermentCorruption`, `LawEnforcement`, `LSWActivity`). Stat values are the World Bible's 0–100 scale (Bible §6.1 "all ~35 country columns translate to ±CS and access rules").

### 4.1 Comms reliability (do your pings even arrive on time?)

Surveillance/censorship states degrade your phone. Reuse the Bible §8 **Surveillance** formula (`Intel + Cyber + (100 − MediaFreedom)`) as the *interference* score:

```
interference = clamp( (Intel + Cyber + (100 - MediaFreedom)) / 3 , 0 , 100 )   // 0..100
// Intel = IntelligenceServices (Country.csv col 15), Cyber = CyberCapabilities (col 28),
// MediaFreedom = MediaFreedom (col 18). Source: Bible §8 "Surveillance / detection".

commsDelayHours = floor( interference / 25 )      // 0,1,2,3 game-hours added before a ping shows
//  interference 0–24 => instant; 25–49 => +1h; 50–74 => +2h; 75–100 => +3h
```

`RULING:` delay applies only to **incoming intel/news/crisis pings** (the state is *watching/jamming you*), never to your own **outgoing dial-outs** and never to `urgent` (an attack in progress is felt regardless). This makes "I'm operating inside a high-surveillance state (China/Collective faction territory, Bible §6.4)" *feel* different on the phone without a new number — it reuses the surveillance spine.

> Cross-check with the **Border Control** combo (Bible §8: `Military + Intel + Law`) is **not** applied here (that gates travel, doc 06). The phone uses surveillance only. This avoids double-dipping.

### 4.2 News/crisis ping *fidelity* (how early do you get the telegraph?)

The GDD's "see the buildup before the invasion" (line 510) should scale with where you are and your access. Reuse **MediaFreedom** directly:

```
crisisLeadHours = baseFuseHours + floor( MediaFreedom / 20 )   // +0..+5 game-hours of warning
// Free-press states leak the buildup earlier; censored states spring it on you.
// MediaFreedom (Country.csv col 18). Source: Bible §6.1 "Media freedom High: +media-investigation".
```

So a global `urgent` crisis (base fuse 6h) in a free-press country gives up to **11h** of lead; in a censored state, the floor **6h**. Lead is added to `fuseHours`, never subtracted.

### 4.3 Personality → which idle units actually text you, and tone

`PERSONALITY TARGET SELECTION` defines 20 personalities by their combat target preference (1=most-health/2=least-health/3=major-threat/4=minor-threat/5=random). Phone & Comms reuses the **same 20-type key** (not new data) to bias idle-text frequency:

```
// Re-key the existing personality id (1..20) the unit already carries.
idleTextIntervalHours = 24 * personalityChattinessMult[personalityId]
// personalityChattinessMult: RULING table (see below) — content tuning, derived from type, not invented numbers in a combat sense
```

`RULING:` `personalityChattinessMult` defaults to **1.0 for all 20 types** (everyone texts at the 24h baseline) and is exposed as a data table for writers to tune per personality (Bible §5.10 "extend personality into idle/world behavior"). This keeps the mechanic grounded (24h baseline traces to the day boundary) while honoring "characters you care about" (Bible Pillar #2) as *authorable content*, flagged `OWNER-FORK:` for the writing team.

### 4.4 City type → contact surface on the phone

The phone's **Contacts** tab availability is already gated by faction standing (`contactsSystem.ts`). The spine adds *which contacts even appear* by city type, reusing Bible §6.2 City_Type_Effects (no new numbers): in a **Seaport** city the `smuggler` contact surfaces (+smuggling affinity), in a **Military** city the `armorer`/military broker surfaces, in a **Temple** city the underworld contacts are *suppressed* (24h sanctuary). Phone & Comms reads `city.cityType` and shows/greys the corresponding `ContactService`. This is the spine "consumed," not computed-and-ignored (Bible ruling #9).

---

## 5. Edge cases & failure modes

1. **Queue overflow.** Store keeps **last 50** (`enhancedGameStore.ts:2196` `.slice(0,50)`). `RULING:` when trimming, **never drop an unread `urgent`/`high` with an unexpired fuse** — trim oldest `read || low || expired` first; if all 50 are unread+high, surface a single "Inbox full — triage" banner and stop buzzing until count drops. Prevents losing a mission-critical priority email to a flood of idle texts.
2. **Player ignores a fused notification.** On `fuseHours` elapse (checked each `time:hour-passed`), emit the owning system's *expiry* consequence (e.g. Email `Auto_Expire=Yes` ⇒ mission auto-declines and the world acts without you — GDD line 150 "events will occur without the player being aware"), then mark the notification `dismissed`, and append a terse `world_event` "MISSED:" trail entry. The phone does **not** decide the consequence; it fires `email:expired` / `crisis:expired` on the EventBus and lets the owner resolve it.
3. **Call let to ring out.** `call_incoming` that is neither answered nor dismissed before its fuse → convert to `call_missed` (`low`), keep in log, do not re-buzz.
4. **Combat in progress.** With `doNotDisturbInCombat:true` (default), **queue everything except `urgent`**; release the queue on `combat:ended`. `urgent` shows a non-modal banner (`channel:'banner'`) that never steals the tactical turn (Bible: combat is symbolic and turn-based; do not interrupt initiative).
5. **Laptop open = clock paused (Bible §7).** Notifications still *arrive into the queue* but **do not buzz** while paused (no time is passing to escalate); the unread badge updates live. On un-pause, deliver any `high`/`urgent` accumulated.
6. **Duplicate spam (same sector crisis ticking).** `groupKey` dedupe: a new notification whose `groupKey` matches an existing **unread, unexpired** one **updates that row in place** (refresh `message`, bump `realTimestamp`, keep `id`) rather than stacking. One crisis = one row.
7. **High-surveillance delay vs urgent.** Per §4.1, `commsDelayHours` is bypassed for `urgent` — an in-progress attack is never delayed by jamming.
8. **Speaker mode on a non-call.** Ignore the `speakerMode` flag for any channel != `call` (cosmetic-only; no crash).
9. **Time Walker sanity save/rewind (Bible §11).** On rewind, the notification queue **rewinds with game state** (queue is part of save). Newly-spawned `sanity_warning` (`urgent`, source `timewalker`) is the *only* notification allowed to persist across a rewind boundary so the player feels the cost. `OWNER-FORK:` exact sanity thresholds belong to doc 11 (Time-Travel Save); this system only renders the warning.
10. **Mobile offline / background (`Mobile_vs_Desktop_Experience.csv` rows 20).** Queue is local-first; on reconnect, collapse the 15-min heartbeat backlog into a single "while you were away" digest rather than N buzzes (matches `Offline_Capability` + the `WhileYouWereGoneSummary` already in `timeEngine.ts:198`).
11. **No active city/country (in transit / off-world).** If `currentCountry` is undefined, set `interference=0`, `crisisLeadHours=baseFuse` (no spine modulation); never crash on missing stats.

---

## 6. UI / UX hooks

### 6.1 Phone (`MobilePhone.tsx`) — already exists, extend
- **Buzz + unread badge** already implemented (vibrate on new message; badge = `getUnreadCount`). Gate the buzz by `CommsSettings.minBuzzPriority` and the mobile 15-min heartbeat (§3.6).
- **Tabs:** `messages | email | contacts` already present. Add a **Calls** affordance: `call_incoming`/`call_missed` render in `messages` with a green/red phone glyph (`NotificationBar.tsx` already maps `call_incoming → <Phone/>`).
- **Dial-out:** the Contacts tab shows each `Contact` with lock state (`isContactUnlocked`), cooldown (`getContactCooldownRemaining`), and cost; tapping emits `DialRequest`. **Speaker toggle** flips the reply bubble to the comic "loud" style (GDD line 486).
- **Priority flag:** every row shows the §2.2 glyph; `urgent`/`high` also show a live countdown ("expires in ~2h") computed from `expiresAtTotalHours − GameTime.totalHours` × current display ratio.

### 6.2 World map
- `crisis_ping` and `arrival` notifications with a `sectorId` drop a **map glyph** on that sector (scale→glyph table §3.5). Clicking the glyph opens the notification and (for arrival) reveals the **Enter Combat** button (existing world-map gate).
- Sector dashboard widget shows the `Mobile_World_View` summary at the **15-min** cadence on mobile, continuous on desktop (§3.6).

### 6.3 Laptop
- Opening the laptop **pauses the clock** (Bible §7); the phone badge and Email/News apps share the same `notifications[]` queue. A `priority_email` notification deep-links into the Email app (doc 07) via `sourceSystem:'email', sourceRefId:emailId`.

### 6.4 Combat overlay
- With DnD-in-combat on (default), only an `urgent` `channel:'banner'` shows — a thin top banner, non-modal, dismiss or "open after battle." No vibration during a tactical turn. Everything else is queued and released on `combat:ended`.

### 6.5 Top `NotificationBar.tsx` (already exists)
- Drives the global ticker. Reuse its existing icon map (`arrival→MapPin`, `call_incoming→Phone`, `email→Mail`, `world_event→Globe`, etc.) and priority color map (`urgent→red, high→orange, medium→blue, low→grey`) — both already implemented and already match §2.2.

---

## 7. Integration points (systems it reads / writes)

| Direction | System | Channel | Contract |
|---|---|---|---|
| **reads** | Email (doc 07) | EventBus `email:received` w/ `Priority_Level`,`Urgency_Hours`,`Auto_Expire` | → spawn `priority_email`/`email` notification; copy fuse from `Urgency_Hours` |
| **reads** | News / World-State (doc 08) | `news:point-of-interest`, `news:bnn` | → `crisis_ping` placed by `sectorId`, scale→priority (§3.5) |
| **reads** | Time engine (`timeEngine.ts`) | `time:hour-passed`, `time:day-passed`, `time:week-passed` | → escalation timers, fuse expiry checks, `payday` ping on `week_change` |
| **reads** | Travel (doc 06) | `squad:arrived` | → `arrival` ping (§3.4) |
| **reads** | Combat (`eventBus.ts` `combat:*`) | `combat:started/ended/unit-injured/unit-killed` | → DnD gate; `injury`/`death`/`mission_complete` notifications |
| **reads** | Faction (`factionSystem.ts`) | standing changes | → unlock/relock `contact_ready`; gate Contacts tab |
| **reads** | Character (personality, idle) | unit `Status_Available` duration | → idle text/call escalation (§3.3, §4.3) |
| **reads** | Time-Walker (doc 11) | `timewalker:sanity-low` | → `sanity_warning` |
| **writes** | EventBus | `email:expired`,`crisis:expired`,`call:missed`,`dial:requested` | owning system resolves the consequence |
| **writes** | Store | `addNotification`, `markNotificationRead`, `dismissNotification`, `clearAllNotifications` | already implemented in `enhancedGameStore.ts` |
| **writes** | Contacts | `DialRequest` → `DialResult` | gating/cost/cooldown enforced by `contactsSystem.ts` |

> The phone owns **routing + escalation + priority**, never **content or consequence.** This keeps it data-driven (Bible Pillar #1): adding a new notification type = a new `NotificationType` member + an EventBus subscription, no UI rewrite.

---

## 8. RULING: notes (collected)

- **R1 — Four priorities, four windows.** Keep the existing 4-value `NotificationPriority` and bind 1:1 to `Time_Management.csv` Critical/High/Medium/Low response windows (2h/24h/72h/optional, real-time). `Background` is non-buzzing ping-only. (§2.2, §3.2)
- **R2 — Deadlines in game `totalHours`.** All fuses computed/stored in game-hours (`timeSystem.ts`), display-converted by the active ratio, so speed changes never corrupt a deadline. (§3.1)
- **R3 — Email's own `Urgency_Hours`/`Auto_Expire` override band defaults.** (§3.2)
- **R4 — Idle escalation 24h→text, 72h→call**, content drawn by personality; chattiness multiplier defaults 1.0, writer-tunable. (§3.3, §4.3)
- **R5 — Surveillance spine adds 0–3h delay to incoming pings**, never to outgoing dials, never to `urgent`. Reuses Bible §8 Surveillance, no new number. (§4.1)
- **R6 — MediaFreedom adds 0–5h crisis lead** (free press leaks the buildup earlier). (§4.2)
- **R7 — Mobile batches non-urgent to a 15-min heartbeat**; high/urgent immediate. Reuses `Mobile_World_View` cadence. (§3.6)
- **R8 — Queue trim protects unread urgent/high**; one stacked row per `groupKey`. (§5.1, §5.6)
- **R9 — DnD-in-combat queues all but urgent**; urgent is a non-modal banner. (§5.4, §6.4)
- **R10 — Speaker mode is cosmetic** (comic loud-bubble), no mechanical rider unless owner forks it. (§3.7)

## 9. OWNER-FORK: notes (product decisions left open)

- **OF1 — Personality chattiness/tone table.** `personalityChattinessMult[1..20]` and the actual text/call dialogue lines per personality are *content* for the writing team; defaults are 1.0/neutral. (§4.3) — **this is the single biggest authored-content fork.**
- **OF2 — Real-world dial-out cheat codes.** GDD line 487 explicitly wants devs to hand out phone numbers IRL ("like cheat codes almost"). Whether the shipping build accepts arbitrary externally-published numbers (and the secret-contact unlock list) is an owner/marketing call, not a mechanic. (§1, §3.7)
- **OF3 — Speaker mode rider.** Should a "speaker"/rally call ever carry a morale or team buff? Default: no (cosmetic). (§3.7, R10)
- **OF4 — `pauseOnUrgent` default.** Auto-pausing the world clock on a global `urgent` crisis ping is on by default; some players may want it off. Setting exists; default is the owner's call. (§2.4)
- **OF5 — Sanity-warning thresholds & whether the warning notification is suppressible.** Owned by doc 11 (Time-Travel Save); this system only renders it. (§5.9)
- **OF6 — Mobile heartbeat interval.** 15 min traces to `Mobile_World_View`; if the live mobile build wants a different cadence for monetization/retention, that's a product fork. (§3.6, R7)

## 10. Open questions

1. **Cross-platform sync of read/dismissed state** — `Cross_Platform_Synchronization` (`Mobile_vs_Desktop_Experience.csv` row 17) promises identical state across devices, but the diegetic time-travel save (Bible §11) is single-player and local. Is there a real cloud sync target, or is "cross-platform" aspirational? Resolve before building the heartbeat batcher (it assumes local-first).
2. **Does an unanswered priority *call* (not email) have its own world consequence**, or only missed *emails*? GDD is explicit about email-ignore consequences (line 150) but silent on calls. Proposed default: missed call = soft consequence (a follow-up email) unless the caller is a head of state (then it escalates to the email-ignore path).
3. **Crisis-ping authorship** — are POI/BNN crisis pings authored templates (like `Email_Investigation_Templates.csv` / `Result_Templates.csv`) or fully procedural from `World_State_Tracking_System.csv`? This system can route either; News (doc 08) must declare which so the `sourceRefId`/`groupKey` keys are stable.
4. **Telemetry** — GDD lines 416–418 & 1487 want syslog→Splunk hooks. Should every notification emit a telemetry event (delivered/read/dismissed/expired)? Cheap to add at `addNotification`; needs an owner yes/no for privacy/scope.
5. **Personality-driven *call* (not just text)** — should certain personalities (e.g. the `random`/erratic type, id with target-pref 5) skip the text rung and call directly? Tie-in to OF1.

---

*This spec routes the living world to the player without owning its content. It reuses the existing `GameNotification`/store/`MobilePhone`/`NotificationBar`/`contactsSystem` shapes (no forks), binds priority to the four `Time_Management.csv` response windows, and consumes the surveillance + media-freedom + personality + city-type spine so that **where you stand changes how the world reaches you** — the point of the spine (Bible §8, ruling #9).*
