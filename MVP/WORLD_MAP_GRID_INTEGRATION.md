# World Map Grid Integration Guide

This document describes the new pixel art world map grid system added to the SuperHero Tactics MVP.

## What Was Added

### New Component: WorldMapGrid
A Jagged Alliance 2-style grid overlay system for the world map that divides the map into clickable sectors.

**Location**: `C:\git\sht\MVP\src\components\WorldMap\WorldMapGrid.tsx`

### Features
1. **20x10 Grid System**: 200 sectors covering the entire world map
2. **Sector Codes**: A-T (columns) × 0-9 (rows) = sectors like "A0", "LJ5", "T9"
3. **Interactive Cells**: Click to view cities and countries in each sector
4. **Visual Indicators**:
   - Green dots mark sectors with cities
   - Yellow hover highlights
   - Semi-transparent grid lines
5. **Sector Detail Panel**: Modal showing:
   - All cities in the sector with population and types
   - All countries in the sector
   - City details (types, population rating, crime index)

## Files Created/Modified

### Created
- `C:\git\sht\MVP\src\components\WorldMap\WorldMapGrid.tsx` - Main component
- `C:\git\sht\MVP\src\components\WorldMap\index.ts` - Export barrel
- `C:\git\sht\MVP\src\components\WorldMap\README.md` - Component documentation
- `C:\git\sht\MVP\public\assets\world_map.webp` - Pixel art world map (695KB)

### Modified
- `C:\git\sht\MVP\src\App.tsx` - Added WorldMapGrid to routing and dev menu
- `C:\git\sht\MVP\tailwind.config.js` - Added grid-cols-20 and grid-rows-10 utilities
- `C:\git\sht\MVP\src\data\cities.ts` - Fixed apostrophe issues in city names (build errors)

## How to Access

### Via Dev Mode (Recommended)
1. Press **F2** to open the dev menu
2. Click **"→ World Map Grid"** (emerald colored)
3. The world map grid will load

### Via Code
```typescript
import WorldMapGrid from './components/WorldMap/WorldMapGrid';

// Use in JSX
<WorldMapGrid />
```

## Usage Instructions

### Navigating the Map
1. **Hover** over any grid cell to see:
   - Sector code (e.g., "LJ5")
   - Number of cities in that sector
2. **Click** on any sector with a green dot to open the detail panel
3. **View** the list of cities and countries
4. **Close** the panel by clicking the X or clicking outside

### Understanding the Grid
- **Green Dot** = Sector contains cities
- **No Indicator** = Empty sector (ocean or unpopulated areas)
- **Yellow Highlight** = Currently hovering
- **Grid Lines** = Semi-transparent white borders

## Data Integration

The component uses the existing city data from `src/data/cities.ts`:
- **1050 cities** across the world
- Cities are pre-assigned to sectors via the `sector` property
- Sectors aggregate cities and extract unique country lists
- Example city with sector: `{ sector: 'LJ5', name: 'Kabul', country: 'Afghanistan', ... }`

## Technical Details

### Grid Layout
- **CSS Grid**: 20 columns × 10 rows
- **Responsive sizing**: Each cell scales with viewport
- **Absolute positioning**: Grid overlay on top of background image
- **Z-index management**: Hover cells appear above neighbors

### Performance
- **Memoized grid data**: Computed once on mount
- **Efficient filtering**: Uses Array.filter() and Set for unique countries
- **Lazy rendering**: Detail panel only renders when clicked

### Styling
- **Tailwind CSS**: Uses custom grid utilities
- **Color scheme**: Matches SHT brand colors (yellow, blue, gray)
- **Animations**: Smooth transitions on hover and click
- **Accessibility**: Keyboard-friendly modal

## Customization Guide

### Change Grid Size
In `WorldMapGrid.tsx`, modify:
```typescript
const GRID_COLS = 20; // Change to desired column count
const GRID_ROWS = 10; // Change to desired row count
```

### Change Sector Naming
Modify the `generateSectorCode` function:
```typescript
const generateSectorCode = (row: number, col: number): string => {
  // Custom logic here
  // Current: A-T (cols) + 0-9 (rows)
  return `${colLetter}${row}`;
};
```

### Change Colors
Update className strings in the grid cell rendering:
```typescript
// Current hover: bg-yellow-500/40 border-yellow-500/80
// Change to: bg-blue-500/40 border-blue-500/80
```

### Replace World Map Image
Replace the file at:
```
C:\git\sht\MVP\public\assets\world_map.webp
```
Or update the image path in the component:
```typescript
<img src="/assets/your_new_map.webp" />
```

## Known Issues & Fixes

### Build Errors Fixed
- **Issue**: Apostrophes in city names caused JavaScript parsing errors
- **Cities affected**: Bur Sa'id, Be'er Sheva, Ya'an, Pu'er, Yan'An, Xi'an, Ji'an
- **Fix**: Removed apostrophes (e.g., "Bur Said", "Beer Sheva", "Yaan")
- **File**: `src/data/cities.ts`

### Empty Sectors
Some cities have empty sector codes (`sector: ''`) in the data. These cities won't appear in the grid until their sectors are assigned.

## Future Enhancements

Potential features to add:
1. **Faction Territory Overlays**: Color-code sectors by controlling faction
2. **Travel Routes**: Draw lines between sectors for travel visualization
3. **Mission Markers**: Pin icons for active missions
4. **Real-Time Events**: Highlight sectors with ongoing events
5. **Zoom/Pan Controls**: Allow map navigation for detail view
6. **Mini-Map**: Small overview map for quick navigation
7. **Sector Statistics**: Show population, crime, faction presence
8. **Search Functionality**: Find cities/countries and highlight their sectors

## Testing

### Verified Functionality
- Build succeeds without errors
- Component integrates with existing app structure
- Dev menu navigation works
- Grid renders correctly
- Hover effects work
- Click events trigger detail panel
- City data loads and displays
- Modal opens and closes properly

### Test Sectors
Try clicking these sectors to see city data:
- **LJ5**: Kabul, Afghanistan
- **LD4**: Herat, Mazar-e Sharif (Afghanistan)
- **JS9**: Beer Sheva, Israel

## Support

For questions or issues:
1. Check `src/components/WorldMap/README.md` for component details
2. Review the component source code for implementation details
3. Verify city data in `src/data/cities.ts` for sector assignments
