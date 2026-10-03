import { useTranslation } from 'react-i18next';
import { coneResponse } from './coneFundamentals';
import {
  type Cone,
  type Levels,
  LevelLines,
  PickedLight,
  ResponseMarks,
  StagedChart,
  X0,
  X1,
  X1_WITH_RIGHT_AXIS,
} from './coneStagedChart';
import { useSlideStep } from './slideAnimation';

/**
 * The slide draws itself in steps that follow the narration (the topic's s1 in
 * backend/app/services/prompts/topics/). STEP_AT_MS[i] is when step i starts, counted from
 * when the slide appears. Every slide built on this component shares the same narration shape.
 */
const STEP = {
  topFrame: 0, // "Mixing A and B looks like C because"
  topCurves: 1, // "the cones respond to C the same way as to A and B together."
  singlePick: 2, // "This color is C."
  singleResponse: 3, // "When we see C, the L, M and S cones respond like this."
  bottomFrame: 4, // "With A and B light mixed, on the other hand,"
  mixCircle: 5, // "to each of A and B"
  mixPick: 6, // "the L, M and S cones respond."
  // "It is really a different light from C, but the balance of the cone responses
  // is the same, so A and B mixed look C."
  // In split mode the lines to the left axis come first, then those to the right axis.
  mixResponse: 7,
} as const;
const STEP_AT_MS = [0, 3500, 10000, 13000, 19500, 23000, 25000, 28500];

const RIGHT_AXIS_DELAY_MS = 1700;
const TOP_Y_BASE = 106;
const BOTTOM_Y_BASE = 266;

export interface SlideLight {
  nm: number;
  color: string;
  /** i18n key under educational.<topicId> */
  labelKey: string;
}

interface MixedLightSlideProps {
  /** Topic id; i18n keys live under educational.<topicId> */
  topicId: string;
  /** The single-wavelength light that the mix looks like (top chart) */
  single: SlideLight;
  /** The two lights that are mixed (bottom chart) */
  mix: readonly [SlideLight, SlideLight];
  /**
   * How the bottom chart shows the cone responses to the mix:
   * - total: one set of lines to the left Y axis at the total response, each drawn from the
   *   light (index into `mix`) given in `levelFrom`
   * - split: mix[0]'s own responses go to the left Y axis, then mix[1]'s to a right Y axis;
   *   the narration asks the viewer to add them up
   */
  mixLines: { kind: 'total'; levelFrom: Record<Cone, 0 | 1> } | { kind: 'split' };
}

/**
 * "Why does mixing A and B light look like C?": the cone responses to a single C light (top)
 * next to those to A + B mixed (bottom), drawn step by step along with the narration.
 */
