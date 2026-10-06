import { useTranslation } from 'react-i18next';
import { draw, fade, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/cmyk_space.py); each step starts on the word in [ ].
 */
const STEP = {
  ghost: 0, // "[CMYK色空間は]、印刷に使うインクの量で色を表します。"
  axisC: 1, // "[シアン]・"
  axisM: 2, // "[マゼンタ]・"
  axisY: 3, // "[イエロー]を、"
  ticks: 4, // "[それぞれ]0から100%で重ねると、"
  cube: 5, // "色は[立方体]の中に並びます。"
  white: 6, // "原点は何も塗らない[紙の白]、"
  black: 7, // "反対の角は3色を[重ねた黒]です。"
  muddy: 8, // "ただし実際のインクを3色重ねても、[濁った]黒にしかなりません。"
  key: 9, // "そこで黒のインク、[Kを]加えた4色で印刷します。"
} as const;
// When each step's words are spoken, counted from when the slide appears. Estimated from the
// reading (kana) of the Japanese narration at 8 morae/s, with pauses at 、(0.25 s) ・(0.15 s)
// 。(0.5 s) and 0.6 s before speech starts — calibrated on the hand-tuned RGB slide.
const STEP_AT_MS = [600, 6200, 6800, 7400, 8300, 11500, 15400, 17900, 22300, 25900];
const CORNER_INTERVAL_MS = 300;

// Ink colors for the axes (darker than the pure inks so they read on white)
const INK = { C: '#00a0c8', M: '#d000c0', Y: '#c8a000' };

// Two rounded panels: the CMY cube on white paper (top), why black ink is added (bottom)
const TOP_PANEL = { y: 0, height: 205 };
const BOTTOM_PANEL = { y: 213, height: 97 };

// Cabinet projection, as in the RGB slide: C to the right, M into the depth, Y up; the origin is
// white paper (no ink)
const ORIGIN = { x: 40, y: 175 };
const SIZE = 100;
const DEPTH = { x: 0.6, y: 0.25 };
const pt = (c: number, m: number, y: number) => ({
  x: ORIGIN.x + c * SIZE + m * DEPTH.x * SIZE,
  y: ORIGIN.y - m * DEPTH.y * SIZE - y * SIZE,
});
const seg = (a: number[], b: number[]) => {
  const p = pt(a[0], a[1], a[2]);
  const q = pt(b[0], b[1], b[2]);
  return `M${p.x.toFixed(1)},${p.y.toFixed(1)} L${q.x.toFixed(1)},${q.y.toFixed(1)}`;
};

