# Character Creator Screen Specification

## Overview
A full-featured character creation interface for building custom combatants with stats, origin, powers, equipment, and personality.

---

## SCREEN LAYOUT

```
┌────────────────────────────────────────────────────────────────────────────┐
│  ⚔️ CHARACTER CREATOR                                    [SAVE] [CANCEL]  │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─────────────────┐  ┌──────────────────────────────────────────────────┐ │
│  │                 │  │  SECTION TABS                                    │ │
│  │    PREVIEW      │  │  [Identity] [Stats] [Origin] [Equipment] [AI]   │ │
│  │                 │  ├──────────────────────────────────────────────────┤ │
│  │   [Character    │  │                                                  │ │
│  │    Sprite]      │  │        ACTIVE SECTION CONTENT                    │ │
│  │                 │  │                                                  │ │
│  │  Name: ______   │  │        (changes based on selected tab)           │ │
│  │  Codename: ___  │  │                                                  │ │
│  │  Team: Heroes   │  │                                                  │ │
│  │                 │  │                                                  │ │
│  │  ───────────    │  │                                                  │ │
│  │  THREAT: ⭐⭐⭐   │  │                                                  │ │
│  │  (Level 3)      │  │                                                  │ │
│  │                 │  │                                                  │ │
│  └─────────────────┘  └──────────────────────────────────────────────────┘ │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  STAT SUMMARY BAR (always visible)                                   │  │
│  │  HP: 100 | AP: 6 | Move: 6 | Accuracy: +0 | DR: 8 | Threat: Level 3  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## SECTION 1: IDENTITY TAB

### What It Shows
Basic character information and team assignment.

### Fields

| Field | Type | Description |
|-------|------|-------------|
| **Name** | Text Input | Real name (e.g., "Marcus Stone") |
| **Codename** | Text Input | Hero/villain name (e.g., "Ironclad") |
| **Team** | Dropdown | `Heroes`, `Villains`, `Mercenary`, `Civilian` |
| **Secret Identity** | Toggle | Does public know their real name? |
| **Backstory** | Text Area | 2-3 sentence background (optional) |

### Display Elements
- Character portrait/sprite preview (updates based on origin)
- Team color indicator (Blue/Red/Yellow/Grey)

---

## SECTION 2: STATS TAB

### What It Shows
Primary attributes and their derived secondary stats.

### PRIMARY STATS (Player Assigns Points)

| Stat | Abbrev | Range | Description |
|------|--------|-------|-------------|
| **Strength** | STR | 10-80 | Physical power, melee damage bonus |
| **Agility** | AGL | 10-80 | Speed, dodge, accuracy |
| **Endurance** | END | 10-80 | Stamina, HP bonus, resistance |
| **Reasoning** | RSN | 10-80 | Tactics, investigation, tech use |
| **Intuition** | INT | 10-80 | Awareness, perception, reaction |
| **Psyche** | PSY | 10-80 | Willpower, mental resistance, powers |

### Point Buy System
- **Total Points**: 200 (for balanced) or 250 (for supers)
- **Minimum per stat**: 10
- **Maximum per stat**: 80 (without origin bonuses)
- Slider or +/- buttons for each stat
- Shows points remaining

### SECONDARY STATS (Auto-Calculated)

| Stat | Formula | Example |
|------|---------|---------|
| **HP** | 50 + (END × 1.5) + Origin Bonus | 50 + 45 + 0 = 95 |
| **Max AP** | 4 + (AGL / 20) | 4 + 2 = 6 |
| **Movement** | 4 + (AGL / 20) | 4 + 2 = 6 tiles |
| **Initiative** | (AGL + INT) / 2 | 35 |
| **Melee Damage Bonus** | STR / 10 | +4 damage |
| **Dodge Bonus** | AGL / 20 | +2 CS |
| **Mental Resistance** | PSY / 20 | +2 CS |

### UI Elements
```
┌─────────────────────────────────────────────────────┐
│  PRIMARY STATS                    Points: 47/200   │
├─────────────────────────────────────────────────────┤
│  💪 STR  [←] ████████████░░░░░░ 45 [→]  Melee +4   │
│  🏃 AGL  [←] ██████████░░░░░░░░ 35 [→]  Dodge +1   │
│  ❤️ END  [←] ████████████████░░ 55 [→]  HP +82     │
│  🧠 RSN  [←] ██████░░░░░░░░░░░░ 25 [→]  Tech +1    │
│  👁️ INT  [←] ████████░░░░░░░░░░ 30 [→]  Init +32   │
│  🔮 PSY  [←] ██████████████░░░░ 50 [→]  Mental +2  │
├─────────────────────────────────────────────────────┤
│  DERIVED STATS                                      │
│  ❤️ HP: 132    ⚡ AP: 5    🦶 Move: 5    ⚔️ Init: 32  │
└─────────────────────────────────────────────────────┘
```

---

## SECTION 3: ORIGIN TAB

### What It Shows
Character's power source and innate abilities.

### ORIGIN SELECTION (9 Types)

| Origin | Emoji | HP Mod | Special Trait |
|--------|-------|--------|---------------|
| **Skilled Human** | 🧑 | +0 | +10% Accuracy, +5% Evasion |
| **Altered Human** | 🧬 | +10 | One enhanced stat (+10) |
| **Mutant** | 🧪 | +5 | Random minor power |
| **Tech Enhanced** | 🦾 | +20 | EMP Vulnerable, +DR |
| **Mystic** | 🔮 | -10 | Energy damage +20% |
| **Alien** | 👽 | +15 | Unusual resistances |
| **Construct** | 🤖 | +50 | Immune: Bleed, Poison, Stun |
| **Divine** | 👼 | +10 | Immune: Burn, Freeze, Poison |
| **Cosmic** | ✨ | +0 | Immune: All except EMP |

### IMMUNITIES/VULNERABILITIES DISPLAY
```
┌─────────────────────────────────────────────────────┐
│  ORIGIN: 🤖 Construct                               │
├─────────────────────────────────────────────────────┤
│  "Artificial being - machine or magical creation"  │
│                                                     │
│  ✅ IMMUNE TO:                                      │
│     🩸 Bleeding  🔥 Burning  ☠️ Poison  ⚡ Stun      │
│                                                     │
│  ❌ VULNERABLE TO:                                  │
│     📡 EMP (+30 damage)                             │
│                                                     │
│  📊 STAT MODIFIERS:                                 │
│     +50 HP                                          │
└─────────────────────────────────────────────────────┘
```

### AVAILABLE POWERS (Based on Origin)
Each origin unlocks certain power categories:

| Origin | Power Categories Available |
|--------|---------------------------|
| Skilled Human | None (equipment only) |
| Altered Human | 1 Physical Enhancement |
| Mutant | 1-2 from any category |
| Tech Enhanced | Tech powers, gadgets |
| Mystic | Magic, Energy Emission |
| Alien | Varies wildly |
| Construct | Tech, Physical |
| Divine | Energy, Healing, Defense |
| Cosmic | Any (but limited charges) |

---

## SECTION 4: EQUIPMENT TAB

### What It Shows
Weapon and armor selection.

### WEAPON SELECTION

| Category | Weapons |
|----------|---------|
| **Sidearms** | Pistol, SMG |
| **Rifles** | Assault Rifle, Sniper Rifle, Shotgun |
| **Energy** | Beam, Wide Beam, Plasma Rifle, Ice Rifle, EMP Gun |
| **Melee** | Fists, Sword, Super Punch |
| **Heavy** | Rocket Launcher, Minigun (if available) |

### Weapon Card Display
```
┌──────────────────────────────────────┐
│  🔫 ASSAULT RIFLE                    │
├──────────────────────────────────────┤
│  Damage: 25        Range: 8          │
│  AP Cost: 2        Accuracy: +0      │
│  Armor Pen: 2      Knockback: 0      │
│                                      │
│  Type: Kinetic     Sound: 160 dB     │
│  Ammo: 30 rounds   Reload: 3 AP      │
└──────────────────────────────────────┘
```

### ARMOR SELECTION

| Armor | DR | Energy DR | Notes |
|-------|----|-----------| ------|
| None | 0 | 0 | Civilian clothes |
| Kevlar | 6 | 3 | Standard protection |
| Tactical | 8 | 4 | Military grade |
| Combat | 12 | 6 | Heavy armor |
| Power | 18 | 12 | Powered exosuit |
| Mystic Ward | 5 | 15 | Magic protection |
| Alien Hide | 14 | 14 | Organic armor |

### Armor Card Display
```
┌──────────────────────────────────────┐
│  🎽 TACTICAL ARMOR                   │
├──────────────────────────────────────┤
│  Physical DR: 8    Energy DR: 4      │
│  Movement: -0      Stealth: -1       │
│                                      │
│  "Military-grade ballistic vest      │
│   with ceramic plate inserts"        │
└──────────────────────────────────────┘
```

### GADGET SLOTS (Optional)
- Slot 1: Grenade type
- Slot 2: Utility item
- Slot 3: Special equipment

---

## SECTION 5: EDUCATION & CAREER TAB

### What It Shows
Character's professional background, skills, and career progression.

### CAREER CATEGORIES (7 Types)

| Code | Category | Key Skills |
|------|----------|------------|
| 1 | **Medical & Life Sciences** | Forensics, Healing, Chemistry, Radiation |
| 2 | **Visual & Performance Arts** | Bluff, Spying, Media Manipulation, Disguise |
| 3 | **Liberal Arts** | General Education, Politics, Communication |
| 4 | **Engineering/Tech** | Mechanics, Computers, Hacking, Weapons |
| 5 | **Business** | Finance, Corporate, Negotiations, Resources |
| 6 | **Psychology** | Interrogation, Mental Skills, Manipulation |
| 7 | **Physical/Vocational** | Combat Training, Athletics, Fieldwork |

### RANK BRACKETS (5 Levels)

Each career has 5 progression ranks with specific jobs:

**Example: Engineering/Tech (Category 4)**

| Rank | Jobs | Skill Bonus |
|------|------|-------------|
| 1 | IT Technician, Motor Mechanic | +5% Tech |
| 2 | Architect, Web Developer | +10% Tech |
| 3 | Software Dev, Cyber-Security, Hacker, Weapon Designer | +15% Tech, +5% Investigation |
| 4 | AI Researcher, Robotics Engineer, Aerospace Engineer | +20% Tech, +10% Investigation |
| 5 | Rocket Scientist, Nuclear Physicist | +25% Tech, +15% Investigation |

**Example: Medical & Life Sciences (Category 1)**

| Rank | Jobs | Skill Bonus |
|------|------|-------------|
| 1 | Clinical Physician, Vet, Botanist, Pharmacist | +5% Healing |
| 2 | Radiologist, Surgeon | +10% Healing, +5% Forensics |
| 3 | Neurosurgeon, Pharmaceutical Researcher | +15% Healing, +10% Forensics |
| 4 | Virology Researcher, Biotech Researcher | +20% Healing, +15% Forensics |
| 5 | Mutagenics Researcher | +25% Healing, +20% Forensics, Power Creation |

**Example: Psychology (Category 6)**

| Rank | Jobs | Skill Bonus |
|------|------|-------------|
| 1 | School Counselor, Priest, Fortune Teller | +5% Interrogation |
| 2 | Psychiatrist | +10% Interrogation, +5% Mental Resistance |
| 3 | Criminal Psychologist, Cult Leader | +15% Interrogation, +10% Manipulation |
| 4 | Psionics Researcher | +20% Mental Skills, Psionic Access |
| 5 | Wizard | +25% Mental, Magic Access |

### CAREER SELECTION UI
```
┌─────────────────────────────────────────────────────────────────┐
│  EDUCATION & CAREER                                             │
├─────────────────────────────────────────────────────────────────┤
│  Category: [Engineering/Tech ▼]                                 │
│                                                                 │
│  Career Rank: ●●●○○ (Rank 3)                                    │
│                                                                 │
│  Current Job: [Cyber-Security Consultant ▼]                     │
│                                                                 │
│  ───────────────────────────────────────────────────────────    │
│  SKILL BONUSES FROM CAREER:                                     │
│                                                                 │
│  🔧 Tech Use: +15%                                              │
│  🔍 Investigation: +5%                                          │
│  💻 Hacking: +10%                                               │
│  🔫 Weapon Knowledge: +5%                                       │
│                                                                 │
│  ───────────────────────────────────────────────────────────    │
│  UNLOCKED ABILITIES:                                            │
│                                                                 │
│  ✅ Can disable security systems                                │
│  ✅ Can identify tech weaknesses                                │
│  ✅ Can craft EMP devices                                       │
│  ❌ Cannot perform surgery (need Medical rank 2+)               │
└─────────────────────────────────────────────────────────────────┘
```

### CAREER AFFECTS GAMEPLAY

| Career Category | Combat Bonus | Investigation Bonus | Special Unlock |
|-----------------|--------------|---------------------|----------------|
| Medical | Healing items +50% effective | Forensics, Autopsy | Create drugs/antidotes |
| Arts | Bluff +20%, Disguise +20% | Media analysis | Forgery, Propaganda |
| Liberal Arts | Negotiation +15% | Research, Politics | Political connections |
| Engineering | Tech weapons +10% damage | Hack, Tech analysis | Craft gadgets |
| Business | Resources +25% | Financial investigation | Bribery, Funding |
| Psychology | Interrogation +20% | Profiling | Manipulation, Psionics |
| Physical | Combat +10%, Athletics +15% | Surveillance | Tactical training |

### MULTIPLE CAREERS (Optional)
Characters can have experience in multiple fields:
- Primary Career: Full bonuses
- Secondary Career: Half bonuses (max Rank 3)

---

## SECTION 6: AI/PERSONALITY TAB

### What It Shows
Combat behavior and decision-making style.

### PERSONALITY SELECTION (20 Types)

| Personality | Emoji | Combat Style |
|-------------|-------|--------------|
| **Aggressive** | 😠 | Attacks nearest, charges in |
| **Calculating** | 🧠 | Optimal target selection |
| **Protective** | 🛡️ | Defends allies, draws fire |
| **Sadistic** | 😈 | Targets wounded, overkill |
| **Tactical** | 🎯 | Threat prioritization |
| **Sniper** | 🔭 | Picks off wounded from range |
| **Bloodthirsty** | 🩸 | Finishes kills, ignores threats |
| **Cautious** | 😰 | Stays in cover, retreats when hurt |
| **Berserker** | 🔥 | All-out attack, ignores defense |
| **Cold** | 🧊 | Emotionless efficiency |
| **Opportunist** | 🦊 | Adapts to situation |
| **Honorable** | ⚔️ | Fair fights, no cheap shots |
| **Cunning** | 🐍 | Flanking, ambushes |
| **Reckless** | 💀 | High risk, high reward |
| **Methodical** | 📋 | Systematic elimination |
| **Vengeful** | 💢 | Targets whoever hurt them |
| **Cowardly** | 🐔 | Runs when outnumbered |
| **Heroic** | 🦸 | Protects civilians, self-sacrifice |
| **Predatory** | 🐺 | Isolates and hunts weak targets |
| **Professional** | 💼 | Efficient, no emotion |

### Personality Card Display
```
┌──────────────────────────────────────┐
│  🧠 CALCULATING                      │
├──────────────────────────────────────┤
│  "Analyzes battlefield for optimal   │
│   target selection and positioning"  │
│                                      │
│  TARGET PRIORITY:                    │
│   1. Highest threat score            │
│   2. Best damage opportunity         │
│   3. Tactical advantage              │
│                                      │
│  BEHAVIOR:                           │
│   • Takes cover when available       │
│   • Repositions for better shots     │
│   • Focuses fire on one target       │
│                                      │
│  WIN RATE: 55% (in simulations)      │
└──────────────────────────────────────┘
```

---

## SECTION 6: POWERS TAB (If Origin Allows)

### What It Shows
Supernatural abilities based on origin.

### Power Categories
- **Physical Enhancement**: Super Strength, Speed, Durability
- **Energy Emission**: Beams, Fire, Ice, Electricity
- **Mental**: Telepathy, Telekinesis, Psychic Blast
- **Defensive**: Force Field, Regeneration, Absorption
- **Travel**: Flight, Teleport, Super Speed
- **Alteration**: Invisibility, Shape-Shift, Phasing

### Power Selection UI
```
┌──────────────────────────────────────────────────────┐
│  AVAILABLE POWERS (Pick up to 2)                     │
├──────────────────────────────────────────────────────┤
│  ☑️ 💪 SUPER STRENGTH                                │
│     +30 melee damage, throw objects, knockback +2    │
│     Passive ability (always active)                  │
│                                                      │
│  ☐ 🛡️ FORCE FIELD                                   │
│     Project 3x3 barrier, blocks 50 damage            │
│     Active: 3 AP, 3 charges per battle               │
│                                                      │
│  ☐ ⚡ ENERGY BOLT                                    │
│     Ranged attack, 35 damage, 8 range                │
│     Active: 3 AP, uses energy pool                   │
│                                                      │
│  ☐ 🦅 FLIGHT                                         │
│     Ignore ground terrain, +2 vs ground melee        │
│     Toggle: 1 AP to activate/deactivate              │
└──────────────────────────────────────────────────────┘
```

---

## THREAT LEVEL (Auto-Calculated)

### Formula
```
Threat Points =
  (Average Primary Stats / 10) +
  (HP / 25) +
  (Weapon Damage / 10) +
  (Armor DR / 5) +
  (Number of Powers × 5) +
  (Origin Bonus)

