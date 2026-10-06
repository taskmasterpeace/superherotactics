# 112 — Engine & Netcode Evaluation (resolves 107 · OWNER-FORK-5)

> **Question asked:** "Examine these open-source tactical game engines for us to use — boardgame.io, Battle for Wesnoth, Sulis, godot-tactical-rpg, Tactical Engine — look for more, and make a recommendation."
> **Status:** RECOMMENDATION — owner decision required on the primary path.
> **Scope:** Resolves the deferred transport-vendor choice in [107 §10 OWNER-FORK-5](107-multiplayer-dimension-stub.md) (the `NetLink` implementation). Does **not** touch the shipped single-player game.
> **Date:** 2026-07-14.

---

## 0. TL;DR

**Do not adopt any of the five engines as an *engine*.** Four of them (Wesnoth, Sulis, godot-tactical-rpg, Tactical Engine) are **full rewrites in a foreign language**, and two of those are **GPL copyleft** — adopting their engine code would legally force SHT to be open-sourced. The fifth, boardgame.io, is the only one in SHT's own language, but it **competes with the state architecture SHT has already deliberately built** (single authoritative reducer + Chronos determinism), so it's a poor complement, not a free win.

SHT is **not greenfield**. It is a mature **TypeScript + Phaser 3.70 + React 18 + Zustand + Vite** codebase (~5,000-line combat scene, 168 countries, 1,050 cities, `socket.io-client` and Supabase already in `package.json`). And per spec [107](107-multiplayer-dimension-stub.md), the multiplayer **state model is already designed** — you need a *transport + rooms + matchmaking + persistence* backend, i.e. the `NetLink` implementation, not a new game engine.

