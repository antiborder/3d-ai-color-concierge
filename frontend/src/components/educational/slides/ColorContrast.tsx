import { useTranslation } from 'react-i18next';
import { type RGB, hslToRgb, rgb } from '../slideColors';
import { fade, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/color_contrast.py); each step starts on the word in [ ].
 */
const STEP = {
  intro: 0, // "[コントラストは]、色どうしの差のことで、差が大きいほど、はっきりと目立ちます。"
  lightness: 1, // "[明るさの差]による明度対比、"
  saturation: 2, // "[鮮やかさの差]による彩度対比、"
  hue: 3, // "[色の種類]の差による色相対比があります。"
  complement: 4, // "[中でも]、補色どうしを並べる補色対比は、最も強く目立ちます。"
  strong: 5, // "[目立たせたい]所はコントラストを強く、"
  weak: 6, // "[落ち着かせたい]所は弱くするのが、配色の基本です。"
} as const;
// When each step's words are spoken, counted from when the slide appears. Estimated from the
// reading (kana) of the Japanese narration at 8 morae/s, with pauses at 、(0.25 s) ・(0.15 s)
// 。(0.5 s) and 0.6 s before speech starts — calibrated on the hand-tuned RGB slide.
const STEP_AT_MS = [600, 6400, 8500, 10700, 14100, 19400, 22100];

// Two rounded panels: four kinds of contrast (top), strong vs weak (bottom)
const TOP_PANEL = { y: 0, height: 202 };
const BOTTOM_PANEL = { y: 210, height: 100 };

const hsl = (h: number, s: number, l: number): RGB => hslToRgb(h, s, l);
// Each kind: a background with a square on it, differing in just one thing
const KINDS = [
  { key: 'lightness', bg: hsl(210, 55, 22), fg: hsl(210, 55, 78), step: STEP.lightness },
  { key: 'saturation', bg: hsl(0, 12, 50), fg: hsl(0, 85, 50), step: STEP.saturation },
  // hues about 60° apart, same lightness and saturation (not opposite, unlike complements)
  { key: 'hue', bg: hsl(205, 55, 45), fg: hsl(145, 55, 45), step: STEP.hue },
  { key: 'complement', bg: hsl(220, 80, 45), fg: hsl(35, 95, 52), step: STEP.complement },
];
const CELL = { w: 96, h: 66, inner: 30, xs: [14, 120], ys: [12, 104] };

// Bottom: weak contrast feels calm, strong contrast stands out
const SAMPLES = [
  { key: 'weak', bg: hsl(40, 25, 90), button: hsl(40, 25, 80), step: STEP.weak, x: 120 },
  { key: 'strong', bg: hsl(220, 45, 25), button: hsl(35, 95, 55), step: STEP.strong, x: 14 },
];
const SAMPLE = { y: BOTTOM_PANEL.y + 10, w: 96, h: 54 };

const ColorContrast = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.color_contrast.${key}`);
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

        {/* ── top: four kinds of contrast, each appearing when it is named ── */}
        {KINDS.map((kind, i) => {
          const x = CELL.xs[i % 2];
          const y = CELL.ys[Math.floor(i / 2)];
          return (
            <g key={kind.key} style={fade(step >= kind.step)}>
              <rect x={x} y={y} width={CELL.w} height={CELL.h} rx="6" fill={rgb(kind.bg)} />
              <rect
                x={x + (CELL.w - CELL.inner) / 2}
                y={y + (CELL.h - CELL.inner) / 2}
                width={CELL.inner}
                height={CELL.inner}
                rx="4"
                fill={rgb(kind.fg)}
              />
              <text
                x={x + CELL.w / 2}
                y={y + CELL.h + 16}
                textAnchor="middle"
                fontSize="13"
                fontWeight="bold"
                fill={kind.key === 'complement' ? '#c0392b' : '#333'}
              >
                {k(kind.key)}
              </text>
            </g>
          );
        })}

        {/* ── bottom: strong vs weak ── */}
        {SAMPLES.map((s) => (
          <g key={s.key} style={fade(step >= s.step)}>
            <rect
              x={s.x}
              y={SAMPLE.y}
              width={SAMPLE.w}
              height={SAMPLE.h}
              rx="6"
              fill={rgb(s.bg)}
              stroke="#ddd"
            />
            <rect
              x={s.x + 24}
              y={SAMPLE.y + 18}
              width={SAMPLE.w - 48}
              height="18"
              rx="9"
              fill={rgb(s.button)}
            />
            <text
              x={s.x + SAMPLE.w / 2}
              y={SAMPLE.y + SAMPLE.h + 18}
              textAnchor="middle"
              fontSize="13"
              fontWeight="bold"
              fill="#333"
            >
              {k(s.key)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

export default ColorContrast;
