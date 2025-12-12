/**
 * Fix corrupted country data in allCountries.ts - FINAL VERSION
 * Properly handles quotes and fixes all corrupted fields
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

// Create a map of country corrections by NAME
const corrections = new Map();

dataLines.forEach(line => {
  const fields = parseCSVLine(line);

  const id = parseInt(fields[0]);
  const name = fields[1];
  const motto = fields[6];
  const nationality = fields[7];
  const governmentType = fields[8];
  const governmentPerception = fields[9];

  if (id && name) {
    corrections.set(name, {
      id,
      name,
      motto,
      nationality,
      governmentType,
      governmentPerception
    });
  }
});

console.log(`Parsed ${corrections.size} countries from CSV\n`);

// Read the TypeScript file
const tsPath = 'c:/git/sht/MVP/src/data/allCountries.ts';
let tsContent = fs.readFileSync(tsPath, 'utf-8');

// Match all country objects
const countryRegex = /\{\s*id:\s*\d+,\s*code:\s*"[^"]+",\s*name:\s*"([^"]+)"[\s\S]*?cultureGroup:\s*'[A-Z]'\s*\}/g;
let match;
let fixCount = 0;
const originalContent = tsContent;

while ((match = countryRegex.exec(originalContent)) !== null) {
  const countryBlock = match[0];
  const countryName = match[1];

  const correction = corrections.get(countryName);

  if (!correction) {
    console.log(`⚠️  No CSV data found for: ${countryName}`);
    continue;
  }

  // Extract current values - handle potential escaped quotes
  const mottoMatch = countryBlock.match(/motto:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
  const nationalityMatch = countryBlock.match(/nationality:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
  const govTypeMatch = countryBlock.match(/governmentType:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
  const govPerceptionMatch = countryBlock.match(/governmentPerception:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);

  if (!mottoMatch || !nationalityMatch || !govTypeMatch || !govPerceptionMatch) {
    console.log(`❌ Couldn't parse fields for: ${countryName}`);
    continue;
  }

  const currentMotto = mottoMatch[1];
  const currentNationality = nationalityMatch[1];
  const currentGovType = govTypeMatch[1];
  const currentGovPerception = govPerceptionMatch[1];

  // Prepare corrected values (don't double-escape)
  const correctMotto = correction.motto;
  const correctNationality = correction.nationality;
  const correctGovType = correction.governmentType;
  const correctGovPerception = correction.governmentPerception;

  // Check if ANY field is wrong
  const mottoWrong = currentMotto !== correctMotto;
  const nationalityWrong = currentNationality !== correctNationality;
  const govTypeWrong = currentGovType !== correctGovType;
  const govPerceptionWrong = currentGovPerception !== correctGovPerception;

  if (mottoWrong || nationalityWrong || govTypeWrong || govPerceptionWrong) {
    console.log(`\n🔧 Fixing ${countryName} (ID: ${correction.id})`);

    if (mottoWrong) {
      console.log(`  motto: "${currentMotto}" → "${correctMotto}"`);
    }
    if (nationalityWrong) {
      console.log(`  nationality: "${currentNationality}" → "${correctNationality}"`);
    }
    if (govTypeWrong) {
      console.log(`  governmentType: "${currentGovType}" → "${correctGovType}"`);
    }
    if (govPerceptionWrong) {
      console.log(`  governmentPerception: "${currentGovPerception}" → "${correctGovPerception}"`);
    }

    // Create corrected block - be careful not to double-escape
    let correctedBlock = countryBlock;

    // Replace each field individually
    if (mottoWrong) {
      correctedBlock = correctedBlock.replace(
        /motto:\s*"[^"\\]*(?:\\.[^"\\]*)*"/,
        `motto: "${correctMotto}"`
      );
    }

    if (nationalityWrong) {
      correctedBlock = correctedBlock.replace(
        /nationality:\s*"[^"\\]*(?:\\.[^"\\]*)*"/,
        `nationality: "${correctNationality}"`
      );
    }

    if (govTypeWrong) {
      correctedBlock = correctedBlock.replace(
        /governmentType:\s*"[^"\\]*(?:\\.[^"\\]*)*"/,
        `governmentType: "${correctGovType}"`
      );
    }

    if (govPerceptionWrong) {
      correctedBlock = correctedBlock.replace(
        /governmentPerception:\s*"[^"\\]*(?:\\.[^"\\]*)*"/,
        `governmentPerception: "${correctGovPerception}"`
      );
    }

    // Replace in file content
    tsContent = tsContent.replace(countryBlock, correctedBlock);
    fixCount++;
  }
}

console.log(`\n\n✅ Fixed ${fixCount} countries`);

// Write back to file
fs.writeFileSync(tsPath, tsContent, 'utf-8');
console.log(`📝 Updated ${tsPath}`);
