import { useTranslation } from 'react-i18next';

// Eye cross-section (top) and a magnified patch of retina (bottom).
const EYE = { cx: 150, cy: 72, r: 46 };
const FOCUS = { x: 195, y: 72 }; // where the rays meet on the retina
const LENS = { cx: 116, cy: 72 };
const RAY_COLOR = '#f2a900';
const RETINA_COLOR = '#e05a5a';

const ZOOM = { x: 10, y: 160, w: 210, h: 104 };

const CONES = [
  { label: 'L', x: 34, fill: '#e5533d' },
  { label: 'M', x: 64, fill: '#3aa655' },
  { label: 'S', x: 94, fill: '#3f6fe0' },
];
const RODS_X = [150, 168, 186];
const CELL_TOP = ZOOM.y + 46;
const CELL_BOTTOM = ZOOM.y + 82;

const LightVisibleReason = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.light_visible_reason.${key}`);

  return (
    <div style={{ padding: '12px 8px', fontFamily: 'sans-serif' }}>
      <h3 style={{ margin: '0 0 8px', fontSize: '19px', fontWeight: 700, textAlign: 'center' }}>
        {k('title')}
      </h3>

      <svg
        viewBox="0 0 230 272"
        width="100%"
        style={{
          display: 'block',
          maxWidth: '260px',
          margin: '0 auto',
          background: '#f7f8fb',
          borderRadius: '8px',
        }}
      >
        {/* ── Light source ── */}
        <circle cx="26" cy="44" r="11" fill="#ffc94d" stroke={RAY_COLOR} strokeWidth="1.5" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
          const a = (deg * Math.PI) / 180;
          return (
            <line
              key={deg}
              x1={26 + 14 * Math.cos(a)}
              y1={44 + 14 * Math.sin(a)}
              x2={26 + 19 * Math.cos(a)}
              y2={44 + 19 * Math.sin(a)}
              stroke={RAY_COLOR}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          );
        })}
        <text x="26" y="80" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#b07800">
          {k('light')}
        </text>

        {/* ── Eye ── */}
        <circle cx={EYE.cx} cy={EYE.cy} r={EYE.r} fill="#ffffff" stroke="#999" strokeWidth="1.5" />
        {/* cornea bulge */}
        <path d="M108,50 Q96,72 108,94" fill="#ffffff" stroke="#999" strokeWidth="1.5" />
        {/* retina along the back of the eye */}
        <path
          d={`M${EYE.cx + EYE.r * Math.cos(-Math.PI / 3)},${EYE.cy + EYE.r * Math.sin(-Math.PI / 3)} A${EYE.r},${EYE.r} 0 0 1 ${EYE.cx + EYE.r * Math.cos(Math.PI / 3)},${EYE.cy + EYE.r * Math.sin(Math.PI / 3)}`}
          fill="none"
          stroke={RETINA_COLOR}
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* optic nerve */}
        <path
          d="M193,88 Q206,108 214,128"
          fill="none"
          stroke="#c9a0dc"
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* light rays: bent by the lens, meeting on the retina */}
        <polyline
          points={`44,38 ${LENS.cx},56 ${FOCUS.x},${FOCUS.y}`}
          fill="none"
          stroke={RAY_COLOR}
          strokeWidth="2"
        />
        <polyline
          points={`44,52 ${LENS.cx},88 ${FOCUS.x},${FOCUS.y}`}
          fill="none"
          stroke={RAY_COLOR}
          strokeWidth="2"
        />

        {/* lens (drawn over the rays) */}
        <ellipse
          cx={LENS.cx}
          cy={LENS.cy}
          rx="7"
          ry="19"
          fill="#cfe6ff"
          stroke="#6a9fd8"
          strokeWidth="1.2"
          opacity="0.95"
        />

        {/* labels */}
        <text x={LENS.cx} y="20" textAnchor="middle" fontSize="13" fill="#3b6fb0">
          {k('lens')}
        </text>
        <line x1={LENS.cx} y1="24" x2={LENS.cx} y2="50" stroke="#6a9fd8" strokeWidth="1" />
        <text x="226" y="22" textAnchor="end" fontSize="13" fill={RETINA_COLOR}>
          {k('retina')}
        </text>
        <line x1="203" y1="26" x2="181" y2="37" stroke={RETINA_COLOR} strokeWidth="1" />
        <text x="226" y="146" textAnchor="end" fontSize="13" fill="#8a5aa8">
          {k('toBrain')}
        </text>

        {/* ── Magnified retina ── */}
        <circle
          cx={FOCUS.x - 2}
          cy={FOCUS.y}
          r="6"
          fill="none"
          stroke={RETINA_COLOR}
          strokeWidth="1.2"
        />
        <line
          x1={FOCUS.x - 6}
          y1={FOCUS.y + 5}
          x2={ZOOM.x + 4}
          y2={ZOOM.y}
          stroke={RETINA_COLOR}
          strokeWidth="0.8"
          strokeDasharray="3,3"
        />
        <line
          x1={FOCUS.x + 2}
          y1={FOCUS.y + 5}
          x2={ZOOM.x + ZOOM.w - 4}
          y2={ZOOM.y}
          stroke={RETINA_COLOR}
          strokeWidth="0.8"
          strokeDasharray="3,3"
        />
        <rect
          x={ZOOM.x}
          y={ZOOM.y}
          width={ZOOM.w}
          height={ZOOM.h}
          rx="8"
          fill="#fff6f5"
          stroke={RETINA_COLOR}
          strokeWidth="1.2"
        />
        <text
          x={ZOOM.x + ZOOM.w / 2}
          y={ZOOM.y + 18}
          textAnchor="middle"
          fontSize="13"
          fontWeight="bold"
          fill="#333"
        >
          {k('photoreceptors')}
        </text>

        {/* cones: color */}
        <text x="64" y={ZOOM.y + 38} textAnchor="middle" fontSize="13" fill="#333">
          {k('cones')}
        </text>
        {CONES.map(({ label, x, fill }) => (
          <g key={label}>
            <polygon
              points={`${x - 10},${CELL_BOTTOM} ${x + 10},${CELL_BOTTOM} ${x},${CELL_TOP}`}
              fill={fill}
            />
            <text
              x={x}
              y={CELL_BOTTOM + 16}
              textAnchor="middle"
              fontSize="13"
              fontWeight="bold"
              fill={fill}
            >
              {label}
            </text>
          </g>
        ))}

        {/* rods: brightness */}
        <text x="168" y={ZOOM.y + 38} textAnchor="middle" fontSize="13" fill="#333">
          {k('rods')}
        </text>
        {RODS_X.map((x) => (
          <rect
            key={x}
            x={x - 4}
            y={CELL_TOP - 4}
            width="8"
            height={CELL_BOTTOM - CELL_TOP + 4}
            rx="4"
            fill="#9aa3ad"
          />
        ))}
      </svg>

      <p
        style={{
          margin: '8px 4px 0',
          fontSize: '19px',
          color: '#444',
          textAlign: 'center',
          lineHeight: 1.45,
        }}
      >
        {k('caption')}
      </p>
    </div>
  );
};

export default LightVisibleReason;
