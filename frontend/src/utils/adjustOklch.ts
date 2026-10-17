import { rgbToOklch, oklchToRgbGamutMapped } from './gamutUtils';

export type AdjustProperty = 'brightness' | 'saturation' | 'hue';

/**
 * Brightness, saturation or hue of a color changed in OkLCH (the AI's ADJUST_VALUE), for the
 * selected color and the background alike. amount is on a 0–100 scale (default 10):
 * L by amount/100, C by amount/250, H by amount degrees. Null when it is already at the limit.
 */
export function adjustOklch(
  r: number,
  g: number,
  b: number,
  property: AdjustProperty,
  direction: 'up' | 'down',
  amount = 10
): [number, number, number] | null {
  const [okL, okC, okH] = rgbToOklch(r, g, b);

  if (property === 'brightness') {
    if (direction === 'up' && okL >= 1) return null;
    if (direction === 'down' && okL <= 0) return null;
  } else if (property === 'saturation') {
    if (direction === 'down' && okC <= 0) return null;
  }

  const sign = direction === 'up' ? 1 : -1;
  let newL = okL, newC = okC, newH = okH;
  if (property === 'brightness') {
    newL = Math.max(0, Math.min(1, okL + (sign * amount) / 100));
  } else if (property === 'saturation') {
    newC = Math.max(0, okC + (sign * amount) / 250);
  } else {
    newH = (((okH + sign * amount) % 360) + 360) % 360;
  }
  return oklchToRgbGamutMapped(newL, newC, newH);
}
