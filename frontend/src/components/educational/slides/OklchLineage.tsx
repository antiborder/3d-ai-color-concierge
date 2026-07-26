import { useTranslation } from 'react-i18next';

const STEPS = ['rgb', 'xyz', 'lab', 'lch', 'oklch'] as const;
type Step = (typeof STEPS)[number];

const COLORS: Record<Step, string> = {
  rgb: '#e05555',
  xyz: '#e09030',
  lab: '#6a9e3c',
  lch: '#3a8ec0',
  oklch: '#8a4fcf',
};

const YEARS: Record<Step, string> = {
  rgb: '',
  xyz: '1931',
  lab: '1976',
  lch: '1976',
  oklch: '2020',
};

const OklchLineage = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.oklch_lineage.${key}`);

  const boxH = 36;
  const boxW = 180;
  const gap = 22;
  const totalH = STEPS.length * boxH + (STEPS.length - 1) * gap;
  const svgH = totalH + 20;
  const svgW = 260;
  const startX = (svgW - boxW) / 2;

  return (
    <div style={{ padding: '12px 8px', fontFamily: 'sans-serif' }}>
      <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700, textAlign: 'center' }}>
        {k('title')}
      </h3>
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        width="100%"
        style={{ display: 'block', maxWidth: '260px', margin: '0 auto' }}
      >
        {STEPS.map((step, i) => {
          const y = 10 + i * (boxH + gap);
          const color = COLORS[step];
          const isLast = i === STEPS.length - 1;
          return (
            <g key={step}>
              {i > 0 && (
                <line
                  x1={svgW / 2}
                  y1={y - gap}
                  x2={svgW / 2}
                  y2={y}
                  stroke="#bbb"
                  strokeWidth="1.5"
                  markerEnd="url(#arr)"
                />
              )}
              <rect
                x={startX}
                y={y}
                width={boxW}
                height={boxH}
                rx={6}
                fill={color}
                opacity={isLast ? 1 : 0.75}
              />
              <text
                x={startX + 10}
                y={y + boxH / 2 - 5}
                fontSize="14"
                fontWeight="bold"
                fill="white"
                dominantBaseline="middle"
              >
                {step.toUpperCase()}
              </text>
              <text
                x={startX + 10}
                y={y + boxH / 2 + 11}
                fontSize="11"
                fill="white"
                opacity="0.9"
              >
                {k(`${step}_desc`)}
              </text>
              {YEARS[step] && (
                <text
                  x={startX + boxW - 6}
                  y={y + boxH / 2}
                  fontSize="11"
                  fill="white"
                  opacity="0.8"
                  textAnchor="end"
                  dominantBaseline="middle"
                >
                  {YEARS[step]}
                </text>
              )}
            </g>
          );
        })}
        <defs>
          <marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill="#bbb" />
          </marker>
        </defs>
      </svg>
      <p
        style={{
          margin: '10px 4px 0',
          fontSize: '14px',
          color: '#555',
          textAlign: 'center',
          lineHeight: 1.4,
        }}
      >
        {k('caption')}
      </p>
    </div>
  );
};

export default OklchLineage;
