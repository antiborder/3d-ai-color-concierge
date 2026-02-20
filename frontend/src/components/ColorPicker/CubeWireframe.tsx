import * as THREE from 'three';
import { Line } from '@react-three/drei';
import type { StructureProps } from '../../types/structure';

interface CubeWireframeProps extends Pick<StructureProps, 'shape'> {
  structureSize: number;
  visible: boolean;
}

const CubeWireframe = ({ shape, structureSize, visible }: CubeWireframeProps) => {
  // RGB/CMYKの時のみ表示
  const shouldShow = shape === 'RGB' || shape === 'CMYK';

  // 表示するかどうか
  const isVisible = shouldShow && visible;

  // RGB/CMYKの時の立方体の外枠
  // RGB空間と同じ回転を適用
  const tiltRotationQuaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(1, -1, 1).normalize(),
    new THREE.Vector3(0, 0, 1)
  );
  const zRotationQuaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(1, 0, 0).normalize(),
    new THREE.Vector3(0, 0.77, 0)
  );
  const rotationQuaternion = zRotationQuaternion.multiply(tiltRotationQuaternion);

  // 立方体の8つの頂点を計算
  const halfSize = structureSize / 2;
  const vertices = [
    [-halfSize, -halfSize, -halfSize],
    [halfSize, -halfSize, -halfSize],
    [halfSize, halfSize, -halfSize],
    [-halfSize, halfSize, -halfSize],
    [-halfSize, -halfSize, halfSize],
    [halfSize, -halfSize, halfSize],
    [halfSize, halfSize, halfSize],
    [-halfSize, halfSize, halfSize],
  ].map((v) => {
    const vec = new THREE.Vector3(...v);
    vec.applyQuaternion(rotationQuaternion);
    return vec.toArray() as [number, number, number];
  });

  // 立方体の12の辺を定義
  const edges = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0], // 底面
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4], // 上面
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7], // 垂直辺
  ];

  // 表示されない場合は何もレンダリングしない
  if (!isVisible) {
    return null;
  }

  return (
    <group>
      {edges.map((edge, index) => {
        const [start, end] = edge;
        const startPos = vertices[start];
        const endPos = vertices[end];

        return <Line key={index} points={[startPos, endPos]} color="#ffffff" lineWidth={1} />;
      })}
    </group>
  );
};

export default CubeWireframe;
