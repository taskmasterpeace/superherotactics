# Complete Character Schema Specification

## Overview

This document defines **every field** that makes up a character in SuperHero Tactics. Use this as the master reference when building character creation, character sheets, save files, and database schemas.

**Total Fields: 85+**

---

## 1. IDENTITY (8 fields)

Core information about who the character is.

| Field | ID | Data Type | Required | Input Type | Description |
|-------|-----|-----------|----------|------------|-------------|
| Character Name | `character_name` | String | Yes | Text Input | Legal/birth name |
| Alias | `alias` | String | No | Text Input | Hero/villain codename |
| Nationality | `nationality` | String | Yes | Dropdown | Country of origin |
| Faction | `faction` | Enum | Yes | Dropdown | Superpower bloc allegiance |
| Origin Type | `origin_type` | Enum | Yes | Dropdown | How they got powers |
| Threat Level | `threat_level` | Enum | Calculated | Display Only | LeFevre danger assessment |
| Age | `age` | Integer | Yes | Number Input | Character's age (affects some origins) |
| Gender | `gender` | String | Optional | Text/Dropdown | For description purposes |

### Faction Options
```
US          - United States bloc
India       - Indian bloc
China       - Chinese bloc
Nigeria     - Nigerian bloc
Independent - No faction allegiance
```

### Origin Type Options
| ID | Name | Description | Example Characters |
|----|------|-------------|-------------------|
| 1 | Skilled Human | Non-powered, exceptional training/equipment | Batman, Black Widow, Punisher |
| 2 | Altered Human | Transformed by accident/experiment | Hulk, Spider-Man, Captain America |
| 3 | Mutant | Born with genetic mutation | X-Men, Magneto |
| 4 | Tech Enhancement | Augmented with technology | Iron Man, Cyborg |
| 5 | Mystic | Magic/supernatural powers | Doctor Strange, Scarlet Witch |
| 6 | Alien | Non-human species | Superman, Martian Manhunter |
| 7 | Cosmic | Powers from cosmic entities | Silver Surfer, Captain Marvel |
| 8 | Divine | Gods/demigods | Thor, Wonder Woman |
| 9 | Construct | Artificial beings/robots | Vision, Ultron |

### Threat Level Scale
| Level | Name | Description |
|-------|------|-------------|
| Alpha | Peak Human | Maximum human capability |
| 1 | Low Superhuman | Minor superhuman abilities |
| 2 | Superhuman | Solid superhuman level |
| 3 | High Superhuman | Major league hero |
| 4 | Very High | Near cosmic level |
| 5 | Peak Superhuman | Pre-cosmic power |
| 6+ | Cosmic/Earthshaker | Reality-affecting powers |

---

## 2. PRIMARY STATS (7 fields)

Core attributes that define capabilities. All use numeric values 1-150+.

| Stat | Code | Range | Input Type | Description | Combat Use | Investigation Use |
|------|------|-------|------------|-------------|------------|-------------------|
| Melee | `mel` | 1-150+ | Number Slider | Hand-to-hand combat | Hit roll for melee attacks | Interrogation |
| Agility | `agl` | 1-150+ | Number Slider | Reflexes, coordination | Dodge, ranged accuracy | Stealth, pursuit |
| Strength | `str` | 1-150+ | Number Slider | Physical power | Damage bonus, knockback | Breaking objects |
| Stamina | `sta` | 1-150+ | Number Slider | Endurance, health | Max HP, status resist | Stakeouts, torture resist |
| Intelligence | `int` | 1-150+ | Number Slider | Reasoning, tech | Tactical planning | Primary investigation stat |
| Instinct | `ins` | 1-150+ | Number Slider | Intuition, awareness | Initiative, detect ambush | Reading people, gut feelings |
| Concentration | `con` | 1-150+ | Number Slider | Willpower, focus | Resist mind control | Resist interrogation |

### Stat Rank Thresholds
| Value | Rank Name | Description |
|-------|-----------|-------------|
| 1-5 | Feeble | Below average human |
| 6-10 | Poor | Below average |
| 11-15 | Good | Average human |
| 16-25 | Excellent | Peak human |
| 26-35 | Remarkable | Olympic level |
| 36-50 | Incredible | Low superhuman |
| 51-75 | Amazing | Superhuman |
| 76-100 | Monstrous | High superhuman |
| 101-150 | Unearthly | Near cosmic |
| 151+ | Beyond | Cosmic level |

---

## 3. DERIVED STATS (7 fields)

Automatically calculated from primary stats. **Do not allow direct input.**

