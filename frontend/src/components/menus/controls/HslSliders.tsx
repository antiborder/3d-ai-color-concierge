import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ControlPaneProps, BridgeProps } from '../../../types/controlPane';
import type { ColorSpace } from '../../../types/color';
import ShapeButton from './ShapeButton';
import SliderContainer from './SliderContainer';
import { systemColors } from '../../../constants/systemColors.js';
import HelpIcon from '../../common/HelpIcon';

interface HslSlidersProps extends ControlPaneProps, BridgeProps {
  mainElement: 'H' | 'S' | 'L';
  setMainElement: (symbol: 'H' | 'S' | 'L') => void;
  panelShape: ColorSpace;
}

const HslSliders = (props: HslSlidersProps) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(props.shape === 'HSL');
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
          shapeName={'HSL'}
          content={t('colorSpace.hsl.description')}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          {props.onHelpClick && (
            <HelpIcon
              topic="hsl"
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
            onChange={(event) => props.onHslChange(event, 'H')}
            mainElement={props.mainElement}
            setMainElement={
              props.setMainElement as (
                symbol: 'R' | 'G' | 'B' | 'C' | 'M' | 'Y' | 'K' | 'H' | 'S' | 'L' | 'V'
              ) => void
            }
            shape={props.shape}
            panelShape={props.panelShape}
            onHelpClick={props.onHelpClick}
            helpTopic="hsl_h"
          />
          <SliderContainer
            {...props}
            symbol={'S'}
            value={props.focusS}
            max={100}
            color={systemColors['K']}
            onChange={(event) => props.onHslChange(event, 'S')}
            mainElement={props.mainElement}
            setMainElement={
              props.setMainElement as (
                symbol: 'R' | 'G' | 'B' | 'C' | 'M' | 'Y' | 'K' | 'H' | 'S' | 'L' | 'V'
              ) => void
            }
            shape={props.shape}
            panelShape={props.panelShape}
            onHelpClick={props.onHelpClick}
            helpTopic="hsl_s"
          />
          <SliderContainer
            {...props}
            symbol={'L'}
            value={props.focusL}
            max={100}
            color={systemColors['K']}
            onChange={(event) => props.onHslChange(event, 'L')}
            mainElement={props.mainElement}
            setMainElement={
              props.setMainElement as (
                symbol: 'R' | 'G' | 'B' | 'C' | 'M' | 'Y' | 'K' | 'H' | 'S' | 'L' | 'V'
              ) => void
            }
            shape={props.shape}
            panelShape={props.panelShape}
            onHelpClick={props.onHelpClick}
            helpTopic="hsl_l"
          />
        </>
      )}
    </div>
  );
};

export default HslSliders;
