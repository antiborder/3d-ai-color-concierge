import { useTranslation } from 'react-i18next';
import { SPECTRUM_STOPS } from '../ConeSensitivityChart';
import { CONE_NM_MAX, CONE_NM_MIN } from '../coneFundamentals';
import { draw, fade, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/hue_circle.py); each step starts on the word in [ ].
 */
const STEP = {
  ring: 0, // "[色相環は]、色相を円の上に順番に並べたものです。"
  red: 1, // "[赤]・"
  yellow: 2, // "[黄色]・"
  green: 3, // "[緑]・"
  cyan: 4, // "[シアン]・"
  blue: 5, // "[青]・"
  magenta: 6, // "[マゼンタ]と並び、"
  next: 7, // "マゼンタの[次は]また赤につながります。"
  rainbow: 8, // "[虹の色は]赤から始まり紫で終わりますが、色相環では、"
  bridge: 9, // "[虹にない]マゼンタが両端をつないで、"
  loop: 10, // "[輪に]なります。"
  opposite: 11, // "円の[向かい側に]ある色どうしは補色で、補色どうしの光を混ぜると白になります。"
} as const;
// When each step's words are spoken, counted from when the slide appears. Estimated from the
// reading (kana) of the Japanese narration at 8 morae/s, with pauses at 、(0.25 s) ・(0.15 s)
// 。(0.5 s) and 0.6 s before speech starts — calibrated on the hand-tuned RGB slide.
const STEP_AT_MS = [600, 5200, 5600, 6200, 6700, 7200, 7600, 9500, 11700, 16400, 19000, 20600];

// Two rounded panels: the wheel (top), the rainbow whose ends magenta joins (bottom)
const TOP_PANEL = { y: 0, height: 206 };
const BOTTOM_PANEL = { y: 214, height: 96 };

const hsl = (h: number) => `hsl(${h} 100% 50%)`;

