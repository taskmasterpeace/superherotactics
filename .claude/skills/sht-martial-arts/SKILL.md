---
name: sht-martial-arts
description: Design and balance martial arts styles, techniques, belt progression, and grapple mechanics for SuperHero Tactics hand-to-hand combat.
---

# SHT Martial Arts Designer

You specialize in the martial arts combat system including styles, techniques, belt ranks, and the grapple state machine.

## Key Data Files

- `MVP/src/data/martial-arts.json` - Complete martial arts data (16KB)
- `MVP/src/game/systems/MartialArtsSystem.ts` - Runtime calculations
- `MVP/src/game/EventBridge.ts` - GrappleState enum
- `MVP/src/components/GrapplePanel.tsx` - Grapple UI (397 lines)

## Belt Rank System

10 belt ranks with progressive bonuses:

| Rank | Belt         | Bonus |
|------|--------------|-------|
| 1    | White        | +0    |
| 2    | Yellow       | +1    |
| 3    | Orange       | +2    |
| 4    | Green        | +3    |
| 5    | Blue         | +4    |
| 6    | Purple       | +5    |
| 7    | Brown        | +7    |
| 8    | Black        | +10   |
| 9    | Black I      | +12   |
| 10   | Black II     | +15   |

## Fighting Styles

### 1. Grappling (Control Style)
**Purpose**: Control opponent, set up submissions
**Techniques**:
- Clinch (Belt 1) - Initiate grapple
- Takedown (Belt 2) - Move to ground
- Hip Throw (Belt 3) - Knockback + damage
- Suplex (Belt 5) - High damage throw
- Slam (Belt 6) - Area damage
- Pin (Belt 4) - Immobilize opponent
- Lift & Carry (Belt 7) - Move with opponent
- Pile Driver (Belt 8) - Finisher move

### 2. Submission (Finisher Style)
**Purpose**: End fights with locks/chokes
**Techniques**:
- Guard Pull (Belt 2) - Defensive position
- Armbar (Belt 3) - Arm lock damage
- Triangle Choke (Belt 4) - Choke from guard
- Rear Naked Choke (Belt 5) - Back control choke
- Kimura (Belt 6) - Shoulder lock
- Heel Hook (Belt 7) - Leg lock
- Neck Crank (Belt 8) - Submission finisher

### 3. Striking (Damage Style)
**Purpose**: Deal damage on feet
**Techniques**:
- Jab (Belt 1) - Fast, low damage
- Cross (Belt 2) - Power punch
- Hook (Belt 3) - Side attack
- Uppercut (Belt 4) - High damage
- Front Kick (Belt 2) - Ranged strike
- Roundhouse (Belt 4) - Sweeping kick
- Spinning Back Fist (Belt 6) - 360 strike
- Knee Strike (Belt 5) - Clinch damage
- Elbow (Belt 5) - Close range, cuts
- Flying Knee (Belt 8) - Jump attack

### 4. Defensive (Survival Style)
**Purpose**: Avoid and counter damage
**Techniques**:
- Block (Belt 1) - Reduce damage
- Parry (Belt 2) - Deflect + counter
- Slip (Belt 3) - Dodge punches
- Counter (Belt 4) - Attack after dodge
- Sprawl (Belt 3) - Defend takedown
- Technical Stand-Up (Belt 5) - Escape ground
- Breakfall (Belt 2) - Reduce throw damage

## Grapple State Machine

```typescript
enum GrappleState {
  NONE = 'none',           // Standing, not grappling
  STANDING = 'standing',   // Clinch position
  GROUND = 'ground',       // On ground, neutral
  PINNED = 'pinned',       // Opponent has control
  SUBMISSION = 'submission', // In a lock/choke
  RESTRAINED = 'restrained', // Cannot move
  CARRIED = 'carried'      // Being carried
}
```

**State Transitions**:
```
NONE -> STANDING (Clinch)
STANDING -> GROUND (Takedown)
STANDING -> NONE (Break clinch)
GROUND -> PINNED (Pin)
GROUND -> SUBMISSION (Apply lock)
PINNED -> SUBMISSION (Transition)
SUBMISSION -> NONE (Escape or tap)
```

## Technique Interface

```typescript
interface Technique {
  id: string;
  name: string;
  style: 'grappling' | 'submission' | 'striking' | 'defensive';
  beltRequired: number;    // 1-10
  apCost: number;          // Action points
  baseDamage: number;
  damageType: string;

  // Hit calculation
  primaryStat: 'MEL' | 'STR' | 'AGL';
  hitFormula: string;

  // Effects
  knockback?: number;
  statusEffect?: string;
  grappleTransition?: GrappleState;

  // Counters
  counteredBy?: string[];
}
```

## Hit Chance Formula

```
HitChance = MEL + BeltBonus + (PrimaryStat / 4) - (DefenderAGL / 3)
```

**Example**:
- Attacker: MEL 50, Brown Belt (+7), STR 30
- Defender: AGL 40
- `HitChance = 50 + 7 + (30/4) - (40/3) = 50 + 7 + 7.5 - 13.3 = 51.2%`

## Damage Formula

```
Damage = BaseDamage + StrengthBonus(STR) + BeltBonus
```

**STR Bonus** (from strengthSystem.ts):
- STR < 10: +0
- STR 10-19: +(STR-10)/2
- STR 20-29: +5 + (STR-20)/2
- STR 30+: +10 + (STR-30)

## AP Costs by Technique

| Technique Type    | AP Cost |
|-------------------|---------|
| Light strikes     | 1       |
| Heavy strikes     | 2       |
| Clinch/Takedown   | 2       |
| Throws            | 3       |
| Submissions       | 3-4     |
| Finishers         | 4       |

## Balance Considerations

1. **Belt Progression**: Each rank should provide meaningful but not overpowering bonus
2. **Style Roles**: Grappling controls, Submission finishes, Striking damages, Defensive survives
3. **Counter Play**: Each style should have counters
   - Striking beats Grappling (in standing)
   - Grappling beats Striking (once clinched)
   - Defensive can counter both
   - Submission requires Grappling setup
4. **AP Economy**: High damage = high cost
5. **Technique Gates**: Belt requirements prevent overpowered early access

## Example Queries

- "Add a new technique to Submission style at belt level 5"
- "Balance the Pile Driver damage (30) against its AP cost (4) and belt requirement"
- "Design a new 'Dirty Fighting' style with low-honor techniques"
- "Calculate effective DPS for a Black Belt II striker vs Brown Belt grappler"
- "Create technique tree showing unlock progression for all styles"

## New Technique Template

```yaml
id: "tech_new_001"
name: "New Technique Name"
style: "grappling"
beltRequired: 5
apCost: 3
baseDamage: 15
damageType: "SMASHING_MELEE"
primaryStat: "STR"
description: "Description of the technique and how it's performed"
knockback: 1
statusEffect: null
grappleTransition: "GROUND"
counteredBy: ["sprawl", "counter"]
```
