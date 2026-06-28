import { describe, it, expect } from 'vitest';
import { floatTo16BitPCM, downsample } from '../audioUtils';

describe('floatTo16BitPCM', () => {
  it('converts 1.0 to maximum int16 value (32767)', () => {
    const input = new Float32Array([1.0]);
    const output = floatTo16BitPCM(input);
    expect(output[0]).toBe(32767); // 0x7fff
  });

  it('converts -1.0 to minimum int16 value (-32768)', () => {
    const input = new Float32Array([-1.0]);
    const output = floatTo16BitPCM(input);
    expect(output[0]).toBe(-32768); // -0x8000
  });

  it('converts 0.0 to 0', () => {
    const input = new Float32Array([0.0]);
    const output = floatTo16BitPCM(input);
    expect(output[0]).toBe(0);
  });

  it('returns an Int16Array of the same length as input', () => {
    const input = new Float32Array([0.5, -0.5, 0.25, -0.25]);
    const output = floatTo16BitPCM(input);
    expect(output).toBeInstanceOf(Int16Array);
    expect(output.length).toBe(input.length);
  });

  it('clamps values above 1.0 to 32767', () => {
    const input = new Float32Array([2.0, 10.0]);
    const output = floatTo16BitPCM(input);
    expect(output[0]).toBe(32767);
    expect(output[1]).toBe(32767);
  });

  it('clamps values below -1.0 to -32768', () => {
    const input = new Float32Array([-2.0, -10.0]);
    const output = floatTo16BitPCM(input);
    expect(output[0]).toBe(-32768);
    expect(output[1]).toBe(-32768);
  });

  it('converts 0.5 to approximately 16383 (positive half range)', () => {
    const input = new Float32Array([0.5]);
    const output = floatTo16BitPCM(input);
    // 0.5 * 0x7fff = 0.5 * 32767 = 16383.5 → truncated to 16383
    expect(output[0]).toBe(16383);
  });

  it('converts -0.5 to -16384 (negative half range)', () => {
    const input = new Float32Array([-0.5]);
    const output = floatTo16BitPCM(input);
    // -0.5 * 0x8000 = -0.5 * 32768 = -16384
    expect(output[0]).toBe(-16384);
  });

  it('handles an empty array', () => {
    const input = new Float32Array([]);
    const output = floatTo16BitPCM(input);
    expect(output.length).toBe(0);
  });
});

describe('downsample', () => {
  it('returns the original buffer when input and output rates are equal', () => {
    const buffer = new Float32Array([1.0, 2.0, 3.0]);
    const result = downsample(buffer, 44100, 44100);
    expect(result).toBe(buffer); // same reference
  });

  it('halves the length when downsampling 2:1', () => {
    const buffer = new Float32Array([1.0, 2.0, 3.0, 4.0]);
    const result = downsample(buffer, 44100, 22050);
    expect(result.length).toBe(2);
  });

  it('averages pairs of samples when downsampling 2:1', () => {
    const buffer = new Float32Array([1.0, 2.0, 3.0, 4.0]);
    const result = downsample(buffer, 44100, 22050);
    // First output: average of [1.0, 2.0] = 1.5
    expect(result[0]).toBeCloseTo(1.5);
    // Second output: average of [3.0, 4.0] = 3.5
    expect(result[1]).toBeCloseTo(3.5);
  });

  it('returns Float32Array', () => {
    const buffer = new Float32Array([1.0, 2.0, 3.0, 4.0]);
    const result = downsample(buffer, 44100, 22050);
    expect(result).toBeInstanceOf(Float32Array);
  });

  it('downsamples 4:1 correctly', () => {
    const buffer = new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]);
    const result = downsample(buffer, 44100, 11025);
    expect(result.length).toBe(2);
    // First group: average of [0.1, 0.2, 0.3, 0.4] = 0.25
    expect(result[0]).toBeCloseTo(0.25, 5);
    // Second group: average of [0.5, 0.6, 0.7, 0.8] = 0.65
    expect(result[1]).toBeCloseTo(0.65, 5);
  });

  it('handles a single-sample buffer downsampled by 2', () => {
    const buffer = new Float32Array([0.8]);
    const result = downsample(buffer, 44100, 22050);
    // Math.round(1/2) = 1 output sample, value = 0.8
    expect(result.length).toBe(1);
    expect(result[0]).toBeCloseTo(0.8);
  });
});
