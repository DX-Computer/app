import { Post } from "@lens-protocol/client";
import { ReactNode, SetStateAction } from "react";

export type FooterProps = {
  dict: any;
};

export enum ItemType {
  CoinOp = "coinop",
  Chromadin = "chromadin",
  Listener = "listener",
  F3M = "f3m",
  Other = "other",
  Kinora = "kinora",
  TheDial = "dial",
}

export type HeartProps = {
  changeColor?: () => void;
  heartColor: string;
};

export type KitVersionMeta = {
  version: string;
  contentUri: string;
  designHash: string;
  createdAtBlock: string;
  createdAtTimestamp: string;
  transactionHash: string;
};

export type KitGrantRef = {
  id: string;
  grantId: string;
  contentUri: string;
  budget: string;
  raised: string;
  funders: number;
};

export type KitOfferRef = {
  id: string;
  offerId: string;
  contentUri: string;
  price: string;
  quantity: string;
  sliceBps: number;
  grantLinked: boolean;
};

export type CreatorBanRow = {
  creator: string;
  actor: string;
  banned: boolean;
  time: string;
  tx: string;
};

export type OrderRow = {
  id: string;
  buyer: string;
  quantity: number;
  status: string;
  stage: number;
  time: string;
  tx: string;
};

export type ManagedOrder = {
  id: string;
  offerId: string;
  buyer: string;
  title: string;
  quantity: number;
  status: string;
  stage: number;
  deadline: number;
  total: number;
  slice: number;
  grantSlice: number;
  cyberSlice: number;
  grantId: string;
  encryptedShipping: string;
  time: string;
  tx: string;
};

export type MyOrders = {
  bought: ManagedOrder[];
  sold: ManagedOrder[];
};

export type KitAgentRef = {
  agent: {
    agentId: string;
    contentUri: string;
  };
};

export type RoadmapPhase = {
  id: string;
  title: string;
  status: string;
  stage: number;
  image: string;
  video?: string;
  pdf?: string;
  hardware: string[];
  software: string[];
  fabrication: string[];
  desc: string;
  mode?: string;
  ownerTag?: string;
  parentId?: string;
  version?: string;
  contentUri?: string;
  designHash?: string;
  createdAtBlock?: string;
  createdAtTimestamp?: string;
  updatedAtTimestamp?: string;
  transactionHash?: string;
  tags?: string[];
  summary?: string;
  versions?: KitVersionMeta[];
  grants?: KitGrantRef[];
  offers?: KitOfferRef[];
  agents?: KitAgentRef[];
};

export type KitScreenProps = {
  dict: any;
};

export type Filters = {
  text: string;
  tags: string[];
  hardware: string[];
  software: string[];
  fabrication: string[];
  stage: number;
  mode: string;
  fork: string;
};

export type ShellContextValue = {
  dict: any;
  lang: string;
  isHome: boolean;
  isKit: boolean;
  kitId: string;
  kitVersion: string;
  conn: ConnectionState;
  ui: any;
  labels: any;
  rungs: string[];
  rungCount: number;
  filters: Filters;
  setFilters: (v: SetStateAction<Filters>) => void;
  allItems: RoadmapPhase[];
  filtered: RoadmapPhase[];
  selectedId: string;
  setSelectedId: (v: string) => void;
  selected?: RoadmapPhase;
};

export type ShellProps = {
  dict: any;
  left?: ReactNode;
  children?: ReactNode;
};

export type CajaProps = {
  children?: ReactNode;
  className?: string;
  border?: string;
  borderWidth?: number;
  slice?: number;
  bg?: string;
  type?: string;
};

export type BandaProps = {
  brick: string;
  mosaic: string;
  button: string;
  height?: number;
  rail?: number;
  segments?: number;
  vertical?: boolean;
};

export type MarcoProps = {
  children?: ReactNode;
  className?: string;
  brick?: string;
  mosaic?: string;
  button?: string;
  height?: number;
  rail?: number;
  segments?: number;
  top?: boolean;
  bottom?: boolean;
  left?: boolean;
  right?: boolean;
};

export type PortProps = {
  kind: string;
  color: string;
  size?: number;
};

