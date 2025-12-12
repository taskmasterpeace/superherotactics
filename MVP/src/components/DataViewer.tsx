import React, { useState, useMemo } from 'react';
import { cities, City } from '../data/cities';
import { ALL_COUNTRIES, Country } from '../data/countries';
import { FLAGS } from '../data/worldData';
import {
  getAllEquipmentEntries,
  EquipmentEntry,
  Weapon,
  Armor,
  Gadget,
  Vehicle,
  Drone
} from '../data';

// Types for our data views
type DataType = 'cities' | 'countries' | 'weapons' | 'armor' | 'gadgets' | 'vehicles' | 'drones' | 'about';

interface DataViewerProps {
  onClose?: () => void;
}

export const DataViewer: React.FC<DataViewerProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<DataType>('about');
  const [searchQuery, setSearchQuery] = useState('');

  // Navigation Tabs
  const tabs: { id: DataType; label: string; icon: string }[] = [
    { id: 'about', label: 'About DB', icon: 'ℹ️' },
    { id: 'cities', label: 'Cities', icon: '🏙️' },
    { id: 'countries', label: 'Countries', icon: '🌍' },
    { id: 'weapons', label: 'Weapons', icon: '⚔️' },
    { id: 'armor', label: 'Armor', icon: '🛡️' },
    { id: 'gadgets', label: 'Gadgets', icon: '📱' },
    { id: 'vehicles', label: 'Vehicles', icon: '🚗' },
    { id: 'drones', label: 'Drones', icon: '🚁' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'about':
        return <AboutTab />;
      case 'cities':
        return <CitiesTable searchQuery={searchQuery} />;
      case 'countries':
        return <CountriesTable searchQuery={searchQuery} />;
      case 'weapons':
      case 'armor':
      case 'gadgets':
      case 'vehicles':
      case 'drones':
        return <EquipmentTable type={activeTab.slice(0, -1) as any} searchQuery={searchQuery} />;
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center shadow-md z-10">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <span className="text-2xl">💾</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">System Data Viewer</h1>
            <p className="text-xs text-blue-400">TypeScript Static Database Explorer</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Search data..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-gray-900 border border-gray-600 text-white pl-10 pr-4 py-2 rounded-full focus:outline-none focus:border-blue-500 w-64 transition-all"
            />
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-full transition-colors"
            >
              ❌
            </button>
          )}
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Tabs */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 overflow-y-auto">
          <div className="p-2 space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
              >
                <span className="text-xl">{tab.icon}</span>
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-8 px-4">
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
              <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Database Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Cities</span>
                  <span className="text-blue-400 font-mono">{cities.length.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Countries</span>
                  <span className="text-blue-400 font-mono">{ALL_COUNTRIES.length.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Equipment</span>
                  <span className="text-blue-400 font-mono">{getAllEquipmentEntries().length.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-gray-900 overflow-hidden flex flex-col">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

// --- Sub-components ---

const AboutTab = () => (
  <div className="p-8 max-w-4xl mx-auto overflow-y-auto h-full">
    <h2 className="text-3xl font-bold mb-6 text-blue-400">About the "Database"</h2>

    <div className="space-y-8">
      <section className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span className="text-2xl">🤔</span>
          What are these files?
        </h3>
        <p className="text-gray-300 leading-relaxed mb-4">
          The data you see (Cities, Countries, Weapons) is stored in <strong>TypeScript (.ts) files</strong> directly in the source code, rather than in an external SQL database like PostgreSQL or MySQL.
        </p>
        <div className="bg-gray-900 p-4 rounded-lg border-l-4 border-blue-500">
          <code className="text-sm font-mono text-green-400">
            // Example structure (cities.ts)<br />
            export const cities: City[] = [<br />
            &nbsp;&nbsp;{'{'} name: "Kabul", country: "Afghanistan", population: 4221532 ... {'}'},<br />
            &nbsp;&nbsp;{'{'} name: "Paris", country: "France", population: 2161000 ... {'}'}<br />
            ];
          </code>
        </div>
      </section>

      <section className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          Why use TypeScript files instead of a Database?
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-bold text-green-400 mb-2">Advantages</h4>
            <ul className="space-y-2 text-gray-300">
              <li className="flex gap-2">
                <span>✅</span>
                <span><strong>Zero Latency:</strong> Data is loaded instantly with the app. No network requests needed.</span>
              </li>
              <li className="flex gap-2">
                <span>✅</span>
                <span><strong>Type Safety:</strong> TypeScript ensures all data matches the expected format (schema) at compile time.</span>
              </li>
              <li className="flex gap-2">
                <span>✅</span>
                <span><strong>Version Control:</strong> Data changes are tracked in Git history, just like code.</span>
              </li>
              <li className="flex gap-2">
                <span>✅</span>
                <span><strong>Simplicity:</strong> No need to install, configure, or pay for a database server.</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-red-400 mb-2">Trade-offs</h4>
            <ul className="space-y-2 text-gray-300">
              <li className="flex gap-2">
                <span>⚠️</span>
                <span><strong>Read-Only (mostly):</strong> You can't easily "save" changes from the browser back to the file system without a backend API.</span>
              </li>
              <li className="flex gap-2">
                <span>⚠️</span>
                <span><strong>App Size:</strong> Large datasets increase the initial download size of the application (though 1000 cities is negligible).</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span className="text-2xl">🛠️</span>
          Is this "like" a database?
        </h3>
        <p className="text-gray-300 leading-relaxed">
          <strong>Yes!</strong> It fulfills the same purpose: storing structured information. In modern web development, this is often called a <em>"Static Database"</em> or <em>"In-Memory Database"</em>. For a game like SuperHero Tactics where equipment stats and city data don't change often (unlike user save files), this is an extremely efficient architecture.
        </p>
      </section>
    </div>
  </div>
);

// --- Generic Table Components ---

const TableHeader: React.FC<{ label: string; width?: string }> = ({ label, width }) => (
  <th className={`px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider ${width || ''}`}>
    {label}
  </th>
);

const CitiesTable: React.FC<{ searchQuery: string }> = ({ searchQuery }) => {
  const filteredCities = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return cities.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.country.toLowerCase().includes(q)
    ).slice(0, 100); // Limit to 100 for performance
  }, [searchQuery]);

  return (
    <div className="flex-1 overflow-auto">
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-gray-800 sticky top-0">
          <tr>
            <TableHeader label="Name" />
            <TableHeader label="Country" />
            <TableHeader label="Population" />
            <TableHeader label="Type" />
            <TableHeader label="Safety Index" />
            <TableHeader label="Sector" />
          </tr>
        </thead>
        <tbody className="bg-gray-900 divide-y divide-gray-800">
          {filteredCities.map((city, idx) => (
            <tr key={`${city.name}-${idx}`} className="hover:bg-gray-800 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap font-medium text-white">{city.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-300">{city.country}</td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-300">{city.population.toLocaleString()}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs rounded-full ${city.populationType === 'Mega City' ? 'bg-purple-900 text-purple-200' :
                  city.populationType === 'Large City' ? 'bg-blue-900 text-blue-200' :
                    'bg-gray-700 text-gray-300'
                  }`}>
                  {city.populationType}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${city.safetyIndex > 60 ? 'bg-green-500' : city.safetyIndex > 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${city.safetyIndex}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">{city.safetyIndex}</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-400 font-mono text-xs">{city.sector || 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {cities.length > 100 && (
        <div className="p-4 text-center text-gray-500 text-sm bg-gray-800">
          Showing first 100 of {cities.length} cities. Use search to find specific ones.
        </div>
      )}
    </div>
  );
};

const CountriesTable: React.FC<{ searchQuery: string }> = ({ searchQuery }) => {
  const filteredCountries = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return ALL_COUNTRIES.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <div className="flex-1 overflow-auto">
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-gray-800 sticky top-0">
          <tr>
            <TableHeader label="Flag" width="w-16" />
            <TableHeader label="Name" />
            <TableHeader label="Code" />
            <TableHeader label="Gov Type" />
            <TableHeader label="Corruption" />
            <TableHeader label="LSW Regs" />
          </tr>
        </thead>
        <tbody className="bg-gray-900 divide-y divide-gray-800">
          {filteredCountries.map((country) => (
            <tr key={country.id} className="hover:bg-gray-800 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-2xl">{FLAGS[country.name] || '🏳️'}</td>
              <td className="px-6 py-4 whitespace-nowrap font-medium text-white">{country.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-400 font-mono">{country.code}</td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-300">{country.governmentPerception}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`${country.governmentCorruption > 70 ? 'text-red-400' : 'text-green-400'}`}>
                  {country.governmentCorruption}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs rounded-full ${country.lswRegulations === 'Legal' ? 'bg-green-900 text-green-200' :
                  country.lswRegulations === 'Banned' ? 'bg-red-900 text-red-200' :
                    'bg-yellow-900 text-yellow-200'
                  }`}>
                  {country.lswRegulations}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const EquipmentTable: React.FC<{ type: 'weapon' | 'armor' | 'gadget' | 'vehicle' | 'drone'; searchQuery: string }> = ({ type, searchQuery }) => {
  const entries = useMemo(() => {
    const all = getAllEquipmentEntries();
    const q = searchQuery.toLowerCase();
    return all.filter(e =>
      e.type === type &&
      (e.name.toLowerCase().includes(q) || e.category.toLowerCase().includes(q))
    );
  }, [type, searchQuery]);

  return (
    <div className="flex-1 overflow-auto">
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-gray-800 sticky top-0">
          <tr>
            <TableHeader label="Icon" width="w-16" />
            <TableHeader label="Name" />
            <TableHeader label="Category" />
            <TableHeader label="Cost" />
            <TableHeader label="Availability" />
            <TableHeader label="Stats" />
          </tr>
        </thead>
        <tbody className="bg-gray-900 divide-y divide-gray-800">
          {entries.map((entry) => (
            <tr key={entry.id} className="hover:bg-gray-800 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-2xl">{entry.emoji}</td>
              <td className="px-6 py-4 whitespace-nowrap font-medium text-white">{entry.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-400 capitalize">{entry.category.replace(/_/g, ' ')}</td>
              <td className="px-6 py-4 whitespace-nowrap text-yellow-400 font-mono">${entry.costValue.toLocaleString()}</td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-300 capitalize">{entry.availability.replace(/_/g, ' ')}</td>
              <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">
                {type === 'weapon' && (
                  <span>DMG: {(entry.data as Weapon).baseDamage} | RNG: {(entry.data as Weapon).range}</span>
                )}
                {type === 'armor' && (
                  <span>PHY: {(entry.data as Armor).drPhysical} | ENG: {(entry.data as Armor).drEnergy}</span>
                )}
                {type === 'vehicle' && (
                  <span>SPD: {(entry.data as Vehicle).speedMPH}mph | ARM: {(entry.data as Vehicle).armorHP}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataViewer;
