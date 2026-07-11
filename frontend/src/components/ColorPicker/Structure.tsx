import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { useState, useEffect, useRef, useMemo } from 'react';
import '../../App.css';
import CameraController from './CameraController';
import FocusPlane from './FocusPlane';
import FocusLine from './FocusLine';
import Particles from './Particles';
import CubeWireframe from './CubeWireframe';
import AnimatedWireframe from './AnimatedWireframe';
import CylinderEllipses from './CylinderEllipses';
import ColorCursor from './ColorCursor';
import HarmonyMarkers from './HarmonyMarkers';
import ColorBridgeLine from './ColorBridgeLine';
import AxisIndicators from './AxisIndicators';
import CylindricalAxisArrows from './CylindricalAxisArrows';
import FocusAxisArrows from './FocusAxisArrows';
import AiColorLabels from './AiColorLabels';
import type { AxisDef } from './FocusAxisArrows';
import sampleColors from '../../constants/sampleColors';
import {
  structureSize,
  cylinderHeight,
  cylinderRadius,
  labCylinderHeight,
  getRgbPosition,
  rescaleHsl,
  cylindricalToCartesian,
  getHslPosition,
  getHsbPosition,
  getMunsellPosition,
  getLchPosition,
  getLabPosition,
  getXyzPosition,
  getXyzChromaticityPosition,
  getXyChromaticityPosition,
  RGB_XYZ_ROTATION,
} from '../../utils/colorSpacePositions';

// Rotate a unit vector by the shared RGB/XYZ quaternion.
function rv(x: number, y: number, z: number): [number, number, number] {
  return new THREE.Vector3(x, y, z).applyQuaternion(RGB_XYZ_ROTATION).toArray() as [number, number, number];
}

const RGB_ARROWS: AxisDef[] = [
  { dir: rv(-1, 0, 0), label: 'R' },
  { dir: rv(0, -1, 0), label: 'G' },
  { dir: rv(0,  0, 1), label: 'B' },
];
const CMY_ARROWS: AxisDef[] = [
  { dir: rv(1,  0,  0), label: 'C' },
  { dir: rv(0,  1,  0), label: 'M' },
  { dir: rv(0,  0, -1), label: 'Y' },
];
const LAB_ARROWS: AxisDef[] = [
  { dir: [0, 0, 1], label: 'L' },
  { dir: [-Math.sin(Math.PI / 3), -Math.cos(Math.PI / 3), 0], label: 'a' },
  { dir: [Math.cos(Math.PI / 3), -Math.sin(Math.PI / 3), 0], label: 'b' },
];
const XYZ_ARROWS: AxisDef[] = [
  { dir: rv(-1, 0, 0), label: 'X' },
  { dir: rv(0, -1, 0), label: 'Y' },
  { dir: rv(0,  0, 1), label: 'Z' },
];
const xyz_ARROWS: AxisDef[] = [
  { dir: rv(-1, 0, 0), label: 'x' },
  { dir: rv(0, -1, 0), label: 'y' },
  { dir: rv(0,  0, 1), label: 'z' },
];
const xy_ARROWS: AxisDef[] = [
  { dir: rv(-1, 0, 0), label: 'x' },
  { dir: rv(0, -1, 0), label: 'y' },
];
import type { StructureProps } from '../../types/structure';
import type { ColorSpace } from '../../types/color';

const cameraPosition: [number, number, number] = [0, 15, 0];

