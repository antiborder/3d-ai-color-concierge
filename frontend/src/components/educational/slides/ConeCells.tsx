import { useTranslation } from 'react-i18next';
import ConeSensitivityChart, { CONE_COLORS } from '../ConeSensitivityChart';

const X0 = 30;
const LEGEND_Y = [196, 222, 248];

const ConeCells = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.cone_cells.${key}`);

  return (
    <div style={{ padding: '12px 8px', fontFamily: 'sans-serif' }}>
      <h3 style={{ margin: '0 0 8px', fontSize: '19px', fontWeight: 700, textAlign: 'center' }}>
        {k('title')}
      </h3>

      <svg
        viewBox="0 0 230 266"
        width="100%"
        style={{
          display: 'block',
          maxWidth: '260px',
          margin: '0 auto',
          background: '#f7f8fb',
          borderRadius: '8px',
        }}
      >
        <ConeSensitivityChart
          x0={X0}
          x1={216}
          yTop={26}
          yBase={140}
          sensitivityLabel={k('sensitivity')}
          wavelengthLabel={k('wavelength')}
          idPrefix="coneCells"
        />

        {/* legend */}
        {(['L', 'M', 'S'] as const).map((cone, i) => (
          <g key={cone}>
            <polygon
              points={`${X0 - 6},${LEGEND_Y[i] + 6} ${X0 + 6},${LEGEND_Y[i] + 6} ${X0},${LEGEND_Y[i] - 10}`}
              fill={CONE_COLORS[cone]}
            />
            <text x={X0 + 16} y={LEGEND_Y[i] + 4} fontSize="13" fill="#333">
              {k(`legend_${cone}`)}
            </text>
          </g>
        ))}
      </svg>

      <p
        style={{
          margin: '8px 4px 0',
          fontSize: '19px',
          color: '#444',
          textAlign: 'center',
          lineHeight: 1.45,
          whiteSpace: 'pre-line',
        }}
      >
        {k('caption')}
      </p>
    </div>
  );
};

export default ConeCells;
