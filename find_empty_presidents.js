const fs = require('fs');

// Read the file
const content = fs.readFileSync('c:/git/sht/MVP/src/data/allCountries.ts', 'utf8');

// Find all country objects with empty president fields
const regex = /{\s*id:\s*(\d+),\s*code:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*president:\s*"",/g;

let matches;
const countries = [];

// Find all matches
let tempContent = content;
let index = 0;
while ((matches = regex.exec(tempContent)) !== null) {
  const countryBlock = tempContent.substring(matches.index, matches.index + 2000);
  const cultureMatch = countryBlock.match(/cultureCode:\s*(\d+)/);

  if (cultureMatch) {
    countries.push({
      id: matches[1],
      code: matches[2],
      name: matches[3],
      cultureCode: parseInt(cultureMatch[1])
    });
  }
}

console.log(`Found ${countries.length} countries with empty president fields:\n`);
countries.forEach(c => {
  console.log(`${c.name} (${c.code}) - Culture ${c.cultureCode}`);
});

// Group by culture
const byCulture = {};
countries.forEach(c => {
  if (!byCulture[c.cultureCode]) byCulture[c.cultureCode] = [];
  byCulture[c.cultureCode].push(c);
});

console.log('\n\nGrouped by culture:');
Object.keys(byCulture).sort((a,b) => a-b).forEach(culture => {
  console.log(`\nCulture ${culture}: ${byCulture[culture].length} countries`);
  byCulture[culture].forEach(c => console.log(`  - ${c.name}`));
});

// Write to file
fs.writeFileSync('c:/git/sht/empty_presidents_analyzed.json', JSON.stringify(countries, null, 2));
console.log('\n\nWrote analysis to empty_presidents_analyzed.json');
