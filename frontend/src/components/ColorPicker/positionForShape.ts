import type { ColorSpace } from '../../types/color';
import type { PositionFunction } from '../../types/structure';

/** The position functions Structure passes down, one per color space shown in 3D */
export interface PositionFunctions {
  getRgbPosition: PositionFunction;
  getHslPosition: PositionFunction;
  getHsbPosition: PositionFunction;
  getMunsellPosition: PositionFunction; // LCH
  getLabPosition: PositionFunction;
  getOklabPosition: PositionFunction;
  getOklchPosition: PositionFunction;
  getLmsPosition: PositionFunction;
  getXyzPosition: PositionFunction;
  getXyzChromaticityPosition: PositionFunction;
  getXyChromaticityPosition: PositionFunction;
}

/** Where a color sits in the 3D view of the given color space */
export function positionForShape(
  { r, g, b }: { r: number; g: number; b: number },
  shape: ColorSpace,
  fns: PositionFunctions
): [number, number, number] {
  if (shape === 'HSL') return fns.getHslPosition(r, g, b);
  if (shape === 'HSB') return fns.getHsbPosition(r, g, b);
  if (shape === 'LCH') return fns.getMunsellPosition(r, g, b);
  if (shape === 'Lab') return fns.getLabPosition(r, g, b);
  if (shape === 'OKLAB') return fns.getOklabPosition(r, g, b);
  if (shape === 'OKLCH') return fns.getOklchPosition(r, g, b);
  if (shape === 'LMS') return fns.getLmsPosition(r, g, b);
  if (shape === 'XYZ') return fns.getXyzPosition(r, g, b);
  if (shape === 'xyz') return fns.getXyzChromaticityPosition(r, g, b);
  if (shape === 'xy') return fns.getXyChromaticityPosition(r, g, b);
  return fns.getRgbPosition(r, g, b);
}
