import styled from 'styled-components';

export interface DisplayedColorsPanelProps {
  cssColorsEnabled: boolean;
  materialColorsEnabled: boolean;
  japaneseColorsEnabled: boolean;
  onCssColorsToggle: (enabled: boolean) => void;
  onMaterialColorsToggle: (enabled: boolean) => void;
  onJapaneseColorsToggle: (enabled: boolean) => void;
}

const DisplayedColorsPanel = ({
  cssColorsEnabled,
  materialColorsEnabled,
  japaneseColorsEnabled,
  onCssColorsToggle,
  onMaterialColorsToggle,
  onJapaneseColorsToggle,
}: DisplayedColorsPanelProps) => {
  return (
    <Panel>
      <FilterTitle>Displayed Colors</FilterTitle>
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
          checked={japaneseColorsEnabled}
          onChange={(e) => onJapaneseColorsToggle(e.target.checked)}
        />
        <span>Japanese Traditional Colors</span>
      </CheckboxLabel>
    </Panel>
  );
};

const Panel = styled.div`
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
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
  gap: 8px;
  font-size: 14px;
  cursor: pointer;
  color: #333;
  user-select: none;

  input[type='checkbox'] {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: #4e8cee;
  }

  &:hover {
    color: #000;
  }
`;

export default DisplayedColorsPanel;
