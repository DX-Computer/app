import { useReadContract } from "wagmi";
import { contractConfig } from "@/app/lib/contracts";
import { ZERO_PUBKEY } from "./shippingCrypto";

type Hash = `0x${string}`;

const useOfferPubkey = (offerId?: bigint): Hash | undefined => {
  const { address, abi, ready } = contractConfig("prefabMarket");
  const { data } = useReadContract({
    address: address as Hash,
    abi,
    functionName: "offers",
    args: offerId !== undefined ? [offerId] : undefined,
    query: { enabled: ready && offerId !== undefined },
  });
  const pubkey = Array.isArray(data) ? (data[8] as Hash) : undefined;
  return pubkey && pubkey !== ZERO_PUBKEY ? pubkey : undefined;
};

export default useOfferPubkey;
