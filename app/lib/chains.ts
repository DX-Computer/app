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
  {
    id: 260,
    name: "zksync",
    rpcUrl: process.env.NEXT_PUBLIC_ZKSYNC_RPC_URL || "http://127.0.0.1:8011",
    explorerUrl: "",
    nativeSymbol: "ETH",
  },
  {
    id: 37111,
    name: "lens-testnet",
    rpcUrl:
      process.env.NEXT_PUBLIC_LENS_TESTNET_RPC_URL ||
      "https://rpc.testnet.lens.xyz",
    explorerUrl: "https://explorer.testnet.lens.xyz",
    nativeSymbol: "GRASS",
  },
];

export const ACTIVE_CHAIN: ChainConfig =
  CHAINS.find((c) => c.name === process.env.NEXT_PUBLIC_CHAIN) || CHAINS[0];

export const txUrl = (hash?: string): string =>
  hash && ACTIVE_CHAIN.explorerUrl
    ? `${ACTIVE_CHAIN.explorerUrl}/tx/${hash}`
    : "";

export const addressUrl = (address?: string): string =>
  address && ACTIVE_CHAIN.explorerUrl
    ? `${ACTIVE_CHAIN.explorerUrl}/address/${address}`
    : "";
