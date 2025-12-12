/**
 * Rebuild ALL countries into ONE TypeScript file
 * Run with: node scripts/rebuild-all-countries.js
 */

const fs = require('fs');
const path = require('path');

// ISO 3166-1 alpha-2 country codes mapping - ALL countries
const ISO_CODES = {
  'Slovenia': 'SI', 'Norway': 'NO', 'Austria': 'AT', 'New Zealand': 'NZ',
  'Iceland': 'IS', 'Finland': 'FI', 'Denmark': 'DK', 'Czech Republic': 'CZ',
  'Hong Kong': 'HK', 'Netherlands': 'NL', 'United Kingdom': 'GB', 'Taiwan': 'TW',
  'Switzerland': 'CH', 'Sweden': 'SE', 'Spain': 'ES', 'South Korea': 'KR',
  'Singapore': 'SG', 'Japan': 'JP', 'Israel': 'IL', 'Ireland': 'IE',
  'Germany': 'DE', 'France': 'FR', 'Canada': 'CA', 'Belgium': 'BE',
  'Australia': 'AU', 'Estonia': 'EE', 'United Arab Emirates': 'AE', 'Italy': 'IT',
  'Lithuania': 'LT', 'Greece': 'GR', 'Poland': 'PL', 'Andorra': 'AD',
  'Slovakia': 'SK', 'Latvia': 'LV', 'Portugal': 'PT', 'Hungary': 'HU',
  'Chile': 'CL', 'Saudi Arabia': 'SA', 'Bahrain': 'BH', 'Croatia': 'HR',
  'Qatar': 'QA', 'Brunei': 'BN', 'Argentina': 'AR', 'Montenegro': 'ME',
  'Kazakhstan': 'KZ', 'Romania': 'RO', 'Turkey': 'TR', 'Russia': 'RU',
  'Belarus': 'BY', 'Uruguay': 'UY', 'The Bahamas': 'BS', 'Bulgaria': 'BG',
  'Panama': 'PA', 'Oman': 'OM', 'Georgia': 'GE', 'Costa Rica': 'CR',
  'Malaysia': 'MY', 'Serbia': 'RS', 'Kuwait': 'KW', 'Albania': 'AL',
  'Trinidad and Tobago': 'TT', 'Bosnia and Herzegovina': 'BA', 'Cuba': 'CU',
  'United States': 'US', 'Sri Lanka': 'LK', 'Iran': 'IR', 'North Macedonia': 'MK',
  'Ukraine': 'UA', 'Thailand': 'TH', 'Peru': 'PE', 'Mexico': 'MX',
  'China': 'CN', 'Colombia': 'CO', 'Brazil': 'BR', 'Armenia': 'AM',
  'Moldova': 'MD', 'Ecuador': 'EC', 'Dominican Republic': 'DO', 'Azerbaijan': 'AZ',
  'Fiji': 'FJ', 'Tunisia': 'TN', 'Lebanon': 'LB', 'Algeria': 'DZ',
  'Suriname': 'SR', 'Botswana': 'BW', 'Mongolia': 'MN', 'Jamaica': 'JM',
  'Paraguay': 'PY', 'Jordan': 'JO', 'Libya': 'LY', 'Puerto Rico': 'PR',
  'Uzbekistan': 'UZ', 'Belize': 'BZ', 'Venezuela': 'VE', 'South Africa': 'ZA',
  'Philippines': 'PH', 'Indonesia': 'ID', 'Palestine': 'PS', 'Gabon': 'GA',
  'Vietnam': 'VN', 'Egypt': 'EG', 'Kyrgyzstan': 'KG', 'Guyana': 'GY',
  'Morocco': 'MA', 'El Salvador': 'SV', 'Iraq': 'IQ', 'Nicaragua': 'NI',
  'Guatemala': 'GT', 'Tajikistan': 'TJ', 'India': 'IN', 'Namibia': 'NA',
  'Honduras': 'HN', 'Bangladesh': 'BD', 'São Tomé and Príncipe': 'ST',
  'Eswatini': 'SZ', 'Laos': 'LA', 'Ghana': 'GH', 'Monaco': 'MC',
  'Nepal': 'NP', 'Equatorial Guinea': 'GQ', 'Cambodia': 'KH', 'Myanmar': 'MM',
  'Zambia': 'ZM', 'Kenya': 'KE', 'Republic of the Congo': 'CG',
  'Zimbabwe': 'ZW', 'Angola': 'AO', 'Solomon Islands': 'SB', 'Cameroon': 'CM',
  'Syria': 'SY', 'Papua New Guinea': 'PG', 'Pakistan': 'PK', 'Uganda': 'UG',
  'Mauritania': 'MR', 'Rwanda': 'RW', 'Benin': 'BJ', 'Nigeria': 'NG',
  'Ivory Coast': 'CI', 'Madagascar': 'MG', 'Djibouti': 'DJ', 'Tanzania': 'TZ',
  'Togo': 'TG', 'Haiti': 'HT', 'Sudan': 'SD', 'Senegal': 'SN',
  'Afghanistan': 'AF', 'Malawi': 'MW', 'Guinea-Bissau': 'GW', 'Liberia': 'LR',
  'Ethiopia': 'ET', 'Congo': 'CD', 'Guinea': 'GN', 'Yemen': 'YE',
  'Eritrea': 'ER', 'Burkina Faso': 'BF', 'Sierra Leone': 'SL', 'Mozambique': 'MZ',
  'Western Sahara': 'EH', 'South Sudan': 'SS', 'Mali': 'ML', 'Burundi': 'BI',
  'Central African Republic': 'CF', 'Chad': 'TD', 'Niger': 'NE', 'Somalia': 'SO',
  'Turkmenistan': 'TM', 'North Korea': 'KP', 'Bolivia': 'BO'
};

