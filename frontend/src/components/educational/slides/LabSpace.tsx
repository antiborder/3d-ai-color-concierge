import { useTranslation } from 'react-i18next';
import { labToRgb } from '../../../utils/gamutUtils';
import {
  CENTER,
  LBar,
  LabPlaneFrame,
  LabSliceColors,
  PLANE,
  SLICE_L,
  rgb,
  toPx,
} from '../labPlane';
import { fade, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/lab_space.py); each step starts on the word in [ ].
 */
const STEP = {
  intro: 0, // "[Lab色空間は]、人の見え方に近づけた色空間です。"
  l: 1, // "[Lは]明るさで、0が黒、100が白です。"
  a: 2, // "[aは]緑から赤、"
  b: 3, // "[bは]青から黄色への軸で、人の目が、赤と緑、黄色と青を、"
  opponent: 4, // "[反対の色]として感じる仕組みにもとづいています。"
  distance: 5, // "[2つの色の]距離が、見た目の色の差にほぼ対応するので、"
  number: 6, // "色の違いを[数値で]比べられます。"
} as const;
// When each step's words are spoken, counted from when the slide appears. Estimated from the
// reading (kana) of the Japanese narration at 8 morae/s, with pauses at 、(0.25 s) ・(0.15 s)
// 。(0.5 s) and 0.6 s before speech starts — calibrated on the hand-tuned RGB slide.
const STEP_AT_MS = [600, 5100, 8600, 10100, 15200, 19000, 24000];

// Two rounded panels: the a*–b* plane and the L* bar (top), the color difference (bottom)
const TOP_PANEL = { y: 0, height: 206 };
const BOTTOM_PANEL = { y: 214, height: 96 };

// Two colors 30 apart (ΔE = 30) on the plane, shown again as swatches below
const PAIR = [
  { a: 10, b: 60 },
  { a: 40, b: 60 },
];

const SWATCH = { size: 40, y: BOTTOM_PANEL.y + 20, xs: [26, 164] };

const LabSpace = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.lab_space.${key}`);
  const step = useSlideStep(STEP_AT_MS);

  const pair = PAIR.map((p) => toPx(p.a, p.b));
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

        {/* ── top: the a*–b* plane ── */}
        <g style={fade(step >= STEP.intro)}>
          <LabPlaneFrame />
        </g>

        {/* the colors themselves, once the axes are in place */}
        <g style={{ opacity: step >= STEP.opponent ? 1 : 0, transition: 'opacity 900ms ease' }}>
          <LabSliceColors />
        </g>

        {/* a*: green ↔ red */}
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
          <text
            x={PLANE.x0 + PLANE.size - 4}
            y={CENTER.y + 15}
            textAnchor="end"
            fill="#333"
            paintOrder="stroke"
            {...axisLabel}
          >
            +a
          </text>
        </g>
        {/* b*: blue ↔ yellow */}
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
          <text
            x={CENTER.x - 5}
            y={PLANE.y0 + 15}
            textAnchor="end"
            fill="#333"
            paintOrder="stroke"
            {...axisLabel}
          >
            +b
          </text>
        </g>

        {/* L*: black (0) to white (100); the plane is cut at 60 */}
        <g style={fade(step >= STEP.l)}>
          <LBar id="labLBar" />
        </g>

        {/* distance on the plane = how different two colors look */}
        <g style={fade(step >= STEP.distance)}>
          <line
            x1={pair[0].x}
            y1={pair[0].y}
            x2={pair[1].x}
            y2={pair[1].y}
            stroke="#222"
            strokeWidth="2"
          />
          {pair.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="4" fill="#fff" stroke="#222" strokeWidth="1.5" />
          ))}
        </g>

        {/* ── bottom: the two colors and their difference ── */}
        <g style={fade(step >= STEP.distance)}>
          {PAIR.map((p, i) => (
            <rect
              key={i}
              x={SWATCH.xs[i]}
              y={SWATCH.y}
              width={SWATCH.size}
              height={SWATCH.size}
              rx="6"
              fill={rgb(labToRgb(SLICE_L, p.a, p.b))}
            />
          ))}
          <line
            x1={SWATCH.xs[0] + SWATCH.size + 4}
            y1={SWATCH.y + SWATCH.size / 2 + 6}
            x2={SWATCH.xs[1] - 4}
            y2={SWATCH.y + SWATCH.size / 2 + 6}
            stroke="#222"
            strokeWidth="2"
          />
        </g>
        <text
          x="115"
          y={SWATCH.y + SWATCH.size / 2}
          textAnchor="middle"
          fontSize="13"
          fontWeight="bold"
          fill="#222"
          style={fade(step >= STEP.number)}
        >
          {k('deltaE')}
        </text>
        <text
          x="115"
          y={SWATCH.y + SWATCH.size + 18}
          textAnchor="middle"
          fontSize="13"
          fontWeight="bold"
          fill="#555"
          style={fade(step >= STEP.number)}
        >
          {k('distance')}
        </text>
      </svg>
    </div>
  );
};

export default LabSpace;
