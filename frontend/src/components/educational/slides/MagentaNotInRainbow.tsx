import { useTranslation } from 'react-i18next';
import { coneResponse } from '../coneFundamentals';
import {
  LevelLines,
  PickedLight,
  ResponseMarks,
  StagedChart,
  X0,
  X1_WITH_RIGHT_AXIS,
} from '../coneStagedChart';
import { fade, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/magenta_not_in_rainbow.py).
 */
const STEP = {
  red: 0, // "Magenta is made by combining red"
  blue: 1, // "and blue."
  frame: 2, // "People often think a rainbow holds every color, but"
  curves: 3, // "magenta is not in the rainbow."
  pick: 4, // "We see magenta when L and S respond strongly and M weakly, but"
  blueResponse: 5, // "no single wavelength of light gives that response."
  redResponse: 6, // "Two or more lights have to be mixed."
} as const;
const STEP_AT_MS = [0, 1500, 4500, 8500, 11500, 17000, 21500];

const RED = { nm: 630, color: '#e01a00' };
const BLUE = { nm: 450, color: '#2a3cff' };
const MAGENTA = '#e020e0';

// Two rounded panels: red + blue light making magenta (top) and the cone chart (bottom)
const TOP_PANEL = { y: 0, height: 150 };
const BOTTOM_PANEL = { y: 158, height: 162 };

// Top: two overlapping circles of light
const CIRCLE = { r: 40, y: 72, redX: 92, blueX: 138 };

// Bottom: cone chart with a right Y axis
const Y_BASE = 270;
const X1 = X1_WITH_RIGHT_AXIS;

const MagentaNotInRainbow = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.magenta_not_in_rainbow.${key}`);
  const step = useSlideStep(STEP_AT_MS);

  // Cone responses (CIE 2006 data) to the blue and to the red light
  const blueHits = coneResponse(BLUE.nm);
  const redHits = coneResponse(RED.nm);

  return (
    <div style={{ padding: '12px 8px', fontFamily: 'sans-serif' }}>
      <h3 style={{ margin: '0 0 8px', fontSize: '19px', fontWeight: 700, textAlign: 'center' }}>
        {k('title')}
      </h3>

      <svg
        viewBox="0 0 230 320"
        width="100%"
        style={{ display: 'block', maxWidth: '260px', margin: '0 auto' }}
      >
        <defs>
          <clipPath id="magentaRedCircle">
            <circle cx={CIRCLE.redX} cy={CIRCLE.y} r={CIRCLE.r} />
          </clipPath>
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

        {/* ── top: red + blue light make magenta ── */}
        <g style={fade(step >= STEP.red)}>
          <circle cx={CIRCLE.redX} cy={CIRCLE.y} r={CIRCLE.r} fill={RED.color} />
          <text
            x={CIRCLE.redX - CIRCLE.r - 6}
            y={CIRCLE.y + 5}
            textAnchor="end"
            fontSize="14"
            fontWeight="bold"
            fill={RED.color}
          >
            {k('red')}
          </text>
        </g>
        <g style={fade(step >= STEP.blue)}>
          <circle cx={CIRCLE.blueX} cy={CIRCLE.y} r={CIRCLE.r} fill={BLUE.color} />
          {/* where the two lights overlap */}
          <circle
            cx={CIRCLE.blueX}
            cy={CIRCLE.y}
            r={CIRCLE.r}
            fill={MAGENTA}
            clipPath="url(#magentaRedCircle)"
          />
          <text
            x={CIRCLE.blueX + CIRCLE.r + 6}
            y={CIRCLE.y + 5}
            fontSize="14"
            fontWeight="bold"
            fill={BLUE.color}
          >
            {k('blue')}
          </text>
          <text
            x={(CIRCLE.redX + CIRCLE.blueX) / 2}
            y={CIRCLE.y + CIRCLE.r + 24}
            textAnchor="middle"
            fontSize="14"
            fontWeight="bold"
            fill="#b010b0"
          >
            {k('magenta')}
          </text>
        </g>

        {/* ── bottom: no single wavelength gives magenta's cone response ── */}
        <StagedChart
          x1={X1}
          yBase={Y_BASE}
          idPrefix="magentaNotInRainbow"
          bands={[]}
          sensitivityLabel={k('sensitivity')}
          wavelengthLabel={k('wavelength')}
          showFrame={step >= STEP.frame}
          showCurves={step >= STEP.curves}
          rightAxis
        />
        {[BLUE, RED].map((light) => (
          <PickedLight
            key={light.nm}
            x1={X1}
            nm={light.nm}
            yBase={Y_BASE}
            hits={light === BLUE ? blueHits : redHits}
            circled={step >= STEP.pick}
            raised={step >= STEP.pick}
          />
        ))}
        <LevelLines
          x1={X1}
          levels={blueHits}
          fromNm={{ L: BLUE.nm, M: BLUE.nm, S: BLUE.nm }}
          axisX={X0}
          yBase={Y_BASE}
          visible={step >= STEP.blueResponse}
        />
        <ResponseMarks
          axisX={X0}
          levels={blueHits}
          yBase={Y_BASE}
          visible={step >= STEP.blueResponse}
          delayMs={800}
        />
        <LevelLines
          x1={X1}
          levels={redHits}
          fromNm={{ L: RED.nm, M: RED.nm, S: RED.nm }}
          axisX={X1}
          yBase={Y_BASE}
          visible={step >= STEP.redResponse}
        />
        <ResponseMarks
          axisX={X1}
          levels={redHits}
          yBase={Y_BASE}
          visible={step >= STEP.redResponse}
          delayMs={800}
        />
      </svg>
    </div>
  );
};

export default MagentaNotInRainbow;
