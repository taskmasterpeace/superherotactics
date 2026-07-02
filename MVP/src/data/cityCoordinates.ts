/**
 * Real-world coordinates for all 1050 cities, keyed by City.id.
 * Generated from world knowledge (2026-07); precision ~0.1 deg — far finer than
 * the 9 deg x ~6.9 deg sector cells need.
 *
 * THE grid projection lives here too: latLonToCell/cellToSectorCode are the
 * single source of truth mapping geography onto the 40x24 world grid. The
 * LAT_TOP/LAT_BOTTOM constants are calibrated to /assets/world_map.webp
 * (equirectangular, lon -180..180, lat cropped at the poles).
 */

export const GEO_GRID = {
  COLS: 40,
  ROWS: 24,
  // Fitted to the hand-drawn artwork (anchors: Greenland tip, Cape Agulhas,
  // Cape Horn, Tasmania): latitude is near-linear over 89..-90, longitude is
  // shifted ~9 deg (left edge = -171). Baked city sectors additionally snap
  // to the nearest drawn coastline, so treat latLonToSector as approximate
  // for runtime use; city.sector in allCities.ts is authoritative.
  LON_LEFT: -171,
  LON_RIGHT: 186,
  LAT_TOP: 89,
  LAT_BOTTOM: -90,
} as const

const ROW_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWX'

export function latLonToCell(lat: number, lon: number): { row: number; col: number } {
  const { COLS, ROWS, LON_LEFT, LON_RIGHT, LAT_TOP, LAT_BOTTOM } = GEO_GRID
  const fx = (lon - LON_LEFT) / (LON_RIGHT - LON_LEFT)
  const fy = (LAT_TOP - lat) / (LAT_TOP - LAT_BOTTOM)
  const col = Math.min(COLS - 1, Math.max(0, Math.floor(fx * COLS)))
  const row = Math.min(ROWS - 1, Math.max(0, Math.floor(fy * ROWS)))
  return { row, col }
}

export function cellToSectorCode(row: number, col: number): string {
  return `${ROW_LETTERS[row]}${col + 1}`
}

export function latLonToSector(lat: number, lon: number): string {
  const { row, col } = latLonToCell(lat, lon)
  return cellToSectorCode(row, col)
}

/** Parse a grid sector code like "G12" -> row/col. Returns null if invalid. */
export function sectorCodeToCell(sector: string): { row: number; col: number } | null {
  if (!sector || sector.length < 2) return null
  const row = ROW_LETTERS.indexOf(sector.charAt(0).toUpperCase())
  const col = parseInt(sector.slice(1), 10) - 1
  if (row < 0 || isNaN(col) || col < 0 || col >= GEO_GRID.COLS) return null
  return { row, col }
}

