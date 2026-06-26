import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ControlPaneProps, BridgeProps } from '../../../types/controlPane';
import type { ColorSpace } from '../../../types/color';
import ShapeButton from './ShapeButton';
import SliderContainer from './SliderContainer';
import { systemColors } from '../../../constants/systemColors.js';
import HelpIcon from '../../common/HelpIcon';

interface RgbSlidersProps extends ControlPaneProps, BridgeProps {
  mainElement: 'R' | 'G' | 'B';
  setMainElement: (symbol: 'R' | 'G' | 'B') => void;
  panelShape: ColorSpace;
}

const RgbSliders = (props: RgbSlidersProps) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(props.shape === 'RGB');
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
          shapeName={'RGB'}
          content={t('colorSpace.rgb.description')}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          {props.onHelpClick && (
            <HelpIcon
              topic="rgb"
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
            onHelpClick={props.onHelpClick}
            helpTopic="rgb_r"
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
            onHelpClick={props.onHelpClick}
            helpTopic="rgb_g"
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
            onHelpClick={props.onHelpClick}
            helpTopic="rgb_b"
          />
        </>
      )}
    </div>
  );
};

export default RgbSliders;
