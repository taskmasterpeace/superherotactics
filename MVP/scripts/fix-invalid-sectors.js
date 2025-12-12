/**
 * Fix invalid country codes in sectors
 * Removes GM (Gambia), KM (Comoros), LS (Lesotho) - not in our 168-country database
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/sectors-populated.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// Remove invalid codes from countries arrays
const invalidCodes = ['GM', 'KM', 'LS'];

for (const code of invalidCodes) {
  // Remove from arrays like ["SN", "GM"] -> ["SN"]
  content = content.replace(new RegExp(`"${code}",\\s*`, 'g'), '');
  content = content.replace(new RegExp(`,\\s*"${code}"`, 'g'), '');
  // Handle single item arrays
  content = content.replace(new RegExp(`\\["${code}"\\]`, 'g'), '[]');
}

fs.writeFileSync(filePath, content);
console.log('Removed invalid codes:', invalidCodes.join(', '));
console.log('Fixed sectors-populated.ts');
