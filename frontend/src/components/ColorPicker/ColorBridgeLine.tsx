import { Line } from '@react-three/drei';
import type { PositionFunction } from '../../types/structure';
import type { ColorSpace } from '../../types/color';

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface ColorBridgeLineProps {
  colorA: RGB;
  colorB: RGB;
  shape: ColorSpace;
  getRgbPosition: PositionFunction;
  getHslPosition: PositionFunction;
  getHsbPosition: PositionFunction;
  getMunsellPosition: PositionFunction;
  getLabPosition: PositionFunction;
  getXyzPosition: PositionFunction;
  getXyzChromaticityPosition: PositionFunction;
  getXyChromaticityPosition: PositionFunction;
}

function resolvePosition(
  color: RGB,
  shape: ColorSpace,
  getRgbPosition: PositionFunction,
  getHslPosition: PositionFunction,
  getHsbPosition: PositionFunction,
  getMunsellPosition: PositionFunction,
  getLabPosition: PositionFunction,
  getXyzPosition: PositionFunction,
  getXyzChromaticityPosition: PositionFunction,
  getXyChromaticityPosition: PositionFunction
): [number, number, number] {
  const { r, g, b } = color;
  if (shape === 'HSL') return getHslPosition(r, g, b);
  if (shape === 'HSB') return getHsbPosition(r, g, b);
  if (shape === 'LCH') return getMunsellPosition(r, g, b);
  if (shape === 'Lab') return getLabPosition(r, g, b);
  if (shape === 'XYZ') return getXyzPosition(r, g, b);
  if (shape === 'xyz') return getXyzChromaticityPosition(r, g, b);
  if (shape === 'xy') return getXyChromaticityPosition(r, g, b);
  return getRgbPosition(r, g, b);
}

function toHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
}

const ColorBridgeLine = ({
  colorA,
  colorB,
  shape,
  getRgbPosition,
  getHslPosition,
  getHsbPosition,
  getMunsellPosition,
  getLabPosition,
  getXyzPosition,
  getXyzChromaticityPosition,
  getXyChromaticityPosition,
}: ColorBridgeLineProps) => {
  const posA = resolvePosition(
    colorA,
    shape,
    getRgbPosition,
    getHslPosition,
    getHsbPosition,
    getMunsellPosition,
    getLabPosition,
    getXyzPosition,
    getXyzChromaticityPosition,
    getXyChromaticityPosition
  );
  const posB = resolvePosition(
    colorB,
    shape,
    getRgbPosition,
    getHslPosition,
    getHsbPosition,
    getMunsellPosition,
    getLabPosition,
    getXyzPosition,
    getXyzChromaticityPosition,
    getXyChromaticityPosition
  );

  return (
    <>
      <Line points={[posA, posB]} color="white" lineWidth={2} />
      <mesh position={posA}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshBasicMaterial color={toHex(colorA.r, colorA.g, colorA.b)} />
      </mesh>
      <mesh position={posB}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshBasicMaterial color={toHex(colorB.r, colorB.g, colorB.b)} />
      </mesh>
    </>
  );
};

export default ColorBridgeLine;
