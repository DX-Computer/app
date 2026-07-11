import { useQuery } from "@tanstack/react-query";
import { subgraphQuery, subgraphReady } from "@/app/lib/graphql/fetcher";
import { COMMENTS_QUERY } from "@/app/lib/graphql/queries";
import resolveUri from "./resolveUri";

type RawContent = {
  id: string;
  contentId: string;
  author: string;
  ownerTag: string;
  canonicalTag: string;
  contentHash: string;
  contentUri: string;
  anonymous: boolean;
  transactionHash: string;
};

export type CommentRow = {
  id: string;
  author: string;
  anonymous: boolean;
  text: string;
  tx: string;
  contentUri: string;
  ownerTag: string;
  contentHash: string;
  unavailable: boolean;
};

const fetchText = async (uri: string): Promise<string | null> => {
  const r = resolveUri(uri);
  if (r.kind === "invalid" || !r.url) return null;
  try {
    const res = await fetch(r.url);
    const json = (await res.json()) as { text?: string };
    return typeof json.text === "string" ? json.text : null;
  } catch {
    return null;
  }
};

const load = async (canonicalTag: string): Promise<CommentRow[]> => {
  const data = await subgraphQuery<{ contents: RawContent[] }>(COMMENTS_QUERY, {
    canonicalTag,
  });
  const raw = data?.contents ?? [];
  const fetched = await Promise.all(
    raw.map(async (c) => {
      const text = await fetchText(c.contentUri);
      const row: CommentRow = {
        id: c.contentId,
        author: c.author,
        anonymous: c.anonymous,
        text: text ?? "",
        tx: c.transactionHash,
        contentUri: c.contentUri,
        ownerTag: c.ownerTag,
        contentHash: c.contentHash,
        unavailable: text === null,
      };
      return row;
    }),
  );
  return fetched;
};

const useComments = (
  canonicalTag: string,
): { comments: CommentRow[]; loading: boolean; refetch: () => void } => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["comments", canonicalTag],
    queryFn: () => load(canonicalTag),
    enabled: subgraphReady() && Boolean(canonicalTag),
  });
  return {
    comments: data ?? [],
    loading: isLoading,
    refetch: (): void => {
      refetch();
    },
  };
};

export default useComments;