| Stat | Code | Formula | Description |
|------|------|---------|-------------|
| Health | `health` | (STA × 2) + STR | Total hit points |
| Initiative | `initiative` | (AGL + INS) / 2 | Turn order in combat |
| Karma | `karma` | (INT + INS + CON) / 3 | Luck points for rerolls |
| Dodge CS (Melee) | `dodge_melee` | Lookup(AGL + INS) | Column shift vs melee attacks |
| Dodge CS (Ranged) | `dodge_ranged` | Lookup(AGL) | Column shift vs ranged attacks |
| Movement | `movement` | 6 + (AGL / 10) | Squares per turn |
| Carry Capacity | `carry_cap` | STR × 10 lbs | Weight that can be carried |

### Karma Usage (TBD - needs design)
- Reroll failed attack
- Reroll failed dodge
- Reduce damage taken
- Boost investigation roll
- *Exact costs and mechanics to be determined*

---

## 4. THREAT ASSESSMENT (3 fields)

LeFevre system for categorizing danger level. Used by governments/agencies.

| Field | Code | Formula | Description |
|-------|------|---------|-------------|
| PCF | `pcf` | (Intensity × Control × Range) / 1000 | Power Capability Factor |
| STAM | `stam` | 0.3×Personality + 0.4×Motivation + 0.3×Harm | Stability Assessment |
| SPAM | `spam` | Situational Matrix | Current threat evaluation |

### PCF Components
- **Intensity** (1-10): How powerful is each use of power
- **Control** (1-10): How well can they control it
- **Range** (1-1000): Area of effect in meters

### STAM Components
- **Personality** (1-10): How stable is their mental state
- **Motivation** (1-10): What drives them (1=altruistic, 10=destructive)
- **Harm Potential** (1-10): Damage they could cause if they tried

*Note: These may be simplified for gameplay or handled by AI assessment*

---

## 5. EDUCATION & CAREER (5 fields)

What the character did/does outside of hero work. Provides skill bonuses.

| Field | Code | Data Type | Input Type | Description |
|-------|------|-----------|------------|-------------|
| Career Category | `career_cat` | Enum (1-7) | Dropdown | Field of expertise |
| Career Rank | `career_rank` | Enum (1-5) | Dropdown | Advancement level |
| Current Job | `current_job` | String | Dropdown (filtered) | Specific position |
| Education Level | `education` | Enum | Dropdown | Highest education |
| Skill Bonuses | `career_skills` | Derived | Display Only | +CS from career |

### Career Categories
| ID | Category | Covers | Example Skills |
|----|----------|--------|----------------|
| 1 | Medical & Life Sciences | Forensics, healing, chemistry, radiation | +CS Medicine, Forensics, Chemistry |
| 2 | Visual & Performance Arts | Bluff, spying, media manipulation | +CS Deception, Performance, Disguise |
| 3 | Liberal Arts | General education, politics, journalism | +CS Research, Persuasion, Politics |
| 4 | Engineering/Tech | Mechanics, computers, hacking | +CS Computers, Engineering, Hacking |
| 5 | Business | Corporate, finance, economics | +CS Finance, Negotiation, Contacts |
| 6 | Psychology | Mental manipulation, interrogation | +CS Interrogation, Psychology, Insight |
| 7 | Physical/Practical | Combat training, sports, law enforcement | +CS Athletics, Combat, Investigation |

### Career Ranks & Jobs
| Rank | Level | Cat 1 (Medical) | Cat 4 (Tech) | Cat 7 (Physical) |
|------|-------|-----------------|--------------|------------------|
| 1 | Entry | Physician, Vet, Pharmacist | IT Tech, Mechanic | Construction, Patrol Officer |
| 2 | Experienced | Radiologist, Surgeon | Architect, Web Dev | PMC Soldier, Detective |
| 3 | Expert | Neurosurgeon, Researcher | Software Dev, Hacker | SWAT, Special Forces |
| 4 | Elite | Virology Researcher | AI Researcher, Aerospace | Agency Operative |
| 5 | Master | Mutagenics Researcher | Rocket Scientist | Director, General |

### Skill Bonuses by Category/Rank
```
Rank 1: +1CS in category specialty
Rank 2: +1CS specialty, +1CS related
Rank 3: +2CS specialty, +1CS related
Rank 4: +2CS specialty, +2CS related
Rank 5: +3CS specialty, +2CS related
```

---

## 6. POWERS (Up to 6 powers, 3 fields each = 18 fields)

Superhuman abilities. Constrained by Origin Type.

| Field | Code | Data Type | Input Type | Description |
|-------|------|-----------|------------|-------------|
| Power Name | `power_X_name` | String | Dropdown (filtered by origin) | Power from catalog |
| Power Level | `power_X_level` | Enum | Dropdown | Low / High intensity |
| Power Rank | `power_X_rank` | Integer | Number (1-150+) | Stat value for power effects |

