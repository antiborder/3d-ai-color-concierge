import { useRef, useEffect } from 'react';
import styled from 'styled-components';
import convert from 'color-convert';
import { systemColors } from '../../constants/systemColors';
import type { ControlPaneProps } from '../../types/controlPane';
import HelpIcon from '../common/HelpIcon';

const SIZE = 256;    // canvas pixel resolution
const CSS_SIZE = 217; // rendered CSS size (px)

const SUPPORTED = new Set(['RGB', 'CMYK', 'HSV', 'HSL']);

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
      rgbMainElement, cmykMainElement, hsvMainElement, hslMainElement,
      focusR, focusG, focusB, focusH, focusS, focusL, focusHsvS, focusV,
    } = props;

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
        } else if (shape === 'HSV') {
          if (hsvMainElement === 'H') {
            [r, g, b] = convert.hsv.rgb([focusH, xVal * 100, (1 - yVal) * 100]);
          } else if (hsvMainElement === 'S') {
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

    } else if (shape === 'HSV') {
      if (hsvMainElement === 'H') {
        line(systemColors['K'], focusHsvS / 100 * SIZE, 0, focusHsvS / 100 * SIZE, SIZE);
        line(systemColors['K'], 0, (1 - focusV / 100) * SIZE, SIZE, (1 - focusV / 100) * SIZE);
      } else if (hsvMainElement === 'S') {
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
    }
  }, [
    props.shape,
    props.rgbMainElement, props.cmykMainElement, props.hsvMainElement, props.hslMainElement,
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
      rgbMainElement, cmykMainElement, hsvMainElement, hslMainElement,
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
    } else if (shape === 'HSV') {
      let h = focusH, s = focusHsvS, v = focusV;
      if (hsvMainElement === 'H') {
        s = xVal * 100; v = (1 - yVal) * 100;
      } else if (hsvMainElement === 'S') {
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
          <span style={{ fontWeight: 'bold', fontSize: '18px' }}>2D Picker</span>
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
