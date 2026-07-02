---
name: sht-spec-loop
description: >-
  One-command orchestration loop that expands SuperHero Tactics' design (SHT_MECHANICS_BIBLE.md) into a
  build-ready spec — one system per pass — writing per-system spec files under docs/design/ from the REAL
  source-data numbers, with an INDEPENDENT reviewer grading each spec >=8/10 before it counts. Runs the
  Observe -> Choose -> Spec -> Review -> Record -> Repeat cycle full-send across the priority-ordered
  checklist in docs/design/PROGRESS.md until every system is APPROVED, batching owner-only design forks
  rather than stalling. Use when the owner says "run the spec loop", "/sht-spec-loop", "keep speccing
  the design", or wants to continue deepening the SHT design. Materialized by /looper-build from an
  approved /looper-design plan.
---

# SHT Design-Spec Loop

Turn the SHT Mechanics Bible into a **build-ready design spec, one system at a time**, self-graded by an
independent reviewer, until the whole checklist is `APPROVED`. This skill IS the loop — invoking it runs
the whole thing.

## Goal & definition of done
- **Goal (owner's words):** "Finish the design first — expand the Bible into a full build-ready spec, every
  system fully specified with the exact numbers from my data, self-reviewed, contradictions resolved."
- **Done when:** every system in `docs/design/PROGRESS.md` is `APPROVED` (reviewer score ≥ 8/10).

## Non-negotiable context (re-read every pass; it's also in PROGRESS.md)
- Vision: **"a living world that talks to you"** — stats + personalities are the emergence engine; the
  phone & world-map are how it reaches the player. **Combat is symbolic & specced last/lighter**
  (flight = altitude integer + wing/shadow glyph; rules still resolve on a plain grid).
- **Never invent a number.** Every value/formula must trace to a named source table. If the data lacks it,
  make a *ruling consistent with the Bible §13* and label it `RULING`, or raise an owner fork (below).
- Locked decisions: **events = hybrid** (authored templates × stat/personality); **save = diegetic-only**
  (per-nation time-traveler, rewind economy, no normal save); **world clock = real-time-with-pause**;
  **MP = architectural stub** (dimension = MP). Honor Bible §13 rulings.

## The six-step cycle (one pass = one system)
1. **OBSERVE.** Read `docs/design/PROGRESS.md`. Pick the **highest item not yet `APPROVED`** (top-down =
   priority order). Read `SHT_MECHANICS_BIBLE.md` for that system and identify its **source tables** (Bible §14).
2. **CHOOSE.** Mark that system `DRAFTING` in PROGRESS.md.
3. **SPEC (act — one bounded artifact).** Dispatch a **spec-writer subagent** (Agent tool) to read the
   actual source CSV/xlsx tables and write `docs/design/<NN>-<system-slug>.md` — a developer-ready spec:
   data schema · exact numbers/formulas (cited to source) · edge cases & failure modes · UI/UX hooks ·
   **how it consumes the spine** (which country/city/personality stats drive it) · open questions resolved
   with `RULING:` notes · explicit `OWNER-FORK:` notes for anything only the owner can decide.
4. **REVIEW (verify — independent).** Dispatch a **separate reviewer subagent** (never the writer) to grade
   the spec against the rubric below and return `score /10` + specific fixes. If **< 8**, send fixes back to
   a writer subagent (**max 2 revisions**), then re-review. If still < 8 after 2 revisions → `stagnated`.
5. **RECORD.** Update PROGRESS.md: set status (`APPROVED` / `NEEDS-OWNER` / `stagnated`), the score, the
   spec-file path, and append a **run-log entry** (action · source tables used · reviewer verdict · lessons ·
   what's left). Append any `OWNER-FORK:` items to the **"Decisions needed from owner"** section.
6. **REPEAT or STOP.** If unresolved owner-forks block the *current* system, set it `NEEDS-OWNER`, skip to
   the next system, and keep going. Continue until a terminal state.

## Verification rubric (the ≥8/10 build-ready bar)
- **Grounded (0–3):** every number/formula traces to a named source table; nothing invented (un-cited
  values = automatic fail).
- **Complete (0–3):** schema + formulas + edge cases + failure modes + UI hooks + spine-consumption present.
- **Consistent (0–2):** no contradiction with other approved specs or Bible §13 rulings.
- **Buildable (0–2):** a coding agent could implement it with **zero** follow-up questions.
Pass = total ≥ 8 **and** Grounded ≥ 2. The reviewer returns `{score, pass, fixes[]}`.

## Execution skills / agents it stands on
- **Agent tool subagents:** a *spec-writer* (reads source data, writes the spec) and a *separate
  independent reviewer* (grades). They MUST be different invocations (no self-approval).
- Source data: World Bible xlsx + `docs/csv-source-data/**` + `SuperHero Tactics/**` (read via the xlsx
  skill / Read / Grep). The Bible (`SHT_MECHANICS_BIBLE.md`) for system→table mapping.
- No external/network/production calls. This loop only **reads data and writes markdown** under `docs/design/`.

## Named terminal states (never report an error or skipped work as success)
- **success** — all 30 systems `APPROVED`. Print the final scoreboard.
- **needs-owner** — only systems blocked on owner-forks remain. Stop and surface the batched fork list.
- **stagnated** — a system failed review twice without progress. Mark it, surface why, continue others;
  if ALL remaining are stagnated, stop and report.
- **clean no-op** — every system already `APPROVED` on entry. Say so; do nothing.
- Prefer a **no-progress stop** to an invented time/iteration limit (owner chose full-send; no token cap).

## Memory contract
- **Start of every pass:** read `docs/design/PROGRESS.md` (the source of truth for what's done/left).
- **End of every pass:** append the run-log entry + update the checklist row. Spec files live beside it in
  `docs/design/`. If the session is summarized/restarted, the next run resumes purely from PROGRESS.md.

## Approval boundaries
- Writing/Editing markdown under `docs/design/` is safe and needs no approval.
- **Owner-forks** (genuine product/design choices the data can't settle) are *recorded and batched*, never
  guessed as if settled. The loop keeps working other systems while they wait.
- Do not touch game code, run builds, or change anything outside `docs/design/` in this loop. (Implementation
  is a *later, separate* loop built from these specs.)

## Loop-training-mode
- Owner chose **full-send**, so training-mode is **OFF by default** — the loop runs system→system without
  per-step approval, pausing only for terminal states / owner-forks.
- To run **one supervised pass first** (recommended before turning it loose): invoke with the argument
  `training` — the loop will pause after the FIRST system with *"Quick check before I keep going — proceed?"*
  Turn it off again by invoking normally.

## Trigger
- **One-shot orchestration skill.** Invoking `/sht-spec-loop` runs the entire loop to a terminal state.
  Nothing else to wire. Monitor progress in `docs/design/PROGRESS.md`.
