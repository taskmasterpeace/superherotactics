# SHT Design-Spec Loop — Run Log & Checklist

> **This is the loop's memory.** The `sht-spec-loop` skill reads this file at the start of every pass and appends to it at the end. *The agent forgets; the repo doesn't.*
> **Goal:** expand `SHT_MECHANICS_BIBLE.md` (an index) into a **build-ready spec** — one system at a time — written under `docs/design/` using **real numbers from the source data** (never invented).
> **Done when:** every system below is `APPROVED` (independent reviewer ≥ 8/10).

---

## Locked design context (every pass must honor this)

- **Vision:** *"A living world that talks to you."* Stats + personalities are the **emergence engine**; the **phone & world-map** are how it reaches the player. Combat is one verb, not the point.
- **Combat is SYMBOLIC.** Plain grid + glyphs. **Flight = an altitude integer + a wing/shadow indicator**, NOT 3D. The full rules (damage types, wrestling, injury, knockback) still resolve on the grid. Spec combat **lighter** and **last**.
- **Events = HYBRID:** authored event/encounter/mission **templates**, *selected & parameterized* by country-stat + personality combos. Data-driven (Pillar #1).
- **Save = DIEGETIC ONLY:** each nation's **own time-traveler** is the only save/load — limited rewinds, **sanity cost**, fewer destinations each use. No normal save. Design the **rewind economy** to be *tense, not a brick wall*.
- **World clock = REAL-TIME WITH PAUSE** (CK/JA2; phone/laptop pauses; speed control).
- **Multiplayer = ARCHITECTURAL STUB:** the time-traveler's **other dimension IS multiplayer**. Design SP so it slots in later; don't fully spec MP.
- **Design rulings** from `SHT_MECHANICS_BIBLE.md` §13 are canon (ship `Universal_Table_FIXED`, one crit→injury pipeline, one throwing formula, BAMPI as a real attack descriptor, no XP leveling, unify on `allCountries`+`allCities`, combined-effects must be *consumed*).

## Source data (pull real numbers from here — never invent)
- `SuperHero Tactics/SuperHero Tactics World Bible.xlsx` (Country / Cities / Relations / Characters)
- `docs/csv-source-data/Game_Mechanics_Spec/*.csv` (the rules tables)
- `docs/csv-source-data/*.csv` (Combat Compendium, investigations, scaling, perception, …)
- `SuperHero Tactics/` (FIST GDD, Origins/Threat/Powers, Wrestling diagram, TerrainCodes, relations)
- The map of which table owns which system: `SHT_MECHANICS_BIBLE.md` §14.

---

## System checklist (priority order — work top to bottom)

Status legend: `TODO` · `DRAFTING` · `IN-REVIEW` · `NEEDS-OWNER` · `APPROVED`

| # | System | Tier | Status | Score | Spec file |
|---|--------|------|--------|-------|-----------|
| 1 | Phone & comms (texts/calls, priority, arrival pings, world-map notifications) | 1 Living world | TODO | — | — |
| 2 | Stat-driven event & emergence engine (hybrid templates × stats × personality) | 1 Living world | TODO | — | — |
| 3 | Personality & relationship engine (20 types; like/hate; decisions; idle; AI) | 1 Living world | TODO | — | — |
| 4 | World map & sectors (sectors = countries; fog; blips; notifications) | 1 Living world | TODO | — | — |
| 5 | Travel & movement (travel-time system; vehicles-as-travel) | 2 Management | TODO | — | — |
| 6 | Character management & daily activities & time | 2 Management | TODO | — | — |
| 7 | Character model & data schema (stats/origins/threat/skills/talents/identity/health) | 2 Management | TODO | — | — |
| 8 | Recruitment & roster (named World-Bible cast + procedural pool) | 2 Management | TODO | — | — |
| 9 | Investigations (templates/methods/skills/consequences) | 2 Management | TODO | — | — |
| 10 | Email-as-dialogue & News (laptop apps) | 2 Management | TODO | — | — |
| 11 | Country attributes → effects (THE SPINE) | 3 Spine | TODO | — | — |
| 12 | City types / culture / terrain effects | 3 Spine | TODO | — | — |
| 13 | Factions / relations matrix / territory control | 3 Spine | TODO | — | — |
| 14 | Combined-effects systems (cloning, black market, surveillance, …) | 3 Spine | TODO | — | — |
| 15 | Crime / underworld | 3 Spine | TODO | — | — |
| 16 | Economy (money / payday / wages) | 3 Spine | TODO | — | — |
| 17 | Fame / reputation / public perception / legal consequences | 3 Spine | TODO | — | — |
| 18 | Progression & scaling (6 tiers) | 3 Spine | TODO | — | — |
| 19 | Base building & facilities | 3 Spine | TODO | — | — |
| 20 | Core resolution engine (4CS Universal Table / stats / ranks / column shifts) | 4 Combat (symbolic) | TODO | — | — |
| 21 | Tactical combat: symbolic grid (turn/AP/init/stances/grid/move/range/LOS/cover) + flight-as-indicator | 4 Combat (symbolic) | TODO | — | — |
| 22 | Damage model & damage types | 4 Combat (symbolic) | TODO | — | — |
| 23 | Criticals & injury pipeline | 4 Combat (symbolic) | TODO | — | — |
| 24 | Status effects | 4 Combat (symbolic) | TODO | — | — |
| 25 | Strength / lifting / throwing / environmental | 4 Combat (symbolic) | TODO | — | — |
| 26 | Wrestling / grappling / martial arts | 4 Combat (symbolic) | TODO | — | — |
| 27 | Powers + BAMPI + Power Activation Engine | 4 Combat (symbolic) | TODO | — | — |
| 28 | Equipment (weapons/armor/ammo/gadgets/vehicles-in-combat/sound/doors) | 4 Combat (symbolic) | TODO | — | — |
| 29 | Time-travel save (diegetic-only; per-nation travelers; rewind economy; dimension=MP stub) | 5 Meta | TODO | — | — |
| 30 | Story / factions / content framework | 5 Meta | TODO | — | — |

## ▶ RESUME HERE (state as of 2026-06-25)

**Spec corpus: ~31 / 42 systems APPROVED.** Spec files live in `docs/design/NN-*.md` (glob to see exactly which).
**Pending 11 — re-run the spec loop after session/rate limits reset (3:40pm ET):** #26 wrestling-martial-arts · #27 powers-bampi · #29 time-travel-save · #30 story-content · #101 tutorial · #103 audio-voice · #104 ai-director · #106 modding · #107 mp-dimension-stub · #108 hospital-cloning · #109 prisoners.
**Decisions:** big batch ANSWERED in `docs/design/DECISIONS-NEEDED.md` (✅ block at top). Tone lock = **hardcore · dark/mature · JA2-heroic · competitive-integrity**. Run 2 surfaced *more* owner-forks (in the workflow output) — still to be folded into DECISIONS-NEEDED.

**CRIME/UNDERWORLD (#15): IMPLEMENTED, browser-verified, regionalized — 10/10.** Crimes now spawn investigations (≤2/wk) + `underworld` raid missions (≤1/org, deduped, scaled rewards, completion → declining/eliminated). Org type/name/specialties are REGIONAL via an authored ISO→region map. Fixed a dormancy bug (sim resolved country by *code* but onboarding stores a *name*). Details in memory `sht-mechanics-data.md`.

**NEXT ACTIONS (priority order):**
1. After limits reset → re-run the spec loop to finish the 11 pending specs.
2. Fold run 2's new owner-forks into `DECISIONS-NEEDED.md`; get owner answers.
3. Generalize `getCrimeRegion(country)` → a shared `getRegion(country)` + region profiles so EVERY system pulls regional looks/behavior (owner's "everything is regional" law). Reuse the authored ISO map — do NOT trust `cultureCode` (it's inconsistent: US cities mis-tagged 14, Mexico country mis-tagged 13).
4. Pick the next *built* system to verify-and-tweak-to-10/10 in the browser (most systems are still specs, not wired).

**Run it:** `npm --prefix MVP run dev` → open `localhost:3000/?dev=true`. Dev hook: `window.__gameStore = useGameStore` (main.tsx) lets you drive the store from the browser console.

---

**Target ≈ 42 systems** (30 core + 12 added by the completeness critic). Run-1 approved: #3 personality-relationships · #100 onboarding · #102 ui-shell · #105 accessibility · #110 fork-in-the-road-ui · #111 alien-endgame.

---

## ⚑ Decisions needed from owner (batched — do NOT stall on these)
*The loop appends genuine design forks here that the data can't settle. Owner answers in batches.*

- _(none yet)_

---

## Run log (append one entry per pass — newest at top)
*Format: `### [pass N] <system> — <verdict> (score)` then: action taken · evidence/source tables used · reviewer notes · lessons · what's left.*

### [run 1] full-fanout spec pass — PARTIAL (server rate-limited)
- Fired all 30 core writers + completeness pass at once; server-side rate-limiting ("not your usage limit") killed most core writers mid-flight.
- Result: 6 approved, 7 drafted-but-unreviewed, 29 core systems not written. ~60 owner-forks surfaced. 56 agents / ~4.3M tokens / ~20 min.
- Lesson: cap concurrency. A ~30-agent burst trips the rate limiter; process in small batches.

### [run 2] throttled completion — IN PROGRESS (`w1bh5y4ds`)
- Batches of 4 (write missing core + re-review the 7 drafted). Low-burst to stay under the limiter.
