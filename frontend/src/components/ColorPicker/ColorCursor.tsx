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
  getOklabPosition: PositionFunction;
  getOklchPosition: PositionFunction;
  getLmsPosition: PositionFunction;
  getXyzPosition: PositionFunction;
  getXyzChromaticityPosition: PositionFunction;
  getXyChromaticityPosition: PositionFunction;
}

const BLINK_HZ = 0.5;

const ColorCursor = (props: ColorCursorProps) => {
  const meridianRef = useRef<THREE.Group>(null);
  const frameGroupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  const bgMeridianRef = useRef<THREE.Group>(null);
  const bgFrameGroupRef = useRef<THREE.Group>(null);
  const bgTimeRef = useRef(0);

  const focusHex = `#${Math.round(props.focusR).toString(16).padStart(2, '0')}${Math.round(props.focusG).toString(16).padStart(2, '0')}${Math.round(props.focusB).toString(16).padStart(2, '0')}`;
  const contrastHex = focusContrastColor(props.focusL);

  // Background color
  const bgRaw = (props.sceneBackgroundColor ?? '#000000').replace('#', '');
  const bgR = parseInt(bgRaw.slice(0, 2), 16);
  const bgG = parseInt(bgRaw.slice(2, 4), 16);
  const bgB = parseInt(bgRaw.slice(4, 6), 16);
  const bgHex = `#${bgRaw}`;
  const bgBrightness = (0.299 * bgR + 0.587 * bgG + 0.114 * bgB) / 255 * 100;
  const bgContrastHex = focusContrastColor(bgBrightness);

  const focusColorRef = useRef(focusHex);
  const contrastColorRef = useRef(contrastHex);
  const bgColorRef = useRef(bgHex);
  const bgContrastColorRef = useRef(bgContrastHex);

  useEffect(() => { focusColorRef.current = focusHex; }, [focusHex]);
  useEffect(() => { contrastColorRef.current = contrastHex; }, [contrastHex]);
  useEffect(() => { bgColorRef.current = bgHex; }, [bgHex]);
  useEffect(() => { bgContrastColorRef.current = bgContrastHex; }, [bgContrastHex]);

  useFrame((_, delta) => {
    if (meridianRef.current) meridianRef.current.rotation.y += 0.02;
    if (bgMeridianRef.current) bgMeridianRef.current.rotation.y -= 0.015;

    if (frameGroupRef.current) {
      timeRef.current += delta;
      const factor = (1 - Math.cos(2 * Math.PI * BLINK_HZ * timeRef.current)) / 2;
      const blended = new THREE.Color(focusColorRef.current).lerp(
        new THREE.Color(contrastColorRef.current),
        factor
      );
      frameGroupRef.current.traverse((child) => {
        const mat = (child as THREE.Mesh).material as THREE.Material & { color?: THREE.Color };
        if (mat?.color instanceof THREE.Color) mat.color.copy(blended);
      });
    }

    if (bgFrameGroupRef.current) {
      bgTimeRef.current += delta;
      const factor = (1 - Math.cos(2 * Math.PI * BLINK_HZ * bgTimeRef.current)) / 2;
      const blended = new THREE.Color(bgColorRef.current).lerp(
        new THREE.Color(bgContrastColorRef.current),
        factor
      );
      bgFrameGroupRef.current.traverse((child) => {
        const mat = (child as THREE.Mesh).material as THREE.Material & { color?: THREE.Color };
        if (mat?.color instanceof THREE.Color) mat.color.copy(blended);
      });
    }
  });

  const getPosition = (r: number, g: number, b: number) =>
    props.shape === 'RGB' || props.shape === 'CMYK'
      ? props.getRgbPosition(r, g, b)
      : props.shape === 'HSL'
        ? props.getHslPosition(r, g, b)
        : props.shape === 'Lab'
          ? props.getLabPosition(r, g, b)
          : props.shape === 'LCH'
            ? props.getLabPosition(r, g, b)
            : props.shape === 'OKLAB'
              ? props.getOklabPosition(r, g, b)
              : props.shape === 'OKLCH'
                ? props.getOklchPosition(r, g, b)
                : props.shape === 'LMS'
                  ? props.getLmsPosition(r, g, b)
                  : props.shape === 'XYZ'
                    ? props.getXyzPosition(r, g, b)
                    : props.shape === 'xyz'
                      ? props.getXyzChromaticityPosition(r, g, b)
                      : props.shape === 'xy'
                        ? props.getXyChromaticityPosition(r, g, b)
                        : props.getHsbPosition(r, g, b);

  const position = getPosition(props.focusR, props.focusG, props.focusB);
  const bgPosition = getPosition(bgR, bgG, bgB);

  const radius = 0.124;
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

  return (
    <>
      {/* Background color cursor */}
      <group position={bgPosition} rotation={[0, 0, -Math.PI]}>
        <Html zIndexRange={[9999, 8999]}>
          <CurrentBubble>
            <BubbleTitle>Background Color</BubbleTitle>
            <ColorRect style={{ backgroundColor: bgHex }} />
            <ColorCode>{bgHex}</ColorCode>
          </CurrentBubble>
        </Html>
        <group rotation={[Math.PI / 2, 0, 0]}>
          <group ref={bgFrameGroupRef}>
            <group ref={bgMeridianRef}>
              {meridianLines.map((points, index) =>
                index % 3 === 0 ? (
                  <Line key={`bg-meridian-${index}`} points={points} color="#333333" lineWidth={2} />
                ) : null
              )}
            </group>
            {parallelLines.map((points, index) =>
              index % 2 === 1 ? (
                <Line key={`bg-parallel-${index}`} points={points} color="#cccccc" lineWidth={1} />
              ) : null
            )}
          </group>
        </group>
      </group>

      {/* Focused color cursor */}
      <group position={position} rotation={[0, 0, -Math.PI]}>
        <Html zIndexRange={[10000, 9000]}>
          <CurrentBubble>
            <BubbleTitle>Focused Color</BubbleTitle>
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
                <Line key={`parallel-${index}`} points={points} color="#cccccc" lineWidth={1} />
              ) : null
            )}
          </group>
        </group>
      </group>
    </>
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
