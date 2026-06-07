import { Line } from '@react-three/drei';
import type { PositionFunction } from '../../types/structure';
import type { ColorSpace } from '../../types/color';

interface RGB { r: number; g: number; b: number }

interface ColorBridgeLineProps {
  colorA: RGB;
  colorB: RGB;
  shape: ColorSpace;
  getRgbPosition: PositionFunction;
  getHslPosition: PositionFunction;
  getHsvPosition: PositionFunction;
  getMunsellPosition: PositionFunction;
  getLabPosition: PositionFunction;
}

function resolvePosition(
  color: RGB,
  shape: ColorSpace,
  getRgbPosition: PositionFunction,
  getHslPosition: PositionFunction,
  getHsvPosition: PositionFunction,
  getMunsellPosition: PositionFunction,
  getLabPosition: PositionFunction
): [number, number, number] {
  const { r, g, b } = color;
  if (shape === 'HSL') return getHslPosition(r, g, b);
  if (shape === 'HSV') return getHsvPosition(r, g, b);
  if (shape === 'LCH') return getMunsellPosition(r, g, b);
  if (shape === 'Lab') return getLabPosition(r, g, b);
  return getRgbPosition(r, g, b);
}

function toHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
}

const ColorBridgeLine = ({
  colorA, colorB, shape,
  getRgbPosition, getHslPosition, getHsvPosition, getMunsellPosition, getLabPosition,
}: ColorBridgeLineProps) => {
  const posA = resolvePosition(colorA, shape, getRgbPosition, getHslPosition, getHsvPosition, getMunsellPosition, getLabPosition);
  const posB = resolvePosition(colorB, shape, getRgbPosition, getHslPosition, getHsvPosition, getMunsellPosition, getLabPosition);

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
