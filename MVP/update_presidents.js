// Script to add fictional president names to countries with empty president fields
// Run with: node update_presidents.js

const fs = require('fs');
const path = require('path');

// Map of country names to culturally appropriate fictional leader names
const presidentNames = {
  "Afghanistan": "Ahmad Khan Zadran",
  "Algeria": "Karim Benali",
  "Argentina": "Sebastián Márquez",
  "Armenia": "Armen Petrosyan",
  "Australia": "Graham Mitchell",
  "Azerbaijan": "Rashid Aliyev",
  "Bahrain": "Khalid Al-Mansoor",
  "Bangladesh": "Rashid Ahmed",
  "Belarus": "Viktor Lukashenko",
  "Belgium": "Philippe Dubois",
  "Benin": "Kofi Adjovi",
  "Bolivia": "Carlos Mamani",
  "Burkina Faso": "Ibrahim Ouédraogo",
  "Burundi": "Jean-Pierre Ndayisenga",
  "Cameroon": "Paul Biya Mfomo",
  "Chad": "Idriss Mahamat",
  "Chile": "Fernando Valdés",
  "Colombia": "Diego Restrepo",
  "Congo": "André Mbemba",
  "Costa Rica": "Rodrigo Vargas",
  "Cuba": "Miguel Hernández",
  "Czech Republic": "Petr Novák",
  "Denmark": "Lars Jensen",
  "Djibouti": "Hassan Gouled",
  "Dominican Republic": "Rafael Santos",
  "Ecuador": "Andrés Moreno",
  "Egypt": "Hassan El-Sayed",
  "El Salvador": "Mauricio Flores",
  "Ethiopia": "Abebe Bekele",
  "France": "François Laurent",
  "Ghana": "Kwame Mensah",
  "Greece": "Dimitrios Papadopoulos",
  "Guinea": "Mamadou Diallo",
  "Honduras": "José Martínez",
  "Hong Kong": "Victor Wong",
  "Indonesia": "Bambang Santoso",
  "Iran": "Mohammad Ahmadi",
  "Iraq": "Ali Al-Hashimi",
  "Ireland": "Patrick O'Brien",
  "Israel": "David Cohen",
  "Ivory Coast": "Laurent Kouassi",
  "Jamaica": "Marcus Campbell",
  "Japan": "Takeshi Yamamoto",
  "Jordan": "Abdullah Al-Rashid",
  "Kazakhstan": "Nursultan Aitbayev",
  "Kenya": "Daniel Kimani",
  "Kuwait": "Fahad Al-Sabah",
  "Lebanon": "Rashid Hariri",
  "Liberia": "Joseph Taylor",
  "Libya": "Omar Al-Mansuri",
  "Malaysia": "Ahmad Ibrahim",
  "Mongolia": "Bataar Erdene",
  "Morocco": "Youssef Benkirane",
  "Mozambique": "António Machel",
  "Niger": "Issoufou Mahamadou",
  "North Korea": "Kim Jong-min",
  "Pakistan": "Imran Shah",
  "Peru": "Luis Vargas",
  "Philippines": "Ramon Santos",
  "Poland": "Andrzej Kowalski",
  "Portugal": "António Silva",
  "Puerto Rico": "Carlos Rivera",
  "Qatar": "Hamad Al-Thani",
  "Republic of the Congo": "Denis Sassou",
  "Romania": "Ion Popescu",
  "Rwanda": "Paul Kagame Nkurunziza",
  "Saudi Arabia": "Mohammed bin Faisal",
  "Senegal": "Abdoulaye Sall",
  "Sierra Leone": "Ernest Koroma",
  "Singapore": "Lee Wei Ming",
  "Somalia": "Hassan Sheikh Omar",
  "South Africa": "Thabo Mandela",
  "South Korea": "Park Min-jun",
  "Spain": "Miguel García",
  "Sri Lanka": "Mahinda Rajapaksa",
  "Sudan": "Ibrahim Al-Mahdi",
  "Sweden": "Erik Andersson",
  "Switzerland": "Hans Müller",
  "Syria": "Bashar Al-Assad",
  "Taiwan": "Chen Wei-ting",
  "Tajikistan": "Emomali Rahmonov",
  "Tanzania": "John Magufuli",
  "Thailand": "Prayut Shinawatra",
  "Tunisia": "Mohamed Essebsi",
  "Turkey": "Recep Yilmaz",
  "Ukraine": "Volodymyr Kovalenko",
  "United Arab Emirates": "Sheikh Mohammed Al-Maktoum",
  "United States": "Robert Harrison",
  "Uzbekistan": "Shavkat Karimov",
  "Venezuela": "Nicolás Chávez",
  "Vietnam": "Nguyen Van Minh",
  "Western Sahara": "Mohamed Abdelaziz",
  "Yemen": "Ali Saleh"
};

const filePath = path.join(__dirname, 'src', 'data', 'allCountries.ts');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// For each country, replace the empty president field
for (const [country, president] of Object.entries(presidentNames)) {
  // Create a regex to find the country block and replace empty president
  // This looks for: name: "CountryName", ... president: "",
  const regex = new RegExp(
    `(name: "${country}",[\\s\\S]*?president: )"",`,
    'g'
  );

  const replacement = `$1"${president}",`;
  content = content.replace(regex, replacement);
}

// Write the updated content back
fs.writeFileSync(filePath, content, 'utf8');

console.log('Successfully updated president names for 93 countries!');
console.log('\nSample updates:');
Object.entries(presidentNames).slice(0, 10).forEach(([country, president]) => {
  console.log(`  ${country}: ${president}`);
});
console.log(`  ... and ${Object.keys(presidentNames).length - 10} more`);
