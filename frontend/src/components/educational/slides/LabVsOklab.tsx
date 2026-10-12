import { useTranslation } from 'react-i18next';
import { labToRgb, oklabToRgb, rgbToLab, rgbToOklab } from '../../../utils/gamutUtils';
import { type RGB, rgb } from '../slideColors';
import { fade, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/lab_vs_oklab.py); each step starts on the word in [ ].
 */
const STEP = {
  intro: 0, // "[LabとOKLabは]、どちらも"
  l: 1, // "[明るさ]のL、"
  a: 2, // "[赤と緑]のa、"
  b: 3, // "[青と黄色]のbの3つで色を表します。"
  labBase: 4, // "違いは作り方で、[LabはXYZ]から、"
  oklabBase: 5, // "[OKLabは目]の錐体の応答を表すLMSを経由して作られています。"
  orange: 6, // "数値の大きさも違い、[同じオレンジ]が、"
  labNums: 7, // "[Labでは67]・43・74、"
  oklabNums: 8, // "[OKLabでは0].73・0.11・0.15です。"
  gradient: 9, // "[違いがよく]わかるのは、2つの色をつなぐグラデーションです。"
  lab: 10, // "[Labで青]と白をつなぐと、"
  drift: 11, // "途中が[紫]っぽくなります。"
  oklab: 12, // "[OKLabでは、途中]も青のまま、なめらかにつながります。"
  use: 13, // "[そのため]、OKLabはグラデーションや色の計算に向いています。"
} as const;
// When each step's words are spoken, counted from when the slide appears. Estimated from the
// reading (kana) of the Japanese narration at 8 morae/s, with pauses at 、(0.25 s) ・(0.15 s)
// 。(0.5 s) and 0.6 s before speech starts — calibrated on the hand-tuned RGB slide.
const STEP_AT_MS = [
  600, 2600, 3700, 5100, 10000, 12000, 19600, 20800, 24200, 29100, 33400, 35800, 37700, 42200,
];

// Two rounded panels: what the two share and how they differ (top), one gradient in each (bottom)
const TOP_PANEL = { y: 0, height: 136 };
const BOTTOM_PANEL = { y: 144, height: 166 };

// Top: the three values both use, each with a bar from its low end to its high end
const AXES = [
  { key: 'l', letter: 'L', from: '#111', to: '#fff', step: STEP.l },
  { key: 'a', letter: 'a', from: '#2e9e4f', to: '#e0403a', step: STEP.a },
  { key: 'b', letter: 'b', from: '#2f5fe0', to: '#f2cf1d', step: STEP.b },
];
const CHIP = { y: 10, w: 66, h: 40, gap: 7, x0: 9 };

// The same orange in both spaces (rounded as in the narration)
const ORANGE: RGB = [255, 128, 0];
const LAB_NUMS = rgbToLab(...ORANGE)
  .map((v) => Math.round(v))
  .join(', ');
const OKLAB_NUMS = rgbToOklab(...ORANGE)
  .map((v) => v.toFixed(2))
  .join(', ');
const MONO = 'Menlo, Consolas, "Courier New", monospace';

// Bottom: blue → white, joined by a straight line in each space
const STOPS = 13;
const clamp = (c: RGB): RGB => c.map((v) => Math.min(255, Math.max(0, v))) as RGB;
const gradientIn = (to: (c: RGB) => RGB, from: (c: RGB) => RGB): RGB[] => {
  const a = to([0, 0, 255]);
  const b = to([255, 255, 255]);
  return Array.from({ length: STOPS }, (_, i) => {
    const t = i / (STOPS - 1);
    return clamp(from(a.map((v, x) => v + (b[x] - v) * t) as RGB));
  });
};
const ROWS = [
  {
    key: 'lab',
    label: 'Lab',
    stops: gradientIn(
      (c) => rgbToLab(...c),
      (c) => labToRgb(...c)
    ),
    y: BOTTOM_PANEL.y + 46,
    step: STEP.lab,
    note: { key: 'drift', color: '#7a3fc0', step: STEP.drift, delay: 0 },
  },
  {
    key: 'oklab',
    label: 'OKLab',
    stops: gradientIn(
      (c) => rgbToOklab(...c),
      (c) => oklabToRgb(...c)
    ),
    y: BOTTOM_PANEL.y + 102,
    step: STEP.oklab,
    note: { key: 'keep', color: '#1f5fd0', step: STEP.oklab, delay: 1200 },
  },
];
const BAR = { x: 9, w: 212, h: 30 };

