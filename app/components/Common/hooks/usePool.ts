import { useReadContract, usePublicClient, useAccount } from "wagmi";
import { contractConfig } from "@/app/lib/contracts";
import { ensureChipReady, ensureIdentity } from "@/app/lib/zk/identity";
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

  const guard = (): boolean => {
    if (!ready || !address) {
      console.log("balancePool address not configured");
      return false;
    }
    return true;
  };

  const deposit = async () => {
    if (!guard()) return;
    await ensureChipReady();
    const identity = ensureIdentity();
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
    const commitment = depositCommitment(identity.secretScalar, bucket, slot.index);
    return writeContractAsync({
      ...base,
      functionName: "deposit",
      args: [bucket, toHex32(commitment), slot.siblings.map((s) => toHex32(s))],
    } as never);
  };

  const withdraw = async () => {
    if (!guard()) return;
    await ensureChipReady();
    const identity = ensureIdentity();
    const slot = await withdrawSlot(identity.secretScalar, bucket);
    if (!slot.ok) {
      console.log("withdraw: no deposit found for this identity");
      return;
    }
    return writeContractAsync({
      ...base,
      functionName: "withdraw",
      args: [bucket, slot.index, slot.siblings.map((s) => toHex32(s))],
    } as never);
  };

  const hasDeposit = async (): Promise<boolean> => {
    if (!ready) return false;
    try {
      const identity = ensureIdentity();
      const slot = await withdrawSlot(identity.secretScalar, bucket);
      return slot.ok;
    } catch {
      return false;
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
  };
};

export default usePool;
