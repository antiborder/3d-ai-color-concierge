import { useTranslation } from 'react-i18next';
import { fade, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/hsb_vs_hsl.py); each step starts on the word in [ ].
 */
const STEP = {
  frame: 0, // "[HSBとHSLは]、明るさの決め方が違います。"
  hsbSlice: 1, // "1つの色相で縦に切ると、[HSBは逆三角形]、"
  hslSlice: 2, // "[HSLは上下に尖った]形です。"
  hsbRed: 3, // "鮮やかな赤は、HSBでは[一番上]の明度100%、"
  hslRed: 4, // "HSLでは[真ん中]の輝度50%です。"
  hsbWhite: 5, // "白は、HSBでは[上の辺]の中心、"
  hslWhite: 6, // "HSLでは一番上の[頂点]です。"
  compare: 7, // "[彩度と明るさ]が100%のとき、"
  hsbSwatch: 8, // "HSBは[鮮やかな色]、"
  hslSwatch: 9, // "HSLは[白になります]。"
} as const;
// When each step's words are spoken, counted from when the slide appears. Estimated from the
// reading (kana) of the Japanese narration at 8 morae/s, with pauses at 、(0.25 s) ・(0.15 s)
// 。(0.5 s) and 0.6 s before speech starts — calibrated on the hand-tuned RGB slide.
const STEP_AT_MS = [600, 7400, 9600, 15100, 18600, 23000, 26500, 27700, 31400, 33500];

const HUE = 0; // red

/** HSB (h in degrees, s and b in 0–1) to a #rrggbb color */
const hsbToHex = (h: number, s: number, b: number) => {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return b - b * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return toHex(f(5), f(3), f(1));
};
/** HSL (h in degrees, s and l in 0–1) to a #rrggbb color */
const hslToHex = (h: number, s: number, l: number) => {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return toHex(f(0), f(8), f(4));
};
const toHex = (r: number, g: number, b: number) =>
  '#' +
  [r, g, b]
    .map((v) =>
      Math.round(Math.max(0, Math.min(1, v)) * 255)
        .toString(16)
        .padStart(2, '0')
    )
    .join('');

// Two rounded panels: the two cross-sections (top) and the same values in each (bottom)
const TOP_PANEL = { y: 0, height: 215 };
const BOTTOM_PANEL = { y: 223, height: 87 };

// Cross-sections through the gray axis at one hue: the axis is on the left of each, distance
// from it is saturation (out to `width`), height is brightness / lightness
const SLICE = { top: 50, bottom: 190, width: 80 };
const HSB_X = 26; // axis of the HSB slice
const HSL_X = 128; // axis of the HSL slice
const CELL = 4;

interface Cell {
  x: number;
  y: number;
  color: string;
}

/** Fill the HSB slice: at brightness b the cone's radius is b, so it narrows to black */
const hsbCells = (): Cell[] => {
  const cells: Cell[] = [];
  for (let y = SLICE.top; y < SLICE.bottom; y += CELL) {
    const b = 1 - (y + CELL / 2 - SLICE.top) / (SLICE.bottom - SLICE.top);
    for (let x = 0; x < SLICE.width; x += CELL) {
      // Cells run a little past the edge; the slice's outline clips them smooth
      if (x > b * SLICE.width) break;
      const r = Math.min((x + CELL / 2) / SLICE.width, b);
      cells.push({ x: HSB_X + x, y, color: hsbToHex(HUE, b > 0 ? r / b : 0, b) });
    }
  }
  return cells;
};

/** Fill the HSL slice: the radius is widest at lightness 50% and narrows to white and black */
const hslCells = (): Cell[] => {
  const cells: Cell[] = [];
  for (let y = SLICE.top; y < SLICE.bottom; y += CELL) {
    const l = 1 - (y + CELL / 2 - SLICE.top) / (SLICE.bottom - SLICE.top);
    const maxR = 1 - Math.abs(2 * l - 1);
    for (let x = 0; x < SLICE.width; x += CELL) {
      if (x > maxR * SLICE.width) break;
      const r = Math.min((x + CELL / 2) / SLICE.width, maxR);
      cells.push({ x: HSL_X + x, y, color: hslToHex(HUE, maxR > 0 ? r / maxR : 0, l) });
    }
  }
  return cells;
};
const HSB_CELLS = hsbCells();
const HSL_CELLS = hslCells();

const MID_Y = (SLICE.top + SLICE.bottom) / 2;
const HSB_OUTLINE = `${HSB_X},${SLICE.top} ${HSB_X + SLICE.width},${SLICE.top} ${HSB_X},${SLICE.bottom}`;
const HSL_OUTLINE = `${HSL_X},${SLICE.top} ${HSL_X + SLICE.width},${MID_Y} ${HSL_X},${SLICE.bottom}`;
const PURE = hsbToHex(HUE, 1, 1);

const SWATCH = { y: BOTTOM_PANEL.y + 36, size: 36, hsbX: 70, hslX: 172 };

