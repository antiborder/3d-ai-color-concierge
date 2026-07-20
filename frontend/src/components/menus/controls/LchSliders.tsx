import { useState, useEffect, useRef, useMemo, type ChangeEvent } from 'react';
import styled from 'styled-components';
import type { ControlPaneProps, BridgeProps } from '../../../types/controlPane';
import ShapeButton from './ShapeButton';
import HelpIcon from '../../common/HelpIcon';
import { getMunsellHVC, munsellHVCtoRgb } from '../../../utils/munsellUtils';

// sliderL: 0-100 (= CIE L*), sliderC: 0-100 (= C* = chroma*5), sliderH: 0-359 degrees
function isInGamutLCH(L: number, C: number, H: number): boolean {
  const theta = (H / 360) * 2 * Math.PI;
  const a = C * Math.cos(theta);
  const b = C * Math.sin(theta);
  const fy = (L + 16) / 116;
  const fInv = (t: number) => (t > 0.008856 ? t * t * t : (t - 16 / 116) / 7.787);
  const X = fInv(a / 500 + fy) * 0.95047;
  const Y = fInv(fy);
  const Z = fInv(fy - b / 200) * 1.08883;
  const rl = X * 3.2404542 - Y * 1.5371385 - Z * 0.4985314;
  const gl = -X * 0.969266 + Y * 1.8760108 + Z * 0.041556;
  const bl = X * 0.0556434 - Y * 0.2040259 + Z * 1.0572252;
  const EPS = 0.005;
  return rl >= -EPS && rl <= 1 + EPS && gl >= -EPS && gl <= 1 + EPS && bl >= -EPS && bl <= 1 + EPS;
}

function computeLchGamutRange(
  axis: 'L' | 'C',
  L: number,
  C: number,
  H: number,
  min: number,
  max: number
): [number, number] {
  let lo = max + 1;
  let hi = min - 1;
  for (let v = min; v <= max; v++) {
    if (isInGamutLCH(axis === 'L' ? v : L, axis === 'C' ? v : C, H)) {
      lo = v;
      break;
    }
  }
  if (lo > max) return [min, max];
  for (let v = max; v >= min; v--) {
    if (isInGamutLCH(axis === 'L' ? v : L, axis === 'C' ? v : C, H)) {
      hi = v;
      break;
    }
  }
  return [lo, hi];
}

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

