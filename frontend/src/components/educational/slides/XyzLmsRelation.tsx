import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SPECTRUM_STOPS } from '../ConeSensitivityChart';
import { CONE_FUNDAMENTALS, CONE_NM_MAX, CONE_NM_MIN } from '../coneFundamentals';
import { draw, fade, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/xyz_lms_relation.py); each step starts on the word in [ ].
 */
const STEP = {
  lms: 0, // "[LMSは]、目の3種類の錐体の反応を、そのまま3つの値にしたものです。"
  equations: 1, // "XYZは、このLMSを、[決まった]割合で足したり引いたりして"
  morph: 2, // "[作れます]。"
  z: 3, // "例えば[Zは]ほぼSと同じ、"
  y: 4, // "[Yは]LとMを足したもので、明るさを表します。"
  inverse: 5, // "[逆]の計算をすれば、XYZからLMSにも戻せるので、…"
} as const;
// When each step's words are spoken, counted from when the slide appears. Estimated from the
// reading (kana) of the Japanese narration at 8 morae/s, with pauses at 、(0.25 s) ・(0.15 s)
// 。(0.5 s) and 0.6 s before speech starts — calibrated on the hand-tuned RGB slide.
const STEP_AT_MS = [600, 9800, 12200, 13800, 15600, 19600];
const MORPH_MS = 1800;

// Two rounded panels: the curves, from LMS to XYZ (top), the conversion (bottom)
const TOP_PANEL = { y: 0, height: 185 };
const BOTTOM_PANEL = { y: 193, height: 117 };

// XYZ from LMS: the CIE 2006 (CIE 170-2) 2° matrix, applied to the cone fundamentals used by
// the other slides
const LMS_TO_XYZ = [
  [1.94735469, -1.41445123, 0.36476327],
  [0.68990272, 0.34832189, 0],
  [0, 0, 1.93485343],
];
const ROWS = CONE_FUNDAMENTALS.map(([nm, l, m, s]) => ({
  nm,
  lms: [l, m, s],
  xyz: LMS_TO_XYZ.map((row) => row[0] * l + row[1] * m + row[2] * s),
}));
const MAX_V = Math.max(...ROWS.flatMap((r) => [...r.lms, ...r.xyz]));

const CHART = { x0: 34, x1: 218, yBase: 140, height: 104 };
const xOf = (nm: number) =>
  CHART.x0 + ((nm - CONE_NM_MIN) / (CONE_NM_MAX - CONE_NM_MIN)) * (CHART.x1 - CHART.x0);
const yOf = (v: number) => CHART.yBase - (v / MAX_V) * CHART.height;
/** Curve j, a fraction t of the way from LMS (0) to XYZ (1) */
const valueAt = (r: (typeof ROWS)[number], j: number, t: number) =>
  r.lms[j] + (r.xyz[j] - r.lms[j]) * t;
const curvePath = (j: number, t: number) =>
  'M' + ROWS.map((r) => `${xOf(r.nm).toFixed(1)},${yOf(valueAt(r, j, t)).toFixed(1)}`).join(' L');
const peakAt = (j: number, t: number) =>
  ROWS.reduce((best, r) => (valueAt(r, j, t) > valueAt(best, j, t) ? r : best));

const CURVES = [
  { lms: 'L', xyz: 'X', color: '#e01a00' },
  { lms: 'M', xyz: 'Y', color: '#00a848' },
  { lms: 'S', xyz: 'Z', color: '#2a5cff' },
];

// Bottom: X, Y, Z as sums of L, M, S
const EQ = { x: 20, row0: BOTTOM_PANEL.y + 26, gap: 23 };
const fmt = (v: number) => Math.abs(v).toFixed(2);
const EQUATIONS = LMS_TO_XYZ.map((row, i) => {
  const terms = row
    .map((c, j) => ({ c, name: CURVES[j].lms }))
    .filter(({ c }) => c !== 0)
    .map(({ c, name }, n) => `${n === 0 ? '' : c < 0 ? ' − ' : ' + '}${fmt(c)}${name}`);
  return { name: CURVES[i].xyz, color: CURVES[i].color, text: terms.join('') };
});
const MONO = 'Menlo, Consolas, "Courier New", monospace';

