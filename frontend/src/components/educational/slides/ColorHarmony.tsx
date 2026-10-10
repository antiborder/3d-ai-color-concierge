import { useTranslation } from 'react-i18next';
import type { HarmonyMode } from '../../../utils/colorHarmony';
import { HueRing, paletteOf, rgb, shapePathOf, verticesOf } from '../harmonyWheel';
import { draw, fade, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/color_harmony.py); each step starts on the word in [ ].
 */
const STEP = {
  wheel: 0, // "[カラーハーモニーは]、調和して見える色の組み合わせのことです。"
  base: 1, // "多くは、色相環の上の[位置関係]で決まります。"
  comp: 2, // "[正反対]の2色が補色、"
  tri: 3, // "[正三角形]の3色が三角配色、"
  tet: 4, // "[正方形]の4色が四角配色です。"
  regular: 5, // "どれも、色相環の上で、[正多角形]の頂点にある色です。"
  app: 6, // "[このアプリの]Color Harmonyでは、選んだ色をもとに、"
  n5: 7, // "[五角形]から九角形までの配色も作れます。" — then 6 to 9 corners, one after another
  n6: 8,
  n7: 9,
  n8: 10,
  n9: 11,
} as const;
// When each step's words are spoken, counted from when the slide appears. Estimated from the
// reading (kana) of the Japanese narration at 8 morae/s, with pauses at 、(0.25 s) ・(0.15 s)
// 。(0.5 s) and 0.6 s before speech starts — calibrated on the hand-tuned RGB slide. The 6- to
// 9-corner shapes follow the pentagon every 0.7 s.
const STEP_AT_MS = [600, 7100, 9100, 11100, 14100, 19400, 22200, 26000, 26700, 27400, 28100, 28800];

// Two rounded panels: the hue ring and the shapes (top), the palettes (bottom)
const TOP_PANEL = { y: 0, height: 200 };
const BOTTOM_PANEL = { y: 208, height: 102 };

// Every shape the app's Color Harmony makes, by number of colors
const MODES: Record<number, HarmonyMode> = {
  2: 'complementary',
  3: 'triangle',
  4: 'square',
  5: 'pentagon',
  6: 'hexagon',
  7: 'heptagon',
  8: 'octagon',
  9: 'nonagon',
};
const SHAPES = Object.entries(MODES).map(([n, mode]) => {
  const palette = paletteOf(mode);
  const vertices = verticesOf(palette);
  return { n: Number(n), palette, vertices, path: shapePathOf(vertices) };
});
const shapeOf = (n: number) => SHAPES.find((s) => s.n === n)!;

/** Which shapes are on the ring at each step */
const activeShapes = (step: number): number[] => {
  if (step >= STEP.n5) return [5 + (step - STEP.n5)];
  if (step >= STEP.regular) return [2, 3, 4];
  if (step >= STEP.tet) return [4];
  if (step >= STEP.tri) return [3];
  if (step >= STEP.comp) return [2];
  return [];
};

// Bottom: one row of swatches per scheme (the last row shows the 5- to 9-color one on screen)
const ROWS = [
  { key: 'complementary', n: 2, step: STEP.comp },
  { key: 'triadic', n: 3, step: STEP.tri },
  { key: 'tetradic', n: 4, step: STEP.tet },
  { key: 'more', n: 0, step: STEP.n5 },
];
const ROW = { y0: BOTTOM_PANEL.y + 10, pitch: 22, labelX: 10, x0: 114, size: 11, gap: 12 };

const ColorHarmony = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.color_harmony.${key}`);
  const step = useSlideStep(STEP_AT_MS);
  const active = activeShapes(step);
  const moreN = step >= STEP.n5 ? active[0] : 5;
  const base = shapeOf(2).vertices[0];

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

        {/* ── top: the hue ring and the shapes on it ── */}
        <g style={fade(step >= STEP.wheel)}>
          <HueRing />
        </g>

        {SHAPES.map((s) => {
          const on = active.includes(s.n);
          return (
            <g key={s.n} style={{ opacity: on ? 1 : 0, transition: 'opacity 400ms ease' }}>
              <path
                d={s.path}
                pathLength={1}
                fill="none"
                stroke="#222"
                strokeWidth={active.length > 1 ? 1.5 : 2}
                strokeLinejoin="round"
                style={draw(on, 0, 700)}
              />
              {s.vertices.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={s.n > 6 ? 6 : 7.5}
                  fill={rgb(s.palette[i])}
                  stroke="#fff"
                  strokeWidth="2"
                />
              ))}
            </g>
          );
        })}

        {/* the base color everything starts from */}
        <circle
          cx={base.x}
          cy={base.y}
          r="7.5"
          fill={rgb(shapeOf(2).palette[0])}
          stroke="#fff"
          strokeWidth="2"
          style={fade(step >= STEP.base)}
        />

        <text
          x="115"
          y={TOP_PANEL.height - 10}
          textAnchor="middle"
          fontSize="13"
          fontWeight="bold"
          fill="#555"
          style={fade(step >= STEP.regular)}
        >
          {k('regular')}
        </text>
        <text x="10" y="17" fontSize="12" fill="#555" style={fade(step >= STEP.app)}>
          {k('app')}
        </text>

        {/* ── bottom: the palettes ── */}
        {ROWS.map((row, r) => {
          const y = ROW.y0 + r * ROW.pitch;
          const n = row.n || moreN;
          const palette = shapeOf(n).palette;
          return (
            <g key={row.key} style={fade(step >= row.step)}>
              <text x={ROW.labelX} y={y + 11} fontSize="12" fontWeight="bold" fill="#333">
                {k(row.key)}
              </text>
              {palette.map((c, i) => (
                <rect
                  key={`${n}-${i}`}
                  x={ROW.x0 + i * ROW.gap}
                  y={y}
                  width={ROW.size}
                  height={ROW.size}
                  rx="3"
                  fill={rgb(c)}
                />
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default ColorHarmony;
