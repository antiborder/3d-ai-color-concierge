import { useTranslation } from 'react-i18next';
import { fade, useSlideStep } from './slideAnimation';

/**
 * "Brightness" (HSB's B) and "lightness" (HSL's L): how one RGB color gets its value, where the
 * vivid color and white fall on the 0–100% scale, and that the value is not perceived brightness.
 * Both slides follow the same narration shape (brightness.py / lightness.py).
 */
const STEP = {
  scale: 0, // "明度は / 輝度は、HSB の B / HSL の L にあたる明るさの値です。"
  formula: 1, // "…[一番大きい]値で決まります。" / "…[足して]、2で割って決まります。"
  example: 2, // "[例えば]オレンジは、…"
  exampleLevel: 3, // "…[明度は100%]です。" / "…の[平均]で、輝度は50%です。"
  white: 4, // "[鮮やかな]色も白も…" / "…[白になると]100%です。"
  compare: 5, // "ただし、[黄色と青]はどちらも…"
  caption: 6, // "…[見た目の明るさ]はかなり違います。"
} as const;

type Mode = 'brightness' | 'lightness';

// When each step's words are spoken (estimated from the Japanese narration's reading at
// 8 morae/s with pauses at punctuation, as for the other slides)
const STEP_AT_MS: Record<Mode, number[]> = {
  brightness: [600, 7400, 10000, 14200, 16400, 21100, 24400],
  lightness: [600, 8700, 11100, 13800, 19100, 22100, 25400],
};

const ORANGE: [number, number, number] = [255, 128, 0];
const YELLOW: [number, number, number] = [255, 255, 0];
const BLUE: [number, number, number] = [0, 0, 255];
const hex = (rgb: number[]) => `rgb(${rgb.join(',')})`;
/** HSB's brightness and HSL's lightness of an RGB color, 0–1 */
const levelOf = (mode: Mode, rgb: number[]) => {
  const max = Math.max(...rgb) / 255;
  const min = Math.min(...rgb) / 255;
  return mode === 'brightness' ? max : (max + min) / 2;
};

// Two rounded panels: the 0–100% scale with an example (top), two colors compared (bottom)
const TOP_PANEL = { y: 0, height: 170 };
const BOTTOM_PANEL = { y: 178, height: 132 };

// The scale: a vertical strip of the example's hue from 0% (bottom) to 100% (top)
const STRIP = { x: 40, w: 18, top: 24, bottom: 150 };
const yOfLevel = (v: number) => STRIP.bottom - v * (STRIP.bottom - STRIP.top);
const COL_X = 92; // right-hand column of text, clear of the markers beside the strip
const SWATCH = { size: 44, y: BOTTOM_PANEL.y + 22, xs: [58, 128] };

const LightLevelSlide = ({ mode }: { mode: Mode }) => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.${mode}.${key}`);
  const step = useSlideStep(STEP_AT_MS[mode]);

  const letter = mode === 'brightness' ? 'B' : 'L';
  const gradientId = `${mode}Strip`;
  const orangeLevel = levelOf(mode, ORANGE);
  const whiteLevel = 1;
  const pct = (v: number) => `${Math.round(v * 100)}%`;
  const ticks = mode === 'brightness' ? [0, 1] : [0, 0.5, 1];

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
          <linearGradient id={gradientId} x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#000" />
            {mode === 'brightness' ? (
              <stop offset="100%" stopColor={hex(ORANGE)} />
            ) : (
              <>
                <stop offset="50%" stopColor={hex(ORANGE)} />
                <stop offset="100%" stopColor="#fff" />
              </>
            )}
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

        {/* ── top: the 0–100% scale ── */}
        <g style={fade(step >= STEP.scale)}>
          <text
            x={STRIP.x + STRIP.w / 2}
            y={STRIP.top - 8}
            textAnchor="middle"
            fontSize="14"
            fontWeight="bold"
            fill="#333"
          >
            {letter}
          </text>
          <rect
            x={STRIP.x}
            y={STRIP.top}
            width={STRIP.w}
            height={STRIP.bottom - STRIP.top}
            rx="3"
            fill={`url(#${gradientId})`}
            stroke="#ccc"
          />
          {ticks.map((v) => (
            <text
              key={v}
              x={STRIP.x - 6}
              y={yOfLevel(v) + 4}
              textAnchor="end"
              fontSize="12"
              fill="#666"
            >
              {pct(v)}
            </text>
          ))}
        </g>

        {/* how the value is worked out */}
        <text
          x={COL_X}
          y={TOP_PANEL.y + 52}
          fontSize="12"
          fontWeight="bold"
          fill="#333"
          style={fade(step >= STEP.formula)}
        >
          {k('formula')}
        </text>

        {/* the example: orange */}
        <g style={fade(step >= STEP.example)}>
          <rect x={COL_X} y={TOP_PANEL.y + 68} width="14" height="14" rx="3" fill={hex(ORANGE)} />
          <text x={COL_X + 20} y={TOP_PANEL.y + 80} fontSize="13" fill="#333">
            RGB ({ORANGE.join(', ')})
          </text>
        </g>
        <text
          x={COL_X}
          y={TOP_PANEL.y + 104}
          fontSize="13"
          fontWeight="bold"
          fill="#b05a00"
          style={fade(step >= STEP.exampleLevel)}
        >
          {k('calc')} → {pct(orangeLevel)}
        </text>
        <g style={fade(step >= STEP.exampleLevel, 300)}>
          <circle
            cx={STRIP.x + STRIP.w + 10}
            cy={yOfLevel(orangeLevel)}
            r="6"
            fill={hex(ORANGE)}
            stroke="#333"
            strokeWidth="1.5"
          />
        </g>

        {/* white */}
        <g style={fade(step >= STEP.white)}>
          <circle
            cx={STRIP.x + STRIP.w + (mode === 'brightness' ? 24 : 10)}
            cy={yOfLevel(whiteLevel)}
            r="6"
            fill="#fff"
            stroke="#333"
            strokeWidth="1.5"
          />
          <circle cx={COL_X + 7} cy={TOP_PANEL.y + 130} r="6" fill="#fff" stroke="#999" />
          <text x={COL_X + 20} y={TOP_PANEL.y + 135} fontSize="13" fill="#333">
            {k('whiteNote')}
          </text>
        </g>

        {/* ── bottom: same value, different look ── */}
        {[YELLOW, BLUE].map((rgb, i) => (
          <g key={i} style={fade(step >= STEP.compare, i * 400)}>
            <rect
              x={SWATCH.xs[i]}
              y={SWATCH.y}
              width={SWATCH.size}
              height={SWATCH.size}
              rx="6"
              fill={hex(rgb)}
              stroke="#ccc"
            />
            <text
              x={SWATCH.xs[i] + SWATCH.size / 2}
              y={SWATCH.y + SWATCH.size + 18}
              textAnchor="middle"
              fontSize="13"
              fontWeight="bold"
              fill="#333"
            >
              {letter} {pct(levelOf(mode, rgb))}
            </text>
          </g>
        ))}
        <text
          x="115"
          y={BOTTOM_PANEL.y + BOTTOM_PANEL.height - 14}
          textAnchor="middle"
          fontSize="13"
          fontWeight="bold"
          fill="#555"
          style={fade(step >= STEP.caption)}
        >
          {k('caption')}
        </text>
      </svg>
    </div>
  );
};

export default LightLevelSlide;
