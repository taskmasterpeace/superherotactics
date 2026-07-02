# 10 — Email-as-Dialogue & News (laptop apps)

> **System owner doc.** Build-ready spec for the two **laptop apps** that render the living world's words to the player: **EMAIL** (RPG dialogue/missions delivered as an inbox you reply to with a click) and **NEWS** (`Point of Interest` international feed + `BNN`/`ANN` national feeds, plus tabloid/independent outlets). Together they are the **read/respond surface** of the core fantasy — *"a living world that talks to you."*
>
> **Scope boundary (critical — read first).** This doc does **NOT** select or parameterize event content. That is the **Event & Emergence Engine (doc `02`)**, which freezes a spine context, picks an authored template (`Email_Investigation_Templates.csv`, `Result_Templates.csv`, `Dynamic_Political_Events.csv`, …), fills its variables, and emits a fully-resolved payload. Doc 10 **consumes** those payloads: it owns the **inbox data model, the reply→decision contract, priority/expiry consumption, the news feed model, narrative rendering from `Result_Templates`, source/bias selection by government type, the laptop UI for both apps, and the read/reply/archive/bookmark state.** Delivery *buzzes* (badges, vibration, world-map pings) are owned by **Phone & Comms (doc `01`)**; this doc writes the records those buzzes point at. Fork-in-the-Road full-screen rendering is **doc `110`**; doc 10 renders the *email-bodied* subset of forks in the inbox.
>
> **Status of source data:** Every number below traces to a named source table. Where the source was silent, a `RULING:` is given consistent with `SHT_MECHANICS_BIBLE.md`. Owner-only product calls are flagged `OWNER-FORK:`. **No number is invented.**
>
> **Primary sources read:**
> - `SHT_MECHANICS_BIBLE.md` — §2 (SPINE), §7.1 (Email = dialogue/mission system), §7.2 (News: POI / BNN / ANN), §8 (combined-effects incl. Media control), §9 (Public Perception consequences), §11 (time-travel save / rewind determinism), §13 ruling #9 (combined-effects must be consumed), ruling #10 (unify on `allCountries`+`allCities`).
> - `SuperHero Tactics/FIST GDD v02.txt` lines 135–162 (email replies are dialogue decisions; priority emails are mission-givers/heads of state), 499–513 (E-MAIL app, PRIORITY flag; NEWS app — Point of Interest, ANN, BNN), 566 (email the recruitment division, predetermined subjects).
> - `docs/csv-source-data/Email_Investigation_Templates.csv` — **25** email envelopes: `Email_ID, Priority_Level (Critical/High/Medium/Low), Subject_Template, Sender_Type, Investigation_Type, Urgency_Hours, Body_Template, Response_Options (`;`-split), Auto_Expire`.
> - `docs/csv-source-data/Result_Templates.csv` — **20** narrative templates (`TEMP_001..020`) + **8** `Variable_*` definitions + **5** `Format_*` output styles; each template has `Combat_Scale, Narrative_Style, Word_Count, AI_Prompt_Template, Variables_Required, Output_Format, Media_Source, Tone, Example_Opening`.
> - `docs/csv-source-data/Narrative_Quality_Assessment.csv` — the **6-weight QA score** (Country 25 / City 20 / Faction 20 / Cultural 15 / Media-style 10 / Consequence 10), government-type media-control rules, publication threshold 85%, variety <10% similarity.
> - `docs/csv-source-data/Public_Perception.csv` — reputation Δ / financial / legal / insurance scales per perception event (drives "what the news says happened to your reputation").
> - `docs/csv-source-data/Time_Management.csv` rows 42–46 — the four response windows + Background.
> - World Bible `Country.csv` columns (`GovernmentStructureType, MediaFreedom, GovermentCorruption, CyberCapabilities, LSWActivity, …`) — the spine inputs for bias/censorship.
>
> **Existing code this binds to (source of truth for shapes — DO NOT re-invent):**
> - `MVP/src/data/emailSystem.ts` — `Email`, `EmailCategory`, `EmailPriority ('urgent'|'normal'|'low')`, `EmailSender`, `EmailReplyOption`, `EmailAttachment`, `EMAIL_SENDERS`, `createEmail`, `generateMissionBriefing`, `markEmailRead`, `toggleEmailStar`, `archiveEmail`, `deleteEmail`, `initEmailSystem`. **Extend; do not fork.**
> - `MVP/src/data/newsSystem.ts` — `NewsArticle`, `NewsCategory (11)`, `NewsBias (7)`, `NewsImportance (5)`, `NewsSource`, `NEWS_SOURCES[]`, `NewsEventType`, `createNewsArticle`, `pickRandomSource`, `getSourcesByBias`, `getSourcesForCategory`. **Source of truth for the feed.**
> - `MVP/src/data/newsGenerator.ts` — `initNewsGenerator()`, `selectTemplate`, `getHeadlineFromSet`, EventBus subscriptions. **The render/subscribe layer; extend it.**
> - `MVP/src/data/newsTemplates.ts` — `HeadlineSet` (7 bias arrays), `MISSION_SUCCESS_HEADLINES`, etc. **The headline content tables.**
> - `MVP/src/components/NewsBrowser.tsx` — the News app UI shell (full article system, per CLAUDE.md "WORKING").
> - `MVP/src/data/eventBus.ts` — `EventBus`, `GameEventType` (subscribe to `event:fired`, `worldEvent:fired`, `fork:*`, `mission:completed`, `combat:ended`, `reputation:changed`, `time:day-passed` — emitted by docs 02/110 and combat).
> - `MVP/src/stores/enhancedGameStore.ts` — `emails[]`, `addEmail`, `updateEmail`, `deleteEmail`, `getEmails`, `getEmailUnreadCount`; news state lives in `NewsState` (`newsSystem.ts:332`).

---

## 1. Overview & player fantasy

