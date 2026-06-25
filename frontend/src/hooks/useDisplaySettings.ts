import { useState } from 'react';

export function useDisplaySettings() {
  const [cssColorsEnabled, setCssColorsEnabled] = useState(true);
  const [materialColorsEnabled, setMaterialColorsEnabled] = useState(true);
  const [spectral12ColorsEnabled, setSpectral12ColorsEnabled] = useState(false);
  const [japaneseColorsEnabled, setJapaneseColorsEnabled] = useState(false);
  const [rgbGridColorsEnabled, setRgbGridColorsEnabled] = useState(false);

  const setColorSets = (sets: Partial<Record<'css' | 'material' | 'spectral12' | 'japanese' | 'rgbGrid', boolean>>) => {
    if (sets.css !== undefined) setCssColorsEnabled(sets.css);
    if (sets.material !== undefined) setMaterialColorsEnabled(sets.material);
    if (sets.spectral12 !== undefined) setSpectral12ColorsEnabled(sets.spectral12);
    if (sets.japanese !== undefined) setJapaneseColorsEnabled(sets.japanese);
    if (sets.rgbGrid !== undefined) setRgbGridColorsEnabled(sets.rgbGrid);
  };

  return {
    cssColorsEnabled,
    setCssColorsEnabled,
    materialColorsEnabled,
    setMaterialColorsEnabled,
    spectral12ColorsEnabled,
    setSpectral12ColorsEnabled,
    japaneseColorsEnabled,
    setJapaneseColorsEnabled,
    rgbGridColorsEnabled,
    setRgbGridColorsEnabled,
    setColorSets,
  };
}
