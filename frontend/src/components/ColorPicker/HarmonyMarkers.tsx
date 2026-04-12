import * as THREE from 'three';
import { useRef } from 'react';
import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { PositionFunction } from '../../types/structure';
import type { HarmonyColor } from '../../utils/colorHarmony';

interface HarmonyMarkersProps {
  harmonyColors: HarmonyColor[];
  shape: string;
  getRgbPosition: PositionFunction;
  getHslPosition: PositionFunction;
  getHsvPosition: PositionFunction;
}

// Build wireframe sphere geometry (same approach as ColorCursor)
function buildSphereLines(radius: number) {
  const meridians = 12;
  const parallels = 8;

  const meridianLines: [number, number, number][][] = [];
  for (let i = 0; i < meridians; i++) {
    const theta = (i / meridians) * Math.PI * 2;
    const points: [number, number, number][] = [];
    for (let j = 0; j <= parallels; j++) {
      const phi = (j / parallels) * Math.PI;
      points.push([
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta),
      ]);
    }
    meridianLines.push(points);
  }

  const parallelLines: [number, number, number][][] = [];
  for (let j = 1; j < parallels; j++) {
    const phi = (j / parallels) * Math.PI;
    const points: [number, number, number][] = [];
    for (let i = 0; i <= meridians; i++) {
      const theta = (i / meridians) * Math.PI * 2;
      points.push([
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta),
      ]);
    }
    parallelLines.push(points);
  }

  return { meridianLines, parallelLines };
}

const RADIUS = 0.124;
const { meridianLines, parallelLines } = buildSphereLines(RADIUS);

interface SingleMarkerProps {
  position: [number, number, number];
  hex: string;
}

const SingleMarker = ({ position, hex }: SingleMarkerProps) => {
  const meridianRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (meridianRef.current) {
      meridianRef.current.rotation.y += 0.02;
    }
  });

  return (
    <group position={position} rotation={[0, 0, -Math.PI]}>
      <group rotation={[Math.PI / 2, 0, 0]}>
        <group ref={meridianRef}>
          {meridianLines.map((points, i) =>
            i % 3 === 0 ? (
              <Line key={`m-${i}`} points={points} color={hex} lineWidth={2} />
            ) : null
          )}
        </group>
        {parallelLines.map((points, i) =>
          i % 2 === 1 ? (
            <Line key={`p-${i}`} points={points} color={hex} lineWidth={1} />
          ) : null
        )}
      </group>
    </group>
  );
};

const HarmonyMarkers = ({
  harmonyColors,
  shape,
  getRgbPosition,
  getHslPosition,
  getHsvPosition,
}: HarmonyMarkersProps) => {
  return (
    <>
      {harmonyColors.map((color, idx) => {
        const position =
          shape === 'RGB' || shape === 'CMYK'
            ? getRgbPosition(color.r, color.g, color.b)
            : shape === 'HSL'
              ? getHslPosition(color.r, color.g, color.b)
              : getHsvPosition(color.r, color.g, color.b);

        const hex = `#${Math.round(color.r).toString(16).padStart(2, '0')}${Math.round(color.g).toString(16).padStart(2, '0')}${Math.round(color.b).toString(16).padStart(2, '0')}`;

        return <SingleMarker key={idx} position={position} hex={hex} />;
      })}
    </>
  );
};

export default HarmonyMarkers;
