import { LOCUS } from '../../constants/cieLocus';

/**
 * Shared drawing helpers for the CIE 1931 xy chromaticity diagram slides
 * (chromaticity diagram, colors a screen can show, colors humans can perceive).
 * Coordinates are in the parent SVG's viewBox units.
 */

// Plot: x 0–0.8 across, y 0–0.9 up
export const PLOT = { x0: 34, y0: 200, scale: 210, xMax: 0.8, yMax: 0.9 };
export const toPx = (x: number, y: number) => ({
  x: PLOT.x0 + x * PLOT.scale,
  y: PLOT.y0 - y * PLOT.scale,
});
const xy = (x: number, y: number) => {
  const p = toPx(x, y);
  return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
};

/** The horseshoe: the spectral locus, closed by the straight line of purples */
export const LOCUS_PATH = 'M' + LOCUS.map(([, x, y]) => xy(x, y)).join(' L') + ' Z';
/** The line of purples, from the violet end (380 nm) to the red end (700 nm) */
export const PURPLE_LINE = (() => {
  const [, x1, y1] = LOCUS[0];
  const [, x2, y2] = LOCUS[LOCUS.length - 1];
  return `M${xy(x1, y1)} L${xy(x2, y2)}`;
})();
export const locusPoint = (nm: number) => {
  const row = LOCUS.find(([n]) => n === nm);
  if (!row) throw new Error(`No locus point at ${nm} nm`);
  return { x: row[1], y: row[2] };
};

// Display gamuts (CIE 1931 xy of their red, green and blue primaries) and the D65 white point
export const SRGB = { r: [0.64, 0.33], g: [0.3, 0.6], b: [0.15, 0.06] } as const;
export const DISPLAY_P3 = { r: [0.68, 0.32], g: [0.265, 0.69], b: [0.15, 0.06] } as const;
export const WHITE_D65 = [0.3127, 0.329] as const;
export const trianglePath = (t: {
  r: readonly number[];
  g: readonly number[];
  b: readonly number[];
}) => `M${xy(t.r[0], t.r[1])} L${xy(t.g[0], t.g[1])} L${xy(t.b[0], t.b[1])} Z`;

/** Display color for a chromaticity: XYZ at Y = 1 → linear sRGB, clipped and brightened */
const chromaticityColor = (x: number, y: number) => {
  const X = x / y;
  const Z = (1 - x - y) / y;
  const lin = [
    3.2406 * X - 1.5372 - 0.4986 * Z,
    -0.9689 * X + 1.8758 + 0.0415 * Z,
    0.0557 * X - 0.204 + 1.057 * Z,
  ].map((v) => Math.max(0, v));
  const max = Math.max(...lin);
  const gamma = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
  return `rgb(${lin.map((v) => Math.round(gamma(v / max) * 255)).join(',')})`;
};

const STEP = 0.01;
const CELLS = (() => {
  const cells: Array<{ x: number; y: number; color: string }> = [];
  for (let x = 0; x < PLOT.xMax; x += STEP) {
    for (let y = 0.005; y < PLOT.yMax; y += STEP) {
      cells.push({ x, y, color: chromaticityColor(x + STEP / 2, y + STEP / 2) });
    }
  }
  return cells;
})();

/** The horseshoe filled with its colors (clipped to the locus) */
export const ChromaticityFill = ({ id, opacity = 1 }: { id: string; opacity?: number }) => {
  const cell = STEP * PLOT.scale + 0.4;
  return (
    <g opacity={opacity}>
      <defs>
        <clipPath id={`${id}-locus`}>
          <path d={LOCUS_PATH} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-locus)`}>
        {CELLS.map((c) => {
          const p = toPx(c.x, c.y + STEP);
          return (
            <rect
              key={`${c.x.toFixed(2)}-${c.y.toFixed(3)}`}
              x={p.x}
              y={p.y}
              width={cell}
              height={cell}
              fill={c.color}
            />
          );
        })}
      </g>
    </g>
  );
};

/** x and y axes with a few ticks */
export const ChromaticityAxes = () => (
  <g>
    <line
      x1={PLOT.x0}
      y1={PLOT.y0}
      x2={toPx(PLOT.xMax, 0).x}
      y2={PLOT.y0}
      stroke="#888"
      strokeWidth="1"
    />
    <line
      x1={PLOT.x0}
      y1={PLOT.y0}
      x2={PLOT.x0}
      y2={toPx(0, PLOT.yMax).y}
      stroke="#888"
      strokeWidth="1"
    />
    {[0.2, 0.4, 0.6].map((v) => (
      <g key={v}>
        <text x={toPx(v, 0).x} y={PLOT.y0 + 12} textAnchor="middle" fontSize="11" fill="#666">
          {v}
        </text>
        <text x={PLOT.x0 - 4} y={toPx(0, v).y + 4} textAnchor="end" fontSize="11" fill="#666">
          {v}
        </text>
      </g>
    ))}
    <text x={toPx(PLOT.xMax, 0).x} y={PLOT.y0 - 4} textAnchor="end" fontSize="13" fill="#555">
      x
    </text>
    <text x={PLOT.x0 - 6} y={toPx(0, 0.76).y} textAnchor="end" fontSize="13" fill="#555">
      y
    </text>
  </g>
);

/** Wavelength labels just outside the horseshoe */
export const LOCUS_LABELS: Array<{ nm: number; dx: number; dy: number; anchor: 'start' | 'end' }> =
  [
    { nm: 460, dx: -4, dy: 10, anchor: 'end' },
    { nm: 490, dx: -5, dy: 4, anchor: 'end' },
    { nm: 520, dx: -4, dy: -4, anchor: 'end' },
    { nm: 560, dx: 6, dy: -2, anchor: 'start' },
    { nm: 600, dx: 6, dy: 0, anchor: 'start' },
    { nm: 700, dx: 6, dy: 4, anchor: 'start' },
  ];