const XyzLmsRelation = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.xyz_lms_relation.${key}`);
  const step = useSlideStep(STEP_AT_MS);

  // How far the curves have turned from LMS into XYZ (0 → 1)
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

  const highlightRow = step >= STEP.inverse ? -1 : step >= STEP.y ? 1 : step >= STEP.z ? 2 : -1;

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
          <linearGradient id="xyzLmsSpectrum" x1="0%" y1="0%" x2="100%" y2="0%">
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

        {/* ── top: the cone curves turn into the X, Y, Z curves ── */}
        <g style={fade(step >= STEP.lms)}>
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
            y1={CHART.yBase}
            x2={CHART.x0}
            y2={CHART.yBase - CHART.height - 8}
            stroke="#888"
            strokeWidth="1"
          />
          <rect
            x={CHART.x0}
            y={CHART.yBase + 4}
            width={CHART.x1 - CHART.x0}
            height="8"
            fill="url(#xyzLmsSpectrum)"
          />
          {[400, 500, 600, 700].map((nm) => (
            <text
              key={nm}
              x={xOf(nm)}
              y={CHART.yBase + 26}
              textAnchor="middle"
              fontSize="12"
              fill="#666"
            >
              {nm}
            </text>
          ))}
          <text x={CHART.x1} y={CHART.yBase + 40} textAnchor="end" fontSize="13" fill="#555">
            {k('wavelength')}
          </text>
        </g>
        {/* which set of curves is shown */}
        <text
          x="12"
          y="20"
          fontSize="14"
          fontWeight="bold"
          fill="#333"
          style={{ opacity: step >= STEP.lms ? 1 - morph : 0, transition: 'opacity 600ms ease' }}
        >
          {k('lmsCurves')}
        </text>
        <text x="12" y="20" fontSize="14" fontWeight="bold" fill="#333" style={{ opacity: morph }}>
          {k('xyzCurves')}
        </text>

        {CURVES.map((c, j) => {
          const peak = peakAt(j, morph);
          const px = xOf(peak.nm);
          const py = yOf(valueAt(peak, j, morph)) - 6;
          const highlighted = highlightRow === j;
          return (
            <g key={c.lms}>
              <path
                d={curvePath(j, morph)}
                pathLength={1}
                fill="none"
                stroke={c.color}
                style={{
                  ...draw(step >= STEP.lms, 300 + j * 300, 1400),
                  strokeWidth: highlighted ? 3.5 : 1.8,
                  transition: 'stroke-dashoffset 1400ms ease, stroke-width 500ms ease',
                }}
              />
              <text
                x={px}
                y={py}
                textAnchor="middle"
                fontSize="14"
                fontWeight="bold"
                fill={c.color}
                style={{ opacity: step >= STEP.lms ? 1 - morph : 0, transition: 'opacity 600ms' }}
              >
                {c.lms}
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

        {/* ── bottom: X, Y, Z are fixed sums of L, M, S ── */}
        {EQUATIONS.map((eq, i) => {
          const y = EQ.row0 + i * EQ.gap;
          return (
            <g key={eq.name} style={fade(step >= STEP.equations, i * 400)}>
              <rect
                x="8"
                y={y - 16}
                width="214"
                height="22"
                rx="5"
                fill={eq.color}
                style={{ opacity: highlightRow === i ? 0.15 : 0, transition: 'opacity 400ms ease' }}
              />
              <text x={EQ.x} y={y} fontSize="13" fontFamily={MONO} fill="#333">
                <tspan fill={eq.color} fontWeight="bold">
                  {eq.name}
                </tspan>
                {` = ${eq.text}`}
              </text>
            </g>
          );
        })}
        <text
          x="115"
          y={BOTTOM_PANEL.y + BOTTOM_PANEL.height - 14}
          textAnchor="middle"
          fontSize="13"
          fontWeight="bold"
          fill="#555"
          style={fade(step >= STEP.inverse)}
        >
          {k('inverse')}
        </text>
      </svg>
    </div>
  );
};

export default XyzLmsRelation;
