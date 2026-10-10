import { useTranslation } from 'react-i18next';
import sampleColors from '../../../constants/sampleColors';
import { fade, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/japanese_traditional_colors.py); each step starts on the
 * word in [ ].
 */
const STEP = {
  intro: 0, // "[日本の伝統色は]、昔から日本で使われてきた色に、自然や暮らしにちなんだ名前を付けたものです。"
  sakura: 1, // "[桜色]、"
  moegi: 2, // "[萌葱色]、"
  ai: 3, // "[藍色]、"
  akane: 4, // "[茜色]、"
  yamabuki: 5, // "[山吹色]のように、"
  origin: 6, // "[花や]植物、染料の名前が多く使われています。"
  muted: 7, // "[淡く]くすんだ、落ち着いた色が多いのも特徴です。"
  app: 8, // "[このアプリでは]、約460色を表示できます。"
} as const;
// When each step's words are spoken, counted from when the slide appears. Estimated from the
// reading (kana) of the Japanese narration at 8 morae/s, with pauses at 、(0.25 s) ・(0.15 s)
// 。(0.5 s) and 0.6 s before speech starts — calibrated on the hand-tuned RGB slide.
const STEP_AT_MS = [600, 8200, 9100, 10000, 10700, 11600, 13100, 17200, 21200];

// Two rounded panels: five named colors (top), many of them (bottom)
const TOP_PANEL = { y: 0, height: 196 };
const BOTTOM_PANEL = { y: 204, height: 106 };

// Five colors and their hex values (as in the app's data, constants/sampleColors.js)
const NAMED = [
  { key: 'sakura', hex: '#fef4f4', step: STEP.sakura },
  { key: 'moegi', hex: '#006e54', step: STEP.moegi },
  { key: 'ai', hex: '#165e83', step: STEP.ai },
  { key: 'akane', hex: '#b7282e', step: STEP.akane },
  { key: 'yamabuki', hex: '#f8b500', step: STEP.yamabuki },
];
const LIST = { y0: 12, pitch: 34, swatch: 26 };

// Bottom: a mosaic of the app's Japanese traditional colors, ordered by hue
const hueOf = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d < 0.08) return 400 + max; // grays last, by lightness
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h *= 60;
  return (h + 360) % 360;
};
const JAPANESE: string[] = sampleColors
  .filter((c: { tag: string[] }) => c.tag.includes('JAPANESE'))
  .map((c: { hex: string }) => c.hex);
const MOSAIC_COUNT = 48;
const MOSAIC = Array.from(
  { length: MOSAIC_COUNT },
  (_, i) => JAPANESE[Math.floor((i * JAPANESE.length) / MOSAIC_COUNT)]
).sort((p, q) => hueOf(p) - hueOf(q));
const CELL = { x0: 11, y0: BOTTOM_PANEL.y + 10, size: 12, pitch: 13, perRow: 16 };

const JapaneseTraditionalColors = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.japanese_traditional_colors.${key}`);
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

        {/* ── top: five colors and where their names come from ── */}
        {NAMED.map((c, i) => {
          const y = LIST.y0 + i * LIST.pitch;
          return (
            <g key={c.key}>
              <g style={fade(step >= c.step)}>
                <rect
                  x="14"
                  y={y}
                  width={LIST.swatch}
                  height={LIST.swatch}
                  rx="5"
                  fill={c.hex}
                  stroke="#ddd"
                />
                <text x="50" y={y + 13} fontSize="14" fontWeight="bold" fill="#333">
                  {k(c.key)}
                </text>
                <text x="50" y={y + 27} fontSize="12" fill="#777">
                  {k(`${c.key}Reading`)}
                </text>
              </g>
              <text
                x="218"
                y={y + 18}
                textAnchor="end"
                fontSize="12"
                fill="#8a5a2b"
                style={fade(step >= STEP.origin, i * 150)}
              >
                {k(`${c.key}Origin`)}
              </text>
            </g>
          );
        })}

        {/* ── bottom: many soft, muted colors ── */}
        <g style={fade(step >= STEP.muted)}>
          {MOSAIC.map((hex, i) => (
            <rect
              key={i}
              x={CELL.x0 + (i % CELL.perRow) * CELL.pitch}
              y={CELL.y0 + Math.floor(i / CELL.perRow) * CELL.pitch}
              width={CELL.size}
              height={CELL.size}
              rx="2"
              fill={hex}
            />
          ))}
          <text
            x="115"
            y={BOTTOM_PANEL.y + 70}
            textAnchor="middle"
            fontSize="13"
            fontWeight="bold"
            fill="#333"
          >
            {k('muted')}
          </text>
        </g>
        <text
          x="115"
          y={BOTTOM_PANEL.y + BOTTOM_PANEL.height - 10}
          textAnchor="middle"
          fontSize="12"
          fill="#555"
          style={fade(step >= STEP.app)}
        >
          {k('app')}
        </text>
      </svg>
    </div>
  );
};

export default JapaneseTraditionalColors;
