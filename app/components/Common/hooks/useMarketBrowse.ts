import { useQuery } from "@tanstack/react-query";
import { formatUnits } from "viem";
import { subgraphQuery, subgraphReady } from "@/app/lib/graphql/fetcher";
import { OFFERS_QUERY } from "@/app/lib/graphql/queries";
import resolveUri from "./resolveUri";
import { ProductSummary } from "../types/common.types";

type RawOffer = {
  id: string;
  offerId: string;
  fabricator: string;
  kitId: string;
  version: string;
  designHash: string;
  contentUri: string;
  price: string;
  sliceBps: number;
  quantity: string;
  grantId: string;
  grantBps: number;
  grantLinked: boolean;
  exists: boolean;
};

type ProductContent = {
  title?: string;
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

const intOf = (v: string): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const fetchProductContent = async (
  uri: string,
): Promise<ProductContent | null> => {
  const r = resolveUri(uri);
  if (r.kind === "invalid" || !r.url) return null;
  try {
    const res = await fetch(r.url);
    const json = (await res.json()) as ProductContent;
    const ok =
      typeof json.title === "string" &&
      json.title.trim() !== "" &&
      cleanLink(json.image);
    return ok ? json : null;
  } catch {
    return null;
  }
};

const loadOffers = async (): Promise<ProductSummary[]> => {
  const data = await subgraphQuery<{ offers: RawOffer[] }>(OFFERS_QUERY);
  const raw = data?.offers ?? [];
  const fetched = await Promise.all(
    raw
      .filter((o) => o.exists && resolveUri(o.contentUri).kind !== "invalid")
      .map(async (o) => {
        const c = await fetchProductContent(o.contentUri);
        if (!c) return null;
        const summary: ProductSummary = {
          id: o.offerId,
          kitId: o.kitId,
          fabricator: o.fabricator,
          title: c.title || "",
          image: c.image || "",
          price: num(o.price),
          quantity: intOf(o.quantity),
          sliceBps: o.sliceBps,
          grantLinked: o.grantLinked,
        };
        return summary;
      }),
  );
  return fetched.filter((o): o is ProductSummary => o !== null);
};

const useMarketBrowse = (): { products: ProductSummary[]; loading: boolean } => {
  const { data, isLoading } = useQuery({
    queryKey: ["market-browse"],
    queryFn: loadOffers,
    enabled: subgraphReady(),
  });
  return { products: data ?? [], loading: isLoading };
};

export default useMarketBrowse;
