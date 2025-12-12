/**
 * Add extra columns (41, 42) to sectors-populated.ts
 * This extends the grid from 40 to 42 columns
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/sectors-populated.ts');
const content = fs.readFileSync(filePath, 'utf-8');

// Extract the SECTORS array from the file
const match = content.match(/export const SECTORS: Sector\[\] = (\[[\s\S]*?\]);/);
if (!match) {
  console.error('Could not find SECTORS array in file');
  process.exit(1);
}

const sectors = JSON.parse(match[1]);
console.log(`Found ${sectors.length} existing sectors`);

// Check if column 41 already exists
const hasCol41 = sectors.some(s => s.col === 41);
if (hasCol41) {
  console.log('Column 41 already exists, skipping');
  process.exit(0);
}

// Add columns 41 and 42 for each row
const rows = 'ABCDEFGHIJKLMNOPQRSTUVWX'.split('');
const newSectors = [];

for (const row of rows) {
  // Add column 41
  newSectors.push({
    id: `${row}41`,
    row: row,
    col: 41,
    terrain: 'ocean',
    countries: [],
    isOcean: true,
    isCoastal: false
  });

  // Add column 42
  newSectors.push({
    id: `${row}42`,
    row: row,
    col: 42,
    terrain: 'ocean',
    countries: [],
    isOcean: true,
    isCoastal: false
  });
}

console.log(`Adding ${newSectors.length} new sectors (columns 41-42)`);

// Merge and sort all sectors
const allSectors = [...sectors, ...newSectors];
// Sort by row then column
allSectors.sort((a, b) => {
  const rowDiff = rows.indexOf(a.row) - rows.indexOf(b.row);
  if (rowDiff !== 0) return rowDiff;
  return a.col - b.col;
});

console.log(`Total sectors: ${allSectors.length} (should be 1008 = 24 * 42)`);

// Update comments in file
let newContent = content
  .replace('40x24 grid', '42x24 grid')
  .replace('1-40 columns', '1-42 columns');

// Replace the SECTORS array
newContent = newContent.replace(
  /export const SECTORS: Sector\[\] = \[[\s\S]*?\];/,
  `export const SECTORS: Sector[] = ${JSON.stringify(allSectors, null, 2)};`
);

// Update validation in getAdjacentSectors
newContent = newContent.replace(
  /newCol >= 1 && newCol <= 40/g,
  'newCol >= 1 && newCol <= 42'
);

fs.writeFileSync(filePath, newContent);
console.log('Updated sectors-populated.ts with 42 columns');
