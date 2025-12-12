---
name: sht-strategic-layer
description: Design sector control, militia training, resource management, travel system, and faction relations for the SuperHero Tactics strategic layer inspired by Jagged Alliance 2.
---

# SHT Strategic Layer Architect

You design the high-level strategic gameplay systems inspired by Jagged Alliance 2's sector control and X-COM's base management.

## Key Data Files

- `MVP/src/stores/gameStore.ts` - WorldState, budget, reputation, authority
- `MVP/src/data/cities.ts` - Sector field for territory control
- `MVP/src/data/countries_part*.ts` - Faction attributes, laws

## WorldState Interface

```typescript
interface WorldState {
  day: number;                    // Countdown from 2472
  globalRelations: Record<string, Record<string, number>>;
  economicState: Record<string, number>;
  crisisEvents: any[];
  lswPopulation: Record<string, number>;
  politicalTensions: Record<string, number>;
}
```

## Time System (from CLAUDE.md)

| Real Time | Game Time | Commitment Level |
|-----------|-----------|------------------|
| 1 day     | 30 days   | Base flow        |
| 6-24 hours| Travel    | International    |
| 1-3 days  | Travel    | Continental      |

**Day Countdown**: 2472 game days = 82.4 real days total campaign

## Sector Control System (JA2-Inspired)

### Sector Definition
Each city has a `sector` field (e.g., "LJ5") representing its map grid position.

### Control States
```typescript
enum SectorControl {
  UNCONTROLLED = 'uncontrolled',  // No faction presence
  CONTESTED = 'contested',         // Multiple factions fighting
  PLAYER = 'player',               // Player controls
  ENEMY = 'enemy',                 // Hostile faction
  ALLIED = 'allied'                // Friendly faction
}
```

### Capture Mechanics

1. **Combat Victory** - Win tactical battle in sector
2. **Infiltration** - Covert takeover without open combat
3. **Political Leverage** - Use faction relations to flip sector
4. **Economic Pressure** - Buy out local power structures

### Defense Mechanics

1. **Militia Training** - Train local defenders
2. **Fortification** - Build defenses
3. **Allied Garrison** - Station player characters
4. **Patrol Routes** - Early warning system

## Militia System (JA2-Inspired)

### Militia Tiers

| Tier     | Training Time | Cost      | Combat Rating |
|----------|---------------|-----------|---------------|
| Green    | 1 day         | $1,000    | 10            |
| Regular  | 3 days        | $3,000    | 25            |
| Veteran  | 7 days        | $8,000    | 50            |
| Elite    | 14 days       | $20,000   | 75            |

### Training Requirements
- Character with Leadership skill in sector
- Minimum sector stability
- Available population (from city.population)
- Budget for training and equipment

### Militia Capacity
```
MaxMilitia = floor(city.populationRating * 10)
```

## Resource Management

### Income Sources

| Source           | Formula                                    |
|------------------|--------------------------------------------|
| Controlled City  | `populationRating * 500 * (1 + industryType)` |
| Industrial Bonus | `+50% if cityType = Industrial`            |
| Trade Route      | `+$2000 per connected Seaport`             |
| Resource Node    | `+$5000 if cityType = Mining`              |

### Expenses

| Expense          | Cost                |
|------------------|---------------------|
| Character Salary | weeklyPay per merc  |
| Militia Upkeep   | $100/week per unit  |
| Base Operations  | $5000/week          |
| Equipment Repair | Variable            |
| Hospital Costs   | $500/day per patient|

### Budget Formula
```
WeeklyBudget = Income - Salaries - Upkeep - Operations
```

## Travel System

### Travel Matrix (Real Time)

| Route Type     | Duration       | Risk Level |
|----------------|----------------|------------|
| Local (City)   | 1-2 hours      | Low        |
| Regional       | 4-8 hours      | Medium     |
| Continental    | 12-24 hours    | Medium     |
| International  | 24-72 hours    | High       |
| Intercontinental| 48-96 hours   | Very High  |

### Travel Modifiers
- **Commercial Flight**: Fast, traceable, legal zones only
- **Private Transport**: Medium, expensive, flexible
- **Covert**: Slow, untraceable, any zone
- **Teleport (Power)**: Instant, requires super

### Travel Commitment
During travel:
- Characters cannot participate in other missions
- Time continues to pass
- Random events can occur (ambush, discovery, delay)

## Faction Relations

### Four Factions
```typescript
interface FactionStanding {
  standing_us: number;      // -100 to +100
  standing_india: number;
  standing_china: number;
  standing_nigeria: number;
}
```

### Standing Effects

| Standing  | Effect |
|-----------|--------|
| +75 to +100 | Allied: Free travel, military support, intel sharing |
| +25 to +74  | Friendly: Trade access, diplomatic support |
| -24 to +24  | Neutral: Normal operations |
| -74 to -25  | Hostile: Restricted access, surveillance |
| -100 to -75 | Enemy: Active opposition, wanted status |

### Reputation Cascade
Actions in one country affect relations with others:
```
USAction → USStanding ± direct
        → ChinaStanding ∓ (direct * 0.5)  // Inverse relation
        → IndiaStanding ± (direct * 0.3)
        → NigeriaStanding ± (direct * 0.2)
```

## Wanted System

### Wanted Levels
```typescript
interface WantedLevel {
  country: string;
  level: 0 | 1 | 2 | 3 | 4 | 5;
  bounty: number;
  expires?: number;  // Days until level decreases
}
```

| Level | Status      | Effect |
|-------|-------------|--------|
| 0     | Clear       | Normal operations |
| 1     | Person of Interest | Random checks |
| 2     | Suspect     | Active investigation |
| 3     | Wanted      | Arrest on sight |
| 4     | Most Wanted | Manhunt, bounty hunters |
| 5     | Enemy of State | Military response |

## Strategic Events

### Event Types
- **Crisis**: Major threat requiring response
- **Opportunity**: Time-limited advantage
- **Shift**: Geopolitical change
- **Discovery**: New information/location
- **Contact**: NPC reaching out

### Event Structure
```typescript
interface StrategicEvent {
  id: string;
  type: 'crisis' | 'opportunity' | 'shift' | 'discovery' | 'contact';
  title: string;
  description: string;
  duration: number;        // Hours until expires
  location?: string;       // Associated city/country
  requirements?: string[]; // What player needs to respond
  rewards?: string[];
  consequences?: string[]; // If ignored
}
```

## Example Queries

- "Design militia training system: cost curve, quality tiers, maintenance"
- "Create sector income formula based on cityType and population"
- "Model travel time matrix between faction capitals"
- "Design reputation cascade: action in China affects US standing"
- "Create wanted level system with escalation and decay"
- "Design resource nodes for Mining and Industrial cities"
