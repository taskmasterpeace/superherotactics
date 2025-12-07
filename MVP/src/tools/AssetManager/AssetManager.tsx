import React, { useState, useCallback, useRef } from 'react';
import { SheetUploader } from './SheetUploader';
import { SpriteGrid } from './SpriteGrid';
import { SpriteData, ASSET_CATEGORIES, DEFAULT_PROCESSING_OPTIONS, ProcessingOptions, OUTPUT_SIZE_PRESETS, ASPECT_RATIO_PRESETS, AnchorPosition } from './types';
import { detectGrid, autoDetectGrid, GridConfig, GRID_PRESETS, GridPresetKey } from './utils/gridDetection';
import { loadImageToCanvas, extractAllSprites, extractAllSpritesSmart } from './utils/spriteExtraction';
import { removeBackground, TARGET_COLOR, hexToRgb, rgbToHex } from './utils/colorRemoval';

interface AssetManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AssetManager: React.FC<AssetManagerProps> = ({ isOpen, onClose }) => {
  const [sourceCanvas, setSourceCanvas] = useState<HTMLCanvasElement | null>(null);
  const [grid, setGrid] = useState<GridConfig | null>(null);
  const [sprites, setSprites] = useState<SpriteData[]>([]);
  const [selectedSprite, setSelectedSprite] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [options, setOptions] = useState<ProcessingOptions>(DEFAULT_PROCESSING_OPTIONS);
  const [gridPreset, setGridPreset] = useState<GridPresetKey>('nano-banana-pro');
  const [defaultCategory, setDefaultCategory] = useState('misc');
  const [namePrefix, setNamePrefix] = useState('sprite');
  const [bgColorHex, setBgColorHex] = useState('#2D233C');
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [customCols, setCustomCols] = useState<number>(6);
  const [customRows, setCustomRows] = useState<number>(5);

  // Handle file upload
  const handleUpload = useCallback(async (file: File) => {
    setIsLoading(true);
    setSprites([]);
    setSelectedSprite(null);

    try {
      const canvas = await loadImageToCanvas(file);
      setSourceCanvas(canvas);

      const preset = GRID_PRESETS[gridPreset];
      const detectedGrid = detectGrid(canvas.width, canvas.height, preset.cols, preset.rows);
      setGrid(detectedGrid);

      // Auto-generate sprite data
      const extracted = extractAllSprites(
        canvas,
        detectedGrid,
        false, // Don't remove background yet
        options.backgroundColor,
        options.tolerance,
        namePrefix
      );

      setSprites(extracted.map((sprite, i) => ({
        index: i,
        col: sprite.col,
        row: sprite.row,
        name: sprite.name,
        category: defaultCategory,
        tags: [],
        dataUrl: sprite.dataUrl,
        width: sprite.width,
        height: sprite.height,
        selected: false,
      })));
    } catch (error) {
      console.error('Failed to load image:', error);
    } finally {
      setIsLoading(false);
    }
  }, [gridPreset, namePrefix, defaultCategory, options]);

