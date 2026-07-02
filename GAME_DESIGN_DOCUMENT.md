# SuperHero Tactics — Game Design Document

> **Version:** 1.0 (living document)
> **Date:** 2026-06-25
> **Status:** Active development — single-player first, multiplayer later
> **Tagline:** *"The Chess of Superhero Games"*

---

## 0. How to read this document

This GDD describes both the **intended game** and the **honest current state** of the code. Unlike the older docs in this repo (which describe the game as "production-ready / COMPLETE"), every system below carries a verified status tag derived from auditing the actual codebase on 2026-06-25.

**Status legend:**

| Tag | Meaning |
|-----|---------|
| ✅ **BUILT** | Implemented and wired into gameplay; reachable and functional |
| 🟡 **PARTIAL** | Exists and partly works, but incompletely wired or surfaced |
| 🟦 **STUB / DATA-ONLY** | Defined in data/types but never executed at runtime |
| ⬜ **GREENFIELD** | Not started; conceptual only |

When intent and reality diverge, both are stated. The design is the north star; the status tells us how far we are from it.

---

## 1. Vision & Fantasy

**Elevator pitch:** You run a government-backed organization that recruits *Living Super Weapons* (LSWs) and mercenaries to defend a country from superhuman threats — while a global clock counts down to an alien invasion. You manage politics, money, reputation, and crime at the strategic level, then drop into **grid-based tactical combat** when missions go hot.

**The signature hook:** tactical grid combat that is **not flat** — heroes **fly**, fire **beams and projectiles** (some that pass *through* walls), throw **grenades**, and wield wildly different **superpowers** (super speed, teleportation, even time manipulation), all on a turn-based tactical grid layered over a living geopolitical world.

**Player fantasy:**
- Strategic thinking and political savvy matter as much as raw power.
- Every mission makes headlines and reshapes the world.
- Long-term planning meets immediate tactical execution.
- Creative problem-solving through power combinations and location advantages.

**Reality note:** The geopolitical and strategic foundations are real and substantial. The *signature combat hook* (flight + beams-through-walls + diverse powers on the grid) is the **least complete** part of the game — see §6.3 and §7.2.

---

## 2. Design Pillars

1. **Combined Effects** — single stats are weak; gameplay emerges from combining 2–4 country/city stats (see §7.6).
2. **Consequence-driven world** — actions generate news, shift public opinion, trigger legal/political fallout.
3. **Tactical depth over raw power** — smart play beats a power-level gap.
4. **Authentic world** — ~168 countries and ~1,050 cities with real-flavored politics, economics, and crime.
5. **Strategic ↔ Tactical loop** — the meta-game and the battlefield feed each other continuously.

---

## 3. Setting & Premise

