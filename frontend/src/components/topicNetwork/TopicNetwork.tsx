import { useEffect, useMemo, useState } from 'react';
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
}: {
  lang: Lang;
  hovered: number | null;
  onHover: (i: number | null) => void;
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
              }}
              // A touch has no hover: the tapped topic stays highlighted until another topic
              // or the background is tapped
              onPointerOut={(e) => e.pointerType !== 'touch' && onHover(null)}
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

/** All topics and their connections as a rotatable 3D network, shown full screen */
const TopicNetwork = ({ onClose }: { onClose: () => void }) => {
  const { t, i18n } = useTranslation();
  const lang: Lang = i18n.language.startsWith('ja') ? 'ja' : 'en';
  const [hovered, setHovered] = useState<number | null>(null);

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
    <Overlay role="dialog" aria-label={t('topicNetwork.title')}>
      <Canvas
        camera={{ position: [0, 0, RADIUS * 3.2], fov: FOV }}
        onPointerMissed={() => setHovered(null)}
      >
        <color attach="background" args={[BACKGROUND]} />
        <ambientLight intensity={0.8} />
        <pointLight position={[20, 20, 20]} intensity={600} />
        <FitCamera />
        <Network lang={lang} hovered={hovered} onHover={setHovered} />
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
        <CloseButton type="button" onClick={onClose} aria-label={t('topicNetwork.close')}>
          ×
        </CloseButton>
      </Header>

      <Legend>
        {clusters.map((c) => (
          <LegendItem key={c.key}>
            <Dot style={{ background: c.color }} />
            {c.label}
          </LegendItem>
        ))}
        <Hint>{t('topicNetwork.hint')}</Hint>
      </Legend>
    </Overlay>
  );
};

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 3000;
  background: ${BACKGROUND};
`;

const Header = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px;
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

const CloseButton = styled.button`
  pointer-events: auto;
  width: 40px;
  height: 40px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.18);
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

const Hint = styled.span`
  flex-basis: 100%;
  font-size: 13px;
  color: #8b95b0;
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
