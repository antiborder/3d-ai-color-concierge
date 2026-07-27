import { useState } from 'react';
import styled from 'styled-components';
import { PanelShell } from './PanelShell';
import LmsSliders from './controls/LmsSliders';
import OkLabSliders from './controls/OkLabSliders';
import OklchSliders from './controls/OklchSliders';
import TwoDPicker from './controls/TwoDPicker';
import ColorDifferencePanel from './controls/ColorDifferencePanel';
import type { ControlPaneProps } from '../../types/controlPane';

const OklabPanel = (props: ControlPaneProps) => {
  const [liveRgb, setLiveRgb] = useState<{ r: number; g: number; b: number } | null>(null);

  const handlePreviewRgb = (r: number, g: number, b: number) => {
    setLiveRgb({ r, g, b });
    props.onPreviewRgb?.(r, g, b);
  };

  const handleClearPreviewRgb = () => {
    setLiveRgb(null);
    props.onClearPreviewRgb?.();
  };

  const interceptedProps = {
    ...props,
    onPreviewRgb: handlePreviewRgb,
    onClearPreviewRgb: handleClearPreviewRgb,
  };

  const liveProps = liveRgb
    ? { ...interceptedProps, focusR: liveRgb.r, focusG: liveRgb.g, focusB: liveRgb.b }
    : interceptedProps;

  const bgHex = (props.sceneBackgroundColor ?? '#000000').replace('#', '');
  const referenceColor = {
    r: parseInt(bgHex.slice(0, 2), 16),
    g: parseInt(bgHex.slice(2, 4), 16),
    b: parseInt(bgHex.slice(4, 6), 16),
  };

  return (
    <PanelShell>
      <Section>
        <LmsSliders {...interceptedProps} />
        <OkLabSliders {...interceptedProps} />
        <OklchSliders {...interceptedProps} />
        {props.shape === 'OKLCH' && <TwoDPicker {...liveProps} />}
        <ColorDifferencePanel
          currentColor={
            props.colorTarget === 'background'
              ? props.selectedRgb
              : { r: liveProps.focusR, g: liveProps.focusG, b: liveProps.focusB }
          }
          referenceColor={referenceColor}
          colorTarget={props.colorTarget}
          onColorTargetChange={props.onColorTargetChange}
          onUnlinkColors={() => props.onColorsLinkedChange(false)}
          onHelpClick={props.onHelpClick}
        />
      </Section>
    </PanelShell>
  );
};

const Section = styled.div``;

export default OklabPanel;
