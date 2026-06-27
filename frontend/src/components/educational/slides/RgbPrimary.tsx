import { useTranslation } from 'react-i18next';

const COLOR_BADGE: Record<string, { bg: string; textColor: string }> = {
  red:     { bg: '#FF0000', textColor: '#000' }, // contrast 5.25:1 (black > white on red)
  green:   { bg: '#00FF00', textColor: '#000' }, // contrast 15.3:1
  blue:    { bg: '#0000FF', textColor: '#fff' }, // contrast  8.6:1
  yellow:  { bg: '#FFFF00', textColor: '#000' }, // contrast 19.6:1
  magenta: { bg: '#FF00FF', textColor: '#000' }, // contrast  6.7:1
  cyan:    { bg: '#00FFFF', textColor: '#000' }, // contrast 16.5:1
  white:   { bg: '#FFFFFF', textColor: '#000' }, // contrast 21.0:1
};

const FORMULAS: string[][] = [
  ['red', '+', 'green', '=', 'yellow'],
  ['red', '+', 'blue', '=', 'magenta'],
  ['green', '+', 'blue', '=', 'cyan'],
  ['red', '+', 'green', '+', 'blue', '=', 'white'],
];

const RgbPrimary = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.rgb_primary.${key}`);

  return (
    <div style={{ padding: '16px 8px', fontFamily: 'sans-serif' }}>
      <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, textAlign: 'center' }}>
        {k('title')}
      </h3>
      <svg
        viewBox="0 0 210 198"
        width="100%"
        style={{ display: 'block', maxWidth: '260px', margin: '0 auto', background: '#111', borderRadius: '8px' }}
      >
        <circle cx="105" cy="75" r="52" fill="red" style={{ mixBlendMode: 'screen' }} />
        <circle cx="75" cy="132" r="52" fill="lime" style={{ mixBlendMode: 'screen' }} />
        <circle cx="135" cy="132" r="52" fill="blue" style={{ mixBlendMode: 'screen' }} />

        <text x="105" y="22" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold"
          stroke="#000" strokeWidth="2" paintOrder="stroke">{k('red')}</text>
        <text x="30" y="186" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold"
          stroke="#000" strokeWidth="2" paintOrder="stroke">{k('green')}</text>
        <text x="180" y="186" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold"
          stroke="#000" strokeWidth="2" paintOrder="stroke">{k('blue')}</text>

        <text x="78" y="88" textAnchor="middle" fill="white" fontSize="14"
          stroke="#000" strokeWidth="2" paintOrder="stroke">{k('yellow')}</text>
        <text x="135" y="102" textAnchor="middle" fill="white" fontSize="14"
          stroke="#000" strokeWidth="2" paintOrder="stroke">{k('magenta')}</text>
        <text x="105" y="158" textAnchor="middle" fill="white" fontSize="14"
          stroke="#000" strokeWidth="2" paintOrder="stroke">{k('cyan')}</text>
        <text x="105" y="124" textAnchor="middle" fill="white" fontSize="14"
          stroke="#000" strokeWidth="2" paintOrder="stroke">{k('white')}</text>
      </svg>
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

export default RgbPrimary;
