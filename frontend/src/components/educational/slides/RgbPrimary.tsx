import { useTranslation } from 'react-i18next';
import { fade, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/rgb_primary.py); each step starts on the word in [ ].
 */
const STEP = {
  red: 0, // "光の三原色は、[赤]・"
  green: 1, // "[緑]・"
  blue: 2, // "[青]の3色です。"
  overlap: 3, // "光は[重ねる]ほど明るくなり、"
  yellow: 4, // "赤と緑で[黄色]、"
  cyan: 5, // "緑と青で[シアン]、"
  magenta: 6, // "青と赤で[マゼンタ]、"
  white: 7, // "3色全部で[白]になります。"
  screen: 8, // "[テレビ]やスマホの画面も、"
  pixelYellow: 9, // "小さな赤・緑・青の光の[強さ]を変えて、"
  pixelCyan: 10, // (while saying "変えて、いろいろな色を")
  pixelOrange: 11, // (… "作っています。")
} as const;
// When each step's word is spoken, counted from when the slide appears. Estimated from the
// reading (kana) of the Japanese narration at 8 morae/s, with pauses at 、(0.25 s) ・(0.15 s)
// 。(0.5 s) and 0.6 s before speech starts — calibrated on the hand-tuned RGB slide. The last
// two pixel colors are spaced out over the rest of the sentence.
const STEP_AT_MS = [2200, 2600, 3200, 5300, 7900, 9400, 10800, 12500, 13900, 18000, 19400, 20800];

// Two rounded panels: overlapping lights on a dark background (top), a screen pixel (bottom)
const TOP_PANEL = { y: 0, height: 205 };
const BOTTOM_PANEL = { y: 213, height: 97 };

const R = 44;
// Where each light ends up, and how far apart they start before being overlapped
const LIGHTS = [
  { key: 'red', color: '#ff0000', at: { x: 115, y: 80 }, from: { x: 0, y: -28 }, step: STEP.red },
  {
    key: 'green',
    color: '#00ff00',
    at: { x: 88, y: 127 },
    from: { x: -28, y: 24 },
    step: STEP.green,
  },
  {
    key: 'blue',
    color: '#0000ff',
    at: { x: 142, y: 127 },
    from: { x: 28, y: 24 },
    step: STEP.blue,
  },
];
// Labels for the mixed colors, outside the circles with a line to their region
const MIXES = [
  {
    key: 'yellow',
    color: '#ffff00',
    region: { x: 97, y: 99 },
    label: { x: 32, y: 70 },
    step: STEP.yellow,
  },
  {
    key: 'cyan',
    color: '#00ffff',
    region: { x: 115, y: 134 },
    label: { x: 115, y: 196 },
    step: STEP.cyan,
  },
  {
    key: 'magenta',
    color: '#ff00ff',
    region: { x: 133, y: 99 },
    label: { x: 194, y: 70 },
    step: STEP.magenta,
  },
  {
    key: 'white',
    color: '#ffffff',
    region: { x: 115, y: 111 },
    label: { x: 202, y: 22 },
    step: STEP.white,
  },
];

// Bottom: one screen pixel (red, green and blue sub-pixels) and the color it shows
const PIXEL = { x: 60, y: BOTTOM_PANEL.y + 32, sub: 14, gap: 4, height: 48 };
const SWATCH = { x: 150, y: BOTTOM_PANEL.y + 32, size: 48 };
const SUBPIXELS = ['#ff0000', '#00ff00', '#0000ff'];
/** Sub-pixel strengths (red, green, blue) shown at each pixel step */
const PIXEL_STATES: Array<[number, [number, number, number]]> = [
  [STEP.pixelOrange, [1, 0.5, 0]],
  [STEP.pixelCyan, [0, 1, 1]],
  [STEP.pixelYellow, [1, 1, 0]],
  [STEP.screen, [0.3, 0.3, 0.3]],
];

