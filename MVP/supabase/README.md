# Supabase Setup for SuperHero Tactics

This guide walks you through setting up Supabase as the database backend for SuperHero Tactics.

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/log in
2. Click "New Project"
3. Choose a name and region
4. Note your project URL and keys from **Settings > API**

## Step 2: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_KEY=your-service-role-key
   ```

## Step 3: Create Database Tables

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/schema.sql`
4. Paste and run the SQL

This creates all the tables:
- `weapons` - All weapon types with damage, range, accuracy
- `gadgets` - Vehicles, tech, equipment
- `cities` - World cities with crime/safety indices
- `countries` - Countries with government types
- `powers` - Superhero powers with threat levels
- `skills` - Character skills and talents
- `status_effects` - Combat status effects
- `armor` - Armor types with DR values
- `ammunition` - Ammo types with modifiers
- `martial_arts_styles` - 5 martial arts styles
- `martial_arts_techniques` - 40 techniques across all styles

## Step 4: Import Game Data

Run the migration script to import all CSV data:

```bash
# Using environment variables
export SUPABASE_URL=https://your-project-id.supabase.co
export SUPABASE_SERVICE_KEY=your-service-role-key
npm run migrate

# Or pass as arguments
npm run migrate -- --url=YOUR_URL --key=YOUR_KEY
```

This imports:
- 50+ weapons from Weapons_Complete.csv
- 20+ vehicles/gadgets from Tech_Gadgets_Complete.csv
- 100+ cities from World Bible CSVs
- 167 countries
- 50+ powers
- 75+ skills
- Status effects, armor, ammunition
- 5 martial arts styles with 40 techniques

## Step 5: Verify Setup

After migration, check your Supabase dashboard:
- **Table Editor** should show all tables with data
- **API Docs** shows auto-generated endpoints

## Using in React

```tsx
import { useWeapons, useCombatData } from './hooks/useGameData';

function WeaponsList() {
  const { data: weapons, loading, error } = useWeapons();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <ul>
      {weapons.map(w => (
        <li key={w.id}>{w.name} - {w.base_damage} damage</li>
      ))}
    </ul>
  );
}
```

## Direct Queries

```tsx
import { getAllWeapons, getWeaponById } from './lib';

// Get all weapons
const weapons = await getAllWeapons();

// Get specific weapon
const pistol = await getWeaponById('rng_002');
```

## Troubleshooting

### "Supabase not configured"
Check that your `.env` file has the correct values and you've restarted the dev server.

### "Row Level Security" errors
The schema includes RLS policies. If you get permission errors, check that policies are enabled in Supabase dashboard.

### Migration fails
Ensure you're using the `service_role` key (not anon key) for the migration script.
