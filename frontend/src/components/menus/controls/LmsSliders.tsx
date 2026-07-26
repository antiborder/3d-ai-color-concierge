import { useState, useEffect, useRef, useMemo, type ChangeEvent } from 'react';
import styled from 'styled-components';
import type { ControlPaneProps } from '../../../types/controlPane';
import ShapeButton from './ShapeButton';
import HelpIcon from '../../common/HelpIcon';

// M1 matrix: linear RGB → LMS (OkLab cone fundamentals)
function rgbToLms(r: number, g: number, b: number): [number, number, number] {
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const rl = toLinear(r),
    gl = toLinear(g),
    bl = toLinear(b);
  return [
    0.4122214708 * rl + 0.5363325363 * gl + 0.0514459929 * bl,
    0.2119034982 * rl + 0.6806995451 * gl + 0.1073969566 * bl,
    0.0883024619 * rl + 0.2817188376 * gl + 0.6299787005 * bl,
  ];
}

// M1 inverse: LMS → gamma-corrected RGB 0-255 (clamped to sRGB)
function lmsToRgb(L: number, M: number, S: number): [number, number, number] {
  const toGamma = (c: number) => {
    const v = Math.max(0, Math.min(1, c));
    return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  };
  const rl = 4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S;
  const gl = -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S;
  const bl = -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S;
  return [Math.round(toGamma(rl) * 255), Math.round(toGamma(gl) * 255), Math.round(toGamma(bl) * 255)];
}

