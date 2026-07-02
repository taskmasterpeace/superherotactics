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

## 2026-07-02 — Post-Phase-5 wiring re-run

| Suite | Result | Notes |
|---|---|---|
| mechanicsTest | PASS | unchanged after morale wiring (defaults 0 preserve parity) |
| integrationTest | PASS 7/7 | mirror matches 49.2% / 52.4% — inside 35–65 band |
| beltBonusTest | PASS | even match 55.5/44.5; gap ordering intact (1v10 → 37/63) |
| grenadeTest | PASS | unchanged |

Full battery exit 0, zero failures. `npm run test:battery`.

## Balance changes (tuned from live smoke-testing)

1. **Country funding scale $5k–$200k → $1k–$15k/week** (`economySystem.ts`
   `calculateCountryFunding`). At the old scale the US paid ~$207k/week — the player
   could never go broke and base/facility prices ($8k–$500k) were trivial. New scale:
   US ≈ $15.7k/week after corruption tax. Weekly costs (wages $100/char, maintenance
   $15/item, upkeep) and big-ticket purchases stay meaningful; a shunned team can
   still hit bankruptcy (checkBankruptcy now runs every payday).
2. **Payday dedupe** (`timeEventGenerator.ts`): midnight-crossing hour events fired
   processDayChange up to 9× per rollover → payday paid up to 9× (masked before by a
   crash in isPayday on the store's date-less GameTime). Now: day/week counters
   dedupe, payday fires exactly once per week (day % 7 === 1, day 1 = Monday).
3. **Morale defaults**: store characters start at morale 75 = 'high' (+10 acc/+5 dmg).
   Symmetric for player squads; enemy generators carry no morale field → 0 mods.
   Watch: player advantage is intended (morale matters) but if it skews mission win
   rates, seed enemy morale from org discipline.
4. **Underworld raid rewards** ($20k + capital×600 + rep×250 ≈ $50k–$115k) are the
   dominant income source — intended: high-risk raids fund the operation, funding is
   the floor. Revisit after real combat difficulty data.
