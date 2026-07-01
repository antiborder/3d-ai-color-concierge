import { useMemo, useState } from 'react';
import styled from 'styled-components';
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
  if (dE < 3.0)
    return {
      en: 'Subtle — noticeable on close inspection',
      ja: '注意深く見ると感知できる',
      color: '#0052cc',
    };
  if (dE < 6.0) return { en: 'Perceptible at a glance', ja: '一見して知覚できる差', color: '#ff8b00' };
  if (dE < 12.0) return { en: 'Clearly different colors', ja: '明確に異なる色', color: '#de350b' };
  return { en: 'Very large difference', ja: '非常に大きな色差', color: '#403294' };
}

function fmt(n: number): string {
  return (n >= 0 ? '+' : '') + n.toFixed(1);
}

export const ColorDifferencePanel = ({ currentColor, onHelpClick }: Props) => {
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
        <span style={{ fontWeight: 600, fontSize: '16px' }}>Color Difference</span>
        {onHelpClick && (
          <HelpIcon topic="color-difference" onHelpClick={onHelpClick} size={20} />
        )}
      </TitleRow>
      <SwatchRow>
        <SwatchBlock>
          <RefSwatch
            style={{
              background: `rgb(${referenceColor.r},${referenceColor.g},${referenceColor.b})`,
            }}
            title="Click to set current color as reference"
            onClick={() => setReferenceColor({ ...currentColor })}
          />
          <SwatchLabel>Reference</SwatchLabel>
        </SwatchBlock>
        <ArrowCol>
          <Arrow>↔</Arrow>
          <DeltaE>ΔE = {dE.toFixed(2)}</DeltaE>
        </ArrowCol>
        <SwatchBlock>
          <Swatch
            style={{ background: `rgb(${currentColor.r},${currentColor.g},${currentColor.b})` }}
          />
          <SwatchLabel>Current</SwatchLabel>
        </SwatchBlock>
      </SwatchRow>
      <Breakdown>
        ΔL*： {fmt(dL)} &nbsp;·&nbsp; Δa*： {fmt(da)} &nbsp;·&nbsp; Δb*： {fmt(db)}
      </Breakdown>
      <JudgmentRow style={{ color: judgment.color }}>
        {judgment.en}
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

const SwatchRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const SwatchBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
`;

const SwatchLabel = styled.div`
  font-size: 10px;
`;

const Swatch = styled.div`
  width: 48px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.15);
`;

const RefSwatch = styled.div`
  width: 48px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  cursor: pointer;

  &:hover {
    border-color: #4e8cee;
    box-shadow: 0 0 0 1px #4e8cee;
  }
`;

const ArrowCol = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
`;

const Arrow = styled.span`
  font-size: 18px;
  color: #aaa;
`;

const DeltaE = styled.div`
  font-size: 20px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #222;
  line-height: 1.1;
  white-space: nowrap;
`;

const Breakdown = styled.div`
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: #555;
  margin-bottom: 6px;
`;

const JudgmentRow = styled.div`
  font-size: 12px;
  font-weight: 600;
  line-height: 1.5;
  padding-bottom: 4px;
`;

export default ColorDifferencePanel;
