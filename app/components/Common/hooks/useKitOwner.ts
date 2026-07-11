import { useAccount, useReadContract } from "wagmi";
import { contractConfig } from "@/app/lib/contracts";

type Hash = `0x${string}`;

const useKitOwner = (kitId?: string) => {
  const { address } = useAccount();
  const { address: registry, abi, ready } = contractConfig("kitRegistry");
  const base = { address: registry as Hash, abi } as const;

  const valid = Boolean(kitId && /^\d+$/.test(kitId));

  const { data: owner } = useReadContract({
    ...base,
    functionName: "ownerOf",
    args: valid ? [BigInt(kitId as string)] : undefined,
    query: { enabled: Boolean(ready && valid) },
  });

  const ownerAddress = owner as Hash | undefined;
  const isOwner = Boolean(
    address &&
      ownerAddress &&
      ownerAddress.toLowerCase() === address.toLowerCase(),
  );

  return { owner: ownerAddress, isOwner };
};

export default useKitOwner;
