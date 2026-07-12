import { useContext } from "react";
import { useAccount, useReadContract } from "wagmi";
import { contractConfig } from "@/app/lib/contracts";
import { ModalContext } from "@/app/providers";
import { ensureChipReady, ensureIdentity, getIdentity } from "@/app/lib/zk/identity";
import { buildGroup, generateScopedProof, toContractProof, semaphoreNullifier } from "@/app/lib/zk/identityTree";
import { paymasterFields } from "@/app/lib/zk/paymaster";
import { useTrackedWrite } from "./useTrackedWrite";
import useChip from "./useChip";
import useIdentity from "./useIdentity";
import useWalkthrough from "./useWalkthrough";

type Hash = `0x${string}`;

const useKitSignal = (kitId?: bigint) => {
  const { address, abi, ready } = contractConfig("kitSignal");
  const base = { address: address as Hash, abi } as const;
  const { writeContractAsync, isPending, error } = useTrackedWrite();
  const ctx = useContext(ModalContext);
  const signer = useChip();
  const id = useIdentity(signer.commitment);
  const { openWalkthrough } = useWalkthrough();

  const { data: plusRaw, refetch: refetchPlus } = useReadContract({
    ...base,
    functionName: "tally",
    args: kitId !== undefined ? [kitId, 1] : undefined,
    query: { enabled: ready && kitId !== undefined },
  });
  const { data: minusRaw, refetch: refetchMinus } = useReadContract({
    ...base,
    functionName: "tally",
    args: kitId !== undefined ? [kitId, 0] : undefined,
    query: { enabled: ready && kitId !== undefined },
  });

  const { address: account } = useAccount();
  const { data: publicChoiceRaw, refetch: refetchPublic } = useReadContract({
    ...base,
    functionName: "publicChoice",
    args: kitId !== undefined && account ? [kitId, account] : undefined,
    query: { enabled: ready && kitId !== undefined && Boolean(account) },
  });
  const myPublicChoice =
    typeof publicChoiceRaw === "number" && publicChoiceRaw > 0
      ? ((publicChoiceRaw - 1) as 0 | 1)
      : -1;

  const anonId = getIdentity();
  const myNullifier =
    anonId && kitId !== undefined
      ? semaphoreNullifier(kitId, anonId.secretScalar)
      : undefined;
  const { data: anonChoiceRaw, refetch: refetchAnon } = useReadContract({
    ...base,
    functionName: "reactionChoice",
    args:
      kitId !== undefined && myNullifier !== undefined
        ? [kitId, myNullifier]
        : undefined,
    query: {
      enabled: ready && kitId !== undefined && myNullifier !== undefined,
    },
  });
  const myAnonChoice =
    typeof anonChoiceRaw === "number" && anonChoiceRaw > 0
      ? ((anonChoiceRaw - 1) as 0 | 1)
      : -1;

  const plus = typeof plusRaw === "bigint" ? Number(plusRaw) : 0;
  const minus = typeof minusRaw === "bigint" ? Number(minusRaw) : 0;

  const canSignal = ready && kitId !== undefined;
  const note = !ready
    ? "set NEXT_PUBLIC_KIT_SIGNAL"
    : kitId === undefined
    ? "open a published kit"
    : "anonymous · proven from your identity";

  const send = async (
    code: 0 | 1 | 2,
    mode: "anonymous" | "public" = "anonymous",
  ) => {
    if (!ready || !address || kitId === undefined) {
      console.log("kitSignal not ready");
      return;
    }
    if (mode === "public") {
      const hash = await writeContractAsync({
        ...base,
        functionName: "signalPublic",
        args: [kitId, code],
      });
      refetchPublic();
      refetchPlus();
      refetchMinus();
      return hash;
    }
    if (!id.enrolled) {
      openWalkthrough();
      return;
    }
    await ensureChipReady();
    const identity = ensureIdentity();
    const group = await buildGroup();
    if (!group) {
      openWalkthrough();
      return;
    }
    ctx?.setTxStatus({ phase: "pending", message: "provingZk" });
    const message = BigInt(code) + (BigInt(Date.now()) << 2n);
    const proof = await generateScopedProof(identity, group, message, kitId);
    if (!proof) {
      openWalkthrough();
      return;
    }

    const hash = await writeContractAsync(
      {
        ...base,
        functionName: "signal",
        args: [toContractProof(proof), kitId],
        ...paymasterFields(),
      } as never,
      { anon: true },
    );
    refetchAnon();
    refetchPlus();
    refetchMinus();
    return hash;
  };

  const signal = (choice: 0 | 1, mode: "anonymous" | "public" = "anonymous") =>
    send(choice, mode);
  const retract = (mode: "anonymous" | "public" = "anonymous") =>
    send(2, mode);

  return {
    plus,
    minus,
    canSignal,
    myPublicChoice,
    myAnonChoice,
    note,
    signal,
    retract,
    isPending,
    error,
  };
};

export default useKitSignal;
