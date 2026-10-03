import { CONE_FUNDAMENTALS, CONE_NM_MAX, CONE_NM_MIN } from './coneFundamentals';

export const CONE_COLORS = { L: '#e5533d', M: '#3aa655', S: '#3f6fe0' } as const;
const CONE_INDEX = { L: 1, M: 2, S: 3 } as const;

// Approximate colors of the visible spectrum for the wavelength bar
export const SPECTRUM_STOPS: Array<[number, string]> = [
  [390, '#5a0090'],
  [420, '#6a00e0'],
  [450, '#2a3cff'],
  [480, '#00a8ff'],
  [510, '#00d060'],
  [560, '#c8e000'],
  [580, '#ffd800'],
  [610, '#ff7a00'],
  [650, '#ff1a00'],
  [700, '#b00000'],
];

export interface WavelengthBand {
  from: number;
  to: number;
  color: string;
  label: string;
}

interface ConeSensitivityChartProps {
  /** Plot area in the parent SVG's viewBox units (with bands, leave ~34 units above yTop) */
  x0: number;
  x1: number;
  yTop: number;
  yBase: number;
  sensitivityLabel: string;
  wavelengthLabel: string;
  bands?: WavelengthBand[];
  /** Unique prefix for SVG ids when several charts share a page */
  idPrefix: string;
}

/**
 * L/M/S cone sensitivity curves (CIE 2006) over a wavelength axis with the visible spectrum.
 * Renders an SVG <g>; the parent slide owns the <svg> and its layout.
 */
const ConeSensitivityChart = ({
  x0,
  x1,
  yTop,
  yBase,
  sensitivityLabel,
  wavelengthLabel,
  bands = [],
  idPrefix,
}: ConeSensitivityChartProps) => {
  const xOf = (nm: number) => x0 + ((nm - CONE_NM_MIN) / (CONE_NM_MAX - CONE_NM_MIN)) * (x1 - x0);
  const yOf = (v: number) => yBase - v * (yBase - yTop);
  const gradientId = `${idPrefix}-spectrum`;

  const curve = (cone: keyof typeof CONE_INDEX) =>
    'M' +
    CONE_FUNDAMENTALS.map(
      (row) => `${xOf(row[0]).toFixed(1)},${yOf(row[CONE_INDEX[cone]]).toFixed(1)}`
    ).join(' L');

  const peakNm = (cone: keyof typeof CONE_INDEX) =>
    CONE_FUNDAMENTALS.reduce((best, row) =>
      row[CONE_INDEX[cone]] > best[CONE_INDEX[cone]] ? row : best
    )[0];

  const yMid = (yBase + yTop) / 2;

  return (
    <g>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          {SPECTRUM_STOPS.map(([nm, color]) => (
            <stop
              key={nm}
              offset={`${((nm - CONE_NM_MIN) / (CONE_NM_MAX - CONE_NM_MIN)) * 100}%`}
              stopColor={color}
            />
          ))}
        </linearGradient>
      </defs>

      {/* highlighted wavelength bands (behind the curves) */}
      {bands.map((b) => (
        <g key={b.label}>
          <rect
            x={xOf(b.from)}
            y={yTop - 18}
            width={xOf(b.to) - xOf(b.from)}
            height={yBase - yTop + 18}
            fill={b.color}
            opacity="0.18"
          />
          <text
            x={(xOf(b.from) + xOf(b.to)) / 2}
            y={yTop - 22}
            textAnchor="middle"
            fontSize="13"
            fontWeight="bold"
            fill={b.color}
          >
            {b.label}
          </text>
        </g>
      ))}

      {/* axes */}
      <line x1={x0} y1={yBase} x2={x1} y2={yBase} stroke="#888" strokeWidth="1" />
      <line x1={x0} y1={yBase} x2={x0} y2={yTop - 6} stroke="#888" strokeWidth="1" />
      <text
        x={x0 - 14}
        y={yMid}
        textAnchor="middle"
        fontSize="13"
        fill="#555"
        transform={`rotate(-90, ${x0 - 14}, ${yMid})`}
      >
        {sensitivityLabel}
      </text>

      {/* cone curves, with the cone letter above each peak */}
      {(['S', 'M', 'L'] as const).map((cone) => (
        <g key={cone}>
          <path d={curve(cone)} fill="none" stroke={CONE_COLORS[cone]} strokeWidth="2.5" />
          <text
            x={xOf(peakNm(cone)) + (cone === 'M' ? -6 : cone === 'L' ? 6 : 0)}
            y={yTop - 6}
            textAnchor="middle"
            fontSize="13"
            fontWeight="bold"
            fill={CONE_COLORS[cone]}
          >
            {cone}
          </text>
        </g>
      ))}

      {/* wavelength axis with the visible spectrum */}
      <rect x={x0} y={yBase + 4} width={x1 - x0} height="8" fill={`url(#${gradientId})`} />
      {[400, 500, 600, 700].map((nm) => (
        <text key={nm} x={xOf(nm)} y={yBase + 26} textAnchor="middle" fontSize="12" fill="#666">
          {nm}
        </text>
      ))}
      <text x={x1} y={yBase + 42} textAnchor="end" fontSize="13" fill="#555">
        {wavelengthLabel}
      </text>
    </g>
  );
};

export default ConeSensitivityChart;
