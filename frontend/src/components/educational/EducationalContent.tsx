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
import ChromaticityDiagram from './slides/ChromaticityDiagram';
import DisplayGamut from './slides/DisplayGamut';
import VisibleGamut from './slides/VisibleGamut';
import Hue from './slides/Hue';
import Saturation from './slides/Saturation';
import HueCircle from './slides/HueCircle';
import Tone from './slides/Tone';
import RgbCubeGrid from './slides/RgbCubeGrid';
import ColorSamples from './slides/ColorSamples';
import LchSpace from './slides/LchSpace';
import ComplementaryColors from './slides/ComplementaryColors';
import TriadicColors from './slides/TriadicColors';
import TetradicColors from './slides/TetradicColors';
import ColorHarmony from './slides/ColorHarmony';
import VariousColorSpaces from './slides/VariousColorSpaces';
import ColorSize from './slides/ColorSize';
import ColorWeight from './slides/ColorWeight';
import WarmCoolColors from './slides/WarmCoolColors';
import OklabSpace from './slides/OklabSpace';
import OklchSpace from './slides/OklchSpace';
import CssColor from './slides/CssColor';
import MaterialDesignColor from './slides/MaterialDesignColor';
import JapaneseTraditionalColors from './slides/JapaneseTraditionalColors';
import MonochromeColors from './slides/MonochromeColors';
import PastelColors from './slides/PastelColors';
import ColorUnity from './slides/ColorUnity';
import ColorDifference from './slides/ColorDifference';
import ColorIllusion from './slides/ColorIllusion';
import ColorDistortion from './slides/ColorDistortion';
import ColorProportion from './slides/ColorProportion';
import ContrastReadability from './slides/ContrastReadability';
import ColorContrast from './slides/ColorContrast';
import LabVsOklab from './slides/LabVsOklab';
import BlueYellowPaint from './slides/BlueYellowPaint';
import PlaceholderSlide from './slides/PlaceholderSlide';
import type { SlideTag } from '../../types/voice';

// Every slide uses the same box as the HSB slide (its natural size at 320px wide).
const SLIDE_WIDTH = 'min(320px, 90vw)';
const SLIDE_HEIGHT = '470px';
// Extra height for the row of recommendation tags under the slide
const TAGS_HEIGHT = '80px';

interface EducationalContentProps {
  contentId: string | null;
  onClose: () => void;
  // Recommendations shown as tags under the slide (at most 3)
  tags?: SlideTag[];
  onTagClick?: (tag: SlideTag) => void;
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
  chromaticity_diagram: ChromaticityDiagram,
  display_gamut: DisplayGamut,
  visible_gamut: VisibleGamut,
  hue: Hue,
  saturation: Saturation,
  hue_circle: HueCircle,
  tone: Tone,
  rgb_cube_grid: RgbCubeGrid,
  color_samples: ColorSamples,
  lch_space: LchSpace,
  complementary_colors: ComplementaryColors,
  triadic_colors: TriadicColors,
  tetradic_colors: TetradicColors,
  color_harmony: ColorHarmony,
  various_color_spaces: VariousColorSpaces,
  color_size: ColorSize,
  color_weight: ColorWeight,
  warm_cool_colors: WarmCoolColors,
  oklab_space: OklabSpace,
  oklch_space: OklchSpace,
  css_color: CssColor,
  material_design_color: MaterialDesignColor,
  japanese_traditional_colors: JapaneseTraditionalColors,
  monochrome_colors: MonochromeColors,
  pastel_colors: PastelColors,
  color_unity: ColorUnity,
  color_difference: ColorDifference,
  color_illusion: ColorIllusion,
  color_distortion: ColorDistortion,
  color_proportion: ColorProportion,
  contrast_readability: ContrastReadability,
  color_contrast: ColorContrast,
  lab_vs_oklab: LabVsOklab,
  blue_yellow_paint: BlueYellowPaint,
};

const EducationalContent = ({
  contentId,
  onClose,
  tags = [],
  onTagClick,
}: EducationalContentProps) => {
  const { t, i18n } = useTranslation();
  if (!contentId) return null;
  const Slide = SLIDES[contentId];
  // Topics without a drawn slide yet fall back to a title-only placeholder.
  if (!Slide && !i18n.exists(`educational.${contentId}.title`)) return null;

  return (
    <Overlay onClick={onClose}>
      <Panel onClick={(e) => e.stopPropagation()} $withTags={tags.length > 0}>
        <CloseButton onClick={onClose}>✕</CloseButton>
        <SlideArea>{Slide ? <Slide /> : <PlaceholderSlide contentId={contentId} />}</SlideArea>
        {tags.length > 0 && (
          <TagRow>
            <NextLabel>{t('slideTags.next')}</NextLabel>
            {tags.slice(0, 3).map((tag) => (
              <Tag key={tag.id} type="button" $kind={tag.kind} onClick={() => onTagClick?.(tag)}>
                {tag.label}
              </Tag>
            ))}
          </TagRow>
        )}
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

const Panel = styled.div<{ $withTags: boolean }>`
  position: relative;
  background: white;
  border-radius: 12px;
  padding: 8px;
  box-sizing: border-box;
  width: ${SLIDE_WIDTH};
  height: ${({ $withTags }) =>
    $withTags ? `calc(${SLIDE_HEIGHT} + ${TAGS_HEIGHT})` : SLIDE_HEIGHT};
  max-height: 80vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
`;

const SlideArea = styled.div`
  flex: 1 0 auto;
  display: flex;
  flex-direction: column;

  /* Center the slide vertically; auto margins (unlike justify-content) never clip overflow */
  & > :last-child {
    margin-block: auto;
  }
`;

const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 6px;
  padding: 6px 4px 4px;
  border-top: 1px solid #eceff5;
  font-family: sans-serif;
`;

const NextLabel = styled.span`
  font-size: 13px;
  color: #8a90a0;
  margin-right: 2px;
`;

// Topics (other slides) and actions (things to do on screen) are told apart by color
const Tag = styled.button<{ $kind: SlideTag['kind'] }>`
  font-size: 14px;
  line-height: 1.2;
  padding: 5px 9px;
  font-family: inherit;
  border-radius: 999px;
  cursor: pointer;
  white-space: nowrap;
  border: 1px solid ${({ $kind }) => ($kind === 'topic' ? '#c5d0ee' : '#bfe0c8')};
  background: ${({ $kind }) => ($kind === 'topic' ? '#f2f5fd' : '#eef8f1')};
  color: ${({ $kind }) => ($kind === 'topic' ? '#2f4a9a' : '#2a6b3c')};

  &:hover {
    background: ${({ $kind }) => ($kind === 'topic' ? '#e3e9fa' : '#dff1e5')};
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
  &:hover {
    color: #333;
  }
`;

export default EducationalContent;
