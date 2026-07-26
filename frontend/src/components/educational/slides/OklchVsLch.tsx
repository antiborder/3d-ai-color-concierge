import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { lchToRgbGamutMapped, oklchToRgbGamutMapped } from '../../../utils/gamutUtils';

const HUE_STEPS = [0, 60, 120, 180, 240, 300];

function toHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((v) => Math.round(v).toString(16).padStart(2, '0'))
      .join('')
  );
}

const OklchVsLch = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.oklch_vs_lch.${key}`);

  const lchSwatches = useMemo(
    () => HUE_STEPS.map((H) => lchToRgbGamutMapped(60, 60, H)),
    []
  );

  const oklchSwatches = useMemo(
    () => HUE_STEPS.map((H) => oklchToRgbGamutMapped(0.65, 0.15, H)),
    []
  );

  const swatchW = 32;
  const swatchH = 32;
  const rowY1 = 20;
  const rowY2 = rowY1 + swatchH + 28;
  const labelX = 6;
  const swatchStartX = 62;
  const gap = 4;
  const svgW = swatchStartX + HUE_STEPS.length * (swatchW + gap) + 8;
  const svgH = rowY2 + swatchH + 20;

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
        <text
          x={labelX}
          y={rowY1 + swatchH / 2}
          fontSize="14"
          fontWeight="600"
          fill="#444"
          dominantBaseline="middle"
        >
          {k('lch_label')}
        </text>
        {lchSwatches.map(([r, g, b], i) => (
          <rect
            key={i}
            x={swatchStartX + i * (swatchW + gap)}
            y={rowY1}
            width={swatchW}
            height={swatchH}
            rx={4}
            fill={toHex(r, g, b)}
          />
        ))}

        <text
          x={labelX}
          y={rowY2 + swatchH / 2}
          fontSize="14"
          fontWeight="600"
          fill="#444"
          dominantBaseline="middle"
        >
          {k('oklch_label')}
        </text>
        {oklchSwatches.map(([r, g, b], i) => (
          <rect
            key={i}
            x={swatchStartX + i * (swatchW + gap)}
            y={rowY2}
            width={swatchW}
            height={swatchH}
            rx={4}
            fill={toHex(r, g, b)}
          />
        ))}

        {HUE_STEPS.map((H, i) => (
          <text
            key={i}
            x={swatchStartX + i * (swatchW + gap) + swatchW / 2}
            y={rowY2 + swatchH + 14}
            fontSize="11"
            fill="#888"
            textAnchor="middle"
          >
            {H}°
          </text>
        ))}
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

export default OklchVsLch;
