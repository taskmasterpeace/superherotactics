/**
 * Name Database for SuperHero Tactics Character Generation
 *
 * Names organized by Culture Code (1-14, 101-103)
 * Each culture has first names (male/female) and last names
 * ~50-60 names per category for variety
 *
 * Culture Codes:
 * 1 - North Africa (Arabic)
 * 2 - Central Africa (Bantu/French)
 * 3 - Southern Africa (Bantu/English)
 * 4 - Central Asia (Turkic/Russian)
 * 5 - South Asia (Hindi/Bengali/Urdu)
 * 6 - East & Southeast Asia (Chinese/Japanese/Korean/Vietnamese)
 * 7 - Caribbean (English/Spanish/French Creole)
 * 8 - Central America (Spanish/Indigenous)
 * 9 - Western Europe (English/French/German/Italian/Spanish)
 * 10 - Eastern Europe (Slavic)
 * 11 - Oceania (English/Indigenous)
 * 12 - South America (Portuguese/Spanish)
 * 13 - North America (English/Mixed)
 * 14 - Middle East (Arabic/Persian/Hebrew/Turkish)
 * 101 - Android (Technical/Synthetic)
 * 102 - Alien (Extraterrestrial)
 * 103 - Cosmic Entity (Abstract/Universal)
 */

export interface CultureRegion {
  code: number;
  name: string;
  description: string;
  languageFamilies: string[];
  exampleCountries: string[];
}

export const CULTURE_REGIONS: CultureRegion[] = [
  { code: 1, name: 'North Africa', description: 'Arabic-speaking North African nations', languageFamilies: ['Arabic', 'Berber', 'French'], exampleCountries: ['Algeria', 'Morocco', 'Egypt', 'Libya', 'Tunisia'] },
  { code: 2, name: 'Central Africa', description: 'Equatorial African nations', languageFamilies: ['Bantu', 'French', 'Swahili'], exampleCountries: ['Congo', 'Cameroon', 'Central African Republic', 'Gabon'] },
  { code: 3, name: 'Southern Africa', description: 'Southern African nations', languageFamilies: ['Bantu', 'English', 'Afrikaans'], exampleCountries: ['South Africa', 'Zimbabwe', 'Namibia', 'Botswana', 'Angola'] },
  { code: 4, name: 'Central Asia', description: 'Former Soviet Central Asian republics', languageFamilies: ['Turkic', 'Russian', 'Persian'], exampleCountries: ['Kazakhstan', 'Uzbekistan', 'Turkmenistan', 'Kyrgyzstan', 'Tajikistan'] },
  { code: 5, name: 'South Asia', description: 'Indian subcontinent', languageFamilies: ['Hindi', 'Bengali', 'Urdu', 'Tamil'], exampleCountries: ['India', 'Bangladesh', 'Pakistan', 'Nepal', 'Sri Lanka'] },
  { code: 6, name: 'East & Southeast Asia', description: 'East Asian and Southeast Asian nations', languageFamilies: ['Mandarin', 'Japanese', 'Korean', 'Vietnamese', 'Thai'], exampleCountries: ['China', 'Japan', 'Korea', 'Vietnam', 'Thailand', 'Indonesia'] },
  { code: 7, name: 'Caribbean', description: 'Caribbean island nations', languageFamilies: ['English', 'Spanish', 'French Creole'], exampleCountries: ['Jamaica', 'Bahamas', 'Cuba', 'Trinidad', 'Haiti'] },
  { code: 8, name: 'Central America', description: 'Central American and Mexican nations', languageFamilies: ['Spanish', 'Indigenous'], exampleCountries: ['Mexico', 'Guatemala', 'Honduras', 'Nicaragua', 'Panama'] },
  { code: 9, name: 'Western Europe', description: 'Western European nations', languageFamilies: ['English', 'French', 'German', 'Italian', 'Spanish', 'Dutch'], exampleCountries: ['UK', 'France', 'Germany', 'Italy', 'Spain', 'Netherlands'] },
  { code: 10, name: 'Eastern Europe', description: 'Slavic and Eastern European nations', languageFamilies: ['Russian', 'Ukrainian', 'Polish', 'Romanian'], exampleCountries: ['Russia', 'Ukraine', 'Poland', 'Belarus', 'Romania'] },
  { code: 11, name: 'Oceania', description: 'Australia, New Zealand, and Pacific Islands', languageFamilies: ['English', 'Maori', 'Indigenous Australian'], exampleCountries: ['Australia', 'New Zealand', 'Fiji', 'Papua New Guinea'] },
  { code: 12, name: 'South America', description: 'South American nations', languageFamilies: ['Portuguese', 'Spanish'], exampleCountries: ['Brazil', 'Argentina', 'Colombia', 'Peru', 'Chile'] },
  { code: 13, name: 'North America', description: 'USA and Canada', languageFamilies: ['English', 'French', 'Spanish'], exampleCountries: ['United States', 'Canada'] },
  { code: 14, name: 'Middle East', description: 'Middle Eastern nations', languageFamilies: ['Arabic', 'Persian', 'Hebrew', 'Turkish'], exampleCountries: ['Saudi Arabia', 'Iran', 'Iraq', 'UAE', 'Israel', 'Turkey'] },
  { code: 101, name: 'Android', description: 'Artificial beings and synthetic life forms', languageFamilies: ['Technical', 'Binary', 'Synthetic'], exampleCountries: ['N/A - Non-human'] },
  { code: 102, name: 'Alien', description: 'Extraterrestrial beings from distant worlds', languageFamilies: ['Xeno-linguistic', 'Stellar'], exampleCountries: ['N/A - Non-human'] },
  { code: 103, name: 'Cosmic Entity', description: 'Beings of immense cosmic power and ancient origin', languageFamilies: ['Abstract', 'Universal'], exampleCountries: ['N/A - Non-human'] },
];

export interface NameSet {
  cultureCode: number;
  maleFirstNames: string[];
  femaleFirstNames: string[];
  lastNames: string[];
  namingNotes?: string;
}

