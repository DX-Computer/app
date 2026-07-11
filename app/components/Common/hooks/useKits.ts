import { useQuery } from "@tanstack/react-query";
import { subgraphQuery, subgraphReady } from "@/app/lib/graphql/fetcher";
import { KITS_QUERY } from "@/app/lib/graphql/queries";
import resolveUri from "./resolveUri";
import { applyContent, fetchContent } from "./kitContent";
import {
  KitAgentRef,
  KitGrantRef,
  KitOfferRef,
  KitVersionMeta,
  RoadmapPhase,
} from "../types/common.types";

type RawKit = {
  id: string;
  kitId: string;
  mode: number;
  ownerTag: string;
  parentId: string;
  version: string;
  designHash: string;
  contentUri: string;
  revoked: boolean;
  createdAtBlock: string;
  createdAtTimestamp: string;
  updatedAtTimestamp: string;
  transactionHash: string;
  versions: KitVersionMeta[];
  grants: KitGrantRef[];
  offers: KitOfferRef[];
  agents: KitAgentRef[];
};

const basePhase = (kit: RawKit): RoadmapPhase => ({
  id: kit.kitId,
  title: "",
  status: kit.revoked ? "revoked" : kit.mode === 1 ? "anonymous" : "public",
  stage: 0,
  image: "",
  video: "",
  pdf: "",
  hardware: [],
  software: [],
  fabrication: [],
  desc: "",
  mode: kit.mode === 1 ? "anonymous" : "public",
  ownerTag: kit.ownerTag,
  parentId: kit.parentId,
  version: kit.version,
  contentUri: kit.contentUri,
  designHash: kit.designHash,
  createdAtBlock: kit.createdAtBlock,
  createdAtTimestamp: kit.createdAtTimestamp,
  updatedAtTimestamp: kit.updatedAtTimestamp,
  transactionHash: kit.transactionHash,
  tags: [],
  summary: "",
  versions: kit.versions || [],
  grants: kit.grants || [],
  offers: kit.offers || [],
  agents: kit.agents || [],
});

const loadKits = async (): Promise<RoadmapPhase[]> => {
  const data = await subgraphQuery<{ kits: RawKit[] }>(KITS_QUERY);
  const raw = data?.kits ?? [];
  const visible = raw.filter(
    (k) => !k.revoked && resolveUri(k.contentUri).kind !== "invalid",
  );
  const fetched = await Promise.all(
    visible.map(async (k) => {
      const c = await fetchContent(k.contentUri);
      const base = basePhase(k);
      if (c) return applyContent(base, c);
      base.title = `kit #${k.kitId}`;
      return base;
    }),
  );
  return fetched.filter((k): k is RoadmapPhase => k !== null);
};

const useKits = (): { kits: RoadmapPhase[]; loading: boolean } => {
  const { data, isLoading } = useQuery({
    queryKey: ["kits"],
    queryFn: loadKits,
    enabled: subgraphReady(),
  });
  return { kits: data ?? [], loading: isLoading };
};

export default useKits;
