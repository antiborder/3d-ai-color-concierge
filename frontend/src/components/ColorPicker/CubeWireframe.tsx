import * as THREE from 'three';
import { Line } from '@react-three/drei';
import type { StructureProps } from '../../types/structure';
import { LOCUS } from '../../constants/cieLocus';

function wavelengthToHex(nm: number): string {
  let r = 0, g = 0, b = 0;
  if (nm < 440)       { r = -(nm - 440) / 60; g = 0; b = 1; }
  else if (nm < 490)  { r = 0; g = (nm - 440) / 50; b = 1; }
  else if (nm < 510)  { r = 0; g = 1; b = -(nm - 510) / 20; }
  else if (nm < 580)  { r = (nm - 510) / 70; g = 1; b = 0; }
  else if (nm < 645)  { r = 1; g = -(nm - 645) / 65; b = 0; }
  else                { r = 1; g = 0; b = 0; }
  const f = nm < 420 ? 0.3 + 0.7 * (nm - 380) / 40 : 1;
  const hex = (v: number) => Math.round(Math.max(0, Math.min(1, v)) * f * 255).toString(16).padStart(2, '0');
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

interface CubeWireframeProps extends Pick<StructureProps, 'shape'> {
  structureSize: number;
  visible: boolean;
  // Lab box override: if provided, renders an axis-aligned box instead of the rotated RGB cube
  labBoxSize?: { x: number; y: number; z: number };
}

// Same rotation as RGB: tilt (1,-1,1)/√3 → z, then 90° z-rotation
// Negating Y in xyzVertex makes white=(1,-1,1)/√3, aligning XYZ/xyz with RGB orientation
const XYZ_ROT = (() => {
  const tilt = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(-1, -1, 1).normalize(),
    new THREE.Vector3(0, 0, 1)
  );
  const zRot = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(1, 0, 0).normalize(),
    new THREE.Vector3(0, 0.77, 0)
  );
  return zRot.multiply(tilt);
})();

// sRGB corner → XYZ (D65), normalized by white point, Y negated to match RGB orientation
function xyzVertex(r: number, g: number, b: number, s: number): [number, number, number] {
  const X = 0.4124564 * r + 0.3575761 * g + 0.1804375 * b;
  const Y = 0.2126729 * r + 0.7151522 * g + 0.0721750 * b;
  const Z = 0.0193339 * r + 0.1191920 * g + 0.9503041 * b;
  return new THREE.Vector3(
    -(X / 0.95047  - 0.5) * s,
    -(Y / 1.0      - 0.5) * s,
    (Z / 1.08883  - 0.5) * s,
  ).applyQuaternion(XYZ_ROT).toArray() as [number, number, number];
}

