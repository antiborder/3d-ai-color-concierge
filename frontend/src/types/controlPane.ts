import type { ChangeEvent } from 'react';
import type { ColorSpace } from './color';
import type { ColorHistoryItem } from '../hooks/useColorHistory';
import type { HarmonyMode, HarmonyColor } from '../utils/colorHarmony';

export interface ControlPaneProps extends BridgeProps {
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

  // Color space
  shape: ColorSpace;

  // Main elements
  rgbMainElement: 'R' | 'G' | 'B';
  cmykMainElement: 'C' | 'M' | 'Y' | 'K';
  hslMainElement: 'H' | 'S' | 'L';
  hsbMainElement: 'H' | 'S' | 'V';
  labMainElement: 'L' | 'a' | 'b';
  lchMainElement: 'L' | 'C' | 'H';

  // Hex input
  hexInput: string;
  setHexInput: (value: string) => void;

  // Handlers
  handleLabel: () => void;
  handleClick: (r: number, g: number, b: number) => void;
  handleHsvElementClick: (h: number, s: number, v: number) => void;
  onShapeClick: (shape: ColorSpace) => void;
  onRgbChange: (event: ChangeEvent<HTMLInputElement>, colorParam: 'R' | 'G' | 'B') => void;
  onCmykChange: (
    event: ChangeEvent<HTMLInputElement>,
    colorParam: 'C' | 'M' | 'Y' | 'K'
  ) => void;
  onHslChange: (event: ChangeEvent<HTMLInputElement>, colorParam: 'H' | 'S' | 'L') => void;
  onHsvChange: (event: ChangeEvent<HTMLInputElement>, colorParam: 'H' | 'HsvS' | 'V') => void;
  onHexUpdate: () => void;

  // Setters
  setRgbMainElement: (symbol: 'R' | 'G' | 'B') => void;
  setCmykMainElement: (symbol: 'C' | 'M' | 'Y' | 'K') => void;
  setHslMainElement: (symbol: 'H' | 'S' | 'L') => void;
  setHsvMainElement: (symbol: 'H' | 'S' | 'V') => void;
  setLabMainElement: (symbol: 'L' | 'a' | 'b') => void;
  setLchMainElement: (symbol: 'L' | 'C' | 'H') => void;
  setFocusR: (value: number) => void;
  setFocusG: (value: number) => void;
  setFocusB: (value: number) => void;

  // Live preview callbacks (called during slider drag, before commit)
  onPreviewRgb?: (r: number, g: number, b: number) => void;
  onClearPreviewRgb?: () => void;

  // Help
  onHelpClick?: (topic: string) => void;

  // Panel navigation (incremented each time AI requests a specific panel)
  openCIEPanelSignal?: number;
}

export interface BridgeProps {
  bridgeColorA: { r: number; g: number; b: number };
  bridgeColorB: { r: number; g: number; b: number };
  onSetBridgeColorA: (c: { r: number; g: number; b: number }) => void;
  onSetBridgeColorB: (c: { r: number; g: number; b: number }) => void;
  isBridgeOpen: boolean;
  onBridgeOpenChange: (open: boolean) => void;
  isTwoDPickerOpen: boolean;
  onTwoDPickerOpenChange: (open: boolean) => void;
}

export interface ColorPanelProps {
  cssColorsEnabled: boolean;
  materialColorsEnabled: boolean;
  japaneseColorsEnabled: boolean;
  rgbGridColorsEnabled: boolean;
  onCssColorsToggle: (enabled: boolean) => void;
  onMaterialColorsToggle: (enabled: boolean) => void;
  onJapaneseColorsToggle: (enabled: boolean) => void;
  onRgbGridColorsToggle: (enabled: boolean) => void;
  colorHistory: ColorHistoryItem[];
  harmonyMode: HarmonyMode;
  onHarmonyModeChange: (mode: HarmonyMode) => void;
  harmonyColors: HarmonyColor[];
}

export interface SliderContainerProps {
  symbol: string;
  label?: string;
  value: number;
  max: number;
  color: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  mainElement: string;
  setMainElement: (symbol: 'R' | 'G' | 'B' | 'C' | 'M' | 'Y' | 'K' | 'H' | 'S' | 'L' | 'V') => void;
  shape: ColorSpace;
  panelShape: ColorSpace;
  onHelpClick?: (topic: string) => void;
  helpTopic?: string;
  onLiveDrag?: (value: number) => void;
  onDragEnd?: () => void;
}
