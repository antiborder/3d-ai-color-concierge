import { useState } from 'react';
import type { ControlPaneProps } from '../../../types/controlPane';
import type { ColorSpace } from '../../../types/color';
import ShapeButton from './ShapeButton';
import SliderContainer from './SliderContainer';
import { systemColors } from '../../../constants/systemColors.js';

interface RgbSlidersProps extends ControlPaneProps {
  mainElement: 'R' | 'G' | 'B';
  setMainElement: (symbol: 'R' | 'G' | 'B') => void;
  panelShape: ColorSpace;
}

const RgbSliders = (props: RgbSlidersProps) => {
  const [isVisible, setIsVisible] = useState(props.shape === 'RGB');
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
          shapeName={'RGB'}
          content={'R:Red(赤)\nG:Green(緑)\nB:Blue(青)'}
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
            symbol={'R'}
            value={props.focusR}
            max={255}
            color={systemColors['R']}
            onChange={(event) => props.onRgbChange(event, 'R')}
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
            symbol={'G'}
            value={props.focusG}
            max={255}
            color={systemColors['G']}
            onChange={(event) => props.onRgbChange(event, 'G')}
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
            symbol={'B'}
            value={props.focusB}
            max={255}
            color={systemColors['B']}
            onChange={(event) => props.onRgbChange(event, 'B')}
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

export default RgbSliders;