function resolveLabelPositions(
  labels: StructureProps['aiColorLabels'],
  shape: ColorSpace,
  getRgbPosition: (r: number, g: number, b: number) => [number, number, number],
  getHslPosition: (r: number, g: number, b: number) => [number, number, number],
  getHsbPosition: (r: number, g: number, b: number) => [number, number, number],
  getMunsellPosition: (r: number, g: number, b: number) => [number, number, number],
  getLabPosition: (r: number, g: number, b: number) => [number, number, number],
  getXyzPosition: (r: number, g: number, b: number) => [number, number, number],
  getXyzChromaticityPosition: (r: number, g: number, b: number) => [number, number, number],
  getXyChromaticityPosition: (r: number, g: number, b: number) => [number, number, number],
): [number, number, number][] {
  if (!labels || labels.length === 0) return [];
  return labels.map(({ r, g, b }) => {
    if (shape === 'HSL') return getHslPosition(r, g, b);
    if (shape === 'HSB') return getHsbPosition(r, g, b);
    if (shape === 'LCH') return getMunsellPosition(r, g, b);
    if (shape === 'Lab') return getLabPosition(r, g, b);
    if (shape === 'XYZ') return getXyzPosition(r, g, b);
    if (shape === 'xyz') return getXyzChromaticityPosition(r, g, b);
    if (shape === 'xy') return getXyChromaticityPosition(r, g, b);
    return getRgbPosition(r, g, b);
  });
}

