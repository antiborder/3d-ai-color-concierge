import { useRef, useEffect, type MouseEvent } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import type { ControlPaneProps } from '../../../types/controlPane';
import { LOCUS, CMF } from '../../../constants/cieLocus';
import HelpIcon from '../../common/HelpIcon';

export { LOCUS, CMF };

const LOCUS_POLY: Array<[number, number]> = LOCUS.map(([, x, y]) => [x, y]);

// Canvas layout constants
const CW = 206,
  LM = 26,
  RM = 4,
  TM = 6,
  BM = 20;
const DW = CW - LM - RM; // diagram width in pixels
const X0 = 0,
  XN = 0.8,
  Y0 = 0,
  YN = 0.88;
const DH = Math.round((DW * (YN - Y0)) / (XN - X0));
const CH = DH + TM + BM;

const tx = (x: number) => LM + ((x - X0) / (XN - X0)) * DW;
const ty = (y: number) => TM + (1 - (y - Y0) / (YN - Y0)) * DH;

function inPoly(px: number, py: number, p: Array<[number, number]>): boolean {
  let inside = false;
  const n = p.length;
  let j = n - 1;
  for (let i = 0; i < n; i++) {
    const [xi, yi] = p[i],
      [xj, yj] = p[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
    j = i;
  }
  return inside;
}

// xy chromaticity → sRGB [0,255] (normalized by max component so the gamut always shows color)
function xyToRGB(x: number, y: number): [number, number, number] {
  if (y <= 0) return [0, 0, 0];
  const X = x / y,
    Y = 1,
    Z = (1 - x - y) / y;
  let r = 3.2406 * X - 1.5372 * Y - 0.4986 * Z;
  let g = -0.9689 * X + 1.8758 * Y + 0.0415 * Z;
  let b = 0.0557 * X - 0.204 * Y + 1.057 * Z;
  r = Math.max(0, r);
  g = Math.max(0, g);
  b = Math.max(0, b);
  const m = Math.max(r, g, b, 1e-9);
  r /= m;
  g /= m;
  b /= m;
  const gc = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
  return [Math.round(gc(r) * 255), Math.round(gc(g) * 255), Math.round(gc(b) * 255)];
}

function rgbToXY(r: number, g: number, b: number): [number, number] {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const rl = lin(r),
    gl = lin(g),
    bl = lin(b);
  const X = 0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl;
  const Yv = 0.2126729 * rl + 0.7151522 * gl + 0.072175 * bl;
  const Z = 0.0193339 * rl + 0.119192 * gl + 0.9503041 * bl;
  const s = X + Yv + Z;
  return s < 1e-10 ? [0.3127, 0.329] : [X / s, Yv / s];
}

const SRGB_TRIANGLE: Array<[number, number]> = [
  [0.64, 0.33],
  [0.3, 0.6],
  [0.15, 0.06],
];

type Props = Pick<ControlPaneProps, 'focusR' | 'focusG' | 'focusB'> & {
  onColorSelect?: (r: number, g: number, b: number) => void;
  onHelpClick?: (topic: string) => void;
};

const CIExyDiagram = ({ focusR, focusG, focusB, onColorSelect, onHelpClick }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgRef = useRef<ImageData | null>(null);
  const { i18n } = useTranslation();

  const [cx, cy] = rgbToXY(focusR, focusG, focusB);

  useEffect(() => {
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
          const x = X0 + ((px - LM) / DW) * (XN - X0);
          const y = Y0 + (1 - (py - TM) / DH) * (YN - Y0);
          if (inPoly(x, y, LOCUS_POLY)) {
            const [rr, gg, bb] = xyToRGB(x, y);
            const i = (py * CW + px) * 4;
            d[i] = rr;
            d[i + 1] = gg;
            d[i + 2] = bb;
            d[i + 3] = 255;
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
    ctx.moveTo(LM, TM + DH);
    ctx.lineTo(LM + DW, TM + DH);
    ctx.moveTo(LM, TM);
    ctx.lineTo(LM, TM + DH);
    ctx.stroke();

    ctx.fillStyle = '#666';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    [0.0, 0.2, 0.4, 0.6, 0.8].forEach((v) => ctx.fillText(v.toFixed(1), tx(v), CH - 5));
    ctx.textAlign = 'right';
    [0.0, 0.2, 0.4, 0.6, 0.8].forEach((v) => ctx.fillText(v.toFixed(1), LM - 3, ty(v) + 3));
    ctx.textAlign = 'center';
    ctx.fillText('x', LM + DW / 2, CH);
    ctx.save();
    ctx.translate(8, TM + DH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('y', 0, 0);
    ctx.restore();

    // Wavelength tick marks with radial labels
    const centX = tx(0.33),
      centY = ty(0.33);
    [460, 490, 510, 530, 560, 600, 650].forEach((wl) => {
      const pt = LOCUS.find(([nm]) => nm === wl);
      if (!pt) return;
      const [, lx, ly] = pt;
      const px = tx(lx),
        py = ty(ly);
      ctx.beginPath();
      ctx.arc(px, py, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#111';
      ctx.fill();
      const dx = px - centX,
        dy = py - centY;
      const len = Math.sqrt(dx * dx + dy * dy);
      ctx.font = '8px sans-serif';
      ctx.fillStyle = '#111';
      ctx.textAlign = 'center';
      ctx.fillText(`${wl}`, px + (dx / len) * 11, py + (dy / len) * 11 + 3);
    });

    // sRGB gamut triangle
    const srgbVerts: Array<[number, number, string, number, number]> = [
      [0.64, 0.33, 'R', 10, 3],
      [0.3, 0.6, 'G', -4, -8],
      [0.15, 0.06, 'B', -10, 4],
    ];
    ctx.beginPath();
    srgbVerts.forEach(([x, y], i) =>
      i === 0 ? ctx.moveTo(tx(x), ty(y)) : ctx.lineTo(tx(x), ty(y))
    );
    ctx.closePath();
    ctx.strokeStyle = 'rgba(0,0,0,1)';
    ctx.lineWidth = 1;
    ctx.stroke();
    srgbVerts.forEach(([x, y, label, ox, oy]) => {
      const px = tx(x),
        py = ty(y);
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
    ctx.arc(tx(0.3127), ty(0.329), 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fill();
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Current color marker
    const mx = tx(cx),
      my = ty(cy);
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
  }, [focusR, focusG, focusB, cx, cy]);

  const handleCanvasClick = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!onColorSelect) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CW / rect.width;
    const scaleY = CH / rect.height;
    const px = (e.clientX - rect.left) * scaleX;
    const py = (e.clientY - rect.top) * scaleY;
    const x = X0 + ((px - LM) / DW) * (XN - X0);
    const y = Y0 + (1 - (py - TM) / DH) * (YN - Y0);

    if (!inPoly(x, y, SRGB_TRIANGLE)) {
      toast(
        i18n.language === 'ja'
          ? 'この色は画面上で表現できません。三角形の枠の中を選んでください。'
          : 'This color cannot be displayed on the screen. Please select a color inside the triangle.',
        { icon: '⚠️', style: { background: '#333', color: '#fff' } }
      );
      return;
    }
    const [r, g, b] = xyToRGB(x, y);
    onColorSelect(r, g, b);
  };

  return (
    <div className="controlPanel">
      <div style={{ height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 600, fontSize: '16px' }}>CIE chromaticity diagram</span>
        {onHelpClick && <HelpIcon topic="cie_xy" onHelpClick={onHelpClick} />}
      </div>
      <>
        <canvas
          ref={canvasRef}
          width={CW}
          height={CH}
          style={{ display: 'block', margin: '4px auto 0', cursor: onColorSelect ? 'crosshair' : 'default' }}
          onClick={handleCanvasClick}
        />
        <div
          style={{
            fontSize: '11px',
            color: '#555',
            textAlign: 'center',
            marginTop: '2px',
            fontFamily: 'monospace',
          }}
        >
          x&nbsp;=&nbsp;{cx.toFixed(4)}&emsp;y&nbsp;=&nbsp;{cy.toFixed(4)}
        </div>
      </>
    </div>
  );
};

export default CIExyDiagram;
