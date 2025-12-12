# SuperHero Tactics - Database Reference

## Connection Info
- **Host**: localhost:54322
- **Database**: superhero_tactics
- **User**: postgres
- **Password**: postgres

---

## CHARACTERS (18 total)

| Alias | Real Name | Threat | Origin | MEL | AGL | STR | STA | Powers |
|-------|-----------|--------|--------|-----|-----|-----|-----|--------|
| Paragon | Clark Kent | THREAT_5 | Alien | 90 | 100 | 200 | 200 | Flight, Super Strength, Super Speed, Invulnerability, Heat Vision |
| Goliath | Bruce Banner | THREAT_5 | Altered | 80 | 30 | 250 | 200 | Super Strength, Invulnerability, Regeneration |
| Valkyrie | Diana Prince | THREAT_5 | Divine | 130 | 110 | 150 | 150 | Flight, Super Strength, Invulnerability |
| Thunderstrike | Thor Odinson | THREAT_5 | Divine | 110 | 80 | 150 | 150 | Flight, Super Strength, Invulnerability, Lightning Control |
| The Mentalist | Charles Xavier | THREAT_5 | Mutant | 20 | 20 | 20 | 40 | Telepathy, Mind Control |
| Ferros | Erik Lehnsherr | THREAT_5 | Mutant | 70 | 50 | 60 | 80 | Flight, Magnetism, Force Field |
| Doctor Death | Victor Von Doom | THREAT_5 | Tech | 90 | 60 | 80 | 90 | Force Field, Energy Blast, Flight |
| Steelheart | Dan Stark | THREAT_4 | Tech | 55 | 80 | 120 | 100 | Flight, Super Strength, Energy Blast, Repulsor Blast, Micro-Missiles, Power Armor |
| Blur | Barry Allen | THREAT_4 | Altered | 80 | 200 | 50 | 90 | Super Speed, Time Manipulation |
| Feral | Logan Howlett | THREAT_4 | Mutant | 130 | 100 | 80 | 150 | Claws, Regeneration, Enhanced Senses |
| The Joking Man | Jack Napier | THREAT_4 | Altered | 80 | 70 | 40 | 50 | (gadgets, no powers) |
| The Shadow | Bruce Wayne | THREAT_3 | Skilled | 140 | 120 | 70 | 80 | (gadgets, martial arts) |
| The Spider | Pete Parker | THREAT_3 | Altered | 100 | 130 | 90 | 80 | Super Agility, Super Strength, Wall Crawling, Danger Sense |
| Sentinel | Steve Rodgers | THREAT_3 | Altered | 120 | 90 | 100 | 100 | Super Strength, Super Agility, Regeneration |
| Hawkwing | Shiera Hall | THREAT_3 | Alien | 110 | 100 | 80 | 85 | Flight, Super Strength (Nth Metal) |
| The Mastermind | Lex Luther | THREAT_3 | Skilled | 50 | 40 | 40 | 50 | (tech genius, no powers) |
| Black Mamba | Natasha Romanoff | THREAT_2 | Skilled | 120 | 110 | 50 | 70 | (martial arts, espionage) |
| The Archer | Oliver Queen | THREAT_2 | Skilled | 100 | 120 | 60 | 70 | (specialty arrows) |

---

## MARTIAL ARTS TRAINING

| Fighter | Style 1 (Belt) | Style 2 (Belt) | Style 3 (Belt) |
|---------|----------------|----------------|----------------|
| The Shadow | Counter (10) | Striking (9) | Grappling (8) |
| Black Mamba | Counter (9) | Submission (8) | Striking (7) |
| Valkyrie | Striking (8) | Grappling (7) | - |
| Feral | Striking (8) | Counter (7) | - |
| Thunderstrike | Striking (7) | Grappling (6) | - |
| Sentinel | Striking (7) | Counter (6) | - |
| The Archer | Counter (7) | Striking (6) | - |
| The Spider | Counter (6) | Internal (5) | - |

### Belt Ranks
| Belt | Rank | MEL Bonus |
|------|------|-----------|
| White | 1 | +1 |
| Yellow | 2 | +2 |
| Orange | 3 | +3 |
| Green | 4 | +4 |
| Blue | 5 | +5 |
| Purple | 6 | +6 |
| Brown | 7 | +7 |
| Red | 8 | +8 |
| Black I | 9 | +9 |
| Black II | 10 | +10 |

