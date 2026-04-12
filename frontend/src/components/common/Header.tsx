import styled from 'styled-components';
import ColorHistoryPanel from './ColorHistoryPanel';
import ColorHarmonyPanel from './ColorHarmonyPanel';
import LanguageSelector from './LanguageSelector';
import DisplayedColorsPanel from './DisplayedColorsPanel';
import type { ColorHistoryItem } from '../../hooks/useColorHistory';
import type { HarmonyMode, HarmonyColor } from '../../utils/colorHarmony';

interface HeaderProps {
  isDesktopLayout?: boolean;
  cssColorsEnabled: boolean;
  materialColorsEnabled: boolean;
  spectral12ColorsEnabled: boolean;
  japaneseColorsEnabled: boolean;
  onCssColorsToggle: (enabled: boolean) => void;
  onMaterialColorsToggle: (enabled: boolean) => void;
  onSpectral12ColorsToggle: (enabled: boolean) => void;
  onJapaneseColorsToggle: (enabled: boolean) => void;
  colorHistory: ColorHistoryItem[];
  onColorSelect: (r: number, g: number, b: number) => void;
  harmonyMode: HarmonyMode;
  onHarmonyModeChange: (mode: HarmonyMode) => void;
  harmonyColors: HarmonyColor[];
  currentR: number;
  currentG: number;
  currentB: number;
}

const Header = ({
  isDesktopLayout = true,
  cssColorsEnabled,
  materialColorsEnabled,
  spectral12ColorsEnabled,
  japaneseColorsEnabled,
  onCssColorsToggle,
  onMaterialColorsToggle,
  onSpectral12ColorsToggle,
  onJapaneseColorsToggle,
  colorHistory,
  onColorSelect,
  harmonyMode,
  onHarmonyModeChange,
  harmonyColors,
  currentR,
  currentG,
  currentB,
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
      <DisplayedColorsPanel
        cssColorsEnabled={cssColorsEnabled}
        materialColorsEnabled={materialColorsEnabled}
        spectral12ColorsEnabled={spectral12ColorsEnabled}
        japaneseColorsEnabled={japaneseColorsEnabled}
        onCssColorsToggle={onCssColorsToggle}
        onMaterialColorsToggle={onMaterialColorsToggle}
        onSpectral12ColorsToggle={onSpectral12ColorsToggle}
        onJapaneseColorsToggle={onJapaneseColorsToggle}
      />
      <ColorHarmonyPanel
        mode={harmonyMode}
        onModeChange={onHarmonyModeChange}
        harmonyColors={harmonyColors}
        currentR={currentR}
        currentG={currentG}
        currentB={currentB}
        onColorSelect={onColorSelect}
      />
      <HistoryPanelWrapper>
        <ColorHistoryPanel history={colorHistory} onColorSelect={onColorSelect} />
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
