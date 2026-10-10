import { useTranslation } from 'react-i18next';
import { fade, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/css_color.py); each step starts on the word in [ ].
 */
const STEP = {
  intro: 0, // "[CSS Named Colorsは]、ウェブページの色を、英語の名前で指定できるようにした色のセットで、約140色あります。"
  basic: 1, // "[red]やblueのような基本の色から、"
  familiar: 2, // "[tomato]、skyblue、goldのような、身近なものにちなんだ名前まであります。"
  readable: 3, // "[HEX]コードより覚えやすく、コードも読みやすくなります。"
  but: 4, // "[ただし]、歴史的な経緯から、"
  darkgray: 5, // "[darkgrayが]grayより明るいといった、ちぐはぐな名前もあります。"
  app: 6, // "[このアプリの]Color Samplesで、すべての色を表示できます。"
} as const;
// When each step's words are spoken, counted from when the slide appears. Estimated from the
// reading (kana) of the Japanese narration at 8 morae/s, with pauses at 、(0.25 s) ・(0.15 s)
// 。(0.5 s) and 0.6 s before speech starts — calibrated on the hand-tuned RGB slide.
const STEP_AT_MS = [600, 10000, 12600, 18500, 22700, 25000, 29800];

// Two rounded panels: names and their colors (top), gray vs darkgray (bottom)
const TOP_PANEL = { y: 0, height: 202 };
const BOTTOM_PANEL = { y: 210, height: 100 };

// Named colors (CSS values)
const GROUPS = [
  {
    key: 'basic',
    step: STEP.basic,
    colors: [
      ['red', '#ff0000'],
      ['blue', '#0000ff'],
      ['green', '#008000'],
      ['yellow', '#ffff00'],
    ],
  },
  {
    key: 'familiar',
    step: STEP.familiar,
    colors: [
      ['tomato', '#ff6347'],
      ['skyblue', '#87ceeb'],
      ['gold', '#ffd700'],
      ['chocolate', '#d2691e'],
    ],
  },
];
const CHIP = { x0: 14, colPitch: 108, rowPitch: 20, swatch: 14 };
const groupY = (g: number) => 14 + g * 62;
const MONO = 'Menlo, Consolas, "Courier New", monospace';

// Easier to read than a HEX code
const CODE_Y = 152;

// Bottom: the names don't always follow lightness
const GRAYS = [
  { name: 'gray', hex: '#808080', x: 34 },
  { name: 'darkgray', hex: '#a9a9a9', x: 134 },
];
const GRAY = { y: BOTTOM_PANEL.y + 10, w: 62, h: 30 };

const CssColor = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.css_color.${key}`);
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

        {/* ── top: colors you can write by name ── */}
        <text
          x="216"
          y="16"
          textAnchor="end"
          fontSize="12"
          fill="#666"
          style={fade(step >= STEP.intro)}
        >
          {k('count')}
        </text>
        {GROUPS.map((g, gi) => {
          const y0 = groupY(gi);
          return (
            <g key={g.key} style={fade(step >= g.step)}>
              <text x={CHIP.x0} y={y0 + 2} fontSize="12" fontWeight="bold" fill="#555">
                {k(g.key)}
              </text>
              {g.colors.map(([name, hex], i) => {
                const x = CHIP.x0 + (i % 2) * CHIP.colPitch;
                const y = y0 + 12 + Math.floor(i / 2) * CHIP.rowPitch;
                return (
                  <g key={name}>
                    <rect
                      x={x}
                      y={y}
                      width={CHIP.swatch}
                      height={CHIP.swatch}
                      rx="3"
                      fill={hex}
                      stroke="#ccc"
                    />
                    <text
                      x={x + CHIP.swatch + 6}
                      y={y + 11.5}
                      fontSize="13"
                      fontFamily={MONO}
                      fill="#222"
                    >
                      {name}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* a name reads more easily than a HEX code */}
        <g style={fade(step >= STEP.readable)}>
          <text x={CHIP.x0} y={CODE_Y} fontSize="12" fontFamily={MONO} fill="#222">
            color: <tspan fontWeight="bold">tomato</tspan>;
          </text>
          <text x="150" y={CODE_Y} fontSize="12" fill="#00813a">
            {k('readable')}
          </text>
          <text x={CHIP.x0} y={CODE_Y + 20} fontSize="12" fontFamily={MONO} fill="#888">
            color: #ff6347;
          </text>
          <text x="150" y={CODE_Y + 20} fontSize="12" fill="#888">
            {k('hexLabel')}
          </text>
        </g>

        {/* ── bottom: darkgray is lighter than gray ── */}
        <g style={fade(step >= STEP.but)}>
          {GRAYS.map((g) => (
            <g key={g.name}>
              <rect x={g.x} y={GRAY.y} width={GRAY.w} height={GRAY.h} rx="5" fill={g.hex} />
              <text
                x={g.x + GRAY.w / 2}
                y={GRAY.y + GRAY.h + 15}
                textAnchor="middle"
                fontSize="13"
                fontFamily={MONO}
                fill="#222"
              >
                {g.name}
              </text>
            </g>
          ))}
        </g>
        <text
          x="115"
          y={BOTTOM_PANEL.y + 74}
          textAnchor="middle"
          fontSize="13"
          fontWeight="bold"
          fill="#c0392b"
          style={fade(step >= STEP.darkgray)}
        >
          {k('darkgray')}
        </text>
        <text
          x="115"
          y={BOTTOM_PANEL.y + BOTTOM_PANEL.height - 8}
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

export default CssColor;
