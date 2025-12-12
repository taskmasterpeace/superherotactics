/**
 * Sector Editor Tool
 * Visual map grid (40x24, 40px cells) matching V0 layout
 * Click sectors to view/edit countries, cities, terrain
 */

import React, { useState, useMemo, useCallback } from 'react';
import { cities, City, CULTURE_CODES, CITY_TYPES } from '../data/cities';
import { ALL_COUNTRIES } from '../data/countries';
import {
  SECTORS,
  updateSector,
  exportSectorsJSON,
  getSectorStats,
  TERRAIN_COLORS,
  type Sector,
  type SectorTerrain,
} from '../data/sectors';
import toast from 'react-hot-toast';

// Use ALL_COUNTRIES as single source of truth (168 countries, 2-letter ISO codes)
// ALL_COUNTRIES uses .code for ISO code (e.g., 'US', 'CA', 'GB')
const ALL_COUNTRY_DATA = ALL_COUNTRIES
  .map(c => ({ code: c.code, name: c.name, lswActivity: c.lswActivity, vigilantism: c.vigilantism }))
  .sort((a, b) => a.name.localeCompare(b.name));

interface SectorEditorProps {
  onClose?: () => void;
}

const DEFAULT_CELL_SIZE = 40; // Base cell size
const GRID_COLS = 42; // Extended to match map width (was 40)
const GRID_ROWS = 24;
const ROW_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWX'.split('');

// Zoom levels
const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const DEFAULT_ZOOM = 1;

// World map background options - using V0 game maps
const MAP_BACKGROUNDS = [
  { name: 'None', url: '' },
  { name: 'Game Map', url: '/world-map-pixel.jpg' },
  { name: 'Ocean Texture', url: '/world-map-ocean-texture.jpg' },
];

