# Equipment & Inventory System

## Official Name: **Equipment Database System (EDS)**

This is a modular TypeScript-based equipment management system that allows you to:
1. Define items (grenades, weapons, armor, gadgets)
2. Assign them to characters before combat
3. Use them in combat with proper effects, sounds, and visuals

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    EQUIPMENT DATABASE SYSTEM                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. ITEM DATABASE           2. CHARACTER STORE       3. COMBAT USE │
│  ┌─────────────────┐       ┌─────────────────┐      ┌────────────┐ │
│  │ itemDatabase.ts │──────►│ enhancedGame    │─────►│ CombatScene│ │
│  │                 │       │ Store.ts        │      │ .ts        │ │
│  │ • GRENADES      │       │                 │      │            │ │
│  │ • PISTOLS       │       │ equipment: []   │      │ Uses items │ │
│  │ • GADGETS       │       │ (string names)  │      │ in combat  │ │
│  └─────────────────┘       └─────────────────┘      └────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Files

| File | Purpose |
|------|---------|
| `src/data/itemDatabase.ts` | **Master item registry** - all grenades, weapons, gadgets |
| `src/data/explosionSystem.ts` | Grenade explosion mechanics (damage, radius, effects) |
| `src/data/weapons.ts` | Weapon combat stats (damage, range, accuracy) |
| `src/stores/enhancedGameStore.ts` | Character definitions with `equipment[]` arrays |
| `public/soundConfig.json` | Maps item actions to sound files |
| `public/assets/items/` | Item images (grenades, pistols, etc.) |
| `public/assets/sounds/catalog.json` | Sound file catalog |

---

## How to Assign Equipment to a Character

### In `enhancedGameStore.ts`:

```typescript
characters: [
  {
    id: 'soldier-001',
    name: 'Alpha Squad Leader',
    // ... stats ...
    
    // EQUIPMENT ARRAY - Just list item names as strings!
    equipment: [
      'Energy Pistol',        // Weapon
      'Plasma Grenade',       // Grenade (x1)
      'Plasma Grenade',       // Same grenade = stacks to x2
      'Frag Grenade',
      'Frag Grenade',
      'Tactical Armor'        // Armor
    ],
    
    // ... rest of character data
  }
]
```

### Key Rules:
- **Equipment is a string array** - just use item names
- **Duplicate entries = multiple of that item** (e.g., 2x "Frag Grenade")
- **Items are consumed** when used (grenades removed after throwing)
- **Weapons are not consumed** (pistols stay equipped)

---

## Item Categories

### 1. GRENADES (8 total)
Location: `src/data/itemDatabase.ts` - `GRENADES` object

| Name | Image | Damage | Radius | Effects |
|------|-------|--------|--------|---------|
| Frag Grenade | grenade_frag.png | 50 | 3 | bleeding |
| Concussion Grenade | grenade_concussion.png | 35 | 4 | stunned |
| Flashbang | grenade_flashbang.png | 5 | 5 | blinded |
| Incendiary Grenade | grenade_incendiary.png | 30 | 2 | burning |
| Smoke Grenade | grenade_smoke.png | 0 | 4 | smoke cover |
| EMP Grenade | grenade_emp.png | 0 | 3 | disables tech |
| Plasma Grenade | grenade_plasma.png | 70 | 3 | burning, emp |
| Cryo Grenade | grenade_cryo.png | 25 | 3 | frozen, slowed |

### 2. PISTOLS (4 total)
Location: `src/data/itemDatabase.ts` - `PISTOLS` object

| Name | Damage | Range | Mag Size |
|------|--------|-------|----------|
| Standard Pistol | 12-18 | 10 | 15 |
| Heavy Pistol | 18-28 | 8 | 8 |
| Energy Pistol | 15-22 | 12 | 20 |
| Revolver | 25-35 | 8 | 6 |

### 3. GADGETS
Location: `src/data/itemDatabase.ts` - `GADGETS` object

- Drone Controller
- Recon Drone
- Medical Kit
- Shield Booster

---

## Adding a New Item

### Step 1: Add to itemDatabase.ts

