import { useTranslation } from 'react-i18next';
import { labToRgb, lchToRgbGamutMapped, rgbToLab } from '../../../utils/gamutUtils';
import { CENTER, LBar, LabSliceColors, PLANE, SCALE, SLICE_L, rgb, toPx } from '../labPlane';
import { draw, fade, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/lch_space.py); each step starts on the word in [ ].
 */
const STEP = {
  plane: 0, // "[LCH色空間は]、Lab色空間を、"
  polar: 1, // "[極座標]で表したものです。"
  l: 2, // "[Lは]明るさで、Labと同じです。"
  c: 3, // "[Cは]中心からの距離で、色の鮮やかさを表します。"
  h: 4, // "[Hは]中心の周りの角度で、色相を表します。"
  hsl: 5, // "[HSLと似た]使い方ができますが、"
  lch: 6, // "[Lが同じなら]、色相が違っても明るさが"
  even: 7, // "[そろって]見えます。"
  design: 8, // "そのため、[デザイン]で色をそろえるのに便利です。"
} as const;
// When each step's words are spoken, counted from when the slide appears. Estimated from the
// reading (kana) of the Japanese narration at 8 morae/s, with pauses at 、(0.25 s) ・(0.15 s)
// 。(0.5 s) and 0.6 s before speech starts — calibrated on the hand-tuned RGB slide.
const STEP_AT_MS = [600, 4000, 6400, 9100, 13400, 17600, 20500, 23600, 25800];

// Two rounded panels: the plane in polar terms (top), HSL vs LCH at one lightness (bottom)
const TOP_PANEL = { y: 0, height: 206 };
const BOTTOM_PANEL = { y: 214, height: 96 };

// The example color: C = 50 (distance from the center), H = 60° (angle from +a)
const EXAMPLE = { C: 50, H: 60 };
const RINGS = [25, 50, 75];
const C_MAX = 100;
const ARC_R = 20;

// Bottom: six hues at one lightness. HSL's L = 50% looks uneven; LCH's L = 60 looks even.
// Under each swatch, a gray of the same perceived lightness (CIE L*).
type RGB = [number, number, number];
const HSL_ROW: RGB[] = [
  [255, 0, 0],
  [255, 255, 0],
  [0, 255, 0],
  [0, 255, 255],
  [0, 0, 255],
  [255, 0, 255],
];
const LCH_ROW: RGB[] = [40, 100, 140, 200, 280, 330].map((H) =>
  lchToRgbGamutMapped(SLICE_L, 50, H)
);
const grayOf = (c: RGB) => labToRgb(rgbToLab(...c)[0], 0, 0);
const ROWS = [
  {
    key: 'hsl',
    name: 'HSL',
    sub: 'L 50%',
    colors: HSL_ROW,
    y: BOTTOM_PANEL.y + 10,
    step: STEP.hsl,
    even: false,
  },
  {
    key: 'lch',
    name: 'LCH',
    sub: 'L 60',
    colors: LCH_ROW,
    y: BOTTOM_PANEL.y + 52,
    step: STEP.lch,
    even: true,
  },
];
const SWATCH = { x0: 52, size: 22, pitch: 26, grayH: 7 };

const LchSpace = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.lch_space.${key}`);
  const step = useSlideStep(STEP_AT_MS);

  const rad = (EXAMPLE.H * Math.PI) / 180;
  const p = toPx(EXAMPLE.C * Math.cos(rad), EXAMPLE.C * Math.sin(rad));
  const arcEnd = { x: CENTER.x + ARC_R * Math.cos(rad), y: CENTER.y - ARC_R * Math.sin(rad) };
  const hLabel = {
    x: CENTER.x + (ARC_R + 9) * Math.cos(rad / 2),
    y: CENTER.y - (ARC_R + 9) * Math.sin(rad / 2) + 5,
  };
  // Like the Lightness label: only the initial letter is bold
  const label = { fontSize: 13, stroke: '#fff', strokeWidth: 3 } as const;

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

        {/* ── top: Lab's a–b plane… ── */}
        <g style={fade(step >= STEP.plane)}>
          {/* polar coordinates, so a round frame: C up to 100 */}
          <defs>
            <clipPath id="lchRound">
              <circle cx={CENTER.x} cy={CENTER.y} r={C_MAX * SCALE} />
            </clipPath>
          </defs>
          <circle cx={CENTER.x} cy={CENTER.y} r={C_MAX * SCALE} fill="#eceef3" stroke="#ccc" />
          <g clipPath="url(#lchRound)">
            <LabSliceColors />
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

        {/* L: the same as Lab's */}
        <g style={fade(step >= STEP.l)}>
          <LBar id="lchLBar" />
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
            fill={rgb(lchToRgbGamutMapped(SLICE_L, EXAMPLE.C, EXAMPLE.H))}
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

        {/* ── bottom: six hues at one lightness, with their perceived lightness as gray ── */}
        {ROWS.map((row) => (
          <g key={row.key} style={fade(step >= row.step)}>
            <text x="10" y={row.y + 15} fontSize="13" fontWeight="bold" fill="#333">
              {row.name}
            </text>
            <text x="10" y={row.y + 30} fontSize="12" fill="#666">
              {row.sub}
            </text>
            {row.colors.map((c, i) => {
              const x = SWATCH.x0 + i * SWATCH.pitch;
              return (
                <g key={i}>
                  <rect
                    x={x}
                    y={row.y}
                    width={SWATCH.size}
                    height={SWATCH.size}
                    rx="4"
                    fill={rgb(c)}
                  />
                  <rect
                    x={x}
                    y={row.y + SWATCH.size + 2}
                    width={SWATCH.size}
                    height={SWATCH.grayH}
                    rx="2"
                    fill={rgb(grayOf(c))}
                  />
                </g>
              );
            })}
          </g>
        ))}
        {/* the grays tell: uneven for HSL, even for LCH */}
        {ROWS.map((row) => (
          <text
            key={row.key}
            x="216"
            y={row.y + 21}
            textAnchor="middle"
            fontSize="18"
            fontWeight="bold"
            fill={row.even ? '#00813a' : '#c0102a'}
            style={fade(step >= STEP.even)}
          >
            {row.even ? '○' : '×'}
          </text>
        ))}
        <rect
          x="5"
          y={ROWS[1].y - 5}
          width="220"
          height={SWATCH.size + SWATCH.grayH + 12}
          rx="6"
          fill="none"
          stroke="#00813a"
          strokeWidth="2"
          style={fade(step >= STEP.design)}
        />
      </svg>
    </div>
  );
};

export default LchSpace;
