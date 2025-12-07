/**
 * Sprite Extraction Utility
 * Extracts individual sprites from sprite sheets
 */

import { removeBackground as removeBgFromImage, TARGET_COLOR } from './colorRemoval';
import { GridConfig, getCellPixelBounds } from './gridDetection';
import { AnchorPosition } from '../types';

export interface ExtractedSprite {
  index: number;
  col: number;
  row: number;
  canvas: HTMLCanvasElement;
  dataUrl: string;
  width: number;
  height: number;
  name: string;
}

/**
 * Extract a single sprite from the source canvas
 */
export function extractSprite(
  sourceCanvas: HTMLCanvasElement,
  col: number,
  row: number,
  cellWidth: number,
  cellHeight: number,
  removeBackground: boolean = false,
  bgColor: { r: number; g: number; b: number } = TARGET_COLOR,
  tolerance: number = 15
): HTMLCanvasElement {
  const sourceCtx = sourceCanvas.getContext('2d');
  if (!sourceCtx) throw new Error('Could not get source canvas context');

  // Create output canvas
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = cellWidth;
  outputCanvas.height = cellHeight;
  const outputCtx = outputCanvas.getContext('2d');
  if (!outputCtx) throw new Error('Could not get output canvas context');

  // Get pixel bounds
  const bounds = getCellPixelBounds(col, row, cellWidth, cellHeight);

  // Draw the sprite section
  outputCtx.drawImage(
    sourceCanvas,
    bounds.x,
    bounds.y,
    bounds.width,
    bounds.height,
    0,
    0,
    cellWidth,
    cellHeight
  );

  // Optionally remove background
  if (removeBackground) {
    const imageData = outputCtx.getImageData(0, 0, cellWidth, cellHeight);
    removeBgFromImage(imageData, bgColor, tolerance);
    outputCtx.putImageData(imageData, 0, 0);
  }

  return outputCanvas;
}

/**
 * Extract all sprites from a sprite sheet using precise bounds
 */
export function extractAllSprites(
  sourceCanvas: HTMLCanvasElement,
  grid: GridConfig,
  removeBg: boolean = true,
  bgColor: { r: number; g: number; b: number } = TARGET_COLOR,
  tolerance: number = 15,
  namePrefix: string = 'sprite'
): ExtractedSprite[] {
  const sprites: ExtractedSprite[] = [];

  // Use custom line positions if available, otherwise fall back to uniform grid
  const hasCustomLines = grid.verticalLines && grid.horizontalLines &&
                         grid.verticalLines.length > grid.cols &&
                         grid.horizontalLines.length > grid.rows;

  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      const index = row * grid.cols + col;

      let x: number, y: number, w: number, h: number;

      if (hasCustomLines) {
        // Use custom dragged grid line positions
        x = grid.verticalLines![col];
        y = grid.horizontalLines![row];
        w = grid.verticalLines![col + 1] - x;
        h = grid.horizontalLines![row + 1] - y;
      } else {
        // Fall back to uniform grid calculation
        const actualCellWidth = grid.actualCellWidth || (sourceCanvas.width / grid.cols);
        const actualCellHeight = grid.actualCellHeight || (sourceCanvas.height / grid.rows);
        x = Math.round(col * actualCellWidth);
        y = Math.round(row * actualCellHeight);
        w = Math.round((col + 1) * actualCellWidth) - x;
        h = Math.round((row + 1) * actualCellHeight) - y;
      }

      const canvas = extractSpriteWithBounds(
        sourceCanvas,
        x,
        y,
        w,
        h,
        removeBg,
        bgColor,
        tolerance
      );

      sprites.push({
        index,
        col,
        row,
        canvas,
        dataUrl: canvas.toDataURL('image/png'),
        width: w,
        height: h,
        name: `${namePrefix}_${String(index + 1).padStart(2, '0')}`,
      });
    }
  }

  return sprites;
}

/**
 * Extract a sprite using exact pixel bounds
 */
export function extractSpriteWithBounds(
  sourceCanvas: HTMLCanvasElement,
  x: number,
  y: number,
  width: number,
  height: number,
  removeBg: boolean = false,
  bgColor: { r: number; g: number; b: number } = TARGET_COLOR,
  tolerance: number = 15
): HTMLCanvasElement {
  const sourceCtx = sourceCanvas.getContext('2d');
  if (!sourceCtx) throw new Error('Could not get source canvas context');

  // Create output canvas
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = width;
  outputCanvas.height = height;
  const outputCtx = outputCanvas.getContext('2d');
  if (!outputCtx) throw new Error('Could not get output canvas context');

  // Draw the sprite section
  outputCtx.drawImage(
    sourceCanvas,
    x,
    y,
    width,
    height,
    0,
    0,
    width,
    height
  );

  // Optionally remove background
  if (removeBg) {
    const imageData = outputCtx.getImageData(0, 0, width, height);
    removeBgFromImage(imageData, bgColor, tolerance);
    outputCtx.putImageData(imageData, 0, 0);
  }

  return outputCanvas;
}

