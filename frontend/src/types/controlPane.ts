import type { ColorSpace } from './color';

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
  hsvMainElement: 'H' | 'S' | 'V';

  // Hex input
  hexInput: string;
  setHexInput: (value: string) => void;

  // Handlers
  handleLabel: () => void;
  handleClick: (r: number, g: number, b: number) => void;
  handleHsvElementClick: (h: number, s: number, v: number) => void;
  onShapeClick: (shape: ColorSpace) => void;
  onRgbChange: (event: React.ChangeEvent<HTMLInputElement>, colorParam: 'R' | 'G' | 'B') => void;
  onCmykChange: (
    event: React.ChangeEvent<HTMLInputElement>,
    colorParam: 'C' | 'M' | 'Y' | 'K'
  ) => void;
  onHslChange: (event: React.ChangeEvent<HTMLInputElement>, colorParam: 'H' | 'S' | 'L') => void;
  onHsvChange: (event: React.ChangeEvent<HTMLInputElement>, colorParam: 'H' | 'HsvS' | 'V') => void;
  onHexUpdate: () => void;

  // Setters
  setRgbMainElement: (symbol: 'R' | 'G' | 'B') => void;
  setCmykMainElement: (symbol: 'C' | 'M' | 'Y' | 'K') => void;
  setHslMainElement: (symbol: 'H' | 'S' | 'L') => void;
  setHsvMainElement: (symbol: 'H' | 'S' | 'V') => void;
  setFocusR: (value: number) => void;
  setFocusG: (value: number) => void;
  setFocusB: (value: number) => void;

  // Help
  onHelpClick?: (topic: string) => void;
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

export interface SliderContainerProps {
  symbol: string;
  value: number;
  max: number;
  color: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  mainElement: string;
  setMainElement: (symbol: 'R' | 'G' | 'B' | 'C' | 'M' | 'Y' | 'K' | 'H' | 'S' | 'L' | 'V') => void;
  shape: ColorSpace;
  panelShape: ColorSpace;
  onHelpClick?: (topic: string) => void;
  helpTopic?: string;
}
