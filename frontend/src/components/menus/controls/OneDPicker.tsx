import ColorBridge from './ColorBridge';
import type { ControlPaneProps } from '../../../types/controlPane';
import HelpIcon from '../../common/HelpIcon';

/**
 * The 1D picker: colors along the path between two endpoints in the active color space.
 * Shown right below the active space's panel; opens and closes like the other panels, and the
 * 3D view draws the path only while it is open.
 */
const OneDPicker = (props: ControlPaneProps) => {
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
        <span style={{ fontWeight: 600, fontSize: '16px' }}>1D Picker</span>
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
          currentColor={{ r: props.focusR, g: props.focusG, b: props.focusB }}
          colorA={props.bridgeColorA}
          colorB={props.bridgeColorB}
          onSetColorA={props.onSetBridgeColorA}
          onSetColorB={props.onSetBridgeColorB}
          shape={props.shape}
          onColorSelect={props.handleClick}
        />
      )}
    </div>
  );
};

export default OneDPicker;
