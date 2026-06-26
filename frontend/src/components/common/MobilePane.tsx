import { useCallback, useState } from 'react';
import styled from 'styled-components';
import { ControlPaneSliders } from '../menus/ControlPaneSliders';
import OneDPickerPanel from '../menus/OneDPickerPanel';
import CIEPanel from '../menus/CIEPanel';
import DisplayedColorsPanel from '../menus/DisplayedColorsPanel';
import ColorHarmonyPanel from '../menus/ColorHarmonyPanel';
import ColorHistoryPanel from '../menus/ColorHistoryPanel';
import ColorSearchPanel from '../menus/ColorSearchPanel';
import type { ControlPaneProps, ColorPanelProps } from '../../types/controlPane';
import {
  IconSliders,
  IconOneDPicker,
  IconCIE,
  IconPalette,
  IconHarmony,
  IconHistory,
  IconSearch,
} from './MenuIcons';

export type MobileSheetId =
  | 'control'
  | 'oneDPicker'
  | 'cie'
  | 'displayed'
  | 'harmony'
  | 'history'
  | 'search';

interface MobilePaneProps extends ControlPaneProps, ColorPanelProps {}

const MobilePane = (props: MobilePaneProps) => {
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
    harmonyMode,
    onHarmonyModeChange,
    harmonyColors,
    ...controlPaneProps
  } = props;

  const [activeSheet, setActiveSheet] = useState<MobileSheetId | null>(null);

  const onIconClick = useCallback((id: MobileSheetId) => {
    setActiveSheet((prev) => (prev === id ? null : id));
  }, []);

  const displaySettingsProps = {
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
  };

  const harmonyPanelProps = {
    mode: harmonyMode,
    onModeChange: onHarmonyModeChange,
    harmonyColors,
    currentR: controlPaneProps.focusR,
    currentG: controlPaneProps.focusG,
    currentB: controlPaneProps.focusB,
    onColorSelect: controlPaneProps.handleClick,
  };

  return (
    <>
      <MobileMenuBar activeSheet={activeSheet} onIconClick={onIconClick} />

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
          <DisplayedColorsPanel {...displaySettingsProps} />
        </SheetBlock>
      )}
      {activeSheet === 'harmony' && (
        <SheetBlock>
          <ColorHarmonyPanel {...harmonyPanelProps} />
        </SheetBlock>
      )}
      {activeSheet === 'history' && (
        <SheetBlock>
          {colorHistory.length > 1 ? (
            <ColorHistoryPanel
              history={colorHistory}
              onColorSelect={controlPaneProps.handleClick}
            />
          ) : (
            <EmptyHistory>No color history yet.</EmptyHistory>
          )}
        </SheetBlock>
      )}
      {activeSheet === 'search' && (
        <SheetBlock>
          <ColorSearchPanel onColorSelect={controlPaneProps.handleClick} autoFocus />
        </SheetBlock>
      )}
    </>
  );
};

interface MobileMenuBarProps {
  activeSheet: MobileSheetId | null;
  onIconClick: (id: MobileSheetId) => void;
}

const MobileMenuBar = ({ activeSheet, onIconClick }: MobileMenuBarProps) => (
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
);

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
  border: ${(p) => (p.$active ? '2px solid #4e8cee' : '0px solid transparent')};
  border-radius: 4px;
  background: ${(p) => (p.$active ? '#e8f2fd' : '#fff')};
  color: #4e8cee;
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

export default MobilePane;
