"use client";

import { FunctionComponent, JSX, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Caja from "./Caja";
import VideoPlayer from "./VideoPlayer";
import resolveUri from "../hooks/resolveUri";
import useKitSignal from "../hooks/useKitSignal";
import useKitOwner from "../hooks/useKitOwner";
import useKitRegistry from "../hooks/useKitRegistry";
import useChip from "../hooks/useChip";
import { matchesOwnerTag } from "@/app/lib/zk/identity";
import KitComments from "./KitComments";
import KitGrants from "./KitGrants";
import KitMarket from "./KitMarket";
import KitAgents from "./KitAgents";
import { useShell } from "./Shell";
import { fmt } from "../hooks/fmt";
import { txUrl, addressUrl } from "@/app/lib/chains";
import { commentTag } from "@/app/lib/commentTag";

const label = "relative flex text-[10px] text-gray-400";
const linkBtn =
  "relative flex w-fit bg-[url(/images/cajatexto.png)] bg-[length:100%_100%] bg-no-repeat px-4 py-2 text-xs cursor-blacksmithHS";
const arLink =
  "relative flex w-fit text-xs underline cursor-blacksmithHS text-gray-200";
const statBtn =
  "relative flex flex-row items-center gap-2 cursor-blacksmithHS";
const statImg = "relative flex w-4 h-4";
const statNum = "relative flex text-xs text-gray-300";
const manageBtn =
  "relative flex justify-center bg-[url(/images/cajatexto.png)] bg-[length:100%_100%] bg-center bg-no-repeat px-4 py-2 text-xs cursor-blacksmithHS";
const verBtn =
  "relative flex bg-[url(/images/bg.png)] bg-cover bg-center border border-white/25 rounded-sm px-3 py-1 text-[10px] text-white cursor-blacksmithHS hover:border-white/50";
const tagChip =
  "relative flex bg-[url(/images/bg.png)] bg-cover bg-center border border-white/25 rounded-sm px-2 py-0.5 text-[10px] text-white";

const short = (a?: string): string =>
  a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "—";

const fmtTime = (ts?: string): string => {
  const n = Number(ts);
  if (!ts || !n) return "—";
  return new Date(n * 1000).toISOString().slice(0, 10);
};

const KitCenter: FunctionComponent = (): JSX.Element => {
  const s = useShell();
  const selected = s.selected;
  const onChainId = /^\d+$/.test(s.kitId) ? BigInt(s.kitId) : undefined;
  const signal = useKitSignal(onChainId);
  const { owner, isOwner } = useKitOwner(s.kitId);
  const reg = useKitRegistry();
  const router = useRouter();
  const chip = useChip();
  const isAnonKit = selected?.mode === "anonymous";
  const v0DesignHash =
    selected?.versions?.find((v) => v.version === "0")?.designHash ??
    selected?.designHash;
  const isMyAnonKit = Boolean(
    isAnonKit &&
      chip.connected &&
      selected?.ownerTag &&
      v0DesignHash &&
      matchesOwnerTag(v0DesignHash, selected.ownerTag),
  );
  const canManage = (s.conn.isConnected && isOwner) || isMyAnonKit;
  const anonNeedsChip = isAnonKit && !chip.connected;
  const ZERO_TAG =
    "0x0000000000000000000000000000000000000000000000000000000000000000";
  const kitOwnerTag =
    selected?.ownerTag && selected.ownerTag !== ZERO_TAG
      ? selected.ownerTag
      : undefined;
  const commentCanonical = commentTag("kit", s.kitId);

  const [transferTo, setTransferTo] = useState<string>("");
  const [transferTag, setTransferTag] = useState<string>("");
  const [confirmDel, setConfirmDel] = useState<boolean>(false);
  const [sigMode, setSigMode] = useState<"anonymous" | "public">("anonymous");

  const img = resolveUri(selected?.image);

  const tagRow = (values?: string[]): JSX.Element => (
    <div className="relative flex flex-row flex-wrap gap-1">
      {values && values.length ? (
        values.map((v, i) => (
          <span key={i} className={tagChip}>
            {v}
          </span>
        ))
      ) : (
        <span className="relative flex text-xs">—</span>
      )}
    </div>
  );

  const validAddr = /^0x[0-9a-fA-F]{40}$/.test(transferTo);
  const validTag = /^0x[0-9a-fA-F]{64}$/.test(transferTag);

  const doTransfer = async (): Promise<void> => {
    if (!validAddr) return;
    try {
      await reg.transferKit(transferTo, s.kitId);
      setTransferTo("");
    } catch {}
  };

  const doRetag = async (): Promise<void> => {
    if (!validTag) return;
    try {
      await reg.retagKit(
        s.kitId,
        transferTag,
        selected?.version,
        v0DesignHash,
        selected?.ownerTag,
      );
      setTransferTag("");
    } catch {}
  };

  const doClaim = async (): Promise<void> => {
    if (!validAddr) return;
    try {
      await reg.claimKit(
        s.kitId,
        transferTo,
        selected?.version,
        v0DesignHash,
        selected?.ownerTag,
      );
      setTransferTo("");
    } catch {}
  };

  const doDelete = async (): Promise<void> => {
    try {
      await reg.removeKit(
        s.kitId,
        s.dict.common.deleteContentReminder,
        selected?.mode,
        selected?.version,
        v0DesignHash,
        selected?.ownerTag,
      );
      router.push(`/${s.lang}`);
    } catch {}
  };

  const downloadContentLinks = (): void => {
    const versions =
      selected?.versions && selected.versions.length
        ? selected.versions
        : selected?.contentUri
        ? [{ version: selected.version ?? "0", contentUri: selected.contentUri }]
        : [];
    const lines = versions.map((v) => `v${v.version}: ${v.contentUri}`);
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kit-${s.kitId}-content-links.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const vid = resolveUri(selected?.video);
  const pdf = resolveUri(selected?.pdf);

  const current = s.kitVersion || selected?.version || "0";
  const verList: string[] =
    selected?.versions && selected.versions.length
      ? selected.versions.map((v) => v.version)
      : [current];
  const hasParent = Boolean(selected?.parentId && selected.parentId !== "0");
  const forkCount = s.allItems.filter(
    (k) => Boolean(k.parentId) && k.parentId !== "0" && k.parentId === s.kitId,
  ).length;

  const tx = selected?.transactionHash ?? "";
  const txHref = txUrl(tx);
  const ownerHref = addressUrl(owner);

  const myChoice =
    sigMode === "public" ? signal.myPublicChoice : signal.myAnonChoice;
  const sigBlocked = !signal.canSignal || signal.isPending;

  return (
    <Caja className="flex-col flex-1 gap-2 p-4">
      <div className="relative flex flex-col lg:flex-row gap-2">
      <div className="relative flex flex-col flex-1 gap-2">
      <Caja bg="bg" className="flex-col gap-2 p-3">
        <div className="relative flex flex-row items-center gap-2 flex-wrap text-xs text-gray-300">
          <span className="relative flex">
            {s.ui?.canonical} · #{s.kitId || "—"}
          </span>
          <span className="relative flex bg-white/10 px-2 py-0.5 text-[10px]">
            {selected?.status ?? "—"}
          </span>
        </div>

        <div className="relative flex flex-row items-center gap-2">
          <div className="relative flex w-10 h-10 shrink-0 overflow-hidden bg-black/20">
            <img
              src={img.embeddable ? img.url : "/images/fabrica.png"}
              onError={(e) => {
                e.currentTarget.src = "/images/fabrica.png";
              }}
              draggable={false}
              alt={selected?.title || "kit"}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
          <span className="relative flex text-sm">{selected?.title || "—"}</span>
          {hasParent && (
            <Link
              href={`/${s.lang}/kit/${selected?.parentId}`}
              className="relative flex bg-white/10 px-2 py-0.5 text-[10px] text-gray-300 underline cursor-blacksmithHS"
            >
              {fmt(s.dict.kit.forkOfLabel, { parent: `#${selected?.parentId}` })}
            </Link>
          )}
        </div>

        <div className="relative flex flex-row flex-wrap gap-x-4 gap-y-1 text-[10px] text-gray-400">
          {ownerHref ? (
            <a href={ownerHref} target="_blank" rel="noreferrer" className={arLink}>
              {fmt(s.dict.kit.ownerLabel, { addr: short(owner) })}
            </a>
          ) : (
            <span className="relative flex">{fmt(s.dict.kit.ownerLabel, { addr: short(owner) })}</span>
          )}
          <span className="relative flex">{fmt(s.dict.kit.versionLabel, { version: current })}</span>
          <span className="relative flex">
            {fmt(s.dict.kit.blockLabel, { block: selected?.createdAtBlock ?? "—" })}
          </span>
          <span className="relative flex">
            {fmt(s.dict.kit.timeLabel, { time: fmtTime(selected?.createdAtTimestamp) })}
          </span>
          {selected?.updatedAtTimestamp &&
            selected.updatedAtTimestamp !== selected.createdAtTimestamp && (
              <span className="relative flex">
                {fmt(s.dict.common.updatedTimeLabel, { time: fmtTime(selected.updatedAtTimestamp) })}
              </span>
            )}
          <span className="relative flex">{s.dict.kit.licenseCc0Label}</span>
        </div>

        <div className="relative flex flex-row gap-2 items-center">
          <span className={label}>{s.dict.kit.tx}</span>
          {tx && txHref ? (
            <a href={txHref} target="_blank" rel="noreferrer" className={arLink}>
              {s.dict.common.viewTx}
            </a>
          ) : (
            <span className="relative flex text-[10px] text-gray-500">—</span>
          )}
        </div>
      </Caja>

      <div className="relative flex flex-row flex-wrap items-center gap-5 px-1">
        <button
          title={s.dict.kit.endorse}
          disabled={sigBlocked}
          onClick={() =>
            myChoice === 1 ? signal.retract(sigMode) : signal.signal(1, sigMode)
          }
          className={`${statBtn} ${
            sigBlocked ? "opacity-40" : ""
          } ${myChoice === 1 ? "ring-2 ring-green-400" : ""}`}
        >
          <img
            src="/images/endorse.png"
            alt={s.dict.kit.endorse}
            draggable={false}
            className={statImg}
          />
          <span className={statNum}>{signal.plus}</span>
        </button>
        <button
          title={s.dict.kit.needsWork}
          disabled={sigBlocked}
          onClick={() =>
            myChoice === 0 ? signal.retract(sigMode) : signal.signal(0, sigMode)
          }
          className={`${statBtn} ${
            sigBlocked ? "opacity-40" : ""
          } ${myChoice === 0 ? "ring-2 ring-red-400" : ""}`}
        >
          <img
            src="/images/needswork.png"
            alt={s.dict.kit.needsWork}
            draggable={false}
            className={statImg}
          />
          <span className={statNum}>{signal.minus}</span>
        </button>
        <div className="relative flex flex-row items-center gap-1">
          <button
            onClick={() => setSigMode("anonymous")}
            className={`${tagChip} cursor-blacksmithHS ${
              sigMode === "anonymous" ? "" : "opacity-50"
            }`}
          >
            {s.dict.comments.anonymous}
          </button>
          <button
            onClick={() => setSigMode("public")}
            className={`${tagChip} cursor-blacksmithHS ${
              sigMode === "public" ? "" : "opacity-50"
            }`}
          >
            {s.dict.comments.public}
          </button>
        </div>
        <Link
          title={s.dict.kit.fork}
          href={`/${s.lang}/create?fork=${s.kitId}`}
          className={statBtn}
        >
          <img
            src="/images/fork.png"
            alt={s.dict.kit.fork}
            draggable={false}
            className={statImg}
          />
          <span className={statNum}>{forkCount}</span>
        </Link>
      </div>

      <Caja bg="bg" className="flex-col gap-1 p-2">
        <span className={label}>{s.dict.kit.videoTutorial}</span>
        {vid.embeddable ? (
          <VideoPlayer key={selected?.id} src={vid.url} />
        ) : vid.kind === "arweave" ? (
          <a href={vid.url} target="_blank" rel="noreferrer" className={arLink}>
            {s.dict.kit.openVideoOnArweave}
          </a>
        ) : (
          <span className="relative flex text-xs">—</span>
        )}
      </Caja>

      <Caja bg="bg" className="flex-col gap-1 p-2">
        <span className={label}>{s.dict.home.tags}</span>
        {tagRow(selected?.tags)}
      </Caja>

      <div className="relative flex flex-row gap-2">
        <Caja bg="bg" className="flex-col flex-1 gap-1 p-2">
          <span className={label}>{s.dict.home.hardware}</span>
          {tagRow(selected?.hardware)}
        </Caja>
        <Caja bg="bg" className="flex-col flex-1 gap-1 p-2">
          <span className={label}>{s.dict.home.software}</span>
          {tagRow(selected?.software)}
        </Caja>
      </div>

      <Caja bg="bg" className="flex-col gap-1 p-2">
        <span className={label}>{s.dict.home.fabrication}</span>
        {tagRow(selected?.fabrication)}
      </Caja>

      <Caja bg="bg" className="flex-col gap-1 p-2">
        <span className={label}>{s.dict.home.stage}</span>
        <div className="relative flex flex-row flex-wrap gap-x-3 gap-y-1">
          {s.rungs.map((r, i) => (
            <span
              key={i}
              className={`relative flex text-xs ${
                selected && i < selected.stage ? "text-white" : "text-white/30"
              }`}
            >
              {r}
            </span>
          ))}
        </div>
      </Caja>

      <Caja bg="bg" className="flex-col gap-1 p-2">
        <span className={label}>{s.ui?.description}</span>
        <span className="relative flex text-xs leading-relaxed">
          {selected?.desc || "—"}
        </span>
      </Caja>

      <Caja bg="bg" className="flex-col gap-2 p-2">
        <span className={label}>{s.dict.kit.makerKitPdf}</span>
        {pdf.kind === "invalid" ? (
          <span className="relative flex text-xs">—</span>
        ) : (
          <a
            href={pdf.url}
            target="_blank"
            rel="noreferrer"
            download={pdf.kind !== "arweave"}
            className={linkBtn}
          >
            {pdf.kind === "arweave" ? s.dict.kit.openPdfOnArweave : s.dict.kit.downloadPdf}
          </a>
        )}
      </Caja>

      <Caja bg="bg" className="flex-col gap-2 p-2">
        <span className={label}>{s.dict.kit.versions}</span>
        <div className="relative flex flex-row flex-wrap items-center gap-2">
          {verList.map((v) => (
            <Link
              key={v}
              href={`/${s.lang}/kit/${s.kitId}/${v}`}
              className={`${verBtn} ${v === current ? "bg-white/20" : ""}`}
            >
              v{v}
            </Link>
          ))}
        </div>
      </Caja>

      <Caja bg="bg" className="flex-col gap-2 p-2">
        <span className={label}>
          {s.dict.kit.manage}{" "}
          {canManage
            ? ""
            : anonNeedsChip
            ? s.dict.walkthrough.connectPrompt
            : s.conn.isConnected
            ? s.dict.kit.publisherOnly
            : s.dict.kit.connectAsPublisher}
        </span>
        {canManage && (
          <div className="relative flex flex-col gap-2">
            <Link
              href={`/${s.lang}/kit/${s.kitId}/edit`}
              className={`${manageBtn} w-fit cursor-blacksmithHS`}
            >
              {s.dict.kit.newVersion}
            </Link>

            {isAnonKit ? (
              <div className="relative flex flex-col gap-2">
                <div className="relative flex flex-row gap-2 items-center">
                  <input
                    value={transferTo}
                    onChange={(e) => setTransferTo(e.target.value)}
                    placeholder={s.dict.kit.transferToPlaceholder}
                    className="relative flex flex-1 bg-[url(/images/bg.png)] bg-cover bg-center px-2 py-1 text-[10px] text-white focus:outline-none"
                  />
                  <button
                    onClick={doClaim}
                    disabled={reg.isPending || !validAddr}
                    className={`${manageBtn} ${
                      reg.isPending || !validAddr
                        ? "opacity-40"
                        : "cursor-blacksmithHS"
                    }`}
                  >
                    {s.dict.kit.transfer}
                  </button>
                </div>
                <span className={label}>{s.dict.kit.transferAnonHint}</span>
                <div className="relative flex flex-row gap-2 items-center">
                  <input
                    value={transferTag}
                    onChange={(e) => setTransferTag(e.target.value)}
                    placeholder={s.dict.kit.transferTagPlaceholder}
                    className="relative flex flex-1 bg-[url(/images/bg.png)] bg-cover bg-center px-2 py-1 text-[10px] text-white focus:outline-none"
                  />
                  <button
                    onClick={doRetag}
                    disabled={reg.isPending || !validTag}
                    className={`${manageBtn} ${
                      reg.isPending || !validTag
                        ? "opacity-40"
                        : "cursor-blacksmithHS"
                    }`}
                  >
                    {s.dict.kit.transferAnon}
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative flex flex-row gap-2 items-center">
                <input
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                  placeholder={s.dict.kit.transferToPlaceholder}
                  className="relative flex flex-1 bg-[url(/images/bg.png)] bg-cover bg-center px-2 py-1 text-[10px] text-white focus:outline-none"
                />
                <button
                  onClick={
                    s.conn.wrongNetwork ? s.conn.switchNetwork : doTransfer
                  }
                  disabled={reg.isPending || !validAddr}
                  className={`${manageBtn} ${
                    reg.isPending || !validAddr
                      ? "opacity-40"
                      : "cursor-blacksmithHS"
                  }`}
                >
                  {s.conn.wrongNetwork ? s.dict.connection.switchChain : s.dict.kit.transfer}
                </button>
              </div>
            )}

            {confirmDel ? (
              <div className="relative flex flex-row gap-2 items-center flex-wrap">
                <span className="relative flex text-[10px] text-red-400">
                  {s.dict.kit.deleteThisKit}
                </span>
                <button onClick={downloadContentLinks} className={`${manageBtn} cursor-blacksmithHS`}>
                  {s.dict.kit.downloadContentLinks}
                </button>
                <button
                  onClick={
                    s.conn.wrongNetwork ? s.conn.switchNetwork : doDelete
                  }
                  disabled={reg.isPending}
                  className={`${manageBtn} cursor-blacksmithHS`}
                >
                  {s.conn.wrongNetwork ? s.dict.connection.switchChain : s.dict.common.confirmDelete}
                </button>
                <button
                  onClick={() => setConfirmDel(false)}
                  className={`${manageBtn} cursor-blacksmithHS`}
                >
                  {s.dict.common.cancel}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDel(true)}
                className={`${manageBtn} w-fit cursor-blacksmithHS`}
              >
                {s.dict.common.delete}
              </button>
            )}
          </div>
        )}
      </Caja>
      </div>

      <KitComments
        canonicalTag={commentCanonical}
        kitV0DesignHash={v0DesignHash}
        kitOwnerTag={kitOwnerTag}
      />
      </div>

      <div className="relative flex flex-col lg:flex-row gap-2">
        <KitGrants />
        <KitMarket />
      </div>

      <div className="relative flex flex-col lg:flex-row gap-2">
        <KitAgents />
      </div>
    </Caja>
  );
};

export default KitCenter;
