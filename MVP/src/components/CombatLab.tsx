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

import React, { useState, useEffect, useMemo } from 'react';
import { PhaserGame, useCombatState, useCombatActions } from './PhaserGame';
import { EventBridge, LogEntry, CombatCharacter, CombatStatsEvent, CombatAwards, CombatStats, UnitCombatStats, KillEntry, GrappleInteraction, GrappleState, CharacterMartialArts } from '../game/EventBridge';
import { useGameStore } from '../stores/enhancedGameStore';
import { PowersPanel } from './PowersPanel';
import { GrapplePanel } from './GrapplePanel';
import QuickInventory from './QuickInventory';
// Weapon and Armor Database for Balance Testing
import { ALL_WEAPONS, getWeaponByName } from '../data/weapons';
import { ALL_ARMOR, getArmorByName } from '../data/armor';
// Fast Combat - Streamlined combat viewer
import FastCombat from './FastCombat';
import { SimUnit } from '../combat/types';

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
  LogOut,
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
    shield: Math.random() > 0.7 ? Math.floor(Math.random() * 20) + 10 : 0, // 30% chance of shield
    maxShield: Math.random() > 0.7 ? 30 : 0,
    shieldRegen: Math.random() > 0.7 ? 3 : 0,
    dr: Math.floor(Math.random() * 8) + 2, // 2-10 armor
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

interface StatusEffectData {
  name: string;
  emoji: string;
  duration: number;
  stacks: number;
  description: string;
}

interface CombatUnit {
  id: string;
  name: string;
  codename: string;
  team: string;
  hp: number;
  maxHp: number;
  ap: number;
  maxAp: number;
  // Shield system - absorbs damage before HP
  shield: number;
  maxShield: number;
  shieldRegen: number;
  // Armor (DR) - reduces incoming damage
  dr: number;
  weapon: string;
  weaponEmoji: string;
  personality: string;
  acted: boolean;
  statusEffects: string[] | StatusEffectData[];
  visible: boolean; // Fog of war
  // Kill/Stun system
  damageMode?: 'kill' | 'stun';
  weaponStunCapable?: boolean;
  weaponAlwaysLethal?: boolean;
  weaponAlwaysNonLethal?: boolean;
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

  // Balance Test Mode state
  const [showBalanceTest, setShowBalanceTest] = useState(false);
  const [testWeapon, setTestWeapon] = useState('Assault Rifle');
  const [testArmor, setTestArmor] = useState('Tactical Vest');
  const [testTeam, setTestTeam] = useState<'blue' | 'red'>('red');
  const [testStats, setTestStats] = useState({ STR: 50, AGL: 50, STA: 50 });

  // Fast Combat Mode - streamlined combat viewer for testing
  const [showFastCombat, setShowFastCombat] = useState(false);

  // Handlers for gadget and inventory
  const onGadgetClick = () => {
    setShowGadgetPanel(!showGadgetPanel);
  };

  const onInventoryClick = () => {
    setShowInventory(!showInventory);
  };
  const [allUnits, setAllUnits] = useState<CombatUnit[]>([]);
  const [combatLoaded, setCombatLoaded] = useState(false);
  const [activeGrapple, setActiveGrapple] = useState<GrappleInteraction | null>(null);
  const [showGrenadeMenu, setShowGrenadeMenu] = useState(false);

  // Get characters and setCurrentView from game store
  const gameCharacters = useGameStore(state => state.characters);
  const setCurrentView = useGameStore(state => state.setCurrentView);
  const updateCharacterInjuries = useGameStore(state => state.updateCharacterInjuries);
  const updateCharacter = useGameStore(state => state.updateCharacter);

