import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SPECTRUM_STOPS } from '../ConeSensitivityChart';
import { RGB_CMF, XYZ_CMF } from '../colorMatchingFunctions';
import { CONE_NM_MAX, CONE_NM_MIN } from '../coneFundamentals';
import { draw, fade, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/rgb_xyz_relation.py); each step starts on the word in [ ].
 * The top panel shows two scenes in turn: why XYZ was made (its curves), then screen RGB in XYZ.
 */
const STEP = {
  frame: 0, // "[RGBとXYZは]、決まった計算で互いに変換できます。"
  rgbCurves: 1, // "XYZは、[等色実験]のRGBの曲線で"
  negative: 2, // "赤が[マイナス]になる部分を、"
  morph: 3, // "軸を[組み替えて]なくすために作られました。"
  screen: 4, // "[画面の]RGBも、光の強さに直してから"
  matrix: 5, // "決まった割合で[足し合わせる]と、XYZになります。"
  arrowR: 6, // "[赤]・"
  arrowG: 7, // "[緑]・"
  arrowB: 8, // "[青]は、XYZの中ではこの3本の矢印になり、"
  box: 9, // "RGBの立方体は斜めに[ゆがんだ]箱になります。"
  yRow: 10, // "[Yの行]を見ると、"
  green: 11, // "明るさには[緑が一番]効くことが分かります。"
} as const;
// When each step's words are spoken, counted from when the slide appears. Estimated from the
// reading (kana) of the Japanese narration at 8 morae/s, with pauses at 、(0.25 s) ・(0.15 s)
// 。(0.5 s) and 0.6 s before speech starts — calibrated on the hand-tuned RGB slide.
const STEP_AT_MS = [
  600, 7700, 10800, 12800, 15600, 20200, 23600, 24000, 24500, 31300, 33200, 35300,
];
const MORPH_MS = 1800;

// Two rounded panels: the curves, then the RGB cube inside XYZ (top), the conversion (bottom)
const TOP_PANEL = { y: 0, height: 205 };
const BOTTOM_PANEL = { y: 213, height: 97 };

// ── Scene 1: the color matching curves (red goes negative) turn into the X, Y, Z curves.
// Pairing red→X, green→Y, blue→Z is for the picture: XYZ is a fixed mix of all three.
const CHART = { x0: 34, x1: 218, yBase: 128, height: 92 };
const xOfNm = (nm: number) =>
  CHART.x0 + ((nm - CONE_NM_MIN) / (CONE_NM_MAX - CONE_NM_MIN)) * (CHART.x1 - CHART.x0);
const yOfV = (v: number) => CHART.yBase - v * CHART.height;
const MIN_V = Math.min(...RGB_CMF.flatMap((r) => r.a));
const SPECTRUM_Y = yOfV(MIN_V) + 4;
/** Curve j at wavelength row i, a fraction t of the way from RGB (0) to XYZ (1) */
const valueAt = (i: number, j: number, t: number) =>
  RGB_CMF[i].a[j] + (XYZ_CMF[i].a[j] - RGB_CMF[i].a[j]) * t;
const curvePath = (j: number, t: number) =>
  'M' +
  RGB_CMF.map((r, i) => `${xOfNm(r.nm).toFixed(1)},${yOfV(valueAt(i, j, t)).toFixed(1)}`).join(
    ' L'
  );
/** The part of curve j below zero, as a closed shape (flat where the curve is positive) */
const negativePath = (j: number, t: number) =>
  `M${xOfNm(CONE_NM_MIN)},${CHART.yBase} ` +
  RGB_CMF.map(
    (r, i) => `L${xOfNm(r.nm).toFixed(1)},${yOfV(Math.min(0, valueAt(i, j, t))).toFixed(1)}`
  ).join(' ') +
  ` L${xOfNm(CONE_NM_MAX)},${CHART.yBase} Z`;
const peakIndex = (j: number, t: number) =>
  RGB_CMF.reduce((best, _, i) => (valueAt(i, j, t) > valueAt(best, j, t) ? i : best), 0);
// The "negative" label sits just right of where the red curve comes back above zero
const LAST_NEGATIVE_NM = RGB_CMF.filter((r) => r.a[0] < 0).slice(-1)[0].nm;

