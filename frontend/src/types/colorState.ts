import type { ColorSpace } from './color';

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
  hsvS: number;
  v: number;

  // Current color space
  shape: ColorSpace;

  // Main element for each color space
  rgbMainElement: 'R' | 'G' | 'B';
  cmykMainElement: 'C' | 'M' | 'Y' | 'K';
  hslMainElement: 'H' | 'S' | 'L';
  hsvMainElement: 'H' | 'S' | 'V';

  // Hex input
  hexInput: string;

  // UI state
  isLabelShown: boolean;
}

/**
 * Initial color state
 */
export const initialColorState: ColorState = {
  r: 255,
  g: 255,
  b: 255,
  c: 0,
  m: 0,
  y: 0,
  k: 0,
  h: 0,
  s: 100,
  l: 100,
  hsvS: 100,
  v: 100,
  shape: 'RGB',
  rgbMainElement: 'R',
  cmykMainElement: 'C',
  hslMainElement: 'H',
  hsvMainElement: 'H',
  hexInput: 'FFFFFF',
  isLabelShown: false,
};
