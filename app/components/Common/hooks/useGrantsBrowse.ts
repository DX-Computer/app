import { useQuery } from "@tanstack/react-query";
import { formatUnits } from "viem";
import { subgraphQuery, subgraphReady } from "@/app/lib/graphql/fetcher";
import { GRANTS_QUERY } from "@/app/lib/graphql/queries";
import resolveUri from "./resolveUri";
import { GrantSummary } from "../types/common.types";

type RawGrant = {
  id: string;
  grantId: string;
  kitId: string;
  creator: string;
  purposeHash: string;
  contentUri: string;
  budget: string;
  raised: string;
  totalShares: string;
  funders: number;
  createdAtBlock: string;
  createdAtTimestamp: string;
  transactionHash: string;
};

type GrantContent = {
  title?: string;
  purpose?: string;
  image?: string;
};

const cleanLink = (u?: string): boolean =>
  !u || resolveUri(u).kind !== "invalid";

const num = (v: string): number => {
  try {
    return Number(formatUnits(BigInt(v), 18));
  } catch {
    return 0;
  }
};

const fetchGrantContent = async (
  uri: string,
): Promise<GrantContent | null> => {
  const r = resolveUri(uri);
  if (r.kind === "invalid" || !r.url) return null;
  try {
    const res = await fetch(r.url);
    const json = (await res.json()) as GrantContent;
    const ok =
      typeof json.title === "string" &&
      json.title.trim() !== "" &&
      typeof json.purpose === "string" &&
      cleanLink(json.image);
    return ok ? json : null;
  } catch {
    return null;
  }
};

const loadGrants = async (): Promise<GrantSummary[]> => {
  const data = await subgraphQuery<{ grants: RawGrant[] }>(GRANTS_QUERY);
  const raw = data?.grants ?? [];
  const fetched = await Promise.all(
    raw
      .filter((g) => resolveUri(g.contentUri).kind !== "invalid")
      .map(async (g) => {
        const c = await fetchGrantContent(g.contentUri);
        if (!c) return null;
        const summary: GrantSummary = {
          id: g.grantId,
          kitId: g.kitId,
          creator: g.creator,
          title: c.title || "",
          purpose: c.purpose || "",
          image: c.image || "",
          budget: num(g.budget),
          raised: num(g.raised),
          funders: g.funders,
        };
        return summary;
      }),
  );
  return fetched.filter((g): g is GrantSummary => g !== null);
};

const useGrantsBrowse = (): { grants: GrantSummary[]; loading: boolean } => {
  const { data, isLoading } = useQuery({
    queryKey: ["grants-browse"],
    queryFn: loadGrants,
    enabled: subgraphReady(),
  });
  return { grants: data ?? [], loading: isLoading };
};

export default useGrantsBrowse;
