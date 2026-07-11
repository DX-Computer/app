const ENDPOINT = process.env.NEXT_PUBLIC_DX_SUBGRAPH || "";

export const subgraphReady = (): boolean => Boolean(ENDPOINT);

export const subgraphQuery = async <T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T | null> => {
  if (!ENDPOINT) {
    console.log("subgraph: NEXT_PUBLIC_DX_SUBGRAPH not set — queries disabled");
    return null;
  }
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });
    const json = await res.json();
    if (json?.errors) {
      console.log("subgraph errors:", JSON.stringify(json.errors));
    }
    return (json?.data ?? null) as T | null;
  } catch (e) {
    console.log("subgraph fetch failed:", e);
    return null;
  }
};
