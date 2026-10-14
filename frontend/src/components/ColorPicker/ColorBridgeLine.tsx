import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import type { ColorSpace } from '../../types/color';
import { interpolateRgb } from '../menus/controls/ColorBridge';
import { type PositionFunctions, positionForShape } from './positionForShape';

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface ColorBridgeLineProps extends PositionFunctions {
  colorA: RGB;
  colorB: RGB;
  shape: ColorSpace;
}

// Points sampled along the path; enough for the hue-based spaces' curves to look smooth
const STEPS = 32;

function toHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
}

/**
 * The 1D picker's path in 3D: the colors between the two endpoints, interpolated in the active
 * color space exactly as the picker's gradient is, so the path curves where the gradient does
 * (around the hue in HSB, HSL, LCH and OkLCH).
 */
const ColorBridgeLine = ({ colorA, colorB, shape, ...fns }: ColorBridgeLineProps) => {
  const points = useMemo(
    () =>
      Array.from({ length: STEPS + 1 }, (_, i) => {
        const [r, g, b] = interpolateRgb(colorA, colorB, shape, i / STEPS);
        return positionForShape({ r, g, b }, shape, fns);
      }),
    // the position functions are rebuilt by Structure on each render but only depend on shape
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [colorA.r, colorA.g, colorA.b, colorB.r, colorB.g, colorB.b, shape]
  );

  return (
    <>
      <Line points={points} color="white" lineWidth={2} />
      <mesh position={points[0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshBasicMaterial color={toHex(colorA.r, colorA.g, colorA.b)} />
      </mesh>
      <mesh position={points[STEPS]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshBasicMaterial color={toHex(colorB.r, colorB.g, colorB.b)} />
      </mesh>
    </>
  );
};

export default ColorBridgeLine;
