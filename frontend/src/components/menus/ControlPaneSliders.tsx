import styled from 'styled-components';
import { PanelShell } from './PanelShell';
import TwoDPicker from './TwoDPicker';
import RgbSliders from './sliders/RgbSliders';
import CmykSliders from './sliders/CmykSliders';
import HslSliders from './sliders/HslSliders';
import HsbSliders from './sliders/HsbSliders';
import LabSliders from './sliders/LabSliders';
import LchSliders from './sliders/LchSliders';
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
        <CmykSliders
          {...props}
          mainElement={props.cmykMainElement}
          setMainElement={props.setCmykMainElement}
          panelShape={'CMYK'}
        />
        <HsbSliders
          {...props}
          mainElement={props.hsbMainElement}
          setMainElement={props.setHsvMainElement}
          panelShape={'HSB'}
        />
        <HslSliders
          {...props}
          mainElement={props.hslMainElement}
          setMainElement={props.setHslMainElement}
          panelShape={'HSL'}
        />
        <LabSliders {...props} />
        <LchSliders {...props} />
        <TwoDPicker {...props} />
      </SlidersSection>
    </PanelShell>
  );
};

const SlidersSection = styled.div``;

export default ControlPaneSliders;
