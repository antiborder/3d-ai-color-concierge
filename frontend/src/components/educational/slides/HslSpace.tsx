import { useTranslation } from 'react-i18next';
import { fade, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/hsl_space.py); each step starts on the word in [ ].
 */
const STEP = {
  outline: 0, // "[HSL色空間は]、色を色相・彩度・輝度の3つで表す、上下に尖った双円錐です。"
  hue: 1, // "[色相は]円周上の角度で、"
  hue0: 2, // "[赤]を0度として、"
  hue60: 3, // "[黄色]、"
  hue120: 4, // "[緑]、"
  hue180: 5, // "[シアン]、"
  hue240: 6, // "[青]、"
  hue300: 7, // "[マゼンタ]と一周します。"
  saturation: 8, // "[彩度は]中心からの距離で、"
  grayAxis: 9, // "中心の軸は[グレー]になります。"
  lightness: 10, // "[輝度は]高さで、"
  white: 11, // "上の先端は[白]、"
  black: 12, // "下の先端は[黒]です。"
  vivid: 13, // "真ん中の高さで、[最も]鮮やかな色になります。"
  example: 14, // "例えば[オレンジ]は、色相30度、彩度100%、輝度50%です。"
} as const;
// When each step's word is spoken, counted from when the slide appears. Estimated from the
// reading (kana) of the Japanese narration at 8 morae/s, with pauses at 、(0.25 s) ・(0.15 s)
// 。(0.5 s) and 0.6 s before speech starts — calibrated on the hand-tuned RGB slide.
const STEP_AT_MS = [
  600, 8300, 10500, 11900, 12500, 13200, 13800, 14300, 16300, 19300, 20800, 22900, 24400, 26800,
  29800,
];

