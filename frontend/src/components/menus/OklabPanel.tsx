import { useState } from 'react';
import styled from 'styled-components';
import { PanelShell } from './PanelShell';
import LmsSliders from './controls/LmsSliders';
import OkLabSliders from './controls/OkLabSliders';
import OklchSliders from './controls/OklchSliders';
import TwoDPicker from './controls/TwoDPicker';
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

  return (
    <PanelShell>
      <Section>
        <LmsSliders {...interceptedProps} />
        <OkLabSliders {...interceptedProps} />
        <OklchSliders {...interceptedProps} />
        {props.shape === 'OKLCH' && <TwoDPicker {...liveProps} />}
      </Section>
    </PanelShell>
  );
};

const Section = styled.div``;

export default OklabPanel;
