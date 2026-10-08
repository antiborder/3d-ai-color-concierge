import { useTranslation } from 'react-i18next';
import { fade, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/color_samples.py); each step starts on the word in [ ].
 */
const STEP = {
  intro: 0, // "[このアプリでは]、4種類の色見本を、色空間の中に点で表示できます。"
  grid: 1, // "[RGB Cube Gridは]、RGBの各軸を7段階に分けた、"
  gridNote: 2, // "[343色]です。"
  css: 3, // "[CSS Named Colorsは]、ウェブで名前で指定できる色で、"
  cssNote: 4, // "[トマト]やスカイブルーなどがあります。"
  material: 5, // "[Material Design Colorsは]、Googleのデザイン用の色で、"
  materialNote: 6, // "[色ごとに]明るさの段階があります。"
  japanese: 7, // "[日本の]伝統色は、"
  japaneseNote: 8, // "[桜色]や萌葱色など、昔から使われてきた和の色です。"
  toggle: 9, // "[メニューの]Color Samplesで、表示を切り替えられます。"
} as const;
// When each step's words are spoken, counted from when the slide appears. Estimated from the
// reading (kana) of the Japanese narration at 8 morae/s, with pauses at 、(0.25 s) ・(0.15 s)
// 。(0.5 s) and 0.6 s before speech starts — calibrated on the hand-tuned RGB slide.
const STEP_AT_MS = [600, 6500, 11700, 14000, 18500, 21100, 25200, 28100, 29700, 34400];

// Two rounded panels: the four sample sets (top), where to switch them (bottom)
const TOP_PANEL = { y: 0, height: 258 };
const BOTTOM_PANEL = { y: 266, height: 44 };

// The four sets, as named in the app's Color Samples menu, with a few of their colors
// (from constants/sampleColors.js)
const SETS = [
  {
    key: 'grid',
    name: 'RGB Cube Grid',
    step: STEP.grid,
    noteStep: STEP.gridNote,
    colors: [
      '#ff0000',
      '#ffaa00',
      '#aaff2b',
      '#00d5aa',
      '#0055ff',
      '#8000d5',
      '#ff80aa',
      '#555555',
    ],
  },
  {
    key: 'css',
    name: 'CSS Named Colors',
    step: STEP.css,
    noteStep: STEP.cssNote,
    // tomato, skyblue, gold, coral, orchid, seagreen, thistle, navy
    colors: [
      '#ff6347',
      '#87ceeb',
      '#ffd700',
      '#ff7f50',
      '#da70d6',
      '#2e8b57',
      '#d8bfd8',
      '#000080',
    ],
  },
  {
    key: 'material',
    name: 'Material Design Colors',
    step: STEP.material,
    noteStep: STEP.materialNote,
    // Red 50, 100, 200, 300, 500, 700, 800, 900
    colors: [
      '#ffebee',
      '#ffcdd2',
      '#ef9a9a',
      '#e57373',
      '#f44336',
      '#d32f2f',
      '#c62828',
      '#b71c1c',
    ],
  },
  {
    key: 'japanese',
    name: 'Japanese Traditional Colors',
    step: STEP.japanese,
    noteStep: STEP.japaneseNote,
    // 桜色, 萌葱色, 小豆色, 山吹色, 茜色, 瑠璃色, 古代紫, 若竹色
    colors: [
      '#fef4f4',
      '#006e54',
      '#96514d',
      '#f8b500',
      '#b7282e',
      '#1e50a2',
      '#895b8a',
      '#68be8d',
    ],
  },
];
const ROW = { y0: 10, pitch: 62, checkX: 12, textX: 32, swatchX0: 32, swatch: 18, swatchPitch: 23 };

const ColorSamples = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.color_samples.${key}`);
  const step = useSlideStep(STEP_AT_MS);
  const checked = step >= STEP.toggle;

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

        {/* ── top: the four sets ── */}
        {SETS.map((set, i) => {
          const y = ROW.y0 + i * ROW.pitch;
          return (
            <g key={set.key}>
              {/* the menu's checkbox, ticked when the narration mentions switching */}
              <g style={fade(step >= STEP.intro)}>
                <rect
                  x={ROW.checkX}
                  y={y + 4}
                  width="14"
                  height="14"
                  rx="3"
                  fill={checked ? '#4e8cee' : '#fff'}
                  stroke={checked ? '#4e8cee' : '#999'}
                  strokeWidth="1.5"
                  style={{
                    transition: `fill 300ms ease ${i * 200}ms, stroke 300ms ease ${i * 200}ms`,
                  }}
                />
                <path
                  d={`M${ROW.checkX + 3},${y + 11} l3,3 l6,-7`}
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2"
                  style={fade(checked, i * 200)}
                />
              </g>
              <g style={fade(step >= set.step)}>
                <text x={ROW.textX} y={y + 16} fontSize="13" fontWeight="bold" fill="#333">
                  {set.name}
                </text>
                {set.colors.map((c, j) => (
                  <rect
                    key={c}
                    x={ROW.swatchX0 + j * ROW.swatchPitch}
                    y={y + 24}
                    width={ROW.swatch}
                    height={ROW.swatch}
                    rx="4"
                    fill={c}
                    stroke="rgba(0,0,0,0.15)"
                  />
                ))}
              </g>
              <text
                x={ROW.textX}
                y={y + 57}
                fontSize="12"
                fill="#555"
                style={fade(step >= set.noteStep)}
              >
                {k(`${set.key}Note`)}
              </text>
            </g>
          );
        })}

        {/* ── bottom: switch them in the menu ── */}
        <text
          x="115"
          y={BOTTOM_PANEL.y + 27}
          textAnchor="middle"
          fontSize="13"
          fill="#333"
          style={fade(step >= STEP.toggle)}
        >
          {k('toggle')}
        </text>
      </svg>
    </div>
  );
};

export default ColorSamples;
