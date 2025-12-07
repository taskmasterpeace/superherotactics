// World Data - Countries and Cities from SHT World Bible

export interface Country {
  id: string;
  code: number;
  name: string;
  flag: string;
  nationality: string;
  population: number;
  populationRating: number;
  motto: string;
  governmentType: string;
  governmentPerception: string;
  corruption: number;
  leaderTitle: string;
  leader?: string;
  militaryBudget: number;
  intelligenceBudget: number;
  mediaFreedom: number;
  healthcare: number;
  higherEducation: number;
  science: number;
  lswActivity: number;
  lswRegulations: string;
  vigilantism: string;
  cloning: number;
  terrorismActivity: string;
  cyberCapabilities: number;
}

export interface City {
  sector: string;
  countryCode: number;
  cultureCode: number;
  name: string;
  country: string;
  population: number;
  populationRating: number;
  populationType: string;
  cityTypes: string[];
  crimeIndex: number;
  safetyIndex: number;
}

// Country flags based on ISO codes
const FLAGS: Record<string, string> = {
  'Afghanistan': '🇦🇫', 'Albania': '🇦🇱', 'Algeria': '🇩🇿', 'Andorra': '🇦🇩', 'Angola': '🇦🇴',
  'Argentina': '🇦🇷', 'Armenia': '🇦🇲', 'Australia': '🇦🇺', 'Austria': '🇦🇹', 'Azerbaijan': '🇦🇿',
  'Bahrain': '🇧🇭', 'Bangladesh': '🇧🇩', 'Belarus': '🇧🇾', 'Belgium': '🇧🇪', 'Belize': '🇧🇿',
  'Benin': '🇧🇯', 'Bolivia': '🇧🇴', 'Bosnia and Herzegovina': '🇧🇦', 'Botswana': '🇧🇼', 'Brazil': '🇧🇷',
  'Brunei': '🇧🇳', 'Bulgaria': '🇧🇬', 'Burkina Faso': '🇧🇫', 'Burundi': '🇧🇮', 'Cambodia': '🇰🇭',
  'Cameroon': '🇨🇲', 'Canada': '🇨🇦', 'Central African Republic': '🇨🇫', 'Chad': '🇹🇩', 'Chile': '🇨🇱',
  'China': '🇨🇳', 'Colombia': '🇨🇴', 'Congo': '🇨🇬', 'Costa Rica': '🇨🇷', 'Croatia': '🇭🇷',
  'Cuba': '🇨🇺', 'Czech Republic': '🇨🇿', 'Denmark': '🇩🇰', 'Djibouti': '🇩🇯', 'Dominican Republic': '🇩🇴',
  'Ecuador': '🇪🇨', 'Egypt': '🇪🇬', 'El Salvador': '🇸🇻', 'Equatorial Guinea': '🇬🇶', 'Eritrea': '🇪🇷',
  'Estonia': '🇪🇪', 'Eswatini': '🇸🇿', 'Ethiopia': '🇪🇹', 'Fiji': '🇫🇯', 'Finland': '🇫🇮',
  'France': '🇫🇷', 'Gabon': '🇬🇦', 'Georgia': '🇬🇪', 'Germany': '🇩🇪', 'Ghana': '🇬🇭',
  'Greece': '🇬🇷', 'Guatemala': '🇬🇹', 'Guinea': '🇬🇳', 'Guinea-Bissau': '🇬🇼', 'Guyana': '🇬🇾',
  'Haiti': '🇭🇹', 'Honduras': '🇭🇳', 'Hong Kong': '🇭🇰', 'Hungary': '🇭🇺', 'Iceland': '🇮🇸',
  'India': '🇮🇳', 'Indonesia': '🇮🇩', 'Iran': '🇮🇷', 'Iraq': '🇮🇶', 'Ireland': '🇮🇪',
  'Israel': '🇮🇱', 'Italy': '🇮🇹', 'Ivory Coast': '🇨🇮', 'Jamaica': '🇯🇲', 'Japan': '🇯🇵',
  'Jordan': '🇯🇴', 'Kazakhstan': '🇰🇿', 'Kenya': '🇰🇪', 'Kuwait': '🇰🇼', 'Kyrgyzstan': '🇰🇬',
  'Laos': '🇱🇦', 'Latvia': '🇱🇻', 'Lebanon': '🇱🇧', 'Liberia': '🇱🇷', 'Libya': '🇱🇾',
  'Lithuania': '🇱🇹', 'Madagascar': '🇲🇬', 'Malawi': '🇲🇼', 'Malaysia': '🇲🇾', 'Mali': '🇲🇱',
  'Mauritania': '🇲🇷', 'Mexico': '🇲🇽', 'Moldova': '🇲🇩', 'Monaco': '🇲🇨', 'Mongolia': '🇲🇳',
  'Montenegro': '🇲🇪', 'Morocco': '🇲🇦', 'Mozambique': '🇲🇿', 'Myanmar': '🇲🇲', 'Namibia': '🇳🇦',
  'Nepal': '🇳🇵', 'Netherlands': '🇳🇱', 'New Zealand': '🇳🇿', 'Nicaragua': '🇳🇮', 'Niger': '🇳🇪',
  'Nigeria': '🇳🇬', 'North Korea': '🇰🇵', 'North Macedonia': '🇲🇰', 'Norway': '🇳🇴', 'Oman': '🇴🇲',
  'Pakistan': '🇵🇰', 'Palestine': '🇵🇸', 'Panama': '🇵🇦', 'Papua New Guinea': '🇵🇬', 'Paraguay': '🇵🇾',
  'Peru': '🇵🇪', 'Philippines': '🇵🇭', 'Poland': '🇵🇱', 'Portugal': '🇵🇹', 'Puerto Rico': '🇵🇷',
  'Qatar': '🇶🇦', 'Republic of the Congo': '🇨🇬', 'Romania': '🇷🇴', 'Russia': '🇷🇺', 'Rwanda': '🇷🇼',
  'São Tomé and Príncipe': '🇸🇹', 'Saudi Arabia': '🇸🇦', 'Senegal': '🇸🇳', 'Serbia': '🇷🇸',
  'Sierra Leone': '🇸🇱', 'Singapore': '🇸🇬', 'Slovakia': '🇸🇰', 'Slovenia': '🇸🇮', 'Solomon Islands': '🇸🇧',
  'Somalia': '🇸🇴', 'South Africa': '🇿🇦', 'South Korea': '🇰🇷', 'South Sudan': '🇸🇸', 'Spain': '🇪🇸',
  'Sri Lanka': '🇱🇰', 'Sudan': '🇸🇩', 'Suriname': '🇸🇷', 'Sweden': '🇸🇪', 'Switzerland': '🇨🇭',
  'Syria': '🇸🇾', 'Taiwan': '🇹🇼', 'Tajikistan': '🇹🇯', 'Tanzania': '🇹🇿', 'Thailand': '🇹🇭',
  'The Bahamas': '🇧🇸', 'Togo': '🇹🇬', 'Trinidad and Tobago': '🇹🇹', 'Tunisia': '🇹🇳', 'Turkey': '🇹🇷',
  'Turkmenistan': '🇹🇲', 'Uganda': '🇺🇬', 'Ukraine': '🇺🇦', 'United Arab Emirates': '🇦🇪',
  'United Kingdom': '🇬🇧', 'United States': '🇺🇸', 'Uruguay': '🇺🇾', 'Uzbekistan': '🇺🇿',
  'Venezuela': '🇻🇪', 'Vietnam': '🇻🇳', 'Western Sahara': '🇪🇭', 'Yemen': '🇾🇪', 'Zambia': '🇿🇲',
  'Zimbabwe': '🇿🇼'
};

