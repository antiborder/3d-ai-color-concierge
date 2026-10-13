import { useTranslation } from 'react-i18next';
import { fade, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/blue_yellow_paint.py); each step starts on the word in [ ].
 */
const STEP = {
  intro: 0, // "[色材の三原色のルールでは]、"
  blueIs: 1, // "[青はシアン]とマゼンタを混ぜた色です。"
  yellow: 2, // "[そこに黄色]を加えると、"
  black: 3, // "三原色がすべて混ざって[黒になります]。"
  real: 4, // "[ところが]、実際の青と黄色の絵の具を混ぜると、"
  green: 5, // "[緑になります]。"
  smooth: 6, // "…きっちり分けて吸収するのではなく、[なだらかに]反射するからです。"
  blueCurve: 7, // "[青い絵の具]は緑の光も少し反射し、"
  yellowCurve: 8, // "[黄色い絵の具]も緑の光を反射します。"
  overlap: 9, // "[両方]が反射する緑の光だけが残るので、混ぜると緑に見えるのです。"
  caution: 10, // "[ただし]、結果は絵の具の種類によって変わります。"
} as const;
// When each step's words are spoken, counted from when the slide appears. Estimated from the
// reading (kana) of the Japanese narration at 8 morae/s, with pauses at 、(0.25 s) ・(0.15 s)
// 。(0.5 s) and 0.6 s before speech starts — calibrated on the hand-tuned RGB slide.
const STEP_AT_MS = [600, 3000, 5800, 9400, 10700, 14200, 20600, 22800, 25800, 29100, 34700];

// Two rounded panels: by the rule, in three bands (top); real paints, along the spectrum (bottom)
const TOP_PANEL = { y: 0, height: 142 };
const BOTTOM_PANEL = { y: 150, height: 160 };

const RED = '#e5484d';
const GREEN = '#2fa84f';
const BLUE = '#3b6fe0';
const YELLOW = '#f2d21b';
const EMPTY = '#e6e9f0';

// Top: which of the red, green and blue bands each color reflects
const BANDS = [
  { key: 'bandR', color: RED },
  { key: 'bandG', color: GREEN },
  { key: 'bandB', color: BLUE },
];
const CELL = { x0: 78, w: 32, gap: 4, h: 18 };
const ROWS = [
  { key: 'rowBlue', swatch: '#0000ff', reflects: [0, 0, 1], step: STEP.blueIs },
  { key: 'rowYellow', swatch: '#ffff00', reflects: [1, 1, 0], step: STEP.yellow },
  { key: 'rowMix', swatch: null, reflects: [0, 0, 0], step: STEP.black },
];
const ROW = { y0: 62, pitch: 26 };
const cellX = (i: number) => CELL.x0 + i * (CELL.w + CELL.gap);
// The resulting color, wide enough for its name ("black" / "green")
const SWATCH = { x: 188, w: 36 };

// Bottom: reflectance of real paints across the visible spectrum (smooth, overlapping curves)
const CHART = { x0: 20, x1: 212, yTop: 192, yBase: 264 };
const WAVES = Array.from({ length: 61 }, (_, i) => 400 + i * 5); // 400–700 nm
const bluePaint = (nm: number) => 0.06 + 0.82 * Math.exp(-(((nm - 460) / 60) ** 2));
const yellowPaint = (nm: number) => 0.06 + 0.86 / (1 + Math.exp(-(nm - 525) / 15));
const both = (nm: number) => Math.min(bluePaint(nm), yellowPaint(nm));
const xOf = (nm: number) => CHART.x0 + ((nm - 400) / 300) * (CHART.x1 - CHART.x0);
const yOf = (r: number) => CHART.yBase - r * (CHART.yBase - CHART.yTop);
const area = (f: (nm: number) => number) =>
  `M${xOf(400)},${CHART.yBase} ` +
  WAVES.map((nm) => `L${xOf(nm).toFixed(1)},${yOf(f(nm)).toFixed(1)}`).join(' ') +
  ` L${xOf(700)},${CHART.yBase} Z`;
// The spectrum under the chart, from violet to red
const SPECTRUM = [
  [400, '#7b2cff'],
  [450, '#2a3cff'],
  [490, '#00a6d6'],
  [525, '#00b050'],
  [570, '#e8e000'],
  [600, '#ff9000'],
  [650, '#ff2000'],
  [700, '#b00000'],
] as const;

