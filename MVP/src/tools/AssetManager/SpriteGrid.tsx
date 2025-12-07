import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GridConfig } from './utils/gridDetection';
import { SpriteData, ASSET_CATEGORIES } from './types';

interface SpriteGridProps {
  sourceCanvas: HTMLCanvasElement | null;
  grid: GridConfig;
  sprites: SpriteData[];
  onSpriteSelect: (index: number) => void;
  onSpriteRename: (index: number, name: string) => void;
  onSpriteCategory: (index: number, category: string) => void;
  onGridChange?: (grid: GridConfig) => void; // Called when grid lines are dragged
  selectedSprite: number | null;
}

// Line drag detection threshold (pixels)
const LINE_DRAG_THRESHOLD = 8;

type DragTarget = {
  type: 'vertical' | 'horizontal';
  index: number;
} | null;

export const SpriteGrid: React.FC<SpriteGridProps> = ({
  sourceCanvas,
  grid,
  sprites,
  onSpriteSelect,
  onSpriteRename,
  onSpriteCategory,
  onGridChange,
  selectedSprite,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredCell, setHoveredCell] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');

  // Drag state for grid lines
  const [dragTarget, setDragTarget] = useState<DragTarget>(null);
  const [hoverTarget, setHoverTarget] = useState<DragTarget>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Local copy of grid lines for dragging
  const [localVerticalLines, setLocalVerticalLines] = useState<number[]>([]);
  const [localHorizontalLines, setLocalHorizontalLines] = useState<number[]>([]);

  // Initialize local lines from grid
  useEffect(() => {
    if (grid.verticalLines) {
      setLocalVerticalLines([...grid.verticalLines]);
    }
    if (grid.horizontalLines) {
      setLocalHorizontalLines([...grid.horizontalLines]);
    }
  }, [grid.verticalLines, grid.horizontalLines]);

  // Helper to detect if mouse is near a grid line
  const detectLineAtPosition = useCallback((
    canvasX: number,
    canvasY: number,
    vertLines: number[],
    horzLines: number[]
  ): DragTarget => {
    // ALL lines are draggable including edges
    // Check vertical lines
    for (let i = 0; i < vertLines.length; i++) {
      if (Math.abs(canvasX - vertLines[i]) < LINE_DRAG_THRESHOLD) {
        return { type: 'vertical', index: i };
      }
    }
    // Check horizontal lines
    for (let i = 0; i < horzLines.length; i++) {
      if (Math.abs(canvasY - horzLines[i]) < LINE_DRAG_THRESHOLD) {
        return { type: 'horizontal', index: i };
      }
    }
    return null;
  }, []);

  // Draw the sprite sheet with grid overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !sourceCanvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = sourceCanvas.width;
    canvas.height = sourceCanvas.height;

    // Draw source image
    ctx.drawImage(sourceCanvas, 0, 0);

    // Use local lines if available, otherwise fall back to calculated positions
    const vertLines = localVerticalLines.length > 0 ? localVerticalLines :
      Array.from({ length: grid.cols + 1 }, (_, i) => Math.round(i * (canvas.width / grid.cols)));
    const horzLines = localHorizontalLines.length > 0 ? localHorizontalLines :
      Array.from({ length: grid.rows + 1 }, (_, i) => Math.round(i * (canvas.height / grid.rows)));

    // Draw grid overlay - use local lines for draggable grid
    // Draw vertical lines - ALL are draggable including edges
    for (let i = 0; i < vertLines.length; i++) {
      const x = vertLines[i];
      const isHovered = hoverTarget?.type === 'vertical' && hoverTarget.index === i;
      const isDragged = dragTarget?.type === 'vertical' && dragTarget.index === i;
      const isEdge = i === 0 || i === vertLines.length - 1;

      if (isDragged) {
        ctx.strokeStyle = 'rgba(255, 100, 100, 1)';
        ctx.lineWidth = 3;
      } else if (isHovered) {
        ctx.strokeStyle = isEdge ? 'rgba(255, 200, 100, 1)' : 'rgba(100, 255, 100, 1)';
        ctx.lineWidth = 2;
      } else {
        ctx.strokeStyle = isEdge ? 'rgba(255, 150, 50, 0.8)' : 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = isEdge ? 2 : 1;
      }

      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, canvas.height);
      ctx.stroke();
    }

    // Draw horizontal lines - ALL are draggable including edges
    for (let i = 0; i < horzLines.length; i++) {
      const y = horzLines[i];
      const isHovered = hoverTarget?.type === 'horizontal' && hoverTarget.index === i;
      const isDragged = dragTarget?.type === 'horizontal' && dragTarget.index === i;
      const isEdge = i === 0 || i === horzLines.length - 1;

      if (isDragged) {
        ctx.strokeStyle = 'rgba(255, 100, 100, 1)';
        ctx.lineWidth = 3;
      } else if (isHovered) {
        ctx.strokeStyle = isEdge ? 'rgba(255, 200, 100, 1)' : 'rgba(100, 255, 100, 1)';
        ctx.lineWidth = 2;
      } else {
        ctx.strokeStyle = isEdge ? 'rgba(255, 150, 50, 0.8)' : 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = isEdge ? 2 : 1;
      }

      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(canvas.width, y + 0.5);
      ctx.stroke();
    }

    // Highlight hovered cell (only if not dragging a line)
    if (hoveredCell !== null && !hoverTarget) {
      const col = hoveredCell % grid.cols;
      const row = Math.floor(hoveredCell / grid.cols);
      const x = vertLines[col];
      const y = horzLines[row];
      const w = vertLines[col + 1] - x;
      const h = horzLines[row + 1] - y;
      ctx.fillStyle = 'rgba(255, 255, 0, 0.2)';
      ctx.fillRect(x, y, w, h);
    }

    // Highlight selected cell
    if (selectedSprite !== null) {
      const col = selectedSprite % grid.cols;
      const row = Math.floor(selectedSprite / grid.cols);
      const x = vertLines[col];
      const y = horzLines[row];
      const w = vertLines[col + 1] - x;
      const h = horzLines[row + 1] - y;
      ctx.strokeStyle = 'rgba(255, 200, 0, 1)';
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    }

    // Draw cell numbers
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let i = 0; i < grid.totalSprites; i++) {
      const col = i % grid.cols;
      const row = Math.floor(i / grid.cols);
      const cellX = vertLines[col];
      const cellY = horzLines[row];
      const cellW = vertLines[col + 1] - cellX;
      const x = cellX + cellW / 2;
      const y = cellY + 4;

      // Background for number
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(x - 10, y - 2, 20, 14);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillText(String(i + 1), x, y);
    }
  }, [sourceCanvas, grid, hoveredCell, selectedSprite, localVerticalLines, localHorizontalLines, hoverTarget, dragTarget]);

  // Get canvas coordinates from mouse event
  const getCanvasCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      canvas,
    };
  }, []);

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    if (!coords) return;

    const vertLines = localVerticalLines.length > 0 ? localVerticalLines :
      Array.from({ length: grid.cols + 1 }, (_, i) => Math.round(i * (coords.canvas.width / grid.cols)));
    const horzLines = localHorizontalLines.length > 0 ? localHorizontalLines :
      Array.from({ length: grid.rows + 1 }, (_, i) => Math.round(i * (coords.canvas.height / grid.rows)));

    const target = detectLineAtPosition(coords.x, coords.y, vertLines, horzLines);
    if (target) {
      setDragTarget(target);
      setIsDragging(true);
      e.preventDefault();
    }
  };

  const handleCanvasMouseUp = useCallback(() => {
    if (isDragging && onGridChange) {
      // Update grid with new line positions
      const newGrid: GridConfig = {
        ...grid,
        verticalLines: [...localVerticalLines],
        horizontalLines: [...localHorizontalLines],
      };
      onGridChange(newGrid);
    }
    setDragTarget(null);
    setIsDragging(false);
  }, [isDragging, onGridChange, grid, localVerticalLines, localHorizontalLines]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Don't select cell if we just finished dragging
    if (isDragging) return;

    const coords = getCanvasCoords(e);
    if (!coords) return;

    const vertLines = localVerticalLines.length > 0 ? localVerticalLines :
      Array.from({ length: grid.cols + 1 }, (_, i) => Math.round(i * (coords.canvas.width / grid.cols)));
    const horzLines = localHorizontalLines.length > 0 ? localHorizontalLines :
      Array.from({ length: grid.rows + 1 }, (_, i) => Math.round(i * (coords.canvas.height / grid.rows)));

    // Check if near a line (don't select cell)
    const target = detectLineAtPosition(coords.x, coords.y, vertLines, horzLines);
    if (target) return;

    // Find cell from custom line positions
    let col = 0;
    let row = 0;
    for (let i = 0; i < vertLines.length - 1; i++) {
      if (coords.x >= vertLines[i] && coords.x < vertLines[i + 1]) {
        col = i;
        break;
      }
    }
    for (let i = 0; i < horzLines.length - 1; i++) {
      if (coords.y >= horzLines[i] && coords.y < horzLines[i + 1]) {
        row = i;
        break;
      }
    }

    const index = row * grid.cols + col;

    if (index >= 0 && index < grid.totalSprites && col < grid.cols && row < grid.rows) {
      onSpriteSelect(index);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    if (!coords) return;

    const vertLines = localVerticalLines.length > 0 ? localVerticalLines :
      Array.from({ length: grid.cols + 1 }, (_, i) => Math.round(i * (coords.canvas.width / grid.cols)));
    const horzLines = localHorizontalLines.length > 0 ? localHorizontalLines :
      Array.from({ length: grid.rows + 1 }, (_, i) => Math.round(i * (coords.canvas.height / grid.rows)));

    // If dragging, update line position
    if (isDragging && dragTarget) {
      if (dragTarget.type === 'vertical') {
        const idx = dragTarget.index;
        const isFirstEdge = idx === 0;
        const isLastEdge = idx === vertLines.length - 1;

        // Calculate constraints based on position
        let minX: number, maxX: number;
        if (isFirstEdge) {
          // First edge: can go from 0 to next line - 10
          minX = 0;
          maxX = vertLines[1] - 10;
        } else if (isLastEdge) {
          // Last edge: can go from prev line + 10 to canvas width
          minX = vertLines[idx - 1] + 10;
          maxX = coords.canvas.width;
        } else {
          // Middle line: constrain between neighbors
          minX = vertLines[idx - 1] + 10;
          maxX = vertLines[idx + 1] - 10;
        }

        const newX = Math.max(minX, Math.min(maxX, Math.round(coords.x)));
        const newLines = [...localVerticalLines];
        newLines[idx] = newX;
        setLocalVerticalLines(newLines);
      } else {
        const idx = dragTarget.index;
        const isFirstEdge = idx === 0;
        const isLastEdge = idx === horzLines.length - 1;

        // Calculate constraints based on position
        let minY: number, maxY: number;
        if (isFirstEdge) {
          // First edge: can go from 0 to next line - 10
          minY = 0;
          maxY = horzLines[1] - 10;
        } else if (isLastEdge) {
          // Last edge: can go from prev line + 10 to canvas height
          minY = horzLines[idx - 1] + 10;
          maxY = coords.canvas.height;
        } else {
          // Middle line: constrain between neighbors
          minY = horzLines[idx - 1] + 10;
          maxY = horzLines[idx + 1] - 10;
        }

        const newY = Math.max(minY, Math.min(maxY, Math.round(coords.y)));
        const newLines = [...localHorizontalLines];
        newLines[idx] = newY;
        setLocalHorizontalLines(newLines);
      }
      return;
    }

    // Check if hovering over a draggable line
    const target = detectLineAtPosition(coords.x, coords.y, vertLines, horzLines);
    setHoverTarget(target);

    // Update cursor
    if (target) {
      coords.canvas.style.cursor = target.type === 'vertical' ? 'col-resize' : 'row-resize';
      setHoveredCell(null);
    } else {
      coords.canvas.style.cursor = 'pointer';

      // Find cell from custom line positions
      let col = 0;
      let row = 0;
      for (let i = 0; i < vertLines.length - 1; i++) {
        if (coords.x >= vertLines[i] && coords.x < vertLines[i + 1]) {
          col = i;
          break;
        }
      }
      for (let i = 0; i < horzLines.length - 1; i++) {
        if (coords.y >= horzLines[i] && coords.y < horzLines[i + 1]) {
          row = i;
          break;
        }
      }

      const index = row * grid.cols + col;

      if (index >= 0 && index < grid.totalSprites && col < grid.cols && row < grid.rows) {
        setHoveredCell(index);
      } else {
        setHoveredCell(null);
      }
    }
  };

  const handleCanvasMouseLeave = () => {
    if (!isDragging) {
      setHoveredCell(null);
      setHoverTarget(null);
    }
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditingName(sprites[index]?.name || '');
  };

  const handleFinishEdit = () => {
    if (editingIndex !== null && editingName.trim()) {
      onSpriteRename(editingIndex, editingName.trim());
    }
    setEditingIndex(null);
    setEditingName('');
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Canvas with grid overlay - drag grid lines to adjust */}
      <div className="relative bg-gray-900 rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          className="max-w-full h-auto"
          onClick={handleCanvasClick}
          onMouseDown={handleCanvasMouseDown}
          onMouseUp={handleCanvasMouseUp}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={handleCanvasMouseLeave}
        />
        {/* Drag hint */}
        <div className="absolute top-2 left-2 bg-black/70 text-xs text-gray-300 px-2 py-1 rounded pointer-events-none">
          Drag any line (including edges) to adjust
        </div>
      </div>

      {/* Selected sprite editor */}
      {selectedSprite !== null && sprites[selectedSprite] && (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-start gap-4">
            {/* Sprite preview */}
            <div className="bg-gray-900 rounded p-2 border border-gray-700">
              <img
                src={sprites[selectedSprite].dataUrl}
                alt={sprites[selectedSprite].name}
                className="w-24 h-24 object-contain pixelated"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>

            {/* Sprite info & editor */}
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">#{selectedSprite + 1}</span>
                {editingIndex === selectedSprite ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={handleFinishEdit}
                    onKeyDown={(e) => e.key === 'Enter' && handleFinishEdit()}
                    className="flex-1 bg-gray-900 text-white px-2 py-1 rounded border border-yellow-500 focus:outline-none"
                    autoFocus
                  />
                ) : (
                  <span
                    className="flex-1 text-white font-medium cursor-pointer hover:text-yellow-400"
                    onClick={() => handleStartEdit(selectedSprite)}
                    title="Click to rename"
                  >
                    {sprites[selectedSprite].name}
                    <span className="text-gray-500 text-xs ml-2">✏️</span>
                  </span>
                )}
              </div>

              {/* Category selector */}
              <div className="flex items-center gap-2">
                <label className="text-gray-400 text-sm">Category:</label>
                <select
                  value={sprites[selectedSprite].category}
                  onChange={(e) => onSpriteCategory(selectedSprite, e.target.value)}
                  className="flex-1 bg-gray-900 text-white px-2 py-1 rounded border border-gray-600 focus:outline-none focus:border-yellow-500"
                >
                  {ASSET_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Size info */}
              <div className="text-xs text-gray-500">
                Size: {sprites[selectedSprite].width} x {sprites[selectedSprite].height}px
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sprite thumbnail strip */}
      <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
        <div className="text-xs text-gray-400 mb-2">All Sprites ({sprites.length})</div>
        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
          {sprites.map((sprite, index) => (
            <div
              key={index}
              className={`
                relative cursor-pointer rounded border-2 transition-all
                ${selectedSprite === index
                  ? 'border-yellow-500 ring-2 ring-yellow-500/50'
                  : 'border-gray-700 hover:border-gray-500'}
              `}
              onClick={() => onSpriteSelect(index)}
              title={`${sprite.name} (${sprite.category})`}
            >
              <img
                src={sprite.dataUrl}
                alt={sprite.name}
                className="w-12 h-12 object-contain bg-gray-900"
                style={{ imageRendering: 'pixelated' }}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-[8px] text-center text-white truncate px-1">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SpriteGrid;
