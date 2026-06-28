import { useState, useCallback } from 'react';

const HELP_TEXTS_EN: Record<string, string> = {
  color_harmony: 'What is Color Harmony?',
  color_history: 'What is Color History?',
  '1d_picker': 'What is the 1D Picker?',
  '2d_picker': 'What is the 2D Picker?',
  rgb: 'What is RGB?',
  cmyk: 'What is CMYK?',
  hsl: 'What is HSL?',
  hsb: 'What is HSB?',
  lab: 'What is the Lab color space?',
  lch: 'What is the LCH color space?',
  css_colors: 'What are CSS Named Colors?',
  material_colors: 'What are Material Colors?',
  spectral_colors: 'What is the Spectral Wheel?',
  japanese_colors: 'What are Japanese Traditional Colors?',
  rgb_grid: 'What is the RGB Cube Grid?',
  rgb_r: 'What is the R (Red) channel in RGB?',
  rgb_g: 'What is the G (Green) channel in RGB?',
  rgb_b: 'What is the B (Blue) channel in RGB?',
  hsl_h: 'What is H (Hue) in HSL?',
  hsl_s: 'What is S (Saturation) in HSL?',
  hsl_l: 'What is L (Lightness) in HSL?',
  hsb_h: 'What is H (Hue) in HSB?',
  hsb_s: 'What is S (Saturation) in HSB?',
  hsb_v: 'What is B (Brightness) in HSB?',
  cmyk_c: 'What is C (Cyan) in CMYK?',
  cmyk_m: 'What is M (Magenta) in CMYK?',
  cmyk_y: 'What is Y (Yellow) in CMYK?',
  cmyk_k: 'What is K (Black) in CMYK?',
  lab_l: 'What is L (Lightness) in Lab?',
  lab_a: 'What is the a (red-green) axis in Lab?',
  lab_b: 'What is the b (yellow-blue) axis in Lab?',
  lch_l: 'What is L (Lightness) in LCH?',
  lch_c: 'What is C (Chroma) in LCH?',
  lch_h: 'What is H (Hue) in LCH?',
  xyz_space: 'What is the XYZ color space?',
  cie_xy: 'What is the CIE chromaticity diagram?',
};

const HELP_TEXTS_JA: Record<string, string> = {
  color_harmony: 'Color Harmonyとは？',
  color_history: 'Color Historyとは？',
  '1d_picker': '1D Pickerとは？',
  '2d_picker': '2D Pickerとは？',
  rgb: 'RGBとは？',
  cmyk: 'CMYKとは？',
  hsl: 'HSLとは？',
  hsb: 'HSBとは？',
  lab: 'Lab色空間とは？',
  lch: 'LCH色空間とは？',
  css_colors: 'CSS Named Colorsとは？',
  material_colors: 'Material Colorsとは？',
  spectral_colors: 'Spectral Wheelとは？',
  japanese_colors: '日本の伝統色とは？',
  rgb_grid: 'RGB Cube Gridとは？',
  rgb_r: 'RGBのR（赤）チャンネルとは？',
  rgb_g: 'RGBのG（緑）チャンネルとは？',
  rgb_b: 'RGBのB（青）チャンネルとは？',
  hsl_h: 'HSLのH（色相）とは？',
  hsl_s: 'HSLのS（彩度）とは？',
  hsl_l: 'HSLのL（明度）とは？',
  hsb_h: 'HSBのH（色相）とは？',
  hsb_s: 'HSBのS（彩度）とは？',
  hsb_v: 'HSBのB（明度）とは？',
  cmyk_c: 'CMYKのC（シアン）とは？',
  cmyk_m: 'CMYKのM（マゼンタ）とは？',
  cmyk_y: 'CMYKのY（イエロー）とは？',
  cmyk_k: 'CMYKのK（ブラック）とは？',
  lab_l: 'LabのL（明度）とは？',
  lab_a: 'Labのa（赤緑軸）とは？',
  lab_b: 'Labのb（黄青軸）とは？',
  lch_l: 'LCHのL（明度）とは？',
  lch_c: 'LCHのC（彩度）とは？',
  lch_h: 'LCHのH（色相）とは？',
  xyz_space: 'XYZ色空間とは？',
  cie_xy: 'CIE色度図とは？',
};

export function useHelpRequest(language: string) {
  const [helpRequest, setHelpRequest] = useState<{ text: string; id: number } | null>(null);

  const handleHelpClick = useCallback(
    (topic: string) => {
      const isEn = language === 'en';
      const helpTexts = isEn ? HELP_TEXTS_EN : HELP_TEXTS_JA;
      const text = helpTexts[topic] ?? (isEn ? `What is ${topic}?` : `${topic}とは？`);
      setHelpRequest({ text, id: Date.now() });
    },
    [language]
  );

  return { helpRequest, handleHelpClick };
}
