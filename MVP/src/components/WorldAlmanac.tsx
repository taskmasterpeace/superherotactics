/**
 * World Almanac - Wiki-style game encyclopedia and development registry
 *
 * Features:
 * - Wiki homepage with category navigation
 * - Markdown rendering with internal links [[article-id|text]]
 * - Implementation status tracking (kanban-style)
 * - Categories: Stats, Weapons, Armor, Powers, Talents, Skills, Countries, Systems
 * - Image support (16:9, 9:16, 1:1 aspect ratios)
 */

import React, { useState, useMemo, useCallback } from 'react';
import { ALL_WEAPONS, Weapon, ALL_ARMOR, Armor } from '../data';
import { ALL_COUNTRIES } from '../data/countries';
import { DAMAGE_TYPES } from '../data/damageSystem';

// ============================================================
// TYPES
// ============================================================

type ImplementationStatus = 'implemented' | 'partial' | 'data-only' | 'planned' | 'concept';

interface AlmanacArticle {
  id: string;
  title: string;
  category: string;
  subcategory?: string;
  status: ImplementationStatus;
  summary: string;
  content: string;
  relatedArticles?: string[];
  dataSource?: string;
  image?: {
    url: string;
    aspectRatio: '16:9' | '9:16' | '1:1';
    caption?: string;
  };
}

interface AlmanacCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  subcategories?: string[];
}

// ============================================================
// CATEGORIES
// ============================================================

const CATEGORIES: AlmanacCategory[] = [
  {
    id: 'overview',
    name: 'Overview',
    icon: '🏠',
    description: 'Game introduction and quick reference',
  },
  {
    id: 'stats',
    name: 'Stats & Attributes',
    icon: '📊',
    description: 'Primary stats, derived stats, and how they work',
    subcategories: ['Primary Stats', 'Derived Stats', 'Combat Stats'],
  },
  {
    id: 'weapons',
    name: 'Weapons',
    icon: '🔫',
    description: 'All weapons with range brackets and damage',
    subcategories: ['Pistols', 'Rifles', 'SMGs', 'Shotguns', 'Sniper Rifles', 'Heavy Weapons', 'Melee'],
  },
  {
    id: 'armor',
    name: 'Armor & Protection',
    icon: '🛡️',
    description: 'Body armor, shields, and protective gear',
    subcategories: ['Light Armor', 'Medium Armor', 'Heavy Armor', 'Powered Armor', 'Shields'],
  },
  {
    id: 'powers',
    name: 'LSW Powers',
    icon: '⚡',
    description: 'Living Super Weapon abilities and origins',
    subcategories: ['Energy Powers', 'Physical Powers', 'Mental Powers', 'Movement Powers'],
  },
  {
    id: 'talents',
    name: 'Talents & Skills',
    icon: '🎯',
    description: 'Character abilities and learned skills',
    subcategories: ['Combat Talents', 'Social Talents', 'Technical Skills', 'Knowledge Skills'],
  },
  {
    id: 'combat',
    name: 'Combat Systems',
    icon: '⚔️',
    description: 'How combat works - damage, defense, status effects',
    subcategories: ['Damage Types', 'Status Effects', 'Hit Resolution', 'Knockback'],
  },
  {
    id: 'world',
    name: 'World Data',
    icon: '🌍',
    description: 'Countries, cities, factions, and geopolitics',
    subcategories: ['Countries', 'Cities', 'Factions', 'LSW Policy'],
  },
  {
    id: 'economy',
    name: 'Economy',
    icon: '💰',
    description: 'Money, trading, investments, and costs',
    subcategories: ['Income', 'Expenses', 'Black Market', 'Investments'],
  },
  {
    id: 'systems',
    name: 'Game Systems',
    icon: '⚙️',
    description: 'Core mechanics and interconnected systems',
    subcategories: ['Time System', 'Travel', 'Missions', 'Investigations'],
  },
];

// ============================================================
// ARTICLE REGISTRY (Development Tracking)
// ============================================================

