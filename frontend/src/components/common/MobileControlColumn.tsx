import { useCallback, useState } from 'react';
import styled from 'styled-components';
import CurrentColor from '../ColorPicker/CurrentColor';
import { ControlPaneSliders } from '../ColorPicker/ControlPane';
import DisplayedColorsPanel from './DisplayedColorsPanel';
import ColorHistoryPanel from './ColorHistoryPanel';
import type { ControlPaneProps } from '../../types/controlPane';
import type { ColorHistoryItem } from '../../hooks/useColorHistory';

export type MobileSheetId = 'control' | 'displayed' | 'history';

interface MobileControlColumnProps extends ControlPaneProps {
  cssColorsEnabled: boolean;
  materialColorsEnabled: boolean;
  japaneseColorsEnabled: boolean;
  onCssColorsToggle: (enabled: boolean) => void;
  onMaterialColorsToggle: (enabled: boolean) => void;
  onJapaneseColorsToggle: (enabled: boolean) => void;
  colorHistory: ColorHistoryItem[];
  onColorSelect: (r: number, g: number, b: number) => void;
}

const MobileControlColumn = (props: MobileControlColumnProps) => {
  const {
    cssColorsEnabled,
    materialColorsEnabled,
    japaneseColorsEnabled,
    onCssColorsToggle,
    onMaterialColorsToggle,
    onJapaneseColorsToggle,
    colorHistory,
    onColorSelect,
    ...controlPaneProps
  } = props;

  const [activeSheet, setActiveSheet] = useState<MobileSheetId | null>(null);

  const onIconClick = useCallback((id: MobileSheetId) => {
    setActiveSheet((prev) => (prev === id ? null : id));
  }, []);

  return (
    <Column>
      <CurrentColor {...controlPaneProps} />

      <IconBar>
        <IconButton
          type="button"
          aria-label="Color controls"
          aria-pressed={activeSheet === 'control'}
          $active={activeSheet === 'control'}
          onClick={() => onIconClick('control')}
        >
          <IconSliders />
        </IconButton>
        <IconButton
          type="button"
          aria-label="Displayed colors"
          aria-pressed={activeSheet === 'displayed'}
          $active={activeSheet === 'displayed'}
          onClick={() => onIconClick('displayed')}
        >
          <IconPalette />
        </IconButton>
        <IconButton
          type="button"
          aria-label="Color history"
          aria-pressed={activeSheet === 'history'}
          $active={activeSheet === 'history'}
          onClick={() => onIconClick('history')}
        >
          <IconHistory />
        </IconButton>
      </IconBar>

      {activeSheet === 'control' && (
        <SheetBlock>
          <ControlPaneSliders {...controlPaneProps} />
        </SheetBlock>
      )}
      {activeSheet === 'displayed' && (
        <SheetBlock>
          <DisplayedColorsPanel
            cssColorsEnabled={cssColorsEnabled}
            materialColorsEnabled={materialColorsEnabled}
            japaneseColorsEnabled={japaneseColorsEnabled}
            onCssColorsToggle={onCssColorsToggle}
            onMaterialColorsToggle={onMaterialColorsToggle}
            onJapaneseColorsToggle={onJapaneseColorsToggle}
          />
        </SheetBlock>
      )}
      {activeSheet === 'history' && (
        <SheetBlock>
          {colorHistory.length > 1 ? (
            <ColorHistoryPanel history={colorHistory} onColorSelect={onColorSelect} />
          ) : (
            <EmptyHistory>No color history yet.</EmptyHistory>
          )}
        </SheetBlock>
      )}
    </Column>
  );
};

const Column = styled.div`
  position: absolute;
  top: 12px;
  left: 20px;
  z-index: 500;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  width: fit-content;
  max-width: calc(100vw - 40px);
  box-sizing: border-box;
  pointer-events: auto;
`;

const IconBar = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 8px;
  background: rgba(255, 255, 255);
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
`;

const IconButton = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0px solid ${(p) => (p.$active ? '#4e8cee' : '#ddd')};
  border-radius: 4px;
  background: ${(p) => (p.$active ? '#e8f2fd' : '#fff')};
  color: ${(p) => (p.$active ? '#999' : '#4e8cee')};
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s,
    color 0.15s;

  &:hover {
    background: ${(p) => (p.$active ? '#dceaf9' : '#f5f5f5')};
  }
`;

const SheetBlock = styled.div`
  max-height: min(64vh, 480px);
  overflow-y: auto;
  overflow-x: hidden;

  /*
   * アイコン行と Column の gap(8px) だけで十分なので、Sliders 列の先頭 RGB パネルだけ .controlPanel の margin-top を打ち消す。
   * （直下の .controlPanel:first-child だと TwoDPicker 内のパネルも巻き込むため、DOM 階層で限定する）
   */
  & > * > * > .controlPanel:first-child {
    margin-top: 0;
  }
`;

const EmptyHistory = styled.div`
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 12px;
  font-size: 14px;
  color: #666;
`;

function IconSliders() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 15h4v2H4v-2zm0-8h8v2H4V7zm0 4h12v2H4v-2zm16 5v2H4v-2h16z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconPalette() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9s1.5.67 1.5 1.5S7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconHistory() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"
        fill="currentColor"
      />
    </svg>
  );
}

export default MobileControlColumn;
