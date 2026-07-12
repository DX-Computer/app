"use client";

import { FunctionComponent, JSX, useState } from "react";
import { useRouter } from "next/navigation";
import Caja from "./Caja";
import { useShell } from "./Shell";
import useCouncil from "../hooks/useCouncil";
import useWalkthrough from "../hooks/useWalkthrough";
import useChip from "../hooks/useChip";
import useIdentity from "../hooks/useIdentity";
import { anonReady } from "@/app/lib/zk/anonSigner";

type Address = `0x${string}`;

const fieldBg = "bg-[url(/images/bg.png)] bg-cover bg-center";
const inp = `relative w-full ${fieldBg} px-2 py-1 text-sm text-white focus:outline-none`;
const tag = "relative flex text-xs text-gray-400";
const mini = `relative flex ${fieldBg} px-2 py-1 text-xs text-white cursor-blacksmithHS`;
const chip = (active: boolean): string =>
  `relative flex ${fieldBg} px-2 py-1 text-[11px] text-white cursor-blacksmithHS ${
    active ? "" : "opacity-60"
  }`;
const cajaBtn =
  "relative flex justify-center bg-[url(/images/cajatexto.png)] bg-[length:100%_100%] bg-center bg-no-repeat px-5 py-3 text-sm cursor-blacksmithHS";
const ghostBtn = `relative flex ${fieldBg} px-2 py-1 text-xs text-white cursor-blacksmithHS`;

const isAddr = (v: string): boolean => /^0x[0-9a-fA-F]{40}$/.test(v.trim());
const isUint = (v: string): boolean => /^\d+$/.test(v.trim());

