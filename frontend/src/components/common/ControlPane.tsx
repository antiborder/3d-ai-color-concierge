import styled from 'styled-components';
import CurrentColor from './CurrentColor';
import DesktopLeftPane from './DesktopLeftPane';
import DesktopRightPane from './DesktopRightPane';
import MobilePane from './MobilePane';
import type { ControlPaneProps, ColorPanelProps } from '../../types/controlPane';
import { UI_PANEL_CLASS } from './uiPanel';

export { ControlPaneSliders } from '../menus/ControlPaneSliders';

export interface LayoutExtraProps extends ColorPanelProps {
  isDesktopLayout: boolean;
}

const ControlPane = (props: ControlPaneProps & LayoutExtraProps) => {
  const {
    isDesktopLayout,
    cssColorsEnabled,
    materialColorsEnabled,
    japaneseColorsEnabled,
    rgbGridColorsEnabled,
    onCssColorsToggle,
    onMaterialColorsToggle,
    onJapaneseColorsToggle,
    onRgbGridColorsToggle,
    colorHistory,
    harmonyMode,
    onHarmonyModeChange,
    harmonyColors,
    ...controlPaneProps
  } = props;

  const colorPanelProps: ColorPanelProps = {
    cssColorsEnabled,
    materialColorsEnabled,
    japaneseColorsEnabled,
    rgbGridColorsEnabled,
    onCssColorsToggle,
    onMaterialColorsToggle,
    onJapaneseColorsToggle,
    onRgbGridColorsToggle,
    colorHistory,
    harmonyMode,
    onHarmonyModeChange,
    harmonyColors,
  };

  return (
    <>
      {isDesktopLayout && (
        <RightPanel>
          <DesktopRightPane
            {...colorPanelProps}
            onColorSelect={controlPaneProps.handleClick}
            currentR={controlPaneProps.selectedRgb.r}
            currentG={controlPaneProps.selectedRgb.g}
            currentB={controlPaneProps.selectedRgb.b}
            onHelpClick={controlPaneProps.onHelpClick}
          />
        </RightPanel>
      )}
      <LeftColumn>
        <CurrentColor {...controlPaneProps} />
        {isDesktopLayout ? (
          <DesktopLeftPane {...controlPaneProps} />
        ) : (
          <MobilePane {...controlPaneProps} {...colorPanelProps} />
        )}
      </LeftColumn>
    </>
  );
};

// The columns are click-through: only the white panels inside them take pointer events,
// so dragging on the transparent space around/between panels rotates the 3D view.
const clickThroughExceptPanels = `
  pointer-events: none;

  .${UI_PANEL_CLASS}, .controlPanel {
    pointer-events: auto;
  }
`;

const LeftColumn = styled.div`
  position: absolute;
  top: 12px;
  left: 20px;
  z-index: 500;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  width: fit-content;
  max-width: calc(100vw - 40px);
  box-sizing: border-box;
  ${clickThroughExceptPanels}
`;

const RightPanel = styled.div`
  position: absolute;
  top: 62px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
  ${clickThroughExceptPanels}
`;

export default ControlPane;
