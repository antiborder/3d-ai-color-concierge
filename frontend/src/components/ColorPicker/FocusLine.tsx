import React from 'react';
import StraightLine from './StraightLine';
import Circle from './Circle';
import { systemColors } from '../../constants/systemColors';
import { hslCylinderHeight, hsbCylinderHeight } from '../../utils/colorSpacePositions';
import type {
  StructureProps,
  PositionFunction,
  RescaleHslFunction,
  CylindricalToCartesianFunction,
} from '../../types/structure';

interface FocusLineProps extends StructureProps {
  getRgbPosition: PositionFunction;
  getHslPosition: PositionFunction;
  getHsbPosition: PositionFunction;
  rescaleHsl: RescaleHslFunction;
  cylindricalToCartesian: CylindricalToCartesianFunction;
  cylinderRadius: number;
  cylinderHeight: number;
}

const FocusLine = (props: FocusLineProps) => {
  const [rescaledH, rescaledS, rescaledL] = props.rescaleHsl(
    props.focusH,
    props.focusS,
    props.focusL
  );
  const rescaledHsvS = props.rescaleHsl(props.focusH, props.focusHsvS, props.focusV)[1];
  const rescaledV = props.rescaleHsl(props.focusH, props.focusHsvS, props.focusV)[2];

  return (
    <>
      {props.shape === 'RGB' && (
        <>
          {props.rgbMainElement !== 'R' && (
            <StraightLine
              points={[
                props.getRgbPosition(0, props.focusG, props.focusB),
                props.getRgbPosition(255, props.focusG, props.focusB),
              ]}
              color={systemColors[props.rgbMainElement === 'G' ? 'B' : 'G']}
            />
          )}

          {props.rgbMainElement !== 'G' && (
            <StraightLine
              points={[
                props.getRgbPosition(props.focusR, 0, props.focusB),
                props.getRgbPosition(props.focusR, 255, props.focusB),
              ]}
              color={systemColors[props.rgbMainElement === 'B' ? 'R' : 'B']}
            />
          )}

          {props.rgbMainElement !== 'B' && (
            <StraightLine
              points={[
                props.getRgbPosition(props.focusR, props.focusG, 0),
                props.getRgbPosition(props.focusR, props.focusG, 255),
              ]}
              color={systemColors[props.rgbMainElement === 'R' ? 'G' : 'R']}
            />
          )}
        </>
      )}
      {props.shape === 'CMYK' && (
        <>
          {props.cmykMainElement !== 'C' && (
            <StraightLine
              points={[
                props.getRgbPosition(0, props.focusG, props.focusB),
                props.getRgbPosition(255, props.focusG, props.focusB),
              ]}
              color={systemColors[props.cmykMainElement === 'M' ? 'Y' : 'M']}
            />
          )}
          {props.cmykMainElement !== 'M' && (
            <StraightLine
              points={[
                props.getRgbPosition(props.focusR, 0, props.focusB),
                props.getRgbPosition(props.focusR, 255, props.focusB),
              ]}
              color={systemColors[props.cmykMainElement === 'Y' ? 'C' : 'Y']}
            />
          )}
          {props.cmykMainElement !== 'Y' && (
            <StraightLine
              points={[
                props.getRgbPosition(props.focusR, props.focusG, 0),
                props.getRgbPosition(props.focusR, props.focusG, 255),
              ]}
              color={systemColors[props.cmykMainElement === 'C' ? 'M' : 'C']}
            />
          )}
        </>
      )}

      {props.shape === 'HSL' && (() => {
        const rescaledL_hsl = ((props.focusL - 50) / 100) * hslCylinderHeight;
        const biconeScale = 1 - Math.abs((2 * props.focusL) / 100 - 1);
        return (
          <>
            {props.hslMainElement !== 'H' && (
              <Circle
                radius={rescaledS * biconeScale}
                position={[0, 0, rescaledL_hsl]}
                color={systemColors['W']}
              />
            )}
            {props.hslMainElement !== 'S' && (
              <StraightLine
                points={[
                  props.cylindricalToCartesian(rescaledH, 0, rescaledL_hsl),
                  props.cylindricalToCartesian(rescaledH, props.cylinderRadius * biconeScale, rescaledL_hsl),
                ]}
                color={systemColors['K']}
              />
            )}
            {props.hslMainElement !== 'L' && (
              <>
                <StraightLine
                  points={[
                    props.cylindricalToCartesian(rescaledH, 0, -hslCylinderHeight / 2),
                    props.cylindricalToCartesian(rescaledH, rescaledS, 0),
                  ]}
                  color={systemColors['DEEP_GRAY']}
                />
                <StraightLine
                  points={[
                    props.cylindricalToCartesian(rescaledH, rescaledS, 0),
                    props.cylindricalToCartesian(rescaledH, 0, hslCylinderHeight / 2),
                  ]}
                  color={systemColors['DEEP_GRAY']}
                />
              </>
            )}
          </>
        );
      })()}
      {props.shape === 'HSB' && (() => {
        const rescaledV_hsb = (props.focusV / 100 - 0.5) * hsbCylinderHeight;
        return (
          <>
            {props.hsbMainElement !== 'H' && (
              <Circle
                radius={rescaledHsvS * (props.focusV / 100)}
                position={[0, 0, rescaledV_hsb]}
                color={systemColors['W']}
              />
            )}
            {props.hsbMainElement !== 'S' && (
              <StraightLine
                points={[
                  props.cylindricalToCartesian(rescaledH, 0, rescaledV_hsb),
                  props.cylindricalToCartesian(rescaledH, props.cylinderRadius * (props.focusV / 100), rescaledV_hsb),
                ]}
                color={systemColors['K']}
              />
            )}
            {props.hsbMainElement !== 'V' && (
              <StraightLine
                points={[
                  props.cylindricalToCartesian(rescaledH, 0, -hsbCylinderHeight / 2),
                  props.cylindricalToCartesian(rescaledH, props.cylinderRadius, hsbCylinderHeight / 2),
                ]}
                color={systemColors['DEEP_GRAY']}
              />
            )}
          </>
        );
      })()}
    </>
  );
};

export default FocusLine;