/**
 * Load image into a canvas
 */
export function loadImageToCanvas(file: File): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Download a sprite as PNG
 */
export function downloadSprite(sprite: ExtractedSprite, filename?: string): void {
  const link = document.createElement('a');
  link.download = filename || `${sprite.name}.png`;
  link.href = sprite.dataUrl;
  link.click();
}

/**
 * Download all sprites as individual files
 */
export function downloadAllSprites(sprites: ExtractedSprite[]): void {
  sprites.forEach((sprite, i) => {
    setTimeout(() => {
      downloadSprite(sprite);
    }, i * 100); // Stagger downloads
  });
}

/**
 * Check if a sprite is empty (all transparent)
 */
export function isSpriteEmpty(canvas: HTMLCanvasElement, threshold: number = 0.01): boolean {
  const ctx = canvas.getContext('2d');
  if (!ctx) return true;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  let nonTransparentPixels = 0;
  const totalPixels = canvas.width * canvas.height;

  for (let i = 3; i < data.length; i += 4) {
    if (data[i] > 0) {
      nonTransparentPixels++;
    }
  }

  return (nonTransparentPixels / totalPixels) < threshold;
}

/**
 * Find the bounding box of non-transparent pixels
 */
export function findContentBounds(canvas: HTMLCanvasElement): {
  x: number; y: number; width: number; height: number
} | null {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let hasContent = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const alpha = data[idx + 3];

      if (alpha > 10) { // Non-transparent pixel (threshold for anti-aliasing)
        hasContent = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!hasContent) return null;

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1
  };
}

/**
 * Crop canvas to content bounds
 */
export function cropToContent(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const bounds = findContentBounds(canvas);

  if (!bounds) {
    // Return empty 1x1 canvas if no content
    const empty = document.createElement('canvas');
    empty.width = 1;
    empty.height = 1;
    return empty;
  }

  const cropped = document.createElement('canvas');
  cropped.width = bounds.width;
  cropped.height = bounds.height;

  const ctx = cropped.getContext('2d');
  if (ctx) {
    ctx.drawImage(
      canvas,
      bounds.x, bounds.y, bounds.width, bounds.height,
      0, 0, bounds.width, bounds.height
    );
  }

  return cropped;
}

/**
 * Pad canvas to target aspect ratio with configurable anchor
 */
export function padToAspectRatio(
  canvas: HTMLCanvasElement,
  aspectRatio: number = 1, // 1 = square, 0.714 = 5:7 tall, 0 = keep original
  padding: number = 0, // Extra padding in pixels
  anchor: AnchorPosition = 'center' // Where to anchor content
): HTMLCanvasElement {
  const contentWidth = canvas.width;
  const contentHeight = canvas.height;

  // If aspectRatio is 0 or negative, just add padding without changing ratio
  if (aspectRatio <= 0) {
    const padded = document.createElement('canvas');
    padded.width = contentWidth + padding * 2;
    padded.height = contentHeight + padding * 2;
    const ctx = padded.getContext('2d');
    if (ctx) {
      const offsetX = padding;
      let offsetY = padding;
      // Apply anchor for Y position even without aspect ratio change
      if (anchor === 'bottom') {
        offsetY = padded.height - contentHeight - padding;
      } else if (anchor === 'top') {
        offsetY = padding;
      }
      ctx.drawImage(canvas, offsetX, offsetY);
    }
    return padded;
  }

  // Calculate target dimensions
  let targetWidth: number;
  let targetHeight: number;

  const currentRatio = contentWidth / contentHeight;

  if (currentRatio > aspectRatio) {
    // Content is wider than target ratio - height needs to increase
    targetWidth = contentWidth + padding * 2;
    targetHeight = Math.ceil(targetWidth / aspectRatio);
  } else {
    // Content is taller than target ratio - width needs to increase
    targetHeight = contentHeight + padding * 2;
    targetWidth = Math.ceil(targetHeight * aspectRatio);
  }

  // Ensure minimum padding on all sides
  targetWidth = Math.max(targetWidth, contentWidth + padding * 2);
  targetHeight = Math.max(targetHeight, contentHeight + padding * 2);

  const padded = document.createElement('canvas');
  padded.width = targetWidth;
  padded.height = targetHeight;

  const ctx = padded.getContext('2d');
  if (ctx) {
    // X is always centered
    const offsetX = Math.floor((targetWidth - contentWidth) / 2);

    // Y depends on anchor
    let offsetY: number;
    if (anchor === 'bottom') {
      // Content at bottom with padding
      offsetY = targetHeight - contentHeight - padding;
    } else if (anchor === 'top') {
      // Content at top with padding
      offsetY = padding;
    } else {
      // Center
      offsetY = Math.floor((targetHeight - contentHeight) / 2);
    }

    ctx.drawImage(canvas, offsetX, offsetY);
  }

  return padded;
}

