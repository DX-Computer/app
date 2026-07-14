import { parseAbiItem, type Hex, type PublicClient } from "viem";
import {
  buildTree,
  emptyRoot,
  merklePath,
  type IdentityLeaf,
  type IdentityTree,
} from "./chipTree";

const ENROLLED = parseAbiItem(
  "event Enrolled(uint256 indexed commitment, bytes32 enrollNullifier, uint32 leafIndex, bytes32 root)",
);

type EnrollRow = IdentityLeaf & { root: bigint };

const fetchRows = async (
  client: PublicClient,
  registry: Hex,
  fromBlock: bigint = 0n,
): Promise<EnrollRow[]> => {
  const logs = await client.getLogs({
    address: registry,
    event: ENROLLED,
    fromBlock,
    toBlock: "latest",
  });
  return logs
    .map((l) => ({
      index: Number(l.args.leafIndex),
      commitment: l.args.commitment as bigint,
      root: BigInt(l.args.root as Hex),
    }))
    .sort((a, b) => a.index - b.index);
};

export const fetchEnrollments = async (
  client: PublicClient,
  registry: Hex,
  fromBlock: bigint = 0n,
): Promise<IdentityLeaf[]> => {
  const rows = await fetchRows(client, registry, fromBlock);
  return rows.map(({ index, commitment }) => ({ index, commitment }));
};

export type IdentityPath = {
  index: number;
  siblings: bigint[];
  indices: boolean[];
  merkleRoot: bigint;
};

export const buildIdentityTree = async (
  client: PublicClient,
  registry: Hex,
  targetRoot?: bigint,
): Promise<{ tree: IdentityTree; leaves: IdentityLeaf[] }> => {
  const rows = await fetchRows(client, registry);
  let leaves: IdentityLeaf[] = rows;
  if (targetRoot !== undefined && targetRoot !== 0n) {
    if (targetRoot === emptyRoot()) {
      leaves = [];
    } else {
      const pos = rows.findIndex((r) => r.root === targetRoot);
      if (pos < 0) {
        console.log("snapshot identity root not found in enrollment events");
        throw new Error("rootNotFound");
      }
      leaves = rows.slice(0, pos + 1);
    }
  }
  return { tree: buildTree(leaves), leaves };
};

export const pathForCommitment = (
  tree: IdentityTree,
  leaves: IdentityLeaf[],
  commitment: bigint,
): IdentityPath | null => {
  const leaf = leaves.find((l) => l.commitment === commitment);
  if (!leaf) return null;
  const { siblings, indices } = merklePath(tree, leaf.index);
  return { index: leaf.index, siblings, indices, merkleRoot: tree.root };
};
