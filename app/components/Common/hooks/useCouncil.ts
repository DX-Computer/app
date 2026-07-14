import { useContext } from "react";
import { useReadContract, usePublicClient } from "wagmi";
import {
  encodeAbiParameters,
  keccak256,
  sliceHex,
  stringToHex,
  type Hex,
} from "viem";
import { contractConfig } from "@/app/lib/contracts";
import { ACTIVE_CHAIN } from "@/app/lib/constants";
import { ModalContext } from "@/app/providers";
import { useTrackedWrite } from "./useTrackedWrite";
import { chipActionProof, seedField } from "@/app/lib/zk/chipAction";
import { buildIdentityTree } from "@/app/lib/zk/chipEnrollments";
import { buildPoolProof, withdrawSlot } from "@/app/lib/zk/poolTree";
import { toHex32 } from "@/app/lib/zk/poseidon";
import { prove } from "@/app/lib/zk/prover";
import { paymasterFields } from "@/app/lib/zk/paymaster";
import { useSubgraphQuery } from "./useSubgraphQuery";
import { PROPOSALS_QUERY } from "@/app/lib/graphql/queries";

type Address = `0x${string}`;

const VOTE_TAG = sliceHex(keccak256(stringToHex("dxCouncil.vote")), 0, 4);
const PROPOSE_TAG = sliceHex(
  keccak256(stringToHex("dxCouncil.propose")),
  0,
  4,
);
const ZERO_ADDR = "0x0000000000000000000000000000000000000000" as const;

export type ProposalRow = {
  id: string;
  proposalId: string;
  kind: string;
  project: string;
  value: string;
  executed: boolean;
  yes: string;
  no: string;
};

