import { useTranslation } from 'react-i18next';
import { oklchToRgb } from '../../../utils/gamutUtils';
import { fade, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/color_weight.py); each step starts on the word in [ ].
 */
const STEP = {
  intro: 0, // "[色には]、重さの印象もあります。"
  heavy: 1, // "[暗い色は]重く、"
  light: 2, // "[明るい色は]軽く感じられます。"
  lightness: 3, // "この印象を決めるのは[主に明るさ]で、"
  hue: 4, // "[色相の]影響は小さめです。"
  example: 5, // "[例えば]、同じ箱でも、黒い箱は白い箱より重そうに見えます。"
  design: 6, // "そのため、[デザイン]では暗い色を下に、明るい色を上に置くと、"
  stable: 7, // "[安定]して見えます。"
} as const;
// When each step's words are spoken, counted from when the slide appears. Estimated from the
// reading (kana) of the Japanese narration at 8 morae/s, with pauses at 、(0.25 s) ・(0.15 s)
// 。(0.5 s) and 0.6 s before speech starts — calibrated on the hand-tuned RGB slide.
const STEP_AT_MS = [600, 3500, 4800, 9000, 10200, 12700, 18600, 22600];

// Two rounded panels: a balance with a black and a white box (top), two layouts (bottom)
const TOP_PANEL = { y: 0, height: 210 };
const BOTTOM_PANEL = { y: 218, height: 92 };

// The balance: a beam on a stand, a box on each end
const PIVOT = { x: 115, y: 70 };
const BEAM_HALF = 70;
const BOX = { w: 40, h: 34 };
const TILT_DEG = 10; // the black side goes down

// Lightness decides it: a strip from black (heavy) to white (light)
const STRIP = { x0: 30, x1: 200, y: 128, h: 12 };
// Hue matters less: six hues at one lightness (OkLCH L = 0.7) feel about as heavy
const SAME_L = [30, 90, 150, 210, 270, 330].map(
  (h) => `rgb(${oklchToRgb(0.7, 0.12, h).join(',')})`
);

// Bottom: dark at the bottom looks stable, dark at the top does not
const LAYOUTS = [
  { key: 'stableLabel', x: 24, darkOnTop: false, color: '#00813a' },
  { key: 'unstableLabel', x: 126, darkOnTop: true, color: '#888' },
];
const LAYOUT = { y: BOTTOM_PANEL.y + 10, w: 80, h: 54 };

const ColorWeight = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.color_weight.${key}`);
  const step = useSlideStep(STEP_AT_MS);
  const tilt = step >= STEP.example ? TILT_DEG : 0;

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
          <linearGradient id="colorWeightStrip" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#111" />
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

        {/* ── top: a balance with a black box and a white box ── */}
        <g style={fade(step >= STEP.intro)}>
          {/* stand */}
          <path d={`M${PIVOT.x},${PIVOT.y} l-14,34 h28 Z`} fill="#c9ccd3" />
          {/* beam and boxes; the whole beam tilts when the example is given */}
          <g
            style={{
              transform: `rotate(${-tilt}deg)`,
              transformOrigin: `${PIVOT.x}px ${PIVOT.y}px`,
              transition: 'transform 1200ms ease',
            }}
          >
            <rect
              x={PIVOT.x - BEAM_HALF}
              y={PIVOT.y - 3}
              width={BEAM_HALF * 2}
              height="6"
              rx="3"
              fill="#9aa0ab"
            />
            {[
              { x: PIVOT.x - BEAM_HALF, fill: '#1a1a1a', stroke: '#1a1a1a' },
              { x: PIVOT.x + BEAM_HALF, fill: '#ffffff', stroke: '#bbb' },
            ].map((b, i) => (
              <rect
                key={i}
                x={b.x - BOX.w / 2}
                y={PIVOT.y - 3 - BOX.h}
                width={BOX.w}
                height={BOX.h}
                rx="3"
                fill={b.fill}
                stroke={b.stroke}
              />
            ))}
          </g>
          <circle cx={PIVOT.x} cy={PIVOT.y} r="3" fill="#666" />
        </g>
        {/* labels below the boxes */}
        <text
          x={PIVOT.x - BEAM_HALF}
          y={PIVOT.y + 30}
          textAnchor="middle"
          fontSize="14"
          fontWeight="bold"
          fill="#1a1a1a"
          style={fade(step >= STEP.heavy)}
        >
          {k('heavy')}
        </text>
        <text
          x={PIVOT.x + BEAM_HALF}
          y={PIVOT.y + 30}
          textAnchor="middle"
          fontSize="14"
          fontWeight="bold"
          fill="#777"
          style={fade(step >= STEP.light)}
        >
          {k('light')}
        </text>

        {/* lightness decides it */}
        <g style={fade(step >= STEP.lightness)}>
          <rect
            x={STRIP.x0}
            y={STRIP.y}
            width={STRIP.x1 - STRIP.x0}
            height={STRIP.h}
            rx="3"
            fill="url(#colorWeightStrip)"
            stroke="#ccc"
          />
          <text x={STRIP.x0} y={STRIP.y - 5} fontSize="12" fill="#555">
            {k('heavy')}
          </text>
          <text x={STRIP.x1} y={STRIP.y - 5} textAnchor="end" fontSize="12" fill="#555">
            {k('light')}
          </text>
          <text
            x="115"
            y={STRIP.y - 5}
            textAnchor="middle"
            fontSize="12"
            fontWeight="bold"
            fill="#333"
          >
            {k('lightness')}
          </text>
        </g>

        {/* hue matters less */}
        <g style={fade(step >= STEP.hue)}>
          {SAME_L.map((c, i) => (
            <rect key={i} x={46 + i * 24} y="160" width="18" height="18" rx="4" fill={c} />
          ))}
          <text x="115" y="198" textAnchor="middle" fontSize="12" fill="#555">
            {k('hueNote')}
          </text>
        </g>

        {/* ── bottom: dark at the bottom looks stable ── */}
        {LAYOUTS.map((l) => (
          <g key={l.key} style={fade(step >= STEP.design)}>
            <rect
              x={l.x}
              y={LAYOUT.y}
              width={LAYOUT.w}
              height={LAYOUT.h}
              rx="4"
              fill="#f2efe6"
              stroke="#ccc"
            />
            <rect
              x={l.x}
              y={l.darkOnTop ? LAYOUT.y : LAYOUT.y + LAYOUT.h * 0.6}
              width={LAYOUT.w}
              height={LAYOUT.h * 0.4}
              rx="4"
              fill="#23324f"
            />
          </g>
        ))}
        {LAYOUTS.map((l) => (
          <text
            key={l.key}
            x={l.x + LAYOUT.w / 2}
            y={LAYOUT.y + LAYOUT.h + 18}
            textAnchor="middle"
            fontSize="13"
            fontWeight="bold"
            fill={l.color}
            style={fade(step >= STEP.stable)}
          >
            {k(l.key)}
          </text>
        ))}
      </svg>
    </div>
  );
};

export default ColorWeight;
