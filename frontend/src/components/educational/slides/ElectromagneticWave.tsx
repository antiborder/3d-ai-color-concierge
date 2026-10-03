import { useTranslation } from 'react-i18next';
import { SPECTRUM_STOPS } from '../ConeSensitivityChart';
import { fade, draw, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/electromagnetic_wave.py).
 */
const STEP = {
  spectrum: 0, // "EM waves are waves of electric and magnetic vibrations, of many kinds by wavelength."
  bands: 1, // "From the longest: radio waves, infrared, visible light, ultraviolet, X-rays, gamma rays."
  visible: 2, // "Of these, only the narrow range of about 380–780 nm is visible: visible light."
  // (no new drawing) "Infrared, a bit longer, and ultraviolet, a bit shorter, can't be seen."
} as const;
const STEP_AT_MS = [0, 6000, 13000];
// Within the bands step, how far apart each band name appears (follows the spoken list)
const BAND_INTERVAL_MS = 1000;

// Two rounded panels: the whole EM spectrum (top) and a close-up of visible light (bottom)
const TOP_PANEL = { y: 0, height: 196 };
const BOTTOM_PANEL = { y: 204, height: 106 };

// Top: vertical spectrum bar on a log scale, long wavelengths at the top
const BAR = { x: 92, width: 12, y0: 16, y1: 184 };
const LOG_TOP = 3; // log10 of the wavelength in meters at the top of the bar (1 km)
const LOG_BOTTOM = -13; // ... and at the bottom (0.0001 nm)
const yOfLog = (log10m: number) =>
  BAR.y0 + ((LOG_TOP - log10m) / (LOG_TOP - LOG_BOTTOM)) * (BAR.y1 - BAR.y0);

const VISIBLE_NM = { min: 380, max: 780 };
const log10m = (nm: number) => Math.log10(nm * 1e-9);

/** Bands from long to short wavelength: [log10 of the wavelength in m at the long end, label y] */
const BANDS = [
  { key: 'radio', from: LOG_TOP, to: -3, labelY: 48, fill: '#c9ced8' },
  { key: 'infrared', from: -3, to: log10m(VISIBLE_NM.max), labelY: 90, fill: '#d8b4ad' },
  {
    key: 'visible',
    from: log10m(VISIBLE_NM.max),
    to: log10m(VISIBLE_NM.min),
    labelY: 110,
    fill: 'url(#emVisible)',
  },
  { key: 'ultraviolet', from: log10m(VISIBLE_NM.min), to: -8, labelY: 128, fill: '#c3b2dc' },
  { key: 'xray', from: -8, to: -11, labelY: 148, fill: '#b8c0cc' },
  { key: 'gamma', from: -11, to: LOG_BOTTOM, labelY: 172, fill: '#a9b0bc' },
] as const;
const LABEL_X = 116;

// Left of the bar: a wave whose wavelength shrinks from top to bottom
const CHIRP = { x: 62, amplitude: 9, longest: 50, shortest: 4 };
const chirpPath = () => {
  const span = BAR.y1 - BAR.y0;
  const k = Math.log(CHIRP.longest / CHIRP.shortest) / span;
  const points: string[] = [];
  for (let t = 0; t <= span; t += 0.5) {
    // phase = ∫ 2π / λ(t) dt with λ(t) = longest · e^(−k t)
    const phase = ((2 * Math.PI) / CHIRP.longest) * ((Math.exp(k * t) - 1) / k);
    points.push(
      `${(CHIRP.x + CHIRP.amplitude * Math.sin(phase)).toFixed(1)},${(BAR.y0 + t).toFixed(1)}`
    );
  }
  return 'M' + points.join(' L');
};

// Bottom: visible light from 380 to 780 nm
const VIS_BAR = { x0: 12, x1: 218, y: 234, height: 14 };
const xOfNm = (nm: number) =>
  VIS_BAR.x0 +
  ((nm - VISIBLE_NM.min) / (VISIBLE_NM.max - VISIBLE_NM.min)) * (VIS_BAR.x1 - VIS_BAR.x0);
const VIS_STOPS: Array<[number, string]> = [
  [VISIBLE_NM.min, '#3a0060'],
  ...SPECTRUM_STOPS,
  [VISIBLE_NM.max, '#400000'],
];

