import { useTranslation } from 'react-i18next';

function hsbToHex(h: number, s: number, b: number): string {
  const i = Math.floor(h / 60) % 6;
  const f = h / 60 - Math.floor(h / 60);
  const p = b * (1 - s);
  const q = b * (1 - f * s);
  const tv = b * (1 - (1 - f) * s);
  const rgb = [
    [b, tv, p], [q, b, p], [p, b, tv],
    [p, q, b], [tv, p, b], [b, p, q],
  ][i] as [number, number, number];
  const hex = (v: number) =>
    Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0');
  return `#${hex(rgb[0])}${hex(rgb[1])}${hex(rgb[2])}`;
}

const SEGMENTS = 72;
const CX = 115, CY = 80, RO = 54, RI = 34, LABEL_R = 68;
const HUE_LABELS = [
  { h: 0,   label: 'R', fill: '#ee2222' },
  { h: 60,  label: 'Y', fill: '#ccaa00' },
  { h: 120, label: 'G', fill: '#22aa22' },
  { h: 180, label: 'C', fill: '#00aacc' },
  { h: 240, label: 'B', fill: '#3355ff' },
  { h: 300, label: 'M', fill: '#cc22cc' },
];

const SX = 48, SY = 158, SW = 140, SH = 140;
const SWATCH_HEX = hsbToHex(30, 1, 1);

// Brightness arrow: left of square, bottom→top
const B_ARR_X   = SX - 6;
const B_LABEL_X = SX - 22;
const B_LABEL_Y = SY + SH / 2;

// Saturation arrow: below square, left→right
const S_ARR_Y   = SY + SH + 6;
const S_LABEL_Y = SY + SH + 22;

const HsbSpace = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.hsb_space.${key}`);

  const wedges = Array.from({ length: SEGMENTS }, (_, i) => {
    const h = (i / SEGMENTS) * 360;
    const a1 = (h / 180) * Math.PI - Math.PI / 2;
    const a2 = ((h + 360 / SEGMENTS) / 180) * Math.PI - Math.PI / 2;
    const c = hsbToHex(h, 1, 1);
    const x1o = CX + RO * Math.cos(a1), y1o = CY + RO * Math.sin(a1);
    const x2o = CX + RO * Math.cos(a2), y2o = CY + RO * Math.sin(a2);
    const x1i = CX + RI * Math.cos(a1), y1i = CY + RI * Math.sin(a1);
    const x2i = CX + RI * Math.cos(a2), y2i = CY + RI * Math.sin(a2);
    const d = `M ${x1i.toFixed(1)} ${y1i.toFixed(1)} L ${x1o.toFixed(1)} ${y1o.toFixed(1)} A ${RO} ${RO} 0 0 1 ${x2o.toFixed(1)} ${y2o.toFixed(1)} L ${x2i.toFixed(1)} ${y2i.toFixed(1)} A ${RI} ${RI} 0 0 0 ${x1i.toFixed(1)} ${y1i.toFixed(1)} Z`;
    return <path key={i} d={d} fill={c} />;
  });

  return (
    <div style={{ padding: '12px 8px', fontFamily: 'sans-serif' }}>
      <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700, textAlign: 'center' }}>
        {k('title')}
      </h3>
      <svg
        viewBox="0 0 230 338"
        width="100%"
        style={{ display: 'block', maxWidth: '260px', margin: '0 auto', background: '#f4f4f6', borderRadius: '8px' }}
      >
        <defs>
          <linearGradient id="hsbSatGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" />
            <stop offset="100%" stopColor={SWATCH_HEX} />
          </linearGradient>
          <linearGradient id="hsbBriGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="black" stopOpacity="0" />
            <stop offset="100%" stopColor="black" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Hue wheel */}
        {wedges}
        <circle cx={CX} cy={CY} r={RI - 2} fill="#f4f4f6" />
        <text x={CX} y={CY + 6} textAnchor="middle" fontFamily="sans-serif" fill="#333">
          <tspan fontSize="16" fontWeight="bold">H</tspan>
          <tspan fontSize="11">ue</tspan>
        </text>

        {HUE_LABELS.map(({ h, label, fill }) => {
          const a = (h / 180) * Math.PI - Math.PI / 2;
          return (
            <text
              key={h}
              x={(CX + LABEL_R * Math.cos(a)).toFixed(1)}
              y={(CY + LABEL_R * Math.sin(a)).toFixed(1)}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="13"
              fontWeight="bold"
              fontFamily="sans-serif"
              fill={fill}
            >
              {label}
            </text>
          );
        })}

        {/* S×B square */}
        <rect x={SX} y={SY} width={SW} height={SH} fill="url(#hsbSatGrad)" />
        <rect x={SX} y={SY} width={SW} height={SH} fill="url(#hsbBriGrad)" />
        <rect x={SX} y={SY} width={SW} height={SH} fill="none" stroke="#bbb" strokeWidth="0.8" />

        {/* Corner labels */}
        <text x={SX + 5} y={SY + 14} fontSize="11" fontFamily="sans-serif" fill="#555">{k('white')}</text>
        <text x={SX + 5} y={SY + SH - 5} fontSize="11" fontFamily="sans-serif" fill="#999">{k('black')}</text>

        {/* ── Brightness arrow (left side, bottom→top) ── */}
        <line
          x1={B_ARR_X} y1={SY + SH}
          x2={B_ARR_X} y2={SY + 2}
          stroke="#555" strokeWidth="1.5"
        />
        {/* arrowhead pointing up */}
        <polygon
          points={`${B_ARR_X},${SY - 5} ${B_ARR_X - 4},${SY + 4} ${B_ARR_X + 4},${SY + 4}`}
          fill="#555"
        />
        {/* "Brightness" label, rotated -90° */}
        <text
          x={B_LABEL_X}
          y={B_LABEL_Y}
          textAnchor="middle"
          fontFamily="sans-serif"
          fill="#444"
          transform={`rotate(-90, ${B_LABEL_X}, ${B_LABEL_Y})`}
        >
          <tspan fontSize="16" fontWeight="bold">B</tspan>
          <tspan fontSize="11">rightness</tspan>
        </text>

        {/* ── Saturation arrow (bottom side, left→right) ── */}
        <line
          x1={SX} y1={S_ARR_Y}
          x2={SX + SW - 2} y2={S_ARR_Y}
          stroke="#555" strokeWidth="1.5"
        />
        {/* arrowhead pointing right */}
        <polygon
          points={`${SX + SW + 5},${S_ARR_Y} ${SX + SW - 2},${S_ARR_Y - 4} ${SX + SW - 2},${S_ARR_Y + 4}`}
          fill="#555"
        />
        {/* "Saturation" label */}
        <text
          x={SX + SW / 2}
          y={S_LABEL_Y}
          textAnchor="middle"
          fontFamily="sans-serif"
          fill="#444"
        >
          <tspan fontSize="16" fontWeight="bold">S</tspan>
          <tspan fontSize="11">aturation</tspan>
        </text>
      </svg>
    </div>
  );
};

export default HsbSpace;
