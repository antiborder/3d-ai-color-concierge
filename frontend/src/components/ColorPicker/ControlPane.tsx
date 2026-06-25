import { useCallback, useState } from 'react';
import styled from 'styled-components';
import CurrentColor from './CurrentColor';
import { ControlPaneSliders } from '../menus/ControlPaneSliders';
import OneDPickerPanel from '../menus/OneDPickerPanel';
import CIEPanel from '../menus/CIEPanel';
import type { ControlPaneProps } from '../../types/controlPane';

export { ControlPaneSliders } from '../menus/ControlPaneSliders';

type DesktopMenuId = 'sliders' | 'oneDPicker' | 'cie';

const ControlPane = (props: ControlPaneProps) => {
  const [activeMenu, setActiveMenu] = useState<DesktopMenuId | null>('sliders');

  const onIconClick = useCallback((id: DesktopMenuId) => {
    setActiveMenu((prev) => (prev === id ? null : id));
  }, []);

  return (
    <ControlPaneRoot>
      <CurrentColor {...props} />
      <MenuBar>
        <MenuIconButton
          type="button"
          aria-label="Color sliders"
          aria-pressed={activeMenu === 'sliders'}
          $active={activeMenu === 'sliders'}
          onClick={() => onIconClick('sliders')}
        >
          <IconSliders />
        </MenuIconButton>
        <MenuIconButton
          type="button"
          aria-label="1D picker"
          aria-pressed={activeMenu === 'oneDPicker'}
          $active={activeMenu === 'oneDPicker'}
          onClick={() => onIconClick('oneDPicker')}
        >
          <IconOneDPicker />
        </MenuIconButton>
        <MenuIconButton
          type="button"
          aria-label="CIE xy diagram"
          aria-pressed={activeMenu === 'cie'}
          $active={activeMenu === 'cie'}
          onClick={() => onIconClick('cie')}
        >
          <IconCIE />
        </MenuIconButton>
      </MenuBar>
      {activeMenu === 'sliders' && <ControlPaneSliders {...props} />}
      {activeMenu === 'oneDPicker' && <OneDPickerPanel {...props} />}
      {activeMenu === 'cie' && <CIEPanel {...props} />}
    </ControlPaneRoot>
  );
};

const ControlPaneRoot = styled.div`
  width: 237px;
  position: absolute;
  top: 12px;
  left: 20px;
`;

const MenuBar = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  width: fit-content;
  gap: 8px;
  padding: 6px 8px;
  margin-top: 12px;
  background: rgba(255, 255, 255);
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const MenuIconButton = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: ${(p) => (p.$active ? '2px solid #4e8cee' : '0px solid transparent')};
  border-radius: 4px;
  background: ${(p) => (p.$active ? '#e8f2fd' : '#fff')};
  color: #4e8cee;
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s,
    color 0.15s;

  &:hover {
    background: ${(p) => (p.$active ? '#dceaf9' : '#f5f5f5')};
  }
`;

function IconSliders() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 15h4v2H4v-2zm0-8h8v2H4V7zm0 4h12v2H4v-2zm16 5v2H4v-2h16z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconOneDPicker() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
      {/* left half: white */}
      <path d="M5,10 L12,10 L12,14 L5,14 Q3,14 3,12 Q3,10 5,10 Z" fill="white" />
      {/* right half: currentColor */}
      <path d="M12,10 L19,10 Q21,10 21,12 Q21,14 19,14 L12,14 Z" fill="currentColor" />
      {/* outline */}
      <rect x="3" y="10" width="18" height="4" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
      {/* cursor */}
      <line x1="12" y1="7" x2="12" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconCIE() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
      {/* spectral locus: 380nm (bottom-left) → green peak (upper-left) → 700nm (right) */}
      <path
        d="M6,21 Q2,10 4,4 Q8,2 12,6 Q17,9 20,15"
        stroke="currentColor" strokeWidth="1.5" fill="none"
        strokeLinecap="round" strokeLinejoin="round"
      />
      {/* purple line (straight bottom closure) */}
      <line x1="6" y1="21" x2="20" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {/* sRGB triangle (dashed) */}
      <polygon points="18,14 10,8 6,20" stroke="currentColor" strokeWidth="0.8" fill="none" strokeDasharray="2,1.5" />
      {/* white point dot */}
      <circle cx="11" cy="14" r="1.5" fill="currentColor" />
    </svg>
  );
}

export default ControlPane;
