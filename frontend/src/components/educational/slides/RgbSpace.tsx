import { useTranslation } from 'react-i18next';
import { draw, fade, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/rgb_space.py); each step starts on the word in [ ].
 */
const STEP = {
  axisR: 0, // "RGB色空間は、[赤]・"
  axisG: 1, // "[緑]・"
  axisB: 2, // "[青]の強さを3つの軸にした色空間です。"
  ticks: 3, // "[それぞれ]0から255なので、"
  cube: 4, // "全体は[立方体]になります。"
  black: 5, // "原点は[黒]、"
  white: 6, // "反対の角は[白]です。"
  cornerR: 7, // "残りの角は、[赤]・"
  cornerG: 8, // "[緑]・"
  cornerB: 9, // "[青]と、"
  cornerC: 10, // "[シアン]・"
  cornerM: 11, // "[マゼンタ]・"
  cornerY: 12, // "[黄色]です。"
  grays: 13, // "[対角線]上にはグレーが並びます。"
  example: 14, // "例えば[オレンジ]は、この点で表せます。"
} as const;
// When each step's word is spoken, counted from when the slide appears. Estimated from the
// reading (kana) of the Japanese narration at 7.5 morae/s, with pauses at 、・。 and 0.6 s
// before speech starts (the same estimate matches the timings of the sky slide), then
// tuned by ear: from the cube on, 1 s earlier.
const STEP_AT_MS = [
  2700, 3100, 3700, 7400, 9700, 12300, 13900, 16100, 16500, 17100, 17700, 18300, 19000, 20100,
  23700,
];
const AXIS_STEPS = [STEP.axisR, STEP.axisG, STEP.axisB];
const CORNER_STEPS = [
  STEP.cornerR,
  STEP.cornerG,
  STEP.cornerB,
  STEP.cornerC,
  STEP.cornerM,
  STEP.cornerY,
];

const RED = '#e01a00';
const GREEN = '#00a848';
const BLUE = '#2a5cff';

// Two rounded panels: the RGB cube (top) and one color as R/G/B values (bottom)
const TOP_PANEL = { y: 0, height: 205 };
const BOTTOM_PANEL = { y: 213, height: 97 };

// Cabinet projection: R to the right, G into the depth (up-right), B up; black at ORIGIN
const ORIGIN = { x: 40, y: 175 };
const SIZE = 100;
// Flat enough that the G axis stays clear of the black–white diagonal
const DEPTH = { x: 0.6, y: 0.25 };
/** Screen position of the RGB point (r, g, b), each 0–1 */
const pt = (r: number, g: number, b: number) => ({
  x: ORIGIN.x + r * SIZE + g * DEPTH.x * SIZE,
  y: ORIGIN.y - g * DEPTH.y * SIZE - b * SIZE,
});
const seg = (a: number[], b: number[]) => {
  const p = pt(a[0], a[1], a[2]);
  const q = pt(b[0], b[1], b[2]);
  return `M${p.x.toFixed(1)},${p.y.toFixed(1)} L${q.x.toFixed(1)},${q.y.toFixed(1)}`;
};

const AXES = [
  { key: 'R', color: RED, end: [1.2, 0, 0], label: { dx: 6, dy: 5 } },
  { key: 'G', color: GREEN, end: [0, 1.3, 0], label: { dx: 4, dy: -2 } },
  { key: 'B', color: BLUE, end: [0, 0, 1.2], label: { dx: -4, dy: -6 } },
] as const;
// The cube's 12 edges, minus the three that lie on the axes
const CUBE_EDGES: Array<[number[], number[]]> = [
  [
    [1, 0, 0],
    [1, 1, 0],
  ],
  [
    [1, 0, 0],
    [1, 0, 1],
  ],
  [
    [0, 1, 0],
    [1, 1, 0],
  ],
  [
    [0, 1, 0],
    [0, 1, 1],
  ],
  [
    [0, 0, 1],
    [1, 0, 1],
  ],
  [
    [0, 0, 1],
    [0, 1, 1],
  ],
  [
    [1, 1, 0],
    [1, 1, 1],
  ],
  [
    [1, 0, 1],
    [1, 1, 1],
  ],
  [
    [0, 1, 1],
    [1, 1, 1],
  ],
];
// Where "255" is written for each axis (next to the corner at value 255)
const MAX_LABELS = [
  { at: pt(1, 0, 0), dx: 0, dy: 16, anchor: 'middle' as const },
  { at: pt(0, 1, 0), dx: -6, dy: 12, anchor: 'end' as const },
  { at: pt(0, 0, 1), dx: -6, dy: 4, anchor: 'end' as const },
];
const COLOR_CORNERS = [
  { rgb: [1, 0, 0], color: '#ff0000' },
  { rgb: [0, 1, 0], color: '#00ff00' },
  { rgb: [0, 0, 1], color: '#0000ff' },
  { rgb: [0, 1, 1], color: '#00ffff' },
  { rgb: [1, 0, 1], color: '#ff00ff' },
  { rgb: [1, 1, 0], color: '#ffff00' },
];

// The example color
const EXAMPLE = { rgb: [255, 128, 0] as const, color: '#ff8000' };
const exampleAt = pt(EXAMPLE.rgb[0] / 255, EXAMPLE.rgb[1] / 255, EXAMPLE.rgb[2] / 255);
const BARS = { valueX: 58, x0: 64, maxWidth: 96, height: 12, row0: 244, gap: 20 };
const SWATCH = { x: 176, y: 244, size: 40 };

