# Investigation System

## Overview

Investigations are how characters gather intel, solve crimes, and enforce the law for their faction. You work for a **country** that assigns cases. Investigations take place on the **World Map** in specific **cities**, and city type heavily influences what you investigate.

---

## Core Concepts

### You Work For A Country
- When you start the game, you select a country
- That country is your **faction boss**
- They assign investigations to you via **email**
- Success improves your standing; failure damages it

### City Types Drive Investigations
Each city has a type that determines what crimes happen there:

| City Type | Investigation Types | Bonus |
|-----------|---------------------|-------|
| Temple | Religious extremism, Artifact theft, Cult activity | +2CS Religious/Mystical |
| Military | Weapons theft, Rogue soldiers, Espionage | +2CS Military/Security |
| Political | Missing officials, Corruption, Foreign agents | +2CS Political/Diplomatic |
| Industrial | Sabotage, Gang violence, Corporate crime | +2CS Corporate/Sabotage |
| Resort | Tourist disappearances, Smuggling, VIP threats | +1CS Social/Surveillance |
| Seaport | Port smuggling, Maritime incidents, Trafficking | +2CS Smuggling/Maritime |
| Mining | Illegal mining, Environmental sabotage, Labor abuse | +2CS Environmental/Industrial |
| Educational | Academic conspiracy, Radicalization, Tech theft | +2CS Academic/Research |
| Company | Corporate espionage, Tech leaks, White collar crime | +2CS Corporate/Financial |
| Village | Rural phenomena, Agricultural sabotage | +1CS Rural/Traditional |

---

## Investigation Structure

Every investigation has:

```
INVESTIGATION
├── Title: "The Warehouse Murders"
├── Type: Criminal / Conspiracy / Superhuman / etc.
├── Location: {Country, City, City Type}
├── Difficulty: 1-10
├── Time Limit: X days before case goes cold
├── Threat Level: 1-5 (how dangerous)
└── Four Leads:
    ├── WHO - Identify the suspect(s)
    ├── WHERE - Find the location(s)
    ├── WHAT - Understand what happened
    └── WHY - Discover the motive
```

---

## The Four Leads

Each investigation has **4 leads** to pursue. Each lead is a **separate roll**.

### Lead Types

| Lead | Question | What You Learn |
|------|----------|----------------|
| **WHO** | Who did this? | Suspect identity, descriptions, associates |
| **WHERE** | Where did it happen / Where are they? | Locations, hideouts, travel patterns |
| **WHAT** | What exactly happened? | Evidence, method, timeline |
| **WHY** | Why did they do it? | Motive, larger conspiracy, next target |

### Solving With Partial Leads

You don't need all 4 leads to close a case:

| Leads Found | Result |
|-------------|--------|
| **4 of 4** | Perfect solve - Full rewards, best outcome |
| **3 of 4** | Good solve - Standard rewards, minor loose ends |
| **2 of 4** | Partial solve - Reduced rewards, suspect may escape |
| **1 of 4** | Weak solve - Minimal rewards, high chance of retaliation |
| **0 of 4** | Case unsolved - Goes cold, possible escalation |

### Lead Difficulty

Each lead has its own difficulty based on:
- Base investigation difficulty (1-10)
- Lead type (some leads harder than others)
- City type bonus (if matching)
- Crime index of city

---

## Resolution Mechanics

### Using the Universal Table

Investigations use the **same d100 + Column Shift system as combat**.

**The Roll:**
```
d100 + Column Shifts → Universal Table → Result
```