const LmsSliders = (props: ControlPaneProps) => {
  const [isVisible, setIsVisible] = useState(props.shape === 'LMS');
  useEffect(() => {
    if (props.shape === 'LMS') setIsVisible(true);
  }, [props.shape]);

  const [lmsMain, setLmsMain] = useState<'L' | 'M' | 'S'>('L');

  const init = rgbToLms(Math.round(props.focusR), Math.round(props.focusG), Math.round(props.focusB));
  const [sliderL, setSliderL] = useState(init[0]);
  const [sliderM, setSliderM] = useState(init[1]);
  const [sliderS, setSliderS] = useState(init[2]);

  const sliderDrivenRef = useRef(false);
  const isDraggingRef = useRef(false);
  const sliderLRef = useRef(sliderL);
  const sliderMRef = useRef(sliderM);
  const sliderSRef = useRef(sliderS);
  const handleClickRef = useRef(props.handleClick);
  sliderLRef.current = sliderL;
  sliderMRef.current = sliderM;
  sliderSRef.current = sliderS;
  handleClickRef.current = props.handleClick;

  // Sync sliders when external color changes
  useEffect(() => {
    if (sliderDrivenRef.current) { sliderDrivenRef.current = false; return; }
    if (props.isPreviewActive) return;
    const [l2, m2, s2] = rgbToLms(Math.round(props.focusR), Math.round(props.focusG), Math.round(props.focusB));
    setSliderL(l2);
    setSliderM(m2);
    setSliderS(s2);
  }, [props.focusR, props.focusG, props.focusB, props.isPreviewActive]);

  // Gradient: 12 color stops along each axis
  const lmsGradients = useMemo(() => {
    const N = 12;
    const stops = (axis: 'L' | 'M' | 'S') =>
      Array.from({ length: N }, (_, i) => {
        const t = i / (N - 1);
        const [r, g, b] =
          axis === 'L' ? lmsToRgb(t, sliderM, sliderS)
          : axis === 'M' ? lmsToRgb(sliderL, t, sliderS)
          : lmsToRgb(sliderL, sliderM, t);
        return `rgb(${r},${g},${b}) ${(t * 100).toFixed(1)}%`;
      }).join(', ');
    return {
      L: `linear-gradient(to right, ${stops('L')})`,
      M: `linear-gradient(to right, ${stops('M')})`,
      S: `linear-gradient(to right, ${stops('S')})`,
    };
  }, [sliderL, sliderM, sliderS]);

  const handleChange = (axis: 'L' | 'M' | 'S', e: ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(0, Math.min(1, Number(e.target.value)));
    if (axis === 'L') setSliderL(val);
    else if (axis === 'M') setSliderM(val);
    else setSliderS(val);
    sliderDrivenRef.current = true;
    isDraggingRef.current = true;
    const [r, g, b] = lmsToRgb(
      axis === 'L' ? val : sliderLRef.current,
      axis === 'M' ? val : sliderMRef.current,
      axis === 'S' ? val : sliderSRef.current,
    );
    props.onPreviewRgb?.(r, g, b);
  };

  const commit = () => {
    isDraggingRef.current = false;
    const [r, g, b] = lmsToRgb(sliderLRef.current, sliderMRef.current, sliderSRef.current);
    handleClickRef.current(r, g, b);
    props.onClearPreviewRgb?.();
  };

  const rows: { label: 'L' | 'M' | 'S'; value: number }[] = [
    { label: 'L', value: sliderL },
    { label: 'M', value: sliderM },
    { label: 'S', value: sliderS },
  ];

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
          shapeName="LMS"
          content="LMS — cone cell responses (Long / Medium / Short)"
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          {props.onHelpClick && (
            <HelpIcon
              topic="lms"
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
          {rows.map(({ label, value }) => {
            const isActive = lmsMain === label && props.shape === 'LMS';
            const clamped = Math.max(0, Math.min(1, value));
            return (
              <LmsSliderRow key={label}>
                <button
                  onClick={() => setLmsMain(label)}
                  className={isActive ? 'mainElement labelOn' : 'mainElement labelOff'}
                >
                  {isActive ? (
                    <svg width="14" height="14" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <circle cx="5" cy="5" r="7" fill="#555555" />
                      <path d="M2 5L4 7.4L8 2.2" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <circle cx="5" cy="5" r="7" fill="#555555" />
                    </svg>
                  )}
                </button>
                <Label>{label}</Label>
                <SliderTrack>
                  {/* Tick marks */}
                  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                    <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: '#c0c0c0', transform: 'translateY(-50%)' }} />
                    <div style={{ position: 'absolute', left: 0, top: '50%', width: 1, height: 10, background: '#c0c0c0', transform: 'translateY(-50%)' }} />
                    <div style={{ position: 'absolute', left: '50%', top: '50%', width: 1, height: 6, background: '#c0c0c0', transform: 'translate(-50%, -50%)' }} />
                    <div style={{ position: 'absolute', right: 0, top: '50%', width: 1, height: 10, background: '#c0c0c0', transform: 'translateY(-50%)' }} />
                  </div>
                  {/* Gradient bar (full 0–1 range) */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: 0,
                      width: '100%',
                      height: 8,
                      borderRadius: 4,
                      background: lmsGradients[label],
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                    }}
                  />
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.001}
                    value={clamped}
                    onChange={(e) => handleChange(label, e)}
                    onPointerUp={commit}
                    onKeyUp={commit}
                    style={{ position: 'absolute', margin: 0, left: 0, width: '100%', height: '100%', boxSizing: 'border-box' }}
                  />
                </SliderTrack>
                <Value>{clamped.toFixed(3)}</Value>
                {props.onHelpClick && (
                  <HelpIcon topic={`lms_${label.toLowerCase()}`} onHelpClick={props.onHelpClick} size={20} />
                )}
              </LmsSliderRow>
            );
          })}
        </>
      )}
    </div>
  );
};

const LmsSliderRow = styled.div`
  display: flex;
  align-items: center;
  margin-top: 12px;
  margin-bottom: 8px;
  gap: 2px;
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

const Label = styled.span`
  font-weight: 600;
  font-size: 16px;
  width: 12px;
  text-align: right;
  flex-shrink: 0;
`;

const Value = styled.div`
  width: 36px;
  font-size: 13px;
  text-align: right;
  flex-shrink: 0;
`;

export default LmsSliders;
