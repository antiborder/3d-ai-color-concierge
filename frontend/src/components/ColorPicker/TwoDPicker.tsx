import React from 'react';
import { useState } from 'react';
import styled from 'styled-components';
import convert from 'color-convert';
import { systemColors } from '../../constants/systemColors';
import type { ControlPaneProps } from '../../types/controlPane';

interface TwoDPickerProps extends ControlPaneProps {
  i?: number;
  j?: number;
}

const TwoDPicker = (props: TwoDPickerProps) => {
  return (
    <StyledTwoDPicker>
      <div className='controlPanel' style={{ padding: '10px' }}>
        <div className='systemColorsquare'>
          <>
            {Array.from({ length: 64 }, (_, index) => index).map((i) =>
              <React.Fragment key={i}>
                <div className='colorRow'>
                  {
                    Array.from({ length: 64 }, (_, index) => index).map((j) => (
                      (
                        (props.shape === 'RGB' &&
                          <RgbColorElement {...props}
                            key={`${i}-${j}`}
                            i={i} j={j}
                          />)
                        ||
                        (props.shape === 'CMYK' &&
                          <CmykColorElement {...props}
                            key={`${i}-${j}`}
                            i={i} j={j}
                          />)
                        ||
                        (
                          props.shape === 'HSV' &&
                          <HsvColorElement {...props}
                            key={`${i}-${j}`}
                            i={i} j={j}
                          />)
                        || (
                          props.shape === 'HSL' &&
                          <HslColorElement {...props}
                            key={`${i}-${j}`}
                            i={i} j={j}
                          />)
                      )
                    ))
                  }
                </div>
              </React.Fragment>
            )}
          </>
        </div>
      </div>
    </StyledTwoDPicker>
  );
};

export default TwoDPicker;

interface ColorElementProps extends ControlPaneProps {
  i: number;
  j: number;
  getElementColor?: string;
  onClick?: () => void;
}

const RgbColorElement = (props: ColorElementProps) => {
  const getRgbElementColor = (mainElement: 'R' | 'G' | 'B', i: number, j: number, focusR: number, focusG: number, focusB: number): string => {
    let isOnVerticalLine = false;
    let isOnHorizontalLine = false;

    switch (mainElement) {
      case 'R':
        isOnVerticalLine = (j * 4 >= focusB - 3) && (j * 4 < Math.round(focusB) + 1);
        isOnHorizontalLine = (255 - i * 4 >= focusG) && (255 - i * 4 < Math.round(focusG) + 4);
        return (
          isOnVerticalLine ?
            systemColors['B'] :
            isOnHorizontalLine ?
              systemColors['G'] :
              '#' + convert.rgb.hex([focusR, 255 - i * 4, j * 4])
        );
      case 'G':
        isOnVerticalLine = (j * 4 >= focusR - 3) && (j * 4 < Math.round(focusR) + 1);
        isOnHorizontalLine = (255 - i * 4 >= focusB) && (255 - i * 4 < Math.round(focusB) + 4);
        return (
          isOnVerticalLine ?
            systemColors['R'] :
            isOnHorizontalLine ?
              systemColors['B'] :
              '#' + convert.rgb.hex([j * 4, focusG, 255 - i * 4])
        );
      case 'B':
        isOnVerticalLine = (j * 4 >= focusG - 3) && (j * 4 < Math.round(focusG) + 1);
        isOnHorizontalLine = (255 - i * 4 >= focusR) && (255 - i * 4 < Math.round(focusR) + 4);
        return (
          isOnVerticalLine ?
            systemColors['G'] :
            isOnHorizontalLine ?
              systemColors['R'] :
              '#' + convert.rgb.hex([255 - i * 4, j * 4, focusB])
        );
      default:
        return '#000000';
    }
  };

  const handleClick = (i: number, j: number) => {
    let r = props.focusR;
    let g = props.focusG;
    let b = props.focusB;
    switch (props.rgbMainElement) {
      case 'R':
        g = 255 - i * 4;
        b = j * 4;
        break;
      case 'G':
        b = 255 - i * 4;
        r = j * 4;
        break;
      case 'B':
        r = 255 - i * 4;
        g = j * 4;
        break;
    }
    props.handleClick(r, g, b);
  };

  return (
    <ColorElement
      {...props}
      getElementColor={getRgbElementColor(props.rgbMainElement, props.i, props.j, props.focusR, props.focusG, props.focusB)}
      onClick={() => { handleClick(props.i, props.j); }}
    />
  );
};

