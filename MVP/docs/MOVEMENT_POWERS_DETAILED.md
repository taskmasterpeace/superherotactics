# MOVEMENT POWERS - Detailed Implementation Proposal

## Core Philosophy
**Every power has INTENSITY (1-10) that affects:**
- Range/Speed
- Energy cost
- Cooldown
- Passenger capacity
- Special abilities at high intensity

---

## POWER INTENSITY SYSTEM

### Universal Intensity Scale
| Intensity | Label | Compared To |
|-----------|-------|-------------|
| 1-2 | **Weak** | Slightly better than normal human |
| 3-4 | **Low** | Athletic human peak |
| 5-6 | **Medium** | Peak hero, Olympic+ |
| 7-8 | **High** | Superhuman, notable |
| 9-10 | **Extreme** | World-class, legendary |

### How Intensity Affects Movement Powers
```typescript
interface MovementPower {
  type: 'flight' | 'teleport' | 'super_speed' | 'phasing' | 'swimming' | 'burrowing';
  intensity: number; // 1-10
  currentEnergy: number;
  maxEnergy: number;
  cooldownRemaining: number;
}

function getMovementStats(power: MovementPower): MovementStats {
  const i = power.intensity;

  return {
    // Speed multiplier (1x = normal travel, 10x = 10x faster)
    speedMultiplier: 1 + (i * 0.5), // 1.5x to 6x

    // Range in sectors (for teleport)
    range: i, // 1-10 sectors

    // Energy cost per sector
    energyCost: Math.max(5, 20 - i), // 19 down to 10

    // Cooldown in hours (for teleport)
    cooldown: Math.max(1, 12 - i), // 11h down to 2h

    // Passengers you can bring
    passengers: Math.floor(i / 3), // 0, 0, 1, 1, 1, 2, 2, 2, 3, 3

    // Special abilities unlock at certain thresholds
    abilities: getUnlockedAbilities(power.type, i),
  };
}
```

---

## FLIGHT

### Intensity Effects
| Intensity | Speed | Altitude | Weather Resist | Special |
|-----------|-------|----------|----------------|---------|
| 1 | 1.2x | Low (buildings) | None | Gliding only |
| 2 | 1.4x | Low | None | Sustained flight |
| 3 | 1.6x | Medium (clouds) | Light wind | - |
| 4 | 1.8x | Medium | Moderate wind | - |
| 5 | 2.0x | High (planes) | Strong wind | Hover in place |
| 6 | 2.5x | High | Storm | Carry 1 passenger |
| 7 | 3.0x | Very High | Any weather | Carry 2 passengers |
| 8 | 4.0x | Stratosphere | Vacuum (brief) | Combat flight |
| 9 | 5.0x | Suborbital | Vacuum | Orbital insertion |
| 10 | 6.0x | Orbital | Space | Escape velocity |

### Travel Time with Flight
```typescript
function getFlightTravelTime(sectors: number, intensity: number): number {
  const baseTime = sectors * 6; // 6 hours per sector normally
  const speedMultiplier = 1 + (intensity * 0.5);

  return Math.ceil(baseTime / speedMultiplier);
}

// Examples:
// 5 sectors normally = 30 hours
// Intensity 3 flight: 30 / 2.5 = 12 hours
// Intensity 7 flight: 30 / 4.5 = 7 hours
// Intensity 10 flight: 30 / 6 = 5 hours
```

### Flight in Combat (Tactical Layer)
| Intensity | Combat Bonus |
|-----------|--------------|
| 1-4 | +1 movement, can cross gaps |
| 5-6 | +2 movement, ignore terrain, dodge +10% |
| 7-8 | +3 movement, attack from above (+15% damage), dodge +20% |
| 9-10 | +4 movement, strafe attacks, dodge +30% |

### Energy Cost
```typescript
// Strategic layer (world map)
const flightEnergyCost = {
  perSector: 10 - Math.floor(intensity / 2), // 10 down to 5
  perPassenger: 5,
  hoverPerHour: 2,
};

// Tactical layer (combat)
const combatFlightCost = {
  takeoff: 10,
  perTurn: 3 - Math.floor(intensity / 4), // 3 down to 0 at intensity 10
  landing: 0,
};
```

---

## TELEPORTATION

