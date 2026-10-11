import { useTranslation } from 'react-i18next';
import { type RGB, contrastRatio, grayOf, rgb } from '../slideColors';
import { fade, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/contrast_readability.py); each step starts on the word in [ ].
 */
const STEP = {
  intro: 0, // "[文字の読みやすさは]、色相の違いよりも、文字と背景の明るさの差で決まります。"
  ratio: 1, // "この差を表すのが[コントラスト比]で、"
  bw: 2, // "[黒と白]なら21対1、"
  same: 3, // "[同じ色]なら1対1です。"
  guideline: 4, // "[ウェブの]アクセシビリティの基準では、本文には4.5対1以上が目安とされています。"
  redGreen: 5, // "[赤と緑]のように、色相が違っても明るさが近いと、読みにくくなります。"
} as const;
// When each step's words are spoken, counted from when the slide appears. Estimated from the
// reading (kana) of the Japanese narration at 8 morae/s, with pauses at 、(0.25 s) ・(0.15 s)
// 。(0.5 s) and 0.6 s before speech starts — calibrated on the hand-tuned RGB slide.
const STEP_AT_MS = [600, 7800, 9100, 11400, 13700, 20400];

// Two rounded panels: text on backgrounds with their contrast ratios (top), red on green (bottom)
const TOP_PANEL = { y: 0, height: 150 };
const BOTTOM_PANEL = { y: 158, height: 152 };

const SAMPLES: Array<{ key: string; fg: RGB; bg: RGB; step: number }> = [
  { key: 'bw', fg: [0, 0, 0], bg: [255, 255, 255], step: STEP.bw },
  { key: 'same', fg: [128, 128, 128], bg: [128, 128, 128], step: STEP.same },
  { key: 'guide', fg: [118, 118, 118], bg: [255, 255, 255], step: STEP.guideline },
];
const BOX = { y: 30, w: 64, h: 46, xs: [12, 83, 154] };
const fmt = (r: number) => `${r >= 10 ? Math.round(r) : Math.round(r * 10) / 10} : 1`;

// Bottom: red text on green, different hues but close lightness
const RED: RGB = [229, 57, 53];
const GREEN: RGB = [67, 160, 71];

const ContrastReadability = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.contrast_readability.${key}`);
  const step = useSlideStep(STEP_AT_MS);
  const rgRatio = contrastRatio(RED, GREEN);

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

        {/* ── top: contrast ratios ── */}
        <text
          x="115"
          y="17"
          textAnchor="middle"
          fontSize="13"
          fontWeight="bold"
          fill="#333"
          style={fade(step >= STEP.ratio)}
        >
          {k('what')}
        </text>
        {SAMPLES.map((s, i) => {
          const x = BOX.xs[i];
          return (
            <g key={s.key} style={fade(step >= s.step)}>
              <rect
                x={x}
                y={BOX.y}
                width={BOX.w}
                height={BOX.h}
                rx="6"
                fill={rgb(s.bg)}
                stroke="#ccc"
              />
              <text
                x={x + BOX.w / 2}
                y={BOX.y + BOX.h / 2 + 7}
                textAnchor="middle"
                fontSize="20"
                fontWeight="bold"
                fill={rgb(s.fg)}
              >
                Aa
              </text>
              <text
                x={x + BOX.w / 2}
                y={BOX.y + BOX.h + 17}
                textAnchor="middle"
                fontSize="13"
                fontWeight="bold"
                fill="#333"
              >
                {fmt(contrastRatio(s.fg, s.bg))}
              </text>
            </g>
          );
        })}
        {/* the guideline for body text */}
        <g style={fade(step >= STEP.guideline, 400)}>
          <rect
            x={BOX.xs[2] - 4}
            y={BOX.y - 4}
            width={BOX.w + 8}
            height={BOX.h + 28}
            rx="8"
            fill="none"
            stroke="#00813a"
            strokeWidth="2"
            strokeDasharray="4 3"
          />
          <text
            x="115"
            y={TOP_PANEL.height - 12}
            textAnchor="middle"
            fontSize="12"
            fontWeight="bold"
            fill="#00813a"
          >
            {k('guideline')}
          </text>
        </g>

        {/* ── bottom: different hues, close lightness — hard to read ── */}
        <g style={fade(step >= STEP.redGreen)}>
          <rect x="16" y={BOTTOM_PANEL.y + 12} width="198" height="48" rx="6" fill={rgb(GREEN)} />
          <text
            x="115"
            y={BOTTOM_PANEL.y + 43}
            textAnchor="middle"
            fontSize="18"
            fontWeight="bold"
            fill={rgb(RED)}
          >
            {k('sample')}
          </text>
          <text x="16" y={BOTTOM_PANEL.y + 80} fontSize="13" fontWeight="bold" fill="#c0102a">
            {fmt(rgRatio)} ×
          </text>
          {/* their grays: almost the same lightness */}
          {[RED, GREEN].map((c, i) => (
            <rect
              key={i}
              x={118 + i * 50}
              y={BOTTOM_PANEL.y + 68}
              width="44"
              height="16"
              rx="3"
              fill={rgb(grayOf(c))}
            />
          ))}
          <text x="165" y={BOTTOM_PANEL.y + 100} textAnchor="middle" fontSize="12" fill="#555">
            {k('grays')}
          </text>
          <text
            x="115"
            y={BOTTOM_PANEL.y + BOTTOM_PANEL.height - 14}
            textAnchor="middle"
            fontSize="12"
            fill="#555"
          >
            {k('hardToRead')}
          </text>
        </g>
      </svg>
    </div>
  );
};

export default ContrastReadability;
