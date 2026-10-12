import { describe, it, expect } from 'vitest';
import { forceLayout3d, type Vec3 } from '../forceLayout3d';
import { LINKS, TOPICS } from '../topicGraph';

const dist = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

describe('forceLayout3d', () => {
  const groups = TOPICS.map((t) => t.cluster);
  const pos = forceLayout3d(TOPICS.length, LINKS, { groups, radius: 10, seed: 7 });

  it('fits most topics in the sphere, without overlaps', () => {
    expect(pos).toHaveLength(TOPICS.length);
    const inside = pos.filter((p) => Math.hypot(...p) <= 10 + 1e-9).length;
    expect(inside / pos.length).toBeGreaterThanOrEqual(0.9);
    for (let i = 0; i < pos.length; i++)
      for (let j = i + 1; j < pos.length; j++) expect(dist(pos[i], pos[j])).toBeGreaterThan(0.3);
  });

  it('is the same on every run', () => {
    expect(forceLayout3d(TOPICS.length, LINKS, { groups, radius: 10, seed: 7 })).toEqual(pos);
  });

  it('puts connected topics closer than unconnected ones', () => {
    const linked = new Set(LINKS.map(([a, b]) => `${Math.min(a, b)}-${Math.max(a, b)}`));
    const near: number[] = [];
    const far: number[] = [];
    for (let i = 0; i < pos.length; i++)
      for (let j = i + 1; j < pos.length; j++)
        (linked.has(`${i}-${j}`) ? near : far).push(dist(pos[i], pos[j]));
    const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
    expect(mean(near)).toBeLessThan(mean(far) * 0.75);
  });
});

describe('topicGraph', () => {
  it('keeps every connection between known topics', () => {
    expect(TOPICS.length).toBeGreaterThan(0);
    expect(LINKS.length).toBeGreaterThan(0);
    for (const [a, b] of LINKS) {
      expect(TOPICS[a]).toBeDefined();
      expect(TOPICS[b]).toBeDefined();
    }
  });
});
