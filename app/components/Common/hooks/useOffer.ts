import { useQuery } from "@tanstack/react-query";
import { formatUnits } from "viem";
import { subgraphQuery, subgraphReady } from "@/app/lib/graphql/fetcher";
import { OFFER_DETAIL_QUERY } from "@/app/lib/graphql/queries";
import resolveUri from "./resolveUri";
import { ProductDetail } from "../types/common.types";

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
  cyberSwagBps: number;
  confirmWindow: string;
  agents: { agentId: string }[];
  exists: boolean;
  createdAtBlock: string;
  createdAtTimestamp: string;
  updatedAtTimestamp: string;
  transactionHash: string;
};

type OfferContent = {
  title?: string;
  description?: string;
  image?: string;
  gallery?: string[];
  video?: string;
  audio?: string;
  options?: { label?: string; choices?: string[] }[];
};

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

const load = async (id: string): Promise<ProductDetail | null> => {
  const data = await subgraphQuery<{ offer: RawOffer | null }>(
    OFFER_DETAIL_QUERY,
    { id },
  );
  const o = data?.offer ?? null;
  if (!o || !o.exists) return null;

  const r = resolveUri(o.contentUri);
  let c: OfferContent = {};
  if (r.kind !== "invalid" && r.url) {
    try {
      const res = await fetch(r.url);
      c = (await res.json()) as OfferContent;
    } catch {
      c = {};
    }
  }

  return {
    id: o.offerId,
    kitId: o.kitId,
    version: o.version,
    fabricator: o.fabricator,
    designHash: o.designHash,
    title: c.title || "",
    description: c.description || "",
    image: c.image || "",
    gallery: Array.isArray(c.gallery) ? c.gallery : [],
    video: c.video || "",
    audio: c.audio || "",
    options: Array.isArray(c.options)
      ? c.options
          .filter((op) => op && typeof op.label === "string" && Array.isArray(op.choices))
          .map((op) => ({ label: op.label as string, choices: op.choices as string[] }))
      : [],
    price: num(o.price),
    priceWei: o.price,
    quantity: intOf(o.quantity),
    sliceBps: o.sliceBps,
    grantId: o.grantId,
    grantBps: o.grantBps,
    grantLinked: o.grantLinked,
    cyberSwagBps: o.cyberSwagBps,
    confirmWindow: o.confirmWindow,
    agentIds: (o.agents || []).map((a) => a.agentId),
    createdAtBlock: o.createdAtBlock,
    createdAtTimestamp: o.createdAtTimestamp,
    updatedAtTimestamp: o.updatedAtTimestamp,
    transactionHash: o.transactionHash,
    contentUri: o.contentUri,
  };
};

const useOffer = (id: string): { offer: ProductDetail | null; loading: boolean } => {
  const valid = /^\d+$/.test(id);
  const { data, isLoading } = useQuery({
    queryKey: ["offer", id],
    queryFn: () => load(id),
    enabled: subgraphReady() && valid,
  });
  return { offer: data ?? null, loading: isLoading };
};

export default useOffer;
