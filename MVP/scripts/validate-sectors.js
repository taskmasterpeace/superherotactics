/**
 * Validate sector country codes against the 168-country database
 */

const fs = require('fs');
const path = require('path');

// Read sectors file
const sectorsPath = path.join(__dirname, '../src/data/sectors-populated.ts');
const sectorsContent = fs.readFileSync(sectorsPath, 'utf-8');

// Extract all country codes from sectors
const countryCodes = new Set();
const matches = sectorsContent.matchAll(/"countries":\s*\[([^\]]*)\]/g);
for (const m of matches) {
  const codes = m[1].match(/"([A-Z]{2})"/g);
  if (codes) {
    codes.forEach(c => countryCodes.add(c.replace(/"/g, '')));
  }
}

// Read allCountries to get valid codes
const countriesPath = path.join(__dirname, '../src/data/allCountries.ts');
const countriesContent = fs.readFileSync(countriesPath, 'utf-8');
const validCodes = new Set();
const codeMatches = countriesContent.matchAll(/code:\s*"([A-Z]{2})"/g);
for (const m of codeMatches) {
  validCodes.add(m[1]);
}

console.log('=== SECTOR COUNTRY CODE VALIDATION ===\n');
console.log('Codes used in sectors:', [...countryCodes].sort().join(', '));
console.log('\nTotal unique codes in sectors:', countryCodes.size);
console.log('Total valid country codes:', validCodes.size);

// Find invalid codes
const invalidCodes = [...countryCodes].filter(c => !validCodes.has(c));
if (invalidCodes.length > 0) {
  console.log('\n!!! INVALID CODES FOUND:', invalidCodes.join(', '));

  // Show which sectors have invalid codes
  console.log('\nSectors with invalid codes:');
  for (const code of invalidCodes) {
    const regex = new RegExp(`"id":\\s*"([A-Z]\\d+)"[^}]*"countries":\\s*\\[[^\\]]*"${code}"`, 'g');
    const sectorMatches = sectorsContent.matchAll(regex);
    for (const sm of sectorMatches) {
      console.log(`  ${sm[1]}: has invalid code "${code}"`);
    }
  }
} else {
  console.log('\n✓ All sector codes are valid!');
}

// Count sectors with countries
const allSectorMatches = [...sectorsContent.matchAll(/"countries":\s*\[([^\]]*)\]/g)];
const sectorsWithCountries = allSectorMatches.filter(m => m[1].trim().length > 0).length;
const emptySectors = allSectorMatches.filter(m => m[1].trim().length === 0).length;

console.log('\n=== SECTOR STATS ===');
console.log('Sectors with countries:', sectorsWithCountries);
console.log('Empty sectors:', emptySectors);
console.log('Total sectors:', allSectorMatches.length);

// Show which countries are NOT yet assigned to any sector
const assignedCodes = countryCodes;
const unassignedCountries = [...validCodes].filter(c => !assignedCodes.has(c));
if (unassignedCountries.length > 0) {
  console.log('\n=== UNASSIGNED COUNTRIES ===');
  console.log(`${unassignedCountries.length} countries not yet in any sector:`);

  // Get country names for unassigned codes
  for (const code of unassignedCountries.slice(0, 20)) {
    const nameMatch = countriesContent.match(new RegExp(`code:\\s*"${code}"[^}]*name:\\s*"([^"]+)"`));
    const name = nameMatch ? nameMatch[1] : 'Unknown';
    console.log(`  ${code}: ${name}`);
  }
  if (unassignedCountries.length > 20) {
    console.log(`  ... and ${unassignedCountries.length - 20} more`);
  }
}
