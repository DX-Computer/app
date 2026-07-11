"use client";

import { CSSProperties, FunctionComponent, JSX, useState } from "react";
import Marco from "./Marco";
import Caja from "./Caja";
import { useShell } from "./Shell";
import { fmt } from "../hooks/fmt";
import useComments, { CommentRow } from "../hooks/useComments";
import { matchesOwnerTag } from "@/app/lib/zk/identity";
import useContent from "../hooks/useContent";
import useWalkthrough from "../hooks/useWalkthrough";
import useChip from "../hooks/useChip";
import { anonReady } from "@/app/lib/zk/anonSigner";
import useIdentity from "../hooks/useIdentity";
import { txUrl } from "@/app/lib/chains";

type Hash = `0x${string}`;

const fondo: CSSProperties = {
  backgroundImage: "url('/images/bg.png')",
  backgroundSize: "cover",
  backgroundPosition: "center",
};

const label = "relative flex text-[10px] text-gray-400";
const navBtn =
  "relative flex justify-center bg-[url(/images/cajatexto.png)] bg-[length:100%_100%] bg-center bg-no-repeat px-4 py-2 text-xs cursor-blacksmithHS";
const miniBtn =
  "relative flex justify-center bg-[url(/images/cajatexto.png)] bg-[length:100%_100%] bg-center bg-no-repeat px-2 py-1 text-[9px] cursor-blacksmithHS";
const ghostBtn =
  "relative flex bg-[url(/images/bg.png)] bg-cover bg-center px-3 py-2 text-xs text-white cursor-blacksmithHS";
const chip = (active: boolean): string =>
  `relative flex bg-[url(/images/bg.png)] bg-cover bg-center px-3 py-1 text-[10px] text-white cursor-blacksmithHS ${
    active ? "" : "opacity-50"
  }`;
const fieldBg = "bg-[url(/images/fondocaja.png)] bg-cover bg-center";

const short = (a?: string): string =>
  a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "anonymous";

const ZERO_TAG =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

