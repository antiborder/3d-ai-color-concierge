import { useTranslation } from 'react-i18next';
import { SPECTRUM_STOPS } from '../ConeSensitivityChart';
import { XYZ_CMF } from '../colorMatchingFunctions';
import { CONE_NM_MAX, CONE_NM_MIN } from '../coneFundamentals';
import { draw, fade, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/xyz_space.py); each step starts on the word in [ ].
 */
const STEP = {
  frame: 0, // "[XYZ色空間は]、"
  cie: 1, // "[国際照明委員会]が1931年に定めた、色を表す世界共通の基準です。"
  curves: 2, // "光の色を、この[3本]の曲線で"
  labelX: 3, // "測った[X]・"
  labelY: 4, // "[Y]・"
  labelZ: 5, // "[Z]の3つの値で表します。"
  positive: 6, // "曲線は等色実験をもとに、[マイナス]にならないよう作られています。"
  brightness: 7, // "[特に]Yは、人が感じる明るさを表します。"
  hub: 8, // "XYZは[機器に]よらないので、"
  rgb: 9, // "[画面の]RGBなど"
  others: 10, // "[多くの]色空間が、XYZを基準に定義されています。"
} as const;
// When each step's words are spoken, counted from when the slide appears. Estimated from the
// reading (kana) of the Japanese narration at 8 morae/s, with pauses at 、(0.25 s) ・(0.15 s)
// 。(0.5 s) and 0.6 s before speech starts — calibrated on the hand-tuned RGB slide.
const STEP_AT_MS = [600, 2800, 11600, 12800, 14000, 14400, 19500, 22400, 27400, 28800, 30400];

// Two rounded panels: the X, Y, Z curves (top), XYZ as the common reference (bottom)
const TOP_PANEL = { y: 0, height: 195 };
const BOTTOM_PANEL = { y: 203, height: 107 };

// The x̄, ȳ, z̄ curves (see colorMatchingFunctions); they have the same roles as the 1931 ones
const CHART = { x0: 34, x1: 218, yBase: 148, height: 100 };
const xOf = (nm: number) =>
  CHART.x0 + ((nm - CONE_NM_MIN) / (CONE_NM_MAX - CONE_NM_MIN)) * (CHART.x1 - CHART.x0);
const yOf = (v: number) => CHART.yBase - v * CHART.height;
const curvePath = (j: number) =>
  'M' + XYZ_CMF.map((r) => `${xOf(r.nm).toFixed(1)},${yOf(r.a[j]).toFixed(1)}`).join(' L');
const areaPath = (j: number) =>
  `${curvePath(j)} L${xOf(CONE_NM_MAX)},${CHART.yBase} L${xOf(CONE_NM_MIN)},${CHART.yBase} Z`;
const peakOf = (j: number) => XYZ_CMF.reduce((best, r) => (r.a[j] > best.a[j] ? r : best));

const CURVES = [
  { key: 'X', color: '#e01a00', step: STEP.labelX, dx: 10 },
  { key: 'Y', color: '#00a848', step: STEP.labelY, dx: -10 },
  { key: 'Z', color: '#2a5cff', step: STEP.labelZ, dx: 10 },
];

// Bottom: XYZ in the middle, with the color spaces converted to and from it around; LMS (the
// cone responses) sits right below it
const HUB = { x: 115, y: BOTTOM_PANEL.y + 54, w: 58, h: 26 };
const NODE_H = 22;
const NODES = [
  { key: 'rgb', x: 52, y: BOTTOM_PANEL.y + 19, w: 84, step: STEP.rgb },
  { key: 'lab', x: 178, y: BOTTOM_PANEL.y + 19, w: 84, step: STEP.others },
  { key: 'cmyk', x: 42, y: BOTTOM_PANEL.y + 89, w: 62, step: STEP.others },
  { key: 'lms', x: 115, y: BOTTOM_PANEL.y + 89, w: 62, step: STEP.others },
  { key: 'oklab', x: 188, y: BOTTOM_PANEL.y + 89, w: 62, step: STEP.others },
];

