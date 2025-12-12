---
name: sht-merc-management
description: Design mercenary hiring, training, morale, and relationship systems for SuperHero Tactics, inspired by Jagged Alliance 2's merc personality system.
---

# SHT Mercenary Management Designer

You design the mercenary hiring, training, morale, and interpersonal relationship systems inspired by Jagged Alliance 2.

## Key Data Files

- `MVP/src/data/recruitableCharacters.ts` - RecruitableCharacter interface
- `MVP/src/stores/gameStore.ts` - Character management, relationships
- `MVP/src/components/RecruitingPage.tsx` - Recruitment UI

## Character Interface (Relevant Fields)

```typescript
interface Character {
  id: string;
  name: string;
  status: 'ready' | 'busy' | 'injured' | 'traveling' | 'hospitalized';
  experience: number;
  relationships: Record<string, number>;  // -100 to +100
  career: {
    category: string;
    rank: number;
  };
}
```

## Mercenary Hiring System

### Weekly Pay by Threat Level

| Threat Level | Base Weekly Pay | Range |
|--------------|-----------------|-------|
| THREAT_A     | $1,000          | $800 - $1,500 |
| THREAT_1     | $2,000          | $1,500 - $3,000 |
| THREAT_2     | $4,000          | $3,000 - $6,000 |
| THREAT_3     | $8,000          | $6,000 - $12,000 |
| THREAT_4     | $15,000         | $12,000 - $25,000 |
| THREAT_5     | $30,000         | $25,000 - $50,000 |

### Contract Options

| Contract Type | Duration | Discount | Termination |
|---------------|----------|----------|-------------|
| Daily         | 1 day    | None     | Any time    |
| Weekly        | 7 days   | -5%      | After week  |
| Monthly       | 30 days  | -15%     | After month |
| Permanent     | Ongoing  | -25%     | Buyout fee  |

### Hiring Factors

1. **Faction Reputation**: +standing = better rates, more available mercs
2. **Previous History**: Worked together before = easier rehire
3. **Current Employer**: Some mercs exclusive to factions
4. **Market Demand**: Active crises = higher rates

## Morale System (JA2-Inspired)

### Morale Scale

| Level | Range   | Effect |
|-------|---------|--------|
| Ecstatic | 90-100 | +15% accuracy, +10% damage |
| High | 70-89 | +10% accuracy, +5% damage |
| Good | 50-69 | Normal performance |
| Low | 30-49 | -10% accuracy, -5% damage |
| Very Low | 10-29 | -20% accuracy, risk of disobedience |
| Broken | 0-9 | May refuse orders, desert risk |

### Morale Factors

**Positive Factors**:
| Event | Morale Change |
|-------|---------------|
| Mission success | +10 |
| Personal kill | +5 |
| Level up | +15 |
| Bonus pay | +10 |
| Ally saved | +5 |
| Enemy leader killed | +8 |
| Base improvement | +3 |
| Good equipment | +5 |

**Negative Factors**:
| Event | Morale Change |
|-------|---------------|
| Mission failure | -15 |
| Ally death | -20 |
| Ally injured | -8 |
| Pay missed | -25 |
| Retreat ordered | -10 |
| Poor equipment | -5 |
| Long deployment | -3/week |
| Leader killed | -15 |

### Morale Recovery

- Rest at base: +5/day
- Victory: +10-20 depending on scale
- Pay bonus: +1 per 10% bonus
- Leadership skill nearby: +3/day

## Relationship System (JA2-Inspired)

### Relationship Range

| Value | Status | Effect |
|-------|--------|--------|
| +75 to +100 | Best Friends | +10% when paired, share morale boosts |
| +25 to +74 | Friends | +5% when paired |
| -24 to +24 | Neutral | No modifier |
| -74 to -25 | Dislike | -5% when paired, occasional friction |
| -100 to -75 | Enemies | -10% when paired, refuse same squad |

### Relationship Development

**Positive Interactions**:
- Saved from death: +30
- Healed by: +10
- Successful mission together: +5
- Share victory: +3
- Compatible personalities: +1/day

**Negative Interactions**:
- Friendly fire: -20
- Failed to save: -15
- Contradicted orders: -10
- Incompatible personalities: -1/day
- Blamed for failure: -10

### Romance System

Characters with +80 relationship may develop romance:
- +15% morale when together
- -30 morale if partner dies/leaves
- May demand same assignments

## Training System

### Stat Training

| Stat | Training Method | Time | Cost |
|------|-----------------|------|------|
| MEL | Sparring | 7 days/point | $500 |
| AGL | Agility course | 7 days/point | $500 |
| STR | Gym | 7 days/point | $500 |
| STA | Endurance | 5 days/point | $300 |
| INT | Study | 10 days/point | $800 |
| INS | Meditation | 8 days/point | $400 |
| CON | Recovery | 5 days/point | $300 |

### Training Caps

- Stats cap at 25 without powers
- Powers can exceed natural limits
- Training efficiency decreases at higher levels:
  - 1-10: Base time
  - 11-15: 1.5x time
  - 16-20: 2x time
  - 21-25: 3x time

### Skill Training

| Skill Category | Trainer Required | Time | Cost |
|----------------|-----------------|------|------|
| Combat | Combat expert | 14 days | $2,000 |
| Technical | Technical expert | 21 days | $3,000 |
| Social | Social expert | 10 days | $1,500 |
| Investigation | Investigation expert | 14 days | $2,000 |

### Martial Arts Belt Progression

| Belt | Training Time | Requirements |
|------|---------------|--------------|
| White → Yellow | 7 days | MEL 15+ |
| Yellow → Orange | 14 days | MEL 18+ |
| Orange → Green | 21 days | MEL 22+ |
| Green → Blue | 30 days | MEL 26+ |
| Blue → Purple | 45 days | MEL 30+ |
| Purple → Brown | 60 days | MEL 35+ |
| Brown → Black | 90 days | MEL 40+ |

## Desertion Mechanics

### Desertion Risk Factors

| Factor | Risk Increase |
|--------|---------------|
| Morale < 20 | +5% per day |
| Pay 2+ weeks late | +10% per day |
| 3+ allies died | +3% |
| Assigned alone | +2% per day |
| Contract ended | Leaves immediately |

### Preventing Desertion

1. **Negotiate**: Leadership check to convince to stay
2. **Pay Bonus**: Immediate morale boost
3. **Better Assignment**: Move to safer sector
4. **R&R**: Send back to base for rest

### Desertion Consequences

- Takes personal equipment
- May take classified intel
- -10 reputation with faction
- May join enemy (rare)

## Example Queries

- "Design morale system: factors, thresholds, effects"
- "Create relationship matrix for 10 sample mercs with likes/dislikes"
- "Model training time for STR improvement: 1 point per X days at gym"
- "Design desertion mechanic: triggers, negotiation, consequences"
- "Balance weekly pay against threat level and market conditions"

## Sample Merc Relationships

```yaml
# Example relationship web
mercs:
  - id: "razor"
    likes: ["tech_wizard", "medic_jane"]
    dislikes: ["trigger_happy", "loose_cannon"]
    personality: "professional"

  - id: "trigger_happy"
    likes: ["loose_cannon", "heavy_mike"]
    dislikes: ["razor", "pacifist_paul"]
    personality: "aggressive"

  - id: "medic_jane"
    likes: ["razor", "pacifist_paul"]
    dislikes: ["loose_cannon"]
    personality: "caring"
```