export const CITY_COORDS: Record<number, [number, number]> = {
  1: [34.5, 69.2], // Kabul, Afghanistan
  2: [34.35, 62.2], // Herat, Afghanistan
  3: [36.7, 67.1], // Mazar-e Sharif, Afghanistan
  4: [36.75, 3.06], // Algiers, Algeria
  5: [35.7, -0.63], // Oran, Algeria
  6: [34.67, 3.26], // El Djelfa, Algeria
  7: [-8.84, 13.23], // Luanda, Angola
  8: [-14.92, 13.5], // Lubango, Angola
  9: [-5.55, 12.2], // Cabinda, Angola
  10: [-12.58, 13.4], // Benguela, Angola
  11: [-12.78, 15.74], // Huambo, Angola
  12: [-9.54, 16.34], // Malanje, Angola
  13: [-12.38, 16.94], // Cuito, Angola
  14: [-7.61, 15.06], // Uige, Angola
  15: [-34.6, -58.38], // Buenos Aires, Argentina
  16: [-31.42, -64.18], // Cordoba, Argentina
  17: [-32.95, -60.65], // Rosario, Argentina
  18: [-32.89, -68.85], // Mendoza, Argentina
  19: [-26.82, -65.22], // San Miguel de Tucuman, Argentina
  20: [-34.92, -57.95], // La Plata, Argentina
  21: [-24.78, -65.41], // Salta, Argentina
  22: [-38, -57.55], // Mar Del Plata, Argentina
  23: [-31.63, -60.7], // Santa Fe, Argentina
  24: [-31.54, -68.53], // San Juan, Argentina
  25: [40.74, 44.86], // Dilijan, Armenia
  26: [40.79, 43.85], // Gyumri, Armenia
  27: [40.18, 44.51], // Yerevan, Armenia
  28: [-37.81, 144.96], // Melbourne, Australia
  29: [-33.87, 151.21], // Sydney, Australia
  30: [-27.47, 153.03], // Brisbane, Australia
  31: [-31.95, 115.86], // Perth, Australia
  32: [-34.93, 138.6], // Adelaide, Australia
  33: [-28, 153.43], // Gold Coast, Australia
  34: [48.21, 16.37], // Vienna, Austria
  35: [40.41, 49.87], // Baku, Azerbaijan
  36: [26.23, 50.58], // Manama, Bahrain
  37: [23.81, 90.41], // Dhaka, Bangladesh
  38: [22.34, 91.83], // Chittagong, Bangladesh
  39: [22.82, 89.55], // Khulna, Bangladesh
  40: [24.37, 88.6], // Rajshahi, Bangladesh
  41: [24.9, 91.87], // Sylhet, Bangladesh
  42: [24.85, 89.37], // Bogra, Bangladesh
  43: [23.46, 91.18], // Comilla, Bangladesh
  44: [53.9, 27.57], // Minsk, Belarus
  45: [52.44, 30.98], // Gomel, Belarus
  46: [50.85, 4.35], // Brussels, Belgium
  47: [51.22, 4.4], // Antwerp, Belgium
  48: [50.63, 5.57], // Liege, Belgium
  49: [6.45, 2.36], // Abomey-Calavi, Benin
  50: [6.37, 2.43], // Cotonou, Benin
  51: [-16.5, -68.15], // La Paz, Bolivia
  52: [-17.78, -63.18], // Santa Cruz, Bolivia
  53: [-17.39, -66.16], // Cochabamba, Bolivia
  54: [-23.55, -46.63], // Sao Paulo, Brazil
  55: [-22.91, -43.17], // Rio de Janeiro, Brazil
  56: [-19.92, -43.94], // Belo Horizonte, Brazil
  57: [-15.79, -47.88], // Brasilia, Brazil
  58: [-30.03, -51.23], // Porto Alegre, Brazil
  59: [-8.05, -34.88], // Recife, Brazil
  60: [-3.72, -38.54], // Fortaleza, Brazil
  61: [-12.97, -38.5], // Salvador, Brazil
  62: [-25.43, -49.27], // Curitiba, Brazil
  63: [-22.9, -47.06], // Campinas, Brazil
  64: [-16.68, -49.25], // Goiania, Brazil
  65: [-1.46, -48.5], // Belem, Brazil
  66: [-3.12, -60.02], // Manaus, Brazil
  67: [-20.32, -40.34], // Grande Vitoria, Brazil
  68: [-23.96, -46.33], // Baixada Santista, Brazil
  69: [-2.53, -44.3], // Grande Sao Luis, Brazil
  70: [-5.79, -35.21], // Natal, Brazil
  71: [-7.12, -34.86], // Joao Pessoa, Brazil
  72: [-9.67, -35.74], // Maceio, Brazil
  73: [-26.3, -48.85], // Joinville, Brazil
  74: [-27.6, -48.55], // Florianopolis, Brazil
  75: [-5.09, -42.8], // Teresina, Brazil
  76: [-10.9, -37.1], // Aracaju, Brazil
  77: [-20.5, -54.6], // Campo Grande, Brazil
  78: [-23.3, -51.2], // Londrina, Brazil
  79: [-23.5, -47.5], // Sorocaba, Brazil
  80: [-23.2, -45.9], // Sao Jose dos Campos, Brazil
  81: [-21.2, -47.8], // Ribeirao Preto, Brazil
  82: [-18.9, -48.3], // Uberlandia, Brazil
  83: [-23.2, -46.9], // Jundiai, Brazil
  84: [-12.3, -38.9], // Feira De Santana, Brazil
  85: [-15.6, -56.1], // Cuiaba, Brazil
  86: [-21.8, -43.4], // Juiz De Fora, Brazil
  87: [-19.5, -42.6], // Vale do Aco, Brazil
  88: [-8.8, -63.9], // Porto Velho, Brazil
  89: [42.7, 23.3], // Sofia, Bulgaria
  90: [12.4, -1.5], // Ouagadougou, Burkina Faso
  91: [11.2, -4.3], // Bobo-Dioulasso, Burkina Faso
  92: [-3.4, 29.4], // Bujumbura, Burundi
  93: [11.6, 104.9], // Phnom Penh, Cambodia
  94: [3.9, 11.5], // Yaounde, Cameroon
  95: [4.05, 9.7], // Douala, Cameroon
  96: [5.96, 10.15], // Bamenda, Cameroon
  97: [43.65, -79.38], // Toronto, Canada
  98: [45.5, -73.57], // Montreal, Canada
  99: [49.28, -123.12], // Vancouver, Canada
  100: [51.05, -114.07], // Calgary, Canada
  101: [53.55, -113.49], // Edmonton, Canada
  102: [45.42, -75.7], // Ottawa, Canada
  103: [46.81, -71.21], // Quebec City, Canada
  104: [49.9, -97.14], // Winnipeg, Canada
  105: [43.26, -79.87], // Hamilton, Canada
  106: [43.45, -80.49], // Kitchener, Canada
  107: [42.98, -81.25], // London, Canada
  108: [4.36, 18.56], // Bangui, Central African Republic
  109: [12.11, 15.05], // N-Djamena, Chad
  110: [-33.45, -70.67], // Santiago, Chile
  111: [-33.05, -71.62], // Valparaiso, Chile
  112: [-36.83, -73.05], // Concepcion, Chile
  113: [4.71, -74.07], // Bogota, Colombia
  114: [6.25, -75.56], // Medellin, Colombia
  115: [3.45, -76.53], // Cali, Colombia
  116: [10.96, -74.8], // Barranquilla, Colombia
  117: [7.13, -73.12], // Bucaramanga, Colombia
  118: [10.4, -75.5], // Cartagena, Colombia
  119: [7.89, -72.5], // Cucuta, Colombia
  120: [4.44, -75.2], // Ibague, Colombia
  121: [4.81, -75.7], // Pereira, Colombia
  122: [4.14, -73.63], // Villavicencio, Colombia
  123: [10.46, -73.25], // Valledupar, Colombia
  124: [11.24, -74.2], // Santa Marta, Colombia
  125: [9.93, -84.08], // San Jose, Costa Rica
  126: [45.81, 15.98], // Zagreb, Croatia
  127: [23.13, -82.38], // Havana, Cuba
  128: [50.08, 14.44], // Prague, Czech Republic
  129: [55.68, 12.57], // Copenhagen, Denmark
  130: [11.59, 43.15], // Djibouti, Djibouti
  131: [18.47, -69.9], // Santo Domingo, Dominican Republic
  132: [19.45, -70.7], // Santiago, Dominican Republic
  133: [-4.32, 15.31], // Kinshasa, DR Congo
  134: [-6.15, 23.6], // Mbuji-Mayi, DR Congo
  135: [-11.66, 27.48], // Lubumbashi, DR Congo
  136: [-5.9, 22.42], // Kananga, DR Congo
  137: [0.52, 25.2], // Kisangani, DR Congo
  138: [-2.5, 28.86], // Bukavu, DR Congo
  139: [-6.42, 20.8], // Tshikapa, DR Congo
  140: [1.57, 30.25], // Bunia, DR Congo
  141: [-1.68, 29.22], // Goma, DR Congo
  142: [-3.4, 29.14], // Uvira, DR Congo
  143: [-10.98, 26.73], // Likasi, DR Congo
  144: [-5.04, 18.82], // Kikwit, DR Congo
  145: [-2.19, -79.89], // Guayaquil, Ecuador
  146: [-0.18, -78.47], // Quito, Ecuador
  147: [30.04, 31.24], // Cairo, Egypt
  148: [31.2, 29.92], // Alexandria, Egypt
  149: [31.26, 32.3], // Bur Sa'id, Egypt
  150: [29.97, 32.55], // As-Suways, Egypt
  151: [31.05, 31.38], // Al-Mansurah, Egypt
  152: [30.97, 31.17], // Al-Mahallah al-Kubra, Egypt
  153: [30.79, 31], // Tanta, Egypt
  154: [13.69, -89.19], // San Salvador, El Salvador
  155: [15.34, 38.93], // Asmara, Eritrea
  156: [9.03, 38.74], // Addis Ababa, Ethiopia
  157: [13.5, 39.47], // Mekele, Ethiopia
  158: [60.17, 24.94], // Helsinki, Finland
  159: [48.86, 2.35], // Paris, France
  160: [45.76, 4.84], // Lyon, France
  161: [43.3, 5.37], // Marseille, France
  162: [50.63, 3.06], // Lille, France
  163: [43.6, 1.44], // Toulouse, France
  164: [44.84, -0.58], // Bordeaux, France
  165: [43.7, 7.27], // Nice, France
  166: [47.22, -1.55], // Nantes, France
  167: [43.12, 5.93], // Toulon, France
  168: [45.19, 5.72], // Grenoble, France
  169: [50.37, 3.08], // Douai-Lens, France
  170: [0.39, 9.45], // Libreville, Gabon
  171: [41.72, 44.79], // Tbilisi, Georgia
  172: [52.52, 13.4], // Berlin, Germany
  173: [53.55, 9.99], // Hamburg, Germany
  174: [48.14, 11.58], // Munich, Germany
  175: [50.94, 6.96], // Cologne, Germany
  176: [50.11, 8.68], // Frankfurt, Germany
  177: [48.78, 9.18], // Stuttgart, Germany
  178: [51.23, 6.78], // Duesseldorf, Germany
  179: [51.34, 12.37], // Leipzig, Germany
  180: [51.51, 7.47], // Dortmund, Germany
  181: [51.46, 7.01], // Essen, Germany
  182: [51.05, 13.74], // Dresden, Germany
  183: [53.08, 8.8], // Bremen, Germany
  184: [52.37, 9.73], // Hannover, Germany
  185: [51.43, 6.76], // Duisburg, Germany
  186: [49.45, 11.08], // Nurenberg, Germany
  187: [6.69, -1.62], // Kumasi, Ghana
  188: [5.56, -0.19], // Accra, Ghana
  189: [4.93, -1.71], // Sekondi Takoradi, Ghana
  190: [9.4, -0.84], // Tamale, Ghana
  191: [37.98, 23.73], // Athens, Greece
  192: [40.64, 22.94], // Thessaloniki, Greece
  193: [14.63, -90.51], // Guatemala City, Guatemala
  194: [9.51, -13.71], // Conakry, Guinea
  195: [11.86, -15.6], // Bissau, Guinea-Bissau
  196: [18.54, -72.34], // Port-au-Prince, Haiti
  197: [14.07, -87.19], // Tegucigalpa, Honduras
  198: [15.5, -88.03], // San Pedro Sula, Honduras
  199: [22.32, 114.17], // Hong Kong, Hong Kong
  200: [47.5, 19.04], // Budapest, Hungary
  201: [28.61, 77.21], // Delhi, India
  202: [19.08, 72.88], // Mumbai, India
  203: [22.57, 88.36], // Kolkata, India
  204: [12.97, 77.59], // Bangalore, India
  205: [13.08, 80.27], // Chennai, India
  206: [17.38, 78.48], // Hyderabad, India
  207: [23.03, 72.58], // Ahmedabad, India
  208: [21.17, 72.83], // Surat, India
  209: [18.52, 73.86], // Pune, India
  210: [26.91, 75.79], // Jaipur, India
  211: [26.85, 80.95], // Lucknow, India
  212: [11.26, 75.78], // Kozhikode, India
  213: [11.05, 76.07], // Malappuram, India
  214: [26.45, 80.33], // Kanpur, India
  215: [9.93, 76.27], // Kochi, India
  216: [10.53, 76.21], // Thrissur, India
  217: [22.72, 75.86], // Indore, India
  218: [21.15, 79.09], // Nagpur, India
  219: [11.02, 76.96], // Coimbatore, India
  220: [8.52, 76.94], // Thiruvananthapuram, India
  221: [25.6, 85.14], // Patna, India
  222: [23.26, 77.41], // Bhopal, India
  223: [27.18, 78.01], // Agra, India
  224: [22.31, 73.19], // Vadodara, India
  225: [17.69, 83.22], // Visakhapatnam, India
  226: [11.87, 75.37], // Kannur, India
  227: [20, 73.79], // Nashik, India
  228: [16.51, 80.65], // Vijayawada, India
  229: [22.3, 70.8], // Rajkot, India
  230: [30.9, 75.85], // Ludhiana, India
  231: [8.89, 76.61], // Kollam, India
  232: [9.92, 78.12], // Madurai, India
  233: [28.98, 77.71], // Meerut, India
  234: [25.32, 83], // Varanasi, India
  235: [21.25, 81.63], // Raipur, India
  236: [22.8, 86.2], // Jamshedpur, India
  237: [34.08, 74.8], // Srinagar, India
  238: [19.88, 75.34], // Aurangabad, India
  239: [11.1, 77.35], // Tiruppur, India
  240: [26.29, 73.02], // Jodhpur, India
  241: [23.17, 79.94], // Jabalpur, India
  242: [23.36, 85.33], // Ranchi, India
  243: [23.68, 86.98], // Asansol, India
  244: [25.44, 81.85], // Allahabad, India
  245: [25.18, 75.83], // Kota, India
  246: [26.22, 78.18], // Gwalior, India
  247: [31.63, 74.87], // Amritsar, India
  248: [23.8, 86.43], // Dhanbad, India
  249: [28.36, 79.42], // Bareilly, India
  250: [27.88, 78.08], // Aligarh, India
  251: [12.3, 76.65], // Mysore, India
  252: [21.19, 81.28], // Durg-Bhilainagar, India
  253: [28.84, 78.77], // Moradabad, India
  254: [10.79, 78.7], // Tiruchirappalli, India
  255: [20.27, 85.84], // Bhubaneswar, India
  256: [30.73, 76.78], // Chandigarh, India
  257: [26.14, 91.74], // Guwahati, India
  258: [15.36, 75.12], // Hubli-Dharwad, India
  259: [11.66, 78.15], // Salem, India
  260: [29.97, 77.55], // Saharanpur, India
  261: [31.33, 75.58], // Jalandhar, India
  262: [17.66, 75.9], // Solapur, India
  263: [26.73, 88.42], // Siliguri, India
  264: [17.98, 79.6], // Warangal, India
  265: [30.32, 78.03], // Dehradun, India
  266: [19.3, 73.06], // Bhiwandi, India
  267: [16.31, 80.44], // Guntur, India
  268: [11.93, 79.83], // Puducherry, India
  269: [27.15, 78.4], // Firozabad, India
  270: [28.02, 73.31], // Bikaner, India
  271: [9.68, 76.34], // Cherthala, India
  272: [26.76, 83.37], // Gorakhpur, India
  273: [20.93, 77.75], // Amravati, India
  274: [14.44, 79.99], // Nellore, India
  275: [20.46, 85.88], // Cuttack, India
  276: [15.85, 74.5], // Belgaum, India
  277: [29.47, 77.7], // Muzaffarnagar, India
  278: [20.55, 74.53], // Malegaon, India
  279: [12.87, 74.84], // Mangalore, India
  280: [32.73, 74.87], // Jammu, India
  281: [21.76, 72.15], // Bhavnagar, India
  282: [9.59, 76.52], // Kottayam, India
  283: [9.17, 76.5], // Kayamkulam, India
  284: [19.15, 77.3], // Nanded Waghala, India
  285: [13.63, 79.42], // Tirupati, India
  286: [23.55, 87.29], // Durgapur, India
  287: [17.33, 76.83], // Gulbarga, India
  288: [15.83, 78.04], // Kurnool, India
  289: [22.47, 70.07], // Jamnagar, India
  290: [25.45, 78.57], // Jhansi, India
  291: [11.34, 77.72], // Erode, India
  292: [23.67, 86.15], // Bokaro Steel City, India
  293: [22.25, 84.88], // Raurkela, India
  294: [16.7, 74.24], // Kolhapur, India
  295: [26.45, 74.64], // Ajmer, India
  296: [23.18, 75.78], // Ujjain, India
  297: [22.08, 82.15], // Bilaspur, India
  298: [30.34, 76.39], // Patiala, India
  299: [27.49, 77.67], // Mathura, India
  300: [16.85, 74.57], // Sangli, India
  301: [24.8, 93.9], // Imphal, India
  302: [23.8, 91.3], // Agartala, India
  303: [24.6, 73.7], // Udaipur, India
  304: [12.9, 79.1], // Vellore, India
  305: [8.7, 77.7], // Tirunelveli, India
  306: [24.8, 85], // Gaya, India
  307: [21, 75.6], // Jalgaon, India
  308: [8.8, 78.1], // Thoothukkudi, India
  309: [29.4, 77], // Panipat, India
  310: [17, 81.8], // Rajahmundry, India
  311: [15.1, 76.9], // Bellary, India
  312: [16.9, 82.2], // Kakinada, India
  313: [14.5, 75.9], // Davanagere, India
  314: [26.1, 85.4], // Muzaffarpur, India
  315: [-6.2, 106.8], // Jakarta, Indonesia
  316: [-6.2, 107], // Bekasi, Indonesia
  317: [-7.3, 112.7], // Surabaya, Indonesia
  318: [-6.4, 106.8], // Depok, Indonesia
  319: [-6.9, 107.6], // Bandung, Indonesia
  320: [-6.2, 106.6], // Tangerang, Indonesia
  321: [3.6, 98.7], // Medan, Indonesia
  322: [-7, 110.4], // Semarang, Indonesia
  323: [-3, 104.8], // Palembang, Indonesia
  324: [-5.1, 119.4], // Makassar, Indonesia
  325: [1.1, 104], // Batam, Indonesia
  326: [0.5, 101.4], // Pekan Baru, Indonesia
  327: [-6.6, 106.8], // Bogor, Indonesia
  328: [-5.4, 105.3], // Bandar Lampung, Indonesia
  329: [-7.3, 108.2], // Tasikmalaya, Indonesia
  330: [-0.5, 117.1], // Samarinda, Indonesia
  331: [-8.7, 115.2], // Denpasar, Indonesia
  332: [-0.9, 100.4], // Padang, Indonesia
  333: [-8, 112.6], // Malang, Indonesia
  334: [-3.3, 114.6], // Banjarmasin, Indonesia
  335: [-8.4, 115.2], // Bali, Indonesia
  336: [0, 109.3], // Pontianak, Indonesia
  337: [-1.6, 103.6], // Jambi, Indonesia
  338: [-7.6, 110.8], // Surakarta, Indonesia
  339: [-3.7, 128.2], // Ambon, Indonesia
  340: [-8.6, 116.1], // Mataram, Indonesia
  341: [35.7, 51.4], // Tehran, Iran
  342: [36.3, 59.6], // Mashhad, Iran
  343: [32.7, 51.7], // Esfahan, Iran
  344: [29.6, 52.5], // Shiraz, Iran
  345: [38.1, 46.3], // Tabriz, Iran
  346: [35.8, 51], // Karaj, Iran
  347: [34.6, 50.9], // Qom, Iran
  348: [31.3, 48.7], // Ahvaz, Iran
  349: [34.3, 47.1], // Kermanshah, Iran
  350: [37.6, 45.1], // Orumiyeh, Iran
  351: [37.3, 49.6], // Rasht, Iran
  352: [29.5, 60.9], // Zahedan, Iran
  353: [27.2, 56.3], // Bandar Abbas, Iran
  354: [34.8, 48.5], // Hamadan, Iran
  355: [38.2, 48.3], // Ardabil, Iran
  356: [31.9, 54.4], // Yazd, Iran
  357: [34.1, 49.7], // Arak, Iran
  358: [30.3, 57.1], // Kerman, Iran
  359: [33.3, 44.4], // Baghdad, Iraq
  360: [36.3, 43.1], // Mosul, Iraq
  361: [30.5, 47.8], // Basrah, Iraq
  362: [35.5, 44.4], // Kirkuk, Iraq
  363: [32, 44.3], // Najaf, Iraq
  364: [36.2, 44], // Erbil, Iraq
  365: [35.6, 45.4], // Sulaimaniya, Iraq
  366: [31.8, 47.1], // Amara, Iraq
  367: [31, 46.3], // Nasiriyah, Iraq
  368: [32.5, 44.4], // Hillah, Iraq
  369: [32.6, 44], // Karbala, Iraq
  370: [32, 44.9], // Diwaniyah, Iraq
  371: [53.3, -6.3], // Dublin, Ireland
  372: [32.1, 34.8], // Tel Aviv, Israel
  373: [32.8, 35], // Haifa, Israel
  374: [31.8, 35.2], // Jerusalem, Israel
  375: [31.3, 34.8], // Be'er Sheva, Israel
  376: [41.9, 12.5], // Rome, Italy
  377: [45.46, 9.19], // Milan, Italy
  378: [40.85, 14.27], // Naples, Italy
  379: [45.07, 7.69], // Turin, Italy
  380: [45.7, 9.67], // Bergamo, Italy
  381: [38.12, 13.36], // Palermo, Italy
  382: [44.49, 11.34], // Bologna, Italy
  383: [43.77, 11.26], // Florence, Italy
  384: [45.41, 11.88], // Padova, Italy
  385: [44.41, 8.93], // Genoa, Italy
  386: [45.61, 8.85], // Busto Arsizio, Italy
  387: [45.44, 12.34], // Venezia, Italy
  388: [45.44, 10.99], // Verona, Italy
  389: [41.12, 16.87], // Bari, Italy
  390: [45.65, 9.2], // Seregno, Italy
  391: [37.5, 15.09], // Catania, Italy
  392: [5.34, -4.03], // Abidjan, Ivory Coast
  393: [7.69, -5.03], // Bouake, Ivory Coast
  394: [18, -76.8], // Kingston, Jamaica
  395: [35.68, 139.69], // Tokyo, Japan
  396: [34.69, 135.5], // Osaka, Japan
  397: [35.18, 136.9], // Nagoya, Japan
  398: [33.59, 130.4], // Fukuoka, Japan
  399: [34.98, 138.38], // Shizuoka, Japan
  400: [43.06, 141.35], // Sapporo, Japan
  401: [38.27, 140.87], // Sendai, Japan
  402: [34.39, 132.46], // Hiroshima, Japan
  403: [37.9, 139.02], // Niigata, Japan
  404: [32.8, 130.71], // Kumamoto, Japan
  405: [34.66, 133.92], // Okayama, Japan
  406: [31.6, 130.56], // Kagoshima, Japan
  407: [36.56, 139.88], // Utsunomiya, Japan
  408: [33.84, 132.77], // Matsuyama, Japan
  409: [31.95, 35.93], // Amman, Jordan
  410: [32.07, 36.09], // Zarqa, Jordan
  411: [32.55, 35.85], // Irbid, Jordan
  412: [32.02, 36.05], // Ar-Rusayfah, Jordan
  413: [43.24, 76.9], // Almaty, Kazakhstan
  414: [51.17, 71.43], // Astana, Kazakhstan
  415: [42.32, 69.6], // Shimkent, Kazakhstan
  416: [49.8, 73.1], // Karaganda, Kazakhstan
  417: [-1.29, 36.82], // Nairobi, Kenya
  418: [-4.05, 39.67], // Mombasa, Kenya
  419: [29.38, 47.98], // Kuwait City, Kuwait
  420: [42.87, 74.59], // Bishkek, Kyrgyzstan
  421: [17.97, 102.6], // Vientiane, Laos
  422: [56.95, 24.11], // Riga, Latvia
  423: [33.89, 35.5], // Beirut, Lebanon
  424: [6.3, -10.8], // Monrovia, Liberia
  425: [32.89, 13.19], // Tripoli, Libya
  426: [32.38, 15.09], // Misratah, Libya
  427: [32.12, 20.07], // Banghazi, Libya
  428: [54.69, 25.28], // Vilnius, Lithuania
  429: [-18.88, 47.51], // Antananarivo, Madagascar
  430: [-13.97, 33.79], // Lilongwe, Malawi
  431: [-15.79, 35], // Blantyre-Limbe, Malawi
  432: [3.14, 101.69], // Kuala Lumpur, Malaysia
  433: [1.49, 103.74], // Johor Bahru, Malaysia
  434: [4.6, 101.07], // Ipoh, Malaysia
  435: [1.55, 110.34], // Kuching, Malaysia
  436: [5.98, 116.07], // Kota Kinabalu, Malaysia
  437: [3.82, 103.33], // Kuantan, Malaysia
  438: [12.65, -8], // Bamako, Mali
  439: [18.09, -15.98], // Nouakchott, Mauritania
  440: [19.43, -99.13], // Mexico City, Mexico
  441: [20.67, -103.35], // Guadalajara, Mexico
  442: [25.67, -100.31], // Monterrey, Mexico
  443: [19.04, -98.2], // Puebla, Mexico
  444: [19.29, -99.66], // Toluca de Lerdo, Mexico
  445: [32.52, -117.02], // Tijuana, Mexico
  446: [21.12, -101.68], // Leon de los Aldamas, Mexico
  447: [25.54, -103.45], // La Laguna, Mexico
  448: [31.74, -106.49], // Ciudad Juarez, Mexico
  449: [20.59, -100.39], // Queretaro, Mexico
  450: [22.15, -100.98], // San Luis Potosi, Mexico
  451: [20.97, -89.62], // Merida, Mexico
  452: [32.66, -115.47], // Mexicali, Mexico
  453: [21.88, -102.29], // Aguascalientes, Mexico
  454: [18.92, -99.23], // Cuernavaca, Mexico
  455: [28.63, -106.08], // Chihuahua, Mexico
  456: [22.25, -97.86], // Tampico, Mexico
  457: [25.42, -101], // Saltillo, Mexico
  458: [16.86, -99.88], // Acapulco de Juarez, Mexico
  459: [19.7, -101.19], // Morelia, Mexico
  460: [21.16, -86.85], // Cancun, Mexico
  461: [19.19, -96.14], // Veracruz Ver, Mexico
  462: [26.09, -98.28], // Reynosa, Mexico
  463: [17.99, -92.93], // Villahermosa, Mexico
  464: [29.07, -110.96], // Hermosillo, Mexico
  465: [16.75, -93.12], // Tuxtla Gutierrez, Mexico
  466: [24.8, -107.39], // Culiacan, Mexico
  467: [19.54, -96.91], // Xalapa, Mexico
  468: [17.07, -96.72], // Oaxaca de Juarez, Mexico
  469: [20.52, -100.81], // Celaya, Mexico
  470: [20.12, -98.74], // Pachuca de Soto, Mexico
  471: [24.02, -104.65], // Durango, Mexico
  472: [19.32, -98.24], // Tlaxcala, Mexico
  473: [20.53, -97.46], // Poza Rica de Hidalgo, Mexico
  474: [25.87, -97.5], // Matamoros, Mexico
  475: [21.51, -104.89], // Tepic, Mexico
  476: [18.81, -98.95], // Cuautla Morelos, Mexico
  477: [20.62, -105.23], // Puerto Vallarta, Mexico
  478: [47.92, 106.92], // Ulaanbaatar, Mongolia
  479: [33.57, -7.59], // Casablanca, Morocco
  480: [34.02, -6.84], // Rabat, Morocco
  481: [34.03, -5], // Fes, Morocco
  482: [35.77, -5.8], // Tanger, Morocco
  483: [31.63, -8], // Marrakech, Morocco
  484: [30.42, -9.6], // Agadir, Morocco
  485: [34.68, -1.91], // Oujda, Morocco
  486: [33.9, -5.55], // Meknes, Morocco
  487: [-25.96, 32.46], // Matola, Mozambique
  488: [-25.97, 32.58], // Maputo, Mozambique
  489: [-15.12, 39.27], // Nampula, Mozambique
  490: [-19.83, 34.85], // Beira, Mozambique
  491: [16.87, 96.2], // Yangon, Myanmar
  492: [21.98, 96.08], // Mandalay, Myanmar
  493: [19.76, 96.08], // Nay Pyi Taw, Myanmar
  494: [27.72, 85.32], // Kathmandu, Nepal
  495: [52.37, 4.9], // Amsterdam, Netherlands
  496: [51.92, 4.48], // Rotterdam, Netherlands
  497: [52.08, 4.3], // The Hague, Netherlands
  498: [52.09, 5.12], // Utrecht, Netherlands
  499: [-36.85, 174.76], // Auckland, New Zealand
  500: [12.14, -86.25], // Managua, Nicaragua
  501: [13.51, 2.11], // Niamey, Niger
  502: [6.52, 3.38], // Lagos, Nigeria
  503: [12, 8.52], // Kano, Nigeria
  504: [7.38, 3.9], // Ibadan, Nigeria
  505: [9.06, 7.49], // Abuja, Nigeria
  506: [10.61, 12.19], // Biu, Nigeria
  507: [4.82, 7.03], // Port Harcourt, Nigeria
  508: [6.34, 5.62], // Benin, Nigeria
  509: [6.15, 6.79], // Onitsha, Nigeria
  510: [5.04, 7.92], // Uyo, Nigeria
  511: [10.52, 7.44], // Kaduna, Nigeria
  512: [10.29, 11.17], // Gombe, Nigeria
  513: [5.11, 7.37], // Aba, Nigeria
  514: [6.02, 6.92], // Nnewi, Nigeria
  515: [8.5, 4.55], // Ilorin, Nigeria
  516: [6.62, 3.51], // Ikorodu, Nigeria
  517: [9.93, 8.89], // Jos, Nigeria
  518: [5.48, 7.03], // Owerri, Nigeria
  519: [5.52, 5.75], // Warri, Nigeria
  520: [11.85, 13.16], // Maiduguri, Nigeria
  521: [5.53, 7.49], // Umuahia, Nigeria
  522: [6.44, 7.5], // Enugu, Nigeria
  523: [11.08, 7.71], // Zaria, Nigeria
  524: [7.77, 4.56], // Oshogbo, Nigeria
  525: [7.8, 6.74], // Lokoja, Nigeria
  526: [7.25, 5.2], // Akure, Nigeria
  527: [13.06, 5.24], // Sokoto, Nigeria
  528: [10.31, 9.84], // Bauchi, Nigeria
  529: [4.96, 8.33], // Calabar, Nigeria
  530: [6.32, 8.11], // Abakaliki, Nigeria
  531: [8.13, 4.25], // Ogbomosho, Nigeria
  532: [7.15, 3.35], // Abeokuta, Nigeria
  533: [10.29, 11.17], // Gombe, Nigeria
  534: [39.03, 125.75], // Pyongyang, North Korea
  535: [41.79, 129.78], // Chongjin, North Korea
  536: [39.92, 127.54], // Hamhung, North Korea
  537: [63.44, 10.9], // Hell, Norway
  538: [59.91, 10.75], // Oslo, Norway
  539: [23.59, 58.41], // Muscat, Oman
  540: [24.86, 67.01], // Karachi, Pakistan
  541: [31.55, 74.34], // Lahore, Pakistan
  542: [31.42, 73.08], // Faisalabad, Pakistan
  543: [33.6, 73.04], // Rawalpindi, Pakistan
  544: [32.16, 74.19], // Gujranwala, Pakistan
  545: [34.01, 71.58], // Peshawar, Pakistan
  546: [30.2, 71.45], // Multan, Pakistan
  547: [25.38, 68.37], // Hyderabad, Pakistan
  548: [33.68, 73.05], // Islamabad, Pakistan
  549: [30.18, 66.99], // Quetta, Pakistan
  550: [29.4, 71.68], // Bahawalpur, Pakistan
  551: [32.49, 74.53], // Sialkot, Pakistan
  552: [32.08, 72.67], // Sargodha, Pakistan
  553: [27.7, 68.87], // Sukkur, Pakistan
  554: [27.56, 68.21], // Larkana, Pakistan
  555: [31.71, 73.98], // Sheikhupura, Pakistan
  556: [31.5, 34.47], // Gaza, Palestine
  557: [8.98, -79.52], // Panama City, Panama
  558: [-25.28, -57.63], // Asuncion, Paraguay
  559: [-12.05, -77.04], // Lima, Peru
  560: [-16.4, -71.54], // Arequipa, Peru
  561: [-8.11, -79.03], // Trujillo, Peru
  562: [-6.77, -79.84], // Chiclayo, Peru
  563: [14.6, 120.98], // Manila, Philippines
  564: [7.07, 125.61], // Davao City, Philippines
  565: [10.32, 123.9], // Cebu City, Philippines
  566: [6.92, 122.08], // Zamboanga City, Philippines
  567: [14.59, 121.18], // Antipolo, Philippines
  568: [8.48, 124.65], // Cagayan de Oro City, Philippines
  569: [14.33, 120.94], // Dasmarinas, Philippines
  570: [14.46, 120.94], // Bacoor, Philippines
  571: [6.11, 125.17], // General Santos City, Philippines
  572: [10.68, 122.95], // Bacolod, Philippines
  573: [14.81, 121.05], // San Jose del Monte, Philippines
  574: [6.7, 121.97], // Basilan City, Philippines
  575: [14.43, 120.94], // Imus, Philippines
  576: [14.21, 121.16], // Calamba, Philippines
  577: [15.15, 120.58], // Angeles City, Philippines
  578: [52.23, 21.01], // Warsaw, Poland
  579: [50.06, 19.94], // Krakow, Poland
  580: [51.76, 19.46], // Lodz, Poland
  581: [51.11, 17.03], // Wroclaw, Poland
  582: [52.41, 16.93], // Poznan, Poland
  583: [38.72, -9.14], // Lisbon, Portugal
  584: [41.15, -8.61], // Porto, Portugal
  585: [18.47, -66.11], // San Juan, Puerto Rico
  586: [25.29, 51.42], // Ar-Rayyan, Qatar
  587: [25.29, 51.53], // Doha, Qatar
  588: [-4.27, 15.28], // Brazzaville, Republic of the Congo
  589: [-4.79, 11.85], // Pointe-Noire, Republic of the Congo
  590: [44.43, 26.1], // Bucharest, Romania
  591: [55.76, 37.62], // Moscow, Russia
  592: [59.94, 30.31], // Saint Petersburg, Russia
  593: [55.03, 82.92], // Novosibirsk, Russia
  594: [56.84, 60.61], // Yekaterinburg, Russia
  595: [55.93, 37.51], // Dolgoprudny, Russia
  596: [55.79, 49.12], // Kazan, Russia
  597: [56.33, 44], // Nizhniy Novgorod, Russia
  598: [55.16, 61.4], // Chelyabinsk, Russia
  599: [54.99, 73.37], // Omsk, Russia
  600: [53.2, 50.15], // Samara, Russia
  601: [56, 92.9], // Krasnoyarsk, Russia
  602: [54.7, 56], // Ufa, Russia
  603: [47.2, 39.7], // Rostov-on-Don, Russia
  604: [58, 56.2], // Perm, Russia
  605: [51.7, 39.2], // Voronezh, Russia
  606: [48.7, 44.5], // Volgograd, Russia
  607: [45, 39], // Krasnodar, Russia
  608: [57.2, 65.5], // Tyumen, Russia
  609: [51.5, 46], // Saratov, Russia
  610: [53.5, 49.4], // Tolyatti, Russia
  611: [56.8, 53.2], // Izhevsk, Russia
  612: [53.3, 83.8], // Barnaul, Russia
  613: [52.3, 104.3], // Irkutsk, Russia
  614: [48.5, 135.1], // Khabarovsk, Russia
  615: [68.97, 33.1], // Murmansk, Russia
  616: [54.3, 48.4], // Ulyanovsk, Russia
  617: [57.6, 39.9], // Yaroslavl, Russia
  618: [43.1, 131.9], // Vladivostok, Russia
  619: [42.98, 47.5], // Makhachkala, Russia
  620: [56.5, 85], // Tomsk, Russia
  621: [51.8, 55.1], // Orenburg, Russia
  622: [55.35, 86.1], // Kemerovo, Russia
  623: [54.7, 20.5], // Kaliningrad, Russia
  624: [53.75, 87.1], // Novokuznetsk, Russia
  625: [54.6, 39.7], // Ryazan, Russia
  626: [46.35, 48], // Astrakhan, Russia
  627: [55.7, 52.4], // Naberezhnye Tchelny, Russia
  628: [53.2, 45], // Penza, Russia
  629: [55.8, 37.95], // Balashikha, Russia
  630: [58.6, 49.7], // Kirov, Russia
  631: [52.6, 39.6], // Lipetsk, Russia
  632: [56.1, 47.25], // Cheboksary, Russia
  633: [-1.95, 30.06], // Kigali, Rwanda
  634: [24.7, 46.7], // Riyadh, Saudi Arabia
  635: [21.5, 39.2], // Jiddah, Saudi Arabia
  636: [21.4, 39.8], // Mecca, Saudi Arabia
  637: [24.5, 39.6], // Medina, Saudi Arabia
  638: [26.4, 50.1], // Ad-Dammam, Saudi Arabia
  639: [25.4, 49.6], // Hufuf-Mubarraz, Saudi Arabia
  640: [21.3, 40.4], // Taif, Saudi Arabia
  641: [26.3, 43.97], // Buraydah, Saudi Arabia
  642: [28.4, 36.6], // Tabuk, Saudi Arabia
  643: [27, 49.65], // Al Jubail, Saudi Arabia
  644: [18.3, 42.7], // Khamis Mushayt, Saudi Arabia
  645: [14.7, -17.45], // Dakar, Senegal
  646: [44.8, 20.45], // Belgrade, Serbia
  647: [8.5, -13.25], // Freetown, Sierra Leone
  648: [1.35, 103.85], // Singapore, Singapore
  649: [2.05, 45.3], // Mogadishu, Somalia
  650: [-0.36, 42.55], // Kismayo, Somalia
  651: [10.4, 45], // Berbera, Somalia
  652: [9.56, 44.07], // Hargeysa, Somalia
  653: [9.56, 44.07], // Hargeisa, Somalia
  654: [9.5, 45.5], // Burao, Somalia
  655: [8.2, 46.3], // Bohotle, Somalia
  656: [1.7, 44.77], // Merca, Somalia
  657: [-26.2, 28.05], // Johannesburg, South Africa
  658: [-33.9, 18.4], // Cape Town, South Africa
  659: [-26.15, 28.35], // Ekurhuleni, South Africa
  660: [-29.85, 31], // Durban, South Africa
  661: [-25.75, 28.2], // Pretoria, South Africa
  662: [-33.96, 25.6], // Port Elizabeth, South Africa
  663: [-26.15, 27.7], // West Rand, South Africa
  664: [-25.5, 28.1], // Soshanguve, South Africa
  665: [-26.67, 27.93], // Vereeniging, South Africa
  666: [-33, 27.9], // Buffalo City, South Africa
  667: [-29.1, 26.2], // Bloemfontein, South Africa
  668: [-29.6, 30.4], // Pietermaritzburg, South Africa
  669: [-25.65, 27.25], // Rustenburg, South Africa
  670: [37.57, 126.98], // Seoul, South Korea
  671: [35.1, 129.05], // Busan, South Korea
  672: [37.45, 126.7], // Incheon, South Korea
  673: [35.87, 128.6], // Daegu, South Korea
  674: [36.35, 127.38], // Daejon, South Korea
  675: [35.15, 126.85], // Gwangju, South Korea
  676: [37.26, 127.01], // Suweon, South Korea
  677: [37.24, 127.18], // Yongin, South Korea
  678: [37.66, 126.83], // Goyang, South Korea
  679: [35.23, 128.68], // Changwon, South Korea
  680: [37.44, 127.14], // Seongnam, South Korea
  681: [35.54, 129.31], // Ulsan, South Korea
  682: [37.5, 126.78], // Bucheon, South Korea
  683: [37.32, 126.83], // Ansan, South Korea
  684: [36.64, 127.49], // Cheongju, South Korea
  685: [36.82, 127.15], // Cheonan, South Korea
  686: [35.82, 127.15], // Jeonju, South Korea
  687: [37.39, 126.93], // Anyang, South Korea
  688: [40.42, -3.7], // Madrid, Spain
  689: [41.39, 2.17], // Barcelona, Spain
  690: [39.47, -0.38], // Valencia, Spain
  691: [41.65, -0.88], // Zaragoza, Spain
  692: [37.39, -5.99], // Seville, Spain
  693: [36.72, -4.42], // Malaga, Spain
  694: [6.93, 79.85], // Colombo, Sri Lanka
  695: [15.55, 32.53], // Khartoum, Sudan
  696: [12.05, 24.88], // Nyala, Sudan
  697: [59.33, 18.07], // Stockholm, Sweden
  698: [57.71, 11.97], // Gothenburg, Sweden
  699: [47.37, 8.54], // Zurich, Switzerland
  700: [46.2, 6.14], // Geneva, Switzerland
  701: [47.56, 7.59], // Basel, Switzerland
  702: [33.51, 36.29], // Damascus, Syria
  703: [36.2, 37.16], // Aleppo, Syria
  704: [34.73, 36.72], // Homs, Syria
  705: [35.13, 36.75], // Hamah, Syria
  706: [35.52, 35.79], // Lattakia, Syria
  707: [35.95, 39.01], // Al-Raqqa, Syria
  708: [25.01, 121.46], // Xinbei, Taiwan
  709: [25.03, 121.56], // Taibei, Taiwan
  710: [24.99, 121.3], // Taoyuan, Taiwan
  711: [22.62, 120.31], // Gaoxiong, Taiwan
  712: [24.15, 120.67], // Taizhong, Taiwan
  713: [23, 120.21], // Tainan, Taiwan
  714: [38.56, 68.79], // Dushanbe, Tajikistan
  715: [-6.79, 39.28], // Dar es Salaam, Tanzania
  716: [-2.52, 32.9], // Mwanza, Tanzania
  717: [-6.16, 39.19], // Zanzibar, Tanzania
  718: [-8.9, 33.45], // Mbeya, Tanzania
  719: [13.75, 100.5], // Bangkok, Thailand
  720: [13.36, 100.98], // Chon Buri, Thailand
  721: [13.6, 100.6], // Samut Prakan, Thailand
  722: [18.79, 98.98], // Chiang Mai, Thailand
  723: [7.2, 100.6], // Songkhla, Thailand
  724: [13.86, 100.51], // Nonthaburi, Thailand
  725: [14.02, 100.53], // Pathum Thani, Thailand
  726: [14.98, 102.1], // Nakhon Ratchasima, Thailand
  727: [13.55, 100.27], // Samut Sakhon, Thailand
  728: [17.41, 102.79], // Udon Thani, Thailand
  729: [19.91, 99.83], // Chiang Rai, Thailand
  730: [12.68, 101.28], // Rayong, Thailand
  731: [16.43, 103.51], // Kalasin, Thailand
  732: [13.82, 100.06], // Nakhon Pathom, Thailand
  733: [16.44, 102.83], // Khon-Kaen, Thailand
  734: [6.13, 1.22], // Lome, Togo
  735: [10.65, -61.51], // Port of Spain, Trinidad and Tobago
  736: [36.81, 10.18], // Tunis, Tunisia
  737: [34.74, 10.76], // Safaqis, Tunisia
  738: [41.01, 28.98], // Istanbul, Turkey
  739: [39.93, 32.86], // Ankara, Turkey
  740: [38.42, 27.14], // Izmir, Turkey
  741: [40.19, 29.06], // Bursa, Turkey
  742: [37, 35.32], // Adana, Turkey
  743: [37.07, 37.38], // Gaziantep, Turkey
  744: [37.87, 32.49], // Konya, Turkey
  745: [36.89, 30.71], // Antalya, Turkey
  746: [37.91, 40.24], // Diyarbakir, Turkey
  747: [36.8, 34.63], // Mersin, Turkey
  748: [38.73, 35.48], // Kayseri, Turkey
  749: [39.78, 30.52], // Eskisehir, Turkey
  750: [40.8, 29.43], // Gebze, Turkey
  751: [37.8, 29.1], // Denizli, Turkey
  752: [41.3, 36.3], // Samsun, Turkey
  753: [37.2, 38.8], // Sanliurfa, Turkey
  754: [37.6, 36.9], // Kahramanmaras, Turkey
  755: [40.8, 30.4], // Sakarya, Turkey
  756: [38.5, 43.4], // Van, Turkey
  757: [37.9, 58.4], // Ashgabat, Turkmenistan
  758: [0.3, 32.6], // Kampala, Uganda
  759: [50.45, 30.5], // Kiev, Ukraine
  760: [50, 36.2], // Kharkiv, Ukraine
  761: [46.5, 30.7], // Odesa, Ukraine
  762: [48.5, 35], // Dnipro, Ukraine
  763: [48, 37.8], // Donetsk, Ukraine
  764: [47.8, 35.2], // Zaporizhzhya, Ukraine
  765: [49.8, 24], // Lviv, Ukraine
  766: [47.9, 33.4], // Kryvyi Rih, Ukraine
  767: [25.2, 55.3], // Dubai, United Arab Emirates
  768: [25.35, 55.4], // Sharjah, United Arab Emirates
  769: [24.45, 54.4], // Abu Dhabi, United Arab Emirates
  770: [24.2, 55.75], // Al-Ain, United Arab Emirates
  771: [51.5, -0.13], // London, United Kingdom
  772: [53.48, -2.24], // Manchester, United Kingdom
  773: [53.8, -1.55], // Leeds, United Kingdom
  774: [52.48, -1.9], // Birmingham, United Kingdom
  775: [53.7, -1.6], // West Yorkshire, United Kingdom
  776: [55.86, -4.25], // Glasgow, United Kingdom
  777: [50.9, -1.4], // Southampton, United Kingdom
  778: [53.4, -3], // Liverpool, United Kingdom
  779: [55, -1.6], // Newcastle upon Tyne, United Kingdom
  780: [52.95, -1.15], // Nottingham, United Kingdom
  781: [53.38, -1.47], // Sheffield, United Kingdom
  782: [51.45, -2.58], // Bristol, United Kingdom
  783: [54.6, -5.93], // Belfast, United Kingdom
  784: [50.83, -0.14], // Brighton, United Kingdom
  785: [52.63, -1.13], // Leicester, United Kingdom
  786: [55.95, -3.19], // Edinburgh, United Kingdom
  787: [50.72, -1.88], // Bournemouth, United Kingdom
  788: [40.71, -74.01], // New York City, United States
  789: [34.05, -118.24], // Los Angeles, United States
  790: [42.37, -71.11], // Cambridge, United States
  791: [41.88, -87.63], // Chicago, United States
  792: [29.76, -95.37], // Houston, United States
  793: [33.45, -112.07], // Phoenix, United States
  794: [39.95, -75.17], // Philadelphia, United States
  795: [29.42, -98.49], // San Antonio, United States
  796: [32.72, -117.16], // San Diego, United States
  797: [32.78, -96.8], // Dallas, United States
  798: [37.34, -121.89], // San Jose, United States
  799: [30.27, -97.74], // Austin, United States
  800: [32.75, -97.33], // Fort Worth, United States
  801: [30.33, -81.66], // Jacksonville, United States
  802: [39.96, -83], // Columbus, United States
  803: [35.23, -80.84], // Charlotte, United States
  804: [37.77, -122.42], // San Francisco, United States
  805: [39.77, -86.16], // Indianapolis, United States
  806: [47.61, -122.33], // Seattle, United States
  807: [39.74, -104.99], // Denver, United States
  808: [38.9, -77.04], // Washington, United States
  809: [42.36, -71.06], // Boston, United States
  810: [31.76, -106.49], // El Paso, United States
  811: [36.16, -86.78], // Nashville, United States
  812: [38.8, -77.05], // Alexandria, United States
  813: [33.77, -84.3], // Decatur, United States
  814: [26.71, -80.05], // West Palm Beach, United States
  815: [42.33, -83.05], // Detroit, United States
  816: [45.52, -122.68], // Portland, United States
  817: [36.17, -115.14], // Las Vegas, United States
  818: [35.47, -97.52], // Oklahoma City, United States
  819: [39.09, -96.03], // Maple Hill, United States
  820: [35.15, -90.05], // Memphis, United States
  821: [38.25, -85.76], // Louisville, United States
  822: [39.29, -76.61], // Baltimore, United States
  823: [29.3, -94.8], // Galveston, United States
  824: [30.08, -94.1], // Beaumont, United States
  825: [29.95, -90.07], // New Orleans, United States
  826: [30.7, -88], // Mobile, United States
  827: [30.4, -87.2], // Pensacola, United States
  828: [30.2, -85.8], // Panama City Beach, United States
  829: [30.4, -84.3], // Tallahasse, United States
  830: [30.3, -81.7], // Jacksonville, United States
  831: [29.2, -81], // Daytona Beach, United States
  832: [32.1, -81.1], // Savannah, United States
  833: [32.5, -84.9], // Columbus, United States
  834: [33.7, -84.4], // Atlanta, United States
  835: [31.8, -106.5], // El Paso, United States
  836: [32.2, -110.9], // Tucson, United States
  837: [33.4, -112.1], // Phoenix, United States
  838: [32.7, -117.2], // San Diego, United States
  839: [33.8, -118.2], // Long Beach, United States
  840: [33.8, -117.9], // Anaheim, United States
  841: [42.3, -122.9], // Medford, United States
  842: [44.1, -123.1], // Eugene, United States
  843: [40.2, -111.7], // Provo, United States
  844: [41.2, -111.9], // Ogden, United States
  845: [39.8, -89.6], // Springfield, United States
  846: [40.7, -89.6], // Peoria, United States
  847: [38, -87.6], // Evansville, United States
  848: [40.6, -105.1], // Fort Collins, United States
  849: [36.9, -76], // Virginia Beach, United States
  850: [37.5, -77.4], // Richmond, United States
  851: [36, -83.9], // Knoxville, United States
  852: [41.7, -83.6], // Toledo, United States
  853: [42.3, -83.7], // Ann Arbor, United States
  854: [35.7, -105.9], // Santa Fe, United States
  855: [35.2, -101.8], // Amarillo, United States
  856: [35.2, -97.4], // Norman, United States
  857: [33.6, -101.9], // Lubbock, United States
  858: [35, -85.3], // Chattanooga, United States
  859: [34.7, -86.6], // Huntsville, United States
  860: [32.8, -79.9], // Charleson, United States
  861: [35.1, -106.6], // Albuquerque, United States
  862: [32.2, -110.9], // Tucson, United States
  863: [36.7, -119.8], // Fresno, United States
  864: [25.8, -80.2], // Miami, United States
  865: [28.5, -81.4], // Orlando, United States
  866: [33.7, -84.4], // Atlanta, United States
  867: [38.6, -121.5], // Sacramento, United States
  868: [39.1, -94.6], // Kansas City, United States
  869: [-34.9, -56.2], // Montevideo, Uruguay
  870: [41.3, 69.2], // Tashkent, Uzbekistan
  871: [39.7, 66.9], // Samarkand, Uzbekistan
  872: [41, 71.7], // Namangan, Uzbekistan
  873: [10.5, -66.9], // Caracas, Venezuela
  874: [10.6, -71.6], // Maracaibo, Venezuela
  875: [7.8, -72.2], // San Cristobal, Venezuela
  876: [10.2, -68], // Valencia, Venezuela
  877: [10.1, -69.3], // Barquisimeto, Venezuela
  878: [10.2, -67.6], // Maracay, Venezuela
  879: [8.4, -62.7], // Ciudad Guayana, Venezuela
  880: [10.1, -64.7], // Barcelona-Puerto La Cruz, Venezuela
  881: [9.7, -63.2], // Maturin, Venezuela
  882: [10.4, -71.4], // Cabimas, Venezuela
  883: [10.8, 106.7], // Ho Chi Minh City, Vietnam
  884: [21, 105.8], // Hanoi, Vietnam
  885: [10, 105.8], // Can Tho, Vietnam
  886: [20.9, 106.7], // Hai Phong, Vietnam
  887: [16.1, 108.2], // Da Nang, Vietnam
  888: [10.9, 106.8], // Bien Hoa, Vietnam
  889: [15.4, 44.2], // Sanaa, Yemen
  890: [12.8, 45], // Aden, Yemen
  891: [13.6, 44], // Taiz, Yemen
  892: [14.8, 43], // Al-Hudaydah, Yemen
  893: [13.9, 44.2], // Ibb, Yemen
  894: [14.5, 49.1], // Al-Mukalla, Yemen
  895: [-13.6, 32.6], // Chipata, Zambia
  896: [-15.4, 28.3], // Lusaka, Zambia
  897: [-12.8, 28.2], // Kitwe, Zambia
  898: [-11.2, 28.9], // Mansa, Zambia
  899: [-15.8, 28.2], // Kafue, Zambia
  900: [-17, 26.5], // Kalomo, Zambia
  901: [-15.86, 27.75], // Mazabuka, Zambia
  902: [-16.81, 26.99], // Choma, Zambia
  903: [-15.28, 23.13], // Mongu, Zambia
  904: [-12.97, 28.64], // Ndola, Zambia
  905: [-17.83, 31.05], // Harare, Zimbabwe
  906: [-20.15, 28.58], // Bulawayo, Zimbabwe
  907: [-19.45, 29.82], // Gweru, Zimbabwe
  908: [43.92, 81.32], // Ili, China
  909: [41.17, 80.26], // Aksu City, China
  910: [39.47, 75.99], // Kashgar, China
  911: [45.58, 84.89], // Karamay, China
  912: [46.75, 82.98], // Tacheng, China
  913: [43.83, 87.62], // Urumqi, China
  914: [41.73, 86.15], // Bayingolin, China
  915: [47.85, 88.14], // Altay, China
  916: [42.95, 89.19], // Turpan, China
  917: [31.48, 92.06], // Nagqu, China
  918: [42.83, 93.51], // Kumul, China
  919: [37.37, 97.37], // Haixi, China
  920: [33, 97.02], // Yushu, China
  921: [31.14, 97.17], // Chamdo, China
  922: [29.65, 94.36], // Nyingchi, China
  923: [37.93, 102.64], // Wuwei, China
  924: [38.93, 100.45], // Zhangye, China
  925: [38.5, 102.19], // Jinchang, China
  926: [39.74, 98.5], // Jiuquan, China
  927: [36.62, 101.78], // Xining, China
  928: [36.28, 100.62], // Hainan, China
  929: [35.6, 103.21], // Linxia, China
  930: [34.47, 100.25], // Golog, China
  931: [30.01, 103.04], // Ya'an, China
  932: [30.05, 101.96], // Garze, China
  933: [31.9, 102.22], // Aba, China
  934: [25.04, 102.71], // Kunming, China
  935: [27.88, 102.27], // Liangshan, China
  936: [25.11, 99.16], // Baoshan, China
  937: [26.58, 101.72], // Panzhihua, China
  938: [25.6, 100.27], // Dali, China
  939: [24.35, 102.55], // Yuxi, China
  940: [23.88, 100.09], // Lincang, China
  941: [22.01, 100.8], // Xishuangbanna, China
  942: [22.79, 100.97], // Pu'er, China
  943: [24.43, 98.59], // Dehong, China
  944: [38.47, 106.27], // Yinchuan, China
  945: [40.74, 107.42], // Bayannur, China
  946: [39.02, 106.38], // Shizuishan, China
  947: [39.66, 106.81], // Wuhai, China
  948: [38.85, 105.67], // Alxa, China
  949: [34.36, 107.24], // Baoji, China
  950: [34.58, 105.72], // Tianshui, China
  951: [35.71, 107.64], // Qingyang, China
  952: [35.58, 104.62], // Dingxi, China
  953: [36.06, 103.83], // Lanzhou, China
  954: [30.66, 104.06], // Chengdu, China
  955: [29.56, 106.55], // Chongqing, China
  956: [31.47, 104.68], // Mianyang, China
  957: [32.44, 105.84], // Guangyuan, China
  958: [33.07, 107.02], // Hanzhong, China
  959: [24.7, 108.09], // Hechi, China
  960: [26.25, 105.93], // Anshun, China
  961: [27.34, 103.72], // Zhaotong, China
  962: [27.3, 105.29], // Bijie, China
  963: [26.26, 107.52], // Qiannan, China
  964: [22.82, 108.32], // Nanning, China
  965: [30.63, 103.67], // Chongzhou, China
  966: [21.98, 108.65], // Qinzhou, China
  967: [40.08, 113.3], // Datong, China
  968: [40.66, 109.84], // Baotou, China
  969: [40.84, 111.75], // Hohhot, China
  970: [38.42, 112.73], // Xinzhou, China
  971: [40.99, 113.13], // Ulanqab, China
  972: [34.75, 113.62], // Zhengzhou, China
  973: [35.03, 111], // Yuncheng, China
  974: [36.59, 109.49], // Yan'An, China
  975: [36.09, 111.52], // Linfen, China
  976: [34.3, 108.9], // Xi'an, China
  977: [30.7, 111.3], // Yichang, China
  978: [33, 112.5], // Nanyang, China
  979: [32.6, 110.8], // Shiyan, China
  980: [34.3, 108.7], // Xianyang, China
  981: [28.2, 112.9], // Changsha, China
  982: [25.8, 113], // Chenzhou, China
  983: [26.9, 112.6], // Hengyang, China
  984: [27.6, 110], // Huaihua, China
  985: [25.3, 110.3], // Guilin, China
  986: [23.1, 113.3], // Guangzhou, China
  987: [20, 110.3], // Haikou, China
  988: [21.2, 110.4], // Zhanjiang, China
  989: [23.1, 109.6], // Guigang, China
  990: [21.7, 110.9], // Maoming, China
  991: [18.3, 109.5], // Sanya, China
  992: [43.9, 116], // Xilin Gol, China
  993: [42.3, 118.9], // Chifeng, China
  994: [39.9, 116.4], // Beijing, China
  995: [38.9, 115.5], // Baoding, China
  996: [38, 114.5], // Shijiazhuang, China
  997: [39.1, 117.2], // Tianjin, China
  998: [38.3, 116.8], // Cangzhou, China
  999: [36.7, 117], // Jinan, China
  1000: [35.1, 118.3], // Linyi, China
  1001: [34.4, 115.7], // Shangqiu, China
  1002: [34.3, 117.2], // Xuzhou, China
  1003: [30.6, 114.3], // Wuhan, China
  1004: [31.8, 117.3], // Hefei, China
  1005: [32.1, 118.8], // Nanjing, China
  1006: [29.7, 116], // Jiujiang, China
  1007: [33.6, 117], // Suzhou, China
  1008: [28.7, 115.9], // Nanchang, China
  1009: [24.9, 118.6], // Quanzhou, China
  1010: [27.1, 115], // Ji'an, China
  1011: [27.8, 114.9], // Xinyu, China
  1012: [24.5, 118.1], // Xiamen, China
  1013: [23.4, 116.7], // Shantou, China
  1014: [23.5, 116.4], // Jieyang, China
  1015: [49.2, 119.8], // Hulunbui, China
  1016: [45.6, 122.8], // Baicheng, China
  1017: [46.1, 122.1], // Hinggan, China
  1018: [47.4, 124], // Qiqihar, China
  1019: [41.8, 123.4], // Shenyang, China
  1020: [42.3, 123.8], // Tieling, China
  1021: [43.6, 122.3], // Tongliao, China
  1022: [42, 121.7], // Fuxin, China
  1023: [40.7, 120.8], // Huludao, China
  1024: [41.1, 121.1], // Jinzhou, China
  1025: [39.9, 119.6], // Qinhuangdao, China
  1026: [36.1, 120.4], // Qingdao, China
  1027: [36.7, 119.1], // Weifang, China
  1028: [37.5, 121.4], // Yantai, China
  1029: [34.6, 119.2], // Lianyungang, China
  1030: [32, 120.9], // Nantong, China
  1031: [31.2, 121.5], // Shanghai, China
  1032: [31.3, 120.6], // Suzhou, China
  1033: [30.3, 120.2], // Hangzhou, China
  1034: [28.7, 121.4], // Taizhou, China
  1035: [28, 120.7], // Wenzhou, China
  1036: [51.7, 124.2], // Da Hinggan Ling, China
  1037: [45.8, 126.6], // Harbin, China
  1038: [46.6, 127], // Suihua, China
  1039: [46.6, 125], // Daqing, China
  1040: [47.7, 128.8], // Yichun, China
  1041: [43.9, 125.3], // Changchun, China
  1042: [43.2, 124.4], // Siping, China
  1043: [45.1, 124.8], // Songyuan, China
  1044: [43.8, 126.6], // Jilin, China
  1045: [46.8, 130.3], // Jiamusi, China
  1046: [45.8, 131], // Qitaihe, China
  1047: [46.6, 131.2], // Shuangyashan, China
  1048: [42.9, 129.5], // Yanbian, China
  1049: [45.3, 131], // Jixi, China
  1050: [44.6, 129.6], // Mudanjiang, China
}

export function getCityLatLon(cityId: number): [number, number] | null {
  return CITY_COORDS[cityId] ?? null
}
