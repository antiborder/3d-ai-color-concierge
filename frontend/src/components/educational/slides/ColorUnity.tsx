import { useTranslation } from 'react-i18next';
import { type RGB, hslToRgb, rgb } from '../slideColors';
import { fade, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/color_unity.py); each step starts on the word in [ ].
 */
const STEP = {
  intro: 0, // "[色の統一感を出すには]、主に3つの方法があります。"
  hue: 1, // "[1つ目は]、色相をそろえることです。"
  tone: 2, // "[2つ目は]、トーンをそろえて、明るさや鮮やかさを近づけることです。"
  count: 3, // "[3つ目は]、使う色の数を絞ることです。"
  messy: 4, // "色相もトーンも[ばらばら]だと、まとまりのない印象になります。"
} as const;
// When each step's words are spoken, counted from when the slide appears. Estimated from the
// reading (kana) of the Japanese narration at 8 morae/s, with pauses at 、(0.25 s) ・(0.15 s)
// 。(0.5 s) and 0.6 s before speech starts — calibrated on the hand-tuned RGB slide.
const STEP_AT_MS = [600, 5100, 8100, 13200, 17700];

// Two rounded panels: three ways to unify (top), the opposite (bottom)
const TOP_PANEL = { y: 0, height: 200 };
const BOTTOM_PANEL = { y: 208, height: 102 };

const hsl = (h: number, s: number, l: number): RGB => hslToRgb(h, s, l);
const METHODS: Array<{ key: string; step: number; colors: RGB[] }> = [
  {
    // one hue (blue), different tones
    key: 'hue',
    step: STEP.hue,
    colors: [
      hsl(205, 70, 85),
      hsl(205, 60, 68),
      hsl(205, 55, 52),
      hsl(205, 60, 38),
      hsl(205, 65, 24),
    ],
  },
  {
    // one tone (soft, medium-light), different hues
    key: 'tone',
    step: STEP.tone,
    colors: [0, 45, 120, 200, 275].map((h) => hsl(h, 50, 70)),
  },
  {
    // few colors
    key: 'count',
    step: STEP.count,
    colors: [hsl(220, 45, 28), hsl(40, 40, 92), hsl(25, 85, 55)],
  },
];
const ROW = { y0: 12, pitch: 62, size: 28, swatchPitch: 34, x0: 30 };

// Bottom: hues and tones all different
const MESSY: RGB[] = [
  hsl(0, 90, 50),
  hsl(150, 30, 80),
  hsl(270, 80, 30),
  hsl(55, 100, 60),
  hsl(200, 20, 45),
];

const ColorUnity = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.color_unity.${key}`);
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

        {/* ── top: three ways to unify colors ── */}
        {METHODS.map((m, r) => {
          const y = ROW.y0 + r * ROW.pitch;
          return (
            <g key={m.key} style={fade(step >= m.step)}>
              <text x={ROW.x0} y={y + 12} fontSize="13" fontWeight="bold" fill="#333">
                {k(m.key)}
              </text>
              {m.colors.map((c, i) => (
                <rect
                  key={i}
                  x={ROW.x0 + i * ROW.swatchPitch}
                  y={y + 20}
                  width={ROW.size}
                  height={ROW.size}
                  rx="5"
                  fill={rgb(c)}
                  stroke="#ddd"
                />
              ))}
            </g>
          );
        })}

        {/* ── bottom: everything different ── */}
        <g style={fade(step >= STEP.messy)}>
          <text x={ROW.x0} y={BOTTOM_PANEL.y + 20} fontSize="13" fontWeight="bold" fill="#333">
            {k('messy')}
          </text>
          {MESSY.map((c, i) => (
            <rect
              key={i}
              x={ROW.x0 + i * ROW.swatchPitch}
              y={BOTTOM_PANEL.y + 28}
              width={ROW.size}
              height={ROW.size}
              rx="5"
              fill={rgb(c)}
            />
          ))}
          <text
            x="212"
            y={BOTTOM_PANEL.y + 50}
            textAnchor="middle"
            fontSize="20"
            fontWeight="bold"
            fill="#c0102a"
          >
            ×
          </text>
          <text
            x="115"
            y={BOTTOM_PANEL.y + BOTTOM_PANEL.height - 12}
            textAnchor="middle"
            fontSize="12"
            fill="#555"
          >
            {k('messyNote')}
          </text>
        </g>
      </svg>
    </div>
  );
};

export default ColorUnity;
