import { useTranslation } from 'react-i18next';
import { type RGB, grayOf, hslToRgb, rgb } from '../slideColors';
import { fade, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/pastel_colors.py); each step starts on the word in [ ].
 */
const STEP = {
  intro: 0, // "[パステルカラーは]、明るく、彩度が低めの、やわらかい色のことです。"
  region: 1, // "[白を多く]混ぜたような色で、"
  tones: 2, // "トーンでいうと[ペール]やライトにあたります。"
  hues: 3, // "[色相が違っても]明るさがそろうので、"
  even: 4, // "並べても[まとまり]やすく、やさしく軽い印象になります。"
  sakura: 5, // "日本の伝統色の[桜色]も、パステルカラーの一つです。"
} as const;
// When each step's words are spoken, counted from when the slide appears. Estimated from the
// reading (kana) of the Japanese narration at 8 morae/s, with pauses at 、(0.25 s) ・(0.15 s)
// 。(0.5 s) and 0.6 s before speech starts — calibrated on the hand-tuned RGB slide.
const STEP_AT_MS = [600, 5800, 8800, 11000, 14400, 19400];

// Two rounded panels: one hue by saturation and lightness (top), pastels of many hues (bottom)
const TOP_PANEL = { y: 0, height: 200 };
const BOTTOM_PANEL = { y: 208, height: 102 };

// Top: one hue (pink), saturation across, lightness down
const HUE = 335;
const SATS = [20, 40, 60, 80, 100];
const LIGHTS = [88, 76, 62, 48, 34];
const GRID = { x0: 66, y0: 26, cell: 26, pitch: 29 };
// The pastel corner: light, low to medium saturation
const PASTEL = { cols: 3, rows: 2 };

// Bottom: pastels of six hues
const PASTELS: RGB[] = [0, 40, 60, 140, 200, 270].map((h) => hslToRgb(h, 75, 86));
const ROW = { y: BOTTOM_PANEL.y + 10, size: 26, pitch: 32, grayH: 7 };
const SAKURA: RGB = [254, 244, 244];

const PastelColors = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.pastel_colors.${key}`);
  const step = useSlideStep(STEP_AT_MS);
  const rowX0 = 115 - (PASTELS.length * ROW.pitch - (ROW.pitch - ROW.size)) / 2;
  const gridBottom = GRID.y0 + (LIGHTS.length - 1) * GRID.pitch + GRID.cell;
  const gridRight = GRID.x0 + (SATS.length - 1) * GRID.pitch + GRID.cell;

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

        {/* ── top: one hue by saturation (across) and lightness (down) ── */}
        <g style={fade(step >= STEP.intro)}>
          {LIGHTS.map((l, r) =>
            SATS.map((s, c) => (
              <rect
                key={`${r}-${c}`}
                x={GRID.x0 + c * GRID.pitch}
                y={GRID.y0 + r * GRID.pitch}
                width={GRID.cell}
                height={GRID.cell}
                rx="4"
                fill={rgb(hslToRgb(HUE, s, l))}
              />
            ))
          )}
          <text x={GRID.x0} y={gridBottom + 16} fontSize="12" fill="#555">
            {k('dull')}
          </text>
          <text x={gridRight} y={gridBottom + 16} textAnchor="end" fontSize="12" fill="#555">
            {k('vivid')}
          </text>
          <text x={GRID.x0 - 6} y={gridBottom - 8} textAnchor="end" fontSize="12" fill="#555">
            {k('dark')}
          </text>
        </g>

        {/* the pastel corner */}
        <g style={fade(step >= STEP.region)}>
          <rect
            x={GRID.x0 - 3}
            y={GRID.y0 - 3}
            width={(PASTEL.cols - 1) * GRID.pitch + GRID.cell + 6}
            height={(PASTEL.rows - 1) * GRID.pitch + GRID.cell + 6}
            rx="6"
            fill="none"
            stroke="#d0508a"
            strokeWidth="2.5"
          />
          <text
            x={GRID.x0 + ((PASTEL.cols - 1) * GRID.pitch + GRID.cell) / 2}
            y={GRID.y0 - 8}
            textAnchor="middle"
            fontSize="13"
            fontWeight="bold"
            fill="#d0508a"
          >
            {k('pastel')}
          </text>
        </g>
        {/* in tone terms: pale and light */}
        <g style={fade(step >= STEP.tones)}>
          {['pale', 'light'].map((key, r) => (
            <text
              key={key}
              x={GRID.x0 - 6}
              y={GRID.y0 + r * GRID.pitch + 17}
              textAnchor="end"
              fontSize="12"
              fontWeight="bold"
              fill="#555"
            >
              {k(key)}
            </text>
          ))}
        </g>

        {/* ── bottom: pastels of many hues, about equally light ── */}
        <g style={fade(step >= STEP.hues)}>
          {PASTELS.map((c, i) => (
            <rect
              key={i}
              x={rowX0 + i * ROW.pitch}
              y={ROW.y}
              width={ROW.size}
              height={ROW.size}
              rx="5"
              fill={rgb(c)}
            />
          ))}
        </g>
        <g style={fade(step >= STEP.even)}>
          {PASTELS.map((c, i) => (
            <rect
              key={i}
              x={rowX0 + i * ROW.pitch}
              y={ROW.y + ROW.size + 3}
              width={ROW.size}
              height={ROW.grayH}
              rx="2"
              fill={rgb(grayOf(c))}
            />
          ))}
          <text
            x="115"
            y={BOTTOM_PANEL.y + 66}
            textAnchor="middle"
            fontSize="13"
            fontWeight="bold"
            fill="#333"
          >
            {k('even')}
          </text>
        </g>
        <g style={fade(step >= STEP.sakura)}>
          <rect
            x="56"
            y={BOTTOM_PANEL.y + 78}
            width="16"
            height="16"
            rx="3"
            fill={rgb(SAKURA)}
            stroke="#ccc"
          />
          <text x="78" y={BOTTOM_PANEL.y + 91} fontSize="12" fill="#555">
            {k('sakura')}
          </text>
        </g>
      </svg>
    </div>
  );
};

export default PastelColors;
