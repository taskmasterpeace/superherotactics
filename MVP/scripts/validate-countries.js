/**
 * Validate that all countries are correctly fixed
 */

const fs = require('fs');

const tsPath = 'c:/git/sht/MVP/src/data/allCountries.ts';
const content = fs.readFileSync(tsPath, 'utf-8');

let errors = [];
let warnings = [];

// Check for numeric values in string fields
const numericLeaderTitle = content.match(/leaderTitle:\s*"[0-9]+"/g);
if (numericLeaderTitle) {
  errors.push(`Found ${numericLeaderTitle.length} leaderTitle fields with numeric values`);
}

const numericCapitalPunishment = content.match(/capitalPunishment:\s*"[0-9]+"/g);
if (numericCapitalPunishment) {
  errors.push(`Found ${numericCapitalPunishment.length} capitalPunishment fields with numeric values`);
}

const numericCloning = content.match(/cloning:\s*"[0-9]+"/g);
if (numericCloning) {
  errors.push(`Found ${numericCloning.length} cloning fields with numeric values`);
}

const numericLswRegs = content.match(/lswRegulations:\s*"[0-9]+"/g);
if (numericLswRegs) {
  errors.push(`Found ${numericLswRegs.length} lswRegulations fields with numeric values`);
}

// Check for duplicate quote patterns
const doubleQuotes = content.match(/:\s*"[^"]*""/g);
if (doubleQuotes) {
  warnings.push(`Found ${doubleQuotes.length} fields with double quotes (may be OK)`);
}

// Check for escaped backslashes in text (sign of corruption)
const backslashInText = content.match(/nationality:\s*"[^"]*\\[^"]*/g);
if (backslashInText) {
  errors.push(`Found ${backslashInText.length} nationality fields with backslashes`);
}

// Count total countries
const countryCount = (content.match(/id:\s*\d+,/g) || []).length;

// Summary
console.log('\n=== VALIDATION RESULTS ===\n');
console.log(`Total countries: ${countryCount}`);

if (errors.length === 0) {
  console.log('✅ No errors found!');
} else {
  console.log(`\n❌ ERRORS (${errors.length}):`);
  errors.forEach(err => console.log(`  - ${err}`));
}

if (warnings.length > 0) {
  console.log(`\n⚠️  WARNINGS (${warnings.length}):`);
  warnings.forEach(warn => console.log(`  - ${warn}`));
}

console.log('\n=== Sample Countries ===\n');

// Extract and show a few sample countries
const sampleNames = ['Morocco', 'Nigeria', 'Pakistan', 'Philippines', 'Rwanda', 'Senegal'];

sampleNames.forEach(name => {
  const regex = new RegExp(`name:\\s*"${name}"[\\s\\S]*?nationality:\\s*"([^"]+)"[\\s\\S]*?governmentType:\\s*"([^"]+)"`);
  const match = content.match(regex);
  if (match) {
    console.log(`${name}: ${match[1]} / ${match[2]}`);
  } else {
    console.log(`${name}: NOT FOUND`);
  }
});

console.log('\n=== Done ===\n');

process.exit(errors.length > 0 ? 1 : 0);