const CubeWireframe = ({ shape, structureSize, visible, labBoxSize }: CubeWireframeProps) => {
  const shouldShow = shape === 'RGB' || shape === 'CMYK' || shape === 'Lab' || shape === 'XYZ' || shape === 'xyz' || shape === 'xy';
  const isVisible = shouldShow && visible;

  let vertices: [number, number, number][];

  if (shape === 'XYZ') {
    // sRGB parallelepiped in XYZ space: 8 corners of [0,1]³ mapped via sRGB→XYZ
    // vertex order: [Black, Red, Green, Blue, Yellow, Magenta, Cyan, White]
    const s = structureSize;
    vertices = [
      xyzVertex(0,0,0,s), xyzVertex(1,0,0,s), xyzVertex(0,1,0,s), xyzVertex(0,0,1,s),
      xyzVertex(1,1,0,s), xyzVertex(1,0,1,s), xyzVertex(0,1,1,s), xyzVertex(1,1,1,s),
    ];
  } else if (shape === 'Lab' && labBoxSize) {
    // Lab box: axis-aligned, centered at origin
    const { x: hx, y: hy, z: hz } = { x: labBoxSize.x / 2, y: labBoxSize.y / 2, z: labBoxSize.z / 2 };
    vertices = [
      [-hx, -hy, -hz], [hx, -hy, -hz], [hx, hy, -hz], [-hx, hy, -hz],
      [-hx, -hy,  hz], [hx, -hy,  hz], [hx, hy,  hz], [-hx, hy,  hz],
    ];
  } else {
    // RGB/CMYK rotated cube
    const tiltRotationQuaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(-1, -1, 1).normalize(),
      new THREE.Vector3(0, 0, 1)
    );
    const zRotationQuaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(1, 0, 0).normalize(),
      new THREE.Vector3(0, 0.77, 0)
    );
    const rotationQuaternion = zRotationQuaternion.multiply(tiltRotationQuaternion);
    const halfSize = structureSize / 2;
    vertices = [
      [-halfSize, halfSize, -halfSize],
      [halfSize, halfSize, -halfSize],
      [halfSize, -halfSize, -halfSize],
      [-halfSize, -halfSize, -halfSize],
      [-halfSize, halfSize, halfSize],
      [halfSize, halfSize, halfSize],
      [halfSize, -halfSize, halfSize],
      [-halfSize, -halfSize, halfSize],
    ].map((v) => {
      const vec = new THREE.Vector3(...v);
      vec.applyQuaternion(rotationQuaternion);
      return vec.toArray() as [number, number, number];
    });
  }

  // XYZ: color edges by RGB axis direction (R=red, G=green, B=blue)
  // vertex order for XYZ: [Black(0), Red(1), Green(2), Blue(3), Yellow(4), Magenta(5), Cyan(6), White(7)]
  const xyzColoredEdges: Array<[number, number, string]> = [
    [0, 1, '#ff5555'], [2, 4, '#ff5555'], [3, 5, '#ff5555'], [6, 7, '#ff5555'], // R-direction
    [0, 2, '#55ff55'], [1, 4, '#55ff55'], [3, 6, '#55ff55'], [5, 7, '#55ff55'], // G-direction
    [0, 3, '#5599ff'], [1, 5, '#5599ff'], [2, 6, '#5599ff'], [4, 7, '#5599ff'], // B-direction
  ];

  // Standard edges for non-XYZ shapes
  const edges = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7],
  ];

  if (!isVisible) return null;

  if (shape === 'xy') {
    // Same cube as xyz mode; sRGB triangle projected onto z_c=0 face
    const cv = (xc:number,yc:number,zc:number): [number,number,number] =>
      new THREE.Vector3(-(xc-0.5)*structureSize, -(yc-0.5)*structureSize, (zc-0.5)*structureSize).applyQuaternion(XYZ_ROT).toArray() as [number,number,number];
    const [c000,c100,c010,c001,c110,c101,c011,c111] = [
      cv(0,0,0),cv(1,0,0),cv(0,1,0),cv(0,0,1),cv(1,1,0),cv(1,0,1),cv(0,1,1),cv(1,1,1),
    ];
    const boxEdges: [[number,number,number],[number,number,number]][] = [
      [c000,c100],[c000,c010],[c000,c001],
      [c111,c011],[c111,c101],[c111,c110],
      [c100,c110],[c100,c101],
      [c010,c110],[c010,c011],
      [c001,c101],[c001,c011],
    ];
    // sRGB gamut triangle on z_c=0 face
    const vR=cv(0.6400,0.3300,0), vG=cv(0.3000,0.6000,0), vB=cv(0.1500,0.0600,0);
    // Focus plane: exactly the z_c=0 face of the cube (two triangles)
    const facePos = new Float32Array([
      ...cv(0,0,0), ...cv(1,0,0), ...cv(1,1,0),
      ...cv(0,0,0), ...cv(1,1,0), ...cv(0,1,0),
    ]);
    // CIE spectral locus: each 10nm segment colored by wavelength
    const locusFirst = cv(LOCUS[0][1], LOCUS[0][2], 0);
    const locusLast  = cv(LOCUS[LOCUS.length - 1][1], LOCUS[LOCUS.length - 1][2], 0);
    return (
      <group>
        {boxEdges.map(([a,b],i) => <Line key={i} points={[a,b]} color="#555555" lineWidth={0.7}/>)}
        <mesh>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[facePos, 3]} />
          </bufferGeometry>
          <meshBasicMaterial color="white" transparent opacity={0.18} side={THREE.DoubleSide} />
        </mesh>
        {LOCUS.slice(0, -1).map((seg, i) => (
          <Line
            key={`locus-${i}`}
            points={[cv(seg[1], seg[2], 0), cv(LOCUS[i + 1][1], LOCUS[i + 1][2], 0)]}
            color={wavelengthToHex(seg[0])}
            lineWidth={2}
          />
        ))}
        <Line points={[locusLast, locusFirst]} color="#bb44ff" lineWidth={1.2} />
        <Line points={[vR,vG]} color="#ff5555" lineWidth={1.5}/>
        <Line points={[vG,vB]} color="#55ff55" lineWidth={1.5}/>
        <Line points={[vB,vR]} color="#5599ff" lineWidth={1.5}/>
      </group>
    );
  }

  if (shape === 'xyz') {
    // Same center (0.5) and scale (structureSize) as XYZ bounding cube
    const cv = (xc:number,yc:number,zc:number): [number,number,number] =>
      new THREE.Vector3(-(xc-0.5)*structureSize, -(yc-0.5)*structureSize, (zc-0.5)*structureSize).applyQuaternion(XYZ_ROT).toArray() as [number,number,number];
    const [c000,c100,c010,c001,c110,c101,c011,c111] = [
      cv(0,0,0),cv(1,0,0),cv(0,1,0),cv(0,0,1),cv(1,1,0),cv(1,0,1),cv(0,1,1),cv(1,1,1),
    ];
    const boxEdges: [[number,number,number],[number,number,number]][] = [
      [c000,c100],[c000,c010],[c000,c001],
      [c111,c011],[c111,c101],[c111,c110],
      [c100,c110],[c100,c101],
      [c010,c110],[c010,c011],
      [c001,c101],[c001,c011],
    ];
    const ch = (r:number,g:number,b:number): [number,number,number] => {
      const X=0.4124564*r+0.3575761*g+0.1804375*b;
      const Y=0.2126729*r+0.7151522*g+0.0721750*b;
      const Z=0.0193339*r+0.1191920*g+0.9503041*b;
      const s=X+Y+Z;
      return cv(X/s, Y/s, Z/s);
    };
    const vR=ch(1,0,0), vG=ch(0,1,0), vB=ch(0,0,1);
    // x+y+z=1 plane intersects [0,1]³ as the triangle (1,0,0)→(0,1,0)→(0,0,1)
    const triPos = new Float32Array([...cv(1,0,0), ...cv(0,1,0), ...cv(0,0,1)]);
    // Spectral locus on x+y+z=1 plane: each point at (x, y, 1-x-y)
    const xyzLocusFirst = cv(LOCUS[0][1], LOCUS[0][2], 1 - LOCUS[0][1] - LOCUS[0][2]);
    const xyzLocusLast  = cv(LOCUS[LOCUS.length - 1][1], LOCUS[LOCUS.length - 1][2], 1 - LOCUS[LOCUS.length - 1][1] - LOCUS[LOCUS.length - 1][2]);
    return (
      <group>
        {boxEdges.map(([a,b],i) => <Line key={i} points={[a,b]} color="#555555" lineWidth={0.7}/>)}
        <mesh>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[triPos, 3]} />
          </bufferGeometry>
          <meshBasicMaterial color="white" transparent opacity={0.2} side={THREE.DoubleSide} />
        </mesh>
        {LOCUS.slice(0, -1).map((seg, i) => (
          <Line
            key={`xyz-locus-${i}`}
            points={[
              cv(seg[1], seg[2], 1 - seg[1] - seg[2]),
              cv(LOCUS[i + 1][1], LOCUS[i + 1][2], 1 - LOCUS[i + 1][1] - LOCUS[i + 1][2]),
            ]}
            color={wavelengthToHex(seg[0])}
            lineWidth={2}
          />
        ))}
        <Line points={[xyzLocusLast, xyzLocusFirst]} color="#bb44ff" lineWidth={1.2} />
        <Line points={[vR,vG]} color="#ff5555" lineWidth={1.5}/>
        <Line points={[vG,vB]} color="#55ff55" lineWidth={1.5}/>
        <Line points={[vB,vR]} color="#5599ff" lineWidth={1.5}/>
      </group>
    );
  }

  if (shape === 'XYZ') {
    // XYZ axis-aligned bounding box: [0,1]³ in white-point-normalized XYZ space
    // sRGB parallelepiped fits inside this cube
    const s = structureSize;
    const bv = (xn:number,yn:number,zn:number): [number,number,number] =>
      new THREE.Vector3(-(xn-0.5)*s, (yn-0.5)*s, (zn-0.5)*s).applyQuaternion(XYZ_ROT).toArray() as [number,number,number];
    const [b000,b100,b010,b001,b110,b101,b011,b111] = [
      bv(0,0,0),bv(1,0,0),bv(0,1,0),bv(0,0,1),bv(1,1,0),bv(1,0,1),bv(0,1,1),bv(1,1,1),
    ];
    const xyzBoxEdges: [[number,number,number],[number,number,number]][] = [
      [b000,b100],[b010,b110],[b001,b101],[b011,b111],
      [b000,b010],[b100,b110],[b001,b011],[b101,b111],
      [b000,b001],[b100,b101],[b010,b011],[b110,b111],
    ];
    return (
      <group>
        {xyzBoxEdges.map(([a,b],i) => (
          <Line key={`xyz-${i}`} points={[a,b]} color="#ffffff" lineWidth={1.0} />
        ))}
        {xyzColoredEdges.map(([start, end, color], i) => (
          <Line key={`rgb-${i}`} points={[vertices[start], vertices[end]]} color={color} lineWidth={1.5} />
        ))}
      </group>
    );
  }

  return (
    <group>
      {edges.map((edge, index) => {
        const [start, end] = edge;
        return <Line key={index} points={[vertices[start], vertices[end]]} color="#ffffff" lineWidth={1} />;
      })}
    </group>
  );
};

export default CubeWireframe;