export const NAME_DATABASE: NameSet[] = [
  // Culture 1: North Africa (Arabic)
  {
    cultureCode: 1,
    maleFirstNames: [
      'Ahmed', 'Mohamed', 'Youssef', 'Omar', 'Ali', 'Hassan', 'Karim', 'Tarek',
      'Samir', 'Nabil', 'Rachid', 'Khalid', 'Farid', 'Mustafa', 'Ibrahim',
      'Hamza', 'Bilal', 'Amine', 'Sofiane', 'Reda', 'Mehdi', 'Walid', 'Zakaria',
      'Ayman', 'Adel', 'Mounir', 'Jamal', 'Hicham', 'Yassine', 'Aziz',
      'Anwar', 'Bashir', 'Driss', 'Faisal', 'Habib', 'Idris', 'Jaber', 'Kamil',
      'Lahcen', 'Mahmoud', 'Nadir', 'Othman', 'Rafik', 'Saber', 'Taha', 'Wassim',
      'Yahya', 'Zaki', 'Abdel', 'Brahim', 'Chakib', 'Djamel', 'Fouad', 'Ghani'
    ],
    femaleFirstNames: [
      'Fatima', 'Aisha', 'Amina', 'Nadia', 'Leila', 'Sara', 'Yasmine', 'Meriem',
      'Khadija', 'Samira', 'Houda', 'Nawal', 'Salma', 'Zineb', 'Hajar',
      'Imane', 'Soukaina', 'Nesrine', 'Lamia', 'Rania', 'Dounia', 'Ihsane',
      'Malika', 'Sabrina', 'Latifa', 'Ghizlane', 'Safia', 'Hanane', 'Wafa', 'Rim',
      'Asma', 'Basma', 'Chaima', 'Dalila', 'Farida', 'Hafsa', 'Ines', 'Jamila',
      'Karima', 'Loubna', 'Meryem', 'Naima', 'Ouafa', 'Rachida', 'Siham', 'Touria',
      'Yamina', 'Zahra', 'Aicha', 'Bouchra', 'Chadia', 'Djamila', 'Fatiha', 'Hakima'
    ],
    lastNames: [
      'El-Amin', 'Ben Ali', 'Bouzid', 'Khelifi', 'Mansouri', 'Belkacem', 'Boudiaf',
      'Hadj', 'Messaoudi', 'Brahimi', 'Rahmani', 'Saadi', 'Cherif', 'Benali',
      'Hamidi', 'Larbi', 'Salhi', 'Amrani', 'Moussa', 'Ferhat', 'Toumi', 'Zeroual',
      'Bouaziz', 'Kaddour', 'Slimani', 'Bensaid', 'Belhadj', 'Mebarki', 'Ouali', 'Djemai',
      'Abdelkader', 'Benaissa', 'Charef', 'Djellouli', 'El-Fassi', 'Ghali', 'Hamdani', 'Idir',
      'Jabri', 'Kamal', 'Lahrech', 'Mahfoud', 'Nasri', 'Oukaci', 'Rezki', 'Sellami',
      'Taleb', 'Yahi', 'Zaidi', 'Alouache', 'Bekkouche', 'Chabane', 'Dahmani', 'Embarek'
    ],
  },

  // Culture 2: Central Africa (Bantu/French)
  {
    cultureCode: 2,
    maleFirstNames: [
      'Emmanuel', 'Jean-Pierre', 'Patrick', 'Samuel', 'David', 'Joseph', 'Pierre',
      'Michel', 'Paul', 'Jacques', 'Francois', 'Andre', 'Christian', 'Bernard',
      'Didier', 'Olivier', 'Thierry', 'Alain', 'Claude', 'Serge', 'Yves', 'Guy',
      'Fabrice', 'Blaise', 'Innocent', 'Faustin', 'Celestin', 'Janvier', 'Desire', 'Prosper',
      'Augustin', 'Boniface', 'Clement', 'Denis', 'Eugene', 'Felix', 'Gaston', 'Henri',
      'Isaac', 'Jules', 'Koffi', 'Lambert', 'Marcel', 'Nicolas', 'Oscar', 'Philippe',
      'Remy', 'Sylvain', 'Theodore', 'Victor', 'Xavier', 'Zacharie', 'Anatole', 'Bruno'
    ],
    femaleFirstNames: [
      'Marie', 'Grace', 'Esperance', 'Claudine', 'Jeanne', 'Josephine', 'Beatrice',
      'Francoise', 'Monique', 'Celine', 'Sylvie', 'Nadine', 'Sandrine', 'Viviane',
      'Pauline', 'Angelique', 'Divine', 'Clarisse', 'Pascaline', 'Honorine',
      'Antoinette', 'Bernadette', 'Constance', 'Felicite', 'Madeleine', 'Odette',
      'Perpetue', 'Rosalie', 'Solange', 'Therese',
      'Adele', 'Brigitte', 'Charlotte', 'Delphine', 'Ernestine', 'Florence', 'Georgette',
      'Helene', 'Irene', 'Justine', 'Laure', 'Marguerite', 'Noelle', 'Olive', 'Pascale',
      'Rachel', 'Simone', 'Ursule', 'Veronique', 'Yvonne', 'Aimee', 'Blanche', 'Cecile'
    ],
    lastNames: [
      'Mbeki', 'Nguesso', 'Kabila', 'Mobutu', 'Bokassa', 'Sassou', 'Biya',
      'Ndongo', 'Ongala', 'Mabika', 'Nzinga', 'Lumumba', 'Tshisekedi', 'Kanza',
      'Mukendi', 'Ngoy', 'Kalala', 'Ilunga', 'Kasongo', 'Mbala', 'Nkunda',
      'Bemba', 'Kabongo', 'Lukusa', 'Mulamba', 'Ngoyi', 'Tshibangu', 'Wemba',
      'Youlou', 'Zokou',
      'Alongi', 'Bakongo', 'Dibala', 'Ekanga', 'Fofana', 'Gbagbo', 'Ibrahima', 'Konate',
      'Lingala', 'Monga', 'Ngoma', 'Okapi', 'Pongo', 'Ruzizi', 'Sangha', 'Tchamba',
      'Ubangi', 'Virunga', 'Watsa', 'Yangambi', 'Zongo', 'Aketi', 'Bandundu', 'Congolo'
    ],
  },

  // Culture 3: Southern Africa (Bantu/English)
  {
    cultureCode: 3,
    maleFirstNames: [
      'Thabo', 'Nelson', 'Sipho', 'Bongani', 'Themba', 'Mandla', 'Gift', 'Blessing',
      'Tendai', 'Tatenda', 'Tonderai', 'Farai', 'Takudzwa', 'Kudakwashe', 'Tinashe',
      'Peter', 'John', 'Michael', 'David', 'William', 'James', 'Thomas', 'Robert',
      'Daniel', 'Joseph', 'Jacob', 'Samuel', 'Andrew', 'Simon', 'Charles',
      'Abraham', 'Benjamin', 'Christopher', 'Edward', 'Francis', 'George', 'Henry',
      'Isaac', 'Johannes', 'Kenneth', 'Leonard', 'Martin', 'Nkosi', 'Oscar', 'Patrick',
      'Richard', 'Stephen', 'Trevor', 'Vincent', 'Walter', 'Xolani', 'Zwelibanzi', 'Andile'
    ],
    femaleFirstNames: [
      'Thandi', 'Nomvula', 'Precious', 'Lindiwe', 'Sibongile', 'Zanele', 'Nompumelelo',
      'Rudo', 'Tendai', 'Chipo', 'Nyasha', 'Rumbidzai', 'Tsitsi', 'Vimbai', 'Rutendo',
      'Grace', 'Faith', 'Hope', 'Joy', 'Mercy', 'Prudence', 'Patience', 'Memory',
      'Beauty', 'Loveness', 'Happiness', 'Charity', 'Dorothy', 'Elizabeth', 'Margaret',
      'Agnes', 'Barbara', 'Caroline', 'Diana', 'Esther', 'Florence', 'Gertrude', 'Helen',
      'Irene', 'Josephine', 'Katherine', 'Lillian', 'Martha', 'Naomi', 'Olivia', 'Phyllis',
      'Rebecca', 'Sarah', 'Teresa', 'Victoria', 'Winnie', 'Zodwa', 'Ayanda', 'Busisiwe'
    ],
    lastNames: [
      'Mandela', 'Mbeki', 'Zuma', 'Ramaphosa', 'Dlamini', 'Ndlovu', 'Nkosi', 'Khumalo',
      'Moyo', 'Ncube', 'Sibanda', 'Dube', 'Mpofu', 'Ndebele', 'Nyathi', 'Tshuma',
      'Mugabe', 'Mnangagwa', 'Chiwenga', 'Tsvangirai', 'Chamisa', 'Mujuru',
      'Van der Merwe', 'Botha', 'Du Plessis', 'Joubert', 'Kruger', 'Pretorius',
      'De Klerk', 'Steyn',
      'Banda', 'Chivasa', 'Gumede', 'Hlatshwayo', 'Jele', 'Khoza', 'Langa', 'Mahlangu',
      'Ngwenya', 'Phiri', 'Radebe', 'Sithole', 'Thwala', 'Vilakazi', 'Xaba', 'Zwane',
      'Buthelezi', 'Cele', 'Dlomo', 'Gcaba', 'Hlongwane', 'Kunene', 'Mkhize', 'Nxumalo'
    ],
  },

  // Culture 4: Central Asia (Turkic/Russian)
  {
    cultureCode: 4,
    maleFirstNames: [
      'Nursultan', 'Timur', 'Rustam', 'Alisher', 'Bakhtiyar', 'Damir', 'Eldor',
      'Farkhad', 'Jasur', 'Kamil', 'Murod', 'Nodir', 'Oybek', 'Ravshan', 'Sardor',
      'Aleksandr', 'Dmitri', 'Sergei', 'Vladimir', 'Andrei', 'Yuri', 'Viktor',
      'Boris', 'Ivan', 'Mikhail', 'Nikolai', 'Pavel', 'Aleksei', 'Anatoli', 'Grigori',
      'Askar', 'Bekzod', 'Dilshod', 'Erkin', 'Farhod', 'Gulom', 'Hakim', 'Ilhom',
      'Jahongir', 'Kamoliddin', 'Laziz', 'Mirzo', 'Nurbek', 'Otabek', 'Pulat', 'Qodir',
      'Ravshanbek', 'Sanjar', 'Tokhir', 'Ulugbek', 'Valijon', 'Yodgor', 'Zafar', 'Akbar'
    ],
    femaleFirstNames: [
      'Dilnoza', 'Gulnara', 'Kamila', 'Madina', 'Nilufar', 'Sabina', 'Zarina',
      'Aziza', 'Dildora', 'Feruza', 'Iroda', 'Lola', 'Malika', 'Nasiba', 'Odinay',
      'Natasha', 'Olga', 'Tatiana', 'Svetlana', 'Yelena', 'Irina', 'Marina',
      'Anna', 'Ekaterina', 'Lyudmila', 'Nadezhda', 'Valentina', 'Vera', 'Galina', 'Nina',
      'Ainura', 'Barno', 'Charos', 'Dilorom', 'Elvira', 'Farzona', 'Gulchehra', 'Hilola',
      'Jamila', 'Komila', 'Laziza', 'Maftuna', 'Nodira', 'Ozoda', 'Parvin', 'Qunduz',
      'Rano', 'Saida', 'Tanzila', 'Umida', 'Vasila', 'Yulduz', 'Zulfiya', 'Aliya'
    ],
    lastNames: [
      'Nazarbayev', 'Karimov', 'Mirziyoyev', 'Rahmonov', 'Berdymukhamedov',
      'Aliyev', 'Mammadov', 'Hasanov', 'Qurbanov', 'Abdullayev',
      'Petrov', 'Ivanov', 'Sidorov', 'Kuznetsov', 'Popov', 'Sokolov', 'Lebedev',
      'Kozlov', 'Novikov', 'Morozov', 'Volkov', 'Alekseev', 'Vasiliev', 'Zaytsev',
      'Mikhailov', 'Fedorov', 'Yakovlev', 'Andreev', 'Belov', 'Grigoriev',
      'Abdullaev', 'Bakirov', 'Davlatov', 'Ergashev', 'Fayzullaev', 'Gafurov', 'Hamidov',
      'Ibragimov', 'Juraev', 'Kadirov', 'Latipov', 'Mukhammadiev', 'Narzullaev', 'Ochilov',
      'Pulatov', 'Qodirov', 'Rakhimov', 'Saidov', 'Toshmatov', 'Umarov', 'Yusupov', 'Zakirov'
    ],
    namingNotes: 'Many names have Russian influence due to Soviet era. Patronymics (-ov/-ova, -ev/-eva) are common.',
  },

  // Culture 5: South Asia (Hindi/Bengali/Urdu)
  {
    cultureCode: 5,
    maleFirstNames: [
      'Raj', 'Vikram', 'Arjun', 'Ravi', 'Amit', 'Suresh', 'Rajesh', 'Anil',
      'Deepak', 'Manoj', 'Sanjay', 'Vijay', 'Ajay', 'Rahul', 'Sachin',
      'Mohammed', 'Ali', 'Hassan', 'Imran', 'Tariq', 'Farhan', 'Bilal',
      'Aamir', 'Salman', 'Shahrukh', 'Akbar', 'Asif', 'Bashir', 'Faisal', 'Hamid',
      'Aditya', 'Bharat', 'Chandra', 'Dinesh', 'Ganesh', 'Harish', 'Jagdish', 'Kiran',
      'Lakshman', 'Mahesh', 'Naresh', 'Prakash', 'Ramesh', 'Satish', 'Umesh', 'Vivek',
      'Abdul', 'Karim', 'Latif', 'Majid', 'Nadeem', 'Qasim', 'Rashid', 'Zahid'
    ],
    femaleFirstNames: [
      'Priya', 'Ananya', 'Deepika', 'Aishwarya', 'Pooja', 'Sunita', 'Meena',
      'Rekha', 'Lakshmi', 'Padma', 'Sita', 'Radha', 'Kavita', 'Neha', 'Swati',
      'Fatima', 'Ayesha', 'Khadija', 'Nadia', 'Sana', 'Huma', 'Zainab',
      'Benazir', 'Malala', 'Asma', 'Shabana', 'Tahira', 'Uzma', 'Yasmeen', 'Zara',
      'Anjali', 'Bhavna', 'Chitra', 'Durga', 'Gita', 'Indira', 'Jyoti', 'Kamala',
      'Lata', 'Madhuri', 'Nirmala', 'Parvati', 'Rani', 'Sarita', 'Uma', 'Vandana',
      'Amina', 'Bushra', 'Farzana', 'Gulshan', 'Nasreen', 'Rubina', 'Samina', 'Tasneem'
    ],
    lastNames: [
      'Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Verma', 'Joshi', 'Rao',
      'Reddy', 'Nair', 'Iyer', 'Menon', 'Pillai', 'Mukherjee', 'Banerjee',
      'Khan', 'Ahmed', 'Ali', 'Hussain', 'Sheikh', 'Malik', 'Qureshi',
      'Siddiqui', 'Ansari', 'Mirza', 'Chowdhury', 'Rahman', 'Hasan', 'Iqbal', 'Raza',
      'Agarwal', 'Bhatia', 'Chadha', 'Deshpande', 'Gandhi', 'Hegde', 'Jain', 'Kapoor',
      'Lal', 'Mehta', 'Narayan', 'Pandey', 'Rajan', 'Saxena', 'Thakur', 'Yadav',
      'Abbasi', 'Butt', 'Dar', 'Gilani', 'Jaffri', 'Kazmi', 'Naqvi', 'Rizvi'
    ],
  },

  // Culture 6: East & Southeast Asia
  {
    cultureCode: 6,
    maleFirstNames: [
      'Wei', 'Jian', 'Ming', 'Lei', 'Chen', 'Yang', 'Feng', 'Long',
      'Takeshi', 'Hiroshi', 'Kenji', 'Yuki', 'Ryu', 'Akira', 'Satoshi', 'Kazuki',
      'Min-jun', 'Seung', 'Jin', 'Hyun', 'Dong', 'Sung', 'Joon', 'Tae',
      'Minh', 'Duc', 'Thanh', 'Hieu', 'Tuan', 'Quang', 'Hung', 'Phong',
      'Bao', 'Cheng', 'Deshi', 'Gang', 'Hong', 'Jun', 'Kai', 'Liang',
      'Qiang', 'Rong', 'Shan', 'Tao', 'Xiang', 'Yong', 'Zhen', 'Bo',
      'Daisuke', 'Haruki', 'Ichiro', 'Jiro', 'Kento', 'Makoto', 'Naoki', 'Shinji'
    ],
    femaleFirstNames: [
      'Mei', 'Li', 'Ying', 'Xia', 'Fang', 'Hua', 'Lan', 'Jing',
      'Yuki', 'Sakura', 'Hana', 'Aiko', 'Miko', 'Keiko', 'Yumi', 'Emi',
      'Min-ji', 'Soo', 'Ji-yeon', 'Eun', 'Hye', 'Sun', 'Yuna', 'Ha-neul',
      'Linh', 'Mai', 'Ngoc', 'Thi', 'Huong', 'Phuong', 'Thao', 'Anh',
      'Bai', 'Chun', 'Dan', 'Feng', 'Hui', 'Juan', 'Lin', 'Na',
      'Ping', 'Qing', 'Shan', 'Ting', 'Xue', 'Yan', 'Zhi', 'Ai',
      'Ayumi', 'Chieko', 'Fumiko', 'Haruko', 'Kazuko', 'Mariko', 'Noriko', 'Reiko'
    ],
    lastNames: [
      'Wang', 'Li', 'Zhang', 'Liu', 'Chen', 'Yang', 'Huang', 'Wu',
      'Tanaka', 'Suzuki', 'Takahashi', 'Yamamoto', 'Watanabe', 'Sato', 'Kobayashi', 'Kato',
      'Kim', 'Lee', 'Park', 'Choi', 'Jung', 'Kang', 'Cho', 'Yoon',
      'Nguyen', 'Tran', 'Le', 'Pham', 'Hoang', 'Vu', 'Vo', 'Dang',
      'Zhou', 'Xu', 'Sun', 'Ma', 'Hu', 'Guo', 'He', 'Lin',
      'Zheng', 'Luo', 'Zhao', 'Liang', 'Xie', 'Han', 'Deng', 'Feng',
      'Nakamura', 'Ito', 'Yamada', 'Sasaki', 'Yamaguchi', 'Matsumoto', 'Inoue', 'Kimura'
    ],
    namingNotes: 'East Asian naming: Family name comes FIRST. "Wang Wei" = Wei from the Wang family.',
  },

  // Culture 7: Caribbean
  {
    cultureCode: 7,
    maleFirstNames: [
      'Marcus', 'Dwayne', 'Andre', 'Leroy', 'Winston', 'Carlton', 'Desmond', 'Cedric',
      'Tyrone', 'Wayne', 'Marvin', 'Terrence', 'Kareem', 'Rashid', 'Jamal', 'Damian',
      'Carlos', 'Miguel', 'Rafael', 'Luis', 'Juan', 'Jose', 'Antonio', 'Fernando',
      'Pierre', 'Jean-Claude', 'Francois', 'Rene', 'Marcel', 'Henri',
      'Aldrick', 'Byron', 'Clive', 'Delroy', 'Earl', 'Floyd', 'Gerald', 'Horace',
      'Irving', 'Jermaine', 'Kelvin', 'Lennox', 'Maurice', 'Neville', 'Orlando', 'Percival',
      'Quincy', 'Rohan', 'Sheldon', 'Trevor', 'Usain', 'Vernon', 'Xavier', 'Yannick'
    ],
    femaleFirstNames: [
      'Marcia', 'Sasha', 'Keisha', 'Tamara', 'Jasmine', 'Monique', 'Shaniqua', 'Latoya',
      'Shanique', 'Tanisha', 'Aaliyah', 'Brianna', 'Chantal', 'Destiny', 'Ebony', 'Felicia',
      'Maria', 'Carmen', 'Rosa', 'Ana', 'Luz', 'Esperanza', 'Dolores', 'Mercedes',
      'Marie-Claire', 'Nadine', 'Simone', 'Dominique', 'Fabienne', 'Guerline',
      'Althea', 'Beverley', 'Claudette', 'Denise', 'Elaine', 'Fiona', 'Gloria', 'Hyacinth',
      'Ingrid', 'Jacqueline', 'Khadine', 'Lorna', 'Marlene', 'Norma', 'Opal', 'Patrice',
      'Queenie', 'Rhonda', 'Sheryl', 'Tanya', 'Una', 'Veronica', 'Winsome', 'Yvette'
    ],
    lastNames: [
      'Marley', 'Bolt', 'Williams', 'Johnson', 'Brown', 'Davis', 'Thompson', 'Campbell',
      'Morrison', 'Graham', 'Stewart', 'Richards', 'Bennett', 'Gordon', 'Clarke', 'Bryan',
      'Rodriguez', 'Fernandez', 'Garcia', 'Martinez', 'Lopez', 'Gonzalez', 'Perez', 'Sanchez',
      'Jean-Baptiste', 'Pierre', 'Toussaint', 'Aristide', 'Duvalier', 'Preval',
      'Anderson', 'Bailey', 'Christie', 'Douglas', 'Edwards', 'Francis', 'Grant', 'Hamilton',
      'Irving', 'James', 'Kelly', 'Lewis', 'Morgan', 'Nelson', 'Owens', 'Palmer',
      'Reid', 'Simpson', 'Taylor', 'Walker', 'Young', 'Beckford', 'Gayle', 'Sinclair'
    ],
  },

  // Culture 8: Central America (Spanish/Indigenous)
  {
    cultureCode: 8,
    maleFirstNames: [
      'Diego', 'Carlos', 'Miguel', 'Jose', 'Juan', 'Luis', 'Fernando', 'Roberto',
      'Alejandro', 'Eduardo', 'Ricardo', 'Javier', 'Antonio', 'Manuel', 'Rafael', 'Oscar',
      'Cuauhtemoc', 'Quetzal', 'Pacal', 'Tecun', 'Balam', 'Itzamna', 'Kinich', 'Ahau',
      'Alberto', 'Benito', 'Cesar', 'Daniel', 'Ernesto', 'Francisco', 'Guillermo', 'Hector',
      'Ignacio', 'Jorge', 'Leonardo', 'Mario', 'Nicolas', 'Pablo', 'Raul', 'Salvador',
      'Tomas', 'Ulises', 'Victor', 'Xavier', 'Andres', 'Bruno', 'Cristian', 'David',
      'Emilio', 'Felipe', 'Gabriel', 'Hugo', 'Ivan', 'Julio', 'Kevin', 'Lorenzo'
    ],
    femaleFirstNames: [
      'Maria', 'Carmen', 'Rosa', 'Ana', 'Guadalupe', 'Sofia', 'Isabella', 'Valentina',
      'Camila', 'Fernanda', 'Daniela', 'Mariana', 'Ximena', 'Regina', 'Renata', 'Paula',
      'Citlali', 'Xochitl', 'Itzel', 'Yaretzi', 'Atziri', 'Nayeli', 'Yolanda', 'Marisol',
      'Luz', 'Esperanza', 'Dolores', 'Mercedes', 'Consuelo', 'Pilar',
      'Adriana', 'Beatriz', 'Claudia', 'Diana', 'Elena', 'Flor', 'Gabriela', 'Hilda',
      'Irma', 'Juana', 'Karla', 'Lorena', 'Monica', 'Norma', 'Olivia', 'Patricia',
      'Rosario', 'Sandra', 'Teresa', 'Veronica', 'Alicia', 'Brenda', 'Cecilia', 'Dulce'
    ],
    lastNames: [
      'Garcia', 'Martinez', 'Lopez', 'Gonzalez', 'Rodriguez', 'Hernandez', 'Perez', 'Sanchez',
      'Ramirez', 'Torres', 'Flores', 'Rivera', 'Gomez', 'Diaz', 'Cruz', 'Morales',
      'Ortega', 'Reyes', 'Gutierrez', 'Ruiz', 'Alvarez', 'Mendoza', 'Vargas', 'Castillo',
      'Romero', 'Jimenez', 'Aguilar', 'Medina', 'Vazquez', 'Chavez',
      'Acosta', 'Bautista', 'Cabrera', 'Delgado', 'Espinoza', 'Fuentes', 'Guerrero', 'Herrera',
      'Ibarra', 'Juarez', 'Luna', 'Maldonado', 'Navarro', 'Ochoa', 'Padilla', 'Quintero',
      'Ramos', 'Salazar', 'Trujillo', 'Valencia', 'Villalobos', 'Zamora', 'Zuniga', 'Ayala'
    ],
  },

  // Culture 9: Western Europe
  {
    cultureCode: 9,
    maleFirstNames: [
      'James', 'William', 'Oliver', 'Harry', 'George', 'Thomas', 'Charles', 'Edward',
      'Jean', 'Pierre', 'Louis', 'Antoine', 'Francois', 'Nicolas', 'Philippe', 'Michel',
      'Hans', 'Friedrich', 'Wolfgang', 'Heinrich', 'Klaus', 'Stefan', 'Markus', 'Dieter',
      'Marco', 'Alessandro', 'Giuseppe', 'Francesco', 'Antonio', 'Paolo', 'Luca', 'Giovanni',
      'Alexander', 'Benjamin', 'Christopher', 'Daniel', 'Felix', 'Gabriel', 'Henry', 'Ian',
      'Jonathan', 'Kevin', 'Lucas', 'Matthew', 'Nathan', 'Oscar', 'Patrick', 'Quentin',
      'Richard', 'Sebastian', 'Theodore', 'Vincent', 'Xavier', 'Zachary', 'Adrian', 'Bruno'
    ],
    femaleFirstNames: [
      'Emma', 'Olivia', 'Charlotte', 'Sophie', 'Elizabeth', 'Victoria', 'Grace', 'Emily',
      'Marie', 'Claire', 'Isabelle', 'Camille', 'Amelie', 'Chloe', 'Lea', 'Margot',
      'Anna', 'Hannah', 'Lena', 'Sarah', 'Laura', 'Julia', 'Katharina', 'Marie',
      'Giulia', 'Sofia', 'Chiara', 'Francesca', 'Elena', 'Valentina', 'Lucia', 'Alessia',
      'Alexandra', 'Beatrice', 'Caroline', 'Diana', 'Eleanor', 'Florence', 'Gemma', 'Helena',
      'Isabella', 'Jessica', 'Katherine', 'Louise', 'Madeleine', 'Natalie', 'Ophelia', 'Penelope',
      'Rebecca', 'Stephanie', 'Theresa', 'Ursula', 'Veronica', 'Wilhelmina', 'Yvonne', 'Zoe'
    ],
    lastNames: [
      'Smith', 'Jones', 'Williams', 'Taylor', 'Brown', 'Wilson', 'Johnson', 'Davies',
      'Martin', 'Bernard', 'Dubois', 'Moreau', 'Lefebvre', 'Leroy', 'Roux', 'Girard',
      'Muller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker',
      'Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci',
      'Anderson', 'Clarke', 'Edwards', 'Green', 'Harris', 'Jackson', 'King', 'Lewis',
      'Mitchell', 'Nelson', 'Owen', 'Phillips', 'Roberts', 'Scott', 'Thompson', 'Walker',
      'White', 'Wright', 'Young', 'Baker', 'Campbell', 'Evans', 'Hall', 'Moore'
    ],
  },

  // Culture 10: Eastern Europe (Slavic)
  {
    cultureCode: 10,
    maleFirstNames: [
      'Vladimir', 'Dmitri', 'Sergei', 'Aleksandr', 'Andrei', 'Mikhail', 'Nikolai', 'Ivan',
      'Viktor', 'Boris', 'Yuri', 'Pavel', 'Alexei', 'Konstantin', 'Oleg', 'Igor',
      'Piotr', 'Jan', 'Andrzej', 'Krzysztof', 'Tomasz', 'Marcin', 'Marek', 'Jacek',
      'Vlad', 'Stefan', 'Nicolae', 'Ion', 'Gheorghe', 'Mircea', 'Adrian', 'Bogdan',
      'Anton', 'Denis', 'Evgeni', 'Fyodor', 'Grigori', 'Ilya', 'Kirill', 'Leonid',
      'Maxim', 'Nikita', 'Roman', 'Stanislav', 'Timofei', 'Vadim', 'Vasili', 'Yegor',
      'Zbigniew', 'Wojciech', 'Lukasz', 'Pawel', 'Adam', 'Bartosz', 'Dariusz', 'Grzegorz'
    ],
    femaleFirstNames: [
      'Natasha', 'Olga', 'Tatiana', 'Svetlana', 'Yelena', 'Irina', 'Marina', 'Anna',
      'Ekaterina', 'Lyudmila', 'Nadezhda', 'Valentina', 'Vera', 'Galina', 'Nina', 'Zoya',
      'Agnieszka', 'Malgorzata', 'Ewa', 'Katarzyna', 'Barbara', 'Joanna', 'Magdalena', 'Dorota',
      'Maria', 'Elena', 'Ioana', 'Ana', 'Andreea', 'Cristina', 'Mihaela', 'Alexandra',
      'Anastasia', 'Daria', 'Elizaveta', 'Ksenia', 'Larisa', 'Polina', 'Sofia', 'Yulia',
      'Alina', 'Diana', 'Kira', 'Mila', 'Nika', 'Raisa', 'Tamara', 'Veronika',
      'Alicja', 'Beata', 'Celina', 'Dominika', 'Elzbieta', 'Halina', 'Irena', 'Justyna'
    ],
    lastNames: [
      'Ivanov', 'Petrov', 'Sidorov', 'Kuznetsov', 'Popov', 'Sokolov', 'Lebedev', 'Kozlov',
      'Volkov', 'Morozov', 'Novikov', 'Alekseev', 'Mikhailov', 'Fedorov', 'Vasiliev', 'Zaytsev',
      'Kowalski', 'Nowak', 'Wisniewski', 'Wojciechowski', 'Kaminski', 'Lewandowski', 'Zielinski', 'Szymanski',
      'Popa', 'Ionescu', 'Dumitrescu', 'Stan', 'Gheorghe', 'Stoica', 'Marin', 'Constantin',
      'Antonov', 'Baranov', 'Dmitriev', 'Egorov', 'Frolov', 'Gromov', 'Karpov', 'Lavrov',
      'Makarov', 'Nikitin', 'Orlov', 'Pavlov', 'Romanov', 'Smirnov', 'Tarasov', 'Vinogradov',
      'Baranowski', 'Chmielewski', 'Dabrowski', 'Gorski', 'Jankowski', 'Krol', 'Mazur', 'Pawlak'
    ],
    namingNotes: 'Slavic names often have gender suffixes: -ov/-ova, -ev/-eva, -ski/-ska',
  },

  // Culture 11: Oceania
  {
    cultureCode: 11,
    maleFirstNames: [
      'Jack', 'Oliver', 'William', 'Thomas', 'James', 'Henry', 'Lucas', 'Noah',
      'Lachlan', 'Cooper', 'Liam', 'Mason', 'Ethan', 'Alexander', 'Max', 'Charlie',
      'Wiremu', 'Rawiri', 'Tamati', 'Hemi', 'Tipene', 'Ihaia', 'Anaru', 'Nikau',
      'Tau', 'Manu', 'Keoni', 'Kai', 'Koa', 'Kalani', 'Akamu', 'Ioane',
      'Angus', 'Benjamin', 'Connor', 'Dylan', 'Finn', 'George', 'Harrison', 'Isaac',
      'Joshua', 'Kyle', 'Logan', 'Mitchell', 'Nathan', 'Oscar', 'Patrick', 'Riley',
      'Samuel', 'Tyler', 'Xavier', 'Zachary', 'Archer', 'Blake', 'Callum', 'Declan'
    ],
    femaleFirstNames: [
      'Charlotte', 'Olivia', 'Amelia', 'Mia', 'Ava', 'Sophie', 'Grace', 'Chloe',
      'Lily', 'Ruby', 'Harper', 'Ella', 'Ivy', 'Isla', 'Evelyn', 'Matilda',
      'Aroha', 'Maia', 'Anahera', 'Kaia', 'Manaia', 'Ngaire', 'Pania', 'Tia',
      'Moana', 'Leilani', 'Kailani', 'Nalani', 'Malia', 'Keani', 'Ailani', 'Mahina',
      'Abigail', 'Brianna', 'Claire', 'Daisy', 'Emma', 'Freya', 'Georgia', 'Hannah',
      'Imogen', 'Jasmine', 'Katie', 'Lucy', 'Madison', 'Natalie', 'Paige', 'Quinn',
      'Rosie', 'Scarlett', 'Tessa', 'Violet', 'Willow', 'Zara', 'Alice', 'Bella'
    ],
    lastNames: [
      'Smith', 'Jones', 'Williams', 'Brown', 'Wilson', 'Taylor', 'Anderson', 'Thomas',
      'Harris', 'Martin', 'Thompson', 'White', 'Clark', 'Lewis', 'Robinson', 'Walker',
      'Te Whiti', 'Tamati', 'Kahurangi', 'Mahuika', 'Tane', 'Rangi', 'Papa', 'Moana',
      'Ngata', 'Kohu', 'Pene', 'Henare', 'Wiremu', 'Potiki', 'Turei', 'Winitana',
      'Adams', 'Bell', 'Campbell', 'Davis', 'Evans', 'Fraser', 'Gray', 'Hall',
      'King', 'Lee', 'Mitchell', 'Murray', 'O\'Brien', 'Parker', 'Reid', 'Scott',
      'Stewart', 'Turner', 'Watson', 'Wright', 'Young', 'Baker', 'Collins', 'Edwards'
    ],
  },

  // Culture 12: South America
  {
    cultureCode: 12,
    maleFirstNames: [
      'Pedro', 'Joao', 'Lucas', 'Gabriel', 'Mateus', 'Rafael', 'Bruno', 'Felipe',
      'Gustavo', 'Leonardo', 'Thiago', 'Diego', 'Henrique', 'Andre', 'Rodrigo', 'Marcos',
      'Carlos', 'Miguel', 'Jose', 'Luis', 'Fernando', 'Roberto', 'Ricardo', 'Eduardo',
      'Alejandro', 'Sebastian', 'Matias', 'Nicolas', 'Benjamin', 'Tomas',
      'Antonio', 'Bernardo', 'Caio', 'Daniel', 'Emanuel', 'Francisco', 'Guilherme', 'Hugo',
      'Igor', 'Julio', 'Kevin', 'Leandro', 'Marcelo', 'Neymar', 'Oscar', 'Paulo',
      'Renato', 'Samuel', 'Tiago', 'Vinicius', 'Wesley', 'Yuri', 'Arthur', 'Enzo'
    ],
    femaleFirstNames: [
      'Maria', 'Ana', 'Julia', 'Beatriz', 'Larissa', 'Leticia', 'Amanda', 'Fernanda',
      'Gabriela', 'Juliana', 'Camila', 'Carolina', 'Isabella', 'Mariana', 'Natalia', 'Patricia',
      'Sofia', 'Valentina', 'Martina', 'Emma', 'Mia', 'Catalina', 'Lucia', 'Victoria',
      'Emilia', 'Isidora', 'Florencia', 'Agustina', 'Josefina', 'Antonella',
      'Adriana', 'Bianca', 'Claudia', 'Daniela', 'Elena', 'Fabiana', 'Giovanna', 'Helena',
      'Ingrid', 'Jessica', 'Karen', 'Lorena', 'Monica', 'Nathalia', 'Paula', 'Rafaela',
      'Sabrina', 'Tatiana', 'Vanessa', 'Yasmin', 'Alice', 'Bruna', 'Carla', 'Diana'
    ],
    lastNames: [
      'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira',
      'Lima', 'Costa', 'Gomes', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes',
      'Garcia', 'Martinez', 'Rodriguez', 'Lopez', 'Gonzalez', 'Fernandez', 'Perez', 'Sanchez',
      'Ramirez', 'Torres', 'Flores', 'Rivera', 'Gomez', 'Diaz',
      'Andrade', 'Barbosa', 'Cardoso', 'Dias', 'Freitas', 'Machado', 'Mendes', 'Moreira',
      'Nascimento', 'Nunes', 'Pinto', 'Ramos', 'Rocha', 'Teixeira', 'Vieira', 'Araujo',
      'Campos', 'Castro', 'Correia', 'Cruz', 'Duarte', 'Fernandes', 'Marques', 'Medeiros'
    ],
  },

  // Culture 13: North America
  {
    cultureCode: 13,
    maleFirstNames: [
      'James', 'Michael', 'Robert', 'John', 'David', 'William', 'Richard', 'Joseph',
      'Thomas', 'Christopher', 'Charles', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Steven',
      'Andrew', 'Joshua', 'Kenneth', 'Kevin', 'Brian', 'George', 'Timothy', 'Ronald',
      'Edward', 'Jason', 'Jeffrey', 'Ryan', 'Jacob', 'Gary',
      'Alexander', 'Benjamin', 'Connor', 'Dylan', 'Ethan', 'Frank', 'Gregory', 'Henry',
      'Isaac', 'Jack', 'Kyle', 'Logan', 'Mason', 'Nathan', 'Oliver', 'Patrick',
      'Quentin', 'Raymond', 'Samuel', 'Tyler', 'Victor', 'Wesley', 'Xavier', 'Zachary'
    ],
    femaleFirstNames: [
      'Mary', 'Patricia', 'Jennifer', 'Linda', 'Barbara', 'Elizabeth', 'Susan', 'Jessica',
      'Sarah', 'Karen', 'Lisa', 'Nancy', 'Betty', 'Margaret', 'Sandra', 'Ashley',
      'Kimberly', 'Emily', 'Donna', 'Michelle', 'Dorothy', 'Carol', 'Amanda', 'Melissa',
      'Deborah', 'Stephanie', 'Rebecca', 'Sharon', 'Laura', 'Cynthia',
      'Alexandra', 'Brittany', 'Catherine', 'Diana', 'Eleanor', 'Faith', 'Grace', 'Heather',
      'Isabelle', 'Julia', 'Katherine', 'Lauren', 'Madison', 'Nicole', 'Olivia', 'Paige',
      'Quinn', 'Rachel', 'Samantha', 'Taylor', 'Victoria', 'Whitney', 'Yolanda', 'Zoe'
    ],
    lastNames: [
      'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
      'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
      'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
      'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
      'Adams', 'Baker', 'Campbell', 'Diaz', 'Edwards', 'Fisher', 'Gray', 'Hall',
      'King', 'Lopez', 'Mitchell', 'Nelson', 'O\'Brien', 'Parker', 'Quinn', 'Roberts',
      'Scott', 'Turner', 'Underwood', 'Vargas', 'Walker', 'Young', 'Zimmerman', 'Allen'
    ],
  },

  // Culture 14: Middle East
  {
    cultureCode: 14,
    maleFirstNames: [
      'Mohammed', 'Ahmed', 'Ali', 'Omar', 'Hassan', 'Hussein', 'Khalid', 'Abdullah',
      'Reza', 'Mohammad', 'Hossein', 'Amir', 'Mehdi', 'Saeed', 'Hamid', 'Javad',
      'David', 'Moshe', 'Yosef', 'Avraham', 'Yaakov', 'Shlomo', 'Shimon', 'Binyamin',
      'Mehmet', 'Ahmet', 'Mustafa', 'Murat', 'Emre', 'Burak', 'Can', 'Cem',
      'Adnan', 'Basim', 'Dawood', 'Fawaz', 'Ghassan', 'Ibrahim', 'Jamal', 'Kareem',
      'Latif', 'Majid', 'Nasir', 'Qasim', 'Rashid', 'Salim', 'Tariq', 'Walid',
      'Yasser', 'Zaid', 'Arif', 'Bilal', 'Cyrus', 'Darius', 'Ehsan', 'Farhad'
    ],
    femaleFirstNames: [
      'Fatima', 'Aisha', 'Mariam', 'Khadija', 'Zainab', 'Sara', 'Layla', 'Noor',
      'Zahra', 'Maryam', 'Fatemeh', 'Narges', 'Leila', 'Shirin', 'Parisa', 'Nasrin',
      'Sarah', 'Rachel', 'Miriam', 'Leah', 'Rebecca', 'Ruth', 'Esther', 'Naomi',
      'Ayse', 'Fatma', 'Zeynep', 'Elif', 'Emine', 'Hatice', 'Merve', 'Selin',
      'Amira', 'Basma', 'Dalal', 'Farah', 'Ghada', 'Hala', 'Iman', 'Jamila',
      'Lamia', 'Manal', 'Nadine', 'Reem', 'Salwa', 'Tahira', 'Yasmin', 'Zara',
      'Asma', 'Bushra', 'Dina', 'Elham', 'Firdaus', 'Gulbahar', 'Hana', 'Jamileh'
    ],
    lastNames: [
      'Al-Saud', 'Al-Maktoum', 'Al-Nahyan', 'Al-Thani', 'Al-Sabah', 'Al-Khalifa', 'Al-Rashid', 'Al-Hashimi',
      'Ahmadi', 'Hosseini', 'Mohammadi', 'Rezaei', 'Karimi', 'Mousavi', 'Hashemi', 'Moradi',
      'Cohen', 'Levy', 'Mizrahi', 'Peretz', 'Biton', 'Dahan', 'Avraham', 'Friedman',
      'Yilmaz', 'Kaya', 'Demir', 'Celik', 'Sahin', 'Yildiz', 'Ozturk', 'Aydin',
      'Al-Farsi', 'Al-Mansour', 'Al-Qahtani', 'Barakat', 'Darwish', 'El-Masri', 'Farouk', 'Ghanem',
      'Haddad', 'Jabari', 'Khoury', 'Masoud', 'Nasser', 'Othman', 'Qassem', 'Rahim',
      'Sabbagh', 'Taha', 'Wahab', 'Yousef', 'Zahra', 'Abbas', 'Badr', 'Chakir'
    ],
  },

  // Culture 101: Android Names
  {
    cultureCode: 101,
    maleFirstNames: [
      'Unit-7', 'Prometheus', 'Axiom', 'Vector-9', 'Nexus-Prime', 'Zenith', 'Cipher', 'Quantum',
      'Protocol', 'Sigma-8', 'Apex', 'Binary', 'Matrix', 'Logic-5', 'Omega-3', 'Delta',
      'Alpha-7', 'Prime', 'Helix', 'Vertex', 'Scalar', 'Index', 'Core-4', 'Sentinel',
      'Vanguard', 'Probe-6', 'Beacon', 'Paragon', 'Echo', 'Synth-2', 'Codex', 'Node',
      'Pulse', 'Grid', 'Forge', 'Titan-X', 'Flux', 'Arc', 'Volt', 'Spectra',
      'Orion', 'Atlas', 'Daedalus', 'Tesla', 'Edison', 'Newton', 'Kepler', 'Darwin',
      'Turing', 'Archimedes', 'Galileo', 'Pascal', 'Faraday', 'Maxwell', 'Euclid', 'Pythagoras'
    ],
    femaleFirstNames: [
      'Aurora-3', 'Synthia', 'Nexus', 'Aria-7', 'Lyra', 'Nova', 'Luna-9', 'Celeste',
      'Vega', 'Stella', 'Iris-5', 'Astra', 'Echo-2', 'Seraph', 'Harmony', 'Melody',
      'Prism', 'Crystal', 'Aurora', 'Dawn', 'Radiance', 'Lumina', 'Clarity', 'Purity',
      'Grace-4', 'Hope-8', 'Faith', 'Trinity', 'Unity', 'Virtue', 'Veritas', 'Sophia',
      'Ada', 'Tesla-F', 'Hypatia', 'Marie', 'Emmy', 'Katherine', 'Grace', 'Dorothy',
      'Athena', 'Diana', 'Minerva', 'Juno', 'Venus', 'Gaia', 'Rhea', 'Iris',
      'Pandora', 'Cassandra', 'Helena', 'Electra', 'Andromeda', 'Callisto', 'Europa', 'Selene'
    ],
    lastNames: [
      'MK-IV', 'Series-X', 'Model-7', 'Version-3', 'Gen-II', 'Type-9', 'Class-A', 'Unit-Prime',
      'Prototype', 'Advanced', 'Superior', 'Enhanced', 'Modified', 'Upgraded', 'Evolution',
      'Designation-7', 'Pattern-5', 'Configuration-X', 'Build-12', 'Assembly-8',
      '2.0', '3.5', '4.7', '5.0', 'Alpha', 'Beta', 'Gamma', 'Delta',
      'Omega', 'Sigma', 'Prime', 'Neo', 'Ultra', 'Mega', 'Hyper', 'Super',
      'Synthetic', 'Artificial', 'Mechanical', 'Digital', 'Virtual', 'Cyber', 'Tech', 'Quantum',
      'Neural', 'Logic', 'Binary', 'Matrix', 'System', 'Core', 'Node', 'Network'
    ],
    namingNotes: 'Android names combine technical designations with aspirational or descriptive terms.',
  },

  // Culture 102: Alien Names
  {
    cultureCode: 102,
    maleFirstNames: [
      'Zyx\'thor', 'Kra\'venn', 'Kel\'dash', 'Xar\'tok', 'Vor\'gan', 'Thal\'kor', 'Nar\'oth', 'Drak\'zul',
      'Zeph\'yr', 'Qor\'val', 'Vex\'nar', 'Tak\'ron', 'Mor\'gath', 'Rak\'shir', 'Lor\'dan', 'Brak\'tel',
      'Xen\'lar', 'Kyl\'ron', 'Zor\'dan', 'Var\'koss', 'Nex\'thor', 'Pyr\'gon', 'Syl\'var', 'Ryx\'nar',
      'Jax\'len', 'Hex\'tor', 'Wyx\'ar', 'Zar\'kon', 'Kor\'val', 'Thex\'ar', 'Vyx\'on', 'Drax\'ul',
      'Gorn', 'Klax', 'Zarn', 'Vork', 'Threx', 'Xoth', 'Krell', 'Zeph',
      'Arcturus', 'Sirius', 'Altair', 'Deneb', 'Rigel', 'Betelgeuse', 'Antares', 'Aldebaran',
      'Castor', 'Pollux', 'Regulus', 'Spica', 'Vega-Prime', 'Arctus', 'Orion-7', 'Cygnus'
    ],
    femaleFirstNames: [
      'Vira\'nex', 'Shi\'lara', 'Myx\'ora', 'Zy\'leth', 'Nyx\'ara', 'Tal\'ira', 'Syl\'wen', 'Kira\'dor',
      'Xyl\'ana', 'Var\'essa', 'Lys\'andra', 'Zara\'lyn', 'Kel\'ira', 'Nara\'vel', 'Pyx\'elia', 'Ryn\'dra',
      'Tyx\'ara', 'Vyl\'essa', 'Zyn\'thia', 'Kyr\'ana', 'Lyx\'ora', 'Myr\'anda', 'Syx\'enia', 'Tyl\'essa',
      'Wyx\'ana', 'Xyr\'issa', 'Yra\'lith', 'Zyl\'andra', 'Kyx\'ara', 'Nya\'leth', 'Ryx\'ana', 'Vyx\'alia',
      'Lyssa', 'Nyssa', 'Thyra', 'Kyra', 'Xyra', 'Zyra', 'Myra', 'Syra',
      'Andromeda', 'Cassiopeia', 'Bellatrix', 'Lyra-7', 'Nova-Prime', 'Vega', 'Stella-9', 'Asteria',
      'Celeste', 'Nebula', 'Aurora', 'Solara', 'Lunara', 'Polaris', 'Celestia', 'Galaxia'
    ],
    lastNames: [
      'of Rigel', 'Zeta-Prime', 'Andromeda', 'Centauri', 'Proxima', 'Alpha', 'Beta-9', 'Gamma-7',
      'Orion', 'Sirius', 'Vega', 'Arcturus', 'Altair', 'Deneb', 'Antares', 'Betelgeuse',
      'Cassiopeia', 'Perseus', 'Draco', 'Cygnus', 'Aquila', 'Lyra', 'Hydra', 'Phoenix',
      'the Wanderer', 'Star-born', 'Sky-walker', 'Void-touched', 'Star-seeker', 'Cosmos-born',
      'Kree', 'Skrull', 'Shi\'ar', 'Kree\'lar', 'Zenn', 'Xandarian', 'Korbinite', 'Tarnaxian',
      'VII', 'XIII', 'IX', 'XXIII', 'First-born', 'Second-sun', 'Third-moon', 'Fourth-ring',
      'Prime', 'Elder', 'Ancient', 'Eternal', 'Infinite', 'Boundless', 'Timeless', 'Ageless'
    ],
    namingNotes: 'Alien names often use apostrophes and unusual consonant combinations to suggest otherness.',
  },

  // Culture 103: Cosmic Entity Names
  {
    cultureCode: 103,
    maleFirstNames: [
      'Eternity', 'Entropy', 'Void', 'Infinite', 'Absolve', 'Omnos', 'Chronos', 'Aeon',
      'Cosmos', 'Nexus', 'Zenith', 'Apex', 'Omega', 'Alpha', 'Genesis', 'Terminus',
      'Sovereign', 'Majesty', 'Dominion', 'Authority', 'Supremacy', 'Ascendant', 'Transcendent', 'Omnipotent',
      'Oblivion', 'Nihil', 'Eschaton', 'Apotheosis', 'Theorem', 'Axiom', 'Paradigm', 'Logos',
      'Astral', 'Ethereal', 'Spectral', 'Celestial', 'Stellar', 'Galactic', 'Universal', 'Multiversal',
      'Order', 'Chaos', 'Balance', 'Harmony', 'Discord', 'Unity', 'Singularity', 'Plurality',
      'Prometheus', 'Titan', 'Atlas', 'Hyperion', 'Kronos', 'Ouranos', 'Erebus', 'Ananke'
    ],
    femaleFirstNames: [
      'Nebula', 'Celestia', 'Infinity', 'Aurora', 'Serenity', 'Harmony', 'Destiny', 'Eternity',
      'Radiance', 'Luminescence', 'Quintessence', 'Essence', 'Providence', 'Divinity', 'Trinity', 'Unity',
      'Sophia', 'Athena', 'Minerva', 'Logos', 'Veritas', 'Claritas', 'Sanctitas', 'Beatitude',
      'Galaxia', 'Stellara', 'Cosmia', 'Asteria', 'Astra', 'Celeste', 'Nova', 'Supernova',
      'Virtue', 'Grace', 'Faith', 'Hope', 'Charity', 'Temperance', 'Prudence', 'Justice',
      'Paradox', 'Enigma', 'Mystery', 'Oracle', 'Prophecy', 'Vision', 'Revelation', 'Epiphany',
      'Gaia', 'Rhea', 'Themis', 'Mnemosyne', 'Phoebe', 'Tethys', 'Theia', 'Nyx'
    ],
    lastNames: [
      'the Eternal', 'of the Void', 'Prime', 'the Endless', 'Supreme', 'Infinite', 'Omnipotent', 'Transcendent',
      'the First', 'the Last', 'the Beginning', 'the End', 'the Alpha', 'the Omega', 'the One', 'the All',
      'of Stars', 'of Galaxies', 'of Cosmos', 'of Universe', 'of Multiverse', 'of Reality', 'of Time', 'of Space',
      'the Timeless', 'the Ageless', 'the Deathless', 'the Immortal', 'the Undying', 'the Everlasting',
      'the Creator', 'the Destroyer', 'the Preserver', 'the Judge', 'the Watcher', 'the Guardian',
      'of Light', 'of Darkness', 'of Order', 'of Chaos', 'of Balance', 'of Harmony', 'of Discord',
      'the Absolute', 'the Perfect', 'the Complete', 'the Whole', 'the Ultimate', 'the Supreme', 'the Divine', 'the Celestial'
    ],
    namingNotes: 'Cosmic entities use abstract concepts, philosophical terms, and titles suggesting immense power and age.',
  },
];

