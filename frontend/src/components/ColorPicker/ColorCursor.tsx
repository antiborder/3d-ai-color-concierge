import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { StructureProps, PositionFunction } from '../../types/structure';

interface ColorCursorProps extends StructureProps {
  getRgbPosition: PositionFunction;
  getHslPosition: PositionFunction;
  getHsvPosition: PositionFunction;
}

const ColorCursor = (props: ColorCursorProps) => {
  const meridianRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (meridianRef.current) {
      meridianRef.current.rotation.y += 0.01;
    }
  });

  // 現在選択されている色の位置を取得
  const position =
    props.shape === 'RGB' || props.shape === 'CMYK'
      ? props.getRgbPosition(props.focusR, props.focusG, props.focusB)
      : props.shape === 'HSL'
        ? props.getHslPosition(props.focusR, props.focusG, props.focusB)
        : props.getHsvPosition(props.focusR, props.focusG, props.focusB);

  // 球体のワイヤーフレームを生成
  // 半径
  const radius = 0.21;
  // 経線（meridian）の数
  const meridians = 12;
  // 緯線（parallel）の数
  const parallels = 8;

  // 経線を生成（縦の線）
  const meridianLines: [number, number, number][][] = [];
  for (let i = 0; i < meridians; i++) {
    const theta = (i / meridians) * Math.PI * 2;
    const points: [number, number, number][] = [];
    for (let j = 0; j <= parallels; j++) {
      const phi = (j / parallels) * Math.PI;
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);
      points.push([x, y, z]);
    }
    meridianLines.push(points);
  }

  // 緯線を生成（横の線）
  const parallelLines: [number, number, number][][] = [];
  for (let j = 1; j < parallels; j++) {
    const phi = (j / parallels) * Math.PI;
    const points: [number, number, number][] = [];
    for (let i = 0; i <= meridians; i++) {
      const theta = (i / meridians) * Math.PI * 2;
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);
      points.push([x, y, z]);
    }
    parallelLines.push(points);
  }

  // 現在選択されている色を16進数に変換
  const selectedColor = `#${Math.round(props.focusR).toString(16).padStart(2, '0')}${Math.round(props.focusG).toString(16).padStart(2, '0')}${Math.round(props.focusB).toString(16).padStart(2, '0')}`;

  return (
    <group position={position} rotation={[0, 0, -Math.PI]}>
      <group rotation={[Math.PI / 2, 0, 0]}>
        {/* 経線（縦の線）- 赤道に沿って回転 */}
        <group ref={meridianRef}>
          {meridianLines.map((points, index) => (
            <Line
              key={`meridian-${index}`}
              points={points}
              color={selectedColor}
              lineWidth={5}
            />
          ))}
        </group>
        {/* 緯線（横の線） */}
        {parallelLines.map((points, index) => (
          <Line
            key={`parallel-${index}`}
            points={points}
            color="#000000"
            lineWidth={1}
          />
        ))}
      </group>
    </group>
  );
};

export default ColorCursor;
