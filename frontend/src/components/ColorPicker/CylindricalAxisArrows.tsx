import * as THREE from 'three';
import { useRef, useEffect } from 'react';
import { Line, Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { focusContrastColor } from '../../utils/colorConverter';
import { structureSize } from '../../utils/colorSpacePositions';
import type { PositionFunction } from '../../types/structure';

const ARROW_LEN = structureSize * 0.1; // 0.9
const CONE_H = 0.16;
const CONE_R = 0.045;
const BLINK_HZ = 0.5;

interface Props {
  focusR: number;
  focusG: number;
  focusB: number;
  /** HSL/HSV hue in degrees — used as fallback direction when S/C = 0 */
  focusH: number;
  focusL: number;
  getPosition: PositionFunction;
  /** Axis labels, e.g. { h:'H', s:'S', l:'B' } for HSB */
  labels: { h: string; s: string; l: string };
}

// Build arrowhead quaternion: rotate cone's default y-up to target direction.
function dirQuat(dir: [number, number, number]): THREE.Quaternion {
  return new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(...dir)
  );
}

function tip(
  pos: [number, number, number],
  dir: [number, number, number],
  dist: number
): [number, number, number] {
  return [pos[0] + dir[0] * dist, pos[1] + dir[1] * dist, pos[2] + dir[2] * dist];
}

const CylindricalAxisArrows = ({
  focusR,
  focusG,
  focusB,
  focusH,
  focusL,
  getPosition,
  labels,
}: Props) => {
  const timeRef = useRef(0);
  const groupRef = useRef<THREE.Group>(null);
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([null, null, null]);

  const focusHex = `#${Math.round(focusR).toString(16).padStart(2, '0')}${Math.round(focusG).toString(16).padStart(2, '0')}${Math.round(focusB).toString(16).padStart(2, '0')}`;
  const contrastHex = focusContrastColor(focusL);
  const focusColorRef = useRef(focusHex);
  const contrastColorRef = useRef(contrastHex);
  useEffect(() => { focusColorRef.current = focusHex; }, [focusHex]);
  useEffect(() => { contrastColorRef.current = contrastHex; }, [contrastHex]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    const factor = (1 - Math.cos(2 * Math.PI * BLINK_HZ * timeRef.current)) / 2;
    const blended = new THREE.Color(focusColorRef.current).lerp(
      new THREE.Color(contrastColorRef.current),
      factor
    );
    const hexStr = '#' + blended.getHexString();

    groupRef.current?.traverse((child) => {
      const mat = (child as THREE.Mesh).material as THREE.Material & { color?: THREE.Color };
      if (mat?.color instanceof THREE.Color) mat.color.copy(blended);
    });
    labelRefs.current.forEach((el) => {
      if (el) el.style.color = hexStr;
    });
  });

  const pos = getPosition(focusR, focusG, focusB);

  // Recover theta from the 3D position (works for all cylindrical spaces):
  //   x = r·sin(θ),  y = -r·cos(θ)
  const radialDist = Math.sqrt(pos[0] ** 2 + pos[1] ** 2);
  const fallbackTheta = (focusH / 360) * 2 * Math.PI - Math.PI / 12;
  const sinT = radialDist > 0.01 ? pos[0] / radialDist : Math.sin(fallbackTheta);
  const cosT = radialDist > 0.01 ? -pos[1] / radialDist : Math.cos(fallbackTheta);

  // Three orthogonal directions for a cylindrical color space
  const hDir: [number, number, number] = [cosT, sinT, 0];      // tangential (hue increases)
  const sDir: [number, number, number] = [sinT, -cosT, 0];     // radial (saturation increases)
  const lDir: [number, number, number] = [0, 0, 1];            // vertical (lightness increases)

  const arrows = [
    { dir: hDir, label: labels.h, idx: 0 },
    { dir: sDir, label: labels.s, idx: 1 },
    { dir: lDir, label: labels.l, idx: 2 },
  ];

  const labelStyle: React.CSSProperties = {
    color: focusHex,
    fontWeight: 'bold',
    fontSize: '13px',
    textShadow: '0 0 1px #000, 0 0 1px #000',
    userSelect: 'none',
    pointerEvents: 'none',
  };

  return (
    <group ref={groupRef}>
      {arrows.map(({ dir, label, idx }) => {
        const shaftEnd = tip(pos, dir, ARROW_LEN - CONE_H);
        const coneCenter = tip(pos, dir, ARROW_LEN - CONE_H / 2);
        const labelPos = tip(pos, dir, ARROW_LEN + 0.32);
        const quat = dirQuat(dir);
        return (
          <group key={label}>
            <Line points={[pos, shaftEnd]} color={focusHex} lineWidth={1.5} />
            <mesh position={coneCenter} quaternion={quat}>
              <coneGeometry args={[CONE_R, CONE_H, 8]} />
              <meshBasicMaterial color={focusHex} depthTest={false} />
            </mesh>
            <Html position={labelPos} zIndexRange={[100, 5]}>
              <span
                ref={(el) => { labelRefs.current[idx] = el; }}
                style={labelStyle}
              >
                {label}
              </span>
            </Html>
          </group>
        );
      })}
    </group>
  );
};

export default CylindricalAxisArrows;
