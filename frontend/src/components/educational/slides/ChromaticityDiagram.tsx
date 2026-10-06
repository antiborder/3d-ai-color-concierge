import { useTranslation } from 'react-i18next';
import {
  ChromaticityAxes,
  ChromaticityFill,
  LOCUS_LABELS,
  LOCUS_PATH,
  PURPLE_LINE,
  WHITE_D65,
  locusPoint,
  toPx,
} from '../chromaticity';
import { draw, fade, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/chromaticity_diagram.py); each step starts on the word in [ ].
 */
const STEP = {
  axes: 0, // "[色度図は]、"
  fill: 1, // "XYZから明るさを取り除き、[色みだけを]平面に並べた図です。"
  formula: 2, // "[XとYとZの合計で]割った、小文字のxとyを座標にします。"
  locus: 3, // "[馬蹄形の]ふちには、虹の単色光が波長の順に並び、"
  purple: 4, // "[下の直線には]、マゼンタなど虹にない色が並びます。"
  white: 5, // "[中心付近が白で]、"
  mix: 6, // "[2つの光を]混ぜた色は、2点を結ぶ直線の上に来ます。"
} as const;
// When each step's words are spoken, counted from when the slide appears. Estimated from the
// reading (kana) of the Japanese narration at 8 morae/s, with pauses at 、(0.25 s) ・(0.15 s)
// 。(0.5 s) and 0.6 s before speech starts — calibrated on the hand-tuned RGB slide.
const STEP_AT_MS = [600, 4400, 8600, 13200, 17500, 21700, 23400];

// Two rounded panels: the diagram (top), how x and y are worked out (bottom)
const TOP_PANEL = { y: 0, height: 220 };
const BOTTOM_PANEL = { y: 228, height: 82 };
const MONO = 'Menlo, Consolas, "Courier New", monospace';

// Two spectral lights and the line their mixtures fall on
const MIX_A = locusPoint(620);
const MIX_B = locusPoint(510);

const ChromaticityDiagram = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.chromaticity_diagram.${key}`);
  const step = useSlideStep(STEP_AT_MS);

  const white = toPx(WHITE_D65[0], WHITE_D65[1]);
  const a = toPx(MIX_A.x, MIX_A.y);
  const b = toPx(MIX_B.x, MIX_B.y);
  const purpleLabel = { x: toPx(0.6, 0).x, y: 189 }; // in the wedge under the purple line

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

        {/* ── top: the diagram ── */}
        <g style={fade(step >= STEP.axes)}>
          <ChromaticityAxes />
        </g>
        <g style={fade(step >= STEP.fill)}>
          <ChromaticityFill id="chromaticityDiagram" />
        </g>

        {/* the horseshoe's curved edge: the rainbow's single-wavelength lights */}
        <path
          d={LOCUS_PATH}
          pathLength={1}
          fill="none"
          stroke="#333"
          strokeWidth="1.6"
          strokeLinejoin="round"
          style={draw(step >= STEP.locus, 0, 1800)}
        />
        <g style={fade(step >= STEP.locus, 900)}>
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

        {/* the straight bottom edge: magenta and purples, not in the rainbow */}
        <path
          d={PURPLE_LINE}
          fill="none"
          stroke="#c0007a"
          strokeWidth="3"
          strokeDasharray="5 3"
          style={fade(step >= STEP.purple)}
        />
        <text
          x={purpleLabel.x}
          y={purpleLabel.y}
          textAnchor="middle"
          fontSize="13"
          fontWeight="bold"
          fill="#a00066"
          style={fade(step >= STEP.purple, 300)}
        >
          {k('purpleLine')}
        </text>

        {/* white near the middle */}
        <g style={fade(step >= STEP.white)}>
          <circle cx={white.x} cy={white.y} r="4.5" fill="#fff" stroke="#333" strokeWidth="1.5" />
          <text
            x={white.x + 8}
            y={white.y + 4}
            fontSize="13"
            fontWeight="bold"
            fill="#333"
            stroke="#fff"
            strokeWidth="3"
            paintOrder="stroke"
          >
            {k('white')}
          </text>
        </g>

        {/* mixing two lights: the result lies on the line between them */}
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
        <g style={fade(step >= STEP.mix, 500)}>
          <circle
            cx={(a.x + b.x) / 2}
            cy={(a.y + b.y) / 2}
            r="4.5"
            fill="#333"
            stroke="#fff"
            strokeWidth="1.5"
          />
          <text
            x={(a.x + b.x) / 2 - 8}
            y={(a.y + b.y) / 2 + 18}
            textAnchor="end"
            fontSize="13"
            fontWeight="bold"
            fill="#333"
            stroke="#fff"
            strokeWidth="3"
            paintOrder="stroke"
          >
            {k('mix')}
          </text>
        </g>

        {/* ── bottom: x and y are X and Y divided by their sum ── */}
        <g style={fade(step >= STEP.formula)}>
          <text
            x="115"
            y={BOTTOM_PANEL.y + 22}
            textAnchor="middle"
            fontSize="13"
            fontWeight="bold"
            fill="#555"
          >
            {k('formulaTitle')}
          </text>
          {['x = X ÷ (X+Y+Z)', 'y = Y ÷ (X+Y+Z)'].map((line, i) => (
            <text
              key={line}
              x="115"
              y={BOTTOM_PANEL.y + 46 + i * 22}
              textAnchor="middle"
              fontSize="14"
              fontFamily={MONO}
              fill="#333"
            >
              {line}
            </text>
          ))}
        </g>
      </svg>
    </div>
  );
};

export default ChromaticityDiagram;
