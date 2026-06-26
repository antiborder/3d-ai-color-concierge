import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import styled from 'styled-components';
import type { ControlPaneProps, BridgeProps } from '../../../types/controlPane';
import ShapeButton from './ShapeButton';
import HelpIcon from '../../common/HelpIcon';

function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const rl = toLinear(r),
    gl = toLinear(g),
    bl = toLinear(b);
  const Xn = (rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375) / 0.95047;
  const Yn = rl * 0.2126729 + gl * 0.7151522 + bl * 0.072175;
  const Zn = (rl * 0.0193339 + gl * 0.119192 + bl * 0.9503041) / 1.08883;
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
  const gl = -X * 0.969266 + Y * 1.8760108 + Z * 0.041556;
  const bl = X * 0.0556434 - Y * 0.2040259 + Z * 1.0572252;
  const toSrgb = (c: number) => {
    const v = Math.max(0, Math.min(1, c));
    return Math.round((v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055) * 255);
  };
  return [toSrgb(rl), toSrgb(gl), toSrgb(bl)];
}

const LabSliders = (props: ControlPaneProps & BridgeProps) => {
  const [isVisible, setIsVisible] = useState(props.shape === 'Lab');

  const [L, a, b_init] = rgbToLab(
    Math.round(props.focusR),
    Math.round(props.focusG),
    Math.round(props.focusB)
  );
  const [sliderL, setSliderL] = useState(Math.round(L));
  const [sliderA, setSliderA] = useState(Math.round(a));
  const [sliderB, setSliderB] = useState(Math.round(b_init));

  const sliderDrivenRef = useRef(false);

  useEffect(() => {
    if (sliderDrivenRef.current) {
      sliderDrivenRef.current = false;
      return;
    }
    const [L2, a2, b2] = rgbToLab(
      Math.round(props.focusR),
      Math.round(props.focusG),
      Math.round(props.focusB)
    );
    setSliderL(Math.round(L2));
    setSliderA(Math.round(a2));
    setSliderB(Math.round(b2));
  }, [props.focusR, props.focusG, props.focusB]);

  const handleLChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setSliderL(val);
    sliderDrivenRef.current = true;
    const [r, g, b] = labToRgb(val, sliderA, sliderB);
    props.handleClick(r, g, b);
  };

  const handleAChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setSliderA(val);
    sliderDrivenRef.current = true;
    const [r, g, b] = labToRgb(sliderL, val, sliderB);
    props.handleClick(r, g, b);
  };

  const handleBChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setSliderB(val);
    sliderDrivenRef.current = true;
    const [r, g, b] = labToRgb(sliderL, sliderA, val);
    props.handleClick(r, g, b);
  };

  return (
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
        <ShapeButton
          {...props}
          setIsVisible={setIsVisible}
          shapeName={'Lab'}
          content={'CIE Lab (Lightness / a red-green / b yellow-blue)'}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          {props.onHelpClick && (
            <HelpIcon
              topic="lab"
              onHelpClick={(topic) => {
                setIsVisible(true);
                props.onHelpClick!(topic);
              }}
            />
          )}
          <button className="showSlidersButton" onClick={() => setIsVisible(!isVisible)}>
            {isVisible ? '▲' : '▼'}
          </button>
        </div>
      </div>
      {isVisible && (
        <>
          <LabSliderRow>
            <Label>L</Label>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={sliderL}
              onChange={handleLChange}
            />
            <Value>{sliderL}</Value>
            {props.onHelpClick && (
              <HelpIcon topic="lab_l" onHelpClick={props.onHelpClick} size={20} />
            )}
          </LabSliderRow>
          <LabSliderRow>
            <Label>a</Label>
            <input
              type="range"
              min="-128"
              max="127"
              step="1"
              value={sliderA}
              onChange={handleAChange}
            />
            <Value>{sliderA}</Value>
            {props.onHelpClick && (
              <HelpIcon topic="lab_a" onHelpClick={props.onHelpClick} size={20} />
            )}
          </LabSliderRow>
          <LabSliderRow>
            <Label>b</Label>
            <input
              type="range"
              min="-128"
              max="127"
              step="1"
              value={sliderB}
              onChange={handleBChange}
            />
            <Value>{sliderB}</Value>
            {props.onHelpClick && (
              <HelpIcon topic="lab_b" onHelpClick={props.onHelpClick} size={20} />
            )}
          </LabSliderRow>
        </>
      )}
    </div>
  );
};

const LabSliderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 12px;
  margin-bottom: 8px;
  width: 217px;
  gap: 4px;

  input[type='range'] {
    flex: 1;
    min-width: 80px;
  }
`;

const Label = styled.span`
  font-weight: 600;
  font-size: 16px;
  width: 24px;
  text-align: right;
  flex-shrink: 0;
`;

const Value = styled.div`
  width: 28px;
  font-size: 13px;
  text-align: right;
  flex-shrink: 0;
`;

export default LabSliders;
