import { isInGamut, labToRgb } from '../../utils/gamutUtils';

/**
 * Shared drawing for the Lab and LCH slides: the a*–b* plane cut at one lightness (only the
 * colors a screen can show) and the L* bar beside it. Coordinates are in the parent SVG's
 * viewBox units.
 */

export const rgb = (c: [number, number, number]) => `rgb(${c.join(',')})`;

// L* bar: 0 (black, bottom) to 100 (white, top)
export const L_BAR = { x: 30, w: 10, top: 22, bottom: 172 };
export const yOfL = (L: number) => L_BAR.bottom - (L / 100) * (L_BAR.bottom - L_BAR.top);

// The a*–b* plane, a* and b* from −100 to 100
export const SLICE_L = 60;
export const PLANE = { x0: 56, y0: 22, size: 150, range: 100 };
export const CENTER = { x: PLANE.x0 + PLANE.size / 2, y: PLANE.y0 + PLANE.size / 2 };
export const SCALE = PLANE.size / (2 * PLANE.range);
export const toPx = (a: number, b: number) => ({
  x: CENTER.x + a * SCALE,
  y: CENTER.y - b * SCALE,
});

const STEP_AB = 2.5;
const CELLS = (() => {
  const cells: Array<{ a: number; b: number; color: string }> = [];
  for (let a = -PLANE.range; a < PLANE.range; a += STEP_AB) {
    for (let b = -PLANE.range; b < PLANE.range; b += STEP_AB) {
      const ca = a + STEP_AB / 2;
      const cb = b + STEP_AB / 2;
      if (isInGamut(SLICE_L, ca, cb)) cells.push({ a, b, color: rgb(labToRgb(SLICE_L, ca, cb)) });
    }
  }
  return cells;
})();

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

/** The colors of the plane at L* = SLICE_L */
export const LabSliceColors = () => (
  <g>
    {CELLS.map((c) => {
      const p = toPx(c.a, c.b + STEP_AB);
      return (
        <rect
          key={`${c.a},${c.b}`}
          x={p.x}
          y={p.y}
          width={STEP_AB * SCALE + 0.4}
          height={STEP_AB * SCALE + 0.4}
          fill={c.color}
        />
      );
    })}
  </g>
);

/** The L* bar, with a marker and a dashed line to the plane at L* = SLICE_L */
export const LBar = ({ id }: { id: string }) => {
  const sliceY = yOfL(SLICE_L);
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0%" y1="100%" x2="0%" y2="0%">
          {[0, 25, 50, 75, 100].map((L) => (
            <stop key={L} offset={`${L}%`} stopColor={rgb(labToRgb(L, 0, 0))} />
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
        100
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
