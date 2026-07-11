const SEMAPHORE_PROOF_COMPONENTS = [
  { name: "merkleTreeDepth", type: "uint256" },
  { name: "merkleTreeRoot", type: "uint256" },
  { name: "nullifier", type: "uint256" },
  { name: "message", type: "uint256" },
  { name: "scope", type: "uint256" },
  { name: "points", type: "uint256[8]" },
] as const;

export const KIT_SIGNAL_ABI = [
  {
    type: "function",
    name: "tally",
    stateMutability: "view",
    inputs: [
      { name: "kitId", type: "uint256" },
      { name: "choice", type: "uint8" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "semaphore",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    type: "function",
    name: "groupId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "signal",
    stateMutability: "nonpayable",
    inputs: [
      { name: "proof", type: "tuple", components: SEMAPHORE_PROOF_COMPONENTS },
      { name: "kitId", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "signalPublic",
    stateMutability: "nonpayable",
    inputs: [
      { name: "kitId", type: "uint256" },
      { name: "choice", type: "uint8" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "publicChoice",
    stateMutability: "view",
    inputs: [
      { name: "kitId", type: "uint256" },
      { name: "signaler", type: "address" },
    ],
    outputs: [{ type: "uint8" }],
  },
  {
    type: "function",
    name: "reactionChoice",
    stateMutability: "view",
    inputs: [
      { name: "kitId", type: "uint256" },
      { name: "nullifier", type: "uint256" },
    ],
    outputs: [{ type: "uint8" }],
  },
  {
    type: "event",
    name: "Signaled",
    inputs: [
      { name: "kitId", type: "uint256", indexed: true },
      { name: "choice", type: "uint8", indexed: false },
      { name: "nullifier", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "SignaledPublic",
    inputs: [
      { name: "kitId", type: "uint256", indexed: true },
      { name: "choice", type: "uint8", indexed: false },
      { name: "signaler", type: "address", indexed: true },
    ],
  },
  { type: "error", name: "BadScope", inputs: [] },
  { type: "error", name: "BadNonce", inputs: [] },
  { type: "error", name: "StaleSignal", inputs: [] },
  { type: "error", name: "InvalidChoice", inputs: [] },
  { type: "error", name: "BadProof", inputs: [] },
] as const;
