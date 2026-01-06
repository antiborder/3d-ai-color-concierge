import { useState } from 'react';
import styled from 'styled-components';
import convert from 'color-convert';
import TwoDPicker from './TwoDPicker';
import type { ControlPaneProps, SliderContainerProps } from '../../types/controlPane';
import type { ColorSpace } from '../../types/color';
import '../../App.css';
import { systemColors } from '../../constants/systemColors.js';
import { SyncIcon } from '../../assets/Icons.jsx';

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

const CurrentColor = (props: ControlPaneProps) => {
  const handleHexUpdate = () => {
    if (props.hexInput.match(/^[0-9A-Fa-f]{6}$/)) {
      props.onHexUpdate();
    }
  };

  const isUpdatable = () => {
    return props.hexInput !== convert.rgb.hex([props.focusR, props.focusG, props.focusB]);
  };

  const handleChange = (value: string) => {
    props.setHexInput(value);
  };

  const isHexFormat = () => {
    return props.hexInput.match(/^[0-9A-Fa-f]{6}$/) !== null;
  };

  return (
    <StyledCurrentColor>
      <div className="controlPanel">
        <div className="currentColor">
          <div
            className="color-sample"
            style={{
              backgroundColor: '#' + convert.rgb.hex([props.focusR, props.focusG, props.focusB]),
            }}
          >
            &nbsp;{' '}
          </div>
          <div className="hex">#</div>
          <input
            className="hexInput"
            type="text"
            value={props.hexInput}
            onChange={(event) => handleChange(event.target.value)}
          />
          <button
            className={
              isUpdatable() && isHexFormat() ? 'activeUpdateButton' : 'inactiveUpdateButton'
            }
            onClick={() => handleHexUpdate()}
          >
            <SyncIcon />
          </button>
        </div>
      </div>
    </StyledCurrentColor>
  );
};

const RgbSliders = (
  props: ControlPaneProps & {
    mainElement: 'R' | 'G' | 'B';
    setMainElement: (symbol: 'R' | 'G' | 'B') => void;
    panelShape: ColorSpace;
  }
) => {
  const [isVisible, setIsVisible] = useState(props.shape === 'RGB');
  return (
    <div className="controlPanel">
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          height: '24px',
        }}
      >
        <ShapeButton
          {...props}
          setIsVisible={setIsVisible}
          shapeName={'RGB'}
          content={'R:Red(赤)\nG:Green(緑)\nB:Blue(青)'}
        />
        <button
          className="showSlidersButton"
          onClick={() => {
            setIsVisible(!isVisible);
          }}
        >
          {isVisible ? '−' : '＋'}
        </button>
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
          />
        </>
      )}
    </div>
  );
};

const CmykSliders = (
  props: ControlPaneProps & {
    mainElement: 'C' | 'M' | 'Y' | 'K';
    setMainElement: (symbol: 'C' | 'M' | 'Y' | 'K') => void;
    panelShape: ColorSpace;
  }
) => {
  const [isVisible, setIsVisible] = useState(props.shape === 'CMYK');
  return (
    <div className="controlPanel">
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          height: '24px',
        }}
      >
        <ShapeButton
          {...props}
          setIsVisible={setIsVisible}
          shapeName={'CMYK'}
          content={'C:Cyan(シアン)\nM:Magenta(マゼンタ)\nY:Yellow(黄)\nK:Key(黒)'}
        />
        <button
          className="showSlidersButton"
          onClick={() => {
            setIsVisible(!isVisible);
          }}
        >
          {isVisible ? '−' : '＋'}
        </button>
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
          />
        </>
      )}
    </div>
  );
};

const HsvSliders = (
  props: ControlPaneProps & {
    mainElement: 'H' | 'S' | 'V';
    setMainElement: (symbol: 'H' | 'S' | 'V') => void;
    panelShape: ColorSpace;
  }
) => {
  const [isVisible, setIsVisible] = useState(props.shape === 'HSV');
  return (
    <div className="controlPanel">
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          height: '24px',
        }}
      >
        <ShapeButton
          {...props}
          setIsVisible={setIsVisible}
          shapeName={'HSV'}
          content={'H:Hue(色相)\nS:Satulation(彩度)\nL:Value(輝度)'}
        />
        <button
          className="showSlidersButton"
          onClick={() => {
            setIsVisible(!isVisible);
          }}
        >
          {isVisible ? '−' : '＋'}
        </button>
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
          />
          <SliderContainer
            {...props}
            symbol={'V'}
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
          />
        </>
      )}
    </div>
  );
};