The player runs a government-backed superhuman org from a **laptop** (opening it **pauses the world clock**; you may un-pause — Bible §7, GDD line 497). Two of its apps are the *words* of the living world:

**EMAIL is how you get missions and make story choices — without typing.** Instead of walking to a wizard and clicking through a dialogue tree (GDD lines 154–162), the wizard *emails* you. You open the mail, pick a **Subject**, the body shows your possible replies, you hit **SEND**, and that *is* your dialogue decision (GDD lines 135–147, 501). A Minister in Lagos begs you to stop a gang war with a **24-hour fuse** (`EMAIL_001`). An intelligence agency flags **CLASSIFIED — three officials vanished, respond in 12h** (`EMAIL_003`, Critical). You are never *forced* to read or reply — but **if you ignore email, events resolve without you** ("Why is that mushroom cloud in Iceland?" — GDD line 501). The **PRIORITY flag** (GDD line 504) tells you which mail is a mission-giver/head-of-state vs a routine report (GDD line 162).

**NEWS is how you learn what the world did.** `Point of Interest` (international) telegraphs the AI factions' moves — *troop buildups in the South China Sea before China invades Taiwan* (GDD line 510). `ANN`/`BNN` (national) surface super-criminals, elections, scandals, and **investigation clues — a city of interest** (GDD line 511). Crucially, **the same combat can read three different ways**: allied-nation media minimizes it, enemy-nation media spins it as an invasion, neutral media reports facts (`Narrative_Quality_Assessment.csv` row 4) — and a high-`MediaFreedom`/low-`Corruption` country gives you honest coverage while an authoritarian one censors and plants (`Narrative_Quality_Assessment.csv` row 10; Bible §8 Media control).

Three felt promises:
1. **Decisions are a single click, but they ripple for the campaign.** A reply = a `ForkOption` resolution → reputation/legal/faction deltas (`Public_Perception.csv`; Bible §9).
2. **The world reports on you, colored by *who* is reporting.** The same event, two countries, two truths.
3. **The inbox and feed are leads, not flavor.** News articles carry `investigationLead`/`missionHook`; ignoring a fused email lets its world-event fire (doc 02 `event:expired`).

---

## 2. Data schema (fields/types)

### 2.1 Email — extend the existing `Email` (do not fork `emailSystem.ts`)

The existing `Email` already has `id, category, priority, from, subject, body, attachments, timestamp, read, starred, archived, replyOptions?, actionable?`. Add the following **optional, back-compatible** fields so an email can carry the spine context + expiry the GDD/CSV demand:

```ts
// emailSystem.ts — ADD to EmailCategory (keep all existing members):
export type EmailCategory =
  | 'mission_briefing' | 'intel_report' | 'contact'
  | 'news_tip' | 'admin' | 'personal'
  // NEW (this system, mapping Email_Investigation_Templates.Investigation_Type families):
  | 'investigation_alert'   // EMAIL_001..025 — the mission/fork envelope
  | 'diplomatic'            // EMAIL_004/009 — heads of state / foreign ministry
  | 'recruitment'           // GDD line 566 — email the recruitment division
  | 'faction_relations'     // standing change (generateFactionReactionEmail already exists)
  | 'timewalker';           // doc 11 — the changed Time Walker emails you (GDD line 132)

// EmailPriority: KEEP the existing 'urgent'|'normal'|'low' on the record,
// but map FROM the 4 CSV levels at ingest (see §3.1). Add a verbatim source tag:
export interface Email {
  // ...all existing fields unchanged...
  sourcePriority?: 'Critical' | 'High' | 'Medium' | 'Low'; // verbatim Email_Investigation_Templates.Priority_Level
  investigationType?: string;     // Email_Investigation_Templates.Investigation_Type (e.g. 'Gang War Escalation')
  templateId?: string;            // 'EMAIL_001' — provenance for rewind determinism & dev panel
  urgencyHours?: number;          // Email_Investigation_Templates.Urgency_Hours (in GAME hours)
  autoExpire?: boolean;           // Email_Investigation_Templates.Auto_Expire ('Yes'/'No' -> bool)
  receivedTotalHours?: number;    // GameTime.totalHours at delivery (deadline math; rewind-safe)
  expiresAtTotalHours?: number;   // receivedTotalHours + urgencyHours (only if autoExpire)
  expired?: boolean;              // true once past deadline; reply options disabled
  answered?: boolean;             // a replyOption was sent (locks further replies)
  chosenReplyId?: string;         // which EmailReplyOption was sent
  spineRef?: EmailSpineRef;       // frozen context for narrative/consequence (see §2.3)
  forkRef?: string;               // doc 110 ForkEvent id if this email IS a fork (email-bodied)
  location?: { city: string; country: string; sector: string }; // for map ping + clue
}
```

### 2.2 Email reply = decision (extend `EmailReplyOption`)

`Response_Options` in the CSV are a `;`-split list of *labels only* (e.g. `Deploy Team Immediately;Send Investigators;Request More Information;Decline Mission`). The **consequence wiring is owned by doc 02/110** — doc 10 renders the option and forwards the chosen id back to the producer. Extend the existing `EmailReplyOption.effect` so it can carry a doc-110 `ForkOption.id`:

```ts
export interface EmailReplyOption {
  id: string;
  label: string;          // from Response_Options split (verbatim CSV)
  response: string;       // the "sent" confirmation text shown after SEND
  forkOptionId?: string;  // NEW: maps 1:1 to doc 110 ForkOption.id (the real consequence owner)
  effect?: {              // existing inline-effect path (kept for simple emails)
    reputation?: number;
    relationship?: number;
    triggersMission?: boolean;
  };
}
```

> `RULING:` an email with a `forkRef` MUST route its reply through `doc110.resolveFork(forkRef, forkOptionId)` (the single consequence resolver); the inline `effect` path is only for legacy/simple admin mails that have no fork. This honors Bible ruling #9 (consequences are consumed by one resolver, not duplicated). One reply path, no double-applied reputation.

