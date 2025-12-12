/**
 * Fix duplicate text issues in allCountries.ts
 * Example: motto: "God, the Country, theKing"God",
 * Should be: motto: "God, the Country, theKing",
 */

const fs = require('fs');

// Read file
const tsPath = 'c:/git/sht/MVP/src/data/allCountries.ts';
let tsContent = fs.readFileSync(tsPath, 'utf-8');

// Pattern 1: Fix motto fields with duplicate fragments like: "text"fragment",
// This happens when the quote wasn't properly handled
const pattern1 = /motto:\s*"([^"]+)"([^",\n]+)",/g;
let fixCount = 0;

tsContent = tsContent.replace(pattern1, (match, correctValue, duplicate) => {
  console.log(`Fixing motto: "${correctValue}"${duplicate}" → "${correctValue}"`);
  fixCount++;
  return `motto: "${correctValue}",`;
});

// Pattern 2: Fix nationality fields with duplicate quotes like: "text"",
const pattern2 = /nationality:\s*"([^"]+)""+,/g;
tsContent = tsContent.replace(pattern2, (match, correctValue) => {
  console.log(`Fixing nationality: "${correctValue}"" → "${correctValue}"`);
  fixCount++;
  return `nationality: "${correctValue}",`;
});

// Pattern 3: Fix governmentType fields with duplicate quotes like: "text"",
const pattern3 = /governmentType:\s*"([^"]+)""+,/g;
tsContent = tsContent.replace(pattern3, (match, correctValue) => {
  console.log(`Fixing governmentType: "${correctValue}"" → "${correctValue}"`);
  fixCount++;
  return `governmentType: "${correctValue}",`;
});

console.log(`\n✅ Fixed ${fixCount} duplicate text issues`);

// Write back
fs.writeFileSync(tsPath, tsContent, 'utf-8');
console.log(`📝 Updated ${tsPath}`);
