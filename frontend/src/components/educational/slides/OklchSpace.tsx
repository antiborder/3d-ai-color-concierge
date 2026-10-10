import { useTranslation } from 'react-i18next';
import { labToRgb, oklchToRgbGamutMapped, rgbToLab } from '../../../utils/gamutUtils';
import { CENTER, LBar, LabSliceColors, OKLAB, PLANE, rgb, scaleOf, toPxIn } from '../labPlane';
import { draw, fade, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/oklch_space.py); each step starts on the word in [ ].
 */
const STEP = {
  plane: 0, // "[OKLCH色空間は]、OKLabを"
  polar: 1, // "[極座標]で表したものです。"
  l: 2, // "[Lは]明るさ、"
  c: 3, // "[Cは]中心からの距離で鮮やかさ、"
  h: 4, // "[Hは]角度で色相を表します。"
  row: 5, // "LCHと同じ使い方ですが、[色相を変えても]、明るさや色みがより正確にそろいます。"
  css: 6, // "[CSS]でも使えるようになり、ウェブデザインで注目されています。"
  app: 7, // "[このアプリの]Color Harmonyも、OKLCHで配色を計算しています。"
} as const;
// When each step's words are spoken, counted from when the slide appears. Estimated from the
// reading (kana) of the Japanese narration at 8 morae/s, with pauses at 、(0.25 s) ・(0.15 s)
// 。(0.5 s) and 0.6 s before speech starts — calibrated on the hand-tuned RGB slide.
const STEP_AT_MS = [600, 4000, 6400, 7500, 10000, 15500, 20000, 25100];

// Two rounded panels: OKLab's plane in polar terms (top), using OKLCH (bottom)
const TOP_PANEL = { y: 0, height: 206 };
const BOTTOM_PANEL = { y: 214, height: 96 };

const SCALE = scaleOf(OKLAB);
const L = OKLAB.sliceL;
// The example color: C = 0.12 (distance from the center), H = 60° (angle from +a)
const EXAMPLE = { C: 0.12, H: 60 };
const RINGS = [0.1, 0.2];
const C_MAX = 0.3;
const ARC_R = 20;

// Bottom: six hues at one lightness and chroma, each with a gray of its perceived lightness
type RGB = [number, number, number];
const ROW_COLORS: RGB[] = [30, 90, 150, 210, 270, 330].map((h) =>
  oklchToRgbGamutMapped(L, 0.12, h)
);
const grayOf = (c: RGB) => labToRgb(rgbToLab(...c)[0], 0, 0);
const SWATCH = { x0: 62, y: BOTTOM_PANEL.y + 10, size: 22, pitch: 26, grayH: 7 };
const CSS_EXAMPLE = { L: 0.7, C: 0.12, H: 60 };
const MONO = 'Menlo, Consolas, "Courier New", monospace';