const MixedLightSlide = ({ topicId, single, mix, mixLines }: MixedLightSlideProps) => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.${topicId}.${key}`);

  const step = useSlideStep(STEP_AT_MS);

  // Cone responses (CIE 2006 data) to the single light, to each mixed light and to the mix
  const singleHits = coneResponse(single.nm);
  const mixHits = [coneResponse(mix[0].nm), coneResponse(mix[1].nm)] as const;
  const total: Levels = {
    L: mixHits[0].L + mixHits[1].L,
    M: mixHits[0].M + mixHits[1].M,
    S: mixHits[0].S + mixHits[1].S,
  };
  const split = mixLines.kind === 'split';
  const x1 = split ? X1_WITH_RIGHT_AXIS : X1;
  const fromNm = (levelFrom: Record<Cone, 0 | 1>) => ({
    L: mix[levelFrom.L].nm,
    M: mix[levelFrom.M].nm,
    S: mix[levelFrom.S].nm,
  });
  const allFrom = (i: 0 | 1) => fromNm({ L: i, M: i, S: i });

  return (
    <div style={{ padding: '12px 8px', fontFamily: 'sans-serif' }}>
      <h3 style={{ margin: '0 0 8px', fontSize: '19px', fontWeight: 700, textAlign: 'center' }}>
        {k('title')}
      </h3>

      <svg
        viewBox="0 0 230 320"
        width="100%"
        style={{
          display: 'block',
          maxWidth: '260px',
          margin: '0 auto',
          background: '#f7f8fb',
          borderRadius: '8px',
        }}
      >
        {/* top: a single light */}
        <StagedChart
          x1={x1}
          yBase={TOP_Y_BASE}
          idPrefix={`${topicId}-top`}
          bands={[{ nm: single.nm, color: single.color, label: k(single.labelKey) }]}
          sensitivityLabel={k('sensitivity')}
          wavelengthLabel={k('wavelength')}
          showFrame={step >= STEP.topFrame}
          showCurves={step >= STEP.topCurves}
        />
        <PickedLight
          x1={x1}
          nm={single.nm}
          yBase={TOP_Y_BASE}
          hits={singleHits}
          circled={step >= STEP.singlePick}
          raised={step >= STEP.singlePick}
        />
        <LevelLines
          x1={x1}
          levels={singleHits}
          fromNm={{ L: single.nm, M: single.nm, S: single.nm }}
          axisX={X0}
          yBase={TOP_Y_BASE}
          visible={step >= STEP.singleResponse}
        />
        <ResponseMarks
          axisX={X0}
          levels={singleHits}
          yBase={TOP_Y_BASE}
          visible={step >= STEP.singleResponse}
          delayMs={800}
        />

        {/* bottom: two lights mixed */}
        <StagedChart
          x1={x1}
          yBase={BOTTOM_Y_BASE}
          idPrefix={`${topicId}-bottom`}
          bands={mix.map((light) => ({
            nm: light.nm,
            color: light.color,
            label: k(light.labelKey),
          }))}
          sensitivityLabel={k('sensitivity')}
          wavelengthLabel={k('wavelength')}
          showFrame={step >= STEP.bottomFrame}
          showCurves={step >= STEP.bottomFrame}
          rightAxis={split}
        />
        {mix.map((light, i) => (
          <PickedLight
            key={light.nm}
            x1={x1}
            nm={light.nm}
            yBase={BOTTOM_Y_BASE}
            hits={mixHits[i]}
            circled={step >= STEP.mixCircle}
            raised={step >= STEP.mixPick}
          />
        ))}
        {mixLines.kind === 'total' ? (
          <>
            <LevelLines
              x1={x1}
              levels={total}
              fromNm={fromNm(mixLines.levelFrom)}
              axisX={X0}
              yBase={BOTTOM_Y_BASE}
              visible={step >= STEP.mixResponse}
            />
            <ResponseMarks
              axisX={X0}
              levels={total}
              yBase={BOTTOM_Y_BASE}
              visible={step >= STEP.mixResponse}
              delayMs={800}
            />
          </>
        ) : (
          <>
            <LevelLines
              x1={x1}
              levels={mixHits[0]}
              fromNm={allFrom(0)}
              axisX={X0}
              yBase={BOTTOM_Y_BASE}
              visible={step >= STEP.mixResponse}
            />
            <ResponseMarks
              axisX={X0}
              levels={mixHits[0]}
              yBase={BOTTOM_Y_BASE}
              visible={step >= STEP.mixResponse}
              delayMs={800}
            />
            <LevelLines
              x1={x1}
              levels={mixHits[1]}
              fromNm={allFrom(1)}
              axisX={x1}
              yBase={BOTTOM_Y_BASE}
              visible={step >= STEP.mixResponse}
              delayMs={RIGHT_AXIS_DELAY_MS}
            />
            <ResponseMarks
              axisX={x1}
              levels={mixHits[1]}
              yBase={BOTTOM_Y_BASE}
              visible={step >= STEP.mixResponse}
              delayMs={RIGHT_AXIS_DELAY_MS + 800}
            />
          </>
        )}
      </svg>
    </div>
  );
};

export default MixedLightSlide;
