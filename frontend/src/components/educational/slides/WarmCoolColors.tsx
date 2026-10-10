import { useTranslation } from 'react-i18next';
import { draw, fade, useSlideStep } from '../slideAnimation';

/**
 * The slide draws itself in steps that follow the narration
 * (backend/app/services/prompts/topics/warm_cool_colors.py); each step starts on the word in [ ].
 */
const STEP = {
  intro: 0, // "[暖色と寒色は]、色から感じる暖かさや冷たさによる分け方です。"
  warm: 1, // "[赤]、オレンジ、黄色などが暖色で、"
  warmFeel: 2, // "[暖かく]、活発な印象を与えます。"
  cool: 3, // "[青緑]、青などが寒色で、"
  coolFeel: 4, // "[涼しく]、落ち着いた印象を与えます。"
  neutral: 5, // "[緑や]紫は、どちらでもない中性色です。"
  restaurant: 6, // "そのため、[飲食店]では暖色が、"
  office: 7, // "[病院や]オフィスでは寒色がよく使われます。"
} as const;
// When each step's words are spoken, counted from when the slide appears. Estimated from the
// reading (kana) of the Japanese narration at 8 morae/s, with pauses at 、(0.25 s) ・(0.15 s)
// 。(0.5 s) and 0.6 s before speech starts — calibrated on the hand-tuned RGB slide.
const STEP_AT_MS = [600, 6000, 8800, 12100, 14500, 17600, 22100, 24000];

// Two rounded panels: the hue ring split into warm, cool and neutral (top), where each is used (bottom)
const TOP_PANEL = { y: 0, height: 200 };
const BOTTOM_PANEL = { y: 208, height: 102 };

const hsl = (h: number, s = 100, l = 50) => `hsl(${h} ${s}% ${l}%)`;

