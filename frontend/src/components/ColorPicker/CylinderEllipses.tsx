import * as THREE from 'three';
import { Line } from '@react-three/drei';
import type { StructureProps } from '../../types/structure';
import { focusContrastColor } from '../../utils/colorConverter';

interface CylinderEllipsesProps extends Pick<StructureProps, 'shape'> {
  cylinderRadius: number;
  cylinderHeight: number;
  visible: boolean;
  focusR?: number;
  focusG?: number;
  focusB?: number;
  focusL?: number;
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
  focusR = 128,
  focusG = 128,
  focusB = 128,
  focusL = 50,
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
    // Top circle: each segment colored by the actual HSB hue at that position.
    // Circle uses [r·sin θ, r·cos θ] but cylindricalToCartesian uses [r·sin θ, −r·cos θ],
    // so the hue-angle mapping is: θ_p = π − θ_c → h = (θ_p + π/12) / 2π × 360
    const topColors: THREE.Color[] = topPoints.map((_, i) => {
      const thetaCircle = (i / segments) * Math.PI * 2;
      const thetaHsb = Math.PI - thetaCircle;
      const h = ((thetaHsb + Math.PI / 12) / (Math.PI * 2)) * 360;
      return hsvToColor(h);
    });
    const contrastColor = focusContrastColor(focusL);
    return (
      <group>
        <Line points={topPoints} vertexColors={topColors} lineWidth={1.5} />
        <Line points={bottomPoints} color={contrastColor} lineWidth={1} />
      </group>
    );
  }

  const ringColor = (shape === 'HSL' || shape === 'LCH') ? focusContrastColor(focusL) : '#ffffff';

  return (
    <group>
      <Line points={topPoints} color={ringColor} lineWidth={1} />
      <Line points={bottomPoints} color={ringColor} lineWidth={1} />
    </group>
  );
};

export default CylinderEllipses;
