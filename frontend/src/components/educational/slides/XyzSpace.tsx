import { useTranslation } from 'react-i18next';

// Isometric projection: origin (115, 190), X unit (+50,+29), Z unit (-50,+29), Y unit (0,-75)
const p = (x: number, z: number, y: number) =>
  `${(115 + x * 50 - z * 50).toFixed(1)},${(190 + x * 29 + z * 29 - y * 75).toFixed(1)}`;

// Numeric version for positioning text/arrows
const pn = (x: number, z: number, y: number): [number, number] => [
  115 + x * 50 - z * 50,
  190 + x * 29 + z * 29 - y * 75,
];

const XyzSpace = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.xyz_space.${key}`);

  // Outer box corners (visible gamut, full unit cube)
  const O = {
    bn: p(0,0,0), bx: p(1,0,0), bxz: p(1,1,0), bz: p(0,1,0),
    tn: p(0,0,1), tx: p(1,0,1), txz: p(1,1,1), tz: p(0,1,1),
  };

  // Inner box corners (sRGB, ~0.55 scale, slightly inset from near corner)
  const s = 0.55, si = 0.08, sy = 0.56;
  const I = {
    bn: p(si,si,0), bx: p(s,si,0), bxz: p(s,s,0), bz: p(si,s,0),
    tn: p(si,si,sy), tx: p(s,si,sy), txz: p(s,s,sy), tz: p(si,s,sy),
  };

  // Numeric positions for labels
  const labelVisible = pn(1, 0, 1);   // top-X corner of outer box
  const labelSrgb    = pn(si, si, sy); // top-near corner of inner box
  const labelGap     = pn(0.8, 0.06, 0.28); // in the gap between boxes on right face

  // Y axis
  const [ax, ay] = pn(0, 0, 0);
  const tipY = ay - 88;

  return (
    <div style={{ padding: '12px 8px', fontFamily: 'sans-serif' }}>
      <h3 style={{ margin: '0 0 10px', fontSize: '16px', fontWeight: 700, textAlign: 'center' }}>
        {k('title')}
      </h3>

      <svg
        viewBox="0 0 230 265"
        width="100%"
        style={{ display: 'block', maxWidth: '260px', margin: '0 auto', background: '#0d1117', borderRadius: '8px' }}
      >
        {/* ── Outer box back edges (dashed) ── */}
        <line x1={pn(1,0,0)[0]} y1={pn(1,0,0)[1]} x2={pn(1,1,0)[0]} y2={pn(1,1,0)[1]}
          stroke="rgba(100,180,255,0.28)" strokeWidth="1" strokeDasharray="3,3"/>
        <line x1={pn(0,1,0)[0]} y1={pn(0,1,0)[1]} x2={pn(1,1,0)[0]} y2={pn(1,1,0)[1]}
          stroke="rgba(100,180,255,0.28)" strokeWidth="1" strokeDasharray="3,3"/>
        <line x1={pn(1,1,1)[0]} y1={pn(1,1,1)[1]} x2={pn(1,1,0)[0]} y2={pn(1,1,0)[1]}
          stroke="rgba(100,180,255,0.28)" strokeWidth="1" strokeDasharray="3,3"/>

        {/* ── Outer box visible faces (visible gamut) ── */}
        <polygon points={`${O.bn} ${O.bx} ${O.tx} ${O.tn}`}
          fill="rgba(80,150,220,0.18)" stroke="rgba(100,180,255,0.60)" strokeWidth="1"/>
        <polygon points={`${O.bn} ${O.bz} ${O.tz} ${O.tn}`}
          fill="rgba(60,120,190,0.18)" stroke="rgba(100,180,255,0.60)" strokeWidth="1"/>
        <polygon points={`${O.tn} ${O.tx} ${O.txz} ${O.tz}`}
          fill="rgba(120,190,255,0.14)" stroke="rgba(100,180,255,0.60)" strokeWidth="1"/>

        {/* ── Inner box back edges (dashed) ── */}
        <line x1={pn(s,si,0)[0]} y1={pn(s,si,0)[1]} x2={pn(s,s,0)[0]} y2={pn(s,s,0)[1]}
          stroke="rgba(255,255,255,0.35)" strokeWidth="1" strokeDasharray="2,2"/>
        <line x1={pn(si,s,0)[0]} y1={pn(si,s,0)[1]} x2={pn(s,s,0)[0]} y2={pn(s,s,0)[1]}
          stroke="rgba(255,255,255,0.35)" strokeWidth="1" strokeDasharray="2,2"/>
        <line x1={pn(s,s,sy)[0]} y1={pn(s,s,sy)[1]} x2={pn(s,s,0)[0]} y2={pn(s,s,0)[1]}
          stroke="rgba(255,255,255,0.35)" strokeWidth="1" strokeDasharray="2,2"/>

        {/* ── Inner box visible faces (sRGB) ── */}
        <polygon points={`${I.bn} ${I.bx} ${I.tx} ${I.tn}`}
          fill="rgba(255,255,255,0.16)" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5"/>
        <polygon points={`${I.bn} ${I.bz} ${I.tz} ${I.tn}`}
          fill="rgba(200,220,255,0.12)" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5"/>
        <polygon points={`${I.tn} ${I.tx} ${I.txz} ${I.tz}`}
          fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5"/>

        {/* ── Y axis (luminance, gold) ── */}
        <line x1={ax} y1={ay} x2={ax} y2={tipY + 6}
          stroke="rgba(255,215,60,0.90)" strokeWidth="2"/>
        <polygon points={`${ax},${tipY} ${ax-4},${tipY+9} ${ax+4},${tipY+9}`}
          fill="rgba(255,215,60,0.90)"/>

        {/* ── X axis ── */}
        <line x1={ax} y1={ay} x2={pn(1.1,0,0)[0]} y2={pn(1.1,0,0)[1]}
          stroke="rgba(200,200,200,0.65)" strokeWidth="1.5"/>

        {/* ── Z axis ── */}
        <line x1={ax} y1={ay} x2={pn(0,1.1,0)[0]} y2={pn(0,1.1,0)[1]}
          stroke="rgba(200,200,200,0.65)" strokeWidth="1.5"/>

        {/* ── Axis labels ── */}
        <text x={ax - 18} y={tipY - 2}
          fill="rgba(255,215,60,1)" fontSize="14" fontWeight="bold" fontFamily="sans-serif">Y</text>
        <text x={ax - 50} y={tipY + 36}
          fill="rgba(255,215,60,0.80)" fontSize="11" fontFamily="sans-serif">{k('luminance')}</text>

        <text x={pn(1.12,0,0)[0]} y={pn(1.12,0,0)[1] + 4}
          fill="rgba(200,200,200,0.90)" fontSize="14" fontWeight="bold" fontFamily="sans-serif">X</text>
        <text x={pn(0,1.12,0)[0] - 18} y={pn(0,1.12,0)[1] + 4}
          fill="rgba(200,200,200,0.90)" fontSize="14" fontWeight="bold" fontFamily="sans-serif">Z</text>

        {/* ── Region labels ── */}
        {/* Outer: visible gamut */}
        <text x={labelVisible[0] + 6} y={labelVisible[1] - 4}
          fill="rgba(100,180,255,0.90)" fontSize="11" fontFamily="sans-serif">{k('visible')}</text>

        {/* Inner: sRGB */}
        <text x={labelSrgb[0]} y={labelSrgb[1] - 7}
          fill="rgba(255,255,255,0.95)" fontSize="11" fontWeight="bold"
          fontFamily="sans-serif" textAnchor="middle">sRGB</text>

        {/* Gap: out-of-display annotation */}
        <text x={labelGap[0] + 4} y={labelGap[1] - 6}
          fill="rgba(100,180,255,0.72)" fontSize="10" fontFamily="sans-serif">{k('outOfDisplay')}</text>
      </svg>

      <div style={{ marginTop: '12px', fontSize: '14px', lineHeight: 1.6, color: '#333' }}>
        <p style={{ margin: '0 0 6px' }}>{k('desc1')}</p>
        <p style={{ margin: 0 }}>{k('desc2')}</p>
      </div>
    </div>
  );
};

export default XyzSpace;
