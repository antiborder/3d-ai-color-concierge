import { useTranslation } from 'react-i18next';
import { fade, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/hsb_space.py); each step starts on the word in [ ].
 */
const STEP = {
  outline: 0, // "[HSB色空間は]、色を色相・彩度・明度の3つで表す、逆さの円錐です。"
  hue: 1, // "[色相は]、色の種類を円周上の角度で表します。"
  hue0: 2, // "[赤]を0度として、"
  hue60: 3, // "[黄色]、"
  hue120: 4, // "[緑]、"
  hue180: 5, // "[シアン]、"
  hue240: 6, // "[青]、"
  hue300: 7, // "[マゼンタ]と一周します。"
  saturation: 8, // "[彩度は]中心からの距離で、"
  paleCenter: 9, // "[中心ほど]薄く、外側ほど鮮やかになります。"
  brightness: 10, // "[明度は]高さで、"
  dark: 11, // "下にいくほど[暗く]なり、"
  black: 12, // "先端は[黒]です。"
  example: 13, // "例えば[オレンジ]は、色相30度、彩度100%、明度100%です。"
} as const;
// When each step's word is spoken, counted from when the slide appears. Estimated from the
// reading (kana) of the Japanese narration at 8 morae/s, with pauses at 、(0.25 s) ・(0.15 s)
// 。(0.5 s) and 0.6 s before speech starts — calibrated on the hand-tuned RGB slide.
const STEP_AT_MS = [
  600, 7600, 12000, 13400, 14000, 14600, 15300, 15800, 17800, 19800, 23500, 25600, 27200, 28600,
];

