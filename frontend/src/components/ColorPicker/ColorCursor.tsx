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
      meridianRef.current.rotation.y += 0.02;
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
  const radius = 0.124;
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
        <group ref={meridianRef}>
          {meridianLines.map((points, index) => {
            if (index % 3 === 0) {
              // 偶数番目：選択色で回転
              return (
                <Line
                  key={`meridian-${index}`}
                  points={points}
                  color="#333333"
                  lineWidth={2}
                />
              );
            }
            return null;
          })}
        </group>
        {/* 緯線（横の線）- 偶数番目を非表示 */}
        {parallelLines.map((points, index) => {
          if (index % 2 === 1) {
            // 奇数番目のみ表示
            return (
              <Line
                key={`parallel-${index}`}
                points={points}
                color="#CCCCCC"
                lineWidth={1}
              />
            );
          }
          return null;
        })}
      </group>
    </group>
  );
};

export default ColorCursor;