### 2.3 Frozen spine reference (shared with doc 02 `EventSpineContext`)

The email/article carries a **lightweight reference** to the frozen spine context (the full object lives in the producing event, doc 02 §2.2). Doc 10 only needs the fields it renders/branches on:

```ts
export interface EmailSpineRef {
  countryCode: string;            // ISO (Bible ruling #10)
  cityName: string; sector: string;
  cultureCode: number;            // 1..14
  governmentType: string;         // Country.csv GovernmentStructureType (verbatim)
  mediaFreedom: number;           // Country.csv MediaFreedom (0..100 scale of source)
  corruption: number;             // Country.csv GovermentCorruption
  cyber: number;                  // Country.csv CyberCapabilities
  factionRelation: 'home' | 'ally' | 'hostile' | 'neutral'; // overlay (Bible §6.4)
}
```

### 2.4 News — bind to the existing `NewsArticle` (no fork)

`NewsArticle` (`newsSystem.ts:55`) is already complete: `headline, body, summary?, source, publishedDay/Hour, category, importance, region?, city?, sectorCode?, relatedCharacters/Factions/Locations, investigationLead?, missionHook?, reputationEffects?, isRead, isBookmarked, expiresDay?, eventType?, eventId?`. **Use it as-is.** Add only the channel + provenance the GDD's three feeds require, as optional fields:

```ts
// newsSystem.ts — ADD to NewsArticle (additive):
export interface NewsArticle {
  // ...all existing fields unchanged...
  channel?: NewsChannel;          // which GDD "website" this rides on (default by category)
  narrativeTemplateId?: string;   // 'TEMP_001' — which Result_Templates row rendered it
  qaScore?: number;               // Narrative_Quality_Assessment weighted score 0..100 (dev/telemetry)
  isPlanted?: boolean;            // produced by Media-control (censorship/propaganda), §3.6
  suppressed?: boolean;           // censored out of a low-MediaFreedom feed (still readable on indie/foreign)
}

export type NewsChannel =
  | 'point_of_interest'   // GDD line 510/513 — INTERNATIONAL (AI faction moves, troop buildups)
  | 'ann'                 // GDD line 511 — America's News Network (US national)
  | 'bnn'                 // GDD line 512 — national news program (non-US national, per country)
  | 'local'               // city herald / metro (Result_Templates Media_Source = 'City Herald')
  | 'tabloid'             // Scandal Weekly (low credibility)
  | 'independent';        // Underground Wire (alt/foreign-leak)
```

### 2.5 App view-state (laptop UI, persisted)

```ts
export interface InboxViewState {
  filter: 'all' | 'priority' | 'unread' | EmailCategory;
  sort: 'newest' | 'priority' | 'deadline';   // 'deadline' surfaces soonest-expiring first
  selectedEmailId?: string;
  showExpired: boolean;                        // default false
}
export interface NewsViewState {
  channel: NewsChannel | 'all';                // default 'all' (the four GDD feeds + tabloid/indie)
  category?: NewsCategory;
  region?: string;                             // country code filter ('city of interest' drill-down)
  showBookmarkedOnly: boolean;
  selectedArticleId?: string;
}
```

---

## 3. Exact numbers, tables & formulas (each cited)

### 3.1 Priority mapping — the PRIORITY flag (GDD line 504; `Time_Management.csv` 42–46)

`Email_Investigation_Templates.csv` `Priority_Level` has **four** values; `Time_Management.csv` defines **four** response windows + Background. The record stores both the verbatim 4-level `sourcePriority` and the legacy 3-level `priority` (existing field). Mapping table (every cell cited):

| `sourcePriority` (CSV `Priority_Level`) | Response window (`Time_Management.csv`) | legacy `Email.priority` | Phone buzz (doc 01) | Inbox glyph |
|---|---|---|---|---|
| `Critical` | row 42 `Event_Priority_Critical` — **2 hours real time**, interrupts all | `urgent` | red ●● + flag, auto-pause if `pauseOnUrgent` | 🔴 flag |
| `High` | row 43 `Event_Priority_High` — **24 hours real time** | `urgent` | orange ● + flag | 🟠 flag |
| `Medium` | row 44 `Event_Priority_Medium` — **72 hours real time** | `normal` | blue ● | 🔵 |
| `Low` | row 45 `Event_Priority_Low` — optional / ignorable | `low` | grey ● (no buzz < `minBuzzPriority`) | ⚪ |
| *(Background)* | row 46 — passive, **no buzz, no inbox flag** | n/a | none | dashboard-only |

> `RULING:` the verbatim `Priority_Level` is the **flag** (what the GDD shows the player, line 504); `Time_Management` rows 42–45 give the **fuse** (the consequence of ignoring it). They are two facets of one value; store both, derive the buzz/window from `sourcePriority`. Background emails are not created by this system (no envelope in `Email_Investigation_Templates` is Background); if doc 02 ever emits one, downgrade to `priority:'low'` and suppress the buzz (consistent with doc 01 §2.2).

> `RULING:` the four `Time_Management` windows are stated in **real time**. Store the deadline in **game `totalHours`** (`expiresAtTotalHours`, §2.1) so it is immune to player speed changes; only the *displayed* countdown ("~2h") converts via the active 1:30 ratio (`Time_Management.csv` `Base_Time_Flow`; matches doc 01 §3.1). `Urgency_Hours` in the CSV is already in **game hours** (doc 02 §2.1 confirms), so `expiresAtTotalHours = receivedTotalHours + urgencyHours`.

### 3.2 Expiry / auto-resolve (the "events happen without you" rule)