// All countries from World Bible
export const COUNTRIES: Country[] = [
  { id: 'AF', code: 96, name: 'Afghanistan', flag: '🇦🇫', nationality: 'Afghan', population: 38928345, populationRating: 53, motto: 'He is the messenger of God', governmentType: 'Republic', governmentPerception: 'Authoritarian Regime', corruption: 20, leaderTitle: 'President', militaryBudget: 35, intelligenceBudget: 32, mediaFreedom: 59, healthcare: 20, higherEducation: 41, science: 20, lswActivity: 53, lswRegulations: 'Banned', vigilantism: 'Banned', cloning: 0, terrorismActivity: 'Active', cyberCapabilities: 20 },
  { id: 'AL', code: 157, name: 'Albania', flag: '🇦🇱', nationality: 'Albanian', population: 2877247, populationRating: 33, motto: 'You, Albania, give me honour', governmentType: 'Parliamentary democracy', governmentPerception: 'Flawed Democracy', corruption: 35, leaderTitle: 'President', militaryBudget: 35, intelligenceBudget: 31, mediaFreedom: 69, healthcare: 70, higherEducation: 74, science: 48, lswActivity: 31, lswRegulations: 'Regulated', vigilantism: 'Regulated', cloning: 0, terrorismActivity: 'Inactive', cyberCapabilities: 43 },
  { id: 'DZ', code: 2, name: 'Algeria', flag: '🇩🇿', nationality: 'Algerian', population: 43851032, populationRating: 54, motto: 'By the people and for the people', governmentType: 'Republic', governmentPerception: 'Authoritarian Regime', corruption: 34, leaderTitle: 'President', militaryBudget: 56, intelligenceBudget: 56, mediaFreedom: 52, healthcare: 58, higherEducation: 67, science: 41, lswActivity: 56, lswRegulations: 'Regulated', vigilantism: 'Regulated', cloning: 0, terrorismActivity: 'Rare', cyberCapabilities: 42 },
  { id: 'AD', code: 165, name: 'Andorra', flag: '🇦🇩', nationality: 'Andorran', population: 77284, populationRating: 20, motto: 'Strength united is stronger', governmentType: 'Parliamentary democracy', governmentPerception: 'Full Democracy', corruption: 29, leaderTitle: 'Co-Princes', leader: 'Albert Zamora', militaryBudget: 28, intelligenceBudget: 27, mediaFreedom: 76, healthcare: 65, higherEducation: 71, science: 35, lswActivity: 28, lswRegulations: 'Regulated', vigilantism: 'Regulated', cloning: 0, terrorismActivity: 'Inactive', cyberCapabilities: 20 },
  { id: 'AO', code: 3, name: 'Angola', flag: '🇦🇴', nationality: 'Angolan', population: 32864556, populationRating: 52, motto: 'Each endeavouring, all achieving', governmentType: 'Republic', governmentPerception: 'Authoritarian Regime', corruption: 32, leaderTitle: 'President', leader: 'Rafael Mendonça', militaryBudget: 45, intelligenceBudget: 34, mediaFreedom: 65, healthcare: 30, higherEducation: 47, science: 25, lswActivity: 48, lswRegulations: 'Legal', vigilantism: 'Regulated', cloning: 0, terrorismActivity: 'Inactive', cyberCapabilities: 22 },
  { id: 'AR', code: 4, name: 'Argentina', flag: '🇦🇷', nationality: 'Argentinean', population: 45195564, populationRating: 54, motto: 'In Union and Liberty', governmentType: 'Republic', governmentPerception: 'Flawed Democracy', corruption: 41, leaderTitle: 'President', militaryBudget: 53, intelligenceBudget: 39, mediaFreedom: 71, healthcare: 70, higherEducation: 65, science: 27, lswActivity: 24, lswRegulations: 'Regulated', vigilantism: 'Banned', cloning: 0, terrorismActivity: 'Inactive', cyberCapabilities: 60 },
  { id: 'AM', code: 5, name: 'Armenia', flag: '🇦🇲', nationality: 'Armenian', population: 2963563, populationRating: 34, motto: 'One Nation, One Culture', governmentType: 'Republic', governmentPerception: 'Hybrid Regime', corruption: 50, leaderTitle: 'President', militaryBudget: 36, intelligenceBudget: 31, mediaFreedom: 71, healthcare: 75, higherEducation: 83, science: 23, lswActivity: 41, lswRegulations: 'Regulated', vigilantism: 'Regulated', cloning: 0, terrorismActivity: 'Inactive', cyberCapabilities: 55 },
  { id: 'AU', code: 6, name: 'Australia', flag: '🇦🇺', nationality: 'Aussie', population: 25499884, populationRating: 51, motto: 'Advance Australia', governmentType: 'Parliamentary democracy', governmentPerception: 'Full Democracy', corruption: 78, leaderTitle: 'Governor-General', militaryBudget: 69, intelligenceBudget: 56, mediaFreedom: 80, healthcare: 90, higherEducation: 90, science: 72, lswActivity: 41, lswRegulations: 'Regulated', vigilantism: 'Regulated', cloning: 0, terrorismActivity: 'Inactive', cyberCapabilities: 78 },
  { id: 'AT', code: 159, name: 'Austria', flag: '🇦🇹', nationality: 'Austrian', population: 9006458, populationRating: 44, motto: 'None', governmentType: 'Federal Republic', governmentPerception: 'Full Democracy', corruption: 75, leaderTitle: 'President', leader: 'Catherine Maurer', militaryBudget: 52, intelligenceBudget: 40, mediaFreedom: 83, healthcare: 85, higherEducation: 86, science: 77, lswActivity: 24, lswRegulations: 'Regulated', vigilantism: 'Regulated', cloning: 66, terrorismActivity: 'Inactive', cyberCapabilities: 77 },
  { id: 'BD', code: 10, name: 'Bangladesh', flag: '🇧🇩', nationality: 'Bangladeshi', population: 164689383, populationRating: 70, motto: 'Victory to Bengal', governmentType: 'Parliamentary democracy', governmentPerception: 'Hybrid Regime', corruption: 26, leaderTitle: 'President', militaryBudget: 52, intelligenceBudget: 48, mediaFreedom: 48, healthcare: 50, higherEducation: 52, science: 39, lswActivity: 78, lswRegulations: 'Regulated', vigilantism: 'Banned', cloning: 0, terrorismActivity: 'Active', cyberCapabilities: 33 },
  { id: 'BR', code: 15, name: 'Brazil', flag: '🇧🇷', nationality: 'Brazilian', population: 212559417, populationRating: 75, motto: 'Order and progress', governmentType: 'Federal Republic', governmentPerception: 'Flawed Democracy', corruption: 36, leaderTitle: 'President', leader: 'Mattheus De Souza', militaryBudget: 75, intelligenceBudget: 49, mediaFreedom: 63, healthcare: 75, higherEducation: 67, science: 71, lswActivity: 81, lswRegulations: 'Regulated', vigilantism: 'Banned', cloning: 0, terrorismActivity: 'Rare', cyberCapabilities: 58 },
  { id: 'CA', code: 16, name: 'Canada', flag: '🇨🇦', nationality: 'Canadian', population: 37742154, populationRating: 52, motto: 'From sea to sea', governmentType: 'Constitutional Monarchy', governmentPerception: 'Full Democracy', corruption: 76, leaderTitle: 'Governor General', leader: 'John Stone', militaryBudget: 63, intelligenceBudget: 56, mediaFreedom: 84, healthcare: 90, higherEducation: 89, science: 74, lswActivity: 51, lswRegulations: 'Legal', vigilantism: 'Banned', cloning: 0, terrorismActivity: 'Inactive', cyberCapabilities: 77 },
  { id: 'CN', code: 33, name: 'China', flag: '🇨🇳', nationality: 'Chinese', population: 1439323776, populationRating: 90, motto: 'Serve The People!', governmentType: 'Communist state', governmentPerception: 'Authoritarian Regime', corruption: 77, leaderTitle: 'President', leader: 'Qiang Zhang', militaryBudget: 86, intelligenceBudget: 89, mediaFreedom: 21, healthcare: 75, higherEducation: 65, science: 81, lswActivity: 90, lswRegulations: 'Regulated', vigilantism: 'Banned', cloning: 20, terrorismActivity: 'Active', cyberCapabilities: 69 },
  { id: 'EG', code: 20, name: 'Egypt', flag: '🇪🇬', nationality: 'Egyptian', population: 102334404, populationRating: 69, motto: 'None', governmentType: 'Republic', governmentPerception: 'Authoritarian Regime', corruption: 35, leaderTitle: 'President', militaryBudget: 64, intelligenceBudget: 58, mediaFreedom: 35, healthcare: 59, higherEducation: 61, science: 59, lswActivity: 73, lswRegulations: 'Banned', vigilantism: 'Banned', cloning: 0, terrorismActivity: 'Active', cyberCapabilities: 46 },
  { id: 'FR', code: 22, name: 'France', flag: '🇫🇷', nationality: 'French', population: 65273511, populationRating: 57, motto: 'Liberty, equality, fraternity', governmentType: 'Republic', governmentPerception: 'Flawed Democracy', corruption: 68, leaderTitle: 'President', militaryBudget: 78, intelligenceBudget: 70, mediaFreedom: 77, healthcare: 80, higherEducation: 81, science: 77, lswActivity: 33, lswRegulations: 'Regulated', vigilantism: 'Banned', cloning: 0, terrorismActivity: 'Inactive', cyberCapabilities: 78 },
  { id: 'DE', code: 23, name: 'Germany', flag: '🇩🇪', nationality: 'German', population: 83783942, populationRating: 57, motto: 'Unity and justice and freedom', governmentType: 'Federal Republic', governmentPerception: 'Full Democracy', corruption: 81, leaderTitle: 'President', leader: 'Jurgen Worns', militaryBudget: 76, intelligenceBudget: 73, mediaFreedom: 84, healthcare: 90, higherEducation: 90, science: 75, lswActivity: 67, lswRegulations: 'Legal', vigilantism: 'Banned', cloning: 0, terrorismActivity: 'Inactive', cyberCapabilities: 82 },
  { id: 'GR', code: 93, name: 'Greece', flag: '🇬🇷', nationality: 'Greek', population: 10423054, populationRating: 46, motto: 'Freedom or Death', governmentType: 'Parliamentary Republic', governmentPerception: 'Flawed Democracy', corruption: 52, leaderTitle: 'President', militaryBudget: 54, intelligenceBudget: 47, mediaFreedom: 70, healthcare: 75, higherEducation: 84, science: 63, lswActivity: 75, lswRegulations: 'Legal', vigilantism: 'Legal', cloning: 0, terrorismActivity: 'Inactive', cyberCapabilities: 64 },
  { id: 'IN', code: 25, name: 'India', flag: '🇮🇳', nationality: 'Indian', population: 1380004385, populationRating: 89, motto: 'Truth alone triumphs', governmentType: 'Federal Republic', governmentPerception: 'Flawed Democracy', corruption: 42, leaderTitle: 'President', leader: 'Hamid Vinkat', militaryBudget: 80, intelligenceBudget: 80, mediaFreedom: 53, healthcare: 65, higherEducation: 55, science: 74, lswActivity: 90, lswRegulations: 'Regulated', vigilantism: 'Banned', cloning: 0, terrorismActivity: 'Active', cyberCapabilities: 40 },
  { id: 'ID', code: 26, name: 'Indonesia', flag: '🇮🇩', nationality: 'Indonesian', population: 273523615, populationRating: 78, motto: 'Unity in diversity', governmentType: 'Republic', governmentPerception: 'Flawed Democracy', corruption: 40, leaderTitle: 'President', militaryBudget: 69, intelligenceBudget: 55, mediaFreedom: 62, healthcare: 70, higherEducation: 65, science: 58, lswActivity: 84, lswRegulations: 'Regulated', vigilantism: 'Banned', cloning: 0, terrorismActivity: 'Active', cyberCapabilities: 46 },
  { id: 'IR', code: 27, name: 'Iran', flag: '🇮🇷', nationality: 'Iranian', population: 83992949, populationRating: 58, motto: 'God is the Greatest', governmentType: 'Theocratic Republic', governmentPerception: 'Authoritarian Regime', corruption: 26, leaderTitle: 'Supreme Leader', militaryBudget: 69, intelligenceBudget: 65, mediaFreedom: 32, healthcare: 59, higherEducation: 75, science: 70, lswActivity: 67, lswRegulations: 'Legal', vigilantism: 'Banned', cloning: 0, terrorismActivity: 'Active', cyberCapabilities: 51 },
  { id: 'IL', code: 30, name: 'Israel', flag: '🇮🇱', nationality: 'Israeli', population: 8655535, populationRating: 43, motto: 'If you will it, it is no dream', governmentType: 'Parliamentary democracy', governmentPerception: 'Flawed Democracy', corruption: 61, leaderTitle: 'President', militaryBudget: 61, intelligenceBudget: 54, mediaFreedom: 69, healthcare: 90, higherEducation: 88, science: 66, lswActivity: 24, lswRegulations: 'Legal', vigilantism: 'Banned', cloning: 0, terrorismActivity: 'Inactive', cyberCapabilities: 75 },
  { id: 'IT', code: 31, name: 'Italy', flag: '🇮🇹', nationality: 'Italian', population: 60461826, populationRating: 57, motto: 'Union, Strength and Liberty!', governmentType: 'Republic', governmentPerception: 'Flawed Democracy', corruption: 57, leaderTitle: 'President', leader: 'Paolo Protti', militaryBudget: 76, intelligenceBudget: 60, mediaFreedom: 76, healthcare: 80, higherEducation: 79, science: 75, lswActivity: 32, lswRegulations: 'Legal', vigilantism: 'Banned', cloning: 0, terrorismActivity: 'Inactive', cyberCapabilities: 68 },
  { id: 'JP', code: 35, name: 'Japan', flag: '🇯🇵', nationality: 'Japanese', population: 126476461, populationRating: 70, motto: 'None', governmentType: 'Constitutional Monarchy', governmentPerception: 'Full Democracy', corruption: 76, leaderTitle: 'Emperor', militaryBudget: 82, intelligenceBudget: 83, mediaFreedom: 71, healthcare: 85, higherEducation: 85, science: 78, lswActivity: 42, lswRegulations: 'Legal', vigilantism: 'Banned', cloning: 0, terrorismActivity: 'Active', cyberCapabilities: 79 },
  { id: 'MX', code: 36, name: 'Mexico', flag: '🇲🇽', nationality: 'Mexican', population: 128932753, populationRating: 70, motto: 'The Homeland is First', governmentType: 'Federal Republic', governmentPerception: 'Flawed Democracy', corruption: 34, leaderTitle: 'President', leader: 'Ricardo Ortega', militaryBudget: 60, intelligenceBudget: 45, mediaFreedom: 53, healthcare: 75, higherEducation: 70, science: 65, lswActivity: 77, lswRegulations: 'Regulated', vigilantism: 'Banned', cloning: 0, terrorismActivity: 'Inactive', cyberCapabilities: 52 },
  { id: 'NG', code: 40, name: 'Nigeria', flag: '🇳🇬', nationality: 'Nigerian', population: 206139589, populationRating: 75, motto: 'Unity and Faith, Peace and Progress', governmentType: 'Federal Republic', governmentPerception: 'Hybrid Regime', corruption: 25, leaderTitle: 'President', leader: 'Emmanuel Ekpe', militaryBudget: 55, intelligenceBudget: 39, mediaFreedom: 60, healthcare: 35, higherEducation: 49, science: 50, lswActivity: 88, lswRegulations: 'Legal', vigilantism: 'Regulated', cloning: 0, terrorismActivity: 'Active', cyberCapabilities: 31 },
  { id: 'PK', code: 42, name: 'Pakistan', flag: '🇵🇰', nationality: 'Pakistani', population: 220892340, populationRating: 76, motto: 'Faith, Unity, Discipline', governmentType: 'Federal Republic', governmentPerception: 'Hybrid Regime', corruption: 29, leaderTitle: 'President', militaryBudget: 65, intelligenceBudget: 38, mediaFreedom: 53, healthcare: 35, higherEducation: 40, science: 45, lswActivity: 82, lswRegulations: 'Legal', vigilantism: 'Banned', cloning: 0, terrorismActivity: 'Inactive', cyberCapabilities: 32 },
  { id: 'RU', code: 45, name: 'Russia', flag: '🇷🇺', nationality: 'Russian', population: 145934462, populationRating: 70, motto: 'None', governmentType: 'Federal Republic', governmentPerception: 'Authoritarian Regime', corruption: 28, leaderTitle: 'President', leader: 'Aleksei Rostov', militaryBudget: 81, intelligenceBudget: 83, mediaFreedom: 47, healthcare: 75, higherEducation: 82, science: 78, lswActivity: 77, lswRegulations: 'Regulated', vigilantism: 'Banned', cloning: 42, terrorismActivity: 'Rare', cyberCapabilities: 64 },
  { id: 'SA', code: 47, name: 'Saudi Arabia', flag: '🇸🇦', nationality: 'Saudi', population: 34813871, populationRating: 52, motto: 'There is no God other than God', governmentType: 'Monarchy', governmentPerception: 'Authoritarian Regime', corruption: 53, leaderTitle: 'King', militaryBudget: 64, intelligenceBudget: 52, mediaFreedom: 28, healthcare: 75, higherEducation: 78, science: 32, lswActivity: 49, lswRegulations: 'Regulated', vigilantism: 'Banned', cloning: 0, terrorismActivity: 'Active', cyberCapabilities: 63 },
  { id: 'SG', code: 51, name: 'Singapore', flag: '🇸🇬', nationality: 'Singaporean', population: 5850342, populationRating: 39, motto: 'Onward Singapore', governmentType: 'Parliamentary Republic', governmentPerception: 'Full Democracy', corruption: 86, leaderTitle: 'President', militaryBudget: 53, intelligenceBudget: 38, mediaFreedom: 44, healthcare: 90, higherEducation: 84, science: 63, lswActivity: 29, lswRegulations: 'Legal', vigilantism: 'Banned', cloning: 0, terrorismActivity: 'Active', cyberCapabilities: 81 },
  { id: 'ZA', code: 53, name: 'South Africa', flag: '🇿🇦', nationality: 'South African', population: 59308690, populationRating: 57, motto: 'Unity in Diversity', governmentType: 'Republic', governmentPerception: 'Flawed Democracy', corruption: 46, leaderTitle: 'President', militaryBudget: 64, intelligenceBudget: 48, mediaFreedom: 78, healthcare: 77, higherEducation: 72, science: 62, lswActivity: 65, lswRegulations: 'Banned', vigilantism: 'Regulated', cloning: 0, terrorismActivity: 'Inactive', cyberCapabilities: 49 },
  { id: 'KR', code: 54, name: 'South Korea', flag: '🇰🇷', nationality: 'South Korean', population: 51269185, populationRating: 56, motto: 'To broadly benefit the human world', governmentType: 'Republic', governmentPerception: 'Full Democracy', corruption: 62, leaderTitle: 'President', militaryBudget: 74, intelligenceBudget: 76, mediaFreedom: 76, healthcare: 85, higherEducation: 86, science: 72, lswActivity: 58, lswRegulations: 'Legal', vigilantism: 'Banned', cloning: 0, terrorismActivity: 'Inactive', cyberCapabilities: 72 },
  { id: 'ES', code: 55, name: 'Spain', flag: '🇪🇸', nationality: 'Spaniard', population: 46754778, populationRating: 56, motto: 'Further beyond', governmentType: 'Parliamentary Monarchy', governmentPerception: 'Full Democracy', corruption: 64, leaderTitle: 'Monarch', militaryBudget: 67, intelligenceBudget: 55, mediaFreedom: 79, healthcare: 85, higherEducation: 83, science: 79, lswActivity: 57, lswRegulations: 'Regulated', vigilantism: 'Banned', cloning: 0, terrorismActivity: 'Inactive', cyberCapabilities: 73 },
  { id: 'SE', code: 58, name: 'Sweden', flag: '🇸🇪', nationality: 'Swede', population: 10099265, populationRating: 45, motto: 'For Sweden – in the time', governmentType: 'Constitutional Monarchy', governmentPerception: 'Full Democracy', corruption: 86, leaderTitle: 'Monarch', militaryBudget: 58, intelligenceBudget: 41, mediaFreedom: 90, healthcare: 90, higherEducation: 90, science: 68, lswActivity: 20, lswRegulations: 'Legal', vigilantism: 'Banned', cloning: 0, terrorismActivity: 'Inactive', cyberCapabilities: 87 },
  { id: 'CH', code: 59, name: 'Switzerland', flag: '🇨🇭', nationality: 'Swiss', population: 8654622, populationRating: 43, motto: 'One for all, all for one', governmentType: 'Federal Republic', governmentPerception: 'Full Democracy', corruption: 89, leaderTitle: 'President of the Confederation', militaryBudget: 59, intelligenceBudget: 48, mediaFreedom: 89, healthcare: 90, higherEducation: 90, science: 73, lswActivity: 28, lswRegulations: 'Regulated', vigilantism: 'Regulated', cloning: 0, terrorismActivity: 'Inactive', cyberCapabilities: 89 },
  { id: 'TW', code: 61, name: 'Taiwan', flag: '🇹🇼', nationality: 'Taiwanese', population: 23816775, populationRating: 51, motto: 'None', governmentType: 'Multiparty Democracy', governmentPerception: 'Full Democracy', corruption: 66, leaderTitle: 'President', militaryBudget: 63, intelligenceBudget: 52, mediaFreedom: 76, healthcare: 90, higherEducation: 88, science: 24, lswActivity: 39, lswRegulations: 'Legal', vigilantism: 'Banned', cloning: 0, terrorismActivity: 'Active', cyberCapabilities: 79 },
  { id: 'TH', code: 64, name: 'Thailand', flag: '🇹🇭', nationality: 'Thai', population: 69799978, populationRating: 57, motto: 'Nation, Religion, King', governmentType: 'Constitutional Monarchy', governmentPerception: 'Flawed Democracy', corruption: 34, leaderTitle: 'Monarch', militaryBudget: 42, intelligenceBudget: 25, mediaFreedom: 54, healthcare: 70, higherEducation: 68, science: 35, lswActivity: 66, lswRegulations: 'Banned', vigilantism: 'Banned', cloning: 0, terrorismActivity: 'Inactive', cyberCapabilities: 56 },
  { id: 'TR', code: 65, name: 'Turkey', flag: '🇹🇷', nationality: 'Turk', population: 84339067, populationRating: 58, motto: 'Either independence or death', governmentType: 'Parliamentary Democracy', governmentPerception: 'Hybrid Regime', corruption: 36, leaderTitle: 'President', militaryBudget: 67, intelligenceBudget: 62, mediaFreedom: 50, healthcare: 77, higherEducation: 73, science: 70, lswActivity: 67, lswRegulations: 'Banned', vigilantism: 'Banned', cloning: 0, terrorismActivity: 'Inactive', cyberCapabilities: 58 },
  { id: 'UA', code: 66, name: 'Ukraine', flag: '🇺🇦', nationality: 'Ukrainian', population: 43733762, populationRating: 54, motto: 'Glory to Ukraine!', governmentType: 'Republic', governmentPerception: 'Hybrid Regime', corruption: 31, leaderTitle: 'President', militaryBudget: 55, intelligenceBudget: 46, mediaFreedom: 67, healthcare: 77, higherEducation: 79, science: 32, lswActivity: 55, lswRegulations: 'Regulated', vigilantism: 'Banned', cloning: 0, terrorismActivity: 'Inactive', cyberCapabilities: 55 },
  { id: 'AE', code: 67, name: 'United Arab Emirates', flag: '🇦🇪', nationality: 'Emirian', population: 9890402, populationRating: 44, motto: 'God, Nation, President', governmentType: 'Emirate', governmentPerception: 'Authoritarian Regime', corruption: 72, leaderTitle: 'President', militaryBudget: 54, intelligenceBudget: 38, mediaFreedom: 56, healthcare: 75, higherEducation: 80, science: 40, lswActivity: 20, lswRegulations: 'Regulated', vigilantism: 'Banned', cloning: 0, terrorismActivity: 'Active', cyberCapabilities: 68 },
  { id: 'GB', code: 68, name: 'United Kingdom', flag: '🇬🇧', nationality: 'British', population: 67886011, populationRating: 57, motto: 'God and my right', governmentType: 'Constitutional Monarchy', governmentPerception: 'Full Democracy', corruption: 78, leaderTitle: 'Monarch', leader: 'Jessica Hyde', militaryBudget: 78, intelligenceBudget: 70, mediaFreedom: 78, healthcare: 90, higherEducation: 90, science: 79, lswActivity: 65, lswRegulations: 'Regulated', vigilantism: 'Banned', cloning: 0, terrorismActivity: 'Inactive', cyberCapabilities: 84 },
  { id: 'US', code: 69, name: 'United States', flag: '🇺🇸', nationality: 'American', population: 331002651, populationRating: 82, motto: 'In God We Trust', governmentType: 'Federal Republic', governmentPerception: 'Flawed Democracy', corruption: 69, leaderTitle: 'President', militaryBudget: 90, intelligenceBudget: 90, mediaFreedom: 76, healthcare: 90, higherEducation: 90, science: 90, lswActivity: 85, lswRegulations: 'Legal', vigilantism: 'Banned', cloning: 0, terrorismActivity: 'Active', cyberCapabilities: 83 },
  { id: 'VE', code: 70, name: 'Venezuela', flag: '🇻🇪', nationality: 'Venezuelan', population: 28435940, populationRating: 51, motto: 'God and Federation', governmentType: 'Federal Republic', governmentPerception: 'Authoritarian Regime', corruption: 20, leaderTitle: 'President', militaryBudget: 49, intelligenceBudget: 35, mediaFreedom: 45, healthcare: 40, higherEducation: 70, science: 37, lswActivity: 44, lswRegulations: 'Legal', vigilantism: 'Banned', cloning: 0, terrorismActivity: 'Inactive', cyberCapabilities: 43 },
  { id: 'VN', code: 71, name: 'Vietnam', flag: '🇻🇳', nationality: 'Vietnamese', population: 97338579, populationRating: 60, motto: 'Independence, Liberty, Happiness', governmentType: 'Communist State', governmentPerception: 'Authoritarian Regime', corruption: 36, leaderTitle: 'President', militaryBudget: 55, intelligenceBudget: 48, mediaFreedom: 31, healthcare: 65, higherEducation: 63, science: 44, lswActivity: 29, lswRegulations: 'Regulated', vigilantism: 'Banned', cloning: 0, terrorismActivity: 'Active', cyberCapabilities: 47 },
];

