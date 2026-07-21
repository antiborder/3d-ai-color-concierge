/**
 * Shared gamut utility functions used by LabSliders and XyzSliders.
 * Extracted here so they can be imported by both components and unit-tested.
 */

// ---------------------------------------------------------------------------
// CIE Lab utilities (used by LabSliders)
// ---------------------------------------------------------------------------

export function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const rl = toLinear(r),
    gl = toLinear(g),
    bl = toLinear(b);
  const Xn = (rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375) / 0.95047;
  const Yn = rl * 0.2126729 + gl * 0.7151522 + bl * 0.072175;
  const Zn = (rl * 0.0193339 + gl * 0.119192 + bl * 0.9503041) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(Yn) - 16, 500 * (f(Xn) - f(Yn)), 200 * (f(Yn) - f(Zn))];
}

export function labToRgb(L: number, a: number, b: number): [number, number, number] {
  const fy = (L + 16) / 116;
  const fx = a / 500 + fy;
  const fz = fy - b / 200;
  const fInv = (t: number) => (t > 0.008856 ? t * t * t : (t - 16 / 116) / 7.787);
  const X = fInv(fx) * 0.95047;
  const Y = fInv(fy);
  const Z = fInv(fz) * 1.08883;
  const rl = X * 3.2404542 - Y * 1.5371385 - Z * 0.4985314;
  const gl = -X * 0.969266 + Y * 1.8760108 + Z * 0.041556;
  const bl = X * 0.0556434 - Y * 0.2040259 + Z * 1.0572252;
  const toSrgb = (c: number) => {
    const v = Math.max(0, Math.min(1, c));
    return Math.round((v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055) * 255);
  };
  return [toSrgb(rl), toSrgb(gl), toSrgb(bl)];
}

export function isInGamut(L: number, a: number, b: number): boolean {
  const fy = (L + 16) / 116;
  const fInv = (t: number) => (t > 0.008856 ? t * t * t : (t - 16 / 116) / 7.787);
  const X = fInv(a / 500 + fy) * 0.95047;
  const Y = fInv(fy);
  const Z = fInv(fy - b / 200) * 1.08883;
  const rl = X * 3.2404542 - Y * 1.5371385 - Z * 0.4985314;
  const gl = -X * 0.969266 + Y * 1.8760108 + Z * 0.041556;
  const bl = X * 0.0556434 - Y * 0.2040259 + Z * 1.0572252;
  // Small epsilon to absorb floating-point rounding at the gamut boundary.
  const EPS = 0.005;
  return rl >= -EPS && rl <= 1 + EPS && gl >= -EPS && gl <= 1 + EPS && bl >= -EPS && bl <= 1 + EPS;
}

export function computeGamutRange(
  axis: 'L' | 'a' | 'b',
  L: number,
  a: number,
  b: number,
  min: number,
  max: number
): [number, number] {
  let lo = max + 1;
  let hi = min - 1;
  for (let v = min; v <= max; v++) {
    const [tL, ta, tb] = axis === 'L' ? [v, a, b] : axis === 'a' ? [L, v, b] : [L, a, v];
    if (isInGamut(tL, ta, tb)) {
      lo = v;
      break;
    }
  }
  if (lo > max) return [min, max]; // no in-gamut value found; fall back to full range
  for (let v = max; v >= min; v--) {
    const [tL, ta, tb] = axis === 'L' ? [v, a, b] : axis === 'a' ? [L, v, b] : [L, a, v];
    if (isInGamut(tL, ta, tb)) {
      hi = v;
      break;
    }
  }
  return [lo, hi];
}

// ---------------------------------------------------------------------------
// CIE LCH utilities (polar form of Lab)
// ---------------------------------------------------------------------------

export function rgbToLch(r: number, g: number, b: number): [number, number, number] {
  const [L, a, bv] = rgbToLab(r, g, b);
  const C = Math.sqrt(a * a + bv * bv);
  const H = ((Math.atan2(bv, a) * (180 / Math.PI)) + 360) % 360;
  return [L, C, H];
}

export function lchToRgb(L: number, C: number, H: number): [number, number, number] {
  const Hrad = H * (Math.PI / 180);
  return labToRgb(L, C * Math.cos(Hrad), C * Math.sin(Hrad));
}

/** Converts LCH → RGB, reducing chroma via binary search if out of sRGB gamut. */
export function lchToRgbGamutMapped(L: number, C: number, H: number): [number, number, number] {
  const Hrad = H * (Math.PI / 180);
  const inGamut = (c: number) => isInGamut(L, c * Math.cos(Hrad), c * Math.sin(Hrad));
  if (inGamut(C)) return lchToRgb(L, C, H);
  let lo = 0, hi = C;
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    if (inGamut(mid)) lo = mid; else hi = mid;
  }
  return lchToRgb(L, lo, H);
}

