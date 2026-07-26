import { useState, useEffect, useRef, useMemo, type ChangeEvent } from 'react';
import styled from 'styled-components';
import type { ControlPaneProps, BridgeProps } from '../../../types/controlPane';
import ShapeButton from './ShapeButton';
import HelpIcon from '../../common/HelpIcon';
import { rgbToOklch, oklchToRgbGamutMapped, maxInGamutChromaOklch } from '../../../utils/gamutUtils';

const TickMarks = () => (
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
);

const OklchSliders = (props: ControlPaneProps & BridgeProps) => {
  const [isVisible, setIsVisible] = useState(props.shape === 'OKLCH');
  useEffect(() => {
    if (props.shape === 'OKLCH') setIsVisible(true);
  }, [props.shape]);

  const initial = rgbToOklch(props.focusR, props.focusG, props.focusB);

  const [sliderL, setSliderL] = useState(initial[0]);
  const [sliderC, setSliderC] = useState(initial[1]);
  const [sliderH, setSliderH] = useState(Math.round(initial[2]));

  const sliderDrivenRef = useRef(false);
  const isDraggingRef = useRef(false);

  const sliderLRef = useRef(sliderL);
  const sliderCRef = useRef(sliderC);
  const sliderHRef = useRef(sliderH);
  const handleClickRef = useRef(props.handleClick);
  sliderLRef.current = sliderL;
  sliderCRef.current = sliderC;
  sliderHRef.current = sliderH;
  handleClickRef.current = props.handleClick;

  const gamutRanges = useMemo(() => {
    const maxC = maxInGamutChromaOklch(sliderL, sliderH);

    // Find L range by sampling in steps of 0.01
    let lLo = 0;
    let lHi = 1;
    for (let v = 0; v <= 100; v++) {
      const Lv = v / 100;
      const [r, g, b] = oklchToRgbGamutMapped(Lv, sliderC, sliderH);
      const [rL] = rgbToOklch(r, g, b);
      if (Math.abs(rL - Lv) < 0.05) { lLo = Lv; break; }
    }
    for (let v = 100; v >= 0; v--) {
      const Lv = v / 100;
      const [r, g, b] = oklchToRgbGamutMapped(Lv, sliderC, sliderH);
      const [rL] = rgbToOklch(r, g, b);
      if (Math.abs(rL - Lv) < 0.05) { lHi = Lv; break; }
    }

    return {
      lRange: [lLo, lHi] as [number, number],
      cRange: [0, maxC] as [number, number],
    };
  }, [sliderL, sliderC, sliderH]);

  useEffect(() => {
    const [, hi] = gamutRanges.cRange;
    const curr = sliderCRef.current;
    const clamped = Math.min(hi, curr);
    if (clamped !== curr) {
      setSliderC(clamped);
      sliderDrivenRef.current = true;
      if (!isDraggingRef.current) {
        const [r, g, b] = oklchToRgbGamutMapped(sliderLRef.current, clamped, sliderHRef.current);
        handleClickRef.current(r, g, b);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gamutRanges.cRange[1]]);

  useEffect(() => {
    if (sliderDrivenRef.current) {
      sliderDrivenRef.current = false;
      return;
    }
    if (props.isPreviewActive) return;
    const [L, C, H] = rgbToOklch(props.focusR, props.focusG, props.focusB);
    setSliderL(L);
    setSliderC(C);
    setSliderH(Math.round(H));
  }, [props.focusR, props.focusG, props.focusB, props.isPreviewActive]);

  const handleLChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(
      gamutRanges.lRange[0],
      Math.min(gamutRanges.lRange[1], Number(e.target.value))
    );
    setSliderL(val);
    sliderDrivenRef.current = true;
    isDraggingRef.current = true;
    const [r, g, b] = oklchToRgbGamutMapped(val, sliderC, sliderH);
    props.onPreviewRgb?.(r, g, b);
  };

  const handleCChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(0, Math.min(gamutRanges.cRange[1], Number(e.target.value)));
    setSliderC(val);
    sliderDrivenRef.current = true;
    isDraggingRef.current = true;
    const [r, g, b] = oklchToRgbGamutMapped(sliderL, val, sliderH);
    props.onPreviewRgb?.(r, g, b);
  };

  const handleHChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setSliderH(val);
    sliderDrivenRef.current = true;
    isDraggingRef.current = true;
    const [r, g, b] = oklchToRgbGamutMapped(sliderL, sliderC, val);
    props.onPreviewRgb?.(r, g, b);
  };

  const commitOklch = () => {
    isDraggingRef.current = false;
    const [r, g, b] = oklchToRgbGamutMapped(sliderLRef.current, sliderCRef.current, sliderHRef.current);
    handleClickRef.current(r, g, b);
    props.onClearPreviewRgb?.();
  };

  const oklchGradients = useMemo(() => {
    const N = 12;
    const lStops = Array.from({ length: N }, (_, i) => {
      const t = i / (N - 1);
      const Lv = gamutRanges.lRange[0] + t * (gamutRanges.lRange[1] - gamutRanges.lRange[0]);
      const [r, g, b] = oklchToRgbGamutMapped(Lv, sliderC, sliderH);
      return `rgb(${r},${g},${b}) ${(t * 100).toFixed(1)}%`;
    }).join(', ');
    const cStops = Array.from({ length: N }, (_, i) => {
      const t = i / (N - 1);
      const Cv = t * gamutRanges.cRange[1];
      const [r, g, b] = oklchToRgbGamutMapped(sliderL, Cv, sliderH);
      return `rgb(${r},${g},${b}) ${(t * 100).toFixed(1)}%`;
    }).join(', ');
    const hStops = Array.from({ length: 13 }, (_, i) => {
      const Hv = (i / 12) * 360;
      const [r, g, b] = oklchToRgbGamutMapped(sliderL, sliderC, Hv);
      return `rgb(${r},${g},${b}) ${((i / 12) * 100).toFixed(1)}%`;
    }).join(', ');
    return {
      L: `linear-gradient(to right, ${lStops})`,
      C: `linear-gradient(to right, ${cStops})`,
      H: `linear-gradient(to right, ${hStops})`,
    };
  }, [sliderL, sliderC, sliderH, gamutRanges]);

  const clampedL = Math.max(gamutRanges.lRange[0], Math.min(gamutRanges.lRange[1], sliderL));
  const clampedC = Math.max(0, Math.min(gamutRanges.cRange[1], sliderC));

  const lLoP = (gamutRanges.lRange[0] / 1) * 100;
  const lHiP = (gamutRanges.lRange[1] / 1) * 100;
  const cHiP = (gamutRanges.cRange[1] / 0.4) * 100;

  const mainBtn = (channel: 'L' | 'C' | 'H') => {
    const isActive = props.oklchMainElement === channel && props.shape === 'OKLCH';
    return (
      <button
        onClick={() => props.setOklchMainElement(channel)}
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
    );
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
          shapeName={'OKLCH'}
          content={'OkLCH (Lightness / Chroma / Hue) — perceptually uniform'}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          {props.onHelpClick && (
            <HelpIcon
              topic="oklch"
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
          {/* L slider */}
          <OklchSliderRow>
            {mainBtn('L')}
            <Label>L</Label>
            <SliderTrack>
              <TickMarks />
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: `${lLoP}%`,
                  width: `${Math.max(lHiP - lLoP, 0.1)}%`,
                  height: 8,
                  borderRadius: 4,
                  background: oklchGradients.L,
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="range"
                min={0}
                max={1}
                step="0.01"
                value={clampedL}
                onChange={handleLChange}
                onPointerUp={commitOklch}
                onKeyUp={commitOklch}
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
            <Value>{clampedL.toFixed(2)}</Value>
            {props.onHelpClick && (
              <HelpIcon topic="oklch_l" onHelpClick={props.onHelpClick} size={20} />
            )}
          </OklchSliderRow>

          {/* C slider */}
          <OklchSliderRow>
            {mainBtn('C')}
            <Label>C</Label>
            <SliderTrack>
              <TickMarks />
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  width: `${Math.max(cHiP, 0.1)}%`,
                  height: 8,
                  borderRadius: 4,
                  background: oklchGradients.C,
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="range"
                min={0}
                max={0.4}
                step="0.001"
                value={clampedC}
                onChange={handleCChange}
                onPointerUp={commitOklch}
                onKeyUp={commitOklch}
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
            <Value>{clampedC.toFixed(3)}</Value>
            {props.onHelpClick && (
              <HelpIcon topic="oklch_c" onHelpClick={props.onHelpClick} size={20} />
            )}
          </OklchSliderRow>

          {/* H slider */}
          <OklchSliderRow>
            {mainBtn('H')}
            <Label>H</Label>
            <SliderTrack>
              <TickMarks />
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  width: '100%',
                  height: 8,
                  borderRadius: 4,
                  background: oklchGradients.H,
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="range"
                min={0}
                max={359}
                step="1"
                value={sliderH}
                onChange={handleHChange}
                onPointerUp={commitOklch}
                onKeyUp={commitOklch}
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
            <Value>{sliderH}</Value>
            {props.onHelpClick && (
              <HelpIcon topic="oklch_h" onHelpClick={props.onHelpClick} size={20} />
            )}
          </OklchSliderRow>
        </>
      )}
    </div>
  );
};

const OklchSliderRow = styled.div`
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
  width: 34px;
  font-size: 13px;
  text-align: right;
  flex-shrink: 0;
`;

export default OklchSliders;