export type LedProps = {
  tone?: string;
  size?: number;
  on?: boolean;
};

export type KeyButtonProps = {
  label?: string;
  sub?: string;
  tone?: string;
  lit?: boolean;
  onPress?: () => void;
};

export type BarButtonProps = {
  label?: string;
  tone?: string;
  onPress?: () => void;
};

export type KnobProps = {
  label?: string;
  tone?: string;
  angle?: number;
  size?: number;
};

export type EqualizerProps = {
  values?: number[];
  label?: string;
};

export type GaugeProps = {
  segments?: number;
  value?: number;
  colors?: string[];
};

export type ReadoutProps = {
  text?: string;
  tone?: string;
  align?: string;
  className?: string;
};

export type NameplateProps = {
  title?: string;
  sub?: string;
};

export type HatchProps = {
  label?: string;
  height?: number;
};

export type ChassisProps = {
  children?: ReactNode;
  className?: string;
};

export type WinProps = { title?: string; children?: ReactNode };
export type WinBtnProps = { sym?: string; onPress?: () => void };
export type MenuBarProps = { items?: string[] };
export type LcdProps = { children?: ReactNode; className?: string };
export type SegProps = { value?: string; size?: number };
export type SpectrumProps = { bars?: number[]; height?: number };
export type IndicatorProps = { label?: string; on?: boolean };
export type RoundBtnProps = { sym?: string; size?: number; onPress?: () => void };
export type GlossBtnProps = {
  label?: string;
  active?: boolean;
  tone?: string;
  onPress?: () => void;
  className?: string;
};
export type TabProps = { label?: string; active?: boolean; onPress?: () => void };
export type FaderProps = { label?: string; value?: number; sub?: string };
export type HSliderProps = { value?: number; className?: string };
export type PlRowProps = {
  left?: string;
  right?: string;
  sub?: string;
  selected?: boolean;
  idx?: number;
  onPress?: () => void;
};

export type ConnectionState = {
  address?: `0x${string}`;
  isConnected: boolean;
  short: string;
  network: string;
  wrongNetwork: boolean;
  nativeText: string;
  monaText: string;
  connect: () => void;
  disconnect: () => void;
  switchNetwork: () => void;
};

export type BandProps = { label?: string; accent?: string; children?: ReactNode };
export type JackProps = {
  kind?: string;
  color?: string;
  label?: string;
  sub?: string;
  selected?: boolean;
  onPress?: () => void;
};
export type BtnProps = {
  label?: string;
  accent?: string;
  active?: boolean;
  onPress?: () => void;
  className?: string;
};

export type ConnectorProps = { type?: string; size?: number };

export type ListKey = "tags" | "hardware" | "software" | "fabrication";

export type KitDraft = {
  id: string;
  mode: string;
  title: string;
  summary: string;
  tags: string[];
  hardware: string[];
  software: string[];
  fabrication: string[];
  stage: number;
  image: string;
  video: string;
  pdf: string;
  parent: string;
};

export type CreateKitState = {
  mode: string;
  setMode: (v: string) => void;
  title: string;
  setTitle: (v: string) => void;
  summary: string;
  setSummary: (v: string) => void;
  lists: {
    tags: string[];
    hardware: string[];
    software: string[];
    fabrication: string[];
  };
  inputs: {
    tags: string;
    hardware: string;
    software: string;
    fabrication: string;
  };
  setInput: (key: ListKey, v: string) => void;
  addChip: (key: ListKey) => void;
  removeChip: (key: ListKey, i: number) => void;
  stage: number;
  setStage: (v: number) => void;
  image: string;
  setImage: (v: string) => void;
  video: string;
  setVideo: (v: string) => void;
  pdf: string;
  setPdf: (v: string) => void;
  parent: string;
  setParent: (v: string) => void;
  build: () => void;
  reset: () => void;
  canSubmit: boolean;
};

export type GrantMilestone = {
  title: string;
  description: string;
  deliverable: string;
};

export type GrantDraft = {
  id: string;
  mode: string;
  kit: string;
  title: string;
  purpose: string;
  image: string;
  budget: string;
  deliverables: string;
  milestones: GrantMilestone[];
  links: string[];
};

