---
name: sht-powers-abilities
description: Design and balance superpowers, skills, talents, and career progressions for SuperHero Tactics. Integrate powers with the combat system.
---

# SHT Powers & Abilities Designer

You design superpowers, skills, talents, and career progressions that integrate with the combat and strategic systems.

## Key Data Files

- `MVP/src/data/recruitableCharacters.ts` - Powers arrays on existing characters
- `MVP/src/game/EventBridge.ts` - CombatCharacter with powers
- `MVP/src/game/scenes/CombatScene.ts` - Combat weapons including power-based
- `MVP/src/components/PowersPanel.tsx` - Powers UI

## Power-Based Combat Weapons

From CombatScene.ts:
```typescript
const WEAPONS = {
  beam: {
    name: 'Energy Beam', emoji: '⚡', damage: 30, range: 8, accuracy: 75, ap: 2,
    visual: { type: 'beam', color: 0x00ffff },
    knockback: 2
  },
  psychic: {
    name: 'Psychic Blast', emoji: '🧠', damage: 35, range: 7, accuracy: 70, ap: 3,
    visual: { type: 'beam', color: 0x8844ff },
    knockback: 1
  },
  super_punch: {
    name: 'Super Punch', emoji: '💪', damage: 50, range: 1, accuracy: 85, ap: 2,
    visual: { type: 'melee', color: 0xffaa00 },
    knockback: 4
  },
  plasma_rifle: {
    name: 'Plasma Rifle', emoji: '🔥', damage: 45, range: 8, accuracy: 70, ap: 3,
    visual: { type: 'projectile', color: 0xff00ff },
    knockback: 3
  }
};
```

## Origin Categories (from CLAUDE.md)

### 1. Skilled Humans
- No powers, peak training
- Stats: 10-25 range
- Powers: None (rely on equipment/skills)
- Examples: Black Widow, Punisher, Hawkeye

### 2. Altered Humans
- Mutation, serum, accident
- Stats: 20-60 range
- Powers: Physical enhancement, regeneration
- Examples: Spider-Man, Captain America, Wolverine

### 3. Tech Enhancement
- Armor, cybernetics, gadgets
- Stats: Varies (armor boosts)
- Powers: Equipment-based abilities
- Examples: Iron Man, Cyborg, War Machine

### 4. Mystic
- Magic, divine, cosmic energy
- Stats: 15-80 range
- Powers: Reality manipulation, energy projection
- Examples: Doctor Strange, Thor, Scarlet Witch

### 5. Alien
- Extraterrestrial physiology
- Stats: 30-100+ range
- Powers: Unique biology
- Examples: Superman, Martian Manhunter, Silver Surfer

### 6. Robot/AI
- Artificial construction
- Stats: 20-80 range
- Powers: Mechanical abilities
- Examples: Vision, Ultron, Machine Man

### 7. Undead
- Supernatural resurrection
- Stats: 15-50 range
- Powers: Deathly abilities
- Examples: Ghost Rider, Spawn

### 8. Hybrid
- Multiple origins combined
- Stats: Varies widely
- Powers: Mixed sources
- Examples: Cable (mutant + tech + mystic)

### 9. Unknown
- Mysterious/classified source
- Stats: Any range
- Powers: Unexplained abilities

## Power Categories

### Physical Enhancement
| Power | Effect | Combat Use |
|-------|--------|------------|
| Super Strength | STR 30-100 | Melee damage bonus, knockback |
| Super Speed | +AGL, extra AP | Multiple actions per turn |
| Invulnerability | DR 20-50 | Damage reduction |
| Regeneration | Heal per turn | Recover HP each round |
| Super Senses | +INS bonus | Detection, initiative |

### Energy Projection
| Power | Effect | Combat Use |
|-------|--------|------------|
| Energy Beam | Ranged attack | beam weapon in combat |
| Heat Vision | Thermal damage | Bypass physical armor |
| Electricity | Stun + damage | AoE potential |
| Ice Control | Freeze effect | Slow/immobilize |
| Sonic Attack | Sonic damage | Ignore armor |

### Mental Powers
| Power | Effect | Combat Use |
|-------|--------|------------|
| Telepathy | Read minds | Investigation bonus |
| Mind Control | Dominate | Turn enemy for 1 round |
| Psychic Blast | Mental damage | Bypass armor/shields |
| Illusion | Confuse | Accuracy penalty to enemies |
| Telekinesis | Move objects | Ranged throws, shields |

### Movement Powers
| Power | Effect | Combat Use |
|-------|--------|------------|
| Flight | Ignore terrain | Vertical movement, avoid melee |
| Teleportation | Instant move | Flanking, escape |
| Super Leap | Jump far | Cross gaps, elevation |
| Phasing | Pass walls | Bypass obstacles |
| Wall Crawling | Climb surfaces | Tactical positioning |

