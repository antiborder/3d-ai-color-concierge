import { useTranslation } from 'react-i18next';
import { fade, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/rgb_cube_grid.py); each step starts on the word in [ ].
 */
const STEP = {
  frame: 0, // "[RGB Cube Gridは]、RGB色空間の立方体を、格子状に区切った色見本です。"
  axis: 1, // "[赤]・緑・青のそれぞれを、"
  levels: 2, // "0から255まで[7段階に]分けます。"
  dots: 3, // "その[組み合わせで]、7かける7かける7の、"
  count: 4, // "[343色が]並びます。"
  even: 5, // "立方体の中に[均等に]並ぶので、色空間全体の様子をつかむのに便利です。"
  hex: 6, // "[各点の]色は、HEXコードでも表せます。"
} as const;
// When each step's words are spoken, counted from when the slide appears. Estimated from the
// reading (kana) of the Japanese narration at 8 morae/s, with pauses at 、(0.25 s) ・(0.15 s)
// 。(0.5 s) and 0.6 s before speech starts — calibrated on the hand-tuned RGB slide.
const STEP_AT_MS = [600, 8200, 12000, 14200, 17000, 21000, 26200];

// Two rounded panels: the grid inside the cube (top), the 7 levels of each axis (bottom)
const TOP_PANEL = { y: 0, height: 214 };
const BOTTOM_PANEL = { y: 222, height: 88 };

// The grid's levels on each axis (as in the app's RGB_GRID sample colors)
const LEVELS = [0, 43, 85, 128, 170, 213, 255];
const N = LEVELS.length - 1;

// Oblique view of the cube: R to the right, G up, B toward the viewer (down-left)
const U = 20;
const ORIGIN = { x: 82, y: 148 }; // black
const project = (r: number, g: number, b: number) => ({
  x: ORIGIN.x + r * U - b * 0.5 * U,
  y: ORIGIN.y - g * U + b * 0.4 * U,
});
const hex = (r: number, g: number, b: number) =>
  '#' + [r, g, b].map((i) => LEVELS[i].toString(16).padStart(2, '0')).join('');

// Every grid point, far (B = 0) to near so nearer dots are drawn on top
const DOTS = Array.from({ length: (N + 1) ** 3 }, (_, i) => {
  const r = i % (N + 1);
  const g = Math.floor(i / (N + 1)) % (N + 1);
  const b = Math.floor(i / (N + 1) ** 2);
  return { r, g, b, ...project(r, g, b), color: hex(r, g, b) };
}).sort((p, q) => p.b - q.b || p.g - q.g || p.r - q.r);

// Cube edges, as pairs of corners
const CORNERS = [0, N].flatMap((b) => [0, N].flatMap((g) => [0, N].map((r) => [r, g, b])));
const EDGES = CORNERS.flatMap((p, i) =>
  CORNERS.slice(i + 1)
    .filter((q) => p.filter((v, j) => v !== q[j]).length === 1)
    .map((q) => [project(p[0], p[1], p[2]), project(q[0], q[1], q[2])])
);

// The example point: R 255, G 128, B 0
const EXAMPLE = { r: 6, g: 3, b: 0 };

// Bottom: the 7 levels as reds
const LEVEL_ROW = { x0: 13, y: BOTTOM_PANEL.y + 14, size: 24, pitch: 30 };

const RgbCubeGrid = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.rgb_cube_grid.${key}`);
  const step = useSlideStep(STEP_AT_MS);

  const example = project(EXAMPLE.r, EXAMPLE.g, EXAMPLE.b);
  const rEnd = project(N, 0, 0);

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

        {/* ── top: the cube, divided into a grid ── */}
        <g style={fade(step >= STEP.frame)}>
          {EDGES.map(([p, q], i) => (
            <line key={i} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="#bbb" strokeWidth="1" />
          ))}
        </g>

        {/* one axis split into 7 levels: the red edge */}
        <g style={fade(step >= STEP.axis)}>
          <line
            x1={ORIGIN.x}
            y1={ORIGIN.y}
            x2={rEnd.x}
            y2={rEnd.y}
            stroke="#e01a00"
            strokeWidth="2"
          />
          <text x={rEnd.x + 8} y={rEnd.y + 5} fontSize="14" fontWeight="bold" fill="#e01a00">
            R
          </text>
          <text
            x={project(0, N, 0).x - 8}
            y={project(0, N, 0).y + 5}
            textAnchor="end"
            fontSize="14"
            fontWeight="bold"
            fill="#00a848"
          >
            G
          </text>
          <text
            x={project(0, 0, N).x - 8}
            y={project(0, 0, N).y + 5}
            textAnchor="end"
            fontSize="14"
            fontWeight="bold"
            fill="#2a5cff"
          >
            B
          </text>
        </g>
        {LEVELS.map((_, i) => {
          const p = project(i, 0, 0);
          return (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="4"
              fill={hex(i, 0, 0)}
              stroke="#333"
              strokeWidth="0.8"
              style={fade(step >= STEP.levels, i * 120)}
            />
          );
        })}

        {/* all 7 × 7 × 7 combinations, layer by layer toward the viewer */}
        {DOTS.map((d) => (
          <circle
            key={d.color}
            cx={d.x}
            cy={d.y}
            r="3.2"
            fill={d.color}
            stroke="rgba(0,0,0,0.25)"
            strokeWidth="0.5"
            style={fade(step >= STEP.dots, d.b * 220)}
          />
        ))}

        {/* the grid is even, so it shows the whole space */}
        <text
          x="12"
          y="20"
          fontSize="13"
          fontWeight="bold"
          fill="#555"
          style={fade(step >= STEP.even)}
        >
          {k('even')}
        </text>

        {/* each point has a HEX code */}
        <g style={fade(step >= STEP.hex)}>
          <circle cx={example.x} cy={example.y} r="7" fill="none" stroke="#222" strokeWidth="2" />
          {/* the label sits above the cube, with a leader down the right side */}
          <path
            d={`M${example.x + 9},${example.y - 4} L${example.x + 9},24`}
            stroke="#222"
            strokeWidth="1.2"
          />
          <text
            x="222"
            y="18"
            textAnchor="end"
            fontSize="13"
            fontWeight="bold"
            fontFamily='Menlo, Consolas, "Courier New", monospace'
            fill="#222"
            stroke="#f7f8fb"
            strokeWidth="3"
            paintOrder="stroke"
          >
            #ff8000
          </text>
        </g>

        {/* ── bottom: 0–255 in 7 levels ── */}
        {LEVELS.map((v, i) => (
          <g key={v} style={fade(step >= STEP.levels, i * 120)}>
            <rect
              x={LEVEL_ROW.x0 + i * LEVEL_ROW.pitch}
              y={LEVEL_ROW.y}
              width={LEVEL_ROW.size}
              height={LEVEL_ROW.size}
              rx="4"
              fill={hex(i, 0, 0)}
            />
            <text
              x={LEVEL_ROW.x0 + i * LEVEL_ROW.pitch + LEVEL_ROW.size / 2}
              y={LEVEL_ROW.y + LEVEL_ROW.size + 15}
              textAnchor="middle"
              fontSize="12"
              fill="#333"
            >
              {v}
            </text>
          </g>
        ))}
        <text
          x="115"
          y={BOTTOM_PANEL.y + BOTTOM_PANEL.height - 10}
          textAnchor="middle"
          fontSize="14"
          fontWeight="bold"
          fill="#333"
          style={fade(step >= STEP.count)}
        >
          {k('count')}
        </text>
      </svg>
    </div>
  );
};

export default RgbCubeGrid;