**Column Shifts come from:**
- Character's relevant skill (+1 to +3 CS)
- City type bonus (+1 to +2 CS if matching)
- Investigation method bonus (+0 to +3 CS)
- Faction method bonus (+1 to +4 CS for your faction's specialty)
- Crime Index modifier (-3 to +1 CS)
- Team bonus (+1 CS per additional investigator, max +3)

**Target Column:**
- Based on investigation difficulty (1-10 maps to column)
- Higher difficulty = harder column to hit

### Result Interpretation

| Roll Result | Investigation Outcome |
|-------------|----------------------|
| **White (Miss)** | No progress on this lead |
| **Green (Graze)** | Partial info - hint but not the full lead |
| **Yellow (Hit)** | Lead discovered - you got the info |
| **Red (Solid)** | Lead discovered + bonus intel |
| **Blue (Critical)** | Lead discovered + major bonus (contact, evidence, shortcut) |

---

## Investigation Flow

### Step 1: Receive Assignment (Email)

Your faction sends an email:
```
FROM: [Faction Handler]
SUBJECT: Assignment - [City Name]
PRIORITY: [Critical / High / Medium / Low]

[Description of the situation]

OPTIONS:
☐ Accept Assignment
☐ Decline Assignment
☐ Request More Information
```

- **Accept** - You're on the case, travel to city
- **Decline** - No penalty for Low/Medium, reputation hit for High/Critical
- **Request Info** - Delays but gives you more intel before deciding

### Step 2: Travel to City

- Character must physically travel to the city
- Travel time based on distance (see Travel_Time_System.csv)
- Character is unavailable during travel

### Step 3: Select Investigation Method

Choose how you'll investigate:

| Method | Modifier | Risk | Detection | Best For |
|--------|----------|------|-----------|----------|
| Covert Operation | +0 CS | Medium | Low | Stealth characters |
| Official Investigation | +1 CS | Low | High | Legal authority |
| Force Deployment | +3 CS | Very High | Very High | Quick resolution |
| Deep Cover | +2 CS | High | Very Low | Long-term intel |
| Street Contacts | +1 CS | Medium | Low | Criminal knowledge |
| Tech Surveillance | +2 CS | Low | Medium | Tech characters |
| Diplomatic Inquiry | +0 CS | Very Low | Medium | Political cases |

**Faction Bonuses:**
- **US**: Official +2, Tech Surveillance +3, Force +2
- **China**: Deep Cover +2, Tech Surveillance +3, Corporate +2
- **India**: Diplomatic +3, Spiritual +3, Medical +2
- **Nigeria**: Tribal Network +4, Street Contacts +2, Spiritual +2

### Step 4: Pursue Leads

For each lead (WHO/WHERE/WHAT/WHY):

1. **Declare which lead** you're pursuing
2. **Roll d100**
3. **Apply column shifts** (skills, city type, method, team)
4. **Check Universal Table** against lead difficulty
5. **Record result** (Miss / Partial / Success / Bonus)

**Time Cost:** Each lead attempt takes **1 game day**

### Step 5: Encounter Check

After each lead attempt, roll for **encounter**:

```
Encounter Chance = Base 10% + (Threat Level × 10%) + Detection Modifier

Example: Threat 3 investigation with High detection method
= 10% + 30% + 20% = 60% encounter chance
```

**If encounter triggers:**
- Combat begins on tactical map
- Enemies based on investigation type
- Survival lets you continue investigating
- Defeat = character hospitalized, investigation paused

### Step 6: Resolution

When you have enough leads OR time runs out:

**Calculate Final Result:**
```
Leads Found: X of 4
Time Remaining: Y days
Encounter Survived: Yes/No
Method Used: [Method]
```

**Outcome Table:**

| Leads | Time Left | Outcome |
|-------|-----------|---------|
| 4 | Any | **Perfect** - Full rewards, +2 faction standing |
| 3 | >50% | **Good** - Standard rewards, +1 faction standing |
| 3 | <50% | **Adequate** - Standard rewards, no standing change |
| 2 | Any | **Partial** - Half rewards, suspect may return |
| 1 | Any | **Weak** - Minimal rewards, likely retaliation |
| 0 | 0 | **Cold Case** - No rewards, case archived |

---

## Cold Cases

When time runs out with 0-1 leads:

### What Happens
- Case goes into **Cold Case Archive**
- No immediate rewards
- Situation may **escalate** (threat grows)
- Can be **reopened** later if new evidence appears

### Reopening Cold Cases
- Random event can trigger reopening
- Another investigation may connect
- Informant comes forward
- Same case, but difficulty +2

### Escalation
Failed investigations can make things worse:

| Original Threat | Escalates To | What Happens |
|-----------------|--------------|--------------|
| 1 | 2 | Criminal gets bolder |
| 2 | 3 | Gang war / More victims |
| 3 | 4 | City-wide crisis |
| 4 | 5 | National emergency |
| 5 | 5 (Cosmic) | Catastrophic event |

---

## Team Investigations

### Multiple Characters
- Up to **4 characters** can work one investigation
- Each additional character: **+1 CS** (max +3)
- Characters can **split leads** (each pursues different lead)
- If combat triggers, **all present characters fight**

### Why Team Up?
- Faster (parallel lead pursuit)
- Safer (more guns in combat)
- Better odds (stacking CS)

### Risk
- More characters exposed to danger
- If team wipes, all hospitalized
- Characters unavailable for other work

---

## Personal Investigations

Beyond faction assignments, characters can have **personal cases**:

### Triggered By:
- **Personality** - Protective types investigate threats to loved ones
- **Origin** - Altered humans investigate the lab that made them
- **Events** - Character's contact murdered, they want answers
- **Backstory** - Cold case from their past resurfaces

### Differences from Faction Work:
- No faction standing reward
- Personal motivation (Karma bonus?)
- May conflict with faction goals
- Can be pursued during downtime

---

## City Integration

### Crime Index Effects

| Crime Index | Effect |
|-------------|--------|
| Very Low (0-20) | +1 CS all investigations, harder to find criminals |
| Low (21-40) | No modifier |
| Moderate (41-60) | -1 CS official methods, +1 CS street methods |
| High (61-80) | -2 CS official, +2 CS street, combat more likely |
| Very High (81-100) | -3 CS official, +3 CS street, constant combat risk |

### Population Effects

| Population | Effect |
|------------|--------|
| Village | +2 CS stealth, -2 CS resources, limited backup |
| Small Town | +1 CS stealth, -1 CS resources |
| Town | No modifier |
| City | -1 CS stealth, +1 CS resources |
| Large City | -2 CS stealth, +2 CS resources |
| Mega City | -3 CS stealth, +3 CS resources, multiple ops possible |

---

## Skills That Help Investigations

| Skill | Bonus | Best For |
|-------|-------|----------|
| Detective | +2 CS | All investigations |
| Streetwise | +2 CS | Criminal, Gang cases |
| Forensics | +2 CS | Murder, Evidence analysis |
| Hacking | +2 CS | Corporate, Tech cases |
| Interrogation | +2 CS | WHO leads |
| Stealth | +2 CS | Covert methods |
| Medicine | +2 CS | Biological cases |
| Research | +2 CS | Academic, Historical cases |

---

## Powers That Help Investigations

| Power | Bonus | Use |
|-------|-------|-----|
| Telepathy | +4 CS | Information gathering, WHO leads |
| Invisibility | +3 CS | Covert operations |
| Super Speed | +2 CS | Time-sensitive cases |
| Technopathy | +4 CS | Digital investigations |
| Time Travel | +5 CS | Historical investigations |
| Enhanced Senses | +2 CS | Evidence detection |
| Flight | +2 CS | Surveillance, WHERE leads |

---

## Quick Reference

### Investigation Checklist
1. ☐ Receive email assignment
2. ☐ Accept/Decline
3. ☐ Travel to city
4. ☐ Select method
5. ☐ Pursue WHO lead (roll)
6. ☐ Encounter check
7. ☐ Pursue WHERE lead (roll)
8. ☐ Encounter check
9. ☐ Pursue WHAT lead (roll)
10. ☐ Encounter check
11. ☐ Pursue WHY lead (roll)
12. ☐ Encounter check
13. ☐ Resolve case

### Column Shift Summary
```
Base: Investigation Difficulty (Column)
+ Skill bonus (+1 to +3)
+ City type match (+1 to +2)
+ Method bonus (+0 to +3)
+ Faction specialty (+1 to +4)
+ Team bonus (+1 per ally, max +3)
+ Crime index modifier (-3 to +3)
= Final Column Shift
```

### Time Summary
- Each lead attempt: 1 day
- Travel: varies by distance
- Time limit: set per investigation
- Cold case: when time hits 0

---

## Related Files

| File | Contents |
|------|----------|
| Investigation_Templates.csv | 25 investigation types |
| Investigation_Methods.csv | 25 methods with modifiers |
| Investigation_Consequences.csv | 37 outcome types |
| Email_Investigation_Templates.csv | Email formats |
| City_Type_Effects.csv | City bonuses |
| Universal_Table.csv | Resolution table |

---

*Last Updated: 2024-12-05*
*Version: 1.0*
