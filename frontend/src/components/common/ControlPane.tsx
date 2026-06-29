import styled from 'styled-components';
import CurrentColor from './CurrentColor';
import DesktopLeftPane from './DesktopLeftPane';
import DesktopRightPane from './DesktopRightPane';
import MobilePane from './MobilePane';
import type { ControlPaneProps, ColorPanelProps } from '../../types/controlPane';

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
            currentR={controlPaneProps.focusR}
            currentG={controlPaneProps.focusG}
            currentB={controlPaneProps.focusB}
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
  pointer-events: auto;
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
`;

export default ControlPane;
