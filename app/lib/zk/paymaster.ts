import { getGeneralPaymasterInput } from "viem/zksync";
import { createPublicClient, http, parseEther } from "viem";
import { config } from "@/app/providers";

const PAYMASTER = process.env.NEXT_PUBLIC_PAYMASTER as
  | `0x${string}`
  | undefined;

export const paymasterReady = (): boolean =>
  Boolean(PAYMASTER && /^0x[0-9a-fA-F]{40}$/.test(PAYMASTER));

// True when the sponsor gas pool (the paymaster) is out of (or nearly out of)
// funds, so anonymous transactions it sponsors can no longer be paid for.
export const paymasterPoolEmpty = async (): Promise<boolean> => {
  if (!paymasterReady() || !PAYMASTER) return false;
  try {
    const chain = config.chains[0];
    const rpc =
      chain.id === 260
        ? process.env.NEXT_PUBLIC_ZKSYNC_RPC_URL
        : process.env.NEXT_PUBLIC_RPC_URL;
    const pub = createPublicClient({ chain, transport: http(rpc) });
    const balance = await pub.getBalance({ address: PAYMASTER });
    return balance < parseEther("0.01");
  } catch {
    return false;
  }
};

export const paymasterFields = ():
  | { paymaster: `0x${string}`; paymasterInput: `0x${string}` }
  | Record<string, never> => {
  if (!paymasterReady()) return {};
  return {
    paymaster: PAYMASTER as `0x${string}`,
    paymasterInput: getGeneralPaymasterInput({ innerInput: "0x" }),
  };
};