const Structure = (props: StructureProps) => {
  const [frameVisible, setFrameVisible] = useState(true);
  const [displayShape, setDisplayShape] = useState(props.shape);
  const prevShapeRef = useRef(props.shape);

  useEffect(() => {
    if (prevShapeRef.current !== props.shape) {
      const showNewFrameDelay = setTimeout(() => {
        setDisplayShape(props.shape);
        setFrameVisible(true);
      }, 500);
      prevShapeRef.current = props.shape;
      return () => clearTimeout(showNewFrameDelay);
    }
  }, [props.shape]);

  const filteredColors = useMemo(
    () =>
      sampleColors.filter((color) => {
        if (props.cssColorsEnabled && color.tag.includes('CSS')) return true;
        if (props.materialColorsEnabled && color.tag.includes('MATERIAL')) return true;
        if (props.japaneseColorsEnabled && color.tag.includes('JAPANESE')) return true;
        if (props.rgbGridColorsEnabled && color.tag.includes('RGB_GRID')) return true;
        return false;
      }),
    [
      props.cssColorsEnabled,
      props.materialColorsEnabled,
      props.japaneseColorsEnabled,
      props.rgbGridColorsEnabled,
    ]
  );

  const backgroundColor = useMemo(() => {
    const r = Math.round(props.focusR).toString(16).padStart(2, '0');
    const g = Math.round(props.focusG).toString(16).padStart(2, '0');
    const b = Math.round(props.focusB).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }, [props.focusR, props.focusG, props.focusB]);

  const positionProps = {
    getRgbPosition,
    getHslPosition,
    getHsbPosition,
    getMunsellPosition: getLchPosition,
    getLabPosition,
    getXyzPosition,
    getXyzChromaticityPosition,
    getXyChromaticityPosition,
  };

  const aiLabelPositions = useMemo(
    () =>
      resolveLabelPositions(
        props.aiColorLabels,
        props.shape,
        getRgbPosition,
        getHslPosition,
        getHsbPosition,
        getLchPosition,
        getLabPosition,
        getXyzPosition,
        getXyzChromaticityPosition,
        getXyChromaticityPosition,
      ),
    [props.aiColorLabels, props.shape],
  );

  const harmonyColorPositions = useMemo(
    () => {
      const harmonyPositions = resolveLabelPositions(
        props.harmonyColors as any,
        props.shape,
        getRgbPosition,
        getHslPosition,
        getHsbPosition,
        getLchPosition,
        getLabPosition,
        getXyzPosition,
        getXyzChromaticityPosition,
        getXyChromaticityPosition,
      );
      const focusPosition = resolveLabelPositions(
        [{ r: props.focusR, g: props.focusG, b: props.focusB }] as any,
        props.shape,
        getRgbPosition,
        getHslPosition,
        getHsbPosition,
        getLchPosition,
        getLabPosition,
        getXyzPosition,
        getXyzChromaticityPosition,
        getXyChromaticityPosition,
      );
      return [...harmonyPositions, ...focusPosition];
    },
    [props.harmonyColors, props.shape, props.focusR, props.focusG, props.focusB],
  );

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
          rotateCameraRef={props.rotateCameraRef}
          resetCameraZoomSignal={props.resetCameraZoomSignal}
          harmonyZoomSignal={props.harmonyZoomSignal}
          harmonyColorPositions={harmonyColorPositions}
          aiColorLabels={props.aiColorLabels}
          aiColorLabelPositions={aiLabelPositions}
        />
        <group rotation={[-Math.PI / 2, 0, 0]}>
          <Particles {...props} filteredColors={filteredColors} {...positionProps} />
          <ColorCursor {...props} {...positionProps} />
          {props.harmonyColors && props.harmonyColors.length > 0 && (
            <HarmonyMarkers
              harmonyColors={props.harmonyColors}
              shape={props.shape}
              focusL={props.focusL}
              {...positionProps}
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
              {...positionProps}
            />
          )}
          <CubeWireframe
            shape={displayShape}
            structureSize={structureSize}
            visible={frameVisible}
            labBoxSize={{ x: labCylinderHeight, y: labCylinderHeight, z: labCylinderHeight }}
            focusL={props.focusL}
          />
          <AnimatedWireframe shape={props.shape} visible={frameVisible} />
          {props.shape === 'LCH' && (
            <CylinderEllipses
              shape="LCH"
              cylinderRadius={cylinderRadius}
              cylinderHeight={cylinderHeight}
              visible={frameVisible}
            />
          )}
          <AxisIndicators shape={displayShape} focusL={props.focusL} />
          {props.shape === 'HSB' && (
            <CylindricalAxisArrows
              focusR={props.focusR}
              focusG={props.focusG}
              focusB={props.focusB}
              focusH={props.focusH}
              focusL={props.focusL}
              getPosition={getHsbPosition}
              labels={{ h: 'H', s: 'S', l: 'B' }}
            />
          )}
          {props.shape === 'HSL' && (
            <CylindricalAxisArrows
              focusR={props.focusR}
              focusG={props.focusG}
              focusB={props.focusB}
              focusH={props.focusH}
              focusL={props.focusL}
              getPosition={getHslPosition}
              labels={{ h: 'H', s: 'S', l: 'L' }}
            />
          )}
          {props.shape === 'LCH' && (
            <CylindricalAxisArrows
              focusR={props.focusR}
              focusG={props.focusG}
              focusB={props.focusB}
              focusH={props.focusH}
              focusL={props.focusL}
              getPosition={getLchPosition}
              labels={{ h: 'H', s: 'C', l: 'L' }}
            />
          )}
          {(props.shape === 'RGB' || props.shape === 'CMYK') && (
            <FocusAxisArrows
              focusR={props.focusR}
              focusG={props.focusG}
              focusB={props.focusB}
              focusL={props.focusL}
              getPosition={getRgbPosition}
              axes={props.shape === 'CMYK' ? CMY_ARROWS : RGB_ARROWS}
            />
          )}
          {props.shape === 'Lab' && (
            <FocusAxisArrows
              focusR={props.focusR}
              focusG={props.focusG}
              focusB={props.focusB}
              focusL={props.focusL}
              getPosition={getLabPosition}
              axes={LAB_ARROWS}
            />
          )}
          {props.shape === 'XYZ' && (
            <FocusAxisArrows
              focusR={props.focusR}
              focusG={props.focusG}
              focusB={props.focusB}
              focusL={props.focusL}
              getPosition={getXyzPosition}
              axes={XYZ_ARROWS}
            />
          )}
          {props.shape === 'xyz' && (
            <FocusAxisArrows
              focusR={props.focusR}
              focusG={props.focusG}
              focusB={props.focusB}
              focusL={props.focusL}
              getPosition={getXyzChromaticityPosition}
              axes={xyz_ARROWS}
            />
          )}
          {props.shape === 'xy' && (
            <FocusAxisArrows
              focusR={props.focusR}
              focusG={props.focusG}
              focusB={props.focusB}
              focusL={props.focusL}
              getPosition={getXyChromaticityPosition}
              axes={xy_ARROWS}
            />
          )}
          {props.aiColorLabels && props.aiColorLabels.length > 0 && (
            <AiColorLabels
              labels={props.aiColorLabels}
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
        </group>
      </Canvas>
    </div>
  );
};

export default Structure;
