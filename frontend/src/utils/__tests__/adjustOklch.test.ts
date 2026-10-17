import { describe, it, expect } from 'vitest';
import { adjustOklch } from '../adjustOklch';
import { rgbToOklch } from '../gamutUtils';
import { interpolateRgb } from '../../components/menus/controls/ColorBridge';
import { rgbToHsl } from '../floatColor';

describe('adjustOklch', () => {
  it('darkens by amount/100 in OkLCH lightness', () => {
    const before = rgbToOklch(188, 226, 232)[0];
    const rgb = adjustOklch(188, 226, 232, 'brightness', 'down', 10)!;
    expect(rgbToOklch(...rgb)[0]).toBeCloseTo(before - 0.1, 2);
  });

  it('returns null at a limit', () => {
    expect(adjustOklch(0, 0, 0, 'brightness', 'down')).toBeNull();
  });
});

describe('interpolateRgb with a gray end', () => {
  // White has no hue: the path keeps the other end's hue instead of swinging through hue 0
  it.each(['HSL', 'HSB', 'LCH', 'OKLCH'] as const)('keeps the hue of the colored end in %s', (shape) => {
    const blue = { r: 131, g: 141, b: 170 };
    const [r, g, b] = interpolateRgb({ r: 255, g: 255, b: 255 }, blue, shape, 0.5);
    expect(Math.abs(rgbToHsl(r, g, b)[0] - rgbToHsl(131, 141, 170)[0])).toBeLessThan(12);
  });
});
