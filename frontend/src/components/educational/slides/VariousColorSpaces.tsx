import { useTranslation } from 'react-i18next';
import { rgbToLab } from '../../../utils/gamutUtils';
import { fade, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/various_color_spaces.py); each step starts on the word in [ ].
 */
const STEP = {
  intro: 0, // "[色空間は]、色を数値で表すための座標の決め方で、目的に合わせてたくさんの種類があります。"
  screen: 1, // "[画面の]ためのRGB、"
  print: 2, // "[印刷の]ためのCMYK、"
  intuitive: 3, // "色を[直感的に]選ぶためのHSBやHSL、"
  reference: 4, // "[基準と]なるXYZやLMS、"
  perceptual: 5, // "そして[見た目の差を]そろえたLabやOKLabなどです。"
  values: 6, // "[同じオレンジ]でも、色空間ごとに数値の表し方が変わります。"
  app: 7, // "[このアプリでは]、これらの色空間の形を切り替えて見比べられます。"
} as const;
// When each step's words are spoken, counted from when the slide appears. Estimated from the
// reading (kana) of the Japanese narration at 8 morae/s, with pauses at 、(0.25 s) ・(0.15 s)
// 。(0.5 s) and 0.6 s before speech starts — calibrated on the hand-tuned RGB slide.
const STEP_AT_MS = [600, 8100, 10100, 12700, 16500, 19800, 23200, 28200];

// Two rounded panels: the color spaces grouped by purpose (top), one color in several (bottom)
const TOP_PANEL = { y: 0, height: 202 };
const BOTTOM_PANEL = { y: 210, height: 100 };

// Groups by purpose: a label, then the color spaces as chips
const GROUPS = [
  { key: 'screen', spaces: ['RGB'], color: '#d9534f', step: STEP.screen },
  { key: 'print', spaces: ['CMYK'], color: '#2a9bb5', step: STEP.print },
  { key: 'intuitive', spaces: ['HSB', 'HSL'], color: '#e08a1e', step: STEP.intuitive },
  { key: 'reference', spaces: ['XYZ', 'LMS'], color: '#6b7787', step: STEP.reference },
  {
    key: 'perceptual',
    spaces: ['Lab', 'LCH', 'OkLab', 'OkLCH'],
    color: '#7a4fd0',
    step: STEP.perceptual,
  },
];
const GROUP = { y0: 6, pitch: 38, chipH: 20, chipGap: 6, x0: 12 };
const CHAR_W = 8.2; // approximate width of a 13px bold character
const chipW = (label: string) => label.length * CHAR_W + 14;

// Bottom: orange in four color spaces
const ORANGE: [number, number, number] = [255, 128, 0];
const hsb = ([r, g, b]: number[]) => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d > 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
  }
  return [
    Math.round((h * 60 + 360) % 360),
    Math.round((max ? d / max : 0) * 100),
    Math.round((max / 255) * 100),
  ];
};
const cmyk = ([r, g, b]: number[]) => {
  const k = 1 - Math.max(r, g, b) / 255;
  if (k >= 1) return [0, 0, 0, 100];
  const c = (v: number) => Math.round(((1 - v / 255 - k) / (1 - k)) * 100);
  return [c(r), c(g), c(b), Math.round(k * 100)];
};
const VALUES = [
  { name: 'RGB', text: ORANGE.join(', ') },
  { name: 'HSB', text: (([h, s, v]) => `${h}°, ${s}%, ${v}%`)(hsb(ORANGE)) },
  { name: 'CMYK', text: cmyk(ORANGE).join(', ') },
  {
    name: 'Lab',
    text: rgbToLab(...ORANGE)
      .map((v) => Math.round(v))
      .join(', '),
  },
];
const MONO = 'Menlo, Consolas, "Courier New", monospace';
const VALUE_ROW = { x: 70, y0: BOTTOM_PANEL.y + 22, pitch: 16 };

const VariousColorSpaces = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.various_color_spaces.${key}`);
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

        {/* ── top: color spaces grouped by what they are for ── */}
        {GROUPS.map((g, i) => {
          const y = GROUP.y0 + i * GROUP.pitch;
          let x = GROUP.x0;
          const shown = step >= g.step;
          return (
            <g key={g.key}>
              {/* the purposes are faintly visible from the start; each lights up when named */}
              <text
                x={GROUP.x0}
                y={y + 12}
                fontSize="12"
                fontWeight="bold"
                fill={g.color}
                style={{
                  opacity: shown ? 1 : step >= STEP.intro ? 0.3 : 0,
                  transition: 'opacity 600ms ease',
                }}
              >
                {k(g.key)}
              </text>
              {g.spaces.map((s, j) => {
                const w = chipW(s);
                const chipX = x;
                x += w + GROUP.chipGap;
                return (
                  <g key={s} style={fade(shown, j * 250)}>
                    <rect
                      x={chipX}
                      y={y + 18}
                      width={w}
                      height={GROUP.chipH}
                      rx={GROUP.chipH / 2}
                      fill={g.color}
                    />
                    <text
                      x={chipX + w / 2}
                      y={y + 32.5}
                      textAnchor="middle"
                      fontSize="13"
                      fontWeight="bold"
                      fill="#fff"
                    >
                      {s}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* ── bottom: the same orange, written in four color spaces ── */}
        <g style={fade(step >= STEP.values)}>
          <rect
            x="12"
            y={BOTTOM_PANEL.y + 10}
            width="46"
            height="46"
            rx="8"
            fill="rgb(255,128,0)"
          />
          <text x="35" y={BOTTOM_PANEL.y + 70} textAnchor="middle" fontSize="12" fill="#333">
            {k('orange')}
          </text>
        </g>
        {VALUES.map((v, i) => (
          <text
            key={v.name}
            x={VALUE_ROW.x}
            y={VALUE_ROW.y0 + i * VALUE_ROW.pitch}
            fontSize="12"
            fontFamily={MONO}
            fill="#333"
            style={fade(step >= STEP.values, 300 + i * 300)}
          >
            <tspan fontWeight="bold">{v.name.padEnd(5, ' ')}</tspan>
            {v.text}
          </text>
        ))}
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

export default VariousColorSpaces;
