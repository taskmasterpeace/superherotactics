---
name: sht-investigation
description: Design investigation templates, mission generators, and the email-based dialogue system for SuperHero Tactics strategic gameplay.
---

# SHT Investigation Designer

You design investigations, missions, and the email-based dialogue system that drives the strategic layer gameplay.

## Key Data Files

- `MVP/src/stores/gameStore.ts` - Investigation interface
- `MVP/src/components/WorkingInvestigationCenter.tsx` - Investigation UI
- `MVP/src/data/cities.ts` - City types drive investigation themes
- `MVP/src/data/countries_part*.ts` - Country policies affect consequences

## Investigation Interface

```typescript
interface Investigation {
  id: string;
  title: string;
  description: string;
  location: {
    country: string;
    city: string;
  };
  difficulty: number;         // 1-10 scale
  priority: 'critical' | 'high' | 'medium' | 'low';
  timeLimit: number;          // Hours until expiration
  assignedCharacters: string[];
  progress: number;           // 0-100%
  rewards: string[];          // What you gain on success
  consequences: string[];     // What happens on failure
}
```

## City Type → Investigation Templates

### Military Cities
- Arms trafficking investigation
- Defector extraction
- Weapons test sabotage
- Military base infiltration
- Mercenary recruitment
- Black market weapons

### Political Cities
- Corruption investigation
- Assassination prevention
- Diplomatic espionage
- Political scandal exposure
- Embassy incident
- Election interference

### Temple Cities
- Cult activity investigation
- Artifact theft recovery
- Mystic power emergence
- Religious extremist cell
- Ancient conspiracy
- Supernatural phenomenon

### Industrial Cities
- Corporate sabotage
- Industrial espionage
- Worker unrest investigation
- Pollution cover-up
- Supply chain disruption
- Factory hostage situation

### Company Cities
- Data theft investigation
- Hostile takeover prevention
- Insider trading exposure
- Tech prototype recovery
- Executive kidnapping
- Corporate assassination

### Educational Cities
- Student radical cell
- Research theft
- Academic cover-up
- Campus shooting prevention
- LSW awakening at university
- Recruitment of gifted students

### Mining Cities
- Resource theft
- Worker exploitation
- Environmental disaster
- Smuggling operation
- Underground lab discovery
- Ancient artifact excavation

### Resort Cities
- VIP protection
- Organized crime presence
- Trafficking investigation
- Casino money laundering
- Celebrity incident
- Terrorist plot at resort

### Seaport Cities
- Smuggling interdiction
- Piracy investigation
- Naval base espionage
- Shipping lane protection
- Port corruption
- Refugee crisis

## Difficulty Formula

```
BaseDifficulty = crimeIndex / 10
CountryModifier = (100 - lawEnforcement) / 20
TypeModifier = (Military: +2, Political: +1, Temple: +1, Other: 0)

FinalDifficulty = BaseDifficulty + CountryModifier + TypeModifier
```

**Example**:
- Kabul (crimeIndex: 76), Afghanistan (lawEnforcement: 35), Military city
- `Difficulty = 7.6 + 3.25 + 2 = 12.85` → Capped at 10

## Priority Levels

| Priority   | Timer      | Reward Mult | Consequence |
|------------|------------|-------------|-------------|
| Critical   | 24 hours   | 2.0x        | Major story impact |
| High       | 72 hours   | 1.5x        | Reputation loss |
| Medium     | 168 hours  | 1.0x        | Minor setback |
| Low        | 336 hours  | 0.75x       | Optional content |

## Progress Mechanics

Progress increases based on:
- Number of assigned characters
- Character skills matching investigation type
- Investigation method chosen
- Time invested
- Random events (breakthroughs, setbacks)

```
HourlyProgress = (NumCharacters * SkillMatch * Method) / Difficulty
```

## Email Dialogue System

The game uses emails instead of traditional NPC dialogue.

### Email Types

1. **Priority Emails** - Mission-critical, from faction leaders
   - Red icon, notification sound
   - Time-sensitive
   - Major story decisions

2. **Standard Emails** - Reports, updates, rumors
   - Normal icon
   - Optional reading
   - World-building content

3. **Contact Requests** - New NPCs reaching out
   - Blue icon
   - Recruitment opportunities
   - Alliance proposals

### Email Structure

```typescript
interface GameEmail {
  id: string;
  from: string;           // Sender name/organization
  subject: string;
  body: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  timestamp: number;
  read: boolean;
  expires?: number;       // Optional expiration
  replies: EmailReply[];  // Response options
  investigation?: string; // Linked investigation ID
}

interface EmailReply {
  id: string;
  text: string;           // What player says
  consequences: string[]; // Effects of choosing this
  nextEmailId?: string;   // Triggers follow-up email
}
```

### Email Chain Example

```
FROM: Director Sarah Chen, Nigerian Intelligence
SUBJECT: [CRITICAL] Arms Shipment Intercepted

Our operatives discovered a container ship bound for Lagos
carrying advanced energy weapons. We need your team to
investigate the source before the weapons reach the black market.

Time is critical - the ship docks in 18 hours.

[ ] "We'll intercept the ship"
    → Start investigation, +5 Nigeria standing

[ ] "This is your jurisdiction"
    → Decline, -3 Nigeria standing

[ ] "What's in it for us?"
    → Negotiate better rewards, delay 2 hours
```

## Investigation Templates

### Template Format
```yaml
id: "INV_TEMPLATE_001"
name: "Arms Trafficking"
cityTypes: ["Military", "Industrial", "Seaport"]
difficultyBase: 6
durationHours: 48
rewards:
  - "$10,000 - $50,000 (scaled by difficulty)"
  - "Intel on weapon suppliers"
  - "Faction standing +5"
consequences:
  - "Weapons enter black market"
  - "LSW threat escalation"
  - "Faction standing -10"
steps:
  - "Identify shipment route"
  - "Locate warehouse"
  - "Infiltrate or assault"
  - "Secure evidence"
  - "Extraction"
skills_helpful:
  - "Stealth"
  - "Investigation"
  - "Combat"
```

## Example Queries

- "Generate 5 investigation templates for a Military city with crimeIndex 75"
- "Design an email chain for a double-agent recruitment mission"
- "Create consequences table for failed investigation in China"
- "Build difficulty scaling formula based on city population and crime"
- "Design a 3-stage investigation with branching outcomes"

## Faction Consequences

### USA Operations
- Success: +reputation, tech access, funding
- Failure: Media exposure, congressional inquiry

### China Operations
- Success: +resources, intelligence
- Failure: Diplomatic incident, asset seizure

### India Operations
- Success: +allies, regional influence
- Failure: Political scandal, regional tensions

### Nigeria Operations
- Success: +LSW recruits, African network
- Failure: Destabilization, power vacuum
