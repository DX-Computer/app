import { useReadContract, usePublicClient, useAccount } from "wagmi";
import { contractConfig } from "@/app/lib/contracts";
import { seedField } from "@/app/lib/zk/chipAction";
import { toHex32 } from "@/app/lib/zk/poseidon";
import { depositCommitment, nextDepositSlot, withdrawSlot } from "@/app/lib/zk/poolTree";
import { useTrackedWrite } from "./useTrackedWrite";

const usePool = () => {
  const { address, abi, ready } = contractConfig("balancePool");
  const mona = contractConfig("mona");
  const base = { address, abi } as const;
  const { writeContractAsync, isPending, error } = useTrackedWrite();
  const publicClient = usePublicClient();
  const { address: account } = useAccount();

  const { data: activeBucket } = useReadContract({
    ...base,
    functionName: "activeBucket",
    query: { enabled: ready },
  });

  const bucket = typeof activeBucket === "number" ? activeBucket : 0;

  const { data: denomination } = useReadContract({
    ...base,
    functionName: "denomination",
    args: [bucket],
    query: { enabled: ready && typeof activeBucket === "number" },
  });

  const { data: bucketCountRaw } = useReadContract({
    ...base,
    functionName: "bucketCount",
    query: { enabled: ready },
  });
  const bucketCount =
    typeof bucketCountRaw === "number"
      ? bucketCountRaw
      : typeof bucketCountRaw === "bigint"
      ? Number(bucketCountRaw)
      : 1;

  const findDeposit = async (): Promise<{
    bucket: number;
    index: number;
    siblings: bigint[];
  } | null> => {
    const seed = await seedField();
    const all = Array.from({ length: Math.max(bucketCount, 1) }, (_, i) => i);
    const ordered = [bucket, ...all.filter((b) => b !== bucket)];
    for (const b of ordered) {
      const slot = await withdrawSlot(seed, b);
      if (slot.ok) return { bucket: b, index: slot.index, siblings: slot.siblings };
    }
    return null;
  };

  const guard = (): boolean => {
    if (!ready || !address) {
      console.log("balancePool address not configured");
      return false;
    }
    return true;
  };

  const deposit = async () => {
    if (!guard()) return;
    const seed = await seedField();
    const amount = typeof denomination === "bigint" ? denomination : 0n;
    if (amount === 0n) {
      console.log("deposit: denomination unavailable");
      return;
    }

    if (publicClient && account && mona.ready) {
      const allowance = (await publicClient.readContract({
        address: mona.address,
        abi: mona.abi,
        functionName: "allowance",
        args: [account, address],
      })) as bigint;
      if (allowance < amount) {
        await writeContractAsync({
          address: mona.address,
          abi: mona.abi,
          functionName: "approve",
          args: [address, amount],
        } as never);
      }
    }

    const slot = await nextDepositSlot(bucket);
    const commitment = depositCommitment(seed, bucket, slot.index);
    return writeContractAsync({
      ...base,
      functionName: "deposit",
      args: [bucket, toHex32(commitment), slot.siblings.map((s) => toHex32(s))],
    } as never);
  };

  const withdraw = async (bucketArg?: number) => {
    if (!guard()) return;
    let target: { bucket: number; index: number; siblings: bigint[] } | null =
      null;
    if (bucketArg !== undefined) {
      const seed = await seedField();
      const slot = await withdrawSlot(seed, bucketArg);
      if (slot.ok) {
        target = { bucket: bucketArg, index: slot.index, siblings: slot.siblings };
      }
    } else {
      target = await findDeposit();
    }
    if (!target) {
      console.log("withdraw: no deposit found for this identity");
      return;
    }
    return writeContractAsync({
      ...base,
      functionName: "withdraw",
      args: [target.bucket, target.index, target.siblings.map((s) => toHex32(s))],
    } as never);
  };

  const hasDeposit = async (scope: "any" | "active" = "any"): Promise<boolean> => {
    if (!ready) return false;
    try {
      if (scope === "active") {
        const seed = await seedField();
        const slot = await withdrawSlot(seed, bucket);
        return slot.ok;
      }
      return (await findDeposit()) !== null;
    } catch (e) {
      console.log("hasDeposit failed", e);
      return false;
    }
  };

  const deposits = async (): Promise<
    { bucket: number; denomination: bigint }[]
  > => {
    if (!ready) return [];
    try {
      const seed = await seedField();
      const found: { bucket: number; denomination: bigint }[] = [];
      for (let b = 0; b < Math.max(bucketCount, 1); b++) {
        const slot = await withdrawSlot(seed, b);
        if (!slot.ok) continue;
        let denom = 0n;
        if (publicClient) {
          denom = (await publicClient.readContract({
            address,
            abi,
            functionName: "denomination",
            args: [b],
          })) as bigint;
        }
        found.push({ bucket: b, denomination: denom });
      }
      return found;
    } catch (e) {
      console.log("deposits failed", e);
      return [];
    }
  };

  return {
    ready,
    activeBucket: bucket,
    denomination,
    isPending,
    error,
    deposit,
    withdraw,
    hasDeposit,
    deposits,
  };
};

export default usePool;