### Five Martial Arts Styles
| Style | Role | Primary Stat | Techniques |
|-------|------|--------------|------------|
| Grappling | Control & Positioning | STR | Clinch, Takedown, Hip Throw, Suplex, Slam, Pin, Lift & Carry, Pile Driver |
| Submission | Finisher & Incapacitation | MEL | Guard Pull, Armbar, Triangle, Kimura, Rear Naked, Heel Hook, Neck Crank, Blood Choke |
| Internal | Redirection & Defense | INS | Deflect, Redirect, Push, Joint Lock, Energy Steal, Circle Walk, Iron Body, Dim Mak |
| Counter | Reactive & Efficient | AGL | Intercept, Parry-Riposte, Eye Jab, Low Kick, Disarm, Throat Strike, Break Guard, Simultaneous |
| Striking | Damage & Pressure | STR | Jab, Cross, Hook, Uppercut, Elbow, Knee, Spinning Back, Superman Punch |

---

## POWERS

### Offensive Powers
| ID | Name | Damage | Type | Notes |
|----|------|--------|------|-------|
| pwr_heat_vision | Heat Vision | 45 | Energy | Laser eyes |
| pwr_lightning_control | Lightning Control | 50 | Energy | Electrical storms |
| pwr_energy_blast | Energy Blast | 40 | Energy | Generic energy |
| pwr_repulsor_blast | Repulsor Blast | 50 | Energy | Tech-based |
| pwr_missiles | Micro-Missiles | 60 | Tech | Area damage |
| pwr_super_strength | Super Strength | 30 | Physical | Enhanced melee |
| pwr_claws | Claws | 25 | Physical | Razor-sharp metal claws |
| pwr_super_speed | Super Speed | 15 | Physical | Fast attacks |

### Control Powers (No Direct Damage)
| ID | Name | Effect | Type |
|----|------|--------|------|
| pwr_magnetism | Magnetism | Disarm metal weapons, manipulate metal | Energy |
| pwr_mind_control | Mind Control | Target skips turn or attacks allies | Mental |
| pwr_telepathy | Telepathy | Read minds, mental communication | Mental |
| pwr_time_manipulation | Time Manipulation | Slow/stop time | Cosmic |

### Defensive Powers
| ID | Name | Effect |
|----|------|--------|
| pwr_invulnerability | Invulnerability | Damage reduction |
| pwr_regeneration | Regeneration | Heal over time |
| pwr_force_field | Force Field | Block attacks |
| pwr_power_armor | Power Armor | Tech-based DR |

### Mobility Powers
| ID | Name | Effect |
|----|------|--------|
| pwr_flight | Flight | Aerial movement |
| pwr_wall_crawling | Wall Crawling | Climb surfaces |
| pwr_super_agility | Super Agility | Enhanced dodge |

---

## MATERIALS (for visual effects)

| Material | Magnetism | Conductivity | Flammability | Particle Effect |
|----------|-----------|--------------|--------------|-----------------|
| Steel | 0.9 | 0.7 | 0 | SPARKS |
| Iron | 1.0 | 0.6 | 0 | SPARKS |
| Titanium | 0 | 0.3 | 0 | SPARKS (white) |
| Copper | 0 | 1.0 | 0 | SPARKS (orange) |
| Wood | 0 | 0 | 0.9 | SPLINTERS |
| Plastic | 0 | 0 | 0.6 | FRAGMENTS |
| Glass | 0 | 0 | 0 | SHATTER |
| Organic | 0 | 0.1 | 0.7 | BLOOD |
| Energy | 0 | 1.0 | 0 | PLASMA |
| Kevlar | 0 | 0 | 0.2 | FIBERS |
| Indestructium | 0.3 | 0.2 | 0 | SPARKS (blue) |
| Absorbium | 0 | 0.1 | 0 | RIPPLE (absorbs) |

---

## DAMAGE TYPES & VISUAL EFFECTS

