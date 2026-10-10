import { computeHarmonyColors, type HarmonyMode } from '../../utils/colorHarmony';
import { maxInGamutChromaOklch, oklchToRgb, rgbToOklch } from '../../utils/gamutUtils';

/**
 * Shared drawing for the color harmony slides: an OkLCH hue ring with the base color (orange)
 * at the top, and the palettes the app's Color Harmony makes from it (computeHarmonyColors: the
 * hue turned in OkLCH, lightness kept), so a palette's colors land on the ring at its hues.
 * Coordinates are in the parent SVG's viewBox units.
 */

export type RGB = [number, number, number];
export const BASE: RGB = [255, 128, 0]; // orange
const BASE_HUE = rgbToOklch(...BASE)[2];
export const rgb = (c: RGB) => `rgb(${c.join(',')})`;

/** The base color and its harmony colors, in the order of computeHarmonyColors */
export const paletteOf = (mode: HarmonyMode): RGB[] => [
  BASE,
  ...computeHarmonyColors(...BASE, mode).map((c): RGB => [c.r, c.g, c.b]),
];

// The ring: OkLCH hues at one lightness, the base color's hue at the top, hues clockwise
export const RING = { cx: 115, cy: 100, outer: 68, inner: 46 };
export const VERTEX_R = (RING.outer + RING.inner) / 2;
const RING_L = 0.72;
export const pointAt = (hue: number, r: number) => {
  const a = ((hue - BASE_HUE - 90) * Math.PI) / 180;
  return { x: RING.cx + r * Math.cos(a), y: RING.cy + r * Math.sin(a) };
};

/** Where a palette's colors sit on the ring */
export const verticesOf = (palette: RGB[]) =>
  palette.map((c) => pointAt(rgbToOklch(...c)[2], VERTEX_R));

/** The palette's shape on the ring: a line for two colors, otherwise a closed polygon */
export const shapePathOf = (vertices: Array<{ x: number; y: number }>) =>
  'M' +
  vertices.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' L') +
  (vertices.length > 2 ? ' Z' : '');

const SEG_DEG = 5;
const SEGMENTS = Array.from({ length: 360 / SEG_DEG }, (_, i) => i * SEG_DEG).map((h) => {
  const h0 = h - SEG_DEG / 2 - 0.4;
  const h1 = h + SEG_DEG / 2 + 0.4;
  const [a, b, c, d] = [
    pointAt(h0, RING.outer),
    pointAt(h1, RING.outer),
    pointAt(h1, RING.inner),
    pointAt(h0, RING.inner),
  ].map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`);
  const color = rgb(oklchToRgb(RING_L, maxInGamutChromaOklch(RING_L, h) * 0.95, h));
  return {
    h,
    color,
    d: `M${a} A${RING.outer},${RING.outer} 0 0 1 ${b} L${c} A${RING.inner},${RING.inner} 0 0 0 ${d} Z`,
  };
});

/** The hue ring */
export const HueRing = () => (
  <g>
    {SEGMENTS.map((s) => (
      <path key={s.h} d={s.d} fill={s.color} />
    ))}
  </g>
);
