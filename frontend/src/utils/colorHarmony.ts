import convert from 'color-convert';

export type HarmonyMode = 'none' | 'complementary' | 'triangle' | 'square' | 'pentagon';

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
    default:              return [];
  }
}

export function computeHarmonyColors(
  h: number,
  s: number,
  l: number,
  mode: HarmonyMode
): HarmonyColor[] {
  return hueOffsets(mode).map((offset) => {
    const newH = (h + offset) % 360;
    const [r, g, b] = convert.hsl.rgb([newH, s, l]);
    return { r, g, b };
  });
}
