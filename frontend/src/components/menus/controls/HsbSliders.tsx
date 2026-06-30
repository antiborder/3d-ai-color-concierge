import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { ControlPaneProps, BridgeProps } from '../../../types/controlPane';
import type { ColorSpace } from '../../../types/color';
import ShapeButton from './ShapeButton';
import SliderContainer from './SliderContainer';
import { systemColors } from '../../../constants/systemColors.js';
import HelpIcon from '../../common/HelpIcon';

interface HsbSlidersProps extends ControlPaneProps, BridgeProps {
  mainElement: 'H' | 'S' | 'V';
  setMainElement: (symbol: 'H' | 'S' | 'V') => void;
  panelShape: ColorSpace;
}

const HsbSliders = (props: HsbSlidersProps) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(props.shape === 'HSB');
  useEffect(() => {
    if (props.shape === 'HSB') setIsVisible(true);
  }, [props.shape]);
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
          shapeName={'HSB'}
          content={t('colorSpace.hsb.description')}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          {props.onHelpClick && (
            <HelpIcon
              topic="hsb"
              onHelpClick={(topic) => {
                setIsVisible(true);
                props.onHelpClick!(topic);
              }}
            />
          )}
          <button
            className="showSlidersButton"
            onClick={() => {
              setIsVisible(!isVisible);
            }}
          >
            {isVisible ? '▲' : '▼'}
          </button>
        </div>
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
            onHelpClick={props.onHelpClick}
            helpTopic="hsb_h"
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
            onHelpClick={props.onHelpClick}
            helpTopic="hsb_s"
          />
          <SliderContainer
            {...props}
            symbol={'V'}
            label={'B'}
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
            onHelpClick={props.onHelpClick}
            helpTopic="hsb_v"
          />
        </>
      )}
    </div>
  );
};

export default HsbSliders;
