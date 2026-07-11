import { keccak256, stringToHex, parseUnits } from "viem";
import { contractConfig } from "@/app/lib/contracts";
import { ADDRESSES } from "@/app/lib/addresses";
import { ERC20_ABI } from "@/app/lib/constants";
import { GrantDraft } from "../types/common.types";
import { useTrackedWrite } from "./useTrackedWrite";
import { paymasterFields } from "@/app/lib/zk/paymaster";

type Hash = `0x${string}`;

export const purposeHashFromDraft = (draft: GrantDraft): Hash =>
  keccak256(
    stringToHex(
      JSON.stringify({
        mode: draft.mode,
        kit: draft.kit,
        title: draft.title,
        purpose: draft.purpose,
        image: draft.image,
        budget: draft.budget,
        deliverables: draft.deliverables,
        milestones: draft.milestones,
        links: draft.links,
      }),
    ),
  );

const useGrants = () => {
  const { address: grant, abi, ready } = contractConfig("grantRegistry");
  const base = { address: grant as Hash, abi } as const;
  const { writeContractAsync, isPending, error } = useTrackedWrite();

  const guard = (): boolean => {
    if (!ready || !grant) {
      console.log("grantRegistry address not configured");
      return false;
    }
    return true;
  };

  const createGrant = async (
    kitId: bigint,
    purposeHash: Hash,
    contentUri: string,
    budget: bigint,
    anonymous = false,
  ) => {
    if (!guard()) return;
    return writeContractAsync(
      {
        ...base,
        functionName: "createGrant",
        args: [kitId, purposeHash, contentUri, budget],
        ...(anonymous ? paymasterFields() : {}),
      } as never,
      { anon: anonymous },
    );
  };

  const publishGrant = async (draft: GrantDraft, contentUri: string) => {
    if (!guard()) return;
    return createGrant(
      /^\d+$/.test(draft.kit) ? BigInt(draft.kit) : 0n,
      purposeHashFromDraft(draft),
      contentUri,
      draft.budget ? parseUnits(draft.budget, 18) : 0n,
      draft.mode === "anonymous",
    );
  };

  const updateGrant = async (
    grantId: bigint,
    draft: GrantDraft,
    contentUri: string,
  ) => {
    if (!guard()) return;
    return writeContractAsync({
      ...base,
      functionName: "updateGrant",
      args: [
        grantId,
        purposeHashFromDraft(draft),
        contentUri,
        draft.budget ? parseUnits(draft.budget, 18) : 0n,
      ],
    });
  };

  const removeGrant = async (grantId: bigint, note?: string) => {
    if (!guard()) return;
    return writeContractAsync(
      {
        ...base,
        functionName: "removeGrant",
        args: [grantId],
      },
      { successNote: note },
    );
  };

  const blacklistRugged = async (grantId: bigint) => {
    if (!guard()) return;
    return writeContractAsync({
      ...base,
      functionName: "blacklistRuggedCreator",
      args: [grantId],
    });
  };

  const fundGrant = async (grantId: bigint, amount: bigint) => {
    if (!guard() || !grant) return;
    if (ADDRESSES.mona) {
      await writeContractAsync({
        address: ADDRESSES.mona,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [grant, amount],
      });
    }
    return writeContractAsync({
      ...base,
      functionName: "fundGrant",
      args: [grantId, amount],
    });
  };

  const claim = async (grantId: bigint) => {
    if (!guard()) return;
    return writeContractAsync({
      ...base,
      functionName: "claim",
      args: [grantId],
    });
  };

  return {
    ready,
    isPending,
    error,
    createGrant,
    publishGrant,
    updateGrant,
    removeGrant,
    blacklistRugged,
    fundGrant,
    claim,
  };
};

export default useGrants;
