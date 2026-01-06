import { useState } from 'react';
import styled from 'styled-components';
import type { SliderContainerProps } from '../../../types/controlPane';
import { systemColors } from '../../../constants/systemColors.js';

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

export default SliderContainer;
