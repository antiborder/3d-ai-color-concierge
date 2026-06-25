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
  border: 0px solid ${(p) => (p.$active ? '#4e8cee' : '#ddd')};
  border-radius: 4px;
  background: ${(p) => (p.$active ? '#e8f2fd' : '#fff')};
  color: ${(p) => (p.$active ? '#999' : '#4e8cee')};
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
      <defs>
        <linearGradient id="cpGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f00" />
          <stop offset="17%" stopColor="#ff0" />
          <stop offset="33%" stopColor="#0f0" />
          <stop offset="50%" stopColor="#0ff" />
          <stop offset="67%" stopColor="#00f" />
          <stop offset="83%" stopColor="#f0f" />
          <stop offset="100%" stopColor="#f00" />
        </linearGradient>
      </defs>
      <rect x="3" y="10" width="18" height="4" rx="2" fill="url(#cpGrad)" />
      <line x1="12" y1="7" x2="12" y2="17" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="7" x2="12" y2="17" stroke="rgba(0,0,0,0.4)" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

function IconCIE() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 4 C7 4 3 7.5 3 12 C3 16 6 19.5 10 20.5 L12 13 L14 20.5 C18 19.5 21 16 21 12 C21 7.5 17 4 12 4 Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <circle cx="12" cy="13" r="1.5" fill="currentColor" />
    </svg>
  );
}

export default ControlPane;
