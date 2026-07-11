import { useQuery } from "@tanstack/react-query";
import { subgraphQuery, subgraphReady } from "@/app/lib/graphql/fetcher";

export const useSubgraphQuery = <T>(
  key: string,
  query: string,
  variables?: Record<string, unknown>
) => {
  const ready = subgraphReady();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [key, variables],
    queryFn: () => subgraphQuery<T>(query, variables),
    enabled: ready,
  });
  return { data: data ?? null, loading: isLoading, error, ready, refetch };
};
