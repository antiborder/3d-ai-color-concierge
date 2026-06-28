import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock soundEffects so audio API calls are no-ops in jsdom
vi.mock('../../utils/soundEffects', () => ({
  playTransformSound: vi.fn(),
  playSelectSound: vi.fn(),
}));

// Import hook after mocking
import { useColorState } from '../useColorState';

describe('useColorState – updateFromRgb', () => {
  it('updates r, g, b values', () => {
    const { result } = renderHook(() => useColorState());
    act(() => {
      result.current.updateFromRgb(100, 150, 200);
    });
    expect(result.current.colorState.r).toBe(100);
    expect(result.current.colorState.g).toBe(150);
    expect(result.current.colorState.b).toBe(200);
  });

  it('derives hex correctly from RGB', () => {
    const { result } = renderHook(() => useColorState());
    act(() => {
      result.current.updateFromRgb(255, 0, 0);
    });
    expect(result.current.colorState.hexInput).toBe('FF0000');
  });

  it('derives HSL correctly from pure red (255,0,0)', () => {
    const { result } = renderHook(() => useColorState());
    act(() => {
      result.current.updateFromRgb(255, 0, 0);
    });
    // red in HSL: hue=0, saturation=100, lightness=50
    expect(result.current.colorState.h).toBe(0);
    expect(result.current.colorState.s).toBe(100);
    expect(result.current.colorState.l).toBe(50);
  });

  it('derives CMYK correctly from pure red (255,0,0)', () => {
    const { result } = renderHook(() => useColorState());
    act(() => {
      result.current.updateFromRgb(255, 0, 0);
    });
    // red in CMYK: c=0, m=100, y=100, k=0
    expect(result.current.colorState.c).toBe(0);
    expect(result.current.colorState.m).toBe(100);
    expect(result.current.colorState.y).toBe(100);
    expect(result.current.colorState.k).toBe(0);
  });

  it('handles black (0,0,0)', () => {
    const { result } = renderHook(() => useColorState());
    act(() => {
      result.current.updateFromRgb(0, 0, 0);
    });
    expect(result.current.colorState.r).toBe(0);
    expect(result.current.colorState.g).toBe(0);
    expect(result.current.colorState.b).toBe(0);
    expect(result.current.colorState.hexInput).toBe('000000');
  });

  it('handles white (255,255,255)', () => {
    const { result } = renderHook(() => useColorState());
    act(() => {
      result.current.updateFromRgb(255, 255, 255);
    });
    expect(result.current.colorState.r).toBe(255);
    expect(result.current.colorState.g).toBe(255);
    expect(result.current.colorState.b).toBe(255);
    expect(result.current.colorState.hexInput).toBe('FFFFFF');
    expect(result.current.colorState.l).toBe(100); // lightness
  });
});

describe('useColorState – updateFromHex', () => {
  it('sets correct RGB from hex string', () => {
    const { result } = renderHook(() => useColorState());
    act(() => {
      result.current.updateFromHex('FF0000');
    });
    expect(result.current.colorState.r).toBe(255);
    expect(result.current.colorState.g).toBe(0);
    expect(result.current.colorState.b).toBe(0);
  });

  it('stores hex in uppercase', () => {
    const { result } = renderHook(() => useColorState());
    act(() => {
      result.current.updateFromHex('ff8800');
    });
    expect(result.current.colorState.hexInput).toBe('FF8800');
  });
});

describe('useColorState – updateFromHsl', () => {
  it('preserves input HSL values', () => {
    const { result } = renderHook(() => useColorState());
    act(() => {
      result.current.updateFromHsl(120, 80, 40);
    });
    expect(result.current.colorState.h).toBe(120);
    expect(result.current.colorState.s).toBe(80);
    expect(result.current.colorState.l).toBe(40);
  });

  it('derives consistent RGB from HSL', () => {
    const { result } = renderHook(() => useColorState());
    // hsl(0, 100, 50) = red
    act(() => {
      result.current.updateFromHsl(0, 100, 50);
    });
    expect(result.current.colorState.r).toBe(255);
    expect(result.current.colorState.g).toBe(0);
    expect(result.current.colorState.b).toBe(0);
  });
});

describe('useColorState – updateRgbValue', () => {
  it('updates only the specified channel', () => {
    const { result } = renderHook(() => useColorState());
    // First set a base color
    act(() => {
      result.current.updateFromRgb(100, 150, 200);
    });
    act(() => {
      result.current.updateRgbValue('R', 50);
    });
    // R changed, G and B stayed
    expect(result.current.colorState.r).toBe(50);
    expect(result.current.colorState.g).toBe(150);
    expect(result.current.colorState.b).toBe(200);
  });
});

describe('useColorState – adjustHslValue', () => {
  it('increases lightness by 10 when adjusting brightness up', () => {
    const { result } = renderHook(() => useColorState());
    act(() => {
      result.current.updateFromHsl(0, 100, 40);
    });
    act(() => {
      result.current.adjustHslValue('brightness', 'up');
    });
    expect(result.current.colorState.l).toBe(50);
  });

  it('decreases lightness by 10 when adjusting brightness down', () => {
    const { result } = renderHook(() => useColorState());
    act(() => {
      result.current.updateFromHsl(0, 100, 40);
    });
    act(() => {
      result.current.adjustHslValue('brightness', 'down');
    });
    expect(result.current.colorState.l).toBe(30);
  });

  it('does not go below 0 for brightness', () => {
    const { result } = renderHook(() => useColorState());
    act(() => {
      result.current.updateFromHsl(0, 100, 0);
    });
    act(() => {
      result.current.adjustHslValue('brightness', 'down');
    });
    expect(result.current.colorState.l).toBe(0);
  });

  it('does not go above 100 for brightness', () => {
    const { result } = renderHook(() => useColorState());
    act(() => {
      result.current.updateFromHsl(0, 100, 100);
    });
    act(() => {
      result.current.adjustHslValue('brightness', 'up');
    });
    expect(result.current.colorState.l).toBe(100);
  });

  it('wraps hue around 360 when adjusting hue up past 360', () => {
    const { result } = renderHook(() => useColorState());
    act(() => {
      result.current.updateFromHsl(355, 100, 50);
    });
    act(() => {
      result.current.adjustHslValue('hue', 'up');
    });
    // 355 + 10 = 365 → 365 % 360 = 5
    expect(result.current.colorState.h).toBe(5);
  });
});

describe('useColorState – setHexInput', () => {
  it('stores raw hex input (for typing purposes)', () => {
    const { result } = renderHook(() => useColorState());
    act(() => {
      result.current.setHexInput('abc');
    });
    expect(result.current.colorState.hexInput).toBe('ABC');
  });
});
