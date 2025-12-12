// Assign North American countries to sectors
const fs = require('fs');
const path = require('path');

const sectorsPath = path.join(__dirname, '../src/data/sectors-populated.ts');
let content = fs.readFileSync(sectorsPath, 'utf8');

// North America sector assignments
// Based on 40x24 grid with world map - Americas on left side
const assignments = {
  // Alaska (US) - far northwest
  'D1': ['US'], 'D2': ['US'], 'D3': ['US'],
  'E1': ['US'], 'E2': ['US'], 'E3': ['US'],
  
  // Canada - northern part
  'C3': ['CA'], 'C4': ['CA'], 'C5': ['CA'], 'C6': ['CA'], 'C7': ['CA'], 'C8': ['CA'], 'C9': ['CA'], 'C10': ['CA'],
  'D4': ['CA'], 'D5': ['CA'], 'D6': ['CA'], 'D7': ['CA'], 'D8': ['CA'], 'D9': ['CA'], 'D10': ['CA'], 'D11': ['CA'],
  'E4': ['CA'], 'E5': ['CA'], 'E6': ['CA'], 'E7': ['CA'], 'E8': ['CA'], 'E9': ['CA'], 'E10': ['CA'], 'E11': ['CA'],
  'F3': ['CA'], 'F4': ['CA'], 'F5': ['CA'], 'F6': ['CA'], 'F7': ['CA'], 'F8': ['CA'], 'F9': ['CA'], 'F10': ['CA'], 'F11': ['CA'],
  
  // USA - main body
  'G3': ['US'], 'G4': ['US'], 'G5': ['US'], 'G6': ['US'], 'G7': ['US'], 'G8': ['US'], 'G9': ['US'], 'G10': ['US'],
  'H3': ['US'], 'H4': ['US'], 'H5': ['US'], 'H6': ['US'], 'H7': ['US'], 'H8': ['US'], 'H9': ['US'], 'H10': ['US'],
  'I3': ['US'], 'I4': ['US'], 'I5': ['US'], 'I6': ['US'], 'I7': ['US'], 'I8': ['US'], 'I9': ['US'], 'I10': ['US'],
  'J4': ['US'], 'J5': ['US'], 'J6': ['US'], 'J7': ['US'], 'J8': ['US'], 'J9': ['US'],
  
  // Mexico
  'K4': ['MX'], 'K5': ['MX'], 'K6': ['MX'], 'K7': ['MX'],
  'L5': ['MX'], 'L6': ['MX'], 'L7': ['MX'],
};

let updated = 0;
for (const [sectorId, countries] of Object.entries(assignments)) {
  // Match the JSON-style format: "id": "A1", ... "countries": []
  const regex = new RegExp(
    `("id": "${sectorId}"[\s\S]*?"countries": )\[[^\]]*\]`,
    'g'
  );
  const newCountries = JSON.stringify(countries);
  
  const beforeLen = content.length;
  content = content.replace(regex, `$1${newCountries}`);
  
  if (content.length !== beforeLen || content.includes(`"id": "${sectorId}"`)) {
    // Also update terrain and isOcean
    const terrainRegex = new RegExp(
      `("id": "${sectorId}"[\s\S]*?"terrain": )"[^"]*"`,
      'g'
    );
    content = content.replace(terrainRegex, '$1"land"');
    
    const oceanRegex = new RegExp(
      `("id": "${sectorId}"[\s\S]*?"isOcean": )\w+`,
      'g'
    );
    content = content.replace(oceanRegex, '$1false');
    
    updated++;
  }
}

fs.writeFileSync(sectorsPath, content);
console.log(`Updated ${updated} sectors for North America`);
console.log('US, CA (Canada), MX (Mexico)');
