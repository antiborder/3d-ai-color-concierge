import { useState, useEffect, useRef, useMemo, type ChangeEvent } from 'react';
import styled from 'styled-components';
import type { ControlPaneProps } from '../../../types/controlPane';
import ShapeButton from './ShapeButton';
import HelpIcon from '../../common/HelpIcon';
import { rgbToOklab, oklabToRgb } from '../../../utils/gamutUtils';

const TickMarks = () => (
  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
    <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: '#c0c0c0', transform: 'translateY(-50%)' }} />
    <div style={{ position: 'absolute', left: 0, top: '50%', width: 1, height: 10, background: '#c0c0c0', transform: 'translateY(-50%)' }} />
    <div style={{ position: 'absolute', left: '50%', top: '50%', width: 1, height: 6, background: '#c0c0c0', transform: 'translate(-50%, -50%)' }} />
    <div style={{ position: 'absolute', right: 0, top: '50%', width: 1, height: 10, background: '#c0c0c0', transform: 'translateY(-50%)' }} />
  </div>
);

const OkLabSliders = (props: ControlPaneProps) => {
  const [isVisible, setIsVisible] = useState(props.shape === 'OKLAB');
  useEffect(() => {
    if (props.shape === 'OKLAB') setIsVisible(true);
  }, [props.shape]);

  const [oklabMain, setOklabMain] = useState<'L' | 'a' | 'b'>('L');

  const initOklab = rgbToOklab(Math.round(props.focusR), Math.round(props.focusG), Math.round(props.focusB));
  const [sliderL, setSliderL] = useState(initOklab[0]);
  const [sliderA, setSliderA] = useState(initOklab[1]);
  const [sliderB, setSliderB] = useState(initOklab[2]);

  const sliderDrivenRef = useRef(false);
  const isDraggingRef = useRef(false);
  const sliderLRef = useRef(sliderL);
  const sliderARef = useRef(sliderA);
  const sliderBRef = useRef(sliderB);
  const handleClickRef = useRef(props.handleClick);
  sliderLRef.current = sliderL;
  sliderARef.current = sliderA;
  sliderBRef.current = sliderB;
  handleClickRef.current = props.handleClick;

  useEffect(() => {
    if (sliderDrivenRef.current) { sliderDrivenRef.current = false; return; }
    if (props.isPreviewActive) return;
    const [L2, a2, b2] = rgbToOklab(Math.round(props.focusR), Math.round(props.focusG), Math.round(props.focusB));
    setSliderL(L2);
    setSliderA(a2);
    setSliderB(b2);
  }, [props.focusR, props.focusG, props.focusB, props.isPreviewActive]);

  // Gradient: 12 stops along each axis
  const oklabGradients = useMemo(() => {
    const N = 12;
    const stops = (axis: 'L' | 'a' | 'b', lo: number, hi: number) =>
      Array.from({ length: N }, (_, i) => {
        const t = i / (N - 1);
        const v = lo + t * (hi - lo);
        const [r, g, b2] =
          axis === 'L' ? oklabToRgb(v, sliderA, sliderB)
          : axis === 'a' ? oklabToRgb(sliderL, v, sliderB)
          : oklabToRgb(sliderL, sliderA, v);
        return `rgb(${r},${g},${b2}) ${(t * 100).toFixed(1)}%`;
      }).join(', ');
    return {
      L: `linear-gradient(to right, ${stops('L', 0, 1)})`,
      a: `linear-gradient(to right, ${stops('a', -0.5, 0.5)})`,
      b: `linear-gradient(to right, ${stops('b', -0.5, 0.5)})`,
    };
  }, [sliderL, sliderA, sliderB]);

  const handleChange = (axis: 'L' | 'a' | 'b', e: ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (axis === 'L') setSliderL(val);
    else if (axis === 'a') setSliderA(val);
    else setSliderB(val);
    sliderDrivenRef.current = true;
    isDraggingRef.current = true;
    const [r, g, bv] = oklabToRgb(
      axis === 'L' ? val : sliderLRef.current,
      axis === 'a' ? val : sliderARef.current,
      axis === 'b' ? val : sliderBRef.current,
    );
    props.onPreviewRgb?.(r, g, bv);
  };

  const commit = () => {
    isDraggingRef.current = false;
    const [r, g, bv] = oklabToRgb(sliderLRef.current, sliderARef.current, sliderBRef.current);
    handleClickRef.current(r, g, bv);
    props.onClearPreviewRgb?.();
  };

  // zero-point percentage on the a/b sliders (range -0.5 to 0.5 → 50%)
  const zeroP = 50;

  const mainBtn = (channel: 'L' | 'a' | 'b') => {
    const isActive = oklabMain === channel && props.shape === 'OKLAB';
    return (
      <button
        onClick={() => setOklabMain(channel)}
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
    );
  };

  return (
    <div className="controlPanel">
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', height: '24px' }}>
        <ShapeButton
          {...props}
          setIsVisible={setIsVisible}
          shapeName="OKLAB"
          content="OkLab (Lightness / a / b) — perceptually uniform"
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          {props.onHelpClick && (
            <HelpIcon topic="oklab" onHelpClick={(topic) => { setIsVisible(true); props.onHelpClick!(topic); }} />
          )}
          <button className="showSlidersButton" onClick={() => setIsVisible(!isVisible)}>
            {isVisible ? '▲' : '▼'}
          </button>
        </div>
      </div>
      {isVisible && (
        <>
          {/* L slider: 0 → 1 */}
          <OkLabSliderRow>
            {mainBtn('L')}
            <Label>L</Label>
            <SliderTrack>
              <TickMarks />
              <div style={{ position: 'absolute', top: '50%', left: 0, width: '100%', height: 8, borderRadius: 4, background: oklabGradients.L, transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input type="range" min={0} max={1} step={0.001} value={Math.max(0, Math.min(1, sliderL))}
                onChange={(e) => handleChange('L', e)} onPointerUp={commit} onKeyUp={commit}
                style={{ position: 'absolute', margin: 0, left: 0, width: '100%', height: '100%', boxSizing: 'border-box' }} />
            </SliderTrack>
            <Value>{sliderL.toFixed(3)}</Value>
            {props.onHelpClick && <HelpIcon topic="oklab_l" onHelpClick={props.onHelpClick} size={20} />}
          </OkLabSliderRow>

          {/* a slider: -0.5 → 0.5 */}
          <OkLabSliderRow>
            {mainBtn('a')}
            <Label>a</Label>
            <SliderTrack>
              <TickMarks />
              <div style={{ position: 'absolute', top: '50%', left: 0, width: '100%', height: 8, borderRadius: 4, background: oklabGradients.a, transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              {/* center tick */}
              <div style={{ position: 'absolute', left: `${zeroP}%`, top: '50%', width: 1, height: 14, background: '#999', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }} />
              <input type="range" min={-0.5} max={0.5} step={0.001} value={sliderA}
                onChange={(e) => handleChange('a', e)} onPointerUp={commit} onKeyUp={commit}
                style={{ position: 'absolute', margin: 0, left: 0, width: '100%', height: '100%', boxSizing: 'border-box' }} />
            </SliderTrack>
            <Value>{sliderA.toFixed(3)}</Value>
            {props.onHelpClick && <HelpIcon topic="oklab_a" onHelpClick={props.onHelpClick} size={20} />}
          </OkLabSliderRow>

          {/* b slider: -0.5 → 0.5 */}
          <OkLabSliderRow>
            {mainBtn('b')}
            <Label>b</Label>
            <SliderTrack>
              <TickMarks />
              <div style={{ position: 'absolute', top: '50%', left: 0, width: '100%', height: 8, borderRadius: 4, background: oklabGradients.b, transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', left: `${zeroP}%`, top: '50%', width: 1, height: 14, background: '#999', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }} />
              <input type="range" min={-0.5} max={0.5} step={0.001} value={sliderB}
                onChange={(e) => handleChange('b', e)} onPointerUp={commit} onKeyUp={commit}
                style={{ position: 'absolute', margin: 0, left: 0, width: '100%', height: '100%', boxSizing: 'border-box' }} />
            </SliderTrack>
            <Value>{sliderB.toFixed(3)}</Value>
            {props.onHelpClick && <HelpIcon topic="oklab_b" onHelpClick={props.onHelpClick} size={20} />}
          </OkLabSliderRow>
        </>
      )}
    </div>
  );
};

const OkLabSliderRow = styled.div`
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

  input[type='range']::-webkit-slider-runnable-track { background: transparent; }
  input[type='range']::-moz-range-track { background: transparent; }
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

export default OkLabSliders;
