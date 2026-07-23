import { useState, useEffect } from 'react';
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
  onLiveDrag?: (channel: string, value: number) => void;
  onDragEnd?: () => void;
}

const RgbSliders = (props: RgbSlidersProps) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(props.shape === 'RGB');
  useEffect(() => {
    if (props.shape === 'RGB') setIsVisible(true);
  }, [props.shape]);
  const r = Math.round(props.focusR), g = Math.round(props.focusG), b = Math.round(props.focusB);
  const rGradient = `linear-gradient(to right, rgb(0,${g},${b}), rgb(255,${g},${b}))`;
  const gGradient = `linear-gradient(to right, rgb(${r},0,${b}), rgb(${r},255,${b}))`;
  const bGradient = `linear-gradient(to right, rgb(${r},${g},0), rgb(${r},${g},255))`;
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
          <button className="showSlidersButton" onClick={() => setIsVisible(!isVisible)}>
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
            onLiveDrag={(v) => props.onLiveDrag?.('R', v)}
            onDragEnd={props.onDragEnd}
            gradient={rGradient}
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
            onLiveDrag={(v) => props.onLiveDrag?.('G', v)}
            onDragEnd={props.onDragEnd}
            gradient={gGradient}
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
            onLiveDrag={(v) => props.onLiveDrag?.('B', v)}
            onDragEnd={props.onDragEnd}
            gradient={bGradient}
          />
        </>
      )}
    </div>
  );
};

export default RgbSliders;
