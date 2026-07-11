import { subgraphQuery } from "@/app/lib/graphql/fetcher";
import { BALANCE_LEAVES_QUERY } from "@/app/lib/graphql/queries";
import { IncrementalMerkleTree, MerkleProof } from "./merkle";
import { hash2 } from "./poseidon";

type RawLeaf = { balanceKey: string; balance: string; leafIndex: number };

export type BalanceProof = {
  proof: MerkleProof;
  root: bigint;
  balance: bigint;
  index: number;
};

export type BalanceResult =
  | { ok: true; data: BalanceProof }
  | { ok: false; reason: "unregistered" | "registeredLate" | "noSnapshot" };

export const buildBalanceProof = async (
  balanceKey: bigint,
  targetRoot?: bigint,
): Promise<BalanceResult> => {
  const data = await subgraphQuery<{ balanceLeaves: RawLeaf[] }>(BALANCE_LEAVES_QUERY);
  const rows = (data?.balanceLeaves ?? [])
    .slice()
    .sort((a, b) => a.leafIndex - b.leafIndex);

  const mine = rows.filter((r) => BigInt(r.balanceKey) === balanceKey);
  if (mine.length === 0) return { ok: false, reason: "unregistered" };
  const latest = mine[mine.length - 1];
  const balance = BigInt(latest.balance);
  const myLeaf = hash2(balanceKey, balance);

  const tree = new IncrementalMerkleTree();
  let frozen = targetRoot === undefined;
  for (const r of rows) {
    tree.insert(hash2(BigInt(r.balanceKey), BigInt(r.balance)));
    if (targetRoot !== undefined && tree.root() === targetRoot) {
      frozen = true;
      break;
    }
  }
  if (!frozen) return { ok: false, reason: "noSnapshot" };

  const index = tree.indexOf(myLeaf);
  if (index < 0) return { ok: false, reason: "registeredLate" };

  return {
    ok: true,
    data: { proof: tree.proof(index), root: tree.root(), balance, index },
  };
};
