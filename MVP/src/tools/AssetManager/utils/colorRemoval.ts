/**
 * Color Removal Utility
 * Removes #2D233C background color from sprite sheets
 */

export const TARGET_COLOR = { r: 45, g: 35, b: 60 }; // #2D233C

/**
 * Check if a color is within tolerance of the target background color
 */
export function isTargetColor(
  r: number,
  g: number,
  b: number,
  target: { r: number; g: number; b: number } = TARGET_COLOR,
  tolerance: number = 15
): boolean {
  return (
    Math.abs(r - target.r) <= tolerance &&
    Math.abs(g - target.g) <= tolerance &&
    Math.abs(b - target.b) <= tolerance
  );
}

/**
 * Remove background color from ImageData by setting matching pixels to transparent
 */
export function removeBackground(
  imageData: ImageData,
  target: { r: number; g: number; b: number } = TARGET_COLOR,
  tolerance: number = 15
): ImageData {
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    if (isTargetColor(r, g, b, target, tolerance)) {
      data[i + 3] = 0; // Set alpha to 0 (transparent)
    }
  }

  return imageData;
}

/**
 * Process an entire canvas and remove background
 */
export function processCanvas(
  canvas: HTMLCanvasElement,
  target: { r: number; g: number; b: number } = TARGET_COLOR,
  tolerance: number = 15
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  removeBackground(imageData, target, tolerance);
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Convert hex color to RGB object
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Convert RGB to hex string
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}
