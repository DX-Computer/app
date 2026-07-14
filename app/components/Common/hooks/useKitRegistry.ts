import { useContext } from "react";
import { useAccount, usePublicClient, useReadContract } from "wagmi";
import {
  encodeAbiParameters,
  keccak256,
  sliceHex,
  stringToHex,
  toHex,
  type Hex,
} from "viem";
import { contractConfig } from "@/app/lib/contracts";
import { ACTIVE_CHAIN } from "@/app/lib/constants";
import { ModalContext } from "@/app/providers";
import { KitDraft } from "../types/common.types";
import { useTrackedWrite } from "./useTrackedWrite";
import {
  SNARK_FIELD,
  editProofInputs,
  ownerTagFor,
} from "@/app/lib/zk/identity";
import { circuitAvailable, prove } from "@/app/lib/zk/prover";
import { chipActionProof } from "@/app/lib/zk/chipAction";
import { buildIdentityTree } from "@/app/lib/zk/chipEnrollments";
import { toHex32 } from "@/app/lib/zk/poseidon";

type Hash = `0x${string}`;

const PUBLISH_TAG = sliceHex(keccak256(stringToHex("kitRegistry.publish")), 0, 4);
const KIT_EDIT_TAG = sliceHex(keccak256(stringToHex("kitRegistry.edit")), 0, 4);

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
  const registry = contractConfig("identityRegistry");
  const base = { address: address as Hash, abi } as const;
  const client = usePublicClient();
  const { writeContractAsync, isPending, error } = useTrackedWrite();

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
      if (!registry.ready || !client) {
        console.log("identityRegistry not configured");
        return;
      }
      const ownerTag = toHex32(ownerTagFor(BigInt(designHash)));
      proving();
      const { tree, leaves } = await buildIdentityTree(
        client,
        registry.address as Hex,
      );
      const parentId = draft.parent ? BigInt(draft.parent) : 0n;
      const payloadHash = keccak256(
        encodeAbiParameters(
          [
            { type: "bytes32" },
            { type: "bytes32" },
            { type: "bytes32" },
            { type: "uint256" },
          ],
          [designHash, ownerTag, keccak256(stringToHex(contentUri)), parentId],
        ),
      );
      const res = await chipActionProof({
        contract: address as Hex,
        chainId: ACTIVE_CHAIN.id,
        actionTag: PUBLISH_TAG,
        scopeSeed: 0n,
        payloadHash,
        label: "publish",
        tree,
        leaves,
      });
      if (parentId) {
        return writeContractAsync(
          {
            ...base,
            functionName: "fork",
            args: [
              parentId,
              res.proof,
              res.merkleRoot,
              res.nullifier,
              designHash,
              ownerTag,
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
          args: [
            res.proof,
            res.merkleRoot,
            res.nullifier,
            designHash,
            ownerTag,
            contentUri,
          ],
        },
        { anon: true },
      );
    }
    if (draft.parent) {
      return forkPublic(BigInt(draft.parent), designHash, contentUri);
    }
    return publishPublic(designHash, contentUri);
  };

  const chipEdit = async (payloadHash: Hash, label: string) => {
    if (!registry.ready || !client) {
      throw new Error("registryMissing");
    }
    const { tree, leaves } = await buildIdentityTree(
      client,
      registry.address as Hex,
    );
    return chipActionProof({
      contract: address as Hex,
      chainId: ACTIVE_CHAIN.id,
      actionTag: KIT_EDIT_TAG,
      scopeSeed: BigInt(payloadHash),
      payloadHash,
      label,
      tree,
      leaves,
    });
  };

  const editFail = (e: unknown) => {
    console.log("kit edit proof failed", e);
    ctx?.setTxStatus({
      phase: "error",
      message: e instanceof Error ? e.message : "actFailed",
    });
  };

  const chainVersion = async (
    id: string,
    fallback?: string,
  ): Promise<string> => {
    try {
      const k = (await client!.readContract({
        ...base,
        functionName: "kits",
        args: [BigInt(id)],
      })) as readonly unknown[];
      return (k[4] as bigint).toString();
    } catch {
      return fallback || "0";
    }
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
      const nonce = await chainVersion(id, version);
      let action;
      try {
        const proof = await editProof(
          anchor,
          ownerTag,
          newDesignHash,
          nonce,
          proving,
        );
        const payloadHash = keccak256(
          encodeAbiParameters(
            [
              { type: "uint256" },
              { type: "bytes32" },
              { type: "uint64" },
              { type: "bytes32" },
            ],
            [
              BigInt(id),
              newDesignHash,
              BigInt(nonce),
              keccak256(stringToHex(contentUri)),
            ],
          ),
        );
        action = await chipEdit(payloadHash, "edit");
        return await writeContractAsync(
          {
            ...base,
            functionName: "pushVersion",
            args: [
              BigInt(id),
              proof,
              action.proof,
              action.merkleRoot,
              action.nullifier,
              newDesignHash,
              BigInt(nonce),
              contentUri,
            ],
          },
          { anon: true },
        );
      } catch (e) {
        editFail(e);
        return;
      }
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
      const nonce = await chainVersion(id, version);
      try {
        const proof = await editProof(anchor, ownerTag, ZERO32, nonce, proving);
        const payloadHash = keccak256(
          encodeAbiParameters(
            [{ type: "uint256" }, { type: "uint64" }],
            [BigInt(id), BigInt(nonce)],
          ),
        );
        const action = await chipEdit(payloadHash, "edit");
        return await writeContractAsync(
          {
            ...base,
            functionName: "remove",
            args: [
              BigInt(id),
              proof,
              action.proof,
              action.merkleRoot,
              action.nullifier,
              BigInt(nonce),
            ],
          },
          { successNote: note, anon: true },
        );
      } catch (e) {
        editFail(e);
        return;
      }
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
    const nonce = await chainVersion(id, version);
    try {
      const proof = await editProof(anchor, ownerTag, to as Hash, nonce, proving);
      const payloadHash = keccak256(
        encodeAbiParameters(
          [{ type: "uint256" }, { type: "address" }, { type: "uint64" }],
          [BigInt(id), to as Hash, BigInt(nonce)],
        ),
      );
      const action = await chipEdit(payloadHash, "edit");
      return await writeContractAsync(
        {
          ...base,
          functionName: "claim",
          args: [
            BigInt(id),
            to as Hash,
            proof,
            action.proof,
            action.merkleRoot,
            action.nullifier,
            BigInt(nonce),
          ],
        },
        { anon: true },
      );
    } catch (e) {
      editFail(e);
      return;
    }
  };

  const retagKit = async (
    id: string,
    newOwnerTag: string,
    version?: string,
    anchor?: string,
    ownerTag?: string,
  ) => {
    if (!guard()) return;
    const nonce = await chainVersion(id, version);
    try {
      const proof = await editProof(
        anchor,
        ownerTag,
        newOwnerTag as Hash,
        nonce,
        proving,
      );
      const payloadHash = keccak256(
        encodeAbiParameters(
          [{ type: "uint256" }, { type: "bytes32" }, { type: "uint64" }],
          [BigInt(id), newOwnerTag as Hash, BigInt(nonce)],
        ),
      );
      const action = await chipEdit(payloadHash, "edit");
      return await writeContractAsync(
        {
          ...base,
          functionName: "retag",
          args: [
            BigInt(id),
            proof,
            action.proof,
            action.merkleRoot,
            action.nullifier,
            newOwnerTag as Hash,
            BigInt(nonce),
          ],
        },
        { anon: true },
      );
    } catch (e) {
      editFail(e);
      return;
    }
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