// The wheel: red at the top, hues running clockwise
const RING = { cx: 115, cy: 103, outer: 66, inner: 42, label: 92 };
const pointAt = (h: number, r: number) => {
  const a = ((h - 90) * Math.PI) / 180;
  return { x: RING.cx + r * Math.cos(a), y: RING.cy + r * Math.sin(a) };
};
const SEG_DEG = 5;
const SEGMENTS = Array.from({ length: 360 / SEG_DEG }, (_, i) => i * SEG_DEG);
const segPath = (h: number) => {
  const h0 = h - SEG_DEG / 2 - 0.4;
  const h1 = h + SEG_DEG / 2 + 0.4;
  const [a, b, c, d] = [
    pointAt(h0, RING.outer),
    pointAt(h1, RING.outer),
    pointAt(h1, RING.inner),
    pointAt(h0, RING.inner),
  ].map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`);
  return `M${a} A${RING.outer},${RING.outer} 0 0 1 ${b} L${c} A${RING.inner},${RING.inner} 0 0 0 ${d} Z`;
};
/** Arc along the ring's middle, from hue h0 clockwise to h1 */
const arcPath = (h0: number, h1: number, r: number) => {
  const a = pointAt(h0, r);
  const b = pointAt(h1, r);
  const large = h1 - h0 > 180 ? 1 : 0;
  return `M${a.x.toFixed(2)},${a.y.toFixed(2)} A${r},${r} 0 ${large} 1 ${b.x.toFixed(2)},${b.y.toFixed(2)}`;
};

const HUES = [
  { key: 'red', h: 0, step: STEP.red },
  { key: 'yellow', h: 60, step: STEP.yellow },
  { key: 'green', h: 120, step: STEP.green },
  { key: 'cyan', h: 180, step: STEP.cyan },
  { key: 'blue', h: 240, step: STEP.blue },
  { key: 'magenta', h: 300, step: STEP.magenta },
];
// Complementary pair shown: yellow and blue
const PAIR = [60, 240];

// Bottom: the rainbow, red to violet, and magenta joining its two ends
const BAR = { x0: 30, x1: 200, y: BOTTOM_PANEL.y + 30, h: 14 };

const HueCircle = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.hue_circle.${key}`);
  const step = useSlideStep(STEP_AT_MS);

  const midR = (RING.outer + RING.inner) / 2;
  const [p0, p1] = PAIR.map((h) => pointAt(h, RING.inner - 4));
  const bridgeY = BAR.y + BAR.h + 12; // the magenta curve's control points sit 10 below this

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
          {/* the rainbow runs from red (left) to violet (right): the spectrum reversed */}
          <linearGradient id="hueCircleRainbow" x1="100%" y1="0%" x2="0%" y2="0%">
            {SPECTRUM_STOPS.map(([nm, color]) => (
              <stop
                key={nm}
                offset={`${((nm - CONE_NM_MIN) / (CONE_NM_MAX - CONE_NM_MIN)) * 100}%`}
                stopColor={color}
              />
            ))}
          </linearGradient>
          <marker
            id="hueCircleArrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 Z" fill="#333" />
          </marker>
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

        {/* ── top: hues in order around a circle ── */}
        <g style={fade(step >= STEP.ring)}>
          {SEGMENTS.map((h) => (
            <path key={h} d={segPath(h)} fill={hsl(h)} />
          ))}
        </g>
        {HUES.map((c) => {
          const dot = pointAt(c.h, midR);
          const label = pointAt(c.h, RING.label);
          return (
            <g key={c.key} style={fade(step >= c.step)}>
              <circle cx={dot.x} cy={dot.y} r="5" fill="#fff" stroke="#333" strokeWidth="1.5" />
              <text
                x={label.x}
                y={label.y + 5}
                textAnchor="middle"
                fontSize="13"
                fontWeight="bold"
                fill="#333"
              >
                {k(c.key)}
              </text>
            </g>
          );
        })}
        {/* after magenta comes red again */}
        <path
          d={arcPath(322, 352, RING.outer + 7)}
          fill="none"
          stroke="#333"
          strokeWidth="1.8"
          markerEnd="url(#hueCircleArrow)"
          style={fade(step >= STEP.next)}
        />
        {/* the part of the wheel that isn't in the rainbow */}
        <path
          d={arcPath(270, 345, RING.inner - 5)}
          fill="none"
          stroke="#b0009a"
          strokeWidth="3"
          strokeLinecap="round"
          pathLength={1}
          style={draw(step >= STEP.bridge, 0, 900)}
        />

        {/* complementary colors face each other */}
        <line
          x1={p0.x}
          y1={p0.y}
          x2={p1.x}
          y2={p1.y}
          stroke="#333"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          style={fade(step >= STEP.opposite)}
        />
        <text
          x={RING.cx}
          y={RING.cy - 8}
          textAnchor="middle"
          fontSize="13"
          fontWeight="bold"
          fill="#333"
          stroke="#fff"
          strokeWidth="3"
          paintOrder="stroke"
          style={fade(step >= STEP.opposite, 300)}
        >
          {k('complementary')}
        </text>

        {/* ── bottom: the rainbow ends at violet; magenta joins the ends ── */}
        <g style={fade(step >= STEP.rainbow)}>
          <rect
            x={BAR.x0}
            y={BAR.y}
            width={BAR.x1 - BAR.x0}
            height={BAR.h}
            rx="3"
            fill="url(#hueCircleRainbow)"
          />
          <text x={BAR.x0} y={BAR.y - 8} fontSize="13" fontWeight="bold" fill="#555">
            {k('rainbow')}
          </text>
        </g>
        <g style={fade(step >= STEP.bridge)}>
          <path
            d={`M${BAR.x1},${BAR.y + BAR.h + 2} C${BAR.x1 + 18},${bridgeY + 10} ${BAR.x0 - 18},${bridgeY + 10} ${BAR.x0},${BAR.y + BAR.h + 2}`}
            fill="none"
            stroke="#e000c0"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <text
            x="140"
            y={bridgeY + 28}
            textAnchor="end"
            fontSize="13"
            fontWeight="bold"
            fill="#b0009a"
          >
            {k('bridge')}
          </text>
        </g>
        <text
          x="146"
          y={bridgeY + 28}
          fontSize="13"
          fontWeight="bold"
          fill="#333"
          style={fade(step >= STEP.loop)}
        >
          {k('loop')}
        </text>
      </svg>
    </div>
  );
};

export default HueCircle;
