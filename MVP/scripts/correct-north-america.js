/**
 * Correct North America sector assignments based on actual map geography
 * Map: world-map-pixel.jpg - 40x24 grid
 *
 * User confirmed: Sector E2 is Alaska
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/sectors-populated.ts');

// Define North America sectors based on actual visible map geography
// Row E column 2 = Alaska (user confirmed)
const sectorAssignments = {
  // ALASKA (US) - Northwest corner, rows C-G, columns 1-4
  'C1': ['US'], 'C2': ['US'], 'C3': ['US'],
  'D1': ['US'], 'D2': ['US'], 'D3': ['US'], 'D4': ['US'],
  'E1': ['US'], 'E2': ['US'], 'E3': ['US'], 'E4': ['US'],
  'F1': ['US'], 'F2': ['US'], 'F3': ['US'],
  'G2': ['US'], 'G3': ['US'],

  // CANADA - Large area east of Alaska, rows D-I, columns 4-15
  'C4': ['CA'], 'C5': ['CA'], 'C6': ['CA'], 'C7': ['CA'], 'C8': ['CA'], 'C9': ['CA'], 'C10': ['CA'], 'C11': ['CA'], 'C12': ['CA'], 'C13': ['CA'], 'C14': ['CA'],
  'D5': ['CA'], 'D6': ['CA'], 'D7': ['CA'], 'D8': ['CA'], 'D9': ['CA'], 'D10': ['CA'], 'D11': ['CA'], 'D12': ['CA'], 'D13': ['CA'], 'D14': ['CA'], 'D15': ['CA'],
  'E5': ['CA'], 'E6': ['CA'], 'E7': ['CA'], 'E8': ['CA'], 'E9': ['CA'], 'E10': ['CA'], 'E11': ['CA'], 'E12': ['CA'], 'E13': ['CA'], 'E14': ['CA'], 'E15': ['CA'],
  'F4': ['CA'], 'F5': ['CA'], 'F6': ['CA'], 'F7': ['CA'], 'F8': ['CA'], 'F9': ['CA'], 'F10': ['CA'], 'F11': ['CA'], 'F12': ['CA'], 'F13': ['CA'], 'F14': ['CA'],
  'G4': ['CA'], 'G5': ['CA'], 'G6': ['CA'], 'G7': ['CA'], 'G8': ['CA'], 'G9': ['CA'], 'G10': ['CA'], 'G11': ['CA'], 'G12': ['CA'], 'G13': ['CA'],
  'H4': ['CA'], 'H5': ['CA'], 'H6': ['CA'], 'H7': ['CA'], 'H8': ['CA'], 'H9': ['CA'], 'H10': ['CA'], 'H11': ['CA'], 'H12': ['CA'], 'H13': ['CA'],

  // USA MAINLAND - Below Canada, rows H-L, columns 4-14
  'I3': ['US'], 'I4': ['US'], 'I5': ['US'], 'I6': ['US'], 'I7': ['US'], 'I8': ['US'], 'I9': ['US'], 'I10': ['US'], 'I11': ['US'], 'I12': ['US'], 'I13': ['US'],
  'J3': ['US'], 'J4': ['US'], 'J5': ['US'], 'J6': ['US'], 'J7': ['US'], 'J8': ['US'], 'J9': ['US'], 'J10': ['US'], 'J11': ['US'], 'J12': ['US'], 'J13': ['US'],
  'K3': ['US'], 'K4': ['US'], 'K5': ['US'], 'K6': ['US'], 'K7': ['US'], 'K8': ['US'], 'K9': ['US'], 'K10': ['US'], 'K11': ['US'], 'K12': ['US'],
  'L5': ['US'], 'L6': ['US'], 'L7': ['US'], 'L8': ['US'], 'L9': ['US'], 'L10': ['US'], 'L11': ['US'],

  // MEXICO - South of USA, rows L-N, columns 4-9
  'L3': ['MX'], 'L4': ['MX'],
  'M3': ['MX'], 'M4': ['MX'], 'M5': ['MX'], 'M6': ['MX'], 'M7': ['MX'], 'M8': ['MX'],
  'N4': ['MX'], 'N5': ['MX'], 'N6': ['MX'], 'N7': ['MX'],
  'O5': ['MX'], 'O6': ['MX'],
};

// Read the file
let content = fs.readFileSync(filePath, 'utf-8');

let updatedCount = 0;
const countryStats = { US: 0, CA: 0, MX: 0 };

// Update each sector using line-by-line approach
for (const [sectorId, countries] of Object.entries(sectorAssignments)) {
  // Find the sector block and update it
  // Pattern: "id": "E2",
  const idPattern = `"id": "${sectorId}"`;
  const idIndex = content.indexOf(idPattern);

  if (idIndex === -1) {
    console.log(`Could not find sector: ${sectorId}`);
    continue;
  }

  // Find the start of this object (the { before id)
  let blockStart = content.lastIndexOf('{', idIndex);
  // Find the end of this object (the } after all properties)
  let blockEnd = content.indexOf('}', idIndex);

  if (blockStart === -1 || blockEnd === -1) {
    console.log(`Could not find block boundaries for: ${sectorId}`);
    continue;
  }

  // Extract the block
  let block = content.substring(blockStart, blockEnd + 1);

  // Update terrain
  block = block.replace(/"terrain": "[^"]*"/, `"terrain": "land"`);

  // Update countries
  block = block.replace(/"countries": \[[^\]]*\]/, `"countries": ${JSON.stringify(countries)}`);

  // Update isOcean
  block = block.replace(/"isOcean": true/, `"isOcean": false`);

  // Replace in content
  content = content.substring(0, blockStart) + block + content.substring(blockEnd + 1);

  updatedCount++;
  countries.forEach(c => countryStats[c]++);
}

// Write the file back
fs.writeFileSync(filePath, content);

console.log(`\nUpdated ${updatedCount} sectors`);
console.log(`Country distribution: US=${countryStats.US}, CA=${countryStats.CA}, MX=${countryStats.MX}`);
console.log('\nKey sectors verified:');
console.log('  E2 = Alaska (US)');
console.log('  E10 = Canada (CA)');
console.log('  J8 = USA mainland (US)');
console.log('  M5 = Mexico (MX)');
