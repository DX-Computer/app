import { useContext } from "react";
import { useAccount, useReadContract } from "wagmi";
import { keccak256, stringToHex, toHex } from "viem";
import { contractConfig } from "@/app/lib/contracts";
import { ModalContext } from "@/app/providers";
import { KitDraft } from "../types/common.types";
import { useTrackedWrite } from "./useTrackedWrite";
import useChip from "./useChip";
import { SNARK_FIELD, editProofInputs, ensureChipReady } from "@/app/lib/zk/identity";
import { circuitAvailable, prove } from "@/app/lib/zk/prover";

type Hash = `0x${string}`;

const ZERO32 =
  "0x0000000000000000000000000000000000000000000000000000000000000000" as Hash;

const toField32 = (h: Hash): Hash =>
  toHex(BigInt(h) % SNARK_FIELD, { size: 32 });

export const designHashFromDraft = (draft: KitDraft): Hash =>
  toField32(
    keccak256(
      stringToHex(
        JSON.stringify({
          mode: draft.mode,
          title: draft.title,
          summary: draft.summary,
          tags: draft.tags,
          hardware: draft.hardware,
          software: draft.software,
          fabrication: draft.fabrication,
          stage: draft.stage,
          image: draft.image,
          video: draft.video,
          pdf: draft.pdf,
          parent: draft.parent,
        })
      )
    )
  );

const editProof = async (
  anchor: string | undefined,
  ownerTag: string | undefined,
  newContentHash: Hash,
  nonce: string,
  onProving?: () => void,
): Promise<Hash> => {
  if (!anchor || !ownerTag) return "0x";
  if (!(await circuitAvailable("edit"))) return "0x";
  try {
    await ensureChipReady();
    const inputs = editProofInputs(anchor, ownerTag, newContentHash, nonce);
    onProving?.();
    const { proof } = await prove("edit", inputs);
    return proof;
  } catch (e) {
    console.log("edit proof failed:", e);
    return "0x";
  }
};

