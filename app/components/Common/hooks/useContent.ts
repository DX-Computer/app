import { useContext } from "react";
import { usePublicClient, useReadContract } from "wagmi";
import {
  encodeAbiParameters,
  keccak256,
  sliceHex,
  stringToHex,
  type Hex,
} from "viem";
import { ModalContext } from "@/app/providers";
import { contractConfig } from "@/app/lib/contracts";
import { ACTIVE_CHAIN } from "@/app/lib/constants";
import { ownerTagFor, editProofInputs } from "@/app/lib/zk/identity";
import { circuitAvailable, prove } from "@/app/lib/zk/prover";
import { chipActionProof } from "@/app/lib/zk/chipAction";
import { buildIdentityTree } from "@/app/lib/zk/chipEnrollments";
import { toHex32 } from "@/app/lib/zk/poseidon";
import { paymasterFields } from "@/app/lib/zk/paymaster";
import { useTrackedWrite } from "./useTrackedWrite";

const POST_TAG = sliceHex(keccak256(stringToHex("contentRegistry.post")), 0, 4);
const EDIT_TAG = sliceHex(keccak256(stringToHex("contentRegistry.edit")), 0, 4);

const FIELD =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n;

const contentField = (text: string): bigint =>
  BigInt(keccak256(stringToHex(text))) % FIELD;

type Hash = `0x${string}`;

const useContent = () => {
  const { address, abi, ready } = contractConfig("contentRegistry");
  const registry = contractConfig("identityRegistry");
  const base = { address: address as Hash, abi } as const;
  const client = usePublicClient();
  const { writeContractAsync, isPending, error } = useTrackedWrite();
  const ctx = useContext(ModalContext);

  const { data: countRaw } = useReadContract({
    ...base,
    functionName: "contentCount",
    query: { enabled: ready },
  });
  const count = typeof countRaw === "bigint" ? countRaw : 0n;

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
    if (!registry.ready || !client) {
      console.log("identityRegistry not configured");
      return;
    }
    const contentHash = contentField(text);
    const ownerTag = ownerTagFor(contentHash);
    ctx?.setTxStatus({ phase: "pending", message: "provingZk" });
    const { tree, leaves } = await buildIdentityTree(
      client,
      registry.address as Hex,
    );
    const payloadHash = keccak256(
      encodeAbiParameters(
        [
          { type: "bytes32" },
          { type: "bytes32" },
          { type: "bytes32" },
          { type: "bytes32" },
          { type: "bytes32" },
        ],
        [
          toHex32(contentHash),
          toHex32(ownerTag),
          canonicalTag,
          moderatorTag ?? ZERO_TAG,
          keccak256(stringToHex(contentUri)),
        ],
      ),
    );
    const res = await chipActionProof({
      contract: address as Hex,
      chainId: ACTIVE_CHAIN.id,
      actionTag: POST_TAG,
      scopeSeed: 0n,
      payloadHash,
      label: "post",
      tree,
      leaves,
    });

    return writeContractAsync(
      {
        ...base,
        functionName: "post",
        args: [
          res.proof,
          res.merkleRoot,
          res.nullifier,
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
      actionTag: EDIT_TAG,
      scopeSeed: BigInt(payloadHash),
      payloadHash,
      label,
      tree,
      leaves,
    });
  };

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
    let action;
    try {
      ctx?.setTxStatus({ phase: "pending", message: "provingZk" });
      if (await circuitAvailable("edit")) {
        const inputs = editProofInputs(contentHash, ownerTag, ZERO32, "0");
        proof = (await prove("edit", inputs)).proof;
      }
      const payloadHash = keccak256(
        encodeAbiParameters(
          [{ type: "uint256" }, { type: "bytes32" }, { type: "uint64" }],
          [BigInt(id), ZERO32, 0n],
        ),
      );
      action = await chipEdit(payloadHash, "edit");
    } catch (e) {
      console.log("comment remove proof failed", e);
      ctx?.setTxStatus({
        phase: "error",
        message: e instanceof Error ? e.message : "actFailed",
      });
      return;
    }
    return writeContractAsync(
      {
        ...base,
        functionName: "update",
        args: [
          BigInt(id),
          proof,
          action.proof,
          action.merkleRoot,
          action.nullifier,
          ZERO32,
          0n,
        ],
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
    let action;
    try {
      ctx?.setTxStatus({ phase: "pending", message: "provingZk" });
      if (await circuitAvailable("edit")) {
        const inputs = editProofInputs(
          anchor,
          canonicalTag,
          toHex32(BigInt(id)),
          "0",
        );
        proof = (await prove("edit", inputs)).proof;
      }
      const payloadHash = keccak256(
        encodeAbiParameters([{ type: "uint256" }], [BigInt(id)]),
      );
      action = await chipEdit(payloadHash, "moderate");
    } catch (e) {
      console.log("moderate proof failed", e);
      ctx?.setTxStatus({
        phase: "error",
        message: e instanceof Error ? e.message : "actFailed",
      });
      return;
    }
    return writeContractAsync(
      {
        ...base,
        functionName: "moderate",
        args: [
          BigInt(id),
          proof,
          action.proof,
          action.merkleRoot,
          action.nullifier,
        ],
        ...paymasterFields(),
      } as never,
      { successNote: note, anon: true },
    );
  };

  return {
    ready,
    count,
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
