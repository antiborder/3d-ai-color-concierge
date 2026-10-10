import { useTranslation } from 'react-i18next';
import type { HarmonyMode } from '../../utils/colorHarmony';
import { HueRing, RING, paletteOf, rgb, shapePathOf, verticesOf } from './harmonyWheel';
import { draw, fade, useSlideStep } from './slideAnimation';

/**
 * Complementary, triadic and tetradic color schemes: where the colors sit on the hue ring, the
 * palette they make, and how to use it. The palettes are computed like the app's Color Harmony
 * (computeHarmonyColors: the hue turned in OkLCH, lightness kept), and the ring is an OkLCH hue
 * ring with the base color at the top, so the shape's corners land on the palette's colors.
 * Narrations: complementary_colors.py / triadic_colors.py / tetradic_colors.py.
 */

type Mode = 'complementary' | 'triadic' | 'tetradic';
type StepKey = 'wheel' | 'structure' | 'shape' | 'base' | 'others' | 'feel' | 'main' | 'app';

// The steps of each slide in the order they are spoken, and when (estimated from the reading
// (kana) of the Japanese narration at 8 morae/s, with pauses at 、(0.25 s) ・(0.15 s) 。(0.5 s)
// and 0.6 s before speech starts — calibrated on the hand-tuned RGB slide). Each step starts on
// the word in [ ].
const STEPS: Record<Mode, Array<[StepKey, number]>> = {
  complementary: [
    ['wheel', 600], // "[補色は]、"
    ['shape', 2200], // "色相環で[正反対に]ある2色の組み合わせです。"
    ['base', 5700], // "例えば[オレンジの]補色は、"
    ['others', 8200], // "反対側にある[水色]です。"
    ['feel', 11800], // "補色どうしを並べると、お互いを[引き立て]合って、とても目立ちます。"
    ['main', 14500], // "[目立たせたい]部分にだけ、補色を少し使うのが効果的です。"
    ['app', 19100], // "[このアプリの]Color Harmonyで、選んだ色の補色を表示できます。"
  ],
  triadic: [
    ['wheel', 600], // "[三角配色は]、"
    ['structure', 2800], // "色相環を[3等分]した位置にある3色の組み合わせです。"
    ['shape', 8000], // "色相環の上で、[正三角形]の頂点になります。"
    ['base', 11200], // "例えば[オレンジ]から始めると、"
    ['others', 13800], // "残りの2色は[青緑]と紫です。"
    ['feel', 17700], // "3色が離れているので、[にぎやか]でバランスの取れた印象になります。"
    ['main', 21000], // "[1色を]主役にして、残りを少なめに使うとまとまります。"
    ['app', 25500], // "[このアプリの]Color Harmonyで、選んだ色の三角配色を表示できます。"
  ],
  tetradic: [
    ['wheel', 600], // "[四角配色は]、"
    ['shape', 3100], // "色相環の上で[正方形]をなす4色の組み合わせです。"
    ['structure', 6200], // "[補色の組]を2つ合わせた配色でもあります。"
    ['base', 10200], // "例えば[オレンジ]から始めると、"
    ['others', 11800], // "[緑]、水色、紫が加わります。"
    ['feel', 16100], // "色数が多く[華やか]ですが、まとめるのが難しいので、"
    ['main', 19100], // "[1色を]主役にして、ほかは控えめに使うのがコツです。"
    ['app', 23400], // "[このアプリの]Color Harmonyで、選んだ色の四角配色を表示できます。"
  ],
};
const STEP_AT_MS: Record<Mode, number[]> = {
  complementary: STEPS.complementary.map(([, ms]) => ms),
  triadic: STEPS.triadic.map(([, ms]) => ms),
  tetradic: STEPS.tetradic.map(([, ms]) => ms),
};

const HARMONY: Record<Mode, HarmonyMode> = {
  complementary: 'complementary',
  triadic: 'triangle',
  tetradic: 'square',
};
// How much of a design each color gets: one main color, the others less
const PROPORTIONS: Record<Mode, number[]> = {
  complementary: [85, 15],
  triadic: [60, 30, 10],
  tetradic: [55, 20, 15, 10],
};

// Two rounded panels: the hue ring and the shape (top), the palette and its use (bottom)
const TOP_PANEL = { y: 0, height: 200 };
const BOTTOM_PANEL = { y: 208, height: 102 };

// Bottom: the palette's swatches, then a bar of how much each is used
const SWATCH = { size: 32, pitch: 48, y: BOTTOM_PANEL.y + 8 };
const BAR = { x0: 20, width: 190, y: BOTTOM_PANEL.y + 64, h: 14 };

