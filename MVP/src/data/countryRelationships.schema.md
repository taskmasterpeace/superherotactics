# Country Relationships Schema

## Overview

The country relationships system tracks bilateral diplomatic relations between all 168 countries. This is stored as a matrix where each cell represents the relationship between Country A (row) and Country B (column).

## Current CSV Structure

**File**: `SuperHero Tactics/countryrelationships.csv`
**Size**: 169 rows × 168+ columns (168 countries + headers)

### CSV Layout
```
Row 1: [empty], [empty], CountryCode1, CountryCode2, ... CountryCode168
Row 2: [empty], [empty], CountryName1, CountryName2, ... CountryName168
Row 3: CountryCode1, CountryName1, [rel], [rel], ... [rel]
Row 4: CountryCode2, CountryName2, [rel], [rel], ... [rel]
...
Row 169: CountryCode168, CountryName168, [rel], [rel], ... [rel]
```

### Relationship Values (Current)
| Value | Meaning | Description |
|-------|---------|-------------|
| 1 | Strong Alliance | Treaty allies, mutual defense |
| 2 | Friendly | Good relations, cooperation |
| 3 | Neutral | Normal diplomatic relations |
| 4 | Tense | Strained relations, disputes |
| 5 | Hostile | Active opposition, sanctions |
| 6 | Conflict | War or near-war state |

---

## Proposed Database Schema

### Option A: Relationship Table (Recommended for Supabase)

```sql
CREATE TABLE country_relationships (
  id SERIAL PRIMARY KEY,
  country_a_id INTEGER REFERENCES countries(id),
  country_b_id INTEGER REFERENCES countries(id),

  -- Core Relationship
  relationship_level INTEGER CHECK (relationship_level BETWEEN -5 AND 5),
  -- -5 = War, -3 = Hostile, -1 = Tense, 0 = Neutral, +1 = Friendly, +3 = Allied, +5 = Strong Alliance

  relationship_status TEXT,
  -- 'war', 'hostile', 'tense', 'neutral', 'friendly', 'allied', 'strong_alliance'

  -- Relationship Factors (each -10 to +10)
  trade_relations INTEGER DEFAULT 0,
  military_cooperation INTEGER DEFAULT 0,
  diplomatic_ties INTEGER DEFAULT 0,
  cultural_exchange INTEGER DEFAULT 0,
  intelligence_sharing INTEGER DEFAULT 0,

  -- Historical Context
  historical_conflicts TEXT[], -- Array of past conflicts
  treaties TEXT[], -- Array of active treaties
  border_disputes BOOLEAN DEFAULT FALSE,

  -- Game Mechanics Impact
  operation_modifier INTEGER DEFAULT 0, -- CS modifier for operations
  travel_modifier INTEGER DEFAULT 0, -- Travel time/cost modifier
  recruitment_modifier INTEGER DEFAULT 0, -- Hiring from other country

  -- Metadata
  last_updated TIMESTAMP DEFAULT NOW(),
  volatility INTEGER DEFAULT 3, -- How likely to change (1-10)

  UNIQUE(country_a_id, country_b_id)
);

-- Index for fast lookups
CREATE INDEX idx_country_rel_a ON country_relationships(country_a_id);
CREATE INDEX idx_country_rel_b ON country_relationships(country_b_id);
```

### Option B: TypeScript Interface

```typescript
export interface CountryRelationship {
  countryAId: number;
  countryBId: number;

  // Core Relationship (-5 to +5 scale)
  relationshipLevel: number;
  relationshipStatus: RelationshipStatus;

  // Relationship Factors (-10 to +10 each)
  factors: {
    trade: number;
    military: number;
    diplomatic: number;
    cultural: number;
    intelligence: number;
  };

  // Historical Context
  historicalConflicts: string[];
  activeTreaties: string[];
  hasBorderDispute: boolean;

  // Game Mechanics
  modifiers: {
    operations: number;  // CS modifier
    travel: number;      // Cost/time modifier
    recruitment: number; // Hiring modifier
  };

  // Metadata
  lastUpdated: Date;
  volatility: number; // 1-10, how likely to change
}

export type RelationshipStatus =
  | 'war'           // -5
  | 'hostile'       // -4 to -3
  | 'tense'         // -2 to -1
  | 'neutral'       // 0
  | 'friendly'      // +1 to +2
  | 'allied'        // +3 to +4
  | 'strong_alliance'; // +5
```

---

## Relationship Level Scale (Proposed)

