import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import convert from 'color-convert';
import '../../App.css';
import Focus from './Focus';
import FocusPlane from './FocusPlane';
import FocusLine from './FocusLine';
import Particles from './Particles';
import type { StructureProps, PositionFunction, RescaleHslFunction, CylindricalToCartesianFunction } from '../../types/structure';

const Structure = (props: StructureProps) => {
  const cameraPosition: [number, number, number] = [0, 15, 0]; // カメラの位置
  const structureSize = 9;
  const sizeRatio = 0.7;
  const cylinderHeight = structureSize * sizeRatio;
  const cylinderRadius = structureSize * sizeRatio;

  const rescaleRgb = (r: number, g: number, b: number): [number, number, number] => {
    return [
      (r / 255 - 0.5) * structureSize,
      (-g / 255 + 0.5) * structureSize,
      (b / 255 - 0.5) * structureSize
    ];
  };

  const getRgbPosition: PositionFunction = (r: number, g: number, b: number): [number, number, number] => {
    const tiltRotationQuaternion = new THREE.Quaternion().setFromUnitVectors(
      (new THREE.Vector3(1, -1, 1)).normalize(),
      new THREE.Vector3(0, 0, 1)
    );
    const zRotationQuaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(1, 0, 0).normalize(),
      new THREE.Vector3(0, 0.77, 0)
    );

    const rotationQuaternion = zRotationQuaternion.multiply(tiltRotationQuaternion);
    return (
      (new THREE.Vector3(
        ...rescaleRgb(r, g, b)
      ).applyQuaternion(rotationQuaternion)
      ).toArray() as [number, number, number]
    );
  };

  const rescaleHsl: RescaleHslFunction = (h: number, s: number, l: number): [number, number, number] => {
    return [
      h / 360 * (2 * Math.PI),
      s / 100 * cylinderRadius,
      (l - 50) / 100 * cylinderHeight
    ];
  };

  const cylindricalToCartesian: CylindricalToCartesianFunction = (theta: number, radius: number, z: number): [number, number, number] => {
    return [
      radius * Math.sin(theta),
      radius * Math.cos(theta),
      z
    ];
  };

  const getHslPosition: PositionFunction = (r: number, g: number, b: number): [number, number, number] => {
    const [h, s, l] = convert.rgb.hsl([Math.round(r), Math.round(g), Math.round(b)]);
    const [theta, radius, z] = rescaleHsl(h, s, l);
    return cylindricalToCartesian(theta, radius, z);
  };

  const getHsvPosition: PositionFunction = (r: number, g: number, b: number): [number, number, number] => {
    const [h, s, v] = convert.rgb.hsv([Math.round(r), Math.round(g), Math.round(b)]);
    const [theta, radius, z] = rescaleHsl(h, s, v);
    return cylindricalToCartesian(theta, radius, z);
  };

  return (
    <div>
      <Canvas
        camera={{ position: cameraPosition }}
        style={{ height: '120vh', width: '120vw' }}
      >
        {/* @ts-ignore - React Three Fiber color element */}
        <color attach="background" args={['#C3C3C3']} />

        {/* @ts-ignore - React Three Fiber elements */}
        <ambientLight color='#ffffff' intensity={1} />
        <OrbitControls />
        {/* @ts-ignore */}
        <group
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <Particles {...props}
            getRgbPosition={getRgbPosition}
            getHslPosition={getHslPosition}
            getHsvPosition={getHsvPosition}
          />
          <Focus {...props}
            getRgbPosition={getRgbPosition}
            getHslPosition={getHslPosition}
            getHsvPosition={getHsvPosition}
          />
          <FocusPlane {...props}
            getRgbPosition={getRgbPosition}
            getHslPosition={getHslPosition}
            getHsvPosition={getHsvPosition}
            rescaleHsl={rescaleHsl}
            cylindricalToCartesian={cylindricalToCartesian}
            cylinderRadius={cylinderRadius}
            cylinderHeight={cylinderHeight}
          />
          <FocusLine {...props}
            getRgbPosition={getRgbPosition}
            getHslPosition={getHslPosition}
            getHsvPosition={getHsvPosition}
            rescaleHsl={rescaleHsl}
            cylindricalToCartesian={cylindricalToCartesian}
            cylinderRadius={cylinderRadius}
            cylinderHeight={cylinderHeight}
          />
        {/* @ts-ignore */}
        </group>
      </Canvas>
    </div>
  );
};

export default Structure;

