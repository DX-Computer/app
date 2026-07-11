import { parseUnits } from "viem";
import { useSignMessage } from "wagmi";
import { contractConfig } from "@/app/lib/contracts";
import { ADDRESSES } from "@/app/lib/addresses";
import { ERC20_ABI } from "@/app/lib/constants";
import { ProductDraft } from "../types/common.types";
import { useTrackedWrite } from "./useTrackedWrite";
import { SHIPPING_KEY_MESSAGE, pubkeyFromSignature } from "./shippingCrypto";

type Hash = `0x${string}`;

const ZERO_HASH =
  "0x0000000000000000000000000000000000000000000000000000000000000000" as Hash;

const useMarket = () => {
  const { address: market, abi, ready } = contractConfig("prefabMarket");
  const base = { address: market as Hash, abi } as const;
  const { writeContractAsync, isPending, error } = useTrackedWrite();
  const { signMessageAsync } = useSignMessage();

  const guard = (): boolean => {
    if (!ready || !market) {
      console.log("prefabMarket address not configured");
      return false;
    }
    return true;
  };

  const daysToSeconds = (days: string): bigint => {
    const n = Number(days);
    if (!Number.isFinite(n) || n < 1) return 86400n;
    return BigInt(Math.round(n * 86400));
  };

  const createOffer = async (
    kitId: bigint,
    version: bigint,
    designHash: Hash,
    contentUri: string,
    price: bigint,
    sliceBps: number,
    quantity: bigint,
    pubkey: Hash,
    confirmWindow: bigint,
    cyberBps: number
  ) => {
    if (!guard()) return;
    return writeContractAsync({
      ...base,
      functionName: "createOffer",
      args: [
        kitId,
        version,
        designHash,
        contentUri,
        price,
        sliceBps,
        quantity,
        pubkey,
        confirmWindow,
        cyberBps,
      ],
    });
  };

  const publishOffer = async (draft: ProductDraft, contentUri: string) => {
    if (!guard()) return;
    const signature = await signMessageAsync({ message: SHIPPING_KEY_MESSAGE });
    const pubkey = await pubkeyFromSignature(signature);
    return createOffer(
      /^\d+$/.test(draft.kit) ? BigInt(draft.kit) : 0n,
      /^\d+$/.test(draft.version) ? BigInt(draft.version) : 0n,
      (draft.designHash || ZERO_HASH) as Hash,
      contentUri,
      draft.price ? parseUnits(draft.price, 18) : 0n,
      draft.sliceBps,
      /^\d+$/.test(draft.quantity) ? BigInt(draft.quantity) : 0n,
      pubkey,
      daysToSeconds(draft.confirmDays),
      draft.cyberBps
    );
  };

  const updateOffer = async (
    offerId: bigint,
    price: bigint,
    sliceBps: number,
    quantity: bigint,
    contentUri: string,
    confirmDays: string,
    cyberBps: number
  ) => {
    if (!guard()) return;
    return writeContractAsync({
      ...base,
      functionName: "updateOffer",
      args: [
        offerId,
        price,
        sliceBps,
        quantity,
        contentUri,
        daysToSeconds(confirmDays),
        cyberBps,
      ],
    });
  };

  const deleteOffer = async (offerId: bigint, note?: string) => {
    if (!guard()) return;
    return writeContractAsync(
      {
        ...base,
        functionName: "deleteOffer",
        args: [offerId],
      },
      { successNote: note },
    );
  };

  const linkGrant = async (
    offerId: bigint,
    grantId: bigint,
    grantBps: number
  ) => {
    if (!guard()) return;
    return writeContractAsync({
      ...base,
      functionName: "linkGrant",
      args: [offerId, grantId, grantBps],
    });
  };

  const unlinkGrant = async (offerId: bigint) => {
    if (!guard()) return;
    return writeContractAsync({
      ...base,
      functionName: "unlinkGrant",
      args: [offerId],
    });
  };

  const linkAgent = async (offerId: bigint, agentId: bigint) => {
    if (!guard()) return;
    return writeContractAsync({
      ...base,
      functionName: "linkAgent",
      args: [offerId, agentId],
    });
  };

  const unlinkAgent = async (offerId: bigint, agentId: bigint) => {
    if (!guard()) return;
    return writeContractAsync({
      ...base,
      functionName: "unlinkAgent",
      args: [offerId, agentId],
    });
  };

  const claimAfterDeadline = async (orderId: bigint) => {
    if (!guard()) return;
    return writeContractAsync({
      ...base,
      functionName: "claimAfterDeadline",
      args: [orderId],
    });
  };

  const setPubkey = async (offerId: bigint, pubkey: Hash) => {
    if (!guard()) return;
    return writeContractAsync({
      ...base,
      functionName: "setPubkey",
      args: [offerId, pubkey],
    });
  };

  const buy = async (
    offerId: bigint,
    total: bigint,
    quantity: bigint,
    shippingCommitment: Hash,
    oracle: Hash,
    encryptedShipping: Hash = "0x"
  ) => {
    if (!guard() || !market) return;
    if (ADDRESSES.mona) {
      await writeContractAsync({
        address: ADDRESSES.mona,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [ADDRESSES.registry || market, total],
      });
    }
    return writeContractAsync({
      ...base,
      functionName: "buy",
      args: [offerId, quantity, shippingCommitment, oracle, encryptedShipping],
    });
  };

  const setOrderStage = async (orderId: bigint, stage: number) => {
    if (!guard()) return;
    return writeContractAsync({
      ...base,
      functionName: "setOrderStage",
      args: [orderId, stage],
    });
  };

  const confirmReceipt = async (orderId: bigint) => {
    if (!guard()) return;
    return writeContractAsync({
      ...base,
      functionName: "confirmReceipt",
      args: [orderId],
    });
  };

  const cancelByFabricator = async (orderId: bigint) => {
    if (!guard()) return;
    return writeContractAsync({
      ...base,
      functionName: "cancelByFabricator",
      args: [orderId],
    });
  };

  const cancelByBuyer = async (orderId: bigint) => {
    if (!guard()) return;
    return writeContractAsync({
      ...base,
      functionName: "cancelByBuyer",
      args: [orderId],
    });
  };

  return {
    ready,
    isPending,
    error,
    createOffer,
    publishOffer,
    updateOffer,
    deleteOffer,
    linkGrant,
    unlinkGrant,
    linkAgent,
    unlinkAgent,
    claimAfterDeadline,
    setPubkey,
    buy,
    confirmReceipt,
    cancelByFabricator,
    cancelByBuyer,
    setOrderStage,
  };
};

export default useMarket;
