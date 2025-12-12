# Sector Editor - Quick Reference Card

## Access
**F2** → Click **"🗺️ Sector Editor"**

## Grid Layout
- **40 columns** (1-40)
- **24 rows** (A-X)
- **960 total sectors**

## Quick Actions

### Select Sector
- Click any cell in grid
- Yellow border = selected

### Edit Terrain
1. Select sector
2. Choose from dropdown:
   - Ocean, Coastal, Land, Arctic, Desert, Mountain, Jungle, Forest, Plains

### Assign Countries
1. Select sector
2. Search countries (optional)
3. Check/uncheck countries
4. First country shows on grid

### Add Notes
1. Select sector
2. Type in Notes textarea
3. Good for special properties

### Save Changes
- Click **"Save Changes"** button
- Toast notification confirms

### Export Data
- Click **"Export JSON"** button
- Data copied to clipboard

## Visual Guide

### Colors
| Color | Meaning |
|-------|---------|
| Green | Mapped (has countries) |
| Blue | Ocean |
| Cyan | Coastal |
| Yellow | Desert |
| Gray | Mountain |
| Light Blue | Arctic |
| Dark Green | Jungle/Forest |
| Light Green | Plains/Land |

### Borders
| Border | Meaning |
|--------|---------|
| Yellow | Selected sector |
| Cyan | Coastal flag set |
| Gray | Normal |

## Zoom
- Slider: 50% - 200%
- Larger = see country codes
- Smaller = see full map

## Stats Panel
**Show Stats** button displays:
- Total sectors: 960
- Mapped: sectors with countries
- Unmapped: empty sectors
- Ocean/Coastal counts

## Tips
1. Start with oceans/terrain
2. Add countries to land sectors
3. Use coastal flag for ports
4. Export regularly as backup
5. Search countries by code (US, CA, UK)
6. Multiple countries = borders

## Common Workflows

### Mark Ocean
1. Select sector
2. Terrain: "ocean"
3. Check "Is Ocean"
4. Leave countries empty
5. Save

### Assign Country
1. Select sector
2. Search country
3. Check country
4. Save

### Border Region
1. Select sector
2. Check multiple countries
3. Add note: "Border region"
4. Save

### Coastal City
1. Select sector
2. Terrain: "coastal"
3. Check "Is Coastal"
4. Add country
5. Note: "Port city location"
6. Save

## Keyboard
- **F2**: Toggle Dev Mode
- **Ctrl+C**: Copy (after Export)

## Files
- **Data**: `src/data/sectors.ts`
- **UI**: `src/tools/SectorEditor.tsx`
- **Utils**: `src/data/sectorHelpers.ts`

## Integration Code

### Get Country Sectors
```typescript
import { getSectorsByCountry } from './data/sectors';
const sectors = getSectorsByCountry('US');
```

### Find Neighbors
```typescript
import { getBorderingCountries } from './data/sectorHelpers';
const neighbors = getBorderingCountries('US');
```

### Calculate Distance
```typescript
import { getCountryDistance } from './data/sectorHelpers';
const distance = getCountryDistance('US', 'UK');
```

### Update Sector
```typescript
import { updateSector } from './data/sectors';
updateSector('A1', {
  terrain: 'ocean',
  countries: ['US'],
  isCoastal: true
});
```

## Support
- See: `SECTOR_EDITOR_GUIDE.md` (full manual)
- See: `SECTOR_EDITOR_IMPLEMENTATION.md` (technical docs)