const BlueYellowPaint = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.blue_yellow_paint.${key}`);
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
        <defs>
          <linearGradient id="blue-yellow-paint-spectrum">
            {SPECTRUM.map(([nm, color]) => (
              <stop key={nm} offset={(nm - 400) / 300} stopColor={color} />
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

        {/* ── top: by the rule of the pigment primaries ── */}
        <text
          x="115"
          y="18"
          textAnchor="middle"
          fontSize="13"
          fontWeight="bold"
          fill="#333"
          style={fade(step >= STEP.intro)}
        >
          {k('rule')}
        </text>
        <g style={fade(step >= STEP.blueIs)}>
          <text x="115" y="38" textAnchor="middle" fontSize="13" fill="#333">
            {k('blueIs')}
          </text>
          {BANDS.map((b, i) => (
            <text
              key={b.key}
              x={cellX(i) + CELL.w / 2}
              y={ROW.y0 - 5}
              textAnchor="middle"
              fontSize="12"
              fontWeight="bold"
              fill={b.color}
            >
              {k(b.key)}
            </text>
          ))}
        </g>
        {ROWS.map((row, r) => {
          const y = ROW.y0 + r * ROW.pitch;
          return (
            <g key={row.key} style={fade(step >= row.step)}>
              {row.swatch && (
                <rect
                  x="12"
                  y={y + 3}
                  width="12"
                  height="12"
                  rx="2"
                  fill={row.swatch}
                  stroke="#ccc"
                />
              )}
              <text x={row.swatch ? 28 : 12} y={y + 14} fontSize="13" fontWeight="bold" fill="#333">
                {k(row.key)}
              </text>
              {BANDS.map((b, i) => (
                <rect
                  key={b.key}
                  x={cellX(i)}
                  y={y}
                  width={CELL.w}
                  height={CELL.h}
                  rx="3"
                  fill={row.reflects[i] ? b.color : EMPTY}
                />
              ))}
            </g>
          );
        })}
        {/* nothing is left to reflect: black */}
        <g style={fade(step >= STEP.black, 300)}>
          <rect
            x={SWATCH.x}
            y={ROW.y0 + 2 * ROW.pitch - 2}
            width={SWATCH.w}
            height="22"
            rx="4"
            fill="#000"
          />
          <text
            x={SWATCH.x + SWATCH.w / 2}
            y={ROW.y0 + 2 * ROW.pitch + 14}
            textAnchor="middle"
            fontSize="12"
            fontWeight="bold"
            fill="#fff"
          >
            {k('black')}
          </text>
        </g>

        {/* ── bottom: real paints ── */}
        <text
          x="12"
          y={BOTTOM_PANEL.y + 18}
          fontSize="13"
          fontWeight="bold"
          fill="#333"
          style={fade(step >= STEP.real)}
        >
          {k('real')}
        </text>
        <g style={fade(step >= STEP.green)}>
          <rect
            x={SWATCH.x}
            y={BOTTOM_PANEL.y + 4}
            width={SWATCH.w}
            height="22"
            rx="4"
            fill={GREEN}
          />
          <text
            x={SWATCH.x + SWATCH.w / 2}
            y={BOTTOM_PANEL.y + 20}
            textAnchor="middle"
            fontSize="12"
            fontWeight="bold"
            fill="#fff"
          >
            {k('green')}
          </text>
        </g>

        {/* the spectrum the paints reflect, from violet (short) to red (long) */}
        <g style={fade(step >= STEP.smooth)}>
          <line x1={CHART.x0} y1={CHART.yBase} x2={CHART.x1} y2={CHART.yBase} stroke="#999" />
          <rect
            x={CHART.x0}
            y={CHART.yBase + 4}
            width={CHART.x1 - CHART.x0}
            height="8"
            rx="2"
            fill="url(#blue-yellow-paint-spectrum)"
          />
        </g>
        <g style={fade(step >= STEP.blueCurve)}>
          <path
            d={area(bluePaint)}
            fill={BLUE}
            fillOpacity="0.28"
            stroke={BLUE}
            strokeWidth="1.5"
          />
          <text x={xOf(425)} y={CHART.yTop - 4} fontSize="12" fontWeight="bold" fill={BLUE}>
            {k('bluePaint')}
          </text>
        </g>
        <g style={fade(step >= STEP.yellowCurve)}>
          <path
            d={area(yellowPaint)}
            fill={YELLOW}
            fillOpacity="0.35"
            stroke="#c9a800"
            strokeWidth="1.5"
          />
          <text
            x={xOf(700)}
            y={CHART.yTop - 4}
            textAnchor="end"
            fontSize="12"
            fontWeight="bold"
            fill="#a88a00"
          >
            {k('yellowPaint')}
          </text>
        </g>
        {/* the light that both reflect: green */}
        <path d={area(both)} fill={GREEN} fillOpacity="0.85" style={fade(step >= STEP.overlap)} />
        <text
          x="115"
          y={BOTTOM_PANEL.y + BOTTOM_PANEL.height - 8}
          textAnchor="middle"
          fontSize="12"
          fill="#777"
          style={fade(step >= STEP.caution)}
        >
          {k('caution')}
        </text>
      </svg>
    </div>
  );
};

export default BlueYellowPaint;
