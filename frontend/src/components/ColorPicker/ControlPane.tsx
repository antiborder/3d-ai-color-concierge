import styled from 'styled-components';
import CurrentColor from './CurrentColor';
import type { ControlPaneProps } from '../../types/controlPane';
import { ControlPaneSliders } from '../menus/ControlPaneSliders';
export { ControlPaneSliders } from '../menus/ControlPaneSliders';

const ControlPane = (props: ControlPaneProps) => {
  return (
    <ControlPaneRoot>
      <CurrentColor {...props} />
      <ControlPaneSliders {...props} />
    </ControlPaneRoot>
  );
};

const ControlPaneRoot = styled.div`
  width: 237px;
  position: absolute;
  top: 12px;
  left: 20px;
`;

export default ControlPane;
