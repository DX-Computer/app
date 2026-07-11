import { ADDRESSES, ContractKey } from "./addresses";
import { ERC20_ABI } from "./constants";
import { KIT_REGISTRY_ABI } from "./abis/kitRegistry";
import { KIT_SIGNAL_ABI } from "./abis/kitSignal";
import { CONTENT_REGISTRY_ABI } from "./abis/contentRegistry";
import { GRANT_REGISTRY_ABI } from "./abis/grantRegistry";
import { PREFAB_MARKET_ABI } from "./abis/prefabMarket";
import { SPONSOR_VAULT_ABI } from "./abis/sponsorVault";
import { MATROID_PAYMASTER_ABI } from "./abis/matroidPaymaster";
import { DX_COUNCIL_ABI } from "./abis/dxCouncil";
import { CYBERSWAGMAN_REGISTRY_ABI } from "./abis/cyberswagmanRegistry";
import { IDENTITY_REGISTRY_ABI } from "./abis/identityRegistry";
import { MONA_BALANCE_TREE_ABI } from "./abis/monaBalanceTree";

export const ABIS = {
  mona: ERC20_ABI,
  kitRegistry: KIT_REGISTRY_ABI,
  kitSignal: KIT_SIGNAL_ABI,
  contentRegistry: CONTENT_REGISTRY_ABI,
  grantRegistry: GRANT_REGISTRY_ABI,
  prefabMarket: PREFAB_MARKET_ABI,
  sponsorVault: SPONSOR_VAULT_ABI,
  paymaster: MATROID_PAYMASTER_ABI,
  dxCouncil: DX_COUNCIL_ABI,
  cyberswagmanRegistry: CYBERSWAGMAN_REGISTRY_ABI,
  identityRegistry: IDENTITY_REGISTRY_ABI,
  monaBalanceTree: MONA_BALANCE_TREE_ABI,
} as const;

export type AbiKey = keyof typeof ABIS;

export const contractConfig = <K extends AbiKey>(key: K) => {
  const address = ADDRESSES[key as ContractKey];
  return {
    address: address as `0x${string}`,
    abi: ABIS[key],
    ready: Boolean(address),
  } as const;
};
