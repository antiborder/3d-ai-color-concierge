import { useTranslation } from 'react-i18next';

// L* vertical bar — height matches the a*×b* parallelogram (~70 px)
const LX = 122,
  LY = 16,
  LW = 16,
  LH = 70;
const ARR_X = LX - 6; // vertical arrow, left of bar
const L_LABEL_X = ARR_X - 6; // L* label, right-aligned here
const L_LABEL_Y = LY + LH / 2 + 5; // vertically centred with bar

// Dividing line
const DIV_Y = LY + LH + 8; // 94

// Parallelogram corners (a*×b* plane in perspective)
const BL = { x: 50, y: 174 };
const BR = { x: 192, y: 174 };
const TL = { x: 76, y: 102 };
const TR = { x: 218, y: 102 };

// Gradient anchors (userSpaceOnUse clamping)
const CX = 134,
  CY = 138;
const RIGHT_X = 205,
  LEFT_X = 63;
const FAR_X = 147,
  FAR_Y = TL.y;
const NEAR_X = 121,
  NEAR_Y = BL.y;

// a* arrow just below near edge
const AY = BL.y + 10; // 184

// b* arrow: parallel to left edge, shifted 12 px left
const BS = { x: BL.x - 12, y: BL.y }; // (38, 174)
const BE = { x: TL.x - 12, y: TL.y }; // (64, 102)
const B_ANGLE = 20;
const B_LABEL_Y = (BS.y + BE.y) / 2; // 138

const POLY = `${BL.x},${BL.y} ${BR.x},${BR.y} ${TR.x},${TR.y} ${TL.x},${TL.y}`;

