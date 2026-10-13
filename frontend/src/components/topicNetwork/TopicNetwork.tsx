import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import { forceLayout3d } from './forceLayout3d';
import { CLUSTER_LABELS, LINKS, TOPICS, type Lang } from './topicGraph';

const CLUSTER_COLORS: Record<string, string> = {
  physics: '#f08a4b',
  machine: '#4a9be8',
  human: '#e45d9a',
  psychology: '#9a6cf0',
  design: '#36b37e',
};
const UNCLASSIFIED_COLOR = '#9aa3ad';
const colorOf = (cluster: string | null) =>
  (cluster && CLUSTER_COLORS[cluster]) || UNCLASSIFIED_COLOR;

const RADIUS = 10;
const BACKGROUND = '#0f1220';
const FOV = 35;
const NARROW_PX = 600;
// A pointer that moved more than this between press and release was rotating the view
const DRAG_PX = 6;

// Laid out once: the graph is static, and a fixed seed keeps the same shape on every visit
const POSITIONS = forceLayout3d(TOPICS.length, LINKS, {
  groups: TOPICS.map((t) => t.cluster),
  radius: RADIUS,
  seed: 7,
});
// The farthest topic, so the whole network (not just the 90% within RADIUS) fits the screen
const EXTENT = Math.max(...POSITIONS.map((p) => Math.hypot(...p)));
const NEIGHBORS: Set<number>[] = TOPICS.map(() => new Set<number>());
for (const [a, b] of LINKS) {
  NEIGHBORS[a].add(b);
  NEIGHBORS[b].add(a);
}

// One line-segment geometry for a set of links
const linkGeometry = (links: [number, number][]) => {
  const g = new THREE.BufferGeometry();
  g.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(
      links.flatMap(([a, b]) => [...POSITIONS[a], ...POSITIONS[b]]),
      3
    )
  );
  return g;
};

const Network = ({
  lang,
  hovered,
  onHover,
  onSelect,
}: {
  lang: Lang;
  hovered: number | null;
  onHover: (i: number | null) => void;
  onSelect: (id: string) => void;
}) => {
  const allLinks = useMemo(() => linkGeometry(LINKS), []);
  const hoveredLinks = useMemo(
    () => (hovered === null ? null : linkGeometry(LINKS.filter((l) => l.includes(hovered)))),
    [hovered]
  );
  useEffect(() => () => allLinks.dispose(), [allLinks]);
  useEffect(() => () => hoveredLinks?.dispose(), [hoveredLinks]);
  // On a narrow screen all 62 names would pile up, so names appear only around a hovered topic
  const isNarrow = useThree((s) => s.size.width < NARROW_PX);

  // While a topic is hovered, it and its neighbors stay bright and the rest fade back
  const isLit = (i: number) => hovered === null || i === hovered || NEIGHBORS[hovered].has(i);
  const isNamed = (i: number) => (hovered === null ? !isNarrow : isLit(i));
  useEffect(() => () => void (document.body.style.cursor = ''), []);
  // Click events do not say whether it was a touch, so remember it from the press
  const pointerType = useRef('mouse');

  return (
    <>
      <lineSegments geometry={allLinks}>
        <lineBasicMaterial
          color="#8b95b0"
          transparent
          opacity={hovered === null ? 0.35 : 0.08}
          depthWrite={false}
        />
      </lineSegments>
      {hoveredLinks && (
        <lineSegments geometry={hoveredLinks}>
          <lineBasicMaterial color="#ffffff" transparent opacity={0.9} depthWrite={false} />
        </lineSegments>
      )}

      {TOPICS.map((t, i) => {
        const lit = isLit(i);
        const size = 0.22 + 0.06 * Math.sqrt(NEIGHBORS[i].size);
        return (
          <group key={t.id} position={POSITIONS[i]}>
            <mesh
              onPointerOver={(e) => {
                e.stopPropagation();
                onHover(i);
                document.body.style.cursor = 'pointer';
              }}
              // A touch has no hover: the tapped topic stays highlighted until another topic
              // or the background is tapped
              onPointerOut={(e) => {
                document.body.style.cursor = '';
                if (e.pointerType !== 'touch') onHover(null);
              }}
              onPointerDown={(e) => {
                pointerType.current = e.pointerType;
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (e.delta > DRAG_PX) return; // the end of a drag to rotate, not a click
                // On touch, the first tap shows the topic and its connections; a second tap opens it
                if (pointerType.current === 'touch' && hovered !== i) {
                  onHover(i);
                  return;
                }
                onSelect(t.id);
              }}
            >
              <sphereGeometry args={[size, 20, 14]} />
              <meshStandardMaterial
                color={colorOf(t.cluster)}
                transparent
                opacity={lit ? 1 : 0.2}
                emissive={colorOf(t.cluster)}
                emissiveIntensity={i === hovered ? 0.6 : 0.15}
              />
            </mesh>
            <Html
              position={[0, size + 0.15, 0]}
              center
              zIndexRange={[100, 0]}
              style={{ pointerEvents: 'none' }}
            >
              <NodeLabel $lit={lit} $named={isNamed(i)} $active={i === hovered}>
                {t.label[lang]}
              </NodeLabel>
            </Html>
          </group>
        );
      })}
    </>
  );
};

