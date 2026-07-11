import { useQuery } from "@tanstack/react-query";
import { formatUnits } from "viem";
import { subgraphQuery, subgraphReady } from "@/app/lib/graphql/fetcher";
import {
  TREELINER_QUERY,
  GRANTS_BY_FUNDER_QUERY,
} from "@/app/lib/graphql/queries";
import resolveUri from "./resolveUri";
import { GrantSummary, TreelinerStats } from "../types/common.types";

type RawStats = {
  address: string;
  totalStaked: string;
  totalClaimed: string;
  grantsFunded: number;
} | null;

type RawGrant = {
  id: string;
  grantId: string;
  kitId: string;
  creator: string;
  contentUri: string;
  budget: string;
  raised: string;
  funders: number;
};

type GrantContent = { title?: string; purpose?: string; image?: string };

const cleanLink = (u?: string): boolean =>
  !u || resolveUri(u).kind !== "invalid";

const num = (v?: string): number => {
  try {
    return v ? Number(formatUnits(BigInt(v), 18)) : 0;
  } catch {
    return 0;
  }
};

const fetchGrantContent = async (uri: string): Promise<GrantContent | null> => {
  const r = resolveUri(uri);
  if (r.kind === "invalid" || !r.url) return null;
  try {
    const json = (await (await fetch(r.url)).json()) as GrantContent;
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

type Bundle = { stats: TreelinerStats; grants: GrantSummary[] };

const load = async (address: string): Promise<Bundle> => {
  const addr = address.toLowerCase();

  const statData = await subgraphQuery<{ treeliner: RawStats }>(
    TREELINER_QUERY,
    { id: addr },
  );

  const grantData = await subgraphQuery<{
    grantFunders: { grant: RawGrant }[];
  }>(GRANTS_BY_FUNDER_QUERY, { funder: addr });
  const raw = grantData?.grantFunders ?? [];

  const grants = (
    await Promise.all(
      raw
        .map((f) => f.grant)
        .filter((g) => g && resolveUri(g.contentUri).kind !== "invalid")
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
    )
  ).filter((g): g is GrantSummary => g !== null);

  const stats: TreelinerStats = {
    address,
    totalStaked: num(statData?.treeliner?.totalStaked),
    totalClaimed: num(statData?.treeliner?.totalClaimed),
    grantsFunded: statData?.treeliner?.grantsFunded ?? grants.length,
  };

  return { stats, grants };
};

const useTreeliner = (
  address: string,
): { stats: TreelinerStats; grants: GrantSummary[]; loading: boolean } => {
  const valid = /^0x[0-9a-fA-F]{40}$/.test(address);
  const { data, isLoading } = useQuery({
    queryKey: ["treeliner", address.toLowerCase()],
    queryFn: () => load(address),
    enabled: subgraphReady() && valid,
  });
  return {
    stats:
      data?.stats ?? {
        address,
        totalStaked: 0,
        totalClaimed: 0,
        grantsFunded: 0,
      },
    grants: data?.grants ?? [],
    loading: isLoading,
  };
};

export default useTreeliner;
