import { useTranslation } from 'react-i18next';
import { SPECTRUM_STOPS } from '../ConeSensitivityChart';
import {
  ChromaticityAxes,
  ChromaticityFill,
  LOCUS_LABELS,
  LOCUS_PATH,
  PLOT,
  SRGB,
  locusPoint,
  toPx,
  trianglePath,
} from '../chromaticity';
import { CONE_NM_MAX, CONE_NM_MIN } from '../coneFundamentals';
import { draw, fade, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/visible_gamut.py); each step starts on the word in [ ].
 */
const STEP = {
  fill: 0, // "[人が見分けられる色は]、"
  edge: 1, // "色度図の[馬蹄形の中に]すべて収まります。"
  spectral: 2, // "ふちは、[380から700ナノメートルの]単色光で、"
  mix: 3, // "[どんな光も]単色光の組み合わせなので、その色は必ずこの内側に来ます。"
  outside: 4, // "[外側は]、実在しない色です。"
  screen: 5, // "[画面で表示できるのは]、この中の一部だけです。"
} as const;
// When each step's words are spoken, counted from when the slide appears. Estimated from the
// reading (kana) of the Japanese narration at 8 morae/s, with pauses at 、(0.25 s) ・(0.15 s)
// 。(0.5 s) and 0.6 s before speech starts — calibrated on the hand-tuned RGB slide.
const STEP_AT_MS = [600, 3000, 5700, 10100, 16000, 18700];

// Two rounded panels: the diagram (top), the rainbow that makes up its edge (bottom)
const TOP_PANEL = { y: 0, height: 220 };
const BOTTOM_PANEL = { y: 228, height: 82 };

// The plot area outside the horseshoe
const PLOT_RECT = (() => {
  const tl = toPx(0, PLOT.yMax);
  const br = toPx(PLOT.xMax, 0);
  return `M${tl.x},${tl.y} H${br.x} V${br.y} H${tl.x} Z`;
})();

// Any light is a mix of single-wavelength lights, so it lands between them, inside the edge
const MIX_A = locusPoint(480);
const MIX_B = locusPoint(600);

// The spectrum bar
const BAR = { x0: 20, x1: 210, y: BOTTOM_PANEL.y + 34, h: 12 };
const barX = (nm: number) =>
  BAR.x0 + ((nm - CONE_NM_MIN) / (CONE_NM_MAX - CONE_NM_MIN)) * (BAR.x1 - BAR.x0);

const VisibleGamut = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.visible_gamut.${key}`);
  const step = useSlideStep(STEP_AT_MS);

  const a = toPx(MIX_A.x, MIX_A.y);
  const b = toPx(MIX_B.x, MIX_B.y);
  const outsideLabel = toPx(0.6, 0.78);

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
          <linearGradient id="visibleGamutSpectrum" x1="0%" y1="0%" x2="100%" y2="0%">
            {SPECTRUM_STOPS.map(([nm, color]) => (
              <stop
                key={nm}
                offset={`${((nm - CONE_NM_MIN) / (CONE_NM_MAX - CONE_NM_MIN)) * 100}%`}
                stopColor={color}
              />
            ))}
          </linearGradient>
          <pattern
            id="visibleGamutHatch"
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="6" stroke="#bbb" strokeWidth="1.5" />
          </pattern>
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

        {/* ── top: everything we can see lies inside the horseshoe ── */}
        <g style={fade(step >= STEP.fill)}>
          <ChromaticityAxes />
          <ChromaticityFill id="visibleGamut" />
        </g>

        {/* outside the horseshoe: colors that don't exist */}
        <g style={fade(step >= STEP.outside)}>
          <path
            d={`${PLOT_RECT} ${LOCUS_PATH}`}
            fillRule="evenodd"
            fill="url(#visibleGamutHatch)"
          />
          <text
            x={outsideLabel.x}
            y={outsideLabel.y}
            textAnchor="middle"
            fontSize="13"
            fontWeight="bold"
            fill="#555"
            stroke="#f7f8fb"
            strokeWidth="4"
            paintOrder="stroke"
          >
            {k('notReal')}
          </text>
        </g>

        <path
          d={LOCUS_PATH}
          pathLength={1}
          fill="none"
          stroke="#222"
          strokeWidth="2"
          strokeLinejoin="round"
          style={draw(step >= STEP.edge, 0, 1800)}
        />
        <g style={fade(step >= STEP.spectral)}>
          {LOCUS_LABELS.map((l) => {
            const p = locusPoint(l.nm);
            const px = toPx(p.x, p.y);
            return (
              <text
                key={l.nm}
                x={px.x + l.dx}
                y={px.y + l.dy}
                textAnchor={l.anchor}
                fontSize="11"
                fill="#444"
              >
                {l.nm}
              </text>
            );
          })}
        </g>

        {/* a mix of two single-wavelength lights lands between them */}
        <g style={fade(step >= STEP.mix)}>
          <line
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke="#333"
            strokeWidth="1.8"
            strokeDasharray="4 3"
          />
          {[a, b].map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="4.5" fill="#fff" stroke="#333" strokeWidth="1.5" />
          ))}
        </g>
        <circle
          cx={(a.x + b.x) / 2}
          cy={(a.y + b.y) / 2}
          r="4.5"
          fill="#333"
          stroke="#fff"
          strokeWidth="1.5"
          style={fade(step >= STEP.mix, 500)}
        />

        {/* a screen shows only part of it */}
        <path
          d={trianglePath(SRGB)}
          fill="none"
          stroke="#222"
          strokeWidth="1.5"
          strokeDasharray="5 3"
          strokeLinejoin="round"
          style={fade(step >= STEP.screen)}
        />

        {/* ── bottom: the edge is the rainbow, 380–700 nm ── */}
        <g style={fade(step >= STEP.spectral)}>
          <text
            x="115"
            y={BOTTOM_PANEL.y + 22}
            textAnchor="middle"
            fontSize="13"
            fontWeight="bold"
            fill="#555"
          >
            {k('edge')}
          </text>
          <rect
            x={BAR.x0}
            y={BAR.y}
            width={BAR.x1 - BAR.x0}
            height={BAR.h}
            rx="3"
            fill="url(#visibleGamutSpectrum)"
          />
          {[400, 500, 600, 700].map((nm) => (
            <text
              key={nm}
              x={barX(nm)}
              y={BAR.y + BAR.h + 14}
              textAnchor="middle"
              fontSize="12"
              fill="#666"
            >
              {nm}
            </text>
          ))}
        </g>
        <text
          x={BAR.x1}
          y={BOTTOM_PANEL.y + BOTTOM_PANEL.height - 6}
          textAnchor="end"
          fontSize="12"
          fill="#555"
          style={fade(step >= STEP.screen)}
        >
          {k('screenNote')}
        </text>
      </svg>
    </div>
  );
};

export default VisibleGamut;
