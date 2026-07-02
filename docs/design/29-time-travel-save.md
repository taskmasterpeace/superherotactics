# 29 — Time-Travel Save (Diegetic-Only; Per-Nation Travelers; Rewind Economy; Dimension = MP Stub)

> **System owner doc.** The build-ready spec for SHT's signature meta-mechanic: **saving the game IS time travel.** There is no normal save/load. Each nation has its own **Time Walker** (the player's is **Sandra Locke**) who can **rewind the timeline (load)** at a sanity cost, or **jump to the future (win-against-odds)** at the cost of temporarily losing time travel. This doc OWNS the **sanity pool, the per-jump decrements, `MADNESS_FLOOR`, the `timeWalkerAbsent` flag, the snapshot format, the checkpoint economy, and the `spendSanity()` API** that two sibling docs (#107 MP-stub, #111 alien-invasion endgame) already call into.
>
> **Status:** design-complete, unbuilt. There is **no persistence at all** in the codebase today — a browser refresh wipes the game (GDD §8 "Reality"). Building this delivers ordinary save/load *as a byproduct*, wrapped in fiction.
>
> **Tier:** 5 Meta. **Depended on by:** #107 (MP-dimension stub), #111 (alien-invasion endgame future-jump). **Reads:** #06 (time/day clock), #16 (economy), #17 (fame/perception), #13 (factions), the crime sim, and every system whose state must round-trip through a snapshot.
>
> **Primary sources (open these first):**
> - `SHT_MECHANICS_BIBLE.md` §11 (Time & the Time-Travel Save — the locked design), §0/§1 pillar 6, §13 (rulings), §14 (`Time_Management` owns time).
> - `SuperHero Tactics/FIST GDD v02.txt` lines **19, 123–132, 351–402, 497, 618** (the canonical narrative: rewind after a loss, "Day 2 or Day 24", "fewer destinations each jump", "drives the time walker toward madness", "complete real tasks to realign the time path and regain sanity", future-jump = lose the traveler "days or weeks", returns *changed* — cyborg arm, "don't trust the man who throws the hammers", duplicate teammate).
> - `docs/csv-source-data/Time_Management.csv` (time ratios 1:30/1:45/1:15/1:60; `Status_*` character states; the 2,472-day / 82.4-real-day countdown).
> - `docs/csv-source-data/Game_Mechanics_Spec/Travel_Time_System.csv` → `Time_Travel,Special,Variable,Any time/place,Time Travel power,Can arrive before departure` (the diegetic verb).
> - `docs/csv-source-data/Public_Perception.csv` → `Time_Travel_Success` (`+40 Reality Reputation`, temporal governance) and `Mass_Destruction` (`-100 Global`) — the only reputation rows the data ties to time travel.
> - `docs/design/111-alien-invasion-endgame.md` §5 (the future-jump CONSUMER; it explicitly delegates `MADNESS_FLOOR`, `sanity`, and `timeWalkerAbsent` to THIS doc).
> - `docs/design/107-multiplayer-dimension-stub.md` §2.5/§3.3/§5 (the MP CONSUMER; it calls `timeWalker.spendSanity('time_chain')`, stores `TimeChainRun` + `DimensionOwnershipRegistry` in THIS doc's snapshot, and reads the Walker-availability flag).
> - `GAME_DESIGN_DOCUMENT.md` §8 (Save = Diegetic Time Travel; checkpoints; `db/database.ts` localStorage + `lib/supabase.ts` dormant scaffolding), §7.2 (tactical time-powers ≠ strategic save), §14 Q3/Q4 (granularity + MP-migration open questions).
> - Existing code: `MVP/src/data/timeSystem.ts` (`GameTime{ day, hour }`, 1-indexed day counter — the clock this doc snapshots), `MVP/src/data/timeEngine.ts` (`daysElapsed`), `MVP/src/stores/enhancedGameStore.ts` (the Zustand state that becomes the snapshot), `MVP/src/data/doomClockSystem.ts` (the crime/countdown clock — must round-trip, must NOT be confused with the save clock).
>
> **No invented numbers.** Every value below traces to a named source row, or is a **RULING:** consistent with the Bible, or an **OWNER-FORK:** product call. The Bible deliberately leaves the rewind economy's exact numbers open ("Greenfield — design now, build later", §11); where I set one I cite the verbal source it discretizes and label it.

---

## 1. Overview & Player Fantasy

There is **no save menu** in SuperHero Tactics. Instead, your nation has a **Time Walker** — for the US/FIST player, **Sandra Locke** — and "loading a save" is literally *sending her back along the timeline.* (Bible §11; FIST GDD 386–388; Pillar 6: "Time travel as narrative save.")

The fantasy has three beats, all locked by the Bible/GDD:

1. **The rewind (load).** You took a devastating loss on Day 25. You open the **Chronos terminal** and Sandra walks back the timeline — but *where to?* Day 24, or all the way to Day 2? (FIST GDD 126 verbatim.) **Each jump costs her sanity and removes destinations** — the checkpoints you can still reach get fewer every time. Rewinding is a *decision with a price*, not a free undo (GDD §8 "make rewinding a decision").

2. **Realigning the timeline (recover).** Sanity is not a one-way drain. "The player can complete **real tasks to realign the time path and regain her sanity**" (FIST GDD 127). Stabilizing the present — surviving stretches without rewinding, completing temporal-anomaly missions — **buys destinations back** and pushes the madness floor away.

3. **The future-jump (win against impossible odds).** At the campaign's end you can send Sandra to the **future**: "your enemies are instantly vanquished, she has changed your future" (FIST GDD 131). The cost: you **temporarily lose time travel** (no rewinds while she's gone) and **she returns changed** — cyborg arm, cryptic warnings, sometimes a *duplicate of a teammate you now can't fully trust* (FIST GDD 132). This is owned for *gating* by #111 but the **sanity/absence machinery lives here.**

**The diegetic-only constraint (locked):** every nation has its *own* traveler — that's the only save/load. There is no out-of-fiction "Save Game" button. In single-player you operate **one** traveler (Sandra); the per-nation registry is the seam that lets #107 turn "another nation's traveler" into another player later. **The traveler's other dimension is where multiplayer lives** (Bible §11; #107) — but this doc builds only the single-player save and the data shape that MP slots into.

**Why this is on-vision:** the save system is delivered through the **laptop (Chronos terminal), the phone (Sandra's pings — "Day 25 again? You sure?"), and the world-map (the timeline ribbon)**. Combat adds **nothing** here (per "spec combat lighter"). The world keeps its own clock; the save is a story object, not a menu.

### 1.1 The rewind economy in one paragraph (the tension target)
Rewinding must be **tense, not a brick wall.** You start with a comfortable number of checkpoints and full sanity. Each rewind **spends sanity** (toward `MADNESS_FLOOR`) and **prunes destinations** (older checkpoints fall off the reachable list first — "fewer destinations"). You can **buy both back** by playing forward and completing **realignment tasks**. If sanity ever hits the floor, the Walker is **mad**: rewinds are locked until you realign, and any future-jump attempted at the floor risks the `LOSS_timewalker_mad` terminal state (#111). The knobs (start sanity, per-jump cost, realignment gains, floor) are all in one tunables table (§3.1) so the owner can dial "tense" without touching code.

---

## 2. Data Schema (fields / types)

All state below lives under `enhancedGameStore` and is itself part of the snapshot it manages (the save system saves its own meta-state, except the live snapshot list which is stored out-of-band — see §3.6 / edge case E12).

```ts
// ───────────────────────── 2.1 The snapshot (one "save") ─────────────────────────
interface TimelineSnapshot {
  snapshotId: string;            // uuid (seeded; see RULING-K)
  schemaVersion: 2;              // bump on shape change; loader migrates older (E11). v2 to match #107 mirror.
  gameDay: number;               // timeSystem.GameTime.day at capture (1-indexed)
  gameHour: number;              // GameTime.hour (0-23)
  realCapturedAt: string;        // ISO real-world timestamp (sorting/UI only, NOT gameplay)
  label: string;                 // diegetic, auto-generated: "Before the Lagos extraction" (§6)
  cause: SnapshotCause;          // why it was captured (drives auto-label + pin policy)
  reachable: boolean;            // false once pruned past the destination horizon (§3.3)
  pinned: boolean;               // player-pinned checkpoints never auto-prune (E7)
  integrityHash: string;         // hash of `state` for tamper/corruption detection (E10)
  state: GameStateBlob;          // the full serialized game state (§2.2)
}

type SnapshotCause =
  | 'auto_daily'        // one per game-day rollover (Time_Management Base_Time_Flow)
  | 'auto_mission'      // before a tactical-combat entry (the JA2 "before the fight" pin)
  | 'auto_fork'         // before a Fork-in-the-Road choice (#110)
  | 'manual'            // player opened Chronos and chose "anchor this moment"
  | 'system';           // engine checkpoint (new-game seed, version migration)

// ───────────────────────── 2.2 What's IN the snapshot ─────────────────────────
// The snapshot is the FULL game state. Authoritative list = "everything enhancedGameStore owns
// that is not derived". Enumerated so a coder knows exactly what to (de)serialize.
interface GameStateBlob {
  rngStreams: Record<string, RngState>;   // ALL seeded RNG streams (combat/world/timeChain). CRITICAL: see RULING-E.
  time: { day: number; hour: number; speed: GameSpeed; paused: boolean };
  doomClock: DoomClockState;               // doomClockSystem.ts (2,472-day countdown + crime clock)
  economy: EconomyState;                   // #16 (money, payday cursor, wages)
  roster: CharacterState[];                // #07 full sheets (stats, injuries, addictions, power-slot-used)
  squads: SquadState[];                    // positions, assignments, status
  factions: FactionStandings;              // #13 country×faction relations + faction reputation
  fame: PerceptionState;                   // #17 global fame + per-country opinion + legal/bounty
  world: WorldState;                       // crime sim orgs, political events, world-state tracker
  missions: MissionState;                  // active/available/completed missions, email inbox
  investigations: InvestigationState;      // #09 in-flight investigations
  bases: BaseState;                        // #19 facilities
  dimension: DimensionOwnershipRegistry;   // #107 — owned here in the snapshot (RULING-L)
  timeChainRuns: TimeChainRun[];           // #107 — in-flight Time-Chain runs (RULING-L)
  timeWalker: TimeWalkerState;             // 2.3 — the save system's OWN meta-state (also snapshotted, with one caveat: E5)
}

// ───────────────────────── 2.3 The Time Walker (the rewind economy state) ─────────────────────────
interface TimeWalkerState {
  travelerId: string;            // "sandra_locke" for the US player; per-nation in MP (#107)
  nationIso: string;             // which nation's traveler this is (diegetic-only constraint)
  sanity: number;                // 0..SANITY_MAX. The madness meter. (FIST GDD 126/127)
  sanityMax: number;             // = SANITY_MAX tunable (§3.1)
  jumpsTaken: number;            // lifetime past-rewinds (drives destination pruning, §3.3)
  destinationHorizon: number;    // how many reachable checkpoints remain (§3.3). Shrinks per jump.
  absent: boolean;               // the SHARED `timeWalkerAbsent` flag (#111 §5, #107 §5). True during a future-jump lockout.
  absentUntilDay: number | null; // game-day she returns (null when present). (FIST GDD 388 "days or weeks")
  pendingReturnTwist: ReturnTwist | null; // queued "she comes back changed" payload (FIST GDD 132)
  realignmentProgress: number;   // 0..1 toward the next sanity/destination refund (§3.4)
  state: 'present' | 'rewinding' | 'future_absent' | 'mad'; // FSM; 'mad' = sanity <= MADNESS_FLOOR
}

type ReturnTwist =
  | { kind: 'warning'; aboutCharacterId: string }       // "don't trust the man who throws the hammers"
  | { kind: 'cyborg'; cosmetic: 'arm' | 'eyepatch' }     // returns physically changed
  | { kind: 'duplicate'; sourceCharacterId: string }     // a future cyborg duplicate of a teammate
  | { kind: 'lead'; investigationId: string }            // returns with an investigation lead
  | { kind: 'none' };

// ───────────────────────── 2.4 Result types ─────────────────────────
type RewindResult =
  | { ok: true; landedDay: number; sanityAfter: number; destinationsAfter: number }
  | { ok: false; reason: 'walker_absent' | 'walker_mad' | 'unreachable_destination'
                        | 'no_snapshot' | 'corrupt_snapshot' };

type SpendSanityKind = 'past_rewind' | 'future_jump' | 'time_chain'; // #107 calls 'time_chain'
type SpendSanityResult = { ok: true; sanityAfter: number; nowMad: boolean }
                       | { ok: false; reason: 'walker_absent' };
```

---

## 3. Exact Numbers, Tables & Formulas (each cited)

### 3.1 The rewind-economy tunables (ONE table; owner dials "tense") — `RULING` over the Bible's open economy
The Bible explicitly leaves these open ("design now", §11) but pins the *shape*: limited rewinds, sanity cost, fewer destinations each use, recoverable by tasks. I discretize that verbal spec into one tunables table. **Every value is a labeled RULING** discretizing a cited verbal source; none is free-floating.

| Tunable | Value | Source / rationale |
|---|---|---|
| `SANITY_MAX` | **100** | RULING-1. Matches the engine's universal 0–100 scale used everywhere in the data (`Public_Perception` reputation, `Player_Scaling` readiness, country stats are all 0–100). One scale (Bible §3.2 "one scale to rule them all"). |
| `SANITY_START` | **100** | RULING-1. Begin at full; the meter only matters once you rewind. |
| `MADNESS_FLOOR` | **20** /100 | RULING-2. Owned here; **#111 §5 reads this**. Floor > 0 so "mad" is reachable *before* zero — madness is a near-death state, not literal empty (FIST GDD 126 "closer to madness"). 20 = 4 unrecovered past-rewinds at the base cost below. |
| `SANITY_COST_PAST_REWIND` | **20** per rewind | RULING-3. From `MADNESS_FLOOR=20` + "limited rewinds": with full 100 and no realignment, **4 free rewinds** before madness (100→80→60→40→20=mad). Tense, not a brick wall (locked design). **#107 §3.3 binds its `time_chain` cost to THIS value** (one rewind's worth). |
| `SANITY_COST_FUTURE_JUMP` | **40** | RULING-4. A future-jump is the heavier act (FIST GDD 131 "lose the ability to time travel"). 2× a past-rewind. If `sanity - 40 <= MADNESS_FLOOR` at jump time, #111 may resolve `LOSS_timewalker_mad` (that branch is owned by #111; the threshold math is here). |
| `SANITY_COST_TIME_CHAIN` | **= SANITY_COST_PAST_REWIND (20)** | RULING-5. Honors #107 §3.3 ("one past-rewind's cost") — single source of truth, defined here, read there. |
| `DESTINATION_START` | **8** | RULING-6 / OWNER-FORK-1. Starting reachable checkpoints. 8 ≈ one comfortable JA2-style buffer (a day's worth of auto-dailies + manual pins). Discretizes "Day 2 or Day 24" (FIST GDD 126: multiple but finite destinations). |
| `DESTINATION_LOSS_PER_JUMP` | **1** | RULING-7. "fewer destinations each use" (Bible §11; FIST GDD 126) → horizon −1 per past-rewind, floored at `DESTINATION_FLOOR`. |
| `DESTINATION_FLOOR` | **1** | RULING-8. You can ALWAYS reach at least the most-recent reachable checkpoint (never a hard wall — locked: "tense, not a brick wall"). |
| `REALIGN_DAYS_PER_REFUND` | **30** game-days clean | RULING-9. "complete real tasks to realign… regain sanity" (FIST GDD 127). 30 game-days = 1 real day (Time_Management Base_Time_Flow 1:30) of *not rewinding* → +1 refund tick. |
| `REALIGN_SANITY_PER_REFUND` | **+10** | RULING-10. Half a rewind's cost refunded per tick → realigning is slower than spending (so save-scumming still has net cost), but always possible. |
| `REALIGN_DESTINATION_PER_REFUND` | **+1** (cap `DESTINATION_START`) | RULING-11. Refunds a destination per tick; can't exceed the start cap. |
| `REALIGN_TASK_BONUS` | **+20 sanity, +2 destinations** | RULING-12. A completed *temporal-anomaly mission* (a realignment task authored via the #02 event engine) grants a larger one-shot refund — the active way to recover vs. the passive day-tick. |
| `FUTURE_JUMP_ABSENCE_DAYS` | **`seededRandInt(7, 21)`** game-days | RULING-13. "days or weeks" (FIST GDD 354/388). 7=one week, 21=three weeks. Seeded (RULING-E) so a rewind reproduces it. **#107 §3.3 RULING-E uses the identical window for Time-Chain duration** — same fiction, same window. |

> **OWNER-FORK-1 (the only true product call in this table):** `DESTINATION_START` and the spend/refund *ratio* are the difficulty dial. 8 destinations + (spend 20 / refund 10) = "save-scumming costs you, but you recover" — a *moderate* tension. The owner may want it harsher (fewer starts, higher cost, lower refund) on harder difficulties; the #104 AI-director can scale these per its difficulty band. All other values are forced by the floor/cost arithmetic above and the cited verbal sources.

### 3.2 Reputation consequences of time travel — `Public_Perception.csv` (REAL rows)
Two rows in `Public_Perception.csv` are the only data tying reputation to time travel; consume them directly:

| Event | Reputation delta | Other effects (verbatim columns) |
|---|---|---|
| `Time_Travel_Success` (a successful future-jump win) | **+40 Reality Reputation** | "Temporal physics funding; Temporal law establishment; Reality insurance impossible; Temporal governance required; Reality manipulation privileges; timeline authority" |
| `Mass_Destruction` (the loss state a desperate rewind is fleeing) | **−100 Global Reputation** | "$1B–$1T+ damages; Global insurance industry collapse; UN emergency session; LSW abilities globally regulated or banned" |

- **RULING-14:** a successful **future-jump** applies the `Time_Travel_Success` row to #17 fame: **+40 global/"Reality" reputation** and flags "timeline authority" (consumed by #111 as part of `WIN_future_jump`). A **past-rewind applies NO reputation delta** (it un-happened — the world doesn't remember it; only Sandra does). This is the cleanest reading of "she has changed your future" (a visible, rewarded act) vs. a rewind (a private, costly one).

### 3.3 Destination horizon (which checkpoints you can still reach)
```
reachableCount = clamp(DESTINATION_START - (jumpsTaken * DESTINATION_LOSS_PER_JUMP)
                        + destinationRefunds, DESTINATION_FLOOR, DESTINATION_START)
```
- A snapshot's `reachable` is true iff it is among the **`reachableCount` most-recent non-pruned, non-future-relative checkpoints** (newest first), **plus all `pinned` snapshots** (pins are always reachable — E7).
- "Fewer destinations each use" = after each past-rewind, `jumpsTaken += 1` → the *oldest* currently-reachable unpinned checkpoint flips `reachable=false` (the timeline "forgets" how to reach that far back). This is the discretization of FIST GDD 126 ("Day 2 or Day 24… fewer destinations").
- You can never lose your way back to the **single most recent** reachable checkpoint (`DESTINATION_FLOOR=1`).

### 3.4 Realignment (regaining sanity & destinations) — FIST GDD 127
Two paths, both feed `realignmentProgress` (0..1):
1. **Passive (play forward without rewinding).** Every `REALIGN_DAYS_PER_REFUND` (30) consecutive game-days with **zero past-rewinds**, fire a refund: `sanity += REALIGN_SANITY_PER_REFUND (+10)` (cap `SANITY_MAX`), `destinationRefunds += REALIGN_DESTINATION_PER_REFUND (+1)` (cap start). Reset the clean-day counter to 0 on any rewind.
2. **Active (realignment task).** Completing a **temporal-anomaly mission** (authored template, #02 event engine; flagged `isRealignmentTask`) grants `REALIGN_TASK_BONUS` (+20 sanity, +2 destinations) immediately. These missions are *generated* when sanity is low (see §4) — the world hands you the recovery hook (Bible Pillar 4 "the world talks to you").
- **Leaving `mad`:** if `state==='mad'` (sanity ≤ floor), rewinds are locked. The first refund that lifts sanity **above** `MADNESS_FLOOR` sets `state='present'` and re-enables rewinds.

### 3.5 The four operations (exact procedures)

**`captureSnapshot(cause)`** (auto or manual):
1. Serialize `GameStateBlob` (§2.2). Compute `integrityHash`.
2. Auto-label from `cause` + world context (§6).
3. Insert into the snapshot list; recompute `reachable` flags (§3.3).
4. Prune: delete unpinned, unreachable snapshots **older than the oldest reachable** beyond a keep-buffer of `DESTINATION_START` (storage cap — E12). Never delete `pinned` or `system`.

**`rewind(snapshotId)`** (load = past time-travel):
1. If `timeWalker.absent` → `{ok:false, 'walker_absent'}` (she's in the future; FIST GDD 131).
2. If `timeWalker.state==='mad'` → `{ok:false, 'walker_mad'}` (realign first — §3.4).
3. Look up snapshot; if missing → `'no_snapshot'`; if `!reachable` → `'unreachable_destination'`; if `integrityHash` mismatch → `'corrupt_snapshot'` (E10).
4. `spendSanity('past_rewind')` → −20 sanity; `jumpsTaken += 1`; recompute horizon (§3.3); reset clean-day counter.
5. **Deserialize `state` into the live store** (full revert — economy, roster, world, crime sim, RNG streams, doom clock). The restored state's own `timeWalker.sanity`/`jumpsTaken` are **overwritten by the post-spend values** (E5: the meter must *remember the rewind happened*, otherwise it resets and save-scumming is free).
6. Set `state='present'`; emit phone ping (§6); return `{ok:true, landedDay, sanityAfter, destinationsAfter}`.

**`futureJump()`** (win-against-odds; *gating* owned by #111 §5, *machinery* here):
1. Precondition (read by #111): `futureJumpAvailable = readiness>=60 && phase>='P4_armada' && !absent` (#111 §5). #111 calls this op only when available.
2. `spendSanity('future_jump')` → −40. Compute `nowMad = (sanityAfter <= MADNESS_FLOOR)`.
3. Set `absent=true`, `absentUntilDay = currentDay + seededRandInt(7,21)` (RULING-13). Roll `pendingReturnTwist` (§3.7).
4. Apply `Time_Travel_Success` reputation (+40, §3.2) → #17.
5. Return control to #111, which resolves `WIN_future_jump` — **unless `nowMad`**, in which case #111 may resolve `LOSS_timewalker_mad` (that branch is #111's; this op only reports `nowMad`).

**`spendSanity(kind)`** (THE shared API #107 & #111 call):
- If `absent` → `{ok:false,'walker_absent'}` (can't spend a traveler who's gone).
- `cost = {past_rewind:20, future_jump:40, time_chain:20}[kind]`.
- `sanity = max(0, sanity - cost)`; `nowMad = sanity <= MADNESS_FLOOR`; if `nowMad` set `state='mad'`.
- Return `{ok:true, sanityAfter, nowMad}`. **This is the single mutation point for sanity** — no other code decrements it (mirrors the Bible's "one pipeline" rulings).

### 3.6 Persistence target (the byproduct save) — GDD §8
- **Storage:** snapshot list persists to the dormant **`db/database.ts` localStorage** layer (single-player); `lib/supabase.ts` is the deferred cloud/MP backend (GDD §8, §14 Q4). The `DimensionLink` (#107) is orthogonal — it publishes *mirrors*, not snapshots.
- **RULING-15 (the live snapshot list is NOT inside a snapshot):** `GameStateBlob` does **not** contain the snapshot *list* (that would recursively nest saves). The list is stored alongside, keyed by campaign id. A rewind restores game state but **keeps the existing snapshot history** (so you can rewind again, and so a rewind doesn't erase the checkpoint you might want next).

### 3.7 The "returns changed" twist roll — FIST GDD 132 (future-jump only)
On `futureJump()`, roll `pendingReturnTwist` from the **seeded world RNG** (RULING-E). Distribution is a **RULING** (the data names the twists but gives no weights — OWNER-FORK-2):

| Twist | Weight | Source line |
|---|---|---|
| `warning` (betrayal warning) | 30 | FIST 389 / 132 ("not to trust the man who throws the hammers") |
| `lead` (investigation lead + does NOT grant a power — see RULING-16) | 25 | FIST 390 ("a lead on an investigation") |
| `cyborg` (cosmetic arm/eyepatch) | 20 | FIST 132/390 |
| `duplicate` (cyborg duplicate of a teammate) | 15 | FIST 132 ("two versions of the same character… can he be trusted?") |
| `none` | 10 | she just comes back |

- **RULING-16:** FIST 390 says she *could* "return with an additional power," but Bible §13 ruling #8 ("one extra power… via the Time Chain") makes the **Time Chain (#107)** the canonical +1-power path. To avoid two power sources, the future-jump twist grants a **lead/warning/cosmetic/duplicate**, *not* a power. The `duplicate` creates a **new roster character** (a future cyborg copy) — a *body*, not a stat-up — which is consistent with no-XP (Bible §13 #8) and gives the writers FIST 132 verbatim.

---

## 4. How It Consumes the SPINE (country / city / personality → the save)

The save system is mostly *meta*, but it consumes the spine in three real ways:

1. **WHERE you can recover sanity (country stat → realignment-task availability).** Temporal-anomaly realignment missions (§3.4) are **generated by the #02 event engine**, which selects/parameterizes templates by country stats. **RULING-17:** these missions weight toward countries with high **Science + Education** (Bible §6.1 "Innovation Hub", the temporal-physics theme) and high **LSWActivity** (where reality is already bending). Formula (reuses the combined-effects pattern, Bible §8):
   ```
   realignmentSiteScore(country) = 0.4*Science + 0.3*Education + 0.3*LSWActivity   // 0..100, World Bible Country.csv columns
   ```
   High-score countries are where the world *offers* you a way to fix the timeline — the spine decides where the help is.

2. **WHO the traveler is (faction → travelerId, the per-nation constraint).** Diegetic-only means each nation's traveler is its own save. `travelerId`/`nationIso` are seeded from the player's faction at faction-select (#13): US→`sandra_locke`. **RULING-18:** the other three factions' travelers are **named by the writers (story content #30)**; mechanically they are identical `TimeWalkerState` instances. This is exactly the seam #107 widens for MP (another nation's traveler = another player).

3. **Personality → Sandra's voice (the pings).** Sandra's phone messages (§6) are voiced by her personality type (#03 reducer, read-only — same contract #107 §5 #5 uses). A high-anxiety Walker near the floor sends frantic pings; a stoic one sends terse ones. The **20-personality target-selection table is NOT consumed** (no combat here), but the personality→idle-voice extension (Bible §5.10 "texting concerns / hiding an addiction") drives the ping tone.

**The reverse coupling — sanity feeds the spine:** when `sanity` drops below a **warning band (RULING-19: ≤ `MADNESS_FLOOR + 20` = 40)**, the #02 engine raises the spawn weight of `realignmentSiteScore`-high missions, and the #104 AI-director is told "the player is leaning on rewinds" (a difficulty signal). The save economy thus **talks back** to the living world (Bible Pillar 4).

---

## 5. Edge Cases & Failure Modes

- **E1 — Rewind while the Walker is on a future-jump.** `rewind()` → `{ok:false,'walker_absent'}`. The future-jump *removed* time-travel by design (FIST GDD 131). The Chronos terminal greys out with "Sandra is in the future — return ETA Day N."
- **E2 — Rewind while `mad` (sanity ≤ floor).** `{ok:false,'walker_mad'}`. UI directs the player to a **realignment task** (the only way out, §3.4). This is the tense-not-brick-wall state: blocked *now*, recoverable.
- **E3 — Rewind to an unreachable (pruned) checkpoint.** `{ok:false,'unreachable_destination'}`. The destination horizon (§3.3) already hid it in the UI; this is the defensive check if something calls the op directly. ("Day 2 is no longer in reach.")
- **E4 — Rewinding INTO a future-relative event.** You can only rewind to a snapshot with `gameDay <= currentDay`. Snapshots are append-only-by-day; a snapshot never has a future day. Guard: assert `snapshot.gameDay <= currentDay` in `rewind()`.
- **E5 — The sanity meter must survive the rewind it pays for.** A naïve "restore full state" would reset `timeWalker.sanity` to the snapshot's older (higher) value — making save-scumming *free*. **Fix (§3.5 step 5):** after deserializing, **overwrite** `timeWalker.sanity`, `jumpsTaken`, `destinationRefunds`, `realignmentProgress` with the **post-spend live values**. The Walker *remembers* every rewind even though the world doesn't. (This is the single most important correctness rule in the doc.)
- **E6 — Browser refresh / cold start.** Snapshots are in localStorage (§3.6); on load, the most-recent reachable `auto_daily`/`system` snapshot is restored = ordinary "continue game." If localStorage is empty → new-game flow (#100). If corrupt → E10.
- **E7 — Player pins a checkpoint they don't want pruned.** `pinned=true` exempts it from horizon-pruning AND keeps it `reachable` forever. Cap pins at **OWNER-FORK-3** (default RULING-20: **3 pins**, to keep the rewind economy meaningful — unlimited pins = unlimited destinations = no tension).
- **E8 — Future-jump used, then the player wants to rewind a pre-jump regret.** Blocked (E1) until she returns (`absentUntilDay`). On her return, the pre-jump snapshots are still in history but the **horizon may have shrunk** if jumps were taken; the future-jump itself does NOT consume a *destination* (only sanity), so pre-jump checkpoints survive subject to the normal horizon.
- **E9 — Two systems spend sanity in the same tick** (a Time-Chain return + a rewind). `spendSanity` is the single mutation point (§3.5) and is synchronous; ordering is deterministic (apply in event-queue order). No race because there is no async sanity write.
- **E10 — Corrupt / tampered snapshot.** `integrityHash` mismatch → snapshot marked `corrupt`, excluded from reachable set, `rewind()` returns `'corrupt_snapshot'`. The terminal shows it greyed with a "timeline fracture" label (diegetic for "this save is damaged").
- **E11 — Schema migration (old save, new build).** `schemaVersion` on each snapshot; a registered migration chain upgrades `v1→v2→…` on load. A snapshot too old to migrate is shown read-only ("an unreadable era") and is not reachable. (Mirrors #107 §5 E7 forward-compat.)
- **E12 — Storage bloat.** A 2,472-day campaign with daily auto-snapshots is huge. **RULING-21:** keep at most `DESTINATION_START + pins + last 30 auto_daily` full snapshots; older reachable ones are **demoted to lightweight "delta" stubs** (label + day + hash, no full state) so the timeline ribbon still *shows* them but they aren't rewindable. (This naturally reinforces "fewer destinations.")
- **E13 — Future-jump at exactly the madness threshold.** If `sanity - 40 <= MADNESS_FLOOR`, `spendSanity` reports `nowMad=true`; #111 decides win-vs-`LOSS_timewalker_mad`. This doc guarantees the *report* is correct; the *consequence* is #111's (per its §5 RULING).
- **E14 — Time-Chain run in-flight during a rewind.** The run is in `GameStateBlob.timeChainRuns` (RULING-L), so a rewind restores it; seeded RNG (RULING-E) reproduces its `durationDays`. (Exactly #107 §5 E6 — that doc relies on THIS doc snapshotting the runs.)
- **E15 — Determinism break.** If any system used `Math.random()` instead of a seeded stream, a rewind+replay would diverge (a different combat outcome, a different twist). **RULING-E (hard rule):** all randomness flows through `rngStreams` (snapshotted §2.2); a CI guard greps for `Math.random(` in gameplay code and fails. This is the foundation that makes "rewind reproduces the timeline" true.

---

## 6. UI / UX Hooks (phone / world-map / laptop / combat overlay)

- **Laptop — the Chronos Terminal (the diegetic save screen).** A timeline **ribbon** of checkpoints, newest→oldest, each a node labeled by context (`auto-label`): "Before the Lagos extraction" (`auto_mission` + current city), "Morning, Day 25" (`auto_daily`), "⚠ Fork: the Kaiser's offer" (`auto_fork`). Reachable nodes are bright; pruned nodes are dimmed/locked with "no longer in reach." A **sanity gauge** (Sandra's portrait degrading as it drops toward `MADNESS_FLOOR`) and a **destinations-remaining** count sit at the top. Opening the laptop **pauses time** (Bible §7; GDD §8). This is the same terminal #107 §6 mounts its "Other Dimension" tab onto.
- **Phone (real-time-with-pause feed) — Sandra's pings.** Personality-voiced (§4.3): on low sanity ("I can feel the threads fraying… don't make me go back again"), on a successful rewind ("We're at Day 24. Let's not waste it."), on realignment progress ("The path feels straighter. Thank you."), on her future-return with the `pendingReturnTwist` ("I'm back. Don't trust the man who throws the hammers."). Pings are the "living world talks to you" surface for this system.
- **World-map — the timeline ribbon mini-widget + the future-absence banner.** A compact destinations/sanity readout; when `absent`, a banner: "Time travel offline — Sandra returns ~Day N." The map is where #111 renders the armada; this widget is where the player feels the rewind budget.
- **New-game / fork interplay (#100, #110).** New Game seeds a `system` snapshot at Day 1. Every Fork-in-the-Road (#110) auto-captures `auto_fork` *before* the choice — so "undo my fork" is a rewind with the standard cost (this is the JA2 "I regret that" hook made diegetic).
- **Combat overlay — NONE.** Per "spec combat lighter," the tactical grid adds nothing here. The only combat touchpoint is the `auto_mission` snapshot captured *before* combat entry (so a lost fight is rewindable — FIST GDD 125 "rewind after a loss"). In-combat *tactical* time-powers are a **different system** (GDD §7.2) and out of scope (RULING-22: tactical rewind ≠ strategic save; never share the sanity pool).

---

## 7. Integration Points (systems it reads / writes)

**Reads:**
- `Time_Management.csv` / `timeSystem.ts` — the `day`/`hour` clock stamped into every snapshot; the 1:30 ratio that converts `REALIGN_DAYS_PER_REFUND` to real-time feel.
- `Public_Perception.csv` (#17) — `Time_Travel_Success` (+40) and `Mass_Destruction` (−100) rows.
- World Bible `Country.csv` (#11 spine) — Science/Education/LSWActivity for `realignmentSiteScore` (§4.1).
- #03 personality reducer (read-only) — Sandra's ping voice; the write-safety contract #107 shares.
- #13 factions — `travelerId`/`nationIso` seed at faction-select.
- #111 readiness — read only to *report* (the future-jump precondition is computed in #111; this doc just exposes `!absent`).
- Every snapshotted system (§2.2) — to serialize their state.

**Writes / emits:**
- → **localStorage (`db/database.ts`)** — the snapshot list (the byproduct save; GDD §8).
- → **#17 fame** — `Time_Travel_Success` reputation on a successful future-jump (§3.2).
- → **Every system in §2.2** — on `rewind()`, the full state is **deserialized back into them** (the revert).
- → **#02 event engine** — raises realignment-mission spawn weight when sanity is low (§4 reverse coupling).
- → **#104 AI-director** — a "player is rewinding heavily" signal (sanity trend).
- → **Phone (#01)** — Sandra's pings.

**The contracts other docs depend on (this doc is the single owner — DO NOT duplicate elsewhere):**
- `spendSanity(kind: 'past_rewind'|'future_jump'|'time_chain')` — called by #107 (`time_chain`) and #111 (`future_jump`). **#107 §3.3 and §5 E5 bind to it.**
- `timeWalker.absent` — the shared `timeWalkerAbsent` flag (#111 §5; #107 §5 E5).
- `MADNESS_FLOOR = 20` — **#111 §5 reads this exact symbol** ("the save spec owns `MADNESS_FLOOR`").
- `SANITY_COST_TIME_CHAIN = SANITY_COST_PAST_REWIND` — **#107 §3.3 RULING-F binds to it.**
- `GameStateBlob.dimension` + `.timeChainRuns` — **#107 §7 "Save snapshot (#29)" stores these here** (RULING-L); restored on rewind so #107 §5 E6/E14 hold.
- `FUTURE_JUMP_ABSENCE_DAYS = seededRandInt(7,21)` — same window #107 §3.3 RULING-E reuses for Time-Chain duration.

---

## 8. RULING: notes (collected — anything the data did not settle)

- **RULING-1** — `SANITY_MAX/START = 100`, on the engine's universal 0–100 scale.
- **RULING-2** — `MADNESS_FLOOR = 20` (owned here; read by #111).
- **RULING-3** — `SANITY_COST_PAST_REWIND = 20` → exactly 4 free rewinds from full before madness.
- **RULING-4** — `SANITY_COST_FUTURE_JUMP = 40` (2× a rewind; the heavier act).
- **RULING-5** — `SANITY_COST_TIME_CHAIN = 20` (= one rewind; honors #107 §3.3).
- **RULING-6/7/8** — Destinations: start **8**, −1 per jump, floor **1** (never a hard wall).
- **RULING-9/10/11/12** — Realignment: +10 sanity & +1 destination per 30 clean game-days; +20 sanity/+2 destinations per realignment task.
- **RULING-13** — Future-jump absence = `seededRandInt(7,21)` game-days ("days or weeks").
- **RULING-14** — Future-jump applies `Time_Travel_Success` (+40); a past-rewind applies **no** reputation delta (the world doesn't remember it).
- **RULING-15** — The snapshot list is stored *outside* `GameStateBlob` (no recursive saves); a rewind keeps history.
- **RULING-16** — The future-return twist grants lead/warning/cosmetic/duplicate, **not** a power (the Time Chain #107 is the canonical +1-power path; Bible §13 #8). A `duplicate` adds a new roster body, not a stat-up.
- **RULING-17** — Realignment-mission site weighting = `0.4*Science + 0.3*Education + 0.3*LSWActivity` (World Bible columns).
- **RULING-18** — Other factions' travelers are named by writers (#30); mechanically identical `TimeWalkerState`.
- **RULING-19** — Sanity "warning band" = ≤ 40 (`MADNESS_FLOOR + 20`); below it, the world raises recovery-mission weight.
- **RULING-20** — Pin cap = 3 (keeps the destination economy meaningful).
- **RULING-21** — Storage cap: keep `DESTINATION_START + pins + last 30 dailies` full; older reachable ones demote to label-only stubs.
- **RULING-22** — Strategic save ≠ tactical in-combat time-powers (GDD §7.2); never share the sanity pool.
- **RULING-E** — ALL randomness flows through snapshotted `rngStreams`; a CI guard bans `Math.random(` in gameplay code (the determinism foundation).
- **RULING-K** — `snapshotId` is generated from the seeded RNG (so a rewind+replay reproduces ids; no `crypto.randomUUID()` in gameplay).
- **RULING-L** — `DimensionOwnershipRegistry` and `TimeChainRun[]` (#107) live inside `GameStateBlob` so they round-trip through rewinds.

---

## 9. OWNER-FORK: notes (genuine product choices only the owner can make)

- **OWNER-FORK-1 — The rewind-economy difficulty dial.** `DESTINATION_START` (default 8) and the spend/refund *ratio* (default cost 20 / refund 10) set how punishing save-scumming is. This is the core "tense, not a brick wall" tuning and is **difficulty/audience-dependent** — a hardcore mode might be 4 destinations, cost 25, refund 5; a story mode might be 12 / 15 / 15. The #104 AI-director can scale it per band, but the *defaults and the allowed range* are an owner call. (All other numbers in §3.1 are forced by the floor arithmetic + cited verbal sources.)
- **OWNER-FORK-2 — The "returns changed" twist weights & catalog.** §3.7 weights (30/25/20/15/10) are a RULING over an unweighted source list. The *tone* — is the future-return mostly a gift (leads/warnings) or mostly a curse (untrustworthy duplicates)? — is a narrative-design call owned with #30 (story). Whether the `duplicate` is a *gameplay* unit or a pure story beat is also owner/writer territory.
- **OWNER-FORK-3 — Pin cap.** Default 3 (RULING-20). More pins = more permanent destinations = a softer economy; this is a difficulty/UX call.
- **OWNER-FORK-4 — Auto-snapshot cadence.** Defaults: one `auto_daily` per day, one `auto_mission` before combat, one `auto_fork` before each Fork. A "checkpoint-only" mode (GDD §14 Q3: "checkpoints only, or free-rewind?") would drop `auto_daily`. The GDD lists this as an open production question — it is genuinely the owner's.
- **OWNER-FORK-5 — Cloud/MP save backend.** `lib/supabase.ts` vs. another backend (GDD §14 Q4). The snapshot *format* is backend-agnostic (localStorage today); which cloud store backs MP is a deferred owner/infra call shared with #107's transport-vendor fork.

---

## 10. Open Questions

1. **Does a past-rewind ever fail *destructively*?** Today a rewind either succeeds or is cleanly blocked (E1–E3). Should an *over-stressed* Walker (sanity just above floor) have a small chance to land on the **wrong day** (FIST GDD's "Day 2 or Day 24" — what if she misses?) — a risk beat — or is rewind always precise? (Current spec: always precise; the risk lives in the *budget*, not the *landing*.)
2. **Is the future-jump strictly one-shot per campaign, or recoverable?** #111 §9 flags this as its OWNER-FORK; mechanically this doc supports repeat jumps (each costs 40 sanity + an absence), so the *limit* is #111's call. Confirm alignment so the two docs don't disagree on "one future-jump only vs. repeatable."
3. **Do the other three nations' travelers act in single-player at all** (e.g., a rival nation rewinds and the world subtly shifts), or are they purely the MP seam (#107)? Current spec: SP operates only the player's traveler; rival travelers are dormant data until MP. Confirm this is the intended SP scope.
4. **Should `Mass_Destruction` (−100) ever auto-suggest a rewind** (a UI nudge: "this is the kind of day Sandra can undo")? It's a strong tutorialization hook but risks encouraging save-scumming. (Current spec: no auto-nudge; the player decides.)
```