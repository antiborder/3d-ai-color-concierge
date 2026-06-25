import { useRef, useEffect, useState } from 'react';
import type { ControlPaneProps } from '../../types/controlPane';

// CIE 1931 2° standard observer spectral locus (every 10 nm, 380–700 nm)
export const LOCUS: Array<[nm: number, x: number, y: number]> = [
  [380, 0.1741, 0.0050], [390, 0.1738, 0.0049], [400, 0.1733, 0.0048],
  [410, 0.1726, 0.0048], [420, 0.1714, 0.0051], [430, 0.1689, 0.0069],
  [440, 0.1644, 0.0109], [450, 0.1566, 0.0177], [460, 0.1440, 0.0297],
  [470, 0.1241, 0.0578], [480, 0.0913, 0.1327], [490, 0.0454, 0.2950],
  [500, 0.0082, 0.5384], [510, 0.0139, 0.7502], [520, 0.0743, 0.8338],
  [530, 0.1547, 0.8059], [540, 0.2296, 0.7543], [550, 0.3016, 0.6923],
  [560, 0.3731, 0.6245], [570, 0.4441, 0.5547], [580, 0.5125, 0.4866],
  [590, 0.5752, 0.4242], [600, 0.6270, 0.3725], [610, 0.6658, 0.3340],
  [620, 0.6915, 0.3083], [630, 0.7079, 0.2920], [640, 0.7190, 0.2809],
  [650, 0.7260, 0.2740], [660, 0.7300, 0.2700], [670, 0.7320, 0.2680],
  [680, 0.7334, 0.2666], [690, 0.7344, 0.2656], [700, 0.7347, 0.2653],
];

const LOCUS_POLY: Array<[number, number]> = LOCUS.map(([, x, y]) => [x, y]);

// CIE 1931 2° CMF — X,Y,Z computed from LOCUS chromaticity + CIE photopic Y(λ)
export const CMF: Array<[nm: number, X: number, Y: number, Z: number]> = [
  [380, 0.001358, 0.000039, 0.006403],
  [390, 0.004257, 0.000120, 0.020112],
  [400, 0.014296, 0.000396, 0.067807],
  [410, 0.043510, 0.001210, 0.207360],
  [420, 0.134430, 0.004000, 0.645880],
  [430, 0.283950, 0.011600, 1.385620],
  [440, 0.346910, 0.023000, 1.740210],
  [450, 0.336190, 0.038000, 1.772850],
  [460, 0.290910, 0.060000, 1.669080],
  [470, 0.195280, 0.090980, 1.287270],
  [480, 0.095640, 0.139020, 0.813470],
  [490, 0.032010, 0.208020, 0.465140],
  [500, 0.004920, 0.323000, 0.272020],
  [510, 0.009320, 0.503000, 0.158100],
  [520, 0.063275, 0.710000, 0.078256],
  [530, 0.165680, 0.862000, 0.042130],
  [540, 0.290430, 0.954000, 0.020363],
  [550, 0.433460, 0.994950, 0.008768],
  [560, 0.594440, 0.995000, 0.003824],
  [570, 0.762200, 0.952000, 0.002059],
  [580, 0.916290, 0.870000, 0.001609],
  [590, 1.026320, 0.757000, 0.001071],
  [600, 1.062110, 0.631000, 0.000847],
  [610, 1.002680, 0.503000, 0.000301],
  [620, 0.854560, 0.381000, 0.000247],
  [630, 0.642440, 0.265000, 0.000091],
  [640, 0.447930, 0.175000, 0.000062],
  [650, 0.283510, 0.107000, 0.000000],
  [660, 0.164930, 0.061000, 0.000000],
  [670, 0.087400, 0.032000, 0.000000],
  [680, 0.046750, 0.017000, 0.000000],
  [690, 0.022700, 0.008210, 0.000000],
  [700, 0.011356, 0.004102, 0.000000],
];

// Canvas layout constants
const CW = 206, LM = 26, RM = 4, TM = 6, BM = 20;
const DW = CW - LM - RM; // diagram width in pixels
const X0 = 0, XN = 0.80, Y0 = 0, YN = 0.88;
const DH = Math.round(DW * (YN - Y0) / (XN - X0));
const CH = DH + TM + BM;

const tx = (x: number) => LM + (x - X0) / (XN - X0) * DW;
const ty = (y: number) => TM + (1 - (y - Y0) / (YN - Y0)) * DH;

