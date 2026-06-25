import ShapeButton from './ShapeButton';
import type { ControlPaneProps } from '../../../types/controlPane';

type Props = ControlPaneProps;

function toLinear(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function rgbToXYZ(r: number, g: number, b: number): [number, number, number] {
  const rl = toLinear(r), gl = toLinear(g), bl = toLinear(b);
  return [
    0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl,
    0.2126729 * rl + 0.7151522 * gl + 0.0721750 * bl,
    0.0193339 * rl + 0.1191920 * gl + 0.9503041 * bl,
  ];
}

function xyzToRgb(X: number, Y: number, Z: number): [number, number, number] {
  let r =  3.2406 * X - 1.5372 * Y - 0.4986 * Z;
  let g = -0.9689 * X + 1.8758 * Y + 0.0415 * Z;
  let b =  0.0557 * X - 0.2040 * Y + 1.0570 * Z;
  r = Math.max(0, Math.min(1, r));
  g = Math.max(0, Math.min(1, g));
  b = Math.max(0, Math.min(1, b));
  const toSRGB = (c: number) => c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return [Math.round(toSRGB(r) * 255), Math.round(toSRGB(g) * 255), Math.round(toSRGB(b) * 255)];
}

const XyzSliders = (props: Props) => {
  const [X, Y, Z] = rgbToXYZ(props.focusR, props.focusG, props.focusB);

  const handleChange = (channel: 'X' | 'Y' | 'Z', val: number) => {
    const [r, g, b] = xyzToRgb(
      channel === 'X' ? val : X,
      channel === 'Y' ? val : Y,
      channel === 'Z' ? val : Z,
    );
    props.handleClick(r, g, b);
  };

  const row = (label: 'X' | 'Y' | 'Z', value: number, max: number, color: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
      <span style={{ width: '14px', fontSize: '12px', fontWeight: 600, color, flexShrink: 0 }}>{label}</span>
      <input
        type="range"
        min={0}
        max={max}
        step={0.001}
        value={value}
        style={{ flex: 1, minWidth: '80px' }}
        onChange={(e) => handleChange(label, Number(e.target.value))}
      />
      <span style={{ width: '42px', fontSize: '11px', textAlign: 'right', fontFamily: 'monospace', color: '#444' }}>
        {value.toFixed(4)}
      </span>
    </div>
  );

  return (
    <div className="controlPanel">
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', height: '24px', gap: '8px' }}>
        <ShapeButton {...props} setIsVisible={() => {}} shapeName="XYZ" content="" />
        <ShapeButton {...props} setIsVisible={() => {}} shapeName="xyz" content="" />
        <ShapeButton {...props} setIsVisible={() => {}} shapeName="xy" content="" />
      </div>
      <div style={{ paddingTop: '6px' }}>
        {row('X', X, 0.95047, '#cc3333')}
        {row('Y', Y, 1.0,     '#338833')}
        {row('Z', Z, 1.08883, '#3366cc')}
        <div style={{ fontSize: '10px', color: '#888', marginTop: '4px', lineHeight: 1.4 }}>
          Y = 輝度（0〜1）　白色点 D65
        </div>
      </div>
    </div>
  );
};

export default XyzSliders;
