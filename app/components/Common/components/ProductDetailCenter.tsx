"use client";

import { FunctionComponent, JSX, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { keccak256, stringToHex } from "viem";
import Caja from "./Caja";
import VideoPlayer from "./VideoPlayer";
import KitComments from "./KitComments";
import { useShell } from "./Shell";
import { fmt } from "../hooks/fmt";
import useOffer from "../hooks/useOffer";
import useMarket from "../hooks/useMarket";
import useGrantsBrowse from "../hooks/useGrantsBrowse";
import useAgentsBrowse from "../hooks/useAgentsBrowse";
import useOfferOrders from "../hooks/useOfferOrders";
import useOfferPubkey from "../hooks/useOfferPubkey";
import { encryptShipping } from "../hooks/shippingCrypto";
import resolveUri from "../hooks/resolveUri";
import { txUrl, addressUrl } from "@/app/lib/chains";
import { commentTag } from "@/app/lib/commentTag";

const ZERO = "0x0000000000000000000000000000000000000000" as `0x${string}`;

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

const ProductDetailCenter: FunctionComponent<{ id: string }> = ({
  id,
}): JSX.Element => {
  const s = useShell();
  const conn = s.conn;
  const { offer } = useOffer(id);
  const m = useMarket();
  const { grants: allGrants } = useGrantsBrowse();
  const { agents: allAgents } = useAgentsBrowse();
  const pubkey = useOfferPubkey(/^\d+$/.test(id) ? BigInt(id) : undefined);
  const router = useRouter();
  const [ship, setShip] = useState<string>("");
  const [qty, setQty] = useState<string>("1");
  const [optionVals, setOptionVals] = useState<Record<string, string>>({});
  const [grantId, setGrantId] = useState<string>("");
  const [grantQuery, setGrantQuery] = useState<string>("");
  const [grantPct, setGrantPct] = useState<string>("");
  const [agentSel, setAgentSel] = useState<string>("");
  const [agentQuery, setAgentQuery] = useState<string>("");
  const [confirmDel, setConfirmDel] = useState<boolean>(false);
  const { orders } = useOfferOrders(id);

  if (!offer) {
    return (
      <Caja className="flex-col flex-1 gap-2 p-4">
        <span className="relative flex text-sm text-gray-400">
          {fmt(s.dict.product.notFound, { id })}
        </span>
      </Caja>
    );
  }

  const soldOut = offer.quantity <= 0;
  const qtyNum = /^\d+$/.test(qty) ? Number(qty) : 0;
  const qtyOk = qtyNum >= 1 && qtyNum <= offer.quantity;
  const vid = resolveUri(offer.video);
  const aud = resolveUri(offer.audio);
  const tx = offer.transactionHash;
  const txHref = txUrl(tx);
  const fabHref = addressUrl(offer.fabricator);
  const isFabricator = Boolean(
    conn.isConnected &&
      conn.address &&
      conn.address.toLowerCase() === offer.fabricator.toLowerCase(),
  );
  const optionsOk = offer.options.every((o) => (optionVals[o.label] ?? "").length > 0);
  const buyBlocked =
    conn.isConnected &&
    !conn.wrongNetwork &&
    (soldOut || !ship.trim() || !qtyOk || !optionsOk || m.isPending);

  const buy = async (): Promise<void> => {
    if (!qtyOk || !optionsOk) return;
    try {
      const chosen = offer.options
        .map((o) => `${o.label}: ${optionVals[o.label]}`)
        .join("\n");
      const payload = chosen ? `${chosen}\n---\n${ship}` : ship;
      const encrypted = pubkey ? await encryptShipping(pubkey, payload) : "0x";
      const total = BigInt(offer.priceWei || "0") * BigInt(qtyNum);
      await m.buy(
        BigInt(offer.id),
        total,
        BigInt(qtyNum),
        keccak256(stringToHex(payload)),
        ZERO,
        encrypted as `0x${string}`,
      );
      setShip("");
    } catch {}
  };

  const grantPctNum = Number(grantPct);
  const grantPctOk =
    grantPct.trim().length > 0 &&
    Number.isFinite(grantPctNum) &&
    grantPctNum >= 1 &&
    grantPctNum <= 70;

  const link = async (): Promise<void> => {
    if (!/^\d+$/.test(grantId) || !grantPctOk) return;
    try {
      await m.linkGrant(
        BigInt(offer.id),
        BigInt(grantId),
        Math.round(grantPctNum * 100),
      );
      setGrantId("");
      setGrantQuery("");
      setGrantPct("");
    } catch {}
  };

  const unlink = async (): Promise<void> => {
    try {
      await m.unlinkGrant(BigInt(offer.id));
    } catch {}
  };

  const linkAgent = async (agentId: string): Promise<void> => {
    if (!/^\d+$/.test(agentId)) return;
    try {
      await m.linkAgent(BigInt(offer.id), BigInt(agentId));
      setAgentSel("");
      setAgentQuery("");
    } catch {}
  };

  const unlinkAgent = async (agentId: string): Promise<void> => {
    if (!/^\d+$/.test(agentId)) return;
    try {
      await m.unlinkAgent(BigInt(offer.id), BigInt(agentId));
    } catch {}
  };

  const selectedGrant = allGrants.find((g) => g.id === grantId);
  const grantMatches = allGrants
    .filter((g) => g.kitId === offer.kitId)
    .filter((g) =>
      `${g.id} ${g.title}`
        .toLowerCase()
        .includes(grantQuery.trim().toLowerCase()),
    )
    .slice(0, 6);
  const grantNeedsFunders = Boolean(selectedGrant && selectedGrant.funders <= 0);
  const hasOpenOrders = orders.some((o) => o.status === "open");

  const linkedAgents = offer.agentIds;
  const kitAgents = allAgents
    .filter((a) => a.kits.includes(offer.kitId))
    .filter((a) => !linkedAgents.includes(a.id));
  const selectedAgent = allAgents.find((a) => a.id === agentSel);
  const agentMatches = kitAgents
    .filter((a) =>
      `${a.id} ${a.name}`
        .toLowerCase()
        .includes(agentQuery.trim().toLowerCase()),
    )
    .slice(0, 6);
  const confirmDays = Math.max(
    1,
    Math.round(Number(offer.confirmWindow || "86400") / 86400),
  );
  const cyberActive = offer.cyberSwagBps > 0 && linkedAgents.length > 0;
  const fabPct = Math.max(
    0,
    100 -
      offer.sliceBps / 100 -
      (offer.grantLinked ? offer.grantBps / 100 : 0) -
      (cyberActive ? offer.cyberSwagBps / 100 : 0),
  );

  const doDelete = async (): Promise<void> => {
    try {
      await m.deleteOffer(BigInt(offer.id), s.dict.common.deleteContentReminder);
      router.push(`/${s.lang}/market`);
    } catch {}
  };

  const downloadContentLink = (): void => {
    const blob = new Blob([offer.contentUri], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `product-${offer.id}-content-link.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Caja className="flex-col flex-1 gap-2 p-4">
      <div className="relative flex flex-col lg:flex-row gap-2">
        <div className="relative flex flex-col flex-1 gap-2">
          <Caja bg="bg" className="flex-col gap-2 p-3">
            <div className="relative flex flex-row items-center gap-2 flex-wrap text-xs text-gray-300">
              <span className="relative flex">{fmt(s.dict.product.labelProduct, { id: offer.id })}</span>
              <span className="relative flex bg-white/10 px-2 py-0.5 text-[10px]">
                {soldOut ? s.dict.product.soldOut : s.dict.product.inStock}
              </span>
              {offer.grantLinked && (
                <span className="relative flex bg-white/10 px-2 py-0.5 text-[10px]">
                  {s.dict.product.fundsGrant}
                </span>
              )}
            </div>
            <span className="relative flex text-sm">{offer.title || "—"}</span>
            <div className="relative flex flex-row flex-wrap gap-x-4 gap-y-1 text-[10px] text-gray-400">
              <Link
                href={`/${s.lang}/kit/${offer.kitId}/${offer.version}`}
                className="relative flex underline cursor-blacksmithHS"
              >
                {fmt(s.dict.product.kitVersion, { kitId: offer.kitId, version: offer.version })}
              </Link>
              {fabHref ? (
                <a
                  href={fabHref}
                  target="_blank"
                  rel="noreferrer"
                  className="relative flex underline cursor-blacksmithHS"
                >
                  {fmt(s.dict.product.fabricator, { address: short(offer.fabricator) })}
                </a>
              ) : (
                <span className="relative flex">
                  {fmt(s.dict.product.fabricator, { address: short(offer.fabricator) })}
                </span>
              )}
              <span className="relative flex">{fmt(s.dict.product.block, { block: offer.createdAtBlock || "—" })}</span>
              <span className="relative flex">{fmt(s.dict.product.time, { time: fmtTime(offer.createdAtTimestamp) })}</span>
              {offer.updatedAtTimestamp &&
                offer.updatedAtTimestamp !== offer.createdAtTimestamp && (
                  <span className="relative flex">
                    {fmt(s.dict.common.updatedTimeLabel, { time: fmtTime(offer.updatedAtTimestamp) })}
                  </span>
                )}
            </div>
            <div className="relative flex flex-row gap-2 items-center">
              <span className={label}>{s.dict.product.tx}</span>
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

          {offer.gallery.length > 0 && (
            <Caja bg="bg" className="flex-col gap-1 p-2">
              <span className={label}>{s.dict.product.gallery}</span>
              <div className="relative flex flex-row flex-wrap gap-2">
                {offer.gallery.map((gi, i) => (
                  <img
                    key={i}
                    src={resolveUri(gi).url}
                    draggable={false}
                    alt={`gallery ${i + 1}`}
                    className="relative flex w-20 h-20 object-cover"
                  />
                ))}
              </div>
            </Caja>
          )}

          {vid.embeddable && (
            <Caja bg="bg" className="flex-col gap-1 p-2">
              <span className={label}>{s.dict.product.video}</span>
              <VideoPlayer src={vid.url} />
            </Caja>
          )}

          {aud.embeddable && (
            <Caja bg="bg" className="flex-col gap-1 p-2">
              <span className={label}>{s.dict.product.audio}</span>
              <audio src={aud.url} controls className="relative flex w-full" />
            </Caja>
          )}

          <Caja bg="bg" className="flex-col gap-1 p-2">
            <span className={label}>{s.dict.product.description}</span>
            <span className="relative flex text-xs leading-relaxed">
              {offer.description || "—"}
            </span>
          </Caja>

          <Caja bg="bg" className="flex-col gap-1 p-2">
            <span className={label}>{s.dict.product.details}</span>
            <div className="relative flex flex-row flex-wrap gap-x-4 gap-y-1 text-xs">
              <span className="relative flex">{fmt(s.dict.product.detailPrice, { price: offer.price })}</span>
              <span className="relative flex text-gray-400">
                {fmt(s.dict.product.detailLeft, { quantity: offer.quantity })}
              </span>
              <span className="relative flex text-gray-400">
                {fmt(s.dict.product.detailConfirmWindow, { days: confirmDays })}
              </span>
            </div>
            <span className={label}>{s.dict.product.breakdownHeading}</span>
            <div className="relative flex flex-row flex-wrap gap-x-4 gap-y-1 text-[10px] text-gray-300">
              <span className="relative flex">
                {fmt(s.dict.product.breakdownTreasury, { pct: (offer.sliceBps / 100).toFixed(1) })}
              </span>
              {offer.grantLinked && (
                <Link
                  href={`/${s.lang}/treeliner-grant/${offer.grantId}`}
                  className="relative flex underline cursor-blacksmithHS"
                >
                  {fmt(s.dict.product.breakdownGrant, { grantId: offer.grantId, pct: (offer.grantBps / 100).toFixed(1) })}
                </Link>
              )}
              {cyberActive && (
                <span className="relative flex">
                  {fmt(s.dict.product.breakdownCyber, { pct: (offer.cyberSwagBps / 100).toFixed(1), count: linkedAgents.length })}
                </span>
              )}
              <span className="relative flex">
                {fmt(s.dict.product.breakdownFabricator, { pct: fabPct.toFixed(1) })}
              </span>
            </div>
          </Caja>

          <Caja bg="bg" className="flex-col gap-2 p-3">
            <span className={label}>{s.dict.product.buy}</span>
            <span className="relative flex text-[10px] text-gray-500 leading-relaxed">
              {s.dict.product.buyEscrowNote}
            </span>
            <div className="relative flex flex-col gap-1">
              <span className="relative flex text-[10px] text-gray-500">
                {fmt(s.dict.product.quantityAvailable, { quantity: offer.quantity })}
              </span>
              <input
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder={s.dict.product.quantityPlaceholder}
                className={inp}
              />
            </div>
            {offer.options.map((o) => (
              <div key={o.label} className="relative flex flex-col gap-1">
                <span className="relative flex text-[10px] text-gray-400">{o.label}</span>
                <div className="relative flex flex-row flex-wrap gap-1">
                  {o.choices.map((c) => (
                    <button
                      key={c}
                      onClick={() =>
                        setOptionVals((v) => ({ ...v, [o.label]: c }))
                      }
                      className={`relative flex bg-[url(/images/bg.png)] bg-cover bg-center px-2 py-1 text-[10px] text-white cursor-blacksmithHS ${
                        optionVals[o.label] === c ? "" : "opacity-50"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <input
              value={ship}
              onChange={(e) => setShip(e.target.value)}
              placeholder={s.dict.product.shippingAddressPlaceholder}
              className={inp}
            />
            <span className="relative flex text-[10px] text-gray-500 leading-relaxed">
              {s.dict.product.shippingEncryptedNote}
            </span>
            <button
              onClick={
                !conn.isConnected
                  ? conn.connect
                  : conn.wrongNetwork
                  ? conn.switchNetwork
                  : buy
              }
              disabled={buyBlocked}
              className={`${btn} w-fit ${buyBlocked ? "opacity-40" : ""}`}
            >
              {!conn.isConnected
                ? s.dict.connection.connectWallet
                : conn.wrongNetwork
                ? s.dict.connection.switchChain
                : soldOut
                ? s.dict.product.soldOut
                : m.isPending
                ? s.dict.product.buying
                : fmt(s.dict.product.buyCta, { price: qtyOk ? offer.price * qtyNum : offer.price })}
            </button>
          </Caja>

          <Caja bg="bg" className="flex-col gap-2 p-3">
            <span className={label}>{fmt(s.dict.product.ordersHeading, { count: orders.length })}</span>
            {orders.length === 0 ? (
              <span className="relative flex text-[10px] text-gray-500">
                {s.dict.product.noOrders}
              </span>
            ) : (
              <div className="relative flex flex-col gap-1">
                {orders.map((o) => (
                  <div
                    key={o.id}
                    className="relative flex flex-row items-center gap-2 text-[10px] text-gray-300 flex-wrap"
                  >
                    <span className="relative flex">#{o.id}</span>
                    <span className="relative flex">{short(o.buyer)}</span>
                    <span className="relative flex">{fmt(s.dict.product.orderQty, { quantity: o.quantity })}</span>
                    <span className="relative flex flex-1 text-gray-500">{fmtTime(o.time)}</span>
                    <span className="relative flex bg-white/10 px-2 py-0.5">
                      {o.status === "completed"
                        ? s.dict.product.statusCompleted
                        : o.status === "refunded"
                        ? s.dict.product.statusRefunded
                        : o.stage === 2
                        ? s.dict.product.stageShipped
                        : o.stage === 1
                        ? s.dict.product.stageMaking
                        : s.dict.product.stagePlaced}
                    </span>
                    {txUrl(o.tx) && (
                      <a
                        href={txUrl(o.tx)}
                        target="_blank"
                        rel="noreferrer"
                        className="relative flex underline cursor-blacksmithHS"
                      >
                        {s.dict.common.viewTx}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Caja>

          {isFabricator && (
            <Caja bg="bg" className="flex-col gap-2 p-3">
              <span className={label}>{s.dict.product.manageFabricator}</span>

              {offer.grantLinked && (
                <div className="relative flex flex-row gap-2 items-center flex-wrap">
                  <Link
                    href={`/${s.lang}/treeliner-grant/${offer.grantId}`}
                    className="relative flex text-xs underline cursor-blacksmithHS"
                  >
                    {fmt(s.dict.product.linkedGrantCurrent, { grantId: offer.grantId, pct: (offer.grantBps / 100).toFixed(1) })}
                  </Link>
                  <button
                    onClick={conn.wrongNetwork ? conn.switchNetwork : unlink}
                    disabled={m.isPending}
                    className={`${btn} w-fit ${m.isPending ? "opacity-40" : ""}`}
                  >
                    {s.dict.product.unlinkGrant}
                  </button>
                </div>
              )}

              <span className="relative flex text-[10px] text-gray-500 leading-relaxed">
                {s.dict.product.linkGrantNote}
              </span>
              <span className="relative flex text-[10px] text-gray-500">
                {fmt(s.dict.product.grantSameKitNote, { kitId: offer.kitId })}
              </span>
              <div className="relative flex flex-col gap-2 items-left justify-left">
                {grantId ? (
                  <div className="relative flex flex-row gap-2 items-center flex-wrap">
                    <span className="relative flex text-xs">
                      {selectedGrant
                        ? fmt(s.dict.product.grantOption, { id: selectedGrant.id, title: selectedGrant.title })
                        : fmt(s.dict.product.grantOption, { id: grantId, title: "—" })}
                    </span>
                    <button
                      onClick={() => {
                        setGrantId("");
                        setGrantQuery("");
                      }}
                      className={`${btn} w-fit`}
                    >
                      {s.dict.common.clear}
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      value={grantQuery}
                      onChange={(e) => setGrantQuery(e.target.value)}
                      placeholder={s.dict.treelinerGrants.searchPlaceholder}
                      className={inp}
                    />
                    {grantQuery.trim() && (
                      <div className="relative flex flex-col bg-[url(/images/bg.png)] bg-cover bg-center">
                        {grantMatches.length ? (
                          grantMatches.map((g) => (
                            <button
                              key={g.id}
                              onClick={() => {
                                setGrantId(g.id);
                                setGrantQuery("");
                              }}
                              className="relative flex text-left px-2 py-1 text-xs cursor-blacksmithHS"
                            >
                              {fmt(s.dict.product.grantOption, { id: g.id, title: g.title })}
                            </button>
                          ))
                        ) : (
                          <span className="relative flex px-2 py-1 text-xs text-gray-500">
                            {s.dict.treelinerGrants.empty}
                          </span>
                        )}
                      </div>
                    )}
                  </>
                )}
                <input
                  value={grantPct}
                  onChange={(e) => setGrantPct(e.target.value)}
                  placeholder={s.dict.product.grantPctPlaceholder}
                  className={inp}
                />
                <button
                  onClick={conn.wrongNetwork ? conn.switchNetwork : link}
                  disabled={
                    m.isPending ||
                    !/^\d+$/.test(grantId) ||
                    !grantPctOk ||
                    grantNeedsFunders
                  }
                  className={`${btn} w-fit ${
                    m.isPending ||
                    !/^\d+$/.test(grantId) ||
                    !grantPctOk ||
                    grantNeedsFunders
                      ? "opacity-40"
                      : ""
                  }`}
                >
                  {offer.grantLinked
                    ? s.dict.product.changeGrant
                    : s.dict.product.linkGrant}
                </button>
                {grantNeedsFunders && (
                  <span className="relative flex text-[10px] text-gray-500 leading-relaxed">
                    {s.dict.product.grantNeedsFunders}
                  </span>
                )}
              </div>

              <span className={label}>
                {fmt(s.dict.product.linkedAgentsHeading, { count: linkedAgents.length })}
              </span>
              <span className="relative flex text-[10px] text-gray-500 leading-relaxed">
                {fmt(s.dict.product.agentsNote, { kitId: offer.kitId, pct: (offer.cyberSwagBps / 100).toFixed(1) })}
              </span>
              {offer.cyberSwagBps === 0 && (
                <span className="relative flex text-[10px] text-gray-500">
                  {s.dict.product.cyberZeroHint}
                </span>
              )}
              {linkedAgents.length === 0 ? (
                <span className="relative flex text-[10px] text-gray-500">
                  {s.dict.product.noLinkedAgents}
                </span>
              ) : (
                <div className="relative flex flex-col gap-1">
                  {linkedAgents.map((aid) => {
                    const info = allAgents.find((a) => a.id === aid);
                    const serves = Boolean(
                      info && info.kits.includes(offer.kitId),
                    );
                    return (
                      <div
                        key={aid}
                        className="relative flex flex-row items-center gap-2 text-[10px] text-gray-300 flex-wrap"
                      >
                        <Link
                          href={`/${s.lang}/cyberswagman-agent/${aid}`}
                          className="relative flex underline cursor-blacksmithHS"
                        >
                          {fmt(s.dict.product.agentOption, { id: aid, name: info?.name || "—" })}
                        </Link>
                        {!serves && (
                          <span className="relative flex text-red-400">
                            {s.dict.product.agentNotServing}
                          </span>
                        )}
                        <span className="relative flex flex-1" />
                        <button
                          onClick={
                            conn.wrongNetwork
                              ? conn.switchNetwork
                              : () => unlinkAgent(aid)
                          }
                          disabled={m.isPending}
                          className={`${btn} ${m.isPending ? "opacity-40" : ""}`}
                        >
                          {s.dict.product.unlinkAgentCta}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="relative flex flex-col gap-2 items-left justify-left">
                {agentSel ? (
                  <div className="relative flex flex-row gap-2 items-center flex-wrap">
                    <span className="relative flex text-xs">
                      {selectedAgent
                        ? fmt(s.dict.product.agentOption, { id: selectedAgent.id, name: selectedAgent.name })
                        : fmt(s.dict.product.agentOption, { id: agentSel, name: "—" })}
                    </span>
                    <button
                      onClick={() => {
                        setAgentSel("");
                        setAgentQuery("");
                      }}
                      className={`${btn} w-fit`}
                    >
                      {s.dict.common.clear}
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      value={agentQuery}
                      onChange={(e) => setAgentQuery(e.target.value)}
                      placeholder={s.dict.product.searchAgentsPlaceholder}
                      className={inp}
                    />
                    {agentQuery.trim() && (
                      <div className="relative flex flex-col bg-[url(/images/bg.png)] bg-cover bg-center">
                        {agentMatches.length ? (
                          agentMatches.map((a) => (
                            <button
                              key={a.id}
                              onClick={() => {
                                setAgentSel(a.id);
                                setAgentQuery("");
                              }}
                              className="relative flex text-left px-2 py-1 text-xs cursor-blacksmithHS"
                            >
                              {fmt(s.dict.product.agentOption, { id: a.id, name: a.name })}
                            </button>
                          ))
                        ) : (
                          <span className="relative flex px-2 py-1 text-xs text-gray-500">
                            {s.dict.product.noKitAgents}
                          </span>
                        )}
                      </div>
                    )}
                  </>
                )}
                <button
                  onClick={
                    conn.wrongNetwork
                      ? conn.switchNetwork
                      : () => linkAgent(agentSel)
                  }
                  disabled={m.isPending || !/^\d+$/.test(agentSel)}
                  className={`${btn} w-fit ${
                    m.isPending || !/^\d+$/.test(agentSel) ? "opacity-40" : ""
                  }`}
                >
                  {s.dict.product.linkAgentCta}
                </button>
              </div>

              <span className="relative flex text-[10px] text-gray-500">
                {s.dict.product.editHint}
              </span>
              <Link
                href={`/${s.lang}/market/${offer.id}/edit`}
                className={`${btn} w-fit`}
              >
                {s.dict.product.editProduct}
              </Link>

              {confirmDel ? (
                <div className="relative flex flex-row gap-2 items-center flex-wrap">
                  <span className="relative flex text-[10px] text-red-400">
                    {s.dict.product.deleteConfirm}
                  </span>
                  <button onClick={downloadContentLink} className={btn}>
                    {s.dict.common.downloadContentLink}
                  </button>
                  <button
                    onClick={conn.wrongNetwork ? conn.switchNetwork : doDelete}
                    disabled={m.isPending}
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
                  disabled={hasOpenOrders}
                  className={`${btn} w-fit ${hasOpenOrders ? "opacity-40" : ""}`}
                >
                  {s.dict.common.delete}
                </button>
              )}
              <span className="relative flex text-[10px] text-gray-500">
                {hasOpenOrders
                  ? s.dict.product.deleteBlockedOrders
                  : s.dict.product.deleteNote}
              </span>
            </Caja>
          )}
        </div>

        <KitComments canonicalTag={commentTag("product", offer.id)} />
      </div>
    </Caja>
  );
};

export default ProductDetailCenter;