const HsbVsHsl = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.hsb_vs_hsl.${key}`);
  const step = useSlideStep(STEP_AT_MS);
  const halo = { paintOrder: 'stroke' as const, stroke: '#fff', strokeWidth: 3 };

  const dot = (x: number, y: number, fill: string, on: boolean) => (
    <circle cx={x} cy={y} r="5" fill={fill} stroke="#333" strokeWidth="1.5" style={fade(on)} />
  );

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
          <clipPath id="hsbVsHslHsbClip">
            <polygon points={HSB_OUTLINE} />
          </clipPath>
          <clipPath id="hsbVsHslHslClip">
            <polygon points={HSL_OUTLINE} />
          </clipPath>
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

        {/* ── top: cross-sections at one hue ── */}
        <g style={fade(step >= STEP.frame)}>
          {[
            { x: HSB_X, label: 'HSB', axis: k('brightness') },
            { x: HSL_X, label: 'HSL', axis: k('lightness') },
          ].map((s) => (
            <g key={s.label}>
              <text
                x={s.x + SLICE.width / 2}
                y={SLICE.top - 22}
                textAnchor="middle"
                fontSize="15"
                fontWeight="bold"
                fill="#333"
              >
                {s.label}
              </text>
              {/* the gray axis */}
              <line
                x1={s.x}
                y1={SLICE.top - 6}
                x2={s.x}
                y2={SLICE.bottom + 4}
                stroke="#888"
                strokeWidth="1"
              />
              <text
                x={s.x - 10}
                y={MID_Y}
                textAnchor="middle"
                fontSize="13"
                fill="#555"
                transform={`rotate(-90, ${s.x - 10}, ${MID_Y})`}
              >
                {s.axis}
              </text>
              <text x={s.x + 6} y={SLICE.bottom + 16} fontSize="13" fill="#333">
                {k('black')}
              </text>
            </g>
          ))}
        </g>

        <g style={fade(step >= STEP.hsbSlice)}>
          <g clipPath="url(#hsbVsHslHsbClip)">
            {HSB_CELLS.map((c) => (
              <rect
                key={`${c.x}-${c.y}`}
                x={c.x}
                y={c.y}
                width={CELL + 0.5}
                height={CELL + 0.5}
                fill={c.color}
              />
            ))}
          </g>
          <polygon points={HSB_OUTLINE} fill="none" stroke="#666" strokeWidth="1" />
        </g>
        <g style={fade(step >= STEP.hslSlice)}>
          <g clipPath="url(#hsbVsHslHslClip)">
            {HSL_CELLS.map((c) => (
              <rect
                key={`${c.x}-${c.y}`}
                x={c.x}
                y={c.y}
                width={CELL + 0.5}
                height={CELL + 0.5}
                fill={c.color}
              />
            ))}
          </g>
          <polygon points={HSL_OUTLINE} fill="none" stroke="#666" strokeWidth="1" />
        </g>

        {/* the vivid red: brightness 100% in HSB, lightness 50% in HSL */}
        {dot(HSB_X + SLICE.width, SLICE.top, PURE, step >= STEP.hsbRed)}
        <text
          x={HSB_X + SLICE.width - 6}
          y={SLICE.top + 18}
          textAnchor="end"
          fontSize="13"
          fontWeight="bold"
          fill="#333"
          style={{ ...halo, ...fade(step >= STEP.hsbRed) }}
        >
          100%
        </text>
        {dot(HSL_X + SLICE.width, MID_Y, PURE, step >= STEP.hslRed)}
        <text
          x={HSL_X + SLICE.width}
          y={MID_Y + 22}
          textAnchor="end"
          fontSize="13"
          fontWeight="bold"
          fill="#333"
          style={{ ...halo, ...fade(step >= STEP.hslRed) }}
        >
          50%
        </text>

        {/* white: the middle of the top edge in HSB, the top tip in HSL */}
        {dot(HSB_X, SLICE.top, '#fff', step >= STEP.hsbWhite)}
        <text
          x={HSB_X + 8}
          y={SLICE.top - 6}
          fontSize="13"
          fill="#333"
          style={fade(step >= STEP.hsbWhite)}
        >
          {k('white')}
        </text>
        {dot(HSL_X, SLICE.top, '#fff', step >= STEP.hslWhite)}
        <text
          x={HSL_X + 8}
          y={SLICE.top - 6}
          fontSize="13"
          fill="#333"
          style={fade(step >= STEP.hslWhite)}
        >
          {k('white')}
        </text>

        {/* ── bottom: saturation 100% and brightness / lightness 100% ── */}
        <text
          x="12"
          y={BOTTOM_PANEL.y + 20}
          fontSize="13"
          fontWeight="bold"
          fill="#333"
          style={fade(step >= STEP.compare)}
        >
          {k('compare')}
        </text>
        {[
          { label: 'HSB', x: SWATCH.hsbX, color: PURE, on: step >= STEP.hsbSwatch },
          { label: 'HSL', x: SWATCH.hslX, color: '#fff', on: step >= STEP.hslSwatch },
        ].map((s) => (
          <g key={s.label} style={fade(s.on)}>
            <text
              x={s.x - 8}
              y={SWATCH.y + SWATCH.size / 2 + 5}
              textAnchor="end"
              fontSize="14"
              fontWeight="bold"
              fill="#333"
            >
              {s.label}
            </text>
            <rect
              x={s.x}
              y={SWATCH.y}
              width={SWATCH.size}
              height={SWATCH.size}
              rx="6"
              fill={s.color}
              stroke="#bbb"
              strokeWidth="1"
            />
          </g>
        ))}
      </svg>
    </div>
  );
};

export default HsbVsHsl;
