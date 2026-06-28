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

export function xyzToRgb(X: number, Y: number, Z: number): [number, number, number] {
  let r = 3.2406 * X - 1.5372 * Y - 0.4986 * Z;
  let g = -0.9689 * X + 1.8758 * Y + 0.0415 * Z;
  let b = 0.0557 * X - 0.204 * Y + 1.057 * Z;
  r = Math.max(0, Math.min(1, r));
  g = Math.max(0, Math.min(1, g));
  b = Math.max(0, Math.min(1, b));
  const toSRGB = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
  return [Math.round(toSRGB(r) * 255), Math.round(toSRGB(g) * 255), Math.round(toSRGB(b) * 255)];
}

/**
 * Analytical sRGB gamut range for one XYZ axis given the other two.
 * Derived by solving the 6 linear constraints r,g,b ∈ [0,1] for the target axis.
 * Matrix used: r=3.2406X-1.5372Y-0.4986Z  g=-0.9689X+1.8758Y+0.0415Z  b=0.0557X-0.204Y+1.057Z
 */
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
      (1.5372 * Y + 0.4986 * Z) / 3.2406, // r >= 0
      (1.8758 * Y + 0.0415 * Z - 1) / 0.9689, // g <= 1
      (0.204 * Y - 1.057 * Z) / 0.0557 // b >= 0
    );
    hi = Math.min(
      0.95047,
      (1 + 1.5372 * Y + 0.4986 * Z) / 3.2406, // r <= 1
      (1.8758 * Y + 0.0415 * Z) / 0.9689, // g >= 0
      (1 + 0.204 * Y - 1.057 * Z) / 0.0557 // b <= 1
    );
  } else if (axis === 'Y') {
    lo = Math.max(
      0,
      (3.2406 * X - 0.4986 * Z - 1) / 1.5372, // r <= 1
      (0.9689 * X - 0.0415 * Z) / 1.8758, // g >= 0
      (0.0557 * X + 1.057 * Z - 1) / 0.204 // b <= 1
    );
    hi = Math.min(
      1.0,
      (3.2406 * X - 0.4986 * Z) / 1.5372, // r >= 0
      (1 + 0.9689 * X - 0.0415 * Z) / 1.8758, // g <= 1
      (0.0557 * X + 1.057 * Z) / 0.204 // b >= 0
    );
  } else {
    lo = Math.max(
      0,
      (3.2406 * X - 1.5372 * Y - 1) / 0.4986, // r <= 1
      (0.9689 * X - 1.8758 * Y) / 0.0415, // g >= 0
      (0.204 * Y - 0.0557 * X) / 1.057 // b >= 0
    );
    hi = Math.min(
      1.08883,
      (3.2406 * X - 1.5372 * Y) / 0.4986, // r >= 0
      (1 + 0.9689 * X - 1.8758 * Y) / 0.0415, // g <= 1
      (1 - 0.0557 * X + 0.204 * Y) / 1.057 // b <= 1
    );
  }
  return [Math.max(0, lo), Math.max(lo, hi)];
}