const ElectromagneticWave = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.electromagnetic_wave.${key}`);
  const step = useSlideStep(STEP_AT_MS);

  const gradient = (id: string, x1: string, y1: string, x2: string, y2: string) => (
    <linearGradient id={id} x1={x1} y1={y1} x2={x2} y2={y2}>
      {VIS_STOPS.map(([nm, color]) => (
        <stop
          key={nm}
          offset={`${((nm - VISIBLE_NM.min) / (VISIBLE_NM.max - VISIBLE_NM.min)) * 100}%`}
          stopColor={color}
        />
      ))}
    </linearGradient>
  );

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
        <defs>
          {/* top bar runs long → short downwards, so red is at the top of the visible slice */}
          {gradient('emVisible', '0%', '100%', '0%', '0%')}
          {gradient('emVisibleWide', '0%', '0%', '100%', '0%')}
        </defs>
        {[TOP_PANEL, BOTTOM_PANEL].map((panel) => (
          <rect
            key={panel.y}
            x="0"
            y={panel.y}
            width="230"
            height={panel.height}
            rx="8"
            fill="#f7f8fb"
          />
        ))}

        {/* ── top: the whole EM spectrum ── */}
        <g style={fade(step >= STEP.spectrum)}>
          {BANDS.map((b) => (
            <rect
              key={b.key}
              x={BAR.x}
              y={yOfLog(b.from)}
              width={BAR.width}
              height={yOfLog(b.to) - yOfLog(b.from)}
              fill={b.fill}
            />
          ))}
          <rect
            x={BAR.x}
            y={BAR.y0}
            width={BAR.width}
            height={BAR.y1 - BAR.y0}
            fill="none"
            stroke="#888"
            strokeWidth="0.8"
          />
          {/* wavelength: long at the top, short at the bottom */}
          <text x="28" y={BAR.y0 + 8} textAnchor="middle" fontSize="13" fill="#555">
            {k('long')}
          </text>
          <text x="28" y={BAR.y1} textAnchor="middle" fontSize="13" fill="#555">
            {k('short')}
          </text>
          <line x1="28" y1={BAR.y0 + 16} x2="28" y2={BAR.y1 - 16} stroke="#888" strokeWidth="1" />
          <polyline
            points={`24,${BAR.y1 - 21} 28,${BAR.y1 - 16} 32,${BAR.y1 - 21}`}
            fill="none"
            stroke="#888"
            strokeWidth="1"
          />
          <text
            x="16"
            y={(BAR.y0 + BAR.y1) / 2}
            textAnchor="middle"
            fontSize="13"
            fill="#555"
            transform={`rotate(-90, 16, ${(BAR.y0 + BAR.y1) / 2})`}
          >
            {k('wavelength')}
          </text>
        </g>
        <path
          d={chirpPath()}
          pathLength={1}
          fill="none"
          stroke="#555"
          strokeWidth="1.3"
          style={draw(step >= STEP.spectrum, 300, 2400)}
        />

        {BANDS.map((b, i) => {
          const isVisible = b.key === 'visible';
          const segmentMid = (yOfLog(b.from) + yOfLog(b.to)) / 2;
          return (
            <g key={b.key} style={fade(step >= STEP.bands, i * BAND_INTERVAL_MS)}>
              <line
                x1={BAR.x + BAR.width}
                y1={segmentMid}
                x2={LABEL_X - 3}
                y2={b.labelY - 4}
                stroke="#aaa"
                strokeWidth="0.8"
              />
              <text
                x={LABEL_X}
                y={b.labelY}
                fontSize="13"
                fontWeight={isVisible ? 'bold' : 'normal'}
                fill={isVisible ? '#d0007a' : '#444'}
              >
                {k(b.key)}
              </text>
            </g>
          );
        })}
        {/* the visible slice is tiny: ring it once it is introduced */}
        <rect
          x={BAR.x - 4}
          y={yOfLog(log10m(VISIBLE_NM.max)) - 4}
          width={BAR.width + 8}
          height={yOfLog(log10m(VISIBLE_NM.min)) - yOfLog(log10m(VISIBLE_NM.max)) + 8}
          rx="3"
          fill="none"
          stroke="#d0007a"
          strokeWidth="1.5"
          style={fade(step >= STEP.visible)}
        />

        {/* ── bottom: close-up of visible light ── */}
        <g style={fade(step >= STEP.visible, 400)}>
          <text x="12" y={BOTTOM_PANEL.y + 18} fontSize="13" fontWeight="bold" fill="#d0007a">
            {k('visibleRange')}
          </text>
          <rect
            x={VIS_BAR.x0}
            y={VIS_BAR.y}
            width={VIS_BAR.x1 - VIS_BAR.x0}
            height={VIS_BAR.height}
            fill="url(#emVisibleWide)"
          />
          {[400, 500, 600, 700].map((nm) => (
            <text
              key={nm}
              x={xOfNm(nm)}
              y={VIS_BAR.y + VIS_BAR.height + 16}
              textAnchor="middle"
              fontSize="12"
              fill="#666"
            >
              {nm}
            </text>
          ))}
          <text
            x={VIS_BAR.x1}
            y={VIS_BAR.y + VIS_BAR.height + 32}
            textAnchor="end"
            fontSize="13"
            fill="#555"
          >
            {k('nm')}
          </text>
        </g>
      </svg>
    </div>
  );
};

export default ElectromagneticWave;
