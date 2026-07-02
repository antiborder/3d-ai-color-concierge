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
// Radius chosen so HSL bicone volume equals RGB cube volume: r = size·√(√3/π)
export const cylinderRadius = structureSize * Math.sqrt(Math.sqrt(3) / Math.PI);
// All cylindrical/bicone shapes + Lab share this height so white/black aligns with RGB diagonal: z = ±(structureSize/2)·√3
export const hslCylinderHeight = structureSize * Math.sqrt(3);
export const hsbCylinderHeight = structureSize * Math.sqrt(3);
export const lchCylinderHeight = structureSize * Math.sqrt(3);
export const labCylinderHeight = structureSize * Math.sqrt(3);

// Precomputed rotation applied to RGB-cube and XYZ-space positions
export const RGB_XYZ_ROTATION = (() => {
  const tilt = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(-1, -1, 1).normalize(),
    new THREE.Vector3(0, 0, 1)
  );
  const zRot = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(1, 0, 0).normalize(),
    new THREE.Vector3(0, 0.77, 0)
  );
  return zRot.multiply(tilt);
})();

const toLinear = (c: number): number => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};

const rgbToXyz = (r: number, g: number, b: number): [number, number, number] => {
  const rl = toLinear(r),
    gl = toLinear(g),
    bl = toLinear(b);
  return [
    0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl,
    0.2126729 * rl + 0.7151522 * gl + 0.072175 * bl,
    0.0193339 * rl + 0.119192 * gl + 0.9503041 * bl,
  ];
};

export const rgbToLab = (r: number, g: number, b: number): [number, number, number] => {
  const [X, Y, Z] = rgbToXyz(r, g, b);
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(X / 0.95047), fy = f(Y / 1.0), fz = f(Z / 1.08883);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
};

const rescaleRgb = (r: number, g: number, b: number): [number, number, number] => [
  -(r / 255 - 0.5) * structureSize,
  (-g / 255 + 0.5) * structureSize,
  (b / 255 - 0.5) * structureSize,
];

export const getRgbPosition: PositionFunction = (r, g, b) =>
  new THREE.Vector3(...rescaleRgb(r, g, b)).applyQuaternion(RGB_XYZ_ROTATION).toArray() as [
    number,
    number,
    number,
  ];

export const rescaleHsl: RescaleHslFunction = (h, s, l) => [
  (h / 360) * (2 * Math.PI) - Math.PI / 6,
  (s / 100) * cylinderRadius,
  ((l - 50) / 100) * cylinderHeight,
];

export const cylindricalToCartesian: CylindricalToCartesianFunction = (theta, radius, z) => [
  radius * Math.sin(theta),
  -radius * Math.cos(theta),
  z,
];

export const getHslPosition: PositionFunction = (r, g, b) => {
  const [h, s, l] = convert.rgb.hsl([Math.round(r), Math.round(g), Math.round(b)]);
  const theta = (h / 360) * (2 * Math.PI) - Math.PI / 6;
  // Bicone: radius scales to 0 at L=0 and L=100, max at L=50
  const radius = (s / 100) * cylinderRadius * (1 - Math.abs(2 * l / 100 - 1));
  const z = ((l - 50) / 100) * hslCylinderHeight;
  return cylindricalToCartesian(theta, radius, z);
};

// HSB cone: radius scales with v so black (v=0) collapses to a tip at the bottom.
export const rescaleHsb = (h: number, s: number, v: number): [number, number, number] => [
  (h / 360) * (2 * Math.PI) - Math.PI / 6,
  (s / 100) * cylinderRadius * (v / 100),
  (v / 100 - 0.5) * hsbCylinderHeight,
];

export const getHsbPosition: PositionFunction = (r, g, b) => {
  const [h, s, v] = convert.rgb.hsv([Math.round(r), Math.round(g), Math.round(b)]);
  return cylindricalToCartesian(...rescaleHsb(h, s, v));
};

export const getMunsellPosition: PositionFunction = (r, g, b) => {
  const { hueNum, value, chroma } = getMunsellHVC(r, g, b);
  const theta = hueNum !== null ? (hueNum / 100) * 2 * Math.PI - Math.PI / 3 : 0;
  const biconeScale = 1 - Math.abs(2 * value / 10 - 1);
  const radius = hueNum !== null ? (chroma / 20) * cylinderRadius * biconeScale : 0;
  const z = (value / 10 - 0.5) * lchCylinderHeight;
  return cylindricalToCartesian(theta, radius, z);
};

// CIE LCH is the polar form of CIE Lab — same positions, different coordinate description.
export const getLchPosition: PositionFunction = (r, g, b) => getLabPosition(r, g, b);

export const getLabPosition: PositionFunction = (r, g, b) => {
  const [X, Y, Z] = rgbToXyz(r, g, b);
  const Xn = X / 0.95047,
    Yn = Y / 1.0,
    Zn = Z / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(Xn),
    fy = f(Yn),
    fz = f(Zn);
  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const bLab = 200 * (fy - fz);
  // Scale so white/black (a*=b*=0) maps to origin; ranges from sRGB sampling.
  const half = structureSize / 2;
  const x = (bLab / 100.27) * half;
  const y = -(a / 91.39) * half;
  const rot = Math.PI / 3; // clockwise rotation in radians (π/6 = 30°)
  return [x * Math.cos(rot) + y * Math.sin(rot), -x * Math.sin(rot) + y * Math.cos(rot), (L / 100 - 0.5) * labCylinderHeight];
};

export const getXyzPosition: PositionFunction = (r, g, b) => {
  const [X, Y, Z] = rgbToXyz(r, g, b);
  return new THREE.Vector3(
    -(X / 0.95047 - 0.5) * structureSize,
    -(Y / 1.0 - 0.5) * structureSize,
    (Z / 1.08883 - 0.5) * structureSize
  )
    .applyQuaternion(RGB_XYZ_ROTATION)
    .toArray() as [number, number, number];
};

// D65 white point chromaticity — fallback for black (X=Y=Z=0) so it plots
// at the same neutral point as grays and white.
const D65_X = 0.3127, D65_Y = 0.3290, D65_Z = 0.3583;

export const getXyzChromaticityPosition: PositionFunction = (r, g, b) => {
  const [X, Y, Z] = rgbToXyz(r, g, b);
  const sum = X + Y + Z;
  const nx = sum < 1e-10 ? D65_X : X / sum;
  const ny = sum < 1e-10 ? D65_Y : Y / sum;
  const nz = sum < 1e-10 ? D65_Z : Z / sum;
  const xc = nx - 0.5, yc = ny - 0.5, zc = nz - 0.5;
  return new THREE.Vector3(-xc * structureSize, -yc * structureSize, zc * structureSize)
    .applyQuaternion(RGB_XYZ_ROTATION)
    .toArray() as [number, number, number];
};

export const getXyChromaticityPosition: PositionFunction = (r, g, b) => {
  const [X, Y, Z] = rgbToXyz(r, g, b);
  const sum = X + Y + Z;
  const nx = sum < 1e-10 ? D65_X : X / sum;
  const ny = sum < 1e-10 ? D65_Y : Y / sum;
  const xc = nx - 0.5, yc = ny - 0.5;
  // z_c=0 face of the xyz cube: zc_centered = 0 - 0.5 = -0.5
  return new THREE.Vector3(-xc * structureSize, -yc * structureSize, -0.5 * structureSize)
    .applyQuaternion(RGB_XYZ_ROTATION)
    .toArray() as [number, number, number];
};
