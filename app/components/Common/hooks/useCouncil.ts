import { useContext } from "react";
import { useReadContract, usePublicClient } from "wagmi";
import { contractConfig } from "@/app/lib/contracts";
import { ModalContext } from "@/app/providers";
import { useTrackedWrite } from "./useTrackedWrite";
import { ensureIdentity } from "@/app/lib/zk/identity";
import {
  buildGroup,
  generateScopedProof,
  toContractProof,
  BALANCE_LINK_SCOPE,
} from "@/app/lib/zk/identityTree";
import { buildBalanceProof } from "@/app/lib/zk/balanceTree";
import { prove } from "@/app/lib/zk/prover";
import { paymasterFields } from "@/app/lib/zk/paymaster";
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

  const { data: minBalanceRaw } = useReadContract({
    ...base,
    functionName: "minBalance",
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

  const execute = async (proposalId: bigint) => {
    if (!guard()) return;
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

    const voteProof = await generateScopedProof(identity, group, BigInt(choice), proposalId);
    if (!voteProof) {
      ctx?.setTxStatus({ phase: "error", message: "chipNotEnrolled" });
      return;
    }
    const balanceLinkProof = await generateScopedProof(identity, group, 0n, BALANCE_LINK_SCOPE);
    if (!balanceLinkProof) {
      ctx?.setTxStatus({ phase: "error", message: "chipNotEnrolled" });
      return;
    }

    const balanceKey = BigInt(balanceLinkProof.nullifier);
    const minBalance = typeof minBalanceRaw === "bigint" ? minBalanceRaw : 0n;

    let snapshotRoot: bigint | undefined;
    if (publicClient && council) {
      try {
        const p = (await publicClient.readContract({
          ...base,
          functionName: "proposals",
          args: [proposalId],
        })) as readonly unknown[];
        snapshotRoot = BigInt(p[1] as string | bigint);
      } catch {}
    }

    const res = await buildBalanceProof(balanceKey, snapshotRoot);
    if (!res.ok) {
      if (res.reason === "registeredLate") {
        ctx?.setTxStatus({ phase: "error", message: "registeredLate" });
      } else {
        ctx?.setTxStatus(null);
        ctx?.setBalanceOpen(true);
      }
      return;
    }
    const balp = res.data;

    let balanceZkProof;
    try {
      ({ proof: balanceZkProof } = await prove("voting", {
        balance: balp.balance.toString(),
        bal_siblings: balp.proof.siblings.map((s) => s.toString()),
        bal_indices: balp.proof.indices,
        balance_root: balp.root.toString(),
        min_balance: minBalance.toString(),
        balance_key: balanceKey.toString(),
      }));
    } catch (e) {
      console.log("vote: balance proof failed", e);
      ctx?.setTxStatus({ phase: "error", message: "reverted" });
      return;
    }

    return writeContractAsync(
      {
        ...base,
        functionName: "vote",
        args: [
          toContractProof(voteProof),
          toContractProof(balanceLinkProof),
          balanceZkProof,
          proposalId,
        ],
        ...paymasterFields(),
      } as never,
      { anon: true },
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
    execute,
    vote,
    canVote: ready,
  };
};

export default useCouncil;
