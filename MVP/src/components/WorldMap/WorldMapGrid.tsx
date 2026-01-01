import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { cities, City } from '../../data/cities';
import { getCountryByName } from '../../data/countries';
import { useGameStore, TravelingUnit, FleetVehicle, TIME_SPEEDS, TimeSpeed } from '../../stores/enhancedGameStore';
import CityActionsPanel from './CityActionsPanel';
// TC-004: Territory display imports
import {
  getSectorControl,
  getControlLevel,
  getControlColor,
  TerritoryControl,
  FactionId,
} from '../../data/territorySystem';
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Grid,
  ZoomIn,
  ZoomOut,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Play,
  Pause,
  FastForward,
  Smartphone,
  Laptop,
  Settings,
  Users,
  MapPin,
  Car,
  Plane,
  Ship,
  Clock,
  Navigation,
  Heart,
  Swords,
  Building2,
  AlertTriangle,
  UserPlus,
  UserMinus,
  Timer,
  Target,
  Crosshair,
} from 'lucide-react';
import { RetroButton, RetroBadge, RetroTabs, RetroTabPanel, cn } from '../ui';

// Grid configuration - 40 columns x 24 rows (matches V0)
const GRID_COLS = 40;
const GRID_ROWS = 24;
const GRID_CELL_SIZE = 40;
const MAP_WIDTH = GRID_COLS * GRID_CELL_SIZE;
const MAP_HEIGHT = GRID_ROWS * GRID_CELL_SIZE;
const ROW_LABEL_WIDTH = 24;
const COL_LABEL_HEIGHT = 20;
const ROW_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWX'.split('');
const ZOOM_LEVELS = [1, 1.25, 1.5, 1.75, 2];

/**
 * Parse city sector code like "LJ5", "LD4", "GA4"
 * Format: [Row Letter][Column Letter][SubSector Number]
 * - Row: A-X (24 rows) maps to grid row 0-23
 * - Col: A-Z (26 letters) scaled to 40 columns
 * - SubSector: Optional numeric suffix (ignored for grid mapping)
 */
function parseCitySector(sector: string): { row: number; col: number } | null {
  if (!sector || sector.length < 2) return null;

  const rowLetter = sector.charAt(0).toUpperCase();
  const colLetter = sector.charAt(1).toUpperCase();

  // Row: A-X maps to 0-23
  const rowIndex = ROW_LABELS.indexOf(rowLetter);
  if (rowIndex < 0) return null;

  // Column: A-Z (26 letters) scaled to 40 columns
  const colLetterIndex = colLetter.charCodeAt(0) - 'A'.charCodeAt(0);
  if (colLetterIndex < 0 || colLetterIndex > 25) return null;

  // Scale 26 letters to 40 columns (A=0, Z≈39)
  const colIndex = Math.round(colLetterIndex * (39 / 25));

  return { row: rowIndex, col: colIndex };
}

interface GridCell {
  id: string;
  row: number;
  col: number;
  region: string;
  countries: string[];
  cities: City[];
  terrain?: string;
  climate?: string;
  threatLevel?: number;
}

type TabType = 'character' | 'map' | 'vehicles';