- Earth has a fixed countdown — **~2,472 game days** until an alien invasion (≈82 real days at the design's 1:30 time ratio). The countdown is meant to be visible and motivating.
- **LSWs (Living Super Weapons)** are superpowered individuals. The player recruits, equips, deploys, heals, and (if they die) clones them.
- The world is contested by asymmetric **factions** (see §7.10): **US / FIST**, **India / Establishment 24**, **China**, **Nigeria** — each with distinct bonuses, equipment access, and playstyle.

---

## 4. Game Modes

### 4.1 Single-Player (primary, current focus) — ✅/🟡
The full campaign: pick a faction/country/city, build an organization, run missions, survive to the invasion. **This is the build target for the foreseeable roadmap.**

### 4.2 Multiplayer (future) — ⬜ GREENFIELD
**Design:** A shared world where **each country can be claimed by only one player**. Strong/popular nations are **not** player-selectable — above all the **USA, which is reserved as a global "target"** that everyone is positioned against. You may only join a game where your desired country is still **available**.

**Reality:** 100% absent today. `socket.io-client` is listed in `package.json` but unused; all state is local Zustand; country selection has no availability/lock logic. This is full client/server + persistence work, deliberately deferred. The single-player data/state should be shaped now so country ownership can later be authoritative server-side without a rewrite.

---

## 5. Core Gameplay Loop

**Intended loop:**

```
New Game
  → Faction Select → Country Select → City Select
  → Base Setup → Recruit Team → Equip
  → WORLD MAP  ⇆  (Strategic: missions, travel, investigations, news, economy, time)
       → Deploy squad → TACTICAL COMBAT
       → Results (XP, loot, injuries, fame, legal/political fallout)
  → back to World Map … repeat until Day 2,472 (invasion)
```

**Current playability status:** 🟡 PARTIAL. The intro (Faction→Country→City) works but is bypassed by a testing default that boots straight to the world map. **Base Setup** and **Equip** are not wired into the chain. The **World Map → Combat** buttons are dead. Combat results *do* flow back correctly. Today the only working path into combat is via the Investigations screen, and it routes to a **mock** combat screen rather than the real Phaser engine. **Milestone 1 (§11) fixes exactly this.**

---

## 6. The Three Layers

### 6.1 Laptop / Meta Layer — 🟡 PARTIAL
The between-missions interface (conceptually an in-world phone/laptop).

| Feature | Status | Notes |
|---|---|---|
| News / Web browser | ✅ BUILT | `NewsBrowser.tsx`; reacts to combat/mission/time events. No nav button (keyboard/dev only) |
| Investigations | ✅ BUILT | `WorkingInvestigationCenter.tsx`; multi-method, real-time alerts |
| Hospital | ✅ BUILT | `HospitalScreen.tsx`; healing, recovery scheduled by time engine |
| Time display | ✅ BUILT | `timeEngine.ts` + HUD widgets; day/night, speed controls |
| Character management | 🟡 PARTIAL | `CharacterScreen.tsx` is view-only; no inline loadout/training |
| Education / Training | 🟡 PARTIAL | `TrainingCenter.tsx` UI exists; **degrees grant no stat bonuses**, no progress tracking |
| Email / briefings | 🟡 PARTIAL | `emailSystem.ts` fully wired to events, but **UI only renders on mobile (<768px)** — no desktop screen |
| Base overview | ✅ BUILT | `BaseManager.tsx`; grid facilities, upkeep, bonuses |

**Cross-cutting gap:** most of these are only reachable via keyboard shortcuts or the F2 dev panel — there is **no persistent in-game navigation**. (Fixed in Milestone 1.)

### 6.2 World Map / Strategic Layer — ✅ (mostly)
Grid-based global operations.

| Feature | Status | Notes |
|---|---|---|
| Sector grid | ✅ BUILT | `WorldMapGrid.tsx`. Design: 20×10 macro sectors; implementation renders a finer (~42×24) grid |
| ~1,050 cities / ~168 countries | ✅ BUILT | `allCities.ts`, `allCountries.ts`; used widely |
| Squad position & deploy | 🟡 PARTIAL | Display works; **deploy/enter-combat buttons unwired** |
| Travel time & vehicles | ✅ BUILT | `travelSystem.ts` + `vehicleSystem.ts` (33 vehicles wired) |
| Squads (multiple) | ✅ BUILT | `squadSystem.ts`; morale, vehicle assignment |
| Factions & reputation | ✅ BUILT | `factionSystem.ts`; standing, decay, price/travel modifiers |
| Bases | ✅ BUILT | `baseSystem.ts`; facility bonuses apply |
| Territory & militia | ✅ BUILT | `territorySystem.ts`; sector control, militia training |
| Crime / underworld | ✅ BUILT | Org simulation feeds missions/news/investigations (see §7.7) |
| Mission generation | 🟡 PARTIAL | Template generation runs; **context-aware weighting (`missionGeneration.ts`) is orphaned** |
| Elections | 🟦 STUB | `electionSystem.ts` — zero imports; governments never change |
| Patrols | 🟦 STUB | `patrolSystem.ts` — never dispatched; idle time unused |
| Location effects | 🟦 STUB | `locationEffects.ts` computed but never fed back into gameplay |

### 6.3 Tactical Combat Layer — 🟡 PARTIAL (solid core, missing the signature features)
Phaser-based turn combat (`CombatScene.ts`, ~9,500 lines).

| System | Status | Notes |
|---|---|---|
| Turn / AP economy | ✅ BUILT | |
| Movement, Line-of-Sight, Fog-of-War | ✅ BUILT | AI movement is greedy best-first, **not A\*** (despite docs) |
| Hit / miss / graze / crit | ✅ BUILT | |
| Weapons + range brackets | ✅ BUILT | 70+ weapon DB bridged in |
| Armor DR / stopping power | ✅ BUILT | Works, but implemented inline (clean API exists but unused) |
| Knockback | ✅ BUILT | Basic; `knockbackSystem.ts` ~80% unused (no wall bounce/chains) |
| Grenades | ✅ BUILT | Arc throw, falloff, status |
| Grappling | 🟡 PARTIAL | Basic grabs; state machine defined but not progressing |
| Shields | 🟡 PARTIAL | Absorb works; **regen tick missing** |
| **Flight / altitude** | ⬜ **GREENFIELD** | **Grid is strictly 2D — no Z-axis.** "Flight" is only a power label |
| **Powers (beams, super speed, time, etc.)** | 🟦 **STUB** | 21 defined; **only teleport + beam-weapons execute** |
| Projectiles through walls | ⬜ GREENFIELD | Projectiles stop at walls; no penetration/phasing for attacks |
| Damage-type → status effects | 🟡 PARTIAL | ~8 of 31 types apply an effect |
| Sounds (381 catalog) | 🟡 PARTIAL | Catalog rich; only a subset wired |
| AI vs AI mode | ✅ BUILT | |

---

## 7. Systems Catalog

### 7.1 Characters & Recruitment — ✅/🟡
- Deep character model: combat stats (e.g., **STR/AGL/INT/STA/INS/CON/MEL**), skills, education, equipment, relationships, legal/medical history.
- Recruitment of LSWs and mercenaries; `recruitableCharacters.ts`, `mercenaryPool.ts` (country-locked merc pools by military/corruption/law).
- **Gap:** management UI is view-only; recruitment of mercs has no front-end hookup yet.

### 7.2 Powers & Abilities — 🟦 STUB (highest-value design area)
**Intent:** dozens-to-hundreds of distinct powers driving wildly different playstyles, including the marquee ones the design leans on:

| Power family | Examples | Status |
|---|---|---|
| Mobility | Teleport (✅ executes), **Flight**, **Super Speed**, Phase Shift | Teleport only |
| Ranged offense | **Energy Beams**, Fireball, Ice Bolt, Chain Lightning | Beam-weapons only |
| Control | Mind Control, Web Snare, Gravity Crush/Well | Defined, not executed |
| Defense/support | Energy Shield, Force Field, Heal, Inspire, Empower | Defined, not executed |
| Utility | Invisibility, Decoy, Scan, Reflect | Defined, not executed |
| **Temporal** | **Time stop / rewind / time travel** | `temporal` type exists; **no implementation** |

**The core need:** a **Power Activation Engine** in combat — a single dispatcher (`activatePower(unit, power, target)`) that branches per power type to apply movement, damage, buffs, debuffs, summons, and status. Today only teleport has a bespoke path. This engine is the gateway to the game's identity.

**Design dependencies for the marquee powers:**
- **Flight** requires an **altitude system** (§7.3) — a Z dimension on the grid with height-advantage rules and ceiling limits.
- **Beams / projectiles through walls** require attack-side penetration rules (currently only movement can phase).
- **Super speed** requires extra-action/initiative or movement-multiplier rules in the AP economy.
- **Time-travel powers** intersect the save system (§8) — distinguish *tactical* time powers (in-combat rewind) from the *strategic* diegetic save.

### 7.3 Combat Mechanics — 🟡
Turn-based AP combat on a tile grid with LOS/FOW, knockback, grenades, armor/DR, shields, crit/body-part targeting (partial). **Altitude/flight is the key missing dimension.** Free-movement-before-contact exists but is effectively zero-cost rather than the intended "free until spotted, then initiative + AP."

### 7.4 Weapons, Armor & Equipment — ✅
70+ weapons (range brackets, per-weapon damage), 50+ armors (stopping power, degradation), shields, grenades, gadgets, inventory grid. Equipment is real and wired into combat.

### 7.5 World Map, Travel & Vehicles — ✅/🟡
- Sector navigation, travel time per distance/terrain/vehicle, fuel & incidents.
- **57 vehicles** across two databases: `vehicleSystem.ts` (33, ✅ wired to travel/bases) and `gadgets.ts` (24, 🟦 dormant). No "buy a vehicle" shop yet; combat-vehicle rules not implemented.

### 7.6 Combined Effects Philosophy — 🟡
The design's emergent core: country/city stats combine into 12+ systems (cloning, black market, surveillance, medical, research, organized crime, mercenaries, safe houses, border control, media, politics, superhuman affairs). **Reality:** the math exists (`combinedEffects.ts`, `locationEffects.ts`) and *some* (medical, cloning, black market) are consulted, but most outputs **never feed back** into mission difficulty, pricing, or rewards. Wiring this is cheap, high-impact depth.

### 7.7 Crime & Underworld — ✅ BUILT (a pleasant surprise)
Fully simulated: 4 organization types (street gang, syndicate, cartel, shadow network) with a lifecycle state machine, **16 activity types** (drug deal, robbery, smuggling, assassination, trafficking, etc.), weekly simulation generating heat/profit/events, every city carries a `crimeIndex` (0–100), and it **already feeds** mission generation, news, and investigations. This system is genuinely production-grade.

### 7.8 Squads — ✅
Multiple squads with morale, personality traits affecting AI/idle behavior, and vehicle assignment. UI for squad management on the world map is thin.

### 7.9 Bases — ✅
6 base types, 13 facility types, grid placement, power/security/upkeep, and facility bonuses (healing/education/investigation) that apply to gameplay.

### 7.10 Factions & Reputation — ✅
Per-country standings with decay, labels, and modifiers to prices/travel/mission access. Four asymmetric faction archetypes. **Gap:** standings not yet fully wired to mission rewards/consequences.

### 7.11 Territory & Militia — ✅
Sector control, militia recruitment/training, affects security and recruitment.

### 7.12 News & Media — ✅
Event-driven generation (combat, missions, hospitalizations, reputation, time). Fame tiers (Local→Global) and public-opinion tracking are designed; full opinion consequences are partially wired.

### 7.13 Investigations — ✅
Multi-method (covert/official/force/diplomatic), real-time email alerts, city-type templates, consequence chains. Currently the de-facto entry into combat.

### 7.14 Hospital / Injury / Cloning — ✅/🟡
Injury severity, recovery time/cost, hospital quality by country, scheduled recovery via the time engine. Cloning (memory transfer for dead LSWs) is designed; degree of wiring varies.

### 7.15 Economy — ✅ (backend) / 🟡 (UX)
Weekly payday + daily merc wages tick correctly and adjust the budget (`economySystem.ts`, `timeEventGenerator.ts`). **Gap:** no payday summary / budget report surfaced to the player.

### 7.16 Time & Calendar — ✅
`timeEngine.ts`: tick-based forward time, day/night, speed controls (paused→360x), event hooks. Forward-only (relevant to §8).

### 7.17 Education / Training / Careers — 🟡
7 career categories × 5 ranks with ultimate tech unlocks is the design. Enrollment UI exists; **bonuses and progression are not wired** — currently cosmetic.

### 7.18 Email / Briefings — 🟡
Backend complete and event-subscribed; needs a desktop surface (currently mobile-only).

---

## 8. Save System = Diegetic Time Travel — ⬜ GREENFIELD

**Design:** Saving/loading is **in-fiction**. The player has access to a **time-traveler** (character/device/faction) that can **return to a previous point in the timeline** — "loading a save" is "rewinding time." This reframes a mundane menu into a signature mechanic.

**Proposed shape:**
- **Snapshots** of full game state (characters, squads, economy, reputation, world events, crime sim, time) captured at checkpoints (e.g., mission complete, daily, or on demand).
- **Diegetic UI** — a "Temporal Archive / Chronos terminal," with checkpoints labeled by in-game context ("Before the Lagos extraction").
- **Optional cost/limits** — temporal energy, limited checkpoints, or cooldown — to make rewinding a *decision*, not a free undo.
- **Restoration** fully reverts state to the checkpoint with appropriate feedback.

**Reality:** none of this exists. There is **no persistence at all** today — a browser refresh wipes the game. Scaffolding exists but is dormant (`db/database.ts` localStorage helpers, `lib/supabase.ts`). The time engine is forward-only. Building this also delivers ordinary save/load as a byproduct. **Distinguish from tactical in-combat time powers (§7.2)** — same fiction, different scope.

---

## 9. Multiplayer (Future) — ⬜ GREENFIELD
See §4.2. Country-locked availability with the USA reserved as the global target. Requires authoritative server state for country ownership, lobby/matchmaking, presence, and conflict resolution on simultaneous claims. Deferred until single-player is complete; single-player state should be designed to migrate cleanly.

---

## 10. Progression & Win Condition

**Progression (design):** 6 escalating tiers, from *Street Operative* (Days 1–14, ~$5K budget, 1–2 characters) to *Cosmic Guardian* (Day 181+, unlimited budget, 8–15 characters, reality-level threats). Budgets, roster size, mission scope, and faction cooperation scale per tier. (MMORPG-style "new player protection" via geographic separation is part of the multiplayer vision.)

**Win condition (design):** survive to **Day 2,472** with a viable team and prepare for / repel the alien invasion. Intermediate goals: faction relationships, territory control, power/tech unlocks, fame and public-opinion management, minimizing legal/bounty exposure.

**Reality:** tiering and the explicit win state are design-level; not yet enforced as a progression gate in code.

---

## 11. Production Roadmap & Milestones

### Locked decisions (2026-06-25)
1. **Finish line:** a **full single-player game** — all systems connected, balanced across the whole world, with save/load and polish. (Not a vertical slice; not yet commercial multiplayer.)
2. **Multiplayer:** later. Build on local state now; keep data/state shaped so country-locked MP can slot in.
3. **Build order:** **World Map → UI → Combat.**
4. **First milestone:** make the existing loop **playable + visible**, full clickable spine, **thin glue** (no foundation detours).

### Milestone 1 — Playable Spine (current) 🟡→✅ target
Make SHT playable start-to-finish by clicking, every existing system reachable, using the real Phaser combat engine. Scope:
1. New Game starts the real intro (gate the test default behind `?dev`).
2. Insert **Base Setup** (reuse `BaseManager`) and **Equip** (reuse `EquipmentShop`) as phase steps: `…city → base-setup → recruiting → equip → playing`.
3. Wire the dead **Deploy / Enter Combat** buttons (`WorldMapGrid.tsx:610`) → `EventBridge.emit('load-combat', …)` → `currentView:'combat-lab'`.
4. **Standardize combat** on the Phaser `CombatLab`; quarantine the React mock; repoint Investigations to `combat-lab`.
5. Verify **results closure** (`combatResultsHandler` → back to world map).
6. **Persistent nav bar** (extend `GameHUD`) to every screen, plus visible day/clock + money.
7. **Browser-screenshot verification** of the whole click-path.

**Definition of done:** a newcomer runs `npm run dev`, clicks New Game → through a full mission → back to the world map, and opens every system from the nav — no keyboard shortcuts, no dev panel — verified by screenshots.

### Later milestones (indicative order)
- **M2 — World-map depth:** wire context-aware mission generation + location effects; revive elections & patrols; vehicle shop; faction standings → rewards.
- **M3 — UI / Laptop shell:** real phone/laptop meta-UI aesthetic; desktop email; payday/budget summaries; training progression & bonuses.
- **M4 — Combat identity:** **Power Activation Engine**; **altitude/flight system**; beams/projectiles through walls; expand damage-type→status coverage; A\* pathfinding; shield regen.
- **M5 — Persistence & Time Travel:** snapshot save system + diegetic Chronos UI (§8).
- **M6 — Balance & polish:** progression tiers/win condition; economy tuning; sound coverage; type-error cleanup + `tsconfig`.
- **M7 — Multiplayer:** server, country-lock lobby, USA-as-target.

---

## 12. Technical Architecture

- **Stack:** React 18 + Zustand (state) + Phaser 3 (combat) + Vite 4 + TypeScript 4.9.
- **Entry:** `MVP/src/main.tsx` → `App.tsx` (view switch ~lines 486–521). Store: `MVP/src/stores/enhancedGameStore.ts` (`gamePhase` + `currentView`).
- **React ↔ Phaser bridge:** `MVP/src/game/EventBridge.ts` (`load-combat` in, `combat-ended` out) → `combatResultsHandler.ts`.
- **Run:** `cd MVP && npm run dev` → Vite on **http://localhost:3000**, boots straight to the world map (testing default). Requires browser width ≥ 1024px (else "Desktop Required"); ≤ 768px swaps to a separate mobile interface.
- **Build health:** runs cleanly via esbuild. **673 TypeScript errors** exist (mostly `src/combat/*`) but **do not block runtime** — there is **no `tsconfig.json`**, so types are never enforced. Adding one + cleanup is M6.
- **Known structural debt:** `CombatScene.ts` is ~9,500 lines (monolithic); two parallel combat implementations (Phaser `CombatLab` vs React `CompleteTacticalCombat` mock); `.patch.ts` files indicate unfinished integrations.

---

## 13. Asset & Data Inventory

| Asset | Count | Status |
|---|---|---|
| Cities | ~1,050 | ✅ with crime/economy/infra stats |
| Countries | ~168 | ✅ with political/economic/cultural stats |
| Weapons | 70+ | ✅ with range brackets |
| Armor | 50+ | ✅ with stopping power |
| Combat powers | 21 defined | 🟦 ~2 execute |
| Vehicles | 57 (33 wired + 24 dormant) | ✅/🟦 |
| Crime activities | 16 | ✅ simulated |
| Faction archetypes | 4 | ✅ |
| Sound effects | 381 catalog | 🟡 subset wired |

---

## 14. Open Design Questions & Risks

1. **Flight model** — how literal is altitude? Discrete height levels (e.g., 7) with per-level bonuses and ceilings, or a lighter "ground/air" toggle? Drives the combat rewrite scope.
2. **Powers scope** — implement all 21 defined, expand toward the design's larger ambitions, or prune to a curated executable set first?
3. **Time travel granularity** — checkpoints only, or free-rewind? Any cost/limit? How does it interact with the crime simulation and faction state?
4. **MP migration** — what minimal state-shape choices now prevent a painful local→networked refactor later (country ownership, deterministic sim, save format)?
5. **Mission→combat fidelity** — does enemy composition come from mission generation + crime/faction context, or default encounter sets for now?
6. **Biggest risk:** the combat *identity* (flight + powers) is the least-built and most-distinctive part. The roadmap intentionally reaches it at M4 — earlier prototyping may be warranted if it's the core selling point.

---

## 15. Appendix

**Glossary:** LSW = Living Super Weapon (recruitable superpowered character). FIST = the US-aligned faction. Sector = world-map tile containing cities/countries. Combined Effects = emergent systems from multiplied country/city stats.

**Source of truth:** TypeScript data files under `MVP/src/data/` and game logic under `MVP/src/game/` and `MVP/src/stores/`. This GDD supersedes the optimistic completion claims in `SuperHero_Tactics_Complete_Documentation.md` and `System_Implementation_Guide.md` where they conflict with verified status.

---

*This is a living document. Status tags reflect the codebase as audited 2026-06-25 and should be updated as milestones land.*