// Moves the camera back far enough that the network fits the narrower side of the screen
// (on a portrait phone that is the width, which the vertical field of view alone ignores)
const FitCamera = () => {
  const camera = useThree((s) => s.camera);
  const aspect = useThree((s) => s.size.width / s.size.height);
  useEffect(() => {
    const halfFov = THREE.MathUtils.degToRad(FOV / 2);
    const distance = (EXTENT + 1) / (Math.tan(halfFov) * Math.min(1, aspect));
    camera.position.setLength(distance);
  }, [camera, aspect]);
  return null;
};

// The part of the page actually on screen. The 3D view is larger than the screen (120vw), so on
// phones the page is wider than the screen and a fixed `inset: 0` overlay would stretch past its
// right edge (hiding the close button); the overlay is fitted to the visible area instead.
const useVisibleArea = (): CSSProperties | undefined => {
  const [area, setArea] = useState<CSSProperties>();
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () =>
      setArea({ left: vv.offsetLeft, top: vv.offsetTop, width: vv.width, height: vv.height });
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);
  return area;
};

/** All topics and their connections as a rotatable 3D network, shown full screen */
const TopicNetwork = ({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  // A topic was clicked: show its slide and explanation
  onSelect: (id: string) => void;
}) => {
  const { t, i18n } = useTranslation();
  const lang: Lang = i18n.language.startsWith('ja') ? 'ja' : 'en';
  const [hovered, setHovered] = useState<number | null>(null);
  const visibleArea = useVisibleArea();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const clusters = [
    ...Object.entries(CLUSTER_LABELS).map(([id, label]) => ({
      key: id,
      label: label[lang],
      color: colorOf(id),
    })),
    { key: 'none', label: t('topicNetwork.unclassified'), color: UNCLASSIFIED_COLOR },
  ];

  return (
    <Overlay role="dialog" aria-label={t('topicNetwork.title')} style={visibleArea}>
      <Canvas
        camera={{ position: [0, 0, RADIUS * 3.2], fov: FOV }}
        onPointerMissed={() => setHovered(null)}
      >
        <color attach="background" args={[BACKGROUND]} />
        <ambientLight intensity={0.8} />
        <pointLight position={[20, 20, 20]} intensity={600} />
        <FitCamera />
        <Network lang={lang} hovered={hovered} onHover={setHovered} onSelect={onSelect} />
        <OrbitControls
          enablePan={false}
          minDistance={RADIUS * 0.8}
          maxDistance={EXTENT * 10}
          autoRotate={hovered === null}
          autoRotateSpeed={0.6}
        />
      </Canvas>

      <Header>
        <div>
          <Title>{t('topicNetwork.title')}</Title>
          <Summary>
            {t('topicNetwork.summary', { topics: TOPICS.length, links: LINKS.length })}
          </Summary>
        </div>
        <CloseButton type="button" onClick={onClose}>
          <span aria-hidden>✕</span>
          {t('topicNetwork.close')}
        </CloseButton>
      </Header>

      <Legend>
        {clusters.map((c) => (
          <LegendItem key={c.key}>
            <Dot style={{ background: c.color }} />
            {c.label}
          </LegendItem>
        ))}
      </Legend>
    </Overlay>
  );
};

const Overlay = styled.div`
  position: fixed;
  /* Replaced by the visible area when the browser reports it (see useVisibleArea) */
  inset: 0;
  z-index: 3000;
  background: ${BACKGROUND};
`;

// Above the topic names (drei Html labels use z-indexes up to 100), so they never cover the button
const Header = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 200;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) 16px
    max(16px, env(safe-area-inset-left));
  color: #fff;
  pointer-events: none;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 700;
`;

const Summary = styled.div`
  margin-top: 4px;
  font-size: 14px;
  color: #b5bccf;
`;

// A labeled white button, easy to spot on the dark background and easy to tap on a phone
const CloseButton = styled.button`
  pointer-events: auto;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  padding: 0 16px;
  border: none;
  border-radius: 22px;
  background: #fff;
  color: #1a1f33;
  font-size: 16px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);

  &:hover {
    background: #e8ecf6;
  }
`;

const Legend = styled.div`
  position: absolute;
  left: 16px;
  bottom: 16px;
  max-width: calc(100vw - 32px);
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  font-size: 14px;
  color: #e3e7f2;
  pointer-events: none;
`;

const LegendItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

const Dot = styled.span`
  width: 12px;
  height: 12px;
  border-radius: 50%;
`;

const NodeLabel = styled.div<{ $lit: boolean; $named: boolean; $active: boolean }>`
  white-space: nowrap;
  font-size: ${({ $active }) => ($active ? 15 : 12)}px;
  font-weight: ${({ $active }) => ($active ? 700 : 400)};
  color: #fff;
  opacity: ${({ $lit, $named }) => (!$named ? 0 : $lit ? 0.95 : 0.15)};
  text-shadow:
    0 0 4px #000,
    0 0 2px #000;
  transition: opacity 200ms ease;
  user-select: none;
`;

export default TopicNetwork;