// Time Display Component - Retro NeoBrutalism Style
const TimeDisplay: React.FC<{
  day: number;
  year: number;
  dayOfWeek: string;
  time: string;
  timeOfDay: 'morning' | 'noon' | 'evening' | 'night';
  isPaused: boolean;
  speed: TimeSpeed;
  onTogglePause: () => void;
  onSpeedChange: () => void;
}> = ({ day, year, dayOfWeek, time, timeOfDay, isPaused, speed, onTogglePause, onSpeedChange }) => {
  const isNight = timeOfDay === 'night' || timeOfDay === 'evening';
  const speedLabel = TIME_SPEEDS[speed]?.label || 'PAUSED';

  return (
    <div className="flex items-center gap-2">
      {/* Play/Pause and Speed Controls */}
      <div className="flex items-center gap-1 bg-surface rounded-lg p-1 border-2 border-black shadow-retro-sm">
        <button
          onClick={onTogglePause}
          className={cn(
            "p-1.5 rounded-md border-2 border-black transition-all font-bold",
            isPaused
              ? 'bg-success text-white hover:bg-success/80 shadow-[2px_2px_0_0_#000] hover:translate-y-[-1px]'
              : 'bg-warning text-black hover:bg-warning/80 shadow-[2px_2px_0_0_#000] hover:translate-y-[-1px]'
          )}
          title={isPaused ? 'Play' : 'Pause'}
        >
          {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
        </button>
        <button
          onClick={onSpeedChange}
          className="p-1.5 rounded-md bg-primary text-white border-2 border-black shadow-[2px_2px_0_0_#000] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_0_#000] transition-all flex items-center gap-0.5"
          title="Change speed (1X → 10X → 60X → 360X)"
        >
          <FastForward className="w-3 h-3" />
          <span className="text-[10px] font-bold">{speedLabel}</span>
        </button>
      </div>

      {/* Time Display */}
      <div className="flex items-center gap-2 bg-surface rounded-lg px-3 py-1.5 border-2 border-black shadow-retro-sm">
        <div
          className="w-3 h-3 rounded-full border border-black"
          style={{
            backgroundColor: isNight ? '#6366f1' : '#EAB308',
            boxShadow: isNight ? '0 0 6px rgba(99, 102, 241, 0.8)' : '0 0 8px rgba(234, 179, 8, 0.8)',
          }}
        />
        <div className="flex flex-col items-start leading-tight">
          <span className="text-foreground font-mono text-sm font-bold">{time}</span>
          <span className="text-primary-light text-[10px] uppercase">{dayOfWeek}</span>
        </div>
      </div>

      {/* Day/Year Display */}
      <div className="flex flex-col items-start bg-surface rounded-lg px-3 py-1 border-2 border-black shadow-retro-sm">
        <span className="text-foreground font-mono text-sm font-bold leading-tight">Day {day}</span>
        <span className="text-primary text-[10px] uppercase leading-tight">Year {year}</span>
      </div>
    </div>
  );
};

// Messages Panel Component (Right Side)
const MessagesPanel: React.FC<{
  characters: any[];
  selectedCell: GridCell | null;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onCharacterClick: (char: any) => void;
  vehicles: FleetVehicle[];
  travelingUnits: TravelingUnit[];
  gameTime: string;
  gameDay: number;
  gameYear: number;
  dayOfWeek: string;
  timeOfDay: 'morning' | 'noon' | 'evening' | 'night';
  isPaused: boolean;
  timeSpeed: number;
  onTogglePause: () => void;
  onSpeedChange: () => void;
  onShowPhone: () => void;
  onShowLaptop: () => void;
  showPhone: boolean;
  showLaptop: boolean;
  onMoveCharacter: (charId: string, targetSector: string) => void;
  onAssignToVehicle: (charId: string, vehicleId: string) => void;
  onUnassignFromVehicle: (charId: string, vehicleId: string) => void;
  // New travel props
  selectedCharacterIds: string[];
  selectedVehicleId: string | null;
  onCharacterSelect: (charId: string, multiSelect: boolean) => void;
  onVehicleSelect: (vehicleId: string) => void;
  onStartTravel: () => void;
  onCancelTravel: (unitId: string) => void;
  sectorMissions: any[];
}> = ({
  characters,
  selectedCell,
  activeTab,
  setActiveTab,
  onCharacterClick,
  vehicles,
  travelingUnits,
  gameTime,
  gameDay,
  gameYear,
  dayOfWeek,
  timeOfDay,
  isPaused,
  timeSpeed,
  onTogglePause,
  onSpeedChange,
  onShowPhone,
  onShowLaptop,
  showPhone,
  showLaptop,
  onMoveCharacter,
  onAssignToVehicle,
  onUnassignFromVehicle,
  selectedCharacterIds,
  selectedVehicleId,
  onCharacterSelect,
  onVehicleSelect,
  onStartTravel,
  onCancelTravel,
  sectorMissions,
}) => {
  const [isMessagesExpanded, setIsMessagesExpanded] = useState(true);
  const [expandedVehicleId, setExpandedVehicleId] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  // Get country for selected city (for city actions)
  const selectedCityCountry = useMemo(() => {
    if (!selectedCity) return null;
    return getCountryByName(selectedCity.country);
  }, [selectedCity]);

  // Get budget and fame from store for city actions
  const { budget: playerBudget, playerFame } = useGameStore();

  // Helper to format ETA
  const formatETA = (estimatedArrival: number) => {
    const now = Date.now();
    const remaining = Math.max(0, estimatedArrival - now);
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  // Get characters not in any vehicle
  const availableCharacters = characters.filter(char =>
    char.status === 'ready' &&
    !vehicles.some(v => v.assignedCharacters.includes(char.id))
  );

  const getTimeOfDayIcon = () => {
    switch (timeOfDay) {
      case 'morning': return <Sunrise className="w-4 h-4 text-orange-400" />;
      case 'noon': return <Sun className="w-4 h-4 text-yellow-400" />;
      case 'evening': return <Sunset className="w-4 h-4 text-orange-500" />;
      case 'night': return <Moon className="w-4 h-4 text-indigo-300" />;
    }
  };

  const getVehicleIcon = (type: FleetVehicle['type']) => {
    switch (type) {
      case 'aircraft': return <Plane className="w-4 h-4" />;
      case 'ground': return <Car className="w-4 h-4" />;
      case 'sea': return <Ship className="w-4 h-4" />;
      default: return <Car className="w-4 h-4" />;
    }
  };

  const getVehicleStatusColor = (status: FleetVehicle['status']) => {
    switch (status) {
      case 'available': return 'bg-green-400';
      case 'traveling': return 'bg-orange-400';
      case 'deployed': return 'bg-purple-400';
      case 'maintenance': return 'bg-yellow-400';
      case 'damaged': return 'bg-red-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready': return <Clock className="w-5 h-5 text-green-400" />;
      case 'traveling': return <Navigation className="w-5 h-5 text-orange-400" />;
      case 'on_mission': return <Swords className="w-5 h-5 text-orange-400" />;
      case 'injured': return <Heart className="w-5 h-5 text-red-400" />;
      default: return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full h-full">
      {/* Messages Section - Retro Style */}
      <div className="bg-card border-2 border-black rounded-lg overflow-hidden shadow-retro-sm">
        <button
          onClick={() => setIsMessagesExpanded(!isMessagesExpanded)}
          className="w-full flex items-center justify-between px-3 py-2 bg-surface hover:bg-surface-light transition-colors border-b-2 border-black"
        >
          <span className="text-foreground font-bold text-sm tracking-wide">MESSAGES</span>
          <div className="flex items-center gap-2">
            <RetroBadge variant="primary" size="sm">0 new</RetroBadge>
            <span className="text-foreground text-sm font-bold">{isMessagesExpanded ? '−' : '+'}</span>
          </div>
        </button>
        {isMessagesExpanded && (
          <div className="max-h-[120px] overflow-y-auto p-3 bg-background">
            <p className="text-muted-foreground text-xs text-center italic">No messages yet</p>
          </div>
        )}
      </div>

      {/* Tabbed Team/Map/Vehicles Section - Retro NeoBrutalism */}
      <div className="flex-1 bg-primary border-2 border-black rounded-lg overflow-hidden flex flex-col shadow-retro">
        <div className="flex border-b-2 border-black">
          {[
            { id: 'character' as TabType, label: 'TEAM', icon: <Users className="w-4 h-4" /> },
            { id: 'map' as TabType, label: 'MAP', icon: <MapPin className="w-4 h-4" /> },
            { id: 'vehicles' as TabType, label: 'VEHICLES', icon: <Car className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-bold tracking-wide transition-colors",
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground border-b-2 border-black'
                  : 'bg-black/20 text-primary-foreground/70 hover:bg-black/10'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'character' && (
            <div className="bg-background">
              {/* Selection Summary */}
              {selectedCharacterIds.length > 0 && (
                <div className="px-3 py-2 bg-accent border-b-2 border-black">
                  <div className="flex items-center justify-between">
                    <span className="text-black font-bold text-xs">
                      {selectedCharacterIds.length} SELECTED
                    </span>
                    {selectedCell && (
                      <RetroButton
                        variant="success"
                        size="sm"
                        onClick={onStartTravel}
                      >
                        → {selectedCell.id}
                      </RetroButton>
                    )}
                  </div>
                </div>
              )}

              <div className="px-3 py-2 bg-primary/80 border-b-2 border-black">
                <div className="flex items-center justify-between">
                  <h3 className="text-primary-foreground font-bold text-sm uppercase tracking-wider">Team Roster</h3>
                  <span className="text-primary-foreground/70 text-[10px]">Click to select • Shift+Click multi</span>
                </div>
              </div>
              <div className="divide-y-2 divide-black/20">
                {characters.map((char) => {
                  const isSelected = selectedCharacterIds.includes(char.id);
                  const canTravel = char.status === 'ready';
                  return (
                    <div
                      key={char.id}
                      onClick={(e) => {
                        if (canTravel) {
                          onCharacterSelect(char.id, e.shiftKey);
                        }
                      }}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2 transition-colors",
                        canTravel ? 'cursor-pointer hover:bg-primary/10' : 'opacity-50 cursor-not-allowed',
                        isSelected && 'bg-accent/30 border-l-4 border-accent pl-3'
                      )}
                    >
                      <div className="relative">
                        <div className={cn(
                          "w-10 h-10 rounded-lg bg-surface border-2 flex items-center justify-center shadow-retro-sm",
                          isSelected ? 'border-accent' : 'border-black'
                        )}>
                          {getStatusIcon(char.status)}
                        </div>
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full flex items-center justify-center border border-black">
                            <span className="text-[10px] text-black font-bold">✓</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("font-bold text-sm truncate", isSelected ? 'text-accent' : 'text-foreground')}>
                          {char.name}
                        </p>
                        <p className="text-muted-foreground text-xs truncate">{char.status?.toUpperCase()}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-primary font-mono font-bold text-sm">{char.sector || 'HQ'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Traveling Units */}
              {travelingUnits.length > 0 && (
                <div className="mt-2 border-t-2 border-black">
                  <div className="px-3 py-2 bg-secondary border-b-2 border-black">
                    <h3 className="text-secondary-foreground font-bold text-xs uppercase tracking-wider">
                      En Route ({travelingUnits.length})
                    </h3>
                  </div>
                  <div className="divide-y-2 divide-black/20 bg-background">
                    {travelingUnits.map((unit) => (
                      <div
                        key={unit.id}
                        className="flex items-center gap-3 px-3 py-2 bg-secondary/10"
                      >
                        <div className="w-10 h-10 rounded-lg bg-secondary border-2 border-black flex items-center justify-center shadow-retro-sm">
                          <Navigation className="w-5 h-5 text-secondary-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-foreground font-bold text-sm truncate">{unit.name}</p>
                            <div className="flex items-center gap-1 text-accent">
                              <Timer className="w-3 h-3" />
                              <span className="text-[10px] font-mono font-bold">{formatETA(unit.estimatedArrival)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-xs">{unit.originSector} → {unit.destinationSector}</span>
                            <span className="text-muted-foreground/60 text-[10px]">({Math.round(unit.progress)}%)</span>
                          </div>
                          <div className="w-full h-1.5 bg-surface rounded-full mt-1 overflow-hidden border border-black">
                            <div className="h-full bg-gradient-to-r from-primary to-secondary transition-all" style={{ width: `${unit.progress}%` }} />
                          </div>
                        </div>
                        <RetroButton
                          variant="destructive"
                          size="sm"
                          onClick={() => onCancelTravel(unit.id)}
                        >
                          Cancel
                        </RetroButton>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'map' && (
            <div className="p-3 min-h-[180px] bg-background">
              {selectedCell ? (
                <div className="space-y-2">
                  <div className="bg-primary rounded-lg px-3 py-2 border-2 border-black shadow-retro-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-primary-foreground font-bold text-base tracking-wider">
                        SECTOR {selectedCell.id}
                      </span>
                      <span className="text-primary-foreground/80 text-xs">
                        Col {selectedCell.col + 1} / Row {ROW_LABELS[selectedCell.row]}
                      </span>
                    </div>
                  </div>

                  <div className="bg-surface rounded-lg px-3 py-2 border-2 border-black">
                    <p className="text-xs text-muted-foreground uppercase">Region</p>
                    <p className="text-foreground font-bold text-lg">{selectedCell.region}</p>
                  </div>

                  {selectedCell.countries.length > 0 && (
                    <div className="bg-surface rounded-lg px-3 py-2 border-2 border-black">
                      <p className="text-xs text-muted-foreground uppercase">Countries</p>
                      <p className="text-foreground text-sm">{selectedCell.countries.join(', ')}</p>
                    </div>
                  )}

                  {selectedCell.cities.length > 0 && (
                    <div className="bg-surface rounded-lg px-3 py-2 border-2 border-black">
                      <p className="text-xs text-muted-foreground uppercase flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> Cities ({selectedCell.cities.length}) - Click to view actions
                      </p>
                      <div className="space-y-1 mt-1 max-h-32 overflow-y-auto">
                        {selectedCell.cities.slice(0, 8).map((city, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedCity(selectedCity?.name === city.name ? null : city)}
                            className={cn(
                              "w-full flex items-center justify-between px-2 py-1 rounded transition-colors text-left",
                              selectedCity?.name === city.name
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-surface-light"
                            )}
                          >
                            <span className={cn(
                              "text-sm font-medium",
                              selectedCity?.name === city.name ? "text-primary-foreground" : "text-foreground"
                            )}>
                              {city.name}
                            </span>
                            <span className={cn(
                              "text-xs",
                              selectedCity?.name === city.name ? "text-primary-foreground/70" : "text-muted-foreground"
                            )}>
                              Pop: {(city.population / 1000000).toFixed(1)}M
                            </span>
                          </button>
                        ))}
                        {selectedCell.cities.length > 8 && (
                          <p className="text-muted-foreground/50 text-xs px-2">+{selectedCell.cities.length - 8} more cities</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-surface rounded-lg px-3 py-2 border-2 border-black">
                      <p className="text-[10px] text-muted-foreground uppercase">Terrain</p>
                      <p className="text-foreground text-xs">{selectedCell.terrain || 'Various'}</p>
                    </div>
                    <div className="bg-surface rounded-lg px-3 py-2 border-2 border-black">
                      <p className="text-[10px] text-muted-foreground uppercase">Climate</p>
                      <p className="text-foreground text-xs">{selectedCell.climate || 'Varied'}</p>
                    </div>
                  </div>

                  {/* Available Missions */}
                  {sectorMissions.length > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
                        <Target className="w-3 h-3" /> Available Missions ({sectorMissions.length})
                      </div>
                      <div className="space-y-1.5 max-h-32 overflow-y-auto">
                        {sectorMissions.slice(0, 5).map((mission) => (
                          <div
                            key={mission.id}
                            className="bg-surface rounded-lg px-2 py-1.5 border border-black/50 hover:border-primary cursor-pointer flex items-center justify-between"
                            onClick={() => {
                              acceptMission(mission.id);
                              console.log('[MISSION] Accepted:', mission.name);
                            }}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-foreground text-xs font-medium truncate">{mission.name}</p>
                              <p className="text-muted-foreground text-[10px] truncate">
                                💰 ${mission.reward.toLocaleString()} • ⚠️ {mission.difficulty}
                              </p>
                            </div>
                            <Crosshair className="w-4 h-4 text-primary ml-2 flex-shrink-0" />
                          </div>
                        ))}
                        {sectorMissions.length > 5 && (
                          <p className="text-muted-foreground/50 text-[10px] text-center">
                            +{sectorMissions.length - 5} more missions
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-3">
                    <RetroButton variant="secondary" size="sm" className="flex-1">
                      DEPLOY SQUAD
                    </RetroButton>
                    <RetroButton variant="destructive" size="sm" className="flex-1">
                      ENTER COMBAT
                    </RetroButton>
                  </div>

                  {/* City Actions Panel */}
                  {selectedCity && (
                    <div className="mt-3">
                      <CityActionsPanel
                        selectedCity={selectedCity}
                        country={selectedCityCountry}
                        playerFame={playerFame}
                        playerBudget={playerBudget}
                        onActionSelect={(action, city) => {
                          console.log('[CITY ACTION] Selected:', action.name, 'in', city.name);
                          // TODO: Wire to game store action execution
                        }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                  <div className="w-16 h-16 rounded-xl bg-surface border-2 border-black flex items-center justify-center shadow-retro-sm mb-3">
                    <MapPin className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-foreground font-semibold">No Sector Selected</p>
                  <p className="text-muted-foreground text-xs mt-1">Click a sector on the map</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'vehicles' && (
            <div className="flex flex-col h-full bg-background">
              {/* Selected Vehicle for Travel */}
              {selectedVehicleId && (
                <div className="px-3 py-2 bg-secondary border-b-2 border-black flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-secondary-foreground font-bold text-xs">
                      {vehicles.find(v => v.id === selectedVehicleId)?.name} SELECTED FOR TRAVEL
                    </span>
                    <RetroButton
                      variant="destructive"
                      size="sm"
                      shadow="sm"
                      onClick={() => onVehicleSelect(selectedVehicleId)}
                    >
                      Clear
                    </RetroButton>
                  </div>
                </div>
              )}

              <div className="px-3 py-2 bg-primary/80 border-b-2 border-black flex-shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-primary-foreground font-bold text-sm tracking-wider">FLEET MANAGEMENT</span>
                  <span className="text-primary-foreground/70 text-[10px]">Click vehicle to manage crew</span>
                </div>
              </div>

              {/* Vehicle List */}
              <div className="flex-1 overflow-y-auto">
                {vehicles.map((vehicle) => {
                  const isExpanded = expandedVehicleId === vehicle.id;
                  const isSelectedForTravel = selectedVehicleId === vehicle.id;
                  const canSelect = vehicle.status === 'available';
                  const assignedChars = characters.filter(c => vehicle.assignedCharacters.includes(c.id));
                  const seatsUsed = vehicle.assignedCharacters.length;

                  return (
                    <div key={vehicle.id} className="border-b-2 border-black/20">
                      {/* Vehicle Header */}
                      <div
                        onClick={() => setExpandedVehicleId(isExpanded ? null : vehicle.id)}
                        className={cn(
                          "flex items-center px-3 py-2 transition-colors cursor-pointer hover:bg-primary/10",
                          isSelectedForTravel && 'bg-secondary/30 border-l-4 border-secondary'
                        )}
                      >
                        <div className={cn("mr-2", isSelectedForTravel ? 'text-secondary' : 'text-foreground')}>
                          {getVehicleIcon(vehicle.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-xs font-bold truncate", isSelectedForTravel ? 'text-secondary' : 'text-foreground')}>
                            {vehicle.name}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-[10px]">{vehicle.speed} mph</span>
                            <span className="text-foreground/80 text-[10px] font-medium">
                              {seatsUsed}/{vehicle.capacity} crew
                            </span>
                          </div>
                        </div>
                        <div className="text-right mr-2">
                          <p className="text-primary font-mono text-xs font-bold">{vehicle.currentSector}</p>
                        </div>
                        <div
                          className={`w-3 h-3 rounded-full border border-black flex-shrink-0 ${getVehicleStatusColor(vehicle.status)}`}
                          title={vehicle.status}
                        />
                        <ChevronDown className={cn("w-4 h-4 ml-2 text-muted-foreground transition-transform", isExpanded && 'rotate-180')} />
                      </div>

                      {/* Expanded Content - Crew Management */}
                      {isExpanded && (
                        <div className="bg-surface/50 px-3 py-2 border-t border-black/20">
                          {/* Select for Travel Button */}
                          {canSelect && (
                            <RetroButton
                              variant={isSelectedForTravel ? 'secondary' : 'outline'}
                              size="sm"
                              className="w-full mb-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                onVehicleSelect(vehicle.id);
                              }}
                            >
                              {isSelectedForTravel ? '✓ SELECTED FOR TRAVEL' : 'SELECT FOR TRAVEL'}
                            </RetroButton>
                          )}

                          {/* Current Crew */}
                          <div className="mb-2">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Current Crew ({seatsUsed})</p>
                            {assignedChars.length === 0 ? (
                              <p className="text-muted-foreground/50 text-xs italic">No crew assigned</p>
                            ) : (
                              <div className="space-y-1">
                                {assignedChars.map(char => (
                                  <div key={char.id} className="flex items-center justify-between bg-surface rounded-lg px-2 py-1 border border-black/30">
                                    <span className="text-foreground text-xs font-medium">{char.name}</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onUnassignFromVehicle(char.id, vehicle.id);
                                      }}
                                      className="p-0.5 rounded bg-destructive hover:bg-destructive/80 text-white border border-black"
                                      title="Remove from vehicle"
                                    >
                                      <UserMinus className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Add Crew Section */}
                          {seatsUsed < vehicle.capacity && availableCharacters.length > 0 && (
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Add Crew</p>
                              <div className="space-y-1 max-h-24 overflow-y-auto">
                                {availableCharacters.map(char => (
                                  <div key={char.id} className="flex items-center justify-between bg-success/20 rounded-lg px-2 py-1 border border-black/30">
                                    <span className="text-foreground text-xs">{char.name}</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onAssignToVehicle(char.id, vehicle.id);
                                      }}
                                      className="p-0.5 rounded bg-success hover:bg-success/80 text-white border border-black"
                                      title="Add to vehicle"
                                    >
                                      <UserPlus className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {seatsUsed >= vehicle.capacity && (
                            <p className="text-warning text-[10px] font-bold">Vehicle at full capacity</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Status Legend */}
              <div className="px-3 py-2 border-t-2 border-black bg-surface flex flex-wrap gap-3 text-[10px] flex-shrink-0 text-foreground">
                <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-success border border-black" /> Ready</span>
                <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-secondary border border-black" /> Traveling</span>
                <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-warning border border-black" /> Maintenance</span>
              </div>

              {/* Travel Summary */}
              {selectedCharacterIds.length > 0 && selectedVehicleId && selectedCell && (
                <div className="px-3 py-2 bg-success border-t-2 border-black flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-success-foreground text-xs font-bold">
                      {selectedCharacterIds.length} chars + {vehicles.find(v => v.id === selectedVehicleId)?.name}
                    </span>
                    <RetroButton
                      variant="primary"
                      size="sm"
                      onClick={onStartTravel}
                    >
                      DEPLOY → {selectedCell.id}
                    </RetroButton>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls - Retro Style */}
      <div className="bg-card border-2 border-black rounded-lg p-2 shadow-retro-sm">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-2">
            {getTimeOfDayIcon()}
            <span className="text-foreground font-mono text-sm">{gameTime}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-primary">{dayOfWeek}</span>
            <span className="text-foreground font-bold">Day {gameDay}</span>
            <span className="text-muted-foreground">Year {gameYear}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 mb-2">
          <RetroButton
            variant={isPaused ? 'success' : 'warning'}
            size="sm"
            className="flex-1"
            onClick={onTogglePause}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            <span className="text-xs font-bold">{isPaused ? 'PLAY' : 'PAUSE'}</span>
          </RetroButton>
          <RetroButton
            variant="primary"
            size="sm"
            onClick={onSpeedChange}
          >
            <FastForward className="w-4 h-4" />
            <span className="text-xs font-bold">{timeSpeed}X</span>
          </RetroButton>
        </div>

        <div className="flex items-center gap-2">
          <RetroButton
            variant={showPhone ? 'secondary' : 'outline'}
            size="sm"
            className="flex-1"
            onClick={onShowPhone}
          >
            <Smartphone className="w-4 h-4" />
            <span className="text-xs font-bold">PHONE</span>
          </RetroButton>
          <RetroButton
            variant={showLaptop ? 'secondary' : 'outline'}
            size="sm"
            className="flex-1"
            onClick={onShowLaptop}
          >
            <Laptop className="w-4 h-4" />
            <span className="text-xs font-bold">LAPTOP</span>
          </RetroButton>
          <RetroButton variant="ghost" size="icon" shadow="none">
            <Settings className="w-4 h-4" />
          </RetroButton>
        </div>
      </div>
    </div>
  );
};

// Main World Map Component
export const WorldMapGrid: React.FC = () => {
  const [selectedCell, setSelectedCell] = useState<GridCell | null>(null);
  const [hoveredCell, setHoveredCell] = useState<GridCell | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('character');

  // Map controls
  const [showGrid, setShowGrid] = useState(true);
  const [gridColor, setGridColor] = useState('cyan');
  const [mapScale, setMapScale] = useState(ZOOM_LEVELS[0]);
  const [mapPosition, setMapPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [controlsMinimized, setControlsMinimized] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // UI state
  const [showPhone, setShowPhone] = useState(false);
  const [showLaptop, setShowLaptop] = useState(false);

  // Get store data - including time system
  const {
    characters,
    budget,
    selectedFaction,
    selectedCountry,
    setCurrentView,
    travelingUnits,
    fleetVehicles,
    startTravel,
    updateTravelProgress,
    cancelTravel,
    assignCharacterToVehicle,
    unassignCharacterFromVehicle,
    // Time system from store
    gameTime,
    timeSpeed,
    isTimePaused,
    togglePause,
    cycleTimeSpeed,
    tickTime,
    getFormattedTime,
    // Mission system
    getMissionsForSector,
    generateMissionsForSector,
    acceptMission,
    activeMissions,
  } = useGameStore();

  // Selected characters for travel
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  // Generate missions when a sector is selected
  useEffect(() => {
    if (selectedCell) {
      // Generate missions for the selected sector if none exist
      const existingMissions = getMissionsForSector(selectedCell.id);
      if (!existingMissions || existingMissions.length === 0) {
        generateMissionsForSector(selectedCell.id);
      }
    }
  }, [selectedCell?.id, getMissionsForSector, generateMissionsForSector]);

  // Get missions for currently selected sector
  const sectorMissions = selectedCell ? getMissionsForSector(selectedCell.id) : [];

  // Update travel progress periodically
  useEffect(() => {
    if (travelingUnits.length === 0) return;
    const interval = setInterval(() => {
      updateTravelProgress();
    }, 1000);
    return () => clearInterval(interval);
  }, [travelingUnits.length, updateTravelProgress]);

  // Calculate current position for a traveling unit
  const getTravelingUnitPosition = useCallback((unit: TravelingUnit) => {
    const origin = {
      row: ROW_LABELS.indexOf(unit.originSector.charAt(0)),
      col: parseInt(unit.originSector.slice(1)) - 1
    };
    const dest = {
      row: ROW_LABELS.indexOf(unit.destinationSector.charAt(0)),
      col: parseInt(unit.destinationSector.slice(1)) - 1
    };
    const progress = unit.progress / 100;

    const currentRow = origin.row + (dest.row - origin.row) * progress;
    const currentCol = origin.col + (dest.col - origin.col) * progress;

    return {
      x: currentCol * GRID_CELL_SIZE + GRID_CELL_SIZE / 2,
      y: currentRow * GRID_CELL_SIZE + GRID_CELL_SIZE / 2
    };
  }, []);

  // Get formatted time from store
  const { time: currentTime, dayOfWeek, timeOfDay } = getFormattedTime();
  const currentDay = gameTime.day;
  const currentYear = gameTime.year;

  // Time progression - calls store's tickTime every second
  useEffect(() => {
    if (isTimePaused) return;
    const interval = setInterval(() => {
      tickTime();
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimePaused, tickTime]);

  // Build grid data
  const gridData = useMemo(() => {
    const grid: GridCell[] = [];

    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const id = `${ROW_LABELS[row]}${col + 1}`;

        // Find cities that might be in this sector
        // Parse city sector codes (e.g., "LJ5" = Row L, Col J scaled to grid)
        const citiesInSector = cities.filter(city => {
          const parsed = parseCitySector(city.sector);
          if (!parsed) return false;
          // Match if city is in this row and within 1 column of this cell
          return parsed.row === row && Math.abs(parsed.col - col) <= 1;
        });

        const countriesInSector = [...new Set(citiesInSector.map(c => c.country))];

        // Determine region based on position
        const x = col / GRID_COLS;
        const y = row / GRID_ROWS;
        let region = 'Ocean';

        if (y < 0.15) region = 'Arctic';
        else if (y < 0.35) {
          if (x < 0.25) region = 'North America';
          else if (x < 0.45) region = 'North Atlantic';
          else if (x < 0.6) region = 'Europe';
          else if (x < 0.85) region = 'Russia';
          else region = 'North Pacific';
        } else if (y < 0.55) {
          if (x < 0.2) region = 'Central America';
          else if (x < 0.4) region = 'Atlantic Ocean';
          else if (x < 0.55) region = 'Africa';
          else if (x < 0.7) region = 'Middle East';
          else if (x < 0.85) region = 'Asia';
          else region = 'Pacific Ocean';
        } else if (y < 0.75) {
          if (x < 0.25) region = 'South America';
          else if (x < 0.4) region = 'Atlantic Ocean';
          else if (x < 0.6) region = 'Africa';
          else if (x < 0.75) region = 'Indian Ocean';
          else region = 'Oceania';
        } else {
          region = 'Southern Ocean';
        }

        grid.push({
          id,
          row,
          col,
          region,
          countries: countriesInSector,
          cities: citiesInSector,
          terrain: citiesInSector.length > 0 ? 'Urban/Mixed' : 'Wilderness',
          climate: y < 0.2 ? 'Polar' : y < 0.4 ? 'Temperate' : y < 0.6 ? 'Subtropical' : y < 0.8 ? 'Tropical' : 'Polar',
        });
      }
    }
    return grid;
  }, []);

  // Map interactions
  const constrainMapPosition = useCallback((x: number, y: number, scale: number) => {
    const container = mapContainerRef.current;
    if (!container) return { x, y };

    const containerWidth = container.clientWidth - ROW_LABEL_WIDTH;
    const containerHeight = container.clientHeight - COL_LABEL_HEIGHT;
    const scaledMapWidth = MAP_WIDTH * scale;
    const scaledMapHeight = MAP_HEIGHT * scale;

    const minX = Math.min(0, containerWidth - scaledMapWidth);
    const minY = Math.min(0, containerHeight - scaledMapHeight);

    return {
      x: Math.max(minX, Math.min(0, x)),
      y: Math.max(minY, Math.min(0, y)),
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - mapPosition.x, y: e.clientY - mapPosition.y });
  }, [mapPosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    const constrained = constrainMapPosition(newX, newY, mapScale);
    setMapPosition(constrained);
  }, [isDragging, dragStart, constrainMapPosition, mapScale]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleZoomIn = useCallback(() => {
    const currentIndex = ZOOM_LEVELS.indexOf(mapScale);
    if (currentIndex < ZOOM_LEVELS.length - 1) {
      setMapScale(ZOOM_LEVELS[currentIndex + 1]);
    }
  }, [mapScale]);

  const handleZoomOut = useCallback(() => {
    const currentIndex = ZOOM_LEVELS.indexOf(mapScale);
    if (currentIndex > 0) {
      setMapScale(ZOOM_LEVELS[currentIndex - 1]);
    }
  }, [mapScale]);

  const handlePan = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    const panAmount = 100;
    setMapPosition(prev => {
      let newX = prev.x;
      let newY = prev.y;
      switch (direction) {
        case 'up': newY += panAmount; break;
        case 'down': newY -= panAmount; break;
        case 'left': newX += panAmount; break;
        case 'right': newX -= panAmount; break;
      }
      return constrainMapPosition(newX, newY, mapScale);
    });
  }, [constrainMapPosition, mapScale]);

  const handleCellClick = useCallback((cell: GridCell) => {
    setSelectedCell(cell);
    setActiveTab('map');
  }, []);

  const handleMoveCharacter = (charId: string, targetSector: string) => {
    // Start travel with selected characters or just the one clicked
    const charsToMove = selectedCharacterIds.length > 0
      ? selectedCharacterIds
      : [charId];
    startTravel(charsToMove, targetSector, selectedVehicleId || undefined);
    setSelectedCharacterIds([]);
    setSelectedVehicleId(null);
  };

  const handleAssignToVehicle = (charId: string, vehicleId: string) => {
    assignCharacterToVehicle(charId, vehicleId);
  };

  const handleCharacterSelect = (charId: string, multiSelect: boolean) => {
    if (multiSelect) {
      setSelectedCharacterIds(prev =>
        prev.includes(charId)
          ? prev.filter(id => id !== charId)
          : [...prev, charId]
      );
    } else {
      setSelectedCharacterIds(prev =>
        prev.includes(charId) && prev.length === 1 ? [] : [charId]
      );
    }
  };

  const handleVehicleSelect = (vehicleId: string) => {
    setSelectedVehicleId(prev => prev === vehicleId ? null : vehicleId);
  };

  const handleStartTravel = () => {
    if (selectedCharacterIds.length === 0) {
      return;
    }
    if (!selectedCell) {
      return;
    }
    startTravel(selectedCharacterIds, selectedCell.id, selectedVehicleId || undefined);
    setSelectedCharacterIds([]);
    setSelectedVehicleId(null);
  };

  const handleShowLaptop = () => {
    setShowLaptop(true);
    setCurrentView('almanac');
  };

  // Day/night visual effect
  const dayNightStyle = useMemo(() => {
    if (timeOfDay === 'night') {
      return { filter: 'brightness(0.4) saturate(0.6) hue-rotate(10deg)', overlay: 'rgba(10, 20, 50, 0.5)' };
    } else if (timeOfDay === 'evening') {
      return { filter: 'brightness(0.7) saturate(0.8)', overlay: 'rgba(255, 100, 50, 0.15)' };
    } else if (timeOfDay === 'morning') {
      return { filter: 'brightness(0.9) saturate(0.9)', overlay: 'rgba(255, 150, 80, 0.1)' };
    }
    return { filter: 'none', overlay: 'transparent' };
  }, [timeOfDay]);

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      {/* Top Bar - Retro NeoBrutalism */}
      <div className="flex-shrink-0 bg-surface border-b-2 border-black px-4 py-2 flex items-center justify-between shadow-retro-sm">
        {/* Left - Country Flag and Name */}
        <div className="flex items-center gap-3 min-w-[180px]">
          {selectedCountry && (
            <>
              <div className="w-10 h-7 rounded-lg overflow-hidden border-2 border-black shadow-retro-sm bg-primary/20">
                <span className="text-xs text-foreground flex items-center justify-center h-full font-bold">
                  {selectedCountry.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-foreground font-bold text-sm uppercase tracking-wide leading-tight">
                  {selectedCountry}
                </span>
                <span className="text-muted-foreground text-xs">Headquarters</span>
              </div>
            </>
          )}
        </div>

        {/* Center - Time Display */}
        <div className="flex-1 flex justify-center">
          <TimeDisplay
            day={currentDay}
            year={currentYear}
            dayOfWeek={dayOfWeek}
            time={currentTime}
            timeOfDay={timeOfDay}
            isPaused={isTimePaused}
            speed={timeSpeed}
            onTogglePause={togglePause}
            onSpeedChange={cycleTimeSpeed}
          />
        </div>

        {/* Right - Budget */}
        <div className="min-w-[180px] flex justify-end">
          <div className="bg-surface rounded-lg px-3 py-1 border-2 border-black shadow-retro-sm">
            <span className="text-success font-mono font-bold">${budget.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Main Content - Map and Panel */}
      <div className="flex-1 flex gap-2 p-2 min-h-0 overflow-hidden">
        {/* LEFT - Map Panel (2/3) */}
        <div className="flex-1 md:w-2/3 md:flex-none flex flex-col min-h-0 bg-card border-2 border-black rounded-lg overflow-hidden relative shadow-retro">
          <div className="flex-1 relative overflow-hidden bg-background" ref={mapContainerRef}>
            {/* Fixed Column Labels at Top */}
            <div
              className="absolute top-0 left-0 right-0 z-30 bg-surface overflow-hidden"
              style={{ height: `${COL_LABEL_HEIGHT}px`, paddingLeft: `${ROW_LABEL_WIDTH}px` }}
            >
              <div
                className="flex"
                style={{
                  transform: `translateX(${mapPosition.x}px) scale(${mapScale})`,
                  transformOrigin: 'top left',
                  width: `${MAP_WIDTH}px`,
                }}
              >
                {Array.from({ length: GRID_COLS }, (_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center justify-center font-mono text-[10px] transition-colors",
                      hoveredCell?.col === i || selectedCell?.col === i
                        ? 'text-accent font-bold'
                        : 'text-primary/70'
                    )}
                    style={{ width: `${GRID_CELL_SIZE}px`, height: `${COL_LABEL_HEIGHT}px`, flexShrink: 0 }}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>

            {/* Fixed Row Labels on Left */}
            <div
              className="absolute top-0 left-0 bottom-0 z-30 bg-surface overflow-hidden"
              style={{ width: `${ROW_LABEL_WIDTH}px`, paddingTop: `${COL_LABEL_HEIGHT}px` }}
            >
              <div
                className="flex flex-col"
                style={{
                  transform: `translateY(${mapPosition.y}px) scale(${mapScale})`,
                  transformOrigin: 'top left',
                  height: `${MAP_HEIGHT}px`,
                }}
              >
                {ROW_LABELS.map((label, index) => (
                  <div
                    key={label}
                    className={cn(
                      "flex items-center justify-center font-mono text-[10px] transition-colors",
                      hoveredCell?.row === index || selectedCell?.row === index
                        ? 'text-accent font-bold'
                        : 'text-primary/70'
                    )}
                    style={{ width: `${ROW_LABEL_WIDTH}px`, height: `${GRID_CELL_SIZE}px`, flexShrink: 0 }}
                  >
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Corner cell */}
            <div
              className="absolute top-0 left-0 z-40 bg-surface"
              style={{ width: `${ROW_LABEL_WIDTH}px`, height: `${COL_LABEL_HEIGHT}px` }}
            />

            {/* Scrollable Map Area */}
            <div
              className="absolute bottom-0 right-0 overflow-hidden cursor-grab active:cursor-grabbing"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ top: `${COL_LABEL_HEIGHT}px`, left: `${ROW_LABEL_WIDTH}px` }}
            >
              <div
                className="relative"
                style={{
                  width: `${MAP_WIDTH}px`,
                  height: `${MAP_HEIGHT}px`,
                  transform: `translate(${mapPosition.x}px, ${mapPosition.y}px) scale(${mapScale})`,
                  transformOrigin: 'top left',
                }}
              >
                {/* Map Image with Day/Night Filter */}
                <img
                  src="/assets/world_map.webp"
                  alt="World Map"
                  className="absolute top-0 left-0 pointer-events-none transition-all duration-1000"
                  style={{
                    width: `${MAP_WIDTH}px`,
                    height: `${MAP_HEIGHT}px`,
                    filter: dayNightStyle.filter,
                  }}
                  draggable={false}
                />

                {/* Day/Night Overlay */}
                <div
                  className="absolute pointer-events-none transition-all duration-1000"
                  style={{
                    backgroundColor: dayNightStyle.overlay,
                    width: `${MAP_WIDTH}px`,
                    height: `${MAP_HEIGHT}px`,
                  }}
                />

                {/* Grid Cells */}
                {showGrid && (
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${GRID_COLS}, ${GRID_CELL_SIZE}px)`,
                      gridTemplateRows: `repeat(${GRID_ROWS}, ${GRID_CELL_SIZE}px)`,
                      width: `${MAP_WIDTH}px`,
                      height: `${MAP_HEIGHT}px`,
                    }}
                  >
                    {gridData.map((cell) => {
                      // TC-004: Get territory control for this cell
                      const territoryControl = getSectorControl(cell.id);
                      const controlLevel = territoryControl ? getControlLevel(territoryControl.controlPercent) : 'none';
                      const territoryColor = territoryControl && territoryControl.controllingFaction !== 'neutral'
                        ? getControlColor(controlLevel)
                        : null;

                      // Faction-specific colors
                      const factionColors: Record<FactionId, string> = {
                        player: '#00ff00',      // Green
                        criminal: '#ff0000',    // Red
                        government: '#0066ff',  // Blue
                        corporate: '#ffcc00',   // Gold
                        rebel: '#ff6600',       // Orange
                        neutral: 'transparent',
                        contested: '#ffff00',   // Yellow
                      };

                      const bgColor = territoryControl && territoryControl.controllingFaction !== 'neutral'
                        ? factionColors[territoryControl.controllingFaction]
                        : null;
                      const bgOpacity = territoryControl ? territoryControl.controlPercent / 400 : 0; // Max 25% opacity

                      return (
                        <div
                          key={cell.id}
                          className={cn(
                            "border transition-colors pointer-events-auto relative",
                            selectedCell?.id === cell.id
                              ? 'bg-accent/30 border-accent border-2'
                              : hoveredCell?.id === cell.id
                                ? 'bg-primary/20 border-primary'
                                : cell.cities.length > 0
                                  ? 'border-primary/40 hover:bg-primary/20'
                                  : 'border-primary/20 hover:bg-surface/50'
                          )}
                          style={{
                            // TC-004: Territory control color overlay
                            backgroundColor: bgColor
                              ? `rgba(${parseInt(bgColor.slice(1, 3), 16)}, ${parseInt(bgColor.slice(3, 5), 16)}, ${parseInt(bgColor.slice(5, 7), 16)}, ${bgOpacity})`
                              : undefined,
                          }}
                          onClick={() => handleCellClick(cell)}
                          onMouseEnter={() => setHoveredCell(cell)}
                          onMouseLeave={() => setHoveredCell(null)}
                        >
                          {/* City indicator - always visible when cities exist */}
                          {cell.cities.length > 0 && (
                            <div className={cn(
                              "absolute top-0.5 right-0.5 flex items-center justify-center rounded-sm text-[8px] font-bold shadow-md",
                              cell.cities.length === 1
                                ? "w-3 h-3 bg-emerald-500 text-white"
                                : "min-w-3 h-3 px-0.5 bg-amber-500 text-black",
                              selectedCell?.id === cell.id && "ring-1 ring-white"
                            )}>
                              {cell.cities.length > 1 ? cell.cities.length : ''}
                            </div>
                          )}
                          {/* TC-004: Contested territory indicator */}
                          {territoryControl?.contestedBy && (
                            <div className="absolute bottom-1 left-1 w-2 h-2 bg-warning rounded-full animate-pulse" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Character markers on map - only show characters NOT traveling */}
                {characters.filter(char => char.status !== 'traveling').map((char) => {
                  if (!char.sector) return null;
                  const cell = gridData.find(c => c.id === char.sector);
                  if (!cell) return null;
                  const isSelected = selectedCharacterIds.includes(char.id);
                  return (
                    <div
                      key={char.id}
                      className={cn(
                        "absolute w-6 h-6 rounded-lg border-2 flex items-center justify-center text-white text-xs font-bold z-20 cursor-pointer hover:scale-110 transition-transform shadow-retro-sm",
                        isSelected ? 'bg-accent border-black ring-2 ring-accent' : 'bg-primary border-black'
                      )}
                      style={{
                        left: cell.col * GRID_CELL_SIZE + GRID_CELL_SIZE / 2 - 12,
                        top: cell.row * GRID_CELL_SIZE + GRID_CELL_SIZE / 2 - 12,
                      }}
                      title={`${char.name}${isSelected ? ' (selected)' : ''} - Click to select`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCharacterSelect(char.id, e.shiftKey);
                      }}
                    >
                      {char.name.charAt(0)}
                    </div>
                  );
                })}

                {/* Dotted Path Lines for Traveling Units - using CSS path for smooth animation */}
                <svg
                  className="absolute top-0 left-0 pointer-events-none"
                  width={MAP_WIDTH}
                  height={MAP_HEIGHT}
                  style={{ zIndex: 15 }}
                >
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="6"
                      markerHeight="6"
                      refX="3"
                      refY="3"
                      orient="auto"
                    >
                      <polygon points="0 0, 6 3, 0 6" fill="rgba(255, 255, 255, 0.8)" />
                    </marker>
                  </defs>
                  {travelingUnits.map((unit) => {
                    const origin = {
                      row: ROW_LABELS.indexOf(unit.originSector.charAt(0)),
                      col: parseInt(unit.originSector.slice(1)) - 1
                    };
                    const dest = {
                      row: ROW_LABELS.indexOf(unit.destinationSector.charAt(0)),
                      col: parseInt(unit.destinationSector.slice(1)) - 1
                    };

                    const startX = origin.col * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
                    const startY = origin.row * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
                    const endX = dest.col * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
                    const endY = dest.row * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;

                    // Calculate total path length for dash animation
                    const pathLength = Math.sqrt(
                      Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)
                    );
                    // Progress determines how much of the path is "traveled" (solid)
                    const traveledLength = pathLength * (unit.progress / 100);
                    const remainingLength = pathLength - traveledLength;

                    return (
                      <g key={`path-${unit.id}`}>
                        {/* Full path - dotted white line (remaining portion) */}
                        <line
                          x1={startX}
                          y1={startY}
                          x2={endX}
                          y2={endY}
                          stroke="rgba(255, 255, 255, 0.4)"
                          strokeWidth="2"
                          strokeDasharray="8,6"
                          strokeLinecap="round"
                          markerEnd="url(#arrowhead)"
                        />
                        {/* Traveled portion - solid cyan line with animated dash offset */}
                        <line
                          x1={startX}
                          y1={startY}
                          x2={endX}
                          y2={endY}
                          stroke="rgba(34, 211, 238, 0.7)"
                          strokeWidth="3"
                          strokeLinecap="round"
                          // dasharray: traveled portion solid, then transparent for rest
                          strokeDasharray={`${traveledLength} ${remainingLength}`}
                          style={{
                            // Smooth transition for the dash array change
                            transition: 'stroke-dasharray 1s linear',
                          }}
                        />
                        {/* Origin marker */}
                        <circle
                          cx={startX}
                          cy={startY}
                          r="4"
                          fill="rgba(34, 211, 238, 0.8)"
                          stroke="white"
                          strokeWidth="1"
                        />
                        {/* Destination marker - pulsing effect */}
                        <circle
                          cx={endX}
                          cy={endY}
                          r="6"
                          fill="none"
                          stroke="rgba(250, 204, 21, 0.8)"
                          strokeWidth="2"
                          strokeDasharray="4,2"
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* Traveling Units - vehicles/squads moving on the map with SMOOTH movement */}
                {travelingUnits.map((unit) => {
                  const pos = getTravelingUnitPosition(unit);
                  const vehicle = unit.vehicleId ? fleetVehicles.find(v => v.id === unit.vehicleId) : null;

                  // Calculate ETA
                  const etaMs = Math.max(0, unit.estimatedArrival - Date.now());
                  const etaMin = Math.floor(etaMs / 60000);
                  const etaSec = Math.floor((etaMs % 60000) / 1000);
                  const etaDisplay = etaMin > 0 ? `${etaMin}m ${etaSec}s` : `${etaSec}s`;

                  // Get vehicle icon based on type
                  const getVehicleEmoji = () => {
                    if (!vehicle) return '🚶';  // Walking
                    switch (vehicle.type) {
                      case 'aircraft': return '✈️';
                      case 'ground': return '🚗';
                      case 'sea': return '🚢';
                      default: return '📍';
                    }
                  };

                  // Vehicle color based on type
                  const getVehicleColor = () => {
                    if (!vehicle) return 'bg-orange-500';  // Walking
                    switch (vehicle.type) {
                      case 'aircraft': return 'bg-yellow-500';
                      case 'ground': return 'bg-green-500';
                      case 'sea': return 'bg-orange-500';
                      default: return 'bg-gray-500';
                    }
                  };

                  return (
                    <div
                      key={unit.id}
                      className="absolute z-30 pointer-events-auto cursor-pointer"
                      style={{
                        // SMOOTH MOVEMENT: CSS transition makes position changes animate
                        // over 1 second (matching the updateTravelProgress interval)
                        left: pos.x - 16,
                        top: pos.y - 16,
                        transition: 'left 1s linear, top 1s linear',
                      }}
                      title={`${unit.name} → ${unit.destinationSector} (${Math.round(unit.progress)}%) - ETA: ${etaDisplay}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Could show travel details or cancel option
                      }}
                    >
                      {/* Vehicle/Unit marker with smooth rotation */}
                      <div
                        className={`w-8 h-8 ${getVehicleColor()} rounded-lg border-2 border-white shadow-lg flex items-center justify-center`}
                        style={{
                          transform: `rotate(${unit.direction}deg)`,
                          // Smooth rotation transition (direction rarely changes but looks nice)
                          transition: 'transform 0.3s ease-out',
                        }}
                      >
                        <span
                          className="text-sm"
                          style={{
                            transform: `rotate(${-unit.direction}deg)`,  // Counter-rotate emoji
                            transition: 'transform 0.3s ease-out',
                          }}
                        >
                          {getVehicleEmoji()}
                        </span>
                      </div>

                      {/* Direction arrow pointer - also smoothly rotates */}
                      <div
                        className="absolute w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-l-transparent border-r-transparent border-b-white/80"
                        style={{
                          left: '50%',
                          top: '-8px',
                          transform: `translateX(-50%) rotate(${unit.direction}deg)`,
                          transformOrigin: '50% 24px',
                          transition: 'transform 0.3s ease-out',
                        }}
                      />

                      {/* Progress indicator - smooth progress bar fill */}
                      <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-12 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-400 to-yellow-400"
                          style={{
                            width: `${unit.progress}%`,
                            transition: 'width 1s linear',
                          }}
                        />
                      </div>

                      {/* ETA and destination label */}
                      <div className="absolute -bottom-7 left-1/2 transform -translate-x-1/2 whitespace-nowrap flex flex-col items-center">
                        <span className="text-[9px] text-yellow-300 bg-black/80 px-1.5 py-0.5 rounded font-mono font-bold">
                          {etaDisplay}
                        </span>
                        <span className="text-[7px] text-white/70">
                          → {unit.destinationSector}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Day/Night Indicator */}
            <div className="absolute z-20" style={{ top: `${COL_LABEL_HEIGHT + 8}px`, left: `${ROW_LABEL_WIDTH + 8}px` }}>
              <div className="bg-card/90 border-2 border-black rounded-lg px-2 py-1 flex items-center gap-2 shadow-retro-sm">
                {timeOfDay === 'night' && <Moon className="w-3 h-3 text-primary-light" />}
                {timeOfDay === 'noon' && <Sun className="w-3 h-3 text-warning" />}
                {timeOfDay === 'morning' && <Sunrise className="w-3 h-3 text-warning" />}
                {timeOfDay === 'evening' && <Sunset className="w-3 h-3 text-accent" />}
                <span className="text-foreground text-[10px] font-mono capitalize font-bold">{timeOfDay}</span>
              </div>
            </div>

            {/* Selected Sector Info Overlay */}
            {selectedCell && (
              <div className="absolute z-20" style={{ bottom: '8px', left: '50%', transform: 'translateX(-50%)' }}>
                <div className="bg-card/90 border-2 border-black rounded-lg px-3 py-1 shadow-retro-sm">
                  <span className="text-accent text-xs font-mono font-bold">
                    {selectedCell.id} - {selectedCell.region}
                  </span>
                </div>
              </div>
            )}

            {/* Map Controls - Retro Style */}
            <div className="absolute z-20 flex flex-col items-end gap-1" style={{ bottom: '8px', right: '8px' }}>
              {controlsMinimized ? (
                <button
                  onClick={() => setControlsMinimized(false)}
                  className="p-2 rounded-lg bg-card/90 border-2 border-black text-primary hover:bg-primary hover:text-primary-foreground transition-colors shadow-retro-sm"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
              ) : (
                <>
                  <div className="flex items-center gap-1 bg-card/90 rounded-lg p-1 border-2 border-black shadow-retro-sm">
                    <button
                      onClick={() => setControlsMinimized(true)}
                      className="p-1.5 rounded bg-surface text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    <div className="w-px h-5 bg-black/30" />
                    <button
                      onClick={() => setShowGrid(!showGrid)}
                      className={cn(
                        "p-1.5 rounded transition-colors",
                        showGrid ? 'bg-primary text-primary-foreground' : 'bg-surface text-primary hover:bg-primary hover:text-primary-foreground'
                      )}
                    >
                      <Grid className="w-3 h-3" />
                    </button>
                    <div className="w-px h-5 bg-black/30" />
                    <button onClick={handleZoomOut} className="p-1.5 rounded bg-surface text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
                      <ZoomOut className="w-3 h-3" />
                    </button>
                    <span className="text-foreground text-[9px] font-mono w-7 text-center font-bold">
                      {mapScale === 1 ? '1X' : `${mapScale}X`}
                    </span>
                    <button onClick={handleZoomIn} className="p-1.5 rounded bg-surface text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
                      <ZoomIn className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex flex-col items-center gap-0.5 bg-card/90 rounded-lg p-1 border-2 border-black shadow-retro-sm">
                    <button onClick={() => handlePan('up')} className="p-1 rounded bg-surface text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <div className="flex gap-0.5">
                      <button onClick={() => handlePan('left')} className="p-1 rounded bg-surface text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
                        <ChevronLeft className="w-3 h-3" />
                      </button>
                      <div className="w-5 h-5 rounded bg-surface flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      </div>
                      <button onClick={() => handlePan('right')} className="p-1 rounded bg-surface text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                    <button onClick={() => handlePan('down')} className="p-1 rounded bg-surface text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT - Messages/Team Panel (1/3) */}
        <div className="hidden md:flex md:w-1/3 flex-shrink-0">
          <MessagesPanel
            characters={characters}
            selectedCell={selectedCell}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onCharacterClick={(char) => console.log('Character clicked:', char)}
            vehicles={fleetVehicles}
            travelingUnits={travelingUnits}
            gameTime={currentTime}
            gameDay={currentDay}
            gameYear={currentYear}
            dayOfWeek={dayOfWeek}
            timeOfDay={timeOfDay}
            isPaused={isTimePaused}
            timeSpeed={timeSpeed}
            onTogglePause={togglePause}
            onSpeedChange={cycleTimeSpeed}
            onShowPhone={() => setShowPhone(!showPhone)}
            onShowLaptop={handleShowLaptop}
            showPhone={showPhone}
            showLaptop={showLaptop}
            onMoveCharacter={handleMoveCharacter}
            onAssignToVehicle={handleAssignToVehicle}
            onUnassignFromVehicle={unassignCharacterFromVehicle}
            selectedCharacterIds={selectedCharacterIds}
            selectedVehicleId={selectedVehicleId}
            onCharacterSelect={handleCharacterSelect}
            onVehicleSelect={handleVehicleSelect}
            onStartTravel={handleStartTravel}
            onCancelTravel={cancelTravel}
            sectorMissions={sectorMissions}
          />
        </div>
      </div>
    </div>
  );
};

export default WorldMapGrid;
