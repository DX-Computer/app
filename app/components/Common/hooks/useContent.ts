import { useContext } from "react";
import { useReadContract } from "wagmi";
import { keccak256, stringToHex } from "viem";
import { ModalContext } from "@/app/providers";
import { contractConfig } from "@/app/lib/contracts";
import { ensureChipReady, ensureIdentity, ownerTagFor, editProofInputs } from "@/app/lib/zk/identity";
import { circuitAvailable, prove } from "@/app/lib/zk/prover";
import {
  buildGroup,
  generateScopedProof,
  toContractProof,
  POST_SCOPE,
} from "@/app/lib/zk/identityTree";
import { toHex32 } from "@/app/lib/zk/poseidon";
import { paymasterFields } from "@/app/lib/zk/paymaster";
import { useTrackedWrite } from "./useTrackedWrite";

const FIELD =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n;

const contentField = (text: string): bigint =>
  BigInt(keccak256(stringToHex(text))) % FIELD;

type Hash = `0x${string}`;

const useContent = () => {
  const { address, abi, ready } = contractConfig("contentRegistry");
  const base = { address: address as Hash, abi } as const;
  const { writeContractAsync, isPending, error } = useTrackedWrite();
  const ctx = useContext(ModalContext);

  const { data: countRaw } = useReadContract({
    ...base,
    functionName: "contentCount",
    query: { enabled: ready },
  });
  const count = typeof countRaw === "bigint" ? countRaw : 0n;

  const note = ready
    ? "anonymous · proven from your identity"
    : "set NEXT_PUBLIC_CONTENT_REGISTRY";

  const ZERO_TAG =
    "0x0000000000000000000000000000000000000000000000000000000000000000" as Hash;

  const post = async (
    text: string,
    canonicalTag: Hash,
    moderatorTag: Hash,
    contentUri: string,
  ) => {
    if (!ready || !address) {
      console.log("contentRegistry address not configured");
      return;
    }
    await ensureChipReady();
    const identity = ensureIdentity();
    const group = await buildGroup();
    if (!group) {
      console.log("post: no identities enrolled on-chain yet");
      return;
    }
    const contentHash = contentField(text);
    ctx?.setTxStatus({ phase: "pending", message: "provingZk" });
    const proof = await generateScopedProof(identity, group, contentHash, POST_SCOPE);
    if (!proof) {
      console.log("post: this identity is not enrolled on-chain yet");
      return;
    }
    const ownerTag = ownerTagFor(contentHash);

    return writeContractAsync(
      {
        ...base,
        functionName: "post",
        args: [
          toContractProof(proof),
          toHex32(contentHash),
          toHex32(ownerTag),
          canonicalTag,
          moderatorTag ?? ZERO_TAG,
          contentUri,
        ],
        ...paymasterFields(),
      } as never,
      { anon: true },
    );
  };

  const postPublic = async (
    text: string,
    canonicalTag: Hash,
    moderatorTag: Hash,
    contentUri: string,
  ) => {
    if (!ready || !address) {
      console.log("contentRegistry address not configured");
      return;
    }
    const contentHash = contentField(text);
    return writeContractAsync({
      ...base,
      functionName: "postPublic",
      args: [toHex32(contentHash), canonicalTag, moderatorTag ?? ZERO_TAG, contentUri],
    });
  };

  const removePublic = async (id: string, note?: string) => {
    if (!ready || !address) {
      console.log("contentRegistry address not configured");
      return;
    }
    return writeContractAsync(
      {
        ...base,
        functionName: "removePublic",
        args: [BigInt(id)],
      },
      { successNote: note },
    );
  };

  const ZERO32 =
    "0x0000000000000000000000000000000000000000000000000000000000000000" as Hash;

  const remove = async (
    id: string,
    contentHash: string,
    ownerTag: string,
    note?: string,
  ) => {
    if (!ready || !address) {
      console.log("contentRegistry address not configured");
      return;
    }
    let proof: Hash = "0x";
    if (await circuitAvailable("edit")) {
      try {
        ctx?.setTxStatus({ phase: "pending", message: "provingZk" });
        await ensureChipReady();
        const inputs = editProofInputs(contentHash, ownerTag, ZERO32, "0");
        proof = (await prove("edit", inputs)).proof;
      } catch (e) {
        console.log("comment remove proof failed", e);
        ctx?.setTxStatus({ phase: "error", message: "reverted" });
        return;
      }
    }
    return writeContractAsync(
      {
        ...base,
        functionName: "update",
        args: [BigInt(id), proof, ZERO32, 0n],
      },
      { successNote: note, anon: true },
    );
  };

  const moderate = async (
    id: string,
    anchor: string,
    canonicalTag: string,
    note?: string,
  ) => {
    if (!ready || !address) {
      console.log("contentRegistry address not configured");
      return;
    }
    let proof: Hash = "0x";
    if (await circuitAvailable("edit")) {
      try {
        ctx?.setTxStatus({ phase: "pending", message: "provingZk" });
        await ensureChipReady();
        const inputs = editProofInputs(
          anchor,
          canonicalTag,
          toHex32(BigInt(id)),
          "0",
        );
        proof = (await prove("edit", inputs)).proof;
      } catch (e) {
        console.log("moderate proof failed", e);
        ctx?.setTxStatus({ phase: "error", message: "reverted" });
        return;
      }
    }
    return writeContractAsync(
      {
        ...base,
        functionName: "moderate",
        args: [BigInt(id), proof],
        ...paymasterFields(),
      } as never,
      { successNote: note, anon: true },
    );
  };

  return {
    ready,
    count,
    note,
    isPending,
    error,
    canPost: ready,
    post,
    postPublic,
    removePublic,
    remove,
    moderate,
  };
};

export default useContent;
