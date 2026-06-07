import ColorBridge from './ColorBridge';
import type { BridgeProps } from '../../../types/controlPane';
import type { ColorSpace } from '../../../types/color';
import HelpIcon from '../../common/HelpIcon';

interface OneDPickerProps extends BridgeProps {
  currentColor: { r: number; g: number; b: number };
  shape: ColorSpace;
  onColorSelect: (r: number, g: number, b: number) => void;
  onHelpClick?: (topic: string) => void;
}

const OneDPicker = (props: OneDPickerProps) => {
  return (
    <div className="controlPanel">
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          height: '24px',
        }}
      >
        <span style={{ fontWeight: 'bold', fontSize: '18px' }}>1D Picker</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          {props.onHelpClick && (
            <HelpIcon
              topic="1d_picker"
              onHelpClick={(topic) => {
                if (!props.isBridgeOpen) props.onBridgeOpenChange(true);
                props.onHelpClick!(topic);
              }}
            />
          )}
          <button
            className="showSlidersButton"
            onClick={() => props.onBridgeOpenChange(!props.isBridgeOpen)}
          >
            {props.isBridgeOpen ? '▲' : '▼'}
          </button>
        </div>
      </div>
      {props.isBridgeOpen && (
        <ColorBridge
          currentColor={props.currentColor}
          colorA={props.bridgeColorA}
          colorB={props.bridgeColorB}
          onSetColorA={props.onSetBridgeColorA}
          onSetColorB={props.onSetBridgeColorB}
          shape={props.shape}
          onColorSelect={props.onColorSelect}
        />
      )}
    </div>
  );
};

export default OneDPicker;
