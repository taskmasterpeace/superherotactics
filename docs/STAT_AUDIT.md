# Stat Audit — Every Statistic Matters (Criterion C1)

Audit of every character stat, derived stat, skill, morale field, and armor field:
is it actually consumed by a game system (**WIRED**, with file:line), or defined but
never read (**DEAD**, with why that is acceptable for now)?

All paths relative to `MVP/src/`. Line numbers as of 2026-07-02; they will drift with edits
but the function names are stable anchors.

There are two combat engines, audited separately where behavior differs:
- **Headless sim** — `combat/core.ts` + `combat/battleRunner.ts` operating on `SimUnit` (`combat/types.ts:529`)
- **Tactical scene** — `game/scenes/CombatScene.ts` operating on its own `Unit` interface

## Primary Stats (MEL / AGL / STR / STA / INT / INS / CON)

| Stat | Status | Where it matters |
|------|--------|------------------|
| MEL | **WIRED** | Melee defense evasion (`combat/core.ts:366`), inside-guard bonus vs armed attackers (`combat/core.ts:387`), melee damage bonus (`combat/core.ts:499`); CombatScene melee damage +2 per 10 MEL over 50 (`game/scenes/CombatScene.ts:6650`); martial arts technique gating |
| AGL | **WIRED** | Attacker accuracy (`combat/core.ts:394`), target evasion (`combat/core.ts:412`); CombatScene AP pool 4+AGL/20 (`CombatScene.ts:2554`), hit chance (`CombatScene.ts:5231`), live attack accuracy (`CombatScene.ts:6624`); HP minor bonus (`combat/types.ts:935`); derived initiative/dodge (`data/characterSheet.ts:403-406`) |
| STR | **WIRED** | CombatScene damage bonus +STR/10 (`CombatScene.ts:6644`), knockback body weight via `getCharacterWeight` (`CombatScene.ts:6034`, `data/strengthSystem.ts`); derived carryCapacity (`characterSheet.ts:407`). NOTE: `SimUnit` has no STR — the headless sim folds strength into MEL; acceptable while the sim is used for balance batteries, not knockback |
| STA | **WIRED** | CombatScene max HP = 50 + STA (`CombatScene.ts:2552`, `2619`); derived health formula (`characterSheet.ts:398`) |
| INT | **WIRED** (this pass) | Investigations: progress multiplier `1 + (INT-50)/200` (±25% at INT 100/0) for the assigned investigator (`stores/enhancedGameStore.ts:3156-3157`, `advanceInvestigationProgress`); CombatScene hit chance +1% per 5 INT over 50 (`CombatScene.ts:5235`); AI personality selection (`CombatScene.ts:1232`). Present in `SimUnit.stats` but unread by `core.ts` — acceptable: INT is a strategic-layer stat, the scene engine covers combat |
| INS | **WIRED** | Flanking defense — reduces bonus against you (`combat/core.ts:245-247`); overwatch setup and reaction chance (`combat/advancedMechanics.ts:207`, `238`); CombatScene vision/detection range 12+INS/10 (`CombatScene.ts:2729`), flank-exploitation bonus (`CombatScene.ts:5240`) |
| CON | **WIRED** | Main HP stat in headless sim, +2 HP per point (`combat/types.ts:934`); CombatScene steady-hands accuracy +2% per 10 over 50 (`CombatScene.ts:5252`); enemy generation scaling (`combat/enemyGeneration.ts:245`) |

### SimUnit-only stats

| Stat | Status | Where it matters |
|------|--------|------------------|
| RNG | **WIRED** | Ranged accuracy +1% per 2 RNG over 15 (`combat/core.ts:403`). CombatLab maps AGL→RNG when converting characters (`components/CombatLab.tsx:259`) — a real RNG stat on characters is a future improvement |
| WIL | **WIRED** | Suppression resistance (`combat/advancedMechanics.ts:304-306`), panic/morale checks (`advancedMechanics.ts:365-368`), rally chance (`advancedMechanics.ts:445-446`), minor HP (`combat/types.ts:936`). CombatLab maps CON→WIL (`CombatLab.tsx:263`) |

## Derived Stats (`data/characterSheet.ts:379-410`)

| Stat | Status | Notes |
|------|--------|-------|
| health / maxHealth | **WIRED** | Seeds character health at creation (`characterSheet.ts:2575-2576`) |
| initiative | **DEAD** | Computed but combat uses team-alternating turn order, not per-unit initiative. Acceptable: initiative order is a design decision deferred until the XCOM-style 2-action system (`SimUnit.turnState`) is finished |
| karma | **DEAD** | FASERIP holdover; no karma-spend system exists yet. Acceptable: documented design intent, no consumer |
| dodgeMelee / dodgeRanged | **DEAD** | Both engines derive dodge directly from AGL/MEL at the point of the roll (`core.ts:366`, `412`) — the precomputed CS values are redundant, not missing |
| carryCapacity | **DEAD** | Inventory has no weight limits yet. Acceptable for MVP |
| movementSpeed | **DEAD** | Constant 6; tactical movement is AP-driven (`CombatScene.ts:2554`). Acceptable |

## Skills (education system)

