import { useState, useCallback } from 'react';
import type { ColorState } from '../types/colorState';
import { initialColorState } from '../types/colorState';
import { ColorConverter } from '../utils/colorConverter';
import type { ColorSpace } from '../types/color';
import { playTransformSound, playSelectSound } from '../utils/soundEffects';

const applyShapeAndElement = (
  prev: ColorState,
  shape: ColorSpace,
  key: string,
  element: string
): ColorState => {
  if (prev.shape !== shape) playTransformSound();
  return { ...prev, shape, [key]: element } as ColorState;
};

export const useColorState = () => {
  const [colorState, setColorState] = useState<ColorState>(initialColorState);

  const updateFromRgb = useCallback((r: number, g: number, b: number) => {
    const allFormats = ColorConverter.fromRgb(r, g, b);
    setColorState((prev) => {
      if (
        Math.round(prev.r) !== Math.round(r) ||
        Math.round(prev.g) !== Math.round(g) ||
        Math.round(prev.b) !== Math.round(b)
      ) {
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
        hsbS: allFormats.hsb[1],
        v: allFormats.hsb[2],
        hexInput: allFormats.hex.toUpperCase(),
      };
    });
  }, []);

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
      hsbS: allFormats.hsb[1],
      v: allFormats.hsb[2],
      hexInput: allFormats.hex.toUpperCase(),
    }));
  }, []);

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
      hsbS: allFormats.hsb[1],
      v: allFormats.hsb[2],
      hexInput: allFormats.hex.toUpperCase(),
    }));
  }, []);

  const updateFromHsb = useCallback((h: number, s: number, v: number) => {
    const allFormats = ColorConverter.fromHsb(h, s, v);
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
      hsbS: s,
      v,
      hexInput: allFormats.hex.toUpperCase(),
    }));
  }, []);

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
      hsbS: allFormats.hsb[1],
      v: allFormats.hsb[2],
      hexInput: hex.toUpperCase(),
    }));
  }, []);

  const updateRgbValue = useCallback(
    (param: 'R' | 'G' | 'B', value: number) => {
      const r = param === 'R' ? value : colorState.r;
      const g = param === 'G' ? value : colorState.g;
      const b = param === 'B' ? value : colorState.b;
      updateFromRgb(r, g, b);
    },
    [colorState.r, colorState.g, colorState.b, updateFromRgb]
  );

  const updateCmykValue = useCallback(
    (param: 'C' | 'M' | 'Y' | 'K', value: number) => {
      const c = param === 'C' ? value : colorState.c;
      const m = param === 'M' ? value : colorState.m;
      const y = param === 'Y' ? value : colorState.y;
      const k = param === 'K' ? value : colorState.k;
      updateFromCmyk(c, m, y, k);
    },
    [colorState.c, colorState.m, colorState.y, colorState.k, updateFromCmyk]
  );

  const updateHslValue = useCallback(
    (param: 'H' | 'S' | 'L', value: number) => {
      const h = param === 'H' ? value : colorState.h;
      const s = param === 'S' ? value : colorState.s;
      const l = param === 'L' ? value : colorState.l;
      updateFromHsl(h, s, l);
    },
    [colorState.h, colorState.s, colorState.l, updateFromHsl]
  );

  const updateHsvValue = useCallback(
    (param: 'H' | 'HsvS' | 'V', value: number) => {
      const h = param === 'H' ? value : colorState.h;
      const s = param === 'HsvS' ? value : colorState.hsbS;
      const v = param === 'V' ? value : colorState.v;
      updateFromHsb(h, s, v);
    },
    [colorState.h, colorState.hsbS, colorState.v, updateFromHsb]
  );

  const setShape = useCallback((shape: ColorSpace) => {
    setColorState((prev) => {
      if (prev.shape !== shape) playTransformSound();
      return { ...prev, shape };
    });
  }, []);

  const setRgbMainElement = useCallback(
    (element: 'R' | 'G' | 'B') =>
      setColorState((p) => applyShapeAndElement(p, 'RGB', 'rgbMainElement', element)),
    []
  );

  const setCmykMainElement = useCallback(
    (element: 'C' | 'M' | 'Y' | 'K') =>
      setColorState((p) => applyShapeAndElement(p, 'CMYK', 'cmykMainElement', element)),
    []
  );

  const setHslMainElement = useCallback(
    (element: 'H' | 'S' | 'L') =>
      setColorState((p) => applyShapeAndElement(p, 'HSL', 'hslMainElement', element)),
    []
  );

  const setHsvMainElement = useCallback(
    (element: 'H' | 'S' | 'V') =>
      setColorState((p) => applyShapeAndElement(p, 'HSB', 'hsbMainElement', element)),
    []
  );

  const toggleLabel = useCallback(() => {
    setColorState((prev) => ({ ...prev, isLabelShown: !prev.isLabelShown }));
  }, []);

  const setHexInput = useCallback((hex: string) => {
    setColorState((prev) => ({ ...prev, hexInput: hex.toUpperCase() }));
  }, []);

  const adjustHslValue = useCallback(
    (property: 'brightness' | 'saturation' | 'hue', direction: 'up' | 'down', amount?: number) => {
      setColorState((prev) => {
        const { h: currentH, s: currentS, l: currentL } = prev;
        const adjustmentAmount = amount ?? 10;
        const delta = direction === 'up' ? adjustmentAmount : -adjustmentAmount;

        if (property === 'brightness') {
          if (direction === 'up' && currentL >= 100) return prev;
          if (direction === 'down' && currentL <= 0) return prev;
        } else if (property === 'saturation') {
          if (direction === 'up' && currentS >= 100) return prev;
          if (direction === 'down' && currentS <= 0) return prev;
        }

        let newH = currentH,
          newS = currentS,
          newL = currentL;
        if (property === 'brightness') {
          newL = Math.max(0, Math.min(100, currentL + delta));
        } else if (property === 'saturation') {
          newS = Math.max(0, Math.min(100, currentS + delta));
        } else {
          newH = (((currentH + delta) % 360) + 360) % 360;
        }

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
          hsbS: allFormats.hsb[1],
          v: allFormats.hsb[2],
          hexInput: allFormats.hex.toUpperCase(),
        };
      });
    },
    []
  );

  return {
    colorState,
    updateFromRgb,
    updateFromCmyk,
    updateFromHsl,
    updateFromHsb,
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
