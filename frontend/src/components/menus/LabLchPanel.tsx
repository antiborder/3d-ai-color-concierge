import styled from 'styled-components';
import { PanelShell } from './PanelShell';
import LabSliders from './controls/LabSliders';
import LchSliders from './controls/LchSliders';
import TwoDPicker from './controls/TwoDPicker';
import ColorDifferencePanel from './controls/ColorDifferencePanel';
import type { ControlPaneProps } from '../../types/controlPane';

const LabLchPanel = (props: ControlPaneProps) => (
  <PanelShell>
    <Section>
      <LabSliders {...props} />
      {props.shape === 'Lab' && <TwoDPicker {...props} />}
      <LchSliders {...props} />
      {props.shape === 'LCH' && <TwoDPicker {...props} />}
      <ColorDifferencePanel colorA={props.bridgeColorA} colorB={props.bridgeColorB} />
    </Section>
  </PanelShell>
);

const Section = styled.div``;

export default LabLchPanel;