// Sample cities from World Bible
export const CITIES: City[] = [
  // United States
  { sector: '', countryCode: 69, cultureCode: 13, name: 'Washington DC', country: 'United States', population: 705749, populationRating: 5, populationType: 'City', cityTypes: ['Political', 'Military'], crimeIndex: 65.3, safetyIndex: 34.7 },
  { sector: '', countryCode: 69, cultureCode: 13, name: 'New York', country: 'United States', population: 8336817, populationRating: 7, populationType: 'Mega City', cityTypes: ['Company', 'Industrial', 'Educational', 'Political'], crimeIndex: 45.2, safetyIndex: 54.8 },
  { sector: '', countryCode: 69, cultureCode: 13, name: 'Los Angeles', country: 'United States', population: 3979576, populationRating: 6, populationType: 'Large City', cityTypes: ['Company', 'Resort', 'Industrial'], crimeIndex: 48.3, safetyIndex: 51.7 },
  { sector: '', countryCode: 69, cultureCode: 13, name: 'Chicago', country: 'United States', population: 2693976, populationRating: 6, populationType: 'Large City', cityTypes: ['Industrial', 'Company', 'Political'], crimeIndex: 55.6, safetyIndex: 44.4 },
  { sector: '', countryCode: 69, cultureCode: 13, name: 'Miami', country: 'United States', population: 467963, populationRating: 5, populationType: 'City', cityTypes: ['Resort', 'Seaport', 'Company'], crimeIndex: 62.1, safetyIndex: 37.9 },

  // India
  { sector: '', countryCode: 25, cultureCode: 5, name: 'New Delhi', country: 'India', population: 32941000, populationRating: 7, populationType: 'Mega City', cityTypes: ['Political', 'Company', 'Temple'], crimeIndex: 53.6, safetyIndex: 46.4 },
  { sector: '', countryCode: 25, cultureCode: 5, name: 'Mumbai', country: 'India', population: 21690000, populationRating: 7, populationType: 'Mega City', cityTypes: ['Company', 'Industrial', 'Seaport'], crimeIndex: 45.2, safetyIndex: 54.8 },
  { sector: '', countryCode: 25, cultureCode: 5, name: 'Bangalore', country: 'India', population: 12764935, populationRating: 6, populationType: 'Large City', cityTypes: ['Educational', 'Company', 'Industrial'], crimeIndex: 38.7, safetyIndex: 61.3 },
  { sector: '', countryCode: 25, cultureCode: 5, name: 'Chennai', country: 'India', population: 11235000, populationRating: 6, populationType: 'Large City', cityTypes: ['Industrial', 'Temple', 'Seaport'], crimeIndex: 41.2, safetyIndex: 58.8 },

  // China
  { sector: '', countryCode: 33, cultureCode: 6, name: 'Beijing', country: 'China', population: 21893000, populationRating: 7, populationType: 'Mega City', cityTypes: ['Political', 'Military', 'Educational'], crimeIndex: 32.4, safetyIndex: 67.6 },
  { sector: '', countryCode: 33, cultureCode: 6, name: 'Shanghai', country: 'China', population: 27058000, populationRating: 7, populationType: 'Mega City', cityTypes: ['Company', 'Industrial', 'Seaport'], crimeIndex: 35.1, safetyIndex: 64.9 },
  { sector: '', countryCode: 33, cultureCode: 6, name: 'Shenzhen', country: 'China', population: 17619000, populationRating: 7, populationType: 'Mega City', cityTypes: ['Company', 'Industrial', 'Educational'], crimeIndex: 28.7, safetyIndex: 71.3 },
  { sector: '', countryCode: 33, cultureCode: 6, name: 'Guangzhou', country: 'China', population: 16096000, populationRating: 7, populationType: 'Mega City', cityTypes: ['Industrial', 'Company', 'Seaport'], crimeIndex: 33.9, safetyIndex: 66.1 },

  // Nigeria
  { sector: '', countryCode: 40, cultureCode: 2, name: 'Lagos', country: 'Nigeria', population: 14862000, populationRating: 7, populationType: 'Mega City', cityTypes: ['Company', 'Industrial', 'Seaport'], crimeIndex: 67.5, safetyIndex: 32.5 },
  { sector: '', countryCode: 40, cultureCode: 2, name: 'Abuja', country: 'Nigeria', population: 3464123, populationRating: 6, populationType: 'Large City', cityTypes: ['Political', 'Military'], crimeIndex: 54.2, safetyIndex: 45.8 },
  { sector: '', countryCode: 40, cultureCode: 2, name: 'Kano', country: 'Nigeria', population: 4103000, populationRating: 6, populationType: 'Large City', cityTypes: ['Industrial', 'Temple'], crimeIndex: 71.3, safetyIndex: 28.7 },

  // Japan
  { sector: '', countryCode: 35, cultureCode: 6, name: 'Tokyo', country: 'Japan', population: 37435191, populationRating: 7, populationType: 'Mega City', cityTypes: ['Company', 'Political', 'Educational', 'Industrial'], crimeIndex: 21.5, safetyIndex: 78.5 },
  { sector: '', countryCode: 35, cultureCode: 6, name: 'Osaka', country: 'Japan', population: 19281000, populationRating: 7, populationType: 'Mega City', cityTypes: ['Industrial', 'Company', 'Resort'], crimeIndex: 24.3, safetyIndex: 75.7 },
  { sector: '', countryCode: 35, cultureCode: 6, name: 'Kyoto', country: 'Japan', population: 1461974, populationRating: 6, populationType: 'Large City', cityTypes: ['Temple', 'Educational', 'Resort'], crimeIndex: 18.7, safetyIndex: 81.3 },

  // United Kingdom
  { sector: '', countryCode: 68, cultureCode: 9, name: 'London', country: 'United Kingdom', population: 8982000, populationRating: 7, populationType: 'Mega City', cityTypes: ['Company', 'Political', 'Educational', 'Industrial'], crimeIndex: 52.3, safetyIndex: 47.7 },
  { sector: '', countryCode: 68, cultureCode: 9, name: 'Manchester', country: 'United Kingdom', population: 2730076, populationRating: 6, populationType: 'Large City', cityTypes: ['Industrial', 'Educational', 'Company'], crimeIndex: 57.8, safetyIndex: 42.2 },
  { sector: '', countryCode: 68, cultureCode: 9, name: 'Edinburgh', country: 'United Kingdom', population: 536775, populationRating: 5, populationType: 'City', cityTypes: ['Political', 'Educational', 'Resort'], crimeIndex: 38.4, safetyIndex: 61.6 },

  // Germany
  { sector: '', countryCode: 23, cultureCode: 9, name: 'Berlin', country: 'Germany', population: 3748148, populationRating: 6, populationType: 'Large City', cityTypes: ['Political', 'Company', 'Educational'], crimeIndex: 41.2, safetyIndex: 58.8 },
  { sector: '', countryCode: 23, cultureCode: 9, name: 'Munich', country: 'Germany', population: 1484226, populationRating: 6, populationType: 'Large City', cityTypes: ['Company', 'Industrial', 'Educational'], crimeIndex: 32.7, safetyIndex: 67.3 },
  { sector: '', countryCode: 23, cultureCode: 9, name: 'Frankfurt', country: 'Germany', population: 753056, populationRating: 5, populationType: 'City', cityTypes: ['Company', 'Industrial'], crimeIndex: 45.6, safetyIndex: 54.4 },

  // Brazil
  { sector: '', countryCode: 15, cultureCode: 12, name: 'São Paulo', country: 'Brazil', population: 22430000, populationRating: 7, populationType: 'Mega City', cityTypes: ['Company', 'Industrial', 'Educational'], crimeIndex: 56.8, safetyIndex: 43.2 },
  { sector: '', countryCode: 15, cultureCode: 12, name: 'Rio de Janeiro', country: 'Brazil', population: 13458075, populationRating: 7, populationType: 'Mega City', cityTypes: ['Resort', 'Industrial', 'Seaport'], crimeIndex: 65.4, safetyIndex: 34.6 },

  // Russia
  { sector: '', countryCode: 45, cultureCode: 10, name: 'Moscow', country: 'Russia', population: 12538000, populationRating: 7, populationType: 'Mega City', cityTypes: ['Political', 'Military', 'Company', 'Industrial'], crimeIndex: 38.9, safetyIndex: 61.1 },
  { sector: '', countryCode: 45, cultureCode: 10, name: 'St. Petersburg', country: 'Russia', population: 5467000, populationRating: 6, populationType: 'Large City', cityTypes: ['Industrial', 'Educational', 'Resort'], crimeIndex: 42.3, safetyIndex: 57.7 },

  // France
  { sector: '', countryCode: 22, cultureCode: 9, name: 'Paris', country: 'France', population: 2161000, populationRating: 6, populationType: 'Large City', cityTypes: ['Political', 'Company', 'Resort', 'Educational'], crimeIndex: 52.1, safetyIndex: 47.9 },
  { sector: '', countryCode: 22, cultureCode: 9, name: 'Marseille', country: 'France', population: 870731, populationRating: 5, populationType: 'City', cityTypes: ['Seaport', 'Industrial'], crimeIndex: 58.7, safetyIndex: 41.3 },

  // Australia
  { sector: 'OY5', countryCode: 6, cultureCode: 11, name: 'Melbourne', country: 'Australia', population: 4967733, populationRating: 6, populationType: 'Large City', cityTypes: ['Educational', 'Resort', 'Industrial', 'Company'], crimeIndex: 44.49, safetyIndex: 55.51 },
  { sector: 'PE5', countryCode: 6, cultureCode: 11, name: 'Sydney', country: 'Australia', population: 4925987, populationRating: 6, populationType: 'Large City', cityTypes: ['Company', 'Political', 'Industrial', 'Seaport'], crimeIndex: 33.67, safetyIndex: 66.33 },
  { sector: 'PE4', countryCode: 6, cultureCode: 11, name: 'Brisbane', country: 'Australia', population: 2406182, populationRating: 6, populationType: 'Large City', cityTypes: ['Seaport', 'Industrial', 'Resort'], crimeIndex: 35.24, safetyIndex: 64.76 },
];

