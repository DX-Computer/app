import { useQuery } from "@tanstack/react-query";
import { subgraphQuery, subgraphReady } from "@/app/lib/graphql/fetcher";
import { AGENT_DETAIL_QUERY } from "@/app/lib/graphql/queries";
import resolveUri from "./resolveUri";
import { AgentDetail } from "../types/common.types";

type RawAgent = {
  id: string;
  agentId: string;
  owner: string;
  modelHash: string;
  hardwareHash: string;
  contentUri: string;
  createdAtBlock: string;
  createdAtTimestamp: string;
  transactionHash: string;
  kits: { kitId: string }[];
  results: {
    kitId: string;
    resultHash: string;
    contentUri: string;
    transactionHash: string;
  }[];
};

type AgentContent = {
  name?: string;
  description?: string;
  image?: string;
  video?: string;
  audio?: string;
  tags?: string[];
  architecture?: string;
  weights?: string;
  code?: string;
  datasets?: string[];
  training?: string;
  software?: string[];
  reproduce?: string;
  io?: string;
  hwSpec?: string;
  bom?: string[];
  assembly?: string;
};

const arr = (v?: string[]): string[] => (Array.isArray(v) ? v : []);

const load = async (id: string): Promise<AgentDetail | null> => {
  const data = await subgraphQuery<{ agent: RawAgent | null }>(
    AGENT_DETAIL_QUERY,
    { id },
  );
  const a = data?.agent ?? null;
  if (!a) return null;

  const r = resolveUri(a.contentUri);
  let c: AgentContent = {};
  if (r.kind !== "invalid" && r.url) {
    try {
      c = (await (await fetch(r.url)).json()) as AgentContent;
    } catch {
      c = {};
    }
  }

  return {
    id: a.agentId,
    owner: a.owner,
    kits: (a.kits || []).map((k) => k.kitId),
    results: (a.results || []).map((r) => ({
      kitId: r.kitId,
      resultHash: r.resultHash,
      contentUri: r.contentUri,
      tx: r.transactionHash,
    })),
    name: c.name || "",
    description: c.description || "",
    image: c.image || "",
    video: c.video || "",
    audio: c.audio || "",
    tags: arr(c.tags),
    architecture: c.architecture || "",
    weights: c.weights || "",
    code: c.code || "",
    datasets: arr(c.datasets),
    training: c.training || "",
    software: arr(c.software),
    reproduce: c.reproduce || "",
    io: c.io || "",
    hwSpec: c.hwSpec || "",
    bom: arr(c.bom),
    assembly: c.assembly || "",
    createdAtBlock: a.createdAtBlock,
    createdAtTimestamp: a.createdAtTimestamp,
    transactionHash: a.transactionHash,
    contentUri: a.contentUri,
  };
};

const useAgentDetail = (
  id: string,
): { agent: AgentDetail | null; loading: boolean } => {
  const valid = /^\d+$/.test(id);
  const { data, isLoading } = useQuery({
    queryKey: ["agent", id],
    queryFn: () => load(id),
    enabled: subgraphReady() && valid,
  });
  return { agent: data ?? null, loading: isLoading };
};

export default useAgentDetail;
