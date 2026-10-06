import { useTranslation } from 'react-i18next';
import { draw, fade, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/screen_mechanism.py); each step starts on the word in [ ].
 */
const STEP = {
  screen: 0, // "[画面は]、たくさんの小さな点、"
  pixels: 1, // "[画素]でできています。"
  red: 2, // "画素を拡大すると、[赤]・"
  green: 3, // "[緑]・"
  blue: 4, // "[青]の小さな光が並んでいます。"
  blend: 5, // "小さすぎて見分けられないので、[目には]混ざった1つの色に見えます。"
  levels: 6, // "それぞれの光は[256段階]で明るさを変えられるので、"
  power: 7, // "256の[3乗]、"
  total: 8, // "[約]1677万色を表せます。"
} as const;
// When each step's words are spoken, counted from when the slide appears. Estimated from the
// reading (kana) of the Japanese narration at 8 morae/s, with pauses at 、(0.25 s) ・(0.15 s)
// 。(0.5 s) and 0.6 s before speech starts — calibrated on the hand-tuned RGB slide.
const STEP_AT_MS = [600, 3000, 6100, 6500, 7000, 11900, 15800, 20300, 21000];

// Two rounded panels: a screen and a close-up of its pixels (top), how many colors (bottom)
const TOP_PANEL = { y: 0, height: 205 };
const BOTTOM_PANEL = { y: 213, height: 97 };

// A small screen showing a sunset: a sky gradient and the sun
const SCREEN = { x: 14, y: 16, width: 96, height: 64 };
const SKY_STOPS: Array<[number, [number, number, number]]> = [
  [0, [0x3b, 0x2a, 0x6b]],
  [0.55, [0xe2, 0x55, 0x7a]],
  [1, [0xff, 0xb3, 0x47]],
];
const SUN = {
  x: SCREEN.x + 62,
  y: SCREEN.y + 50,
  r: 14,
  rgb: [0xff, 0xd2, 0x7a] as [number, number, number],
};
const hex = (rgb: number[]) => `rgb(${rgb.join(',')})`;

/** The picture's color at a point on the screen */
const pictureColor = (x: number, y: number): [number, number, number] => {
  if ((x - SUN.x) ** 2 + (y - SUN.y) ** 2 <= SUN.r ** 2) return SUN.rgb;
  const t = (y - SCREEN.y) / SCREEN.height;
  const i = SKY_STOPS.findIndex(([at]) => at >= t);
  const [t1, c1] = SKY_STOPS[Math.max(1, i)];
  const [t0, c0] = SKY_STOPS[Math.max(1, i) - 1];
  const f = Math.min(1, Math.max(0, (t - t0) / (t1 - t0)));
  return c0.map((v, k) => Math.round(v + (c1[k] - v) * f)) as [number, number, number];
};

// The magnified pixels: a 4 × 3 patch where the sky meets the edge of the sun. Each pixel's
// color is the picture's color at that spot, so the close-up matches the boxed part.
const GRID = { x: 70, y: 108, cols: 4, rows: 3, cell: 30 };
const ZOOM_BOX = { x: 56, y: 58, pixel: 4 };
const ZOOM_W = GRID.cols * ZOOM_BOX.pixel;
const ZOOM_H = GRID.rows * ZOOM_BOX.pixel;
const pixelColor = (col: number, row: number) =>
  pictureColor(
    ZOOM_BOX.x + (col + 0.5) * ZOOM_BOX.pixel,
    ZOOM_BOX.y + (row + 0.5) * ZOOM_BOX.pixel
  );
const SUBPIXEL_STEPS = [STEP.red, STEP.green, STEP.blue];
const SUBPIXEL_COLORS = ['#ff0000', '#00ff00', '#0000ff'];

