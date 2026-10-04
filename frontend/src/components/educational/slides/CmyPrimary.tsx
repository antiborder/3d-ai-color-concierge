import { useTranslation } from 'react-i18next';
import { draw, fade, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/cmy_primary.py); each step starts on the word in [ ].
 */
const STEP = {
  cyan: 0, // "色材の三原色は、[シアン]・"
  magenta: 1, // "[マゼンタ]・"
  yellow: 2, // "[イエロー]の3色です。"
  overlap: 3, // "色材は[重ねる]ほど暗くなり、"
  blue: 4, // "シアンとマゼンタで[青]、"
  red: 5, // "マゼンタとイエローで[赤]、"
  green: 6, // "イエローとシアンで[緑]、"
  black: 7, // "3色全部で[黒]に近くなります。"
  absorb: 8, // "色材は光の一部を[吸収]するので、"
  redAbsorbed: 9, // "例えばシアンのインクは[赤い光]を吸収し、"
  reflected: 10, // "[残った]緑と青の光が目に届きます。"
} as const;
// When each step's word is spoken, counted from when the slide appears. Estimated from the
// reading (kana) of the Japanese narration at 8 morae/s, with pauses at 、(0.25 s) ・(0.15 s)
// 。(0.5 s) and 0.6 s before speech starts — calibrated on the hand-tuned RGB slide.
const STEP_AT_MS = [2400, 2900, 3500, 6000, 8800, 10500, 12200, 13800, 17200, 19900, 21700];

const LIGHT = { red: '#e01a00', green: '#00a848', blue: '#2a5cff' };

// Two rounded panels: overlapping inks on white paper (top), how cyan ink works (bottom)
const TOP_PANEL = { y: 0, height: 205 };
const BOTTOM_PANEL = { y: 213, height: 97 };

const R = 44;
// Where each ink ends up, and how far apart they start before being overlapped
const INKS = [
  { key: 'cyan', color: '#00ffff', at: { x: 115, y: 80 }, from: { x: 0, y: -28 }, step: STEP.cyan },
  {
    key: 'magenta',
    color: '#ff00ff',
    at: { x: 88, y: 127 },
    from: { x: -28, y: 24 },
    step: STEP.magenta,
  },
  {
    key: 'yellow',
    color: '#ffff00',
    at: { x: 142, y: 127 },
    from: { x: 28, y: 24 },
    step: STEP.yellow,
  },
];
// Labels for the mixed colors, outside the circles with a line to their region
const MIXES = [
  {
    key: 'blue',
    color: '#0000cc',
    region: { x: 97, y: 99 },
    label: { x: 32, y: 70 },
    step: STEP.blue,
  },
  {
    key: 'red',
    color: '#cc0000',
    region: { x: 115, y: 134 },
    label: { x: 115, y: 196 },
    step: STEP.red,
  },
  {
    key: 'green',
    color: '#008800',
    region: { x: 133, y: 99 },
    label: { x: 194, y: 70 },
    step: STEP.green,
  },
  {
    key: 'black',
    color: '#000',
    region: { x: 115, y: 111 },
    label: { x: 202, y: 22 },
    step: STEP.black,
  },
];

// Bottom: white light (red, green, blue) hits cyan ink; red is absorbed, green and blue bounce
const INK_BAND = { y: BOTTOM_PANEL.y + 72, height: 16 };
const RAYS = [
  { key: 'red', color: LIGHT.red, start: { x: 24, y: 238 }, hit: { x: 72, y: INK_BAND.y } },
  { key: 'green', color: LIGHT.green, start: { x: 38, y: 238 }, hit: { x: 86, y: INK_BAND.y } },
  { key: 'blue', color: LIGHT.blue, start: { x: 52, y: 238 }, hit: { x: 100, y: INK_BAND.y } },
];
const BOUNCE = { dx: 48, dy: -46 };

const arrowHead = (tip: { x: number; y: number }, from: { x: number; y: number }) => {
  const a = Math.atan2(tip.y - from.y, tip.x - from.x);
  const p = (d: number) =>
    `${(tip.x - 6 * Math.cos(a + d)).toFixed(1)},${(tip.y - 6 * Math.sin(a + d)).toFixed(1)}`;
  return `M${p(0.45)} L${tip.x},${tip.y} L${p(-0.45)}`;
};

