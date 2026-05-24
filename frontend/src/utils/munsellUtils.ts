import sampleColors from '../constants/sampleColors';

const HUE_FAMILY_OFFSETS: Record<string, number> = {
  R: 0, YR: 10, Y: 20, GY: 30, G: 40,
  BG: 50, B: 60, PB: 70, P: 80, RP: 90,
};

export interface MunsellHVC {
  hueNum: number | null; // null for neutrals/achromatics
  value: number;
  chroma: number;
}

export function parseMunsellNotation(name1: string): MunsellHVC | null {
  const neutralMatch = name1.match(/^N\s+(\d+(?:\.\d+)?)\//);
  if (neutralMatch) {
    return { hueNum: null, value: parseFloat(neutralMatch[1]), chroma: 0 };
  }
  // Longer family names must precede single-letter ones in the alternation
  const match = name1.match(
    /^(\d+(?:\.\d+)?)(RP|PB|BG|GY|YR|R|Y|G|B|P)\s+(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)/
  );
  if (match) {
    const prefix = parseFloat(match[1]);
    const family = match[2];
    const value = parseFloat(match[3]);
    const chroma = parseFloat(match[4]);
    const offset = HUE_FAMILY_OFFSETS[family] ?? 0;
    return { hueNum: offset + prefix, value, chroma };
  }
  return null;
}

// sRGB (0–255) → CIE Lab (D65)
function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const rl = toLinear(r), gl = toLinear(g), bl = toLinear(b);
  const Xn = (rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375) / 0.95047;
  const Yn =  rl * 0.2126729 + gl * 0.7151522 + bl * 0.0721750;
  const Zn = (rl * 0.0193339 + gl * 0.1191920 + bl * 0.9503041) / 1.08883;
  const f = (t: number) => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
  const fx = f(Xn), fy = f(Yn), fz = f(Zn);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

// CIE Lab → Munsell HVC (continuous analytical approximation)
//   V ≈ L*/10   (both are ≈ cube-root of luminance, error < ±0.3 V)
//   C ≈ C*_ab / 5.0   (empirical scale across the sRGB gamut)
//   H from atan2(b*, a*) → 0–100 Munsell hue units
function labToMunsellHVC(L: number, a: number, b: number): MunsellHVC {
  const value = Math.max(0, Math.min(10, L / 10));
  const C_star = Math.sqrt(a * a + b * b);
  if (C_star < 2) return { hueNum: null, value, chroma: 0 };
  const chroma = Math.min(C_star / 5.0, 20);
  const hueNum = ((Math.atan2(b, a) / (2 * Math.PI)) * 100 + 100) % 100;
  return { hueNum, value, chroma };
}

// Exact hex → HVC for Munsell chips (from their notation — the ground truth)
const munsellHexMap = new Map<string, MunsellHVC>();
for (const color of sampleColors) {
  if (color.tag.includes('MUNSELL')) {
    const hvc = parseMunsellNotation(color.name1);
    if (hvc) {
      const key = color.hex.toUpperCase();
      // Keep only the first (lowest-chroma) entry per hex.
      // Out-of-gamut chips share the same clamped hex; the lowest-chroma chip
      // is the sRGB gamut boundary and is the most accurate representative.
      if (!munsellHexMap.has(key)) munsellHexMap.set(key, hvc);
    }
  }
}

// Munsell chips use their exact notation HVC (ground truth).
// All other colors use the Lab→Munsell continuous approximation.
// The slight positional difference between the two methods is a necessary
// tradeoff: exact HVC keeps Munsell chips in their regular grid pattern,
// while Lab→Munsell places non-Munsell colors in approximately the right area.
export function getMunsellHVC(r: number, g: number, b: number): MunsellHVC {
  const rr = Math.round(r), gg = Math.round(g), bb = Math.round(b);
  const hex =
    '#' +
    [rr, gg, bb]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();

  const found = munsellHexMap.get(hex);
  if (found) return found;

  const [L, a, bLab] = rgbToLab(rr, gg, bb);
  return labToMunsellHVC(L, a, bLab);
}
