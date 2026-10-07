import { useTranslation } from 'react-i18next';
import { fade, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/hue.py); each step starts on the word in [ ].
 */
const STEP = {
  intro: 0, // "[色相は]、"
  red: 1, // "[赤]・"
  yellow: 2, // "[黄色]・"
  green: 3, // "[緑]・"
  blue: 4, // "[青]など、色の種類のことです。"
  bar: 5, // "HSBやHSLでは、色相を[0から]360度の角度で表します。"
  at0: 6, // "[赤が]0度、"
  at60: 7, // "[黄色が]60度、"
  at120: 8, // "[緑が]120度、"
  at180: 9, // "[シアンが]180度、"
  at240: 10, // "[青が]240度、"
  at300: 11, // "[マゼンタが]300度で、"
  at360: 12, // "[360度で]また赤に戻ります。"
  same: 13, // "[同じ]色相でも、彩度や明るさを変えると、"
  variety: 14, // "[さまざまな]色になります。"
} as const;
// When each step's words are spoken, counted from when the slide appears. Estimated from the
// reading (kana) of the Japanese narration at 8 morae/s, with pauses at 、(0.25 s) ・(0.15 s)
// 。(0.5 s) and 0.6 s before speech starts — calibrated on the hand-tuned RGB slide.
const STEP_AT_MS = [
  600, 1500, 1900, 2400, 2900, 8500, 12000, 13000, 14400, 15900, 17600, 19200, 20800, 23800, 27000,
];

// Two rounded panels: kinds of color and their angles (top), one hue in many colors (bottom)
const TOP_PANEL = { y: 0, height: 150 };
const BOTTOM_PANEL = { y: 158, height: 152 };

const hsl = (h: number, s = 100, l = 50) => `hsl(${h} ${s}% ${l}%)`;

// Kinds of color
const KINDS = [
  { key: 'red', h: 0, step: STEP.red },
  { key: 'yellow', h: 60, step: STEP.yellow },
  { key: 'green', h: 120, step: STEP.green },
  { key: 'blue', h: 240, step: STEP.blue },
];
const KIND = { y: 24, x0: 46, gap: 46, r: 11 };

// The 0–360° bar
const BAR = { x0: 22, x1: 208, y: 92, h: 16 };
const xOfHue = (h: number) => BAR.x0 + (h / 360) * (BAR.x1 - BAR.x0);
const BAR_STOPS = [0, 60, 120, 180, 240, 300, 360];
const MARKS = [
  { h: 0, step: STEP.at0 },
  { h: 60, step: STEP.at60 },
  { h: 120, step: STEP.at120 },
  { h: 180, step: STEP.at180 },
  { h: 240, step: STEP.at240 },
  { h: 300, step: STEP.at300 },
  { h: 360, step: STEP.at360 },
];

// One hue (30°, orange) with saturation and lightness changed
const VARIATION_HUE = 30;
const GRID = {
  x0: 43,
  y0: BOTTOM_PANEL.y + 36,
  size: 30,
  gap: 8,
  rows: [
    [100, 100, 100, 100].map((s, i) => ({ s, l: [30, 45, 60, 75][i] })),
    [70, 70, 70, 70].map((s, i) => ({ s, l: [30, 45, 60, 75][i] })),
    [35, 35, 35, 35].map((s, i) => ({ s, l: [30, 45, 60, 75][i] })),
  ],
};

const Hue = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.hue.${key}`);
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
          <linearGradient id="hueBar" x1="0%" y1="0%" x2="100%" y2="0%">
            {BAR_STOPS.map((h) => (
              <stop key={h} offset={`${(h / 360) * 100}%`} stopColor={hsl(h)} />
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

        {/* ── top: kinds of color ── */}
        {KINDS.map((c, i) => {
          const x = KIND.x0 + i * KIND.gap;
          return (
            <g key={c.key} style={fade(step >= c.step)}>
              <circle cx={x} cy={KIND.y} r={KIND.r} fill={hsl(c.h)} />
              <text
                x={x}
                y={KIND.y + KIND.r + 16}
                textAnchor="middle"
                fontSize="13"
                fontWeight="bold"
                fill="#333"
              >
                {k(c.key)}
              </text>
            </g>
          );
        })}

        {/* …given as an angle from 0 to 360° */}
        <g style={fade(step >= STEP.bar)}>
          <rect
            x={BAR.x0}
            y={BAR.y}
            width={BAR.x1 - BAR.x0}
            height={BAR.h}
            rx="3"
            fill="url(#hueBar)"
          />
        </g>
        {MARKS.map((m) => {
          const x = xOfHue(m.h);
          return (
            <g key={m.h} style={fade(step >= m.step)}>
              <path
                d={`M${x},${BAR.y + BAR.h + 3} l-5,8 h10 Z`}
                fill={hsl(m.h % 360)}
                stroke="#333"
                strokeWidth="1"
              />
              <text
                x={x}
                y={BAR.y + BAR.h + 26}
                textAnchor="middle"
                fontSize="12"
                fontWeight="bold"
                fill="#333"
              >
                {m.h}°
              </text>
            </g>
          );
        })}
        {/* 360° is red again */}
        <path
          d={`M${xOfHue(360)},${BAR.y - 4} C${xOfHue(360)},${BAR.y - 22} ${xOfHue(0)},${BAR.y - 22} ${xOfHue(0)},${BAR.y - 4}`}
          fill="none"
          stroke="#c00"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          style={fade(step >= STEP.at360, 300)}
        />
        <text
          x="115"
          y={BAR.y - 19}
          textAnchor="middle"
          fontSize="12"
          fontWeight="bold"
          fill="#c00"
          stroke="#f7f8fb"
          strokeWidth="4"
          paintOrder="stroke"
          style={fade(step >= STEP.at360, 300)}
        >
          {k('backToRed')}
        </text>

        {/* ── bottom: the same hue in many colors ── */}
        <text
          x="115"
          y={BOTTOM_PANEL.y + 22}
          textAnchor="middle"
          fontSize="13"
          fontWeight="bold"
          fill="#555"
          style={fade(step >= STEP.same)}
        >
          {k('sameHue')}
        </text>
        {GRID.rows.map((row, r) =>
          row.map((c, i) => (
            <rect
              key={`${r}-${i}`}
              x={GRID.x0 + i * (GRID.size + GRID.gap)}
              y={GRID.y0 + r * (GRID.size + GRID.gap)}
              width={GRID.size}
              height={GRID.size}
              rx="5"
              fill={hsl(VARIATION_HUE, c.s, c.l)}
              style={fade(r === 0 ? step >= STEP.same : step >= STEP.variety, (r + i) * 120)}
            />
          ))
        )}
      </svg>
    </div>
  );
};

export default Hue;
