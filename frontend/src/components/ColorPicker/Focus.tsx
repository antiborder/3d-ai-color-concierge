import React from 'react';
import { Text } from '@react-three/drei';
import { animated } from '@react-spring/three';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import type { StructureProps, PositionFunction } from '../../types/structure';

interface FocusProps extends StructureProps {
  getRgbPosition: PositionFunction;
  getHslPosition: PositionFunction;
  getHsvPosition: PositionFunction;
}

const Focus = (props: FocusProps) => {
  const ref = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.z += 0.02;
    }
  });
  
  const position = props.shape === 'RGB' || props.shape === 'CMYK' ?
    props.getRgbPosition(props.focusR, props.focusG, props.focusB) :
    props.shape === 'HSL' ?
      props.getHslPosition(props.focusR, props.focusG, props.focusB) :
      props.getHsvPosition(props.focusR, props.focusG, props.focusB);

  return (
    <>
      {/* @ts-ignore - React Three Fiber group element */}
      <group
        position={position}
        rotation={[0, 0, -Math.PI]}
      >
        {/* @ts-ignore - animated.mesh type complexity */}
        <animated.mesh ref={ref}>
          {/* @ts-ignore - React Three Fiber group element */}
          <group
            position={[0, 0, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <Text
              color={'#000000'}
              fontSize={1.1}
            >
              {'V'}
            </Text>
            <Text
              color={'#000000'}
              fontSize={1.6}
              position={[0, 0.2, 0]}
            >
              {'I'}
            </Text>
          {/* @ts-ignore - React Three Fiber group element */}
          </group>
        </animated.mesh>
      {/* @ts-ignore - React Three Fiber group element */}
      </group>
    </>
  );
};

export default Focus;

