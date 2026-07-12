import { useContext } from "react";
import { useReadContract, usePublicClient } from "wagmi";
import { contractConfig } from "@/app/lib/contracts";
import { ModalContext } from "@/app/providers";
import { useTrackedWrite } from "./useTrackedWrite";
import { ensureChipReady, ensureIdentity } from "@/app/lib/zk/identity";
import {
  buildGroup,
  councilScope,
  generateScopedProof,
  toContractProof,
  scopeHash,
} from "@/app/lib/zk/identityTree";
import { buildPoolProof, withdrawSlot } from "@/app/lib/zk/poolTree";
import { toHex32 } from "@/app/lib/zk/poseidon";
import { prove } from "@/app/lib/zk/prover";
import { paymasterFields } from "@/app/lib/zk/paymaster";
import { anonReady, anonWriteContract } from "@/app/lib/zk/anonSigner";
import { useSubgraphQuery } from "./useSubgraphQuery";
import { PROPOSALS_QUERY } from "@/app/lib/graphql/queries";

type Address = `0x${string}`;

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

  const proposeQuorum = async (
    newQuorum: bigint,
    contentUri: string,
    anonymous = false,
  ) => {
    if (!guard()) return;
    return writeContractAsync(
      {
        ...base,
        functionName: "proposeQuorum",
        args: [newQuorum, contentUri],
        ...(anonymous ? paymasterFields() : {}),
      } as never,
      { anon: anonymous },
    );
  };

  const proposeWindow = async (
    newWindow: bigint,
    contentUri: string,
    anonymous = false,
  ) => {
    if (!guard()) return;
    return writeContractAsync(
      {
        ...base,
        functionName: "proposeWindow",
        args: [newWindow, contentUri],
        ...(anonymous ? paymasterFields() : {}),
      } as never,
      { anon: anonymous },
    );
  };

  const proposeBan = async (
    wallet: Address,
    banned: boolean,
    contentUri: string,
    anonymous = false,
  ) => {
    if (!guard()) return;
    return writeContractAsync(
      {
        ...base,
        functionName: "proposeBan",
        args: [wallet, banned, contentUri],
        ...(anonymous ? paymasterFields() : {}),
      } as never,
      { anon: anonymous },
    );
  };

  const execute = async (proposalId: bigint, anonymous = false) => {
    if (!guard()) return;
    if (anonymous && anonReady()) {
      return anonWriteContract({
        address: base.address,
        abi: base.abi,
        functionName: "execute",
        args: [proposalId],
      });
    }
    return writeContractAsync({
      ...base,
      functionName: "execute",
      args: [proposalId],
    });
  };

  const vote = async (proposalId: bigint, choice: 0 | 1) => {
    if (!guard()) return;
    ctx?.setTxStatus({ phase: "pending", message: "provingZk" });
    let identity;
    try {
      await ensureChipReady();
      identity = ensureIdentity();
    } catch (e) {
      ctx?.setTxStatus({
        phase: "error",
        message: e instanceof Error ? e.message : "chipNotEnrolled",
      });
      return;
    }
    const group = await buildGroup();
    if (!group) {
      ctx?.setTxStatus({ phase: "error", message: "chipNotEnrolled" });
      return;
    }

    let snapshotRoot: bigint | undefined;
    let snapshotBucket: number | undefined;
    if (publicClient && council) {
      try {
        const p = (await publicClient.readContract({
          ...base,
          functionName: "proposals",
          args: [proposalId],
        })) as readonly unknown[];
        snapshotRoot = BigInt(p[1] as string | bigint);
        snapshotBucket = Number(p[2] as number | bigint);
      } catch {}
    }
    if (snapshotRoot === undefined || snapshotBucket === undefined) {
      ctx?.setTxStatus({ phase: "error", message: "reverted" });
      return;
    }

    let slot = await withdrawSlot(identity.secretScalar, snapshotBucket);
    for (let attempt = 0; attempt < 3 && !slot.ok; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      slot = await withdrawSlot(identity.secretScalar, snapshotBucket);
    }
    if (!slot.ok) {
      ctx?.setTxStatus(null);
      ctx?.setBalanceOpen(true);
      return;
    }

    const scope = councilScope(council as Address, proposalId);
    const voteProof = await generateScopedProof(identity, group, BigInt(choice), scope);
    if (!voteProof) {
      ctx?.setTxStatus({ phase: "error", message: "chipNotEnrolled" });
      return;
    }

    let res = await buildPoolProof(identity.secretScalar, snapshotBucket, snapshotRoot);
    for (let attempt = 0; attempt < 5 && !res.ok; attempt++) {
      res = await buildPoolProof(identity.secretScalar, snapshotBucket);
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

    let poolZkProof;
    try {
      ({ proof: poolZkProof } = await prove("voting", {
        identity_secret: identity.secretScalar.toString(),
        deposit_r: res.r!.toString(),
        siblings: res.data.proof.siblings.map((s) => s.toString()),
        indices: res.data.proof.indices,
        pool_root: res.data.root.toString(),
        scope_hash: scopeHash(scope).toString(),
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
        args: [toContractProof(voteProof), poolZkProof, toHex32(res.data.root), proposalId],
        ...paymasterFields(),
      } as never,
      { anon: true },
    );
  };

  const proposeBucket = async (
    newBucket: number,
    contentUri: string,
    anonymous = false,
  ) => {
    if (!guard()) return;
    return writeContractAsync(
      {
        ...base,
        functionName: "proposeBucket",
        args: [newBucket, contentUri],
        ...(anonymous ? paymasterFields() : {}),
      } as never,
      { anon: anonymous },
    );
  };

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
