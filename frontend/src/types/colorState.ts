import type { ColorSpace } from './color';
import { ColorConverter } from '../utils/colorConverter';

/**
 * Complete color state including all color spaces and UI state
 */
export interface ColorState {
  // RGB values
  r: number;
  g: number;
  b: number;

  // CMYK values
  c: number;
  m: number;
  y: number;
  k: number;

  // HSL values
  h: number;
  s: number;
  l: number;

  // HSV values
  hsbS: number;
  v: number;

  // Current color space
  shape: ColorSpace;

  // Main element for each color space
  rgbMainElement: 'R' | 'G' | 'B';
  cmykMainElement: 'C' | 'M' | 'Y' | 'K';
  hslMainElement: 'H' | 'S' | 'L';
  hsbMainElement: 'H' | 'S' | 'V';
  labMainElement: 'L' | 'a' | 'b';

  // Hex input
  hexInput: string;

  // UI state
  isLabelShown: boolean;
}

/**
 * Generate random initial color state
 */
function generateRandomInitialColorState(): ColorState {
  // ランダムに色空間を選択
  const colorSpaces: ColorSpace[] = ['RGB', 'CMYK', 'HSB', 'HSL'];
  const randomColorSpace = colorSpaces[Math.floor(Math.random() * colorSpaces.length)];

  let r = 0,
    g = 0,
    b = 0;
  let c = 0,
    m = 0,
    y = 0,
    k = 0;
  let h = 0,
    s = 0,
    l = 0;
  let hsbS = 0,
    v = 0;

  // 選択された色空間に応じてランダムな色を生成
  switch (randomColorSpace) {
    case 'RGB': {
      r = Math.floor(Math.random() * 256);
      g = Math.floor(Math.random() * 256);
      b = Math.floor(Math.random() * 256);
      const allFormats = ColorConverter.fromRgb(r, g, b);
      c = allFormats.cmyk[0];
      m = allFormats.cmyk[1];
      y = allFormats.cmyk[2];
      k = allFormats.cmyk[3];
      h = allFormats.hsl[0];
      s = allFormats.hsl[1];
      l = allFormats.hsl[2];
      hsbS = allFormats.hsb[1];
      v = allFormats.hsb[2];
      break;
    }
    case 'CMYK': {
      c = Math.floor(Math.random() * 101);
      m = Math.floor(Math.random() * 101);
      y = Math.floor(Math.random() * 101);
      k = Math.floor(Math.random() * 101);
      const allFormats = ColorConverter.fromCmyk(c, m, y, k);
      r = allFormats.rgb[0];
      g = allFormats.rgb[1];
      b = allFormats.rgb[2];
      h = allFormats.hsl[0];
      s = allFormats.hsl[1];
      l = allFormats.hsl[2];
      hsbS = allFormats.hsb[1];
      v = allFormats.hsb[2];
      break;
    }
    case 'HSL': {
      h = Math.floor(Math.random() * 360);
      s = Math.floor(Math.random() * 101);
      l = Math.floor(Math.random() * 101);
      const allFormats = ColorConverter.fromHsl(h, s, l);
      r = allFormats.rgb[0];
      g = allFormats.rgb[1];
      b = allFormats.rgb[2];
      c = allFormats.cmyk[0];
      m = allFormats.cmyk[1];
      y = allFormats.cmyk[2];
      k = allFormats.cmyk[3];
      hsbS = allFormats.hsb[1];
      v = allFormats.hsb[2];
      break;
    }
    case 'HSB': {
      h = Math.floor(Math.random() * 360);
      hsbS = Math.floor(Math.random() * 101);
      v = Math.floor(Math.random() * 101);
      const allFormats = ColorConverter.fromHsb(h, hsbS, v);
      r = allFormats.rgb[0];
      g = allFormats.rgb[1];
      b = allFormats.rgb[2];
      c = allFormats.cmyk[0];
      m = allFormats.cmyk[1];
      y = allFormats.cmyk[2];
      k = allFormats.cmyk[3];
      s = allFormats.hsl[1];
      l = allFormats.hsl[2];
      break;
    }
  }

  // メイン要素をランダムに選択
  const rgbMainElements: ('R' | 'G' | 'B')[] = ['R', 'G', 'B'];
  const cmykMainElements: ('C' | 'M' | 'Y' | 'K')[] = ['C', 'M', 'Y', 'K'];
  const hslMainElements: ('H' | 'S' | 'L')[] = ['H', 'S', 'L'];
  const hsbMainElements: ('H' | 'S' | 'V')[] = ['H', 'S', 'V'];

  const allFormats = ColorConverter.fromRgb(r, g, b);

  return {
    r,
    g,
    b,
    c,
    m,
    y,
    k,
    h,
    s,
    l,
    hsbS,
    v,
    shape: randomColorSpace,
    rgbMainElement: rgbMainElements[Math.floor(Math.random() * rgbMainElements.length)],
    cmykMainElement: cmykMainElements[Math.floor(Math.random() * cmykMainElements.length)],
    hslMainElement: hslMainElements[Math.floor(Math.random() * hslMainElements.length)],
    hsbMainElement: hsbMainElements[Math.floor(Math.random() * hsbMainElements.length)],
    labMainElement: 'L',
    hexInput: allFormats.hex.toUpperCase(),
    isLabelShown: false,
  };
}

/**
 * Initial color state (randomly generated)
 */
export const initialColorState: ColorState = generateRandomInitialColorState();
