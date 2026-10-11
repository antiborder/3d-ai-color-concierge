import { useTranslation } from 'react-i18next';
import { type RGB, grayOf, hslToRgb, rgb } from '../slideColors';
import { fade, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/color_distortion.py); each step starts on the word in [ ].
 */
const STEP = {
  intro: 0, // "[色の歪みとは]、色空間の数値の差と、見た目の差が一致しないことです。"
  example: 1, // "[例えば]HSLで、輝度を同じ50%にしても、"
  gray: 2, // "[黄色は]明るく、青は暗く見えます。"
  hues: 3, // "また、[色相を同じ]角度ずつ変えても、"
  green: 4, // "[緑のあたり]は変化が小さく、"
  red: 5, // "[赤から黄色]のあたりは大きく見えます。"
  fix: 6, // "[この歪み]を小さくするために、LabやOKLCHのような、見た目に合わせた色空間が作られました。"
} as const;
// When each step's words are spoken, counted from when the slide appears. Estimated from the
// reading (kana) of the Japanese narration at 8 morae/s, with pauses at 、(0.25 s) ・(0.15 s)
// 。(0.5 s) and 0.6 s before speech starts — calibrated on the hand-tuned RGB slide.
const STEP_AT_MS = [600, 6200, 10500, 14000, 16400, 18600, 21600];

// Two rounded panels: same lightness value, different look (top), equal hue steps (bottom)
const TOP_PANEL = { y: 0, height: 134 };
const BOTTOM_PANEL = { y: 142, height: 168 };

// Top: yellow and blue, both HSL lightness 50%
const PAIR: Array<{ key: string; color: RGB; x: number }> = [
  { key: 'light', color: hslToRgb(60, 100, 50), x: 46 },
  { key: 'dark', color: hslToRgb(240, 100, 50), x: 130 },
];
const SW = { y: 42, size: 54, grayH: 9 };

// Bottom: hue in equal 30° steps
const HUES = Array.from({ length: 12 }, (_, i) => i * 30);
const STRIP = { x0: 19, y: BOTTOM_PANEL.y + 34, w: 15, h: 26, pitch: 16 };
const cellX = (i: number) => STRIP.x0 + i * STRIP.pitch;
const BRACKETS = [
  { key: 'big', from: 0, to: 2, step: STEP.red, labelY: 22, color: '#c0392b' },
  { key: 'small', from: 3, to: 5, step: STEP.green, labelY: 40, color: '#1e7d3a' },
];

const ColorDistortion = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.color_distortion.${key}`);
  const step = useSlideStep(STEP_AT_MS);
  const bracketY = STRIP.y + STRIP.h + 6;

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

        {/* ── top: the same lightness value, a different look ── */}
        <text
          x="115"
          y="17"
          textAnchor="middle"
          fontSize="13"
          fontWeight="bold"
          fill="#333"
          style={fade(step >= STEP.intro)}
        >
          {k('what')}
        </text>
        <g style={fade(step >= STEP.example)}>
          <text x="115" y="34" textAnchor="middle" fontSize="12" fill="#666">
            {k('example')}
          </text>
          {PAIR.map((p) => (
            <rect
              key={p.key}
              x={p.x}
              y={SW.y}
              width={SW.size}
              height={SW.size}
              rx="6"
              fill={rgb(p.color)}
            />
          ))}
        </g>
        <g style={fade(step >= STEP.gray)}>
          {PAIR.map((p) => (
            <g key={p.key}>
              <rect
                x={p.x}
                y={SW.y + SW.size + 3}
                width={SW.size}
                height={SW.grayH}
                rx="2"
                fill={rgb(grayOf(p.color))}
                stroke="#ccc"
              />
              <text
                x={p.x + SW.size / 2}
                y={SW.y + SW.size + SW.grayH + 18}
                textAnchor="middle"
                fontSize="12"
                fill="#555"
              >
                {k(p.key)}
              </text>
            </g>
          ))}
        </g>

        {/* ── bottom: hue in equal steps does not change the look evenly ── */}
        <g style={fade(step >= STEP.hues)}>
          <text x={STRIP.x0} y={BOTTOM_PANEL.y + 22} fontSize="13" fontWeight="bold" fill="#333">
            {k('hueSteps')}
          </text>
          {HUES.map((h, i) => (
            <rect
              key={h}
              x={cellX(i)}
              y={STRIP.y}
              width={STRIP.w}
              height={STRIP.h}
              rx="2"
              fill={rgb(hslToRgb(h, 100, 50))}
            />
          ))}
        </g>
        {BRACKETS.map((b) => {
          const x0 = cellX(b.from);
          const x1 = cellX(b.to) + STRIP.w;
          return (
            <g key={b.key} style={fade(step >= b.step)}>
              <path
                d={`M${x0},${bracketY} v5 H${x1} v-5`}
                fill="none"
                stroke={b.color}
                strokeWidth="2"
              />
              <text
                x={(x0 + x1) / 2}
                y={bracketY + 5 + b.labelY - 4}
                textAnchor="middle"
                fontSize="12"
                fontWeight="bold"
                fill={b.color}
              >
                {k(b.key)}
              </text>
            </g>
          );
        })}
        <text
          x="115"
          y={BOTTOM_PANEL.y + BOTTOM_PANEL.height - 14}
          textAnchor="middle"
          fontSize="12"
          fill="#555"
          style={fade(step >= STEP.fix)}
        >
          {k('fix')}
        </text>
      </svg>
    </div>
  );
};

export default ColorDistortion;