const ARTICLES: AlmanacArticle[] = [
  // OVERVIEW
  {
    id: 'welcome',
    title: 'Welcome to SuperHero Tactics',
    category: 'overview',
    status: 'implemented',
    summary: 'Introduction to the game and its core loop',
    content: `# SuperHero Tactics

A geopolitical turn-based tactical superhero strategy game.

## Core Loop

**Country Selection** → **City Selection** → **Base Setup** → **Recruit Team** → **Equip** → **World Map** → **Tactical Combat**

## Three Game Layers

1. **Laptop Layer** - Strategic UI, investigations, management
2. **World Map Layer** - Global operations, travel, sectors
3. **Tactical Layer** - Turn-based Phaser combat

## Key Concepts

- **Living Super Weapons (LSW)** - Individuals with superhuman abilities
- **Threat Level** - Character power rating (1-10)
- **Sectors** - 20x10 grid dividing the world map
- **Combined Effects** - How country stats create emergent gameplay

---

*See also: [[stats|Stats & Attributes]], [[combat-overview|Combat Overview]], [[world-overview|World Data]]*`,
  },

  // STATS
  {
    id: 'stats',
    title: 'Stats Overview',
    category: 'stats',
    status: 'partial',
    summary: 'Primary and derived character statistics',
    content: `# Character Stats

## Primary Stats (1-100 scale)

| Stat | Abbr | Description |
|------|------|-------------|
| **Melee** | MEL | Hand-to-hand combat ability |
| **Coordination** | COO | Ranged accuracy, fine motor skills |
| **Intelligence** | INT | Learning, hacking, investigation |
| **Constitution** | CON | Health, stamina, poison resistance |
| **Instinct** | INS | Perception, initiative, danger sense |
| **Presence** | PRE | Leadership, intimidation, persuasion |
| **Willpower** | WIL | Mental resistance, focus |

## Derived Stats

- **HP** = CON × 2 + base 50
- **Initiative** = INS + (COO / 2)
- **AP** = 4 base + modifiers
- **Movement** = 6 squares base

## Implementation Status

| Stat | In Combat | In World Map | In Character Sheet |
|------|-----------|--------------|-------------------|
| MEL | ✅ | - | ✅ |
| COO | ✅ | - | ✅ |
| INT | ❌ | ✅ | ✅ |
| CON | ✅ (HP only) | - | ✅ |
| INS | ✅ (Init) | - | ✅ |
| PRE | ❌ | ✅ | ✅ |
| WIL | ❌ | - | ✅ |

---

*See also: [[combat-stats|Combat Stats]], [[threat-level|Threat Level]]*`,
  },

  // WEAPONS OVERVIEW
  {
    id: 'weapons-overview',
    title: 'Weapons Overview',
    category: 'weapons',
    status: 'implemented',
    summary: 'How weapons work - damage, range brackets, accuracy',
    content: `# Weapons System

## Range Bracket System

Each weapon has 6 range zones with accuracy modifiers:

| Bracket | Modifier | Best For |
|---------|----------|----------|
| Point Blank | +25% to -15% | Shotguns, SMGs |
| Short | +10% to -5% | Pistols |
| Optimal | +0% | Designed range |
| Long | -10% to -20% | Rifles |
| Extreme | -20% to -40% | Snipers only |
| Max | -50% | Desperation |

## Balance Targets

| Weapon Type | Shots to Kill (Unarmored) |
|-------------|---------------------------|
| Pistol | 1.5 shots |
| Rifle | 1 shot |
| Shotgun (close) | 1 shot |
| SMG | 2-3 shots |
| Sniper | 1 shot |

## Data Source

**${ALL_WEAPONS.length} weapons** defined in \`weapons.ts\`

---

*See also: [[pistols|Pistols]], [[rifles|Rifles]], [[damage-types|Damage Types]]*`,
  },

  // COMBAT OVERVIEW
  {
    id: 'combat-overview',
    title: 'Combat Overview',
    category: 'combat',
    status: 'implemented',
    summary: 'Turn-based tactical combat system',
    content: `# Combat System

## Turn Structure

1. **Initiative Roll** - INS + COO/2 + d10
2. **AP Allocation** - 4-8 AP per turn
3. **Actions** - Move, Attack, Use Item, Powers
4. **End Turn** - Unused AP does NOT carry over

## Hit Resolution

\`\`\`
Roll d100 vs Target Number
Target = Base Accuracy + Weapon Mod + Range Mod - Cover - Movement
\`\`\`

| Result | Effect |
|--------|--------|
| Critical (≤10% of TN) | 2x damage, special effects |
| Hit | Normal damage |
| Graze (within 10% of TN) | 50% damage |
| Miss | No effect |

## AP Costs

| Action | AP Cost |
|--------|---------|
| Move 1 square | 1 AP |
| Aimed Shot | 3 AP |
| Snap Shot | 2 AP |
| Reload | 2-4 AP |
| Use Gadget | 1-3 AP |

---

*See also: [[damage-types|Damage Types]], [[knockback|Knockback]], [[status-effects|Status Effects]]*`,
  },

  // DAMAGE TYPES
  {
    id: 'damage-types',
    title: 'Damage Types',
    category: 'combat',
    subcategory: 'Damage Types',
    status: 'data-only',
    summary: 'Physical, Energy, and Special damage categories',
    content: `# Damage Types

## Categories

### Physical Damage
- **Ballistic** - Bullets, arrows
- **Slashing** - Blades, claws
- **Piercing** - Spears, stakes
- **Blunt** - Clubs, fists
- **Crushing** - Heavy objects, constriction

### Energy Damage
- **Fire** - Burns, ignites flammables
- **Cold** - Freezes, slows
- **Electric** - Stuns, EMPs machines
- **Sonic** - Shatters, deafens
- **Radiation** - Lingering, cancer risk
- **Plasma** - Armor-melting

### Special Damage
- **Psychic** - Mental attacks
- **Toxic** - Poisons, venoms
- **Corrosive** - Acid, dissolves armor

## Status Effect Links

| Damage Type | Primary Effect | Secondary |
|-------------|----------------|-----------|
| Fire | Burning | Panic |
| Cold | Slowed | Frostbite |
| Electric | Stunned | EMP |
| Toxic | Poisoned | Nauseated |

## Implementation Status

⚠️ **DATA ONLY** - Types defined but not wired to combat resolution

---

*Data source: \`damageSystem.ts\` (${Object.keys(DAMAGE_TYPES).length} types)*`,
  },

  // STATUS EFFECTS
  {
    id: 'status-effects',
    title: 'Status Effects',
    category: 'combat',
    subcategory: 'Status Effects',
    status: 'data-only',
    summary: 'Conditions that affect characters in combat',
    content: `# Status Effects

## Negative Effects

| Effect | Duration | Impact |
|--------|----------|--------|
| **Burning** | 3 turns | 5 damage/turn, -2 COO |
| **Stunned** | 1 turn | Skip turn, -50% defense |
| **Slowed** | 2 turns | Half movement |
| **Bleeding** | Until treated | 3 damage/turn |
| **Poisoned** | 5 turns | 2 damage/turn, -2 all stats |
| **Blinded** | 2 turns | -80% accuracy |
| **Deafened** | 3 turns | No sound detection |
| **Prone** | Until stand | +20% to be hit at range, -20% melee |
| **Suppressed** | 1 turn | Cannot move forward |
| **Panicked** | 2 turns | AI flees, player -30% all |

## Positive Effects

| Effect | Duration | Impact |
|--------|----------|--------|
| **Hasted** | 2 turns | +2 AP |
| **Shielded** | Until broken | Absorbs X damage |
| **Regenerating** | 3 turns | +5 HP/turn |

## Implementation Status

⚠️ **DATA ONLY** - Effects defined but not applied in combat

---

*Data source: \`damageSystem.ts\`*`,
  },

  // KNOCKBACK
  {
    id: 'knockback',
    title: 'Knockback System',
    category: 'combat',
    subcategory: 'Knockback',
    status: 'partial',
    summary: 'How impacts move characters and cause collisions',
    content: `# Knockback System

## Knockback Calculation

\`\`\`
Knockback Squares = (Damage × Weapon KB Multiplier) / Target Mass
\`\`\`

## Collision Damage

When knocked into obstacles:

| Obstacle | Damage | Effect |
|----------|--------|--------|
| Wall | 5 + KB distance | Stunned 1 turn |
| Character | 3 to both | Both prone |
| Window | 2 | Falls through |
| Furniture | 3 | Destroyed |

## Weapon KB Values

| Weapon | KB Multiplier |
|--------|---------------|
| Pistol | 1 |
| Shotgun | 3 |
| Rifle | 2 |
| RPG | 5 |
| Super Strength Punch | 4-8 |

## Implementation Status

✅ Simple knockback works in CombatScene
⚠️ Advanced physics (knockbackSystem.ts) not wired

---

*See also: [[explosions|Explosions]], [[super-strength|Super Strength]]*`,
  },

  // WORLD OVERVIEW
  {
    id: 'world-overview',
    title: 'World Data Overview',
    category: 'world',
    status: 'implemented',
    summary: 'Countries, cities, and geopolitical simulation',
    content: `# World Data

## Scale

- **${ALL_COUNTRIES.length} Countries** with full stat blocks
- **1050 Cities** with sector assignments
- **200 Sectors** (20×10 grid)

## Country Stats

Each country has 15+ stats that combine into gameplay effects:

| Category | Stats |
|----------|-------|
| **Economy** | GDP, GDP Per Capita, Income Inequality |
| **Military** | Military Budget, Tech Level, Nuclear |
| **Society** | Healthcare, Education, Crime Rate |
| **Politics** | Government Type, Corruption, Freedom |
| **LSW Policy** | Registration, Hunting, Tolerance |

## Combined Effects

Country stats combine to create emergent systems:

- **Black Market** = Corruption + Crime + Border Porosity
- **Medical Care** = Healthcare + GDP + Education
- **Safe Houses** = Crime + Corruption + GDP

---

*See also: [[countries|Countries]], [[lsw-policy|LSW Policy]], [[combined-effects|Combined Effects]]*`,
  },

  // LSW POLICY
  {
    id: 'lsw-policy',
    title: 'LSW Policy',
    category: 'world',
    subcategory: 'LSW Policy',
    status: 'data-only',
    summary: 'How countries treat Living Super Weapons',
    content: `# LSW Policy

## Policy Types

| Policy | Effect on Player |
|--------|------------------|
| **Registration Required** | Must register or operate illegally |
| **Kill on Sight** | Military actively hunts LSWs |
| **Tolerant** | LSWs can operate openly |
| **Regulated** | Licensed LSWs only |
| **Banned** | All LSW activity illegal |

## Policy by Region (Examples)

| Region | Common Policy |
|--------|---------------|
| USA | Regulated (state varies) |
| China | Strict Registration |
| Russia | Kill on Sight (unofficial) |
| Western Europe | Regulated |
| Middle East | Mixed |
| Africa | Varies wildly |

## Gameplay Impact

- Registration affects [[factions|faction]] standing
- Kill on Sight triggers random military encounters
- Tolerant countries = easier base setup

---

*See also: [[combined-effects|Combined Effects]], [[factions|Factions]]*`,
  },

  // ARMOR OVERVIEW
  {
    id: 'armor-overview',
    title: 'Armor Overview',
    category: 'armor',
    status: 'data-only',
    summary: 'How armor and protection work',
    content: `# Armor System

## Damage Reduction (DR)

Armor provides DR that subtracts from incoming damage:

\`\`\`
Final Damage = Raw Damage - DR (minimum 1)
\`\`\`

## DR by Type

| Armor Type | Physical DR | Energy DR | Mental DR |
|------------|-------------|-----------|-----------|
| Light | 2-5 | 0-2 | 0 |
| Medium | 5-10 | 2-5 | 0 |
| Heavy | 10-20 | 5-10 | 0-2 |
| Powered | 15-30 | 10-20 | 0-5 |

## Penetration

Weapons have penetration multipliers that reduce DR effectiveness:
- AP Rounds: 1.5x pen (DR halved)
- Armor Piercing Rifle: 2x pen
- Plasma: Ignores physical DR

## Implementation Status

⚠️ **DATA ONLY** - ${ALL_ARMOR.length} armor items defined but DR not applied in combat

---

*Data source: \`armor.ts\`*`,
  },

  // POWERS OVERVIEW
  {
    id: 'powers-overview',
    title: 'LSW Powers Overview',
    category: 'powers',
    status: 'partial',
    summary: 'Superhuman abilities and their origins',
    content: `# LSW Powers

## Power Origins

| Origin | Description | Stat Boost |
|--------|-------------|------------|
| **Mutant** | Born with abilities | +10 to power stat |
| **Science** | Lab accident/experiment | +5 INT, +5 power stat |
| **Magic** | Mystical source | +10 WIL |
| **Tech** | Powered armor/gadgets | Gear-dependent |
| **Alien** | Extraterrestrial | Varies |
| **Divine** | God-granted | +10 PRE |

## Power Categories

### Energy Powers
- Energy Blast, Force Field, Flight
- Electricity, Fire, Ice projection

### Physical Powers
- Super Strength, Invulnerability
- Super Speed, Regeneration

### Mental Powers
- Telepathy, Mind Control
- Telekinesis, Illusions

### Movement Powers
- Teleportation, Phasing
- Wall-crawling, Stretching

## Implementation Status

✅ Basic powers work in CombatScene (beams, teleport)
⚠️ Full power system not designed

---

*See also: [[threat-level|Threat Level]], [[power-origins|Power Origins]]*`,
  },

  // ECONOMY OVERVIEW
  {
    id: 'economy-overview',
    title: 'Economy Overview',
    category: 'economy',
    status: 'planned',
    summary: 'Money flow, income sources, and expenses',
    content: `# Economy System

## Income Sources

| Source | Frequency | Base Amount |
|--------|-----------|-------------|
| Mission Rewards | Per mission | $1,000-$50,000 |
| Faction Stipends | Monthly | $2,000-$15,000 |
| Salvage & Loot | Per combat | Variable |
| Bounties | Per capture | Target dependent |
| Black Market Sales | Per item | 50-90% value |
| Media Deals | Fame-based | $2,000-$100,000 |

## Expenses

| Expense | Frequency | Amount |
|---------|-----------|--------|
| Salaries | Weekly | $500-$5,000/char |
| Medical | Per injury | $500-$25,000 |
| Safe House Rent | Monthly | $200-$10,000 |
| Equipment Repair | Per damage | 10% of value |
| Bribes | Per use | $500-$50,000 |
| Vehicle Fuel | Per sector | Variable |

## Country Modifiers

All costs scale with country GDP:
- USA (GDP 95): 1.9x costs
- Brazil (GDP 45): 0.9x costs
- Somalia (GDP 5): 0.1x costs

## Implementation Status

❌ **PLANNED** - Design complete in ECONOMY_LOOP_DETAILED.md

---

*See also: [[black-market|Black Market]], [[factions|Factions]]*`,
  },

  // TIME SYSTEM
  {
    id: 'time-system',
    title: 'Time System',
    category: 'systems',
    subcategory: 'Time System',
    status: 'implemented',
    summary: 'Game time progression and speed controls',
    content: `# Time System

## Time Speeds

| Speed | Rate | Use Case |
|-------|------|----------|
| PAUSED | 0x | Planning, inventory |
| 1X | 1 min/sec | Normal play |
| 10X | 10 min/sec | Short waits |
| 60X | 1 hr/sec | Travel |
| 360X | 6 hr/sec | Long recovery |

## Time Events

| Interval | Events |
|----------|--------|
| **Hourly** | Travel progress, patrol encounters |
| **Daily** | Recovery, news, faction updates |
| **Weekly** | Salaries, rent, missions refresh |
| **Monthly** | Stipends, elections, world events |

## Implementation Status

✅ Time progression in enhancedGameStore
✅ UI controls on World Map
⚠️ Time events not triggering yet

---

*See also: [[travel|Travel System]], [[missions|Missions]]*`,
  },

  // TRAVEL SYSTEM
  {
    id: 'travel',
    title: 'Travel System',
    category: 'systems',
    subcategory: 'Travel',
    status: 'implemented',
    summary: 'Moving across the world map',
    content: `# Travel System

## Travel Time

Base: **6 hours per sector** (Manhattan distance)

## Vehicles

| Vehicle | Speed Mult | Capacity |
|---------|------------|----------|
| On Foot | 0.5x | 1 |
| Car | 1x | 4 |
| Helicopter | 2x | 6 |
| Jet | 4x | 8 |
| Teleporter | Instant | 1 |

## Travel Modes

1. **Manual** - Click sector, confirm deploy
2. **Patrol** - Loop through sectors
3. **Intercept** - Chase moving target

## Implementation Status

✅ Basic travel works
✅ Smooth vehicle animation
⚠️ Vehicles not affecting speed yet
⚠️ Patrol/intercept not implemented

---

*See also: [[vehicles|Vehicles]], [[world-overview|World Data]]*`,
  },
];

