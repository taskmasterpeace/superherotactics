/**
 * Reset all sectors to have no country assignments
 * This clears out incorrect mappings so we can start fresh
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/sectors-populated.ts');

// Read the file
let content = fs.readFileSync(filePath, 'utf-8');

// Reset all countries arrays to empty
content = content.replace(/"countries": \[[^\]]*\]/g, '"countries": []');

// Reset all terrain to ocean for now (we'll mark land later)
// Actually, let's keep terrain as-is, just clear countries

// Write the file back
fs.writeFileSync(filePath, content);

console.log('All sectors reset to empty countries array.');
console.log('Use the Sector Editor UI to assign countries correctly.');
