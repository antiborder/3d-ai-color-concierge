import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ControlPaneProps, BridgeProps } from '../../../types/controlPane';
import type { ColorSpace } from '../../../types/color';
import ShapeButton from './ShapeButton';
import SliderContainer from './SliderContainer';
import { systemColors } from '../../../constants/systemColors.js';

interface CmykSlidersProps extends ControlPaneProps, BridgeProps {
  mainElement: 'C' | 'M' | 'Y' | 'K';
  setMainElement: (symbol: 'C' | 'M' | 'Y' | 'K') => void;
  panelShape: ColorSpace;
}

const CmykSliders = (props: CmykSlidersProps) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(props.shape === 'CMYK');
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
          shapeName={'CMYK'}
          content={t('colorSpace.cmyk.description')}
        />
        <button
          className="showSlidersButton"
          onClick={() => {
            setIsVisible(!isVisible);
          }}
        >
          {isVisible ? '▲' : '▼'}
        </button>
      </div>

      {isVisible && (
        <>
          <SliderContainer
            {...props}
            symbol={'C'}
            value={props.focusC}
            max={100}
            color={systemColors['C']}
            onChange={(event) => props.onCmykChange(event, 'C')}
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
            symbol={'M'}
            value={props.focusM}
            max={100}
            color={systemColors['M']}
            onChange={(event) => props.onCmykChange(event, 'M')}
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
            symbol={'Y'}
            value={props.focusY}
            max={100}
            color={systemColors['Y']}
            onChange={(event) => props.onCmykChange(event, 'Y')}
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
            symbol={'K'}
            value={props.focusK}
            max={100}
            color={systemColors['K']}
            onChange={(event) => props.onCmykChange(event, 'K')}
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

export default CmykSliders;