const OklchSpace = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.oklch_space.${key}`);
  const step = useSlideStep(STEP_AT_MS);

  const rad = (EXAMPLE.H * Math.PI) / 180;
  const p = toPxIn(OKLAB, EXAMPLE.C * Math.cos(rad), EXAMPLE.C * Math.sin(rad));
  const arcEnd = { x: CENTER.x + ARC_R * Math.cos(rad), y: CENTER.y - ARC_R * Math.sin(rad) };
  const hLabel = {
    x: CENTER.x + (ARC_R + 9) * Math.cos(rad / 2),
    y: CENTER.y - (ARC_R + 9) * Math.sin(rad / 2) + 5,
  };
  // Like the Lightness label: only the initial letter is bold
  const label = { fontSize: 13, stroke: '#fff', strokeWidth: 3 } as const;
  const cssColor = rgb(oklchToRgbGamutMapped(CSS_EXAMPLE.L, CSS_EXAMPLE.C, CSS_EXAMPLE.H));

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

        {/* ── top: OKLab's a–b plane… (polar coordinates, so a round frame) ── */}
        <g style={fade(step >= STEP.plane)}>
          <defs>
            <clipPath id="oklchRound">
              <circle cx={CENTER.x} cy={CENTER.y} r={C_MAX * SCALE} />
            </clipPath>
          </defs>
          <circle cx={CENTER.x} cy={CENTER.y} r={C_MAX * SCALE} fill="#eceef3" stroke="#ccc" />
          <g clipPath="url(#oklchRound)">
            <LabSliceColors space={OKLAB} />
          </g>
        </g>

        {/* …in polar terms: rings around the center, angles from +a */}
        <g style={fade(step >= STEP.polar)}>
          {RINGS.map((c) => (
            <circle
              key={c}
              cx={CENTER.x}
              cy={CENTER.y}
              r={c * SCALE}
              fill="none"
              stroke="#333"
              strokeOpacity="0.35"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
          ))}
          <line
            x1={CENTER.x}
            y1={CENTER.y}
            x2={PLANE.x0 + PLANE.size - 4}
            y2={CENTER.y}
            stroke="#333"
            strokeWidth="1.2"
          />
          <circle cx={CENTER.x} cy={CENTER.y} r="3" fill="#333" />
        </g>

        {/* L: the same as OKLab's */}
        <g style={fade(step >= STEP.l)}>
          <LBar id="oklchLBar" space={OKLAB} />
        </g>

        {/* C: distance from the center */}
        <path
          d={`M${CENTER.x},${CENTER.y} L${p.x},${p.y}`}
          pathLength={1}
          stroke="#222"
          strokeWidth="2.5"
          style={draw(step >= STEP.c, 0, 700)}
        />
        <g style={fade(step >= STEP.c, 500)}>
          <circle
            cx={p.x}
            cy={p.y}
            r="6"
            fill={rgb(oklchToRgbGamutMapped(L, EXAMPLE.C, EXAMPLE.H))}
            stroke="#222"
            strokeWidth="2"
          />
          <text
            x={(CENTER.x + p.x) / 2 - 10}
            y={(CENTER.y + p.y) / 2 - 2}
            textAnchor="end"
            fill="#222"
            paintOrder="stroke"
            {...label}
          >
            <tspan fontWeight="bold">C</tspan>hroma
          </text>
        </g>

        {/* H: the angle around the center */}
        <path
          d={`M${CENTER.x + ARC_R},${CENTER.y} A${ARC_R},${ARC_R} 0 0 0 ${arcEnd.x},${arcEnd.y}`}
          pathLength={1}
          fill="none"
          stroke="#222"
          strokeWidth="2"
          style={draw(step >= STEP.h, 0, 700)}
        />
        <text
          x={hLabel.x}
          y={hLabel.y}
          fill="#222"
          paintOrder="stroke"
          {...label}
          style={fade(step >= STEP.h, 500)}
        >
          <tspan fontWeight="bold">H</tspan>ue
        </text>

        {/* ── bottom: hues at one L and C look equally light (the grays) ── */}
        <g style={fade(step >= STEP.row)}>
          <text x="10" y={SWATCH.y + 15} fontSize="13" fontWeight="bold" fill="#333">
            {k('rowLabel')}
          </text>
          {ROW_COLORS.map((c, i) => {
            const x = SWATCH.x0 + i * SWATCH.pitch;
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={SWATCH.y}
                  width={SWATCH.size}
                  height={SWATCH.size}
                  rx="4"
                  fill={rgb(c)}
                />
                <rect
                  x={x}
                  y={SWATCH.y + SWATCH.size + 2}
                  width={SWATCH.size}
                  height={SWATCH.grayH}
                  rx="2"
                  fill={rgb(grayOf(c))}
                />
              </g>
            );
          })}
        </g>

        {/* in CSS */}
        <g style={fade(step >= STEP.css)}>
          <rect x="10" y={BOTTOM_PANEL.y + 48} width="16" height="16" rx="3" fill={cssColor} />
          <text x="32" y={BOTTOM_PANEL.y + 60} fontSize="12" fontFamily={MONO} fill="#333">
            {`color: oklch(${CSS_EXAMPLE.L * 100}% ${CSS_EXAMPLE.C} ${CSS_EXAMPLE.H});`}
          </text>
        </g>

        {/* the app's Color Harmony */}
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

export default OklchSpace;
