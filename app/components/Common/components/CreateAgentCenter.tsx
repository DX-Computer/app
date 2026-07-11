"use client";

import { FunctionComponent, JSX, useState } from "react";
import { useRouter } from "next/navigation";
import { useShell } from "./Shell";
import { AgentDraft } from "../types/common.types";
import useAgent from "../hooks/useAgent";
import useAgentDetail from "../hooks/useAgentDetail";
import CreateAgent from "./CreateAgent";
import Caja from "./Caja";

const fieldBg = "bg-[url(/images/bg.png)] bg-cover bg-center";
const cajaBtn =
  "relative flex justify-center bg-[url(/images/cajatexto.png)] bg-[length:100%_100%] bg-center bg-no-repeat px-5 py-3 text-sm cursor-blacksmithHS";
const ghostBtn = `relative flex ${fieldBg} px-2 py-1 text-xs text-white cursor-blacksmithHS`;

const CreateAgentCenter: FunctionComponent<{ editOf?: string }> = ({
  editOf,
}): JSX.Element => {
  const s = useShell();
  const conn = s.conn;
  const agent = useAgent();
  const { agent: current } = useAgentDetail(editOf ?? "");
  const router = useRouter();

  const [step, setStep] = useState<"form" | "json" | "uri">("form");
  const [draft, setDraft] = useState<AgentDraft | null>(null);
  const [uri, setUri] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  const json = draft
    ? JSON.stringify(
        {
          name: draft.name,
          description: draft.description,
          image: draft.image,
          video: draft.video,
          audio: draft.audio,
          tags: draft.tags,
          links: draft.links,
          architecture: draft.architecture,
          weights: draft.weights,
          code: draft.code,
          datasets: draft.datasets,
          training: draft.training,
          software: draft.software,
          reproduce: draft.reproduce,
          io: draft.io,
          license: draft.license,
          hwSpec: draft.hwSpec,
          bom: draft.bom,
          assembly: draft.assembly,
        },
        null,
        2,
      )
    : "";

  const copy = (): void => {
    navigator.clipboard.writeText(json);
    setCopied(true);
  };

  const publish = async (): Promise<void> => {
    if (!draft) return;
    try {
      const kitIds = draft.kits
        .filter((k) => /^\d+$/.test(k))
        .map((k) => BigInt(k));
      if (editOf) {
        const before = new Set(current?.kits ?? []);
        const after = new Set(draft.kits);
        const addKits = draft.kits
          .filter((k) => /^\d+$/.test(k) && !before.has(k))
          .map((k) => BigInt(k));
        const removeKits = (current?.kits ?? [])
          .filter((k) => /^\d+$/.test(k) && !after.has(k))
          .map((k) => BigInt(k));
        await agent.updateAgentKit(BigInt(editOf), draft, uri, addKits, removeKits);
        router.push(`/${s.lang}/cyberswagman-agent/${editOf}`);
      } else {
        await agent.registerAgentKit(draft, uri, kitIds);
        router.push(`/${s.lang}/cyberswagman-agents`);
      }
    } catch {}
  };

  const blocked =
    conn.isConnected && !conn.wrongNetwork && (!uri.trim() || agent.isPending);

  if (editOf && !current) {
    return (
      <Caja className="flex-col flex-1 items-center justify-center p-4">
        <span className="relative flex text-xs text-gray-400">
          {s.dict.createKit.loadingCurrentContent}
        </span>
      </Caja>
    );
  }

  const initial: Partial<AgentDraft> | undefined =
    editOf && current
      ? {
          name: current.name,
          description: current.description,
          image: current.image,
          video: current.video,
          audio: current.audio,
          tags: current.tags,
          links: [],
          architecture: current.architecture,
          weights: current.weights,
          code: current.code,
          datasets: current.datasets,
          training: current.training,
          software: current.software,
          reproduce: current.reproduce,
          io: current.io,
          hwSpec: current.hwSpec,
          bom: current.bom,
          assembly: current.assembly,
          kits: current.kits,
        }
      : undefined;

  return (
    <Caja className="flex-col flex-1 p-2">
      {editOf && (
        <button
          onClick={() =>
            router.push(`/${s.lang}/cyberswagman-agent/${editOf}`)
          }
          className={`${ghostBtn} w-fit mb-2`}
        >
          {`← ${s.dict.common.back}`}
        </button>
      )}
      <div
        className={
          step === "form" ? "relative flex flex-col flex-1" : "hidden"
        }
      >
        <CreateAgent
          onCreate={(d) => {
            setDraft(d);
            setCopied(false);
            setStep("json");
          }}
          initial={initial}
        />
      </div>

      {step === "json" && (
        <div className="relative flex flex-col gap-3 p-4 text-white">
          <span className="relative flex text-sm">{s.dict.createAgent.packageContent}</span>
          <span className="relative flex text-xs text-gray-400 leading-relaxed">
            {s.dict.createAgent.packageContentHint}
          </span>
          <textarea
            readOnly
            value={json}
            rows={10}
            className={`relative flex w-full ${fieldBg} px-2 py-1 text-[10px] text-white focus:outline-none resize-none`}
          />
          <div className="relative flex flex-row gap-2 items-center flex-wrap">
            <button onClick={copy} className={cajaBtn}>
              {copied ? s.dict.common.copied : s.dict.common.copy}
            </button>
            <button onClick={() => setStep("uri")} className={cajaBtn}>
              {s.dict.createAgent.setUri}
            </button>
            <button onClick={() => setStep("form")} className={ghostBtn}>
              {s.dict.common.back}
            </button>
          </div>
        </div>
      )}

      {step === "uri" && (
        <div className="relative flex flex-col gap-3 p-4 text-white">
          <span className="relative flex text-sm">{s.dict.createAgent.contentUri}</span>
          <span className="relative flex text-xs text-gray-400 leading-relaxed">
            {s.dict.createAgent.contentUriHint}
          </span>
          <input
            value={uri}
            onChange={(e) => setUri(e.target.value)}
            placeholder={s.dict.createAgent.contentUriPlaceholder}
            className={`relative flex w-full ${fieldBg} px-2 py-1 text-xs text-white focus:outline-none`}
          />
          <div className="relative flex flex-row gap-2 items-center flex-wrap">
            <button
              onClick={
                !conn.isConnected
                  ? conn.connect
                  : conn.wrongNetwork
                  ? conn.switchNetwork
                  : publish
              }
              disabled={blocked}
              className={`${cajaBtn} ${blocked ? "opacity-40" : ""}`}
            >
              {!conn.isConnected
                ? s.dict.connection.connectWallet
                : conn.wrongNetwork
                ? s.dict.connection.switchChain
                : agent.isPending
                ? s.dict.createAgent.creating
                : editOf
                ? s.dict.product.save
                : s.dict.createAgent.registerAgent}
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

export default CreateAgentCenter;
