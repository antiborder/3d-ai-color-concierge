import { useState } from 'react';
import styled from 'styled-components';
import { PanelShell } from './PanelShell';
import LabSliders from './controls/LabSliders';
import LchSliders from './controls/LchSliders';
import TwoDPicker from './controls/TwoDPicker';
import ColorDifferencePanel from './controls/ColorDifferencePanel';
import type { ControlPaneProps } from '../../types/controlPane';

const LabLchPanel = (props: ControlPaneProps) => {
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
        <LabSliders {...interceptedProps} />
        {props.shape === 'Lab' && <TwoDPicker {...liveProps} />}
        <LchSliders {...interceptedProps} />
        {props.shape === 'LCH' && <TwoDPicker {...liveProps} />}
        <ColorDifferencePanel
          currentColor={{ r: liveProps.focusR, g: liveProps.focusG, b: liveProps.focusB }}
          onHelpClick={props.onHelpClick}
        />
      </Section>
    </PanelShell>
  );
};

const Section = styled.div``;

export default LabLchPanel;