*Where X = 1-6 for up to 6 power slots*

### Power Level Effects
| Level | Damage Mult | Range Mult | Duration Mult |
|-------|-------------|------------|---------------|
| Low | 0.5x | 0.5x | 0.5x |
| High | 1.5x | 1.5x | 1.5x |

### Origin Power Restrictions
| Origin | Allowed Power Types |
|--------|---------------------|
| Skilled Human | None (equipment only) |
| Altered Human | Physical, some Energy |
| Mutant | Any |
| Tech Enhancement | Tech-based, Physical |
| Mystic | Magic, Mental, Reality |
| Alien | Species-specific |
| Cosmic | Any |
| Divine | Domain-specific |
| Construct | Programmed abilities |

*See Power_Recommendations.md for full power catalog*

---

## 7. SKILLS (5 slots)

Trained abilities that add Column Shifts to rolls.

| Field | Code | Data Type | Input Type | Description |
|-------|------|-----------|------------|-------------|
| Skill 1 | `skill_1` | String | Dropdown | Trained skill (+XCS) |
| Skill 2 | `skill_2` | String | Dropdown | |
| Skill 3 | `skill_3` | String | Dropdown | |
| Skill 4 | `skill_4` | String | Dropdown | |
| Skill 5 | `skill_5` | String | Dropdown | |

### Skill List (Dropdown Options)
| Skill | Bonus | Applies To |
|-------|-------|------------|
| Martial Arts | +2CS | Melee attacks |
| Wrestling | +2CS | Grappling |
| Boxing | +2CS | Punching attacks |
| Shooting | +2CS | Ranged weapon attacks |
| Sniper | +2CS | Long range attacks |
| Dodge | +2CS | Avoiding attacks |
| Stealth | +2CS | Hiding, sneaking |
| Piloting | +2CS | Vehicle operation |
| Detective | +2CS | Investigation |
| Hacking | +2CS | Computer intrusion |
| Medicine | +2CS | Healing, diagnosis |
| Intimidation | +2CS | Threatening |
| Persuasion | +2CS | Convincing |
| Streetwise | +2CS | Criminal knowledge |
| Survival | +2CS | Wilderness, tracking |

---

## 8. TALENTS (3 slots)

Innate/special abilities that provide unique effects.

| Field | Code | Data Type | Input Type | Description |
|-------|------|-----------|------------|-------------|
| Talent 1 | `talent_1` | String | Dropdown | Special ability |
| Talent 2 | `talent_2` | String | Dropdown | |
| Talent 3 | `talent_3` | String | Dropdown | |

### Talent List (Dropdown Options)
| Talent | Effect |
|--------|--------|
| Roll With Blow | Halve blunt/smashing damage |
| Block | Can parry melee attacks |
| Escape Artist | Exit combat unseen when not observed |
| Iron Will | +2CS vs interrogation/mental attacks |
| Danger Sense | Cannot be surprised |
| Quick Draw | Draw weapon as free action |
| Ambidextrous | No penalty for off-hand |
| Photographic Memory | Perfect recall |
| Speed Reader | Research in half time |
| Linguist | Know extra languages |
| Contacts | Additional contact slots |
| Resources | Higher starting wealth |

---

## 9. EQUIPMENT (4+ fields)

Gear the character owns and uses.

| Field | Code | Data Type | Input Type | Description |
|-------|------|-----------|------------|-------------|
| Primary Weapon | `weapon_1` | Reference | Dropdown | Main weapon (from Weapons_Complete) |
| Secondary Weapon | `weapon_2` | Reference | Dropdown | Backup weapon |
| Armor | `armor` | Reference | Dropdown | Worn protection |
| Gear | `gear` | Array | Multi-select | Other equipment |

### Equipment References
Equipment links to IDs in master data files:
- `Weapons_Complete.csv` - All weapons
- `Tech_Gadgets_Complete.csv` - Tech, vehicles, gadgets
- Armor system (TBD - needs dedicated file)

---

## 10. COMBAT STATE (8 fields)

Dynamic values that change during battle. **Not saved to character sheet.**

| Field | Code | Data Type | Default | Description |
|-------|------|-----------|---------|-------------|
| Current HP | `current_hp` | Integer | = health | Remaining health |
| Current AP | `current_ap` | Integer | 6 | Action points this turn |
| Stance | `stance` | Enum | Neutral | Combat stance |
| Mode | `mode` | Enum | None | Active combat mode |
| Status Effects | `status_effects` | Array | [] | Active conditions |
| Position X | `pos_x` | Integer | Spawn | Grid X coordinate |
| Position Y | `pos_y` | Integer | Spawn | Grid Y coordinate |
| Elevation | `elevation` | Integer | 0 | Height level |