| Skill | Status | Where it matters |
|-------|--------|------------------|
| tactical_assessment | **WIRED** | +5% accuracy when flanking (`CombatScene.ts:5265`) |
| squad_command | **WIRED** | +3% accuracy aura within 4 tiles (`CombatScene.ts:5272-5282`) |
| marksmanship | **WIRED** | +3% ranged accuracy (`CombatScene.ts:5287`) |
| combat_focus | **WIRED** | +4% accuracy vs targets in cover (`CombatScene.ts:5292`) |
| room_clearing | **WIRED** | +10% accuracy vs clustered enemies (`CombatScene.ts:5301`) |
| Education fields (investigations) | **WIRED** | Approach-matched education bonus multiplies progress (`enhancedGameStore.ts:3126-3144`) |
| Martial arts belts | **WIRED** | Belt level accuracy bonus in melee (`combat/core.ts:465`), style/technique systems |

## Morale (`data/characterSheet.ts:729-819`)

| Field | Status | Where it matters |
|-------|--------|------------------|
| accuracyModifier (+15..-30) | **WIRED** (this pass) | Carried onto both unit shapes as `moraleAccuracyMod` (`combat/types.ts:598`, `CombatScene.ts:958`). Applied in the headless sim (`combat/core.ts:458-459`, `calculateAccuracy`) and CombatScene hit chance (`CombatScene.ts:5250-5251`) plus live attack resolution (`CombatScene.ts:6623-6624`). Passed at all three spawn/factory sites via `MORALE_EFFECTS[getMoraleLevel(char.morale ?? 50)]`: blue spawn (`CombatScene.ts:2568`, `2593-2594`), red spawn (`CombatScene.ts:2630`, `2655-2656`), SimUnit factory (`components/CombatLab.tsx:238`, `264-265`). Defaults to 0 when morale is absent (morale 50 = 'good' = 0 mod) so presets, tests, and sims are unchanged |
| damageModifier (+10..-15) | **WIRED** (this pass) | `moraleDamageMod` applied as % in `getBaseDamage` (`combat/core.ts:513-514`, covers `resolveAttack` and `advancedMechanics` melee) and CombatScene base damage (`CombatScene.ts:6664-6665`) |
| disobedienceRisk | **DEAD** | No order-refusal roll yet. Acceptable: needs a command/order layer; documented follow-up |
| desertionRisk | **DEAD** | No daily desertion tick. Acceptable: same follow-up as above |
| panicLevel (combat-local) | **WIRED** | In-combat panic accuracy/evasion (`combat/core.ts:446-453`), morale checks/rally (`advancedMechanics.ts:359+`). Distinct from strategic morale by design: panic is per-battle, morale persists between battles |

## Armor Fields (`combat/types.ts:327-354`, `data/armor.ts`)

| Field | Status | Where it matters |
|-------|--------|------------------|
| drPhysical | **WIRED** | Feeds `SimUnit.dr` via `calculateArmorProtection` (`combat/types.ts:370`), applied in damage pipeline (`combat/core.ts:607-614`); CombatScene DR from `getArmorForUnit` (`CombatScene.ts:2589`) |
| stoppingPower | **WIRED** | Blocks damage ≤ SP (`combat/core.ts:596-605`); CombatScene armor gate (`CombatScene.ts:~6810`) |
| shieldHp / shieldRegenRate / shieldRegenDelay | **WIRED** | Shield absorption + regen (`combat/core.ts:586-589`, `combat/types.ts:607-631`) |
| drEnergy | **DEAD** | Computed by `armorIntegration.ts:50`, `123` and carried on `SimArmor`, but `calculateFinalDamage` applies only `unit.dr` (physical). Acceptable for now: needs per-damage-type DR selection in the pipeline; energy weapons already differentiate via `armorEffectiveness` on the damage type (`core.ts:530-545`) |
| drMental | **DEAD** | Same as drEnergy; mental attacks currently bypass via damage-type `armorInteraction` flags instead |
| caliberRating | **DEAD** | Data present on all 50+ armors (`data/armor.ts`), no caliber-vs-rating check in either engine. Acceptable: stoppingPower approximates it; JA2-style caliber matching is a balance-pass feature |
| coverage | **DEAD** | Carried and shown in Encyclopedia (`components/Encyclopedia.tsx:507`); no hit-location system exists. Acceptable until called shots land |
| condition / conditionMax | **DEAD** | No armor degradation loop; armor never loses condition in combat. Acceptable for MVP; flagged for the durability pass |
| movementPenalty / stealthPenalty | **DEAD** | Defined on armor data and copied into store state (`enhancedGameStore.ts:2586-2587`) but not read by movement AP or detection. Acceptable: stealth system is not built yet |
| penetrationMult (weapon) | **WIRED** (scene only) | AP rounds reduce effective DR (`game/scenes/weaponIntegration.ts:230`, applied `CombatScene.ts:~6820`). Not in the headless `SimWeapon` — acceptable, sim weapons are normalized presets |

## Summary of this pass

Two highest-value dead stats wired:

1. **Morale → combat**: `MoraleState.accuracyModifier/damageModifier` were defined and used only in
   characterSheet's own demo hit calc; both real engines now consume them (see Morale table).
   Behavior is identical when morale is not provided (modifiers default to 0).
2. **INT → investigations**: investigation progress was INT-independent; the assigned investigator's
   INT now multiplies `progressGained` by `1 + (INT-50)/200`, stacking with education and base
   facility bonuses (`enhancedGameStore.ts:3156-3157`).

Remaining DEAD entries above are each documented with the system they wait on
(order layer, hit locations, durability, caliber matching, stealth, initiative order).
