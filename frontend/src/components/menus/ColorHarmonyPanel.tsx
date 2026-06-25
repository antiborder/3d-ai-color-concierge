import type { MouseEvent } from 'react';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import type { HarmonyMode, HarmonyColor } from '../../utils/colorHarmony';
import HelpIcon from '../common/HelpIcon';

interface ColorHarmonyPanelProps {
  mode: HarmonyMode;
  onModeChange: (mode: HarmonyMode) => void;
  harmonyColors: HarmonyColor[];
  currentR: number;
  currentG: number;
  currentB: number;
  onColorSelect: (r: number, g: number, b: number) => void;
  onHelpClick?: (topic: string) => void;
}

const OPTIONS: { value: HarmonyMode; label: string }[] = [
  { value: 'none', label: 'Off' },
  { value: 'complementary', label: 'Complementary' },
  { value: 'triangle', label: 'Triangle' },
  { value: 'square', label: 'Square' },
  { value: 'pentagon', label: 'Pentagon' },
  { value: 'hexagon', label: 'Hexagon' },
  { value: 'heptagon', label: 'Heptagon' },
  { value: 'octagon', label: 'Octagon' },
  { value: 'nonagon', label: 'Nonagon' },
];

function toHex(r: number, g: number, b: number): string {
  return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
}

const ColorHarmonyPanel = ({
  mode,
  onModeChange,
  harmonyColors,
  currentR,
  currentG,
  currentB,
  onColorSelect,
  onHelpClick,
}: ColorHarmonyPanelProps) => {
  const handleCopyHex = (e: MouseEvent, hex: string) => {
    e.stopPropagation();
    void navigator.clipboard.writeText(hex).then(() => {
      toast.success(`Color Code "${hex}" was copied to the clipboard.`);
    });
  };

  const currentHex = toHex(currentR, currentG, currentB);

  // harmony colors + current color at the end
  const colorItems: { label: string; r: number; g: number; b: number; hex: string }[] = [
    ...harmonyColors.map((c, i) => ({
      label: String(i + 1),
      r: c.r,
      g: c.g,
      b: c.b,
      hex: toHex(c.r, c.g, c.b),
    })),
    { label: 'Selected', r: currentR, g: currentG, b: currentB, hex: currentHex },
  ];

  return (
    <Panel>
      <TitleRow>
        <PanelTitle>Color Harmony</PanelTitle>
        {onHelpClick && <HelpIcon topic="color_harmony" onHelpClick={onHelpClick} />}
      </TitleRow>
      <Select value={mode} onChange={(e) => onModeChange(e.target.value as HarmonyMode)}>
        {OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>

      {mode !== 'none' && (
        <ColorList>
          {colorItems.map((item) => (
            <ColorItem key={item.label} onClick={() => onColorSelect(item.r, item.g, item.b)}>
              <ItemLabel $small={item.label === 'Selected'}>{item.label}</ItemLabel>
              <ColorSwatch style={{ backgroundColor: item.hex }} />
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
            </ColorItem>
          ))}
        </ColorList>
      )}
    </Panel>
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

const Panel = styled.div`
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 237px;
  max-width: 237px;
  width: 100%;
  box-sizing: border-box;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
`;

const PanelTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #333;
  user-select: none;
`;

const Select = styled.select`
  width: 100%;
  padding: 6px 8px;
  font-size: 14px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  color: #333;
  cursor: pointer;
  outline: none;
  box-sizing: border-box;

  &:focus {
    border-color: #4e8cee;
  }
`;

const ColorList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ColorItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 6px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  box-sizing: border-box;

  &:hover {
    background-color: #f5f5f5;
  }

  &:active {
    background-color: #e8e8e8;
  }
`;

const ItemLabel = styled.div<{ $small?: boolean }>`
  font-size: ${(p) => (p.$small ? '10px' : '12px')};
  color: #666;
  font-weight: 500;
  width: 42px;
  text-align: right;
  user-select: none;
  flex-shrink: 0;
`;

const ColorSwatch = styled.div`
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

export default ColorHarmonyPanel;
