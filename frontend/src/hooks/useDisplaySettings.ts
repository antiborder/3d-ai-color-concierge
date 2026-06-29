import { useState } from 'react';

export function useDisplaySettings() {
  const [cssColorsEnabled, setCssColorsEnabled] = useState(true);
  const [materialColorsEnabled, setMaterialColorsEnabled] = useState(true);
  const [japaneseColorsEnabled, setJapaneseColorsEnabled] = useState(false);
  const [rgbGridColorsEnabled, setRgbGridColorsEnabled] = useState(false);

  const setColorSets = (
    sets: Partial<Record<'css' | 'material' | 'japanese' | 'rgbGrid', boolean>>
  ) => {
    if (sets.css !== undefined) setCssColorsEnabled(sets.css);
    if (sets.material !== undefined) setMaterialColorsEnabled(sets.material);
    if (sets.japanese !== undefined) setJapaneseColorsEnabled(sets.japanese);
    if (sets.rgbGrid !== undefined) setRgbGridColorsEnabled(sets.rgbGrid);
  };

  return {
    cssColorsEnabled,
    setCssColorsEnabled,
    materialColorsEnabled,
    setMaterialColorsEnabled,
    japaneseColorsEnabled,
    setJapaneseColorsEnabled,
    rgbGridColorsEnabled,
    setRgbGridColorsEnabled,
    setColorSets,
  };
}
