import styled from 'styled-components';
import TwoDPicker from './TwoDPicker';
import CurrentColor from './CurrentColor';
import RgbSliders from './sliders/RgbSliders';
import CmykSliders from './sliders/CmykSliders';
import HslSliders from './sliders/HslSliders';
import HsbSliders from './sliders/HsbSliders';
import LabSliders from './sliders/LabSliders';
import LchSliders from './sliders/LchSliders';
import OneDPicker from './sliders/OneDPicker';
import CIExyDiagram from './CIExyDiagram';
import XyzSliders from './sliders/XyzSliders';
import type { ControlPaneProps } from '../../types/controlPane';
import '../../App.css';
import { systemColors } from '../../constants/systemColors.js';

const ControlPane = (props: ControlPaneProps) => {
  return (
    <ControlPaneRoot>
      <CurrentColor {...props} />
      <ControlPaneSliders {...props} />
    </ControlPaneRoot>
  );
};

/** Sliders + 2D picker (used on desktop inside ControlPane; on narrow screens inside MobileControlColumn when opened). */
export const ControlPaneSliders = (props: ControlPaneProps) => {
  return (
    <StyledControlPane>
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
        <XyzSliders {...props} />
        <OneDPicker
          currentColor={{ r: props.focusR, g: props.focusG, b: props.focusB }}
          shape={props.shape}
          onColorSelect={props.handleClick}
          bridgeColorA={props.bridgeColorA}
          bridgeColorB={props.bridgeColorB}
          onSetBridgeColorA={props.onSetBridgeColorA}
          onSetBridgeColorB={props.onSetBridgeColorB}
          isBridgeOpen={props.isBridgeOpen}
          onBridgeOpenChange={props.onBridgeOpenChange}
          isTwoDPickerOpen={props.isTwoDPickerOpen}
          onTwoDPickerOpenChange={props.onTwoDPickerOpenChange}
          onHelpClick={props.onHelpClick}
        />

        <TwoDPicker {...props} />
        <CIExyDiagram focusR={props.focusR} focusG={props.focusG} focusB={props.focusB} />
      </SlidersSection>
    </StyledControlPane>
  );
};

const ControlPaneRoot = styled.div`
  width: 237px;
  position: absolute;
  top: 12px;
  left: 20px;
`;

const StyledControlPane = styled.div`
  .controlPanel {
    background-color: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    opacity: 1;
    margin-top: 12px;
    padding: 6px 12px 4px 6px;
    min-height: 28px;
  }

  .showSlidersButton {
    flex-shrink: 0;
    margin-left: auto;
    border: none;
    background-color: white;
    color: #4e8cee;
    font-weight: bold;
    font-size: 18px;
    line-height: 1;
    padding: 0;
    cursor: pointer;
  }

  .shapeButton {
    background-color: #4e8cee;
    color: white;
    border: none;
    border-radius: 4px;
    margin-bottom: 8px;
    font-size: 18px;
    font-weight: bold;
    cursor: pointer;
  }
  .selectedShapeButton {
    background-color: #4e8cee;
    color: white;
    border: none;
    border-radius: 4px;
    margin-bottom: 8px;
    font-size: 18px;
    font-weight: bold;
    outline: 2px solid #4e8cee;
    outline-offset: 2px;
  }

  .shapeBubble {
    position: relative;
    top: -80px;
    left: 40px;
    width: 140px;
    background: gray;
    color: white;
    border-radius: 12px 12px 12px 0px;
    font-size: 12px;
    padding: 4px 8px;
    text-align: left;
    z-index: 1;
  }

  .mainElement {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    padding: 0;
    line-height: 0;
    background-color: white;
    font-weight: bold;
    border-radius: 4px;
    margin-right: 4px;

    svg {
      display: block;
      flex-shrink: 0;
    }
  }

  .labelOn {
    font-size: 12px;
    border: solid 2px ${systemColors['INACTIVE']};
  }
  .labelOff {
    font-size: 12px;
    border: solid 2px #4e8cee;
  }
  .labelOff:hover {
    cursor: pointer;
  }
`;

const SlidersSection = styled.div``;

export default ControlPane;
