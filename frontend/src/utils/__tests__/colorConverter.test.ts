import { describe, it, expect } from 'vitest';
import { ColorConverter, focusContrastColor } from '../colorConverter';

describe('ColorConverter.fromRgb', () => {
  it('returns correct hex for pure red', () => {
    const result = ColorConverter.fromRgb(255, 0, 0);
    expect(result.hex).toBe('FF0000');
    expect(result.rgb).toEqual([255, 0, 0]);
  });

  it('returns correct hex for pure green', () => {
    const result = ColorConverter.fromRgb(0, 255, 0);
    expect(result.hex).toBe('00FF00');
  });

  it('returns correct hex for pure blue', () => {
    const result = ColorConverter.fromRgb(0, 0, 255);
    expect(result.hex).toBe('0000FF');
  });

  it('handles black (0,0,0)', () => {
    const result = ColorConverter.fromRgb(0, 0, 0);
    expect(result.hex).toBe('000000');
    expect(result.rgb).toEqual([0, 0, 0]);
    expect(result.hsl).toEqual([0, 0, 0]);
  });

  it('handles white (255,255,255)', () => {
    const result = ColorConverter.fromRgb(255, 255, 255);
    expect(result.hex).toBe('FFFFFF');
    expect(result.rgb).toEqual([255, 255, 255]);
    // White has 0 saturation in HSL
    expect(result.hsl[1]).toBe(0);
    expect(result.hsl[2]).toBe(100);
  });
});

describe('ColorConverter.fromHex', () => {
  it('parses uppercase hex without #', () => {
    const result = ColorConverter.fromHex('FF0000');
    expect(result.rgb).toEqual([255, 0, 0]);
  });

  it('parses lowercase hex without #', () => {
    const result = ColorConverter.fromHex('ff0000');
    expect(result.rgb).toEqual([255, 0, 0]);
  });

  it('parses mixed-case hex', () => {
    const result = ColorConverter.fromHex('Ff0000');
    expect(result.rgb).toEqual([255, 0, 0]);
  });

  it('parses white', () => {
    const result = ColorConverter.fromHex('FFFFFF');
    expect(result.rgb).toEqual([255, 255, 255]);
  });

  it('parses black', () => {
    const result = ColorConverter.fromHex('000000');
    expect(result.rgb).toEqual([0, 0, 0]);
  });
});

describe('RGB → hex → RGB roundtrip', () => {
  it('roundtrips pure red', () => {
    const hex = ColorConverter.fromRgb(255, 0, 0).hex;
    const back = ColorConverter.fromHex(hex);
    expect(back.rgb).toEqual([255, 0, 0]);
  });

  it('roundtrips an arbitrary color (123, 45, 200)', () => {
    const hex = ColorConverter.fromRgb(123, 45, 200).hex;
    const back = ColorConverter.fromHex(hex);
    expect(back.rgb).toEqual([123, 45, 200]);
  });

  it('roundtrips black', () => {
    const hex = ColorConverter.fromRgb(0, 0, 0).hex;
    const back = ColorConverter.fromHex(hex);
    expect(back.rgb).toEqual([0, 0, 0]);
  });

  it('roundtrips white', () => {
    const hex = ColorConverter.fromRgb(255, 255, 255).hex;
    const back = ColorConverter.fromHex(hex);
    expect(back.rgb).toEqual([255, 255, 255]);
  });
});

describe('focusContrastColor', () => {
  it('returns black for high L* (light background)', () => {
    expect(focusContrastColor(100)).toBe('#000000');
    expect(focusContrastColor(75)).toBe('#000000');
    expect(focusContrastColor(50)).toBe('#000000'); // boundary: 50 >= 50
  });

  it('returns white for low L* (dark background)', () => {
    expect(focusContrastColor(0)).toBe('#ffffff');
    expect(focusContrastColor(25)).toBe('#ffffff');
    expect(focusContrastColor(49)).toBe('#ffffff');
  });

  it('switches exactly at L*=50', () => {
    expect(focusContrastColor(50)).toBe('#000000');
    expect(focusContrastColor(49.9)).toBe('#ffffff');
  });
});
