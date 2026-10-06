import { useTranslation } from 'react-i18next';
import { fade, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/hex_code.py); each step starts on the word in [ ].
 */
const STEP = {
  code: 0, // "[HEXコードは]、色をシャープと6桁の英数字で表す書き方です。"
  groupR: 1, // "2桁ずつ、[赤]・"
  groupG: 2, // "[緑]・"
  groupB: 3, // "[青]の強さを表します。"
  oneDigit: 4, // "[1桁は]0から9とAからFの16種類で、"
  twoDigits: 5, // "[2桁で]16かける16の256段階、"
  range: 6, // "[つまり]0から255を表せます。"
  valueR: 7, // "例えばこのコードでは、[赤が]FFで255、"
  valueG: 8, // "[緑が]80で128、"
  valueB: 9, // "[青が]00で0なので、"
  swatch: 10, // "[オレンジ]になります。"
} as const;
// When each step's words are spoken, counted from when the slide appears. Estimated from the
// reading (kana) of the Japanese narration at 8 morae/s, with pauses at 、(0.25 s) ・(0.15 s)
// 。(0.5 s) and 0.6 s before speech starts — calibrated on the hand-tuned RGB slide.
const STEP_AT_MS = [600, 6700, 7100, 7600, 9800, 13400, 17200, 21900, 24000, 26300, 28200];

// Two rounded panels: the code split into R, G, B (top), how two hex digits count (bottom)
const TOP_PANEL = { y: 0, height: 178 };
const BOTTOM_PANEL = { y: 186, height: 124 };

// The code is drawn one group at a time in a monospace font, each squeezed to a fixed width
const CODE = { y: 58, fontSize: 36, charWidth: 21.6 };
const CODE_X0 = 115 - (7 * CODE.charWidth) / 2;
const GROUPS = [
  { key: 'R', hex: 'ff', value: 255, color: '#e01a00', group: STEP.groupR, valueStep: STEP.valueR },
  { key: 'G', hex: '80', value: 128, color: '#00a848', group: STEP.groupG, valueStep: STEP.valueG },
  { key: 'B', hex: '00', value: 0, color: '#2a5cff', group: STEP.groupB, valueStep: STEP.valueB },
];
const groupX = (i: number) => CODE_X0 + CODE.charWidth * (1 + 2 * i);
const EXAMPLE_HEX = '#ff8000';
const SWATCH = { x: 95, y: 122, size: 40 };

// Bottom rows
const ROWS = {
  labelX: 12,
  textX: 64,
  y: [BOTTOM_PANEL.y + 30, BOTTOM_PANEL.y + 60, BOTTOM_PANEL.y + 88],
};
const MONO = 'Menlo, Consolas, "Courier New", monospace';

const HexCode = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.hex_code.${key}`);
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

        {/* ── top: # and three pairs of digits ── */}
        <g style={fade(step >= STEP.code)}>
          <text
            x={CODE_X0}
            y={CODE.y}
            fontSize={CODE.fontSize}
            fontFamily={MONO}
            fill="#333"
            textLength={CODE.charWidth}
            lengthAdjust="spacingAndGlyphs"
          >
            #
          </text>
          {GROUPS.map((g, i) => (
            <text
              key={g.key}
              x={groupX(i)}
              y={CODE.y}
              fontSize={CODE.fontSize}
              fontFamily={MONO}
              fontWeight="bold"
              textLength={CODE.charWidth * 2}
              lengthAdjust="spacingAndGlyphs"
              style={{ fill: step >= g.group ? g.color : '#333', transition: 'fill 500ms ease' }}
            >
              {g.hex}
            </text>
          ))}
        </g>

        {GROUPS.map((g, i) => {
          const cx = groupX(i) + CODE.charWidth;
          return (
            <g key={g.key}>
              <g style={fade(step >= g.group)}>
                <rect
                  x={groupX(i) + 2}
                  y={CODE.y + 8}
                  width={CODE.charWidth * 2 - 4}
                  height="4"
                  rx="2"
                  fill={g.color}
                />
                <text
                  x={cx}
                  y={CODE.y + 28}
                  textAnchor="middle"
                  fontSize="14"
                  fontWeight="bold"
                  fill={g.color}
                >
                  {g.key}
                </text>
              </g>
              <text
                x={cx}
                y={CODE.y + 50}
                textAnchor="middle"
                fontSize="15"
                fontWeight="bold"
                fill="#333"
                style={fade(step >= g.valueStep)}
              >
                {g.value}
              </text>
            </g>
          );
        })}
        <rect
          x={SWATCH.x}
          y={SWATCH.y}
          width={SWATCH.size}
          height={SWATCH.size}
          rx="6"
          fill={EXAMPLE_HEX}
          style={fade(step >= STEP.swatch)}
        />

        {/* ── bottom: one digit has 16 values, two digits 256 ── */}
        <g style={fade(step >= STEP.oneDigit)}>
          <text x={ROWS.labelX} y={ROWS.y[0]} fontSize="13" fontWeight="bold" fill="#333">
            {k('oneDigit')}
          </text>
          <text x={ROWS.textX} y={ROWS.y[0]} fontSize="15" fontFamily={MONO} fill="#555">
            0123456789
            <tspan fill="#d06000" fontWeight="bold">
              abcdef
            </tspan>
          </text>
        </g>
        <g style={fade(step >= STEP.twoDigits)}>
          <text x={ROWS.labelX} y={ROWS.y[1]} fontSize="13" fontWeight="bold" fill="#333">
            {k('twoDigits')}
          </text>
          <text x={ROWS.textX} y={ROWS.y[1]} fontSize="14" fill="#333">
            {k('levels')}
          </text>
        </g>
        <text
          x={ROWS.textX}
          y={ROWS.y[2]}
          fontSize="14"
          fill="#333"
          style={fade(step >= STEP.range)}
        >
          <tspan fontFamily={MONO}>00</tspan> 〜 <tspan fontFamily={MONO}>ff</tspan> ＝ 0 〜 255
        </text>
      </svg>
    </div>
  );
};

export default HexCode;
