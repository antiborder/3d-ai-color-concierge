import { useRef, useEffect } from 'react';
import styled from 'styled-components';
import convert from 'color-convert';
import { systemColors } from '../../constants/systemColors';
import type { ControlPaneProps } from '../../types/controlPane';
import HelpIcon from '../common/HelpIcon';

const SIZE = 256;    // canvas pixel resolution
const CSS_SIZE = 217; // rendered CSS size (px)
const LCH_MAX_C = 150;

function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  const toLinear = (c: number) => { const s = c / 255; return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
  const rl = toLinear(r), gl = toLinear(g), bl = toLinear(b);
  const Xn = (rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375) / 0.95047;
  const Yn = rl * 0.2126729 + gl * 0.7151522 + bl * 0.0721750;
  const Zn = (rl * 0.0193339 + gl * 0.1191920 + bl * 0.9503041) / 1.08883;
  const f = (t: number) => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
  return [116 * f(Yn) - 16, 500 * (f(Xn) - f(Yn)), 200 * (f(Yn) - f(Zn))];
}

function labToRgb(L: number, a: number, b: number): [number, number, number] {
  const fy = (L + 16) / 116, fx = a / 500 + fy, fz = fy - b / 200;
  const fInv = (t: number) => t > 0.008856 ? t * t * t : (t - 16 / 116) / 7.787;
  const X = fInv(fx) * 0.95047, Y = fInv(fy), Z = fInv(fz) * 1.08883;
  const rl = X * 3.2404542 - Y * 1.5371385 - Z * 0.4985314;
  const gl = -X * 0.9692660 + Y * 1.8760108 + Z * 0.0415560;
  const bl2 = X * 0.0556434 - Y * 0.2040259 + Z * 1.0572252;
  const toS = (c: number) => Math.round(Math.max(0, Math.min(1, c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055)) * 255);
  return [toS(rl), toS(gl), toS(bl2)];
}

const SUPPORTED = new Set(['RGB', 'CMYK', 'HSB', 'HSL', 'Lab', 'LCH']);

