/**
 * FastCombat.tsx - Streamlined Combat Viewer
 *
 * Shows the DEPTH of SuperHero Tactics combat without isometric grid.
 * Used for:
 * 1. Dev testing during development (primary use now)
 * 2. Player auto-resolve for minor encounters (future)
 *
 * 3-Column Layout: Your Team | Combat Log | Enemies
 * Clinical/tactical display style - shows all the math.
 */

import React, { useReducer, useEffect, useRef, useCallback } from 'react';
import { SimUnit, AttackResult, BattleResult } from '../combat/types';
import { runBattle } from '../combat/battleRunner';
import { PanicLevel } from '../combat/advancedMechanics';

// ============ TYPES ============

interface FastCombatProps {
  blueTeam: SimUnit[];
  redTeam: SimUnit[];
  onComplete?: (result: BattleResult) => void;
  onBack?: () => void;
}

type SpeedMode = 'instant' | '4x' | '2x' | '1x' | 'step';

interface CombatLogEntry {
  id: number;
  round: number;
  turn: number;
  type: 'attack' | 'move' | 'morale' | 'status' | 'death' | 'system';
  actorId?: string;
  actorName?: string;
  actorTeam?: 'blue' | 'red';
  targetId?: string;
  targetName?: string;
  message: string;
  details?: {
    roll?: number;
    accuracy?: number;
    hitResult?: string;
    rawDamage?: number;
    shieldAbsorbed?: number;
    drReduced?: number;
    finalDamage?: number;
    weapon?: string;
    distance?: number;
    rangeBracket?: string;
    flankingBonus?: number;
  };
}

interface CombatState {
  status: 'idle' | 'running' | 'paused' | 'complete';
  blueUnits: SimUnit[];
  redUnits: SimUnit[];
  currentRound: number;
  currentTurn: number;
  activeUnitId: string | null;
  log: CombatLogEntry[];
  logIndex: number; // For replay
  result: BattleResult | null;
  speedMode: SpeedMode;
}

type CombatAction =
  | { type: 'START' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'STEP' }
  | { type: 'SET_SPEED'; mode: SpeedMode }
  | { type: 'LOAD_RESULT'; result: BattleResult; blueUnits: SimUnit[]; redUnits: SimUnit[] }
  | { type: 'SHOW_LOG_ENTRY'; index: number }
  | { type: 'COMPLETE' };

// ============ SPEED DELAYS ============

const SPEED_DELAYS: Record<SpeedMode, number> = {
  instant: 0,
  '4x': 50,
  '2x': 150,
  '1x': 400,
  step: -1, // Manual
};

// ============ REDUCER ============

function combatReducer(state: CombatState, action: CombatAction): CombatState {
  switch (action.type) {
    case 'START':
      return { ...state, status: 'running' };
    case 'PAUSE':
      return { ...state, status: 'paused' };
    case 'RESUME':
      return { ...state, status: 'running' };
    case 'SET_SPEED':
      return { ...state, speedMode: action.mode };
    case 'LOAD_RESULT':
      return {
        ...state,
        result: action.result,
        blueUnits: action.blueUnits,
        redUnits: action.redUnits,
        log: convertBattleLogToEntries(action.result.log),
        status: 'complete',
      };
    case 'SHOW_LOG_ENTRY':
      return { ...state, logIndex: action.index };
    case 'COMPLETE':
      return { ...state, status: 'complete' };
    default:
      return state;
  }
}

// ============ HELPERS ============

function convertBattleLogToEntries(log: AttackResult[]): CombatLogEntry[] {
  return log.map((result, index) => ({
    id: index,
    round: 1, // TODO: Track rounds in battleRunner
    turn: index + 1,
    type: 'attack' as const,
    actorId: result.attacker,
    actorName: result.attacker,
    targetId: result.target,
    targetName: result.target,
    message: formatAttackMessage(result),
    details: {
      roll: result.roll,
      accuracy: result.accuracy,
      hitResult: result.hitResult,
      rawDamage: result.rawDamage,
      shieldAbsorbed: result.shieldAbsorbed,
      drReduced: result.drReduced,
      finalDamage: result.finalDamage,
      weapon: result.weapon,
      distance: result.distance,
      rangeBracket: result.rangeBracket,
      flankingBonus: result.flankingBonus,
    },
  }));
}

