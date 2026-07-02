import React from 'react';
import * as THREE from 'three';
import Cylinder from './Cylinder';
import Quadrilateral from './Quadrilateral';
import Disc from './Disc';
import { hslCylinderHeight, hsbCylinderHeight, lchCylinderHeight, labCylinderHeight } from '../../utils/colorSpacePositions';
import type {
  StructureProps,
  PositionFunction,
  RescaleHslFunction,
  CylindricalToCartesianFunction,
} from '../../types/structure';

const STRUCTURE_SIZE = 9;

function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const rl = toLinear(r),
    gl = toLinear(g),
    bl = toLinear(b);
  const Xn = (rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375) / 0.95047;
  const Yn = rl * 0.2126729 + gl * 0.7151522 + bl * 0.072175;
  const Zn = (rl * 0.0193339 + gl * 0.119192 + bl * 0.9503041) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(Xn),
    fy = f(Yn),
    fz = f(Zn);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

function labToThreePosition(L: number, a: number, bLab: number): [number, number, number] {
  const half = STRUCTURE_SIZE / 2 * 1.184;
  return [
    (bLab / 100.27) * half,
    (a / 91.39) * half,
    (L / 100 - 0.5) * labCylinderHeight,
  ];
}

interface FocusPlaneProps extends StructureProps {
  getRgbPosition: PositionFunction;
  getHslPosition: PositionFunction;
  getHsbPosition: PositionFunction;
  rescaleHsl: RescaleHslFunction;
  cylindricalToCartesian: CylindricalToCartesianFunction;
  cylinderRadius: number;
  cylinderHeight: number;
}

const FocusPlane = (props: FocusPlaneProps) => {
  const rSquareCorners: [number, number, number][] = [
    props.getRgbPosition(props.focusR, 0, 0),
    props.getRgbPosition(props.focusR, 255, 0),
    props.getRgbPosition(props.focusR, 255, 255),
    props.getRgbPosition(props.focusR, 0, 255),
  ];

  const gSquareCorners: [number, number, number][] = [
    props.getRgbPosition(0, props.focusG, 0),
    props.getRgbPosition(255, props.focusG, 0),
    props.getRgbPosition(255, props.focusG, 255),
    props.getRgbPosition(0, props.focusG, 255),
  ];

  const bSquareCorners: [number, number, number][] = [
    props.getRgbPosition(0, 0, props.focusB),
    props.getRgbPosition(255, 0, props.focusB),
    props.getRgbPosition(255, 255, props.focusB),
    props.getRgbPosition(0, 255, props.focusB),
  ];

  const [rescaledH, rescaledS, rescaledL] = props.rescaleHsl(
    props.focusH,
    props.focusS,
    props.focusL
  );
  const rescaledHsvS = props.rescaleHsl(props.focusH, props.focusHsvS, props.focusV)[1];
  const rescaledV = props.rescaleHsl(props.focusH, props.focusHsvS, props.focusV)[2];

  return (
    <>
      {props.shape === 'RGB' && (
        <>
          {props.rgbMainElement === 'R' && <Quadrilateral {...props} points={rSquareCorners} />}
          {props.rgbMainElement === 'G' && <Quadrilateral {...props} points={gSquareCorners} />}
          {props.rgbMainElement === 'B' && <Quadrilateral {...props} points={bSquareCorners} />}
        </>
      )}
      {props.shape === 'CMYK' && (
        <>
          {props.cmykMainElement === 'C' && <Quadrilateral {...props} points={rSquareCorners} />}
          {props.cmykMainElement === 'M' && <Quadrilateral {...props} points={gSquareCorners} />}
          {props.cmykMainElement === 'Y' && <Quadrilateral {...props} points={bSquareCorners} />}
        </>
      )}

      {props.shape === 'HSL' && (() => {
        const rescaledL_hsl = ((props.focusL - 50) / 100) * hslCylinderHeight;
        return (
          <>
            {props.hslMainElement === 'H' && (
              // Triangle: equator-outer → top-tip → bottom-tip (degenerate quad p2=p3)
              <Quadrilateral
                {...props}
                points={[
                  props.cylindricalToCartesian(rescaledH, props.cylinderRadius, 0),
                  props.cylindricalToCartesian(rescaledH, 0, hslCylinderHeight / 2),
                  props.cylindricalToCartesian(rescaledH, 0, -hslCylinderHeight / 2),
                  props.cylindricalToCartesian(rescaledH, 0, -hslCylinderHeight / 2),
                ]}
              />
            )}
            <group rotation={[Math.PI / 2, 0, 0]}>
              {props.hslMainElement === 'S' && (
                <Disc
                  {...props}
                  position={[0, rescaledL_hsl, 0]}
                  radius={rescaledS * (1 - Math.abs((2 * props.focusL) / 100 - 1))}
                  side={THREE.DoubleSide}
                />
              )}
              {props.hslMainElement === 'L' && (
                <Disc
                  {...props}
                  position={[0, rescaledL_hsl, 0]}
                  radius={props.cylinderRadius * (1 - Math.abs((2 * props.focusL) / 100 - 1))}
                  side={THREE.DoubleSide}
                />
              )}
            </group>
          </>
        );
      })()}

      {props.shape === 'HSB' && (() => {
        const rescaledV_hsb = (props.focusV / 100 - 0.5) * hsbCylinderHeight;
        return (
          <>
            {props.hsbMainElement === 'H' && (
              <Quadrilateral
                {...props}
                points={[
                  props.cylindricalToCartesian(rescaledH, props.cylinderRadius, hsbCylinderHeight / 2),
                  props.cylindricalToCartesian(rescaledH, 0, -hsbCylinderHeight / 2),
                  props.cylindricalToCartesian(rescaledH, 0, hsbCylinderHeight / 2),
                  props.cylindricalToCartesian(rescaledH, 0, hsbCylinderHeight / 2),
                ]}
              />
            )}
            <group rotation={[Math.PI / 2, 0, 0]}>
              {props.hsbMainElement === 'S' && (
                <Disc
                  {...props}
                  position={[0, rescaledV_hsb, 0]}
                  radius={rescaledHsvS * (props.focusV / 100)}
                  side={THREE.DoubleSide}
                />
              )}
              {props.hsbMainElement === 'V' && (
                <Disc
                  {...props}
                  position={[0, rescaledV_hsb, 0]}
                  radius={props.cylinderRadius * (props.focusV / 100)}
                  side={THREE.DoubleSide}
                />
              )}
            </group>
          </>
        );
      })()}

      {props.shape === 'Lab' &&
        (() => {
          const [currentL] = rgbToLab(props.focusR, props.focusG, props.focusB);
          const labCorners: [number, number, number][] = [
            labToThreePosition(currentL, -85.41, -106.9),
            labToThreePosition(currentL, 97.36, -106.9),
            labToThreePosition(currentL, 97.36, 93.63),
            labToThreePosition(currentL, -85.41, 93.63),
          ];
          return <Quadrilateral {...props} points={labCorners} />;
        })()}

      {props.shape === 'LCH' &&
        (() => {
          const [L] = rgbToLab(props.focusR, props.focusG, props.focusB);
          const discZ = (L / 100 - 0.5) * lchCylinderHeight;
          const biconeScale = 1 - Math.abs((2 * L) / 100 - 1);
          return (
            <group rotation={[Math.PI / 2, 0, 0]}>
              <Disc
                {...props}
                position={[0, discZ, 0]}
                radius={props.cylinderRadius * biconeScale}
                side={THREE.DoubleSide}
              />
            </group>
          );
        })()}
    </>
  );
};

export default FocusPlane;
