/**
 * World Data Editor
 * Edit cities, countries, and sector assignments
 */

import React, { useState, useMemo } from 'react';
import { cities, City, CULTURE_CODES, CITY_TYPES } from '../data/cities';
import { ALL_COUNTRIES } from '../data/countries';
import toast from 'react-hot-toast';

interface WorldDataEditorProps {
  onClose?: () => void;
}

type Tab = 'cities' | 'countries' | 'sectors';

export default function WorldDataEditor({ onClose }: WorldDataEditorProps) {
  const [activeTab, setActiveTab] = useState<Tab>('cities');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<any | null>(null);
  const [filterCountry, setFilterCountry] = useState<string>('');
  const [filterCityType, setFilterCityType] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'population' | 'crimeIndex' | 'sector'>('name');

  // Get unique sectors from cities
  const uniqueSectors = useMemo(() => {
    const sectors = new Set<string>();
    cities.forEach(c => {
      if (c.sector) sectors.add(c.sector);
    });
    return Array.from(sectors).sort();
  }, []);

  // Get unique countries from cities
  const uniqueCountries = useMemo(() => {
    const countries = new Set<string>();
    cities.forEach(c => countries.add(c.country));
    return Array.from(countries).sort();
  }, []);

  // Filter and sort cities
  const filteredCities = useMemo(() => {
    let result = [...cities];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        c.sector.toLowerCase().includes(q)
      );
    }

    // Country filter
    if (filterCountry) {
      result = result.filter(c => c.country === filterCountry);
    }

    // City type filter
    if (filterCityType) {
      result = result.filter(c =>
        c.cityType1 === filterCityType ||
        c.cityType2 === filterCityType ||
        c.cityType3 === filterCityType ||
        c.cityType4 === filterCityType
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'population': return b.population - a.population;
        case 'crimeIndex': return b.crimeIndex - a.crimeIndex;
        case 'sector': return a.sector.localeCompare(b.sector);
        default: return a.name.localeCompare(b.name);
      }
    });

    return result;
  }, [searchQuery, filterCountry, filterCityType, sortBy]);

  // Filter countries
  const filteredCountries = useMemo(() => {
    if (!searchQuery) return ALL_COUNTRIES;
    const q = searchQuery.toLowerCase();
    return ALL_COUNTRIES.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Group cities by sector
  const citiesBySector = useMemo(() => {
    const map = new Map<string, City[]>();
    cities.forEach(city => {
      const sector = city.sector || 'UNASSIGNED';
      if (!map.has(sector)) map.set(sector, []);
      map.get(sector)!.push(city);
    });
    return map;
  }, []);

  const handleExportCities = () => {
    const json = JSON.stringify(filteredCities, null, 2);
    navigator.clipboard.writeText(json);
    toast.success(`Copied ${filteredCities.length} cities to clipboard`);
  };

  return (
    <div className="fixed inset-0 bg-gray-900 text-white overflow-hidden flex flex-col z-50">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-yellow-400">World Data Editor</h1>
            <p className="text-sm text-gray-400">
              {cities.length} Cities | {ALL_COUNTRIES.length} Countries | {uniqueSectors.length} Sectors
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportCities}
              className="px-3 py-2 bg-green-600 hover:bg-green-500 rounded text-sm"
            >
              Export Filtered
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="px-3 py-2 bg-red-600 hover:bg-red-500 rounded text-sm"
              >
                Close
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('cities')}
            className={`px-4 py-2 rounded-t ${activeTab === 'cities' ? 'bg-yellow-500 text-black font-bold' : 'bg-gray-700'}`}
          >
            Cities ({cities.length})
          </button>
          <button
            onClick={() => setActiveTab('countries')}
            className={`px-4 py-2 rounded-t ${activeTab === 'countries' ? 'bg-yellow-500 text-black font-bold' : 'bg-gray-700'}`}
          >
            Countries ({ALL_COUNTRIES.length})
          </button>
          <button
            onClick={() => setActiveTab('sectors')}
            className={`px-4 py-2 rounded-t ${activeTab === 'sectors' ? 'bg-yellow-500 text-black font-bold' : 'bg-gray-700'}`}
          >
            Sectors ({uniqueSectors.length})
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 flex gap-4 flex-wrap">
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-gray-700 border border-gray-600 rounded px-3 py-2 w-64"
        />

        {activeTab === 'cities' && (
          <>
            <select
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-2"
            >
              <option value="">All Countries</option>
              {uniqueCountries.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={filterCityType}
              onChange={(e) => setFilterCityType(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-2"
            >
              <option value="">All Types</option>
              {CITY_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-2"
            >
              <option value="name">Sort: Name</option>
              <option value="population">Sort: Population</option>
              <option value="crimeIndex">Sort: Crime Index</option>
              <option value="sector">Sort: Sector</option>
            </select>
          </>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main List */}
        <div className="flex-1 overflow-auto p-4">
          {activeTab === 'cities' && (
            <div className="space-y-1">
              <div className="text-sm text-gray-400 mb-2">
                Showing {filteredCities.length} of {cities.length} cities
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-800 sticky top-0">
                  <tr>
                    <th className="text-left p-2">Sector</th>
                    <th className="text-left p-2">City</th>
                    <th className="text-left p-2">Country</th>
                    <th className="text-right p-2">Population</th>
                    <th className="text-left p-2">Types</th>
                    <th className="text-right p-2">Crime</th>
                    <th className="text-left p-2">HVT</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCities.map((city, i) => (
                    <tr
                      key={`${city.name}-${i}`}
                      onClick={() => setSelectedCity(city)}
                      className={`cursor-pointer hover:bg-gray-700 ${selectedCity?.name === city.name ? 'bg-yellow-900' : i % 2 === 0 ? 'bg-gray-800' : ''}`}
                    >
                      <td className="p-2 font-mono text-yellow-400">{city.sector || '-'}</td>
                      <td className="p-2 font-bold">{city.name}</td>
                      <td className="p-2">{city.country}</td>
                      <td className="p-2 text-right">{city.population.toLocaleString()}</td>
                      <td className="p-2 text-xs">
                        {[city.cityType1, city.cityType2, city.cityType3, city.cityType4]
                          .filter(Boolean)
                          .join(', ')}
                      </td>
                      <td className={`p-2 text-right ${city.crimeIndex > 60 ? 'text-red-400' : city.crimeIndex > 40 ? 'text-yellow-400' : 'text-green-400'}`}>
                        {city.crimeIndex.toFixed(1)}
                      </td>
                      <td className="p-2 text-xs text-purple-400">{city.hvt || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'countries' && (
            <div className="space-y-1">
              <table className="w-full text-sm">
                <thead className="bg-gray-800 sticky top-0">
                  <tr>
                    <th className="text-left p-2">Code</th>
                    <th className="text-left p-2">Name</th>
                    <th className="text-right p-2">Pop Rating</th>
                    <th className="text-right p-2">GDP/Cap</th>
                    <th className="text-right p-2">Military</th>
                    <th className="text-right p-2">LSW Activity</th>
                    <th className="text-left p-2">Vigilantism</th>
                    <th className="text-left p-2">Govt Type</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCountries.map((country, i) => (
                    <tr
                      key={country.code}
                      onClick={() => setSelectedCountry(country)}
                      className={`cursor-pointer hover:bg-gray-700 ${selectedCountry?.code === country.code ? 'bg-yellow-900' : i % 2 === 0 ? 'bg-gray-800' : ''}`}
                    >
                      <td className="p-2 font-mono text-yellow-400">{country.code}</td>
                      <td className="p-2 font-bold">{country.name}</td>
                      <td className="p-2 text-right">{country.populationRating}</td>
                      <td className="p-2 text-right">{country.gdpPerCapita}</td>
                      <td className="p-2 text-right">{country.militaryBudget}</td>
                      <td className={`p-2 text-right ${country.lswActivity > 50 ? 'text-purple-400' : ''}`}>
                        {country.lswActivity}
                      </td>
                      <td className={`p-2 ${country.vigilantism === 'Unrestricted' ? 'text-green-400' : country.vigilantism === 'Banned' ? 'text-red-400' : 'text-yellow-400'}`}>
                        {country.vigilantism}
                      </td>
                      <td className="p-2 text-xs">{country.governmentType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'sectors' && (
            <div className="space-y-4">
              {Array.from(citiesBySector.entries())
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([sector, sectorCities]) => (
                  <div key={sector} className="bg-gray-800 rounded p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-bold text-yellow-400">
                        Sector: {sector}
                      </h3>
                      <span className="text-sm text-gray-400">
                        {sectorCities.length} cities
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {sectorCities.map(city => (
                        <div
                          key={city.name}
                          onClick={() => setSelectedCity(city)}
                          className="bg-gray-700 px-3 py-1 rounded cursor-pointer hover:bg-gray-600"
                        >
                          <span className="font-bold">{city.name}</span>
                          <span className="text-gray-400 text-sm ml-2">{city.country}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div className="w-96 bg-gray-800 border-l border-gray-700 overflow-y-auto p-4">
          {selectedCity && (
            <div>
              <h2 className="text-xl font-bold text-yellow-400 mb-4">{selectedCity.name}</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Country:</span>
                  <span className="font-bold">{selectedCity.country}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Sector:</span>
                  <span className="font-mono text-yellow-400">{selectedCity.sector || 'UNASSIGNED'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Population:</span>
                  <span>{selectedCity.population.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Population Type:</span>
                  <span>{selectedCity.populationType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Culture Code:</span>
                  <span>{selectedCity.cultureCode} - {CULTURE_CODES[selectedCity.cultureCode]}</span>
                </div>

                <div className="border-t border-gray-600 pt-3 mt-3">
                  <div className="text-gray-400 mb-2">City Types:</div>
                  <div className="flex flex-wrap gap-2">
                    {[selectedCity.cityType1, selectedCity.cityType2, selectedCity.cityType3, selectedCity.cityType4]
                      .filter(Boolean)
                      .map(type => (
                        <span key={type} className="bg-blue-600 px-2 py-1 rounded text-xs">
                          {type}
                        </span>
                      ))}
                  </div>
                </div>

                <div className="border-t border-gray-600 pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Crime Index:</span>
                    <span className={selectedCity.crimeIndex > 60 ? 'text-red-400' : selectedCity.crimeIndex > 40 ? 'text-yellow-400' : 'text-green-400'}>
                      {selectedCity.crimeIndex.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-600 rounded h-2 mt-1">
                    <div
                      className={`h-2 rounded ${selectedCity.crimeIndex > 60 ? 'bg-red-500' : selectedCity.crimeIndex > 40 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${selectedCity.crimeIndex}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">Safety Index:</span>
                  <span className="text-green-400">{selectedCity.safetyIndex.toFixed(2)}</span>
                </div>

                {selectedCity.hvt && (
                  <div className="border-t border-gray-600 pt-3 mt-3">
                    <div className="text-purple-400 font-bold mb-1">High Value Target:</div>
                    <div className="bg-purple-900/50 p-2 rounded text-sm">
                      {selectedCity.hvt}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedCountry && !selectedCity && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={`https://flagcdn.com/w80/${selectedCountry.code.toLowerCase()}.png`}
                  alt={selectedCountry.name}
                  className="w-12 h-8 object-cover rounded"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <h2 className="text-xl font-bold text-yellow-400">{selectedCountry.name}</h2>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Code:</span>
                  <span className="font-mono">{selectedCountry.code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Leader:</span>
                  <span>{selectedCountry.president}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Government:</span>
                  <span>{selectedCountry.governmentType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Perception:</span>
                  <span>{selectedCountry.governmentPerception}</span>
                </div>

                <div className="border-t border-gray-600 pt-3 mt-3">
                  <div className="text-gray-400 mb-2">Military & Intelligence</div>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs">
                        <span>Military Budget</span>
                        <span>{selectedCountry.militaryBudget}</span>
                      </div>
                      <div className="w-full bg-gray-600 rounded h-2">
                        <div className="h-2 rounded bg-red-500" style={{ width: `${selectedCountry.militaryBudget}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs">
                        <span>Intelligence</span>
                        <span>{selectedCountry.intelligenceBudget}</span>
                      </div>
                      <div className="w-full bg-gray-600 rounded h-2">
                        <div className="h-2 rounded bg-blue-500" style={{ width: `${selectedCountry.intelligenceBudget}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-600 pt-3 mt-3">
                  <div className="text-gray-400 mb-2">LSW Policies</div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>LSW Activity:</span>
                      <span className="text-purple-400">{selectedCountry.lswActivity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>LSW Regulations:</span>
                      <span className={selectedCountry.lswRegulations === 'Banned' ? 'text-red-400' : 'text-green-400'}>
                        {selectedCountry.lswRegulations}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Vigilantism:</span>
                      <span className={selectedCountry.vigilantism === 'Banned' ? 'text-red-400' : selectedCountry.vigilantism === 'Unrestricted' ? 'text-green-400' : 'text-yellow-400'}>
                        {selectedCountry.vigilantism}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cloning:</span>
                      <span>{selectedCountry.cloning}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-600 pt-3 mt-3">
                  <div className="text-gray-400 mb-2">Cities in this Country</div>
                  <div className="max-h-40 overflow-y-auto">
                    {cities.filter(c => c.country === selectedCountry.name).map(city => (
                      <div
                        key={city.name}
                        onClick={() => { setSelectedCity(city); setSelectedCountry(null); }}
                        className="py-1 px-2 hover:bg-gray-700 rounded cursor-pointer flex justify-between"
                      >
                        <span>{city.name}</span>
                        <span className="text-yellow-400 font-mono text-xs">{city.sector || '-'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!selectedCity && !selectedCountry && (
            <div className="text-center text-gray-400 mt-8">
              <p className="text-lg mb-2">No Selection</p>
              <p className="text-sm">Click a city or country to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