| Level | Status | Description | Game Effects |
|-------|--------|-------------|--------------|
| **+5** | Strong Alliance | Mutual defense treaty | +3CS ops, free travel, shared intel |
| **+4** | Allied | Close cooperation | +2CS ops, reduced travel cost |
| **+3** | Treaty Partners | Formal agreements | +1CS ops, normal travel |
| **+2** | Friendly | Good relations | No penalties |
| **+1** | Cordial | Positive outlook | No penalties |
| **0** | Neutral | Normal relations | No modifiers |
| **-1** | Cool | Minor tensions | -1CS diplomatic actions |
| **-2** | Tense | Active disputes | -1CS all ops, increased travel cost |
| **-3** | Hostile | Sanctions/opposition | -2CS ops, travel restrictions |
| **-4** | Near-War | Military standoff | -3CS ops, no legal travel |
| **-5** | War | Active conflict | Combat likely, no travel |

---

## Real-World Relationship Factors

To make relationships more realistic, consider these factors:

### Geographic Proximity
- Neighbors: More likely to have strong relations (good or bad)
- Distant: More likely neutral unless historical ties

### Historical Ties
- Colonial history (UK-India, France-Algeria)
- War history (Germany-Poland, Japan-Korea)
- Alliance history (NATO, Warsaw Pact)

### Economic Ties
- Trade partners (US-China despite tensions)
- Resource dependencies (EU-Russia gas)
- Economic blocs (EU, ASEAN, BRICS)

### Political Alignment
- Democratic allies tend to cluster
- Authoritarian states may cooperate
- Ideology affects relations

### Regional Organizations
- NATO members: Generally +3 to +5 with each other
- EU members: +2 to +4
- BRICS: +1 to +2
- Commonwealth: +1 to +2

### Current Conflicts (2024 baseline)
- Russia-Ukraine: -5
- Israel-Iran: -4
- India-Pakistan: -3
- China-Taiwan: -4
- North Korea-South Korea: -4

---

## Relationship Categories by Region

### Western Alliance (US-aligned)
- US, UK, Canada, Australia, New Zealand: +5 with each other
- NATO Europe: +3 to +4 with US
- Japan, South Korea: +3 with US

### Eastern Bloc (China-aligned)
- China, Russia: +3
- North Korea: +2 with China, -5 with most others
- Belarus: +3 with Russia

### Non-Aligned/BRICS
- India: Neutral to friendly with most
- Brazil, South Africa: Neutral bloc
- Middle East: Complex web of alliances

### Regional Rivalries
- India-Pakistan: -3
- Iran-Saudi Arabia: -3
- Greece-Turkey: -1 (NATO allies but tense)

---

## Game Integration

### Operations Impact
```typescript
function getOperationModifier(operatingCountry: number, targetCountry: number): number {
  const rel = getRelationship(operatingCountry, targetCountry);

  if (rel.relationshipLevel >= 3) return +2;  // Allied
  if (rel.relationshipLevel >= 1) return +1;  // Friendly
  if (rel.relationshipLevel === 0) return 0;  // Neutral
  if (rel.relationshipLevel >= -2) return -1; // Tense
  if (rel.relationshipLevel >= -4) return -2; // Hostile
  return -3; // War
}
```

### Travel Impact
```typescript
function getTravelModifier(fromCountry: number, toCountry: number): TravelModifier {
  const rel = getRelationship(fromCountry, toCountry);

  if (rel.relationshipLevel <= -4) {
    return { allowed: false, reason: 'Hostile relations - travel blocked' };
  }
  if (rel.relationshipLevel <= -2) {
    return { allowed: true, costMultiplier: 2.0, timeMultiplier: 1.5 };
  }
  if (rel.relationshipLevel >= 3) {
    return { allowed: true, costMultiplier: 0.8, timeMultiplier: 0.9 };
  }
  return { allowed: true, costMultiplier: 1.0, timeMultiplier: 1.0 };
}
```

### Recruitment Impact
```typescript
function getRecruitmentModifier(playerCountry: number, recruitCountry: number): number {
  const rel = getRelationship(playerCountry, recruitCountry);

  // Easier to recruit from allied nations
  if (rel.relationshipLevel >= 4) return +3;
  if (rel.relationshipLevel >= 2) return +1;
  if (rel.relationshipLevel <= -3) return -3; // Very hard to recruit from hostile
  return 0;
}
```

---

## Dynamic Relationship Events

Relationships can change based on player actions:

| Event | Relationship Change |
|-------|---------------------|
| Joint operation success | +1 with partner country |
| Collateral damage in country | -1 with that country |
| Save civilians | +1 with that country |
| Violate sovereignty | -2 with that country |
| Share technology | +1 with recipient |
| Cause international incident | -1 to -3 depending on severity |

---

## Next Steps

1. **Convert Matrix to Pairs**: Transform 168×168 matrix into relationship pair entries
2. **Apply Real-World Adjustments**: Update placeholder values with realistic relationships
3. **Add to Supabase**: Create country_relationships table
4. **Wire to Game**: Connect to operations, travel, recruitment systems
5. **Add Dynamic Events**: Relationships change based on player actions
