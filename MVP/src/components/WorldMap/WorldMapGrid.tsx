import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { cities, City } from '../../data/cities';
import { useGameStore, TravelingUnit, FleetVehicle, TIME_SPEEDS, TimeSpeed } from '../../stores/enhancedGameStore';
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
} from 'lucide-react';

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

// Time Display Component
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
      <div className="flex items-center gap-1 bg-[#1a2a3d] rounded-lg p-1 border border-cyan-600/30">
        <button
          onClick={onTogglePause}
          className={`p-1.5 rounded transition-colors ${
            isPaused ? 'bg-green-600 text-white hover:bg-green-500' : 'bg-yellow-600 text-white hover:bg-yellow-500'
          }`}
          title={isPaused ? 'Play' : 'Pause'}
        >
          {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
        </button>
        <button
          onClick={onSpeedChange}
          className="p-1.5 rounded bg-cyan-700 text-white hover:bg-cyan-600 transition-colors flex items-center gap-0.5"
          title="Change speed (1X → 10X → 60X → 360X)"
        >
          <FastForward className="w-3 h-3" />
          <span className="text-[10px] font-bold">{speedLabel}</span>
        </button>
      </div>

      <div className="flex items-center gap-2 bg-[#1a2a3d] rounded-lg px-3 py-1.5 border border-cyan-600/30">
        <div
          className="w-3 h-3 rounded-full"
          style={{
            backgroundColor: isNight ? '#C0C0C0' : '#FFD700',
            boxShadow: isNight ? '0 0 6px rgba(192, 192, 192, 0.8)' : '0 0 8px rgba(255, 215, 0, 0.8)',
          }}
        />
        <div className="flex flex-col items-start leading-tight">
          <span className="text-white font-mono text-sm font-bold">{time}</span>
          <span className="text-cyan-300 text-[10px] uppercase">{dayOfWeek}</span>
        </div>
      </div>

      <div className="flex flex-col items-start bg-[#1a2a3d] rounded-lg px-3 py-1 border border-cyan-600/30">
        <span className="text-white font-mono text-sm font-bold leading-tight">Day {day}</span>
        <span className="text-cyan-400 text-[10px] uppercase leading-tight">Year {year}</span>
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
}) => {
  const [isMessagesExpanded, setIsMessagesExpanded] = useState(true);
  const [expandedVehicleId, setExpandedVehicleId] = useState<string | null>(null);

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
      case 'night': return <Moon className="w-4 h-4 text-blue-300" />;
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
      case 'traveling': return 'bg-blue-400';
      case 'deployed': return 'bg-purple-400';
      case 'maintenance': return 'bg-yellow-400';
      case 'damaged': return 'bg-red-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready': return <Clock className="w-5 h-5 text-green-400" />;
      case 'traveling': return <Navigation className="w-5 h-5 text-blue-400" />;
      case 'on_mission': return <Swords className="w-5 h-5 text-orange-400" />;
      case 'injured': return <Heart className="w-5 h-5 text-red-400" />;
      default: return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full h-full">
      {/* Messages Section */}
      <div className="bg-[#1a1a2e] border border-[#E71D36] rounded-lg overflow-hidden">
        <button
          onClick={() => setIsMessagesExpanded(!isMessagesExpanded)}
          className="w-full flex items-center justify-between px-3 py-2 bg-[#2a2a3e] hover:bg-[#3a3a4e]"
        >
          <span className="text-white font-bold text-sm tracking-wide">MESSAGES</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#E71D36]">0 new</span>
            <span className="text-white text-sm">{isMessagesExpanded ? '−' : '+'}</span>
          </div>
        </button>
        {isMessagesExpanded && (
          <div className="max-h-[120px] overflow-y-auto p-3">
            <p className="text-gray-500 text-xs text-center italic">No messages yet</p>
          </div>
        )}
      </div>

      {/* Tabbed Team/Map/Vehicles Section */}
      <div className="flex-1 bg-[#F5BF29] border border-[#E71D36] rounded-lg overflow-hidden flex flex-col">
        <div className="flex border-b-2 border-[#E71D36]">
          {[
            { id: 'character' as TabType, label: 'TEAM', icon: <Users className="w-4 h-4" /> },
            { id: 'map' as TabType, label: 'MAP', icon: <MapPin className="w-4 h-4" /> },
            { id: 'vehicles' as TabType, label: 'VEHICLES', icon: <Car className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-bold tracking-wide transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#F5BF29] text-[#141204] border-b-2 border-[#141204]'
                  : 'bg-[rgba(0,0,0,0.2)] text-[#141204]/70 hover:bg-[rgba(0,0,0,0.1)]'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'character' && (
            <div>
              {/* Selection Summary */}
              {selectedCharacterIds.length > 0 && (
                <div className="px-3 py-2 bg-yellow-600/80">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold text-xs">
                      {selectedCharacterIds.length} SELECTED
                    </span>
                    {selectedCell && (
                      <button
                        onClick={onStartTravel}
                        className="text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded font-bold"
                      >
                        → {selectedCell.id}
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="px-3 py-2 bg-[rgba(231,29,54,0.6)]">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-bold text-sm uppercase tracking-wider">Team Roster</h3>
                  <span className="text-white/70 text-[10px]">Click to select • Shift+Click multi</span>
                </div>
              </div>
              <div className="divide-y divide-cyan-900/30">
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
                      className={`flex items-center gap-3 px-3 py-2 transition-colors ${
                        canTravel ? 'cursor-pointer hover:bg-[rgba(231,29,54,0.2)]' : 'opacity-50 cursor-not-allowed'
                      } ${isSelected ? 'bg-yellow-600/30 border-l-4 border-yellow-400' : ''}`}
                    >
                      <div className="relative">
                        <div className={`w-10 h-10 rounded-lg bg-[#1a1a2e] border-2 flex items-center justify-center ${
                          isSelected ? 'border-yellow-400' : 'border-cyan-600'
                        }`}>
                          {getStatusIcon(char.status)}
                        </div>
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                            <span className="text-[10px] text-black font-bold">✓</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-sm truncate ${isSelected ? 'text-yellow-300' : 'text-cyan-100'}`}>
                          {char.name}
                        </p>
                        <p className="text-cyan-400/70 text-xs truncate">{char.status?.toUpperCase()}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-yellow-400 font-mono font-bold text-sm">{char.sector || 'HQ'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Traveling Units */}
              {travelingUnits.length > 0 && (
                <div className="mt-2">
                  <div className="px-3 py-2 bg-blue-600/80">
                    <h3 className="text-white font-bold text-xs uppercase tracking-wider">
                      En Route ({travelingUnits.length})
                    </h3>
                  </div>
                  <div className="divide-y divide-blue-900/30">
                    {travelingUnits.map((unit) => (
                      <div
                        key={unit.id}
                        className="flex items-center gap-3 px-3 py-2 bg-blue-900/20"
                      >
                        <div className="w-10 h-10 rounded-lg bg-blue-800 border-2 border-blue-400 flex items-center justify-center">
                          <Navigation className="w-5 h-5 text-blue-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-blue-100 font-bold text-sm truncate">{unit.name}</p>
                            <div className="flex items-center gap-1 text-yellow-300">
                              <Timer className="w-3 h-3" />
                              <span className="text-[10px] font-mono font-bold">{formatETA(unit.estimatedArrival)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-blue-400/70 text-xs">{unit.originSector} → {unit.destinationSector}</span>
                            <span className="text-blue-300/60 text-[10px]">({Math.round(unit.progress)}%)</span>
                          </div>
                          <div className="w-full h-1.5 bg-blue-900 rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 transition-all" style={{ width: `${unit.progress}%` }} />
                          </div>
                        </div>
                        <button
                          onClick={() => onCancelTravel(unit.id)}
                          className="text-[10px] bg-red-600/80 hover:bg-red-500 text-white px-2 py-1 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'map' && (
            <div className="p-3 min-h-[180px]">
              {selectedCell ? (
                <div className="space-y-2">
                  <div className="bg-[rgba(231,29,54,0.6)] rounded px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-bold text-base tracking-wider">
                        SECTOR {selectedCell.id}
                      </span>
                      <span className="text-white/80 text-xs">
                        Col {selectedCell.col + 1} / Row {ROW_LABELS[selectedCell.row]}
                      </span>
                    </div>
                  </div>

                  <div className="bg-[rgba(0,0,0,0.2)] rounded px-3 py-2">
                    <p className="text-xs text-[#141204]/70 uppercase">Region</p>
                    <p className="text-[#141204] font-bold text-lg">{selectedCell.region}</p>
                  </div>

                  {selectedCell.countries.length > 0 && (
                    <div className="bg-[rgba(0,0,0,0.2)] rounded px-3 py-2">
                      <p className="text-xs text-[#141204]/70 uppercase">Countries</p>
                      <p className="text-[#141204] text-sm">{selectedCell.countries.join(', ')}</p>
                    </div>
                  )}

                  {selectedCell.cities.length > 0 && (
                    <div className="bg-[rgba(0,0,0,0.2)] rounded px-3 py-2">
                      <p className="text-xs text-[#141204]/70 uppercase flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> Cities ({selectedCell.cities.length})
                      </p>
                      <div className="space-y-1 mt-1 max-h-32 overflow-y-auto">
                        {selectedCell.cities.slice(0, 5).map((city, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <span className="text-[#141204] text-sm font-medium">{city.name}</span>
                            <span className="text-[#141204]/60 text-xs">Pop: {(city.population / 1000000).toFixed(1)}M</span>
                          </div>
                        ))}
                        {selectedCell.cities.length > 5 && (
                          <p className="text-[#141204]/50 text-xs">+{selectedCell.cities.length - 5} more cities</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[rgba(0,0,0,0.2)] rounded px-3 py-2">
                      <p className="text-[10px] text-[#141204]/70 uppercase">Terrain</p>
                      <p className="text-[#141204] text-xs">{selectedCell.terrain || 'Various'}</p>
                    </div>
                    <div className="bg-[rgba(0,0,0,0.2)] rounded px-3 py-2">
                      <p className="text-[10px] text-[#141204]/70 uppercase">Climate</p>
                      <p className="text-[#141204] text-xs">{selectedCell.climate || 'Varied'}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-3">
                    <button className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs py-2 rounded font-bold">
                      DEPLOY SQUAD
                    </button>
                    <button className="flex-1 bg-red-600 hover:bg-red-500 text-white text-xs py-2 rounded font-bold">
                      ENTER COMBAT
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                  <MapPin className="w-12 h-12 text-[#141204]/30 mb-3" />
                  <p className="text-[#141204]/50 text-sm font-medium">No Sector Selected</p>
                  <p className="text-[#141204]/40 text-xs mt-1">Click a sector on the map</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'vehicles' && (
            <div className="flex flex-col h-full">
              {/* Selected Vehicle for Travel */}
              {selectedVehicleId && (
                <div className="px-3 py-2 bg-cyan-600/80 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold text-xs">
                      {vehicles.find(v => v.id === selectedVehicleId)?.name} SELECTED FOR TRAVEL
                    </span>
                    <button
                      onClick={() => onVehicleSelect(selectedVehicleId)}
                      className="text-[10px] bg-red-500/80 hover:bg-red-500 text-white px-2 py-0.5 rounded"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}

              <div className="px-3 py-2 bg-[rgba(231,29,54,0.6)] flex-shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold text-sm tracking-wider">FLEET MANAGEMENT</span>
                  <span className="text-white/70 text-[10px]">Click vehicle to manage crew</span>
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
                    <div key={vehicle.id} className="border-b border-[#E71D36]/30">
                      {/* Vehicle Header */}
                      <div
                        onClick={() => setExpandedVehicleId(isExpanded ? null : vehicle.id)}
                        className={`flex items-center px-3 py-2 transition-colors cursor-pointer hover:bg-[rgba(0,0,0,0.1)] ${
                          isSelectedForTravel ? 'bg-cyan-600/30 border-l-4 border-cyan-400' : ''
                        }`}
                      >
                        <div className={`mr-2 ${isSelectedForTravel ? 'text-cyan-300' : 'text-[#141204]'}`}>
                          {getVehicleIcon(vehicle.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold truncate ${isSelectedForTravel ? 'text-cyan-200' : 'text-[#141204]'}`}>
                            {vehicle.name}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-[#141204]/60 text-[10px]">{vehicle.speed} mph</span>
                            <span className="text-[#141204]/80 text-[10px] font-medium">
                              {seatsUsed}/{vehicle.capacity} crew
                            </span>
                          </div>
                        </div>
                        <div className="text-right mr-2">
                          <p className="text-yellow-600 font-mono text-xs font-bold">{vehicle.currentSector}</p>
                        </div>
                        <div
                          className={`w-3 h-3 rounded-full border border-black flex-shrink-0 ${getVehicleStatusColor(vehicle.status)}`}
                          title={vehicle.status}
                        />
                        <ChevronDown className={`w-4 h-4 ml-2 text-[#141204]/60 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>

                      {/* Expanded Content - Crew Management */}
                      {isExpanded && (
                        <div className="bg-[rgba(0,0,0,0.15)] px-3 py-2">
                          {/* Select for Travel Button */}
                          {canSelect && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onVehicleSelect(vehicle.id);
                              }}
                              className={`w-full mb-2 py-1.5 rounded text-xs font-bold transition-colors ${
                                isSelectedForTravel
                                  ? 'bg-cyan-600 text-white'
                                  : 'bg-cyan-600/30 text-cyan-800 hover:bg-cyan-600/50'
                              }`}
                            >
                              {isSelectedForTravel ? '✓ SELECTED FOR TRAVEL' : 'SELECT FOR TRAVEL'}
                            </button>
                          )}

                          {/* Current Crew */}
                          <div className="mb-2">
                            <p className="text-[10px] text-[#141204]/70 uppercase font-bold mb-1">Current Crew ({seatsUsed})</p>
                            {assignedChars.length === 0 ? (
                              <p className="text-[#141204]/50 text-xs italic">No crew assigned</p>
                            ) : (
                              <div className="space-y-1">
                                {assignedChars.map(char => (
                                  <div key={char.id} className="flex items-center justify-between bg-[rgba(255,255,255,0.3)] rounded px-2 py-1">
                                    <span className="text-[#141204] text-xs font-medium">{char.name}</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onUnassignFromVehicle(char.id, vehicle.id);
                                      }}
                                      className="p-0.5 rounded bg-red-500/80 hover:bg-red-500 text-white"
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
                              <p className="text-[10px] text-[#141204]/70 uppercase font-bold mb-1">Add Crew</p>
                              <div className="space-y-1 max-h-24 overflow-y-auto">
                                {availableCharacters.map(char => (
                                  <div key={char.id} className="flex items-center justify-between bg-green-500/20 rounded px-2 py-1">
                                    <span className="text-[#141204] text-xs">{char.name}</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onAssignToVehicle(char.id, vehicle.id);
                                      }}
                                      className="p-0.5 rounded bg-green-500/80 hover:bg-green-500 text-white"
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
                            <p className="text-orange-600 text-[10px] font-bold">Vehicle at full capacity</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Status Legend */}
              <div className="px-3 py-2 border-t border-[#E71D36]/50 flex flex-wrap gap-3 text-[10px] flex-shrink-0">
                <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-green-400 border border-black" /> Ready</span>
                <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-blue-400 border border-black" /> Traveling</span>
                <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-yellow-400 border border-black" /> Maintenance</span>
              </div>

              {/* Travel Summary */}
              {selectedCharacterIds.length > 0 && selectedVehicleId && selectedCell && (
                <div className="px-3 py-2 bg-green-600/80 border-t border-green-400 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-xs">
                      {selectedCharacterIds.length} chars + {vehicles.find(v => v.id === selectedVehicleId)?.name}
                    </span>
                    <button
                      onClick={onStartTravel}
                      className="text-xs bg-white text-green-700 px-3 py-1 rounded font-bold hover:bg-green-100"
                    >
                      DEPLOY → {selectedCell.id}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="bg-[#1a1a2e] border border-cyan-600/50 rounded-lg p-2">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-2">
            {getTimeOfDayIcon()}
            <span className="text-cyan-100 font-mono text-sm">{gameTime}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-cyan-400">{dayOfWeek}</span>
            <span className="text-cyan-100 font-bold">Day {gameDay}</span>
            <span className="text-cyan-400/70">Year {gameYear}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 mb-2">
          <button
            onClick={onTogglePause}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded transition-colors border ${
              isPaused
                ? 'bg-green-600/20 border-green-500/50 text-green-400 hover:bg-green-600/30'
                : 'bg-yellow-600/20 border-yellow-500/50 text-yellow-400 hover:bg-yellow-600/30'
            }`}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            <span className="text-xs font-bold">{isPaused ? 'PLAY' : 'PAUSE'}</span>
          </button>
          <button
            onClick={onSpeedChange}
            className="flex items-center justify-center gap-1 px-3 py-1.5 rounded bg-cyan-600/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-600/30 transition-colors"
          >
            <FastForward className="w-4 h-4" />
            <span className="text-xs font-bold">{timeSpeed}X</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onShowPhone}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded transition-colors border ${
              showPhone
                ? 'bg-cyan-600 border-cyan-400 text-white'
                : 'bg-[#2a3a4d] border-cyan-600/30 text-cyan-400 hover:bg-[#3a4a5d]'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span className="text-xs font-bold">PHONE</span>
          </button>
          <button
            onClick={onShowLaptop}
            className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded transition-colors border ${
              showLaptop
                ? 'bg-cyan-600 border-cyan-400 text-white'
                : 'bg-[#2a3a4d] border-cyan-600/30 text-cyan-400 hover:bg-[#3a4a5d]'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span className="text-xs font-bold">LAPTOP</span>
          </button>
          <button className="p-2 rounded bg-[#2a3a4d] border border-cyan-600/30 text-cyan-400 hover:bg-[#3a4a5d] transition-colors">
            <Settings className="w-4 h-4" />
          </button>
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
  } = useGameStore();

  // Selected characters for travel
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

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
        // Map our sector codes to the 40x24 grid
        const citiesInSector = cities.filter(city => {
          // Simple mapping - adjust based on your sector system
          if (!city.sector) return false;
          const sectorLetter = city.sector.charAt(0);
          const sectorNum = parseInt(city.sector.slice(1));
          const mappedRow = ROW_LABELS.indexOf(sectorLetter);
          const mappedCol = Math.floor(sectorNum * 2); // Scale up
          return mappedRow === row && Math.abs(mappedCol - col) <= 1;
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
    <div className="h-screen w-screen flex flex-col bg-[#0a1628] overflow-hidden">
      {/* Top Bar */}
      <div className="flex-shrink-0 bg-[#0d1a2d] border-b-2 border-cyan-600/50 px-4 py-2 flex items-center justify-between">
        {/* Left - Country Flag and Name */}
        <div className="flex items-center gap-3 min-w-[180px]">
          {selectedCountry && (
            <>
              <div className="w-10 h-7 rounded overflow-hidden border-2 border-cyan-500/50 shadow-lg bg-gray-700">
                <span className="text-xs text-white flex items-center justify-center h-full">
                  {selectedCountry.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-cyan-100 font-bold text-sm uppercase tracking-wide leading-tight">
                  {selectedCountry}
                </span>
                <span className="text-cyan-400/70 text-xs">Headquarters</span>
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
          <div className="bg-[#1a2a3d] rounded-lg px-3 py-1 border border-green-600/30">
            <span className="text-green-400 font-mono font-bold">${budget.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Main Content - Map and Panel */}
      <div className="flex-1 flex gap-2 p-2 min-h-0 overflow-hidden">
        {/* LEFT - Map Panel (2/3) */}
        <div className="flex-1 md:w-2/3 md:flex-none flex flex-col min-h-0 bg-[#0d1a2d] border-2 border-cyan-600/30 rounded-lg overflow-hidden relative">
          <div className="flex-1 relative overflow-hidden bg-[#0a0a1a]" ref={mapContainerRef}>
            {/* Fixed Column Labels at Top */}
            <div
              className="absolute top-0 left-0 right-0 z-30 bg-[#0a0a1a] overflow-hidden"
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
                    className={`flex items-center justify-center font-mono text-[10px] transition-colors ${
                      hoveredCell?.col === i || selectedCell?.col === i
                        ? 'text-yellow-300 font-bold'
                        : 'text-cyan-400/70'
                    }`}
                    style={{ width: `${GRID_CELL_SIZE}px`, height: `${COL_LABEL_HEIGHT}px`, flexShrink: 0 }}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>

            {/* Fixed Row Labels on Left */}
            <div
              className="absolute top-0 left-0 bottom-0 z-30 bg-[#0a0a1a] overflow-hidden"
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
                    className={`flex items-center justify-center font-mono text-[10px] transition-colors ${
                      hoveredCell?.row === index || selectedCell?.row === index
                        ? 'text-yellow-300 font-bold'
                        : 'text-cyan-400/70'
                    }`}
                    style={{ width: `${ROW_LABEL_WIDTH}px`, height: `${GRID_CELL_SIZE}px`, flexShrink: 0 }}
                  >
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Corner cell */}
            <div
              className="absolute top-0 left-0 z-40 bg-[#0a0a1a]"
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
                    {gridData.map((cell) => (
                      <div
                        key={cell.id}
                        className={`border transition-colors pointer-events-auto ${
                          selectedCell?.id === cell.id
                            ? 'bg-yellow-500/30 border-yellow-400 border-2'
                            : hoveredCell?.id === cell.id
                              ? 'bg-cyan-500/20 border-cyan-400'
                              : cell.cities.length > 0
                                ? 'border-cyan-500/40 hover:bg-blue-500/20'
                                : 'border-cyan-500/20 hover:bg-gray-500/10'
                        }`}
                        onClick={() => handleCellClick(cell)}
                        onMouseEnter={() => setHoveredCell(cell)}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        {/* City indicator */}
                        {cell.cities.length > 0 && !hoveredCell && selectedCell?.id !== cell.id && (
                          <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full shadow-lg shadow-green-500/50" />
                        )}
                      </div>
                    ))}
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
                      className={`absolute w-6 h-6 rounded-full border-2 flex items-center justify-center text-white text-xs font-bold shadow-lg z-20 cursor-pointer hover:scale-110 transition-transform ${
                        isSelected ? 'bg-yellow-500 border-yellow-300 ring-2 ring-yellow-400' : 'bg-blue-600 border-white'
                      }`}
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
                      case 'aircraft': return 'bg-cyan-500';
                      case 'ground': return 'bg-green-500';
                      case 'sea': return 'bg-blue-500';
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
              <div className="bg-[#0d1a2d]/90 border border-cyan-600/50 rounded px-2 py-1 flex items-center gap-2">
                {timeOfDay === 'night' && <Moon className="w-3 h-3 text-blue-300" />}
                {timeOfDay === 'noon' && <Sun className="w-3 h-3 text-yellow-400" />}
                {timeOfDay === 'morning' && <Sunrise className="w-3 h-3 text-orange-400" />}
                {timeOfDay === 'evening' && <Sunset className="w-3 h-3 text-orange-500" />}
                <span className="text-cyan-300 text-[10px] font-mono capitalize">{timeOfDay}</span>
              </div>
            </div>

            {/* Selected Sector Info Overlay */}
            {selectedCell && (
              <div className="absolute z-20" style={{ bottom: '8px', left: '50%', transform: 'translateX(-50%)' }}>
                <div className="bg-[#0d1a2d]/90 border border-yellow-500/50 rounded px-3 py-1">
                  <span className="text-yellow-300 text-xs font-mono">
                    {selectedCell.id} - {selectedCell.region}
                  </span>
                </div>
              </div>
            )}

            {/* Map Controls */}
            <div className="absolute z-20 flex flex-col items-end gap-1" style={{ bottom: '8px', right: '8px' }}>
              {controlsMinimized ? (
                <button
                  onClick={() => setControlsMinimized(false)}
                  className="p-2 rounded-lg bg-[#0d1a2d]/90 border border-cyan-600/50 text-cyan-400 hover:bg-cyan-700 hover:text-white transition-colors"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
              ) : (
                <>
                  <div className="flex items-center gap-1 bg-[#0d1a2d]/90 rounded-lg p-1 border border-cyan-600/50">
                    <button
                      onClick={() => setControlsMinimized(true)}
                      className="p-1.5 rounded bg-[#1a2a3d] text-cyan-400 hover:bg-cyan-700 hover:text-white transition-colors"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    <div className="w-px h-5 bg-cyan-600/30" />
                    <button
                      onClick={() => setShowGrid(!showGrid)}
                      className={`p-1.5 rounded transition-colors ${showGrid ? 'bg-cyan-600 text-white' : 'bg-[#1a2a3d] text-cyan-400 hover:bg-cyan-700 hover:text-white'}`}
                    >
                      <Grid className="w-3 h-3" />
                    </button>
                    <div className="w-px h-5 bg-cyan-600/30" />
                    <button onClick={handleZoomOut} className="p-1.5 rounded bg-[#1a2a3d] text-cyan-400 hover:bg-cyan-700 hover:text-white transition-colors">
                      <ZoomOut className="w-3 h-3" />
                    </button>
                    <span className="text-cyan-300 text-[9px] font-mono w-7 text-center">
                      {mapScale === 1 ? '1X' : `${mapScale}X`}
                    </span>
                    <button onClick={handleZoomIn} className="p-1.5 rounded bg-[#1a2a3d] text-cyan-400 hover:bg-cyan-700 hover:text-white transition-colors">
                      <ZoomIn className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex flex-col items-center gap-0.5 bg-[#0d1a2d]/90 rounded-lg p-1 border border-cyan-600/50">
                    <button onClick={() => handlePan('up')} className="p-1 rounded bg-[#1a2a3d] text-cyan-400 hover:bg-cyan-700 hover:text-white transition-colors">
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <div className="flex gap-0.5">
                      <button onClick={() => handlePan('left')} className="p-1 rounded bg-[#1a2a3d] text-cyan-400 hover:bg-cyan-700 hover:text-white transition-colors">
                        <ChevronLeft className="w-3 h-3" />
                      </button>
                      <div className="w-5 h-5 rounded bg-[#1a2a3d] flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                      </div>
                      <button onClick={() => handlePan('right')} className="p-1 rounded bg-[#1a2a3d] text-cyan-400 hover:bg-cyan-700 hover:text-white transition-colors">
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                    <button onClick={() => handlePan('down')} className="p-1 rounded bg-[#1a2a3d] text-cyan-400 hover:bg-cyan-700 hover:text-white transition-colors">
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
          />
        </div>
      </div>
    </div>
  );
};

export default WorldMapGrid;
