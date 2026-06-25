import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import convert from 'color-convert';
import { useState, useEffect, useRef, useMemo } from 'react';
import '../../App.css';
import CameraController from './CameraController';
import Focus from './Focus';
import FocusPlane from './FocusPlane';
import FocusLine from './FocusLine';
import Particles from './Particles';
import CubeWireframe from './CubeWireframe';
import CylinderEllipses from './CylinderEllipses';
import ColorCursor from './ColorCursor';
import HarmonyMarkers from './HarmonyMarkers';
import ColorBridgeLine from './ColorBridgeLine';
import sampleColors from '../../constants/sampleColors';
import { getMunsellHVC } from '../../utils/munsellUtils';
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
      -(r / 255 - 0.5) * structureSize,
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
      new THREE.Vector3(-1, -1, 1).normalize(),
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
      (h / 360) * (2 * Math.PI) - Math.PI / 12,
      (s / 100) * cylinderRadius,
      ((l - 50) / 100) * cylinderHeight,
    ];
  };

  const cylindricalToCartesian: CylindricalToCartesianFunction = (
    theta: number,
    radius: number,
    z: number
  ): [number, number, number] => {
    return [radius * Math.sin(theta), -radius * Math.cos(theta), z];
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

  const getHsbPosition: PositionFunction = (
    r: number,
    g: number,
    b: number
  ): [number, number, number] => {
    const [h, s, v] = convert.rgb.hsv([Math.round(r), Math.round(g), Math.round(b)]);
    const [theta, radius, z] = rescaleHsl(h, s, v);
    return cylindricalToCartesian(theta, radius, z);
  };

  const getMunsellPosition: PositionFunction = (
    r: number,
    g: number,
    b: number
  ): [number, number, number] => {
    const { hueNum, value, chroma } = getMunsellHVC(r, g, b);
    const theta = hueNum !== null ? (hueNum / 100) * 2 * Math.PI : 0;
    const radius = hueNum !== null ? (chroma / 20) * cylinderRadius : 0;
    const z = (value / 10 - 0.5) * cylinderHeight;
    return cylindricalToCartesian(theta, radius, z);
  };

  // Lab: a* maps to y (same red direction as LCH), b* maps to x (same yellow direction as LCH)
  // Scale: ±128 Lab units → ±structureSize/2, matching the RGB cube edge length
  const getLabPosition: PositionFunction = (
    r: number,
    g: number,
    b: number
  ): [number, number, number] => {
    const toLinear = (c: number) => {
      const s = c / 255;
      return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    const rl = toLinear(r), gl = toLinear(g), bl = toLinear(b);
    const Xn = (rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375) / 0.95047;
    const Yn =  rl * 0.2126729 + gl * 0.7151522 + bl * 0.0721750;
    const Zn = (rl * 0.0193339 + gl * 0.1191920 + bl * 0.9503041) / 1.08883;
    const f = (t: number) => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
    const fx = f(Xn), fy = f(Yn), fz = f(Zn);
    const L = 116 * fy - 16;
    const a = 500 * (fx - fy);
    const bLab = 200 * (fy - fz);
    // Map each axis so its sRGB gamut boundary aligns with the frame edge.
    // Ranges measured by exhaustive sRGB sampling:
    //   a*: [-85.41, +97.36]  center=+5.98  half-range=91.39
    //   b*: [-106.90, +93.63] center=-6.64  half-range=100.27
    //   L*: [0, 100]          center=50     half-range=50
    const half = structureSize / 2;
    const x = (bLab - (-6.64)) / 100.27 * half;     // b* → x
    const y = -((a  -   5.98)  /  91.39 * half);   // a* → y (negated to match RGB orientation)
    const z = (L / 100 - 0.5) * structureSize;     // L* → z (unchanged)
    return [x, y, z];
  };

  const getXyzPosition: PositionFunction = (r: number, g: number, b: number): [number, number, number] => {
    const toLinear = (c: number) => {
      const s = c / 255;
      return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    const rl = toLinear(r), gl = toLinear(g), bl = toLinear(b);
    const X = 0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl;
    const Y = 0.2126729 * rl + 0.7151522 * gl + 0.0721750 * bl;
    const Z = 0.0193339 * rl + 0.1191920 * gl + 0.9503041 * bl;
    const tilt = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(-1, -1, 1).normalize(),
      new THREE.Vector3(0, 0, 1)
    );
    const zRot = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(1, 0, 0).normalize(),
      new THREE.Vector3(0, 0.77, 0)
    );
    return new THREE.Vector3(
      -(X / 0.95047  - 0.5) * structureSize,
      -(Y / 1.0      - 0.5) * structureSize,
      (Z / 1.08883  - 0.5) * structureSize,
    ).applyQuaternion(zRot.multiply(tilt)).toArray() as [number, number, number];
  };

  const getXyzChromaticityPosition: PositionFunction = (r: number, g: number, b: number): [number, number, number] => {
    const toLinear = (c: number) => { const s = c/255; return s<=0.04045 ? s/12.92 : Math.pow((s+0.055)/1.055, 2.4); };
    const rl=toLinear(r), gl=toLinear(g), bl=toLinear(b);
    const X=0.4124564*rl+0.3575761*gl+0.1804375*bl;
    const Y=0.2126729*rl+0.7151522*gl+0.0721750*bl;
    const Z=0.0193339*rl+0.1191920*gl+0.9503041*bl;
    const sum = X+Y+Z;
    if (sum < 1e-10) return [0,0,0];
    // Center at 0.5 and use structureSize — same reference frame as XYZ bounding cube
    const xc = X/sum - 0.5, yc = Y/sum - 0.5, zc = Z/sum - 0.5;
    const tilt = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(-1,-1,1).normalize(), new THREE.Vector3(0,0,1)
    );
    const zRot = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(1,0,0).normalize(), new THREE.Vector3(0,0.77,0)
    );
    return new THREE.Vector3(-xc*structureSize, -yc*structureSize, zc*structureSize).applyQuaternion(zRot.multiply(tilt)).toArray() as [number,number,number];
  };

  const getXyChromaticityPosition: PositionFunction = (r: number, g: number, b: number): [number, number, number] => {
    const toLinear = (c: number) => { const s = c/255; return s<=0.04045 ? s/12.92 : Math.pow((s+0.055)/1.055, 2.4); };
    const rl=toLinear(r), gl=toLinear(g), bl=toLinear(b);
    const X=0.4124564*rl+0.3575761*gl+0.1804375*bl;
    const Y=0.2126729*rl+0.7151522*gl+0.0721750*bl;
    const Z=0.0193339*rl+0.1191920*gl+0.9503041*bl;
    const sum = X+Y+Z;
    if (sum < 1e-10) return [0,0,0];
    const xc = X/sum - 0.5, yc = Y/sum - 0.5;
    const tilt = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(-1,-1,1).normalize(), new THREE.Vector3(0,0,1)
    );
    const zRot = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(1,0,0).normalize(), new THREE.Vector3(0,0.77,0)
    );
    // z_c=0 face of the xyz cube: zc_centered = 0 - 0.5 = -0.5
    return new THREE.Vector3(-xc*structureSize, -yc*structureSize, -0.5*structureSize).applyQuaternion(zRot.multiply(tilt)).toArray() as [number,number,number];
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
      if (props.spectral12ColorsEnabled && color.tag.includes('SPECTRAL12')) {
        return true;
      }
      if (props.japaneseColorsEnabled && color.tag.includes('JAPANESE')) {
        return true;
      }
      if (props.rgbGridColorsEnabled && color.tag.includes('RGB_GRID')) {
        return true;
      }
      return false;
    });
  }, [
    props.cssColorsEnabled,
    props.materialColorsEnabled,
    props.spectral12ColorsEnabled,
    props.japaneseColorsEnabled,
    props.rgbGridColorsEnabled,
  ]);

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
          getHsbPosition={getHsbPosition}
        />
        <group rotation={[-Math.PI / 2, 0, 0]}>
          <Particles
            {...props}
            filteredColors={filteredColors}
            getRgbPosition={getRgbPosition}
            getHslPosition={getHslPosition}
            getHsbPosition={getHsbPosition}
            getMunsellPosition={getMunsellPosition}
            getLabPosition={getLabPosition}
            getXyzPosition={getXyzPosition}
            getXyzChromaticityPosition={getXyzChromaticityPosition}
            getXyChromaticityPosition={getXyChromaticityPosition}
          />
          {/* <Focus
            {...props}
            getRgbPosition={getRgbPosition}
            getHslPosition={getHslPosition}
            getHsbPosition={getHsbPosition}
          /> */}
          <ColorCursor
            {...props}
            getRgbPosition={getRgbPosition}
            getHslPosition={getHslPosition}
            getHsbPosition={getHsbPosition}
            getMunsellPosition={getMunsellPosition}
            getLabPosition={getLabPosition}
            getXyzPosition={getXyzPosition}
            getXyzChromaticityPosition={getXyzChromaticityPosition}
            getXyChromaticityPosition={getXyChromaticityPosition}
          />
          {props.harmonyColors && props.harmonyColors.length > 0 && (
            <HarmonyMarkers
              harmonyColors={props.harmonyColors}
              shape={props.shape}
              focusL={props.focusL}
              getRgbPosition={getRgbPosition}
              getHslPosition={getHslPosition}
              getHsbPosition={getHsbPosition}
              getMunsellPosition={getMunsellPosition}
              getLabPosition={getLabPosition}
              getXyzPosition={getXyzPosition}
              getXyzChromaticityPosition={getXyzChromaticityPosition}
              getXyChromaticityPosition={getXyChromaticityPosition}
              onColorSelect={props.onParticleClick}
            />
          )}
          {props.isTwoDPickerOpen && (
            <>
              <FocusPlane
                {...props}
                getRgbPosition={getRgbPosition}
                getHslPosition={getHslPosition}
                getHsbPosition={getHsbPosition}
                rescaleHsl={rescaleHsl}
                cylindricalToCartesian={cylindricalToCartesian}
                cylinderRadius={cylinderRadius}
                cylinderHeight={cylinderHeight}
              />
              <FocusLine
                {...props}
                getRgbPosition={getRgbPosition}
                getHslPosition={getHslPosition}
                getHsbPosition={getHsbPosition}
                rescaleHsl={rescaleHsl}
                cylindricalToCartesian={cylindricalToCartesian}
                cylinderRadius={cylinderRadius}
                cylinderHeight={cylinderHeight}
              />
            </>
          )}
          {props.isBridgeOpen && props.bridgeColorA && props.bridgeColorB && (
            <ColorBridgeLine
              colorA={props.bridgeColorA}
              colorB={props.bridgeColorB}
              shape={props.shape}
              getRgbPosition={getRgbPosition}
              getHslPosition={getHslPosition}
              getHsbPosition={getHsbPosition}
              getMunsellPosition={getMunsellPosition}
              getLabPosition={getLabPosition}
              getXyzPosition={getXyzPosition}
              getXyzChromaticityPosition={getXyzChromaticityPosition}
              getXyChromaticityPosition={getXyChromaticityPosition}
            />
          )}
          {/* RGB/CMYK/Lab用の外枠 */}
          <CubeWireframe
            shape={displayShape}
            structureSize={structureSize}
            visible={frameVisible}
            labBoxSize={{ x: structureSize, y: structureSize, z: structureSize }}
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