// The hue ring (HSL hues, red at the top, clockwise — as on the color wheel slide)
const RING = { cx: 115, cy: 98, outer: 60, inner: 38 };
const pointAt = (hue: number, r: number) => {
  const a = ((hue - 90) * Math.PI) / 180;
  return { x: RING.cx + r * Math.cos(a), y: RING.cy + r * Math.sin(a) };
};
const SEG_DEG = 5;
const SEGMENTS = Array.from({ length: 360 / SEG_DEG }, (_, i) => i * SEG_DEG).map((h) => {
  const h0 = h - SEG_DEG / 2 - 0.4;
  const h1 = h + SEG_DEG / 2 + 0.4;
  const [a, b, c, d] = [
    pointAt(h0, RING.outer),
    pointAt(h1, RING.outer),
    pointAt(h1, RING.inner),
    pointAt(h0, RING.inner),
  ].map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`);
  return {
    h,
    d: `M${a} A${RING.outer},${RING.outer} 0 0 1 ${b} L${c} A${RING.inner},${RING.inner} 0 0 0 ${d} Z`,
  };
});
/** An arc just outside the ring, from hue h0 clockwise to h1 */
const arcPath = (h0: number, h1: number, r: number) => {
  const a = pointAt(h0, r);
  const b = pointAt(h1, r);
  const large = h1 - h0 > 180 ? 1 : 0;
  return `M${a.x.toFixed(2)},${a.y.toFixed(2)} A${r},${r} 0 ${large} 1 ${b.x.toFixed(2)},${b.y.toFixed(2)}`;
};

// The three groups on the ring (hue ranges are approximate; the borders are not sharp)
const GROUPS = [
  {
    key: 'warm',
    from: -25,
    to: 70,
    color: '#e8590c',
    step: STEP.warm,
    label: { hue: 22, anchor: 'start' as const },
  },
  {
    key: 'cool',
    from: 165,
    to: 255,
    color: '#1f63d6',
    step: STEP.cool,
    label: { hue: 210, anchor: 'end' as const },
  },
  {
    key: 'neutral',
    from: 75,
    to: 160,
    color: '#888',
    step: STEP.neutral,
    label: { hue: 150, anchor: 'middle' as const, r: 88 },
  },
  {
    key: 'neutral',
    from: 260,
    to: 330,
    color: '#888',
    step: STEP.neutral,
    label: { hue: 312, anchor: 'middle' as const, r: 88 },
  },
];
const ARC_R = RING.outer + 6;
const LABEL_R = RING.outer + 20;
const inGroup = (h: number, g: (typeof GROUPS)[number]) => {
  const x = ((h - g.from + 360) % 360) + g.from;
  return x >= g.from && x <= g.to;
};

// Bottom: a warm room and a cool room
const ROOMS = [
  {
    key: 'warm',
    x: 12,
    fill: 'url(#warmRoom)',
    text: '#fff',
    feelStep: STEP.warmFeel,
    useStep: STEP.restaurant,
  },
  {
    key: 'cool',
    x: 122,
    fill: 'url(#coolRoom)',
    text: '#123a7a',
    feelStep: STEP.coolFeel,
    useStep: STEP.office,
  },
];
const ROOM = { y: BOTTOM_PANEL.y + 10, w: 96, h: 50 };

const WarmCoolColors = () => {
  const { t } = useTranslation();
  const k = (key: string) => t(`educational.warm_cool_colors.${key}`);
  const step = useSlideStep(STEP_AT_MS);

  /** How strongly a ring segment shows: everything at first, then each group as it is named */
  const segmentOpacity = (h: number) => {
    if (step < STEP.warm) return 1;
    const lit = GROUPS.some((g) => step >= g.step && inGroup(h, g));
    return lit ? 1 : 0.3;
  };

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
        <defs>
          <linearGradient id="warmRoom" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffb347" />
            <stop offset="100%" stopColor="#e8590c" />
          </linearGradient>
          <linearGradient id="coolRoom" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d6ecff" />
            <stop offset="100%" stopColor="#7fb0e8" />
          </linearGradient>
        </defs>
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

        {/* ── top: the hue ring, split into warm, cool and neutral ── */}
        <g style={fade(step >= STEP.intro)}>
          {SEGMENTS.map((s) => (
            <path
              key={s.h}
              d={s.d}
              fill={hsl(s.h)}
              style={{ opacity: segmentOpacity(s.h), transition: 'opacity 600ms ease' }}
            />
          ))}
        </g>
        {GROUPS.map((g, i) => {
          const p = pointAt(g.label.hue, ('r' in g.label && g.label.r) || LABEL_R);
          return (
            <g key={i}>
              <path
                d={arcPath(g.from, g.to, ARC_R)}
                pathLength={1}
                fill="none"
                stroke={g.color}
                strokeWidth="3"
                strokeLinecap="round"
                style={draw(step >= g.step, 0, 800)}
              />
              <text
                x={p.x}
                y={p.y + 5}
                textAnchor={g.label.anchor}
                fontSize="14"
                fontWeight="bold"
                fill={g.color}
                style={fade(step >= g.step, 300)}
              >
                {k(g.key)}
              </text>
            </g>
          );
        })}

        {/* ── bottom: a warm room and a cool room ── */}
        {ROOMS.map((r) => (
          <g key={r.key}>
            <g style={fade(step >= r.feelStep)}>
              <rect x={r.x} y={ROOM.y} width={ROOM.w} height={ROOM.h} rx="6" fill={r.fill} />
              <text
                x={r.x + ROOM.w / 2}
                y={ROOM.y + ROOM.h / 2 + 5}
                textAnchor="middle"
                fontSize="13"
                fontWeight="bold"
                fill={r.text}
              >
                {k(`${r.key}Feel`)}
              </text>
            </g>
            <text
              x={r.x + ROOM.w / 2}
              y={ROOM.y + ROOM.h + 20}
              textAnchor="middle"
              fontSize="13"
              fill="#333"
              style={fade(step >= r.useStep)}
            >
              {k(`${r.key}Use`)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

export default WarmCoolColors;