// ── Scene 2: linear sRGB → XYZ (D65), as in gamutUtils' rgbToLab; column j is primary j in XYZ
const M = [
  [0.4124, 0.3576, 0.1805],
  [0.2126, 0.7152, 0.0722],
  [0.0193, 0.1192, 0.9505],
];
const toXyz = (r: number, g: number, b: number) =>
  M.map((row) => row[0] * r + row[1] * g + row[2] * b);

// Cabinet projection of XYZ: X to the right, Z into the depth, Y (brightness) up
const ORIGIN = { x: 34, y: 178 };
const SIZE = 92;
// Z leans up-right steeply so the blue arrow (mostly Z) stands apart from red (X) and green (Y)
const DEPTH = { x: 0.45, y: 0.55 };
const pt = ([X, Y, Z]: number[]) => ({
  x: ORIGIN.x + X * SIZE + Z * DEPTH.x * SIZE,
  y: ORIGIN.y - Y * SIZE - Z * DEPTH.y * SIZE,
});
const seg = (a: number[], b: number[]) => {
  const p = pt(a);
  const q = pt(b);
  return `M${p.x.toFixed(1)},${p.y.toFixed(1)} L${q.x.toFixed(1)},${q.y.toFixed(1)}`;
};

const COLORS = { red: '#e01a00', green: '#00a848', blue: '#2a5cff' };
const CURVES = [
  { rgb: 'red', xyz: 'X', color: COLORS.red, dx: 10 },
  { rgb: 'green', xyz: 'Y', color: COLORS.green, dx: -10 },
  { rgb: 'blue', xyz: 'Z', color: COLORS.blue, dx: 10 },
];
const AXES = [
  { key: 'X', end: [1.15, 0, 0], dx: 6, dy: 5 },
  { key: 'Y', end: [0, 1.15, 0], dx: -6, dy: 0 },
  { key: 'Z', end: [0, 0, 1.25], dx: 4, dy: -4 },
];
const PRIMARIES = [
  { rgb: [1, 0, 0], color: COLORS.red, step: STEP.arrowR },
  { rgb: [0, 1, 0], color: COLORS.green, step: STEP.arrowG },
  { rgb: [0, 0, 1], color: COLORS.blue, step: STEP.arrowB },
];
// The RGB cube's corners and edges, carried into XYZ
const CUBE_EDGES: Array<[number[], number[]]> = [];
for (const a of [0, 1])
  for (const b of [0, 1]) {
    CUBE_EDGES.push(
      [
        [0, a, b],
        [1, a, b],
      ],
      [
        [a, 0, b],
        [a, 1, b],
      ],
      [
        [a, b, 0],
        [a, b, 1],
      ]
    );
  }
const CORNERS = [
  { rgb: [1, 1, 0], color: '#ffff00' },
  { rgb: [0, 1, 1], color: '#00ffff' },
  { rgb: [1, 0, 1], color: '#ff00ff' },
  { rgb: [1, 1, 1], color: '#ffffff' },
];

const arrowHead = (tip: { x: number; y: number }, from: { x: number; y: number }) => {
  const a = Math.atan2(tip.y - from.y, tip.x - from.x);
  const p = (d: number) =>
    `${(tip.x - 7 * Math.cos(a + d)).toFixed(1)},${(tip.y - 7 * Math.sin(a + d)).toFixed(1)}`;
  return `M${p(0.4)} L${tip.x.toFixed(1)},${tip.y.toFixed(1)} L${p(-0.4)}`;
};

// Bottom: step 1 (linearize), step 2 (the three sums)
const EQ = { x: 14, linearY: BOTTOM_PANEL.y + 19, row0: BOTTOM_PANEL.y + 41, gap: 19 };
const MONO = 'Menlo, Consolas, "Courier New", monospace';
const CHANNELS = [
  { name: 'R', color: COLORS.red },
  { name: 'G', color: COLORS.green },
  { name: 'B', color: COLORS.blue },
];