const useKitRegistry = () => {
  const ctx = useContext(ModalContext);
  const proving = (): void =>
    ctx?.setTxStatus({ phase: "pending", message: "provingZk" });
  const { address: account } = useAccount();
  const { address, abi, ready } = contractConfig("kitRegistry");
  const base = { address: address as Hash, abi } as const;
  const { writeContractAsync, isPending, error } = useTrackedWrite();
  const chip = useChip();

  const { data: kitCount, refetch: refetchCount } = useReadContract({
    ...base,
    functionName: "kitCount",
    query: { enabled: ready },
  });

  const guard = (): boolean => {
    if (!ready || !address) {
      console.log("kitRegistry address not configured");
      return false;
    }
    return true;
  };

  const publishPublic = async (designHash: Hash, contentUri: string) => {
    if (!guard()) return;
    return writeContractAsync({
      ...base,
      functionName: "publishPublic",
      args: [designHash, contentUri],
    });
  };

  const forkPublic = async (
    parentId: bigint,
    designHash: Hash,
    contentUri: string,
  ) => {
    if (!guard()) return;
    return writeContractAsync({
      ...base,
      functionName: "forkPublic",
      args: [parentId, designHash, contentUri],
    });
  };

  const pushVersionPublic = async (
    id: bigint,
    newDesignHash: Hash,
    newContentUri: string,
  ) => {
    if (!guard()) return;
    return writeContractAsync({
      ...base,
      functionName: "pushVersionPublic",
      args: [id, newDesignHash, newContentUri],
    });
  };

  const removePublic = async (id: bigint, note?: string) => {
    if (!guard()) return;
    return writeContractAsync(
      {
        ...base,
        functionName: "removePublic",
        args: [id],
      },
      { successNote: note },
    );
  };

  const publishKit = async (draft: KitDraft, contentUri: string) => {
    if (!guard()) return;
    const designHash = designHashFromDraft(draft);
    if (draft.mode === "anonymous") {
      const data = await chip.publishData(designHash);
      if (!data) {
        console.log("anonymous publish: no chip publish data");
        return;
      }
      if (draft.parent) {
        return writeContractAsync(
          {
            ...base,
            functionName: "fork",
            args: [
              BigInt(draft.parent),
              data.semaphoreProof,
              designHash,
              data.ownerTag,
              contentUri,
            ],
          },
          { anon: true },
        );
      }
      return writeContractAsync(
        {
          ...base,
          functionName: "publish",
          args: [data.semaphoreProof, designHash, data.ownerTag, contentUri],
        },
        { anon: true },
      );
    }
    if (draft.parent) {
      return forkPublic(BigInt(draft.parent), designHash, contentUri);
    }
    return publishPublic(designHash, contentUri);
  };

  const pushVersionKit = async (
    id: string,
    draft: KitDraft,
    contentUri: string,
    mode?: string,
    version?: string,
    anchor?: string,
    ownerTag?: string,
  ) => {
    if (!guard()) return;
    if (mode === "anonymous") {
      const newDesignHash = designHashFromDraft(draft);
      const nonce = version || "0";
      const proof = await editProof(
        anchor,
        ownerTag,
        newDesignHash,
        nonce,
        proving,
      );
      return writeContractAsync(
        {
          ...base,
          functionName: "pushVersion",
          args: [BigInt(id), proof, newDesignHash, BigInt(nonce), contentUri],
        },
        { anon: true },
      );
    }
    return pushVersionPublic(BigInt(id), designHashFromDraft(draft), contentUri);
  };

  const removeKit = async (
    id: string,
    note?: string,
    mode?: string,
    version?: string,
    anchor?: string,
    ownerTag?: string,
  ) => {
    if (!guard()) return;
    if (mode === "anonymous") {
      const nonce = version || "0";
      const proof = await editProof(anchor, ownerTag, ZERO32, nonce, proving);
      return writeContractAsync(
        {
          ...base,
          functionName: "remove",
          args: [BigInt(id), proof, BigInt(nonce)],
        },
        { successNote: note, anon: true },
      );
    }
    return removePublic(BigInt(id), note);
  };

  const transferKit = async (to: string, id: string) => {
    if (!guard() || !account) return;
    return writeContractAsync({
      ...base,
      functionName: "transferFrom",
      args: [account, to as Hash, BigInt(id)],
    });
  };

  const claimKit = async (
    id: string,
    to: string,
    version?: string,
    anchor?: string,
    ownerTag?: string,
  ) => {
    if (!guard()) return;
    const nonce = version || "0";
    const proof = await editProof(anchor, ownerTag, to as Hash, nonce, proving);
    return writeContractAsync(
      {
        ...base,
        functionName: "claim",
        args: [BigInt(id), to as Hash, proof, BigInt(nonce)],
      },
      { anon: true },
    );
  };

  const retagKit = async (
    id: string,
    newOwnerTag: string,
    version?: string,
    anchor?: string,
    ownerTag?: string,
  ) => {
    if (!guard()) return;
    const nonce = version || "0";
    const proof = await editProof(
      anchor,
      ownerTag,
      newOwnerTag as Hash,
      nonce,
      proving,
    );
    return writeContractAsync(
      {
        ...base,
        functionName: "retag",
        args: [BigInt(id), proof, newOwnerTag as Hash, BigInt(nonce)],
      },
      { anon: true },
    );
  };

  return {
    ready,
    kitCount: typeof kitCount === "bigint" ? kitCount : 0,
    isPending,
    error,
    refetchCount,
    designHashFromDraft,
    publishKit,
    publishPublic,
    forkPublic,
    pushVersionPublic,
    pushVersionKit,
    removePublic,
    removeKit,
    transferKit,
    claimKit,
    retagKit,
  };
};

export default useKitRegistry;