// Culture code mapping
function getCultureCode(countryName) {
  const northAfrica = ['Algeria', 'Egypt', 'Libya', 'Morocco', 'Tunisia', 'Western Sahara'];
  const centralAfrica = ['Angola', 'Cameroon', 'Central African Republic', 'Chad', 'Congo',
    'Republic of the Congo', 'Equatorial Guinea', 'Gabon', 'São Tomé and Príncipe'];
  const southernAfrica = ['Botswana', 'Eswatini', 'Lesotho', 'Malawi', 'Mozambique', 'Namibia',
    'South Africa', 'Zambia', 'Zimbabwe', 'Madagascar'];
  const westAfrica = ['Benin', 'Burkina Faso', 'Ghana', 'Guinea', 'Guinea-Bissau', 'Ivory Coast',
    'Liberia', 'Mali', 'Mauritania', 'Niger', 'Nigeria', 'Senegal', 'Sierra Leone', 'Togo'];
  const eastAfrica = ['Burundi', 'Djibouti', 'Eritrea', 'Ethiopia', 'Kenya', 'Rwanda',
    'Somalia', 'South Sudan', 'Sudan', 'Tanzania', 'Uganda'];
  const centralAsia = ['Kazakhstan', 'Kyrgyzstan', 'Tajikistan', 'Turkmenistan', 'Uzbekistan'];
  const southAsia = ['Afghanistan', 'Bangladesh', 'India', 'Nepal', 'Pakistan', 'Sri Lanka'];
  const eastAsia = ['Cambodia', 'China', 'Hong Kong', 'Japan', 'Laos', 'Mongolia', 'Myanmar',
    'North Korea', 'Philippines', 'Singapore', 'South Korea', 'Taiwan', 'Thailand', 'Vietnam'];
  const middleEast = ['Bahrain', 'Iran', 'Iraq', 'Israel', 'Jordan', 'Kuwait', 'Lebanon',
    'Oman', 'Palestine', 'Qatar', 'Saudi Arabia', 'Syria', 'Turkey', 'United Arab Emirates', 'Yemen'];
  const caribbean = ['The Bahamas', 'Cuba', 'Dominican Republic', 'Haiti', 'Jamaica',
    'Puerto Rico', 'Trinidad and Tobago'];
  const centralAmerica = ['Belize', 'Costa Rica', 'El Salvador', 'Guatemala', 'Honduras',
    'Nicaragua', 'Panama'];
  const southAmerica = ['Argentina', 'Bolivia', 'Brazil', 'Chile', 'Colombia', 'Ecuador',
    'Guyana', 'Paraguay', 'Peru', 'Suriname', 'Uruguay', 'Venezuela'];
  const northAmerica = ['Canada', 'Mexico', 'United States'];
  const westEurope = ['Andorra', 'Austria', 'Belgium', 'Denmark', 'Finland', 'France',
    'Germany', 'Iceland', 'Ireland', 'Italy', 'Monaco', 'Netherlands', 'Norway', 'Portugal',
    'Spain', 'Sweden', 'Switzerland', 'United Kingdom'];
  const eastEurope = ['Albania', 'Armenia', 'Azerbaijan', 'Belarus', 'Bosnia and Herzegovina',
    'Bulgaria', 'Croatia', 'Czech Republic', 'Estonia', 'Georgia', 'Greece', 'Hungary',
    'Latvia', 'Lithuania', 'Moldova', 'Montenegro', 'North Macedonia', 'Poland', 'Romania',
    'Russia', 'Serbia', 'Slovakia', 'Slovenia', 'Ukraine'];
  const oceania = ['Australia', 'Fiji', 'New Zealand', 'Papua New Guinea', 'Solomon Islands'];
  const indonesia = ['Brunei', 'Indonesia', 'Malaysia'];

  if (northAfrica.includes(countryName)) return { code: 1, group: 'F' };
  if (centralAfrica.includes(countryName)) return { code: 2, group: 'A' };
  if (southernAfrica.includes(countryName)) return { code: 3, group: 'F' };
  if (westAfrica.includes(countryName)) return { code: 2, group: 'A' };
  if (eastAfrica.includes(countryName)) return { code: 2, group: 'A' };
  if (centralAsia.includes(countryName)) return { code: 4, group: 'B' };
  if (southAsia.includes(countryName)) return { code: 5, group: 'B' };
  if (eastAsia.includes(countryName)) return { code: 6, group: 'B' };
  if (indonesia.includes(countryName)) return { code: 6, group: 'B' };
  if (middleEast.includes(countryName)) return { code: 14, group: 'D' };
  if (caribbean.includes(countryName)) return { code: 7, group: 'C' };
  if (centralAmerica.includes(countryName)) return { code: 8, group: 'C' };
  if (southAmerica.includes(countryName)) return { code: 12, group: 'C' };
  if (northAmerica.includes(countryName)) return { code: 13, group: 'D' };
  if (westEurope.includes(countryName)) return { code: 9, group: 'E' };
  if (eastEurope.includes(countryName)) return { code: 10, group: 'E' };
  if (oceania.includes(countryName)) return { code: 11, group: 'E' };

  return { code: 9, group: 'E' };
}

