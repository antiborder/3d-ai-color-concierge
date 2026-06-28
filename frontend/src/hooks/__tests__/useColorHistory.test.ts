import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useColorHistory } from '../useColorHistory';

describe('useColorHistory', () => {
  it('starts with an empty history', () => {
    const { result } = renderHook(() => useColorHistory());
    expect(result.current.history).toHaveLength(0);
  });

  it('adds a color to history', () => {
    const { result } = renderHook(() => useColorHistory());
    act(() => {
      result.current.addColor(255, 0, 0);
    });
    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].r).toBe(255);
    expect(result.current.history[0].g).toBe(0);
    expect(result.current.history[0].b).toBe(0);
  });

  it('stores the hex representation correctly', () => {
    const { result } = renderHook(() => useColorHistory());
    act(() => {
      result.current.addColor(255, 0, 0);
    });
    expect(result.current.history[0].hex).toBe('#FF0000');
  });

  it('adds new colors to the beginning of history (most recent first)', () => {
    const { result } = renderHook(() => useColorHistory());
    act(() => {
      result.current.addColor(255, 0, 0); // red
    });
    act(() => {
      result.current.addColor(0, 255, 0); // green
    });
    expect(result.current.history).toHaveLength(2);
    // Most recent first
    expect(result.current.history[0].g).toBe(255); // green is first
    expect(result.current.history[1].r).toBe(255); // red is second
  });

  it('skips duplicate consecutive colors', () => {
    const { result } = renderHook(() => useColorHistory());
    act(() => {
      result.current.addColor(255, 0, 0);
    });
    act(() => {
      result.current.addColor(255, 0, 0); // same color again
    });
    // Should not duplicate
    expect(result.current.history).toHaveLength(1);
  });

  it('adds same color again after a different color in between', () => {
    const { result } = renderHook(() => useColorHistory());
    act(() => {
      result.current.addColor(255, 0, 0); // red
    });
    act(() => {
      result.current.addColor(0, 255, 0); // green
    });
    act(() => {
      result.current.addColor(255, 0, 0); // red again
    });
    expect(result.current.history).toHaveLength(3);
  });

  it('includes a timestamp for each color entry', () => {
    const before = Date.now();
    const { result } = renderHook(() => useColorHistory());
    act(() => {
      result.current.addColor(0, 0, 255);
    });
    const after = Date.now();
    expect(result.current.history[0].timestamp).toBeGreaterThanOrEqual(before);
    expect(result.current.history[0].timestamp).toBeLessThanOrEqual(after);
  });

  it('clears all history via clearHistory', () => {
    const { result } = renderHook(() => useColorHistory());
    act(() => {
      result.current.addColor(255, 0, 0);
      result.current.addColor(0, 255, 0);
    });
    act(() => {
      result.current.clearHistory();
    });
    expect(result.current.history).toHaveLength(0);
  });

  it('can add colors again after clearing', () => {
    const { result } = renderHook(() => useColorHistory());
    act(() => {
      result.current.addColor(255, 0, 0);
    });
    act(() => {
      result.current.clearHistory();
    });
    // After clear, the lastColorRef is also reset, so adding same color works
    act(() => {
      result.current.addColor(255, 0, 0);
    });
    expect(result.current.history).toHaveLength(1);
  });

  it('caps history at 100 items', () => {
    const { result } = renderHook(() => useColorHistory());
    // Add 102 unique colors
    act(() => {
      for (let i = 0; i < 102; i++) {
        // Use different b values to ensure they're not duplicates
        result.current.addColor(i % 256, (i + 1) % 256, (i + 2) % 256);
      }
    });
    expect(result.current.history.length).toBeLessThanOrEqual(100);
  });

  it('treats colors as duplicates when Math.round of each channel matches', () => {
    const { result } = renderHook(() => useColorHistory());
    act(() => {
      result.current.addColor(100.3, 0, 0); // Math.round → 100
    });
    act(() => {
      result.current.addColor(100.4, 0, 0); // Math.round → 100 (same as above)
    });
    // Both round to 100 → treated as the same color → only 1 entry
    expect(result.current.history).toHaveLength(1);
  });
});