const HslSliders = (
  props: ControlPaneProps & {
    mainElement: 'H' | 'S' | 'L';
    setMainElement: (symbol: 'H' | 'S' | 'L') => void;
    panelShape: ColorSpace;
  }
) => {
  const [isVisible, setIsVisible] = useState(props.shape === 'HSL');
  return (
    <div className="controlPanel">
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          height: '24px',
        }}
      >
        <ShapeButton
          {...props}
          setIsVisible={setIsVisible}
          shapeName={'HSL'}
          content={'H:Hue(色相)\nS:Satulation(彩度)\nL:Lightness(明度)'}
        />
        <button
          className="showSlidersButton"
          onClick={() => {
            setIsVisible(!isVisible);
          }}
        >
          {isVisible ? '−' : '＋'}
        </button>
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
          />
        </>
      )}
    </div>
  );
};

interface ShapeButtonProps extends ControlPaneProps {
  setIsVisible: (visible: boolean) => void;
  shapeName: ColorSpace;
  content: string;
}

const ShapeButton = (props: ShapeButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const handlePointerOver = () => {
    setIsHovered(true);
  };
  const handlePointerOut = () => {
    setIsHovered(false);
  };
  return (
    <>
      <div style={{ height: '24px' }}>
        <button
          className={props.shape === props.shapeName ? 'inactiveShapeButton' : 'activeShapeButton'}
          onClick={() => {
            props.setIsVisible(true);
            props.onShapeClick(props.shapeName);
          }}
          onPointerOver={() => handlePointerOver()}
          onPointerOut={() => handlePointerOut()}
        >
          {props.shapeName}
        </button>
        {isHovered && <div className="shapeBubble">{props.content}</div>}
      </div>
    </>
  );
};

const SliderContainer = (props: SliderContainerProps) => {
  const [, setValue] = useState(props.value);
  const isActive = props.mainElement === props.symbol && props.shape === props.panelShape;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(Number(event.target.value));
    props.onChange(event);
  };

  return (
    <StyledSliderContainer>
      {props.symbol !== 'K' && (
        <button
          onClick={() =>
            props.setMainElement(
              props.symbol as 'R' | 'G' | 'B' | 'C' | 'M' | 'Y' | 'K' | 'H' | 'S' | 'L' | 'V'
            )
          }
          className={isActive ? 'mainElement labelOn' : 'mainElement labelOff'}
        >
          {props.mainElement === props.symbol ? (
            <div
              style={{
                marginLeft: '-4px',
                marginTop: '-3px',
                color: isActive ? systemColors['INACTIVE'] : props.color,
              }}
            >
              ■
            </div>
          ) : (
            <div
              style={{
                marginLeft: '-6px',
                marginTop: '-3px',
                color: props.color,
              }}
            >
              ・
            </div>
          )}
        </button>
      )}
      {props.symbol === 'K' && <div style={{ width: '22px' }}></div>}
      {props.symbol}
      <input
        type="range"
        min="0"
        step="1"
        max={props.max}
        value={props.value}
        onChange={handleChange}
      />
      <div className="value">{Math.round(props.value)}</div>
    </StyledSliderContainer>
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

const StyledCurrentColor = styled.div`
  .currentColor {
    display: flex; /* 親要素をフレックスコンテナにする */
    align-items: center; /* 要素を縦方向に中央寄せする */
    font-size: 20px;
    .color-sample {
      margin: 8px 16px 8px 16px;
      border: solid 1px #aaaaaa;
      width: 150px;
      height: 24px;
    }
    .hex {
      display: flex;
      align-items: center;
      justify-content: center;
      color: #aaaaaa;
    }

    .hexInput {
      width: 64px;
      height: 24px;
      font-size: 16px;
      border: solid 1px #999999;
      color: #000000;
      margin-right: 8px;
    }
    .activeUpdateButton {
      width: 60px;
      height: 24px;
      background-color: #4e8cee;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .inactiveUpdateButton {
      width: 60px;
      height: 24px;
      background-color: #cccccc;
      border: none;
      border-radius: 4px;
    }
  }
`;

const StyledSliderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0px;
  width: 320px;

  padding: 0px;
  input {
    width: 300px;
  }
  .value {
    width: 20px;
  }
  .label-on {
    font-size: 20px;
    color: black;
  }
  .label-off {
    font-size: 20px;
    color: gray;
  }
`;

export default ControlPane;
