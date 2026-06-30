import { Html } from '@react-three/drei';
import styled from 'styled-components';
import type { AiColorLabel } from '../../types/structure';
import type { PositionFunction } from '../../types/structure';
import type { ColorSpace } from '../../types/color';

interface Props {
  labels: AiColorLabel[];
  shape: ColorSpace;
  focusL: number;
  getRgbPosition: PositionFunction;
  getHslPosition: PositionFunction;
  getHsbPosition: PositionFunction;
  getMunsellPosition: PositionFunction;
  getLabPosition: PositionFunction;
  getXyzPosition: PositionFunction;
  getXyzChromaticityPosition: PositionFunction;
  getXyChromaticityPosition: PositionFunction;
  onColorSelect: (r: number, g: number, b: number) => void;
}

function resolvePosition(
  r: number, g: number, b: number,
  shape: ColorSpace,
  getRgbPosition: PositionFunction,
  getHslPosition: PositionFunction,
  getHsbPosition: PositionFunction,
  getMunsellPosition: PositionFunction,
  getLabPosition: PositionFunction,
  getXyzPosition: PositionFunction,
  getXyzChromaticityPosition: PositionFunction,
  getXyChromaticityPosition: PositionFunction,
): [number, number, number] {
  if (shape === 'HSL') return getHslPosition(r, g, b);
  if (shape === 'HSB') return getHsbPosition(r, g, b);
  if (shape === 'LCH') return getMunsellPosition(r, g, b);
  if (shape === 'Lab') return getLabPosition(r, g, b);
  if (shape === 'XYZ') return getXyzPosition(r, g, b);
  if (shape === 'xyz') return getXyzChromaticityPosition(r, g, b);
  if (shape === 'xy') return getXyChromaticityPosition(r, g, b);
  return getRgbPosition(r, g, b);
}

function toHex(r: number, g: number, b: number) {
  return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
}

const RADIUS = 0.18;

const AiColorLabels = ({
  labels,
  shape,
  focusL,
  getRgbPosition,
  getHslPosition,
  getHsbPosition,
  getMunsellPosition,
  getLabPosition,
  getXyzPosition,
  getXyzChromaticityPosition,
  getXyChromaticityPosition,
  onColorSelect,
}: Props) => {
  const borderColor = focusL >= 50 ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.35)';

  return (
    <>
      {labels.map(({ r, g, b, label }, idx) => {
        const position = resolvePosition(
          r, g, b, shape,
          getRgbPosition, getHslPosition, getHsbPosition,
          getMunsellPosition, getLabPosition, getXyzPosition,
          getXyzChromaticityPosition, getXyChromaticityPosition,
        );
        const hex = toHex(r, g, b);

        return (
          <group key={idx} position={position} rotation={[0, 0, -Math.PI]}>
            {/* Solid sphere */}
            <mesh onClick={() => onColorSelect(r, g, b)}>
              <sphereGeometry args={[RADIUS, 16, 16]} />
              <meshBasicMaterial color={hex} />
            </mesh>
            {/* Label bubble */}
            <Html zIndexRange={[100, 5]}>
              <LabelBubble
                style={{ borderColor }}
                onClick={() => onColorSelect(r, g, b)}
              >
                <LabelText>{label}</LabelText>
                <Swatch style={{ backgroundColor: hex }} />
                <HexCode>{hex.toUpperCase()}</HexCode>
              </LabelBubble>
            </Html>
          </group>
        );
      })}
    </>
  );
};

const LabelBubble = styled.div`
  position: absolute;
  top: 4px;
  left: 4px;
  width: 110px;
  background: #fff;
  border: 1px solid;
  border-radius: 4px 16px 16px 16px;
  padding: 5px 7px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.18);
  &:hover { box-shadow: 0 3px 12px rgba(0,0,0,0.28); }
`;

const LabelText = styled.div`
  font-size: 12px;
  font-weight: 700;
  color: #222;
  margin-bottom: 4px;
  line-height: 1.2;
  word-break: break-word;
`;

const Swatch = styled.div`
  height: 16px;
  border-radius: 3px;
  margin-bottom: 3px;
  border: 1px solid rgba(0,0,0,0.12);
`;

const HexCode = styled.div`
  font-family: monospace;
  font-size: 10px;
  color: #666;
`;

export default AiColorLabels;
