/**
 * Grid Detection Utility
 * Handles sprite sheet grid calculations with auto-detection
 */

export interface GridConfig {
  cols: number;
  rows: number;
  cellWidth: number;
  cellHeight: number;
  totalSprites: number;
  // For precise positioning when cells don't divide evenly
  actualCellWidth: number;
  actualCellHeight: number;
  // Custom line positions for draggable grid (pixel positions)
  // verticalLines has cols+1 entries (including start=0 and end=width)
  // horizontalLines has rows+1 entries (including start=0 and end=height)
  verticalLines?: number[];
  horizontalLines?: number[];
}

/**
 * Default grid configuration for Nano Banana Pro output
 * Standard: 6 columns x 5 rows = 30 sprites
 */
export const DEFAULT_GRID = {
  cols: 6,
  rows: 5,
};

/**
 * Detect/calculate grid dimensions from image
 */
export function detectGrid(
  imgWidth: number,
  imgHeight: number,
  cols: number = DEFAULT_GRID.cols,
  rows: number = DEFAULT_GRID.rows
): GridConfig {
  const actualCellWidth = imgWidth / cols;
  const actualCellHeight = imgHeight / rows;

  // Initialize default line positions (evenly spaced)
  const verticalLines: number[] = [];
  for (let i = 0; i <= cols; i++) {
    verticalLines.push(Math.round(i * actualCellWidth));
  }

  const horizontalLines: number[] = [];
  for (let i = 0; i <= rows; i++) {
    horizontalLines.push(Math.round(i * actualCellHeight));
  }

  return {
    cols,
    rows,
    // Use floor for extraction (avoids partial pixels)
    cellWidth: Math.floor(actualCellWidth),
    cellHeight: Math.floor(actualCellHeight),
    totalSprites: cols * rows,
    // Keep precise values for grid line drawing
    actualCellWidth,
    actualCellHeight,
    // Draggable line positions
    verticalLines,
    horizontalLines,
  };
}

/**
 * Get precise pixel position for a cell (for accurate grid lines)
 */
export function getPreciseCellBounds(
  col: number,
  row: number,
  actualCellWidth: number,
  actualCellHeight: number
): { x: number; y: number; width: number; height: number } {
  return {
    x: Math.round(col * actualCellWidth),
    y: Math.round(row * actualCellHeight),
    width: Math.round(actualCellWidth),
    height: Math.round(actualCellHeight),
  };
}

/**
 * Auto-detect grid by scanning for background color lines
 * Returns positions of vertical and horizontal separators
 */
export function autoDetectGrid(
  canvas: HTMLCanvasElement,
  bgColor: { r: number; g: number; b: number } = { r: 45, g: 35, b: 60 },
  tolerance: number = 15,
  minLineRatio: number = 0.7
): { cols: number; rows: number; colPositions: number[]; rowPositions: number[] } | null {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;

  // Helper to check if a pixel matches background
  const isBackground = (x: number, y: number): boolean => {
    const idx = (y * width + x) * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    return (
      Math.abs(r - bgColor.r) <= tolerance &&
      Math.abs(g - bgColor.g) <= tolerance &&
      Math.abs(b - bgColor.b) <= tolerance
    );
  };

  // Scan for vertical separator lines (columns of mostly background)
  const colScores: number[] = [];
  for (let x = 0; x < width; x++) {
    let bgCount = 0;
    for (let y = 0; y < height; y++) {
      if (isBackground(x, y)) bgCount++;
    }
    colScores.push(bgCount / height);
  }

  // Scan for horizontal separator lines (rows of mostly background)
  const rowScores: number[] = [];
  for (let y = 0; y < height; y++) {
    let bgCount = 0;
    for (let x = 0; x < width; x++) {
      if (isBackground(x, y)) bgCount++;
    }
    rowScores.push(bgCount / width);
  }

  // Find peaks in the scores (separator lines)
  const findPeaks = (scores: number[], dimension: number): number[] => {
    const peaks: number[] = [0]; // Always include start
    const minGap = dimension / 20; // Minimum gap between peaks

    for (let i = 1; i < scores.length - 1; i++) {
      if (scores[i] >= minLineRatio) {
        // Check if this is a local peak or part of a separator region
        if (peaks.length === 0 || i - peaks[peaks.length - 1] > minGap) {
          // Find center of the separator region
          let start = i;
          let end = i;
          while (start > 0 && scores[start - 1] >= minLineRatio) start--;
          while (end < scores.length - 1 && scores[end + 1] >= minLineRatio) end++;
          const center = Math.round((start + end) / 2);
          if (peaks.length === 0 || center - peaks[peaks.length - 1] > minGap) {
            peaks.push(center);
          }
          i = end;
        }
      }
    }
    peaks.push(dimension); // Always include end
    return peaks;
  };

  const colPositions = findPeaks(colScores, width);
  const rowPositions = findPeaks(rowScores, height);

  // Determine grid size from detected lines
  const cols = colPositions.length - 1;
  const rows = rowPositions.length - 1;

  if (cols < 1 || rows < 1) return null;

  return { cols, rows, colPositions, rowPositions };
}

/**
 * Get cell position in the grid from index
 */
export function getCellPosition(
  index: number,
  cols: number
): { col: number; row: number } {
  return {
    col: index % cols,
    row: Math.floor(index / cols),
  };
}

/**
 * Get pixel coordinates for a cell
 */
export function getCellPixelBounds(
  col: number,
  row: number,
  cellWidth: number,
  cellHeight: number
): { x: number; y: number; width: number; height: number } {
  return {
    x: col * cellWidth,
    y: row * cellHeight,
    width: cellWidth,
    height: cellHeight,
  };
}

/**
 * Get cell from pixel coordinates
 */
export function getCellFromPixel(
  pixelX: number,
  pixelY: number,
  cellWidth: number,
  cellHeight: number
): { col: number; row: number } {
  return {
    col: Math.floor(pixelX / cellWidth),
    row: Math.floor(pixelY / cellHeight),
  };
}

/**
 * Get cell bounds from custom line positions (for draggable grid)
 */
export function getCellBoundsFromLines(
  col: number,
  row: number,
  verticalLines: number[],
  horizontalLines: number[]
): { x: number; y: number; width: number; height: number } {
  const x = verticalLines[col] || 0;
  const y = horizontalLines[row] || 0;
  const nextX = verticalLines[col + 1] || verticalLines[verticalLines.length - 1];
  const nextY = horizontalLines[row + 1] || horizontalLines[horizontalLines.length - 1];

  return {
    x,
    y,
    width: nextX - x,
    height: nextY - y,
  };
}

/**
 * Preset grid configurations
 */
export const GRID_PRESETS = {
  'nano-banana-pro': { cols: 6, rows: 5, name: 'Nano Banana Pro (6x5)' },
  '4x4': { cols: 4, rows: 4, name: '4x4 Grid (16 sprites)' },
  '8x8': { cols: 8, rows: 8, name: '8x8 Grid (64 sprites)' },
  '10x10': { cols: 10, rows: 10, name: '10x10 Grid (100 sprites)' },
  'single-row': { cols: 10, rows: 1, name: 'Single Row (10 sprites)' },
} as const;

export type GridPresetKey = keyof typeof GRID_PRESETS;