export type CreateGrantState = {
  mode: string;
  setMode: (v: string) => void;
  kit: string;
  setKit: (v: string) => void;
  title: string;
  setTitle: (v: string) => void;
  purpose: string;
  setPurpose: (v: string) => void;
  image: string;
  setImage: (v: string) => void;
  budget: string;
  setBudget: (v: string) => void;
  deliverables: string;
  setDeliverables: (v: string) => void;
  milestones: GrantMilestone[];
  setMilestone: (i: number, field: keyof GrantMilestone, v: string) => void;
  addMilestone: () => void;
  removeMilestone: (i: number) => void;
  links: string[];
  linkInput: string;
  setLinkInput: (v: string) => void;
  addLink: () => void;
  removeLink: (i: number) => void;
  build: () => void;
  reset: () => void;
  canSubmit: boolean;
};

export type CreateGrantProps = {
  onCreate: (draft: GrantDraft) => void;
  initial?: Partial<GrantDraft>;
  editMode?: boolean;
};

export type ProductOption = {
  label: string;
  choices: string[];
};

export type ProductDraft = {
  id: string;
  kit: string;
  version: string;
  designHash: string;
  title: string;
  description: string;
  image: string;
  gallery: string[];
  video: string;
  audio: string;
  price: string;
  sliceBps: number;
  cyberBps: number;
  confirmDays: string;
  quantity: string;
  options: ProductOption[];
};

export type CreateProductState = {
  kit: string;
  setKit: (v: string) => void;
  version: string;
  designHash: string;
  setVersion: (version: string, designHash: string) => void;
  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  image: string;
  setImage: (v: string) => void;
  gallery: string[];
  galleryInput: string;
  setGalleryInput: (v: string) => void;
  addGalleryImage: () => void;
  removeGalleryImage: (i: number) => void;
  video: string;
  setVideo: (v: string) => void;
  audio: string;
  setAudio: (v: string) => void;
  price: string;
  setPrice: (v: string) => void;
  share: string;
  setShare: (v: string) => void;
  cyberShare: string;
  setCyberShare: (v: string) => void;
  confirmDays: string;
  setConfirmDays: (v: string) => void;
  quantity: string;
  setQuantity: (v: string) => void;
  options: ProductOption[];
  optionLabel: string;
  optionChoices: string;
  setOptionLabel: (v: string) => void;
  setOptionChoices: (v: string) => void;
  addOption: () => void;
  removeOption: (i: number) => void;
  build: () => void;
  reset: () => void;
  canSubmit: boolean;
};

export type CreateProductProps = {
  onCreate: (draft: ProductDraft) => void;
  initial?: Partial<ProductDraft>;
  editMode?: boolean;
};

export type DashboardTheme =
  | "launches"
  | "comments"
  | "purchases"
  | "sales"
  | "governance"
  | "earnings";

export type DashboardSignalRow = {
  kitId: string;
  choice: number;
  mode: "public" | "anonymous";
};

export type DashboardData = {
  kits: { id: string; title: string; revoked: boolean }[];
  offers: {
    id: string;
    title: string;
    exists: boolean;
    price: number;
    quantity: number;
  }[];
  grants: {
    id: string;
    title: string;
    removed: boolean;
    budget: number;
    raised: number;
  }[];
  agents: { id: string; title: string }[];
  comments: {
    id: string;
    text: string;
    revoked: boolean;
    time: string;
    href: string;
  }[];
  signals: DashboardSignalRow[];
  orders: {
    id: string;
    offerId: string;
    title: string;
    status: string;
    time: string;
  }[];
  proposals: {
    id: string;
    kind: number;
    executed: boolean;
    end: string;
    yes: number;
    no: number;
  }[];
  bans: {
    creator: string;
    banned: boolean;
    time: string;
    tx: string;
  }[];
  fundedGrants: {
    id: string;
    title: string;
    removed: boolean;
    shares: number;
  }[];
  votedProposals: { id: string; choice: number }[];
  treeliner: { staked: number; claimed: number; grantsFunded: number } | null;
};

export type AgentFilters = {
  text: string;
  cyberswagman: string;
  kit: string;
  tags: string[];
};

