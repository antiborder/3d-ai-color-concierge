import styled from 'styled-components';
import { PanelShell } from './PanelShell';
import XyzSliders from './controls/XyzSliders';
import CIExyDiagram from './controls/CIExyDiagram';
import type { ControlPaneProps } from '../../types/controlPane';

const CIEPanel = (props: ControlPaneProps) => (
  <PanelShell>
    <Section>
      <XyzSliders {...props} />
      <CIExyDiagram focusR={props.focusR} focusG={props.focusG} focusB={props.focusB} />
    </Section>
  </PanelShell>
);

const Section = styled.div``;

export default CIEPanel;