function formatAttackMessage(result: AttackResult): string {
  const hitStr = result.hitResult.toUpperCase();
  const dmgStr = result.finalDamage > 0 ? ` → ${result.finalDamage} dmg` : '';
  const killStr = result.killed ? ' 💀' : '';
  return `${result.attacker} → ${result.target} [${result.weapon}]: ${hitStr}${dmgStr}${killStr}`;
}

function getPanicDisplay(level: PanicLevel | undefined): {
  emoji: string;
  color: string;
  label: string;
  bgColor: string;
  effects: string;
} {
  switch (level) {
    case 'shaken':
      return {
        emoji: '😰',
        color: 'text-yellow-400',
        label: 'SHAKEN',
        bgColor: 'bg-yellow-900/50',
        effects: '-10% ACC, -5% EVA'
      };
    case 'panicked':
      return {
        emoji: '😱',
        color: 'text-orange-400',
        label: 'PANICKED',
        bgColor: 'bg-orange-900/50',
        effects: '-25% ACC, +50% AP cost'
      };
    case 'broken':
      return {
        emoji: '💔',
        color: 'text-red-500',
        label: 'BROKEN',
        bgColor: 'bg-red-900/50',
        effects: 'Cannot act! May flee'
      };
    default:
      return { emoji: '', color: '', label: '', bgColor: '', effects: '' };
  }
}

function getHealthColor(hp: number, maxHp: number): string {
  const ratio = hp / maxHp;
  if (ratio > 0.7) return 'text-green-400';
  if (ratio > 0.4) return 'text-yellow-400';
  if (ratio > 0.2) return 'text-orange-400';
  return 'text-red-500';
}

// ============ COMPONENTS ============

interface UnitCardProps {
  unit: SimUnit;
  isActive?: boolean;
  showEquipment?: boolean;
}