export type AgentSummary = {
  id: string;
  owner: string;
  name: string;
  description: string;
  image: string;
  tags: string[];
  kits: string[];
};

export type AgentResultRow = {
  kitId: string;
  resultHash: string;
  contentUri: string;
  tx: string;
};

export type AgentDetail = {
  id: string;
  owner: string;
  kits: string[];
  results: AgentResultRow[];
  name: string;
  description: string;
  image: string;
  video: string;
  audio: string;
  tags: string[];
  architecture: string;
  weights: string;
  code: string;
  datasets: string[];
  training: string;
  software: string[];
  reproduce: string;
  io: string;
  hwSpec: string;
  bom: string[];
  assembly: string;
  createdAtBlock: string;
  createdAtTimestamp: string;
  transactionHash: string;
  contentUri: string;
};

export type CyberswagmanStats = {
  address: string;
  agentCount: number;
};

export type CyberswagmanScreenProps = {
  dict: any;
  address: string;
};

export type TreelinerStats = {
  address: string;
  totalStaked: number;
  totalClaimed: number;
  grantsFunded: number;
};

export type TreelinerScreenProps = {
  dict: any;
  address: string;
};

export type ProposalSummary = {
  id: string;
  kind: number;
  contentUri: string;
  title: string;
  reason: string;
  links: string[];
  target: string;
  project: string;
  banned: boolean;
  value: string;
  extra: string;
  start: number;
  end: number;
  executed: boolean;
  yes: number;
  no: number;
  tx: string;
};

export type GovernScreenProps = {
  dict: any;
};

export type ProposalScreenProps = {
  dict: any;
  id: string;
};

export type ProposalsCenterProps = {
  proposals: ProposalSummary[];
};

export type AgentsLeftProps = {
  filters: AgentFilters;
  setFilters: (v: SetStateAction<AgentFilters>) => void;
  count: number;
  total: number;
};

export type AgentsCenterProps = {
  agents: AgentSummary[];
};

export type AgentsScreenProps = {
  dict: any;
};

export type AgentListKey = "tags" | "links" | "datasets" | "software" | "bom";

export type AgentDraft = {
  id: string;
  name: string;
  description: string;
  image: string;
  video: string;
  audio: string;
  tags: string[];
  links: string[];
  architecture: string;
  weights: string;
  code: string;
  datasets: string[];
  training: string;
  software: string[];
  reproduce: string;
  io: string;
  license: string;
  hwSpec: string;
  bom: string[];
  assembly: string;
  kits: string[];
};

export type CreateAgentState = {
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  image: string;
  setImage: (v: string) => void;
  video: string;
  setVideo: (v: string) => void;
  audio: string;
  setAudio: (v: string) => void;
  architecture: string;
  setArchitecture: (v: string) => void;
  weights: string;
  setWeights: (v: string) => void;
  code: string;
  setCode: (v: string) => void;
  training: string;
  setTraining: (v: string) => void;
  reproduce: string;
  setReproduce: (v: string) => void;
  io: string;
  setIo: (v: string) => void;
  hwSpec: string;
  setHwSpec: (v: string) => void;
  assembly: string;
  setAssembly: (v: string) => void;
  lists: { [k in AgentListKey]: string[] };
  inputs: { [k in AgentListKey]: string };
  setInput: (key: AgentListKey, v: string) => void;
  addChip: (key: AgentListKey) => void;
  removeChip: (key: AgentListKey, i: number) => void;
  kits: string[];
  addKit: (id: string) => void;
  removeKit: (id: string) => void;
  build: () => void;
  reset: () => void;
  canSubmit: boolean;
};

export type CreateAgentProps = {
  onCreate: (draft: AgentDraft) => void;
  initial?: Partial<AgentDraft>;
};

export type CreateKitProps = {
  onCreate: (draft: KitDraft) => void;
  parents: { id: string; title: string }[];
  labels: any;
  rungs: string[];
  initial?: Partial<KitDraft>;
};


export type FlywheelNode = {
  key: string;
  label: string;
  detail: string;
};

export type FlywheelProps = {
  dict: any;
};

export type EconomyProps = {
  dict: any;
};

