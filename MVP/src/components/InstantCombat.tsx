/**
 * Instant Combat - Text-based batch testing UI
 *
 * Run thousands of battles per second with full statistics.
 * No animations, no Phaser - pure TypeScript simulation.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { RetroPanel } from './ui/RetroPanel';
import { RetroButton } from './ui/RetroButton';
import {
  runBatch,
  formatBatchResult,
  createSoldierTest,
  createRifleVsPistolTest,
  createCoverTest,
  createEliteVsNumbersTest,
  createShotgunVsRifleTest,
  createTeam,
  createCustomUnit,
  UNIT_PRESETS,
  WEAPONS,
  resetUnitIds,
  testCoverEffectiveness,
  testStanceEffectiveness,
  SimUnit,
  BatchResult,
} from '../combat';

// ============ TYPES ============

interface TestScenario {
  id: string;
  name: string;
  description: string;
  create: () => { blue: SimUnit[]; red: SimUnit[]; description: string };
}

// ============ TEST SCENARIOS ============

const TEST_SCENARIOS: TestScenario[] = [
  {
    id: 'soldier3v3',
    name: '3v3 Soldiers (Balanced)',
    description: 'Equal soldiers with assault rifles. Expected: ~50% each.',
    create: createSoldierTest,
  },
  {
    id: 'rifleVsPistol',
    name: 'Rifles vs Pistols',
    description: '3 rifles vs 3 pistols. Expected: Rifles ~70%.',
    create: createRifleVsPistolTest,
  },
  {
    id: 'shotgunVsRifle',
    name: 'Shotguns vs Rifles',
    description: '3 shotguns vs 3 rifles (no range). Expected: Shotguns win.',
    create: createShotgunVsRifleTest,
  },
  {
    id: 'cover',
    name: 'Cover Effectiveness',
    description: '3 in half cover vs 3 in open. Expected: Cover ~65%.',
    create: createCoverTest,
  },
  {
    id: 'eliteVsNumbers',
    name: 'Elite vs Numbers',
    description: '2 elite snipers vs 5 armed civilians.',
    create: createEliteVsNumbersTest,
  },
];

// ============ COMPONENT ============

interface InstantCombatProps {
  onClose?: () => void;
}

export const InstantCombat: React.FC<InstantCombatProps> = ({ onClose }) => {
  // State
  const [selectedScenario, setSelectedScenario] = useState<string>('soldier3v3');
  const [iterations, setIterations] = useState<number>(100);
  const [result, setResult] = useState<BatchResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [combatLog, setCombatLog] = useState<string[]>([]);
  const [coverResults, setCoverResults] = useState<{
    noCover: BatchResult;
    halfCover: BatchResult;
    fullCover: BatchResult;
  } | null>(null);
  const [stanceResults, setStanceResults] = useState<{
    normal: BatchResult;
    aggressive: BatchResult;
    defensive: BatchResult;
  } | null>(null);

  // Get current scenario
  const scenario = useMemo(
    () => TEST_SCENARIOS.find((s) => s.id === selectedScenario) || TEST_SCENARIOS[0],
    [selectedScenario]
  );

  // Run batch test
  const runTest = useCallback(
    (count: number) => {
      setIsRunning(true);
      setCombatLog([]);
      setCoverResults(null);
      setStanceResults(null);

      // Use setTimeout to allow UI to update
      setTimeout(() => {
        resetUnitIds();
        const { blue, red, description } = scenario.create();

        const log: string[] = [];
        log.push(`=== ${scenario.name} ===`);
        log.push(description);
        log.push(`Running ${count.toLocaleString()} battles...`);
        log.push('');

        const batchResult = runBatch(blue, red, count);

        log.push(`Completed in ${batchResult.totalDurationMs.toFixed(1)}ms`);
        log.push(`Speed: ${batchResult.fightsPerSecond.toFixed(0)} fights/second`);
        log.push('');
        log.push('--- RESULTS ---');
        log.push(`Blue wins: ${batchResult.blueWinRate.toFixed(1)}%`);
        log.push(`Red wins:  ${batchResult.redWinRate.toFixed(1)}%`);
        log.push(`Draws:     ${batchResult.drawRate.toFixed(1)}%`);
        log.push('');
        log.push(`Avg rounds: ${batchResult.avgRounds.toFixed(1)}`);

        if (count <= 100) {
          log.push(`Avg blue deaths: ${batchResult.avgBlueDeaths.toFixed(2)}`);
          log.push(`Avg red deaths:  ${batchResult.avgRedDeaths.toFixed(2)}`);

          // Weapon stats
          if (Object.keys(batchResult.weaponStats).length > 0) {
            log.push('');
            log.push('--- WEAPON STATS ---');
            for (const [weapon, stats] of Object.entries(batchResult.weaponStats)) {
              log.push(`${weapon}:`);
              log.push(
                `  Hit Rate: ${stats.hitRate.toFixed(1)}%, Avg Dmg: ${stats.avgDamage.toFixed(1)}, Kills: ${stats.kills}`
              );
            }
          }
        }

        setResult(batchResult);
        setCombatLog(log);
        setIsRunning(false);
      }, 10);
    },
    [scenario]
  );

  // Run cover effectiveness test
  const runCoverTest = useCallback(() => {
    setIsRunning(true);
    setCombatLog([]);
    setResult(null);
    setStanceResults(null);

    setTimeout(() => {
      resetUnitIds();
      const defenders = createTeam(UNIT_PRESETS.soldierRifle, 'blue', 3);
      const attackers = createTeam(UNIT_PRESETS.soldierRifle, 'red', 3);

      const log: string[] = [];
      log.push('=== COVER EFFECTIVENESS TEST ===');
      log.push('Testing 3 soldiers vs 3 soldiers with different cover levels');
      log.push('Running 500 battles per cover type...');
      log.push('');

      const results = testCoverEffectiveness(defenders, attackers, 500);

      log.push('--- RESULTS ---');
      log.push(`No Cover:   ${results.noCover.blueWinRate.toFixed(1)}% win rate`);
      log.push(`Half Cover: ${results.halfCover.blueWinRate.toFixed(1)}% win rate`);
      log.push(`Full Cover: ${results.fullCover.blueWinRate.toFixed(1)}% win rate`);
      log.push('');
      log.push('Cover provides:');
      log.push(`  Half: +${(results.halfCover.blueWinRate - results.noCover.blueWinRate).toFixed(1)}% survival`);
      log.push(`  Full: +${(results.fullCover.blueWinRate - results.noCover.blueWinRate).toFixed(1)}% survival`);

      setCoverResults(results);
      setCombatLog(log);
      setIsRunning(false);
    }, 10);
  }, []);

  // Run stance effectiveness test
  const runStanceTest = useCallback(() => {
    setIsRunning(true);
    setCombatLog([]);
    setResult(null);
    setCoverResults(null);

    setTimeout(() => {
      resetUnitIds();
      const units = createTeam(UNIT_PRESETS.soldierRifle, 'blue', 3);
      const enemies = createTeam(UNIT_PRESETS.soldierRifle, 'red', 3);

      const log: string[] = [];
      log.push('=== STANCE EFFECTIVENESS TEST ===');
      log.push('Testing 3 soldiers vs 3 soldiers with different stances');
      log.push('Running 500 battles per stance...');
      log.push('');

      const results = testStanceEffectiveness(units, enemies, 500);

      log.push('--- RESULTS ---');
      log.push(`Normal:     ${results.normal.blueWinRate.toFixed(1)}% win rate`);
      log.push(`Aggressive: ${results.aggressive.blueWinRate.toFixed(1)}% win rate`);
      log.push(`Defensive:  ${results.defensive.blueWinRate.toFixed(1)}% win rate`);
      log.push('');
      log.push('Stance effects:');
      log.push(`  Aggressive: ${(results.aggressive.blueWinRate - results.normal.blueWinRate).toFixed(1)}% vs normal`);
      log.push(`  Defensive:  ${(results.defensive.blueWinRate - results.normal.blueWinRate).toFixed(1)}% vs normal`);

      setStanceResults(results);
      setCombatLog(log);
      setIsRunning(false);
    }, 10);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <RetroPanel
        variant="elevated"
        className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        title="INSTANT COMBAT"
        icon="zap"
        actions={
          onClose && (
            <RetroButton variant="ghost" size="sm" onClick={onClose}>
              X
            </RetroButton>
          )
        }
      >
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Scenario Selection */}
          <RetroPanel variant="card" className="p-4">
            <h3 className="text-lg font-bold mb-3 text-purple-300">TEST SCENARIO</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {TEST_SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedScenario(s.id)}
                  className={`text-left p-3 border-2 transition-all ${
                    selectedScenario === s.id
                      ? 'border-purple-500 bg-purple-900/50'
                      : 'border-gray-700 hover:border-gray-500'
                  }`}
                >
                  <div className="font-bold">{s.name}</div>
                  <div className="text-sm text-gray-400">{s.description}</div>
                </button>
              ))}
            </div>
          </RetroPanel>

          {/* Controls */}
          <RetroPanel variant="card" className="p-4">
            <h3 className="text-lg font-bold mb-3 text-purple-300">BATCH CONTROLS</h3>
            <div className="flex flex-wrap gap-2">
              <RetroButton
                variant="primary"
                onClick={() => runTest(1)}
                disabled={isRunning}
              >
                Run 1
              </RetroButton>
              <RetroButton
                variant="primary"
                onClick={() => runTest(100)}
                disabled={isRunning}
              >
                Run 100
              </RetroButton>
              <RetroButton
                variant="primary"
                onClick={() => runTest(1000)}
                disabled={isRunning}
              >
                Run 1,000
              </RetroButton>
              <RetroButton
                variant="primary"
                onClick={() => runTest(10000)}
                disabled={isRunning}
              >
                Run 10,000
              </RetroButton>
              <div className="w-px h-8 bg-gray-600 mx-2" />
              <RetroButton
                variant="secondary"
                onClick={runCoverTest}
                disabled={isRunning}
              >
                Test Cover
              </RetroButton>
              <RetroButton
                variant="secondary"
                onClick={runStanceTest}
                disabled={isRunning}
              >
                Test Stances
              </RetroButton>
            </div>
            {isRunning && (
              <div className="mt-3 text-yellow-400 animate-pulse">
                Running simulations...
              </div>
            )}
          </RetroPanel>

          {/* Results Summary */}
          {result && (
            <RetroPanel variant="card" className="p-4">
              <h3 className="text-lg font-bold mb-3 text-purple-300">RESULTS</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-blue-400">
                    {result.blueWinRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-400">Blue Wins</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-400">
                    {result.drawRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-400">Draws</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-red-400">
                    {result.redWinRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-400">Red Wins</div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Total Fights:</span>{' '}
                  <span className="font-bold">{result.totalFights.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-400">Avg Rounds:</span>{' '}
                  <span className="font-bold">{result.avgRounds.toFixed(1)}</span>
                </div>
                <div>
                  <span className="text-gray-400">Duration:</span>{' '}
                  <span className="font-bold">{result.totalDurationMs.toFixed(1)}ms</span>
                </div>
                <div>
                  <span className="text-gray-400">Speed:</span>{' '}
                  <span className="font-bold text-green-400">
                    {result.fightsPerSecond.toFixed(0)} fights/sec
                  </span>
                </div>
              </div>
            </RetroPanel>
          )}

          {/* Cover Results */}
          {coverResults && (
            <RetroPanel variant="card" className="p-4">
              <h3 className="text-lg font-bold mb-3 text-purple-300">COVER COMPARISON</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-24 text-gray-400">No Cover:</div>
                  <div className="flex-1 h-6 bg-gray-800 relative">
                    <div
                      className="h-full bg-blue-600"
                      style={{ width: `${coverResults.noCover.blueWinRate}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                      {coverResults.noCover.blueWinRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 text-gray-400">Half Cover:</div>
                  <div className="flex-1 h-6 bg-gray-800 relative">
                    <div
                      className="h-full bg-blue-500"
                      style={{ width: `${coverResults.halfCover.blueWinRate}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                      {coverResults.halfCover.blueWinRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 text-gray-400">Full Cover:</div>
                  <div className="flex-1 h-6 bg-gray-800 relative">
                    <div
                      className="h-full bg-blue-400"
                      style={{ width: `${coverResults.fullCover.blueWinRate}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                      {coverResults.fullCover.blueWinRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </RetroPanel>
          )}

          {/* Stance Results */}
          {stanceResults && (
            <RetroPanel variant="card" className="p-4">
              <h3 className="text-lg font-bold mb-3 text-purple-300">STANCE COMPARISON</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-24 text-gray-400">Normal:</div>
                  <div className="flex-1 h-6 bg-gray-800 relative">
                    <div
                      className="h-full bg-gray-500"
                      style={{ width: `${stanceResults.normal.blueWinRate}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                      {stanceResults.normal.blueWinRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 text-red-400">Aggressive:</div>
                  <div className="flex-1 h-6 bg-gray-800 relative">
                    <div
                      className="h-full bg-red-600"
                      style={{ width: `${stanceResults.aggressive.blueWinRate}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                      {stanceResults.aggressive.blueWinRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 text-blue-400">Defensive:</div>
                  <div className="flex-1 h-6 bg-gray-800 relative">
                    <div
                      className="h-full bg-blue-600"
                      style={{ width: `${stanceResults.defensive.blueWinRate}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                      {stanceResults.defensive.blueWinRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </RetroPanel>
          )}

          {/* Combat Log */}
          <RetroPanel variant="card" className="p-4">
            <h3 className="text-lg font-bold mb-3 text-purple-300">COMBAT LOG</h3>
            <div className="bg-black/50 p-3 font-mono text-sm h-64 overflow-auto">
              {combatLog.length === 0 ? (
                <div className="text-gray-500">Run a test to see results...</div>
              ) : (
                combatLog.map((line, i) => (
                  <div key={i} className={line.startsWith('---') ? 'text-purple-400 mt-2' : ''}>
                    {line || '\u00A0'}
                  </div>
                ))
              )}
            </div>
          </RetroPanel>
        </div>
      </RetroPanel>
    </div>
  );
};

export default InstantCombat;