const RgbPrimary = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.rgb_primary.${key}`);
  const step = useSlideStep(STEP_AT_MS);

  const overlapped = step >= STEP.overlap;
  const strengths = PIXEL_STATES.find(([s]) => step >= s)?.[1] ?? [0.3, 0.3, 0.3];
  const shown = `rgb(${strengths.map((v) => Math.round(v * 255)).join(',')})`;

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
        <rect x="0" y={TOP_PANEL.y} width="230" height={TOP_PANEL.height} rx="8" fill="#111" />
        <rect
          x="0"
          y={BOTTOM_PANEL.y}
          width="230"
          height={BOTTOM_PANEL.height}
          rx="8"
          fill="#f7f8fb"
        />

        {/* ── top: three lights, first apart, then overlapped (they add up: screen blend) ── */}
        <g style={{ isolation: 'isolate' }}>
          {LIGHTS.map((light) => (
            <g
              key={light.key}
              style={{
                ...fade(step >= light.step),
                transform: overlapped
                  ? 'translate(0px, 0px)'
                  : `translate(${light.from.x}px, ${light.from.y}px)`,
                transition: 'opacity 600ms ease, transform 1500ms ease',
              }}
            >
              <circle
                cx={light.at.x}
                cy={light.at.y}
                r={R}
                fill={light.color}
                style={{ mixBlendMode: 'screen' }}
              />
            </g>
          ))}
        </g>
        {LIGHTS.map((light) => {
          // Each name sits in the part of its circle that never overlaps the others
          const away = { x: (light.at.x - 115) * 0.6, y: (light.at.y - 111) * 0.6 };
          return (
            <text
              key={light.key}
              x={light.at.x + away.x}
              y={light.at.y + away.y + 5}
              textAnchor="middle"
              fontSize="14"
              fontWeight="bold"
              fill="#fff"
              style={{
                ...fade(step >= light.step),
                transform: overlapped
                  ? 'translate(0px, 0px)'
                  : `translate(${light.from.x}px, ${light.from.y}px)`,
                transition: 'opacity 600ms ease, transform 1500ms ease',
              }}
            >
              {k(light.key)}
            </text>
          );
        })}

        {MIXES.map((mix) => (
          <g key={mix.key} style={fade(step >= mix.step)}>
            <line
              x1={mix.region.x}
              y1={mix.region.y}
              x2={mix.label.x}
              y2={mix.label.y + (mix.label.y > mix.region.y ? -12 : 4)}
              stroke="#bbb"
              strokeWidth="1"
            />
            <circle cx={mix.region.x} cy={mix.region.y} r="2.5" fill="#333" stroke="#fff" />
            <text
              x={mix.label.x}
              y={mix.label.y}
              textAnchor="middle"
              fontSize="13"
              fontWeight="bold"
              fill={mix.color}
            >
              {k(mix.key)}
            </text>
          </g>
        ))}

        {/* ── bottom: a screen pixel mixes the three lights by strength ── */}
        <g style={fade(step >= STEP.screen)}>
          <text x="12" y={BOTTOM_PANEL.y + 20} fontSize="13" fontWeight="bold" fill="#333">
            {k('pixel')}
          </text>
          <rect
            x={PIXEL.x - 6}
            y={PIXEL.y - 6}
            width={3 * PIXEL.sub + 2 * PIXEL.gap + 12}
            height={PIXEL.height + 12}
            rx="4"
            fill="#111"
          />
          {SUBPIXELS.map((color, i) => (
            <rect
              key={color}
              x={PIXEL.x + i * (PIXEL.sub + PIXEL.gap)}
              y={PIXEL.y}
              width={PIXEL.sub}
              height={PIXEL.height}
              rx="2"
              fill={color}
              style={{ opacity: strengths[i], transition: 'opacity 900ms ease' }}
            />
          ))}
          <text
            x={(PIXEL.x + 3 * PIXEL.sub + 2 * PIXEL.gap + 6 + SWATCH.x) / 2}
            y={SWATCH.y + SWATCH.size / 2 + 6}
            textAnchor="middle"
            fontSize="18"
            fill="#555"
          >
            →
          </text>
          <rect
            x={SWATCH.x}
            y={SWATCH.y}
            width={SWATCH.size}
            height={SWATCH.size}
            rx="6"
            stroke="#ccc"
            strokeWidth="1"
            style={{ fill: shown, transition: 'fill 900ms ease' }}
          />
        </g>
      </svg>
    </div>
  );
};

export default RgbPrimary;