| Damage Type | Sub Type | Particle Effect | Color |
|-------------|----------|-----------------|-------|
| PHYSICAL | EDGED_MELEE | Blood splatter, slash trails | Red |
| PHYSICAL | SMASHING_MELEE | Impact dust, cracks | Gray |
| PHYSICAL | PIERCING_MELEE | Blood, puncture | Dark red |
| BLEED_PHYSICAL | GUNFIRE | Blood, bullet trails | Red + yellow |
| BLEED_PHYSICAL | ARROW | Blood, arrow stick | Red |
| PHYSICAL | BUCKSHOT | Spread impact, fragments | Gray + red |
| ENERGY | LASER | Beam line, burn marks | Red/blue |
| ENERGY | PLASMA | Plasma ball, scorch | Purple/pink |
| ENERGY | ELECTRIC | Lightning arcs, sparks | Blue/white |
| FIRE | INCENDIARY | Flames, embers | Orange/yellow |
| COLD | CRYO | Ice crystals, frost | Blue/white |
| ACID | CORROSIVE | Dissolve effect, smoke | Green |
| SONIC | CONCUSSION | Ripple waves | Transparent |
| EXPLOSIVE | BLAST | Explosion, debris | Orange + gray |

---

## ARROWS (The Archer specialty ammo)

| Arrow Type | Effect | Particle |
|------------|--------|----------|
| Standard | Base damage | Normal arrow trail |
| Broadhead | +25% damage, bleeding | Blood trail |
| Bodkin | Armor piercing | Sparks on armor |
| Explosive | Area damage | Explosion |
| Acid | DOT, ignores armor | Green dissolve |
| EMP | Disables tech | Blue electric pulse |
| Cryo | Freeze, slow | Ice crystals |
| Fire | Burn DOT | Flames |
| Poison | DOT | Purple mist |
| Net | Entangle | Net deploy |
| Smoke | Concealment | Smoke cloud |
| Flashbang | Blind/deafen | White flash |
| Sonic | Stun | Sound waves |
| Grapple | Mobility | Rope trail |

---

## STATUS EFFECTS

| Effect | Duration | Damage/Turn | Visual |
|--------|----------|-------------|--------|
| Bleeding I-III | 3-5 turns | 5-20 | Blood drops |
| Poisoned I-III | 6-10 turns | 3-15 | Green tint |
| Burning | 3 turns | 10 | Fire particles |
| Frozen | 2 turns | 0 | Ice overlay |
| Stunned | 1 turn | 0 | Stars |
| Blinded | 2 turns | 0 | Dark overlay |
| Mind Controlled | 2 turns | 0 | Purple glow |
| Disarmed | 3 turns | 0 | Weapon drop |

---

## STAT FORMULAS

- **Health** = (STA × 2) + STR
- **Initiative** = (AGL + INS) / 2
- **Movement** = 6 + (AGL / 10)
- **Karma** = (INT + INS + CON) / 3
- **Hit Chance** = MEL (or AGL for ranged) - (Defender AGL / 3) + 30

---

## DATABASE TABLES

1. **characters** - 18 heroes/villains with full stats
2. **powers** - 76 powers with damage, roles, effects
3. **character_powers** - Links characters to powers
4. **weapons** - 45 weapons with damage, range, materials
5. **skills** - 74 skills (combat, talents, martial arts)
6. **martial_arts_styles** - 5 styles (Grappling, Submission, Internal, Counter, Striking)
7. **martial_arts_techniques** - 40 techniques (8 per style)
8. **status_effects** - 70+ effects with durations
9. **materials** - 20 materials with properties
10. **ammunition** - Specialty ammo including 14 arrow types
11. **cities** - 1,041 world cities
12. **countries** - 169 countries
13. **factions** - 12 factions

---

## QUERIES FOR OTHER AI

```sql
-- Get all characters with powers
SELECT c.alias, c.threat_level, p.name, p.damage, p.role
FROM characters c
LEFT JOIN character_powers cp ON c.id = cp.character_id
LEFT JOIN powers p ON cp.power_id = p.id
ORDER BY c.threat_level DESC, c.alias;

-- Get all weapons with materials
SELECT w.name, w.base_damage, w.damage_type, m.name as material
FROM weapons w
LEFT JOIN materials m ON w.primary_material = m.id;

-- Get martial arts techniques
SELECT s.name as style, t.name as technique, t.damage, t.effect
FROM martial_arts_techniques t
JOIN martial_arts_styles s ON t.style_id = s.id
ORDER BY s.name, t.belt_required;
```
