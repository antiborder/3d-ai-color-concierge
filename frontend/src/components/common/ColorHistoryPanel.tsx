import styled from 'styled-components';
import type { ColorHistoryItem } from '../../hooks/useColorHistory';

interface ColorHistoryPanelProps {
  history: ColorHistoryItem[];
  onColorSelect: (r: number, g: number, b: number) => void;
}

const ColorHistoryPanel = ({ history, onColorSelect }: ColorHistoryPanelProps) => {
  // 現在の色（最初の要素）を除外し、過去の色のみを表示（最大100色）
  const pastHistory = history.slice(1, 101);

  if (pastHistory.length === 0) {
    return null;
  }

  return (
    <StyledColorHistoryPanel>
      <HistoryTitle>Color History</HistoryTitle>
      <HistoryList>
        {pastHistory.map((item, index) => {
          const number = index + 1;
          return (
            <HistoryItem
              key={`${item.hex}-${item.timestamp}-${index}`}
              onClick={() => onColorSelect(item.r, item.g, item.b)}
            >
              <HistoryNumber>{number}</HistoryNumber>
              <ColorSample style={{ backgroundColor: item.hex }} />
              <ColorCode>{item.hex}</ColorCode>
            </HistoryItem>
          );
        })}
      </HistoryList>
    </StyledColorHistoryPanel>
  );
};

const StyledColorHistoryPanel = styled.div`
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 4px;
  min-width: 237px;
  max-width: 237px;
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

const HistoryNumber = styled.div`
  font-size: 12px;
  color: #666;
  font-weight: 500;
  min-width: 24px;
  text-align: right;
  user-select: none;
  flex-shrink: 0;
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
