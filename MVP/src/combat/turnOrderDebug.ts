/**
 * Debug turn order to find systematic bias
 */

import {
  createUnit,
  UNIT_PRESETS,
  getTurnOrder,
} from './index';

console.log('=== TURN ORDER BIAS TEST ===\n');

let blueFirstCount = 0;
let redFirstCount = 0;

for (let i = 0; i < 1000; i++) {
  const blue = [
    createUnit(UNIT_PRESETS.boxer, 'blue'),
    createUnit(UNIT_PRESETS.boxer, 'blue'),
    createUnit(UNIT_PRESETS.boxer, 'blue'),
  ];
  const red = [
    createUnit(UNIT_PRESETS.boxer, 'red'),
    createUnit(UNIT_PRESETS.boxer, 'red'),
    createUnit(UNIT_PRESETS.boxer, 'red'),
  ];

  const allUnits = [...blue, ...red];
  const turnOrder = getTurnOrder(allUnits);

  // Check who goes first
  if (turnOrder[0].team === 'blue') {
    blueFirstCount++;
  } else {
    redFirstCount++;
  }
}

console.log(`Blue first: ${blueFirstCount} (${(blueFirstCount/10).toFixed(1)}%)`);
console.log(`Red first: ${redFirstCount} (${(redFirstCount/10).toFixed(1)}%)`);
console.log(`Expected: 50%/50%`);

// Test a single turn order for inspection
const blue = [
  createUnit(UNIT_PRESETS.boxer, 'blue'),
  createUnit(UNIT_PRESETS.boxer, 'blue'),
  createUnit(UNIT_PRESETS.boxer, 'blue'),
];
const red = [
  createUnit(UNIT_PRESETS.boxer, 'red'),
  createUnit(UNIT_PRESETS.boxer, 'red'),
  createUnit(UNIT_PRESETS.boxer, 'red'),
];

console.log('\n=== SAMPLE TURN ORDER ===');
const allUnits = [...blue, ...red];
const turnOrder = getTurnOrder(allUnits);
turnOrder.forEach((u, i) => {
  console.log(`${i+1}. ${u.name} (${u.team})`);
});
