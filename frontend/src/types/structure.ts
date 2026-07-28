import type { MutableRefObject } from 'react';
import type { ColorSpace } from './color';
import type { HarmonyColor } from '../utils/colorHarmony';

export interface AiColorLabel {
  r: number;
  g: number;
  b: number;
  label: string;
}

export interface StructureProps {
  rotateCameraRef?: MutableRefObject<boolean>;
  resetCameraZoomSignal?: number;
  harmonyZoomSignal?: number;
  bridgeColorA?: { r: number; g: number; b: number };
  bridgeColorB?: { r: number; g: number; b: number };
  isBridgeOpen?: boolean;
  isTwoDPickerOpen?: boolean;
  harmonyColors?: HarmonyColor[];
  aiColorLabels?: AiColorLabel[];
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
  hsbMainElement: 'H' | 'S' | 'V';
  labMainElement: 'L' | 'a' | 'b';
  lchMainElement: 'L' | 'C' | 'H';
  oklchMainElement: 'L' | 'C' | 'H';

  // Axis-arrow drag callbacks
  onPreviewRgb?: (r: number, g: number, b: number) => void;
  onClearPreviewRgb?: () => void;
  onCommitRgb?: (r: number, g: number, b: number) => void;

  // Canvas background
  sceneBackgroundColor?: string;

  // Color target mode
  colorTarget?: 'focused' | 'background';

  // Color group filters
  cssColorsEnabled: boolean;
  materialColorsEnabled: boolean;
  japaneseColorsEnabled: boolean;
  rgbGridColorsEnabled: boolean;
}

export type PositionFunction = (r: number, g: number, b: number) => [number, number, number];
export type RescaleHslFunction = (h: number, s: number, l: number) => [number, number, number];
export type CylindricalToCartesianFunction = (
  theta: number,
  radius: number,
  z: number
) => [number, number, number];
