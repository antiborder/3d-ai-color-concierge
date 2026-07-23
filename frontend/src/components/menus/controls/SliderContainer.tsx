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
    const value = Number(event.target.value);
    setDraftValue(value);
    props.onLiveDrag?.(value);
  };

  const commit = () => {
    if (draftValue !== null && inputRef.current) {
      props.onChange({ target: inputRef.current } as ChangeEvent<HTMLInputElement>);
      setDraftValue(null);
      props.onDragEnd?.();
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
      {props.symbol === 'K' && <div style={{ width: '22px' }} />}
      <span className="symbolLabel">{props.label ?? props.symbol}</span>
      <SliderTrack>
        {/* Fixed tick marks: ┣---+---┫ */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              height: 1,
              background: '#c0c0c0',
              transform: 'translateY(-50%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: '50%',
              width: 1,
              height: 10,
              background: '#c0c0c0',
              transform: 'translateY(-50%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: 1,
              height: 6,
              background: '#c0c0c0',
              transform: 'translate(-50%, -50%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: '50%',
              width: 1,
              height: 10,
              background: '#c0c0c0',
              transform: 'translateY(-50%)',
            }}
          />
        </div>
        {/* Full-range bar */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            width: '100%',
            height: 8,
            borderRadius: 4,
            background: props.gradient ?? '#a0a0a0',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
          }}
        />
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
          style={{
            position: 'absolute',
            margin: 0,
            left: 0,
            width: '100%',
            height: '100%',
            boxSizing: 'border-box',
          }}
        />
      </SliderTrack>
      <div className="value">{Math.round(displayedValue)}</div>
      {props.onHelpClick && props.helpTopic && (
        <HelpIcon topic={props.helpTopic} onHelpClick={props.onHelpClick} size={20} />
      )}
    </StyledSliderContainer>
  );
};

const SliderTrack = styled.div`
  position: relative;
  flex: 1;
  min-width: 80px;
  height: 20px;

  input[type='range'] {
    height: 100%;
    box-sizing: border-box;
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
    cursor: pointer;
  }

  input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 7px;
    height: 18px;
    border-radius: 3px;
    background: #4a90e2;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  input[type='range']::-moz-range-thumb {
    width: 7px;
    height: 18px;
    border-radius: 3px;
    background: #4a90e2;
    border: none;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  input[type='range']::-webkit-slider-runnable-track {
    background: transparent;
  }

  input[type='range']::-moz-range-track {
    background: transparent;
  }
`;

const StyledSliderContainer = styled.div`
  display: flex;
  align-items: center;
  margin-top: 12px;
  margin-bottom: 8px;
  gap: 2px;

  .symbolLabel {
    font-weight: 600;
    font-size: 18px;
    flex-shrink: 0;
    text-align: right;
  }
  .value {
    width: 24px;
    font-size: 13px;
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