**Recommendation:**
1. **Primary — implement `NetLink` on [Colyseus](https://colyseus.io/)** (MIT, Node.js authoritative rooms + schema state-sync + matchmaking + reconnection). It maps 1:1 onto spec 107's `DimensionLink` interface, keeps 100% of the existing Phaser/React/Zustand game, and is purpose-built to bolt onto any client.
2. **Persistence/identity — [Supabase](https://supabase.com/)** (already a dependency: `@supabase/supabase-js`, `pg`). Owns accounts, the persistent world-ownership registry, and cross-session storage.
3. **Cheapest first slice — the `socket.io` you already have.** For a first 2-player country-claim + mirror-exchange demo, a thin authoritative Node server over the existing `socket.io-client` proves spec 107 end-to-end before committing to Colyseus's room model. Graduate to Colyseus the moment matchmaking / reconnection / state reconciliation start hurting.
4. **Rule out** boardgame.io (architecture conflict), and Wesnoth / Sulis / godot-tactical-rpg / Tactical Engine (foreign-language rewrite; Wesnoth GPLv2 + Sulis GPLv3 poison a commercial release).

---

## 1. Why the framing in the original table is wrong for SHT

The comparison table you were given evaluates the five engines **as if SHT were a blank slate choosing an engine to build on**. It isn't. Two facts flip the analysis:

**Fact 1 — SHT is a large, single-language TypeScript game that already exists.** From `MVP/package.json`: `phaser ^3.70`, `react ^18`, `zustand ^4.3`, `vite ^4.1`, plus **`socket.io-client ^4.6`** and **`@supabase/supabase-js`, `pg`, `sql.js`** already present. The tactical layer alone is ~5,000 lines of Phaser (`CombatScene.ts`). Adopting an engine written in another language means **deleting all of that** and starting over — a cost the table never prices in.

**Fact 2 — the multiplayer *state design* is already done.** Spec [107](107-multiplayer-dimension-stub.md) commits SHT to:
- one authoritative **single reducer** (MP-read-safety contract, 03-spec §5.12),
- a read-only **`DimensionMirror`** projection (only public facets crossing between players),
- **deterministic** country-claim conflict resolution (§3.4 tiebreak),
- a vendor-agnostic **`DimensionLink`** transport interface — `LocalLoopbackLink` shipped, **`NetLink` deferred**,
- country-locked ownership, USA reserved as a global target, geographic seeding, mentoring catch-up.

So the engine question is really: **what implements `NetLink`?** That is a *networking-backend* decision, not a *tactics-engine* decision. The five candidates answer a question SHT already answered.

---

## 2. The five candidates, scored against SHT's reality

| Engine | Language | License | What it actually is | Fit for SHT | Verdict |
|---|---|---|---|---|---|
| **boardgame.io** | TS/JS | **MIT** ✅ | Renderer-agnostic **turn state + networking** framework (reducer moves → playable + online). Actively maintained (12.3k★, updated Apr 2025). | Same language, and it's a *complement* to a renderer, not a rival to Phaser. **But** it wants to *own state management* via its own reducer/lockstep model — which **directly conflicts** with 107's already-built single-reducer + Chronos-determinism design. You'd be adopting a second, competing state authority. Also a weak fit for SHT's imperative, physics-y Phaser combat sim (knockback, pathfinding), which doesn't map onto pure declarative moves. | **Rule out.** Right language, wrong layer — it duplicates the part you already designed. |
| **Battle for Wesnoth** | C++ | **GPLv2+** ⛔ | Mature turn-based tactics *game* + engine. | Foreign language (total rewrite). **GPLv2 copyleft**: reusing the engine or assets forces SHT's own source open. Fatal for a commercial product. | **Rule out.** Rewrite **and** license-incompatible. |
| **Sulis** | Rust | **GPLv3** ⛔ | Data-driven, ability-heavy tactical RPG engine. Genuinely nice ability system. Effectively single-maintainer; last changelog ~Jul 2023. | Foreign language (total rewrite). **GPLv3 copyleft** (same commercial problem). Bus-factor risk. | **Rule out.** Rewrite + license + maintenance risk. |
| **godot-tactical-rpg** | GDScript | MIT-ish (template) | A *learning template*, not a framework. No real multiplayer. | Foreign engine + language. You'd throw away Phaser/React and rebuild in Godot for a starter template's worth of value. | **Rule out.** Rewrite for near-zero reusable value. |
| **Tactical Engine (Java)** | Java | (varies) | Clean 2D top-down tactics base, Tiled map support, no multiplayer. | Foreign language (total rewrite). You own the entire netcode rewrite anyway. | **Rule out.** Rewrite with no MP benefit. |

**Pattern:** the only candidate that isn't a language rewrite (boardgame.io) is the one that collides with your existing architecture. The engines are answering "how do I build a tactics game?" — a question SHT retired long ago.

---

## 3. The candidates that *do* fit — netcode backends for `NetLink`

These are what I looked for beyond your five: not tactics engines, but **authoritative-multiplayer backends** that slot into the `DimensionLink` seam without touching the game.

| Option | Language | License | What SHT gets | Cost / caveat |
|---|---|---|---|---|
| **Colyseus** ⭐ | Node.js/TS | **MIT** | Authoritative **rooms**, schema-based **state sync**, **matchmaking**, reconnection, presence. A Colyseus *Room* = one shared "dimension/timeline"; room state = the authoritative registry + published mirrors; `claimCountry` = a room message handler using 107 §3.4's deterministic tiebreak. Same language as the whole codebase. | You write the room/message logic (a day of wiring for the first slice). Real-time-first, but turn/snapshot cadence is explicitly supported. |
| **Supabase** (already in repo) | Postgres/TS | Apache-2.0 (OSS) / hosted | **Accounts + persistence + Realtime.** Because 107's mirror is **day-tick cadence, read-only** (not twitch real-time), Postgres-backed broadcast/presence can carry `publishSnapshot`/`subscribe` with **no dedicated game server**, and RLS enforces the mirror allowlist. | Weakest for *authoritative* conflict resolution / anti-cheat (claim tiebreak wants a server process). Best as the **persistence + identity layer under** Colyseus, not the whole answer. |
| **Nakama** | Go (+ TS/Lua runtime) | Apache-2.0 (core) | Batteries-included game *backend*: accounts, authoritative match handler, matchmaker, leaderboards, storage, chat. Fits the "mmorpg" keyword and a persistent shared world. | Heavier ops (Go server + DB), steeper curve, match logic in Go/TS runtime. Overkill for a first slice; reconsider at real MMO scale. |
| **Raw `socket.io`** (already in repo) | Node/TS | MIT | Cheapest possible first `NetLink`: a thin authoritative Node server + the `socket.io-client` already installed. The `DimensionLink` interface is already shaped for it (107 §2.4). | You hand-roll rooms, matchmaking, reconnection, state reconciliation — exactly what Colyseus gives for free. Fine to prove the seam; don't scale it. |

**Note on EOS / Steamworks** (floated in FIST GDD, 107 OWNER-FORK-5): those are **identity / friends / lobby / store / NAT-relay** platforms, **not** authoritative game-state servers. They're *complementary* to Colyseus/Nakama (layer them for login, friends, achievements, distribution), never a substitute for the authoritative state backend. Picking one doesn't answer the `NetLink` question.

---

## 4. Recommendation & phased path

**Primary: `NetLink` = Colyseus (authoritative game state) + Supabase (identity & persistence).** boardgame.io ruled out on architecture; the four foreign-language engines ruled out on rewrite-cost + license.

Why this respects the work already done:
- **Zero rewrite.** Phaser combat, React laptop UI, Zustand strategic state, the 168-country / 1,050-city data, and the Chronos save system all stay exactly as they are. Colyseus attaches at the `DimensionLink` seam only — satisfying 107's hard contract that swapping `LocalLoopbackLink → NetLink` "touches **zero** game-logic files."
- **Same language everywhere.** Server rooms are TypeScript, sharing types with the client and the existing mirror/registry code.
- **The design maps cleanly.** Room ↔ shared timeline; room state ↔ authoritative `DimensionOwnershipRegistry` + peer mirrors; message handler ↔ `claimCountry` with the §3.4 deterministic tiebreak; matchmaking ↔ country-locked seating + geographic seeding.
- **License-clean for commercial release** (MIT + Apache-2.0), unlike Wesnoth/Sulis.

**Path:**
- **Phase 0 — the seam.** ✅ Already shipped in 107 (`DimensionLink`, `LocalLoopbackLink`).
- **Phase 1 — prove it on `socket.io` (you own it).** Thin authoritative Node server; two clients claim countries and exchange mirrors on the day-tick. Validates 107 end-to-end with no new dependency. Terminal state: two browsers see each other's owned-country tint and the reserved-USA target.
- **Phase 2 — graduate to Colyseus.** Move the loopback logic into a Colyseus Room (`NetLink`). Add matchmaking (country-locked seating), reconnection, and the §3.4 claim resolution **server-side** (authoritative). Persist the ownership registry in Supabase/Postgres (`pg` + `@supabase/supabase-js` already present).
- **Phase 3 — scale & harden.** Anti-cheat (all mutation server-validated through the single reducer), world-state snapshots in Postgres, optional EOS/Steamworks for identity/friends/store at distribution time. Revisit Nakama **only** if the world genuinely becomes a persistent MMO needing built-in leaderboards/chat/social at scale.

**One-line answer:** *You don't need a tactical engine — you have one. You need `NetLink`. Build it on Colyseus (MIT, TypeScript, authoritative rooms) with Supabase underneath, prototype it first on the `socket.io` already in your `package.json`, and keep the game you already built untouched.*

---

## 5. Sources

- boardgame.io — [site](https://boardgame.io/) · [GitHub (MIT, active)](https://github.com/boardgameio/boardgame.io) · [Phaser integration discussion](https://github.com/boardgameio/boardgame.io/issues/272)
- Battle for Wesnoth — [GitHub (GPLv2+)](https://github.com/wesnoth/wesnoth) · [Wikipedia](https://en.wikipedia.org/wiki/The_Battle_for_Wesnoth)
- Sulis — [GitHub (GPLv3, Rust)](https://github.com/Grokmoo/sulis) · [GPLv3 license file](https://github.com/Grokmoo/sulis/blob/master/docs/GPLv3-LICENSE)
- Colyseus — [site](https://colyseus.io/) · [docs](https://docs.colyseus.io/) · [GitHub (MIT)](https://github.com/colyseus/colyseus)
- Nakama — [GitHub (Apache-2.0)](https://github.com/heroiclabs/nakama)
- Game-server comparison — [Game Server Showdown 2025 (medevel)](https://medevel.com/game-server-2025/) · [Nakama vs Colyseus (SaaSHub)](https://www.saashub.com/compare-nakama-vs-colyseus)
- JS/TS engine landscape — [GameFromScratch: JS/TS Game Engines in 2025](https://gamefromscratch.com/javascript-typescript-game-engines-in-2025/)
- Internal — [107 Multiplayer-Dimension Stub](107-multiplayer-dimension-stub.md) (the `DimensionLink`/`NetLink` seam this resolves)
