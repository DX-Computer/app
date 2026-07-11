import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import { subgraphQuery, subgraphReady } from "@/app/lib/graphql/fetcher";
import { MY_ORDERS_QUERY } from "@/app/lib/graphql/queries";
import resolveUri from "./resolveUri";
import { ManagedOrder, MyOrders } from "../types/common.types";

type RawOrder = {
  orderId: string;
  offerId: string;
  buyer?: string;
  status: string;
  stage: number;
  deadline: string;
  total: string;
  slice: string;
  grantSlice: string;
  cyberSlice: string;
  grantId: string;
  quantity: string;
  encryptedShipping?: string;
  createdAtTimestamp: string;
  transactionHash: string;
  offer: { contentUri: string } | null;
};

const mona = (v?: string): number => {
  try {
    return Number(formatUnits(BigInt(v || "0"), 18));
  } catch {
    return 0;
  }
};

const titleOf = async (uri?: string): Promise<string> => {
  if (!uri) return "";
  const r = resolveUri(uri);
  if (r.kind === "invalid" || !r.url) return "";
  try {
    const j = (await (await fetch(r.url)).json()) as { title?: string };
    return typeof j.title === "string" ? j.title : "";
  } catch {
    return "";
  }
};

const map = async (rows: RawOrder[]): Promise<ManagedOrder[]> =>
  Promise.all(
    rows.map(async (o) => ({
      id: o.orderId,
      offerId: o.offerId,
      buyer: o.buyer ?? "",
      title: await titleOf(o.offer?.contentUri),
      quantity: Number(o.quantity) || 0,
      status: o.status,
      stage: Number(o.stage) || 0,
      deadline: Number(o.deadline) || 0,
      total: mona(o.total),
      slice: mona(o.slice),
      grantSlice: mona(o.grantSlice),
      cyberSlice: mona(o.cyberSlice),
      grantId: o.grantId ?? "0",
      encryptedShipping: o.encryptedShipping ?? "",
      time: o.createdAtTimestamp,
      tx: o.transactionHash,
    })),
  );

const useMyOrders = (): { orders: MyOrders; loading: boolean; refetch: () => void } => {
  const { address } = useAccount();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["my-orders", address],
    queryFn: async (): Promise<MyOrders> => {
      if (!address) return { bought: [], sold: [] };
      const raw = await subgraphQuery<{ bought: RawOrder[]; sold: RawOrder[] }>(
        MY_ORDERS_QUERY,
        { me: address.toLowerCase() },
      );
      const [bought, sold] = await Promise.all([
        map(raw?.bought ?? []),
        map(raw?.sold ?? []),
      ]);
      return { bought, sold };
    },
    enabled: subgraphReady() && Boolean(address),
  });

  return {
    orders: data ?? { bought: [], sold: [] },
    loading: isLoading,
    refetch: (): void => {
      refetch();
    },
  };
};

export default useMyOrders;
