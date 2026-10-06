import { useTranslation } from 'react-i18next';
import {
  ChromaticityAxes,
  ChromaticityFill,
  DISPLAY_P3,
  LOCUS_PATH,
  SRGB,
  WHITE_D65,
  toPx,
  trianglePath,
} from '../chromaticity';
import { draw, fade, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/display_gamut.py); each step starts on the word in [ ].
 */
const STEP = {
  diagram: 0, // "[画面に表示できる色は]、色度図の上では、"
  triangle: 1, // "[三角形の中だけです]。"
  red: 2, // "三角形の角は、画面の[赤]・"
  green: 3, // "[緑]・"
  blue: 4, // "[青]の光の色で、"
  outside: 5, // "この3色を混ぜても、[三角形の外の色は]作れません。"
  greens: 6, // "[特に]、鮮やかな緑や青緑の多くは、画面では表示できません。"
  wide: 7, // "最近の画面には、[より広い三角形を]表示できるものもあります。"
} as const;
// When each step's words are spoken, counted from when the slide appears. Estimated from the
// reading (kana) of the Japanese narration at 8 morae/s, with pauses at 、(0.25 s) ・(0.15 s)
// 。(0.5 s) and 0.6 s before speech starts — calibrated on the hand-tuned RGB slide.
const STEP_AT_MS = [600, 3800, 8000, 8400, 8900, 12900, 14900, 20300];

// Two rounded panels: the diagram (top), the two kinds of screen (bottom)
const TOP_PANEL = { y: 0, height: 220 };
const BOTTOM_PANEL = { y: 228, height: 82 };

const CORNERS = [
  { key: 'red', xy: SRGB.r, color: '#e01a00', step: STEP.red, dx: 8, dy: 4, anchor: 'start' },
  { key: 'green', xy: SRGB.g, color: '#00a848', step: STEP.green, dx: 8, dy: -2, anchor: 'start' },
  { key: 'blue', xy: SRGB.b, color: '#2a5cff', step: STEP.blue, dx: -8, dy: 4, anchor: 'end' },
] as const;

// Where vivid greens and blue-greens lie outside the sRGB triangle
const GREENS = { ...toPx(0.14, 0.62), rx: 26, ry: 44 };

const DisplayGamut = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.display_gamut.${key}`);
  const step = useSlideStep(STEP_AT_MS);

  const white = toPx(WHITE_D65[0], WHITE_D65[1]);

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

        {/* ── top: the diagram with the screen's triangle ── */}
        <g style={fade(step >= STEP.diagram)}>
          <ChromaticityAxes />
          <ChromaticityFill id="displayGamut" />
          <path d={LOCUS_PATH} fill="none" stroke="#999" strokeWidth="1" />
        </g>

        {/* colors outside the triangle can't be made: wash them out */}
        <path
          d={`${LOCUS_PATH} ${trianglePath(SRGB)}`}
          fillRule="evenodd"
          fill="#f7f8fb"
          style={{ opacity: step >= STEP.outside ? 0.72 : 0, transition: 'opacity 900ms ease' }}
        />

        <path
          d={trianglePath(SRGB)}
          pathLength={1}
          fill="none"
          stroke="#222"
          strokeWidth="1.8"
          strokeLinejoin="round"
          style={draw(step >= STEP.triangle, 0, 1400)}
        />
        <circle
          cx={white.x}
          cy={white.y}
          r="3.5"
          fill="#fff"
          stroke="#333"
          strokeWidth="1.2"
          style={fade(step >= STEP.triangle, 800)}
        />

        {/* the corners: the screen's red, green and blue lights */}
        {CORNERS.map((c) => {
          const p = toPx(c.xy[0], c.xy[1]);
          return (
            <g key={c.key} style={fade(step >= c.step)}>
              <circle cx={p.x} cy={p.y} r="5" fill={c.color} stroke="#fff" strokeWidth="1.5" />
              <text
                x={p.x + c.dx}
                y={p.y + c.dy}
                textAnchor={c.anchor}
                fontSize="13"
                fontWeight="bold"
                fill={c.color}
                stroke="#fff"
                strokeWidth="3"
                paintOrder="stroke"
              >
                {k(c.key)}
              </text>
            </g>
          );
        })}

        {/* vivid greens and blue-greens a screen can't show */}
        <g style={fade(step >= STEP.greens)}>
          <ellipse
            cx={GREENS.x}
            cy={GREENS.y}
            rx={GREENS.rx}
            ry={GREENS.ry}
            fill="none"
            stroke="#00813a"
            strokeWidth="2"
            strokeDasharray="4 3"
          />
          <text
            x={GREENS.x + GREENS.rx + 4}
            y={toPx(0, 0.8).y}
            fontSize="13"
            fontWeight="bold"
            fill="#00813a"
          >
            {k('greens')}
          </text>
          <text
            x={GREENS.x + GREENS.rx + 4}
            y={toPx(0, 0.8).y + 17}
            fontSize="13"
            fontWeight="bold"
            fill="#00813a"
          >
            {k('cannotShow')}
          </text>
        </g>

        {/* a wider triangle on newer screens */}
        <path
          d={trianglePath(DISPLAY_P3)}
          fill="none"
          stroke="#222"
          strokeWidth="1.5"
          strokeDasharray="5 3"
          strokeLinejoin="round"
          style={fade(step >= STEP.wide)}
        />

        {/* ── bottom: a usual screen and a wide-gamut one ── */}
        <g style={fade(step >= STEP.triangle)}>
          <line
            x1="16"
            y1={BOTTOM_PANEL.y + 18}
            x2="44"
            y2={BOTTOM_PANEL.y + 18}
            stroke="#222"
            strokeWidth="2"
          />
          <text x="52" y={BOTTOM_PANEL.y + 23} fontSize="13" fill="#333">
            {k('srgb')}
          </text>
        </g>
        <text
          x="115"
          y={BOTTOM_PANEL.y + 70}
          textAnchor="middle"
          fontSize="13"
          fontWeight="bold"
          fill="#555"
          style={fade(step >= STEP.outside)}
        >
          {k('outside')}
        </text>
        <g style={fade(step >= STEP.wide)}>
          <line
            x1="16"
            y1={BOTTOM_PANEL.y + 40}
            x2="44"
            y2={BOTTOM_PANEL.y + 40}
            stroke="#222"
            strokeWidth="2"
            strokeDasharray="5 3"
          />
          <text x="52" y={BOTTOM_PANEL.y + 45} fontSize="13" fill="#333">
            {k('p3')}
          </text>
        </g>
      </svg>
    </div>
  );
};

export default DisplayGamut;
