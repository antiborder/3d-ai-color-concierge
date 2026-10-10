import { useTranslation } from 'react-i18next';
import { labToRgb, oklabToRgb, rgbToLab, rgbToOklab } from '../../../utils/gamutUtils';
import {
  CENTER,
  LBar,
  LabPlaneFrame,
  LabSliceColors,
  OKLAB,
  PLANE,
  rgb,
  toPxIn,
} from '../labPlane';
import { fade, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/oklab_space.py); each step starts on the word in [ ].
 */
const STEP = {
  intro: 0, // "[OKLab色空間は]、Labを改良した、新しい色空間です。"
  l: 1, // "[Lは]明るさ、"
  a: 2, // "[aは]緑から赤、"
  b: 3, // "[bは]青から黄色への軸で、"
  colors: 4, // "[考え方は]Labと同じです。"
  blue: 5, // "目の錐体の反応をもとに作り直したことで、Labでずれやすかった[青のあたり]も、見た目どおりに並ぶようになりました。"
  gradient: 6, // "そのため、2つの色の間をなめらかにつなぐ[グラデーション]も、自然な色になります。"
} as const;
// When each step's words are spoken, counted from when the slide appears. Estimated from the
// reading (kana) of the Japanese narration at 8 morae/s, with pauses at 、(0.25 s) ・(0.15 s)
// 。(0.5 s) and 0.6 s before speech starts — calibrated on the hand-tuned RGB slide.
const STEP_AT_MS = [600, 6000, 7100, 8600, 10700, 17700, 24700];

// Two rounded panels: the a–b plane and the Lightness bar (top), blue → white in Lab and OKLab (bottom)
const TOP_PANEL = { y: 0, height: 186 };
const BOTTOM_PANEL = { y: 194, height: 116 };

// Where the blues are on the plane
const BLUE_SPOT = { a: -0.03, b: -0.14, r: 20 };

// Bottom: the same blue → white gradient, mixed in Lab and in OKLab
type RGB = [number, number, number];
const BLUE: RGB = [0, 0, 255];
const WHITE: RGB = [255, 255, 255];
const STEPS = 24;
const lerp3 = (p: number[], q: number[], t: number) => p.map((v, i) => v + (q[i] - v) * t);
const gradient = (
  to: (c: RGB) => [number, number, number],
  back: (L: number, a: number, b: number) => RGB
) => {
  const [p, q] = [to(BLUE), to(WHITE)];
  return Array.from({ length: STEPS }, (_, i) => {
    const [L, a, b] = lerp3(p, q, i / (STEPS - 1));
    return rgb(back(L, a, b));
  });
};
const ROWS = [
  { key: 'Lab', colors: gradient((c) => rgbToLab(...c), labToRgb), step: STEP.blue },
  { key: 'OKLab', colors: gradient((c) => rgbToOklab(...c), oklabToRgb), step: STEP.gradient },
];
const ROW = { x0: 62, width: 156, h: 22, y0: BOTTOM_PANEL.y + 30, pitch: 32 };

const OklabSpace = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.oklab_space.${key}`);
  const step = useSlideStep(STEP_AT_MS);

  const blue = toPxIn(OKLAB, BLUE_SPOT.a, BLUE_SPOT.b);
  const axisLabel = { fontSize: 13, fontWeight: 'bold', stroke: '#fff', strokeWidth: 3 } as const;

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

        {/* ── top: the a–b plane, as in Lab ── */}
        <g style={fade(step >= STEP.intro)}>
          <LabPlaneFrame />
        </g>
        <g style={{ opacity: step >= STEP.colors ? 1 : 0, transition: 'opacity 900ms ease' }}>
          <LabSliceColors space={OKLAB} />
        </g>

        {/* a: green ↔ red */}
        <g style={fade(step >= STEP.a)}>
          <line
            x1={PLANE.x0 + 4}
            y1={CENTER.y}
            x2={PLANE.x0 + PLANE.size - 4}
            y2={CENTER.y}
            stroke="#333"
            strokeWidth="1.2"
          />
          <text x={PLANE.x0 + 4} y={CENTER.y - 6} fill="#00813a" paintOrder="stroke" {...axisLabel}>
            {k('green')}
          </text>
          <text
            x={PLANE.x0 + PLANE.size - 4}
            y={CENTER.y - 6}
            textAnchor="end"
            fill="#c0102a"
            paintOrder="stroke"
            {...axisLabel}
          >
            {k('red')}
          </text>
        </g>
        {/* b: blue ↔ yellow */}
        <g style={fade(step >= STEP.b)}>
          <line
            x1={CENTER.x}
            y1={PLANE.y0 + 4}
            x2={CENTER.x}
            y2={PLANE.y0 + PLANE.size - 4}
            stroke="#333"
            strokeWidth="1.2"
          />
          <text
            x={CENTER.x + 5}
            y={PLANE.y0 + 15}
            fill="#9a7a00"
            paintOrder="stroke"
            {...axisLabel}
          >
            {k('yellow')}
          </text>
          <text
            x={CENTER.x + 5}
            y={PLANE.y0 + PLANE.size - 6}
            fill="#1f4fd8"
            paintOrder="stroke"
            {...axisLabel}
          >
            {k('blue')}
          </text>
        </g>

        {/* L: lightness */}
        <g style={fade(step >= STEP.l)}>
          <LBar id="oklabLBar" space={OKLAB} />
        </g>

        {/* the blues now line up with how they look */}
        <circle
          cx={blue.x}
          cy={blue.y}
          r={BLUE_SPOT.r}
          fill="none"
          stroke="#222"
          strokeWidth="2"
          strokeDasharray="4 3"
          style={fade(step >= STEP.blue)}
        />

        {/* ── bottom: blue → white, mixed in Lab and in OKLab ── */}
        <text
          x="115"
          y={BOTTOM_PANEL.y + 18}
          textAnchor="middle"
          fontSize="13"
          fontWeight="bold"
          fill="#555"
          style={fade(step >= STEP.blue)}
        >
          {k('gradientTitle')}
        </text>
        {ROWS.map((row, r) => {
          const y = ROW.y0 + r * ROW.pitch;
          const w = ROW.width / STEPS;
          return (
            <g key={row.key} style={fade(step >= row.step)}>
              <text x="12" y={y + 16} fontSize="13" fontWeight="bold" fill="#333">
                {row.key}
              </text>
              {row.colors.map((c, i) => (
                <rect key={i} x={ROW.x0 + i * w} y={y} width={w + 0.4} height={ROW.h} fill={c} />
              ))}
              <rect
                x={ROW.x0}
                y={y}
                width={ROW.width}
                height={ROW.h}
                rx="3"
                fill="none"
                stroke="#ccc"
              />
            </g>
          );
        })}
        <text
          x="115"
          y={BOTTOM_PANEL.y + BOTTOM_PANEL.height - 10}
          textAnchor="middle"
          fontSize="12"
          fill="#555"
          style={fade(step >= STEP.gradient, 400)}
        >
          {k('gradientNote')}
        </text>
      </svg>
    </div>
  );
};

export default OklabSpace;