### Intensity Effects
| Intensity | Range | Cooldown | Passengers | Requires |
|-----------|-------|----------|------------|----------|
| 1 | Same sector | 24h | Self only | Line of sight |
| 2 | 1 sector | 20h | Self only | Been there before |
| 3 | 2 sectors | 16h | Self only | Been there OR beacon |
| 4 | 3 sectors | 14h | +1 person | Been there OR beacon |
| 5 | 5 sectors | 12h | +1 person | Beacon not needed |
| 6 | 7 sectors | 10h | +2 people | - |
| 7 | 10 sectors | 8h | +2 people | Continental |
| 8 | 15 sectors | 6h | +3 people | - |
| 9 | Any known | 4h | +4 people | Global |
| 10 | Anywhere | 2h | +5 people | Blind teleport OK |

### Teleport Requirements
```typescript
interface TeleportRequirements {
  mustHaveVisited: boolean;  // False at intensity 10
  beaconRequired: boolean;   // False at intensity 5+
  lineOfSight: boolean;      // Only at intensity 1
  cooldownHours: number;
  energyCost: number;
}

function canTeleportTo(
  destination: Location,
  power: MovementPower,
  player: Player
): { canDo: boolean; reason?: string } {
  const i = power.intensity;

  // Intensity 10 can blind teleport
  if (i < 10 && !player.visitedLocations.includes(destination.id)) {
    // Check for beacon
    if (i < 5 || !hasBeaconAt(destination)) {
      return { canDo: false, reason: 'Never visited, no beacon' };
    }
  }

  // Check range
  const distance = getSectorDistance(player.location, destination);
  const range = getTeleportRange(i);
  if (distance > range) {
    return { canDo: false, reason: `Out of range (${distance} > ${range})` };
  }

  // Check cooldown
  if (power.cooldownRemaining > 0) {
    return { canDo: false, reason: `Cooldown: ${power.cooldownRemaining}h remaining` };
  }

  // Check energy
  const cost = getTeleportCost(distance, power);
  if (power.currentEnergy < cost) {
    return { canDo: false, reason: `Not enough energy (need ${cost}, have ${power.currentEnergy})` };
  }

  return { canDo: true };
}
```

### Teleport Beacons
```typescript
interface TeleportBeacon {
  id: string;
  location: Location;
  placedBy: string;
  placedDay: number;
  isHidden: boolean;  // Can be detected by enemies
  detected: boolean;  // If found, can be ambushed
}

// Beacon crafting
const beaconCraft = {
  cost: 5000,
  researchRequired: false, // Available from start
  materialsRequired: ['electronics', 'power_cell'],
  placeTime: 10, // minutes
};
```

### Combat Teleport (Tactical Layer)
| Intensity | Combat Use |
|-----------|------------|
| 1-2 | Cannot use in combat |
| 3-4 | Emergency escape only (ends turn) |
| 5-6 | Teleport as move action (half AP) |
| 7-8 | Teleport as free action once per combat |
| 9-10 | Telefrag (teleport INTO enemy, massive damage) |

---

## SUPER SPEED

### Intensity Effects
| Intensity | Speed Multiplier | Combat Bonus | Special |
|-----------|------------------|--------------|---------|
| 1 | 2x | +1 AP | - |
| 2 | 3x | +1 AP | - |
| 3 | 4x | +2 AP | Blur (harder to hit) |
| 4 | 5x | +2 AP | - |
| 5 | 6x | +3 AP | Speed steal (slow enemy) |
| 6 | 8x | +3 AP | - |
| 7 | 10x | +4 AP | Vibrate through walls |
| 8 | 15x | +4 AP | Time perception |
| 9 | 20x | +5 AP | Create speed clones |
| 10 | 30x | +6 AP | Time stop (1 round/day) |

### Travel Time with Super Speed
```typescript
function getSuperSpeedTravelTime(sectors: number, intensity: number): number {
  const baseTime = sectors * 6; // 6 hours per sector normally
  const speedMultiplier = getSpeedMultiplier(intensity);

  // Super speed is VERY fast but exhausting
  return Math.ceil(baseTime / speedMultiplier);
}

// 5 sectors normally = 30 hours
// Intensity 5 speed: 30 / 6 = 5 hours
// Intensity 10 speed: 30 / 30 = 1 hour
```

### Energy Drain (Super Speed is EXPENSIVE)
```typescript
const superSpeedCost = {
  perSector: 15 - intensity, // 14 down to 5
  sustainedPerHour: 10,      // Running at full speed
  combatPerTurn: 5,          // Using speed in combat
};
```

