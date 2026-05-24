import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef, useEffect } from 'react';
import type { StructureProps, PositionFunction } from '../../types/structure';

interface ColorCursorProps extends StructureProps {
  getRgbPosition: PositionFunction;
  getHslPosition: PositionFunction;
  getHsvPosition: PositionFunction;
  getMunsellPosition: PositionFunction;
}

const BLINK_HZ = 0.5;

const ColorCursor = (props: ColorCursorProps) => {
  const meridianRef = useRef<THREE.Group>(null);
  const frameGroupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  const focusHex = `#${Math.round(props.focusR).toString(16).padStart(2, '0')}${Math.round(props.focusG).toString(16).padStart(2, '0')}${Math.round(props.focusB).toString(16).padStart(2, '0')}`;
  const contrastHex = props.focusL >= 50 ? '#000000' : '#ffffff';

  const focusColorRef = useRef(focusHex);
  const contrastColorRef = useRef(contrastHex);
  useEffect(() => { focusColorRef.current = focusHex; }, [focusHex]);
  useEffect(() => { contrastColorRef.current = contrastHex; }, [contrastHex]);

  useFrame((_, delta) => {
    if (meridianRef.current) {
      meridianRef.current.rotation.y += 0.02;
    }

    if (frameGroupRef.current) {
      timeRef.current += delta;
      const factor = (1 - Math.cos(2 * Math.PI * BLINK_HZ * timeRef.current)) / 2;
      const blended = new THREE.Color(focusColorRef.current).lerp(
        new THREE.Color(contrastColorRef.current),
        factor
      );
      frameGroupRef.current.traverse((child) => {
        const mat = (child as THREE.Mesh).material as THREE.Material & { color?: THREE.Color };
        if (mat?.color instanceof THREE.Color) {
          mat.color.copy(blended);
        }
      });
    }
  });

  const position =
    props.shape === 'RGB' || props.shape === 'CMYK'
      ? props.getRgbPosition(props.focusR, props.focusG, props.focusB)
      : props.shape === 'HSL'
        ? props.getHslPosition(props.focusR, props.focusG, props.focusB)
        : props.shape === 'LCH'
          ? props.getMunsellPosition(props.focusR, props.focusG, props.focusB)
          : props.getHsvPosition(props.focusR, props.focusG, props.focusB);

  const radius = 0.124;
  const meridians = 12;
  const parallels = 8;

  const meridianLines: [number, number, number][][] = [];
  for (let i = 0; i < meridians; i++) {
    const theta = (i / meridians) * Math.PI * 2;
    const points: [number, number, number][] = [];
    for (let j = 0; j <= parallels; j++) {
      const phi = (j / parallels) * Math.PI;
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);
      points.push([x, y, z]);
    }
    meridianLines.push(points);
  }

  const parallelLines: [number, number, number][][] = [];
  for (let j = 1; j < parallels; j++) {
    const phi = (j / parallels) * Math.PI;
    const points: [number, number, number][] = [];
    for (let i = 0; i <= meridians; i++) {
      const theta = (i / meridians) * Math.PI * 2;
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);
      points.push([x, y, z]);
    }
    parallelLines.push(points);
  }

  return (
    <group position={position} rotation={[0, 0, -Math.PI]}>
      <group rotation={[Math.PI / 2, 0, 0]}>
        <group ref={frameGroupRef}>
          <group ref={meridianRef}>
            {meridianLines.map((points, index) =>
              index % 3 === 0 ? (
                <Line key={`meridian-${index}`} points={points} color="#333333" lineWidth={2} />
              ) : null
            )}
          </group>
          {parallelLines.map((points, index) =>
            index % 2 === 1 ? (
              <Line key={`parallel-${index}`} points={points} color="#CCCCCC" lineWidth={1} />
            ) : null
          )}
        </group>
      </group>
    </group>
  );
};

export default ColorCursor;