For each email with `autoExpire === true` and `now.totalHours >= expiresAtTotalHours` **and** `answered === false`:
1. Set `expired = true`; disable all reply options; gray the row.
2. Emit `eventBus.emit('email:expired', { emailId, templateId, spineRef })` — doc 02 catches this and fires the template's **no-response branch** (the world-event the player declined to prevent). This is the GDD's "mushroom cloud in Iceland" (line 501).
3. Push a `crisis_ping`/`world_event` notification request to doc 01 (the *consequence* surfaces in News, §3.5).

**Auto_Expire mapping** (verbatim from `Email_Investigation_Templates.csv`, sampled — engine reads the column for all 25):
- `Yes` → `autoExpire = true`: e.g. `EMAIL_001` (24h, Gang War), `EMAIL_003` (12h, Missing Officials), `EMAIL_007` (6h, UAP), `EMAIL_017` (8h, Environmental Disaster), `EMAIL_021` (6h, Terrorist), `EMAIL_025` (4h, Reality Breach).
- `No` → `autoExpire = false`: e.g. `EMAIL_002` (72h, Corporate Sabotage), `EMAIL_006` (96h, Artifact), `EMAIL_010` (120h, Trafficking), `EMAIL_019` (168h, Cultural Exchange). These linger as standing opportunities; never auto-fire a bad outcome (they're missions, not ticking bombs).

> `RULING:` `Urgency_Hours` is the *display countdown* for **all** emails, but only `Auto_Expire = Yes` emails trigger the bad-outcome branch on lapse. `Auto_Expire = No` emails past `Urgency_Hours` set `expired=true` (no longer answerable, opportunity lost) but emit `email:lapsed` (a *softer* event — the mission window closed, no catastrophe). This matches the CSV's own split (terror/disaster = Yes; cultural-exchange/archaeology = No).

### 3.3 Inbox glyph & deadline color thresholds

Countdown color is a fraction of `urgencyHours` remaining (purely presentational; no source number to violate — `RULING:` thresholds chosen to read as JA2/CK urgency):
- `remaining / urgencyHours > 0.5` → normal · `0.25–0.5` → amber · `< 0.25` → red pulsing · `expired` → strikethrough grey.

### 3.4 News channel routing (the three GDD feeds)

Each `NewsArticle` gets a `channel` from its source category + scale (every rule cited to GDD line):

| Condition | `channel` | Source (GDD) |
|---|---|---|
| `category ∈ {international, politics}` AND scale ≥ National AND involves an **AI faction move** (`eventType ∈ {world_event, faction_action, political_event}`) | `point_of_interest` | line 510/513 — international, telegraphs faction moves |
| `region === playerHomeCountry === 'US'` AND `category ∈ {superhuman, crime, politics, local}` | `ann` | line 511 — America's News Network (US national) |
| `region === <non-US national>` national-scale | `bnn` | line 512 — national news program |
| `category === 'local'` OR `importance ∈ {minor, filler}` | `local` | `Result_Templates` `Media_Source = City Herald` |
| `source.bias === 'tabloid'` | `tabloid` | `Scandal Weekly` (`newsSystem.ts:239`, credibility 30) |
| `source.bias === 'independent'` | `independent` | `Underground Wire` (`newsSystem.ts:266`, credibility 55) |

> `RULING:` `ann` vs `bnn` is purely **whose nation** the article's `region` is — `ann` is the US feed (GDD names it explicitly), `bnn` is the generic national feed for every *other* country (GDD line 512 names BNN as "national news program" without a nation, so it's the template applied per-country). Player home faction determines which national feed is the *default tab*.

### 3.5 Narrative rendering (`Result_Templates.csv`) — choosing the template

When doc 02 emits a render request (`worldEvent:fired`, `fork:resolved`, `mission:completed`, `combat:ended`, `email:expired`), pick the `Result_Templates` row by `Combat_Scale` matched to event scale, then the most-specific `Narrative_Style` for the event type. The full table (verbatim, all 20):

| ID | Template | `Combat_Scale` | `Word_Count` | `Media_Source` | `Tone` | Fires on |
|---|---|---|---|---|---|---|
| TEMP_001 | Local Hero Report | Street Level | 150–200 | City Herald | Positive community | mission success, low visibility |
| TEMP_002 | Crime Beat Coverage | Street Level | 100–150 | Police Blotter | Pro law-enforcement | crime stopped / arrest |
| TEMP_003 | Superhuman Showdown | City Level | 250–300 | Channel 7 Action News | Dramatic | hero-vs-villain city combat |
| TEMP_004 | Investigation Breakthrough | Any | 200–250 | Metro Investigates | Serious journalistic | investigation→combat reveal |
| TEMP_005 | Military Operation | National | 300–350 | Department of Defense | Official military | faction military op |
| TEMP_006 | International Incident | Global | 350–400 | Global News Network | Diplomatic | cross-border / `EMAIL_004/009` lapse |
| TEMP_007 | Scientific Discovery | Cosmic | 400–500 | Journal of Enhanced Human Studies | Academic | alien tech / anomaly |
| TEMP_008 | Casualty Report | Any | 100–150 | Metro General Hospital | Medical | civilian casualties |
| TEMP_009 | Legal Analysis | Any | 250–300 | Law Review Quarterly | Legal | lawsuit/charges (`Public_Perception` legal tier) |
| TEMP_010 | Economic Impact | Regional/Global | 200–250 | Financial Times | Economic | property/infrastructure damage |
| TEMP_011 | Eyewitness Account | Any | 150–200 | Social media post | Personal emotional | any (color/variety) |
| TEMP_012 | Heroic Moment | Any | 200–250 | Hope Magazine | Inspirational | saved-lives / self-sacrifice |
| TEMP_013 | Villain Profile | Any | 250–300 | FBI Behavioral Analysis | Criminal-analysis | named villain defeated |
| TEMP_014 | Technology Report | Any | 200–250 | Tech Today | Technical | tech/gadget used |
| TEMP_015 | Environmental Impact | Any | 200–250 | Green Planet News | Environmental concern | environmental damage (`EMAIL_017`) |
| TEMP_016 | Political Spin | Any | 200–250 | Political Commentary Weekly | Partisan | any (faction-colored, §3.6) |
| TEMP_017 | Conspiracy Theory | Any | 150–200 | Truth Seekers Forum | Paranoid | any (tabloid/indie variety) |
| TEMP_018 | Corporate Response | Any | 100–150 | Corporate Communications | Corporate defensive | corporate-property damage |
| TEMP_019 | Memorial Service | Character Death | 250–300 | Memorial Times | Respectful | team-member death (`Public_Perception` Team_Member_Death) |
| TEMP_020 | Victory Celebration | Major Victory | 200–250 | Victory News Network | Celebratory | major mission/world win |

