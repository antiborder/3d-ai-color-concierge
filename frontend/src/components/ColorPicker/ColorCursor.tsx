import * as THREE from 'three';
import { Line, Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef, useEffect } from 'react';
import styled from 'styled-components';
import type { StructureProps, PositionFunction } from '../../types/structure';
import { focusContrastColor } from '../../utils/colorConverter';

interface ColorCursorProps extends StructureProps {
  getRgbPosition: PositionFunction;
  getHslPosition: PositionFunction;
  getHsbPosition: PositionFunction;
  getMunsellPosition: PositionFunction;
  getLabPosition: PositionFunction;
  getXyzPosition: PositionFunction;
  getXyzChromaticityPosition: PositionFunction;
  getXyChromaticityPosition: PositionFunction;
}

const BLINK_HZ = 0.5;

const ColorCursor = (props: ColorCursorProps) => {
  const meridianRef = useRef<THREE.Group>(null);
  const frameGroupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  const focusHex = `#${Math.round(props.focusR).toString(16).padStart(2, '0')}${Math.round(props.focusG).toString(16).padStart(2, '0')}${Math.round(props.focusB).toString(16).padStart(2, '0')}`;
  const contrastHex = focusContrastColor(props.focusL);

  const focusColorRef = useRef(focusHex);
  const contrastColorRef = useRef(contrastHex);
  useEffect(() => {
    focusColorRef.current = focusHex;
  }, [focusHex]);
  useEffect(() => {
    contrastColorRef.current = contrastHex;
  }, [contrastHex]);

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
        : props.shape === 'Lab'
          ? props.getLabPosition(props.focusR, props.focusG, props.focusB)
          : props.shape === 'LCH'
            ? props.getMunsellPosition(props.focusR, props.focusG, props.focusB)
            : props.shape === 'XYZ'
              ? props.getXyzPosition(props.focusR, props.focusG, props.focusB)
              : props.shape === 'xyz'
                ? props.getXyzChromaticityPosition(props.focusR, props.focusG, props.focusB)
                : props.shape === 'xy'
                  ? props.getXyChromaticityPosition(props.focusR, props.focusG, props.focusB)
                  : props.getHsbPosition(props.focusR, props.focusG, props.focusB);

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
      <Html zIndexRange={[100, 5]}>
        <CurrentBubble>
          <BubbleTitle>Current Color</BubbleTitle>
          <ColorRect style={{ backgroundColor: focusHex }} />
          <ColorCode>{focusHex}</ColorCode>
        </CurrentBubble>
      </Html>
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

const CurrentBubble = styled.div`
  position: absolute;
  top: 4px;
  left: 4px;
  width: 120px;
  background: #fff;
  border-radius: 0px 24px 24px 24px;
  font-size: 12px;
  padding: 6px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
`;

const BubbleTitle = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: #555;
  margin-bottom: 6px;
`;

const ColorRect = styled.div`
  height: 20px;
  width: 90px;
  margin: 0 auto 4px;
  border: 1px solid #bbb;
  border-radius: 3px;
`;

const ColorCode = styled.div`
  font-family: monospace;
  font-size: 12px;
  color: #333;
`;

export default ColorCursor;
