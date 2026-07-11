import { useReadContract } from "wagmi";
import { contractConfig } from "@/app/lib/contracts";
import { paymasterFields } from "@/app/lib/zk/paymaster";
import { ACTIVE_CHAIN } from "@/app/lib/constants";
import { useTrackedWrite } from "./useTrackedWrite";

type Hash = `0x${string}`;

const useIdentity = (commitment?: string) => {
  const { address, abi, ready } = contractConfig("identityRegistry");
  const base = { address: address as Hash, abi } as const;
  const { writeContractAsync, isPending, error } = useTrackedWrite();

  const valid = Boolean(commitment && /^0x[0-9a-fA-F]{64}$/.test(commitment));

  const { data: enrolled, refetch } = useReadContract({
    ...base,
    chainId: ACTIVE_CHAIN.id,
    functionName: "hasEnrolled",
    args: valid ? [BigInt(commitment as Hash)] : undefined,
    query: { enabled: Boolean(ready && valid) },
  });

  const { data: currentRoot, refetch: refetchRoot } = useReadContract({
    ...base,
    chainId: ACTIVE_CHAIN.id,
    functionName: "currentRoot",
    query: { enabled: ready },
  });
  const { data: nextLeafIndex } = useReadContract({
    ...base,
    chainId: ACTIVE_CHAIN.id,
    functionName: "enrollmentCount",
    query: { enabled: ready },
  });

  const enroll = async (
    proof: string,
    commitmentArg: string,
    enrollNullifier: string
  ) => {
    if (!ready || !address) {
      console.log("identityRegistry address not configured");
      return;
    }
    return writeContractAsync(
      {
        ...base,
        functionName: "enroll",
        args: [proof as Hash, BigInt(commitmentArg as Hash), enrollNullifier as Hash],
        ...paymasterFields(),
      } as never,
      { anon: true },
    );
  };

  return {
    ready,
    valid,
    enrolled: Boolean(enrolled),
    enrolledKnown: typeof enrolled === "boolean",
    currentRoot,
    refetchRoot,
    nextLeafIndex,
    isPending,
    error,
    refetch,
    enroll,
  };
};

export default useIdentity;
