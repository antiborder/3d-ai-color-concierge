import { useTranslation } from 'react-i18next';
import { fade, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/tone.py); each step starts on the word in [ ].
 */
const STEP = {
  intro: 0, // "[トーンは]、色調とも呼ばれ、明るさと鮮やかさを組み合わせた、色の調子のことです。"
  xAxis: 1, // "[横に]鮮やかさ、"
  yAxis: 2, // "[縦に]明るさをとると、ひとつの色相の色は、"
  grid: 3, // "[このような]グループに分けられます。"
  vivid: 4, // "[鮮やかな]ビビッド、"
  pale: 5, // "[明るく淡い]ペール、"
  dark: 6, // "[暗いダーク]、"
  grayish: 7, // "[灰色]がかったグレイッシュなどです。"
  hues: 8, // "[トーンは色相]とは別なので、色相が違っても、"
  same: 9, // "[同じトーン]なら似た印象になります。"
} as const;
// When each step's words are spoken, counted from when the slide appears. Estimated from the
// reading (kana) of the Japanese narration at 8 morae/s, with pauses at 、(0.25 s) ・(0.15 s)
// 。(0.5 s) and 0.6 s before speech starts — calibrated on the hand-tuned RGB slide.
const STEP_AT_MS = [600, 7000, 8200, 11600, 14100, 15500, 17000, 18000, 20600, 24200];

// Two rounded panels: the tones of one hue (top), the same tone across hues (bottom)
const TOP_PANEL = { y: 0, height: 206 };
const BOTTOM_PANEL = { y: 214, height: 96 };

const hsl = (h: number, s: number, l: number) => `hsl(${h} ${s}% ${l}%)`;

// The tones of one hue, laid out like the PCCS tone map: vividness to the right, lightness up.
// Colors are HSL approximations of each tone.
type ToneCell = { key: string; col: number; row: number; s: number; l: number };
const TONES: ToneCell[] = [
  { key: 'p', col: 0, row: 0, s: 60, l: 88 },
  { key: 'ltg', col: 0, row: 1, s: 15, l: 72 },
  { key: 'g', col: 0, row: 2, s: 12, l: 48 },
  { key: 'dkg', col: 0, row: 3, s: 15, l: 22 },
  { key: 'lt', col: 1, row: 0, s: 75, l: 75 },
  { key: 'sf', col: 1, row: 1, s: 35, l: 62 },
  { key: 'd', col: 1, row: 2, s: 35, l: 45 },
  { key: 'dk', col: 1, row: 3, s: 45, l: 25 },
  { key: 'b', col: 2, row: 0.5, s: 85, l: 62 },
  { key: 's', col: 2, row: 1.5, s: 70, l: 48 },
  { key: 'dp', col: 2, row: 2.5, s: 80, l: 30 },
  { key: 'v', col: 3, row: 1.5, s: 100, l: 50 },
];
const TONE_HUE = 350;
const CELL = { x0: 44, y0: 28, size: 30, pitch: 38 };
const cellX = (col: number) => CELL.x0 + col * CELL.pitch;
const cellY = (row: number) => CELL.y0 + row * CELL.pitch;
const cellOf = (key: string) => TONES.find((t) => t.key === key)!;

// The tones the narration names, each outlined (a group of cells for grayish) and labeled
const CALLOUTS = [
  {
    key: 'vivid',
    cells: ['v'],
    step: STEP.vivid,
    label: { x: 186, y: cellY(1.5) - 6, anchor: 'middle' },
  },
  {
    key: 'pale',
    cells: ['p'],
    step: STEP.pale,
    label: { x: cellX(0) + 15, y: 20, anchor: 'middle' },
  },
  {
    key: 'dark',
    cells: ['dk'],
    step: STEP.dark,
    label: { x: cellX(1) + 30, y: 190, anchor: 'middle' },
  },
  {
    key: 'grayish',
    cells: ['ltg', 'g', 'dkg'],
    step: STEP.grayish,
    label: { x: cellX(0) + 2, y: 190, anchor: 'middle' },
  },
] as const;
const outlineOf = (cells: readonly string[]) => {
  const cs = cells.map(cellOf);
  const x = Math.min(...cs.map((c) => cellX(c.col))) - 3;
  const y = Math.min(...cs.map((c) => cellY(c.row))) - 3;
  const x1 = Math.max(...cs.map((c) => cellX(c.col))) + CELL.size + 3;
  const y1 = Math.max(...cs.map((c) => cellY(c.row))) + CELL.size + 3;
  return { x, y, w: x1 - x, h: y1 - y };
};