const ScreenMechanism = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.screen_mechanism.${key}`);
  const step = useSlideStep(STEP_AT_MS);

  // Solid pixel colors show at first and again once the eye blends the sub-pixels
  const showSolid = step >= STEP.pixels && (step < STEP.red || step >= STEP.blend);
  const gridRight = GRID.x + GRID.cols * GRID.cell;
  const gridBottom = GRID.y + GRID.rows * GRID.cell;

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
          <linearGradient id="screenSunset" x1="0%" y1="0%" x2="0%" y2="100%">
            {SKY_STOPS.map(([at, rgb]) => (
              <stop key={at} offset={`${at * 100}%`} stopColor={hex(rgb)} />
            ))}
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

        {/* ── top: a screen, then a close-up of its pixels ── */}
        <g style={fade(step >= STEP.screen)}>
          <rect
            x={SCREEN.x - 4}
            y={SCREEN.y - 4}
            width={SCREEN.width + 8}
            height={SCREEN.height + 8}
            rx="4"
            fill="#222"
          />
          <rect
            x={SCREEN.x}
            y={SCREEN.y}
            width={SCREEN.width}
            height={SCREEN.height}
            fill="url(#screenSunset)"
          />
          <circle cx={SUN.x} cy={SUN.y} r={SUN.r} fill={hex(SUN.rgb)} />
          <rect
            x={SCREEN.x + SCREEN.width / 2 - 10}
            y={SCREEN.y + SCREEN.height + 4}
            width="20"
            height="8"
            fill="#444"
          />
        </g>

        {/* the magnified part, with lines out to the close-up */}
        <g style={fade(step >= STEP.pixels)}>
          <rect
            x={ZOOM_BOX.x}
            y={ZOOM_BOX.y}
            width={ZOOM_W}
            height={ZOOM_H}
            fill="none"
            stroke="#fff"
            strokeWidth="1.5"
          />
          {[
            [ZOOM_BOX.x, ZOOM_BOX.y + ZOOM_H, GRID.x, GRID.y],
            [ZOOM_BOX.x + ZOOM_W, ZOOM_BOX.y + ZOOM_H, gridRight, GRID.y],
          ].map(([x1, y1, x2, y2]) => (
            <path
              key={`${x1}-${x2}`}
              d={`M${x1},${y1} L${x2},${y2}`}
              pathLength={1}
              fill="none"
              stroke="#999"
              strokeWidth="1"
              strokeDasharray="1"
              style={draw(step >= STEP.pixels, 0, 600)}
            />
          ))}
          <rect
            x={GRID.x - 2}
            y={GRID.y - 2}
            width={GRID.cols * GRID.cell + 4}
            height={GRID.rows * GRID.cell + 4}
            fill="#111"
          />
        </g>

        {Array.from({ length: GRID.rows }, (_, row) =>
          Array.from({ length: GRID.cols }, (_, col) => {
            const rgb = pixelColor(col, row);
            const x = GRID.x + col * GRID.cell;
            const y = GRID.y + row * GRID.cell;
            const sub = (GRID.cell - 4) / 3;
            return (
              <g key={`${col}-${row}`}>
                {/* the pixel's red, green and blue lights, each as bright as its value */}
                {SUBPIXEL_COLORS.map((color, i) => (
                  <rect
                    key={color}
                    x={x + 2 + i * sub}
                    y={y + 2}
                    width={sub - 1.5}
                    height={GRID.cell - 4}
                    rx="1.5"
                    fill={color}
                    style={{
                      opacity: step >= SUBPIXEL_STEPS[i] ? rgb[i] / 255 : 0,
                      transition: 'opacity 500ms ease',
                    }}
                  />
                ))}
                {/* the color the eye sees */}
                <rect
                  x={x + 1}
                  y={y + 1}
                  width={GRID.cell - 2}
                  height={GRID.cell - 2}
                  fill={`rgb(${rgb.join(',')})`}
                  style={{ opacity: showSolid ? 1 : 0, transition: 'opacity 700ms ease' }}
                />
              </g>
            );
          })
        )}
        <text
          x={GRID.x - 8}
          y={GRID.y + 16}
          textAnchor="end"
          fontSize="13"
          fontWeight="bold"
          fill="#333"
          style={fade(step >= STEP.pixels, 600)}
        >
          {k('pixel')}
        </text>

        {/* the eye blends the lights */}
        <g style={fade(step >= STEP.blend)}>
          <ellipse
            cx={GRID.x - 24}
            cy={gridBottom - 14}
            rx="9"
            ry="5.5"
            fill="#fff"
            stroke="#555"
            strokeWidth="1.2"
          />
          <circle cx={GRID.x - 24} cy={gridBottom - 14} r="2.6" fill="#333" />
          <text x={GRID.x - 24} y={gridBottom + 6} textAnchor="middle" fontSize="13" fill="#555">
            {k('eye')}
          </text>
        </g>

        {/* ── bottom: 256 levels for each light ── */}
        <text
          x="115"
          y={BOTTOM_PANEL.y + 22}
          textAnchor="middle"
          fontSize="13"
          fill="#333"
          style={fade(step >= STEP.levels)}
        >
          {k('levels')}
        </text>
        <text
          x="115"
          y={BOTTOM_PANEL.y + 52}
          textAnchor="middle"
          fontSize="18"
          fontWeight="bold"
          style={fade(step >= STEP.power)}
        >
          <tspan fill="#e01a00">256</tspan>
          <tspan fill="#555"> × </tspan>
          <tspan fill="#00a848">256</tspan>
          <tspan fill="#555"> × </tspan>
          <tspan fill="#2a5cff">256</tspan>
        </text>
        <text
          x="115"
          y={BOTTOM_PANEL.y + 80}
          textAnchor="middle"
          fontSize="16"
          fontWeight="bold"
          fill="#333"
          style={fade(step >= STEP.total)}
        >
          {k('total')}
        </text>
      </svg>
    </div>
  );
};

export default ScreenMechanism;
