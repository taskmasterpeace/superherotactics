# INVESTIGATION SYSTEM EXPANSION
## Comprehensive Design Proposal for SuperHero Tactics

> **Document Version**: 1.0
> **Date**: December 11, 2024
> **Status**: DESIGN PROPOSAL

---

## EXECUTIVE SUMMARY

This document expands the existing investigation framework from basic WHO/WHERE/WHAT/WHY leads into a rich, multi-layered system with:
- Email chain progression (clues arrive over time)
- Visual evidence board (connect the dots gameplay)
- Informant network (contacts provide intel based on relationships)
- Investigation phases (Discovery → Research → Surveillance → Confrontation)
- Time pressure mechanics (leads decay, urgency escalates)
- Skill-based success (character stats matter)
- Branching outcomes (multiple resolution paths)

**Integration**: Builds on existing Investigation_System.md, uses Universal Table, ties into fame/personality/city systems.

---

## 1. EMAIL CHAIN SYSTEM

### 1.1 How It Works

**Concept**: Instead of receiving all info at once, investigations unfold through email chains. Each clue/lead arrives via email as you progress, building a narrative trail.

**Email Types**:
1. **Initial Assignment** - Faction sends mission brief
2. **Follow-Up Clues** - New evidence arrives as you investigate
3. **Informant Tips** - Contacts send anonymous intel
4. **Urgent Updates** - Time-sensitive warnings
5. **Final Briefing** - Summarizes case resolution

### 1.2 Email Chain Structure

```typescript
interface InvestigationEmail {
  id: string
  threadId: string              // Groups emails into conversations
  from: string                   // Sender name (handler, informant, witness)
  fromType: 'faction' | 'informant' | 'witness' | 'anonymous' | 'suspect'
  priority: 'critical' | 'high' | 'medium' | 'low'
  subject: string
  body: string
  timestamp: number              // Game time when received

  // Triggered conditions
  triggeredBy?: 'lead_success' | 'time_passed' | 'location_visited' | 'combat_won'
  requiresResponse?: boolean
  responseOptions?: EmailResponse[]

  // Attached evidence
  attachedClues?: string[]       // References to clue IDs
  attachedDocuments?: string[]   // PDF/image evidence items

  // Game effects
  revealsLead?: 'WHO' | 'WHERE' | 'WHAT' | 'WHY'
  opensLocation?: string         // Unlocks new city/sector
  introducesContact?: string     // Adds informant to network
}

interface EmailResponse {
  id: string
  text: string                   // "Accept mission" / "Request backup" / "Decline"
  effect: 'accept' | 'decline' | 'negotiate' | 'question'

  // Outcomes
  budgetChange?: number          // Request more money
  timeChange?: number            // Extend deadline
  supportChange?: number         // Request more agents
  relationshipChange?: number    // Affects sender relationship
}
```

### 1.3 Email Chain Progression Example

**Investigation**: "The Warehouse Murders" (Gang War in Lagos, Nigeria)

**EMAIL 1 - Initial Assignment** (Day 0, 9:00 AM)
```
FROM: Minister Adebayo Okonkwo, Nigerian Intelligence
SUBJECT: URGENT: Multiple Homicides - Lagos Industrial District
PRIORITY: HIGH

Agent,

Five bodies discovered at abandoned warehouse in Lagos District 7.
All victims show signs of enhanced strength trauma - LSW involvement
confirmed. Local police overwhelmed. Gang war escalating.

We need immediate investigation before this spreads citywide.

OPTIONS:
[Accept Assignment] [Request More Information] [Decline]

- Minister Okonkwo
```

**EMAIL 2 - First Clue** (Day 1, after visiting crime scene)
```
FROM: Dr. Chioma Nwankwo, Forensic Pathologist
SUBJECT: Re: Warehouse Murders - Autopsy Results
PRIORITY: MEDIUM

Investigator,

Autopsy reveals unusual pattern. All five victims killed by
SAME individual based on force signature analysis. Estimated
strength: Delta-3 tier (15-ton range).

Also found trace residue: military-grade armor coating.
Your killer has professional equipment.

Attached: [Strength Analysis Report] [Armor Trace Evidence]

Dr. Nwankwo
Lagos Medical Examiner
```
> **Game Effect**: Unlocks WHO lead progress (20%), adds "strength tier" clue

**EMAIL 3 - Informant Tip** (Day 2, 2:00 AM - if you have Street Contacts)
```
FROM: [ANONYMOUS]
SUBJECT: (no subject)
PRIORITY: HIGH

You looking for warehouse killer?

Big man, wears black armor. Works for Iron Syndicate.
They meeting at Port District tonight. Slip 23.

Don't ask how I know.

OPTIONS:
[Investigate Tip] [Ignore] [Trace Email Origin]
```
> **Game Effect**: Opens WHERE lead (Port District, Slip 23), optional surveillance mission

**EMAIL 4 - Urgent Warning** (Day 3, if investigation stalls)
```
FROM: Minister Okonkwo
SUBJECT: URGENT: Third Attack Reported
PRIORITY: CRITICAL

Agent!

Another warehouse hit last night. Three more dead.
Pattern is accelerating. We're running out of time.

What progress have you made? The President is demanding answers.

[Provide Status Update] [Request Extension] [Request Backup]
```
> **Game Effect**: Pressure mechanic - failure to respond reduces faction standing

**EMAIL 5 - Final Resolution** (After case closed)
```
FROM: Minister Okonkwo
SUBJECT: Case Closed - Warehouse Murders

Excellent work, Agent.

Iron Syndicate operative in custody. Gang war diffused.
The President has personally commended your team.

Your payment has been transferred: ₦12,000,000
Faction Standing: +2

We'll be in touch for the next assignment.

- Minister Okonkwo
```

### 1.4 Email Chain Triggers

**Time-Based Triggers**:
- Day 1: Initial forensics arrive
- Day 3: Informant tips (if you have contacts)
- Day 5: Urgent pressure from faction
- Day 7: Final warning before case goes cold

**Event-Based Triggers**:
- After combat encounter → Witness emails appear
- After visiting location → Area expert contacts you
- After finding clue → Related informant reaches out
- After lead success → Handler sends congratulations + new lead

**Relationship-Based Triggers**:
- **High Fame (>70)**: Media contacts offer info
- **High City Familiarity**: Local informants volunteer tips
- **High Faction Standing**: Handler provides extra resources
- **Informant Network**: Underground contacts send anonymous tips

### 1.5 UI Implementation

**Email Inbox Interface** (Mobile Phone/Laptop Layer):

```
┌─────────────────────────────────────────────┐
│  INBOX (3 unread)                    [★] [⚙] │
├─────────────────────────────────────────────┤
│                                               │
│  🔴 CRITICAL │ Minister Okonkwo               │
│     URGENT: Third Attack Reported             │
│     2 hours ago                               │
│  ─────────────────────────────────────────   │
│  🟡 HIGH │ [ANONYMOUS]                        │
│     (no subject)                              │
│     Yesterday 2:13 AM                         │
│  ─────────────────────────────────────────   │
│  ⚪ MEDIUM │ Dr. Nwankwo                      │
│     Re: Warehouse Murders - Autopsy           │
│     2 days ago                                │
│  ─────────────────────────────────────────   │
│  [Archive] [Delete] [Mark Unread]            │
└─────────────────────────────────────────────┘
```

**Email Reading View**:

```
┌─────────────────────────────────────────────┐
│  ← Back to Inbox                             │
├─────────────────────────────────────────────┤
│  FROM: Minister Adebayo Okonkwo              │
│  SUBJECT: URGENT: Third Attack Reported       │
│  DATE: March 15, 2025 - 3:42 PM              │
│  PRIORITY: 🔴 CRITICAL                       │
├─────────────────────────────────────────────┤
│                                               │
│  Agent!                                       │
│                                               │
│  Another warehouse hit last night. Three      │
│  more dead. Pattern is accelerating.          │
│                                               │
│  [📎 Attached: Crime Scene Photos.pdf]       │
│                                               │
│  What progress have you made? The President   │
│  is demanding answers.                        │
│                                               │
│  - Minister Okonkwo                           │
│                                               │
├─────────────────────────────────────────────┤
│  [Provide Status Update]                      │
│  [Request Extension (+3 days, -1 standing)]  │
│  [Request Backup (+2 agents, -$50k)]         │
│  [Ignore] (Not recommended)                   │
└─────────────────────────────────────────────┘
```

**Key Features**:
- Thread view groups conversation chains
- Priority badges (Critical/High/Medium/Low)
- Attachment previews (click to view evidence)
- Response buttons with consequences shown
- Timestamp reflects in-game time
- Unread count notification badge

---

## 2. EVIDENCE BOARD

### 2.1 How It Works

**Concept**: Visual detective board where you pin clues, photos, documents, and draw connections between evidence. This transforms investigation from dice rolls into puzzle-solving gameplay.

**Core Mechanic**:
- Collect clues from emails, crime scenes, interrogations
- Pin them to virtual corkboard
- Draw string connections between related items
- System auto-detects when you've connected critical path
- Breakthrough reveals hidden leads

### 2.2 Evidence Types

```typescript
interface Evidence {
  id: string
  type: 'photo' | 'document' | 'physical' | 'testimony' | 'digital' | 'forensic'
  title: string
  description: string
  imageUrl?: string              // Visual representation

  // Discovery info
  foundAt: string                // Location/event where discovered
  foundBy: string                // Character who found it
  foundDate: number              // Game timestamp

  // Connections
  relatedClues: string[]         // Other clue IDs this connects to
  tags: string[]                 // Keywords: "murder weapon", "suspect", "motive"

  // Investigation value
  leadsTo?: 'WHO' | 'WHERE' | 'WHAT' | 'WHY'
  requiredFor?: 'breakthrough' | 'optional' | 'red_herring'

  // Board position (for UI)
  boardX?: number
  boardY?: number
}

interface Connection {
  id: string
  from: string                   // Evidence ID
  to: string                     // Evidence ID
  type: 'proves' | 'contradicts' | 'connects_to' | 'timeline' | 'location'
  notes?: string                 // Player notes on connection
  strength: 'weak' | 'moderate' | 'strong' | 'conclusive'
}

interface Breakthrough {
  id: string
  name: string
  description: string
  requiredConnections: string[]  // Must connect these clues
  reward: 'new_lead' | 'location_unlock' | 'suspect_identified' | 'motive_revealed'
  effect: string                 // Game state change
}
```

### 2.3 Evidence Board Example

**Investigation**: "The Warehouse Murders"

**CLUES COLLECTED**:

1. **Crime Scene Photos** (Physical)
   - Found at: Warehouse District 7, Lagos
   - Tags: ["crime scene", "victims", "evidence"]
   - Connects to: Autopsy Report, Witness Statement

2. **Autopsy Report** (Document)
   - Found at: Email from Dr. Nwankwo
   - Tags: ["forensics", "strength tier", "armor trace"]
   - Connects to: Military Armor Database

3. **Anonymous Tip** (Digital)
   - Found at: Email from unknown sender
   - Tags: ["informant", "Iron Syndicate", "Port District"]
   - Connects to: Port Surveillance Footage

4. **Port Surveillance Footage** (Digital)
   - Found at: Port District security office
   - Tags: ["suspect", "armor", "vehicle"]
   - Connects to: Vehicle Registration

5. **Vehicle Registration** (Document)
   - Found at: Database search
   - Tags: ["ownership", "Iron Syndicate", "front company"]
   - Connects to: Corporate Records

6. **Warehouse Lease Agreement** (Document)
   - Found at: City records office
   - Tags: ["location", "Iron Syndicate", "payment records"]
   - Connects to: Bank Statements

7. **Bank Statements** (Digital)
   - Found at: Financial database
   - Tags: ["money trail", "international", "weapons purchase"]
   - Connects to: Arms Dealer Contact

