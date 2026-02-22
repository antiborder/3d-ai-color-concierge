import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import convert from 'color-convert';
import { useState, useEffect, useRef, useMemo } from 'react';
import '../../App.css';
import Focus from './Focus';
import FocusPlane from './FocusPlane';
import FocusLine from './FocusLine';
import Particles from './Particles';
import CubeWireframe from './CubeWireframe';
import CylinderEllipses from './CylinderEllipses';
import ColorCursor from './ColorCursor';
import sampleColors from '../../constants/sampleColors';
import type {
  StructureProps,
  PositionFunction,
  RescaleHslFunction,
  CylindricalToCartesianFunction,
} from '../../types/structure';

// OrbitControlsの参照を取得してカメラを回転させるコンポーネント
const CameraController = ({
  r,
  g,
  b,
  shape,
  getRgbPosition,
  getHslPosition,
  getHsvPosition,
}: {
  r: number;
  g: number;
  b: number;
  shape: string;
  getRgbPosition: PositionFunction;
  getHslPosition: PositionFunction;
  getHsvPosition: PositionFunction;
}) => {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  const prevColorRef = useRef<{ r: number; g: number; b: number } | null>(null);
  const isAnimatingRef = useRef(false);

  useEffect(() => {
    // 色が変更された時のみカメラを回転
    const colorChanged =
      !prevColorRef.current ||
      prevColorRef.current.r !== r ||
      prevColorRef.current.g !== g ||
      prevColorRef.current.b !== b;

    if (colorChanged && !isAnimatingRef.current) {
      // 色の3D位置を取得
      let colorPosition: [number, number, number];
      if (shape === 'RGB' || shape === 'CMYK') {
        colorPosition = getRgbPosition(r, g, b);
      } else if (shape === 'HSL') {
        colorPosition = getHslPosition(r, g, b);
      } else {
        colorPosition = getHsvPosition(r, g, b);
      }

      // 色の位置をベクトルに変換
      const colorVector = new THREE.Vector3(...colorPosition);
      const origin = new THREE.Vector3(0, 0, 0);

      // 原点から色への方向ベクトル
      const direction = colorVector.clone().sub(origin).normalize();

      // OrbitControlsを使ってカメラを回転
      if (controlsRef.current && controlsRef.current.object) {
        isAnimatingRef.current = true;

        // 現在のカメラ位置を取得
        const currentPosition = camera.position.clone();
        const currentTarget = controlsRef.current.target.clone();

        // 色の位置がカメラに最も近くなる角度を計算
        // 球面座標に変換（OrbitControlsは球面座標系を使用）
        // azimuth: 水平角度（-πからπ、または0から2π）
        // polar: 垂直角度（0からπ）
        const azimuth = Math.atan2(direction.x, direction.z);
        const polar = Math.acos(Math.max(-1, Math.min(1, direction.y)));

        // アニメーションでスムーズに回転
        let startAzimuth: number;
        let startPolar: number;

        // OrbitControlsのAPIを確認して使用
        if (
          typeof controlsRef.current.getAzimuthalAngle === 'function' &&
          typeof controlsRef.current.getPolarAngle === 'function'
        ) {
          startAzimuth = controlsRef.current.getAzimuthalAngle();
          startPolar = controlsRef.current.getPolarAngle();
        } else {
          // フォールバック: 現在のカメラ位置から角度を計算
          const toCamera = currentPosition.clone().sub(currentTarget).normalize();
          startAzimuth = Math.atan2(toCamera.x, toCamera.z);
          startPolar = Math.acos(Math.max(-1, Math.min(1, toCamera.y)));
        }

        const duration = 1000; // 1秒
        const startTime = Date.now();

        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          // イージング関数（ease-in-out）
          const eased =
            progress < 0.5
              ? 2 * progress * progress
              : 1 - Math.pow(-2 * progress + 2, 2) / 2;

          // 角度を補間
          let newAzimuth = startAzimuth + (azimuth - startAzimuth) * eased;
          let newPolar = startPolar + (polar - startPolar) * eased;

          // 角度の正規化
          newAzimuth = ((newAzimuth % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
          newPolar = Math.max(0.1, Math.min(Math.PI - 0.1, newPolar)); // 極端な角度を避ける

          // OrbitControlsのAPIを使用
          if (
            typeof controlsRef.current.setAzimuthalAngle === 'function' &&
            typeof controlsRef.current.setPolarAngle === 'function'
          ) {
            controlsRef.current.setAzimuthalAngle(newAzimuth);
            controlsRef.current.setPolarAngle(newPolar);
          } else {
            // フォールバック: カメラ位置を直接計算
            const distance = currentPosition.length();
            const newPosition = new THREE.Vector3(
              distance * Math.sin(newPolar) * Math.sin(newAzimuth),
              distance * Math.cos(newPolar),
              distance * Math.sin(newPolar) * Math.cos(newAzimuth)
            );
            camera.position.copy(newPosition);
            camera.lookAt(currentTarget);
            controlsRef.current.update();
          }

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
  }, [r, g, b, shape, getRgbPosition, getHslPosition, getHsvPosition, camera]);

  return <OrbitControls ref={controlsRef} />;
};

const Structure = (props: StructureProps) => {
  const cameraPosition: [number, number, number] = [0, 15, 0]; // カメラの位置
  const structureSize = 9;
  const sizeRatio = 0.7;
  const cylinderHeight = structureSize * sizeRatio;
  const cylinderRadius = structureSize * sizeRatio;

  // 外枠の表示状態を管理
  // 変形の順番: 古い枠が消える → 色空間が変形する → 新しい枠が表示される
  const [frameVisible, setFrameVisible] = useState(true);
  const [displayShape, setDisplayShape] = useState(props.shape); // 表示に使うshape
  const prevShapeRef = useRef(props.shape);

  useEffect(() => {
    // shapeが変更された場合
    if (prevShapeRef.current !== props.shape) {
      // 1. 古い枠が消える（即座にframeVisibleをfalseにする）
      // setFrameVisible(false);

      // 2. 色空間が変形する（Particlesのアニメーションが開始される、500ms）
      // 3. 新しい枠が表示される（500ms後に新しいshapeで枠を表示）
      const showNewFrameDelay = setTimeout(() => {
        setDisplayShape(props.shape); // 新しいshapeを設定
        setFrameVisible(true); // 新しい枠を表示
      }, 500); // Particlesのアニメーション完了後に新しい枠を表示

      prevShapeRef.current = props.shape;

      return () => {
        clearTimeout(showNewFrameDelay);
      };
    }
  }, [props.shape]);

  const rescaleRgb = (r: number, g: number, b: number): [number, number, number] => {
    return [
      (r / 255 - 0.5) * structureSize,
      (-g / 255 + 0.5) * structureSize,
      (b / 255 - 0.5) * structureSize,
    ];
  };

  const getRgbPosition: PositionFunction = (
    r: number,
    g: number,
    b: number
  ): [number, number, number] => {
    const tiltRotationQuaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(1, -1, 1).normalize(),
      new THREE.Vector3(0, 0, 1)
    );
    const zRotationQuaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(1, 0, 0).normalize(),
      new THREE.Vector3(0, 0.77, 0)
    );

    const rotationQuaternion = zRotationQuaternion.multiply(tiltRotationQuaternion);
    return new THREE.Vector3(...rescaleRgb(r, g, b))
      .applyQuaternion(rotationQuaternion)
      .toArray() as [number, number, number];
  };

  const rescaleHsl: RescaleHslFunction = (
    h: number,
    s: number,
    l: number
  ): [number, number, number] => {
    return [
      (h / 360) * (2 * Math.PI),
      (s / 100) * cylinderRadius,
      ((l - 50) / 100) * cylinderHeight,
    ];
  };

  const cylindricalToCartesian: CylindricalToCartesianFunction = (
    theta: number,
    radius: number,
    z: number
  ): [number, number, number] => {
    return [radius * Math.sin(theta), radius * Math.cos(theta), z];
  };

  const getHslPosition: PositionFunction = (
    r: number,
    g: number,
    b: number
  ): [number, number, number] => {
    const [h, s, l] = convert.rgb.hsl([Math.round(r), Math.round(g), Math.round(b)]);
    const [theta, radius, z] = rescaleHsl(h, s, l);
    return cylindricalToCartesian(theta, radius, z);
  };

  const getHsvPosition: PositionFunction = (
    r: number,
    g: number,
    b: number
  ): [number, number, number] => {
    const [h, s, v] = convert.rgb.hsv([Math.round(r), Math.round(g), Math.round(b)]);
    const [theta, radius, z] = rescaleHsl(h, s, v);
    return cylindricalToCartesian(theta, radius, z);
  };

  // Filter colors based on enabled groups
  const filteredColors = useMemo(() => {
    return sampleColors.filter((color) => {
      if (props.cssColorsEnabled && color.tag.includes('CSS')) {
        return true;
      }
      if (props.materialColorsEnabled && color.tag.includes('MATERIAL')) {
        return true;
      }
      if (props.japaneseColorsEnabled && color.tag.includes('JAPANESE')) {
        return true;
      }
      return false;
    });
  }, [props.cssColorsEnabled, props.materialColorsEnabled, props.japaneseColorsEnabled]);

  // 選択された色を16進数に変換して背景色として使用
  const backgroundColor = useMemo(() => {
    const r = Math.round(props.focusR).toString(16).padStart(2, '0');
    const g = Math.round(props.focusG).toString(16).padStart(2, '0');
    const b = Math.round(props.focusB).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }, [props.focusR, props.focusG, props.focusB]);

  return (
    <div>
      <Canvas
        camera={{ position: cameraPosition }}
        style={{ height: '120vh', width: '120vw' }}
        flat
        onCreated={({ gl }) => {
          // 色見本の表示なので、映画的なトーンマッピングを無効化して
          // 入力HEX(#RRGGBB)が見た目として素直に出るようにする。
          gl.toneMapping = THREE.NoToneMapping;
          gl.toneMappingExposure = 1;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
      >
        <color attach="background" args={[backgroundColor]} />
        <ambientLight color="#ffffff" intensity={1} />
        <CameraController
          r={props.focusR}
          g={props.focusG}
          b={props.focusB}
          shape={props.shape}
          getRgbPosition={getRgbPosition}
          getHslPosition={getHslPosition}
          getHsvPosition={getHsvPosition}
        />
        <group rotation={[-Math.PI / 2, 0, 0]}>
          <Particles
            {...props}
            filteredColors={filteredColors}
            getRgbPosition={getRgbPosition}
            getHslPosition={getHslPosition}
            getHsvPosition={getHsvPosition}
          />
          <Focus
            {...props}
            getRgbPosition={getRgbPosition}
            getHslPosition={getHslPosition}
            getHsvPosition={getHsvPosition}
          />
          <ColorCursor
            {...props}
            getRgbPosition={getRgbPosition}
            getHslPosition={getHslPosition}
            getHsvPosition={getHsvPosition}
          />
          <FocusPlane
            {...props}
            getRgbPosition={getRgbPosition}
            getHslPosition={getHslPosition}
            getHsvPosition={getHsvPosition}
            rescaleHsl={rescaleHsl}
            cylindricalToCartesian={cylindricalToCartesian}
            cylinderRadius={cylinderRadius}
            cylinderHeight={cylinderHeight}
          />
          <FocusLine
            {...props}
            getRgbPosition={getRgbPosition}
            getHslPosition={getHslPosition}
            getHsvPosition={getHsvPosition}
            rescaleHsl={rescaleHsl}
            cylindricalToCartesian={cylindricalToCartesian}
            cylinderRadius={cylinderRadius}
            cylinderHeight={cylinderHeight}
          />
          {/* RGB/CMYK用の立方体の外枠 */}
          <CubeWireframe
            shape={displayShape}
            structureSize={structureSize}
            visible={frameVisible}
          />
          {/* HSL/HSV用の円柱の上面・底面の円 */}
          <CylinderEllipses
            shape={displayShape}
            cylinderRadius={cylinderRadius}
            cylinderHeight={cylinderHeight}
            visible={frameVisible}
          />
        </group>
      </Canvas>
    </div>
  );
};

export default Structure;
