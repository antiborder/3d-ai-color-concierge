import { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import type { ControlPaneProps, BridgeProps } from '../../../types/controlPane';
import ShapeButton from './ShapeButton';
import ColorBridge from './ColorBridge';
import { getMunsellHVC, munsellHVCtoRgb } from '../../../utils/munsellUtils';

const LchSliders = (props: ControlPaneProps & BridgeProps) => {
  const [isVisible, setIsVisible] = useState(props.shape === 'LCH');

  // Derive initial LCH from current RGB
  const initial = getMunsellHVC(props.focusR, props.focusG, props.focusB);

  // Local slider state in display units: L (0-100), C (0-100), H (0-359)
  const [sliderL, setSliderL] = useState(Math.round(initial.value * 10));
  const [sliderC, setSliderC] = useState(Math.round(initial.chroma * 5));
  const [sliderH, setSliderH] = useState(
    initial.hueNum !== null ? Math.round((initial.hueNum / 100) * 360) : 0
  );

  // Track whether the last change came from the slider (to avoid overwriting slider state)
  const sliderDrivenRef = useRef(false);

  // When RGB changes externally (particle click, hex input, voice, etc.), sync slider state
  useEffect(() => {
    if (sliderDrivenRef.current) {
      sliderDrivenRef.current = false;
      return;
    }
    const { hueNum, value, chroma } = getMunsellHVC(props.focusR, props.focusG, props.focusB);
    setSliderL(Math.round(value * 10));
    setSliderC(Math.round(chroma * 5));
    setSliderH(hueNum !== null ? Math.round((hueNum / 100) * 360) : 0);
  }, [props.focusR, props.focusG, props.focusB]);

  const handleLChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newL = Number(e.target.value);
    setSliderL(newL);
    sliderDrivenRef.current = true;
    const hueNum = sliderC === 0 ? null : (sliderH / 360) * 100;
    const [r, g, b] = munsellHVCtoRgb(hueNum, newL / 10, sliderC / 5);
    props.handleClick(r, g, b);
  };

  const handleCChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newC = Number(e.target.value);
    setSliderC(newC);
    sliderDrivenRef.current = true;
    const hueNum = newC === 0 ? null : (sliderH / 360) * 100;
    const [r, g, b] = munsellHVCtoRgb(hueNum, sliderL / 10, newC / 5);
    props.handleClick(r, g, b);
  };

  const handleHChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newH = Number(e.target.value);
    setSliderH(newH);
    sliderDrivenRef.current = true;
    const hueNum = (newH / 360) * 100;
    // If C was 0 (achromatic), give it a small chroma so H has visible effect
    const effectiveC = sliderC === 0 ? 10 : sliderC;
    const [r, g, b] = munsellHVCtoRgb(hueNum, sliderL / 10, effectiveC / 5);
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
          shapeName={'LCH'}
          content={'CIE LCH (Lightness / Chroma / Hue) coordinate space'}
        />
        <button
          className="showSlidersButton"
          onClick={() => setIsVisible(!isVisible)}
        >
          {isVisible ? '▲' : '▼'}
        </button>
      </div>
      {isVisible && (
        <>
          <LchSliderRow>
            <Label>L</Label>
            <input type="range" min="0" max="100" step="1" value={sliderL} onChange={handleLChange} />
            <Value>{sliderL}</Value>
          </LchSliderRow>
          <LchSliderRow>
            <Label>C</Label>
            <input type="range" min="0" max="100" step="1" value={sliderC} onChange={handleCChange} />
            <Value>{sliderC}</Value>
          </LchSliderRow>
          <LchSliderRow>
            <Label>H</Label>
            <input type="range" min="0" max="359" step="1" value={sliderH} onChange={handleHChange} />
            <Value>{sliderH}</Value>
          </LchSliderRow>
          {props.shape === 'LCH' && (
            <ColorBridge
              currentColor={{ r: props.focusR, g: props.focusG, b: props.focusB }}
              colorA={props.bridgeColorA}
              colorB={props.bridgeColorB}
              onSetColorA={props.onSetBridgeColorA}
              onSetColorB={props.onSetBridgeColorB}
              shape={props.shape}
              onColorSelect={props.handleClick}
            />
          )}
        </>
      )}
    </div>
  );
};

const LchSliderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 12px;
  margin-bottom: 8px;
  width: 217px;
  gap: 4px;

  input[type='range'] {
    width: 150px;
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
  width: 24px;
  font-size: 13px;
  text-align: right;
  flex-shrink: 0;
`;

export default LchSliders;
