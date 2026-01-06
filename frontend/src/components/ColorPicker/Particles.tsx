import React, { useState } from "react";
import { config, useSpring, animated } from "@react-spring/three";
import { Html } from "@react-three/drei";
import * as THREE from 'three';
import convert from 'color-convert';
import styled from 'styled-components';
import '../../App.css';
import sampleColors from '../../constants/sampleColors';
import type { StructureProps, PositionFunction } from '../../types/structure';

interface ParticlesProps extends StructureProps {
  getRgbPosition: PositionFunction;
  getHslPosition: PositionFunction;
  getHsvPosition: PositionFunction;
}

const Particles = (props: ParticlesProps) => {
  const division = 6;

  return (
    <>
      {sampleColors.map((c, i) => {
        const rgb = convert.hex.rgb(c.hex);
        return <Particle
          key={i}
          getRgbPosition={props.getRgbPosition}
          getHslPosition={props.getHslPosition}
          getHsvPosition={props.getHsvPosition}
          onParticleClick={() => props.onParticleClick(...rgb)}
          r={rgb[0]}
          g={rgb[1]}
          b={rgb[2]}
          name1={c.name1}
          name2={c.name2}
          name3={c.name3}
          shape={props.shape}
          emissive={new THREE.Color('#000000')}
          division={division}
        />;
      })}
    </>
  );
};

interface ParticleProps {
  size?: number;
  radius?: number;
  color?: string;
  opacity?: number;
  r: number;
  g: number;
  b: number;
  name1?: string;
  name2?: string;
  name3?: string;
  shape: 'RGB' | 'CMYK' | 'HSL' | 'HSV';
  emissive: THREE.Color;
  division: number;
  getRgbPosition: PositionFunction;
  getHslPosition: PositionFunction;
  getHsvPosition: PositionFunction;
  onParticleClick: () => void;
}

const Particle = ({ size = 0.4, radius = 0, color = '#000000', opacity = 1, ...props }: ParticleProps) => {
  const [hovered, setHovered] = useState(false);
  const [bubbleHovered, setBubbleHovered] = useState(false);
  const particleColor = '#' + convert.rgb.hex([Math.round(props.r), Math.round(props.g), Math.round(props.b)]);

  // @ts-ignore - useSpring type complexity
  const { position } = useSpring({
    from: {
      position: [0, 0, 0] as [number, number, number]
    },
    to: {
      position: props.shape === 'RGB' || props.shape === 'CMYK' ?
        props.getRgbPosition(props.r, props.g, props.b) :
        props.shape === 'HSL' ?
          props.getHslPosition(props.r, props.g, props.b) :
          props.getHsvPosition(props.r, props.g, props.b),
    },
    config: { duration: "500" }
  });

  // @ts-ignore - useSpring type complexity
  const { scale } = useSpring({
    scale: hovered ? 1.8 : 1,
    config: config.wobbly,
  });

  const handlePointerOver = () => {
    setHovered(true);
  };
  
  const handlePointerOut = () => {
    setHovered(false);
  };
  
  const handleBubblePointerOver = () => {
    setBubbleHovered(true);
  };
  
  const handleBubblePointerOut = () => {
    setBubbleHovered(false);
  };

  return (
    // @ts-ignore - animated.mesh type complexity
    <animated.mesh
      position={position}
      onPointerOver={() => handlePointerOver()}
      onPointerOut={() => handlePointerOut()}
      scale={scale}
      onClick={props.onParticleClick}
    >
      {/* @ts-ignore - React Three Fiber geometry element */}
      <sphereGeometry attach="geometry" args={[0.12, 32, 32]} />
      {/* @ts-ignore - React Three Fiber material element */}
      <meshStandardMaterial
        attach="material"
        color={particleColor}
        opacity={opacity}
        transparent={false}
      />
      <Html
        zIndexRange={[100, 5]}
      >
        <div
          onPointerOver={() => handleBubblePointerOver()}
          onPointerOut={() => handleBubblePointerOut()}
        >
          {((hovered || bubbleHovered)) &&
            <ParticleBubble
              {...props}
              type={props.shape}
              backgroundColor={particleColor}
              textColor={particleColor}
              onClick={props.onParticleClick}
            />
          }
        </div>
      </Html>
    </animated.mesh>
  );
};

interface ParticleBubbleProps {
  r: number;
  g: number;
  b: number;
  name1?: string;
  name2?: string;
  name3?: string;
  type: 'RGB' | 'CMYK' | 'HSL' | 'HSV';
  backgroundColor: string;
  textColor: string;
  onClick: () => void;
  onParticleClick: () => void;
}

const ParticleBubble = (props: ParticleBubbleProps) => {
  return (
    <StyledNodeBubble style={{}}>
      <div style={{ textAlign: 'left', fontWeight: 'bold' }}>
        {props.name1}
      </div>
      <div
        className='colorRectangle'
        onClick={props.onParticleClick}
        style={{ backgroundColor: "#" + convert.rgb.hex([props.r, props.g, props.b]) }}
      />
      {"#" + convert.rgb.hex([props.r, props.g, props.b])}<br />
      {props.name2}
      <div onClick={props.onParticleClick}>
        <span className='modalLink'>
          この色を選ぶ
        </span>
      </div>
    </StyledNodeBubble>
  );
};

const StyledNodeBubble = styled.div`
    position:absolute;
    top:4px;
    left:4px;
    width: 120px;
    background: #fff;
    border-radius: 0px 24px 24px 24px;
    font-size: 12px;
    padding: 4px;
    text-align:center;
    .modalLink{
        color:#0000FF;
        cursor: pointer;
        text-decoration: underline;
    }
    div{
        margin: 0 auto;
    }
    .colorRectangle{
        height: 20px;
        width: 90px;
        border: 1px solid #BBB;
        cursor: pointer;
    }
`;

export default Particles;

