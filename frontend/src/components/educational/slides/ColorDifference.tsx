import { useTranslation } from 'react-i18next';
import { labToRgb } from '../../../utils/gamutUtils';
import { rgb } from '../slideColors';
import { fade, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/color_difference.py); each step starts on the word in [ ].
 */
const STEP = {
  intro: 0, // "[色差は]、2つの色の違いを数値で表したもので、ΔEと書きます。"
  lab: 1, // "[LabやOKLab]の空間での、2点の距離として計算します。"
  small: 2, // "ΔEが[およそ1]なら、並べてもほとんど区別できず、"
  large: 3, // "[数が大きく]なるほど、はっきり違う色に見えます。"
  uses: 4, // "[印刷物]や製品の色が、指定どおりに作れているかを確かめるのに使われます。"
} as const;
// When each step's words are spoken, counted from when the slide appears. Estimated from the
// reading (kana) of the Japanese narration at 8 morae/s, with pauses at 、(0.25 s) ・(0.15 s)
// 。(0.5 s) and 0.6 s before speech starts — calibrated on the hand-tuned RGB slide.
const STEP_AT_MS = [600, 6200, 11700, 15000, 18800];

// Two rounded panels: a color next to colors ΔE away (top), where it is used (bottom)
const TOP_PANEL = { y: 0, height: 202 };
const BOTTOM_PANEL = { y: 210, height: 100 };

// A base color and colors ΔE away from it in Lab (moving a* only, so the distance is exactly ΔE)
const BASE_LAB: [number, number, number] = [62, 30, 50];
const BASE = labToRgb(...BASE_LAB);
const STEPS_DE = [
  { de: 1, key: 'de1', step: STEP.small },
  { de: 3, key: 'de3', step: STEP.small },
  { de: 10, key: 'de10', step: STEP.large },
  { de: 30, key: 'de30', step: STEP.large },
];
const ROW = { y0: 46, pitch: 35, size: 28, x0: 26 };

const ColorDifference = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.color_difference.${key}`);
  const step = useSlideStep(STEP_AT_MS);

  return (
    <div style={{ padding: '12px 8px', fontFamily: 'sans-serif' }}>
      <h3 style={{ margin: '0 0 8px', fontSize: '19px', fontWeight: 700, textAlign: 'center' }}>
        {k('title')}
      </h3>

      <svg
        viewBox="0 0 230 310"
        width="100%"
        style={{ display: 'block', maxWidth: '260px', margin: '0 auto' }}
      >
        {[TOP_PANEL, BOTTOM_PANEL].map((panel) => (
          <rect
            key={panel.y}
            x="0"
            y={panel.y}
            width="230"
            height={panel.height}
            rx="8"
            fill="#f7f8fb"
          />
        ))}

        {/* ── top: the base color next to colors ΔE away ── */}
        <text
          x="115"
          y="18"
          textAnchor="middle"
          fontSize="13"
          fontWeight="bold"
          fill="#333"
          style={fade(step >= STEP.intro)}
        >
          {k('what')}
        </text>
        <text
          x="115"
          y="35"
          textAnchor="middle"
          fontSize="12"
          fill="#666"
          style={fade(step >= STEP.lab)}
        >
          {k('lab')}
        </text>
        {STEPS_DE.map((s, i) => {
          const y = ROW.y0 + i * ROW.pitch;
          const other = labToRgb(BASE_LAB[0], BASE_LAB[1] + s.de, BASE_LAB[2]);
          return (
            <g key={s.key} style={fade(step >= s.step, (i % 2) * 400)}>
              <rect x={ROW.x0} y={y} width={ROW.size} height={ROW.size} fill={rgb(BASE)} />
              <rect
                x={ROW.x0 + ROW.size}
                y={y}
                width={ROW.size}
                height={ROW.size}
                fill={rgb(other)}
              />
              <text
                x={ROW.x0 + 2 * ROW.size + 12}
                y={y + 13}
                fontSize="13"
                fontWeight="bold"
                fill="#333"
              >
                ΔE {s.de}
              </text>
              <text x={ROW.x0 + 2 * ROW.size + 12} y={y + 27} fontSize="12" fill="#666">
                {k(s.key)}
              </text>
            </g>
          );
        })}

        {/* ── bottom: checking colors against the specified one ── */}
        <g style={fade(step >= STEP.uses)}>
          {['print', 'product'].map((key, i) => (
            <g key={key}>
              <rect
                x={16 + i * 104}
                y={BOTTOM_PANEL.y + 12}
                width="94"
                height="30"
                rx="15"
                fill="#fff"
                stroke="#ccc"
              />
              <text
                x={16 + i * 104 + 47}
                y={BOTTOM_PANEL.y + 32}
                textAnchor="middle"
                fontSize="13"
                fill="#333"
              >
                {k(key)}
              </text>
            </g>
          ))}
          <text x="115" y={BOTTOM_PANEL.y + 70} textAnchor="middle" fontSize="12" fill="#555">
            {k('check')}
          </text>
        </g>
      </svg>
    </div>
  );
};

export default ColorDifference;
