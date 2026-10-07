import { useTranslation } from 'react-i18next';
import { draw, fade, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/saturation.py); each step starts on the word in [ ].
 */
const STEP = {
  intro: 0, // "[彩度は]、色の鮮やかさのことです。"
  vivid: 1, // "彩度が[高いほど]鮮やかで、"
  dull: 2, // "低いほど[くすんだ]色になり、"
  gray: 3, // "0%では色みのない[グレー]になります。"
  disc: 4, // "[HSLの]色空間では、"
  radius: 5, // "[中心の軸]からの距離が彩度で、"
  rim: 6, // "[ふちが]一番鮮やかです。"
  orange: 7, // "例えば[オレンジの]彩度を下げていくと、"
  brown: 8, // "くすんだ[茶色を]経て、"
  orangeGray: 9, // "[グレーになります]。"
} as const;
// When each step's words are spoken, counted from when the slide appears. Estimated from the
// reading (kana) of the Japanese narration at 8 morae/s, with pauses at 、(0.25 s) ・(0.15 s)
// 。(0.5 s) and 0.6 s before speech starts — calibrated on the hand-tuned RGB slide.
const STEP_AT_MS = [600, 4000, 6100, 9400, 10800, 13100, 15500, 18100, 20700, 21700];

// Two rounded panels: from vivid to gray (top), saturation in the HSL color space (bottom)
const TOP_PANEL = { y: 0, height: 104 };
const BOTTOM_PANEL = { y: 112, height: 198 };

const hsl = (h: number, s = 100, l = 50) => `hsl(${h} ${s}% ${l}%)`;

// Top: one red at saturation 100% → 0% (lightness stays at 50%)
const STRIP = { x0: 20, x1: 210, y: 34, h: 26 };
const STRIP_LABELS = [
  { key: 'vivid', x: STRIP.x0, anchor: 'start', step: STEP.vivid },
  { key: 'dull', x: (STRIP.x0 + STRIP.x1) / 2, anchor: 'middle', step: STEP.dull },
  { key: 'gray', x: STRIP.x1, anchor: 'end', step: STEP.gray },
] as const;

// Bottom: HSL's cross-section at lightness 50%, seen from above — gray at the center, vivid at the
// edge. At lightness 50% a color is exactly gray + saturation × (vivid − gray), so each wedge is a
// radial gradient from gray to its vivid color.
const DISC = { cx: 82, cy: BOTTOM_PANEL.y + 96, r: 66 };
const WEDGE_DEG = 6;
const WEDGES = Array.from({ length: 360 / WEDGE_DEG }, (_, i) => i * WEDGE_DEG);
// Hues run clockwise with orange (30°) pointing straight right, toward the labels
const ORANGE_H = 30;
const angleOf = (h: number) => ((h - ORANGE_H) * Math.PI) / 180;
const pointAt = (h: number, r: number) => ({
  x: DISC.cx + r * Math.cos(angleOf(h)),
  y: DISC.cy + r * Math.sin(angleOf(h)),
});
const wedgePath = (h: number) => {
  const a = pointAt(h - WEDGE_DEG / 2 - 0.5, DISC.r);
  const b = pointAt(h + WEDGE_DEG / 2 + 0.5, DISC.r);
  return `M${DISC.cx},${DISC.cy} L${a.x.toFixed(2)},${a.y.toFixed(2)} A${DISC.r},${DISC.r} 0 0 1 ${b.x.toFixed(2)},${b.y.toFixed(2)} Z`;
};

// Orange from the edge to the center: vivid, dull brown, gray
const ORANGE_DOTS = [
  { s: 100, step: STEP.orange, label: 'orange' },
  { s: 45, step: STEP.brown, label: 'brown' },
  { s: 0, step: STEP.orangeGray, label: 'gray' },
];

