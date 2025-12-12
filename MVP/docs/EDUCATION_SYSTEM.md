# Education & Training System

## Overview

The Education System determines where characters can get educated/trained, what degrees and skills they can acquire, and how education unlocks careers. Like Healthcare, education quality depends on **both the country AND the specific city**.

---

## Country Education Rating (0-100)

Every country has a `higherEducation` stat that determines baseline education quality:

| Rating | Best Available | Quality |
|--------|----------------|---------|
| 80+ | Elite University (Ivy League) | World-class |
| 65+ | Research University | Graduate programs |
| 50+ | Standard University | Bachelor's degrees |
| 40+ | Community College | Associate's degrees |
| 30+ | Trade School | Vocational training |
| 20+ | High School | Secondary education |
| < 20 | Elementary only | Basic literacy |

### Country Examples

**Elite (80+)**: USA, UK, Germany, Japan, Australia, Canada
**Research (65-79)**: France, Italy, South Korea, China, India
**University (50-64)**: Brazil, Mexico, Argentina, Turkey
**Trade (30-49)**: Nigeria, Egypt, Indonesia, Philippines

---

## City Education (Not Every City Has a University!)

Just like hospitals, universities aren't everywhere. City education depends on:

1. **Population size**
2. **City type** (Educational, Political, Industrial, Military)
3. **Country's education rating**

### Facility Requirements

| Facility | Min Population | City Type Required | Min Country Education |
|----------|----------------|-------------------|----------------------|
| Elementary School | 1,000 | Any | 10 |
| High School | 5,000 | Any | 20 |
| Trade School | 25,000 | Any | 30 |
| Community College | 50,000 | Any | 40 |
| University | 100,000 | Educational or Political | 50 |
| Research University | 250,000 | Educational | 65 |
| **Elite University** | 500,000 | Educational + Political | 80 |
| Military Academy | 50,000 | **Military** | 40 |
| Intelligence Academy | 1,000,000 | Political or Military | 60 |
| Medical School | 250,000 | Educational | 70 |
| Law School | 200,000 | Educational or Political | 60 |
| Engineering School | 150,000 | Educational or Industrial | 55 |

---

## Education Levels

### Civilian Education Path

```
Elementary (6 years, age 6+)
    ↓
High School (6 years, age 12+, INT 8+)
    ↓
┌─────────────────┼─────────────────┐
↓                 ↓                 ↓
Trade School   Associate's    Bachelor's
(2 years)      (2 years)      (4 years)
INT 10+        INT 12+        INT 15+
    │              │               ↓
    │              │          Master's
    │              │          (2 years)
    │              │          INT 20+
    │              │               ↓
    └──────────────┴──────────> Doctorate
                               (5 years)
                               INT 30+
                                   ↓
                              Post-Doctoral
                               (3 years)
                               INT 35+
```

### Military Education Path

```
Military Basic (6 months, age 18+, STA 12+)
    ↓
Military Advanced (2 years, STA 15+, MEL 15+)
    ↓
Military Special Forces (2 years, STA 20+, MEL 20+, AGL 20+)
```

### Intelligence Path

```
High School → Intelligence Training (3 years, INT 20+, INS 20+)
```

---

## What Education Unlocks

### Career Ranks

| Education | Career Ranks Unlocked |
|-----------|----------------------|
| None / Elementary | Rank 1 only |
| High School | Rank 1-2 |
| Trade / Associate | Rank 1-2 |
| Bachelor's | Rank 1-3 |
| Master's | Rank 1-4 |
| Doctorate | Rank 1-5 |
| Military Advanced | Rank 1-3 |
| Military Special | Rank 1-4 |

### Stat Bonuses

| Education | INT Bonus | INS Bonus | Other |
|-----------|-----------|-----------|-------|
| High School | +2 | +1 | - |
| Bachelor's | +4 | +2 | +2CS Specialty |
| Master's | +5 | +3 | +3CS Specialty, +2CS Research |
| Doctorate | +7 | +4 | +4CS Specialty, +3CS Research |
| Military Special | +2 | +4 | +3CS Combat, +3CS Tactics |
| Intelligence | +3 | +5 | +3CS Espionage |

### Research Capabilities

| Education | Research Access |
|-----------|----------------|
| Trade School | Basic Tech only |
| Associate | Basic |
| Bachelor's | Intermediate |
| Master's | Advanced |
| Doctorate | Expert |
| Post-Doctoral | **Cutting Edge** |

---

## Short-Term Training Programs

For skills that don't require full degrees:

| Program | Duration | Cost | Skills Granted |
|---------|----------|------|----------------|
| Basic Firearms | 7 days | $500 | Shooting +1CS |
| First Aid | 3 days | $200 | First_Aid +2CS |
| EMT Certification | 30 days | $1,500 | Medicine +1CS |
| Martial Arts Basic | 30 days | $300 | Martial_Arts +1CS |
| Driving Course | 7 days | $500 | Driving +2CS |
| Pilot License | 60 days | $15,000 | Pilot +2CS |
| Hacking Basics | 30 days | $2,000 | Hacking +1CS |
| Demolitions | 21 days | $5,000 | Demolitions +3CS |
| Sniper School | 60 days | Military | Sniper +3CS |
| Language Immersion | 90 days | $5,000 | Languages +2CS |

---

## Enrollment System

### Requirements to Enroll

1. **Age requirement** - Most programs have minimum age
2. **Prerequisite education** - Must complete lower levels first
3. **Stat requirements** - INT, STA, etc.
4. **Facility availability** - City must have the right facility

### Enrollment Process

1. Check if city has required facility
2. Check if character meets requirements
3. Pay tuition (or get faction scholarship)
4. Attend classes (track attendance)
5. Complete required credits
6. Graduate!

### Time to Complete

Base time can be reduced by high INT:
- Each point of INT above 15 = 1% faster graduation
- Maximum 20% faster

---

## Practical Examples

### Small Nigerian Town (Pop: 50,000, Education: 67)

**Available**: Elementary, High School, Community College
**NOT Available**: University, Medical School, etc.

→ Character must travel to Lagos or Abuja for university education

### Boston, USA (Pop: 700,000, Educational + Political)

**Available**: Everything including Elite University (Harvard/MIT)
**Specializations**: All fields, world-class quality

→ Best place for advanced education and research

### Military Base in Germany (Pop: 100,000, Military)

**Available**: High School, Military Academy, Trade School
**NOT Available**: University (wrong city type)

→ Great for military training, need to travel for civilian degrees

---

## Cost Examples

| Program | Duration | Cost | Faction Scholarship? |
|---------|----------|------|---------------------|
| High School | 6 years | Free | N/A |
| Trade School | 2 years | $4,000/year | 50% possible |
| Community College | 2 years | $6,000/year | 75% possible |
| University | 4 years | $30,000/year | Full possible |
| Medical School | 5 years | $100,000/year | Full possible |
| Military Academy | 4 years | **Free** | Military funded |
| Intelligence Training | 3 years | **Free** | Faction funded |

---

## Code Reference

Main file: `MVP/src/data/educationSystem.ts`

Key functions:
- `getCityEducation(population, cityTypes, countryEducation, countryName, cityName)` - What's available in a city
- `canEnroll(stats, age, currentEducation, targetLevel)` - Check enrollment eligibility
- `calculateEducationTime(level, INT)` - How long will it take

Key types:
- `EducationLevel` - Degrees and training levels
- `EducationFacility` - Schools and universities
- `TrainingProgram` - Short-term skill training
- `Enrollment` - Character's enrollment status
