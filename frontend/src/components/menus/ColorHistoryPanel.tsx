import type { MouseEvent } from 'react';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import type { ColorHistoryItem } from '../../hooks/useColorHistory';
import HelpIcon from '../common/HelpIcon';

interface ColorHistoryPanelProps {
  history: ColorHistoryItem[];
  onColorSelect: (r: number, g: number, b: number) => void;
  onHelpClick?: (topic: string) => void;
}

const ColorHistoryPanel = ({ history, onColorSelect, onHelpClick }: ColorHistoryPanelProps) => {
  // 現在の色（最初の要素）を除外し、過去の色のみを表示（最大100色）
  const pastHistory = history.slice(1, 101);

  if (pastHistory.length === 0) {
    return null;
  }

  const handleCopyHex = (e: MouseEvent, hex: string) => {
    e.stopPropagation();
    void navigator.clipboard.writeText(hex).then(() => {
      toast.success(`Color Code "${hex}" was copied to the clipboard.`);
    });
  };

  return (
    <StyledColorHistoryPanel>
      <TitleRow>
        <HistoryTitle>Color History</HistoryTitle>
        {onHelpClick && <HelpIcon topic="color_history" onHelpClick={onHelpClick} />}
      </TitleRow>
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
              <HexRow>
                <ColorCode>{item.hex}</ColorCode>
                <CopyIconButton
                  type="button"
                  aria-label={`Copy ${item.hex}`}
                  onClick={(e) => handleCopyHex(e, item.hex)}
                >
                  <CopyIconSvg />
                </CopyIconButton>
              </HexRow>
            </HistoryItem>
          );
        })}
      </HistoryList>
    </StyledColorHistoryPanel>
  );
};

function CopyIconSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"
        fill="currentColor"
      />
    </svg>
  );
}

const StyledColorHistoryPanel = styled.div`
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 4px;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  max-width: 300px;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
`;

const HistoryTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #333;
  user-select: none;
`;

const HistoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 400px;
  min-width: 0;
  overflow-y: auto;
  overflow-x: auto;

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
  min-width: min-content;
  box-sizing: border-box;

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
  flex: 1 1 48px;
  min-width: 48px;
  max-width: 120px;
  height: 24px;
  border: 1px solid #aaaaaa;
  border-radius: 4px;
`;

const HexRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
`;

const ColorCode = styled.div`
  font-size: 14px;
  color: #333;
  font-family: monospace;
  user-select: none;
  white-space: nowrap;
`;

const CopyIconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  padding: 0;
  margin: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #555;
  cursor: pointer;
  transition:
    background-color 0.15s,
    color 0.15s;

  &:hover {
    background-color: #eaeaea;
    color: #222;
  }

  &:focus-visible {
    outline: 2px solid #4e8cee;
    outline-offset: 1px;
  }
`;

export default ColorHistoryPanel;
