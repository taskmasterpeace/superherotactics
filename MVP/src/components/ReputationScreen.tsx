import React from 'react';
import { X } from 'lucide-react';
import { useGameStore } from '../stores/enhancedGameStore';
import { getCountryByName, getCountryByCode } from '../data/allCountries';
import { ReputationPanel } from './ReputationDisplay';

/**
 * Full-screen wrapper that feeds store state into ReputationPanel
 * (faction standings, bounties, ally benefits, government relations).
 */
const ReputationScreen: React.FC = () => {
  const standings = useGameStore(s => s.factionStandings);
  const selectedCountry = useGameStore(s => s.selectedCountry);
  const setCurrentView = useGameStore(s => s.setCurrentView);

  const country = getCountryByName(selectedCountry) || getCountryByCode(selectedCountry);
  const countryCode = country?.code || selectedCountry;
  const countryName = country?.name || selectedCountry;

  return (
    <div className="h-full overflow-y-auto bg-background p-4">
      <div className="mx-auto max-w-3xl">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight text-white">STANDINGS & RELATIONS</h1>
          <button
            className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
            onClick={() => setCurrentView('world-map')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <ReputationPanel
          standings={standings || []}
          currentCountryCode={countryCode}
          currentCountryName={countryName}
        />
      </div>
    </div>
  );
};

export default ReputationScreen;
