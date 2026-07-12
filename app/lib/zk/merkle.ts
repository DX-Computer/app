import { hash2 } from "./poseidon";

export const TREE_DEPTH = 20;

const buildZeros = (): bigint[] => {
  const zeros: bigint[] = [0n];
  for (let i = 1; i < TREE_DEPTH; i++) {
    zeros[i] = hash2(zeros[i - 1], zeros[i - 1]);
  }
  return zeros;
};

export type MerkleProof = {
  siblings: bigint[];
  indices: boolean[];
};

export class IncrementalMerkleTree {
  depth = TREE_DEPTH;
  leaves: bigint[] = [];
  zeros: bigint[] = buildZeros();

  insert(leaf: bigint): number {
    this.leaves.push(leaf);
    return this.leaves.length - 1;
  }

  update(index: number, leaf: bigint): void {
    if (index >= 0 && index < this.leaves.length) {
      this.leaves[index] = leaf;
    }
  }

  proofForNext(): MerkleProof {
    this.leaves.push(0n);
    const p = this.proof(this.leaves.length - 1);
    this.leaves.pop();
    return p;
  }

  indexOf(leaf: bigint): number {
    return this.leaves.findIndex((x) => x === leaf);
  }

  proof(index: number): MerkleProof {
    const siblings: bigint[] = [];
    const indices: boolean[] = [];
    let nodes = [...this.leaves];
    let idx = index;

    for (let level = 0; level < this.depth; level++) {
      const isRight = idx & 1;
      const sibIdx = isRight ? idx - 1 : idx + 1;
      const sib = sibIdx < nodes.length ? nodes[sibIdx] : this.zeros[level];
      siblings.push(sib);
      indices.push(Boolean(isRight));

      const next: bigint[] = [];
      for (let i = 0; i < nodes.length; i += 2) {
        const left = nodes[i];
        const right = i + 1 < nodes.length ? nodes[i + 1] : this.zeros[level];
        next.push(hash2(left, right));
      }
      nodes = next.length ? next : [this.zeros[level + 1] ?? 0n];
      idx = idx >> 1;
    }

    return { siblings, indices };
  }

  root(): bigint {
    if (this.leaves.length === 0) {
      return hash2(this.zeros[this.depth - 1], this.zeros[this.depth - 1]);
    }
    let nodes = [...this.leaves];
    for (let level = 0; level < this.depth; level++) {
      const next: bigint[] = [];
      for (let i = 0; i < nodes.length; i += 2) {
        const left = nodes[i];
        const right = i + 1 < nodes.length ? nodes[i + 1] : this.zeros[level];
        next.push(hash2(left, right));
      }
      nodes = next;
    }
    return nodes[0];
  }
}
