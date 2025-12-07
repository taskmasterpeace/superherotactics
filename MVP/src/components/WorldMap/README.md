# World Map Grid Component

A pixel art world map with a clickable grid overlay inspired by Jagged Alliance 2 sector mechanics.

## Features

- **20x10 Grid Overlay**: The world map is divided into 200 sectors (A-T columns, 0-9 rows)
- **Interactive Sectors**: Click any sector to view cities and countries within it
- **Visual Indicators**: Green dots mark sectors containing cities
- **Hover Effects**: Yellow highlights show the current sector being hovered
- **City Data Integration**: Uses the existing cities data with sector codes

## Grid System

### Sector Naming Convention
- **Columns**: A-T (20 columns)
- **Rows**: 0-9 (10 rows)
- **Example Sectors**: A0, B5, LJ5, T9

### Data Structure
Each grid cell contains:
- `sector`: The sector code (e.g., "LJ5")
- `cities`: Array of City objects in that sector
- `countries`: Unique list of countries in that sector
- `row` / `col`: Grid position

## Usage

### In the App
Access via Dev Mode (F2):
1. Press F2 to open the dev menu
2. Click "World Map Grid"
3. Hover over sectors to see highlights
4. Click sectors with cities (green dot) to view details

### Sector Detail Panel
When clicking a sector, you'll see:
- **Sector code and grid position**
- **List of countries** in that sector
- **City cards** showing:
  - City name and country
  - Population and type (Mega City, Large City, etc.)
  - City types (Military, Political, Industrial, etc.)

## Technical Details

### Component Structure
- `WorldMapGrid.tsx`: Main component with grid overlay
- `SectorPanel`: Modal panel for sector details
- Uses Tailwind CSS grid system (20 columns x 10 rows)

### Data Integration
- Reads from `src/data/cities.ts`
- Filters cities by their `sector` property
- Aggregates countries from city data

### Styling
- Background: Pixel art world map at `/assets/world_map.webp`
- Grid borders: Semi-transparent white lines
- Hover: Yellow highlight with sector info
- Cities indicator: Green dot with glow effect

## Customization

### Adjusting Grid Size
To change the grid dimensions, modify:
```typescript
const GRID_COLS = 20; // Change column count
const GRID_ROWS = 10; // Change row count
```

### Sector Code Format
The `generateSectorCode` function can be modified to use different naming conventions.

### Visual Themes
Update hover colors and effects in the className strings within the grid cell rendering.

## Future Enhancements

Potential additions:
- Faction territory overlays
- Travel route visualization
- Mission markers
- Real-time event indicators
- Zoom and pan controls
- Mini-map navigation
