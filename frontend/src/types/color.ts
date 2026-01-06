// Color type definitions

export type ColorSpace = 'RGB' | 'CMYK' | 'HSL' | 'HSV';

export type RGB = {
  r: number;
  g: number;
  b: number;
};

export type CMYK = {
  c: number;
  m: number;
  y: number;
  k: number;
};

export type HSL = {
  h: number;
  s: number;
  l: number;
};

export type HSV = {
  h: number;
  s: number;
  v: number;
};

export type ColorState = {
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
};
