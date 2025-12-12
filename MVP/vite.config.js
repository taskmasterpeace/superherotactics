import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Plugin to enable auto-save from dev tools (Sector Editor, etc.)
function devSavePlugin() {
  return {
    name: 'dev-save-plugin',
    configureServer(server) {
      server.middlewares.use('/api/save-sectors', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method not allowed')
          return
        }

        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', async () => {
          try {
            const data = JSON.parse(body)
            const filePath = path.resolve(__dirname, 'src/data/sectors-populated.ts')

            // Generate TypeScript file content - MUST match sectors-populated.ts format exactly
            const content = `/**
 * Sector Data System for SuperHero Tactics World Map
 * 42x24 grid (A-X rows, 1-42 columns)
 * AUTO-POPULATED with country data
 * Generated: ${new Date().toISOString()}
 */

export interface Sector {
  id: string;           // "A1", "K15", etc.
  row: string;          // "A", "K", etc.
  col: number;          // 1-42
  terrain: SectorTerrain;
  countries: string[];  // Country codes in display order (e.g., ["US", "CA"])
  isOcean: boolean;
  isCoastal: boolean;
  notes?: string;
}

export type SectorTerrain =
  | 'ocean'
  | 'coastal'
  | 'land'
  | 'arctic'
  | 'desert'
  | 'mountain'
  | 'jungle'
  | 'forest'
  | 'plains';

// Terrain color mappings for visual display
export const TERRAIN_COLORS = {
  ocean: '#1e40af',      // Blue
  coastal: '#0891b2',    // Cyan
  land: '#16a34a',       // Green
  arctic: '#e0f2fe',     // Light blue
  desert: '#fbbf24',     // Yellow
  mountain: '#78716c',   // Gray
  jungle: '#065f46',     // Dark green
  forest: '#15803d',     // Forest green
  plains: '#84cc16',     // Light green
} as const;

// Pre-populated sector grid
export const SECTORS: Sector[] = ${JSON.stringify(data.sectors, null, 2)};

// Utility functions
export function getSector(id: string): Sector | undefined {
  return SECTORS.find(s => s.id === id);
}

export function getSectorsByCountry(countryCode: string): Sector[] {
  return SECTORS.filter(s => s.countries.includes(countryCode));
}

export function getSectorsByTerrain(terrain: SectorTerrain): Sector[] {
  return SECTORS.filter(s => s.terrain === terrain);
}

export function getSectorByRowCol(row: string, col: number): Sector | undefined {
  return SECTORS.find(s => s.row === row && s.col === col);
}

export function getAdjacentSectors(sector: Sector): Sector[] {
  if (!sector) return [];

  const rowIndex = 'ABCDEFGHIJKLMNOPQRSTUVWX'.indexOf(sector.row);
  const adjacent: Sector[] = [];

  // Check all 8 directions
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];

  for (const [dr, dc] of directions) {
    const newRowIndex = rowIndex + dr;
    const newCol = sector.col + dc;

    if (newRowIndex >= 0 && newRowIndex < 24 && newCol >= 1 && newCol <= 42) {
      const newRow = 'ABCDEFGHIJKLMNOPQRSTUVWX'[newRowIndex];
      const adj = getSectorByRowCol(newRow, newCol);
      if (adj) adjacent.push(adj);
    }
  }

  return adjacent;
}

export function getSectorStats() {
  const stats = {
    total: SECTORS.length,
    ocean: 0,
    land: 0,
    withCountries: 0,
    byTerrain: {} as Record<string, number>,
    byCountry: {} as Record<string, number>,
  };

  for (const sector of SECTORS) {
    if (sector.isOcean || sector.terrain === 'ocean') stats.ocean++;
    else stats.land++;

    if (sector.countries.length > 0) stats.withCountries++;

    stats.byTerrain[sector.terrain] = (stats.byTerrain[sector.terrain] || 0) + 1;

    for (const country of sector.countries) {
      stats.byCountry[country] = (stats.byCountry[country] || 0) + 1;
    }
  }

  return stats;
}

export function exportSectorsJSON(): string {
  return JSON.stringify(SECTORS, null, 2);
}
`
            fs.writeFileSync(filePath, content, 'utf-8')

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: true, saved: data.sectors.length }))
          } catch (err) {
            console.error('Save error:', err)
            res.statusCode = 500
            res.end(JSON.stringify({ error: err.message }))
          }
        })
      })
    }
  }
}

export default defineConfig({
  plugins: [react(), devSavePlugin()],
  server: {
    port: 3000,
    open: true,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          three: ['three', '@react-three/fiber', '@react-three/drei'],
          utils: ['zustand', 'framer-motion', 'react-hot-toast']
        }
      }
    }
  },
  define: {
    global: 'globalThis'
  }
})