Origin Bonuses:
  Skilled Human: +0
  Altered Human: +2
  Mutant: +3
  Tech Enhanced: +4
  Mystic: +4
  Alien: +5
  Construct: +6
  Divine: +6
  Cosmic: +8
```

### Threat Levels

| Level | Points | Stars | Description |
|-------|--------|-------|-------------|
| Alpha | 0-10 | - | Civilian, no threat |
| Level 1 | 11-20 | ⭐ | Street-level |
| Level 2 | 21-35 | ⭐⭐ | Professional |
| Level 3 | 36-50 | ⭐⭐⭐ | Enhanced |
| Level 4 | 51-70 | ⭐⭐⭐⭐ | Super-powered |
| Level 5 | 71+ | ⭐⭐⭐⭐⭐ | World-class threat |

### Display
```
┌─────────────────────────────────┐
│  THREAT ASSESSMENT              │
│                                 │
│  ⭐⭐⭐⭐ LEVEL 4                  │
│  "Super-powered combatant"      │
│                                 │
│  Threat Score: 58               │
│  ├─ Stats: 24                   │
│  ├─ Combat: 18                  │
│  ├─ Powers: 10                  │
│  └─ Origin: 6                   │
└─────────────────────────────────┘
```

---

## PREVIEW PANEL (Always Visible)

### What It Shows
Live preview of the character as you build them.

### Elements
```
┌─────────────────────┐
│      [SPRITE]       │  ← Updates based on origin/armor
│        🤖           │
│                     │
│  "TERMINUS"         │  ← Codename
│  UNIT-7             │  ← Real name (if shown)
│                     │
│  🔴 VILLAINS        │  ← Team with color
│                     │
│  ─────────────────  │
│  ⭐⭐⭐⭐ Level 4      │  ← Threat level
│                     │
│  Origin: Construct  │
│  Weapon: Beam       │
│  Armor: Combat      │
│                     │
│  ─────────────────  │
│  HP: 150  AP: 6     │
│  Move: 5  DR: 12    │
└─────────────────────┘
```

---

## BOTTOM SUMMARY BAR (Always Visible)

Quick reference stats that update in real-time:

```
┌────────────────────────────────────────────────────────────────────────┐
│ ❤️ HP: 150 │ ⚡ AP: 6 │ 🦶 Move: 5 │ 🎯 Acc: +0 │ 🛡️ DR: 12 │ ⭐ Lvl: 4 │
└────────────────────────────────────────────────────────────────────────┘
```

---

## ACTION BUTTONS

| Button | Action |
|--------|--------|
| **SAVE** | Save character to roster |
| **CANCEL** | Discard and close |
| **RANDOMIZE** | Generate random character |
| **LOAD TEMPLATE** | Load from sample_characters.json |
| **EXPORT** | Copy JSON to clipboard |
| **IMPORT** | Paste JSON to load |

---

## VALIDATION RULES

Before saving, check:
1. Name and Codename are not empty
2. All stat points are allocated
3. Weapon is selected
4. No conflicting choices (e.g., Skilled Human with 3 powers)
5. Threat level calculated

### Error Display
```
⚠️ Cannot save:
 • Codename is required
 • 23 stat points remaining
 • No weapon selected
