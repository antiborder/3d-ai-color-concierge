import { useTranslation } from 'react-i18next';
import { SPECTRUM_STOPS } from '../ConeSensitivityChart';
import { CONE_FUNDAMENTALS, CONE_NM_MAX, CONE_NM_MIN, coneResponse } from '../coneFundamentals';
import { draw, fade, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/color_matching_experiment.py).
 */
const STEP = {
  field: 0, // "A color matching experiment puts a target color next to a mix of three lights."
  adjust1: 1, // "You adjust the strength of the three lights to find where the two look the same."
  adjust2: 2,
  adjust3: 3,
  matched: 4,
  record: 5, // "You record how much of each light it took when they looked the same."
  functions: 6, // "Doing this for every wavelength and graphing it gives the color matching functions."
  negative: 7, // "For some wavelengths red has to be negative: red light was added to the target side."
  xyz: 8, // "The XYZ color space was built from these results."
} as const;
const STEP_AT_MS = [0, 5500, 7000, 8500, 10000, 11000, 14500, 19000, 27000];

// Two rounded panels: the experiment (top) and its result, the color matching functions (bottom)
const TOP_PANEL = { y: 0, height: 150 };
const BOTTOM_PANEL = { y: 158, height: 162 };

// Top: split field (target on the left, mix on the right) and three sliders
const FIELD = { cx: 58, cy: 70, r: 38 };
const TARGET_COLOR = '#ffd800'; // about 580 nm
// The two labels under the field sit this far left/right of its center, so they never touch
const LABEL_OFFSET = 30;
const SLIDER = { labelX: 140, x0: 152, x1: 214, rows: [44, 72, 100] };
const LIGHTS = [
  { key: 'red', color: '#e01a00' },
  { key: 'green', color: '#00a848' },
  { key: 'blue', color: '#2a5cff' },
] as const;
// Slider positions (red, green, blue) while the viewer searches; the last one matches the target
const SEARCH: Array<[number, number, number]> = [
  [0.2, 0.2, 0.2],
  [0.6, 0.3, 0.4],
  [0.9, 0.5, 0.2],
  [1.0, 0.95, 0.05],
  [1.0, 0.85, 0],
];

// Bottom: color matching functions for the CIE 1931 RGB primaries (700, 546.1, 435.8 nm),
// computed from the cone fundamentals: the amounts a of the three primaries whose cone
// responses add up to those of each wavelength (P · a = LMS(λ)), each curve scaled to equal area.
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
const CMF = (() => {
  const raw = CONE_FUNDAMENTALS.map(([nm, l, m, s]) => ({ nm, a: solvePrimaries([l, m, s]) }));
  const areas = [0, 1, 2].map((j) => raw.reduce((sum, r) => sum + r.a[j], 0));
  const scaled = raw.map((r) => ({ nm: r.nm, a: r.a.map((v, j) => v / areas[j]) }));
  const max = Math.max(...scaled.flatMap((r) => r.a));
  return scaled.map((r) => ({ nm: r.nm, a: r.a.map((v) => v / max) }));
})();

const CHART = { x0: 34, x1: 218, zeroY: 262, height: 70 };
const xOf = (nm: number) =>
  CHART.x0 + ((nm - CONE_NM_MIN) / (CONE_NM_MAX - CONE_NM_MIN)) * (CHART.x1 - CHART.x0);
const yOf = (v: number) => CHART.zeroY - v * CHART.height;
const MIN_R = Math.min(...CMF.map((r) => r.a[0]));
const SPECTRUM_Y = CHART.zeroY - MIN_R * CHART.height + 4;

const curvePath = (j: number) =>
  'M' + CMF.map((r) => `${xOf(r.nm).toFixed(1)},${yOf(r.a[j]).toFixed(1)}`).join(' L');
/** Area between the red curve and zero where the red amount is negative */
const negativeRedPath = () => {
  const neg = CMF.filter((r) => r.a[0] < 0);
  const first = neg[0].nm;
  const last = neg[neg.length - 1].nm;
  return (
    `M${xOf(first).toFixed(1)},${CHART.zeroY} ` +
    neg.map((r) => `L${xOf(r.nm).toFixed(1)},${yOf(r.a[0]).toFixed(1)}`).join(' ') +
    ` L${xOf(last).toFixed(1)},${CHART.zeroY} Z`
  );
};
const peakOf = (j: number) => CMF.reduce((best, r) => (r.a[j] > best.a[j] ? r : best));

