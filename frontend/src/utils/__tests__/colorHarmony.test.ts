import { describe, it, expect } from 'vitest';
import { computeHarmonyColors, type HarmonyMode } from '../colorHarmony';
import { rgbToLch } from '../gamutUtils';

/** Smallest angular distance between two hue angles (0–360). */
function angDiff(a: number, b: number): number {
  const d = ((a - b) % 360 + 360) % 360;
  return Math.min(d, 360 - d);
}

function isValidRgbChannel(v: number): boolean {
  return Number.isInteger(v) && v >= 0 && v <= 255;
}

// Pure red in RGB
const RED: [number, number, number] = [255, 0, 0];
// Mid gray (achromatic, C≈0 in LCH)
const GRAY: [number, number, number] = [128, 128, 128];
// An arbitrary saturated color for multi-mode tests
const ORANGE: [number, number, number] = [235, 194, 71];

describe('computeHarmonyColors', () => {
  it('returns empty array for mode "none"', () => {
    const colors = computeHarmonyColors(...RED, 'none');
    expect(colors).toHaveLength(0);
  });

  it('returns 1 color for complementary', () => {
    expect(computeHarmonyColors(...RED, 'complementary')).toHaveLength(1);
  });

  it('returns 2 colors for triangle', () => {
    expect(computeHarmonyColors(...RED, 'triangle')).toHaveLength(2);
  });

  it('returns 3 colors for square', () => {
    expect(computeHarmonyColors(...RED, 'square')).toHaveLength(3);
  });

  it('returns 4 colors for pentagon', () => {
    expect(computeHarmonyColors(...RED, 'pentagon')).toHaveLength(4);
  });

  it('returns 5 colors for hexagon', () => {
    expect(computeHarmonyColors(...RED, 'hexagon')).toHaveLength(5);
  });

  it('returns 6 colors for heptagon', () => {
    expect(computeHarmonyColors(...RED, 'heptagon')).toHaveLength(6);
  });

  it('returns 7 colors for octagon', () => {
    expect(computeHarmonyColors(...RED, 'octagon')).toHaveLength(7);
  });

  it('returns 8 colors for nonagon', () => {
    expect(computeHarmonyColors(...RED, 'nonagon')).toHaveLength(8);
  });

  it('all returned colors are valid RGB integers in [0, 255]', () => {
    const modes: HarmonyMode[] = [
      'complementary', 'triangle', 'square', 'pentagon',
      'hexagon', 'heptagon', 'octagon', 'nonagon',
    ];
    for (const mode of modes) {
      const colors = computeHarmonyColors(...ORANGE, mode);
      for (const { r, g, b } of colors) {
        expect(isValidRgbChannel(r)).toBe(true);
        expect(isValidRgbChannel(g)).toBe(true);
        expect(isValidRgbChannel(b)).toBe(true);
      }
    }
  });

  it('LCH lightness is preserved in harmony colors (within ±2)', () => {
    const [L] = rgbToLch(...RED);
    const colors = computeHarmonyColors(...RED, 'triangle');
    for (const { r, g, b } of colors) {
      const [Lh] = rgbToLch(r, g, b);
      expect(Math.abs(Lh - L)).toBeLessThan(2);
    }
  });

  it('LCH hue is offset by 180° for complementary (within ±2°)', () => {
    const [, , H] = rgbToLch(...RED);
    const [{ r, g, b }] = computeHarmonyColors(...RED, 'complementary');
    const [, , Hc] = rgbToLch(r, g, b);
    expect(angDiff(Hc, (H + 180) % 360)).toBeLessThan(2);
  });

  it('LCH hue offsets for triangle are ≈120° apart (within ±2°)', () => {
    const [, , H] = rgbToLch(...RED);
    const colors = computeHarmonyColors(...RED, 'triangle');
    [120, 240].forEach((offset, i) => {
      const [, , Hh] = rgbToLch(colors[i].r, colors[i].g, colors[i].b);
      expect(angDiff(Hh, (H + offset) % 360)).toBeLessThan(2);
    });
  });

  it('achromatic input produces achromatic harmony colors', () => {
    // Gray has C≈0 in LCH; shifting H on a gray produces the same gray
    const colors = computeHarmonyColors(...GRAY, 'triangle');
    for (const { r, g, b } of colors) {
      // All channels should be very close to each other (achromatic)
      expect(Math.abs(r - g)).toBeLessThan(3);
      expect(Math.abs(g - b)).toBeLessThan(3);
    }
  });
});
