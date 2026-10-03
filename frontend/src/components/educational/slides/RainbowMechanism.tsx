import { useTranslation } from 'react-i18next';
import { draw, fade, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/rainbow_mechanism.py).
 */
const STEP = {
  sunlight: 0, // "A rainbow appears when sunlight passes through raindrops."
  refract: 1, // "Light bends as it enters a drop, by a slightly different angle for each color..."
  reflect: 2, // "The separated light reflects off the back of the drop,"
  exit: 3, // "bends again on the way out, and leaves in a different direction for each color."
  rainbow: 4, // "With light from many drops, a rainbow from red to violet appears in the sky."
  observer: 5, // "That's because red light reaches the eye from higher drops, violet from lower ones."
  rainbowArea: 6, // (near the end of the last sentence) the outlined rainbow area and its label
} as const;
const STEP_AT_MS = [0, 3500, 11000, 13500, 18000, 23000, 27000];

/**
 * Refractive index of water per color, with the spread between red and violet exaggerated
 * (real water: about 1.331 for red to 1.343 for violet) so the colors visibly separate.
 */
const COLORS = [
  { color: '#e01a00', n: 1.3 },
  { color: '#ff7a00', n: 1.32 },
  { color: '#e0b800', n: 1.34 },
  { color: '#00a848', n: 1.36 },
  { color: '#2a5cff', n: 1.38 },
  { color: '#7a2ad0', n: 1.4 },
] as const;

// Two rounded panels: the raindrop (top) and the observer scene (bottom)
const TOP_PANEL = { y: 0, height: 156 };
const BOTTOM_PANEL = { y: 164, height: 146 };

// Raindrop (top): sunlight comes in from the left at this height above the drop's center
const DROP = { cx: 140, cy: 78, r: 50 };
const IMPACT = 0.85; // fraction of the radius
const EXIT_RAY_LENGTH = 36;

// Observer scene (bottom): sunlight from the left, eye at the lower left, drops to the right
const EYE = { x: 30, y: 292 };
// The rainbow band runs from this distance from the eye up to below the raindrop diagram
const FAN_START = 132;
const FAN_LENGTH = 190;
const FAN_TOP_Y = 174;
// White fan-shaped area (centered on the eye) marking where the rainbow is seen
const RAINBOW_AREA = { inner: 126, outer: 144, marginDeg: 2, labelR: 116 };

type Vec = { x: number; y: number };
const add = (a: Vec, b: Vec): Vec => ({ x: a.x + b.x, y: a.y + b.y });
const sub = (a: Vec, b: Vec): Vec => ({ x: a.x - b.x, y: a.y - b.y });
const mul = (a: Vec, k: number): Vec => ({ x: a.x * k, y: a.y * k });
const dot = (a: Vec, b: Vec) => a.x * b.x + a.y * b.y;

/** Refract unit direction d at a surface with unit normal nrm facing against d (Snell's law) */
const refract = (d: Vec, nrm: Vec, eta: number): Vec => {
  const cosI = -dot(nrm, d);
  const k = 1 - eta * eta * (1 - cosI * cosI);
  return add(mul(d, eta), mul(nrm, eta * cosI - Math.sqrt(k)));
};

/** Where a ray starting on the drop's surface at p, heading along d, meets the surface again */
const crossDrop = (p: Vec, d: Vec): Vec => {
  const c = { x: DROP.cx, y: DROP.cy };
  return add(p, mul(d, -2 * dot(sub(p, c), d)));
};

/** Trace sunlight through the drop: refract in, reflect once at the back, refract out */
const traceRay = (n: number) => {
  const c = { x: DROP.cx, y: DROP.cy };
  const h = IMPACT * DROP.r;
  const entry = { x: DROP.cx - Math.sqrt(DROP.r * DROP.r - h * h), y: DROP.cy - h };
  const inside = refract({ x: 1, y: 0 }, mul(sub(entry, c), 1 / DROP.r), 1 / n);
  const back = crossDrop(entry, inside);
  const backNormal = mul(sub(back, c), 1 / DROP.r);
  const reflected = sub(inside, mul(backNormal, 2 * dot(inside, backNormal)));
  const exit = crossDrop(back, reflected);
  const out = refract(reflected, mul(sub(exit, c), -1 / DROP.r), n);
  // Angle between the outgoing light and the direction opposite the sun (the rainbow angle)
  const rainbowAngle = Math.atan2(out.y, -out.x);
  return { entry, back, exit, out, rainbowAngle };
};

const RAYS = COLORS.map((c) => ({ ...c, ...traceRay(c.n) }));
const RED = RAYS[0];
const VIOLET = RAYS[RAYS.length - 1];

const fromEye = (angle: number, length: number): Vec => ({
  x: EYE.x + Math.cos(angle) * length,
  y: EYE.y - Math.sin(angle) * length,
});

/** Upper-right end of a color's rainbow band, where its raindrop sits */
const fanEnd = (angle: number): Vec =>
  fromEye(angle, Math.min(FAN_LENGTH, (EYE.y - FAN_TOP_Y) / Math.sin(angle)));

