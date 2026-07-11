import { useAccount, useReadContract } from "wagmi";
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

const useGrantPosition = (grantId: string) => {
  const { address } = useAccount();
  const { address: registry, abi, ready } = contractConfig("grantRegistry");
  const base = { address: registry as Hash, abi } as const;

  const valid = /^\d+$/.test(grantId);
  const enabled = Boolean(ready && valid && address);
  const args =
    valid && address ? ([BigInt(grantId), address] as const) : undefined;

  const { data: sharesRaw, refetch: refetchShares } = useReadContract({
    ...base,
    functionName: "shares",
    args,
    query: { enabled },
  });
  const { data: pendingRaw, refetch: refetchPending } = useReadContract({
    ...base,
    functionName: "pendingReward",
    args,
    query: { enabled },
  });

  return {
    shares: num(sharesRaw),
    pending: num(pendingRaw),
    refetch: (): void => {
      refetchShares();
      refetchPending();
    },
  };
};

export default useGrantPosition;
