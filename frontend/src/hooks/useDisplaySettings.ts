import { useState } from 'react';

function detectInitialLanguage(): string {
  const urlLang = new URLSearchParams(window.location.search).get('lang');
  if (urlLang === 'ja' || urlLang === 'en') return urlLang;
  const stored = localStorage.getItem('i18nextLng') ?? '';
  if (stored.startsWith('ja')) return 'ja';
  return 'en';
}

export function useDisplaySettings() {
  const isJa = detectInitialLanguage() === 'ja';
  const [cssColorsEnabled, setCssColorsEnabled] = useState(!isJa);
  const [materialColorsEnabled, setMaterialColorsEnabled] = useState(!isJa);
  const [japaneseColorsEnabled, setJapaneseColorsEnabled] = useState(isJa);
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