/** Returns the maximum sRGB-gamut chroma for the given L and hue angle H (degrees). */
export function maxInGamutChroma(L: number, H: number): number {
  const Hrad = H * (Math.PI / 180);
  const inGamut = (c: number) => isInGamut(L, c * Math.cos(Hrad), c * Math.sin(Hrad));
  let lo = 0, hi = 200;
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    if (inGamut(mid)) lo = mid; else hi = mid;
  }
  return lo;
}

// ---------------------------------------------------------------------------
// CIE XYZ utilities (used by XyzSliders)
// ---------------------------------------------------------------------------

export function toLinear(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function rgbToXYZ(r: number, g: number, b: number): [number, number, number] {
  const rl = toLinear(r),
    gl = toLinear(g),
    bl = toLinear(b);
  return [
    0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl,
    0.2126729 * rl + 0.7151522 * gl + 0.072175 * bl,
    0.0193339 * rl + 0.119192 * gl + 0.9503041 * bl,
  ];
}

// IEC 61966-2-1 sRGB: XYZ (D65) → linear RGB matrix
const Mrx = 3.2404542,
  Mry = -1.5371385,
  Mrz = -0.4985314;
const Mgx = -0.969266,
  Mgy = 1.8760108,
  Mgz = 0.041556;
const Mbx = 0.0556434,
  Mby = -0.2040259,
  Mbz = 1.0572252;

export function xyzToRgb(X: number, Y: number, Z: number): [number, number, number] {
  let r = Mrx * X + Mry * Y + Mrz * Z;
  let g = Mgx * X + Mgy * Y + Mgz * Z;
  let b = Mbx * X + Mby * Y + Mbz * Z;
  r = Math.max(0, Math.min(1, r));
  g = Math.max(0, Math.min(1, g));
  b = Math.max(0, Math.min(1, b));
  const toSRGB = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
  return [Math.round(toSRGB(r) * 255), Math.round(toSRGB(g) * 255), Math.round(toSRGB(b) * 255)];
}

export function xyzGamutRange(
  axis: 'X' | 'Y' | 'Z',
  X: number,
  Y: number,
  Z: number
): [number, number] {
  let lo: number, hi: number;
  if (axis === 'X') {
    lo = Math.max(
      0,
      (-Mry * Y - Mrz * Z) / Mrx, // r >= 0
      (1 - Mgy * Y - Mgz * Z) / Mgx, // g <= 1  (Mgx < 0 → lower bound)
      (-Mby * Y - Mbz * Z) / Mbx // b >= 0
    );
    hi = Math.min(
      0.95047,
      (1 - Mry * Y - Mrz * Z) / Mrx, // r <= 1
      (-Mgy * Y - Mgz * Z) / Mgx, // g >= 0  (Mgx < 0 → upper bound)
      (1 - Mby * Y - Mbz * Z) / Mbx // b <= 1
    );
  } else if (axis === 'Y') {
    lo = Math.max(
      0,
      (1 - Mrx * X - Mrz * Z) / Mry, // r <= 1  (Mry < 0 → lower bound)
      (-Mgx * X - Mgz * Z) / Mgy, // g >= 0
      (1 - Mbx * X - Mbz * Z) / Mby // b <= 1  (Mby < 0 → lower bound)
    );
    hi = Math.min(
      1.0,
      (-Mrx * X - Mrz * Z) / Mry, // r >= 0  (Mry < 0 → upper bound)
      (1 - Mgx * X - Mgz * Z) / Mgy, // g <= 1
      (-Mbx * X - Mbz * Z) / Mby // b >= 0  (Mby < 0 → upper bound)
    );
  } else {
    lo = Math.max(
      0,
      (1 - Mrx * X - Mry * Y) / Mrz, // r <= 1  (Mrz < 0 → lower bound)
      (-Mgx * X - Mgy * Y) / Mgz, // g >= 0
      (-Mbx * X - Mby * Y) / Mbz // b >= 0
    );
    hi = Math.min(
      1.08883,
      (-Mrx * X - Mry * Y) / Mrz, // r >= 0  (Mrz < 0 → upper bound)
      (1 - Mgx * X - Mgy * Y) / Mgz, // g <= 1
      (1 - Mbx * X - Mby * Y) / Mbz // b <= 1
    );
  }
  const absMaxVal = axis === 'X' ? 0.95047 : axis === 'Y' ? 1.0 : 1.08883;
  const clampedLo = Math.max(0, Math.min(lo, absMaxVal));
  const clampedHi = Math.min(absMaxVal, Math.max(clampedLo, hi));
  return [clampedLo, clampedHi];
}
