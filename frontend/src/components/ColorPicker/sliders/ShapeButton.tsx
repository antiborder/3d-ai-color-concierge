import { useState } from 'react';
import type { ControlPaneProps } from '../../../types/controlPane';
import type { ColorSpace } from '../../../types/color';

interface ShapeButtonProps extends ControlPaneProps {
  setIsVisible: (visible: boolean) => void;
  shapeName: ColorSpace;
  content: string;
}

const ShapeButton = (props: ShapeButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const handlePointerOver = () => {
    setIsHovered(true);
  };
  const handlePointerOut = () => {
    setIsHovered(false);
  };
  return (
    <>
      <div style={{ height: '24px' }}>
        <button
          className={props.shape === props.shapeName ? 'selectedShapeButton' : 'shapeButton'}
          onClick={() => {
            props.setIsVisible(true);
            props.onShapeClick(props.shapeName);
          }}
          onPointerOver={() => handlePointerOver()}
          onPointerOut={() => handlePointerOut()}
        >
          {props.shapeName}
        </button>
        {isHovered && props.content && <div className="shapeBubble">{props.content}</div>}
      </div>
    </>
  );
};

export default ShapeButton;
