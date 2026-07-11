import { useQuery } from "@tanstack/react-query";
import { subgraphQuery, subgraphReady } from "@/app/lib/graphql/fetcher";
import { CREATOR_BANS_QUERY } from "@/app/lib/graphql/queries";
import { CreatorBanRow } from "../types/common.types";

type RawBan = {
  creator: string;
  actor: string;
  banned: boolean;
  createdAtTimestamp: string;
  transactionHash: string;
};

const useCreatorBans = (): { bans: CreatorBanRow[]; loading: boolean } => {
  const { data, isLoading } = useQuery({
    queryKey: ["creator-bans"],
    queryFn: async (): Promise<CreatorBanRow[]> => {
      const raw = await subgraphQuery<{ creatorBans: RawBan[] }>(
        CREATOR_BANS_QUERY,
      );
      return (raw?.creatorBans ?? []).map((b) => ({
        creator: b.creator,
        actor: b.actor,
        banned: b.banned,
        time: b.createdAtTimestamp,
        tx: b.transactionHash,
      }));
    },
    enabled: subgraphReady(),
  });
  return { bans: data ?? [], loading: isLoading };
};

export default useCreatorBans;
