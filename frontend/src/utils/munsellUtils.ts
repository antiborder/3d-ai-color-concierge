const HUE_FAMILY_OFFSETS: Record<string, number> = {
  R: 0, YR: 10, Y: 20, GY: 30, G: 40,
  BG: 50, B: 60, PB: 70, P: 80, RP: 90,
};

export interface MunsellHVC {
  hueNum: number | null; // null for achromatics (C* < threshold)
  value: number;         // 0–10  (= L* / 10)
  chroma: number;        // 0–20  (= C*_ab / 5)
}

export function parseMunsellNotation(name1: string): MunsellHVC | null {
  const neutralMatch = name1.match(/^N\s+(\d+(?:\.\d+)?)\//);
  if (neutralMatch) {
    return { hueNum: null, value: parseFloat(neutralMatch[1]), chroma: 0 };
  }
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

// The LCH cylinder is CIE LCH scaled to unit-like ranges:
//   value  = L* / 10        (0–10)
//   chroma = C*_ab / 5      (0–20)
//   hueNum = h° * 100/360   (0–100)
//
// Single, exact, invertible transformation applied to ALL colors uniformly.
export function getMunsellHVC(r: number, g: number, b: number): MunsellHVC {
  const [L, a, bLab] = rgbToLab(Math.round(r), Math.round(g), Math.round(b));
  const value = Math.max(0, Math.min(10, L / 10));
  const C_star = Math.sqrt(a * a + bLab * bLab);
  if (C_star < 2) return { hueNum: null, value, chroma: 0 };
  const chroma = Math.min(C_star / 5, 20);
  const hueNum = ((Math.atan2(bLab, a) / (2 * Math.PI)) * 100 + 100) % 100;
  return { hueNum, value, chroma };
}

// Inverse: LCH HVC → sRGB  (exact inverse of getMunsellHVC)
// Used for slider control — changing H/V/C updates the displayed color.
export function munsellHVCtoRgb(
  hueNum: number | null,
  value: number,
  chroma: number
): [number, number, number] {
  const L = value * 10;
  let a = 0, bLab = 0;
  if (hueNum !== null && chroma > 0) {
    const C_star = chroma * 5;
    const theta = (hueNum / 100) * 2 * Math.PI;
    a = C_star * Math.cos(theta);
    bLab = C_star * Math.sin(theta);
  }
  // CIE Lab → XYZ (D65)
  const fy = (L + 16) / 116;
  const fx = a / 500 + fy;
  const fz = fy - bLab / 200;
  const fInv = (t: number) => (t > 0.008856 ? t * t * t : (t - 16 / 116) / 7.787);
  const X = fInv(fx) * 0.95047;
  const Y = fInv(fy);
  const Z = fInv(fz) * 1.08883;
  // XYZ → linear sRGB
  const rl =  X *  3.2404542 - Y * 1.5371385 - Z * 0.4985314;
  const gl = -X *  0.9692660 + Y * 1.8760108 + Z * 0.0415560;
  const bl =  X *  0.0556434 - Y * 0.2040259 + Z * 1.0572252;
  // Linear → gamma-corrected sRGB, clamped to 0–255
  const toSrgb = (c: number) => {
    const v = Math.max(0, Math.min(1, c));
    return Math.round((v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055) * 255);
  };
  return [toSrgb(rl), toSrgb(gl), toSrgb(bl)];
}
