import { useMemo } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { rgbToOklab } from '../../../utils/gamutUtils';
import HelpIcon from '../../common/HelpIcon';

interface Props {
  currentColor: { r: number; g: number; b: number };
  referenceColor: { r: number; g: number; b: number };
  colorTarget: 'focused' | 'background';
  onColorTargetChange: (target: 'focused' | 'background') => void;
  onUnlinkColors?: () => void;
  onHelpClick?: (topic: string) => void;
}

interface Judgment {
  en: string;
  ja: string;
  color: string;
}

// Thresholds scaled to OkLab Euclidean distance (L∈[0,1], a/b∈[±0.4]).
// Approximately 1/100 of CIE Lab 1976 scale: JND ≈ 0.01.
function getJudgment(dE: number): Judgment {
  if (dE < 0.01) return { en: 'Imperceptible to human eyes', ja: '人間の目では判別不可', color: '#22a06b' };
  if (dE < 0.02) return { en: 'Perceptible by close observation', ja: '近くで見ると分かる', color: '#0052cc' };
  if (dE < 0.10) return { en: 'Perceptible at a glance', ja: '一見して知覚できる差', color: '#ff8b00' };
  if (dE < 0.50) return { en: 'Clearly different colors', ja: '明確に異なる色', color: '#de350b' };
  return { en: 'Very large difference', ja: '非常に大きな色差', color: '#403294' };
}

function fmt(n: number): string {
  return (n >= 0 ? '+' : '') + n.toFixed(3);
}

export const ColorDifferencePanel = ({ currentColor, referenceColor, colorTarget, onColorTargetChange, onUnlinkColors, onHelpClick }: Props) => {
  const { i18n } = useTranslation();
  const isEn = i18n.language === 'en';

  const { dE, dL, da, db } = useMemo(() => {
    const [L1, a1, b1] = rgbToOklab(
      Math.round(referenceColor.r),
      Math.round(referenceColor.g),
      Math.round(referenceColor.b)
    );
    const [L2, a2, b2] = rgbToOklab(
      Math.round(currentColor.r),
      Math.round(currentColor.g),
      Math.round(currentColor.b)
    );
    const dL = L2 - L1;
    const da = a2 - a1;
    const db = b2 - b1;
    return { dE: Math.sqrt(dL * dL + da * da + db * db), dL, da, db };
  }, [
    referenceColor.r,
    referenceColor.g,
    referenceColor.b,
    currentColor.r,
    currentColor.g,
    currentColor.b,
  ]);

  const judgment = getJudgment(dE);

  return (
    <div className="controlPanel">
      <TitleRow>
        <span style={{ fontWeight: 600, fontSize: '16px' }}>
          {isEn ? 'Color Difference' : '色差'}
        </span>
        {onHelpClick && <HelpIcon topic="color-difference" onHelpClick={onHelpClick} size={20} />}
      </TitleRow>
      <LabelsRow>
        <SwatchLabel>Background</SwatchLabel>
        <SwatchLabel>Focused Color</SwatchLabel>
      </LabelsRow>
      <ConnectorRow>
        <ColorSwatch
          $shape="square"
          $active={colorTarget === 'background'}
          style={{ background: `rgb(${referenceColor.r},${referenceColor.g},${referenceColor.b})` }}
          onClick={() => {
            onUnlinkColors?.();
            onColorTargetChange('background');
          }}
        />
        <ArrowConnect>
          <ArrowHead $dir="left" />
          <ArrowLineBody />
          <ArrowHead $dir="right" />
        </ArrowConnect>
        <ColorSwatch
          $shape="circle"
          $active={colorTarget === 'focused'}
          style={{ background: `rgb(${currentColor.r},${currentColor.g},${currentColor.b})` }}
          onClick={() => onColorTargetChange('focused')}
        />
      </ConnectorRow>
      <DeltaE>ΔE = {dE.toFixed(3)}</DeltaE>
      <Breakdown>
        <BreakdownRow>ΔL = {fmt(dL)}</BreakdownRow>
        <BreakdownRow>Δa = {fmt(da)}</BreakdownRow>
        <BreakdownRow>Δb = {fmt(db)}</BreakdownRow>
      </Breakdown>
      <JudgmentRow>
        <span style={{ color: '#222', fontWeight: 'normal' }}>{isEn ? 'Judgment: ' : '判定結果：'}</span>
        <JudgmentValue>
          {dE < 0.001 ? (
            <span style={{ color: '#aaa' }}>{isEn ? 'Same color' : '同一の色'}</span>
          ) : (
            <span style={{ color: judgment.color }}>{isEn ? judgment.en : judgment.ja}</span>
          )}
        </JudgmentValue>
      </JudgmentRow>
    </div>
  );
};

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
`;

const LabelsRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
`;

const SwatchLabel = styled.div`
  font-size: 10px;
`;

const ConnectorRow = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
`;

const ColorSwatch = styled.div<{ $shape: 'circle' | 'square'; $active: boolean }>`
  width: 24px;
  height: 24px;
  border: 1px solid #aaaaaa;
  flex-shrink: 0;
  cursor: pointer;
  border-radius: ${({ $shape }) => ($shape === 'circle' ? '50%' : '0')};
  box-shadow: ${({ $active }) => ($active ? '0 0 0 1px white, 0 0 0 4px #4e8cee' : 'none')};
`;

const ArrowConnect = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  padding: 0 4px;
`;

const ArrowHead = styled.div<{ $dir: 'left' | 'right' }>`
  width: 0;
  height: 0;
  flex-shrink: 0;
  border-top: 7px solid transparent;
  border-bottom: 7px solid transparent;
  ${({ $dir }) =>
    $dir === 'left' ? 'border-right: 10px solid #bbb;' : 'border-left: 10px solid #bbb;'}
`;

const ArrowLineBody = styled.div`
  flex: 1;
  height: 3px;
  background: #bbb;
`;

const DeltaE = styled.div`
  font-size: 22px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #222;
  line-height: 1.1;
  text-align: center;
  margin-bottom: 6px;
`;

const Breakdown = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
  margin-bottom: 6px;
`;

const BreakdownRow = styled.div`
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: #555;
`;

const JudgmentRow = styled.div`
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
  margin-top: 8px;
  padding-bottom: 4px;
  display: flex;
  flex-direction: column;
  gap: 1px;
`;

const JudgmentValue = styled.div`
  text-align: right;
  margin-top: 0;
  line-height: 1;
`;

export default ColorDifferencePanel;