const CmykColorElement = (props: ColorElementProps) => {
  const getCmykElementColor = (mainElement: 'C' | 'M' | 'Y' | 'K', i: number, j: number, focusR: number, focusG: number, focusB: number): string => {
    let isOnVerticalLine = false;
    let isOnHorizontalLine = false;

    switch (mainElement) {
      case 'C':
        isOnVerticalLine = (j * 4 >= focusB - 3) && (j * 4 < Math.round(focusB) + 1);
        isOnHorizontalLine = (255 - i * 4 >= focusG) && (255 - i * 4 < Math.round(focusG) + 4);
        return (
          isOnVerticalLine ?
            systemColors['Y'] :
            isOnHorizontalLine ?
              systemColors['M'] :
              '#' + convert.rgb.hex([focusR, 255 - i * 4, j * 4])
        );
      case 'M':
        isOnVerticalLine = (j * 4 >= focusR - 3) && (j * 4 < Math.round(focusR) + 1);
        isOnHorizontalLine = (255 - i * 4 >= focusB) && (255 - i * 4 < Math.round(focusB) + 4);
        return (
          isOnVerticalLine ?
            systemColors['C'] :
            isOnHorizontalLine ?
              systemColors['Y'] :
              '#' + convert.rgb.hex([j * 4, focusG, 255 - i * 4])
        );
      case 'Y':
        isOnVerticalLine = (j * 4 >= focusG - 3) && (j * 4 < Math.round(focusG) + 1);
        isOnHorizontalLine = (255 - i * 4 >= focusR) && (255 - i * 4 < Math.round(focusR) + 4);
        return (
          isOnVerticalLine ?
            systemColors['M'] :
            isOnHorizontalLine ?
              systemColors['C'] :
              '#' + convert.rgb.hex([255 - i * 4, j * 4, focusB])
        );
      default:
        return '#000000';
    }
  };

  const handleClick = (i: number, j: number) => {
    let r = props.focusR;
    let g = props.focusG;
    let b = props.focusB;
    switch (props.cmykMainElement) {
      case 'C':
        g = 255 - i * 4;
        b = j * 4;
        break;
      case 'M':
        b = 255 - i * 4;
        r = j * 4;
        break;
      case 'Y':
        r = 255 - i * 4;
        g = j * 4;
        break;
    }
    props.handleClick(r, g, b);
  };

  return (
    <ColorElement
      {...props}
      getElementColor={getCmykElementColor(props.cmykMainElement, props.i, props.j, props.focusR, props.focusG, props.focusB)}
      onClick={() => { handleClick(props.i, props.j); }}
    />
  );
};

