import styled from 'styled-components';
import ShapeButton from './ShapeButton';
import type { ControlPaneProps } from '../../../types/controlPane';

type Props = ControlPaneProps;

function toLinear(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function rgbToXYZ(r: number, g: number, b: number): [number, number, number] {
  const rl = toLinear(r),
    gl = toLinear(g),
    bl = toLinear(b);
  return [
    0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl,
    0.2126729 * rl + 0.7151522 * gl + 0.072175 * bl,
    0.0193339 * rl + 0.119192 * gl + 0.9503041 * bl,
  ];
}

function xyzToRgb(X: number, Y: number, Z: number): [number, number, number] {
  let r = 3.2406 * X - 1.5372 * Y - 0.4986 * Z;
  let g = -0.9689 * X + 1.8758 * Y + 0.0415 * Z;
  let b = 0.0557 * X - 0.204 * Y + 1.057 * Z;
  r = Math.max(0, Math.min(1, r));
  g = Math.max(0, Math.min(1, g));
  b = Math.max(0, Math.min(1, b));
  const toSRGB = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
  return [Math.round(toSRGB(r) * 255), Math.round(toSRGB(g) * 255), Math.round(toSRGB(b) * 255)];
}

// Analytical sRGB gamut range for one XYZ axis given the other two.
// Derived by solving the 6 linear constraints r,g,b ∈ [0,1] for the target axis.
// Matrix used: r=3.2406X-1.5372Y-0.4986Z  g=-0.9689X+1.8758Y+0.0415Z  b=0.0557X-0.204Y+1.057Z
function xyzGamutRange(
  axis: 'X' | 'Y' | 'Z',
  X: number,
  Y: number,
  Z: number
): [number, number] {
  let lo: number, hi: number;
  if (axis === 'X') {
    lo = Math.max(
      0,
      (1.5372 * Y + 0.4986 * Z) / 3.2406,         // r >= 0
      (1.8758 * Y + 0.0415 * Z - 1) / 0.9689,      // g <= 1
      (0.204 * Y - 1.057 * Z) / 0.0557              // b >= 0
    );
    hi = Math.min(
      0.95047,
      (1 + 1.5372 * Y + 0.4986 * Z) / 3.2406,      // r <= 1
      (1.8758 * Y + 0.0415 * Z) / 0.9689,           // g >= 0
      (1 + 0.204 * Y - 1.057 * Z) / 0.0557          // b <= 1
    );
  } else if (axis === 'Y') {
    lo = Math.max(
      0,
      (3.2406 * X - 0.4986 * Z - 1) / 1.5372,      // r <= 1
      (0.9689 * X - 0.0415 * Z) / 1.8758,           // g >= 0
      (0.0557 * X + 1.057 * Z - 1) / 0.204          // b <= 1
    );
    hi = Math.min(
      1.0,
      (3.2406 * X - 0.4986 * Z) / 1.5372,           // r >= 0
      (1 + 0.9689 * X - 0.0415 * Z) / 1.8758,       // g <= 1
      (0.0557 * X + 1.057 * Z) / 0.204              // b >= 0
    );
  } else {
    lo = Math.max(
      0,
      (3.2406 * X - 1.5372 * Y - 1) / 0.4986,      // r <= 1
      (0.9689 * X - 1.8758 * Y) / 0.0415,           // g >= 0
      (0.204 * Y - 0.0557 * X) / 1.057              // b >= 0
    );
    hi = Math.min(
      1.08883,
      (3.2406 * X - 1.5372 * Y) / 0.4986,           // r >= 0
      (1 + 0.9689 * X - 1.8758 * Y) / 0.0415,       // g <= 1
      (1 - 0.0557 * X + 0.204 * Y) / 1.057          // b <= 1
    );
  }
  return [Math.max(0, lo), Math.max(lo, hi)];
}

const XyzSliders = (props: Props) => {
  const [X, Y, Z] = rgbToXYZ(props.focusR, props.focusG, props.focusB);

  const [xLo, xHi] = xyzGamutRange('X', X, Y, Z);
  const [yLo, yHi] = xyzGamutRange('Y', X, Y, Z);
  const [zLo, zHi] = xyzGamutRange('Z', X, Y, Z);

  const handleChange = (channel: 'X' | 'Y' | 'Z', val: number) => {
    const [r, g, b] = xyzToRgb(
      channel === 'X' ? val : X,
      channel === 'Y' ? val : Y,
      channel === 'Z' ? val : Z
    );
    props.handleClick(r, g, b);
  };

  const row = (
    label: 'X' | 'Y' | 'Z',
    value: number,
    absMax: number,
    lo: number,
    hi: number
  ) => {
    const loP = (lo / absMax) * 100;
    const hiP = (hi / absMax) * 100;
    const clamped = Math.max(lo, Math.min(hi, value));
    return (
      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
        <Label>{label}</Label>
        <SliderTrack>
          <input
            type="range"
            min={lo}
            max={hi}
            step={0.001}
            value={clamped}
            onChange={(e) => handleChange(label, Number(e.target.value))}
            style={{
              position: 'absolute',
              margin: 0,
              left: `${loP}%`,
              width: `${Math.max(hiP - loP, 0.1)}%`,
              height: '100%',
              boxSizing: 'border-box',
            }}
          />
        </SliderTrack>
        <span
          style={{
            width: '42px',
            fontSize: '11px',
            textAlign: 'right',
            fontFamily: 'monospace',
            color: '#444',
          }}
        >
          {value.toFixed(4)}
        </span>
      </div>
    );
  };

  return (
    <div className="controlPanel">
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          height: '24px',
          gap: '8px',
        }}
      >
        <ShapeButton {...props} setIsVisible={() => {}} shapeName="XYZ" content="" />
        <ShapeButton {...props} setIsVisible={() => {}} shapeName="xyz" content="" />
        <ShapeButton {...props} setIsVisible={() => {}} shapeName="xy" content="" />
      </div>
      <div style={{ paddingTop: '6px' }}>
        {row('X', X, 0.95047, xLo, xHi)}
        {row('Y', Y, 1.0,     yLo, yHi)}
        {row('Z', Z, 1.08883, zLo, zHi)}
      </div>
    </div>
  );
};

const Label = styled.span`
  font-weight: 600;
  font-size: 16px;
  width: 24px;
  text-align: right;
  flex-shrink: 0;
`;

const SliderTrack = styled.div`
  position: relative;
  flex: 1;
  min-width: 80px;
  height: 20px;

  input[type='range'] {
    height: 100%;
    box-sizing: border-box;
  }
`;

export default XyzSliders;
