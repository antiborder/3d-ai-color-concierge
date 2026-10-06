import { CONE_FUNDAMENTALS, coneResponse } from './coneFundamentals';

/**
 * Color matching functions derived from the cone fundamentals, shared by the color matching
 * experiment and XYZ slides. Rows follow CONE_FUNDAMENTALS (390–700 nm, 5 nm steps).
 */
export interface CmfRow {
  nm: number;
  /** The three curves' values at this wavelength */
  a: number[];
}

// RGB matching functions for the CIE 1931 RGB primaries (700, 546.1, 435.8 nm): the amounts a
// of the three primaries whose cone responses add up to those of each wavelength
// (P · a = LMS(λ)). Each curve is scaled to equal area, then all to a peak of 1.
const PRIMARY_NM = [700, 546.1, 435.8];
const det3 = (m: number[][]) =>
  m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
  m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
  m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
const PRIMARY_MATRIX = (() => {
  const p = PRIMARY_NM.map((nm) => coneResponse(nm));
  return [p.map((r) => r.L), p.map((r) => r.M), p.map((r) => r.S)];
})();
/** Solve PRIMARY_MATRIX · a = lms by Cramer's rule */
const solvePrimaries = (lms: number[]) => {
  const d = det3(PRIMARY_MATRIX);
  return [0, 1, 2].map(
    (j) => det3(PRIMARY_MATRIX.map((row, i) => row.map((v, c) => (c === j ? lms[i] : v)))) / d
  );
};
export const RGB_CMF: CmfRow[] = (() => {
  const raw = CONE_FUNDAMENTALS.map(([nm, l, m, s]) => ({ nm, a: solvePrimaries([l, m, s]) }));
  const areas = [0, 1, 2].map((j) => raw.reduce((sum, r) => sum + r.a[j], 0));
  const scaled = raw.map((r) => ({ nm: r.nm, a: r.a.map((v, j) => v / areas[j]) }));
  const max = Math.max(...scaled.flatMap((r) => r.a));
  return scaled.map((r) => ({ nm: r.nm, a: r.a.map((v) => v / max) }));
})();

// XYZ matching functions: the CIE 2006 (CIE 170-2) 2° matrix applied to the cone fundamentals,
// scaled to a peak of 1. Never negative, unlike the RGB ones.
export const LMS_TO_XYZ = [
  [1.94735469, -1.41445123, 0.36476327],
  [0.68990272, 0.34832189, 0],
  [0, 0, 1.93485343],
];
export const XYZ_CMF: CmfRow[] = (() => {
  const raw = CONE_FUNDAMENTALS.map(([nm, l, m, s]) => ({
    nm,
    a: LMS_TO_XYZ.map((row) => Math.max(0, row[0] * l + row[1] * m + row[2] * s)),
  }));
  const max = Math.max(...raw.flatMap((r) => r.a));
  return raw.map((r) => ({ nm: r.nm, a: r.a.map((v) => v / max) }));
})();
