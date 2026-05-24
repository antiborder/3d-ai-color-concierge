import styled from 'styled-components';

export interface DisplayedColorsPanelProps {
  cssColorsEnabled: boolean;
  materialColorsEnabled: boolean;
  spectral12ColorsEnabled: boolean;
  japaneseColorsEnabled: boolean;
  munsellColorsEnabled: boolean;
  onCssColorsToggle: (enabled: boolean) => void;
  onMaterialColorsToggle: (enabled: boolean) => void;
  onSpectral12ColorsToggle: (enabled: boolean) => void;
  onJapaneseColorsToggle: (enabled: boolean) => void;
  onMunsellColorsToggle: (enabled: boolean) => void;
}

const DisplayedColorsPanel = ({
  cssColorsEnabled,
  materialColorsEnabled,
  spectral12ColorsEnabled,
  japaneseColorsEnabled,
  munsellColorsEnabled,
  onCssColorsToggle,
  onMaterialColorsToggle,
  onSpectral12ColorsToggle,
  onJapaneseColorsToggle,
  onMunsellColorsToggle,
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
      </CheckboxLabel>
      <CheckboxLabel>
        <input
          type="checkbox"
          checked={materialColorsEnabled}
          onChange={(e) => onMaterialColorsToggle(e.target.checked)}
        />
        <span>Material Design Colors</span>
      </CheckboxLabel>
      <CheckboxLabel>
        <input
          type="checkbox"
          checked={spectral12ColorsEnabled}
          onChange={(e) => onSpectral12ColorsToggle(e.target.checked)}
        />
        <span>12-color Spectral Wheel</span>
      </CheckboxLabel>
      <CheckboxLabel>
        <input
          type="checkbox"
          checked={japaneseColorsEnabled}
          onChange={(e) => onJapaneseColorsToggle(e.target.checked)}
        />
        <span>Japanese Traditional Colors</span>
      </CheckboxLabel>
      <CheckboxLabel>
        <input
          type="checkbox"
          checked={munsellColorsEnabled}
          onChange={(e) => onMunsellColorsToggle(e.target.checked)}
        />
        <span>Munsell Colors</span>
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
