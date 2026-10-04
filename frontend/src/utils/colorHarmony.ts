import { rgbToOklch, oklchToRgb, maxInGamutChromaOklch } from './gamutUtils';

export type HarmonyMode =
  | 'none'
  | 'complementary'
  | 'triangle'
  | 'square'
  | 'pentagon'
  | 'hexagon'
  | 'heptagon'
  | 'octagon'
  | 'nonagon';

export interface HarmonyColor {
  r: number;
  g: number;
  b: number;
}

function hueOffsets(mode: HarmonyMode): number[] {
  switch (mode) {
    case 'complementary': return [180];
    case 'triangle':      return [120, 240];
    case 'square':        return [90, 180, 270];
    case 'pentagon':      return [72, 144, 216, 288];
    case 'hexagon':       return [60, 120, 180, 240, 300];
    case 'heptagon':      return [1, 2, 3, 4, 5, 6].map((i) => (360 / 7) * i);
    case 'octagon':       return [45, 90, 135, 180, 225, 270, 315];
    case 'nonagon':       return [40, 80, 120, 160, 200, 240, 280, 320];
    default:              return [];
  }
}

export function computeHarmonyColors(
  r: number,
  g: number,
  b: number,
  mode: HarmonyMode
): HarmonyColor[] {
  // Harmonies are computed in OkLCH: the hue is rotated while the perceived lightness is kept.
  // OkLCH keeps hues straighter than CIE LCH when chroma changes (e.g. blue no longer drifts
  // toward purple), which matters because the chroma is reduced below.
  const [L, C, H] = rgbToOklch(r, g, b);
  const offsets = hueOffsets(mode);
  if (offsets.length === 0) return [];

  // Use the same chroma for all harmony colors so they form a regular polygon
  // in the OkLab a-b plane. safeC is the largest value in-gamut for every hue.
  const allHues = offsets.map((o) => (H + o) % 360);
  const safeC = Math.min(C, ...allHues.map((h) => maxInGamutChromaOklch(L, h)));

  return allHues.map((newH) => {
    const [nr, ng, nb] = oklchToRgb(L, safeC, newH);
    return { r: nr, g: ng, b: nb };
  });
}