**Variable fill** uses the 8 `Variable_*` defs (`Result_Templates.csv` rows 22–29): `Winner, Loser, Location, Property_Damage, Civilian_Impact, Duration, Turning_Point, Aftermath`. They are filled from the **frozen spine + combat outcome** (doc 02 provides the resolved values; e.g. `Property_Damage` from the `Public_Perception` financial tier, `Location` = `"{cityName} near the {cityType} district"`). `Output_Format` is one of the 5 `Format_*` rows (Newspaper / Social_Media / Official_Report / Academic_Paper / Legal_Document — `Result_Templates.csv` rows 30–34), selected by `channel`.

### 3.6 Bias, censorship & planting (Media control — Bible §8, `Narrative_Quality_Assessment.csv` rows 4, 10)

The **same event** is rendered into **multiple articles**, one per relevant outlet, each picking a **bias-specific headline** from `newsTemplates.HeadlineSet` (the 7 bias arrays). Which biases appear, and whether the event is censored/planted, is **spine-driven** by the *reporting country's* government type, media freedom, and corruption — this is a direct consumption of the SPINE (Bible ruling #9):

```
biasMix(reportingCountry):
  base = pick the bias of every NEWS_SOURCE whose regions ⊇ {country} or regions == []  // newsSystem.ts NEWS_SOURCES
  // Government-type media control (Narrative_Quality_Assessment.csv row 10, verbatim rules):
  if GovernmentStructureType is authoritarian-class:        // 'Single-Party','Authoritarian','Absolute Monarchy','Military'
        censor anti_hero/anti-government articles about the player IF player is aligned (suppressed=true)
        AND emit a 'government'-bias PLANTED article (isPlanted=true) per TEMP_016 Political Spin
  if GovernmentStructureType is democratic-class:            // 'Federal Republic','Parliamentary Democracy','Constitutional Monarchy'
        allow free press → full biasMix incl. anti_hero & independent, no suppression
  // Faction overlay (Narrative_Quality_Assessment.csv row 4):
  if factionRelation == 'ally'    → bias toward pro_hero/government, minimize Property_Damage in copy
  if factionRelation == 'hostile' → bias toward anti_hero, frame as 'invasion' (TEMP_006/016)
  if factionRelation == 'neutral' → favor 'neutral' sources (World News Network cred 85), report facts
```

Numeric drivers, each cited:
- **Censorship strength** = `(100 − MediaFreedom)` from `Country.csv MediaFreedom`. `RULING:` if `MediaFreedom < 40` → suppress hostile-to-aligned-player articles in that country's `bnn`/`ann` feed (they remain visible on `point_of_interest`, foreign `bnn`, and `independent`/`tabloid`). 40 is the midpoint below the source's "free press" examples (US/India high, China low — `Narrative_Quality_Assessment.csv` row 10 names China = state media control).
- **Planting / troll-farm reach** scales with `CyberCapabilities + GovermentCorruption` (Bible §8 Media-control formula `MediaFreedom + Corruption + Cyber`). `RULING:` planted-article count per event = `1 + floor((Corruption + Cyber) / 100)` (0..2 extra spin pieces), capped at 2 so feeds don't flood.
- **Credibility** is the existing `NewsSource.credibility` (`newsSystem.ts`, 30–90); tabloid 30 / state 65 / World News Network 85 / Science Today 90. Display it as a "reliability" pip so the player learns to weight `point_of_interest` and `World News Network` over `Scandal Weekly`.

### 3.7 Narrative Quality gate (`Narrative_Quality_Assessment.csv`)

Before an article ships to a player-facing feed, compute the weighted QA score (`Quality_Score_Calculation`, row 21, verbatim weights):

```
QA = Country_Integration*0.25 + City_Integration*0.20 + Faction_Integration*0.20
   + Cultural_Auth*0.15 + Media_Style*0.10 + Consequence_Real*0.10        // each sub-score 0..100
```

Sub-score targets (rows 2–7): Country ≥80%, City ≥75%, Faction ≥70%, Cultural ≥65%, Media-style ≥85%, Consequence ≥80%. **Publication threshold = 85%** overall (`Quality_Threshold_Publication`, row 29). Below threshold → regenerate (template re-roll) up to N times.

> `RULING:` for a **deterministic, offline, template-substitution** pipeline (the shipping default, see OWNER-FORK-A), QA is computed as *presence checks*: did the filled article mention the country's wealth/politics/media-freedom (Country sub-score), the city type (City), the faction relation (Faction), the culture-region flavor (Cultural)? Each present element = its weight. Because doc 02 weaves the spine into every template's `Variables_Required`, a correctly-filled template scores ~100 by construction; QA is a **dev-build assertion** (fail-loud in dev, log-only in production), **not** a runtime LLM judge. Regen count `N = 2` (`RULING:` — source says "regenerate until threshold" but gives no cap; 2 retries then ship the best-scoring to avoid infinite loops). Variety: track `<10%` similarity (`Narrative_Variety_Tracking`, row 23) via a rolling hash of the last 20 articles per `eventType`; on collision, force a different `HeadlineSet` entry.

### 3.8 Investigation-clue surfacing (GDD line 511 "city of interest")

