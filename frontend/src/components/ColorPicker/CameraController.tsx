import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import type { PositionFunction, AiColorLabel } from '../../types/structure';

interface CameraControllerProps {
  r: number;
  g: number;
  b: number;
  shape: string;
  getRgbPosition: PositionFunction;
  getHslPosition: PositionFunction;
  getHsbPosition: PositionFunction;
  rotateCameraRef?: MutableRefObject<boolean>;
  resetCameraZoomSignal?: number;
  aiColorLabels?: AiColorLabel[];
  aiColorLabelPositions?: [number, number, number][];
}

const GROUP_ROTATION = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));

// Minimum camera distance when zoomed in on labels
const MIN_LABEL_DISTANCE = 3;
// Padding added to bounding radius (world units)
const LABEL_PADDING = 1.5;

function localToWorld(local: [number, number, number]): THREE.Vector3 {
  return new THREE.Vector3(...local).applyQuaternion(GROUP_ROTATION);
}

const CameraController = ({
  r,
  g,
  b,
  shape,
  getRgbPosition,
  getHslPosition,
  getHsbPosition,
  rotateCameraRef,
  resetCameraZoomSignal,
  aiColorLabels,
  aiColorLabelPositions,
}: CameraControllerProps) => {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  const prevColorRef = useRef<{ r: number; g: number; b: number } | null>(null);
  const isAnimatingRef = useRef(false);
  const savedCameraRef = useRef<{ position: THREE.Vector3; target: THREE.Vector3 } | null>(null);
  const labelAnimFrameRef = useRef<number | null>(null);
  const initialCameraRef = useRef<{ position: THREE.Vector3; target: THREE.Vector3 } | null>(null);

  // Capture initial camera position once after mount
  useEffect(() => {
    initialCameraRef.current = {
      position: camera.position.clone(),
      target: new THREE.Vector3(0, 0, 0),
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Camera zoom reset (RESET_ZOOM tool or CHANGE_SHAPE) ---
  useEffect(() => {
    if (!resetCameraZoomSignal) return; // 0 = initial render, skip
    savedCameraRef.current = null;
    if (initialCameraRef.current && controlsRef.current) {
      animateCameraTo(
        camera,
        controlsRef.current,
        initialCameraRef.current.position.clone(),
        initialCameraRef.current.target.clone(),
        labelAnimFrameRef,
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetCameraZoomSignal]);

  // --- Label focus effect ---
  // Depends on aiColorLabels (the label SET), not aiColorLabelPositions.
  // Shape changes reposition labels in 3D space but do not re-trigger this zoom.
  useEffect(() => {
    if (!controlsRef.current) return;

    // Cancel any in-progress label animation
    if (labelAnimFrameRef.current !== null) {
      cancelAnimationFrame(labelAnimFrameRef.current);
      labelAnimFrameRef.current = null;
    }

    const labels = aiColorLabels ?? [];

    if (labels.length === 0) {
      // Restore saved camera state
      if (savedCameraRef.current) {
        const targetPos = savedCameraRef.current.position.clone();
        const targetLook = savedCameraRef.current.target.clone();
        savedCameraRef.current = null;
        animateCameraTo(camera, controlsRef.current, targetPos, targetLook, labelAnimFrameRef);
      }
      return;
    }

    // Save current camera state (only on first label set, not on updates)
    if (!savedCameraRef.current) {
      savedCameraRef.current = {
        position: camera.position.clone(),
        target: controlsRef.current.target.clone(),
      };
    }

    // Use current positions (same render as aiColorLabels update)
    const positions = aiColorLabelPositions ?? [];
    if (positions.length === 0) return;

    // Transform positions to world space (group rotation applied)
    const worldPositions = positions.map(localToWorld);

    // Centroid
    const centroid = new THREE.Vector3();
    worldPositions.forEach((p) => centroid.add(p));
    centroid.divideScalar(worldPositions.length);

    // Bounding radius
    let boundingRadius = 0;
    worldPositions.forEach((p) => {
      boundingRadius = Math.max(boundingRadius, p.distanceTo(centroid));
    });

    // Target camera distance: fit the padded bounding sphere in the vertical FOV
    const halfFovRad = ((camera as THREE.PerspectiveCamera).fov * Math.PI) / 360;
    const targetDist = Math.max(
      MIN_LABEL_DISTANCE,
      (boundingRadius + LABEL_PADDING) / Math.tan(halfFovRad),
    );

    // Keep the current orbital direction, only change distance and target
    const currentTarget = controlsRef.current.target.clone();
    const currentDir = camera.position.clone().sub(currentTarget).normalize();
    const newCameraPos = centroid.clone().add(currentDir.multiplyScalar(targetDist));

    animateCameraTo(camera, controlsRef.current, newCameraPos, centroid, labelAnimFrameRef);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiColorLabels]);

  // --- Existing color-change rotation effect ---
  useEffect(() => {
    const colorChanged =
      !prevColorRef.current ||
      prevColorRef.current.r !== r ||
      prevColorRef.current.g !== g ||
      prevColorRef.current.b !== b;

    if (colorChanged) {
      prevColorRef.current = { r, g, b };
    }

    const shouldRotate = rotateCameraRef ? rotateCameraRef.current : false;
    if (shouldRotate && colorChanged && !isAnimatingRef.current) {
      if (rotateCameraRef) rotateCameraRef.current = false;
      let colorPosition: [number, number, number];
      if (shape === 'RGB' || shape === 'CMYK') {
        colorPosition = getRgbPosition(r, g, b);
      } else if (shape === 'HSL') {
        colorPosition = getHslPosition(r, g, b);
      } else {
        colorPosition = getHsbPosition(r, g, b);
      }

      const colorVector = new THREE.Vector3(...colorPosition);
      const worldColorPosition = colorVector.clone().applyQuaternion(GROUP_ROTATION);

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
    }
  }, [r, g, b, shape, getRgbPosition, getHslPosition, getHsbPosition, camera, rotateCameraRef]);

  return <OrbitControls ref={controlsRef} />;
};

function animateCameraTo(
  camera: THREE.Camera,
  controls: any,
  targetPos: THREE.Vector3,
  targetLook: THREE.Vector3,
  frameRef: MutableRefObject<number | null>,
) {
  const startPos = camera.position.clone();
  const startLook = controls.target.clone();
  const duration = 800;
  const startTime = Date.now();

  const tick = () => {
    const elapsed = Date.now() - startTime;
    const t = Math.min(elapsed / duration, 1);
    // Ease in-out cubic
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    camera.position.lerpVectors(startPos, targetPos, eased);
    controls.target.lerpVectors(startLook, targetLook, eased);
    controls.update();

    if (t < 1) {
      frameRef.current = requestAnimationFrame(tick);
    } else {
      frameRef.current = null;
    }
  };

  frameRef.current = requestAnimationFrame(tick);
}

export default CameraController;
