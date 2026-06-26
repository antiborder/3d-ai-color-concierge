import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { useState, useEffect, useRef, useMemo } from 'react';
import '../../App.css';
import CameraController from './CameraController';
import FocusPlane from './FocusPlane';
import FocusLine from './FocusLine';
import Particles from './Particles';
import CubeWireframe from './CubeWireframe';
import CylinderEllipses from './CylinderEllipses';
import ColorCursor from './ColorCursor';
import HarmonyMarkers from './HarmonyMarkers';
import ColorBridgeLine from './ColorBridgeLine';
import sampleColors from '../../constants/sampleColors';
import {
  structureSize,
  cylinderHeight,
  cylinderRadius,
  getRgbPosition,
  rescaleHsl,
  cylindricalToCartesian,
  getHslPosition,
  getHsbPosition,
  getMunsellPosition,
  getLabPosition,
  getXyzPosition,
  getXyzChromaticityPosition,
  getXyChromaticityPosition,
} from '../../utils/colorSpacePositions';
import type { StructureProps } from '../../types/structure';

const cameraPosition: [number, number, number] = [0, 15, 0];

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
        if (props.spectral12ColorsEnabled && color.tag.includes('SPECTRAL12')) return true;
        if (props.japaneseColorsEnabled && color.tag.includes('JAPANESE')) return true;
        if (props.rgbGridColorsEnabled && color.tag.includes('RGB_GRID')) return true;
        return false;
      }),
    [
      props.cssColorsEnabled,
      props.materialColorsEnabled,
      props.spectral12ColorsEnabled,
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
    getMunsellPosition,
    getLabPosition,
    getXyzPosition,
    getXyzChromaticityPosition,
    getXyChromaticityPosition,
  };

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
            labBoxSize={{ x: structureSize, y: structureSize, z: structureSize }}
          />
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
