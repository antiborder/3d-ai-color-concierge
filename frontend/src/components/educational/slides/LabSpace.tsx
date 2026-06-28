import { useTranslation } from 'react-i18next';

const SX = 48, SY = 56, SW = 140, SH = 140;
const AX = SX + SW / 2;  // 118 — a*=0, center x
const AY = SY + SH / 2;  // 126 — b*=0, center y

const L_BAR_Y = 22, L_BAR_H = 20;

const A_ARR_Y   = SY + SH + 6;
const A_LABEL_Y = SY + SH + 22;
const B_ARR_X   = SX - 6;
const B_LABEL_X = SX - 22;
const B_LABEL_Y = AY;

const LabSpace = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.lab_space.${key}`);

  return (
    <div style={{ padding: '12px 8px', fontFamily: 'sans-serif' }}>
      <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700, textAlign: 'center' }}>
        {k('title')}
      </h3>
      <svg
        viewBox="0 0 230 226"
        width="100%"
        style={{ display: 'block', maxWidth: '260px', margin: '0 auto', background: '#f4f4f6', borderRadius: '8px' }}
      >
        <defs>
          {/* L* bar: black → white */}
          <linearGradient id="labLightGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="black" />
            <stop offset="100%" stopColor="white" />
          </linearGradient>

          {/* a*×b* plane: 4 directional overlays, each clamped to their half via userSpaceOnUse */}
          <linearGradient id="labRed" x1={AX} y1={AY} x2={SX + SW} y2={AY} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#cc3030" stopOpacity="0" />
            <stop offset="100%" stopColor="#cc3030" stopOpacity="0.78" />
          </linearGradient>
          <linearGradient id="labGreen" x1={AX} y1={AY} x2={SX} y2={AY} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#22aa44" stopOpacity="0" />
            <stop offset="100%" stopColor="#22aa44" stopOpacity="0.78" />
          </linearGradient>
          <linearGradient id="labYellow" x1={AX} y1={AY} x2={AX} y2={SY} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#c8a800" stopOpacity="0" />
            <stop offset="100%" stopColor="#c8a800" stopOpacity="0.78" />
          </linearGradient>
          <linearGradient id="labBlue" x1={AX} y1={AY} x2={AX} y2={SY + SH} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2244cc" stopOpacity="0" />
            <stop offset="100%" stopColor="#2244cc" stopOpacity="0.78" />
          </linearGradient>
        </defs>

        {/* ── L* lightness bar ── */}
        <text x={SX + SW / 2} y={16} textAnchor="middle" fontFamily="sans-serif" fill="#444">
          <tspan fontSize="16" fontWeight="bold">L</tspan>
          <tspan fontSize="11">*ightness</tspan>
        </text>
        <rect x={SX} y={L_BAR_Y} width={SW} height={L_BAR_H} fill="url(#labLightGrad)" />
        <rect x={SX} y={L_BAR_Y} width={SW} height={L_BAR_H} fill="none" stroke="#bbb" strokeWidth="0.8" />
        <text x={SX + 5} y={L_BAR_Y + 13} fontSize="10" fontFamily="sans-serif" fill="rgba(255,255,255,0.85)">{k('black')}</text>
        <text x={SX + SW - 5} y={L_BAR_Y + 13} fontSize="10" fontFamily="sans-serif" fill="#666" textAnchor="end">{k('white')}</text>

        {/* ── a*×b* plane ── */}
        <rect x={SX} y={SY} width={SW} height={SH} fill="white" />
        <rect x={SX} y={SY} width={SW} height={SH} fill="url(#labRed)" />
        <rect x={SX} y={SY} width={SW} height={SH} fill="url(#labGreen)" />
        <rect x={SX} y={SY} width={SW} height={SH} fill="url(#labYellow)" />
        <rect x={SX} y={SY} width={SW} height={SH} fill="url(#labBlue)" />
        <rect x={SX} y={SY} width={SW} height={SH} fill="none" stroke="#bbb" strokeWidth="0.8" />

        {/* Center neutral point (a*=0, b*=0) */}
        <circle cx={AX} cy={AY} r="4" fill="#aaa" stroke="white" strokeWidth="1" />

        {/* ── a* axis arrow (bottom, left→right) ── */}
        <line x1={SX} y1={A_ARR_Y} x2={SX + SW - 2} y2={A_ARR_Y} stroke="#555" strokeWidth="1.5" />
        <polygon
          points={`${SX + SW + 5},${A_ARR_Y} ${SX + SW - 2},${A_ARR_Y - 4} ${SX + SW - 2},${A_ARR_Y + 4}`}
          fill="#555"
        />
        <text x={SX + SW / 2} y={A_LABEL_Y} textAnchor="middle" fontFamily="sans-serif" fill="#444">
          <tspan fontSize="16" fontWeight="bold">a</tspan>
          <tspan fontSize="11">*</tspan>
        </text>

        {/* ── b* axis arrow (left side, bottom→top) ── */}
        <line x1={B_ARR_X} y1={SY + SH} x2={B_ARR_X} y2={SY + 2} stroke="#555" strokeWidth="1.5" />
        <polygon
          points={`${B_ARR_X},${SY - 5} ${B_ARR_X - 4},${SY + 4} ${B_ARR_X + 4},${SY + 4}`}
          fill="#555"
        />
        <text
          x={B_LABEL_X}
          y={B_LABEL_Y}
          textAnchor="middle"
          fontFamily="sans-serif"
          fill="#444"
          transform={`rotate(-90, ${B_LABEL_X}, ${B_LABEL_Y})`}
        >
          <tspan fontSize="16" fontWeight="bold">b</tspan>
          <tspan fontSize="11">*</tspan>
        </text>
      </svg>
    </div>
  );
};

export default LabSpace;
