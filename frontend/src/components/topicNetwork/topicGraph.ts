// The topic network shared with the backend's next-topic suggestions (single source of truth)
import graph from '../../../../backend/app/data/topic_graph.json';

export type Lang = 'ja' | 'en';
type Label = Record<Lang, string>;

export interface TopicNode {
  id: string;
  cluster: string | null;
  label: Label;
}

export const CLUSTER_LABELS: Record<string, Label> = graph.clusters;

export const TOPICS: TopicNode[] = graph.nodes.map((n) => ({
  id: n.id,
  cluster: n.cluster ?? null,
  label: n.label,
}));

const indexOf = new Map(TOPICS.map((t, i) => [t.id, i]));

/** Connections as pairs of indexes into TOPICS (the suggestion phrases are left out) */
export const LINKS: [number, number][] = graph.edges.flatMap((e) => {
  const a = indexOf.get(e.from);
  const b = indexOf.get(e.to);
  return a === undefined || b === undefined ? [] : [[a, b] as [number, number]];
});
