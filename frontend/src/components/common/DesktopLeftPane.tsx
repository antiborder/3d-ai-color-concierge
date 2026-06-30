import { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { ControlPaneSliders } from '../menus/ControlPaneSliders';
import OneDPickerPanel from '../menus/OneDPickerPanel';
import LabLchPanel from '../menus/LabLchPanel';
import CIEPanel from '../menus/CIEPanel';
import type { ControlPaneProps } from '../../types/controlPane';
import { IconSliders, IconOneDPicker, IconLabLch, IconCIE } from './MenuIcons';

type DesktopMenuId = 'sliders' | 'oneDPicker' | 'labLch' | 'cie';

const DesktopLeftPane = (props: ControlPaneProps) => {
  const [activeMenu, setActiveMenu] = useState<DesktopMenuId | null>('sliders');

  useEffect(() => {
    if (props.openCIEPanelSignal) setActiveMenu('cie');
  }, [props.openCIEPanelSignal]);

  useEffect(() => {
    props.onBridgeOpenChange(activeMenu === 'oneDPicker');
  }, [activeMenu]);

  const onIconClick = useCallback((id: DesktopMenuId) => {
    setActiveMenu((prev) => (prev === id ? null : id));
  }, []);

  return (
    <MenuAndContent>
      <DesktopMenuBar activeMenu={activeMenu} onIconClick={onIconClick} />
      <PanelArea>
        {activeMenu === 'sliders' && <ControlPaneSliders {...props} />}
        {activeMenu === 'oneDPicker' && <OneDPickerPanel {...props} />}
        {activeMenu === 'labLch' && <LabLchPanel {...props} />}
        {activeMenu === 'cie' && <CIEPanel {...props} />}
      </PanelArea>
    </MenuAndContent>
  );
};

interface DesktopMenuBarProps {
  activeMenu: DesktopMenuId | null;
  onIconClick: (id: DesktopMenuId) => void;
}

const DesktopMenuBar = ({ activeMenu, onIconClick }: DesktopMenuBarProps) => (
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
      aria-label="CIE xy diagram"
      aria-pressed={activeMenu === 'cie'}
      $active={activeMenu === 'cie'}
      onClick={() => onIconClick('cie')}
    >
      <IconCIE />
    </MenuIconButton>
    <MenuIconButton
      type="button"
      aria-label="Lab / LCH / Color Difference"
      aria-pressed={activeMenu === 'labLch'}
      $active={activeMenu === 'labLch'}
      onClick={() => onIconClick('labLch')}
    >
      <IconLabLch />
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
  </MenuBar>
);

const MenuAndContent = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 8px;
`;

const MenuBar = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 8px 6px;
  background: rgba(255, 255, 255);
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const PanelArea = styled.div`
  flex: 1;
  min-width: 0;
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

export default DesktopLeftPane;
