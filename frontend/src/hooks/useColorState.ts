import { useState, useCallback } from 'react';
import type { ColorState } from '../types/colorState';
import { initialColorState } from '../types/colorState';
import { ColorConverter } from '../utils/colorConverter';
import type { ColorSpace } from '../types/color';

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
    setColorState((prev) => ({
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
    }));
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
    setColorState((prev) => ({ ...prev, shape }));
  }, []);

  /**
   * Set main element for RGB
   */
  const setRgbMainElement = useCallback((element: 'R' | 'G' | 'B') => {
    setColorState((prev) => ({
      ...prev,
      shape: 'RGB',
      rgbMainElement: element,
    }));
  }, []);

  /**
   * Set main element for CMYK
   */
  const setCmykMainElement = useCallback((element: 'C' | 'M' | 'Y' | 'K') => {
    setColorState((prev) => ({
      ...prev,
      shape: 'CMYK',
      cmykMainElement: element,
    }));
  }, []);

  /**
   * Set main element for HSL
   */
  const setHslMainElement = useCallback((element: 'H' | 'S' | 'L') => {
    setColorState((prev) => ({
      ...prev,
      shape: 'HSL',
      hslMainElement: element,
    }));
  }, []);

  /**
   * Set main element for HSV
   */
  const setHsvMainElement = useCallback((element: 'H' | 'S' | 'V') => {
    setColorState((prev) => ({
      ...prev,
      shape: 'HSV',
      hsvMainElement: element,
    }));
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
  };
};
