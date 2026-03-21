import styled from 'styled-components';
import ColorHistoryPanel from './ColorHistoryPanel';
import LanguageSelector from './LanguageSelector';
import DisplayedColorsPanel from './DisplayedColorsPanel';
import type { ColorHistoryItem } from '../../hooks/useColorHistory';

interface HeaderProps {
  isDesktopLayout?: boolean;
  cssColorsEnabled: boolean;
  materialColorsEnabled: boolean;
  japaneseColorsEnabled: boolean;
  onCssColorsToggle: (enabled: boolean) => void;
  onMaterialColorsToggle: (enabled: boolean) => void;
  onJapaneseColorsToggle: (enabled: boolean) => void;
  colorHistory: ColorHistoryItem[];
  onColorSelect: (r: number, g: number, b: number) => void;
}

const Header = ({
  isDesktopLayout = true,
  cssColorsEnabled,
  materialColorsEnabled,
  japaneseColorsEnabled,
  onCssColorsToggle,
  onMaterialColorsToggle,
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
        japaneseColorsEnabled={japaneseColorsEnabled}
        onCssColorsToggle={onCssColorsToggle}
        onMaterialColorsToggle={onMaterialColorsToggle}
        onJapaneseColorsToggle={onJapaneseColorsToggle}
      />
      <HistoryPanelWrapper>
        <ColorHistoryPanel history={colorHistory} onColorSelect={onColorSelect} />
      </HistoryPanelWrapper>
    </StyledHeader>
  );
};

const StyledHeader = styled.header`
  position: fixed;
  top: 0;
  right: 0;
  z-index: 1000;
  padding: 12px 20px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
`;

const HistoryPanelWrapper = styled.div``;

export default Header;
