import { useState } from 'react';

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export function useBridgeState(initialColorB: RgbColor) {
  const [bridgeColorA, setBridgeColorA] = useState<RgbColor>({ r: 255, g: 255, b: 255 });
  const [bridgeColorB, setBridgeColorB] = useState<RgbColor>(() => ({ ...initialColorB }));
  const [isBridgeOpen, setIsBridgeOpen] = useState(false);
  const [isTwoDPickerOpen, setIsTwoDPickerOpen] = useState(true);

  return {
    bridgeColorA,
    setBridgeColorA,
    bridgeColorB,
    setBridgeColorB,
    isBridgeOpen,
    setIsBridgeOpen,
    isTwoDPickerOpen,
    setIsTwoDPickerOpen,
  };
}
