/**
 * Quick test for the Calling System
 * Run: npx tsx src/data/callingSystemTest.ts
 */

import {
  CALLINGS,
  getCalling,
  getCallingCategories,
  areCallingsCompatible,
  calculateTeamChemistry,
  CallingId,
} from './callingSystem';

import {
  generateCallingForMBTI,
  MBTI_CALLING_ALIGNMENT,
  doesCallingFitMBTI,
} from './personalitySystem';

console.log('='.repeat(60));
console.log('       CALLING SYSTEM TEST');
console.log('='.repeat(60));

// Test 1: Count callings
console.log('\n=== CALLING COUNT ===');
console.log(`Total callings: ${Object.keys(CALLINGS).length}`);
console.log(`Categories: ${Object.keys(getCallingCategories()).length}`);

// Test 2: Categories
console.log('\n=== CALLING CATEGORIES ===');
const categories = getCallingCategories();
for (const [cat, callings] of Object.entries(categories)) {
  console.log(`  ${cat}: ${callings.join(', ')}`);
}

// Test 3: MBTI Alignment
console.log('\n=== MBTI -> CALLING ALIGNMENT ===');
const testMBTIs = ['INTJ', 'ENFP', 'ISTP', 'ESFJ', 'INFJ', 'ESTP'];
for (const mbti of testMBTIs) {
  const alignment = MBTI_CALLING_ALIGNMENT[mbti];
  const generated = generateCallingForMBTI(mbti);
  console.log(`\n${mbti}:`);
  console.log(`  Primary: ${alignment.primary.join(', ')}`);
  console.log(`  Secondary: ${alignment.secondary.join(', ')}`);
  console.log(`  Generated: ${generated}`);
}

// Test 4: Calling fit check
console.log('\n=== CALLING FIT CHECK ===');
const fitTests: [CallingId, string][] = [
  ['architect', 'INTJ'],   // Should be natural
  ['protector', 'INTJ'],   // Should be unusual
  ['thrill_seeker', 'ESTP'], // Should be natural
  ['soldier', 'ESTP'],     // Should be unusual
];
for (const [calling, mbti] of fitTests) {
  const fit = doesCallingFitMBTI(calling, mbti);
  console.log(`  ${calling} + ${mbti} = ${fit}`);
}

// Test 5: Compatibility
console.log('\n=== CALLING COMPATIBILITY ===');
const compatTests: [CallingId, CallingId][] = [
  ['protector', 'guardian'],   // Compatible
  ['protector', 'mercenary'],  // Conflicting
  ['soldier', 'professional'], // Neutral
  ['idealist', 'nihilist'],    // Conflicting
];
for (const [a, b] of compatTests) {
  const result = areCallingsCompatible(a, b);
  console.log(`  ${a} + ${b} = ${result}`);
}

// Test 6: Team chemistry
console.log('\n=== TEAM CHEMISTRY ===');
const teams: { name: string; callings: CallingId[] }[] = [
  { name: 'Hero Team', callings: ['protector', 'guardian', 'idealist', 'soldier'] },
  { name: 'Mercenary Squad', callings: ['mercenary', 'professional', 'thrill_seeker', 'survivor'] },
  { name: 'Dysfunctional', callings: ['protector', 'mercenary', 'idealist', 'nihilist'] },
  { name: 'Villain Team', callings: ['conqueror', 'zealot', 'predator', 'chaos_agent'] },
];
for (const team of teams) {
  const chemistry = calculateTeamChemistry(team.callings);
  console.log(`  ${team.name}: ${chemistry > 0 ? '+' : ''}${chemistry}`);
}

// Test 7: Sample calling details
console.log('\n=== SAMPLE CALLING: PROTECTOR ===');
const protector = getCalling('protector');
console.log(`Name: ${protector.name}`);
console.log(`Description: ${protector.description}`);
console.log(`Core Desire: ${protector.coreDesire}`);
console.log(`Greatest Fear: ${protector.greatestFear}`);
console.log(`Compatible: ${protector.compatible.join(', ')}`);
console.log(`Conflicts: ${protector.conflicting.join(', ')}`);
console.log(`Will work for: ${protector.willWorkFor.join(', ')}`);
console.log(`Won't work for: ${protector.wontWorkFor.join(', ')}`);

console.log('\n=== SAMPLE CALLING: MERCENARY ===');
const mercenary = getCalling('mercenary');
console.log(`Name: ${mercenary.name}`);
console.log(`Description: ${mercenary.description}`);
console.log(`Core Desire: ${mercenary.coreDesire}`);
console.log(`Greatest Fear: ${mercenary.greatestFear}`);

console.log('\n' + '='.repeat(60));
console.log('       ALL TESTS COMPLETE');
console.log('='.repeat(60));