**BREAKTHROUGH TRIGGER**:
When player connects:
```
Crime Scene → Autopsy → Armor Trace → Port Footage → Vehicle → Company → Bank → Arms Dealer
```

**Result**:
```
🔍 BREAKTHROUGH DISCOVERED!

"Follow the Money"

The warehouse attacks are funded by international arms
dealers using Iron Syndicate as local muscle. The real
target: eliminate rival gangs to monopolize Lagos
weapons trade.

UNLOCKED:
- WHO lead complete (Suspect: Marcus "Iron Fist" Okoro)
- WHERE lead updated (Syndicate HQ coordinates)
- WHY lead complete (Territory control for arms trade)

New mission available: [Raid Syndicate HQ]
```

### 2.4 UI Implementation

**Evidence Board Interface**:

```
┌──────────────────────────────────────────────────────────────┐
│  🔍 EVIDENCE BOARD: The Warehouse Murders        [Clear] [?] │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│   📷                    📄                    💾              │
│  [Crime        --------[Autopsy    --------[Military          │
│   Scene]                Report]              DB]              │
│     │                     │                   │               │
│     │                     │                   │               │
│     └─────────┬───────────┘                   │               │
│               │                               │               │
│            👤 │                            🎥 │               │
│          [Witness] ──────────────────────[Port Footage]       │
│                                               │               │
│                                               │               │
│                                            🚗 │               │
│                                          [Vehicle Reg]        │
│                                               │               │
│                                               │               │
│                                            🏢 │               │
│                                          [Corp Records]       │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ CLUES: 12 collected │ CONNECTIONS: 8 made              │  │
│  │ LEADS: WHO (60%) WHERE (40%) WHAT (80%) WHY (20%)      │  │
│  │                                                          │  │
│  │ Next: Find connection between Corp Records and Motive   │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
│  [Add Clue] [Draw Connection] [Add Note] [Analyze]           │
└──────────────────────────────────────────────────────────────┘
```

**Connection Drawing**:
- Click clue → Click second clue → Select connection type
- Color-coded strings:
  - 🟢 Green = Proven connection
  - 🟡 Yellow = Suspected connection
  - 🔴 Red = Contradictory evidence
  - 🔵 Blue = Timeline sequence

**Auto-Detection**:
- System watches for specific connection patterns
- When critical path completed → Breakthrough notification
- Optional hints: "Consider connecting evidence #3 and #7"

**Clue Detail View** (click any evidence):
```
┌─────────────────────────────────────────┐
│  📄 AUTOPSY REPORT                      │
├─────────────────────────────────────────┤
│  Found by: Dr. Chioma Nwankwo            │
│  Location: Lagos Medical Examiner        │
│  Date: March 13, 2025                    │
│                                           │
│  [View Full Document]                    │
│                                           │
│  Tags: forensics, strength tier, armor   │
│                                           │
│  Connections (3):                        │
│  → Crime Scene Photos (proves)           │
│  → Military Armor DB (connects_to)       │
│  → Witness Statement (supports)          │
│                                           │
│  Notes:                                   │
│  "Strength tier matches Delta-3. Only    │
│   20 registered LSWs in Nigeria at this  │
│   level. Check registry."                │
│                                           │
│  [Edit Notes] [Connect] [Remove]         │
└─────────────────────────────────────────┘
```

### 2.5 Gameplay Integration

**How Clues Are Acquired**:
1. **Automatic** - Emails attach clues automatically
2. **Location Search** - Roll Investigation check at crime scene
3. **Interrogation** - Talk to witnesses/suspects
4. **Hacking** - Access digital records (requires Hacking skill)
5. **Informants** - Contacts provide exclusive clues
6. **Combat Aftermath** - Search defeated enemies

**Skill Checks for Clues**:
- **Detective**: General clue discovery (+2 CS)
- **Forensics**: Physical evidence analysis (+2 CS)
- **Hacking**: Digital evidence extraction (+2 CS)
- **Interrogation**: Testimony credibility (+2 CS)
- **Streetwise**: Underground info gathering (+2 CS)

**Red Herrings**:
- 20% of clues are false leads
- Connecting red herrings wastes time
- High INT characters spot red herrings easier
- "This doesn't fit the pattern..." warning

---

## 3. INFORMANT NETWORK

### 3.1 How It Works

**Concept**: Build a web of contacts across cities who provide intel, tips, and exclusive access. Relationships require cultivation and maintenance.

**Core Mechanic**:
- Meet informants through investigations
- Build trust via successful missions
- Maintain relationships (or they go cold)
- Informants provide city-specific intel
- Different types specialize in different info

### 3.2 Informant Types

```typescript
interface Informant {
  id: string
  name: string
  alias?: string                 // Street name
  type: 'street' | 'corporate' | 'government' | 'criminal' | 'media' | 'academic' | 'military'

  // Location
  baseCity: string
  operatesIn: string[]           // Cities they have reach in

  // Relationship
  trustLevel: number             // 0-100
  loyaltyType: 'money' | 'ideals' | 'fear' | 'friendship' | 'blackmail'
  lastContact: number            // Days since last interaction

  // Intel quality
  reliability: number            // 0-100 (how accurate their tips are)
  accessLevel: 'street' | 'mid' | 'high' | 'elite'
  specializations: string[]      // "gang activity", "corporate espionage", etc.

  // Activation cost
  paymentRequired: number        // $ per tip
  favorOwed?: string             // "Help with personal problem X"

  // Availability
  status: 'active' | 'cooling_down' | 'compromised' | 'dead' | 'turned'
  cooldownUntil?: number         // Can't use again until this date

  // Risk
  exposureRisk: number           // 0-100 (chance of being discovered)
  enemyFactions: string[]        // Factions that want them dead
}
```

### 3.3 Informant Network Structure

**Network Levels**:

**TIER 1 - Street Level** (Easy to acquire, low-quality intel)
- Bar owners, taxi drivers, beat cops
- Cost: $100-500 per tip
- Reliability: 40-60%
- Info: Local gang activity, street rumors
- Access: Public information, overheard conversations

**TIER 2 - Mid Level** (Requires relationship building)
- Journalists, low-level bureaucrats, gang lieutenants
- Cost: $1,000-5,000 per tip
- Reliability: 60-80%
- Info: Corporate leaks, police records, gang operations
- Access: Semi-restricted information

**TIER 3 - High Level** (Requires favors or blackmail)
- Corporate executives, government officials, crime bosses
- Cost: $10,000-50,000 per tip OR major favor
- Reliability: 80-95%
- Info: Classified data, insider trading, political secrets
- Access: Restricted government/corporate data

**TIER 4 - Elite** (Rare,quest-locked)
- Intelligence agents, tech CEOs, superhuman leaders
- Cost: Favor-only (no money accepted)
- Reliability: 95-100%
- Info: Black ops, alien tech, timeline data
- Access: Top secret clearance level

### 3.4 Informant Acquisition Example

**Meeting Your First Informant**:

**Scenario**: After completing "Warehouse Murders" investigation in Lagos:

```
EMAIL FROM: [ANONYMOUS]
SUBJECT: We should talk

You handled the Iron Syndicate situation... cleanly.
Not many outsiders can navigate Lagos like that.

I have information. You have resources.
Meet me at Jazzhole Club, midnight.

Come alone. Bring 50k naira as good faith payment.

- T
```

**Meeting Scene** (narrative event):
```
┌─────────────────────────────────────────────┐
│  JAZZHOLE CLUB - LAGOS                       │
│  March 20, 2025 - 12:17 AM                   │
├─────────────────────────────────────────────┤
│                                               │
│  You enter the smoky jazz club. In the back  │
│  booth sits a woman in her 30s, sharp eyes   │
│  watching you approach.                       │
│                                               │
│  "You're punctual. I like that."             │
│                                               │
│  She slides a photo across the table.         │
│  "Marcus Okoro wasn't working alone. The     │
│  Syndicate has a new supplier - Chinese      │
│  tech smuggler. Interested?"                  │
│                                               │
│  OPTIONS:                                     │
│  [Pay ₦50,000 for info] (Accept)             │
│  [Ask who she is first] (Investigate)        │
│  [Refuse and leave] (Decline)                │
│  [Threaten her] (Intimidate - Risk!)         │
│                                               │
└─────────────────────────────────────────────┘
```

**Outcome if you pay**:
```
INFORMANT ACQUIRED!

Name: Temitope "T" Adeyemi
Type: Criminal Network Contact
Location: Lagos, Nigeria
Trust Level: 25/100
Loyalty: Money + Mutual Benefit
Access Level: Mid-tier
Specialization: Gang activity, smuggling, street rumors

ABILITIES:
- Can provide tips on Lagos gang operations
- Weekly intel on smuggling routes
- Introduces you to other criminal contacts
- Cooldown: 3 days between uses

MAINTENANCE:
- Requires contact every 14 days or trust decays
- Occasional "favors" requested
- Payment: ₦25k-100k per tip

FIRST TIP UNLOCKED:
"Chinese tech smuggler meeting at Port District,
 Slip 23, tomorrow 3 AM. Heavy security."

[Add to Network] [Decline]
```

### 3.5 Relationship Management

**Trust Building Activities**:
- **Successful missions** using their intel: +10 trust
- **Regular contact**: +2 trust per week
- **Payments on time**: +5 trust
- **Protecting their identity**: +15 trust
- **Completing personal favors**: +20 trust
- **Sharing intel with them**: +5 trust

**Trust Decay Conditions**:
- **No contact for 2 weeks**: -5 trust per week
- **Failed mission using their intel**: -15 trust
- **Exposing them to danger**: -30 trust
- **Missing payment**: -20 trust
- **Working with their enemies**: -40 trust

**Trust Level Effects**:

| Trust | Status | Benefits |
|-------|--------|----------|
| 0-20 | Distrustful | Won't share critical intel, high prices |
| 21-40 | Professional | Basic tips only, standard prices |
| 41-60 | Reliable | Better intel, occasional discounts |
| 61-80 | Trusted | Exclusive leads, priority access |
| 81-100 | Loyal | Free tips, introduces elite contacts |

**Informant Status Changes**:

**COMPROMISED** (Exposure risk reaches 80%):
```
EMAIL FROM: T
SUBJECT: Going dark

Heat's too much. Someone's watching me.
Need to disappear for a while.

Don't contact me. I'll reach out when it's safe.

- T

[Informant: T - Status changed to COOLING_DOWN]
[Unavailable for 30 days]
```

**TURNED** (If you betray them):
```
EMAIL FROM: T
SUBJECT: You made a mistake

I know what you did. You sold me out to the Syndicate.

Big mistake, friend. You just made an enemy.

Watch your back in Lagos.

[Informant: T - Status changed to ENEMY]
[Lagos crime index increased by 10]
[New investigation: "Informant's Revenge"]
```

### 3.6 Network Visualization UI

**Informant Network Screen**:

```
┌──────────────────────────────────────────────────────────────┐
│  👥 INFORMANT NETWORK                         [Map View] [?] │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  ACTIVE CONTACTS (7)         COMPROMISED (2)     LOST (1)     │
│                                                                │
│  📍 LAGOS, NIGERIA (3 contacts)                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 👤 Temitope "T" Adeyemi                                 │  │
│  │    Type: Criminal Network │ Trust: ████████░░ 75/100   │  │
│  │    Last Contact: 3 days ago │ Status: ✅ Active        │  │
│  │    Specialization: Gang activity, Smuggling             │  │
│  │    [Contact] [Pay ₦50k] [Request Favor]                │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 👤 Chief Inspector Obi Nwosu                            │  │
│  │    Type: Law Enforcement │ Trust: ██████░░░░ 60/100    │  │
│  │    Last Contact: 8 days ago │ Status: ⚠️ Needs Contact│  │
│  │    Specialization: Police records, Official cases       │  │
│  │    [Contact] [Gift $2k] [Meet for Coffee]              │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
│  📍 SHANGHAI, CHINA (2 contacts)                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 👤 Dr. Wei Chen                                          │  │
│  │    Type: Corporate Insider │ Trust: ███████░░░ 70/100  │  │
│  │    Last Contact: 1 day ago │ Status: ✅ Active         │  │
│  │    Specialization: Tech espionage, R&D leaks            │  │
│  │    [Contact] [Request Intel] [Offer Payment]            │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
│  RECENT INTEL (Last 7 days):                                  │
│  • T: "New shipment arriving Port District tonight"          │
│  • Chief Nwosu: "Investigation into Syndicate delayed"        │
│  • Dr. Chen: "Project Phoenix entering Phase 3"              │
│                                                                │
│  [Recruit New Informant] [Network Map] [Maintenance Log]     │
└──────────────────────────────────────────────────────────────┘
```

