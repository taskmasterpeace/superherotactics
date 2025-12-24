/**
 * Quick test for character generation with callings
 * Run: npx tsx src/data/charGenTest.ts
 */

import { generateCharacter } from './characterGeneration';
import { getCalling } from './callingSystem';
import { doesCallingFitMBTI } from './personalitySystem';

console.log('=== CHARACTER GENERATION WITH CALLINGS ===\n');

// Generate 5 characters
for (let i = 0; i < 5; i++) {
  const char = generateCharacter();
  const mbti = char.personality?.mbti || 'Unknown';
  const calling = char.personality?.calling || 'Unknown';
  const fit = doesCallingFitMBTI(calling as any, mbti);
  const callingData = getCalling(calling as any);

  console.log(`${char.realName} (${char.career})`);
  console.log(`  MBTI: ${mbti} | Calling: ${calling} (${fit})`);
  console.log(`  Drive: ${callingData?.coreDesire || 'N/A'}`);
  console.log(`  Harm Avoidance: ${char.personality?.harmAvoidance}/10`);
  console.log();
}

// Quick stats
console.log('=== QUICK STATS (20 chars) ===\n');

const fitCounts = { natural: 0, possible: 0, unusual: 0 };

for (let i = 0; i < 20; i++) {
  const char = generateCharacter();
  const mbti = char.personality?.mbti || 'Unknown';
  const calling = char.personality?.calling || 'Unknown';
  const fit = doesCallingFitMBTI(calling as any, mbti);
  fitCounts[fit]++;
}

console.log('Calling Fit Distribution:');
console.log(`  Natural: ${fitCounts.natural} (${(fitCounts.natural / 20 * 100).toFixed(0)}%)`);
console.log(`  Possible: ${fitCounts.possible} (${(fitCounts.possible / 20 * 100).toFixed(0)}%)`);
console.log(`  Unusual: ${fitCounts.unusual} (${(fitCounts.unusual / 20 * 100).toFixed(0)}%)`);

console.log('\n=== TEST COMPLETE ===');