/**
 * Resize canvas to target size with anchor position and aspect ratio support
 */
export function resizeToTarget(
  canvas: HTMLCanvasElement,
  targetSize: number, // 0 = keep original
  padding: number = 4,
  anchor: AnchorPosition = 'center',
  aspectRatio: number = 0 // 0 = square, otherwise maintain this ratio
): HTMLCanvasElement {
  if (targetSize <= 0) {
    // Just add padding with anchor
    const padded = document.createElement('canvas');
    padded.width = canvas.width + padding * 2;
    padded.height = canvas.height + padding * 2;
    const ctx = padded.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = false; // Keep pixel art crisp
      const offsetX = padding;
      let offsetY = padding;
      if (anchor === 'bottom') {
        offsetY = padded.height - canvas.height - padding;
      } else if (anchor === 'top') {
        offsetY = padding;
      }
      ctx.drawImage(canvas, offsetX, offsetY);
    }
    return padded;
  }

  // Determine output dimensions based on aspect ratio
  let outputWidth: number;
  let outputHeight: number;

  if (aspectRatio > 0 && aspectRatio !== 1) {
    if (aspectRatio < 1) {
      // Portrait (e.g., 5:7 = 0.714) - targetSize is height
      outputHeight = targetSize;
      outputWidth = Math.round(targetSize * aspectRatio);
    } else {
      // Landscape (e.g., 4:3 = 1.333) - targetSize is width
      outputWidth = targetSize;
      outputHeight = Math.round(targetSize / aspectRatio);
    }
  } else {
    // Square output
    outputWidth = targetSize;
    outputHeight = targetSize;
  }

  // Calculate scale to fit content in output size (with padding)
  const availableWidth = outputWidth - padding * 2;
  const availableHeight = outputHeight - padding * 2;
  const scale = Math.min(availableWidth / canvas.width, availableHeight / canvas.height);

  const scaledWidth = Math.floor(canvas.width * scale);
  const scaledHeight = Math.floor(canvas.height * scale);

  // Create output canvas
  const output = document.createElement('canvas');
  output.width = outputWidth;
  output.height = outputHeight;

  const ctx = output.getContext('2d');
  if (ctx) {
    ctx.imageSmoothingEnabled = false; // Keep pixel art crisp

    // X is always centered
    const offsetX = Math.floor((outputWidth - scaledWidth) / 2);

    // Y depends on anchor
    let offsetY: number;
    if (anchor === 'bottom') {
      offsetY = outputHeight - scaledHeight - padding;
    } else if (anchor === 'top') {
      offsetY = padding;
    } else {
      offsetY = Math.floor((outputHeight - scaledHeight) / 2);
    }

    ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, offsetX, offsetY, scaledWidth, scaledHeight);
  }

  return output;
}

/**
 * Smart extract: Remove background, crop to content, resize to target with aspect ratio
 */
export function smartExtractSprite(
  sourceCanvas: HTMLCanvasElement,
  x: number,
  y: number,
  width: number,
  height: number,
  bgColor: { r: number; g: number; b: number } = TARGET_COLOR,
  tolerance: number = 15,
  targetSize: number = 0, // 0 = auto-fit, otherwise resize to this size
  padding: number = 4, // Padding around content
  anchor: AnchorPosition = 'center',
  aspectRatio: number = 0 // 0 = square output, otherwise target aspect ratio (0.714 = 5:7)
): HTMLCanvasElement {
  // Step 1: Extract the raw cell with background removed
  const raw = extractSpriteWithBounds(sourceCanvas, x, y, width, height, true, bgColor, tolerance);

  // Step 2: Crop to content (remove empty space around sprite)
  const cropped = cropToContent(raw);

  // Step 3: Resize to target size with aspect ratio and anchor
  // resizeToTarget now handles aspect ratio internally
  const final = resizeToTarget(cropped, targetSize, padding, anchor, aspectRatio);

  return final;
}

