const fs = require('fs');
const catalog = JSON.parse(fs.readFileSync('public/assets/sounds/catalog.json', 'utf8'));
const keys = Object.keys(catalog).filter(k => k !== '_metadata');

console.log('Total sounds:', keys.length);

const byCategory = {};
keys.forEach(k => {
  const cat = catalog[k].category;
  byCategory[cat] = (byCategory[cat] || 0) + 1;
});

console.log('\nSounds by category:');
Object.entries(byCategory).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
  console.log(`  ${cat}: ${count}`);
});

console.log('\nSample sounds from each category:');
const samples = {};
keys.forEach(k => {
  const cat = catalog[k].category;
  if (!samples[cat]) samples[cat] = [];
  if (samples[cat].length < 5) samples[cat].push(k);
});

Object.entries(samples).sort().forEach(([cat, sounds]) => {
  console.log(`\n${cat}:`);
  sounds.forEach(s => console.log(`  - ${s}`));
});
