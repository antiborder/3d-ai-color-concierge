import styled from 'styled-components';
import { PanelShell } from './PanelShell';
import TwoDPicker from './controls/TwoDPicker';
import RgbSliders from './controls/RgbSliders';
import CmykSliders from './controls/CmykSliders';
import HslSliders from './controls/HslSliders';
import HsbSliders from './controls/HsbSliders';
import LabSliders from './controls/LabSliders';
import LchSliders from './controls/LchSliders';
import type { ControlPaneProps } from '../../types/controlPane';
import '../../App.css';

/** RGB/CMYK/HSB/HSL/Lab/Lch sliders + TwoDPicker. */
export const ControlPaneSliders = (props: ControlPaneProps) => {
  return (
    <PanelShell>
      <SlidersSection>
        <RgbSliders
          {...props}
          mainElement={props.rgbMainElement}
          setMainElement={props.setRgbMainElement}
          panelShape={'RGB'}
        />
        {props.shape === 'RGB' && <TwoDPicker {...props} />}
        <CmykSliders
          {...props}
          mainElement={props.cmykMainElement}
          setMainElement={props.setCmykMainElement}
          panelShape={'CMYK'}
        />
        {props.shape === 'CMYK' && <TwoDPicker {...props} />}
        <HsbSliders
          {...props}
          mainElement={props.hsbMainElement}
          setMainElement={props.setHsvMainElement}
          panelShape={'HSB'}
        />
        {props.shape === 'HSB' && <TwoDPicker {...props} />}
        <HslSliders
          {...props}
          mainElement={props.hslMainElement}
          setMainElement={props.setHslMainElement}
          panelShape={'HSL'}
        />
        {props.shape === 'HSL' && <TwoDPicker {...props} />}
        <LabSliders {...props} />
        {props.shape === 'Lab' && <TwoDPicker {...props} />}
        <LchSliders {...props} />
        {props.shape === 'LCH' && <TwoDPicker {...props} />}
      </SlidersSection>
    </PanelShell>
  );
};

const SlidersSection = styled.div``;

export default ControlPaneSliders;
