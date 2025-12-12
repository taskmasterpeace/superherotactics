const fs = require('fs');
const path = require('path');

const sectorsPath = path.join(__dirname, '../src/data/sectors-populated.ts');
let content = fs.readFileSync(sectorsPath, 'utf8');

// Function to update a single sector
function updateSector(content, sectorId, countryCode) {
  // Look for the sector start
  const idPattern = `"id": "${sectorId}"`;
  const idIndex = content.indexOf(idPattern);
  
  if (idIndex === -1) {
    console.log(`Sector ${sectorId} not found`);
    return content;
  }
  
  // Find the sector boundaries (previous { and next })
  let braceCount = 0;
  let sectorStart = idIndex;
  
  // Go back to find opening brace
  for (let i = idIndex; i >= 0; i--) {
    if (content[i] === '{') {
      sectorStart = i;
      break;
    }
  }
  
  // Go forward to find closing brace
  let sectorEnd = idIndex;
  braceCount = 0;
  for (let i = sectorStart; i < content.length; i++) {
    if (content[i] === '{') braceCount++;
    if (content[i] === '}') braceCount--;
    if (braceCount === 0) {
      sectorEnd = i + 1;
      break;
    }
  }
  
  // Extract and modify the sector
  let sector = content.substring(sectorStart, sectorEnd);
  
  // Update countries
  sector = sector.replace(/"countries": \[[^\]]*\]/, `"countries": ["${countryCode}"]`);
  // Update terrain
  sector = sector.replace(/"terrain": "[^"]*"/, '"terrain": "land"');
  // Update isOcean
  sector = sector.replace(/"isOcean": \w+/, '"isOcean": false');
  
  // Replace in content
  return content.substring(0, sectorStart) + sector + content.substring(sectorEnd);
}

// Corrected assignments based on actual map
const assignments = {
  // Alaska (US) - northwest corner
  'D3': 'US', 'D4': 'US',
  'E3': 'US', 'E4': 'US',
  
  // Canada - spans wide, rows C-F
  'C5': 'CA', 'C6': 'CA', 'C7': 'CA', 'C8': 'CA', 'C9': 'CA', 'C10': 'CA', 'C11': 'CA',
  'D5': 'CA', 'D6': 'CA', 'D7': 'CA', 'D8': 'CA', 'D9': 'CA', 'D10': 'CA', 'D11': 'CA',
  'E5': 'CA', 'E6': 'CA', 'E7': 'CA', 'E8': 'CA', 'E9': 'CA', 'E10': 'CA', 'E11': 'CA',
  'F4': 'CA', 'F5': 'CA', 'F6': 'CA', 'F7': 'CA', 'F8': 'CA', 'F9': 'CA', 'F10': 'CA', 'F11': 'CA',
  
  // USA - rows G-J
  'G5': 'US', 'G6': 'US', 'G7': 'US', 'G8': 'US', 'G9': 'US', 'G10': 'US',
  'H5': 'US', 'H6': 'US', 'H7': 'US', 'H8': 'US', 'H9': 'US', 'H10': 'US',
  'I5': 'US', 'I6': 'US', 'I7': 'US', 'I8': 'US', 'I9': 'US',
  'J5': 'US', 'J6': 'US',
  
  // Mexico - rows J-L
  'J7': 'MX', 'J8': 'MX',
  'K5': 'MX', 'K6': 'MX', 'K7': 'MX', 'K8': 'MX',
  'L6': 'MX', 'L7': 'MX', 'L8': 'MX',
};

let updated = 0;
for (const [sectorId, countryCode] of Object.entries(assignments)) {
  const oldLen = content.length;
  content = updateSector(content, sectorId, countryCode);
  if (content.includes(`"id": "${sectorId}"`) && content.includes(`"countries": ["${countryCode}"]`)) {
    updated++;
  }
}

fs.writeFileSync(sectorsPath, content);
console.log(`Processed ${Object.keys(assignments).length} sectors`);

// Verify
const usMatch = content.match(/"US"/g) || [];
const caMatch = content.match(/"CA"/g) || [];
const mxMatch = content.match(/"MX"/g) || [];
console.log(`Final counts - US: ${usMatch.length}, CA: ${caMatch.length}, MX: ${mxMatch.length}`);
