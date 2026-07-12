import { subgraphQuery } from "@/app/lib/graphql/fetcher";
import { POOL_EVENTS_QUERY } from "@/app/lib/graphql/queries";
import { IncrementalMerkleTree, MerkleProof } from "./merkle";
import { hash2 } from "./poseidon";

type RawPoolEvent = {
  bucket: number;
  kind: string;
  commitment: string;
  leafIndex: number;
  createdAtBlock: string;
  logIndex: string;
};

export type PoolProof = {
  proof: MerkleProof;
  root: bigint;
  index: number;
};

export type PoolResult =
  | { ok: true; data: PoolProof }
  | { ok: false; reason: "noDeposit" | "withdrawn" | "noSnapshot" };

export const depositR = (identitySecret: bigint, bucket: number, index: number): bigint =>
  hash2(identitySecret, hash2(BigInt(bucket), BigInt(index)));

export const depositCommitment = (identitySecret: bigint, bucket: number, index: number): bigint =>
  hash2(identitySecret, depositR(identitySecret, bucket, index));

const fetchEvents = async (bucket: number): Promise<RawPoolEvent[]> => {
  const data = await subgraphQuery<{ poolEvents: RawPoolEvent[] }>(POOL_EVENTS_QUERY, { bucket });
  return (data?.poolEvents ?? []).slice().sort((a, b) => {
    const ab = BigInt(a.createdAtBlock);
    const bb = BigInt(b.createdAtBlock);
    if (ab !== bb) return ab < bb ? -1 : 1;
    const al = BigInt(a.logIndex);
    const bl = BigInt(b.logIndex);
    return al < bl ? -1 : al > bl ? 1 : 0;
  });
};

export const buildPoolTree = async (
  bucket: number,
  targetRoot?: bigint,
): Promise<{ tree: IncrementalMerkleTree; frozen: boolean }> => {
  const rows = await fetchEvents(bucket);
  const tree = new IncrementalMerkleTree();
  let frozen = targetRoot === undefined || tree.root() === targetRoot;
  for (const r of rows) {
    if (frozen && targetRoot !== undefined) break;
    if (r.kind === "deposit") {
      tree.insert(BigInt(r.commitment));
    } else {
      tree.update(r.leafIndex, 0n);
    }
    if (targetRoot !== undefined && tree.root() === targetRoot) {
      frozen = true;
    }
  }
  return { tree, frozen };
};

export const buildPoolProof = async (
  identitySecret: bigint,
  bucket: number,
  targetRoot?: bigint,
): Promise<PoolResult & { r?: bigint }> => {
  const { tree, frozen } = await buildPoolTree(bucket, targetRoot);
  if (!frozen) return { ok: false, reason: "noSnapshot" };

  for (let index = tree.leaves.length - 1; index >= 0; index--) {
    if (tree.leaves[index] === 0n) continue;
    const candidate = depositCommitment(identitySecret, bucket, index);
    if (tree.leaves[index] === candidate) {
      return {
        ok: true,
        data: { proof: tree.proof(index), root: tree.root(), index },
        r: depositR(identitySecret, bucket, index),
      };
    }
  }
  return { ok: false, reason: "noDeposit" };
};

export const nextDepositSlot = async (
  bucket: number,
): Promise<{ index: number; siblings: bigint[] }> => {
  const { tree } = await buildPoolTree(bucket);
  const index = tree.leaves.length;
  const p = tree.proofForNext();
  return { index, siblings: p.siblings };
};

export const withdrawSlot = async (
  identitySecret: bigint,
  bucket: number,
): Promise<{ ok: true; index: number; siblings: bigint[] } | { ok: false }> => {
  const { tree } = await buildPoolTree(bucket);
  for (let index = tree.leaves.length - 1; index >= 0; index--) {
    if (tree.leaves[index] === 0n) continue;
    if (tree.leaves[index] === depositCommitment(identitySecret, bucket, index)) {
      return { ok: true, index, siblings: tree.proof(index).siblings };
    }
  }
  return { ok: false };
};
