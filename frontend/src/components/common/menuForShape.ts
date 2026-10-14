import type { ColorSpace } from '../../types/color';

/** The left-pane menu that holds each color space's panel (where its 1D picker is shown too). */
export type ShapeMenu = 'sliders' | 'labLch' | 'oklab' | 'cie';

export function menuForShape(shape: ColorSpace): ShapeMenu {
  if (shape === 'Lab' || shape === 'LCH') return 'labLch';
  if (shape === 'OKLAB' || shape === 'OKLCH' || shape === 'LMS') return 'oklab';
  if (shape === 'XYZ' || shape === 'xyz' || shape === 'xy') return 'cie';
  return 'sliders';
}
