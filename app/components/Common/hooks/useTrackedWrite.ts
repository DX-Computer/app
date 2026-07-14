import { useContext } from "react";
import { useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { ModalContext, config } from "@/app/providers";
import { anonReady, anonWriteContract } from "@/app/lib/zk/anonSigner";
import { paymasterPoolEmpty } from "@/app/lib/zk/paymaster";
import { ACTIVE_CHAIN } from "@/app/lib/constants";

type WriteParams = Parameters<ReturnType<typeof useWriteContract>["writeContractAsync"]>[0];
type TrackedWriteOptions = { successNote?: string; anon?: boolean };

export const useTrackedWrite = () => {
  const ctx = useContext(ModalContext);
  const { writeContractAsync, isPending, error } = useWriteContract();

  const tracked = async (params: WriteParams, options?: TrackedWriteOptions) => {
    ctx?.setTxStatus({ phase: "pending" });
    try {
      const hash =
        options?.anon && anonReady()
          ? await anonWriteContract(params as never)
          : await writeContractAsync(params);
      ctx?.setTxStatus({ phase: "pending", hash });
      const receipt = await waitForTransactionReceipt(config, {
        hash,
        chainId: ACTIVE_CHAIN.id as never,
      });
      if (receipt.status === "reverted") {
        ctx?.setTxStatus({ phase: "error", hash, message: "reverted" });
        throw new Error("transaction reverted");
      }
      ctx?.setTxStatus({ phase: "success", hash, note: options?.successNote });
      return hash;
    } catch (e) {
      if (options?.anon && (await paymasterPoolEmpty())) {
        ctx?.setTxStatus(null);
        ctx?.setSponsorOpen(true);
        throw e;
      }
      ctx?.setTxStatus((current) =>
        current?.phase === "error"
          ? current
          : {
              phase: "error",
              message: e instanceof Error ? e.message : "unknownError",
            }
      );
      throw e;
    }
  };

  return { writeContractAsync: tracked, isPending, error };
};

export default useTrackedWrite;
