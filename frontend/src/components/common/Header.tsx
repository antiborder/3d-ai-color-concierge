import styled from 'styled-components';
import ColorHistoryPanel from '../menus/ColorHistoryPanel';
import ColorHarmonyPanel from '../menus/ColorHarmonyPanel';
import LanguageSelector from './LanguageSelector';
import DisplayedColorsPanel from '../menus/DisplayedColorsPanel';
import ColorSearchPanel from '../menus/ColorSearchPanel';
import type { ColorHistoryItem } from '../../hooks/useColorHistory';
import type { HarmonyMode, HarmonyColor } from '../../utils/colorHarmony';

interface HeaderProps {
  isDesktopLayout?: boolean;
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
  currentR: number;
  currentG: number;
  currentB: number;
  onHelpClick?: (topic: string) => void;
}

const Header = ({
  isDesktopLayout = true,
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
  currentR,
  currentG,
  currentB,
  onHelpClick,
}: HeaderProps) => {
  if (!isDesktopLayout) {
    return (
      <StyledHeader>
        <LanguageSelector />
      </StyledHeader>
    );
  }

  return (
    <StyledHeader>
      <LanguageSelector />
      <ColorSearchPanel onColorSelect={onColorSelect} />
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
        onHelpClick={onHelpClick}
      />
      <ColorHarmonyPanel
        mode={harmonyMode}
        onModeChange={onHarmonyModeChange}
        harmonyColors={harmonyColors}
        currentR={currentR}
        currentG={currentG}
        currentB={currentB}
        onColorSelect={onColorSelect}
        onHelpClick={onHelpClick}
      />
      <HistoryPanelWrapper>
        <ColorHistoryPanel history={colorHistory} onColorSelect={onColorSelect} onHelpClick={onHelpClick} />
      </HistoryPanelWrapper>
    </StyledHeader>
  );
};

const StyledHeader = styled.header`
  position: absolute;
  top: 12px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
`;

const HistoryPanelWrapper = styled.div``;

export default Header;