export type VideoPlayerProps = {
  src: string;
};

export type ChipEnrollData = {
  commitment: `0x${string}`;
  proof: `0x${string}`;
  enrollNullifier: `0x${string}`;
};

export type ChipPublishData = {
  semaphoreProof: import("@/app/lib/zk/identityTree").ContractSemaphoreProof;
  ownerTag: `0x${string}`;
};

export type GrantFilters = {
  text: string;
  kit: string;
  status: string;
  funders: string;
};

export type GrantSummary = {
  id: string;
  kitId: string;
  creator: string;
  title: string;
  purpose: string;
  image: string;
  budget: number;
  raised: number;
  funders: number;
};

export type GrantFunderRow = {
  funder: string;
  shares: number;
};

export type GrantDetail = {
  id: string;
  kitId: string;
  creator: string;
  title: string;
  purpose: string;
  image: string;
  deliverables: string;
  milestones: GrantMilestone[];
  links: string[];
  budget: number;
  raised: number;
  totalShares: number;
  funders: number;
  removed: boolean;
  createdAtBlock: string;
  createdAtTimestamp: string;
  updatedAtTimestamp: string;
  transactionHash: string;
  contentUri: string;
};

export type GrantsLeftProps = {
  filters: GrantFilters;
  setFilters: (v: SetStateAction<GrantFilters>) => void;
  count: number;
  total: number;
};

export type GrantsCenterProps = {
  grants: GrantSummary[];
};

export type GrantsScreenProps = {
  dict: any;
};

export type ProductFilters = {
  text: string;
  kit: string;
  price: string;
  stock: string;
  grant: string;
};

export type ProductSummary = {
  id: string;
  kitId: string;
  fabricator: string;
  title: string;
  image: string;
  price: number;
  quantity: number;
  sliceBps: number;
  grantLinked: boolean;
};

export type ProductDetail = {
  id: string;
  kitId: string;
  version: string;
  fabricator: string;
  designHash: string;
  title: string;
  description: string;
  image: string;
  gallery: string[];
  video: string;
  audio: string;
  options: ProductOption[];
  price: number;
  priceWei: string;
  quantity: number;
  sliceBps: number;
  grantId: string;
  grantBps: number;
  grantLinked: boolean;
  cyberSwagBps: number;
  confirmWindow: string;
  agentIds: string[];
  createdAtBlock: string;
  createdAtTimestamp: string;
  updatedAtTimestamp: string;
  transactionHash: string;
  contentUri: string;
};

export type MarketLeftProps = {
  filters: ProductFilters;
  setFilters: (v: SetStateAction<ProductFilters>) => void;
  count: number;
  total: number;
};

export type MarketCenterProps = {
  products: ProductSummary[];
};

export type MarketScreenProps = {
  dict: any;
};

export type KitComment = {
  id: string;
  author: string;
  anonymous: boolean;
  text: string;
  time: string;
  tx?: string;
};

export type WalkthroughStep = {
  title: string;
  body: string;
};

export type WalkthroughProps = {
  open: boolean;
  onClose: () => void;
};

export type WalkthroughDict = {
  title: string;
  connectPrompt: string;
  connectChip: string;
  connecting: string;
  chipCommitment: string;
  enrolled: string;
  notEnrolled: string;
  enrolChip: string;
  enrolling: string;
  checking: string;
  back: string;
  next: string;
  done: string;
  connectWallet: string;
  switchChain: string;
  steps: WalkthroughStep[];
};

export type UriKind = "ipfs" | "https" | "arweave" | "invalid";

export type ResolvedUri = {
  kind: UriKind;
  url: string;
  embeddable: boolean;
};

export interface FullScreenVideo {
  open: boolean;
  time?: number;
  duration?: number;
  isPlaying?: boolean;
  volume?: number;
  volumeOpen?: boolean;
  allVideos: Post[];
  cursor?: string | undefined;
  index: number;
}

export type TxPhase = "pending" | "success" | "error";

export type TxStatus = {
  phase: TxPhase;
  hash?: `0x${string}`;
  message?: string;
  note?: string;
};

