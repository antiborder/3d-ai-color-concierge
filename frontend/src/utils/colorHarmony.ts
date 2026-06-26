import convert from 'color-convert';

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
    case 'complementary':
      return [180];
    case 'triangle':
      return [120, 240];
    case 'square':
      return [90, 180, 270];
    case 'pentagon':
      return [72, 144, 216, 288];
    case 'hexagon':
      return [60, 120, 180, 240, 300];
    case 'heptagon':
      return [360 / 7, 720 / 7, 1080 / 7, 1440 / 7, 1800 / 7, 2160 / 7].map(Math.round);
    case 'octagon':
      return [45, 90, 135, 180, 225, 270, 315];
    case 'nonagon':
      return [40, 80, 120, 160, 200, 240, 280, 320];
    default:
      return [];
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