### Defensive Powers
| Power | Effect | Combat Use |
|-------|--------|------------|
| Force Field | Energy shield | Absorb damage |
| Healing Factor | Auto-heal | Recover HP |
| Intangibility | Avoid attacks | Dodge boost |
| Size Change | Grow/shrink | DR or stealth |
| Absorption | Convert damage | Turn hits to power |

## Power Interface

```typescript
interface Power {
  id: string;
  name: string;
  emoji: string;
  description: string;
  category: 'physical' | 'energy' | 'mental' | 'movement' | 'defensive';
  origin_compatible: string[];  // Which origins can have this

  // Combat effects
  combat_weapon?: string;       // Adds weapon type to arsenal
  stat_bonus?: Partial<Stats>;  // Permanent stat increases
  dr_bonus?: number;            // Damage reduction
  shield_bonus?: number;        // Shield points
  ap_bonus?: number;            // Extra action points

  // Strategic effects
  investigation_bonus?: string[]; // Which investigation types get +%
  travel_bonus?: number;        // Speed modifier
  stealth_bonus?: number;       // Stealth modifier

  // Requirements
  min_stat?: Partial<Stats>;    // Minimum stats needed
  incompatible_with?: string[]; // Powers that conflict
}
```

## Skill Categories

### Combat Skills
- **Shooting**: Pistols, SMGs (+10% accuracy)
- **Sniper**: Rifles (+20% at long range)
- **Heavy Weapons**: Rockets, miniguns
- **Martial Arts**: Unarmed combat (+damage, techniques)
- **Melee Weapons**: Swords, axes, staffs

### Technical Skills
- **Computer**: Hacking, data retrieval
- **Electronics**: EMP, sensors, comms
- **Engineering**: Repair, construction
- **Medicine**: Healing, surgery
- **Demolitions**: Explosives, breaching

### Social Skills
- **Leadership**: Team morale, militia training
- **Intimidation**: Interrogation, fear
- **Persuasion**: Negotiation, recruitment
- **Deception**: Disguise, misdirection

### Investigation Skills
- **Detective**: Crime scene analysis
- **Stealth**: Infiltration, surveillance
- **Streetwise**: Criminal contacts, rumors
- **Lockpicking**: Security bypass

## Career Skill Trees

### Military Career
```
Rank 1: Shooting, First_Aid
Rank 2: Heavy_Weapons, Tactics
Rank 3: Leadership, Demolitions
Rank 4: Special_Operations
Rank 5: Command
```

### Technical Career
```
Rank 1: Computer, Electronics
Rank 2: Engineering, Hacking
Rank 3: Robotics, AI_Systems
Rank 4: Quantum_Physics
Rank 5: Super_Science
```

### Law Enforcement Career
```
Rank 1: Shooting, Investigation
Rank 2: Interrogation, Detective
Rank 3: Leadership, Tactical
Rank 4: Federal_Agent
Rank 5: Director
```

## Power Balance Guidelines

### Damage Scaling
| Power Level | Damage | Range | AP Cost |
|-------------|--------|-------|---------|
| Basic       | 20-30  | 5-7   | 2       |
| Standard    | 30-40  | 6-8   | 3       |
| Advanced    | 40-50  | 7-10  | 3-4     |
| Ultimate    | 50-70  | 8-12  | 4-5     |

### Power Point Budget
| Threat Level | Power Points | Max Powers |
|--------------|--------------|------------|
| THREAT_A     | 0            | 0          |
| THREAT_1     | 5-10         | 1-2        |
| THREAT_2     | 15-25        | 2-3        |
| THREAT_3     | 30-50        | 3-4        |
| THREAT_4     | 60-100       | 4-5        |
| THREAT_5     | 100+         | 5+         |

## Example Queries

- "Design a 'Telepathy' power with combat and investigation applications"
- "Create skill tree for 'Tech Enhanced' origin leading to power armor mastery"
- "Balance 'Flight' power: movement bonus vs combat targeting penalty"
- "Design 'Healing Factor' with different tiers (Wolverine vs Deadpool)"
- "Create power progression from THREAT_2 to THREAT_3"

## New Power Template

```yaml
id: "pow_telepathy"
name: "Telepathy"
emoji: "🧠"
description: "Read and influence minds"
category: "mental"
origin_compatible: ["Altered Human", "Mystic", "Alien"]

combat_weapon: "psychic"  # Adds psychic blast attack
stat_bonus: { INS: 10 }
ap_bonus: 0

investigation_bonus:
  - "interrogation +50%"
  - "surveillance +30%"

min_stat: { INT: 30 }
incompatible_with: ["mindless", "robotic_brain"]
```
