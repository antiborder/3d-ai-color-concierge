import { useRef } from 'react';
import styled from 'styled-components';
import convert from 'color-convert';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import type { ColorSpace } from '../../../types/color';

interface RGB { r: number; g: number; b: number }

interface ColorBridgeProps {
  currentColor: RGB;
  colorA: RGB;
  colorB: RGB;
  onSetColorA: (c: RGB) => void;
  onSetColorB: (c: RGB) => void;
  shape: ColorSpace;
  onColorSelect: (r: number, g: number, b: number) => void;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpAngle(a: number, b: number, t: number): number {
  let diff = b - a;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return (a + diff * t + 360) % 360;
}

function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const rl = toLinear(r), gl = toLinear(g), bl = toLinear(b);
  const Xn = (rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375) / 0.95047;
  const Yn = rl * 0.2126729 + gl * 0.7151522 + bl * 0.0721750;
  const Zn = (rl * 0.0193339 + gl * 0.1191920 + bl * 0.9503041) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(Yn) - 16, 500 * (f(Xn) - f(Yn)), 200 * (f(Yn) - f(Zn))];
}

function labToRgb(L: number, a: number, b: number): [number, number, number] {
  const fy = (L + 16) / 116;
  const fx = a / 500 + fy;
  const fz = fy - b / 200;
  const fInv = (t: number) => (t > 0.008856 ? t * t * t : (t - 16 / 116) / 7.787);
  const X = fInv(fx) * 0.95047;
  const Y = fInv(fy);
  const Z = fInv(fz) * 1.08883;
  const rl = X * 3.2404542 - Y * 1.5371385 - Z * 0.4985314;
  const gl = -X * 0.9692660 + Y * 1.8760108 + Z * 0.0415560;
  const bl = X * 0.0556434 - Y * 0.2040259 + Z * 1.0572252;
  const toSrgb = (c: number) =>
    Math.round(Math.max(0, Math.min(1, c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055)) * 255);
  return [toSrgb(rl), toSrgb(gl), toSrgb(bl)];
}

export function interpolateRgb(colorA: RGB, colorB: RGB, shape: ColorSpace, t: number): [number, number, number] {
  const { r: r1, g: g1, b: b1 } = colorA;
  const { r: r2, g: g2, b: b2 } = colorB;

  if (shape === 'HSL') {
    const [h1, s1, l1] = convert.rgb.hsl([r1, g1, b1]);
    const [h2, s2, l2] = convert.rgb.hsl([r2, g2, b2]);
    return convert.hsl.rgb([lerpAngle(h1, h2, t), lerp(s1, s2, t), lerp(l1, l2, t)]);
  }
  if (shape === 'HSV') {
    const [h1, s1, v1] = convert.rgb.hsv([r1, g1, b1]);
    const [h2, s2, v2] = convert.rgb.hsv([r2, g2, b2]);
    return convert.hsv.rgb([lerpAngle(h1, h2, t), lerp(s1, s2, t), lerp(v1, v2, t)]);
  }
  if (shape === 'CMYK') {
    const [c1, m1, y1, k1] = convert.rgb.cmyk([r1, g1, b1]);
    const [c2, m2, y2, k2] = convert.rgb.cmyk([r2, g2, b2]);
    return convert.cmyk.rgb([lerp(c1, c2, t), lerp(m1, m2, t), lerp(y1, y2, t), lerp(k1, k2, t)]);
  }
  if (shape === 'Lab') {
    const [L1, a1, b_1] = rgbToLab(r1, g1, b1);
    const [L2, a2, b_2] = rgbToLab(r2, g2, b2);
    return labToRgb(lerp(L1, L2, t), lerp(a1, a2, t), lerp(b_1, b_2, t));
  }
  if (shape === 'LCH') {
    const [L1, a1, b_1] = rgbToLab(r1, g1, b1);
    const C1 = Math.sqrt(a1 * a1 + b_1 * b_1);
    const H1 = (Math.atan2(b_1, a1) * 180) / Math.PI;
    const [L2, a2, b_2] = rgbToLab(r2, g2, b2);
    const C2 = Math.sqrt(a2 * a2 + b_2 * b_2);
    const H2 = (Math.atan2(b_2, a2) * 180) / Math.PI;
    const L = lerp(L1, L2, t);
    const C = lerp(C1, C2, t);
    const H = lerpAngle(H1, H2, t);
    const Hrad = (H * Math.PI) / 180;
    return labToRgb(L, C * Math.cos(Hrad), C * Math.sin(Hrad));
  }
  return [Math.round(lerp(r1, r2, t)), Math.round(lerp(g1, g2, t)), Math.round(lerp(b1, b2, t))];
}

function buildGradientStops(colorA: RGB, colorB: RGB, shape: ColorSpace, steps = 20): string {
  const stops: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const [r, g, b] = interpolateRgb(colorA, colorB, shape, t);
    stops.push(`rgb(${r},${g},${b}) ${(t * 100).toFixed(1)}%`);
  }
  return `linear-gradient(to right, ${stops.join(', ')})`;
}

function toHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
}

const ColorBridge = ({ currentColor, colorA, colorB, onSetColorA, onSetColorB, shape, onColorSelect }: ColorBridgeProps) => {
  const { i18n } = useTranslation();
  const barRef = useRef<HTMLDivElement>(null);

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = barRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const t = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const [r, g, b] = interpolateRgb(colorA, colorB, shape, t);
    onColorSelect(r, g, b);
  };

  const gradient = buildGradientStops(colorA, colorB, shape);

  return (
    <Wrapper>
      <Row>
        <EndpointDot
          style={{ background: `rgb(${colorA.r},${colorA.g},${colorA.b})` }}
          onClick={() => {
            onSetColorA({ ...currentColor });
            const hex = toHex(currentColor.r, currentColor.g, currentColor.b);
            toast.success(i18n.language === 'en'
              ? `1D Picker left color set to ${hex}`
              : `1D Pickerの左端の色が${hex}に設定されました`,
              { style: { background: '#000', color: '#fff' }, iconTheme: { primary: '#fff', secondary: '#000' } }
            );
          }}
          title="Click to set current color"
        />
        <Bar ref={barRef} style={{ background: gradient }} onClick={handleBarClick} />
        <EndpointDot
          style={{ background: `rgb(${colorB.r},${colorB.g},${colorB.b})` }}
          onClick={() => {
            onSetColorB({ ...currentColor });
            const hex = toHex(currentColor.r, currentColor.g, currentColor.b);
            toast.success(i18n.language === 'en'
              ? `1D Picker right color set to ${hex}`
              : `1D Pickerの右端の色が${hex}に設定されました`,
              { style: { background: '#000', color: '#fff' }, iconTheme: { primary: '#fff', secondary: '#000' } }
            );
          }}
          title="Click to set current color"
        />
      </Row>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  margin-top: 10px;
  padding: 0 2px 6px;
`;

const EndpointDot = styled.div`
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 1px solid rgba(0, 0, 0, 0.2);
  cursor: pointer;
  display: inline-block;

  &:hover {
    border-color: #4e8cee;
    transform: scale(1.2);
  }
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const Bar = styled.div`
  flex: 1;
  height: 18px;
  border-radius: 4px;
  cursor: crosshair;
  border: 1px solid rgba(0, 0, 0, 0.12);

  &:hover {
    border-color: #4e8cee;
  }
`;

export default ColorBridge;
