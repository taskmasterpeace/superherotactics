/**
 * Comprehensive fix for ALL corrupted country fields
 * Reparses the CSV correctly and replaces entire country objects
 */

const fs = require('fs');

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

// Map country names to 2-letter codes (we'll extract from TS file)
const countryCodeMap = {
  "Algeria": "DZ", "Angola": "AO", "Argentina": "AR", "Armenia": "AM",
  "Australia": "AU", "Croatia": "HR", "Azerbaijan": "AZ", "Bahrain": "BH",
  "Bangladesh": "BD", "Belarus": "BY", "Belgium": "BE", "Benin": "BJ",
  "Morocco": "MA", "Nigeria": "NG", "Pakistan": "PK", "Philippines": "PH",
  "Rwanda": "RW", "Senegal": "SN", "Sierra Leone": "SL", "Israel": "IL",
  "Italy": "IT", "Jamaica": "JM", "Switzerland": "CH", "Zambia": "ZM",
  "Puerto Rico": "PR", "Lebanon": "LB", "Honduras": "HN", "Finland": "FI",
  "Madagascar": "MG", "Palestine": "PS", "Trinidad and Tobago": "TT",
  "Mauritania": "MR", "Western Sahara": "EH", "Slovakia": "SK",
  "Congo": "CG", "France": "FR", "Ivory Coast": "CI", "Syria": "SY",
  "Tajikistan": "TJ", "Thailand": "TH", "United Arab Emirates": "AE",
  "Vietnam": "VN", "Yemen": "YE", "Zimbabwe": "ZW", "Republic of the Congo": "CG",
  "Kazakhstan": "KZ", "Jordan": "JO", "Kuwait": "KW", "Niger": "NE",
  "Guinea": "GN", "Chad": "TD", "Tunisia": "TN", "Burkina Faso": "BF",
  "Burundi": "BI", "Cameroon": "CM", "Cambodia": "KH", "Denmark": "DK",
  "Djibouti": "DJ", "Dominican Republic": "DO", "Ecuador": "EC",
  "El Salvador": "SV", "Gabon": "GA", "Guinea-Bissau": "GW", "Haiti": "HT",
  "Laos": "LA", "Lithuania": "LT", "Mali": "ML", "Togo": "TG",
  "Namibia": "NA", "South Sudan": "SS", "Central African Republic": "CF",
  "São Tomé and Príncipe": "ST", "Equatorial Guinea": "GQ", "Guyana": "GY",
  "Suriname": "SR", "Albania": "AL", "The Bahamas": "BS"
};

// Read and parse the CSV
const csvPath = 'c:/git/sht/SuperHero Tactics/SuperHero Tactics World Bible - Country.csv';
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const lines = csvContent.split('\n').filter(l => l.trim());

// Skip header rows (first 2 lines)
const dataLines = lines.slice(2);

// Parse all countries
const countriesFromCSV = new Map();

dataLines.forEach(line => {
  const fields = parseCSVLine(line);

  // CSV columns:
  const id = parseInt(fields[0]) || 0;
  const name = fields[1] || '';
  const president = fields[2] || '';
  const population = parseInt(fields[4]) || 0;
  const populationRating = parseInt(fields[5]) || 0;
  const motto = fields[6] || 'None';
  const nationality = fields[7] || '';
  const governmentType = fields[8] || '';
  const governmentPerception = fields[9] || '';
  const governmentCorruption = parseInt(fields[10]) || 0;
  const presidentialTerm = parseInt(fields[11]) || 0;
  const leaderTitle = fields[12] || 'President';
  const militaryServices = parseInt(fields[13]) || 20;
  const militaryBudget = parseInt(fields[14]) || 20;
  const intelligenceServices = parseInt(fields[15]) || 20;
  const intelligenceBudget = parseInt(fields[16]) || 20;
  const capitalPunishment = fields[17] || 'Inactive';
  const mediaFreedom = parseInt(fields[18]) || 50;
  const lawEnforcement = parseInt(fields[19]) || 50;
  const lawEnforcementBudget = parseInt(fields[20]) || 50;
  const gdpNational = parseInt(fields[21]) || 40;
  const gdpPerCapita = parseInt(fields[22]) || 40;
  const healthcare = parseInt(fields[23]) || 50;
  const higherEducation = parseInt(fields[24]) || 50;
  const socialDevelopment = parseInt(fields[25]) || 50;
  const lifestyle = parseInt(fields[26]) || 50;
  const terrorismActivity = fields[27] || '0';
  const cyberCapabilities = parseInt(fields[28]) || 20;
  const digitalDevelopment = parseInt(fields[29]) || 50;
  const science = parseInt(fields[30]) || 20;
  const cloning = fields[31] || 'Banned';
  const lswActivity = parseInt(fields[32]) || 20;
  const lswRegulations = fields[33] || 'Banned';
  const vigilantism = fields[34] || 'Banned';
  const leaderGender = fields[35] || '';

  if (id && name) {
    countriesFromCSV.set(name, {
      id, name, president, population, populationRating,
      motto, nationality, governmentType, governmentPerception,
      governmentCorruption: 100 - governmentCorruption, // Invert!
      presidentialTerm, leaderTitle, militaryServices, militaryBudget,
      intelligenceServices, intelligenceBudget, capitalPunishment,
      mediaFreedom, lawEnforcement, lawEnforcementBudget,
      gdpNational, gdpPerCapita, healthcare, higherEducation,
      socialDevelopment, lifestyle, terrorismActivity,
      cyberCapabilities, digitalDevelopment, science, cloning,
      lswActivity, lswRegulations, vigilantism, leaderGender
    });
  }
});

