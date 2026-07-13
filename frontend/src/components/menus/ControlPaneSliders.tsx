import { useState } from 'react';
import styled from 'styled-components';
import convert from 'color-convert';
import { PanelShell } from './PanelShell';
import TwoDPicker from './controls/TwoDPicker';
import RgbSliders from './controls/RgbSliders';
import CmykSliders from './controls/CmykSliders';
import HslSliders from './controls/HslSliders';
import HsbSliders from './controls/HsbSliders';
import type { ControlPaneProps } from '../../types/controlPane';
import '../../App.css';

/** RGB/CMYK/HSB/HSL sliders + TwoDPicker. Lab/LCH sliders live in OneDPickerPanel. */
export const ControlPaneSliders = (props: ControlPaneProps) => {
  const [liveRgb, setLiveRgb] = useState<{ r: number; g: number; b: number } | null>(null);

  // Live display values — derived from liveRgb while dragging, otherwise from committed props
  const lr = liveRgb?.r ?? props.focusR;
  const lg = liveRgb?.g ?? props.focusG;
  const lb = liveRgb?.b ?? props.focusB;

  let lh = props.focusH,
    ls = props.focusS,
    ll = props.focusL;
  let lhsbS = props.focusHsvS,
    lv = props.focusV;
  let lc = props.focusC,
    lm = props.focusM,
    ly = props.focusY,
    lk = props.focusK;

  if (liveRgb) {
    const ri = Math.round(lr),
      gi = Math.round(lg),
      bi = Math.round(lb);
    [lh, ls, ll] = convert.rgb.hsl([ri, gi, bi]);
    [, lhsbS, lv] = convert.rgb.hsv([ri, gi, bi]);
    [lc, lm, ly, lk] = convert.rgb.cmyk([ri, gi, bi]);
  }

  const liveProps = liveRgb
    ? {
        ...props,
        focusR: lr,
        focusG: lg,
        focusB: lb,
        focusH: lh,
        focusS: ls,
        focusL: ll,
        focusHsvS: lhsbS,
        focusV: lv,
        focusC: lc,
        focusM: lm,
        focusY: ly,
        focusK: lk,
      }
    : props;

  const onDragEnd = () => setLiveRgb(null);

  const onRgbLiveDrag = (channel: string, value: number) =>
    setLiveRgb({
      r: channel === 'R' ? value : lr,
      g: channel === 'G' ? value : lg,
      b: channel === 'B' ? value : lb,
    });

  const onHslLiveDrag = (channel: string, value: number) => {
    const h = channel === 'H' ? value : lh;
    const s = channel === 'S' ? value : ls;
    const l = channel === 'L' ? value : ll;
    const [r, g, b] = convert.hsl.rgb([h, s, l]) as [number, number, number];
    setLiveRgb({ r, g, b });
  };

  const onHsbLiveDrag = (channel: string, value: number) => {
    const h = channel === 'H' ? value : lh;
    const s = channel === 'HsvS' ? value : lhsbS;
    const v = channel === 'V' ? value : lv;
    const [r, g, b] = convert.hsv.rgb([h, s, v]) as [number, number, number];
    setLiveRgb({ r, g, b });
  };

  const onCmykLiveDrag = (channel: string, value: number) => {
    const c = channel === 'C' ? value : lc;
    const m = channel === 'M' ? value : lm;
    const y = channel === 'Y' ? value : ly;
    const k = channel === 'K' ? value : lk;
    const [r, g, b] = convert.cmyk.rgb([c, m, y, k]) as [number, number, number];
    setLiveRgb({ r, g, b });
  };

  return (
    <PanelShell>
      <SlidersSection>
        <RgbSliders
          {...liveProps}
          mainElement={props.rgbMainElement}
          setMainElement={props.setRgbMainElement}
          panelShape={'RGB'}
          onLiveDrag={onRgbLiveDrag}
          onDragEnd={onDragEnd}
        />
        {props.shape === 'RGB' && <TwoDPicker {...liveProps} />}
        <CmykSliders
          {...liveProps}
          mainElement={props.cmykMainElement}
          setMainElement={props.setCmykMainElement}
          panelShape={'CMYK'}
          onLiveDrag={onCmykLiveDrag}
          onDragEnd={onDragEnd}
        />
        {props.shape === 'CMYK' && <TwoDPicker {...liveProps} />}
        <HslSliders
          {...liveProps}
          mainElement={props.hslMainElement}
          setMainElement={props.setHslMainElement}
          panelShape={'HSL'}
          onLiveDrag={onHslLiveDrag}
          onDragEnd={onDragEnd}
        />
        {props.shape === 'HSL' && <TwoDPicker {...liveProps} />}
        <HsbSliders
          {...liveProps}
          mainElement={props.hsbMainElement}
          setMainElement={props.setHsvMainElement}
          panelShape={'HSB'}
          onLiveDrag={onHsbLiveDrag}
          onDragEnd={onDragEnd}
        />
        {props.shape === 'HSB' && <TwoDPicker {...liveProps} />}
      </SlidersSection>
    </PanelShell>
  );
};

const SlidersSection = styled.div``;

export default ControlPaneSliders;
