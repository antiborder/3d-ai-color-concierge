import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import { getWireframeSegments, WireframeSegment } from '../../utils/colorSpaceWireframes';
import type { PositionFunction } from '../../types/structure';
import {
  getRgbPosition,
  getHslPosition,
  getHsbPosition,
  getLchPosition,
  getLabPosition,
  getXyzPosition,
  getXyzChromaticityPosition,
  getXyChromaticityPosition,
} from '../../utils/colorSpacePositions';

const DURATION = 1.5;

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

const SHAPE_TO_FN: Record<string, PositionFunction> = {
  RGB: getRgbPosition,
  CMYK: getRgbPosition,
  HSL: getHslPosition,
  HSB: getHsbPosition,
  XYZ: getXyzPosition,
  xyz: getXyzChromaticityPosition,
  xy: getXyChromaticityPosition,
  Lab: getLabPosition,
  LCH: getLchPosition,
};

function computePos(segs: WireframeSegment[], fn: PositionFunction): THREE.Vector3[][] {
  return segs.map(seg =>
    seg.samples.map(([r, g, b]) => new THREE.Vector3(...fn(r, g, b)))
  );
}

interface AnimState {
  segs: WireframeSegment[];
  startPos: THREE.Vector3[][];
  targetPos: THREE.Vector3[][];
  pendingSegs: WireframeSegment[] | null;
  pendingFn: PositionFunction | null;
  currentFn: PositionFunction;
  progress: number;
}

interface AnimatedWireframeProps {
  shape: string;
  visible: boolean;
}

const AnimatedWireframe = ({ shape, visible }: AnimatedWireframeProps) => {
  const animRef = useRef<AnimState | null>(null);

  // Lazy-initialize on first render
  if (!animRef.current) {
    const fn = SHAPE_TO_FN[shape] ?? getRgbPosition;
    const segs = getWireframeSegments(shape);
    const pos = computePos(segs, fn);
    animRef.current = {
      segs,
      startPos: pos,
      targetPos: pos,
      pendingSegs: null,
      pendingFn: null,
      currentFn: fn,
      progress: 1,
    };
  }

  const [, forceRender] = useState(0);
  const prevShapeRef = useRef(shape);

  useEffect(() => {
    if (prevShapeRef.current === shape) return;
    prevShapeRef.current = shape;

    const a = animRef.current!;
    const t = easeInOut(Math.min(1, a.progress));
    const newFn = SHAPE_TO_FN[shape] ?? getRgbPosition;

    // Capture current interpolated positions as the new start
    const curPos = a.startPos.map((segPts, si) =>
      segPts.map((sp, pi) => {
        const tp = a.targetPos[si]?.[pi] ?? sp;
        return new THREE.Vector3(
          sp.x + (tp.x - sp.x) * t,
          sp.y + (tp.y - sp.y) * t,
          sp.z + (tp.z - sp.z) * t,
        );
      })
    );

    a.startPos = curPos;
    a.targetPos = computePos(a.segs, newFn);
    a.pendingSegs = getWireframeSegments(shape);
    a.pendingFn = newFn;
    a.progress = 0;

    forceRender(n => n + 1);
  }, [shape]);

  useFrame((_, delta) => {
    const a = animRef.current!;
    if (a.progress >= 1) return;

    a.progress = Math.min(1, a.progress + delta / DURATION);

    if (a.progress >= 1 && a.pendingSegs) {
      // Snap to target topology now that positions have arrived
      const fn = a.pendingFn ?? a.currentFn;
      a.segs = a.pendingSegs;
      const pos = computePos(a.segs, fn);
      a.startPos = pos;
      a.targetPos = pos;
      a.currentFn = fn;
      a.pendingSegs = null;
      a.pendingFn = null;
    }

    forceRender(n => n + 1);
  });

  if (!visible || !animRef.current) return null;

  const a = animRef.current;
  const t = easeInOut(Math.min(1, a.progress));

  return (
    <>
      {a.segs.map((seg, si) => {
        const sps = a.startPos[si];
        const tps = a.targetPos[si];
        if (!sps || !tps) return null;

        const points = sps.map((sp, pi): [number, number, number] => {
          const tp = tps[pi] ?? sp;
          return [
            sp.x + (tp.x - sp.x) * t,
            sp.y + (tp.y - sp.y) * t,
            sp.z + (tp.z - sp.z) * t,
          ];
        });

        const colors = seg.samples.map(
          ([r, g, b]) => new THREE.Color(r / 255, g / 255, b / 255)
        );

        return (
          <Line
            key={si}
            points={points}
            vertexColors={colors}
            lineWidth={seg.lineWidth}
          />
        );
      })}
    </>
  );
};

export default AnimatedWireframe;
