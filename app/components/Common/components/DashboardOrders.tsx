"use client";

import { FunctionComponent, JSX, useState } from "react";
import Link from "next/link";
import { useSignMessage } from "wagmi";
import Caja from "./Caja";
import { useShell } from "./Shell";
import { fmt } from "../hooks/fmt";
import useMyOrders from "../hooks/useMyOrders";
import useMarket from "../hooks/useMarket";
import {
  SHIPPING_KEY_MESSAGE,
  decryptShipping,
} from "../hooks/shippingCrypto";

const label = "relative flex text-[10px] text-gray-400";
const btn =
  "relative flex justify-center bg-[url(/images/cajatexto.png)] bg-[length:100%_100%] bg-center bg-no-repeat px-3 py-1 text-[10px] cursor-blacksmithHS";
const tagChip = "relative flex bg-white/10 px-2 py-0.5 text-[10px] text-gray-300";

const short = (a?: string): string =>
  a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "—";
const fmtTime = (ts?: string): string => {
  const n = Number(ts);
  if (!ts || !n) return "—";
  return new Date(n * 1000).toISOString().slice(0, 10);
};

const DashboardOrders: FunctionComponent<{ mode: "bought" | "sold" }> = ({
  mode,
}): JSX.Element => {
  const s = useShell();
  const conn = s.conn;
  const { orders, loading, refetch } = useMyOrders();
  const m = useMarket();
  const { signMessageAsync } = useSignMessage();
  const [decrypted, setDecrypted] = useState<Record<string, string>>({});

  const rows = mode === "bought" ? orders.bought : orders.sold;

  const statusLabel = (status: string, stage: number): string => {
    if (status === "completed") return s.dict.dashboard.statusCompleted;
    if (status === "refunded") return s.dict.dashboard.statusRefunded;
    if (stage === 2) return s.dict.dashboard.stageShipped;
    if (stage === 1) return s.dict.dashboard.stageMaking;
    return s.dict.dashboard.stagePlaced;
  };

  const act = async (fn: () => Promise<unknown>): Promise<void> => {
    try {
      await fn();
      refetch();
    } catch {}
  };

  const reveal = async (orderId: string, blob: string): Promise<void> => {
    try {
      const sig = await signMessageAsync({ message: SHIPPING_KEY_MESSAGE });
      const text = await decryptShipping(sig, blob);
      setDecrypted((d) => ({
        ...d,
        [orderId]: text || s.dict.dashboard.decryptFailed,
      }));
    } catch {}
  };

  if (!conn.isConnected) {
    return (
      <span className="relative flex text-[10px] text-gray-500">
        {s.dict.dashboard.connectPrompt}
      </span>
    );
  }

  return (
    <Caja bg="bg" className="flex-col gap-2 p-3">
      <span className={label}>
        {fmt(
          mode === "bought"
            ? s.dict.dashboard.ordersHeading
            : s.dict.dashboard.salesHeading,
          { count: rows.length },
        )}
      </span>
      {mode === "sold" && (
        <span className="relative flex text-[10px] text-gray-500 leading-relaxed">
          {s.dict.dashboard.salesNote}
        </span>
      )}
      {rows.length === 0 ? (
        <span className="relative flex text-[10px] text-gray-500">
          {loading ? s.dict.createKit.loadingCurrentContent : s.dict.dashboard.empty}
        </span>
      ) : (
        <div className="relative flex flex-col gap-2">
          {rows.map((o) => {
            const open = o.status === "open";
            const windowPassed =
              open &&
              o.stage >= 2 &&
              o.deadline > 0 &&
              Date.now() / 1000 > o.deadline;
            const fabAmount = Math.max(
              0,
              o.total - o.slice - o.grantSlice - o.cyberSlice,
            );
            return (
              <Caja key={o.id} bg="fondocaja" className="flex-col gap-2 p-2">
                <div className="relative flex flex-row items-center gap-2 flex-wrap">
                  <Link
                    href={`/${s.lang}/market/${o.offerId}`}
                    className="relative flex text-xs text-white underline cursor-blacksmithHS"
                  >
                    #{o.id} · {o.title || "—"}
                  </Link>
                  <span className="relative flex text-[10px] text-gray-400">
                    {fmt(s.dict.product.orderQty, { quantity: o.quantity })}
                  </span>
                  <span className="relative flex flex-1 text-[10px] text-gray-500">
                    {fmtTime(o.time)}
                  </span>
                  <span className={tagChip}>{statusLabel(o.status, o.stage)}</span>
                </div>

                {mode === "sold" && (
                  <span className="relative flex text-[10px] text-gray-400">
                    {fmt(s.dict.dashboard.buyerLabel, { address: short(o.buyer) })}
                  </span>
                )}

                {o.total > 0 && (
                  <div className="relative flex flex-row flex-wrap gap-x-3 gap-y-1 text-[10px] text-gray-400">
                    <span className="relative flex text-gray-300">
                      {fmt(s.dict.dashboard.breakdownTotal, { amount: Number(o.total.toFixed(2)) })}
                    </span>
                    <span className="relative flex">
                      {fmt(s.dict.dashboard.breakdownTreasury, { amount: Number(o.slice.toFixed(2)) })}
                    </span>
                    {o.grantSlice > 0 && (
                      <span className="relative flex">
                        {fmt(s.dict.dashboard.breakdownGrant, { grantId: o.grantId, amount: Number(o.grantSlice.toFixed(2)) })}
                      </span>
                    )}
                    {o.cyberSlice > 0 && (
                      <span className="relative flex">
                        {fmt(s.dict.dashboard.breakdownCyber, { amount: Number(o.cyberSlice.toFixed(2)) })}
                      </span>
                    )}
                    <span className="relative flex">
                      {fmt(s.dict.dashboard.breakdownFabricator, { amount: Number(fabAmount.toFixed(2)) })}
                    </span>
                  </div>
                )}

                {open && o.stage >= 2 && o.deadline > 0 && (
                  <span className="relative flex text-[10px] text-gray-400">
                    {fmt(s.dict.dashboard.deadlineLabel, { date: fmtTime(String(o.deadline)) })}
                  </span>
                )}

                {mode === "sold" && decrypted[o.id] && (
                  <span className="relative flex text-[10px] text-gray-200 break-all bg-white/5 px-2 py-1">
                    {decrypted[o.id]}
                  </span>
                )}

                <div className="relative flex flex-row items-center gap-2 flex-wrap">
                  {mode === "sold" && o.encryptedShipping && o.encryptedShipping !== "0x" && (
                    <button
                      onClick={() => reveal(o.id, o.encryptedShipping)}
                      className={btn}
                    >
                      {s.dict.dashboard.decryptAddress}
                    </button>
                  )}
                  {mode === "sold" && open && o.stage < 1 && (
                    <button
                      onClick={
                        conn.wrongNetwork
                          ? conn.switchNetwork
                          : () => act(() => m.setOrderStage(BigInt(o.id), 1))
                      }
                      disabled={m.isPending}
                      className={`${btn} ${m.isPending ? "opacity-40" : ""}`}
                    >
                      {s.dict.dashboard.markMaking}
                    </button>
                  )}
                  {mode === "sold" && open && o.stage < 2 && (
                    <button
                      onClick={
                        conn.wrongNetwork
                          ? conn.switchNetwork
                          : () => act(() => m.setOrderStage(BigInt(o.id), 2))
                      }
                      disabled={m.isPending}
                      className={`${btn} ${m.isPending ? "opacity-40" : ""}`}
                    >
                      {s.dict.dashboard.markShipped}
                    </button>
                  )}
                  {mode === "sold" && open && (
                    <button
                      onClick={
                        conn.wrongNetwork
                          ? conn.switchNetwork
                          : () => act(() => m.cancelByFabricator(BigInt(o.id)))
                      }
                      disabled={m.isPending}
                      className={`${btn} ${m.isPending ? "opacity-40" : ""}`}
                    >
                      {s.dict.dashboard.cancelOrder}
                    </button>
                  )}
                  {mode === "sold" && windowPassed && (
                    <button
                      onClick={
                        conn.wrongNetwork
                          ? conn.switchNetwork
                          : () => act(() => m.claimAfterDeadline(BigInt(o.id)))
                      }
                      disabled={m.isPending}
                      className={`${btn} ${m.isPending ? "opacity-40" : ""}`}
                    >
                      {s.dict.dashboard.claimAfterDeadline}
                    </button>
                  )}
                  {mode === "bought" && open && (
                    <>
                      <button
                        onClick={
                          conn.wrongNetwork
                            ? conn.switchNetwork
                            : () => act(() => m.confirmReceipt(BigInt(o.id)))
                        }
                        disabled={m.isPending}
                        className={`${btn} ${m.isPending ? "opacity-40" : ""}`}
                      >
                        {s.dict.dashboard.confirmReceipt}
                      </button>
                      {o.stage < 2 && (
                        <button
                          onClick={
                            conn.wrongNetwork
                              ? conn.switchNetwork
                              : () => act(() => m.cancelByBuyer(BigInt(o.id)))
                          }
                          disabled={m.isPending}
                          className={`${btn} ${m.isPending ? "opacity-40" : ""}`}
                        >
                          {s.dict.dashboard.cancelBuyer}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </Caja>
            );
          })}
        </div>
      )}
    </Caja>
  );
};

export default DashboardOrders;
