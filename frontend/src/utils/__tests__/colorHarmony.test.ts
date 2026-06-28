import { describe, it, expect } from 'vitest';
import { computeHarmonyColors, type HarmonyMode } from '../colorHarmony';

function isValidRgbChannel(v: number): boolean {
  return Number.isInteger(v) && v >= 0 && v <= 255;
}

describe('computeHarmonyColors', () => {
  it('returns empty array for mode "none"', () => {
    const colors = computeHarmonyColors(0, 100, 50, 'none');
    expect(colors).toHaveLength(0);
  });

  it('returns 1 color for complementary (180° offset)', () => {
    const colors = computeHarmonyColors(0, 100, 50, 'complementary');
    expect(colors).toHaveLength(1);
  });

  it('complementary color is 180° away from input hue', () => {
    // Input: hue=0 (red in HSL), s=100, l=50 → complement is hue=180 (cyan)
    const colors = computeHarmonyColors(0, 100, 50, 'complementary');
    // hsl(180,100%,50%) = rgb(0,255,255) - cyan
    expect(colors[0]).toEqual({ r: 0, g: 255, b: 255 });
  });

  it('wraps hue correctly when offset exceeds 360°', () => {
    // Input hue=300 + 180 = 480 → 480 % 360 = 120
    const colors = computeHarmonyColors(300, 100, 50, 'complementary');
    expect(colors).toHaveLength(1);
    // hsl(120, 100, 50) = pure green
    expect(colors[0]).toEqual({ r: 0, g: 255, b: 0 });
  });

  it('returns 2 colors for triangle (120° and 240° offsets)', () => {
    const colors = computeHarmonyColors(0, 100, 50, 'triangle');
    expect(colors).toHaveLength(2);
  });

  it('triangle colors are 120° apart from each other and from input', () => {
    // hue=0 → offsets are 120, 240
    const colors = computeHarmonyColors(0, 100, 50, 'triangle');
    // hsl(120,100,50) = green; hsl(240,100,50) = blue
    expect(colors[0]).toEqual({ r: 0, g: 255, b: 0 });
    expect(colors[1]).toEqual({ r: 0, g: 0, b: 255 });
  });

  it('returns 3 colors for square', () => {
    const colors = computeHarmonyColors(0, 100, 50, 'square');
    expect(colors).toHaveLength(3);
  });

  it('returns 4 colors for pentagon', () => {
    const colors = computeHarmonyColors(0, 100, 50, 'pentagon');
    expect(colors).toHaveLength(4);
  });

  it('returns 5 colors for hexagon', () => {
    const colors = computeHarmonyColors(0, 100, 50, 'hexagon');
    expect(colors).toHaveLength(5);
  });

  it('returns 6 colors for heptagon', () => {
    const colors = computeHarmonyColors(0, 100, 50, 'heptagon');
    expect(colors).toHaveLength(6);
  });

  it('returns 7 colors for octagon', () => {
    const colors = computeHarmonyColors(0, 100, 50, 'octagon');
    expect(colors).toHaveLength(7);
  });

  it('returns 8 colors for nonagon', () => {
    const colors = computeHarmonyColors(0, 100, 50, 'nonagon');
    expect(colors).toHaveLength(8);
  });

  it('all returned colors are valid RGB integers in [0, 255]', () => {
    const modes: HarmonyMode[] = [
      'complementary',
      'triangle',
      'square',
      'pentagon',
      'hexagon',
      'heptagon',
      'octagon',
      'nonagon',
    ];
    for (const mode of modes) {
      const colors = computeHarmonyColors(45, 80, 60, mode);
      for (const { r, g, b } of colors) {
        expect(isValidRgbChannel(r)).toBe(true);
        expect(isValidRgbChannel(g)).toBe(true);
        expect(isValidRgbChannel(b)).toBe(true);
      }
    }
  });

  it('preserves saturation and lightness in returned colors', () => {
    // With s=0 (achromatic), all harmony colors should produce grey
    const colors = computeHarmonyColors(0, 0, 50, 'triangle');
    for (const { r, g, b } of colors) {
      // hsl(any, 0, 50) → r=g=b=128
      expect(r).toBe(128);
      expect(g).toBe(128);
      expect(b).toBe(128);
    }
  });
});
