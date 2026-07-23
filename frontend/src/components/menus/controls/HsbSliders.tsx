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
  onLiveDrag?: (channel: string, value: number) => void;
  onDragEnd?: () => void;
}

function hsvToRgbStr(h: number, s: number, v: number): string {
  const sn = s / 100, vn = v / 100;
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return Math.round(vn * (1 - sn * Math.max(0, Math.min(k, 4 - k, 1))) * 255);
  };
  return `rgb(${f(5)},${f(3)},${f(1)})`;
}

const HsbSliders = (props: HsbSlidersProps) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(props.shape === 'HSB');
  useEffect(() => {
    if (props.shape === 'HSB') setIsVisible(true);
  }, [props.shape]);
  const hGradient = `linear-gradient(to right, ${Array.from({length: 13}, (_, i) => {
    const hue = (i / 12) * 360;
    return `${hsvToRgbStr(hue, props.focusHsvS, props.focusV)} ${((i / 12) * 100).toFixed(1)}%`;
  }).join(', ')})`;
  const sGradient = `linear-gradient(to right, ${hsvToRgbStr(props.focusH, 0, props.focusV)}, ${hsvToRgbStr(props.focusH, 100, props.focusV)})`;
  const vGradient = `linear-gradient(to right, ${hsvToRgbStr(props.focusH, props.focusHsvS, 0)}, ${hsvToRgbStr(props.focusH, props.focusHsvS, 100)})`;
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
            onLiveDrag={(v) => props.onLiveDrag?.('H', v)}
            onDragEnd={props.onDragEnd}
            gradient={hGradient}
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
            onLiveDrag={(v) => props.onLiveDrag?.('HsvS', v)}
            onDragEnd={props.onDragEnd}
            gradient={sGradient}
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
            onLiveDrag={(v) => props.onLiveDrag?.('V', v)}
            onDragEnd={props.onDragEnd}
            gradient={vGradient}
          />
        </>
      )}
    </div>
  );
};

export default HsbSliders;
