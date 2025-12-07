import React, { useState, useMemo } from 'react';
import { cities, City } from '../../data/cities';

interface GridCell {
  row: number;
  col: number;
  sector: string;
  cities: City[];
  countries: string[];
}

interface SectorPanelProps {
  cell: GridCell | null;
  onClose: () => void;
}

const SectorPanel: React.FC<SectorPanelProps> = ({ cell, onClose }) => {
  if (!cell) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-gray-900 border-2 border-yellow-500 rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-yellow-500">Sector {cell.sector}</h2>
            <p className="text-gray-400 text-sm">Grid Position: Row {cell.row + 1}, Column {cell.col + 1}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-blue-400 mb-2">
              Countries ({cell.countries.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {cell.countries.map((country) => (
                <span
                  key={country}
                  className="bg-blue-900/50 text-blue-200 px-3 py-1 rounded-full text-sm border border-blue-700"
                >
                  {country}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-green-400 mb-2">
              Cities ({cell.cities.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
              {cell.cities.map((city, idx) => (
                <div
                  key={idx}
                  className="bg-gray-800 border border-gray-700 rounded p-3 hover:border-green-500 transition-colors"
                >
                  <div className="font-semibold text-white">{city.name}</div>
                  <div className="text-sm text-gray-400">{city.country}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Pop: {city.population.toLocaleString()} | {city.populationType}
                  </div>
                  <div className="text-xs text-purple-400 mt-1">
                    {[city.cityType1, city.cityType2, city.cityType3, city.cityType4]
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {cell.cities.length === 0 && (
            <div className="text-gray-500 text-center py-8">
              No cities in this sector
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-yellow-600 hover:bg-yellow-500 text-black font-bold px-6 py-2 rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export const WorldMapGrid: React.FC = () => {
  const [selectedCell, setSelectedCell] = useState<GridCell | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);

  // Grid configuration - 20 columns x 10 rows
  const GRID_COLS = 20;
  const GRID_ROWS = 10;

  // Generate grid sector codes (A-T for columns, 0-9 for rows)
  const generateSectorCode = (row: number, col: number): string => {
    const colLetter = String.fromCharCode(65 + col); // A-T
    return `${colLetter}${row}`;
  };

  // Build grid data with cities grouped by sector
  const gridData = useMemo(() => {
    const grid: GridCell[][] = [];

    for (let row = 0; row < GRID_ROWS; row++) {
      const gridRow: GridCell[] = [];
      for (let col = 0; col < GRID_COLS; col++) {
        const sector = generateSectorCode(row, col);
        const citiesInSector = cities.filter((city) => city.sector === sector);
        const countriesInSector = [...new Set(citiesInSector.map((city) => city.country))];

        gridRow.push({
          row,
          col,
          sector,
          cities: citiesInSector,
          countries: countriesInSector,
        });
      }
      grid.push(gridRow);
    }

    return grid;
  }, []);

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden">
      {/* World Map Image */}
      <div className="absolute inset-0">
        <img
          src="/assets/world_map.webp"
          alt="World Map"
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>

      {/* Grid Overlay */}
      <div className="absolute inset-0 grid grid-cols-20 grid-rows-10">
        {gridData.map((row, rowIdx) =>
          row.map((cell, colIdx) => {
            const isHovered = hoveredCell?.row === rowIdx && hoveredCell?.col === colIdx;
            const hasCities = cell.cities.length > 0;

            return (
              <div
                key={`${rowIdx}-${colIdx}`}
                className={`
                  relative border border-white/10 cursor-pointer transition-all
                  ${isHovered ? 'bg-yellow-500/40 border-yellow-500/80 z-10' : ''}
                  ${!isHovered && hasCities ? 'hover:bg-blue-500/20 hover:border-blue-500/40' : ''}
                  ${!isHovered && !hasCities ? 'hover:bg-gray-500/10' : ''}
                `}
                onClick={() => hasCities && setSelectedCell(cell)}
                onMouseEnter={() => setHoveredCell({ row: rowIdx, col: colIdx })}
                onMouseLeave={() => setHoveredCell(null)}
              >
                {/* Sector Label */}
                {isHovered && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <div className="bg-black/80 text-yellow-400 px-2 py-1 rounded text-xs font-bold border border-yellow-500">
                      {cell.sector}
                    </div>
                    {hasCities && (
                      <div className="bg-black/80 text-white px-2 py-0.5 rounded text-xs mt-1">
                        {cell.cities.length} {cell.cities.length === 1 ? 'city' : 'cities'}
                      </div>
                    )}
                  </div>
                )}

                {/* City Indicator Dot */}
                {hasCities && !isHovered && (
                  <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full shadow-lg shadow-green-500/50"></div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Info Panel */}
      <div className="absolute top-4 left-4 bg-black/80 text-white p-4 rounded-lg border border-yellow-500 max-w-sm">
        <h2 className="text-xl font-bold text-yellow-500 mb-2">World Map Grid</h2>
        <p className="text-sm text-gray-300 mb-2">
          Click on any sector to view cities and countries.
        </p>
        <div className="text-xs text-gray-400 space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Sector has cities</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border border-white/30"></div>
            <span>Empty sector</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-500">
          Grid: {GRID_COLS} × {GRID_ROWS} sectors
        </div>
      </div>

      {/* Sector Detail Panel */}
      <SectorPanel cell={selectedCell} onClose={() => setSelectedCell(null)} />
    </div>
  );
};

export default WorldMapGrid;
