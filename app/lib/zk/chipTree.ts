import { hash2 } from "./poseidon";

export const DEPTH = 20;

export type IdentityLeaf = { index: number; commitment: bigint };

export type IdentityTree = {
  root: bigint;
  nodes: Map<string, bigint>;
  count: number;
};

const key = (lvl: number, idx: number): string => `${lvl}:${idx}`;

export const buildTree = (leaves: IdentityLeaf[]): IdentityTree => {
  const nodes = new Map<string, bigint>();
  const get = (lvl: number, idx: number): bigint => nodes.get(key(lvl, idx)) ?? 0n;
  for (const { index, commitment } of leaves) {
    nodes.set(key(0, index), commitment);
  }
  let touched = new Set<number>();
  for (const { index } of leaves) touched.add(index);
  for (let lvl = 0; lvl < DEPTH; lvl++) {
    const parents = new Set<number>();
    for (const idx of touched) {
      const p = idx >> 1;
      const left = get(lvl, p * 2);
      const right = get(lvl, p * 2 + 1);
      nodes.set(key(lvl + 1, p), hash2(left, right));
      parents.add(p);
    }
    touched = parents;
  }
  return { root: get(DEPTH, 0), nodes, count: leaves.length };
};

export const merklePath = (
  tree: IdentityTree,
  index: number,
): { siblings: bigint[]; indices: boolean[] } => {
  const get = (lvl: number, idx: number): bigint =>
    tree.nodes.get(key(lvl, idx)) ?? 0n;
  const siblings: bigint[] = [];
  const indices: boolean[] = [];
  let idx = index;
  for (let lvl = 0; lvl < DEPTH; lvl++) {
    const isRight = idx % 2 === 1;
    const sibIdx = isRight ? idx - 1 : idx + 1;
    siblings.push(get(lvl, sibIdx));
    indices.push(isRight);
    idx = idx >> 1;
  }
  return { siblings, indices };
};

export const emptyRoot = (): bigint => {
  let node = 0n;
  for (let i = 0; i < DEPTH; i++) node = hash2(node, 0n);
  return node;
};
