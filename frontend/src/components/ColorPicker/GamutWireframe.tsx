import { useMemo } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import {
  getRgbPosition,
  getLabPosition,
  getXyzPosition,
  getMunsellPosition,
} from '../../utils/colorSpacePositions';
import type { PositionFunction } from '../../types/structure';

const SAMPLES = 40;

// 12 edges of the unit RGB cube [0,1]³, each defined by its two corner RGB values
const CUBE_EDGES: [[number, number, number], [number, number, number]][] = [
  [[0, 0, 0], [1, 0, 0]], // Black → Red
  [[0, 0, 0], [0, 1, 0]], // Black → Green
  [[0, 0, 0], [0, 0, 1]], // Black → Blue
  [[1, 0, 0], [1, 1, 0]], // Red → Yellow
  [[1, 0, 0], [1, 0, 1]], // Red → Magenta
  [[0, 1, 0], [1, 1, 0]], // Green → Yellow
  [[0, 1, 0], [0, 1, 1]], // Green → Cyan
  [[0, 0, 1], [1, 0, 1]], // Blue → Magenta
  [[0, 0, 1], [0, 1, 1]], // Blue → Cyan
  [[1, 1, 0], [1, 1, 1]], // Yellow → White
  [[1, 0, 1], [1, 1, 1]], // Magenta → White
  [[0, 1, 1], [1, 1, 1]], // Cyan → White
];

function buildEdges(fn: PositionFunction) {
  return CUBE_EDGES.map(([a, b]) => {
    const points: [number, number, number][] = [];
    const colors: THREE.Color[] = [];
    for (let i = 0; i < SAMPLES; i++) {
      const t = i / (SAMPLES - 1);
      const r = a[0] + (b[0] - a[0]) * t;
      const g = a[1] + (b[1] - a[1]) * t;
      const bv = a[2] + (b[2] - a[2]) * t;
      points.push(fn(r * 255, g * 255, bv * 255));
      colors.push(new THREE.Color(r, g, bv));
    }
    return { points, colors };
  });
}

interface GamutWireframeProps {
  shape: string;
  visible: boolean;
}

const GamutWireframe = ({ shape, visible }: GamutWireframeProps) => {
  const fn: PositionFunction | null =
    shape === 'RGB' || shape === 'CMYK' ? getRgbPosition
    : shape === 'Lab' ? getLabPosition
    : shape === 'XYZ' ? getXyzPosition
    : shape === 'LCH' ? getMunsellPosition
    : null;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const edges = useMemo(() => (fn ? buildEdges(fn) : null), [shape]);

  if (!visible || !edges) return null;

  const lineWidth = shape === 'RGB' || shape === 'CMYK' ? 1.5 : 1.2;

  return (
    <>
      {edges.map(({ points, colors }, i) => (
        <Line key={i} points={points} vertexColors={colors} lineWidth={lineWidth} />
      ))}
    </>
  );
};

export default GamutWireframe;
