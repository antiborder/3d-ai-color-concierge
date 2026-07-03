import * as THREE from 'three';
import { useMemo } from 'react';
import { Html, Line } from '@react-three/drei';
import { RGB_XYZ_ROTATION, structureSize, labCylinderHeight } from '../../utils/colorSpacePositions';
import { focusContrastColor } from '../../utils/colorConverter';

const ARROW_LEN = 2.8;
const CONE_H = 0.3;
const CONE_R = 0.07;
const GRAD_SEGMENTS = 40;

// Lab axis ranges (from getLabPosition centering constants)
const AXIS_L = 50;
const A_MIN = -85.41, A_MAX = 97.37;
const B_MIN = -106.91, B_MAX = 93.63;

// Lab(L, a, b) → THREE.Color in sRGB (clamps out-of-gamut values)
function labToColor(L: number, a: number, b: number): THREE.Color {
  const delta = 6 / 29;
  const fInv = (t: number) => (t > delta ? t ** 3 : 3 * delta * delta * (t - 4 / 29));
  const fy = (L + 16) / 116;
  const X = 0.95047 * fInv(a / 500 + fy);
  const Y = 1.00000 * fInv(fy);
  const Z = 1.08883 * fInv(fy - b / 200);
  const rl =  3.2406 * X - 1.5372 * Y - 0.4986 * Z;
  const gl = -0.9689 * X + 1.8758 * Y + 0.0415 * Z;
  const bl =  0.0557 * X - 0.2040 * Y + 1.0570 * Z;
  const gc = (c: number) => {
    const v = Math.max(0, Math.min(1, c));
    return v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
  };
  return new THREE.Color(gc(rl), gc(gl), gc(bl));
}

type AxisConf = { raw: [number, number, number]; label: string; color: string };

const AXIS_COLOR = '#ffffff';

const RGB_AXES: AxisConf[] = [
  { raw: [-1, 0, 0], label: 'R', color: '#FF0000' },
  { raw: [0, -1, 0], label: 'G', color: '#00FF00' },
  { raw: [0, 0, 1],  label: 'B', color: '#0000FF' },
];
const CMY_AXES: AxisConf[] = [
  { raw: [1, 0, 0],  label: 'C', color: '#00FFFF' },
  { raw: [0, 1, 0],  label: 'M', color: '#FF00FF' },
  { raw: [0, 0, -1], label: 'Y', color: '#FFFF00' },
];
const XYZ_AXES: AxisConf[] = [
  { raw: [-1, 0, 0], label: 'X', color: AXIS_COLOR },
  { raw: [0, -1, 0], label: 'Y', color: AXIS_COLOR },
  { raw: [0, 0, 1],  label: 'Z', color: AXIS_COLOR },
];
const xyz_AXES: AxisConf[] = [
  { raw: [-1, 0, 0], label: 'x', color: AXIS_COLOR },
  { raw: [0, -1, 0], label: 'y', color: AXIS_COLOR },
  { raw: [0, 0, 1],  label: 'z', color: AXIS_COLOR },
];
const xy_AXES: AxisConf[] = [
  { raw: [-1, 0, 0], label: 'x', color: AXIS_COLOR },
  { raw: [0, -1, 0], label: 'y', color: AXIS_COLOR },
];

function labOrigin(s: number): [number, number, number] {
  return [0, 0, -s / 2];
}

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
  fromDist?: number;
  toDist?: number;
  // When provided, shaft is drawn with per-vertex colors (Lab gradient).
  // Length must equal GRAD_SEGMENTS + 1.
  vertexColors?: THREE.Color[];
}

