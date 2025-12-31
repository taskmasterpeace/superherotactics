/**
 * Portable Combat Engine
 *
 * Headless combat simulation for balance testing.
 * Can run 1000+ battles per second.
 *
 * Usage:
 *   import { runBatch, createSoldierTest, formatBatchResult } from './combat';
 *   const { blue, red } = createSoldierTest();
 *   const result = runBatch(blue, red, 1000);
 *   console.log(formatBatchResult(result));
 */

// Types
export * from './types';

// Core combat functions
export {
  calculateDistance,
  getHitResult,
  calculateAccuracy,
  getRangeBracket,
  getBaseDamage,
  applyHitMultiplier,
  getOriginMultiplier,
  getArmorEffectiveness,
  calculateFinalDamage,
  resolveAttack,
  applyAttackResult,
  calculateInitiative,
  getTurnOrder,
  selectTarget,
  // Disarm mechanics
  calculateDisarmChance,
  attemptDisarm,
  applyDisarm,
  restoreWeapon,
  // Vision & Flanking
  getAngleToTarget,
  getVisionCone,
  isInVisionCone,
  getFlankingResult,
  getFlankingBonus,
  canReact,
  faceToward,
  // Grenades
  resolveGrenade,
  applyGrenadeResult,
  // XCOM-style 2-action movement system
  getMaxSpeed,
  getMovementRange,
  getDashRange,
  resetTurnState,
  canPerformAction,
  spendAction,
  isTurnComplete,
} from './core';

// Status effects
export {
  getStatusEffectsForDamage,
  applyStatusEffect,
  applyStatusEffects,
  processStatusEffects,
  canUnitAct,
  getAPPenalty,
  getAccuracyPenalty,
  hasMovementPenalty,
  canShatter,
  applyShatter,
  cleanExpiredEffects,
  describeEffects,
} from './statusEffects';

// Battle runner
export {
  runBattle,
  runQuickBattle,
} from './battleRunner';

// Batch testing
export {
  runBatch,
  compareLoadouts,
  testWeaponEffectiveness,
  testCoverEffectiveness,
  testStanceEffectiveness,
  formatBatchResult,
} from './batchTester';

// Human presets
export {
  WEAPONS,
  UNIT_PRESETS,
  createUnit,
  createCustomUnit,
  createTeam,
  createSoldierTest,
  createRifleVsPistolTest,
  createShotgunVsRifleTest,
  createCoverTest,
  createEliteVsNumbersTest,
  // Range-based tests
  createCloseRangeTest,
  createMediumRangeTest,
  createLongRangeTest,
  createShotgunCloseRangeTest,
  createSniperLongRangeTest,
  createPistolCloseRangeTest,
  // Melee/CQB tests
  createUnarmedMirrorTest,
  createNunchucksVsKnivesTest,
  createStaffVsFistsTest,
  createMeleeVsPistolTest,
  createSamuraiVsSoldiersTest,
  createKickboxerVsBoxerTest,
  resetUnitIds,
} from './humanPresets';

// Advanced combat mechanics
export {
  ATTACK_MODES,
  BODY_PARTS,
  resolveBurstFire,
  resolveAimedShot,
  setOverwatch,
  checkOverwatchTrigger,
  resolveOverwatchShot,
  attemptSuppression,
} from './advancedMechanics';

export type {
  AttackMode,
  AttackModeConfig,
  BodyPart,
  BodyPartTarget,
  BurstFireResult,
  AimedShotResult,
  OverwatchState,
  SuppressionResult,
} from './advancedMechanics';

// Combat scenarios
export {
  ALL_SCENARIOS,
  STREET_SCENARIOS,
  MILITARY_SCENARIOS,
  CORPORATE_SCENARIOS,
  SUPERHUMAN_SCENARIOS,
  BOSS_SCENARIOS,
  getScenariosByDifficulty,
  getScenariosByType,
  getRandomScenario,
  runScenario,
  testScenarioDifficulty,
} from './scenarios';

export type {
  ScenarioDifficulty,
  ScenarioType,
  CombatScenario,
} from './scenarios';