// Bottom: pale and dark across five hues
const ROW_HUES = [0, 60, 130, 210, 280];
const ROWS = [
  { key: 'pale', tone: cellOf('p'), y: BOTTOM_PANEL.y + 12 },
  { key: 'dark', tone: cellOf('dk'), y: BOTTOM_PANEL.y + 42 },
];
const SWATCH = { x0: 76, size: 24, pitch: 28 };

const Tone = () => {
  const { t, i18n } = useTranslation();
  const k = (key: string) => t(`educational.tone.${key}`);
  const step = useSlideStep(STEP_AT_MS);
  const verticalText = i18n.language.startsWith('ja');

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

        {/* ── top: the tones of one hue ── */}
        <text
          x="214"
          y={TOP_PANEL.height - 8}
          textAnchor="end"
          fontSize="13"
          fontWeight="bold"
          fill="#555"
          style={fade(step >= STEP.xAxis)}
        >
          {k('vividness')}
        </text>
        {/* Japanese is written vertically (upright); other languages are turned on their side */}
        <text
          x="0"
          y="0"
          transform={`translate(24, ${cellY(1.5) + 15})${verticalText ? '' : ' rotate(-90)'}`}
          textAnchor="middle"
          fontSize="13"
          fontWeight="bold"
          fill="#555"
          style={{
            ...fade(step >= STEP.yAxis),
            ...(verticalText ? { writingMode: 'vertical-rl', textOrientation: 'upright' } : {}),
          }}
        >
          {k('lightness')}
        </text>
        {/* in vertical text an arrow character turns sideways, so draw it */}
        {verticalText && (
          <path
            d={`M24,${cellY(1.5) - 10} v-16 m-4,5 l4,-5 l4,5`}
            fill="none"
            stroke="#555"
            strokeWidth="1.8"
            style={fade(step >= STEP.yAxis)}
          />
        )}
        {TONES.map((c) => (
          <rect
            key={c.key}
            x={cellX(c.col)}
            y={cellY(c.row)}
            width={CELL.size}
            height={CELL.size}
            rx="5"
            fill={hsl(TONE_HUE, c.s, c.l)}
            style={fade(step >= STEP.grid, c.col * 150)}
          />
        ))}
        {CALLOUTS.map((c) => {
          const o = outlineOf(c.cells);
          return (
            <g key={c.key} style={fade(step >= c.step)}>
              <rect
                x={o.x}
                y={o.y}
                width={o.w}
                height={o.h}
                rx="7"
                fill="none"
                stroke="#333"
                strokeWidth="2"
              />
              <text
                x={c.label.x}
                y={c.label.y}
                textAnchor={c.label.anchor}
                fontSize="13"
                fontWeight="bold"
                fill="#333"
                stroke="#f7f8fb"
                strokeWidth="3"
                paintOrder="stroke"
              >
                {k(c.key)}
              </text>
            </g>
          );
        })}

        {/* ── bottom: the same tone looks alike across hues ── */}
        {ROWS.map((row, r) => (
          <g key={row.key} style={fade(step >= STEP.hues, r * 500)}>
            <text x="14" y={row.y + 17} fontSize="13" fontWeight="bold" fill="#333">
              {k(row.key)}
            </text>
            {ROW_HUES.map((h, i) => (
              <rect
                key={h}
                x={SWATCH.x0 + i * SWATCH.pitch}
                y={row.y}
                width={SWATCH.size}
                height={SWATCH.size}
                rx="5"
                fill={hsl(h, row.tone.s, row.tone.l)}
              />
            ))}
          </g>
        ))}
        <text
          x="115"
          y={BOTTOM_PANEL.y + BOTTOM_PANEL.height - 10}
          textAnchor="middle"
          fontSize="13"
          fontWeight="bold"
          fill="#555"
          style={fade(step >= STEP.same)}
        >
          {k('caption')}
        </text>
      </svg>
    </div>
  );
};

export default Tone;
