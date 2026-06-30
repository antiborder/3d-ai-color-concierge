import { useMemo } from 'react';
import styled from 'styled-components';
import { rgbToLab } from '../../../utils/gamutUtils';

interface Props {
  colorA: { r: number; g: number; b: number };
  colorB: { r: number; g: number; b: number };
}

interface Judgment {
  en: string;
  ja: string;
  color: string;
}

function getJudgment(dE: number): Judgment {
  if (dE < 1.0)  return { en: 'Imperceptible to human eyes',          ja: '人間の目では判別不可',     color: '#22a06b' };
  if (dE < 3.0)  return { en: 'Subtle — noticeable on close inspection', ja: '注意深く見ると感知できる', color: '#0052cc' };
  if (dE < 6.0)  return { en: 'Perceptible at a glance',              ja: '一見して知覚できる差',     color: '#ff8b00' };
  if (dE < 12.0) return { en: 'Clearly different colors',             ja: '明確に異なる色',           color: '#de350b' };
  return           { en: 'Very large difference',                      ja: '非常に大きな色差',         color: '#403294' };
}

function fmt(n: number): string {
  return (n >= 0 ? '+' : '') + n.toFixed(1);
}

export const ColorDifferencePanel = ({ colorA, colorB }: Props) => {
  const { dE, dL, da, db } = useMemo(() => {
    const [L1, a1, b1] = rgbToLab(Math.round(colorA.r), Math.round(colorA.g), Math.round(colorA.b));
    const [L2, a2, b2] = rgbToLab(Math.round(colorB.r), Math.round(colorB.g), Math.round(colorB.b));
    const dL = L2 - L1;
    const da = a2 - a1;
    const db = b2 - b1;
    return { dE: Math.sqrt(dL * dL + da * da + db * db), dL, da, db };
  }, [colorA.r, colorA.g, colorA.b, colorB.r, colorB.g, colorB.b]);

  const judgment = getJudgment(dE);

  return (
    <div className="controlPanel">
      <Header>
        <span style={{ fontWeight: 600, fontSize: '16px' }}>Color Difference</span>
        <Swatches>
          <Swatch style={{ background: `rgb(${colorA.r},${colorA.g},${colorA.b})` }} />
          <Arrow>→</Arrow>
          <Swatch style={{ background: `rgb(${colorB.r},${colorB.g},${colorB.b})` }} />
        </Swatches>
      </Header>
      <DeltaE>ΔE = {dE.toFixed(2)}</DeltaE>
      <Sub>ΔE*ab (CIE76)</Sub>
      <Breakdown>
        ΔL* {fmt(dL)} &nbsp;·&nbsp; Δa* {fmt(da)} &nbsp;·&nbsp; Δb* {fmt(db)}
      </Breakdown>
      <JudgmentRow style={{ color: judgment.color }}>
        {judgment.en}<br />{judgment.ja}
      </JudgmentRow>
    </div>
  );
};

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 24px;
  margin-bottom: 8px;
`;

const Swatches = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const Swatch = styled.div`
  width: 28px;
  height: 16px;
  border-radius: 3px;
  border: 1px solid rgba(0, 0, 0, 0.15);
`;

const Arrow = styled.span`
  font-size: 11px;
  color: #aaa;
`;

const DeltaE = styled.div`
  font-size: 24px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #222;
  line-height: 1.1;
  margin-bottom: 2px;
`;

const Sub = styled.div`
  font-size: 10px;
  color: #aaa;
  margin-bottom: 6px;
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
