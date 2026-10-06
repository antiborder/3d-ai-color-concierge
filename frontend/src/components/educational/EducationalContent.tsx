import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import RgbPrimary from './slides/RgbPrimary';
import CmyPrimary from './slides/CmyPrimary';
import HsbSpace from './slides/HsbSpace';
import HslSpace from './slides/HslSpace';
import LabSpace from './slides/LabSpace';
import XyzSpace from './slides/XyzSpace';
import OklchLineage from './slides/OklchLineage';
import OklchVsLch from './slides/OklchVsLch';
import LightVisibleReason from './slides/LightVisibleReason';
import ConeCells from './slides/ConeCells';
import MagentaNotInRainbow from './slides/MagentaNotInRainbow';
import BlueGreenCyan from './slides/BlueGreenCyan';
import RedGreenYellow from './slides/RedGreenYellow';
import RainbowMechanism from './slides/RainbowMechanism';
import NatureOfLight from './slides/NatureOfLight';
import ElectromagneticWave from './slides/ElectromagneticWave';
import SkyBlueReason from './slides/SkyBlueReason';
import SunsetRedReason from './slides/SunsetRedReason';
import ColorMatchingExperiment from './slides/ColorMatchingExperiment';
import RgbSpace from './slides/RgbSpace';
import HsbVsHsl from './slides/HsbVsHsl';
import LightPigmentPrimaryRelation from './slides/LightPigmentPrimaryRelation';
import CmykSpace from './slides/CmykSpace';
import HexCode from './slides/HexCode';
import ScreenMechanism from './slides/ScreenMechanism';
import XyzLmsRelation from './slides/XyzLmsRelation';
import RgbXyzRelation from './slides/RgbXyzRelation';
import Brightness from './slides/Brightness';
import Lightness from './slides/Lightness';
import PlaceholderSlide from './slides/PlaceholderSlide';

// Every slide uses the same box as the HSB slide (its natural size at 320px wide).
const SLIDE_WIDTH = 'min(320px, 90vw)';
const SLIDE_HEIGHT = '470px';

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
  oklch_lineage: OklchLineage,
  oklch_vs_lch: OklchVsLch,
  light_visible_reason: LightVisibleReason,
  cone_cells: ConeCells,
  magenta_not_in_rainbow: MagentaNotInRainbow,
  blue_green_cyan: BlueGreenCyan,
  red_green_yellow: RedGreenYellow,
  rainbow_mechanism: RainbowMechanism,
  nature_of_light: NatureOfLight,
  electromagnetic_wave: ElectromagneticWave,
  sky_blue_reason: SkyBlueReason,
  sunset_red_reason: SunsetRedReason,
  color_matching_experiment: ColorMatchingExperiment,
  rgb_space: RgbSpace,
  hsb_vs_hsl: HsbVsHsl,
  light_pigment_primary_relation: LightPigmentPrimaryRelation,
  cmyk_space: CmykSpace,
  hex_code: HexCode,
  screen_mechanism: ScreenMechanism,
  xyz_lms_relation: XyzLmsRelation,
  rgb_xyz_relation: RgbXyzRelation,
  brightness: Brightness,
  lightness: Lightness,
};

const EducationalContent = ({ contentId, onClose }: EducationalContentProps) => {
  const { i18n } = useTranslation();
  if (!contentId) return null;
  const Slide = SLIDES[contentId];
  // Topics without a drawn slide yet fall back to a title-only placeholder.
  if (!Slide && !i18n.exists(`educational.${contentId}.title`)) return null;

  return (
    <Overlay onClick={onClose}>
      <Panel onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>✕</CloseButton>
        {Slide ? <Slide /> : <PlaceholderSlide contentId={contentId} />}
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
  background: rgba(0, 0, 0, 0.3);
`;

const Panel = styled.div`
  position: relative;
  background: white;
  border-radius: 12px;
  padding: 8px;
  box-sizing: border-box;
  width: ${SLIDE_WIDTH};
  height: ${SLIDE_HEIGHT};
  max-height: 80vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);

  /* Center the slide vertically; auto margins (unlike justify-content) never clip overflow */
  & > :last-child {
    margin-block: auto;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  left: 12px;
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
