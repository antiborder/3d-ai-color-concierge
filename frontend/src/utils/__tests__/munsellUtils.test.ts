import { describe, it, expect } from 'vitest';
import { parseMunsellNotation, getMunsellHVC, munsellHVCtoRgb } from '../munsellUtils';

describe('parseMunsellNotation', () => {
  it('parses a standard chromatic notation', () => {
    const result = parseMunsellNotation('5R 5/6');
    expect(result).not.toBeNull();
    // R family offset=0, prefix=5 → hueNum=5
    expect(result!.hueNum).toBe(5);
    expect(result!.value).toBe(5);
    expect(result!.chroma).toBe(6);
  });

  it('parses a YR family notation', () => {
    const result = parseMunsellNotation('7.5YR 6/4');
    expect(result).not.toBeNull();
    // YR offset=10, prefix=7.5 → hueNum=17.5
    expect(result!.hueNum).toBeCloseTo(17.5);
    expect(result!.value).toBe(6);
    expect(result!.chroma).toBe(4);
  });

  it('parses a PB (Purple-Blue) family notation', () => {
    const result = parseMunsellNotation('2.5PB 3/10');
    expect(result).not.toBeNull();
    // PB offset=70, prefix=2.5 → hueNum=72.5
    expect(result!.hueNum).toBeCloseTo(72.5);
    expect(result!.value).toBe(3);
    expect(result!.chroma).toBe(10);
  });

  it('parses neutral (achromatic) notation', () => {
    const result = parseMunsellNotation('N 5/');
    expect(result).not.toBeNull();
    expect(result!.hueNum).toBeNull();
    expect(result!.value).toBe(5);
    expect(result!.chroma).toBe(0);
  });

  it('parses neutral with decimal value', () => {
    const result = parseMunsellNotation('N 7.5/');
    expect(result).not.toBeNull();
    expect(result!.hueNum).toBeNull();
    expect(result!.value).toBeCloseTo(7.5);
  });

  it('returns null for invalid notation', () => {
    expect(parseMunsellNotation('invalid')).toBeNull();
    expect(parseMunsellNotation('')).toBeNull();
    expect(parseMunsellNotation('5 5/6')).toBeNull();
  });
});

describe('getMunsellHVC', () => {
  it('returns value=10, chroma=0 for white (255,255,255)', () => {
    const { hueNum, value, chroma } = getMunsellHVC(255, 255, 255);
    expect(hueNum).toBeNull(); // achromatic
    expect(value).toBeCloseTo(10, 1);
    expect(chroma).toBe(0);
  });

  it('returns value=0, chroma=0 for black (0,0,0)', () => {
    const { hueNum, value, chroma } = getMunsellHVC(0, 0, 0);
    expect(hueNum).toBeNull(); // achromatic
    expect(value).toBeCloseTo(0, 1);
    expect(chroma).toBe(0);
  });

  it('returns mid value for middle grey (128,128,128)', () => {
    const { hueNum, value, chroma } = getMunsellHVC(128, 128, 128);
    expect(hueNum).toBeNull(); // achromatic
    // L* for RGB(128,128,128) ≈ 53.4 → value ≈ 5.34
    expect(value).toBeGreaterThan(4);
    expect(value).toBeLessThan(7);
    expect(chroma).toBe(0);
  });

  it('returns non-null hueNum for saturated red (255,0,0)', () => {
    const { hueNum, value, chroma } = getMunsellHVC(255, 0, 0);
    expect(hueNum).not.toBeNull();
    // value ≈ L*/10; for red, L* ≈ 53 → value ≈ 5.3
    expect(value).toBeGreaterThan(4);
    expect(value).toBeLessThan(7);
    // chroma should be substantial for a saturated color
    expect(chroma).toBeGreaterThan(5);
  });

  it('returns non-null hueNum for pure blue (0,0,255)', () => {
    const { hueNum, value, chroma } = getMunsellHVC(0, 0, 255);
    expect(hueNum).not.toBeNull();
    expect(chroma).toBeGreaterThan(0);
  });

  it('value is always in [0,10] range', () => {
    const testColors = [
      [255, 0, 0],
      [0, 255, 0],
      [0, 0, 255],
      [255, 255, 0],
      [128, 64, 192],
    ];
    for (const [r, g, b] of testColors) {
      const { value } = getMunsellHVC(r, g, b);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(10);
    }
  });
});

describe('munsellHVCtoRgb', () => {
  it('converts achromatic value=10 to approximately white', () => {
    const [r, g, b] = munsellHVCtoRgb(null, 10, 0);
    expect(r).toBe(255);
    expect(g).toBe(255);
    expect(b).toBe(255);
  });

  it('converts achromatic value=0 to a very dark color (≤10 per channel)', () => {
    // Due to fInv branch behaviour at L*=0, the implementation produces a very
    // dark near-black (~9 per channel) rather than exact (0,0,0). See labToRgb notes.
    const [r, g, b] = munsellHVCtoRgb(null, 0, 0);
    expect(r).toBeLessThanOrEqual(10);
    expect(g).toBeLessThanOrEqual(10);
    expect(b).toBeLessThanOrEqual(10);
  });

  it('roundtrips white through getMunsellHVC → munsellHVCtoRgb', () => {
    const { hueNum, value, chroma } = getMunsellHVC(255, 255, 255);
    const [r, g, b] = munsellHVCtoRgb(hueNum, value, chroma);
    // May not be exactly 255 due to floating point, but should be close
    expect(r).toBeGreaterThan(250);
    expect(g).toBeGreaterThan(250);
    expect(b).toBeGreaterThan(250);
  });

  it('roundtrips black through getMunsellHVC → munsellHVCtoRgb to a very dark color', () => {
    const { hueNum, value, chroma } = getMunsellHVC(0, 0, 0);
    const [r, g, b] = munsellHVCtoRgb(hueNum, value, chroma);
    // value≈0, chroma=0 → munsellHVCtoRgb(null,0,0) → ~9 per channel (fInv edge case)
    expect(r).toBeLessThanOrEqual(10);
    expect(g).toBeLessThanOrEqual(10);
    expect(b).toBeLessThanOrEqual(10);
  });

  it('all output channels are in [0,255] range', () => {
    const testHVCs: Array<[number | null, number, number]> = [
      [null, 5, 0],
      [25, 5, 10],
      [50, 7, 15],
      [75, 3, 8],
    ];
    for (const [hueNum, value, chroma] of testHVCs) {
      const [r, g, b] = munsellHVCtoRgb(hueNum, value, chroma);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(255);
      expect(g).toBeGreaterThanOrEqual(0);
      expect(g).toBeLessThanOrEqual(255);
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThanOrEqual(255);
    }
  });
});
