import * as THREE from 'three';
import { useRef, useEffect } from 'react';
import { Line, Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { focusContrastColor } from '../../utils/colorConverter';
import { structureSize } from '../../utils/colorSpacePositions';
import type { PositionFunction } from '../../types/structure';

const ARROW_LEN = structureSize * 0.1;
const CONE_H = 0.16;
const CONE_R = 0.045;
const BLINK_HZ = 0.5;

export interface AxisDef {
  dir: [number, number, number];
  label: string;
}

interface Props {
  focusR: number;
  focusG: number;
  focusB: number;
  focusL: number;
  getPosition: PositionFunction;
  axes: AxisDef[];
}

const FocusAxisArrows = ({ focusR, focusG, focusB, focusL, getPosition, axes }: Props) => {
  const timeRef = useRef(0);
  const groupRef = useRef<THREE.Group>(null);
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([]);

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
    labelRefs.current.forEach((el) => { if (el) el.style.color = hexStr; });
  });

  const pos = getPosition(focusR, focusG, focusB);

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
      {axes.map(({ dir, label }, idx) => {
        const shaftEnd: [number, number, number] = [
          pos[0] + dir[0] * (ARROW_LEN - CONE_H),
          pos[1] + dir[1] * (ARROW_LEN - CONE_H),
          pos[2] + dir[2] * (ARROW_LEN - CONE_H),
        ];
        const coneCenter: [number, number, number] = [
          pos[0] + dir[0] * (ARROW_LEN - CONE_H / 2),
          pos[1] + dir[1] * (ARROW_LEN - CONE_H / 2),
          pos[2] + dir[2] * (ARROW_LEN - CONE_H / 2),
        ];
        const labelPos: [number, number, number] = [
          pos[0] + dir[0] * (ARROW_LEN + 0.32),
          pos[1] + dir[1] * (ARROW_LEN + 0.32),
          pos[2] + dir[2] * (ARROW_LEN + 0.32),
        ];
        const quat = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          new THREE.Vector3(...dir)
        );
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

export default FocusAxisArrows;