const useCouncil = () => {
  const { address: council, abi, ready } = contractConfig("dxCouncil");
  const registry = contractConfig("identityRegistry");
  const base = { address: council as Address, abi } as const;
  const { writeContractAsync, isPending, error } = useTrackedWrite();
  const ctx = useContext(ModalContext);
  const publicClient = usePublicClient();

  const { data, loading, ready: sgReady, refetch } = useSubgraphQuery<{
    councilProposals: ProposalRow[];
  }>("councilProposals", PROPOSALS_QUERY);
  const proposals = data?.councilProposals ?? [];
  const count = proposals.length;

  const { data: quorum } = useReadContract({
    ...base,
    functionName: "quorum",
    query: { enabled: ready },
  });

  const guard = (): boolean => {
    if (!ready || !council) {
      console.log("dxCouncil address not configured");
      return false;
    }
    return true;
  };

  const chipPropose = async (
    kind: number,
    wallet: Address,
    banned: boolean,
    value: bigint,
    contentUri: string,
  ) => {
    if (!registry.ready || !publicClient) {
      console.log("identityRegistry not configured");
      return null;
    }
    ctx?.setTxStatus({ phase: "pending", message: "provingZk" });
    const { tree, leaves } = await buildIdentityTree(
      publicClient,
      registry.address as Hex,
    );
    const payloadHash = keccak256(
      encodeAbiParameters(
        [
          { type: "uint8" },
          { type: "address" },
          { type: "bool" },
          { type: "uint256" },
          { type: "bytes32" },
        ],
        [kind, wallet, banned, value, keccak256(stringToHex(contentUri))],
      ),
    );
    return chipActionProof({
      contract: council as Hex,
      chainId: ACTIVE_CHAIN.id,
      actionTag: PROPOSE_TAG,
      scopeSeed: BigInt(payloadHash),
      payloadHash,
      label: "propose",
      tree,
      leaves,
    });
  };

  const sendPropose = async (
    kind: number,
    wallet: Address,
    banned: boolean,
    value: bigint,
    contentUri: string,
    functionName: string,
    tailArgs: unknown[],
    anonymous: boolean,
  ) => {
    if (!guard()) return;
    try {
      const res = await chipPropose(kind, wallet, banned, value, contentUri);
      if (!res) return;
      return await writeContractAsync(
        {
          ...base,
          functionName,
          args: [res.proof, res.merkleRoot, res.nullifier, ...tailArgs],
          ...(anonymous ? paymasterFields() : {}),
        } as never,
        { anon: anonymous },
      );
    } catch (e) {
      console.log("propose failed", e);
      ctx?.setTxStatus({
        phase: "error",
        message: e instanceof Error ? e.message : "actFailed",
      });
    }
  };

  const proposeQuorum = (
    newQuorum: bigint,
    contentUri: string,
    anonymous = false,
  ) =>
    sendPropose(1, ZERO_ADDR, false, newQuorum, contentUri, "proposeQuorum", [
      newQuorum,
      contentUri,
    ], anonymous);

  const proposeWindow = (
    newWindow: bigint,
    contentUri: string,
    anonymous = false,
  ) =>
    sendPropose(2, ZERO_ADDR, false, newWindow, contentUri, "proposeWindow", [
      newWindow,
      contentUri,
    ], anonymous);

  const proposeBan = (
    wallet: Address,
    banned: boolean,
    contentUri: string,
    anonymous = false,
  ) =>
    sendPropose(0, wallet, banned, 0n, contentUri, "proposeBan", [
      wallet,
      banned,
      contentUri,
    ], anonymous);

  const execute = async (proposalId: bigint, anonymous = false) => {
    if (!guard()) return;
    return writeContractAsync(
      {
        ...base,
        functionName: "execute",
        args: [proposalId],
        ...(anonymous ? paymasterFields() : {}),
      } as never,
      { anon: anonymous },
    );
  };

  const vote = async (proposalId: bigint, choice: 0 | 1) => {
    if (!guard()) return;
    if (!registry.ready || !publicClient) {
      console.log("identityRegistry not configured");
      return;
    }
    ctx?.setTxStatus({ phase: "pending", message: "provingZk" });
    let seed: bigint;
    try {
      seed = await seedField();
    } catch (e) {
      ctx?.setTxStatus({
        phase: "error",
        message: e instanceof Error ? e.message : "chipNotEnrolled",
      });
      return;
    }

    let snapshotIdentityRoot: bigint | undefined;
    let snapshotPoolRoot: bigint | undefined;
    let snapshotBucket: number | undefined;
    try {
      const p = (await publicClient.readContract({
        ...base,
        functionName: "proposals",
        args: [proposalId],
      })) as readonly unknown[];
      snapshotIdentityRoot = BigInt(p[0] as string | bigint);
      snapshotPoolRoot = BigInt(p[1] as string | bigint);
      snapshotBucket = Number(p[2] as number | bigint);
    } catch {}
    if (
      snapshotIdentityRoot === undefined ||
      snapshotPoolRoot === undefined ||
      snapshotBucket === undefined
    ) {
      ctx?.setTxStatus({ phase: "error", message: "reverted" });
      return;
    }

    let slot = await withdrawSlot(seed, snapshotBucket);
    for (let attempt = 0; attempt < 3 && !slot.ok; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      slot = await withdrawSlot(seed, snapshotBucket);
    }
    if (!slot.ok) {
      ctx?.setTxStatus(null);
      ctx?.setBalanceOpen(true);
      return;
    }

    let res = await buildPoolProof(seed, snapshotBucket, snapshotPoolRoot);
    for (let attempt = 0; attempt < 5 && !res.ok; attempt++) {
      res = await buildPoolProof(seed, snapshotBucket);
      if (!res.ok) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
    if (!res.ok) {
      if (res.reason === "noSnapshot") {
        ctx?.setTxStatus({ phase: "error", message: "registeredLate" });
      } else {
        ctx?.setTxStatus(null);
        ctx?.setBalanceOpen(true);
      }
      return;
    }

    let action;
    try {
      const { tree, leaves } = await buildIdentityTree(
        publicClient,
        registry.address as Hex,
        snapshotIdentityRoot,
      );
      const payloadHash = keccak256(
        encodeAbiParameters([{ type: "uint8" }], [choice]),
      );
      action = await chipActionProof({
        contract: council as Hex,
        chainId: ACTIVE_CHAIN.id,
        actionTag: VOTE_TAG,
        scopeSeed: proposalId,
        payloadHash,
        label: `vote:${proposalId}`,
        tree,
        leaves,
      });
    } catch (e) {
      console.log("vote: identity proof failed", e);
      ctx?.setTxStatus({
        phase: "error",
        message: e instanceof Error ? e.message : "chipNotEnrolled",
      });
      return;
    }

    let poolZkProof;
    try {
      ({ proof: poolZkProof } = await prove("voting", {
        identity_secret: seed.toString(),
        deposit_r: res.r!.toString(),
        siblings: res.data.proof.siblings.map((s) => s.toString()),
        indices: res.data.proof.indices,
        pool_root: res.data.root.toString(),
        scope: action.scope.toString(),
      }));
    } catch (e) {
      console.log("vote: pool proof failed", e);
      ctx?.setTxStatus({ phase: "error", message: "reverted" });
      return;
    }

    return writeContractAsync(
      {
        ...base,
        functionName: "vote",
        args: [
          action.proof,
          poolZkProof,
          toHex32(res.data.root),
          proposalId,
          choice,
          action.nullifier,
        ],
        ...paymasterFields(),
      } as never,
      { anon: true },
    );
  };

  const proposeBucket = (
    newBucket: number,
    contentUri: string,
    anonymous = false,
  ) =>
    sendPropose(
      3,
      ZERO_ADDR,
      false,
      BigInt(newBucket),
      contentUri,
      "proposeBucket",
      [newBucket, contentUri],
      anonymous,
    );

  return {
    ready,
    sgReady,
    loading,
    count,
    quorum,
    proposals,
    isPending,
    error,
    refetch,
    proposeQuorum,
    proposeWindow,
    proposeBan,
    proposeBucket,
    execute,
    vote,
    canVote: ready,
  };
};

export default useCouncil;
