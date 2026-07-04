import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { rgbToLab } from '../../../utils/gamutUtils';
import HelpIcon from '../../common/HelpIcon';

interface Props {
  currentColor: { r: number; g: number; b: number };
  onHelpClick?: (topic: string) => void;
}

interface Judgment {
  en: string;
  ja: string;
  color: string;
}

function getJudgment(dE: number): Judgment {
  if (dE < 1.0) return { en: 'Imperceptible to human eyes', ja: '人間の目では判別不可', color: '#22a06b' };
  if (dE < 2.0)
    return {
      en: 'Perceptible through close observation',
      ja: '注意深く見ると感知できる',
      color: '#0052cc',
    };
  if (dE < 10.0) return { en: 'Perceptible at a glance', ja: '一見して知覚できる差', color: '#ff8b00' };
  if (dE < 50.0) return { en: 'Clearly different colors', ja: '明確に異なる色', color: '#de350b' };
  return { en: 'Very large difference', ja: '非常に大きな色差', color: '#403294' };
}

function fmt(n: number): string {
  return (n >= 0 ? '+' : '') + n.toFixed(1);
}

export const ColorDifferencePanel = ({ currentColor, onHelpClick }: Props) => {
  const { i18n } = useTranslation();
  const isEn = i18n.language === 'en';
  const [referenceColor, setReferenceColor] = useState(() => ({ ...currentColor }));

  const { dE, dL, da, db } = useMemo(() => {
    const [L1, a1, b1] = rgbToLab(
      Math.round(referenceColor.r),
      Math.round(referenceColor.g),
      Math.round(referenceColor.b)
    );
    const [L2, a2, b2] = rgbToLab(
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
        <SwatchLabel>Reference</SwatchLabel>
        <SwatchLabel>Current</SwatchLabel>
      </LabelsRow>
      <ConnectorRow>
        <RefSwatch
          style={{
            background: `rgb(${referenceColor.r},${referenceColor.g},${referenceColor.b})`,
          }}
          title="Click to set current color as reference"
          onClick={() => setReferenceColor({ ...currentColor })}
        />
        <ArrowConnect>
          <ArrowHead $dir="left" />
          <ArrowLineBody />
          <ArrowHead $dir="right" />
        </ArrowConnect>
        <Swatch
          style={{ background: `rgb(${currentColor.r},${currentColor.g},${currentColor.b})` }}
        />
      </ConnectorRow>
      <DeltaE>ΔE = {dE.toFixed(1)}</DeltaE>
      <Breakdown>
        <BreakdownRow>ΔL* = {fmt(dL)}</BreakdownRow>
        <BreakdownRow>Δa* = {fmt(da)}</BreakdownRow>
        <BreakdownRow>Δb* = {fmt(db)}</BreakdownRow>
      </Breakdown>
      <JudgmentRow>
        <span style={{ color: '#222' }}>{isEn ? 'Judgment: ' : '判定結果：'}</span>
        {dE < 0.001 ? (
          <span style={{ color: '#aaa' }}>{isEn ? 'Same color' : '同一の色'}</span>
        ) : (
          <span style={{ color: judgment.color }}>{isEn ? judgment.en : judgment.ja}</span>
        )}
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

const Swatch = styled.div`
  width: 48px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
`;

const RefSwatch = styled.div`
  width: 48px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
  cursor: pointer;

  &:hover {
    border-color: #4e8cee;
    box-shadow: 0 0 0 1px #4e8cee;
  }
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
  ${({ $dir }) => $dir === 'left' ? 'border-right: 10px solid #bbb;' : 'border-left: 10px solid #bbb;'}
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
  font-size: 15px;
  font-weight: 600;
  line-height: 1.5;
  text-align: center;
  padding-bottom: 4px;
`;

export default ColorDifferencePanel;