```

---

## DATA OUTPUT (JSON Format)

```json
{
  "id": "custom-001",
  "name": "Marcus Stone",
  "codename": "Ironclad",
  "team": "heroes",
  "origin": "tech_enhanced",
  "personality": "protective",
  "threatLevel": "level3",
  "secretIdentity": true,
  "hp": 140,
  "str": 55,
  "agl": 25,
  "end": 60,
  "rsn": 35,
  "int": 40,
  "psy": 30,
  "weapon": "super_punch",
  "armor": "power",
  "powers": ["super_strength"],
  "gadgets": ["medkit", "emp_grenade"],
  "career": {
    "primary": {
      "category": 4,
      "categoryName": "Engineering/Tech",
      "rank": 3,
      "job": "Weapon Designer"
    },
    "secondary": {
      "category": 7,
      "categoryName": "Physical/Vocational",
      "rank": 2,
      "job": "Construction Foreman"
    }
  },
  "skillBonuses": {
    "tech": 15,
    "investigation": 5,
    "combat": 5,
    "athletics": 7
  },
  "backstory": "Former construction worker fused with experimental exoskeleton."
}
```

---

## RESPONSIVE CONSIDERATIONS

### Desktop (1200px+)
- Side-by-side layout as shown above

### Tablet (768-1199px)
- Preview panel moves to top
- Tabs become scrollable

### Mobile (< 768px)
- Single column layout
- Preview becomes collapsible header
- Bottom bar becomes sticky footer
