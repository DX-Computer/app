"use client";

import { FunctionComponent, JSX, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseUnits } from "viem";
import Caja from "./Caja";
import KitComments from "./KitComments";
import { useShell } from "./Shell";
import { fmt } from "../hooks/fmt";
import useGrant from "../hooks/useGrant";
import useGrants from "../hooks/useGrants";
import useGrantPosition from "../hooks/useGrantPosition";
import resolveUri from "../hooks/resolveUri";
import { txUrl, addressUrl } from "@/app/lib/chains";
import { commentTag } from "@/app/lib/commentTag";

const label = "relative flex text-[10px] text-gray-400";
const arLink =
  "relative flex w-fit text-xs underline cursor-blacksmithHS text-gray-200";
const fieldBg = "bg-[url(/images/bg.png)] bg-cover bg-center";
const inp = `relative flex w-full ${fieldBg} px-2 py-1 text-xs text-white focus:outline-none`;
const btn =
  "relative flex justify-center bg-[url(/images/cajatexto.png)] bg-[length:100%_100%] bg-center bg-no-repeat px-4 py-2 text-xs cursor-blacksmithHS";

const short = (a?: string): string =>
  a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "—";
const fmtTime = (ts?: string): string => {
  const n = Number(ts);
  if (!ts || !n) return "—";
  return new Date(n * 1000).toISOString().slice(0, 10);
};