console.log(`Parsed ${countriesFromCSV.size} countries from CSV\n`);

// List of countries we know are corrupted
const corruptedCountries = [
  "Angola", "Armenia", "Benin", "Congo", "France", "Ivory Coast",
  "Morocco", "Pakistan", "Philippines", "Rwanda", "Senegal", "Sierra Leone",
  "Syria", "Tajikistan", "Thailand", "United Arab Emirates", "Vietnam", "Yemen",
  "Zimbabwe", "Republic of the Congo", "Kazakhstan", "Jordan", "Kuwait",
  "Niger", "Guinea", "Chad", "Tunisia", "Burkina Faso", "Burundi", "Cameroon",
  "Cambodia", "Denmark", "Djibouti", "Dominican Republic", "Ecuador",
  "El Salvador", "Gabon", "Guinea-Bissau", "Haiti", "Israel", "Italy",
  "Jamaica", "Switzerland", "Zambia", "Laos", "Lithuania", "Madagascar",
  "Mali", "Palestine", "Togo", "Trinidad and Tobago", "Mauritania",
  "Namibia", "South Sudan", "Central African Republic", "Western Sahara",
  "Slovakia", "São Tomé and Príncipe", "Equatorial Guinea", "Guyana",
  "Suriname", "Albania", "The Bahamas", "Lebanon", "Honduras", "Finland"
];

// Read TypeScript file
const tsPath = 'c:/git/sht/MVP/src/data/allCountries.ts';
let tsContent = fs.readFileSync(tsPath, 'utf-8');

// Extract existing culture codes and groups from the file
const cultureDataMap = new Map();
const cultureRegex = /name:\s*"([^"]+)"[\s\S]*?cultureCode:\s*(\d+),\s*cultureGroup:\s*'([A-Z])'/g;
let cultureMatch;

while ((cultureMatch = cultureRegex.exec(tsContent)) !== null) {
  cultureDataMap.set(cultureMatch[1], {
    cultureCode: parseInt(cultureMatch[2]),
    cultureGroup: cultureMatch[3]
  });
}

// Now fix each corrupted country
let fixCount = 0;

corruptedCountries.forEach(countryName => {
  const csvData = countriesFromCSV.get(countryName);
  if (!csvData) {
    console.log(`⚠️  No CSV data for: ${countryName}`);
    return;
  }

  const code = countryCodeMap[countryName];
  if (!code) {
    console.log(`⚠️  No country code for: ${countryName}`);
    return;
  }

  const cultureData = cultureDataMap.get(countryName);
  if (!cultureData) {
    console.log(`⚠️  No culture data for: ${countryName}`);
    return;
  }

  // Find the old country object
  const oldObjRegex = new RegExp(
    `\\{\\s*id:\\s*${csvData.id},\\s*code:\\s*"[^"]+",\\s*name:\\s*"${countryName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[\\s\\S]*?cultureGroup:\\s*'[A-Z]'\\s*\\}`,
    ''
  );

  const oldMatch = tsContent.match(oldObjRegex);
  if (!oldMatch) {
    console.log(`❌ Couldn't find country object for: ${countryName}`);
    return;
  }

  // Build corrected object
  const newObj = `{
    id: ${csvData.id},
    code: "${code}",
    name: "${csvData.name}",
    president: "${csvData.president}",
    population: ${csvData.population},
    populationRating: ${csvData.populationRating},
    motto: "${csvData.motto}",
    nationality: "${csvData.nationality}",
    governmentType: "${csvData.governmentType}",
    governmentPerception: "${csvData.governmentPerception}",
    governmentCorruption: ${csvData.governmentCorruption},
    presidentialTerm: ${csvData.presidentialTerm},
    leaderTitle: "${csvData.leaderTitle}",
    militaryServices: ${csvData.militaryServices},
    militaryBudget: ${csvData.militaryBudget},
    intelligenceServices: ${csvData.intelligenceServices},
    intelligenceBudget: ${csvData.intelligenceBudget},
    capitalPunishment: "${csvData.capitalPunishment}",
    mediaFreedom: ${csvData.mediaFreedom},
    lawEnforcement: ${csvData.lawEnforcement},
    lawEnforcementBudget: ${csvData.lawEnforcementBudget},
    gdpNational: ${csvData.gdpNational},
    gdpPerCapita: ${csvData.gdpPerCapita},
    healthcare: ${csvData.healthcare},
    higherEducation: ${csvData.higherEducation},
    socialDevelopment: ${csvData.socialDevelopment},
    lifestyle: ${csvData.lifestyle},
    terrorismActivity: "${csvData.terrorismActivity}",
    cyberCapabilities: ${csvData.cyberCapabilities},
    digitalDevelopment: ${csvData.digitalDevelopment},
    science: ${csvData.science},
    cloning: "${csvData.cloning}",
    lswActivity: ${csvData.lswActivity},
    lswRegulations: "${csvData.lswRegulations}",
    vigilantism: "${csvData.vigilantism}",
    leaderGender: "${csvData.leaderGender}",
    cultureCode: ${cultureData.cultureCode},
    cultureGroup: '${cultureData.cultureGroup}'
  }`;

  tsContent = tsContent.replace(oldMatch[0], newObj);
  console.log(`✅ Fixed: ${countryName}`);
  fixCount++;
});

console.log(`\n📊 Total fixed: ${fixCount} countries`);

// Write back
fs.writeFileSync(tsPath, tsContent, 'utf-8');
console.log(`📝 Updated ${tsPath}`);