function UnitCard({ unit, isActive, showEquipment = true }: UnitCardProps) {
  const hpColor = getHealthColor(unit.hp, unit.maxHp);
  const panic = getPanicDisplay(unit.panicLevel);
  const isDead = !unit.alive;

  return (
    <div className={`
      p-2 rounded border mb-2 text-sm font-mono
      ${isDead ? 'bg-gray-800 border-gray-700 opacity-50' :
        isActive ? 'bg-blue-900 border-blue-500' :
        panic.bgColor ? `${panic.bgColor} border-gray-600` : 'bg-gray-800 border-gray-600'}
    `}>
      {/* Name & Status */}
      <div className="flex justify-between items-center mb-1">
        <span className={`font-bold ${isDead ? 'line-through text-gray-500' : 'text-white'}`}>
          {unit.name}
        </span>
        <span className="flex items-center gap-1">
          {panic.emoji && <span className={panic.color}>{panic.emoji}</span>}
          {isDead && <span className="text-red-500">💀</span>}
        </span>
      </div>

      {/* Panic Status Banner */}
      {panic.label && !isDead && (
        <div className={`text-xs ${panic.color} rounded px-1 py-0.5 mb-1 text-center ${panic.bgColor}`}>
          {panic.label}: {panic.effects}
        </div>
      )}

      {/* Origin */}
      <div className="text-xs text-gray-400 mb-1">
        Origin: {unit.origin}
      </div>

      {/* HP Bar */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-gray-500 text-xs w-6">HP</span>
        <div className="flex-1 bg-gray-700 h-2 rounded overflow-hidden">
          <div
            className="h-full bg-green-600 transition-all"
            style={{ width: `${(unit.hp / unit.maxHp) * 100}%` }}
          />
        </div>
        <span className={`text-xs ${hpColor}`}>
          {unit.hp}/{unit.maxHp}
        </span>
      </div>

      {/* Shield Bar (if any) */}
      {unit.maxShieldHp > 0 && (
        <div className="flex items-center gap-2 mb-1">
          <span className="text-gray-500 text-xs w-6">🛡️</span>
          <div className="flex-1 bg-gray-700 h-2 rounded overflow-hidden">
            <div
              className="h-full bg-cyan-500 transition-all"
              style={{ width: `${(unit.shieldHp / unit.maxShieldHp) * 100}%` }}
            />
          </div>
          <span className="text-xs text-cyan-400">
            {unit.shieldHp}/{unit.maxShieldHp}
          </span>
        </div>
      )}

      {/* Defense Info */}
      {(unit.dr > 0 || unit.stoppingPower > 0) && (
        <div className="text-xs text-gray-400 mb-1">
          {unit.dr > 0 && <span className="mr-2">DR: {unit.dr}</span>}
          {unit.stoppingPower > 0 && <span>SP: {unit.stoppingPower}</span>}
        </div>
      )}

      {/* Equipment */}
      {showEquipment && (
        <div className="text-xs mt-1 border-t border-gray-700 pt-1">
          <div className="text-gray-400">
            🔫 {unit.weapon.name} ({unit.weapon.damage} dmg)
          </div>
          {unit.armor && (
            <div className="text-gray-400">
              🧥 {unit.armor.name}
            </div>
          )}
        </div>
      )}

      {/* Status Effects */}
      {unit.statusEffects.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {unit.statusEffects.map((effect, i) => (
            <span
              key={i}
              className="px-1 bg-red-900 text-red-300 text-xs rounded"
            >
              {effect.id}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

interface CombatLogPanelProps {
  entries: CombatLogEntry[];
  currentIndex: number;
}

function CombatLogPanel({ entries, currentIndex }: CombatLogPanelProps) {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries.length, currentIndex]);

  return (
    <div className="h-full overflow-y-auto font-mono text-xs">
      {entries.slice(0, currentIndex + 1).map((entry) => (
        <div
          key={entry.id}
          className={`
            p-2 border-b border-gray-800
            ${entry.type === 'death' ? 'bg-red-900/30' : ''}
          `}
        >
          {/* Main message */}
          <div className="text-gray-200">{entry.message}</div>

          {/* Damage breakdown */}
          {entry.details && entry.details.hitResult && entry.details.hitResult !== 'miss' && (
            <div className="text-gray-500 text-xs mt-1 pl-2">
              Roll {entry.details.roll} vs {entry.details.accuracy}: {entry.details.hitResult?.toUpperCase()}
              {entry.details.rawDamage !== undefined && (
                <>
                  <br />
                  {entry.details.rawDamage} raw
                  {entry.details.shieldAbsorbed ? ` → Shield: -${entry.details.shieldAbsorbed}` : ''}
                  {entry.details.drReduced ? ` → DR: -${entry.details.drReduced}` : ''}
                  {' → '}<span className="text-yellow-400">{entry.details.finalDamage} final</span>
                </>
              )}
              {entry.details.rangeBracket && (
                <span className="text-gray-600"> ({entry.details.rangeBracket})</span>
              )}
              {entry.details.flankingBonus ? (
                <span className="text-orange-400"> +{entry.details.flankingBonus}% flanking</span>
              ) : null}
            </div>
          )}
        </div>
      ))}
      <div ref={logEndRef} />
    </div>
  );
}

interface SpeedControlsProps {
  currentSpeed: SpeedMode;
  isRunning: boolean;
  isPaused: boolean;
  onSpeedChange: (speed: SpeedMode) => void;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
}

function SpeedControls({
  currentSpeed,
  isRunning,
  isPaused,
  onSpeedChange,
  onPlay,
  onPause,
  onStep
}: SpeedControlsProps) {
  const speeds: SpeedMode[] = ['1x', '2x', '4x', 'instant'];

  return (
    <div className="flex items-center gap-2">
      {/* Play/Pause */}
      {isRunning && !isPaused ? (
        <button
          onClick={onPause}
          className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 rounded text-sm"
        >
          ⏸ Pause
        </button>
      ) : (
        <button
          onClick={onPlay}
          className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded text-sm"
        >
          ▶ Play
        </button>
      )}

      {/* Step */}
      <button
        onClick={onStep}
        className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm"
        disabled={isRunning && !isPaused}
      >
        ⏭ Step
      </button>

      {/* Speed selector */}
      <div className="flex gap-1 ml-2">
        {speeds.map((speed) => (
          <button
            key={speed}
            onClick={() => onSpeedChange(speed)}
            className={`
              px-2 py-1 rounded text-sm
              ${currentSpeed === speed
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}
            `}
          >
            {speed === 'instant' ? '⚡' : speed}
          </button>
        ))}
      </div>
    </div>
  );
}

interface ResultsScreenProps {
  result: BattleResult;
  blueUnits: SimUnit[];
  redUnits: SimUnit[];
  onContinue?: () => void;
}

function ResultsScreen({ result, blueUnits, redUnits, onContinue }: ResultsScreenProps) {
  const isVictory = result.winner === 'blue';

  // Get survivors and dead for each team
  const blueSurvivors = blueUnits.filter(u => u.alive);
  const blueDead = blueUnits.filter(u => !u.alive);
  const redDead = redUnits.filter(u => !u.alive);

  // Calculate loot from dead enemies (their actual equipment)
  const loot: Array<{ name: string; type: 'weapon' | 'armor'; from: string }> = [];
  redDead.forEach(enemy => {
    // Add weapon
    if (enemy.weapon) {
      loot.push({ name: enemy.weapon.name, type: 'weapon', from: enemy.name });
    }
    // Add armor
    if (enemy.armor) {
      loot.push({ name: enemy.armor.name, type: 'armor', from: enemy.name });
    }
  });

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <h2 className={`text-2xl font-bold text-center mb-4 ${isVictory ? 'text-green-400' : 'text-red-400'}`}>
          ⚔️ COMBAT COMPLETE - {isVictory ? 'VICTORY' : 'DEFEAT'}
        </h2>

        {/* Combat Duration */}
        <div className="text-center text-gray-500 text-sm mb-4">
          {result.rounds} rounds • {result.totalTurns} turns • {result.durationMs.toFixed(0)}ms
        </div>

        {/* Team Status Section */}
        <div className="border border-gray-700 rounded mb-4">
          <div className="bg-gray-800 px-3 py-2 border-b border-gray-700 text-sm font-bold text-blue-400">
            YOUR TEAM STATUS
          </div>
          <div className="p-3 grid grid-cols-2 gap-3">
            {blueUnits.map(unit => (
              <div key={unit.id} className={`flex items-center gap-2 text-sm ${unit.alive ? '' : 'opacity-50'}`}>
                <span className={unit.alive ? 'text-green-400' : 'text-red-400'}>
                  {unit.alive ? '✓' : '💀'}
                </span>
                <span className="text-gray-200">{unit.name}</span>
                <span className="text-gray-500">({unit.origin})</span>
                {unit.alive && (
                  <span className={`ml-auto ${unit.hp < unit.maxHp * 0.5 ? 'text-yellow-400' : 'text-gray-400'}`}>
                    HP: {unit.hp}/{unit.maxHp}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Enemy Casualties */}
        <div className="border border-gray-700 rounded mb-4">
          <div className="bg-gray-800 px-3 py-2 border-b border-gray-700 text-sm font-bold text-red-400">
            ENEMY CASUALTIES
          </div>
          <div className="p-3">
            {redUnits.map(enemy => (
              <div key={enemy.id} className="flex items-center justify-between text-sm py-1 border-b border-gray-800 last:border-0">
                <div className="flex items-center gap-2">
                  <span className={enemy.alive ? 'text-yellow-400' : 'text-gray-500'}>
                    {enemy.alive ? '🏃' : '💀'}
                  </span>
                  <span className={enemy.alive ? 'text-yellow-400' : 'text-gray-400'}>
                    {enemy.name}
                  </span>
                  <span className="text-gray-600">
                    - {enemy.alive ? 'FLED' : 'KILLED'}
                  </span>
                </div>
                <div className="text-gray-500 text-xs">
                  Equipment: {enemy.weapon?.name || 'None'}
                  {enemy.armor && `, ${enemy.armor.name}`}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Loot Section */}
        {loot.length > 0 && isVictory && (
          <div className="border border-gray-700 rounded mb-4">
            <div className="bg-gray-800 px-3 py-2 border-b border-gray-700 text-sm font-bold text-yellow-400">
              LOOT RECOVERED (from bodies)
            </div>
            <div className="p-3 grid grid-cols-2 gap-2">
              {loot.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <span>{item.type === 'weapon' ? '🔫' : '🧥'}</span>
                  <span className="text-gray-200">{item.name}</span>
                  <span className="text-gray-500 text-xs">← {item.from}</span>
                </div>
              ))}
            </div>
            <div className="px-3 pb-3 flex justify-end">
              <button className="px-3 py-1 bg-yellow-700 hover:bg-yellow-600 rounded text-sm">
                Take All
              </button>
            </div>
          </div>
        )}

        {/* Combat Stats Summary */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm font-mono">
          <div className="bg-gray-800 p-3 rounded">
            <div className="text-gray-400 mb-2 font-bold">YOUR TEAM</div>
            <div>Survivors: {result.blueSurvivors}/{result.blueUnitsStart}</div>
            <div>Damage Dealt: {result.blueDamageDealt}</div>
          </div>
          <div className="bg-gray-800 p-3 rounded">
            <div className="text-gray-400 mb-2 font-bold">ENEMIES</div>
            <div>Killed: {redDead.length}/{result.redUnitsStart}</div>
            <div>Damage Dealt: {result.redDamageDealt}</div>
          </div>
        </div>

        {/* Continue Button */}
        <div className="text-center mt-4">
          <button
            onClick={onContinue}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded text-lg"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ MAIN COMPONENT ============

export function FastCombat({ blueTeam, redTeam, onComplete, onBack }: FastCombatProps) {
  const [state, dispatch] = useReducer(combatReducer, {
    status: 'idle',
    blueUnits: blueTeam,
    redUnits: redTeam,
    currentRound: 0,
    currentTurn: 0,
    activeUnitId: null,
    log: [],
    logIndex: -1,
    result: null,
    speedMode: '1x',
  });

  const timerRef = useRef<number | null>(null);

  // Run the battle and load results
  const runCombat = useCallback(() => {
    // Run the headless battle
    const result = runBattle(blueTeam, redTeam);

    // Load results into state
    dispatch({
      type: 'LOAD_RESULT',
      result,
      blueUnits: blueTeam.map((u, i) => ({
        ...u,
        hp: result.blueDeaths.includes(u.name) ? 0 : u.hp,
        alive: !result.blueDeaths.includes(u.name),
      })),
      redUnits: redTeam.map((u, i) => ({
        ...u,
        hp: result.redDeaths.includes(u.name) ? 0 : u.hp,
        alive: !result.redDeaths.includes(u.name),
      })),
    });

    // Auto-play log entries based on speed
    if (state.speedMode !== 'step') {
      playLog(result.log.length, SPEED_DELAYS[state.speedMode]);
    }
  }, [blueTeam, redTeam, state.speedMode]);

  // Play through log entries at specified delay
  const playLog = (totalEntries: number, delay: number) => {
    if (delay === 0) {
      // Instant - show all
      dispatch({ type: 'SHOW_LOG_ENTRY', index: totalEntries - 1 });
      return;
    }

    let index = 0;
    const tick = () => {
      if (index < totalEntries) {
        dispatch({ type: 'SHOW_LOG_ENTRY', index });
        index++;
        timerRef.current = window.setTimeout(tick, delay);
      }
    };
    tick();
  };

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Start combat on mount
  useEffect(() => {
    runCombat();
  }, []);

  // Speed change handler
  const handleSpeedChange = (mode: SpeedMode) => {
    dispatch({ type: 'SET_SPEED', mode });
  };

  // Step handler
  const handleStep = () => {
    if (state.logIndex < state.log.length - 1) {
      dispatch({ type: 'SHOW_LOG_ENTRY', index: state.logIndex + 1 });
    }
  };

  // Continue handler
  const handleContinue = () => {
    if (state.result && onComplete) {
      onComplete(state.result);
    }
  };

  return (
    <div className="h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
          >
            ← Back
          </button>
          <h1 className="text-lg font-bold">
            ⚔️ FAST COMBAT {state.result ? `- Round ${state.result.rounds}` : ''}
          </h1>
        </div>
        <SpeedControls
          currentSpeed={state.speedMode}
          isRunning={state.status === 'running'}
          isPaused={state.status === 'paused'}
          onSpeedChange={handleSpeedChange}
          onPlay={() => dispatch({ type: 'RESUME' })}
          onPause={() => dispatch({ type: 'PAUSE' })}
          onStep={handleStep}
        />
      </div>

      {/* Main 3-Column Layout */}
      <div className="flex-1 grid grid-cols-3 gap-2 p-2 overflow-hidden">
        {/* Left: Blue Team */}
        <div className="bg-gray-900 rounded border border-gray-800 p-2 overflow-y-auto">
          <h2 className="text-blue-400 font-bold mb-2 text-sm">🔵 YOUR TEAM</h2>
          {state.blueUnits.map((unit) => (
            <UnitCard
              key={unit.id}
              unit={unit}
              isActive={unit.id === state.activeUnitId}
            />
          ))}
        </div>

        {/* Center: Combat Log */}
        <div className="bg-gray-900 rounded border border-gray-800 overflow-hidden flex flex-col">
          <h2 className="text-gray-400 font-bold p-2 text-sm border-b border-gray-800">
            COMBAT LOG ({state.logIndex + 1}/{state.log.length})
          </h2>
          <CombatLogPanel entries={state.log} currentIndex={state.logIndex} />
        </div>

        {/* Right: Red Team */}
        <div className="bg-gray-900 rounded border border-gray-800 p-2 overflow-y-auto">
          <h2 className="text-red-400 font-bold mb-2 text-sm">🔴 ENEMIES</h2>
          {state.redUnits.map((unit) => (
            <UnitCard
              key={unit.id}
              unit={unit}
              isActive={unit.id === state.activeUnitId}
            />
          ))}
        </div>
      </div>

      {/* Footer: Turn Order */}
      <div className="p-2 border-t border-gray-800 text-xs text-gray-500">
        <span>Status: {state.status}</span>
        {state.result && (
          <span className="ml-4">
            Winner: <span className={state.result.winner === 'blue' ? 'text-blue-400' : 'text-red-400'}>
              {state.result.winner}
            </span>
          </span>
        )}
      </div>

      {/* Results Screen Overlay */}
      {state.status === 'complete' && state.result && state.logIndex >= state.log.length - 1 && (
        <ResultsScreen
          result={state.result}
          blueUnits={state.blueUnits}
          redUnits={state.redUnits}
          onContinue={handleContinue}
        />
      )}
    </div>
  );
}

export default FastCombat;
