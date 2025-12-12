/**
 * HexWorldMap - Strategic layer with hex grid
 *
 * Jagged Alliance 2-style world map for squad movement
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Users,
  AlertTriangle,
  Building,
  Plane,
  Clock,
  X,
  ZoomIn,
  ZoomOut,
  Home,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface HexCoord {
  q: number;
  r: number;
}

type TerrainType = 'urban' | 'suburban' | 'forest' | 'mountain' | 'water' | 'desert';
type EnemyLevel = 'none' | 'light' | 'moderate' | 'heavy' | 'fortress';
type FacilityType = 'hospital' | 'safehouse' | 'workshop' | 'intel' | 'armory' | 'airport';

interface Sector {
  id: string;
  name: string;
  coord: HexCoord;
  terrain: TerrainType;
  travelTimeHours: number;
  vehicleAccessible: boolean;
  controlledBy: 'player' | 'enemy' | null;
  enemyLevel: EnemyLevel;
  enemyCount: number;
  facilities: FacilityType[];
  explored: boolean;
  missionAvailable: boolean;
}

interface Squad {
  id: string;
  name: string;
  members: string[];
  currentSector: string;
  destinationSector: string | null;
  travelProgress: number;
  status: 'idle' | 'traveling' | 'combat';
}

interface TravelRoute {
  sectors: string[];
  totalTime: number;
  risks: string[];
}

// ============================================================================
// HEX MATH UTILITIES
// ============================================================================

const HEX_SIZE = 40;

const hexToPixel = (hex: HexCoord): { x: number; y: number } => {
  const x = HEX_SIZE * ((3 / 2) * hex.q);
  const y = HEX_SIZE * ((Math.sqrt(3) / 2) * hex.q + Math.sqrt(3) * hex.r);
  return { x, y };
};

const getHexCorners = (center: { x: number; y: number }): string => {
  const corners = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const x = center.x + HEX_SIZE * Math.cos(angle);
    const y = center.y + HEX_SIZE * Math.sin(angle);
    corners.push(`${x},${y}`);
  }
  return corners.join(' ');
};

const hexDistance = (a: HexCoord, b: HexCoord): number => {
  return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
};

// ============================================================================
// SAMPLE DATA
// ============================================================================

const generateSampleSectors = (): Sector[] => {
  const sectors: Sector[] = [];
  const terrains: TerrainType[] = ['urban', 'suburban', 'forest', 'mountain', 'desert'];
  const names = [
    'Gotham Downtown', 'Arkham District', 'Wayne Industrial', 'Harbor Zone',
    'Narrows', 'Old Gotham', 'Diamond District', 'East End', 'The Cauldron',
    'Crime Alley', 'Robinson Park', 'Chinatown', 'Little Italy', 'Bristol',
    'Tricorner', 'Burnside', 'Bludhaven Border', 'Coventry', 'Otisburg',
    'Fashion District', 'Park Row', 'Uptown', 'Midtown', 'Financial District',
    'Port Adams'
  ];

  let nameIndex = 0;
  for (let r = -2; r <= 2; r++) {
    for (let q = -2; q <= 2; q++) {
      if (Math.abs(q + r) <= 2) {
        const id = `${String.fromCharCode(65 + q + 2)}${r + 3}`;
        sectors.push({
          id,
          name: names[nameIndex % names.length],
          coord: { q, r },
          terrain: terrains[Math.floor(Math.random() * terrains.length)],
          travelTimeHours: 1 + Math.floor(Math.random() * 4),
          vehicleAccessible: Math.random() > 0.3,
          controlledBy: Math.random() > 0.7 ? 'player' : Math.random() > 0.5 ? 'enemy' : null,
          enemyLevel: ['none', 'light', 'moderate', 'heavy'][Math.floor(Math.random() * 4)] as EnemyLevel,
          enemyCount: Math.floor(Math.random() * 10),
          facilities: Math.random() > 0.6 ? ['safehouse'] : [],
          explored: Math.random() > 0.3,
          missionAvailable: Math.random() > 0.8,
        });
        nameIndex++;
      }
    }
  }

  // Ensure starting sector is explored and friendly
  const startSector = sectors.find(s => s.id === 'C3');
  if (startSector) {
    startSector.explored = true;
    startSector.controlledBy = 'player';
    startSector.enemyLevel = 'none';
    startSector.facilities = ['safehouse', 'hospital'];
  }

  return sectors;
};

const sampleSquads: Squad[] = [
  {
    id: 'squad_1',
    name: 'Alpha Team',
    members: ['Batman', 'Robin', 'Batgirl'],
    currentSector: 'C3',
    destinationSector: null,
    travelProgress: 0,
    status: 'idle',
  },
  {
    id: 'squad_2',
    name: 'Beta Team',
    members: ['Nightwing', 'Red Hood'],
    currentSector: 'B2',
    destinationSector: null,
    travelProgress: 0,
    status: 'idle',
  },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const HexWorldMap: React.FC = () => {
  const [sectors] = useState<Sector[]>(generateSampleSectors);
  const [squads, setSquads] = useState<Squad[]>(sampleSquads);
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [selectedSquad, setSelectedSquad] = useState<Squad | null>(squads[0]);
  const [showTravelDialog, setShowTravelDialog] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 400, y: 300 });

  const svgRef = useRef<SVGSVGElement>(null);
  const isDragging = useRef(false);
  const lastPan = useRef({ x: 0, y: 0 });

  // Pan handling
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.button === 2) {
      isDragging.current = true;
      lastPan.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current) {
      const dx = e.clientX - lastPan.current.x;
      const dy = e.clientY - lastPan.current.y;
      setPan(p => ({ x: p.x + dx, y: p.y + dy }));
      lastPan.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    const newZoom = Math.max(0.5, Math.min(2, zoom - e.deltaY * 0.001));
    setZoom(newZoom);
  };

  // Sector click
  const handleSectorClick = (sector: Sector) => {
    setSelectedSector(sector);
  };

  const handleSectorDoubleClick = (sector: Sector) => {
    if (selectedSquad && sector.id !== selectedSquad.currentSector) {
      setSelectedSector(sector);
      setShowTravelDialog(true);
    }
  };

  // Travel
  const startTravel = () => {
    if (!selectedSquad || !selectedSector) return;

    setSquads(prev =>
      prev.map(s =>
        s.id === selectedSquad.id
          ? { ...s, destinationSector: selectedSector.id, status: 'traveling' as const }
          : s
      )
    );
    setShowTravelDialog(false);
  };

  // Get sector color
  const getSectorColor = (sector: Sector): string => {
    if (!sector.explored) return '#2a2a3e';
    if (sector.controlledBy === 'player') return '#1a4a6a';
    if (sector.controlledBy === 'enemy') {
      switch (sector.enemyLevel) {
        case 'heavy':
        case 'fortress':
          return '#6a1a1a';
        case 'moderate':
          return '#8a3a3a';
        case 'light':
          return '#5a3a3a';
        default:
          return '#3a3a4a';
      }
    }
    return '#3a3a4a';
  };

  // Get terrain icon
  const getTerrainEmoji = (terrain: TerrainType): string => {
    switch (terrain) {
      case 'urban': return '🏙️';
      case 'suburban': return '🏘️';
      case 'forest': return '🌲';
      case 'mountain': return '⛰️';
      case 'water': return '🌊';
      case 'desert': return '🏜️';
      default: return '⬡';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* TOP BAR */}
      <div className="h-12 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4">
        <span className="font-bold">WORLD MAP</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">
            Zoom: {Math.round(zoom * 100)}%
          </span>
          <button
            className="p-1 hover:bg-gray-700 rounded"
            onClick={() => setZoom(z => Math.min(2, z + 0.1))}
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            className="p-1 hover:bg-gray-700 rounded"
            onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            className="p-1 hover:bg-gray-700 rounded"
            onClick={() => {
              setPan({ x: 400, y: 300 });
              setZoom(1);
            }}
          >
            <Home className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex flex-1 overflow-hidden">
        {/* MAP AREA */}
        <div
          className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onContextMenu={e => e.preventDefault()}
        >
          <svg
            ref={svgRef}
            className="w-full h-full"
            style={{ background: '#1a1a2e' }}
          >
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {/* Render sectors */}
              {sectors.map(sector => {
                const pixel = hexToPixel(sector.coord);
                const corners = getHexCorners(pixel);
                const isSelected = selectedSector?.id === sector.id;
                const hasSquad = squads.some(s => s.currentSector === sector.id);

                return (
                  <g key={sector.id}>
                    {/* Hex shape */}
                    <polygon
                      points={corners}
                      fill={getSectorColor(sector)}
                      stroke={isSelected ? '#ffffff' : '#4a4a6a'}
                      strokeWidth={isSelected ? 3 : 1}
                      className="cursor-pointer hover:brightness-125 transition-all"
                      onClick={() => handleSectorClick(sector)}
                      onDoubleClick={() => handleSectorDoubleClick(sector)}
                    />

                    {/* Sector ID */}
                    <text
                      x={pixel.x}
                      y={pixel.y - 10}
                      textAnchor="middle"
                      fill="#888888"
                      fontSize="10"
                    >
                      {sector.id}
                    </text>

                    {/* Terrain icon */}
                    {sector.explored && (
                      <text
                        x={pixel.x}
                        y={pixel.y + 5}
                        textAnchor="middle"
                        fontSize="14"
                      >
                        {getTerrainEmoji(sector.terrain)}
                      </text>
                    )}

                    {/* Mission indicator */}
                    {sector.missionAvailable && (
                      <circle
                        cx={pixel.x + 20}
                        cy={pixel.y - 15}
                        r={6}
                        fill="#f59e0b"
                        className="animate-pulse"
                      />
                    )}

                    {/* Enemy indicator */}
                    {sector.enemyLevel !== 'none' && sector.explored && (
                      <text
                        x={pixel.x - 20}
                        y={pixel.y - 10}
                        fontSize="12"
                        fill="#ef4444"
                      >
                        ⚠️
                      </text>
                    )}

                    {/* Facility indicators */}
                    {sector.facilities.length > 0 && (
                      <text
                        x={pixel.x + 20}
                        y={pixel.y + 15}
                        fontSize="10"
                        fill="#4ade80"
                      >
                        🏛️
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Render squads */}
              {squads.map(squad => {
                const sector = sectors.find(s => s.id === squad.currentSector);
                if (!sector) return null;
                const pixel = hexToPixel(sector.coord);
                const isSelected = selectedSquad?.id === squad.id;

                return (
                  <g
                    key={squad.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedSquad(squad)}
                  >
                    <circle
                      cx={pixel.x}
                      cy={pixel.y + 20}
                      r={12}
                      fill={isSelected ? '#4a90d9' : '#2a4a6a'}
                      stroke={isSelected ? '#ffffff' : '#4a90d9'}
                      strokeWidth={2}
                    />
                    <text
                      x={pixel.x}
                      y={pixel.y + 24}
                      textAnchor="middle"
                      fill="white"
                      fontSize="10"
                      fontWeight="bold"
                    >
                      {squad.name[0]}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* SIDE PANEL */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          {/* Selected Squad */}
          {selectedSquad && (
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span className="font-semibold">{selectedSquad.name}</span>
              </div>
              <div className="text-sm text-gray-400 mb-2">
                Location: {sectors.find(s => s.id === selectedSquad.currentSector)?.name}
              </div>
              <div className="text-sm">
                Members: {selectedSquad.members.join(', ')}
              </div>
              <div className="text-sm text-gray-400 mt-1">
                Status: {selectedSquad.status}
              </div>
            </div>
          )}

          {/* Selected Sector */}
          {selectedSector && (
            <div className="p-4 flex-1 overflow-y-auto">
              <div className="font-semibold mb-2">{selectedSector.name}</div>
              <div className="text-sm text-gray-400 mb-4">
                Sector {selectedSector.id}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Terrain:</span>
                  <span>{selectedSector.terrain} {getTerrainEmoji(selectedSector.terrain)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Control:</span>
                  <span className={
                    selectedSector.controlledBy === 'player' ? 'text-blue-400' :
                    selectedSector.controlledBy === 'enemy' ? 'text-red-400' :
                    'text-gray-400'
                  }>
                    {selectedSector.controlledBy || 'Neutral'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Enemies:</span>
                  <span className={selectedSector.enemyLevel !== 'none' ? 'text-red-400' : ''}>
                    {selectedSector.enemyLevel} ({selectedSector.enemyCount})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Travel Time:</span>
                  <span>{selectedSector.travelTimeHours}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Vehicle:</span>
                  <span>{selectedSector.vehicleAccessible ? 'Yes' : 'No'}</span>
                </div>
              </div>

              {/* Facilities */}
              {selectedSector.facilities.length > 0 && (
                <div className="mt-4">
                  <div className="text-gray-400 mb-2">Facilities:</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedSector.facilities.map(f => (
                      <span key={f} className="px-2 py-1 bg-gray-700 rounded text-xs">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 space-y-2">
                {selectedSquad && selectedSector.id !== selectedSquad.currentSector && (
                  <button
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded"
                    onClick={() => setShowTravelDialog(true)}
                  >
                    Travel Here
                  </button>
                )}
                {selectedSector.missionAvailable && (
                  <button className="w-full py-2 bg-yellow-600 hover:bg-yellow-500 rounded">
                    Start Mission
                  </button>
                )}
                <button className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded">
                  View Details
                </button>
              </div>
            </div>
          )}

          {!selectedSector && (
            <div className="p-4 text-gray-500 text-center">
              Click a sector to view details
            </div>
          )}
        </div>
      </div>

      {/* Squad selector */}
      <div className="h-16 bg-gray-800 border-t border-gray-700 flex items-center gap-4 px-4">
        {squads.map(squad => (
          <button
            key={squad.id}
            className={`flex items-center gap-2 px-4 py-2 rounded ${
              selectedSquad?.id === squad.id
                ? 'bg-blue-600'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            onClick={() => setSelectedSquad(squad)}
          >
            <Users className="w-4 h-4" />
            <span>{squad.name}</span>
            <span className="text-xs text-gray-400">({squad.members.length})</span>
          </button>
        ))}
      </div>

      {/* Travel Dialog */}
      {showTravelDialog && selectedSector && selectedSquad && (
        <TravelDialog
          squad={selectedSquad}
          destination={selectedSector}
          currentSector={sectors.find(s => s.id === selectedSquad.currentSector)!}
          onConfirm={startTravel}
          onCancel={() => setShowTravelDialog(false)}
        />
      )}
    </div>
  );
};

// ============================================================================
// TRAVEL DIALOG
// ============================================================================

interface TravelDialogProps {
  squad: Squad;
  destination: Sector;
  currentSector: Sector;
  onConfirm: () => void;
  onCancel: () => void;
}

const TravelDialog: React.FC<TravelDialogProps> = ({
  squad,
  destination,
  currentSector,
  onConfirm,
  onCancel,
}) => {
  const distance = hexDistance(currentSector.coord, destination.coord);
  const travelTime = distance * destination.travelTimeHours;
  const hasRisk = destination.enemyLevel !== 'none';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-96">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <span className="font-semibold">Travel to {destination.name}</span>
          <button onClick={onCancel} className="hover:bg-gray-700 p-1 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-blue-400" />
            <span>{squad.name}</span>
          </div>

          <div className="bg-gray-700 p-3 rounded">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Distance:</span>
              <span>{distance} sector(s)</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Terrain:</span>
              <span>{destination.terrain}</span>
            </div>
          </div>

          <div className="bg-gray-700 p-3 rounded">
            <div className="text-sm text-gray-400 mb-2">Travel Time:</div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="font-semibold">{travelTime} hours</span>
              <span className="text-gray-400 text-sm">
                ({Math.round(travelTime * 2)} sec real)
              </span>
            </div>
          </div>

          {hasRisk && (
            <div className="bg-red-900 bg-opacity-50 p-3 rounded flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5" />
              <div>
                <div className="font-semibold text-red-400">Warning</div>
                <div className="text-sm">
                  Enemy presence detected: {destination.enemyLevel}
                  <br />
                  Estimated strength: {destination.enemyCount} hostiles
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded"
              onClick={onConfirm}
            >
              Confirm Travel
            </button>
            <button
              className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded"
              onClick={onCancel}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HexWorldMap;
