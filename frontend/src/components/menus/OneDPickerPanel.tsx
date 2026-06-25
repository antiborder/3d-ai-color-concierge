import styled from 'styled-components';
import { PanelShell } from './PanelShell';
import OneDPicker from './sliders/OneDPicker';
import type { ControlPaneProps } from '../../types/controlPane';

const OneDPickerPanel = (props: ControlPaneProps) => (
  <PanelShell>
    <Section>
      <OneDPicker
        currentColor={{ r: props.focusR, g: props.focusG, b: props.focusB }}
        shape={props.shape}
        onColorSelect={props.handleClick}
        bridgeColorA={props.bridgeColorA}
        bridgeColorB={props.bridgeColorB}
        onSetBridgeColorA={props.onSetBridgeColorA}
        onSetBridgeColorB={props.onSetBridgeColorB}
        isBridgeOpen={props.isBridgeOpen}
        onBridgeOpenChange={props.onBridgeOpenChange}
        isTwoDPickerOpen={props.isTwoDPickerOpen}
        onTwoDPickerOpenChange={props.onTwoDPickerOpenChange}
        onHelpClick={props.onHelpClick}
      />
    </Section>
  </PanelShell>
);

const Section = styled.div``;

export default OneDPickerPanel;