const KitComments: FunctionComponent<{
  canonicalTag: string;
  kitV0DesignHash?: string;
  kitOwnerTag?: string;
}> = ({ canonicalTag, kitV0DesignHash, kitOwnerTag }): JSX.Element => {
  const s = useShell();
  const conn = s.conn;
  const { comments, refetch } = useComments(canonicalTag);
  const content = useContent();
  const { openWalkthrough } = useWalkthrough();
  const signer = useChip();
  const id = useIdentity(signer.commitment);

  const canModerate = Boolean(
    signer.connected &&
      kitOwnerTag &&
      kitV0DesignHash &&
      matchesOwnerTag(kitV0DesignHash, kitOwnerTag),
  );

  const [open, setOpen] = useState<boolean>(false);
  const [text, setText] = useState<string>("");
  const [anon, setAnon] = useState<boolean>(false);
  const [uri, setUri] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [confirmDelId, setConfirmDelId] = useState<string>("");

  const json = JSON.stringify({ text: text.trim() }, null, 2);
  const copy = (): void => {
    navigator.clipboard.writeText(json);
    setCopied(true);
  };

  const close = (): void => {
    setOpen(false);
    setText("");
    setUri("");
    setCopied(false);
    setAnon(false);
  };

  const publish = async (): Promise<void> => {
    if (!text.trim() || !uri.trim()) return;
    if (anon && !id.enrolled) {
      setOpen(false);
      openWalkthrough();
      return;
    }
    const modTag = (kitOwnerTag ?? ZERO_TAG) as Hash;
    try {
      if (anon) {
        await content.post(text.trim(), canonicalTag as Hash, modTag, uri.trim());
      } else {
        await content.postPublic(
          text.trim(),
          canonicalTag as Hash,
          modTag,
          uri.trim(),
        );
      }
      refetch();
      close();
    } catch {}
  };

  const anonMode = anon && anonReady();
  const blocked =
    (anonMode || (conn.isConnected && !conn.wrongNetwork)) &&
    (!text.trim() || !uri.trim() || content.isPending);

  const mine = (c: CommentRow): boolean => {
    if (c.anonymous) {
      return Boolean(
        signer.connected &&
          c.ownerTag &&
          c.contentHash &&
          matchesOwnerTag(c.contentHash, c.ownerTag),
      );
    }
    return Boolean(
      conn.isConnected &&
        conn.address &&
        c.author.toLowerCase() === conn.address.toLowerCase(),
    );
  };

  const canDelete = (c: CommentRow): boolean => mine(c) || canModerate;

  const del = async (c: CommentRow): Promise<void> => {
    try {
      if (mine(c)) {
        if (c.anonymous) {
          await content.remove(
            c.id,
            c.contentHash,
            c.ownerTag,
            s.dict.common.deleteContentReminder,
          );
        } else {
          await content.removePublic(c.id, s.dict.common.deleteContentReminder);
        }
      } else if (canModerate && kitV0DesignHash && kitOwnerTag) {
        await content.moderate(
          c.id,
          kitV0DesignHash,
          kitOwnerTag,
          s.dict.common.deleteContentReminder,
        );
      }
      setConfirmDelId("");
      refetch();
    } catch {}
  };

  const downloadContentLink = (contentUri: string, cid: string): void => {
    const blob = new Blob([contentUri], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `comment-${cid}-content-link.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Caja
      bg="bg"
      className="flex-col w-full lg:w-72 shrink-0 gap-2 p-2 lg:min-h-0"
    >
      <div className="relative flex flex-row items-center gap-2">
        <span className="relative flex flex-1 text-xs text-gray-300">
          {fmt(s.dict.comments.countLabel, { count: comments.length })}
        </span>
        <button onClick={() => setOpen(true)} className={navBtn}>
          {s.dict.comments.comment}
        </button>
      </div>

      <div className="relative flex flex-col gap-2 lg:min-h-0 lg:overflow-y-auto">
        {comments.length ? (
          comments.map((c) => (
            <Caja key={c.id} bg="fondocaja" className="flex-col gap-1 p-2">
              <div
                className={`relative flex ${
                  canDelete(c) && confirmDelId === c.id ? "flex-col" : "flex-row"
                } items-center justify-between gap-2`}
              >
                {txUrl(c.tx) ? (
                  <a
                    href={txUrl(c.tx)}
                    target="_blank"
                    rel="noreferrer"
                    title={s.dict.common.viewTx}
                    className={`relative flex px-2 py-0.5 text-[10px] underline cursor-blacksmithHS ${
                      c.anonymous ? "bg-white/10 text-gray-300" : "bg-white/20"
                    }`}
                  >
                    {c.anonymous
                      ? s.dict.comments.anonymousAuthor
                      : short(c.author)}
                  </a>
                ) : (
                  <span
                    className={`relative flex px-2 py-0.5 text-[10px] ${
                      c.anonymous ? "bg-white/10 text-gray-300" : "bg-white/20"
                    }`}
                  >
                    {c.anonymous
                      ? s.dict.comments.anonymousAuthor
                      : short(c.author)}
                  </span>
                )}
                {canDelete(c) &&
                  (confirmDelId === c.id ? (
                    <div className="relative flex flex-row items-center gap-1 ml-auto flex-wrap justify-center w-full">
                      <button
                        onClick={() => downloadContentLink(c.contentUri, c.id)}
                        className={miniBtn}
                      >
                        {s.dict.common.downloadContentLink}
                      </button>
                      <button
                        onClick={() => del(c)}
                        disabled={content.isPending}
                        className={`${miniBtn} ${
                          content.isPending ? "opacity-40" : ""
                        }`}
                      >
                        {s.dict.common.confirmDelete}
                      </button>
                      <button
                        onClick={() => setConfirmDelId("")}
                        className={miniBtn}
                      >
                        {s.dict.common.cancel}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelId(c.id)}
                      className={`${miniBtn} ml-auto`}
                    >
                      {s.dict.common.delete}
                    </button>
                  ))}
              </div>
              <span
                className={`relative flex text-xs leading-relaxed ${
                  c.unavailable ? "text-gray-500 italic" : ""
                }`}
              >
                {c.unavailable ? s.dict.comments.contentUnavailable : c.text}
              </span>
            </Caja>
          ))
        ) : (
          <span className={label}>{s.dict.comments.noCommentsYet}</span>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="relative flex flex-col w-full max-w-md max-h-[85vh]">
            <Marco className="flex-col">
              <div
                className="relative flex flex-col gap-3 p-5 text-white lg:min-h-0 lg:overflow-y-auto"
                style={fondo}
              >
                <div className="relative flex flex-row items-center gap-2">
                  <span className="relative flex flex-1 text-sm">
                    {s.dict.comments.newComment}
                  </span>
                  <button
                    onClick={close}
                    aria-label={s.dict.common.close}
                    className="relative flex text-gray-300 cursor-blacksmithHS"
                  >
                    ✕
                  </button>
                </div>

                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={4}
                  placeholder={s.dict.comments.writeCommentPlaceholder}
                  className={`relative flex w-full ${fieldBg} px-2 py-1 text-xs text-white focus:outline-none resize-none`}
                />

                <div className="relative flex flex-col gap-1">
                  <span className={label}>{s.dict.comments.publishAs}</span>
                  <div className="relative flex flex-row flex-wrap gap-1">
                    <button
                      onClick={() => setAnon(false)}
                      className={chip(!anon)}
                    >
                      {s.dict.comments.public}
                    </button>
                    <button
                      onClick={() => setAnon(true)}
                      className={chip(anon)}
                    >
                      {s.dict.comments.anonymous}
                    </button>
                  </div>
                </div>

                <div className="relative flex flex-col gap-1">
                  <span className={label}>
                    {s.dict.comments.hostContentHint}
                  </span>
                  <textarea
                    readOnly
                    value={json}
                    rows={3}
                    className={`relative flex w-full ${fieldBg} px-2 py-1 text-[10px] text-white focus:outline-none resize-none`}
                  />
                  <button onClick={copy} className={`${navBtn} mb-3 w-fit`}>
                    {copied ? s.dict.common.copied : s.dict.common.copy}
                  </button>
                  <input
                    value={uri}
                    onChange={(e) => setUri(e.target.value)}
                    placeholder={s.dict.comments.uriPlaceholder}
                    className={`relative flex w-full ${fieldBg} px-2 py-1 text-xs text-white focus:outline-none`}
                  />
                </div>

                <div className="relative flex flex-row items-center gap-2 flex-wrap">
                  <button
                    onClick={
                      anonMode
                        ? publish
                        : !conn.isConnected
                          ? conn.connect
                          : conn.wrongNetwork
                            ? conn.switchNetwork
                            : publish
                    }
                    disabled={blocked}
                    className={`${navBtn} ${blocked ? "opacity-40" : ""}`}
                  >
                    {anonMode
                      ? content.isPending
                        ? s.dict.comments.posting
                        : s.dict.comments.post
                      : !conn.isConnected
                        ? s.dict.connection.connectWallet
                        : conn.wrongNetwork
                          ? s.dict.connection.switchChain
                          : content.isPending
                            ? s.dict.comments.posting
                            : s.dict.comments.post}
                  </button>
                  <button onClick={close} className={ghostBtn}>
                    {s.dict.common.cancel}
                  </button>
                </div>
              </div>
            </Marco>
          </div>
        </div>
      )}
    </Caja>
  );
};

export default KitComments;