---

## PHASING (Walk Through Walls)

### Intensity Effects
| Intensity | What Can Phase Through | Duration | Special |
|-----------|------------------------|----------|---------|
| 1 | Thin walls only | 5 seconds | - |
| 2 | Normal walls | 10 seconds | - |
| 3 | Thick walls, doors | 30 seconds | - |
| 4 | Reinforced walls | 1 minute | - |
| 5 | Vault doors | 2 minutes | Phase others through |
| 6 | Concrete bunkers | 5 minutes | - |
| 7 | Most materials | 10 minutes | - |
| 8 | Energy fields | 30 minutes | - |
| 9 | Nearly anything | 1 hour | - |
| 10 | Everything | Unlimited | Phase through ground |

### Strategic Uses
```typescript
interface PhaseAbilities {
  infiltration: boolean;      // Bypass security
  escape: boolean;            // Phase out of restraints
  smuggling: boolean;         // Bring items through walls
  underground: boolean;       // Travel through earth (intensity 10)
}

function getPhaseAbilities(intensity: number): PhaseAbilities {
  return {
    infiltration: intensity >= 3,
    escape: intensity >= 2,
    smuggling: intensity >= 5,
    underground: intensity >= 10,
  };
}
```

---

## UNDERWATER/SWIMMING

### Intensity Effects
| Intensity | Swim Speed | Depth | Breath Hold | Special |
|-----------|------------|-------|-------------|---------|
| 1 | 1.5x | 10m | 5 min | - |
| 2 | 2x | 30m | 10 min | - |
| 3 | 3x | 100m | 30 min | - |
| 4 | 4x | 300m | 1 hour | - |
| 5 | 5x | 500m | 2 hours | Echolocation |
| 6 | 6x | 1000m | 4 hours | - |
| 7 | 8x | 2000m | 8 hours | - |
| 8 | 10x | 5000m | Unlimited | Water breathing |
| 9 | 15x | 10000m | Unlimited | Control currents |
| 10 | 20x | Any depth | Unlimited | Pressure immunity |

### Strategic Value
- Coastal sectors have water routes
- Underwater = undetectable by most surveillance
- Can smuggle via submarine routes
- Access underwater bases/wrecks

---

## BURROWING (Underground Travel)

### Intensity Effects
| Intensity | Speed | Depth | Materials | Special |
|-----------|-------|-------|-----------|---------|
| 1 | 0.5x | Soft soil only | Dirt | - |
| 2 | 0.7x | Normal soil | Dirt, sand | - |
| 3 | 1x | Hard soil | + Clay | - |
| 4 | 1x | Rock | + Soft rock | - |
| 5 | 1.2x | Hard rock | + Granite | Create tunnels |
| 6 | 1.5x | Reinforced | + Concrete | - |
| 7 | 2x | Metal | + Steel | - |
| 8 | 2.5x | Dense metal | + Titanium | - |
| 9 | 3x | Nearly anything | + Adamantium | - |
| 10 | 4x | Anything | Any material | Earthquake |

### Strategic Value
- Bypass border security completely
- Create tunnel networks (safehouse feature)
- Ambush from below
- Escape routes

---

## COMBINED EFFECTS INTEGRATION

### Country Effects on Powers
```typescript
function getPowerModifiers(country: Country, power: MovementPower): PowerModifiers {
  const effects = calculateAllCombinedEffects(country);

  return {
    // Surveillance affects detection while using powers
    detectionChance: effects.surveillance.surveillanceScore / 100,

    // Research affects power enhancement availability
    canUpgrade: effects.research.powerResearchActive,

    // Superhuman affairs affects legality
    isLegal: effects.superhuman.canOperateFreely,

    // If powers are illegal, using them increases heat
    heatPerUse: effects.superhuman.registrationEnforcement === 'hunted' ? 20 :
                effects.superhuman.registrationEnforcement === 'mandatory' ? 10 :
                effects.superhuman.registrationEnforcement === 'encouraged' ? 5 : 0,

    // Power nullifiers in high-tech authoritarian countries
    nullifierRisk: effects.superhuman.powerNullifiers ? 0.1 : 0,
  };
}
```

