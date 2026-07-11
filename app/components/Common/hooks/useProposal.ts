import { useQuery } from "@tanstack/react-query";
import { subgraphQuery, subgraphReady } from "@/app/lib/graphql/fetcher";
import { PROPOSAL_DETAIL_QUERY } from "@/app/lib/graphql/queries";
import resolveUri from "./resolveUri";
import { ProposalSummary } from "../types/common.types";

type RawProposal = {
  proposalId: string;
  kind: number;
  contentUri: string;
  target: string;
  project: string;
  banned: boolean;
  value: string;
  extra: string;
  start: string;
  end: string;
  executed: boolean;
  yes: string;
  no: string;
  transactionHash: string;
};

type ProposalContent = { title?: string; reason?: string; links?: string[] };

const n = (v?: string): number => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

const fetchContent = async (uri: string): Promise<ProposalContent | null> => {
  const r = resolveUri(uri);
  if (r.kind === "invalid" || !r.url) return null;
  try {
    return (await (await fetch(r.url)).json()) as ProposalContent;
  } catch {
    return null;
  }
};

const load = async (id: string): Promise<ProposalSummary | null> => {
  const data = await subgraphQuery<{ councilProposal: RawProposal | null }>(
    PROPOSAL_DETAIL_QUERY,
    { id },
  );
  const p = data?.councilProposal;
  if (!p) return null;
  const c = await fetchContent(p.contentUri);
  return {
    id: p.proposalId,
    kind: p.kind,
    contentUri: p.contentUri,
    title: c?.title || "",
    reason: c?.reason || "",
    links: Array.isArray(c?.links) ? (c?.links as string[]) : [],
    target: p.target,
    project: p.project,
    banned: p.banned,
    value: p.value,
    extra: p.extra,
    start: n(p.start),
    end: n(p.end),
    executed: p.executed,
    yes: n(p.yes),
    no: n(p.no),
    tx: p.transactionHash,
  };
};

const useProposal = (
  id: string,
): { proposal: ProposalSummary | null; loading: boolean; refetch: () => void } => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["proposal", id],
    queryFn: () => load(id),
    enabled: subgraphReady() && id !== "",
  });
  return {
    proposal: data ?? null,
    loading: isLoading,
    refetch: () => {
      refetch();
    },
  };
};

export default useProposal;
