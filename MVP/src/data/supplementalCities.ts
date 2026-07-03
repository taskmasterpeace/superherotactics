/**
 * Supplemental cities for the 29 countries that shipped with ZERO cities.
 * Appended to ALL_CITIES so every consumer (getCitiesByCountry, city selection,
 * world map) sees them. Sectors computed via the project projection
 * (cityCoordinates.ts: latLonToSector). 120 records, ids 1051+.
 *
 * countryId + cultureCode taken from allCountries.ts (authoritative).
 */
import type { City } from './allCities'

export const SUPPLEMENTAL_CITIES: City[] = [
  {
    "id": 1051,
    "sector": "G20",
    "countryId": 165,
    "countryCode": "AD",
    "countryName": "Andorra",
    "cultureCode": 9,
    "name": "Andorra la Vella",
    "population": 22615,
    "populationRating": 2,
    "populationType": "Capital",
    "cityTypes": [
      "Political",
      "Tourism"
    ],
    "hvt": "",
    "crimeIndex": 22,
    "safetyIndex": 78
  },
  {
    "id": 1052,
    "sector": "G20",
    "countryId": 165,
    "countryCode": "AD",
    "countryName": "Andorra",
    "cultureCode": 9,
    "name": "Escaldes-Engordany",
    "population": 14395,
    "populationRating": 2,
    "populationType": "Town",
    "cityTypes": [
      "Tourism",
      "Company"
    ],
    "hvt": "",
    "crimeIndex": 20,
    "safetyIndex": 80
  },
  {
    "id": 1053,
    "sector": "G20",
    "countryId": 165,
    "countryCode": "AD",
    "countryName": "Andorra",
    "cultureCode": 9,
    "name": "Sant Julia de Loria",
    "population": 9448,
    "populationRating": 2,
    "populationType": "Town",
    "cityTypes": [
      "Industrial",
      "Tourism"
    ],
    "hvt": "",
    "crimeIndex": 24,
    "safetyIndex": 76
  },
  {
    "id": 1054,
    "sector": "G22",
    "countryId": 157,
    "countryCode": "AL",
    "countryName": "Albania",
    "cultureCode": 10,
    "name": "Tirana",
    "population": 557422,
    "populationRating": 5,
    "populationType": "Capital",
    "cityTypes": [
      "Political",
      "Educational",
      "Industrial"
    ],
    "hvt": "",
    "crimeIndex": 42,
    "safetyIndex": 58
  },
  {
    "id": 1055,
    "sector": "G22",
    "countryId": 157,
    "countryCode": "AL",
    "countryName": "Albania",
    "cultureCode": 10,
    "name": "Durres",
    "population": 175110,
    "populationRating": 3,
    "populationType": "City",
    "cityTypes": [
      "Port",
      "Industrial",
      "Tourism"
    ],
    "hvt": "",
    "crimeIndex": 44,
    "safetyIndex": 56
  },
  {
    "id": 1056,
    "sector": "G22",
    "countryId": 157,
    "countryCode": "AL",
    "countryName": "Albania",
    "cultureCode": 10,
    "name": "Vlore",
    "population": 130827,
    "populationRating": 3,
    "populationType": "City",
    "cityTypes": [
      "Port",
      "Tourism"
    ],
    "hvt": "",
    "crimeIndex": 40,
    "safetyIndex": 60
  },
  {
    "id": 1057,
    "sector": "G22",
    "countryId": 157,
    "countryCode": "AL",
    "countryName": "Albania",
    "cultureCode": 10,
    "name": "Shkoder",
    "population": 135612,
    "populationRating": 3,
    "populationType": "City",
    "cityTypes": [
      "Educational",
      "Tourism"
    ],
    "hvt": "",
    "crimeIndex": 43,
    "safetyIndex": 57
  },
  {
    "id": 1058,
    "sector": "G22",
    "countryId": 157,
    "countryCode": "AL",
    "countryName": "Albania",
    "cultureCode": 10,
    "name": "Elbasan",
    "population": 141714,
    "populationRating": 3,
    "populationType": "City",
    "cityTypes": [
      "Industrial",
      "Educational"
    ],
    "hvt": "",
    "crimeIndex": 45,
    "safetyIndex": 55
  },
  {
    "id": 1059,
    "sector": "F21",
    "countryId": 159,
    "countryCode": "AT",
    "countryName": "Austria",
    "cultureCode": 9,
    "name": "Vienna",
    "population": 1911191,
    "populationRating": 6,
    "populationType": "Capital",
    "cityTypes": [
      "Political",
      "Educational",
      "Company"
    ],
    "hvt": "",
    "crimeIndex": 30,
    "safetyIndex": 70
  },
  {
    "id": 1060,
    "sector": "F21",
    "countryId": 159,
    "countryCode": "AT",
    "countryName": "Austria",
    "cultureCode": 9,
    "name": "Graz",
    "population": 291134,
    "populationRating": 4,
    "populationType": "City",
    "cityTypes": [
      "Educational",
      "Industrial"
    ],
    "hvt": "",
    "crimeIndex": 26,
    "safetyIndex": 74
  },
  {
    "id": 1061,
    "sector": "F21",
    "countryId": 159,
    "countryCode": "AT",
    "countryName": "Austria",
    "cultureCode": 9,
    "name": "Linz",
    "population": 206595,
    "populationRating": 4,
    "populationType": "City",
    "cityTypes": [
      "Industrial",
      "Company"
    ],
    "hvt": "",
    "crimeIndex": 27,
    "safetyIndex": 73
  },
  {
    "id": 1062,
    "sector": "F21",
    "countryId": 159,
    "countryCode": "AT",
    "countryName": "Austria",
    "cultureCode": 9,
    "name": "Salzburg",
    "population": 155021,
    "populationRating": 3,
    "populationType": "City",
    "cityTypes": [
      "Tourism",
      "Educational"
    ],
    "hvt": "",
    "crimeIndex": 24,
    "safetyIndex": 76
  },
  {
    "id": 1063,
    "sector": "F21",
    "countryId": 159,
    "countryCode": "AT",
    "countryName": "Austria",
    "cultureCode": 9,
    "name": "Innsbruck",
    "population": 132493,
    "populationRating": 3,
    "populationType": "City",
    "cityTypes": [
      "Tourism",
      "Educational"
    ],
    "hvt": "",
    "crimeIndex": 25,
    "safetyIndex": 75
  },
  {
    "id": 1064,
    "sector": "G22",
    "countryId": 155,
    "countryCode": "BA",
    "countryName": "Bosnia and Herzegovina",
    "cultureCode": 10,
    "name": "Sarajevo",
    "population": 275524,
    "populationRating": 4,
    "populationType": "Capital",
    "cityTypes": [
      "Political",
      "Educational",
      "Tourism"
    ],
    "hvt": "",
    "crimeIndex": 38,
    "safetyIndex": 62
  },
  {
    "id": 1065,
    "sector": "F22",
    "countryId": 155,
    "countryCode": "BA",
    "countryName": "Bosnia and Herzegovina",
    "cultureCode": 10,
    "name": "Banja Luka",
    "population": 185042,
    "populationRating": 3,
    "populationType": "City",
    "cityTypes": [
      "Political",
      "Company"
    ],
    "hvt": "",
    "crimeIndex": 36,
    "safetyIndex": 64
  },
  {
    "id": 1066,
    "sector": "F22",
    "countryId": 155,
    "countryCode": "BA",
    "countryName": "Bosnia and Herzegovina",
    "cultureCode": 10,
    "name": "Tuzla",
    "population": 110979,
    "populationRating": 3,
    "populationType": "City",
    "cityTypes": [
      "Industrial",
      "Educational"
    ],
    "hvt": "",
    "crimeIndex": 40,
    "safetyIndex": 60
  },
  {
    "id": 1067,
    "sector": "G22",
    "countryId": 155,
    "countryCode": "BA",
    "countryName": "Bosnia and Herzegovina",
    "cultureCode": 10,
    "name": "Mostar",
    "population": 105797,
    "populationRating": 3,
    "populationType": "City",
    "cityTypes": [
      "Tourism",
      "Educational"
    ],
    "hvt": "",
    "crimeIndex": 39,
    "safetyIndex": 61
  },
  {
    "id": 1068,
    "sector": "G22",
    "countryId": 155,
    "countryCode": "BA",
    "countryName": "Bosnia and Herzegovina",
    "cultureCode": 10,
    "name": "Zenica",
    "population": 110663,
    "populationRating": 3,
    "populationType": "City",
    "cityTypes": [
      "Industrial",
      "Company"
    ],
    "hvt": "",
    "crimeIndex": 41,
    "safetyIndex": 59
  },
  {
    "id": 1069,
    "sector": "L33",
    "countryId": 153,
    "countryCode": "BN",
    "countryName": "Brunei",
    "cultureCode": 6,
    "name": "Bandar Seri Begawan",
    "population": 100700,
    "populationRating": 3,
    "populationType": "Capital",
    "cityTypes": [
      "Political",
      "Company"
    ],
    "hvt": "",
    "crimeIndex": 28,
    "safetyIndex": 72
  },
  {
    "id": 1070,
    "sector": "L32",
    "countryId": 153,
    "countryCode": "BN",
    "countryName": "Brunei",
    "cultureCode": 6,
    "name": "Kuala Belait",
    "population": 31178,
    "populationRating": 2,
    "populationType": "Town",
    "cityTypes": [
      "Industrial",
      "Company"
    ],
    "hvt": "",
    "crimeIndex": 26,
    "safetyIndex": 74
  },
  {
    "id": 1071,
    "sector": "L32",
    "countryId": 153,
    "countryCode": "BN",
    "countryName": "Brunei",
    "cultureCode": 6,
    "name": "Seria",
    "population": 30097,
    "populationRating": 2,
    "populationType": "Town",
    "cityTypes": [
      "Industrial",
      "Port"
    ],
    "hvt": "",
    "crimeIndex": 25,
    "safetyIndex": 75
  },
  {
    "id": 1072,
    "sector": "L33",
    "countryId": 153,
    "countryCode": "BN",
    "countryName": "Brunei",
    "cultureCode": 6,
    "name": "Tutong",
    "population": 19000,
    "populationRating": 2,
    "populationType": "Town",
    "cityTypes": [
      "Political",
      "Industrial"
    ],
    "hvt": "",
    "crimeIndex": 27,
    "safetyIndex": 73
  },
  {
    "id": 1073,
    "sector": "I11",
    "countryId": 167,
    "countryCode": "BS",
    "countryName": "The Bahamas",
    "cultureCode": 7,
    "name": "Nassau",
    "population": 274400,
    "populationRating": 4,
    "populationType": "Capital",
    "cityTypes": [
      "Political",
      "Tourism",
      "Company"
    ],
    "hvt": "",
    "crimeIndex": 52,
    "safetyIndex": 48
  },
  {
    "id": 1074,
    "sector": "I11",
    "countryId": 167,
    "countryCode": "BS",
    "countryName": "The Bahamas",
    "cultureCode": 7,
    "name": "Freeport",
    "population": 26910,
    "populationRating": 2,
    "populationType": "City",
    "cityTypes": [
      "Industrial",
      "Port",
      "Tourism"
    ],
    "hvt": "",
    "crimeIndex": 55,
    "safetyIndex": 45
  },
  {
    "id": 1075,
    "sector": "I11",
    "countryId": 167,
    "countryCode": "BS",
    "countryName": "The Bahamas",
    "cultureCode": 7,
    "name": "West End",
    "population": 12724,
    "populationRating": 2,
    "populationType": "Town",
    "cityTypes": [
      "Tourism",
      "Port"
    ],
    "hvt": "",
    "crimeIndex": 48,
    "safetyIndex": 52
  },
  {
    "id": 1076,
    "sector": "I11",
    "countryId": 167,
    "countryCode": "BS",
    "countryName": "The Bahamas",
    "cultureCode": 7,
    "name": "Marsh Harbour",
    "population": 6283,
    "populationRating": 2,
    "populationType": "Town",
    "cityTypes": [
      "Tourism",
      "Port"
    ],
    "hvt": "",
    "crimeIndex": 46,
    "safetyIndex": 54
  },
  {
    "id": 1077,
    "sector": "P23",
    "countryId": 144,
    "countryCode": "BW",
    "countryName": "Botswana",
    "cultureCode": 3,
    "name": "Gaborone",
    "population": 231592,
    "populationRating": 4,
    "populationType": "Capital",
    "cityTypes": [
      "Political",
      "Educational",
      "Company"
    ],
    "hvt": "",
    "crimeIndex": 44,
    "safetyIndex": 56
  },
  {
    "id": 1078,
    "sector": "O23",
    "countryId": 144,
    "countryCode": "BW",
    "countryName": "Botswana",
    "cultureCode": 3,
    "name": "Francistown",
    "population": 100079,
    "populationRating": 3,
    "populationType": "City",
    "cityTypes": [
      "Industrial",
      "Company"
    ],
    "hvt": "",
    "crimeIndex": 46,
    "safetyIndex": 54
  },
  {
    "id": 1079,
    "sector": "P23",
    "countryId": 144,
    "countryCode": "BW",
    "countryName": "Botswana",
    "cultureCode": 3,
    "name": "Molepolole",
    "population": 74719,
    "populationRating": 3,
    "populationType": "Town",
    "cityTypes": [
      "Political",
      "Industrial"
    ],
    "hvt": "",
    "crimeIndex": 42,
    "safetyIndex": 58
  },
  {
    "id": 1080,
    "sector": "O22",
    "countryId": 144,
    "countryCode": "BW",
    "countryName": "Botswana",
    "cultureCode": 3,
    "name": "Maun",
    "population": 85300,
    "populationRating": 3,
    "populationType": "Town",
    "cityTypes": [
      "Tourism",
      "Company"
    ],
    "hvt": "",
    "crimeIndex": 40,
    "safetyIndex": 60
  },
  {
    "id": 1081,
    "sector": "O23",
    "countryId": 144,
    "countryCode": "BW",
    "countryName": "Botswana",
    "cultureCode": 3,
    "name": "Selebi-Phikwe",
    "population": 49411,
    "populationRating": 2,
    "populationType": "Town",
    "cityTypes": [
      "Industrial",
      "Company"
    ],
    "hvt": "",
    "crimeIndex": 45,
    "safetyIndex": 55
  },
  {
    "id": 1082,
    "sector": "J10",
    "countryId": 168,
    "countryCode": "BZ",
    "countryName": "Belize",
    "cultureCode": 8,
    "name": "Belize City",
    "population": 57169,
    "populationRating": 3,
    "populationType": "City",
    "cityTypes": [
      "Port",
      "Company",
      "Industrial"
    ],
    "hvt": "",
    "crimeIndex": 60,
    "safetyIndex": 40
  },
  {
    "id": 1083,
    "sector": "J10",
    "countryId": 168,
    "countryCode": "BZ",
    "countryName": "Belize",
    "cultureCode": 8,
    "name": "Belmopan",
    "population": 20621,
    "populationRating": 2,
    "populationType": "Capital",
    "cityTypes": [
      "Political",
      "Educational"
    ],
    "hvt": "",
    "crimeIndex": 42,
    "safetyIndex": 58
  },
  {
    "id": 1084,
    "sector": "J10",
    "countryId": 168,
    "countryCode": "BZ",
    "countryName": "Belize",
    "cultureCode": 8,
    "name": "San Ignacio",
    "population": 20326,
    "populationRating": 2,
    "populationType": "Town",
    "cityTypes": [
      "Tourism",
      "Company"
    ],
    "hvt": "",
    "crimeIndex": 44,
    "safetyIndex": 56
  },
  {
    "id": 1085,
    "sector": "J10",
    "countryId": 168,
    "countryCode": "BZ",
    "countryName": "Belize",
    "cultureCode": 8,
    "name": "Orange Walk",
    "population": 13708,
    "populationRating": 2,
    "populationType": "Town",
    "cityTypes": [
      "Industrial",
      "Company"
    ],
    "hvt": "",
    "crimeIndex": 46,
    "safetyIndex": 54
  },
  {
    "id": 1086,
    "sector": "D22",
    "countryId": 154,
    "countryCode": "EE",
    "countryName": "Estonia",
    "cultureCode": 10,
    "name": "Tallinn",
    "population": 445000,
    "populationRating": 4,
    "populationType": "Capital",
    "cityTypes": [
      "Political",
      "Educational",
      "Port"
    ],
    "hvt": "",
    "crimeIndex": 28,
    "safetyIndex": 72
  },
  {
    "id": 1087,
    "sector": "E23",
    "countryId": 154,
    "countryCode": "EE",
    "countryName": "Estonia",
    "cultureCode": 10,
    "name": "Tartu",
    "population": 91407,
    "populationRating": 3,
    "populationType": "City",
    "cityTypes": [
      "Educational",
      "Company"
    ],
    "hvt": "",
    "crimeIndex": 24,
    "safetyIndex": 76
  },
  {
    "id": 1088,
    "sector": "D23",
    "countryId": 154,
    "countryCode": "EE",
    "countryName": "Estonia",
    "cultureCode": 10,
    "name": "Narva",
    "population": 53424,
    "populationRating": 3,
    "populationType": "Town",
    "cityTypes": [
      "Industrial",
      "Port"
    ],
    "hvt": "",
    "crimeIndex": 32,
    "safetyIndex": 68
  },
  {
    "id": 1089,
    "sector": "E22",
    "countryId": 154,
    "countryCode": "EE",
    "countryName": "Estonia",
    "cultureCode": 10,
    "name": "Parnu",
    "population": 39605,
    "populationRating": 2,
    "populationType": "Town",
    "cityTypes": [
      "Tourism",
      "Port"
    ],
    "hvt": "",
    "crimeIndex": 26,
    "safetyIndex": 74
  },
  {
    "id": 1090,
    "sector": "I18",
    "countryId": 143,
    "countryCode": "EH",
    "countryName": "Western Sahara",
    "cultureCode": 1,
    "name": "Laayoune",
    "population": 217732,
    "populationRating": 4,
    "populationType": "Capital",
    "cityTypes": [
      "Political",
      "Military",
      "Industrial"
    ],
    "hvt": "",
    "crimeIndex": 40,
    "safetyIndex": 60
  },
  {
    "id": 1091,
    "sector": "I18",
    "countryId": 143,
    "countryCode": "EH",
    "countryName": "Western Sahara",
    "cultureCode": 1,
    "name": "Dakhla",
    "population": 106277,
    "populationRating": 3,
    "populationType": "City",
    "cityTypes": [
      "Port",
      "Industrial"
    ],
    "hvt": "",
    "crimeIndex": 38,
    "safetyIndex": 62
  },
  {
    "id": 1092,
    "sector": "I18",
    "countryId": 143,
    "countryCode": "EH",
    "countryName": "Western Sahara",
    "cultureCode": 1,
    "name": "Smara",
    "population": 57035,
    "populationRating": 3,
    "populationType": "Town",
    "cityTypes": [
      "Military",
      "Political"
    ],
    "hvt": "",
    "crimeIndex": 42,
    "safetyIndex": 58
  },
  {
    "id": 1093,
    "sector": "O40",
    "countryId": 169,
    "countryCode": "FJ",
    "countryName": "Fiji",
    "cultureCode": 11,
    "name": "Suva",
    "population": 88271,
    "populationRating": 3,
    "populationType": "Capital",
    "cityTypes": [
      "Political",
      "Port",
      "Educational"
    ],
    "hvt": "",
    "crimeIndex": 38,
    "safetyIndex": 62
  },
  {
    "id": 1094,
    "sector": "O40",
    "countryId": 169,
    "countryCode": "FJ",
    "countryName": "Fiji",
    "cultureCode": 11,
    "name": "Nadi",
    "population": 42284,
    "populationRating": 2,
    "populationType": "Town",
    "cityTypes": [
      "Tourism",
      "Port"
    ],
    "hvt": "",
    "crimeIndex": 36,
    "safetyIndex": 64
  },
  {
    "id": 1095,
    "sector": "O40",
    "countryId": 169,
    "countryCode": "FJ",
    "countryName": "Fiji",
    "cultureCode": 11,
    "name": "Lautoka",
    "population": 71573,
    "populationRating": 3,
    "populationType": "City",
    "cityTypes": [
      "Industrial",
      "Port"
    ],
    "hvt": "",
    "crimeIndex": 40,
    "safetyIndex": 60
  },
  {
    "id": 1096,
    "sector": "O40",
    "countryId": 169,
    "countryCode": "FJ",
    "countryName": "Fiji",
    "cultureCode": 11,
    "name": "Labasa",
    "population": 27949,
    "populationRating": 2,
    "populationType": "Town",
    "cityTypes": [
      "Industrial",
      "Company"
    ],
    "hvt": "",
    "crimeIndex": 37,
    "safetyIndex": 63
  },
  {
    "id": 1097,
    "sector": "L21",
    "countryId": 147,
    "countryCode": "GQ",
    "countryName": "Equatorial Guinea",
    "cultureCode": 2,
    "name": "Malabo",
    "population": 297000,
    "populationRating": 4,
    "populationType": "Capital",
    "cityTypes": [
      "Political",
      "Port",
      "Company"
    ],
    "hvt": "",
    "crimeIndex": 48,
    "safetyIndex": 52
  },
  {
    "id": 1098,
    "sector": "L21",
    "countryId": 147,
    "countryCode": "GQ",
    "countryName": "Equatorial Guinea",
    "cultureCode": 2,
    "name": "Bata",
    "population": 250770,
    "populationRating": 4,
    "populationType": "City",
    "cityTypes": [
      "Port",
      "Industrial",
      "Company"
    ],
    "hvt": "",
    "crimeIndex": 46,
    "safetyIndex": 54
  },
  {
    "id": 1099,
    "sector": "L21",
    "countryId": 147,
    "countryCode": "GQ",
    "countryName": "Equatorial Guinea",
    "cultureCode": 2,
    "name": "Ebebiyin",
    "population": 24831,
    "populationRating": 2,
    "populationType": "Town",
    "cityTypes": [
      "Political",
      "Industrial"
    ],
    "hvt": "",
    "crimeIndex": 44,
    "safetyIndex": 56
  },
  {
    "id": 1100,
    "sector": "L21",
    "countryId": 147,
    "countryCode": "GQ",
    "countryName": "Equatorial Guinea",
    "cultureCode": 2,
    "name": "Mongomo",
    "population": 12558,
    "populationRating": 2,
    "populationType": "Town",
    "cityTypes": [
      "Political",
      "Company"
    ],
    "hvt": "",
    "crimeIndex": 43,
    "safetyIndex": 57
  },
  {
    "id": 1101,
    "sector": "L13",
    "countryId": 148,
    "countryCode": "GY",
    "countryName": "Guyana",
    "cultureCode": 12,
    "name": "Georgetown",
    "population": 118363,
    "populationRating": 3,
    "populationType": "Capital",
    "cityTypes": [
      "Political",
      "Port",
      "Company"
    ],
    "hvt": "",
    "crimeIndex": 54,
    "safetyIndex": 46
  },
  {
    "id": 1102,
    "sector": "L13",
    "countryId": 148,
    "countryCode": "GY",
    "countryName": "Guyana",
    "cultureCode": 12,
    "name": "Linden",
    "population": 27277,
    "populationRating": 2,
    "populationType": "Town",
    "cityTypes": [
      "Industrial",
      "Company"
    ],
    "hvt": "",
    "crimeIndex": 50,
    "safetyIndex": 50
  },
  {
    "id": 1103,
    "sector": "L13",
    "countryId": 148,
    "countryCode": "GY",
    "countryName": "Guyana",
    "cultureCode": 12,
    "name": "New Amsterdam",
    "population": 35039,
    "populationRating": 2,
    "populationType": "Town",
    "cityTypes": [
      "Port",
      "Industrial"
    ],
    "hvt": "",
    "crimeIndex": 48,
    "safetyIndex": 52
  },
  {
    "id": 1104,
    "sector": "L13",
    "countryId": 148,
    "countryCode": "GY",
    "countryName": "Guyana",
    "cultureCode": 12,
    "name": "Bartica",
    "population": 15000,
    "populationRating": 2,
    "populationType": "Town",
    "cityTypes": [
      "Industrial",
      "Company"
    ],
    "hvt": "",
    "crimeIndex": 46,
    "safetyIndex": 54
  },
  {
    "id": 1105,
    "sector": "D17",
    "countryId": 120,
    "countryCode": "IS",
    "countryName": "Iceland",
    "cultureCode": 9,
    "name": "Reykjavik",
    "population": 135688,
    "populationRating": 3,
    "populationType": "Capital",
    "cityTypes": [
      "Political",
      "Educational",
      "Company"
    ],
    "hvt": "",
    "crimeIndex": 22,
    "safetyIndex": 78
  },
  {
    "id": 1106,
    "sector": "D17",
    "countryId": 120,
    "countryCode": "IS",
    "countryName": "Iceland",
    "cultureCode": 9,
    "name": "Kopavogur",
    "population": 38047,
    "populationRating": 2,
    "populationType": "Town",
    "cityTypes": [
      "Company",
      "Industrial"
    ],
    "hvt": "",
    "crimeIndex": 20,
    "safetyIndex": 80
  },
  {
    "id": 1107,
    "sector": "D17",
    "countryId": 120,
    "countryCode": "IS",
    "countryName": "Iceland",
    "cultureCode": 9,
    "name": "Hafnarfjordur",
    "population": 29799,
    "populationRating": 2,
    "populationType": "Town",
    "cityTypes": [
      "Port",
      "Industrial"
    ],
    "hvt": "",
    "crimeIndex": 21,
    "safetyIndex": 79
  },
  {
    "id": 1108,
    "sector": "D18",
    "countryId": 120,
    "countryCode": "IS",
    "countryName": "Iceland",
    "cultureCode": 9,
    "name": "Akureyri",
    "population": 19219,
    "populationRating": 2,
    "populationType": "Town",
    "cityTypes": [
      "Educational",
      "Port",
      "Tourism"
    ],
    "hvt": "",
    "crimeIndex": 19,
    "safetyIndex": 81
  },
  {
    "id": 1109,
    "sector": "G28",
    "countryId": 171,
    "countryCode": "KG",
    "countryName": "Kyrgyzstan",
    "cultureCode": 4,
    "name": "Bishkek",
    "population": 1074075,
    "populationRating": 6,
    "populationType": "Capital",
    "cityTypes": [
      "Political",
      "Educational",
      "Industrial"
    ],
    "hvt": "",
    "crimeIndex": 46,
    "safetyIndex": 54
  },
  {
    "id": 1110,
    "sector": "G28",
    "countryId": 171,
    "countryCode": "KG",
    "countryName": "Kyrgyzstan",
    "cultureCode": 4,
    "name": "Osh",
    "population": 322164,
    "populationRating": 4,
    "populationType": "City",
    "cityTypes": [
      "Industrial",
      "Company"
    ],
    "hvt": "",
    "crimeIndex": 48,
    "safetyIndex": 52
  },
  {
    "id": 1111,
    "sector": "G28",
    "countryId": 171,
    "countryCode": "KG",
    "countryName": "Kyrgyzstan",
    "cultureCode": 4,
    "name": "Jalal-Abad",
    "population": 123239,
    "populationRating": 3,
    "populationType": "City",
    "cityTypes": [
      "Industrial",
      "Company"
    ],
    "hvt": "",
    "crimeIndex": 47,
    "safetyIndex": 53
  },
  {
    "id": 1112,
    "sector": "G28",
    "countryId": 171,
    "countryCode": "KG",
    "countryName": "Kyrgyzstan",
    "cultureCode": 4,
    "name": "Karakol",
    "population": 84351,
    "populationRating": 3,
    "populationType": "Town",
    "cityTypes": [
      "Tourism",
      "Educational"
    ],
    "hvt": "",
    "crimeIndex": 44,
    "safetyIndex": 56
  },
  {
    "id": 1113,
    "sector": "G20",
    "countryId": 164,
    "countryCode": "MC",
    "countryName": "Monaco",
    "cultureCode": 9,
    "name": "Monaco",
    "population": 38350,
    "populationRating": 2,
    "populationType": "Capital",
    "cityTypes": [
      "Political",
      "Tourism",
      "Company"
    ],
    "hvt": "",
    "crimeIndex": 18,
    "safetyIndex": 82
  },
  {
    "id": 1114,
    "sector": "G20",
    "countryId": 164,
    "countryCode": "MC",
    "countryName": "Monaco",
    "cultureCode": 9,
    "name": "Monte Carlo",
    "population": 15000,
    "populationRating": 2,
    "populationType": "City",
    "cityTypes": [
      "Tourism",
      "Company"
    ],
    "hvt": "",
    "crimeIndex": 16,
    "safetyIndex": 84
  },
  {
    "id": 1115,
    "sector": "F23",
    "countryId": 158,
    "countryCode": "MD",
    "countryName": "Moldova",
    "cultureCode": 10,
    "name": "Chisinau",
    "population": 532513,
    "populationRating": 5,
    "populationType": "Capital",
    "cityTypes": [
      "Political",
      "Educational",
      "Industrial"
    ],
    "hvt": "",
    "crimeIndex": 40,
    "safetyIndex": 60
  },
  {
    "id": 1116,
    "sector": "F23",
    "countryId": 158,
    "countryCode": "MD",
    "countryName": "Moldova",
    "cultureCode": 10,
    "name": "Tiraspol",
    "population": 129500,
    "populationRating": 3,
    "populationType": "City",
    "cityTypes": [
      "Political",
      "Industrial"
    ],
    "hvt": "",
    "crimeIndex": 44,
    "safetyIndex": 56
  },
  {
    "id": 1117,
    "sector": "F23",
    "countryId": 158,
    "countryCode": "MD",
    "countryName": "Moldova",
    "cultureCode": 10,
    "name": "Balti",
    "population": 102457,
    "populationRating": 3,
    "populationType": "City",
    "cityTypes": [
      "Industrial",
      "Company"
    ],
    "hvt": "",
    "crimeIndex": 42,
    "safetyIndex": 58
  },
  {
    "id": 1118,
    "sector": "F23",
    "countryId": 158,
    "countryCode": "MD",
    "countryName": "Moldova",
    "cultureCode": 10,
    "name": "Bender",
    "population": 91000,
    "populationRating": 3,
    "populationType": "Town",
    "cityTypes": [
      "Industrial",
      "Military"
    ],
    "hvt": "",
    "crimeIndex": 45,
    "safetyIndex": 55
  },
  {
    "id": 1119,
    "sector": "G22",
    "countryId": 166,
    "countryCode": "ME",
    "countryName": "Montenegro",
    "cultureCode": 10,
    "name": "Podgorica",
    "population": 150977,
    "populationRating": 3,
    "populationType": "Capital",
    "cityTypes": [
      "Political",
      "Educational",
      "Company"
    ],
    "hvt": "",
    "crimeIndex": 36,
    "safetyIndex": 64
  },
  {
    "id": 1120,
    "sector": "G22",
    "countryId": 166,
    "countryCode": "ME",
    "countryName": "Montenegro",
    "cultureCode": 10,
    "name": "Niksic",
    "population": 56970,
    "populationRating": 3,
    "populationType": "Town",
    "cityTypes": [
      "Industrial",
      "Educational"
    ],
    "hvt": "",
    "crimeIndex": 38,
    "safetyIndex": 62
  },
  {
    "id": 1121,
    "sector": "G22",
    "countryId": 166,
    "countryCode": "ME",
    "countryName": "Montenegro",
    "cultureCode": 10,
    "name": "Herceg Novi",
    "population": 30864,
    "populationRating": 2,
    "populationType": "Town",
    "cityTypes": [
      "Tourism",
      "Port"
    ],
    "hvt": "",
    "crimeIndex": 34,
    "safetyIndex": 66
  },
  {
    "id": 1122,
    "sector": "G22",
    "countryId": 166,
    "countryCode": "ME",
    "countryName": "Montenegro",
    "cultureCode": 10,
    "name": "Bar",
    "population": 42048,
    "populationRating": 2,
    "populationType": "Town",
    "cityTypes": [
      "Port",
      "Tourism"
    ],
    "hvt": "",
    "crimeIndex": 37,
    "safetyIndex": 63
  },
  {
    "id": 1123,
    "sector": "G22",
    "countryId": 161,
    "countryCode": "MK",
    "countryName": "North Macedonia",
    "cultureCode": 10,
    "name": "Skopje",
    "population": 526502,
    "populationRating": 5,
    "populationType": "Capital",
    "cityTypes": [
      "Political",
      "Educational",
      "Industrial"
    ],
    "hvt": "",
    "crimeIndex": 40,
    "safetyIndex": 60
  },
  {
    "id": 1124,
    "sector": "G22",
    "countryId": 161,
    "countryCode": "MK",
    "countryName": "North Macedonia",
    "cultureCode": 10,
    "name": "Bitola",
    "population": 74550,
    "populationRating": 3,
    "populationType": "City",
    "cityTypes": [
      "Industrial",
      "Educational"
    ],
    "hvt": "",
    "crimeIndex": 38,
    "safetyIndex": 62
  },
  {
    "id": 1125,
    "sector": "G22",
    "countryId": 161,
    "countryCode": "MK",
    "countryName": "North Macedonia",
    "cultureCode": 10,
    "name": "Kumanovo",
    "population": 75051,
    "populationRating": 3,
    "populationType": "Town",
    "cityTypes": [
      "Industrial",
      "Company"
    ],
    "hvt": "",
    "crimeIndex": 41,
    "safetyIndex": 59
  },
  {
    "id": 1126,
    "sector": "G22",
    "countryId": 161,
    "countryCode": "MK",
    "countryName": "North Macedonia",
    "cultureCode": 10,
    "name": "Prilep",
    "population": 66246,
    "populationRating": 3,
    "populationType": "Town",
    "cityTypes": [
      "Industrial",
      "Company"
    ],
    "hvt": "",
    "crimeIndex": 39,
    "safetyIndex": 61
  },
  {
    "id": 1127,
    "sector": "O22",
    "countryId": 140,
    "countryCode": "NA",
    "countryName": "Namibia",
    "cultureCode": 3,
    "name": "Windhoek",
    "population": 431000,
    "populationRating": 4,
    "populationType": "Capital",
    "cityTypes": [
      "Political",
      "Educational",
      "Company"
    ],
    "hvt": "",
    "crimeIndex": 48,
    "safetyIndex": 52
  },
  {
    "id": 1128,
    "sector": "P21",
    "countryId": 140,
    "countryCode": "NA",
    "countryName": "Namibia",
    "cultureCode": 3,
    "name": "Walvis Bay",
    "population": 62096,
    "populationRating": 3,
    "populationType": "City",
    "cityTypes": [
      "Port",
      "Industrial"
    ],
    "hvt": "",
    "crimeIndex": 46,
    "safetyIndex": 54
  },
  {
    "id": 1129,
    "sector": "O21",
    "countryId": 140,
    "countryCode": "NA",
    "countryName": "Namibia",
    "cultureCode": 3,
    "name": "Swakopmund",
    "population": 44725,
    "populationRating": 2,
    "populationType": "Town",
    "cityTypes": [
      "Tourism",
      "Port"
    ],
    "hvt": "",
    "crimeIndex": 42,
    "safetyIndex": 58
  },
  {
    "id": 1130,
    "sector": "O21",
    "countryId": 140,
    "countryCode": "NA",
    "countryName": "Namibia",
    "cultureCode": 3,
    "name": "Oshakati",
    "population": 36541,
    "populationRating": 2,
    "populationType": "Town",
    "cityTypes": [
      "Company",
      "Industrial"
    ],
    "hvt": "",
    "crimeIndex": 45,
    "safetyIndex": 55
  },
  {
    "id": 1131,
    "sector": "I29",
    "countryId": 127,
    "countryCode": "NP",
    "countryName": "Nepal",
    "cultureCode": 5,
    "name": "Kathmandu",
    "population": 845767,
    "populationRating": 5,
    "populationType": "Capital",
    "cityTypes": [
      "Political",
      "Educational",
      "Tourism"
    ],
    "hvt": "",
    "crimeIndex": 44,
    "safetyIndex": 56
  },
  {
    "id": 1132,
    "sector": "I29",
    "countryId": 127,
    "countryCode": "NP",
    "countryName": "Nepal",
    "cultureCode": 5,
    "name": "Pokhara",
    "population": 402995,
    "populationRating": 4,
    "populationType": "City",
    "cityTypes": [
      "Tourism",
      "Educational"
    ],
    "hvt": "",
    "crimeIndex": 40,
    "safetyIndex": 60
  },
  {
    "id": 1133,
    "sector": "I29",
    "countryId": 127,
    "countryCode": "NP",
    "countryName": "Nepal",
    "cultureCode": 5,
    "name": "Lalitpur",
    "population": 284922,
    "populationRating": 4,
    "populationType": "City",
    "cityTypes": [
      "Industrial",
      "Tourism"
    ],
    "hvt": "",
    "crimeIndex": 42,
    "safetyIndex": 58
  },
  {
    "id": 1134,
    "sector": "I29",
    "countryId": 127,
    "countryCode": "NP",
    "countryName": "Nepal",
    "cultureCode": 5,
    "name": "Biratnagar",
    "population": 244750,
    "populationRating": 4,
    "populationType": "City",
    "cityTypes": [
      "Industrial",
      "Company"
    ],
    "hvt": "",
    "crimeIndex": 46,
    "safetyIndex": 54
  },
  {
    "id": 1135,
    "sector": "I29",
    "countryId": 127,
    "countryCode": "NP",
    "countryName": "Nepal",
    "cultureCode": 5,
    "name": "Birgunj",
    "population": 268000,
    "populationRating": 4,
    "populationType": "City",
    "cityTypes": [
      "Industrial",
      "Port"
    ],
    "hvt": "",
    "crimeIndex": 48,
    "safetyIndex": 52
  },
  {
    "id": 1136,
    "sector": "N36",
    "countryId": 150,
    "countryCode": "PG",
    "countryName": "Papua New Guinea",
    "cultureCode": 11,
    "name": "Port Moresby",
    "population": 383000,
    "populationRating": 4,
    "populationType": "Capital",
    "cityTypes": [
      "Political",
      "Port",
      "Company"
    ],
    "hvt": "",
    "crimeIndex": 62,
    "safetyIndex": 38
  },
  {
    "id": 1137,
    "sector": "M36",
    "countryId": 150,
    "countryCode": "PG",
    "countryName": "Papua New Guinea",
    "cultureCode": 11,
    "name": "Lae",
    "population": 100677,
    "populationRating": 3,
    "populationType": "City",
    "cityTypes": [
      "Port",
      "Industrial"
    ],
    "hvt": "",
    "crimeIndex": 58,
    "safetyIndex": 42
  },
  {
    "id": 1138,
    "sector": "M36",
    "countryId": 150,
    "countryCode": "PG",
    "countryName": "Papua New Guinea",
    "cultureCode": 11,
    "name": "Mount Hagen",
    "population": 46250,
    "populationRating": 2,
    "populationType": "Town",
    "cityTypes": [
      "Company",
      "Industrial"
    ],
    "hvt": "",
    "crimeIndex": 56,
    "safetyIndex": 44
  },
  {
    "id": 1139,
    "sector": "M36",
    "countryId": 150,
    "countryCode": "PG",
    "countryName": "Papua New Guinea",
    "cultureCode": 11,
    "name": "Madang",
    "population": 29000,
    "populationRating": 2,
    "populationType": "Town",
    "cityTypes": [
      "Port",
      "Tourism"
    ],
    "hvt": "",
    "crimeIndex": 52,
    "safetyIndex": 48
  },
  {
    "id": 1140,
    "sector": "N38",
    "countryId": 151,
    "countryCode": "SB",
    "countryName": "Solomon Islands",
    "cultureCode": 11,
    "name": "Honiara",
    "population": 84520,
    "populationRating": 3,
    "populationType": "Capital",
    "cityTypes": [
      "Political",
      "Port",
      "Company"
    ],
    "hvt": "",
    "crimeIndex": 50,
    "safetyIndex": 50
  },
  {
    "id": 1141,
    "sector": "N38",
    "countryId": 151,
    "countryCode": "SB",
    "countryName": "Solomon Islands",
    "cultureCode": 11,
    "name": "Auki",
    "population": 6811,
    "populationRating": 2,
    "populationType": "Town",
    "cityTypes": [
      "Port",
      "Company"
    ],
    "hvt": "",
    "crimeIndex": 46,
    "safetyIndex": 54
  },
  {
    "id": 1142,
    "sector": "N37",
    "countryId": 151,
    "countryCode": "SB",
    "countryName": "Solomon Islands",
    "cultureCode": 11,
    "name": "Gizo",
    "population": 6154,
    "populationRating": 2,
    "populationType": "Town",
    "cityTypes": [
      "Tourism",
      "Port"
    ],
    "hvt": "",
    "crimeIndex": 44,
    "safetyIndex": 56
  },
  {
    "id": 1143,
    "sector": "F21",
    "countryId": 163,
    "countryCode": "SI",
    "countryName": "Slovenia",
    "cultureCode": 10,
    "name": "Ljubljana",
    "population": 295504,
    "populationRating": 4,
    "populationType": "Capital",
    "cityTypes": [
      "Political",
      "Educational",
      "Company"
    ],
    "hvt": "",
    "crimeIndex": 26,
    "safetyIndex": 74
  },
  {
    "id": 1144,
    "sector": "F21",
    "countryId": 163,
    "countryCode": "SI",
    "countryName": "Slovenia",
    "cultureCode": 10,
    "name": "Maribor",
    "population": 112065,
    "populationRating": 3,
    "populationType": "City",
    "cityTypes": [
      "Industrial",
      "Educational"
    ],
    "hvt": "",
    "crimeIndex": 28,
    "safetyIndex": 72
  },
  {
    "id": 1145,
    "sector": "F21",
    "countryId": 163,
    "countryCode": "SI",
    "countryName": "Slovenia",
    "cultureCode": 10,
    "name": "Celje",
    "population": 38380,
    "populationRating": 2,
    "populationType": "Town",
    "cityTypes": [
      "Industrial",
      "Company"
    ],
    "hvt": "",
    "crimeIndex": 27,
    "safetyIndex": 73
  },
  {
    "id": 1146,
    "sector": "F21",
    "countryId": 163,
    "countryCode": "SI",
    "countryName": "Slovenia",
    "cultureCode": 10,
    "name": "Koper",
    "population": 25753,
    "populationRating": 2,
    "populationType": "Town",
    "cityTypes": [
      "Port",
      "Tourism"
    ],
    "hvt": "",
    "crimeIndex": 25,
    "safetyIndex": 75
  },
  {
    "id": 1147,
    "sector": "F22",
    "countryId": 160,
    "countryCode": "SK",
    "countryName": "Slovakia",
    "cultureCode": 10,
    "name": "Bratislava",
    "population": 475503,
    "populationRating": 4,
    "populationType": "Capital",
    "cityTypes": [
      "Political",
      "Educational",
      "Company"
    ],
    "hvt": "",
    "crimeIndex": 30,
    "safetyIndex": 70
  },
  {
    "id": 1148,
    "sector": "F22",
    "countryId": 160,
    "countryCode": "SK",
    "countryName": "Slovakia",
    "cultureCode": 10,
    "name": "Kosice",
    "population": 228756,
    "populationRating": 4,
    "populationType": "City",
    "cityTypes": [
      "Industrial",
      "Educational"
    ],
    "hvt": "",
    "crimeIndex": 32,
    "safetyIndex": 68
  },
  {
    "id": 1149,
    "sector": "F22",
    "countryId": 160,
    "countryCode": "SK",
    "countryName": "Slovakia",
    "cultureCode": 10,
    "name": "Presov",
    "population": 84824,
    "populationRating": 3,
    "populationType": "Town",
    "cityTypes": [
      "Industrial",
      "Company"
    ],
    "hvt": "",
    "crimeIndex": 31,
    "safetyIndex": 69
  },
  {
    "id": 1150,
    "sector": "F22",
    "countryId": 160,
    "countryCode": "SK",
    "countryName": "Slovakia",
    "cultureCode": 10,
    "name": "Zilina",
    "population": 82656,
    "populationRating": 3,
    "populationType": "Town",
    "cityTypes": [
      "Industrial",
      "Company"
    ],
    "hvt": "",
    "crimeIndex": 29,
    "safetyIndex": 71
  },
  {
    "id": 1151,
    "sector": "F22",
    "countryId": 160,
    "countryCode": "SK",
    "countryName": "Slovakia",
    "cultureCode": 10,
    "name": "Nitra",
    "population": 78353,
    "populationRating": 3,
    "populationType": "Town",
    "cityTypes": [
      "Educational",
      "Industrial"
    ],
    "hvt": "",
    "crimeIndex": 30,
    "safetyIndex": 70
  },
  {
    "id": 1152,
    "sector": "L13",
    "countryId": 149,
    "countryCode": "SR",
    "countryName": "Suriname",
    "cultureCode": 12,
    "name": "Paramaribo",
    "population": 240924,
    "populationRating": 4,
    "populationType": "Capital",
    "cityTypes": [
      "Political",
      "Port",
      "Company"
    ],
    "hvt": "",
    "crimeIndex": 48,
    "safetyIndex": 52
  },
  {
    "id": 1153,
    "sector": "L13",
    "countryId": 149,
    "countryCode": "SR",
    "countryName": "Suriname",
    "cultureCode": 12,
    "name": "Lelydorp",
    "population": 18663,
    "populationRating": 2,
    "populationType": "Town",
    "cityTypes": [
      "Industrial",
      "Company"
    ],
    "hvt": "",
    "crimeIndex": 44,
    "safetyIndex": 56
  },
  {
    "id": 1154,
    "sector": "L13",
    "countryId": 149,
    "countryCode": "SR",
    "countryName": "Suriname",
    "cultureCode": 12,
    "name": "Nieuw Nickerie",
    "population": 13650,
    "populationRating": 2,
    "populationType": "Town",
    "cityTypes": [
      "Port",
      "Industrial"
    ],
    "hvt": "",
    "crimeIndex": 42,
    "safetyIndex": 58
  },
  {
    "id": 1155,
    "sector": "L23",
    "countryId": 141,
    "countryCode": "SS",
    "countryName": "South Sudan",
    "cultureCode": 2,
    "name": "Juba",
    "population": 525953,
    "populationRating": 5,
    "populationType": "Capital",
    "cityTypes": [
      "Political",
      "Military",
      "Port"
    ],
    "hvt": "",
    "crimeIndex": 66,
    "safetyIndex": 34
  },
  {
    "id": 1156,
    "sector": "K23",
    "countryId": 141,
    "countryCode": "SS",
    "countryName": "South Sudan",
    "cultureCode": 2,
    "name": "Wau",
    "population": 232910,
    "populationRating": 4,
    "populationType": "City",
    "cityTypes": [
      "Industrial",
      "Company"
    ],
    "hvt": "",
    "crimeIndex": 60,
    "safetyIndex": 40
  },
  {
    "id": 1157,
    "sector": "K23",
    "countryId": 141,
    "countryCode": "SS",
    "countryName": "South Sudan",
    "cultureCode": 2,
    "name": "Malakal",
    "population": 160765,
    "populationRating": 3,
    "populationType": "City",
    "cityTypes": [
      "Port",
      "Military"
    ],
    "hvt": "",
    "crimeIndex": 62,
    "safetyIndex": 38
  },
  {
    "id": 1158,
    "sector": "L23",
    "countryId": 141,
    "countryCode": "SS",
    "countryName": "South Sudan",
    "cultureCode": 2,
    "name": "Yei",
    "population": 185000,
    "populationRating": 3,
    "populationType": "Town",
    "cityTypes": [
      "Company",
      "Industrial"
    ],
    "hvt": "",
    "crimeIndex": 58,
    "safetyIndex": 42
  },
  {
    "id": 1159,
    "sector": "L20",
    "countryId": 146,
    "countryCode": "ST",
    "countryName": "Sao Tome and Principe",
    "cultureCode": 2,
    "name": "Sao Tome",
    "population": 71868,
    "populationRating": 3,
    "populationType": "Capital",
    "cityTypes": [
      "Political",
      "Port",
      "Company"
    ],
    "hvt": "",
    "crimeIndex": 40,
    "safetyIndex": 60
  },
  {
    "id": 1160,
    "sector": "L20",
    "countryId": 146,
    "countryCode": "ST",
    "countryName": "Sao Tome and Principe",
    "cultureCode": 2,
    "name": "Santo Antonio",
    "population": 1156,
    "populationRating": 2,
    "populationType": "Town",
    "cityTypes": [
      "Political",
      "Port"
    ],
    "hvt": "",
    "crimeIndex": 36,
    "safetyIndex": 64
  },
  {
    "id": 1161,
    "sector": "L20",
    "countryId": 146,
    "countryCode": "ST",
    "countryName": "Sao Tome and Principe",
    "cultureCode": 2,
    "name": "Neves",
    "population": 6906,
    "populationRating": 2,
    "populationType": "Town",
    "cityTypes": [
      "Industrial",
      "Port"
    ],
    "hvt": "",
    "crimeIndex": 38,
    "safetyIndex": 62
  },
  {
    "id": 1162,
    "sector": "P23",
    "countryId": 145,
    "countryCode": "SZ",
    "countryName": "Eswatini",
    "cultureCode": 3,
    "name": "Mbabane",
    "population": 94874,
    "populationRating": 3,
    "populationType": "Capital",
    "cityTypes": [
      "Political",
      "Company"
    ],
    "hvt": "",
    "crimeIndex": 44,
    "safetyIndex": 56
  },
  {
    "id": 1163,
    "sector": "P23",
    "countryId": 145,
    "countryCode": "SZ",
    "countryName": "Eswatini",
    "cultureCode": 3,
    "name": "Manzini",
    "population": 110537,
    "populationRating": 3,
    "populationType": "City",
    "cityTypes": [
      "Industrial",
      "Company"
    ],
    "hvt": "",
    "crimeIndex": 46,
    "safetyIndex": 54
  },
  {
    "id": 1164,
    "sector": "P23",
    "countryId": 145,
    "countryCode": "SZ",
    "countryName": "Eswatini",
    "cultureCode": 3,
    "name": "Lobamba",
    "population": 11000,
    "populationRating": 2,
    "populationType": "Town",
    "cityTypes": [
      "Political",
      "Educational"
    ],
    "hvt": "",
    "crimeIndex": 40,
    "safetyIndex": 60
  },
  {
    "id": 1165,
    "sector": "P23",
    "countryId": 145,
    "countryCode": "SZ",
    "countryName": "Eswatini",
    "cultureCode": 3,
    "name": "Nhlangano",
    "population": 9016,
    "populationRating": 2,
    "populationType": "Town",
    "cityTypes": [
      "Industrial",
      "Company"
    ],
    "hvt": "",
    "crimeIndex": 42,
    "safetyIndex": 58
  },
  {
    "id": 1166,
    "sector": "L23",
    "countryId": 152,
    "countryCode": "UG",
    "countryName": "Uganda",
    "cultureCode": 2,
    "name": "Kampala",
    "population": 1650800,
    "populationRating": 6,
    "populationType": "Capital",
    "cityTypes": [
      "Political",
      "Educational",
      "Company"
    ],
    "hvt": "",
    "crimeIndex": 52,
    "safetyIndex": 48
  },
  {
    "id": 1167,
    "sector": "L23",
    "countryId": 152,
    "countryCode": "UG",
    "countryName": "Uganda",
    "cultureCode": 2,
    "name": "Nansana",
    "population": 365124,
    "populationRating": 4,
    "populationType": "City",
    "cityTypes": [
      "Industrial",
      "Company"
    ],
    "hvt": "",
    "crimeIndex": 50,
    "safetyIndex": 50
  },
  {
    "id": 1168,
    "sector": "L23",
    "countryId": 152,
    "countryCode": "UG",
    "countryName": "Uganda",
    "cultureCode": 2,
    "name": "Kira",
    "population": 317428,
    "populationRating": 4,
    "populationType": "City",
    "cityTypes": [
      "Company",
      "Industrial"
    ],
    "hvt": "",
    "crimeIndex": 48,
    "safetyIndex": 52
  },
  {
    "id": 1169,
    "sector": "L23",
    "countryId": 152,
    "countryCode": "UG",
    "countryName": "Uganda",
    "cultureCode": 2,
    "name": "Gulu",
    "population": 149802,
    "populationRating": 3,
    "populationType": "City",
    "cityTypes": [
      "Military",
      "Company"
    ],
    "hvt": "",
    "crimeIndex": 54,
    "safetyIndex": 46
  },
  {
    "id": 1170,
    "sector": "M23",
    "countryId": 152,
    "countryCode": "UG",
    "countryName": "Uganda",
    "cultureCode": 2,
    "name": "Mbarara",
    "population": 195013,
    "populationRating": 3,
    "populationType": "City",
    "cityTypes": [
      "Company",
      "Educational"
    ],
    "hvt": "",
    "crimeIndex": 49,
    "safetyIndex": 51
  }
]
