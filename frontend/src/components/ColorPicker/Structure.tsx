import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
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
import sampleColors from '../../constants/sampleColors';
import type {
  StructureProps,
  PositionFunction,
  RescaleHslFunction,
  CylindricalToCartesianFunction,
} from '../../types/structure';

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
      setFrameVisible(false);

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
        <color attach="background" args={['#C3C3C3']} />
        <ambientLight color="#ffffff" intensity={1} />
        <OrbitControls />
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
