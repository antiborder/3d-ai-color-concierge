import styled from 'styled-components';
import TwoDPicker from './TwoDPicker';
import CurrentColor from './CurrentColor';
import RgbSliders from './sliders/RgbSliders';
import CmykSliders from './sliders/CmykSliders';
import HslSliders from './sliders/HslSliders';
import HsvSliders from './sliders/HsvSliders';
import type { ControlPaneProps } from '../../types/controlPane';
import '../../App.css';
import { systemColors } from '../../constants/systemColors.js';

const ControlPane = (props: ControlPaneProps) => {
  return (
    <StyledControlPane>
      <CurrentColor {...props} />

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
      <HsvSliders
        {...props}
        mainElement={props.hsvMainElement}
        setMainElement={props.setHsvMainElement}
        panelShape={'HSV'}
      />
      <HslSliders
        {...props}
        mainElement={props.hslMainElement}
        setMainElement={props.setHslMainElement}
        panelShape={'HSL'}
      />

      <TwoDPicker {...props} />
    </StyledControlPane>
  );
};

const StyledControlPane = styled.div`
  width: 340px;
  position: absolute;
  top: 0px;
  left: 30px;

  .controlPanel {
    background-color: white;
    border-radius: 12px;
    opacity: 1;
    margin-top: 8px;
    padding: 4px 12px 4px 6px;
    min-height: 28px;
  }

  .showSlidersButton {
    border: none;
    background-color: white;
    color: #aaaaaa;
    font-weight: bold;
    font-size: 12px;
    margin-right: 20px;
    cursor: pointer;
  }

  .activeShapeButton {
    background-color: #4e8cee;
    color: white;
    border: none;
    border-radius: 4px;
    margin-bottom: 8px;
    font-weight: bold;
    cursor: pointer;
  }
  .inactiveShapeButton {
    background-color: light-gray;
    color: gray;
    border: none;
    border-radius: 4px;
    margin-bottom: 8px;
    font-weight: bold;
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
    width: 16px;
    height: 16px;
    background-color: white;
    font-weight: bold;
    border-radius: 4px;
    margin-right: 4px;
    padding-right: 0px 0px 0px -8px;
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

export default ControlPane;
