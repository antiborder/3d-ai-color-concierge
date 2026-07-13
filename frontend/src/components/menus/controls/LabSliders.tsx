import { useState, useEffect, useRef, useMemo, type ChangeEvent } from 'react';
import styled from 'styled-components';
import type { ControlPaneProps, BridgeProps } from '../../../types/controlPane';
import ShapeButton from './ShapeButton';
import HelpIcon from '../../common/HelpIcon';
import { rgbToLab, labToRgb, computeGamutRange } from '../../../utils/gamutUtils';

const LabSliders = (props: ControlPaneProps & BridgeProps) => {
  const [isVisible, setIsVisible] = useState(props.shape === 'Lab');
  useEffect(() => {
    if (props.shape === 'Lab') setIsVisible(true);
  }, [props.shape]);

  const [L, a, b_init] = rgbToLab(
    Math.round(props.focusR),
    Math.round(props.focusG),
    Math.round(props.focusB)
  );
  const [sliderL, setSliderL] = useState(Math.round(L));
  const [sliderA, setSliderA] = useState(Math.round(a));
  const [sliderB, setSliderB] = useState(Math.round(b_init));

  const sliderDrivenRef = useRef(false);
  const isDraggingRef = useRef(false);

  // Refs to avoid stale closures in gamut-clamp effects
  const sliderLRef = useRef(sliderL);
  const sliderARef = useRef(sliderA);
  const sliderBRef = useRef(sliderB);
  const handleClickRef = useRef(props.handleClick);
  sliderLRef.current = sliderL;
  sliderARef.current = sliderA;
  sliderBRef.current = sliderB;
  handleClickRef.current = props.handleClick;

  const gamutRanges = useMemo(
    () => ({
      lRange: computeGamutRange('L', sliderL, sliderA, sliderB, 0, 100),
      aRange: computeGamutRange('a', sliderL, sliderA, sliderB, -128, 127),
      bRange: computeGamutRange('b', sliderL, sliderA, sliderB, -128, 127),
    }),
    [sliderL, sliderA, sliderB]
  );

  // Clamp L when lRange changes (due to A or B changing)
  useEffect(() => {
    const [lo, hi] = gamutRanges.lRange;
    const curr = sliderLRef.current;
    const clamped = Math.max(lo, Math.min(hi, curr));
    if (clamped !== curr) {
      setSliderL(clamped);
      sliderDrivenRef.current = true;
      if (!isDraggingRef.current) {
        const [r, g, b] = labToRgb(clamped, sliderARef.current, sliderBRef.current);
        handleClickRef.current(r, g, b);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gamutRanges.lRange[0], gamutRanges.lRange[1]]);

  // Clamp A when aRange changes (due to L or B changing)
  useEffect(() => {
    const [lo, hi] = gamutRanges.aRange;
    const curr = sliderARef.current;
    const clamped = Math.max(lo, Math.min(hi, curr));
    if (clamped !== curr) {
      setSliderA(clamped);
      sliderDrivenRef.current = true;
      if (!isDraggingRef.current) {
        const [r, g, b] = labToRgb(sliderLRef.current, clamped, sliderBRef.current);
        handleClickRef.current(r, g, b);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gamutRanges.aRange[0], gamutRanges.aRange[1]]);

  // Clamp B when bRange changes (due to L or A changing)
  useEffect(() => {
    const [lo, hi] = gamutRanges.bRange;
    const curr = sliderBRef.current;
    const clamped = Math.max(lo, Math.min(hi, curr));
    if (clamped !== curr) {
      setSliderB(clamped);
      sliderDrivenRef.current = true;
      if (!isDraggingRef.current) {
        const [r, g, b] = labToRgb(sliderLRef.current, sliderARef.current, clamped);
        handleClickRef.current(r, g, b);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gamutRanges.bRange[0], gamutRanges.bRange[1]]);

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
    const val = Math.max(
      gamutRanges.lRange[0],
      Math.min(gamutRanges.lRange[1], Number(e.target.value))
    );
    setSliderL(val);
    sliderDrivenRef.current = true;
    isDraggingRef.current = true;
  };

  const handleAChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(
      gamutRanges.aRange[0],
      Math.min(gamutRanges.aRange[1], Number(e.target.value))
    );
    setSliderA(val);
    sliderDrivenRef.current = true;
    isDraggingRef.current = true;
  };

  const handleBChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(
      gamutRanges.bRange[0],
      Math.min(gamutRanges.bRange[1], Number(e.target.value))
    );
    setSliderB(val);
    sliderDrivenRef.current = true;
    isDraggingRef.current = true;
  };

  const commitLab = () => {
    isDraggingRef.current = false;
    const [r, g, b] = labToRgb(sliderLRef.current, sliderARef.current, sliderBRef.current);
    handleClickRef.current(r, g, b);
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
          {[
            {
              label: 'L',
              range: gamutRanges.lRange,
              absMin: 0,
              absMax: 100,
              value: sliderL,
              onChange: handleLChange,
              helpTopic: 'lab_l',
            },
            {
              label: 'a',
              range: gamutRanges.aRange,
              absMin: -128,
              absMax: 127,
              value: sliderA,
              onChange: handleAChange,
              helpTopic: 'lab_a',
            },
            {
              label: 'b',
              range: gamutRanges.bRange,
              absMin: -128,
              absMax: 127,
              value: sliderB,
              onChange: handleBChange,
              helpTopic: 'lab_b',
            },
          ].map(({ label, range, absMin, absMax, value, onChange, helpTopic }) => {
            const span = absMax - absMin;
            const loP = ((range[0] - absMin) / span) * 100;
            const hiP = ((range[1] - absMin) / span) * 100;
            const clampedValue = Math.max(range[0], Math.min(range[1], value));
            const isActive = props.labMainElement === label && props.shape === 'Lab';
            return (
              <LabSliderRow key={label}>
                <button
                  onClick={() => props.setLabMainElement(label as 'L' | 'a' | 'b')}
                  className={isActive ? 'mainElement labelOn' : 'mainElement labelOff'}
                >
                  {isActive ? (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 10 10"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden
                    >
                      <circle cx="5" cy="5" r="7" fill="#555555" />
                      <path
                        d="M2 5L4 7.4L8 2.2"
                        stroke="#ffffff"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 10 10"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden
                    >
                      <circle cx="5" cy="5" r="7" fill="#555555" />
                    </svg>
                  )}
                </button>
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
                    min={absMin}
                    max={absMax}
                    step="1"
                    value={clampedValue}
                    onChange={onChange}
                    onPointerUp={commitLab}
                    onKeyUp={commitLab}
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
                <Value>{clampedValue}</Value>
                {props.onHelpClick && (
                  <HelpIcon topic={helpTopic} onHelpClick={props.onHelpClick} size={20} />
                )}
              </LabSliderRow>
            );
          })}
        </>
      )}
    </div>
  );
};

const LabSliderRow = styled.div`
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
  width: 28px;
  font-size: 13px;
  text-align: right;
  flex-shrink: 0;
`;

export default LabSliders;
