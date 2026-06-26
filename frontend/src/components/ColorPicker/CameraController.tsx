import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useEffect, useRef } from 'react';
import type { PositionFunction } from '../../types/structure';

interface CameraControllerProps {
  r: number;
  g: number;
  b: number;
  shape: string;
  getRgbPosition: PositionFunction;
  getHslPosition: PositionFunction;
  getHsbPosition: PositionFunction;
}

const CameraController = ({
  r,
  g,
  b,
  shape,
  getRgbPosition,
  getHslPosition,
  getHsbPosition,
}: CameraControllerProps) => {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  const prevColorRef = useRef<{ r: number; g: number; b: number } | null>(null);
  const isAnimatingRef = useRef(false);

  useEffect(() => {
    const colorChanged =
      !prevColorRef.current ||
      prevColorRef.current.r !== r ||
      prevColorRef.current.g !== g ||
      prevColorRef.current.b !== b;

    if (colorChanged && !isAnimatingRef.current) {
      let colorPosition: [number, number, number];
      if (shape === 'RGB' || shape === 'CMYK') {
        colorPosition = getRgbPosition(r, g, b);
      } else if (shape === 'HSL') {
        colorPosition = getHslPosition(r, g, b);
      } else {
        colorPosition = getHsbPosition(r, g, b);
      }

      const colorVector = new THREE.Vector3(...colorPosition);

      // group rotation={[-Math.PI / 2, 0, 0]} applied in Structure, so transform to world space
      const groupRotation = new THREE.Euler(-Math.PI / 2, 0, 0, 'XYZ');
      const groupRotationQuaternion = new THREE.Quaternion().setFromEuler(groupRotation);
      const worldColorPosition = colorVector.clone().applyQuaternion(groupRotationQuaternion);

      if (controlsRef.current && controlsRef.current.object) {
        isAnimatingRef.current = true;

        const currentPosition = camera.position.clone();
        const origin = new THREE.Vector3(0, 0, 0);
        const currentDistance = currentPosition.distanceTo(origin);

        const directionFromOrigin = worldColorPosition.clone().sub(origin).normalize();

        const maxAngle = (30 * Math.PI) / 180;
        const randomAngle = (Math.random() * 2 - 1) * maxAngle;

        let rotationAxis = new THREE.Vector3(1, 0, 0);
        const crossProduct = new THREE.Vector3().crossVectors(directionFromOrigin, rotationAxis);
        if (crossProduct.length() < 0.01) {
          rotationAxis = new THREE.Vector3(0, 1, 0);
          crossProduct.crossVectors(directionFromOrigin, rotationAxis);
        }
        rotationAxis = crossProduct.normalize();

        const randomRotationQuaternion = new THREE.Quaternion().setFromAxisAngle(
          rotationAxis,
          randomAngle
        );
        const rotatedDirection = directionFromOrigin
          .clone()
          .applyQuaternion(randomRotationQuaternion);

        const currentDirection = currentPosition.clone().sub(origin).normalize();

        const directionRotationQuaternion = new THREE.Quaternion().setFromUnitVectors(
          currentDirection,
          rotatedDirection
        );

        controlsRef.current.target.copy(origin);

        const duration = 1000;
        const startTime = Date.now();

        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased =
            progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

          const startQuaternion = new THREE.Quaternion();
          const interpolatedQuaternion = startQuaternion
            .clone()
            .slerp(directionRotationQuaternion, eased);

          const interpolatedDirection = currentDirection
            .clone()
            .applyQuaternion(interpolatedQuaternion);
          const newPosition = origin
            .clone()
            .add(interpolatedDirection.multiplyScalar(currentDistance));

          camera.position.copy(newPosition);
          controlsRef.current.update();

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            isAnimatingRef.current = false;
          }
        };

        animate();
      }

      prevColorRef.current = { r, g, b };
    }
  }, [r, g, b, shape, getRgbPosition, getHslPosition, getHsbPosition, camera]);

  return <OrbitControls ref={controlsRef} />;
};

export default CameraController;
