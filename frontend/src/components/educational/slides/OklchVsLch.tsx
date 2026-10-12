import { useTranslation } from 'react-i18next';
import {
  lchToRgbGamutMapped,
  oklchToRgbGamutMapped,
  rgbToLch,
  rgbToOklch,
} from '../../../utils/gamutUtils';
import { type RGB, rgb } from '../slideColors';
import { fade, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/oklch_vs_lch.py); each step starts on the word in [ ].
 */
const STEP = {
  intro: 0, // "[LCHとOKLCHは]、どちらも明るさ・鮮やかさ・色相の3つで色を表します。"
  l: 1, // "[明るさ]・"
  c: 2, // "[鮮やかさ]・"
  h: 3, // "[色相]の3つで"
  lchBase: 4, // "違いは元になった色空間で、[LCHはLab]、"
  oklchBase: 5, // "[OKLCHはOKLab]を、極座標で表したものです。"
  fixHue: 6, // "[この違いは]、色相を固定したまま、色を明るくするとよくわかります。"
  lch: 7, // "[LCHでは]、青を明るくすると、"
  drift: 8, // "だんだん[紫]に寄っていきます。"
  oklch: 9, // "[OKLCHでは]、青は青のまま明るくなります。"
  use: 10, // "そのため、[グラデーションや]配色を作るときは、OKLCHのほうが…"
} as const;
// When each step's words are spoken, counted from when the slide appears. Estimated from the
// reading (kana) of the Japanese narration at 8 morae/s, with pauses at 、(0.25 s) ・(0.15 s)
// 。(0.5 s) and 0.6 s before speech starts — calibrated on the hand-tuned RGB slide.
const STEP_AT_MS = [600, 3800, 4500, 5300, 10400, 11900, 16900, 22300, 25600, 27600, 32800];

// Two rounded panels: what the two share and are built on (top), blue made lighter (bottom)
const TOP_PANEL = { y: 0, height: 104 };
const BOTTOM_PANEL = { y: 112, height: 198 };

// Top: the three values both use
const AXES = [
  { key: 'l', letter: 'L', step: STEP.l },
  { key: 'c', letter: 'C', step: STEP.c },
  { key: 'h', letter: 'H', step: STEP.h },
];
const CHIP = { y: 10, w: 66, h: 40, gap: 7, x0: 9 };

// Bottom: pure blue made lighter with its hue angle fixed, in each space. Chroma is kept as
// high as the screen can show. In LCH the hue drifts towards purple; in OKLCH it stays blue.
const STEPS = 6;
const lighter = (i: number) => (i / (STEPS - 1)) * 0.85; // how far towards white
const [LCH_L, LCH_C, LCH_H] = rgbToLch(0, 0, 255);
const [OK_L, OK_C, OK_H] = rgbToOklch(0, 0, 255);
const LCH_ROW: RGB[] = Array.from({ length: STEPS }, (_, i) =>
  lchToRgbGamutMapped(LCH_L + (97 - LCH_L) * lighter(i), LCH_C, LCH_H)
);
const OKLCH_ROW: RGB[] = Array.from({ length: STEPS }, (_, i) =>
  oklchToRgbGamutMapped(OK_L + (0.97 - OK_L) * lighter(i), OK_C, OK_H)
);
const SWATCH = { w: 32, h: 32, gap: 4, x0: 9 };
const ROWS = [
  { key: 'lch', label: 'LCH', colors: LCH_ROW, y: BOTTOM_PANEL.y + 46, step: STEP.lch },
  { key: 'oklch', label: 'OKLCH', colors: OKLCH_ROW, y: BOTTOM_PANEL.y + 122, step: STEP.oklch },
];
const NOTES = [
  { key: 'drift', color: '#7a3fc0', y: BOTTOM_PANEL.y + 96, step: STEP.drift },
  { key: 'keep', color: '#1f5fd0', y: BOTTOM_PANEL.y + 172, step: STEP.oklch },
];

const OklchVsLch = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.oklch_vs_lch.${key}`);
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

        {/* ── top: the three values both spaces use, each appearing when it is named ── */}
        {AXES.map((a, i) => {
          const x = CHIP.x0 + i * (CHIP.w + CHIP.gap);
          return (
            <g key={a.key} style={fade(step >= a.step)}>
              <rect x={x} y={CHIP.y} width={CHIP.w} height={CHIP.h} rx="6" fill="#e6eaf3" />
              <text
                x={x + CHIP.w / 2}
                y={CHIP.y + 17}
                textAnchor="middle"
                fontSize="16"
                fontWeight="bold"
                fill="#333"
              >
                {a.letter}
              </text>
              <text
                x={x + CHIP.w / 2}
                y={CHIP.y + 33}
                textAnchor="middle"
                fontSize="12"
                fill="#555"
              >
                {k(a.key)}
              </text>
            </g>
          );
        })}

        {/* what each is built on */}
        {[
          { key: 'lchBase', y: 72, step: STEP.lchBase },
          { key: 'oklchBase', y: 94, step: STEP.oklchBase },
        ].map((b) => (
          <text
            key={b.key}
            x="14"
            y={b.y}
            fontSize="14"
            fontWeight="bold"
            fill="#333"
            style={fade(step >= b.step)}
          >
            {k(b.key)}
          </text>
        ))}

        {/* ── bottom: blue made lighter with the hue fixed ── */}
        <text
          x="115"
          y={BOTTOM_PANEL.y + 20}
          textAnchor="middle"
          fontSize="13"
          fontWeight="bold"
          fill="#333"
          style={fade(step >= STEP.fixHue)}
        >
          {k('fixHue')}
        </text>
        {ROWS.map((row) => (
          <g key={row.key}>
            <text
              x={SWATCH.x0}
              y={row.y - 6}
              fontSize="13"
              fontWeight="bold"
              fill="#333"
              style={fade(step >= row.step)}
            >
              {row.label}
            </text>
            {row.colors.map((c, i) => (
              <rect
                key={i}
                x={SWATCH.x0 + i * (SWATCH.w + SWATCH.gap)}
                y={row.y}
                width={SWATCH.w}
                height={SWATCH.h}
                rx="5"
                fill={rgb(c)}
                style={fade(step >= row.step, i * 200)}
              />
            ))}
          </g>
        ))}
        {NOTES.map((n) => (
          <text
            key={n.key}
            x="221"
            y={n.y}
            textAnchor="end"
            fontSize="13"
            fontWeight="bold"
            fill={n.color}
            style={fade(step >= n.step, n.key === 'keep' ? 1200 : 0)}
          >
            {k(n.key)}
          </text>
        ))}

        <text
          x="115"
          y={BOTTOM_PANEL.y + BOTTOM_PANEL.height - 8}
          textAnchor="middle"
          fontSize="13"
          fontWeight="bold"
          fill="#333"
          style={fade(step >= STEP.use)}
        >
          {k('use')}
        </text>
      </svg>
    </div>
  );
};

export default OklchVsLch;