  // Convert game store characters to combat format
  const convertToBlueTeam = (): CombatCharacter[] => {
    console.log('[CombatLab] Raw gameCharacters from store:', gameCharacters);
    const filtered = gameCharacters.filter(c => c.status === 'ready' || c.status === 'injured');
    console.log('[CombatLab] Filtered ready/injured:', filtered.map(c => ({ name: c.name, status: c.status })));

    return filtered
      .slice(0, 4) // Max 4 characters
      .map(char => ({
        id: char.id,
        name: char.name,
        realName: char.realName,
        team: 'blue' as const,
        stats: char.stats,
        health: char.health,
        shield: char.shield || 0,
        maxShield: char.maxShield || 0,
        shieldRegen: char.shieldRegen || 0,
        dr: char.dr || 0,
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

  // Convert CombatCharacter to SimUnit for FastCombat
  const convertToSimUnit = (char: CombatCharacter): SimUnit => {
    // Get weapon info from database or default
    const weaponName = char.equipment?.[0] || 'Fists';
    const weapon = getWeaponByName(weaponName);
    const armorName = char.equipment?.[1];
    const armor = armorName ? getArmorByName(armorName) : undefined;

    return {
      id: char.id,
      name: char.name,
      team: char.team,
      hp: char.health.current,
      maxHp: char.health.maximum,
      shieldHp: char.shield || 0,
      maxShieldHp: char.maxShield || 0,
      dr: char.dr || (armor?.drPhysical || 0),
      stoppingPower: armor?.stoppingPower || 0,
      origin: 'biological' as const,
      stats: {
        MEL: char.stats.MEL,
        RNG: char.stats.AGL, // Use AGL for ranged
        AGL: char.stats.AGL,
        CON: char.stats.CON,
        INS: char.stats.INS,
        WIL: char.stats.CON, // Use CON for WIL if not defined
        INT: char.stats.INT,
      },
      stance: 'normal',
      cover: 'none',
      statusEffects: [],
      accuracyPenalty: 0,
      weapon: {
        name: weapon?.name || weaponName,
        damage: weapon?.damage || 20,
        accuracy: weapon?.accuracy || 70,
        damageType: weapon?.damageType || 'physical',
        range: weapon?.range || 10,
        apCost: weapon?.apCost || 3,
      },
      disarmed: false,
      armor: armor ? {
        id: armor.id,
        name: armor.name,
        category: armor.category as 'Light' | 'Medium' | 'Heavy' | 'Power' | 'Shield' | 'Natural',
        drPhysical: armor.drPhysical,
        drEnergy: armor.drEnergy || 0,
        drMental: armor.drMental || 0,
        stoppingPower: armor.stoppingPower || 0,
        caliberRating: (armor.caliberRating as 'none' | 'pistol' | 'smg' | 'rifle' | 'ap' | 'heavy') || 'none',
        coverage: 'Torso',
        condition: armor.conditionMax || 100,
        conditionMax: armor.conditionMax || 100,
        movementPenalty: armor.movementPenalty || 0,
        stealthPenalty: armor.stealthPenalty || 0,
      } : undefined,
      alive: true,
      acted: false,
    };
  };

  // Get SimUnit teams for FastCombat
  const getSimUnitsForFastCombat = useMemo(() => {
    if (!showFastCombat) return { blueTeam: [], redTeam: [] };

    const blueCharacters = convertToBlueTeam();
    const enemyCount = Math.max(2, blueCharacters.length);
    const redCharacters = generateEnemyTeam(enemyCount);

    return {
      blueTeam: blueCharacters.map(convertToSimUnit),
      redTeam: redCharacters.map(convertToSimUnit),
    };
  }, [showFastCombat, gameCharacters]);

  // Spawn a test unit with specific weapon and armor for balance testing
  const spawnTestUnit = () => {
    const weapon = getWeaponByName(testWeapon);
    const armor = getArmorByName(testArmor);

    const testUnit: CombatCharacter = {
      id: `test-${Date.now()}`,
      name: `Test Unit (${testWeapon})`,
      team: testTeam,
      stats: {
        MEL: testStats.STR,
        AGL: testStats.AGL,
        STR: testStats.STR,
        STA: testStats.STA,
        INT: 50,
        INS: 50,
        CON: 50,
      },
      health: { current: 80, maximum: 80 },
      shield: 0,
      maxShield: 0,
      shieldRegen: 0,
      dr: armor?.drPhysical || 0,
      powers: [],
      equipment: [testWeapon, testArmor],
      threatLevel: 'THREAT_2',
      origin: 'Test',
    };

    console.log('[BALANCE TEST] Spawning test unit:', {
      weapon: testWeapon,
      weaponData: weapon,
      armor: testArmor,
      armorData: armor,
      stats: testStats,
      team: testTeam,
    });

    // Emit spawn event to CombatScene
    EventBridge.emit('spawn-test-unit', testUnit);
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

      // Apply injuries to blue team characters (player characters)
      if (data.stats.injuries && data.stats.injuries.length > 0) {
        const blueTeamInjuries = data.stats.injuries.filter(injury => injury.team === 'blue');
        blueTeamInjuries.forEach(injury => {
          updateCharacterInjuries(injury.characterId, {
            type: injury.type,
            severity: injury.severity,
            description: injury.description,
            permanent: injury.permanent,
            turnInflicted: injury.turnInflicted,
          });
        });
      }

      setCombatSummary(data);
      setShowSummary(true);
    });

    // Listen for grapple events
    const unsubGrappleStart = EventBridge.on('grapple-started', (data: GrappleInteraction) => {
      console.log('[COMBAT LAB] Grapple started:', data);
      setActiveGrapple(data);
    });

    const unsubGrappleChange = EventBridge.on('grapple-changed', (data: GrappleInteraction) => {
      console.log('[COMBAT LAB] Grapple changed:', data);
      setActiveGrapple(data);
    });

    const unsubGrappleEnd = EventBridge.on('grapple-ended', (data: { winnerId: string; loserId: string; reason: string }) => {
      console.log('[COMBAT LAB] Grapple ended:', data);
      setActiveGrapple(null);
    });

    // Listen for grenade consumption
    const unsubConsumeGrenade = EventBridge.on('consume-grenade', (data: { unitId: string; grenadeName: string }) => {
      console.log('[COMBAT LAB] Consuming grenade:', data);
      const character = gameCharacters.find(c => c.id === data.unitId);
      if (character && character.equipment) {
        // Remove one instance of the grenade from equipment
        const grenadeIndex = character.equipment.findIndex((item: string) => item === data.grenadeName);
        if (grenadeIndex !== -1) {
          const newEquipment = [...character.equipment];
          newEquipment.splice(grenadeIndex, 1);
          updateCharacter(character.id, { equipment: newEquipment });
          console.log(`[COMBAT LAB] Removed ${data.grenadeName} from ${character.name}'s equipment`);
        }
      }
    });

    return () => {
      unsubscribe();
      unsubAi();
      unsubStats();
      unsubGrappleStart();
      unsubGrappleChange();
      unsubGrappleEnd();
      unsubConsumeGrenade();
    };
  }, [gameCharacters]);

  // Load combat once Phaser is ready
  useEffect(() => {
    if (isLoaded && !combatLoaded) {
      // Load immediately - no delay to prevent flash
      loadCombat();
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

  // If Fast Combat mode is active, render FastCombat instead of Phaser
  if (showFastCombat && getSimUnitsForFastCombat.blueTeam.length > 0) {
    return (
      <FastCombat
        blueTeam={getSimUnitsForFastCombat.blueTeam}
        redTeam={getSimUnitsForFastCombat.redTeam}
        onComplete={(result) => {
          console.log('[FAST COMBAT] Complete:', result);
          setShowFastCombat(false);
        }}
        onBack={() => setShowFastCombat(false)}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* TOP BAR */}
      <TopBar
        currentTeam={currentTeam}
        roundNumber={roundNumber}
        teamColor={teamColor}
        aiVsAi={aiVsAi}
        showBalanceTest={showBalanceTest}
        showFastCombat={showFastCombat}
        onToggleAi={toggleAiVsAi}
        onRestartCombat={() => {
          setShowSummary(false);
          setCombatSummary(null);
          setAllUnits([]); // Clear old units to prevent flash
          setCombatLoaded(false);
          setTimeout(() => loadCombat(), 100);
        }}
        onExit={() => setCurrentView('world-map')}
        onSettings={() => setShowSettings(true)}
        onBalanceTest={() => setShowBalanceTest(!showBalanceTest)}
        onFastCombat={() => setShowFastCombat(!showFastCombat)}
      />

      {/* MAIN CONTENT */}
      <div className="flex flex-1 overflow-hidden">
        {/* PHASER CANVAS */}
        <div className="flex-1 relative">
          <PhaserGame className="w-full h-full" />

          {/* Loading overlay - Show until combat AND units are loaded */}
          {(!isLoaded || !combatLoaded || allUnits.length === 0) && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
              <div className="text-xl">Loading Combat Lab...</div>
            </div>
          )}
        </div>

        {/* SIDE PANEL */}
        <SidePanel
          logEntries={logEntries}
          selectedUnit={selectedUnit}
          characterEquipment={gameCharacters.find(c => c.id === selectedUnit?.id)?.equipment || []}
        />
      </div>

      {/* UNIT CARDS BAR - Only show when combat is loaded and has units */}
      {combatLoaded && allUnits.length > 0 && (
        <UnitCardsBar
          units={allUnits}
          selectedUnitId={selectedUnit?.id}
          currentTeam={currentTeam}
        />
      )}

      {/* BOTTOM BAR - Only show when units are loaded */}
      {allUnits.length > 0 && (
        <BottomBar
          selectedUnit={selectedUnit}
          weaponInfo={weaponInfo}
          unitData={selectedWeapon}
          actions={actions}
          onGadgetClick={() => setShowGadgetPanel(true)}
          onInventoryClick={() => setShowInventory(true)}
          onFlee={() => {
            if (confirm('Flee from combat? Your team will retreat to safety.')) {
              setCurrentView('world-map');
            }
          }}
          showGadgetPanel={showGadgetPanel}
          setShowGrenadeMenu={setShowGrenadeMenu}
        />
      )}

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

      {/* Balance Test Panel - Spawn units with specific weapons/armor */}
      {showBalanceTest && (
        <div className="fixed top-20 left-4 z-50 w-80 bg-gray-900 border border-cyan-500 rounded-lg p-4 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-cyan-400 font-bold text-lg">⚖️ Balance Test</h3>
            <button
              onClick={() => setShowBalanceTest(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Weapon Selector */}
          <div className="mb-3">
            <label className="text-gray-300 text-sm block mb-1">Weapon ({ALL_WEAPONS.length} available)</label>
            <select
              value={testWeapon}
              onChange={(e) => setTestWeapon(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
            >
              {ALL_WEAPONS.map(w => (
                <option key={w.id} value={w.name}>
                  {w.emoji} {w.name} (dmg: {w.baseDamage}, rng: {w.range})
                </option>
              ))}
            </select>
          </div>

          {/* Armor Selector */}
          <div className="mb-3">
            <label className="text-gray-300 text-sm block mb-1">Armor ({ALL_ARMOR.length} available)</label>
            <select
              value={testArmor}
              onChange={(e) => setTestArmor(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
            >
              <option value="">No Armor</option>
              {ALL_ARMOR.map(a => (
                <option key={a.id} value={a.name}>
                  {a.emoji} {a.name} (DR: {a.drPhysical})
                </option>
              ))}
            </select>
          </div>

          {/* Team Selector */}
          <div className="mb-3">
            <label className="text-gray-300 text-sm block mb-1">Team</label>
            <div className="flex gap-2">
              <button
                onClick={() => setTestTeam('blue')}
                className={`flex-1 py-2 rounded font-bold ${testTeam === 'blue'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300'}`}
              >
                🔵 Blue
              </button>
              <button
                onClick={() => setTestTeam('red')}
                className={`flex-1 py-2 rounded font-bold ${testTeam === 'red'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-700 text-gray-300'}`}
              >
                🔴 Red
              </button>
            </div>
          </div>

          {/* Stats Sliders */}
          <div className="mb-3">
            <label className="text-gray-300 text-sm">STR: {testStats.STR}</label>
            <input
              type="range" min="20" max="100"
              value={testStats.STR}
              onChange={(e) => setTestStats({ ...testStats, STR: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
          <div className="mb-3">
            <label className="text-gray-300 text-sm">AGL: {testStats.AGL}</label>
            <input
              type="range" min="20" max="100"
              value={testStats.AGL}
              onChange={(e) => setTestStats({ ...testStats, AGL: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
          <div className="mb-4">
            <label className="text-gray-300 text-sm">STA: {testStats.STA}</label>
            <input
              type="range" min="20" max="100"
              value={testStats.STA}
              onChange={(e) => setTestStats({ ...testStats, STA: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Spawn Button */}
          <button
            onClick={spawnTestUnit}
            className="w-full py-3 bg-green-600 hover:bg-green-500 rounded font-bold text-white flex items-center justify-center gap-2"
          >
            <Zap className="w-5 h-5" />
            Spawn Test Unit
          </button>
        </div>
      )}

      {/* Grapple Panel - Shows when selected unit is in a grapple */}
      {activeGrapple && selectedUnit && (
        activeGrapple.attackerId === selectedUnit.id || activeGrapple.defenderId === selectedUnit.id
      ) && (() => {
        const selectedChar = gameCharacters.find(c => c.id === selectedUnit.id);
        const unitFromList = allUnits.find(u => u.id === selectedUnit.id);
        const isAttacker = activeGrapple.attackerId === selectedUnit.id;

        // Get martial arts from character (assuming first style if multiple)
        const martialArts: CharacterMartialArts | null = selectedChar?.martialArts?.[0]
          ? { styleId: selectedChar.martialArts[0].style as any, beltLevel: selectedChar.martialArts[0].belt }
          : null;

        return (
          <div className="fixed top-20 right-4 z-50 w-72">
            <GrapplePanel
              unitId={selectedUnit.id}
              unitName={selectedUnit.name}
              grappleState={activeGrapple}
              martialArts={martialArts}
              currentAp={unitFromList?.ap || 4}
              isAttacker={isAttacker}
              stats={{
                STR: selectedChar?.stats?.STR || 50,
                MEL: selectedChar?.stats?.MEL || 50,
                AGL: selectedChar?.stats?.AGL || 50,
                INS: selectedChar?.stats?.INS || 50,
              }}
            />
          </div>
        );
      })()}

      {/* Quick Inventory - Shows grenades/gadgets as small icons next to character info */}
      {selectedUnit && (
        <div className="fixed bottom-28 left-4 z-50">
          <QuickInventory
            equipment={gameCharacters.find(c => c.id === selectedUnit.id)?.equipment || []}
            onItemClick={(itemName, itemType) => {
              console.log(`🎯 Using ${itemType}: ${itemName}`);
              if (itemType === 'grenade') {
                // Start grenade throw mode
                const grenadeId = itemName.split(' ')[0].toUpperCase();
                EventBridge.emit('start-grenade-throw', { grenadeId, grenadeName: itemName });
              }
            }}
          />
        </div>
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
  showBalanceTest: boolean;
  showFastCombat: boolean;
  onToggleAi: () => void;
  onRestartCombat: () => void;
  onExit: () => void;
  onSettings: () => void;
  onBalanceTest: () => void;
  onFastCombat: () => void;
}

const TopBar: React.FC<TopBarProps> = ({
  currentTeam,
  roundNumber,
  teamColor,
  aiVsAi,
  showBalanceTest,
  showFastCombat,
  onToggleAi,
  onRestartCombat,
  onExit,
  onSettings,
  onBalanceTest,
  onFastCombat,
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
        className={`flex items-center gap-2 px-4 py-2 rounded font-bold transition-all ${aiVsAi
          ? 'bg-green-600 hover:bg-green-500 animate-pulse'
          : 'bg-purple-700 hover:bg-purple-600'
          }`}
      >
        <Bot className="w-5 h-5" />
        {aiVsAi ? 'AI vs AI ON' : 'AI vs AI'}
      </button>
      <button
        onClick={onBalanceTest}
        className={`flex items-center gap-2 px-3 py-2 rounded font-bold transition-all ${showBalanceTest
          ? 'bg-cyan-600 hover:bg-cyan-500'
          : 'bg-cyan-800 hover:bg-cyan-700'
          }`}
        title="Balance Test - Spawn units with specific weapons"
      >
        <Zap className="w-4 h-4" />
        Balance
      </button>
      <button
        onClick={onFastCombat}
        className={`flex items-center gap-2 px-3 py-2 rounded font-bold transition-all ${showFastCombat
          ? 'bg-yellow-600 hover:bg-yellow-500'
          : 'bg-yellow-800 hover:bg-yellow-700'
          }`}
        title="Fast Combat - Streamlined combat viewer"
      >
        <Swords className="w-4 h-4" />
        Fast
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

// STATUS EFFECT BADGE COMPONENT
interface StatusEffectBadgeProps {
  effect: string | StatusEffectData;
}

// Status effect configuration with colors, emojis, and tooltips
const STATUS_EFFECT_CONFIG: Record<string, {
  color: string;
  emoji: string;
  description: string;
}> = {
  bleeding: {
    color: 'bg-red-600 border-red-400',
    emoji: '🩸',
    description: '3 damage per turn'
  },
  burning: {
    color: 'bg-orange-500 border-orange-300',
    emoji: '🔥',
    description: '5 damage per turn'
  },
  frozen: {
    color: 'bg-cyan-400 border-cyan-200',
    emoji: '🧊',
    description: '-2 AP penalty'
  },
  stunned: {
    color: 'bg-yellow-400 border-yellow-200',
    emoji: '💫',
    description: 'Skips turn'
  },
  poisoned: {
    color: 'bg-green-600 border-green-400',
    emoji: '☠️',
    description: '2 damage per turn'
  },
  emp: {
    color: 'bg-purple-600 border-purple-400',
    emoji: '⚡',
    description: '-3 AP penalty'
  },
  suppressed: {
    color: 'bg-gray-600 border-gray-400',
    emoji: '📍',
    description: '-20% accuracy'
  },
  inspired: {
    color: 'bg-yellow-500 border-yellow-300',
    emoji: '✨',
    description: '+10% accuracy'
  },
  shielded: {
    color: 'bg-blue-600 border-blue-400',
    emoji: '🛡️',
    description: '+5 DR bonus'
  },
  incapacitated: {
    color: 'bg-gray-700 border-gray-500',
    emoji: '😵',
    description: 'Cannot act'
  },
  grappled: {
    color: 'bg-orange-700 border-orange-500',
    emoji: '🤼',
    description: 'Movement restricted'
  },
};

const StatusEffectBadge: React.FC<StatusEffectBadgeProps> = ({ effect }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Handle both string and StatusEffectData types
  const isStatusData = typeof effect !== 'string';
  const effectName = isStatusData ? effect.name : effect;
  const effectLower = effectName.toLowerCase();

  // For StatusEffectData, use provided data; otherwise fall back to config
  const config = STATUS_EFFECT_CONFIG[effectLower] || {
    color: 'bg-red-800 border-red-600',
    emoji: '❓',
    description: effectName,
  };

  // If we have StatusEffectData, use its emoji and description
  const displayEmoji = isStatusData && effect.emoji ? effect.emoji : config.emoji;
  const displayDescription = isStatusData && effect.description ? effect.description : config.description;
  const duration = isStatusData ? effect.duration : null;
  const stacks = isStatusData ? effect.stacks : null;

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span
        className={`text-xs ${config.color} border px-1.5 py-0.5 rounded flex items-center gap-0.5 cursor-help transition-all hover:scale-110`}
      >
        <span className="text-xs">{displayEmoji}</span>
        {stacks && stacks > 1 && <span className="text-white font-bold">x{stacks}</span>}
        {duration !== null && duration > 0 && <span className="text-gray-200 text-[10px]">({duration})</span>}
      </span>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 z-50 whitespace-nowrap">
          <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded border border-gray-700 shadow-lg">
            <div className="font-bold text-cyan-400 flex items-center gap-1">
              <span>{displayEmoji}</span>
              <span>{effectName}</span>
              {stacks && stacks > 1 && <span className="text-orange-400">x{stacks}</span>}
            </div>
            <div className="text-gray-300">{displayDescription}</div>
            {duration !== null && duration > 0 && (
              <div className="text-yellow-400 text-[10px] mt-0.5">⏱️ {duration} turn{duration !== 1 ? 's' : ''} remaining</div>
            )}
          </div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
            <div className="border-4 border-transparent border-t-gray-700"></div>
          </div>
        </div>
      )}
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

  // Shield calculations
  const hasShield = unit.maxShield > 0;
  const shieldPercent = hasShield ? (unit.shield / unit.maxShield) * 100 : 0;
  const shieldColor = shieldPercent > 50 ? 'bg-cyan-400' : 'bg-cyan-600';

  const handleClick = () => {
    EventBridge.emit('select-unit', { unitId: unit.id });
  };

  // Normalize status effects to handle both string[] and StatusEffectData[]
  const normalizedEffects = unit.statusEffects.map(effect => {
    if (typeof effect === 'string') {
      return effect;
    }
    return effect as StatusEffectData;
  });

  return (
    <div
      onClick={handleClick}
      className={`w-32 p-2 rounded-lg cursor-pointer transition-all ${isSelected
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
        <div className="flex items-center gap-1">
          {/* Armor indicator */}
          {unit.dr > 0 && (
            <span className="text-xs text-cyan-300 bg-cyan-900/50 px-1 rounded" title={`Armor: ${unit.dr} DR`}>
              🛡️{unit.dr}
            </span>
          )}
          <span className="text-sm">{unit.weaponEmoji}</span>
        </div>
      </div>

      {/* Shield Bar (if has shields) */}
      {hasShield && (
        <div className="h-1.5 bg-gray-700 rounded overflow-hidden mb-0.5" title={`Shield: ${unit.shield}/${unit.maxShield}`}>
          <div
            className={`h-full ${shieldColor} transition-all`}
            style={{ width: `${shieldPercent}%` }}
          />
        </div>
      )}

      {/* HP Bar */}
      <div className="h-2 bg-gray-700 rounded overflow-hidden mb-1">
        <div
          className={`h-full ${healthColor} transition-all`}
          style={{ width: `${healthPercent}%` }}
        />
      </div>

      {/* Stats */}
      <div className="flex justify-between text-xs text-gray-400">
        {hasShield ? (
          <span className="text-cyan-300">⚡{unit.shield}</span>
        ) : null}
        <span>HP: {unit.hp}/{unit.maxHp}</span>
        <span>AP: {unit.ap}</span>
      </div>

      {/* AP Dots */}
      <div className="flex gap-0.5 mt-1">
        {Array(unit.maxAp).fill(0).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full ${i < unit.ap ? 'bg-blue-400' : 'bg-gray-600'
              }`}
          />
        ))}
      </div>

      {/* Status Effects */}
      {normalizedEffects.length > 0 && (
        <div className="flex gap-1 mt-1 flex-wrap">
          {normalizedEffects.map((effect, i) => (
            <StatusEffectBadge key={i} effect={effect} />
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
  characterEquipment: string[];
}

const SidePanel: React.FC<SidePanelProps> = ({ logEntries, selectedUnit, characterEquipment }) => (
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
          {/* Shield Bar (if has shields) */}
          {selectedUnit.maxShield > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-cyan-400">⚡ Shield:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-cyan-300">
                  {selectedUnit.shield}/{selectedUnit.maxShield}
                </span>
                <ShieldBar
                  current={selectedUnit.shield}
                  max={selectedUnit.maxShield}
                  width={80}
                />
              </div>
            </div>
          )}
          {/* HP */}
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
          {/* AP */}
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
          {/* Armor (DR) */}
          {selectedUnit.dr > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400">🛡️ Armor:</span>
              <span className="font-mono text-cyan-300">
                {selectedUnit.dr} DR
              </span>
            </div>
          )}
          {/* Kill/Stun Mode Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Mode:</span>
            <button
              onClick={() => {
                if (selectedUnit.weaponStunCapable) {
                  EventBridge.emit('toggle-damage-mode', { unitId: selectedUnit.id });
                }
              }}
              disabled={selectedUnit.weaponAlwaysLethal || selectedUnit.weaponAlwaysNonLethal || !selectedUnit.weaponStunCapable}
              className={`
                px-2 py-1 rounded text-xs font-bold transition-all flex items-center gap-1
                ${selectedUnit.damageMode === 'stun'
                  ? 'bg-cyan-900 border border-cyan-500 text-cyan-200 hover:bg-cyan-800'
                  : 'bg-red-900 border border-red-500 text-red-200 hover:bg-red-800'
                }
                ${(selectedUnit.weaponAlwaysLethal || selectedUnit.weaponAlwaysNonLethal || !selectedUnit.weaponStunCapable)
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-pointer'
                }
              `}
              title={
                selectedUnit.weaponAlwaysLethal ? 'This weapon is always lethal' :
                  selectedUnit.weaponAlwaysNonLethal ? 'This weapon is always non-lethal' :
                    !selectedUnit.weaponStunCapable ? 'This weapon cannot switch modes' :
                      `Click to switch to ${selectedUnit.damageMode === 'kill' ? 'STUN' : 'KILL'} mode`
              }
            >
              {selectedUnit.damageMode === 'stun' ? '💤 STUN' : '💀 KILL'}
            </button>
          </div>
          {/* Position */}
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Position:</span>
            <span className="font-mono">
              ({selectedUnit.position.x}, {selectedUnit.position.y})
            </span>
          </div>
          {/* Cover */}
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Cover:</span>
            <span className={selectedUnit.isInCover === 'none' ? 'text-gray-500' : 'text-green-400'}>
              {selectedUnit.isInCover}
            </span>
          </div>
          {/* Equipment Section */}
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="text-gray-400 text-xs mb-2">🎒 EQUIPMENT:</div>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {characterEquipment.length > 0 ? (
                characterEquipment.map((item, i) => (
                  <div key={i} className="text-xs flex items-center gap-1">
                    <span className="text-gray-500">•</span>
                    <span className={`${item.toLowerCase().includes('grenade') ? 'text-orange-300' : item.toLowerCase().includes('pistol') || item.toLowerCase().includes('rifle') ? 'text-red-300' : 'text-gray-300'}`}>
                      {item}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 text-xs italic">No equipment</div>
              )}
            </div>
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

// SHIELD BAR COMPONENT
const ShieldBar: React.FC<{ current: number; max: number; width: number }> = ({
  current,
  max,
  width,
}) => {
  const percent = (current / max) * 100;
  const color = percent > 50 ? 'bg-cyan-400' : percent > 0 ? 'bg-cyan-600' : 'bg-gray-600';

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
  onFlee: () => void;
  showGadgetPanel: boolean;
  setShowGrenadeMenu: (show: boolean) => void;
}

const BottomBar: React.FC<BottomBarProps> = ({
  selectedUnit,
  weaponInfo,
  unitData,
  actions,
  onGadgetClick,
  onInventoryClick,
  onFlee,
  showGadgetPanel,
  setShowGrenadeMenu,
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
        <div className={`w-12 h-12 rounded flex items-center justify-center text-xl ${selectedUnit.team === 'blue' ? 'bg-blue-800' : 'bg-red-800'
          }`}>
          {unitData?.weaponEmoji || '👤'}
        </div>
        <div className="flex-1">
          <div className="font-bold text-lg">{selectedUnit.name}</div>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            {/* Shield display */}
            {unitData && unitData.maxShield > 0 && (
              <span className="text-cyan-300">⚡{unitData.shield}/{unitData.maxShield}</span>
            )}
            <span>HP: {selectedUnit.hp}/{selectedUnit.maxHp}</span>
            <span>AP: {selectedUnit.ap}/{selectedUnit.maxAp}</span>
            {/* Armor display */}
            {unitData && unitData.dr > 0 && (
              <span className="text-cyan-300">🛡️{unitData.dr} DR</span>
            )}
            {unitData && <span className="text-cyan-400">{unitData.personality}</span>}
          </div>
        </div>

        {/* Kill/Stun Toggle */}
        {unitData && (
          <KillStunToggle
            unitId={selectedUnit.id}
            damageMode={unitData.damageMode || 'kill'}
            stunCapable={unitData.weaponStunCapable || false}
            alwaysLethal={unitData.weaponAlwaysLethal || false}
            alwaysNonLethal={unitData.weaponAlwaysNonLethal || false}
          />
        )}

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

      {/* Equipment & Actions - Show what unit actually has */}
      <div className="flex items-center gap-2 px-4 py-2">
        {/* Primary Weapon - Show actual weapon */}
        <ActionButton
          icon={<span className="text-xl">{selectedUnit.weaponEmoji}</span>}
          label={weaponInfo.name.toUpperCase()}
          hotkey="A"
          onClick={actions.startAttackMode}
          disabled={selectedUnit.ap < (weaponInfo.ap || 2)}
          color="red"
        />
        {/* Movement */}
        <ActionButton
          icon={<Footprints className="w-5 h-5" />}
          label="MOVE"
          hotkey="M"
          onClick={actions.startMoveMode}
          disabled={selectedUnit.ap < 1}
          color="blue"
        />
        {/* Gadget button removed - grenades/gadgets now in quick inventory below */}
        {/* Gadget - Only if has gadgets */}
        {showGadgetPanel && (
          <ActionButton
            icon={<Settings className="w-5 h-5" />}
            label="GADGET"
            hotkey="T"
            onClick={onGadgetClick}
            color="purple"
          />
        )}
        {/* Inventory */}
        <ActionButton
          icon={<Package className="w-5 h-5" />}
          label="ITEM"
          hotkey="I"
          onClick={onInventoryClick}
          color="green"
        />
        {/* Overwatch */}
        <ActionButton
          icon={<Eye className="w-5 h-5" />}
          label="OVERWATCH"
          hotkey="O"
          onClick={() => { }}
          disabled={selectedUnit.ap < 3}
          color="cyan"
        />
        <div className="flex-1" />
        {/* Flee/Retreat */}
        <ActionButton
          icon={<LogOut className="w-5 h-5" />}
          label="FLEE"
          hotkey="F"
          onClick={onFlee}
          color="yellow"
        />
        {/* End Turn */}
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

// KILL/STUN TOGGLE COMPONENT
interface KillStunToggleProps {
  unitId: string;
  damageMode: 'kill' | 'stun';
  stunCapable: boolean;
  alwaysLethal: boolean;
  alwaysNonLethal: boolean;
}

const KillStunToggle: React.FC<KillStunToggleProps> = ({
  unitId,
  damageMode,
  stunCapable,
  alwaysLethal,
  alwaysNonLethal,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const canToggle = stunCapable && !alwaysLethal && !alwaysNonLethal;
  const isKillMode = damageMode === 'kill';

  const handleToggle = () => {
    if (canToggle) {
      EventBridge.emit('toggle-damage-mode', { unitId });
    }
  };

  // Determine tooltip message
  let tooltipMessage = '';
  if (alwaysLethal) {
    tooltipMessage = 'This weapon is always lethal';
  } else if (alwaysNonLethal) {
    tooltipMessage = 'This weapon is always non-lethal';
  } else if (!stunCapable) {
    tooltipMessage = 'This weapon cannot switch modes';
  } else {
    tooltipMessage = `Click to switch to ${isKillMode ? 'STUN' : 'KILL'} mode`;
  }

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        onClick={handleToggle}
        disabled={!canToggle}
        className={`flex items-center gap-2 px-3 py-2 rounded border-2 font-bold text-sm transition-all ${canToggle ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
          } ${isKillMode
            ? 'bg-red-900 border-red-500 text-red-200 hover:bg-red-800'
            : 'bg-cyan-900 border-cyan-500 text-cyan-200 hover:bg-cyan-800'
          }`}
      >
        <span className="text-xl">{isKillMode ? '💀' : '💤'}</span>
        <span>{isKillMode ? 'KILL' : 'STUN'}</span>
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 whitespace-nowrap">
          <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded border border-gray-700 shadow-lg">
            {tooltipMessage}
          </div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
            <div className="border-4 border-transparent border-t-gray-700"></div>
          </div>
        </div>
      )}
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

          {/* Injuries */}
          {stats.injuries && stats.injuries.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-3">
              <h3 className="text-gray-300 font-bold mb-2 flex items-center gap-2">
                🏥 INJURIES
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {stats.injuries.map((injury, i) => {
                  const severityColor =
                    injury.severity === 'FATAL' ? 'text-red-500 border-red-500' :
                      injury.severity === 'PERMANENT' ? 'text-orange-500 border-orange-500' :
                        injury.severity === 'SEVERE' ? 'text-red-400 border-red-400' :
                          injury.severity === 'MODERATE' ? 'text-orange-400 border-orange-400' :
                            injury.severity === 'LIGHT' ? 'text-yellow-400 border-yellow-400' :
                              'text-gray-400 border-gray-400';

                  const severityEmoji =
                    injury.severity === 'FATAL' ? '💀' :
                      injury.severity === 'PERMANENT' ? '🦴' :
                        injury.severity === 'SEVERE' ? '🤕' :
                          injury.severity === 'MODERATE' ? '🩸' :
                            injury.severity === 'LIGHT' ? '🟣' :
                              '🍀';

                  return (
                    <div key={i} className={`flex items-start gap-2 text-sm bg-gray-700/50 p-2 rounded border-l-4 ${severityColor}`}>
                      <span className="text-lg">{severityEmoji}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white font-medium">{injury.characterName}</span>
                          <span className={`text-xs font-bold ${severityColor} px-2 py-0.5 rounded border`}>
                            {injury.severity}
                          </span>
                        </div>
                        <div className="text-gray-300 text-xs">{injury.description}</div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <span>Round {injury.turnInflicted}</span>
                          {injury.permanent && (
                            <span className="text-orange-400 font-bold">PERMANENT</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                    className={`px-3 py-1 rounded text-sm ${s.team === 'blue' ? 'bg-blue-800/50 border border-blue-600' : 'bg-red-800/50 border border-red-600'
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
      className={`w-12 h-6 rounded-full transition-colors ${value ? 'bg-cyan-600' : 'bg-gray-600'
        }`}
    >
      <div
        className={`w-5 h-5 bg-white rounded-full transition-transform ${value ? 'translate-x-6' : 'translate-x-0.5'
          }`}
      />
    </button>
  </div>
);

export default CombatLab;
