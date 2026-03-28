import styled from 'styled-components';
import ColorHistoryPanel from './ColorHistoryPanel';
import LanguageSelector from './LanguageSelector';
import DisplayedColorsPanel from './DisplayedColorsPanel';
import type { ColorHistoryItem } from '../../hooks/useColorHistory';

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