/** HSL (h in degrees, s and l in 0–1) to a #rrggbb color */
const hslToHex = (h: number, s: number, l: number) => {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  const hex = (v: number) =>
    Math.round(Math.max(0, Math.min(1, v)) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${hex(f(0))}${hex(f(8))}${hex(f(4))}`;
};
const vivid = (h: number) => hslToHex(h, 1, 0.5);

// Two rounded panels: the HSL double cone (top) and one color as H/S/L values (bottom)
const TOP_PANEL = { y: 0, height: 205 };
const BOTTOM_PANEL = { y: 213, height: 97 };

// A double cone: the equator is the color wheel at lightness 50% (seen at an angle); it
// narrows to white at the top tip and to black at the bottom tip
const CONE = { cx: 110, equator: 104, topY: 20, bottomY: 186, rx: 70, ry: 24 };
const TOP_TIP = { x: CONE.cx, y: CONE.topY };
const BOTTOM_TIP = { x: CONE.cx, y: CONE.bottomY };
const SEGMENTS = 72;
/** Point on the equator (or at fraction r of its radius), hue h° */
const rim = (h: number, r = 1) => {
  const a = (h * Math.PI) / 180;
  return { x: CONE.cx + r * CONE.rx * Math.cos(a), y: CONE.equator + r * CONE.ry * Math.sin(a) };
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
// Hue arrow: around the back of the equator, in the direction of increasing hue
const HUE_ARROW = { from: 205, to: 335, gap: 10 };
// Saturation arrow: from the center out to the rim
const SAT_ARROW_HUE = 335;
const LIGHT_X = 212;

// The example color
const EXAMPLE = { h: 30, s: 1, l: 0.5 };
const EXAMPLE_HEX = hslToHex(EXAMPLE.h, EXAMPLE.s, EXAMPLE.l);
const BARS = { valueX: 98, x0: 104, width: 68, height: 10, row0: 240, gap: 20 };
const SWATCH = { x: 180, y: 240, size: 40 };

/** Front half of one cone (from the equator to a tip), as one closed path */
const frontPath = (tip: { x: number; y: number }) => {
  const arc: string[] = [];
  for (let h = 0; h <= 180; h += 5) arc.push(xy(rim(h)));
  return `M${arc.join(' L')} L${xy(tip)} Z`;
};

const arrowHead = (tip: { x: number; y: number }, from: { x: number; y: number }) => {
  const a = Math.atan2(tip.y - from.y, tip.x - from.x);
  const p = (d: number) => ({ x: tip.x - 6 * Math.cos(a + d), y: tip.y - 6 * Math.sin(a + d) });
  return `M${xy(p(0.45))} L${xy(tip)} L${xy(p(-0.45))}`;
};

/** Hue-colored triangles from the front of the equator to a tip */
const ConeSide = ({ tip }: { tip: { x: number; y: number } }) => (
  <>
    {Array.from({ length: 36 }, (_, i) => {
      const h0 = i * 5;
      return (
        <polygon
          key={h0}
          points={[rim(h0), rim(h0 + 5.5), tip].map(xy).join(' ')}
          fill={vivid(h0 + 2.5)}
        />
      );
    })}
  </>
);

const HslSpace = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.hsl_space.${key}`);
  const step = useSlideStep(STEP_AT_MS);

  const hueArrowPts: { x: number; y: number }[] = [];
  for (let h = HUE_ARROW.from; h <= HUE_ARROW.to; h += 5) {
    const a = (h * Math.PI) / 180;
    hueArrowPts.push({
      x: CONE.cx + (CONE.rx + HUE_ARROW.gap) * Math.cos(a),
      y: CONE.equator + (CONE.ry + HUE_ARROW.gap) * Math.sin(a),
    });
  }
  const center = { x: CONE.cx, y: CONE.equator };
  const satEnd = rim(SAT_ARROW_HUE, 0.92);
  const exampleAt = rim(EXAMPLE.h);
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
          {/* saturation: gray in the middle of the equator disc, clear at the rim */}
          <radialGradient id="hslGrayCenter">
            <stop offset="0%" stopColor="#808080" stopOpacity="1" />
            <stop offset="100%" stopColor="#808080" stopOpacity="0" />
          </radialGradient>
          {/* lightness: white toward the top tip, black toward the bottom tip */}
          <linearGradient
            id="hslToWhite"
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1={CONE.equator}
            x2="0"
            y2={CONE.topY}
          >
            <stop offset="0%" stopColor="#fff" stopOpacity="0" />
            <stop offset="100%" stopColor="#fff" stopOpacity="1" />
          </linearGradient>
          <linearGradient
            id="hslToBlack"
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1={CONE.equator + CONE.ry}
            x2="0"
            y2={CONE.bottomY}
          >
            <stop offset="0%" stopColor="#000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="hslHueTrack" x1="0%" y1="0%" x2="100%" y2="0%">
            {[0, 60, 120, 180, 240, 300, 360].map((h) => (
              <stop key={h} offset={`${(h / 360) * 100}%`} stopColor={vivid(h)} />
            ))}
          </linearGradient>
          <linearGradient id="hslSatTrack" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#808080" />
            <stop offset="100%" stopColor={EXAMPLE_HEX} />
          </linearGradient>
          <linearGradient id="hslLightTrack" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#000" />
            <stop offset="50%" stopColor={EXAMPLE_HEX} />
            <stop offset="100%" stopColor="#fff" />
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

        {/* ── top: the HSL double cone ── */}
        {/* upper cone: the hue at the equator, lightening to white at the top tip */}
        <g style={fade(step >= STEP.white)}>
          <ConeSide tip={TOP_TIP} />
          <path d={frontPath(TOP_TIP)} fill="url(#hslToWhite)" />
        </g>
        {/* lower cone: darkening to black at the bottom tip */}
        <g style={fade(step >= STEP.black)}>
          <ConeSide tip={BOTTOM_TIP} />
          <path d={frontPath(BOTTOM_TIP)} fill="url(#hslToBlack)" />
        </g>

        {/* the equator disc: the color wheel at lightness 50% */}
        <g style={fade(step >= STEP.hue)}>
          {Array.from({ length: SEGMENTS }, (_, i) => {
            const h0 = (i * 360) / SEGMENTS;
            const h1 = h0 + 360 / SEGMENTS + 0.6;
            return (
              <polygon
                key={h0}
                points={`${xy(center)} ${xy(rim(h0))} ${xy(rim(h1))}`}
                fill={vivid(h0 + 180 / SEGMENTS)}
              />
            );
          })}
        </g>
        <ellipse
          cx={CONE.cx}
          cy={CONE.equator}
          rx={CONE.rx}
          ry={CONE.ry}
          fill="url(#hslGrayCenter)"
          style={fade(step >= STEP.grayAxis)}
        />

        {/* outline */}
        <g style={fade(step >= STEP.outline)}>
          <ellipse
            cx={CONE.cx}
            cy={CONE.equator}
            rx={CONE.rx}
            ry={CONE.ry}
            fill="none"
            stroke="#999"
            strokeWidth="1"
          />
          {[TOP_TIP, BOTTOM_TIP].map((tip) =>
            [-1, 1].map((side) => (
              <line
                key={`${tip.y}-${side}`}
                x1={CONE.cx + side * CONE.rx}
                y1={CONE.equator}
                x2={tip.x}
                y2={tip.y}
                stroke="#999"
                strokeWidth="1"
              />
            ))
          )}
        </g>

        {/* the most vivid colors: the rim of the equator */}
        <g style={fade(step >= STEP.vivid)}>
          {Array.from({ length: SEGMENTS }, (_, i) => {
            const h0 = (i * 360) / SEGMENTS;
            const h1 = h0 + 360 / SEGMENTS + 0.6;
            return (
              <path
                key={h0}
                d={`M${xy(rim(h0))} L${xy(rim(h1))}`}
                stroke={vivid(h0)}
                strokeWidth="5"
                strokeLinecap="round"
              />
            );
          })}
        </g>

        {/* hue: around the equator */}
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
            y={CONE.equator - CONE.ry - HUE_ARROW.gap - 6}
            textAnchor="middle"
            fontSize="13"
            fontWeight="bold"
            fill="#333"
            style={halo}
          >
            {k('hue')}
          </text>
        </g>
        {HUE_MARKS.map(({ h, step: markStep }) => {
          const at = rim(h);
          const label = rim(h, 1.24);
          return (
            <g key={h} style={fade(step >= markStep)}>
              <circle cx={at.x} cy={at.y} r="4" fill={vivid(h)} stroke="#fff" />
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

        {/* saturation: from the center outwards; the center is gray */}
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
          fill="#333"
          style={{ ...halo, ...fade(step >= STEP.grayAxis, 500) }}
        >
          {k('gray')}
        </text>

        {/* lightness: up the height, black at the bottom tip and white at the top tip */}
        <g style={fade(step >= STEP.lightness)}>
          <line
            x1={LIGHT_X}
            y1={CONE.bottomY}
            x2={LIGHT_X}
            y2={CONE.topY}
            stroke="#333"
            strokeWidth="1.5"
          />
          <path
            d={arrowHead({ x: LIGHT_X, y: CONE.topY }, { x: LIGHT_X, y: CONE.bottomY })}
            fill="none"
            stroke="#333"
            strokeWidth="1.5"
          />
          <text
            x={LIGHT_X + 12}
            y={(CONE.topY + CONE.bottomY) / 2}
            textAnchor="middle"
            fontSize="13"
            fontWeight="bold"
            fill="#333"
            transform={`rotate(-90, ${LIGHT_X + 12}, ${(CONE.topY + CONE.bottomY) / 2})`}
          >
            {k('lightness')}
          </text>
        </g>
        <text
          x={TOP_TIP.x + 10}
          y={TOP_TIP.y + 4}
          fontSize="13"
          fontWeight="bold"
          fill="#333"
          style={fade(step >= STEP.white)}
        >
          {k('white')}
        </text>
        <text
          x={BOTTOM_TIP.x + 10}
          y={BOTTOM_TIP.y + 4}
          fontSize="13"
          fontWeight="bold"
          fill="#333"
          style={fade(step >= STEP.black)}
        >
          {k('black')}
        </text>

        {/* the example color on the equator */}
        <circle
          cx={exampleAt.x}
          cy={exampleAt.y}
          r="6"
          fill={EXAMPLE_HEX}
          stroke="#333"
          strokeWidth="1.5"
          style={fade(step >= STEP.example)}
        />

        {/* ── bottom: the example's H, S, L values ── */}
        <g style={fade(step >= STEP.example, 400)}>
          <text x="12" y={BOTTOM_PANEL.y + 19} fontSize="13" fontWeight="bold" fill="#333">
            {k('example')}
          </text>
          {[
            { key: 'hue', value: `${EXAMPLE.h}°`, at: EXAMPLE.h / 360, track: 'hslHueTrack' },
            {
              key: 'saturation',
              value: `${EXAMPLE.s * 100}%`,
              at: EXAMPLE.s,
              track: 'hslSatTrack',
            },
            {
              key: 'lightness',
              value: `${EXAMPLE.l * 100}%`,
              at: EXAMPLE.l,
              track: 'hslLightTrack',
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

export default HslSpace;