const CreateProposalCenter: FunctionComponent = (): JSX.Element => {
  const s = useShell();
  const d = s.dict.createProposal;
  const KINDS = [
    { key: "ban", label: d.kindBan },
    { key: "quorum", label: d.kindQuorum },
    { key: "window", label: d.kindWindow },
    { key: "bucket", label: d.kindBucket },
  ];
  const BUCKETS = ["0.01", "0.1", "0.25", "0.5", "0.75", "1", "5", "7", "10"];
  const conn = s.conn;
  const c = useCouncil();
  const router = useRouter();
  const { openWalkthrough } = useWalkthrough();
  const signer = useChip();
  const id = useIdentity(signer.commitment);

  const [step, setStep] = useState<"form" | "json" | "uri">("form");
  const [uri, setUri] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  const [kind, setKind] = useState<string>("ban");
  const [value, setValue] = useState<string>("");
  const [windowMin, setWindowMin] = useState<string>("");
  const [banned, setBanned] = useState<boolean>(true);
  const [actor, setActor] = useState<string>("");
  const [bucket, setBucket] = useState<number>(0);
  const [mode, setMode] = useState<"public" | "anonymous">("public");

  const [title, setTitle] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [links, setLinks] = useState<string[]>([]);
  const [linkInput, setLinkInput] = useState<string>("");


  const json = JSON.stringify({ mode, title, reason, links }, null, 2);

  const addLink = (): void => {
    let v = linkInput.trim();
    if (!v) return;
    if (!/^(https?|ipfs|ar):\/\//i.test(v)) v = `https://${v}`;
    setLinks((prev) => [...prev, v]);
    setLinkInput("");
  };

  const paramsOk = (): boolean => {
    if (kind === "quorum") return isUint(value);
    if (kind === "ban") return isAddr(actor);
    if (kind === "window") return isUint(windowMin) && Number(windowMin) >= 1;
    if (kind === "bucket") return bucket >= 0 && bucket < BUCKETS.length;
    return false;
  };

  const canPackage = paramsOk() && title.trim() !== "" && reason.trim() !== "";

  const propose = async (): Promise<void> => {
    const anon = mode === "anonymous";
    if (anon && !id.enrolled) {
      openWalkthrough();
      return;
    }
    try {
      if (kind === "quorum") {
        await c.proposeQuorum(BigInt(value), uri, anon);
      } else if (kind === "ban") {
        await c.proposeBan(actor.trim() as Address, banned, uri, anon);
      } else if (kind === "window") {
        await c.proposeWindow(BigInt(windowMin) * 60n, uri, anon);
      } else if (kind === "bucket") {
        await c.proposeBucket(bucket, uri, anon);
      }
      router.push(`/${s.lang}/govern`);
    } catch {}
  };

  const anonMode = mode === "anonymous" && anonReady();
  const blocked =
    (anonMode || (conn.isConnected && !conn.wrongNetwork)) &&
    (!uri.trim() || c.isPending);

  return (
    <Caja className="flex-col flex-1 p-4 gap-4 md:min-h-0 md:overflow-y-auto">
      {step === "form" && (
        <>
          <span className="relative flex text-sm">{d.newProposal}</span>

          <div className="relative flex flex-col gap-1">
            <span className={tag}>{d.type}</span>
            <div className="relative flex flex-row flex-wrap gap-1">
              {KINDS.map((k) => (
                <button
                  key={k.key}
                  onClick={() => setKind(k.key)}
                  className={chip(kind === k.key)}
                >
                  {k.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex flex-col gap-1">
            <span className={tag}>{d.submitLabel}</span>
            <div className="relative flex flex-row gap-1">
              <button
                onClick={() => setMode("public")}
                className={chip(mode === "public")}
              >
                {d.submitPublic}
              </button>
              <button
                onClick={() => setMode("anonymous")}
                className={chip(mode === "anonymous")}
              >
                {d.submitAnon}
              </button>
            </div>
            <span className="relative flex text-[10px] text-gray-500 leading-relaxed">
              {d.submitHint}
            </span>
          </div>

          {kind === "quorum" && (
            <div className="relative flex flex-col gap-1">
              <span className={tag}>{d.newQuorumVotes}</span>
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={d.zeroPlaceholder}
                className={inp}
              />
            </div>
          )}

          {kind === "window" && (
            <div className="relative flex flex-col gap-1">
              <span className={tag}>{d.newWindowMinutes}</span>
              <input
                value={windowMin}
                onChange={(e) => setWindowMin(e.target.value)}
                placeholder={d.windowPlaceholder}
                className={inp}
              />
              <span className="relative flex text-[10px] text-gray-500 leading-relaxed">
                {d.windowNote}
              </span>
            </div>
          )}

          {kind === "bucket" && (
            <div className="relative flex flex-col gap-1">
              <span className={tag}>{d.newBucket}</span>
              <select
                value={bucket}
                onChange={(e) => setBucket(Number(e.target.value))}
                className={inp}
              >
                {BUCKETS.map((b, i) => (
                  <option key={i} value={i}>
                    {i} · {b} MONA
                  </option>
                ))}
              </select>
              <span className="relative flex text-[10px] text-gray-500 leading-relaxed">
                {d.bucketNote}
              </span>
            </div>
          )}

          {kind === "ban" && (
            <>
              <div className="relative flex flex-col gap-1">
                <span className={tag}>{d.walletAddress}</span>
                <input
                  value={actor}
                  onChange={(e) => setActor(e.target.value)}
                  placeholder={d.addressPlaceholder}
                  className={inp}
                />
                <span className="relative flex text-[10px] text-gray-500 leading-relaxed">
                  {d.walletBanNote}
                </span>
              </div>
              <div className="relative flex flex-col gap-1">
                <span className={tag}>{d.action}</span>
                <div className="relative flex flex-row gap-1">
                  <button onClick={() => setBanned(true)} className={chip(banned)}>
                    {d.actionBlock}
                  </button>
                  <button
                    onClick={() => setBanned(false)}
                    className={chip(!banned)}
                  >
                    {d.actionUnblock}
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="relative flex flex-col gap-1">
            <span className={tag}>{d.title}</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={d.titlePlaceholder}
              className={inp}
            />
          </div>

          <div className="relative flex flex-col gap-1">
            <span className={tag}>{d.reason}</span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder={d.reasonPlaceholder}
              className={`${inp} resize-none`}
            />
          </div>

          <div className="relative flex flex-col gap-1">
            <span className={tag}>{d.evidenceLinksOptional}</span>
            <div className="relative flex flex-row gap-2 items-center">
              <input
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addLink();
                  }
                }}
                placeholder={d.evidenceLinkPlaceholder}
                className={`${inp} flex-1`}
              />
              <button onClick={addLink} className={mini}>
                {s.dict.common.add}
              </button>
            </div>
            {links.length > 0 && (
              <div className="relative flex flex-row flex-wrap gap-1">
                {links.map((l, i) => (
                  <span
                    key={i}
                    className={`relative inline-flex flex-row items-center gap-1 ${fieldBg} px-2 py-0.5 text-xs`}
                  >
                    {l}
                    <button
                      onClick={() => setLinks((prev) => prev.filter((_, j) => j !== i))}
                      aria-label={s.dict.common.remove}
                      className="relative flex text-gray-400"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="relative flex flex-row gap-2 items-center flex-wrap">
            <button
              onClick={() => {
                setCopied(false);
                setStep("json");
              }}
              disabled={!canPackage}
              className={`${cajaBtn} ${canPackage ? "" : "opacity-40 text-gray-400"}`}
            >
              {d.packageContent}
            </button>
          </div>
        </>
      )}

      {step === "json" && (
        <div className="relative flex flex-col gap-3 text-white">
          <span className="relative flex text-sm">{d.packageContent}</span>
          <span className="relative flex text-xs text-gray-400 leading-relaxed">
            {d.packageContentHint}
          </span>
          <textarea
            readOnly
            value={json}
            rows={10}
            className={`relative flex w-full ${fieldBg} px-2 py-1 text-[10px] text-white focus:outline-none resize-none`}
          />
          <div className="relative flex flex-row gap-2 items-center flex-wrap">
            <button
              onClick={() => {
                navigator.clipboard.writeText(json);
                setCopied(true);
              }}
              className={cajaBtn}
            >
              {copied ? s.dict.common.copied : s.dict.common.copy}
            </button>
            <button onClick={() => setStep("uri")} className={cajaBtn}>
              {d.setUri}
            </button>
            <button onClick={() => setStep("form")} className={ghostBtn}>
              {s.dict.common.back}
            </button>
          </div>
        </div>
      )}

      {step === "uri" && (
        <div className="relative flex flex-col gap-3 text-white">
          <span className="relative flex text-sm">{d.contentUri}</span>
          <span className="relative flex text-xs text-gray-400 leading-relaxed">
            {d.contentUriHint}
          </span>
          <input
            value={uri}
            onChange={(e) => setUri(e.target.value)}
            placeholder={d.contentUriPlaceholder}
            className={inp}
          />
          <div className="relative flex flex-row gap-2 items-center flex-wrap">
            <button
              onClick={
                anonMode
                  ? propose
                  : !conn.isConnected
                  ? conn.connect
                  : conn.wrongNetwork
                  ? conn.switchNetwork
                  : propose
              }
              disabled={blocked}
              className={`${cajaBtn} ${blocked ? "opacity-40" : ""}`}
            >
              {anonMode
                ? c.isPending
                  ? d.proposing
                  : d.propose
                : !conn.isConnected
                ? s.dict.connection.connectWallet
                : conn.wrongNetwork
                ? s.dict.connection.switchChain
                : c.isPending
                ? d.proposing
                : d.propose}
            </button>
            <button onClick={() => setStep("json")} className={ghostBtn}>
              {s.dict.common.back}
            </button>
          </div>
        </div>
      )}
    </Caja>
  );
};

export default CreateProposalCenter;
