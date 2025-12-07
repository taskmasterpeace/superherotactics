/**
 * CombatLab - Full tactical combat interface
 *
 * Features:
 * - Unit cards showing all combatants
 * - AI vs AI mode button
 * - Beams, cones, projectiles visualization
 * - Sound rings
 * - Full combat log
 */

import React, { useState, useEffect } from 'react';
import { PhaserGame, useCombatState, useCombatActions } from './PhaserGame';
import { EventBridge, LogEntry, CombatCharacter, CombatStatsEvent, CombatAwards, CombatStats, UnitCombatStats, KillEntry } from '../game/EventBridge';
import { useGameStore } from '../stores/enhancedGameStore';
import { PowersPanel } from './PowersPanel';

// Icons from lucide-react
import {
  Crosshair,
  Footprints,
  Target,
  Settings,
  Eye,
  Check,
  Package,
  X,
  Bot,
  ArrowLeft,
  RefreshCw,
  Trophy,
  Skull,
  Swords,
  Shield,
  Zap,
} from 'lucide-react';

// Random enemy generator
const ENEMY_NAMES = [
  'Shadow Striker', 'Iron Fist', 'Dark Raven', 'Steel Wolf', 'Crimson Ghost',
  'Venom Strike', 'Night Crawler', 'Thunder Bolt', 'Fire Storm', 'Ice Blade'
];

const ENEMY_POWERS = [
  ['Enhanced Strength', 'Combat Training'],
  ['Super Speed', 'Martial Arts'],
  ['Energy Projection', 'Force Field'],
  ['Psychic Blast', 'Mind Control'],
  ['Fire Control', 'Heat Resistance'],
];

const ENEMY_EQUIPMENT = [
  ['Assault Rifle', 'Body Armor'],
  ['Pistol', 'Combat Knife'],
  ['Shotgun', 'Tactical Vest'],
  ['Energy Staff', 'Power Armor'],
  ['Fists', 'Combat Suit'],
];

function generateRandomEnemy(index: number): CombatCharacter {
  const name = ENEMY_NAMES[index % ENEMY_NAMES.length];
  const powers = ENEMY_POWERS[index % ENEMY_POWERS.length];
  const equipment = ENEMY_EQUIPMENT[index % ENEMY_EQUIPMENT.length];

  // Random stats between 40-70
  const randomStat = () => 40 + Math.floor(Math.random() * 30);

  return {
    id: `enemy-${index}-${Date.now()}`,
    name,
    team: 'red',
    stats: {
      MEL: randomStat(),
      AGL: randomStat(),
      STR: randomStat(),
      STA: randomStat(),
      INT: randomStat(),
      INS: randomStat(),
      CON: randomStat(),
    },
    health: { current: 60, maximum: 60 },
    powers,
    equipment,
    threatLevel: 'THREAT_1',
    origin: 'Criminal',
  };
}

// Weapon data for display
const WEAPONS: Record<string, { name: string; emoji: string; damage: number; range: number }> = {
  pistol: { name: 'Pistol', emoji: '🔫', damage: 20, range: 6 },
  rifle: { name: 'Rifle', emoji: '🎯', damage: 30, range: 10 },
  shotgun: { name: 'Shotgun', emoji: '💥', damage: 40, range: 4 },
  beam: { name: 'Energy Beam', emoji: '⚡', damage: 30, range: 8 },
  beam_wide: { name: 'Wide Beam', emoji: '🌊', damage: 25, range: 5 },
  fist: { name: 'Fist', emoji: '👊', damage: 15, range: 1 },
  psychic: { name: 'Psychic Blast', emoji: '🧠', damage: 35, range: 7 },
};

interface CombatUnit {
  id: string;
  name: string;
  codename: string;
  team: string;
  hp: number;
  maxHp: number;
  ap: number;
  maxAp: number;
  weapon: string;
  weaponEmoji: string;
  personality: string;
  acted: boolean;
  statusEffects: string[];
  visible: boolean; // Fog of war
}

