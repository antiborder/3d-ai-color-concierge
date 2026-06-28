import { useState, useEffect, useRef, useMemo, type ChangeEvent } from 'react';
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

function isInGamut(L: number, a: number, b: number): boolean {
  const fy = (L + 16) / 116;
  const fInv = (t: number) => (t > 0.008856 ? t * t * t : (t - 16 / 116) / 7.787);
  const X = fInv(a / 500 + fy) * 0.95047;
  const Y = fInv(fy);
  const Z = fInv(fy - b / 200) * 1.08883;
  const rl = X * 3.2404542 - Y * 1.5371385 - Z * 0.4985314;
  const gl = -X * 0.969266 + Y * 1.8760108 + Z * 0.041556;
  const bl = X * 0.0556434 - Y * 0.2040259 + Z * 1.0572252;
  // Small epsilon to absorb floating-point rounding at the gamut boundary.
  // Without it, integer-rounded Lab values of valid sRGB colors can register as
  // just barely out-of-gamut (e.g. gl ≈ -0.0006 for saturated reds).
  const EPS = 0.005;
  return rl >= -EPS && rl <= 1 + EPS && gl >= -EPS && gl <= 1 + EPS && bl >= -EPS && bl <= 1 + EPS;
}

function computeGamutRange(
  axis: 'L' | 'a' | 'b',
  L: number,
  a: number,
  b: number,
  min: number,
  max: number
): [number, number] {
  let lo = max + 1;
  let hi = min - 1;
  for (let v = min; v <= max; v++) {
    const [tL, ta, tb] = axis === 'L' ? [v, a, b] : axis === 'a' ? [L, v, b] : [L, a, v];
    if (isInGamut(tL, ta, tb)) {
      lo = v;
      break;
    }
  }
  if (lo > max) return [min, max]; // no in-gamut value found; fall back to full range
  for (let v = max; v >= min; v--) {
    const [tL, ta, tb] = axis === 'L' ? [v, a, b] : axis === 'a' ? [L, v, b] : [L, a, v];
    if (isInGamut(tL, ta, tb)) {
      hi = v;
      break;
    }
  }
  return [lo, hi];
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
      const [r, g, b] = labToRgb(clamped, sliderARef.current, sliderBRef.current);
      handleClickRef.current(r, g, b);
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
      const [r, g, b] = labToRgb(sliderLRef.current, clamped, sliderBRef.current);
      handleClickRef.current(r, g, b);
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
      const [r, g, b] = labToRgb(sliderLRef.current, sliderARef.current, clamped);
      handleClickRef.current(r, g, b);
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
            return (
              <LabSliderRow key={label}>
                <Label>{label}</Label>
                <SliderTrack>
                  <input
                    type="range"
                    min={range[0]}
                    max={range[1]}
                    step="1"
                    value={clampedValue}
                    onChange={onChange}
                    style={{
                      position: 'absolute',
                      margin: 0,
                      left: `${loP}%`,
                      width: `${Math.max(hiP - loP, 1)}%`,
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
  justify-content: center;
  margin-top: 12px;
  margin-bottom: 8px;
  width: 217px;
  gap: 4px;
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
