import type { ControlPaneProps } from '../../../types/controlPane';
import ShapeButton from './ShapeButton';

const MunsellPanel = (props: ControlPaneProps) => {
  return (
    <div className="controlPanel">
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          width: '100%',
          height: '24px',
        }}
      >
        <ShapeButton
          {...props}
          setIsVisible={() => {}}
          shapeName={'LCH'}
          content={'CIE LCH (Lightness / Chroma / Hue) coordinate space'}
        />
      </div>
    </div>
  );
};

export default MunsellPanel;
