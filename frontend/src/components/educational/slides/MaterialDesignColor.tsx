import { useTranslation } from 'react-i18next';
import sampleColors from '../../../constants/sampleColors';
import { labToRgb, rgbToLab } from '../../../utils/gamutUtils';
import { fade, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/material_design_color.py); each step starts on the word in [ ].
 */
const STEP = {
  intro: 0, // "[Material Design Colorは]、Googleがデザインのために作った色のパレットです。"
  rows: 1, // "[赤や青]など19の色相ごとに、"
  shades: 2, // "明るい[50]から暗い900まで、10段階の色がそろっています。"
  base: 3, // "[500が]その色の基準で、"
  darker: 4, // "[数字が大きい]ほど暗くなります。"
  but: 5, // "[ただし]、同じ番号でも、"
  lightness: 6, // "[黄色は]明るく、青は暗いなど、明るさは色相によって違います。"
} as const;
// When each step's words are spoken, counted from when the slide appears. Estimated from the
// reading (kana) of the Japanese narration at 8 morae/s, with pauses at 、(0.25 s) ・(0.15 s)
// 。(0.5 s) and 0.6 s before speech starts — calibrated on the hand-tuned RGB slide.
const STEP_AT_MS = [600, 6200, 9400, 14000, 15800, 18500, 20500];

// Two rounded panels: hues × shades (top), the 500s side by side (bottom)
const TOP_PANEL = { y: 0, height: 190 };
const BOTTOM_PANEL = { y: 198, height: 112 };

// The app's Material Design colors, by name ("Red 500" → "#F44336")
const HEX_BY_NAME = new Map<string, string>(
  sampleColors
    .filter((c: { tag: string[] }) => c.tag.includes('MATERIAL'))
    .map((c: { name1: string; hex: string }) => [c.name1, c.hex])
);
const hexOf = (hue: string, shade: number) => HEX_BY_NAME.get(`${hue} ${shade}`) ?? '#ccc';

const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
const BASE_INDEX = SHADES.indexOf(500);
const HUES = ['Red', 'Purple', 'Blue', 'Teal', 'Green', 'Amber'];
const GRID = { x0: 62, y0: 36, cell: 14, pitch: 16, rowPitch: 18 };
const gridRight = GRID.x0 + (SHADES.length - 1) * GRID.pitch + GRID.cell;
const LABELED_SHADES = [50, 500, 900];

// Bottom: the 500 of several hues, with a gray of each one's perceived lightness (CIE L*)
const BOTTOM_HUES = ['Yellow', 'Amber', 'Green', 'Red', 'Purple', 'Blue'];
const hexToRgb = (hex: string): [number, number, number] => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];
const grayOf = (hex: string) => `rgb(${labToRgb(rgbToLab(...hexToRgb(hex))[0], 0, 0).join(',')})`;
const ROW = { x0: 48, y: BOTTOM_PANEL.y + 12, size: 24, pitch: 29, grayH: 8 };

const MaterialDesignColor = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.material_design_color.${key}`);
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

        {/* ── top: hues × shades ── */}
        <text x="10" y="18" fontSize="12" fill="#666" style={fade(step >= STEP.intro)}>
          {k('palette')}
        </text>
        {HUES.map((hue, r) => {
          const y = GRID.y0 + r * GRID.rowPitch;
          return (
            <g key={hue} style={fade(step >= STEP.rows, r * 150)}>
              <text x="10" y={y + 11} fontSize="12" fontWeight="bold" fill="#333">
                {hue}
              </text>
              {SHADES.map((shade, i) => (
                <rect
                  key={shade}
                  x={GRID.x0 + i * GRID.pitch}
                  y={y}
                  width={GRID.cell}
                  height={GRID.cell}
                  rx="2"
                  fill={hexOf(hue, shade)}
                />
              ))}
            </g>
          );
        })}
        {/* 50 … 500 … 900 */}
        <g style={fade(step >= STEP.shades)}>
          {LABELED_SHADES.map((shade) => (
            <text
              key={shade}
              x={GRID.x0 + SHADES.indexOf(shade) * GRID.pitch + GRID.cell / 2}
              y={GRID.y0 - 5}
              textAnchor="middle"
              fontSize="12"
              fill="#555"
            >
              {shade}
            </text>
          ))}
        </g>
        {/* 500 is each hue's base color */}
        <rect
          x={GRID.x0 + BASE_INDEX * GRID.pitch - 2}
          y={GRID.y0 - 2}
          width={GRID.cell + 4}
          height={HUES.length * GRID.rowPitch}
          rx="3"
          fill="none"
          stroke="#222"
          strokeWidth="2"
          style={fade(step >= STEP.base)}
        />
        {/* higher numbers are darker */}
        <g style={fade(step >= STEP.darker)}>
          <line
            x1={GRID.x0}
            y1={GRID.y0 + HUES.length * GRID.rowPitch + 10}
            x2={gridRight - 6}
            y2={GRID.y0 + HUES.length * GRID.rowPitch + 10}
            stroke="#555"
            strokeWidth="1.5"
          />
          <path
            d={`M${gridRight},${GRID.y0 + HUES.length * GRID.rowPitch + 10} l-8,-4 v8 Z`}
            fill="#555"
          />
          <text
            x={GRID.x0}
            y={GRID.y0 + HUES.length * GRID.rowPitch + 28}
            fontSize="12"
            fill="#555"
          >
            {k('lighter')}
          </text>
          <text
            x={gridRight}
            y={GRID.y0 + HUES.length * GRID.rowPitch + 28}
            textAnchor="end"
            fontSize="12"
            fill="#555"
          >
            {k('darker')}
          </text>
        </g>

        {/* ── bottom: the same number, different lightness ── */}
        <g style={fade(step >= STEP.but)}>
          <text x="10" y={ROW.y + 16} fontSize="13" fontWeight="bold" fill="#333">
            500
          </text>
          {BOTTOM_HUES.map((hue, i) => (
            <rect
              key={hue}
              x={ROW.x0 + i * ROW.pitch}
              y={ROW.y}
              width={ROW.size}
              height={ROW.size}
              rx="4"
              fill={hexOf(hue, 500)}
            />
          ))}
        </g>
        <g style={fade(step >= STEP.lightness)}>
          {BOTTOM_HUES.map((hue, i) => (
            <rect
              key={hue}
              x={ROW.x0 + i * ROW.pitch}
              y={ROW.y + ROW.size + 3}
              width={ROW.size}
              height={ROW.grayH}
              rx="2"
              fill={grayOf(hexOf(hue, 500))}
            />
          ))}
          <text x="10" y={ROW.y + ROW.size + 11} fontSize="12" fill="#666">
            {k('grayLabel')}
          </text>
          <text
            x="115"
            y={BOTTOM_PANEL.y + 74}
            textAnchor="middle"
            fontSize="13"
            fontWeight="bold"
            fill="#333"
          >
            {k('yellowBlue')}
          </text>
          <text x="115" y={BOTTOM_PANEL.y + 94} textAnchor="middle" fontSize="12" fill="#555">
            {k('sameNumber')}
          </text>
        </g>
      </svg>
    </div>
  );
};

export default MaterialDesignColor;
