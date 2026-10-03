import { useEffect, useState } from 'react';

/**
 * Step counter for slides that draw themselves along with the narration.
 * stepAtMs[i] is when step i starts, counted from when the slide appears.
 * Starts at -1 (nothing drawn yet) so that step 0 also fades in.
 */
export const useSlideStep = (stepAtMs: readonly number[]) => {
  const [step, setStep] = useState(-1);
  useEffect(() => {
    const timers = stepAtMs.map((ms, i) => setTimeout(() => setStep(i), ms + 50));
    return () => timers.forEach(clearTimeout);
  }, [stepAtMs]);
  return step;
};

/** Style that fades an element in when `on` becomes true */
export const fade = (on: boolean, delayMs = 0) => ({
  opacity: on ? 1 : 0,
  transition: `opacity 600ms ease ${delayMs}ms`,
});

/** For paths with pathLength={1}: the stroke grows from the path's start to its end */
export const draw = (on: boolean, delayMs = 0, durationMs = 900) => ({
  strokeDasharray: 1,
  strokeDashoffset: on ? 0 : 1,
  transition: `stroke-dashoffset ${durationMs}ms ease ${delayMs}ms`,
});
