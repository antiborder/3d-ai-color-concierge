import { CONE_COLORS, SPECTRUM_STOPS } from './ConeSensitivityChart';
import { CONE_FUNDAMENTALS, CONE_NM_MAX, CONE_NM_MIN } from './coneFundamentals';
import { draw, fade } from './slideAnimation';

/**
 * Building blocks for slides that draw an L/M/S cone sensitivity chart step by step:
 * the chart itself, a picked wavelength rising to the curves, and the responses read off
 * on the Y axes. Geometry is in the parent SVG's viewBox units.
 */

export type Cone = 'L' | 'M' | 'S';
export type Levels = Record<Cone, number>;
export const CONES: readonly Cone[] = ['L', 'M', 'S'];
const CONE_INDEX = { L: 1, M: 2, S: 3 } as const;

const BAND_HALF_WIDTH = 10;
export const X0 = 34;
export const X1 = 220;
// Plot right edge when there is a right Y axis, leaving room for its L/M/S letters
export const X1_WITH_RIGHT_AXIS = 212;
const PLOT_H = 70;
const MARK_LABEL_GAP = 12;
const PICK_COLOR = '#e0002a';

const xScale = (x1: number) => (nm: number) =>
  X0 + ((nm - CONE_NM_MIN) / (CONE_NM_MAX - CONE_NM_MIN)) * (x1 - X0);
const yOf = (v: number, yBase: number) => yBase - v * PLOT_H;

/** y of each cone's letter beside the Y axis, pushed apart so the letters never overlap */
const markLabelY = (levels: Levels, yBase: number): Levels => {
  const order = [...CONES].sort((a, b) => levels[b] - levels[a]);
  const ys = order.map((cone) => yOf(levels[cone], yBase));
  const spread = [...ys];
  for (let i = 1; i < spread.length; i++) {
    spread[i] = Math.max(spread[i], spread[i - 1] + MARK_LABEL_GAP);
  }
  const sum = (a: number[]) => a.reduce((s, v) => s + v, 0);
  const shift = (sum(ys) - sum(spread)) / ys.length;
  const out = { L: 0, M: 0, S: 0 };
  order.forEach((cone, i) => {
    out[cone] = spread[i] + shift;
  });
  return out;
};

interface Band {
  nm: number;
  color: string;
  label: string;
}

interface StagedChartProps {
  x1: number;
  yBase: number;
  idPrefix: string;
  bands: Band[];
  sensitivityLabel: string;
  wavelengthLabel: string;
  showFrame: boolean;
  showCurves: boolean;
  /** Also draw a Y axis (without ticks) on the right edge */
  rightAxis?: boolean;
}

/** Axes, spectrum bar and light bands first; the L/M/S sensitivity curves are drawn later. */
export const StagedChart = ({
  x1,
  yBase,
  idPrefix,
  bands,
  sensitivityLabel,
  wavelengthLabel,
  showFrame,
  showCurves,
  rightAxis = false,
}: StagedChartProps) => {
  const xOf = xScale(x1);
  const yTop = yBase - PLOT_H;
  const yMid = (yBase + yTop) / 2;
  const gradientId = `${idPrefix}-spectrum`;

  const curve = (cone: Cone) =>
    'M' +
    CONE_FUNDAMENTALS.map(
      (row) => `${xOf(row[0]).toFixed(1)},${yOf(row[CONE_INDEX[cone]], yBase).toFixed(1)}`
    ).join(' L');

  const peakNm = (cone: Cone) =>
    CONE_FUNDAMENTALS.reduce((best, row) =>
      row[CONE_INDEX[cone]] > best[CONE_INDEX[cone]] ? row : best
    )[0];

  return (
    <g>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          {SPECTRUM_STOPS.map(([nm, color]) => (
            <stop
              key={nm}
              offset={`${((nm - CONE_NM_MIN) / (CONE_NM_MAX - CONE_NM_MIN)) * 100}%`}
              stopColor={color}
            />
          ))}
        </linearGradient>
      </defs>

      <g style={fade(showFrame)}>
        {/* light bands (behind the curves) */}
        {bands.map((b) => (
          <g key={b.nm}>
            <rect
              x={xOf(b.nm - BAND_HALF_WIDTH)}
              y={yTop - 18}
              width={xOf(b.nm + BAND_HALF_WIDTH) - xOf(b.nm - BAND_HALF_WIDTH)}
              height={PLOT_H + 18}
              fill={b.color}
              opacity="0.18"
            />
            <text
              x={xOf(b.nm)}
              y={yTop - 22}
              textAnchor="middle"
              fontSize="13"
              fontWeight="bold"
              fill={b.color}
            >
              {b.label}
            </text>
          </g>
        ))}

        {/* axes */}
        <line x1={X0} y1={yBase} x2={x1} y2={yBase} stroke="#888" strokeWidth="1" />
        <line x1={X0} y1={yBase} x2={X0} y2={yTop - 6} stroke="#888" strokeWidth="1" />
        {rightAxis && (
          <line x1={x1} y1={yBase} x2={x1} y2={yTop - 6} stroke="#888" strokeWidth="1" />
        )}
        <text
          x={X0 - 24}
          y={yMid}
          textAnchor="middle"
          fontSize="13"
          fill="#555"
          transform={`rotate(-90, ${X0 - 24}, ${yMid})`}
        >
          {sensitivityLabel}
        </text>

        {/* wavelength axis with the visible spectrum */}
        <rect x={X0} y={yBase + 4} width={x1 - X0} height="8" fill={`url(#${gradientId})`} />
        {[400, 500, 600, 700].map((nm) => (
          <text key={nm} x={xOf(nm)} y={yBase + 26} textAnchor="middle" fontSize="12" fill="#666">
            {nm}
          </text>
        ))}
        <text x={x1} y={yBase + 42} textAnchor="end" fontSize="13" fill="#555">
          {wavelengthLabel}
        </text>
      </g>

      {/* cone curves, with the cone letter above each peak */}
      {(['S', 'M', 'L'] as const).map((cone) => (
        <g key={cone}>
          <path
            d={curve(cone)}
            pathLength={1}
            fill="none"
            stroke={CONE_COLORS[cone]}
            strokeWidth="1.25"
            style={draw(showCurves, 0, 1800)}
          />
          <text
            x={xOf(peakNm(cone)) + (cone === 'M' ? -6 : cone === 'L' ? 6 : 0)}
            y={yTop - 6}
            textAnchor="middle"
            fontSize="13"
            fontWeight="bold"
            fill={CONE_COLORS[cone]}
            style={fade(showCurves, 1200)}
          >
            {cone}
          </text>
        </g>
      ))}
    </g>
  );
};

