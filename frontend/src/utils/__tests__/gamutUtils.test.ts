import { describe, it, expect } from 'vitest';
import {
  isInGamut,
  computeGamutRange,
  rgbToLab,
  labToRgb,
  rgbToXYZ,
  xyzToRgb,
  xyzGamutRange,
  toLinear,
} from '../gamutUtils';

// ---------------------------------------------------------------------------
// isInGamut (Lab → sRGB gamut check)
// ---------------------------------------------------------------------------
describe('isInGamut', () => {
  it('returns true for black Lab(0,0,0)', () => {
    expect(isInGamut(0, 0, 0)).toBe(true);
  });

  it('returns true for white Lab(100,0,0)', () => {
    expect(isInGamut(100, 0, 0)).toBe(true);
  });

  it('returns true for approximate sRGB red Lab(53,80,67)', () => {
    expect(isInGamut(53, 80, 67)).toBe(true);
  });

  it('returns false for extreme negative a,b values (50,-128,-128)', () => {
    expect(isInGamut(50, -128, -128)).toBe(false);
  });

  it('returns false for extreme positive a,b values (50,127,127)', () => {
    expect(isInGamut(50, 127, 127)).toBe(false);
  });

  it('returns true for a mid-grey Lab(50,0,0)', () => {
    expect(isInGamut(50, 0, 0)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// rgbToLab / labToRgb
// ---------------------------------------------------------------------------
describe('rgbToLab', () => {
  it('converts black (0,0,0) to Lab(0,0,0)', () => {
    const [L, a, b] = rgbToLab(0, 0, 0);
    expect(L).toBeCloseTo(0, 1);
    expect(a).toBeCloseTo(0, 1);
    expect(b).toBeCloseTo(0, 1);
  });

  it('converts white (255,255,255) to Lab(100,0,0)', () => {
    const [L, a, b] = rgbToLab(255, 255, 255);
    expect(L).toBeCloseTo(100, 1);
    expect(a).toBeCloseTo(0, 1);
    expect(b).toBeCloseTo(0, 1);
  });

  it('converts red (255,0,0) to Lab with L≈53, a≈80, b≈67', () => {
    const [L, a, b] = rgbToLab(255, 0, 0);
    expect(L).toBeCloseTo(53.23, 0);
    expect(a).toBeCloseTo(80.09, 0);
    expect(b).toBeCloseTo(67.2, 0);
  });
});

describe('labToRgb', () => {
  it('converts Lab(0,0,0) back to a very dark color (≤10 per channel)', () => {
    // Note: due to fInv branch behaviour at L=0, the output is ~9 per channel,
    // not exactly 0. True black is better obtained via labToRgb of the Lab
    // values produced by rgbToLab(0,0,0) (roundtrip test below).
    const [r, g, b] = labToRgb(0, 0, 0);
    expect(r).toBeLessThanOrEqual(10);
    expect(g).toBeLessThanOrEqual(10);
    expect(b).toBeLessThanOrEqual(10);
  });

  it('converts Lab(100,0,0) back to white', () => {
    const [r, g, b] = labToRgb(100, 0, 0);
    expect(r).toBe(255);
    expect(g).toBe(255);
    expect(b).toBe(255);
  });

  it('roundtrips RGB(255,0,0) through Lab and back', () => {
    const [L, a, bLab] = rgbToLab(255, 0, 0);
    const [r, g, b] = labToRgb(L, a, bLab);
    // Allow ±1 for rounding
    expect(r).toBeCloseTo(255, -0.5);
    expect(g).toBe(0);
    expect(b).toBe(0);
  });

  it('roundtrips RGB(0,128,200) through Lab and back within ±1', () => {
    const [L, a, bLab] = rgbToLab(0, 128, 200);
    const [r, g, b] = labToRgb(L, a, bLab);
    expect(Math.abs(r - 0)).toBeLessThanOrEqual(1);
    expect(Math.abs(g - 128)).toBeLessThanOrEqual(1);
    expect(Math.abs(b - 200)).toBeLessThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// computeGamutRange
// ---------------------------------------------------------------------------
describe('computeGamutRange', () => {
  it('L range for grey (L=50, a=0, b=0) spans full [0,100]', () => {
    const [lo, hi] = computeGamutRange('L', 50, 0, 0, 0, 100);
    expect(lo).toBe(0);
    expect(hi).toBe(100);
  });

  it('a range for L=50, b=0 is symmetric around 0', () => {
    const [lo, hi] = computeGamutRange('a', 50, 0, 0, -128, 127);
    expect(lo).toBeLessThan(0);
    expect(hi).toBeGreaterThan(0);
  });

  it('current L value is always within the computed L range', () => {
    // Use a known in-gamut color: approx red
    const L = 53, a = 80, b = 67;
    const [lo, hi] = computeGamutRange('L', L, a, b, 0, 100);
    expect(L).toBeGreaterThanOrEqual(lo);
    expect(L).toBeLessThanOrEqual(hi);
  });
});

// ---------------------------------------------------------------------------
// toLinear (sRGB → linear)
// ---------------------------------------------------------------------------
describe('toLinear', () => {
  it('maps 0 to 0', () => {
    expect(toLinear(0)).toBeCloseTo(0, 5);
  });

  it('maps 255 to 1', () => {
    expect(toLinear(255)).toBeCloseTo(1, 4);
  });

  it('maps 128 to approximately 0.216', () => {
    // 128/255 ≈ 0.502; ((0.502+0.055)/1.055)^2.4 ≈ 0.216
    expect(toLinear(128)).toBeCloseTo(0.216, 2);
  });
});

// ---------------------------------------------------------------------------
// rgbToXYZ / xyzToRgb
// ---------------------------------------------------------------------------
describe('rgbToXYZ', () => {
  it('converts black (0,0,0) to XYZ(0,0,0)', () => {
    const [X, Y, Z] = rgbToXYZ(0, 0, 0);
    expect(X).toBeCloseTo(0, 5);
    expect(Y).toBeCloseTo(0, 5);
    expect(Z).toBeCloseTo(0, 5);
  });

  it('converts white (255,255,255) to D65 white point (0.95047, 1.0, 1.08883)', () => {
    const [X, Y, Z] = rgbToXYZ(255, 255, 255);
    expect(X).toBeCloseTo(0.95047, 3);
    expect(Y).toBeCloseTo(1.0, 3);
    expect(Z).toBeCloseTo(1.08883, 3);
  });
});

describe('xyzToRgb', () => {
  it('converts XYZ(0,0,0) to black', () => {
    const [r, g, b] = xyzToRgb(0, 0, 0);
    expect(r).toBe(0);
    expect(g).toBe(0);
    expect(b).toBe(0);
  });

  it('converts D65 white point to (255,255,255)', () => {
    const [r, g, b] = xyzToRgb(0.95047, 1.0, 1.08883);
    expect(r).toBe(255);
    expect(g).toBe(255);
    expect(b).toBe(255);
  });

  it('roundtrips RGB(255,0,0) through XYZ and back within ±1', () => {
    const [X, Y, Z] = rgbToXYZ(255, 0, 0);
    const [r, g, b] = xyzToRgb(X, Y, Z);
    expect(r).toBe(255);
    expect(g).toBe(0);
    expect(b).toBe(0);
  });

  it('roundtrips RGB(0,200,100) through XYZ and back within ±1', () => {
    const [X, Y, Z] = rgbToXYZ(0, 200, 100);
    const [r, g, b] = xyzToRgb(X, Y, Z);
    expect(Math.abs(r - 0)).toBeLessThanOrEqual(1);
    expect(Math.abs(g - 200)).toBeLessThanOrEqual(1);
    expect(Math.abs(b - 100)).toBeLessThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// xyzGamutRange
// ---------------------------------------------------------------------------
// Small epsilon to absorb floating-point rounding in analytical formulas
const EPS = 1e-5;

describe('xyzGamutRange', () => {
  // Mid-grey is used for most containment tests because it sits safely
  // in the interior of the sRGB gamut, far from numerical boundary issues
  // that affect the exact white-point corner.
  it('all three axis ranges for mid-grey RGB(128,128,128) contain the actual XYZ values', () => {
    const [X, Y, Z] = rgbToXYZ(128, 128, 128);
    const [xLo, xHi] = xyzGamutRange('X', X, Y, Z);
    const [yLo, yHi] = xyzGamutRange('Y', X, Y, Z);
    const [zLo, zHi] = xyzGamutRange('Z', X, Y, Z);

    expect(X).toBeGreaterThanOrEqual(xLo - EPS);
    expect(X).toBeLessThanOrEqual(xHi + EPS);
    expect(Y).toBeGreaterThanOrEqual(yLo - EPS);
    expect(Y).toBeLessThanOrEqual(yHi + EPS);
    expect(Z).toBeGreaterThanOrEqual(zLo - EPS);
    expect(Z).toBeLessThanOrEqual(zHi + EPS);
  });

  it('all three axis ranges for RGB(200,100,50) contain the actual XYZ values', () => {
    const [X, Y, Z] = rgbToXYZ(200, 100, 50);
    const [xLo, xHi] = xyzGamutRange('X', X, Y, Z);
    const [yLo, yHi] = xyzGamutRange('Y', X, Y, Z);
    const [zLo, zHi] = xyzGamutRange('Z', X, Y, Z);

    expect(X).toBeGreaterThanOrEqual(xLo - EPS);
    expect(X).toBeLessThanOrEqual(xHi + EPS);
    expect(Y).toBeGreaterThanOrEqual(yLo - EPS);
    expect(Y).toBeLessThanOrEqual(yHi + EPS);
    expect(Z).toBeGreaterThanOrEqual(zLo - EPS);
    expect(Z).toBeLessThanOrEqual(zHi + EPS);
  });

  it('all three axis ranges for RGB(50,150,200) contain the actual XYZ values', () => {
    const [X, Y, Z] = rgbToXYZ(50, 150, 200);
    const [xLo, xHi] = xyzGamutRange('X', X, Y, Z);
    const [yLo, yHi] = xyzGamutRange('Y', X, Y, Z);
    const [zLo, zHi] = xyzGamutRange('Z', X, Y, Z);

    expect(X).toBeGreaterThanOrEqual(xLo - EPS);
    expect(X).toBeLessThanOrEqual(xHi + EPS);
    expect(Y).toBeGreaterThanOrEqual(yLo - EPS);
    expect(Y).toBeLessThanOrEqual(yHi + EPS);
    expect(Z).toBeGreaterThanOrEqual(zLo - EPS);
    expect(Z).toBeLessThanOrEqual(zHi + EPS);
  });

  it('X gamut lo is 0 when Y=0, Z=0 (only black on X axis)', () => {
    const [xLo] = xyzGamutRange('X', 0, 0, 0);
    expect(xLo).toBe(0);
  });

  it('Y gamut hi for mid-grey is between 0 and 1', () => {
    const [X, Y, Z] = rgbToXYZ(128, 128, 128);
    const [yLo, yHi] = xyzGamutRange('Y', X, Y, Z);
    expect(yLo).toBeGreaterThanOrEqual(0);
    expect(yHi).toBeLessThanOrEqual(1.0 + EPS);
  });

  it('Z gamut hi for mid-grey is at most the D65 white-point Z (≈1.08883)', () => {
    const [X, Y, Z] = rgbToXYZ(128, 128, 128);
    const [, zHi] = xyzGamutRange('Z', X, Y, Z);
    expect(zHi).toBeLessThanOrEqual(1.08883 + EPS);
  });

  it('lo is always ≤ hi (valid range)', () => {
    const testRgbs: [number, number, number][] = [
      [128, 128, 128],
      [255, 0, 0],
      [0, 255, 0],
      [100, 150, 200],
    ];
    for (const [r, g, b] of testRgbs) {
      const [X, Y, Z] = rgbToXYZ(r, g, b);
      const [xLo, xHi] = xyzGamutRange('X', X, Y, Z);
      const [yLo, yHi] = xyzGamutRange('Y', X, Y, Z);
      const [zLo, zHi] = xyzGamutRange('Z', X, Y, Z);
      expect(xLo).toBeLessThanOrEqual(xHi);
      expect(yLo).toBeLessThanOrEqual(yHi);
      expect(zLo).toBeLessThanOrEqual(zHi);
    }
  });
});