An article with `category ∈ {crime, superhuman, politics}` and `importance ∈ {breaking, major}` gets an `investigationLead` populated by doc 02/09 (it points at an `Email_Investigation_Templates` envelope to spawn). `RULING:` probability a major article carries a clue = scaled by the city's `CrimeIndex` and the country's `IntelligenceBudget`: higher crime → more leads to chase; higher player-country intel → leads surface *earlier* (matches doc 02 open-q #5 "high-Intel countries get longer warning"). Exact constant lives in doc 09 (clue-generation owner); doc 10 only *renders* the lead as a clickable "Open Investigation" affordance.

---

## 4. How this consumes the SPINE (Bible §2, §8; ruling #9)

Doc 10 is a **pure consumer** of the spine — it never re-derives stats, it reads the frozen `EmailSpineRef`/`EventSpineContext` doc 02 froze at fire time, and branches on it. Every spine input it touches:

| Spine input (source) | Consumed by | Effect on email/news output |
|---|---|---|
| `Country.csv GovernmentStructureType` | §3.6 `biasMix` | authoritarian → censor + plant; democratic → free press / full bias mix |
| `Country.csv MediaFreedom` (0..100) | §3.6 censorship strength = `100 − MediaFreedom` | `<40` suppresses hostile articles in that nation's feed (still on POI/foreign/indie) |
| `Country.csv GovermentCorruption` + `CyberCapabilities` | §3.6 planting (Bible §8 Media formula) | planted-spin count `1 + floor((Corruption+Cyber)/100)`, cap 2 |
| `Country.csv IntelligenceBudget` | §3.8 clue lead-time | higher intel → leads surface earlier / more often |
| `Cities.csv CrimeIndex` | §3.8 clue density; §3.5 `Property_Damage`/threat framing | high crime → more `investigationLead`s, harsher local copy |
| `Cities.csv CityType1..4` | §3.5 `Variable_Location` + template focus (`Narrative_Quality_Assessment` rows 12) | Industrial→economic copy (TEMP_010), Military→security (TEMP_005), Temple→cultural |
| `Cities.csv PopulationRating` | §3.5 `Variable_Civilian_Impact` scale (`Narrative_Quality_Assessment` row 13) | large city → "mass evacuations"; small → "personal community impact" |
| `Cities.csv CultureCode` (1..14) | §3.5 Cultural sub-score; flavor | regional cultural elements in copy (Cultural ≥65% QA) |
| Faction relations overlay (Bible §6.4, `countryrelationships.csv`) | §3.6 faction bias | ally minimizes, hostile frames as invasion, neutral = facts |
| `Country.csv GDPNational` / `Lifestyle` | §3.5 `Property_Damage` $ + recovery framing (`Narrative_Quality_Assessment` row 8) | wealthy nation "absorbs costs / better medical"; poor "suffers economically" |
| `Public_Perception.csv` event row | §3.5 `Aftermath`/legal copy; §5 reputation echo | reputation Δ + financial + legal tier become the article's stated consequences |

This is the literal answer to Bible ruling #9 ("combined-effects must be consumed, not just computed"): the news app **reads the same combined-effects** that mission-gen/pricing read, so the world that *talks* to you and the world that *prices* you are one world.

---

## 5. Edge cases & failure modes

1. **Email ignored past fuse** → §3.2: `expired=true`, reply locked, doc 02 fires no-response branch. **Never** silently delete a fused mission (the whole point is consequence). Keep the expired email visible (greyed) under `showExpired` so the player can read what they missed.
2. **Reply after time-travel rewind** → doc 11 rewinds `GameTime.totalHours`. Because `expiresAtTotalHours` is absolute game-time and the email's `templateId`/`firedAtGameMinute` seed is frozen (doc 02 RULING-E), a rewound-then-replayed email re-presents *identically* (no reshuffle exploit). On rewind, any email with `receivedTotalHours > now` is removed from the inbox (it hasn't "happened" yet); it re-arrives deterministically.
3. **Double-reply / race** → first SEND sets `answered=true` + `chosenReplyId` atomically; subsequent reply attempts no-op (UI disables options on `answered`).
4. **`forkRef` email but doc 110 fork already resolved/expired** → render read-only with the resolved outcome banner; do not offer reply (fail-soft, no crash).
5. **Cloning=0 country + death email** → a `timewalker`/memorial email must NOT offer a clone reply branch (Bible: cloning country-gated; doc 02 §RULING already strips it). Doc 10 trusts the producer's option list verbatim — it never *adds* options, so this can't regress here.
6. **News for a country with no matching `NEWS_SOURCE`** → fall back to global sources (`regions == []`, e.g. World News Network) so every event still produces ≥1 article (`pickRandomSource` already handles empty-region globals).
7. **Censored article with no surviving outlet** → §3.6 guarantees POI + `independent`/`tabloid` are never suppressed, so a censored story always survives *somewhere* (the player can still learn the truth from Underground Wire — on-theme: authoritarian states leak). If even those are filtered, `RULING:` force one `independent` article (the leak) regardless.
8. **QA fail after N=2 regens** → ship the highest-scoring variant + log (`qaScore` recorded); never block the feed (a missing article = the world went silent, which breaks the fantasy worse than a slightly-flat article).
9. **Inbox flood** (many simultaneous fuses) → cap visible *priority* flags; coalesce same-`templateId`-same-sector emails via a `groupKey` (one row, a count badge), matching doc 01's stacking. Per-sector template cooldown = **7 game-days** (doc 02 RULING-D) already throttles upstream.
10. **Laptop closed when email arrives** → world clock is running; the email still lands with correct `receivedTotalHours`; doc 01 buzzes per priority. Opening the laptop pauses and the player catches up.
11. **Attachment image missing** → `EmailAttachment.imageUrl` undefined → render the typed placeholder by `aspectRatio` (existing `ATTACHMENT_DIMENSIONS`); never block the email body.
12. **Article references a now-dead/renamed character** → `relatedCharacters` are IDs; resolve to current name or "[redacted]" if purged; never hard-fail on a stale ID.