const LabSpace = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.lab_space.${key}`);

  return (
    <div style={{ padding: '12px 8px', fontFamily: 'sans-serif' }}>
      <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700, textAlign: 'center' }}>
        {k('title')}
      </h3>
      <svg
        viewBox="0 0 230 220"
        width="100%"
        style={{
          display: 'block',
          maxWidth: '260px',
          margin: '0 auto',
          background: '#f4f4f6',
          borderRadius: '8px',
        }}
      >
        <defs>
          <linearGradient id="labLGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="white" />
            <stop offset="100%" stopColor="black" />
          </linearGradient>
          <clipPath id="labClip">
            <polygon points={POLY} />
          </clipPath>
          <linearGradient
            id="labRed"
            x1={CX}
            y1={CY}
            x2={RIGHT_X}
            y2={CY}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#cc3030" stopOpacity="0" />
            <stop offset="100%" stopColor="#cc3030" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient
            id="labGreen"
            x1={CX}
            y1={CY}
            x2={LEFT_X}
            y2={CY}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#22aa44" stopOpacity="0" />
            <stop offset="100%" stopColor="#22aa44" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient
            id="labYellow"
            x1={CX}
            y1={CY}
            x2={FAR_X}
            y2={FAR_Y}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#c8a800" stopOpacity="0" />
            <stop offset="100%" stopColor="#c8a800" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient
            id="labBlue"
            x1={CX}
            y1={CY}
            x2={NEAR_X}
            y2={NEAR_Y}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#2244cc" stopOpacity="0" />
            <stop offset="100%" stopColor="#2244cc" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* ── L* vertical bar with arrow and label ── */}

        {/* L* label to the left of the arrow */}
        <text x={L_LABEL_X} y={L_LABEL_Y} textAnchor="end" fontFamily="sans-serif" fill="#444">
          <tspan fontSize="16" fontWeight="bold">
            L
          </tspan>
          <tspan fontSize="11">*</tspan>
        </text>

        {/* Vertical arrow (pointing up = brighter) */}
        <line
          x1={ARR_X}
          y1={LY + LH}
          x2={ARR_X}
          y2={LY + 2}
          stroke="#555"
          strokeWidth="1.5"
        />
        <polygon
          points={`${ARR_X},${LY - 5} ${ARR_X - 4},${LY + 4} ${ARR_X + 4},${LY + 4}`}
          fill="#555"
        />

        {/* Vertical bar (white top → black bottom) */}
        <rect x={LX} y={LY} width={LW} height={LH} fill="url(#labLGrad)" rx="1" />
        <rect
          x={LX}
          y={LY}
          width={LW}
          height={LH}
          fill="none"
          stroke="#bbb"
          strokeWidth="0.8"
          rx="1"
        />
        <text x={LX + LW + 4} y={LY + 12} fontSize="9" fontFamily="sans-serif" fill="#888">
          {k('white')}
        </text>
        <text x={LX + LW + 4} y={LY + LH - 2} fontSize="9" fontFamily="sans-serif" fill="#888">
          {k('black')}
        </text>

        {/* ── Dividing line ── */}
        <line x1={10} y1={DIV_Y} x2={220} y2={DIV_Y} stroke="#ccc" strokeWidth="0.8" />

        {/* ── a*×b* parallelogram ── */}
        <g clipPath="url(#labClip)">
          <rect x={BL.x} y={TL.y} width={TR.x - BL.x} height={BL.y - TL.y} fill="white" />
          <rect
            x={BL.x}
            y={TL.y}
            width={TR.x - BL.x}
            height={BL.y - TL.y}
            fill="url(#labRed)"
          />
          <rect
            x={BL.x}
            y={TL.y}
            width={TR.x - BL.x}
            height={BL.y - TL.y}
            fill="url(#labGreen)"
          />
          <rect
            x={BL.x}
            y={TL.y}
            width={TR.x - BL.x}
            height={BL.y - TL.y}
            fill="url(#labYellow)"
          />
          <rect
            x={BL.x}
            y={TL.y}
            width={TR.x - BL.x}
            height={BL.y - TL.y}
            fill="url(#labBlue)"
          />
        </g>
        <polygon points={POLY} fill="none" stroke="#bbb" strokeWidth="0.8" />

        {/* ── a* axis arrow (along near edge, green → red) ── */}
        <line x1={BL.x} y1={AY} x2={BR.x - 2} y2={AY} stroke="#555" strokeWidth="1.5" />
        <polygon
          points={`${BR.x + 5},${AY} ${BR.x - 2},${AY - 4} ${BR.x - 2},${AY + 4}`}
          fill="#555"
        />
        <text
          x={44}
          y={AY + 13}
          fontSize="11"
          fontFamily="sans-serif"
          fill="#22aa44"
          textAnchor="end"
        >
          Green
        </text>
        <text
          x={200}
          y={AY + 13}
          fontSize="11"
          fontFamily="sans-serif"
          fill="#cc3030"
          textAnchor="start"
        >
          Red
        </text>
        <text
          x={(BL.x + BR.x) / 2}
          y={AY + 28}
          textAnchor="middle"
          fontFamily="sans-serif"
          fill="#444"
        >
          <tspan fontSize="16" fontWeight="bold">
            a
          </tspan>
          <tspan fontSize="11">*</tspan>
        </text>

        {/* ── b* axis arrow (along left edge, blue → yellow) ── */}
        <line x1={BS.x} y1={BS.y} x2={BE.x} y2={BE.y} stroke="#555" strokeWidth="1.5" />
        <polygon
          points="0,-6 -4,0 4,0"
          transform={`translate(${BE.x},${BE.y}) rotate(${B_ANGLE})`}
          fill="#555"
        />
        {/* b* label: upright, left of arrow */}
        <text x={26} y={B_LABEL_Y + 5} textAnchor="end" fontFamily="sans-serif" fill="#444">
          <tspan fontSize="16" fontWeight="bold">
            b
          </tspan>
          <tspan fontSize="11">*</tspan>
        </text>
        {/* Blue near end, Yellow far end — both below the dividing line */}
        <text
          x={28}
          y={BS.y + 3}
          fontSize="11"
          fontFamily="sans-serif"
          fill="#2244cc"
          textAnchor="end"
        >
          Blue
        </text>
        <text
          x={52}
          y={BE.y + 16}
          fontSize="11"
          fontFamily="sans-serif"
          fill="#a89000"
          textAnchor="end"
        >
          Yellow
        </text>
      </svg>
    </div>
  );
};

export default LabSpace;
