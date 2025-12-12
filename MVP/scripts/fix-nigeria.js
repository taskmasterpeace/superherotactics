/**
 * Fix Nigeria specifically - CSV has extra space in country name
 */

const fs = require('fs');

const tsPath = 'c:/git/sht/MVP/src/data/allCountries.ts';
let tsContent = fs.readFileSync(tsPath, 'utf-8');

// Find Nigeria's entry
const nigeriaRegex = /\{[^}]*name:\s*"Nigeria"[^}]*cultureGroup:\s*'[A-Z]'\s*\}/;
const match = tsContent.match(nigeriaRegex);

if (!match) {
  console.log('❌ Could not find Nigeria entry');
  process.exit(1);
}

// Correct Nigeria entry based on CSV row:
// 40,Nigeria, Emmanuel Ekpe,,206139589,75,"Unity and Faith, Peace and Progress",Nigerian,Federal Republic,Hybrid Regime,25,4,President,52,55,20,39,Active,60,87,61,58,35,35,49,53,75,82,54,31,50,Legal,88,Banned,Regulated,Male

const correctedNigeria = `{
    id: 40,
    code: "NG",
    name: "Nigeria",
    president: "Emmanuel Ekpe",
    population: 206139589,
    populationRating: 75,
    motto: "Unity and Faith, Peace and Progress",
    nationality: "Nigerian",
    governmentType: "Federal Republic",
    governmentPerception: "Hybrid Regime",
    governmentCorruption: 75,
    presidentialTerm: 4,
    leaderTitle: "President",
    militaryServices: 52,
    militaryBudget: 55,
    intelligenceServices: 20,
    intelligenceBudget: 39,
    capitalPunishment: "Active",
    mediaFreedom: 60,
    lawEnforcement: 87,
    lawEnforcementBudget: 61,
    gdpNational: 58,
    gdpPerCapita: 35,
    healthcare: 35,
    higherEducation: 49,
    socialDevelopment: 53,
    lifestyle: 75,
    terrorismActivity: "82",
    cyberCapabilities: 54,
    digitalDevelopment: 31,
    science: 50,
    cloning: "Legal",
    lswActivity: 88,
    lswRegulations: "Banned",
    vigilantism: "Regulated",
    leaderGender: "Male",
    cultureCode: 4,
    cultureGroup: 'A'
  }`;

tsContent = tsContent.replace(match[0], correctedNigeria);

fs.writeFileSync(tsPath, tsContent, 'utf-8');
console.log('✅ Fixed Nigeria');