const LchSliders = (props: ControlPaneProps & BridgeProps) => {
  const [isVisible, setIsVisible] = useState(props.shape === 'LCH');
  useEffect(() => {
    if (props.shape === 'LCH') setIsVisible(true);
  }, [props.shape]);

  const initial = getMunsellHVC(props.focusR, props.focusG, props.focusB);

  const [sliderL, setSliderL] = useState(Math.round(initial.value * 10));
  const [sliderC, setSliderC] = useState(Math.round(initial.chroma * 5));
  const [sliderH, setSliderH] = useState(
    initial.hueNum !== null ? Math.round((initial.hueNum / 100) * 360) : 0
  );

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

  const gamutRanges = useMemo(
    () => ({
      lRange: computeLchGamutRange('L', sliderL, sliderC, sliderH, 0, 100),
      cRange: computeLchGamutRange('C', sliderL, sliderC, sliderH, 0, 100),
    }),
    [sliderL, sliderC, sliderH]
  );

  useEffect(() => {
    const [lo, hi] = gamutRanges.lRange;
    const curr = sliderLRef.current;
    const clamped = Math.max(lo, Math.min(hi, curr));
    if (clamped !== curr) {
      setSliderL(clamped);
      sliderDrivenRef.current = true;
      if (!isDraggingRef.current) {
        const hueNum = sliderCRef.current === 0 ? null : (sliderHRef.current / 360) * 100;
        const [r, g, b] = munsellHVCtoRgb(hueNum, clamped / 10, sliderCRef.current / 5);
        handleClickRef.current(r, g, b);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gamutRanges.lRange[0], gamutRanges.lRange[1]]);

  useEffect(() => {
    const [lo, hi] = gamutRanges.cRange;
    const curr = sliderCRef.current;
    const clamped = Math.max(lo, Math.min(hi, curr));
    if (clamped !== curr) {
      setSliderC(clamped);
      sliderDrivenRef.current = true;
      if (!isDraggingRef.current) {
        const hueNum = clamped === 0 ? null : (sliderHRef.current / 360) * 100;
        const [r, g, b] = munsellHVCtoRgb(hueNum, sliderLRef.current / 10, clamped / 5);
        handleClickRef.current(r, g, b);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gamutRanges.cRange[0], gamutRanges.cRange[1]]);

  useEffect(() => {
    if (sliderDrivenRef.current) {
      sliderDrivenRef.current = false;
      return;
    }
    if (props.isPreviewActive) return;
    const { hueNum, value, chroma } = getMunsellHVC(props.focusR, props.focusG, props.focusB);
    setSliderL(Math.round(value * 10));
    setSliderC(Math.round(chroma * 5));
    setSliderH(hueNum !== null ? Math.round((hueNum / 100) * 360) : 0);
  }, [props.focusR, props.focusG, props.focusB, props.isPreviewActive]);

  const handleLChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(
      gamutRanges.lRange[0],
      Math.min(gamutRanges.lRange[1], Number(e.target.value))
    );
    setSliderL(val);
    sliderDrivenRef.current = true;
    isDraggingRef.current = true;
    const hueNum = sliderC === 0 ? null : (sliderH / 360) * 100;
    const effectiveC = sliderC === 0 ? 10 : sliderC;
    const [r, g, b] = munsellHVCtoRgb(hueNum, val / 10, effectiveC / 5);
    props.onPreviewRgb?.(r, g, b);
  };

  const handleCChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(
      gamutRanges.cRange[0],
      Math.min(gamutRanges.cRange[1], Number(e.target.value))
    );
    setSliderC(val);
    sliderDrivenRef.current = true;
    isDraggingRef.current = true;
    const hueNum = val === 0 ? null : (sliderH / 360) * 100;
    const effectiveC = val === 0 ? 10 : val;
    const [r, g, b] = munsellHVCtoRgb(hueNum, sliderL / 10, effectiveC / 5);
    props.onPreviewRgb?.(r, g, b);
  };

  const handleHChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setSliderH(val);
    sliderDrivenRef.current = true;
    isDraggingRef.current = true;
    const hueNum = sliderC === 0 ? null : (val / 360) * 100;
    const effectiveC = sliderC === 0 ? 10 : sliderC;
    const [r, g, b] = munsellHVCtoRgb(hueNum, sliderL / 10, effectiveC / 5);
    props.onPreviewRgb?.(r, g, b);
  };

  const commitLch = () => {
    isDraggingRef.current = false;
    const hueNum = sliderCRef.current === 0 ? null : (sliderHRef.current / 360) * 100;
    const effectiveC = sliderCRef.current === 0 ? 10 : sliderCRef.current;
    const [r, g, b] = munsellHVCtoRgb(hueNum, sliderLRef.current / 10, effectiveC / 5);
    handleClickRef.current(r, g, b);
    props.onClearPreviewRgb?.();
  };

  const clampedL = Math.max(gamutRanges.lRange[0], Math.min(gamutRanges.lRange[1], sliderL));
  const clampedC = Math.max(gamutRanges.cRange[0], Math.min(gamutRanges.cRange[1], sliderC));

  const lLoP = gamutRanges.lRange[0]; // 0-100 range → already a percentage
  const lHiP = gamutRanges.lRange[1];
  const cLoP = gamutRanges.cRange[0];
  const cHiP = gamutRanges.cRange[1];

  const mainBtn = (channel: 'L' | 'C' | 'H') => {
    const isActive = props.lchMainElement === channel && props.shape === 'LCH';
    return (
      <button
        onClick={() => props.setLchMainElement(channel)}
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
          shapeName={'LCH'}
          content={'CIE LCH (Lightness / Chroma / Hue) coordinate space'}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          {props.onHelpClick && (
            <HelpIcon
              topic="lch"
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
          <LchSliderRow>
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
                max={100}
                step="1"
                value={clampedL}
                onChange={handleLChange}
                onPointerUp={commitLch}
                onKeyUp={commitLch}
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
            <Value>{clampedL}</Value>
            {props.onHelpClick && (
              <HelpIcon topic="lch_l" onHelpClick={props.onHelpClick} size={20} />
            )}
          </LchSliderRow>

          {/* C slider */}
          <LchSliderRow>
            {mainBtn('C')}
            <Label>C</Label>
            <SliderTrack>
              <TickMarks />
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: `${cLoP}%`,
                  width: `${Math.max(cHiP - cLoP, 0.1)}%`,
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
                max={100}
                step="1"
                value={clampedC}
                onChange={handleCChange}
                onPointerUp={commitLch}
                onKeyUp={commitLch}
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
            <Value>{clampedC}</Value>
            {props.onHelpClick && (
              <HelpIcon topic="lch_c" onHelpClick={props.onHelpClick} size={20} />
            )}
          </LchSliderRow>

          {/* H slider — full 0-359 */}
          <LchSliderRow>
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
                max={359}
                step="1"
                value={sliderH}
                onChange={handleHChange}
                onPointerUp={commitLch}
                onKeyUp={commitLch}
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
              <HelpIcon topic="lch_h" onHelpClick={props.onHelpClick} size={20} />
            )}
          </LchSliderRow>
        </>
      )}
    </div>
  );
};

const LchSliderRow = styled.div`
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
  width: 24px;
  font-size: 13px;
  text-align: right;
  flex-shrink: 0;
`;

export default LchSliders;
