import { useQuery } from "@tanstack/react-query";
import { subgraphQuery, subgraphReady } from "@/app/lib/graphql/fetcher";
import { AGENTS_BY_OWNER_QUERY } from "@/app/lib/graphql/queries";
import resolveUri from "./resolveUri";
import { AgentSummary, CyberswagmanStats } from "../types/common.types";

type RawAgent = {
  agentId: string;
  owner: string;
  contentUri: string;
  kits: { kitId: string }[];
};

type AgentContent = {
  name?: string;
  description?: string;
  image?: string;
  tags?: string[];
};

const fetchContent = async (uri: string): Promise<AgentContent | null> => {
  const r = resolveUri(uri);
  if (r.kind === "invalid" || !r.url) return null;
  try {
    const json = (await (await fetch(r.url)).json()) as AgentContent;
    return typeof json.name === "string" && json.name.trim() !== ""
      ? json
      : null;
  } catch {
    return null;
  }
};

type Bundle = { stats: CyberswagmanStats; agents: AgentSummary[] };

const load = async (address: string): Promise<Bundle> => {
  const addr = address.toLowerCase();

  const agentData = await subgraphQuery<{ agents: RawAgent[] }>(
    AGENTS_BY_OWNER_QUERY,
    { owner: addr },
  );
  const raw = agentData?.agents ?? [];
  const agents = (
    await Promise.all(
      raw
        .filter((a) => resolveUri(a.contentUri).kind !== "invalid")
        .map(async (a) => {
          const c = await fetchContent(a.contentUri);
          if (!c) return null;
          const s: AgentSummary = {
            id: a.agentId,
            owner: a.owner,
            name: c.name || "",
            description: c.description || "",
            image: c.image || "",
            tags: Array.isArray(c.tags) ? c.tags : [],
            kits: (a.kits ?? []).map((k) => k.kitId),
          };
          return s;
        }),
    )
  ).filter((a): a is AgentSummary => a !== null);

  const stats: CyberswagmanStats = {
    address,
    agentCount: agents.length,
  };

  return { stats, agents };
};

const useCyberswagman = (
  address: string,
): { stats: CyberswagmanStats; agents: AgentSummary[]; loading: boolean } => {
  const valid = /^0x[0-9a-fA-F]{40}$/.test(address);
  const { data, isLoading } = useQuery({
    queryKey: ["cyberswagman", address.toLowerCase()],
    queryFn: () => load(address),
    enabled: subgraphReady() && valid,
  });
  return {
    stats:
      data?.stats ?? {
        address,
        agentCount: 0,
      },
    agents: data?.agents ?? [],
    loading: isLoading,
  };
};

export default useCyberswagman;
