/**
 * DatabaseAdmin - Admin panel for managing game database
 * Import CSVs, view stats, export data
 */

import React, { useState, useEffect } from 'react';
import {
  initDatabase,
  importAllData,
  getDatabaseStats,
  saveDatabase,
  exportDatabase,
  clearDatabase
} from '../db';

interface ImportResult {
  table: string;
  rowsImported: number;
  errors: string[];
}

export const DatabaseAdmin: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Initialize database on mount
  useEffect(() => {
    initDatabase()
      .then(() => {
        setIsInitialized(true);
        refreshStats();
      })
      .catch(err => setError(String(err)));
  }, []);

  const refreshStats = () => {
    try {
      const dbStats = getDatabaseStats();
      setStats(dbStats);
    } catch (err) {
      console.error('Failed to get stats:', err);
    }
  };

  const handleImportAll = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const results = await importAllData(true);
      setImportResults(results);
      refreshStats();
    } catch (err) {
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearDatabase = () => {
    if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      clearDatabase();
      refreshStats();
      setImportResults([]);
    }
  };

  const handleExport = () => {
    exportDatabase();
  };

  const handleSave = () => {
    saveDatabase();
    alert('Database saved to localStorage');
  };

  const totalRows = Object.values(stats).reduce((sum, count) => sum + count, 0);

  return (
    <div className="bg-gray-900 text-white p-6 rounded-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <span>🗄️</span>
        <span>Database Admin</span>
      </h2>

      {/* Status */}
      <div className="mb-6 p-4 bg-gray-800 rounded">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-3 h-3 rounded-full ${isInitialized ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>{isInitialized ? 'Database Initialized' : 'Not Initialized'}</span>
        </div>
        <div className="text-gray-400 text-sm">
          Total rows: <span className="text-white font-bold">{totalRows.toLocaleString()}</span>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-4 p-4 bg-red-900 border border-red-600 rounded">
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={handleImportAll}
          disabled={isLoading || !isInitialized}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded font-bold"
        >
          {isLoading ? '⏳ Importing...' : '📥 Import All CSVs'}
        </button>

        <button
          onClick={handleSave}
          disabled={!isInitialized}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded font-bold"
        >
          💾 Save to Browser
        </button>

        <button
          onClick={handleExport}
          disabled={!isInitialized}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded font-bold"
        >
          📤 Export SQLite File
        </button>

        <button
          onClick={handleClearDatabase}
          disabled={!isInitialized}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded font-bold"
        >
          🗑️ Clear All Data
        </button>

        <button
          onClick={refreshStats}
          disabled={!isInitialized}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-600 rounded font-bold"
        >
          🔄 Refresh Stats
        </button>
      </div>

      {/* Table Stats */}
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-3">📊 Table Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Object.entries(stats).map(([table, count]) => (
            <div
              key={table}
              className={`p-3 rounded ${count > 0 ? 'bg-green-900' : 'bg-gray-800'}`}
            >
              <div className="font-bold capitalize">{table.replace(/_/g, ' ')}</div>
              <div className={`text-2xl ${count > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                {count}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Import Results */}
      {importResults.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-3">📋 Last Import Results</h3>
          <div className="bg-gray-800 rounded overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="p-2 text-left">Table</th>
                  <th className="p-2 text-right">Rows</th>
                  <th className="p-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {importResults.map((result) => (
                  <tr key={result.table} className="border-t border-gray-700">
                    <td className="p-2 capitalize">{result.table}</td>
                    <td className="p-2 text-right">{result.rowsImported}</td>
                    <td className="p-2">
                      {result.errors.length > 0 ? (
                        <span className="text-red-400" title={result.errors.join(', ')}>
                          ❌ {result.errors.length} error(s)
                        </span>
                      ) : result.rowsImported > 0 ? (
                        <span className="text-green-400">✅ Success</span>
                      ) : (
                        <span className="text-yellow-400">⚠️ No data</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CSV File List */}
      <div className="mt-6">
        <h3 className="text-xl font-bold mb-3">📁 Expected CSV Files</h3>
        <div className="bg-gray-800 p-4 rounded text-sm">
          <p className="text-gray-400 mb-2">Place these files in <code className="bg-gray-900 px-1 rounded">/public/data/</code>:</p>
          <ul className="grid grid-cols-2 gap-1">
            <li>Weapons_Complete.csv</li>
            <li>Tech_Gadgets_Complete.csv</li>
            <li>Cities.csv</li>
            <li>Countries.csv</li>
            <li>Powers.csv</li>
            <li>Skills.csv</li>
            <li>StatusEffects.csv</li>
            <li>Armor.csv</li>
            <li>Ammunition.csv</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DatabaseAdmin;
