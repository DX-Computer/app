import { useAccount, useReadContract } from "wagmi";
import { ADDRESSES } from "@/app/lib/addresses";
import { ERC20_ABI } from "@/app/lib/constants";
import { useTrackedWrite } from "./useTrackedWrite";

const TREASURY_ABI = [
  {
    type: "function",
    name: "currentEpoch",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "claimable",
    stateMutability: "view",
    inputs: [
      { name: "epoch", type: "uint256" },
      { name: "project", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "computeClaimable",
    stateMutability: "nonpayable",
    inputs: [
      { name: "epoch", type: "uint256" },
      { name: "project", type: "address" },
    ],
    outputs: [],
  },
] as const;

const DX_PROJECT_ABI = [
  {
    type: "function",
    name: "claimBudget",
    stateMutability: "nonpayable",
    inputs: [{ name: "epoch", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "admin",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ type: "bool" }],
  },
] as const;

export const useDxBudget = (epoch?: bigint) => {
  const treasury = ADDRESSES.treasury;
  const dxProject = ADDRESSES.dxProject;
  const ready = Boolean(treasury && dxProject);
  const { writeContractAsync, isPending } = useTrackedWrite();
  const { address: account } = useAccount();

  const { data: isAdminRaw } = useReadContract({
    address: dxProject,
    abi: DX_PROJECT_ABI,
    functionName: "admin",
    args: account ? [account] : undefined,
    query: { enabled: Boolean(dxProject && account) },
  });
  const isAdmin = isAdminRaw === true;

  const { data: currentEpoch } = useReadContract({
    address: treasury,
    abi: TREASURY_ABI,
    functionName: "currentEpoch",
    query: { enabled: ready },
  });

  const targetEpoch =
    epoch ??
    (typeof currentEpoch === "bigint" && currentEpoch > 0n
      ? currentEpoch - 1n
      : 0n);

  const { data: claimable, refetch } = useReadContract({
    address: treasury,
    abi: TREASURY_ABI,
    functionName: "claimable",
    args: dxProject ? [targetEpoch, dxProject] : undefined,
    query: { enabled: ready },
  });

  const { data: projectBalance } = useReadContract({
    address: ADDRESSES.mona,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: dxProject ? [dxProject] : undefined,
    query: { enabled: Boolean(ADDRESSES.mona && dxProject) },
  });

  const computeClaimable = async () => {
    if (!ready || !dxProject) return;
    await writeContractAsync({
      address: treasury!,
      abi: TREASURY_ABI,
      functionName: "computeClaimable",
      args: [targetEpoch, dxProject],
    });
    refetch();
  };

  const claimBudget = async () => {
    if (!ready || !dxProject) return;
    await writeContractAsync({
      address: dxProject,
      abi: DX_PROJECT_ABI,
      functionName: "claimBudget",
      args: [targetEpoch],
    });
    refetch();
  };

  return {
    ready,
    isAdmin,
    currentEpoch: currentEpoch as bigint | undefined,
    targetEpoch,
    claimable: claimable as bigint | undefined,
    projectBalance: projectBalance as bigint | undefined,
    computeClaimable,
    claimBudget,
    isPending,
  };
};

export default useDxBudget;
