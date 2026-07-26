import { useState, useCallback } from 'react';
import type { ColorState } from '../types/colorState';
import { initialColorState } from '../types/colorState';
import { ColorConverter } from '../utils/colorConverter';
import { rgbToOklch, oklchToRgbGamutMapped } from '../utils/gamutUtils';
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
    setColorState((prev) => {
      if (
        Math.round(prev.r) !== Math.round(allFormats.rgb[0]) ||
        Math.round(prev.g) !== Math.round(allFormats.rgb[1]) ||
        Math.round(prev.b) !== Math.round(allFormats.rgb[2])
      ) {
        playSelectSound();
      }
      return {
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
    };
    });
  }, []);

  const updateFromHsl = useCallback((h: number, s: number, l: number) => {
    const allFormats = ColorConverter.fromHsl(h, s, l);
    setColorState((prev) => {
      if (
        Math.round(prev.r) !== Math.round(allFormats.rgb[0]) ||
        Math.round(prev.g) !== Math.round(allFormats.rgb[1]) ||
        Math.round(prev.b) !== Math.round(allFormats.rgb[2])
      ) {
        playSelectSound();
      }
      return {
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
      };
    });
  }, []);

  const updateFromHsb = useCallback((h: number, s: number, v: number) => {
    const allFormats = ColorConverter.fromHsb(h, s, v);
    setColorState((prev) => {
      if (
        Math.round(prev.r) !== Math.round(allFormats.rgb[0]) ||
        Math.round(prev.g) !== Math.round(allFormats.rgb[1]) ||
        Math.round(prev.b) !== Math.round(allFormats.rgb[2])
      ) {
        playSelectSound();
      }
      return {
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
      };
    });
  }, []);

  const updateFromHex = useCallback((hex: string) => {
    const allFormats = ColorConverter.fromHex(hex);
    setColorState((prev) => {
      if (
        Math.round(prev.r) !== Math.round(allFormats.rgb[0]) ||
        Math.round(prev.g) !== Math.round(allFormats.rgb[1]) ||
        Math.round(prev.b) !== Math.round(allFormats.rgb[2])
      ) {
        playSelectSound();
      }
      return {
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
      };
    });
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

  const setLabMainElement = useCallback(
    (element: 'L' | 'a' | 'b') =>
      setColorState((p) => applyShapeAndElement(p, 'Lab', 'labMainElement', element)),
    []
  );

  const setLchMainElement = useCallback(
    (element: 'L' | 'C' | 'H') =>
      setColorState((p) => applyShapeAndElement(p, 'LCH', 'lchMainElement', element)),
    []
  );

  const setOklchMainElement = useCallback(
    (element: 'L' | 'C' | 'H') =>
      setColorState((p) => applyShapeAndElement(p, 'OKLCH', 'oklchMainElement', element)),
    []
  );

  const toggleLabel = useCallback(() => {
    setColorState((prev) => ({ ...prev, isLabelShown: !prev.isLabelShown }));
  }, []);

  const setHexInput = useCallback((hex: string) => {
    setColorState((prev) => ({ ...prev, hexInput: hex.toUpperCase() }));
  }, []);

  const adjustOklchValue = useCallback(
    (property: 'brightness' | 'saturation' | 'hue', direction: 'up' | 'down', amount?: number) => {
      setColorState((prev) => {
        const [okL, okC, okH] = rgbToOklch(prev.r, prev.g, prev.b);

        if (property === 'brightness') {
          if (direction === 'up' && okL >= 1) return prev;
          if (direction === 'down' && okL <= 0) return prev;
        } else if (property === 'saturation') {
          if (direction === 'down' && okC <= 0) return prev;
        }

        const sign = direction === 'up' ? 1 : -1;
        let newL = okL, newC = okC, newH = okH;
        if (property === 'brightness') {
          const delta = sign * (amount ?? 10) / 100;
          newL = Math.max(0, Math.min(1, okL + delta));
        } else if (property === 'saturation') {
          const delta = sign * (amount ?? 10) / 250;
          newC = Math.max(0, okC + delta);
        } else {
          const delta = sign * (amount ?? 10);
          newH = (((okH + delta) % 360) + 360) % 360;
        }

        const [r, g, b] = oklchToRgbGamutMapped(newL, newC, newH);
        const allFormats = ColorConverter.fromRgb(r, g, b);
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
    setLabMainElement,
    setLchMainElement,
    setOklchMainElement,
    toggleLabel,
    setHexInput,
    adjustOklchValue,
  };
};
