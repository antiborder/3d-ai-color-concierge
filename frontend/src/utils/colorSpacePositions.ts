import * as THREE from 'three';
import convert from 'color-convert';
import { getMunsellHVC } from './munsellUtils';
import type {
  PositionFunction,
  RescaleHslFunction,
  CylindricalToCartesianFunction,
} from '../types/structure';

export const structureSize = 9;
const sizeRatio = 0.7;
export const cylinderHeight = structureSize * sizeRatio;
export const cylinderRadius = structureSize * sizeRatio;

// Precomputed rotation applied to RGB-cube and XYZ-space positions
const RGB_XYZ_ROTATION = (() => {
  const tilt = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(-1, -1, 1).normalize(), new THREE.Vector3(0, 0, 1)
  );
  const zRot = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(1, 0, 0).normalize(), new THREE.Vector3(0, 0.77, 0)
  );
  return zRot.multiply(tilt);
})();

const toLinear = (c: number): number => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};

const rgbToXyz = (r: number, g: number, b: number): [number, number, number] => {
  const rl = toLinear(r), gl = toLinear(g), bl = toLinear(b);
  return [
    0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl,
    0.2126729 * rl + 0.7151522 * gl + 0.0721750 * bl,
    0.0193339 * rl + 0.1191920 * gl + 0.9503041 * bl,
  ];
};

const rescaleRgb = (r: number, g: number, b: number): [number, number, number] => [
  -(r / 255 - 0.5) * structureSize,
  (-g / 255 + 0.5) * structureSize,
  (b / 255 - 0.5) * structureSize,
];

export const getRgbPosition: PositionFunction = (r, g, b) =>
  new THREE.Vector3(...rescaleRgb(r, g, b))
    .applyQuaternion(RGB_XYZ_ROTATION)
    .toArray() as [number, number, number];

export const rescaleHsl: RescaleHslFunction = (h, s, l) => [
  (h / 360) * (2 * Math.PI) - Math.PI / 12,
  (s / 100) * cylinderRadius,
  ((l - 50) / 100) * cylinderHeight,
];

export const cylindricalToCartesian: CylindricalToCartesianFunction = (theta, radius, z) => [
  radius * Math.sin(theta), -radius * Math.cos(theta), z,
];

export const getHslPosition: PositionFunction = (r, g, b) => {
  const [h, s, l] = convert.rgb.hsl([Math.round(r), Math.round(g), Math.round(b)]);
  return cylindricalToCartesian(...rescaleHsl(h, s, l));
};

export const getHsbPosition: PositionFunction = (r, g, b) => {
  const [h, s, v] = convert.rgb.hsv([Math.round(r), Math.round(g), Math.round(b)]);
  return cylindricalToCartesian(...rescaleHsl(h, s, v));
};

export const getMunsellPosition: PositionFunction = (r, g, b) => {
  const { hueNum, value, chroma } = getMunsellHVC(r, g, b);
  const theta = hueNum !== null ? (hueNum / 100) * 2 * Math.PI : 0;
  const radius = hueNum !== null ? (chroma / 20) * cylinderRadius : 0;
  const z = (value / 10 - 0.5) * cylinderHeight;
  return cylindricalToCartesian(theta, radius, z);
};

export const getLabPosition: PositionFunction = (r, g, b) => {
  const [X, Y, Z] = rgbToXyz(r, g, b);
  const Xn = X / 0.95047, Yn = Y / 1.0, Zn = Z / 1.08883;
  const f = (t: number) => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
  const fx = f(Xn), fy = f(Yn), fz = f(Zn);
  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const bLab = 200 * (fy - fz);
  // Ranges measured by exhaustive sRGB sampling:
  //   a*: [-85.41, +97.36]  center=+5.98  half-range=91.39
  //   b*: [-106.90, +93.63] center=-6.64  half-range=100.27
  const half = structureSize / 2;
  return [
    (bLab - (-6.64)) / 100.27 * half,
    -((a - 5.98) / 91.39 * half),
    (L / 100 - 0.5) * structureSize,
  ];
};

export const getXyzPosition: PositionFunction = (r, g, b) => {
  const [X, Y, Z] = rgbToXyz(r, g, b);
  return new THREE.Vector3(
    -(X / 0.95047 - 0.5) * structureSize,
    -(Y / 1.0 - 0.5) * structureSize,
    (Z / 1.08883 - 0.5) * structureSize,
  ).applyQuaternion(RGB_XYZ_ROTATION).toArray() as [number, number, number];
};

export const getXyzChromaticityPosition: PositionFunction = (r, g, b) => {
  const [X, Y, Z] = rgbToXyz(r, g, b);
  const sum = X + Y + Z;
  if (sum < 1e-10) return [0, 0, 0];
  const xc = X / sum - 0.5, yc = Y / sum - 0.5, zc = Z / sum - 0.5;
  return new THREE.Vector3(-xc * structureSize, -yc * structureSize, zc * structureSize)
    .applyQuaternion(RGB_XYZ_ROTATION).toArray() as [number, number, number];
};

export const getXyChromaticityPosition: PositionFunction = (r, g, b) => {
  const [X, Y, Z] = rgbToXyz(r, g, b);
  const sum = X + Y + Z;
  if (sum < 1e-10) return [0, 0, 0];
  const xc = X / sum - 0.5, yc = Y / sum - 0.5;
  // z_c=0 face of the xyz cube: zc_centered = 0 - 0.5 = -0.5
  return new THREE.Vector3(-xc * structureSize, -yc * structureSize, -0.5 * structureSize)
    .applyQuaternion(RGB_XYZ_ROTATION).toArray() as [number, number, number];
};
