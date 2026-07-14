import { useContext } from "react";
import { useAccount, usePublicClient, useReadContract } from "wagmi";
import {
  encodeAbiParameters,
  keccak256,
  sliceHex,
  stringToHex,
  type Hex,
} from "viem";
import { contractConfig } from "@/app/lib/contracts";
import { ModalContext } from "@/app/providers";
import { ACTIVE_CHAIN } from "@/app/lib/constants";
import {
  chipActionProof,
  nullifierHex,
  peekDeviceSecret,
  scopeOf,
} from "@/app/lib/zk/chipAction";
import { buildIdentityTree } from "@/app/lib/zk/chipEnrollments";
import { paymasterFields } from "@/app/lib/zk/paymaster";
import { useTrackedWrite } from "./useTrackedWrite";

type Hash = `0x${string}`;

const SIGNAL_TAG = sliceHex(keccak256(stringToHex("kitSignal.signal")), 0, 4);

const useKitSignal = (kitId?: bigint) => {
  const { address, abi, ready } = contractConfig("kitSignal");
  const registry = contractConfig("identityRegistry");
  const base = { address: address as Hash, abi } as const;
  const client = usePublicClient();
  const { writeContractAsync, isPending, error } = useTrackedWrite();
  const ctx = useContext(ModalContext);
  const { address: account } = useAccount();

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

  const seed = peekDeviceSecret();
  const myNullifier =
    seed && kitId !== undefined && address
      ? nullifierHex(seed, scopeOf(address as Hex, SIGNAL_TAG, kitId))
      : undefined;
  const { data: anonChoiceRaw, refetch: refetchAnon } = useReadContract({
    ...base,
    functionName: "reactionChoice",
    args: kitId !== undefined && myNullifier ? [kitId, myNullifier] : undefined,
    query: { enabled: ready && kitId !== undefined && Boolean(myNullifier) },
  });
  const myAnonChoice =
    typeof anonChoiceRaw === "number" && anonChoiceRaw > 0
      ? ((anonChoiceRaw - 1) as 0 | 1)
      : -1;

  const plus = typeof plusRaw === "bigint" ? Number(plusRaw) : 0;
  const minus = typeof minusRaw === "bigint" ? Number(minusRaw) : 0;

  const canSignal = ready && kitId !== undefined;

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
    if (!registry.ready || !client) {
      console.log("identityRegistry not configured");
      return;
    }
    ctx?.setTxStatus({ phase: "pending", message: "provingZk" });
    const { tree, leaves } = await buildIdentityTree(
      client,
      registry.address as Hex,
    );
    const nonce = BigInt(Date.now());
    const payloadHash = keccak256(
      encodeAbiParameters(
        [{ type: "uint8" }, { type: "uint256" }],
        [code, nonce],
      ),
    );
    const res = await chipActionProof({
      contract: address as Hex,
      chainId: ACTIVE_CHAIN.id,
      actionTag: SIGNAL_TAG,
      scopeSeed: kitId,
      payloadHash,
      label: `signal:kit${kitId}`,
      tree,
      leaves,
    });

    const hash = await writeContractAsync(
      {
        ...base,
        functionName: "signal",
        args: [res.proof, res.merkleRoot, kitId, code, nonce, res.nullifier],
        ...paymasterFields(),
      } as never,
      { anon: true },
    );
    refetchAnon();
    refetchPlus();
    refetchMinus();
    return hash;
  };

  const signal = (choice: 0 | 1, mode: "anonymous" | "public" = "anonymous") => {
    const current = mode === "public" ? myPublicChoice : myAnonChoice;
    return send(current === choice ? 2 : choice, mode);
  };
  const retract = (mode: "anonymous" | "public" = "anonymous") =>
    send(2, mode);

  return {
    plus,
    minus,
    canSignal,
    myPublicChoice,
    myAnonChoice,
    signal,
    retract,
    isPending,
    error,
  };
};

export default useKitSignal;
