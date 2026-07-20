import styled from 'styled-components';
import RgbPrimary from './slides/RgbPrimary';
import CmyPrimary from './slides/CmyPrimary';
import HsbSpace from './slides/HsbSpace';
import HslSpace from './slides/HslSpace';
import LabSpace from './slides/LabSpace';
import XyzSpace from './slides/XyzSpace';

interface EducationalContentProps {
  contentId: string | null;
  onClose: () => void;
}

const SLIDES: Record<string, React.ComponentType> = {
  rgb_primary: RgbPrimary,
  cmy_primary: CmyPrimary,
  hsb_space: HsbSpace,
  hsl_space: HslSpace,
  lab_space: LabSpace,
  xyz_space: XyzSpace,
};

const EducationalContent = ({ contentId, onClose }: EducationalContentProps) => {
  if (!contentId) return null;
  const Slide = SLIDES[contentId];
  if (!Slide) return null;

  return (
    <Overlay onClick={onClose}>
      <Panel onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>✕</CloseButton>
        <Slide />
      </Panel>
    </Overlay>
  );
};

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Panel = styled.div`
  position: relative;
  background: white;
  border-radius: 12px;
  padding: 16px;
  width: min(320px, 90vw);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
`;

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 12px;
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: #888;
  line-height: 1;
  padding: 2px 4px;
  &:hover { color: #333; }
`;

export default EducationalContent;