const Saturation = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.saturation.${key}`);
  const step = useSlideStep(STEP_AT_MS);

  const rim = pointAt(ORANGE_H, DISC.r);

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
          <linearGradient id="saturationStrip" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={hsl(0, 100)} />
            <stop offset="100%" stopColor={hsl(0, 0)} />
          </linearGradient>
          {WEDGES.map((h) => (
            <radialGradient
              key={h}
              id={`saturationWedge${h}`}
              gradientUnits="userSpaceOnUse"
              cx={DISC.cx}
              cy={DISC.cy}
              r={DISC.r}
            >
              <stop offset="0%" stopColor={hsl(h, 0)} />
              <stop offset="100%" stopColor={hsl(h, 100)} />
            </radialGradient>
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

        {/* ── top: from vivid to gray ── */}
        <g style={fade(step >= STEP.intro)}>
          <text x={STRIP.x0} y={STRIP.y - 10} fontSize="13" fontWeight="bold" fill="#555">
            {k('high')}
          </text>
          <text
            x={STRIP.x1}
            y={STRIP.y - 10}
            textAnchor="end"
            fontSize="13"
            fontWeight="bold"
            fill="#555"
          >
            {k('low')}
          </text>
          <rect
            x={STRIP.x0}
            y={STRIP.y}
            width={STRIP.x1 - STRIP.x0}
            height={STRIP.h}
            rx="4"
            fill="url(#saturationStrip)"
          />
        </g>
        {STRIP_LABELS.map((l) => (
          <text
            key={l.key}
            x={l.x}
            y={STRIP.y + STRIP.h + 22}
            textAnchor={l.anchor}
            fontSize="14"
            fontWeight="bold"
            fill="#333"
            style={fade(step >= l.step)}
          >
            {k(l.key)}
          </text>
        ))}

        {/* ── bottom: distance from the axis in HSL ── */}
        <g style={fade(step >= STEP.disc)}>
          {WEDGES.map((h) => (
            <path key={h} d={wedgePath(h)} fill={`url(#saturationWedge${h})`} />
          ))}
          <text x="12" y={BOTTOM_PANEL.y + 20} fontSize="13" fontWeight="bold" fill="#555">
            {k('hslTitle')}
          </text>
        </g>
        {/* center = 0%, edge = 100% */}
        <g style={fade(step >= STEP.radius)}>
          <path
            d={`M${DISC.cx},${DISC.cy} L${pointAt(120, DISC.r).x},${pointAt(120, DISC.r).y}`}
            stroke="#333"
            strokeWidth="1.5"
          />
          <circle cx={DISC.cx} cy={DISC.cy} r="3" fill="#333" />
          <text
            x={DISC.cx}
            y={DISC.cy + DISC.r + 20}
            textAnchor="middle"
            fontSize="13"
            fontWeight="bold"
            fill="#333"
            stroke="#fff"
            strokeWidth="3"
            paintOrder="stroke"
          >
            {k('distance')}
          </text>
        </g>
        <circle
          cx={DISC.cx}
          cy={DISC.cy}
          r={DISC.r}
          fill="none"
          stroke="#333"
          strokeWidth="2.5"
          pathLength={1}
          style={draw(step >= STEP.rim, 0, 1200)}
        />

        {/* orange, from the edge in toward the center */}
        <path
          d={`M${rim.x},${rim.y} L${DISC.cx},${DISC.cy}`}
          stroke="#333"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          style={fade(step >= STEP.orange)}
        />
        {ORANGE_DOTS.map((d) => {
          const p = pointAt(ORANGE_H, (d.s / 100) * DISC.r);
          return (
            <circle
              key={d.label}
              cx={p.x}
              cy={p.y}
              r="6"
              fill={hsl(ORANGE_H, d.s)}
              stroke="#333"
              strokeWidth="1.5"
              style={fade(step >= d.step)}
            />
          );
        })}
        {/* the three on the right, as a legend */}
        {ORANGE_DOTS.map((d, i) => {
          const y = BOTTOM_PANEL.y + 40 + i * 44;
          return (
            <g key={d.label} style={fade(step >= d.step)}>
              <rect x="176" y={y - 13} width="18" height="18" rx="4" fill={hsl(ORANGE_H, d.s)} />
              <text x="185" y={y + 22} textAnchor="middle" fontSize="12" fill="#333">
                {k(`${d.label}Label`)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default Saturation;