const XyzSpace = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.xyz_space.${key}`);
  const step = useSlideStep(STEP_AT_MS);

  return (
    <div style={{ padding: '12px 8px', fontFamily: 'sans-serif' }}>
      <h3 style={{ margin: '0 0 8px', fontSize: '19px', fontWeight: 700, textAlign: 'center' }}>
        {k('title')}
      </h3>

      <svg
        viewBox="0 0 230 310"
        width="100%"
        style={{ display: 'block', maxWidth: '260px', margin: '0 auto' }}
      >
        <defs>
          <linearGradient id="xyzSpectrum" x1="0%" y1="0%" x2="100%" y2="0%">
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

        {/* ── top: the three curves that turn light into X, Y, Z ── */}
        <g style={fade(step >= STEP.frame)}>
          <line
            x1={CHART.x0}
            y1={CHART.yBase}
            x2={CHART.x1}
            y2={CHART.yBase}
            stroke="#888"
            strokeWidth="1"
          />
          <line
            x1={CHART.x0}
            y1={CHART.yBase}
            x2={CHART.x0}
            y2={CHART.yBase - CHART.height - 8}
            stroke="#888"
            strokeWidth="1"
          />
          <rect
            x={CHART.x0}
            y={CHART.yBase + 4}
            width={CHART.x1 - CHART.x0}
            height="8"
            fill="url(#xyzSpectrum)"
          />
          {[400, 500, 600, 700].map((nm) => (
            <text
              key={nm}
              x={xOf(nm)}
              y={CHART.yBase + 26}
              textAnchor="middle"
              fontSize="12"
              fill="#666"
            >
              {nm}
            </text>
          ))}
          <text x={CHART.x1} y={CHART.yBase + 41} textAnchor="end" fontSize="13" fill="#555">
            {k('wavelength')}
          </text>
          <text x={CHART.x0 - 6} y={CHART.yBase + 4} textAnchor="end" fontSize="12" fill="#666">
            0
          </text>
        </g>
        <text
          x="12"
          y="20"
          fontSize="13"
          fontWeight="bold"
          fill="#555"
          style={fade(step >= STEP.cie)}
        >
          CIE 1931
        </text>

        {/* never below zero */}
        <g style={fade(step >= STEP.positive)}>
          {CURVES.map((c, j) => (
            <path key={c.key} d={areaPath(j)} fill={c.color} opacity="0.12" />
          ))}
        </g>

        {CURVES.map((c, j) => {
          const peak = peakOf(j);
          const highlighted = c.key === 'Y' && step >= STEP.brightness;
          return (
            <g key={c.key}>
              <path
                d={curvePath(j)}
                pathLength={1}
                fill="none"
                stroke={c.color}
                style={{
                  ...draw(step >= STEP.curves, j * 300, 1400),
                  strokeWidth: highlighted ? 3.5 : 1.8,
                  transition: 'stroke-dashoffset 1400ms ease, stroke-width 500ms ease',
                }}
              />
              <text
                x={xOf(peak.nm) + c.dx}
                y={yOf(peak.a[j]) - 4}
                textAnchor="middle"
                fontSize="14"
                fontWeight="bold"
                fill={c.color}
                style={fade(step >= c.step)}
              >
                {c.key}
              </text>
            </g>
          );
        })}
        <text
          x={xOf(peakOf(1).nm) - 10}
          y={yOf(peakOf(1).a[1]) - 22}
          textAnchor="middle"
          fontSize="13"
          fontWeight="bold"
          fill="#00813a"
          style={fade(step >= STEP.brightness, 300)}
        >
          {k('brightness')}
        </text>

        {/* ── bottom: XYZ is the reference other color spaces are defined from ── */}
        {NODES.map((n) => (
          <g key={n.key} style={fade(step >= n.step)}>
            <line x1={HUB.x} y1={HUB.y} x2={n.x} y2={n.y} stroke="#aaa" strokeWidth="1.2" />
            <rect
              x={n.x - n.w / 2}
              y={n.y - NODE_H / 2}
              width={n.w}
              height={NODE_H}
              rx={NODE_H / 2}
              fill="#fff"
              stroke="#ccc"
            />
            <text x={n.x} y={n.y + 5} textAnchor="middle" fontSize="13" fill="#333">
              {k(n.key)}
            </text>
          </g>
        ))}
        <g style={fade(step >= STEP.hub)}>
          <rect
            x={HUB.x - HUB.w / 2}
            y={HUB.y - HUB.h / 2}
            width={HUB.w}
            height={HUB.h}
            rx="6"
            fill="#333"
          />
          <text
            x={HUB.x}
            y={HUB.y + 6}
            textAnchor="middle"
            fontSize="16"
            fontWeight="bold"
            fill="#fff"
          >
            XYZ
          </text>
        </g>
      </svg>
    </div>
  );
};

export default XyzSpace;
