import styled from 'styled-components';
import HelpIcon from './HelpIcon';

export interface DisplayedColorsPanelProps {
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
  onHelpClick?: (topic: string) => void;
}

const DisplayedColorsPanel = ({
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
  onHelpClick,
}: DisplayedColorsPanelProps) => {
  return (
    <Panel>
      <FilterTitle>Color Samples</FilterTitle>
      <CheckboxLabel>
        <input
          type="checkbox"
          checked={cssColorsEnabled}
          onChange={(e) => onCssColorsToggle(e.target.checked)}
        />
        <span>CSS Named Colors</span>
        {onHelpClick && <HelpIcon topic="css_colors" onHelpClick={onHelpClick} />}
      </CheckboxLabel>
      <CheckboxLabel>
        <input
          type="checkbox"
          checked={materialColorsEnabled}
          onChange={(e) => onMaterialColorsToggle(e.target.checked)}
        />
        <span>Material Design Colors</span>
        {onHelpClick && <HelpIcon topic="material_colors" onHelpClick={onHelpClick} />}
      </CheckboxLabel>
      <CheckboxLabel>
        <input
          type="checkbox"
          checked={spectral12ColorsEnabled}
          onChange={(e) => onSpectral12ColorsToggle(e.target.checked)}
        />
        <span>12-color Spectral Wheel</span>
        {onHelpClick && <HelpIcon topic="spectral_colors" onHelpClick={onHelpClick} />}
      </CheckboxLabel>
      <CheckboxLabel>
        <input
          type="checkbox"
          checked={japaneseColorsEnabled}
          onChange={(e) => onJapaneseColorsToggle(e.target.checked)}
        />
        <span>Japanese Traditional Colors</span>
        {onHelpClick && <HelpIcon topic="japanese_colors" onHelpClick={onHelpClick} />}
      </CheckboxLabel>
      <CheckboxLabel>
        <input
          type="checkbox"
          checked={rgbGridColorsEnabled}
          onChange={(e) => onRgbGridColorsToggle(e.target.checked)}
        />
        <span>RGB Cube Grid</span>
        {onHelpClick && <HelpIcon topic="rgb_grid" onHelpClick={onHelpClick} />}
      </CheckboxLabel>
    </Panel>
  );
};

const Panel = styled.div`
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 237px;
  max-width: 237px;
  width: 100%;
  box-sizing: border-box;
`;

const FilterTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  user-select: none;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  cursor: pointer;
  color: #333;
  user-select: none;

  input[type='checkbox'] {
    width: 20px;
    height: 20px;
    cursor: pointer;
    accent-color: #4e8cee;
  }

  &:hover {
    color: #000;
  }
`;

export default DisplayedColorsPanel;
