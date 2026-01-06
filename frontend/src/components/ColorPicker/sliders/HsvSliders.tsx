import { useState } from 'react';
import type { ControlPaneProps } from '../../../types/controlPane';
import type { ColorSpace } from '../../../types/color';
import ShapeButton from './ShapeButton';
import SliderContainer from './SliderContainer';
import { systemColors } from '../../../constants/systemColors.js';

interface HsvSlidersProps extends ControlPaneProps {
  mainElement: 'H' | 'S' | 'V';
  setMainElement: (symbol: 'H' | 'S' | 'V') => void;
  panelShape: ColorSpace;
}

const HsvSliders = (props: HsvSlidersProps) => {
  const [isVisible, setIsVisible] = useState(props.shape === 'HSV');
  return (
    <div className="controlPanel">
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          height: '24px',
        }}
      >
        <ShapeButton
          {...props}
          setIsVisible={setIsVisible}
          shapeName={'HSV'}
          content={'H:Hue(色相)\nS:Satulation(彩度)\nL:Value(輝度)'}
        />
        <button
          className="showSlidersButton"
          onClick={() => {
            setIsVisible(!isVisible);
          }}
        >
          {isVisible ? '−' : '＋'}
        </button>
      </div>

      {isVisible && (
        <>
          <SliderContainer
            {...props}
            symbol={'H'}
            value={props.focusH}
            max={360}
            color={systemColors['K']}
            onChange={(event) => props.onHsvChange(event, 'H')}
            mainElement={props.mainElement}
            setMainElement={
              props.setMainElement as (
                symbol: 'R' | 'G' | 'B' | 'C' | 'M' | 'Y' | 'K' | 'H' | 'S' | 'L' | 'V'
              ) => void
            }
            shape={props.shape}
            panelShape={props.panelShape}
          />
          <SliderContainer
            {...props}
            symbol={'S'}
            value={props.focusHsvS}
            max={100}
            color={systemColors['K']}
            onChange={(event) => props.onHsvChange(event, 'HsvS')}
            mainElement={props.mainElement}
            setMainElement={
              props.setMainElement as (
                symbol: 'R' | 'G' | 'B' | 'C' | 'M' | 'Y' | 'K' | 'H' | 'S' | 'L' | 'V'
              ) => void
            }
            shape={props.shape}
            panelShape={props.panelShape}
          />
          <SliderContainer
            {...props}
            symbol={'V'}
            value={props.focusV}
            max={100}
            color={systemColors['K']}
            onChange={(event) => props.onHsvChange(event, 'V')}
            mainElement={props.mainElement}
            setMainElement={
              props.setMainElement as (
                symbol: 'R' | 'G' | 'B' | 'C' | 'M' | 'Y' | 'K' | 'H' | 'S' | 'L' | 'V'
              ) => void
            }
            shape={props.shape}
            panelShape={props.panelShape}
          />
        </>
      )}
    </div>
  );
};

export default HsvSliders;