const LabVsOklab = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.lab_vs_oklab.${key}`);
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
          {AXES.map((a) => (
            <linearGradient key={a.key} id={`lab-vs-oklab-axis-${a.key}`}>
              <stop offset="0" stopColor={a.from} />
              <stop offset="1" stopColor={a.to} />
            </linearGradient>
          ))}
          {ROWS.map((row) => (
            <linearGradient key={row.key} id={`lab-vs-oklab-${row.key}`}>
              {row.stops.map((c, i) => (
                <stop key={i} offset={i / (STOPS - 1)} stopColor={rgb(c)} />
              ))}
            </linearGradient>
          ))}
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

        {/* ── top: the three values both spaces use, each appearing when it is named ── */}
        {AXES.map((a, i) => {
          const x = CHIP.x0 + i * (CHIP.w + CHIP.gap);
          return (
            <g key={a.key} style={fade(step >= a.step)}>
              <rect x={x} y={CHIP.y} width={CHIP.w} height={CHIP.h} rx="6" fill="#e6eaf3" />
              <text
                x={x + CHIP.w / 2}
                y={CHIP.y + 17}
                textAnchor="middle"
                fontSize="16"
                fontWeight="bold"
                fill="#333"
              >
                {a.letter}
              </text>
              <rect
                x={x + 10}
                y={CHIP.y + 25}
                width={CHIP.w - 20}
                height="8"
                rx="4"
                fill={`url(#lab-vs-oklab-axis-${a.key})`}
                stroke="#ccc"
              />
            </g>
          );
        })}

        {/* what each is built from */}
        {[
          { key: 'labBase', y: 70, step: STEP.labBase },
          { key: 'oklabBase', y: 90, step: STEP.oklabBase },
        ].map((b) => (
          <text
            key={b.key}
            x="14"
            y={b.y}
            fontSize="14"
            fontWeight="bold"
            fill="#333"
            style={fade(step >= b.step)}
          >
            {k(b.key)}
          </text>
        ))}

        {/* the same orange, written in each */}
        <rect
          x="14"
          y="102"
          width="26"
          height="26"
          rx="5"
          fill={rgb(ORANGE)}
          style={fade(step >= STEP.orange)}
        />
        {[
          { label: 'Lab', nums: LAB_NUMS, y: 112, step: STEP.labNums },
          { label: 'OKLab', nums: OKLAB_NUMS, y: 128, step: STEP.oklabNums },
        ].map((r) => (
          <text
            key={r.label}
            x="48"
            y={r.y}
            fontSize="12"
            fontFamily={MONO}
            fill="#333"
            style={fade(step >= r.step)}
          >
            <tspan fontWeight="bold">{r.label.padEnd(6, ' ')}</tspan>
            {r.nums}
          </text>
        ))}

        {/* ── bottom: blue → white in each space ── */}
        <text
          x="115"
          y={BOTTOM_PANEL.y + 20}
          textAnchor="middle"
          fontSize="13"
          fontWeight="bold"
          fill="#333"
          style={fade(step >= STEP.gradient)}
        >
          {k('gradient')}
        </text>
        {ROWS.map((row) => (
          <g key={row.key}>
            <g style={fade(step >= row.step)}>
              <text x={BAR.x} y={row.y - 6} fontSize="13" fontWeight="bold" fill="#333">
                {row.label}
              </text>
              <rect
                x={BAR.x}
                y={row.y}
                width={BAR.w}
                height={BAR.h}
                rx="5"
                fill={`url(#lab-vs-oklab-${row.key})`}
                stroke="#ddd"
              />
            </g>
            <text
              x={BAR.x + BAR.w}
              y={row.y - 6}
              textAnchor="end"
              fontSize="13"
              fontWeight="bold"
              fill={row.note.color}
              style={fade(step >= row.note.step, row.note.delay)}
            >
              {k(row.note.key)}
            </text>
          </g>
        ))}

        <text
          x="115"
          y={BOTTOM_PANEL.y + BOTTOM_PANEL.height - 12}
          textAnchor="middle"
          fontSize="13"
          fontWeight="bold"
          fill="#333"
          style={fade(step >= STEP.use)}
        >
          {k('use')}
        </text>
      </svg>
    </div>
  );
};

export default LabVsOklab;