### Travel Options UI
```typescript
function getTravelOptions(from: Sector, to: Sector, squad: Squad): TravelOption[] {
  const options: TravelOption[] = [];
  const distance = getSectorDistance(from, to);

  // Ground travel (always available)
  options.push({
    type: 'ground',
    vehicle: squad.vehicle,
    time: distance * 6,
    cost: getVehicleCost(squad.vehicle, distance),
    risk: 'normal',
  });

  // Check squad powers
  squad.members.forEach(member => {
    member.powers.forEach(power => {
      if (power.type === 'flight') {
        options.push({
          type: 'flight',
          pilot: member.name,
          time: getFlightTravelTime(distance, power.intensity),
          cost: power.intensity * 10, // Energy cost
          capacity: Math.floor(power.intensity / 3),
          risk: 'low',
        });
      }

      if (power.type === 'teleport') {
        const canTeleport = canTeleportTo(to, power, member);
        if (canTeleport.canDo) {
          options.push({
            type: 'teleport',
            teleporter: member.name,
            time: 0, // Instant
            cost: getTeleportCost(distance, power),
            capacity: Math.floor(power.intensity / 3),
            cooldown: getTeleportCooldown(power.intensity),
            risk: 'none',
          });
        }
      }

      if (power.type === 'super_speed') {
        options.push({
          type: 'super_speed',
          runner: member.name,
          time: getSuperSpeedTravelTime(distance, power.intensity),
          cost: (15 - power.intensity) * distance, // Energy
          capacity: 0, // Can't carry others usually
          risk: 'medium', // Exhausting
        });
      }
    });
  });

  return options;
}
```

---

## UI FOR TRAVEL OPTIONS

```
╔═══════════════════════════════════════════════════════╗
║  TRAVEL: New York → Los Angeles (4 sectors)           ║
╠═══════════════════════════════════════════════════════╣
║                                                       ║
║  🚗 GROUND (Van)                                      ║
║     Time: 24 hours │ Cost: $200 fuel                  ║
║     Capacity: Full squad │ Risk: Normal encounters    ║
║     [SELECT]                                          ║
║                                                       ║
║  ✈️ FLIGHT (Storm - Intensity 7)                      ║
║     Time: 5 hours │ Cost: 40 energy                   ║
║     Capacity: 2 passengers │ Risk: Low                ║
║     [SELECT] [NOT ENOUGH PASSENGERS]                  ║
║                                                       ║
║  ⚡ TELEPORT (Nightcrawler - Intensity 6)             ║
║     Time: INSTANT │ Cost: 30 energy                   ║
║     Capacity: 2 passengers │ Cooldown: 10h after      ║
║     [SELECT]                                          ║
║                                                       ║
║  💨 SUPER SPEED (Quicksilver - Intensity 8)           ║
║     Time: 2 hours │ Cost: 28 energy                   ║
║     Capacity: Self only │ Risk: Exhaustion            ║
║     [SELECT] [SOLO ONLY]                              ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
```

---

## DATA STRUCTURES

```typescript
interface MovementPower {
  id: string;
  type: MovementPowerType;
  intensity: number;
  currentEnergy: number;
  maxEnergy: number;
  cooldownRemaining: number;
  upgradeable: boolean;
  upgradeCost?: number;
}

type MovementPowerType =
  | 'flight'
  | 'teleport'
  | 'super_speed'
  | 'phasing'
  | 'swimming'
  | 'burrowing';

interface TravelOption {
  type: 'ground' | 'flight' | 'teleport' | 'super_speed' | 'swim' | 'burrow';
  time: number; // hours
  cost: number; // energy or money
  capacity: number; // passengers
  cooldown?: number; // hours after use
  risk: 'none' | 'low' | 'medium' | 'high';
  requirements?: string[];
  blockedReason?: string;
}

interface PowerUpgrade {
  powerId: string;
  currentIntensity: number;
  targetIntensity: number;
  cost: number;
  researchRequired: boolean;
  trainingDays: number;
}
```

---

## IMPLEMENTATION PRIORITY

1. **Flight** - Most common, easiest to implement
2. **Teleportation** - High impact, cool mechanic
3. **Super Speed** - Similar to flight but with unique feel
4. **Phasing** - Infiltration gameplay
5. **Swimming/Burrowing** - Niche but adds variety

Each power follows the same pattern:
- Intensity 1-10 scale
- Affects speed/range
- Affects energy cost
- Unlocks abilities at thresholds
- Integrates with combined effects (surveillance, legality, etc.)
