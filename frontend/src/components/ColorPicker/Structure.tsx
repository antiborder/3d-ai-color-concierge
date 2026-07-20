import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { useState, useEffect, useRef, useMemo } from 'react';
import convert from 'color-convert';
import '../../App.css';
import { rgbToLab, labToRgb, rgbToXYZ, xyzToRgb, computeGamutRange, xyzGamutRange } from '../../utils/gamutUtils';
import { getMunsellHVC, munsellHVCtoRgb } from '../../utils/munsellUtils';
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

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

const RGB_ARROWS: AxisDef[] = [
  { dir: rv(-1, 0, 0), label: 'R', getDragRgb: (r, g, b, nd) => [clamp(Math.round(r + nd * 255), 0, 255), g, b] },
  { dir: rv(0, -1, 0), label: 'G', getDragRgb: (r, g, b, nd) => [r, clamp(Math.round(g + nd * 255), 0, 255), b] },
  { dir: rv(0,  0, 1), label: 'B', getDragRgb: (r, g, b, nd) => [r, g, clamp(Math.round(b + nd * 255), 0, 255)] },
];
const CMY_ARROWS: AxisDef[] = [
  { dir: rv(1,  0,  0), label: 'C', getDragRgb: (r, g, b, nd) => [clamp(Math.round(r - nd * 255), 0, 255), g, b] },
  { dir: rv(0,  1,  0), label: 'M', getDragRgb: (r, g, b, nd) => [r, clamp(Math.round(g - nd * 255), 0, 255), b] },
  { dir: rv(0,  0, -1), label: 'Y', getDragRgb: (r, g, b, nd) => [r, g, clamp(Math.round(b - nd * 255), 0, 255)] },
];
const LAB_ARROWS: AxisDef[] = [
  { dir: [0, 0, 1], label: 'L', getDragRgb: (r, g, b, nd) => {
    const [L, a, bv] = rgbToLab(r, g, b);
    const [lo, hi] = computeGamutRange('L', L, a, bv, 0, 100);
    return labToRgb(clamp(L + nd * 100, lo, hi), a, bv);
  }},
  { dir: [-Math.sin(Math.PI / 3), -Math.cos(Math.PI / 3), 0], label: 'a', getDragRgb: (r, g, b, nd) => {
    const [L, a, bv] = rgbToLab(r, g, b);
    const [lo, hi] = computeGamutRange('a', L, a, bv, -128, 127);
    return labToRgb(L, clamp(a + nd * 200, lo, hi), bv);
  }},
  { dir: [Math.cos(Math.PI / 3), -Math.sin(Math.PI / 3), 0], label: 'b', getDragRgb: (r, g, b, nd) => {
    const [L, a, bv] = rgbToLab(r, g, b);
    const [lo, hi] = computeGamutRange('b', L, a, bv, -128, 127);
    return labToRgb(L, a, clamp(bv + nd * 200, lo, hi));
  }},
];
const XYZ_ARROWS: AxisDef[] = [
  { dir: rv(-1, 0, 0), label: 'X', getDragRgb: (r, g, b, nd) => {
    const [X, Y, Z] = rgbToXYZ(r, g, b);
    const [lo, hi] = xyzGamutRange('X', X, Y, Z);
    return xyzToRgb(clamp(X + nd * 0.95047, lo, hi), Y, Z);
  }},
  { dir: rv(0, -1, 0), label: 'Y', getDragRgb: (r, g, b, nd) => {
    const [X, Y, Z] = rgbToXYZ(r, g, b);
    const [lo, hi] = xyzGamutRange('Y', X, Y, Z);
    return xyzToRgb(X, clamp(Y + nd * 1.0, lo, hi), Z);
  }},
  { dir: rv(0,  0, 1), label: 'Z', getDragRgb: (r, g, b, nd) => {
    const [X, Y, Z] = rgbToXYZ(r, g, b);
    const [lo, hi] = xyzGamutRange('Z', X, Y, Z);
    return xyzToRgb(X, Y, clamp(Z + nd * 1.08883, lo, hi));
  }},
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

// Drag functions for cylindrical spaces: [H, S/C, L/B/V]
type DragFn = (r: number, g: number, b: number, nd: number) => [number, number, number];

const HSB_DRAG_FNS: [DragFn, DragFn, DragFn] = [
  (r, g, b, nd) => {
    const [h, s, v] = convert.rgb.hsv([Math.round(r), Math.round(g), Math.round(b)]);
    return convert.hsv.rgb([((h + nd * 360) % 360 + 360) % 360, s, v]) as [number, number, number];
  },
  (r, g, b, nd) => {
    const [h, s, v] = convert.rgb.hsv([Math.round(r), Math.round(g), Math.round(b)]);
    return convert.hsv.rgb([h, clamp(s + nd * 100, 0, 100), v]) as [number, number, number];
  },
  (r, g, b, nd) => {
    const [h, s, v] = convert.rgb.hsv([Math.round(r), Math.round(g), Math.round(b)]);
    return convert.hsv.rgb([h, s, clamp(v + nd * 100, 0, 100)]) as [number, number, number];
  },
];

const HSL_DRAG_FNS: [DragFn, DragFn, DragFn] = [
  (r, g, b, nd) => {
    const [h, s, l] = convert.rgb.hsl([Math.round(r), Math.round(g), Math.round(b)]);
    return convert.hsl.rgb([((h + nd * 360) % 360 + 360) % 360, s, l]) as [number, number, number];
  },
  (r, g, b, nd) => {
    const [h, s, l] = convert.rgb.hsl([Math.round(r), Math.round(g), Math.round(b)]);
    return convert.hsl.rgb([h, clamp(s + nd * 100, 0, 100), l]) as [number, number, number];
  },
  (r, g, b, nd) => {
    const [h, s, l] = convert.rgb.hsl([Math.round(r), Math.round(g), Math.round(b)]);
    return convert.hsl.rgb([h, s, clamp(l + nd * 100, 0, 100)]) as [number, number, number];
  },
];

const LCH_DRAG_FNS: [DragFn, DragFn, DragFn] = [
  (r, g, b, nd) => {
    const { hueNum, value, chroma } = getMunsellHVC(r, g, b);
    const newH = ((( hueNum ?? 0) + nd * 100) % 100 + 100) % 100;
    return munsellHVCtoRgb(newH, value, chroma);
  },
  (r, g, b, nd) => {
    const { hueNum, value, chroma } = getMunsellHVC(r, g, b);
    return munsellHVCtoRgb(hueNum, value, clamp(chroma + nd * 20, 0, 20));
  },
  (r, g, b, nd) => {
    const { hueNum, value, chroma } = getMunsellHVC(r, g, b);
    return munsellHVCtoRgb(hueNum, clamp(value + nd * 10, 0, 10), chroma);
  },
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
              getDragFns={HSB_DRAG_FNS}
              onPreviewRgb={props.onPreviewRgb}
              onClearPreviewRgb={props.onClearPreviewRgb}
              onCommitRgb={props.onCommitRgb}
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
              getDragFns={HSL_DRAG_FNS}
              onPreviewRgb={props.onPreviewRgb}
              onClearPreviewRgb={props.onClearPreviewRgb}
              onCommitRgb={props.onCommitRgb}
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
              getDragFns={LCH_DRAG_FNS}
              onPreviewRgb={props.onPreviewRgb}
              onClearPreviewRgb={props.onClearPreviewRgb}
              onCommitRgb={props.onCommitRgb}
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
              onPreviewRgb={props.onPreviewRgb}
              onClearPreviewRgb={props.onClearPreviewRgb}
              onCommitRgb={props.onCommitRgb}
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
              onPreviewRgb={props.onPreviewRgb}
              onClearPreviewRgb={props.onClearPreviewRgb}
              onCommitRgb={props.onCommitRgb}
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
              onPreviewRgb={props.onPreviewRgb}
              onClearPreviewRgb={props.onClearPreviewRgb}
              onCommitRgb={props.onCommitRgb}
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
