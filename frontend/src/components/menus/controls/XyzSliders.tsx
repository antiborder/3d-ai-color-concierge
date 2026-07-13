import { useRef, useState } from 'react';
import styled from 'styled-components';
import ShapeButton from './ShapeButton';
import HelpIcon from '../../common/HelpIcon';
import type { ControlPaneProps } from '../../../types/controlPane';
import { rgbToXYZ, xyzToRgb, xyzGamutRange } from '../../../utils/gamutUtils';

type Props = ControlPaneProps;

const XyzSliders = (props: Props) => {
  const [X, Y, Z] = rgbToXYZ(props.focusR, props.focusG, props.focusB);

  const [draft, setDraft] = useState<Partial<Record<'X' | 'Y' | 'Z', number>>>({});

  const liveX = draft.X ?? X;
  const liveY = draft.Y ?? Y;
  const liveZ = draft.Z ?? Z;

  const [xLo, xHi] = xyzGamutRange('X', liveX, liveY, liveZ);
  const [yLo, yHi] = xyzGamutRange('Y', liveX, liveY, liveZ);
  const [zLo, zHi] = xyzGamutRange('Z', liveX, liveY, liveZ);
  const latestDraftRef = useRef<Partial<Record<'X' | 'Y' | 'Z', number>>>({});

  const commit = (channel: 'X' | 'Y' | 'Z') => {
    const val = latestDraftRef.current[channel];
    if (val === undefined) return;
    const cx = channel === 'X' ? val : (latestDraftRef.current.X ?? X);
    const cy = channel === 'Y' ? val : (latestDraftRef.current.Y ?? Y);
    const cz = channel === 'Z' ? val : (latestDraftRef.current.Z ?? Z);
    const [r, g, b] = xyzToRgb(cx, cy, cz);
    props.handleClick(r, g, b);
    props.onClearPreviewRgb?.();
    latestDraftRef.current = {};
    setDraft({});
  };

  const row = (label: 'X' | 'Y' | 'Z', value: number, absMax: number, lo: number, hi: number) => {
    const displayValue = draft[label] ?? value;
    const loP = (lo / absMax) * 100;
    const hiP = (hi / absMax) * 100;
    return (
      <div
        key={label}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}
      >
        <Label>{label}</Label>
        <SliderTrack>
          {/* Fixed tick marks: ┣---+---┫ */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                right: 0,
                height: 1,
                background: '#c0c0c0',
                transform: 'translateY(-50%)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: '50%',
                width: 1,
                height: 10,
                background: '#c0c0c0',
                transform: 'translateY(-50%)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: 1,
                height: 6,
                background: '#c0c0c0',
                transform: 'translate(-50%, -50%)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '50%',
                width: 1,
                height: 10,
                background: '#c0c0c0',
                transform: 'translateY(-50%)',
              }}
            />
          </div>
          {/* Gamut range bar (informational only) */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: `${loP}%`,
              width: `${Math.max(hiP - loP, 0.1)}%`,
              height: 4,
              borderRadius: 2,
              background: '#a0a0a0',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="range"
            min={0}
            max={absMax}
            step={absMax / 1000}
            value={Math.max(lo, Math.min(hi, displayValue))}
            onChange={(e) => {
              const val = Math.max(lo, Math.min(hi, Number(e.target.value)));
              latestDraftRef.current = { ...latestDraftRef.current, [label]: val };
              setDraft((prev) => ({ ...prev, [label]: val }));
              const px = latestDraftRef.current.X ?? X;
              const py = latestDraftRef.current.Y ?? Y;
              const pz = latestDraftRef.current.Z ?? Z;
              const [pr, pg, pb] = xyzToRgb(px, py, pz);
              props.onPreviewRgb?.(pr, pg, pb);
            }}
            onPointerUp={() => commit(label)}
            onKeyUp={() => commit(label)}
            style={{
              position: 'absolute',
              margin: 0,
              left: 0,
              width: '100%',
              height: '100%',
              boxSizing: 'border-box',
            }}
          />
        </SliderTrack>
        <span
          style={{
            width: '30px',
            fontSize: '11px',
            textAlign: 'right',
            fontFamily: 'monospace',
            color: '#444',
          }}
        >
          {displayValue.toFixed(2)}
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
        {props.onHelpClick && <HelpIcon topic="xyz_space" onHelpClick={props.onHelpClick} />}
      </div>
      <div style={{ paddingTop: '6px' }}>
        {row('X', X, 0.95047, xLo, xHi)}
        {row('Y', Y, 1.0, yLo, yHi)}
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
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
    cursor: pointer;
  }

  input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 7px;
    height: 18px;
    border-radius: 3px;
    background: #4a90e2;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  input[type='range']::-moz-range-thumb {
    width: 7px;
    height: 18px;
    border-radius: 3px;
    background: #4a90e2;
    border: none;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  input[type='range']::-webkit-slider-runnable-track {
    background: transparent;
  }

  input[type='range']::-moz-range-track {
    background: transparent;
  }
`;

export default XyzSliders;