const GrantDetailCenter: FunctionComponent<{ id: string }> = ({
  id,
}): JSX.Element => {
  const s = useShell();
  const conn = s.conn;
  const { grant, funders, offers } = useGrant(id);
  const g = useGrants();
  const pos = useGrantPosition(id);
  const router = useRouter();
  const [amount, setAmount] = useState<string>("");
  const [confirmDel, setConfirmDel] = useState<boolean>(false);

  const pct =
    grant && grant.budget ? Math.min(100, (grant.raised / grant.budget) * 100) : 0;
  const funded = Boolean(grant && grant.raised >= grant.budget && grant.budget > 0);
  const tx = grant?.transactionHash ?? "";
  const txHref = txUrl(tx);
  const creatorHref = addressUrl(grant?.creator);

  const fundBlocked =
    conn.isConnected && !conn.wrongNetwork && (!amount.trim() || g.isPending);

  const fund = async (): Promise<void> => {
    if (!grant || !amount.trim()) return;
    try {
      await g.fundGrant(BigInt(grant.id), parseUnits(amount, 18));
      pos.refetch();
      setAmount("");
    } catch {}
  };

  const claim = async (): Promise<void> => {
    if (!grant) return;
    try {
      await g.claim(BigInt(grant.id));
      pos.refetch();
    } catch {}
  };

  const doRemove = async (): Promise<void> => {
    if (!grant) return;
    try {
      await g.removeGrant(BigInt(grant.id), s.dict.common.deleteContentReminder);
      router.push(`/${s.lang}/treeliner-grants`);
    } catch {}
  };

  const downloadContentLink = (): void => {
    if (!grant) return;
    const blob = new Blob([grant.contentUri], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `grant-${grant.id}-content-link.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isCreator = Boolean(
    conn.isConnected &&
      conn.address &&
      grant &&
      conn.address.toLowerCase() === grant.creator.toLowerCase(),
  );

  if (!grant) {
    return (
      <Caja className="flex-col flex-1 gap-2 p-4">
        <span className="relative flex text-sm text-gray-400">
          {fmt(s.dict.grant.notFound, { id })}
        </span>
      </Caja>
    );
  }

  if (grant.removed) {
    return (
      <Caja className="flex-col flex-1 gap-2 p-4">
        <Caja bg="bg" className="flex-col gap-2 p-3">
          <span className="relative flex text-sm">
            {fmt(s.dict.grant.labelGrant, { id: grant.id })}
          </span>
          <span className="relative flex text-xs text-red-400 leading-relaxed">
            {s.dict.grant.removedBanner}
          </span>
        </Caja>

        {conn.isConnected && (pos.shares > 0 || pos.pending > 0) && (
          <Caja bg="bg" className="flex-col gap-2 p-3">
            <span className={label}>{s.dict.grant.yourPosition}</span>
            <div className="relative flex flex-row flex-wrap gap-x-4 gap-y-1 text-xs">
              <span className="relative flex">{fmt(s.dict.grant.shares, { count: pos.shares })}</span>
              <span className="relative flex text-gray-400">
                {fmt(s.dict.grant.pending, { amount: pos.pending })}
              </span>
            </div>
            <div className="relative flex flex-row gap-2 items-center flex-wrap">
              <button
                onClick={conn.wrongNetwork ? conn.switchNetwork : claim}
                disabled={g.isPending || pos.pending <= 0}
                className={`${btn} w-fit ${
                  g.isPending || pos.pending <= 0 ? "opacity-40" : ""
                }`}
              >
                {conn.wrongNetwork ? s.dict.connection.switchChain : s.dict.grant.claim}
              </button>
              <button
                onClick={
                  conn.wrongNetwork
                    ? conn.switchNetwork
                    : () => {
                        g.blacklistRugged(BigInt(grant.id)).catch(() => {});
                      }
                }
                disabled={g.isPending}
                className={`${btn} w-fit ${g.isPending ? "opacity-40" : ""}`}
              >
                {s.dict.grant.blacklistCreator}
              </button>
            </div>
          </Caja>
        )}
      </Caja>
    );
  }

  return (
    <Caja className="flex-col flex-1 gap-2 p-4">
      <div className="relative flex flex-col lg:flex-row gap-2">
        <div className="relative flex flex-col flex-1 gap-2">
          <Caja bg="bg" className="flex-col gap-2 p-3">
            <div className="relative flex flex-row items-center gap-2 flex-wrap text-xs text-gray-300">
              <span className="relative flex">{fmt(s.dict.grant.labelGrant, { id: grant.id })}</span>
              <span className="relative flex bg-white/10 px-2 py-0.5 text-[10px]">
                {funded ? s.dict.grant.funded : s.dict.grant.open}
              </span>
            </div>
            <span className="relative flex text-sm">{grant.title || "—"}</span>
            <div className="relative flex flex-row flex-wrap gap-x-4 gap-y-1 text-[10px] text-gray-400">
              <Link
                href={`/${s.lang}/kit/${grant.kitId}`}
                className="relative flex underline cursor-blacksmithHS"
              >
                {fmt(s.dict.grant.kit, { kitId: grant.kitId })}
              </Link>
              {creatorHref ? (
                <a
                  href={creatorHref}
                  target="_blank"
                  rel="noreferrer"
                  className="relative flex underline cursor-blacksmithHS"
                >
                  {fmt(s.dict.grant.creator, { address: short(grant.creator) })}
                </a>
              ) : (
                <span className="relative flex">
                  {fmt(s.dict.grant.creator, { address: short(grant.creator) })}
                </span>
              )}
              <span className="relative flex">{fmt(s.dict.grant.block, { block: grant.createdAtBlock || "—" })}</span>
              <span className="relative flex">{fmt(s.dict.grant.time, { time: fmtTime(grant.createdAtTimestamp) })}</span>
              {grant.updatedAtTimestamp &&
                grant.updatedAtTimestamp !== grant.createdAtTimestamp && (
                  <span className="relative flex">
                    {fmt(s.dict.common.updatedTimeLabel, { time: fmtTime(grant.updatedAtTimestamp) })}
                  </span>
                )}
              <span className="relative flex">{s.dict.grant.license}</span>
            </div>
            <div className="relative flex flex-row gap-2 items-center">
              <span className={label}>{s.dict.grant.tx}</span>
              {txHref ? (
                <a href={txHref} target="_blank" rel="noreferrer" className={arLink}>
                  {s.dict.common.viewTx}
                </a>
              ) : (
                <span className="relative flex text-[10px] text-gray-500">
                  {tx || "—"}
                </span>
              )}
            </div>
          </Caja>

          <Caja bg="bg" className="flex-col gap-2 p-3">
            <span className={label}>{s.dict.grant.funding}</span>
            <div className="relative flex flex-row flex-wrap gap-x-4 gap-y-1 text-xs">
              <span className="relative flex">
                {fmt(s.dict.grant.raisedOfBudget, { raised: grant.raised, budget: grant.budget })}
              </span>
              <span className="relative flex text-gray-400">
                {fmt(s.dict.grant.fundersCount, { count: grant.funders })}
              </span>
            </div>
            <div className="relative flex w-full h-2 bg-white/10">
              <div
                className="relative flex h-full bg-white/60"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="relative flex text-[10px] text-gray-500 leading-relaxed">
              {s.dict.grant.salesShareHint}
            </span>
          </Caja>

          <Caja bg="bg" className="flex-col gap-2 p-3">
            <span className={label}>{s.dict.grant.backThisGrant}</span>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={s.dict.grant.amountPlaceholder}
              className={inp}
            />
            <button
              onClick={
                !conn.isConnected
                  ? conn.connect
                  : conn.wrongNetwork
                  ? conn.switchNetwork
                  : fund
              }
              disabled={fundBlocked}
              className={`${btn} w-fit ${fundBlocked ? "opacity-40" : ""}`}
            >
              {!conn.isConnected
                ? s.dict.connection.connectWallet
                : conn.wrongNetwork
                ? s.dict.connection.switchChain
                : g.isPending
                ? s.dict.grant.funding_
                : s.dict.grant.fund}
            </button>
          </Caja>

          {conn.isConnected && (pos.shares > 0 || pos.pending > 0) && (
            <Caja bg="bg" className="flex-col gap-2 p-3">
              <span className={label}>{s.dict.grant.yourPosition}</span>
              <div className="relative flex flex-row flex-wrap gap-x-4 gap-y-1 text-xs">
                <span className="relative flex">{fmt(s.dict.grant.shares, { count: pos.shares })}</span>
                <span className="relative flex text-gray-400">
                  {fmt(s.dict.grant.pending, { amount: pos.pending })}
                </span>
              </div>
              <button
                onClick={
                  conn.wrongNetwork ? conn.switchNetwork : claim
                }
                disabled={g.isPending || pos.pending <= 0}
                className={`${btn} w-fit ${
                  g.isPending || pos.pending <= 0 ? "opacity-40" : ""
                }`}
              >
                {conn.wrongNetwork ? s.dict.connection.switchChain : s.dict.grant.claim}
              </button>
            </Caja>
          )}

          {isCreator && (
            <Caja bg="bg" className="flex-col gap-2 p-3">
              <span className={label}>{s.dict.grant.manageCreator}</span>
              {grant.funders > 0 ? (
                <span className="relative flex text-[10px] text-red-400 leading-relaxed">
                  {s.dict.grant.deleteWithFundersWarning}
                </span>
              ) : (
                <Link
                  href={`/${s.lang}/treeliner-grant/${grant.id}/edit`}
                  className={`${btn} w-fit`}
                >
                  {s.dict.grant.editGrant}
                </Link>
              )}
              {confirmDel ? (
                <div className="relative flex flex-row gap-2 items-center flex-wrap">
                  <span className="relative flex text-[10px] text-red-400">
                    {s.dict.grant.deleteConfirm}
                  </span>
                  <button onClick={downloadContentLink} className={btn}>
                    {s.dict.common.downloadContentLink}
                  </button>
                  <button
                    onClick={
                      conn.wrongNetwork ? conn.switchNetwork : doRemove
                    }
                    disabled={g.isPending}
                    className={btn}
                  >
                    {s.dict.common.confirmDelete}
                  </button>
                  <button
                    onClick={() => setConfirmDel(false)}
                    className={btn}
                  >
                    {s.dict.common.cancel}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDel(true)}
                  className={`${btn} w-fit`}
                >
                  {s.dict.common.delete}
                </button>
              )}
            </Caja>
          )}

          <Caja bg="bg" className="flex-col gap-1 p-2">
            <span className={label}>{s.dict.grant.purpose}</span>
            <span className="relative flex text-xs leading-relaxed">
              {grant.purpose || "—"}
            </span>
          </Caja>

          <Caja bg="bg" className="flex-col gap-1 p-2">
            <span className={label}>{s.dict.grant.deliverables}</span>
            <span className="relative flex text-xs leading-relaxed">
              {grant.deliverables || "—"}
            </span>
          </Caja>

          <Caja bg="bg" className="flex-col gap-2 p-2">
            <span className={label}>{s.dict.grant.milestones}</span>
            {grant.milestones.length ? (
              grant.milestones.map((m, i) => (
                <div key={i} className="relative flex flex-col gap-0.5">
                  <span className="relative flex text-xs">
                    {fmt(s.dict.grant.milestoneRow, { index: i + 1, title: m.title })}
                  </span>
                  <span className="relative flex text-[10px] text-gray-400 leading-relaxed">
                    {m.description}
                  </span>
                  <span className="relative flex text-[10px] text-gray-500">
                    {fmt(s.dict.grant.milestoneDeliverable, { deliverable: m.deliverable })}
                  </span>
                </div>
              ))
            ) : (
              <span className="relative flex text-xs">—</span>
            )}
          </Caja>

          {grant.links.length > 0 && (
            <Caja bg="bg" className="flex-col gap-1 p-2">
              <span className={label}>{s.dict.grant.links}</span>
              {grant.links.map((l, i) => {
                const r = resolveUri(l);
                return (
                  <a
                    key={i}
                    href={r.url || l}
                    target="_blank"
                    rel="noreferrer"
                    className={arLink}
                  >
                    {l}
                  </a>
                );
              })}
            </Caja>
          )}
        </div>

        <KitComments canonicalTag={commentTag("grant", grant.id)} />
      </div>

      <div className="relative flex flex-col lg:flex-row gap-2">
        <Caja bg="bg" className="flex-col flex-1 gap-2 p-2">
          <span className={label}>{fmt(s.dict.grant.productsFunding, { count: offers.length })}</span>
          <div className="relative flex flex-col gap-2">
            {offers.length ? (
              offers.map((o) => (
                <Link key={o.id} href={`/${s.lang}/market/${o.id}`}>
                  <Caja bg="fondocaja" className="flex-row gap-2 p-2 cursor-blacksmithHS">
                    <img
                      src={resolveUri(o.image).url || "/images/fabrica.png"}
                      onError={(e) => {
                        e.currentTarget.src = "/images/fabrica.png";
                      }}
                      draggable={false}
                      alt={o.title}
                      className="relative flex w-10 h-10 shrink-0 object-cover"
                    />
                    <div className="relative flex flex-col flex-1 gap-0.5">
                      <span className="relative flex text-xs">{o.title}</span>
                      <span className="relative flex text-[10px] text-gray-400">
                        {fmt(s.dict.grant.productPriceLeft, { price: o.price, quantity: o.quantity })}
                      </span>
                    </div>
                  </Caja>
                </Link>
              ))
            ) : (
              <span className="relative flex text-[10px] text-gray-500">
                {s.dict.grant.noProductsLinked}
              </span>
            )}
          </div>
        </Caja>

        <Caja bg="bg" className="flex-col flex-1 gap-2 p-2">
          <span className={label}>{fmt(s.dict.grant.fundersHeading, { count: funders.length })}</span>
          <div className="relative flex flex-col gap-1">
            {funders.length ? (
              funders.map((f, i) => (
                <div
                  key={i}
                  className="relative flex flex-row items-center gap-2 text-[10px] text-gray-300"
                >
                  <Link
                    href={`/${s.lang}/treeliner/${f.funder}`}
                    className="relative flex flex-1 underline cursor-blacksmithHS"
                  >
                    {short(f.funder)}
                  </Link>
                  <span className="relative flex text-gray-400">
                    {fmt(s.dict.grant.funderShares, { shares: f.shares })}
                  </span>
                </div>
              ))
            ) : (
              <span className="relative flex text-[10px] text-gray-500">
                {s.dict.grant.noFundersYet}
              </span>
            )}
          </div>
        </Caja>
      </div>
    </Caja>
  );
};

export default GrantDetailCenter;
