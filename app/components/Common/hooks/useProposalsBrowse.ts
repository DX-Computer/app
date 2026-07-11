import { useQuery } from "@tanstack/react-query";
import { subgraphQuery, subgraphReady } from "@/app/lib/graphql/fetcher";
import { PROPOSALS_QUERY } from "@/app/lib/graphql/queries";
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

const load = async (): Promise<ProposalSummary[]> => {
  const data = await subgraphQuery<{ councilProposals: RawProposal[] }>(
    PROPOSALS_QUERY,
  );
  const raw = data?.councilProposals ?? [];
  return Promise.all(
    raw.map(async (p) => {
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
    }),
  );
};

const useProposalsBrowse = (): {
  proposals: ProposalSummary[];
  loading: boolean;
} => {
  const { data, isLoading } = useQuery({
    queryKey: ["proposals-browse"],
    queryFn: load,
    enabled: subgraphReady(),
  });
  return { proposals: data ?? [], loading: isLoading };
};

export default useProposalsBrowse;