const RgbSpace = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.rgb_space.${key}`);
  const step = useSlideStep(STEP_AT_MS);

  const black = pt(0, 0, 0);
  const white = pt(1, 1, 1);

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
          <linearGradient
            id="rgbSpaceGrays"
            gradientUnits="userSpaceOnUse"
            x1={black.x}
            y1={black.y}
            x2={white.x}
            y2={white.y}
          >
            <stop offset="0%" stopColor="#000" />
            <stop offset="100%" stopColor="#fff" />
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

        {/* ── top: the RGB cube ── */}
        {AXES.map((axis, i) => {
          const end = pt(axis.end[0], axis.end[1], axis.end[2]);
          return (
            <g key={axis.key}>
              <path
                d={seg([0, 0, 0], [...axis.end])}
                pathLength={1}
                fill="none"
                stroke={axis.color}
                strokeWidth="2"
                style={draw(step >= AXIS_STEPS[i], 0, 700)}
              />
              <text
                x={end.x + axis.label.dx}
                y={end.y + axis.label.dy}
                textAnchor="middle"
                fontSize="14"
                fontWeight="bold"
                fill={axis.color}
                style={fade(step >= AXIS_STEPS[i], 500)}
              >
                {axis.key}
              </text>
            </g>
          );
        })}

        {CUBE_EDGES.map(([a, b]) => (
          <path
            key={`${a.join()}-${b.join()}`}
            d={seg(a, b)}
            pathLength={1}
            fill="none"
            stroke="#999"
            strokeWidth="1"
            style={draw(step >= STEP.cube, 0, 1000)}
          />
        ))}
        <g style={fade(step >= STEP.ticks)}>
          {MAX_LABELS.map((l) => (
            <text
              key={`${l.at.x}-${l.at.y}`}
              x={l.at.x + l.dx}
              y={l.at.y + l.dy}
              textAnchor={l.anchor}
              fontSize="12"
              fill="#666"
            >
              255
            </text>
          ))}
          <text x={black.x - 6} y={black.y + 4} textAnchor="end" fontSize="12" fill="#666">
            0
          </text>
        </g>

        {/* grays on the diagonal from black to white */}
        <path
          d={seg([0, 0, 0], [1, 1, 1])}
          pathLength={1}
          fill="none"
          stroke="url(#rgbSpaceGrays)"
          strokeWidth="4"
          style={draw(step >= STEP.grays, 0, 1000)}
        />
        <text
          x={pt(0.55, 0.55, 0.55).x + 8}
          y={pt(0.55, 0.55, 0.55).y + 12}
          fontSize="13"
          fill="#555"
          style={fade(step >= STEP.grays, 700)}
        >
          {k('grays')}
        </text>

        <g style={fade(step >= STEP.black)}>
          <circle cx={black.x} cy={black.y} r="6" fill="#000" />
          <text x={black.x} y={black.y + 20} textAnchor="middle" fontSize="13" fill="#333">
            {k('black')}
          </text>
        </g>
        <g style={fade(step >= STEP.white)}>
          <circle cx={white.x} cy={white.y} r="6" fill="#fff" stroke="#999" strokeWidth="1" />
          <text x={white.x + 10} y={white.y + 5} fontSize="13" fill="#333">
            {k('white')}
          </text>
        </g>
        {COLOR_CORNERS.map((c, i) => {
          const at = pt(c.rgb[0], c.rgb[1], c.rgb[2]);
          return (
            <circle
              key={c.color}
              cx={at.x}
              cy={at.y}
              r="6"
              fill={c.color}
              stroke="#fff"
              strokeWidth="1"
              style={fade(step >= CORNER_STEPS[i])}
            />
          );
        })}

        {/* the example color as a point: go 255 along R, then 128 along G */}
        <g style={fade(step >= STEP.example)}>
          <path
            d={`${seg([0, 0, 0], [1, 0, 0])}`}
            fill="none"
            stroke={RED}
            strokeWidth="3"
            opacity="0.5"
          />
          <path
            d={seg([1, 0, 0], [1, EXAMPLE.rgb[1] / 255, 0])}
            fill="none"
            stroke={GREEN}
            strokeWidth="3"
            opacity="0.5"
            strokeDasharray="3 2"
          />
          <circle
            cx={exampleAt.x}
            cy={exampleAt.y}
            r="6"
            fill={EXAMPLE.color}
            stroke="#fff"
            strokeWidth="1"
          />
        </g>

        {/* ── bottom: the example's R, G, B values ── */}
        <g style={fade(step >= STEP.example, 600)}>
          <text x="12" y={BOTTOM_PANEL.y + 19} fontSize="13" fontWeight="bold" fill="#333">
            {k('example')}
          </text>
          {AXES.map((axis, i) => {
            const y = BARS.row0 + i * BARS.gap;
            const value = EXAMPLE.rgb[i];
            return (
              <g key={axis.key}>
                <text x="14" y={y + 10} fontSize="13" fontWeight="bold" fill={axis.color}>
                  {axis.key}
                </text>
                <text x={BARS.valueX} y={y + 10} textAnchor="end" fontSize="13" fill="#555">
                  {value}
                </text>
                <rect
                  x={BARS.x0}
                  y={y}
                  width={BARS.maxWidth}
                  height={BARS.height}
                  rx="2"
                  fill="#e3e6ec"
                />
                <rect
                  x={BARS.x0}
                  y={y}
                  width={(value / 255) * BARS.maxWidth}
                  height={BARS.height}
                  rx="2"
                  fill={axis.color}
                />
              </g>
            );
          })}
          <rect
            x={SWATCH.x}
            y={SWATCH.y}
            width={SWATCH.size}
            height={SWATCH.size}
            rx="6"
            fill={EXAMPLE.color}
          />
        </g>
      </svg>
    </div>
  );
};

export default RgbSpace;
