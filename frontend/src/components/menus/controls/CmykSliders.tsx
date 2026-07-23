import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { ControlPaneProps, BridgeProps } from '../../../types/controlPane';
import type { ColorSpace } from '../../../types/color';
import ShapeButton from './ShapeButton';
import SliderContainer from './SliderContainer';
import { systemColors } from '../../../constants/systemColors.js';
import HelpIcon from '../../common/HelpIcon';

interface CmykSlidersProps extends ControlPaneProps, BridgeProps {
  mainElement: 'C' | 'M' | 'Y' | 'K';
  setMainElement: (symbol: 'C' | 'M' | 'Y' | 'K') => void;
  panelShape: ColorSpace;
  onLiveDrag?: (channel: string, value: number) => void;
  onDragEnd?: () => void;
}

function cmykToRgbStr(c: number, m: number, y: number, k: number): string {
  const kf = (100 - k) / 100;
  return `rgb(${Math.round(255 * (1 - c / 100) * kf)},${Math.round(255 * (1 - m / 100) * kf)},${Math.round(255 * (1 - y / 100) * kf)})`;
}

const CmykSliders = (props: CmykSlidersProps) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(props.shape === 'CMYK');
  useEffect(() => {
    if (props.shape === 'CMYK') setIsVisible(true);
  }, [props.shape]);
  const { focusC: C, focusM: M, focusY: Y, focusK: K } = props;
  const cGradient = `linear-gradient(to right, ${cmykToRgbStr(0, M, Y, K)}, ${cmykToRgbStr(100, M, Y, K)})`;
  const mGradient = `linear-gradient(to right, ${cmykToRgbStr(C, 0, Y, K)}, ${cmykToRgbStr(C, 100, Y, K)})`;
  const yGradient = `linear-gradient(to right, ${cmykToRgbStr(C, M, 0, K)}, ${cmykToRgbStr(C, M, 100, K)})`;
  const kGradient = `linear-gradient(to right, ${cmykToRgbStr(C, M, Y, 0)}, ${cmykToRgbStr(C, M, Y, 100)})`;
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          {props.onHelpClick && (
            <HelpIcon
              topic="cmyk"
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
            onHelpClick={props.onHelpClick}
            helpTopic="cmyk_c"
            onLiveDrag={(v) => props.onLiveDrag?.('C', v)}
            onDragEnd={props.onDragEnd}
            gradient={cGradient}
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
            onHelpClick={props.onHelpClick}
            helpTopic="cmyk_m"
            onLiveDrag={(v) => props.onLiveDrag?.('M', v)}
            onDragEnd={props.onDragEnd}
            gradient={mGradient}
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
            onHelpClick={props.onHelpClick}
            helpTopic="cmyk_y"
            onLiveDrag={(v) => props.onLiveDrag?.('Y', v)}
            onDragEnd={props.onDragEnd}
            gradient={yGradient}
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
            onHelpClick={props.onHelpClick}
            helpTopic="cmyk_k"
            onLiveDrag={(v) => props.onLiveDrag?.('K', v)}
            onDragEnd={props.onDragEnd}
            gradient={kGradient}
          />
        </>
      )}
    </div>
  );
};

export default CmykSliders;
