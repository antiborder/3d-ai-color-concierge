import { useTranslation } from 'react-i18next';
import { fade, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/color_proportion.py); each step starts on the word in [ ].
 */
const STEP = {
  intro: 0, // "[配色は]、ベースカラー、メインカラー、アクセントカラーの3つの役割で考えると、まとまりやすくなります。"
  base: 1, // "[ベースは]背景など広い面に使う色、"
  main: 2, // "[メインは]主役の色、"
  accent: 3, // "[アクセントは]目を引くために少しだけ使う色です。"
  ratio: 4, // "[比率は]、70対25対5が目安です。"
  result: 5, // "[アクセントを少し]に抑えることで、全体はまとまり、大事なところが目立ちます。"
} as const;
// When each step's words are spoken, counted from when the slide appears. Estimated from the
// reading (kana) of the Japanese narration at 8 morae/s, with pauses at 、(0.25 s) ・(0.15 s)
// 。(0.5 s) and 0.6 s before speech starts — calibrated on the hand-tuned RGB slide.
const STEP_AT_MS = [600, 8600, 11500, 13000, 16600, 20200];

// Two rounded panels: the three roles (top), the ratio and two layouts (bottom)
const TOP_PANEL = { y: 0, height: 142 };
const BOTTOM_PANEL = { y: 150, height: 160 };

const BASE = '#f3efe6';
const MAIN = '#2f4a6d';
const ACCENT = '#e8743b';
const ROLES = [
  { key: 'base', color: BASE, step: STEP.base },
  { key: 'main', color: MAIN, step: STEP.main },
  { key: 'accent', color: ACCENT, step: STEP.accent },
];
const ROLE = { y0: 12, pitch: 42, swatch: 26, x0: 18 };

// The ratio bar (the numbers come from the text: 70/25/5 in Japanese, 60/30/10 in English)
const BAR = { x0: 16, w: 198, y: BOTTOM_PANEL.y + 12, h: 22 };

// Two small layouts: colors used evenly vs in proportion
const CARD = { y: BOTTOM_PANEL.y + 50, w: 90, h: 62, xs: [20, 120] };

const ColorProportion = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.color_proportion.${key}`);
  const step = useSlideStep(STEP_AT_MS);
  const ratios = t('educational.color_proportion.ratios', { returnObjects: true }) as number[];

  const [even, good] = CARD.xs;
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

        {/* ── top: the three roles (faint until each is named) ── */}
        {ROLES.map((r, i) => {
          const y = ROLE.y0 + i * ROLE.pitch;
          const shown = step >= r.step;
          return (
            <g
              key={r.key}
              style={{
                opacity: shown ? 1 : step >= STEP.intro ? 0.3 : 0,
                transition: 'opacity 600ms ease',
              }}
            >
              <rect
                x={ROLE.x0}
                y={y}
                width={ROLE.swatch}
                height={ROLE.swatch}
                rx="5"
                fill={r.color}
                stroke="#ccc"
              />
              <text
                x={ROLE.x0 + ROLE.swatch + 10}
                y={y + 11}
                fontSize="14"
                fontWeight="bold"
                fill="#333"
              >
                {k(r.key)}
              </text>
              <text x={ROLE.x0 + ROLE.swatch + 10} y={y + 26} fontSize="12" fill="#666">
                {k(`${r.key}Note`)}
              </text>
            </g>
          );
        })}

        {/* ── bottom: the ratio ── */}
        <g style={fade(step >= STEP.ratio)}>
          {ROLES.map((r, i) => {
            const before = ratios.slice(0, i).reduce((s, v) => s + v, 0);
            const x = BAR.x0 + (before / 100) * BAR.w;
            const w = (ratios[i] / 100) * BAR.w;
            return (
              <g key={r.key}>
                <rect x={x} y={BAR.y} width={w} height={BAR.h} fill={r.color} />
                {ratios[i] >= 15 && (
                  <text
                    x={x + w / 2}
                    y={BAR.y + 15}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="bold"
                    fill={r.key === 'base' ? '#333' : '#fff'}
                  >
                    {ratios[i]}%
                  </text>
                )}
              </g>
            );
          })}
          <rect
            x={BAR.x0}
            y={BAR.y}
            width={BAR.w}
            height={BAR.h}
            rx="3"
            fill="none"
            stroke="#ccc"
          />
          <text x={BAR.x0 + BAR.w} y={BAR.y - 3} textAnchor="end" fontSize="12" fill="#555">
            {ratios[2]}%
          </text>
        </g>

        {/* two layouts: colors used evenly vs in proportion */}
        <g style={fade(step >= STEP.result)}>
          {/* evenly: three equal bands */}
          <rect
            x={even}
            y={CARD.y}
            width={CARD.w}
            height={CARD.h}
            rx="5"
            fill={BASE}
            stroke="#ccc"
          />
          <rect x={even} y={CARD.y} width={CARD.w} height={CARD.h / 3} rx="5" fill={MAIN} />
          <rect x={even} y={CARD.y + CARD.h / 3} width={CARD.w} height={CARD.h / 3} fill={ACCENT} />
          {/* in proportion: mostly base, a main header, one small accent button */}
          <rect
            x={good}
            y={CARD.y}
            width={CARD.w}
            height={CARD.h}
            rx="5"
            fill={BASE}
            stroke="#ccc"
          />
          <rect x={good} y={CARD.y} width={CARD.w} height={CARD.h * 0.3} rx="5" fill={MAIN} />
          <rect
            x={good + 8}
            y={CARD.y + CARD.h * 0.42}
            width={CARD.w * 0.6}
            height="5"
            rx="2"
            fill="#c9c2b2"
          />
          <rect
            x={good + 8}
            y={CARD.y + CARD.h * 0.42 + 10}
            width={CARD.w * 0.45}
            height="5"
            rx="2"
            fill="#c9c2b2"
          />
          <rect
            x={good + CARD.w - 34}
            y={CARD.y + CARD.h - 17}
            width="26"
            height="11"
            rx="5"
            fill={ACCENT}
          />
          <text
            x={even + CARD.w / 2}
            y={CARD.y + CARD.h + 18}
            textAnchor="middle"
            fontSize="12"
            fill="#888"
          >
            {k('evenly')}
          </text>
          <text
            x={good + CARD.w / 2}
            y={CARD.y + CARD.h + 18}
            textAnchor="middle"
            fontSize="12"
            fontWeight="bold"
            fill="#00813a"
          >
            {k('inProportion')}
          </text>
        </g>
      </svg>
    </div>
  );
};

export default ColorProportion;