export const CombatLab: React.FC = () => {
  const { selectedUnit, currentTeam, roundNumber, logEntries, isLoaded } =
    useCombatState();
  const actions = useCombatActions();
  const [showGadgetPanel, setShowGadgetPanel] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [combatSummary, setCombatSummary] = useState<CombatStatsEvent | null>(null);
  const [aiVsAi, setAiVsAi] = useState(false);
  const [allUnits, setAllUnits] = useState<CombatUnit[]>([]);
  const [combatLoaded, setCombatLoaded] = useState(false);

  // Get characters and setCurrentView from game store
  const gameCharacters = useGameStore(state => state.characters);
  const setCurrentView = useGameStore(state => state.setCurrentView);

  // Convert game store characters to combat format
  const convertToBlueTeam = (): CombatCharacter[] => {
    return gameCharacters
      .filter(c => c.status === 'ready' || c.status === 'injured') // Only ready/injured characters
      .slice(0, 4) // Max 4 characters
      .map(char => ({
        id: char.id,
        name: char.name,
        realName: char.realName,
        team: 'blue' as const,
        stats: char.stats,
        health: char.health,
        powers: char.powers || [],
        equipment: char.equipment || [],
        threatLevel: char.threatLevel,
        origin: char.origin,
      }));
  };

  // Generate enemy team
  const generateEnemyTeam = (count: number): CombatCharacter[] => {
    return Array.from({ length: count }, (_, i) => generateRandomEnemy(i));
  };

  // Load combat when Phaser is ready
  const loadCombat = () => {
    const blueTeam = convertToBlueTeam();
    const enemyCount = Math.max(2, blueTeam.length); // At least 2 enemies
    const redTeam = generateEnemyTeam(enemyCount);

    console.log('[COMBAT LAB] Loading combat with:', blueTeam.length, 'blue,', redTeam.length, 'red');
    console.log('[COMBAT LAB] Blue team:', blueTeam.map(c => c.name));
    console.log('[COMBAT LAB] Red team:', redTeam.map(c => c.name));

    EventBridge.emit('load-combat', { blueTeam, redTeam });
    setCombatLoaded(true);
  };

  // Listen for all units data
  useEffect(() => {
    const unsubscribe = EventBridge.on('all-units-updated', (units: CombatUnit[]) => {
      setAllUnits(units);
    });

    const unsubAi = EventBridge.on('ai-vs-ai-toggled', (data: { enabled: boolean }) => {
      setAiVsAi(data.enabled);
    });

    // Listen for combat stats when combat ends
    const unsubStats = EventBridge.on('combat-stats', (data: CombatStatsEvent) => {
      console.log('[COMBAT LAB] Combat stats received:', data);
      setCombatSummary(data);
      setShowSummary(true);
    });

    return () => {
      unsubscribe();
      unsubAi();
      unsubStats();
    };
  }, []);

  // Load combat once Phaser is ready
  useEffect(() => {
    if (isLoaded && !combatLoaded) {
      // Small delay to ensure Phaser is fully initialized
      const timer = setTimeout(() => {
        loadCombat();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoaded, combatLoaded]);

  const toggleAiVsAi = () => {
    EventBridge.emit('toggle-ai-vs-ai');
  };

  const teamColor =
    currentTeam === 'blue'
      ? 'text-blue-400'
      : currentTeam === 'red'
      ? 'text-red-400'
      : 'text-green-400';

  // Get selected unit's weapon info
  const selectedWeapon = selectedUnit && allUnits.find(u => u.id === selectedUnit.id);
  const weaponInfo = selectedWeapon ? WEAPONS[selectedWeapon.weapon] : null;

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* TOP BAR */}
      <TopBar
        currentTeam={currentTeam}
        roundNumber={roundNumber}
        teamColor={teamColor}
        aiVsAi={aiVsAi}
        onToggleAi={toggleAiVsAi}
        onRestartCombat={() => {
          setCombatLoaded(false);
          setTimeout(() => loadCombat(), 100);
        }}
        onExit={() => setCurrentView('world-map')}
        onSettings={() => setShowSettings(true)}
      />

      {/* MAIN CONTENT */}
      <div className="flex flex-1 overflow-hidden">
        {/* PHASER CANVAS */}
        <div className="flex-1 relative">
          <PhaserGame className="w-full h-full" />

          {/* Loading overlay */}
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
              <div className="text-xl">Loading Combat Lab...</div>
            </div>
          )}
        </div>

        {/* SIDE PANEL */}
        <SidePanel logEntries={logEntries} selectedUnit={selectedUnit} />
      </div>

      {/* UNIT CARDS BAR */}
      <UnitCardsBar
        units={allUnits}
        selectedUnitId={selectedUnit?.id}
        currentTeam={currentTeam}
      />

      {/* BOTTOM BAR */}
      <BottomBar
        selectedUnit={selectedUnit}
        weaponInfo={weaponInfo}
        unitData={selectedWeapon}
        actions={actions}
        onGadgetClick={() => setShowGadgetPanel(true)}
        onInventoryClick={() => setShowInventory(true)}
      />

      {/* MODALS */}
      {showGadgetPanel && (
        <GadgetPanel
          onClose={() => setShowGadgetPanel(false)}
          characterEquipment={
            gameCharacters.find(c => c.id === selectedUnit?.id)?.equipment || []
          }
          characterPowers={
            gameCharacters.find(c => c.id === selectedUnit?.id)?.powers || []
          }
        />
      )}

      {showInventory && (
        <InventoryPanel
          onClose={() => setShowInventory(false)}
          unitData={selectedWeapon}
          characterEquipment={
            gameCharacters.find(c => c.id === selectedUnit?.id)?.equipment || []
          }
        />
      )}

      {/* Post-Battle Summary Modal */}
      {showSummary && combatSummary && (
        <PostBattleSummary
          data={combatSummary}
          onClose={() => {
            setShowSummary(false);
            setCombatLoaded(false);
            setTimeout(() => loadCombat(), 100);
          }}
          onRematch={() => {
            setShowSummary(false);
            setCombatLoaded(false);
            setTimeout(() => loadCombat(), 100);
          }}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
};

// TOP BAR COMPONENT
interface TopBarProps {
  currentTeam: string;
  roundNumber: number;
  teamColor: string;
  aiVsAi: boolean;
  onToggleAi: () => void;
  onRestartCombat: () => void;
  onExit: () => void;
  onSettings: () => void;
}

const TopBar: React.FC<TopBarProps> = ({
  currentTeam,
  roundNumber,
  teamColor,
  aiVsAi,
  onToggleAi,
  onRestartCombat,
  onExit,
  onSettings,
}) => (
  <div className="h-14 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4">
    <div className="flex items-center gap-6">
      <button
        onClick={onExit}
        className="flex items-center gap-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Exit
      </button>
      <span className={`font-bold text-lg ${teamColor}`}>
        {currentTeam === 'blue' ? '🔵' : '🔴'} {currentTeam.toUpperCase()} Team's Turn
      </span>
      <span className="text-gray-400">Round: {roundNumber}</span>
    </div>
    <div className="flex items-center gap-2">
      <button
        onClick={onRestartCombat}
        className="flex items-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-500 rounded font-bold transition-all"
        title="Generate new enemies and restart combat"
      >
        <RefreshCw className="w-4 h-4" />
        Restart
      </button>
      <button
        onClick={onToggleAi}
        className={`flex items-center gap-2 px-4 py-2 rounded font-bold transition-all ${
          aiVsAi
            ? 'bg-green-600 hover:bg-green-500 animate-pulse'
            : 'bg-purple-700 hover:bg-purple-600'
        }`}
      >
        <Bot className="w-5 h-5" />
        {aiVsAi ? 'AI vs AI ON' : 'AI vs AI'}
      </button>
      <button
        onClick={onSettings}
        className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded"
        title="Combat Settings"
      >
        <Settings className="w-4 h-4" />
      </button>
    </div>
  </div>
);

// UNIT CARDS BAR
interface UnitCardsBarProps {
  units: CombatUnit[];
  selectedUnitId?: string;
  currentTeam: string;
}

const UnitCardsBar: React.FC<UnitCardsBarProps> = ({ units, selectedUnitId, currentTeam }) => {
  const blueUnits = units.filter(u => u.team === 'blue');
  // Only show visible red units, or show hidden count
  const visibleRedUnits = units.filter(u => u.team === 'red' && u.visible);
  const hiddenRedCount = units.filter(u => u.team === 'red' && !u.visible).length;

  return (
    <div className="bg-gray-800 border-t border-cyan-500 px-4 py-2">
      <div className="flex items-center gap-4">
        {/* Blue Team */}
        <div className="flex items-center gap-2">
          <span className="text-blue-400 font-bold text-sm">🔵 BLUE</span>
          <div className="flex gap-2">
            {blueUnits.map(unit => (
              <UnitCard
                key={unit.id}
                unit={unit}
                isSelected={unit.id === selectedUnitId}
                isCurrentTeam={currentTeam === 'blue'}
              />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="w-1 h-16 bg-gradient-to-b from-gray-700 via-cyan-500 to-gray-700 mx-2" />

        {/* Red Team - Only show visible enemies */}
        <div className="flex items-center gap-2">
          <span className="text-red-400 font-bold text-sm">🔴 RED</span>
          <div className="flex gap-2">
            {visibleRedUnits.map(unit => (
              <UnitCard
                key={unit.id}
                unit={unit}
                isSelected={unit.id === selectedUnitId}
                isCurrentTeam={currentTeam === 'red'}
              />
            ))}
            {/* Show hidden enemy indicator */}
            {hiddenRedCount > 0 && (
              <div className="w-28 p-2 rounded-lg bg-gray-900 border border-red-800 flex items-center justify-center">
                <span className="text-red-400 text-sm">
                  👁️‍🗨️ {hiddenRedCount} hidden
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// UNIT CARD
interface UnitCardProps {
  unit: CombatUnit;
  isSelected: boolean;
  isCurrentTeam: boolean;
}

const UnitCard: React.FC<UnitCardProps> = ({ unit, isSelected, isCurrentTeam }) => {
  const healthPercent = (unit.hp / unit.maxHp) * 100;
  const healthColor = healthPercent < 25 ? 'bg-red-500' : healthPercent < 50 ? 'bg-yellow-500' : 'bg-green-500';
  const teamColor = unit.team === 'blue' ? 'border-blue-500' : 'border-red-500';

  const handleClick = () => {
    EventBridge.emit('select-unit', { unitId: unit.id });
  };

  return (
    <div
      onClick={handleClick}
      className={`w-28 p-2 rounded-lg cursor-pointer transition-all ${
        isSelected
          ? 'bg-yellow-600 bg-opacity-30 border-2 border-yellow-400 shadow-lg shadow-yellow-400/20'
          : unit.acted
          ? 'bg-gray-800 opacity-50 border border-gray-600'
          : `bg-gray-800 border ${teamColor} hover:bg-gray-700`
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <span className={`font-bold text-xs truncate ${unit.team === 'blue' ? 'text-blue-300' : 'text-red-300'}`}>
          {unit.name}
        </span>
        <span className="text-sm">{unit.weaponEmoji}</span>
      </div>

      {/* HP Bar */}
      <div className="h-2 bg-gray-700 rounded overflow-hidden mb-1">
        <div
          className={`h-full ${healthColor} transition-all`}
          style={{ width: `${healthPercent}%` }}
        />
      </div>

      {/* Stats */}
      <div className="flex justify-between text-xs text-gray-400">
        <span>HP: {unit.hp}/{unit.maxHp}</span>
        <span>AP: {unit.ap}</span>
      </div>

      {/* AP Dots */}
      <div className="flex gap-0.5 mt-1">
        {Array(unit.maxAp).fill(0).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full ${
              i < unit.ap ? 'bg-blue-400' : 'bg-gray-600'
            }`}
          />
        ))}
      </div>

      {/* Status Effects */}
      {unit.statusEffects.length > 0 && (
        <div className="flex gap-1 mt-1 flex-wrap">
          {unit.statusEffects.map((effect, i) => (
            <span key={i} className="text-xs bg-red-800 px-1 rounded">
              {effect}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// SIDE PANEL COMPONENT
interface SidePanelProps {
  logEntries: LogEntry[];
  selectedUnit: any;
}

const SidePanel: React.FC<SidePanelProps> = ({ logEntries, selectedUnit }) => (
  <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
    {/* Combat Log */}
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="p-3 border-b border-gray-700 font-semibold flex items-center gap-2">
        <span>📜</span> COMBAT LOG
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm font-mono">
        {logEntries.slice(-50).reverse().map((entry) => (
          <LogEntryItem key={entry.id} entry={entry} />
        ))}
      </div>
    </div>

    {/* Selected Unit Info */}
    {selectedUnit && (
      <div className="border-t border-cyan-500 p-3 bg-gray-900">
        <div className="font-semibold mb-2 text-cyan-400">SELECTED: {selectedUnit.name}</div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">HP:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono">
                {selectedUnit.hp}/{selectedUnit.maxHp}
              </span>
              <HealthBar
                current={selectedUnit.hp}
                max={selectedUnit.maxHp}
                width={80}
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">AP:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono">
                {selectedUnit.ap}/{selectedUnit.maxAp}
              </span>
              <APBar
                current={selectedUnit.ap}
                max={selectedUnit.maxAp}
                width={80}
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Position:</span>
            <span className="font-mono">
              ({selectedUnit.position.x}, {selectedUnit.position.y})
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Cover:</span>
            <span className={selectedUnit.isInCover === 'none' ? 'text-gray-500' : 'text-green-400'}>
              {selectedUnit.isInCover}
            </span>
          </div>
        </div>
      </div>
    )}
  </div>
);

// LOG ENTRY COMPONENT
const LogEntryItem: React.FC<{ entry: LogEntry }> = ({ entry }) => {
  // Team-based border colors
  const teamBorderColor = entry.actorTeam === 'blue'
    ? 'border-blue-500'
    : entry.actorTeam === 'red'
    ? 'border-red-500'
    : 'border-gray-500';

  // Type-based text colors
  const typeTextStyles: Record<string, string> = {
    attack: 'text-orange-300',
    move: 'text-cyan-300',
    damage: 'text-red-300',
    status: 'text-yellow-300',
    death: 'text-red-400 font-bold',
    item: 'text-green-300',
    system: 'text-purple-300',
  };

  // Type icons
  const typeIcons: Record<string, string> = {
    attack: '⚔️',
    move: '👣',
    damage: '💥',
    status: '⚡',
    death: '💀',
    item: '📦',
    system: '⚙️',
  };

  return (
    <div className={`border-l-3 pl-2 py-0.5 ${teamBorderColor} ${typeTextStyles[entry.type] || 'text-gray-300'}`}
         style={{ borderLeftWidth: '3px' }}>
      <div className="text-xs flex items-center gap-1">
        <span>{typeIcons[entry.type] || '•'}</span>
        <span>{entry.message}</span>
      </div>
      {entry.details?.map((detail, i) => (
        <div key={i} className="text-xs text-gray-500 pl-4">
          {detail}
        </div>
      ))}
    </div>
  );
};

// HEALTH BAR COMPONENT
const HealthBar: React.FC<{ current: number; max: number; width: number }> = ({
  current,
  max,
  width,
}) => {
  const percent = (current / max) * 100;
  const color =
    percent < 25
      ? 'bg-red-500'
      : percent < 50
      ? 'bg-yellow-500'
      : 'bg-green-500';

  return (
    <div
      className="h-3 bg-gray-700 rounded overflow-hidden"
      style={{ width }}
    >
      <div
        className={`h-full ${color} transition-all`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
};

// AP BAR COMPONENT
const APBar: React.FC<{ current: number; max: number; width: number }> = ({
  current,
  max,
  width,
}) => {
  const percent = (current / max) * 100;

  return (
    <div
      className="h-3 bg-gray-700 rounded overflow-hidden"
      style={{ width }}
    >
      <div
        className="h-full bg-blue-500 transition-all"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
};

// BOTTOM BAR COMPONENT
interface BottomBarProps {
  selectedUnit: any;
  weaponInfo: { name: string; emoji: string; damage: number; range: number } | null;
  unitData: CombatUnit | undefined;
  actions: ReturnType<typeof useCombatActions>;
  onGadgetClick: () => void;
  onInventoryClick: () => void;
}

const BottomBar: React.FC<BottomBarProps> = ({
  selectedUnit,
  weaponInfo,
  unitData,
  actions,
  onGadgetClick,
  onInventoryClick,
}) => {
  if (!selectedUnit) {
    return (
      <div className="h-24 bg-gray-800 border-t border-gray-700 flex items-center justify-center text-gray-500">
        Click on a unit to select it
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border-t border-gray-700">
      {/* Character Info Row */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-gray-700">
        <div className={`w-12 h-12 rounded flex items-center justify-center text-xl ${
          selectedUnit.team === 'blue' ? 'bg-blue-800' : 'bg-red-800'
        }`}>
          {unitData?.weaponEmoji || '👤'}
        </div>
        <div className="flex-1">
          <div className="font-bold text-lg">{selectedUnit.name}</div>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>HP: {selectedUnit.hp}/{selectedUnit.maxHp}</span>
            <span>AP: {selectedUnit.ap}/{selectedUnit.maxAp}</span>
            {unitData && <span className="text-cyan-400">{unitData.personality}</span>}
          </div>
        </div>

        {/* Weapon Display */}
        {weaponInfo && (
          <div className="flex items-center gap-3 px-4 py-2 bg-gray-700 rounded-lg">
            <span className="text-2xl">{weaponInfo.emoji}</span>
            <div>
              <div className="font-bold text-sm">{weaponInfo.name}</div>
              <div className="text-xs text-gray-400">
                DMG: {weaponInfo.damage} | RNG: {weaponInfo.range}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Powers Panel */}
      {selectedUnit.powers && selectedUnit.powers.length > 0 && (
        <div className="px-4 py-2 border-b border-gray-700">
          <PowersPanel
            unitId={selectedUnit.id}
            unitName={selectedUnit.name}
            powers={selectedUnit.powers}
            currentAp={selectedUnit.ap}
          />
        </div>
      )}

      {/* Action Buttons Row */}
      <div className="flex items-center gap-2 px-4 py-2">
        <ActionButton
          icon={<Crosshair className="w-5 h-5" />}
          label="ATTACK"
          hotkey="A"
          onClick={actions.startAttackMode}
          disabled={selectedUnit.ap < 1}
          color="red"
        />
        <ActionButton
          icon={<Footprints className="w-5 h-5" />}
          label="MOVE"
          hotkey="M"
          onClick={actions.startMoveMode}
          disabled={selectedUnit.ap < 1}
          color="blue"
        />
        <ActionButton
          icon={<Target className="w-5 h-5" />}
          label="THROW"
          hotkey="T"
          onClick={actions.startThrowMode}
          color="orange"
        />
        <ActionButton
          icon={<Settings className="w-5 h-5" />}
          label="GADGET"
          hotkey="G"
          onClick={onGadgetClick}
          color="purple"
        />
        <ActionButton
          icon={<Package className="w-5 h-5" />}
          label="ITEM"
          hotkey="I"
          onClick={onInventoryClick}
          color="green"
        />
        <ActionButton
          icon={<Eye className="w-5 h-5" />}
          label="OVERWATCH"
          hotkey="O"
          onClick={() => {}}
          disabled={selectedUnit.ap < 3}
          color="cyan"
        />
        <div className="flex-1" />
        <ActionButton
          icon={<Check className="w-5 h-5" />}
          label="END TURN"
          hotkey="E"
          onClick={actions.endTurn}
          variant="primary"
        />
      </div>
    </div>
  );
};

// ACTION BUTTON COMPONENT
interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  hotkey: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'primary';
  color?: 'red' | 'blue' | 'orange' | 'purple' | 'green' | 'cyan';
}

const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  label,
  hotkey,
  onClick,
  disabled = false,
  variant = 'default',
  color,
}) => {
  const colorClasses: Record<string, string> = {
    red: 'hover:bg-red-800 hover:border-red-500',
    blue: 'hover:bg-blue-800 hover:border-blue-500',
    orange: 'hover:bg-orange-800 hover:border-orange-500',
    purple: 'hover:bg-purple-800 hover:border-purple-500',
    green: 'hover:bg-green-800 hover:border-green-500',
    cyan: 'hover:bg-cyan-800 hover:border-cyan-500',
  };

  const baseClasses = 'flex items-center gap-2 px-3 py-2 rounded border transition-all';
  const variantClasses =
    variant === 'primary'
      ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500'
      : `bg-gray-700 text-white border-gray-600 ${color ? colorClasses[color] : 'hover:bg-gray-600'}`;
  const disabledClasses = disabled
    ? 'opacity-40 cursor-not-allowed'
    : 'cursor-pointer';

  return (
    <button
      className={`${baseClasses} ${variantClasses} ${disabledClasses}`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      {icon}
      <span className="text-sm font-bold">{label}</span>
      <span className="text-xs text-gray-400 bg-gray-800 px-1 rounded">{hotkey}</span>
    </button>
  );
};

// GADGET PANEL MODAL
interface GadgetPanelProps {
  onClose: () => void;
  characterEquipment: string[];
  characterPowers: string[];
}

const GadgetPanel: React.FC<GadgetPanelProps> = ({ onClose, characterEquipment, characterPowers }) => {
  // Categorize equipment
  const gadgets = characterEquipment.filter(e =>
    e.toLowerCase().includes('goggles') ||
    e.toLowerCase().includes('scanner') ||
    e.toLowerCase().includes('radio') ||
    e.toLowerCase().includes('sensor') ||
    e.toLowerCase().includes('stabilizer') ||
    e.toLowerCase().includes('visor')
  );

  const deployables = characterEquipment.filter(e =>
    e.toLowerCase().includes('grenade') ||
    e.toLowerCase().includes('mine') ||
    e.toLowerCase().includes('explosive') ||
    e.toLowerCase().includes('trap')
  );

  const hasEquipment = gadgets.length > 0 || deployables.length > 0 || characterPowers.length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-96 max-h-96 overflow-hidden border border-cyan-500">
        <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-900">
          <span className="font-semibold text-cyan-400">GADGETS & POWERS</span>
          <button onClick={onClose} className="hover:bg-gray-700 p-1 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 space-y-4 overflow-y-auto max-h-80">
          {!hasEquipment && (
            <div className="text-gray-500 text-center py-4">
              No gadgets or powers equipped.
              <br />
              <span className="text-xs">Equip items in Character screen.</span>
            </div>
          )}

          {characterPowers.length > 0 && (
            <div>
              <div className="text-sm text-gray-400 mb-2">⚡ POWERS</div>
              {characterPowers.map((power, i) => (
                <div key={i} className="bg-purple-900 bg-opacity-40 p-2 rounded mb-1 border border-purple-600">
                  <div className="flex items-center justify-between">
                    <span className="text-purple-300">{power}</span>
                    <span className="text-xs text-purple-400">[2 AP]</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {gadgets.length > 0 && (
            <div>
              <div className="text-sm text-gray-400 mb-2">🔧 GADGETS</div>
              {gadgets.map((gadget, i) => (
                <GadgetItem key={i} name={gadget} type="toggle" isActive={false} apCost={1} />
              ))}
            </div>
          )}

          {deployables.length > 0 && (
            <div>
              <div className="text-sm text-gray-400 mb-2">💣 DEPLOYABLES</div>
              {deployables.map((item, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-700 p-2 rounded mb-1">
                  <span>{item}</span>
                  <button className="px-2 py-1 bg-blue-600 rounded text-xs hover:bg-blue-500">Deploy [2 AP]</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// GADGET ITEM COMPONENT
interface GadgetItemProps {
  name: string;
  type: 'toggle' | 'mode' | 'intensity';
  isActive: boolean;
  power?: number;
  modes?: string[];
  intensity?: number;
  apCost?: number;
}

const GadgetItem: React.FC<GadgetItemProps> = ({
  name,
  type,
  isActive,
  power,
  modes,
  intensity,
  apCost,
}) => (
  <div className="bg-gray-700 p-2 rounded mb-1">
    <div className="flex items-center justify-between mb-1">
      <span>{name}</span>
      {type === 'toggle' && (
        <button className={`px-2 py-0.5 rounded text-xs ${isActive ? 'bg-green-600' : 'bg-gray-600'}`}>
          {isActive ? 'ON' : 'OFF'}
        </button>
      )}
    </div>

    {type === 'mode' && modes && (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-400">Mode:</span>
        <select className="bg-gray-600 rounded px-2 py-0.5 text-xs">
          {modes.map((mode) => <option key={mode}>{mode}</option>)}
        </select>
      </div>
    )}

    {type === 'intensity' && (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-400">Intensity:</span>
        <input type="range" min="0" max="100" defaultValue={intensity || 0} className="flex-1" />
        <span>{intensity || 0}%</span>
      </div>
    )}

    {power !== undefined && (
      <div className="flex items-center gap-2 text-sm mt-1">
        <span className="text-gray-400">Power:</span>
        <div className="flex-1 h-1 bg-gray-600 rounded">
          <div className="h-full bg-yellow-500 rounded" style={{ width: `${power}%` }} />
        </div>
        <span>{power}%</span>
      </div>
    )}

    {apCost !== undefined && !isActive && (
      <div className="text-xs text-gray-400 mt-1">[Toggle: {apCost} AP]</div>
    )}
  </div>
);

// INVENTORY PANEL MODAL
interface InventoryPanelProps {
  onClose: () => void;
  unitData: CombatUnit | undefined;
  characterEquipment: string[];
}

const InventoryPanel: React.FC<InventoryPanelProps> = ({ onClose, unitData, characterEquipment }) => {
  const weaponInfo = unitData ? WEAPONS[unitData.weapon] : null;

  // Categorize equipment
  const weapons = characterEquipment.filter(e =>
    e.toLowerCase().includes('rifle') ||
    e.toLowerCase().includes('pistol') ||
    e.toLowerCase().includes('shotgun') ||
    e.toLowerCase().includes('sword') ||
    e.toLowerCase().includes('shield') ||
    e.toLowerCase().includes('staff')
  );

  const armor = characterEquipment.filter(e =>
    e.toLowerCase().includes('armor') ||
    e.toLowerCase().includes('vest') ||
    e.toLowerCase().includes('helmet') ||
    e.toLowerCase().includes('suit')
  );

  const items = characterEquipment.filter(e =>
    !weapons.includes(e) && !armor.includes(e)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-[600px] max-h-[500px] overflow-hidden border border-cyan-500">
        <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-900">
          <span className="font-semibold text-cyan-400">
            INVENTORY - {unitData?.name || 'Unknown'}
          </span>
          <button onClick={onClose} className="hover:bg-gray-700 p-1 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex">
          {/* Equipment Slots */}
          <div className="w-1/2 p-3 border-r border-gray-700">
            <div className="text-sm text-gray-400 mb-2">🛡️ ARMOR</div>
            <div className="space-y-1 text-sm">
              {armor.length > 0 ? (
                armor.map((item, i) => (
                  <EquipmentSlot key={i} label={`SLOT ${i + 1}`} item={item} />
                ))
              ) : (
                <div className="text-gray-500 text-xs italic">No armor equipped</div>
              )}
            </div>

            <div className="text-sm text-gray-400 mt-4 mb-2">⚔️ WEAPONS</div>
            <div className="space-y-1 text-sm">
              <EquipmentSlot
                label="ACTIVE"
                item={weaponInfo ? `${weaponInfo.emoji} ${weaponInfo.name}` : '👊 Fists'}
              />
              {weapons.map((weapon, i) => (
                <EquipmentSlot key={i} label={i === 0 ? 'PRIMARY' : 'SECONDARY'} item={weapon} />
              ))}
            </div>

            <div className="text-sm text-gray-400 mt-4 mb-2">🎒 ITEMS</div>
            <div className="grid grid-cols-3 gap-1">
              {items.length > 0 ? (
                items.map((item, i) => (
                  <div key={i} className="bg-gray-700 p-1 rounded text-center text-xs hover:bg-gray-600 cursor-pointer">
                    {item}
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-gray-500 text-xs italic">No items</div>
              )}
            </div>
          </div>

          {/* Stats Summary */}
          <div className="w-1/2 p-3">
            <div className="text-sm text-gray-400 mb-2">📊 COMBAT STATS</div>
            {unitData && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">HP:</span>
                  <span>{unitData.hp}/{unitData.maxHp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">AP:</span>
                  <span>{unitData.ap}/{unitData.maxAp}</span>
                </div>
                {weaponInfo && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Weapon Damage:</span>
                      <span className="text-red-400">{weaponInfo.damage}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Weapon Range:</span>
                      <span className="text-blue-400">{weaponInfo.range}</span>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="text-sm text-gray-400 mt-4 mb-2">📋 ALL EQUIPMENT</div>
            <div className="bg-gray-900 rounded p-2 max-h-32 overflow-y-auto">
              {characterEquipment.length > 0 ? (
                <ul className="text-xs space-y-1">
                  {characterEquipment.map((item, i) => (
                    <li key={i} className="text-gray-300">• {item}</li>
                  ))}
                </ul>
              ) : (
                <div className="text-gray-500 text-xs italic">No equipment</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// EQUIPMENT SLOT COMPONENT
const EquipmentSlot: React.FC<{ label: string; item: string }> = ({ label, item }) => (
  <div className="flex items-center justify-between bg-gray-700 p-1 rounded">
    <span className="text-gray-400 w-20">{label}:</span>
    <span className={item === 'Empty' ? 'text-gray-500' : 'text-white'}>{item}</span>
  </div>
);

// POST-BATTLE SUMMARY MODAL
interface PostBattleSummaryProps {
  data: CombatStatsEvent;
  onClose: () => void;
  onRematch: () => void;
}

const PostBattleSummary: React.FC<PostBattleSummaryProps> = ({ data, onClose, onRematch }) => {
  const { stats, awards, winner, rounds, survivors } = data;

  const winnerColor = winner === 'blue' ? 'text-blue-400' : 'text-red-400';
  const winnerBg = winner === 'blue' ? 'from-blue-900/50' : 'from-red-900/50';

  // Sort units by damage dealt for MVP display
  const unitStats = Object.entries(stats.damageByUnit)
    .map(([name, s]) => ({ name, ...s }))
    .sort((a, b) => b.dealt - a.dealt);

  const blueStats = unitStats.filter(u => u.team === 'blue');
  const redStats = unitStats.filter(u => u.team === 'red');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-gray-900 rounded-lg w-[800px] max-h-[90vh] overflow-hidden border-2 border-yellow-500 shadow-2xl">
        {/* Header */}
        <div className={`bg-gradient-to-r ${winnerBg} to-gray-900 p-6 text-center border-b border-gray-700`}>
          <div className="flex items-center justify-center gap-3 mb-2">
            <Trophy className="w-10 h-10 text-yellow-400" />
            <h2 className={`text-3xl font-bold ${winnerColor}`}>
              {winner.toUpperCase()} TEAM VICTORY!
            </h2>
            <Trophy className="w-10 h-10 text-yellow-400" />
          </div>
          <div className="text-gray-400">
            Battle concluded in {rounds} round{rounds !== 1 ? 's' : ''} | {stats.killLog.length} casualties
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
          {/* Awards Section */}
          <div className="grid grid-cols-3 gap-3">
            {awards.mvp && (
              <AwardCard
                icon={<Swords className="w-6 h-6" />}
                title="MVP"
                name={awards.mvp}
                description="Most Damage Dealt"
                value={`${unitStats.find(u => u.name === awards.mvp)?.dealt || 0} damage`}
                color="yellow"
              />
            )}
            {awards.reaper && (
              <AwardCard
                icon={<Skull className="w-6 h-6" />}
                title="REAPER"
                name={awards.reaper}
                description="Most Kills"
                value={`${unitStats.find(u => u.name === awards.reaper)?.kills || 0} kills`}
                color="red"
              />
            )}
            {awards.firstBlood && (
              <AwardCard
                icon={<Zap className="w-6 h-6" />}
                title="FIRST BLOOD"
                name={awards.firstBlood}
                description={stats.firstBlood ? `Killed ${stats.firstBlood.victim}` : 'First Kill'}
                value={stats.firstBlood?.weapon || ''}
                color="orange"
              />
            )}
            {awards.tank && (
              <AwardCard
                icon={<Shield className="w-6 h-6" />}
                title="TANK"
                name={awards.tank}
                description="Most Damage Absorbed"
                value={`${stats.mostDamageTaken.damage} damage taken`}
                color="blue"
              />
            )}
            {awards.finalBlow && (
              <AwardCard
                icon={<Target className="w-6 h-6" />}
                title="FINAL BLOW"
                name={awards.finalBlow}
                description={stats.lastKill ? `Finished ${stats.lastKill.victim}` : 'Ending Kill'}
                value={stats.lastKill?.weapon || ''}
                color="purple"
              />
            )}
            {awards.killstreak && stats.longestKillstreak.streak >= 2 && (
              <AwardCard
                icon={<Skull className="w-6 h-6" />}
                title="KILLSTREAK"
                name={awards.killstreak}
                description="Consecutive Kills"
                value={`${stats.longestKillstreak.streak} in a row`}
                color="red"
              />
            )}
          </div>

          {/* Team Stats */}
          <div className="grid grid-cols-2 gap-4">
            {/* Blue Team */}
            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3">
              <h3 className="text-blue-400 font-bold text-lg mb-3 flex items-center gap-2">
                <span className="text-2xl">🔵</span> BLUE TEAM
              </h3>
              <div className="space-y-1 text-sm">
                <StatRow label="Total Damage" value={stats.totalDamageDealt.blue} />
                <StatRow label="Kills" value={stats.totalKills.blue} />
                <StatRow label="Shots Fired" value={stats.shotsFired.blue} />
                <StatRow label="Hits" value={stats.hits.blue} />
                <StatRow label="Critical Hits" value={stats.criticalHits.blue} color="text-yellow-400" />
                <StatRow label="Accuracy" value={`${stats.shotsFired.blue > 0 ? Math.round((stats.hits.blue / stats.shotsFired.blue) * 100) : 0}%`} />
              </div>

              {/* Individual Blue Stats */}
              <div className="mt-3 pt-3 border-t border-blue-700/50">
                <div className="text-xs text-gray-400 mb-2">INDIVIDUAL PERFORMANCE</div>
                {blueStats.map((unit, i) => (
                  <UnitStatRow key={i} unit={unit} />
                ))}
              </div>
            </div>

            {/* Red Team */}
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
              <h3 className="text-red-400 font-bold text-lg mb-3 flex items-center gap-2">
                <span className="text-2xl">🔴</span> RED TEAM
              </h3>
              <div className="space-y-1 text-sm">
                <StatRow label="Total Damage" value={stats.totalDamageDealt.red} />
                <StatRow label="Kills" value={stats.totalKills.red} />
                <StatRow label="Shots Fired" value={stats.shotsFired.red} />
                <StatRow label="Hits" value={stats.hits.red} />
                <StatRow label="Critical Hits" value={stats.criticalHits.red} color="text-yellow-400" />
                <StatRow label="Accuracy" value={`${stats.shotsFired.red > 0 ? Math.round((stats.hits.red / stats.shotsFired.red) * 100) : 0}%`} />
              </div>

              {/* Individual Red Stats */}
              <div className="mt-3 pt-3 border-t border-red-700/50">
                <div className="text-xs text-gray-400 mb-2">INDIVIDUAL PERFORMANCE</div>
                {redStats.map((unit, i) => (
                  <UnitStatRow key={i} unit={unit} />
                ))}
              </div>
            </div>
          </div>

          {/* Kill Log */}
          {stats.killLog.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-3">
              <h3 className="text-gray-300 font-bold mb-2 flex items-center gap-2">
                <Skull className="w-4 h-4 text-red-400" /> KILL LOG
              </h3>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {stats.killLog.map((kill, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm bg-gray-700/50 p-1 px-2 rounded">
                    <span className="text-gray-400 text-xs">R{kill.turn}</span>
                    <span className="text-white font-medium">{kill.killer}</span>
                    <span className="text-gray-400">→</span>
                    <span className="text-red-400 line-through">{kill.victim}</span>
                    <span className="text-gray-500 text-xs">({kill.weapon})</span>
                    <span className="text-red-300 text-xs">{kill.damage} dmg</span>
                    {kill.overkill > 0 && (
                      <span className="text-yellow-400 text-xs font-bold">+{kill.overkill} OVERKILL</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Survivors */}
          {survivors.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-3">
              <h3 className="text-gray-300 font-bold mb-2">SURVIVORS</h3>
              <div className="flex flex-wrap gap-2">
                {survivors.map((s, i) => (
                  <div
                    key={i}
                    className={`px-3 py-1 rounded text-sm ${
                      s.team === 'blue' ? 'bg-blue-800/50 border border-blue-600' : 'bg-red-800/50 border border-red-600'
                    }`}
                  >
                    {s.name} <span className="text-gray-400">({s.hp} HP)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-800 border-t border-gray-700 p-4 flex justify-center gap-4">
          <button
            onClick={onRematch}
            className="flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-500 rounded-lg font-bold text-lg transition-all"
          >
            <RefreshCw className="w-5 h-5" />
            REMATCH
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-500 rounded-lg font-bold text-lg transition-all"
          >
            <X className="w-5 h-5" />
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};

// Award Card Component
interface AwardCardProps {
  icon: React.ReactNode;
  title: string;
  name: string;
  description: string;
  value: string;
  color: 'yellow' | 'red' | 'orange' | 'blue' | 'purple' | 'green';
}

const AwardCard: React.FC<AwardCardProps> = ({ icon, title, name, description, value, color }) => {
  const colorClasses: Record<string, { bg: string; border: string; text: string }> = {
    yellow: { bg: 'bg-yellow-900/30', border: 'border-yellow-600', text: 'text-yellow-400' },
    red: { bg: 'bg-red-900/30', border: 'border-red-600', text: 'text-red-400' },
    orange: { bg: 'bg-orange-900/30', border: 'border-orange-600', text: 'text-orange-400' },
    blue: { bg: 'bg-blue-900/30', border: 'border-blue-600', text: 'text-blue-400' },
    purple: { bg: 'bg-purple-900/30', border: 'border-purple-600', text: 'text-purple-400' },
    green: { bg: 'bg-green-900/30', border: 'border-green-600', text: 'text-green-400' },
  };

  const c = colorClasses[color];

  return (
    <div className={`${c.bg} border ${c.border} rounded-lg p-3 text-center`}>
      <div className={`flex items-center justify-center gap-2 ${c.text} mb-1`}>
        {icon}
        <span className="font-bold text-sm">{title}</span>
      </div>
      <div className="text-white font-bold text-lg truncate">{name}</div>
      <div className="text-gray-400 text-xs">{description}</div>
      {value && <div className={`${c.text} text-sm mt-1`}>{value}</div>}
    </div>
  );
};

// Stat Row Component
const StatRow: React.FC<{ label: string; value: number | string; color?: string }> = ({
  label,
  value,
  color = 'text-white',
}) => (
  <div className="flex justify-between">
    <span className="text-gray-400">{label}:</span>
    <span className={color}>{value}</span>
  </div>
);

// Unit Stat Row Component
const UnitStatRow: React.FC<{ unit: UnitCombatStats & { name: string } }> = ({ unit }) => (
  <div className="flex items-center justify-between text-xs py-1 border-b border-gray-700/30 last:border-0">
    <span className="text-gray-300 truncate flex-1">{unit.name}</span>
    <div className="flex gap-3 text-gray-400">
      <span title="Damage Dealt">{unit.dealt} dmg</span>
      <span title="Kills" className="text-red-400">{unit.kills} kills</span>
      <span title="Shots Hit">{unit.hits}/{unit.shots}</span>
    </div>
  </div>
);

// SETTINGS MODAL COMPONENT
interface SettingsModalProps {
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [gridSize, setGridSize] = useState('15x15');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showDamageNumbers, setShowDamageNumbers] = useState(true);
  const [animationSpeed, setAnimationSpeed] = useState('normal');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-[500px] max-h-[80vh] overflow-hidden border border-cyan-500">
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900">
          <span className="font-semibold text-cyan-400 text-lg">Combat Settings</span>
          <button onClick={onClose} className="hover:bg-gray-700 p-1 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-6 overflow-y-auto max-h-[60vh]">
          {/* Grid Size */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Grid Size</label>
            <select
              value={gridSize}
              onChange={(e) => setGridSize(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
            >
              <option value="10x10">Small (10x10)</option>
              <option value="15x15">Medium (15x15)</option>
              <option value="20x20">Large (20x20)</option>
              <option value="25x25">Extra Large (25x25)</option>
            </select>
          </div>

          {/* Animation Speed */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Animation Speed</label>
            <select
              value={animationSpeed}
              onChange={(e) => setAnimationSpeed(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
            >
              <option value="slow">Slow</option>
              <option value="normal">Normal</option>
              <option value="fast">Fast</option>
              <option value="instant">Instant</option>
            </select>
          </div>

          {/* Toggles */}
          <div className="space-y-3">
            <ToggleSetting
              label="Sound Effects"
              description="Enable combat sound effects"
              value={soundEnabled}
              onChange={setSoundEnabled}
            />
            <ToggleSetting
              label="Damage Numbers"
              description="Show floating damage numbers"
              value={showDamageNumbers}
              onChange={setShowDamageNumbers}
            />
          </div>

          {/* Info */}
          <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
            <div className="text-xs text-gray-500">
              Note: Some settings require a combat restart to take effect.
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-700 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded font-medium transition-colors"
          >
            Close
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded font-medium transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

// Toggle Setting Component
interface ToggleSettingProps {
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

const ToggleSetting: React.FC<ToggleSettingProps> = ({ label, description, value, onChange }) => (
  <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
    <div>
      <div className="text-white font-medium">{label}</div>
      <div className="text-xs text-gray-400">{description}</div>
    </div>
    <button
      onClick={() => onChange(!value)}
      className={`w-12 h-6 rounded-full transition-colors ${
        value ? 'bg-cyan-600' : 'bg-gray-600'
      }`}
    >
      <div
        className={`w-5 h-5 bg-white rounded-full transition-transform ${
          value ? 'translate-x-6' : 'translate-x-0.5'
        }`}
      />
    </button>
  </div>
);

export default CombatLab;