const CmyPrimary = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.cmy_primary.${key}`);
  const step = useSlideStep(STEP_AT_MS);

  const overlapped = step >= STEP.overlap;
  const moveIn = (from: { x: number; y: number }) => ({
    transform: overlapped ? 'translate(0px, 0px)' : `translate(${from.x}px, ${from.y}px)`,
    transition: 'opacity 600ms ease, transform 1500ms ease',
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
        {/* top panel is white paper */}
        <rect
          x="0.5"
          y={TOP_PANEL.y + 0.5}
          width="229"
          height={TOP_PANEL.height - 1}
          rx="8"
          fill="#fff"
          stroke="#e3e6ec"
        />
        <rect
          x="0"
          y={BOTTOM_PANEL.y}
          width="230"
          height={BOTTOM_PANEL.height}
          rx="8"
          fill="#f7f8fb"
        />

        {/* ── top: three inks, first apart, then overlapped (they take away: multiply blend) ── */}
        <g style={{ isolation: 'isolate' }}>
          {INKS.map((ink) => (
            <g key={ink.key} style={{ ...fade(step >= ink.step), ...moveIn(ink.from) }}>
              <circle
                cx={ink.at.x}
                cy={ink.at.y}
                r={R}
                fill={ink.color}
                style={{ mixBlendMode: 'multiply' }}
              />
            </g>
          ))}
        </g>
        {/* The blend alone renders the overlaps unevenly, so once the inks are in place the
            overlaps are drawn exactly: two inks give blue / red / green, all three give black */}
        <defs>
          {INKS.map((ink) => (
            <clipPath key={ink.key} id={`cmyClip-${ink.key}`}>
              <circle cx={ink.at.x} cy={ink.at.y} r={R} />
            </clipPath>
          ))}
        </defs>
        <g style={fade(overlapped, 1400)}>
          {[
            { a: INKS[0], b: INKS[1], color: '#0000ff' },
            { a: INKS[1], b: INKS[2], color: '#ff0000' },
            { a: INKS[2], b: INKS[0], color: '#00ff00' },
          ].map(({ a, b, color }) => (
            <circle
              key={color}
              cx={a.at.x}
              cy={a.at.y}
              r={R}
              fill={color}
              clipPath={`url(#cmyClip-${b.key})`}
            />
          ))}
          <g clipPath={`url(#cmyClip-${INKS[0].key})`}>
            <circle
              cx={INKS[1].at.x}
              cy={INKS[1].at.y}
              r={R}
              fill="#000"
              clipPath={`url(#cmyClip-${INKS[2].key})`}
            />
          </g>
        </g>
        {INKS.map((ink) => {
          // Each name sits in the part of its circle that never overlaps the others
          const away = { x: (ink.at.x - 115) * 0.7, y: (ink.at.y - 111) * 0.7 };
          return (
            <text
              key={ink.key}
              x={ink.at.x + away.x}
              y={ink.at.y + away.y + 5}
              textAnchor="middle"
              fontSize="13"
              fontWeight="bold"
              fill="#333"
              style={{ ...fade(step >= ink.step), ...moveIn(ink.from) }}
            >
              {k(ink.key)}
            </text>
          );
        })}

        {MIXES.map((mix) => (
          <g key={mix.key} style={fade(step >= mix.step)}>
            <line
              x1={mix.region.x}
              y1={mix.region.y}
              x2={mix.label.x}
              y2={mix.label.y + (mix.label.y > mix.region.y ? -12 : 4)}
              stroke="#999"
              strokeWidth="1"
            />
            <circle cx={mix.region.x} cy={mix.region.y} r="2.5" fill="#fff" stroke="#333" />
            <text
              x={mix.label.x}
              y={mix.label.y}
              textAnchor="middle"
              fontSize="13"
              fontWeight="bold"
              fill={mix.color}
            >
              {k(mix.key)}
            </text>
          </g>
        ))}

        {/* ── bottom: cyan ink absorbs red light; green and blue are left ── */}
        <g style={fade(step >= STEP.absorb)}>
          <text x="12" y={BOTTOM_PANEL.y + 18} fontSize="13" fill="#333">
            {k('whiteLight')}
          </text>
          <rect x="12" y={INK_BAND.y} width="206" height={INK_BAND.height} rx="3" fill="#00ffff" />
          <text
            x="160"
            y={INK_BAND.y + 12}
            textAnchor="middle"
            fontSize="12"
            fontWeight="bold"
            fill="#036"
          >
            {k('cyanInk')}
          </text>
        </g>
        {RAYS.map((ray) => (
          <g key={ray.key}>
            <path
              d={`M${ray.start.x},${ray.start.y} L${ray.hit.x},${ray.hit.y}`}
              pathLength={1}
              fill="none"
              stroke={ray.color}
              strokeWidth="2"
              style={draw(step >= STEP.absorb, 300)}
            />
            <path
              d={arrowHead(ray.hit, ray.start)}
              fill="none"
              stroke={ray.color}
              strokeWidth="2"
              style={fade(step >= STEP.absorb, 1100)}
            />
          </g>
        ))}
        {/* red stops in the ink */}
        <g style={fade(step >= STEP.redAbsorbed)}>
          <path
            d={`M${RAYS[0].hit.x - 5},${RAYS[0].hit.y - 9} l10,10 M${RAYS[0].hit.x + 5},${RAYS[0].hit.y - 9} l-10,10`}
            stroke="#333"
            strokeWidth="2"
          />
        </g>
        {/* green and blue bounce back to the eye */}
        {RAYS.slice(1).map((ray) => {
          const end = { x: ray.hit.x + BOUNCE.dx, y: ray.hit.y + BOUNCE.dy };
          return (
            <g key={ray.key}>
              <path
                d={`M${ray.hit.x},${ray.hit.y} L${end.x},${end.y}`}
                pathLength={1}
                fill="none"
                stroke={ray.color}
                strokeWidth="2"
                style={draw(step >= STEP.reflected)}
              />
              <path
                d={arrowHead(end, ray.hit)}
                fill="none"
                stroke={ray.color}
                strokeWidth="2"
                style={fade(step >= STEP.reflected, 800)}
              />
            </g>
          );
        })}
        <text
          x="218"
          y={BOTTOM_PANEL.y + 18}
          textAnchor="end"
          fontSize="13"
          fontWeight="bold"
          fill="#0a8aa0"
          style={fade(step >= STEP.reflected, 900)}
        >
          {k('looksCyan')}
        </text>
      </svg>
    </div>
  );
};

export default CmyPrimary;
