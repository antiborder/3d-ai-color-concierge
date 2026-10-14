import styled from 'styled-components';
import { PanelShell } from './PanelShell';
import XyzSliders from './controls/XyzSliders';
import OneDPicker from './controls/OneDPicker';
import CIExyDiagram from './controls/CIExyDiagram';
import type { ControlPaneProps } from '../../types/controlPane';

const CIEPanel = (props: ControlPaneProps) => (
  <PanelShell>
    <Section>
      <XyzSliders {...props} />
      {(props.shape === 'XYZ' || props.shape === 'xyz' || props.shape === 'xy') && (
        <OneDPicker {...props} />
      )}
      <CIExyDiagram focusR={props.focusR} focusG={props.focusG} focusB={props.focusB} onColorSelect={props.handleClick} onHelpClick={props.onHelpClick} />
    </Section>
  </PanelShell>
);

const Section = styled.div``;

export default CIEPanel;