const AXES = [
  { key: 'C', color: INK.C, end: [1.2, 0, 0], label: { dx: 6, dy: 5 }, step: STEP.axisC },
  { key: 'M', color: INK.M, end: [0, 1.3, 0], label: { dx: 4, dy: -2 }, step: STEP.axisM },
  { key: 'Y', color: INK.Y, end: [0, 0, 1.2], label: { dx: -4, dy: -6 }, step: STEP.axisY },
];
const EDGES: Array<[number[], number[]]> = [
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
const MAX_LABELS = [
  { at: pt(1, 0, 0), dx: 0, dy: 16, anchor: 'middle' as const },
  { at: pt(0, 1, 0), dx: -6, dy: 12, anchor: 'end' as const },
  { at: pt(0, 0, 1), dx: -6, dy: 4, anchor: 'end' as const },
];
// Corners: one ink each (with its axis), two inks (with the cube)
const INK_CORNERS = [
  { cmy: [1, 0, 0], color: '#00ffff', step: STEP.axisC },
  { cmy: [0, 1, 0], color: '#ff00ff', step: STEP.axisM },
  { cmy: [0, 0, 1], color: '#ffff00', step: STEP.axisY },
];
const MIX_CORNERS = [
  { cmy: [1, 1, 0], color: '#0000ff' },
  { cmy: [1, 0, 1], color: '#00ff00' },
  { cmy: [0, 1, 1], color: '#ff0000' },
];

// Bottom: three real inks on top of each other give a muddy dark, black ink gives true black
const MUDDY = '#3d332e';
const BOTTOM = { rowY: BOTTOM_PANEL.y + 40, swatch: 34, inkR: 11 };

const CmykSpace = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.cmyk_space.${key}`);
  const step = useSlideStep(STEP_AT_MS);

  const white = pt(0, 0, 0);
  const black = pt(1, 1, 1);
  const cubeEdges = [
    ...EDGES,
    [
      [0, 0, 0],
      [1, 0, 0],
    ],
    [
      [0, 0, 0],
      [0, 1, 0],
    ],
    [
      [0, 0, 0],
      [0, 0, 1],
    ],
  ];

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
        {/* top panel is white paper */}
        <rect
          x="0.5"
          y={TOP_PANEL.y + 0.5}
          width="229"
          height={TOP_PANEL.height - 1}
          rx="8"
          fill="#fff"
          stroke="#e3e6ec"
        />
        <rect
          x="0"
          y={BOTTOM_PANEL.y}
          width="230"
          height={BOTTOM_PANEL.height}
          rx="8"
          fill="#f7f8fb"
        />

        {/* ── top: the CMY cube ── */}
        {/* a faint outline while the first sentence is spoken */}
        <g
          style={{
            opacity: step >= STEP.ghost && step < STEP.cube ? 1 : 0,
            transition: 'opacity 600ms ease',
          }}
        >
          {cubeEdges.map(([a, b]) => (
            <path
              key={`ghost-${a.join()}-${b.join()}`}
              d={seg(a, b)}
              fill="none"
              stroke="#ddd"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
          ))}
        </g>

        {AXES.map((axis) => {
          const end = pt(axis.end[0], axis.end[1], axis.end[2]);
          return (
            <g key={axis.key}>
              <path
                d={seg([0, 0, 0], axis.end)}
                pathLength={1}
                fill="none"
                stroke={axis.color}
                strokeWidth="2"
                style={draw(step >= axis.step, 0, 700)}
              />
              <text
                x={end.x + axis.label.dx}
                y={end.y + axis.label.dy}
                textAnchor="middle"
                fontSize="14"
                fontWeight="bold"
                fill={axis.color}
                style={fade(step >= axis.step, 500)}
              >
                {axis.key}
              </text>
            </g>
          );
        })}

        {EDGES.map(([a, b]) => (
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
              100%
            </text>
          ))}
          <text x={white.x - 6} y={white.y + 4} textAnchor="end" fontSize="12" fill="#666">
            0
          </text>
        </g>

        {INK_CORNERS.map((c) => {
          const p = pt(c.cmy[0], c.cmy[1], c.cmy[2]);
          return (
            <circle
              key={c.color}
              cx={p.x}
              cy={p.y}
              r="6"
              fill={c.color}
              stroke="#888"
              strokeWidth="0.8"
              style={fade(step >= c.step, 500)}
            />
          );
        })}
        {MIX_CORNERS.map((c, i) => {
          const p = pt(c.cmy[0], c.cmy[1], c.cmy[2]);
          return (
            <circle
              key={c.color}
              cx={p.x}
              cy={p.y}
              r="6"
              fill={c.color}
              stroke="#fff"
              strokeWidth="1"
              style={fade(step >= STEP.cube, 700 + i * CORNER_INTERVAL_MS)}
            />
          );
        })}

        <g style={fade(step >= STEP.white)}>
          <circle cx={white.x} cy={white.y} r="6" fill="#fff" stroke="#888" strokeWidth="1" />
          <text x={white.x} y={white.y + 20} textAnchor="middle" fontSize="13" fill="#333">
            {k('paperWhite')}
          </text>
        </g>
        <g style={fade(step >= STEP.black)}>
          <circle cx={black.x} cy={black.y} r="6" fill="#000" />
          <text x={black.x + 10} y={black.y + 5} fontSize="13" fill="#333">
            {k('black')}
          </text>
        </g>

        {/* ── bottom: muddy dark from three inks vs. black ink (K) ── */}
        <g style={fade(step >= STEP.muddy)}>
          {[
            { x: 22, color: '#00ffff' },
            { x: 34, color: '#ff00ff' },
            { x: 46, color: '#ffff00' },
          ].map((ink) => (
            <circle
              key={ink.color}
              cx={ink.x}
              cy={BOTTOM.rowY}
              r={BOTTOM.inkR}
              fill={ink.color}
              style={{ mixBlendMode: 'multiply' }}
            />
          ))}
          <text x="70" y={BOTTOM.rowY + 6} textAnchor="middle" fontSize="16" fill="#555">
            →
          </text>
          <rect
            x="82"
            y={BOTTOM.rowY - BOTTOM.swatch / 2}
            width={BOTTOM.swatch}
            height={BOTTOM.swatch}
            rx="5"
            fill={MUDDY}
          />
          <text
            x={82 + BOTTOM.swatch / 2}
            y={BOTTOM.rowY + BOTTOM.swatch / 2 + 18}
            textAnchor="middle"
            fontSize="13"
            fill="#333"
          >
            {k('muddy')}
          </text>
        </g>
        <g style={fade(step >= STEP.key)}>
          <text
            x="152"
            y={BOTTOM.rowY + 7}
            textAnchor="middle"
            fontSize="20"
            fontWeight="bold"
            fill="#000"
          >
            K
          </text>
          <rect
            x="170"
            y={BOTTOM.rowY - BOTTOM.swatch / 2}
            width={BOTTOM.swatch}
            height={BOTTOM.swatch}
            rx="5"
            fill="#000"
          />
          <text
            x={170 + BOTTOM.swatch / 2}
            y={BOTTOM.rowY + BOTTOM.swatch / 2 + 18}
            textAnchor="middle"
            fontSize="13"
            fill="#333"
          >
            {k('blackInk')}
          </text>
        </g>
      </svg>
    </div>
  );
};

export default CmykSpace;
