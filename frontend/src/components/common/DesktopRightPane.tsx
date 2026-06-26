import styled from 'styled-components';
import ColorHistoryPanel from '../menus/ColorHistoryPanel';
import ColorHarmonyPanel from '../menus/ColorHarmonyPanel';
import DisplayedColorsPanel from '../menus/DisplayedColorsPanel';
import ColorSearchPanel from '../menus/ColorSearchPanel';
import type { ColorPanelProps } from '../../types/controlPane';

interface DesktopRightPaneProps extends ColorPanelProps {
  onColorSelect: (r: number, g: number, b: number) => void;
  currentR: number;
  currentG: number;
  currentB: number;
  onHelpClick?: (topic: string) => void;
}

const DesktopRightPane = ({
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
}: DesktopRightPaneProps) => {
  return (
    <StyledHeader>
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
        <ColorHistoryPanel
          history={colorHistory}
          onColorSelect={onColorSelect}
          onHelpClick={onHelpClick}
        />
      </HistoryPanelWrapper>
    </StyledHeader>
  );
};

const StyledHeader = styled.header`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
`;

const HistoryPanelWrapper = styled.div``;

export default DesktopRightPane;
