/**
 * SHTWorldMap - The actual world map for SuperHero Tactics
 * Uses react-simple-maps with grid overlay and city markers
 */

import React, { useState, useMemo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps';
import { useGameStore } from '../stores/enhancedGameStore';
import {
  MapPin,
  Users,
  AlertTriangle,
  Building,
  ZoomIn,
  ZoomOut,
  Grid,
  Eye,
  EyeOff,
} from 'lucide-react';

// World map GeoJSON URL (Natural Earth)
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// Faction countries with ISO codes
const FACTION_COUNTRIES: Record<string, string[]> = {
  'United States': ['USA'],
  'India': ['IND'],
  'China': ['CHN'],
  'Nigeria': ['NGA'],
};

// Sample cities with coordinates (from your World Bible data)
const CITIES_DATA: CityData[] = [
  // USA
  { id: 'us-dc', name: 'Washington DC', country: 'United States', lat: 38.9072, lng: -77.0369, type: 'political', population: 7, crimeIndex: 45 },
  { id: 'us-ny', name: 'New York', country: 'United States', lat: 40.7128, lng: -74.0060, type: 'company', population: 7, crimeIndex: 55 },
  { id: 'us-la', name: 'Los Angeles', country: 'United States', lat: 34.0522, lng: -118.2437, type: 'company', population: 7, crimeIndex: 52 },
  { id: 'us-chi', name: 'Chicago', country: 'United States', lat: 41.8781, lng: -87.6298, type: 'industrial', population: 6, crimeIndex: 58 },
  { id: 'us-mia', name: 'Miami', country: 'United States', lat: 25.7617, lng: -80.1918, type: 'resort', population: 5, crimeIndex: 48 },
  { id: 'us-det', name: 'Detroit', country: 'United States', lat: 42.3314, lng: -83.0458, type: 'industrial', population: 5, crimeIndex: 62 },

  // India
  { id: 'in-del', name: 'New Delhi', country: 'India', lat: 28.6139, lng: 77.2090, type: 'political', population: 7, crimeIndex: 42 },
  { id: 'in-mum', name: 'Mumbai', country: 'India', lat: 19.0760, lng: 72.8777, type: 'company', population: 7, crimeIndex: 48 },
  { id: 'in-ban', name: 'Bangalore', country: 'India', lat: 12.9716, lng: 77.5946, type: 'company', population: 6, crimeIndex: 35 },
  { id: 'in-chen', name: 'Chennai', country: 'India', lat: 13.0827, lng: 80.2707, type: 'industrial', population: 6, crimeIndex: 38 },

  // China
  { id: 'cn-bei', name: 'Beijing', country: 'China', lat: 39.9042, lng: 116.4074, type: 'political', population: 7, crimeIndex: 25 },
  { id: 'cn-sha', name: 'Shanghai', country: 'China', lat: 31.2304, lng: 121.4737, type: 'company', population: 7, crimeIndex: 28 },
  { id: 'cn-shen', name: 'Shenzhen', country: 'China', lat: 22.5431, lng: 114.0579, type: 'company', population: 7, crimeIndex: 22 },
  { id: 'cn-gua', name: 'Guangzhou', country: 'China', lat: 23.1291, lng: 113.2644, type: 'industrial', population: 7, crimeIndex: 30 },
  { id: 'cn-hon', name: 'Hong Kong', country: 'China', lat: 22.3193, lng: 114.1694, type: 'company', population: 6, crimeIndex: 18 },

  // Nigeria
  { id: 'ng-lag', name: 'Lagos', country: 'Nigeria', lat: 6.5244, lng: 3.3792, type: 'company', population: 7, crimeIndex: 65 },
  { id: 'ng-abu', name: 'Abuja', country: 'Nigeria', lat: 9.0765, lng: 7.3986, type: 'political', population: 5, crimeIndex: 48 },
  { id: 'ng-kan', name: 'Kano', country: 'Nigeria', lat: 12.0022, lng: 8.5920, type: 'industrial', population: 6, crimeIndex: 55 },
  { id: 'ng-iba', name: 'Ibadan', country: 'Nigeria', lat: 7.3775, lng: 3.9470, type: 'educational', population: 5, crimeIndex: 52 },

  // Other major cities for context
  { id: 'uk-lon', name: 'London', country: 'United Kingdom', lat: 51.5074, lng: -0.1278, type: 'political', population: 7, crimeIndex: 42 },
  { id: 'fr-par', name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522, type: 'political', population: 7, crimeIndex: 45 },
  { id: 'jp-tok', name: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503, type: 'company', population: 7, crimeIndex: 15 },
  { id: 'ru-mos', name: 'Moscow', country: 'Russia', lat: 55.7558, lng: 37.6173, type: 'political', population: 7, crimeIndex: 48 },
  { id: 'br-sao', name: 'Sao Paulo', country: 'Brazil', lat: -23.5505, lng: -46.6333, type: 'company', population: 7, crimeIndex: 58 },
  { id: 'au-syd', name: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093, type: 'company', population: 6, crimeIndex: 32 },
];

interface CityData {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  type: string;
  population: number;
  crimeIndex: number;
}

// Faction colors
const FACTION_COLORS: Record<string, string> = {
  'United States': '#3b82f6',
  'India': '#f59e0b',
  'China': '#ef4444',
  'Nigeria': '#22c55e',
};

export const SHTWorldMap: React.FC = () => {
  const { selectedFaction, selectedCountry, selectedCity, setCurrentView } = useGameStore();

  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([0, 20]);
  const [showGrid, setShowGrid] = useState(false);
  const [showCities, setShowCities] = useState(true);
  const [selectedMapCity, setSelectedMapCity] = useState<CityData | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  // Filter cities based on selection
  const visibleCities = useMemo(() => {
    if (selectedCountry) {
      return CITIES_DATA.filter(c => c.country === selectedCountry);
    }
    if (selectedFaction) {
      const factionCountries = Object.keys(FACTION_COUNTRIES).filter(
        country => selectedFaction === 'United States' ? country === 'United States' :
                   selectedFaction === 'India' ? country === 'India' :
                   selectedFaction === 'China' ? country === 'China' :
                   selectedFaction === 'Nigeria' ? country === 'Nigeria' : false
      );
      return CITIES_DATA.filter(c => factionCountries.includes(c.country));
    }
    return CITIES_DATA;
  }, [selectedFaction, selectedCountry]);

  // Get country color
  const getCountryColor = (geo: any) => {
    const countryName = geo.properties.name;

    // Highlight faction countries
    if (countryName === 'United States of America' || countryName === 'United States') {
      return selectedFaction === 'United States' ? '#1d4ed8' : '#2563eb';
    }
    if (countryName === 'India') {
      return selectedFaction === 'India' ? '#d97706' : '#f59e0b';
    }
    if (countryName === 'China') {
      return selectedFaction === 'China' ? '#b91c1c' : '#ef4444';
    }
    if (countryName === 'Nigeria') {
      return selectedFaction === 'Nigeria' ? '#15803d' : '#22c55e';
    }

    // Default colors
    if (hoveredCountry === countryName) return '#4b5563';
    return '#374151';
  };

  // City marker color based on crime
  const getCityColor = (city: CityData) => {
    if (city.crimeIndex > 55) return '#ef4444'; // High crime - red
    if (city.crimeIndex > 40) return '#f59e0b'; // Medium - yellow
    return '#22c55e'; // Low - green
  };

  // City marker size based on population
  const getCitySize = (city: CityData) => {
    return 4 + city.population;
  };

  return (
    <div className="h-full w-full bg-gray-900 flex flex-col">
      {/* Controls Bar */}
      <div className="h-12 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <span className="font-bold text-white">WORLD MAP</span>
          {selectedFaction && (
            <span className="text-sm px-2 py-1 rounded" style={{ backgroundColor: FACTION_COLORS[selectedFaction] + '40', color: FACTION_COLORS[selectedFaction] }}>
              {selectedFaction} Faction
            </span>
          )}
          {selectedCity && (
            <span className="text-sm text-gray-400">HQ: {selectedCity}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Grid Toggle */}
          <button
            className={`p-2 rounded ${showGrid ? 'bg-blue-600' : 'bg-gray-700'} hover:bg-gray-600`}
            onClick={() => setShowGrid(!showGrid)}
            title="Toggle Grid"
          >
            <Grid className="w-4 h-4 text-white" />
          </button>

          {/* Cities Toggle */}
          <button
            className={`p-2 rounded ${showCities ? 'bg-blue-600' : 'bg-gray-700'} hover:bg-gray-600`}
            onClick={() => setShowCities(!showCities)}
            title="Toggle Cities"
          >
            {showCities ? <Eye className="w-4 h-4 text-white" /> : <EyeOff className="w-4 h-4 text-white" />}
          </button>

          {/* Zoom Controls */}
          <button
            className="p-2 rounded bg-gray-700 hover:bg-gray-600"
            onClick={() => setZoom(z => Math.min(8, z * 1.5))}
          >
            <ZoomIn className="w-4 h-4 text-white" />
          </button>
          <span className="text-sm text-gray-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button
            className="p-2 rounded bg-gray-700 hover:bg-gray-600"
            onClick={() => setZoom(z => Math.max(1, z / 1.5))}
          >
            <ZoomOut className="w-4 h-4 text-white" />
          </button>

          {/* Back to Combat */}
          <button
            className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-white text-sm ml-4"
            onClick={() => setCurrentView('tactical-combat')}
          >
            Combat
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 150,
          }}
          style={{ width: '100%', height: '100%', backgroundColor: '#1a1a2e' }}
        >
          <ZoomableGroup
            zoom={zoom}
            center={center}
            onMoveEnd={({ coordinates, zoom: newZoom }) => {
              setCenter(coordinates);
              setZoom(newZoom);
            }}
          >
            {/* Grid Overlay */}
            {showGrid && (
              <g>
                {/* Latitude lines */}
                {[-60, -30, 0, 30, 60].map(lat => (
                  <line
                    key={`lat-${lat}`}
                    x1={-180}
                    y1={lat}
                    x2={180}
                    y2={lat}
                    stroke="#4a4a6a"
                    strokeWidth={0.5 / zoom}
                    strokeDasharray={`${2/zoom},${2/zoom}`}
                  />
                ))}
                {/* Longitude lines */}
                {[-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150, 180].map(lng => (
                  <line
                    key={`lng-${lng}`}
                    x1={lng}
                    y1={-90}
                    x2={lng}
                    y2={90}
                    stroke="#4a4a6a"
                    strokeWidth={0.5 / zoom}
                    strokeDasharray={`${2/zoom},${2/zoom}`}
                  />
                ))}
              </g>
            )}

            {/* Countries */}
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={getCountryColor(geo)}
                    stroke="#1f2937"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: 'none' },
                      hover: { outline: 'none', fill: '#6b7280' },
                      pressed: { outline: 'none' },
                    }}
                    onMouseEnter={() => setHoveredCountry(geo.properties.name)}
                    onMouseLeave={() => setHoveredCountry(null)}
                  />
                ))
              }
            </Geographies>

            {/* City Markers */}
            {showCities && visibleCities.map((city) => (
              <Marker
                key={city.id}
                coordinates={[city.lng, city.lat]}
                onClick={() => setSelectedMapCity(city)}
              >
                <circle
                  r={getCitySize(city) / zoom}
                  fill={getCityColor(city)}
                  stroke="#ffffff"
                  strokeWidth={1 / zoom}
                  style={{ cursor: 'pointer' }}
                />
                {zoom > 2 && (
                  <text
                    textAnchor="middle"
                    y={-getCitySize(city) / zoom - 5}
                    style={{
                      fontSize: `${10 / zoom}px`,
                      fill: '#ffffff',
                      fontFamily: 'system-ui',
                    }}
                  >
                    {city.name}
                  </text>
                )}
              </Marker>
            ))}

            {/* Selected City Highlight */}
            {selectedCity && visibleCities.find(c => c.name === selectedCity) && (
              <Marker
                coordinates={[
                  visibleCities.find(c => c.name === selectedCity)!.lng,
                  visibleCities.find(c => c.name === selectedCity)!.lat,
                ]}
              >
                <circle
                  r={15 / zoom}
                  fill="none"
                  stroke="#facc15"
                  strokeWidth={2 / zoom}
                  className="animate-pulse"
                />
              </Marker>
            )}
          </ZoomableGroup>
        </ComposableMap>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-gray-800 bg-opacity-90 p-3 rounded-lg text-sm">
          <div className="text-gray-400 mb-2 font-semibold">Legend</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-gray-300">Low Crime (&lt;40)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-gray-300">Medium Crime (40-55)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-gray-300">High Crime (&gt;55)</span>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-2 pt-2">
            <div className="text-gray-400 text-xs">Marker size = Population</div>
          </div>
        </div>

        {/* Hovered Country Info */}
        {hoveredCountry && (
          <div className="absolute top-4 left-4 bg-gray-800 bg-opacity-90 px-3 py-2 rounded text-white">
            {hoveredCountry}
          </div>
        )}
      </div>

      {/* City Info Panel */}
      {selectedMapCity && (
        <div className="absolute bottom-4 right-4 w-72 bg-gray-800 rounded-lg shadow-xl border border-gray-700">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white">{selectedMapCity.name}</h3>
              <button
                className="text-gray-400 hover:text-white"
                onClick={() => setSelectedMapCity(null)}
              >
                ×
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Country:</span>
                <span className="text-white">{selectedMapCity.country}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Type:</span>
                <span className="text-white capitalize">{selectedMapCity.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Population:</span>
                <span className="text-white">
                  {selectedMapCity.population === 7 ? 'Mega City' :
                   selectedMapCity.population === 6 ? 'Large City' :
                   selectedMapCity.population === 5 ? 'City' : 'Town'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Crime Index:</span>
                <span className={
                  selectedMapCity.crimeIndex > 55 ? 'text-red-400' :
                  selectedMapCity.crimeIndex > 40 ? 'text-yellow-400' : 'text-green-400'
                }>
                  {selectedMapCity.crimeIndex}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Coordinates:</span>
                <span className="text-gray-300 text-xs">
                  {selectedMapCity.lat.toFixed(2)}, {selectedMapCity.lng.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white text-sm">
                Deploy Team
              </button>
              <button className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm">
                Intel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SHTWorldMap;
