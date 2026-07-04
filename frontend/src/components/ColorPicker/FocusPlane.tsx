import React from 'react';
import * as THREE from 'three';
import Cylinder from './Cylinder';
import Quadrilateral from './Quadrilateral';
import Disc from './Disc';
import { hslCylinderHeight, hsbCylinderHeight, lchCylinderHeight, labCylinderHeight } from '../../utils/colorSpacePositions';
import { getMunsellHVC } from '../../utils/munsellUtils';
import type {
  StructureProps,
  PositionFunction,
  RescaleHslFunction,
  CylindricalToCartesianFunction,
} from '../../types/structure';

const STRUCTURE_SIZE = 9;
// Lab values that reach the cube wireframe edge (labCylinderHeight/2 in local space)
const B_EXTENT = Math.sqrt(3) * 100.27 / 1.184;
const A_EXTENT = Math.sqrt(3) * 91.39  / 1.184;

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
  const x = (bLab / 100.27) * half;
  const y = -(a / 91.39) * half;
  const rot = Math.PI / 3;
  return [
    x * Math.cos(rot) + y * Math.sin(rot),
    -x * Math.sin(rot) + y * Math.cos(rot),
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
          const [currentL, currentA, currentB] = rgbToLab(props.focusR, props.focusG, props.focusB);
          const el = props.labMainElement;
          let labCorners: [number, number, number][];
          if (el === 'a') {
            labCorners = [
              labToThreePosition(0,   currentA, -B_EXTENT),
              labToThreePosition(100, currentA, -B_EXTENT),
              labToThreePosition(100, currentA,  B_EXTENT),
              labToThreePosition(0,   currentA,  B_EXTENT),
            ];
          } else if (el === 'b') {
            labCorners = [
              labToThreePosition(0,   -A_EXTENT, currentB),
              labToThreePosition(100, -A_EXTENT, currentB),
              labToThreePosition(100,  A_EXTENT, currentB),
              labToThreePosition(0,    A_EXTENT, currentB),
            ];
          } else {
            labCorners = [
              labToThreePosition(currentL, -A_EXTENT, -B_EXTENT),
              labToThreePosition(currentL,  A_EXTENT, -B_EXTENT),
              labToThreePosition(currentL,  A_EXTENT,  B_EXTENT),
              labToThreePosition(currentL, -A_EXTENT,  B_EXTENT),
            ];
          }
          return <Quadrilateral {...props} points={labCorners} />;
        })()}

      {props.shape === 'LCH' &&
        (() => {
          const { hueNum, value, chroma } = getMunsellHVC(props.focusR, props.focusG, props.focusB);
          const theta = hueNum !== null ? (hueNum / 100) * 2 * Math.PI - Math.PI / 3 : 0;
          const discZ = (value / 10 - 0.5) * lchCylinderHeight;
          const biconeScale = 1 - Math.abs(2 * value / 10 - 1);
          const chromaRadius = (chroma / 20) * props.cylinderRadius;

          if (props.lchMainElement === 'L') {
            return (
              <group rotation={[Math.PI / 2, 0, 0]}>
                <Disc
                  position={[0, discZ, 0]}
                  radius={props.cylinderRadius * biconeScale}
                  side={THREE.DoubleSide}
                />
              </group>
            );
          } else if (props.lchMainElement === 'C') {
            // Cylinder at fixed chroma radius, spanning z symmetrically (center = 0)
            const valueMin = chroma / 4; // Munsell value where bicone radius = chromaRadius
            const valueMax = 10 - valueMin;
            const cylHeight = ((valueMax - valueMin) / 10) * lchCylinderHeight;
            return (
              <group rotation={[Math.PI / 2, 0, 0]}>
                <Cylinder radius={chromaRadius} height={Math.max(cylHeight, 0.01)} side={THREE.DoubleSide} />
              </group>
            );
          } else {
            // H fixed: triangle plane (equator-outer → white-tip → black-tip)
            return (
              <Quadrilateral
                {...props}
                points={[
                  props.cylindricalToCartesian(theta, props.cylinderRadius, 0),
                  props.cylindricalToCartesian(theta, 0, lchCylinderHeight / 2),
                  props.cylindricalToCartesian(theta, 0, -lchCylinderHeight / 2),
                  props.cylindricalToCartesian(theta, 0, -lchCylinderHeight / 2),
                ]}
              />
            );
          }
        })()}
    </>
  );
};

export default FocusPlane;
