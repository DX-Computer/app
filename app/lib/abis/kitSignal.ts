export const KIT_SIGNAL_ABI = [
  {
    type: "function",
    name: "SIGNAL_TAG",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "bytes4" }],
  },
  {
    type: "function",
    name: "tally",
    stateMutability: "view",
    inputs: [
      { name: "kitId", type: "uint256" },
      { name: "code", type: "uint8" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "reactionChoice",
    stateMutability: "view",
    inputs: [
      { name: "kitId", type: "uint256" },
      { name: "nullifier", type: "bytes32" },
    ],
    outputs: [{ type: "uint8" }],
  },
  {
    type: "function",
    name: "reactionNonce",
    stateMutability: "view",
    inputs: [
      { name: "kitId", type: "uint256" },
      { name: "nullifier", type: "bytes32" },
    ],
    outputs: [{ type: "uint256" }],
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
    name: "signal",
    stateMutability: "nonpayable",
    inputs: [
      { name: "proof", type: "bytes" },
      { name: "merkleRoot", type: "bytes32" },
      { name: "kitId", type: "uint256" },
      { name: "code", type: "uint8" },
      { name: "nonce", type: "uint256" },
      { name: "nullifier", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "signalPublic",
    stateMutability: "nonpayable",
    inputs: [
      { name: "kitId", type: "uint256" },
      { name: "code", type: "uint8" },
    ],
    outputs: [],
  },
  {
    type: "event",
    name: "Signaled",
    inputs: [
      { name: "kitId", type: "uint256", indexed: true },
      { name: "choice", type: "uint8", indexed: false },
      { name: "nullifier", type: "bytes32", indexed: false },
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
  { type: "error", name: "UnknownRoot", inputs: [] },
  { type: "error", name: "BadProof", inputs: [] },
  { type: "error", name: "BadNonce", inputs: [] },
  { type: "error", name: "StaleSignal", inputs: [] },
  { type: "error", name: "InvalidChoice", inputs: [] },
] as const;
