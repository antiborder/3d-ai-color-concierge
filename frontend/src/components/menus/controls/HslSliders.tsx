import { useState, useEffect } from 'react';
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
  onLiveDrag?: (channel: string, value: number) => void;
  onDragEnd?: () => void;
}

const HslSliders = (props: HslSlidersProps) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(props.shape === 'HSL');
  useEffect(() => {
    if (props.shape === 'HSL') setIsVisible(true);
  }, [props.shape]);
  const { focusH: H, focusS: S, focusL: L } = props;
  const hGradient = `linear-gradient(to right, ${Array.from({length: 13}, (_, i) => {
    const hue = (i / 12) * 360;
    return `hsl(${hue.toFixed(0)},${S}%,${L}%) ${((i / 12) * 100).toFixed(1)}%`;
  }).join(', ')})`;
  const sGradient = `linear-gradient(to right, hsl(${H},0%,${L}%), hsl(${H},100%,${L}%))`;
  const lGradient = `linear-gradient(to right, hsl(${H},${S}%,0%), hsl(${H},${S}%,50%), hsl(${H},${S}%,100%))`;
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
          <button className="showSlidersButton" onClick={() => setIsVisible(!isVisible)}>
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
            onLiveDrag={(v) => props.onLiveDrag?.('H', v)}
            onDragEnd={props.onDragEnd}
            gradient={hGradient}
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
            onLiveDrag={(v) => props.onLiveDrag?.('S', v)}
            onDragEnd={props.onDragEnd}
            gradient={sGradient}
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
            onLiveDrag={(v) => props.onLiveDrag?.('L', v)}
            onDragEnd={props.onDragEnd}
            gradient={lGradient}
          />
        </>
      )}
    </div>
  );
};

export default HslSliders;