const HarmonySlide = ({ mode }: { mode: Mode }) => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.${mode}_colors.${key}`);
  const step = useSlideStep(STEP_AT_MS[mode]);
  const order = STEPS[mode].map(([key]) => key);
  const at = (key: StepKey) => order.includes(key) && step >= order.indexOf(key);

  const palette = paletteOf(HARMONY[mode]);
  const vertices = verticesOf(palette);
  const names = t(`educational.${mode}_colors.names`, { returnObjects: true }) as string[];
  const swatchX0 = 115 - (palette.length * SWATCH.pitch - (SWATCH.pitch - SWATCH.size)) / 2;
  const proportions = PROPORTIONS[mode];
  const shapePath = shapePathOf(vertices);

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

        {/* ── top: the hue ring ── */}
        <g style={fade(at('wheel'))}>
          <HueRing />
        </g>

        {/* triadic: the ring in thirds / tetradic: the two complementary pairs */}
        {mode === 'triadic' &&
          vertices.map((p, i) => (
            <line
              key={i}
              x1={RING.cx}
              y1={RING.cy}
              x2={p.x}
              y2={p.y}
              stroke="#333"
              strokeWidth="1.2"
              strokeDasharray="3 3"
              style={fade(at('structure'), i * 200)}
            />
          ))}
        {mode === 'tetradic' &&
          [
            [0, 2],
            [1, 3],
          ].map(([i, j], n) => (
            <line
              key={n}
              x1={vertices[i].x}
              y1={vertices[i].y}
              x2={vertices[j].x}
              y2={vertices[j].y}
              stroke="#333"
              strokeWidth="1.2"
              strokeDasharray="3 3"
              style={fade(at('structure'), n * 400)}
            />
          ))}

        {/* the shape: a line across, a triangle or a square */}
        <path
          d={shapePath}
          pathLength={1}
          fill="none"
          stroke="#222"
          strokeWidth="2"
          strokeLinejoin="round"
          style={draw(at('shape'), 0, 1200)}
        />

        {/* the colors at the corners: the base first, then the others */}
        {vertices.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="8"
            fill={rgb(palette[i])}
            stroke="#fff"
            strokeWidth="2.5"
            style={fade(i === 0 ? at('base') : at('others'), i === 0 ? 0 : (i - 1) * 300)}
          />
        ))}

        <text
          x="115"
          y={TOP_PANEL.height - 10}
          textAnchor="middle"
          fontSize="13"
          fontWeight="bold"
          fill="#555"
          style={fade(at('feel'))}
        >
          {k('feel')}
        </text>
        <text x="10" y="17" fontSize="12" fill="#555" style={fade(at('app'))}>
          {k('app')}
        </text>

        {/* ── bottom: the palette ── */}
        {palette.map((c, i) => {
          const x = swatchX0 + i * SWATCH.pitch;
          return (
            <g
              key={i}
              style={fade(i === 0 ? at('base') : at('others'), i === 0 ? 0 : (i - 1) * 300)}
            >
              <rect
                x={x}
                y={SWATCH.y}
                width={SWATCH.size}
                height={SWATCH.size}
                rx="6"
                fill={rgb(c)}
              />
              <text
                x={x + SWATCH.size / 2}
                y={SWATCH.y + SWATCH.size + 15}
                textAnchor="middle"
                fontSize="12"
                fill="#333"
              >
                {names[i]}
              </text>
            </g>
          );
        })}

        {/* how much of each to use: one main color, the others less */}
        <g style={fade(at('main'))}>
          {proportions.map((pct, i) => {
            const before = proportions.slice(0, i).reduce((s, v) => s + v, 0);
            return (
              <rect
                key={i}
                x={BAR.x0 + (before / 100) * BAR.width}
                y={BAR.y}
                width={(pct / 100) * BAR.width}
                height={BAR.h}
                fill={rgb(palette[i])}
              />
            );
          })}
          <rect
            x={BAR.x0}
            y={BAR.y}
            width={BAR.width}
            height={BAR.h}
            rx="3"
            fill="none"
            stroke="#ccc"
          />
          <text
            x="115"
            y={BAR.y + BAR.h + 17}
            textAnchor="middle"
            fontSize="13"
            fontWeight="bold"
            fill="#555"
          >
            {k('main')}
          </text>
        </g>
      </svg>
    </div>
  );
};

export default HarmonySlide;
