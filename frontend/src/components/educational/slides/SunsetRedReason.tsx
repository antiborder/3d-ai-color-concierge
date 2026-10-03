import { useTranslation } from 'react-i18next';
import { draw, fade, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/sunset_red_reason.py).
 */
const STEP = {
  daytime: 0, // "In the daytime the sun is high, so sunlight travels only a short way through the air."
  sunset: 1, // "In the evening the sun is low, and its light travels a long way through the air."
  blueLost: 2, // "Along the way, blue light, which scatters easily, is almost all scattered away,"
  redLeft: 3, // "and the red and orange light that is left reaches the eye, so the sunset looks red."
} as const;
const STEP_AT_MS = [0, 5500, 11000, 16000];

const BLUE = '#2a5cff';
const GREEN = '#00a848';
const RED = '#e04000';
const HIGHLIGHT = '#ffb000';

// Two rounded panels: the path of sunlight at noon vs at sunset (top) and that long path (bottom)
const TOP_PANEL = { y: 0, height: 150 };
const BOTTOM_PANEL = { y: 158, height: 152 };

// Top: the Earth (seen from the side) with a layer of air, and a viewer on top of it
const EARTH = { cx: 115, cy: 270, r: 180 };
const AIR_R = 206;
const VIEWER = { x: EARTH.cx, y: EARTH.cy - EARTH.r - 2 };
const NOON_SUN = { x: VIEWER.x, y: 20, r: 9 };
const SUNSET_SUN = { x: 9, y: VIEWER.y - 2, r: 7 };
const AIR_TOP_Y = EARTH.cy - AIR_R;
// Where the nearly horizontal sunset ray enters the air
const SUNSET_AIR_X =
  EARTH.cx - Math.sqrt(AIR_R * AIR_R - (EARTH.cy - VIEWER.y) * (EARTH.cy - VIEWER.y));

// Bottom: the long path, with air molecules along it
const PATH = { y: 220, x0: 28, x1: 202, gap: 3.5 };
const PATH_SUN = { x: 15, r: 9 };
const PATH_EYE = { x: 214 };
const MOLECULE_X = [52, 82, 112, 142, 172];
// How far each color gets before it has been scattered away
const BLUE_END = 96;
const GREEN_END = 160;
const SCATTER_LENGTH = 14;

/** Short arrow from (x, y) straight up (dir −1) or down (dir 1), with an arrowhead */
const scatterArrow = (x: number, y: number, dir: 1 | -1, length: number) => {
  const ey = y + dir * length;
  return `M${x},${y} L${x},${ey} M${x - 3},${ey - dir * 4} L${x},${ey} L${x + 3},${ey - dir * 4}`;
};

