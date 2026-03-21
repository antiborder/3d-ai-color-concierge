import convert from 'color-convert';
import type { ControlPaneProps } from '../../types/controlPane';
import { SyncIcon } from '../../assets/Icons.jsx';
import styled from 'styled-components';

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
    <CurrentColorPanel>
      <CurrentColorTitle>Current Color</CurrentColorTitle>
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
          className={isUpdatable() && isHexFormat() ? 'activeUpdateButton' : 'inactiveUpdateButton'}
          onClick={() => handleHexUpdate()}
        >
          <SyncIcon />
        </button>
      </div>
    </CurrentColorPanel>
  );
};

const CurrentColorPanel = styled.div`
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  opacity: 1;
  padding: 4px 12px 4px 6px;
  min-height: 28px;

  .currentColor {
    display: flex; /* 親要素をフレックスコンテナにする */
    align-items: center; /* 要素を縦方向に中央寄せする */
    font-size: 20px;
    .color-sample {
      margin: 8px 8px 8px 8px;
      border: solid 1px #aaaaaa;
      width: 100px;
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
      width: 40px;
      height: 24px;
      background-color: #4e8cee;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .inactiveUpdateButton {
      width: 40px;
      height: 24px;
      background-color: #cccccc;
      border: none;
      border-radius: 4px;
    }
  }
`;

const CurrentColorTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  user-select: none;
`;

export default CurrentColor;
