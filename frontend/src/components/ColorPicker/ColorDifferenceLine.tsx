import { Html, Line } from '@react-three/drei';
import type { ColorSpace } from '../../types/color';
import { rgbToOklab } from '../../utils/gamutUtils';
import { type PositionFunctions, positionForShape } from './positionForShape';

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface ColorDifferenceLineProps extends PositionFunctions {
  focused: RGB;
  background: RGB;
  shape: ColorSpace;
}

/** OkLab ΔE, the same value the color difference panel shows */
export function oklabDeltaE(a: RGB, b: RGB): number {
  const [L1, a1, b1] = rgbToOklab(Math.round(a.r), Math.round(a.g), Math.round(a.b));
  const [L2, a2, b2] = rgbToOklab(Math.round(b.r), Math.round(b.g), Math.round(b.b));
  return Math.hypot(L2 - L1, a2 - a1, b2 - b1);
}

/** While the color difference panel is shown: the focused ↔ background line with their ΔE */
const ColorDifferenceLine = ({ focused, background, shape, ...fns }: ColorDifferenceLineProps) => {
  const posA = positionForShape(focused, shape, fns);
  const posB = positionForShape(background, shape, fns);
  const mid: [number, number, number] = [
    (posA[0] + posB[0]) / 2,
    (posA[1] + posB[1]) / 2,
    (posA[2] + posB[2]) / 2,
  ];

  return (
    <>
      <Line points={[posA, posB]} color="white" lineWidth={2} dashed dashSize={0.3} gapSize={0.2} />
      <Html position={mid} zIndexRange={[100, 5]}>
        <div
          style={{
            color: 'white',
            fontWeight: 'bold',
            fontSize: '13px',
            textShadow: '0 0 2px #000, 0 0 2px #000',
            whiteSpace: 'nowrap',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        >
          ΔE = {oklabDeltaE(focused, background).toFixed(3)}
        </div>
      </Html>
    </>
  );
};

export default ColorDifferenceLine;
