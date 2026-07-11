import { useQuery } from "@tanstack/react-query";
import { subgraphQuery, subgraphReady } from "@/app/lib/graphql/fetcher";
import { ORDERS_BY_OFFER_QUERY } from "@/app/lib/graphql/queries";
import { OrderRow } from "../types/common.types";

type RawOrder = {
  orderId: string;
  buyer: string;
  quantity: string;
  status: string;
  stage: number;
  createdAtTimestamp: string;
  transactionHash: string;
};

const load = async (offerId: string): Promise<OrderRow[]> => {
  const data = await subgraphQuery<{ orders: RawOrder[] }>(
    ORDERS_BY_OFFER_QUERY,
    { offerId },
  );
  return (data?.orders ?? []).map((o) => ({
    id: o.orderId,
    buyer: o.buyer,
    quantity: Number(o.quantity) || 0,
    status: o.status,
    stage: Number(o.stage) || 0,
    time: o.createdAtTimestamp,
    tx: o.transactionHash,
  }));
};

const useOfferOrders = (
  offerId: string,
): { orders: OrderRow[]; loading: boolean } => {
  const valid = /^\d+$/.test(offerId);
  const { data, isLoading } = useQuery({
    queryKey: ["offer-orders", offerId],
    queryFn: () => load(offerId),
    enabled: subgraphReady() && valid,
  });
  return { orders: data ?? [], loading: isLoading };
};

export default useOfferOrders;