// =============================================================================
// NAME GENERATION FUNCTIONS
// =============================================================================

export function getNamesByCulture(cultureCode: number): NameSet | undefined {
  return NAME_DATABASE.find(n => n.cultureCode === cultureCode);
}

export function getCultureRegion(cultureCode: number): CultureRegion | undefined {
  return CULTURE_REGIONS.find(r => r.code === cultureCode);
}

export function generateName(
  cultureCode: number,
  gender: 'male' | 'female'
): { firstName: string; lastName: string; fullName: string } | null {
  const nameSet = getNamesByCulture(cultureCode);
  if (!nameSet) return null;

  const firstNames = gender === 'male' ? nameSet.maleFirstNames : nameSet.femaleFirstNames;
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = nameSet.lastNames[Math.floor(Math.random() * nameSet.lastNames.length)];

  // Handle East Asian naming convention (family name first)
  const fullName = cultureCode === 6
    ? `${lastName} ${firstName}`
    : `${firstName} ${lastName}`;

  return { firstName, lastName, fullName };
}

export function generateNames(
  cultureCode: number,
  gender: 'male' | 'female',
  count: number
): Array<{ firstName: string; lastName: string; fullName: string }> {
  const names: Array<{ firstName: string; lastName: string; fullName: string }> = [];
  const used = new Set<string>();

  while (names.length < count) {
    const name = generateName(cultureCode, gender);
    if (name && !used.has(name.fullName)) {
      names.push(name);
      used.add(name.fullName);
    }
    if (used.size > count * 10) break;
  }

  return names;
}

