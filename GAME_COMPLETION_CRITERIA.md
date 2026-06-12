# SuperHero Tactics — Overnight Completion Criteria

**Started**: 2026-06-12 ~3:45 AM
**Deadline**: 2026-06-12 10:00 AM
**Mandate**: A complete, connected game. Everything matters. Every statistic matters.
Time travel = the save/reload mechanic. AAA detail, indie vibes. Balanced and playtested.

This document is the contract. The loop does not stop until every box is checked
and the Final Approval section says APPROVED.

---

## A. CORE PILLAR: Everything Connects (Phase 5 wiring)

- [ ] **A1. Faction standings wired to missions** — completing/failing missions changes
      faction standings per `missionFactionEffects.ts`; cascades to related factions;
      bounties trigger at -25; changes surface as notifications/news.
- [ ] **A2. Territory control live** — `initTerritorySystem()` called; sector control
      shown on world map grid; combat outcomes shift control %; controlled sectors
      generate income + fame applied to the economy on daily/weekly tick.
- [ ] **A3. Base bonuses live** — medical bay speeds healing, intel center speeds
      investigations, training room speeds education, workshop affects crafting;
      bonuses visible in the relevant UIs.
- [ ] **A4. Squad management UI** — create/rename/disband squads, assign characters,
      MBTI morale displayed, vehicle assignment, deploy squad as a unit on world map.
- [ ] **A5. Country/city stats matter** — location effects (healthcare, corruption,
      LSW policy, etc.) feed missions, prices, services via `locationEffects.ts` /
      `combinedEffects.ts`; verified reachable from gameplay, not just data.

## B. CORE PILLAR: Time Travel (save/reload as in-fiction mechanic)

- [ ] **B1. Chronos system** — `chronoSystem.ts`: timeline snapshots of full game state
      taken automatically at meaningful beats (day rollover, mission complete, pre-combat)
      plus manual "anchor" creation.
- [ ] **B2. Travel to the past = load** — UI (Chronos device on laptop/phone) lists
      timeline anchors with timestamp, day, squad status, money; choosing one restores
      that snapshot. In-fiction: your time traveler jumps back.
- [ ] **B3. Timeline integrity** — snapshots persist (localStorage), survive refresh,
      capped ring buffer (e.g. 20 anchors) so storage doesn't bloat.
- [ ] **B4. Consequences flavor** — jumping back generates a news item / log entry
      ("temporal anomaly detected") so the mechanic lives inside the fiction.
- [ ] **B5. The time traveler exists** — a designated character/asset representing the
      time traveler; travel unavailable if they're dead/absent (with sensible default
      so the player is never hard-locked).

## C. CORE PILLAR: Every Statistic Matters

- [ ] **C1. Character stats audit** — MEL/INT/INS/CON + skills verified to affect combat,
      investigations, training, morale. Any dead stat gets wired or documented.
- [ ] **C2. Weapon/armor stats audit** — range brackets, DR, stopping power, damage types
      all active in combat resolution.
- [ ] **C3. Country stats audit** — each of the 12 combined-effect systems reachable
      in-game (at minimum: surfaced via location info panels affecting prices/options).
- [ ] **C4. Economy loop closed** — income (missions, territory) vs. costs (wages,
      facilities, travel) both flowing; player can go broke; payday works.

## D. BALANCE & PLAYTEST (it's tested, it says approved)

- [ ] **D1. Combat sim battery** — run existing battle runner / tournament harness;
      no crashes; win rates for matched loadouts within 35–65%.
- [ ] **D2. Mechanics tests pass** — `mechanicsTest.ts`, `integrationTest.ts`,
      `beltBonusTest.ts`, `grenadeTest.ts` run clean.
- [ ] **D3. Balance pass documented** — outliers found by sims get tuned; changes
      logged in `BALANCE_NOTES.md`.
- [ ] **D4. Full-loop smoke test** — scripted/manual walkthrough: new game → recruit →
      equip → deploy → combat → results → faction/territory/news effects → heal →
      time-travel back → state correctly restored.

## E. POLISH (AAA detail, indie vibes)

- [ ] **E1. `npm run build` clean** — zero TypeScript errors.
- [ ] **E2. No console errors** on main screens (laptop, world map, combat).
- [ ] **E3. UI coherence** — Chronos UI + squad UI + territory display match the
      existing retro/laptop aesthetic; hover states; no placeholder lorem.
- [ ] **E4. Docs updated** — CLAUDE.md layer tables reflect reality; GAME_PLAN.md
      Phase 5 checked off; this file's boxes checked with evidence notes.
- [ ] **E5. All work committed and pushed** in conventional-commit chunks.

## F. EXPLICITLY OUT OF SCOPE (tonight)

- Real multiplayer netcode (the JA2-style "marriage" is design-noted in
  `docs/MULTIPLAYER_DESIGN_NOTES.md`, not implemented).
- New art/sound assets beyond what exists.
- Mobile/responsive support.

---

## Final Approval

Status: **IN PROGRESS**

When every box above is checked, run the full sim battery + build one last time,
then change status to **APPROVED** with a summary of evidence.

## Progress Log

- 03:45 — Criteria established. Prior uncommitted work (47 files) committed & pushed (b6f550c).
