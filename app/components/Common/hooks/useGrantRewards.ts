import { useAccount, useReadContracts } from "wagmi";
import { formatUnits } from "viem";
import { contractConfig } from "@/app/lib/contracts";

type Hash = `0x${string}`;

const num = (v: unknown): number => {
  try {
    return typeof v === "bigint" ? Number(formatUnits(v, 18)) : 0;
  } catch {
    return 0;
  }
};

const useGrantRewards = (
  grantIds: string[],
): { pending: Record<string, number>; refetch: () => void } => {
  const { address } = useAccount();
  const { address: registry, abi, ready } = contractConfig("grantRegistry");

  const valid = grantIds.filter((g) => /^\d+$/.test(g));
  const enabled = Boolean(ready && address && valid.length > 0);

  const { data, refetch } = useReadContracts({
    contracts: valid.map((g) => ({
      address: registry as Hash,
      abi,
      functionName: "pendingReward",
      args: [BigInt(g), address as Hash],
    })),
    query: { enabled },
  });

  const pending: Record<string, number> = {};
  valid.forEach((g, i) => {
    pending[g] = num(data?.[i]?.result);
  });

  return {
    pending,
    refetch: (): void => {
      refetch();
    },
  };
};

export default useGrantRewards;