const SunsetRedReason = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.sunset_red_reason.${key}`);
  const step = useSlideStep(STEP_AT_MS);

  const lightLines = [
    { color: BLUE, dy: -PATH.gap, end: BLUE_END, on: step >= STEP.blueLost },
    { color: GREEN, dy: 0, end: GREEN_END, on: step >= STEP.blueLost },
    { color: RED, dy: PATH.gap, end: PATH.x1, on: step >= STEP.redLeft },
  ];
  const scatters = [
    ...MOLECULE_X.filter((x) => x < BLUE_END).map((x) => ({ x, color: BLUE, length: 1 })),
    ...MOLECULE_X.filter((x) => x > BLUE_END && x < GREEN_END).map((x) => ({
      x,
      color: GREEN,
      length: 0.7,
    })),
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
        <defs>
          <clipPath id="sunsetTopPanel">
            <rect x="0" y={TOP_PANEL.y} width="230" height={TOP_PANEL.height} rx="8" />
          </clipPath>
          <linearGradient id="sunsetSky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffe3b8" />
            <stop offset="100%" stopColor="#ffb98a" />
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
        {/* the bottom panel turns sunset-colored at the end */}
        <rect
          x="0"
          y={BOTTOM_PANEL.y}
          width="230"
          height={BOTTOM_PANEL.height}
          rx="8"
          fill="url(#sunsetSky)"
          style={fade(step >= STEP.redLeft, 1600)}
        />

        {/* ── top: noon vs sunset ── */}
        <g style={fade(step >= STEP.daytime)}>
          <g clipPath="url(#sunsetTopPanel)">
            <circle cx={EARTH.cx} cy={EARTH.cy} r={AIR_R} fill="#e2f0fb" />
            <circle cx={EARTH.cx} cy={EARTH.cy} r={EARTH.r} fill="#dde8d2" />
          </g>
          <text x="222" y={AIR_TOP_Y + 4} textAnchor="end" fontSize="13" fill="#4a90b8">
            {k('air')}
          </text>
          <ellipse
            cx={VIEWER.x}
            cy={VIEWER.y}
            rx="6"
            ry="4"
            fill="#fff"
            stroke="#555"
            strokeWidth="1"
          />
          <circle cx={VIEWER.x} cy={VIEWER.y} r="1.8" fill="#333" />
          <circle cx={NOON_SUN.x} cy={NOON_SUN.y} r={NOON_SUN.r} fill="#ffcc33" />
          <text x={NOON_SUN.x + 14} y={NOON_SUN.y + 5} fontSize="13" fill="#555">
            {k('noon')}
          </text>
        </g>
        <path
          d={`M${NOON_SUN.x},${NOON_SUN.y + NOON_SUN.r} L${VIEWER.x},${VIEWER.y - 5}`}
          pathLength={1}
          fill="none"
          stroke="#999"
          strokeWidth="1.5"
          style={draw(step >= STEP.daytime, 400)}
        />
        <g style={fade(step >= STEP.daytime, 1300)}>
          <line
            x1={VIEWER.x}
            y1={AIR_TOP_Y}
            x2={VIEWER.x}
            y2={VIEWER.y - 5}
            stroke={HIGHLIGHT}
            strokeWidth="5"
            opacity="0.6"
          />
          <text x={VIEWER.x + 8} y={(AIR_TOP_Y + VIEWER.y) / 2 + 4} fontSize="13" fill="#b07000">
            {k('short')}
          </text>
        </g>

        <g style={fade(step >= STEP.sunset)}>
          <circle cx={SUNSET_SUN.x} cy={SUNSET_SUN.y} r={SUNSET_SUN.r} fill="#ff9933" />
          <text x="4" y={SUNSET_SUN.y - 12} fontSize="13" fill="#555">
            {k('sunset')}
          </text>
        </g>
        <path
          d={`M${SUNSET_SUN.x + SUNSET_SUN.r},${SUNSET_SUN.y} L${VIEWER.x - 6},${VIEWER.y}`}
          pathLength={1}
          fill="none"
          stroke="#999"
          strokeWidth="1.5"
          style={draw(step >= STEP.sunset, 400)}
        />
        <g style={fade(step >= STEP.sunset, 1300)}>
          <line
            x1={SUNSET_AIR_X}
            y1={VIEWER.y - 0.4}
            x2={VIEWER.x - 6}
            y2={VIEWER.y}
            stroke={HIGHLIGHT}
            strokeWidth="5"
            opacity="0.6"
          />
          <text
            x={(SUNSET_AIR_X + VIEWER.x) / 2}
            y={VIEWER.y + 18}
            textAnchor="middle"
            fontSize="13"
            fill="#b07000"
          >
            {k('long')}
          </text>
        </g>

        {/* ── bottom: along the long path, blue is scattered away and red is left ── */}
        <g style={fade(step >= STEP.blueLost)}>
          <text
            x={(PATH.x0 + PATH.x1) / 2}
            y={BOTTOM_PANEL.y + 20}
            textAnchor="middle"
            fontSize="13"
            fill="#555"
          >
            {k('longPath')}
          </text>
          <circle cx={PATH_SUN.x} cy={PATH.y} r={PATH_SUN.r} fill="#ff9933" />
          <ellipse
            cx={PATH_EYE.x}
            cy={PATH.y}
            rx="9"
            ry="5.5"
            fill="#fff"
            stroke="#555"
            strokeWidth="1.2"
          />
          <circle cx={PATH_EYE.x} cy={PATH.y} r="2.6" fill="#333" />
          <text x={PATH_EYE.x} y={PATH.y + 24} textAnchor="middle" fontSize="13" fill="#555">
            {k('eye')}
          </text>
          {MOLECULE_X.map((x) => (
            <circle key={x} cx={x} cy={PATH.y} r="3.5" fill="#666" />
          ))}
          <text x={MOLECULE_X[0]} y={PATH.y + 36} fontSize="13" fill="#555">
            {k('molecules')}
          </text>
        </g>
        {lightLines.map((l) => (
          <path
            key={l.color}
            d={`M${PATH.x0},${PATH.y + l.dy} L${l.end},${PATH.y + l.dy}`}
            pathLength={1}
            fill="none"
            stroke={l.color}
            strokeWidth="1.8"
            style={draw(l.on, 400, l.end === PATH.x1 ? 1600 : 1200)}
          />
        ))}
        {scatters.map((s) =>
          ([-1, 1] as const).map((dir) => (
            <path
              key={`${s.x}-${dir}`}
              d={scatterArrow(s.x, PATH.y + dir * 6, dir, SCATTER_LENGTH * s.length)}
              fill="none"
              stroke={s.color}
              strokeWidth="1.5"
              style={fade(step >= STEP.blueLost, 900)}
            />
          ))
        )}
        <text
          x="12"
          y={BOTTOM_PANEL.y + BOTTOM_PANEL.height - 12}
          fontSize="14"
          fontWeight="bold"
          fill="#c03a00"
          style={fade(step >= STEP.redLeft, 2000)}
        >
          {k('sunsetLooksRed')}
        </text>
      </svg>
    </div>
  );
};

export default SunsetRedReason;
