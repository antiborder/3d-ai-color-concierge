import { useTranslation } from 'react-i18next';
import { fade, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/light_pigment_primary_relation.py); each step starts on
 * the word in [ ].
 */
const STEP = {
  wheel: 0, // "[光の三原色と色材の三原色は]、補色の関係にあります。"
  red: 1, // "[赤]・"
  green: 2, // "[緑]・"
  blue: 3, // "[青]の間に、隣り合う2色を混ぜた色を置くと、"
  yellow: 4, // "[黄色]・"
  cyan: 5, // "[シアン]・"
  magenta: 6, // "[マゼンタ]、つまり色材の三原色が並びます。"
  opposite: 7, // "[向かい合う]色どうしが補色で、"
  pairRC: 8, // "[赤とシアン]、"
  pairGM: 9, // "[緑とマゼンタ]、"
  pairBY: 10, // "[青と黄色]の組です。"
  absorb: 11, // "そのため色材は、補色にあたる光を[吸収]します。"
} as const;
// When each step's words are spoken, counted from when the slide appears. Estimated from the
// reading (kana) of the Japanese narration at 8 morae/s, with pauses at 、(0.25 s) ・(0.15 s)
// 。(0.5 s) and 0.6 s before speech starts — calibrated on the hand-tuned RGB slide.
const STEP_AT_MS = [600, 5800, 6200, 6800, 10400, 10900, 11500, 15200, 17300, 18300, 19600, 24200];
const ROW_INTERVAL_MS = 500;

// Two rounded panels: the color wheel (top), what each pigment absorbs (bottom)
const TOP_PANEL = { y: 0, height: 215 };
const BOTTOM_PANEL = { y: 223, height: 87 };

// Six colors around a circle: light primaries and pigment primaries alternate, so each pigment
// sits between the two lights it is made of, opposite the light it absorbs
const WHEEL = { cx: 115, cy: 108, r: 66, dotR: 14 };
const COLORS = {
  red: { angle: -90, color: '#ff0000', step: STEP.red },
  yellow: { angle: -30, color: '#ffff00', step: STEP.yellow },
  green: { angle: 30, color: '#00ff00', step: STEP.green },
  cyan: { angle: 90, color: '#00ffff', step: STEP.cyan },
  blue: { angle: 150, color: '#0000ff', step: STEP.blue },
  magenta: { angle: 210, color: '#ff00ff', step: STEP.magenta },
} as const;
type ColorKey = keyof typeof COLORS;
const ORDER: ColorKey[] = ['red', 'yellow', 'green', 'cyan', 'blue', 'magenta'];
const PAIRS: Array<{ a: ColorKey; b: ColorKey; step: number }> = [
  { a: 'red', b: 'cyan', step: STEP.pairRC },
  { a: 'green', b: 'magenta', step: STEP.pairGM },
  { a: 'blue', b: 'yellow', step: STEP.pairBY },
];
const at = (key: ColorKey, r: number = WHEEL.r) => {
  const a = (COLORS[key].angle * Math.PI) / 180;
  return { x: WHEEL.cx + r * Math.cos(a), y: WHEEL.cy + r * Math.sin(a) };
};

// Bottom: each pigment and the light it absorbs
const ROWS: Array<{ ink: ColorKey; light: ColorKey }> = [
  { ink: 'cyan', light: 'red' },
  { ink: 'magenta', light: 'green' },
  { ink: 'yellow', light: 'blue' },
];
const ROW = { y0: BOTTOM_PANEL.y + 30, gap: 19, swatch: 14, nameX: 36, arrowX: 120, dotX: 150 };

const LightPigmentPrimaryRelation = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.light_pigment_primary_relation.${key}`);
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

        {/* ── top: the six colors around a circle ── */}
        <polygon
          points={ORDER.map((key) => {
            const p = at(key);
            return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
          }).join(' ')}
          fill="none"
          stroke="#ccc"
          strokeWidth="1.5"
          style={fade(step >= STEP.wheel)}
        />

        {/* opposite colors are complementary */}
        {PAIRS.map(({ a, b, step: pairStep }) => {
          const p = at(a, WHEEL.r - WHEEL.dotR);
          const q = at(b, WHEEL.r - WHEEL.dotR);
          const highlighted = step >= pairStep;
          return (
            <line
              key={a}
              x1={p.x}
              y1={p.y}
              x2={q.x}
              y2={q.y}
              stroke={highlighted ? '#333' : '#999'}
              strokeWidth={highlighted ? 2.5 : 1}
              strokeDasharray={highlighted ? undefined : '3 3'}
              style={{
                ...fade(step >= STEP.opposite),
                transition: 'opacity 600ms ease, stroke 400ms ease, stroke-width 400ms ease',
              }}
            />
          );
        })}

        {ORDER.map((key) => {
          const p = at(key);
          // Labels sit above the dots in the upper half and below them in the lower half, so
          // long names never run off the sides
          const below = p.y > WHEEL.cy;
          const label = { x: p.x, y: p.y + (below ? WHEEL.dotR + 12 : -(WHEEL.dotR + 8)) };
          return (
            <g key={key} style={fade(step >= COLORS[key].step)}>
              <circle
                cx={p.x}
                cy={p.y}
                r={WHEEL.dotR}
                fill={COLORS[key].color}
                stroke="#fff"
                strokeWidth="2"
              />
              <text
                x={label.x}
                y={label.y + 5}
                textAnchor="middle"
                fontSize="13"
                fontWeight="bold"
                fill="#333"
              >
                {k(key)}
              </text>
            </g>
          );
        })}

        {/* ── bottom: each pigment absorbs its complementary light ── */}
        <text
          x="12"
          y={BOTTOM_PANEL.y + 18}
          fontSize="13"
          fontWeight="bold"
          fill="#333"
          style={fade(step >= STEP.absorb)}
        >
          {k('absorbs')}
        </text>
        {ROWS.map((row, i) => {
          const y = ROW.y0 + i * ROW.gap;
          return (
            <g key={row.ink} style={fade(step >= STEP.absorb, (i + 1) * ROW_INTERVAL_MS)}>
              <rect
                x="16"
                y={y - ROW.swatch / 2}
                width={ROW.swatch}
                height={ROW.swatch}
                rx="3"
                fill={COLORS[row.ink].color}
                stroke="#ccc"
              />
              <text x={ROW.nameX} y={y + 5} fontSize="13" fill="#333">
                {k(row.ink)}
              </text>
              <text x={ROW.arrowX} y={y + 5} textAnchor="middle" fontSize="13" fill="#555">
                →
              </text>
              <circle cx={ROW.dotX} cy={y} r="7" fill={COLORS[row.light].color} />
              <path
                d={`M${ROW.dotX - 6},${y - 6} l12,12 M${ROW.dotX + 6},${y - 6} l-12,12`}
                stroke="#333"
                strokeWidth="1.8"
              />
              <text x={ROW.dotX + 14} y={y + 5} fontSize="13" fill="#333">
                {k(row.light)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default LightPigmentPrimaryRelation;