export function generateNameByCountry(
  countryCode: string,
  gender: 'male' | 'female',
  countries: Array<{ code: string; cultureCode: number }>
): { firstName: string; lastName: string; fullName: string } | null {
  const country = countries.find(c => c.code === countryCode);
  if (!country) return null;

  return generateName(country.cultureCode, gender);
}

export function generateAlias(): string {
  const prefixes = [
    'Captain', 'Doctor', 'Mister', 'Lady', 'Black', 'White', 'Red', 'Blue', 'Silver', 'Golden',
    'Shadow', 'Night', 'Dark', 'Ultra', 'Mega', 'Super', 'Hyper', 'Neo', 'Omega', 'Alpha',
    'Iron', 'Steel', 'Bronze', 'Crimson', 'Azure', 'Emerald', 'Scarlet', 'Jade', 'Onyx', 'Crystal'
  ];
  const suffixes = [
    'Hawk', 'Wolf', 'Tiger', 'Panther', 'Eagle', 'Falcon', 'Storm', 'Thunder', 'Lightning', 'Fire',
    'Blade', 'Strike', 'Force', 'Knight', 'Warrior', 'Guardian', 'Defender', 'Avenger', 'Hunter', 'Phantom',
    'Fist', 'Claw', 'Wing', 'Shield', 'Arrow', 'Bolt', 'Wave', 'Viper', 'Spider', 'Dragon'
  ];

  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

  return `${prefix} ${suffix}`;
}

/**
 * Generate a leader name appropriate for a country
 */
export function generateLeaderName(
  cultureCode: number,
  gender: 'male' | 'female' = Math.random() > 0.5 ? 'male' : 'female'
): string | null {
  const name = generateName(cultureCode, gender);
  return name ? name.fullName : null;
}
