import { useReadContract } from "wagmi";
import { contractConfig } from "@/app/lib/contracts";
import { ensureIdentity } from "@/app/lib/zk/identity";
import { buildGroup, generateScopedProof, toContractProof, BALANCE_LINK_SCOPE } from "@/app/lib/zk/identityTree";
import { useTrackedWrite } from "./useTrackedWrite";

const useBalanceTree = () => {
  const { address, abi, ready } = contractConfig("monaBalanceTree");
  const base = { address, abi } as const;
  const { writeContractAsync, isPending, error } = useTrackedWrite();

  const { data: currentRoot } = useReadContract({
    ...base,
    functionName: "currentRoot",
    query: { enabled: ready },
  });
  const { data: nextLeafIndex } = useReadContract({
    ...base,
    functionName: "nextLeafIndex",
    query: { enabled: ready },
  });

  const register = async () => {
    if (!ready || !address) {
      console.log("monaBalanceTree address not configured");
      return;
    }
    const identity = ensureIdentity();
    const group = await buildGroup();
    if (!group) {
      console.log("register: no identities enrolled on-chain yet");
      return;
    }
    const linkProof = await generateScopedProof(identity, group, 0n, BALANCE_LINK_SCOPE);
    if (!linkProof) {
      console.log("register: this identity is not enrolled on-chain yet");
      return;
    }
    return writeContractAsync({
      ...base,
      functionName: "register",
      args: [toContractProof(linkProof)],
    });
  };

  return { ready, currentRoot, nextLeafIndex, isPending, error, register };
};

export default useBalanceTree;