const SingleAxis = ({
  origin,
  dir,
  label,
  color,
  fromDist = 0,
  toDist = ARROW_LEN,
  vertexColors,
}: SingleAxisProps) => {
  const coneCenter = offset(origin, dir, toDist - CONE_H / 2);
  const labelPos   = offset(origin, dir, toDist + 0.55);

  // Tip color: last vertex color converted to hex string, or the plain color prop
  const tipColor = vertexColors
    ? '#' + vertexColors[vertexColors.length - 1].getHexString()
    : color;

  const quaternion = useMemo(
    () =>
      new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(...dir)
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dir[0], dir[1], dir[2]]
  );

  const { shaftPoints, shaftVertexColors } = useMemo(() => {
    const shaftLen = toDist - CONE_H - fromDist;
    if (!vertexColors) {
      return {
        shaftPoints: [
          offset(origin, dir, fromDist),
          offset(origin, dir, toDist - CONE_H),
        ] as [number, number, number][],
        shaftVertexColors: undefined,
      };
    }
    const n = vertexColors.length;
    const points: [number, number, number][] = Array.from({ length: n }, (_, i) =>
      offset(origin, dir, fromDist + (i / (n - 1)) * shaftLen)
    );
    return { shaftPoints: points, shaftVertexColors: vertexColors };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vertexColors, fromDist, toDist, dir[0], dir[1], dir[2], origin[0], origin[1], origin[2]]);

  return (
    <group>
      {shaftVertexColors ? (
        <Line points={shaftPoints} vertexColors={shaftVertexColors} lineWidth={1.5} />
      ) : (
        <Line points={shaftPoints} color={color} lineWidth={1.5} />
      )}
      <mesh position={coneCenter} quaternion={quaternion}>
        <coneGeometry args={[CONE_R, CONE_H, 8]} />
        <meshBasicMaterial color={tipColor} depthTest={false} />
      </mesh>
      <Html position={labelPos} zIndexRange={[100, 5]}>
        <span
          style={{
            color: tipColor,
            fontWeight: 'bold',
            fontSize: '15px',
            textShadow: '0 0 1px #000, 0 0 1px #000',
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

// Build GRAD_SEGMENTS+1 Lab-derived vertex colors for a shaft spanning fromDist→toDist.
// The Lab value at each point is derived from the cube-edge range [valMin, valMax]
// mapped proportionally to the shaft's position within [-halfS, +halfS].
function makeLabColors(
  halfS: number,
  fromDist: number,
  toDist: number,
  valMin: number,
  valMax: number,
  toColor: (t: number) => THREE.Color
): THREE.Color[] {
  const shaftLen = toDist - CONE_H - fromDist;
  return Array.from({ length: GRAD_SEGMENTS + 1 }, (_, i) => {
    const pos = fromDist + (i / GRAD_SEGMENTS) * shaftLen;
    const t = (pos + halfS) / (halfS * 2); // 0 at -halfS edge, 1 at +halfS edge
    return toColor(valMin + t * (valMax - valMin));
  });
}

const AxisIndicators = ({ shape, focusL = 50 }: { shape: string; focusL?: number }) => {
  const data = useMemo(() => {
    const xyzColor = focusContrastColor(focusL);

    if (shape === 'Lab') {
      const origin: [number, number, number] = [0, 0, 0];
      const halfS = labCylinderHeight / 2;
      const fromDist = -halfS;
      const toDist   = halfS * 1.06;

      const aVertexColors = makeLabColors(halfS, fromDist, toDist, A_MIN, A_MAX,
        (a) => labToColor(AXIS_L, a, 0));
      const bVertexColors = makeLabColors(halfS, fromDist, toDist, B_MAX, B_MIN,
        (b) => labToColor(AXIS_L, 0, b));

      const axes = [
        {
          dir: [-Math.sin(Math.PI / 3), -Math.cos(Math.PI / 3), 0] as [number, number, number],
          label: 'a',
          color: xyzColor,
          fromDist,
          toDist,
          vertexColors: aVertexColors,
        },
        {
          dir: [-Math.cos(Math.PI / 3), Math.sin(Math.PI / 3), 0] as [number, number, number],
          label: 'b',
          color: xyzColor,
          fromDist,
          toDist,
          vertexColors: bVertexColors,
        },
      ];
      return { origin, axes };
    }

    const isCmyk = shape === 'CMYK';
    const baseConfs =
      shape === 'RGB' ? RGB_AXES
        : isCmyk ? CMY_AXES
          : shape === 'XYZ' ? XYZ_AXES
            : shape === 'xyz' ? xyz_AXES
              : shape === 'xy' ? xy_AXES
                : null;
    if (!baseConfs) return null;
    const isChromatic = shape === 'RGB' || isCmyk;
    const confs = isChromatic ? baseConfs : baseConfs.map((a) => ({ ...a, color: xyzColor }));

    const originRaw: [number, number, number] = isCmyk
      ? [-0.5 * structureSize, -0.5 * structureSize, 0.5 * structureSize]
      : [0.5 * structureSize, 0.5 * structureSize, -0.5 * structureSize];
    const origin = rotVec(originRaw, RGB_XYZ_ROTATION);
    const arrowLen = structureSize * 0.2;

    const axes = confs.map((a) => ({
      dir: rotVec(a.raw, RGB_XYZ_ROTATION),
      label: a.label,
      color: a.color,
      fromDist: structureSize - arrowLen,
      toDist: structureSize * 1.06,
      vertexColors: undefined as THREE.Color[] | undefined,
    }));
    return { origin, axes };
  }, [shape, focusL]);

  if (!data) return null;
  const { origin, axes } = data;

  return (
    <>
      {axes.map(({ dir, label, color, fromDist, toDist, vertexColors }) => (
        <SingleAxis
          key={label}
          origin={origin}
          dir={dir}
          label={label}
          color={color}
          fromDist={fromDist}
          toDist={toDist}
          vertexColors={vertexColors}
        />
      ))}
      <Html position={offset(origin, [0.15, 0.15, 0.15], 1)} zIndexRange={[100, 5]}>
        <span
          style={{
            color: focusContrastColor(focusL),
            fontWeight: 'bold',
            fontSize: '13px',
            textShadow: '0 0 1px #000, 0 0 1px #000',
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