/** Ring sector centered on the eye, between two angles (radians, counted up from the right) */
const ringSector = (from: number, to: number, inner: number, outer: number) => {
  const p = (a: number, r: number) => {
    const v = fromEye(a, r);
    return `${v.x.toFixed(1)},${v.y.toFixed(1)}`;
  };
  return (
    `M${p(from, inner)} L${p(from, outer)} A${outer},${outer} 0 0 0 ${p(to, outer)}` +
    ` L${p(to, inner)} A${inner},${inner} 0 0 1 ${p(from, inner)} Z`
  );
};

const line = (a: Vec, b: Vec) =>
  `M${a.x.toFixed(1)},${a.y.toFixed(1)} L${b.x.toFixed(1)},${b.y.toFixed(1)}`;

const RainbowMechanism = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.rainbow_mechanism.${key}`);
  const step = useSlideStep(STEP_AT_MS);

  const sceneDrops = [
    { ray: RED, label: k('red'), at: fanEnd(RED.rainbowAngle) },
    { ray: VIOLET, label: k('violet'), at: fanEnd(VIOLET.rainbowAngle) },
  ];

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

        {/* ── top: light passing through one raindrop ── */}
        <g style={fade(step >= STEP.sunlight)}>
          <circle
            cx={DROP.cx}
            cy={DROP.cy}
            r={DROP.r}
            fill="#dff1fb"
            stroke="#8cc4e0"
            strokeWidth="1.5"
          />
          <text x={DROP.cx - 40} y={DROP.cy + 5} fontSize="13" fill="#4a90b8">
            {k('raindrop')}
          </text>
          <text x="8" y={RED.entry.y - 8} fontSize="13" fill="#555">
            {k('sunlight')}
          </text>
        </g>
        <path
          d={line({ x: 8, y: RED.entry.y }, RED.entry)}
          pathLength={1}
          fill="none"
          stroke="#999"
          strokeWidth="2.5"
          style={draw(step >= STEP.sunlight, 300)}
        />

        {RAYS.map((r) => (
          <g key={r.color}>
            <path
              d={line(r.entry, r.back)}
              pathLength={1}
              fill="none"
              stroke={r.color}
              strokeWidth="1.3"
              style={draw(step >= STEP.refract)}
            />
            <path
              d={line(r.back, r.exit)}
              pathLength={1}
              fill="none"
              stroke={r.color}
              strokeWidth="1.3"
              style={draw(step >= STEP.reflect)}
            />
            <path
              d={line(r.exit, add(r.exit, mul(r.out, EXIT_RAY_LENGTH)))}
              pathLength={1}
              fill="none"
              stroke={r.color}
              strokeWidth="1.3"
              style={draw(step >= STEP.exit)}
            />
          </g>
        ))}

        {/* where the rainbow is seen */}
        <g style={fade(step >= STEP.rainbowArea)}>
          <path
            d={ringSector(
              VIOLET.rainbowAngle - (RAINBOW_AREA.marginDeg * Math.PI) / 180,
              RED.rainbowAngle + (RAINBOW_AREA.marginDeg * Math.PI) / 180,
              RAINBOW_AREA.inner,
              RAINBOW_AREA.outer
            )}
            fill="#fff"
            stroke="#000"
            strokeWidth="1"
          />
          <text
            x={fromEye((RED.rainbowAngle + VIOLET.rainbowAngle) / 2, RAINBOW_AREA.labelR).x}
            y={fromEye((RED.rainbowAngle + VIOLET.rainbowAngle) / 2, RAINBOW_AREA.labelR).y + 5}
            textAnchor="middle"
            fontSize="14"
            fontWeight="bold"
            fill="#555"
          >
            {k('rainbow')}
          </text>
        </g>

        {/* many drops together: the colors line up from red (top) to violet (bottom),
            drawn from the sky toward the eye */}
        {RAYS.map((r) => (
          <path
            key={r.color}
            d={line(fanEnd(r.rainbowAngle), fromEye(r.rainbowAngle, FAN_START))}
            pathLength={1}
            fill="none"
            stroke={r.color}
            strokeWidth="3"
            opacity="0.75"
            style={draw(step >= STEP.rainbow, 0, 1400)}
          />
        ))}

        {/* ── bottom: which drops send which color to the eye ── */}
        <g style={fade(step >= STEP.observer)}>
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
          <text x={EYE.x + 14} y={EYE.y + 5} fontSize="13" fill="#555">
            {k('eye')}
          </text>
        </g>
        {sceneDrops.map(({ ray, label, at }) => (
          <g key={ray.color}>
            <circle
              cx={at.x}
              cy={at.y}
              r="6"
              fill="#dff1fb"
              stroke="#8cc4e0"
              strokeWidth="1.2"
              style={fade(step >= STEP.observer)}
            />
            {/* the one color from this drop that reaches the eye */}
            <path
              d={line(at, EYE)}
              pathLength={1}
              fill="none"
              stroke={ray.color}
              strokeWidth="2"
              style={draw(step >= STEP.observer, 900)}
            />
            <text
              x={at.x + 10}
              y={at.y + 5}
              fontSize="13"
              fontWeight="bold"
              fill={ray.color}
              style={fade(step >= STEP.observer, 1500)}
            >
              {label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

export default RainbowMechanism;