const RgbXyzRelation = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.rgb_xyz_relation.${key}`);
  const step = useSlideStep(STEP_AT_MS);
  const origin = pt([0, 0, 0]);

  // How far the curves have turned from color matching (0) into XYZ (1)
  const [morph, setMorph] = useState(0);
  const morphing = step >= STEP.morph;
  useEffect(() => {
    if (!morphing) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const f = Math.min(1, (now - start) / MORPH_MS);
      setMorph(f * f * (3 - 2 * f)); // ease in and out
      if (f < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    // Animation frames pause while the tab is hidden; make sure the morph still finishes
    const done = window.setTimeout(() => setMorph(1), MORPH_MS + 50);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(done);
    };
  }, [morphing]);

  const curvesShown = step >= STEP.rgbCurves;
  const scene2 = step >= STEP.screen;
  const sceneStyle = (on: boolean) => ({
    opacity: on ? 1 : 0,
    transition: 'opacity 700ms ease',
  });

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
          <linearGradient id="rgbXyzSpectrum" x1="0%" y1="0%" x2="100%" y2="0%">
            {SPECTRUM_STOPS.map(([nm, color]) => (
              <stop
                key={nm}
                offset={`${((nm - CONE_NM_MIN) / (CONE_NM_MAX - CONE_NM_MIN)) * 100}%`}
                stopColor={color}
              />
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

        {/* ── top, scene 1: XYZ was made so that no curve goes negative ── */}
        <g style={sceneStyle(step >= STEP.frame && !scene2)}>
          <line
            x1={CHART.x0}
            y1={CHART.yBase}
            x2={CHART.x1}
            y2={CHART.yBase}
            stroke="#888"
            strokeWidth="1"
          />
          <line
            x1={CHART.x0}
            y1={SPECTRUM_Y - 4}
            x2={CHART.x0}
            y2={CHART.yBase - CHART.height - 8}
            stroke="#888"
            strokeWidth="1"
          />
          <rect
            x={CHART.x0}
            y={SPECTRUM_Y}
            width={CHART.x1 - CHART.x0}
            height="8"
            fill="url(#rgbXyzSpectrum)"
          />
          {[400, 500, 600, 700].map((nm) => (
            <text
              key={nm}
              x={xOfNm(nm)}
              y={SPECTRUM_Y + 22}
              textAnchor="middle"
              fontSize="12"
              fill="#666"
            >
              {nm}
            </text>
          ))}
          <text x={CHART.x1} y={SPECTRUM_Y + 36} textAnchor="end" fontSize="13" fill="#555">
            {k('wavelength')}
          </text>
          <text x={CHART.x0 - 6} y={CHART.yBase + 4} textAnchor="end" fontSize="12" fill="#666">
            0
          </text>

          {/* which set of curves is shown */}
          <text
            x="218"
            y="20"
            textAnchor="end"
            fontSize="13"
            fontWeight="bold"
            fill="#333"
            style={{ opacity: curvesShown ? 1 - morph : 0, transition: 'opacity 600ms ease' }}
          >
            {k('matchingCurves')}
          </text>
          <text
            x="218"
            y="20"
            textAnchor="end"
            fontSize="13"
            fontWeight="bold"
            fill="#333"
            style={{ opacity: morph }}
          >
            {k('xyzCurves')}
          </text>

          {/* the negative part of the red curve, which disappears as the axes are rearranged */}
          <g style={fade(step >= STEP.negative)}>
            <path d={negativePath(0, morph)} fill={COLORS.red} opacity="0.3" />
            <text
              x={xOfNm(LAST_NEGATIVE_NM) + 4}
              y={CHART.yBase + 14}
              fontSize="13"
              fontWeight="bold"
              fill="#c01000"
              style={{ opacity: 1 - morph }}
            >
              {k('negative')}
            </text>
          </g>

          {CURVES.map((c, j) => {
            const peak = peakIndex(j, morph);
            const px = xOfNm(RGB_CMF[peak].nm) + c.dx;
            const py = yOfV(valueAt(peak, j, morph)) - 4;
            return (
              <g key={c.xyz}>
                <path
                  d={curvePath(j, morph)}
                  pathLength={1}
                  fill="none"
                  stroke={c.color}
                  strokeWidth="1.8"
                  style={draw(curvesShown, j * 300, 1400)}
                />
                <text
                  x={px}
                  y={py}
                  textAnchor="middle"
                  fontSize="13"
                  fontWeight="bold"
                  fill={c.color}
                  style={{ opacity: curvesShown ? 1 - morph : 0, transition: 'opacity 600ms' }}
                >
                  {k(c.rgb)}
                </text>
                <text
                  x={px}
                  y={py}
                  textAnchor="middle"
                  fontSize="14"
                  fontWeight="bold"
                  fill={c.color}
                  style={{ opacity: morph }}
                >
                  {c.xyz}
                </text>
              </g>
            );
          })}
        </g>

        {/* ── top, scene 2: XYZ axes, with the screen's RGB cube carried into them ── */}
        <g style={sceneStyle(scene2)}>
          {AXES.map((axis) => {
            const end = pt(axis.end);
            return (
              <g key={axis.key}>
                <path d={seg([0, 0, 0], axis.end)} stroke="#888" strokeWidth="1.2" fill="none" />
                <path d={arrowHead(end, origin)} stroke="#888" strokeWidth="1.2" fill="none" />
                <text
                  x={end.x + axis.dx}
                  y={end.y + axis.dy}
                  textAnchor="middle"
                  fontSize="14"
                  fontWeight="bold"
                  fill="#555"
                >
                  {axis.key}
                </text>
              </g>
            );
          })}
        </g>

        {/* the RGB cube becomes a slanted box */}
        {CUBE_EDGES.map(([a, b]) => (
          <path
            key={`${a.join()}-${b.join()}`}
            d={seg(toXyz(a[0], a[1], a[2]), toXyz(b[0], b[1], b[2]))}
            pathLength={1}
            fill="none"
            stroke="#999"
            strokeWidth="1"
            style={draw(step >= STEP.box, 0, 1000)}
          />
        ))}
        {CORNERS.map((c, i) => {
          const p = pt(toXyz(c.rgb[0], c.rgb[1], c.rgb[2]));
          return (
            <circle
              key={c.color}
              cx={p.x}
              cy={p.y}
              r="5"
              fill={c.color}
              stroke="#888"
              strokeWidth="0.8"
              style={fade(step >= STEP.box, 700 + i * 250)}
            />
          );
        })}
        <text
          x={pt(toXyz(1, 1, 1)).x + 9}
          y={pt(toXyz(1, 1, 1)).y + 5}
          fontSize="13"
          fill="#333"
          style={fade(step >= STEP.box, 1700)}
        >
          {k('white')}
        </text>

        {/* red, green and blue light as arrows in XYZ */}
        {PRIMARIES.map((p) => {
          const tip = pt(toXyz(p.rgb[0], p.rgb[1], p.rgb[2]));
          return (
            <g key={p.color}>
              <path
                d={`M${origin.x},${origin.y} L${tip.x.toFixed(1)},${tip.y.toFixed(1)}`}
                pathLength={1}
                fill="none"
                stroke={p.color}
                strokeWidth="2.5"
                style={draw(step >= p.step, 0, 600)}
              />
              <path
                d={arrowHead(tip, origin)}
                fill="none"
                stroke={p.color}
                strokeWidth="2.5"
                style={fade(step >= p.step, 500)}
              />
            </g>
          );
        })}

        {/* ── bottom: linearize, then fixed sums ── */}
        <text x={EQ.x} y={EQ.linearY} fontSize="13" fill="#333" style={fade(step >= STEP.screen)}>
          {k('linearize')}
        </text>
        {['X', 'Y', 'Z'].map((name, i) => {
          const y = EQ.row0 + i * EQ.gap;
          const isY = name === 'Y';
          return (
            <g key={name} style={fade(step >= STEP.matrix, i * 400)}>
              <rect
                x="8"
                y={y - 14}
                width="214"
                height="19"
                rx="4"
                fill={COLORS.green}
                style={{
                  opacity: isY && step >= STEP.yRow ? 0.14 : 0,
                  transition: 'opacity 400ms ease',
                }}
              />
              <text x={EQ.x} y={y} fontSize="12" fontFamily={MONO} fill="#333">
                <tspan fontWeight="bold">{name}</tspan>
                {' ='}
                {M[i].map((c, j) => (
                  <tspan key={j}>
                    {j === 0 ? ' ' : ' + '}
                    <tspan
                      fontWeight={isY && j === 1 && step >= STEP.green ? 'bold' : 'normal'}
                      fill={isY && j === 1 && step >= STEP.green ? '#00813a' : '#333'}
                    >
                      {c.toFixed(2)}
                    </tspan>
                    <tspan fill={CHANNELS[j].color} fontWeight="bold">
                      {CHANNELS[j].name}
                    </tspan>
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default RgbXyzRelation;
