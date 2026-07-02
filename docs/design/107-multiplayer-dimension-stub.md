# 107 — Multiplayer-Dimension Architectural Stub

> **System:** Multiplayer-Dimension Architectural Stub (the time-traveler's *other dimension* = where multiplayer lives; SP-shaped seam only)
> **Status:** BUILD-READY SPEC
> **Tier:** 5 Meta (depends on #29 Time-travel save; reads #03 Personality, #18 Progression, #13 Factions)
> **Spine consumed:** country ISO ownership (Faction starting-country lists), Player_Scaling geographic-separation + catch-up rules, faction relationship matrix, Personality/Relationship state (read-only mirror), Travel_Time_System "Time_Travel" mode.
> **Bible anchors:** §10 *("geographic separation… the MMORPG/multiplayer hook, deferred")*; §11 (Time Walker → other dimension); §3 personality spec §5.12 *("MP read-safety: all mutation through one reducer")*; §13 ruling #10 (unify on `allCountries`+`allCities`, ISO-linked).
>
> **Source tables (read these to re-balance — never hardcode numbers in code):**
> - `docs/csv-source-data/Player_Scaling.csv` — the **authoritative** source for the 6 tiers, the **Catch-Up Mechanisms** (`Catch_Up_Mechanism_Mentoring` = +50% XP; `_Resource_Sharing`; `_Information`), and **`Server_Balance_Geographic`** (the geographic-separation rule). Rows: bottom of file.
> - `docs/csv-source-data/Game_Mechanics_Spec/Faction_Specification.csv` — the **4 playable factions** and their `Starting_Countries` lists (the country-ownership seed), plus the faction-relationship matrix.
> - `docs/csv-source-data/Game_Mechanics_Spec/Travel_Time_System.csv` — the `Time_Travel` travel mode ("`Special / Variable / Any time/place`") — the diegetic verb that *enters* the other dimension.
> - `docs/design/03-personality-relationships.md` §5 #12 + §7 — the **single-reducer** MP-read-safety contract this stub must subscribe to.
> - `SuperHero Tactics/FIST GDD v02.txt` lines 402 (**"Time Chain (multiplayer solo character adventures)"**), 125–131 (time-travel-to-past/future), 1488 (Epic Online Services / Steamworks intent).
> - `GAME_DESIGN_DOCUMENT.md` §4.2 / §9 (country-locked MP; **USA reserved as global target**), §8 (diegetic save), §12 (`socket.io-client` present-but-unused; Zustand local state), §14 Q4 (MP-migration risk).
> - `docs/csv-source-data/World_State_Tracking_System.csv` — `Server_Balance_Geographic` peer; world-state snapshot is the unit of cross-player visibility.
>
> **THIS SPEC DOES NOT BUILD MULTIPLAYER.** It builds the **single-player-side seam** so that networked play can slot in later without a rewrite (Bible §10 "deferred"; §13 ruling intent; GDD §4.2 "shaped now"). Everything here ships and is exercised in single-player. The network transport is explicitly out of scope and is replaced by a **local loopback adapter** that satisfies the same interface.

---

## 1. Overview & Player Fantasy

In SHT, **saving the game is time travel** (Bible §11; FIST GDD 386–388). The Time Walker (Sandra Locke) rewinds to the past (load) or jumps to the future (win-against-odds). The Bible's locked framing is that **the traveler's *other dimension* is where multiplayer lives** — so multiplayer is not a separate "lobby," it is *another place the Time Walker can go.* Each nation has **its own time-traveler** (PROGRESS.md locked context: "each nation's own time-traveler is the only save/load"). A second player is, diegetically, **another nation's traveler operating in the same timeline you can be flung into.**

The one already-canon bridge between single-player and that other dimension is the **Time Chain**: FIST GDD line 402 — *"Characters do not level up in this game. They all can gain one additional power from acquiring using the Time Chain (**multiplayer solo character adventures**)."* The Time Chain is therefore the **only** MP-touching feature that has gameplay payload in the single-player build: a character can be sent on a solo "other-dimension" adventure that, on return, grants the **one extra power** the no-XP ruling (Bible §13 #8) allows.

**Player fantasy (single-player today):** *"My save IS a place. When I rewind, I'm stepping sideways into the Walker's dimension. I can send one hero through the Time Chain on a solo run and they come back changed — with a new power — but the Walker pays for it. Someday that dimension will have other players' nations in it; the game already treats my world as if it could be watched."*

**Player fantasy (MP later, NOT built here):** a shared timeline where **each country is owned by exactly one player**, strong nations (above all the **USA**) are reserved as a global *target* everyone is positioned against (GDD §4.2), and new players are **seeded into different regions** so veterans don't dominate (Player_Scaling `Server_Balance_Geographic`).

### 1.1 What this stub actually delivers (the seam, all SP-testable)
1. **A country-ownership registry** (`DimensionOwnershipRegistry`) — every country has an `ownerId`. In SP, all owned countries map to `ownerId: "LOCAL_PLAYER"`; the data shape is already what an authoritative server would write. (GDD §4.2 "shaped now.")
2. **A single read-safe state mirror** (`DimensionMirror`) — a read-only snapshot of the parts of game state another dimension/player is allowed to see, produced by **one reducer** (the §5.12 / 03-spec #12 contract). MP later *subscribes*; it never races writes.
3. **A loopback transport** (`DimensionLink`) — an interface (`publishSnapshot`, `subscribe`, `claimCountry`, `resolveClaim`) with one shipped implementation: `LocalLoopbackLink` (writes to the same process). The MP implementation (`NetLink`) is a future drop-in; **not built here**.
4. **The Time Chain** — the only player-facing feature: send 1 character on a solo other-dimension run; on return grant +1 power (consuming the no-XP "one extra power" slot) at a Time-Walker sanity cost shared with #29.

---

## 2. Data Schema (fields / types)

> All numeric tunables below trace to a source table (cited inline). Where the data is silent I make a **RULING** consistent with the Bible. **No invented numbers** sit unlabeled.

### 2.1 `DimensionOwnershipRegistry` (runtime, persisted in the save snapshot)
```ts
type OwnerId = string; // "LOCAL_PLAYER" in SP; a server playerId in MP

interface CountryOwnership {
  iso: string;          // ISO code — MUST key off allCountries (Bible ruling #10)
  ownerId: OwnerId | null; // null = unclaimed/NPC-run
  factionId: 'US' | 'IN' | 'CN' | 'NG' | null; // Faction_Specification.csv
  claimable: boolean;   // false for reserved targets (see 2.2)
  claimedAtDay: number | null; // game-day of claim (for conflict resolution)
}

interface DimensionOwnershipRegistry {
  countries: Record<string /*iso*/, CountryOwnership>;
  reservedTargets: string[]; // ISO list, see RULING-A
}
```

### 2.2 Reserved-target & faction-seed rules (data-derived)
- **Reserved as a global target:** the **USA** (`US` ISO), per GDD §4.2 / §9 ("the USA, which is reserved as a global 'target'"). `claimable=false`, `ownerId=null` (NPC/world-run), and it is the shared antagonist everyone is positioned against.
- **Faction starting countries** seed `factionId` from `Faction_Specification.csv` `Starting_Countries`:
  - `US` → United States, Canada, United Kingdom, Australia, Japan, South Korea, Germany, France, Israel
  - `IN` → India, Bangladesh, Nepal, Sri Lanka, Bhutan, Mauritius, Fiji
  - `CN` → China, North Korea, Laos, Cambodia, Myanmar, Pakistan (partial)
  - `NG` → Nigeria, Ghana, Kenya, South Africa, Ethiopia, Senegal, Tanzania
- **RULING-A (reserved set):** ship `reservedTargets = ["US"]` only (the single named reservation). GDD §4.2 also says "strong/popular nations are **not** player-selectable" without enumerating them — that enumeration is an **OWNER-FORK** (§10), not data. Until the owner sets it, only `US` is reserved.

### 2.3 `DimensionMirror` (the read-only cross-dimension snapshot — produced by ONE reducer)
This is the **only** data another player/dimension is ever shown. It is a *projection*, never a live reference. Built by `buildDimensionMirror(state)` — a pure function (see §4.1).
```ts
interface DimensionMirror {
  schemaVersion: 1;            // bump on shape change (forward-compat for NetLink)
  asOfGameDay: number;        // world clock day (Time_Management)
  ownerId: OwnerId;
  factionId: 'US'|'IN'|'CN'|'NG'|null;
  // PUBLIC world-state facets (mirror of World_State_Tracking_System "Observable_Elements"):
  ownedCountries: string[];   // ISO list
  tier: 1|2|3|4|5|6;          // Player_Scaling level
  fameGlobal: number;         // Public_Perception global fame (read-only)
  factionReputation: Record<'US'|'IN'|'CN'|'NG', number>; // -100..100
  // ROSTER (public-safe slice only — names + threat, NOT full sheets):
  publicRoster: Array<{ codeName: string; threatLevel: string; alive: boolean }>;
  // NO private state: no money, no stats, no secret identities, no relationships,
  // no current squad positions, no investigations. (See RULING-B.)
}
```
- **RULING-B (what is mirrored):** mirror only fields that `World_State_Tracking_System.csv` marks `Player_Control_Observation` / "observe only" *and* that have no competitive-secrecy cost: tier, global fame, faction reputation, owned-country list, public code-names + threat level. Everything `Information_Access`-gated (money, stats, squad positions, investigations, secret identities, relationship graph) is **excluded**. The 03-spec's relationship state is *consumed internally* but **never** placed in the mirror.

### 2.4 `DimensionLink` (transport interface — loopback shipped, net deferred)
```ts
interface DimensionLink {
  // SP: writes to in-process registry. MP: sends to server.
  publishSnapshot(mirror: DimensionMirror): void;
  subscribe(cb: (peer: DimensionMirror) => void): () => void; // returns unsubscribe
  claimCountry(iso: string, ownerId: OwnerId, atDay: number): ClaimResult;
  releaseCountry(iso: string, ownerId: OwnerId): void;
}

type ClaimResult =
  | { ok: true }
  | { ok: false; reason: 'reserved' | 'already_owned' | 'unknown_iso' | 'conflict' };
```
- **Shipped impl:** `LocalLoopbackLink` — `publishSnapshot` stores the latest mirror; `subscribe` fires with the local mirror only (a single-dimension echo, so UI code that renders "other dimensions" has data to render in SP — it shows YOUR world labelled as the home dimension). `claimCountry` consults the registry synchronously.
- **Deferred impl:** `NetLink` (socket.io — `socket.io-client` is already in `package.json` per GDD §12). **Not built here.** The interface is the contract.

### 2.5 `TimeChainRun` (the only player-facing feature)
```ts
interface TimeChainRun {
  runId: string;
  characterId: string;
  startedDay: number;
  durationDays: number;       // see §3.2 formula
  state: 'away' | 'returned' | 'failed';
  grantedPowerId: string | null; // the +1 power on success (no-XP ruling)
  sanityCost: number;         // charged to the Time Walker, see §3.3
}
```

---

## 3. Exact Numbers, Tables & Formulas (each cited)

### 3.1 Geographic separation (seeding) — `Player_Scaling.csv : Server_Balance_Geographic`
Source row (verbatim): *"New players start in different geographic regions to prevent veteran domination… Geographic separation reduces direct competition… Global balance prevents any single region from dominating."*
- **Mechanic (SP-side seam):** the seeder assigns a new dimension/player a **starting region** = a faction's `Starting_Countries` set (Faction_Specification.csv) **not already owned**. In SP there is one player, so the seeder simply records `LOCAL_PLAYER` against the chosen faction's countries at faction-selection (`gamePhase:'faction-selection'` → ownership write).
- **RULING-C (region granularity):** "region" = a **faction starting-country set** (4 sets exist; the data gives no finer region table). This makes seeding deterministic and data-driven. If the owner wants continents instead of faction-sets, that is **OWNER-FORK**.

### 3.2 Catch-up mechanisms — `Player_Scaling.csv : Catch_Up_Mechanism_*`
The **only catch-up numbers in the data**:
| Mechanism (row) | Effect (verbatim source value) |
|---|---|
| `Catch_Up_Mechanism_Mentoring` | *"New players gain experience **50% faster** with mentor"* (+50% XP) |
| `Catch_Up_Mechanism_Resource_Sharing` | *"New players gain access to better equipment earlier"* (no number given) |
| `Catch_Up_Mechanism_Information` | *"New players benefit from veteran discoveries"* (no number given) |
- **The one hard number this stub honors:** mentoring grants **+50% XP** to the mentee.
- **SP-side seam:** the XP pipe is the same one #18 Progression uses (`+50 … +3000 XP` per mission type, Player_Scaling). The stub exposes a `mentorBonusMult` field on the dimension link defaulting to **1.0** (no mentor) and **1.5** when a mentoring relationship exists. In SP `mentorBonusMult = 1.0` always (no peer to mentor you). Resource/Information catch-up are **flagged but unparameterized** (RULING-D) — the data gives no multiplier, so they remain MP-time owner tuning (OWNER-FORK), and the stub ships only the boolean capability flags so MP can wire them without a schema change.

### 3.3 Time Chain run — duration & sanity cost
The data gives **no Time-Chain duration table**. The Bible gives the surrounding economy:
- The **Time Walker future-jump** returns her after *"a random amount of time… days or weeks"* (FIST GDD 388; Bible §11). The Time Chain is a *solo character* run, not a Walker future-jump, but it **shares the dimension-travel sanity economy** of #29.
- **RULING-E (Time Chain duration):** reuse the future-jump window — `durationDays = randInt(7, 21)` game-days ("days to weeks"), drawn from the **seeded combat/world RNG stream** (03-spec edge-case #3: never `Math.random()`, so a rewind reproduces it). 7–21 traces to FIST GDD "days or weeks" (7=one week, 21=three weeks) — this is a *labelled ruling on a verbal range*, not an invented number.
- **RULING-F (sanity cost):** a Time Chain run costs the **same per-jump sanity decrement as one past-rewind** in #29 (FIST GDD 126: "Each time a time travel event drives the time walker closer to madness and there are fewer destinations"). The actual decrement value is **owned by spec #29** (Time-travel save) — this stub does **not** define it; it calls `timeWalker.spendSanity('time_chain')` and lets #29 own the number. This keeps "one crit pipeline"-style single-ownership of the sanity economy.
- **Outcome:** on `state:'returned'` with success, grant exactly **one** power (the no-XP "one additional power" slot, Bible §13 #8 / FIST 402). A character who has already used their Time-Chain power slot **cannot** start another run (edge case §5.4).

### 3.4 Country-claim conflict resolution (the rule MP will use; SP exercises it)
`claimCountry` order of checks:
1. `iso` not in `allCountries` → `{ok:false, reason:'unknown_iso'}`.
2. `iso ∈ reservedTargets` (e.g. `US`) → `{ok:false, reason:'reserved'}`.
3. `ownerId` already set and ≠ requester → `{ok:false, reason:'already_owned'}`.
4. **Simultaneous-claim tiebreak (MP):** lower `claimedAtDay` wins; equal day → lexicographically-lower `ownerId` wins (deterministic, so server and clients agree). → loser gets `{ok:false, reason:'conflict'}`.
- **RULING-G:** the tiebreak is a determinism ruling (no data covers simultaneity); it is required for the "shaped now" mandate (GDD §4.2) and is exercised in SP by a unit test that fires two claims on the same `iso`/day.

### 3.5 Real↔game time (so the mirror's `asOfGameDay` is meaningful) — `Travel_Time_System.csv`
`1 real day : 30 game days`; full countdown `2,472 game days` ≈ `82.4 real days`. The mirror stamps `asOfGameDay` from the world clock; a peer mirror older than the local clock is rendered as "lagging dimension" rather than reconciled (RULING-H: no live reconciliation in SP — the loopback echoes the current day).

---

## 4. How it Consumes the SPINE (which stats drive it, with the formula)

The MP-stub is *thin* — it is a seam, not a simulation — so it consumes the spine **narrowly and read-only**:

1. **Faction → country ownership (write-once at faction-select).**
   `seedOwnership(factionId) = { iso → {ownerId:'LOCAL_PLAYER', factionId} for iso in Faction_Specification.Starting_Countries[factionId] }`. (Faction_Specification.csv.)
2. **Faction relationship matrix → cross-dimension stance (read).** When a peer mirror arrives, its `factionId` is cross-referenced against `Faction_Specification.csv` "FACTION RELATIONSHIPS" (`US-CN Rival -1CS`, `US-IN Allied +1CS`, etc.). This is surfaced as a UI label only in this stub (no combat effect until MP); the **±CS values are owned by #13 Factions** and merely read here.
3. **Player_Scaling tier (read) → mirror + seeding.** `tier` is copied into the mirror from #18 Progression; the seeder uses tier to decide eligibility (only tier-1 newcomers are eligible for geographic-separation seeding — a returning veteran keeps their region).
4. **Public_Perception fame + faction reputation (read) → mirror.** Only the **global** fame scalar and the 4 faction reputations are mirrored (RULING-B); per-country public opinion is *excluded* (competitive secrecy).
5. **Personality/Relationship state (read, NEVER mirrored).** Per 03-spec §5 #12 and §7, all relationship/personality mutation already flows through **one reducer**; this stub **subscribes read-only** to that reducer's output to (a) pick the Time-Chain candidate's "voice" for the return ping and (b) guarantee it never writes relationship state. It places **none** of it in the mirror.

**Formula summary (the only computed values):**
- `mentorBonusMult = hasMentor ? 1.5 : 1.0` (Player_Scaling +50%).
- `timeChainDuration = seededRandInt(7,21)` game-days (RULING-E).
- `claimResolves(a,b) → (a.claimedAtDay,b.claimedAtDay,a.ownerId,b.ownerId)` deterministic (RULING-G).

---

## 5. Edge Cases & Failure Modes

1. **No peer exists (always true in SP).** `subscribe` still fires once with the **local** mirror (loopback echo) so any "other dimensions" UI has a row to render (it shows YOUR world labelled "Home Dimension"). Never block on a peer; never throw on empty peer set.
2. **Claim on the reserved USA.** `claimCountry('US', …)` → `{ok:false, reason:'reserved'}`. UI must show the USA as a **target** (antagonist tint), never a selectable owner. (GDD §4.2.)
3. **Double-claim / simultaneity.** Resolved by §3.4 deterministic tiebreak. A unit test MUST fire two same-day claims and assert exactly one `ok:true`.
4. **Time Chain on a character who already used their power slot.** `startTimeChain` returns `{ok:false, reason:'power_slot_used'}` — the no-XP "one additional power" is a once-per-character resource (FIST 402; Bible §13 #8). Robots cannot train and **cannot** Time-Chain (RULING-I: the no-XP/erosion ruling excludes robots from growth; extend to Time Chain).
5. **Time Walker unavailable** (she's on a future-jump per #29, or sanity floored). `startTimeChain` returns `{ok:false, reason:'walker_unavailable'}`. The Time Chain *uses* the dimension door; if the door is closed (no traveler / no sanity), no run starts. #29 owns the availability flag; this stub only reads it.
6. **Rewind during an in-flight Time Chain run.** A past-rewind (#29) restores the snapshot, which **includes** any `TimeChainRun` rows (they're in the save). A run started after the rewind point simply never happened post-restore; a run that was in-flight *before* the point resumes from the restored `startedDay`. Determinism (RULING-E seeded RNG) guarantees the same `durationDays` on replay.
7. **Schema drift between dimensions (MP-future).** `DimensionMirror.schemaVersion` is checked on receipt; a peer with a higher version than the local code understands is **rendered as "unknown dimension (incompatible)"** and ignored for logic — never deserialized blindly. (Forward-compat for NetLink.)
8. **Mirror leak audit.** A guard test asserts `buildDimensionMirror(state)` output contains **no** keys from a denylist (`money|stats|squadPositions|investigations|secretIdentity|relationships`). If the projection ever grows to include private state, the test fails. (Enforces RULING-B.)
9. **Unmapped ISO in ownership.** Any `iso` not in `allCountries` is rejected at claim time (`unknown_iso`) and never written — keeps the registry ISO-clean per Bible ruling #10.
10. **Two NPC-run reserved targets later.** If the owner expands `reservedTargets` (OWNER-FORK), the seeder must skip them; covered because seeding draws only from faction `Starting_Countries` (which lists the USA for `US` faction — RULING-J: a faction's *own* reserved home is still owner-run, i.e. the US faction "operates from" but does not "own-as-claimable" the USA; the USA stays `claimable:false`, `factionId:'US'`, `ownerId:null`). This is the one subtle interaction; the test in §5.2 covers it.

---

## 6. UI/UX Hooks (how it surfaces)

- **Phone (real-time-with-pause feed):** Time-Chain return pings — when a run flips to `returned`, the phone shows a personality-voiced line (read from the 03-spec reducer): *"`Iron Fist returned from the Chain — and he's not quite the same. (+1 power)`"*. While `away`, the character shows an **Off-the-Grid**-style glyph and is unavailable for squads (Daily_Activity_Framework parity).
- **Laptop — "Other Dimension" terminal (the diegetic MP screen):** a tab on the same **Chronos/Temporal terminal** that #29 owns. In SP it lists exactly one dimension — **Home Dimension (you)** — rendered from the loopback mirror, with a permanently-greyed **"Bridge to another traveler's dimension — sealed (coming online later)"** affordance. This *is* the architectural stub made visible: the screen exists, reads real mirror data, and has the empty seat MP fills. The USA appears here as a glowing red **GLOBAL TARGET** node that no dimension owns.
- **World map:** each country tile carries an **owner tint** from the registry (your faction color for owned, neutral for unclaimed, **red hatch for the reserved USA target**). In SP everything is your-faction or neutral; the rendering path is identical to what MP needs.
- **Character sheet:** a **Time Chain** action button (enabled only if: alive, not a robot, power-slot unused, traveler available). Disabled states show the exact reason from §5 (`power_slot_used` / `walker_unavailable`).
- **Combat overlay:** **none.** This stub adds nothing to the symbolic grid (per the "spec combat lighter" rule); the Time-Chain power grant flows through the existing Power Activation Engine (#27), not through any combat UI here.

---

## 7. Integration Points (reads / writes)

**Reads:**
- `Faction_Specification.csv` — starting-country seed + faction relationship matrix (labels only).
- `Player_Scaling.csv` — tier, geographic-separation rule, +50% mentoring number.
- `Public_Perception.csv` (via #17) — global fame + faction reputation for the mirror.
- `World_State_Tracking_System.csv` — which facets are "observe-only" (defines the mirror's allowlist).
- **#03 Personality reducer** — read-only subscription (voice for return pings; write-safety guarantee).
- **#29 Time-travel save** — Time Walker availability flag + sanity-spend API (`spendSanity`), snapshot inclusion of `TimeChainRun` + `DimensionOwnershipRegistry`.
- **#18 Progression** — tier value; the XP pipe `mentorBonusMult` rides on.
- `allCountries` (Bible ruling #10) — ISO validation for every claim/seed.

**Writes / emits:**
- → **Save snapshot (#29):** `DimensionOwnershipRegistry` + active `TimeChainRun[]` are part of the snapshot (so rewind restores ownership and in-flight runs).
- → **Power Activation Engine (#27):** on Time-Chain success, calls `grantPower(characterId, powerId)` (the single +1 slot).
- → **Phone (#01):** Time-Chain away/return pings.
- → **`DimensionLink.publishSnapshot(mirror)`:** every world-clock day-tick publishes the freshly-built mirror (loopback stores it). One reducer builds it; nothing else may construct a mirror.

**Hard architectural contracts (the "shaped now" deliverables):**
- All ownership mutation goes through `DimensionOwnershipRegistry` methods; **no** code writes `country.ownerId` directly.
- All cross-dimension visibility goes through `buildDimensionMirror` (one reducer) — enforced by the §5.8 leak test.
- All transport goes through the `DimensionLink` interface — swapping `LocalLoopbackLink` → `NetLink` later touches **zero** game-logic files (GDD §14 Q4: prevents the painful local→networked refactor).

---

## 8. RULING: notes (collected — anything the data did not settle)

- **RULING-A** — Reserved targets ship as `["US"]` only (the one named reservation). Broader "strong nations not selectable" is unenumerated in data → OWNER-FORK.
- **RULING-B** — Mirror allowlist = tier, global fame, 4 faction reputations, owned-country ISOs, public code-names+threat. Everything `Information_Access`-gated is excluded; relationship/personality state is never mirrored.
- **RULING-C** — "Region" for geographic separation = a faction `Starting_Countries` set (4 exist; no finer region table in data).
- **RULING-D** — Resource/Information catch-up ship as boolean capability flags only (data gives no multiplier); MP-time tuning is OWNER-FORK. Only mentoring's **+50% XP** is a hard number.
- **RULING-E** — Time-Chain `durationDays = seededRandInt(7,21)` game-days (FIST "days or weeks"), seeded RNG for rewind-determinism.
- **RULING-F** — Time-Chain sanity cost = one past-rewind's cost; the value is **owned by #29**, not duplicated here.
- **RULING-G** — Simultaneous-claim tiebreak: lower `claimedAtDay`, then lexicographically-lower `ownerId`. Deterministic.
- **RULING-H** — No live cross-dimension reconciliation in SP; loopback echoes the current clock day.
- **RULING-I** — Robots cannot Time-Chain (consistent with no-XP/erosion ruling: robots don't grow).
- **RULING-J** — A faction "operates from" but does not "own-as-claimable" its reserved home (USA stays `claimable:false`, `factionId:'US'`, `ownerId:null`).

---

## 9. Open Questions

1. Does a Time-Chain run have a **failure outcome** (return with no power, or a *negative* change like the Walker's "cyborg arm / don't-trust-the-hammer-man" twist in FIST GDD 131)? The Bible supports a "returns changed" beat — should the stub model a `failed`/`twisted` outcome now, or is that #29/#30 story content? (Current spec: `failed` exists in the enum but is unused pending this answer.)
2. When MP lands, do peers see each other's **owned-country list in real time**, or only at day-tick cadence (current mirror is day-tick)? Affects perceived latency.
3. Should the **mentoring +50%** ever apply in SP (e.g. an NPC-faction "mentor" handing a tier bonus to a late-starting save), or strictly MP-only (current: SP `mentorBonusMult=1.0` always)?

---

## 10. OWNER-FORK: notes (genuine product choices only the owner can make)

- **OWNER-FORK-1 — The reserved/non-selectable nation set.** GDD §4.2 says "strong/popular nations are not player-selectable" but names only the USA. *Which other countries (if any) are reserved as non-claimable, and on what criterion (GDP? military? a hand-picked list)?* This is a competitive-design call, not derivable from the stats. (Stub ships `["US"]` only — RULING-A.)
- **OWNER-FORK-2 — Catch-up generosity beyond mentoring.** Player_Scaling gives a hard +50% for mentoring but **no number** for Resource-Sharing or Information catch-up. *How strong should veteran-assistance be — equipment-tier skip? free intel? a funding floor?* Balance/monetization-adjacent; owner-only. (Stub ships capability flags, no multipliers — RULING-D.)
- **OWNER-FORK-3 — Region granularity for new-player seeding.** Faction-set (4 regions) vs continent vs finer. Affects how "separated" players feel and how many concurrent players a world supports. (Stub ships faction-set — RULING-C.)
- **OWNER-FORK-4 — Does a Time-Chain run risk a *bad* return (the "changed traveler" twist)?** A tone/risk call: is the Time Chain pure upside (+1 power) or a gamble with a downside, matching the Walker's future-jump "comes back changed" fiction? (Open Question #1; enum slot reserved.)
- **OWNER-FORK-5 — Transport vendor.** FIST GDD 1488 names "Epic Online Services and Steamworks"; `package.json` has `socket.io-client`. *Which networking stack does `NetLink` target?* Picking it now would constrain the (deferred) MP build; the `DimensionLink` interface is vendor-agnostic so this can stay open.

---

*This stub builds the **seam**, not the network: one ownership registry, one read-only mirror reducer, one transport interface (loopback shipped, net deferred), and the one player-facing Time-Chain feature — all exercised in single-player, all shaped so the time-traveler's other dimension can become multiplayer later without a rewrite (Bible §10 "deferred"; GDD §4.2 "shaped now").*
