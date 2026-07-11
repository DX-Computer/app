export type ChainConfig = {
  id: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeSymbol: string;
};

export const CHAINS: ChainConfig[] = [
  {
    id: 31337,
    name: "anvil",
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545",
    explorerUrl: "https://anvil",
    nativeSymbol: "ETH",
  },
];

export const ACTIVE_CHAIN: ChainConfig = CHAINS[0];

export const txUrl = (hash?: string): string =>
  hash && ACTIVE_CHAIN.explorerUrl
    ? `${ACTIVE_CHAIN.explorerUrl}/tx/${hash}`
    : "";

export const addressUrl = (address?: string): string =>
  address && ACTIVE_CHAIN.explorerUrl
    ? `${ACTIVE_CHAIN.explorerUrl}/address/${address}`
    : "";
