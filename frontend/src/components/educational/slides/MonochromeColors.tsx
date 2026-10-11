import { useTranslation } from 'react-i18next';
import { type RGB, grayOf, hslToRgb, rgb } from '../slideColors';
import { fade, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/monochrome_colors.py); each step starts on the word in [ ].
 */
const STEP = {
  intro: 0, // "[モノクロカラーには]、2つの意味があります。"
  achromatic: 1, // "[1つは]、白・グレー・黒だけの無彩色で、"
  gray: 2, // "[彩度が0]の色です。"
  shape: 3, // "[色みがなくても]、明るさの違いだけで形は伝わります。"
  mono: 4, // "[もう1つは]、1つの色相だけで、明るさや鮮やかさを変えて作る単色配色です。"
  unity: 5, // "色相が1つなので、[統一感]が出やすいのが特徴です。"
} as const;
// When each step's words are spoken, counted from when the slide appears. Estimated from the
// reading (kana) of the Japanese narration at 8 morae/s, with pauses at 、(0.25 s) ・(0.15 s)
// 。(0.5 s) and 0.6 s before speech starts — calibrated on the hand-tuned RGB slide.
const STEP_AT_MS = [600, 3800, 7200, 9000, 13400, 21500];

// Two rounded panels: a picture losing its color (top), one hue in several tones (bottom)
const TOP_PANEL = { y: 0, height: 202 };
const BOTTOM_PANEL = { y: 210, height: 100 };

// A small picture: sky, sun, hill and a tree
const SCENE = { x: 30, y: 12, w: 170, h: 104 };
const SKY: RGB = [126, 200, 240];
const SUN: RGB = [255, 204, 51];
const HILL: RGB = [76, 175, 80];
const TRUNK: RGB = [141, 94, 60];
const LEAVES: RGB = [46, 125, 50];
const Scene = ({ gray }: { gray: boolean }) => {
  const c = (color: RGB) => rgb(gray ? grayOf(color) : color);
  const { x, y, w, h } = SCENE;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="6" fill={c(SKY)} />
      <circle cx={x + w - 34} cy={y + 28} r="16" fill={c(SUN)} />
      <path
        d={`M${x},${y + h - 30} Q${x + w * 0.4},${y + h - 62} ${x + w},${y + h - 26} V${y + h} H${x} Z`}
        fill={c(HILL)}
      />
      <rect x={x + 42} y={y + h - 58} width="8" height="24" fill={c(TRUNK)} />
      <circle cx={x + 46} cy={y + h - 64} r="16" fill={c(LEAVES)} />
    </g>
  );
};

// White → gray → black
const GRAYS = ['#ffffff', '#c4c4c4', '#8a8a8a', '#4d4d4d', '#111111'];
const GRAY_ROW = { y: 134, size: 18, pitch: 26 };

// Bottom: one hue (blue), several tones
const MONO: RGB[] = [
  [215, 85],
  [210, 70],
  [210, 55],
  [210, 40],
  [215, 25],
].map(([h, l]) => hslToRgb(h, 60, l));
const MONO_ROW = { y: BOTTOM_PANEL.y + 30, size: 34, pitch: 40 };

const MonochromeColors = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.monochrome_colors.${key}`);
  const step = useSlideStep(STEP_AT_MS);
  const grayX0 = 115 - (GRAYS.length * GRAY_ROW.pitch - (GRAY_ROW.pitch - GRAY_ROW.size)) / 2;
  const monoX0 = 115 - (MONO.length * MONO_ROW.pitch - (MONO_ROW.pitch - MONO_ROW.size)) / 2;

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

        {/* ── top: a picture whose color is taken away ── */}
        <g style={fade(step >= STEP.intro)}>
          <Scene gray={false} />
        </g>
        <g style={{ opacity: step >= STEP.gray ? 1 : 0, transition: 'opacity 1200ms ease' }}>
          <Scene gray />
        </g>

        {/* achromatic colors: white, gray, black */}
        <g style={fade(step >= STEP.achromatic)}>
          {GRAYS.map((g, i) => (
            <rect
              key={g}
              x={grayX0 + i * GRAY_ROW.pitch}
              y={GRAY_ROW.y}
              width={GRAY_ROW.size}
              height={GRAY_ROW.size}
              rx="4"
              fill={g}
              stroke="#bbb"
            />
          ))}
          <text
            x="115"
            y={GRAY_ROW.y + GRAY_ROW.size + 17}
            textAnchor="middle"
            fontSize="13"
            fontWeight="bold"
            fill="#333"
          >
            {k('achromatic')}
          </text>
        </g>
        <text
          x="115"
          y={TOP_PANEL.height - 10}
          textAnchor="middle"
          fontSize="12"
          fill="#555"
          style={fade(step >= STEP.shape)}
        >
          {k('shape')}
        </text>

        {/* ── bottom: one hue, several tones ── */}
        <g style={fade(step >= STEP.mono)}>
          <text
            x="115"
            y={BOTTOM_PANEL.y + 20}
            textAnchor="middle"
            fontSize="13"
            fontWeight="bold"
            fill="#333"
          >
            {k('mono')}
          </text>
          {MONO.map((c, i) => (
            <rect
              key={i}
              x={monoX0 + i * MONO_ROW.pitch}
              y={MONO_ROW.y}
              width={MONO_ROW.size}
              height={MONO_ROW.size}
              rx="6"
              fill={rgb(c)}
            />
          ))}
        </g>
        <text
          x="115"
          y={BOTTOM_PANEL.y + BOTTOM_PANEL.height - 10}
          textAnchor="middle"
          fontSize="12"
          fill="#555"
          style={fade(step >= STEP.unity)}
        >
          {k('unity')}
        </text>
      </svg>
    </div>
  );
};

export default MonochromeColors;
