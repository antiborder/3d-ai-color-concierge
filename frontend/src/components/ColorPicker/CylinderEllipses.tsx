import React from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import type { StructureProps } from '../../types/structure';
import { hslCylinderHeight, hsbCylinderHeight, lchCylinderHeight } from '../../utils/colorSpacePositions';

interface CylinderEllipsesProps extends Pick<StructureProps, 'shape'> {
  cylinderRadius: number;
  cylinderHeight: number;
  visible: boolean;
}

// HSV(h°, s=1, v=1) → THREE.Color in [0,1]
function hsvToColor(h: number): THREE.Color {
  h = ((h % 360) + 360) % 360;
  const x = 1 - Math.abs((h / 60) % 2 - 1);
  let r = 0, g = 0, b = 0;
  if      (h < 60)  { r = 1; g = x; }
  else if (h < 120) { r = x; g = 1; }
  else if (h < 180) { g = 1; b = x; }
  else if (h < 240) { g = x; b = 1; }
  else if (h < 300) { r = x; b = 1; }
  else              { r = 1; b = x; }
  return new THREE.Color(r, g, b);
}

const CylinderEllipses = ({
  shape,
  cylinderRadius,
  cylinderHeight,
  visible,
}: CylinderEllipsesProps) => {
  // HSL/HSVの時のみ表示
  const shouldShow = shape === 'HSL' || shape === 'HSB' || shape === 'LCH';

  // 表示するかどうか
  const isVisible = shouldShow && visible;

  // 円のセグメント数
  const segments = 64;
  const topZ = cylinderHeight / 2;
  const bottomZ = -cylinderHeight / 2;

  // 上面の円の頂点を生成
  const topPoints: [number, number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    topPoints.push([cylinderRadius * Math.sin(theta), cylinderRadius * Math.cos(theta), topZ]);
  }

  // 底面の円の頂点を生成
  const bottomPoints: [number, number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    bottomPoints.push([
      cylinderRadius * Math.sin(theta),
      cylinderRadius * Math.cos(theta),
      bottomZ,
    ]);
  }

  if (!isVisible) return null;

  if (shape === 'HSB') {
    const hsbTopZ = hsbCylinderHeight / 2;
    const hsbBottomZ = -hsbCylinderHeight / 2;
    const hsbTopPoints: [number, number, number][] = [];
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      hsbTopPoints.push([cylinderRadius * Math.sin(theta), cylinderRadius * Math.cos(theta), hsbTopZ]);
    }
    const topColors: THREE.Color[] = hsbTopPoints.map((_, i) => {
      const thetaCircle = (i / segments) * Math.PI * 2;
      const thetaHsb = Math.PI - thetaCircle;
      const h = ((thetaHsb + Math.PI / 6) / (Math.PI * 2)) * 360;
      return hsvToColor(h);
    });

    const rgbcmy = [
      { h:   0, color: new THREE.Color(1, 0, 0) },
      { h:  60, color: new THREE.Color(1, 1, 0) },
      { h: 120, color: new THREE.Color(0, 1, 0) },
      { h: 180, color: new THREE.Color(0, 1, 1) },
      { h: 240, color: new THREE.Color(0, 0, 1) },
      { h: 300, color: new THREE.Color(1, 0, 1) },
    ];
    const tip: [number, number, number] = [0, 0, hsbBottomZ];
    const black = new THREE.Color(0, 0, 0);
    const slants = rgbcmy.map(({ h, color }) => {
      const thetaCircle = Math.PI + Math.PI / 6 - (h * Math.PI) / 180;
      const topPt: [number, number, number] = [
        cylinderRadius * Math.sin(thetaCircle),
        cylinderRadius * Math.cos(thetaCircle),
        hsbTopZ,
      ];
      return {
        points: [topPt, tip] as [number, number, number][],
        colors: [color, black],
      };
    });

    return (
      <group>
        <Line points={hsbTopPoints} vertexColors={topColors} lineWidth={1.5} />
        {slants.map((s, i) => (
          <Line key={i} points={s.points} vertexColors={s.colors} lineWidth={0.8} />
        ))}
      </group>
    );
  }

  if (shape === 'HSL') {
    // Middle ring at L=50 (z=0), full radius, colored by hue
    const midPoints: [number, number, number][] = [];
    const midColors: THREE.Color[] = [];
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      midPoints.push([cylinderRadius * Math.sin(theta), cylinderRadius * Math.cos(theta), 0]);
      const thetaHsl = Math.PI - theta;
      const h = ((thetaHsl + Math.PI / 6) / (Math.PI * 2)) * 360;
      midColors.push(hsvToColor(h));
    }

    // 6 slant lines at R/Y/G/C/B/M: middle → top (hue→white) and middle → bottom (hue→black)
    const rgbcmyHues = [0, 60, 120, 180, 240, 300];
    const white = new THREE.Color(1, 1, 1);
    const black = new THREE.Color(0, 0, 0);
    const topTip: [number, number, number] = [0, 0, hslCylinderHeight / 2];
    const bottomTip: [number, number, number] = [0, 0, -hslCylinderHeight / 2];

    const slants = rgbcmyHues.map((h) => {
      const thetaCircle = Math.PI + Math.PI / 6 - (h * Math.PI) / 180;
      const midPt: [number, number, number] = [
        cylinderRadius * Math.sin(thetaCircle),
        cylinderRadius * Math.cos(thetaCircle),
        0,
      ];
      const color = hsvToColor(h);
      return { midPt, color };
    });

    return (
      <group>
        <Line points={midPoints} vertexColors={midColors} lineWidth={1.5} />
        {slants.map((s, i) => (
          <React.Fragment key={i}>
            <Line points={[s.midPt, topTip]} vertexColors={[s.color, white]} lineWidth={0.8} />
            <Line points={[s.midPt, bottomTip]} vertexColors={[s.color, black]} lineWidth={0.8} />
          </React.Fragment>
        ))}
      </group>
    );
  }

  if (shape === 'LCH') {
    // Single equatorial ring at L=50 (z=0), colored by CIE LCH hue (H*=atan2(b*,a*)).
    // thetaCircle = π - H* (inverse of cylindricalToCartesian)
    const lchMidPoints: [number, number, number][] = [];
    const lchMidColors: THREE.Color[] = [];
    for (let i = 0; i <= segments; i++) {
      const thetaCircle = (i / segments) * Math.PI * 2;
      lchMidPoints.push([
        cylinderRadius * Math.sin(thetaCircle),
        cylinderRadius * Math.cos(thetaCircle),
        0,
      ]);
      const H_rad = Math.PI - thetaCircle + Math.PI / 6;
      const H_deg = ((H_rad * 180) / Math.PI + 360) % 360;
      lchMidColors.push(hsvToColor(H_deg));
    }
    const lchAxisPoints: [number, number, number][] = [
      [0, 0, -lchCylinderHeight / 2],
      [0, 0, lchCylinderHeight / 2],
    ];
    const lchAxisColors = [new THREE.Color(0, 0, 0), new THREE.Color(1, 1, 1)];
    return (
      <group>
        <Line points={lchMidPoints} vertexColors={lchMidColors} lineWidth={1.5} />
        <Line points={lchAxisPoints} vertexColors={lchAxisColors} lineWidth={1} />
      </group>
    );
  }

  return null;
};

export default CylinderEllipses;