const TwoDPicker = (props: ControlPaneProps) => {
  const { shape } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!SUPPORTED.has(shape)) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const {
      rgbMainElement, cmykMainElement, hsbMainElement, hslMainElement,
      focusR, focusG, focusB, focusH, focusS, focusL, focusHsvS, focusV,
    } = props;

    // Precompute Lab/LCH values from current RGB
    const [labFixedL, labCurrentA, labCurrentB] =
      (shape === 'Lab' || shape === 'LCH') ? rgbToLab(focusR, focusG, focusB) : [0, 0, 0];

    // ── Pixel fill ────────────────────────────────────────────────────────────
    const imageData = ctx.createImageData(SIZE, SIZE);
    const d = imageData.data;

    for (let py = 0; py < SIZE; py++) {
      for (let px = 0; px < SIZE; px++) {
        const xVal = px / (SIZE - 1); // 0→1 left→right
        const yVal = py / (SIZE - 1); // 0→1 top→bottom
        let r = 0, g = 0, b = 0;

        if (shape === 'RGB' || shape === 'CMYK') {
          const el = shape === 'RGB' ? rgbMainElement : cmykMainElement;
          if (el === 'R' || el === 'C') {
            r = focusR;
            g = Math.round((1 - yVal) * 255);
            b = Math.round(xVal * 255);
          } else if (el === 'G' || el === 'M') {
            r = Math.round(xVal * 255);
            g = shape === 'RGB' ? focusG : focusG;
            b = Math.round((1 - yVal) * 255);
          } else if (el === 'B' || el === 'Y') {
            r = Math.round((1 - yVal) * 255);
            g = Math.round(xVal * 255);
            b = focusB;
          }
        } else if (shape === 'HSB') {
          if (hsbMainElement === 'H') {
            [r, g, b] = convert.hsv.rgb([focusH, xVal * 100, (1 - yVal) * 100]);
          } else if (hsbMainElement === 'S') {
            [r, g, b] = convert.hsv.rgb([xVal * 360, focusHsvS, (1 - yVal) * 100]);
          } else {
            const cx = px - SIZE / 2, cy = SIZE / 2 - py;
            const radius = Math.sqrt(cx * cx + cy * cy);
            if (radius > SIZE / 2) {
              r = g = b = 255;
            } else {
              const angle = ((Math.PI / 2 - Math.atan2(cy, cx)) + 2 * Math.PI) % (2 * Math.PI);
              [r, g, b] = convert.hsv.rgb([angle * 180 / Math.PI, radius * 100 / (SIZE / 2), focusV]);
            }
          }
        } else if (shape === 'HSL') {
          if (hslMainElement === 'H') {
            [r, g, b] = convert.hsl.rgb([focusH, xVal * 100, (1 - yVal) * 100]);
          } else if (hslMainElement === 'S') {
            [r, g, b] = convert.hsl.rgb([xVal * 360, focusS, (1 - yVal) * 100]);
          } else {
            const cx = px - SIZE / 2, cy = SIZE / 2 - py;
            const radius = Math.sqrt(cx * cx + cy * cy);
            if (radius > SIZE / 2) {
              r = g = b = 255;
            } else {
              const angle = ((Math.PI / 2 - Math.atan2(cy, cx)) + 2 * Math.PI) % (2 * Math.PI);
              [r, g, b] = convert.hsl.rgb([angle * 180 / Math.PI, radius * 100 / (SIZE / 2), focusL]);
            }
          }
        } else if (shape === 'Lab') {
          // x: a axis (-128 → 127), y: b axis (127 top → -128 bottom)
          const aVal = -128 + xVal * 255;
          const bVal = 127 - yVal * 255;
          [r, g, b] = labToRgb(labFixedL, aVal, bVal);
        } else if (shape === 'LCH') {
          // x: H (0→360), y: C (LCH_MAX_C top → 0 bottom)
          const H = xVal * 360;
          const C = (1 - yVal) * LCH_MAX_C;
          const Hrad = (H * Math.PI) / 180;
          [r, g, b] = labToRgb(labFixedL, C * Math.cos(Hrad), C * Math.sin(Hrad));
        }

        const idx = (py * SIZE + px) * 4;
        d[idx] = r; d[idx + 1] = g; d[idx + 2] = b; d[idx + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // ── Guide lines ───────────────────────────────────────────────────────────
    ctx.lineWidth = 1.5;

    const line = (color: string, x1: number, y1: number, x2: number, y2: number) => {
      ctx.strokeStyle = color;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    };

    if (shape === 'RGB' || shape === 'CMYK') {
      const el = shape === 'RGB' ? rgbMainElement : cmykMainElement;
      let vX: number, hY: number, vCol: string, hCol: string;
      if (el === 'R' || el === 'C') {
        vX = focusB / 255 * SIZE;         hY = (1 - focusG / 255) * SIZE;
        vCol = shape === 'RGB' ? systemColors['B'] : systemColors['Y'];
        hCol = shape === 'RGB' ? systemColors['G'] : systemColors['M'];
      } else if (el === 'G' || el === 'M') {
        vX = focusR / 255 * SIZE;         hY = (1 - focusB / 255) * SIZE;
        vCol = shape === 'RGB' ? systemColors['R'] : systemColors['C'];
        hCol = shape === 'RGB' ? systemColors['B'] : systemColors['Y'];
      } else {
        vX = focusG / 255 * SIZE;         hY = (1 - focusR / 255) * SIZE;
        vCol = shape === 'RGB' ? systemColors['G'] : systemColors['M'];
        hCol = shape === 'RGB' ? systemColors['R'] : systemColors['C'];
      }
      line(vCol, vX, 0, vX, SIZE);
      line(hCol, 0, hY, SIZE, hY);

    } else if (shape === 'HSB') {
      if (hsbMainElement === 'H') {
        line(systemColors['K'], focusHsvS / 100 * SIZE, 0, focusHsvS / 100 * SIZE, SIZE);
        line(systemColors['K'], 0, (1 - focusV / 100) * SIZE, SIZE, (1 - focusV / 100) * SIZE);
      } else if (hsbMainElement === 'S') {
        line(systemColors['K'], focusH / 360 * SIZE, 0, focusH / 360 * SIZE, SIZE);
        line(systemColors['W'], 0, (1 - focusV / 100) * SIZE, SIZE, (1 - focusV / 100) * SIZE);
      } else {
        const cx = SIZE / 2, cy = SIZE / 2;
        line(systemColors['K'], cx, cy,
          cx + Math.sin(focusH * Math.PI / 180) * SIZE / 2,
          cy - Math.cos(focusH * Math.PI / 180) * SIZE / 2);
        ctx.strokeStyle = systemColors['W'];
        ctx.beginPath();
        ctx.arc(cx, cy, focusHsvS / 100 * (SIZE / 2), 0, 2 * Math.PI);
        ctx.stroke();
      }
    } else if (shape === 'HSL') {
      if (hslMainElement === 'H') {
        line(systemColors['K'], focusS / 100 * SIZE, 0, focusS / 100 * SIZE, SIZE);
        line(systemColors['K'], 0, (1 - focusL / 100) * SIZE, SIZE, (1 - focusL / 100) * SIZE);
      } else if (hslMainElement === 'S') {
        line(systemColors['K'], focusH / 360 * SIZE, 0, focusH / 360 * SIZE, SIZE);
        line(systemColors['W'], 0, (1 - focusL / 100) * SIZE, SIZE, (1 - focusL / 100) * SIZE);
      } else {
        const cx = SIZE / 2, cy = SIZE / 2;
        line(systemColors['K'], cx, cy,
          cx + Math.sin(focusH * Math.PI / 180) * SIZE / 2,
          cy - Math.cos(focusH * Math.PI / 180) * SIZE / 2);
        ctx.strokeStyle = systemColors['W'];
        ctx.beginPath();
        ctx.arc(cx, cy, focusS / 100 * (SIZE / 2), 0, 2 * Math.PI);
        ctx.stroke();
      }
    } else if (shape === 'Lab') {
      // Vertical = current a, horizontal = current b
      const vX = ((labCurrentA + 128) / 255) * SIZE;
      const hY = ((127 - labCurrentB) / 255) * SIZE;
      line(systemColors['K'], vX, 0, vX, SIZE);
      line(systemColors['W'], 0, hY, SIZE, hY);
    } else if (shape === 'LCH') {
      const labCurrentC = Math.sqrt(labCurrentA * labCurrentA + labCurrentB * labCurrentB);
      const labCurrentH = ((Math.atan2(labCurrentB, labCurrentA) * 180 / Math.PI) + 360) % 360;
      const vX = (labCurrentH / 360) * SIZE;
      const hY = (1 - Math.min(labCurrentC, LCH_MAX_C) / LCH_MAX_C) * SIZE;
      line(systemColors['K'], vX, 0, vX, SIZE);
      line(systemColors['W'], 0, hY, SIZE, hY);
    }
  }, [
    props.shape,
    props.rgbMainElement, props.cmykMainElement, props.hsbMainElement, props.hslMainElement,
    props.focusR, props.focusG, props.focusB,
    props.focusH, props.focusS, props.focusL, props.focusHsvS, props.focusV,
    props.isTwoDPickerOpen,
  ]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width * SIZE;
    const py = (e.clientY - rect.top) / rect.height * SIZE;
    const xVal = px / SIZE;
    const yVal = py / SIZE;

    const {
      rgbMainElement, cmykMainElement, hsbMainElement, hslMainElement,
      focusR, focusG, focusB, focusH, focusS, focusL, focusHsvS, focusV,
    } = props;

    if (shape === 'RGB' || shape === 'CMYK') {
      const el = shape === 'RGB' ? rgbMainElement : cmykMainElement;
      let r = focusR, g = focusG, b = focusB;
      if (el === 'R' || el === 'C') {
        g = Math.round((1 - yVal) * 255); b = Math.round(xVal * 255);
      } else if (el === 'G' || el === 'M') {
        r = Math.round(xVal * 255);       b = Math.round((1 - yVal) * 255);
      } else {
        r = Math.round((1 - yVal) * 255); g = Math.round(xVal * 255);
      }
      props.handleClick(r, g, b);
    } else if (shape === 'HSB') {
      let h = focusH, s = focusHsvS, v = focusV;
      if (hsbMainElement === 'H') {
        s = xVal * 100; v = (1 - yVal) * 100;
      } else if (hsbMainElement === 'S') {
        h = xVal * 360; v = (1 - yVal) * 100;
      } else {
        const cx = px - SIZE / 2, cy = SIZE / 2 - py;
        const radius = Math.sqrt(cx * cx + cy * cy);
        if (radius > SIZE / 2) return;
        const angle = ((Math.PI / 2 - Math.atan2(cy, cx)) + 2 * Math.PI) % (2 * Math.PI);
        h = angle * 180 / Math.PI; s = radius * 100 / (SIZE / 2);
      }
      const [r, g, b] = convert.hsv.rgb([h, s, v]);
      props.handleClick(r, g, b);
    } else if (shape === 'HSL') {
      let h = focusH, s = focusS, l = focusL;
      if (hslMainElement === 'H') {
        s = xVal * 100; l = (1 - yVal) * 100;
      } else if (hslMainElement === 'S') {
        h = xVal * 360; l = (1 - yVal) * 100;
      } else {
        const cx = px - SIZE / 2, cy = SIZE / 2 - py;
        const radius = Math.sqrt(cx * cx + cy * cy);
        if (radius > SIZE / 2) return;
        const angle = ((Math.PI / 2 - Math.atan2(cy, cx)) + 2 * Math.PI) % (2 * Math.PI);
        h = angle * 180 / Math.PI; s = radius * 100 / (SIZE / 2);
      }
      const [r, g, b] = convert.hsl.rgb([h, s, l]);
      props.handleClick(r, g, b);
    } else if (shape === 'Lab') {
      const [fixedL] = rgbToLab(focusR, focusG, focusB);
      const aVal = -128 + xVal * 255;
      const bVal = 127 - yVal * 255;
      const [r, g, b] = labToRgb(fixedL, aVal, bVal);
      props.handleClick(r, g, b);
    } else if (shape === 'LCH') {
      const [fixedL] = rgbToLab(focusR, focusG, focusB);
      const H = xVal * 360;
      const C = (1 - yVal) * LCH_MAX_C;
      const Hrad = (H * Math.PI) / 180;
      const [r, g, b] = labToRgb(fixedL, C * Math.cos(Hrad), C * Math.sin(Hrad));
      props.handleClick(r, g, b);
    }
  };

  if (!SUPPORTED.has(shape)) return null;

  return (
    <StyledTwoDPicker>
      <div className="controlPanel">
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            height: '24px',
          }}
        >
          <span style={{ fontWeight: 600, fontSize: '16px' }}>2D Picker</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            {props.onHelpClick && (
              <HelpIcon
                topic="2d_picker"
                onHelpClick={(topic) => {
                  if (!props.isTwoDPickerOpen) props.onTwoDPickerOpenChange(true);
                  props.onHelpClick!(topic);
                }}
              />
            )}
            <button
              className="showSlidersButton"
              onClick={() => props.onTwoDPickerOpenChange(!props.isTwoDPickerOpen)}
            >
              {props.isTwoDPickerOpen ? '▲' : '▼'}
            </button>
          </div>
        </div>
        {props.isTwoDPickerOpen && (
          <canvas
            ref={canvasRef}
            width={SIZE}
            height={SIZE}
            style={{
              width: `${CSS_SIZE}px`,
              height: `${CSS_SIZE}px`,
              display: 'block',
              border: '1px solid #000000',
              cursor: 'crosshair',
              marginTop: '8px',
            }}
            onClick={handleClick}
          />
        )}
      </div>
    </StyledTwoDPicker>
  );
};

const StyledTwoDPicker = styled.div`
  position: relative;
`;

export default TwoDPicker;
