import React from 'react';
import * as THREE from 'three';

interface DiscProps {
  radius: number;
  position: [number, number, number];
  side?: THREE.Side;
}

const Disc = (props: DiscProps) => {
  // ジオメトリの作成
  const geometry = new THREE.CircleGeometry(props.radius, 32);
  // 白いマテリアルの作成
  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    opacity: 0.1,
    transparent: true,
    side: props.side || THREE.DoubleSide,
  });

  return (
    <mesh
      position={props.position}
      rotation={[Math.PI / 2, 0, 0]}
      geometry={geometry}
      material={material}
    />
  );
};

export default Disc;