**Map View** (shows informant coverage across world map):

```
      WORLD MAP - INFORMANT COVERAGE

  ┌──────────────────────────────────────┐
  │                                       │
  │   NORTH AMERICA                       │
  │   • New York (2) 👥👥              │
  │   • Los Angeles (1) 👥              │
  │                                       │
  │   AFRICA                              │
  │   • Lagos (3) 👥👥👥 [STRONG]     │
  │   • Cairo (0) [NO COVERAGE]          │
  │                                       │
  │   ASIA                                │
  │   • Shanghai (2) 👥👥              │
  │   • Tokyo (1) 👥                    │
  │   • Mumbai (0) [NO COVERAGE]         │
  │                                       │
  │   EUROPE                              │
  │   • London (1) 👥                   │
  │   • Paris (0) [NO COVERAGE]          │
  │                                       │
  └──────────────────────────────────────┘

  Coverage Strength:
  🟢 Strong (3+ contacts) - Lagos
  🟡 Moderate (2 contacts) - NY, Shanghai
  🔴 Weak (1 contact) - LA, Tokyo, London
  ⚪ None (0 contacts) - Cairo, Mumbai, Paris
```

### 3.7 Integration with Existing Systems

**Fame System Integration**:
- **Fame 0-30** (Unknown): Informants demand high payments, low trust
- **Fame 31-60** (Recognized): Standard rates, normal trust building
- **Fame 61-80** (Famous): Informants approach YOU, better rates
- **Fame 81-100** (Legendary): Elite contacts reach out, free tips

**City Familiarity Integration**:
- **Familiarity 0-20** (Tourist): No local contacts available
- **Familiarity 21-50** (Visitor): Can recruit street-level informants
- **Familiarity 51-80** (Local): Mid-tier informants accessible
- **Familiarity 81-100** (Native): High-tier insiders trust you

**Personality System Integration**:
- **Sociability 7+**: +20% trust gain rate
- **Sociability 1-3**: -20% trust gain rate
- **Discipline 7+**: Informants respect professionalism (+10 trust)
- **Volatility 7+**: Informants nervous around you (-10 trust)

---

## 4. INVESTIGATION PHASES

### 4.1 How It Works

**Concept**: Investigations progress through 4 distinct phases, each with unique gameplay, objectives, and risks. Player chooses when to advance phases.

**Phase Structure**:
1. **DISCOVERY** - Gather initial clues, find evidence
2. **RESEARCH** - Analyze evidence, connect dots, identify suspects
3. **SURVEILLANCE** - Track suspects, gather proof, find hideout
4. **CONFRONTATION** - Raid, arrest, or negotiate resolution

### 4.2 Phase Breakdown

```typescript
interface InvestigationPhase {
  id: 'discovery' | 'research' | 'surveillance' | 'confrontation'
  name: string
  description: string

  // Phase objectives
  objectives: PhaseObjective[]
  requiredProgress: number       // % needed to advance

  // Available actions
  availableActions: InvestigationAction[]

  // Risk levels
  detectionRisk: number          // Chance enemies notice you
  combatChance: number           // Chance of combat encounter
  timeConsumption: number        // Days per action

  // Transition conditions
  canAdvanceTo: string | null    // Next phase ID
  canRetreatTo: string | null    // Previous phase ID
  autoAdvanceAt?: number         // Auto-advance at this progress %
}

interface PhaseObjective {
  id: string
  description: string
  type: 'required' | 'optional' | 'bonus'
  progress: number               // 0-100
  reward?: string                // Bonus for completion
}

interface InvestigationAction {
  id: string
  name: string
  description: string

  // Costs
  timeCost: number               // Game days
  moneyCost: number
  characterSlots: number         // How many agents needed

  // Skill requirements
  requiredSkills?: { skill: string, minimum: number }[]

  // Outcomes
  successEffect: string          // What happens on success
  failureEffect: string          // What happens on failure

  // Risk
  detectionChance: number        // % chance of being spotted
  combatChance: number           // % chance of fight
}
```

### 4.3 PHASE 1: DISCOVERY

**Objective**: Gather initial evidence and clues

**Duration**: 2-5 days typically

**Available Actions**:

1. **Visit Crime Scene**
   - Time: 1 day
   - Cost: $500 (transportation)
   - Skill: Detective, Forensics
   - Success: Find 2-4 physical clues
   - Failure: Find 1 clue (generic)
   - Detection Risk: 5% (low)
   - Combat Chance: 0%

2. **Interview Witnesses**
   - Time: 1 day
   - Cost: $200
   - Skill: Interrogation, Sociability
   - Success: Get testimony, possible informant lead
   - Failure: Witnesses scared, clam up
   - Detection Risk: 10%
   - Combat Chance: 5% (witness under protection)

3. **Request Police Files**
   - Time: 1 day
   - Cost: $1,000 (bureaucracy grease)
   - Skill: None (money talks)
   - Success: Access official records
   - Failure: Request denied, need warrant
   - Detection Risk: 20% (corrupt cops may leak)
   - Combat Chance: 0%

4. **Canvass Neighborhood**
   - Time: 2 days
   - Cost: $500
   - Skill: Streetwise, Local Language
   - Success: Street-level intel, possible informant
   - Failure: Locals don't trust you
   - Detection Risk: 30% (word spreads)
   - Combat Chance: 10% (gang territory)

5. **Forensic Analysis** (if clues collected)
   - Time: 2 days
   - Cost: $2,000 (lab fees)
   - Skill: Forensics, Science
   - Success: Identify evidence type, get leads
   - Failure: Evidence contaminated
   - Detection Risk: 0%
   - Combat Chance: 0%

**Phase Completion**:
- **Minimum**: 3 clues collected + 1 lead identified → Can advance to Research
- **Optimal**: 5 clues + 2 leads → +10% success chance in next phase
- **Maximum**: 8 clues + 3 leads + informant recruited → +20% success, bonus intel

**UI Display**:

```
┌──────────────────────────────────────────────────────────────┐
│  INVESTIGATION: The Warehouse Murders                         │
│  PHASE 1: DISCOVERY                    Progress: ████░░░░ 60% │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  OBJECTIVES:                                                   │
│  ✅ Visit crime scene (Complete)                              │
│  ✅ Collect 3+ clues (4/3 collected)                          │
│  ⬜ Interview 2+ witnesses (1/2 interviewed)                  │
│  ⬜ Identify 1 lead (0/1 identified)                          │
│                                                                │
│  AVAILABLE ACTIONS:                                            │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 👥 Interview Witnesses                                  │  │
│  │    Time: 1 day │ Cost: $200 │ Detection: 10%           │  │
│  │    Required: Interrogation skill or Sociability 5+      │  │
│  │    [Assign Agent] [View Details]                        │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 🔬 Forensic Analysis                                    │  │
│  │    Time: 2 days │ Cost: $2,000 │ Detection: 0%         │  │
│  │    Required: Forensics skill or Science 4+              │  │
│  │    [Assign Agent] [View Details]                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
│  PROGRESS REQUIREMENTS:                                        │
│  • 3+ clues ✅ │ 1+ lead ⬜ │ 60%+ progress ✅              │
│                                                                │
│  [Continue Discovery] [Advance to Research] (locked)          │
└──────────────────────────────────────────────────────────────┘
```

### 4.4 PHASE 2: RESEARCH

**Objective**: Analyze evidence, connect clues, identify suspects

**Duration**: 3-7 days typically

**Available Actions**:

1. **Database Search**
   - Time: 1 day
   - Cost: $500
   - Skill: Research, Hacking
   - Success: Match evidence to suspects/locations
   - Failure: No matches found
   - Detection Risk: 15% (digital footprint)
   - Combat Chance: 0%

2. **Informant Consultation**
   - Time: 1 day
   - Cost: $1,000-10,000 (depends on informant)
   - Skill: None (if you have informant)
   - Success: Informant provides context/leads
   - Failure: Informant doesn't know or lies
   - Detection Risk: 25% (informant may be watched)
   - Combat Chance: 10% (informant setup/ambush)

3. **Background Checks**
   - Time: 2 days
   - Cost: $2,000
   - Skill: Research, Hacking
   - Success: Suspect profiles, criminal history
   - Failure: Records sealed or falsified
   - Detection Risk: 30% (alerts if suspect has connections)
   - Combat Chance: 0%

4. **Evidence Board Analysis** (requires 5+ clues)
   - Time: 3 days
   - Cost: $0
   - Skill: Detective, INT 50+
   - Success: Breakthrough - identify critical path
   - Failure: False connection, waste time
   - Detection Risk: 0%
   - Combat Chance: 0%

5. **Financial Tracking**
   - Time: 3 days
   - Cost: $3,000
   - Skill: Hacking, Finance
   - Success: Follow money trail, find backers
   - Failure: Accounts hidden/offshore
   - Detection Risk: 40% (financial monitoring alerts)
   - Combat Chance: 5% (accountant protection)

**Phase Completion**:
- **Minimum**: Identify 1 suspect + 1 location → Can advance to Surveillance
- **Optimal**: 2 suspects + 2 locations + motive theory → +15% surveillance success
- **Maximum**: Full suspect profile + hideout location + motive + backer identified → +30%, skip surveillance

**Unique Mechanic - Breakthrough System**:

If player connects correct clues on Evidence Board:
```
🎯 BREAKTHROUGH ACHIEVED!

"The Arms Trade Connection"

Analysis reveals the warehouse murders are contract
killings funded by international arms dealers. The
perpetrator is Marcus "Iron Fist" Okoro, Delta-3 LSW
employed by the Iron Syndicate.

LEADS UPDATED:
• WHO: Marcus Okoro (100% complete) ✅
• WHERE: Syndicate HQ, 47 Warehouse Road (80% complete)
• WHAT: Contract killings (100% complete) ✅
• WHY: Territory control for arms smuggling (60% complete)

BONUS: Skip Surveillance phase - proceed directly to
Confrontation with +20% success modifier.

[Advance to Confrontation] [Continue Research for WHY lead]
```

### 4.5 PHASE 3: SURVEILLANCE

**Objective**: Track suspects, gather proof, locate hideout

**Duration**: 4-10 days typically

**Available Actions**:

1. **Physical Surveillance**
   - Time: 3 days minimum
   - Cost: $1,000/day
   - Skill: Stealth, Surveillance
   - Success: Track suspect movements, find patterns
   - Failure: Lose tail, suspect alerted
   - Detection Risk: 40% (suspect counter-surveillance)
   - Combat Chance: 20% (if spotted)

2. **Electronic Surveillance**
   - Time: 2 days (setup) + monitoring
   - Cost: $5,000 (equipment)
   - Skill: Hacking, Tech
   - Success: Intercept communications, locations
   - Failure: Encryption too strong or detected
   - Detection Risk: 25% (tech security sweep)
   - Combat Chance: 10% (if traced back)

3. **Drone Recon** (if you have drone)
   - Time: 1 day
   - Cost: $500 (flight time)
   - Skill: Piloting, Tech
   - Success: Aerial surveillance, hideout blueprints
   - Failure: Drone shot down or signal jammed
   - Detection Risk: 35% (visible/radar detection)
   - Combat Chance: 15% (armed response)