/**
 * Extract a single sprite with custom crop offsets
 * Offsets expand (positive) or contract (negative) the extraction bounds
 */
export function extractSingleSpriteWithOffsets(
  sourceCanvas: HTMLCanvasElement,
  col: number,
  row: number,
  grid: GridConfig,
  offsets: { top: number; bottom: number; left: number; right: number },
  bgColor: { r: number; g: number; b: number } = TARGET_COLOR,
  tolerance: number = 15,
  smartCrop: boolean = true,
  targetSize: number = 0,
  padding: number = 4,
  anchor: AnchorPosition = 'center',
  aspectRatio: number = 0
): { canvas: HTMLCanvasElement; dataUrl: string; width: number; height: number } {
  const actualCellWidth = grid.actualCellWidth || (sourceCanvas.width / grid.cols);
  const actualCellHeight = grid.actualCellHeight || (sourceCanvas.height / grid.rows);

  // Calculate base bounds
  let x = Math.round(col * actualCellWidth);
  let y = Math.round(row * actualCellHeight);
  let w = Math.round((col + 1) * actualCellWidth) - x;
  let h = Math.round((row + 1) * actualCellHeight) - y;

  // Apply offsets (expand bounds)
  x = Math.max(0, x - offsets.left);
  y = Math.max(0, y - offsets.top);
  w = Math.min(sourceCanvas.width - x, w + offsets.left + offsets.right);
  h = Math.min(sourceCanvas.height - y, h + offsets.top + offsets.bottom);

  let canvas: HTMLCanvasElement;

  if (smartCrop) {
    canvas = smartExtractSprite(
      sourceCanvas,
      x, y, w, h,
      bgColor,
      tolerance,
      targetSize,
      padding,
      anchor,
      aspectRatio
    );
  } else {
    canvas = extractSpriteWithBounds(
      sourceCanvas,
      x, y, w, h,
      true,
      bgColor,
      tolerance
    );
  }

  return {
    canvas,
    dataUrl: canvas.toDataURL('image/png'),
    width: canvas.width,
    height: canvas.height
  };
}

/**
 * Extract all sprites with smart cropping
 */
export function extractAllSpritesSmart(
  sourceCanvas: HTMLCanvasElement,
  grid: GridConfig,
  bgColor: { r: number; g: number; b: number } = TARGET_COLOR,
  tolerance: number = 15,
  namePrefix: string = 'sprite',
  targetSize: number = 0, // 0 = auto-fit, otherwise resize to this square size
  padding: number = 4,
  anchor: AnchorPosition = 'center',
  aspectRatio: number = 0
): ExtractedSprite[] {
  const sprites: ExtractedSprite[] = [];

  // Use custom line positions if available, otherwise fall back to uniform grid
  const hasCustomLines = grid.verticalLines && grid.horizontalLines &&
                         grid.verticalLines.length > grid.cols &&
                         grid.horizontalLines.length > grid.rows;

  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      const index = row * grid.cols + col;

      let x: number, y: number, w: number, h: number;

      if (hasCustomLines) {
        // Use custom dragged grid line positions
        x = grid.verticalLines![col];
        y = grid.horizontalLines![row];
        w = grid.verticalLines![col + 1] - x;
        h = grid.horizontalLines![row + 1] - y;
      } else {
        // Fall back to uniform grid calculation
        const actualCellWidth = grid.actualCellWidth || (sourceCanvas.width / grid.cols);
        const actualCellHeight = grid.actualCellHeight || (sourceCanvas.height / grid.rows);
        x = Math.round(col * actualCellWidth);
        y = Math.round(row * actualCellHeight);
        w = Math.round((col + 1) * actualCellWidth) - x;
        h = Math.round((row + 1) * actualCellHeight) - y;
      }

      const canvas = smartExtractSprite(
        sourceCanvas,
        x, y, w, h,
        bgColor,
        tolerance,
        targetSize,
        padding,
        anchor,
        aspectRatio
      );

      sprites.push({
        index,
        col,
        row,
        canvas,
        dataUrl: canvas.toDataURL('image/png'),
        width: canvas.width,
        height: canvas.height,
        name: `${namePrefix}_${String(index + 1).padStart(2, '0')}`,
      });
    }
  }

  return sprites;
}