// Parse CSV
const csvPath = path.join(__dirname, '..', '..', 'SuperHero Tactics', 'SuperHero Tactics World Bible - Country.csv');
const csv = fs.readFileSync(csvPath, 'utf-8');
const lines = csv.split('\n');
const dataLines = lines.slice(2).filter(line => line.trim().length > 0);

const countries = [];

for (const line of dataLines) {
  const parts = line.split(',');
  const id = parseInt(parts[0], 10);
  const name = parts[1]?.trim();
  const president = parts[2]?.trim() || '';

  if (!id || !name) continue;

  const isoCode = ISO_CODES[name];
  if (!isoCode) {
    console.log(`WARNING: No ISO code for: ${name} (id: ${id})`);
    continue;
  }

  const culture = getCultureCode(name);
  const population = parseInt(parts[4], 10) || 0;
  const populationRating = parseInt(parts[5], 10) || 30;
  const motto = parts[6]?.trim() || 'None';
  const nationality = parts[7]?.trim() || '';
  const governmentType = parts[8]?.trim() || 'Republic';
  const governmentPerception = parts[9]?.trim() || 'Flawed Democracy';
  const governmentCorruption = parseInt(parts[10], 10) || 50;
  const presidentialTerm = parseInt(parts[11], 10) || 5;
  const leaderTitle = parts[12]?.trim() || 'President';
  const militaryServices = parseInt(parts[13], 10) || 30;
  const militaryBudget = parseInt(parts[14], 10) || 30;
  const intelligenceServices = parseInt(parts[15], 10) || 20;
  const intelligenceBudget = parseInt(parts[16], 10) || 30;
  const capitalPunishment = parts[17]?.trim() || 'Inactive';
  const mediaFreedom = parseInt(parts[18], 10) || 50;
  const lawEnforcement = parseInt(parts[19], 10) || 50;
  const lawEnforcementBudget = parseInt(parts[20], 10) || 50;
  const gdpNational = parseInt(parts[21], 10) || 50;
  const gdpPerCapita = parseInt(parts[22], 10) || 50;
  const healthcare = parseInt(parts[23], 10) || 50;
  const higherEducation = parseInt(parts[24], 10) || 50;
  const socialDevelopment = parseInt(parts[25], 10) || 50;
  const lifestyle = parseInt(parts[26], 10) || 50;
  const terrorismActivity = parts[27]?.trim() || '0';
  const cyberCapabilities = parseInt(parts[28], 10) || 50;
  const digitalDevelopment = parseInt(parts[29], 10) || 50;
  const science = parseInt(parts[30], 10) || 50;
  const cloning = parts[31]?.trim() || 'Banned';
  const lswActivity = parseInt(parts[32], 10) || 30;
  const lswRegulations = parts[33]?.trim() || 'Regulated';
  const vigilantism = parts[34]?.trim() || 'Regulated';
  const leaderGender = parts[35]?.trim() || '';

  // Invert corruption: CSV has high = good, we want high = bad
  const invertedCorruption = 100 - governmentCorruption;

  countries.push({
    id, code: isoCode, name, president, population, populationRating, motto, nationality,
    governmentType, governmentPerception, governmentCorruption: invertedCorruption,
    presidentialTerm, leaderTitle, militaryServices, militaryBudget,
    intelligenceServices, intelligenceBudget, capitalPunishment, mediaFreedom,
    lawEnforcement, lawEnforcementBudget, gdpNational, gdpPerCapita,
    healthcare, higherEducation, socialDevelopment, lifestyle,
    terrorismActivity, cyberCapabilities, digitalDevelopment, science,
    cloning, lswActivity, lswRegulations, vigilantism, leaderGender,
    cultureCode: culture.code, cultureGroup: culture.group
  });
}

