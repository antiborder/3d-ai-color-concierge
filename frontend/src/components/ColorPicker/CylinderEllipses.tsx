import { Line } from '@react-three/drei';
import type { StructureProps } from '../../types/structure';

interface CylinderEllipsesProps extends Pick<StructureProps, 'shape'> {
  cylinderRadius: number;
  cylinderHeight: number;
  visible: boolean;
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
    topPoints.push([
      cylinderRadius * Math.sin(theta),
      cylinderRadius * Math.cos(theta),
      topZ,
    ]);
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

  // 表示されない場合は何もレンダリングしない
  if (!isVisible) {
    return null;
  }

  return (
    <group>
      {/* 上面の円 */}
      <Line points={topPoints} color="#ffffff" lineWidth={1} />
      {/* 底面の円 */}
      <Line points={bottomPoints} color="#ffffff" lineWidth={1} />
    </group>
  );
};

export default CylinderEllipses;
