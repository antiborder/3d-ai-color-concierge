import { useTranslation } from 'react-i18next';
import { SPECTRUM_STOPS } from '../ConeSensitivityChart';
import { CONE_NM_MAX, CONE_NM_MIN } from '../coneFundamentals';
import { draw, fade, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/nature_of_light.py).
 */
const STEP = {
  wave: 0, // "Light is a wave of electric and magnetic vibrations — a kind of electromagnetic wave."
  wavelength: 1, // "The length from one crest to the next is called the wavelength."
  colors: 2, // "Light with a short wavelength looks blue, medium looks green, and long looks red."
  white: 3, // "Sunlight is a mix of many wavelengths, and all of them mixed look white."
} as const;
const STEP_AT_MS = [0, 6000, 10000, 16000];
// Within the colors step, when each wave starts (it follows the words blue → green → red)
const COLOR_DELAY_MS = [0, 1600, 3200];

// Two rounded panels: light as a wave (top) and wavelength ↔ color (bottom)
const TOP_PANEL = { y: 0, height: 120 };
const BOTTOM_PANEL = { y: 128, height: 182 };

// Top: one wave, crests at x = WAVE.crest0 + k * WAVE.length
const WAVE = { x0: 20, x1: 210, y: 62, amplitude: 22, length: 64, crest0: 36 };

// Bottom: wavelengths drawn to scale (viewBox units per nm)
const UNITS_PER_NM = 0.08;
const COLOR_WAVES = [
  { nm: 450, color: '#2a5cff', labelKey: 'blue', y: 160 },
  { nm: 530, color: '#00a848', labelKey: 'green', y: 200 },
  { nm: 650, color: '#e01a00', labelKey: 'red', y: 240 },
] as const;
// Labels are right-aligned just left of the waves, so longer (English) labels still fit
const COLOR_WAVE = { x0: 100, x1: 206, amplitude: 12 };
const WHITE = { x: 216, y: 284, r: 9 };
// Spectrum of single-wavelength light (violet at the top, red at the bottom) beside the waves
const SPECTRUM_WIDTH = 10;

/** Sine wave path from x0 to x1 around baseline y, with a crest at crestX */
const wavePath = (
  x0: number,
  x1: number,
  y: number,
  amplitude: number,
  length: number,
  crestX: number
) => {
  const points: string[] = [];
  for (let x = x0; x <= x1; x += 1.5) {
    const v = y - amplitude * Math.cos(((x - crestX) / length) * 2 * Math.PI);
    points.push(`${x.toFixed(1)},${v.toFixed(1)}`);
  }
  return 'M' + points.join(' L');
};

const NatureOfLight = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.nature_of_light.${key}`);
  const step = useSlideStep(STEP_AT_MS);

  // The wavelength arrow spans the 2nd and 3rd crests
  const crestA = WAVE.crest0 + WAVE.length;
  const crestB = crestA + WAVE.length;
  const crestY = WAVE.y - WAVE.amplitude;
  const arrowY = crestY - 10;

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

        {/* ── top: light is a wave ── */}
        <path
          d={wavePath(WAVE.x0, WAVE.x1, WAVE.y, WAVE.amplitude, WAVE.length, WAVE.crest0)}
          pathLength={1}
          fill="none"
          stroke="#555"
          strokeWidth="2"
          style={draw(step >= STEP.wave, 300, 2000)}
        />
        <text
          x="12"
          y={TOP_PANEL.height - 10}
          fontSize="13"
          fill="#555"
          style={fade(step >= STEP.wave)}
        >
          {k('light')}
        </text>

        <g style={fade(step >= STEP.wavelength)}>
          {[crestA, crestB].map((x) => (
            <line
              key={x}
              x1={x}
              y1={crestY}
              x2={x}
              y2={arrowY - 4}
              stroke="#888"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
          ))}
          <line x1={crestA} y1={arrowY} x2={crestB} y2={arrowY} stroke="#333" strokeWidth="1.2" />
          <polyline
            points={`${crestA + 5},${arrowY - 3} ${crestA},${arrowY} ${crestA + 5},${arrowY + 3}`}
            fill="none"
            stroke="#333"
            strokeWidth="1.2"
          />
          <polyline
            points={`${crestB - 5},${arrowY - 3} ${crestB},${arrowY} ${crestB - 5},${arrowY + 3}`}
            fill="none"
            stroke="#333"
            strokeWidth="1.2"
          />
          <text
            x={(crestA + crestB) / 2}
            y={arrowY - 6}
            textAnchor="middle"
            fontSize="13"
            fontWeight="bold"
            fill="#333"
          >
            {k('wavelength')}
          </text>
        </g>

        {/* ── bottom: wavelength decides the color ── */}
        {COLOR_WAVES.map((w, i) => {
          const length = w.nm * UNITS_PER_NM;
          return (
            <g key={w.nm}>
              <text
                x={COLOR_WAVE.x0 - 6}
                y={w.y + 5}
                textAnchor="end"
                fontSize="13"
                fontWeight="bold"
                fill={w.color}
                style={fade(step >= STEP.colors, COLOR_DELAY_MS[i])}
              >
                {k(w.labelKey)}
                <tspan fontWeight="normal" fill="#555">
                  {` ${w.nm}nm`}
                </tspan>
              </text>
              <path
                d={wavePath(
                  COLOR_WAVE.x0,
                  COLOR_WAVE.x1,
                  w.y,
                  COLOR_WAVE.amplitude,
                  length,
                  COLOR_WAVE.x0
                )}
                pathLength={1}
                fill="none"
                stroke={w.color}
                strokeWidth="2"
                style={draw(step >= STEP.colors, COLOR_DELAY_MS[i], 1200)}
              />
            </g>
          );
        })}

        {/* all wavelengths mixed together look white */}
        <g style={fade(step >= STEP.white)}>
          <defs>
            <linearGradient id="natureOfLightSpectrum" x1="0%" y1="0%" x2="0%" y2="100%">
              {SPECTRUM_STOPS.map(([nm, color]) => (
                <stop
                  key={nm}
                  offset={`${((nm - CONE_NM_MIN) / (CONE_NM_MAX - CONE_NM_MIN)) * 100}%`}
                  stopColor={color}
                />
              ))}
            </linearGradient>
          </defs>
          <rect
            x={WHITE.x - SPECTRUM_WIDTH / 2}
            y={COLOR_WAVES[0].y - 12}
            width={SPECTRUM_WIDTH}
            height={COLOR_WAVES[2].y - COLOR_WAVES[0].y + 24}
            fill="url(#natureOfLightSpectrum)"
          />
          <line
            x1={WHITE.x}
            y1={COLOR_WAVES[2].y + 12}
            x2={WHITE.x}
            y2={WHITE.y - WHITE.r - 3}
            stroke="#888"
            strokeWidth="1.2"
          />
          <polyline
            points={`${WHITE.x - 3},${WHITE.y - WHITE.r - 7} ${WHITE.x},${WHITE.y - WHITE.r - 3} ${WHITE.x + 3},${WHITE.y - WHITE.r - 7}`}
            fill="none"
            stroke="#888"
            strokeWidth="1.2"
          />
          <circle cx={WHITE.x} cy={WHITE.y} r={WHITE.r} fill="#fff" stroke="#bbb" strokeWidth="1" />
          <text
            x={WHITE.x - WHITE.r - 6}
            y={WHITE.y + 5}
            textAnchor="end"
            fontSize="13"
            fill="#555"
          >
            {k('white')}
          </text>
        </g>
      </svg>
    </div>
  );
};

export default NatureOfLight;
