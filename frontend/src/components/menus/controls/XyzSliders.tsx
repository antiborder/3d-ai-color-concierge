import { useRef, useState } from 'react';
import styled from 'styled-components';
import ShapeButton from './ShapeButton';
import HelpIcon from '../../common/HelpIcon';
import type { ControlPaneProps } from '../../../types/controlPane';
import { rgbToXYZ, xyzToRgb, xyzGamutRange } from '../../../utils/gamutUtils';

type Props = ControlPaneProps;

const XyzSliders = (props: Props) => {
  const [X, Y, Z] = rgbToXYZ(props.focusR, props.focusG, props.focusB);

  const [xLo, xHi] = xyzGamutRange('X', X, Y, Z);
  const [yLo, yHi] = xyzGamutRange('Y', X, Y, Z);
  const [zLo, zHi] = xyzGamutRange('Z', X, Y, Z);

  const [draft, setDraft] = useState<Partial<Record<'X' | 'Y' | 'Z', number>>>({});
  const latestDraftRef = useRef<Partial<Record<'X' | 'Y' | 'Z', number>>>({});

  const commit = (channel: 'X' | 'Y' | 'Z') => {
    const val = latestDraftRef.current[channel];
    if (val === undefined) return;
    const cx = channel === 'X' ? val : (latestDraftRef.current.X ?? X);
    const cy = channel === 'Y' ? val : (latestDraftRef.current.Y ?? Y);
    const cz = channel === 'Z' ? val : (latestDraftRef.current.Z ?? Z);
    const [r, g, b] = xyzToRgb(cx, cy, cz);
    props.handleClick(r, g, b);
    latestDraftRef.current = {};
    setDraft({});
  };

  const row = (
    label: 'X' | 'Y' | 'Z',
    value: number,
    absMax: number,
    lo: number,
    hi: number
  ) => {
    const displayValue = draft[label] ?? value;
    const loP = (lo / absMax) * 100;
    const hiP = (hi / absMax) * 100;
    const clamped = Math.max(lo, Math.min(hi, displayValue));
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
            onChange={(e) => {
              const val = Number(e.target.value);
              latestDraftRef.current = { ...latestDraftRef.current, [label]: val };
              setDraft(prev => ({ ...prev, [label]: val }));
            }}
            onPointerUp={() => commit(label)}
            onKeyUp={() => commit(label)}
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
          {displayValue.toFixed(4)}
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
        {props.onHelpClick && (
          <HelpIcon topic="xyz_space" onHelpClick={props.onHelpClick} />
        )}
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
