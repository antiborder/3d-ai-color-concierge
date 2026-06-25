// Color type definitions

export type ColorSpace = 'RGB' | 'CMYK' | 'HSL' | 'HSB' | 'Lab' | 'LCH' | 'XYZ' | 'xyz' | 'xy';

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

export type HSB = {
  h: number;
  s: number;
  v: number;
};