  // Process sprites (remove background, smart crop)
  const handleProcess = useCallback(async () => {
    if (!sourceCanvas || !grid) return;

    setIsProcessing(true);

    try {
      let extracted;

      if (options.smartCrop) {
        // Smart extraction: remove bg, crop to content, fit aspect ratio, resize to target
        extracted = extractAllSpritesSmart(
          sourceCanvas,
          grid,
          options.backgroundColor,
          options.tolerance,
          namePrefix,
          options.targetSize,
          options.padding,
          options.anchor,
          options.aspectRatio
        );
      } else {
        // Standard extraction
        extracted = extractAllSprites(
          sourceCanvas,
          grid,
          options.removeBackground,
          options.backgroundColor,
          options.tolerance,
          namePrefix
        );
      }

      setSprites(prev =>
        prev.map((sprite, i) => ({
          ...sprite,
          dataUrl: extracted[i]?.dataUrl || sprite.dataUrl,
          width: extracted[i]?.width || sprite.width,
          height: extracted[i]?.height || sprite.height,
        }))
      );
    } catch (error) {
      console.error('Failed to process sprites:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [sourceCanvas, grid, options, namePrefix]);

  // Update sprite name
  const handleRename = useCallback((index: number, name: string) => {
    setSprites(prev =>
      prev.map((sprite, i) =>
        i === index ? { ...sprite, name } : sprite
      )
    );
  }, []);

  // Update sprite category
  const handleCategory = useCallback((index: number, category: string) => {
    setSprites(prev =>
      prev.map((sprite, i) =>
        i === index ? { ...sprite, category } : sprite
      )
    );
  }, []);

  // Apply default category to all
  const handleApplyDefaultCategory = useCallback(() => {
    setSprites(prev =>
      prev.map(sprite => ({ ...sprite, category: defaultCategory }))
    );
  }, [defaultCategory]);

  // Rename all with prefix
  const handleApplyNamingPrefix = useCallback(() => {
    setSprites(prev =>
      prev.map((sprite, i) => ({
        ...sprite,
        name: `${namePrefix}_${String(i + 1).padStart(2, '0')}`,
      }))
    );
  }, [namePrefix]);

  // Handle background color change
  const handleBgColorChange = useCallback((hex: string) => {
    setBgColorHex(hex);
    const rgb = hexToRgb(hex);
    if (rgb) {
      setOptions(prev => ({ ...prev, backgroundColor: rgb }));
    }
  }, []);

  // Apply custom grid dimensions
  const handleApplyCustomGrid = useCallback(() => {
    if (!sourceCanvas || customCols < 1 || customRows < 1) return;

    const newGrid = detectGrid(
      sourceCanvas.width,
      sourceCanvas.height,
      customCols,
      customRows
    );
    setGrid(newGrid);

    // Re-extract sprites with new grid
    const extracted = extractAllSprites(
      sourceCanvas,
      newGrid,
      false,
      options.backgroundColor,
      options.tolerance,
      namePrefix
    );

    setSprites(extracted.map((sprite, i) => ({
      index: i,
      col: sprite.col,
      row: sprite.row,
      name: sprite.name,
      category: defaultCategory,
      tags: [],
      dataUrl: sprite.dataUrl,
      width: sprite.width,
      height: sprite.height,
      selected: false,
    })));
  }, [sourceCanvas, customCols, customRows, options.backgroundColor, options.tolerance, namePrefix, defaultCategory]);

  // Auto-detect grid from background color
  const handleAutoDetect = useCallback(async () => {
    if (!sourceCanvas) return;

    setIsLoading(true);

    try {
      const detected = autoDetectGrid(
        sourceCanvas,
        options.backgroundColor,
        options.tolerance,
        0.6 // min line ratio - lower for more sensitivity
      );

      if (detected && detected.cols > 0 && detected.rows > 0) {
        console.log(`Auto-detected grid: ${detected.cols}x${detected.rows}`);

        // Create a new grid config from detected values
        const newGrid = detectGrid(
          sourceCanvas.width,
          sourceCanvas.height,
          detected.cols,
          detected.rows
        );
        setGrid(newGrid);

        // Re-extract sprites with new grid
        const extracted = extractAllSprites(
          sourceCanvas,
          newGrid,
          false,
          options.backgroundColor,
          options.tolerance,
          namePrefix
        );

        setSprites(extracted.map((sprite, i) => ({
          index: i,
          col: sprite.col,
          row: sprite.row,
          name: sprite.name,
          category: defaultCategory,
          tags: [],
          dataUrl: sprite.dataUrl,
          width: sprite.width,
          height: sprite.height,
          selected: false,
        })));
      } else {
        console.warn('Could not auto-detect grid, using current preset');
      }
    } catch (error) {
      console.error('Auto-detect failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sourceCanvas, options.backgroundColor, options.tolerance, namePrefix, defaultCategory]);

  // Export sprites
  const handleExport = useCallback(async () => {
    if (sprites.length === 0) return;

    setExportStatus('Preparing export...');

    try {
      // Group sprites by category
      const byCategory: Record<string, SpriteData[]> = {};
      sprites.forEach(sprite => {
        if (!byCategory[sprite.category]) {
          byCategory[sprite.category] = [];
        }
        byCategory[sprite.category].push(sprite);
      });

      // Generate manifest
      const manifest = {
        version: '1.0',
        generated: new Date().toISOString(),
        assets: {} as Record<string, { id: string; file: string; width: number; height: number; tags: string[] }[]>,
      };

      // For now, trigger downloads (browser-based export)
      let downloadCount = 0;
      const totalFiles = sprites.length;

      for (const [category, categorySprites] of Object.entries(byCategory)) {
        manifest.assets[category] = [];

        for (const sprite of categorySprites) {
          const filename = `${sprite.name}.png`;
          const filePath = `assets/${category}/${filename}`;

          manifest.assets[category].push({
            id: sprite.name,
            file: filePath,
            width: sprite.width,
            height: sprite.height,
            tags: sprite.tags,
          });

          // Download each sprite
          const link = document.createElement('a');
          link.download = filename;
          link.href = sprite.dataUrl;
          link.click();

          downloadCount++;
          setExportStatus(`Exporting ${downloadCount}/${totalFiles}...`);
          await new Promise(r => setTimeout(r, 100)); // Stagger downloads
        }
      }

      // Download manifest
      const manifestBlob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
      const manifestLink = document.createElement('a');
      manifestLink.download = 'manifest.json';
      manifestLink.href = URL.createObjectURL(manifestBlob);
      manifestLink.click();

      setExportStatus(`Exported ${totalFiles} sprites + manifest.json`);
      setTimeout(() => setExportStatus(null), 3000);
    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus('Export failed!');
      setTimeout(() => setExportStatus(null), 3000);
    }
  }, [sprites]);

  // Reset state
  const handleReset = useCallback(() => {
    setSourceCanvas(null);
    setGrid(null);
    setSprites([]);
    setSelectedSprite(null);
    setExportStatus(null);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-full max-w-3xl bg-gray-900 shadow-2xl border-l border-gray-700 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🖼️</span>
            <div>
              <h2 className="text-xl font-bold text-white">Asset Manager</h2>
              <p className="text-xs text-gray-400">Process sprite sheets for game assets</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <span className="text-xl">✕</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Configuration Panel */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Configuration</h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Grid Preset */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Grid Layout</label>
                <div className="flex gap-1">
                  <select
                    value={gridPreset}
                    onChange={(e) => setGridPreset(e.target.value as GridPresetKey)}
                    className="flex-1 bg-gray-900 text-white text-sm px-3 py-2 rounded border border-gray-600 focus:outline-none focus:border-yellow-500"
                  >
                    {Object.entries(GRID_PRESETS).map(([key, preset]) => (
                      <option key={key} value={key}>{preset.name}</option>
                    ))}
                  </select>
                  {sourceCanvas && (
                    <button
                      onClick={handleAutoDetect}
                      className="px-2 py-1 bg-purple-700 hover:bg-purple-600 text-xs text-white rounded"
                      title="Auto-detect grid from background color"
                    >
                      Auto
                    </button>
                  )}
                </div>
              </div>

              {/* Custom Grid */}
              {sourceCanvas && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Custom Grid (Cols x Rows)</label>
                  <div className="flex gap-1 items-center">
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={customCols}
                      onChange={(e) => setCustomCols(parseInt(e.target.value) || 1)}
                      className="w-14 bg-gray-900 text-white text-sm px-2 py-2 rounded border border-gray-600 focus:outline-none focus:border-yellow-500"
                    />
                    <span className="text-gray-500">×</span>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={customRows}
                      onChange={(e) => setCustomRows(parseInt(e.target.value) || 1)}
                      className="w-14 bg-gray-900 text-white text-sm px-2 py-2 rounded border border-gray-600 focus:outline-none focus:border-yellow-500"
                    />
                    <button
                      onClick={handleApplyCustomGrid}
                      className="px-2 py-2 bg-blue-600 hover:bg-blue-500 text-xs text-white rounded"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}

              {/* Default Category */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Default Category</label>
                <div className="flex gap-1">
                  <select
                    value={defaultCategory}
                    onChange={(e) => setDefaultCategory(e.target.value)}
                    className="flex-1 bg-gray-900 text-white text-sm px-3 py-2 rounded border border-gray-600 focus:outline-none focus:border-yellow-500"
                  >
                    {ASSET_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  {sprites.length > 0 && (
                    <button
                      onClick={handleApplyDefaultCategory}
                      className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-xs text-white rounded"
                      title="Apply to all"
                    >
                      All
                    </button>
                  )}
                </div>
              </div>

              {/* Name Prefix */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Naming Prefix</label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={namePrefix}
                    onChange={(e) => setNamePrefix(e.target.value)}
                    className="flex-1 bg-gray-900 text-white text-sm px-3 py-2 rounded border border-gray-600 focus:outline-none focus:border-yellow-500"
                    placeholder="sprite"
                  />
                  {sprites.length > 0 && (
                    <button
                      onClick={handleApplyNamingPrefix}
                      className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-xs text-white rounded"
                      title="Apply to all"
                    >
                      All
                    </button>
                  )}
                </div>
              </div>

              {/* Background Color */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Background Color</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={bgColorHex}
                    onChange={(e) => handleBgColorChange(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border border-gray-600"
                  />
                  <input
                    type="text"
                    value={bgColorHex}
                    onChange={(e) => handleBgColorChange(e.target.value)}
                    className="flex-1 bg-gray-900 text-white text-sm px-3 py-2 rounded border border-gray-600 focus:outline-none focus:border-yellow-500 font-mono"
                  />
                </div>
              </div>

              {/* Tolerance */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Color Tolerance: {options.tolerance}</label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={options.tolerance}
                  onChange={(e) => setOptions(prev => ({ ...prev, tolerance: parseInt(e.target.value) }))}
                  className="w-full"
                />
              </div>

              {/* Remove Background Toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remove-bg"
                  checked={options.removeBackground}
                  onChange={(e) => setOptions(prev => ({ ...prev, removeBackground: e.target.checked }))}
                  className="w-4 h-4"
                />
                <label htmlFor="remove-bg" className="text-sm text-gray-300">Remove Background</label>
              </div>

              {/* Smart Crop Toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="smart-crop"
                  checked={options.smartCrop}
                  onChange={(e) => setOptions(prev => ({ ...prev, smartCrop: e.target.checked }))}
                  className="w-4 h-4"
                />
                <label htmlFor="smart-crop" className="text-sm text-gray-300">Smart Crop (auto-center)</label>
              </div>

              {/* Output Size - only show when smart crop is enabled */}
              {options.smartCrop && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Output Size</label>
                  <select
                    value={options.targetSize}
                    onChange={(e) => setOptions(prev => ({ ...prev, targetSize: parseInt(e.target.value) }))}
                    className="w-full bg-gray-900 text-white text-sm px-3 py-2 rounded border border-gray-600 focus:outline-none focus:border-yellow-500"
                  >
                    {OUTPUT_SIZE_PRESETS.map(preset => (
                      <option key={preset.id} value={preset.size}>{preset.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Aspect Ratio - only show when smart crop is enabled */}
              {options.smartCrop && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Aspect Ratio</label>
                  <select
                    value={options.aspectRatio}
                    onChange={(e) => setOptions(prev => ({ ...prev, aspectRatio: parseFloat(e.target.value) }))}
                    className="w-full bg-gray-900 text-white text-sm px-3 py-2 rounded border border-gray-600 focus:outline-none focus:border-yellow-500"
                  >
                    {ASPECT_RATIO_PRESETS.map(preset => (
                      <option key={preset.id} value={preset.value}>{preset.name}</option>
                    ))}
                  </select>
                  {/* Show computed output dimensions */}
                  {options.targetSize > 0 && (
                    <div className="mt-1 text-xs text-gray-500">
                      Output: {
                        options.aspectRatio > 0 && options.aspectRatio !== 1
                          ? options.aspectRatio < 1
                            ? `${Math.round(options.targetSize * options.aspectRatio)} × ${options.targetSize}`
                            : `${options.targetSize} × ${Math.round(options.targetSize / options.aspectRatio)}`
                          : `${options.targetSize} × ${options.targetSize}`
                      }px
                    </div>
                  )}
                </div>
              )}

              {/* Anchor Position - only show when smart crop is enabled */}
              {options.smartCrop && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Anchor Position</label>
                  <select
                    value={options.anchor}
                    onChange={(e) => setOptions(prev => ({ ...prev, anchor: e.target.value as AnchorPosition }))}
                    className="w-full bg-gray-900 text-white text-sm px-3 py-2 rounded border border-gray-600 focus:outline-none focus:border-yellow-500"
                  >
                    <option value="bottom">Bottom (characters)</option>
                    <option value="center">Center (items)</option>
                    <option value="top">Top</option>
                  </select>
                </div>
              )}

              {/* Padding - only show when smart crop is enabled */}
              {options.smartCrop && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Padding: {options.padding}px</label>
                  <input
                    type="range"
                    min="0"
                    max="32"
                    value={options.padding}
                    onChange={(e) => setOptions(prev => ({ ...prev, padding: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Upload or Grid View */}
          {!sourceCanvas ? (
            <SheetUploader onUpload={handleUpload} isLoading={isLoading} />
          ) : (
            <div className="space-y-4">
              {/* Action Bar */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-2">
                  <button
                    onClick={handleProcess}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-black font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <span className="animate-spin">⚙️</span> Processing...
                      </>
                    ) : options.smartCrop ? (
                      <>✨ Smart Extract</>
                    ) : (
                      <>🔧 Process Sprites</>
                    )}
                  </button>
                  <button
                    onClick={handleExport}
                    disabled={sprites.length === 0 || isProcessing}
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    📦 Export All
                  </button>
                </div>
                <button
                  onClick={handleReset}
                  className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  🔄 New Sheet
                </button>
              </div>

              {/* Export Status */}
              {exportStatus && (
                <div className="bg-blue-900/50 border border-blue-500 text-blue-200 px-4 py-2 rounded-lg text-sm">
                  {exportStatus}
                </div>
              )}

              {/* Grid View */}
              {grid && (
                <SpriteGrid
                  sourceCanvas={sourceCanvas}
                  grid={grid}
                  sprites={sprites}
                  onSpriteSelect={setSelectedSprite}
                  onSpriteRename={handleRename}
                  onSpriteCategory={handleCategory}
                  onGridChange={setGrid}
                  selectedSprite={selectedSprite}
                />
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-700 bg-gray-800 text-xs text-gray-500">
          <div className="flex justify-between flex-wrap gap-2">
            <span>
              {sprites.length > 0
                ? `${sprites.length} sprites loaded`
                : 'Upload a sprite sheet to begin'}
            </span>
            {sourceCanvas && (
              <span className="text-gray-400">
                Image: {sourceCanvas.width}x{sourceCanvas.height}px
              </span>
            )}
            {grid && (
              <span>
                Grid: {grid.cols}x{grid.rows} ({Math.round(grid.actualCellWidth || grid.cellWidth)}x{Math.round(grid.actualCellHeight || grid.cellHeight)}px cells)
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetManager;
