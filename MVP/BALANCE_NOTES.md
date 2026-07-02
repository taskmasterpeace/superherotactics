# Balance Notes — GAME_COMPLETION_CRITERIA Pillar D

Running log of sim-battery results and balance changes. Battery: `npm run test:battery`
(mechanics, integration, belt, grenade — all headless via tsx).

## 2026-07-02 — Baseline (pre-Phase-5 wiring)

| Suite | Result | Notes |
|---|---|---|
| mechanicsTest | PASS | DR reduction, shield absorption, stopping power all working |
| integrationTest | PASS 7/7 | fire modes, mixed loadouts, all 6 weapon categories, adapter completeness, random stability, perf (2000+ fights/sec) |
| beltBonusTest | PASS | Even match 55.5/44.5 (within 35–65 band); Belt 1v5 44/56; 1v10 34/66; 5v10 42.5/57.5 — skill gaps produce correct win-rate ordering |
| grenadeTest | PASS | 5 grenade types, falloff, knockback, status effects all resolve |

Matched-loadout win rates within the 35–65% criteria band (D1): even-match belt duel
55.5/44.5 ✅; integrationTest's mixed-loadout checks pass in the 32–72 tolerance it asserts.

Outliers to watch: Belt 1 vs Belt 10 at 34/66 is *intended* (major skill gap should
break the matched band; the 35–65 criterion applies to MATCHED loadouts only).

## Pending

- Re-run battery after morale wiring lands in combat core (defaults keep parity —
  expect identical results; if morale defaults shift win rates, tune moraleAccuracyMod
  application here).
