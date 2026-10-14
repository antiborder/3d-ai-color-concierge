/**
 * Unrounded RGB ↔ HSV / HSL / CMYK conversions (same scales as color-convert: hue 0–360,
 * the rest 0–100). color-convert rounds to whole numbers, which makes paths drawn through
 * these spaces jagged.
 */

type Triple = [number, number, number];

function hueOf(r: number, g: number, b: number, max: number, d: number): number {
  if (d === 0) return 0;
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

export function rgbToHsv(r: number, g: number, b: number): Triple {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const d = max - Math.min(rn, gn, bn);
  return [hueOf(rn, gn, bn, max, d), max === 0 ? 0 : (d / max) * 100, max * 100];
}

export function hsvToRgb(h: number, s: number, v: number): Triple {
  const sn = s / 100,
    vn = v / 100;
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return (vn - vn * sn * Math.max(0, Math.min(k, 4 - k, 1))) * 255;
  };
  return [f(5), f(3), f(1)];
}

export function rgbToHsl(r: number, g: number, b: number): Triple {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return [hueOf(rn, gn, bn, max, d), s * 100, l * 100];
}

export function hslToRgb(h: number, s: number, l: number): Triple {
  const sn = s / 100,
    ln = l / 100;
  const a = sn * Math.min(ln, 1 - ln);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return (ln - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255;
  };
  return [f(0), f(8), f(4)];
}

export function rgbToCmyk(r: number, g: number, b: number): [number, number, number, number] {
  const k = 1 - Math.max(r, g, b) / 255;
  if (k >= 1) return [0, 0, 0, 100];
  const c = (v: number) => ((1 - v / 255 - k) / (1 - k)) * 100;
  return [c(r), c(g), c(b), k * 100];
}

export function cmykToRgb(c: number, m: number, y: number, k: number): Triple {
  const f = (v: number) => 255 * (1 - v / 100) * (1 - k / 100);
  return [f(c), f(m), f(y)];
}
