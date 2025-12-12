# Healthcare & Medical System

## Overview

The Healthcare System determines where characters can receive medical treatment, how fast they recover from injuries, and what level of care is available. Healthcare quality depends on **both the country AND the specific city**.

---

## Country Healthcare Rating (0-100)

Every country has a `healthcare` stat that determines the baseline quality of medical care:

| Rating | Level | Recovery Speed | Surgery? | Prosthetics? |
|--------|-------|----------------|----------|--------------|
| 90+ | Elite Hospital | 2x faster | Yes | Yes |
| 70-89 | Advanced Hospital | 1.5x | Yes | No |
| 50-69 | Basic Hospital | 1x (normal) | Yes | No |
| 30-49 | Clinic | 0.75x | No | No |
| 10-29 | Field Medicine | 0.5x | No | No |
| < 10 | None | 0.25x | No | No |

### Country Examples

**Elite (90+)**: Australia, Belgium, Canada, Germany, Ireland, Israel
**Advanced (70-89)**: Japan, France, Italy, Argentina, Brazil, Mexico
**Basic (50-69)**: India, China, Algeria, Egypt, Iran
**Clinic (30-49)**: Nigeria, Ethiopia, Iraq, Mozambique, Angola, Congo

---

## City Healthcare (Not Every City Has a Hospital!)

Just because a country has good healthcare doesn't mean every city has a hospital. City healthcare depends on:

1. **Population size**
2. **City type** (Political, Military, Educational, etc.)
3. **Country's base healthcare rating**

### Population Thresholds

| Population | Hospital Availability |
|------------|----------------------|
| 500,000+ | **Guaranteed** - Mega cities always have hospitals |
| 100,000+ | **Likely** - If city type supports it |
| 50,000+ | **Possible** - Only with right city type AND good country healthcare |
| 10,000+ | **Clinic Only** - No surgery available |
| < 10,000 | **None or Field** - Better hope you have a medic |

### City Types That Have Hospitals

**Always Have Hospital** (if population supports):
- `Political` - Capitals and government centers
- `Educational` - University cities (medical schools)
- `Military` - Military bases have medical facilities

**Sometimes Have Hospital** (need 50+ country healthcare):
- `Industrial` - Large factories need worker healthcare
- `Seaport` - Major ports have medical facilities

**Rarely Have Hospital**:
- `Mining` - Remote, clinic at best
- `Resort` - Tourist areas, clinic only
- `Temple` - Religious sites, traditional medicine
- `Company` - Company towns, basic clinic

---

## Practical Examples

### Nigeria (Healthcare: 35)

| City | Population | Type | Medical Care |
|------|------------|------|--------------|
| Lagos | 15,000,000 | Mega City | Basic Hospital (capped by country) |
| Abuja | 3,000,000 | Political | Basic Hospital |
| Kano | 500,000 | Industrial | Clinic only |
| Small village | 5,000 | Mining | **NO MEDICAL CARE** |

**Scenario**: Character loses arm in Nigerian mining town → Must travel to Lagos or Abuja for surgery. Even then, no prosthetics available (need elite hospital).

### Germany (Healthcare: 90)

| City | Population | Type | Medical Care |
|------|------------|------|--------------|
| Berlin | 3,500,000 | Political | **Elite Hospital** (prosthetics!) |
| Munich | 1,500,000 | Educational | Advanced Hospital |
| Small town | 15,000 | None | Clinic |

**Scenario**: Character loses arm in small German town → Local clinic stabilizes, then transfer to Berlin for elite care and cybernetic prosthetic.

---

## Recovery System

### Recovery Time Formula

```
Recovery Days = Base Days / (Care Multiplier + Doctor Bonus)
```

- **Base Days**: From injury type (broken arm = 56 days)
- **Care Multiplier**: From medical care level (elite = 2.0x)
- **Doctor Bonus**: +10% per +1CS Medicine skill

### Example: Broken Arm (56 base days)

| Location | Care Level | Doctor | Recovery Time |
|----------|------------|--------|---------------|
| Field | 0.5x | None | 112 days |
| Clinic | 0.75x | None | 75 days |
| Basic Hospital | 1.0x | None | 56 days |
| Advanced Hospital | 1.5x | None | 38 days |
| Elite Hospital | 2.0x | None | 28 days |
| Elite + Doctor (+3CS) | 2.3x | +3CS | 24 days |

---

## Base Medical Facilities

Player bases can have their own medical facilities:

### Base Infirmary (requires Medical_Lab facility)

- Base recovery speed: 1.0x (modified by doctor)
- Max treatable severity: Severe (upgradeable)
- Surgery: No (requires upgrade)
- Requires: Doctor on team (MED career)

### Doctor Skill Bonuses

| Doctor's Medicine Skill | Recovery Bonus |
|------------------------|----------------|
| +1CS | +10% faster |
| +2CS | +20% faster |
| +3CS | +30% faster |
| +4CS | +40% faster |
| +5CS | +50% faster |

---

## Treatment Requirements by Injury Severity

| Severity | Treatment Needed | Where Available |
|----------|-----------------|-----------------|
| Minor | Rest | Anywhere |
| Moderate | First Aid | Field+ |
| Severe | Medical | Clinic+ |
| Critical | Surgery | Hospital only |
| Permanent | Prosthetic/Regeneration | Elite Hospital only |

---

## Prosthetics

Only available at **Elite Hospitals** (country healthcare 90+):

### Prosthetic Types

| Type | Function % | Cost | Special |
|------|-----------|------|---------|
| Wooden Leg | 40% | $500 | Basic, -3 movement |
| Hook Hand | 30% | $300 | Can use as weapon |
| Modern Prosthetic Leg | 75% | $15,000 | -1 movement |
| Modern Prosthetic Arm | 60% | $25,000 | -1 STR |
| Cybernetic Leg | 120% | $250,000 | +2 movement, requires research |
| Cybernetic Arm | 130% | $300,000 | +5 STR, requires research |
| Cybernetic Eye | 150% | $200,000 | Zoom, night vision, HUD |

---

## Status Effects (Medical)

Characters can have persistent medical status effects:

- **Bleeding** (Light/Moderate/Severe) - Health loss per turn
- **Poisoned** (Light/Severe) - Health loss + penalties
- **Diseased** - Long-term stat penalties
- **Radiation Sickness** - Progressive damage
- **Hospitalized** - Cannot do missions
- **Critical Condition** - On life support
- **Dying** - 3 turns to stabilize or death

---

## Code Reference

Main file: `MVP/src/data/characterStatusSystem.ts`

Key functions:
- `getCountryMedicalCareLevel(healthcareRating)` - Get care level from country rating
- `getCityHealthcare(population, cityTypes, countryHealthcare, countryName, cityName)` - Full city healthcare info
- `calculateRecoveryTime(injury, careLevel, doctorSkillBonus)` - Calculate actual recovery days
- `canTreatInjury(injury, careLevel)` - Check if injury can be treated at location

Key types:
- `MedicalCareLevel` - Hospital/clinic capabilities
- `CityHealthcareInfo` - City-specific medical info
- `Injury` - Injury definition with recovery requirements
- `CharacterHealthStatus` - Character's current medical state