const ColorMatchingExperiment = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.color_matching_experiment.${key}`);
  const step = useSlideStep(STEP_AT_MS);

  const search = SEARCH[Math.min(Math.max(step, 0), STEP.matched)];
  const mixColor = `rgb(${search.map((v) => Math.round(v * 255)).join(',')})`;
  const curveLabels = [
    { j: 0, dx: 8, dy: 4, anchor: 'start' as const },
    { j: 1, dx: 0, dy: -6, anchor: 'middle' as const },
    { j: 2, dx: 8, dy: 4, anchor: 'start' as const },
  ];

  return (
    <div style={{ padding: '12px 8px', fontFamily: 'sans-serif' }}>
      <h3 style={{ margin: '0 0 8px', fontSize: '19px', fontWeight: 700, textAlign: 'center' }}>
        {k('title')}
      </h3>

      <svg
        viewBox="0 0 230 320"
        width="100%"
        style={{ display: 'block', maxWidth: '260px', margin: '0 auto' }}
      >
        <defs>
          <linearGradient id="colorMatchingSpectrum" x1="0%" y1="0%" x2="100%" y2="0%">
            {SPECTRUM_STOPS.map(([nm, color]) => (
              <stop
                key={nm}
                offset={`${((nm - CONE_NM_MIN) / (CONE_NM_MAX - CONE_NM_MIN)) * 100}%`}
                stopColor={color}
              />
            ))}
          </linearGradient>
        </defs>
        {[TOP_PANEL, BOTTOM_PANEL].map((panel) => (
          <rect
            key={panel.y}
            x="0"
            y={panel.y}
            width="230"
            height={panel.height}
            rx="8"
            fill="#f7f8fb"
          />
        ))}

        {/* ── top: target color vs a mix of three lights ── */}
        <g style={fade(step >= STEP.field)}>
          <path
            d={`M${FIELD.cx},${FIELD.cy - FIELD.r} A${FIELD.r},${FIELD.r} 0 0 0 ${FIELD.cx},${FIELD.cy + FIELD.r} Z`}
            fill={TARGET_COLOR}
          />
          <path
            d={`M${FIELD.cx},${FIELD.cy - FIELD.r} A${FIELD.r},${FIELD.r} 0 0 1 ${FIELD.cx},${FIELD.cy + FIELD.r} Z`}
            style={{ fill: mixColor, transition: 'fill 1200ms ease' }}
          />
          <circle
            cx={FIELD.cx}
            cy={FIELD.cy}
            r={FIELD.r}
            fill="none"
            stroke="#999"
            strokeWidth="1"
          />
          <line
            x1={FIELD.cx}
            y1={FIELD.cy - FIELD.r}
            x2={FIELD.cx}
            y2={FIELD.cy + FIELD.r}
            stroke="#999"
            strokeWidth="1"
          />
          <text
            x={FIELD.cx - LABEL_OFFSET}
            y={FIELD.cy + FIELD.r + 18}
            textAnchor="middle"
            fontSize="13"
            fill="#555"
          >
            {k('target')}
          </text>
          <text
            x={FIELD.cx + LABEL_OFFSET}
            y={FIELD.cy + FIELD.r + 18}
            textAnchor="middle"
            fontSize="13"
            fill="#555"
          >
            {k('mix')}
          </text>

          {LIGHTS.map((light, i) => {
            const y = SLIDER.rows[i];
            const width = SLIDER.x1 - SLIDER.x0;
            return (
              <g key={light.key}>
                <text
                  x={SLIDER.labelX}
                  y={y + 5}
                  textAnchor="end"
                  fontSize="13"
                  fontWeight="bold"
                  fill={light.color}
                >
                  {k(light.key)}
                </text>
                <line
                  x1={SLIDER.x0}
                  y1={y}
                  x2={SLIDER.x1}
                  y2={y}
                  stroke="#ccc"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <line
                  x1={SLIDER.x0}
                  y1={y}
                  x2={SLIDER.x1}
                  y2={y}
                  stroke={light.color}
                  strokeWidth="4"
                  strokeLinecap="round"
                  style={{
                    transform: `scaleX(${Math.max(search[i], 0.001)})`,
                    transformOrigin: `${SLIDER.x0}px ${y}px`,
                    transition: 'transform 1200ms ease',
                  }}
                />
                <g
                  style={{
                    transform: `translateX(${search[i] * width}px)`,
                    transition: 'transform 1200ms ease',
                  }}
                >
                  <circle
                    cx={SLIDER.x0}
                    cy={y}
                    r="6"
                    fill="#fff"
                    stroke={light.color}
                    strokeWidth="2"
                  />
                </g>
              </g>
            );
          })}
        </g>
        <text
          x={FIELD.cx}
          y={FIELD.cy - FIELD.r - 10}
          textAnchor="middle"
          fontSize="13"
          fontWeight="bold"
          fill="#1a8a3a"
          style={fade(step >= STEP.record)}
        >
          {k('matched')}
        </text>

        {/* ── bottom: color matching functions ── */}
        <g style={fade(step >= STEP.functions)}>
          <text x="12" y={BOTTOM_PANEL.y + 18} fontSize="13" fontWeight="bold" fill="#333">
            {k('functions')}
          </text>
          <line
            x1={CHART.x0}
            y1={CHART.zeroY}
            x2={CHART.x1}
            y2={CHART.zeroY}
            stroke="#888"
            strokeWidth="1"
          />
          <line
            x1={CHART.x0}
            y1={SPECTRUM_Y - 4}
            x2={CHART.x0}
            y2={yOf(1) - 6}
            stroke="#888"
            strokeWidth="1"
          />
          <text x={CHART.x0 - 6} y={CHART.zeroY + 4} textAnchor="end" fontSize="12" fill="#666">
            0
          </text>
          <text
            x="14"
            y={yOf(0.5)}
            textAnchor="middle"
            fontSize="13"
            fill="#555"
            transform={`rotate(-90, 14, ${yOf(0.5)})`}
          >
            {k('amount')}
          </text>
          <rect
            x={CHART.x0}
            y={SPECTRUM_Y}
            width={CHART.x1 - CHART.x0}
            height="8"
            fill="url(#colorMatchingSpectrum)"
          />
          {[400, 500, 600, 700].map((nm) => (
            <text
              key={nm}
              x={xOf(nm)}
              y={SPECTRUM_Y + 22}
              textAnchor="middle"
              fontSize="12"
              fill="#666"
            >
              {nm}
            </text>
          ))}
        </g>

        {/* red's negative part */}
        <g style={fade(step >= STEP.negative)}>
          <path d={negativeRedPath()} fill={LIGHTS[0].color} opacity="0.25" />
          <text
            x={xOf(CMF.filter((r) => r.a[0] < 0).slice(-1)[0].nm) + 4}
            y={CHART.zeroY + 13}
            fontSize="13"
            fontWeight="bold"
            fill={LIGHTS[0].color}
          >
            {k('negative')}
          </text>
        </g>

        {LIGHTS.map((light, j) => (
          <path
            key={light.key}
            d={curvePath(j)}
            pathLength={1}
            fill="none"
            stroke={light.color}
            strokeWidth="1.5"
            style={draw(step >= STEP.functions, 400, 1800)}
          />
        ))}
        {curveLabels.map(({ j, dx, dy, anchor }) => {
          const peak = peakOf(j);
          return (
            <text
              key={j}
              x={xOf(peak.nm) + dx}
              y={yOf(peak.a[j]) + dy}
              textAnchor={anchor}
              fontSize="13"
              fontWeight="bold"
              fill={LIGHTS[j].color}
              style={fade(step >= STEP.functions, 1800)}
            >
              {k(LIGHTS[j].key)}
            </text>
          );
        })}

        <text
          x="218"
          y={BOTTOM_PANEL.y + 18}
          textAnchor="end"
          fontSize="13"
          fontWeight="bold"
          fill="#555"
          style={fade(step >= STEP.xyz)}
        >
          {k('toXyz')}
        </text>
      </svg>
    </div>
  );
};

export default ColorMatchingExperiment;
