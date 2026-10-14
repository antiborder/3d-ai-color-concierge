import { describe, it, expect } from 'vitest';
import convert from 'color-convert';
import { cmykToRgb, hslToRgb, hsvToRgb, rgbToCmyk, rgbToHsl, rgbToHsv } from '../floatColor';
import { interpolateRgb } from '../../components/menus/controls/ColorBridge';
import { getHsbPosition, getHslPosition } from '../colorSpacePositions';

const SAMPLES: [number, number, number][] = [
  [255, 0, 0],
  [0, 128, 255],
  [123, 123, 180],
  [250, 247, 175],
  [1, 87, 155],
  [0, 0, 0],
  [255, 255, 255],
];

describe('floatColor', () => {
  it.each(SAMPLES)('agrees with color-convert for rgb(%i, %i, %i), without rounding', (r, g, b) => {
    rgbToHsv(r, g, b).forEach((v, i) =>
      expect(Math.round(v)).toBeCloseTo(convert.rgb.hsv([r, g, b])[i], 0)
    );
    rgbToHsl(r, g, b).forEach((v, i) =>
      expect(Math.abs(Math.round(v) - convert.rgb.hsl([r, g, b])[i])).toBeLessThanOrEqual(1)
    );
    rgbToCmyk(r, g, b).forEach((v, i) =>
      expect(Math.round(v)).toBe(convert.rgb.cmyk([r, g, b])[i])
    );
  });

  it.each(SAMPLES)('round-trips rgb(%i, %i, %i)', (r, g, b) => {
    hsvToRgb(...rgbToHsv(r, g, b)).forEach((v, i) => expect(v).toBeCloseTo([r, g, b][i], 6));
    hslToRgb(...rgbToHsl(r, g, b)).forEach((v, i) => expect(v).toBeCloseTo([r, g, b][i], 6));
    cmykToRgb(...rgbToCmyk(r, g, b)).forEach((v, i) => expect(v).toBeCloseTo([r, g, b][i], 6));
  });
});

// The 1D picker's path in 3D should bend gradually, not zigzag (it did when every point was
// rounded to whole RGB values and whole degrees / percents)
describe('1D picker path', () => {
  const maxTurn = (points: [number, number, number][]) => {
    let worst = 0;
    for (let i = 1; i < points.length - 1; i++) {
      const u = points[i].map((v, k) => v - points[i - 1][k]);
      const w = points[i + 1].map((v, k) => v - points[i][k]);
      const dot = u.reduce((s, v, k) => s + v * w[k], 0);
      const cos = dot / (Math.hypot(...u) * Math.hypot(...w));
      worst = Math.max(worst, Math.acos(Math.min(1, Math.max(-1, cos))));
    }
    return (worst * 180) / Math.PI;
  };
  const path = (pos: typeof getHsbPosition, shape: 'HSB' | 'HSL', a: number[], b: number[]) =>
    Array.from({ length: 33 }, (_, i) => {
      const [r, g, bl] = interpolateRgb(
        { r: a[0], g: a[1], b: a[2] },
        { r: b[0], g: b[1], b: b[2] },
        shape,
        i / 32,
        true
      );
      return pos(r, g, bl);
    });

  // light blue → light orange, both nearly at full brightness (where the zigzag appeared).
  // A 32-point curve turns about 6° per point; the rounded path turned up to 21°.
  it('bends gradually across the top of the HSB cone', () => {
    expect(maxTurn(path(getHsbPosition, 'HSB', [120, 180, 250], [250, 200, 150]))).toBeLessThan(10);
  });

  it('bends gradually in HSL', () => {
    expect(maxTurn(path(getHslPosition, 'HSL', [120, 180, 250], [250, 200, 150]))).toBeLessThan(10);
  });
});
