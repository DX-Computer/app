import { useQuery } from "@tanstack/react-query";
import { subgraphQuery, subgraphReady } from "@/app/lib/graphql/fetcher";
import { AGENTS_QUERY } from "@/app/lib/graphql/queries";
import resolveUri from "./resolveUri";
import { AgentSummary } from "../types/common.types";

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
};

type AgentContent = {
  name?: string;
  description?: string;
  image?: string;
  tags?: string[];
};

const cleanLink = (u?: string): boolean =>
  !u || resolveUri(u).kind !== "invalid";

const fetchContent = async (uri: string): Promise<AgentContent | null> => {
  const r = resolveUri(uri);
  if (r.kind === "invalid" || !r.url) return null;
  try {
    const res = await fetch(r.url);
    const json = (await res.json()) as AgentContent;
    const ok =
      typeof json.name === "string" &&
      json.name.trim() !== "" &&
      cleanLink(json.image);
    return ok ? json : null;
  } catch {
    return null;
  }
};

const loadAgents = async (): Promise<AgentSummary[]> => {
  const data = await subgraphQuery<{ agents: RawAgent[] }>(AGENTS_QUERY);
  const raw = data?.agents ?? [];
  const fetched = await Promise.all(
    raw
      .filter((a) => resolveUri(a.contentUri).kind !== "invalid")
      .map(async (a) => {
        const c = await fetchContent(a.contentUri);
        if (!c) return null;
        const summary: AgentSummary = {
          id: a.agentId,
          owner: a.owner,
          name: c.name || "",
          description: c.description || "",
          image: c.image || "",
          tags: Array.isArray(c.tags) ? c.tags : [],
          kits: (a.kits ?? []).map((k) => k.kitId),
        };
        return summary;
      }),
  );
  return fetched.filter((a): a is AgentSummary => a !== null);
};

const useAgentsBrowse = (): { agents: AgentSummary[]; loading: boolean } => {
  const { data, isLoading } = useQuery({
    queryKey: ["agents-browse"],
    queryFn: loadAgents,
    enabled: subgraphReady(),
  });
  return { agents: data ?? [], loading: isLoading };
};

export default useAgentsBrowse;
