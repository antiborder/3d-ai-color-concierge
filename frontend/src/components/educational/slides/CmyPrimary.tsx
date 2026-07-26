import { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const W = 210;
const H = 198;

const LABELS = [
  { key: 'cyan',    x: 105 / W, y: 22  / H, dark: false, bold: true  },
  { key: 'magenta', x: 30  / W, y: 186 / H, dark: false, bold: true  },
  { key: 'yellow',  x: 180 / W, y: 186 / H, dark: false, bold: true  },
  { key: 'blue',    x: 78  / W, y: 88  / H, dark: true,  bold: false },
  { key: 'green',   x: 135 / W, y: 102 / H, dark: false, bold: false },
  { key: 'red',     x: 105 / W, y: 158 / H, dark: true,  bold: false },
  { key: 'black',   x: 105 / W, y: 124 / H, dark: true,  bold: false },
] as const;

// Background and text color for each color badge.
// Text color chosen for highest WCAG contrast ratio against the background.
const COLOR_BADGE: Record<string, { bg: string; textColor: string }> = {
  cyan:    { bg: '#00ffff', textColor: '#000' }, // contrast 16.5:1
  magenta: { bg: '#ff00ff', textColor: '#000' }, // contrast  6.7:1
  yellow:  { bg: '#ffff00', textColor: '#000' }, // contrast 19.6:1
  blue:    { bg: '#0000ff', textColor: '#fff' }, // contrast  8.6:1
  green:   { bg: '#00ff00', textColor: '#000' }, // contrast 15.3:1
  red:     { bg: '#ff0000', textColor: '#000' }, // contrast  5.3:1 (black > white on red)
  black:   { bg: '#000000', textColor: '#fff' }, // contrast 21.0:1
};

// Formula rows expressed as arrays of color keys (for badges) and operator strings.
const FORMULAS: string[][] = [
  ['cyan', '+', 'magenta', '=', 'blue'],
  ['cyan', '+', 'yellow',  '=', 'green'],
  ['magenta', '+', 'yellow', '=', 'red'],
  ['cyan', '+', 'magenta', '+', 'yellow', '=', 'black'],
];

const CmyPrimary = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.cmy_primary.${key}`);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, W, H);

    ctx.globalCompositeOperation = 'multiply';

    ctx.fillStyle = 'cyan';
    ctx.beginPath();
    ctx.arc(105, 75, 52, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = 'magenta';
    ctx.beginPath();
    ctx.arc(75, 132, 52, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = 'yellow';
    ctx.beginPath();
    ctx.arc(135, 132, 52, 0, 2 * Math.PI);
    ctx.fill();
  }, []);

  return (
    <div style={{ padding: '16px 8px', fontFamily: 'sans-serif' }}>
      <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, textAlign: 'center' }}>
        {k('title')}
      </h3>
      <div
        style={{
          position: 'relative',
          maxWidth: '260px',
          margin: '0 auto',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid #e0e0e0',
        }}
      >
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          style={{ display: 'block', width: '100%' }}
        />
        {LABELS.map(({ key, x, y, dark, bold }) => (
          <span
            key={key}
            style={{
              position: 'absolute',
              left: `${x * 100}%`,
              top: `${y * 100}%`,
              transform: 'translate(-50%, -50%)',
              fontSize: '14px',
              fontWeight: bold ? 700 : 400,
              color: dark ? 'white' : '#111',
              textShadow: dark
                ? '1px 1px 0 #444, -1px -1px 0 #444, 1px -1px 0 #444, -1px 1px 0 #444'
                : '1px 1px 0 white, -1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            {k(key)}
          </span>
        ))}
      </div>
      <div style={{ marginTop: '12px' }}>
        {FORMULAS.map((tokens, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '4px',
              marginBottom: '6px',
            }}
          >
            {tokens.map((token, j) => {
              const badge = COLOR_BADGE[token];
              if (badge) {
                return (
                  <span
                    key={j}
                    style={{
                      background: badge.bg,
                      color: badge.textColor,
                      padding: '2px 4px',
                      borderRadius: '4px',
                      fontSize: '14px',
                      fontWeight: 500,
                      border: '1px solid rgba(0,0,0,0.15)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {k(token)}
                  </span>
                );
              }
              return (
                <span key={j} style={{ fontSize: '14px', color: '#888' }}>
                  {token}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CmyPrimary;
