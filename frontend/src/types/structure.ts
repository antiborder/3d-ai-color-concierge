import type { ColorSpace } from './color';
import type { HarmonyColor } from '../utils/colorHarmony';

export interface StructureProps {
  harmonyColors?: HarmonyColor[];
  shape: ColorSpace;
  isLabelShown: boolean;
  onParticleClick: (r: number, g: number, b: number) => void;

  // Color values
  focusR: number;
  focusG: number;
  focusB: number;
  focusC: number;
  focusM: number;
  focusY: number;
  focusK: number;
  focusH: number;
  focusS: number;
  focusL: number;
  focusHsvS: number;
  focusV: number;

  // Main elements
  rgbMainElement: 'R' | 'G' | 'B';
  cmykMainElement: 'C' | 'M' | 'Y' | 'K';
  hslMainElement: 'H' | 'S' | 'L';
  hsvMainElement: 'H' | 'S' | 'V';

  // Color group filters
  cssColorsEnabled: boolean;
  materialColorsEnabled: boolean;
  spectral12ColorsEnabled: boolean;
  japaneseColorsEnabled: boolean;
  munsellColorsEnabled: boolean;
}

export type PositionFunction = (r: number, g: number, b: number) => [number, number, number];
export type RescaleHslFunction = (h: number, s: number, l: number) => [number, number, number];
export type CylindricalToCartesianFunction = (
  theta: number,
  radius: number,
  z: number
) => [number, number, number];
