import { useTranslation } from 'react-i18next';
import { fade, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/color_illusion.py); each step starts on the word in [ ].
 */
const STEP = {
  intro: 0, // "[色の錯視は]、まわりの色などの影響で、色が実際とは違って見える現象です。"
  contrast: 1, // "例えば、[同じ灰色]でも、白い背景の上では暗く、"
  reveal: 2, // "[黒い背景]の上では明るく見えます。"
  stare: 3, // "また、[赤い色を]しばらく見つめてから白い面を見ると、"
  after: 4, // "[青緑]の残像が見えます。"
  cause: 5, // "これは、目の[錐体が]疲れて、反対の色が浮かび上がるためです。"
} as const;
// When each step's words are spoken, counted from when the slide appears. Estimated from the
// reading (kana) of the Japanese narration at 8 morae/s, with pauses at 、(0.25 s) ・(0.15 s)
// 。(0.5 s) and 0.6 s before speech starts — calibrated on the hand-tuned RGB slide.
const STEP_AT_MS = [600, 7700, 11200, 14700, 18100, 21400];

// Two rounded panels: the same gray on white and on black (top), an afterimage (bottom)
const TOP_PANEL = { y: 0, height: 170 };
const BOTTOM_PANEL = { y: 178, height: 132 };

// Top: two backgrounds with exactly the same gray square on each
const GRAY = '#8a8a8a';
const BG = [
  { key: 'onWhite', x: 14, fill: '#ffffff', stroke: '#ccc' },
  { key: 'onBlack', x: 118, fill: '#111111', stroke: '#111' },
];
const BOX = { y: 12, w: 98, h: 96 };
const SQ = 34;

// Bottom: stare at red, then a cyan afterimage appears on white
const AFTER = { y: BOTTOM_PANEL.y + 14, w: 86, h: 66, xs: [22, 122] };

const ColorIllusion = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.color_illusion.${key}`);
  const step = useSlideStep(STEP_AT_MS);
  const sqY = BOX.y + (BOX.h - SQ) / 2;

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

        {/* ── top: the same gray on white and on black ── */}
        {BG.map((b) => (
          <g key={b.key}>
            <g style={fade(step >= STEP.intro)}>
              <rect
                x={b.x}
                y={BOX.y}
                width={BOX.w}
                height={BOX.h}
                rx="6"
                fill={b.fill}
                stroke={b.stroke}
              />
            </g>
            <g style={fade(step >= STEP.contrast)}>
              <rect x={b.x + (BOX.w - SQ) / 2} y={sqY} width={SQ} height={SQ} fill={GRAY} />
              <text
                x={b.x + BOX.w / 2}
                y={BOX.y + BOX.h + 17}
                textAnchor="middle"
                fontSize="12"
                fill="#555"
              >
                {k(b.key)}
              </text>
            </g>
          </g>
        ))}
        {/* joined by a bar of the same gray: they were one color all along */}
        <g style={fade(step >= STEP.reveal, 1200)}>
          <rect
            x={BG[0].x + (BOX.w + SQ) / 2}
            y={sqY + SQ / 2 - 5}
            width={BG[1].x + (BOX.w - SQ) / 2 - (BG[0].x + (BOX.w + SQ) / 2)}
            height="10"
            fill={GRAY}
          />
          <text
            x="115"
            y={TOP_PANEL.height - 12}
            textAnchor="middle"
            fontSize="13"
            fontWeight="bold"
            fill="#333"
          >
            {k('same')}
          </text>
        </g>

        {/* ── bottom: an afterimage ── */}
        <g style={fade(step >= STEP.stare)}>
          <rect
            x={AFTER.xs[0]}
            y={AFTER.y}
            width={AFTER.w}
            height={AFTER.h}
            rx="6"
            fill="#fff"
            stroke="#ccc"
          />
          <circle cx={AFTER.xs[0] + AFTER.w / 2} cy={AFTER.y + AFTER.h / 2} r="20" fill="#e0201b" />
          <text
            x={AFTER.xs[0] + AFTER.w / 2}
            y={AFTER.y + AFTER.h + 17}
            textAnchor="middle"
            fontSize="12"
            fill="#555"
          >
            {k('stare')}
          </text>
          <path
            d={`M${AFTER.xs[0] + AFTER.w + 4},${AFTER.y + AFTER.h / 2} h10 m-5,-4 l5,4 l-5,4`}
            fill="none"
            stroke="#555"
            strokeWidth="1.8"
          />
          <rect
            x={AFTER.xs[1]}
            y={AFTER.y}
            width={AFTER.w}
            height={AFTER.h}
            rx="6"
            fill="#fff"
            stroke="#ccc"
          />
        </g>
        <g style={fade(step >= STEP.after)}>
          <circle
            cx={AFTER.xs[1] + AFTER.w / 2}
            cy={AFTER.y + AFTER.h / 2}
            r="20"
            fill="#3fd0c8"
            opacity="0.35"
          />
          <text
            x={AFTER.xs[1] + AFTER.w / 2}
            y={AFTER.y + AFTER.h + 17}
            textAnchor="middle"
            fontSize="12"
            fill="#555"
          >
            {k('afterimage')}
          </text>
        </g>
        <text
          x="115"
          y={BOTTOM_PANEL.y + BOTTOM_PANEL.height - 12}
          textAnchor="middle"
          fontSize="12"
          fill="#555"
          style={fade(step >= STEP.cause)}
        >
          {k('cause')}
        </text>
      </svg>
    </div>
  );
};

export default ColorIllusion;
