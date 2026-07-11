export const MONA_BALANCE_TREE_ABI = [
  {
    type: "function",
    name: "currentRoot",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "bytes32" }],
  },
  {
    type: "function",
    name: "isKnownBalanceRoot",
    stateMutability: "view",
    inputs: [{ name: "root", type: "bytes32" }],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "nextLeafIndex",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint32" }],
  },
  {
    type: "function",
    name: "register",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "linkProof",
        type: "tuple",
        components: [
          { name: "merkleTreeDepth", type: "uint256" },
          { name: "merkleTreeRoot", type: "uint256" },
          { name: "nullifier", type: "uint256" },
          { name: "message", type: "uint256" },
          { name: "scope", type: "uint256" },
          { name: "points", type: "uint256[8]" },
        ],
      },
    ],
    outputs: [{ type: "bytes32" }],
  },
  {
    type: "event",
    name: "Registered",
    inputs: [
      { name: "balanceKey", type: "uint256", indexed: true },
      { name: "balance", type: "uint256", indexed: false },
      { name: "leafIndex", type: "uint32", indexed: false },
      { name: "root", type: "bytes32", indexed: false },
    ],
  },
  { type: "error", name: "NotAHolder", inputs: [] },
  { type: "error", name: "BalanceTooLarge", inputs: [] },
  { type: "error", name: "TreeFull", inputs: [] },
  { type: "error", name: "BadScope", inputs: [] },
  { type: "error", name: "BadProof", inputs: [] },
] as const;
