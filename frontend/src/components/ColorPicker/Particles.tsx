import React, { useState } from 'react';
import { config, useSpring, animated } from '@react-spring/three';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import convert from 'color-convert';
import styled from 'styled-components';
import '../../App.css';
import sampleColors from '../../constants/sampleColors';
import type { StructureProps, PositionFunction } from '../../types/structure';

interface ParticlesProps extends StructureProps {
  getRgbPosition: PositionFunction;
  getHslPosition: PositionFunction;
  getHsbPosition: PositionFunction;
  getMunsellPosition: PositionFunction;
  getLabPosition: PositionFunction;
  getXyzPosition: PositionFunction;
  getXyzChromaticityPosition: PositionFunction;
  getXyChromaticityPosition: PositionFunction;
  getOklabPosition: PositionFunction;
  getOklchPosition: PositionFunction;
  getLmsPosition: PositionFunction;
  filteredColors?: typeof sampleColors;
}

const Particles = (props: ParticlesProps) => {
  const division = 6;
  const colorsToDisplay = props.filteredColors || sampleColors;

  return (
    <>
      {colorsToDisplay.map((c, i) => {
        const rgb = convert.hex.rgb(c.hex);
        return (
          <Particle
            key={i}
            getRgbPosition={props.getRgbPosition}
            getHslPosition={props.getHslPosition}
            getHsbPosition={props.getHsbPosition}
            getMunsellPosition={props.getMunsellPosition}
            getLabPosition={props.getLabPosition}
            getXyzPosition={props.getXyzPosition}
            getXyzChromaticityPosition={props.getXyzChromaticityPosition}
            getXyChromaticityPosition={props.getXyChromaticityPosition}
            getOklabPosition={props.getOklabPosition}
            getOklchPosition={props.getOklchPosition}
            getLmsPosition={props.getLmsPosition}
            onParticleClick={() => props.onParticleClick(...rgb)}
            r={rgb[0]}
            g={rgb[1]}
            b={rgb[2]}
            focusR={props.focusR}
            focusG={props.focusG}
            focusB={props.focusB}
            name1={c.name1}
            name2={c.name2}
            name3={c.name3}
            tag={c.tag}
            shape={props.shape}
            emissive={new THREE.Color('#000000')}
            division={division}
          />
        );
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
  focusR: number;
  focusG: number;
  focusB: number;
  name1?: string;
  name2?: string;
  name3?: string;
  tag?: string[];
  shape: 'RGB' | 'CMYK' | 'HSL' | 'HSB' | 'Lab' | 'LCH' | 'OKLAB' | 'OKLCH' | 'LMS' | 'XYZ' | 'xyz' | 'xy';
  emissive: THREE.Color;
  division: number;
  getRgbPosition: PositionFunction;
  getHslPosition: PositionFunction;
  getHsbPosition: PositionFunction;
  getMunsellPosition: PositionFunction;
  getLabPosition: PositionFunction;
  getXyzPosition: PositionFunction;
  getXyzChromaticityPosition: PositionFunction;
  getXyChromaticityPosition: PositionFunction;
  getOklabPosition: PositionFunction;
  getOklchPosition: PositionFunction;
  getLmsPosition: PositionFunction;
  onParticleClick: () => void;
}

const Particle = ({
  size: _size = 0.4,
  radius: _radius = 0,
  color: _color = '#000000',
  opacity = 1,
  ...props
}: ParticleProps) => {
  const [hovered, setHovered] = useState(false);
  const [bubbleHovered, setBubbleHovered] = useState(false);
  const particleColor =
    '#' + convert.rgb.hex([Math.round(props.r), Math.round(props.g), Math.round(props.b)]).toLowerCase();
  const currentColorHex =
    '#' +
    convert.rgb.hex([Math.round(props.focusR), Math.round(props.focusG), Math.round(props.focusB)]).toLowerCase();
  const isSelected = particleColor.toLowerCase() === currentColorHex.toLowerCase();

  const { position } = useSpring({
    from: {
      position: [0, 0, 0] as [number, number, number],
    },
    to: {
      position:
        props.shape === 'RGB' || props.shape === 'CMYK'
          ? props.getRgbPosition(props.r, props.g, props.b)
          : props.shape === 'HSL'
            ? props.getHslPosition(props.r, props.g, props.b)
            : props.shape === 'Lab'
              ? props.getLabPosition(props.r, props.g, props.b)
              : props.shape === 'LCH'
                ? props.getMunsellPosition(props.r, props.g, props.b)
                : props.shape === 'OKLAB'
                  ? props.getOklabPosition(props.r, props.g, props.b)
                  : props.shape === 'OKLCH'
                  ? props.getOklchPosition(props.r, props.g, props.b)
                  : props.shape === 'LMS'
                    ? props.getLmsPosition(props.r, props.g, props.b)
                    : props.shape === 'XYZ'
                      ? props.getXyzPosition(props.r, props.g, props.b)
                      : props.shape === 'xyz'
                        ? props.getXyzChromaticityPosition(props.r, props.g, props.b)
                        : props.shape === 'xy'
                          ? props.getXyChromaticityPosition(props.r, props.g, props.b)
                          : props.getHsbPosition(props.r, props.g, props.b),
    },
    config: { duration: 1500 },
  });

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
    <animated.mesh
      position={position}
      onPointerOver={() => handlePointerOver()}
      onPointerOut={() => handlePointerOut()}
      scale={scale}
      onClick={props.onParticleClick}
    >
      <sphereGeometry attach="geometry" args={[0.12, 32, 32]} />
      <meshBasicMaterial
        attach="material"
        color={particleColor}
        opacity={opacity}
        transparent={false}
      />
      <Html zIndexRange={[100, 5]}>
        <div
          onPointerOver={() => handleBubblePointerOver()}
          onPointerOut={() => handleBubblePointerOut()}
        >
          {(hovered || bubbleHovered || isSelected) && (
            <ParticleBubble
              {...props}
              type={props.shape}
              backgroundColor={particleColor}
              textColor={particleColor}
              onClick={props.onParticleClick}
            />
          )}
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
  tag?: string[];
  type: 'RGB' | 'CMYK' | 'HSL' | 'HSB' | 'Lab' | 'LCH' | 'OKLAB' | 'OKLCH' | 'LMS' | 'XYZ' | 'xyz' | 'xy';
  backgroundColor: string;
  textColor: string;
  onClick: () => void;
  onParticleClick: () => void;
}

const ParticleBubble = (props: ParticleBubbleProps) => {
  const isJapaneseColor = props.tag?.includes('JAPANESE') ?? false;
  const isCssColor = props.tag?.includes('CSS') ?? false;
  const isMaterialColor = props.tag?.includes('MATERIAL') ?? false;

  // フォントクラスを決定
  let fontClass = 'other-color-name'; // デフォルト
  if (isJapaneseColor) {
    fontClass = 'japanese-color-name';
  } else if (isCssColor) {
    fontClass = 'css-color-name';
  } else if (isMaterialColor) {
    fontClass = 'material-color-name';
  }

  return (
    <StyledNodeBubble style={{}}>
      <div className={fontClass}>{props.name1}</div>
      <div style={{ textAlign: 'center', fontSize: '11px', marginBottom: '8px' }}>
        {props.name2}
      </div>
      <div
        className="colorRectangle"
        onClick={props.onParticleClick}
        style={{ backgroundColor: '#' + convert.rgb.hex([props.r, props.g, props.b]).toLowerCase() }}
      />
      {'#' + convert.rgb.hex([props.r, props.g, props.b]).toLowerCase()}
      {/* <div onClick={props.onParticleClick}>
        <span className="modalLink">この色を選ぶ</span>
      </div> */}
    </StyledNodeBubble>
  );
};

const StyledNodeBubble = styled.div`
  position: absolute;
  top: 4px;
  left: 4px;
  width: 120px;
  background: #fff;
  border-radius: 0px 24px 24px 24px;
  font-size: 12px;
  padding: 4px;
  text-align: center;
  .modalLink {
    color: #0000ff;
    cursor: pointer;
    text-decoration: underline;
  }
  div {
    margin: 0 auto;
  }
  .colorRectangle {
    height: 20px;
    width: 90px;
    border: 1px solid #bbb;
    cursor: pointer;
  }
  .japanese-color-name {
    font-family: 'Yuji Mai', serif;
    font-weight: normal;
    font-size: 24px;
    letter-spacing: 0.1em;
    line-height: 1.4;
    text-align: center;
  }
  .css-color-name {
    font-family: 'Roboto Slab', serif;
    font-weight: normal;
    font-size: 14px;
    letter-spacing: 0.02em;
    line-height: 1.4;
    text-align: center;
  }
  .material-color-name {
    font-family: 'Exo 2', sans-serif;
    font-weight: bold;
    font-size: 14px;
    letter-spacing: 0.02em;
    line-height: 1.4;
    text-align: center;
  }
  .other-color-name {
    font-family: 'Roboto Slab', serif;
    font-weight: normal;
    font-size: 14px;
    letter-spacing: 0.02em;
    line-height: 1.4;
    text-align: center;
  }
`;

export default Particles;