const HsvColorElement = (props: ColorElementProps) => {
  const getHsvElementColor = (mainElement: 'H' | 'S' | 'V', i: number, j: number, focusH: number, focusHsvS: number, focusV: number): string => {
    let isOnVerticalLine = false;
    let isOnHorizontalLine = false;
    switch (mainElement) {
      case 'H':
        isOnVerticalLine = (j * 100 / 64 >= focusHsvS - 1.57) && (j * 100 / 64 < Math.round(focusHsvS) + 0.01);
        isOnHorizontalLine = (100 - i * 100 / 64 >= focusV) && (100 - i * 100 / 64 < Math.round(focusV) + 1.6);
        return (
          isOnVerticalLine ?
            systemColors['K'] :
            isOnHorizontalLine ?
              systemColors['K'] :
              '#' + convert.hsv.hex([focusH, j * 100 / 64, 100 - i * 100 / 64])
        );
      case 'S':
        isOnVerticalLine = (j * 360 / 64 >= focusH - 5.7) && (j * 360 / 64 < Math.round(focusH) + 0.1);
        isOnHorizontalLine = (100 - i * 100 / 64 >= focusV) && (100 - i * 100 / 64 < Math.round(focusV) + 1.6);
        return (
          isOnVerticalLine ?
            systemColors['K'] :
            isOnHorizontalLine ?
              systemColors['W'] :
              '#' + convert.hsv.hex([j * 360 / 64, focusHsvS, 100 - i * 100 / 64])
        );
      case 'V':
        const [x, y] = [j - 32 + 0.5, 32 - i - 0.5];
        const [radius, angle] = getPolarPosition(x, y);
        const isOnRadialLine =
          angle * 360 / (2 * Math.PI) > (focusH - 29 / radius) &&
          angle * 360 / (2 * Math.PI) < ((Math.round(focusH))) + 29 / radius;
        const isOnCircleLine =
          radius * 100 / 32 >= focusHsvS - 1.8 &&
          radius * 100 / 32 < Math.round(focusHsvS) + 1.1;
        return (
          radius > 32.05 ?
            systemColors['W'] :
            isOnRadialLine && !(x === 0 && y === 0) ?
              systemColors['K'] :
              isOnCircleLine ?
                systemColors['W'] :
                '#' + convert.hsv.hex([angle * 360 / (2 * Math.PI), radius * 100 / 32, focusV])
        );
      default:
        return '#000000';
    }
  };

  const handleClick = (i: number, j: number) => {
    let h = props.focusH;
    let hsvS = props.focusHsvS;
    let v = props.focusV;
    switch (props.hsvMainElement) {
      case 'H':
        hsvS = Math.round(j * 100 / 64);
        v = Math.round((64 - i) * 100 / 64);
        break;
      case 'S':
        h = j * 360 / 64;
        v = (64 - i) * 100 / 64;
        break;
      case 'V':
        const [x, y] = [j - 32, 32 - i];
        const [radius, angle] = getPolarPosition(x, y);
        h = angle * 360 / (2 * Math.PI);
        hsvS = radius * 100 / 32;
        break;
    }
    const [r, g, b] = convert.hsv.rgb([h, hsvS, v]);
    props.handleClick(r, g, b);
  };

  return (
    <ColorElement
      {...props}
      getElementColor={getHsvElementColor(props.hsvMainElement, props.i, props.j, props.focusH, props.focusHsvS, props.focusV)}
      onClick={() => { handleClick(props.i, props.j); }}
    />
  );
};

