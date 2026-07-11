import { createPublicClient, createWalletClient, http, parseEther } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { eip712WalletActions } from "viem/zksync";
import { paymasterFields, paymasterReady } from "./paymaster";
import { config } from "@/app/providers";

const KEY = "dx-anon-burner-key";

const DEV_FAUCETS: Record<number, `0x${string}` | undefined> = {
  31337: process.env.NEXT_PUBLIC_DEV_FAUCET_31337 as `0x${string}` | undefined,
  260: process.env.NEXT_PUBLIC_DEV_FAUCET_260 as `0x${string}` | undefined,
};

const RPC_URLS: Record<number, string | undefined> = {
  31337: process.env.NEXT_PUBLIC_RPC_URL,
  260: process.env.NEXT_PUBLIC_ZKSYNC_RPC_URL,
};

const transportFor = (chainId: number) => http(RPC_URLS[chainId]);

const devFaucetReady = (): boolean =>
  Boolean(DEV_FAUCETS[config.chains[0].id]);

export const anonReady = (): boolean => paymasterReady() || devFaucetReady();

const anonKey = (): `0x${string}` => {
  let k = window.localStorage.getItem(KEY) as `0x${string}` | null;
  if (!k) {
    k = generatePrivateKey();
    window.localStorage.setItem(KEY, k);
  }
  return k;
};

const ensureDevFunds = async (
  burner: `0x${string}`,
): Promise<void> => {
  const chain = config.chains[0];
  const faucetKey = DEV_FAUCETS[chain.id];
  if (!faucetKey) return;
  const pub = createPublicClient({ chain, transport: transportFor(chain.id) });
  const balance = await pub.getBalance({ address: burner });
  if (balance >= parseEther("0.05")) return;
  const faucet = createWalletClient({
    account: privateKeyToAccount(faucetKey),
    chain,
    transport: transportFor(chain.id),
  });
  const hash = await faucet.sendTransaction({
    to: burner,
    value: parseEther("1"),
  });
  await pub.waitForTransactionReceipt({ hash });
};

export const anonWriteContract = async (params: {
  address: `0x${string}`;
  abi: readonly unknown[];
  functionName: string;
  args: readonly unknown[];
}): Promise<`0x${string}`> => {
  const account = privateKeyToAccount(anonKey());
  const chain = config.chains[0];
  if (paymasterReady()) {
    const client = createWalletClient({
      account,
      chain,
      transport: transportFor(chain.id),
    }).extend(eip712WalletActions());
    return client.writeContract({
      ...params,
      ...paymasterFields(),
    } as never);
  }
  await ensureDevFunds(account.address);
  const client = createWalletClient({
    account,
    chain,
    transport: transportFor(chain.id),
  });
  return client.writeContract(params as never);
};
