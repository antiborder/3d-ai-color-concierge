import { labToRgb, rgbToLab } from '../../utils/gamutUtils';

/** Small color helpers shared by the design-topic slides (pastel, monochrome, contrast, …). */

export type RGB = [number, number, number];

export const rgb = (c: RGB) => `rgb(${c.map((v) => Math.round(v)).join(',')})`;

/** The gray with the same perceived lightness (CIE L*) as a color */
export const grayOf = (c: RGB): RGB => labToRgb(rgbToLab(...c)[0], 0, 0);

/** HSL (h in degrees, s and l from 0 to 100) to RGB */
export const hslToRgb = (h: number, s: number, l: number): RGB => {
  const ss = s / 100;
  const ll = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = ss * Math.min(ll, 1 - ll);
  const f = (n: number) => ll - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
};

/** Relative luminance as used for web contrast ratios */
const luminance = (c: RGB) => {
  const [r, g, b] = c.map((v) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** Contrast ratio between two colors, from 1 (same) to 21 (black on white) */
export const contrastRatio = (p: RGB, q: RGB) => {
  const [hi, lo] = [luminance(p), luminance(q)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** Color difference ΔE (distance in Lab) */
export const deltaE = (p: RGB, q: RGB) => {
  const a = rgbToLab(...p);
  const b = rgbToLab(...q);
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
};