const HslColorElement = (props: ColorElementProps) => {
  const getHslElementColor = (mainElement: 'H' | 'S' | 'L', i: number, j: number, focusH: number, focusS: number, focusL: number): string => {
    let isOnVerticalLine = false;
    let isOnHorizontalLine = false;

    switch (mainElement) {
      case 'H':
        isOnVerticalLine = (j * 100 / 64 >= focusS - 1.57) && (j * 100 / 64 < Math.round(focusS) + 0.01);
        isOnHorizontalLine = (100 - i * 100 / 64 >= focusL) && (100 - i * 100 / 64 < Math.round(focusL) + 1.6);
        return (
          isOnVerticalLine ?
            systemColors['K'] :
            isOnHorizontalLine ?
              systemColors['K'] :
              '#' + convert.hsl.hex([focusH, j * 100 / 64, 100 - i * 100 / 64])
        );
      case 'S':
        isOnVerticalLine = (j * 360 / 64 >= focusH - 5.7) && (j * 360 / 64 < Math.round(focusH) + 0.1);
        isOnHorizontalLine = (100 - i * 100 / 64 >= focusL) && (100 - i * 100 / 64 < Math.round(focusL) + 1.6);
        return (
          isOnVerticalLine ?
            systemColors['K'] :
            isOnHorizontalLine ?
              systemColors['W'] :
              '#' + convert.hsl.hex([j * 360 / 64, focusS, 100 - i * 100 / 64])
        );
      case 'L':
        const [x, y] = [j - 32 + 0.5, 32 - i - 0.5];
        const [radius, angle] = getPolarPosition(x, y);
        const isOnRadialLine =
          angle * 360 / (2 * Math.PI) > (focusH - 29 / radius) &&
          angle * 360 / (2 * Math.PI) < ((Math.round(focusH))) + 29 / radius;
        const isOnCircleLine =
          radius * 100 / 32 >= focusS - 1.8 &&
          radius * 100 / 32 < Math.round(focusS) + 1.4;
        return (
          radius > 32.05 ?
            systemColors['W'] :
            isOnRadialLine && !(x === 0 && y === 0) ?
              systemColors['K'] :
              isOnCircleLine ?
                systemColors['W'] :
                '#' + convert.hsl.hex([angle * 360 / (2 * Math.PI), radius * 100 / 32, focusL])
        );
      default:
        return '#000000';
    }
  };

  const handleClick = (i: number, j: number) => {
    let h = props.focusH;
    let s = props.focusS;
    let l = props.focusL;
    switch (props.hslMainElement) {
      case 'H':
        s = Math.round(j * 100 / 64);
        l = Math.round((64 - i) * 100 / 64);
        break;
      case 'S':
        h = j * 360 / 64;
        l = (64 - i) * 100 / 64;
        break;
      case 'L':
        const [x, y] = [j - 32, 32 - i];
        const [radius, angle] = getPolarPosition(x, y);
        h = angle * 360 / (2 * Math.PI);
        s = radius * 100 / 32;
        break;
    }
    const [r, g, b] = convert.hsl.rgb([h, s, l]);
    props.handleClick(r, g, b);
  };

  return (
    <ColorElement
      {...props}
      getElementColor={getHslElementColor(props.hslMainElement, props.i, props.j, props.focusH, props.focusS, props.focusL)}
      onClick={() => { handleClick(props.i, props.j); }}
    />
  );
};

const ColorElement = (props: ColorElementProps) => {
  const [isHovered, setIsHovered] = useState(false);
  if (!props.getElementColor || !props.onClick) {
    return null;
  }
  return (
    <div
      className='colorElement'
      style={{
        backgroundColor: props.getElementColor,
        opacity: isHovered ? 0.3 : 1,
        cursor: isActive(props.hsvMainElement, props.i, props.j) ? 'pointer' : 'default'
      }}
      onClick={props.onClick}
      onMouseOver={() => { setIsHovered(true); }}
      onMouseOut={() => { setIsHovered(false); }}
    />
  );
};

const getAngle = (x: number, y: number): number => {
  if (x > 0) {
    return Math.PI / 2 - Math.atan(y / Math.abs(x));
  } else if (x < 0) {
    return Math.PI * 3 / 2 + Math.atan(y / Math.abs(x));
  } else if (x === 0) {
    return y >= 0 ? 0 : Math.PI;
  }
  return 0;
};

const getRadius = (x: number, y: number): number => {
  return Math.sqrt(Math.pow((y), 2) + Math.pow((x), 2));
};

const getPolarPosition = (x: number, y: number): [number, number] => {
  const radius = getRadius(x, y);
  const angle = getAngle(x, y);
  return [radius, angle];
};

const isActive = (mainElement: 'H' | 'S' | 'V' | 'L', i: number, j: number): boolean => {
  const [x, y] = [j - 32 + 0.5, 32 - i - 0.5];
  const radius = getRadius(x, y);
  if (
    (mainElement === 'V' || mainElement === 'L')
    && radius > 32.05
  ) { return false; }
  else return true;
};

const StyledTwoDPicker = styled.div`
position:relative;
 .systemColorsquare{
  border: 1px solid #000000;
    width:320px;
    height:320px;
    .colorRow{
      display:flex;
      flex-direction:row;
    }
    .colorElement{
      height:5px;
      width:5px;
    }
 }
`;

