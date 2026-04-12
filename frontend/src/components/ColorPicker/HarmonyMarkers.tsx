import * as THREE from 'three';
import { useRef, useEffect } from 'react';
import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { PositionFunction } from '../../types/structure';
import type { HarmonyColor } from '../../utils/colorHarmony';

interface HarmonyMarkersProps {
  harmonyColors: HarmonyColor[];
  shape: string;
  focusL: number;
  getRgbPosition: PositionFunction;
  getHslPosition: PositionFunction;
  getHsvPosition: PositionFunction;
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
  flashColor: string;
  triggerKey: string;
}

const SingleMarker = ({ position, hex, flashColor, triggerKey }: SingleMarkerProps) => {
  const meridianGroupRef = useRef<THREE.Group>(null);
  // sphereGroupRef covers all Line children for imperative color traversal
  const sphereGroupRef = useRef<THREE.Group>(null);
  const animStartRef = useRef<number | null>(null);
  const hexRef = useRef(hex);
  const flashColorRef = useRef(flashColor);

  useEffect(() => { hexRef.current = hex; }, [hex]);
  useEffect(() => { flashColorRef.current = flashColor; }, [flashColor]);

  // Skip the very first render; start animation on subsequent triggerKey changes
  const isMountedRef = useRef(false);
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }
    animStartRef.current = Date.now();
  }, [triggerKey]);

  useFrame(() => {
    // Continuous Y-axis rotation
    if (meridianGroupRef.current) {
      meridianGroupRef.current.rotation.y += 0.02;
    }

    // Sine-wave color animation via traverse (no React re-render)
    if (animStartRef.current !== null && sphereGroupRef.current) {
      const elapsed = (Date.now() - animStartRef.current) / 1000;
      let targetHex: string;

      if (elapsed >= ANIM_DURATION) {
        animStartRef.current = null;
        targetHex = hexRef.current;
      } else {
        // 2 full sine cycles over ANIM_DURATION seconds: 0→1→0→1→0
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
      <group ref={sphereGroupRef} rotation={[Math.PI / 2, 0, 0]}>
        <group ref={meridianGroupRef}>
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
  focusL,
  getRgbPosition,
  getHslPosition,
  getHsvPosition,
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
              : getHsvPosition(color.r, color.g, color.b);

        const hex = `#${Math.round(color.r).toString(16).padStart(2, '0')}${Math.round(color.g).toString(16).padStart(2, '0')}${Math.round(color.b).toString(16).padStart(2, '0')}`;

        return (
          <SingleMarker
            key={idx}
            position={position}
            hex={hex}
            flashColor={flashColor}
            triggerKey={colorKey}
          />
        );
      })}
    </>
  );
};

export default HarmonyMarkers;