---

## 6. UI/UX hooks (phone / world-map / laptop / combat overlay)

**Laptop — EMAIL app** (binds to `emails[]` store + `InboxViewState`):
- Left rail: folders/filters (All / Priority / Unread / by category). Priority filter surfaces `sourcePriority ∈ {Critical,High}`.
- List row: `[priority glyph] Subject — Sender_Type · {City} · ⏱ countdown`. Countdown color per §3.3. Expired = strikethrough.
- Reader pane: `from`, body (`Body_Template` filled), attachments (typed thumbnails), then the **reply panel**: one button per `Response_Options` label; selecting + **SEND** = the decision (GDD line 147). After SEND: show `response` confirmation, lock options, set `answered`.
- A `forkRef` email gets a subtle "This decision has consequences" sub-label; reply routes to doc 110.

**Laptop — NEWS app** (`NewsBrowser.tsx`, already WORKING — extend, don't replace):
- Top tabs = the GDD feeds: **Point of Interest** (international/faction moves), **ANN** or **BNN** (national, by home faction), **Local**, plus **Tabloid**/**Independent** toggles. Reliability pip per source `credibility`.
- Article carries a **"Open Investigation"** affordance when `investigationLead` is set (GDD "city of interest"), and a **"Go to Sector"** affordance when `sectorCode` is set (jumps the world map). Bookmark/read state via existing fields.
- Censored stories show a "⚠ Coverage limited in {country}" note on the national feed, with "Read on Underground Wire / Point of Interest →" cross-links (§3.6 / §5.7) — making censorship *legible* gameplay, not a silent gap.

**World map** (doc 04): an `email:expired`→`world_event` drops a `crisis_ping` on `sectorId` (doc 01 owns placement); a news article with `sectorCode` is the "city of interest" pin. Doc 10 supplies the `sectorId`/`sectorCode`; doc 01/04 render the ping.

**Phone** (doc 01): doc 10 creates the email/article record + emits the buzz request (`priority_email`/`world_event` notification). The phone's inbox tab mirrors a read-only list of Priority emails so the player can triage without opening the laptop (doc 01 §1). Doc 10 owns content; doc 01 owns the buzz.

**Combat overlay:** none direct. `RULING:` no email/news interrupts a tactical turn (`doNotDisturbInCombat`, doc 01 §2.4); arrivals queue and surface on return to the laptop/map. Post-combat, `combat:ended` triggers the after-action **email** (`generateAfterActionReport`, already exists) + the news render (§3.5) — both appear when the player next opens the laptop.

---

## 7. Integration points (systems it reads / writes)

**Reads (subscribes / consumes):**
- **Event & Emergence Engine (doc 02)** — `event:fired`, `worldEvent:fired`, `encounter:spawned`, `email:` payloads (the `EmailEventTemplate`-filled envelope), the frozen `EventSpineContext`. **The producer.** Doc 10 renders what it hands over.
- **Fork-in-the-Road (doc 110)** — `fork:fired`/`fork:resolved`/`fork:expired`; email-bodied forks render in the inbox; reply → `doc110.resolveFork`.
- **Combat results** (`combatResultsHandler.ts`, `combat:ended`) — after-action email + `Result_Templates` news render; casualties/property feed `Public_Perception` consequence copy.
- **Reputation (`reputationSystem.ts`, `reputation:changed`)** — milestone news (existing `newsGenerator` subscription); `reputationEffects` echoed in articles.
- **Faction (`factionSystem.ts`)** — standing changes → `faction_relations` email (`generateFactionReactionEmail`, exists); faction relation drives news bias (§3.6).
- **Investigations (doc 09)** — supplies `investigationLead` ids and the `Email_Investigation_Templates` alert envelopes.
- **Time (`timeEngine.ts`/`timeSystem.ts`, `time:day-passed`)** — fuse/expiry ticks; weekly `payday` admin email; `publishedDay/Hour` stamps.
- **World Bible spine** (`allCountries`/`allCities`, Bible ruling #10) — via the frozen `EmailSpineRef` (never re-queried at render).

**Writes (emits / persists):**
- `emails[]` + read/star/archive/answered state → `enhancedGameStore` (existing `addEmail`/`updateEmail`/`deleteEmail`).
- `NewsState` articles → `newsSystem`/store (existing `createNewsArticle`).
- `eventBus.emit('email:expired' | 'email:lapsed' | 'email:answered', {...})` — **new** event types to add to `eventBus.ts` so doc 02 can fire no-response branches and telemetry can score response rates.
- **Notification requests** to doc 01 (`priority_email`, `world_event`, `payday`) — content only; doc 01 owns the buzz.
- **Dial-out / "Open Investigation" / "Go to Sector"** intents — handed to docs 01/09/04 respectively (doc 10 renders the affordance, the target system fulfills).

**New `GameEventType` values to add (`eventBus.ts`):** `'email:answered' | 'email:expired' | 'email:lapsed' | 'news:published'`.

---

## 8. RULING: notes (where the data was silent)

- **RULING-A — Priority is two facets of one value.** `Email_Investigation_Templates.Priority_Level` (4 levels) is the *flag* (GDD line 504); `Time_Management` rows 42–45 are the *fuse*. Store both; derive buzz/window from the verbatim 4-level value; map to the legacy 3-level `Email.priority` only for back-compat. (§3.1)
- **RULING-B — Deadlines in game-time, display in real-time.** Fuse stored as absolute `expiresAtGameHours` (rewind-safe); only the on-screen countdown converts via 1:30. Source states windows in real time but the engine clock is game-time. (§3.1)
- **RULING-C — Yes/No Auto_Expire split = catastrophe vs lost-opportunity.** `Auto_Expire=Yes` lapse fires a bad world-event (`email:expired`); `=No` lapse only closes the mission window (`email:lapsed`). Matches the CSV's own pattern (terror/disaster=Yes; cultural/archaeology=No). (§3.2)
- **RULING-D — `ann` = US feed, `bnn` = generic per-nation national feed.** GDD names ANN as American; BNN as "national news program" with no nation, so it's templated per country. (§3.4)
- **RULING-E — Censorship threshold `MediaFreedom < 40`.** Below the source's free-press exemplars; suppresses hostile-to-aligned-player articles on that nation's feed only (POI/foreign/indie always survive). (§3.6)
- **RULING-F — Planting count `1 + floor((Corruption+Cyber)/100)`, cap 2.** Consumes the Bible §8 Media formula (`MediaFreedom+Corruption+Cyber`) without flooding feeds; source gives the formula's inputs but no article count. (§3.6)
- **RULING-G — QA is a presence-check dev assertion, not a runtime judge.** With deterministic template substitution, a correctly-spine-filled template scores ~100 by construction; QA fails loud in dev, logs in prod. Regen cap N=2. (§3.7)
- **RULING-H — One reply path.** `forkRef` emails resolve through `doc110.resolveFork`; inline `effect` only for legacy/simple admin mail. No double-applied reputation (Bible ruling #9). (§2.2)
- **RULING-I — Variety via rolling hash of last 20 per eventType**, forcing a different `HeadlineSet` entry on collision (`Narrative_Variety_Tracking` says `<10%` similarity but gives no algorithm). (§3.7)
- **RULING-J — Inbox countdown color thresholds** (>0.5 normal / 0.25–0.5 amber / <0.25 red / expired grey) are presentational; no source number is overridden. (§3.3)

## 9. OWNER-FORK: notes (product choices only the owner can make)

- **OWNER-FORK-A — Runtime LLM vs pure template substitution for prose.** `Result_Templates.AI_Prompt_Template` and `Narrative_Quality_Assessment` imply a generative model (the "AI" columns, the 85% judge, "1000+ generations per test cycle"). **Shipping recommendation: deterministic template-string substitution** (offline, free, determinism-on-rewind, MP-safe, content-safe). Wiring a runtime LLM (e.g. the Mac-mini Ollama box) for novel email/news prose is a real product call with cost, latency, rewind-determinism, and safety implications. Default OFF; expose a toggle. (Shared with doc 02 OWNER-FORK-A — they must agree.)
- **OWNER-FORK-B — Censorship visibility.** Do we *show* the player "⚠ Coverage limited in {country}" (censorship as legible gameplay, my recommendation), or silently omit (more immersive, but the player can't tell propaganda from truth)? This is a core "is the fog honest?" feel decision. Echoes DECISIONS-NEEDED E2 (Heat/Pressure visibility).
- **OWNER-FORK-C — First-boot tutorial email.** Is the opening email a forced tutorial mission, an optional-skip scripted intro, or absent? (DECISIONS-NEEDED O4 recommends optional-skip.) Doc 10 renders whichever; the owner picks.
- **OWNER-FORK-D — Queued/delayed replies.** Can the player queue "send my reply in 3 days," or immediate-only? (DECISIONS-NEEDED K5 recommends *allow queue* — fits email-as-dialogue + real-time-with-pause.) Affects the reply panel UX and the answered-state timing.
- **OWNER-FORK-E — How many bias-variant articles per event.** Render *every* eligible outlet's take (rich, but a busy feed) vs the top 2–3 by relevance/credibility (cleaner). A feel + readability call.
- **OWNER-FORK-F — Which of the 25 `Email_Investigation_Templates` envelopes ship in v1.** Several (`EMAIL_008` Time Distortion, `EMAIL_025` Reality Breach) presuppose late-game systems (time travel, dimensional). Owner picks the v1 subset + gating order (shared with doc 02 OWNER-FORK-D).

## 10. Open questions

1. **`email:expired` no-response branch ownership.** Doc 10 emits `email:expired`; doc 02 must have a *registered no-response outcome* per `Email_Investigation_Templates` row. Confirm doc 02 authors a no-response branch for all 25 envelopes (otherwise an ignored email silently does nothing — breaking the GDD "mushroom cloud" promise). Recommend: doc 02 `EmailEventTemplate` gains a `noResponseOutcome` field.
2. **National-feed identity for non-US home factions.** GDD names ANN (US) and BNN (generic). India/Establishment-24, China/Collective, Nigeria/Adaptive home factions — does each get a *named* national feed (e.g. India's national network), or all share the BNN template? Owner/content call; affects `NewsChannel` enum and source seeding.
3. **Government-type → authoritarian/democratic classification list.** §3.6 needs a definitive mapping of `Country.csv GovernmentStructureType` strings to authoritarian-class vs democratic-class. `Narrative_Quality_Assessment` row 10 names "Authoritarian / Democratic / Constitutional monarchies" but the World Bible uses specific strings ("Federal Republic", "Single-Party State", …). This classification table must be a single source of truth shared with doc 02's `biasMix` — recommend a `government_media_control.csv` lookup (re-balanceable, Bible pillar 1).
4. **Attachment image pipeline.** `EmailAttachment.imageUrl` implies generated surveillance/dossier images (`ATTACHMENT_DIMENSIONS` already typed). Are these pre-authored assets, runtime-generated (Ad Lab / Directors Palette), or always placeholder in v1? Affects build scope but not the data model.
5. **Reply-response-rate telemetry.** Should `email:answered`/`email:expired` feed the AI Director (doc 104) so a player who ignores email gets *more* urgent escalation (or less)? On-theme ("the world reaches out harder when you go quiet") but a difficulty-design call.
6. **POI lead-time.** Does `point_of_interest` post a faction-move warning a fixed N game-days before escalation, or spine-driven by the *player's* `IntelligenceBudget` (high-intel = longer warning)? Mirrors doc 02 open-q #5; must agree (single source of truth for the lead-time constant).
