/**
 * Combat Training Component
 *
 * UI for combat training, Danger Room scenarios, and martial arts sparring.
 * Uses trainingSystem.ts for fast combat simulations via batchTester.
 *
 * Features:
 * - Solo/Team combat training
 * - Danger Room team exercises (X-Men style)
 * - Martial arts sparring with belt progression
 * - XP and skill progress display
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../stores/enhancedGameStore';
import {
  Swords,
  Shield,
  Target,
  Users,
  Zap,
  Trophy,
  AlertTriangle,
  Play,
  Clock,
  DollarSign,
  Star,
  Heart,
  ChevronRight,
  Dumbbell,
  Flame,
  Medal,
  Activity,
} from 'lucide-react';
import {
  TrainingDifficulty,
  TrainingType,
  TrainingSession,
  TrainingResult,
  DangerRoomScenario,
  SparringSession,
  SparringResult,
  DIFFICULTY_CONFIG,
  DANGER_ROOM_SCENARIOS,
  SPARRING_CONFIG,
  runTrainingSession,
  runDangerRoomScenario,
  runSparringSession,
  getTrainingDuration,
  getTrainingCost,
  canTrain,
  getAvailableScenarios,
} from '../data/trainingSystem';
import { GameCharacter } from '../data/characterSheet';

// =============================================================================
// TYPES
// =============================================================================

type TrainingMode = 'menu' | 'solo' | 'team' | 'danger_room' | 'sparring' | 'results';

interface TrainingState {
  mode: TrainingMode;
  selectedCharacters: string[];
  difficulty: TrainingDifficulty;
  battleCount: number;
  selectedScenario: string | null;
  result: TrainingResult | null;
  sparringResult: SparringResult | null;
}

// =============================================================================
// DIFFICULTY UI CONFIG
// =============================================================================

const DIFFICULTY_UI: Record<TrainingDifficulty, {
  color: string;
  bgColor: string;
  icon: React.ReactNode;
}> = {
  easy: { color: 'text-green-400', bgColor: 'bg-green-900/30', icon: <Shield className="w-4 h-4" /> },
  medium: { color: 'text-yellow-400', bgColor: 'bg-yellow-900/30', icon: <Target className="w-4 h-4" /> },
  hard: { color: 'text-orange-400', bgColor: 'bg-orange-900/30', icon: <Flame className="w-4 h-4" /> },
  extreme: { color: 'text-red-400', bgColor: 'bg-red-900/30', icon: <Zap className="w-4 h-4" /> },
};

// =============================================================================
// COMPONENT
// =============================================================================

export const CombatTraining: React.FC = () => {
  const characters = useGameStore((state) => state.characters);
  const budget = useGameStore((state) => state.budget);

  const [state, setState] = useState<TrainingState>({
    mode: 'menu',
    selectedCharacters: [],
    difficulty: 'medium',
    battleCount: 20,
    selectedScenario: null,
    result: null,
    sparringResult: null,
  });

  // Available characters for training
  const availableCharacters = useMemo(() => {
    return characters.filter((c: GameCharacter) => {
      const trainCheck = canTrain(c);
      return c.status === 'ready' && trainCheck.canTrain;
    });
  }, [characters]);

  // Selected character objects
  const selectedCharacterObjects = useMemo(() => {
    return characters.filter((c: GameCharacter) => state.selectedCharacters.includes(c.id));
  }, [characters, state.selectedCharacters]);

  // Available Danger Room scenarios
  const availableScenarios = useMemo(() => {
    return getAvailableScenarios(selectedCharacterObjects.length);
  }, [selectedCharacterObjects.length]);

  // Cost calculation
  const trainingCost = useMemo(() => {
    if (state.mode === 'danger_room' && state.selectedScenario) {
      const scenario = DANGER_ROOM_SCENARIOS.find(s => s.id === state.selectedScenario);
      if (scenario) {
        return getTrainingCost('danger_room', scenario.difficulty);
      }
    }
    const type = state.mode === 'menu' ? 'solo' : state.mode as TrainingType;
    return getTrainingCost(type, state.difficulty);
  }, [state.mode, state.difficulty, state.selectedScenario]);

  // Duration calculation
  const trainingDuration = useMemo(() => {
    const type = state.mode === 'menu' ? 'solo' : state.mode as TrainingType;
    return getTrainingDuration(type, state.battleCount);
  }, [state.mode, state.battleCount]);

  // Toggle character selection
  const toggleCharacter = (charId: string) => {
    setState(prev => ({
      ...prev,
      selectedCharacters: prev.selectedCharacters.includes(charId)
        ? prev.selectedCharacters.filter(id => id !== charId)
        : [...prev.selectedCharacters, charId],
    }));
  };

  // Run training
  const runTraining = () => {
    if (selectedCharacterObjects.length === 0) return;
    if (budget < trainingCost) return;

    if (state.mode === 'danger_room' && state.selectedScenario) {
      const result = runDangerRoomScenario(state.selectedScenario, selectedCharacterObjects);
      setState(prev => ({
        ...prev,
        result: result,
        mode: 'results',
      }));
    } else if (state.mode === 'sparring' && selectedCharacterObjects.length >= 1) {
      const session: SparringSession = {
        trainee: selectedCharacterObjects[0],
        partner: selectedCharacterObjects[1] || 'instructor',
        style: 'striking',
        rounds: 5,
        rules: 'light_contact',
      };
      const result = runSparringSession(session);
      setState(prev => ({
        ...prev,
        sparringResult: result,
        mode: 'results',
      }));
    } else {
      const session: TrainingSession = {
        type: state.mode === 'team' ? 'team' : 'solo',
        difficulty: state.difficulty,
        trainees: selectedCharacterObjects,
        battles: state.battleCount,
        focus: 'tactics',
      };
      const result = runTrainingSession(session);
      setState(prev => ({
        ...prev,
        result,
        mode: 'results',
      }));
    }
  };

  // Reset to menu
  const resetToMenu = () => {
    setState({
      mode: 'menu',
      selectedCharacters: [],
      difficulty: 'medium',
      battleCount: 20,
      selectedScenario: null,
      result: null,
      sparringResult: null,
    });
  };

  // =============================================================================
  // RENDER: MAIN MENU
  // =============================================================================

  const renderMenu = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-amber-400 flex items-center gap-2">
        <Dumbbell className="w-6 h-6" />
        Combat Training Facility
      </h2>

      <div className="grid grid-cols-2 gap-4">
        {/* Solo Training */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setState(prev => ({ ...prev, mode: 'solo' }))}
          className="p-4 bg-slate-800/50 border border-slate-600 rounded-lg hover:border-amber-500/50 transition-colors text-left"
        >
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-6 h-6 text-blue-400" />
            <span className="font-bold text-white">Solo Training</span>
          </div>
          <p className="text-sm text-slate-400">
            Individual combat drills against simulated opponents.
          </p>
        </motion.button>

        {/* Team Training */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setState(prev => ({ ...prev, mode: 'team' }))}
          className="p-4 bg-slate-800/50 border border-slate-600 rounded-lg hover:border-amber-500/50 transition-colors text-left"
        >
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-6 h-6 text-green-400" />
            <span className="font-bold text-white">Team Training</span>
          </div>
          <p className="text-sm text-slate-400">
            Coordinated squad exercises. Build team synergy.
          </p>
        </motion.button>

        {/* Danger Room */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setState(prev => ({ ...prev, mode: 'danger_room' }))}
          className="p-4 bg-slate-800/50 border border-slate-600 rounded-lg hover:border-amber-500/50 transition-colors text-left"
        >
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-6 h-6 text-purple-400" />
            <span className="font-bold text-white">Danger Room</span>
          </div>
          <p className="text-sm text-slate-400">
            Preset scenarios testing tactical skills. High rewards.
          </p>
        </motion.button>

        {/* Martial Arts Sparring */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setState(prev => ({ ...prev, mode: 'sparring' }))}
          className="p-4 bg-slate-800/50 border border-slate-600 rounded-lg hover:border-amber-500/50 transition-colors text-left"
        >
          <div className="flex items-center gap-3 mb-2">
            <Swords className="w-6 h-6 text-red-400" />
            <span className="font-bold text-white">Sparring</span>
          </div>
          <p className="text-sm text-slate-400">
            1v1 martial arts training. Progress belt ranks.
          </p>
        </motion.button>
      </div>
    </div>
  );

  // =============================================================================
  // RENDER: CHARACTER SELECTION
  // =============================================================================

  const renderCharacterSelection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">Select Trainees</h3>
        <span className="text-sm text-slate-400">
          {state.selectedCharacters.length} selected
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
        {availableCharacters.map((char: GameCharacter) => (
          <motion.button
            key={char.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => toggleCharacter(char.id)}
            className={`p-2 rounded-lg border transition-colors text-left ${
              state.selectedCharacters.includes(char.id)
                ? 'border-amber-500 bg-amber-900/30'
                : 'border-slate-600 bg-slate-800/30 hover:border-slate-500'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                state.selectedCharacters.includes(char.id) ? 'bg-amber-400' : 'bg-slate-600'
              }`} />
              <span className="text-sm font-medium text-white truncate">{char.name}</span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
              <Heart className="w-3 h-3" />
              <span>{char.hp}/{char.maxHp}</span>
            </div>
          </motion.button>
        ))}
      </div>

      {availableCharacters.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
          <p>No characters available for training.</p>
          <p className="text-sm">Characters must be ready and have at least 50% HP.</p>
        </div>
      )}
    </div>
  );

  // =============================================================================
  // RENDER: DIFFICULTY SELECTION
  // =============================================================================

  const renderDifficultySelection = () => (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-white">Difficulty</h3>

      <div className="grid grid-cols-2 gap-2">
        {(Object.keys(DIFFICULTY_CONFIG) as TrainingDifficulty[]).map((diff) => {
          const config = DIFFICULTY_CONFIG[diff];
          const ui = DIFFICULTY_UI[diff];
          return (
            <motion.button
              key={diff}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setState(prev => ({ ...prev, difficulty: diff }))}
              className={`p-3 rounded-lg border transition-colors text-left ${
                state.difficulty === diff
                  ? `border-amber-500 ${ui.bgColor}`
                  : 'border-slate-600 bg-slate-800/30 hover:border-slate-500'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={ui.color}>{ui.icon}</span>
                <span className={`font-bold capitalize ${ui.color}`}>{diff}</span>
              </div>
              <p className="text-xs text-slate-400">{config.description}</p>
              <div className="flex items-center gap-3 mt-2 text-xs">
                <span className="text-amber-400">XP: {config.xpMultiplier}x</span>
                {config.injuryBaseChance > 0 && (
                  <span className="text-red-400">
                    Injury: {(config.injuryBaseChance * 100).toFixed(0)}%
                  </span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );

  // =============================================================================
  // RENDER: DANGER ROOM SCENARIOS
  // =============================================================================

  const renderDangerRoomScenarios = () => (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <Zap className="w-5 h-5 text-purple-400" />
        Danger Room Scenarios
      </h3>

      {selectedCharacterObjects.length === 0 ? (
        <p className="text-slate-400 text-sm">Select team members first to see available scenarios.</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {availableScenarios.map((scenario) => {
            const diffUi = DIFFICULTY_UI[scenario.difficulty];
            return (
              <motion.button
                key={scenario.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setState(prev => ({ ...prev, selectedScenario: scenario.id }))}
                className={`w-full p-3 rounded-lg border transition-colors text-left ${
                  state.selectedScenario === scenario.id
                    ? 'border-purple-500 bg-purple-900/30'
                    : 'border-slate-600 bg-slate-800/30 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white">{scenario.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${diffUi.bgColor} ${diffUi.color}`}>
                    {scenario.difficulty}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mb-2">{scenario.description}</p>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {scenario.teamSize.min}-{scenario.teamSize.max} members
                  </span>
                  <span className="flex items-center gap-1 text-amber-400">
                    <Star className="w-3 h-3" />
                    {scenario.rewards.baseXP} XP
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );

  // =============================================================================
  // RENDER: TRAINING CONFIG
  // =============================================================================

  const renderTrainingConfig = () => (
    <div className="space-y-4">
      {/* Back button */}
      <button
        onClick={resetToMenu}
        className="text-sm text-slate-400 hover:text-white transition-colors"
      >
        &larr; Back to Menu
      </button>

      {/* Mode title */}
      <h2 className="text-xl font-bold text-amber-400 capitalize flex items-center gap-2">
        {state.mode === 'danger_room' ? (
          <>
            <Zap className="w-6 h-6" />
            Danger Room
          </>
        ) : state.mode === 'sparring' ? (
          <>
            <Swords className="w-6 h-6" />
            Martial Arts Sparring
          </>
        ) : state.mode === 'team' ? (
          <>
            <Users className="w-6 h-6" />
            Team Training
          </>
        ) : (
          <>
            <Target className="w-6 h-6" />
            Solo Training
          </>
        )}
      </h2>

      {/* Character Selection */}
      {renderCharacterSelection()}

      {/* Difficulty (for non-danger-room modes) */}
      {state.mode !== 'danger_room' && renderDifficultySelection()}

      {/* Danger Room Scenarios */}
      {state.mode === 'danger_room' && renderDangerRoomScenarios()}

      {/* Battle Count Slider (for solo/team) */}
      {(state.mode === 'solo' || state.mode === 'team') && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Training Intensity</h3>
            <span className="text-amber-400">{state.battleCount} simulated battles</span>
          </div>
          <input
            type="range"
            min={10}
            max={100}
            step={10}
            value={state.battleCount}
            onChange={(e) => setState(prev => ({ ...prev, battleCount: parseInt(e.target.value) }))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-xs text-slate-500">
            <span>Quick</span>
            <span>Intense</span>
          </div>
        </div>
      )}

      {/* Cost & Duration */}
      <div className="flex items-center gap-6 p-3 bg-slate-800/50 rounded-lg">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-green-400" />
          <span className="text-white">${trainingCost.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-400" />
          <span className="text-white">{trainingDuration}h</span>
        </div>
        <div className="flex-1" />
        <span className={`text-sm ${budget >= trainingCost ? 'text-green-400' : 'text-red-400'}`}>
          Budget: ${budget.toLocaleString()}
        </span>
      </div>

      {/* Start Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={runTraining}
        disabled={
          selectedCharacterObjects.length === 0 ||
          budget < trainingCost ||
          (state.mode === 'danger_room' && !state.selectedScenario)
        }
        className={`w-full p-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors ${
          selectedCharacterObjects.length > 0 &&
          budget >= trainingCost &&
          (state.mode !== 'danger_room' || state.selectedScenario)
            ? 'bg-amber-600 hover:bg-amber-500 text-white'
            : 'bg-slate-700 text-slate-400 cursor-not-allowed'
        }`}
      >
        <Play className="w-5 h-5" />
        Begin Training
      </motion.button>
    </div>
  );

  // =============================================================================
  // RENDER: RESULTS
  // =============================================================================

  const renderResults = () => {
    const result = state.result;
    const sparResult = state.sparringResult;

    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-amber-400 flex items-center gap-2">
          <Trophy className="w-6 h-6" />
          Training Complete!
        </h2>

        {/* Performance Rating */}
        {result && (
          <div className={`p-4 rounded-lg border ${
            result.performanceRating === 'excellent' ? 'border-green-500 bg-green-900/30' :
            result.performanceRating === 'good' ? 'border-blue-500 bg-blue-900/30' :
            result.performanceRating === 'average' ? 'border-yellow-500 bg-yellow-900/30' :
            'border-red-500 bg-red-900/30'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-white capitalize">
                {result.performanceRating} Performance
              </span>
              <span className="text-sm text-slate-400">
                {(result.winRate * 100).toFixed(0)}% win rate
              </span>
            </div>
          </div>
        )}

        {/* XP Gained */}
        <div className="p-4 bg-slate-800/50 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-white">XP Gained</span>
          </div>
          <div className="text-3xl font-bold text-amber-400">
            +{result?.xpGained || sparResult?.xpGained || 0} XP
          </div>
        </div>

        {/* Skill Progress */}
        {result?.skillProgress && Object.keys(result.skillProgress).length > 0 && (
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-5 h-5 text-blue-400" />
              <span className="font-bold text-white">Skill Progress</span>
            </div>
            <div className="space-y-2">
              {Object.entries(result.skillProgress).map(([skill, progress]) => (
                <div key={skill} className="flex items-center justify-between">
                  <span className="text-slate-300">{skill}</span>
                  <span className="text-blue-400">+{progress} pts</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Belt Progress (for sparring) */}
        {sparResult && (
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Medal className="w-5 h-5 text-purple-400" />
              <span className="font-bold text-white">Sparring Results</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Rounds Won</span>
                <span className="text-green-400">{sparResult.roundsWon}/{sparResult.totalRounds}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Belt Progress</span>
                <span className="text-purple-400">+{sparResult.beltProgress}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Injuries */}
        {result?.injured && (
          <div className="p-4 bg-red-900/30 border border-red-500 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span className="font-bold text-red-400">Training Injury</span>
            </div>
            <p className="text-slate-300">{result.injuryDescription}</p>
          </div>
        )}

        {/* Stats Summary */}
        {result && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-slate-800/30 rounded-lg">
              <span className="text-slate-400">Avg Rounds</span>
              <div className="text-white font-bold">{result.avgRoundsToWin.toFixed(1)}</div>
            </div>
            <div className="p-3 bg-slate-800/30 rounded-lg">
              <span className="text-slate-400">Injury Risk</span>
              <div className="text-white font-bold">{(result.injuryChance * 100).toFixed(0)}%</div>
            </div>
          </div>
        )}

        {/* Back to Menu */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={resetToMenu}
          className="w-full p-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
          Continue Training
        </motion.button>
      </div>
    );
  };

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <div className="p-6 bg-slate-900 text-white min-h-[500px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={state.mode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {state.mode === 'menu' && renderMenu()}
          {state.mode === 'results' && renderResults()}
          {state.mode !== 'menu' && state.mode !== 'results' && renderTrainingConfig()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default CombatTraining;
