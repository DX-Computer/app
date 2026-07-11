import { keccak256, stringToHex } from "viem";
import { contractConfig } from "@/app/lib/contracts";
import { AgentDraft } from "../types/common.types";
import { useTrackedWrite } from "./useTrackedWrite";

type Hash = `0x${string}`;

export const modelHashFromDraft = (draft: AgentDraft): Hash =>
  keccak256(
    stringToHex(
      JSON.stringify({
        architecture: draft.architecture,
        weights: draft.weights,
        code: draft.code,
        datasets: draft.datasets,
        training: draft.training,
        software: draft.software,
        reproduce: draft.reproduce,
        io: draft.io,
        license: draft.license,
      }),
    ),
  );

export const hardwareHashFromDraft = (draft: AgentDraft): Hash =>
  keccak256(
    stringToHex(
      JSON.stringify({
        hwSpec: draft.hwSpec,
        bom: draft.bom,
        assembly: draft.assembly,
      }),
    ),
  );

const useAgent = () => {
  const { address: registry, abi, ready } = contractConfig(
    "cyberswagmanRegistry",
  );
  const base = { address: registry as Hash, abi } as const;
  const { writeContractAsync, isPending, error } = useTrackedWrite();

  const guard = (): boolean => {
    if (!ready || !registry) {
      console.log("cyberswagmanRegistry address not configured");
      return false;
    }
    return true;
  };

  const registerAgent = async (
    modelHash: Hash,
    hardwareHash: Hash,
    contentUri: string,
  ) => {
    if (!guard()) return;
    return writeContractAsync({
      ...base,
      functionName: "registerAgent",
      args: [modelHash, hardwareHash, contentUri],
    });
  };

  const registerAgentKit = async (
    draft: AgentDraft,
    contentUri: string,
    kitIds: bigint[],
  ) => {
    if (!guard()) return;
    return writeContractAsync({
      ...base,
      functionName: "registerAgentWithKits",
      args: [
        modelHashFromDraft(draft),
        hardwareHashFromDraft(draft),
        contentUri,
        kitIds,
      ],
    });
  };

  const postResult = async (
    agentId: bigint,
    projectId: bigint,
    resultHash: Hash,
    contentUri: string,
  ) => {
    if (!guard()) return;
    return writeContractAsync({
      ...base,
      functionName: "postResult",
      args: [agentId, projectId, resultHash, contentUri],
    });
  };

  const setSchema = async (agentId: bigint, kitId: bigint, included: boolean) => {
    if (!guard()) return;
    return writeContractAsync({
      ...base,
      functionName: "setSchema",
      args: [agentId, kitId, included],
    });
  };

  const updateAgentKit = async (
    agentId: bigint,
    draft: AgentDraft,
    contentUri: string,
    addKits: bigint[],
    removeKits: bigint[],
  ) => {
    if (!guard()) return;
    return writeContractAsync({
      ...base,
      functionName: "updateAgent",
      args: [
        agentId,
        modelHashFromDraft(draft),
        hardwareHashFromDraft(draft),
        contentUri,
        addKits,
        removeKits,
      ],
    });
  };

  const deleteAgent = async (agentId: bigint, note?: string) => {
    if (!guard()) return;
    return writeContractAsync(
      {
        ...base,
        functionName: "deleteAgent",
        args: [agentId],
      },
      { successNote: note },
    );
  };

  const claim = async (projectId: bigint) => {
    if (!guard()) return;
    return writeContractAsync({
      ...base,
      functionName: "claim",
      args: [projectId],
    });
  };

  return {
    ready,
    isPending,
    error,
    registerAgent,
    registerAgentKit,
    updateAgentKit,
    postResult,
    setSchema,
    deleteAgent,
    claim,
  };
};

export default useAgent;
