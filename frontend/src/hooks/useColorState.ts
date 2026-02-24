import { useState, useCallback } from 'react';
import type { ColorState } from '../types/colorState';
import { initialColorState } from '../types/colorState';
import { ColorConverter } from '../utils/colorConverter';
import type { ColorSpace } from '../types/color';
import { playTransformSound, playSelectSound } from '../utils/soundEffects';

/**
 * Custom hook for managing color state
 * Centralizes all color-related state and conversion logic
 */
export const useColorState = () => {
  const [colorState, setColorState] = useState<ColorState>(initialColorState);

  /**
   * Update all color values from RGB
   */
  const updateFromRgb = useCallback((r: number, g: number, b: number) => {
    const allFormats = ColorConverter.fromRgb(r, g, b);
    setColorState((prev) => {
      // 色が実際に変更された場合のみ効果音を再生
      const colorChanged = 
        Math.round(prev.r) !== Math.round(r) ||
        Math.round(prev.g) !== Math.round(g) ||
        Math.round(prev.b) !== Math.round(b);
      
      if (colorChanged) {
        playSelectSound();
      }
      
      return {
        ...prev,
        r,
        g,
        b,
        c: allFormats.cmyk[0],
        m: allFormats.cmyk[1],
        y: allFormats.cmyk[2],
        k: allFormats.cmyk[3],
        h: allFormats.hsl[0],
        s: allFormats.hsl[1],
        l: allFormats.hsl[2],
        hsvS: allFormats.hsv[1],
        v: allFormats.hsv[2],
        hexInput: allFormats.hex.toUpperCase(),
      };
    });
  }, []);

  /**
   * Update all color values from CMYK
   */
  const updateFromCmyk = useCallback((c: number, m: number, y: number, k: number) => {
    const allFormats = ColorConverter.fromCmyk(c, m, y, k);
    setColorState((prev) => ({
      ...prev,
      r: allFormats.rgb[0],
      g: allFormats.rgb[1],
      b: allFormats.rgb[2],
      c,
      m,
      y,
      k,
      h: allFormats.hsl[0],
      s: allFormats.hsl[1],
      l: allFormats.hsl[2],
      hsvS: allFormats.hsv[1],
      v: allFormats.hsv[2],
      hexInput: allFormats.hex.toUpperCase(),
    }));
  }, []);

  /**
   * Update all color values from HSL
   */
  const updateFromHsl = useCallback((h: number, s: number, l: number) => {
    const allFormats = ColorConverter.fromHsl(h, s, l);
    setColorState((prev) => ({
      ...prev,
      r: allFormats.rgb[0],
      g: allFormats.rgb[1],
      b: allFormats.rgb[2],
      c: allFormats.cmyk[0],
      m: allFormats.cmyk[1],
      y: allFormats.cmyk[2],
      k: allFormats.cmyk[3],
      h,
      s,
      l,
      hsvS: allFormats.hsv[1],
      v: allFormats.hsv[2],
      hexInput: allFormats.hex.toUpperCase(),
    }));
  }, []);

  /**
   * Update all color values from HSV
   */
  const updateFromHsv = useCallback((h: number, s: number, v: number) => {
    const allFormats = ColorConverter.fromHsv(h, s, v);
    setColorState((prev) => ({
      ...prev,
      r: allFormats.rgb[0],
      g: allFormats.rgb[1],
      b: allFormats.rgb[2],
      c: allFormats.cmyk[0],
      m: allFormats.cmyk[1],
      y: allFormats.cmyk[2],
      k: allFormats.cmyk[3],
      h: allFormats.hsl[0],
      s: allFormats.hsl[1],
      l: allFormats.hsl[2],
      hsvS: s,
      v,
      hexInput: allFormats.hex.toUpperCase(),
    }));
  }, []);

  /**
   * Update all color values from HEX
   */
  const updateFromHex = useCallback((hex: string) => {
    const allFormats = ColorConverter.fromHex(hex);
    setColorState((prev) => ({
      ...prev,
      r: allFormats.rgb[0],
      g: allFormats.rgb[1],
      b: allFormats.rgb[2],
      c: allFormats.cmyk[0],
      m: allFormats.cmyk[1],
      y: allFormats.cmyk[2],
      k: allFormats.cmyk[3],
      h: allFormats.hsl[0],
      s: allFormats.hsl[1],
      l: allFormats.hsl[2],
      hsvS: allFormats.hsv[1],
      v: allFormats.hsv[2],
      hexInput: hex.toUpperCase(),
    }));
  }, []);

  /**
   * Update a single RGB value
   */
  const updateRgbValue = useCallback(
    (param: 'R' | 'G' | 'B', value: number) => {
      const newRgb = {
        r: colorState.r,
        g: colorState.g,
        b: colorState.b,
        [param.toLowerCase()]: value,
      };
      updateFromRgb(newRgb.r, newRgb.g, newRgb.b);
    },
    [colorState.r, colorState.g, colorState.b, updateFromRgb]
  );

  /**
   * Update a single CMYK value
   */
  const updateCmykValue = useCallback(
    (param: 'C' | 'M' | 'Y' | 'K', value: number) => {
      const newCmyk = {
        c: colorState.c,
        m: colorState.m,
        y: colorState.y,
        k: colorState.k,
        [param.toLowerCase()]: value,
      };
      updateFromCmyk(newCmyk.c, newCmyk.m, newCmyk.y, newCmyk.k);
    },
    [colorState.c, colorState.m, colorState.y, colorState.k, updateFromCmyk]
  );

  /**
   * Update a single HSL value
   */
  const updateHslValue = useCallback(
    (param: 'H' | 'S' | 'L', value: number) => {
      const newHsl = {
        h: colorState.h,
        s: colorState.s,
        l: colorState.l,
        [param.toLowerCase()]: value,
      };
      updateFromHsl(newHsl.h, newHsl.s, newHsl.l);
    },
    [colorState.h, colorState.s, colorState.l, updateFromHsl]
  );

  /**
   * Update a single HSV value
   */
  const updateHsvValue = useCallback(
    (param: 'H' | 'HsvS' | 'V', value: number) => {
      let newHsv: { h: number; s: number; v: number };
      if (param === 'HsvS') {
        newHsv = {
          h: colorState.h,
          s: value,
          v: colorState.v,
        };
      } else if (param === 'H') {
        newHsv = {
          h: value,
          s: colorState.hsvS,
          v: colorState.v,
        };
      } else {
        // param === 'V'
        newHsv = {
          h: colorState.h,
          s: colorState.hsvS,
          v: value,
        };
      }
      updateFromHsv(newHsv.h, newHsv.s, newHsv.v);
    },
    [colorState.h, colorState.hsvS, colorState.v, updateFromHsv]
  );

  /**
   * Set color space
   */
  const setShape = useCallback((shape: ColorSpace) => {
    setColorState((prev) => {
      // 色空間が実際に変更された場合のみ効果音を再生
      if (prev.shape !== shape) {
        playTransformSound();
      }
      return { ...prev, shape };
    });
  }, []);

  /**
   * Set main element for RGB
   */
  const setRgbMainElement = useCallback((element: 'R' | 'G' | 'B') => {
    setColorState((prev) => {
      // 色空間が変更された場合のみ効果音を再生
      if (prev.shape !== 'RGB') {
        playTransformSound();
      }
      return {
        ...prev,
        shape: 'RGB',
        rgbMainElement: element,
      };
    });
  }, []);

  /**
   * Set main element for CMYK
   */
  const setCmykMainElement = useCallback((element: 'C' | 'M' | 'Y' | 'K') => {
    setColorState((prev) => {
      // 色空間が変更された場合のみ効果音を再生
      if (prev.shape !== 'CMYK') {
        playTransformSound();
      }
      return {
        ...prev,
        shape: 'CMYK',
        cmykMainElement: element,
      };
    });
  }, []);

  /**
   * Set main element for HSL
   */
  const setHslMainElement = useCallback((element: 'H' | 'S' | 'L') => {
    setColorState((prev) => {
      // 色空間が変更された場合のみ効果音を再生
      if (prev.shape !== 'HSL') {
        playTransformSound();
      }
      return {
        ...prev,
        shape: 'HSL',
        hslMainElement: element,
      };
    });
  }, []);

  /**
   * Set main element for HSV
   */
  const setHsvMainElement = useCallback((element: 'H' | 'S' | 'V') => {
    setColorState((prev) => {
      // 色空間が変更された場合のみ効果音を再生
      if (prev.shape !== 'HSV') {
        playTransformSound();
      }
      return {
        ...prev,
        shape: 'HSV',
        hsvMainElement: element,
      };
    });
  }, []);

  /**
   * Toggle label visibility
   */
  const toggleLabel = useCallback(() => {
    setColorState((prev) => ({ ...prev, isLabelShown: !prev.isLabelShown }));
  }, []);

  /**
   * Set hex input (without updating colors)
   */
  const setHexInput = useCallback((hex: string) => {
    setColorState((prev) => ({ ...prev, hexInput: hex.toUpperCase() }));
  }, []);

  /**
   * Adjust HSL value (brightness, saturation, or hue)
   * Always adjusts in HSL color space regardless of current color space
   * Uses functional update to always work with the latest state
   */
  const adjustHslValue = useCallback(
    (property: 'brightness' | 'saturation' | 'hue', direction: 'up' | 'down', amount?: number) => {
      setColorState((prev) => {
        // Get latest values from the current state
        const currentH = prev.h;
        const currentS = prev.s;
        const currentL = prev.l;

        // Check if already at limit (before adjustment)
        if (property === 'brightness') {
          // Brightness (lightness) range: 0-100
          if (direction === 'up' && currentL >= 100) {
            // Already at maximum brightness, no adjustment needed
            return prev;
          }
          if (direction === 'down' && currentL <= 0) {
            // Already at minimum brightness, no adjustment needed
            return prev;
          }
        } else if (property === 'saturation') {
          // Saturation range: 0-100
          if (direction === 'up' && currentS >= 100) {
            // Already at maximum saturation, no adjustment needed
            return prev;
          }
          if (direction === 'down' && currentS <= 0) {
            // Already at minimum saturation, no adjustment needed
            return prev;
          }
        }
        // Hue is circular (0-360), so no limit check needed

        let newH = currentH;
        let newS = currentS;
        let newL = currentL;

        // Calculate adjustment amount
        // Default: 10% of full range (0-100) = 10 for brightness/saturation (absolute), 10 for hue (absolute)
        let adjustmentAmount: number;
        if (amount !== undefined) {
          // Use specified amount (absolute value)
          adjustmentAmount = amount;
        } else {
          // Default adjustment based on property
          if (property === 'hue') {
            // Hue: absolute adjustment (0-360 range), default 10
            adjustmentAmount = 10;
          } else {
            // Brightness/Saturation: 10% of full range (0-100) = 10 absolute
            // This ensures consistent adjustment regardless of current value
            adjustmentAmount = 10;
          }
        }

        // Apply adjustment
        if (property === 'brightness') {
          newL = direction === 'up' ? currentL + adjustmentAmount : currentL - adjustmentAmount;
          // Clip to 0-100 range
          newL = Math.max(0, Math.min(100, newL));
        } else if (property === 'saturation') {
          newS = direction === 'up' ? currentS + adjustmentAmount : currentS - adjustmentAmount;
          // Clip to 0-100 range
          newS = Math.max(0, Math.min(100, newS));
        } else if (property === 'hue') {
          newH = direction === 'up' ? currentH + adjustmentAmount : currentH - adjustmentAmount;
          // Clip to 0-360 range (circular)
          newH = ((newH % 360) + 360) % 360;
        }

        // Update color using HSL
        const allFormats = ColorConverter.fromHsl(newH, newS, newL);
        return {
          ...prev,
          r: allFormats.rgb[0],
          g: allFormats.rgb[1],
          b: allFormats.rgb[2],
          c: allFormats.cmyk[0],
          m: allFormats.cmyk[1],
          y: allFormats.cmyk[2],
          k: allFormats.cmyk[3],
          h: newH,
          s: newS,
          l: newL,
          hsvS: allFormats.hsv[1],
          v: allFormats.hsv[2],
          hexInput: allFormats.hex.toUpperCase(),
        };
      });
    },
    [] // No dependencies needed - uses functional update
  );

  return {
    colorState,
    updateFromRgb,
    updateFromCmyk,
    updateFromHsl,
    updateFromHsv,
    updateFromHex,
    updateRgbValue,
    updateCmykValue,
    updateHslValue,
    updateHsvValue,
    setShape,
    setRgbMainElement,
    setCmykMainElement,
    setHslMainElement,
    setHsvMainElement,
    toggleLabel,
    setHexInput,
    adjustHslValue,
  };
};