// ============================================================
// STATUS BADGE COMPONENT
// ============================================================

const StatusBadge: React.FC<{ status: ImplementationStatus }> = ({ status }) => {
  const config = {
    'implemented': { bg: 'bg-green-600', text: 'Implemented' },
    'partial': { bg: 'bg-yellow-600', text: 'Partial' },
    'data-only': { bg: 'bg-blue-600', text: 'Data Only' },
    'planned': { bg: 'bg-purple-600', text: 'Planned' },
    'concept': { bg: 'bg-gray-600', text: 'Concept' },
  }[status];

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.bg}`}>
      {config.text}
    </span>
  );
};

// ============================================================
// SIMPLE MARKDOWN RENDERER
// ============================================================

const renderMarkdown = (content: string, onNavigate: (id: string) => void): React.ReactNode => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inTable = false;
  let tableRows: string[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let listItems: { level: number; content: string }[] = [];

  const flushTable = () => {
    if (tableRows.length > 0) {
      const headerRow = tableRows[0].split('|').filter(c => c.trim());
      const dataRows = tableRows.slice(2).map(row =>
        row.split('|').filter(c => c.trim())
      );

      elements.push(
        <div key={`table-${elements.length}`} className="overflow-x-auto my-4">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-700">
                {headerRow.map((cell, i) => (
                  <th key={i} className="border border-gray-600 px-3 py-2 text-left font-semibold">
                    {cell.trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row, i) => (
                <tr key={i} className="hover:bg-gray-700/50">
                  {row.map((cell, j) => (
                    <td key={j} className="border border-gray-600 px-3 py-2">
                      {renderInline(cell.trim(), onNavigate)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
    }
  };

  const flushCode = () => {
    if (codeLines.length > 0) {
      elements.push(
        <pre key={`code-${elements.length}`} className="bg-gray-800 p-4 rounded my-4 overflow-x-auto text-sm font-mono">
          {codeLines.join('\n')}
        </pre>
      );
      codeLines = [];
    }
  };

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc list-inside my-2 space-y-1">
          {listItems.map((item, i) => (
            <li key={i} className="text-gray-300" style={{ marginLeft: item.level * 16 }}>
              {renderInline(item.content, onNavigate)}
            </li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  for (const line of lines) {
    // Code block handling
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        flushCode();
        inCodeBlock = false;
      } else {
        flushTable();
        flushList();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // Table handling
    if (line.includes('|') && (line.startsWith('|') || line.match(/^\s*\|/))) {
      if (!inTable) {
        flushList();
        inTable = true;
      }
      tableRows.push(line);
      continue;
    } else if (inTable) {
      flushTable();
      inTable = false;
    }

    // Headers
    if (line.startsWith('# ')) {
      flushList();
      elements.push(
        <h1 key={`h1-${elements.length}`} className="text-3xl font-bold text-white mt-6 mb-4 border-b border-gray-600 pb-2">
          {line.slice(2)}
        </h1>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={`h2-${elements.length}`} className="text-2xl font-bold text-blue-400 mt-6 mb-3">
          {line.slice(3)}
        </h2>
      );
      continue;
    }
    if (line.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={`h3-${elements.length}`} className="text-xl font-semibold text-gray-200 mt-4 mb-2">
          {line.slice(4)}
        </h3>
      );
      continue;
    }

    // Horizontal rule
    if (line.match(/^-{3,}$/)) {
      flushList();
      elements.push(<hr key={`hr-${elements.length}`} className="my-6 border-gray-600" />);
      continue;
    }

    // List items
    if (line.match(/^(\s*)-\s/)) {
      const match = line.match(/^(\s*)-\s(.*)$/);
      if (match) {
        const level = Math.floor(match[1].length / 2);
        listItems.push({ level, content: match[2] });
      }
      continue;
    } else if (listItems.length > 0) {
      flushList();
    }

    // Paragraph
    if (line.trim()) {
      elements.push(
        <p key={`p-${elements.length}`} className="text-gray-300 my-2 leading-relaxed">
          {renderInline(line, onNavigate)}
        </p>
      );
    }
  }

  flushTable();
  flushCode();
  flushList();

  return elements;
};

const renderInline = (text: string, onNavigate: (id: string) => void): React.ReactNode => {
  // Handle wiki links [[id|text]] or [[id]]
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIndex = 0;

  while (remaining) {
    const linkMatch = remaining.match(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/);
    if (linkMatch) {
      const before = remaining.slice(0, linkMatch.index);
      if (before) parts.push(renderInlineStyles(before, keyIndex++));

      const [full, id, displayText] = linkMatch;
      parts.push(
        <button
          key={`link-${keyIndex++}`}
          onClick={() => onNavigate(id)}
          className="text-blue-400 hover:text-blue-300 hover:underline"
        >
          {displayText || id}
        </button>
      );
      remaining = remaining.slice(linkMatch.index! + full.length);
    } else {
      parts.push(renderInlineStyles(remaining, keyIndex++));
      break;
    }
  }

  return parts;
};

const renderInlineStyles = (text: string, key: number): React.ReactNode => {
  // Bold, italic, code, strikethrough
  let result = text;
  const elements: React.ReactNode[] = [];

  // Split and process
  const parts = result.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|~~[^~]+~~)/);

  parts.forEach((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      elements.push(<strong key={`${key}-${i}`} className="font-bold text-white">{part.slice(2, -2)}</strong>);
    } else if (part.startsWith('*') && part.endsWith('*')) {
      elements.push(<em key={`${key}-${i}`} className="italic">{part.slice(1, -1)}</em>);
    } else if (part.startsWith('`') && part.endsWith('`')) {
      elements.push(<code key={`${key}-${i}`} className="bg-gray-700 px-1 rounded text-yellow-300 font-mono text-sm">{part.slice(1, -1)}</code>);
    } else if (part.startsWith('~~') && part.endsWith('~~')) {
      elements.push(<span key={`${key}-${i}`} className="line-through text-gray-500">{part.slice(2, -2)}</span>);
    } else {
      elements.push(part);
    }
  });

  return <span key={key}>{elements}</span>;
};

// ============================================================
// MAIN COMPONENT
// ============================================================

interface WorldAlmanacProps {
  onClose?: () => void;
}

export const WorldAlmanac: React.FC<WorldAlmanacProps> = ({ onClose }) => {
  const [currentArticle, setCurrentArticle] = useState<string>('welcome');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showKanban, setShowKanban] = useState(false);

  // Navigation history for back button
  const [history, setHistory] = useState<string[]>([]);

  const navigateToArticle = useCallback((id: string) => {
    setHistory(prev => [...prev, currentArticle]);
    setCurrentArticle(id);
  }, [currentArticle]);

  const goBack = useCallback(() => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory(h => h.slice(0, -1));
      setCurrentArticle(prev);
    }
  }, [history]);

  // Find current article
  const article = useMemo(() =>
    ARTICLES.find(a => a.id === currentArticle) || ARTICLES[0],
    [currentArticle]
  );

  // Filter articles by search
  const filteredArticles = useMemo(() => {
    if (!searchQuery) return ARTICLES;
    const q = searchQuery.toLowerCase();
    return ARTICLES.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.summary.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Group articles by category
  const articlesByCategory = useMemo(() => {
    const grouped: Record<string, AlmanacArticle[]> = {};
    for (const cat of CATEGORIES) {
      grouped[cat.id] = ARTICLES.filter(a => a.category === cat.id);
    }
    return grouped;
  }, []);

  // Status counts for kanban
  const statusCounts = useMemo(() => {
    const counts: Record<ImplementationStatus, number> = {
      'implemented': 0,
      'partial': 0,
      'data-only': 0,
      'planned': 0,
      'concept': 0,
    };
    ARTICLES.forEach(a => counts[a.status]++);
    return counts;
  }, []);

  return (
    <div className="flex h-full bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="w-72 bg-gray-800 border-r border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <span className="text-2xl">📚</span>
              World Almanac
            </h1>
            {onClose && (
              <button onClick={onClose} className="text-gray-400 hover:text-white">
                ✕
              </button>
            )}
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500 text-sm"
          />
        </div>

        {/* View Toggle */}
        <div className="p-2 border-b border-gray-700 flex gap-2">
          <button
            onClick={() => setShowKanban(false)}
            className={`flex-1 py-1 rounded text-sm ${!showKanban ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            Wiki
          </button>
          <button
            onClick={() => setShowKanban(true)}
            className={`flex-1 py-1 rounded text-sm ${showKanban ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            Dev Status
          </button>
        </div>

        {/* Category List */}
        <div className="flex-1 overflow-y-auto">
          {!showKanban ? (
            // Wiki Navigation
            searchQuery ? (
              // Search results
              <div className="p-2">
                <div className="text-xs text-gray-400 mb-2">
                  {filteredArticles.length} results
                </div>
                {filteredArticles.map(a => (
                  <button
                    key={a.id}
                    onClick={() => navigateToArticle(a.id)}
                    className={`w-full text-left p-2 rounded mb-1 text-sm hover:bg-gray-700 ${
                      currentArticle === a.id ? 'bg-gray-700' : ''
                    }`}
                  >
                    <div className="font-medium">{a.title}</div>
                    <div className="text-xs text-gray-400">{a.summary}</div>
                  </button>
                ))}
              </div>
            ) : (
              // Category tree
              <div className="py-2">
                {CATEGORIES.map(cat => (
                  <div key={cat.id}>
                    <button
                      onClick={() => setSelectedCategory(
                        selectedCategory === cat.id ? null : cat.id
                      )}
                      className={`w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-700 ${
                        selectedCategory === cat.id ? 'bg-gray-700' : ''
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span className="flex-1 font-medium">{cat.name}</span>
                      <span className="text-xs text-gray-400">
                        {articlesByCategory[cat.id]?.length || 0}
                      </span>
                      <span className={`transition-transform ${selectedCategory === cat.id ? 'rotate-90' : ''}`}>
                        ▶
                      </span>
                    </button>

                    {selectedCategory === cat.id && (
                      <div className="bg-gray-850 py-1">
                        {articlesByCategory[cat.id]?.map(a => (
                          <button
                            key={a.id}
                            onClick={() => navigateToArticle(a.id)}
                            className={`w-full flex items-center gap-2 px-8 py-1.5 text-left text-sm hover:bg-gray-700 ${
                              currentArticle === a.id ? 'bg-gray-700 text-blue-400' : 'text-gray-300'
                            }`}
                          >
                            <span className="flex-1">{a.title}</span>
                            <StatusBadge status={a.status} />
                          </button>
                        ))}
                        {(!articlesByCategory[cat.id] || articlesByCategory[cat.id].length === 0) && (
                          <div className="px-8 py-2 text-sm text-gray-500 italic">
                            No articles yet
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : (
            // Kanban/Status View
            <div className="p-3">
              <h3 className="font-bold mb-3">Implementation Status</h3>

              {(['implemented', 'partial', 'data-only', 'planned', 'concept'] as ImplementationStatus[]).map(status => (
                <div key={status} className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <StatusBadge status={status} />
                    <span className="text-sm text-gray-400">({statusCounts[status]})</span>
                  </div>
                  <div className="space-y-1">
                    {ARTICLES.filter(a => a.status === status).map(a => (
                      <button
                        key={a.id}
                        onClick={() => {
                          setShowKanban(false);
                          navigateToArticle(a.id);
                        }}
                        className="w-full text-left p-2 bg-gray-700 rounded text-sm hover:bg-gray-600"
                      >
                        <div className="font-medium">{a.title}</div>
                        <div className="text-xs text-gray-400">{a.category}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="p-3 border-t border-gray-700 text-xs text-gray-400">
          <div className="flex justify-between">
            <span>{ARTICLES.length} articles</span>
            <span>{CATEGORIES.length} categories</span>
          </div>
          <div className="flex gap-1 mt-2 flex-wrap">
            <span className="text-green-400">{statusCounts.implemented} done</span>
            <span className="text-yellow-400">{statusCounts.partial} partial</span>
            <span className="text-blue-400">{statusCounts['data-only']} data</span>
            <span className="text-purple-400">{statusCounts.planned} planned</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Article Header */}
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="flex items-center gap-3">
            {history.length > 0 && (
              <button
                onClick={goBack}
                className="text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-700"
              >
                ← Back
              </button>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{article.title}</h1>
                <StatusBadge status={article.status} />
              </div>
              <div className="text-sm text-gray-400 mt-1">
                {CATEGORIES.find(c => c.id === article.category)?.icon}{' '}
                {CATEGORIES.find(c => c.id === article.category)?.name}
                {article.subcategory && ` > ${article.subcategory}`}
              </div>
            </div>
          </div>
        </div>

        {/* Article Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {/* Summary */}
            <div className="bg-gray-800 rounded-lg p-4 mb-6 border-l-4 border-blue-500">
              <p className="text-gray-300">{article.summary}</p>
            </div>

            {/* Main content with markdown */}
            <div className="prose prose-invert max-w-none">
              {renderMarkdown(article.content, navigateToArticle)}
            </div>

            {/* Related articles */}
            {article.relatedArticles && article.relatedArticles.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-700">
                <h3 className="text-lg font-bold mb-3">Related Articles</h3>
                <div className="flex flex-wrap gap-2">
                  {article.relatedArticles.map(id => {
                    const related = ARTICLES.find(a => a.id === id);
                    if (!related) return null;
                    return (
                      <button
                        key={id}
                        onClick={() => navigateToArticle(id)}
                        className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 text-sm"
                      >
                        {related.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Data source */}
            {article.dataSource && (
              <div className="mt-6 text-sm text-gray-500">
                Data source: <code className="bg-gray-800 px-1 rounded">{article.dataSource}</code>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorldAlmanac;