function inPoly(px: number, py: number, p: Array<[number, number]>): boolean {
  let inside = false;
  const n = p.length;
  let j = n - 1;
  for (let i = 0; i < n; i++) {
    const [xi, yi] = p[i], [xj, yj] = p[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
    j = i;
  }
  return inside;
}

// xy chromaticity → sRGB [0,255] (normalized by max component so the gamut always shows color)
function xyToRGB(x: number, y: number): [number, number, number] {
  if (y <= 0) return [0, 0, 0];
  const X = x / y, Y = 1, Z = (1 - x - y) / y;
  let r =  3.2406 * X - 1.5372 * Y - 0.4986 * Z;
  let g = -0.9689 * X + 1.8758 * Y + 0.0415 * Z;
  let b =  0.0557 * X - 0.2040 * Y + 1.0570 * Z;
  r = Math.max(0, r); g = Math.max(0, g); b = Math.max(0, b);
  const m = Math.max(r, g, b, 1e-9);
  r /= m; g /= m; b /= m;
  const gc = (c: number) => c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
  return [Math.round(gc(r) * 255), Math.round(gc(g) * 255), Math.round(gc(b) * 255)];
}

function rgbToXY(r: number, g: number, b: number): [number, number] {
  const lin = (c: number) => { const s = c / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  const rl = lin(r), gl = lin(g), bl = lin(b);
  const X = 0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl;
  const Yv = 0.2126729 * rl + 0.7151522 * gl + 0.0721750 * bl;
  const Z = 0.0193339 * rl + 0.1191920 * gl + 0.9503041 * bl;
  const s = X + Yv + Z;
  return s < 1e-10 ? [0.3127, 0.3290] : [X / s, Yv / s];
}

type Props = Pick<ControlPaneProps, 'focusR' | 'focusG' | 'focusB'>;

const CIExyDiagram = ({ focusR, focusG, focusB }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgRef = useRef<ImageData | null>(null);

  const [cx, cy] = rgbToXY(focusR, focusG, focusB);

  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Build horseshoe background once (expensive pixel loop)
    if (!bgRef.current) {
      const img = ctx.createImageData(CW, CH);
      const d = img.data;
      for (let py = TM; py < TM + DH; py++) {
        for (let px = LM; px < LM + DW; px++) {
          const x = X0 + (px - LM) / DW * (XN - X0);
          const y = Y0 + (1 - (py - TM) / DH) * (YN - Y0);
          if (inPoly(x, y, LOCUS_POLY)) {
            const [rr, gg, bb] = xyToRGB(x, y);
            const i = (py * CW + px) * 4;
            d[i] = rr; d[i + 1] = gg; d[i + 2] = bb; d[i + 3] = 255;
          }
        }
      }
      bgRef.current = img;
    }

    ctx.clearRect(0, 0, CW, CH);
    ctx.putImageData(bgRef.current, 0, 0);

    // Spectral locus outline + purple line closure
    ctx.beginPath();
    LOCUS.forEach(([, x, y], i) => (i === 0 ? ctx.moveTo(tx(x), ty(y)) : ctx.lineTo(tx(x), ty(y))));
    ctx.closePath();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Axes
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(LM, TM + DH); ctx.lineTo(LM + DW, TM + DH);
    ctx.moveTo(LM, TM); ctx.lineTo(LM, TM + DH);
    ctx.stroke();

    ctx.fillStyle = '#666';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    [0.0, 0.2, 0.4, 0.6, 0.8].forEach(v => ctx.fillText(v.toFixed(1), tx(v), CH - 5));
    ctx.textAlign = 'right';
    [0.0, 0.2, 0.4, 0.6, 0.8].forEach(v => ctx.fillText(v.toFixed(1), LM - 3, ty(v) + 3));
    ctx.textAlign = 'center';
    ctx.fillText('x', LM + DW / 2, CH);
    ctx.save();
    ctx.translate(8, TM + DH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('y', 0, 0);
    ctx.restore();

    // Wavelength tick marks with radial labels
    const centX = tx(0.33), centY = ty(0.33);
    [460, 490, 510, 530, 560, 600, 650].forEach((wl) => {
      const pt = LOCUS.find(([nm]) => nm === wl);
      if (!pt) return;
      const [, lx, ly] = pt;
      const px = tx(lx), py = ty(ly);
      ctx.beginPath();
      ctx.arc(px, py, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#111';
      ctx.fill();
      const dx = px - centX, dy = py - centY;
      const len = Math.sqrt(dx * dx + dy * dy);
      ctx.font = '8px sans-serif';
      ctx.fillStyle = '#111';
      ctx.textAlign = 'center';
      ctx.fillText(`${wl}`, px + (dx / len) * 11, py + (dy / len) * 11 + 3);
    });

    // sRGB gamut triangle
    const srgbVerts: Array<[number, number, string, number, number]> = [
      [0.6400, 0.3300, 'R', 10, 3],
      [0.3000, 0.6000, 'G', -4, -8],
      [0.1500, 0.0600, 'B', -10, 4],
    ];
    ctx.beginPath();
    srgbVerts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(tx(x), ty(y)) : ctx.lineTo(tx(x), ty(y))));
    ctx.closePath();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
    srgbVerts.forEach(([x, y, label, ox, oy]) => {
      const px = tx(x), py = ty(y);
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
      ctx.font = 'bold 9px sans-serif';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.fillText(label, px + ox, py + oy);
    });
    ctx.font = '8px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.textAlign = 'center';
    ctx.fillText('sRGB', tx(0.363), ty(0.268));

    // D65 white point
    ctx.beginPath();
    ctx.arc(tx(0.3127), ty(0.3290), 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fill();
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Current color marker
    const mx = tx(cx), my = ty(cy);
    ctx.beginPath();
    ctx.arc(mx, my, 5, 0, Math.PI * 2);
    ctx.fillStyle = `rgb(${focusR},${focusG},${focusB})`;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(mx, my, 7, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }, [isOpen, focusR, focusG, focusB, cx, cy]);

  return (
    <div className="controlPanel">
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', height: '24px' }}>
        <span style={{ fontWeight: 600, fontSize: '16px' }}>CIE xy</span>
        <button className="showSlidersButton" onClick={() => setIsOpen(o => !o)}>
          {isOpen ? '▲' : '▼'}
        </button>
      </div>
      {isOpen && (
        <>
          <canvas
            ref={canvasRef}
            width={CW}
            height={CH}
            style={{ display: 'block', margin: '4px auto 0' }}
          />
          <div style={{ fontSize: '11px', color: '#555', textAlign: 'center', marginTop: '2px', fontFamily: 'monospace' }}>
            x&nbsp;=&nbsp;{cx.toFixed(4)}&emsp;y&nbsp;=&nbsp;{cy.toFixed(4)}
          </div>
        </>
      )}
    </div>
  );
};

export default CIExyDiagram;