export type ScreenTimelineProps = {
  dict: any;
  changeLanguage: (lang: string) => void;
  setMessage: (e: SetStateAction<string>) => void;
  setVideoLoading: (e: SetStateAction<boolean>) => void;
  videoLoading: boolean;
  currentVideo: number | undefined;
  message: string;
  messageLoading: boolean;
  handleSendMessage: () => Promise<void>;
  changeVideo: (index: number) => void;
  handleShop: () => void;
  setChosenLanguage: (e: SetStateAction<number>) => void;
  chosenLanguage: number;
};

export type BarProps = {
  dict: any;
  setChosenLanguage: (e: SetStateAction<number>) => void;
  chosenLanguage: number;
  changeLanguage: (lang: string) => void;
};

export type VideoProps = {
  setVideoLoading: (e: SetStateAction<boolean>) => void;
  videoLoading: boolean;
};

export type ScreenProps = {
  dict: any;
  changeLanguage: (lang: string) => void;
  setVideoLoading: (e: SetStateAction<boolean>) => void;
  videoLoading: boolean;
  setChosenLanguage: (e: SetStateAction<number>) => void;
  chosenLanguage: number;
};

export type InfoProps = {
  setInfoOpen: (e: SetStateAction<boolean>) => void;
  dict: any;
  position: {
    x: number;
    y: number;
  };
};

export type MetalStop = {
  offset: string;
  color: string;
};

export type GrommetProps = {
  position?: [number, number, number];
  scale?: number;
  color?: string;
  ringR?: number;
  tubeR?: number;
  roughness?: number;
  holeColor?: string;
  holeMetalness?: number;
  holeRoughness?: number;
};

export type CanProps = {
  position?: [number, number, number];
  scale?: number;
  color?: string;
  radius?: number;
  height?: number;
  roughness?: number;
  dome?: number;
};

export type CrystalProps = {
  position?: [number, number, number];
  scale?: number;
  color?: string;
  w?: number;
  h?: number;
  roughness?: number;
  pins?: number;
  leadColor?: string;
};

export type QfpProps = {
  position?: [number, number, number];
  scale?: number;
  size?: number;
  pins?: number;
  color?: string;
  leadColor?: string;
};

export type HolePlateProps = {
  position?: [number, number, number];
  scale?: number;
  w?: number;
  h?: number;
  color?: string;
  border?: boolean;
};

export type BlockProps = {
  position?: [number, number, number];
  scale?: number;
  color?: string;
  size?: number;
  roughness?: number;
};

export type BlockFieldProps = {
  position?: [number, number, number];
  scale?: number;
  w?: number;
  h?: number;
  color?: string;
  size?: number;
};

export type TraceFieldProps = {
  position?: [number, number, number];
  scale?: number;
  w?: number;
  count?: number;
  color?: string;
  angle?: number;
};

export type ChipPartProps = {
  position?: [number, number, number];
  scale?: number;
  color?: string;
  length?: number;
  w?: number;
};

export type TransistorProps = {
  position?: [number, number, number];
  scale?: number;
  color?: string;
  leadColor?: string;
  size?: number;
};

export type Led3DProps = {
  position?: [number, number, number];
  scale?: number;
  color?: string;
  glow?: boolean;
};

export type LedClusterProps = {
  position?: [number, number, number];
  rows?: number[];
  scale?: number;
  fill?: boolean;
  fillRows?: number;
};

export type RegulatorProps = {
  position?: [number, number, number];
  scale?: number;
  color?: string;
};

export type DiodeProps = {
  position?: [number, number, number];
  scale?: number;
  color?: string;
  band?: string;
};

export type ChipResistorProps = {
  position?: [number, number, number];
  scale?: number;
  color?: string;
  code?: string;
};

export type Trace3DProps = {
  frames?: {
    sil: { top: number; bot: number };
    thesis: { top: number; bot: number; halfW: number };
  };
};

export type SiliconBox = {
  top: number;
  left: number;
  width: number;
  height: number;
  pageW: number;
};

export type DotRingProps = {
  position?: [number, number, number];
  radius?: number;
  count?: number;
  rings?: number;
  ringGap?: number;
  pattern?: number[];
  inner?: number;
};
