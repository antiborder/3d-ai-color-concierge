import * as THREE from 'three';
import { useMemo } from 'react';
import { Html, Line } from '@react-three/drei';
import { RGB_XYZ_ROTATION, structureSize } from '../../utils/colorSpacePositions';

const ARROW_LEN = 2.8;
const CONE_H = 0.5;
const CONE_R = 0.12;

type AxisConf = { raw: [number, number, number]; label: string; color: string };

const AXIS_COLOR = '#ffffff';

const XYZ_AXES: AxisConf[] = [
  { raw: [-1, 0, 0], label: 'X', color: AXIS_COLOR },
  { raw: [0, -1, 0], label: 'Y', color: AXIS_COLOR },
  { raw: [0, 0, 1], label: 'Z', color: AXIS_COLOR },
];
const xyz_AXES: AxisConf[] = [
  { raw: [-1, 0, 0], label: 'x', color: AXIS_COLOR },
  { raw: [0, -1, 0], label: 'y', color: AXIS_COLOR },
  { raw: [0, 0, 1], label: 'z', color: AXIS_COLOR },
];
const xy_AXES: AxisConf[] = [
  { raw: [-1, 0, 0], label: 'x', color: AXIS_COLOR },
  { raw: [0, -1, 0], label: 'y', color: AXIS_COLOR },
];

function rotVec(raw: [number, number, number], q: THREE.Quaternion): [number, number, number] {
  return new THREE.Vector3(...raw).applyQuaternion(q).toArray() as [number, number, number];
}

function offset(
  base: [number, number, number],
  dir: [number, number, number],
  scale: number
): [number, number, number] {
  return [base[0] + dir[0] * scale, base[1] + dir[1] * scale, base[2] + dir[2] * scale];
}

interface SingleAxisProps {
  origin: [number, number, number];
  dir: [number, number, number];
  label: string;
  color: string;
}

const SingleAxis = ({ origin, dir, label, color }: SingleAxisProps) => {
  const shaftEnd = offset(origin, dir, ARROW_LEN - CONE_H);
  const coneCenter = offset(origin, dir, ARROW_LEN - CONE_H / 2);
  const labelPos = offset(origin, dir, ARROW_LEN + 0.55);
  const quaternion = useMemo(
    () =>
      new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(...dir)
      ),
    // dir changes only when shape changes, which triggers full remount
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dir[0], dir[1], dir[2]]
  );

  return (
    <group>
      <Line points={[origin, shaftEnd]} color={color} lineWidth={2.5} />
      <mesh position={coneCenter} quaternion={quaternion}>
        <coneGeometry args={[CONE_R, CONE_H, 8]} />
        <meshBasicMaterial color={color} depthTest={false} />
      </mesh>
      <Html position={labelPos} zIndexRange={[1500, 1600]}>
        <span
          style={{
            color,
            fontWeight: 'bold',
            fontSize: '15px',
            textShadow: '0 0 4px #000, 0 0 3px #000',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        >
          {label}
        </span>
      </Html>
    </group>
  );
};

const AxisIndicators = ({ shape }: { shape: string }) => {
  const data = useMemo(() => {
    const confs =
      shape === 'XYZ' ? XYZ_AXES
      : shape === 'xyz' ? xyz_AXES
      : shape === 'xy' ? xy_AXES
      : null;
    if (!confs) return null;

    // CIE XYZ (0,0,0) = black → local position (0.5s, 0.5s, -0.5s) → rotate
    const origin = rotVec(
      [0.5 * structureSize, 0.5 * structureSize, -0.5 * structureSize],
      RGB_XYZ_ROTATION
    );
    const axes = confs.map((a) => ({
      dir: rotVec(a.raw, RGB_XYZ_ROTATION),
      label: a.label,
      color: a.color,
    }));
    return { origin, axes };
  }, [shape]);

  if (!data) return null;
  const { origin, axes } = data;

  return (
    <>
      {axes.map(({ dir, label, color }) => (
        <SingleAxis key={label} origin={origin} dir={dir} label={label} color={color} />
      ))}
      <Html position={offset(origin, [0.15, 0.15, 0.15], 1)} zIndexRange={[1500, 1600]}>
        <span
          style={{
            color: 'white',
            fontWeight: 'bold',
            fontSize: '13px',
            textShadow: '0 0 4px #000, 0 0 3px #000',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        >
          O
        </span>
      </Html>
    </>
  );
};

export default AxisIndicators;
