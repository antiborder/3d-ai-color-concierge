import * as THREE from 'three';
import { useRef, useEffect, useState } from 'react';
import { Line, Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import styled from 'styled-components';
import type { PositionFunction } from '../../types/structure';
import type { HarmonyColor } from '../../utils/colorHarmony';

interface HarmonyMarkersProps {
  harmonyColors: HarmonyColor[];
  shape: string;
  focusL: number;
  getRgbPosition: PositionFunction;
  getHslPosition: PositionFunction;
  getHsbPosition: PositionFunction;
  getMunsellPosition: PositionFunction;
  getLabPosition: PositionFunction;
  getXyzPosition: PositionFunction;
  getXyzChromaticityPosition: PositionFunction;
  getXyChromaticityPosition: PositionFunction;
  onColorSelect: (r: number, g: number, b: number) => void;
}

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
const ANIM_DURATION = 4.0;
const { meridianLines, parallelLines } = buildSphereLines(RADIUS);

interface SingleMarkerProps {
  position: [number, number, number];
  hex: string;
  r: number;
  g: number;
  b: number;
  flashColor: string;
  triggerKey: string;
  onColorSelect: (r: number, g: number, b: number) => void;
}

const SingleMarker = ({
  position,
  hex,
  r,
  g,
  b,
  flashColor,
  triggerKey,
  onColorSelect,
}: SingleMarkerProps) => {
  const meridianGroupRef = useRef<THREE.Group>(null);
  const sphereGroupRef = useRef<THREE.Group>(null);
  const animStartRef = useRef<number | null>(null);
  const hexRef = useRef(hex);
  const flashColorRef = useRef(flashColor);
  const [hovered, setHovered] = useState(false);
  const [bubbleHovered, setBubbleHovered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    hexRef.current = hex;
  }, [hex]);
  useEffect(() => {
    flashColorRef.current = flashColor;
  }, [flashColor]);

  const isMountedRef = useRef(false);
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }
    animStartRef.current = Date.now();
    setIsAnimating(true);
    if (animTimerRef.current) clearTimeout(animTimerRef.current);
    animTimerRef.current = setTimeout(() => setIsAnimating(false), ANIM_DURATION * 1000);
  }, [triggerKey]);

  useFrame(() => {
    if (meridianGroupRef.current) {
      meridianGroupRef.current.rotation.y += 0.02;
    }

    if (animStartRef.current !== null && sphereGroupRef.current) {
      const elapsed = (Date.now() - animStartRef.current) / 1000;
      let targetHex: string;

      if (elapsed >= ANIM_DURATION) {
        animStartRef.current = null;
        targetHex = hexRef.current;
      } else {
        const factor = (1 - Math.cos((8 * Math.PI * elapsed) / ANIM_DURATION)) / 2;
        const blended = new THREE.Color(hexRef.current).lerp(
          new THREE.Color(flashColorRef.current),
          factor
        );
        targetHex = '#' + blended.getHexString();
      }

      sphereGroupRef.current.traverse((child) => {
        const mat = (child as THREE.Mesh).material as THREE.Material & { color?: THREE.Color };
        if (mat?.color instanceof THREE.Color) {
          mat.color.set(targetHex);
        }
      });
    }
  });

  return (
    <group position={position} rotation={[0, 0, -Math.PI]}>
      {/* Invisible hit sphere for hover detection */}
      <mesh
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => onColorSelect(r, g, b)}
      >
        <sphereGeometry args={[RADIUS * 2, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Popup */}
      <Html zIndexRange={[100, 5]}>
        <div
          onPointerOver={() => setBubbleHovered(true)}
          onPointerOut={() => setBubbleHovered(false)}
        >
          <HarmonyBubble hex={hex} onColorSelect={() => onColorSelect(r, g, b)} />
        </div>
      </Html>

      {/* Wireframe sphere */}
      <group ref={sphereGroupRef} rotation={[Math.PI / 2, 0, 0]}>
        <group ref={meridianGroupRef}>
          {meridianLines.map((points, i) =>
            i % 3 === 0 ? <Line key={`m-${i}`} points={points} color={hex} lineWidth={2} /> : null
          )}
        </group>
        {parallelLines.map((points, i) =>
          i % 2 === 1 ? <Line key={`p-${i}`} points={points} color={hex} lineWidth={1} /> : null
        )}
      </group>
    </group>
  );
};

interface HarmonyBubbleProps {
  hex: string;
  onColorSelect: () => void;
}

const HarmonyBubble = ({ hex, onColorSelect }: HarmonyBubbleProps) => (
  <StyledBubble>
    <BubbleTitle>Harmonic Color</BubbleTitle>
    <ColorRect style={{ backgroundColor: hex }} onClick={onColorSelect} />
    <ColorCode>{hex}</ColorCode>
  </StyledBubble>
);

const HarmonyMarkers = ({
  harmonyColors,
  shape,
  focusL,
  getRgbPosition,
  getHslPosition,
  getHsbPosition,
  getMunsellPosition,
  getLabPosition,
  getXyzPosition,
  getXyzChromaticityPosition,
  getXyChromaticityPosition,
  onColorSelect,
}: HarmonyMarkersProps) => {
  const flashColor = focusL >= 50 ? '#000000' : '#ffffff';
  const colorKey = harmonyColors.map((c) => `${c.r},${c.g},${c.b}`).join('|');

  return (
    <>
      {harmonyColors.map((color, idx) => {
        const position =
          shape === 'RGB' || shape === 'CMYK'
            ? getRgbPosition(color.r, color.g, color.b)
            : shape === 'HSL'
              ? getHslPosition(color.r, color.g, color.b)
              : shape === 'Lab'
                ? getLabPosition(color.r, color.g, color.b)
                : shape === 'LCH'
                  ? getLabPosition(color.r, color.g, color.b)
                  : shape === 'XYZ'
                    ? getXyzPosition(color.r, color.g, color.b)
                    : shape === 'xyz'
                      ? getXyzChromaticityPosition(color.r, color.g, color.b)
                      : shape === 'xy'
                        ? getXyChromaticityPosition(color.r, color.g, color.b)
                        : getHsbPosition(color.r, color.g, color.b);

        const hex = `#${Math.round(color.r).toString(16).padStart(2, '0')}${Math.round(color.g).toString(16).padStart(2, '0')}${Math.round(color.b).toString(16).padStart(2, '0')}`;

        return (
          <SingleMarker
            key={idx}
            position={position}
            hex={hex}
            r={color.r}
            g={color.g}
            b={color.b}
            flashColor={flashColor}
            triggerKey={colorKey}
            onColorSelect={onColorSelect}
          />
        );
      })}
    </>
  );
};

const StyledBubble = styled.div`
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
  cursor: pointer;

  &:hover {
    border-color: #4e8cee;
  }
`;

const ColorCode = styled.div`
  font-family: monospace;
  font-size: 12px;
  color: #333;
`;

export default HarmonyMarkers;
