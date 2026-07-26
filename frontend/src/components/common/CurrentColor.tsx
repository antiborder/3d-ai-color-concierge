import { useState, useEffect } from 'react';
import convert from 'color-convert';
import type { ControlPaneProps } from '../../types/controlPane';
import { SyncIcon, ChainLinkedIcon, ChainBrokenIcon } from '../../assets/Icons.jsx';
import styled from 'styled-components';

const CurrentColor = (props: ControlPaneProps) => {
  const { r: selR, g: selG, b: selB } = props.selectedRgb;

  const handleHexUpdate = () => {
    if (props.hexInput.match(/^[0-9A-Fa-f]{6}$/)) {
      props.onHexUpdate();
    }
  };

  const isUpdatable = () =>
    props.hexInput !== convert.rgb.hex([Math.round(selR), Math.round(selG), Math.round(selB)]).toLowerCase();

  const isHexFormat = () => props.hexInput.match(/^[0-9A-Fa-f]{6}$/) !== null;

  const [bgHexInput, setBgHexInput] = useState(
    props.sceneBackgroundColor.replace('#', '')
  );

  useEffect(() => {
    setBgHexInput(props.sceneBackgroundColor.replace('#', ''));
  }, [props.sceneBackgroundColor]);

  const isBgHexFormat = () => /^[0-9A-Fa-f]{6}$/.test(bgHexInput);
  const isBgUpdatable = () =>
    bgHexInput.toLowerCase() !== props.sceneBackgroundColor.replace('#', '').toLowerCase();

  const handleBgUpdate = () => {
    if (isBgHexFormat()) {
      props.onBackgroundColorChange('#' + bgHexInput);
    }
  };

  const syncBgWithSelected = props.isColorsLinked;
  const setSyncBgWithSelected = props.onColorsLinkedChange;

  // sync background → selected color whenever selected color changes (when linked)
  useEffect(() => {
    if (!syncBgWithSelected) return;
    const hex = convert.rgb.hex([
      Math.round(selR),
      Math.round(selG),
      Math.round(selB),
    ]).toLowerCase();
    props.onBackgroundColorChange('#' + hex);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncBgWithSelected, selR, selG, selB]);

  // while linked, color selection mode must stay on 'focused'
  useEffect(() => {
    if (syncBgWithSelected) props.onColorTargetChange('focused');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncBgWithSelected]);

  return (
    <CurrentColorPanel>
      <CurrentColorTitle>Current Colors</CurrentColorTitle>
      <ColorRowsWrapper>
        <ConnectorTop />
        <ConnectorBottom />
        <ChainButton
          onClick={() => setSyncBgWithSelected(!syncBgWithSelected)}
          $linked={syncBgWithSelected}
          title={syncBgWithSelected ? 'Unlink background color' : 'Link background color to selected color'}
        >
          {syncBgWithSelected ? <ChainLinkedIcon /> : <ChainBrokenIcon />}
        </ChainButton>
        <ColorRowsContent>
          <div className="currentColor">
            <div
              className="color-sample color-sample--circle"
              style={{
                backgroundColor:
                  '#' + convert.rgb.hex([Math.round(selR), Math.round(selG), Math.round(selB)]).toLowerCase(),
                boxShadow:
                  props.colorTarget === 'focused'
                    ? '0 0 0 1px white, 0 0 0 4px #4e8cee'
                    : 'none',
                cursor: 'pointer',
              }}
              onClick={() => props.onColorTargetChange('focused')}
            />
            <div className="hex">#</div>
            <input
              className="hexInput"
              type="text"
              value={props.hexInput}
              onChange={(e) => props.setHexInput(e.target.value)}
            />
            <button
              className={
                isUpdatable() && isHexFormat() ? 'activeUpdateButton' : 'inactiveUpdateButton'
              }
              onClick={handleHexUpdate}
            >
              <SyncIcon />
            </button>
          </div>
          <div className="currentColor" style={{ position: 'relative' }}>
            {syncBgWithSelected && (
              <RowClickOverlay
                onClick={() => {
                  setSyncBgWithSelected(false);
                  props.onColorTargetChange('background');
                }}
                title="Click to unlink and edit background color"
              />
            )}
            <div
              className="color-sample color-sample--square"
              style={{
                backgroundColor: props.sceneBackgroundColor,
                boxShadow:
                  props.colorTarget === 'background'
                    ? '0 0 0 1px white, 0 0 0 4px #4e8cee'
                    : 'none',
                cursor: 'pointer',
              }}
              onClick={() => {
                if (syncBgWithSelected) setSyncBgWithSelected(false);
                props.onColorTargetChange('background');
              }}
            />
            <div className="hex" style={{ opacity: syncBgWithSelected ? 0.4 : 1 }}>
              #
            </div>
            <input
              className="hexInput"
              style={{ opacity: syncBgWithSelected ? 0.4 : 1 }}
              type="text"
              value={bgHexInput}
              onChange={(e) => setBgHexInput(e.target.value)}
              disabled={syncBgWithSelected}
            />
            <button
              className={
                !syncBgWithSelected && isBgUpdatable() && isBgHexFormat()
                  ? 'activeUpdateButton'
                  : 'inactiveUpdateButton'
              }
              style={{ opacity: syncBgWithSelected ? 0.4 : 1 }}
              onClick={handleBgUpdate}
              disabled={syncBgWithSelected}
            >
              <SyncIcon />
            </button>
          </div>
        </ColorRowsContent>
      </ColorRowsWrapper>
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
    display: flex;
    align-items: center;
    font-size: 20px;

    .color-sample {
      margin: 8px 8px 8px 8px;
      border: solid 1px #aaaaaa;
      width: 100px;
      height: 24px;
    }
    .color-sample--circle {
      width: 24px;
      border-radius: 50%;
    }
    .color-sample--square {
      width: 24px;
    }
    .hex {
      display: flex;
      align-items: center;
      justify-content: center;
      color: #aaaaaa;
    }
    .hexInput {
      width: 80px;
      height: 24px;
      font-size: 18px;
      border: solid 1px #999999;
      color: #000000;
      margin-right: 8px;
      &:disabled {
        background-color: #f0f0f0;
        cursor: not-allowed;
      }
    }
    .activeUpdateButton {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      padding: 0;
      background-color: #4e8cee;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      line-height: 0;
      svg {
        display: block;
      }
    }
    .inactiveUpdateButton {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      padding: 0;
      background-color: #cccccc;
      border: none;
      border-radius: 4px;
      line-height: 0;
      cursor: not-allowed;
      svg {
        display: block;
      }
    }
  }
`;

const ColorRowsWrapper = styled.div`
  display: flex;
  align-items: center;
  position: relative;
`;

/* ┌ shape: chain top → UP to circle center → RIGHT to circle left edge */
const ConnectorTop = styled.span`
  position: absolute;
  pointer-events: none;
  left: 12px;
  top: 20px;
  width: 20px;
  height: 5px;
  border-left: 1.5px solid #cccccc;
  border-top: 1.5px solid #cccccc;
  border-radius: 2px 0 0 0;
`;

/* └ shape: chain bottom → DOWN to square center → RIGHT to square left edge */
const ConnectorBottom = styled.span`
  position: absolute;
  pointer-events: none;
  left: 12px;
  top: 55px;
  width: 20px;
  height: 5px;
  border-left: 1.5px solid #cccccc;
  border-bottom: 1.5px solid #cccccc;
  border-radius: 0 0 0 2px;
`;

const ColorRowsContent = styled.div`
  flex: 1;
`;

const RowClickOverlay = styled.div`
  position: absolute;
  inset: 0;
  cursor: pointer;
  z-index: 1;
`;

const ChainButton = styled.button<{ $linked: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0 6px 0 2px;
  color: ${({ $linked }) => ($linked ? '#4e8cee' : '#bbbbbb')};
  flex-shrink: 0;
  transition: color 0.15s;

  &:hover {
    color: ${({ $linked }) => ($linked ? '#3a7de0' : '#888888')};
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