/** HSB (h in degrees, s and b in 0–1) to a #rrggbb color */
const hsbToHex = (h: number, s: number, b: number) => {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return b - b * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  const hex = (v: number) =>
    Math.round(Math.max(0, Math.min(1, v)) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${hex(f(5))}${hex(f(3))}${hex(f(1))}`;
};

// Two rounded panels: the HSB cone (top) and one color as H/S/B values (bottom)
const TOP_PANEL = { y: 0, height: 205 };
const BOTTOM_PANEL = { y: 213, height: 97 };

// An upside-down cone: its top face is the color wheel (seen at an angle), its height is
// brightness, and it narrows to black at the tip
const CONE = { cx: 110, top: 62, apexY: 180, rx: 70, ry: 26 };
const APEX = { x: CONE.cx, y: CONE.apexY };
const SEGMENTS = 72;
/** Point on the rim (or at fraction r of the radius) of the ellipse at height y, hue h° */
const rim = (h: number, y: number, r = 1) => {
  const a = (h * Math.PI) / 180;
  return { x: CONE.cx + r * CONE.rx * Math.cos(a), y: y + r * CONE.ry * Math.sin(a) };
};
const xy = (p: { x: number; y: number }) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`;

const HUE_MARKS = [
  { h: 0, step: STEP.hue0 },
  { h: 60, step: STEP.hue60 },
  { h: 120, step: STEP.hue120 },
  { h: 180, step: STEP.hue180 },
  { h: 240, step: STEP.hue240 },
  { h: 300, step: STEP.hue300 },
];
// Hue arrow: around the back of the rim, counterclockwise as seen on screen
const HUE_ARROW = { from: 205, to: 335, gap: 10 };
// Saturation arrow: from the center out to the rim
const SAT_ARROW_HUE = 335;
const BRIGHT_X = 212;

// The example color
const EXAMPLE = { h: 30, s: 1, b: 1 };
const EXAMPLE_HEX = hsbToHex(EXAMPLE.h, EXAMPLE.s, EXAMPLE.b);
const BARS = { valueX: 98, x0: 104, width: 68, height: 10, row0: 240, gap: 20 };
const SWATCH = { x: 180, y: 240, size: 40 };

/** Front half of the cone's side, as one closed path */
const sidePath = () => {
  const top: string[] = [];
  for (let h = 0; h <= 180; h += 5) top.push(xy(rim(h, CONE.top)));
  return `M${top.join(' L')} L${xy(APEX)} Z`;
};

const arrowHead = (tip: { x: number; y: number }, from: { x: number; y: number }) => {
  const a = Math.atan2(tip.y - from.y, tip.x - from.x);
  const p = (d: number) => ({ x: tip.x - 6 * Math.cos(a + d), y: tip.y - 6 * Math.sin(a + d) });
  return `M${xy(p(0.45))} L${xy(tip)} L${xy(p(-0.45))}`;
};

const HsbSpace = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.hsb_space.${key}`);
  const step = useSlideStep(STEP_AT_MS);

  const hueArrowPts: { x: number; y: number }[] = [];
  for (let h = HUE_ARROW.from; h <= HUE_ARROW.to; h += 5) {
    const a = (h * Math.PI) / 180;
    hueArrowPts.push({
      x: CONE.cx + (CONE.rx + HUE_ARROW.gap) * Math.cos(a),
      y: CONE.top + (CONE.ry + HUE_ARROW.gap) * Math.sin(a),
    });
  }
  const satEnd = rim(SAT_ARROW_HUE, CONE.top, 0.92);
  const center = { x: CONE.cx, y: CONE.top };
  const exampleAt = rim(EXAMPLE.h, CONE.top);
  const halo = { paintOrder: 'stroke' as const, stroke: '#fff', strokeWidth: 3 };

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
          {/* saturation: white in the middle of the top face, clear at the rim */}
          <radialGradient id="hsbPaleCenter">
            <stop offset="0%" stopColor="#fff" stopOpacity="1" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          {/* brightness: clear at the top of the side, black at the bottom */}
          <linearGradient
            id="hsbDarken"
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1={CONE.top}
            x2="0"
            y2={CONE.apexY}
          >
            <stop offset="0%" stopColor="#000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="hsbHueTrack" x1="0%" y1="0%" x2="100%" y2="0%">
            {[0, 60, 120, 180, 240, 300, 360].map((h) => (
              <stop key={h} offset={`${(h / 360) * 100}%`} stopColor={hsbToHex(h, 1, 1)} />
            ))}
          </linearGradient>
          <linearGradient id="hsbSatTrack" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="100%" stopColor={EXAMPLE_HEX} />
          </linearGradient>
          <linearGradient id="hsbBrightTrack" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#000" />
            <stop offset="100%" stopColor={EXAMPLE_HEX} />
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

        {/* ── top: the HSB cone ── */}
        {/* side: the hue at the rim, darkening to black at the tip */}
        <g style={fade(step >= STEP.dark)}>
          {Array.from({ length: 36 }, (_, i) => {
            const h0 = i * 5;
            const h1 = h0 + 5.5;
            return (
              <polygon
                key={h0}
                points={[rim(h0, CONE.top), rim(h1, CONE.top), APEX].map(xy).join(' ')}
                fill={hsbToHex(h0 + 2.5, 1, 1)}
              />
            );
          })}
          <path d={sidePath()} fill="url(#hsbDarken)" />
        </g>

        {/* top face: the color wheel */}
        <g style={fade(step >= STEP.hue)}>
          {Array.from({ length: SEGMENTS }, (_, i) => {
            const h0 = (i * 360) / SEGMENTS;
            const h1 = h0 + 360 / SEGMENTS + 0.6;
            return (
              <polygon
                key={h0}
                points={`${xy(center)} ${xy(rim(h0, CONE.top))} ${xy(rim(h1, CONE.top))}`}
                fill={hsbToHex(h0 + 180 / SEGMENTS, 1, 1)}
              />
            );
          })}
        </g>
        <ellipse
          cx={CONE.cx}
          cy={CONE.top}
          rx={CONE.rx}
          ry={CONE.ry}
          fill="url(#hsbPaleCenter)"
          style={fade(step >= STEP.paleCenter)}
        />

        {/* outline */}
        <g style={fade(step >= STEP.outline)}>
          <ellipse
            cx={CONE.cx}
            cy={CONE.top}
            rx={CONE.rx}
            ry={CONE.ry}
            fill="none"
            stroke="#999"
            strokeWidth="1"
          />
          {[-1, 1].map((side) => (
            <line
              key={side}
              x1={CONE.cx + side * CONE.rx}
              y1={CONE.top}
              x2={APEX.x}
              y2={APEX.y}
              stroke="#999"
              strokeWidth="1"
            />
          ))}
        </g>

        {/* hue: around the rim */}
        <g style={fade(step >= STEP.hue, 400)}>
          <path
            d={`M${hueArrowPts.map(xy).join(' L')}`}
            fill="none"
            stroke="#333"
            strokeWidth="1.3"
          />
          <path
            d={arrowHead(hueArrowPts[hueArrowPts.length - 1], hueArrowPts[hueArrowPts.length - 2])}
            fill="none"
            stroke="#333"
            strokeWidth="1.3"
          />
          <text
            x={CONE.cx}
            y={CONE.top - CONE.ry - HUE_ARROW.gap - 6}
            textAnchor="middle"
            fontSize="13"
            fontWeight="bold"
            fill="#333"
          >
            {k('hue')}
          </text>
        </g>
        {HUE_MARKS.map(({ h, step: markStep }) => {
          const at = rim(h, CONE.top);
          const label = rim(h, CONE.top, 1.24);
          return (
            <g key={h} style={fade(step >= markStep)}>
              <circle cx={at.x} cy={at.y} r="4" fill={hsbToHex(h, 1, 1)} stroke="#fff" />
              <text
                x={label.x}
                y={label.y + 4}
                textAnchor="middle"
                fontSize="12"
                fontWeight="bold"
                fill="#333"
                style={halo}
              >
                {`${h}°`}
              </text>
            </g>
          );
        })}

        {/* saturation: from the center outwards */}
        <g style={fade(step >= STEP.saturation)}>
          <line
            x1={center.x}
            y1={center.y}
            x2={satEnd.x}
            y2={satEnd.y}
            stroke="#333"
            strokeWidth="1.5"
          />
          <path d={arrowHead(satEnd, center)} fill="none" stroke="#333" strokeWidth="1.5" />
          <text
            x={(center.x + satEnd.x) / 2 + 4}
            y={(center.y + satEnd.y) / 2 + 14}
            textAnchor="middle"
            fontSize="13"
            fontWeight="bold"
            fill="#333"
            style={halo}
          >
            {k('saturation')}
          </text>
        </g>
        <text
          x={center.x - 10}
          y={center.y + 5}
          textAnchor="end"
          fontSize="12"
          fill="#555"
          style={{ ...halo, ...fade(step >= STEP.paleCenter, 500) }}
        >
          {k('white')}
        </text>

        {/* brightness: up the height */}
        <g style={fade(step >= STEP.brightness)}>
          <line
            x1={BRIGHT_X}
            y1={CONE.apexY}
            x2={BRIGHT_X}
            y2={CONE.top}
            stroke="#333"
            strokeWidth="1.5"
          />
          <path
            d={arrowHead({ x: BRIGHT_X, y: CONE.top }, { x: BRIGHT_X, y: CONE.apexY })}
            fill="none"
            stroke="#333"
            strokeWidth="1.5"
          />
          <text
            x={BRIGHT_X + 12}
            y={(CONE.top + CONE.apexY) / 2}
            textAnchor="middle"
            fontSize="13"
            fontWeight="bold"
            fill="#333"
            transform={`rotate(-90, ${BRIGHT_X + 12}, ${(CONE.top + CONE.apexY) / 2})`}
          >
            {k('brightness')}
          </text>
        </g>
        <text
          x={CONE.cx}
          y={CONE.apexY + 16}
          textAnchor="middle"
          fontSize="13"
          fontWeight="bold"
          fill="#333"
          style={fade(step >= STEP.black)}
        >
          {k('black')}
        </text>

        {/* the example color on the rim */}
        <circle
          cx={exampleAt.x}
          cy={exampleAt.y}
          r="6"
          fill={EXAMPLE_HEX}
          stroke="#333"
          strokeWidth="1.5"
          style={fade(step >= STEP.example)}
        />

        {/* ── bottom: the example's H, S, B values ── */}
        <g style={fade(step >= STEP.example, 400)}>
          <text x="12" y={BOTTOM_PANEL.y + 19} fontSize="13" fontWeight="bold" fill="#333">
            {k('example')}
          </text>
          {[
            { key: 'hue', value: `${EXAMPLE.h}°`, at: EXAMPLE.h / 360, track: 'hsbHueTrack' },
            {
              key: 'saturation',
              value: `${EXAMPLE.s * 100}%`,
              at: EXAMPLE.s,
              track: 'hsbSatTrack',
            },
            {
              key: 'brightness',
              value: `${EXAMPLE.b * 100}%`,
              at: EXAMPLE.b,
              track: 'hsbBrightTrack',
            },
          ].map((row, i) => {
            const y = BARS.row0 + i * BARS.gap;
            const markX = BARS.x0 + row.at * BARS.width;
            return (
              <g key={row.key}>
                <text x="12" y={y + 9} fontSize="13" fill="#333">
                  {k(`${row.key}Short`)}
                </text>
                <text x={BARS.valueX} y={y + 9} textAnchor="end" fontSize="13" fill="#555">
                  {row.value}
                </text>
                <rect
                  x={BARS.x0}
                  y={y}
                  width={BARS.width}
                  height={BARS.height}
                  rx="2"
                  fill={`url(#${row.track})`}
                  stroke="#ccc"
                  strokeWidth="0.5"
                />
                <polygon
                  points={`${markX - 4},${y - 4} ${markX + 4},${y - 4} ${markX},${y + 2}`}
                  fill="#333"
                />
              </g>
            );
          })}
          <rect
            x={SWATCH.x}
            y={SWATCH.y}
            width={SWATCH.size}
            height={SWATCH.size}
            rx="6"
            fill={EXAMPLE_HEX}
          />
        </g>
      </svg>
    </div>
  );
};

export default HsbSpace;
