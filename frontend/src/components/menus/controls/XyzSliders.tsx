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

const XyzSliders = (props: Props) => {
  const [X, Y, Z] = rgbToXYZ(props.focusR, props.focusG, props.focusB);

  const row = (label: string, value: number, max: number, color: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
      <span style={{ width: '14px', fontSize: '12px', fontWeight: 600, color, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: '#eee', overflow: 'hidden' }}>
        <div style={{ width: `${(value / max) * 100}%`, height: '100%', background: color, borderRadius: '3px' }} />
      </div>
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
        {row('X', X, 0.95047,  '#cc3333')}
        {row('Y', Y, 1.0,      '#338833')}
        {row('Z', Z, 1.08883,  '#3366cc')}
        <div style={{ fontSize: '10px', color: '#888', marginTop: '4px', lineHeight: 1.4 }}>
          Y = 輝度（0〜1）　白色点 D65
        </div>
      </div>
    </div>
  );
};

export default XyzSliders;
