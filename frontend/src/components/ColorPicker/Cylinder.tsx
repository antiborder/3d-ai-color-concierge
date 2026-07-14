import React from 'react';
import * as THREE from 'three';

interface CylinderProps {
  radius: number;
  height: number;
  side?: THREE.Side;
}

const Cylinder = (props: CylinderProps) => {
  // ジオメトリの作成
  const geometry = new THREE.CylinderGeometry(
    props.radius,
    props.radius,
    props.height,
    32,
    1,
    true
  );
  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    opacity: 0.05,
    transparent: true,
    side: props.side || THREE.DoubleSide,
  });

  return <mesh geometry={geometry} material={material} position={[0, 0, 0]} />;
};

export default Cylinder;
