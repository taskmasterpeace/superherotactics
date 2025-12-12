const fs = require('fs');

// Read the file
const content = fs.readFileSync('c:/git/sht/MVP/src/data/allCountries.ts', 'utf8');

// Find all country objects
const countryMatches = content.match(/{\s*id:[\s\S]*?cultureGroup:[\s\S]*?}/g);

console.log(`Found ${countryMatches ? countryMatches.length : 0} country objects\n`);

let emptyPresidents = 0;
let emptyLeaderGender = 0;
const emptyPresidentList = [];

if (countryMatches) {
  countryMatches.forEach(block => {
    const nameMatch = block.match(/name:\s*"([^"]+)"/);
    const presidentMatch = block.match(/president:\s*"([^"]*)"/);
    const cultureMatch = block.match(/cultureCode:\s*(\d+)/);
    const codeMatch = block.match(/code:\s*"([^"]+)"/);
    const leaderGenderMatch = block.match(/leaderGender:\s*"([^"]*)"/);

    if (nameMatch && presidentMatch && cultureMatch) {
      const name = nameMatch[1];
      const president = presidentMatch[1];
      const cultureCode = parseInt(cultureMatch[1]);
      const code = codeMatch ? codeMatch[1] : '??';
      const leaderGender = leaderGenderMatch ? leaderGenderMatch[1] : '';

      if (president === '') {
        emptyPresidents++;
        emptyPresidentList.push({ name, code, cultureCode, leaderGender });
      }

      if (leaderGender === '') {
        emptyLeaderGender++;
      }
    }
  });
}

console.log(`Countries with empty president field: ${emptyPresidents}`);
console.log(`Countries with empty leaderGender field: ${emptyLeaderGender}\n`);

if (emptyPresidentList.length > 0) {
  console.log('\nCountries needing presidents:\n');

  // Group by culture
  const byCulture = {};
  emptyPresidentList.forEach(c => {
    if (!byCulture[c.cultureCode]) byCulture[c.cultureCode] = [];
    byCulture[c.cultureCode].push(c);
  });

  Object.keys(byCulture).sort((a,b) => a-b).forEach(culture => {
    console.log(`\nCulture ${culture}: ${byCulture[culture].length} countries`);
    byCulture[culture].forEach(c => {
      console.log(`  - ${c.name} (${c.code})`);
    });
  });

  // Write to file
  fs.writeFileSync('c:/git/sht/empty_presidents_list.json', JSON.stringify(emptyPresidentList, null, 2));
  console.log('\n\nWrote list to empty_presidents_list.json');
}