interface PickedLightProps {
  x1: number;
  nm: number;
  yBase: number;
  hits: Levels;
  circled: boolean;
  raised: boolean;
}

/** Red circle on the spectrum bar, a line rising from it, and dots where it meets the curves. */
export const PickedLight = ({ x1, nm, yBase, hits, circled, raised }: PickedLightProps) => {
  const x = xScale(x1)(nm);
  const top = Math.max(hits.L, hits.M, hits.S);
  return (
    <g>
      <circle
        cx={x}
        cy={yBase + 8}
        r="7"
        fill="none"
        stroke={PICK_COLOR}
        strokeWidth="2"
        style={fade(circled)}
      />
      <path
        d={`M${x},${yBase} L${x},${yOf(top, yBase)}`}
        pathLength={1}
        fill="none"
        stroke="#555"
        strokeWidth="1.2"
        style={draw(raised, 500)}
      />
      {CONES.map((cone) => (
        <circle
          key={cone}
          cx={x}
          cy={yOf(hits[cone], yBase)}
          r="2.8"
          fill={CONE_COLORS[cone]}
          stroke="#fff"
          strokeWidth="0.8"
          style={fade(raised, 1300)}
        />
      ))}
    </g>
  );
};

interface ResponseMarksProps {
  /** x of the Y axis; on the right axis (x > X0) the letters go to its right, without ticks */
  axisX: number;
  levels: Levels;
  yBase: number;
  visible: boolean;
  delayMs?: number;
}

/** L/M/S ticks and letters on a Y axis at each cone's response. */
export const ResponseMarks = ({
  axisX,
  levels,
  yBase,
  visible,
  delayMs = 0,
}: ResponseMarksProps) => {
  const labelY = markLabelY(levels, yBase);
  const isRight = axisX > X0;
  return (
    <g style={fade(visible, delayMs)}>
      {CONES.map((cone) => {
        const y = yOf(levels[cone], yBase);
        return (
          <g key={cone}>
            {!isRight && (
              <line
                x1={axisX - 4}
                y1={y}
                x2={axisX + 4}
                y2={y}
                stroke={CONE_COLORS[cone]}
                strokeWidth="3"
              />
            )}
            <text
              x={isRight ? axisX + 9 : axisX - 10}
              y={labelY[cone] + 4.5}
              textAnchor="middle"
              fontSize="13"
              fontWeight="bold"
              fill={CONE_COLORS[cone]}
            >
              {cone}
            </text>
          </g>
        );
      })}
    </g>
  );
};

interface LevelLinesProps {
  x1: number;
  levels: Levels;
  /** Wavelength each cone's line starts from, before running horizontally to the Y axis */
  fromNm: Record<Cone, number>;
  /** x of the Y axis the lines run to (left or right) */
  axisX: number;
  yBase: number;
  visible: boolean;
  delayMs?: number;
}

/** Horizontal lines running to a Y axis at each cone's response. */
export const LevelLines = ({
  x1,
  levels,
  fromNm,
  axisX,
  yBase,
  visible,
  delayMs = 0,
}: LevelLinesProps) => (
  <g style={fade(visible, delayMs)}>
    {CONES.map((cone) => {
      const y = yOf(levels[cone], yBase);
      return (
        <path
          key={cone}
          d={`M${xScale(x1)(fromNm[cone])},${y} L${axisX},${y}`}
          pathLength={1}
          fill="none"
          stroke={CONE_COLORS[cone]}
          strokeWidth="1.5"
          style={draw(visible, delayMs)}
        />
      );
    })}
  </g>
);