// Get cities for a specific country
export function getCitiesByCountry(countryName: string): City[] {
  return CITIES.filter(city => city.country === countryName);
}

// Get country by ID
export function getCountryById(id: string): Country | undefined {
  return COUNTRIES.find(c => c.id === id);
}

// Get country by name
export function getCountryByName(name: string): Country | undefined {
  return COUNTRIES.find(c => c.name.toLowerCase() === name.toLowerCase());
}

// Search countries
export function searchCountries(query: string): Country[] {
  const lowQuery = query.toLowerCase();
  return COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(lowQuery) ||
    c.nationality.toLowerCase().includes(lowQuery)
  );
}

// Education level based on higher education rating
export function getEducationLevel(rating: number): string {
  if (rating >= 85) return 'Elite';
  if (rating >= 75) return 'Advanced';
  if (rating >= 60) return 'University';
  if (rating >= 45) return 'Trade';
  if (rating >= 30) return 'Secondary';
  return 'Primary';
}

// Get faction alignment for a country
export function getFactionAlignment(countryName: string): string {
  const usFaction = ['United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France', 'Japan', 'South Korea', 'Israel', 'Greece', 'Portugal'];
  const indiaFaction = ['India', 'Nepal', 'Bangladesh', 'Sri Lanka', 'Uganda', 'Kenya', 'Tanzania'];
  const chinaFaction = ['China', 'Russia', 'North Korea', 'Vietnam', 'Singapore', 'Pakistan', 'Iran'];
  const nigeriaFaction = ['Nigeria', 'South Africa', 'Egypt', 'Ethiopia', 'Ghana', 'Angola', 'Algeria'];

  if (usFaction.includes(countryName)) return 'US';
  if (indiaFaction.includes(countryName)) return 'India';
  if (chinaFaction.includes(countryName)) return 'China';
  if (nigeriaFaction.includes(countryName)) return 'Nigeria';
  return 'Neutral';
}
