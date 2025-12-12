/**
 * Fix corrupted country data in allCountries.ts
 *
 * Problem: CSV parsing split quoted fields containing commas incorrectly,
 * causing motto text to leak into nationality, governmentType, etc.
 *
 * This script reads the CSV correctly and fixes the TypeScript file.
 */

const fs = require('fs');
const path = require('path');

// Parse CSV line respecting quotes
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  return result;
}

// Read and parse the CSV
const csvPath = 'c:/git/sht/SuperHero Tactics/SuperHero Tactics World Bible - Country.csv';
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const lines = csvContent.split('\n').filter(l => l.trim());

// Skip header rows (first 2 lines)
const dataLines = lines.slice(2);

// Create a map of country corrections by ID
const corrections = new Map();

dataLines.forEach(line => {
  const fields = parseCSVLine(line);

  // CSV structure:
  // 0: Country Code (ID)
  // 1: Country
  // 2: President
  // 3: (empty)
  // 4: Population
  // 5: PopulationRating
  // 6: Motto
  // 7: Nationalities
  // 8: GovernmentStructureType
  // 9: GovernmentPreception
  // 10: GovermentCorruption
  // 11: PresidentialTerm
  // 12: LeaderTitleType
  // ... etc

  const id = parseInt(fields[0]);
  const name = fields[1];
  const motto = fields[6];
  const nationality = fields[7];
  const governmentType = fields[8];
  const governmentPerception = fields[9];

  if (id && name) {
    corrections.set(id, {
      id,
      name,
      motto,
      nationality,
      governmentType,
      governmentPerception
    });
  }
});

console.log(`Parsed ${corrections.size} countries from CSV`);

// Read the TypeScript file
const tsPath = 'c:/git/sht/MVP/src/data/allCountries.ts';
let tsContent = fs.readFileSync(tsPath, 'utf-8');

// Find countries that need fixing by looking for corrupted patterns
const countryRegex = /\{\s*id:\s*(\d+),[\s\S]*?cultureGroup:\s*'[A-Z]'\s*\}/g;
let match;
let fixCount = 0;

while ((match = countryRegex.exec(tsContent)) !== null) {
  const countryBlock = match[0];
  const idMatch = countryBlock.match(/id:\s*(\d+)/);

  if (!idMatch) continue;

  const id = parseInt(idMatch[1]);
  const correction = corrections.get(id);

  if (!correction) {
    console.log(`No correction found for ID ${id}`);
    continue;
  }

  // Check if this country looks corrupted
  const mottoMatch = countryBlock.match(/motto:\s*"([^"]*)"/);
  const nationalityMatch = countryBlock.match(/nationality:\s*"([^"]*)"/);
  const govTypeMatch = countryBlock.match(/governmentType:\s*"([^"]*)"/);
  const govPerceptionMatch = countryBlock.match(/governmentPerception:\s*"([^"]*)"/);

  if (!mottoMatch || !nationalityMatch || !govTypeMatch || !govPerceptionMatch) {
    console.log(`Skipping ID ${id} - couldn't parse fields`);
    continue;
  }

  const currentMotto = mottoMatch[1];
  const currentNationality = nationalityMatch[1];
  const currentGovType = govTypeMatch[1];
  const currentGovPerception = govPerceptionMatch[1];

  // Check if corrupted (motto contains quote fragments, nationality doesn't end in expected patterns)
  const isCorrupted =
    currentMotto.includes('\\"') ||
    currentMotto.startsWith('\\"') ||
    currentNationality.includes('\\"') ||
    !currentNationality.match(/^[A-Z][a-z]+( [A-Z][a-z]+)*$/i) ||
    currentGovType === currentNationality ||
    currentGovPerception === currentGovType;

  if (isCorrupted) {
    console.log(`\nFixing ${correction.name} (ID: ${id})`);
    console.log(`  OLD motto: "${currentMotto}"`);
    console.log(`  NEW motto: "${correction.motto}"`);
    console.log(`  OLD nationality: "${currentNationality}"`);
    console.log(`  NEW nationality: "${correction.nationality}"`);
    console.log(`  OLD governmentType: "${currentGovType}"`);
    console.log(`  NEW governmentType: "${correction.governmentType}"`);
    console.log(`  OLD governmentPerception: "${currentGovPerception}"`);
    console.log(`  NEW governmentPerception: "${correction.governmentPerception}"`);

    // Create corrected block
    let correctedBlock = countryBlock;

    // Fix motto
    correctedBlock = correctedBlock.replace(
      /motto:\s*"[^"]*"/,
      `motto: "${correction.motto.replace(/"/g, '\\"')}"`
    );

    // Fix nationality
    correctedBlock = correctedBlock.replace(
      /nationality:\s*"[^"]*"/,
      `nationality: "${correction.nationality.replace(/"/g, '\\"')}"`
    );

    // Fix governmentType
    correctedBlock = correctedBlock.replace(
      /governmentType:\s*"[^"]*"/,
      `governmentType: "${correction.governmentType.replace(/"/g, '\\"')}"`
    );

    // Fix governmentPerception
    correctedBlock = correctedBlock.replace(
      /governmentPerception:\s*"[^"]*"/,
      `governmentPerception: "${correction.governmentPerception.replace(/"/g, '\\"')}"`
    );

    // Replace in file
    tsContent = tsContent.replace(countryBlock, correctedBlock);
    fixCount++;
  }
}

console.log(`\n\nFixed ${fixCount} corrupted countries`);

// Write back to file
fs.writeFileSync(tsPath, tsContent, 'utf-8');
console.log(`Updated ${tsPath}`);
