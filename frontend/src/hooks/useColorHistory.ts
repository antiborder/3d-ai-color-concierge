import { useState, useCallback, useRef } from 'react';
import { ColorConverter } from '../utils/colorConverter';

export interface ColorHistoryItem {
  r: number;
  g: number;
  b: number;
  hex: string;
  timestamp: number;
}

const MAX_HISTORY_SIZE = 100;

/**
 * Custom hook for managing color history
 * Tracks selected colors and provides methods to add and clear history
 */
export const useColorHistory = () => {
  const [history, setHistory] = useState<ColorHistoryItem[]>([]);
  const lastColorRef = useRef<{ r: number; g: number; b: number } | null>(null);

  /**
   * Add a color to the history
   * Skips if the same color was selected consecutively
   */
  const addColor = useCallback((r: number, g: number, b: number) => {
    // Check if this is the same color as the last one
    const isSameColor =
      lastColorRef.current &&
      Math.round(lastColorRef.current.r) === Math.round(r) &&
      Math.round(lastColorRef.current.g) === Math.round(g) &&
      Math.round(lastColorRef.current.b) === Math.round(b);

    if (isSameColor) {
      // Skip adding duplicate consecutive colors
      return;
    }

    // Convert RGB to hex
    const allFormats = ColorConverter.fromRgb(r, g, b);
    const hex = allFormats.hex.toUpperCase();

    // Create new history item
    const newItem: ColorHistoryItem = {
      r,
      g,
      b,
      hex: `#${hex}`,
      timestamp: Date.now(),
    };

    setHistory((prev) => {
      // Add new item to the beginning of the array
      const newHistory = [newItem, ...prev];

      // Remove oldest items if exceeding max size
      if (newHistory.length > MAX_HISTORY_SIZE) {
        return newHistory.slice(0, MAX_HISTORY_SIZE);
      }

      return newHistory;
    });

    // Update last color reference
    lastColorRef.current = { r, g, b };
  }, []);

  /**
   * Clear all color history
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
    lastColorRef.current = null;
  }, []);

  return {
    history,
    addColor,
    clearHistory,
  };
};