```typescript
export const GRENADES = {
  // ... existing grenades ...
  
  TOXIC: {
    id: 'grenade_toxic',
    name: 'Toxic Grenade',
    emoji: '☠️',
    category: 'grenade' as const,
    size: '1x1' as const,
    width: 1,
    height: 1,
    stackable: true,
    maxStack: 10,
    quantity: 1,
    weight: 0.5,
    imageRatio: '1:1' as const,
    imagePath: '/assets/items/grenades/grenade_toxic.png',
    damage: 15,
    blastRadius: 4,
    statusEffects: ['poisoned'],
    description: 'Releases toxic gas that poisons enemies',
  },
};
```

### Step 2: Add to explosionSystem.ts (for grenades)

```typescript
export const GRENADES = {
  // ... existing ...
  
  TOXIC: {
    id: 'TOXIC',
    name: 'Toxic Grenade',
    emoji: '☠️',
    description: 'Releases toxic gas',
    maxRange: 12,
    throwSkillRequired: 'None',
    blastRadius: 4,
    damageAtCenter: 15,
    damageFalloff: 'linear',
    forceId: 'GRENADE_FRAG',
    statusEffects: ['poisoned'],
    visualEffect: 'smoke',
    soundLevel: 100,  // Decibels for sound ring
  },
};
```

### Step 3: Add Image
Put `grenade_toxic.png` in `public/assets/items/grenades/`

### Step 4: Add Sound (optional)
Edit `public/soundConfig.json`:
```json
{
  "grenade.toxic": "combat.explosion_small"
}
```

### Step 5: Update QuickInventory.tsx (for UI icon)
```typescript
const GRENADE_DATA = {
  // ...
  'Toxic': {
    image: '/assets/items/grenades/grenade_toxic.png',
    fallbackEmoji: '☠️',
    borderColor: 'border-green-600'
  },
};
```

### Step 6: Assign to Character
```typescript
equipment: ['Energy Pistol', 'Toxic Grenade', 'Toxic Grenade']
```

---

## Asset Locations

```
public/
├── assets/
│   ├── items/
│   │   ├── grenades/          # Grenade icons (1:1 ratio)
│   │   │   ├── grenade_frag.png
│   │   │   ├── grenade_plasma.png
│   │   │   └── ...
│   │   ├── pistols/           # Pistol icons
│   │   │   ├── pistol_standard.png
│   │   │   └── ...
│   │   └── gadgets/           # Gadget icons
│   └── sounds/
│       ├── combat/            # Combat sounds
│       │   ├── explosion_small_01.wav
│       │   ├── gunshot_pistol_01.wav
│       │   └── ...
│       └── catalog.json       # Sound catalog
└── soundConfig.json           # Maps actions to sounds
```

---

## Quick Reference Commands

### Give Character a Grenade:
```typescript
// In enhancedGameStore.ts
equipment: [..., 'Frag Grenade', 'Frag Grenade']  // Gives 2 Frag Grenades
```

### Update Character Equipment (runtime):
```typescript
const updateCharacter = useGameStore(state => state.updateCharacter);
updateCharacter('soldier-001', { 
  equipment: ['Energy Pistol', 'Plasma Grenade'] 
});
```

### Check What Grenades a Character Has:
```typescript
const character = gameCharacters.find(c => c.id === 'soldier-001');
const grenades = character.equipment.filter(item => 
  item.includes('Grenade') || item.includes('Flashbang')
);
```

---

## System Flow

```
1. BEFORE COMBAT
   └─► Define character with equipment[] in store

2. COMBAT START
   └─► Characters loaded with their equipment
   └─► QuickInventory reads equipment[], shows grenade icons

3. USING ITEMS
   └─► Click grenade icon → start-grenade-throw event
   └─► Click target tile → throwGrenade() called
   └─► consume-grenade event removes from equipment[]
   └─► explodeGrenade() plays sound + visual + damage

4. AFTER COMBAT
   └─► Equipment changes persist in store
```

---

## Summary

**Official Name: Equipment Database System (EDS)**

- **Item Definitions**: `src/data/itemDatabase.ts`
- **Combat Mechanics**: `src/data/explosionSystem.ts`, `src/data/weapons.ts`
- **Character Loadouts**: `src/stores/enhancedGameStore.ts` → `equipment[]`
- **UI Display**: `src/components/QuickInventory.tsx`
- **Assets**: `public/assets/items/` (images), `public/assets/sounds/` (audio)
- **Sound Mapping**: `public/soundConfig.json`

To add items: Define in database → Add image → Add sound → Assign to character!
