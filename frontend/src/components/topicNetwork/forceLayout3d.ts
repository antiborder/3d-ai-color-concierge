export type Vec3 = [number, number, number];

interface LayoutOptions {
  /** Group of each node; nodes of the same group are pulled together (null = no group) */
  groups?: (string | null)[];
  iterations?: number;
  /** Radius of the sphere that 90% of the nodes are scaled to fit (outliers may lie beyond) */
  radius?: number;
  seed?: number;
}

// Small seeded random generator so the layout is the same on every visit
const mulberry32 = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/**
 * Force-directed layout in 3D (Fruchterman–Reingold): every pair of nodes repels, connected
 * nodes attract, and nodes of the same group are drawn towards their group's center.
 * Deterministic for a given seed.
 */
export function forceLayout3d(
  nodeCount: number,
  edges: [number, number][],
  { groups = [], iterations = 400, radius = 10, seed = 1 }: LayoutOptions = {}
): Vec3[] {
  const random = mulberry32(seed);
  const pos: Vec3[] = Array.from({ length: nodeCount }, () => [
    random() - 0.5,
    random() - 0.5,
    random() - 0.5,
  ]);
  if (nodeCount === 0) return pos;

  const k = 1 / Math.cbrt(nodeCount); // ideal edge length in a unit volume
  const GROUP_PULL = 0.3; // relative to an edge's attraction
  const GRAVITY = 0.05;
  const groupIds = [...new Set(groups.filter((g): g is string => g != null))];

  for (let it = 0; it < iterations; it++) {
    const temperature = 0.1 * (1 - it / iterations) + 0.002;
    const disp: Vec3[] = pos.map(() => [0, 0, 0]);
    const push = (i: number, d: Vec3, f: number) => {
      disp[i][0] += d[0] * f;
      disp[i][1] += d[1] * f;
      disp[i][2] += d[2] * f;
    };

    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        const d: Vec3 = [pos[i][0] - pos[j][0], pos[i][1] - pos[j][1], pos[i][2] - pos[j][2]];
        const dist = Math.max(Math.hypot(...d), 1e-3);
        const f = (k * k) / (dist * dist); // repulsion k²/dist, along the unit vector d/dist
        push(i, d, f);
        push(j, d, -f);
      }
    }
    for (const [a, b] of edges) {
      const d: Vec3 = [pos[a][0] - pos[b][0], pos[a][1] - pos[b][1], pos[a][2] - pos[b][2]];
      const f = Math.hypot(...d) / k; // attraction dist²/k
      push(a, d, -f);
      push(b, d, f);
    }
    for (const g of groupIds) {
      const members = groups.flatMap((gi, i) => (gi === g ? [i] : []));
      const c: Vec3 = [0, 0, 0];
      for (const i of members) for (let x = 0; x < 3; x++) c[x] += pos[i][x] / members.length;
      for (const i of members) {
        const d: Vec3 = [pos[i][0] - c[0], pos[i][1] - c[1], pos[i][2] - c[2]];
        push(i, d, (-GROUP_PULL * Math.hypot(...d)) / k);
      }
    }
    for (let i = 0; i < nodeCount; i++) push(i, pos[i], -GRAVITY / k);

    // Move each node along its displacement, at most `temperature` per step
    for (let i = 0; i < nodeCount; i++) {
      const len = Math.hypot(...disp[i]);
      if (len === 0) continue;
      const step = Math.min(len, temperature) / len;
      for (let x = 0; x < 3; x++) pos[i][x] += disp[i][x] * step;
    }
  }

  // Center on the origin and scale so that most nodes (90%) fit the sphere; scaling to the
  // farthest node would let a few outliers shrink the rest
  const c: Vec3 = [0, 0, 0];
  for (const p of pos) for (let x = 0; x < 3; x++) c[x] += p[x] / nodeCount;
  const centered = pos.map((p): Vec3 => [p[0] - c[0], p[1] - c[1], p[2] - c[2]]);
  const dists = centered.map((p) => Math.hypot(...p)).sort((a, b) => a - b);
  const scale = radius / Math.max(dists[Math.ceil(nodeCount * 0.9) - 1], 1e-6);
  return centered.map((p): Vec3 => [p[0] * scale, p[1] * scale, p[2] * scale]);
}
