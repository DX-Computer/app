export type Address = `0x${string}`;

const norm = (v?: string): Address | undefined =>
  v && /^0x[0-9a-fA-F]{40}$/.test(v) ? (v as Address) : undefined;

export const ADDRESSES = {
  mona: norm(process.env.NEXT_PUBLIC_MONA),
  registry: norm(process.env.NEXT_PUBLIC_REGISTRY),
  matroidKit: norm(process.env.NEXT_PUBLIC_MATROID_KIT),
  scorer: norm(process.env.NEXT_PUBLIC_SCORER),
  treasury: norm(process.env.NEXT_PUBLIC_TREASURY),
  globalStakingPool: norm(process.env.NEXT_PUBLIC_GLOBAL_STAKING_POOL),
  stakingFactory: norm(process.env.NEXT_PUBLIC_STAKING_FACTORY),
  slashingCouncil: norm(process.env.NEXT_PUBLIC_SLASHING_COUNCIL),
  governance: norm(process.env.NEXT_PUBLIC_GOVERNANCE),
  identityRegistry: norm(process.env.NEXT_PUBLIC_IDENTITY_REGISTRY),
  monaBalanceTree: norm(process.env.NEXT_PUBLIC_MONA_BALANCE_TREE),
  ballot: norm(process.env.NEXT_PUBLIC_BALLOT),
  contentRegistry: norm(process.env.NEXT_PUBLIC_CONTENT_REGISTRY),
  kitRegistry: norm(process.env.NEXT_PUBLIC_KIT_REGISTRY),
  kitSignal: norm(process.env.NEXT_PUBLIC_KIT_SIGNAL),
  paymaster: norm(process.env.NEXT_PUBLIC_PAYMASTER),
  // note: `paymaster` above is the deployed MatroidPaymaster contract address,
  // read directly via env in app/lib/zk/paymaster.ts for tx-level paymasterFields()
  sponsorVault: norm(process.env.NEXT_PUBLIC_SPONSOR_VAULT),
  dxCouncil: norm(process.env.NEXT_PUBLIC_DX_COUNCIL),
  grantRegistry: norm(process.env.NEXT_PUBLIC_GRANT_REGISTRY),
  cyberswagmanRegistry: norm(process.env.NEXT_PUBLIC_CYBERSWAGMAN_REGISTRY),
  prefabMarket: norm(process.env.NEXT_PUBLIC_PREFAB_MARKET),
  dxProject: norm(process.env.NEXT_PUBLIC_DX_PROJECT),
} as const;

export type ContractKey = keyof typeof ADDRESSES;

export const isConfigured = (key: ContractKey): boolean =>
  Boolean(ADDRESSES[key]);
