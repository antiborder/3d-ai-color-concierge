import { useTranslation } from 'react-i18next';

// Layout constants
const SVG_W = 260;
const BOX_W = 108;
const BOX_H = 34;
const CX = SVG_W / 2;  // 130 — center x for RGB and XYZ
const LX = 62;         // left branch center x (Lab, LCH)
const RX = 198;        // right branch center x (LMS, OkLab, OkLCH)

// Vertical positions (top of box)
const Y_RGB  = 8;
const Y_XYZ  = Y_RGB  + BOX_H + 16;
const Y_FORK = Y_XYZ  + BOX_H + 16;  // Lab and LMS on same row
const Y_ROW3 = Y_FORK + BOX_H + 16;  // LCH and OkLab on same row
const Y_ROW4 = Y_ROW3 + BOX_H + 16;  // OkLCH
const SVG_H  = Y_ROW4 + BOX_H + 28;  // + caption space

const COLORS = {
  rgb:   '#e05555',
  xyz:   '#e09030',
  lab:   '#6a9e3c',
  lch:   '#3a8ec0',
  lms:   '#c070c0',
  oklab: '#a04fd0',
  oklch: '#6a30b0',
};

const YEARS: Record<string, string> = {
  xyz: '1931', lab: '1976', lch: '1976', lms: '—', oklab: '2020', oklch: '2020',
};

function Box({
  x, y, label, sublabel, color, year, bold,
}: {
  x: number; y: number; label: string; sublabel: string;
  color: string; year?: string; bold?: boolean;
}) {
  return (
    <g>
      <rect
        x={x - BOX_W / 2} y={y}
        width={BOX_W} height={BOX_H}
        rx={6} fill={color} opacity={bold ? 1 : 0.8}
      />
      <text
        x={x - BOX_W / 2 + 7} y={y + BOX_H / 2 - 5}
        fontSize="13" fontWeight="bold" fill="white" dominantBaseline="middle"
      >
        {label}
      </text>
      <text
        x={x - BOX_W / 2 + 7} y={y + BOX_H / 2 + 10}
        fontSize="10" fill="white" opacity="0.9"
      >
        {sublabel}
      </text>
      {year && (
        <text
          x={x + BOX_W / 2 - 5} y={y + BOX_H / 2}
          fontSize="10" fill="white" opacity="0.75"
          textAnchor="end" dominantBaseline="middle"
        >
          {year}
        </text>
      )}
    </g>
  );
}

function Arrow({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return (
    <line
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke="#bbb" strokeWidth="1.5"
      markerEnd="url(#arr)"
    />
  );
}

const OklchLineage = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.oklch_lineage.${key}`);

  const botXyz  = Y_XYZ  + BOX_H;
  const botFork = Y_FORK + BOX_H;
  const botRow3 = Y_ROW3 + BOX_H;

  return (
    <div style={{ padding: '10px 8px', fontFamily: 'sans-serif' }}>
      <h3 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 700, textAlign: 'center' }}>
        {k('title')}
      </h3>

      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        width="100%"
        style={{ display: 'block', maxWidth: '260px', margin: '0 auto' }}
      >
        <defs>
          <marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill="#bbb" />
          </marker>
        </defs>

        {/* RGB → XYZ */}
        <Arrow x1={CX} y1={Y_RGB + BOX_H} x2={CX} y2={Y_XYZ} />

        {/* XYZ → Lab (left) */}
        <Arrow x1={CX - 10} y1={botXyz} x2={LX + 10} y2={Y_FORK} />

        {/* XYZ → LMS (right) */}
        <Arrow x1={CX + 10} y1={botXyz} x2={RX - 10} y2={Y_FORK} />

        {/* Lab → LCH */}
        <Arrow x1={LX} y1={botFork} x2={LX} y2={Y_ROW3} />

        {/* LMS → OkLab */}
        <Arrow x1={RX} y1={botFork} x2={RX} y2={Y_ROW3} />

        {/* OkLab → OkLCH */}
        <Arrow x1={RX} y1={botRow3} x2={RX} y2={Y_ROW4} />

        {/* Boxes */}
        <Box x={CX} y={Y_RGB}  label="RGB"   sublabel={k('rgb_desc')}   color={COLORS.rgb} />
        <Box x={CX} y={Y_XYZ}  label="XYZ"   sublabel={k('xyz_desc')}   color={COLORS.xyz}   year={YEARS.xyz} />
        <Box x={LX} y={Y_FORK} label="Lab"   sublabel={k('lab_desc')}   color={COLORS.lab}   year={YEARS.lab} />
        <Box x={RX} y={Y_FORK} label="LMS"   sublabel={k('lms_desc')}   color={COLORS.lms}   year={YEARS.lms} />
        <Box x={LX} y={Y_ROW3} label="LCH"   sublabel={k('lch_desc')}   color={COLORS.lch}   year={YEARS.lch} />
        <Box x={RX} y={Y_ROW3} label="OkLab" sublabel={k('oklab_desc')} color={COLORS.oklab} year={YEARS.oklab} />
        <Box x={RX} y={Y_ROW4} label="OkLCH" sublabel={k('oklch_desc')} color={COLORS.oklch} year={YEARS.oklch} bold />
      </svg>

      <p style={{
        margin: '8px 4px 0',
        fontSize: '13px',
        color: '#555',
        textAlign: 'center',
        lineHeight: 1.4,
      }}>
        {k('caption')}
      </p>
    </div>
  );
};

export default OklchLineage;
