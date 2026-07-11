import { useQuery } from "@tanstack/react-query";
import { formatUnits } from "viem";
import { subgraphQuery, subgraphReady } from "@/app/lib/graphql/fetcher";
import {
  GRANT_DETAIL_QUERY,
  GRANT_FUNDERS_QUERY,
  GRANT_OFFERS_QUERY,
} from "@/app/lib/graphql/queries";
import resolveUri from "./resolveUri";
import {
  GrantDetail,
  GrantFunderRow,
  GrantMilestone,
  ProductSummary,
} from "../types/common.types";

type RawGrant = {
  id: string;
  grantId: string;
  kitId: string;
  creator: string;
  contentUri: string;
  budget: string;
  raised: string;
  totalShares: string;
  funders: number;
  removed: boolean;
  createdAtBlock: string;
  createdAtTimestamp: string;
  updatedAtTimestamp: string;
  transactionHash: string;
};

type RawOffer = {
  offerId: string;
  kitId: string;
  fabricator: string;
  contentUri: string;
  price: string;
  quantity: string;
  sliceBps: number;
  grantLinked: boolean;
};

type GrantContent = {
  title?: string;
  purpose?: string;
  image?: string;
  deliverables?: string;
  milestones?: GrantMilestone[];
  links?: string[];
};

type ProductContent = { title?: string; image?: string };

const num = (v: string): number => {
  try {
    return Number(formatUnits(BigInt(v), 18));
  } catch {
    return 0;
  }
};
const intOf = (v: string): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const fetchJson = async <T>(uri: string): Promise<T | null> => {
  const r = resolveUri(uri);
  if (r.kind === "invalid" || !r.url) return null;
  try {
    const res = await fetch(r.url);
    return (await res.json()) as T;
  } catch {
    return null;
  }
};

type GrantBundle = {
  grant: GrantDetail | null;
  funders: GrantFunderRow[];
  offers: ProductSummary[];
};

const load = async (id: string): Promise<GrantBundle> => {
  const data = await subgraphQuery<{ grant: RawGrant | null }>(
    GRANT_DETAIL_QUERY,
    { id },
  );
  const g = data?.grant ?? null;
  if (!g) return { grant: null, funders: [], offers: [] };

  const c = (await fetchJson<GrantContent>(g.contentUri)) ?? {};
  const grant: GrantDetail = {
    id: g.grantId,
    kitId: g.kitId,
    creator: g.creator,
    title: c.title || "",
    purpose: c.purpose || "",
    image: c.image || "",
    deliverables: c.deliverables || "",
    milestones: c.milestones || [],
    links: c.links || [],
    budget: num(g.budget),
    raised: num(g.raised),
    totalShares: num(g.totalShares),
    funders: g.funders,
    removed: Boolean(g.removed),
    createdAtBlock: g.createdAtBlock,
    createdAtTimestamp: g.createdAtTimestamp,
    updatedAtTimestamp: g.updatedAtTimestamp,
    transactionHash: g.transactionHash,
    contentUri: g.contentUri,
  };

  const funderData = await subgraphQuery<{
    grantFunders: { funder: string; shares: string }[];
  }>(GRANT_FUNDERS_QUERY, { id: g.id });
  const funders: GrantFunderRow[] = (funderData?.grantFunders ?? []).map(
    (f) => ({ funder: f.funder, shares: num(f.shares) }),
  );

  const offerData = await subgraphQuery<{ offers: RawOffer[] }>(
    GRANT_OFFERS_QUERY,
    { grantId: g.grantId },
  );
  const offerRows = offerData?.offers ?? [];
  const offers = (
    await Promise.all(
      offerRows
        .filter((o) => resolveUri(o.contentUri).kind !== "invalid")
        .map(async (o) => {
          const pc = await fetchJson<ProductContent>(o.contentUri);
          if (!pc || typeof pc.title !== "string" || pc.title.trim() === "") {
            return null;
          }
          const s: ProductSummary = {
            id: o.offerId,
            kitId: o.kitId,
            fabricator: o.fabricator,
            title: pc.title || "",
            image: pc.image || "",
            price: num(o.price),
            quantity: intOf(o.quantity),
            sliceBps: o.sliceBps,
            grantLinked: o.grantLinked,
          };
          return s;
        }),
    )
  ).filter((o): o is ProductSummary => o !== null);

  return { grant, funders, offers };
};

const useGrant = (id: string): GrantBundle & { loading: boolean } => {
  const valid = /^\d+$/.test(id);
  const { data, isLoading } = useQuery({
    queryKey: ["grant", id],
    queryFn: () => load(id),
    enabled: subgraphReady() && valid,
  });
  return {
    grant: data?.grant ?? null,
    funders: data?.funders ?? [],
    offers: data?.offers ?? [],
    loading: isLoading,
  };
};

export default useGrant;