### Stance Options
```
Neutral, Defensive, Aggressive, Grappling, Low, Mobile, Power, Sniper
```

### Mode Options
```
None, Alert, Overwatch, Aim, Suppressive Fire, Guard Ally, Ready Action
```

### Status Effect Options
```
Burning, Bleeding, Stunned, Prone, Grappled, Frightened, Poisoned,
Blinded, Deafened, Exhausted, Frozen, Electrified
```

---

## 11. PERSONALITY (3 fields)

Character's psychological profile.

| Field | Code | Data Type | Input Type | Description |
|-------|------|-----------|------------|-------------|
| Personality Type | `personality_type` | Enum (1-20) | Dropdown | AI behavior pattern |
| Personality Traits | `personality_traits` | String | Text | Roleplay description |
| Target Preference | `target_pref` | Derived | Display | Combat targeting |

### Personality Types & AI Targeting
| Type | Name | Target Preference |
|------|------|-------------------|
| 1 | Protector | Most Health (engage biggest threat) |
| 2 | Predator | Least Health (finish wounded) |
| 3 | Pragmatic | Major Threat (highest damage dealer) |
| 4 | Opportunist | Minor Threat (easy targets) |
| 5 | Chaotic | Random |
| 6-20 | *Additional types TBD* | Various combinations |

---

## 12. WEAKNESSES (2 slots)

Vulnerabilities based on origin and personality.

| Field | Code | Data Type | Input Type | Description |
|-------|------|-----------|------------|-------------|
| Weakness 1 | `weakness_1` | String | Dropdown + Text | Primary vulnerability |
| Weakness 2 | `weakness_2` | String | Dropdown + Text | Secondary vulnerability |

### Weakness Categories
| Category | Examples |
|----------|----------|
| Environmental | Kryptonite, fire, cold, water |
| Psychological | Rage trigger, protective of X, phobia |
| Equipment Dependency | Needs suit, needs weapon, needs power source |
| Power Source | Loses powers in X condition |
| Physical | Weak point, allergy, biological |

---

## 13. CONTACTS (3 slots)

NPCs the character knows.

| Field | Code | Data Type | Input Type | Description |
|-------|------|-----------|------------|-------------|
| Contact 1 | `contact_1` | Object | Structured | Name, relationship, usefulness |
| Contact 2 | `contact_2` | Object | Structured | |
| Contact 3 | `contact_3` | Object | Structured | |

### Contact Structure
```javascript
{
    name: "Agent Morrison",
    relationship: "FBI Handler", // or: Friend, Enemy, Family, Professional
    usefulness: "Law enforcement access, intel",
    faction: "US",
    trust_level: 3  // 1-5 scale
}
```

---

## 14. BACKGROUND (4 fields)

Narrative/roleplay information.

| Field | Code | Data Type | Input Type | Description |
|-------|------|-----------|------------|-------------|
| Appearance | `appearance` | String | Text Area | Physical description |
| Backstory | `backstory` | String | Text Area | Origin story |
| Motivations | `motivations` | String | Text Area | What drives them |
| Reputation | `reputation` | Integer | Slider (-100 to +100) | Public opinion |

---

## 15. RESOURCES & ECONOMY (4 fields)

Economic capability and social standing.

| Field | Code | Data Type | Input Type | Description |
|-------|------|-----------|------------|-------------|
| Resource Level | `resources` | Enum | Dropdown | Wealth tier |
| Fame | `fame` | Integer | Slider (0-100) | How well-known |
| Infamy | `infamy` | Integer | Slider (0-100) | How feared |
| Income Source | `income_source` | String | Dropdown | How they make money |

### Resource Levels
| Level | Description | Monthly Income (USD equiv) |
|-------|-------------|---------------------------|
| Poverty | Struggling | < $500 |
| Low | Working class | $500 - $2,000 |
| Medium | Middle class | $2,000 - $10,000 |
| High | Upper class | $10,000 - $50,000 |
| Wealthy | Rich | $50,000 - $500,000 |
| Elite | Super rich | $500,000+ |

### Resources by Country (TBD)
*Need to establish purchasing power parity across factions*
- US Dollar baseline
- Other factions may have different effective buying power
- Local vs international purchasing

---

## 16. WORLD POSITION (5 fields) - NEW

Where the character is on the strategic map.

