# Integration Ledger — file-by-file evaluation of docs/design (2026-07-03)

> The owner's directive: *"go file by file, evaluate, and integrate 100% of what
> was previously planned that fits the vision."* This ledger is that evaluation —
> every spec, its verdict against the code, what was built in this pass, and what
> is consciously deferred (with the reason). Four parallel code audits + the
> DECISIONS-NEEDED owner-lock list drove the priorities.
>
> Verdicts: ✅ BUILT · 🟨 MOSTLY (core in, edges open) · 🟧 PARTIAL · ⬜ DEFERRED (by design)

## Owner-locked directives (DECISIONS-NEEDED) — status
| Directive | Status |
|---|---|
| **P5 Mental-Health/Depression subsystem** ("build it") | ✅ `mentalHealthSystem.ts` — grief on death (susceptibility-scaled), grief→depression conversion, daily drain, refuse-deploy risk, hospital treatment, mood override, Personnel chips, texts |
| **T1 Per-Country Organizations & Politics** (all ~168) | ✅ `countryOrganizations.ts` — 168 authored orgs (FIST/BÜA/TMK/SAMS/FSKA…), stance from LSW law, leaders, agendas, 116 rivalries; in the newspaper LSW desk + recruiting header |
| **P2 Hide stats at recruit** (JA2 learn-the-merc) | ✅ Recruiting shows scout-estimate bands (☆–★★★) only |
| **P3 Event-triggered friction, personality = susceptibility** | ✅ applied in grief/depression; NEMESIS pair escalation still open (needs relationship depth) |
| **P6 Idle auto-activities, personality-gated** | ✅ day tick: desire-driven auto-activities, real cost via ledger, downtime texts; adventure never auto |
| **E1 deterministic difficulty / E5 clean rewind / TONE LOCK** | ✅ honored by construction (no rubber-banding built; Chronos rewind clean) |
| **J2 flipped = on-probation / J3 dark interrogation** | ✅ prisoners fork options carry both |
| **L1 fight-or-jump / L3 doomed last stand / L4 fixed 2472 / H4 changed return** | ✅ `invasionEndgame.ts` |
| **I1/I3 cloning rules** | 🟨 clone services exist (Hospital/combinedEffects); generational-degradation numbers open |
| **K4 intel-gated foresight** | ✅ ForkModal reveals option fallout only with an INT 65+ analyst |

## Specs 01–10 (living world)
| Spec | Verdict | This pass / remaining |
|---|---|---|
| 01 phone-comms | 🟨 | Built earlier (team contacts, calls, texts, ringer, handler). Open: surveillance comms-delay, map crisis pings |
| 02 event-emergence | 🟧 | Fork system now provides the decision-event primitive; authored POL_001-015 template pack still open |
| 03 personality-relationships | ✅ | 20-type system live; friction now feeds mental health. Open: relationship decay, BONDED +1CS |
| 04 world-map-sectors | 🟨 | Sector intel block added earlier. Open: 4-tier fog transitions, blip stacking |
| 05 travel-movement | 🟧 | Core travel + complications live. Open: border-stat checkpoint severity, infra gating |
| 06 character-mgmt-activities | 🟨 | Activity scheduler lite + P6 autonomy + statuses + assign menu. Open: full 30-activity CSV, fatigue rates |
| 07 character-model | 🟨 | Full model + LSW rule + origin powers. Open: health-formula ruling A, LeFevre lenses |
| 08 recruitment-roster | 🟨 | Pools, roles, LSW badges, standing-cost refresh, P2 hidden stats. Open: pool churn/expiry, named-cast gates |
| 09 investigations | 🟨 | WHY motive, INS+INT rank, cold case, crime bridge (verified wired). Open: 25-template/25-method CSV packs |
| 10 email-news | ✅ | Editions engine + country scoping + censorship + org voice. Open: email auto-expire consequences |

