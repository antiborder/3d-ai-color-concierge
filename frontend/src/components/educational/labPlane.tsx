import { isInGamut, isInGamutOklab, labToRgb, oklabToRgb } from '../../utils/gamutUtils';

/**
 * Shared drawing for the Lab, LCH, OKLab and OKLCH slides: the a–b plane cut at one lightness
 * (only the colors a screen can show) and the Lightness bar beside it. Coordinates are in the
 * parent SVG's viewBox units. Lab (the default) and OKLab differ only in their scales and
 * conversions, so each component takes the space to draw.
 */

type RGB = [number, number, number];
export const rgb = (c: RGB) => `rgb(${c.join(',')})`;

export interface PlaneSpace {
  /** a and b run from −range to range */
  range: number;
  /** L at the top of the Lightness bar (L runs from 0 to lMax) */
  lMax: number;
  /** The lightness the plane is cut at */
  sliceL: number;
  /** Plane cell size in a/b units */
  cell: number;
  toRgb: (L: number, a: number, b: number) => RGB;
  inGamut: (L: number, a: number, b: number) => boolean;
}
export const LAB: PlaneSpace = {
  range: 100,
  lMax: 100,
  sliceL: 60,
  cell: 2.5,
  toRgb: labToRgb,
  inGamut: isInGamut,
};
export const OKLAB: PlaneSpace = {
  range: 0.3,
  lMax: 1,
  sliceL: 0.7,
  cell: 0.01,
  toRgb: oklabToRgb,
  inGamut: isInGamutOklab,
};

// The Lightness bar: 0 (black, bottom) to lMax (white, top)
export const L_BAR = { x: 30, w: 10, top: 22, bottom: 172 };
const yOfL = (space: PlaneSpace, L: number) =>
  L_BAR.bottom - (L / space.lMax) * (L_BAR.bottom - L_BAR.top);

// The a–b plane
export const PLANE = { x0: 56, y0: 22, size: 150 };
export const CENTER = { x: PLANE.x0 + PLANE.size / 2, y: PLANE.y0 + PLANE.size / 2 };
export const scaleOf = (space: PlaneSpace) => PLANE.size / (2 * space.range);
export const toPxIn = (space: PlaneSpace, a: number, b: number) => ({
  x: CENTER.x + a * scaleOf(space),
  y: CENTER.y - b * scaleOf(space),
});
// Lab's, for the Lab and LCH slides
export const SLICE_L = LAB.sliceL;
export const SCALE = scaleOf(LAB);
export const toPx = (a: number, b: number) => toPxIn(LAB, a, b);

const cellsCache = new Map<PlaneSpace, Array<{ a: number; b: number; color: string }>>();
const cellsOf = (space: PlaneSpace) => {
  const cached = cellsCache.get(space);
  if (cached) return cached;
  const cells: Array<{ a: number; b: number; color: string }> = [];
  const n = Math.round((2 * space.range) / space.cell);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const a = -space.range + i * space.cell;
      const b = -space.range + j * space.cell;
      const ca = a + space.cell / 2;
      const cb = b + space.cell / 2;
      if (space.inGamut(space.sliceL, ca, cb)) {
        cells.push({ a, b, color: rgb(space.toRgb(space.sliceL, ca, cb)) });
      }
    }
  }
  cellsCache.set(space, cells);
  return cells;
};

/** The plane's frame (gray where a screen can't show the color) */
export const LabPlaneFrame = () => (
  <rect
    x={PLANE.x0}
    y={PLANE.y0}
    width={PLANE.size}
    height={PLANE.size}
    fill="#eceef3"
    stroke="#ccc"
  />
);

/** The colors of the plane at its slice lightness */
export const LabSliceColors = ({ space = LAB }: { space?: PlaneSpace }) => {
  const size = space.cell * scaleOf(space) + 0.4;
  return (
    <g>
      {cellsOf(space).map((c) => {
        const p = toPxIn(space, c.a, c.b + space.cell);
        return (
          <rect
            key={`${c.a.toFixed(4)},${c.b.toFixed(4)}`}
            x={p.x}
            y={p.y}
            width={size}
            height={size}
            fill={c.color}
          />
        );
      })}
    </g>
  );
};

/** The Lightness bar, with a marker and a dashed line to the plane at the slice lightness */
export const LBar = ({ id, space = LAB }: { id: string; space?: PlaneSpace }) => {
  const sliceY = yOfL(space, space.sliceL);
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0%" y1="100%" x2="0%" y2="0%">
          {[0, 0.25, 0.5, 0.75, 1].map((f) => (
            <stop
              key={f}
              offset={`${f * 100}%`}
              stopColor={rgb(space.toRgb(f * space.lMax, 0, 0))}
            />
          ))}
        </linearGradient>
      </defs>
      <text x="8" y={L_BAR.top - 7} fontSize="13" fill="#333">
        <tspan fontWeight="bold">L</tspan>ightness
      </text>
      <rect
        x={L_BAR.x}
        y={L_BAR.top}
        width={L_BAR.w}
        height={L_BAR.bottom - L_BAR.top}
        fill={`url(#${id})`}
        stroke="#ccc"
      />
      <text x={L_BAR.x - 4} y={L_BAR.top + 9} textAnchor="end" fontSize="12" fill="#555">
        {space.lMax}
      </text>
      <text x={L_BAR.x - 4} y={L_BAR.bottom} textAnchor="end" fontSize="12" fill="#555">
        0
      </text>
      <path d={`M${L_BAR.x + L_BAR.w + 1},${sliceY} l7,-5 v10 Z`} fill="#333" />
      <line
        x1={L_BAR.x + L_BAR.w + 8}
        y1={sliceY}
        x2={PLANE.x0}
        y2={sliceY}
        stroke="#333"
        strokeWidth="1"
        strokeDasharray="2 2"
      />
    </g>
  );
};