| Field | Code | Data Type | Input Type | Description |
|-------|------|-----------|------------|-------------|
| Current Country | `world_country` | String | Dropdown | Country they're in |
| Current City | `world_city` | String | Dropdown (filtered) | City they're in |
| Current Location | `world_location` | String | Dropdown | Specific location type |
| Home Base | `home_base` | String | Dropdown | Where they live |
| Travel Status | `travel_status` | Enum | Display | Stationary/In Transit |

### Location Types
```
Headquarters, Safehouse, Hospital, Prison, Hotel, Street,
Underground, Airborne, At Sea, In Space
```

### Travel Status
```
Stationary - At a fixed location
Local Transit - Moving within city (minutes)
Regional Transit - Moving between cities (hours)
International Transit - Moving between countries (days)
```

*Links to Travel_Time_System.csv for transit calculations*

---

## 17. FACTION RELATIONS (5 fields) - NEW

Standing with each major power bloc.

| Field | Code | Data Type | Range | Description |
|-------|------|-----------|-------|-------------|
| US Standing | `standing_us` | Integer | -100 to +100 | Relationship with US |
| India Standing | `standing_india` | Integer | -100 to +100 | Relationship with India |
| China Standing | `standing_china` | Integer | -100 to +100 | Relationship with China |
| Nigeria Standing | `standing_nigeria` | Integer | -100 to +100 | Relationship with Nigeria |
| Wanted Level | `wanted_level` | Object | Per-faction | Legal status |

### Standing Thresholds
| Value | Relationship |
|-------|--------------|
| -100 to -75 | Hostile (Kill on Sight) |
| -74 to -25 | Unfriendly (Watched) |
| -24 to +24 | Neutral |
| +25 to +74 | Friendly (Cooperates) |
| +75 to +100 | Allied (Full Support) |

### Wanted Level Structure
```javascript
{
    us: { wanted: false, level: 0, crimes: [] },
    india: { wanted: true, level: 3, crimes: ["Vigilantism"] },
    china: { wanted: false, level: 0, crimes: [] },
    nigeria: { wanted: false, level: 0, crimes: [] }
}
```

---

## 18. INVESTIGATION STATE (TBD)

*This system needs full design - placeholder fields*

| Field | Code | Data Type | Description |
|-------|------|-----------|-------------|
| Active Cases | `active_cases` | Array | Current investigations |
| Clues Found | `clues` | Array | Evidence collected |
| Leads | `leads` | Array | People/places to check |
| Case Progress | `case_progress` | Object | Per-case completion % |

*See Investigation System design document (TBD)*

---

## WHAT'S MISSING / NEEDS DESIGN

### High Priority (Gameplay Critical)
1. **Investigation System** - How investigations work, clue gathering, case resolution
2. **Armor System** - Dedicated armor data file with DR, condition, types
3. **Karma Usage** - Exact mechanics for spending karma points
4. **Resources by Country** - Economic parity across factions

### Medium Priority (Important for Depth)
5. **Language Skills** - What languages character speaks
6. **Team Membership** - What team/organization they belong to
7. **Mission/Assignment** - Current active mission
8. **Injuries** - Persistent injuries from combat

### Lower Priority (Nice to Have)
9. **Allies/Enemies List** - Named NPCs with relationships
10. **Property Owned** - Vehicles, real estate, etc.
11. **Trophies/Achievements** - Past accomplishments
12. **Timeline** - Character history events

---

## FIELD COUNT SUMMARY

| Category | Fields |
|----------|--------|
| Identity | 8 |
| Primary Stats | 7 |
| Derived Stats | 7 |
| Threat Assessment | 3 |
| Education/Career | 5 |
| Powers (6 × 3) | 18 |
| Skills | 5 |
| Talents | 3 |
| Equipment | 4 |
| Combat State | 8 |
| Personality | 3 |
| Weaknesses | 2 |
| Contacts | 3 |
| Background | 4 |
| Resources | 4 |
| World Position | 5 |
| Faction Relations | 5 |
| **TOTAL** | **94 fields** |

---

## RELATED FILES

| File | Purpose |
|------|---------|
| `Character_Template.csv` | Basic template with example |
| `Primary_Stats_Spec.csv` | Stat details and interactions |
| `Origin_Types.csv` | Origin definitions and modifiers |
| `Education_Career_Sheet.csv` | Career categories and jobs |
| `Combat_Modes_Stances.csv` | Stance/mode options |
| `Weapons_Complete.csv` | Weapon equipment data |
| `Tech_Gadgets_Complete.csv` | Tech equipment data |
| `Power_Recommendations.md` | Power catalog |

---

*Last Updated: 2024-12-05*
*Version: 1.0*