console.log(`Parsed ${countries.length} countries`);
countries.sort((a, b) => a.id - b.id);

// Generate ONE file with ALL countries
const output = `/**
 * Complete Country Database - ALL 168 Countries
 * Auto-generated from SuperHero Tactics World Bible CSV
 * Government corruption: Higher = MORE corrupt (inverted from CSV)
 */

export interface Country {
  id: number;
  code: string;           // 2-letter ISO code
  name: string;
  president: string;
  population: number;
  populationRating: number;
  motto: string;
  nationality: string;
  governmentType: string;
  governmentPerception: string;
  governmentCorruption: number;  // 0-100, higher = more corrupt
  presidentialTerm: number;
  leaderTitle: string;
  militaryServices: number;
  militaryBudget: number;
  intelligenceServices: number;
  intelligenceBudget: number;
  capitalPunishment: string;
  mediaFreedom: number;
  lawEnforcement: number;
  lawEnforcementBudget: number;
  gdpNational: number;
  gdpPerCapita: number;
  healthcare: number;
  higherEducation: number;
  socialDevelopment: number;
  lifestyle: number;
  terrorismActivity: string;
  cyberCapabilities: number;
  digitalDevelopment: number;
  science: number;
  cloning: string;
  lswActivity: number;
  lswRegulations: string;
  vigilantism: string;
  leaderGender: string;
  cultureCode: number;
  cultureGroup: string;
}

export const ALL_COUNTRIES: Country[] = [
${countries.map(c => `  {
    id: ${c.id},
    code: "${c.code}",
    name: "${c.name.replace(/"/g, '\\"')}",
    president: "${c.president.replace(/"/g, '\\"')}",
    population: ${c.population},
    populationRating: ${c.populationRating},
    motto: "${c.motto.replace(/"/g, '\\"')}",
    nationality: "${c.nationality.replace(/"/g, '\\"')}",
    governmentType: "${c.governmentType.replace(/"/g, '\\"')}",
    governmentPerception: "${c.governmentPerception.replace(/"/g, '\\"')}",
    governmentCorruption: ${c.governmentCorruption},
    presidentialTerm: ${c.presidentialTerm},
    leaderTitle: "${c.leaderTitle.replace(/"/g, '\\"')}",
    militaryServices: ${c.militaryServices},
    militaryBudget: ${c.militaryBudget},
    intelligenceServices: ${c.intelligenceServices},
    intelligenceBudget: ${c.intelligenceBudget},
    capitalPunishment: "${c.capitalPunishment}",
    mediaFreedom: ${c.mediaFreedom},
    lawEnforcement: ${c.lawEnforcement},
    lawEnforcementBudget: ${c.lawEnforcementBudget},
    gdpNational: ${c.gdpNational},
    gdpPerCapita: ${c.gdpPerCapita},
    healthcare: ${c.healthcare},
    higherEducation: ${c.higherEducation},
    socialDevelopment: ${c.socialDevelopment},
    lifestyle: ${c.lifestyle},
    terrorismActivity: "${c.terrorismActivity}",
    cyberCapabilities: ${c.cyberCapabilities},
    digitalDevelopment: ${c.digitalDevelopment},
    science: ${c.science},
    cloning: "${c.cloning}",
    lswActivity: ${c.lswActivity},
    lswRegulations: "${c.lswRegulations}",
    vigilantism: "${c.vigilantism}",
    leaderGender: "${c.leaderGender}",
    cultureCode: ${c.cultureCode},
    cultureGroup: '${c.cultureGroup}'
  }`).join(',\n')}
];

// Helper functions
export function getCountryById(id: number): Country | undefined {
  return ALL_COUNTRIES.find(c => c.id === id);
}

export function getCountryByCode(code: string): Country | undefined {
  return ALL_COUNTRIES.find(c => c.code.toUpperCase() === code.toUpperCase());
}

export function getCountryByName(name: string): Country | undefined {
  return ALL_COUNTRIES.find(c => c.name.toLowerCase() === name.toLowerCase());
}

export function searchCountries(query: string): Country[] {
  const lowerQuery = query.toLowerCase();
  return ALL_COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(lowerQuery) ||
    c.nationality.toLowerCase().includes(lowerQuery) ||
    c.code.toLowerCase().includes(lowerQuery)
  );
}

// Get faction alignment
export function getFactionAlignment(country: Country): 'US' | 'China' | 'India' | 'Nigeria' | 'Neutral' {
  if (['US', 'CA', 'GB', 'AU', 'NZ'].includes(country.code)) return 'US';
  if (['CN', 'KP', 'RU'].includes(country.code)) return 'China';
  if (['IN', 'BD', 'PK', 'NP', 'LK'].includes(country.code)) return 'India';
  if (['NG', 'ZA', 'EG', 'ET', 'GH', 'AO', 'DZ', 'KE'].includes(country.code)) return 'Nigeria';
  return 'Neutral';
}

// Export count
export const COUNTRY_COUNT = ALL_COUNTRIES.length;
`;

fs.writeFileSync(
  path.join(__dirname, '..', 'src', 'data', 'allCountries.ts'),
  output
);

console.log(`\\nGenerated allCountries.ts with ${countries.length} countries`);

// List missing ISO codes
const missingNames = [];
for (const line of dataLines) {
  const parts = line.split(',');
  const name = parts[1]?.trim();
  if (name && !ISO_CODES[name]) {
    missingNames.push(name);
  }
}
if (missingNames.length > 0) {
  console.log('\\nMissing ISO codes for:');
  missingNames.forEach(n => console.log(`  - ${n}`));
}
