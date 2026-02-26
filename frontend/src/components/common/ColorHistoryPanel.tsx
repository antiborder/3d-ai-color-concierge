import styled from 'styled-components';
import type { ColorHistoryItem } from '../../hooks/useColorHistory';

interface ColorHistoryPanelProps {
  history: ColorHistoryItem[];
  onColorSelect: (r: number, g: number, b: number) => void;
}

const ColorHistoryPanel = ({ history, onColorSelect }: ColorHistoryPanelProps) => {
  if (history.length === 0) {
    return null;
  }

  return (
    <StyledColorHistoryPanel>
      <HistoryTitle>Color History</HistoryTitle>
      <HistoryList>
        {history.map((item, index) => (
          <HistoryItem
            key={`${item.hex}-${item.timestamp}-${index}`}
            onClick={() => onColorSelect(item.r, item.g, item.b)}
          >
            <ColorSample style={{ backgroundColor: item.hex }} />
            <ColorCode>{item.hex}</ColorCode>
          </HistoryItem>
        ))}
      </HistoryList>
    </StyledColorHistoryPanel>
  );
};

const StyledColorHistoryPanel = styled.div`
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  max-width: 200px;
`;

const HistoryTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  user-select: none;
`;

const HistoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 400px;
  overflow-y: auto;
  overflow-x: hidden;

  /* スクロールバーのスタイリング */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`;

const HistoryItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f5f5f5;
  }

  &:active {
    background-color: #e8e8e8;
  }
`;

const ColorSample = styled.div`
  width: 120px;
  height: 24px;
  border: 1px solid #aaaaaa;
  border-radius: 4px;
  flex-shrink: 0;
`;

const ColorCode = styled.div`
  font-size: 14px;
  color: #333;
  font-family: monospace;
  user-select: none;
  flex-shrink: 0;
`;

export default ColorHistoryPanel;