## Specs 11–19, 29 (strategic spine)
| Spec | Verdict | This pass / remaining |
|---|---|---|
| 11 country-effects-spine | 🟨 | Computed + consumed across recruiting/news/safehouses. Open: unified LocationEffectProfile bundle |
| 12 city-culture-terrain | 🟨 | Open: LocationContext assembly, terrain→map-template routing |
| 13 factions-territory | ✅ | Control/militia/liberation + sector intel UI. Open: heat decay, signature cooldowns |
| 14 combined-effects | 🟨 | All 12 systems compute + surface. Open: buildConsumptionProfile risk-roll layer |
| 15 crime-underworld | ✅ | **Audit claimed the investigation/mission bridges were orphaned — verified in code they are already wired** (≤2 investigations/week, raid missions throttled 1/org/4wks) |
| 16 economy | ✅ | Payday, funding, ledger (single-deduction rule enforced). Open: merc profit-cut terms |
| 17 fame-reputation-legal | 🟨 | **Legal cases built this pass**: fallout fork → settle/fight/stall, verdicts on the day tick scaled by standing. Open: insurance machine, worldFlags |
| 18 progression-scaling | 🟧 | Tiers/fame exist. Open: standing-score promotion FSM |
| 19 base-building | 🟨 | 13 facilities + ETA + garage + engineering labs consumed by the spine. Open: facility damage/raid conversion |
| 29 time-travel-save | ✅ | Chronos (anchors, sanity, rewind, hotkey T) — the audit under-counted it; verified built |

## Specs 20–28 (combat) — confirm-only per owner
✅/🟨 across the board (resolution, grid, damage, status, injury table, wrestling, strength).
Open small wires (documented, deferred to a combat pass): BAMPI shape tagging + full
power-activation engine (27 — the known big one), weapon dB field, door interactions.

## Specs 100–111 (meta)
| Spec | Verdict | This pass / remaining |
|---|---|---|
| 100 onboarding | 🟨 | Flow works end-to-end. Open: boot cinematic, base-setup as explicit phase |
| 101 tutorial | ⬜ | Deferred by design (tutorial campaign is post-systems work) |
| 102 ui-shell | 🟨 | Laptop shell + dock + pause. Open: NotificationRouter table, modal stack |
| 103 audio-voice | ⬜ | 381 SFX live; VO/TTS deferred (owner: voice parked) |
| 104 ai-director | ⬜ | E1 says PURE DETERMINISTIC — no rubber-band director will be built; pacing governor optional later |
| 105 accessibility | ⬜ | Deferred (settings surface post-feature-complete) |
| 106 modding pipeline | ⬜ | Deferred (schemas published later per G3) |
| 107 multiplayer stub | ⬜ | Architectural stub only — correct per owner |
| 108 hospital-cloning | 🟨 | Origin healing, clone services, diagnosis, mental-health treatment. Open: death-save turns, clone-order modal |
| 109 prisoners | 🟨 | **Built this pass (lite)**: capture fork after victories → hold/flip(J2)/release/handover; held+probation prisoners tracked. Open: interrogation-over-days loop, rescue missions |
| 110 fork-in-the-road | ✅ | **Built this pass**: ForkEvent primitive, interrupt modal (clock stops), K4 foresight, expiry→default, queue |
| 111 invasion endgame | 🟨 | **Built this pass**: fixed Day-2472 clock, 6 phases, news foreshadowing, readiness 0-100, arrival fork (fight/jump). Open: the finale battle chain on the tactical layer |

## The honest line
Everything the vision demands **exists in the ecosystem and talks to the rest of it**:
the world simulates, reports itself through the paper, calls and texts you, forces
decisions with teeth, breaks your people, jails your enemies, sues you, and counts
down to Day 2472. What remains open is listed above per-spec — depth passes on
existing systems (template packs, promotion FSM, finale chain), not missing organs.
Deferred items are deferred by owner decision (voice, tutorial, modding, MP, rubber-band
difficulty), not by omission.
