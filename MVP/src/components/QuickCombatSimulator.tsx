/**
 * Quick Combat Simulator
 *
 * Visual combat resolution without tactical gameplay.
 * Shows battle events in a scrolling log with animations.
 *
 * Features:
 * - Battlefield size selection (small/medium/large)
 * - Squad vs generated enemies
 * - Visual battle log with hits, misses, injuries
 * - Final outcome with loot display
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../stores/enhancedGameStore';
import {
  Swords,
  Shield,
  Heart,
  Skull,
  Target,
  Zap,
  Wind,
  Flame,
  Snowflake,
  AlertTriangle,
  Trophy,
  XCircle,
  ChevronRight,
  Users,
  Map,
  Clock,
  DollarSign,
  Star,
  Play,
  RotateCcw,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

type BattlefieldSize = 'small' | 'medium' | 'large';
type CombatPhase = 'setup' | 'fighting' | 'result';

interface BattleEvent {
  id: string;
  timestamp: number;
  type: 'attack' | 'hit' | 'miss' | 'graze' | 'crit' | 'injury' | 'death' | 'ability' | 'status' | 'morale';
  actorName: string;
  actorSide: 'player' | 'enemy';
  targetName?: string;
  targetSide?: 'player' | 'enemy';
  damage?: number;
  weapon?: string;
  bodyPart?: string;
  description: string;
  severity?: 'minor' | 'moderate' | 'severe' | 'critical' | 'fatal';
}

interface CombatantState {
  id: string;
  name: string;
  side: 'player' | 'enemy';
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  status: 'active' | 'injured' | 'down' | 'dead';
  injuries: string[];
}

// =============================================================================
// BATTLEFIELD CONFIG
// =============================================================================

const BATTLEFIELD_CONFIG: Record<BattlefieldSize, {
  name: string;
  enemyCount: [number, number];
  coverBonus: number;
  description: string;
}> = {
  small: {
    name: 'Close Quarters',
    enemyCount: [2, 4],
    coverBonus: 0.1,
    description: 'Tight spaces, fast engagements. 2-4 enemies.',
  },
  medium: {
    name: 'Urban Street',
    enemyCount: [4, 8],
    coverBonus: 0.2,
    description: 'Mixed cover, tactical options. 4-8 enemies.',
  },
  large: {
    name: 'Open Compound',
    enemyCount: [8, 15],
    coverBonus: 0.3,
    description: 'Large area, multiple angles. 8-15 enemies.',
  },
};

// =============================================================================
// WEAPON DATA (for flavor text)
// =============================================================================

const WEAPONS = [
  'Assault Rifle', 'SMG', 'Shotgun', 'Pistol', 'Sniper Rifle',
  'Heavy Machine Gun', 'Knife', 'Fists', 'Energy Pistol', 'Plasma Rifle',
];

const BODY_PARTS = [
  'head', 'torso', 'left arm', 'right arm', 'left leg', 'right leg',
  'shoulder', 'hand', 'abdomen',
];

const ENEMY_NAMES = [
  'Thug', 'Soldier', 'Mercenary', 'Guard', 'Heavy', 'Sniper',
  'Lieutenant', 'Captain', 'Enforcer', 'Brute',
];

// =============================================================================
// COMBAT SIMULATION ENGINE
// =============================================================================

function generateEnemies(size: BattlefieldSize): CombatantState[] {
  const [min, max] = BATTLEFIELD_CONFIG[size].enemyCount;
  const count = min + Math.floor(Math.random() * (max - min + 1));

  return Array.from({ length: count }, (_, i) => ({
    id: `enemy-${i}`,
    name: `${ENEMY_NAMES[Math.floor(Math.random() * ENEMY_NAMES.length)]} ${i + 1}`,
    side: 'enemy' as const,
    hp: 40 + Math.floor(Math.random() * 40),
    maxHp: 40 + Math.floor(Math.random() * 40),
    shield: Math.random() > 0.7 ? 10 + Math.floor(Math.random() * 20) : 0,
    maxShield: Math.random() > 0.7 ? 10 + Math.floor(Math.random() * 20) : 0,
    status: 'active' as const,
    injuries: [],
  }));
}

function simulateBattle(
  squad: CombatantState[],
  enemies: CombatantState[],
  size: BattlefieldSize
): { events: BattleEvent[]; outcome: 'victory' | 'defeat' | 'pyrrhic'; finalSquad: CombatantState[]; finalEnemies: CombatantState[] } {
  const events: BattleEvent[] = [];
  let eventId = 0;
  let round = 0;
  const maxRounds = 20;

  // Clone states
  const playerTeam = squad.map(c => ({ ...c }));
  const enemyTeam = enemies.map(c => ({ ...c }));

  const addEvent = (event: Omit<BattleEvent, 'id' | 'timestamp'>) => {
    events.push({
      ...event,
      id: `evt-${eventId++}`,
      timestamp: round * 1000 + Math.random() * 500,
    });
  };

  // Initial event
  addEvent({
    type: 'status',
    actorName: 'Battle',
    actorSide: 'player',
    description: `Combat begins! ${playerTeam.length} operatives vs ${enemyTeam.length} hostiles.`,
  });

  while (round < maxRounds) {
    round++;

    // Get active combatants
    const activePlayers = playerTeam.filter(c => c.status === 'active' || c.status === 'injured');
    const activeEnemies = enemyTeam.filter(c => c.status === 'active' || c.status === 'injured');

    if (activePlayers.length === 0 || activeEnemies.length === 0) break;

    // Each active combatant takes an action
    const allActive = [...activePlayers, ...activeEnemies].sort(() => Math.random() - 0.5);

    for (const actor of allActive) {
      if (actor.status === 'dead' || actor.status === 'down') continue;

      const isPlayer = actor.side === 'player';
      const targets = isPlayer
        ? enemyTeam.filter(e => e.status === 'active' || e.status === 'injured')
        : playerTeam.filter(p => p.status === 'active' || p.status === 'injured');

      if (targets.length === 0) continue;

      const target = targets[Math.floor(Math.random() * targets.length)];
      const weapon = WEAPONS[Math.floor(Math.random() * WEAPONS.length)];

      // Calculate hit chance (simplified)
      const baseHitChance = 0.65;
      const coverMod = BATTLEFIELD_CONFIG[size].coverBonus;
      const hitChance = baseHitChance - (isPlayer ? 0 : coverMod);

      const roll = Math.random();

      if (roll > hitChance + 0.15) {
        // Miss
        addEvent({
          type: 'miss',
          actorName: actor.name,
          actorSide: actor.side,
          targetName: target.name,
          targetSide: target.side,
          weapon,
          description: `${actor.name} fires ${weapon} at ${target.name} - MISS!`,
        });
      } else if (roll > hitChance) {
        // Graze
        const damage = 5 + Math.floor(Math.random() * 10);
        applyDamage(target, damage);
        addEvent({
          type: 'graze',
          actorName: actor.name,
          actorSide: actor.side,
          targetName: target.name,
          targetSide: target.side,
          damage,
          weapon,
          description: `${actor.name}'s ${weapon} grazes ${target.name} for ${damage} damage!`,
        });
      } else if (roll < 0.08) {
        // Critical hit
        const damage = 30 + Math.floor(Math.random() * 30);
        const bodyPart = BODY_PARTS[Math.floor(Math.random() * BODY_PARTS.length)];
        applyDamage(target, damage);

        addEvent({
          type: 'crit',
          actorName: actor.name,
          actorSide: actor.side,
          targetName: target.name,
          targetSide: target.side,
          damage,
          weapon,
          bodyPart,
          description: `CRITICAL! ${actor.name} hits ${target.name}'s ${bodyPart} for ${damage} damage!`,
          severity: 'critical',
        });

        // Check for injury
        if (Math.random() < 0.6) {
          const injury = generateInjury(bodyPart);
          target.injuries.push(injury);
          addEvent({
            type: 'injury',
            actorName: target.name,
            actorSide: target.side,
            bodyPart,
            description: `${target.name} suffers ${injury}!`,
            severity: Math.random() < 0.3 ? 'severe' : 'moderate',
          });
        }
      } else {
        // Normal hit
        const damage = 15 + Math.floor(Math.random() * 20);
        applyDamage(target, damage);
        addEvent({
          type: 'hit',
          actorName: actor.name,
          actorSide: actor.side,
          targetName: target.name,
          targetSide: target.side,
          damage,
          weapon,
          description: `${actor.name} hits ${target.name} with ${weapon} for ${damage} damage!`,
        });
      }

      // Check if target is down
      if (target.hp <= 0 && target.status !== 'dead') {
        const isDeath = target.hp <= -20 || Math.random() < 0.3;
        target.status = isDeath ? 'dead' : 'down';

        addEvent({
          type: isDeath ? 'death' : 'injury',
          actorName: target.name,
          actorSide: target.side,
          description: isDeath
            ? `${target.name} is KILLED!`
            : `${target.name} is DOWN but alive!`,
          severity: isDeath ? 'fatal' : 'critical',
        });
      }
    }
  }

  // Determine outcome
  const survivingPlayers = playerTeam.filter(c => c.status !== 'dead');
  const survivingEnemies = enemyTeam.filter(c => c.status !== 'dead' && c.status !== 'down');

  let outcome: 'victory' | 'defeat' | 'pyrrhic';
  if (survivingEnemies.length === 0 && survivingPlayers.length > 0) {
    outcome = survivingPlayers.length < squad.length / 2 ? 'pyrrhic' : 'victory';
  } else if (survivingPlayers.length === 0) {
    outcome = 'defeat';
  } else {
    outcome = playerTeam.filter(c => c.status === 'active').length >
              enemyTeam.filter(c => c.status === 'active').length ? 'victory' : 'defeat';
  }

  addEvent({
    type: 'status',
    actorName: 'Battle',
    actorSide: 'player',
    description: outcome === 'victory'
      ? 'VICTORY! All hostiles neutralized.'
      : outcome === 'pyrrhic'
      ? 'PYRRHIC VICTORY. Heavy losses sustained.'
      : 'DEFEAT. Squad forced to withdraw.',
  });

  return { events, outcome, finalSquad: playerTeam, finalEnemies: enemyTeam };
}

function applyDamage(target: CombatantState, damage: number) {
  if (target.shield > 0) {
    const shieldDamage = Math.min(target.shield, damage);
    target.shield -= shieldDamage;
    damage -= shieldDamage;
  }
  target.hp -= damage;
  if (target.hp < target.maxHp * 0.3 && target.status === 'active') {
    target.status = 'injured';
  }
}

function generateInjury(bodyPart: string): string {
  const injuries: Record<string, string[]> = {
    head: ['concussion', 'facial laceration', 'ear damage'],
    torso: ['bruised ribs', 'flesh wound', 'internal bleeding'],
    'left arm': ['fractured arm', 'shoulder dislocation', 'deep cut'],
    'right arm': ['fractured arm', 'shoulder dislocation', 'deep cut'],
    'left leg': ['leg fracture', 'knee damage', 'bullet wound'],
    'right leg': ['leg fracture', 'knee damage', 'bullet wound'],
    shoulder: ['dislocated shoulder', 'rotator cuff tear'],
    hand: ['broken fingers', 'hand laceration'],
    abdomen: ['abdominal wound', 'organ damage'],
  };
  const options = injuries[bodyPart] || ['wound'];
  return options[Math.floor(Math.random() * options.length)];
}

// =============================================================================
// COMPONENT
// =============================================================================

export const QuickCombatSimulator: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const characters = useGameStore(state => state.characters);

  const [phase, setPhase] = useState<CombatPhase>('setup');
  const [battlefieldSize, setBattlefieldSize] = useState<BattlefieldSize>('medium');
  const [selectedSquad, setSelectedSquad] = useState<string[]>([]);
  const [events, setEvents] = useState<BattleEvent[]>([]);
  const [displayedEvents, setDisplayedEvents] = useState<BattleEvent[]>([]);
  const [outcome, setOutcome] = useState<'victory' | 'defeat' | 'pyrrhic' | null>(null);
  const [finalStats, setFinalStats] = useState<{ squad: CombatantState[]; enemies: CombatantState[] } | null>(null);

  const logRef = useRef<HTMLDivElement>(null);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [displayedEvents]);

  // Animate events appearing
  useEffect(() => {
    if (phase === 'fighting' && events.length > 0) {
      let index = 0;
      const interval = setInterval(() => {
        if (index < events.length) {
          setDisplayedEvents(prev => [...prev, events[index]]);
          index++;
        } else {
          clearInterval(interval);
          setPhase('result');
        }
      }, 150); // 150ms between events for quick playback

      return () => clearInterval(interval);
    }
  }, [phase, events]);

  const toggleSquadMember = (id: string) => {
    setSelectedSquad(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const startCombat = () => {
    const squad: CombatantState[] = characters
      .filter(c => selectedSquad.includes(c.id))
      .map(c => ({
        id: c.id,
        name: c.name,
        side: 'player' as const,
        hp: c.health.current,
        maxHp: c.health.maximum,
        shield: c.shield || 0,
        maxShield: c.maxShield || 0,
        status: 'active' as const,
        injuries: [],
      }));

    const enemies = generateEnemies(battlefieldSize);
    const result = simulateBattle(squad, enemies, battlefieldSize);

    setEvents(result.events);
    setOutcome(result.outcome);
    setFinalStats({ squad: result.finalSquad, enemies: result.finalEnemies });
    setDisplayedEvents([]);
    setPhase('fighting');
  };

  const resetSimulator = () => {
    setPhase('setup');
    setEvents([]);
    setDisplayedEvents([]);
    setOutcome(null);
    setFinalStats(null);
  };

  // Event icon based on type
  const getEventIcon = (event: BattleEvent) => {
    switch (event.type) {
      case 'crit': return <Zap className="w-4 h-4 text-yellow-400" />;
      case 'hit': return <Target className="w-4 h-4 text-red-400" />;
      case 'miss': return <Wind className="w-4 h-4 text-gray-400" />;
      case 'graze': return <ChevronRight className="w-4 h-4 text-orange-400" />;
      case 'injury': return <Heart className="w-4 h-4 text-pink-400" />;
      case 'death': return <Skull className="w-4 h-4 text-red-600" />;
      case 'status': return <AlertTriangle className="w-4 h-4 text-blue-400" />;
      default: return <Swords className="w-4 h-4 text-gray-400" />;
    }
  };

  const getEventColor = (event: BattleEvent) => {
    if (event.type === 'death') return 'border-red-600 bg-red-900/30';
    if (event.type === 'crit') return 'border-yellow-500 bg-yellow-900/20';
    if (event.type === 'injury') return 'border-pink-500 bg-pink-900/20';
    if (event.actorSide === 'player') return 'border-green-600/50 bg-green-900/10';
    return 'border-red-600/50 bg-red-900/10';
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-900 border border-gray-700 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Swords className="w-6 h-6 text-red-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Quick Combat Simulator</h2>
              <p className="text-xs text-gray-400">Instant battle resolution with visual playback</p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg">
              <XCircle className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Setup Phase */}
          {phase === 'setup' && (
            <div className="flex-1 p-4 overflow-y-auto">
              {/* Battlefield Selection */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
                  <Map className="w-4 h-4" /> Battlefield Size
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {(Object.entries(BATTLEFIELD_CONFIG) as [BattlefieldSize, typeof BATTLEFIELD_CONFIG['small']][]).map(([size, config]) => (
                    <button
                      key={size}
                      onClick={() => setBattlefieldSize(size)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        battlefieldSize === size
                          ? 'border-yellow-500 bg-yellow-900/20'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="font-bold text-white">{config.name}</div>
                      <div className="text-xs text-gray-400 mt-1">{config.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Squad Selection */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" /> Select Squad ({selectedSquad.length} selected)
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {characters.filter(c => c.status === 'ready').map(char => (
                    <button
                      key={char.id}
                      onClick={() => toggleSquadMember(char.id)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        selectedSquad.includes(char.id)
                          ? 'border-green-500 bg-green-900/20'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{char.name}</span>
                        <span className="text-xs text-gray-500">{char.threatLevel}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3 text-red-400" />
                          {char.health.current}/{char.health.maximum}
                        </span>
                        {char.shield > 0 && (
                          <span className="flex items-center gap-1">
                            <Shield className="w-3 h-3 text-blue-400" />
                            {char.shield}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Start Button */}
              <button
                onClick={startCombat}
                disabled={selectedSquad.length === 0}
                className={`w-full py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                  selectedSquad.length > 0
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Play className="w-5 h-5" />
                Start Combat Simulation
              </button>
            </div>
          )}

          {/* Fighting Phase - Battle Log */}
          {(phase === 'fighting' || phase === 'result') && (
            <div className="flex-1 flex flex-col">
              {/* Battle Stats Bar */}
              <div className="p-3 border-b border-gray-700 bg-gray-800/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-green-400 font-bold">
                    Squad: {finalStats?.squad.filter(c => c.status !== 'dead').length || selectedSquad.length}
                  </span>
                  <span className="text-gray-500">vs</span>
                  <span className="text-red-400 font-bold">
                    Enemies: {finalStats?.enemies.filter(c => c.status !== 'dead' && c.status !== 'down').length || '?'}
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  {BATTLEFIELD_CONFIG[battlefieldSize].name}
                </div>
              </div>

              {/* Event Log */}
              <div
                ref={logRef}
                className="flex-1 overflow-y-auto p-4 space-y-2"
              >
                <AnimatePresence>
                  {displayedEvents.map((event, i) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-3 rounded-lg border-l-4 ${getEventColor(event)}`}
                    >
                      <div className="flex items-start gap-3">
                        {getEventIcon(event)}
                        <div className="flex-1">
                          <p className={`text-sm ${
                            event.type === 'death' ? 'text-red-400 font-bold' :
                            event.type === 'crit' ? 'text-yellow-400 font-bold' :
                            event.actorSide === 'player' ? 'text-green-300' : 'text-red-300'
                          }`}>
                            {event.description}
                          </p>
                          {event.damage && (
                            <span className="text-xs text-gray-500 mt-1 block">
                              Damage: {event.damage}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {phase === 'fighting' && (
                  <div className="flex items-center justify-center py-4">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full"
                    />
                  </div>
                )}
              </div>

              {/* Result Panel */}
              {phase === 'result' && outcome && (
                <motion.div
                  initial={{ y: 100 }}
                  animate={{ y: 0 }}
                  className="p-4 border-t border-gray-700 bg-gray-800"
                >
                  <div className={`text-center mb-4 ${
                    outcome === 'victory' ? 'text-green-400' :
                    outcome === 'pyrrhic' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    <div className="text-3xl font-bold mb-1">
                      {outcome === 'victory' && <><Trophy className="w-8 h-8 inline mr-2" />VICTORY</>}
                      {outcome === 'pyrrhic' && <><AlertTriangle className="w-8 h-8 inline mr-2" />PYRRHIC VICTORY</>}
                      {outcome === 'defeat' && <><XCircle className="w-8 h-8 inline mr-2" />DEFEAT</>}
                    </div>
                  </div>

                  {/* Casualty Report */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-900/50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-2">Squad Status</div>
                      {finalStats?.squad.map(c => (
                        <div key={c.id} className="flex items-center justify-between text-sm py-1">
                          <span className={c.status === 'dead' ? 'text-red-500 line-through' : 'text-white'}>
                            {c.name}
                          </span>
                          <span className={`text-xs ${
                            c.status === 'dead' ? 'text-red-500' :
                            c.status === 'down' ? 'text-orange-500' :
                            c.status === 'injured' ? 'text-yellow-500' : 'text-green-500'
                          }`}>
                            {c.status.toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-gray-900/50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-2">Enemies Neutralized</div>
                      <div className="text-2xl font-bold text-red-400">
                        {finalStats?.enemies.filter(e => e.status === 'dead' || e.status === 'down').length}
                        <span className="text-sm text-gray-500"> / {finalStats?.enemies.length}</span>
                      </div>
                      {outcome === 'victory' && (
                        <div className="mt-2 text-sm text-green-400">
                          <DollarSign className="w-4 h-4 inline" />
                          +${(2000 + Math.floor(Math.random() * 3000)).toLocaleString()} earned
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={resetSimulator}
                    className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    New Simulation
                  </button>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default QuickCombatSimulator;
