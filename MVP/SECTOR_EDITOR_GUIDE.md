# Sector Editor User Guide

## Overview

The Sector Editor is a visual tool for manually curating the 40x24 world map grid, allowing you to assign countries, terrain types, and properties to each sector.

## Access

1. Press **F2** to open Dev Mode
2. Click **"🗺️ Sector Editor"** button in the Dev Mode panel
3. The editor opens in fullscreen mode

## Grid Layout

- **40 columns** (1-40, horizontal)
- **24 rows** (A-X, vertical)
- **960 total sectors**

## Features

### Map View

- **Visual Grid**: Color-coded sectors showing terrain and country assignments
- **Zoom Control**: Adjust grid cell size (50%-200%)
- **Click to Select**: Click any sector to edit its properties
- **Visual Feedback**:
  - Green = Mapped sector (has country assignments)
  - Terrain colors = Unmapped sectors show terrain type
  - Yellow border = Currently selected sector
  - Cyan border = Coastal sectors

### Edit Panel (Right Side)

When a sector is selected, you can edit:

1. **Terrain Type** (dropdown)
   - Ocean
   - Coastal
   - Land
   - Arctic
   - Desert
   - Mountain
   - Jungle
   - Forest
   - Plains

2. **Flags** (checkboxes)
   - Is Ocean
   - Is Coastal

3. **Country Assignment** (multi-select)
   - Search countries by name or code
   - Check/uncheck countries to add/remove
   - Countries appear in order selected
   - First country shown on grid (if cell is large enough)

4. **Notes** (textarea)
   - Add custom notes about the sector
   - Useful for planning or special properties

5. **Save Button**
   - Click to save changes to the sector
   - Shows success toast notification

### Statistics Panel

Click **"Show Stats"** to view:
- Total sectors (960)
- Mapped sectors (with country assignments)
- Unmapped sectors
- Ocean/Coastal counts
- Terrain type distribution

### Export Function

Click **"Export JSON"** to:
- Copy all sector data to clipboard as JSON
- Use for backup or integration with other systems
- Format: Array of 960 sector objects

## Legend

Color coding in the grid:

- **Green (#22c55e)**: Mapped sectors (have countries)
- **Blue (#1e40af)**: Ocean
- **Cyan (#0891b2)**: Coastal
- **Green (#16a34a)**: Land
- **Light Blue (#e0f2fe)**: Arctic
- **Yellow (#fbbf24)**: Desert
- **Gray (#78716c)**: Mountain
- **Dark Green (#065f46)**: Jungle
- **Forest Green (#15803d)**: Forest
- **Light Green (#84cc16)**: Plains

## Workflow Example

1. **Start with terrain**: Mark ocean, coastal, and major terrain types
2. **Assign countries**: Click sectors and select countries from the list
3. **Add details**: Set coastal flags, add notes for special areas
4. **Export data**: Save your work by exporting JSON

## Data Structure

Each sector contains:

```typescript
{
  id: "A1",              // Sector identifier
  row: "A",              // Row letter
  col: 1,                // Column number
  terrain: "land",       // Terrain type
  countries: ["US"],     // Country codes (in order)
  isOcean: false,        // Ocean flag
  isCoastal: true,       // Coastal flag
  notes: "..."           // Optional notes
}
```

## Tips

- Use zoom to see details or overview
- Search countries by code (e.g., "US") or name (e.g., "United")
- First country in the list is displayed on the grid
- Multiple countries per sector = border regions
- Ocean sectors typically have no countries
- Coastal flag useful for naval/port mechanics

## Keyboard Shortcuts

- **F2**: Toggle Dev Mode panel
- **Ctrl+C** (after Export): Paste JSON data elsewhere

## Integration

The sector data is stored in:
- `c:/git/sht/MVP/src/data/sectors.ts`

The data can be:
- Exported as JSON for backup
- Used by world map rendering systems
- Queried by country, terrain, or location
- Extended with additional properties

## Future Enhancements

Potential additions:
- Drag to select multiple sectors
- Bulk edit operations
- Import JSON functionality
- Visual country borders
- Historical versions/undo
- Integration with city placement