export default function SectorEditor({ onClose }: SectorEditorProps) {
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [hoveredSector, setHoveredSector] = useState<Sector | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showGrid, setShowGrid] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [mapBackground, setMapBackground] = useState(MAP_BACKGROUNDS[1].url); // Default to Game Map
  const [gridOpacity, setGridOpacity] = useState(0.6);
  const [showCountryCodes, setShowCountryCodes] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true); // Toggle sidebar for more map space
  const [zoom, setZoom] = useState(DEFAULT_ZOOM); // Zoom level

  // Computed cell size based on zoom
  const GRID_CELL_SIZE = DEFAULT_CELL_SIZE * zoom;

  // Paint mode - drag to paint terrain or countries
  const [paintMode, setPaintMode] = useState(false);
  const [paintType, setPaintType] = useState<'terrain' | 'country'>('terrain');
  const [paintTerrain, setPaintTerrain] = useState<SectorTerrain>('ocean');
  const [paintCountry, setPaintCountry] = useState<string>('US');
  const [isPainting, setIsPainting] = useState(false);
  const [paintedSectors, setPaintedSectors] = useState<Set<string>>(new Set());

  // Undo stack - stores previous states of painted sectors
  const [undoStack, setUndoStack] = useState<Array<{sectorId: string, terrain: SectorTerrain, countries: string[], isOcean: boolean}>>([]);

  // Edit state
  const [editTerrain, setEditTerrain] = useState<SectorTerrain>('land');
  const [editCountries, setEditCountries] = useState<string[]>([]);
  const [editNotes, setEditNotes] = useState('');

  // Force re-render trigger after saves
  const [refreshKey, setRefreshKey] = useState(0);

  // Create indexed lookup - refreshKey dependency forces rebuild after save
  const sectorMap = useMemo(() => {
    const map = new Map<string, Sector>();
    SECTORS.forEach(s => map.set(s.id, s));
    return map;
  }, [refreshKey]);

  // Get cities for a sector (using old sector codes from city data)
  const getCitiesInSector = useCallback((sectorId: string): City[] => {
    // Cities use old format like "LJ5", convert new format "K15" isn't directly comparable
    // For now, find cities whose countries match the sector's countries
    const sector = sectorMap.get(sectorId);
    if (!sector || sector.countries.length === 0) return [];

    return cities.filter(city => {
      const country = ALL_COUNTRY_DATA.find(c => c.name === city.country);
      return country && sector.countries.includes(country.code);
    }).slice(0, 10); // Limit to 10 for display
  }, [sectorMap]);

  // Get cities for display based on country codes in sector
  const sectorCities = useMemo(() => {
    if (!selectedSector) return [];
    return getCitiesInSector(selectedSector.id);
  }, [selectedSector, getCitiesInSector]);

  const stats = getSectorStats();

  const handleSectorClick = (row: string, col: number) => {
    const sectorId = `${row}${col}`;
    const sector = sectorMap.get(sectorId);
    if (sector) {
      setSelectedSector({ ...sector });
      setEditTerrain(sector.terrain);
      setEditCountries([...sector.countries]);
      setEditNotes(sector.notes || '');
      setEditMode(false);
    }
  };

  const handleSave = async () => {
    if (!selectedSector) return;

    updateSector(selectedSector.id, {
      terrain: editTerrain,
      countries: editCountries,
      isOcean: editTerrain === 'ocean',
      isCoastal: editTerrain === 'coastal',
      notes: editNotes,
    });

    // Update local state
    setSelectedSector({
      ...selectedSector,
      terrain: editTerrain,
      countries: editCountries,
      isOcean: editTerrain === 'ocean',
      isCoastal: editTerrain === 'coastal',
      notes: editNotes,
    });

    toast.success(`Sector ${selectedSector.id} saved!`);
    setEditMode(false);
    setRefreshKey(k => k + 1); // Force grid to re-render

    // Auto-save to file
    const saved = await autoSaveToFile();
    if (saved) {
      toast.success('💾 Auto-saved to file!', { duration: 1500 });
    }
  };

  // Paint mode handlers
  const handlePaintStart = (sectorId: string) => {
    if (!paintMode) return;
    setIsPainting(true);
    setPaintedSectors(new Set([sectorId]));
    applyPaint(sectorId);
  };

  const handlePaintMove = (sectorId: string) => {
    if (!paintMode || !isPainting) return;
    if (paintedSectors.has(sectorId)) return; // Already painted this stroke
    setPaintedSectors(prev => new Set([...prev, sectorId]));
    applyPaint(sectorId);
  };

  const handlePaintEnd = async () => {
    if (!paintMode) return;
    const count = paintedSectors.size;
    setIsPainting(false);
    setPaintedSectors(new Set());
    setRefreshKey(k => k + 1); // Refresh grid after painting

    if (paintType === 'terrain') {
      toast.success(`Painted ${count} sectors as ${paintTerrain}`);
    } else {
      const countryName = ALL_COUNTRY_DATA.find(c => c.code === paintCountry)?.name || paintCountry;
      toast.success(`Assigned ${countryName} to ${count} sectors`);
    }

    // Auto-save after painting
    if (count > 0) {
      const saved = await autoSaveToFile();
      if (saved) {
        toast.success('💾 Auto-saved to file!', { duration: 1500 });
      }
    }
  };

  const applyPaint = (sectorId: string) => {
    const sector = sectorMap.get(sectorId);
    if (!sector) return;

    // Save to undo stack BEFORE modifying
    setUndoStack(prev => [...prev, {
      sectorId,
      terrain: sector.terrain,
      countries: [...sector.countries],
      isOcean: sector.isOcean
    }]);

    if (paintType === 'terrain') {
      // Paint terrain
      const isOcean = paintTerrain === 'ocean';
      const isCoastal = paintTerrain === 'coastal';

      updateSector(sectorId, {
        terrain: paintTerrain,
        isOcean,
        isCoastal,
        // Clear countries only if painting ocean
        ...(isOcean && { countries: [] }),
      });
    } else {
      // Paint country - add to existing countries if not already there
      const existingCountries = sector.countries || [];
      if (!existingCountries.includes(paintCountry)) {
        updateSector(sectorId, {
          countries: [...existingCountries, paintCountry],
          // Also set terrain to land if it was ocean
          ...(sector.isOcean && { terrain: 'land' as SectorTerrain, isOcean: false }),
        });
      }
    }
  };

  // Undo last paint stroke
  const handleUndo = async () => {
    if (undoStack.length === 0) {
      toast.error('Nothing to undo');
      return;
    }

    // Get all sectors from the last stroke (they were added in sequence)
    // For simplicity, undo one sector at a time
    const lastState = undoStack[undoStack.length - 1];
    updateSector(lastState.sectorId, {
      terrain: lastState.terrain,
      countries: lastState.countries,
      isOcean: lastState.isOcean,
      isCoastal: lastState.terrain === 'coastal',
    });

    setUndoStack(prev => prev.slice(0, -1));
    setRefreshKey(k => k + 1);
    toast.success(`Undid change to ${lastState.sectorId}`);

    // Auto-save after undo
    await autoSaveToFile();
  };

  // Clear countries from a sector (useful for fixing mistakes)
  const handleClearCountries = async (sectorId: string) => {
    const sector = sectorMap.get(sectorId);
    if (!sector) return;

    setUndoStack(prev => [...prev, {
      sectorId,
      terrain: sector.terrain,
      countries: [...sector.countries],
      isOcean: sector.isOcean
    }]);

    updateSector(sectorId, { countries: [] });
    setRefreshKey(k => k + 1);
    toast.success(`Cleared countries from ${sectorId}`);

    // Auto-save after clearing
    await autoSaveToFile();
  };

  const handleExport = () => {
    const json = exportSectorsJSON();
    navigator.clipboard.writeText(json);
    toast.success('Sector data copied to clipboard!');
  };

  const handleDownload = () => {
    // Generate full TypeScript file content
    const fileContent = `/**
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
export const SECTORS: Sector[] = ${exportSectorsJSON()};

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

export function getAdjacentSectors(id: string): Sector[] {
  const sector = getSector(id);
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
`;

    // Create downloadable file
    const blob = new Blob([fileContent], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sectors-populated.ts';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Downloaded sectors-populated.ts! Move it to src/data/ to save your changes.');
  };

  // Auto-save to file via Vite dev server
  const autoSaveToFile = async () => {
    try {
      const response = await fetch('/api/save-sectors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectors: SECTORS }),
      });

      if (!response.ok) {
        throw new Error(`Save failed: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success) {
        console.log(`✅ Auto-saved ${result.saved} sectors to file`);
        return true;
      }
    } catch (err) {
      console.error('Auto-save failed:', err);
      // Don't show error toast - it's fine if auto-save fails in production
      return false;
    }
    return false;
  };

  const toggleCountry = (code: string) => {
    if (editCountries.includes(code)) {
      setEditCountries(editCountries.filter(c => c !== code));
    } else {
      setEditCountries([...editCountries, code]);
    }
  };

  const getSectorColor = (sector: Sector): string => {
    // Always show terrain color - makes painted terrain visible
    return TERRAIN_COLORS[sector.terrain] || '#3d3d3d';
  };

  const filteredCountries = ALL_COUNTRY_DATA.filter(c =>
    searchQuery === '' ||
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-gray-900 text-white flex flex-col z-50">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-3 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-yellow-400">Sector Editor</h1>
            <p className="text-xs text-gray-400">
              {stats.mappedSectors} mapped | {stats.oceanCount} ocean | {stats.unmappedSectors} empty
            </p>
          </div>

          {/* Map Background */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Map:</label>
            <select
              value={mapBackground}
              onChange={(e) => setMapBackground(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
            >
              {MAP_BACKGROUNDS.map(bg => (
                <option key={bg.name} value={bg.url}>{bg.name}</option>
              ))}
            </select>
          </div>

          {/* Grid Opacity */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Opacity:</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={gridOpacity}
              onChange={(e) => setGridOpacity(parseFloat(e.target.value))}
              className="w-20"
            />
            <span className="text-xs w-8">{Math.round(gridOpacity * 100)}%</span>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 border-l border-gray-600 pl-3 ml-2">
            <label className="text-xs text-gray-400">Zoom:</label>
            <button
              onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
              className="w-6 h-6 bg-gray-700 hover:bg-gray-600 rounded text-sm font-bold"
              title="Zoom out"
            >
              -
            </button>
            <span className="text-xs w-10 text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(z => Math.min(2, z + 0.25))}
              className="w-6 h-6 bg-gray-700 hover:bg-gray-600 rounded text-sm font-bold"
              title="Zoom in"
            >
              +
            </button>
            <button
              onClick={() => setZoom(1)}
              className="px-2 py-0.5 bg-gray-700 hover:bg-gray-600 rounded text-xs"
              title="Reset zoom"
            >
              100%
            </button>
          </div>

          {/* Toggles */}
          <label className="flex items-center gap-1 text-sm">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
              className="w-3 h-3"
            />
            <span className="text-xs">Grid</span>
          </label>
          <label className="flex items-center gap-1 text-sm">
            <input
              type="checkbox"
              checked={showCountryCodes}
              onChange={(e) => setShowCountryCodes(e.target.checked)}
              className="w-3 h-3"
            />
            <span className="text-xs">Codes</span>
          </label>

          {/* Paint Mode Toggle */}
          <div className="border-l border-gray-600 pl-3 ml-2 flex items-center gap-2">
            <label className={`flex items-center gap-1 text-sm px-2 py-1 rounded cursor-pointer ${paintMode ? 'bg-orange-600' : 'bg-gray-700'}`}>
              <input
                type="checkbox"
                checked={paintMode}
                onChange={(e) => setPaintMode(e.target.checked)}
                className="w-3 h-3"
              />
              <span className="text-xs font-bold">PAINT</span>
            </label>
            {paintMode && (
              <>
                {/* Paint Type Toggle */}
                <select
                  value={paintType}
                  onChange={(e) => setPaintType(e.target.value as 'terrain' | 'country')}
                  className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs font-bold"
                >
                  <option value="terrain">Terrain</option>
                  <option value="country">Country</option>
                </select>

                {/* Terrain Selector */}
                {paintType === 'terrain' && (
                  <select
                    value={paintTerrain}
                    onChange={(e) => setPaintTerrain(e.target.value as SectorTerrain)}
                    className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs"
                  >
                    <option value="ocean">Ocean (clears countries)</option>
                    <option value="coastal">Coastal</option>
                    <option value="land">Land</option>
                    <option value="arctic">Arctic</option>
                    <option value="desert">Desert</option>
                    <option value="mountain">Mountain</option>
                    <option value="jungle">Jungle</option>
                    <option value="forest">Forest</option>
                    <option value="plains">Plains</option>
                  </select>
                )}

                {/* Country Selector */}
                {paintType === 'country' && (
                  <select
                    value={paintCountry}
                    onChange={(e) => setPaintCountry(e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs"
                  >
                    {ALL_COUNTRY_DATA.map(c => (
                      <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                    ))}
                  </select>
                )}

                {/* Undo Button */}
                <button
                  onClick={handleUndo}
                  disabled={undoStack.length === 0}
                  className={`px-2 py-1 rounded text-xs font-bold ${undoStack.length > 0 ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-gray-600 text-gray-400'}`}
                >
                  UNDO ({undoStack.length})
                </button>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className={`px-3 py-1.5 rounded text-sm font-bold ${showSidebar ? 'bg-gray-600' : 'bg-purple-600'}`}
            title="Toggle sidebar for more map space"
          >
            {showSidebar ? '◀ Hide Panel' : '▶ Show Panel'}
          </button>
          <button
            onClick={handleExport}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded text-sm"
          >
            Export JSON
          </button>
          <button
            onClick={handleDownload}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-sm font-bold"
          >
            Download File
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded text-sm"
            >
              Close
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Map Grid */}
        <div className="flex-1 overflow-auto bg-gray-950 relative">
          <div
            className="relative"
            style={{
              width: GRID_COLS * GRID_CELL_SIZE + 30,
              height: GRID_ROWS * GRID_CELL_SIZE + 20,
            }}
          >
            {/* Background Map Image */}
            {mapBackground && (
              <img
                src={mapBackground}
                alt="World Map"
                className="absolute"
                style={{
                  left: 30,
                  top: 16,
                  width: GRID_COLS * GRID_CELL_SIZE,
                  height: GRID_ROWS * GRID_CELL_SIZE,
                  objectFit: 'cover',
                  pointerEvents: 'none',
                }}
              />
            )}

            {/* Column Headers */}
            <div className="flex absolute top-0 left-[30px] z-10">
              {Array.from({ length: GRID_COLS }, (_, i) => (
                <div
                  key={i}
                  className="text-center text-[10px] text-gray-500 font-mono"
                  style={{ width: GRID_CELL_SIZE, height: 16 }}
                >
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Row Labels + Grid - key forces re-render on save */}
            <div key={refreshKey} className="absolute top-[16px] left-0 z-10">
              {ROW_LABELS.map((row, rowIndex) => (
                <div key={row} className="flex">
                  {/* Row Label */}
                  <div
                    className="flex items-center justify-center text-[10px] text-gray-300 font-mono font-bold bg-gray-900/80"
                    style={{ width: 30, height: GRID_CELL_SIZE }}
                  >
                    {row}
                  </div>

                  {/* Cells */}
                  {Array.from({ length: GRID_COLS }, (_, colIndex) => {
                    const sectorId = `${row}${colIndex + 1}`;
                    const sector = sectorMap.get(sectorId);
                    if (!sector) return null;

                    const isSelected = selectedSector?.id === sectorId;
                    const isHovered = hoveredSector?.id === sectorId;
                    const hasCountries = sector.countries.length > 0;

                    // Color with opacity - ALWAYS show terrain colors
                    const baseColor = getSectorColor(sector);
                    const alpha = gridOpacity; // Always use full opacity

                    const isPaintedThisStroke = paintedSectors.has(sectorId);

                    // Determine background color
                    let bgColor: string;
                    if (isPaintedThisStroke) {
                      // Currently being painted - show paint color
                      bgColor = (paintType === 'terrain' ? TERRAIN_COLORS[paintTerrain] : '#22c55e') + 'cc';
                    } else {
                      // Show terrain color with opacity
                      bgColor = `${baseColor}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
                    }

                    return (
                      <div
                        key={sectorId}
                        onClick={() => !paintMode && handleSectorClick(row, colIndex + 1)}
                        onMouseDown={() => handlePaintStart(sectorId)}
                        onMouseEnter={() => {
                          setHoveredSector(sector);
                          handlePaintMove(sectorId);
                        }}
                        onMouseLeave={() => setHoveredSector(null)}
                        onMouseUp={handlePaintEnd}
                        className={`relative cursor-pointer transition-all ${paintMode ? 'cursor-crosshair' : ''}`}
                        style={{
                          width: GRID_CELL_SIZE,
                          height: GRID_CELL_SIZE,
                          backgroundColor: bgColor,
                          border: isSelected
                            ? '3px solid #fbbf24'
                            : isHovered
                              ? '2px solid #60a5fa'
                              : isPaintedThisStroke
                                ? '2px solid #f97316'
                                : hasCountries
                                  ? '2px solid #22c55e'
                                  : showGrid
                                    ? '1px solid rgba(0,255,255,0.3)'
                                    : 'none',
                          boxSizing: 'border-box',
                        }}
                        title={`${sectorId}: ${sector.terrain} ${sector.countries.length > 0 ? '- ' + sector.countries.join(', ') : ''}`}
                      >
                        {/* Country code labels - show up to 4 in quadrants */}
                        {showCountryCodes && sector.countries.length > 0 && (
                          <div className="absolute inset-0 flex flex-wrap">
                            {sector.countries.length === 1 ? (
                              /* Single country - centered */
                              <span
                                className="absolute inset-0 flex items-center justify-center font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]"
                                style={{ fontSize: Math.max(7, 9 * zoom) }}
                              >
                                {sector.countries[0]}
                              </span>
                            ) : (
                              /* Multiple countries - 2x2 grid */
                              <>
                                {sector.countries.slice(0, 4).map((code, idx) => (
                                  <span
                                    key={code}
                                    className="font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)] flex items-center justify-center"
                                    style={{
                                      fontSize: Math.max(5, 7 * zoom),
                                      width: '50%',
                                      height: '50%',
                                      backgroundColor: idx === 0 ? 'rgba(34, 197, 94, 0.4)' :
                                                       idx === 1 ? 'rgba(59, 130, 246, 0.4)' :
                                                       idx === 2 ? 'rgba(249, 115, 22, 0.4)' :
                                                                   'rgba(168, 85, 247, 0.4)',
                                    }}
                                    title={ALL_COUNTRY_DATA.find(c => c.code === code)?.name || code}
                                  >
                                    {code}
                                  </span>
                                ))}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detail Panel - collapsible */}
        <div className={`bg-gray-800 border-l border-gray-700 flex flex-col flex-shrink-0 overflow-hidden transition-all ${showSidebar ? 'w-[400px]' : 'w-0'}`}>
          {selectedSector ? (
            <div className="flex-1 overflow-y-auto p-4">
              {/* Sector Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-yellow-400">{selectedSector.id}</h2>
                  <p className="text-sm text-gray-400">
                    Row {selectedSector.row} | Column {selectedSector.col}
                  </p>
                </div>
                <button
                  onClick={() => setEditMode(!editMode)}
                  className={`px-3 py-1.5 rounded text-sm ${editMode ? 'bg-yellow-500 text-black' : 'bg-gray-600 hover:bg-gray-500'}`}
                >
                  {editMode ? 'Cancel' : 'Edit'}
                </button>
              </div>

              {editMode ? (
                /* Edit Mode */
                <div className="space-y-4">
                  {/* Terrain */}
                  <div>
                    <label className="block text-sm font-bold mb-2 text-gray-300">Terrain</label>
                    <select
                      value={editTerrain}
                      onChange={(e) => setEditTerrain(e.target.value as SectorTerrain)}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                    >
                      <option value="ocean">Ocean</option>
                      <option value="coastal">Coastal</option>
                      <option value="land">Land</option>
                      <option value="arctic">Arctic</option>
                      <option value="desert">Desert</option>
                      <option value="mountain">Mountain</option>
                      <option value="jungle">Jungle</option>
                      <option value="forest">Forest</option>
                      <option value="plains">Plains</option>
                    </select>
                  </div>

                  {/* Countries */}
                  <div>
                    <label className="block text-sm font-bold mb-2 text-gray-300">
                      Countries ({editCountries.length})
                    </label>

                    {/* Selected */}
                    {editCountries.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {editCountries.map(code => {
                          const country = ALL_COUNTRY_DATA.find(c => c.code === code);
                          return (
                            <span
                              key={code}
                              onClick={() => toggleCountry(code)}
                              className="bg-green-600 px-2 py-1 rounded text-xs cursor-pointer hover:bg-red-600"
                            >
                              {code} - {country?.name || 'Unknown'}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Search & Add */}
                    <input
                      type="text"
                      placeholder="Search countries..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm mb-2"
                    />
                    <div className="max-h-64 overflow-y-auto border border-gray-600 rounded bg-gray-700">
                      {filteredCountries.map(country => (
                        <div
                          key={country.code}
                          onClick={() => toggleCountry(country.code)}
                          className={`px-3 py-1.5 text-sm cursor-pointer hover:bg-gray-600 ${
                            editCountries.includes(country.code) ? 'bg-green-900' : ''
                          }`}
                        >
                          {country.code} - {country.name}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-bold mb-2 text-gray-300">Notes</label>
                    <textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
                      rows={3}
                      placeholder="Add notes..."
                    />
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={handleSave}
                    className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded"
                  >
                    Save Changes
                  </button>
                </div>
              ) : (
                /* View Mode */
                <div className="space-y-4">
                  {/* Current Data */}
                  <div className="bg-gray-700/50 rounded p-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-400">Terrain:</span>
                        <span className="ml-2 capitalize">{selectedSector.terrain}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Ocean:</span>
                        <span className="ml-2">{selectedSector.isOcean ? 'Yes' : 'No'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Coastal:</span>
                        <span className="ml-2">{selectedSector.isCoastal ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Countries in Sector */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-300 mb-2">
                      Countries ({selectedSector.countries.length})
                    </h3>
                    {selectedSector.countries.length > 0 ? (
                      <div className="space-y-2">
                        {selectedSector.countries.map(code => {
                          const country = ALL_COUNTRY_DATA.find(c => c.code === code);
                          return (
                            <div key={code} className="bg-gray-700 rounded p-2 flex items-center gap-2">
                              <img
                                src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
                                alt={country?.name}
                                className="w-8 h-5 object-cover rounded"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                              <div>
                                <div className="font-bold text-sm">{country?.name || code}</div>
                                <div className="text-xs text-gray-400">
                                  LSW: {country?.lswActivity || 0} | Vigilantism: {country?.vigilantism || 'N/A'}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No countries assigned</p>
                    )}
                  </div>

                  {/* Cities in Sector */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-300 mb-2">
                      Cities ({sectorCities.length})
                    </h3>
                    {sectorCities.length > 0 ? (
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {sectorCities.map(city => (
                          <div key={city.name} className="bg-gray-700/50 rounded px-2 py-1 text-sm flex justify-between">
                            <span className="font-medium">{city.name}</span>
                            <span className="text-gray-400">{city.country}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No cities (based on country match)</p>
                    )}
                  </div>

                  {/* Notes */}
                  {selectedSector.notes && (
                    <div>
                      <h3 className="text-sm font-bold text-gray-300 mb-2">Notes</h3>
                      <p className="text-sm bg-gray-700/50 rounded p-2">{selectedSector.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <p className="text-lg mb-2">Click a sector</p>
                <p className="text-sm">to view and edit its data</p>
              </div>
            </div>
          )}

          {/* Hover Info */}
          {hoveredSector && !selectedSector && (
            <div className="absolute bottom-4 left-4 bg-black/90 rounded p-3 text-sm">
              <div className="font-bold text-yellow-400">{hoveredSector.id}</div>
              <div className="text-gray-400 capitalize">{hoveredSector.terrain}</div>
              {hoveredSector.countries.length > 0 && (
                <div className="text-green-400">{hoveredSector.countries.join(', ')}</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-gray-800 border-t border-gray-700 p-2 flex-shrink-0">
        <div className="flex flex-wrap gap-4 text-xs justify-center">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#2d5a3d' }}></div>
            <span>Has Countries</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#1e3a5f' }}></div>
            <span>Ocean</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3d3d3d' }}></div>
            <span>Empty Land</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 border-2 border-yellow-400"></div>
            <span>Selected</span>
          </div>
        </div>
      </div>
    </div>
  );
}
