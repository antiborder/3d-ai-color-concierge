import { useState, useMemo } from 'react';
import styled from 'styled-components';
import sampleColors from '../../constants/sampleColors';

interface ColorItem {
  hex: string;
  name1: string;
  name2: string;
  name3: string;
  tag: string[];
}

interface ColorSearchPanelProps {
  onColorSelect: (r: number, g: number, b: number) => void;
  autoFocus?: boolean;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m
    ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
    : null;
}

const ColorSearchPanel = ({ onColorSelect, autoFocus = false }: ColorSearchPanelProps) => {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const lower = query.toLowerCase();
    return (sampleColors as ColorItem[])
      .filter(
        (c) =>
          c.name1.toLowerCase().includes(lower) ||
          c.name2.toLowerCase().includes(lower)
      )
      .slice(0, 50);
  }, [query]);

  return (
    <Panel>
      <SearchInput
        type="text"
        placeholder="Search colors…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus={autoFocus}
      />
      {results.length > 0 && (
        <ResultList>
          {results.map((color) => (
            <ResultItem
              key={`${color.hex}-${color.name1}`}
              onClick={() => {
                const rgb = hexToRgb(color.hex);
                if (rgb) onColorSelect(rgb.r, rgb.g, rgb.b);
              }}
            >
              <Swatch style={{ backgroundColor: color.hex }} />
              <Names>
                <Name1>{color.name1}</Name1>
                {color.name2 && <Name2>{color.name2}</Name2>}
              </Names>
            </ResultItem>
          ))}
        </ResultList>
      )}
    </Panel>
  );
};

const Panel = styled.div`
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 237px;
  max-width: 237px;
  width: 100%;
  box-sizing: border-box;
`;

const SearchInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  padding: 6px 8px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
  outline: none;

  &:focus {
    border-color: #4e8cee;
  }
`;

const ResultList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 280px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const ResultItem = styled.li`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 4px;
  border-radius: 3px;
  cursor: pointer;

  &:hover {
    background: #f0f4ff;
  }
`;

const Swatch = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 3px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  flex-shrink: 0;
`;

const Names = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const Name1 = styled.span`
  font-size: 13px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Name2 = styled.span`
  font-size: 11px;
  color: #888;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export default ColorSearchPanel;