4. **Undercover Infiltration**
   - Time: 5 days minimum
   - Cost: $3,000 (cover setup)
   - Skill: Acting, Stealth, Streetwise
   - Success: Inside access, critical intel
   - Failure: Cover blown - immediate combat
   - Detection Risk: 60% (very dangerous)
   - Combat Chance: 50% (if discovered)

5. **Asset Placement** (if you have informant)
   - Time: 4 days
   - Cost: $10,000 (payment to informant)
   - Skill: None (informant does work)
   - Success: Informant infiltrates, provides updates
   - Failure: Informant compromised or killed
   - Detection Risk: 30%
   - Combat Chance: 0% (you're not there)

**Phase Completion**:
- **Minimum**: Confirm hideout location + suspect schedule → Can advance to Confrontation
- **Optimal**: Hideout blueprints + guard count + suspect schedule → +15% combat success
- **Maximum**: Full tactical intel + inside access + surprise timing → +40% combat, +30% non-lethal capture

**Surveillance Event Example**:

```
DAY 6 - SURVEILLANCE LOG

22:00 - Subject (Marcus Okoro) exits Syndicate HQ
22:15 - Drives to Port District in armored SUV
22:45 - Meets with unknown Asian male (possible supplier)
23:10 - Exchange briefcase - contents unknown
23:30 - Subject returns to HQ

INTELLIGENCE GAINED:
• Confirmed hideout location: 47 Warehouse Road
• Security: 4 guards outside, unknown inside
• Vehicle: Armored SUV (DR 20)
• Schedule: Leaves HQ every night 22:00-00:00

DETECTION CHECK: d100 = 34 vs. 40% detection risk
RESULT: ✅ Undetected - surveillance continues

OPTIONS:
[Continue Surveillance] (gather more intel)
[Plan Raid] (advance to Confrontation)
[Follow Asian Contact] (new investigation branch)
```

### 4.6 PHASE 4: CONFRONTATION

**Objective**: Capture/eliminate target, resolve case

**Duration**: 1-3 days typically

**Available Actions**:

1. **Tactical Raid**
   - Time: 1 day (planning + execution)
   - Cost: $10,000 (equipment, backup)
   - Skill: Tactics, Combat
   - Success: Capture target, recover evidence
   - Failure: Firefight, casualties, target escapes
   - Detection Risk: 100% (they know you're there)
   - Combat Chance: 100% (guaranteed combat)

2. **Arrest Warrant**
   - Time: 2 days (legal process)
   - Cost: $5,000 (legal fees)
   - Skill: Law, Faction Authority
   - Success: Legal arrest, full evidence admissible
   - Failure: Warrant denied or target flees
   - Detection Risk: 80% (target hears about warrant)
   - Combat Chance: 30% (resists arrest)

3. **Negotiated Surrender**
   - Time: 3 days (back-and-forth)
   - Cost: $0 (or immunity deal)
   - Skill: Diplomacy, Interrogation
   - Success: Peaceful resolution, intel on backers
   - Failure: Negotiations break down → combat
   - Detection Risk: 50%
   - Combat Chance: 20% (double-cross)

4. **Ambush**
   - Time: 1 day (wait for opportunity)
   - Cost: $2,000 (setup)
   - Skill: Stealth, Tactics
   - Success: Surprise attack, +30% combat bonus
   - Failure: Ambush reversed, you're surrounded
   - Detection Risk: 40% (they smell a trap)
   - Combat Chance: 100%

5. **Assassination** (if Harm Avoidance < 3)
   - Time: 1 day
   - Cost: $5,000 (specialized equipment)
   - Skill: Stealth, Sniper
   - Success: Target eliminated quietly
   - Failure: Assassination attempt fails, war declared
   - Detection Risk: 60% (investigations after)
   - Combat Chance: 70% (if botched)

**Resolution Types**:

**ARREST** (Legal)
- Requires: Warrant + Evidence
- Result: Target imprisoned, legal trial
- Faction Standing: +3 (clean operation)
- Rewards: Full payment, commendation
- Risk: Target may escape custody later

**CAPTURE** (Extralegal)
- Requires: Successful combat + non-lethal takedown
- Result: Target in your custody (prison/interrogation)
- Faction Standing: +2 (effective but questionable)
- Rewards: Standard payment, interrogation intel
- Risk: Legal complications if exposed

**ELIMINATION** (Lethal)
- Requires: Kill target
- Result: Target dead, case closed
- Faction Standing: +1 (brutal but effective)
- Rewards: Reduced payment (no trial testimony)
- Risk: Retaliation from target's allies

**NEGOTIATION** (Diplomatic)
- Requires: Successful diplomacy check
- Result: Target surrenders, provides intel
- Faction Standing: +4 (ideal outcome)
- Rewards: Full payment + bonus intel
- Risk: Target may betray deal

**Confrontation Event Example**:

```
TACTICAL RAID - IRON SYNDICATE HQ

MISSION BRIEFING:
Target: Marcus "Iron Fist" Okoro (Delta-3 LSW)
Location: 47 Warehouse Road, Lagos
Intelligence: 4 guards outside, est. 6-8 inside
Objective: Capture alive for questioning

YOUR TEAM:
• Agent Adewale (Combat 75, Tactics 65) - Team Leader
• Agent Chen (Combat 60, Stealth 80) - Infiltration
• Agent Rodriguez (Combat 85, Heavy Weapons 70) - Fire Support
• You (Combat 55, Leadership 60) - Command

TACTICAL OPTIONS:
┌────────────────────────────────────────────────────────────┐
│ [FRONTAL ASSAULT]                                           │
│ Go in loud, overwhelming firepower                          │
│ Success: 60% │ Casualties: High │ Surprise: None           │
│ Combat Modifier: +0 CS                                      │
└────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────┐
│ [STEALTH INFILTRATION]                                      │
│ Chen sneaks in, opens door for team                         │
│ Success: 45% │ Casualties: Low │ Surprise: +30% CS         │
│ Combat Modifier: +3 CS if successful, -2 CS if detected    │
└────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────┐
│ [WAIT FOR DEPARTURE] (Surveillance shows target leaves at  │
│                       22:00 nightly)                        │
│ Ambush during departure, fewer guards                       │
│ Success: 75% │ Casualties: Low │ Surprise: +20% CS         │
│ Combat Modifier: +2 CS, -4 enemies                          │
└────────────────────────────────────────────────────────────┘

[Select Approach] [Abort Mission] [Request Backup (-$20k)]
```

**Combat Victory Screen**:

```
MISSION COMPLETE: TACTICAL RAID

TARGET STATUS: ✅ Captured Alive
CASUALTIES: 1 injured (Agent Chen - Minor gunshot wound)
CIVILIAN CASUALTIES: 0
COLLATERAL DAMAGE: Minimal (warehouse front door)

EVIDENCE RECOVERED:
• Weapons cache (15 military-grade rifles)
• Financial records (links to international smuggling)
• Communications logs (identifies supplier: Wei Tang, Shanghai)

INTERROGATION RESULT:
Marcus Okoro provided testimony in exchange for reduced
sentence. Confirms arms smuggling operation backed by
Chinese Triad. Names additional co-conspirators.

LEADS UNLOCKED:
• New investigation: "Shanghai Connection"
• Informant offered: Marcus Okoro (if you recruit him)
• Weapon cache seized: +15 rifles to armory

REWARDS:
• Payment: $75,000
• Faction Standing: +3 (Nigerian Government)
• Fame: +15 (successful high-profile case)
• Lagos Familiarity: +10

[Debrief] [Next Mission] [Recruit Marcus Okoro]
```

### 4.7 Phase Transition Rules

**Can Skip Phases If**:
- **Skip Discovery**: Have existing intel from informant (+$5k cost)
- **Skip Research**: Breakthrough in Discovery phase
- **Skip Surveillance**: Full intel from Research phase OR high-risk direct assault
- **Cannot Skip Confrontation**: Must resolve somehow

**Can Retreat to Previous Phase If**:
- New evidence contradicts current theory
- Confrontation too dangerous, need more intel
- Missed critical clue (warning system alerts you)

**Auto-Advance Conditions**:
- Time limit approaching (3 days left) → Forces confrontation
- Target about to flee → Emergency confrontation
- Critical breakthrough → Skip ahead option

---

## 5. TIME PRESSURE MECHANICS

### 5.1 How It Works

**Concept**: Investigations have limited time before leads go cold, suspects flee, or situations escalate. Managing time pressure is core skill.

**Time Factors**:
1. **Investigation Deadline** - Hard time limit (set by mission)
2. **Lead Decay** - Clues become less useful over time
3. **Escalation** - Situation worsens if not resolved
4. **Opportunity Windows** - Time-limited chances

### 5.2 Investigation Timers

```typescript
interface InvestigationTimer {
  // Hard deadline
  deadline: number               // Game days until case closes
  deadlineType: 'hard' | 'soft'  // Hard = auto-fail, Soft = penalties

  // Lead decay
  clueDecayRate: number          // % effectiveness lost per day
  witnessDecayRate: number       // Witnesses forget/scared over time

  // Escalation
  escalationTrigger: number      // Days until situation escalates
  escalationType: 'violence' | 'escape' | 'coverup' | 'retaliation'

  // Pressure level
  pressureLevel: number          // 0-100 (increases over time)
  pressureEffects: string[]      // What happens at high pressure
}
```

### 5.3 Deadline Types

**HARD DEADLINE** (Auto-fail if exceeded):
```
Example: Terrorist attack scheduled in 7 days
- Day 0-6: Investigation active
- Day 7: Attack happens, investigation fails
- No extensions possible
- High stakes, high rewards
```

**SOFT DEADLINE** (Penalties but can continue):
```
Example: Gang war investigation - 14 day time limit
- Day 0-14: Standard investigation
- Day 15+: Penalties accumulate
  - Faction standing -1 per day
  - Rewards reduced 10% per day
  - Escalation chance increases
```

**ESCALATING DEADLINE** (Gets worse over time):
```
Example: Missing person case
- Day 0-3: Person still alive (rescue possible)
- Day 4-7: Person injured (rescue harder)
- Day 8+: Person likely dead (murder investigation)
- Each phase has different objectives
```

### 5.4 Lead Decay System

**Clue Freshness**:

| Days Old | Effectiveness | Examples |
|----------|---------------|----------|
| 0-2 days | 100% | Fresh evidence, reliable witnesses |
| 3-5 days | 80% | Evidence degrading, witnesses foggy |
| 6-9 days | 60% | Evidence compromised, witnesses scared |
| 10-14 days | 40% | Old news, witnesses disappeared |
| 15+ days | 20% | Cold case, trail gone cold |

**Decay Effects**:

**PHYSICAL EVIDENCE**:
- Day 0-2: Full forensic value
- Day 3-5: Contamination starts (-20% analysis quality)
- Day 6+: Environmental damage (-40% analysis quality)
- Day 10+: Evidence inadmissible in court (-60%)

**WITNESS TESTIMONY**:
- Day 0-2: Accurate recall (+2 CS interrogation)
- Day 3-5: Memory fading (no modifier)
- Day 6-9: Contradictions appear (-2 CS)
- Day 10+: Witnesses recant or disappear (-4 CS)

**DIGITAL TRAILS**:
- Day 0-2: Active digital footprint (+2 CS hacking)
- Day 3-5: Logs rotating out (no modifier)
- Day 6-9: Data deleted (-2 CS)
- Day 10+: Backups wiped (-4 CS, near impossible)

**Example**:

```
INVESTIGATION: Corporate Espionage
START DATE: March 1, 2025
CURRENT DATE: March 8, 2025 (7 days elapsed)

CLUE STATUS:

1. Security Footage (Day 0)
   Age: 7 days
   Effectiveness: 60% (degrading)
   Status: ⚠️ Footage scheduled to be overwritten in 3 days!

2. Witness Statement - Security Guard (Day 2)
   Age: 5 days
   Effectiveness: 80%
   Status: ⚠️ Witness pressured to recant testimony

3. Hacked Email Logs (Day 4)
   Age: 3 days
   Effectiveness: 80%
   Status: ✅ Still accessible

4. Financial Records (Day 6)
   Age: 1 day
   Effectiveness: 100%
   Status: ✅ Fresh evidence

RECOMMENDATION: Act quickly on security footage before
it's automatically deleted. Witness may need protection.
```

### 5.5 Escalation Mechanics

**Escalation Types**:

**VIOLENCE ESCALATION**:
```
Investigation: Gang War
Day 0: 5 dead (initial incident)
Day 3: 2 more dead (if no progress)
Day 7: 8 more dead, full war (if no progress)
Day 10: Citywide crisis, military intervention

Effect: Each escalation makes investigation harder
- More suspects (+2 difficulty)
- More locations (+2 difficulty)
- Increased combat encounters (+20% per escalation)
- Higher threat level (Alpha → Beta → Delta)
```

**SUSPECT ESCAPE**:
```
Investigation: Murder Case
Day 0: Suspect in city
Day 5: Suspect nervous, preparing to flee
Day 8: Suspect purchases plane ticket
Day 10: Suspect flees country (investigation fails)

Effect: Shrinking window
- Day 0-5: Can arrest anytime
- Day 6-8: Must act before flight
- Day 9+: International manhunt required
```

**EVIDENCE COVERUP**:
```
Investigation: Corporate Corruption
Day 0: Evidence exists in corporate servers
Day 4: Corporation becomes aware of investigation
Day 7: Corporation begins document destruction
Day 10: All evidence wiped, witnesses silenced

Effect: Race against deletion
- Day 0-3: Full access (if you have warrant)
- Day 4-6: Limited access (some files encrypted)
- Day 7-9: Minimal access (active deletion in progress)
- Day 10+: No access (complete coverup)
```

**RETALIATION**:
```
Investigation: Organized Crime
Day 0: You start investigating
Day 3: Crime boss learns of your investigation
Day 5: Warning sent (threatening email)
Day 7: Attempt on your life (combat encounter)
Day 10+: War declared on your faction

Effect: Increasing danger
- Day 0-2: No retaliation
- Day 3-6: Surveillance on you
- Day 7-9: Assassination attempts
- Day 10+: Full faction war
```

### 5.6 Pressure Level System

**Pressure Accumulation**:
```
Pressure = (Days Elapsed / Deadline) × 100 + Faction Impatience

Examples:
- Day 3 of 10-day investigation = 30% pressure
- Day 8 of 10-day investigation = 80% pressure
- Day 12 of 10-day investigation (overtime) = 120% pressure
```

**Pressure Effects**:

| Pressure | Status | Effects |
|----------|--------|---------|
| 0-25% | 🟢 Calm | Normal operations |
| 26-50% | 🟡 Moderate | Handler sends check-in emails |
| 51-75% | 🟠 High | Daily pressure emails, -1 CS to all rolls |
| 76-99% | 🔴 Critical | Ultimatum issued, -2 CS to all rolls |
| 100%+ | ⚫ Extreme | Investigation failing, -3 CS, faction anger |

**Pressure Events**:

**25% PRESSURE**:
```
EMAIL FROM: Handler
SUBJECT: Status Check

Just checking in on the warehouse murders case.
How's it progressing?

[Provide Update] [Request Extension] [Ignore]
```

**50% PRESSURE**:
```
EMAIL FROM: Handler
SUBJECT: Timeline Concern

We're halfway through the deadline with limited progress.
Is there anything you need? Backup? Resources?

This case is important. Don't let it go cold.

[Request Backup] [Request More Time] [Reassure Handler]
```

**75% PRESSURE**:
```
EMAIL FROM: Handler
SUBJECT: URGENT: Deadline Approaching

Time is running out. The Director is asking questions.

If you can't close this case, we'll have to reassign it
to another team. This will not look good for you.

What's your plan?

[Provide Plan] [Request Extension (-2 Faction Standing)]
```

**100% PRESSURE**:
```
EMAIL FROM: Director
SUBJECT: FINAL WARNING

This is unacceptable. You've exceeded the deadline with
no resolution.

You have 24 hours to close this case or it's being
pulled from you.

Failure will result in disciplinary action.

[Emergency Confrontation] [Abandon Case (-5 Faction Standing)]
```

### 5.7 Opportunity Windows

**Time-Limited Events**:

**SCHEDULED MEETING**:
```
INTEL: Target meeting with supplier
Location: Port District, Slip 23
Time: Tomorrow, 3:00 AM (18 hours from now)
Opportunity: Catch both target AND supplier
Window: 2-hour meeting window

OPTIONS:
[Raid Meeting] (arrest both - Hard deadline)
[Surveillance Only] (gather intel - Safe)
[Ambush After] (catch target alone - Medium risk)

⏰ COUNTDOWN: 17:42:33 remaining
```

**WITNESS AVAILABILITY**:
```
WITNESS: Maria Santos (saw suspect)
Status: Leaving country in 3 days for permanent move
Opportunity: Interview before she leaves
Window: 3 days

OPTIONS:
[Interview Today] (1 day, standard interrogation)
[Detailed Interview] (2 days, +2 CS but uses more time)
[Let Her Go] (lose witness permanently)

⏰ TIME LEFT: 3 days, 4 hours
```

**DIGITAL EVIDENCE**:
```
HACKING OPPORTUNITY: Corporate server backup
Status: Vulnerability discovered in firewall
Window: Security patch deploying in 12 hours
Opportunity: Download all evidence before patch

OPTIONS:
[Hack Now] (6 hours, requires Hacking 60+)
[Plan Careful Hack] (10 hours, +2 CS, may miss window)
[Abandon] (lose evidence opportunity)

⏰ PATCH DEPLOYMENT: 11:37:00
```

### 5.8 Time Management UI

**Investigation Clock Display**:

```
┌──────────────────────────────────────────────────────────────┐
│  INVESTIGATION: The Warehouse Murders                         │
│  ⏰ DEADLINE: 4 days, 7 hours remaining                       │
│  📊 PRESSURE: ██████████░░ 75% (CRITICAL)                     │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  TIME BREAKDOWN:                                               │
│  • Days Elapsed: 6                                            │
│  • Days Remaining: 4                                          │
│  • Total Deadline: 10 days                                    │
│                                                                │
│  ACTIVE TIMERS:                                                │
│  ⏱️ Security Footage Auto-Delete: 14 hours                    │
│  ⏱️ Witness Leaving Country: 2 days, 3 hours                 │
│  ⏱️ Suspect Flight Departure: 3 days, 8 hours                │
│                                                                │
│  UPCOMING ESCALATIONS:                                         │
│  ⚠️ Day 8: Gang war likely to spread (2 days)                │
│  ⚠️ Day 10: Case auto-closes (4 days)                        │
│                                                                │
│  CLUE DECAY:                                                   │
│  • Crime Scene Evidence: 60% effective (degrading)            │
│  • Witness Testimony: 80% effective                           │
│  • Digital Logs: 100% effective (fresh)                       │
│                                                                │
│  PRESSURE EFFECTS:                                             │
│  • All skill checks: -2 CS                                    │
│  • Handler emails: Daily                                      │
│  • Next pressure email: 6 hours                               │
│                                                                │
│  [View Timeline] [Request Extension] [Emergency Actions]      │
└──────────────────────────────────────────────────────────────┘
```

**Timeline View** (visual representation):

```
INVESTIGATION TIMELINE

Day 0  ──●── [Start] Warehouse murders discovered
         │
Day 2  ──●── [Clue] Autopsy report received
         │
Day 4  ──●── [Intel] Informant tip (Port District)
         │
Day 6  ──●── [Now] You are here
         │
         │   ⚠️ PRESSURE: 75% (Critical)
         │
Day 8  ──⚠── [Escalation] Gang war spreads
         │
Day 10 ──❌─ [DEADLINE] Case closes


OPPORTUNITY WINDOWS:
├── 14 hrs: Security footage deleted
├── 2 days: Witness leaves country
└── 3 days: Suspect flees

RECOMMENDED: Act within 2 days to preserve evidence
```

---

## 6. SKILL CHECKS & CHARACTER STATS

### 6.1 How It Works

**Concept**: Character stats and skills directly affect investigation success. Different investigation actions require different capabilities.

**Core System**: Uses existing Universal Table (d100 + Column Shifts)

### 6.2 Primary Stats in Investigations

```typescript
interface InvestigationStats {
  // Primary Stats (from characterSheet.ts)
  STR: number      // 1-100 (Rarely used - intimidation, force entry)
  AGL: number      // 1-100 (Surveillance, stealth, escape)
  CON: number      // 1-100 (Endurance during long stakeouts)
  MEL: number      // 1-100 (Combat during confrontation)
  INT: number      // 1-100 (⭐ CRITICAL - analysis, deduction, research)
  INS: number      // 1-100 (⭐ CRITICAL - reading people, spotting lies)
  CHA: number      // 1-100 (Interrogation, informant relations)

  // Derived Investigation Stats
  investigationBonus: number    // Calculated from INT + INS
  socialBonus: number           // Calculated from CHA + INS
  fieldworkBonus: number        // Calculated from AGL + CON
}
```

**Stat to Column Shift Conversion**:

| Stat Value | Rank | Column Shift |
|------------|------|--------------|
| 1-9 | Pathetic | -3 CS |
| 10-19 | Poor | -2 CS |
| 20-29 | Weak | -1 CS |
| 30-49 | Average | +0 CS |
| 50-69 | Good | +1 CS |
| 70-84 | Excellent | +2 CS |
| 85-99 | Amazing | +3 CS |
| 100+ | Superhuman | +4 CS |

### 6.3 Investigation Skills

**CORE INVESTIGATION SKILLS** (New):

```typescript
interface InvestigationSkills {
  detective: number        // 0-100 (General investigation ability)
  forensics: number        // 0-100 (Physical evidence analysis)
  interrogation: number    // 0-100 (Questioning suspects/witnesses)
  surveillance: number     // 0-100 (Tracking, stakeouts)
  research: number         // 0-100 (Database searches, analysis)
  streetwise: number       // 0-100 (Underground intel, gangs)
  hacking: number          // 0-100 (Digital investigation)
  law: number              // 0-100 (Legal procedures, warrants)
}
```

**Skill Sources**:
1. **Education Background**:
   - Law Degree → Law +40, Research +20
   - Forensic Science → Forensics +50, Detective +20
   - Computer Science → Hacking +50, Research +30

2. **Career Experience**:
   - Police Detective → Detective +40, Interrogation +30
   - Journalist → Research +40, Streetwise +20
   - Hacker → Hacking +60, Surveillance +20

3. **Training**:
   - Can improve skills through education system
   - Cost: $10k per +10 skill points
   - Time: 30 days of training

### 6.4 Skill Check Examples

**CRIME SCENE INVESTIGATION**:
```
Action: Search crime scene for clues
Base Difficulty: Column 6 (Moderate)
Character: Agent Chen

STATS APPLIED:
• INT: 72 (Excellent) → +2 CS
• Detective Skill: 65 (Good) → +1 CS
• Forensics Skill: 80 (Excellent) → +2 CS
• City Familiarity (Lagos): 45 → +0 CS

TOTAL: +5 CS (Column 6 → Column 11)

ROLL: d100 = 64
RESULT: Check Column 11, roll 64 = YELLOW (Hit)

OUTCOME: 3 clues discovered at crime scene
```

**INTERROGATION**:
```
Action: Question witness about suspect identity
Base Difficulty: Column 7 (Hard - witness scared)
Character: Agent Rodriguez

STATS APPLIED:
• CHA: 55 (Good) → +1 CS
• INS: 68 (Good) → +1 CS
• Interrogation Skill: 50 (Average) → +0 CS
• Personality (Sociability 8): +1 CS

PENALTIES:
• Witness Intimidated: -2 CS
• Language Barrier (no local language): -1 CS

TOTAL: +1 -3 = -2 CS (Column 7 → Column 5)

ROLL: d100 = 45
RESULT: Check Column 5, roll 45 = GREEN (Graze)

OUTCOME: Witness provides partial info (vague description)
```

**HACKING CORPORATE DATABASE**:
```
Action: Access encrypted financial records
Base Difficulty: Column 8 (Very Hard - military encryption)
Character: Agent Chen

STATS APPLIED:
• INT: 72 (Excellent) → +2 CS
• Hacking Skill: 85 (Amazing) → +3 CS
• Research Skill: 70 (Excellent) → +2 CS
• Equipment (Military-grade hacking rig): +2 CS

TOTAL: +9 CS (Column 8 → Column 17 - capped at Column 15)

ROLL: d100 = 55
RESULT: Check Column 15, roll 55 = BLUE (Critical!)

OUTCOME: Full database access + discovered hidden offshore
accounts + backdoor installed for future access
```

### 6.5 Skill Synergies

**COMPLEMENTARY SKILLS** (Both apply):

**Detective + Forensics**:
- Crime scene investigation
- Evidence analysis
- Pattern recognition
- Bonus: +1 CS if both skills above 60

**Interrogation + Streetwise**:
- Questioning criminals
- Reading gang dynamics
- Spotting lies from street informants
- Bonus: +1 CS if both skills above 60

**Hacking + Research**:
- Digital forensics
- Database correlation
- Network mapping
- Bonus: +1 CS if both skills above 60

**Surveillance + Stealth**:
- Physical tailing
- Stakeout positioning
- Avoiding counter-surveillance
- Bonus: +1 CS if both skills above 60

### 6.6 Team Investigation Bonuses

**MULTI-CHARACTER INVESTIGATIONS**:

```typescript
interface TeamBonus {
  // Each additional investigator
  baseBonus: number              // +1 CS per character (max +3)

  // Skill coverage bonus
  skillDiversity: number         // +1 CS if team covers 4+ skill types

  // Personality synergy
  teamwork: number               // Based on sociability stats

  // Leadership bonus
  leadership: number             // If team has high CHA leader
}
```

**Example**:

```
TEAM INVESTIGATION: 3 Agents

Agent 1: Detective specialist (Detective 80, Forensics 60)
Agent 2: Tech specialist (Hacking 85, Research 70)
Agent 3: Social specialist (Interrogation 75, Streetwise 65)

TEAM BONUSES:
• Multi-character: +2 CS (2 additional agents)
• Skill Diversity: +1 CS (covers Detective, Tech, Social)
• Teamwork: +1 CS (all have Sociability 6+)
• Leadership: +1 CS (Agent 1 has CHA 70)

TOTAL TEAM BONUS: +5 CS

Applied to ALL team actions during investigation.
```

### 6.7 Character Builds for Investigation

**THE DETECTIVE** (Investigation specialist):
- INT 70+, INS 65+, CHA 55+
- Skills: Detective 80, Forensics 70, Interrogation 60
- Best at: Discovery phase, evidence analysis
- Weakness: Limited combat, poor hacking

**THE HACKER** (Digital specialist):
- INT 75+, AGL 60+, INS 50+
- Skills: Hacking 85, Research 75, Surveillance 60
- Best at: Research phase, digital forensics
- Weakness: Poor social skills, fragile in combat

**THE FACE** (Social specialist):
- CHA 75+, INS 70+, INT 55+
- Skills: Interrogation 80, Streetwise 70, Law 60
- Best at: Interrogations, informant relations
- Weakness: Can't analyze technical evidence

**THE OPERATOR** (Field specialist):
- AGL 70+, CON 65+, MEL 70+
- Skills: Surveillance 75, Stealth 70, Tactics 65
- Best at: Surveillance phase, confrontations
- Weakness: Poor research and analysis

**THE POLYMATH** (Balanced):
- All stats 60+
- Skills: All investigation skills 50-60
- Best at: Solo investigations, flexible roles
- Weakness: Master of none

### 6.8 Personality Integration

**MBTI EFFECTS ON INVESTIGATION**:

**INTJ** (The Architect):
- Bonus: +2 CS Research, +2 CS Evidence Analysis
- Penalty: -1 CS Interrogation (impatient with witnesses)
- Special: Breakthroughs 20% more likely

**ESTP** (The Entrepreneur):
- Bonus: +2 CS Surveillance, +2 CS Streetwise
- Penalty: -1 CS Research (hates desk work)
- Special: Opportunity windows 20% longer

**INFJ** (The Advocate):
- Bonus: +2 CS Interrogation, +2 CS Reading People
- Penalty: -1 CS Confrontation (avoids violence)
- Special: Informants trust +20% faster

**ISTJ** (The Logistician):
- Bonus: +1 CS all investigation actions (methodical)
- Penalty: -2 CS Improvisation
- Special: Never misses clue decay warnings

---

## 7. BRANCHING OUTCOMES

### 7.1 How It Works

**Concept**: Investigations can resolve in multiple ways based on:
- Which leads you discover (WHO/WHERE/WHAT/WHY)
- Your approach (violent/peaceful/legal/illegal)
- Your choices during confrontation
- Relationship with factions

**No "correct" solution** - Multiple valid endings with different consequences

### 7.2 Resolution Matrix

```typescript
interface InvestigationResolution {
  id: string
  type: 'arrest' | 'capture' | 'elimination' | 'negotiation' | 'escape' | 'failure'

  // Requirements
  requiredLeads: ('WHO' | 'WHERE' | 'WHAT' | 'WHY')[]
  minimumProgress: number        // 0-100%

  // Outcomes
  factionStanding: number        // -5 to +5
  rewards: {
    money: number
    equipment?: string[]
    intel?: string[]
    contacts?: string[]
  }

  // Consequences
  followUpInvestigations?: string[]
  enemiesMade?: string[]
  alliesGained?: string[]
  worldStateChanges?: string[]

  // Narrative
  resolutionText: string
  epilogue: string
}
```

### 7.3 Outcome Tree Example

**Investigation**: "The Warehouse Murders" in Lagos

**OUTCOME 1: PERFECT ARREST**
- Requirements: All 4 leads (100%), Legal warrant, Non-lethal capture
- Faction Standing: +4
- Rewards: $100,000, Commendation, +20 Fame
- Consequences:
  - Iron Syndicate weakened (Lagos crime -15%)
  - Informant trust +10% (clean operation)
  - Follow-up: "Shanghai Connection" unlocked
- Epilogue: "Marcus Okoro sentenced to 25 years. His testimony exposed the international arms network, leading to arrests in three countries."

**OUTCOME 2: BRUTAL ELIMINATION**
- Requirements: 2+ leads (50%+), Kill Marcus Okoro
- Faction Standing: +1
- Rewards: $40,000, -10 Fame (controversial)
- Consequences:
  - Iron Syndicate enraged (Lagos crime +20%)
  - Gang war escalates
  - Informants nervous (-10% trust)
  - Retaliation mission: "Syndicate Revenge"
- Epilogue: "Marcus Okoro killed in raid. The Syndicate vows revenge. Gang violence escalates across Lagos."

**OUTCOME 3: NEGOTIATED SURRENDER**
- Requirements: 3+ leads (75%+), High CHA (70+), WHY lead discovered
- Faction Standing: +5
- Rewards: $120,000, Marcus as informant, Arms dealer intel
- Consequences:
  - Iron Syndicate intact but cooperative
  - Marcus provides ongoing intel
  - Shanghai investigation gets +30% head start
  - Other gangs respect your diplomacy
- Epilogue: "Marcus Okoro agreed to witness protection in exchange for testimony. His intel led to the arrest of the Shanghai arms dealer and dismantled the trafficking network."

**OUTCOME 4: TARGET ESCAPED**
- Requirements: Failed to complete before Day 10, or Detection >80%
- Faction Standing: -3
- Rewards: $0, -15 Fame
- Consequences:
  - Marcus flees to China
  - Iron Syndicate grows bolder (Lagos crime +25%)
  - Investigation reopens as "International Manhunt"
  - Your handler doubts your abilities
- Epilogue: "Marcus Okoro fled the country before you could apprehend him. The murders remain unsolved. Lagos gang war intensifies."

**OUTCOME 5: COLLATERAL DISASTER**
- Requirements: Raid with >5 civilian casualties
- Faction Standing: -5
- Rewards: $20,000 (blood money), -30 Fame, Media scandal
- Consequences:
  - Public outrage (protests)
  - Government investigation into your methods
  - Informants refuse to work with you (-50% trust)
  - Restricted to non-violent investigations for 90 days
- Epilogue: "The raid turned into a bloodbath. Fifteen civilians killed in crossfire. Your faction is under investigation for excessive force."

**OUTCOME 6: DISCOVERED CONSPIRACY**
- Requirements: WHY lead + WHAT lead both 100%, Evidence Board breakthrough
- Faction Standing: +6
- Rewards: $150,000, Major commendation, +40 Fame
- Consequences:
  - Entire arms network exposed (5 countries)
  - International cooperation mission unlocked
  - Promotion offered
  - Multiple investigations spawn
- Epilogue: "Your investigation uncovered an international conspiracy. The warehouse murders were just one piece of a global arms trafficking operation spanning 12 countries. Your work led to 47 arrests and the seizure of $200 million in weapons."

### 7.4 Choice Points

**CRITICAL DECISION POINTS** during investigation:

**CHOICE POINT 1: Informant Offer** (Day 3)
```
Your informant T offers:
"I can tell you exactly where Marcus is... for 100,000 naira.
Or I can introduce you to him. He might talk if the price is right."

OPTIONS:
A) [Pay ₦100k] Buy location info
   → Leads to: Tactical raid outcome
   → Faction Standing: +0 (standard)

B) [Arrange Meeting] Negotiate with Marcus
   → Leads to: Negotiation outcome possible
   → Faction Standing: +2 (if successful)
   → Risk: 40% chance Marcus ambushes you

C) [Refuse] Do it the hard way
   → Investigation continues normally
   → Faction Standing: +1 (by-the-book)
   → Time cost: +3 days
```

**CHOICE POINT 2: Warrant Decision** (Day 6)
```
You have enough evidence for a warrant, but the judge is
corrupt and will tip off Marcus.

OPTIONS:
A) [Get Warrant] Legal arrest
   → Marcus flees (80% chance)
   → Legal outcome but may fail
   → Faction Standing: +2 (legal)

B) [Skip Warrant] Illegal raid
   → Successful capture (90% chance)
   → Illegal outcome, evidence inadmissible
   → Faction Standing: -1 (illegal means)

C) [Bribe Judge] Pay ₦50k for secrecy
   → Legal warrant + no tip-off
   → Best outcome but expensive
   → Faction Standing: +0 (questionable ethics)
```

**CHOICE POINT 3: Confrontation Method** (Day 8)
```
Marcus surrounded in hideout. You have him cornered.

OPTIONS:
A) [Demand Surrender] Arrest attempt
   → Requires: CHA 60+ and Interrogation 50+
   → Success: Peaceful arrest, +4 Faction Standing
   → Failure: Firefight, -2 Faction Standing

B) [Tactical Raid] Storm the hideout
   → Guaranteed combat
   → Success: Capture or kill
   → Collateral damage risk

C) [Sniper Shot] Assassination
   → Requires: Sniper rifle + Stealth 70+
   → Success: Clean kill, +1 Faction Standing
   → Failure: War with Syndicate
   → Locked if: Harm Avoidance 7+

D) [Wait Him Out] Siege
   → Time cost: +2 days
   → Forces: Negotiation or starvation
   → Risk: Backup arrives or escape tunnel
```

### 7.5 Consequence Chains

**LONG-TERM CONSEQUENCES**:

**IF YOU ARREST MARCUS**:
1. Marcus provides testimony → Arms dealer identified
2. Follow-up investigation: "Shanghai Connection"
3. Arms dealer arrested → International incident with China
4. China becomes hostile (-20 faction standing)
5. BUT: Arms trafficking network destroyed
6. World event: "International Arms Treaty Signed"

**IF YOU KILL MARCUS**:
1. Iron Syndicate declares war on you
2. Lagos crime index +20%
3. Bounty placed on your head (₦5,000,000)
4. Random assassination attempts (every 30 days, 20% chance)
5. BUT: Syndicate weakened, territory available for takeover
6. Opportunity: "Seize Syndicate Territory" mission

**IF MARCUS ESCAPES**:
1. Becomes recurring villain
2. Shows up in other investigations
3. Learns your methods (+2 difficulty to catch him)
4. Eventually: "Final Confrontation" mission unlocks
5. Permanent -10% success on Lagos investigations
6. BUT: Can recruit him later if you change approach

### 7.6 Alignment & Morality Tracking

```typescript
interface InvestigatorAlignment {
  // 0-100 scales (50 = neutral)
  lawful: number       // 0 = criminal, 100 = by-the-book
  aggressive: number   // 0 = pacifist, 100 = violent
  merciful: number     // 0 = ruthless, 100 = forgiving

  // Consequences
  reputation: {
    police: number     // How cops view you
    criminals: number  // How underworld views you
    public: number     // How citizens view you
  }

  // Unlocks
  unlockedMethods: string[]    // "Assassination", "Torture", etc.
  lockedMethods: string[]      // Restricted due to morality
}
```

**Alignment Effects**:

**LAWFUL (80+)**:
- Unlocks: Legal warrants, official backup, courtroom testimony
- Locks: Illegal searches, torture, assassination
- Reputation: +30% with police, -20% with criminals

**CRIMINAL (20-)**:
- Unlocks: Illegal methods, criminal contacts, black market
- Locks: Official warrants, police cooperation
- Reputation: -40% with police, +30% with criminals

**AGGRESSIVE (80+)**:
- Unlocks: Shoot first options, intimidation tactics
- Locks: Peaceful negotiation, harm avoidance
- Reputation: +20% fear, -30% trust

**MERCIFUL (80+)**:
- Unlocks: Recruitment options, witness protection, redemption arcs
- Locks: Execution, abandoning allies
- Reputation: +40% public trust, -10% criminal fear

### 7.7 Branching Outcome UI

**Investigation Resolution Screen**:

```
┌──────────────────────────────────────────────────────────────┐
│  INVESTIGATION COMPLETE: The Warehouse Murders                │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  RESOLUTION: Negotiated Surrender                             │
│  OUTCOME QUALITY: ⭐⭐⭐⭐⭐ (Perfect)                        │
│                                                                │
│  LEADS DISCOVERED:                                             │
│  ✅ WHO: Marcus "Iron Fist" Okoro (100%)                      │
│  ✅ WHERE: Syndicate HQ, 47 Warehouse Road (100%)             │
│  ✅ WHAT: Contract killings for arms traders (100%)           │
│  ✅ WHY: Territory control for weapons trade (100%)           │
│                                                                │
│  FACTION STANDING: +5 (Nigerian Government)                    │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ "Outstanding work, Agent. The President himself has    │  │
│  │  commended your handling of this sensitive matter.     │  │
│  │  Your diplomatic approach avoided bloodshed and        │  │
│  │  delivered justice. This is the standard we expect."   │  │
│  │  - Minister Okonkwo                                     │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
│  REWARDS:                                                      │
│  • Payment: ₦12,000,000 ($120,000 USD)                        │
│  • Fame: +25                                                   │
│  • Lagos Familiarity: +15                                     │
│  • Equipment: Marcus's armor (DR 25)                          │
│  • New Informant: Marcus "Iron Fist" Okoro                    │
│  • Intel: Shanghai arms dealer identity                       │
│                                                                │
│  CONSEQUENCES:                                                 │
│  🟢 Iron Syndicate cooperating with authorities               │
│  🟢 Gang violence reduced (-15% Lagos crime index)            │
│  🟢 International arms network exposed                        │
│  🟡 Marcus in witness protection (vulnerable)                 │
│                                                                │
│  FOLLOW-UP INVESTIGATIONS UNLOCKED:                            │
│  • "Shanghai Connection" - Track arms dealer                  │
│  • "Syndicate Reform" - Help Marcus reform gang               │
│  • "Witness Protection" - Guard Marcus from retaliation       │
│                                                                │
│  EPILOGUE:                                                     │
│  Marcus Okoro agreed to witness protection in exchange for    │
│  testimony against the international arms network. His intel  │
│  led to 47 arrests across 12 countries and the seizure of    │
│  $200 million in illegal weapons.                             │
│                                                                │
│  The Lagos gang war has ended. The city is safer because of   │
│  your actions.                                                 │
│                                                                │
│  [Continue] [View Statistics] [Start Next Investigation]      │
└──────────────────────────────────────────────────────────────┘
```

---

## 8. SYSTEM INTEGRATION

### 8.1 Integration with Existing Systems

**FAME SYSTEM**:
- Successful investigations → +10 to +40 Fame
- Failed investigations → -10 to -30 Fame
- Perfect outcomes → Media coverage, +50 Fame
- Collateral damage → Public outrage, -40 Fame

**CITY FAMILIARITY**:
- Each investigation in city → +10 to +20 Familiarity
- Familiarity unlocks better informants
- High familiarity (80+) → Local tips come to YOU
- Low familiarity (<20) → Penalty to all investigation rolls

**PERSONALITY SYSTEM**:
- Impatience affects time pressure tolerance
- Sociability affects informant relationships
- Discipline affects legal vs. illegal choices
- Harm Avoidance locks/unlocks resolution types

**FACTION STANDING**:
- Successful investigations → +1 to +5 Standing
- Failed investigations → -1 to -5 Standing
- Standing determines mission assignments
- High standing → Elite investigations offered

**WORLD MAP**:
- Investigations occur in specific sectors
- Must travel to investigation location
- Investigation sites become landmarks
- Sector control affects investigation difficulty

**TACTICAL COMBAT**:
- Confrontation phase triggers Phaser combat
- Combat outcome affects resolution type
- Non-lethal captures require tactical decisions
- Casualties affect faction standing

### 8.2 Database Schema

**SQL Tables** (for Supabase integration):

```sql
-- investigations table
CREATE TABLE investigations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  city_id UUID REFERENCES cities(id),
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 10),
  deadline_days INTEGER,
  threat_level INTEGER CHECK (threat_level BETWEEN 1 AND 5),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- investigation_leads table
CREATE TABLE investigation_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investigation_id UUID REFERENCES investigations(id),
  lead_type TEXT CHECK (lead_type IN ('WHO', 'WHERE', 'WHAT', 'WHY')),
  progress INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  clues_found TEXT[]
);

-- investigation_emails table
CREATE TABLE investigation_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investigation_id UUID REFERENCES investigations(id),
  thread_id UUID,
  from_name TEXT NOT NULL,
  from_type TEXT,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  priority TEXT,
  timestamp INTEGER,
  read BOOLEAN DEFAULT FALSE,
  attached_clues TEXT[]
);

-- evidence_board table
CREATE TABLE evidence_board (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investigation_id UUID REFERENCES investigations(id),
  evidence_type TEXT,
  title TEXT NOT NULL,
  description TEXT,
  found_at TEXT,
  found_by UUID REFERENCES characters(id),
  tags TEXT[],
  board_x INTEGER,
  board_y INTEGER
);

-- evidence_connections table
CREATE TABLE evidence_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investigation_id UUID REFERENCES investigations(id),
  from_evidence_id UUID REFERENCES evidence_board(id),
  to_evidence_id UUID REFERENCES evidence_board(id),
  connection_type TEXT,
  notes TEXT,
  strength TEXT
);

-- informants table
CREATE TABLE informants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  alias TEXT,
  type TEXT NOT NULL,
  base_city_id UUID REFERENCES cities(id),
  trust_level INTEGER DEFAULT 0 CHECK (trust_level BETWEEN 0 AND 100),
  loyalty_type TEXT,
  reliability INTEGER CHECK (reliability BETWEEN 0 AND 100),
  access_level TEXT,
  status TEXT DEFAULT 'active',
  last_contact INTEGER,
  payment_required INTEGER,
  exposure_risk INTEGER DEFAULT 0
);

-- investigation_resolutions table
CREATE TABLE investigation_resolutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investigation_id UUID REFERENCES investigations(id),
  resolution_type TEXT NOT NULL,
  faction_standing_change INTEGER,
  rewards JSONB,
  consequences JSONB,
  epilogue TEXT,
  resolved_at TIMESTAMP DEFAULT NOW()
);
```

### 8.3 TypeScript Integration

**New Data Files**:

1. **`c:\git\sht\MVP\src\data\investigationSystem.ts`**
   - Investigation templates
   - Email generation
   - Lead tracking
   - Time pressure calculations

2. **`c:\git\sht\MVP\src\data\evidenceBoard.ts`**
   - Evidence types
   - Connection detection
   - Breakthrough triggers
   - Board layout algorithms

3. **`c:\git\sht\MVP\src\data\informantNetwork.ts`**
   - Informant generation
   - Trust management
   - Intel quality calculations
   - Network visualization data

4. **`c:\git\sht\MVP\src\data\investigationSkills.ts`**
   - Skill definitions
   - Stat-to-CS conversions
   - Skill synergy calculations
   - Team bonus formulas

**Store Integration** (`enhancedGameStore.ts`):

```typescript
interface EnhancedGameStore {
  // ... existing properties ...

  // INVESTIGATION SYSTEM
  activeInvestigations: Investigation[]
  completedInvestigations: InvestigationResolution[]
  investigationEmails: InvestigationEmail[]
  evidenceBoards: Map<string, EvidenceBoard>
  informantNetwork: Informant[]

  // Actions
  startInvestigation: (templateId: string) => void
  addEmailToInvestigation: (invId: string, email: InvestigationEmail) => void
  updateLeadProgress: (invId: string, leadType: string, progress: number) => void
  addEvidenceToBoard: (invId: string, evidence: Evidence) => void
  connectEvidence: (invId: string, conn: Connection) => void
  recruitInformant: (informant: Informant) => void
  contactInformant: (informantId: string, payment: number) => void
  resolveInvestigation: (invId: string, resolution: InvestigationResolution) => void
}
```

### 8.4 Component Architecture

**React Components**:

1. **`InvestigationCenter.tsx`** (Main hub)
   - Investigation list
   - Email inbox
   - Evidence board access
   - Informant network

2. **`EmailInbox.tsx`**
   - Email thread view
   - Response options
   - Attachment viewing
   - Priority filtering

3. **`EvidenceBoard.tsx`**
   - Drag-and-drop clue placement
   - Connection drawing (SVG lines)
   - Breakthrough detection
   - Timeline view

4. **`InformantNetwork.tsx`**
   - Contact list with trust meters
   - Map view of coverage
   - Contact actions
   - Maintenance reminders

5. **`InvestigationPhaseManager.tsx`**
   - Phase progression UI
   - Available actions list
   - Objective tracking
   - Time pressure display

6. **`InvestigationResolution.tsx`**
   - Outcome display
   - Consequences breakdown
   - Epilogue narrative
   - Follow-up unlocks

### 8.5 Phaser Integration

**Confrontation Phase → CombatScene**:

When investigation reaches Confrontation:

```typescript
// In InvestigationPhaseManager.tsx
const handleConfrontation = (approach: 'raid' | 'ambush' | 'arrest') => {
  const combatConfig = {
    mission: {
      type: 'investigation_confrontation',
      investigationId: currentInvestigation.id,
      approach: approach,
      targetInfo: currentInvestigation.suspect,
      location: currentInvestigation.hideout,
      tacticalIntel: surveillanceData,
    },
    squad: selectedSquad,
    enemyUnits: generateEnemiesFromIntel(surveillanceData),
    map: generateMapFromHideout(currentInvestigation.hideout),
    objectives: {
      primary: 'capture_alive',  // or 'eliminate'
      secondary: ['no_civilian_casualties', 'recover_evidence'],
    },
  }

  EventBridge.emit('start-investigation-combat', combatConfig)
}

// In CombatScene.ts
EventBridge.on('start-investigation-combat', (config) => {
  this.loadInvestigationMission(config)
  // Apply tactical intel bonuses from surveillance
  if (config.tacticalIntel.blueprints) {
    this.applyMapKnowledgeBonus(+2)  // +2 CS for full blueprints
  }
  if (config.tacticalIntel.guardCount) {
    this.revealEnemyPositions()  // Surveillance revealed positions
  }
})

// Combat completion
EventBridge.emit('investigation-combat-complete', {
  investigationId: config.investigationId,
  outcome: 'target_captured',  // or 'target_killed', 'target_escaped'
  casualties: combatResult.casualties,
  collateralDamage: combatResult.civilianCasualties,
  evidenceRecovered: combatResult.lootedItems,
})
```

---

## 9. IMPLEMENTATION ROADMAP

### Phase 1: Email Chain System (Week 1-2)
- [ ] Create `investigationSystem.ts` data file
- [ ] Build `EmailInbox.tsx` component
- [ ] Implement email template system
- [ ] Wire trigger conditions (time/event/relationship)
- [ ] Test email chains with 3 sample investigations

### Phase 2: Evidence Board (Week 3-4)
- [ ] Create `evidenceBoard.ts` data file
- [ ] Build `EvidenceBoard.tsx` component with drag-drop
- [ ] Implement SVG connection drawing
- [ ] Code breakthrough detection algorithm
- [ ] Test with "Warehouse Murders" example

### Phase 3: Informant Network (Week 5-6)
- [ ] Create `informantNetwork.ts` data file
- [ ] Build `InformantNetwork.tsx` component
- [ ] Implement trust system formulas
- [ ] Wire relationship decay timers
- [ ] Generate 50+ informant templates across cities

### Phase 4: Investigation Phases (Week 7-8)
- [ ] Create phase state machine
- [ ] Build `InvestigationPhaseManager.tsx`
- [ ] Implement available actions per phase
- [ ] Wire phase transition logic
- [ ] Test full investigation flow

### Phase 5: Time Pressure (Week 9-10)
- [ ] Implement deadline timers
- [ ] Code lead decay system
- [ ] Build escalation triggers
- [ ] Create opportunity window mechanics
- [ ] Add time pressure UI elements

### Phase 6: Skill Checks (Week 11-12)
- [ ] Create `investigationSkills.ts`
- [ ] Wire stats to Universal Table
- [ ] Implement skill synergies
- [ ] Code team investigation bonuses
- [ ] Balance skill requirements across actions

### Phase 7: Branching Outcomes (Week 13-14)
- [ ] Design outcome trees for 10 investigations
- [ ] Implement consequence tracking
- [ ] Wire alignment/morality system
- [ ] Create resolution screens
- [ ] Test all outcome paths

### Phase 8: Integration & Polish (Week 15-16)
- [ ] Wire to Phaser combat (confrontation → CombatScene)
- [ ] Integrate with fame/familiarity/faction systems
- [ ] Database migration (Supabase tables)
- [ ] Performance optimization
- [ ] Full system testing
- [ ] Documentation

---

## 10. SAMPLE INVESTIGATION: COMPLETE FLOW

**Investigation**: "The Shanghai Smuggler"
**Location**: Shanghai, China
**Difficulty**: 7/10
**Deadline**: 12 days
**Threat Level**: 3 (Delta-tier LSW)

### Day 0: Email Assignment

```
FROM: Director Chen Wei, Chinese Intelligence Bureau
SUBJECT: URGENT: Tech Smuggling Operation
PRIORITY: HIGH

Agent,

We've detected unauthorized technology transfers from our
quantum computing facility. A mole is selling state secrets
to foreign powers. This is a matter of national security.

Find the mole. Stop the leak.

Time is critical - our next breakthrough is in 12 days.

[Accept Assignment] [Request More Information] [Decline]
```

**Player accepts**

### Day 1: Discovery Phase - Visit Facility

**Action**: Visit quantum facility
**Skill Check**: Detective 60 + INT 70 → +4 CS
**Roll**: 72 → HIT (Yellow)
**Result**: 3 clues discovered

**Clues**:
1. Access logs show irregular late-night entries
2. Missing research files (deleted from server)
3. Witness: Security guard saw suspicious visitor

**Email arrives**:
```
FROM: Dr. Liu Feng, Lead Researcher
SUBJECT: Missing Data

The deleted files contain our breakthrough algorithm.
If that reaches foreign hands, China loses 5 years of
competitive advantage.

I suspect Dr. Wang. He's been acting strangely.

Attached: [Personnel Files]
```

**WHO lead**: 20% progress (suspect identified)

### Day 2: Research Phase - Database Search

**Action**: Background check on Dr. Wang
**Skill Check**: Research 75 + Hacking 80 → +5 CS
**Roll**: 45 → HIT (Yellow)
**Result**: Financial records show unexplained wealth

**Clue**: Bank deposits totaling $500k in past 3 months

**Evidence Board Auto-Connect**:
```
🔍 BREAKTHROUGH TRIGGERED!

"Follow the Money"

Dr. Wang's bank deposits align exactly with missing
file deletion dates. Pattern match: 95% confidence.

WHO lead complete: Dr. Wang Jian (100%) ✅
```

### Day 3: Informant Contact (if you have Shanghai network)

**Email**:
```
FROM: [ANONYMOUS]
SUBJECT: I know about Wang

I've seen Wang meeting with American businessman.
Port District, every Wednesday night, 10 PM.

Next meeting: Tomorrow night.

Price: ¥50,000 for location details.

[Pay ¥50k] [Ignore] [Trace Email]
```

**Player pays**

**Result**: WHERE lead updated (Port District warehouse)

### Day 4: Surveillance Phase - Stake Out Meeting

**Action**: Physical surveillance of meeting
**Skill Check**: Surveillance 70 + Stealth 65 → +4 CS
**Detection Risk**: 40%
**Roll**: 38 → SUCCESS, Undetected

**Intel Gained**:
- Wang meets American CIA handler (John Mitchell)
- Exchange flash drive for briefcase (cash)
- Return to separate locations

**WHERE lead complete**: Warehouse location confirmed (100%) ✅
**WHAT lead**: 60% (confirmed espionage)

### Day 5: Decision Point

**Email from Director Chen**:
```
FROM: Director Chen Wei
SUBJECT: Orders

We have enough to arrest Wang. However, if we move now,
we lose the CIA connection.

OPTIONS:
1. Arrest Wang immediately (closes case, standard outcome)
2. Continue surveillance to identify entire spy network
   (risky but exposes full conspiracy)
3. Turn Wang as double agent (requires negotiation)

Your call, Agent.

[Arrest Now] [Continue Surveillance] [Flip Wang]
```

**Player chooses**: Continue Surveillance (+3 days risk)

### Day 8: Extended Surveillance

**Action**: Follow CIA handler
**Skill Check**: Surveillance 70 + INT 70 → +4 CS
**Detection Risk**: 50% (higher - CIA training)
**Roll**: 62 → DETECTED!

**Ambush Event**:
```
⚠️ DETECTION ALERT!

CIA handler spotted your tail. Armed operatives approaching.

COMBAT INITIATED

[Deploy to Tactical Combat]
```

**Combat**: Player squad vs. 3 CIA operatives
**Outcome**: Victory, 1 operative captured

**Interrogation** (High CHA + Interrogation):
```
CIA operative reveals:
- Network involves 5 Chinese scientists
- Data going to US quantum program
- Next transfer in 2 days

WHY lead complete: Corporate espionage for US advantage (100%) ✅
```

### Day 9: Confrontation Phase - Planning

**All leads discovered** (4/4 = 100%)

**Options**:
1. **Arrest Wang + Network** (legal, diplomatic incident)
2. **Raid CIA safehouse** (aggressive, international crisis)
3. **Negotiate exchange** (diplomatic, blackmail leverage)

**Player chooses**: Negotiate Exchange

### Day 10: Negotiation

**Action**: Contact CIA, offer deal
**Skill Check**: Diplomacy 60 + CHA 75 + INS 70 → +6 CS
**Roll**: 55 → CRITICAL SUCCESS (Blue)

**Negotiation Outcome**:
```
Deal Reached:
- CIA returns stolen data
- China returns captured operative
- Both countries agree to secret non-aggression pact
- Wang arrested by China (saves face)
- Spy network dismantled

Director Chen: "Exceptional work. You avoided an
international incident while securing our technology.
This is exactly what we needed."
```

### Resolution Screen

```
┌──────────────────────────────────────────────────────────────┐
│  INVESTIGATION COMPLETE: The Shanghai Smuggler                │
│  RESOLUTION: Diplomatic Exchange                              │
│  OUTCOME QUALITY: ⭐⭐⭐⭐⭐ (Perfect)                        │
├──────────────────────────────────────────────────────────────┤
│  LEADS DISCOVERED: 4/4 (100%)                                 │
│  ✅ WHO: Dr. Wang Jian (Chinese scientist turned spy)         │
│  ✅ WHERE: Port District warehouse                            │
│  ✅ WHAT: Quantum computing espionage                         │
│  ✅ WHY: US corporate advantage                               │
│                                                                │
│  FACTION STANDING: +5 (Chinese Government)                     │
│  REWARDS:                                                      │
│  • Payment: ¥1,500,000 ($210,000 USD)                         │
│  • Fame: +35                                                   │
│  • Shanghai Familiarity: +20                                  │
│  • Intel: US quantum program details                          │
│  • Diplomatic favor from China                                │
│                                                                │
│  CONSEQUENCES:                                                 │
│  🟢 International crisis averted                              │
│  🟢 Spy network dismantled (5 scientists arrested)            │
│  🟢 Quantum technology secured                                │
│  🟢 US-China cooperation improved                             │
│  🟡 CIA relations -10 (they know you caught them)             │
│                                                                │
│  FOLLOW-UP INVESTIGATIONS:                                     │
│  • "Quantum Breakthrough" - Help secure next discovery        │
│  • "CIA Payback" - CIA may retaliate later                    │
│                                                                │
│  EPILOGUE:                                                     │
│  Your diplomatic solution prevented an international          │
│  incident while securing Chinese technological supremacy.     │
│  Director Chen recommended you for promotion.                 │
│                                                                │
│  Dr. Wang sentenced to 15 years. The spy network has been     │
│  completely dismantled. US-China tensions de-escalated.       │
│                                                                │
│  [Continue] [View Full Report] [Next Investigation]           │
└──────────────────────────────────────────────────────────────┘
```

---

## CONCLUSION

This investigation system expansion transforms investigations from simple dice rolls into rich, multi-layered gameplay with:

✅ **Narrative Depth** - Email chains build story over time
✅ **Puzzle Solving** - Evidence board connects the dots
✅ **Relationship Management** - Informant network requires cultivation
✅ **Meaningful Choices** - Phase decisions affect outcomes
✅ **Time Management** - Pressure creates urgency
✅ **Character Building** - Stats and skills matter
✅ **Multiple Solutions** - No single "correct" path

**Integration**: Seamlessly connects to existing systems (fame, personality, combat, world map) while adding new strategic layer.

**Replayability**: Same investigation can resolve 5+ different ways based on player choices, skills, and relationships.

**Scalability**: System supports infinite investigation templates across 1050 cities with procedural generation potential.

---

**Next Steps**: Review this proposal, provide feedback, and begin Phase 1 implementation (Email Chain System).

**Estimated Total Implementation**: 16 weeks (4 months) for full system.

**MVP Implementation**: 6 weeks for core functionality (Email + Evidence + Basic Phases).
