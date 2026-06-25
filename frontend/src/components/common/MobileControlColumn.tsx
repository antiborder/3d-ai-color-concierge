import { useCallback, useState } from 'react';
import styled from 'styled-components';
import CurrentColor from '../ColorPicker/CurrentColor';
import { ControlPaneSliders } from '../menus/ControlPaneSliders';
import OneDPickerPanel from '../menus/OneDPickerPanel';
import CIEPanel from '../menus/CIEPanel';
import DisplayedColorsPanel from '../menus/DisplayedColorsPanel';
import ColorHarmonyPanel from '../menus/ColorHarmonyPanel';
import ColorHistoryPanel from '../menus/ColorHistoryPanel';
import ColorSearchPanel from '../menus/ColorSearchPanel';
import type { ControlPaneProps } from '../../types/controlPane';
import type { ColorHistoryItem } from '../../hooks/useColorHistory';
import type { HarmonyMode, HarmonyColor } from '../../utils/colorHarmony';

export type MobileSheetId = 'control' | 'oneDPicker' | 'cie' | 'displayed' | 'harmony' | 'history' | 'search';

interface MobileControlColumnProps extends ControlPaneProps {
  cssColorsEnabled: boolean;
  materialColorsEnabled: boolean;
  spectral12ColorsEnabled: boolean;
  japaneseColorsEnabled: boolean;
  rgbGridColorsEnabled: boolean;
  onCssColorsToggle: (enabled: boolean) => void;
  onMaterialColorsToggle: (enabled: boolean) => void;
  onSpectral12ColorsToggle: (enabled: boolean) => void;
  onJapaneseColorsToggle: (enabled: boolean) => void;
  onRgbGridColorsToggle: (enabled: boolean) => void;
  colorHistory: ColorHistoryItem[];
  onColorSelect: (r: number, g: number, b: number) => void;
  harmonyMode: HarmonyMode;
  onHarmonyModeChange: (mode: HarmonyMode) => void;
  harmonyColors: HarmonyColor[];
}

const MobileControlColumn = (props: MobileControlColumnProps) => {
  const {
    cssColorsEnabled,
    materialColorsEnabled,
    spectral12ColorsEnabled,
    japaneseColorsEnabled,
    rgbGridColorsEnabled,
    onCssColorsToggle,
    onMaterialColorsToggle,
    onSpectral12ColorsToggle,
    onJapaneseColorsToggle,
    onRgbGridColorsToggle,
    colorHistory,
    onColorSelect,
    harmonyMode,
    onHarmonyModeChange,
    harmonyColors,
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
          aria-label="Color harmony"
          aria-pressed={activeSheet === 'harmony'}
          $active={activeSheet === 'harmony'}
          onClick={() => onIconClick('harmony')}
        >
          <IconHarmony />
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
        <IconButton
          type="button"
          aria-label="Search colors"
          aria-pressed={activeSheet === 'search'}
          $active={activeSheet === 'search'}
          onClick={() => onIconClick('search')}
        >
          <IconSearch />
        </IconButton>
        <IconButton
          type="button"
          aria-label="1D picker"
          aria-pressed={activeSheet === 'oneDPicker'}
          $active={activeSheet === 'oneDPicker'}
          onClick={() => onIconClick('oneDPicker')}
        >
          <IconOneDPicker />
        </IconButton>
        <IconButton
          type="button"
          aria-label="CIE xy diagram"
          aria-pressed={activeSheet === 'cie'}
          $active={activeSheet === 'cie'}
          onClick={() => onIconClick('cie')}
        >
          <IconCIE />
        </IconButton>
      </IconBar>

      {activeSheet === 'control' && (
        <SheetBlock>
          <ControlPaneSliders {...controlPaneProps} />
        </SheetBlock>
      )}
      {activeSheet === 'oneDPicker' && (
        <SheetBlock>
          <OneDPickerPanel {...controlPaneProps} />
        </SheetBlock>
      )}
      {activeSheet === 'cie' && (
        <SheetBlock>
          <CIEPanel {...controlPaneProps} />
        </SheetBlock>
      )}
      {activeSheet === 'displayed' && (
        <SheetBlock>
          <DisplayedColorsPanel
            cssColorsEnabled={cssColorsEnabled}
            materialColorsEnabled={materialColorsEnabled}
            spectral12ColorsEnabled={spectral12ColorsEnabled}
            japaneseColorsEnabled={japaneseColorsEnabled}
            rgbGridColorsEnabled={rgbGridColorsEnabled}
            onCssColorsToggle={onCssColorsToggle}
            onMaterialColorsToggle={onMaterialColorsToggle}
            onSpectral12ColorsToggle={onSpectral12ColorsToggle}
            onJapaneseColorsToggle={onJapaneseColorsToggle}
            onRgbGridColorsToggle={onRgbGridColorsToggle}
          />
        </SheetBlock>
      )}
      {activeSheet === 'harmony' && (
        <SheetBlock>
          <ColorHarmonyPanel
            mode={harmonyMode}
            onModeChange={onHarmonyModeChange}
            harmonyColors={harmonyColors}
            currentR={controlPaneProps.focusR}
            currentG={controlPaneProps.focusG}
            currentB={controlPaneProps.focusB}
            onColorSelect={onColorSelect}
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
      {activeSheet === 'search' && (
        <SheetBlock>
          <ColorSearchPanel onColorSelect={onColorSelect} autoFocus />
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
  gap: 12px;
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
  width: 40px;
  height: 40px;
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
  max-height: min(80vh, 600px);
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
  font-size: 16px;
  color: #666;
`;

function IconSliders() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 15h4v2H4v-2zm0-8h8v2H4V7zm0 4h12v2H4v-2zm16 5v2H4v-2h16z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconPalette() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9s1.5.67 1.5 1.5S7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconHarmony() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconHistory() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconOneDPicker() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
      <defs>
        <linearGradient id="mobGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f00" />
          <stop offset="17%" stopColor="#ff0" />
          <stop offset="33%" stopColor="#0f0" />
          <stop offset="50%" stopColor="#0ff" />
          <stop offset="67%" stopColor="#00f" />
          <stop offset="83%" stopColor="#f0f" />
          <stop offset="100%" stopColor="#f00" />
        </linearGradient>
      </defs>
      <rect x="3" y="10" width="18" height="4" rx="2" fill="url(#mobGrad)" />
      <line x1="12" y1="7" x2="12" y2="17" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="7" x2="12" y2="17" stroke="rgba(0,0,0,0.4)" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

function IconCIE() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 4 C7 4 3 7.5 3 12 C3 16 6 19.5 10 20.5 L12 13 L14 20.5 C18 19.5 21 16 21 12 C21 7.5 17 4 12 4 Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <circle cx="12" cy="13" r="1.5" fill="currentColor" />
    </svg>
  );
}

export default MobileControlColumn;
