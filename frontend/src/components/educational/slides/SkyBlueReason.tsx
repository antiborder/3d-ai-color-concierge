import { useTranslation } from 'react-i18next';
import { draw, fade, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/sky_blue_reason.py).
 */
const STEP = {
  scene: 0, // "The light that reaches your eyes when you look at the sky"
  scattered: 1, // "is sunlight scattered by air molecules."
  strength: 2, // "Blue light is scattered more easily than green or red."
  sky: 3, // "Light from the sky has many wavelengths, but mostly blue, so the sky looks sky blue."
} as const;
const STEP_AT_MS = [0, 2500, 7000, 11000];

const BLUE = '#2a5cff';

// Two rounded panels: sunlight scattered toward the eye (top) and scattering by color (bottom)
const TOP_PANEL = { y: 0, height: 170 };
const BOTTOM_PANEL = { y: 178, height: 132 };

// Top: sun at the upper left, eye at the right above the ground
const SUN = { x: 24, y: 26, r: 12 };
const GROUND_Y = 156;
const EYE = { x: 188, y: 146 };
const MOLECULES = [
  { x: 78, y: 46 },
  { x: 132, y: 30 },
  { x: 176, y: 52 },
  { x: 150, y: 86 },
  { x: 98, y: 98 },
  { x: 56, y: 122 },
];
const MOLECULE_INTERVAL_MS = 250;

// Bottom: how easily each color is scattered (Rayleigh scattering: ∝ 1 / wavelength⁴)
const COLORS = [
  { key: 'blue', nm: 450, color: BLUE },
  { key: 'green', nm: 530, color: '#00a848' },
  { key: 'red', nm: 700, color: '#e01a00' },
];
// Labels are right-aligned just left of the bars, so longer (English) labels still fit
const BARS = {
  x0: 100,
  maxWidth: 110,
  height: 12,
  titleY: BOTTOM_PANEL.y + 22,
  row0: 212,
  gap: 24,
};
const scatterRelative = (nm: number) => (COLORS[0].nm / nm) ** 4;

const SkyBlueReason = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.sky_blue_reason.${key}`);
  const step = useSlideStep(STEP_AT_MS);

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
          <clipPath id="skyBlueTopPanel">
            <rect x="0" y={TOP_PANEL.y} width="230" height={TOP_PANEL.height} rx="8" />
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
        {/* the sky (above the ground) turns sky blue at the end */}
        <rect
          x="0"
          y={TOP_PANEL.y}
          width="230"
          height={GROUND_Y - TOP_PANEL.y}
          fill="#d4e9fc"
          clipPath="url(#skyBlueTopPanel)"
          style={fade(step >= STEP.sky, 600)}
        />

        {/* ── top: sunlight scattered by air molecules reaches the eye ── */}
        <g style={fade(step >= STEP.scene)}>
          <line x1="8" y1={GROUND_Y} x2="222" y2={GROUND_Y} stroke="#888" strokeWidth="1.2" />
          <circle cx={SUN.x} cy={SUN.y} r={SUN.r} fill="#ffcc33" />
          <ellipse
            cx={EYE.x}
            cy={EYE.y}
            rx="9"
            ry="5.5"
            fill="#fff"
            stroke="#555"
            strokeWidth="1.2"
          />
          <circle cx={EYE.x} cy={EYE.y} r="2.6" fill="#333" />
          <text x={EYE.x + 13} y={EYE.y + 5} fontSize="13" fill="#555">
            {k('eye')}
          </text>
        </g>

        {MOLECULES.map((m, i) => {
          const delay = i * MOLECULE_INTERVAL_MS;
          return (
            <g key={`${m.x}-${m.y}`}>
              {/* from the sun to the molecule, then bent toward the eye */}
              <path
                d={`M${SUN.x},${SUN.y} L${m.x},${m.y}`}
                pathLength={1}
                fill="none"
                stroke={BLUE}
                strokeWidth="1.4"
                style={draw(step >= STEP.scattered, delay, 700)}
              />
              <path
                d={`M${m.x},${m.y} L${EYE.x},${EYE.y}`}
                pathLength={1}
                fill="none"
                stroke={BLUE}
                strokeWidth="1.4"
                style={draw(step >= STEP.scattered, delay + 700, 800)}
              />
              <circle
                cx={m.x}
                cy={m.y}
                r="3.5"
                fill="#666"
                style={fade(step >= STEP.scattered, delay + 400)}
              />
            </g>
          );
        })}
        <text
          x={MOLECULES[5].x}
          y={MOLECULES[5].y + 20}
          textAnchor="middle"
          fontSize="13"
          fill="#555"
          style={fade(step >= STEP.scattered, 1200)}
        >
          {k('molecule')}
        </text>

        {/* ── bottom: blue is scattered more easily than green or red ── */}
        <g style={fade(step >= STEP.strength)}>
          <text x="12" y={BARS.titleY} fontSize="13" fontWeight="bold" fill="#333">
            {k('scattering')}
          </text>
          {COLORS.map((c, i) => {
            const y = BARS.row0 + i * BARS.gap;
            return (
              <g key={c.key}>
                <text
                  x={BARS.x0 - 6}
                  y={y + 10}
                  textAnchor="end"
                  fontSize="13"
                  fontWeight="bold"
                  fill={c.color}
                >
                  {k(c.key)}
                  <tspan fontWeight="normal" fill="#555">
                    {` ${c.nm}nm`}
                  </tspan>
                </text>
                <rect
                  x={BARS.x0}
                  y={y}
                  width={scatterRelative(c.nm) * BARS.maxWidth}
                  height={BARS.height}
                  rx="2"
                  fill={c.color}
                />
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};

export default SkyBlueReason;
