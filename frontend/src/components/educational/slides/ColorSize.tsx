import { useTranslation } from 'react-i18next';
import { fade, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/color_size.py); each step starts on the word in [ ].
 */
const STEP = {
  same: 0, // "[同じ大きさでも]、色によって大きく見えたり、小さく見えたりします。"
  bright: 1, // "[明るい色や]暖かい色は大きく見え、"
  expand: 2, // "[膨張色]と呼ばれます。"
  dark: 3, // "[暗い色や]冷たい色は小さく見え、"
  contract: 4, // "[収縮色]と呼ばれます。"
  lightness: 5, // "[特に]影響が大きいのは明るさです。"
  go: 6, // "例えば[囲碁の]石は、同じ大きさに見えるように、"
  white: 7, // "[白い石が]黒い石より少し小さく作られています。"
} as const;
// When each step's words are spoken, counted from when the slide appears. Estimated from the
// reading (kana) of the Japanese narration at 8 morae/s, with pauses at 、(0.25 s) ・(0.15 s)
// 。(0.5 s) and 0.6 s before speech starts — calibrated on the hand-tuned RGB slide.
const STEP_AT_MS = [600, 5800, 8700, 10700, 13400, 15400, 18800, 21800];

// Two rounded panels: two same-size circles (top), Go stones (bottom)
const TOP_PANEL = { y: 0, height: 202 };
const BOTTOM_PANEL = { y: 210, height: 100 };

// Two circles of exactly the same size
const R = 30;
const CIRCLES = [
  { key: 'expand', x: 62, fill: '#ffd84a', outward: true, step: STEP.bright, color: '#b07a00' },
  { key: 'contract', x: 168, fill: '#1f2f6b', outward: false, step: STEP.dark, color: '#1f2f6b' },
];
const CY = 78;
const DIAGONALS = [45, 135, 225, 315];
/** Short arrows on the diagonals: pointing out of the circle, or into it */
const arrowPath = (cx: number, angle: number, outward: boolean) => {
  const a = (angle * Math.PI) / 180;
  const [r0, r1] = outward ? [R + 5, R + 15] : [R + 17, R + 7];
  const x0 = cx + r0 * Math.cos(a);
  const y0 = CY + r0 * Math.sin(a);
  const x1 = cx + r1 * Math.cos(a);
  const y1 = CY + r1 * Math.sin(a);
  // arrowhead at (x1, y1)
  const back = Math.atan2(y0 - y1, x0 - x1);
  const h = 4.5;
  const p1 = `${x1 + h * Math.cos(back + 0.5)},${y1 + h * Math.sin(back + 0.5)}`;
  const p2 = `${x1 + h * Math.cos(back - 0.5)},${y1 + h * Math.sin(back - 0.5)}`;
  return `M${x0},${y0} L${x1},${y1} M${p1} L${x1},${y1} L${p2}`;
};

// Lightness matters most: the same circle from white to black
const GRAYS = ['#ffffff', '#c8c8c8', '#8c8c8c', '#4a4a4a', '#111111'];

const ColorSize = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.color_size.${key}`);
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

        {/* ── top: two circles of the same size ── */}
        <g style={fade(step >= STEP.same)}>
          <text x="115" y="20" textAnchor="middle" fontSize="12" fill="#666">
            {k('same')}
          </text>
          {CIRCLES.map((c) => (
            <circle key={c.key} cx={c.x} cy={CY} r={R} fill={c.fill} stroke="#ccc" />
          ))}
        </g>

        {/* bright and warm colors swell; dark and cool colors shrink */}
        {CIRCLES.map((c) => (
          <g key={c.key}>
            <path
              d={DIAGONALS.map((a) => arrowPath(c.x, a, c.outward)).join(' ')}
              fill="none"
              stroke={c.color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={fade(step >= c.step)}
            />
            <text
              x={c.x}
              y={CY + R + 32}
              textAnchor="middle"
              fontSize="14"
              fontWeight="bold"
              fill={c.color}
              style={fade(step >= c.step + 1)}
            >
              {k(c.key)}
            </text>
            <text
              x={c.x}
              y={CY + R + 48}
              textAnchor="middle"
              fontSize="12"
              fill="#555"
              style={fade(step >= c.step + 1, 200)}
            >
              {k(`${c.key}Note`)}
            </text>
          </g>
        ))}

        {/* lightness has the strongest effect */}
        <g style={fade(step >= STEP.lightness)}>
          {GRAYS.map((g, i) => (
            <circle key={g} cx={50 + i * 32} cy="178" r="9" fill={g} stroke="#bbb" />
          ))}
          <text x="10" y="198" fontSize="12" fill="#555">
            {k('bigger')}
          </text>
          <text x="220" y="198" textAnchor="end" fontSize="12" fill="#555">
            {k('smaller')}
          </text>
        </g>

        {/* ── bottom: Go stones — the white ones are made slightly smaller ── */}
        <g style={fade(step >= STEP.go)}>
          <rect x="40" y={BOTTOM_PANEL.y + 8} width="150" height="64" rx="4" fill="#dcb36a" />
          {[0, 1, 2].map((i) => (
            <line
              key={`h${i}`}
              x1="40"
              y1={BOTTOM_PANEL.y + 18 + i * 22}
              x2="190"
              y2={BOTTOM_PANEL.y + 18 + i * 22}
              stroke="#8a6a30"
              strokeWidth="0.8"
            />
          ))}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <line
              key={`v${i}`}
              x1={52 + i * 25}
              y1={BOTTOM_PANEL.y + 8}
              x2={52 + i * 25}
              y2={BOTTOM_PANEL.y + 72}
              stroke="#8a6a30"
              strokeWidth="0.8"
            />
          ))}
          <circle cx="90" cy={BOTTOM_PANEL.y + 40} r="16.5" fill="#fafafa" stroke="#999" />
          <circle cx="140" cy={BOTTOM_PANEL.y + 40} r="18" fill="#151515" />
        </g>
        <text
          x="115"
          y={BOTTOM_PANEL.y + BOTTOM_PANEL.height - 9}
          textAnchor="middle"
          fontSize="13"
          fontWeight="bold"
          fill="#555"
          style={fade(step >= STEP.white)}
        >
          {k('goNote')}
        </text>
      </svg>
    </div>
  );
};

export default ColorSize;
