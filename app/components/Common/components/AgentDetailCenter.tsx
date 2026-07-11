"use client";

import { FunctionComponent, JSX, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { keccak256, stringToHex } from "viem";
import Caja from "./Caja";
import VideoPlayer from "./VideoPlayer";
import { useShell } from "./Shell";
import { fmt } from "../hooks/fmt";
import useAgentDetail from "../hooks/useAgentDetail";
import useAgent from "../hooks/useAgent";
import resolveUri from "../hooks/resolveUri";
import { txUrl } from "@/app/lib/chains";

const arLinkFit =
  "relative flex w-fit text-[10px] underline cursor-blacksmithHS text-gray-200";

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

const chips = (label2: string, list: string[]): JSX.Element | null =>
  list.length === 0 ? null : (
    <div className="relative flex flex-col gap-1">
      <span className={label}>{label2}</span>
      <div className="relative flex flex-row flex-wrap gap-1">
        {list.map((x, i) => (
          <span
            key={i}
            className="relative flex bg-white/10 px-2 py-0.5 text-[10px] text-gray-300"
          >
            {x}
          </span>
        ))}
      </div>
    </div>
  );

const field = (label2: string, value: string): JSX.Element | null =>
  !value ? null : (
    <div className="relative flex flex-col gap-1">
      <span className={label}>{label2}</span>
      <span className="relative flex text-xs leading-relaxed whitespace-pre-wrap">
        {value}
      </span>
    </div>
  );

const AgentDetailCenter: FunctionComponent<{ id: string }> = ({
  id,
}): JSX.Element => {
  const s = useShell();
  const conn = s.conn;
  const { agent } = useAgentDetail(id);
  const reg = useAgent();
  const router = useRouter();

  const [resultTexts, setResultTexts] = useState<Record<string, string>>({});
  const [openResults, setOpenResults] = useState<Record<string, boolean>>({});
  const [confirmDel, setConfirmDel] = useState<boolean>(false);

  if (!agent) {
    return (
      <Caja className="flex-col flex-1 gap-2 p-4">
        <span className="relative flex text-sm text-gray-400">
          {fmt(s.dict.agent.notFound, { id })}
        </span>
      </Caja>
    );
  }

  const vid = resolveUri(agent.video);
  const aud = resolveUri(agent.audio);
  const weights = resolveUri(agent.weights);
  const code = resolveUri(agent.code);
  const tx = agent.transactionHash;
  const txHref = txUrl(tx);
  const isOwner = Boolean(
    conn.isConnected &&
      conn.address &&
      conn.address.toLowerCase() === agent.owner.toLowerCase(),
  );

  const postResult = async (kitId: string): Promise<void> => {
    const uri = (resultTexts[kitId] ?? "").trim();
    if (!/^\d+$/.test(kitId) || !uri) return;
    try {
      await reg.postResult(
        BigInt(agent.id),
        BigInt(kitId),
        keccak256(stringToHex(uri)),
        uri,
      );
      setResultTexts((s) => ({ ...s, [kitId]: "" }));
    } catch {}
  };
  const doDelete = async (): Promise<void> => {
    try {
      await reg.deleteAgent(BigInt(agent.id), s.dict.common.deleteContentReminder);
      router.push(`/${s.lang}/cyberswagman-agents`);
    } catch {}
  };

  const downloadContentLink = (): void => {
    const blob = new Blob([agent.contentUri], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agent-${agent.id}-content-link.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Caja className="flex-col flex-1 gap-2 p-4">
      <Caja bg="bg" className="flex-col gap-2 p-3">
        <div className="relative flex flex-row items-center gap-2 flex-wrap text-xs text-gray-300">
          <span className="relative flex">{fmt(s.dict.agent.agentNumber, { id: agent.id })}</span>
        </div>
        <span className="relative flex text-sm">{agent.name || "—"}</span>
        <div className="relative flex flex-row flex-wrap gap-x-4 gap-y-1 text-[10px] text-gray-400">
          <Link
            href={`/${s.lang}/cyberswagman/${agent.owner}`}
            className="relative flex underline cursor-blacksmithHS"
          >
            {fmt(s.dict.agent.cyberswagmanAddress, { address: short(agent.owner) })}
          </Link>
          <span className="relative flex">{fmt(s.dict.agent.block, { block: agent.createdAtBlock || "—" })}</span>
          <span className="relative flex">{fmt(s.dict.agent.time, { time: fmtTime(agent.createdAtTimestamp) })}</span>
          <span className="relative flex">{s.dict.common.license} · {s.dict.common.cc0}</span>
        </div>
        <div className="relative flex flex-row gap-2 items-center">
          <span className={label}>{s.dict.agent.tx}</span>
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

      {agent.tags.length > 0 && (
        <Caja bg="bg" className="flex-col gap-1 p-2">{chips(s.dict.agent.tags, agent.tags)}</Caja>
      )}

      {vid.embeddable && (
        <Caja bg="bg" className="flex-col gap-1 p-2">
          <span className={label}>{s.dict.agent.video}</span>
          <VideoPlayer src={vid.url} />
        </Caja>
      )}
      {aud.embeddable && (
        <Caja bg="bg" className="flex-col gap-1 p-2">
          <span className={label}>{s.dict.agent.audio}</span>
          <audio src={aud.url} controls className="relative flex w-full" />
        </Caja>
      )}

      <Caja bg="bg" className="flex-col gap-1 p-2">
        <span className={label}>{s.dict.agent.description}</span>
        <span className="relative flex text-xs leading-relaxed">
          {agent.description || "—"}
        </span>
      </Caja>

      <Caja bg="bg" className="flex-col gap-3 p-3">
        <span className="relative flex text-sm">{s.dict.agent.model}</span>
        {field(s.dict.agent.architecture, agent.architecture)}
        {weights.url && (
          <a href={weights.url} target="_blank" rel="noreferrer" className={arLink}>
            {s.dict.agent.weights}
          </a>
        )}
        {code.url && (
          <a href={code.url} target="_blank" rel="noreferrer" className={arLink}>
            {s.dict.agent.codeRepo}
          </a>
        )}
        {chips(s.dict.agent.datasets, agent.datasets)}
        {field(s.dict.agent.training, agent.training)}
        {chips(s.dict.agent.softwareDeps, agent.software)}
        {field(s.dict.agent.reproduce, agent.reproduce)}
        {field(s.dict.agent.ioInterface, agent.io)}
      </Caja>

      <Caja bg="bg" className="flex-col gap-3 p-3">
        <span className="relative flex text-sm">{s.dict.agent.hardware}</span>
        {field(s.dict.agent.hardwareSpec, agent.hwSpec)}
        {chips(s.dict.agent.bom, agent.bom)}
        {field(s.dict.agent.assembly, agent.assembly)}
      </Caja>

      <Caja bg="bg" className="flex-col gap-2 p-3">
        <span className={label}>{fmt(s.dict.agent.kitsServed, { count: agent.kits.length })}</span>
        <span className="relative flex text-[10px] text-gray-500 leading-relaxed">
          {s.dict.agent.cyberRewardsHint}
        </span>
        {agent.kits.length === 0 ? (
          <span className="relative flex text-[10px] text-gray-500">
            {s.dict.agent.noKitsServed}
          </span>
        ) : (
          <div className="relative flex flex-col gap-2">
            {agent.kits.map((k) => {
              const kitResults = agent.results.filter((r) => r.kitId === k);
              const open = openResults[k] ?? false;
              return (
                <Caja key={k} bg="fondocaja" className="flex-col gap-2 p-2">
                  <div className="relative flex flex-row items-center gap-2 flex-wrap">
                    <Link
                      href={`/${s.lang}/kit/${k}`}
                      className="relative flex text-xs text-white underline cursor-blacksmithHS"
                    >
                      {fmt(s.dict.agent.kitNumber, { id: k })}
                    </Link>
                    <span className="relative flex flex-1" />
                  </div>

                  {kitResults.length > 0 ? (
                    <div className="relative flex flex-col gap-1">
                      <button
                        onClick={() =>
                          setOpenResults((st) => ({ ...st, [k]: !open }))
                        }
                        className="relative flex flex-row items-center gap-1 text-[10px] text-gray-300 cursor-blacksmithHS w-fit"
                      >
                        <span className="relative flex">{open ? "▾" : "▸"}</span>
                        <span className="relative flex">
                          {fmt(s.dict.agent.resultsCount, {
                            count: kitResults.length,
                          })}
                        </span>
                      </button>
                      {open && (
                        <div className="relative flex flex-col gap-1 pl-3">
                          {kitResults.map((result, i) => (
                            <div
                              key={`${result.tx}-${i}`}
                              className="relative flex flex-row items-center gap-2 text-[10px] text-gray-300 flex-wrap"
                            >
                              <span className="relative flex text-gray-500">
                                {fmt(s.dict.agent.resultIndex, { index: i + 1 })}
                              </span>
                              {resolveUri(result.contentUri).url ? (
                                <a
                                  href={resolveUri(result.contentUri).url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={arLinkFit}
                                >
                                  {s.dict.agent.viewResult}
                                </a>
                              ) : (
                                <span className="relative flex text-gray-500">
                                  {short(result.resultHash)}
                                </span>
                              )}
                              <span className="relative flex flex-1" />
                              {txUrl(result.tx) && (
                                <a
                                  href={txUrl(result.tx)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="relative flex underline cursor-blacksmithHS"
                                >
                                  {s.dict.agent.tx}
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="relative flex text-[10px] text-gray-500">
                      {s.dict.agent.noResultYet}
                    </span>
                  )}

                  {isOwner && (
                    <div className="relative flex flex-col gap-1">
                      <span className="relative flex text-[10px] text-gray-500 leading-relaxed">
                        {s.dict.agent.resultUriHint}
                      </span>
                      <input
                        value={resultTexts[k] ?? ""}
                        onChange={(e) =>
                          setResultTexts((st) => ({ ...st, [k]: e.target.value }))
                        }
                        placeholder={s.dict.agent.resultUriPlaceholder}
                        className={inp}
                      />
                      <button
                        onClick={
                          conn.wrongNetwork
                            ? conn.switchNetwork
                            : () => postResult(k)
                        }
                        disabled={
                          reg.isPending || !(resultTexts[k] ?? "").trim()
                        }
                        className={`${btn} w-fit`}
                      >
                        {s.dict.agent.postResult}
                      </button>
                    </div>
                  )}
                </Caja>
              );
            })}
          </div>
        )}
      </Caja>

      {isOwner && (
        <Caja bg="bg" className="flex-col gap-3 p-3">
          <span className={label}>{s.dict.agent.manageCyberswagman}</span>

          <Link
            href={`/${s.lang}/cyberswagman-agent/${agent.id}/edit`}
            className={`${btn} w-fit`}
          >
            {s.dict.agent.editAgent}
          </Link>

          {confirmDel ? (
            <div className="relative flex flex-row gap-2 items-center flex-wrap">
              <span className="relative flex text-[10px] text-red-400">
                {s.dict.agent.deleteConfirmQuestion}
              </span>
              <button onClick={downloadContentLink} className={btn}>
                {s.dict.common.downloadContentLink}
              </button>
              <button
                onClick={conn.wrongNetwork ? conn.switchNetwork : doDelete}
                disabled={reg.isPending}
                className={btn}
              >
                {s.dict.common.confirmDelete}
              </button>
              <button onClick={() => setConfirmDel(false)} className={btn}>
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
    </Caja>
  );
};

export default AgentDetailCenter;
