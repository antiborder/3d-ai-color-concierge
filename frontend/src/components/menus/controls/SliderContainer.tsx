import { useState, useRef, type ChangeEvent } from 'react';
import styled from 'styled-components';
import type { SliderContainerProps } from '../../../types/controlPane';
import HelpIcon from '../../common/HelpIcon';

const SliderContainer = (props: SliderContainerProps) => {
  const [draftValue, setDraftValue] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isActive = props.mainElement === props.symbol && props.shape === props.panelShape;
  const displayedValue = draftValue !== null ? draftValue : props.value;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDraftValue(Number(event.target.value));
  };

  const commit = () => {
    if (draftValue !== null && inputRef.current) {
      props.onChange({ target: inputRef.current } as ChangeEvent<HTMLInputElement>);
      setDraftValue(null);
    }
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
            <svg
              width="14"
              height="14"
              viewBox="0 0 10 10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <circle cx="5" cy="5" r="7" fill={props.color} />
              <path
                d="M2 5L4 7.4L8 2.2"
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg
              width="14"
              height="14"
              viewBox="0 0 10 10"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <circle cx="5" cy="5" r="7" fill={props.color} />
            </svg>
          )}
        </button>
      )}
      {props.symbol === 'K' && <div style={{ width: '22px' }}></div>}
      <span className="symbolLabel">{props.label ?? props.symbol}</span>
      <input
        ref={inputRef}
        type="range"
        min="0"
        step="1"
        max={props.max}
        value={displayedValue}
        onChange={handleChange}
        onPointerUp={commit}
        onKeyUp={commit}
      />
      <div className="value">{Math.round(displayedValue)}</div>
      {props.onHelpClick && props.helpTopic && (
        <HelpIcon topic={props.helpTopic} onHelpClick={props.onHelpClick} size={20} />
      )}
    </StyledSliderContainer>
  );
};

const StyledSliderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 12px;
  margin-bottom: 8px;
  width: 217px;

  padding: 0px;
  .symbolLabel {
    font-weight: 600;
    font-size: 18px;
  }
  input {
    flex: 1;
    min-width: 80px;
  }
  .value {
    width: 20px;
    text-align: right;
    flex-shrink: 0;
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
